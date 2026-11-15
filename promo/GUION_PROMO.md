# CodeCraft · AETHER-4 Orbital Quarters — Promo cinemático de 30 s

**Formato:** 1920×1080 · 30 fps · 900 frames · H.264 · estéreo 48 kHz.
**Versión renderizada:** `out/codecraft_aether4_promo.mp4`. Usa capturas reales del juego, la voz neural de KATHERINE (Supertonic 3) y una banda sonora sintetizada.
**Paleta:** negro espacial `#03060D`, cian `#38E1FF`, azul eléctrico `#2F6BFF` y blanco `#EAF6FF`. El rojo `#FF4D6D` aparece solo en el clímax.
**Tipografía:** Orbitron para los títulos de HUD, JetBrains Mono para el código y la telemetría, e Inter para los subtítulos.

---

## 1 · Storyboard segundo a segundo

### Bloque A · [00:00 – 00:07] Intro / Hook: "el sistema despierta"

| Tiempo | Imagen | Texto / HUD | Audio |
|---|---|---|---|
| 00:00.0–00:00.5 | Negro con una retícula azul tenue que respira. Cursor parpadeando. | — | Sub-drone en La (55 Hz + 27.5 Hz) entrando. |
| 00:00.5–00:04.1 | Terminal flotante a la izquierda. 14 líneas reales se escriben solas: `npm run build`, `✓ built in 5.50s`, `[rag] NASA Hybrid RAG ready: 387,730 documents`, `[hf] gemma-4-E4B-it + astrocopilot_gemma4_lora`, `[voice] Supertonic 3 ready`, `MENTOR_SERVER_READY`… A la derecha, una barra **BUILD · CODECRAFT** va de 0 a 100 % y los módulos (`mentorKnowledge.ts`, `nasa_rag_engine.py`…) se marcan ■. | Log en mono, paleta cian, azul y verde. | Un *tick* digital por cada línea compilada. Blip agudo cada 4 líneas. |
| 00:04.1–00:04.6 | Todo el contenido se comprime verticalmente en una **línea de luz blanca** que cruza la pantalla. | — | Riser corto (200 → 2,400 Hz). |
| 00:04.6–00:05.0 | La línea se abre como un párpado y revela el **menú del simulador**: el astronauta chibi en traje EVA azul sobre su plataforma. | — | **Boot hit:** golpe sub + acorde Am(add9) + 3 campanas cristalinas. |
| 00:05.0–00:07.0 | Push-in lento (1.00 → 1.07). Los 4 corchetes de HUD crecen desde las esquinas. | `SYS ▸ ONLINE · CODECRAFT RUNTIME` / `ORBITAL QUARTERS · 3D REAL TIME` | **KATHERINE:** "Sistemas en línea… ¡Hola, cadete!" Blips L/R en cada corchete. |

### Bloque B · [00:07 – 00:17] Acción / Desarrollo: "el simulador corriendo"

| Tiempo | Imagen | Texto / HUD | Audio |
|---|---|---|---|
| 00:07.0–00:10.2 | **Clip real**: paneo por el hábitat (Fase 0). Pull-back 1.10 → 1.00. Columna izquierda con 5 tarjetas de telemetría que entran en cascada (O₂ 21.0 %, CO₂ 582 ppm, H₂O 103 L, 10.0 kWe, 22 °C), con valores vivos y sparklines. A la derecha, el stream del **Mentor Director**: `tick ▸ Δ telemetry` → `objective ▸ obj_sleepCompleted` → `decision ▸ crisis_water_priority` → `mentor ▸ "¿Entiendes la idea?"`. | `TELEMETRÍA EN TIEMPO REAL` / `NASA BVAD · ECLSS · stepSpaceRoomSimulation() · 400 ms` | Entra el pulso a 120 BPM: kick, hats, bajo con sidechain y arpegio pluck en 16avos. **KATHERINE:** "Telemetría en tiempo real, con datos reales de la NASA." |
| 00:10.2–00:13.0 | Fondo desenfocado del hábitat. El **panel holográfico de KATHERINE** (captura 4K real) entra desde la derecha con glow cian. Una barra de escaneo recorre "¿Sabías que…?" y los botones "[1] Sí, entiendo / [2] Explícamelo otra vez". | `KATHERINE` (Orbitron 92 pt) · `IA mentora · AstroCopilot` · 3 bullets · chip `Gemma-4-E4B + LoRA · RAG 387,730 docs` | **KATHERINE:** "Cada decisión cuenta. Y yo te explico por qué." |
| 00:13.0–00:15.6 | **Montaje de 4 cortes** a ritmo (≈0.65 s cada uno), con whip-pan y desenfoque de movimiento: Cabina MEDS → Superficie lunar en tercera persona → Invernadero magenta → Tormenta solar en tercera persona. | `FASE 1 · CABINA MEDS · 9.81 m/s²` / `SUPERFICIE LUNAR · 1.62 m/s²` / `EL JARDÍN QUE RESPIRA · 630 + 450 nm` / `TORMENTA SOLAR · SPE > 250 mSv` | Whoosh y blip ascendente en cada corte. |
| 00:15.6–00:17.0 | **Sobrecarga:** zoom acelerado (1.02 → 1.38) sobre la tormenta solar, cámara que tiembla cada vez más y tinte rojo multiplicado. Contador gigante `118 → 252 mSv`. Flash blanco al final. | `RADIACIÓN · TRIPULACIÓN` | Riser de 2 s con redoble de snare que se acelera (8vos → 16vos → 32vos). |

