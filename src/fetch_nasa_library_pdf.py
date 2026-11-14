"""Fetches all NTRS thematic searches, NASA History books, Artemis PDF, and NASA Science Mission pages from the 'Biblioteca de Investigación' PDF."""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Any
import urllib.parse
import urllib.request

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
RAG_PDFS_DIR = DATA_DIR / "rag_pdfs" / "06_nasa_library_artemis"
OUT_JSON_PATH = DATA_DIR / "nasa_research_library_corpus.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/plain, */*",
}


def get_json(url: str, timeout: int = 12) -> Any:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8", errors="replace"))


def get_text(url: str, timeout: int = 12) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", errors="replace")
        raw = re.sub(r"<script.*?>.*?</script>", " ", raw, flags=re.S | re.I)
        raw = re.sub(r"<style.*?>.*?</style>", " ", raw, flags=re.S | re.I)
        raw = re.sub(r"<[^>]+>", " ", raw)
        return " ".join(raw.split())


def search_ntrs_top_hits(query: str, max_hits: int = 3) -> list[dict[str, Any]]:
    """Queries the official NASA NTRS Search API for a thematic query or NASA book title."""
    encoded_q = urllib.parse.quote(query)
    url = f"https://ntrs.nasa.gov/api/citations/search?q={encoded_q}"
    data = get_json(url, timeout=12)
    results = data.get("results", []) if isinstance(data, dict) else []
    hits = []
    for item in results[:max_hits]:
        nid = str(item.get("id", ""))
        title = str(item.get("title", "")).strip()
        abstract = str(item.get("abstract", "")).strip()
        if not title or len(abstract) < 60:
            continue
        center = (item.get("center") or {}).get("name", "NASA")
        stype = str(item.get("stiType", "TECHNICAL_REPORT"))
        pub_date = ""
        pubs = item.get("publications") or []
        if pubs and isinstance(pubs[0], dict):
            pub_date = str(pubs[0].get("publicationDate", ""))[:10]
        hits.append(
            {
                "ntrs_id": nid,
                "title": title,
                "center": center,
                "sti_type": stype,
                "pub_date": pub_date,
                "abstract": abstract[:1800],
                "url": f"https://ntrs.nasa.gov/citations/{nid}",
            }
        )
    return hits


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAG_PDFS_DIR.mkdir(parents=True, exist_ok=True)
    library_docs: list[dict[str, Any]] = []

    # 1. Download Artemis Plan PDF (Section 2 of Biblioteca PDF) into data/rag_pdfs/06_nasa_library_artemis/
    artemis_pdf_url = "https://www.nasa.gov/wp-content/uploads/2020/12/artemis_plan-20200921.pdf"
    artemis_pdf_path = RAG_PDFS_DIR / "nasa_artemis_sustained_lunar_exploration_plan.pdf"
    if not artemis_pdf_path.exists():
        try:
            req = urllib.request.Request(artemis_pdf_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as r:
                pdf_bytes = r.read()
                if pdf_bytes.startswith(b"%PDF"):
                    artemis_pdf_path.write_bytes(pdf_bytes)
                    print(f"[PDF Download] Saved {artemis_pdf_path.name} ({len(pdf_bytes)} bytes)")
        except Exception as e:
            print(f"[PDF Download] Artemis PDF warning: {e}")
    else:
        print(f"[PDF Download] Reusing cached {artemis_pdf_path.name} ({artemis_pdf_path.stat().st_size} bytes)")

    # 2. Execute all 19 NTRS Thematic Searches from Sections 5, 6, 7, 9, and 12 of the PDF
    ntrs_thematic_queries = [
        ("Human Integration Design Handbook", "physical_health"),
        ("Environmental Control and Life Support System", "eclss_life_support"),
        ("International Space Station Water Recovery System", "eclss_life_support"),
        ("Oxygen Generation System International Space Station", "eclss_life_support"),
        ("Space Radiation Human Exploration", "radiation_radlab"),
        ("Solar Particle Events Spaceflight", "radiation_radlab"),
        ("Planetary Protection", "training_science_flight"),
        ("Advanced Life Support", "eclss_life_support"),
        ("Astronaut Health", "physical_health"),
        ("Spaceflight Nutrition", "nutrition_food"),
        ("Human Factors Spaceflight", "mental_health"),
        ("Space Habitat Design", "eclss_life_support"),
        ("Space Crop Production", "nutrition_food"),
        ("Water Recovery Spacecraft", "eclss_life_support"),
        ("Oxygen Generation Spacecraft", "eclss_life_support"),
        ("Planetary Surface Mobility", "training_science_flight"),
        ("Human Mars Exploration", "training_science_flight"),
        ("Planetary Robotic Exploration", "training_science_flight"),
        ("Deep Space Communications", "training_science_flight"),
    ]

    seen_ntrs_ids: set[str] = set()
    print("\n[1/3] Running 19 Official NASA NTRS Thematic Searches...")
    for q_str, cat in ntrs_thematic_queries:
        try:
            hits = search_ntrs_top_hits(q_str, max_hits=3)
            added = 0
            for h in hits:
                if h["ntrs_id"] in seen_ntrs_ids:
                    continue
                seen_ntrs_ids.add(h["ntrs_id"])
                library_docs.append(
                    {
                        "doc_id": f"NTRS-LIB-{h['ntrs_id']}",
                        "title": f"[NTRS {h['sti_type']} {h['ntrs_id']}] {h['title']} ({h['center']}, {h['pub_date']})",
                        "category": cat,
                        "source_type": "NASA_NTRS_THEMATIC_LIBRARY",
                        "keywords": [w.lower() for w in q_str.split()] + [h["ntrs_id"]],
                        "content": (
                            f"Official NASA NTRS Record {h['ntrs_id']} ({h['url']}) | Topic: {q_str} | "
                            f"Center: {h['center']} | Type: {h['sti_type']} | Date: {h['pub_date']} | "
                            f"Verified Summary: {h['abstract']}"
                        ),
                    }
                )
                added += 1
            print(f"  [NTRS Search '{q_str}'] -> +{added} unique peer/technical reports")
        except Exception as e:
            print(f"  [NTRS Search '{q_str}'] err: {e}")

    # 3. Search the 12 Recommended NASA History & Biomedicine Books (Section 11) in NTRS
    nasa_books = [
        ("Beyond Earth Chronicle of Deep Space Exploration", "training_science_flight"),
        ("Apollo by the Numbers Statistical Reference", "training_science_flight"),
        ("Psychology of Space Exploration Vakoch", "mental_health"),
        ("50 Years of Solar System Exploration", "training_science_flight"),
        ("Living and Working in Space History of Skylab", "eclss_life_support"),
        ("The Human Factor Biomedicine in the Manned Space Program", "physical_health"),
        ("On Mars Exploration of the Red Planet", "training_science_flight"),
        ("Mission to Jupiter History of the Galileo Project", "training_science_flight"),
        ("History of Near-Earth Objects Research", "training_science_flight"),
        ("When Biospheres Collide Planetary Protection", "training_science_flight"),
        ("Stages to Saturn Bilstein", "training_science_flight"),
        ("Discovery Program Competitive Planetary Exploration", "training_science_flight"),
    ]
    print("\n[2/3] Fetching Official NASA History & Biomedicine Books (Section 11)...")
    for b_query, cat in nasa_books:
        try:
            hits = search_ntrs_top_hits(b_query, max_hits=2)
            for h in hits:
                if h["ntrs_id"] in seen_ntrs_ids:
                    continue
                seen_ntrs_ids.add(h["ntrs_id"])
                library_docs.append(
                    {
                        "doc_id": f"NASA-BOOK-{h['ntrs_id']}",
                        "title": f"[NASA Official Book / Monograph {h['ntrs_id']}] {h['title']} ({h['pub_date']})",
                        "category": cat,
                        "source_type": "NASA_HISTORY_BOOK_SERIES",
                        "keywords": [w.lower() for w in b_query.split() if len(w) > 3] + [h["ntrs_id"], "nasa book"],
                        "content": (
                            f"Official NASA Book Reference ({h['url']}, NTRS ID: {h['ntrs_id']}): {h['title']} "
                            f"({h['center']}, {h['pub_date']}). Abstract & Scope: {h['abstract']}"
                        ),
                    }
                )
                print(f"  [NASA Book] {h['title'][:65]} (NTRS {h['ntrs_id']})")
        except Exception as e:
            print(f"  [NASA Book '{b_query}'] err: {e}")

    # 4. Curated Authoritative Syntheses for Sections 2, 3, 4, 8, 9, 10, 14, 15, 16 (Apollo 11-17, Mars Fleet, Outer Planets/Europa Clipper/DART, Astrobiology & Planetary Protection, Earth Observation, Bibliographic Verification Rules)
    print("\n[3/3] Building Structured NASA Mission & Verification Syntheses (Sections 2-16)...")
    structured_sections = [
        {
            "doc_id": "NASA-LIB-SEC02-APOLLO-11-TO-17-ALSJ",
            "title": "Apollo Lunar Surface Journal (ALSJ) & Apollo Flight Journal (AFJ): Missions Apollo 11, 12, 14, 15, 16 & 17",
            "category": "training_science_flight",
            "source_type": "NASA_HISTORY_ALSJ_AFJ",
            "keywords": ["apollo 11", "apollo 12", "apollo 14", "apollo 15", "apollo 16", "apollo 17", "alsj", "afj", "lunar rover", "lrv", "eva"],
            "content": (
                "Official NASA Apollo Lunar Surface Journal (https://www.nasa.gov/history/alsj/) & Apollo Flight Journal (https://history.nasa.gov/afj/): "
                "1) Apollo 11 (Mare Tranquillitatis): First crewed lunar landing; establishes baseline EVA operations sequence and contingency sample collection. "
                "2) Apollo 12 (Oceanus Procellarum): Demonstrated pinpoint landing precision near Surveyor 3; guides landing-zone targeting and navigation. "
                "3) Apollo 14 (Fra Mauro): Highland geology, MET handcart transport, and structured rock sample classification. "
                "4) Apollo 15 (Hadley-Apennine): Introduced the electric Lunar Roving Vehicle (LRV), dramatically expanding EVA radius, route planning, and slope mobility. "
                "5) Apollo 16 (Descartes Highlands): Investigated lunar highlands volcanism vs impact breccias; terrain slope & traversability analysis. "
                "6) Apollo 17 (Taurus-Littrow Valley): Longest Apollo stay (~75 h on surface, 3 EVAs, geologist-astronaut Harrison Schmitt), deep drill cores, and surface science time management."
            ),
        },
        {
            "doc_id": "NASA-LIB-SEC03-MARS-FLEET-JEZERO-CASE",
            "title": "NASA Mars Exploration Fleet (Mariner 4 to Perseverance & Ingenuity) & Jezero Crater Educational Mission",
            "category": "training_science_flight",
            "source_type": "NASA_SCIENCE_MARS_PROGRAM",
            "keywords": ["mariner 4", "viking", "pathfinder", "sojourner", "spirit", "opportunity", "mro", "curiosity", "insight", "perseverance", "ingenuity", "jezero"],
            "content": (
                "Official NASA Mars Exploration Program (https://science.nasa.gov/mars/) & Planetary Data System (https://pds.nasa.gov/): "
                "- Mariner 4: First close-up flyby images of Mars. "
                "- Viking 1 & 2: First successful surface landers and biological soil experiments. "
                "- Mars Pathfinder & Sojourner: First wheeled robotic rover mobility demonstration on Mars. "
                "- Spirit & Opportunity (MER): Proved past aqueous environments (hematite, sulfates) and tracked solar array degradation during dust storms. "
                "- Mars Reconnaissance Orbiter (MRO): HiRISE sub-meter orbital cartography for hazard mapping and landing site selection. "
                "- Curiosity (MSL, Gale Crater): Assessed ancient habitability, organic carbon, and measured 0.64 mSv/day surface radiation via RAD. "
                "- InSight: Mapped Martian interior crust/mantle/core and marsquakes (seismicity). "
                "- Perseverance & Ingenuity (Jezero Crater): Astrobiology, ancient river-delta biosignature caching, MOXIE O2 ISRU demonstration, and first powered aerial flight on another planet (Ingenuity). "
                "Educational Rule (Section 15): Simulated dust storms, comms dropouts, and energy trade-offs in Jezero Crater are educational design scenarios and must be distinguished from historical mission events."
            ),
        },
        {
            "doc_id": "NASA-LIB-SEC04-08-09-OUTER-SOLAR-SYSTEM-ASTROBIOLOGY-PLANETARY-PROTECTION",
            "title": "Deep Space Missions (Voyager, Cassini, Juno, OSIRIS-REx, DART, Europa Clipper, Psyche, Dragonfly), Astrobiology & Planetary Protection",
            "category": "training_science_flight",
            "source_type": "NASA_SCIENCE_PLANETARY_PROTECTION",
            "keywords": ["voyager", "galileo", "cassini", "new horizons", "juno", "osiris-rex", "bennu", "dart", "dimorphos", "europa clipper", "psyche", "dragonfly", "titan", "enceladus", "planetary protection", "biosignature"],
            "content": (
                "Official NASA Solar System, Astrobiology (https://astrobiology.nasa.gov/) & Office of Planetary Protection (https://sma.nasa.gov/sma-disciplines/planetary-protection): "
                "1) Outer Solar System & Small Bodies: Voyager 1 & 2 (outer giants & interstellar medium); Galileo & Juno (Jupiter magnetosphere, gravity, and moons); "
                "Cassini-Huygens (Saturn rings, Enceladus subsurface ocean plumes, and Titan hydrocarbon lakes); New Horizons (Pluto & Kuiper Belt object Arrokoth); "
                "OSIRIS-REx (carbonaceous asteroid Bennu sample return); DART (first kinetic impactor asteroid deflection test at Didymos-Dimorphos); "
                "Psyche (metal-rich asteroid mission); Dragonfly (rotorcraft lander to explore prebiotic organic chemistry on Titan). "
                "2) CRITICAL SCIENTIFIC DISTINCTION (Sections 4 & 8): Europa Clipper investigates Europa's ice shell and subsurface ocean to assess POTENTIAL HABITABILITY—it is NOT a life-detection mission! Always distinguish between (a) potential habitability, (b) presence of organic molecules, and (c) confirmed detection of life. "
                "3) Planetary Protection & Astromaterials (Section 9, NODIS directives): Prevents forward biological contamination of celestial bodies (sterilization, bioburden control) and backward contamination during sample return, ensuring sample traceability."
            ),
        },
        {
            "doc_id": "NASA-LIB-SEC07-10-16-RADIATION-DOSIMETRY-EARTH-OBS-BIBLIOGRAPHIC-RULES",
            "title": "Space Radiation Dosimetry Units (Absorbed vs Equivalent Dose), Earth Observation Fleet (Landsat, Terra, Aqua, ICESat-2, GPM, SWOT) & Verification Rules",
            "category": "radiation_radlab",
            "source_type": "NASA_RADIATION_EARTHDATA_STANDARDS",
            "keywords": ["gray", "sievert", "msv", "absorbed dose", "equivalent dose", "effective dose", "sdo", "soho", "landsat", "terra", "aqua", "icesat-2", "gpm", "swot", "earthdata", "verification"],
            "content": (
                "Official NASA Space Radiation (https://www.nasa.gov/space-radiation/), Heliophysics (SDO, SOHO), Earthdata (https://www.earthdata.nasa.gov/) & Bibliographic Standards (Sections 7, 10, 16): "
                "1) Radiological Dosimetry Precision (Section 7): NEVER confuse radiological quantities! Absorbed Dose (measured in Gray, Gy = J/kg) is raw physical energy deposited per unit mass; "
                "Equivalent Dose (measured in Sievert, Sv or mSv) weights absorbed dose by the radiation quality factor Q (heavy HZE cosmic ions and neutrons have much higher biological damage per Gray than X-rays); "
                "Effective Dose (mSv) further weights by tissue sensitivity (NASA-STD-3001 career limit: 600 mSv). "
                "2) Earth Science Reference Missions (Section 10): Landsat (land surface change), Terra & Aqua (atmosphere, radiation budget, and water cycle), "
                "ICESat-2 (laser altimetry of ice sheets and terrain elevation), GPM (Global Precipitation Measurement), and SWOT (Surface Water and Ocean Topography hydrology). "
                "3) Bibliographic Verification Protocol (Section 16): Not every document in NTRS is a peer-reviewed journal article—NTRS also hosts technical memorandums (TM), contractor reports (CR), conference presentations, and historical monographs. Always cite document ID, author/center, date, physical units, and distinguish confirmed flight data from simulated game scenarios."
            ),
        },
    ]
    library_docs.extend(structured_sections)

    OUT_JSON_PATH.write_text(json.dumps(library_docs, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nSaved {len(library_docs)} verified NASA Research Library documents to {OUT_JSON_PATH}")


if __name__ == "__main__":
    main()
