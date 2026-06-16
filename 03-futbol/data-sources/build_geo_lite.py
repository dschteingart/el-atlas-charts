# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — backdrop liviano para el mapa de cunas (chart 8)
# =============================================================
# Simplifica data-country-geo.js (Natural Earth 1:10m, ~52k puntos, 2 MB) a un
# backdrop mucho más liviano (~5,5k puntos, ~90 KB) para que el mapa de puntos
# renderice rápido. Un mapa de cunas solo necesita siluetas reconocibles, no la
# precisión 1:10m. NO toca data-country-geo.js (que usa el chart 3 coroplético).
#
# Salida: 03-futbol/data-country-geo-lite.js  ->  GEO_COUNTRIES_LITE
import json
from pathlib import Path
from shapely.geometry import shape, mapping, MultiPolygon

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "data-country-geo.js"
OUT = ROOT / "data-country-geo-lite.js"

TOL = 0.35       # tolerancia Douglas-Peucker (grados)
MINAREA = 0.12   # dropear partes más chicas que esto (deg^2) — micro-islas
NDEC = 2         # decimales de coordenadas (a 1100px, 1px ~ 0.3°)

s = SRC.read_text(encoding="utf-8")
key = "GEO_COUNTRIES = "
g = json.loads(s[s.index(key) + len(key):].rstrip().rstrip(";"))

def round_coords(o):
    if isinstance(o, (list, tuple)):
        if o and isinstance(o[0], (int, float)):
            return [round(o[0], NDEC), round(o[1], NDEC)]
        return [round_coords(x) for x in o]
    return o

def big_parts(geom):
    if geom.geom_type == "Polygon":
        return geom if geom.area >= MINAREA else None
    polys = [p for p in geom.geoms if p.area >= MINAREA]
    if not polys:
        return None
    return polys[0] if len(polys) == 1 else MultiPolygon(polys)

out, tot = [], 0
for f in g["features"]:
    try:
        geom = shape(f["geometry"]).buffer(0).simplify(TOL, preserve_topology=False)
    except Exception:
        continue
    if geom.is_empty:
        continue
    geom = big_parts(geom)
    if geom is None or geom.is_empty:
        continue
    gj = mapping(geom)
    gj = dict(type=gj["type"], coordinates=round_coords(gj["coordinates"]))
    def cnt(c): return 1 if (c and isinstance(c[0], (int, float))) else sum(cnt(x) for x in c)
    tot += cnt(gj["coordinates"])
    out.append({"type": "Feature", "geometry": gj})

data = {"type": "FeatureCollection", "features": out}
js = "// Generado por data-sources/build_geo_lite.py (simplify shapely).\n"
js += "// Backdrop liviano para el mapa de cunas (chart 8). NO editar a mano.\n"
js += "const GEO_COUNTRIES_LITE = " + json.dumps(data, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")
print(f"OK: features {len(out)} | puntos {tot} | KB {OUT.stat().st_size // 1024}")
