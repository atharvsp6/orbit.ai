# Command Priority Microservice 🛰️

Part of the **OrbitAI** distributed architecture. Evaluates operational telecommand priority using transparent, deterministic rules.

## Priority Logic

- **CRITICAL** (Score 90–100): Emergency, safe mode, collision avoidance, critical failure, immediate execution.
- **HIGH** (Score 70–89): Urgent transmission, important telemetry, security-related commands, high priority queue.
- **MEDIUM** (Score 40–69): Nominal telemetry requests, mode changes, regular data transmission.
- **LOW** (Score 10–39): Routine status reports, housekeeping and non-urgent background data.

## Endpoints

- `GET /health`: Health check endpoint.
- `POST /priority`: Accepts `{"command": "...", "intent": "..."}` and returns priority level, 0–100 score, and operational reason.

## How to Run

```bash
cd priority-service

# Activate virtual environment
source ../backend/venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run service on port 8002
uvicorn main:app --reload --port 8002
```

Swagger API documentation available at `http://localhost:8002/docs`.
