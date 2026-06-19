# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart 9: orígenes (país de nacimiento + migración)
# =============================================================
# ¿De qué país nacen los mundialistas, y cuántos representan a OTRA selección?
# Complemento temporal del chart 8 (mapa de cunas, espacial) y del chart 6
# (natividad, % nacidos en el país que representan — la línea agregada).
#
# Construye data-origenes.js desde master_consolidado.csv (per-jugador):
#   - Por Mundial y país de nacimiento: cuántos nacieron ahí (all) y cuántos
#     de ésos representan a OTRA selección (exp = "exportados").
#   - Denominadores por año: total con país de nacimiento conocido (all) y
#     total de exportados (exp). El renderer calcula % en cada universo.
#   - flows: para el Sankey, los flujos nacimiento -> selección (solo los
#     exportados), por Mundial.
#   - confed (confederación FIFA por iso) para el toggle "por región".
#
# "Exportado" = nacio_en_pais == '0' (la base ya resuelve el cruce
# nacimiento vs selección). '' = desconocido (cuenta en all, no en exp).
#
# Salida: 03-futbol/data-origenes.js
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
ROOT = HERE.parent
OUT = ROOT / "data-origenes.js"

# --- nombres de país (es/en) ---------------------------------------------------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    return json.loads(m.group(1)) if m else {}
CN = load_country_names()
HIST = {"CSK": ("Checoslovaquia", "Czechoslovakia"), "YUG": ("Yugoslavia", "Yugoslavia"),
        "SUN": ("Unión Soviética", "Soviet Union"), "DDR": ("Alemania Oriental", "East Germany"),
        "SCG": ("Serbia y Montenegro", "Serbia and Montenegro"), "GBR": ("Reino Unido", "United Kingdom"),
        # Naciones del Reino Unido (no están en country-names.js, que es ISO-3166).
        "ENG": ("Inglaterra", "England"), "SCO": ("Escocia", "Scotland"),
        "WAL": ("Gales", "Wales"), "NIR": ("Irlanda del Norte", "Northern Ireland")}

# --- split del Reino Unido por nación de NACIMIENTO (mismo criterio que el
#     chart 7, adaptado: acá la nación sale de la CIUDAD de nacimiento). El dato
#     ya trae nacio_en_pais tratando bien a las naciones UK; clasificamos la
#     ciudad para captar también los casos cruzados (nacido en una nación UK que
#     representa a otra selección). Default Inglaterra + red de seguridad geo.
GBR_SCO = {"Glasgow", "Edinburgh", "Aberdeen", "Dundee", "Irvine", "Paisley", "Hamilton",
  "Clydebank", "Falkirk", "Dunfermline", "Johnstone", "Kirkintilloch", "Uddingston",
  "Kilwinning", "Greenock", "Fife", "Cumnock", "Alloa", "Perth", "Dumfries", "Ayr",
  "Galashiels", "Stevenston", "Kilmarnock", "Lochgelly", "Carnoustie", "Cowdenbeath",
  "Glencraig", "Douglas Water", "Dennistoun", "Kennoway", "Carron", "Barrhead", "Selkirk",
  "Bishopbriggs", "Buckie", "Blantyre", "Leith", "Montrose", "Airdrie", "Arbroath",
  "Alexandria", "Denny", "Busby", "Lossiemouth", "Stonehaven", "Stirling", "Lesmahagow",
  "Linlithgow", "Cardenden", "Scottish Borders", "Banchory", "Maryhill", "Grangemouth",
  "Largs", "Douglas", "Gourock", "Bellshill", "Bonnybridge", "Motherwell", "Thurso",
  "Govan", "Stranraer", "Keith", "Dalry", "Leuchars", "Balfron", "Rutherglen", "Inverness",
  "Kirriemuir"}
GBR_WAL = {"Cardiff", "Swansea", "Wrexham", "Neath", "Newport", "Llansamlet", "Ystrad",
  "Flint", "Cwmbwrla", "Rhondda", "Abercynon", "Ynysybwl", "Nant-y-derry", "Maerdy",
  "Builth Wells", "Bangor", "Carmarthen", "Caerphilly", "Denbighshire"}
GBR_NIR = {"Belfast", "Newry", "Derry", "Ballymoney", "Ballymena", "Magherafelt", "Coleraine",
  "Lurgan", "Comber", "Castledawson", "Dundonald", "Kilrea", "Enniskillen", "Eglinton"}
def gbr_birth_nation(city, lat, lon):
    if city in GBR_NIR: return "NIR"
    if city in GBR_SCO: return "SCO"
    if city in GBR_WAL: return "WAL"
    if lon <= -5.7 and 54 <= lat <= 55.6: return "NIR"   # isla de Irlanda
    if lat >= 55.85: return "SCO"                          # al norte de Berwick
    return "ENG"
def nm(iso):
    if iso in HIST: return list(HIST[iso])
    c = CN.get(iso, {})
    return [c.get("es") or c.get("en") or iso, c.get("en") or iso]

