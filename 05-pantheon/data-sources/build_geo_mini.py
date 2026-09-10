# -*- coding: utf-8 -*-
"""Geometría LIVIANA para percap-map: desde data-country-geo.js (2MB) →
data-country-geo-mini.js, conservando id=ISO3. Simplifica (Douglas-Peucker) y
DESCARTA islas chicas (mantiene el polígono mayor de cada país + las partes
relevantes). Achica el archivo ~6-8x → mapa más rápido."""
import json, os
from shapely.geometry import shape, mapping, MultiPolygon

SRC = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\03-futbol\data-country-geo.js'
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\data-country-geo-mini.js'
TOL = 0.10          # tolerancia de simplificación en grados (~10 km)
ABS_MIN = 0.02      # área mínima ABSOLUTA de una isla para mantenerla (~250 km²);
                    # se mantiene SIEMPRE el polígono mayor del país. (Umbral
                    # absoluto: si fuera relativo al país, Argentina tiraba
                    # Tierra del Fuego/Malvinas, Canadá Terranova, etc.)
FRAC = 0.0          # (sin filtro relativo)
ND = 2              # decimales de coords

s = open(SRC, encoding='utf-8').read()
i = s.index('{'); obj = json.loads(s[i:s.rindex('}') + 1])

def rnd(c):
    if isinstance(c, (int, float)): return round(c, ND)
    return [rnd(x) for x in c]

def clean(geom_json, tol, abs_min, frac):
    g = shape(geom_json)
    polys = list(g.geoms) if g.geom_type == 'MultiPolygon' else [g]
    polys = [p for p in polys if not p.is_empty]
    if not polys: return None
    areas = [p.area for p in polys]
    amax = max(areas)
    keep = [p for p, a in zip(polys, areas) if a == amax or a >= abs_min]
    if not keep: keep = [polys[areas.index(amax)]]
    gg = keep[0] if len(keep) == 1 else MultiPolygon(keep)
    gg = gg.simplify(tol, preserve_topology=True)
    if gg.is_empty: gg = keep[0].simplify(tol, preserve_topology=True)
    m = mapping(gg)
    m = {'type': m['type'], 'coordinates': rnd(m['coordinates'])}
    return m

feats = []
parts_before = parts_after = 0
for f in obj['features']:
    g = f.get('geometry')
    if not g: continue
    parts_before += len(g['coordinates']) if g['type'] == 'MultiPolygon' else 1
    cg = clean(g, TOL, ABS_MIN, FRAC)
    if not cg: continue
    parts_after += len(cg['coordinates']) if cg['type'] == 'MultiPolygon' else 1
    feats.append({'type': 'Feature', 'id': f['id'], 'geometry': cg})

out = {'type': 'FeatureCollection', 'features': feats}
# landmask: simplificado más grueso (backdrop "sin dato")
if 'landmask' in obj:
    lm = clean(obj['landmask'], 0.2, 0.15, 0.02)
    if lm: out['landmask'] = lm

open(OUT, 'w', encoding='utf-8').write('// Geometría liviana (simplificada, islas chicas descartadas) para percap-map. id=ISO3.\nwindow.GEO_MINI=' + json.dumps(out, separators=(',', ':')) + ';\n')
print('features:', len(feats), '| partes antes:', parts_before, '-> después:', parts_after)
print('size:', round(os.path.getsize(OUT) / 1024), 'KB (era 2001 KB)')

# ============ regiones DISUELTAS (fronteras internas fundidas) ============
# Union por region desde la geometria FUENTE (detallada) y simplificacion
# DESPUES: unir los poligonos ya simplificados deja rendijas en las fronteras
# compartidas. La membresia iso->region sale del PCMAP (fuente unica).
from shapely.ops import unary_union
import math as _math

def _area_esf(ring):
    # area ESFERICA con signo (formula de turf/geojson-rewind). El criterio
    # planar (shapely orient) MIENTE en latitudes altas: forzar CW planar
    # invirtio el sentido esferico de un anillo artico de Norteamerica y
    # d3 pintaba su COMPLEMENTO (el oceano entero terracota, 2026-09-10).
    # Calibracion: los 1009 anillos exteriores de la fuente dan area > 0.
    a = 0.0
    for i in range(len(ring) - 1):
        l1, f1 = _math.radians(ring[i][0]), _math.radians(ring[i][1])
        l2, f2 = _math.radians(ring[i+1][0]), _math.radians(ring[i+1][1])
        a += (l2 - l1) * (2 + _math.sin(f1) + _math.sin(f2))
    return a / 2.0

