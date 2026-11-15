# KATHERINE en Colab (GPU) + túnel de prueba para el juego AETHER-4.
# Pega esta celda completa en Colab (Entorno de ejecución → GPU: A100 / L4 / T4) y ejecútala.
# Al final imprime MENTOR_URL y MENTOR_KEY: pásaselos a Claude o úsalos en el bridge local:
#   python ai_bridge/mentor_server.py --backend remote --remote-url <MENTOR_URL> --api-key <MENTOR_KEY>
#
# Diferencias con la celda v3.0:
#  - El código (mentor_server.py) se descarga SIEMPRE de la rama del juego, así cada vez que
#    reejecutas la celda usas la última versión subida a GitHub (antes se quedaba con la vieja).
#  - Los archivos grandes (adaptador LoRA, Mega-RAG) solo se descargan una vez.
#  - ADAPTER_VERSION se cambia en una sola línea cuando publiques el adaptador v3.1 de tutoría.
import gzip, json, os, re, secrets, shutil, subprocess, sys, time, urllib.request

REPO = "Maruchan35/buchencio2"
GAME_BRANCH = "orbital-quarters"            # rama del juego (mentor_server.py con la tutoría por edades)
ADAPTER_VERSION = "v3.0-a100-final-mega"    # Release con adapter_*.safetensors y nasa_mega_rag.sqlite.gz
ADAPTER = "/content/astrocopilot_gemma4_lora"
AI_ROOT = "/content/astrocopilot_ai"
PORT = 8000

for d in (ADAPTER, f"{AI_ROOT}/src", f"{AI_ROOT}/data", "/content/.cache"):
    os.makedirs(d, exist_ok=True)


def fetch(url, dst, always=False):
    if always or not os.path.exists(dst) or os.path.getsize(dst) == 0:
        print(f"Descargando {os.path.basename(dst)}...", flush=True)
        tmp = dst + ".part"
        urllib.request.urlretrieve(url + (f"?t={int(time.time())}" if always else ""), tmp)
        os.replace(tmp, dst)


rel = f"https://github.com/{REPO}/releases/download/{ADAPTER_VERSION}"
raw = f"https://raw.githubusercontent.com/{REPO}"
fetch(f"{rel}/adapter_config.json", f"{ADAPTER}/adapter_config.json")
fetch(f"{rel}/adapter_model.safetensors", f"{ADAPTER}/adapter_model.safetensors")
fetch(f"{raw}/{GAME_BRANCH}/ai_bridge/mentor_server.py", "/content/mentor_server.py", always=True)
fetch(f"{raw}/main/src/nasa_rag_engine.py", f"{AI_ROOT}/src/nasa_rag_engine.py", always=True)
fetch(f"{raw}/main/data/nasa_rag_corpus.jsonl", f"{AI_ROOT}/data/nasa_rag_corpus.jsonl")
shutil.copy2(f"{AI_ROOT}/data/nasa_rag_corpus.jsonl", "/content/.cache/nasa_rag_corpus.jsonl")

mega_db = f"{AI_ROOT}/data/nasa_mega_rag.sqlite"
if not os.path.exists(mega_db) or os.path.getsize(mega_db) < 100_000_000:
    print("Descargando Mega-RAG Tier-2 SQLite (~387k docs)...", flush=True)
    gz = "/content/nasa_mega_rag.sqlite.gz"
    urllib.request.urlretrieve(f"{rel}/nasa_mega_rag.sqlite.gz", gz)
    with gzip.open(gz, "rb") as fin, open(mega_db, "wb") as fout:
        shutil.copyfileobj(fin, fout, 1024 * 1024)
    os.remove(gz)

# Commit del juego que se está usando (para saber que es la versión nueva).
try:
    with urllib.request.urlopen(f"https://api.github.com/repos/{REPO}/commits/{GAME_BRANCH}", timeout=10) as r:
        c = json.load(r)
    print(f"Juego {GAME_BRANCH} @ {c['sha'][:7]}: {c['commit']['message'].splitlines()[0][:90]}", flush=True)
except Exception as e:  # la API puede limitar peticiones; no es grave
    print("(no pude leer el commit del juego:", e, ")", flush=True)

BASE = json.load(open(f"{ADAPTER}/adapter_config.json", encoding="utf-8"))["base_model_name_or_path"]
print(f"Adaptador {ADAPTER_VERSION} | base: {BASE}", flush=True)
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "peft", "bitsandbytes", "accelerate"], check=False)

CF = "/content/cloudflared"
if not os.path.exists(CF):
    urllib.request.urlretrieve("https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64", CF)
    os.chmod(CF, 0o755)

subprocess.run(["pkill", "-f", "/content/mentor_server.py"], check=False)
subprocess.run(["pkill", "-f", "/content/cloudflared tunnel"], check=False)
time.sleep(1)

KEY = secrets.token_urlsafe(18)
srv = subprocess.Popen(
    [sys.executable, "/content/mentor_server.py",
     "--backend", "hf", "--rag", "on", "--ai-root", AI_ROOT,
     "--host", "127.0.0.1", "--port", str(PORT), "--max-new-tokens", "280",
     "--api-key", KEY, "--require-key-all",
     "--adapter", ADAPTER, "--model-id", BASE],
    stdin=subprocess.DEVNULL, stdout=open("/content/mentor_server.log", "w", encoding="utf-8"),
    stderr=subprocess.STDOUT, start_new_session=True, close_fds=True,
)
subprocess.Popen(
    [CF, "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{PORT}"],
    stdin=subprocess.DEVNULL, stdout=open("/content/cloudflared.log", "w", encoding="utf-8"),
    stderr=subprocess.STDOUT, start_new_session=True, close_fds=True,
)

print("Cargando Gemma-4 + LoRA + RAG en GPU (2-6 min)...", flush=True)
tunnel_url = None
for _ in range(360):
    time.sleep(5)
    log = open("/content/mentor_server.log", errors="replace").read()
    if srv.poll() is not None:
        print(log[-3000:], flush=True)
        raise SystemExit("El servidor se cayó: revisa el error arriba")
    m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", open("/content/cloudflared.log", errors="replace").read())
    tunnel_url = tunnel_url or (m.group(0) if m else None)
    if tunnel_url and "MENTOR_SERVER_READY" in log:
        break
else:
    print(open("/content/mentor_server.log", errors="replace").read()[-3000:], flush=True)
    raise SystemExit("Tardó demasiado en arrancar")

# Prueba del túnel de punta a punta antes de entregar la URL.
time.sleep(3)
try:
    req = urllib.request.Request(f"{tunnel_url}/api/health", headers={"X-Mentor-Key": KEY})
    with urllib.request.urlopen(req, timeout=20) as r:
        h = json.load(r)
    print("Túnel OK:", {k: h.get(k) for k in ("backend", "model", "rag_docs") if k in h}, flush=True)
except Exception as e:
    print("Aviso: el túnel aún no responde (espera 30 s y reintenta):", e, flush=True)

print("\nLISTO. Pásale esto a Claude:", flush=True)
print("MENTOR_URL=" + tunnel_url, flush=True)
print("MENTOR_KEY=" + KEY, flush=True)
print("Cuando termines: Entorno de ejecución → Desconectar y borrar (para no gastar unidades).", flush=True)
