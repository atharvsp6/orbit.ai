# Satellite Health Monitoring Microservice 🛰️

Part of the **OrbitAI** distributed architecture. This service runs independently from the Intent Recognition service and provides real-time satellite telemetry metrics and health diagnostics.

## Features
- Real-time simulated telemetry for `SAT-01`:
  - **Battery (%)**
  - **Temperature (°C)**
  - **Signal Strength (%)**
  - **Storage Used (%)**
  - **Overall Status:** `HEALTHY` / `WARNING` / `CRITICAL`
- Automatic rule evaluation:
  - `Temperature > 70°C` → **CRITICAL**
  - `Battery < 20%` → **WARNING**
  - `Signal < 30%` → **WARNING**
  - `Storage > 90%` → **WARNING**
  - Otherwise → **HEALTHY**

## Endpoints

- `GET /health`: Microservice health check
- `GET /satellite/status`: Returns current satellite subsystem health

## How to Run

```bash
cd health-service

# Create virtual environment (or use existing)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run service on port 8001
uvicorn main:app --reload --port 8001
```

Swagger API documentation available at `http://localhost:8001/docs`.
