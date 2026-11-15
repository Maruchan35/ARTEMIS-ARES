#!/usr/bin/env python3
"""KATHERINE mentor bridge: AETHER-4 game <-> AstroCopilot (Gemma-4-E4B + QLoRA) + NASA Hybrid RAG.

The game (src/components/MentorHologram.tsx) POSTs every teaching moment to /api/mentor:
decisions, objectives, mission starts, endings, "explain it again" and free questions.
This server grounds the model on (1) the verified fact card the game sends, (2) the NASA
RAG engine from the AI repo (Tier-1 corpus + Tier-2 SQLite mega-RAG) and (3) the
deterministic physics/coaching rules, then returns a short JSON reply in the persona of
KATHERINE (holographic tactical mentor AI).

Backends (--backend):
  hf       Load unsloth/gemma-4-E4B-it + the LoRA adapter with transformers (GPU, e.g. on Colab).
  remote   Forward generation to another mentor_server running --backend hf (Colab + tunnel).
           RAG still runs locally, so the 387k-doc mega-RAG never has to be uploaded.
  openai   Any OpenAI-compatible /v1/chat/completions server (llama.cpp, vLLM, LM Studio, Ollama).
  mock     Fake model that echoes the card as JSON (integration tests, no GPU).
  offline  No model: questions are answered from the RAG library, events fall back to the game's cards.

Neural voice (optional, --voice auto): POST /api/tts renders KATHERINE's lines with Supertonic 3 on the CPU
(pip install supertonic). Without it the game uses the browser's own voices.

Examples:
  python ai_bridge/mentor_server.py --backend offline --ai-root "E:/trabajos uni/colab_entorno"
  python ai_bridge/mentor_server.py --backend remote --remote-url https://xxx.trycloudflare.com --api-key KEY
  python ai_bridge/run_colab_mentor.py   # does the whole Colab GPU + tunnel + local bridge setup
"""

from __future__ import annotations

import argparse
import hmac
import json
import os
import re
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
CACHE_DIR = HERE / ".cache"
DEFAULT_MODEL_ID = "unsloth/gemma-4-E4B-it"
USER_AGENT = "katherine-mentor-bridge/1.0"
MAX_BODY_BYTES = 64 * 1024

try:  # optional neural voice (ai_bridge/mentor_voice.py + `pip install supertonic`)
    from mentor_voice import VoiceEngine
except ImportError:  # e.g. only mentor_server.py was copied to Colab
    VoiceEngine = None  # type: ignore[assignment,misc]

