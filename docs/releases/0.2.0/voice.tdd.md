# TDD evidence — voice answer 0.2.0

Source: Edwin's explicit 2026-11-04 GO and the voice-answer feature brief. No
plan-canvas artifact was used because the brief supplied the acceptance criteria
and reserved the branch commit for the orchestrator.

## Journeys

- As Ana, I can answer the open confirmation tree with a Spanish voice note.
- As the system, I transcribe only bundled clips and interpret them fail-closed.
- As an heir, a clear `passed` voice answer releases only Drive and Facebook.
- As an operator, I can still use the existing tap answers and replace the TTS
  fixtures with real WAV recordings.

## RED

Focused Python command:

```text
EREDITAS_OFFLINE=1 .venv/bin/pytest -q tests/test_meta.py tests/test_demo.py tests/test_api.py
9 failed, 11 passed
```

The failures were the intended missing `MetaStack.transcribe()`,
`MetaStack.interpret_confirmation()`, `DemoSession.voice_answer()`, and 404
voice endpoint behavior. Mapper RED was the intended missing export:

```text
node --experimental-strip-types --test src/app/session.test.ts
SyntaxError: './session.ts' does not provide an export named 'canVoiceAnswer'
```

No production code was changed before those RED results.

## GREEN

```text
EREDITAS_OFFLINE=1 .venv/bin/pytest -q
40 passed

node --experimental-strip-types --test src/app/session.test.ts
6 tests passed

npm run typecheck
PASS

npm run build
PASS
```

Isolated runtime QA on ports 8766/8082 left the parallel main processes
untouched. Desktop 1280×800 and mobile 390×844 each rendered one playable
audio element and the PASSED model-chain badge with no horizontal overflow,
console errors, or page errors. The WAV returned HTTP 200/206 as expected.

Coverage:

```text
EREDITAS_OFFLINE=1 .venv/bin/pytest -q --cov=ereditas --cov-report=term-missing
40 passed; total coverage 85%
```

## Test specification

| # | Guarantee | Test | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | Offline transcription returns the deterministic Spanish mock | `test_offline_transcribe_uses_deterministic_spanish_mock` | unit | PASS |
| 2 | Live transcription uses Meta's multipart `request` + `audio` wire shape | `test_live_transcribe_uses_documented_meta_multipart_shape` | unit | PASS |
| 3 | Ambiguous and hedged transcripts become `unsure` | `test_offline_interpretation_is_fail_closed_for_ambiguous_and_hedged_text` | unit | PASS |
| 4 | Malformed model JSON becomes `unsure` | `test_interpretation_malformed_model_json_is_unsure` | unit | PASS |
| 5 | A closed tree refuses voice answers | `test_voice_answer_refused_while_tree_is_closed` | unit/API | PASS |
| 6 | Unknown and traversal-like clip IDs never resolve to paths | `test_unknown_voice_clip_is_refused_without_resolving_a_path`, `test_voice_answer_closed_tree_and_unknown_clip_are_refused` | security/API | PASS |
| 7 | A clear passed clip releases exactly Drive and Facebook | `test_passed_voice_releases_exactly_drive_and_facebook` | integration | PASS |
| 8 | The voice snapshot contains no secret needles | `test_voice_answer_snapshot_is_safe_and_releases_only_ordinary_scopes` | security/API | PASS |
| 9 | React maps voice availability and the model-chain badge | `voiceBadge`, `gates` in `session.test.ts` | mapper | PASS |

## Known gap and handoff

Tests force `EREDITAS_OFFLINE=1`; they do not prove a paid Meta request. After
merge, the orchestrator must run both bundled WAV files with the configured
Model API key and verify the live transcript, strict Muse Spark JSON response,
`source` fields, and Fly-served audio. No checkpoint commit was created; the
orchestrator owns the branch commit and merge.
