# -*- coding: utf-8 -*-
"""Retratos locales para los podios que salen del dataset diferido.

`descargar_fotos.py` baja los retratos del top 5000 (`data-top.js`). El resto de
las figuras vive en `data-top-full.js`, que se carga diferido cuando el lector
elige un pais que no esta en el top, y ahi la foto quedaba como hotlink a
Commons. En la pagina se ve, pero el PNG NO: dibujar en el canvas una imagen de
otro origen exige CORS, y el antivirus de Daniel (MITM del https) arranca los
headers. Sintoma reportado: el podio de Paraguay se exportaba sin ninguna foto
(sus tres figuras vienen del diferido, las tres fallaban, y el export cae al
layout sin retratos).

Que baja: la union de los podios alcanzables sin filtros raros — top 10 por
pais, top 3 por pais x rubro y top 3 por pais x genero. No cubre las 101
ocupaciones una por una; para esa cola queda el circulo gris de siempre.

Acumulativo: lo que ya esta en fotos/ no se re-baja. Al terminar reescribe
data-top-full.js apuntando al archivo local.
"""
import io, json, os, re, ssl, sys, time, urllib.parse, urllib.request, warnings
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
Image.MAX_IMAGE_PIXELS = None

CHARTS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
FOTOS = os.path.join(CHARTS, 'fotos')
os.makedirs(FOTOS, exist_ok=True)
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

ES_LOCAL = re.compile(r'^\d+\.(jpg|png)$')


def leer(nombre, var):
    s = io.open(os.path.join(CHARTS, nombre), encoding='utf-8').read()
    i = s.index('=', s.index('window.' + var))
    return s[:i + 1], json.loads(s[i + 1:].rstrip().rstrip(';').rstrip())


cab_top, TOP = leer('data-top.js', 'TOPFIGS')
cab_rest, REST = leer('data-top-full.js', 'TOPFIGS_REST')
filas = TOP['rows'] + REST
occs = TOP['occs']
print('figuras: %d (top %d + diferido %d)' % (len(filas), len(TOP['rows']), len(REST)))


def top_n(clave, n):
    g = defaultdict(list)
    for r in filas:
        g[clave(r)].append(r)
    out = {}
    for v in g.values():
        v.sort(key=lambda r: r[0])
        for r in v[:n]:
            if r[7] and not ES_LOCAL.match(str(r[7])):
                out[r[0]] = r[7]
    return out

objetivo = {}
objetivo.update(top_n(lambda r: r[3], 10))
objetivo.update(top_n(lambda r: (r[3], occs[r[4]]['dom']), 3))
objetivo.update(top_n(lambda r: (r[3], r[8]), 3))
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
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(bajar, p) for p in objetivo.items()]
    for k, fut in enumerate(as_completed(futs), 1):
        res.append(fut.result())
        if k % 250 == 0 or k == len(futs):
            v = k / max(time.time() - t0, 1e-9)
            print('  %d/%d (%.0f/s)' % (k, len(futs), v), flush=True)
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

# --- apuntar el dataset diferido al archivo local ---
n = 0
for r in REST:
    if r[0] in final and r[7] != final[r[0]]:
        r[7] = final[r[0]]; n += 1
io.open(os.path.join(CHARTS, 'data-top-full.js'), 'w', encoding='utf-8', newline='').write(
    cab_rest + json.dumps(REST, ensure_ascii=False, separators=(',', ':')) + ';\n')
tam = sum(os.path.getsize(os.path.join(FOTOS, f)) for f in os.listdir(FOTOS)) / 1e6
print('=> data-top-full.js: %d filas apuntan a fotos/ | carpeta: %d retratos (%.1f MB)'
      % (n, len(os.listdir(FOTOS)), tam))
