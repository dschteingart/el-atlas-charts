# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart: evolución de la altura de los mundialistas
# =============================================================
# ¿Cuánto crecieron (literalmente) los futbolistas mundialistas? Y, sobre todo:
# ¿son más altos que el varón promedio de su país y su generación?
#
# Tres miradas (toggles en el renderer):
#   - Forma:   línea (promedio por Mundial) ↔ boxplot (distribución por Mundial).
#   - Desglose: total / por selección / por puesto (arquero/defensor/medio/delantero).
#   - Comparación: altura real ↔ real vs ESPERADA del país.
#
# Altura ESPERADA: para cada jugador, la altura media de los VARONES de su país
# de NACIMIENTO en su AÑO de nacimiento (= year − edad). El promedio del equipo
# es la media de esos valores (ponderada por la composición de cohortes del
# plantel). Datos: OWID / NCD-RisC "average height by year of birth" (1896-1996).
#
# Huecos de cobertura OWID (resueltos según indicación de Daniel):
#   - Estados disueltos → país ACTUAL donde está la ciudad de nacimiento
#     (Checoslovaquia→Chequia, URSS→Rusia; confirmado por coordenadas).
#   - Territorios sin dato propio en OWID → proxy regional: Kosovo→Serbia,
#     Curazao→Países Bajos (caveat en la nota cuando se muestra Curazao),
#     Isla de Man→Reino Unido.
#   - Nacidos después de 1996 (OWID corta ahí) → extrapolación lineal con la
#     tendencia de los ~20 años previos (1977-1996), anclada en el valor de 1996.
#
# Salida: 03-futbol/data-altura.js
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
OWID = HERE / "owid-height" / "average-height-by-year-of-birth.csv"
ROOT = HERE.parent
OUT = ROOT / "data-altura.js"

EXTRAP_FROM = 1977          # ventana para la pendiente de extrapolación
OWID_LAST = 1996            # último año con dato OWID
POS_MAP = {"goal keeper": "GK", "defender": "DEF", "midfielder": "MID", "forward": "FWD"}

# iso_nacimiento (histórico o sin dato propio en OWID) -> código OWID a usar.
# Disueltos: el país ACTUAL de la ciudad de nacimiento (las coords lo confirman).
# Territorios sin OWID: proxy regional.
OWID_FALLBACK = {
    "CSK": "CZE",   # Checoslovaquia -> Chequia (casos en la base = Praga)
    "SUN": "RUS",   # URSS -> Rusia (caso = Krasny Kut, Rusia)
    "DDR": "DEU",   # Alemania Oriental -> Alemania (por las dudas; no aparece en la base)
    "YUG": "SRB", "SCG": "SRB",   # Yugoslavia / Serbia y Montenegro -> Serbia
    "XKX": "SRB",   # Kosovo (sin OWID) -> proxy Serbia
    "CUW": "NLD",   # Curazao (sin OWID) -> proxy Países Bajos  [caveat]
    "IMN": "GBR",   # Isla de Man -> Reino Unido
}
PROXY_NOTE = {"CUW": "NLD", "XKX": "SRB", "IMN": "GBR"}   # los que el renderer marca como proxy

# Correcciones de altura a errores conocidos de la fuente fcmaps (2026): Wikidata
# da un valor muy distinto y sin esto distorsionan el mín/máx del boxplot.
# Clave = wd_id (Wikidata).
HEIGHT_FIX = {
    "Q501274": 190,   # Ramy Rabia (Egipto, central): fcmaps lo lista en 156 cm; mide ~190.
}

# --- nombres de país (es/en) para el selector de selecciones --------------------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    return json.loads(m.group(1)) if m else {}
CN = load_country_names()

