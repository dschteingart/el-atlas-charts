# -*- coding: utf-8 -*-
"""Genera los data-*.js de los charts 2-6 del N°5 desde los CSVs de data/.
Ejecutar desde 05-intolerancia/tools/.  (data-vecinos.js lo genera make_datajs.py)

  data-pelicula.js  : PELI_SERIES[cat][iso3] = [[year,pct],...] (una serie limpia
                      por país: se elige el estudio EVS|WVS con más olas para
                      evitar saltos por efecto-casa) + PELI_REGION[iso3].
  data-lb.js        : LB_FOTO[cat] = [[iso3,pct,n],...] (Latinobarómetro 2024,
                      17 países) + LB_REGION[iso3] + LB_CATS.
  data-implicito.js : IMP[iso3] = {region, declRace, implRace, declGay, implGay}
                      join IVS declarado (otra_raza/homosexuales) × Project Implicit
                      (Race/Sexuality d_implicito).
"""
import pandas as pd, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")

def dump(varlines, path):
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(varlines) + "\n")
    print(f"{os.path.basename(path)} -> {os.path.getsize(path)/1024:.0f}KB")

# ============ PELÍCULA (líneas temporales) ============
CORE = ["otra_raza","inmigrantes","homosexuales","sida","drogadictos","bebedores",
        "otra_religion","otro_idioma","parejas_no_casadas"]
largo = pd.read_csv(os.path.join(DATA, "ivs_vecinos_largo.csv"))
largo = largo[largo.cat.isin(CORE)]
region_map = dict(largo.drop_duplicates("iso3")[["iso3","region"]].values.tolist())

series = {}
for cat, gcat in largo.groupby("cat"):
    series[cat] = {}
    for iso3, g in gcat.groupby("iso3"):
        # elegir el estudio con más olas (evita saltos EVS/WVS); desempate: más n total
        best_study = (g.groupby("study")
                        .agg(olas=("year","nunique"), ntot=("n","sum"))
                        .sort_values(["olas","ntot"], ascending=False).index[0])
        s = g[g.study == best_study].sort_values("year")
        # una fila por año (por si el estudio repite): promedio ponderado por n
        pts = []
        for year, gy in s.groupby("year"):
            import numpy as np
            pct = float(np.average(gy.pct, weights=gy.n))
            pts.append([int(year), round(pct, 1)])
        if len(pts) >= 2:
            series[cat][iso3] = pts

# universo de países con al menos una serie (para el buscador)
peli_isos = sorted({iso for cat in series for iso in series[cat]})
peli_region = {i: region_map[i] for i in peli_isos}

out = ["// GENERADO por tools/make_all_datajs.py — no editar a mano.",
       "// PELI_SERIES[cat][iso3] = [[year,pct],...] serie limpia (un estudio por país).",
       "const PELI_CATS = " + json.dumps(CORE) + ";",
       "const PELI_SERIES = " + json.dumps(series, ensure_ascii=False, separators=(",", ":")) + ";",
       "const PELI_REGION = " + json.dumps(peli_region, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";"]
dump(out, os.path.join(HERE, "..", "data-pelicula.js"))
print(f"  película: {len(peli_isos)} países; ARG otra_raza={series['otra_raza'].get('ARG')}")

# ============ LATINOBARÓMETRO 2024 ============
lb = pd.read_csv(os.path.join(DATA, "lb_vecinos_2024.csv"))
LB_CATS = ["otra_raza","inmigrantes","homosexuales","otra_religion","otro_idioma",
           "parejas_no_casadas","bebedores_drogadictos","jovenes"]
lb = lb[lb.cat.isin(LB_CATS)]
lb_region = dict(lb.drop_duplicates("iso3")[["iso3","region"]].values.tolist())
lb_foto = {}
for cat, g in lb.groupby("cat"):
    g = g.sort_values("pct")
    lb_foto[cat] = [[r.iso3, r.pct, int(r.n)] for r in g.itertuples()]
out = ["// GENERADO por tools/make_all_datajs.py — no editar a mano.",
       "// LB_FOTO[cat] = [[iso3,pct,n],...] Latinobarómetro 2024, orden asc por pct.",
       "const LB_CATS = " + json.dumps(LB_CATS) + ";",
       "const LB_FOTO = " + json.dumps(lb_foto, ensure_ascii=False, separators=(",", ":")) + ";",
       "const LB_REGION = " + json.dumps(lb_region, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";"]
dump(out, os.path.join(HERE, "..", "data-lb.js"))
print(f"  LB: {lb.iso3.nunique()} países, {len(LB_CATS)} cats")

# ============ DECLARADO vs IMPLÍCITO (Project Implicit) ============
ivs = pd.read_csv(os.path.join(DATA, "ivs_vecinos_ultimo.csv"))
pi = pd.read_csv(os.path.join(DATA, "pi_implicito_paises.csv"))
declRace = ivs[ivs.cat=="otra_raza"].set_index("iso3").pct
declGay  = ivs[ivs.cat=="homosexuales"].set_index("iso3").pct
piRace   = pi[pi.task=="Race"].set_index("iso3")
piGay    = pi[pi.task=="Sexuality"].set_index("iso3")
pi_region = dict(pi.drop_duplicates("iso3")[["iso3","region"]].values.tolist())
imp = {}
for iso3 in sorted(set(piRace.index) | set(piGay.index)):
    row = {"region": pi_region.get(iso3)}
    if iso3 in declRace.index and iso3 in piRace.index:
        row["dRace"] = round(float(declRace[iso3]), 1)
        row["iRace"] = round(float(piRace.loc[iso3, "d_implicito"]), 3)
    if iso3 in declGay.index and iso3 in piGay.index:
        row["dGay"] = round(float(declGay[iso3]), 1)
        row["iGay"] = round(float(piGay.loc[iso3, "d_implicito"]), 3)
    if len(row) > 1:
        imp[iso3] = row
out = ["// GENERADO por tools/make_all_datajs.py — no editar a mano.",
       "// IMP[iso3] = {region, dRace, iRace, dGay, iGay}. Declarado (IVS, % rechazo)",
       "// vs implícito (Project Implicit, D-score IAT >0 = sesgo pro-grupo-dominante).",
       "const IMP = " + json.dumps(imp, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";"]
dump(out, os.path.join(HERE, "..", "data-implicito.js"))
n_race = sum(1 for v in imp.values() if "dRace" in v)
n_gay = sum(1 for v in imp.values() if "dGay" in v)
print(f"  implícito: {len(imp)} países (raza={n_race}, sexualidad={n_gay}); ARG={imp.get('ARG')}")
