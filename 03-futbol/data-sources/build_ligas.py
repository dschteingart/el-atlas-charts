# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart 7: ligas de destino
# =============================================================
# Construye data-ligas.js a partir de:
#   - ligas_destino.csv      (year, club_country_iso3, n_jugadores)  [long]
#   - europeizacion.csv      (year, pct_en_europa, ...)              [agregado]
#   - master_consolidado.csv (per-jugador, con nombre de club)       [solo UK]
#
# Para cada Mundial, el denominador es el total de jugadores con club conocido
# (n_con_club = suma de n_jugadores de ese año). El share de cada país-de-club
# es 100 * n / total. Solo se emiten los años donde el país tiene >=1 jugador
# (gaps estilo OWID). La serie "europa" es el % agregado que juega en Europa.
#
# SPLIT DEL REINO UNIDO ---------------------------------------------------------
# La fuente codifica todos los clubes británicos como "GBR" (Reino Unido), lo
# que mezcla la liga inglesa con la escocesa. Acá separamos el bucket GBR en sus
# naciones futbolísticas (miembros FIFA distintos) usando el NOMBRE del club del
# maestro por-jugador. Criterio = la LIGA donde juega el club:
#   - Inglaterra: Premier League + EFL (incluye Cardiff/Swansea/Wrexham, clubes
#     galeses que compiten en el sistema inglés). Ver WALES_AS para cambiarlo.
#   - Escocia: clubes de la liga escocesa (Celtic, Rangers, Aberdeen, ...).
#   - Irlanda del Norte: liga norirlandesa (Coleraine, Linfield, ...).
# Además se corrigen ~30 jugador-temporadas de clubes NO británicos que estaban
# mal codificados como GBR (Levski Sofia, Palmeiras, Beşiktaş, ...), mandándolos
# a su país real. El reparto preserva el total por año de ligas_destino.csv (no
# cambia el denominador ni los demás países).
#
# Salida: 03-futbol/data-ligas.js  ->  LIGAS = {years, europa, teams:[{iso3,name,en,pts:[[y,pct,n]]}]}
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
ROOT = HERE.parent                       # 03-futbol/
OUT = ROOT / "data-ligas.js"

# A dónde van los clubes galeses (Cardiff/Swansea/Wrexham): por LIGA juegan en
# Inglaterra ("ENG"); poné "WAL" si preferís contarlos por nación del club.
WALES_AS = "ENG"

# --- clasificación de clubes del bucket GBR ------------------------------------
SCO = {"Celtic F.C.", "Rangers F.C.", "Aberdeen Football Club",
       "Scottish Football League XI", "Heart of Midlothian F.C.",
       "Dundee United F.C.", "Hibernian F.C.", "Partick Thistle F.C.",
       "Dundee F.C.", "Clyde F.C.", "Kilmarnock F.C.", "Falkirk F.C.",
       "St Johnstone F.C.", "St. Mirren F.C.", "St. Mirren",
       "Queen of the South F.C.", "Raith Rovers F.C.", "Motherwell F.C."}
WAL = {"Swansea City Association Football Club", "Cardiff City F.C.",
       "Wrexham A.F.C.", "Cardiff"}
NIR = {"Coleraine F.C.", "Glentoran F.C.", "Linfield F.C.", "Glenavon F.C."}
# Mal codificados como GBR: nombre de club -> iso3 real
MISCODE = {"Åsane Fotball": "NOR", "PFC Levski Sofia": "BGR",
           "Fortuna Düsseldorf": "DEU", "Sydney FC": "AUS", "K.A.S. Eupen": "BEL",
           "Beşiktaş J.K. (Football)": "TUR", "IL Stjørdals-Blink": "NOR",
           "Hammarby IF": "SWE", "AC Horsens": "DNK",
           "Sociedade Esportiva Palmeiras": "BRA"}
JUNK = {"Europeans cricket team"}        # ni siquiera es fútbol

def classify_gbr_club(club):
    """Devuelve (categoria, iso_destino|None). categoria in ENG/SCO/NIR/FOREIGN/JUNK."""
    if club in MISCODE: return ("FOREIGN", MISCODE[club])
    if club in JUNK:    return ("JUNK", None)
    if club in SCO:     return ("SCO", None)
    if club in NIR:     return ("NIR", None)
    if club in WAL:     return (WALES_AS, None)
    return ("ENG", None)                 # resto = liga inglesa

# --- nombres de país (es/en) ---------------------------------------------------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    return json.loads(m.group(1)) if m else {}

CN = load_country_names()
HIST = {"CSK": ("Checoslovaquia", "Czechoslovakia"), "YUG": ("Yugoslavia", "Yugoslavia"),
        "SUN": ("Unión Soviética", "Soviet Union"), "DDR": ("Alemania Oriental", "East Germany"),
        "SCG": ("Serbia y Montenegro", "Serbia and Montenegro")}
