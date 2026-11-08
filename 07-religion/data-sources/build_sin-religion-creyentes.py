# -*- coding: utf-8 -*-
"""data-sin-religion-creyentes.js: creencia en Dios entre quienes no tienen religión (chart-sin-religion-creyentes).

Lee los CSV agregados de la cocina del N°7 (insumos/#7 - Religion/graficos_preliminares/datos/):
  - ivs_sin_religion_creencias.csv (scripts/06_sin_religion.py): por país, % que cree en Dios (F050 = 1, ponderado)
    entre quienes no pertenecen a ninguna denominación (F025 = 0), en la última encuesta del país desde la ola 6.
    Si el país tiene EVS y WVS en esa ola, la WVS. El CSV trae los países con al menos 80 casos sin religión.
  - g12_sin_religion_creyentes.csv (scripts/10_graficos.py, g12_sin_religion_creyentes): los 26 países del PNG
    aprobado. Es la selección de fábrica del interactivo.
  - ivs_pais_ola.csv (scripts/02_ivs_indicadores.py): año de campo y encuesta (EVS o WVS) de cada país y ola. Usa la
    misma regla que 06_sin_religion (con EVS y WVS en la misma ola queda la WVS; la EVS va al archivo de duplicados).
Son agregados (un porcentaje y un conteo por país); los microdatos no salen de la cocina.

Universo del buscador = la misma medida que g12, con sus mismas reglas:
  - al menos 150 casos sin religión (el corte de g12; el CSV de 06 baja hasta 80);
  - encuesta de campo entre 2016 y 2022, la ventana del subtítulo (Haití 2016, WVS ola 6; el resto, ola 7 de la
    WVS o EVS 2017-2021). Quedan afuera Ruanda (2012) y Sudáfrica (2013), cuya última encuesta es de la ola 6.
Colombia, Ecuador y Uruguay van con asterisco: en su encuesta de 2017-2022 la pregunta de denominación se aplicó como
pertenencia a una iglesia (más "sin religión" que en Latinobarómetro), igual que en el PNG.

Uso:  python build_sin-religion-creyentes.py [carpeta/datos]
Salida: ../data-sin-religion-creyentes.js (al lado de chart-sin-religion-creyentes.html). Subir el ?v= de la carpeta.
"""
import csv, json, os, re, sys

DIR = os.path.dirname(os.path.abspath(__file__))
DAT_DEF = (r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#7 - Religion'
           r'\graficos_preliminares\datos')
DAT = sys.argv[1] if len(sys.argv) > 1 else DAT_DEF
OUT = os.path.join(DIR, '..', 'data-sin-religion-creyentes.js')
CN_JS = os.path.join(DIR, '..', '..', 'lib', 'country-names.js')
REG_JS = os.path.join(DIR, '..', '..', 'lib', 'regions.js')

N_MIN = 150              # g12: t[t.n >= 150]
Y0, Y1 = 2016, 2022      # subtítulo de g12
ASTERISCO = ['COL', 'ECU', 'URY']


def leer(nombre):
    with open(os.path.join(DAT, nombre), encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


sinrel = leer('ivs_sin_religion_creencias.csv')
g12 = leer('g12_sin_religion_creyentes.csv')
campo = {(r['iso3'], int(float(r['wave']))): r for r in leer('ivs_pais_ola.csv')}

# regiones válidas = las de lib/regions.js (el color de cada barra sale de ahí)
regiones = set(re.findall(r"^\s*'([^']+)':\s*'#", open(REG_JS, encoding='utf-8').read().split('REGION_COLORS_ON_DARK')[0], re.M))
nombres = open(CN_JS, encoding='utf-8').read()

data, descartes = {}, []
for r in sinrel:
    iso, ola, n = r['iso3'], int(r['wave']), int(r['n'])
    if not r['cree_dios']:
        descartes.append((iso, 'sin dato'))
        continue
    c = campo[(iso, ola)]
    anio = int(float(c['year']))
    if n < N_MIN:
        descartes.append((iso, 'n=%d' % n))
        continue
    if not (Y0 <= anio <= Y1):
        descartes.append((iso, 'campo %d' % anio))
        continue
    assert r['region'] in regiones, (iso, r['region'])
    assert '"%s": {' % iso in nombres, ('falta en lib/country-names.js', iso)
    data[iso] = {'r': r['region'], 'v': float(r['cree_dios']), 'n': n, 'y': anio, 's': c['study'], 'w': ola}

# la selección de fábrica es la del PNG aprobado, con los mismos valores
for r in g12:
    assert r['iso3'] in data, ('g12 fuera del universo', r['iso3'])
    assert abs(float(r['cree_dios']) - data[r['iso3']]['v']) < 1e-6, r['iso3']
    assert int(r['n']) == data[r['iso3']]['n'], r['iso3']
assert all(a in data for a in ASTERISCO)

# orden por el valor sin redondear (de mayor a menor): con el orden estable del sort de JS, los empates del dato
# redondeado (Estados Unidos y Chile, 67,2) quedan como en el PNG
orden = sorted(data, key=lambda k: -data[k]['v'])
defecto = [k for k in orden if k in {r['iso3'] for r in g12}]
for k in data:
    data[k]['v'] = round(data[k]['v'], 1)

anios = [data[k]['y'] for k in defecto]
assert (min(anios), max(anios)) == (Y0, Y1), (min(anios), max(anios))

js = ('// Creencia en Dios entre quienes no tienen religión (Integrated Values Surveys, última encuesta de cada país,\n'
      '// 2016-2022). Por país: r = región (lib/regions.js), v = % que cree en Dios, n = casos sin religión,\n'
      '// y = año de campo, s = encuesta (WVS/EVS), w = ola. orden = de mayor a menor (sin redondear).\n'
      '// def = los 26 países del PNG aprobado (selección de fábrica). ast = pregunta aplicada como pertenencia.\n'
      '// Generado por data-sources/build_sin-religion-creyentes.py: no editar a mano.\n'
      'const REL_SINREL = ' + json.dumps({'orden': orden, 'def': defecto, 'ast': ASTERISCO, 'data': data},
                                         ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print('ok', OUT, len(js), 'bytes;', len(data), 'países;', len(defecto), 'de fábrica')
print('fuera:', ', '.join('%s (%s)' % d for d in descartes))
