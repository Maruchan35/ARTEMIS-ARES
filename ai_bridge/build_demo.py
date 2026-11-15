#!/usr/bin/env python3
"""Build the public web demo (landing page + game + promo video) and optionally publish it.

  python ai_bridge/build_demo.py            # builds demo_build/
  python ai_bridge/build_demo.py --publish  # also pushes it to the `demo-web` branch (Colab downloads it from there)

Layout of demo_build/ (served by `mentor_server.py --static demo_build`):
  index.html   landing page for evaluators (demo/index.html)
  jugar.html   the game (Vite build)
  assets/      game bundle
  promo.mp4    30 s promo video, poster.jpg cover
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

GAME = Path(__file__).resolve().parent.parent
OUT = GAME / "demo_build"
BRANCH = "demo-web"


def run(cmd: list[str], cwd: Path) -> str:
    print("$", " ".join(cmd), flush=True)
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0:
        sys.exit(res.stdout[-2000:] + res.stderr[-2000:])
    return res.stdout


def main() -> None:
    ap = argparse.ArgumentParser(description="Build (and publish) the AETHER-4 public web demo.")
    ap.add_argument("--publish", action="store_true", help=f"Push demo_build/ to the `{BRANCH}` branch on origin.")
    ap.add_argument("--skip-build", action="store_true", help="Reuse the existing dist/.")
    args = ap.parse_args()

    if not args.skip_build:
        npm = shutil.which("npm") or shutil.which("npm.cmd") or "npm"
        run([npm, "run", "build"], GAME)

    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(GAME / "dist", OUT)
    (OUT / "index.html").rename(OUT / "jugar.html")
    shutil.copy2(GAME / "demo" / "index.html", OUT / "index.html")
    shutil.copy2(GAME / "demo" / "poster.jpg", OUT / "poster.jpg")
    promo = GAME / "promo" / "video" / "codecraft_aether4_promo.mp4"
    if promo.exists():
        shutil.copy2(promo, OUT / "promo.mp4")
    else:
        print("[demo] promo video not found: the landing page will show only the poster.")
    size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / 1e6
    print(f"[demo] Built {OUT} ({size:.1f} MB)")

    if not args.publish:
        return
    commit = run(["git", "rev-parse", "--short", "HEAD"], GAME).strip()
    remote = run(["git", "remote", "get-url", "origin"], GAME).strip()
    with tempfile.TemporaryDirectory(dir=GAME.parent) as tmp:
        repo = Path(tmp) / "demo"
        shutil.copytree(OUT, repo)
        (repo / "README.md").write_text(
            "# AETHER-4 · demo web (generado)\n\nBuild publicado por `ai_bridge/build_demo.py` desde la rama "
            f"`orbital-quarters` @ {commit}. No editar a mano.\n", encoding="utf-8")
        run(["git", "init", "-q", "-b", BRANCH], repo)
        run(["git", "add", "-A"], repo)
        run(["git", "commit", "-q", "-m", f"AETHER-4 web demo build from orbital-quarters@{commit}"], repo)
        run(["git", "push", "-f", remote, f"{BRANCH}:{BRANCH}"], repo)
    print(f"[demo] Published to branch `{BRANCH}` (orbital-quarters@{commit}).")


if __name__ == "__main__":
    main()
