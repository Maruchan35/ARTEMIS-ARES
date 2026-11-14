"""Punto de entrada principal para el proyecto en Google Colab."""

from pathlib import Path
import platform
import sys


def inspect_environment() -> None:
    """Muestra informacion basica del entorno y disponibilidad de GPU."""
    project_root = Path(__file__).resolve().parent.parent
    print(f"Python: {sys.version.split()[0]} ({platform.platform()})")
    print(f"Carpeta del proyecto: {project_root}")

    try:
        import torch

        cuda_ok = torch.cuda.is_available()
        print(f"PyTorch: {torch.__version__} | CUDA disponible: {cuda_ok}")
        if cuda_ok:
            gpu_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            print(f"GPU activa: {gpu_name} ({vram_gb:.1f} GB VRAM)")
    except ImportError:
        print("PyTorch no instalado en este entorno.")


def main() -> None:
    print("=== Entorno Colab Base Listo ===")
    inspect_environment()
    print("Listo para empezar. Edita src/main.py y vuelve a ejecutar la celda.")


if __name__ == "__main__":
    main()
