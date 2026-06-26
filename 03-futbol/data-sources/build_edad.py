# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart: evolución de la EDAD de los mundialistas
# =============================================================
# ¿Los planteles mundialistas envejecen? ¿Qué puesto es el más veterano?
# Clon (reducido) del chart de altura: misma estructura de datos y renderer,
# PERO sin la capa "real vs esperada" (no existe una "edad esperada" de la
# población) ni el scatter país-vs-plantel. Tres miradas en el renderer:
#   - Forma:    línea (edad promedio por Mundial) ↔ boxplot (distribución).
#   - Desglose: total / por selección / por puesto (arquero/defensor/medio/delantero).
#
# Salida: 03-futbol/data-edad.js  (const EDAD, MISMA forma que ALTURA salvo
# que cada stat trae solo {n, act, box}, sin exp).
import csv, json, re
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
SRC = HERE / "mundiales"
ROOT = HERE.parent
OUT = ROOT / "data-edad.js"

POS_MAP = {"goal keeper": "GK", "defender": "DEF", "midfielder": "MID", "forward": "FWD"}

# --- nombres de país (es/en) para el selector de selecciones --------------------
def load_country_names():
    txt = (ROOT / "country-names.js").read_text(encoding="utf-8")
    m = re.search(r"const\s+COUNTRY_NAMES\s*=\s*(\{.*?\})\s*;", txt, re.S)
    return json.loads(m.group(1)) if m else {}
CN = load_country_names()

# --- recorrer el master ---------------------------------------------------------
rows = list(csv.DictReader(open(SRC / "master_consolidado.csv", encoding="utf-8")))

# acumuladores: lista de edades por grupo y año
overall = defaultdict(list)                                       # year -> [edades]
teams = defaultdict(lambda: defaultdict(list))                    # code -> year -> [edades]
positions = defaultdict(lambda: defaultdict(list))               # pos -> year -> [edades]
team_pos = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))  # code -> pos -> year -> [edades]
team_name = {}                                                    # code -> nombre legible (último)

for r in rows:
    y = int(r["year"])
    tc = (r.get("team_code") or "").strip()
    if tc:
        team_name[tc] = (r.get("team") or tc).strip()           # se queda el más reciente
    e = (r.get("edad") or "").strip()
    edad = None
    if e:
        try: edad = float(e)
        except ValueError: edad = None
    if edad is None:
        continue
    overall[y].append(edad)
    if tc: teams[tc][y].append(edad)
    p = POS_MAP.get((r.get("posicion") or "").strip())
    if p:
        positions[p][y].append(edad)
        if tc: team_pos[tc][p][y].append(edad)

# --- estadísticos por grupo-año -------------------------------------------------
def quantile(sorted_vals, q):
    if not sorted_vals: return None
    n = len(sorted_vals)
    if n == 1: return sorted_vals[0]
    pos = q * (n - 1); lo = int(pos); frac = pos - lo
    if lo + 1 < n:
        return sorted_vals[lo] * (1 - frac) + sorted_vals[lo + 1] * frac
    return sorted_vals[lo]

def stat(vals):
    s = sorted(vals)
    out = {"n": len(vals)}
    if vals:
        out["act"] = round(sum(vals) / len(vals), 1)
        out["box"] = [round(quantile(s, q), 1) for q in (0.0, 0.25, 0.5, 0.75, 1.0)]
    return out

years = sorted(overall)
overall_out = {str(y): stat(overall[y]) for y in years}
teams_out = {tc: {str(y): stat(byy[y]) for y in sorted(byy)} for tc, byy in teams.items()}
positions_out = {p: {str(y): stat(positions[p][y]) for y in sorted(positions[p])} for p in positions}

# nombres de selección (es/en): preferimos COUNTRY_NAMES por iso; fallback al label del torneo.
# Algunos team_code vienen con código FIFA (no ISO3); se alias-an al ISO3 correcto.
NAME_ALIAS = {"ALG": "DZA"}
def team_label(tc):
    c = CN.get(tc) or CN.get(NAME_ALIAS.get(tc, "")) or {}
    es = c.get("es") or team_name.get(tc, tc)
    en = c.get("en") or team_name.get(tc, tc)
    return [es, en]
team_names_out = {tc: team_label(tc) for tc in teams_out}

# edad promedio por selección × puesto × año (para "Por puesto" filtrado por país).
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
    "teamPos": teampos_out,          # code -> pos -> {year: edad promedio}
    "teamNames": team_names_out,
}
js = "// Generado por data-sources/build_edad.py — NO editar a mano.\n"
js += "// Edad de los mundialistas por Mundial (promedio + distribución), por selección y puesto.\n"
js += "const EDAD = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")

# --- log ------------------------------------------------------------------------
print(f"OK: {OUT.stat().st_size//1024} KB | selecciones: {len(teams_out)} | Mundiales: {len(years)}")
def avg(yr):
    o = overall_out.get(str(yr), {})
    return f"{yr}: edad prom {o.get('act','s/d')} (n={o.get('n',0)})" if o else f"{yr}: s/d"
for yr in [1930, 1950, 1970, 1990, 1998, 2010, 2022, 2026]:
    print("  ", avg(yr))
# puesto más veterano (promedio sobre todos los años, ponderado por n)
pos_tot = {}
for p, byy in positions.items():
    allv = [v for ys in byy.values() for v in ys]
    if allv: pos_tot[p] = round(sum(allv) / len(allv), 1)
print("   edad prom por puesto (histórico):", pos_tot)
