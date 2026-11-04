# Meta Global AI Developer Hackathon — Ereditas

Verified 3 Nov 2026 against the public listing. Submissions due **4 Nov 2026,
9:00 PM ET**.

## Entry

| Field | Value |
| --- | --- |
| Event | [Meta Global AI Developer Hackathon](https://cerebralvalley.ai/e/meta-ai-developer-hackathon) |
| Track | Indie (solo) |
| Theme | Build for Your World |
| Product | Ereditas companion — liveness-gated digital estate |
| Idea | `ideas/ereditas.md` |
| White paper | `docs/Ereditas-White-Paper.pdf` |
| Public GitHub | https://github.com/EdwinKestler/ereditas (PolyForm Noncommercial) |

## Required Meta surfaces in the demo

- Muse Spark 1.3 (`muse-spark-1.3`) via `https://api.meta.ai/v1`
- SAM 3.1 (`sam-3.1`) on circle memorial images
- Optional: Muse Image, Muse Voice Transcribe, Muse Spark Open on Modal

Auth: `META_API_KEY` in local `.env` (gitignored). Template: `.env.example`.
Do not read `.env`. Health reports `meta_configured` as a boolean.

## Local demo (merged)

Operator notes: `docs/companion.md`. Chosen chrome: Pure Minimal Grok shell
at **http://127.0.0.1:8080**, talking to FastAPI `:8765`.

Play: two-day scan keeps the tree closed → worked case opens it → Ana
**passed** releases Drive + Facebook only. Live SAM 3.1 and Muse Spark when
the key is present. TDD: `docs/releases/0.1.0/`.

## Submission artifacts still owed

- Live product URL — https://app.ereditas.com/ (Fly.io; Pure Minimal React shell + FastAPI)
- 3-minute demo video of hackathon-period work
- Cerebral Valley submit form before 4 Nov 9:00 PM ET

Public GitHub is live: https://github.com/EdwinKestler/ereditas.
Project explainer (GitHub Pages, not the live product):
https://edwinkestler.github.io/ereditas/
Licence notes: `docs/license.md`. MIT is not required; the participant guide
only requires a **public** repository.
