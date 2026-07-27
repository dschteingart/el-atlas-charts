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
  PRIO_FOTO[ind][wave]   = [[iso3, pct, year, n], ...] ordenado ASC por pct
  PRIO_WAVES   = [{w, label}, ...] olas presentes, de la más vieja a la más nueva
  PRIO_REGION[iso3] = "region"                    (unión de ambos indicadores)

PRIO_FOTO es la FOTO POR OLA que consume la vista de comparación (chart 14): el
mismo criterio que el resto del número (vecinos/barrio), no "el último dato de
cada país". OJO: dentro de una misma ola los países salieron a campo en años
distintos (ARG 2017, URY 2022), por eso cada fila lleva SU año — el chart lo
muestra en el tooltip y lo aclara en las fuentes.
"""
import pandas as pd, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ivs_discrim_largo.csv")
OUT = os.path.join(HERE, "..", "data-prioridad.js")

VAR2IND = {"C002": "origen", "C001": "genero"}   # slug del toggle
INDS = ["origen", "genero"]
MIN_N = 200
# Etiquetas de período por ola: MISMO criterio que tools/make_waves.py (WV_META
# en data-waves.js). Una sola verdad para todo el número.
WAVE_LABEL = {1: "1981-1984", 2: "1989-1993", 3: "1994-1998", 4: "1999-2004",
              5: "2005-2010", 6: "2010-2014", 7: "2017-2022"}
MIN_COUNTRIES = 8   # olas con muy pocos países no valen para un ranking

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

# --- FOTO por ola: PRIO_FOTO[ind][wave] = [[iso3, pct, year, n], ...] asc pct ---
# En la fuente hay a lo sumo UNA fila por (var, iso3, ola): el pipeline de
# ivs_discrim_largo.csv ya combinó EVS+WVS (columna 'studies'). No se promedia
# nada acá ni se completa ningún país que no midió en esa ola.
foto = {ind: {} for ind in INDS}
waves_present = set()
for (ind, wave), g in sub.groupby(["ind", "wave"]):
    rows = [[r.iso3, round(float(r.pct), 1), int(r.year), int(r.n)] for r in g.itertuples()]
    if len(rows) < MIN_COUNTRIES:
        continue
    rows.sort(key=lambda r: r[1])          # ASC por pct
    foto[ind][int(wave)] = rows
    waves_present.add(int(wave))

waves_meta = [{"w": w, "label": WAVE_LABEL[w]} for w in sorted(waves_present)]
foto = {ind: {str(w): foto[ind][w] for w in sorted(foto[ind])} for ind in INDS}

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
    "// El Atlas N°4 — \"Primero los de acá\" (prioridad en el empleo, olas 2-7 del IVS).",
    "// GENERADO por tools/make_prioridad.py — no editar a mano.",
    "// PRIO_SERIES[ind][iso3] = [[year, pct, n], ...]  (vista Evolución, chart 7)",
    "// PRIO_FOTO[ind][wave]   = [[iso3, pct, year, n], ...] asc por pct (vista Comparación, chart 14)",
    "// ind: 'origen' (C002, nativos>inmigrantes) | 'genero' (C001, varones>mujeres).",
    "// pct = %{1=Agree} sobre {1,2,3} (IVS EVS+WVS, pond. S017, n>=200). Dentro de una",
    "// misma ola el año difiere por país: cada fila lleva el suyo.",
    "const PRIO_META = " + json.dumps(meta, ensure_ascii=False) + ";",
    "const PRIO_WAVES = " + json.dumps(waves_meta, ensure_ascii=False) + ";",
    "const PRIO_SERIES = " + json.dumps(series, ensure_ascii=False, separators=(",", ":")) + ";",
    "const PRIO_FOTO = " + json.dumps(foto, ensure_ascii=False, separators=(",", ":")) + ";",
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
print(f"  olas: {[m['w'] for m in waves_meta]} -> {[m['label'] for m in waves_meta]}")
for ind in INDS:
    print(f"  PRIO_FOTO[{ind}]: " + ", ".join(f"ola {w}={len(foto[ind][w])}" for w in foto[ind]))

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

# 6) PRIO_FOTO: consistencia con PRIO_SERIES (mismo universo de celdas) y con
#    los valores esperados de la comparación (chart 14).
cells_foto_o = sum(len(v) for v in foto["origen"].values())
cells_foto_g = sum(len(v) for v in foto["genero"].values())
print(f"PRIO_FOTO celdas: origen={cells_foto_o} (== {cells_o}), genero={cells_foto_g} (== {cells_g})")
ok &= (cells_foto_o == cells_o and cells_foto_g == cells_g)

def foto_get(ind, w, iso):
    for r in foto[ind][str(w)]:
        if r[0] == iso:
            return r
    return None

for ind, w, iso, exp in [("origen", 7, "ARG", 63.5), ("origen", 7, "SWE", 11.5),
                         ("origen", 2, "ARG", 60.3)]:
    r = foto_get(ind, w, iso)
    got = r[1] if r else None
    print(f"PRIO_FOTO[{ind}][{w}] {iso} = {got} (esp {exp}), año={r[2] if r else None}"
          f" -> {'OK' if got == exp else 'FALLA'}")
    ok &= (got == exp)

# SWE ola 7 tiene que estar entre los más bajos del mundo.
w7 = foto["origen"]["7"]
pos_swe = [i for i, r in enumerate(w7) if r[0] == "SWE"]
print(f"SWE en 'origen' ola 7: puesto {pos_swe[0] + 1} de {len(w7)} de abajo hacia arriba "
      f"(1 = el más bajo)")
ok &= bool(pos_swe) and pos_swe[0] < 8

# orden ASC por pct en TODAS las olas de ambos indicadores
mono = all(all(rows[i][1] <= rows[i + 1][1] for i in range(len(rows) - 1))
           for ind in INDS for rows in foto[ind].values())
print(f"PRIO_FOTO ordenado ASC por pct en todas las olas: {mono}")
ok &= mono

# etiquetas de ola == las de data-waves.js (WV_META)
waves_js = os.path.join(HERE, "..", "data-waves.js")
if os.path.exists(waves_js):
    import re
    txt = open(waves_js, encoding="utf-8").read()
    m = re.search(r"const WV_META = (\[.*?\]);", txt, re.S)
    wv = {d["w"]: d["label"] for d in json.loads(m.group(1))}
    same = all(wv.get(d["w"]) == d["label"] for d in waves_meta)
    print(f"etiquetas de ola == WV_META de data-waves.js: {same} "
          f"({ {d['w']: d['label'] for d in waves_meta} })")
    ok &= same

print("\nRESULTADO:", "TODO OK" if ok else "HAY DISCREPANCIAS")