### Bloque C · [00:17 – 00:25] Clímax / Resolución: "máxima carga, cero pánico"

| Tiempo | Imagen | Texto / HUD | Audio |
|---|---|---|---|
| 00:17.0–00:19.6 | **Impacto.** Clip real del hábitat en **modo crisis**: pulso rojo a 2 Hz. Lectura gigante `CO₂ 1,350 ppm ▲` con una gráfica que se dispara. Entra el panel de KATHERINE en rojo ("Cadete, escúchame bien…"). | `MODO CRISIS · ÓRDENES PRIMERO` · `umbral 1,200 ppm · ISS < ~4,000 ppm (NASA-STD-3001)` | Boom sub (65 → 26 Hz) con cola de reverb. Alarma suave de dos tonos y latido doble. **KATHERINE:** "Alerta: el CO₂ está subiendo." |
| 00:19.6–00:22.4 | **Carga computacional máxima:** una matriz de 1,024 celdas parpadea; representa los 387,730 documentos del RAG. Se escribe `query ▸ co2 scrubber lioh iss eclss` y aparecen 3 hits reales (`NASA-STD-3001`, `NTRS-LIB-19950066496`, `NTRS-LIB-20050207456`) con su score. Los medidores de **Inferencia (Gemma-4 + LoRA)**, **Recuperación (BM25 + FTS5)** y **Voz neural (Supertonic 3)** suben al 96, 88 y 72 %. | `NASA HYBRID RAG` · `STATUS ▸ ESTABLE · 0 ERRORES` | Arpegio glitch en 32avos que sube de tono y un blip por cada hit. |
| 00:22.4–00:25.0 | **Resolución:** el rojo vira a cian. La curva de CO₂ cae de 1,350 a 612 ppm y aparece `ESTABLE ✓`. Entra el panel de KATHERINE: "Bingo. Houston estaría orgulloso… +2 % moral de la tripulación". | — | Acorde Cmaj(add9) brillante, campanas de "éxito" y el groove de vuelta. **KATHERINE:** "Sin pánico, cadete. Tú tienes el control." |

### Bloque D · [00:25 – 00:30] Outro / Cierre

| Tiempo | Imagen | Texto | Audio |
|---|---|---|---|
| 00:25.0–00:26.0 | Fondo de metal cepillado con gradiente radial, una retícula de piso en perspectiva y 70 partículas que suben. El **isotipo CodeCraft** (corchetes `< >` con un cristal tallado) se dibuja trazo a trazo. | — | Whoosh y golpe del logo con pad Fmaj9. |
| 00:26.0–00:28.5 | El wordmark **CodeCraft** se condensa (tracking 0.5 → 0.08 em) y un barrido de luz lo cruza. | `AETHER-4 · ORBITAL QUARTERS · v1.0` · `KATHERINE AI v3.0 · Gemma-4 + LoRA · NASA Hybrid RAG 387k · Supertonic 3` | Destello agudo (E7). **KATHERINE (EN):** "CodeCraft presents: Aether Four." |
| 00:28.5–00:30.0 | Fundido a negro. | — | Cola de reverb y fade final. |

