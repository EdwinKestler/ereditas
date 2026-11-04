# Submission kit — Meta Global AI Developer Hackathon

Draft 4 Nov 2026 09:00 GT. Deadline 9:00 PM ET = 8:00 PM GT. Internal cut 6:00 PM GT.
Fill https://app.ereditas.com/ and `VIDEO_URL` once known. Voice-note lines marked [V] ship
only if feat/voice-note merges.

## Links

| Field | Value |
| --- | --- |
| Track / theme | Indie · Build for Your World |
| Live product | https://app.ereditas.com/ |
| Demo video (≤3 min) | VIDEO_URL |
| Source | https://github.com/EdwinKestler/ereditas |
| Explainer | https://ereditas.com/ |

## One-liner

AI agents that carry out your digital will — only after the people you trust confirm you're gone.

## Summary (≈170 words)

In 2008 my father died suddenly. I had to break into his phone to tell his
clients, and into his email to cancel subscriptions and reach the people who
mattered. The legal succession took years; his digital life couldn't wait.

Ereditas is an after-life companion. It watches quiet signals — phone
activity, Meta sessions, a $1 heartbeat. When silence grows, it checks the
world: SAM 3.1 finds memorial objects (candles, ribbons, lilies) in posts
from the owner's registered circle, and a Bayesian update scores the
evidence. Crossing the threshold never unlocks anything; it only opens a
WhatsApp question to trusted people. [V] When Ana answers with a voice note,
Muse Voice Transcribe and Muse Spark 1.3 interpret it — ambiguity escalates,
never releases. Only a confirmed "passed" releases exactly what the owner
chose (Drive, Facebook memorialization); wallet and bank wait for a second
confirmer. Muse Spark then writes the heirs a plain letter.

Built during the hackathon: FastAPI engine, React companion, live Meta Model
API calls, offline test suite, deployed on Fly.io.

## Meta models used

| Model | Id | Job |
| --- | --- | --- |
| SAM 3.1 | `sam-3.1` | Segment memorial objects in circle posts → evidence |
| Muse Spark 1.3 | `muse-spark-1.3` | Heir letter after confirmation; [V] interpret the voice reply |
| [V] Muse Voice Transcribe | see `settings.py` | Transcribe Ana's WhatsApp voice note |

## 3-minute video script

Record on the public LIVE_URL, 1920×1080, browser zoom 110%. Reset first:
`curl -X POST LIVE_URL/api/reset`.

| Time | Screen | Voice-over (Edwin) |
| --- | --- | --- |
| 0:00–0:20 | Black, then site hero | "In 2008 my father died suddenly. I had to break into his phone to tell his clients what happened, and into his email to cancel his subscriptions. The law took years. His digital life couldn't wait." |
| 0:20–0:35 | Site: problem cards → principle | "Every platform has a legacy setting, and no family has time to find them all. Worse, dead-man switches fire on silence. Ereditas follows one rule: signals can ask, only a person can answer." |
| 0:35–0:55 | Live app: Pulse at rest (ring 11) | "This is Elena's companion. The ring measures silence, not death. Her vault is sealed." |
| 0:55–1:25 | Advance 2 days → Scan → Watch with SAM boxes | "Two quiet days. Ereditas checks the world: SAM 3.1 finds a candle, a ribbon and lilies in posts from Elena's circle. The evidence score is about 7% — under the bar. Nothing opens. Even WhatsApp is refused." |
| 1:25–1:45 | Worked case → tree opens (~96%) | "Ten silent days, a missed heartbeat, an obituary, three memorial posts. Now Ereditas may ask — and only ask." |
| 1:45–2:15 | Circle → WhatsApp to Ana → [V] voice note plays, transcript + PASSED badge | "It writes to Ana, Elena's primary heir. [V] Ana answers with a voice note. Muse Voice Transcribe hears it, Muse Spark reads it; if she had hesitated, it would escalate, never release." |
| 2:15–2:40 | Vault: Drive + Facebook released, wallet/bank Hold → Wishes + heir letter | "Only now does the vault move — and only what Elena chose. Drive and Facebook memorialization are released as short-lived grants, no passwords. Wallet and bank wait for a second person. Muse Spark writes Ana a plain letter." |
| 2:40–3:00 | Site: Built on Meta + tests, closing line | "FastAPI, React, live Meta models, tested, built this week. Ereditas: agents that carry out your will when you no longer can — only after the people you trust confirm it." |
