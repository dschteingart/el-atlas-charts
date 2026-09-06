# -*- coding: utf-8 -*-
"""Recupera lugar de nacimiento (pais y region) de las figuras que no lo tienen.

Dos vias, ninguna inventa el dato:
  1. Las que tienen coordenada en el archivo Pantheon pero no pais: point-in-polygon
     contra la geometria de paises del N3 (talento/out/country.geo.json).
  2. Las que no tienen ni coordenada: se consulta Wikidata por el wd_id (P19 lugar de
     nacimiento -> P625 coordenada y P17 pais), y con la coordenada se repite el paso 1.

Salida: lugares_recuperados.csv (id, name, fuente, iso3, iso3_geometria, pais, region).
Lo consumen export_dataset.py (columnas pais/region) y corregido.py (iso3 del master,
que es por donde agrupan los graficos).

El CSV se ACUMULA, no se sobreescribe: export_dataset.py completa el dataset con este
archivo, asi que en la corrida siguiente esas figuras ya no figuran como faltantes. Si
se sobreescribiera, se perderian. Correrlo de nuevo solo agrega lo que falte.

Uso: python recuperar_lugar.py [TOP] [WORKERS]
       TOP     hasta que puesto mirar. 0 = toda la base depurada. Default 1000.
       WORKERS hilos contra la API de Wikidata. Default 8.
"""
import json, io, os, sys, ssl, time, warnings, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import pandas as pd
warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
BASE = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas'
GEO = os.path.join(BASE, 'insumos', '#3 - Futbol', 'talento', 'out', 'country.geo.json')
N1 = os.path.join(BASE, 'el-atlas-charts', '01-bienestar-violencia', 'data-scatter.js')
TOP = int(sys.argv[1]) if len(sys.argv) > 1 else 1000   # 0 = toda la base depurada
WORKERS = int(sys.argv[2]) if len(sys.argv) > 2 else 8

# ---------- geometria de paises ----------
G = json.load(io.open(GEO, encoding='utf-8'))
polys = []
for f in G['features']:
    iso = f['properties']['iso']
    g = f['geometry']
    parts = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for p in parts:
        xs = [c[0] for c in p[0]]
        ys = [c[1] for c in p[0]]
        polys.append((iso, (min(xs), min(ys), max(xs), max(ys)), p))
print('geometria: %d paises, %d poligonos' % (len({p[0] for p in polys}), len(polys)))


def dentro(ring, x, y):
    n = len(ring)
    j = n - 1
    c = False
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            c = not c
        j = i
    return c


def iso_de(lon, lat):
    for iso, (x0, y0, x1, y1), rings in polys:
        if not (x0 <= lon <= x1 and y0 <= lat <= y1):
            continue
        if not dentro(rings[0], lon, lat):
            continue
        if any(dentro(h, lon, lat) for h in rings[1:]):
            continue
        return iso
    return None


# ---------- iso3 -> region (taxonomia El Atlas, igual que export_dataset) ----------
_s = io.open(N1, encoding='utf-8').read()
_s = _s[_s.index('['):]
_d = 0
for _i, _c in enumerate(_s):
    if _c == '[':
        _d += 1
    elif _c == ']':
        _d -= 1
        if _d == 0:
            _end = _i + 1
            break
iso2region = {x['iso3']: x['region'] for x in json.loads(_s[:_end])}
ROV = {'PRI': 'Latin America', 'CUB': 'Latin America', 'TWN': 'East Asia', 'HKG': 'East Asia',
       'MAC': 'East Asia', 'PSE': 'Middle East & North Africa', 'PRK': 'East Asia',
       'VEN': 'Latin America', 'GUF': 'Latin America', 'MMR': 'Southeast Asia',
       'YEM': 'Middle East & North Africa', 'COD': 'Sub-Saharan Africa', 'ERI': 'Sub-Saharan Africa',
       'MCO': 'Western Europe', 'XKX': 'Eastern Europe & Central Asia', 'GRL': 'Western Europe',
       'BMU': 'Caribbean', 'GLP': 'Caribbean', 'MTQ': 'Caribbean'}
