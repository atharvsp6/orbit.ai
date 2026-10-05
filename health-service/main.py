"""
main.py - OrbitAI Satellite Health Monitoring Microservice

Independent FastAPI microservice providing real-time telemetry health status,
subsystem diagnostics, and alert evaluation for orbiting satellites.
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import random
import time
from typing import Optional, List

app = FastAPI(
    title="Satellite Health Monitoring Service",
    description="Real-time satellite subsystem telemetry diagnostics, sensor monitoring, and health status reporting.",
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


class SubsystemHealth(BaseModel):
    satellite_id: str
    battery: float = Field(..., description="Battery state of charge percentage (0-100%)")
    temperature: float = Field(..., description="Core bus temperature in Celsius (°C)")
    signal_strength: float = Field(..., description="RF uplink/downlink signal strength (0-100%)")
    storage_used: float = Field(..., description="On-board solid state recorder usage percentage (0-100%)")
    overall_status: str = Field(..., description="HEALTHY | WARNING | CRITICAL")
    alerts: List[str] = Field(default_factory=list, description="Active status alerts or nominal state")
    timestamp: float = Field(default_factory=time.time, description="Telemetry timestamp")


# Base simulated state that naturally drifts between requests
_state = {
    "battery": 87.4,
    "temperature": 24.5,
    "signal_strength": 92.0,
    "storage_used": 64.2,
}


def _update_simulated_telemetry(scenario: Optional[str] = None):
    """
    Simulate realistic orbital telemetry variations:
    - Solar panels charging / minor battery draw fluctuations (+/- 0.6%)
    - Bus temperature fluctuations (+/- 0.4°C)
    - RF signal propagation jitter (+/- 1.2%)
    - Data recorder read/write drift (+/- 0.3%)
    """
    global _state

    if scenario == "critical":
        return 75.0, 74.5, 88.0, 65.0, ["High bus temperature detected (> 70°C)"]
    elif scenario == "battery_low":
        return 16.5, 23.0, 85.0, 62.0, ["Battery state of charge low (< 20%)"]
    elif scenario == "signal_weak":
        return 85.0, 24.0, 22.0, 64.0, ["RF link margin degraded (< 30%)"]
    elif scenario == "storage_full":
        return 86.0, 24.5, 91.0, 93.5, ["Solid state recorder buffer exceeding capacity (> 90%)"]

    # Natural drift around baseline
    _state["battery"] = max(10.0, min(100.0, _state["battery"] + random.uniform(-0.8, 0.7)))
    _state["temperature"] = max(-10.0, min(85.0, _state["temperature"] + random.uniform(-0.5, 0.5)))
    _state["signal_strength"] = max(5.0, min(100.0, _state["signal_strength"] + random.uniform(-1.5, 1.5)))
    _state["storage_used"] = max(5.0, min(98.0, _state["storage_used"] + random.uniform(-0.4, 0.5)))

    battery = round(_state["battery"], 1)
    temperature = round(_state["temperature"], 1)
    signal = round(_state["signal_strength"], 1)
    storage = round(_state["storage_used"], 1)

    alerts = []
    return battery, temperature, signal, storage, alerts


def evaluate_status(battery: float, temperature: float, signal: float, storage: float, alerts: List[str]) -> str:
    """
    Rule Evaluation:
    * Temperature > 70  -> CRITICAL
    * Battery < 20      -> WARNING
    * Signal < 30       -> WARNING
    * Storage > 90      -> WARNING
    * Otherwise         -> HEALTHY
    """
    if temperature > 70:
        if "High bus temperature detected (> 70°C)" not in alerts:
            alerts.append(f"CRITICAL: Temperature {temperature}°C exceeds 70°C safety ceiling")
        return "CRITICAL"

    warnings = []
    if battery < 20:
        warnings.append(f"WARNING: Battery at {battery}% (< 20%)")
    if signal < 30:
        warnings.append(f"WARNING: RF Signal at {signal}% (< 30%)")
    if storage > 90:
        warnings.append(f"WARNING: Storage usage at {storage}% (> 90%)")

    if warnings:
        alerts.extend(warnings)
        return "WARNING"

    alerts.append("All subsystems operating within nominal limits")
    return "HEALTHY"


@app.get("/")
def get_root():
    return {
        "service": "Satellite Health Monitoring Service",
        "system": "OrbitAI Ground Telemetry Segment",
        "status": "ONLINE",
        "satellite": "SAT-01",
        "docs": "/docs",
    }


@app.get("/health")
def get_service_health():
    """
    Returns whether the Health Monitoring Service is running.
    """
    return {
        "status": "ONLINE",
        "service": "Satellite Health Monitoring Service",
        "satellite_id": "SAT-01",
        "sensor_stream": "ACTIVE",
    }


@app.get("/satellite/status", response_model=SubsystemHealth)
def get_satellite_status(
    satellite_id: str = "SAT-01",
    scenario: Optional[str] = Query(None, description="Optional simulation scenario: 'critical', 'battery_low', 'signal_weak', 'storage_full'")
):
    """
    Returns current satellite subsystem telemetry:
    - Battery percentage
    - Temperature in Celsius
    - Signal strength percentage
    - Storage used percentage
    - Overall status evaluated with safety rules
    """
    battery, temperature, signal, storage, initial_alerts = _update_simulated_telemetry(scenario)
    alerts = list(initial_alerts)
    overall_status = evaluate_status(battery, temperature, signal, storage, alerts)

    return SubsystemHealth(
        satellite_id=satellite_id,
        battery=battery,
        temperature=temperature,
        signal_strength=signal,
        storage_used=storage,
        overall_status=overall_status,
        alerts=alerts,
        timestamp=time.time(),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
