"""Valida y resume los datasets JSONL (texto y multimodales EN/ES) para AstroCopilot."""

from collections import Counter
import json
from pathlib import Path

REQUIRED_TELEMETRY_KEYS = {
    "flight_hazard",
    "medical_check",
    "mental_check",
    "physics_lesson",
    "copilot_message",
}


def _content_char_len(content: object) -> int:
    if isinstance(content, str):
        return len(content)
    if isinstance(content, list):
        return sum(len(str(part.get("text", ""))) for part in content if isinstance(part, dict))
    return 0


def validate_messages(messages: object, row_id: str) -> None:
    """Verifica la estructura conversacional ChatML/Multimodal (system/user/assistant)."""
    if not isinstance(messages, list) or len(messages) < 3:
        raise ValueError(f"{row_id}: 'messages' debe tener al menos system, user y assistant.")

    if messages[0].get("role") != "system":
        raise ValueError(f"{row_id}: el primer turno debe tener role='system'.")

    expected_role = "user"
    for idx, msg in enumerate(messages[1:], start=1):
        role = msg.get("role")
        content = msg.get("content")
        if role != expected_role:
            raise ValueError(f"{row_id}: turno {idx} esperaba role='{expected_role}', recibio '{role}'.")
        if isinstance(content, str):
            if not content.strip():
                raise ValueError(f"{row_id}: turno {idx} tiene 'content' vacio.")
        elif isinstance(content, list):
            if not content:
                raise ValueError(f"{row_id}: turno {idx} tiene lista 'content' vacia.")
            has_text = any(isinstance(p, dict) and p.get("type") == "text" and str(p.get("text", "")).strip() for p in content)
            has_img = any(isinstance(p, dict) and p.get("type") == "image" and str(p.get("image", "")).strip() for p in content)
            if not (has_text and has_img):
                raise ValueError(f"{row_id}: turno multimodal {idx} requiere partes 'image' y 'text'.")
            for p in content:
                if isinstance(p, dict) and p.get("type") == "image":
                    img_path = Path(str(p["image"]))
                    if img_path.is_absolute() and not img_path.exists():
                        raise ValueError(f"{row_id}: imagen no existe en disco: {img_path}")
        else:
            raise ValueError(f"{row_id}: turno {idx} tiene tipo 'content' invalido: {type(content).__name__}")
        expected_role = "assistant" if expected_role == "user" else "user"

    if messages[-1].get("role") != "assistant":
        raise ValueError(f"{row_id}: la conversacion debe terminar en role='assistant'.")


def validate_jsonl_file(path: Path) -> list[dict]:
    """Valida todas las filas de un archivo JSONL y devuelve los registros cargados."""
    records: list[dict] = []
    seen_ids: set[str] = set()

    for line_no, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw_line.strip():
            continue
        row = json.loads(raw_line)
        row_id = row.get("id") or f"line-{line_no}"
        if row_id in seen_ids:
            raise ValueError(f"{path.name}: id duplicado '{row_id}'.")
        seen_ids.add(row_id)

        validate_messages(row.get("messages"), row_id)

        if row.get("format") == "telemetry_json" or (
            row.get("format") == "vision_telemetry" and row.get("source") != "nasa_multimodal_mentor_chat"
        ):
            assistant_json = json.loads(row["messages"][-1]["content"])
            missing = REQUIRED_TELEMETRY_KEYS - set(assistant_json.keys())
            if missing:
                raise ValueError(f"{row_id}: faltan claves telemetry_json: {sorted(missing)}")

        records.append(row)

    return records


def summarize_dataset(name: str, records: list[dict]) -> None:
    """Imprime estadisticas por categoria, formato, idioma y longitud aproximada."""
    cats = Counter(r.get("category", "unknown") for r in records)
    fmts = Counter(r.get("format", "unknown") for r in records)
    langs = Counter(r.get("language", "en") for r in records)
    avg_chars = sum(sum(_content_char_len(m["content"]) for m in r["messages"]) for r in records) / len(records)

    print(f"\n=== {name} ({len(records)} ejemplos) ===")
    print("Idiomas:   ", dict(sorted(langs.items())))
    print("Categorias:", dict(sorted(cats.items())))
    print("Formatos:  ", dict(sorted(fmts.items())))
    print(f"Promedio caracteres/ejemplo: {avg_chars:.0f}")


def main() -> None:
    data_dir = Path(__file__).resolve().parent.parent / "data"
    candidates = [
        data_dir / "sample_astrocopilot_train.jsonl",
        data_dir / "sample_astrocopilot_eval.jsonl",
        data_dir / "astrocopilot_master_train.jsonl",
        data_dir / "astrocopilot_master_eval.jsonl",
    ]
    for path in candidates:
        if path.exists():
            records = validate_jsonl_file(path)
            summarize_dataset(path.name, records)
    print("\nValidacion completa: todas las filas e imagenes son validas.")


if __name__ == "__main__":
    main()