# --- confederación FIFA por team_code (para el scatter altura población vs plantel) -
# Misma fuente y overrides que build_origenes.py: DATA_CLUBAGE trae confed por iso3;
# los códigos futbolísticos e históricos (ENG/SCO/CSK/YUG/SUN…) se completan a mano.
def load_confed():
    txt = (ROOT / "data-clubage.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+DATA_CLUBAGE\s*=\s*(\{.*?\});", txt, re.S)
    d = json.loads(m.group(1)) if m else {}
    out = {iso: v.get("confed") for iso, v in d.items() if v.get("confed")}
    out.update({"GBR": "UEFA", "ENG": "UEFA", "SCO": "UEFA", "WAL": "UEFA", "NIR": "UEFA",
                "CSK": "UEFA", "YUG": "UEFA", "SUN": "UEFA", "DDR": "UEFA", "SCG": "UEFA",
                "XKX": "UEFA", "IMN": "UEFA", "PSE": "AFC", "CUW": "CONCACAF",
                "ALG": "CAF"})   # Argelia aparece con código FIFA (no ISO3 DZA) en el master
    return out
CONFED = load_confed()

# --- OWID: altura media de varones por país (ISO3) y año de nacimiento ----------
owid = defaultdict(dict)            # code -> {year: cm}
for r in csv.DictReader(open(OWID, encoding="utf-8")):
    men = (r.get("Men") or "").strip()
    code = (r.get("Code") or "").strip()
    if not code or not men:
        continue
    try:
        owid[code][int(r["Year"])] = float(men)
    except ValueError:
        pass

# pendiente de los últimos ~20 años por país (regresión lineal simple) para extrapolar
ext_slope = {}
for code, series in owid.items():
    pts = [(y, series[y]) for y in series if EXTRAP_FROM <= y <= OWID_LAST]
    if len(pts) >= 2:
        n = len(pts); sx = sum(p[0] for p in pts); sy = sum(p[1] for p in pts)
        sxx = sum(p[0] * p[0] for p in pts); sxy = sum(p[0] * p[1] for p in pts)
        denom = n * sxx - sx * sx
        ext_slope[code] = (n * sxy - sx * sy) / denom if denom else 0.0

def expected_height(iso, birth_year):
    code = OWID_FALLBACK.get(iso, iso)
    series = owid.get(code)
    if not series:
        return None
    if birth_year in series:
        return series[birth_year]
    if birth_year < min(series):
        return series[min(series)]
    if birth_year > OWID_LAST:                       # extrapolación lineal anclada en 1996
        base = series.get(OWID_LAST)
        if base is None:
            return None
        return base + ext_slope.get(code, 0.0) * (birth_year - OWID_LAST)
    # hueco interno (raro): interpolar al año más cercano disponible
    return series[min(series, key=lambda y: abs(y - birth_year))]

# --- recorrer el master ---------------------------------------------------------
rows = list(csv.DictReader(open(SRC / "master_consolidado.csv", encoding="utf-8")))

# acumuladores: lista de alturas reales y esperadas por grupo y año
def _mk(): return {"act": [], "exp": []}
overall = defaultdict(_mk)                                  # year -> {act:[],exp:[]}
teams = defaultdict(lambda: defaultdict(_mk))              # code -> year -> {...}
positions = defaultdict(lambda: defaultdict(lambda: {"act": []}))  # pos -> year -> {act:[]}
team_pos = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))  # code -> pos -> year -> [alturas]
team_name = {}                                             # code -> nombre legible (último)
team_proxy = defaultdict(set)                              # code -> {iso proxyados} (para caveat)

for r in rows:
    y = int(r["year"])
    tc = (r.get("team_code") or "").strip()
    if tc:
        team_name[tc] = (r.get("team") or tc).strip()     # se queda el más reciente
    h = (r.get("altura_cm") or "").strip()
    height = None
    if h:
        try: height = float(h)
        except ValueError: height = None
    wd = (r.get("wd_id") or "").strip()
    if wd in HEIGHT_FIX: height = float(HEIGHT_FIX[wd])   # corrección de error conocido

    # altura esperada del país de nacimiento en el año de nacimiento
    iso = (r.get("iso_nacimiento") or "").strip()
    edad = (r.get("edad") or "").strip()
    exp = None
    if iso and edad:
        try:
            by = round(y - float(edad))
            exp = expected_height(iso, by)
            if exp is not None and iso in PROXY_NOTE and tc:
                team_proxy[tc].add(iso)
        except ValueError:
            exp = None

    if height is not None:
        overall[y]["act"].append(height)
        if tc: teams[tc][y]["act"].append(height)
        p = POS_MAP.get((r.get("posicion") or "").strip())
        if p:
            positions[p][y]["act"].append(height)
            if tc: team_pos[tc][p][y].append(height)
    if exp is not None:
        overall[y]["exp"].append(exp)
        if tc: teams[tc][y]["exp"].append(exp)

