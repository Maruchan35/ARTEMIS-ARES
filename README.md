# AstroCopilot (`unsloth/gemma-4-E4B-it` QLoRA + 387,730-Doc Hybrid NASA Mega-RAG)

**Active Version:** `v3.0-a100-final-mega`  
**Base Model:** `unsloth/gemma-4-E4B-it` (Multimodal Vision + Text, 4-bit NF4 + QLoRA `r=32, alpha=64`, `69,763,072` trainable params)  
**Target Role:** Multimodal Socratic AI Flight Director & Game Mentor for a NASA-inspired space survival simulator (ages 10–14, 100% English).

---

## 1. What's New in `v3.0-a100-final-mega`

Trained on **NVIDIA A100-SXM4-40GB** (`1,204` steps in `1,814.45 s`, peak VRAM `32.75 GB`, loss `3.3888 -> 0.4147`) across **4,157 clean, audited unique training rows** (`5,665` examples seen: `1,508` core rows x 2 epochs + `2,649` Mega Knowledge rows x 1 epoch):

1. **Two-Tier Hybrid NASA & History RAG Engine (`src/nasa_rag_engine.py` — `387,730` verified docs):**
   - **Tier-1 JSONL (`data/nasa_rag_corpus.jsonl`):** `367` core high-priority NASA documents (BVAD `NTRS 20210024855`, `NASA-STD-3001`, FSP/ESM `NTRS 20220004670` & `20040015099`, Apollo 13 LiOH, ISS ECLSS, Mars MOXIE, Kilopower, Sgr A* EHT, NTP, DSOC, SOMA, and 23 scientific PDFs).
   - **Tier-2 SQLite FTS5 (`data/nasa_mega_rag.sqlite`, `387,363` docs):** Built via `src/ingest_mega_rag.py` from `datasets_espacio_historia` (`espacio_rag_corpus.jsonl`, `historia_rag_corpus.jsonl`, NASA SDE IR v5, NASA SMD IR, SAO/NASA ADS SciX UAT, OpenStax Astronomy 2e, OpenStax World History Vol 1 & 2, Caltech Exoplanet Archive, JPL CNEOS Fireballs/NEOs, NASA Meteorites, Smithsonian NASM, Apollo 11 & 13 Transcripts, NASA NTRS Space History, and Oxford Seshat Polities).
   - **Intent Gate & Deterministic Physics/Safety Rules:** Real-world medical/safety emergencies and casual banter/jokes receive `0` injected technical docs, while technical queries verify Newtonian inertia (`1.0x`), FSP radiator scaling (`216.2 m2` Equator vs `133.4 m2` Pole), and CO2 scrubber limits (`NTRS 20190027563`).
2. **Multimodal Screen + Telemetry Fusion (`<image>` + JSON) & Precision Fixes:**
   - Supports `HUD_JSON` (strict 5-key JSON `<= 220` words) and `MENTOR_CHAT` modes across 12 HUD screens (`74` vision rows).
   - Achieved **4/4 valid JSON** (`eval-sf-01`, `sim-tele-080`, `mm-vis-star-radlab-eva-en`, `probe-mentor-crisis-contract-en`) across all `19` live benchmarks in `outputs/qlora_training_report.json`.
   - Zero dataset audit violations (`src/audit_dataset_and_rag.py`): `132` `safety_boundaries`, `123` `multi_turn`, `80/80` unique child-safe space humor prompts, and `661/661` unique curated assistant turns.

---

## 2. Version Control Registry (`checkpoints/registry.json`)

| Version | GPU | Rank | Steps | Train Rows | Loss | RAG Docs |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| `v1.0-l4-baseline-r8` | NVIDIA L4 (24 GB) | `r=8` | 75 | 443 | `16.41->1.8949` | 0 |
| `v2.0-a100-qlora-r32-rag` | A100-SXM4-40GB | `r=32` | 416 | 2304 | `3.72->0.3801` | 362 |
| `v2.1-a100-qlora-clean-rag-gated` | A100-SXM4-40GB | `r=32` | 780 | 1455 | `3.07->0.3799` | 362 |
| `v2.2-a100-multimodal-mentor` | A100-SXM4-40GB | `r=32` | 852 | 1491 | `3.15->0.3724` | 367 |
| **`v3.0-a100-final-mega` (Active)** | **A100-SXM4-40GB** | **`r=32`** | **1204** | **4157** | **`3.39->0.4147`** | **387,730 (`367` Tier-1 + `387,363` Tier-2)** |

---

## 3. Repository Structure & Large Assets (GitHub Releases)

Files under GitHub's file size limit are committed directly in Git:
- `data/astrocopilot_master_train.jsonl` (`4,157` training rows, `7.42 MiB`) & `data/astrocopilot_master_eval.jsonl` (`16` rows).
- `data/nasa_rag_corpus.jsonl` (`367` Tier-1 docs) & `data/rag_pdfs/` (`23` PDFs) & `data/images/` (`12` HUD screens).
- `data/datasets_espacio_historia/`: New curated space & history datasets (`CATALOGO_DATASETS.md`, `preparar_rag_y_sft.py`, `02_espacio_catalogos_y_datos_reales/`, `03_historia_espacial/`, `04_historia_general/` JSONLs & Seshat Excel, `01_espacio_qa_y_rag/` JSONLs/parquets `< 49 MiB`, and `historia_rag_corpus.jsonl` / `historia_sft_qa.jsonl`).
- `src/`: `ingest_mega_rag.py`, `mega_dataset_expander.py`, `nasa_rag_engine.py`, `build_master_dataset.py`, `curated_clean_expansions.py`, `audit_dataset_and_rag.py`, `train_gemma4_qlora.py`, `run_colab_a100_v30.py`, `checkpoint_manager.py`.
- `checkpoints/` & `outputs/qlora_training_report.json`: Complete training reports, metrics, and SHA-256 manifests.

### Downloading >100 MB Weights & Full Mega-RAG Binary (`GitHub Release v3.0-a100-final-mega`)

Because GitHub blocks individual Git blobs `> 100 MiB`, the trained LoRA weights, compressed SQLite FTS5 Mega-RAG index, and the 7 largest raw source files (`>= 49 MiB`) are attached in the **[`v3.0-a100-final-mega` GitHub Release](https://github.com/Maruchan35/buchencio2/releases/tag/v3.0-a100-final-mega)**:

1. `adapter_model.safetensors` (`266.20 MiB`) & `adapter_config.json` -> put into `outputs/astrocopilot_gemma4_lora/`
2. `nasa_mega_rag.sqlite.gz` (`208.70 MiB`) -> decompress with `gzip -d nasa_mega_rag.sqlite.gz` into `data/nasa_mega_rag.sqlite`
3. `datasets_espacio_historia_large_raw.zip` -> optional raw `>= 49 MiB` corpus files (`espacio_rag_corpus.jsonl`, `espacio_sft_qa.jsonl`, NASA SMD/SDE `corpus.jsonl`, OpenStax PDFs)

Quick download with GitHub CLI:
```bash
gh release download v3.0-a100-final-mega -R Maruchan35/buchencio2 -p adapter_model.safetensors -D outputs/astrocopilot_gemma4_lora/
gh release download v3.0-a100-final-mega -R Maruchan35/buchencio2 -p nasa_mega_rag.sqlite.gz -D data/
gzip -d data/nasa_mega_rag.sqlite.gz
python src/audit_dataset_and_rag.py
```