TAU = 2 * _math.pi
def _d3_ring_area(ring):
    # Replica exacta del areaRing de d3-geo, en [0, 4pi). Es EL oraculo: lo
    # que d3 vea invertido pinta el complemento en pantalla.
    if len(ring) < 4: return 0.0
    lam0 = _math.radians(ring[0][0]); phi = _math.radians(ring[0][1]) / 2 + _math.pi / 4
    cos0, sin0 = _math.cos(phi), _math.sin(phi)
    S = 0.0
    for i in range(1, len(ring)):
        lam = _math.radians(ring[i][0]); phi = _math.radians(ring[i][1]) / 2 + _math.pi / 4
        dl = lam - lam0; sd = 1 if dl >= 0 else -1; ad = sd * dl
        c, snf = _math.cos(phi), _math.sin(phi)
        k = sin0 * snf
        u = cos0 * c + k * _math.cos(ad)
        v = k * sd * _math.sin(ad)
        S += _math.atan2(v, u)
        lam0, cos0, sin0 = lam, c, snf
    if S < 0: S += TAU
    return 2 * S

def _shoelace(ring):
    a = 0.0
    for i in range(len(ring) - 1):
        a += ring[i][0] * ring[i+1][1] - ring[i+1][0] * ring[i][1]
    return a / 2.0

def _limpia_piezas(g):
    # El redondeo a 2 decimales puede COLAPSAR una astilla del buffer en un
    # anillo degenerado (4 puntos identicos): d3 lo lee como la esfera entera
    # (area 4pi) y pinta el oceano del color de la region (bug del 2026-09-10,
    # pieza fantasma en -81,25). Se tiran las piezas sin area real; si una
    # pieza GRANDE quedara invertida segun d3, se da vuelta.
    def ok(cs):
        ext = cs[0]
        if len(set(map(tuple, ext))) < 4: return None
        if abs(_shoelace(ext)) < 1e-4: return None
        if _d3_ring_area(ext) > TAU:
            cs = [r[::-1] for r in cs]
            if _d3_ring_area(cs[0]) > TAU: return None
        return cs
    if g['type'] == 'Polygon':
        cs = ok(g['coordinates'])
        return {'type': 'Polygon', 'coordinates': cs} if cs else None
    piezas = [ok(cs) for cs in g['coordinates']]
    piezas = [cs for cs in piezas if cs]
    if not piezas: return None
    return {'type': 'MultiPolygon', 'coordinates': piezas}

def _rewind_coords(g):
    # exterior: area esferica > 0; agujeros: < 0 (como los paises fuente).
    def poly(cs):
        out = []
        for k, ring in enumerate(cs):
            a = _area_esf(ring)
            if (k == 0 and a < 0) or (k > 0 and a > 0): ring = ring[::-1]
            out.append(ring)
        return out
    if g['type'] == 'Polygon':
        g['coordinates'] = poly(g['coordinates'])
    elif g['type'] == 'MultiPolygon':
        g['coordinates'] = [poly(cs) for cs in g['coordinates']]
    return g

PCMAP = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\data-percap-map.js'
OUT_R = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\data-geo-regions.js'
pm = open(PCMAP, encoding='utf-8').read()
PM = json.loads(pm.split('window.PCMAP=', 1)[1].rstrip().rstrip(';'))
iso2reg = {m['iso']: m['reg'] for m in PM['isoMeta'] if m.get('reg')}

por_region = {}
for f in obj['features']:
    reg = iso2reg.get(f['id'])
    if not reg: continue
    g = shape(f['geometry']).buffer(0)
    por_region.setdefault(reg, []).append(g)

feats = []
for reg, gs in por_region.items():
    u = unary_union(gs).buffer(0.02).buffer(-0.02)   # micro-cierre de rendijas
    u = u.simplify(TOL, preserve_topology=True)
    m = json.loads(json.dumps(mapping(u)))   # a listas mutables
    m = _rewind_coords(m)
    m = {'type': m['type'], 'coordinates': rnd(m['coordinates'])}
    m = _limpia_piezas(m)   # DESPUES del redondeo, que es quien degenera
    assert m, reg
    peor = max(_d3_ring_area(cs[0]) for cs in (m['coordinates'] if m['type'] == 'MultiPolygon' else [m['coordinates']]))
    assert peor < TAU, (reg, peor)
    feats.append({'type': 'Feature', 'id': reg, 'geometry': m})
out_r = {'type': 'FeatureCollection', 'features': feats}
open(OUT_R, 'w', encoding='utf-8').write(
    '// Regiones DISUELTAS (union por region desde la geometria fuente). id=nombre de region.\n'
    'window.GEO_REGIONS=' + json.dumps(out_r, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('=> data-geo-regions.js: %d regiones, %.0f KB' % (len(feats), os.path.getsize(OUT_R) / 1024))
