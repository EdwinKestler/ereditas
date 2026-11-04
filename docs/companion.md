# Companion — operator notes

Chosen judge UI: the Pure Minimal Grok shell on **http://127.0.0.1:8080**.
Python FastAPI on **http://127.0.0.1:8765** owns Algorithm 1, Algorithm 2,
SAM 3.1, Muse Voice Transcribe, and Muse Spark 1.3. Product idea:
`ideas/ereditas.md`. TDD: `docs/releases/0.1.0/` and
`docs/releases/0.2.0/voice.tdd.md`.

## Two processes

| Process | Path | Port | Job |
| --- | --- | --- | --- |
| FastAPI | `./scripts/run-companion.sh` | `127.0.0.1:8765` | `DemoSession`, watch posterior, vault, Meta API, memorial images |
| Vite | `grok_mvp/Ereditas/grok-workspace` `npm run dev` | `0.0.0.0:8080` | Pure Minimal React shell (Pulse, Watch, Circle, Vault, Wishes) |

Vite proxies `/api` and `/static` to FastAPI. CORS also allows the Grok origin
so a direct browser call would work. Keep both processes up while the Grok
shell is open. The FastAPI HTML at `:8765` (five CSS themes) is the earlier
static companion; it is not the chosen demo chrome.

`DemoSession` in `src/ereditas/demo.py` is the source of truth. Zustand in
`grok_mvp/Ereditas/grok-workspace/src/app/store.ts` is a thin client.

## Run

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env   # fill locally; never commit; never read .env in Palimnex
./scripts/run-companion.sh
```

Second terminal:

```bash
cd grok_mvp/Ereditas/grok-workspace
npm install
npm run dev
```

Open http://127.0.0.1:8080. Health (booleans and model names only):

```bash
curl -fsS http://127.0.0.1:8080/api/health
```

Reset the current visitor's demo to rest (ring 11, tree closed):

```bash
curl -fsS -X POST http://127.0.0.1:8765/api/reset
```

## Play path (judge)

Demo owner: **Elena Reyes** (persona). Confirmer: **Ana** (primary heir).

1. Pulse at rest: watch index **11**, band **steady**, tree closed.
2. Wait two quiet days, then Scan. Watch paints SAM boxes on candle, ribbon,
   and lilies. Posterior stays under the 20% bar (~6.95%). Tree stays closed.
   WhatsApp is refused.
3. Run the **worked case** (white paper Table 4: 10 silent days, one heartbeat
   miss, obituary, three memorial posts). Tree opens (~95.98%).
4. Circle → Send WhatsApp → **Ana sent a voice note**. Play the note, then use
   it. Muse Voice Transcribe produces the Spanish transcript and Muse Spark
   interprets it as **passed**. The existing tap answers remain available.
5. Vault releases **Drive + Facebook** only (`ereditas://grant/` links, no
   credentials). Wallet and bank stay **Hold** until a second confirmer.
   Wishes check off the released scopes. Muse Spark writes the heir narrative.

The ring is a watch index, not P(death). Silence does not open the vault.
Human **passed** is the only release gate.

## API

All JSON. Snapshot shape is `DemoSession.snapshot()`.

| Method | Path | Effect |
| --- | --- | --- |
| GET | `/api/health` | `ok`, `meta_configured`, model names; no session cookie |
| GET | `/api/state` | current visitor snapshot; creates a session when needed |
| POST | `/api/reset` | reset only the current visitor to rest (Elena, tree closed) |
| POST | `/api/advance` | `{ "days": 1 }` quiet days (1–14) |
| POST | `/api/scan` | news + SAM 3.1 on circle posts |
| POST | `/api/worked-case` | Table 4 episode, then scan |
| POST | `/api/message` | outbound WhatsApp if `tree_open` |
| POST | `/api/answer` | `{ "who": "Ana", "answer": "well\|unsure\|passed" }` |
| POST | `/api/voice-answer` | `{ "who": "Ana", "clip": "ana-passed\|ana-unsure" }`; bundled clips only |
| POST | `/api/theme` | FastAPI static theme only (`midnight` default) |
| GET | `/static/memorial/*.jpg` | SAM source images |
| GET | `/static/voice/*.wav` | bundled Spanish voice-note fixtures |

CORS allowlist: `http://127.0.0.1:8080`, `http://localhost:8080`.

## Visitor sessions

