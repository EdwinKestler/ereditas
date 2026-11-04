# How to test Ereditas (judges)

**Live companion:** https://ereditas.fly.dev/ · **Explainer:** https://edwinkestler.github.io/ereditas/

Each visitor gets a private demo session; other judges don't see your
changes. **Start fresh** (top right) returns to the beginning at any time.

## The story

Elena Reyes (demo owner) goes quiet. Ereditas notices and gathers evidence,
but it can only *ask*. Ana, her primary heir, answers on WhatsApp with a
voice note. Only her confirmation releases what Elena chose, and nothing
more.

## Two-minute walkthrough

On **Pulse**, the big button is always the next step.

| # | Tab | Press | What to look for |
|---|---|---|---|
| 1 | Pulse | — | Ring **11 · Steady**, tree closed, vault sealed. |
| 2 | Pulse | **Advance one quiet day** ×2 | Device, Meta and $1-heartbeat chips go dark. Nothing unlocks. |
| 3 | Pulse | **Scan news and social** | **Watch** tab: live **SAM 3.1** boxes on a candle, ribbon and lilies in posts from Elena's circle. Evidence score ≈ **6.95%**, under the 20% bar. Tree stays closed; WhatsApp is refused. |
| 4 | Pulse | **Run the worked case** | 10 silent days, missed heartbeat, obituary, 3 memorial posts → ≈ **95.98%**. The tree opens: Ereditas may now *ask*, nothing more. |
| 5 | Circle | **Send WhatsApp to Ana** | The thread appears. |
| 6 | Circle | **Try the unsure voice note** | Ana's recording: "No sé, no he podido hablar con ella desde el martes." **Muse Voice Transcribe** → **Muse Spark 1.3** → **UNSURE**. Escalates; nothing is released. |
| 7 | Circle | **Ana sent a voice note** | "Hola, soy Ana… Elena falleció anoche." → **PASSED**. Muse Spark writes Ana a letter. |
| 8 | Vault | — | **Drive + Facebook** released as 30-minute `ereditas://grant/` links. **Wallet + bank on Hold** for a second confirmer. No passwords anywhere. |
| 9 | Wishes | — | Released wishes checked off. |

The tap answers (*she is well / not sure / she has passed*) do the same
without audio. *She is well* resets the watch.

## What is live and what is simulated

| Live (Meta Model API) | Simulated in the demo |
| --- | --- |
| SAM 3.1 on memorial photos | Phone, Meta-session and heartbeat signals |
| Muse Voice Transcribe on Ana's voice notes | The WhatsApp thread (no real messages are sent) |
| Muse Spark 1.3 reading the reply and writing the heir letter | Google Password Manager sync and grant links |

## API check (optional)

```bash
U=https://ereditas.fly.dev; J='-c /tmp/ered.jar -b /tmp/ered.jar'
curl -s $J -X POST $U/api/reset >/dev/null
curl -s $J -X POST $U/api/advance -H 'Content-Type: application/json' -d '{"days":2}' >/dev/null
curl -s $J -X POST $U/api/scan        | jq '{tree_open, posterior}'   # false, ~6.95
curl -s $J -X POST $U/api/worked-case | jq '{tree_open, posterior}'   # true, ~95.98
curl -s $J -X POST $U/api/message >/dev/null
curl -s $J -X POST $U/api/voice-answer -H 'Content-Type: application/json' \
  -d '{"who":"Ana","clip":"ana-passed"}' \
  | jq '{answer: .voice.interpreted, transcript: .voice.transcript, released: [.grants[]|select(.released)|.id]}'
```

The cookie jar (`-c/-b`) keeps your requests in one private session.

## Run it locally

See [`companion.md`](companion.md): FastAPI on `:8765`, React shell on
`:8080`, `META_API_KEY` in a local `.env`. Without a key the app runs
deterministic offline mocks. Tests: `EREDITAS_OFFLINE=1 .venv/bin/pytest -q`.