---

## 2 · Guion técnico: cámara y transiciones

| # | Plano | Cámara / lente (equivalente) | Movimiento | Transición de salida |
|---|---|---|---|---|
| A1 | Terminal + build | 50 mm, frontal, 0° | Dolly-in sutil de la retícula (1.08 → 1.00). La terminal entra con un tilt-up de 30 px. | **Collapse-to-line:** escala Y 1 → 0.012 con brillo ×3. |
| A2 | Menú / astronauta | 35 mm, contrapicado leve | Push-in 1.00 → 1.07 a lo largo de 2.4 s | **Line-split reveal:** máscara `inset` de 50 % a 0 %. |
| B1 | Hábitat (POV) | 24 mm, primera persona | Pan horizontal real (cámara del juego) + pull-back 1.10 → 1.00 | Corte seco a tiempo, en el beat. |
| B2 | Panel de KATHERINE | 85 mm, *macro UI* | El panel entra lateralmente (140 px) y hace un slow push 0.97 → 1.02. Fondo con profundidad de campo baja (blur 14 px). | Corte en el beat. |
| B3 | Montaje de misiones | 24–35 mm, mezcla de 1P y 3P | **Whip-pan** de 240 px con motion-blur de 16 px y flash blanco al 35 % | Whip-pan a la siguiente. |
| B4 | Tormenta solar | 24 mm | Crash-zoom (ease-in 1.02 → 1.38) + *camera shake* creciente (hasta 14 px) | **Flash blanco** de 6 frames. |
| C1 | Crisis CO₂ | 35 mm | Pull-back 1.12 → 1.02. Pulso rojo en *multiply*. | Corte. |
| C2 | Visualización del RAG | Plano gráfico 2D, cenital | Estático. El movimiento lo dan los datos. | **Flash cian** del 55 %. |
| C3 | Resolución | 50 mm sobre el fondo desenfocado | Slow push 1.06 → 1.14. Viraje de color rojo → cian. | **Whoosh** al negro metálico. |
| D | Logo | 50 mm, frontal centrado | Piso en perspectiva (rotateX 72°) que avanza. Partículas en parallax. | Fade a negro de 22 frames. |

**Reglas de continuidad**
- El horizonte del HUD queda siempre a 36–48 px de los bordes.
- El texto principal va alineado a la izquierda en x = 80–120 px.
- La UI del juego aparece en planos medios y las cifras grandes en Orbitron.
- Todos los números en pantalla son datos reales del proyecto: constantes NASA del juego, IDs del RAG y métricas del build.

---

## 3 · Prompts en inglés para generar video con IA (Runway Gen-3/Gen-4, Sora, Kling)

**Ancla de estilo.** Pégala al final de **cada** prompt para mantener la consistencia visual:

```
STYLE ANCHOR: cinematic sci-fi product film, AETHER-4 "Orbital Quarters" simulator look: compact ISS-style habitat module
with white padded wall panels, navy-blue bunks and lockers, cool 6300 K cabin lighting, a cute chibi astronaut in a
white-and-royal-blue EVA suit with a dark glossy visor; floating holographic HUD panels with thin cyan (#38E1FF) and
electric-blue (#2F6BFF) lines on near-black, monospaced telemetry text, subtle scanlines and film grain, shallow depth of
field, anamorphic lens flares, high contrast, clean minimal UI, 24 fps motion blur, 16:9, 4K
```

**Negative / evitar:** `no logos of real companies, no NASA meatball logo, no readable gibberish text, no extra limbs, no warped faces, no cartoon outlines, no oversaturated rainbow colors, no handheld wobble unless specified`

