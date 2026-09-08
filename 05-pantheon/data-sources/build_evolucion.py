# -*- coding: utf-8 -*-
"""data-evolucion.js — stacked area de composicion de la fama por periodo.

Bins de nacimiento: 'Hasta 1500' + tramos de 50 anios (1500-1549 ... 1950-1999)
+ '2000+'. Celdas pais x bin x ocupacion (planas, [isoIdx,binIdx,occIdx,n,...])
+ matriz densa del MUNDO (incluye figuras sin pais). Las ocupaciones van
ORDENADAS por dominio y tamano: el orden de apilado es el indice.
"""
import io, os, json, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
CHARTS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'

d = pd.read_csv(os.path.join(DIR, 'base_depurada.csv'), low_memory=False)[['id', 'occupation', 'dominio', 'birthyear']]
M = pd.read_csv(os.path.join(DIR, 'master_corregido.csv'), low_memory=False)[['id', 'iso3']]
d = d.merge(M, on='id', how='left')
d = d[d.birthyear.notna()].copy()
d['birthyear'] = d.birthyear.astype(int)
print('con birthyear: %d de 116319' % len(d))

def binidx(y):
    if y < 1500: return 0
    if y >= 2000: return 11
    return 1 + (y - 1500) // 50
d['bin'] = d.birthyear.map(binidx)
BINS = [{'es': 'Hasta 1500', 'en': 'Until 1500'}] + \
       [{'es': '%d-%d' % (a, a + 49), 'en': '%d-%d' % (a, a + 49)} for a in range(1500, 2000, 50)] + \
       [{'es': '2000+', 'en': '2000+'}]

# --- dominios (orden editorial fijo, mismo del ranking) + ocupaciones ---
DOMS = [('Poder y figuras públicas', 'Power & public life'),
        ('Humanidades', 'Humanities'),
        ('Ciencia y tecnología', 'Science & tech'),
        ('Negocios y exploración', 'Business & exploration'),
        ('Arte y espectáculo', 'Arts & entertainment'),
        ('Deporte', 'Sport')]
dom_idx = {es: k for k, (es, en) in enumerate(DOMS)}
assert set(d.dominio.unique()) == set(dom_idx), sorted(d.dominio.unique())

OCC_ES = {}
s = io.open(os.path.join(CHARTS, 'data-top.js'), encoding='utf-8').read()
TF = json.loads(s.split('window.TOPFIGS=', 1)[1].rstrip().rstrip(';'))
for o in TF['occs']:
    OCC_ES[o['en'].upper()] = o['es']

tot_occ = d.groupby('occupation').size()
occ_dom = d.groupby('occupation').dominio.agg(lambda x: x.mode()[0])
occs_orden = sorted(tot_occ.index, key=lambda o: (dom_idx[occ_dom[o]], -tot_occ[o]))
occ_idx = {o: k for k, o in enumerate(occs_orden)}
occMeta = [{'es': OCC_ES.get(o.upper(), o.title()), 'en': o.title(), 'dom': dom_idx[occ_dom[o]]} for o in occs_orden]

# --- isoMeta desde data-top (fuente unica, ya con ERI/PLW y regiones ok) ---
meta_by = {m['iso']: m for m in TF['isoMeta']}
isos = sorted(set(d.iso3.dropna()))
iso_idx = {c: k for k, c in enumerate(isos)}
isoMeta = [{'iso': c, 'es': meta_by.get(c, {}).get('es', c), 'en': meta_by.get(c, {}).get('en', c),
            'reg': meta_by.get(c, {}).get('reg')} for c in isos]

# --- mundo denso (12 x Nocc) ---
NO = len(occs_orden)
world = [[0] * NO for _ in range(12)]
for (b, o), n in d.groupby(['bin', 'occupation']).size().items():
    world[b][occ_idx[o]] = int(n)

# --- celdas por pais (planas) ---
cel = d[d.iso3.notna()].groupby(['iso3', 'bin', 'occupation']).size()
flat = []
for (iso, b, o), n in cel.items():
    flat += [iso_idx[iso], int(b), occ_idx[o], int(n)]
print('celdas pais x bin x occ: %d' % (len(flat) // 4))

out = {'doms': [{'es': a, 'en': b} for a, b in DOMS], 'occs': occMeta, 'bins': BINS,
       'isoMeta': isoMeta, 'world': world, 'cells': flat}
p = os.path.join(CHARTS, 'data-evolucion.js')
io.open(p, 'w', encoding='utf-8', newline='').write(
    '// Composicion de la fama por periodo de nacimiento. bins: Hasta 1500 + 50 anios + 2000+.\n'
    '// occs ORDENADAS por dominio y tamano (el apilado es el indice). cells planas [isoIdx,binIdx,occIdx,n,...].\n'
    'window.EVOL=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('=> data-evolucion.js %.0f KB | %d occs | %d paises' % (os.path.getsize(p) / 1024, NO, len(isos)))
chk = d[d.bin == 0].groupby('dominio').size()
print('control Hasta 1500 por dominio:\n', chk.to_string())
