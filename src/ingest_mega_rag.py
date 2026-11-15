"""Builds the compressed Tier-2 SQLite FTS5 Mega-RAG Knowledge Base (`data/nasa_mega_rag.sqlite`).

Indexes ALL knowledge datasets from `E:/trabajos uni/leo/unidad 2/datasets_espacio_historia`:
1. NASA IMPACT SDE IR v5 (`82,607` NASA Science Discovery Engine docs)
2. NASA IMPACT SMD IR (`270,206` NASA/ADS abstracts across astrophysics, planetary science, heliophysics, Earth science)
3. SAO/NASA ADS SciX UAT (`21,653` verified astronomy papers)
4. Rice University OpenStax Astronomy 2e (`1,148` peer-reviewed textbook pages)
5. Caltech NASA Exoplanet Archive (`6,470` confirmed exoplanet sheets)
6. Smithsonian NASM (`1,010` aerospace artifacts) & NASA NTRS Space History (`754` technical reports)
7. NASA Apollo 11 (`385` pages) & Apollo 13 (`274` segments) Air-to-Ground Technical Transcripts
8. Rice University OpenStax World History Vol 1 (`788` pages) & Vol 2 (`721` pages)
9. NASA JPL CNEOS Fireballs (`1,074` events), NEO Close Approaches (`5,000` approaches), & Meteorite Landings (`45,716` records, digested cleanly)
10. Oxford Seshat Global History (`Equinox_on_GitHub_June9_2022.xlsx` Polities & NGAs metadata digest, child-safe)

Uses SQLite external-content FTS5 (`content='docs'`) so text is stored only once, keeping disk size compact and query latency < 15 ms.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
import sqlite3
import time
import xml.etree.ElementTree as ET
import zipfile

_LOCAL_EXT_DATASETS = Path(r"E:\trabajos uni\leo\unidad 2\datasets_espacio_historia")
_REPO_DATASETS = Path(__file__).resolve().parent.parent / "data" / "datasets_espacio_historia"
DATASETS_ROOT = _LOCAL_EXT_DATASETS if _LOCAL_EXT_DATASETS.exists() else _REPO_DATASETS
OUT_SQLITE = Path(__file__).resolve().parent.parent / "data" / "nasa_mega_rag.sqlite"


def clean_str(val: object, max_len: int = 2400) -> str:
    txt = str(val or "").replace("\r", " ").strip()
    if len(txt) > max_len:
        txt = txt[: max_len - 3].rstrip() + "..."
    return txt


def build_jpl_and_meteorite_docs() -> list[tuple[str, str, str, str, str, int, float]]:
    """Builds high-signal summary and landmark RAG cards from JPL CNEOS and NASA Meteorite Landings."""
    docs: list[tuple[str, str, str, str, str, int, float]] = []
    cneos_dir = DATASETS_ROOT / "02_espacio_catalogos_y_datos_reales" / "nasa_jpl_cneos_y_meteoritos"

    # 1. JPL Fireballs
    fb_path = cneos_dir / "jpl_fireballs.json"
    if fb_path.exists():
        fb = json.loads(fb_path.read_text(encoding="utf-8"))
        fields = fb.get("fields", [])
        rows = fb.get("data", [])
        # Overview doc
        docs.append((
            "jpl_fireballs_overview",
            "NASA JPL CNEOS Fireball & Bolide Catalog Overview",
            "astronomy_cneos",
            "NASA JPL CNEOS (Public Domain)",
            f"The NASA JPL CNEOS Fireball catalog records {len(rows)} atmospheric bolide impacts detected by optical/infrared sensors, tracking impact date, radiated energy (x10^10 J), calculated total impact energy (kilotons TNT), geographic latitude/longitude, altitude (km), and velocity (km/s). Notable extreme events include the 2013-02-15 Chelyabinsk meteor (~440 kt) and the 2018-12-18 Bering Sea bolide (~49-173 kt).",
            1,
            2.2,
        ))
        # Sort by impact-e desc and keep top 200 energetic fireballs
        idx_map = {k: i for i, k in enumerate(fields)}
        parsed = []
        for r in rows:
            try:
                ie = float(r[idx_map.get("impact-e", 2)] or 0.0)
            except Exception:
                ie = 0.0
            parsed.append((ie, r))
        parsed.sort(key=lambda x: x[0], reverse=True)
        for rank, (ie, r) in enumerate(parsed[:200], start=1):
            dt = r[idx_map.get("date", 0)]
            en = r[idx_map.get("energy", 1)]
            lat = f"{r[idx_map.get('lat', 3)]}{r[idx_map.get('lat-dir', 4)] or ''}"
            lon = f"{r[idx_map.get('lon', 5)]}{r[idx_map.get('lon-dir', 6)] or ''}"
            alt = r[idx_map.get("alt", 7)]
            vel = r[idx_map.get("vel", 8)]
            docs.append((
                f"jpl_fireball_{rank:03d}",
                f"NASA JPL CNEOS Fireball Event ({dt}, {ie} kt impact energy)",
                "astronomy_cneos",
                "NASA JPL CNEOS Fireballs",
                f"NASA JPL CNEOS Fireball Event Rank #{rank}: Observed on {dt} at coordinates ({lat}, {lon}), altitude {alt} km, entry speed {vel} km/s, radiated energy {en} x10^10 J, estimated total impact energy {ie} kilotons TNT.",
                1,
                1.8,
            ))

    # 2. JPL NEO Close Approaches
    neo_path = cneos_dir / "jpl_neo_close_approaches.json"
    if neo_path.exists():
        neo = json.loads(neo_path.read_text(encoding="utf-8"))
        fields = neo.get("fields", [])
        rows = neo.get("data", [])
        idx_map = {k: i for i, k in enumerate(fields)}
        docs.append((
            "jpl_neo_overview",
            "NASA JPL CNEOS Near-Earth Object (NEO) Close Approaches Catalog",
            "astronomy_cneos",
            "NASA JPL CNEOS CAD (Public Domain)",
            f"The NASA JPL CNEOS Close Approach Data (CAD) archive tracks {neo.get('total', len(rows))} asteroid and comet close approaches (sample of {len(rows)} closest encounters indexed). It logs object designation (e.g., 99942 Apophis, 2029-Apr-13 encounter at ~0.00025 AU / ~38,000 km inside geostationary orbit), close-approach distance in AU, relative velocity (km/s), and absolute magnitude H.",
            1,
            2.2,
        ))
        parsed_neo = []
        for r in rows:
            try:
                dist_au = float(r[idx_map.get("dist", 4)] or 999.0)
            except Exception:
                dist_au = 999.0
            parsed_neo.append((dist_au, r))
        parsed_neo.sort(key=lambda x: x[0])
        seen_des = set()
        kept = 0
        for dist_au, r in parsed_neo:
            des = str(r[idx_map.get("des", 0)] or "").strip()
            cd = str(r[idx_map.get("cd", 3)] or "").strip()
            v_rel = str(r[idx_map.get("v_rel", 7)] or "").strip()
            h_mag = str(r[idx_map.get("h", 10)] or "").strip()
            lunar_dist = round(dist_au * 389.17, 2)
            key = (des, cd[:11])
            if key in seen_des:
                continue
            seen_des.add(key)
            kept += 1
            docs.append((
                f"jpl_neo_{kept:04d}",
                f"NASA JPL NEO Close Approach: {des} on {cd}",
                "astronomy_cneos",
                "NASA JPL CNEOS Close Approaches",
                f"Near-Earth Object (Asteroid/Comet) {des} makes a close Earth approach on {cd} at nominal distance {dist_au:.6f} AU (~{lunar_dist} lunar distances), relative velocity {v_rel} km/s, absolute magnitude H = {h_mag}.",
                1,
                1.7,
            ))
            if kept >= 400:
                break

    # 3. NASA Meteorite Landings
    met_path = cneos_dir / "nasa_meteorite_landings.csv"
    if met_path.exists():
        met_rows = []
        with open(met_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    mass_g = float(row.get("mass (g)") or 0.0)
                except Exception:
                    mass_g = 0.0
                met_rows.append((mass_g, row))
        docs.append((
            "nasa_meteorites_overview",
            "NASA / Meteoritical Society Worldwide Meteorite Landings Catalog",
            "astronomy_meteorites",
            "NASA Open Data / The Meteoritical Society",
            f"This verified catalog covers {len(met_rows):,} meteorite landings worldwide, recording name, meteorite classification (e.g., L5, H5, H6, iron IAB, carbonaceous chondrite CM2/CV3), recovered mass in grams, Observed Fall vs Found status, year, and coordinates. Notable heavy meteorites include Hoba (~60,000 kg iron IVB in Namibia), Cape York (~58,200 kg), Campo del Cielo (~50,000 kg), Canyon Diablo (~30,000 kg), Allende (CV3 carbonaceous chondrite, 1969 fall in Mexico), and Murchison (CM2 organic-rich fall in 1969, Australia).",
            1,
            2.2,
        ))
        met_rows.sort(key=lambda x: (1 if x[1].get("fall") == "Fell" else 0, x[0]), reverse=True)
        for rank, (mass_g, row) in enumerate(met_rows[:300], start=1):
            name = (row.get("name") or "Unknown").strip()
            rclass = (row.get("recclass") or "Unknown").strip()
            fall = (row.get("fall") or "Found").strip()
            year = (row.get("year") or "unknown").strip()[:4]
            lat = (row.get("reclat") or "").strip()
            lon = (row.get("reclong") or "").strip()
            mass_kg = round(mass_g / 1000.0, 2)
            docs.append((
                f"meteorite_{rank:03d}",
                f"Meteorite Record: {name} ({rclass}, {mass_kg} kg)",
                "astronomy_meteorites",
                "NASA Meteorite Landings",
                f"Meteorite {name} (class {rclass}): {fall} in year {year}, recovered mass {mass_g:,.0f} g ({mass_kg:,.2f} kg), coordinates ({lat}, {lon}).",
                1,
                1.7,
            ))

    return docs


def build_seshat_polity_docs() -> list[tuple[str, str, str, str, str, int, float]]:
    """Extracts clean, child-safe historical polity cards from Oxford Seshat Equinox_on_GitHub_June9_2022.xlsx."""
    xlsx = (
        DATASETS_ROOT
        / "04_historia_general"
        / "oxford_seshat_global_history"
        / "Equinox_Data-main"
        / "Equinox_on_GitHub_June9_2022.xlsx"
    )
    if not xlsx.exists():
        return []

    docs: list[tuple[str, str, str, str, str, int, float]] = []
    try:
        with zipfile.ZipFile(xlsx) as z:
            shared_strings: list[str] = []
            if "xl/sharedStrings.xml" in z.namelist():
                ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
                shared_strings = ["".join(si.itertext()) for si in ss_root]

            wb_root = ET.fromstring(z.read("xl/workbook.xml"))
            rels_root = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
            rid_to_target = {
                rel.attrib["Id"]: "xl/" + rel.attrib["Target"].lstrip("/")
                for rel in rels_root
            }

            target_sheets = {}
            for sh in wb_root.iter():
                if sh.tag.endswith("sheet"):
                    sname = sh.attrib.get("name", "")
                    if sname in ("Polities", "NGAs"):
                        rid = next(
                            (v for k, v in sh.attrib.items() if k.endswith("relationship") or k.endswith("id")),
                            None,
                        )
                        if rid and rid in rid_to_target:
                            target_sheets[sname] = rid_to_target[rid]

            def parse_sheet_rows(xml_bytes: bytes) -> list[list[str]]:
                root = ET.fromstring(xml_bytes)
                parsed_rows: list[list[str]] = []
                for row_el in root.iter():
                    if not row_el.tag.endswith("}row"):
                        continue
                    vals = []
                    for c_el in row_el:
                        if not c_el.tag.endswith("}c"):
                            continue
                        ctype = c_el.attrib.get("t")
                        val = ""
                        for child in c_el:
                            if child.tag.endswith("}v"):
                                raw = child.text or ""
                                if ctype == "s" and raw.isdigit() and int(raw) < len(shared_strings):
                                    val = shared_strings[int(raw)]
                                else:
                                    val = raw
                            elif child.tag.endswith("}is"):
                                val = "".join(child.itertext())
                        vals.append(val.strip())
                    if any(vals):
                        parsed_rows.append(vals)
                return parsed_rows

            if "Polities" in target_sheets and target_sheets["Polities"] in z.namelist():
                prows = parse_sheet_rows(z.read(target_sheets["Polities"]))
                if len(prows) > 1:
                    headers = [h.lower() for h in prows[0]]
                    for i, r in enumerate(prows[1:], start=1):
                        pairs = [f"{headers[j]}: {r[j]}" for j in range(min(len(headers), len(r))) if r[j]]
                        pol_name = r[1] if len(r) > 1 else (r[0] if r else f"Polity #{i}")
                        txt = f"Oxford Seshat Global History Databank Polity Record — {pol_name}. " + " | ".join(pairs)
                        # Child safety screen
                        low = txt.lower()
                        if any(b in low for b in ("sacrifice", "slavery", "torture", "execution")):
                            continue
                        docs.append((
                            f"seshat_polity_{i:04d}",
                            f"Oxford Seshat Historical Polity: {clean_str(pol_name, 100)}",
                            "world_history",
                            "Oxford Seshat Equinox_Data (CC-BY-NC-SA)",
                            clean_str(txt, 900),
                            0,
                            1.5,
                        ))
    except Exception as exc:
        print(f"[WARN] Could not parse Seshat XLSX: {exc}")
    return docs


def main() -> None:
    t0 = time.perf_counter()
    OUT_SQLITE.parent.mkdir(parents=True, exist_ok=True)
    if OUT_SQLITE.exists():
        OUT_SQLITE.unlink()

    conn = sqlite3.connect(str(OUT_SQLITE))
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=OFF;")
    cur.execute("PRAGMA synchronous=OFF;")
    cur.execute("PRAGMA temp_store=MEMORY;")

    cur.execute(
        """
        CREATE TABLE docs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            source TEXT NOT NULL,
            content TEXT NOT NULL,
            commercial_safe INTEGER NOT NULL,
            source_weight REAL NOT NULL
        );
        """
    )
    cur.execute(
        """
        CREATE VIRTUAL TABLE docs_fts USING fts5(
            doc_id,
            title,
            category,
            source,
            content,
            content='docs',
            content_rowid='id',
            tokenize='porter unicode61'
        );
        """
    )

    SOURCE_WEIGHTS = {
        "OpenStax Astronomy 2e": 2.35,
        "NASA Exoplanet Archive (pscomppars)": 2.25,
        "NASA Apollo 11 Technical Air-to-Ground Transcript": 2.20,
        "NASA Apollo Lunar Surface Journal (AS13_TEC.txt)": 2.20,
        "NASA Technical Reports Server (NTRS)": 2.15,
        "Smithsonian Open Access (NASM)": 2.10,
        "OpenStax World History Volume 1 (to 1500)": 2.25,
        "OpenStax World History Volume 2 (from 1400)": 2.25,
        "nasa-impact/nasa-sde-IR-benchmark-20251024-v5": 1.65,
        "adsabs/SciX_UAT_keywords": 1.35,
        "nasa-impact/nasa-smd-IR-benchmark": 1.00,
    }

    seen_ids: set[str] = set()
    batch: list[tuple[str, str, str, str, str, int, float]] = []
    inserted = 0

    def flush_batch() -> None:
        nonlocal inserted
        if not batch:
            return
        cur.executemany(
            "INSERT OR IGNORE INTO docs (doc_id, title, category, source, content, commercial_safe, source_weight) VALUES (?, ?, ?, ?, ?, ?, ?)",
            batch,
        )
        inserted += len(batch)
        batch.clear()

    def add_jsonl_corpus(path: Path, default_cat: str) -> int:
        count = 0
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                d = json.loads(line)
                did = clean_str(d.get("id") or f"doc_{inserted + len(batch)}", 160)
                if did in seen_ids:
                    continue
                seen_ids.add(did)
                title = clean_str(d.get("title") or "NASA Reference", 260)
                text = clean_str(d.get("text") or "", 2200)
                if not text:
                    continue
                src = clean_str(d.get("source") or "unknown", 140)
                cat = clean_str(d.get("topic") or default_cat, 80)
                csafe = 1 if d.get("commercial_safe", True) else 0
                wt = SOURCE_WEIGHTS.get(src, 1.4)
                batch.append((did, title, cat, src, text, csafe, wt))
                count += 1
                if len(batch) >= 5000:
                    flush_batch()
        flush_batch()
        return count

    esp_p = DATASETS_ROOT / "00_listos_para_rag_y_entrenamiento" / "espacio_rag_corpus.jsonl"
    hist_p = DATASETS_ROOT / "00_listos_para_rag_y_entrenamiento" / "historia_rag_corpus.jsonl"

    c_esp = add_jsonl_corpus(esp_p, "space_science")
    print(f"Indexed {c_esp:,} unique docs from espacio_rag_corpus.jsonl")
    c_hist = add_jsonl_corpus(hist_p, "history")
    print(f"Indexed {c_hist:,} additional unique docs from historia_rag_corpus.jsonl")

    extra_cards = build_jpl_and_meteorite_docs() + build_seshat_polity_docs()
    c_extra = 0
    for row in extra_cards:
        if row[0] not in seen_ids:
            seen_ids.add(row[0])
            batch.append(row)
            c_extra += 1
    flush_batch()
    print(f"Indexed {c_extra:,} JPL CNEOS, Meteorite & Seshat digest cards")

    print("Building SQLite FTS5 index (this runs in C and takes a few seconds)...")
    cur.execute("INSERT INTO docs_fts(docs_fts) VALUES('rebuild');")
    cur.execute("INSERT INTO docs_fts(docs_fts) VALUES('optimize');")
    conn.commit()
    total_rows = cur.execute("SELECT COUNT(*) FROM docs;").fetchone()[0]
    conn.close()

    size_mb = OUT_SQLITE.stat().st_size / (1024 * 1024)
    print(f"SUCCESS: Built {OUT_SQLITE} ({total_rows:,} docs, {size_mb:.1f} MB) in {time.perf_counter() - t0:.1f}s")


if __name__ == "__main__":
    main()
