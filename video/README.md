# Ereditas demo video

This folder captures the six approved hackathon scenes from the public explainer and live companion. Generated frames and media stay under the gitignored `video/out/`; local narration stays under the gitignored `video/voice/`.

## Capture the visuals

Requirements: `google-chrome`, Node 24+, FFmpeg/FFprobe, and network access to `ereditas.com` and `app.ereditas.com`.

```bash
node video/capture.mjs
```

The capture uses a fresh temporary Chrome profile, a 1920×1080 viewport at device scale 1, CDP `Page.startScreencast`, the public app's real Meta calls, and a final same-session `POST /api/reset`. It writes `scene-s1.mp4` through `scene-s6.mp4`, `scenes.json`, and `contact-sheet.png` to `video/out/`.

## Add Edwin's narration

Put one file per scene in `video/voice/`. Accepted names are `s1.m4a`, `s1.mp3`, `s1.wav`, or `s1.ogg`, continuing through `s6.*`. If more than one extension exists for a scene, the order just listed wins.

Then run:

```bash
./video/assemble.sh
```

The assembler normalizes narration to -16 LUFS, holds the final visual frame when narration is longer, preserves Ana's real audio in scene 5, adds silent audio for missing narration, and exports `video/out/ereditas-demo.mp4`. It warns when the result exceeds 178 seconds.

To rebuild the silent review draft explicitly:

```bash
./video/assemble.sh --draft
```