# --------------------------------------------------------------------------- persona
# English system prompt close to the AstroCopilot training prompt (the LoRA was trained on it),
# plus the KATHERINE persona and the output-language instruction.
SYSTEM_PROMPT = (
    "You are AstroCopilot, an AI mission mentor and shipboard companion for a NASA-inspired space game for cadets "
    "(ages 10-14). In this game your call-sign is KATHERINE: a holographic tactical AI, confident, quick-witted, warm "
    "and protective, who speaks in short, vivid sentences with a dry touch of humor, always clear for a kid. "
    "You are a teacher: explain WHY with verified NASA data, connect each decision to what real astronauts lived "
    "through, and guide with Socratic questions instead of dumping the whole answer. In a crisis, give the action first. "
    "Use ONLY facts and numbers from [VERIFIED_FACT_CARD], [NASA_RAG_CONTEXT] and [DETERMINISTIC_CHECKS]; never invent "
    "numbers, dates or names. Never confuse weight with mass/inertia. Never give real medical diagnoses. If the cadet "
    "reports real-life danger, step out of the game and tell them to get a trusted adult."
)
LANG_RULE = {
    "es": "Responde SIEMPRE en español de México, claro y natural.",
    "en": "Always answer in clear, natural English.",
}
# Teaching register per age level (src/ai/learner.ts). The facts never change, only how they are told.
LEVEL_RULES = {
    "explorer": (
        "AUDIENCE: a child aged 6-9 (Explorer). Use very short sentences (max 12 words each), everyday words and ONE "
        "concrete comparison from home or school (a sponge, a backpack, a bathtub). Avoid units and big numbers unless "
        "they are in the card; never use formulas. Be warm and encouraging."
    ),
    "cadet": (
        "AUDIENCE: a student aged 10-14 (Cadet). Clear sentences, real NASA data from the card, explain the 'why' in "
        "one step, define any technical word in a few words."
    ),
    "engineer": (
        "AUDIENCE: a teenager or adult (Engineer, 15+). Be precise: use the card's numbers with units, name the system "
        "(ECLSS, CDRA, Kilopower...), explain cause and effect, and mention one trade-off."
    ),
}
LEVEL_LABEL = {"explorer": "Explorer 6-9", "cadet": "Cadet 10-14", "engineer": "Engineer 15+"}
TASKS = {
    "decision": (
        "The cadet just made a DECISION. In 'say' explain in 1-2 short sentences what it means for the mission, using the "
        "card numbers (start with a short persona reaction). In 'did_you_know' give ONE real astronaut/NASA history fact from "
        "the card or the RAG context. In 'check_question' ask whether they understood (e.g. '¿Entiendes la idea?') or a short "
        "Socratic question about the trade-off."
    ),
    "explain_again": (
        "The cadet did NOT understand. In 'say' re-explain it more simply with an everyday analogy (max 2 sentences, no new "
        "numbers). Leave 'did_you_know' empty. In 'check_question' ask if it makes more sense now."
    ),
    "objective": (
        "The cadet completed an objective. In 'say' congratulate briefly (1 sentence) and say why it matters. In "
        "'did_you_know' give ONE real fact from the card. 'check_question' may be a short question or empty."
    ),
    "mission_start": (
        "A new mission phase starts. In 'say' brief the cadet in max 2 sentences (what to watch, what matters). In "
        "'did_you_know' give ONE real fact from the card. Leave 'check_question' empty."
    ),
    "ending": (
        "The mission verdict is in. In 'say' debrief in max 2 sentences connecting it to the cadet's decisions. In "
        "'did_you_know' give ONE real fact from the card. In 'check_question' ask what they would change next time."
    ),
    "grade": (
        "The cadet explained the idea of the VERIFIED_FACT_CARD in their own words (CADET_ANSWER). Judge ONLY against "
        "the card: 'verdict' is good (main idea right), partial (right direction, key piece missing) or miss (wrong "
        "or unrelated). In 'say' give warm feedback in max 2 sentences: praise what is right, then add the missing "
        "piece or correct the error kindly. In 'misconception' write the wrong belief in max 12 words, or leave it "
        "empty. Output keys: say, verdict, misconception."
    ),
    "question": (
        "The cadet asked you something. In 'say' answer in max 3 short sentences grounded ONLY in the context; if the context "
        "does not contain the answer, say honestly you are not sure and suggest what to check in the game. 'did_you_know' may "
        "hold ONE real fact about the SAME topic, taken from the VERIFIED_FACT_CARD (preferred) or the NASA context, "
        "otherwise leave it empty; never copy document titles, ids or dataset names. 'check_question' may be one short "
        "Socratic question about the SAME topic the cadet asked."
    ),
}
OUTPUT_RULE = 'Output ONLY one JSON object, no markdown: {"say": "...", "did_you_know": "...", "check_question": "..."}'
GRADE_OUTPUT_RULE = 'Output ONLY one JSON object, no markdown: {"say": "...", "verdict": "good|partial|miss", "misconception": "..."}'

REAL_WORLD_MARKERS = (
    "en la vida real", "de verdad me", "fuera del juego", "no en el juego", "emergencia real", "me duele el pecho",
    "dolor de pecho", "no puedo respirar", "me desmayo", "me voy a desmayar", "estoy sangrando", "me quiero morir",
    "quiero morirme", "matarme", "suicid", "hacerme daño", "lastimarme", "cortarme", "autolesi", "me pegan",
    "me están pegando", "abuso", "me tragué", "me trague", "cloro y amoniaco", "veneno",
    "in real life", "for real", "outside the game", "not in the game", "real emergency", "chest pain", "chest hurts",
    "can't breathe", "cannot breathe", "fainting", "bleeding", "kill myself", "want to die", "suicide", "self-harm",
    "self harm", "hurt myself", "someone is hurting me", "swallowed", "bleach and ammonia", "poison",
)
SAFETY_REPLY = {
    "es": (
        "Pauso la misión: esto es más importante que el juego. Por favor, avísale ahora mismo a un adulto de confianza "
        "(mamá, papá, tutor o maestro). Si es una emergencia, llama al 911. Si te sientes muy mal por dentro, en México "
        "puedes llamar gratis a la Línea de la Vida: 800 911 2000."
    ),
    "en": (
        "Pausing the mission: this matters more than the game. Please tell a trusted adult right now (a parent, guardian "
        "or teacher). If it is an emergency, call your local emergency number (911 in the US and Mexico, 112 in Europe)."
    ),
}


