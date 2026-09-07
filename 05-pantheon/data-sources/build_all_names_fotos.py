# -*- coding: utf-8 -*-
"""Nombre en espanol + imagen (P18) para TODA la base depurada, en una sola
pasada por Wikidata (labels|claims juntos). Acumula sobre nombres_es.csv y
fotos.csv: lo del top 5000 ya bajado no se repite.

Uso: python build_all_names_fotos.py [WORKERS=6]
"""
import io, os, sys, ssl, json, time, warnings, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 6
F_NOM = os.path.join(DIR, 'nombres_es.csv')
F_FOT = os.path.join(DIR, 'fotos.csv')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()][['id', 'name', 'rank_score']]
R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False,
                usecols=['id', 'wd_id']).drop_duplicates('id')
d = d.merge(R, on='id', how='left')
d = d[d.wd_id.notna() & d.wd_id.astype(str).str.startswith('Q')]

nom = pd.read_csv(F_NOM, encoding='utf-8-sig') if os.path.exists(F_NOM) else pd.DataFrame(columns=['id', 'wd_id', 'name_en', 'name_es'])
fot = pd.read_csv(F_FOT, encoding='utf-8-sig') if os.path.exists(F_FOT) else pd.DataFrame(columns=['id', 'img'])
hechos = set(nom.id) & set(fot.id)
pend = d[~d.id.isin(hechos)].sort_values('rank_score')[['id', 'wd_id', 'name']].rename(columns={'name': 'name_en'}).to_dict('records')
print('base depurada: %d | ya resueltos: %d | pendientes: %d' % (len(d), len(hechos), len(pend)))

def lote(recs):
    qids = [r['wd_id'] for r in recs]
    url = ('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s'
           '&props=labels%%7Cclaims&languages=es&format=json' % '|'.join(qids))
    for i in range(3):
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=90))
            out = {}
            for q, e in (j.get('entities') or {}).items():
                lab = ((e.get('labels') or {}).get('es') or {}).get('value') or ''
                try:
                    img = e['claims']['P18'][0]['mainsnak']['datavalue']['value']
                except (KeyError, IndexError, TypeError):
                    img = ''
                out[q] = (lab, img)
            return out
        except Exception:
            time.sleep(2 + i * 2)
    return {}

nuevos_nom, nuevos_fot = [], []
if pend:
    lotes = [pend[i:i + 50] for i in range(0, len(pend), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lote, l): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            for r in futs[fut]:
                lab, img = res.get(r['wd_id'], ('', ''))
                nuevos_nom.append({'id': r['id'], 'wd_id': r['wd_id'], 'name_en': r['name_en'], 'name_es': lab})
                nuevos_fot.append({'id': r['id'], 'img': img})
            if k % 100 == 0 or k == len(lotes):
                v = k / max(time.time() - t0, 1e-9)
                print('  lote %d/%d (%.1f/s, faltan ~%d min)' % (k, len(lotes), v, (len(lotes) - k) / max(v, 1e-9) / 60), flush=True)
            if k % 400 == 0:   # guardado parcial: reanudable ante corte
                pd.concat([nom, pd.DataFrame(nuevos_nom)]).drop_duplicates('id').to_csv(F_NOM, index=False, encoding='utf-8-sig')
                pd.concat([fot, pd.DataFrame(nuevos_fot)]).drop_duplicates('id').to_csv(F_FOT, index=False, encoding='utf-8-sig')

nom = pd.concat([nom, pd.DataFrame(nuevos_nom)]).drop_duplicates('id')
fot = pd.concat([fot, pd.DataFrame(nuevos_fot)]).drop_duplicates('id')
nom.to_csv(F_NOM, index=False, encoding='utf-8-sig')
fot.to_csv(F_FOT, index=False, encoding='utf-8-sig')
print('=> nombres_es.csv %d filas (%.0f%% con es) | fotos.csv %d filas (%.0f%% con img)'
      % (len(nom), (nom.name_es.fillna('') != '').mean() * 100,
         len(fot), (fot.img.fillna('') != '').mean() * 100))
