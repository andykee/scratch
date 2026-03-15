#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "→ Setting up Python virtual environment…"

if [ ! -d "$ROOT/backend/.venv" ]; then
  python3 -m venv "$ROOT/backend/.venv"
fi

"$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"

echo "→ Starting backend on :8000"
PYTHONPATH="$ROOT" "$ROOT/backend/.venv/bin/uvicorn" backend.main:app \
  --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "→ Installing frontend dependencies…"
cd "$ROOT/frontend"
npm install --silent

echo "→ Starting frontend on :5173"
npm run dev &
FRONTEND_PID=$!

# ── Cleanup ───────────────────────────────────────────────────────────────────
trap "echo '→ Shutting down…'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Swagger:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

wait
