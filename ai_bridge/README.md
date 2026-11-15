# KATHERINE · IA mentora del juego (puente con AstroCopilot)

## Arranque rápido (juego + KATHERINE con voces HD)

```bash
pip install supertonic        # una sola vez: voces neuronales HD (F1–F5, M1–M5)
npm run katherine             # bridge offline + juego en http://localhost:5174
npm run katherine -- --url <MENTOR_URL> --key <MENTOR_KEY>   # con el modelo real en Colab
```

Las voces HD se generan en tu PC, así que solo aparecen en ⚙ Ajustes cuando el juego se abre con
`npm run katherine` (con `npm run dev` solo verás las voces del navegador). Para Colab usa la celda
`ai_bridge/colab_katherine_cell.py`: al final imprime el comando exacto.


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

## Voz de KATHERINE (cálida, en español e inglés)
- **Voz neural HD (recomendada):** [Supertonic 3](https://github.com/supertone-inc/supertonic) corre en la CPU
  (~4x más rápido que tiempo real, sin GPU) y cada voz habla español **e** inglés, así KATHERINE suena igual en
  los dos idiomas. Se activa sola si el puente está corriendo y tienes el paquete:
  ```
  pip install supertonic
  python ai_bridge/mentor_server.py --backend offline      # o cualquier otro backend
  ```
  La primera vez baja ~400 MB a `ai_bridge/.cache/supertonic3/` (o a `$SUPERTONIC_DIR`). `--voice off` la apaga.
  `mentor_voice.py` convierte números, unidades y símbolos a palabras ("1,350 ppm" → "mil trescientos cincuenta
  partes por millón", "CO₂" → "ce o dos"), porque el modelo lee mal los dígitos en español.
- **Sin puente:** usa la mejor voz instalada del navegador (en Edge, las voces "Natural" como Dalia o Ava suenan muy bien).
- **⚙ en el panel:** el jugador elige idioma (Español / English, cambia todo el juego), voz, velocidad y puede
  probarla. Se guarda en el navegador.
- Modelo de voz: licencia OpenRAIL-M (uso permitido con restricciones de uso responsable); código MIT.

## KATHERINE como maestra (fase 1)
- **Niveles de edad:** al empezar pregunta quién juega: 🧒 Explorador (6–9), 🧑‍🚀 Cadete (10–14), 👩‍🔬 Ingeniero (15+).
  Se cambia desde el orbe (clic → botón de nivel) y se ajusta solo: 2 fallos seguidos bajan un nivel, 4 aciertos suben.
- **Mapa de conceptos** (`src/ai/learner.ts`): 13 conceptos con prerrequisitos. Si el jugador toma una decisión sobre
  "qué cuidar primero", KATHERINE explica antes *respirar en una nave* y *reciclar agua* (texto distinto por nivel).
- **Ciclo de enseñanza:** explicación a su nivel → "¿Entiendes la idea?" → quiz → "explícamelo con tus palabras"
  (respuesta abierta, texto o micrófono) → calificación: el modelo si está en línea, si no, ideas clave → repaso
  espaciado cuando el jugador se atora (concepto medio aprendido, visto hace más de 4 min).
- **Memoria del alumno** en el navegador (`astro.learnerProfile`): dominio por concepto, confusiones y errores de
  concepto detectados por el modelo. Un resumen viaja al modelo en cada pregunta.
- **Verificador** (`verify_reply` en `mentor_server.py`): si el modelo dice un número que no está en la tarjeta, el
  RAG o la telemetría, o invierte el orden aire → agua → comida, se descarta y se usa la tarjeta. Las preguntas de
  seguimiento fuera de tema se quitan.
- **Contenido pre-generado con Colab:** `python ai_bridge/pregen_tutor.py` (con el puente conectado al modelo) escribe
  explicación + analogía + pregunta por tarjeta × nivel × idioma; `python ai_bridge/review_tutor.py` para aprobar.
  Solo lo aprobado llega al juego (`src/ai/generated/tutorContent.json`), al instante y sin internet.

## Controles en el juego
- **[T]** hablar con KATHERINE (🎙 micrófono en Chrome/Edge) · **[F1]–[F4]** responder · **[N]** voz on/off · **[M]** minimapa
- **⚙** idioma y voz · El panel se puede minimizar (▁).

## Cómo extenderlo
- **Nuevo dato / decisión:** agrega una tarjeta en `src/ai/mentorKnowledge.ts` (`say`, `fact`, `source`,
  `simple`, `quiz`, `ragQuery`). Usa números de `src/data/nasaConstants.ts` y hechos históricos verificables.
- **Nuevo evento del juego:** `src/ai/mentorDirector.ts` compara el estado de la simulación cada 400 ms.
  Las decisiones usan el id `<grupo>_<valor>` (p. ej. `act2_krusty_spe`), los objetivos `obj_<clave>`.
- **Personalidad:** frases en `src/ai/offlineMentor.ts` (`OPENERS`, `PERSONA_LINES`) y `SYSTEM_PROMPT` en
  `mentor_server.py`.
- **Voz:** nombres de voces en `src/ai/mentorVoice.ts` (`NEURAL_VOICES`); pronunciación de unidades y símbolos
  en `ai_bridge/mentor_voice.py` (`_UNIT_WORDS`, `_PHRASES`).
- **Probar desde la consola (solo `npm run dev`):**
  `__katherine.sim().crisisDecision = 'food_priority'` · `__katherine.ask('¿por qué la luz es magenta?')`

## Seguridad (jugadores de 10-14 años)
Si el jugador escribe algo que suena a peligro real (dolor de pecho, hacerse daño, etc.), KATHERINE sale del
juego y le pide avisar a un adulto de confianza / 911 (y la Línea de la Vida en México). Esto pasa **antes**
del modelo, en el cliente y en el servidor.
