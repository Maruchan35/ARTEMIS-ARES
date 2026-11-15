#!/usr/bin/env python3
"""Builds the KATHERINE tutoring dataset (ES/EN, 3 age levels) in AstroCopilot's training format.

Why the model needs it: AstroCopilot v3.0 was trained on 4,157 English rows of flight/mentor dialogue. Live tests
showed it ignores the age level, praises wrong answers ("food first" -> "Exactly!") and sometimes invents numbers.
These rows teach exactly the game's tasks, with the EXACT prompt the game sends (mentor_server.build_messages):
  teach        decision / objective / mission / ending explained per level           (JSON say/did_you_know/check)
  explain      "explícamelo otra vez": simpler analogy per level                       (JSON)
  grade        the player's own explanation -> good / partial / miss + misconception   (JSON say/verdict/misconception)
  question     free questions kids ask, answered per level                             (JSON)
  honesty      questions with no verified answer -> say so, never invent              (JSON)
Every target is checked with the server's verify_reply (no number outside the prompt's card/telemetry).

Output (same schema as data/astrocopilot_master_train.jsonl: id/category/format/messages/language/source):
  ai_bridge/tutor_dataset/out/tutor_train.jsonl, tutor_eval.jsonl, tutor_stats.json
"""

from __future__ import annotations

import json
import random
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRIDGE = HERE.parent
sys.path.insert(0, str(BRIDGE))
sys.path.insert(0, str(HERE))

from mentor_server import MentorService, OfflineBackend, RagLibrary, verify_reply  # noqa: E402
from pregen_tutor import export_cards, kind_for  # noqa: E402
from tutor_content import C, HONESTY, HONEST_REPLY  # noqa: E402

OUT = HERE / "out"
LEVELS = ["explorer", "cadet", "engineer"]
LANGS = ["es", "en"]
rng = random.Random(2026)

# Concept of every teaching card (mirror of CARD_CONCEPT in src/ai/learner.ts).
CARD_CONCEPT = {
    "eclss_closed_regen": "agua", "eclss_open_lioh": "co2", "power_fsp_40kw": "energia", "power_solar_only": "energia",
    "rover_kilopower_rover": "movilidad", "rover_rtg_solar_rover": "movilidad", "crisis_water_priority": "supervivencia",
    "crisis_food_priority": "supervivencia", "act1_duct_tape_patch": "co2", "act1_cdra_reroute": "co2",
    "act2_krusty_spe": "energia", "act2_solar_ration": "energia", "act3_isolate_bios3": "plantas", "act3_vent_compost": "plantas",
    "act4_shield_2m_rover": "radiacion", "act4_unshielded_dash": "radiacion", "mission_tutorial_hab": "cuerpo",
    "mission_manifest_launch": "cohete", "mission_act1_2_surface": "gravedad", "mission_act3_greenhouse": "plantas",
    "mission_act4_storm_rover": "radiacion", "obj_sleepCompleted": "cuerpo", "obj_exerciseCalibrated": "cuerpo",
    "obj_whcInspected": "agua", "obj_evaChecked": "movilidad", "obj_powerRestored": "energia", "obj_eclssCleaned": "co2",
    "obj_mealPrepared": "comida", "obj_viewportOpened": "cohete", "obj_launchCompleted": "cohete", "obj_aphHarvested": "plantas",
    "obj_bios3Activated": "plantas", "obj_roverReturned": "movilidad",
}

