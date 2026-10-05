# ORBIT AI 🛰️
### Distributed Satellite Command Intelligence & Telemetry Mesh

OrbitAI is a three-service distributed aerospace architecture with an operator mission-control web console that connects all three microservices simultaneously.

---

## 🏛️ System Architecture

```text
                         React Frontend Console
                        (Port 5173 — Vite + TypeScript)
                       /            |              \
                      ↓             ↓               ↓
            Intent Service   Priority Service   Health Service
              Port 8000         Port 8002         Port 8001
                 ↓                  ↓                 ↓
           Bi-LSTM Model       Rule Engine        Satellite
           (PyTorch)           (Deterministic)   Telemetry
                 ↓                  ↓                 ↓
        5 Spacecraft         LOW / MEDIUM /       Battery, Temp,
          Intents            HIGH / CRITICAL      Signal, Storage
```

---

## 📂 Project Structure

```text
orbit-ai/
│
├── backend/                    # [Microservice 1] Intent Recognition (Port 8000)
│   ├── main.py                 # FastAPI — /health, /predict, /analyze
│   ├── model_service.py        # Singleton model cache
│   ├── satintent.py            # Bi-LSTM architecture + clause parser
│   ├── requirements.txt        # FastAPI, Uvicorn, PyTorch, Pydantic, NumPy
│   └── model/
│       └── intent_model.pt     # Trained PyTorch checkpoint (350 KB)
│
├── health-service/             # [Microservice 2] Satellite Health Monitoring (Port 8001)
│   ├── main.py                 # FastAPI — /health, /satellite/status
│   ├── requirements.txt
│   └── README.md
│
├── priority-service/           # [Microservice 3] Command Priority Engine (Port 8002)
│   ├── main.py                 # FastAPI — /health, /priority
│   ├── priority_engine.py      # Deterministic rule engine (no ML model)
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                   # Mission Control Dashboard (Port 5173)
│   ├── .env                    # VITE_API_URL / VITE_HEALTH_API_URL / VITE_PRIORITY_API_URL
│   └── src/
│       ├── App.tsx             # Full dashboard — all 3 microservices integrated
│       ├── types.ts            # TypeScript interfaces
│       └── index.css           # Dark space HUD, orbital rings, glassmorphism
│
├── DOCUMENTATION.md            # Research & Engineering technical report
└── README.md                   # This file
```

---

## 🚀 How to Run All Services Locally

Open four terminal tabs:

### Terminal 1 — Intent Recognition Microservice (Port 8000)
```bash
cd "/Users/ayush/Desktop/vs code/orbit-ai/backend"
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
> Swagger docs: `http://localhost:8000/docs`

### Terminal 2 — Satellite Health Monitoring Microservice (Port 8001)
```bash
cd "/Users/ayush/Desktop/vs code/orbit-ai/health-service"
source ../backend/venv/bin/activate
uvicorn main:app --reload --port 8001
```
> Swagger docs: `http://localhost:8001/docs`

### Terminal 3 — Command Priority Microservice (Port 8002)
```bash
cd "/Users/ayush/Desktop/vs code/orbit-ai/priority-service"
source ../backend/venv/bin/activate
uvicorn main:app --reload --port 8002
```
> Swagger docs: `http://localhost:8002/docs`

### Terminal 4 — React Mission Control Frontend (Port 5173)
```bash
cd "/Users/ayush/Desktop/vs code/orbit-ai/frontend"
npm install
npm run dev
```
> Open in browser: **`http://localhost:5173`**

---

## 📡 API Reference

### Microservice 1: Intent Recognition (`:8000`)
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/health` | Model status, Bi-LSTM active state, vocab size |
| POST | `/predict` | Single command intent + sigmoid probabilities |
| POST | `/analyze` | Compound command clause split + multi-intent detection |

### Microservice 2: Satellite Health Monitoring (`:8001`)
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/health` | Service status |
| GET | `/satellite/status` | Battery, temperature, signal, storage + HEALTHY/WARNING/CRITICAL |
| GET | `/satellite/status?scenario=critical` | Rule simulation triggers |

### Microservice 3: Command Priority Engine (`:8002`)
| Method | Endpoint | Description |
|:---|:---|:---|
| GET | `/health` | Rule engine status |
| POST | `/priority` | `{command, intent}` → `{priority, score, reason}` |

Priority Rules:
- `CRITICAL` (90–100): emergency, safe mode, collision, critical failure, immediate
- `HIGH` (70–89): urgent, important, security-related, high priority
- `MEDIUM` (40–69): normal telemetry, mode changes, standard transmission
- `LOW` (10–39): routine status reports, housekeeping, background tasks

---

## 🎮 Dashboard Features

1. **Tri-Service Telemetry Bar**: Status indicators for all 3 microservices with live UTC clock.
2. **Satellite Health Panel** (Microservice 2): Battery, temperature, signal, and storage gauges with HEALTHY/WARNING/CRITICAL badge and interactive demo triggers.
3. **Telecommand Console** (Microservice 1): Natural language command input with compound clause breakdown, 5-intent probability spectrum, and threshold slider.
4. **Command Priority Card** (Microservice 3): Automatic pipeline visualization showing `Command → Detected Intent → Priority Level`, animated 0–100 score gauge, and operational rationale.
5. **Raw Telemetry Inspector**: Consolidated JSON from all 3 microservices in one payload.
