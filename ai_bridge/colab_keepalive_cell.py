# CELDA GUARDIANA de KATHERINE: mantiene vivo el servidor + túnel toda la noche (para la demo).
# Ejecútala en Colab DESPUÉS de colab_katherine_cell.py, en una celda nueva, y déjala corriendo.
#  - Mientras esta celda corre, Colab no ve el entorno "inactivo" y no lo apaga por inactividad.
#  - Cada minuto prueba el servidor y el túnel por fuera. Si el servidor se cae lo reinicia (2-6 min);
#    si el túnel muere lo reabre y avisa con la URL NUEVA (la clave sigue igual).
#  - Para detenerla: botón ■ de la celda. El servidor sigue vivo hasta que desconectes el entorno.
# Importante: deja la pestaña de Colab abierta y la PC sin suspender. Colab corta igual al
# llegar a su límite de sesión (~12 h gratis, hasta ~24 h en Pro/pago).
import json, re, subprocess, time, urllib.request
from datetime import datetime

ST = json.load(open("/content/katherine_state.json"))
KEY, PORT = ST["key"], ST["port"]
SRV_LOG, CF_LOG = "/content/mentor_server.log", "/content/cloudflared.log"


def now():
    return datetime.now().strftime("%H:%M:%S")


def ok(url, timeout=20):
    try:
        req = urllib.request.Request(f"{url}/api/health", headers={"X-Mentor-Key": KEY})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r).get("ok") is True
    except Exception:
        return False


def running(pattern):
    return subprocess.run(["pgrep", "-f", pattern], capture_output=True).returncode == 0


def tunnel_url():
    m = re.findall(r"https://[a-z0-9-]+\.trycloudflare\.com", open(CF_LOG, errors="replace").read())
    return m[-1] if m else None


def start(cmd, log):
    return subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=open(log, "w", encoding="utf-8"),
                            stderr=subprocess.STDOUT, start_new_session=True, close_fds=True)


def announce(url):
    print("\n" + "=" * 70, flush=True)
    print(f"[{now()}] URL DEL TÚNEL:", flush=True)
    if "--static" in ST["srv_cmd"]:
        print("DEMO WEB PÚBLICA (compártela con los evaluadores):  " + url, flush=True)
    print("MENTOR_URL=" + url, flush=True)
    print("MENTOR_KEY=" + KEY, flush=True)
    print("npm run katherine -- --url " + url + " --key " + KEY, flush=True)
    print("=" * 70 + "\n", flush=True)


url = tunnel_url()
local_ok, public_ok = ok(f"http://127.0.0.1:{PORT}", 5), bool(url) and ok(url)
print(f"[{now()}] Estado inicial · servidor={'VIVO' if local_ok else 'CAÍDO'} · túnel={'VIVO' if public_ok else 'CAÍDO'}", flush=True)
if url:
    announce(url)

fails_srv = fails_cf = 0
t_beat = time.time()
started = time.time()
while True:
    time.sleep(60)
    # 1) Servidor del modelo (en Colab)
    if ok(f"http://127.0.0.1:{PORT}", 10):
        fails_srv = 0
    else:
        fails_srv += 1
        if not running("/content/mentor_server.py") or fails_srv >= 5:
            print(f"[{now()}] El servidor no responde: reiniciando (tarda 2-6 min)...", flush=True)
            subprocess.run(["pkill", "-f", "/content/mentor_server.py"], check=False)
            time.sleep(3)
            start(ST["srv_cmd"], SRV_LOG)
            for _ in range(120):
                time.sleep(5)
                if "MENTOR_SERVER_READY" in open(SRV_LOG, errors="replace").read():
                    print(f"[{now()}] Servidor de vuelta.", flush=True)
                    break
            else:
                print(open(SRV_LOG, errors="replace").read()[-1500:], flush=True)
            fails_srv = 0
            continue
    # 2) Túnel público (Cloudflare)
    url = tunnel_url()
    if url and ok(url):
        fails_cf = 0
    else:
        fails_cf += 1
        if not running("cloudflared tunnel") or fails_cf >= 5:
            print(f"[{now()}] El túnel no responde: abriendo uno nuevo...", flush=True)
            subprocess.run(["pkill", "-f", "cloudflared tunnel"], check=False)
            time.sleep(2)
            start(ST["cf_cmd"], CF_LOG)
            for _ in range(24):
                time.sleep(5)
                url = tunnel_url()
                if url and ok(url):
                    announce(url)  # la URL cambia: hay que reconectar el juego con la nueva
                    break
            fails_cf = 0
    # 3) Latido cada 15 min para ver que sigue vivo
    if time.time() - t_beat > 900:
        t_beat = time.time()
        gpu = subprocess.run(["nvidia-smi", "--query-gpu=memory.used,utilization.gpu", "--format=csv,noheader"],
                             capture_output=True, text=True).stdout.strip()
        h = (time.time() - started) / 3600
        print(f"[{now()}] ♥ vivo {h:.1f} h · túnel {url} · GPU {gpu}", flush=True)
