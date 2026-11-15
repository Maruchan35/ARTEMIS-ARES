# ACTUALIZAR LA DEMO WEB en Colab sin reiniciar el modelo ni cambiar la URL.
# Úsala cuando se publique una versión nueva con  python ai_bridge/build_demo.py --publish
# (el servidor lee los archivos del disco en cada visita, así que basta con reemplazarlos).
import os, shutil, time, urllib.request, zipfile

REPO, WEB_BRANCH, WEB_DIR = "Maruchan35/buchencio2", "demo-web", "/content/aether4_web"
zpath = "/content/aether4_web.zip"
urllib.request.urlretrieve(f"https://codeload.github.com/{REPO}/zip/refs/heads/{WEB_BRANCH}?t={int(time.time())}", zpath)
with zipfile.ZipFile(zpath) as z:
    top = z.namelist()[0].split("/")[0]
    shutil.rmtree("/content/_web_tmp", ignore_errors=True)
    z.extractall("/content/_web_tmp")
new_dir = f"/content/_web_tmp/{top}"
for name in os.listdir(new_dir):  # reemplazo archivo por archivo: la carpeta nunca queda vacía
    src, dst = os.path.join(new_dir, name), os.path.join(WEB_DIR, name)
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dst)
shutil.rmtree("/content/_web_tmp", ignore_errors=True)
os.remove(zpath)
cdn = "sí (carga rápida)" if "jsdelivr" in open(f"{WEB_DIR}/jugar.html", encoding="utf-8").read() else "no"
print("Demo web actualizada · juego desde CDN:", cdn)
print(open(f"{WEB_DIR}/README.md", encoding="utf-8").read().strip().splitlines()[-1][:120])
