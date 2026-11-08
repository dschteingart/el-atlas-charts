# -*- coding: utf-8 -*-
"""data-siglo.js: porcentaje de católicos en América Latina, 1872-2024 (chart-siglo).

Lee la tabla que dibuja el PNG aprobado (g01_catolicos_largo_plazo en
insumos/#7 - Religion/graficos_preliminares/scripts/10_graficos.py), que junta:
  - Pew Research Center, región: estimaciones 1910, 1950 y 1970 (World Religion Database) y encuesta 2013-14 (2014);
  - Latinobarómetro, 16 países ponderados por población adulta, 1996-2024 (lb_composicion_region.csv);
  - censos nacionales de Brasil, México y Chile (_trabajo/series_censales_religion.csv).
Son agregados publicados o calculados en la cocina; acá no entra ningún microdato.

Series (las claves que usa el adapter): pew, lb, bra, mex, chl. Cada punto = [año, %, universo, tramo].
Chile va en dos tramos (toda la población hasta 1952, 14 o 15 años y más desde 1992): la línea se corta entre ellos.
Brasil no tiene censo comparable entre 1890 y 1940: la línea une esos dos censos (como el PNG).

Uso:  python build_siglo.py [ruta/al/g01_catolicos_largo_plazo.csv]
Salida: ../data-siglo.js (al lado de chart-siglo.html). Subir el ?v= de la página.
"""
import csv, json, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos\g01_catolicos_largo_plazo.csv')
SRC = sys.argv[1] if len(sys.argv) > 1 else CSV_DEF
OUT = os.path.join(DIR, '..', 'data-siglo.js')

SERIE = {'AL Pew': 'pew', 'AL Latinobarómetro (16 países)': 'lb', 'Brasil (censos)': 'bra',
         'México (censos)': 'mex', 'Chile (censos)': 'chl'}
ORDEN = ['pew', 'lb', 'bra', 'mex', 'chl']
# universo de cada dato, en los dos idiomas (para el CSV)
UNIV = {
    'tot':    ['Población total', 'Total population'],
    'p5':     ['Población de 5 años y más', 'Population aged 5 and over'],
    'p10':    ['Población de 10 años y más', 'Population aged 10 and over'],
    'p14':    ['Población de 14 años y más', 'Population aged 14 and over'],
    'p15':    ['Población de 15 años y más', 'Population aged 15 and over'],
    'pewtot': ['Población total de 18 países y Puerto Rico', 'Total population of 18 countries and Puerto Rico'],
    'pew18':  ['Adultos de 18 países y Puerto Rico', 'Adults in 18 countries and Puerto Rico'],
    'lb18':   ['Adultos de 16 países', 'Adults in 16 countries'],
}


def universo(serie, u):
    if serie == 'lb':
        return 'lb18'
    if serie == 'pew':
        return 'pew18' if u.startswith('Adultos') else 'pewtot'
    if '10 anos ou mais' in u:
        return 'p10'
    if '5 años y más' in u:
        return 'p5'
    if '14 años o más' in u:
        return 'p14'
    if '15 años o más' in u:
        return 'p15'
    if 'total' in u.lower() or 'residente' in u.lower():
        return 'tot'
    raise ValueError((serie, u))


data = {k: [] for k in ORDEN}
with open(SRC, encoding='utf-8-sig', newline='') as f:
    for r in csv.DictReader(f):
        k = SERIE[r['serie']]
        data[k].append([int(r['anio']), round(float(r['catolicos_pct']), 2), universo(k, r['universo'])])

for k, pts in data.items():
    pts.sort(key=lambda p: p[0])
    assert len({p[0] for p in pts}) == len(pts), k
    # tramo: Chile se corta donde pasan más de 30 años entre censos (cambia el universo); el resto es un solo tramo
    t = 0
    for i, p in enumerate(pts):
        if k == 'chl' and i and p[0] - pts[i - 1][0] > 30:
            t += 1
        p.append(t)

# controles contra el PNG aprobado
assert [p[0] for p in data['pew']] == [1910, 1950, 1970, 2014] and [p[1] for p in data['pew']] == [94, 94, 92, 69]
assert data['lb'][0][0] == 1996 and data['lb'][-1][0] == 2024
assert round(data['lb'][0][1]) == 79 and round(data['lb'][-1][1]) == 57
assert [p[3] for p in data['chl']] == [0, 0, 0, 0, 0, 1, 1, 1]
assert min(p[0] for v in data.values() for p in v) == 1872 and max(p[0] for v in data.values() for p in v) == 2024

js = ('// Porcentaje de católicos en América Latina, 1872-2024. Series: pew (Pew Research Center, región: 1910-1970 con\n'
      '// la World Religion Database, 2014 encuesta), lb (Latinobarómetro, 16 países), bra / mex / chl (censos).\n'
      '// Punto = [año, %, universo, tramo]; Chile se corta entre tramos. univ = etiqueta del universo [es, en].\n'
      '// Generado por data-sources/build_siglo.py: no editar a mano.\n'
      'const REL_SIGLO = ' + json.dumps({'series': ORDEN, 'data': data, 'univ': UNIV},
                                        ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', {k: len(v) for k, v in data.items()})
