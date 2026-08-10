# -*- coding: utf-8 -*-
"""
Genera data-perfil.js: la tabla resumen del N°4 — cinco indicadores por region y
por pais, para leer el "perfil" de cada region de un vistazo.

POR QUE ESTE ARCHIVO EXISTE
---------------------------
Los cinco indicadores viven en cuatro fuentes distintas y en tres formatos
distintos (CR_FOTO por ola, VD_SERIES comprimida por anio, el scatter del N°2).
Unirlos en el navegador seria pedirle a la pagina que cargue tres datasets
enteros —varios megas— para mostrar 45 numeros. Aca se resuelve una vez.

DECISIONES QUE ESTAN ACA Y NO EN EL RENDERER
--------------------------------------------
1. OLAS 6 Y 7 JUNTAS, ultimo dato de cada pais, en los dos indicadores de la
   IVS. Con la ola 7 sola, Africa Subsahariana son 4 paises y Medio Oriente 8;
   sumando la 6 pasan a 7 y 13. Medido: el rechazo racial se mueve +1,3 en
   Africa y +1,7 en Medio Oriente y NADA en las otras siete regiones, pero "ve
   racismo en el barrio" en Africa baja de 28,1 a 22,4 — o sea que el valor mas
   extremo de esa columna era el que se apoyaba en menos paises. El costo es que
   algunas celdas mezclan campo de 2010-2016 con 2017-2023, y por eso cada celda
   lleva su rango de anios.
2. SIN CARIBE (decision de Daniel 2026-07-31): no tiene un solo pais en la IVS,
   asi que su fila quedaria vacia en dos de las cinco columnas.
3. El GINI del N°2 viene con la taxonomia del Banco Mundial (7 regiones) y acá
   se re-agrega pais por pais con la del Atlas (10), que es la del numero.
4. PROMEDIO SIMPLE entre los paises con dato, no ponderado por poblacion: la
   unidad de analisis del numero es el pais, como en todos los demas graficos.
5. Cada celda guarda n y el rango de anios. No es decoracion: Africa son 7
   paises de 49 en las columnas de la IVS y 49 de 49 en V-Dem, y sin el n la
   fila invita a una comparacion horizontal que los datos no sostienen.

Lo que NO esta aca: la clasificacion en bajo/medio-bajo/medio/medio-alto/alto.
Es un percentil entre las filas que se estan mostrando, asi que depende de si el
lector mira regiones o paises y se calcula en el renderer.
"""
import io, json, os, re, sys
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')
AQUI = os.path.dirname(os.path.abspath(__file__))
N4 = os.path.dirname(AQUI)
RAIZ = os.path.dirname(N4)

def bloque(ruta, patron):
    """Extrae el literal JS que sigue a `patron` (objeto o array) y lo parsea."""
    t = io.open(ruta, encoding='utf-8').read()
    m = re.search(patron, t, re.M)
    if not m: raise SystemExit('no encontre %s en %s' % (patron, ruta))
    j = m.end(); d = 0; k = j
    while k < len(t):
        if t[k] in '{[': d += 1
        elif t[k] in '}]':
            d -= 1
            if d == 0: k += 1; break
        k += 1
    return json.loads(t[j:k])

P = lambda *a: os.path.join(N4, *a)
CR_REGION = bloque(P('data-cruces.js'), r'^const CR_REGION\s*=\s*')
CR_FOTO   = bloque(P('data-cruces.js'), r'^const CR_FOTO\s*=\s*')
VD_REGION = bloque(P('data-vdem.js'),   r'^const VD_REGION\s*=\s*')
VD_NAMES  = bloque(P('data-vdem.js'),   r'^const VD_NAMES\s*=\s*')
VD_EXCL   = bloque(P('data-vdem-v2xpe_exlsocgr.js'), r'VD_SERIES\["v2xpe_exlsocgr"\]\s*=\s*')
_sc = io.open(os.path.join(RAIZ, '02-demasiado-desiguales', 'data-scatter.js'), encoding='utf-8').read()
SCATTER = json.loads(_sc[_sc.index('{'):_sc.rindex('}') + 1])

REGIONES = ['Latin America', 'North America, Australia & New Zealand', 'Western Europe',
            'Eastern Europe & Central Asia', 'East Asia', 'Southeast Asia', 'South Asia',
            'Middle East & North Africa', 'Sub-Saharan Africa']

def region_de(iso):
    return VD_REGION.get(iso) or CR_REGION.get(iso)

# ---------------------------------------------------------------- indicadores
def ivs(clave, olas=(6, 7)):
    """Ultimo dato de cada pais entre las olas pedidas: la 7 pisa a la 6."""
    out = {}
    for w in olas:
        for f in CR_FOTO.get(clave, {}).get(str(w), []):
            out[f[0]] = (f[1], f[2])          # iso -> (valor, anio de campo)
    return out

def vdem(anio=2023):
    out = {}
    for iso, serie in VD_EXCL.items():
        y0, vals = serie[0], serie[1]
        i = anio - y0
        if 0 <= i < len(vals) and vals[i] is not None:
            out[iso] = (vals[i] / 1000.0, anio)   # el generador de V-Dem guarda x1000
    return out

