"""KATHERINE's neural voice for the mentor bridge (optional).

Supertonic 3 (Supertone, ONNX, ~99M params, OpenRAIL-M model / MIT code) runs on CPU ~4x faster than real time
and every preset voice (F1-F5, M1-M5) speaks both Spanish and English, so KATHERINE sounds the same in both
languages.  Install with:  pip install supertonic   (first run downloads ~400 MB to ai_bridge/.cache/supertonic3/,
or to $SUPERTONIC_DIR).

Supertonic reads Spanish digits and unit symbols badly ("1,350 ppm" comes out garbled), so `speech_text()`
spells numbers and units out before synthesis.  Checked with a Whisper round-trip on the game's own lines.
"""

from __future__ import annotations

import io
import os
import re
import threading
import time
import unicodedata
import wave
from collections import OrderedDict
from pathlib import Path
from typing import Any

VOICES = ["F1", "F2", "F3", "F4", "F5", "M1", "M2", "M3", "M4", "M5"]
DEFAULT_VOICE = "F5"  # lowest, calmest female voice; read "cadet"/"cadete" cleanly in both languages
MAX_CHARS = 600

# ----------------------------------------------------------------------------------------- numbers → words (es)
_UNITS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce",
          "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno",
          "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho",
          "veintinueve"]
_TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
_HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos",
             "ochocientos", "novecientos"]


def _es_below_1000(n: int) -> str:
    if n < 30:
        return _UNITS[n]
    if n < 100:
        t, u = divmod(n, 10)
        return _TENS[t] + (f" y {_UNITS[u]}" if u else "")
    if n == 100:
        return "cien"
    h, rest = divmod(n, 100)
    return _HUNDREDS[h] + (f" {_es_below_1000(rest)}" if rest else "")


def es_int(n: int) -> str:
    if n < 0:
        return "menos " + es_int(-n)
    if n < 1000:
        return _es_below_1000(n)
    if n < 1_000_000:
        k, rest = divmod(n, 1000)
        head = "mil" if k == 1 else f"{_es_below_1000(k).replace('uno', 'un') if k % 10 == 1 and k % 100 != 11 else _es_below_1000(k)} mil"
        return head + (f" {_es_below_1000(rest)}" if rest else "")
    m, rest = divmod(n, 1_000_000)
    head = "un millón" if m == 1 else f"{es_int(m)} millones"
    return head + (f" {es_int(rest)}" if rest else "")


def es_number(tok: str) -> str:
    """'1,350' → 'mil trescientos cincuenta' · '0.165' → 'cero punto uno seis cinco' · '8.5' → 'ocho punto cinco'."""
    tok = tok.replace(",", "") if re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", tok) else tok.replace(",", ".")
    if "." in tok:
        whole, frac = tok.split(".", 1)
        frac_words = es_int(int(frac)) if len(frac) <= 2 and not frac.startswith("0") else " ".join(_UNITS[int(d)] for d in frac)
        return f"{es_int(int(whole or 0))} punto {frac_words}"
    return es_int(int(tok))


# ----------------------------------------------------------------------------------------- text normalisation
_UNIT_WORDS = {
    "es": {"ppm": "partes por millón", "kWe": "kilovatios", "kW": "kilovatios", "kWh": "kilovatios hora",
           "MW": "megavatios", "W": "vatios", "mSv": "milisieverts", "Sv": "sieverts", "°C": "grados",
           "ºC": "grados", "kg": "kilos", "g": "ge", "L": "litros", "km": "kilómetros", "m": "metros",
           "cm": "centímetros", "h": "horas", "min": "minutos", "mmHg": "milímetros de mercurio", "K": "kelvin",
           "%": "por ciento", "x": "veces"},
    "en": {"ppm": "parts per million", "kWe": "kilowatts", "kW": "kilowatts", "kWh": "kilowatt hours",
           "MW": "megawatts", "mSv": "millisieverts", "Sv": "sieverts", "°C": "degrees Celsius",
           "ºC": "degrees Celsius", "kg": "kilograms", "L": "liters", "km": "kilometers", "mmHg": "millimeters of mercury",
           "h": "hours", "min": "minutes", "x": "times"},
}
_NUM = r"\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?"
_PHRASES = {
    "es": [(r"CO\s?[₂2]", "ce o dos"), (r"\bO\s?[₂2]\b|\bO₂", "oxígeno"), (r"H\s?[₂2]\s?O", "agua"),
           (r"\bISS\b", "Estación Espacial Internacional"), (r"KATHERINE", "Kátherin"), (r"\b1/6\b", "un sexto"),
           (r"m/s[²2]", "metros por segundo al cuadrado"),
           (r"\s*→\s*", ", luego, "), (r"[~≈]\s*", "unos "), (r"\bvs\.?\s", "contra "), (r"\bLiOH\b", "hidróxido de litio")],
    "en": [(r"CO\s?[₂2]", "C O two"), (r"\bO\s?[₂2]\b|\bO₂", "oxygen"), (r"H\s?[₂2]\s?O", "water"),
           (r"\b1/6\b", "one sixth"), (r"m/s[²2]", "meters per second squared"), (r"\s*→\s*", ", then, "), (r"[~≈]\s*", "about "), (r"\bLiOH\b", "lithium hydroxide")],
}
_EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿️]")


