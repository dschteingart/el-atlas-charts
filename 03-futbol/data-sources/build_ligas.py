# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 (anexo mundiales) — Chart 7: ligas de destino
# =============================================================
# Construye data-ligas.js a partir de:
#   - ligas_destino.csv      (year, club_country_iso3, n_jugadores)  [long]
#   - europeizacion.csv      (year, pct_en_europa, ...)              [agregado]
# Para cada Mundial, el denominador es el total de jugadores con club conocido
# (n_con_club = suma de n_jugadores de ese año). El share de cada país-de-club
# es 100 * n / total. Solo se emiten los años donde el país tiene >=1 jugador
# (gaps estilo OWID). La serie "europa" es el % agregado que juega en Europa.
#
# Salida: 03-futbol/data-ligas.js  ->  LIGAS = {years, europa, teams:[{iso3,name,en,pts:[[y,pct,n]]}]}
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
ROOT = HERE.parent                       # 03-futbol/
OUT = ROOT / "data-ligas.js"

# --- nombres de país (es/en) desde country-names.js ----------------------------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    if not m:
        return {}
    return json.loads(m.group(1))

CN = load_country_names()
# Estados desaparecidos que pueden aparecer como país-del-club histórico y que
# country-names.js (basado en países actuales) no cubre.
HIST = {
    "CSK": ("Checoslovaquia", "Czechoslovakia"),
    "YUG": ("Yugoslavia", "Yugoslavia"),
    "SUN": ("Unión Soviética", "Soviet Union"),
    "DDR": ("Alemania Oriental", "East Germany"),
    "SCG": ("Serbia y Montenegro", "Serbia and Montenegro"),
}
def name_es(iso): return (HIST[iso][0] if iso in HIST else CN.get(iso, {}).get("es") or CN.get(iso, {}).get("en") or iso)
def name_en(iso): return (HIST[iso][1] if iso in HIST else CN.get(iso, {}).get("en") or iso)

# --- ligas_destino.csv (long) --------------------------------------------------
rows = list(csv.DictReader(open(SRC / "ligas_destino.csv", encoding="utf-8")))
by_year_total = defaultdict(int)
for r in rows:
    by_year_total[int(r["year"])] += int(r["n_jugadores"])
years = sorted(by_year_total)

teams = defaultdict(list)                 # iso3 -> [[year, pct, n], ...]
team_total = defaultdict(int)
for r in rows:
    y = int(r["year"]); iso = r["club_country_iso3"].strip(); n = int(r["n_jugadores"])
    if n <= 0:
        continue
    pct = round(100 * n / by_year_total[y], 1)
    teams[iso].append([y, pct, n])
    team_total[iso] += n

# ordenar pts por año y equipos por total histórico (desc)
out_teams = []
for iso in sorted(team_total, key=lambda k: -team_total[k]):
    pts = sorted(teams[iso], key=lambda p: p[0])
    out_teams.append({"iso3": iso, "name": name_es(iso), "en": name_en(iso), "pts": pts})

# --- europeizacion.csv ---------------------------------------------------------
eur = []
for r in csv.DictReader(open(SRC / "europeizacion.csv", encoding="utf-8")):
    eur.append([int(r["year"]), float(r["pct_en_europa"])])
eur.sort(key=lambda p: p[0])

data = {"years": years, "europa": eur, "teams": out_teams}
js = "// Generado por data-sources/build_ligas.py — NO editar a mano.\n"
js += "// % de mundialistas por país del club, por Mundial (1930-2026).\n"
js += "const LIGAS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log (ascii-safe para consola Windows) -------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | club-countries: {len(out_teams)} | Mundiales: {len(years)}")
big5 = ["GBR", "ESP", "ITA", "DEU", "FRA"]
byiso = {t["iso3"]: t for t in out_teams}
for iso in big5:
    t = byiso.get(iso)
    if t:
        last = t["pts"][-1]
        print(f"   {iso} {t['name'][:16]:16} last={last}  npts={len(t['pts'])}")
print(f"   europa: 1930={eur[0][1]}  2026={eur[-1][1]}")
miss = [t["iso3"] for t in out_teams if t["iso3"] not in CN and t["iso3"] not in HIST]
print(f"   iso sin nombre (ni en CN ni en HIST): {miss}")
