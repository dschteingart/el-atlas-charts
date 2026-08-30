# -*- coding: utf-8 -*-
"""Recupera lugar de nacimiento (pais y region) de las figuras que no lo tienen.

Dos vias, ninguna inventa el dato:
  1. Las que tienen coordenada en el archivo Pantheon pero no pais: point-in-polygon
     contra la geometria de paises del N3 (talento/out/country.geo.json).
  2. Las que no tienen ni coordenada: se consulta Wikidata por el wd_id (P19 lugar de
     nacimiento -> P625 coordenada y P17 pais), y con la coordenada se repite el paso 1.

Salida: lugares_recuperados.csv (id, name, fuente, iso3, pais, region).

Uso: python recuperar_lugar.py [TOP]     (TOP = hasta que puesto mirar, default 1000)
"""
import json, io, os, sys, ssl, time, warnings, urllib.request, urllib.parse
import pandas as pd
warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
BASE = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas'
GEO = os.path.join(BASE, 'insumos', '#3 - Futbol', 'talento', 'out', 'country.geo.json')
N1 = os.path.join(BASE, 'el-atlas-charts', '01-bienestar-violencia', 'data-scatter.js')
TOP = int(sys.argv[1]) if len(sys.argv) > 1 else 1000

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


def entidad(qid):
    if qid in _wd:
        return _wd[qid]
    url = 'https://www.wikidata.org/wiki/Special:EntityData/%s.json' % qid
    for intento in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            j = json.load(urllib.request.urlopen(req, context=ctx, timeout=45))
            _wd[qid] = j['entities'][qid]
            return _wd[qid]
        except Exception:
            time.sleep(1.5 + intento * 2)
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
            c = claim(L, 'P625')
            if isinstance(c, dict):
                return nombre_lugar, c.get('longitude'), c.get('latitude'), None, None, 'coordenada Wikidata'
            p17 = claim(L, 'P17')
            if isinstance(p17, dict) and 'id' in p17:
                iso = iso_de_entidad(entidad(p17['id']))
                if iso:
                    return nombre_lugar, None, None, iso, None, 'pais del lugar (Wikidata)'
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
top = d.head(TOP)
faltan = top[top.pais.isna()]
print('top %d: %d figuras sin lugar de nacimiento' % (TOP, len(faltan)))
print('(en toda la base depurada son %d de %d)' % (int(d.pais.isna().sum()), len(d)))

R = pd.read_csv(os.path.join(DIR, 'person_2025_update.csv'), low_memory=False)
R = R.drop_duplicates('id').set_index('id')
NOMBRE_PAIS = nombres_de_pais()
print('nombres de pais derivados de la base: %d iso3' % len(NOMBRE_PAIS))

filas = []
for _, x in faltan.iterrows():
    r = R.loc[x.id] if x.id in R.index else None
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
    filas.append({'id': x.id, 'name': x['name'], 'rank': int(x.rank_score),
                  'ocupacion': x.occupation, 'lugar': lugar, 'lon': lon, 'lat': lat,
                  'fuente': fuente, 'iso3': iso, 'iso3_geometria': iso_geo,
                  'pais': NOMBRE_PAIS.get(iso),
                  'region': region if region else (region_de(iso) if iso else None)})

out = pd.DataFrame(filas).sort_values('rank')
print()
print('%-5s %-24s %-24s %-13s %-13s %s' % ('#', 'figura', 'lugar', 'pais', 'geometria', 'region'))
for _, x in out.iterrows():
    geo = x.iso3_geometria if x.iso3_geometria and x.iso3_geometria != x.iso3 else ''
    print('%-5d %-24s %-24s %-13s %-13s %s' % (x['rank'], str(x['name'])[:24], str(x.lugar)[:24],
                                               str(x.pais or '-')[:13], geo or '=', x.region or '-'))
print()
ok = int(out.region.notna().sum())
print('RECUPERADOS: %d de %d  (%d quedan sin dato)' % (ok, len(out), len(out) - ok))
out.to_csv(os.path.join(DIR, 'lugares_recuperados.csv'), index=False, encoding='utf-8-sig')
print('=> lugares_recuperados.csv')
