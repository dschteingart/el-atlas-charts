# -*- coding: utf-8 -*-
"""Retratos locales para los podios que salen del dataset diferido.

`descargar_fotos.py` baja los retratos del top 5000; del 5.001 en adelante la
foto quedaba como hotlink a Commons. En la pagina se ve, pero el PNG NO: dibujar
en el canvas una imagen de otro origen exige CORS, y el antivirus de la maquina
de Daniel (MITM del https) arranca los headers. Sintoma reportado: el podio de
Paraguay se exportaba sin ninguna foto, porque sus tres figuras vienen del
diferido y las tres fallaban.

Que baja: la union de los podios alcanzables sin filtros raros — top 10 por
pais, top 3 por pais x rubro y top 3 por pais x genero. No cubre las 101
ocupaciones una por una; para esa cola queda el circulo gris de siempre.

Trabaja SIEMPRE por id de Pantheon. Las filas de data-top.js empiezan con el
PUESTO, no con el id, y confundirlos hace que un retrato se guarde con el nombre
de archivo de otra persona. Acumulativo: lo que ya esta en fotos/ no se re-baja.
La salida se suma a fotos_local.csv, que es de donde build_top_data.py toma los
archivos locales; asi una corrida posterior del pipeline no pierde el trabajo.

Correr DESPUES de descargar_fotos.py y ANTES de build_top_data.py.
"""
import os, re, ssl, sys, time, urllib.parse, urllib.request, warnings
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
from PIL import Image

warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
Image.MAX_IMAGE_PIXELS = None

DIR = os.path.dirname(os.path.abspath(__file__))
FOTOS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\fotos'
os.makedirs(FOTOS, exist_ok=True)
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

d = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = d[d.score.notna() & d.pais.notna()].copy()
F = pd.read_csv(os.path.join(DIR, 'fotos.csv'), encoding='utf-8-sig')
d = d.merge(F, on='id', how='left')
try:
    G = pd.read_csv(os.path.join(DIR, 'genero.csv'), encoding='utf-8-sig')[['id', 'genero_wd']]
    d = d.merge(G, on='id', how='left')
except FileNotFoundError:
    d['genero_wd'] = None
    print('(sin genero.csv: no se cubre el filtro de genero)')
d = d.sort_values('rank_score')
print('figuras con pais y score: %d | con imagen en Commons: %d' % (len(d), int(d.img.notna().sum())))

loc = pd.read_csv(os.path.join(DIR, 'fotos_local.csv'), encoding='utf-8-sig')
ya = dict(zip(loc.id.astype(int), loc.file.astype(str)))
print('retratos ya locales: %d' % len(ya))


def podios(claves, n):
    vistos = defaultdict(int)
    out = {}
    for fid, img, *k in zip(d.id.astype(int), d.img, *[d[c] for c in claves]):
        key = tuple(k)
        if any(pd.isna(x) for x in k) or vistos[key] >= n:
            continue
        vistos[key] += 1
        if fid not in ya and isinstance(img, str) and img:
            out[fid] = img
    return out

objetivo = {}
objetivo.update(podios(['pais'], 10))
objetivo.update(podios(['pais', 'dominio'], 3))
objetivo.update(podios(['pais', 'genero_wd'], 3))
print('retratos a resolver: %d' % len(objetivo))


def bajar(par):
    fid, img = par
    for ext in ('jpg', 'png'):
        if os.path.exists(os.path.join(FOTOS, '%d.%s' % (fid, ext))):
            return (fid, '%d.%s' % (fid, ext), 'cache')
    url = 'https://commons.wikimedia.org/wiki/Special:FilePath/%s?width=96' % urllib.parse.quote(str(img))
    for i in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=45)
            datos = r.read()
            if not datos:
                raise IOError('vacio')
            ext = 'png' if datos[:8] == b'\x89PNG\r\n\x1a\n' else 'jpg'
            nombre = '%d.%s' % (fid, ext)
            open(os.path.join(FOTOS, nombre), 'wb').write(datos)
            return (fid, nombre, 'ok')
        except Exception:
            time.sleep(1.5 + i * 2)
    return (fid, '', 'fallo')


res, t0 = [], time.time()
with ThreadPoolExecutor(max_workers=4) as ex:
    futs = [ex.submit(bajar, p) for p in objetivo.items()]
    for k, fut in enumerate(as_completed(futs), 1):
        res.append(fut.result())
        if k % 250 == 0 or k == len(futs):
            print('  %d/%d (%.0f/s)' % (k, len(futs), k / max(time.time() - t0, 1e-9)), flush=True)
print('bajados: %d | fallos: %d' % (sum(1 for _, n, _ in res if n), sum(1 for *_, e in res if e == 'fallo')))

# --- normalizar a jpeg 96px, igual que comprimir_fotos.py ---
final = {}
for fid, nombre, _ in res:
    if not nombre:
        continue
    src = os.path.join(FOTOS, nombre)
    dst_name = '%d.jpg' % fid
    dst = os.path.join(FOTOS, dst_name)
    if nombre == dst_name and os.path.exists(dst):
        final[fid] = dst_name
        continue
    try:
        im = Image.open(src)
        im.thumbnail((96, 96))
        fondo = Image.new('RGB', im.size, (250, 248, 243))
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA'); fondo.paste(im, mask=im.split()[-1])
        else:
            fondo = im.convert('RGB')
        fondo.save(dst, 'JPEG', quality=80, optimize=True)
        if os.path.abspath(src) != os.path.abspath(dst) and os.path.exists(src):
            os.remove(src)
        final[fid] = dst_name
    except Exception:
        try: os.remove(src)
        except OSError: pass
print('normalizados: %d' % len(final))

# --- sumarlos a fotos_local.csv, que es lo que lee build_top_data.py ---
ya.update(final)
pd.DataFrame(sorted(ya.items()), columns=['id', 'file']).to_csv(
    os.path.join(DIR, 'fotos_local.csv'), index=False, encoding='utf-8-sig')
tam = sum(os.path.getsize(os.path.join(FOTOS, f)) for f in os.listdir(FOTOS)) / 1e6
print('=> fotos_local.csv: %d retratos | carpeta: %d archivos (%.1f MB)'
      % (len(ya), len(os.listdir(FOTOS)), tam))
