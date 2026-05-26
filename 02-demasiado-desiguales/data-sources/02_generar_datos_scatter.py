"""
Genera los datos del Gráfico 2 (scatter Gini vs PIB pc, El Atlas N°2).

Para cada año Y entre 2010 y 2025 (snapshot del slider), aplica la lógica
de "ventana de 15 años hacia atrás" (igual que el marimekko):
  - Para cada país, toma la última observación de Gini con year_obs en
    [Y-15, Y]. Si no hay observación en esa ventana, el país no aparece
    en ese año.
  - El PIB pc se busca del MISMO año del Gini (o el más cercano dentro
    de ±3 años) — match temporal país × año.
  - Sobre el dataset resultante del año Y, calcula:
      * Regresión LINEAL:    Gini_adj = a + b·ln(PIBpc)
      * Regresión CUADRÁTICA: Gini_adj = a + b·ln(PIBpc) + c·ln(PIBpc)²
    (la cuadrática es la forma Kuznets).
  - Residuos absolutos (pp) y porcentuales por país y por región, ambas
    variantes (linear y quadratic).

Salida:
  - data_scatter.json: {
      data_by_year: { "2010": {points, n, linear, quadratic}, ... },
      years: [...],   // años disponibles para el slider
      latest_year: 2025
    }

Inputs:
  - pip_gini_deciles_observados.csv (en 2_datos_fuente/)
  - gdp_per_capita_worldbank.zip → gdp-per-capita-worldbank.csv
"""

import csv
import math
import json
import zipfile
import io
from collections import defaultdict

import numpy as np

PIP_FILE = "pip_gini_deciles_observados.csv"
GDP_ZIP = "gdp_per_capita_worldbank.zip"
OUTPUT = "data-scatter.json"
WINDOW = 15
YEAR_MIN = 2010
YEAR_MAX = 2025
MIN_POINTS_PER_YEAR = 30  # para que las regresiones tengan sentido

# 1) PIB pc por (code, year)
gdp = {}
with zipfile.ZipFile(GDP_ZIP) as zf:
    with zf.open("gdp-per-capita-worldbank.csv") as f:
        reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"))
        for row in reader:
            try:
                gdp[(row["Code"], int(row["Year"]))] = float(row["GDP per capita"])
            except (ValueError, KeyError):
                continue

# 2) TODAS las observaciones de Gini desde 2010, por (country, year, level).
# Priorizamos reporting_level cuando hay duplicados en un mismo año.
priority = {"national": 3, "urban": 2, "rural": 1}
all_obs = defaultdict(dict)  # code -> {year -> row}
country_meta = {}             # code -> {name, region}

