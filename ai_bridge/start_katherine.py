#!/usr/bin/env python3
"""Start the game WITH KATHERINE's bridge (HD neural voices F1–F5 / M1–M5 + NASA RAG) in one command.

  npm run katherine                                   # offline brain (verified cards) + HD voices
  npm run katherine -- --url <MENTOR_URL> --key <MENTOR_KEY>   # real model on Colab + HD voices

You can also set MENTOR_URL / MENTOR_KEY as environment variables instead of passing them.
The HD voices are rendered here, on your PC (Supertonic 3, `pip install supertonic`), so they work
in both modes; without the bridge the game falls back to the browser voices.
Ctrl+C stops everything.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
GAME = HERE.parent


def health(port: int) -> dict | None:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=2) as r:
            return json.load(r)
    except Exception:
        return None


def main() -> None:
    ap = argparse.ArgumentParser(description="Game + KATHERINE bridge with HD voices.")
    ap.add_argument("--url", default=os.environ.get("MENTOR_URL", ""), help="Colab tunnel (MENTOR_URL)")
    ap.add_argument("--key", default=os.environ.get("MENTOR_KEY", ""), help="Colab key (MENTOR_KEY)")
    ap.add_argument("--ai-root", default=os.environ.get("ASTRO_AI_ROOT", ""), help="AI repo with the NASA RAG")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--no-game", action="store_true", help="Only the bridge (game already running).")
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    try:
        import supertonic  # noqa: F401
    except ImportError:
        print("[voz] Falta Supertonic: ejecuta  pip install supertonic  (si no, solo habrá voces del navegador).")

    cmd = [sys.executable, str(HERE / "mentor_server.py"), "--port", str(args.port), "--voice", "auto"]
    if args.url:
        if not args.key:
            sys.exit("Falta --key (MENTOR_KEY) para el túnel de Colab.")
        cmd += ["--backend", "remote", "--remote-url", args.url.rstrip("/"), "--api-key", args.key]
        print(f"[katherine] Cerebro: modelo real en Colab ({args.url})")
    else:
        cmd += ["--backend", "offline"]
        print("[katherine] Cerebro: offline (tarjetas verificadas). Pasa --url/--key para usar Colab.")
    if args.ai_root:
        cmd += ["--ai-root", args.ai_root]

    procs: list[subprocess.Popen] = []
    if health(args.port):
        print(f"[katherine] Ya hay un bridge en :{args.port}; lo reutilizo.")
    else:
        procs.append(subprocess.Popen(cmd, cwd=GAME))
        t0 = time.time()
        while not health(args.port):
            if procs[0].poll() is not None:
                sys.exit("El bridge se cerró: revisa el error arriba.")
            if time.time() - t0 > 180:
                sys.exit("El bridge tardó demasiado en arrancar.")
            time.sleep(1)
    t0 = time.time()  # the HD voice model loads in the background (~20-60 s the first time)
    while ((health(args.port) or {}).get("voice") or {}).get("status") == "loading" and time.time() - t0 < 90:
        time.sleep(2)
    h = health(args.port) or {}
    v = h.get("voice") or {}
    print(f"[katherine] Bridge listo · backend={h.get('backend')} · RAG={h.get('rag_docs')} docs · "
          f"voz HD={v.get('status')} ({len(v.get('voices', []))} voces)")

    try:
        if not args.no_game:
            npm = shutil.which("npm") or shutil.which("npm.cmd") or "npm"
            print("[katherine] Abre http://localhost:5174")
            procs.append(subprocess.Popen([npm, "run", "dev"], cwd=GAME))
        if not procs:
            print("[katherine] Nada más que lanzar (el bridge ya estaba corriendo).")
        while procs and all(p.poll() is None for p in procs):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for p in procs:
            if p.poll() is None:
                p.terminate()
        for p in procs:
            try:
                p.wait(timeout=10)
            except subprocess.TimeoutExpired:
                p.kill()


if __name__ == "__main__":
    main()
