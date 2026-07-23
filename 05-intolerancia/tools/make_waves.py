# -*- coding: utf-8 -*-
"""Genera data-waves.js: datos por OLA (para el slider temporal del chart 1).

WV_FOTO[cat][wave] = [[iso3, pct, year, n, evs, wvs], ...] ordenado asc por pct.
  - pct  : combinado EVS+WVS por promedio ponderado por n (una barra por país).
  - evs/wvs : valor individual de cada estudio en esa ola (null si no está) →
    permite ver en el tooltip la consistencia entre ambos.
WV_META = [{w, label}, ...] olas presentes, de más vieja a más nueva.

Ola 7 (2017-2022) == el "último dato >=2017" de VE_FOTO (misma foto).
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")

CATS9 = ["otra_raza","inmigrantes","homosexuales","otra_religion","otro_idioma",
         "parejas_no_casadas","sida","bebedores","drogadictos"]
WAVE_LABEL = {1:"1981-1984", 2:"1989-1993", 3:"1994-1998", 4:"1999-2004",
              5:"2005-2010", 6:"2010-2014", 7:"2017-2022"}
MIN_COUNTRIES = 8   # olas con muy pocos países no valen para un ranking

largo = pd.read_csv(os.path.join(DATA, "ivs_vecinos_largo.csv"))
largo = largo[largo.cat.isin(CATS9)]

wv = {}
waves_present = set()
for cat, gcat in largo.groupby("cat"):
    wv[cat] = {}
    for wave, gw in gcat.groupby("wave"):
        rows = []
        for iso3, g in gw.groupby("iso3"):
            evs = g[g.study == "EVS"]; wvs = g[g.study == "WVS"]
            evs_pct = round(float(np.average(evs.pct, weights=evs.n)), 1) if len(evs) else None
            wvs_pct = round(float(np.average(wvs.pct, weights=wvs.n)), 1) if len(wvs) else None
            pct = round(float(np.average(g.pct, weights=g.n)), 1)     # combinado ponderado
            year = int(np.round(np.average(g.year, weights=g.n)))
            n = int(g.n.sum())
            rows.append([iso3, pct, year, n, evs_pct, wvs_pct])
        if len(rows) < MIN_COUNTRIES:
            continue
        rows.sort(key=lambda r: r[1])
        wv[cat][int(wave)] = rows
        waves_present.add(int(wave))

meta = [{"w": w, "label": WAVE_LABEL[w]} for w in sorted(waves_present)]

out = ["// Datos por OLA del N.5 (slider temporal chart 1). GENERADO por tools/make_waves.py — no editar.",
       "// WV_FOTO[cat][wave] = [[iso3, pct, year, n, evs, wvs], ...] asc por pct. pct = combinado EVS+WVS (pond. por n).",
       "const WV_META = " + json.dumps(meta, ensure_ascii=False) + ";",
       "const WV_FOTO = " + json.dumps(wv, ensure_ascii=False, separators=(",", ":")) + ";"]
path = os.path.join(HERE, "..", "data-waves.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-waves.js -> {os.path.getsize(path)/1024:.0f}KB | olas: {[m['w'] for m in meta]}")

# sanity: ola 7 debe coincidir con VE_FOTO (ultimo >=2017)
u = pd.read_csv(os.path.join(DATA, "ivs_vecinos_ultimo.csv"))
u7 = u[(u.year >= 2017)]
for cat in ["otra_raza","homosexuales"]:
    w7 = len(wv[cat].get(7, []))
    f7 = len(u7[u7.cat == cat])
    dup = sum(1 for r in wv[cat].get(7, []) if r[4] is not None and r[5] is not None)
    print(f"  {cat}: ola7={w7} paises, VE_FOTO(>=2017)={f7}, con EVS+WVS a la vez={dup}")
    # ARG en cada ola
    ar = {w: next((r[1] for r in wv[cat][w] if r[0]=="ARG"), None) for w in wv[cat]}
    print(f"    ARG por ola: {ar}")
