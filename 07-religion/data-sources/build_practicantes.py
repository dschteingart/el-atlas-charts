# -*- coding: utf-8 -*-
"""data-practicantes.js: practicantes por religión, Latinobarómetro 1996-2024 (chart-practicantes).

Lee el CSV agregado que arma la cocina del N°7
(insumos/#7 - Religion/graficos_preliminares/scripts/17_practicantes_religion.py) y lo pasa a JS.
Ese CSV ya trae solo agregados (porcentajes por ola y geografía); los microdatos no salen de la cocina.

Geografías: LATAM (16 países ponderados por población adulta, solo olas con los 16 países: no hay 2023),
LATAM_SIN_BRA (los otros 15) y cada uno de los 16 países (todas sus olas; Venezuela hasta 2020).
Las olas son irregulares: el gráfico une las que hay, sin interpolar.

Uso:  python build_practicantes.py [ruta/al/practicantes_religion.csv]
Salida: ../data-practicantes.js (al lado de chart-practicantes.html). Subir el ?v= de la carpeta.
"""
import csv, json, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos\practicantes_religion.csv')
SRC = sys.argv[1] if len(sys.argv) > 1 else CSV_DEF
OUT = os.path.join(DIR, '..', 'data-practicantes.js')

AGG = ['LATAM', 'LATAM_SIN_BRA']
PAISES = ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'CRI', 'ECU', 'GTM', 'HND', 'MEX', 'PAN', 'PER', 'PRY', 'SLV', 'URY', 'VEN']

filas = {}
with open(SRC, encoding='utf-8-sig', newline='') as f:
    for r in csv.DictReader(f):
        filas.setdefault(r['geo'], []).append(r)

assert set(filas) == set(AGG + PAISES), sorted(set(filas) ^ set(AGG + PAISES))
r2 = lambda v: round(float(v), 2)
data = {}
for g in AGG + PAISES:
    rs = sorted(filas[g], key=lambda r: int(r['wave']))
    d = {'w': [int(r['wave']) for r in rs],
         'cat': [r2(r['prac_catolica']) for r in rs],
         'evg': [r2(r['prac_evangelica']) for r in rs],
         'otr': [r2(r['prac_otra']) for r in rs],
         'tot': [r2(r['prac_total']) for r in rs]}
    # el total es la suma de las tres religiones (los sin religión cuentan como no practicantes)
    for k in range(len(rs)):
        assert abs(float(rs[k]['prac_total']) - sum(float(rs[k][c]) for c in ('prac_catolica', 'prac_evangelica', 'prac_otra'))) < 1e-6
    data[g] = d
assert 2023 not in data['LATAM']['w'] and max(data['VEN']['w']) == 2020

js = ('// Practicantes por religión (Latinobarómetro, 1996-2024): % de adultos que se declara practicante o muy\n'
      '// practicante y es católico (cat), evangélico (evg) o de otra religión (otr); tot = suma de las tres.\n'
      '// w = olas con dato (irregulares: se unen las que hay). LATAM y LATAM_SIN_BRA: solo olas con los 16 países.\n'
      '// Generado por data-sources/build_practicantes.py: no editar a mano.\n'
      'const REL_PRAC = ' + json.dumps({'agg': AGG, 'paises': PAISES, 'data': data},
                                       ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', sum(len(d['w']) for d in data.values()), 'filas')