REG_ES = {'Latin America': 'America Latina', 'Caribbean': 'Caribe',
          'North America, Australia & New Zealand': 'Norteamerica/Aus/NZ',
          'Western Europe': 'Europa Occidental',
          'Eastern Europe & Central Asia': 'Europa del Este/Asia Central',
          'East Asia': 'Asia Oriental', 'Southeast Asia': 'Sudeste Asiatico',
          'South Asia': 'Asia del Sur', 'Middle East & North Africa': 'Medio Oriente/N. Africa',
          'Sub-Saharan Africa': 'Africa Subsahariana'}


def region_de(iso):
    r = iso2region.get(iso) or ROV.get(iso)
    return REG_ES.get(r) if r else None


# Pantheon geocodifica todo el Levante como Israel: Jesus, Maria e Isaac salen asi,
# con coordenadas de Jerusalen. Nuestra geometria tiene poligono de Palestina y parte
# la zona en dos, con lo que David (Belen) caeria en Palestina y Jesus, a 8 km, en
# Israel. Alineamos con la convencion de la fuente para no partir el mismo pueblo en
# dos paises. Queda la columna iso3_geometria con lo que decia el poligono.
# OJO: si se corre sobre figuras contemporaneas, revisar este alineamiento.
ALINEAR = {'PSE': 'ISR'}


def nombres_de_pais():
    """iso3 -> nombre de pais tal como lo escribe la base, para no introducir
    variantes ('UK' vs 'United Kingdom'). Se deriva de los propios datos."""
    pe = pd.read_csv(os.path.join(DIR, 'persons_enriched.csv'), low_memory=False)[['id', 'iso3']]
    raw = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False,
                      usecols=['id', 'bplace_country']).drop_duplicates('id')
    j = pe.merge(raw, on='id').dropna(subset=['iso3', 'bplace_country'])
    return j.groupby('iso3').bplace_country.agg(lambda s: s.value_counts().index[0]).to_dict()


# ---------- Wikidata ----------
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'ElAtlas-research/1.0 (dschteingart@gmail.com)'}
_wd = {}
_lock = threading.Lock()


def entidad(qid):
    with _lock:
        if qid in _wd:
            return _wd[qid]
    url = 'https://www.wikidata.org/wiki/Special:EntityData/%s.json' % qid
    for intento in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            j = json.load(urllib.request.urlopen(req, context=ctx, timeout=45))
            with _lock:
                _wd[qid] = j['entities'][qid]
            return _wd[qid]
        except Exception:
            time.sleep(1.5 + intento * 2)
    with _lock:
        _wd[qid] = None
    return None


def claim(e, prop):
    try:
        for c in e['claims'][prop]:
            v = c['mainsnak'].get('datavalue')
            if v:
                return v['value']
    except (KeyError, TypeError):
        pass
    return None


def buscar_qid(nombre):
    """El archivo Pantheon trae algun wd_id que ya no existe (p.ej. Henry V de
    Inglaterra sale como Q56178382, que no resuelve). Buscamos por nombre y nos
    quedamos con el primer resultado que tenga lugar de nacimiento."""
    url = ('https://www.wikidata.org/w/api.php?action=wbsearchentities&search=%s'
           '&language=en&limit=5&format=json' % urllib.parse.quote(nombre))
    try:
        req = urllib.request.Request(url, headers=UA)
        j = json.load(urllib.request.urlopen(req, context=ctx, timeout=45))
    except Exception:
        return None
    for r in j.get('search', []):
        e = entidad(r['id'])
        if e and isinstance(claim(e, 'P19'), dict):
            return r['id']
    return None


def etiqueta(e):
    L = e.get('labels', {})
    return (L.get('es') or L.get('en') or {}).get('value')


def iso_de_entidad(e):
    """ISO3 de una entidad pais; si es una entidad historica, la del pais actual."""
    if not e:
        return None
    v = claim(e, 'P298')
    if isinstance(v, str):
        return v
    p17 = claim(e, 'P17')                       # Antiguo Egipto -> Egipto
    if isinstance(p17, dict) and 'id' in p17:
        v = claim(entidad(p17['id']), 'P298')
        if isinstance(v, str):
            return v
    return None