| Escena | Prompt |
|---|---|
| **A1 · Compile hook** (0–4.6 s) | `Extreme close-up dolly-in on a floating transparent terminal window in a dark void, lines of code and build logs typing themselves line by line in cyan and white monospace, a thin horizontal progress bar filling from left to right with a soft electric-blue glow, faint perspective grid breathing in the background, tiny data particles drifting, at the end all the content compresses vertically into a single razor-thin line of white light that stretches across the frame. [STYLE ANCHOR]` |
| **A2 · Boot reveal** (4.6–7 s) | `A horizontal line of white light splits open vertically like an eyelid revealing a chibi astronaut in a white and royal-blue EVA suit standing on a glowing circular platform in space, slow cinematic push-in, low angle, cyan holographic corner brackets drawing themselves at the four corners of the frame, subtle chromatic aberration on the reveal, stars and a thin planetary arc behind. [STYLE ANCHOR]` |
| **B1 · Live telemetry** (7–10.2 s) | `First-person view slowly panning across the interior of a compact space-station habitat module, padded white walls, navy bunks, a central table with tools, a large window showing Earth; floating holographic telemetry cards cascade in on the left side showing O2 21.0 %, CO2 582 ppm, water 103 L, power 10 kWe, 22 °C with tiny live line graphs scrolling, a vertical event log stream on the right, smooth slow pull-back. [STYLE ANCHOR]` |
| **B2 · KATHERINE** (10.2–13 s) | `Macro close-up of a holographic AI assistant panel floating in a softly blurred spacecraft cabin, a hexagonal cyan avatar with two glowing eyes and rotating rings, text bubbles and two holographic answer buttons, a thin light scan sweeping down the panel, the panel slides in from the right with a gentle parallax, warm-cool rim light, elegant and friendly. [STYLE ANCHOR]` |
| **B3 · Mission montage** (13–15.6 s) | `Fast rhythmic montage with whip-pan transitions: (1) a glass-cockpit control cabin with holographic wireframe shapes, (2) third-person chibi astronaut on a lunar habitat floor under warm 2700 K alert lighting, (3) a greenhouse module bathed in magenta grow-light (630 nm red + 450 nm blue) with plant chambers, (4) a red-tinted cabin during a solar storm with the astronaut bracing; motion blur on every cut, bold minimal title cards in the lower left. [STYLE ANCHOR]` |
| **B4 · Overclock** (15.6–17 s) | `Accelerating crash zoom into a red-lit spacecraft cabin during a solar particle event, increasing camera shake, a giant radiation counter rapidly climbing from 118 to 252 millisieverts in the center, red light flooding the frame, ends in a blinding white flash. [STYLE ANCHOR]` |
| **C1 · CO₂ crisis** (17–19.6 s) | `Interior of the habitat module in crisis mode, pulsing soft red emergency light at 2 Hz, a huge holographic readout CO2 1,350 ppm with an upward arrow and a line graph spiking sharply, a red-tinted holographic AI panel giving calm instructions on the right, slow pull-back, tense but controlled atmosphere, no panic. [STYLE ANCHOR]` |
| **C2 · Peak compute** (19.6–22.4 s) | `Top-down abstract data visualization on a dark background: a dense matrix of over a thousand tiny square cells flickering cyan like a living database, a search query typing itself, three result rows sliding in with glowing green score bars, three system load meters on the right filling to 96 %, 88 % and 72 %, a status badge "STABLE" appearing, final cyan flash. [STYLE ANCHOR]` |
| **C3 · Resolution** (22.4–25 s) | `The emergency red light in the habitat gradually shifts to calm cyan, a holographic CO2 graph curves smoothly downward from 1,350 to 612 ppm, a bold green "STABLE ✓" stamp pops in, a holographic AI panel shows a positive message, slow push-in, relief and control. [STYLE ANCHOR]` |
| **D · Logo** (25–30 s) | `Minimal elegant end card on a brushed dark metal background with a radial blue glow, a perspective light grid floor moving toward camera, slow rising cyan particles, a logo mark of two angle brackets "< >" around a faceted crystal drawn stroke by stroke in cyan and white light, then the wordmark "CodeCraft" condensing from wide letter spacing with a light sweep across it, subtitle line "AETHER-4 · ORBITAL QUARTERS · v1.0", fade to black. [STYLE ANCHOR]` |

**Consejos de consistencia**
- Usa la misma *seed* y la ancla de estilo en todo.
- Genera los planos del astronauta con *image-to-video* a partir de `public/shots/menu.png` y `public/shots/m2_surface_3p.png`; así el traje, el visor y las proporciones salen idénticos.
- Para el hábitat, usa como imagen inicial `public/shots/m0_briefing.png`, `m3_greenhouse.png` y `m4_storm.png`.
- Pide clips de 5 s y recórtalos a los tiempos del storyboard.
- Los textos del HUD conviene ponerlos en edición (Remotion, After Effects o Premiere), no en el prompt. Los modelos de video aún deforman la tipografía.

