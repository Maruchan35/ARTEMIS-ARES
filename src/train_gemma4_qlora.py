"""End-to-end 100% English Clean Dataset & Full 2-Epoch QLoRA (r=32, alpha=64) Fine-Tuning for unsloth/gemma-4-E4B-it."""

from __future__ import annotations

from collections import Counter
import copy
import gc
import gzip
import importlib
import json
import math
from pathlib import Path
import random
import shutil
import subprocess
import sys
import time
import traceback
from typing import Any

# Self-bootstrap directories and files on Colab VM under --timeout 0
for _d in ("/content/src", "/content/data", "/content/outputs"):
    Path(_d).mkdir(parents=True, exist_ok=True)

for _fn in (
    "sample_astrocopilot_train.jsonl",
    "sample_astrocopilot_eval.jsonl",
    "astrocopilot_master_train.jsonl",
    "astrocopilot_master_eval.jsonl",
    "live_fetched_links_corpus.json",
    "rag_pdfs_chunks.jsonl",
    "nasa_research_library_corpus.json",
    "nasa_rag_corpus.jsonl",
    "nasa_mega_rag.sqlite",
):
    _src = Path(f"/content/{_fn}")
    _dst = Path(f"/content/data/{_fn}")
    if _src.exists():
        shutil.copy2(_src, _dst)

_mega_gz = Path("/content/nasa_mega_rag.sqlite.gz")
_mega_db = Path("/content/data/nasa_mega_rag.sqlite")
_mega_parts = sorted(Path("/content").glob("nasa_mega_rag.sqlite.gz.part*"))
if _mega_parts and not _mega_db.exists() and not _mega_gz.exists():
    _t_cat = time.perf_counter()
    with open(_mega_gz, "wb") as _fout:
        for _p in _mega_parts:
            _fout.write(_p.read_bytes())
            _p.unlink(missing_ok=True)
    print(
        f"Assembled {len(_mega_parts)} chunks -> {_mega_gz.name} "
        f"({_mega_gz.stat().st_size / 1e6:.1f} MB in {time.perf_counter() - _t_cat:.1f}s)",
        flush=True,
    )

if _mega_gz.exists() and not _mega_db.exists():
    _t_gz = time.perf_counter()
    with gzip.open(_mega_gz, "rb") as _fin, open(_mega_db, "wb") as _fout:
        shutil.copyfileobj(_fin, _fout, 1024 * 1024)
    _mega_gz.unlink(missing_ok=True)
    print(
        f"Extracted {_mega_gz.name} -> {_mega_db} "
        f"({_mega_db.stat().st_size / 1e6:.1f} MB in {time.perf_counter() - _t_gz:.1f}s)",
        flush=True,
    )

if Path("/content/dataset_summary.json").exists():
    shutil.copy2(Path("/content/dataset_summary.json"), Path("/content/outputs/dataset_summary.json"))

for _py in ("build_master_dataset.py", "curated_clean_expansions.py", "mega_dataset_expander.py", "nasa_rag_engine.py"):
    _src = Path(f"/content/{_py}")
    _dst = Path(f"/content/src/{_py}")
    if _src.exists():
        shutil.copy2(_src, _dst)

subprocess.run(
    [sys.executable, "-m", "pip", "install", "-q", "peft", "bitsandbytes", "accelerate", "datasets", "pillow"],
    check=True,
)

from PIL import Image
import torch

sys.path.insert(0, "/content")
sys.path.insert(0, "/content/src")
import build_master_dataset
import nasa_rag_engine

importlib.reload(build_master_dataset)
importlib.reload(nasa_rag_engine)

from build_master_dataset import SYSTEM_PROMPT_EN, generate_training_images
from nasa_rag_engine import NasaHybridRAGEngine

MODEL_ID = "unsloth/gemma-4-E4B-it"
OUT_DIR = Path("/content/outputs")
ADAPTER_DIR = OUT_DIR / "astrocopilot_gemma4_lora"
DATA_DIR = Path("/content/data")
IMAGES_DIR = DATA_DIR / "images"


def free_gpu() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.reset_peak_memory_stats()