# Naciones del Reino Unido (no están en country-names.js, que es ISO-3166).
UKN = {"ENG": ("Inglaterra", "England"), "SCO": ("Escocia", "Scotland"),
       "WAL": ("Gales", "Wales"), "NIR": ("Irlanda del Norte", "Northern Ireland")}
def name_es(iso): return (UKN[iso][0] if iso in UKN else HIST[iso][0] if iso in HIST else CN.get(iso, {}).get("es") or CN.get(iso, {}).get("en") or iso)
def name_en(iso): return (UKN[iso][1] if iso in UKN else HIST[iso][1] if iso in HIST else CN.get(iso, {}).get("en") or iso)

# --- ligas_destino.csv (long) --------------------------------------------------
rows = list(csv.DictReader(open(SRC / "ligas_destino.csv", encoding="utf-8")))
by_year_total = defaultdict(int)
cnt = defaultdict(lambda: defaultdict(int))     # iso -> {year: n}
for r in rows:
    y = int(r["year"]); iso = r["club_country_iso3"].strip(); n = int(r["n_jugadores"])
    if n <= 0:
        continue
    by_year_total[y] += n
    cnt[iso][y] += n
years = sorted(by_year_total)

# --- desglose del bucket GBR desde el maestro por-jugador ----------------------
gbr_cat = defaultdict(lambda: defaultdict(int))   # year -> {ENG/SCO/NIR: n}
gbr_for = defaultdict(lambda: defaultdict(int))   # year -> {iso_real: n}
for r in csv.DictReader(open(SRC / "master_consolidado.csv", encoding="utf-8")):
    if (r.get("club_iso") or "").strip() != "GBR":
        continue
    y = int(r["year"]); cat, tgt = classify_gbr_club((r.get("club") or "").strip())
    if cat == "JUNK":
        continue
    if cat == "FOREIGN":
        gbr_for[y][tgt] += 1
    else:
        gbr_cat[y][cat] += 1

# --- repartir el bucket GBR de ligas_destino según las proporciones del maestro
# Se preserva exactamente el total por año (denominador) y los demás países.
for y in years:
    n_gbr = cnt["GBR"].get(y, 0)
    if n_gbr <= 0:
        continue
    cats = dict(gbr_cat[y]); fors = dict(gbr_for[y])
    keep = sum(cats.values()) + sum(fors.values())
    del cnt["GBR"][y]
    if keep <= 0:                         # sin info en el maestro -> todo Inglaterra
        cnt["ENG"][y] += n_gbr
        continue
    scale = n_gbr / keep
    alloc = {}                            # ('uk',cat)|('for',iso) -> n
    for c, v in cats.items(): alloc[("uk", c)] = round(v * scale)
    for iso, v in fors.items(): alloc[("for", iso)] = round(v * scale)
    drift = n_gbr - sum(alloc.values())   # corregir redondeo sobre la categoría mayor
    if alloc:
        kbig = max(alloc, key=lambda k: alloc[k]); alloc[kbig] += drift
    for (kind, key), v in alloc.items():
        if v > 0:
            cnt[key][y] += v
cnt.pop("GBR", None)

# --- emitir teams (ordenados por total histórico desc) -------------------------
team_total = {iso: sum(d.values()) for iso, d in cnt.items()}
out_teams = []
for iso in sorted(team_total, key=lambda k: -team_total[k]):
    pts = [[y, round(100 * cnt[iso][y] / by_year_total[y], 1), cnt[iso][y]]
           for y in sorted(cnt[iso])]
    out_teams.append({"iso3": iso, "name": name_es(iso), "en": name_en(iso), "pts": pts})

# --- europeizacion.csv ---------------------------------------------------------
eur = []
for r in csv.DictReader(open(SRC / "europeizacion.csv", encoding="utf-8")):
    eur.append([int(r["year"]), float(r["pct_en_europa"])])
eur.sort(key=lambda p: p[0])

data = {"years": years, "europa": eur, "teams": out_teams}
js = "// Generado por data-sources/build_ligas.py — NO editar a mano.\n"
js += "// % de mundialistas por país del club, por Mundial (1930-2026).\n"
js += "// El Reino Unido va separado por nación (Inglaterra/Escocia/Irlanda del Norte).\n"
js += "const LIGAS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log (ascii-safe) ----------------------------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | club-countries: {len(out_teams)} | Mundiales: {len(years)}")
byiso = {t["iso3"]: t for t in out_teams}
for iso in ["ENG", "SCO", "ESP", "ITA", "DEU"]:
    t = byiso.get(iso)
    if t:
        last = t["pts"][-1]
        print(f"   {iso} {t['name'][:18]:18} last={last}  npts={len(t['pts'])}  total={team_total[iso]}")
print(f"   GBR sigue en data? {'GBR' in byiso}  | europa: 1930={eur[0][1]} 2026={eur[-1][1]}")
