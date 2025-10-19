# Pathfinder Cognito

## Frontend (Vite + React + TS)

Install and run:

```sh
npm i
npm run dev
```

## Backend (FastAPI)

A Python FastAPI backend powers:

- CAT (computerized adaptive testing) for career/academic blocks
- Adaptive routing in the academic block
- Dynamic O*NET-based recommendations

### Setup

1. Install Python 3.10+
2. Create venv and install requirements:

```sh
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r backend/requirements.txt
```

3. Run server:

```sh
uvicorn backend.main:app --reload --port 8000
```

4. Open API docs at `/docs`.

### Environment

Create `.env` (repo root):

```
ONET_API_KEY=your_onet_key
BACKEND_PORT=8000
BACKEND_HOST=127.0.0.1
```

### Key Endpoints

- POST `/api/session/start`
- POST `/api/cat/next`
- POST `/api/cat/submit`
- POST `/api/assessment/finalize`
- POST `/api/recommendations`

See `backend/main.py` for details.
