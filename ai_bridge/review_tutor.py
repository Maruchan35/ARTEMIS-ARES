#!/usr/bin/env python3
"""Human review of the model's pre-generated teaching lines (src/ai/generated/tutorContent.json).

For each pending line it shows the verified card next to what the model wrote, and you choose:
  [a] approve   [e] edit (type your own version)   [r] reject (delete)   [s] skip   [q] save and quit
Only approved lines reach players. Rebuild/restart the game afterwards (npm run dev / npm run build).
"""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "src" / "ai" / "generated" / "tutorContent.json"


def main() -> None:
    data = json.loads(OUT.read_text(encoding="utf-8"))
    entries: dict = data.get("entries", {})
    pending = [k for k, v in entries.items() if not v.get("approved")]
    print(f"{len(pending)} líneas pendientes de revisión.\n")
    for i, key in enumerate(pending, 1):
        e = entries[key]
        print("=" * 78)
        print(f"[{i}/{len(pending)}] {key}")
        print(f"  TARJETA VERIFICADA: {e.get('card_say', '')}")
        print(f"  MODELO · explicación: {e.get('say', '')}")
        print(f"  MODELO · analogía:    {e.get('analogy', '')}")
        print(f"  MODELO · pregunta:    {e.get('check', '')}")
        choice = input("  [a]probar [e]ditar [r]echazar [s]altar [q]uit > ").strip().lower()
        if choice == "q":
            break
        if choice == "a":
            e["approved"] = True
        elif choice == "r":
            del entries[key]
        elif choice == "e":
            for field in ("say", "analogy", "check"):
                new = input(f"    {field} (Enter = dejar igual): ").strip()
                if new:
                    e[field] = new
            e["approved"] = True
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    approved = sum(1 for v in entries.values() if v.get("approved"))
    print(f"\nGuardado. {approved} líneas aprobadas en {OUT}")


if __name__ == "__main__":
    main()
