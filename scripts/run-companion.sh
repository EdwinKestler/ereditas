#!/usr/bin/env bash
# Start the Ereditas companion on http://127.0.0.1:8765
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${ROOT}/.venv/bin:${HOME}/.local/bin:${PATH}"
if [[ ! -x .venv/bin/uvicorn ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -e ".[dev]"
fi
exec .venv/bin/uvicorn ereditas.companion:app --host 127.0.0.1 --port 8765
