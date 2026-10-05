"""
main.py - OrbitAI Command Intelligence FastAPI Microservice

Serves real-time inference using the PyTorch Bi-LSTM satellite intent model.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

from model_service import model_service
import satintent

app = FastAPI(
    title="OrbitAI Command Intelligence Microservice",
    description="High-precision satellite intent classification and compound-command analysis using trained Bi-LSTM neural networks.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend mission-control console
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommandRequest(BaseModel):
    text: str = Field(..., description="Natural language satellite telecommand or inquiry", example="send telemetry data")


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Single or compound satellite telecommand string", example="switch to safe mode and send high priority telemetry data")
    threshold: Optional[float] = Field(0.5, ge=0.0, le=1.0, description="Confidence threshold for multi-intent detection")


class PredictResponse(BaseModel):
    text: str
    intent: str
    confidence: float
    probabilities: Dict[str, float]
    model_type: str
    classes: List[str]


class ClauseAnalysis(BaseModel):
    text: str
    top: str
    confidence: float
    probabilities: Dict[str, float]


class AnalyzeResponse(BaseModel):
    text: str
    intents: List[str]
    primary_intent: str
    confidence: float
    whole_probabilities: Dict[str, float]
    clauses: List[ClauseAnalysis]
    threshold: float
    model_status: str
    model_architecture: str


@app.get("/")
def get_root():
    return {
        "service": "OrbitAI Command Intelligence",
        "system": "Satellite Mission Control Telecommand Processor",
        "api_status": "ONLINE",
        "model_status": "ACTIVE" if model_service.is_loaded else "ERROR",
        "supported_intents": satintent.INTENTS,
        "docs_url": "/docs",
    }


@app.get("/status")
@app.get("/health")
def get_health():
    """
    Returns API and model status.
    """
    status = model_service.get_status()
    return {
        "api_status": "ONLINE",
        "status": "healthy" if status["loaded"] else "degraded",
        "model_status": status["model_status"],
        "model_type": status["model_type"],
        "vocabulary_size": status["vocabulary_size"],
        "supported_intents": status["supported_intents"],
        "error": status["error"],
    }


@app.post("/predict", response_model=PredictResponse)
def predict_intent(request: CommandRequest):
    """
    Predict satellite command intent and confidence using the trained Bi-LSTM model.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Command text cannot be empty.")
    
    try:
        return model_service.predict(request.text.strip())
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_command(request: AnalyzeRequest):
    """
    Perform compound-command clause analysis and multi-intent detection using the trained Bi-LSTM model.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Command text cannot be empty.")

    try:
        return model_service.analyze(request.text.strip(), threshold=request.threshold or 0.5)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
