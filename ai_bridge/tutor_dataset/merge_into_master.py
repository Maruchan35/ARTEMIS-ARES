#!/usr/bin/env python3
"""Merges the KATHERINE tutoring rows into AstroCopilot's master dataset (writes NEW _v31 files, never overwrites).

  python ai_bridge/tutor_dataset/merge_into_master.py --ai-root "E:/trabajos uni/colab_entorno" --repeat 2

--repeat N duplicates each tutoring train row N times (new ids) so ~700 rows weigh enough next to 4,157.
Output: <ai-root>/data/astrocopilot_master_train_v31.jsonl and astrocopilot_master_eval_v31.jsonl
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def read(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ai-root", required=True)
    ap.add_argument("--repeat", type=int, default=2)
    args = ap.parse_args()
    data = Path(args.ai_root) / "data"
    for split, rep in (("train", args.repeat), ("eval", 1)):
        master = read(data / f"astrocopilot_master_{split}.jsonl")
        tutor = read(HERE / "out" / f"tutor_{split}.jsonl")
        extra = [{**r, "id": r["id"] if k == 0 else f"{r['id']}-r{k + 1}"} for k in range(rep) for r in tutor]
        out = data / f"astrocopilot_master_{split}_v31.jsonl"
        out.write_text("\n".join(json.dumps(r, ensure_ascii=False) for r in master + extra) + "\n", encoding="utf-8")
        print(f"{out.name}: {len(master)} originales + {len(extra)} de tutoría = {len(master) + len(extra)}")


if __name__ == "__main__":
    main()
