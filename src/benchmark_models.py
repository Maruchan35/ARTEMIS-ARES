"""Benchmark comparativo en Colab: Ministral-3-3B-Reasoning vs Gemma-4-E4B-it."""

import gc
import json
import time
import traceback
from pathlib import Path

from PIL import Image, ImageDraw
import torch


def create_test_mission_image(out_path: Path) -> Path:
    """Genera una imagen de prueba tipo mapa lunar + estado visual de la nave."""
    img = Image.new("RGB", (960, 540), color=(14, 18, 30))
    draw = ImageDraw.Draw(img)

    # Panel izquierdo: Mapa lunar
    draw.rectangle([20, 20, 560, 520], outline=(80, 140, 220), width=3, fill=(28, 32, 44))
    draw.text((35, 32), "MAPA DE ALUNIZAJE - POLO SUR LUNAR", fill=(180, 220, 255))

    # Zona segura (A)
    draw.rectangle([55, 290, 235, 450], outline=(60, 220, 120), width=3, fill=(35, 70, 50))
    draw.text((70, 310), "ZONA A (SEGURA)", fill=(120, 255, 160))
    draw.text((70, 335), "Terreno plano 3 deg", fill=(200, 255, 220))
    draw.text((70, 355), "Luz solar: 85%", fill=(200, 255, 220))

    # Crater peligroso (B)
    draw.ellipse([300, 230, 520, 440], outline=(255, 80, 80), width=4, fill=(75, 28, 32))
    draw.text((340, 315), "CRATER TYCHO-B", fill=(255, 130, 130))
    draw.text((340, 338), "PELIGRO: Pendiente 42 deg", fill=(255, 180, 180))
    draw.text((340, 358), "Rocas y sombra total", fill=(255, 180, 180))

    # Nave y trayectoria hacia el crater peligroso
    draw.polygon([(380, 100), (360, 145), (400, 145)], fill=(230, 240, 255), outline=(255, 220, 80))
    draw.text((320, 75), "NAVE AGUILA-1", fill=(255, 230, 110))
    draw.line([(380, 148), (405, 265)], fill=(255, 70, 70), width=4)
    draw.polygon([(405, 275), (395, 255), (415, 255)], fill=(255, 70, 70))
    draw.text((415, 190), "RUTA ACTUAL", fill=(255, 110, 110))

    # Panel derecho: Diagnostico visual de la nave
    draw.rectangle([585, 20, 940, 520], outline=(80, 140, 220), width=3, fill=(22, 26, 38))
    draw.text((605, 32), "ESTADO VISUAL DE LA NAVE", fill=(180, 220, 255))

    # Cuerpo central de la nave
    draw.rectangle([725, 140, 800, 280], fill=(190, 200, 215), outline=(255, 255, 255), width=2)
    draw.text((738, 200), "MODULO", fill=(20, 25, 35))

    # Panel solar izquierdo OK
    draw.rectangle([615, 175, 720, 230], fill=(40, 110, 200), outline=(100, 220, 255), width=2)
    draw.text((622, 240), "PANEL IZQ: OK", fill=(120, 255, 160))

    # Panel solar derecho danado
    draw.rectangle([805, 175, 910, 230], fill=(150, 70, 30), outline=(255, 180, 40), width=3)
    draw.line([(810, 178), (905, 225)], fill=(255, 60, 60), width=3)
    draw.line([(840, 178), (875, 228)], fill=(255, 60, 60), width=3)
    draw.text((805, 240), "PANEL DER: DANADO", fill=(255, 190, 70))

    # Barras de alerta
    draw.text((610, 320), "COMBUSTIBLE: 24% (BAJO)", fill=(255, 200, 80))
    draw.rectangle([610, 345, 910, 368], outline=(200, 200, 200), width=2)
    draw.rectangle([612, 347, 684, 366], fill=(255, 180, 50))

    draw.text((610, 395), "RADIACION SOLAR: ALERTA ALTA", fill=(255, 90, 90))
    draw.rectangle([610, 420, 910, 443], outline=(200, 200, 200), width=2)
    draw.rectangle([612, 422, 865, 441], fill=(255, 60, 60))

    img.save(out_path)
    return out_path


TELEMETRY = {
    "mision": "Artemis Junior - Alunizaje",
    "cuerpo": "Luna",
    "gravedad_g": 0.165,
    "altitud_m": 420,
    "velocidad_descenso_ms": 18.5,
    "combustible_pct": 24,
    "radiacion_mSv": 85,
    "astronauta": {
        "ritmo_cardiaco_bpm": 134,
        "horas_despierto": 19,
        "estres_pct": 82,
        "ejercicio_hoy_min": 0,
    },
}

PROMPT_TEXT = (
    "Eres AstroCopiloto, el mentor espacial de un astronauta junior (10-14 anos). "
    "Observa la imagen del mapa de aterrizaje y el diagrama de la nave, y analiza la telemetria JSON:\n"
    f"{json.dumps(TELEMETRY, ensure_ascii=False, indent=2)}\n\n"
    "Responde SOLO con un JSON valido (sin texto extra fuera del JSON) con exactamente estas 5 claves:\n"
    "- peligro_visual: que ves en la imagen respecto a la ruta, el terreno y la nave.\n"
    "- evaluacion_medica: analisis breve de ritmo cardiaco, radiacion y cansancio.\n"
    "- evaluacion_mental: estado de estres del cadete y una accion concreta para calmarse.\n"
    "- leccion_gravedad: explicacion clara y corta de como influye la gravedad lunar (0.165 g) en el frenado.\n"
    "- mensaje_copiloto: mensaje directo al cadete en espanol (maximo 3 frases, tono cercano y motivador, con un toque sutil de humor pero serio ante el peligro)."
)


