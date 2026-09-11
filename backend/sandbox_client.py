"""Compile Rust guests to WASI and execute them with the Wasmtime sandbox host."""

import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_HOSTS = (
    BACKEND_DIR.parent / "sandbox" / "sandbox-host" / "target" / "release" / "sandbox-host.exe",
    BACKEND_DIR.parent / "sandbox" / "sandbox-host" / "target" / "release" / "sandbox-host",
)


def _error(message: str) -> dict[str, Any]:
    return {"success": False, "output": "", "error": message}


def _sandbox_host() -> Path | None:
    configured = os.getenv("SANDBOX_HOST_PATH")
    if configured:
        path = Path(configured).expanduser()
        return path if path.is_file() else None
    return next((path for path in DEFAULT_HOSTS if path.is_file()), None)


def call_sandbox(code: str, policy: dict[str, Any]) -> dict[str, Any]:
    """Compile code to WASI and execute it through the external sandbox host."""
    if policy.get("decision") != "ALLOW":
        return _error("Execution blocked by security policy.")
    if not shutil.which("rustc"):
        return _error("Rust compiler not found. Install Rust and the wasm32-wasip1 target.")

    host = _sandbox_host()
    if host is None:
        return _error("Sandbox host not found. Set SANDBOX_HOST_PATH in backend/.env.")

    try:
        with tempfile.TemporaryDirectory(prefix="agent-firewall-") as temp_dir:
            directory = Path(temp_dir)
            source = directory / "guest.rs"
            wasm = directory / "guest.wasm"
            source.write_text(code, encoding="utf-8")

            compilation = subprocess.run(
                ["rustc", "--target", "wasm32-wasip1", "-O", "-o", str(wasm), str(source)],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )
            if compilation.returncode:
                return _error(f"Compilation failed: {compilation.stderr.strip()[-4000:]}")

            execution = subprocess.run(
                [str(host), "--wasm", str(wasm), "--policy", json.dumps(policy)],
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            if execution.returncode:
                return _error(f"Sandbox execution failed: {execution.stderr.strip()[-4000:]}")
            try:
                return json.loads(execution.stdout)
            except json.JSONDecodeError:
                return _error("Sandbox host returned invalid JSON.")
    except subprocess.TimeoutExpired:
        return _error("Sandbox execution timed out.")
    except OSError as exc:
        return _error(f"Sandbox setup failed: {exc}")
