"""
main.py - OrbitAI Command Priority Microservice

FastAPI microservice providing deterministic operational priority evaluation,
numerical ranking, and mission scheduling justification for telecommands.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from priority_engine import evaluate_priority

app = FastAPI(
    title="Command Priority Service",
    description="Deterministic aerospace rule engine for telecommand operational prioritization and scheduling.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PriorityRequest(BaseModel):
    command: str = Field(..., description="Natural language telecommand string", example="Transmit emergency telemetry immediately")
    intent: Optional[str] = Field("DATA_TRANSMISSION", description="Detected intent category from Intent Microservice", example="DATA_TRANSMISSION")


class PriorityResponse(BaseModel):
    priority: str = Field(..., description="LOW | MEDIUM | HIGH | CRITICAL")
    score: int = Field(..., ge=0, le=100, description="Priority score from 0 to 100")
    reason: str = Field(..., description="Operational rationale for priority assignment")


@app.get("/")
def get_root():
    return {
        "service": "Command Priority Service",
        "system": "OrbitAI Telecommand Scheduling Segment",
        "status": "ONLINE",
        "rule_engine": "ACTIVE",
        "docs": "/docs",
    }


@app.get("/status")
@app.get("/health")
def get_health():
    """
    Returns whether the Priority Service is running.
    """
    return {
        "status": "ONLINE",
        "service": "Command Priority Service",
        "rule_engine": "ACTIVE",
        "supported_levels": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    }


@app.post("/priority", response_model=PriorityResponse)
def compute_priority(request: PriorityRequest):
    """
    Evaluates operational priority, score (0-100), and rationale based on command semantics and intent.
    """
    if not request.command or not request.command.strip():
        raise HTTPException(status_code=400, detail="Command text cannot be empty.")

    result = evaluate_priority(request.command.strip(), request.intent or "")
    return PriorityResponse(**result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