# Entidades historicas que Wikidata devuelve como lugar de nacimiento pero que no
# tienen coordenada, ni pais, ni jerarquia administrativa: la cadena muere ahi.
# Mapeo manual y explicito, para que quede auditable en vez de perderse el dato.
HISTORICO = {
    'Q269678': ('Medio Oriente/N. Africa', 'Antiguo Oriente Proximo'),
    'Q3875016': ('Asia Oriental', 'Khamag Mongol, en la actual Mongolia'),
}


def resolver(qid, nombre):
    """Devuelve (lugar, lon, lat, iso3, region_directa, fuente). Cadena de intentos:
       1. P19 -> coordenada del lugar
       2. P19 -> pais del lugar
       3. P19 -> entidad administrativa que lo contiene (recursivo)
       4. P27 del personaje (ciudadania) -> pais, incluso historico
       5. tabla HISTORICO
    """
    e = entidad(qid)
    if not e:
        alt = buscar_qid(nombre)
        if alt:
            e = entidad(alt)
    if not e:
        return None, None, None, None, None, 'wd_id inexistente'

    p19 = claim(e, 'P19')
    if isinstance(p19, dict) and 'id' in p19:
        lugar_qid = p19['id']
        vistos = set()
        actual = lugar_qid
        nombre_lugar = None
        while actual and actual not in vistos:
            vistos.add(actual)
            L = entidad(actual)
            if not L:
                break
            if nombre_lugar is None:
                nombre_lugar = etiqueta(L)
            # P17 ANTES que la coordenada: lo que Wikidata afirma sobre el pais del
            # lugar le gana a nuestro point-in-polygon, que en la frontera se
            # equivoca (El Carmelo, cuna de Richard Carapaz, cae del lado
            # colombiano por unos metros y lo volvia colombiano en vez de ecuatoriano).
            p17 = claim(L, 'P17')
            if isinstance(p17, dict) and 'id' in p17:
                iso = iso_de_entidad(entidad(p17['id']))
                if iso:
                    return nombre_lugar, None, None, iso, None, 'pais del lugar (Wikidata)'
            c = claim(L, 'P625')
            if isinstance(c, dict):
                return nombre_lugar, c.get('longitude'), c.get('latitude'), None, None, 'coordenada Wikidata'
            if actual in HISTORICO:
                reg, nota = HISTORICO[actual]
                return nombre_lugar or nota, None, None, None, reg, 'entidad historica (mapeo manual)'
            p131 = claim(L, 'P131')
            actual = p131['id'] if isinstance(p131, dict) and 'id' in p131 else None
        # el lugar existe pero la cadena murio: seguimos con ciudadania
    p27 = claim(e, 'P27')
    if isinstance(p27, dict) and 'id' in p27:
        pe = entidad(p27['id'])
        iso = iso_de_entidad(pe)
        if iso:
            return etiqueta(pe), None, None, iso, None, 'ciudadania (Wikidata)'
    return None, None, None, None, None, 'sin dato en Wikidata'


# ---------- que figuras arreglar ----------
C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()].sort_values('rank_score')
top = d if TOP <= 0 else d.head(TOP)

R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False)
R = R.drop_duplicates('id').set_index('id')

# Quien no tiene lugar SEGUN LA FUENTE, no segun el dataset. Es importante: como
# export_dataset.py completa pais/region con este mismo CSV, mirar el dataset haria
# que las ya recuperadas dejaran de figurar como faltantes, y al invalidar una fila
# para reprocesarla se perderia en vez de rehacerse.
_sin_lugar = set(R.index[R.bplace_country.isna()])
faltan = top[top.id.isin(_sin_lugar)]
print('universo: %s | %d figuras sin lugar en la fuente' % (('toda la base' if TOP <= 0 else 'top %d' % TOP), len(faltan)))
NOMBRE_PAIS = nombres_de_pais()
print('nombres de pais derivados de la base: %d iso3' % len(NOMBRE_PAIS))

