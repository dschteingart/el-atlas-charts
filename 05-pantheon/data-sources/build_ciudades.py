# -*- coding: utf-8 -*-
"""Ciudad de nacimiento (P19 de Wikidata) con label ES y EN para toda la base
depurada. Dos pasadas: (1) persona -> QID del lugar; (2) labels es|en de los
lugares unicos. Acumula sobre ciudades.csv (reanudable).

Uso: python build_ciudades.py [WORKERS=6]
"""
import io, os, sys, ssl, json, re, time, warnings, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 6
F_OUT = os.path.join(DIR, 'ciudades.csv')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()][['id']]
R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False,
                usecols=['id', 'wd_id']).drop_duplicates('id')
d = d.merge(R, on='id', how='left')
d = d[d.wd_id.notna() & d.wd_id.astype(str).str.startswith('Q')]

prev = pd.read_csv(F_OUT, encoding='utf-8-sig') if os.path.exists(F_OUT) else pd.DataFrame(columns=['id', 'lugar_qid', 'ciudad_es', 'ciudad_en'])
pend = d[~d.id.isin(set(prev.id))].to_dict('records')
print('pasada 1 (P19): base %d | ya resueltos %d | pendientes %d' % (len(d), len(prev), len(pend)), flush=True)

def fetch(url):
    for i in range(3):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=ctx, timeout=90))
        except Exception:
            time.sleep(2 + i * 2)
    return {}

def lote_p19(recs):
    qids = [r['wd_id'] for r in recs]
    j = fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s&props=claims&format=json' % '|'.join(qids))
    out = {}
    for q, e in (j.get('entities') or {}).items():
        try:
            out[q] = e['claims']['P19'][0]['mainsnak']['datavalue']['value']['id']
        except (KeyError, IndexError, TypeError):
            out[q] = ''
    return out

nuevos = []
if pend:
    lotes = [pend[i:i + 50] for i in range(0, len(pend), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lote_p19, l): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            for r in futs[fut]:
                nuevos.append({'id': r['id'], 'lugar_qid': res.get(r['wd_id'], ''), 'ciudad_es': '', 'ciudad_en': ''})
            if k % 100 == 0 or k == len(lotes):
                v = k / max(time.time() - t0, 1e-9)
                print('  P19 %d/%d (%.1f/s, ~%d min)' % (k, len(lotes), v, (len(lotes) - k) / max(v, 1e-9) / 60), flush=True)
            if k % 400 == 0:
                pd.concat([prev, pd.DataFrame(nuevos)]).drop_duplicates('id').to_csv(F_OUT, index=False, encoding='utf-8-sig')

tab = pd.concat([prev, pd.DataFrame(nuevos)]).drop_duplicates('id')
tab.to_csv(F_OUT, index=False, encoding='utf-8-sig')

# --- pasada 2: labels de lugares sin resolver ---
tab['ciudad_es'] = tab.ciudad_es.fillna(''); tab['ciudad_en'] = tab.ciudad_en.fillna('')
qids_falta = sorted(set(tab[(tab.lugar_qid != '') & tab.lugar_qid.notna() & (tab.ciudad_en == '')].lugar_qid))
print('pasada 2 (labels): lugares unicos sin label: %d' % len(qids_falta), flush=True)

def lote_lab(qs):
    j = fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=%s&props=labels&languages=es%%7Cen&format=json' % '|'.join(qs))
    out = {}
    for q, e in (j.get('entities') or {}).items():
        labs = e.get('labels') or {}
        out[q] = ((labs.get('es') or {}).get('value', ''), (labs.get('en') or {}).get('value', ''))
    return out

labmap = {}
if qids_falta:
    lotes = [qids_falta[i:i + 50] for i in range(0, len(qids_falta), 50)]
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(lote_lab, l): l for l in lotes}
        for k, fut in enumerate(as_completed(futs), 1):
            labmap.update(fut.result())
            if k % 100 == 0 or k == len(lotes):
                v = k / max(time.time() - t0, 1e-9)
                print('  labels %d/%d (%.1f/s, ~%d min)' % (k, len(lotes), v, (len(lotes) - k) / max(v, 1e-9) / 60), flush=True)

def sin_paren(s):
    s2 = re.sub(r'\s*\([^)]*\)\s*$', '', str(s)).strip()
    return s2 if s2 else s

mask = tab.lugar_qid.isin(labmap.keys()) & (tab.ciudad_en == '')
tab.loc[mask, 'ciudad_es'] = tab.loc[mask, 'lugar_qid'].map(lambda q: sin_paren(labmap[q][0]))
tab.loc[mask, 'ciudad_en'] = tab.loc[mask, 'lugar_qid'].map(lambda q: sin_paren(labmap[q][1]))
tab.to_csv(F_OUT, index=False, encoding='utf-8-sig')
ok_es = int((tab.ciudad_es.fillna('') != '').sum()); ok_en = int((tab.ciudad_en.fillna('') != '').sum())
print('=> ciudades.csv %d filas | con ciudad es: %d (%.0f%%) | en: %d (%.0f%%)'
      % (len(tab), ok_es, ok_es / len(tab) * 100, ok_en, ok_en / len(tab) * 100))