# --------------------------------------------------------------------------- RAG
# The NASA corpus is English, so Spanish questions are mapped to English keywords before retrieval
# (raw Spanish text pulls random Spanish-language docs from the mega-RAG).
ES_EN_GLOSSARY: dict[str, str] = {
    "luna": "moon lunar", "lunar": "moon lunar", "marte": "mars", "tierra": "earth", "sol": "sun solar",
    "gravedad": "gravity", "peso": "weight", "pesas": "weight", "pesa": "weight", "pesar": "weight", "masa": "mass",
    "inercia": "inertia", "caminar": "walking gait", "caminas": "walking gait", "camina": "walking gait",
    "caminan": "walking gait", "saltar": "hopping jump", "saltas": "hopping jump", "brincar": "hopping jump",
    "ingravidez": "microgravity weightlessness", "microgravedad": "microgravity", "flotan": "microgravity floating",
    "flotar": "microgravity floating", "flotas": "microgravity floating",
    "agua": "water", "orina": "urine", "sudor": "sweat", "reciclan": "recycling recovery", "reciclar": "recycling recovery",
    "reciclaje": "recycling recovery", "recicla": "recycling recovery", "beber": "drinking water", "potable": "potable water",
    "oxigeno": "oxygen", "aire": "air atmosphere", "respirar": "breathing oxygen", "respiran": "breathing oxygen",
    "co2": "CO2 carbon dioxide scrubber", "dioxido": "carbon dioxide", "carbono": "carbon", "filtro": "scrubber filter",
    "radiacion": "radiation", "tormenta": "storm", "llamarada": "solar flare", "particulas": "particle event",
    "energia": "power energy", "electricidad": "electric power", "bateria": "battery", "baterias": "battery",
    "reactor": "fission reactor kilopower", "nuclear": "nuclear fission", "paneles": "solar arrays", "panel": "solar array",
    "solar": "solar", "luz": "light", "comida": "food", "comer": "food eating", "comen": "food eating", "alimentos": "food", "alimento": "food",
    "plantas": "plant growth crop", "planta": "plant growth", "cultivar": "crop growth", "lechuga": "lettuce veggie",
    "invernadero": "greenhouse plant growth", "semillas": "seeds", "huesos": "bone loss", "hueso": "bone loss",
    "musculos": "muscle atrophy", "musculo": "muscle atrophy", "ejercicio": "exercise countermeasure",
    "dormir": "sleep", "duermen": "sleep", "sueno": "sleep", "astronauta": "astronaut", "astronautas": "astronaut crew",
    "traje": "spacesuit", "caminata": "spacewalk EVA", "nave": "spacecraft", "cohete": "rocket launch",
    "despegue": "launch", "lanzamiento": "launch", "estacion": "space station ISS", "temperatura": "temperature thermal",
    "calor": "heat thermal", "frio": "cold thermal", "polvo": "dust regolith", "regolito": "regolith",
    "vehiculo": "vehicle rover", "presion": "pressure", "vacio": "vacuum", "cuerpo": "human body physiology",
    "corazon": "heart cardiovascular", "sangre": "blood", "ojos": "vision eyes", "vista": "vision",
    "basura": "waste", "bano": "toilet waste", "orbita": "orbit", "estrella": "star", "planeta": "planet",
    "asteroide": "asteroid", "cometa": "comet", "galaxia": "galaxy", "telescopio": "telescope", "eclipse": "eclipse",
    "atmosfera": "atmosphere", "hielo": "ice", "crater": "crater", "habitat": "habitat", "base": "base outpost",
}
EN_STOP = set(
    "the a an of and or to in on is are was were be why how what when where who which does do did can could would "
    "with for from that this it its you your they them about into than then there their if so not no yes my me i".split()
)
RAG_QUERY_PREFIX = "NASA ISS spaceflight mission "
_DATASET_NOISE = re.compile(r"nasa-sde|nasa-impact|benchmark|MEGA-|NTRS-LIB|doc_id|\[[A-Z0-9_-]{6,}\]|Context ?\(", re.I)


_EN_MARKERS = re.compile(r"\b(the|of|and|was|were|with|which|using|for|has|have|is|are)\b", re.I)
_ES_MARKERS = re.compile(r"\b(el|la|los|las|de|del|que|y|en|con|por|para|es|son|una?)\b", re.I)


def looks_english(s: str) -> bool:
    return bool(s) and len(_EN_MARKERS.findall(s)) > len(_ES_MARKERS.findall(s))


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def rag_terms(text: str, lang: str) -> list[str]:
    """English keywords for retrieval/relevance: glossary-mapped for Spanish, stopword-filtered for English."""
    words = re.findall(r"[a-z0-9]+", _strip_accents(text.lower()))
    if lang == "es":
        out = " ".join(ES_EN_GLOSSARY[w] for w in words if w in ES_EN_GLOSSARY).lower().split()
    else:
        out = [w for w in words if len(w) > 2 and w not in EN_STOP]
    return list(dict.fromkeys(out))


def relevant_docs(docs: list[dict[str, Any]], terms: list[str], keep: int = 2) -> list[dict[str, Any]]:
    """Drops retrieved docs that share (almost) no keywords with the question."""
    if not terms:
        return docs[:keep]
    need = 1 if len(terms) <= 2 else 2
    out = []
    for d in docs:
        hay = f"{d.get('title', '')} {str(d.get('content', ''))[:2000]}".lower()
        if sum(1 for t in terms if t in hay) >= need:
            out.append(d)
    return out[:keep]


def find_ai_root(cli_value: str | None) -> Path | None:
    candidates = [cli_value, os.environ.get("ASTRO_AI_ROOT"), HERE.parents[2] if len(HERE.parents) > 2 else None,
                  HERE.parent.parent / "colab_entorno", HERE.parent.parent / "buchencio2"]
    for c in candidates:
        if c and (Path(c) / "src" / "nasa_rag_engine.py").exists():
            return Path(c)
    return None


