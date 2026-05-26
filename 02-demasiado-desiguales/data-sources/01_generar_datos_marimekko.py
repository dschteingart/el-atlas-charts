"""
Genera los datos del Gráfico 1 (marimekko ranking de Gini, El Atlas N°2).

Para cada año del slider (2000-2024), para cada país:
  - busca el último Gini observado dentro de los 15 años previos
  - reporta Gini original (por consumo o ingreso, según mida cada país)
  - reporta Gini ajustado (consumo × 1,13 cuando aplica)

Salida: data_marimekko.json con datos por año + promedios regionales.

Input: pip_gini_deciles_observados.csv (en 2_datos_fuente/)
"""

import csv
import json
from collections import defaultdict

INPUT = "../2_datos_fuente/pip_gini_deciles_observados.csv"
OUTPUT = "data_marimekko.json"
SLIDER_YEARS = list(range(2000, 2025))
WINDOW = 15  # años hacia atrás

# 1) Leer todos los Ginis observados por (país, año), priorizando national > urban > rural
rows_all = defaultdict(dict)  # country_code -> {year: row}
priority = {"national": 3, "urban": 2, "rural": 1}

with open(INPUT) as f:
    for row in csv.DictReader(f):
        try:
            yr = int(row["year"])
        except ValueError:
            continue
        c = row["country_code"]
        lvl = row["reporting_level"]
        if yr not in rows_all[c] or priority.get(lvl, 0) > priority.get(rows_all[c][yr]["reporting_level"], 0):
            rows_all[c][yr] = row

# 2) Para cada año del slider y cada país, el último dato dentro de la ventana
data_by_year = {}
for syear in SLIDER_YEARS:
    countries = []
    for c, year_rows in rows_all.items():
        valid = [y for y in year_rows if (syear - WINDOW + 1) <= y <= syear]
        if not valid:
            continue
        latest = max(valid)
        row = year_rows[latest]
        try:
            gini = float(row["gini"]) * 100
        except ValueError:
            continue
        welfare = row["welfare_type"]
        gini_adj = gini * 1.13 if welfare == "consumption" else gini
        countries.append({
            "code": c,
            "name": row["country_name"],
            "region": row["region_name"],
            "year": latest,
            "welfare": welfare,
            "level": row["reporting_level"],
            "gini_raw": round(gini, 2),
            "gini_adj": round(gini_adj, 2),
        })
    data_by_year[syear] = countries

# 3) Promedio simple regional por año y por modo
regional_avg = {}
for syear, countries in data_by_year.items():
    by_reg = defaultdict(list)
    for c in countries:
        by_reg[c["region"]].append(c)
    regional_avg[syear] = {
        "raw": {reg: round(sum(c["gini_raw"] for c in cs) / len(cs), 2)
                for reg, cs in by_reg.items()},
        "adj": {reg: round(sum(c["gini_adj"] for c in cs) / len(cs), 2)
                for reg, cs in by_reg.items()},
    }

# 4) Guardar
with open(OUTPUT, "w") as f:
    json.dump({
        "data_by_year": data_by_year,
        "regional_avg": regional_avg,
        "years": SLIDER_YEARS,
    }, f, ensure_ascii=False)

print(f"OK · {OUTPUT}")
print(f"  Países en 2024: {len(data_by_year[2024])}")
print(f"  Países en 2010: {len(data_by_year[2010])}")
print()
print("Promedios regionales 2024 (Gini ajustado):")
for reg, v in sorted(regional_avg[2024]["adj"].items(), key=lambda x: -x[1]):
    print(f"  {reg}: {v}")
