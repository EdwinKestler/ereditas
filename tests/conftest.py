import os
import sys
from pathlib import Path

os.environ["EREDITAS_OFFLINE"] = "1"
os.environ["META_API_KEY"] = ""
os.environ["MODEL_API_KEY"] = ""

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
