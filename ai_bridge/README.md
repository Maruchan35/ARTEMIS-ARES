# KATHERINE · IA mentora del juego (puente con AstroCopilot)

KATHERINE es la IA holográfica que acompaña al cadete: observa la simulación, explica cada decisión con datos
reales de la NASA, pregunta **"¿Entiendes la idea?"**, hace un mini-quiz, cuenta **"¿Sabías que…?"** de
astronautas reales y responde preguntas por texto o voz.

```
Juego (React)                         ai_bridge/mentor_server.py                    Modelo
MentorHologram.tsx ──POST /api/mentor──▶ tarjeta verificada + NASA RAG + reglas ──▶ Gemma-4-E4B + LoRA AstroCopilot
  └ mentorDirector.ts (detecta eventos)   (RAG local: 387k docs del repo de IA)       (Colab GPU vía túnel, o local)
  └ offlineMentor.ts  (si no hay servidor, usa las tarjetas verificadas)
```

## Modos de uso

| Modo | Qué necesitas | Comando |
|---|---|---|
| **Sin IA** (por defecto) | nada | `npm run dev` — KATHERINE usa las tarjetas verificadas de `src/ai/mentorKnowledge.ts` |
| **RAG sin GPU** | checkout del repo de IA (rama `main`) | `python ai_bridge/mentor_server.py --backend offline --ai-root "RUTA/colab_entorno"` |
| **Modelo en Colab** | CLI `colab` + adaptador LoRA entrenado | `python ai_bridge/run_colab_mentor.py --ai-root "RUTA/colab_entorno"` |
| **Servidor compatible OpenAI** | llama.cpp / vLLM / LM Studio / Ollama con el modelo | `python ai_bridge/mentor_server.py --backend openai --openai-url http://127.0.0.1:8080` |
| **Pruebas sin GPU** | nada | `python ai_bridge/mentor_server.py --backend mock --rag off` |

El juego busca el puente en `http://localhost:8765`. Para cambiarlo: clic en la línea "Núcleo…" del panel,
`?mentor=https://...` en la URL, o `VITE_MENTOR_URL` en `.env`.

### Modelo en Colab (`run_colab_mentor.py`)
1. Crea una sesión GPU (`--gpu L4`, cae a T4 si no hay).
2. Sube `mentor_server.py` y el adaptador `outputs/astrocopilot_gemma4_lora/` del repo de IA.
3. En Colab carga Gemma-4 en 4-bit + LoRA y abre un túnel Cloudflare protegido con una clave aleatoria.
4. En tu PC levanta el puente en `:8765` con el RAG completo (no hay que subir la base de 632 MB).
5. **Siempre apaga la sesión de Colab** al salir (Ctrl+C) o al llegar a `--max-minutes` (120 por defecto).

`--merge` fusiona el LoRA en bf16: respuestas más rápidas, necesita L4/A100.

## Controles en el juego
- **[T]** hablar con KATHERINE (🎙 micrófono en Chrome/Edge) · **[1]/[2]** responder · **[M]** voz on/off
- El panel se puede minimizar (▁). La voz usa las voces del sistema (en Edge, "Dalia Natural" suena mejor).

## Cómo extenderlo
- **Nuevo dato / decisión:** agrega una tarjeta en `src/ai/mentorKnowledge.ts` (`say`, `fact`, `source`,
  `simple`, `quiz`, `ragQuery`). Usa números de `src/data/nasaConstants.ts` y hechos históricos verificables.
- **Nuevo evento del juego:** `src/ai/mentorDirector.ts` compara el estado de la simulación cada 400 ms.
  Las decisiones usan el id `<grupo>_<valor>` (p. ej. `act2_krusty_spe`), los objetivos `obj_<clave>`.
- **Personalidad:** frases en `src/ai/offlineMentor.ts` (`OPENERS`, `PERSONA_LINES`) y `SYSTEM_PROMPT` en
  `mentor_server.py`.
- **Probar desde la consola (solo `npm run dev`):**
  `__katherine.sim().crisisDecision = 'food_priority'` · `__katherine.ask('¿por qué la luz es magenta?')`

## Seguridad (jugadores de 10-14 años)
Si el jugador escribe algo que suena a peligro real (dolor de pecho, hacerse daño, etc.), KATHERINE sale del
juego y le pide avisar a un adulto de confianza / 911 (y la Línea de la Vida en México). Esto pasa **antes**
del modelo, en el cliente y en el servidor.
