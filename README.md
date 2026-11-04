# Ereditas

Local workspace for the Grok project idea at
[grok.com/project/571a21c7-4a9d-42d9-8706-9e5c51dd6e7f](https://grok.com/project/571a21c7-4a9d-42d9-8706-9e5c51dd6e7f?tab=conversations).

Product: a liveness-gated digital estate companion. Idea:
[`ideas/ereditas.md`](ideas/ereditas.md). How to run:
[`docs/companion.md`](docs/companion.md). White paper:
[`docs/Ereditas-White-Paper.pdf`](docs/Ereditas-White-Paper.pdf). Hackathon
notes: [`docs/hackathon.md`](docs/hackathon.md). Doc index:
[`docs/README.md`](docs/README.md). Public GitHub:
[EdwinKestler/ereditas](https://github.com/EdwinKestler/ereditas)
(PolyForm Noncommercial).

## Companion

Two processes. Python owns the algorithms and Meta Model API. The judge UI is
the Pure Minimal Grok shell.

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env   # fill locally; never commit
.venv/bin/pytest
./scripts/run-companion.sh
```

Second terminal:

```bash
cd grok_mvp/Ereditas/grok-workspace && npm install && npm run dev
```

Open **http://127.0.0.1:8080**. Vite proxies `/api` and `/static` to FastAPI
on `:8765`. Pulse, Watch, Circle, Vault, Wishes. The ring is a watch index.
Release requires a human **passed**. Demo owner: Elena Reyes.

The bundled Spanish voice notes live under `apps/companion/static/voice/`.
They are offline TTS fixtures for the demo. Edwin can replace them with real
recordings while keeping the `ana-passed.wav` and `ana-unsure.wav` filenames;
use mono 16-bit PCM WAV at 16 kHz or 24 kHz so the live Muse Voice Transcribe
file endpoint accepts them without conversion.

The FastAPI HTML at http://127.0.0.1:8765 still serves the five theme cards.

## Palimnex

Palimnex 2.9.0 is the repository-local memory layer for humans and coding
agents. Search it for methods, examples, tools, and guidelines instead of
rereading the whole tree.

```bash
./scripts/palimnex-setup.sh
palimnex status
palimnex search "ereditas" --limit 8
```

Operator notes: `docs/palimnex.md`. Agent skill: `.agents/skills/source-cache/SKILL.md`.

## ECC workflow skills

A thin ECC v2.2.3 skill pack lives under `.agents/skills/` (search-first,
plan-canvas, tdd-workflow, security-review, security-scan, safety-guard,
codebase-onboarding). Palimnex remains the memory layer. Notes: `docs/ecc.md`.

```bash
npx ecc-agentshield@1.6.0 scan --path /media/kestl/andor/github/ereditas
```

## Layout

| Path | What belongs here |
| --- | --- |
| `ideas/` | Product proposals (local authority) |
| `docs/` | Operator notes, Palimnex, ECC, TDD evidence |
| `docs/plans/` | Human-reviewed plan artifacts |
| `src/ereditas/` | Algorithms, Meta stack, FastAPI |
| `tests/` | pytest (`EREDITAS_OFFLINE=1`) |
| `apps/companion/static/` | Memorial images, theme cards, older HTML UI |
| `grok_mvp/Ereditas/grok-workspace/` | Pure Minimal React shell (`:8080`) |
| `scripts/` | Palimnex setup and `run-companion.sh` |
| `.agents/skills/` | Palimnex skill plus vendored ECC skills |
| `.palimnex.json` | Palimnex project config (commit this) |
| `.palimnex/` | Runtime ledger and Redis (gitignored) |
| `.ecc/` | ECC Memory Vault if ever opted in (gitignored) |
| `AGENTS.md` | Instructions for coding agents |
| `LICENSE` | PolyForm Noncommercial 1.0.0 © 2026 Edwin Kestler |

## License

Original Ereditas code is [PolyForm Noncommercial 1.0.0](LICENSE) © 2026
Edwin Kestler. Personal, research, hobby, school, charity, and government use
is allowed. Commercial use needs a separate grant. Notes:
[`docs/license.md`](docs/license.md).

Vendored ECC skills under `.agents/skills/` remain MIT © 2026 Affaan Mustafa;
see [`.agents/skills/NOTICE.md`](.agents/skills/NOTICE.md).

## Source

Public GitHub: https://github.com/EdwinKestler/ereditas

Project explainer (not the live demo): https://edwinkestler.github.io/ereditas/

Grok project (login required):
https://grok.com/project/571a21c7-4a9d-42d9-8706-9e5c51dd6e7f?tab=conversations
