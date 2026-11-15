# Dataset de tutoría de KATHERINE (v3.1)

Enseña al modelo **AstroCopilot** a ser maestra en el juego: hablar según la edad, calificar respuestas abiertas sin
felicitar errores, no inventar números y hablar español. Las pruebas con el modelo v3.0 mostraron justo esos huecos:
ignoraba el nivel, a "primero la comida" le decía "¡Exacto!" y a veces inventaba cifras.

| Archivo | Qué es |
|---|---|
| `tutor_content.py` | Contenido escrito y verificado por concepto (13 conceptos × ES/EN): explicación por edad, preguntas de seguimiento, respuestas de alumnos buenas/a medias/equivocadas con su error de concepto, preguntas de niños con respuesta por nivel |
| `build_tutor_dataset.py` | Genera las filas con **el prompt exacto que manda el juego** (`mentor_server.build_messages`) y respuestas JSON. Pasa cada respuesta por `verify_reply` |
| `out/tutor_train.jsonl`, `out/tutor_eval.jsonl` | 659 + 55 filas, mismo formato que `data/astrocopilot_master_train.jsonl`, validadas con `src/validate_dataset.py` |
| `merge_into_master.py` | Une con el master en archivos nuevos `_v31` (no sobrescribe nada) |

**Tipos de fila** (mitad español, mitad inglés):
1. **teach**: cada tarjeta de decisión, objetivo, misión o final, explicada en 3 niveles: 🧒 6–9 con analogía,
   🧑‍🚀 10–14 con la tarjeta y 👩‍🔬 15+ con el porqué técnico, más una pregunta de seguimiento del mismo tema.
2. **explain**: "explícamelo otra vez", más simple según el nivel.
3. **grade**: 4 respuestas por concepto (buena, a medias, idea equivocada y fuera de tema) → `verdict` y `misconception`.
   Hay el doble de "miss" a propósito, porque era el error más grave.
4. **question**: preguntas reales de niños ("¿de verdad toman su pipí?") respondidas por nivel.
5. **honesty**: preguntas sin dato verificado → "no lo tengo en mis registros, no voy a inventarlo".

## Cómo entrenar (lo haces tú en Colab)

```bash
python ai_bridge/tutor_dataset/build_tutor_dataset.py            # (re)genera out/ si cambias tutor_content.py
python ai_bridge/tutor_dataset/merge_into_master.py --ai-root "E:/trabajos uni/colab_entorno" --repeat 2
```

En el repo de IA:
1. Usa `data/astrocopilot_master_train_v31.jsonl` / `..._eval_v31.jsonl`. Renómbralos o cambia la ruta en
   `src/train_gemma4_qlora.py`, línea ~129.
2. **Sube `max_length` de 1024 a 2048** en `train_gemma4_qlora.py`, líneas 169 y 195. Las filas de tutoría
   llevan el prompt completo del juego (2,500–3,700 caracteres), y con 1024 tokens se cortaría la respuesta, que va al final.
3. `--repeat 2` hace que las ~1,300 filas de tutoría pesen ~24 % junto a las 4,157 originales.
4. Después de entrenar, prueba con el puente (`--backend remote`) y compara contra v3.0:
   - ¿cambia el texto entre Explorador e Ingeniero?
   - ¿"primero la comida" sale `miss`?
   - ¿cuántas respuestas rechaza el verificador?

Para agregar contenido: edita `tutor_content.py` (solo datos que ya estén en las tarjetas o documentados por la NASA),
corre el builder y revisa `out/tutor_stats.json`. El verificador descarta cualquier fila con números que no estén en el
prompt.