Every `/api/*` route except health resolves an in-memory `DemoSession` from the
`ereditas_sid` cookie. Missing, malformed, expired, and valid-but-unknown IDs
receive a new server-generated `secrets.token_urlsafe(18)` ID; caller-provided
IDs are never adopted as store keys. The cookie is HttpOnly, SameSite=Lax,
Path `/`, has a six-hour Max-Age, and is Secure when the request arrived over
HTTPS (including Caddy/Fly forwarded-proto headers).

Sessions expire after two idle hours. The store holds at most 300 and evicts
the least recently used entry before admitting another. Each session has its
own mutation lock, while every `DemoSession` shares one thread-safe `MetaStack`,
one lazy Meta client, and one SAM segment cache. The store is process-local and
intentionally ephemeral: a process restart starts every visitor at Elena,
ring 11, tree closed. Vite and Caddy forward Cookie and Set-Cookie without
special header rewriting; the React client explicitly uses same-origin
credentials.

## Meta Model API

Live calls when `META_API_KEY` or `MODEL_API_KEY` is set and
`EREDITAS_OFFLINE` is unset. Tests force `EREDITAS_OFFLINE=1` in
`tests/conftest.py` so pytest never hits the live API.

| Model | Id | Use |
| --- | --- | --- |
| Muse Spark 1.3 | `muse-spark-1.3` | confirmation interpretation + heir narrative |
| Muse Voice Transcribe | `muse-voice-transcribe-1.0` | Spanish voice-note transcription |
| SAM 3.1 | `sam-3.1` | noun-phrase segment of memorial objects |

The voice client follows Meta's
[Speech to text documentation](https://dev.meta.ai/docs/speech-to-text):
`POST https://api.meta.ai/v1/asr/transcribe` with multipart `request` JSON and
`audio` WAV parts. The request uses `PUSH_TO_TALK`, `audioEncoding: WAV`, and a
Spanish language bias. Muse Spark uses strict JSON Schema structured output as
documented in [Structured output](https://dev.meta.ai/docs/structured-output).
Python validates the enum, exact object shape, verbatim quote, semantic marker,
and hedging before passing the answer through `DemoSession.answer()`. Any
ambiguous, malformed, fabricated, or hedged result becomes `unsure`.

Offline, unconfigured, or failed live calls use deterministic mock output with
`source: "mock"`. HTTP failures log only the response status, never a key or
response body.

SAM prompt is a noun phrase. Boxes parse from `<|box;x1=…|>` and are stored
as 0–1 fractions. The Grok mapper `boxStyle` turns them into CSS percents.
Mock boxes run when offline or unconfigured.

## Tests

```bash
EREDITAS_OFFLINE=1 .venv/bin/pytest -q --cov=ereditas
cd grok_mvp/Ereditas/grok-workspace
node --experimental-strip-types --test src/app/session.test.ts
```

`companion.py` is omitted from coverage (`pyproject.toml`) because the live
FastAPI process loads `.env`. Snapshot dumps must not contain credentials
(`password` as a secret, `seed phrase`, `meta_api_key`, `hf_token`,
`modal_token`). Copy may mention “Google Password Manager” as the living
source of truth.

## Secrets

- Template: `.env.example`. Runtime: `.env` (gitignored).
- Do not read or write `.env`. Do not put keys in Git or Palimnex payloads.
- Health reports configuration as booleans.

## Layout

| Path | Role |
| --- | --- |
| `src/ereditas/liveness.py` | Algorithm 1, `CALL_THRESHOLD = 0.20` |
| `src/ereditas/vault.py` | Algorithm 2, scoped grants |
| `src/ereditas/confirmation.py` | well / unsure / passed tree |
| `src/ereditas/meta.py` | Muse Spark + SAM 3.1 |
| `src/ereditas/demo.py` | `DemoSession` |
| `src/ereditas/sessions.py` | bounded visitor-session store, TTL, LRU, locks |
| `src/ereditas/companion.py` | FastAPI |
| `apps/companion/static/` | memorial images, five theme cards, older HTML UI |
| `grok_mvp/Ereditas/grok-workspace/src/app/` | Pure Minimal shell |
| `grok_mvp/Ereditas/grok-workspace/src/styles.css` | tokens |
| `grok_mvp/Ereditas/grok-workspace/screenshots/merge/` | Chrome play-loop |

Pure Minimal tokens: paper `#0a0a0a`, card `#141414`, ink `#f7f7f4`, muted
`#bdbdb7`, gold `#c9a227`, IBM Plex Sans, radius `0.75rem`.
