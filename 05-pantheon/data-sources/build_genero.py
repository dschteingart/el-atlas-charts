# -*- coding: utf-8 -*-
"""Genero (P21 de Wikidata) para TODA la base depurada. Pantheon trae errores
(Rene Favaloro figura F); Wikidata es la fuente autoritativa. Acumula sobre
genero.csv: reanudable, no repite lo ya resuelto.

M = Q6581097 (masculino) o Q2449503 (hombre trans)
F = Q6581072 (femenino) o Q1052281 (mujer trans)
'' = otro / sin dato (no se generiza la ocupacion)

Uso: python build_genero.py [WORKERS=6]
"""
import io, os, sys, ssl, json, time, warnings, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 6
F_OUT = os.path.join(DIR, 'genero.csv')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}
M_QIDS = {'Q6581097', 'Q2449503'}
F_QIDS = {'Q6581072', 'Q1052281'}

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()][['id']]
R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False,
                usecols=['id', 'wd_id']).drop_duplicates('id')
d = d.merge(R, on='id', how='left')
d = d[d.wd_id.notna() & d.wd_id.astype(str).str.startswith('Q')]

prev = pd.read_csv(F_OUT, encoding='utf-8-sig') if os.path.exists(F_OUT) else pd.DataFrame(columns=['id', 'wd_id', 'genero_wd'])
pend = d[~d.id.isin(set(prev.id))].to_dict('records')
print('base depurada: %d | ya resueltos: %d | pendientes: %d' % (len(d), len(prev), len(pend)), flush=True)

def lote(recs):
    qids = [r['wd_id'] for r in recs]
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s'
           '&props=claims&format=json' % '|'.join(qids))
    for i in range(3):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=90))
            out = {}
            for q, e in (j.get('entities') or {}).items():
                g = ''
                try:
                    qid = e['claims']['P21'][0]['mainsnak']['datavalue']['value']['id']
                    g = 'M' if qid in M_QIDS else 'F' if qid in F_QIDS else ''
                except (KeyError, IndexError, TypeError):
                    pass
                out[q] = g
            return out
        except Exception:
            time.sleep(2 + i * 2)
    return {}

nuevos = []
if pend:
    lotes = [pend[i:i + 50] for i in range(0, len(pend), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lote, l): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            for r in futs[fut]:
                nuevos.append({'id': r['id'], 'wd_id': r['wd_id'], 'genero_wd': res.get(r['wd_id'], '')})
            if k % 100 == 0 or k == len(lotes):
                v = k / max(time.time() - t0, 1e-9)
                print('  lote %d/%d (%.1f/s, faltan ~%d min)' % (k, len(lotes), v, (len(lotes) - k) / max(v, 1e-9) / 60), flush=True)
            if k % 400 == 0:
                pd.concat([prev, pd.DataFrame(nuevos)]).drop_duplicates('id').to_csv(F_OUT, index=False, encoding='utf-8-sig')

out = pd.concat([prev, pd.DataFrame(nuevos)]).drop_duplicates('id')
out.to_csv(F_OUT, index=False, encoding='utf-8-sig')
g = out.genero_wd.fillna('')
print('=> genero.csv %d filas (M %d | F %d | sin dato %d)'
      % (len(out), int((g == 'M').sum()), int((g == 'F').sum()), int((g == '').sum())))
# los que difieren del gender de Pantheon (diagnostico)
P = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False, usecols=['id', 'name', 'gender'])
cmpx = out.merge(P, on='id')
cmpx['gender'] = cmpx.gender.fillna('')
dif = cmpx[(cmpx.genero_wd != '') & (cmpx.gender != '') & (cmpx.genero_wd != cmpx.gender)]
print('difieren de Pantheon: %d (ej.: %s)' % (len(dif), ', '.join(dif.head(8).name)))
