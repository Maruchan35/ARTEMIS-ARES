# ACTUALIZAR EL SERVIDOR DE KATHERINE en Colab sin cambiar la URL pública.
# Baja el último mentor_server.py de GitHub y reinicia solo el servidor (el túnel sigue igual).
# KATHERINE queda en modo respaldo 1-3 min mientras el modelo vuelve a cargar en la GPU.
import json, subprocess, time, urllib.request

REPO, GAME_BRANCH = "Maruchan35/buchencio2", "orbital-quarters"
ST = json.load(open("/content/katherine_state.json"))
for name in ("mentor_server.py", "mentor_voice.py"):
    urllib.request.urlretrieve(f"https://raw.githubusercontent.com/{REPO}/{GAME_BRANCH}/ai_bridge/{name}?t={int(time.time())}",
                               f"/content/{name}")
subprocess.run(["pkill", "-f", "/content/mentor_server.py"], check=False)
time.sleep(3)
srv = subprocess.Popen(ST["srv_cmd"], stdin=subprocess.DEVNULL,
                       stdout=open("/content/mentor_server.log", "w", encoding="utf-8"),
                       stderr=subprocess.STDOUT, start_new_session=True, close_fds=True)
print("Recargando el modelo en la GPU...", flush=True)
for _ in range(120):
    time.sleep(5)
    log = open("/content/mentor_server.log", errors="replace").read()
    if srv.poll() is not None:
        print(log[-3000:])
        raise SystemExit("El servidor se cayó: revisa el error arriba")
    if "MENTOR_SERVER_READY" in log:
        print("Servidor actualizado y en línea. La URL pública no cambió.")
        break
else:
    print(log[-2000:])