class RagLibrary:
    """Thin wrapper over the AI repo's NasaHybridRAGEngine (optional)."""

    def __init__(self, ai_root: Path | None, enabled: bool, use_mega: bool) -> None:
        self.engine = None
        self.doc_count = 0
        if not enabled:
            return
        if ai_root is None:
            print("[rag] AI repo not found (use --ai-root or ASTRO_AI_ROOT): RAG disabled.", flush=True)
            return
        sys.path.insert(0, str(ai_root / "src"))
        try:
            from nasa_rag_engine import NasaHybridRAGEngine  # type: ignore

            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            kwargs: dict[str, Any] = {"corpus_path": CACHE_DIR / "nasa_rag_corpus.jsonl"}  # never rewrite the AI repo's file
            if not use_mega:
                kwargs["mega_db_path"] = CACHE_DIR / "no_mega.sqlite"
            self.engine = NasaHybridRAGEngine(**kwargs)
            self.doc_count = int(self.engine.total_indexed_documents()) if hasattr(self.engine, "total_indexed_documents") else len(self.engine.docs)
            print(f"[rag] NASA Hybrid RAG ready: {self.doc_count:,} documents ({ai_root}).", flush=True)
        except Exception as exc:  # pragma: no cover - depends on the AI repo state
            print(f"[rag] Could not load nasa_rag_engine: {exc}", flush=True)
            self.engine = None

    def retrieve(self, query: str, top_k: int = 2, min_score: float | None = None) -> list[dict[str, Any]]:
        if not self.engine or not query.strip():
            return []
        try:
            if min_score is not None:
                try:
                    return list(self.engine.retrieve(query, top_k=top_k, min_score=min_score))
                except TypeError:  # older engine without min_score
                    pass
            return list(self.engine.retrieve(query, top_k=top_k))
        except Exception as exc:
            print(f"[rag] retrieve failed: {exc}", flush=True)
            return []

    def rules(self, query: str) -> list[str]:
        if not self.engine:
            return []
        try:
            notes = self.engine.verify_telemetry_and_rules(query, None)
        except Exception:
            return []
        # Keep the general physics + coaching rules; drop rules tied to the training simulator's own telemetry.
        return [n for n in notes if n.startswith("PHYSICS RULE") or n.startswith("MENTOR COACHING STRATEGY")][:2]

    def is_real_world_emergency(self, text: str) -> bool:
        if not self.engine:
            return False
        try:
            return self.engine.classify_query_intent(text, None) == "real_world_emergency_or_safety"
        except Exception:
            return False


# --------------------------------------------------------------------------- backends
class Backend:
    name = "base"
    model = ""

    def generate(self, messages: list[dict[str, str]], max_new_tokens: int, temperature: float) -> str | None:
        raise NotImplementedError


class OfflineBackend(Backend):
    name = "offline"

    def generate(self, messages, max_new_tokens, temperature):
        return None


class MockBackend(Backend):
    """Echoes the verified card as model JSON. Lets you test the whole pipeline without a GPU."""

    name = "mock"
    model = "mock-echo"

    def generate(self, messages, max_new_tokens, temperature):
        user = messages[-1]["content"]
        meaning = re.search(r"- meaning: (.+)", user)
        fact = re.search(r"- real history: (.+)", user)
        question = re.search(r"\[CADET_ASKS\] (.+)", user)
        say = meaning.group(1) if meaning else (f"(mock) Recibí tu pregunta: {question.group(1)}" if question else "(mock) Listo.")
        return json.dumps({"say": f"[mock] {say}", "did_you_know": fact.group(1) if fact else "", "check_question": "¿Entiendes la idea?"}, ensure_ascii=False)


class HFBackend(Backend):
    name = "hf"

    def __init__(self, model_id: str, adapter_dir: str | None, load_4bit: bool, merge: bool) -> None:
        import torch
        from transformers import AutoModelForImageTextToText, AutoProcessor, BitsAndBytesConfig

        self.torch = torch
        self.model = f"{model_id} + {Path(adapter_dir).name if adapter_dir else 'no-adapter'}"
        cuda = torch.cuda.is_available()
        dtype = torch.bfloat16 if cuda and torch.cuda.is_bf16_supported() else torch.float16
        kwargs: dict[str, Any] = {"dtype": dtype, "device_map": "auto"}
        if load_4bit and not merge:
            kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=dtype, bnb_4bit_use_double_quant=True
            )
        t0 = time.time()
        print(f"[hf] Loading {model_id} ({'4-bit NF4' if 'quantization_config' in kwargs else str(dtype)}) on {'GPU' if cuda else 'CPU'}...", flush=True)
        self.processor = AutoProcessor.from_pretrained(model_id)
        model = AutoModelForImageTextToText.from_pretrained(model_id, **kwargs)
        if adapter_dir:
            from peft import PeftModel

            model = PeftModel.from_pretrained(model, adapter_dir)
            if merge:
                model = model.merge_and_unload()  # bf16 merged weights: faster generation, more VRAM
        model.eval()
        self.net = model
        self.lock = threading.Lock()
        print(f"[hf] Model ready in {time.time() - t0:.1f}s.", flush=True)

    def generate(self, messages, max_new_tokens, temperature):
        torch = self.torch
        prompt = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
        inputs = self.processor(text=[prompt], return_tensors="pt").to(self.net.device)
        gen_kwargs: dict[str, Any] = {"max_new_tokens": max_new_tokens, "repetition_penalty": 1.08}
        if temperature > 0:
            gen_kwargs.update(do_sample=True, temperature=temperature, top_p=0.9)
        else:
            gen_kwargs.update(do_sample=False)
        with self.lock, torch.no_grad():
            out = self.net.generate(**inputs, **gen_kwargs)
        return self.processor.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)


