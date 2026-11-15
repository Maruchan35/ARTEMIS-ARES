# Catálogo de Datasets Verificados: Espacio e Historia

Colección descargada y organizada en esta carpeta a partir de fuentes verificadas de **agencias espaciales, museos nacionales, institutos de investigación y universidades**.

> **Nota sobre idioma:** La gran mayoría de los datasets científicos e institucionales originales están en **inglés** (el estándar de la NASA, SAO/NASA ADS, Caltech y universidades). Para tu sistema **RAG** y **fine-tuning**, puedes indexarlos directamente con embeddings multilingües (p. ej. `bge-m3`, `multilingual-e5`, `text-embedding-3`) o traducir/adaptar los ejemplos que necesites al español durante el entrenamiento.

---

## Estructura de Carpetas

### `00_listos_para_rag_y_entrenamiento/` (Archivos combinados listos para usar)
Generados por `preparar_rag_y_sft.py` conservando en cada línea los campos `source`, `institution`, `license` y `commercial_safe` para trazabilidad y filtrado de licencias:

| Archivo | Contenido | Registros | Uso principal |
|---|---|---:|---|
| `espacio_sft_qa.jsonl` | Pares pregunta-respuesta y razonamiento sobre espacio, astronomía, física y ciencia | 120,628 | Fine-tuning (SFT / LoRA) |
| `espacio_rag_corpus.jsonl` | Documentos científicos, abstracts, capítulos de libro, fichas de exoplanetas e hitos espaciales | 383,848 | Base de conocimiento RAG |
| `historia_sft_qa.jsonl` | Preguntas de opción múltiple y razonamiento paso a paso (CoT) de historia mundial, prehistoria, Europa, EE. UU. y religiones | 1,632 | Fine-tuning (SFT / evaluación) |
| `historia_rag_corpus.jsonl` | Libros universitarios de historia universal, artefactos espaciales del Smithsonian, informes NASA NTRS y transcripciones Apollo | 3,932 | Base de conocimiento RAG |

#### Desglose por licencia dentro de `00_listos_para_rag_y_entrenamiento/`:
- **`espacio_sft_qa.jsonl`** (`120,628` ejemplos):
  - `96,593` con `commercial_safe: true` (`CC-BY-4.0`, `CC-BY-SA-4.0`, `MIT`)
  - `10,356` con `commercial_safe: null` (`UniverseTBD/arxiv-qa-astro-ph` — sin campo de licencia explícita en su README de Hugging Face)
  - `13,679` con `commercial_safe: false` (`allenai/sciq` — licencia `CC-BY-NC-3.0`, solo uso no comercial)
- **`espacio_rag_corpus.jsonl`** (`383,848` documentos): todos marcados con licencias abiertas (`CC-BY-4.0`, `CC`, `MIT`, `CC0-1.0`, `Public Domain`).
- **`historia_sft_qa.jsonl`** (`1,632` ejemplos): todos con licencia `MIT` (`commercial_safe: true`).
- **`historia_rag_corpus.jsonl`** (`3,932` documentos): todos con licencias abiertas (`CC-BY-4.0`, `CC0-1.0`, `Public Domain`).

---

### `01_espacio_qa_y_rag/` (Espacio, Astronomía y Física — Datasets Originales)

1. **`nasa_impact_sde_ir_v5/`**
   - **Institución:** NASA IMPACT (Office of Data Science and Informatics, Marshall Space Flight Center, NASA) — publicado en *ACM KDD 2026*.
   - **Fuente:** `https://huggingface.co/datasets/nasa-impact/nasa-sde-IR-benchmark-20251024-v5`
   - **Licencia:** `CC-BY-4.0`
   - **Contenido:** `corpus.jsonl` (82,607 documentos del NASA Science Discovery Engine), `queries.jsonl`, `qrels/qa_pairs.tsv`, `qrels/search_pairs.tsv`, y el archivo derivado `nasa_sde_qa_pares.jsonl` con **86,772 pares pregunta-respuesta**.

