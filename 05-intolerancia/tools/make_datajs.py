# -*- coding: utf-8 -*-
"""Genera data-vecinos.js para los charts del N.5 desde los CSVs de data/.

VE_FOTO: {cat: [[iso3, pct, year, study, n], ...]} ultimo dato >=2017, 9 cats globales.
VE_REGION: {iso3: region} para colorear por region Atlas.
"""
import pandas as pd, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")

CATS9 = ["otra_raza","inmigrantes","homosexuales","otra_religion","otro_idioma",
         "parejas_no_casadas","sida","bebedores","drogadictos"]

u = pd.read_csv(os.path.join(DATA, "ivs_vecinos_ultimo.csv"))
u = u[(u.year >= 2017) & u.cat.isin(CATS9)]

foto = {}
for cat, g in u.groupby("cat"):
    g = g.sort_values("pct")
    foto[cat] = [[r.iso3, r.pct, int(r.year), r.study, int(r.n)] for r in g.itertuples()]

region = dict(u.drop_duplicates("iso3")[["iso3","region"]].values.tolist())

out = []
out.append("// Datos del N.5 — bateria de vecinos IVS (EVS+WVS). GENERADO por tools/make_datajs.py — no editar a mano.")
out.append("// VE_FOTO[cat] = [[iso3, pct, year, study, n], ...] ultimo dato disponible >=2017, orden ascendente por pct.")
out.append("const VE_CATS = " + json.dumps(CATS9) + ";")
out.append("const VE_FOTO = " + json.dumps(foto, ensure_ascii=False, separators=(",", ":")) + ";")
out.append("const VE_REGION = " + json.dumps(region, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";")

path = os.path.join(HERE, "..", "data-vecinos.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-vecinos.js -> {os.path.getsize(path)/1024:.0f}KB | cats: {len(foto)} | paises: {len(region)}")