# --- confederación FIFA por iso (desde data-clubage.js) ------------------------
def load_confed():
    txt = (ROOT / "data-clubage.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+DATA_CLUBAGE\s*=\s*(\{.*?\});", txt, re.S)
    d = json.loads(m.group(1)) if m else {}
    out = {iso: v.get("confed") for iso, v in d.items() if v.get("confed")}
    out.update({"GBR": "UEFA", "ENG": "UEFA", "SCO": "UEFA", "WAL": "UEFA", "NIR": "UEFA",
                "CSK": "UEFA", "YUG": "UEFA", "SUN": "UEFA", "DDR": "UEFA", "SCG": "UEFA",
                "XKX": "UEFA", "IMN": "UEFA", "PSE": "AFC", "CUW": "CONCACAF"})
    return out
CONFED = load_confed()

# team_code (FIFA) -> iso3 cuando difieren (para la selección representada)
# ENG/SCO/WAL/NIR son selecciones FIFA distintas → se mantienen separadas.
TEAMCODE_FIX = {"ALG": "DZA", "GER": "DEU", "NED": "NLD", "SUI": "CHE", "POR": "PRT",
                "CRO": "HRV", "URU": "URY", "PAR": "PRY", "RSA": "ZAF", "ZAI": "COD",
                "TCH": "CSK", "FRG": "DEU", "GDR": "DDR", "YUG": "YUG", "SCG": "SCG",
                "URS": "SUN"}
def repr_iso(team_code):
    tc = (team_code or "").strip()
    return TEAMCODE_FIX.get(tc, tc)

# --- leer master ---------------------------------------------------------------
rows = list(csv.DictReader(open(SRC / "master_consolidado.csv", encoding="utf-8")))
total_all = defaultdict(int)
total_exp = defaultdict(int)
team_all = defaultdict(lambda: defaultdict(int))   # iso_nac -> {year: n}
team_exp = defaultdict(lambda: defaultdict(int))
flows = defaultdict(lambda: defaultdict(int))      # year -> {(birth_iso, repr_iso): n}
teams_wc = defaultdict(set)                         # year -> {selecciones que jugaron}

for r in rows:
    y0 = int(r["year"])
    ri0 = repr_iso(r.get("team_code"))             # selección que juega ese Mundial
    if ri0:
        teams_wc[y0].add(ri0)
    bi = (r.get("iso_nacimiento") or "").strip()
    if not bi:
        continue
    if bi == "GBR":                                    # separar por nación de nacimiento
        try: lat = float(r.get("lat_nac") or 0); lon = float(r.get("lon_nac") or 0)
        except (TypeError, ValueError): lat = lon = 0.0
        bi = gbr_birth_nation((r.get("ciudad_nac") or "").strip(), lat, lon)
    y = int(r["year"])
    total_all[y] += 1
    team_all[bi][y] += 1
    if (r.get("nacio_en_pais") or "").strip() == "0":      # nació afuera = exportado
        total_exp[y] += 1
        team_exp[bi][y] += 1
        ri = repr_iso(r.get("team_code"))
        flows[y][(bi, ri)] += 1

years = sorted(total_all)

# --- armar teams (países de nacimiento), ordenados por total histórico ---------
team_tot = {iso: sum(team_all[iso].values()) for iso in team_all}
teams = []
isos_used = set()
for iso in sorted(team_tot, key=lambda k: -team_tot[k]):
    isos_used.add(iso)
    teams.append({
        "iso3": iso,
        "all": [[y, team_all[iso][y]] for y in sorted(team_all[iso])],
        "exp": [[y, team_exp[iso][y]] for y in sorted(team_exp[iso])],
    })

# --- flows para el Sankey ------------------------------------------------------
flows_out = {}
for y in years:
    items = sorted(flows[y].items(), key=lambda kv: -kv[1])
    arr = []
    for (bi, ri), n in items:
        arr.append([bi, ri, n])
        isos_used.add(bi); isos_used.add(ri)
    if arr:
        flows_out[str(y)] = arr

# --- names + confed solo de los iso usados -------------------------------------
names = {iso: nm(iso) for iso in sorted(isos_used)}
confed = {iso: CONFED.get(iso, "OTRO") for iso in sorted(isos_used)}

data = {
    "years": years,
    "totals": {"all": [[y, total_all[y]] for y in years],
               "exp": [[y, total_exp[y]] for y in years]},
    "names": names,
    "confed": confed,
    "teams": teams,
    "flows": flows_out,
    "teams_wc": {str(y): sorted(teams_wc[y]) for y in years},   # selecciones por Mundial
}
js = "// Generado por data-sources/build_origenes.py — NO editar a mano.\n"
js += "// País de nacimiento de los mundialistas por Mundial + flujos de migración.\n"
js += "const ORIGENES = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log -----------------------------------------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | países-nac: {len(teams)} | Mundiales: {len(years)}")
print(f"   total con país conocido: 2022={total_all[2022]} 2026={total_all[2026]}")
print(f"   exportados: 2022={total_exp[2022]} ({100*total_exp[2022]/total_all[2022]:.1f}%)  "
      f"2026={total_exp[2026]} ({100*total_exp[2026]/total_all[2026]:.1f}%)")
missing = [iso for iso in isos_used if confed[iso] == "OTRO"]
print(f"   iso sin confederación (revisar): {missing}")
# top exportadores 2026
top = sorted(team_exp, key=lambda k: -team_exp[k].get(2026, 0))[:6]
print("   top exportadores 2026:", [(iso, team_exp[iso].get(2026, 0)) for iso in top])
