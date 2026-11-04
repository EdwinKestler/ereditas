# Plan: GitHub Pages narrative for judges

Status: drafted 4 Nov 2026 08:10 (GT). Execute only after an explicit go.
Scope: `site/index.html`, `site/script.js`. No layout or style rewrite; copy,
section order, and two new sections that reuse existing classes.

## What judges score (official)

| Criterion | Weight | What the page must show |
| --- | --- | --- |
| Impact | 30% | The human problem, who it hurts, why now |
| Use of Meta AI tooling | 25% | Which Meta models, doing what, visibly |
| Demo | 25% | A live link and a video, above the fold |
| Technical depth | 20% | Algorithms, tests, honest boundaries |

Theme: **Build for Your World** — "solve a problem you know firsthand, free up
time and mental space". Track: Indie (creativity, ambition, does it work).
Deadline: 4 Nov 9:00 PM ET = 8:00 PM Guatemala. Internal cut: 6:00 PM GT.

## Diagnosis

1. No problem statement. The page opens with the mechanism (restraint), so
   Impact (30%) has nothing to score until section 04.
2. Meta models appear only in section 04 and are framed as a limitation
   ("neither model receives release authority").
3. "Not the live product" appears three times (hero, boundary card, footer)
   and there is no demo or video link. That costs Demo (25%).
4. Jargon a skimming judge will not decode: liveness-gated, watch index,
   posterior, policy bar, confirmation tree, Algorithm 1/2, Pure Minimal,
   Grok-built shell, post-mortem.
5. Accuracy: "Muse Spark 1.3 · Orchestration" and stage-02 tag
   "Muse Spark + SAM 3.1" overclaim. In `src/ereditas/meta.py` Muse Spark
   only writes the heir narrative; SAM 3.1 is the only model in Evidence.
6. Theme label missing (only "Indie").

## Copy changes

### Hero
- Eyebrow: `Meta Global AI Developer Hackathon · Build for Your World`
- H1: `Grief shouldn't come with` / `a password reset.` (gold italic on line 2)
- Lede: `When someone dies, the people who loved them inherit a second job:
  locked phones, unknown accounts, subscriptions still billing, photos no one
  can reach. Ereditas prepares that work while you live — and waits for
  someone you trust before it touches anything.`
- CTAs: primary `Watch the 3-minute demo` (video URL), ghost `Try the live
  companion` (live URL), text link `White paper`.
- Drop the "Project explainer — not the live product" pill from the hero.
- Card caption: `This ring measures silence.` / `It never measures death.`

### New section 01 — The problem (reuse `.boundary-grid` cards)
Kicker `01 Why this exists`. H2: `Every platform has a legacy setting.` /
`No family has time to find them all.`
- **Locked out.** Photos, documents and the last messages sit behind logins
  nobody else knows.
- **Still running.** Accounts and subscriptions keep billing and posting
  after the owner is gone.
- **Or triggered too early.** Dead-man switches fire on silence. A lost phone
  or a hospital stay should never hand out your life.
Closing line (needs Edwin's own sentence): `I built Ereditas because …`

### Principle (keep; renumber 02)
Keep `Signals can ask. Only a person can answer.` It is the strongest line.

### Protocol tabs (renumber 03) — plain names first
| Tab | Small label | Tag (was) → (now) |
| --- | --- | --- |
| Notice silence | Phone, Meta, $1 heartbeat | Algorithm 1 → `Silence watch` |
| Check the world | News + memorial posts | Muse Spark + SAM 3.1 → `SAM 3.1 + Bayes update` |
| Ask your people | WhatsApp to Ana | keep |
| Hand over what you chose | Scoped grants | Algorithm 2 → `Scoped release` |
Keep the numbers; rename unit `posterior %` → `evidence score %`.
H2: `Four steps.` / `One human decision.`

### Meta section (move up to 04, before Product)
Kicker `04 Built on Meta`. H2: `Meta's models read the signs.` /
`People make the call.` Three cards (reuse `.flow-node`):
- **SAM 3.1** (`sam-3.1`) — finds candles, ribbons and lilies in posts from
  the owner's registered circle; each find becomes evidence, never a verdict.
- **Muse Spark 1.3** (`muse-spark-1.3`) — after a person confirms, writes the
  heir a plain letter covering only what was released.
- **Meta Model API** — live calls in the demo; offline mocks keep tests
  deterministic.
Flow node 02: `Orchestration · narrative` → `Heir letter`.
Only list Muse Voice Transcribe / Muse Image if they ship today.

### Product (05)
H2 keep. Body: drop "Pure Minimal interface" → `Five calm screens: Pulse,
Watch, Circle, Vault, Wishes.`

### Proof (06)
Body: `Built during the hackathon (26 Oct – 4 Nov): a FastAPI engine, a React
companion, live SAM 3.1 and Muse Spark calls, offline tests and a recorded
browser play-through.` Remove "Grok-built". Stats keep.

### Boundary (07) — positive phrasing, three cards
- `Evidence earns the right to ask.` Not a death certificate.
- `Your password manager stays the source of truth.` Ereditas stores labels
  and grants.
- `WhatsApp carries a question, never a secret.`
Delete the "Not the live product" card.

### Footer
One line: `Hackathon project · not a production estate service.`
Add `Built by Edwin Kestler · Guatemala`.

## Words to retire on judge-facing surfaces

| Retire | Use |
| --- | --- |
| liveness-gated | waits for a person |
| post-mortem agent | after-life companion (post-mortem reads as incident review) |
| posterior / policy bar | evidence score / 20% threshold |
| confirmation tree | ask your people |
| scoped grants | only what you chose |
| Pure Minimal, Grok-built shell | React companion |

## Do not put on the page

Deck figures ($84T "next decade", 78% survey, TAM/SAM/SOM, CAC/LTV). The $84T
figure is a long-horizon US projection, not a decade, and judges score
impact, not market size.

## Verify

Headless Chrome at 1440×900 and 390×844; no horizontal scroll; tabs still
keyboard-navigable; every link resolves; no claim beyond `src/ereditas/`.

## Approved 4 Nov 2026 08:46 GT — additions after Edwin's story

Source: `docs/founder-story.md`.

1. New section right after the problem cards, kicker `Why I built this`:
   the short quote from `docs/founder-story.md`, verbatim, attributed
   `Edwin Kestler`. Reuse the `.principle` typography (large serif italic).
2. Meta section gets a lead paragraph from "Why Meta" in the founder story:
   memorial posts on Facebook and Instagram are the evidence; WhatsApp is
   where real people confirm. H2 stays `Meta's models read the signs.` /
   `People make the call.`
3. Boundary section kicker becomes `What we protect` with the four values
   named once: confidentiality · security · transparency · delivery.
4. Closing line: `AI agents that carry out your will when you no longer
   can — only after the people you trust confirm it.`
5. Demo CTAs: hrefs `#DEMO_VIDEO_URL` and `#LIVE_URL` as literal
   placeholders (orchestrator fills them). Add `data-placeholder` attribute.
