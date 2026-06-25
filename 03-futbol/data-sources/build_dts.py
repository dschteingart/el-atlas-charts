# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart 11: DTs (nacionalidad del entrenador + migración)
# =============================================================
# Espejo del chart 9 (orígenes/migración de jugadores), pero para el banquillo:
# ¿de qué país son los DTs de cada Mundial, y cuántos dirigen a OTRA selección
# ("exportados")? El gran dato: Argentina y Brasil están entre los mayores
# exportadores de técnicos del mundo, pero casi nunca importan uno.
#
# Construye data-dts.js desde jfjelstul/manager_appointments.csv (1 fila por
# DT × selección × Mundial). MISMA estructura de salida que data-origenes.js,
# para que el renderer (dts.js) sea un clon de origenes.js:
#   - teams: por nacionalidad del DT, cuántos dirigen (all) y cuántos a OTRA
#     selección (exp = "exportados"), por Mundial.
#   - totals: denominadores por año (todos los DTs / los exportados).
#   - flows: para el Sankey, nacionalidad-del-DT -> selección dirigida (solo
#     los exportados), por Mundial.
#   - confed (confederación FIFA por iso) para el toggle "por región".
#
# "Exportado" = la nacionalidad del DT (iso) != la selección que dirige (iso).
# Se compara por ISO3 (no por texto): jfjelstul ya unifica West Germany/Germany
# en team_code DEU, así que un DT alemán dirigiendo a Alemania Occidental NO es
# exportado (evita el falso "Alemania Occidental importó 10 DTs").
#
# Solo Mundial MASCULINO (la tabla mezcla el femenino; se filtra por "Men's"):
# 22 Mundiales 1930-2022 (no llega a 2026: los DTs aún no están).
#
# Salida: 03-futbol/data-dts.js
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "jfjelstul"
ROOT = HERE.parent
OUT = ROOT / "data-dts.js"

# --- nombres de país (es/en) — mismo criterio que build_origenes.py -----------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    return json.loads(m.group(1)) if m else {}
CN = load_country_names()
HIST = {"CSK": ("Checoslovaquia", "Czechoslovakia"), "YUG": ("Yugoslavia", "Yugoslavia"),
        "SUN": ("Unión Soviética", "Soviet Union"), "DDR": ("Alemania Oriental", "East Germany"),
        "SCG": ("Serbia y Montenegro", "Serbia and Montenegro"),
        # COD e IDN usan su nombre moderno (country-names.js): el nodo abarca varias
        # épocas (COD = Zaire 1974 + RD Congo 2026), así que va el nombre actual.
        # Naciones del Reino Unido (no están en country-names.js, que es ISO-3166).
        "ENG": ("Inglaterra", "England"), "SCO": ("Escocia", "Scotland"),
        "WAL": ("Gales", "Wales"), "NIR": ("Irlanda del Norte", "Northern Ireland")}

# --- confederación FIFA por iso (desde data-clubage.js) — igual que origenes ---
def load_confed():
    txt = (ROOT / "data-clubage.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+DATA_CLUBAGE\s*=\s*(\{.*?\});", txt, re.S)
    d = json.loads(m.group(1)) if m else {}
    out = {iso: v.get("confed") for iso, v in d.items() if v.get("confed")}
    out.update({"GBR": "UEFA", "ENG": "UEFA", "SCO": "UEFA", "WAL": "UEFA", "NIR": "UEFA",
                "CSK": "UEFA", "YUG": "UEFA", "SUN": "UEFA", "DDR": "UEFA", "SCG": "UEFA",
                "XKX": "UEFA", "IMN": "UEFA", "PSE": "AFC", "CUW": "CONCACAF",
                "RUS": "UEFA", "SRB": "UEFA", "CZE": "UEFA", "GRC": "UEFA", "CPV": "CAF"})
    return out
CONFED = load_confed()

def nm(iso):
    if iso in HIST: return list(HIST[iso])
    c = CN.get(iso, {})
    return [c.get("es") or c.get("en") or iso, c.get("en") or iso]

# --- nacionalidad del DT (texto EN de jfjelstul) -> iso3 ----------------------
# Explícito y exhaustivo (70 valores) para no depender de variantes de nombre.
# El lado "selección dirigida" usa team_code, que jfjelstul ya da en ISO3.
NAT2ISO = {
    "Algeria": "DZA", "Angola": "AGO", "Argentina": "ARG", "Australia": "AUS",
    "Austria": "AUT", "Belgium": "BEL", "Bolivia": "BOL", "Bosnia and Herzegovina": "BIH",
    "Brazil": "BRA", "Bulgaria": "BGR", "Cameroon": "CMR", "Chile": "CHL",
    "Colombia": "COL", "Costa Rica": "CRI", "Croatia": "HRV", "Cuba": "CUB",
    "Czech Republic": "CZE", "Czechoslovakia": "CSK", "Denmark": "DNK",
    "East Germany": "DDR", "Egypt": "EGY", "El Salvador": "SLV", "England": "ENG",
    "France": "FRA", "Germany": "DEU", "Ghana": "GHA", "Greece": "GRC", "Haiti": "HTI",
    "Honduras": "HND", "Hungary": "HUN", "Iceland": "ISL", "Iran": "IRN", "Israel": "ISR",
    "Italy": "ITA", "Japan": "JPN", "Mexico": "MEX", "Morocco": "MAR", "Netherlands": "NLD",
    "New Zealand": "NZL", "Nigeria": "NGA", "North Korea": "PRK", "Northern Ireland": "NIR",
    "Norway": "NOR", "Paraguay": "PRY", "Peru": "PER", "Poland": "POL", "Portugal": "PRT",
    "Republic of Ireland": "IRL", "Romania": "ROU", "Russia": "RUS", "Saudi Arabia": "SAU",
    "Scotland": "SCO", "Senegal": "SEN", "Serbia": "SRB", "Serbia and Montenegro": "SCG",
    "Slovakia": "SVK", "Slovenia": "SVN", "South Africa": "ZAF", "South Korea": "KOR",
    "Soviet Union": "SUN", "Spain": "ESP", "Sweden": "SWE", "Switzerland": "CHE",
    "Tunisia": "TUN", "Turkey": "TUR", "Ukraine": "UKR", "United States": "USA",
    "Uruguay": "URY", "Wales": "WAL", "Yugoslavia": "YUG",
}

