# ORBITAL QUARTERS — AETHER-4 3D Astronaut Trainer

Standalone React + TypeScript + Three.js + Tailwind CSS local 3D space habitation and mission simulator built exclusively with published NASA reference parameters (`src/data/nasaConstants.ts`).

## Features
- **Beveled NASA Menu & Mission Selector**: Interactive phase selection from Phase 0 Tutorial (`tutorial_hab`) through Act 4 (`act4_storm_rover`) with a live animated 3D Chibi astronaut preview.
- **Replicated 3D Habitation Architecture Across Phases**: Continuous 10-variable life-support simulation (`stepSpaceRoomSimulation`), gravity-aware player locomotion (`stepSpaceRoomPlayer`), spectral lighting modes (`6,300 K`, `630+450 nm` magenta APH/Veggie, `#0F2547` launch blueprint), PBR procedural textures, and multi-part 3D hardware (`ASCAN` treadmill, `WHC` booth, `MEDS` 11-LCD glass cockpit, `Skylab` thermal patch, `KRUSTY`, `SPE`, `APH/Veggie`, 6,000 kg Rover, and 2 m regolith shield).
- **Space Paper Daily Report & Legacy Codex**: Six retro daily report editions and six mission legacy notes (`src/components/SpacePaperCodexModal.tsx`), plus bilingual `ES` / `EN` support and Web Audio synthesis.

- **KATHERINE · IA mentora holográfica** (`src/components/MentorHologram.tsx`, `src/ai/`): explica cada decisión con datos reales de la NASA, pregunta "¿Entiendes la idea?", hace mini-quiz, cuenta "¿Sabías que…?" de astronautas reales, responde por texto/voz ([T]) y habla con TTS. Se conecta al modelo AstroCopilot (Gemma-4 + LoRA + NASA RAG) con `ai_bridge/` y, si no hay servidor, usa tarjetas verificadas. Ver [ai_bridge/README.md](ai_bridge/README.md).

## Quickstart

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```