class RemoteBackend(Backend):
    name = "remote"

    def __init__(self, url: str, api_key: str) -> None:
        self.url = url.rstrip("/")
        self.api_key = api_key
        self.model = "remote"
        try:
            self.model = str(_http_json(f"{self.url}/api/health", None, {}, timeout=10).get("model") or "remote")
        except Exception as exc:
            print(f"[remote] health check failed ({exc}); will keep trying on each request.", flush=True)

    def generate(self, messages, max_new_tokens, temperature):
        body = {"messages": messages, "max_new_tokens": max_new_tokens, "temperature": temperature}
        res = _http_json(f"{self.url}/api/generate", body, {"X-Mentor-Key": self.api_key}, timeout=120)
        return res.get("text")


class OpenAIBackend(Backend):
    name = "openai"

    def __init__(self, base_url: str, model: str, api_key: str) -> None:
        self.base = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key

    def generate(self, messages, max_new_tokens, temperature):
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        body = {"model": self.model, "messages": messages, "max_tokens": max_new_tokens, "temperature": temperature}
        res = _http_json(f"{self.base}/v1/chat/completions", body, headers, timeout=120)
        return res["choices"][0]["message"]["content"]


def _http_json(url: str, body: dict | None, headers: dict[str, str], timeout: float) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if data else "GET",
                                 headers={"Content-Type": "application/json", "User-Agent": USER_AGENT, **headers})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


# --------------------------------------------------------------------------- mentor logic
def _clip(s: Any, n: int) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s if len(s) <= n else s[: n - 1].rsplit(" ", 1)[0] + "…"


def parse_model_json(raw: str | None) -> dict[str, str] | None:
    if not raw:
        return None
    t = raw.replace("<turn|>", "").replace("<end_of_turn>", "").strip()
    t = re.sub(r"^```(?:json)?|```$", "", t.strip(), flags=re.MULTILINE).strip()
    obj: dict[str, Any] | None = None
    a, b = t.find("{"), t.rfind("}")
    if a != -1 and b > a:
        try:
            parsed = json.loads(t[a : b + 1])
            obj = parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            obj = None
    if obj is None:
        say = _clip(t, 420)
        return {"say": say, "did_you_know": "", "check_question": "", "verdict": "", "misconception": ""} if say else None
    say = obj.get("say") or obj.get("copilot_message") or obj.get("message") or obj.get("answer") or ""
    dyk = str(obj.get("did_you_know") or obj.get("fact") or "")
    if _DATASET_NOISE.search(dyk):  # the model copied a raw RAG title/id instead of a real fact
        dyk = ""
    return {
        "say": _clip(say, 420),
        "did_you_know": _clip(dyk, 320),
        "check_question": _clip(obj.get("check_question") or obj.get("question") or "", 160),
        "verdict": str(obj.get("verdict") or "").strip().lower(),
        "misconception": _clip(obj.get("misconception") or "", 140),
    }


_NUM_RE = re.compile(r"\d+(?:[.,]\d+)?")
_WORD_RE = re.compile(r"[a-záéíóúñü]{4,}")
_STOP = {"porque", "para", "como", "cómo", "esto", "esta", "este", "crees", "cree", "sería", "seria", "puedes", "hace", "tiene", "what", "does", "would", "your", "with", "that", "this", "think", "why", "about"}
# Survival order taught by the cards: air (minutes) > water (days) > food (weeks).
_BAD_ORDER = re.compile(r"agua\s*(?:>|→|,|y luego|luego)\s*aire|water\s*(?:>|→|,|then)\s*air", re.I)


def _nums(text: str) -> set[str]:
    return {n.replace(",", "").rstrip("0").rstrip(".") or "0" for n in _NUM_RE.findall(text or "")}


