# =============================================================
#  El Atlas N°3 (anexo mundiales) — Build data-natividad.js (chart 6)  [v3]
# =============================================================
# Base: mundialistas_birthcountry.csv (per-jugador CURADO: year, team_code,
#   birth_iso3, born_in_country). Ya trae las home nations SEPARADAS (ENG/SCO/
#   WAL/NIR) y los estados disueltos con born-in correcto. Agregamos por
#   team_code → arregla el merge "Gran Bretaña" sin degradar la cobertura.
# Refinamiento: para las home nations, el born-in se recalcula a nivel
#   sub-nacional (¿nació en ESA nación?) resolviendo el lugar (iso3=GBR) por
#   lat/lon — así "galés nacido en Inglaterra" cuenta como nacido afuera.
# Emite data-natividad.js + natividad_master.csv (birth_iso3 + birth_fifa).
import csv, json
from pathlib import Path
from collections import defaultdict

SRC = Path(__file__).resolve().parent / "mundiales"
OUTJS = Path(__file__).resolve().parents[1] / "data-natividad.js"
OUTCSV = SRC / "natividad_master.csv"

HOME = {"ENG","SCO","WAL","NIR"}
NAME_ES = {"ENG":"Inglaterra","SCO":"Escocia","WAL":"Gales","NIR":"Irlanda del Norte",
           "YUG":"Yugoslavia","SUN":"Unión Soviética","CSK":"Checoslovaquia",
           "SCG":"Serbia y Montenegro","DDR":"Alemania Oriental","COD":"Zaire/RD Congo",
           "IDN":"Indias Or. Holandesas/Indonesia"}
def uk_nation(lat, lon):
    if lat is None or lon is None: return None
    if lon < -5.4 and 54.0 <= lat <= 55.5: return "NIR"
    if lon <= -3.05: border = 55.0
    elif lon >= -2.05: border = 55.8
    else: border = 55.0 + (lon + 3.05) * 0.8
    if lat >= border: return "SCO"
    if lon <= -2.92 and 51.3 <= lat <= 53.45: return "WAL"
    return "ENG"

# lat/lon por player_id (vía crosswalk → QID → birthplace_full) para home nations
xwalk = {r["player_id"]: (r.get("pan_wd_id") or "").strip()
         for r in csv.DictReader(open(SRC/"crosswalk.csv", encoding="utf-8-sig"))}
bp = json.load(open(SRC/"birthplace_full.json", encoding="utf-8"))
def latlon(pid):
    q = xwalk.get(pid); b = bp.get(q) if q else None
    return (b.get("lat"), b.get("lon")) if b else (None, None)

teams_en = {}
agg = defaultdict(lambda: [0,0,0]); avgagg = defaultdict(lambda: [0,0,0])
master = []; uk_cls = defaultdict(int)
for r in csv.DictReader(open(SRC/"mundialistas_birthcountry.csv", encoding="utf-8-sig")):
    year = int(r["year"]); code = r["team_code"]; teams_en[code] = r["team_name"]
    biso = (r["birth_iso3"] or "").strip()
    has = biso != ""
    born = str(r["born_in_country"]).strip() in ("1","1.0","True","true")
    bfifa = biso
    if code in HOME:
        if biso == "GBR":
            lat, lon = latlon(r["player_id"]); nat = uk_nation(lat, lon)
            if nat: bfifa = nat; uk_cls[nat]+=1; born = (nat == code)   # sub-nacional
            # si no resuelve (sin latlon): se queda el born-in curado (nivel UK)
        else:
            born = False   # nacido fuera de UK → nacido afuera
    for d in (agg[(year, code)], avgagg[(year, 0)]):
        d[2]+=1; d[1]+= 1 if has else 0; d[0]+= 1 if (has and born) else 0
    master.append([year, r["player_id"], code, biso, bfifa, 1 if (has and born) else 0])

years = sorted({y for (y, c) in agg})
avg = [[y, round(100*avgagg[(y,0)][0]/avgagg[(y,0)][1], 1)] for y in years if avgagg[(y,0)][1]]
# 2026 (wc2026: excluye GBR del por-equipo; cuenta en el promedio)
def truthy(x): return str(x).strip() in ("1","1.0","True","true")
wc26 = list(csv.DictReader(open(SRC/"wc2026_birthcountry.csv", encoding="utf-8-sig")))
a26 = [sum(1 for r in wc26 if truthy(r["born_in_country"])), len(wc26)]
if a26[1]: avg.append([2026, round(100*a26[0]/a26[1], 1)]); years.append(2026)
t26 = defaultdict(lambda: [0,0])
for r in wc26:
    if r["team_iso3"] == "GBR": continue
    t26[r["team_iso3"]][0]+= 1 if truthy(r["born_in_country"]) else 0; t26[r["team_iso3"]][1]+=1

teams = {}
for (y, c), (born, withc, tot) in agg.items():
    if withc == 0: continue
    teams.setdefault(c, {"iso3": c, "name": NAME_ES.get(c, teams_en.get(c, c)), "en": teams_en.get(c, c), "pts": []})
    teams[c]["pts"].append([y, round(100*born/withc, 1), tot])
for iso, (b, n) in t26.items():
    if n == 0: continue
    teams.setdefault(iso, {"iso3": iso, "name": NAME_ES.get(iso, iso), "en": iso, "pts": []})
    teams[iso]["pts"].append([2026, round(100*b/n, 1), n])
out_teams = [teams[c] for c in sorted(teams)]
for t in out_teams: t["pts"].sort()
years = sorted(set(years))

open(OUTJS, "w", encoding="utf-8").write(
    "// AUTO-GENERADO por build_natividad.py (v3) — no editar a mano.\n"
    "// Base: mundialistas_birthcountry.csv (curado). Home nations separadas y con\n"
    "// born-in sub-nacional (lat/lon); disueltos y normales según el curado.\n"
    "const NATIVIDAD = " + json.dumps({"years": years, "avg": sorted(avg), "teams": out_teams}, ensure_ascii=False, separators=(",", ":")) + ";\n")
with open(OUTCSV, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f); w.writerow(["year","player_id","team_code","birth_iso3","birth_fifa","born_in"]); w.writerows(master)

print("OK:", OUTJS.stat().st_size//1024, "KB | selecciones:", len(out_teams), "| Mundiales:", len(years))
print("UK sub-nacional:", dict(uk_cls))
# sanity vs original insight1 (debería ser ~0 para normales)
orig = {(int(r["year"]), r["team_iso3"]): float(r["pct_born"]) for r in csv.DictReader(open(SRC/"insight1_por_seleccion.csv", encoding="utf-8-sig"))}
mine = {(p[0], t["iso3"]): p[1] for t in out_teams for p in t["pts"]}
norm = [abs(mine[k]-orig[k]) for k in set(mine)&set(orig) if k[1] not in HOME and k[0]!=2026]
print("dif normales vs original — max:", round(max(norm),2), "prom:", round(sum(norm)/len(norm),3))
for c in ["ENG","SCO","WAL","NIR"]:
    t=teams.get(c); print("  ", c, t["name"]+":", ", ".join(f"{p[0]}:{p[1]}%" for p in t["pts"][-4:]) if t else "—")
print("avg 1930/2022/2026:", [a for a in avg if a[0] in (1930,2022,2026)])
