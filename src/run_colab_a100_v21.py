"""Orchestrates the Colab Pro NVIDIA A100 2-Epoch QLoRA Training (`v2.1-a100-qlora-clean-rag-gated`).

1. Starts A100 GPU session `train_a100_v21`.
2. Uploads audited dataset (`1,455` train + `16` eval), RAG corpus (`362` docs), and training scripts to `/content/`.
3. Executes `train_gemma4_qlora.py` (`--timeout 0`).
4. Downloads `adapter_config.json`, `adapter_model.safetensors`, `qlora_training_report.json`, and `dataset_summary.json`.
5. Always stops `train_a100_v21` in `finally:` so zero compute units are wasted.
6. Registers `v2.1-a100-qlora-clean-rag-gated` in `checkpoint_manager.py`.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(r"e:\trabajos uni\colab_entorno")
COLAB_EXE = r"C:\Users\marux\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\colab.exe"
SESSION_NAME = "train_a100_v21"


def run_cmd(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    print(f"\n>>> Running: {' '.join(args)}", flush=True)
    res = subprocess.run(args, text=True, capture_output=True, encoding="utf-8", errors="replace")
    if res.stdout:
        print(res.stdout, flush=True)
    if res.stderr:
        print(res.stderr, file=sys.stderr, flush=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {res.returncode}: {' '.join(args)}")
    return res


def main() -> None:
    try:
        # 1. Create A100 session (fall back to L4 only if A100 unavailable)
        res = run_cmd([COLAB_EXE, "new", "-s", SESSION_NAME, "--gpu", "A100"], check=False)
        if res.returncode != 0:
            print("A100 unavailable, falling back to L4...", flush=True)
            run_cmd([COLAB_EXE, "new", "-s", SESSION_NAME, "--gpu", "L4"], check=True)

        # 2. Upload all required files directly to /content/
        files_to_upload = [
            (BASE_DIR / "data" / "sample_astrocopilot_train.jsonl", "/content/sample_astrocopilot_train.jsonl"),
            (BASE_DIR / "data" / "sample_astrocopilot_eval.jsonl", "/content/sample_astrocopilot_eval.jsonl"),
            (BASE_DIR / "data" / "astrocopilot_master_train.jsonl", "/content/astrocopilot_master_train.jsonl"),
            (BASE_DIR / "data" / "astrocopilot_master_eval.jsonl", "/content/astrocopilot_master_eval.jsonl"),
            (BASE_DIR / "data" / "live_fetched_links_corpus.json", "/content/live_fetched_links_corpus.json"),
            (BASE_DIR / "data" / "rag_pdfs_chunks.jsonl", "/content/rag_pdfs_chunks.jsonl"),
            (BASE_DIR / "data" / "nasa_research_library_corpus.json", "/content/nasa_research_library_corpus.json"),
            (BASE_DIR / "data" / "nasa_rag_corpus.jsonl", "/content/nasa_rag_corpus.jsonl"),
            (BASE_DIR / "outputs" / "dataset_summary.json", "/content/dataset_summary.json"),
            (BASE_DIR / "src" / "curated_clean_expansions.py", "/content/curated_clean_expansions.py"),
            (BASE_DIR / "src" / "build_master_dataset.py", "/content/build_master_dataset.py"),
            (BASE_DIR / "src" / "nasa_rag_engine.py", "/content/nasa_rag_engine.py"),
            (BASE_DIR / "src" / "train_gemma4_qlora.py", "/content/train_gemma4_qlora.py"),
        ]
        for local_p, remote_p in files_to_upload:
            run_cmd([COLAB_EXE, "upload", "-s", SESSION_NAME, str(local_p), remote_p])

        # 3. Execute full 2-epoch training + 11-benchmark evaluation
        run_cmd(
            [
                COLAB_EXE,
                "exec",
                "-s",
                SESSION_NAME,
                "--timeout",
                "0",
                "-f",
                str(BASE_DIR / "src" / "train_gemma4_qlora.py"),
            ]
        )

        # 4. Download trained LoRA adapter and reports
        out_lora = BASE_DIR / "outputs" / "astrocopilot_gemma4_lora"
        out_lora.mkdir(parents=True, exist_ok=True)
        downloads = [
            ("/content/outputs/qlora_training_report.json", BASE_DIR / "outputs" / "qlora_training_report.json"),
            ("/content/outputs/dataset_summary.json", BASE_DIR / "outputs" / "dataset_summary.json"),
            ("/content/outputs/astrocopilot_gemma4_lora/adapter_config.json", out_lora / "adapter_config.json"),
            ("/content/outputs/astrocopilot_gemma4_lora/adapter_model.safetensors", out_lora / "adapter_model.safetensors"),
        ]
        for remote_p, local_p in downloads:
            run_cmd([COLAB_EXE, "download", "-s", SESSION_NAME, remote_p, str(local_p)])

    finally:
        # 5. Always stop the A100 GPU session immediately to conserve Colab Pro compute units
        print("\n>>> Stopping A100 session in finally block...", flush=True)
        run_cmd([COLAB_EXE, "stop", "-s", SESSION_NAME], check=False)
        run_cmd([COLAB_EXE, "sessions"], check=False)
        run_cmd([COLAB_EXE, "usage"], check=False)

    # 6. Register checkpoint v2.1-a100-qlora-clean-rag-gated
    run_cmd(
        [
            sys.executable,
            str(BASE_DIR / "src" / "checkpoint_manager.py"),
            "create",
            "v2.1-a100-qlora-clean-rag-gated",
            "Full 2-Epoch A100 QLoRA (r=32, alpha=64, 1455 clean audited rows x 2 epochs = 2910 examples) + "
            "Intent-Gated 362-doc Hybrid RAG + 128 safety_boundaries + 123 multi_turn + 100 numeric precision drills + "
            "11-benchmark evaluation suite.",
        ]
    )


if __name__ == "__main__":
    main()
