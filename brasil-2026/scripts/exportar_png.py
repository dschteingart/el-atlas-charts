"""Exporta cada placa a PNG 1920×1080 en png/ usando Chrome (o Edge) sin ventana.
Uso: python scripts/exportar_png.py
Abre index.html directo del disco (file://), sin servidor: ~2 s por placa."""
import os, subprocess, sys, shutil, tempfile
from concurrent.futures import ThreadPoolExecutor

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SALIDA = os.path.join(RAIZ, 'png')
NAVEGADORES = [r'C:\Program Files\Google\Chrome\Application\chrome.exe',
               r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
               r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
PLACAS = [
    ('01-pib', 'pib'),
    ('02-desempleo', 'desempleo'),
    ('03a-empleo-tipo', 'empleo'),
    ('03b-empleo-sector', 'empleo?vista=sector'),
    ('03c-informalidad', 'empleo?vista=informalidad'),
    ('04-pobreza', 'pobreza'),
    ('05-ingreso-real', 'ingreso'),
    ('06-gini', 'gini'),
    ('07-homicidios', 'homicidios'),
    ('08a-consumo-variacion', 'consumo'),
    ('08b-consumo-nivel', 'consumo?vista=nivel'),
    ('09-fiscal', 'fiscal'),
    ('10-comercio-argentina', 'comercio'),
    ('11a-encuestas-1ra-vuelta', 'encuestas'),
    ('11b-encuestas-2da-vuelta', 'encuestas?vista=2v'),
    ('12a-mapa-2022-1v-estados', 'mapa'),
    ('12b-mapa-2022-1v-municipios', 'mapa?n=mun'),
    ('12c-mapa-2022-2v-estados', 'mapa?e=2022-2'),
    ('12d-mapa-2022-2v-municipios', 'mapa?e=2022-2&n=mun'),
]


def main():
    nav = next((n for n in NAVEGADORES if os.path.exists(n)), None)
    if not nav:
        sys.exit('No encontré Chrome ni Edge.')
    os.makedirs(SALIDA, exist_ok=True)
    base = 'file:///' + os.path.join(RAIZ, 'index.html').replace(os.sep, '/')

    def captura(item):
        nombre, hash_ = item
        dest = os.path.join(SALIDA, nombre + '.png')
        url = f'{base}?png=1#{hash_}'
        for _ in range(3):
            perfil = tempfile.mkdtemp(prefix='placas_chrome_')  # perfil nuevo por captura, fuera de MEGAsync
            if os.path.exists(dest):
                os.remove(dest)
            try:
                subprocess.run([nav, '--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                                '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
                                f'--user-data-dir={perfil}', '--window-size=1920,1080', '--virtual-time-budget=5000',
                                f'--screenshot={dest}', url],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
            except subprocess.TimeoutExpired:
                pass
            finally:
                shutil.rmtree(perfil, ignore_errors=True)
            if os.path.exists(dest) and os.path.getsize(dest) > 60000:
                break
        ok = os.path.exists(dest)
        print(nombre, 'ok' if ok else 'FALLÓ', os.path.getsize(dest) if ok else '', flush=True)

    with ThreadPoolExecutor(3) as ex:
        list(ex.map(captura, PLACAS))


if __name__ == '__main__':
    main()
