import re
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence

INTENTS = ["TELEMETRY_REQUEST", "DATA_TRANSMISSION", "MODE_SWITCH", "DATA_PRIORITY", "STATUS_REPORT"]
MAX_LEN = 48          # raised from 20 so long compound commands are not truncated
PAD, UNK = 0, 1


def tokenize(text):
    # keep hyphens for satellite terms (S-band, X-band, low-power)
    return re.findall(r"[a-z0-9\-]+", text.lower())


def encode(text, w2i, max_len=MAX_LEN):
    ids = [w2i.get(t, UNK) for t in tokenize(text)][:max_len]
    return ids + [PAD] * (max_len - len(ids))


class IntentRNN(nn.Module):
    def __init__(self, vocab_size, emb=64, hid=64, n_cls=len(INTENTS)):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, emb, padding_idx=PAD)
        self.rnn = nn.LSTM(emb, hid, batch_first=True, bidirectional=True)
        self.drop = nn.Dropout(0.3)
        self.fc = nn.Linear(2 * hid, n_cls)

    def forward(self, x):
        lengths = (x != PAD).sum(1).clamp(min=1).cpu()
        packed = pack_padded_sequence(self.emb(x), lengths, batch_first=True, enforce_sorted=False)
        _, (h, _) = self.rnn(packed)
        feat = torch.cat([h[0], h[1]], dim=1)  # forward + backward final states
        return self.fc(self.drop(feat))


def load_model(path="intent_model.pt"):
    ck = torch.load(path, map_location="cpu")
    model = IntentRNN(len(ck["w2i"]))
    model.load_state_dict(ck["state"])
    model.eval()
    return model, ck["w2i"]


@torch.no_grad()
def predict(text, model, w2i):
    """Independent sigmoid probability per intent (multi-label)."""
    x = torch.tensor([encode(text, w2i)])
    probs = torch.sigmoid(model(x))[0].tolist()
    return dict(zip(INTENTS, probs))


# ---------------------------------------------------------------------------
# Multi-intent (compound command) support
# ---------------------------------------------------------------------------
_SPLIT_RE = re.compile(
    r"(\s*;\s*|\s*,?\s+(?:and\s+also|and\s+then|as\s+well\s+as|after\s+that|and|then|while|also|plus)\s+)",
    re.IGNORECASE,
)
MIN_CLAUSE_TOKENS = 3   # a split is only accepted if BOTH sides have >= 3 tokens
                        # (so "current and voltage" is NOT split)


def split_clauses(text):
    """Split a compound command into clauses on ; / and / then / while / also / plus ..."""
    text = text.strip()
    if not text:
        return []
    parts = _SPLIT_RE.split(text)          # [clause, sep, clause, sep, clause ...]
    clauses = [parts[0]]
    for i in range(1, len(parts), 2):
        sep, nxt = parts[i], parts[i + 1]
        need = 2 if ";" in sep else MIN_CLAUSE_TOKENS   # ';' is an unambiguous separator
        if len(tokenize(clauses[-1])) >= need and len(tokenize(nxt)) >= need:
            clauses.append(nxt)
        else:                                # too short -> glue back together
            clauses[-1] += sep + nxt
    out = []
    for c in clauses:
        c = c.strip().strip(",;").strip()
        if c:
            out.append(c[0].upper() + c[1:])
    return out


def analyze(text, model, w2i, threshold=0.5):
    """
    Full multi-intent analysis.
      whole   : sigmoid probabilities for the entire sentence
      clauses : each clause classified on its own (top-1 intent + confidence)
      intents : final ordered, de-duplicated list of detected intents
                = clause intents (in the order spoken) + whole-sentence intents >= threshold
    """
    whole = predict(text, model, w2i)
    whole_active = [k for k, v in sorted(whole.items(), key=lambda kv: -kv[1]) if v >= threshold]

    clauses = []
    for c in split_clauses(text):
        p = predict(c, model, w2i)
        top = max(p, key=p.get)
        clauses.append({"text": c, "probs": p, "top": top, "conf": p[top]})

    clause_intents = [c["top"] for c in clauses if c["conf"] >= threshold] if len(clauses) > 1 else []
    merged = []
    for i in clause_intents + whole_active:
        if i not in merged:
            merged.append(i)
    if not merged:                                   # always return at least one intent
        merged = [max(whole, key=whole.get)]
    return {"text": text, "whole": whole, "clauses": clauses, "intents": merged}