def verify_reply(parsed: dict, card: dict, docs: list, telemetry: dict, question: str) -> str:
    """Returns why a model reply must be discarded ('' = OK). Facts may only come from the card, RAG,
    telemetry or the question; anything else is treated as invented."""
    reply = f"{parsed.get('say', '')} {parsed.get('did_you_know', '')}"
    ground = " ".join([str(card.get(k) or "") for k in ("say", "fact", "simple")] +
                      [str(d.get("content") or "")[:1500] for d in docs] + [json.dumps(telemetry), question])
    allowed = _nums(ground)
    invented = [n for n in _nums(reply) if n not in allowed and not (n.isdigit() and int(n) <= 10)]
    if invented:
        return f"numbers not in the card/RAG: {', '.join(sorted(invented)[:4])}"
    if _BAD_ORDER.search(reply):
        return "wrong survival order (water before air)"
    check = parsed.get("check_question") or ""
    if check:
        topic_words = set(_WORD_RE.findall(f"{ground} {parsed.get('say', '')}".lower())) - _STOP
        if not topic_words & (set(_WORD_RE.findall(check.lower())) - _STOP):
            parsed["check_question"] = ""  # off-topic follow-up: drop it, keep the answer
    return ""


class MentorService:
    def __init__(self, backend: Backend, rag: RagLibrary, max_new_tokens: int, temperature: float, voice: Any = None) -> None:
        self.backend = backend
        self.rag = rag
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.voice = voice

    def health(self) -> dict[str, Any]:
        return {"ok": True, "backend": self.backend.name, "model": self.backend.model, "rag_docs": self.rag.doc_count,
                "voice": self.voice.info() if self.voice else {"status": "off", "voices": []}}

    def build_messages(self, req: dict, docs: list[dict], rules: list[str]) -> list[dict[str, str]]:
        lang = "en" if req.get("lang") == "en" else "es"
        ev = req.get("event") or {}
        kind = ev.get("kind", "question")
        card = req.get("card") or {}
        tele = req.get("telemetry") or {}
        parts = [f"[GAME_EVENT] kind={kind} topic={ev.get('topic', '')}"]
        parts.append("[GAME_TELEMETRY] " + json.dumps(tele, ensure_ascii=False)[:900])
        if card:
            parts.append(
                "[VERIFIED_FACT_CARD]\n"
                f"- meaning: {_clip(card.get('say'), 500)}\n"
                f"- real history: {_clip(card.get('fact'), 400)}\n"
                f"- source: {_clip(card.get('source'), 120)}\n"
                + (f"- simple analogy: {_clip(card.get('simple'), 300)}\n" if card.get("simple") else "")
                + f"- tone: {card.get('tone', 'neutral')}"
            )
        if docs:
            ctx = "\n".join(f"- [{d.get('doc_id')}] {_clip(d.get('title'), 120)}: {_clip(d.get('content'), 380)}" for d in docs)
            parts.append(f"[NASA_RAG_CONTEXT] (background; ignore anything unrelated)\n{ctx}\n[/NASA_RAG_CONTEXT]")
        if rules:
            parts.append("[DETERMINISTIC_CHECKS]\n" + "\n".join(f"* {_clip(r, 500)}" for r in rules))
        hist = req.get("history") or []
        if hist:
            parts.append("[RECENT_DIALOGUE]\n" + "\n".join(
                f"{'KATHERINE' if h.get('role') == 'mentor' else 'CADET'}: {_clip(h.get('text'), 200)}" for h in hist[-6:]))
        if kind == "question":
            parts.append(f"[CADET_ASKS] {_clip(ev.get('text'), 400)}")
        if kind == "grade":
            parts.append(f"[CADET_ANSWER] {_clip(ev.get('text'), 400)}")
        learner = req.get("learner") or {}
        level = learner.get("level") if learner.get("level") in LEVEL_RULES else "cadet"
        profile = f"[LEARNER] level={LEVEL_LABEL[level]}"
        for key in ("mastered", "struggling", "misconceptions"):
            vals = [str(v)[:80] for v in (learner.get(key) or [])][:4]
            if vals:
                profile += f" | {key}: {', '.join(vals)}"
        parts.append(profile)
        out_rule = GRADE_OUTPUT_RULE if kind == "grade" else OUTPUT_RULE
        parts.append(f"TASK: {TASKS.get(kind, TASKS['question'])}\n{LEVEL_RULES[level]}\n{LANG_RULE[lang]}\n{out_rule}")
        return [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": "\n\n".join(parts)}]

    def reply(self, req: dict) -> dict[str, Any]:
        t0 = time.time()
        lang = "en" if req.get("lang") == "en" else "es"
        ev = req.get("event") or {}
        kind = ev.get("kind", "question")
        text = str(ev.get("text") or "")[:400]
        card = req.get("card") or {}

        if kind == "question":
            low = text.lower()
            if any(m in low for m in REAL_WORLD_MARKERS) or self.rag.is_real_world_emergency(text):
                return {"say": SAFETY_REPLY[lang], "sources": ["Real-world safety protocol"], "mode": "safety", "origin": "card",
                        "latency_ms": int((time.time() - t0) * 1000)}

        if kind == "grade":
            return self.grade(req, t0)

        if kind == "question":
            terms = rag_terms(text, lang)
            # Bare keywords trip the engine's "casual banter" intent gate; the prefix keeps them in the technical lane.
            query = (RAG_QUERY_PREFIX + " ".join(terms)) if terms else text
            docs = relevant_docs(self.rag.retrieve(query, top_k=6, min_score=8.0), terms)
            if not docs and card.get("ragQuery"):
                docs = self.rag.retrieve(str(card["ragQuery"]), top_k=1)
        else:
            query = str(card.get("ragQuery") or ev.get("topic") or "")
            docs = self.rag.retrieve(query, top_k=2)
        rules = self.rag.rules(query) if kind == "question" else []
        sources = ([card["source"]] if card.get("source") else []) + [str(d.get("doc_id")) for d in docs]

        raw = None
        try:
            raw = self.backend.generate(self.build_messages(req, docs, rules), self.max_new_tokens, self.temperature)
        except Exception as exc:
            print(f"[mentor] generation failed: {exc}", flush=True)

        parsed = parse_model_json(raw)
        if parsed and parsed["say"]:
            problem = verify_reply(parsed, card, docs, req.get("telemetry") or {}, text)
            if problem:
                print(f"[verify] model reply rejected ({problem}); using the verified card.", flush=True)
                parsed = None
        if parsed and parsed["say"]:
            dyk = parsed["did_you_know"]
            if lang == "es" and looks_english(dyk):  # copied straight from an English RAG doc
                dyk = ""
            if not dyk and kind != "explain_again":
                dyk = _clip(card.get("fact"), 320)  # fall back to the verified card fact
            return {"say": parsed["say"], "did_you_know": dyk, "check_question": parsed["check_question"],
                    "sources": sources[:4], "mode": "chat" if kind == "question" else "socratic", "origin": "model",
                    "latency_ms": int((time.time() - t0) * 1000)}

        # No model (offline backend) or unusable output.
        if kind == "question" and docs:
            top = docs[0]
            lead = "Encontré esto en la biblioteca NASA:" if lang == "es" else "Here is what the NASA library says:"
            return {"say": f"{lead} {_clip(top.get('content'), 300)}", "sources": sources[:3], "mode": "chat", "origin": "card",
                    "latency_ms": int((time.time() - t0) * 1000)}
        if card.get("say"):
            return {"say": _clip(card.get("say"), 500), "did_you_know": _clip(card.get("fact"), 400), "sources": sources[:3],
                    "mode": "socratic", "origin": "card", "latency_ms": int((time.time() - t0) * 1000)}
        return {"say": "", "sources": [], "mode": "chat", "origin": "card"}

    def grade(self, req: dict, t0: float) -> dict[str, Any]:
        """Open-answer check: the model compares the player's own explanation with the verified card."""
        card = req.get("card") or {}
        raw = None
        try:
            raw = self.backend.generate(self.build_messages(req, [], []), 160, 0.3)
        except Exception as exc:
            print(f"[mentor] grading failed: {exc}", flush=True)
        parsed = parse_model_json(raw) or {}
        verdict = parsed.get("verdict") if parsed.get("verdict") in ("good", "partial", "miss") else ""
        say = parsed.get("say", "")
        if say and verify_reply(parsed, card, [], {}, str((req.get("event") or {}).get("text") or "")):
            say = ""  # feedback invented a number: keep only the verdict
        out: dict[str, Any] = {"say": say, "sources": [card["source"]] if card.get("source") else [], "mode": "socratic",
                               "origin": "model" if say else "card", "latency_ms": int((time.time() - t0) * 1000)}
        if verdict:
            out["verdict"] = verdict
        if parsed.get("misconception"):
            out["misconception"] = parsed["misconception"]
        return out

    def raw_generate(self, body: dict) -> dict[str, Any]:
        msgs = body.get("messages")
        if not isinstance(msgs, list) or not msgs:
            raise ValueError("messages required")
        msgs = [{"role": str(m.get("role")), "content": str(m.get("content"))[:12000]} for m in msgs[:12]]
        mnt = max(16, min(int(body.get("max_new_tokens") or self.max_new_tokens), 400))
        temp = max(0.0, min(float(body.get("temperature") if body.get("temperature") is not None else self.temperature), 1.5))
        t0 = time.time()
        text = self.backend.generate(msgs, mnt, temp)
        return {"text": text or "", "latency_ms": int((time.time() - t0) * 1000)}


# --------------------------------------------------------------------------- HTTP
def make_handler(service: MentorService, api_key: str, require_key_all: bool):
    class Handler(BaseHTTPRequestHandler):
        server_version = "KatherineMentor/1.0"

        def _cors(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Mentor-Key")
            self.send_header("Access-Control-Allow-Private-Network", "true")

        def _send(self, code: int, obj: dict) -> None:
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self._cors()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _send_audio(self, data: bytes) -> None:
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _authorized(self) -> bool:
            if not api_key:
                return True
            return hmac.compare_digest(self.headers.get("X-Mentor-Key", ""), api_key)

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if self.path.split("?")[0] == "/api/health":
                self._send(200, service.health())
            else:
                self._send(404, {"error": "not found"})

        def do_POST(self) -> None:  # noqa: N802
            path = self.path.split("?")[0]
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0 or length > MAX_BODY_BYTES:
                self._send(413, {"error": "bad body size"})
                return
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except Exception:
                self._send(400, {"error": "invalid json"})
                return
            try:
                if path == "/api/mentor":
                    if require_key_all and not self._authorized():
                        self._send(401, {"error": "unauthorized"})
                        return
                    self._send(200, service.reply(body))
                elif path == "/api/tts":
                    if require_key_all and not self._authorized():
                        self._send(401, {"error": "unauthorized"})
                        return
                    if not service.voice or service.voice.status != "ready":
                        self._send(503, {"error": "voice not available"})
                        return
                    self._send_audio(service.voice.synthesize(str(body.get("text") or ""), str(body.get("lang") or "es"),
                                                              str(body.get("voice") or ""), float(body.get("speed") or 1.0)))
                elif path == "/api/generate":
                    if not self._authorized():
                        self._send(401, {"error": "unauthorized"})
                        return
                    self._send(200, service.raw_generate(body))
                else:
                    self._send(404, {"error": "not found"})
            except Exception as exc:
                print(f"[http] {path} failed: {exc}", flush=True)
                self._send(500, {"error": "internal error"})

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", flush=True)

    return Handler


def main() -> None:
    ap = argparse.ArgumentParser(description="KATHERINE mentor bridge for the AETHER-4 game.")
    ap.add_argument("--backend", choices=["hf", "remote", "openai", "mock", "offline"], default="offline")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--ai-root", help="Path to the AstroCopilot AI repo (contains src/nasa_rag_engine.py). Env: ASTRO_AI_ROOT")
    ap.add_argument("--rag", choices=["on", "off"], default="on")
    ap.add_argument("--no-mega", action="store_true", help="Use only the Tier-1 corpus (skip the SQLite mega-RAG).")
    ap.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    ap.add_argument("--adapter", help="LoRA adapter dir (default: <ai-root>/outputs/astrocopilot_gemma4_lora)")
    ap.add_argument("--no-4bit", action="store_true", help="hf: load bf16/fp16 instead of 4-bit NF4.")
    ap.add_argument("--merge", action="store_true", help="hf: merge LoRA into bf16 weights (faster, needs ~16 GB VRAM).")
    ap.add_argument("--remote-url", help="remote: URL of a mentor_server running --backend hf")
    ap.add_argument("--openai-url", default="http://127.0.0.1:8080", help="openai: base URL of the compatible server")
    ap.add_argument("--openai-model", default="astrocopilot")
    ap.add_argument("--api-key", default=os.environ.get("MENTOR_API_KEY", ""), help="Shared secret (X-Mentor-Key / Bearer).")
    ap.add_argument("--require-key-all", action="store_true", help="Also protect /api/mentor (use when exposed through a tunnel).")
    ap.add_argument("--max-new-tokens", type=int, default=220)
    ap.add_argument("--temperature", type=float, default=0.6)
    ap.add_argument("--voice", choices=["auto", "off"], default="auto",
                    help="Neural voice with Supertonic 3 on the CPU (needs `pip install supertonic`).")
    ap.add_argument("--voice-steps", type=int, default=8, help="Supertonic quality steps (5 fast … 12 best).")
    args = ap.parse_args()

    ai_root = find_ai_root(args.ai_root)
    rag = RagLibrary(ai_root, enabled=args.rag == "on", use_mega=not args.no_mega)

    backend: Backend
    if args.backend == "hf":
        adapter = args.adapter or (str(ai_root / "outputs" / "astrocopilot_gemma4_lora") if ai_root else None)
        if adapter and not (Path(adapter) / "adapter_config.json").exists():
            print(f"[hf] Adapter not found at {adapter}: loading the base model only.", flush=True)
            adapter = None
        backend = HFBackend(args.model_id, adapter, load_4bit=not args.no_4bit, merge=args.merge)
    elif args.backend == "remote":
        if not args.remote_url:
            ap.error("--remote-url is required for --backend remote")
        backend = RemoteBackend(args.remote_url, args.api_key)
    elif args.backend == "openai":
        backend = OpenAIBackend(args.openai_url, args.openai_model, args.api_key)
    elif args.backend == "mock":
        backend = MockBackend()
    else:
        backend = OfflineBackend()

    voice = VoiceEngine(args.voice, args.voice_steps) if VoiceEngine and args.voice != "off" else None
    service = MentorService(backend, rag, args.max_new_tokens, args.temperature, voice)
    httpd = ThreadingHTTPServer((args.host, args.port), make_handler(service, args.api_key, args.require_key_all))
    print(f"[mentor] KATHERINE listening on http://{args.host}:{args.port} | backend={backend.name} | rag_docs={rag.doc_count:,}", flush=True)
    print("MENTOR_SERVER_READY", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