---

## 4 · Diseño de sonido

**Tempo:** 120 BPM (1 beat = 0.5 s; 1 compás = 2 s). Todos los cortes del bloque B caen en beat.
**Tonalidad:** La menor → Fa → Do → Sol → La menor. El clímax resuelve a **Do mayor (add9)**, el "alivio" armónico.

| Capa | Descripción | Dónde |
|---|---|---|
| **Sub-drone** | Senos a 27.5 / 55 / 110 Hz con fade-in de 3 s. Es la "presencia" de la nave. | 0–7 s |
| **Data ticks** | Clicks de ruido filtrado (>2.5 kHz, 12 ms), uno por línea compilada, con paneo aleatorio. | 0.5–4.1 s |
| **Risers** | Ruido con barrido de brillo + seno exponencial (120 → 1,600 Hz). | 3.9 s, 15–17 s, 21.4 s |
| **Impactos** | Seno con caída de pitch (80 → 30 Hz, decay 2–3 s) + crack de ruido y reverb de 2.8 s. | 4.95 s (boot), 17.0 s (crisis), 22.4 s (resolución), 25.0 s (logo) |
| **Pulso electrónico** | Kick 95 → 42 Hz, hats a 7 kHz y bajo saw filtrado a 420 Hz con sidechain en cada kick. | 7–17 s, 22.4–25 s |
| **Arpegio pluck** | Saw de 10 armónicos con decay rápido, en 16avos con paneo ping-pong ±0.45. | 7–17 s, 22.4–25 s |
| **Pads** | 3 voces desafinadas ±0.4 %, lowpass con LFO a 0.18 Hz. Am9 / Fmaj7 / Cadd9 / G. Cluster disonante La+Si♭ en la crisis. | Todo el video |
| **UI blips** | Senos de 1.5–2.6 kHz y 50–90 ms, sincronizados con cada tarjeta, corchete o hit de HUD. | Ver timeline |
| **Alarma** | Dos tonos (880 / 698 Hz) triangulares, suaves (–24 dB), alternando L/R. Es tensión, no estrés. | 17.25–20.4 s |
| **Glitch de carga** | Arpegio de 32avos con pitch ascendente (+60 %), el sonido de "calcular". | 19.6–22.35 s |
| **Campanas** | Parciales inarmónicos (1, 2.01, 2.76, 4.07, 5.43) para el éxito y el logo. | 5.05 s, 22.45 s, 25.15 s, 26.05 s |

**Mezcla**
- La música baja 6 dB (*ducking*, ataque de 80 ms y release de 200 ms) mientras habla KATHERINE.
- Saturación suave `tanh`, pico a –1 dBFS y fade final de 0.7 s.

**Voz**
- KATHERINE, voz neural **Supertonic 3 · F5** (la cálida), velocidad 1.05 ×. Cinco frases en español y el cierre en inglés.
- La voz es el ancla emocional. La música nunca compite con ella.

**Si quieren reemplazar la música** por una pista licenciada o generada (Suno, Udio, Stable Audio), este prompt sirve:
`dark cinematic electronic ambient, 120 BPM, A minor, deep sub drone intro with digital glitches, pulsing sidechained synth bass and 16th-note pluck arpeggios, big riser and impact at 0:17, tense two-tone alarm motif, resolves to a bright C major add9 at 0:22, shimmering bell logo sting at 0:25, 30 seconds, no vocals`

---

## 5 · Cómo regenerar o editar

```bash
cd promo
npm run dev                         # Remotion Studio: edita tiempos y textos en vivo
node scripts/capture.mjs            # recaptura clips del juego (dev server :5174 + puente :8765)
node scripts/capture_panel.mjs      # paneles de KATHERINE en 4K
python scripts/make_score.py        # regenera música + SFX (mismos tiempos que src/Promo.tsx)
npx remotion render CodeCraftPromo out/codecraft_aether4_promo.mp4 --codec=h264 --crf=18
```

> Remotion es gratis para equipos de hasta 3 personas y para uso no comercial. Si CodeCraft lo usa comercialmente con más personas, revisen https://www.remotion.dev/docs/license.