def speech_text(text: str, lang: str) -> str:
    """Makes game text speakable: symbols, units and (Spanish) numbers become words."""
    lang = "en" if lang == "en" else "es"
    t = unicodedata.normalize("NFC", str(text))[:MAX_CHARS]
    t = _EMOJI.sub("", t)
    t = re.sub(r"[*_`#\[\]{}|<>]", " ", t)
    t = re.sub(r"\(([^)]*)\)", r", \1,", t)  # parentheses read as a short aside
    for pat, rep in _PHRASES[lang]:
        t = re.sub(pat, rep, t)
    units = _UNIT_WORDS[lang]
    unit_alt = "|".join(sorted((re.escape(u) for u in units), key=len, reverse=True))

    def num_unit(m: re.Match) -> str:
        num, unit = m.group(1), m.group(2)
        spoken = es_number(num) if lang == "es" else num.replace(",", "")
        return f"{spoken} {units[unit]}" if unit else spoken

    t = re.sub(rf"({_NUM})\s?({unit_alt})?(?![A-Za-z0-9])", num_unit, t)
    t = re.sub(r"\s+,", ",", re.sub(r",\s*,", ",", t))
    t = re.sub(r"([.!?¿¡:;])\s*,", r"\1", re.sub(r",\s*([.!?:;])", r"\1", t))
    return re.sub(r"\s+", " ", t).strip(" ,")


# ----------------------------------------------------------------------------------------- engine
class VoiceEngine:
    """Lazy Supertonic loader (background thread) + small LRU cache of rendered WAVs."""

    def __init__(self, mode: str = "auto", steps: int = 8) -> None:
        self.mode = mode
        self.steps = max(4, min(int(steps), 12))
        self.status = "off"
        self.error = ""
        self._tts: Any = None
        self._styles: dict[str, Any] = {}
        self._lock = threading.Lock()
        self._cache: OrderedDict[tuple, bytes] = OrderedDict()
        if mode == "off":
            return
        try:
            import supertonic  # noqa: F401
        except ImportError:
            self.status = "missing"
            self.error = "pip install supertonic"
            print("[voice] Neural voice off (pip install supertonic to enable it).", flush=True)
            return
        self.status = "loading"
        threading.Thread(target=self._load, daemon=True).start()

    def _load(self) -> None:
        try:
            from supertonic import TTS

            t0 = time.time()
            # Keep the ~400 MB model next to the bridge (gitignored) instead of filling the system drive.
            model_dir = Path(os.environ.get("SUPERTONIC_DIR") or Path(__file__).resolve().parent / ".cache" / "supertonic3")
            self._tts = TTS(model_dir=model_dir, auto_download=True)
            self.status = "ready"
            print(f"[voice] Supertonic 3 ready in {time.time() - t0:.1f}s · voices {', '.join(VOICES)}", flush=True)
        except Exception as exc:  # pragma: no cover - depends on the machine
            self.status = "error"
            self.error = str(exc)[:200]
            print(f"[voice] Could not load Supertonic: {exc}", flush=True)

    def info(self) -> dict[str, Any]:
        return {"engine": "supertonic-3", "status": self.status, "voices": VOICES if self.status == "ready" else [],
                "default": DEFAULT_VOICE, **({"hint": self.error} if self.error else {})}

    def synthesize(self, text: str, lang: str, voice: str, speed: float) -> bytes:
        if self.status != "ready":
            raise RuntimeError(f"voice not ready ({self.status})")
        lang = "en" if lang == "en" else "es"
        voice = voice if voice in VOICES else DEFAULT_VOICE
        speed = max(0.75, min(float(speed), 1.4))
        spoken = speech_text(text, lang)
        if not spoken:
            raise ValueError("empty text")
        key = (spoken, lang, voice, round(speed, 2))
        with self._lock:
            hit = self._cache.get(key)
            if hit is not None:
                self._cache.move_to_end(key)
                return hit
            if voice not in self._styles:
                self._styles[voice] = self._tts.get_voice_style(voice_name=voice)
            wav, _ = self._tts.synthesize(spoken, voice_style=self._styles[voice], total_steps=self.steps, speed=speed,
                                          lang=lang, silence_duration=0.18)
            data = _to_wav_bytes(wav, int(self._tts.sample_rate))
            self._cache[key] = data
            while len(self._cache) > 96:
                self._cache.popitem(last=False)
            return data


def _to_wav_bytes(wav: Any, sample_rate: int) -> bytes:
    import numpy as np

    a = np.clip(np.asarray(wav, dtype=np.float32).squeeze(), -1.0, 1.0)
    pcm = (a * 32767.0).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm)
    return buf.getvalue()
