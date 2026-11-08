# -*- coding: utf-8 -*-
"""data-rutas.js: las dos rutas de salida del catolicismo y la composición religiosa año por año (chart-rutas).

Lee dos CSV agregados de la cocina del N°7 (insumos/#7 - Religion/graficos_preliminares):
  datos/g03_dos_rutas.csv       (scripts/10_graficos.py, g03_dos_rutas): cambio en evangélicos, en sin religión y en
                                católicos entre las puntas (promedio de 1996-1998 y de 2023-2024; República Dominicana
                                desde 2004-2006; Nicaragua y Venezuela hasta 2017-2020; Costa Rica y Panamá, 2024).
  datos/lb_composicion_pais.csv (scripts/05_latinobarometro.py): % de adultos según religión en cada ola, por país.
Los dos ya son agregados; los microdatos no salen de la cocina.

Vista "dos rutas" (pts): k (ISO3), x (cambio en evangélicos, puntos), v (cambio en sin religión), c (cambio en
católicos), d0/d1 (olas de cada punta), c0/c1, e0/e1, s0/s1 (% de católicos, evangélicos y sin religión en cada punta).
Vista "composición" (comp): por país, w (olas con dato) y cat, evg, otr, sin (% de adultos; suman 100). Sin religión =
ninguna + creyente sin iglesia (= sin_afiliacion). Venezuela se corta en 2020: sus olas 2023 y 2024 son inestables.
Las tres filas sin dato (n = 0: Costa Rica, República Dominicana y Panamá en una ola) se descartan.

Uso:  python build_rutas.py [g03_dos_rutas.csv] [lb_composicion_pais.csv]
Salida: ../data-rutas.js (al lado de chart-rutas.html). Subir el ?v= del archivo en el HTML.
"""
import csv, json, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
BASE = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
        r'\graficos_preliminares\datos')
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'g03_dos_rutas.csv')
SRCC = sys.argv[2] if len(sys.argv) > 2 else os.path.join(BASE, 'lb_composicion_pais.csv')
OUT = os.path.join(DIR, '..', 'data-rutas.js')
VEN_HASTA = 2020

def leer(p):
    with open(p, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def olas(s):   # "1996-1997-1998" → "1996-98"; "2024" → "2024"
    ws = s.split('-')
    return ws[0] if len(ws) == 1 else ws[0] + '-' + ws[-1][2:]

r2 = lambda v: round(float(v), 2)
pts = []
for r in leer(SRC):
    c1, e1, s1 = float(r['cat1']), float(r['ev1']), float(r['sin1'])
    pts.append({'k': r['iso3'], 'x': r2(r['d_ev']), 'v': r2(r['d_sin']), 'c': r2(r['d_cat']),
                'd0': olas(r['desde']), 'd1': olas(r['hasta']),
                'c0': r2(r['cat0']), 'c1': r2(c1), 'e0': r2(e1 - float(r['d_ev'])), 'e1': r2(e1),
                's0': r2(s1 - float(r['d_sin'])), 's1': r2(s1)})
pts.sort(key=lambda p: p['k'])
assert len(pts) == 18

comp = {}
for r in leer(SRCC):
    if not r['catolica'] or float(r['n']) == 0:
        continue
    k, w = r['country_iso3'], int(r['wave'])
    if k == 'VEN' and w > VEN_HASTA:
        continue
    sin = float(r['ninguna']) + float(r['creyente_sin_iglesia'])
    assert abs(sin - float(r['sin_afiliacion'])) < 1e-6
    tot = float(r['catolica']) + float(r['evangelica']) + float(r['otra']) + sin
    assert abs(tot - 100) < 1e-6, (k, w, tot)
    d = comp.setdefault(k, {'w': [], 'cat': [], 'evg': [], 'otr': [], 'sin': []})
    d['w'].append(w); d['cat'].append(r2(r['catolica'])); d['evg'].append(r2(r['evangelica']))
    d['otr'].append(r2(r['otra'])); d['sin'].append(r2(sin))
for k, d in comp.items():
    orden = sorted(range(len(d['w'])), key=lambda i: d['w'][i])
    for c in d:
        d[c] = [d[c][i] for i in orden]
assert set(comp) == {p['k'] for p in pts}
assert max(comp['VEN']['w']) == VEN_HASTA

js = ('// Dos rutas de salida del catolicismo (Latinobarómetro, 18 países): cambio en puntos entre 1996-1998 y 2023-2024 del %\n'
      '// de adultos evangélicos (x), sin religión (v) y católicos (c), con el nivel de cada punta (c0/c1, e0/e1, s0/s1) y las\n'
      '// olas promediadas (d0/d1). comp: % de adultos según religión en cada ola (w); sin = ninguna + creyente sin iglesia.\n'
      '// Venezuela hasta 2020. Generado por data-sources/build_rutas.py: no editar a mano.\n'
      'const REL_RUTAS = ' + json.dumps({'pts': pts, 'comp': comp}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(pts), 'países;', sum(len(d['w']) for d in comp.values()), 'filas de composición')
