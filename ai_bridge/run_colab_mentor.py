#!/usr/bin/env python3
"""Run KATHERINE's brain (AstroCopilot Gemma-4-E4B + LoRA) on a Colab GPU and connect it to the game.

What it does:
 1. Creates a Colab GPU session with the `colab` CLI (default L4, falls back to T4).
 2. Uploads ai_bridge/mentor_server.py and the LoRA adapter (outputs/astrocopilot_gemma4_lora/).
 3. On Colab: installs peft/bitsandbytes, starts `mentor_server.py --backend hf` (4-bit) on port 8000 and
    opens a Cloudflare quick tunnel (https://<random>.trycloudflare.com). Every request needs a random key.
 4. Locally: starts `mentor_server.py --backend remote` on http://localhost:8765 with the full NASA RAG
    (Tier-1 + 387k-doc SQLite mega-RAG) so only the generation runs on the GPU.
 5. Keeps running until Ctrl+C or --max-minutes, then ALWAYS stops the Colab session (no wasted compute units).

Usage (from the game folder):
  python ai_bridge/run_colab_mentor.py --ai-root "E:/trabajos uni/colab_entorno"
  npm run dev   # in another terminal → open http://localhost:5174, KATHERINE connects by herself
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import secrets
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from mentor_server import find_ai_root  # noqa: E402

REMOTE_PORT = 8000

BOOTSTRAP = r'''
import os, re, subprocess, sys, time, urllib.request
KEY = __KEY__
EXTRA = __EXTRA__
LOG_SRV, LOG_CF = "/content/mentor_server.log", "/content/cloudflared.log"
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "peft", "bitsandbytes", "accelerate"], check=False)
cf = "/content/cloudflared"
if not os.path.exists(cf):
    urllib.request.urlretrieve("https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64", cf)
    os.chmod(cf, 0o755)
srv = subprocess.Popen([sys.executable, "/content/mentor_server.py", "--backend", "hf", "--rag", "off", "--host", "127.0.0.1",
                        "--port", "__PORT__", "--api-key", KEY, "--require-key-all",
                        "--adapter", "/content/astrocopilot_gemma4_lora"] + EXTRA,
                       stdout=open(LOG_SRV, "w"), stderr=subprocess.STDOUT, start_new_session=True)
tun = subprocess.Popen([cf, "tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:__PORT__"],
                       stdout=open(LOG_CF, "w"), stderr=subprocess.STDOUT, start_new_session=True)
url, ready, t0, shown = None, False, time.time(), 0
while time.time() - t0 < 1500:
    time.sleep(5)
    log = open(LOG_SRV, errors="replace").read()
    for line in log.splitlines()[shown:]:
        print("  [colab]", line[-200:], flush=True)
    shown = len(log.splitlines())
    if srv.poll() is not None:
        print("MENTOR_FAILED server exited", flush=True); break
    if url is None:
        m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", open(LOG_CF, errors="replace").read())
        url = m.group(0) if m else None
    ready = ready or "MENTOR_SERVER_READY" in log
    if url and ready:
        print("MENTOR_URL=" + url, flush=True); break
else:
    print("MENTOR_FAILED timeout", flush=True)
'''


def find_colab_exe(cli: str | None) -> str:
    for c in (cli, os.environ.get("COLAB_EXE"), shutil.which("colab"), shutil.which("colab.exe")):
        if c and Path(c).exists():
            return c
    pattern = os.path.expandvars(r"%LOCALAPPDATA%\Packages\PythonSoftwareFoundation.Python.3.*\LocalCache\local-packages\Python3*\Scripts\colab.exe")
    hits = glob.glob(pattern)
    if hits:
        return hits[0]
    raise SystemExit("No encontré el CLI 'colab'. Instálalo o pasa --colab-exe / COLAB_EXE.")


def run(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(">>>", " ".join(args), flush=True)
    res = subprocess.run(args, text=True, capture_output=True, encoding="utf-8", errors="replace")
    if res.stdout.strip():
        print(res.stdout.strip(), flush=True)
    if res.stderr.strip():
        print(res.stderr.strip(), file=sys.stderr, flush=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Falló: {' '.join(args)}")
    return res


def main() -> None:
    ap = argparse.ArgumentParser(description="KATHERINE on a Colab GPU + local NASA RAG bridge.")
    ap.add_argument("--ai-root", help="AI repo with outputs/astrocopilot_gemma4_lora and src/nasa_rag_engine.py")
    ap.add_argument("--adapter", help="LoRA adapter dir (default: <ai-root>/outputs/astrocopilot_gemma4_lora)")
    ap.add_argument("--gpu", default="L4", help="Colab GPU (L4 recommended; T4 also works in 4-bit).")
    ap.add_argument("--session", default="katherine_mentor")
    ap.add_argument("--colab-exe")
    ap.add_argument("--merge", action="store_true", help="Merge LoRA into bf16 on Colab (faster replies; needs L4/A100).")
    ap.add_argument("--local-port", type=int, default=8765)
    ap.add_argument("--no-mega", action="store_true", help="Local RAG without the SQLite mega-RAG.")
    ap.add_argument("--max-minutes", type=float, default=120.0, help="Auto-stop the GPU session after this many minutes.")
    args = ap.parse_args()

    ai_root = find_ai_root(args.ai_root)
    adapter = Path(args.adapter) if args.adapter else (ai_root / "outputs" / "astrocopilot_gemma4_lora" if ai_root else None)
    if not adapter or not (adapter / "adapter_config.json").exists() or not (adapter / "adapter_model.safetensors").exists():
        raise SystemExit(f"No encontré el adaptador LoRA en {adapter}. Usa --ai-root o --adapter.")
    colab = find_colab_exe(args.colab_exe)
    key = secrets.token_urlsafe(24)

    cache = HERE / ".cache"
    cache.mkdir(exist_ok=True)
    extra = ["--merge"] if args.merge else []
    boot = cache / "colab_bootstrap.py"
    boot.write_text(
        BOOTSTRAP.replace("__KEY__", repr(key)).replace("__EXTRA__", repr(extra)).replace("__PORT__", str(REMOTE_PORT)),
        encoding="utf-8",
    )

    local: subprocess.Popen | None = None
    started = False
    try:
        if run([colab, "new", "-s", args.session, "--gpu", args.gpu], check=False).returncode != 0:
            print(f"{args.gpu} no disponible; probando T4...", flush=True)
            run([colab, "new", "-s", args.session, "--gpu", "T4"])
        started = True

        run([colab, "upload", "-s", args.session, str(HERE / "mentor_server.py"), "/content/mentor_server.py"])
        for name in ("adapter_config.json", "adapter_model.safetensors"):
            size = (adapter / name).stat().st_size / 1e6
            print(f"Subiendo {name} ({size:.1f} MB)...", flush=True)
            run([colab, "upload", "-s", args.session, str(adapter / name), f"/content/astrocopilot_gemma4_lora/{name}"])

        print("Cargando Gemma-4 + LoRA en la GPU y abriendo el túnel (la 1a vez tarda varios minutos)...", flush=True)
        proc = subprocess.Popen([colab, "exec", "-s", args.session, "--timeout", "0", "-f", str(boot)],
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
        url = None
        assert proc.stdout is not None
        for line in proc.stdout:
            print(line.rstrip(), flush=True)
            m = re.search(r"MENTOR_URL=(https://\S+)", line)
            if m:
                url = m.group(1)
            if "MENTOR_FAILED" in line:
                break
        proc.wait()
        if not url:
            raise RuntimeError("El servidor del modelo no arrancó en Colab (revisa /content/mentor_server.log).")

        cmd = [sys.executable, str(HERE / "mentor_server.py"), "--backend", "remote", "--remote-url", url,
               "--port", str(args.local_port)]
        if ai_root:
            cmd += ["--ai-root", str(ai_root)]
        if args.no_mega:
            cmd.append("--no-mega")
        env = {**os.environ, "MENTOR_API_KEY": key}  # key via env, not visible in the process list
        local = subprocess.Popen(cmd, env=env)
        deadline = time.time() + args.max_minutes * 60
        print("\n" + "=" * 72)
        print(f"KATHERINE EN LÍNEA → http://localhost:{args.local_port}  (modelo en Colab {args.gpu})")
        print("Abre el juego con `npm run dev` → http://localhost:5174")
        print(f"Ctrl+C para terminar. Auto-apagado de la GPU en {args.max_minutes:.0f} min.")
        print("=" * 72 + "\n", flush=True)
        while time.time() < deadline:
            if local.poll() is not None:
                raise RuntimeError("El puente local se detuvo.")
            time.sleep(2)
        print("Tiempo máximo alcanzado: apagando la GPU.", flush=True)
    except KeyboardInterrupt:
        print("\nDeteniendo...", flush=True)
    finally:
        if local and local.poll() is None:
            local.terminate()
        if started:
            run([colab, "stop", "-s", args.session], check=False)
            run([colab, "sessions"], check=False)
        try:
            boot.unlink()  # contains the session key
        except OSError:
            pass


if __name__ == "__main__":
    main()
