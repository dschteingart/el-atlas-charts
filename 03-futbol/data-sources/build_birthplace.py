# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 (anexo mundiales) — Chart 8: lugares de nacimiento
# =============================================================
# Construye data-birthplace.js desde master_consolidado.csv (1 fila por
# jugador × Mundial). Para el mapa de puntos y el ranking:
#   - cities[]:  agregado por ciudad de nacimiento (con lat/lon).
#       tot   = jugadores ÚNICOS nacidos ahí (dedup por wd_id, all-time)
#       y[YY] = jugadores en el plantel de ese Mundial nacidos ahí (cuenta
#               repetidores: un jugador suma en cada Mundial que disputó)
#   - countries[]: lo mismo agregado por país de nacimiento (iso).
#
# Salida: 03-futbol/data-birthplace.js
#   BIRTH = {years, cities:[{c,iso,lat,lon,tot,y}], countries:[{iso,tot,y}]}
import csv, json
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
OUT = HERE.parent / "data-birthplace.js"

rows = list(csv.DictReader(open(SRC / "master_consolidado.csv", encoding="utf-8")))

def fnum(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def pid_of(r):
    return (r.get("wd_id") or "").strip() or (r.get("player_id") or "").strip() or \
           (r.get("nombre", "") + "|" + r.get("ciudad_nac", ""))

years = set()
# ciudad -> agregado
city_tot = defaultdict(set)          # key -> set(pid)  (únicos)
city_y = defaultdict(lambda: defaultdict(int))
city_meta = {}                       # key -> {c, iso, lat, lon}
ctry_tot = defaultdict(set)
ctry_y = defaultdict(lambda: defaultdict(int))

for r in rows:
    yr = int(r["year"]); years.add(yr)
    pid = pid_of(r)
    iso = (r.get("iso_nacimiento") or "").strip()
    if iso:
        ctry_tot[iso].add(pid); ctry_y[iso][yr] += 1
    lat, lon = fnum(r.get("lat_nac")), fnum(r.get("lon_nac"))
    city = (r.get("ciudad_nac") or "").strip()
    if lat is None or lon is None or not city:
        continue
    key = (city, iso)
    city_tot[key].add(pid); city_y[key][yr] += 1
    if key not in city_meta:
        city_meta[key] = {"c": city, "iso": iso, "lat": round(lat, 3), "lon": round(lon, 3)}

cities = []
for key, meta in city_meta.items():
    cities.append({**meta, "tot": len(city_tot[key]),
                   "y": {str(k): v for k, v in sorted(city_y[key].items())}})
cities.sort(key=lambda d: -d["tot"])

countries = []
for iso in ctry_tot:
    countries.append({"iso": iso, "tot": len(ctry_tot[iso]),
                      "y": {str(k): v for k, v in sorted(ctry_y[iso].items())}})
countries.sort(key=lambda d: -d["tot"])

data = {"years": sorted(years), "cities": cities, "countries": countries}
js = "// Generado por data-sources/build_birthplace.py — NO editar a mano.\n"
js += "// Lugares de nacimiento de los mundialistas (1930-2026).\n"
js += "// tot = jugadores únicos (all-time); y[year] = jugadores del plantel de ese Mundial.\n"
js += "const BIRTH = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

print(f"OK: {OUT.stat().st_size//1024} KB | ciudades: {len(cities)} | paises: {len(countries)} | Mundiales: {len(years)}")
for d in cities[:6]:
    print(f'   {d["c"][:18]:18} ({d["iso"]}) tot={d["tot"]}  anios={len(d["y"])}')
print("   top paises:", [(c["iso"], c["tot"]) for c in countries[:6]])