# Lo ya resuelto en corridas anteriores. IMPORTANTE: el script se lee a si mismo de
# rebote — export_dataset.py completa pais/region con este CSV, asi que en la corrida
# siguiente esas figuras ya no aparecen como faltantes. Si sobreescribieramos, se
# perderian. Por eso se acumula: lo viejo se conserva y solo se procesa lo nuevo.
SALIDA = os.path.join(DIR, 'lugares_recuperados.csv')
ya = pd.read_csv(SALIDA, encoding='utf-8-sig') if os.path.exists(SALIDA) else pd.DataFrame()
# Se dan por cerradas las que tienen region y las que Wikidata contesto que no sabe
# (la entidad resolvio, simplemente no tiene P19 ni P27: reintentar no cambia nada).
# Las demas —wd_id que no resolvio, red caida— pueden ser fallos transitorios, asi
# que se reintentan en cada corrida.
DEFINITIVAS = {'sin dato en Wikidata'}
if len(ya):
    cerrada = ya.region.notna() | ya.fuente.isin(DEFINITIVAS)
    print('cerradas: %d (con region %d, sin dato confirmado %d) | se reintentan %d'
          % (int(cerrada.sum()), int(ya.region.notna().sum()),
             int(ya.fuente.isin(DEFINITIVAS).sum()), int((~cerrada).sum())))
    ya = ya[cerrada]
resueltos = set(ya.id) if len(ya) else set()
pendientes = faltan[~faltan.id.isin(resueltos)]
print('ya resueltas en corridas anteriores: %d | a procesar ahora: %d' % (len(resueltos), len(pendientes)))


def procesar(x):
    r = R.loc[x['id']] if x['id'] in R.index else None
    lon = lat = None
    fuente = None
    lugar = None
    iso = None
    region = None
    if r is not None and pd.notna(r.get('bplace_lat')):
        lon = float(r.bplace_lon)
        lat = float(r.bplace_lat)
        lugar = r.get('bplace_name')
        fuente = 'coordenada Pantheon'
    else:
        qid = r.get('wd_id') if r is not None else None
        if isinstance(qid, str) and qid.startswith('Q'):
            lugar, lon, lat, iso, region, fuente = resolver(qid, str(x['name']))
    if iso is None and region is None and lon is not None:
        iso = iso_de(lon, lat)
        if iso is None:
            fuente = (fuente or '') + ' (sin pais)'
    iso_geo = iso
    if iso in ALINEAR:
        iso = ALINEAR[iso]
        fuente = (fuente or '') + ' + alineado a Pantheon'
    return {'id': x['id'], 'name': x['name'], 'rank': int(x['rank_score']),
            'ocupacion': x['occupation'], 'lugar': lugar, 'lon': lon, 'lat': lat,
            'fuente': fuente, 'iso3': iso, 'iso3_geometria': iso_geo,
            'pais': NOMBRE_PAIS.get(iso),
            'region': region if region else (region_de(iso) if iso else None)}


filas = []
if len(pendientes):
    tareas = pendientes.to_dict('records')
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(procesar, t): t for t in tareas}
        for i, fut in enumerate(as_completed(futs), 1):
            try:
                filas.append(fut.result())
            except Exception as e:
                t = futs[fut]
                print('  error en %s: %s' % (t['name'], e))
            if i % 200 == 0 or i == len(tareas):
                hechas = sum(1 for f in filas if f['region'])
                vel = i / max(time.time() - t0, 1e-9)
                falta_seg = (len(tareas) - i) / max(vel, 1e-9)
                print('  %d/%d  (%d con region)  %.1f/s  faltan ~%d min'
                      % (i, len(tareas), hechas, vel, falta_seg / 60), flush=True)

out = pd.concat([ya, pd.DataFrame(filas)], ignore_index=True) if len(filas) else ya
out = out.drop_duplicates('id').sort_values('rank')
out.to_csv(SALIDA, index=False, encoding='utf-8-sig')

print()
ok = int(out.region.notna().sum())
print('=== TOTAL ACUMULADO ===')
print('  filas en el CSV      : %d' % len(out))
print('  con region           : %d (%.1f%%)' % (ok, ok / max(len(out), 1) * 100))
print('  con pais             : %d' % int(out.pais.notna().sum()))
print('  sin dato             : %d' % (len(out) - ok))
if len(out):
    print()
    print('  por fuente:')
    print(out.fuente.fillna('(sin dato)').value_counts().head(10).to_string())
    print()
    print('  regiones recuperadas:')
    print(out.region.value_counts().to_string())
print('=> lugares_recuperados.csv')
