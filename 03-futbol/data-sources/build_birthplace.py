# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 (anexo mundiales) — Chart 8: lugares de nacimiento
# =============================================================
# Construye data-birthplace.js desde master_consolidado.csv (1 fila por
# jugador × Mundial). Modelo POR JUGADOR (permite contar jugadores ÚNICOS
# para cualquier rango de Mundiales, sin doble-contar repetidores):
#   - cities[]:  ciudad de nacimiento con lat/lon (única por (ciudad,iso)).
#   - players[]: [cityIdx, [yearIdx, ...]] — ciudad de nacimiento de cada
#                jugador único + los Mundiales que disputó (índices de years).
# El renderer cuenta, para un rango [y0,y1], los jugadores únicos cuya ciudad
# es X y que jugaron al menos un Mundial dentro del rango.
#
# Salida: 03-futbol/data-birthplace.js
#   BIRTH = {years, cities:[{c,iso,lat,lon}], players:[[cityIdx,[yIdx,...]]]}
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

years = sorted({int(r["year"]) for r in rows})
yidx = {y: i for i, y in enumerate(years)}

# jugador único -> {city,iso,lat,lon,yrs:set}
players = {}
for r in rows:
    pid = pid_of(r)
    p = players.setdefault(pid, {"c": "", "iso": "", "lat": None, "lon": None, "yrs": set()})
    p["yrs"].add(int(r["year"]))
    if not p["c"]:
        c = (r.get("ciudad_nac") or "").strip()
        lat, lon = fnum(r.get("lat_nac")), fnum(r.get("lon_nac"))
        if c and lat is not None and lon is not None:
            p["c"] = c; p["iso"] = (r.get("iso_nacimiento") or "").strip()
            p["lat"] = round(lat, 3); p["lon"] = round(lon, 3)

# índice de ciudades + conteo all-time (para ordenar)
city_idx = {}; city_meta = []; city_tot = defaultdict(int)
def get_city(c, iso, lat, lon):
    key = (c, iso)
    if key not in city_idx:
        city_idx[key] = len(city_meta)
        city_meta.append({"c": c, "iso": iso, "lat": lat, "lon": lon})
    return city_idx[key]

player_recs = []
for pid, p in players.items():
    if not p["c"]:
        continue
    ci = get_city(p["c"], p["iso"], p["lat"], p["lon"])
    city_tot[ci] += 1
    player_recs.append([ci, sorted(yidx[y] for y in p["yrs"])])

# reordenar ciudades por conteo desc y remapear índices (ciudades grandes primero)
order = sorted(range(len(city_meta)), key=lambda i: -city_tot[i])
remap = {old: new for new, old in enumerate(order)}
cities = [city_meta[old] for old in order]
players_out = [[remap[ci], yrs] for ci, yrs in player_recs]

data = {"years": years, "cities": cities, "players": players_out}
js = "// Generado por data-sources/build_birthplace.py — NO editar a mano.\n"
js += "// Lugares de nacimiento de los mundialistas (1930-2026). Modelo por jugador:\n"
js += "// players[i] = [cityIdx, [yearIdx,...]] (Mundiales que disputó ese jugador único).\n"
js += "const BIRTH = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# log (ascii-safe)
print(f"OK: {OUT.stat().st_size//1024} KB | ciudades: {len(cities)} | jugadores: {len(players_out)} | Mundiales: {len(years)}")
top = sorted(range(len(cities)), key=lambda i: -city_tot[order[i]])[:6]
for i in range(6):
    m = cities[i]; print(f'   {city_tot[order[i]]:3}  {m["c"][:18]:18} [{m["iso"]}]')
