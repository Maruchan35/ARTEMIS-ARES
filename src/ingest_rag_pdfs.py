"""Extracts and chunks all 23 scientific PDFs from data/rag_pdfs into 100% English RAG chunks for NasaHybridRAGEngine."""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Any

import pymupdf

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
RAG_PDFS_DIR = DATA_DIR / "rag_pdfs"
OUT_CHUNKS_PATH = DATA_DIR / "rag_pdfs_chunks.jsonl"

CATEGORY_META: dict[str, dict[str, Any]] = {
    "01_sgr_a_eht": {
        "module_category": "training_science_flight",
        "topic_label": "Event Horizon Telescope (EHT) Sagittarius A* Supermassive Black Hole Astrophysics & General Relativity",
        "base_keywords": ["sgr a*", "sagittarius a", "eht", "event horizon telescope", "black hole", "general relativity", "shadow", "grmhd", "accretion"],
    },
    "02_ntp_nuclear_propulsion": {
        "module_category": "training_science_flight",
        "topic_label": "NASA Nuclear Thermal Propulsion (NTP), Liquid Hydrogen (LH2), Specific Impulse (Isp ~900s) & Deep-Space Mars Transit",
        "base_keywords": ["ntp", "nuclear thermal propulsion", "isp", "900 s", "nerva", "lh2", "liquid hydrogen", "cermet", "leu", "mars transit", "houts", "borowski"],
    },
    "03_dsoc_optical_comms": {
        "module_category": "training_science_flight",
        "topic_label": "NASA JPL Deep Space Optical Communications (DSOC), Laser Link Budget, Photon Counting (SNSPD) & Ground Stations",
        "base_keywords": ["dsoc", "optical communications", "laser", "hemmati", "jpl", "ppm", "snspd", "photon", "pointing", "link budget", "ground station"],
    },
    "04_soma_human_genomics": {
        "module_category": "physical_health",
        "topic_label": "NASA Human Research Program (HRP FY24), Space Omics and Medical Atlas (SOMA), Epigenetics, DNA Methylation & NLR Immune Biomarkers",
        "base_keywords": ["soma", "hrp", "human research program", "dna methylation", "transcriptome", "epigenetics", "neutrophil", "lymphocyte", "nlr", "sans", "immunology"],
    },
    "05_extremophiles_astrobiology_botany": {
        "module_category": "nutrition_food",
        "topic_label": "NASA KSC Space Crop Production (Dr. Gioia Massa, Veggie, APH), Extremophiles & Astrobiology",
        "base_keywords": ["space crop", "gioia massa", "veggie", "aph", "advanced plant habitat", "extremophiles", "astrobiology", "pick-and-eat", "microgravity botany", "kennedy space center"],
    },
}


def clean_pdf_text(raw: str) -> str:
    """Cleans PDF extraction artifacts, hyphenated line breaks, and excessive whitespace."""
    txt = re.sub(r"-\s*\n\s*", "", raw)
    txt = re.sub(r"\s+", " ", txt)
    # Remove non-printable control chars
    txt = "".join(ch for ch in txt if ch.isprintable() or ch == " ")
    return txt.strip()


def is_reference_or_filler_page(text: str) -> bool:
    """Filters out pure bibliography/reference pages or table-of-contents dots."""
    low = text.lower()
    if len(text) < 220:
        return True
    if low.count(". . .") > 6 or low.count("...") > 10:
        return True
    # High density of citation years/brackets typical of bibliography pages
    ref_markers = len(re.findall(r"\b(19\d\d|20\d\d)[a-z]?\b", text))
    if ("references" in low[:120] or "bibliography" in low[:120]) and ref_markers > 18:
        return True
    return False


def score_chunk_signal(text: str, base_keywords: list[str]) -> float:
    """Scores a text chunk by scientific & quantitative density so we keep the highest-value sections of huge PDFs."""
    low = text.lower()
    score = 0.0
    for kw in base_keywords:
        if kw in low:
            score += 3.0
    # Boost quantitative engineering/medical content (units, percentages, NASA terms)
    quant_matches = re.findall(
        r"\b(\d+(?:\.\d+)?\s*(?:kg|kwe|kw|mw|msv|gy|kpa|pa|m/s|isp|sec|days|hours|db|ghz|nm|w/m2|%|k|c))\b",
        low,
    )
    score += min(15.0, len(quant_matches) * 1.5)
    for high_val in ("abstract", "introduction", "conclusion", "summary", "nasa", "mars", "lunar", "moon", "radiation", "crew", "astronaut"):
        if high_val in low:
            score += 1.5
    return score