OPENERS = {
    "explorer": {
        "good": {"es": ["¡Muy bien!", "¡Bien pensado, explorador!", "¡Genial!"], "en": ["Great job!", "Nice thinking, explorer!", "Awesome!"]},
        "risky": {"es": ["Mmm, eso es un poco arriesgado.", "¡Uy! Veamos qué pasa con eso."], "en": ["Hmm, that's a bit risky.", "Whoa! Let's see what happens with that."]},
        "neutral": {"es": ["¡Listo!", "¡Bien hecho!"], "en": ["Done!", "Well done!"]},
    },
    "cadet": {
        "good": {"es": ["Buena elección, Cadete.", "Eso es pensar como ingeniero de la NASA.", "Me gusta cómo piensas."],
                 "en": ["Good call, Cadet.", "That is thinking like a NASA engineer.", "I like the way you think."]},
        "risky": {"es": ["Mmm… decisión valiente. Veamos si también es sabia.", "Interesante. Arriesgado, pero interesante."],
                  "en": ["Hmm… a brave choice. Let us see if it is also a wise one.", "Interesting. Risky, but interesting."]},
        "neutral": {"es": ["Bien hecho.", "Sistema verificado."], "en": ["Well done.", "System verified."]},
    },
    "engineer": {
        "good": {"es": ["Correcto.", "Buena decisión técnica.", "Bien razonado."], "en": ["Correct.", "Sound engineering call.", "Well reasoned."]},
        "risky": {"es": ["Decisión arriesgada; revisemos el costo.", "Válido, pero con un margen de seguridad menor."],
                  "en": ["Risky call; let's review the cost.", "Valid, but with a thinner safety margin."]},
        "neutral": {"es": ["Verificado.", "Confirmado."], "en": ["Verified.", "Confirmed."]},
    },
}
AGAIN_CHECK = {
    "explorer": {"es": "¿Ahora sí lo ves?", "en": "Do you see it now?"},
    "cadet": {"es": "¿Ahora sí tiene más sentido?", "en": "Does it make more sense now?"},
    "engineer": {"es": "¿Así queda más claro el mecanismo?", "en": "Is the mechanism clearer now?"},
}
AGAIN_LEAD = {
    "explorer": {"es": "Te lo cuento de otra forma:", "en": "Let me tell you another way:"},
    "cadet": {"es": "Va de nuevo, más sencillo:", "en": "Here it is again, simpler:"},
    "engineer": {"es": "Visto como sistema:", "en": "Seen as a system:"},
}
GRADE_LEAD = {
    "good": {"es": "¡Exacto! Lo dijiste muy bien:", "en": "Exactly! You nailed it:"},
    "partial": {"es": "Vas bien. Te faltó una pieza:", "en": "Good start. One missing piece:"},
    "miss": {"es": "No es correcto, pero es un error muy común:", "en": "Not quite, but it's a very common mix-up:"},
    "off": {"es": "Esa respuesta no habla de {name}. Pista:", "en": "That answer isn't about {name}. Hint:"},
}

service = MentorService(OfflineBackend(), RagLibrary(None, False, False), 220, 0.6)


def telemetry() -> dict:
    return {"missionId": rng.choice(["tutorial_hab", "manifest_launch", "act1_2_surface", "act3_greenhouse", "act4_storm_rover"]),
            "o2Percent": round(rng.uniform(20.4, 21.2), 1), "co2Ppm": rng.randrange(520, 900, 10), "tempCelsius": round(rng.uniform(21, 24), 1),
            "waterLiters": rng.randrange(60, 120), "foodKg": rng.randrange(20, 60), "powerKwe": rng.choice([10, 20, 40]),
            "batteryPercent": rng.randrange(55, 100), "crewRadiationMsv": rng.randrange(1, 60), "crewMoralePercent": rng.randrange(60, 100),
            "heartRateBpm": rng.randrange(62, 95), "eclssChoice": "", "powerChoice": "", "roverChoice": "", "decisions": {},
            "objectivesDone": [], "objectivesPending": []}


def learner(level: str, lang: str) -> dict:
    concepts = list(C)
    miscon = [a[5 if lang == "es" else 6] for c in C.values() for a in c["answers"] if a[5]]
    return {"level": level, "mastered": rng.sample(concepts, rng.randint(0, 3)), "struggling": rng.sample(concepts, rng.randint(0, 2)),
            "misconceptions": rng.sample(miscon, rng.randint(0, 1))}


