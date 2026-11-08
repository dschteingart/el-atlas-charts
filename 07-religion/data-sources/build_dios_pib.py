# -*- coding: utf-8 -*-
"""data-dios-pib.js: importancia de Dios contra PIB per cápita, IVS ola 7 (chart-dios-pib).

Lee el CSV agregado que arma la cocina del N°7
(insumos/#7 - Religion/graficos_preliminares/scripts/10_graficos.py, función scatter_pib → g05a_dios_vs_pib.csv).
Ese CSV ya trae solo agregados por país (promedio de la escala 1 a 10 y PIB del año de la encuesta); los microdatos no
salen de la cocina.

Campos por país: k (ISO3), r (región del Atlas, lib/regions.js), y (año de la encuesta), x (PIB per cápita PPA, dólares
de 2021), v (importancia de Dios, promedio 1 a 10), n (encuestados con respuesta).
La línea punteada (ajuste entre los países no latinoamericanos) se recalcula en el navegador, igual que el scatter del N°4,
para que apagar regiones en la leyenda la recalcule. Acá se verifica que la cuenta coincida con la de la cocina.

Uso:  python build_dios_pib.py [ruta/al/g05a_dios_vs_pib.csv]
Salida: ../data-dios-pib.js (al lado de chart-dios-pib.html). Subir el ?v= del archivo en el HTML.
"""
import csv, json, math, os, sys

DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos\g05a_dios_vs_pib.csv')
SRC = sys.argv[1] if len(sys.argv) > 1 else CSV_DEF
OUT = os.path.join(DIR, '..', 'data-dios-pib.js')

with open(SRC, encoding='utf-8-sig', newline='') as f:
    filas = list(csv.DictReader(f))

pts = []
for r in filas:
    pts.append({'k': r['iso3'], 'r': r['region'], 'y': int(float(r['year'])),
                'x': round(float(r['gdppc_ppp2021']), 1), 'v': round(float(r['dios_media']), 3),
                'n': int(float(r['n_dios_media']))})
pts.sort(key=lambda p: p['k'])
assert len(pts) == 91 and len({p['k'] for p in pts}) == 91, len(pts)

# verificación: OLS de v sobre log(x) entre los no latinoamericanos = columna 'esperado' de la cocina
ref = [(math.log(float(r['gdppc_ppp2021'])), float(r['dios_media'])) for r in filas if r['region'] != 'Latin America']
mx = sum(a for a, _ in ref) / len(ref); my = sum(b for _, b in ref) / len(ref)
b = sum((a - mx) * (c - my) for a, c in ref) / sum((a - mx) ** 2 for a, _ in ref); a0 = my - b * mx
err = max(abs(a0 + b * math.log(float(r['gdppc_ppp2021'])) - float(r['esperado'])) for r in filas)
assert err < 1e-6, err

js = ('// Importancia de Dios en la propia vida (promedio 1 a 10) y PIB per cápita PPA (dólares de 2021) del año de la\n'
      '// encuesta, IVS ola 7 (EVS 2017-2021 + WVS 2017-2023), 91 países. k = ISO3, r = región del Atlas, y = año de la\n'
      '// encuesta, x = PIB per cápita, v = importancia de Dios, n = encuestados con respuesta.\n'
      '// Generado por data-sources/build_dios_pib.py: no editar a mano.\n'
      'const REL_DIOSPIB = ' + json.dumps({'pts': pts}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(pts), 'países; ajuste sin AL: a =', round(a0, 4), 'b =', round(b, 4))
