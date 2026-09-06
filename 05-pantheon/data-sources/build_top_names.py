# -*- coding: utf-8 -*-
"""Baja de Wikidata el nombre en ESPANOL de las top figuras (para la tabla
quien-es-quien del N°5). El archivo Pantheon solo trae el nombre en ingles.

Acumulativo y reintentable como recuperar_lugar.py: lo ya bajado no se repite.
Salida: nombres_es.csv (id, wd_id, name_en, name_es). Si Wikidata no tiene
label es, name_es queda vacio y la tabla cae al nombre en ingles.

Uso: python build_top_names.py [TOP] [WORKERS]   (default 5000, 6)
"""
import io, os, sys, ssl, json, time, warnings, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
TOP = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
WORKERS = int(sys.argv[2]) if len(sys.argv) > 2 else 6
SALIDA = os.path.join(DIR, 'nombres_es.csv')

ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()].nsmallest(TOP, 'rank_score')
R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False,
                usecols=['id', 'wd_id']).drop_duplicates('id')
d = d.merge(R, on='id', how='left')
d = d[d.wd_id.notna() & d.wd_id.astype(str).str.startswith('Q')]
print('top %d: %d con wd_id' % (TOP, len(d)))

ya = pd.read_csv(SALIDA, encoding='utf-8-sig') if os.path.exists(SALIDA) else pd.DataFrame(columns=['id', 'wd_id', 'name_en', 'name_es'])
hechos = set(ya.id)
pend = d[~d.id.isin(hechos)][['id', 'wd_id', 'name']].rename(columns={'name': 'name_en'})
print('ya bajados: %d | pendientes: %d' % (len(ya), len(pend)))

def lote(qids):
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s'
           '&props=labels&languages=es&format=json' % '|'.join(qids))
    for i in range(3):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=60))
            out = {}
            for q, e in (j.get('entities') or {}).items():
                lab = ((e.get('labels') or {}).get('es') or {}).get('value')
                out[q] = lab or ''
            return out
        except Exception:
            time.sleep(2 + i * 2)
    return {}

filas = []
if len(pend):
    recs = pend.to_dict('records')
    lotes = [recs[i:i + 50] for i in range(0, len(recs), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lote, [r['wd_id'] for r in l]): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            res = fut.result(); l = futs[fut]
            for r in l:
                filas.append({'id': r['id'], 'wd_id': r['wd_id'], 'name_en': r['name_en'],
                              'name_es': res.get(r['wd_id'], '')})
            if k % 10 == 0 or k == len(lotes):
                print('  lote %d/%d  (%.1f/s)' % (k, len(lotes), k / max(time.time() - t0, 1e-9)), flush=True)

out = pd.concat([ya, pd.DataFrame(filas)], ignore_index=True).drop_duplicates('id')
out.to_csv(SALIDA, index=False, encoding='utf-8-sig')
con = int((out.name_es.fillna('') != '').sum())
print('=> nombres_es.csv | %d filas | %d con nombre es (%.0f%%)' % (len(out), con, con / max(len(out), 1) * 100))