def card_payload(card: dict, lang: str) -> dict:
    return {"say": card["say"][lang], "fact": card["fact"][lang], "source": card["source"],
            "simple": (card.get("simple") or {}).get(lang), "ragQuery": card["ragQuery"], "tone": card["tone"]}


def row(req: dict, target: dict, category: str, lang: str) -> dict | None:
    msgs = service.build_messages(req, [], [])
    probe = {"say": target.get("say", ""), "did_you_know": target.get("did_you_know", ""), "check_question": target.get("check_question", "")}
    if verify_reply(probe, req.get("card") or {}, [], req.get("telemetry") or {}, str((req.get("event") or {}).get("text") or "")):
        return None
    return {"category": category, "format": "dialogue", "language": lang, "source": "katherine_tutor_v31",
            "messages": [*msgs, {"role": "assistant", "content": json.dumps(target, ensure_ascii=False)}]}


def main() -> None:
    cards = export_cards()
    rows: list[dict] = []
    dropped = Counter()

    def add(r: dict | None, tag: str) -> None:
        if r is None:
            dropped[tag] += 1
        else:
            rows.append(r)

    # 1) teach + 2) explain again
    for cid, concept in CARD_CONCEPT.items():
        card, k = cards[cid], C[concept]
        kind = kind_for(cid)
        for level in LEVELS:
            for lang in LANGS:
                base = {"lang": lang, "telemetry": telemetry(), "history": [], "card": card_payload(card, lang), "learner": learner(level, lang)}
                tone = card["tone"] if card["tone"] in ("good", "risky", "neutral") else "neutral"
                opener = "" if kind == "mission_start" else rng.choice(OPENERS[level][tone][lang]) + " "
                if level == "explorer":
                    body = (card.get("simple") or {}).get(lang) or k["explorer"][lang]
                elif level == "cadet":
                    body = card["say"][lang]
                else:
                    body = f"{card['say'][lang]} {k['engineer'][lang]}"
                check = "" if kind == "mission_start" else k["checks"][level][lang]
                r = row({**base, "event": {"kind": kind, "topic": cid}},
                        {"say": opener + body, "did_you_know": card["fact"][lang], "check_question": check}, f"tutor_teach_{level}", lang)
                if r is None and level == "engineer":  # technical add-on cited a number the card lacks: keep only the card's own
                    dropped["teach_engineer_number"] += 1
                    r = row({**base, "event": {"kind": kind, "topic": cid}},
                            {"say": opener + card["say"][lang], "did_you_know": card["fact"][lang], "check_question": check}, f"tutor_teach_{level}", lang)
                add(r, "teach")
                simple = (card.get("simple") or {}).get(lang)
                again = k["engineer"][lang] if level == "engineer" else (simple or k["explorer"][lang])
                again_req = {**base, "learner": {**base["learner"], "struggling": [concept]}, "event": {"kind": "explain_again", "topic": cid}}
                r = row(again_req, {"say": f"{AGAIN_LEAD[level][lang]} {again}", "did_you_know": "", "check_question": AGAIN_CHECK[level][lang]},
                        f"tutor_explain_{level}", lang)
                if r is None and level == "engineer":
                    dropped["explain_engineer_number"] += 1
                    r = row(again_req, {"say": f"{AGAIN_LEAD[level][lang]} {card['say'][lang]}", "did_you_know": "", "check_question": AGAIN_CHECK[level][lang]},
                            f"tutor_explain_{level}", lang)
                add(r, "explain")

    # 3) grading open answers (cadet + engineer play this step; explorers get quizzes)
    concept_card = {}
    for cid, concept in CARD_CONCEPT.items():
        if cards[cid].get("quiz") and concept not in concept_card:
            concept_card[concept] = cid
    for cid, concept in CARD_CONCEPT.items():
        concept_card.setdefault(concept, cid)
    # Concepts only taught through alarms in the game.
    concept_card.setdefault("aire", "alarm_o2")
    concept_card.setdefault("temperatura", "alarm_temp")
    for concept, k in C.items():
        card = cards[concept_card[concept]]
        for verdict, ans_es, ans_en, note_es, note_en, mis_es, mis_en in k["answers"]:
            for lang in LANGS:
                answer, note, mis = (ans_es, note_es, mis_es) if lang == "es" else (ans_en, note_en, mis_en)
                if verdict == "good":
                    say = f"{GRADE_LEAD['good'][lang]} {k['key'][lang]}"
                elif verdict == "partial":
                    say = f"{GRADE_LEAD['partial'][lang]} {note}."
                elif note:
                    say = f"{GRADE_LEAD['miss'][lang]} {note}."
                else:
                    say = f"{GRADE_LEAD['off'][lang].format(name=k['name'][lang])} {k['key'][lang]}"
                for level in ("cadet", "engineer"):
                    req = {"lang": lang, "telemetry": telemetry(), "history": [], "card": card_payload(card, lang), "learner": learner(level, lang),
                           "event": {"kind": "grade", "topic": concept, "text": answer}}
                    target = {"say": say, "verdict": verdict, "misconception": mis}
                    add(row(req, target, f"tutor_grade_{verdict}", lang), "grade")

    # 4) free questions per level (card = the concept's verified key idea + technical fact, so answers stay grounded)
    for concept, k in C.items():
        for level in LEVELS:
            for lang in LANGS:
                card = {"say": k["key"][lang], "fact": k["engineer"][lang], "source": "KATHERINE verified concept", "ragQuery": concept, "tone": "neutral",
                        "simple": k["explorer"][lang]}
                req = {"lang": lang, "telemetry": telemetry(), "history": [], "card": card, "learner": learner(level, lang),
                       "event": {"kind": "question", "topic": "", "text": k["question"][lang]}}
                target = {"say": k["qa"][level][lang], "did_you_know": "", "check_question": k["checks"][level][lang]}
                add(row(req, target, f"tutor_question_{level}", lang), "question")

    # 5) honesty: nothing verified -> say so, never invent
    for q_es, q_en in HONESTY:
        for level in LEVELS:
            for lang in LANGS:
                req = {"lang": lang, "telemetry": telemetry(), "history": [], "learner": learner(level, lang),
                       "event": {"kind": "question", "topic": "", "text": q_es if lang == "es" else q_en}}
                add(row(req, {"say": rng.choice(HONEST_REPLY[lang]), "did_you_know": "", "check_question": ""}, "tutor_honesty", lang), "honesty")

    rng.shuffle(rows)
    for i, r in enumerate(rows, 1):
        r["id"] = f"tut-{i:04d}"
    # Stratified ~8 % eval split by category.
    by_cat: dict[str, list[dict]] = {}
    for r in rows:
        by_cat.setdefault(r["category"], []).append(r)
    eval_rows = [r for group in by_cat.values() for r in group[: max(1, round(len(group) * 0.08))]]
    eval_ids = {r["id"] for r in eval_rows}
    train_rows = [r for r in rows if r["id"] not in eval_ids]

    OUT.mkdir(parents=True, exist_ok=True)
    keyed = lambda r: {"id": r["id"], **{k: r[k] for k in ("category", "format", "messages", "language", "source")}}  # noqa: E731
    for name, data in (("tutor_train.jsonl", train_rows), ("tutor_eval.jsonl", eval_rows)):
        (OUT / name).write_text("\n".join(json.dumps(keyed(r), ensure_ascii=False) for r in data) + "\n", encoding="utf-8")
    stats = {"train": len(train_rows), "eval": len(eval_rows), "dropped_by_verifier": dict(dropped),
             "by_category": dict(Counter(r["category"] for r in rows)), "by_language": dict(Counter(r["language"] for r in rows))}
    (OUT / "tutor_stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(stats, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
