import os
import json
import csv
import glob
import pymupdf
import pyarrow.parquet as pq

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, "00_listos_para_rag_y_entrenamiento")
os.makedirs(OUT_DIR, exist_ok=True)


def write_jsonl(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    count = 0
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
            count += 1
    return count


def read_jsonl(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def extract_pdf_to_jsonl_and_txt(pdf_path, jsonl_out, txt_out, book_title, institution, license_str):
    if not os.path.exists(pdf_path):
        print(f"  [WARN] PDF missing: {pdf_path}")
        return []
    doc = pymupdf.open(pdf_path)
    pages_data = []
    full_txt_parts = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if len(text) < 40:
            continue
        # Clean excessive whitespace lines
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        cleaned = "\n".join(lines)
        rec = {
            "id": f"{os.path.basename(pdf_path)}_p{i+1}",
            "title": f"{book_title} - Pagina {i+1}",
            "page": i + 1,
            "text": cleaned,
            "source": book_title,
            "institution": institution,
            "license": license_str,
            "commercial_safe": True,
        }
        pages_data.append(rec)
        full_txt_parts.append(f"--- PAGE {i+1} ---\n{cleaned}\n")

    write_jsonl(jsonl_out, pages_data)
    with open(txt_out, "w", encoding="utf-8") as f:
        f.write("\n".join(full_txt_parts))
    print(f"  [PDF] {os.path.basename(pdf_path)}: {len(pages_data)}/{len(doc)} pages extracted")
    return pages_data


def format_mmlu_choice(question, choices, answer_idx):
    letters = ["A", "B", "C", "D"]
    opts = "\n".join(f"{letters[i]}. {c}" for i, c in enumerate(choices) if i < len(letters))
    ans_letter = letters[answer_idx] if 0 <= answer_idx < len(choices) else ""
    ans_text = choices[answer_idx] if 0 <= answer_idx < len(choices) else ""
    return opts, f"{ans_letter}. {ans_text}".strip()


def process_all():
    espacio_sft = []
    espacio_rag = []
    historia_sft = []
    historia_rag = []

    print("1. Procesando NASA IMPACT SDE IR v5...")
    sde_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "nasa_impact_sde_ir_v5")
    sde_corpus_path = os.path.join(sde_dir, "corpus.jsonl")
    sde_queries_path = os.path.join(sde_dir, "queries.jsonl")
    sde_qa_tsv = os.path.join(sde_dir, "qrels", "qa_pairs.tsv")
    if os.path.exists(sde_corpus_path) and os.path.exists(sde_queries_path):
        sde_corpus = {}
        for r in read_jsonl(sde_corpus_path):
            cid = str(r.get("_id", ""))
            txt = (r.get("text") or "").strip()
            title = (r.get("title") or "").strip()
            full_txt = f"{title}\n{txt}".strip() if title else txt
            if cid and full_txt:
                sde_corpus[cid] = full_txt
                espacio_rag.append({
                    "id": f"nasa_sde_{cid}",
                    "title": title or "NASA Science Discovery Engine Document",
                    "text": full_txt,
                    "topic": "space_and_nasa_science",
                    "source": "nasa-impact/nasa-sde-IR-benchmark-20251024-v5",
                    "institution": "NASA IMPACT (Marshall Space Flight Center)",
                    "license": "CC-BY-4.0",
                    "commercial_safe": True,
                })
        sde_queries = {str(r.get("_id", "")): (r.get("text") or "").strip() for r in read_jsonl(sde_queries_path)}
        if os.path.exists(sde_qa_tsv):
            sde_qa_rows = []
            with open(sde_qa_tsv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f, delimiter="\t")
                for row in reader:
                    qid = str(row.get("query-id", "")).strip()
                    cid = str(row.get("corpus-id", "")).strip()
                    score = str(row.get("score", "1")).strip()
                    if score != "0" and qid in sde_queries and cid in sde_corpus:
                        item = {
                            "instruction": sde_queries[qid],
                            "input": "",
                            "output": sde_corpus[cid],
                            "topic": "space_and_nasa_science",
                            "source": "nasa-impact/nasa-sde-IR-benchmark-20251024-v5",
                            "institution": "NASA IMPACT (Marshall Space Flight Center)",
                            "license": "CC-BY-4.0",
                            "commercial_safe": True,
                        }
                        sde_qa_rows.append(item)
                        espacio_sft.append(item)
            write_jsonl(os.path.join(sde_dir, "nasa_sde_qa_pares.jsonl"), sde_qa_rows)
            print(f"  NASA SDE: {len(sde_corpus)} corpus docs, {len(sde_qa_rows)} QA pairs")

    print("2. Procesando NASA IMPACT SMD IR Benchmark...")
    smd_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "nasa_impact_smd_ir")
    smd_corpus_path = os.path.join(smd_dir, "corpus.jsonl")
    if os.path.exists(smd_corpus_path):
        smd_cnt = 0
        for r in read_jsonl(smd_corpus_path):
            cid = str(r.get("_id", smd_cnt))
            title = (r.get("title") or "").strip()
            txt = (r.get("text") or "").strip()
            full_txt = f"{title}\n{txt}".strip() if title else txt
            if full_txt:
                espacio_rag.append({
                    "id": f"nasa_smd_{cid}",
                    "title": title or "NASA SMD / ADS Scientific Abstract",
                    "text": full_txt,
                    "topic": "nasa_smd_astrophysics_and_science",
                    "source": "nasa-impact/nasa-smd-IR-benchmark",
                    "institution": "NASA Science Mission Directorate & IBM Research",
                    "license": "CC",
                    "commercial_safe": True,
                })
                smd_cnt += 1
        print(f"  NASA SMD: {smd_cnt} corpus docs")

    print("3. Procesando SAO/NASA ADS SciX UAT Keywords...")
    ads_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "sao_nasa_ads_uat")
    for split_name, fname in [("train", "train-00000-of-00001-b21313e511aa601a.parquet"), ("val", "val-00000-of-00001-66ce8665444026dc.parquet")]:
        ppath = os.path.join(ads_dir, "data", fname)
        if os.path.exists(ppath):
            rows = pq.read_table(ppath).to_pylist()
            write_jsonl(os.path.join(ads_dir, f"scix_uat_{split_name}.jsonl"), rows)
            for row in rows:
                title = (row.get("title") or "").strip()
                abstract = (row.get("abstract") or "").strip()
                labels = row.get("verified_uat_labels") or []
                bib = row.get("bibcode") or ""
                if title and abstract:
                    espacio_rag.append({
                        "id": f"ads_{bib}",
                        "title": title,
                        "text": f"Title: {title}\nTopics (UAT): {', '.join(labels)}\nAbstract: {abstract}",
                        "topic": "astrophysics_astronomy",
                        "source": "adsabs/SciX_UAT_keywords",
                        "institution": "SAO/NASA Astrophysics Data System (Harvard-Smithsonian CfA)",
                        "license": "MIT",
                        "commercial_safe": True,
                    })
            print(f"  SAO/NASA ADS {split_name}: {len(rows)} papers")

    print("4. Procesando UniverseTBD arxiv-qa-astro-ph...")
    utbd_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "universetbd_arxiv_astro_qa")
    utbd_pq = os.path.join(utbd_dir, "data", "train-00000-of-00001-5a3764b3cbfd1977.parquet")
    if os.path.exists(utbd_pq):
        rows = pq.read_table(utbd_pq).to_pylist()
        write_jsonl(os.path.join(utbd_dir, "arxiv_qa_astro_ph.jsonl"), rows)
        for row in rows:
            q = (row.get("question") or "").strip()
            a = (row.get("answer") or "").strip()
            if q and a:
                espacio_sft.append({
                    "instruction": q,
                    "input": "",
                    "output": a,
                    "topic": "astrophysics_qa",
                    "source": "UniverseTBD/arxiv-qa-astro-ph",
                    "institution": "UniverseTBD (ANU, Harvard CfA, STScI, NASA ADS, ESA, ETH Zurich)",
                    "license": "Sin licencia explicita en HF (derivado de arXiv astro-ph)",
                    "commercial_safe": None,
                })
        print(f"  UniverseTBD QA: {len(rows)} pairs")

    print("5. Extrayendo texto de OpenStax Astronomy 2e (Rice University)...")
    astro_pdf_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "openstax_astronomy_2e_rice")
    astro_pages = extract_pdf_to_jsonl_and_txt(
        os.path.join(astro_pdf_dir, "Astronomy_2e_OpenStax_Rice.pdf"),
        os.path.join(astro_pdf_dir, "astronomy_2e_paginas.jsonl"),
        os.path.join(astro_pdf_dir, "astronomy_2e_texto.txt"),
        "OpenStax Astronomy 2e",
        "Rice University (OpenStax)",
        "CC-BY-4.0",
    )
    for p in astro_pages:
        p_copy = dict(p)
        p_copy["topic"] = "astronomy_textbook"
        espacio_rag.append(p_copy)

    print("6. Procesando UC Berkeley MMLU (Ciencia + Historia)...")
    mmlu_sci_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "uc_berkeley_mmlu_ciencia")
    for sub in ["astronomy", "college_physics", "conceptual_physics", "high_school_physics"]:
        sub_rows = []
        for split in ["dev", "validation", "test"]:
            pp = os.path.join(mmlu_sci_dir, sub, f"{split}-00000-of-00001.parquet")
            if os.path.exists(pp):
                for r in pq.read_table(pp).to_pylist():
                    opts, ans = format_mmlu_choice(r["question"], r["choices"], r["answer"])
                    rec = {
                        "split": split,
                        "subject": sub,
                        "question": r["question"],
                        "choices": r["choices"],
                        "answer_index": r["answer"],
                        "answer_text": ans,
                    }
                    sub_rows.append(rec)
                    espacio_sft.append({
                        "instruction": r["question"],
                        "input": f"Options:\n{opts}",
                        "output": ans,
                        "topic": sub,
                        "source": f"cais/mmlu/{sub}",
                        "institution": "UC Berkeley (Center for AI Safety)",
                        "license": "MIT",
                        "commercial_safe": True,
                    })
        if sub_rows:
            write_jsonl(os.path.join(mmlu_sci_dir, f"mmlu_{sub}.jsonl"), sub_rows)
            print(f"  MMLU {sub}: {len(sub_rows)} questions")

    mmlu_hist_dir = os.path.join(BASE_DIR, "04_historia_general", "uc_berkeley_mmlu_historia")
    for sub in ["prehistory", "high_school_world_history", "high_school_european_history", "high_school_us_history", "world_religions"]:
        sub_rows = []
        for split in ["dev", "validation", "test"]:
            pp = os.path.join(mmlu_hist_dir, sub, f"{split}-00000-of-00001.parquet")
            if os.path.exists(pp):
                for r in pq.read_table(pp).to_pylist():
                    opts, ans = format_mmlu_choice(r["question"], r["choices"], r["answer"])
                    rec = {
                        "split": split,
                        "subject": sub,
                        "question": r["question"],
                        "choices": r["choices"],
                        "answer_index": r["answer"],
                        "answer_text": ans,
                    }
                    sub_rows.append(rec)
                    historia_sft.append({
                        "instruction": r["question"],
                        "input": f"Options:\n{opts}",
                        "output": ans,
                        "topic": sub,
                        "source": f"cais/mmlu/{sub}",
                        "institution": "UC Berkeley (Center for AI Safety)",
                        "license": "MIT",
                        "commercial_safe": True,
                    })
        if sub_rows:
            write_jsonl(os.path.join(mmlu_hist_dir, f"mmlu_{sub}.jsonl"), sub_rows)
            print(f"  MMLU {sub}: {len(sub_rows)} questions")

    print("7. Procesando TIGER-Lab MMLU-Pro (Astronomia/Fisica + Historia con CoT)...")
    mpro_raw = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "uwaterloo_osu_mmlu_pro_ciencia", "_raw_mmlu_pro", "data")
    mpro_sci_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "uwaterloo_osu_mmlu_pro_ciencia")
    mpro_hist_dir = os.path.join(BASE_DIR, "04_historia_general", "uwaterloo_osu_mmlu_pro_historia")
    sci_pro, hist_pro = [], []
    letters = "ABCDEFGHIJ"
    for split in ["validation", "test"]:
        pp = os.path.join(mpro_raw, f"{split}-00000-of-00001.parquet")
        if os.path.exists(pp):
            for r in pq.read_table(pp).to_pylist():
                cat = r.get("category", "")
                src = str(r.get("src", ""))
                opts = "\n".join(f"{letters[i]}. {o}" for i, o in enumerate(r["options"]) if i < len(letters))
                ans_idx = r.get("answer_index", 0)
                ans_str = f"{r.get('answer', '')}. {r['options'][ans_idx]}" if 0 <= ans_idx < len(r["options"]) else str(r.get("answer", ""))
                cot = (r.get("cot_content") or "").strip()
                out = f"{cot}\nFinal Answer: {ans_str}".strip() if cot else ans_str
                rec = dict(r)
                rec["split"] = split
                if src == "ori_mmlu-astronomy" or cat == "physics":
                    sci_pro.append(rec)
                    espacio_sft.append({
                        "instruction": r["question"],
                        "input": f"Options:\n{opts}",
                        "output": out,
                        "topic": "astronomy" if "astronomy" in src else "physics",
                        "source": "TIGER-Lab/MMLU-Pro",
                        "institution": "University of Waterloo, Ohio State University & CMU",
                        "license": "MIT",
                        "commercial_safe": True,
                    })
                elif cat == "history":
                    hist_pro.append(rec)
                    historia_sft.append({
                        "instruction": r["question"],
                        "input": f"Options:\n{opts}",
                        "output": out,
                        "topic": src or "history",
                        "source": "TIGER-Lab/MMLU-Pro",
                        "institution": "University of Waterloo, Ohio State University & CMU",
                        "license": "MIT",
                        "commercial_safe": True,
                    })
    write_jsonl(os.path.join(mpro_sci_dir, "mmlu_pro_astronomy_y_fisica.jsonl"), sci_pro)
    write_jsonl(os.path.join(mpro_hist_dir, "mmlu_pro_historia.jsonl"), hist_pro)
    print(f"  MMLU-Pro: {len(sci_pro)} ciencia, {len(hist_pro)} historia")

    print("8. Procesando AllenAI SciQ y AI2 ARC...")
    sciq_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "allenai_sciq")
    sciq_all = []
    for split in ["train", "validation", "test"]:
        pp = os.path.join(sciq_dir, "data", f"{split}-00000-of-00001.parquet")
        if os.path.exists(pp):
            for r in pq.read_table(pp).to_pylist():
                r["split"] = split
                sciq_all.append(r)
                espacio_sft.append({
                    "instruction": r["question"],
                    "input": f"Context: {r['support']}" if r.get("support") else "",
                    "output": r["correct_answer"],
                    "topic": "science_qa",
                    "source": "allenai/sciq",
                    "institution": "Allen Institute for AI (AI2)",
                    "license": "CC-BY-NC-3.0",
                    "commercial_safe": False,
                })
    write_jsonl(os.path.join(sciq_dir, "sciq_completo.jsonl"), sciq_all)
    print(f"  AllenAI SciQ: {len(sciq_all)} questions (CC-BY-NC-3.0)")

    arc_dir = os.path.join(BASE_DIR, "01_espacio_qa_y_rag", "allenai_ai2_arc")
    arc_all = []
    for subset in ["ARC-Challenge", "ARC-Easy"]:
        for split in ["train", "validation", "test"]:
            pp = os.path.join(arc_dir, subset, f"{split}-00000-of-00001.parquet")
            if os.path.exists(pp):
                for r in pq.read_table(pp).to_pylist():
                    r["subset"] = subset
                    r["split"] = split
                    arc_all.append(r)
                    ch_labels = r["choices"]["label"]
                    ch_texts = r["choices"]["text"]
                    opts = "\n".join(f"{lbl}. {txt}" for lbl, txt in zip(ch_labels, ch_texts))
                    ans_key = r["answerKey"]
                    ans_map = dict(zip(ch_labels, ch_texts))
                    ans_out = f"{ans_key}. {ans_map.get(ans_key, '')}".strip()
                    espacio_sft.append({
                        "instruction": r["question"],
                        "input": f"Options:\n{opts}",
                        "output": ans_out,
                        "topic": f"science_reasoning_{subset}",
                        "source": f"allenai/ai2_arc/{subset}",
                        "institution": "Allen Institute for AI (AI2)",
                        "license": "CC-BY-SA-4.0",
                        "commercial_safe": True,
                    })
    write_jsonl(os.path.join(arc_dir, "ai2_arc_completo.jsonl"), arc_all)
    print(f"  AllenAI ARC: {len(arc_all)} questions")

    print("9. Procesando NASA Exoplanet Archive (Caltech/IPAC) para RAG...")
    exo_json = os.path.join(BASE_DIR, "02_espacio_catalogos_y_datos_reales", "nasa_exoplanet_archive_caltech", "exoplanets_confirmed_pscomppars.json")
    exo_rag_out = os.path.join(BASE_DIR, "02_espacio_catalogos_y_datos_reales", "nasa_exoplanet_archive_caltech", "exoplanets_rag_fichas.jsonl")
    if os.path.exists(exo_json):
        with open(exo_json, "r", encoding="utf-8") as f:
            planets = json.load(f)
        exo_rows = []
        for p in planets:
            name = p.get("pl_name")
            host = p.get("hostname")
            txt = (
                f"Exoplanet {name} orbits host star {host} "
                f"(spectral type: {p.get('st_spectype') or 'unknown'}, stellar effective temp: {p.get('st_teff')} K, "
                f"distance: {p.get('sy_dist')} parsecs). "
                f"Discovered in {p.get('disc_year')} via {p.get('discoverymethod')} at {p.get('disc_facility')}. "
                f"Orbital period: {p.get('pl_orbper')} days; semi-major axis: {p.get('pl_orbsmax')} AU; "
                f"radius: {p.get('pl_rade')} Earth radii; mass: {p.get('pl_bmasse')} Earth masses; "
                f"equilibrium temperature: {p.get('pl_eqt')} K; eccentricity: {p.get('pl_orbeccen')}."
            )
            rec = {
                "id": f"exo_{name}".replace(" ", "_"),
                "title": f"NASA Confirmed Exoplanet: {name}",
                "text": txt,
                "topic": "exoplanets_catalog",
                "source": "NASA Exoplanet Archive (pscomppars)",
                "institution": "Caltech / IPAC & NASA Exoplanet Science Institute",
                "license": "Public Domain (US Gov / NASA)",
                "commercial_safe": True,
            }
            exo_rows.append(rec)
            espacio_rag.append(rec)
        write_jsonl(exo_rag_out, exo_rows)
        print(f"  Exoplanets RAG fichas: {len(exo_rows)}")

    print("10. Procesando Smithsonian National Air and Space Museum (NASM)...")
    nasm_dir = os.path.join(BASE_DIR, "03_historia_espacial", "smithsonian_nasm_air_and_space")
    nasm_shards = sorted(glob.glob(os.path.join(nasm_dir, "raw_edan_shards", "*.txt")))
    nasm_clean = []
    for sp in nasm_shards:
        for obj in read_jsonl(sp):
            content = obj.get("content", {})
            desc_no = content.get("descriptiveNonRepeating", {})
            freetext = content.get("freetext", {})
            indexed = content.get("indexedStructured", {})
            title_obj = desc_no.get("title", {})
            title = title_obj.get("content", "") if isinstance(title_obj, dict) else str(title_obj)
            notes = [n.get("content", "") for n in freetext.get("notes", []) if n.get("content")]
            names = [f"{n.get('label', 'Name')}: {n.get('content', '')}" for n in freetext.get("name", []) if n.get("content")]
            dates = [d.get("content", "") for d in freetext.get("date", []) if d.get("content")]
            topics = indexed.get("topic", [])
            body_parts = []
            if dates:
                body_parts.append(f"Date: {', '.join(dates)}")
            if names:
                body_parts.append("; ".join(names))
            if topics:
                body_parts.append(f"Topics: {', '.join(topics)}")
            if notes:
                body_parts.append("\n".join(notes))
            full_txt = f"{title}\n" + "\n".join(body_parts)
            if title and notes:
                rec = {
                    "id": f"nasm_{obj.get('id', len(nasm_clean))}",
                    "title": title,
                    "text": full_txt.strip(),
                    "topic": "aerospace_and_space_history",
                    "source": "Smithsonian Open Access (NASM)",
                    "institution": "Smithsonian Institution - National Air and Space Museum",
                    "license": "CC0-1.0",
                    "commercial_safe": True,
                }
                nasm_clean.append(rec)
                historia_rag.append(rec)
                espacio_rag.append(rec)
    write_jsonl(os.path.join(nasm_dir, "nasm_artefactos_limpios.jsonl"), nasm_clean)
    print(f"  Smithsonian NASM: {len(nasm_clean)} artifact records with descriptions")

    print("11. Procesando NASA Apollo Transcripts y NASA NTRS...")
    apollo_dir = os.path.join(BASE_DIR, "03_historia_espacial", "nasa_apollo_journals_transcripts")
    a11_pdf = os.path.join(apollo_dir, "apollo11_technical_transcript.pdf")
    if os.path.exists(a11_pdf):
        a11_pages = extract_pdf_to_jsonl_and_txt(
            a11_pdf,
            os.path.join(apollo_dir, "apollo11_transcript_paginas.jsonl"),
            os.path.join(apollo_dir, "apollo11_transcript_texto.txt"),
            "NASA Apollo 11 Technical Air-to-Ground Transcript",
            "NASA Johnson Space Center / Apollo Lunar Surface Journal",
            "Public Domain (US Gov / NASA)",
        )
        for p in a11_pages:
            p_copy = dict(p)
            p_copy["topic"] = "apollo11_mission_history"
            historia_rag.append(p_copy)

    a13_txt = os.path.join(apollo_dir, "apollo13_technical_transcript.txt")
    if os.path.exists(a13_txt):
        with open(a13_txt, "r", encoding="utf-8", errors="replace") as f:
            lines = [ln.strip() for ln in f if ln.strip()]
        chunk_size = 80
        a13_chunks = 0
        for idx in range(0, len(lines), chunk_size):
            chunk = "\n".join(lines[idx:idx + chunk_size])
            if len(chunk) > 100:
                historia_rag.append({
                    "id": f"apollo13_chunk_{a13_chunks}",
                    "title": f"NASA Apollo 13 Technical Air-to-Ground Transcript (Segment {a13_chunks + 1})",
                    "text": chunk,
                    "topic": "apollo13_mission_history",
                    "source": "NASA Apollo Lunar Surface Journal (AS13_TEC.txt)",
                    "institution": "NASA Manned Spacecraft Center / Apollo Lunar Surface Journal",
                    "license": "Public Domain (US Gov / NASA)",
                    "commercial_safe": True,
                })
                a13_chunks += 1
        print(f"  Apollo 13 chunks: {a13_chunks}")

    ntrs_path = os.path.join(BASE_DIR, "03_historia_espacial", "nasa_ntrs_space_history", "nasa_ntrs_space_history.jsonl")
    if os.path.exists(ntrs_path):
        ntrs_cnt = 0
        for r in read_jsonl(ntrs_path):
            rec = {
                "id": f"ntrs_{r['ntrs_id']}",
                "title": r["title"],
                "text": f"Title: {r['title']}\nDate: {r.get('publication_date', '')}\nTopic: {r.get('query_topic', '')}\nAbstract: {r['abstract']}",
                "topic": "nasa_space_history",
                "source": "NASA Technical Reports Server (NTRS)",
                "institution": "NASA Scientific and Technical Information Program",
                "license": "Public Domain (US Gov / NASA)",
                "commercial_safe": True,
            }
            historia_rag.append(rec)
            espacio_rag.append(rec)
            ntrs_cnt += 1
        print(f"  NASA NTRS abstracts: {ntrs_cnt}")

    print("12. Extrayendo OpenStax World History Vol 1 & Vol 2 (Rice University)...")
    wh_dir = os.path.join(BASE_DIR, "04_historia_general", "openstax_world_history_rice")
    for vol, pdf_name, j_name, t_name in [
        ("Volume 1 (to 1500)", "World_History_Volume_1_to_1500_OpenStax_Rice.pdf", "world_history_vol1_paginas.jsonl", "world_history_vol1_texto.txt"),
        ("Volume 2 (from 1400)", "World_History_Volume_2_from_1400_OpenStax_Rice.pdf", "world_history_vol2_paginas.jsonl", "world_history_vol2_texto.txt"),
    ]:
        pages = extract_pdf_to_jsonl_and_txt(
            os.path.join(wh_dir, pdf_name),
            os.path.join(wh_dir, j_name),
            os.path.join(wh_dir, t_name),
            f"OpenStax World History {vol}",
            "Rice University (OpenStax)",
            "CC-BY-4.0",
        )
        for p in pages:
            p_copy = dict(p)
            p_copy["topic"] = "world_history_textbook"
            historia_rag.append(p_copy)

    print("13. Guardando corpus combinados en 00_listos_para_rag_y_entrenamiento/...")
    c1 = write_jsonl(os.path.join(OUT_DIR, "espacio_sft_qa.jsonl"), espacio_sft)
    c2 = write_jsonl(os.path.join(OUT_DIR, "espacio_rag_corpus.jsonl"), espacio_rag)
    c3 = write_jsonl(os.path.join(OUT_DIR, "historia_sft_qa.jsonl"), historia_sft)
    c4 = write_jsonl(os.path.join(OUT_DIR, "historia_rag_corpus.jsonl"), historia_rag)
    print(f"\nRESUMEN FINAL:")
    print(f"  espacio_sft_qa.jsonl     : {c1} ejemplos")
    print(f"  espacio_rag_corpus.jsonl : {c2} documentos")
    print(f"  historia_sft_qa.jsonl    : {c3} ejemplos")
    print(f"  historia_rag_corpus.jsonl: {c4} documentos")


if __name__ == "__main__":
    process_all()