def free_gpu() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()


def _prepare_inputs(processor, model, messages: list[dict], image: Image.Image, dtype, thinking: bool | None = None):
    model_name = processor.__class__.__name__.lower()
    if "gemma4" in model_name:
        kwargs = {"tokenize": False, "add_generation_prompt": True}
        if thinking is not None:
            kwargs["enable_thinking"] = thinking
        text_prompt = processor.apply_chat_template(messages, **kwargs)
        inputs = processor(
            text=[text_prompt],
            images=[image],
            padding=True,
            return_tensors="pt",
        )
    else:
        inputs = processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
    return {
        k: (
            v.to(model.device, dtype=dtype)
            if torch.is_tensor(v) and v.is_floating_point()
            else (v.to(model.device) if torch.is_tensor(v) else v)
        )
        for k, v in inputs.items()
    }


def _check_json(clean_text: str) -> bool:
    stripped = clean_text.strip()
    if "```" in stripped:
        for block in stripped.split("```"):
            candidate = block.lstrip("json").strip()
            if candidate.startswith("{"):
                stripped = candidate
                break
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end <= start:
        return False
    try:
        data = json.loads(stripped[start : end + 1])
        return isinstance(data, dict)
    except Exception:
        return False


def run_benchmark(model_id: str, image: Image.Image) -> list[dict]:
    from transformers import AutoModelForImageTextToText, AutoProcessor

    print(f"\n{'=' * 65}")
    print(f"Probando modelo: {model_id}")
    print("=" * 65)

    free_gpu()
    t0 = time.perf_counter()

    proc_kwargs = {"fix_mistral_regex": True} if "mistral" in model_id.lower() else {}
    processor = AutoProcessor.from_pretrained(model_id, **proc_kwargs)
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    model = AutoModelForImageTextToText.from_pretrained(
        model_id,
        dtype=dtype,
        device_map="auto",
    )
    load_sec = time.perf_counter() - t0

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": PROMPT_TEXT},
            ],
        }
    ]

    modes: list[tuple[str, bool | None]] = (
        [("fast (no thinking)", False), ("reasoning (thinking=True)", True)]
        if "gemma-4" in model_id.lower()
        else [("reasoning (nativo)", None)]
    )

    out_results: list[dict] = []
    for mode_label, thinking_flag in modes:
        if torch.cuda.is_available():
            torch.cuda.reset_peak_memory_stats()
        t1 = time.perf_counter()
        inputs = _prepare_inputs(processor, model, messages, image, dtype, thinking=thinking_flag)

        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=1400,
                do_sample=True,
                temperature=0.6,
                top_p=0.95,
            )
        infer_sec = time.perf_counter() - t1

        prompt_len = inputs["input_ids"].shape[1]
        gen_ids = output_ids[0][prompt_len:]
        gen_tokens = int(len(gen_ids))
        tok_per_sec = gen_tokens / infer_sec if infer_sec > 0 else 0.0
        raw_text = processor.decode(gen_ids, skip_special_tokens=False)
        clean_text = processor.decode(gen_ids, skip_special_tokens=True)

        peak_vram_gb = (
            torch.cuda.max_memory_allocated() / (1024**3)
            if torch.cuda.is_available()
            else 0.0
        )
        json_ok = _check_json(clean_text)

        print(
            f"[{mode_label}] Carga: {load_sec:.1f}s | Inferencia: {infer_sec:.2f}s | "
            f"Tokens: {gen_tokens} ({tok_per_sec:.1f} tok/s) | Peak VRAM: {peak_vram_gb:.2f} GB | JSON OK: {json_ok}"
        )
        print("--- Respuesta (clean) ---")
        print(clean_text)

        out_results.append(
            {
                "model_id": model_id,
                "mode": mode_label,
                "load_sec": round(load_sec, 2),
                "infer_sec": round(infer_sec, 2),
                "gen_tokens": gen_tokens,
                "tok_per_sec": round(tok_per_sec, 2),
                "peak_vram_gb": round(peak_vram_gb, 2),
                "json_valid": json_ok,
                "raw_text": raw_text,
                "clean_text": clean_text,
            }
        )
        del inputs, output_ids

    del model, processor
    free_gpu()
    return out_results


def main() -> None:
    print("GPU:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
    img_path = Path("/content/test_mission_map.png")
    create_test_mission_image(img_path)
    image = Image.open(img_path).convert("RGB")
    print(f"Imagen de prueba generada: {img_path} ({image.size})")

    candidates = [
        "unsloth/Ministral-3-3B-Reasoning-2512",
        "unsloth/gemma-4-E4B-it",
    ]
    results = []
    for model_id in candidates:
        try:
            results.extend(run_benchmark(model_id, image))
        except Exception as exc:
            print(f"ERROR en {model_id}: {type(exc).__name__}: {exc}")
            traceback.print_exc()
            free_gpu()

    Path("/content/benchmark_results.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("\n=== RESUMEN COMPARATIVO ===")
    for r in results:
        print(
            f"{r['model_id']} [{r['mode']}]: {r['infer_sec']}s | {r['tok_per_sec']} tok/s | "
            f"{r['gen_tokens']} tokens | VRAM {r['peak_vram_gb']} GB | JSON={r['json_valid']}"
        )


if __name__ == "__main__":
    main()
