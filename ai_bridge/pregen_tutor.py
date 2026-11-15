#!/usr/bin/env python3
"""Pre-generate KATHERINE's level-adapted teaching lines with the AstroCopilot model (Colab GPU), for human review.

Why: live answers from a 4-bit model on Colab take 20-40 s and sometimes slip. Here the model writes, ahead of
time, an explanation + analogy + check question for every verified card × age level × language. A person approves
them (review_tutor.py) and the game serves the approved ones instantly and offline (src/ai/tutorContent.ts).

Setup (the same as playing with the real model):
  1. In Colab run the KATHERINE cell (MENTOR_URL / MENTOR_KEY), ideally with "--merge" on an L4/A100 (much faster).
  2. Locally:  set MENTOR_API_KEY=...  &&  python ai_bridge/mentor_server.py --backend remote --remote-url <MENTOR_URL>
  3. python ai_bridge/pregen_tutor.py                      # all cards, 3 levels, es+en
     python ai_bridge/pregen_tutor.py --langs es --levels explorer cadet --limit 5   # quick trial
  4. python ai_bridge/review_tutor.py                      # approve / edit / reject, then rebuild the game

Every reply already passed the server's verifier (no invented numbers, right survival order, on-topic follow-up);
the review is the human safety net for a game played by kids.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

GAME = Path(__file__).resolve().parents[1]
OUT = GAME / "src" / "ai" / "generated" / "tutorContent.json"
LEVELS = ["explorer", "cadet", "engineer"]
TEACHING_PREFIX = ("eclss_", "power_", "rover_", "crisis_", "act", "obj_", "mission_", "end_")


def export_cards() -> dict:
    """Bundles src/ai/mentorKnowledge.ts with the game's esbuild and returns MENTOR_CARDS as plain JSON."""
    tmp = GAME / "ai_bridge" / ".cache" / "cards.mjs"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    esbuild = GAME / "node_modules" / ".bin" / ("esbuild.cmd" if sys.platform == "win32" else "esbuild")
    subprocess.run([str(esbuild), str(GAME / "src/ai/mentorKnowledge.ts"), "--bundle", "--format=esm", "--platform=node",
                    f"--outfile={tmp}", "--log-level=warning"], check=True)
    out = subprocess.run(["node", "-e", f"import({json.dumps(tmp.as_uri())}).then(m=>process.stdout.write(JSON.stringify(m.MENTOR_CARDS)))"],
                         check=True, capture_output=True, text=True, encoding="utf-8")
    return json.loads(out.stdout)


def ask(bridge: str, payload: dict, timeout: float) -> dict:
    req = urllib.request.Request(f"{bridge}/api/mentor", json.dumps(payload).encode("utf-8"), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def kind_for(card_id: str) -> str:
    if card_id.startswith("obj_"):
        return "objective"
    if card_id.startswith("mission_"):
        return "mission_start"
    if card_id.startswith("end_"):
        return "ending"
    return "decision"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--bridge", default="http://localhost:8765")
    ap.add_argument("--levels", nargs="+", default=LEVELS, choices=LEVELS)
    ap.add_argument("--langs", nargs="+", default=["es", "en"], choices=["es", "en"])
    ap.add_argument("--cards", nargs="*", help="Only these card ids")
    ap.add_argument("--limit", type=int, default=0, help="Stop after N cards (trial run)")
    ap.add_argument("--timeout", type=float, default=150)
    ap.add_argument("--redo", action="store_true", help="Regenerate entries that already exist (approved ones are kept)")
    ap.add_argument("--allow-mock", action="store_true", help=argparse.SUPPRESS)  # pipeline tests without a GPU
    args = ap.parse_args()

    health = json.loads(urllib.request.urlopen(f"{args.bridge}/api/health", timeout=10).read())
    if health.get("backend") == "offline" or (health.get("backend") == "mock" and not args.allow_mock):
        raise SystemExit(f"The bridge has no model (backend={health.get('backend')}). Start it with --backend remote/hf.")
    print(f"Model: {health.get('model')} via {health.get('backend')}", flush=True)

    cards = {k: v for k, v in export_cards().items() if k.startswith(TEACHING_PREFIX) and not k.startswith("alarm_")}
    if args.cards:
        cards = {k: v for k, v in cards.items() if k in args.cards}
    if args.limit:
        cards = dict(list(cards.items())[: args.limit])

    data = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"entries": {}}
    entries: dict = data.setdefault("entries", {})
    telemetry = {"missionId": "tutorial_hab", "o2Percent": 21, "co2Ppm": 600, "tempCelsius": 22, "waterLiters": 100,
                 "foodKg": 40, "powerKwe": 10, "batteryPercent": 90, "crewRadiationMsv": 1, "crewMoralePercent": 80,
                 "heartRateBpm": 70, "eclssChoice": "", "powerChoice": "", "roverChoice": "", "decisions": {},
                 "objectivesDone": [], "objectivesPending": []}
    total = len(cards) * len(args.levels) * len(args.langs)
    done = 0
    t_start = time.time()
    for cid, card in cards.items():
        for level in args.levels:
            for lang in args.langs:
                key = f"{cid}.{level}.{lang}"
                done += 1
                old = entries.get(key)
                if old and (old.get("approved") or not args.redo):
                    continue
                card_payload = {"say": card["say"][lang], "fact": card["fact"][lang], "source": card["source"],
                                "simple": (card.get("simple") or {}).get(lang), "ragQuery": card["ragQuery"], "tone": card["tone"]}
                base = {"lang": lang, "telemetry": telemetry, "history": [], "card": card_payload,
                        "learner": {"level": level, "mastered": [], "struggling": [], "misconceptions": []}}
                try:
                    main_r = ask(args.bridge, {**base, "event": {"kind": kind_for(cid), "topic": cid}}, args.timeout)
                    simple_r = ask(args.bridge, {**base, "event": {"kind": "explain_again", "topic": cid}}, args.timeout)
                except Exception as exc:  # keep going; the run can be resumed
                    print(f"  ! {key}: {exc}", flush=True)
                    continue
                if main_r.get("origin") != "model":
                    print(f"  - {key}: the verifier rejected the model output (kept the card)", flush=True)
                    continue
                entries[key] = {
                    "say": main_r.get("say", ""),
                    "check": main_r.get("check_question") or "",
                    "analogy": simple_r.get("say", "") if simple_r.get("origin") == "model" else "",
                    "approved": False,
                    "card_say": card_payload["say"],
                    "generated": time.strftime("%Y-%m-%d"),
                }
                OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")  # save as we go
                eta = (time.time() - t_start) / done * (total - done)
                print(f"  ✓ {key}  ({done}/{total}, ~{eta / 60:.0f} min left)", flush=True)
    pending = sum(1 for e in entries.values() if not e.get("approved"))
    print(f"\nListo: {OUT} · {pending} líneas esperan revisión → python ai_bridge/review_tutor.py", flush=True)


if __name__ == "__main__":
    main()
