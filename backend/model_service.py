"""
model_service.py - Satellite Command Model Service

Loads the trained PyTorch Bi-LSTM satellite intent classifier once at startup
and provides prediction and compound-command analysis interfaces.
"""

import os
from typing import Dict, Any, List, Optional
import satintent

# Default model location: backend/model/intent_model.pt
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "model",
    "intent_model.pt"
)


class ModelService:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.w2i: Optional[Dict[str, int]] = None
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.load()

    def load(self) -> None:
        """Load PyTorch Bi-LSTM model checkpoint once into memory."""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found at: {self.model_path}")
            
            self.model, self.w2i = satintent.load_model(self.model_path)
            self.is_loaded = True
            self.load_error = None
            print(f"[ModelService] Successfully loaded satellite Bi-LSTM model from {self.model_path}")
            print(f"[ModelService] Vocabulary size: {len(self.w2i)}, Target intents: {satintent.INTENTS}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ModelService] Error loading model: {e}")

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict single or primary intent for a command text using the trained Bi-LSTM.
        Returns detected intent, confidence score, and sigmoid probabilities across all 5 classes.
        """
        if not self.is_loaded or self.model is None or self.w2i is None:
            raise RuntimeError(f"Model is not loaded. Error: {self.load_error}")

        probs = satintent.predict(text, self.model, self.w2i)
        # Sort intents by probability
        sorted_intents = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
        top_intent, top_conf = sorted_intents[0]

        return {
            "text": text,
            "intent": top_intent,
            "confidence": round(top_conf, 4),
            "probabilities": {k: round(v, 4) for k, v in probs.items()},
            "model_type": "Bi-LSTM (PyTorch)",
            "classes": satintent.INTENTS,
        }

    def analyze(self, text: str, threshold: float = 0.5) -> Dict[str, Any]:
        """
        Perform compound command analysis using clause splitting and multi-label intent inference.
        """
        if not self.is_loaded or self.model is None or self.w2i is None:
            raise RuntimeError(f"Model is not loaded. Error: {self.load_error}")

        analysis = satintent.analyze(text, self.model, self.w2i, threshold=threshold)

        # Round probabilities for clean JSON serialization
        whole_rounded = {k: round(v, 4) for k, v in analysis["whole"].items()}
        clauses_cleaned = []
        for c in analysis["clauses"]:
            clauses_cleaned.append({
                "text": c["text"],
                "top": c["top"],
                "confidence": round(c["conf"], 4),
                "probabilities": {k: round(v, 4) for k, v in c["probs"].items()}
            })

        # Calculate primary/overall confidence
        top_conf = max(whole_rounded.values()) if whole_rounded else 0.0

        return {
            "text": text,
            "intents": analysis["intents"],
            "primary_intent": analysis["intents"][0] if analysis["intents"] else max(whole_rounded, key=whole_rounded.get),
            "confidence": round(top_conf, 4),
            "whole_probabilities": whole_rounded,
            "clauses": clauses_cleaned,
            "threshold": threshold,
            "model_status": "ACTIVE",
            "model_architecture": "Bi-LSTM Bidirectional Recurrent Neural Network",
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "loaded": self.is_loaded,
            "model_status": "ACTIVE" if self.is_loaded else "OFFLINE",
            "model_type": "Bi-LSTM",
            "vocabulary_size": len(self.w2i) if self.w2i else 0,
            "supported_intents": satintent.INTENTS,
            "model_path": self.model_path,
            "error": self.load_error,
        }


# Singleton service instance loaded once at module import
model_service = ModelService()