with open(PIP_FILE, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        try:
            yr = int(row["year"])
        except ValueError:
            continue
        if yr < (YEAR_MIN - WINDOW):
            continue
        c = row["country_code"]
        country_meta[c] = {"name": row["country_name"], "region": row["region_name"]}
        existing = all_obs[c].get(yr)
        if existing is None:
            all_obs[c][yr] = row
        else:
            ex_pref = priority.get(existing["reporting_level"], 0)
            new_pref = priority.get(row["reporting_level"], 0)
            if new_pref > ex_pref:
                all_obs[c][yr] = row

def find_gdp(c, yr):
    """PIB pc para (country, year). Match exacto o nearest dentro de ±3."""
    if (c, yr) in gdp:
        return gdp[(c, yr)]
    years_for_c = [y for (code, y) in gdp.keys() if code == c]
    if not years_for_c:
        return None
    nearest = min(years_for_c, key=lambda y: abs(y - yr))
    if abs(nearest - yr) > 3:
        return None
    return gdp[(c, nearest)]

def build_point(c, yr, row):
    try:
        gini = float(row["gini"]) * 100
    except ValueError:
        return None
    welfare = row["welfare_type"]
    gini_adj = gini * 1.13 if welfare == "consumption" else gini
    pib = find_gdp(c, yr)
    if pib is None or pib <= 0:
        return None
    return {
        "code": c,
        "name": country_meta[c]["name"],
        "region": country_meta[c]["region"],
        "year": yr,
        "welfare": welfare,
        "gini_raw": round(gini, 2),
        "gini_adj": round(gini_adj, 2),
        "gdp_pc": round(pib, 1),
    }

def fit_year(points):
    """Calcula linear + quadratic + residuos para un set de puntos."""
    n = len(points)
    X = [math.log(p["gdp_pc"]) for p in points]
    Y = [p["gini_adj"] for p in points]
    mx, my = sum(X)/n, sum(Y)/n
    # Lineal
    ss_xy = sum((X[i]-mx)*(Y[i]-my) for i in range(n))
    ss_xx = sum((X[i]-mx)**2 for i in range(n))
    b_lin = ss_xy / ss_xx
    a_lin = my - b_lin * mx
    ss_res_lin = sum((Y[i] - (a_lin + b_lin*X[i]))**2 for i in range(n))
    ss_tot = sum((Y[i]-my)**2 for i in range(n))
    r2_lin = 1 - ss_res_lin / ss_tot if ss_tot > 0 else 0
    # Cuadrática (Kuznets)
    sX = sum(X); sX2 = sum(x**2 for x in X); sX3 = sum(x**3 for x in X); sX4 = sum(x**4 for x in X)
    sY = sum(Y); sXY = sum(X[i]*Y[i] for i in range(n)); sX2Y = sum(X[i]**2 * Y[i] for i in range(n))
    A = np.array([[n, sX, sX2], [sX, sX2, sX3], [sX2, sX3, sX4]])
    b_vec = np.array([sY, sXY, sX2Y])
    a_q, b_q, c_q = np.linalg.solve(A, b_vec)
    ss_res_q = sum((Y[i] - (a_q + b_q*X[i] + c_q*X[i]**2))**2 for i in range(n))
    r2_q = 1 - ss_res_q / ss_tot if ss_tot > 0 else 0
    # Residuos por punto + por región
    res_l = defaultdict(list); res_q = defaultdict(list)
    res_l_pct = defaultdict(list); res_q_pct = defaultdict(list)
    enriched = []
    for p, xi in zip(points, X):
        pred_l = a_lin + b_lin * xi
        pred_q = a_q + b_q * xi + c_q * xi**2
        r_l = p["gini_adj"] - pred_l
        r_q = p["gini_adj"] - pred_q
        ep = dict(p)
        ep["residual_linear"] = round(r_l, 2)
        ep["residual_quadratic"] = round(r_q, 2)
        enriched.append(ep)
        res_l[p["region"]].append(r_l)
        res_q[p["region"]].append(r_q)
        if pred_l > 0:
            res_l_pct[p["region"]].append(r_l / pred_l * 100)
        if pred_q > 0:
            res_q_pct[p["region"]].append(r_q / pred_q * 100)
    return {
        "points": enriched,
        "n": n,
        "linear": {
            "a": round(a_lin, 4), "b": round(b_lin, 4),
            "r2": round(r2_lin, 3),
            "residuals_pp":  {k: round(sum(v)/len(v), 2) for k, v in res_l.items()},
            "residuals_pct": {k: round(sum(v)/len(v), 1) for k, v in res_l_pct.items()},
        },
        "quadratic": {
            "a": round(a_q, 4), "b": round(b_q, 4), "c": round(c_q, 4),
            "r2": round(r2_q, 3),
            "residuals_pp":  {k: round(sum(v)/len(v), 2) for k, v in res_q.items()},
            "residuals_pct": {k: round(sum(v)/len(v), 1) for k, v in res_q_pct.items()},
        },
    }

# 3) Snapshot por año (ventana 15a)
data_by_year = {}
for Y in range(YEAR_MIN, YEAR_MAX + 1):
    points = []
    for c, year_to_row in all_obs.items():
        # Última obs dentro de [Y-15, Y]
        in_window = [yr for yr in year_to_row if Y - WINDOW <= yr <= Y]
        if not in_window:
            continue
        last_yr = max(in_window)
        pt = build_point(c, last_yr, year_to_row[last_yr])
        if pt is not None:
            points.append(pt)
    if len(points) < MIN_POINTS_PER_YEAR:
        continue
    data_by_year[str(Y)] = fit_year(points)

# 4) Output
output = {
    "data_by_year": data_by_year,
    "years": sorted(int(y) for y in data_by_year.keys()),
    "latest_year": max(int(y) for y in data_by_year.keys()),
}
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

print(f"Anios generados: {output['years'][0]} -> {output['years'][-1]}")
print(f"N por anio:")
for y in output["years"]:
    snap = data_by_year[str(y)]
    print(f"  {y}: N={snap['n']:3d}, R2_lin={snap['linear']['r2']:.3f}, R2_quad={snap['quadratic']['r2']:.3f}")
print(f"\n-> {OUTPUT}")
