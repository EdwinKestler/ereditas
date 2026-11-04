# TDD evidence — guided demo 0.2.0

Source: Edwin's explicit 2026-11-04 13:05 GT GO and the guided-demo brief. The
orchestrator owns commit, push, deployment, and live acceptance.

## Journeys

- As a hackathon judge on desktop, I see the real companion inside an iPhone
  frame beside a short guide.
- As a judge on mobile, I keep the full-screen app and can open a guide drawer
  above the tab bar without horizontal overflow.
- As a judge, I can use either guide actions or in-app controls and the guide
  follows the backend snapshot.
- As Ana, tapping either voice-note path starts audio during the user gesture,
  before transcription and interpretation finish.
- As a judge, I can explore passed, unsure, and alive branches, go Back without
  replaying voice, or Start over.

## RED

The guide-state and replay tests were added before the guide module:

```text
node --experimental-strip-types --test src/app/guide.test.ts
ERR_MODULE_NOT_FOUND: Cannot find module 'src/app/guide.ts'
1 failed
```

The failure was the intended missing pure implementation, not a test setup or
syntax failure. No checkpoint commit was made because the orchestrator owns Git.

## GREEN

```text
node --experimental-strip-types --test src/app/session.test.ts src/app/guide.test.ts
12 passed

npm run typecheck
PASS

npm run build
PASS

EREDITAS_OFFLINE=1 .venv/bin/pytest -q
51 passed
```

The broader App Builder template command reached 189/197 passing tests. Its
eight failures are existing `grok-pwa-plugin.test.mjs` expectations around the
baked Ereditas share-card identity; none touch the companion mapper, guide,
bezel, audio, or backend. The focused mapper and guide suites above are green.

## Test specification

| # | Guarantee | Evidence | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | Fresh, one-day, two-day, scanned, worked, and messaged snapshots map to the expected guide step | `guide.test.ts` · `guideStep` | unit | PASS |
| 2 | Passed, unsure, and alive snapshots select the correct branch | `guide.test.ts` · answer branches | unit | PASS |
| 3 | Back reconstructs the previous backend state from reset | `guide.test.ts` · `backReplayPlan` | unit | PASS |
| 4 | Back from any answer/release view returns to step 5 and never replays voice | `guide.test.ts` · answered views | unit | PASS |
| 5 | Existing snapshot mappers, gates, grants, and voice badge remain green | `session.test.ts` | unit | PASS |
| 6 | The browser requests Ana's WAV and shows the playback stage while `/api/voice-answer` is deliberately held | `node scripts/guide-qa.mjs` | browser | PASS |
| 7 | Desktop and mobile have no console/page errors or horizontal overflow | `node scripts/guide-qa.mjs` | browser | PASS |
| 8 | Backend behavior remains unchanged under offline tests | `EREDITAS_OFFLINE=1 .venv/bin/pytest -q` | integration | PASS |

No JavaScript coverage reporter is configured. The new pure state machine is
exercised across all requested snapshot shapes, while component behavior is
covered by the local Playwright path.

## Browser evidence

Local FastAPI `:8765` plus Vite `:8080`, captured at 1440×900 and 390×844:

- `live/guide-desktop-step1.png`
- `live/guide-desktop-step3.png`
- `live/guide-desktop-step5.png`
- `live/guide-desktop-step7a.png`
- `live/guide-mobile-collapsed.png`
- `live/guide-mobile-open.png`

Every desktop capture reported `scrollWidth = clientWidth = 1440`; both mobile
captures reported `scrollWidth = clientWidth = 390`. The screenshot path used a
normal passed answer after separately verifying gesture-time audio, avoiding a
second paid voice-model call during layout QA.

## Known live checks

Local QA proves the shell, public bezel asset, immediate audio request, loading
state, and backend contract. After deployment, verify that `/bezel/iphone16-silver.png`
returns 200 from the React origin, both `/static/voice/*.wav` clips play, and the
live Meta voice chain completes before recording the demo.