2. **`nasa_impact_smd_ir/`**
   - **Institución:** NASA Science Mission Directorate (SMD) & IBM Research (proyecto *INDUS*).
   - **Fuente:** `https://huggingface.co/datasets/nasa-impact/nasa-smd-IR-benchmark`
   - **Licencia:** `CC` (Creative Commons)
   - **Contenido:** `corpus.jsonl` (270,206 documentos/abstracts científicos de astrofísica, ciencia planetaria, heliofísica y ciencias de la Tierra) y consultas anotadas (`queries.jsonl`, `qrels/`).

3. **`sao_nasa_ads_uat/`**
   - **Institución:** SAO/NASA Astrophysics Data System (Smithsonian Astrophysical Observatory & Harvard-Smithsonian Center for Astrophysics).
   - **Fuente:** `https://huggingface.co/datasets/adsabs/SciX_UAT_keywords`
   - **Licencia:** `MIT`
   - **Contenido:** **21,702 artículos** (`18,677` train + `3,025` val; `21,653` con título y abstract completos) etiquetados con conceptos del *Unified Astronomy Thesaurus (UAT)*. Incluye `.parquet` originales y `.jsonl`.

4. **`universetbd_arxiv_astro_qa/`**
   - **Instituciones:** Consorcio **UniverseTBD** (investigadores de Australian National University, Harvard CfA, Space Telescope Science Institute [STScI], NASA ADS, ESA, Columbia University y ETH Zurich).
   - **Fuente:** `https://huggingface.co/datasets/UniverseTBD/arxiv-qa-astro-ph`
   - **Licencia:** Sin licencia explícita en el README de Hugging Face (preguntas y respuestas derivadas de artículos `arXiv astro-ph`).
   - **Contenido:** **10,356 pares pregunta-respuesta** de astrofísica (`train.parquet` y `arxiv_qa_astro_ph.jsonl`).

5. **`openstax_astronomy_2e_rice/`**
   - **Institución:** **Rice University (OpenStax)** — libro universitario revisado por pares.
   - **Fuente:** `https://openstax.org/details/books/astronomy-2e`
   - **Licencia:** `CC-BY-4.0`
   - **Contenido:** `Astronomy_2e_OpenStax_Rice.pdf`, más texto limpio extraído (`astronomy_2e_paginas.jsonl` — **1,148 páginas** y `astronomy_2e_texto.txt`) listo para RAG.

6. **`uc_berkeley_mmlu_ciencia/`**
   - **Institución:** **UC Berkeley** (Center for AI Safety — Dan Hendrycks et al.).
   - **Fuente:** `https://huggingface.co/datasets/cais/mmlu`
   - **Licencia:** `MIT`
   - **Contenido:** Subconjuntos `astronomy` (173), `college_physics` (118), `conceptual_physics` (266) y `high_school_physics` (173), en `.parquet` y `.jsonl`.

7. **`uwaterloo_osu_mmlu_pro_ciencia/`**
   - **Instituciones:** **University of Waterloo, The Ohio State University (OSU) y Carnegie Mellon University (CMU)** (TIGER-Lab).
   - **Fuente:** `https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro`
   - **Licencia:** `MIT`
   - **Contenido:** `mmlu_pro_astronomy_y_fisica.jsonl` (**1,304 preguntas** de astronomía y física con 10 opciones y razonamiento paso a paso `cot_content`, además de los `.parquet` originales en `_raw_mmlu_pro/`).

8. **`allenai_sciq/` y `allenai_ai2_arc/`**
   - **Institución:** **Allen Institute for AI (AI2)**.
   - **Fuentes:** `https://huggingface.co/datasets/allenai/sciq` y `https://huggingface.co/datasets/allenai/ai2_arc`
   - **Licencias:** `allenai/sciq` es **`CC-BY-NC-3.0`** (No Comercial); `allenai/ai2_arc` es **`CC-BY-SA-4.0`**.
   - **Contenido:** `sciq` (**13,679 preguntas** de ciencias con párrafo de soporte ideal para RAG+QA) y `ai2_arc` (**7,787 preguntas** de razonamiento científico entre `ARC-Easy` y `ARC-Challenge`).

