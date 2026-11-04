#!/usr/bin/env bash
# Start the Ereditas companion (loopback by default; containers may override).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${ROOT}/.venv/bin:${HOME}/.local/bin:${PATH}"
HOST="${EREDITAS_HOST:-127.0.0.1}"
if [[ ! -x .venv/bin/uvicorn ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -e ".[dev]"
fi
exec .venv/bin/uvicorn ereditas.companion:app --host "$HOST" --port 8765
