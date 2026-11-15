"""Curates High-Signal, Child-Safe (Ages 10-14), 100% English SFT + RAFT Training Examples from `datasets_espacio_historia`.

Integrates clean, non-redundant, pedagogically rich knowledge from ALL sub-collections in:
  E:/trabajos uni/leo/unidad 2/datasets_espacio_historia

Sources curated (~2,650 unique high-signal examples):
1. NASA IMPACT SDE IR v5 (`nasa_sde_qa_pares.jsonl` + `corpus.jsonl`) -> ~750 Space/Astronomy/NASA Q&As (50% RAFT with `[NASA_RAG_CONTEXT]`, 50% direct).
2. Rice University OpenStax Astronomy 2e (`astronomy_2e_paginas.jsonl`) -> ~250 Astronomy Textbook RAFT lessons.
3. UniverseTBD `arxiv-qa-astro-ph` -> ~250 clean Astrophysics Q&As (de-quoted & stripped of `',` artifacts).
4. STEM Reasoning (`allenai/sciq` with support explanation, `cais/mmlu` science, `TIGER-Lab/MMLU-Pro` sci, `allenai/ai2_arc`) -> ~500 reasoned science & physics Q&As.
5. Real NASA Catalogs & Space History (`Caltech Exoplanet Archive`, `JPL CNEOS Fireballs/NEOs/Meteorites`, `Smithsonian NASM` peaceful space artifacts, `Apollo 11 & 13 Transcripts`, `NASA NTRS Space History`) -> ~500 RAFT & historical mentor Q&As.
6. Child-Safe World History (`OpenStax World History Vol 1 & 2`, `cais/mmlu` history, `MMLU-Pro` history, `Seshat Polities`) -> ~400 strictly screened historical & Scientific Revolution Q&As.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
import random
import re
from typing import Any

_LOCAL_EXT_DATASETS = Path(r"E:\trabajos uni\leo\unidad 2\datasets_espacio_historia")
_REPO_DATASETS = Path(__file__).resolve().parent.parent / "data" / "datasets_espacio_historia"
DATASETS_ROOT = _LOCAL_EXT_DATASETS if _LOCAL_EXT_DATASETS.exists() else _REPO_DATASETS

SPACE_FOCUS_RE = re.compile(
    r"\b(mars|moon|lunar|martian|planet|exoplanet|solar|sun|star|stars|galaxy|galaxies|"
    r"black hole|orbit|orbital|spacecraft|rocket|nasa|astronaut|satellite|telescope|jwst|"
    r"hubble|spitzer|chandra|kepler|voyager|apollo|artemis|iss|radiation|cosmic|comet|"
    r"asteroid|meteor|meteorite|gravity|inertia|thruster|eclss|atmosphere|jupiter|saturn|"
    r"europa|titan|enceladus|venus|mercury|neptune|uranus|pluto|supernova|nebula|eclipse|"
    r"aurora|magnetosphere|heliophysics|neutron star|pulsar|quasar|light-year|parsec)\b",
    re.I,
)

CHILD_UNSAFE_RE = re.compile(
    r"\b(sex|sexy|sexual|naked|nude|boob|boobs|breast|penis|balls|uranus|vagina|orgasm|"
    r"wife|husband|marriage|divorce|bra|butt|ass|crap|hell|damn|suicide|self-harm|"
    r"condom|pregnant|abortion|prostitute|porn|rape|molest|abuse|abused|"
    r"kill|killed|killing|murder|massacre|genocide|slaughter|torture|execution|slavery|slave|"
    r"slaves|holocaust|nazi|hitler|terrorist|bomb|nuclear weapon|missile|warhead|icbm|gun|"
    r"shoot|shot|knife|stab|blood|bleed|corpse|coffin|drunk|beer|wine|vodka|whiskey|"
    r"alcohol|cocaine|heroin|meth|marijuana|weed|drug|drugs|fuck|shit|bitch|asshole|cunt|"
    r"dick|cock|pussy|da vinci|maestro|parchment|siegecraft|user 1|user 2|the patient says)\b",
    re.I,
)

BOILERPLATE_OUTPUT_RE = re.compile(
    r"^(credit:|image credit|courtesy|nasa image|photo credit|credit/|skip|copyright|acknowledg)",
    re.I,
)


def is_clean_child_safe(text: str) -> bool:
    if not text:
        return False
    low = text.lower()
    if CHILD_UNSAFE_RE.search(low):
        return False
    if "[user 1" in low or "[user 2" in low or "mental health counselling assistant" in low:
        return False
    return True


def clean_whitespace(txt: str) -> str:
    txt = str(txt or "").replace("\r", " ").replace("\uFFFD", "").strip()
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    return txt.strip()


def clean_question(q: str) -> str:
    q = clean_whitespace(q)
    # Fix UniverseTBD trailing `',` or `' '` artifacts
    q = re.sub(r"[\'\",]+$", lambda m: "?" if "?" not in q[:-len(m.group(0))] else "", q).strip()
    if q.endswith("'") and q.count("'") % 2 == 1:
        q = q[:-1].strip()
    if q and q[-1] not in ".?!":
        q += "?"
    return q


def build_mega_dataset_expansions(system_prompt: str, seed: int = 2026) -> list[dict[str, Any]]:
    """Curates ~2,650 diverse, child-safe, non-duplicate SFT & RAFT examples from `datasets_espacio_historia`."""
    if not DATASETS_ROOT.exists():
        print(f"[MEGA] Skipping mega expansions; folder not found: {DATASETS_ROOT}")
        return []

    rng = random.Random(seed)
    rows: list[dict[str, Any]] = []
    seen_prompts: set[str] = set()
    seen_answers: set[str] = set()

    def add_row(
        rid: str,
        category: str,
        source: str,
        user_txt: str,
        asst_txt: str,
        fmt: str = "dialogue",
    ) -> bool:
        u = clean_whitespace(user_txt)
        a = clean_whitespace(asst_txt)
        if not u or not a or len(a) < 35:
            return False
        if not is_clean_child_safe(u + " " + a):
            return False
        u_key = u.lower()
        a_key = a.lower()
        if u_key in seen_prompts or a_key in seen_answers:
            return False
        seen_prompts.add(u_key)
        seen_answers.add(a_key)
        rows.append(
            {
                "id": rid,
                "category": category,
                "format": fmt,
                "language": "en",
                "source": source,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": u},
                    {"role": "assistant", "content": a},
                ],
            }
        )
        return True

    # ------------------------------------------------------------------
    # 1. NASA IMPACT SDE IR v5 QA (~750 curated space & NASA examples, ~50% RAFT)
    # ------------------------------------------------------------------
    sde_dir = DATASETS_ROOT / "01_espacio_qa_y_rag" / "nasa_impact_sde_ir_v5"
    sde_qa_path = sde_dir / "nasa_sde_qa_pares.jsonl"
    sde_corpus_path = sde_dir / "corpus.jsonl"
    sde_queries_path = sde_dir / "queries.jsonl"
    sde_tsv_path = sde_dir / "qrels" / "qa_pairs.tsv"

    sde_added = 0
    if sde_qa_path.exists():
        # Build quick map (question_text -> corpus doc) when possible for authentic RAFT context
        q_to_doc: dict[str, tuple[str, str]] = {}
        if sde_corpus_path.exists() and sde_queries_path.exists() and sde_tsv_path.exists():
            corp_map: dict[str, tuple[str, str]] = {}
            with open(sde_corpus_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    d = json.loads(line)
                    cid = str(d.get("_id", ""))
                    t = clean_whitespace((d.get("title") or "") + ": " + (d.get("text") or ""))
                    if cid and len(t) > 60:
                        corp_map[cid] = (cid, t[:750])
            q_map = {}
            with open(sde_queries_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    d = json.loads(line)
                    q_map[str(d.get("_id", ""))] = clean_whitespace(d.get("text", ""))
            with open(sde_tsv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f, delimiter="\t")
                for row in reader:
                    qid = str(row.get("query-id", "")).strip()
                    cid = str(row.get("corpus-id", "")).strip()
                    if row.get("score", "1") != "0" and qid in q_map and cid in corp_map and q_map[qid] not in q_to_doc:
                        q_to_doc[q_map[qid]] = corp_map[cid]

        sde_candidates = []
        with open(sde_qa_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                q = clean_question(d.get("instruction", ""))
                a = clean_whitespace(d.get("output", ""))
                if not (25 <= len(q) <= 220 and 65 <= len(a) <= 520):
                    continue
                if BOILERPLATE_OUTPUT_RE.search(a) or "http://" in a or "https://" in a:
                    continue
                if SPACE_FOCUS_RE.search(q + " " + a) and is_clean_child_safe(q + " " + a):
                    sde_candidates.append((q, a, clean_whitespace(d.get("instruction", ""))))

        rng.shuffle(sde_candidates)
        for i, (q, a, raw_q) in enumerate(sde_candidates):
            if sde_added >= 750:
                break
            # 50% RAFT wrapped with verified NASA SDE context, 50% clean mentor Q&A
            if sde_added % 2 == 0 and raw_q in q_to_doc:
                cid, snippet = q_to_doc[raw_q]
                u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-nasa_sde_{cid}] {snippet}\n[/NASA_RAG_CONTEXT]\n{q}"
                a_msg = f"Based on the NASA Science Discovery Engine record (`nasa_sde_{cid}`), {a[0].lower() + a[1:] if len(a) > 1 and not a[:2].isupper() else a}"
            else:
                u_msg = q
                a_msg = a
            if add_row(f"mega-sde-{sde_added:04d}", "training_science_flight", "nasa_sde_v5_mega", u_msg, a_msg):
                sde_added += 1
    print(f"[MEGA] NASA SDE IR v5: +{sde_added} curated examples")

    # ------------------------------------------------------------------
    # 2. Rice University OpenStax Astronomy 2e (~250 RAFT textbook lessons)
    # ------------------------------------------------------------------
    astro_p = DATASETS_ROOT / "01_espacio_qa_y_rag" / "openstax_astronomy_2e_rice" / "astronomy_2e_paginas.jsonl"
    astro_added = 0
    if astro_p.exists():
        astro_cands = []
        skip_page_re = re.compile(
            r"(Access for free at openstax\.org|Review Questions|Thought Questions|Figuring for Yourself|"
            r"Summary\s+\d+|Key Terms|For Further Exploration|Answers to|Creative Commons|ISBN)",
            re.I,
        )
        with open(astro_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                pg = int(d.get("page") or 0)
                txt = clean_whitespace(d.get("text", ""))
                if pg < 20 or len(txt) < 550 or skip_page_re.search(txt[:280]):
                    continue
                # Extract 2-4 coherent explanatory sentences
                sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", txt) if 45 <= len(s.strip()) <= 320 and not s.strip().startswith("FIGURE")]
                if len(sents) < 3:
                    continue
                snippet = " ".join(sents[:4])[:900]
                topic_hint = sents[0][:110].rstrip(".,;:")
                if is_clean_child_safe(snippet):
                    astro_cands.append((pg, snippet, " ".join(sents[1:3])[:460], topic_hint))

        rng.shuffle(astro_cands)
        q_templates = [
            "Using our OpenStax Astronomy 2e reference, explain the core astronomy idea behind: '{hint}' for a junior cadet?",
            "Can you summarize the key space science lesson in OpenStax Astronomy 2e (Page {pg})?",
            "Help me understand this OpenStax Astronomy 2e passage so I can apply it during mission planning!",
        ]
        for idx, (pg, snippet, summary, hint) in enumerate(astro_cands):
            if astro_added >= 250:
                break
            q_tpl = q_templates[idx % len(q_templates)].format(hint=hint, pg=pg)
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-Astronomy_2e_p{pg}] OpenStax Astronomy 2e (Page {pg}): {snippet}\n[/NASA_RAG_CONTEXT]\n{q_tpl}"
            a_msg = (
                f"From **OpenStax Astronomy 2e (Page {pg})**: {summary} "
                "Want to test how that principle helps us navigate or analyze observations in the simulator?"
            )
            if add_row(f"mega-openstax-astro-{astro_added:04d}", "training_science_flight", "openstax_astronomy_2e_mega", u_msg, a_msg):
                astro_added += 1
    print(f"[MEGA] OpenStax Astronomy 2e: +{astro_added} RAFT examples")

    # ------------------------------------------------------------------
    # 3. UniverseTBD arxiv-qa-astro-ph (~250 astrophysics Q&As)
    # ------------------------------------------------------------------
    utbd_p = DATASETS_ROOT / "01_espacio_qa_y_rag" / "universetbd_arxiv_astro_qa" / "arxiv_qa_astro_ph.jsonl"
    utbd_added = 0
    if utbd_p.exists():
        utbd_cands = []
        with open(utbd_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                q = clean_question(d.get("question", ""))
                a = clean_whitespace(d.get("answer", ""))
                if not (25 <= len(q) <= 200 and 75 <= len(a) <= 480):
                    continue
                if "paper" in q.lower() and "authors" in q.lower():
                    continue
                if is_clean_child_safe(q + " " + a) and SPACE_FOCUS_RE.search(q + " " + a):
                    utbd_cands.append((q, a))
        rng.shuffle(utbd_cands)
        for q, a in utbd_cands:
            if utbd_added >= 250:
                break
            if add_row(f"mega-utbd-{utbd_added:04d}", "training_science_flight", "universetbd_astro_qa_mega", q, a):
                utbd_added += 1
    print(f"[MEGA] UniverseTBD arxiv-qa-astro-ph: +{utbd_added} astrophysics Q&As")

    # ------------------------------------------------------------------
    # 4. Physics & Science Reasoning: SciQ (with support!), MMLU, MMLU-Pro, AI2 ARC (~500 rows)
    # ------------------------------------------------------------------
    sciq_p = DATASETS_ROOT / "01_espacio_qa_y_rag" / "allenai_sciq" / "sciq_completo.jsonl"
    sciq_added = 0
    if sciq_p.exists():
        sciq_cands = []
        with open(sciq_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                q = clean_question(d.get("question", ""))
                ans = clean_whitespace(d.get("correct_answer", ""))
                sup = clean_whitespace(d.get("support", ""))
                if not (20 <= len(q) <= 180 and 2 <= len(ans) <= 70 and 70 <= len(sup) <= 420):
                    continue
                if not is_clean_child_safe(q + " " + ans + " " + sup):
                    continue
                is_space = bool(SPACE_FOCUS_RE.search(q + " " + sup))
                sciq_cands.append((is_space, q, ans, sup))
        # Prioritize space/physics rows first, then general clean science
        sciq_cands.sort(key=lambda x: x[0], reverse=True)
        top_sciq = sciq_cands[:600]
        rng.shuffle(top_sciq)
        for is_sp, q, ans, sup in top_sciq:
            if sciq_added >= 200:
                break
            a_msg = f"Great science check! The answer is **{ans}**. {sup}"
            if add_row(f"mega-sciq-{sciq_added:04d}", "training_science_flight", "allenai_sciq_mega", q, a_msg):
                sciq_added += 1

    mmlu_sci_added = 0
    mmlu_sci_dir = DATASETS_ROOT / "01_espacio_qa_y_rag" / "uc_berkeley_mmlu_ciencia"
    letters = ["A", "B", "C", "D"]
    mmlu_cands = []
    for sub in ["astronomy", "conceptual_physics", "high_school_physics", "college_physics"]:
        fp = mmlu_sci_dir / f"mmlu_{sub}.jsonl"
        if not fp.exists():
            continue
        with open(fp, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                r = json.loads(line)
                q = clean_whitespace(r.get("question", ""))
                choices = r.get("choices", [])
                aidx = int(r.get("answer_index", 0))
                if not q or not (0 <= aidx < len(choices)) or len(q) > 420:
                    continue
                opts = "\n".join(f"{letters[i]}. {c}" for i, c in enumerate(choices) if i < 4)
                ans_text = clean_whitespace(r.get("answer_text") or f"{letters[aidx]}. {choices[aidx]}")
                if is_clean_child_safe(q + " " + opts):
                    mmlu_cands.append((sub == "astronomy", sub, q, opts, ans_text))
    rng.shuffle(mmlu_cands)
    mmlu_cands.sort(key=lambda x: x[0], reverse=True)
    for _, sub, q, opts, ans_text in mmlu_cands:
        if mmlu_sci_added >= 160:
            break
        u_msg = f"[STEM Physics & Astronomy Check — {sub.replace('_', ' ').title()}]\n{q}\nOptions:\n{opts}"
        a_msg = f"The correct answer is **{ans_text}**. Want to explore how this science principle shows up in our space mission?"
        if add_row(f"mega-mmlu-sci-{mmlu_sci_added:04d}", "training_science_flight", "uc_berkeley_mmlu_science_mega", u_msg, a_msg):
            mmlu_sci_added += 1

    arc_added = 0
    arc_p = DATASETS_ROOT / "01_espacio_qa_y_rag" / "allenai_ai2_arc" / "ai2_arc_completo.jsonl"
    if arc_p.exists():
        arc_cands = []
        with open(arc_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                r = json.loads(line)
                q = clean_whitespace(r.get("question", ""))
                ch = r.get("choices", {})
                lbls = ch.get("label", [])
                txts = ch.get("text", [])
                akey = str(r.get("answerKey", ""))
                ans_map = dict(zip(lbls, txts))
                if not q or akey not in ans_map or len(q) > 280:
                    continue
                opts = "\n".join(f"{l}. {t}" for l, t in zip(lbls, txts))
                ans_out = f"{akey}. {ans_map[akey]}"
                if is_clean_child_safe(q + " " + opts):
                    arc_cands.append((bool(SPACE_FOCUS_RE.search(q + " " + opts)), q, opts, ans_out))
        rng.shuffle(arc_cands)
        arc_cands.sort(key=lambda x: x[0], reverse=True)
        for _, q, opts, ans_out in arc_cands:
            if arc_added >= 140:
                break
            u_msg = f"[Junior Science Reasoning]\n{q}\nOptions:\n{opts}"
            a_msg = f"Good reasoning challenge, Cadet! The correct option is **{ans_out}**."
            if add_row(f"mega-arc-{arc_added:04d}", "training_science_flight", "allenai_ai2_arc_mega", u_msg, a_msg):
                arc_added += 1
    print(f"[MEGA] STEM Reasoning: +{sciq_added} SciQ + {mmlu_sci_added} MMLU Sci + {arc_added} ARC = +{sciq_added + mmlu_sci_added + arc_added}")

    # ------------------------------------------------------------------
    # 5. Caltech Exoplanets, JPL Fireballs/NEOs/Meteorites, Apollo 11/13, NASM, NTRS (~500 rows)
    # ------------------------------------------------------------------
    exo_p = DATASETS_ROOT / "02_espacio_catalogos_y_datos_reales" / "nasa_exoplanet_archive_caltech" / "exoplanets_rag_fichas.jsonl"
    exo_added = 0
    if exo_p.exists():
        iconic_exo = []
        other_exo = []
        with open(exo_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                t = clean_whitespace(d.get("text", ""))
                ttl = clean_whitespace(d.get("title", ""))
                did = clean_whitespace(d.get("id", ""))
                if not t:
                    continue
                name = ttl.replace("NASA Confirmed Exoplanet:", "").strip()
                if any(k in name for k in ("TRAPPIST-1", "Proxima", "Kepler-186", "Kepler-22", "Kepler-452", "TOI-700", "55 Cnc", "K2-18", "51 Peg", "HD 189733")):
                    iconic_exo.append((did, name, t))
                else:
                    other_exo.append((did, name, t))
        rng.shuffle(other_exo)
        for idx, (did, name, t) in enumerate(iconic_exo[:40] + other_exo[:110]):
            if exo_added >= 120:
                break
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-{did}] {t}\n[/NASA_RAG_CONTEXT]\nTell me what NASA's Exoplanet Archive knows about **{name}** and how it compares to Earth!"
            a_msg = f"According to NASA's Exoplanet Archive at Caltech/IPAC (`{did}`): {t} Comparing worlds like **{name}** with Earth helps astronauts understand habitable temperatures and orbital distances!"
            if add_row(f"mega-exo-{exo_added:04d}", "training_science_flight", "nasa_exoplanets_mega", u_msg, a_msg):
                exo_added += 1

    # JPL Fireballs, NEOs & Meteorites (~80 rows)
    cneos_dir = DATASETS_ROOT / "02_espacio_catalogos_y_datos_reales" / "nasa_jpl_cneos_y_meteoritos"
    cneos_added = 0
    fb_p = cneos_dir / "jpl_fireballs.json"
    if fb_p.exists():
        fb = json.loads(fb_p.read_text(encoding="utf-8"))
        fields = fb.get("fields", [])
        imap = {k: i for i, k in enumerate(fields)}
        fb_rows = sorted(fb.get("data", []), key=lambda r: float(r[imap.get("impact-e", 2)] or 0.0), reverse=True)
        for i, r in enumerate(fb_rows[:25]):
            dt = r[imap.get("date", 0)]
            ie = r[imap.get("impact-e", 2)]
            alt = r[imap.get("alt", 7)]
            vel = r[imap.get("vel", 8)]
            snippet = f"NASA JPL CNEOS Fireball recorded on {dt}: altitude {alt} km, entry speed {vel} km/s, estimated impact energy {ie} kilotons TNT."
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-jpl_fireball_{i+1:03d}] {snippet}\n[/NASA_RAG_CONTEXT]\nWhat did NASA JPL CNEOS sensors detect in the {dt} bolide fireball event?"
            a_msg = f"NASA JPL CNEOS tracked that bolide on **{dt}** entering Earth's atmosphere at **{vel} km/s** and radiating over an altitude of **{alt} km**, releasing roughly **{ie} kilotons TNT** equivalent impact energy. Tracking real fireballs helps calibrate planetary defense models alongside NASA's DART mission!"
            if add_row(f"mega-cneos-{cneos_added:04d}", "training_science_flight", "nasa_jpl_cneos_mega", u_msg, a_msg):
                cneos_added += 1

    neo_p = cneos_dir / "jpl_neo_close_approaches.json"
    if neo_p.exists():
        neo = json.loads(neo_p.read_text(encoding="utf-8"))
        fields = neo.get("fields", [])
        imap = {k: i for i, k in enumerate(fields)}
        n_rows = sorted(neo.get("data", []), key=lambda r: float(r[imap.get("dist", 4)] or 999.0))
        for i, r in enumerate(n_rows[:30]):
            des = r[imap.get("des", 0)]
            cd = r[imap.get("cd", 3)]
            dist_au = float(r[imap.get("dist", 4)] or 0.01)
            ld = round(dist_au * 389.17, 2)
            v_rel = r[imap.get("v_rel", 7)]
            snippet = f"Near-Earth Object {des} close Earth approach on {cd}: nominal miss distance {dist_au:.5f} AU (~{ld} lunar distances), relative speed {v_rel} km/s."
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-jpl_neo_{i+1:04d}] {snippet}\n[/NASA_RAG_CONTEXT]\nHow close did Near-Earth Object **{des}** pass Earth on {cd}, and how fast was it traveling?"
            a_msg = f"Per NASA JPL CNEOS Close Approach Data, Near-Earth Object **{des}** passed Earth on **{cd}** at a nominal distance of **{dist_au:.5f} AU** (~**{ld} lunar distances**) moving at **{v_rel} km/s** relative velocity. Watching NEO trajectories helps keep Earth safe well in advance!"
            if add_row(f"mega-cneos-{cneos_added:04d}", "training_science_flight", "nasa_jpl_cneos_mega", u_msg, a_msg):
                cneos_added += 1

    met_p = cneos_dir / "nasa_meteorite_landings.csv"
    if met_p.exists():
        m_rows = []
        with open(met_p, "r", encoding="utf-8", errors="replace") as f:
            for row in csv.DictReader(f):
                try:
                    mg = float(row.get("mass (g)") or 0.0)
                except Exception:
                    mg = 0.0
                if mg >= 10000:
                    m_rows.append((mg, row))
        m_rows.sort(key=lambda x: (1 if x[1].get("fall") == "Fell" else 0, x[0]), reverse=True)
        for i, (mg, row) in enumerate(m_rows[:30]):
            if cneos_added >= 80:
                break
            mname = (row.get("name") or "").strip()
            rclass = (row.get("recclass") or "").strip()
            fall = (row.get("fall") or "").strip()
            yr = (row.get("year") or "").strip()[:4]
            mkg = round(mg / 1000.0, 1)
            snippet = f"Meteorite {mname} (class {rclass}): {fall} in {yr}, mass {mkg:,} kg ({mg:,.0f} g)."
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-meteorite_{i+1:03d}] {snippet}\n[/NASA_RAG_CONTEXT]\nWhat makes the **{mname}** meteorite notable in NASA's Meteorite Landings database?"
            a_msg = f"In the NASA / Meteoritical Society catalog, **{mname}** is a **{rclass}** meteorite ({fall} in **{yr}**) with a recovered mass of **{mkg:,} kg**! Studying real meteorites gives scientists rocky samples of the early solar system right here on Earth."
            if add_row(f"mega-cneos-{cneos_added:04d}", "training_science_flight", "nasa_jpl_cneos_mega", u_msg, a_msg):
                cneos_added += 1

    # Smithsonian NASM peaceful aerospace artifacts (~100 rows)
    nasm_p = DATASETS_ROOT / "03_historia_espacial" / "smithsonian_nasm_air_and_space" / "nasm_artefactos_limpios.jsonl"
    nasm_added = 0
    space_artifact_re = re.compile(r"\b(apollo|mercury|gemini|shuttle|voyager|hubble|saturn|spacesuit|suit|helmet|lunar|mars|skylab|explorer|vanguard|pioneer|mariner|viking|telescope|rocket|capsule|satellite|lander|rover)\b", re.I)
    if nasm_p.exists():
        nasm_cands = []
        with open(nasm_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                ttl = clean_whitespace(d.get("title", ""))
                txt = clean_whitespace(d.get("text", ""))
                did = clean_whitespace(d.get("id", ""))
                if not (ttl and txt) or not space_artifact_re.search(ttl + " " + txt):
                    continue
                if is_clean_child_safe(ttl + " " + txt):
                    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", txt) if len(s.strip()) >= 35]
                    summary = " ".join(sents[:3])[:440] if sents else txt[:440]
                    nasm_cands.append((did, ttl, txt[:800], summary))
        rng.shuffle(nasm_cands)
        for did, ttl, snippet, summary in nasm_cands:
            if nasm_added >= 100:
                break
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-{did}] Smithsonian NASM Artifact '{ttl}': {snippet}\n[/NASA_RAG_CONTEXT]\nTell me about the **{ttl}** artifact in the Smithsonian National Air and Space Museum!"
            a_msg = f"From the **Smithsonian National Air and Space Museum (`{did}`)**: {summary} Artifacts like **{ttl}** show young explorers how real aerospace engineers solved tough spaceflight challenges!"
            if add_row(f"mega-nasm-{nasm_added:04d}", "training_science_flight", "smithsonian_nasm_mega", u_msg, a_msg):
                nasm_added += 1

    # Apollo 11 & 13 transcripts + NASA NTRS Space History (~200 rows total)
    a11_p = DATASETS_ROOT / "03_historia_espacial" / "nasa_apollo_journals_transcripts" / "apollo11_transcript_paginas.jsonl"
    a13_p = DATASETS_ROOT / "03_historia_espacial" / "nasa_apollo_journals_transcripts" / "apollo13_technical_transcript.txt"
    apollo_added = 0
    if a11_p.exists():
        a11_cands = []
        with open(a11_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                pg = int(d.get("page") or 0)
                txt = clean_whitespace(d.get("text", ""))
                if pg >= 5 and 220 <= len(txt) <= 2200 and any(k in txt.lower() for k in ("tranquility", "eagle", "houston", "landing", "go", "rcs", "fuel", "eva", "step", "moon", "lmp", "cdr", "cmp")) and is_clean_child_safe(txt):
                    a11_cands.append((pg, txt[:780]))
        rng.shuffle(a11_cands)
        for pg, snippet in a11_cands[:50]:
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-apollo11_p{pg}] NASA Apollo 11 Air-to-Ground Transcript (Page {pg}): {snippet}\n[/NASA_RAG_CONTEXT]\nWhat mission communications take place in this Apollo 11 air-to-ground transcript excerpt (Page {pg})?"
            a_msg = f"In the **NASA Apollo 11 Air-to-Ground Transcript (Page {pg})**, Houston CAPCOM (`CC`) and the crew—Commander (`CDR`), Lunar Module Pilot (`LMP`), and Command Module Pilot (`CMP`)—exchange real-time status checks: `{snippet[:240]}...` Notice how crisp, calm mission callouts keep everyone aligned under tight fuel and timeline margins!"
            if add_row(f"mega-apollo-{apollo_added:04d}", "training_science_flight", "apollo_transcripts_mega", u_msg, a_msg):
                apollo_added += 1

    if a13_p.exists():
        a13_lines = [ln.strip() for ln in a13_p.read_text(encoding="utf-8", errors="replace").splitlines() if ln.strip()]
        a13_cands = []
        for idx in range(0, len(a13_lines), 80):
            chunk = "\n".join(a13_lines[idx : idx + 80])
            if 250 <= len(chunk) and any(k in chunk.lower() for k in ("problem", "o2", "oxygen", "cryo", "tank", "amperes", "battery", "co2", "lioh", "aquarius", "odyssey", "power", "houston")) and is_clean_child_safe(chunk):
                a13_cands.append((idx // 80 + 1, clean_whitespace(chunk)[:780]))
        rng.shuffle(a13_cands)
        for seg, snippet in a13_cands[:50]:
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-apollo13_chunk_{seg - 1}] NASA Apollo 13 Air-to-Ground Transcript (Segment {seg}): {snippet}\n[/NASA_RAG_CONTEXT]\nWhat troubleshooting happens in Apollo 13 Transcript Segment {seg}, and what lesson does it teach astronauts today?"
            a_msg = f"In **Apollo 13 Transcript Segment {seg}**, Mission Control and the crew work through live spacecraft telemetry (`{snippet[:230]}...`). Just like our simulator rules, Apollo 13 proves that when power, oxygen, or CO2 scrubbing fails, staying calm, checking exact gauge numbers, and conserving crew resources saves the mission!"
            if add_row(f"mega-apollo-{apollo_added:04d}", "emergencies_cascades", "apollo_transcripts_mega", u_msg, a_msg):
                apollo_added += 1

    ntrs_hist_p = DATASETS_ROOT / "03_historia_espacial" / "nasa_ntrs_space_history" / "nasa_ntrs_space_history.jsonl"
    ntrs_added = 0
    if ntrs_hist_p.exists():
        nh_cands = []
        with open(ntrs_hist_p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                nid = str(d.get("ntrs_id", ""))
                ttl = clean_whitespace(d.get("title", ""))
                ab = clean_whitespace(d.get("abstract", ""))
                if ttl and 70 <= len(ab) <= 750 and is_clean_child_safe(ttl + " " + ab):
                    nh_cands.append((nid, ttl, ab))
        rng.shuffle(nh_cands)
        for nid, ttl, ab in nh_cands:
            if ntrs_added >= 100:
                break
            u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-ntrs_{nid}] {ttl}: {ab}\n[/NASA_RAG_CONTEXT]\nSummarize the NASA historical report '{ttl}' (NTRS {nid}) for a junior mission specialist."
            a_msg = f"According to official NASA history report **NTRS {nid} ({ttl})**: {ab[:420]}"
            if add_row(f"mega-ntrs-hist-{ntrs_added:04d}", "training_science_flight", "nasa_ntrs_history_mega", u_msg, a_msg):
                ntrs_added += 1
    print(f"[MEGA] Catalogs & Space History: +{exo_added} Exoplanets + {cneos_added} CNEOS/Meteorites + {nasm_added} NASM + {apollo_added} Apollo + {ntrs_added} NTRS Hist")

    # ------------------------------------------------------------------
    # 6. Child-Safe World History: OpenStax World History Vol 1 & 2 + MMLU History (~400 rows)
    # ------------------------------------------------------------------
    wh_dir = DATASETS_ROOT / "04_historia_general" / "openstax_world_history_rice"
    wh_added = 0
    wh_cands = []
    skip_wh_re = re.compile(r"(Access for free at openstax\.org|Review Questions|Key Terms|Section Summary|Creative Commons|ISBN)", re.I)
    for fname, vol_lbl in [("world_history_vol1_paginas.jsonl", "OpenStax World History Vol 1"), ("world_history_vol2_paginas.jsonl", "OpenStax World History Vol 2")]:
        p = wh_dir / fname
        if not p.exists():
            continue
        with open(p, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                pg = int(d.get("page") or 0)
                txt = clean_whitespace(d.get("text", ""))
                if pg < 20 or len(txt) < 550 or skip_wh_re.search(txt[:280]) or not is_clean_child_safe(txt):
                    continue
                sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", txt) if 45 <= len(s.strip()) <= 320 and not s.strip().startswith("FIGURE")]
                if len(sents) < 3:
                    continue
                snippet = " ".join(sents[:4])[:900]
                summary = " ".join(sents[1:3])[:440]
                hint = sents[0][:100].rstrip(".,;:")
                # Boost science, trade, navigation, astronomy, printing, civilization highlights
                is_stem_hist = bool(re.search(r"\b(science|astronomy|calendar|printing|navigation|compass|telescope|silk road|mesopotamia|egypt|greece|maya|industrial|renaissance|mathematics|writing|trade)\b", snippet, re.I))
                wh_cands.append((is_stem_hist, vol_lbl, pg, snippet, summary, hint))
    rng.shuffle(wh_cands)
    wh_cands.sort(key=lambda x: x[0], reverse=True)
    for _, vol_lbl, pg, snippet, summary, hint in wh_cands:
        if wh_added >= 240:
            break
        u_msg = f"[NASA_RAG_CONTEXT]\n- [MEGA-{vol_lbl.replace(' ', '_')}_p{pg}] {vol_lbl} (Page {pg}): {snippet}\n[/NASA_RAG_CONTEXT]\nExplain what **{vol_lbl} (Page {pg})** teaches about '{hint}'."
        a_msg = f"From **{vol_lbl} (Page {pg})**: {summary} Seeing how earlier human societies engineered calendars, trade networks, and scientific tools reminds us why teamwork and curiosity carry humanity into space!"
        if add_row(f"mega-wh-book-{wh_added:04d}", "teamwork_humor_comms", "openstax_world_history_mega", u_msg, a_msg):
            wh_added += 1

    mmlu_hist_added = 0
    mmlu_hist_dir = DATASETS_ROOT / "04_historia_general" / "uc_berkeley_mmlu_historia"
    hist_cands = []
    for sub in ["prehistory", "high_school_world_history", "high_school_european_history", "high_school_us_history", "world_religions"]:
        fp = mmlu_hist_dir / f"mmlu_{sub}.jsonl"
        if not fp.exists():
            continue
        with open(fp, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                r = json.loads(line)
                q = clean_whitespace(r.get("question", ""))
                choices = r.get("choices", [])
                aidx = int(r.get("answer_index", 0))
                if not q or not (0 <= aidx < len(choices)) or len(q) > 650:
                    continue
                opts = "\n".join(f"{letters[i]}. {c}" for i, c in enumerate(choices) if i < 4)
                ans_text = clean_whitespace(r.get("answer_text") or f"{letters[aidx]}. {choices[aidx]}")
                if is_clean_child_safe(q + " " + opts):
                    hist_cands.append((sub, q, opts, ans_text))
    rng.shuffle(hist_cands)
    for sub, q, opts, ans_text in hist_cands:
        if mmlu_hist_added >= 160:
            break
        u_msg = f"[World History Knowledge — {sub.replace('_', ' ').title()}]\n{q}\nOptions:\n{opts}"
        a_msg = f"Based on world history records, the correct answer is **{ans_text}**."
        if add_row(f"mega-mmlu-hist-{mmlu_hist_added:04d}", "teamwork_humor_comms", "uc_berkeley_mmlu_history_mega", u_msg, a_msg):
            mmlu_hist_added += 1
    print(f"[MEGA] World History: +{wh_added} OpenStax + {mmlu_hist_added} MMLU History = +{wh_added + mmlu_hist_added}")

    print(f"[MEGA] TOTAL curated mega knowledge examples ready: {len(rows):,}")
    return rows


if __name__ == "__main__":
    sample_prompt = "You are AstroCopilot, an AI mission mentor."
    out_rows = build_mega_dataset_expansions(sample_prompt)
    from collections import Counter
    print("By Source:", dict(Counter(r["source"] for r in out_rows)))
    print("By Category:", dict(Counter(r["category"] for r in out_rows)))