# --- leer appointments (solo Mundial masculino) ------------------------------
rows = [r for r in csv.DictReader(open(SRC / "manager_appointments.csv", encoding="utf-8"))
        if "Men's" in r["tournament_name"]]

total_all = defaultdict(int)
total_exp = defaultdict(int)
team_all = defaultdict(lambda: defaultdict(int))   # nat_iso -> {year: n}
team_exp = defaultdict(lambda: defaultdict(int))
flows = defaultdict(lambda: defaultdict(int))      # year -> {(nat_iso, sel_iso): n}
teams_wc = defaultdict(set)                         # year -> {selecciones que dirigió alguien}
missing = set()

for r in rows:
    y = int(r["tournament_id"].split("-")[1])
    sel = (r.get("team_code") or "").strip()           # selección dirigida (ya iso3)
    if sel:
        teams_wc[y].add(sel)
    nat = NAT2ISO.get((r.get("country_name") or "").strip())
    if not nat:
        missing.add((r.get("country_name") or "").strip())
        continue
    total_all[y] += 1
    team_all[nat][y] += 1
    if nat != sel:                                      # dirige a OTRA selección = exportado
        total_exp[y] += 1
        team_exp[nat][y] += 1
        flows[y][(nat, sel)] += 1

# --- 2026: suplemento manual (jfjelstul corta en 2022) -----------------------
# managers_2026.csv: una fila por selección (team_iso, nat_iso ya en ISO3).
# Mundial aún no jugado → DTs actuales (ver col `src`: wiki=verificado en
# Wikipedia, draft/verify=compilado a mano, revisar). Mismo esquema que arriba.
sup = SRC / "managers_2026.csv"
n2026 = 0
if sup.exists():
    for r in csv.DictReader(open(sup, encoding="utf-8")):
        sel = (r.get("team_iso") or "").strip()
        nat = (r.get("nat_iso") or "").strip()
        if not sel or not nat:
            continue
        y = 2026
        teams_wc[y].add(sel)
        total_all[y] += 1
        team_all[nat][y] += 1
        n2026 += 1
        if nat != sel:
            total_exp[y] += 1
            team_exp[nat][y] += 1
            flows[y][(nat, sel)] += 1

years = sorted(total_all)

# --- armar teams (nacionalidades de DT), ordenadas por total histórico --------
team_tot = {iso: sum(team_all[iso].values()) for iso in team_all}
teams = []
isos_used = set()
for iso in sorted(team_tot, key=lambda k: (-team_tot[k], k)):
    isos_used.add(iso)
    teams.append({
        "iso3": iso,
        "all": [[y, team_all[iso][y]] for y in sorted(team_all[iso])],
        "exp": [[y, team_exp[iso][y]] for y in sorted(team_exp[iso])],
    })

# --- flows para el Sankey -----------------------------------------------------
flows_out = {}
for y in years:
    items = sorted(flows[y].items(), key=lambda kv: -kv[1])
    arr = []
    for (nat, sel), n in items:
        arr.append([nat, sel, n])
        isos_used.add(nat); isos_used.add(sel)
    if arr:
        flows_out[str(y)] = arr

# selecciones dirigidas también necesitan nombre/confed (aparecen en el Sankey)
for y in years:
    for sel in teams_wc[y]:
        isos_used.add(sel)

# --- names + confed solo de los iso usados -----------------------------------
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
    "teams_wc": {str(y): sorted(teams_wc[y]) for y in years},
}
js = "// Generado por data-sources/build_dts.py — NO editar a mano.\n"
js += "// Nacionalidad de los DTs por Mundial + flujos de migración del banquillo.\n"
js += "const DTS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log ----------------------------------------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | nacionalidades: {len(teams)} | Mundiales: {len(years)}")
print(f"   appointments: {sum(total_all.values())} | exportados: {sum(total_exp.values())} "
      f"({100*sum(total_exp.values())/max(1,sum(total_all.values())):.0f}%)")
print(f"   2022: {total_all[2022]} DTs, {total_exp[2022]} exportados | "
      f"2026: {total_all.get(2026,0)} DTs, {total_exp.get(2026,0)} exportados ({n2026} del suplemento)")
miss2 = [m for m in missing if m]
if miss2: print(f"   ⚠ nacionalidades sin mapear: {sorted(miss2)}")
nocon = [iso for iso in isos_used if confed[iso] == "OTRO"]
if nocon: print(f"   ⚠ iso sin confederación: {sorted(nocon)}")
# top exportadores histórico
exp_tot = {t["iso3"]: sum(p[1] for p in t["exp"]) for t in teams}
top = sorted(exp_tot, key=lambda k: -exp_tot[k])[:8]
print("   top exportadores de DTs:", [(iso, exp_tot[iso]) for iso in top])