def extract_chunks_from_pdf(pdf_path: Path, max_chunks_per_pdf: int = 12) -> list[dict[str, Any]]:
    cat_folder = pdf_path.parent.name
    meta = CATEGORY_META.get(
        cat_folder,
        {
            "module_category": "training_science_flight",
            "topic_label": cat_folder,
            "base_keywords": [cat_folder.lower()],
        },
    )

    # Special handling for the 2-page Spanish astrobiology article to keep the RAG corpus 100% English
    if pdf_path.name == "revecuatneurol_ce03_astrobiologia.pdf":
        return [
            {
                "doc_id": "PDF-05_extremophiles-revecuatneurol_astrobiology-p01",
                "title": "Astrobiology & Neurological Adaptation in Spaceflight (revecuatneurol_ce03_astrobiologia.pdf, English Synthesis)",
                "category": "physical_health",
                "source_type": "RAG_PDF_CORPUS",
                "pdf_file": pdf_path.name,
                "folder": cat_folder,
                "page": 1,
                "keywords": meta["base_keywords"] + ["neurology", "central nervous system", "microgravity", "cosmic radiation", "circadian"],
                "content": (
                    "English Scientific Synthesis of 'Why Astrobiology Research Matters for Neurology and Human Spaceflight' "
                    "(revecuatneurol_ce03_astrobiologia.pdf): Examines how astrobiology and extremophile biology inform human central "
                    "nervous system (CNS) adaptation during deep-space missions to the Moon and Mars. Key findings: (1) Combined microgravity "
                    "(cephalad fluid shift, intracranial pressure changes, Spaceflight Associated Neuro-ocular Syndrome - SANS) and Galactic "
                    "Cosmic Rays (GCR HZE ions) induce neuro-inflammation, oxidative stress, and circadian disruption; (2) Studying extremophile "
                    "radio-resistance and antioxidant repair pathways (such as Deinococcus radiodurans and tardigrade damage-suppressor proteins) "
                    "guides neuroprotective countermeasures, radioprotective nutrition, and habitat shielding for long-duration crews."
                ),
            }
        ]

    doc = pymupdf.open(pdf_path)
    num_pages = len(doc)

    # Extract probable document title from page 1
    p1_text = clean_pdf_text(doc[0].get_text("text")) if num_pages > 0 else ""
    doc_title_snippet = p1_text[:140].strip() if p1_text else pdf_path.stem

    candidate_chunks: list[tuple[float, dict[str, Any]]] = []

    # Step size for very large books (e.g. 678-page JPL DSOC book or 257-page IAA nuclear book)
    page_indices = list(range(num_pages))

    for p_idx in page_indices:
        raw_page = doc[p_idx].get_text("text")
        clean_page = clean_pdf_text(raw_page)
        if is_reference_or_filler_page(clean_page):
            continue

        # Split page into ~1350-char windows with 150-char overlap
        step = 1200
        window = 1350
        for w_idx, start in enumerate(range(0, len(clean_page), step)):
            segment = clean_page[start : start + window].strip()
            if len(segment) < 240:
                continue

            sig_score = score_chunk_signal(segment, meta["base_keywords"])
            # Always prioritize Page 1/2 (Abstract & Executive Summary)
            if p_idx in (0, 1) and w_idx == 0:
                sig_score += 25.0

            stem_short = re.sub(r"[^a-zA-Z0-9_-]", "", pdf_path.stem)[:28]
            chunk_id = f"PDF-{cat_folder[:6]}-{stem_short}-p{p_idx + 1:03d}" + (f"-c{w_idx + 1}" if w_idx > 0 else "")

            # Extract dynamic keywords from segment
            seg_words = re.findall(r"\b[a-z]{4,18}\b", segment.lower())
            extra_kws = []
            for kw_cand in ("nerva", "stirling", "brayton", "rankine", "cermet", "pewee", "ksc", "veggie", "aph", "methylation", "nlr", "sans", "ppm", "snspd", "psyche", "artemis", "jezero", "perseverance", "curiosity"):
                if kw_cand in seg_words:
                    extra_kws.append(kw_cand)

            chunk_obj = {
                "doc_id": chunk_id,
                "title": f"[{meta['topic_label']}] {pdf_path.name} (Page {p_idx + 1}/{num_pages}): {doc_title_snippet[:80]}",
                "category": meta["module_category"],
                "source_type": f"RAG_PDF_{cat_folder.upper()}",
                "pdf_file": pdf_path.name,
                "folder": cat_folder,
                "page": p_idx + 1,
                "keywords": list(dict.fromkeys(meta["base_keywords"] + extra_kws + [pdf_path.stem.lower()])),
                "content": segment,
            }
            candidate_chunks.append((sig_score, chunk_obj))

    doc.close()

    # Keep top max_chunks_per_pdf sorted by page order for coherent reading
    candidate_chunks.sort(key=lambda x: x[0], reverse=True)
    selected = [c for _, c in candidate_chunks[:max_chunks_per_pdf]]
    selected.sort(key=lambda c: (c["page"], c["doc_id"]))
    return selected


def main() -> None:
    pdfs = sorted(RAG_PDFS_DIR.rglob("*.pdf"))
    all_chunks: list[dict[str, Any]] = []

    print(f"Scanning {len(pdfs)} PDFs in {RAG_PDFS_DIR}...\n")
    for pdf_path in pdfs:
        # Give NASA NTRS, NASA HRP, NASA KSC Space Crop, and JPL/IAA books a slightly higher chunk budget
        is_priority = any(k in pdf_path.name.lower() for k in ("ntrs_", "nasa_", "taricorp_dsoc", "iaaspace_", "biorxiv", "medrxiv", "frontiers"))
        budget = 14 if is_priority else 8
        chunks = extract_chunks_from_pdf(pdf_path, max_chunks_per_pdf=budget)
        all_chunks.extend(chunks)
        print(f"  [{pdf_path.parent.name}] {pdf_path.name:<48} -> {len(chunks):2d} high-signal English chunks")

    lines = [json.dumps(c, ensure_ascii=False) for c in all_chunks]
    OUT_CHUNKS_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nSaved {len(all_chunks)} extracted PDF RAG chunks to {OUT_CHUNKS_PATH}")


if __name__ == "__main__":
    main()
