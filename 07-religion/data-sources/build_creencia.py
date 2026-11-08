# -*- coding: utf-8 -*-
"""data-creencia.js: creencia en Dios por país, América Latina y Europa occidental (chart-creencia).

Lee el CSV agregado de la cocina del N°7
(insumos/#7 - Religion/graficos_preliminares/scripts/16_creencia_trayectorias.py): porcentaje que cree en Dios
por país y ola de las Integrated Values Surveys (EVS/WVS), con el año medio de campo. Ya trae solo agregados.

Ventana (la misma que el PNG aprobado, g17_creencia_trayectorias en 10_graficos.py): encuestas de 1989 a 2022 y
solo los países con una encuesta en 1989-1999 y otra en 2017-2022, así las dos regiones se comparan en el mismo
período. Los demás países de la base (Bélgica, Chipre, Ecuador, Irlanda, Luxemburgo, Malta) quedan afuera.

Uso:  python build_creencia.py [ruta/al/creencia_trayectorias.csv]
Salida: ../data-creencia.js (al lado de chart-creencia.html). Subir el ?v= de la página.
"""
import csv, json, os, sys
from statistics import median

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos\creencia_trayectorias.csv')
SRC = sys.argv[1] if len(sys.argv) > 1 else CSV_DEF
OUT = os.path.join(DIR, '..', 'data-creencia.js')

REG = {'Latin America': 'LA', 'Western Europe': 'WE'}
FUENTE = {1: 'EVS', 2: 'WVS'}          # S001 de las IVS
A0, A1 = 1989, 2022                   # encuestas que entran
PRIMERA, ULTIMA = (1989, 1999), (2017, 2022)

filas = {}
with open(SRC, encoding='utf-8-sig', newline='') as f:
    for r in csv.DictReader(f):
        anio = int(float(r['anio']))
        if not (A0 <= anio <= A1):
            continue
        filas.setdefault(r['iso3'], {'reg': REG[r['region']], 'pts': []})['pts'].append(
            [anio, round(float(r['cree_dios']), 2), FUENTE[int(float(r['S001']))]])

paises = {}
for iso, d in filas.items():
    d['pts'].sort(key=lambda p: p[0])
    a = [p[0] for p in d['pts']]
    if a[0] <= PRIMERA[1] and a[-1] >= ULTIMA[0]:
        paises[iso] = {'r': d['reg'], 'p': d['pts']}

# orden: región y código (el adapter ordena los nombres por idioma)
orden = sorted(paises, key=lambda k: (paises[k]['r'] != 'LA', k))
paises = {k: paises[k] for k in orden}

# controles contra el PNG aprobado: 9 países de América Latina y 16 de Europa occidental, encuestas 1990-2022,
# cambio típico (mediana de los cambios entre la primera y la última encuesta) de -1 y -15 puntos
por_reg = {g: [k for k in paises if paises[k]['r'] == g] for g in ('LA', 'WE')}
assert len(por_reg['LA']) == 9 and len(por_reg['WE']) == 16, {g: len(v) for g, v in por_reg.items()}
anios = [p[0] for d in paises.values() for p in d['p']]
assert min(anios) == 1990 and max(anios) == 2022, (min(anios), max(anios))
med = {g: median(paises[k]['p'][-1][1] - paises[k]['p'][0][1] for k in v) for g, v in por_reg.items()}
assert round(med['LA']) == -1 and round(med['WE']) == -15, med
for k, d in paises.items():
    assert PRIMERA[0] <= d['p'][0][0] <= PRIMERA[1] and ULTIMA[0] <= d['p'][-1][0] <= ULTIMA[1], k

js = ('// Creencia en Dios por país (Integrated Values Surveys, EVS/WVS): porcentaje que dice creer en Dios en cada\n'
      '// encuesta. r = región (LA América Latina, WE Europa occidental); p = [año medio de campo, %, estudio].\n'
      '// Solo países con una encuesta en 1989-1999 y otra en 2017-2022 (la ventana del PNG aprobado).\n'
      '// Generado por data-sources/build_creencia.py: no editar a mano.\n'
      'const REL_CREENCIA = ' + json.dumps({'regiones': ['LA', 'WE'], 'ventana': [list(PRIMERA), list(ULTIMA)],
                                            'paises': paises}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(paises), 'países;', len(anios), 'encuestas; medianas',
      {g: round(v, 2) for g, v in med.items()})