---

### `02_espacio_catalogos_y_datos_reales/` (Datos Reales para Lore del Juego y RAG Factual)

1. **`nasa_exoplanet_archive_caltech/`**
   - **Institución:** **Caltech / IPAC & NASA Exoplanet Science Institute**.
   - **Fuente:** `https://exoplanetarchive.ipac.caltech.edu/` (tabla `pscomppars` vía TAP API).
   - **Licencia:** Dominio Público (NASA / Gobierno de EE. UU.).
   - **Contenido:** **6,470 exoplanetas confirmados** con 34 parámetros científicos clave (estrella anfitriona, distancia, período orbital, radio, masa, temperatura, método y año de descubrimiento) en `exoplanets_confirmed_pscomppars.csv`, `.json`, y fichas descriptivas en `exoplanets_rag_fichas.jsonl`.

2. **`nasa_jpl_cneos_y_meteoritos/`**
   - **Instituciones:** **NASA Jet Propulsion Laboratory (JPL / CNEOS)** y **NASA Open Data (`data.nasa.gov`) / The Meteoritical Society**.
   - **Licencia:** Dominio Público (NASA / Gobierno de EE. UU.).
   - **Contenido:**
     - `jpl_fireballs.json`: **1,074 eventos** de bólidos/meteoros detectados (`https://ssd-api.jpl.nasa.gov/fireball.api`).
     - `jpl_neo_close_approaches.json`: **5,000 acercamientos cercanos** de asteroides/cometas NEO (`https://ssd-api.jpl.nasa.gov/cad.api`, muestra de hasta 5,000 de 44,017 disponibles).
     - `nasa_meteorite_landings.csv`: **45,716 registros** históricos de meteoritos en la Tierra (`https://data.nasa.gov/docs/legacy/meteorite_landings/Meteorite_Landings.csv`).

---

### `03_historia_espacial/` (Historia Aeroespacial y Misiones)

1. **`smithsonian_nasm_air_and_space/`**
   - **Institución:** **Smithsonian Institution — National Air and Space Museum (NASM)**.
   - **Fuente:** `https://registry.opendata.aws/smithsonian-open-access/` (256 archivos EDAN JSONL en `raw_edan_shards/`).
   - **Licencia:** `CC0-1.0` (Dominio Público).
   - **Contenido:** **1,010 artefactos históricos** aeroespaciales con descripciones curatoriales limpias en `nasm_artefactos_limpios.jsonl` (cohetes, misiles, cápsulas, instrumentos astronómicos, trajes, satélites).

2. **`nasa_apollo_journals_transcripts/`**
   - **Institución:** **NASA Johnson Space Center / Manned Spacecraft Center & Apollo Lunar Surface Journal**.
   - **Fuentes:** `https://apollojournals.org/alsj/a11/a11transcript_tec.pdf`, `https://apollojournals.org/alsj/a13/AS13_TEC.txt`, y `https://github.com/paddyredbeard/apollo-13.json`.
   - **Licencia:** Dominio Público (NASA / Gobierno de EE. UU.).
   - **Contenido:** Transcripciones técnicas aire-tierra de **Apollo 11** (PDF + **385 páginas** extraídas en `.jsonl`/`.txt`) y **Apollo 13** (`.txt` + `.json`, fragmentado en **274 segmentos** para RAG).

3. **`nasa_ntrs_space_history/`**
   - **Institución:** **NASA Technical Reports Server (NTRS — NASA Scientific and Technical Information Program)**.
   - **Fuente:** `https://ntrs.nasa.gov/api/citations/search`
   - **Licencia:** Dominio Público (NASA / Gobierno de EE. UU.).
   - **Contenido:** `nasa_ntrs_space_history.jsonl` con **754 resúmenes históricos únicos** de reportes técnicos de NASA sobre historia de la exploración espacial, Apollo, Voyager, Hubble, Transbordador Espacial, Mercury/Gemini, Marte y JWST.

---

### `04_historia_general/` (Historia Universal, Prehistoria y Civilizaciones)

