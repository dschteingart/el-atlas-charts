# =============================================================
#  El Atlas N°3 (anexo mundiales) — Build data-natividad.js  (chart 6)
# =============================================================
# % de jugadores nacidos en el país que representan, por Mundial (1930-2026),
# promedio + por selección. Fuente: jfjelstul/worldcup + Pantheon/Wikidata +
# FC Maps (2026). Born-afuera = 100 - born-en-país.
import csv, json
from pathlib import Path
from collections import defaultdict

SRC = Path(__file__).resolve().parent / "mundiales"
OUT = Path(__file__).resolve().parents[1] / "data-natividad.js"

def rows(f):
    return list(csv.DictReader(open(SRC / f, encoding="utf-8-sig")))

# --- promedio del Mundial (serie) ---
avg = [[int(r["year"]), round(float(r["pct_born"]), 1)] for r in rows("insight1_serie.csv")]

# --- por selección ---
teams = {}
for r in rows("insight1_por_seleccion.csv"):
    iso = r["team_iso3"]
    t = teams.setdefault(iso, {"iso3": iso, "name": r["team_name"], "pts": []})
    t["name"] = r["team_name"]
    t["pts"].append([int(r["year"]), round(float(r["pct_born"]), 1), int(r["n_total"])])

# --- 2026 (a nivel jugador → agregar) ---
wc = rows("wc2026_birthcountry.csv")
g = defaultdict(lambda: [0, 0])  # iso -> [born_in, total]
alln = [0, 0]
for r in wc:
    b = 1 if str(r["born_in_country"]).strip() in ("1", "1.0", "True", "true") else 0
    iso = r["team_iso3"]
    g[iso][0] += b; g[iso][1] += 1
    alln[0] += b; alln[1] += 1
if alln[1]:
    avg.append([2026, round(100 * alln[0] / alln[1], 1)])
for iso, (b, n) in g.items():
    if n == 0: continue
    pct = round(100 * b / n, 1)
    teams.setdefault(iso, {"iso3": iso, "name": "", "pts": []})
    teams[iso]["pts"].append([2026, pct, n])

# ordenar
avg.sort()
years = sorted({p[0] for p in avg})
out_teams = []
for iso in sorted(teams):
    t = teams[iso]
    t["pts"].sort()
    out_teams.append(t)

js = "// AUTO-GENERADO por 03-futbol/data-sources/build_natividad.py — no editar a mano.\n"
js += "// % de mundialistas nacidos en el país que representan, por Mundial (1930-2026).\n"
js += "// avg = promedio del Mundial [[año, %born]]; teams[].pts = [[año, %born, n_plantel]] (solo Mundiales jugados).\n"
js += "const NATIVIDAD = " + json.dumps({"years": years, "avg": avg, "teams": out_teams}, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")
print("OK:", OUT.name, "-", OUT.stat().st_size // 1024, "KB | Mundiales:", len(years), "| selecciones:", len(out_teams))
print("avg 1930:", avg[0], "| 2022:", [a for a in avg if a[0]==2022], "| 2026:", [a for a in avg if a[0]==2026])
arg = next(t for t in out_teams if t["iso3"]=="ARG")
print("ARG pts (primeros 3 + ult):", arg["pts"][:3], "...", arg["pts"][-1])
