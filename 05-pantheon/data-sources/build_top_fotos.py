# -*- coding: utf-8 -*-
"""Baja de Wikidata la imagen (P18) del top 5000 — la misma foto que muestra
Pantheon. Acumulativo como build_top_names. Salida: fotos.csv (id, img)."""
import io, os, sys, ssl, json, time, warnings, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
DIR = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(DIR, 'fotos.csv')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

N = pd.read_csv(os.path.join(DIR, 'nombres_es.csv'), encoding='utf-8-sig')
ya = pd.read_csv(SALIDA, encoding='utf-8-sig') if os.path.exists(SALIDA) else pd.DataFrame(columns=['id', 'img'])
pend = N[~N.id.isin(set(ya.id))][['id', 'wd_id']].to_dict('records')
print('pendientes: %d de %d' % (len(pend), len(N)))

def lote(recs):
    qids = [r['wd_id'] for r in recs]
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s'
           '&props=claims&format=json' % '|'.join(qids))
    for i in range(3):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=60))
            out = {}
            for q, e in (j.get('entities') or {}).items():
                try:
                    out[q] = e['claims']['P18'][0]['mainsnak']['datavalue']['value']
                except (KeyError, IndexError, TypeError):
                    out[q] = ''
            return out
        except Exception:
            time.sleep(2 + i * 2)
    return {}

filas = []
if pend:
    lotes = [pend[i:i + 50] for i in range(0, len(pend), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(lote, l): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            for r in futs[fut]:
                filas.append({'id': r['id'], 'img': res.get(r['wd_id'], '')})
            if k % 20 == 0 or k == len(lotes):
                print('  %d/%d lotes (%.1f/s)' % (k, len(lotes), k / max(time.time() - t0, 1e-9)), flush=True)
out = pd.concat([ya, pd.DataFrame(filas)], ignore_index=True).drop_duplicates('id')
out.to_csv(SALIDA, index=False, encoding='utf-8-sig')
con = int((out.img.fillna('') != '').sum())
print('=> fotos.csv | %d filas | %d con imagen (%.0f%%)' % (len(out), con, con / max(len(out), 1) * 100))
