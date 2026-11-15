"""End-to-End Google Colab Pro A100 Automation for AstroCopilot Final Mega Model (v3.0-a100-final-mega).

1. Starts A100 GPU session `train_a100_v30`.
2. Uploads audited dataset (`4,157` train + `16` eval, 0 violations, 12 HUD screens),
   Tier-1 RAG corpus (`367` docs), Tier-2 SQLite FTS5 Mega-RAG (`nasa_mega_rag.sqlite.gz`, `387,363` docs),
   and training scripts to `/content/`.
3. Executes `train_gemma4_qlora.py` (`--timeout 0`) with 2 epochs core + 1 epoch mega knowledge
   and live 19-benchmark evaluation (`14` core + `5` Tier-2 Mega-RAG probes).
4. Downloads `adapter_config.json`, `adapter_model.safetensors`, `qlora_training_report.json`, and `dataset_summary.json`.
5. Always stops `train_a100_v30` in `finally:` so zero compute units are wasted.
6. Registers `v3.0-a100-final-mega` in `checkpoint_manager.py` only when training & downloads succeed.
"""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import time

BASE_DIR = Path(r"e:\trabajos uni\colab_entorno")
COLAB_EXE = r"C:\Users\marux\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\colab.exe"
SESSION_NAME = "train_a100_v30"


def run_cmd(args: list[str], check: bool = True, stream: bool = False) -> subprocess.CompletedProcess:
    print(f"\n>>> Running: {' '.join(args)}", flush=True)
    if stream:
        res = subprocess.run(args)
    else:
        res = subprocess.run(args, text=True, capture_output=True, encoding="utf-8", errors="replace")
        if res.stdout:
            print(res.stdout, flush=True)
        if res.stderr:
            print(res.stderr, file=sys.stderr, flush=True)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {res.returncode}: {' '.join(args)}")
    return res


def run_cmd_with_retry(args: list[str], retries: int = 3, delay_s: float = 3.0) -> None:
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            run_cmd(args, check=True)
            return
        except Exception as exc:
            last_exc = exc
            if attempt < retries:
                print(f"Transient transfer error (attempt {attempt}/{retries}): {exc}. Retrying in {delay_s}s...", flush=True)
                time.sleep(delay_s)
    if last_exc is not None:
        raise last_exc


def main() -> None:
    mega_parts = sorted((BASE_DIR / "data" / "mega_rag_parts").glob("nasa_mega_rag.sqlite.gz.part*"))
    if not mega_parts:
        raise FileNotFoundError("Missing split chunks in data/mega_rag_parts/")

    files_to_upload = [
        (BASE_DIR / "data" / "sample_astrocopilot_train.jsonl", "/content/sample_astrocopilot_train.jsonl"),
        (BASE_DIR / "data" / "sample_astrocopilot_eval.jsonl", "/content/sample_astrocopilot_eval.jsonl"),
        (BASE_DIR / "data" / "astrocopilot_master_train.jsonl", "/content/astrocopilot_master_train.jsonl"),
        (BASE_DIR / "data" / "astrocopilot_master_eval.jsonl", "/content/astrocopilot_master_eval.jsonl"),
        (BASE_DIR / "data" / "live_fetched_links_corpus.json", "/content/live_fetched_links_corpus.json"),
        (BASE_DIR / "data" / "rag_pdfs_chunks.jsonl", "/content/rag_pdfs_chunks.jsonl"),
        (BASE_DIR / "data" / "nasa_research_library_corpus.json", "/content/nasa_research_library_corpus.json"),
        (BASE_DIR / "data" / "nasa_rag_corpus.jsonl", "/content/nasa_rag_corpus.jsonl"),
        *[(p, f"/content/{p.name}") for p in mega_parts],
        (BASE_DIR / "outputs" / "dataset_summary.json", "/content/dataset_summary.json"),
        (BASE_DIR / "src" / "curated_clean_expansions.py", "/content/curated_clean_expansions.py"),
        (BASE_DIR / "src" / "mega_dataset_expander.py", "/content/mega_dataset_expander.py"),
        (BASE_DIR / "src" / "build_master_dataset.py", "/content/build_master_dataset.py"),
        (BASE_DIR / "src" / "nasa_rag_engine.py", "/content/nasa_rag_engine.py"),
        (BASE_DIR / "src" / "train_gemma4_qlora.py", "/content/train_gemma4_qlora.py"),
    ]

    missing = [str(lp) for lp, _ in files_to_upload if not lp.exists()]
    if missing:
        raise FileNotFoundError(f"Missing required local files before starting Colab GPU: {missing}")

    succeeded = False
    try:
        # 1. Create A100 session (fall back to L4 only if A100 unavailable)
        res = run_cmd([COLAB_EXE, "new", "-s", SESSION_NAME, "--gpu", "A100"], check=False)
        if res.returncode != 0:
            print("A100 unavailable, falling back to L4...", flush=True)
            run_cmd([COLAB_EXE, "new", "-s", SESSION_NAME, "--gpu", "L4"], check=True)

        # 2. Upload all required files directly to /content/
        for local_p, remote_p in files_to_upload:
            size_mb = local_p.stat().st_size / 1e6
            print(f"Uploading {local_p.name} ({size_mb:.2f} MB) -> {remote_p}...", flush=True)
            run_cmd_with_retry([COLAB_EXE, "upload", "-s", SESSION_NAME, str(local_p), remote_p])

        # 3. Execute balanced A100 QLoRA training + 19-benchmark evaluation (streaming live stdout)
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
            ],
            stream=True,
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
            run_cmd_with_retry([COLAB_EXE, "download", "-s", SESSION_NAME, remote_p, str(local_p)])

        succeeded = True

    finally:
        # 5. Always stop the A100 GPU session immediately to conserve Colab Pro compute units
        print("\n>>> Stopping A100 session in finally block...", flush=True)
        run_cmd([COLAB_EXE, "stop", "-s", SESSION_NAME], check=False)
        run_cmd([COLAB_EXE, "sessions"], check=False)
        run_cmd([COLAB_EXE, "usage"], check=False)

    if succeeded:
        # 6. Register checkpoint v3.0-a100-final-mega
        run_cmd(
            [
                sys.executable,
                str(BASE_DIR / "src" / "checkpoint_manager.py"),
                "create",
                "v3.0-a100-final-mega",
                "Final Mega A100 QLoRA AstroCopilot (r=32, alpha=64, 4,157 clean unique rows: "
                "2 epochs core + 1 epoch 2,649 Mega Knowledge rows across NASA SDE, OpenStax Astronomy/World History, "
                "arxiv-astro-ph, Exoplanets, JPL CNEOS, Smithsonian NASM, Apollo 11/13) + "
                "387,730-doc Hybrid RAG (367 Tier-1 + 387,363 Tier-2 SQLite FTS5) + 19-benchmark live evaluation.",
            ]
        )


if __name__ == "__main__":
    main()
