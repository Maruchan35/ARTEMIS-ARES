# AstroCopilot (`unsloth/gemma-4-E4B-it` QLoRA + Deterministic NASA RAG)

**Version:** `v2.2-a100-multimodal-mentor`  
**Base Model:** `unsloth/gemma-4-E4B-it` (Multimodal Vision + Text, 4-bit NF4 + QLoRA `r=32, alpha=64`)  
**Target Role:** Multimodal Socratic AI Flight Director & Game Mentor for a NASA-inspired space survival simulator (ages 10–14, 100% English).

---

## 1. Key Capabilities in `v2.2-a100-multimodal-mentor`

1. **Multimodal Screen + Telemetry Fusion (`<image>` + JSON):**
   - Inspects live game HUD screenshots alongside structured JSON telemetry emitted by the game engine.
   - Supports two output modes controlled via `"response_mode"` in `mission_context`:
     - **`HUD_JSON`**: Outputs a strict, non-truncating 5-key JSON object (`<= 220` words) for game UI widgets (`status`, `primary_threat`, `recommended_actions`, `scientific_rationale`, `copilot_message`).
     - **`MENTOR_CHAT`**: Outputs interactive conversational Socratic mentoring grounded in both the HUD screen and telemetry.
2. **Adaptive Socratic vs. Crisis Coaching Protocol:**
   - **Socratic Coach Mode (`[MODE: SOCRATIC_COACH]`, `life_support_hours > 24h`):** Does not spoil the entire puzzle at once. Names the relevant NASA physics/ECLSS principle, cites the exact HUD/telemetry discrepancy, and asks 1 guiding question (`?`) so the player discovers the fix.
   - **Crisis Command-First Mode (`[MODE: CRISIS_COMMAND_FIRST]`, `life_support_hours <= 24h` or active descent/docking hazard):** Gives the immediate step-by-step survival action first, followed by a brief physical explanation and a confirmation question.
3. **Deterministic NASA RAG Engine (`src/nasa_rag_engine.py` — 367 Documents):**
   - Combines core NASA standards (`NASA-TP-2015-218570` BVAD, `NASA-STD-3001`, `Apollo-13-LiOH`, `ISS-ECLSS-VCD`, `Mars-MOXIE-ISRU`, `Kilopower-KRUSTY`, `Sgr A* EHT`, `NTP Nuclear Thermal Propulsion`, `DSOC Optical Comms`, `SOMA Genomics`, and 23 ingested scientific PDFs) with deterministic telemetry rule verification.

---

## 2. Game Engine Telemetry + Screen JSON Contract

Send the current game HUD screenshot (`<image>`) together with this JSON payload in the user message:

```json
{
  "mission_context": {
    "planet": "Moon",
    "biome": "Lunar South Pole (Shackleton Rim)",
    "mission_phase": "HABITAT_OPERATIONS",
    "day_or_sol": 18,
    "response_mode": "MENTOR_CHAT",
    "player_last_action": "Selected MOXIE_CO2_ELECTROLYSIS in build menu"
  },
  "telemetry": {
    "eclss": {
      "cabin_pressure_kpa": 70.3,
      "cabin_o2_pct": 21.8,
      "ppco2_mmhg": 3.4,
      "cabin_temp_c": 29.8,
      "humidity_pct": 52.0,
      "life_support_hours_remaining": 48.0,
      "power_reserve_pct": 64.0
    },
    "flight_navigation": {
      "altitude_m": 0.0,
      "vertical_speed_m_s": 0.0,
      "horizontal_drift_m_s": 0.0,
      "propellant_margin_pct": 100.0
    },
    "habitat_layout": {
      "reactor_to_hab_tiles": 6,
      "dust_storm_tau": 0.0,
      "selected_isru_module": "MOXIE_CO2_ELECTROLYSIS"
    },
    "crew_biometrics": {
      "eva_cumulative_dose_msv": 42.0,
      "crew_stress_index": 24,
      "hydration_pct": 91.0
    }
  }
}
```

### Expected Output when `"response_mode": "HUD_JSON"`
```json
{
  "status": "WARNING",
  "primary_threat": "Planetary ISRU mismatch: MOXIE CO2 electrolysis selected on the airless Moon.",
  "recommended_actions": [
    "Cancel MOXIE_CO2_ELECTROLYSIS placement in the Lunar South Pole build queue.",
    "Select Regolith Ilmenite Hydrogen Reduction or Polar Water-Ice Electrolysis for O2 production.",
    "Verify radiator heat-rejection loop clearance before starting 10 kWe FSP power draw."
  ],
  "scientific_rationale": "MOXIE requires a 95% CO2 atmosphere like Mars (NASA-MOXIE-ISRU-2021). The Moon is a hard vacuum (~3e-15 bar), so oxygen must be extracted from polar water ice (H2O) or iron-titanium oxide regolith (FeTiO3).",
  "copilot_message": "Cadet, check the atmosphere gauge on your HUD! Since the Moon has zero CO2 gas in the sky, which solid resource in Shackleton Crater holds the oxygen atoms we need?"
}
```

---

## 3. Repository Structure

- `src/nasa_rag_engine.py`: Deterministic NASA RAG retriever (`367` verified docs) + telemetry physics verifier & Socratic/Crisis coaching strategy injector.
- `src/curated_clean_expansions.py`: `644` 100%-unique curated examples (114 safety boundaries, 120 4-turn Socratic dialogues, 130 numeric/contract/vision drills, 80 space humor + telemetry rows, 80 RAFT library Q&As).
- `src/build_master_dataset.py`: Master dataset generator (`1,491` train rows, `16` eval rows) + synthetic 12-state HUD screen generator (`data/images/*.png`).
- `src/train_gemma4_qlora.py`: Unsloth Gemma-4-E4B-it QLoRA trainer (`r=32, alpha=64`) with full multi-turn assistant loss masking (`prepare_text_minibatch`) and 14-probe evaluation harness.
- `src/audit_dataset_and_rag.py` & `src/validate_dataset.py`: Automated quality, uniqueness, language (`100%` English), and schema audits.
- `src/run_colab_a100_v22.py`: Automated Google Colab A100 orchestrator.
- `data/rag_pdfs/`: 23 open-access scientific PDFs across 6 domains (Sgr A* EHT, NTP Nuclear Propulsion, DSOC Optical Comms, SOMA Genomics, Extremophiles/Botany, NASA Artemis Plan).
- `checkpoints/`: Versioned manifests, metrics, and configs (`v1.0`, `v2.0`, `v2.1`, `v2.2`). Large `.safetensors` adapter weights (`266 MB`) are attached in **GitHub Releases**.
