#!/usr/bin/env bash
# Start this repository's Palimnex cache and durable ledger. Idempotent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.local/bin:${PATH}"
export PALIMNEX_ROOT="$ROOT"
cd "$ROOT"

if ! command -v palimnex >/dev/null; then
  echo "palimnex is not on PATH. Install 2.9.0:" >&2
  echo "  pipx install --force 'palimnex[crypto,mcp]==2.9.0'" >&2
  exit 1
fi

if [[ ! -f "$ROOT/.palimnex.json" ]]; then
  echo "missing .palimnex.json; run palimnex init --write --slug ereditas" >&2
  exit 1
fi

palimnex redis start
if ! palimnex index --incremental; then
  echo "incremental index failed; rebuilding the disposable Redis cache"
  palimnex redis reset
  palimnex redis start
  palimnex index --incremental
fi
palimnex validate --deep

if ! palimnex ledger-status; then
  palimnex ledger-init
  palimnex ledger-status
fi

set +e
palimnex doctor
doctor_rc=$?
set -e
if [[ "$doctor_rc" -ne 0 && "$doctor_rc" -ne 2 ]]; then
  exit "$doctor_rc"
fi
echo
echo "Search: palimnex search \"ereditas\" --limit 8"
echo "Docs:   docs/palimnex.md"
