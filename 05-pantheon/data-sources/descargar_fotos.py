# -*- coding: utf-8 -*-
"""Baja los retratos del top 5000 a el-atlas-charts/05-pantheon/fotos/ (96px).

Motivo: dibujar las fotos de Commons en el canvas del PNG exige CORS, y el
antivirus de la maquina de Daniel (MITM del https) le arranca los headers, con
lo que el export salia sin retratos. Sirviendolas nosotros quedan mismo-origen:
cero CORS, andan en GitHub Pages y en el server local.

Acumulativo: lo ya bajado no se re-baja. Salida ademas: fotos_local.csv
(id, file) para que build_top_data.py apunte al archivo local.
"""
import io, os, sys, ssl, time, warnings, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
DEST = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\fotos'
os.makedirs(DEST, exist_ok=True)
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

F = pd.read_csv(os.path.join(DIR, 'fotos.csv'), encoding='utf-8-sig')
F = F[F.img.fillna('') != '']
print('con imagen en Wikidata: %d' % len(F))

def bajar(rec):
    fid = int(rec['id'])
    for ext in ('jpg', 'png'):
        if os.path.exists(os.path.join(DEST, '%d.%s' % (fid, ext))):
            return (fid, '%d.%s' % (fid, ext), 'cache')
    url = ('https://commons.wikimedia.org/wiki/Special:FilePath/%s?width=96'
           % urllib.parse.quote(str(rec['img'])))
    for i in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=45)
            datos = r.read()
            if not datos: raise IOError('vacio')
            ext = 'png' if datos[:8] == b'\x89PNG\r\n\x1a\n' else 'jpg'
            nombre = '%d.%s' % (fid, ext)
            with open(os.path.join(DEST, nombre), 'wb') as fh:
                fh.write(datos)
            return (fid, nombre, 'ok')
        except Exception:
            time.sleep(1.5 + i * 2)
    return (fid, '', 'fallo')

recs = F.to_dict('records')
res = []
t0 = time.time()
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(bajar, r) for r in recs]
    for k, fut in enumerate(as_completed(futs), 1):
        res.append(fut.result())
        if k % 500 == 0 or k == len(recs):
            v = k / max(time.time() - t0, 1e-9)
            print('  %d/%d  (%.0f/s, faltan ~%d s)' % (k, len(recs), v, (len(recs) - k) / max(v, 1e-9)), flush=True)

ok = [(fid, n) for fid, n, st in res if n]
pd.DataFrame(ok, columns=['id', 'file']).to_csv(os.path.join(DIR, 'fotos_local.csv'), index=False, encoding='utf-8-sig')
tam = sum(os.path.getsize(os.path.join(DEST, f)) for f in os.listdir(DEST)) / 1e6
print('=> %d fotos locales (%.1f MB) | fallos: %d | fotos_local.csv escrito'
      % (len(ok), tam, sum(1 for *_, st in res if st == 'fallo')))
