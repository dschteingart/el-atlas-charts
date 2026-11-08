# -*- coding: utf-8 -*-
"""data-dios-religion.js: importancia de Dios contra importancia de la religión, IVS ola 7 (chart-dios-religion).

Lee el CSV agregado que arma la cocina del N°7
(insumos/#7 - Religion/graficos_preliminares/scripts/10_graficos.py, función g18_dios_vs_religion → g18_dios_vs_religion.csv).
Ese CSV ya trae solo agregados por país; los microdatos no salen de la cocina.

Campos por país: k (ISO3), r (región del Atlas), y (año de la encuesta), x (importancia de Dios, promedio 1 a 10),
v (% que dice que la religión es muy importante en su vida).
La línea punteada (ajuste entre los países no latinoamericanos) se recalcula en el navegador; acá se verifica que la
cuenta coincida con la de la cocina.

Uso:  python build_dios_religion.py [ruta/al/g18_dios_vs_religion.csv]
Salida: ../data-dios-religion.js (al lado de chart-dios-religion.html). Subir el ?v= del archivo en el HTML.
"""
import csv, json, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos\g18_dios_vs_religion.csv')
SRC = sys.argv[1] if len(sys.argv) > 1 else CSV_DEF
OUT = os.path.join(DIR, '..', 'data-dios-religion.js')

with open(SRC, encoding='utf-8-sig', newline='') as f:
    filas = list(csv.DictReader(f))

pts = []
for r in filas:
    pts.append({'k': r['iso3'], 'r': r['region'], 'y': int(float(r['year'])),
                'x': round(float(r['dios_media']), 3), 'v': round(float(r['relig_muy_importante']), 2)})
pts.sort(key=lambda p: p['k'])
assert len(pts) == 91 and len({p['k'] for p in pts}) == 91, len(pts)

ref = [(float(r['dios_media']), float(r['relig_muy_importante'])) for r in filas if r['region'] != 'Latin America']
mx = sum(a for a, _ in ref) / len(ref); my = sum(b for _, b in ref) / len(ref)
b = sum((a - mx) * (c - my) for a, c in ref) / sum((a - mx) ** 2 for a, _ in ref); a0 = my - b * mx
err = max(abs(a0 + b * float(r['dios_media']) - float(r['esperado'])) for r in filas)
assert err < 1e-6, err

js = ('// Importancia de Dios en la propia vida (promedio 1 a 10) y % para quienes la religión es muy importante en su\n'
      '// vida, IVS ola 7 (EVS 2017-2021 + WVS 2017-2023), 91 países. k = ISO3, r = región del Atlas, y = año de la\n'
      '// encuesta, x = importancia de Dios, v = la religión es muy importante (%).\n'
      '// Generado por data-sources/build_dios_religion.py: no editar a mano.\n'
      'const REL_DIOSREL = ' + json.dumps({'pts': pts}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(pts), 'países; ajuste sin AL: a =', round(a0, 3), 'b =', round(b, 3))