def gini():
    ult = SCATTER['data_by_year'][sorted(SCATTER['data_by_year'])[-1]]['points']
    return {p['code']: (p['gini_adj'], p['year']) for p in ult if p.get('gini_adj') is not None}

# k, etiqueta es/en, decimales, unidad, y si "alto" es peor (para la rampa)
# EL ORDEN ES EL DEL ARGUMENTO DEL NÚMERO, no el de las fuentes: lo que se
# declara, lo que se ve alrededor, lo que se vive en carne propia, lo que hace
# el Estado y, por último, la desigualdad de fondo. Cada columna es una lente.
COLS = [
    ('raza',   'Rechaza un vecino de otra raza', 'Would reject a neighbour of another race', 1, '%', True, ivs('otra_raza')),
    ('barrio', 'Ve racismo en su barrio',    'Sees racism in their area', 1, '%', True,  ivs('H002_04')),
    ('piel',   'Sufrió discriminación por su color de piel', 'Has faced discrimination over skin colour', 1, '%', True, ivs('wrp_piel', (7,))),
    ('excl',   'Exclusión institucional', 'Institutional exclusion', 2, '',  True,  vdem()),
    ('gini',   'Desigualdad de ingresos (Gini)', 'Income inequality (Gini)', 1, '', True, gini()),
]

# ------------------------------------------------------------------ agregacion
# Canonizacion de codigos ANTES de agrupar: las fuentes usan convenciones
# distintas para el mismo pais (la familia IVS/EVS trae Kosovo como XKS; la de
# V-Dem/Banco Mundial como XKX). Sin este alias, Kosovo quedaba PARTIDO en dos
# filas de PF_PAIS —una solo con 'piel', otra solo con 'excl'— y la tabla lo
# listaba dos veces (bug de la auditoria del N°4, 2026-08-09; misma clase que
# Argelia ALG+DZA en altura/edad del N°3).
ISO_ALIAS = {'XKS': 'XKX'}
regiones, paises = {}, {}
for k, es, en, dec, uni, peor, datos in COLS:
    porreg = defaultdict(list)
    for iso, (v, y) in datos.items():
        iso = ISO_ALIAS.get(iso, iso)
        r = region_de(iso)
        if r in REGIONES: porreg[r].append((v, y))
        if r in REGIONES:
            paises.setdefault(iso, {})[k] = [round(v, 4), y]
    for r in REGIONES:
        vs = porreg.get(r, [])
        if not vs: continue
        regiones.setdefault(r, {})[k] = [round(sum(x[0] for x in vs) / len(vs), 4),
                                         len(vs), min(x[1] for x in vs), max(x[1] for x in vs)]

# cuantos paises tiene cada region EN TOTAL (para poder decir "7 de 49")
total_reg = defaultdict(int)
for iso, r in VD_REGION.items():
    if r in REGIONES: total_reg[r] += 1

meta = {'cols': [{'k': k, 'es': es, 'en': en, 'dec': dec, 'uni': uni, 'peorEsMas': peor} for k, es, en, dec, uni, peor, _ in COLS],
        'regiones': REGIONES, 'totalReg': dict(total_reg)}
nombres = {iso: VD_NAMES.get(iso, iso) for iso in paises}
regdepais = {iso: region_de(iso) for iso in paises}

sal = P('data-perfil.js')
with io.open(sal, 'w', encoding='utf-8') as f:
    f.write('// Tabla resumen del N°4 — GENERADO por tools/make_perfil.py, no editar a mano.\n')
    f.write('// PF_REG[region][col]  = [valor, n, anioMin, anioMax]\n')
    f.write('// PF_PAIS[iso][col]    = [valor, anio]\n')
    f.write('// Las dos columnas de la IVS toman el ULTIMO dato de cada pais entre las olas\n')
    f.write('// 6 y 7, para no dejar a Africa con cuatro paises y a Medio Oriente con ocho.\n')
    f.write('const PF_META = %s;\n' % json.dumps(meta, ensure_ascii=False))
    f.write('const PF_REG = %s;\n' % json.dumps(regiones, ensure_ascii=False))
    f.write('const PF_PAIS = %s;\n' % json.dumps(paises, ensure_ascii=False))
    f.write('const PF_NOMBRE = %s;\n' % json.dumps(nombres, ensure_ascii=False))
    f.write('const PF_REGION_DE = %s;\n' % json.dumps(regdepais, ensure_ascii=False))

print('escrito %s (%.1f KB)' % (sal, os.path.getsize(sal) / 1024))
print('%-32s %s' % ('región', ' '.join('%12s' % c['k'] for c in meta['cols'])))
for r in REGIONES:
    fila = regiones.get(r, {})
    print('%-32s' % r[:31], ' '.join('%12s' % (('%.2f/n%d' % (fila[c['k']][0], fila[c['k']][1])) if c['k'] in fila else '—') for c in meta['cols']))
print('\npaíses con al menos un indicador:', len(paises))