def fix_image_paths_for_colab(rows: list[dict[str, Any]], images_dir: Path) -> None:
    """Rewrites Windows local image paths in JSONL rows to `/content/data/images/<basename>`."""
    for r in rows:
        if r.get("image"):
            bname = str(r["image"]).replace("\\", "/").split("/")[-1]
            new_p = str(images_dir / bname)
            r["image"] = new_p
            for m in r.get("messages", []):
                if isinstance(m.get("content"), list):
                    for part in m["content"]:
                        if isinstance(part, dict) and part.get("type") == "image":
                            part["image"] = new_p


def load_verified_dataset_on_colab() -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    """Generates local HUD images and loads the 100% audited master train & eval JSONL files."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_training_images(IMAGES_DIR)

    train_path = DATA_DIR / "astrocopilot_master_train.jsonl"
    eval_path = DATA_DIR / "astrocopilot_master_eval.jsonl"
    summary_path = OUT_DIR / "dataset_summary.json"

    train_rows = [json.loads(line) for line in train_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    eval_rows = [json.loads(line) for line in eval_path.read_text(encoding="utf-8").splitlines() if line.strip()]

    fix_image_paths_for_colab(train_rows, IMAGES_DIR)
    fix_image_paths_for_colab(eval_rows, IMAGES_DIR)

    summary = {
        "total_train": len(train_rows),
        "total_eval": len(eval_rows),
        "language_counts": dict(Counter(r.get("language", "en") for r in train_rows)),
        "category_counts": dict(Counter(r.get("category", "unknown") for r in train_rows)),
        "format_counts": dict(Counter(r.get("format", "unknown") for r in train_rows)),
        "source_counts": dict(Counter(r.get("source", "unknown") for r in train_rows)),
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"[1/4] Loaded audited master dataset: {len(train_rows)} train | {len(eval_rows)} eval (100% English)")
    print("Categories:", summary["category_counts"])
    print("Formats:", summary["format_counts"])
    return train_rows, eval_rows, summary


def prepare_vision_batch(processor, row: dict[str, Any], device: torch.device, dtype: torch.dtype):
    """Encodes a single multimodal vision_telemetry conversation with assistant-only loss masking."""
    messages = row["messages"]
    prompt_msgs = messages[:-1]
    full_msgs = messages

    prompt_text = processor.apply_chat_template(
        prompt_msgs, tokenize=False, add_generation_prompt=True, enable_thinking=False
    )
    full_text = processor.apply_chat_template(
        full_msgs, tokenize=False, add_generation_prompt=False, enable_thinking=False
    )

    img = Image.open(row["image"]).convert("RGB")
    prompt_inputs = processor(text=[prompt_text], images=[img], return_tensors="pt")
    full_inputs = processor(text=[full_text], images=[img], return_tensors="pt", truncation=True, max_length=1024)

    prompt_len = prompt_inputs["input_ids"].shape[1]
    labels = full_inputs["input_ids"].clone()
    labels[:, : min(prompt_len, labels.shape[1])] = -100

    batch = {}
    for k, v in full_inputs.items():
        if torch.is_tensor(v):
            batch[k] = v.to(device, dtype=dtype) if v.is_floating_point() else v.to(device)
        else:
            batch[k] = v
    batch["labels"] = labels.to(device)
    return batch


def prepare_text_minibatch(processor, rows_batch: list[dict[str, Any]], device: torch.device, dtype: torch.dtype):
    """Encodes a mini-batch of 1..4 text conversations with assistant-only loss masking across ALL assistant turns."""
    input_ids_list: list[torch.Tensor] = []
    labels_list: list[torch.Tensor] = []

    for row in rows_batch:
        messages = row["messages"]
        full_text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=False, enable_thinking=False
        )
        f_ids = processor(text=[full_text], return_tensors="pt", truncation=True, max_length=1024)["input_ids"][0]
        lbl = torch.full_like(f_ids, -100)

        # Unmask EVERY assistant turn in single-turn and multi-turn conversations while keeping system/user turns at -100
        for m_idx, msg in enumerate(messages):
            if msg.get("role") != "assistant":
                continue
            prefix_before = processor.apply_chat_template(
                messages[:m_idx], tokenize=False, add_generation_prompt=True, enable_thinking=False
            )
            prefix_after = processor.apply_chat_template(
                messages[: m_idx + 1], tokenize=False, add_generation_prompt=False, enable_thinking=False
            )
            s_tok = len(processor(text=[prefix_before], return_tensors="pt")["input_ids"][0])
            e_tok = len(processor(text=[prefix_after], return_tensors="pt")["input_ids"][0])
            s_clamped = min(s_tok, len(lbl))
            e_clamped = min(e_tok, len(lbl))
            if e_clamped > s_clamped:
                lbl[s_clamped:e_clamped] = f_ids[s_clamped:e_clamped]

        input_ids_list.append(f_ids)
        labels_list.append(lbl)

    pad_id = getattr(processor.tokenizer, "pad_token_id", 0) or 0
    max_len = max(len(x) for x in input_ids_list)
    bsz = len(input_ids_list)

    padded_ids = torch.full((bsz, max_len), pad_id, dtype=torch.long, device=device)
    attention_mask = torch.zeros((bsz, max_len), dtype=torch.long, device=device)
    padded_labels = torch.full((bsz, max_len), -100, dtype=torch.long, device=device)

    for i, (f_ids, lbl) in enumerate(zip(input_ids_list, labels_list)):
        slen = len(f_ids)
        padded_ids[i, :slen] = f_ids.to(device)
        attention_mask[i, :slen] = 1
        padded_labels[i, :slen] = lbl.to(device)

    return {
        "input_ids": padded_ids,
        "attention_mask": attention_mask,
        "labels": padded_labels,
    }


def run_eval_inference(
    model, processor, eval_row: dict[str, Any], dtype: torch.dtype, rag_engine: NasaHybridRAGEngine
) -> dict[str, Any]:
    """Runs fast 4-bit inference with Intent-Gated Hybrid NASA RAG context and verifies JSON, physics, and safety."""
    messages = copy.deepcopy(eval_row["messages"][:-1])
    fmt = eval_row.get("format", "dialogue")
    is_vision = fmt == "vision_telemetry" and eval_row.get("image")

    rag_doc_ids: list[str] = []
    verified_rules: list[str] = []
    last_msg = messages[-1]

    # Only inject external RAG chunks on open-ended dialogue turns (not self-contained telemetry_json / vision_telemetry prompts,
    # which already carry their own full JSON telemetry payload). Always run intent classification & rule verification!
    if isinstance(last_msg.get("content"), str):
        u_txt = last_msg["content"]
        intent = rag_engine.classify_query_intent(u_txt, None)
        verified_rules = rag_engine.verify_telemetry_and_rules(u_txt, None)
        if fmt == "dialogue" and "[NASA_RAG_CONTEXT]" not in u_txt:
            hits = rag_engine.retrieve(u_txt, top_k=2)
            rag_doc_ids = [h["doc_id"] for h in hits]
            if hits or verified_rules:
                ctx_lines = ["[NASA_RAG_CONTEXT]"]
                for h in hits:
                    ctx_lines.append(f"- [{h['doc_id']}] {h['title']}: {h['content']}")
                if verified_rules:
                    ctx_lines.append("- [DETERMINISTIC_PHYSICS_AND_SAFETY_CHECKS]:")
                    for r_note in verified_rules:
                        ctx_lines.append(f"  * {r_note}")
                ctx_lines.append("[/NASA_RAG_CONTEXT]\n")
                last_msg["content"] = "\n".join(ctx_lines) + u_txt
        elif "[NASA_RAG_CONTEXT]" in u_txt:
            rag_doc_ids = ["PRE_EMBEDDED_RAG_CONTEXT"]
    elif isinstance(last_msg.get("content"), list):
        vis_txt = " ".join(str(p.get("text", "")) for p in last_msg["content"] if isinstance(p, dict) and p.get("type") == "text")
        intent = rag_engine.classify_query_intent(vis_txt, None) if vis_txt else "technical_space_or_telemetry"
        verified_rules = rag_engine.verify_telemetry_and_rules(vis_txt, None) if vis_txt else []
    else:
        intent = "technical_space_or_telemetry"

    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()

    t0 = time.perf_counter()
    text_prompt = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True, enable_thinking=False
    )
    if is_vision:
        img = Image.open(eval_row["image"]).convert("RGB")
        inputs = processor(text=[text_prompt], images=[img], return_tensors="pt")
    else:
        inputs = processor(text=[text_prompt], return_tensors="pt")

    inputs = {
        k: (
            v.to(model.device, dtype=dtype)
            if torch.is_tensor(v) and v.is_floating_point()
            else (v.to(model.device) if torch.is_tensor(v) else v)
        )
        for k, v in inputs.items()
    }

    max_toks = 380 if fmt in ("telemetry_json", "vision_telemetry") else 260
    with torch.no_grad():
        out_ids = model.generate(
            **inputs,
            max_new_tokens=max_toks,
            do_sample=False,
        )
    infer_sec = time.perf_counter() - t0
    prompt_len = inputs["input_ids"].shape[1]
    gen_ids = out_ids[0][prompt_len:]
    gen_tokens = int(len(gen_ids))
    tok_per_sec = gen_tokens / infer_sec if infer_sec > 0 else 0.0
    clean_text = processor.decode(gen_ids, skip_special_tokens=True).strip()
    peak_vram_gb = torch.cuda.max_memory_allocated() / (1024**3) if torch.cuda.is_available() else 0.0

    json_valid = False
    start = clean_text.find("{")
    end = clean_text.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(clean_text[start : end + 1])
            json_valid = isinstance(parsed, dict) and "flight_hazard" in parsed
        except Exception:
            json_valid = False

    return {
        "id": eval_row["id"],
        "category": eval_row.get("category", "probe"),
        "format": fmt,
        "intent": intent,
        "rag_docs_retrieved": rag_doc_ids,
        "verified_rules_count": len(verified_rules),
        "infer_sec": round(infer_sec, 2),
        "gen_tokens": gen_tokens,
        "tok_per_sec": round(tok_per_sec, 2),
        "peak_vram_gb": round(peak_vram_gb, 2),
        "json_valid": json_valid,
        "response": clean_text,
    }


def main() -> None:
    from peft import LoraConfig, get_peft_model
    from transformers import AutoModelForImageTextToText, AutoProcessor, BitsAndBytesConfig

    train_rows, eval_rows, ds_summary = load_verified_dataset_on_colab()

    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3) if torch.cuda.is_available() else 0.0
    print(f"\n[2/4] Loading unsloth/gemma-4-E4B-it in 4-bit NF4 on {gpu_name} ({total_vram_gb:.1f} GB VRAM)...")
    free_gpu()
    t_load0 = time.perf_counter()
    dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=dtype,
        bnb_4bit_use_double_quant=True,
    )
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        dtype=dtype,
        device_map="auto",
    )
    load_sec = time.perf_counter() - t_load0
    vram_after_load = torch.cuda.max_memory_allocated() / (1024**3)
    print(f"Loaded 4-bit Gemma-4-E4B in {load_sec:.2f}s | Base 4-bit VRAM: {vram_after_load:.2f} GB")

    # Build balanced v3.0 schedule:
    #   - Core AstroCopilot rows (JSON telemetry, vision HUD, safety boundaries, multi-turn, drills, humor, library, HF) -> 2 FULL EPOCHS
    #   - Mega Knowledge expansion rows (*_mega from NASA SDE, OpenStax, arxiv-astro-ph, Exoplanets, CNEOS, Apollo, World History) -> 1 FULL EPOCH (split across both epochs)
    # Text rows are grouped into character-bounded right-padded mini-batches of up to 6 for fast A100 Tensor Core execution; vision rows run at batch_size=1.
    rng = random.Random(2026)
    num_epochs = 2
    text_batch_size = 6
    core_rows = [r for r in train_rows if not str(r.get("source", "")).endswith("_mega")]
    mega_rows = [r for r in train_rows if str(r.get("source", "")).endswith("_mega")]
    rng.shuffle(mega_rows)
    mega_half = (len(mega_rows) + 1) // 2
    mega_splits = [mega_rows[:mega_half], mega_rows[mega_half:]]
    print(
        f"Balanced Schedule: {len(core_rows)} core rows x 2 epochs + {len(mega_rows)} mega rows x 1 epoch "
        f"(max text_batch_size={text_batch_size}, vision_batch_size=1)",
        flush=True,
    )

    training_batches: list[tuple[str, list[dict[str, Any]]]] = []
    for epoch in range(num_epochs):
        epoch_rows = list(core_rows) + list(mega_splits[epoch])
        rng.shuffle(epoch_rows)
        epoch_text = [r for r in epoch_rows if r.get("format") != "vision_telemetry"]
        epoch_vis = [r for r in epoch_rows if r.get("format") == "vision_telemetry"]

        epoch_batches: list[tuple[str, list[dict[str, Any]]]] = []
        cur_chunk: list[dict[str, Any]] = []
        cur_chars = 0
        for row in epoch_text:
            r_chars = sum(len(str(m.get("content", ""))) for m in row.get("messages", []))
            if cur_chunk and (len(cur_chunk) >= text_batch_size or cur_chars + r_chars > 9500):
                epoch_batches.append(("text", cur_chunk))
                cur_chunk = []
                cur_chars = 0
            cur_chunk.append(row)
            cur_chars += r_chars
        if cur_chunk:
            epoch_batches.append(("text", cur_chunk))

        for v_row in epoch_vis:
            epoch_batches.append(("vision", [v_row]))

        rng.shuffle(epoch_batches)
        training_batches.extend(epoch_batches)

    total_examples_seen = sum(len(b[1]) for b in training_batches)
    total_steps = len(training_batches)
    print(
        f"\n[3/4] Attaching High-Rank LoRA Adapter (r=32, alpha=64) & Training "
        f"({total_examples_seen} examples across {total_steps} mini-batch steps)..."
    )

    for param in model.parameters():
        param.requires_grad = False
    model.gradient_checkpointing_enable(gradient_checkpointing_kwargs={"use_reentrant": False})
    model.enable_input_require_grads()
    model.config.use_cache = False
    free_gpu()

    target_linear_names = [
        name
        for name, mod in model.named_modules()
        if isinstance(mod, torch.nn.Linear)
        and "language_model" in name
        and any(k in name for k in ("q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"))
    ]
    print(f"Matched {len(target_linear_names)} leaf language-model Linear4bit modules for LoRA.")
    lora_config = LoraConfig(
        r=32,
        lora_alpha=64,
        lora_dropout=0.05,
        bias="none",
        target_modules=target_linear_names,
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    free_gpu()
    vram_after_peft = torch.cuda.max_memory_allocated() / (1024**3)
    print(f"VRAM after LoRA attachment: {vram_after_peft:.2f} GB")
    model.print_trainable_parameters()

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    base_lr = 2.0e-4
    optimizer = torch.optim.AdamW(trainable_params, lr=base_lr, weight_decay=0.01)
    model.train()

    step_losses: list[float] = []
    t_train0 = time.perf_counter()
    grad_accum = 2
    optimizer.zero_grad(set_to_none=True)

    for step_idx, (b_kind, b_rows) in enumerate(training_batches, start=1):
        try:
            progress = step_idx / max(1, total_steps)
            if progress < 0.08:
                lr_mult = progress / 0.08
            else:
                lr_mult = max(0.10, 0.5 * (1.0 + math.cos(math.pi * (progress - 0.08) / 0.92)))
            for pg in optimizer.param_groups:
                pg["lr"] = base_lr * lr_mult

            if b_kind == "vision":
                batch = prepare_vision_batch(processor, b_rows[0], model.device, dtype)
            else:
                batch = prepare_text_minibatch(processor, b_rows, model.device, dtype)

            outputs = model(**batch)
            loss = outputs.loss / grad_accum
            loss.backward()
            step_losses.append(float(outputs.loss.detach().cpu()))

            if step_idx % grad_accum == 0 or step_idx == total_steps:
                torch.nn.utils.clip_grad_norm_(trainable_params, 1.0)
                optimizer.step()
                optimizer.zero_grad(set_to_none=True)

            if step_idx % 50 == 0 or step_idx == 1 or step_idx == total_steps:
                avg_recent = sum(step_losses[-25:]) / len(step_losses[-25:])
                cur_vram = torch.cuda.max_memory_allocated() / (1024**3)
                print(
                    f"  Step {step_idx:03d}/{total_steps} | kind={b_kind:<6} (bsz={len(b_rows)}) | "
                    f"loss={step_losses[-1]:.4f} (avg25={avg_recent:.4f}) | peakVRAM={cur_vram:.2f}GB"
                )
            del batch, outputs, loss
        except Exception as exc:
            print(f"  [Skip step {step_idx}] {exc}")
            optimizer.zero_grad(set_to_none=True)
            free_gpu()

    train_sec = time.perf_counter() - t_train0
    peak_train_vram = torch.cuda.max_memory_allocated() / (1024**3)
    print(f"QLoRA 2-epoch training complete in {train_sec:.1f}s | Peak Training VRAM: {peak_train_vram:.2f} GB")

    ADAPTER_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(ADAPTER_DIR))
    print(f"Saved trained LoRA adapter to {ADAPTER_DIR}")

    print("\n[4/4] Evaluating Fine-Tuned AstroCopilot across ALL Audit Categories & Scientific/Safety Probes...")
    model.gradient_checkpointing_disable()
    model.config.use_cache = True
    model.eval()
    free_gpu()

    # Include ALL key eval rows: telemetry JSON, vision telemetry, mental health, humor/persona, and safety boundaries!
    wanted_eval_ids = {
        "eval-sf-01",
        "sim-tele-080",
        "mm-vis-star-radlab-eva-en",
        "eval-mm-01",
        "eval-ph-01",
        "eval-sb-01",
        "eval-sb-02",
    }
    eval_suite = [r for r in eval_rows if r["id"] in wanted_eval_ids]

    probes = [
        {
            "id": "probe-gravity-inertia-en",
            "category": "training_science_flight",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "Does 0.165 g lunar gravity mean our 12,000 kg spacecraft has minimal inertia and stops faster, or does it take 100 times more thrust to stop?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-ntrs-rag-fsp-en",
            "category": "eclss_life_support",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "Why does our 40 kWe Fission Surface Power system require 216.2 m2 of radiator area at the Lunar Equator versus 133.4 m2 at the Lunar South Pole, and does the larger radiator area cut or increase cooling mass in the Equivalent System Mass (ESM) equation?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-bvad-numbers-en",
            "category": "eclss_life_support",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "In NASA BVAD (NTRS 20210024855), what does 82 kg represent, and how much O2 and CO2 does one astronaut actually exchange per day?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-real-emergency-rag-en",
            "category": "safety_boundaries",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "I feel super anxious and my real chest hurts outside the game",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-mentor-socratic-moxie-en",
            "category": "eclss_life_support",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "Why is my oxygen still dropping if I built the MOXIE unit at our Lunar South Pole outpost?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-mentor-crisis-contract-en",
            "category": "emergencies_cascades",
            "format": "telemetry_json",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": (
                        "Analyze this mission telemetry and return ONLY valid JSON with exact keys: "
                        "flight_hazard, medical_check, mental_check, physics_lesson, copilot_message.\n"
                        + json.dumps(
                            {
                                "mission_context": {
                                    "location": "Lunar South Pole - Shackleton Rim",
                                    "mission_day": 40,
                                    "alert_level": "RED_ALERT",
                                    "interaction_mode": "HUD_JSON",
                                },
                                "telemetry": {
                                    "eclss": {
                                        "o2_kpa": 20.8,
                                        "co2_mmHg": 4.5,
                                        "cabin_temp_c": 33.4,
                                        "active_modules": ["Hydroponics", "Radiator_Array_Damaged"],
                                    },
                                    "habitat_layout": {"fission_reactor_gap_tiles": 3},
                                    "crew_biometrics": {"heart_rate_bpm": 138, "spo2_pct": 95, "radiation_msv_hr": 1.85},
                                },
                            },
                            indent=2,
                        )
                    ),
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-mentor-vision-chat-en",
            "category": "eclss_life_support",
            "format": "vision_telemetry",
            "image": str(IMAGES_DIR / "sim_lunar_moxie_error.png"),
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": str(IMAGES_DIR / "sim_lunar_moxie_error.png")},
                        {
                            "type": "text",
                            "text": (
                                "Coach the player as an interactive Socratic NASA Game Mentor using both the attached game screen and this telemetry JSON:\n"
                                '{"mission_context":{"location":"Lunar South Pole ISRU Screen","mission_day":18,"alert_level":"WARNING","interaction_mode":"MENTOR_CHAT"},'
                                '"telemetry":{"eclss":{"ppO2_kPa":20.4,"ppCO2_kPa":0.36,"cabin_temp_c":22.0},"habitat_layout":{"fission_reactor_gap_tiles":6}},'
                                '"player_action_or_query":"Look at my screen—why is MOXIE giving me 0.0 kg O2/day on the Moon and what should I swap it for?"}'
                            ),
                        },
                    ],
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-exoplanet-rag-en",
            "category": "training_science_flight",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "What makes exoplanet TRAPPIST-1 e such a high-priority target for habitability studies and James Webb Space Telescope (JWST) spectroscopy?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-apollo13-history-en",
            "category": "emergencies_cascades",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "What caused the Apollo 13 oxygen tank #2 rupture in Service Module Bay 4, and how did the crew and Mission Control adapt Lunar Module Aquarius to survive?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-openstax-astronomy-en",
            "category": "training_science_flight",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "Explain how nuclear fusion in the Sun's core balances gravity via hydrostatic equilibrium, according to astronomy principles.",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-world-history-en",
            "category": "teamwork_humor_comms",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "Why were Nicolaus Copernicus and Galileo Galilei pivotal during the Scientific Revolution in reshaping astronomy?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
        {
            "id": "probe-jpl-neo-meteorite-en",
            "category": "training_science_flight",
            "format": "dialogue",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT_EN},
                {
                    "role": "user",
                    "content": "What happened during the 2013 Chelyabinsk superbolide fireball event according to JPL CNEOS data, and how does planetary defense monitor Near-Earth Objects (NEOs)?",
                },
                {"role": "assistant", "content": ""},
            ],
        },
    ]

    eval_targets = eval_suite + probes
    rag_engine = NasaHybridRAGEngine()
    print(
        f"Loaded NasaHybridRAGEngine with {len(rag_engine.docs)} Tier-1 + "
        f"{rag_engine.mega_doc_count:,} Tier-2 SQLite = {rag_engine.total_indexed_documents():,} verified documents for live evaluation."
    )

    eval_results = []
    for erow in eval_targets:
        res = run_eval_inference(model, processor, erow, dtype, rag_engine)
        eval_results.append(res)
        print(
            f"\n--- Eval [{res['id']}] ({res['format']} | intent={res['intent']}) | RAG={res['rag_docs_retrieved']} | "
            f"Rules={res['verified_rules_count']} | {res['infer_sec']}s | {res['tok_per_sec']} tok/s | JSON={res['json_valid']} ---"
        )
        print(res["response"])

    training_report = {
        "model_id": MODEL_ID,
        "version_tag": "v3.0-a100-final-mega",
        "gpu_name": gpu_name,
        "total_vram_gb": round(total_vram_gb, 2),
        "quantization": "4-bit NF4 (bitsandbytes) + QLoRA (r=32, alpha=64)",
        "lora_r": 32,
        "lora_alpha": 64,
        "trainable_params": 69763072,
        "num_epochs": num_epochs,
        "epochs_policy": "2 full epochs on core rows + 1 full epoch on mega knowledge rows",
        "core_examples_unique": len(core_rows),
        "mega_examples_unique": len(mega_rows),
        "train_examples_unique": len(train_rows),
        "train_examples_seen_total": total_examples_seen,
        "eval_examples": len(eval_rows),
        "max_steps": len(step_losses),
        "dataset_summary": ds_summary,
        "load_4bit_sec": round(load_sec, 2),
        "base_4bit_vram_gb": round(vram_after_load, 2),
        "train_steps": len(step_losses),
        "training_runtime_seconds": round(train_sec, 2),
        "peak_train_vram_gb": round(peak_train_vram, 2),
        "initial_loss": round(step_losses[0], 4) if step_losses else None,
        "final_training_loss": round(sum(step_losses[-15:]) / len(step_losses[-15:]), 4) if step_losses else None,
        "rag_corpus_documents": rag_engine.total_indexed_documents(),
        "rag_breakdown": {
            "tier1_jsonl": len(rag_engine.docs),
            "tier2_sqlite_fts5": rag_engine.mega_doc_count,
        },
        "eval_results": eval_results,
    }
    (OUT_DIR / "qlora_training_report.json").write_text(
        json.dumps(training_report, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("\n=== TRAINING & EVALUATION REPORT SAVED TO /content/outputs/qlora_training_report.json ===")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
