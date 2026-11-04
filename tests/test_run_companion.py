"""Deployment-safe host binding for the companion launcher."""

from __future__ import annotations

import os
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]


def _run_launcher(tmp_path: Path, host: str | None = None) -> list[str]:
    launcher = tmp_path / "scripts" / "run-companion.sh"
    launcher.parent.mkdir()
    shutil.copy2(ROOT / "scripts" / "run-companion.sh", launcher)

    fake_uvicorn = tmp_path / ".venv" / "bin" / "uvicorn"
    fake_uvicorn.parent.mkdir(parents=True)
    fake_uvicorn.write_text("#!/usr/bin/env bash\nprintf '%s\\n' \"$@\"\n")
    fake_uvicorn.chmod(0o755)

    env = os.environ.copy()
    if host is None:
        env.pop("EREDITAS_HOST", None)
    else:
        env["EREDITAS_HOST"] = host

    result = subprocess.run(
        ["bash", str(launcher)],
        cwd=tmp_path,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.splitlines()


def test_launcher_defaults_to_loopback(tmp_path: Path) -> None:
    args = _run_launcher(tmp_path)

    assert args[args.index("--host") + 1] == "127.0.0.1"


def test_launcher_allows_container_host_override(tmp_path: Path) -> None:
    args = _run_launcher(tmp_path, host="0.0.0.0")

    assert args[args.index("--host") + 1] == "0.0.0.0"
