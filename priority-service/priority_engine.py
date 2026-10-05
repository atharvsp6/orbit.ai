"""
priority_engine.py - Deterministic Rule Engine for Telecommand Priority

Evaluates command text and detected intent to assign operational priority,
numerical priority score (0-100), and human-readable operational justification.
"""

from typing import Tuple, Dict, Any

# Keyword taxonomy for priority categorization
CRITICAL_KEYWORDS = [
    "emergency", "safe mode", "collision", "critical failure", "critical",
    "immediate", "abort", "hazard", "anomaly", "tumble", "loss of signal",
    "safehold", "shut down now", "isolate"
]

HIGH_KEYWORDS = [
    "urgent", "important", "high priority", "security", "authenticate",
    "override", "priority", "critical telemetry", "re-authenticate",
    "encryption", "key rotation", "expedite"
]

LOW_KEYWORDS = [
    "routine", "housekeeping", "non-urgent", "periodic", "background",
    "log dump", "archive", "ping", "diagnostic summary", "report"
]


def evaluate_priority(command: str, intent: str) -> Dict[str, Any]:
    """
    Evaluates command text and intent using deterministic aerospace priority rules.

    Priority Levels:
    - CRITICAL (Score 90-100): emergency, safe mode, collision, critical failure, immediate
    - HIGH     (Score 70-89):  urgent transmission, important telemetry, security-related commands
    - MEDIUM   (Score 40-69):  normal telemetry requests, mode changes, regular data transmission
    - LOW      (Score 10-39):  routine status reports, housekeeping and non-urgent data
    """
    text_lower = command.lower()
    intent_upper = (intent or "").upper().strip()

    # Rule 1: CRITICAL Checks
    for kw in CRITICAL_KEYWORDS:
        if kw in text_lower:
            score = 95
            if "collision" in text_lower or "abort" in text_lower:
                score = 100
            elif "immediate" in text_lower or "emergency" in text_lower:
                score = 98

            reason = f"Command specifies '{kw}', indicating time-critical spacecraft protection or emergency intervention."
            if "safe mode" in text_lower:
                reason = "Spacecraft safe mode execution requires immediate flight computer interrupt and attitude hold."
            elif "emergency" in text_lower:
                reason = "Emergency telecommand requires preemptive execution and immediate ground telemetry verification."

            return {
                "priority": "CRITICAL",
                "score": score,
                "reason": reason
            }

    # Rule 2: HIGH Checks
    for kw in HIGH_KEYWORDS:
        if kw in text_lower:
            return {
                "priority": "HIGH",
                "score": 80,
                "reason": f"Command flagged with '{kw}', elevating transmission queue priority above routine ground passes."
            }

    if intent_upper == "DATA_PRIORITY":
        return {
            "priority": "HIGH",
            "score": 75,
            "reason": "Direct telecommand buffer priority modification scheduled for prioritized uplink/downlink."
        }

    # Rule 3: LOW Checks
    for kw in LOW_KEYWORDS:
        if kw in text_lower and intent_upper in ["STATUS_REPORT", ""]:
            return {
                "priority": "LOW",
                "score": 20,
                "reason": f"Housekeeping routine ('{kw}') queued during nominal pass window with no flight impact."
            }

    if intent_upper == "STATUS_REPORT":
        return {
            "priority": "LOW",
            "score": 25,
            "reason": "Routine system health and diagnostic reporting scheduled as non-interrupting background task."
        }

    # Rule 4: MEDIUM (Default for nominal telemetry, regular transmission, standard mode changes)
    score = 55
    if intent_upper == "MODE_SWITCH":
        score = 65
        reason = "Spacecraft subsystem mode change scheduled within nominal flight operational tolerances."
    elif intent_upper == "DATA_TRANSMISSION":
        score = 60
        reason = "Standard payload data transmission scheduled for upcoming ground station pass."
    elif intent_upper == "TELEMETRY_REQUEST":
        score = 50
        reason = "Standard subsystem telemetry polling processed through regular telecommand queue."
    else:
        score = 45
        reason = "Standard operational telecommand scheduled with standard ground station dispatch priority."

    return {
        "priority": "MEDIUM",
        "score": score,
        "reason": reason
    }
