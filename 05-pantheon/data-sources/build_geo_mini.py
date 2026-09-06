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