# --- estadísticos por grupo-año -------------------------------------------------
def quantile(sorted_vals, q):
    if not sorted_vals: return None
    n = len(sorted_vals)
    if n == 1: return sorted_vals[0]
    pos = q * (n - 1); lo = int(pos); frac = pos - lo
    if lo + 1 < n:
        return sorted_vals[lo] * (1 - frac) + sorted_vals[lo + 1] * frac
    return sorted_vals[lo]

def stat(act, exp, with_exp=True):
    s = sorted(act)
    out = {"n": len(act)}
    if act:
        out["act"] = round(sum(act) / len(act), 1)
        out["box"] = [round(quantile(s, q), 1) for q in (0.0, 0.25, 0.5, 0.75, 1.0)]
    if with_exp and exp:
        out["exp"] = round(sum(exp) / len(exp), 1)
    return out

years = sorted(overall)
overall_out = {str(y): stat(overall[y]["act"], overall[y]["exp"]) for y in years}
teams_out = {}
for tc, byy in teams.items():
    teams_out[tc] = {str(y): stat(byy[y]["act"], byy[y]["exp"]) for y in sorted(byy)}
positions_out = {p: {str(y): stat(positions[p][y]["act"], None, with_exp=False) for y in sorted(positions[p])}
                 for p in positions}

# nombres de selección (es/en): preferimos COUNTRY_NAMES por iso; fallback al label del torneo
def team_label(tc):
    c = CN.get(tc) or {}
    es = c.get("es") or team_name.get(tc, tc)
    en = c.get("en") or team_name.get(tc, tc)
    return [es, en]
team_names_out = {tc: team_label(tc) for tc in teams_out}
proxies_out = {tc: sorted(v) for tc, v in team_proxy.items() if v}

# confederación FIFA por selección (para colorear el scatter). Las que no
# resuelven quedan fuera y el renderer las pinta en gris neutro.
team_confed_out = {tc: CONFED[tc] for tc in teams_out if CONFED.get(tc)}
_no_confed = [tc for tc in teams_out if not CONFED.get(tc)]

# altura promedio por selección × puesto × año (para "Por puesto" filtrado por país).
# Solo el promedio (no boxplot: por puesto y selección hay pocos jugadores).
teampos_out = {}
for tc, byp in team_pos.items():
    d = {}
    for p, byy in byp.items():
        ser = {str(y): round(sum(vs) / len(vs), 1) for y, vs in byy.items() if vs}
        if ser: d[p] = ser
    if d: teampos_out[tc] = d

data = {
    "years": years,
    "overall": overall_out,
    "teams": teams_out,
    "positions": positions_out,
    "teamPos": teampos_out,          # code -> pos -> {year: altura promedio}
    "teamNames": team_names_out,
    "teamConfed": team_confed_out,   # selección -> confederación FIFA (color del scatter)
    "proxies": proxies_out,          # selección -> isos cuya altura esperada usa proxy (caveat)
    "proxyMap": PROXY_NOTE,
    "owidLast": OWID_LAST,
}
js = "// Generado por data-sources/build_altura.py — NO editar a mano.\n"
js += "// Altura de los mundialistas (real) vs altura esperada del país de nacimiento.\n"
js += "const ALTURA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log ------------------------------------------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | selecciones: {len(teams_out)} | Mundiales: {len(years)}")
print(f"   confed: {len(team_confed_out)}/{len(teams_out)} mapeadas" + (f" | SIN confed: {_no_confed}" if _no_confed else ""))
def gap(yr):
    o = overall_out.get(str(yr), {})
    if "act" in o and "exp" in o:
        return f"{yr}: real {o['act']} cm vs esperada {o['exp']} cm (brecha +{round(o['act']-o['exp'],1)})"
    return f"{yr}: s/d"
for yr in [1930, 1970, 1998, 2026]:
    print("  ", gap(yr))
print("   proxies (selección->iso):", {k: v for k, v in list(proxies_out.items())[:8]})
