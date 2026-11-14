"""Fetches live scientific documents, full-text excerpts, telemetry, and dataset metadata from all URLs in the two PDFs."""

from __future__ import annotations

import json
from pathlib import Path
import re
import urllib.request

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def get_json(url: str, timeout: int = 12):
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


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fetched_sources = []

    # 1. NASA NTRS Full Citations + Full-Text Excerpts (PDF 2 Section 2)
    ntrs_ids = [
        "20210024855",  # BVAD Rev 2
        "20190027563",  # Astronaut Mass Balance for Long Duration Missions
        "20190028339",  # Cost-Effective High Reliability for Space Life Support
        "20160005782",  # Design and Analysis of a Flexible, Reliable Deep Space Life Support System
        "20250010956",  # ESDMD-001 Rev C: Moon to Mars Architecture Definition Document
        "20220004670",  # A Deployable 40 kWe Lunar Fission Surface Power Concept
        "20230003735",  # Overview of NASA Fission Surface Power
        "20040015099",  # Equivalent Mass (ESM) vs Life Cycle Cost
        "19850021219",  # Controlled Ecological Life Support System (BLSS)
        "20240009831",  # The Martian Radiation Environment and Human Health Risks
    ]
    for nid in ntrs_ids:
        try:
            d = get_json(f"https://ntrs.nasa.gov/api/citations/{nid}")
            downloads = d.get("downloads", [])
            pdf_links = [
                "https://ntrs.nasa.gov" + dl.get("links", {}).get("pdf", "")
                for dl in downloads
                if dl.get("links", {}).get("pdf")
            ]
            txt_links = [
                "https://ntrs.nasa.gov" + dl.get("links", {}).get("fulltext", "")
                for dl in downloads
                if dl.get("links", {}).get("fulltext")
            ]
            fulltext_snippet = ""
            if txt_links:
                try:
                    fulltext_snippet = get_text(txt_links[0], timeout=12)[:4000]
                except Exception:
                    pass
            title = str(d.get("title", ""))
            abstract = str(d.get("abstract", ""))
            fetched_sources.append(
                {
                    "source_group": "NASA_NTRS",
                    "id": f"NTRS-{nid}",
                    "url": f"https://ntrs.nasa.gov/citations/{nid}",
                    "pdf_urls": pdf_links,
                    "title": title,
                    "abstract": abstract,
                    "keywords": d.get("keywords", []),
                    "subject_categories": d.get("subjectCategories", []),
                    "fulltext_excerpt": fulltext_snippet,
                }
            )
            print(f"[NTRS {nid}] OK | title={title[:55]} | abstract={len(abstract)}c | fulltext={len(fulltext_snippet)}c")
        except Exception as e:
            print(f"[NTRS {nid}] err: {e}")

    # 2. NASA DONKI Live Space Weather API (PDF 2 Section 1: FLR, SEP, GST)
    for endpoint in ["FLR", "SEP", "GST"]:
        try:
            events = get_json(f"https://api.nasa.gov/DONKI/{endpoint}?api_key=DEMO_KEY")
            if isinstance(events, list):
                sample_ev = events[-3:] if len(events) >= 3 else events
                fetched_sources.append(
                    {
                        "source_group": "NASA_DONKI_LIVE_API",
                        "id": f"NASA-DONKI-{endpoint}",
                        "url": f"https://api.nasa.gov/DONKI/{endpoint}",
                        "title": f"Live NASA DONKI Space Weather Telemetry ({endpoint}) - {len(events)} recent events",
                        "events_count": len(events),
                        "recent_events": sample_ev,
                    }
                )
                print(f"[DONKI {endpoint}] OK | {len(events)} live events fetched from api.nasa.gov")
        except Exception as e:
            print(f"[DONKI {endpoint}] err: {e}")

    # 3. UCI Machine Learning Repository & University Pages (PDF 1 Section 2 & 3)
    uci_urls = [
        ("PAMAP2", "https://archive.ics.uci.edu/dataset/231/pamap2+physical+activity+monitoring"),
        ("MHEALTH", "https://mobilize.stanford.edu/data/available-datasets/"),
        ("PPG-DaLiA", "https://ubi29.informatik.uni-siegen.de/usi/data_ppgdalia.html"),
        ("WESAD", "https://ubi29.informatik.uni-siegen.de/usi/data_wesad.html"),
        ("DEAP", "https://www.eecs.qmul.ac.uk/mmv/datasets/deap/"),
        ("AMIGOS", "https://ipatras.github.io/code-and-datasets/"),
        ("UNL-Plant", "https://plantvision.unl.edu/datasets/"),
        ("OPPD-Plant", "https://vision.eng.au.dk/open-plant-phenotyping-database/"),
    ]
    for name, url in uci_urls:
        try:
            txt = get_text(url, timeout=10)[:2500]
            fetched_sources.append(
                {
                    "source_group": "UNIVERSITY_WEB_PORTAL",
                    "id": f"UNIV-WEB-{name}",
                    "url": url,
                    "title": f"University Dataset Official Page: {name}",
                    "page_excerpt": txt,
                }
            )
            print(f"[UNIV {name}] OK | {len(txt)} chars fetched from {url}")
        except Exception as e:
            print(f"[UNIV {name}] err: {e}")

    # 4. Zenodo API for DREAMER (546113), Urbino (17487080), Lecture Halls (18385830), Aalborg IEQ (10761326)
    for zen_id, zen_name in [
        ("546113", "DREAMER"),
        ("10761326", "Aalborg_IEQ"),
        ("17487080", "Urbino_Microclimate"),
        ("18385830", "Lecture_Halls_IEQ"),
    ]:
        try:
            d = get_json(f"https://zenodo.org/api/records/{zen_id}")
            meta = d.get("metadata", {})
            desc = re.sub(r"<[^>]+>", " ", str(meta.get("description", "")))
            desc = " ".join(desc.split())[:2500]
            title = str(meta.get("title", zen_name))
            fetched_sources.append(
                {
                    "source_group": "ZENODO_UNIVERSITY_DATASET",
                    "id": f"ZENODO-{zen_id}-{zen_name}",
                    "url": f"https://zenodo.org/records/{zen_id}",
                    "title": title,
                    "description": desc,
                    "keywords": meta.get("keywords", []),
                }
            )
            print(f"[Zenodo {zen_name}] OK | title={title[:55]} | {len(desc)} chars")
        except Exception as e:
            print(f"[Zenodo {zen_name}] err: {e}")

    # 5. GitHub Official Repos from PDFs (Nutrition5k, NASA-IMPACT/LLM-cookbook-for-open-science, NASA-AMMOS/aerie-simple-model-data)
    for repo in [
        "google-research-datasets/Nutrition5k",
        "NASA-IMPACT/LLM-cookbook-for-open-science",
        "NASA-AMMOS/aerie-simple-model-data",
    ]:
        try:
            d = get_json(f"https://api.github.com/repos/{repo}")
            readme_txt = ""
            try:
                rm = get_json(f"https://api.github.com/repos/{repo}/readme")
                dl_url = rm.get("download_url")
                if dl_url:
                    readme_txt = get_text(dl_url, timeout=10)[:2500]
            except Exception:
                pass
            fetched_sources.append(
                {
                    "source_group": "GITHUB_OFFICIAL_REPO",
                    "id": f"GH-{repo.replace('/', '-')}",
                    "url": f"https://github.com/{repo}",
                    "title": d.get("full_name", repo),
                    "description": d.get("description", ""),
                    "topics": d.get("topics", []),
                    "readme_excerpt": readme_txt,
                }
            )
            print(f"[GitHub {repo}] OK | readme={len(readme_txt)} chars")
        except Exception as e:
            print(f"[GitHub {repo}] err: {e}")

    out_file = DATA_DIR / "live_fetched_links_corpus.json"
    out_file.write_text(json.dumps(fetched_sources, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nTotal live links fetched and saved: {len(fetched_sources)} -> {out_file}")


if __name__ == "__main__":
    main()
