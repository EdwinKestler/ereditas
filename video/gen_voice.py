"""Generate the six narration clips with ElevenLabs. Reads ELEVENLABS_API_KEY from env; never prints it.

Usage: (set -a; . ./.env; set +a; python3 -I video/gen_voice.py [voice_id])
"""
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

VOICE = sys.argv[1] if len(sys.argv) > 1 else "cjVigY5qzO86Huf0OWal"  # Eric - Smooth, Trustworthy
MODEL = "eleven_multilingual_v2"
OUT = Path(__file__).resolve().parent / "voice"
KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
if not KEY:
    sys.exit("ELEVENLABS_API_KEY not set")

LINES = {
    "s1": "In 2008, Edwin Kestler's father died suddenly. To tell his clients what had happened, Edwin had to break into his phone. To cancel his subscriptions, he had to get into his email. The legal succession took years. His digital life couldn't wait. This is Ereditas.",
    "s2": "Every platform has a legacy setting, and no family has time to find them all. Worse, dead-man switches fire on silence alone. And it's an economic problem: one hundred twenty-four trillion dollars will change hands in the US by 2048, and probate still takes twenty months. Ereditas follows one rule: signals can ask. Only a person can answer.",
    "s3": "This is Elena's companion. The ring measures silence, not death. Two quiet days pass: her phone, her Meta sessions and a one-dollar heartbeat go dark. Nothing unlocks. Then Ereditas checks the world. SAM 3.1 finds a candle, a ribbon and lilies in memorial posts from her circle on Facebook and Instagram. Evidence: seven percent. Under the bar. The vault stays sealed.",
    "s4": "Ten silent days, a missed heartbeat, an obituary, three memorial posts: ninety-six percent. Now Ereditas may ask, and only ask. It writes to Ana, Elena's heir, on WhatsApp. Ana answers with a voice note.",
    "s5": "Muse Voice Transcribe hears her. Muse Spark 1.3 reads it as passed. If she had hesitated, it would read unsure, and nothing would be released. The models read the signs. Only a person opens the gate.",
    "s6": "Only now does the vault move, and only what Elena chose. Drive and Facebook memorialization go out as thirty-minute links. No passwords. Wallet and bank wait for a second person. Muse Spark writes Ana a plain letter. Every model call you saw runs live on Meta's Model API. Ereditas: agents that carry out your will when you no longer can, only after the people you trust confirm it.",
}
# Ana's recorded note plays at ~0.6-6.1 s of scene S5; start the narration after it.
LEAD_SILENCE = {"s5": 6.6}


def tts(text: str, dest: Path) -> None:
    body = json.dumps({
        "text": text,
        "model_id": MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.15, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        data=body, method="POST",
        headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        dest.write_bytes(r.read())


def duration(p: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


OUT.mkdir(exist_ok=True)
only = set(sys.argv[2:])
for name, text in LINES.items():
    if only and name not in only:
        continue
    raw = OUT / f".{name}-raw.mp3"
    tts(text, raw)
    final = OUT / f"{name}.wav"
    lead = LEAD_SILENCE.get(name, 0.0)
    af = f"adelay={int(lead * 1000)}:all=1" if lead else "anull"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", "44100", "-ac", "1", str(final)], check=True)
    raw.unlink()
    print(f"{name}: {duration(final):.2f}s ({len(text)} chars)")
