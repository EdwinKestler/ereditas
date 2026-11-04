"""Spanish narration for the demo video (ElevenLabs). Reads ELEVENLABS_API_KEY from env; never prints it.

Usage: (set -a; . ./.env; set +a; python3 -I video/gen_voice_es.py [voice_id] [s1 s2 ...])
Writes video/voice-es/s1.wav ... s6.wav. Assemble with:
  VOICE_DIR=video/voice-es OUTPUT_NAME=ereditas-demo-es.mp4 ./video/assemble.sh
"""
import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

VOICE = sys.argv[1] if len(sys.argv) > 1 else "Wl3O9lmFSMgGFTTwuS6f"  # Martin Alvarez - latin american
MODEL = "eleven_multilingual_v2"
OUT = Path(__file__).resolve().parent / "voice-es"
KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
if not KEY:
    sys.exit("ELEVENLABS_API_KEY not set")

LINES = {
    "s1": "En 2008, el padre de Edwin Kestler murió de forma repentina. Para avisar a sus clientes, Edwin tuvo que entrar a su teléfono. Para cancelar sus suscripciones, tuvo que entrar a su correo. La sucesión legal tomó años. Su vida digital no podía esperar. Esto es Ereditas.",
    "s2": "Cada plataforma tiene su propia configuración de legado, y ninguna familia tiene tiempo de encontrarlas todas. Peor aún, los interruptores de hombre muerto se activan solo con el silencio. Y también es un problema económico: ciento veinticuatro billones de dólares cambiarán de manos en Estados Unidos hasta 2048, y una sucesión todavía tarda veinte meses. Ereditas sigue una regla: las señales pueden preguntar. Solo una persona puede responder.",
    "s3": "Este es el acompañante de Elena. El anillo mide silencio, no muerte. Pasan dos días de silencio: su teléfono, sus sesiones de Meta y un latido de un dólar se apagan. Nada se desbloquea. Entonces Ereditas revisa el mundo. SAM 3.1 encuentra una vela, un listón y lirios en publicaciones de su círculo en Facebook e Instagram. Evidencia: siete por ciento. Bajo el umbral. La bóveda sigue sellada.",
    "s4": "Diez días de silencio, un latido perdido, un obituario y tres publicaciones de homenaje: noventa y seis por ciento. Ahora Ereditas puede preguntar, y solo preguntar. Le escribe a Ana, la heredera de Elena, por WhatsApp. Ana responde con una nota de voz.",
    "s5": "Muse Voice Transcribe la escucha. Muse Spark 1.3 entiende que Elena falleció. Si Ana hubiera dudado, lo leería como incierto, y no se liberaría nada. Los modelos leen las señales. Solo una persona abre la puerta.",
    "s6": "Solo entonces se mueve la bóveda, y solo lo que Elena eligió. Drive y la conmemoración en Facebook se entregan como enlaces de treinta minutos. Sin contraseñas. La billetera y el banco esperan a una segunda persona. Muse Spark le escribe a Ana una carta sencilla. Cada llamada a un modelo que viste corre en vivo en la Model API de Meta. Ereditas: agentes que cumplen tu voluntad cuando ya no puedes, solo después de que las personas en quienes confías lo confirman.",
}
LEAD_SILENCE = {"s5": 6.6}  # Ana's recorded note plays first in scene S5


def tts(text: str, dest: Path) -> None:
    body = json.dumps({
        "text": text,
        "model_id": MODEL,
        "language_code": "es",
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
    try:
        tts(text, raw)
    except urllib.error.HTTPError as e:
        if e.code == 400 and "language_code" in e.read().decode(errors="ignore"):
            sys.exit("model rejected language_code; remove it and retry")
        raise
    final = OUT / f"{name}.wav"
    lead = LEAD_SILENCE.get(name, 0.0)
    af = f"adelay={int(lead * 1000)}:all=1" if lead else "anull"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", "44100", "-ac", "1", str(final)], check=True)
    raw.unlink()
    print(f"{name}: {duration(final):.2f}s ({len(text)} chars)")