1. **`openstax_world_history_rice/`**
   - **Institución:** **Rice University (OpenStax)** — libros universitarios revisados por pares.
   - **Fuentes:** `https://openstax.org/details/books/world-history-volume-1` y `world-history-volume-2`
   - **Licencia:** `CC-BY-4.0`
   - **Contenido:**
     - *World History, Volume 1: to 1500* (PDF + **788 páginas** limpias en `world_history_vol1_paginas.jsonl` y `.txt`).
     - *World History, Volume 2: from 1400* (PDF + **721 páginas** limpias en `world_history_vol2_paginas.jsonl` y `.txt`).

2. **`uc_berkeley_mmlu_historia/`**
   - **Institución:** **UC Berkeley** (Center for AI Safety).
   - **Fuente:** `https://huggingface.co/datasets/cais/mmlu`
   - **Licencia:** `MIT`
   - **Contenido:** Subconjuntos `prehistory` (364), `high_school_world_history` (268), `high_school_us_history` (231), `world_religions` (195) y `high_school_european_history` (188).

3. **`uwaterloo_osu_mmlu_pro_historia/`**
   - **Instituciones:** **University of Waterloo, The Ohio State University (OSU) y CMU** (TIGER-Lab).
   - **Fuente:** `https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro`
   - **Licencia:** `MIT`
   - **Contenido:** `mmlu_pro_historia.jsonl` (**386 preguntas** de historia con 10 opciones y razonamiento paso a paso `cot_content`).

4. **`oxford_seshat_global_history/`**
   - **Instituciones:** **University of Oxford, Alan Turing Institute, University of Connecticut (UConn) y Complexity Science Hub Vienna**.
   - **Fuente:** `https://github.com/seshatdb/Equinox_Data` (`Equinox_on_GitHub_June9_2022.xlsx`).
   - **Licencia:** Aviso importante: el `README.md` del repositorio especifica **`CC-BY-NC-SA`** (uso no comercial), mientras que el archivo `LICENSE` en el repositorio contiene el texto de `CC0 1.0`. Conviene tratarlo como **`CC-BY-NC-SA`** (uso académico/no comercial) salvo confirmación directa con Seshat.

---

## Recomendación rápida para tu juego (Entrenamiento + RAG)

1. **Para entrenar / hacer Fine-Tuning (LoRA / SFT):**
   - Usa `00_listos_para_rag_y_entrenamiento/espacio_sft_qa.jsonl` + `historia_sft_qa.jsonl`.
   - Si tu juego será comercial, filtra los registros donde `commercial_safe == true` (`96,593` de espacio + `1,632` de historia) para excluir `allenai/sciq` (`CC-BY-NC-3.0`) y datos sin licencia explícita.
   - Si quieres regenerar o cambiar el formato de instrucciones (por ejemplo, formato ShareGPT / ChatML o traducir un lote al español), modifica `preparar_rag_y_sft.py` y vuelve a ejecutarlo.

2. **Para tu sistema RAG:**
   - Indexa `00_listos_para_rag_y_entrenamiento/espacio_rag_corpus.jsonl` (`383,848` docs) e `historia_rag_corpus.jsonl` (`3,932` docs) en tu base vectorial (Chroma, FAISS, Qdrant, pgvector, etc.).
   - Si prefieres un índice más ligero y enfocado en divulgación/enciclopedia (sin los 270k abstracts técnicos de `nasa_impact_smd_ir`), puedes indexar por separado:
     - `01_espacio_qa_y_rag/openstax_astronomy_2e_rice/astronomy_2e_paginas.jsonl` (1,148 págs.)
     - `01_espacio_qa_y_rag/nasa_impact_sde_ir_v5/corpus.jsonl` (82,607 docs NASA)
     - `02_espacio_catalogos_y_datos_reales/nasa_exoplanet_archive_caltech/exoplanets_rag_fichas.jsonl` (6,470 exoplanetas reales)
     - `03_historia_espacial/` (Smithsonian NASM + Apollo 11/13 + NASA NTRS)
     - `04_historia_general/openstax_world_history_rice/` (1,509 págs. de historia universal)
