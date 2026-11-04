"""Check ElevenLabs access and list a few premade voices. Never prints the key."""
import json
import os
import sys
import urllib.request

key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
if not key:
    sys.exit("ELEVENLABS_API_KEY not set")


def get(path):
    req = urllib.request.Request(f"https://api.elevenlabs.io{path}", headers={"xi-api-key": key})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


try:
    sub = get("/v1/user/subscription")
    print("tier:", sub.get("tier"), "chars used:", sub.get("character_count"), "/", sub.get("character_limit"))
except Exception as e:  # noqa: BLE001
    print("subscription check failed:", type(e).__name__, getattr(e, "code", ""))
voices = get("/v1/voices").get("voices", [])
for v in voices[:40]:
    labels = v.get("labels") or {}
    print(v["voice_id"], "|", v["name"], "|", v.get("category"), "|", labels.get("gender"), labels.get("accent"), labels.get("age"), labels.get("use_case") or labels.get("description"))
