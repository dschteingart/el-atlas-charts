# -*- coding: utf-8 -*-
"""Genera data-prioridad.js: CHART 7 — "Primero los de acá" (líneas históricas 1990-2023).

Clon de datos de la película (data-pelicula.js), pero con TOGGLE de indicador en vez
de select de categoría. Dos indicadores de la misma batería "si escasea el trabajo…":
  origen (C002): prioridad a los NATIVOS sobre los inmigrantes
  genero (C001): prioridad a los VARONES sobre las mujeres

Indicador = %{1=Agree} sobre {1,2,3} (el "Neither" QUEDA en el denominador),
ponderado por S017, celdas con n>=200. Eje X en AÑO REAL (las olas no coinciden
entre países). Fuente: IVS (EVS+WVS), ya agregada en tools/ivs_discrim_largo.csv
(pct por iso3×ola×var; ese pipeline ya aplicó el peso, el denominador {1,2,3} y el
filtro n>=200; acá se reproduce el chequeo).

OJO: prohibido C002_01/C001_01 (versión de 5 puntos): en AR/BR/NG/US vienen con la
escala de 3 puntos recodificada, así que "% muy de acuerdo" da 0,0% por construcción.
Se usan siempre C002/C001.

Estructura de salida (arrays compactos, constantes en MAYÚSCULAS):
  PRIO_META    = {inds, vars, years, yearRange}  (metadatos + años)
  PRIO_SERIES[ind][iso3] = [[year, pct, n], ...]  serie ordenada por año
  PRIO_REGION[iso3] = "region"                    (unión de ambos indicadores)
"""
import pandas as pd, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ivs_discrim_largo.csv")
OUT = os.path.join(HERE, "..", "data-prioridad.js")

VAR2IND = {"C002": "origen", "C001": "genero"}   # slug del toggle
INDS = ["origen", "genero"]
MIN_N = 200

largo = pd.read_csv(SRC)
sub = largo[largo["var"].isin(VAR2IND)].copy()
sub["ind"] = sub["var"].map(VAR2IND)
sub = sub[sub["n"] >= MIN_N]                       # guarda (en la base ya cumplen todos)

# --- series por indicador y país: [[year, pct, n], ...] ordenadas por año real ---
series = {ind: {} for ind in INDS}
for (ind, iso3), g in sub.groupby(["ind", "iso3"]):
    g = g.sort_values("year")
    pts = [[int(r.year), round(float(r.pct), 1), int(r.n)] for r in g.itertuples()]
    series[ind][iso3] = pts

# --- región por país (unión de ambos indicadores) ---
region_map = dict(sub.drop_duplicates("iso3")[["iso3", "region"]].values.tolist())
region_map = {k: region_map[k] for k in sorted(region_map)}

# --- metadatos ---
years = sorted(int(y) for y in sub["year"].unique())
meta = {
    "inds": INDS,
    "vars": {"origen": "C002", "genero": "C001"},   # provenance IVS
    "years": years,
    "yearRange": [years[0], years[-1]],
}

# --- reordenar SERIES por iso para salida determinística ---
series = {ind: {iso: series[ind][iso] for iso in sorted(series[ind])} for ind in INDS}

out = [
    "// El Atlas N°5 — Chart 7: \"Primero los de acá\" (prioridad a los nativos, 1990-2023).",
    "// GENERADO por tools/make_prioridad.py — no editar a mano.",
    "// PRIO_SERIES[ind][iso3] = [[year, pct, n], ...]. ind: 'origen' (C002, nativos>inmigrantes)",
    "// | 'genero' (C001, varones>mujeres). pct = %{1=Agree} sobre {1,2,3} (IVS EVS+WVS, pond. S017, n>=200).",
    "const PRIO_META = " + json.dumps(meta, ensure_ascii=False) + ";",
    "const PRIO_SERIES = " + json.dumps(series, ensure_ascii=False, separators=(",", ":")) + ";",
    "const PRIO_REGION = " + json.dumps(region_map, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";",
]
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")

n_o = len(series["origen"]); n_g = len(series["genero"])
cells_o = sum(len(v) for v in series["origen"].values())
cells_g = sum(len(v) for v in series["genero"].values())
print(f"data-prioridad.js -> {os.path.getsize(OUT)/1024:.0f}KB")
print(f"  origen(C002): {n_o} paises, {cells_o} celdas | genero(C001): {n_g} paises, {cells_g} celdas")
print(f"  años: {years[0]}-{years[-1]}")

# ================== VERIFICACIÓN contra el brief ==================
print("\n== VERIFICACIÓN ==")
ok = True

def get(ind, iso, year):
    for y, p, n in series[ind].get(iso, []):
        if y == year:
            return p
    return None

# 1) Argentina C002 (origen), serie completa
arg_o = {y: p for y, p, n in series["origen"]["ARG"]}
exp_o = {1991: 60.3, 1995: 77.6, 1999: 73.8, 2006: 71.9, 2013: 51.8, 2017: 63.5}
print("ARG origen (C002):", arg_o)
for y, e in exp_o.items():
    got = arg_o.get(y); ok &= (got == e)
    print(f"   {y}: {got} == {e}  -> {'OK' if got==e else 'FALLA'}")

# 2) Argentina C001 (genero): 1991=24,3 -> 2017=13,8
a91 = get("genero", "ARG", 1991); a17 = get("genero", "ARG", 2017)
print(f"ARG genero (C001): 1991={a91} (esp 24.3), 2017={a17} (esp 13.8)")
ok &= (a91 == 24.3 and a17 == 13.8)

# 3) Panel balanceado 6 LatAm (origen): olas via año — 1995~80.7, 2006~77.1, 2013~66.2, 2017~62.0
#    (los años representativos de cada ola en el panel LatAm)
six = ["ARG", "BRA", "CHL", "MEX", "PER", "URY"]
# reconstruir por ola usando la tabla larga para agrupar por ola (no por año, que difiere por país)
panel = largo[(largo["var"] == "C002") & (largo.iso3.isin(six))]
piv = panel.pivot_table(index="iso3", columns="wave", values="pct")
bal = piv[[3, 5, 6, 7]].dropna()
means = {w: round(bal[w].mean(), 1) for w in [3, 5, 6, 7]}
exp_panel = {3: 80.7, 5: 77.1, 6: 66.2, 7: 62.0}
print(f"Panel balanceado 6 LatAm (olas 3/5/6/7): {means} (esp {exp_panel}) "
      f"paises={list(bal.index)}")
ok &= (means == exp_panel)

# 4) 1991: ARG 22 pp por debajo de BRA/CHL/MEX
w2 = panel[panel.wave == 2].set_index("iso3").pct
arg2 = round(float(w2["ARG"]), 1)
bcm = round(float(w2[["BRA", "CHL", "MEX"]].mean()), 1)
print(f"1991: ARG={arg2} vs BRA/CHL/MEX={bcm} -> brecha {round(bcm-arg2,1)} pp (esp ~22)")
ok &= (abs((bcm - arg2) - 22.0) < 0.6)

# 5) conteos
print(f"conteos: origen paises={n_o} (esp 115), celdas={cells_o} (esp 390); "
      f"genero paises={n_g} (esp 117)")
ok &= (n_o == 115 and cells_o == 390 and n_g == 117)

print("\nRESULTADO:", "TODO OK" if ok else "HAY DISCREPANCIAS")
