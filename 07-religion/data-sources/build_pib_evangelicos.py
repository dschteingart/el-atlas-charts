# -*- coding: utf-8 -*-
"""data-pib-evangelicos.js: PIB per cápita de 1996 contra cambio en evangélicos 1996-2024 (chart-pib-evangelicos).

Lee dos CSV agregados de la cocina del N°7 (insumos/#7 - Religion/graficos_preliminares/scripts/10_graficos.py):
  g19_pib_vs_evangelicos.csv  (g19_pib_vs_evangelicos): cambio en evangélicos y PIB per cápita PPA (dólares de 2021,
                              promedio 1995-1997, Banco Mundial) de 17 países; Venezuela no tiene dato de PIB.
  g03_dos_rutas.csv           (g03_dos_rutas): olas que promedia cada punta y nivel de evangélicos al final, para el
                              tooltip (evangélicos al inicio = final − cambio).
Los dos ya son agregados por país; los microdatos no salen de la cocina.

Campos por país: k (ISO3), x (PIB per cápita 1995-1997), v (cambio en evangélicos, puntos), e0 y e1 (% de evangélicos
al inicio y al final), d0 y d1 (olas promediadas en cada punta).

Uso:  python build_pib_evangelicos.py [g19.csv] [g03.csv]
Salida: ../data-pib-evangelicos.js (al lado de chart-pib-evangelicos.html). Subir el ?v= del archivo en el HTML.
"""
import csv, json, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
BASE = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
        r'\graficos_preliminares\datos')
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'g19_pib_vs_evangelicos.csv')
SRC3 = sys.argv[2] if len(sys.argv) > 2 else os.path.join(BASE, 'g03_dos_rutas.csv')
OUT = os.path.join(DIR, '..', 'data-pib-evangelicos.js')

def leer(p):
    with open(p, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def olas(s):   # "1996-1997-1998" → "1996-98"; "2024" → "2024"
    ws = s.split('-')
    return ws[0] if len(ws) == 1 else ws[0] + '-' + ws[-1][2:]

rutas = {r['iso3']: r for r in leer(SRC3)}
pts = []
for r in leer(SRC):
    g = rutas[r['iso3']]
    # el cambio en evangélicos es el mismo en los dos CSV (g19 lo toma de la misma cuenta que g03)
    assert abs(float(g['d_ev']) - float(r['d_ev'])) < 0.006, r['iso3']
    e1 = float(g['ev1'])
    pts.append({'k': r['iso3'], 'x': round(float(r['pib95']), 1), 'v': round(float(r['d_ev']), 2),
                'e0': round(e1 - float(g['d_ev']), 2), 'e1': round(e1, 2),
                'd0': olas(g['desde']), 'd1': olas(g['hasta'])})
pts.sort(key=lambda p: p['k'])
assert len(pts) == 17 and 'VEN' not in {p['k'] for p in pts}

js = ('// PIB per cápita PPA (dólares de 2021, promedio 1995-1997, Banco Mundial) y cambio en el % de adultos evangélicos\n'
      '// entre 1996-1998 y 2023-2024 (Latinobarómetro), 17 países de América Latina. k = ISO3, x = PIB per cápita,\n'
      '// v = cambio en evangélicos (puntos), e0/e1 = % de evangélicos en cada punta, d0/d1 = olas promediadas.\n'
      '// Generado por data-sources/build_pib_evangelicos.py: no editar a mano.\n'
      'const REL_PIBEV = ' + json.dumps({'pts': pts}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(pts), 'países')
