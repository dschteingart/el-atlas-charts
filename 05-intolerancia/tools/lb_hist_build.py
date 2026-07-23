# -*- coding: utf-8 -*-
"""Serie histórica de Latinobarómetro para la batería de vecinos (chart 6 líneas).
Las categorías cambian por ronda; las comparables:
  - homosexuales: 1998 (np63a), 2009 (p64st_a), 2024 (P3NOIJ.3)  → 3 puntos
  - inmigrantes : 2009 (p64n_d), 2024 (P3NOIJ.2)                 → 2 puntos
Salida: data-lb-hist.js  LBH[cat][iso3] = [[year,pct,n],...]  + LBH_META.
"""
import pyreadstat, pandas as pd, numpy as np, json, os

LB = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\Latinobarometro"
HERE = os.path.dirname(os.path.abspath(__file__))

NUM2ISO3 = {32:"ARG",68:"BOL",76:"BRA",152:"CHL",170:"COL",188:"CRI",214:"DOM",218:"ECU",
            222:"SLV",320:"GTM",340:"HND",484:"MEX",591:"PAN",600:"PRY",604:"PER",858:"URY",862:"VEN",724:"ESP"}

# (archivo, año, var_country, var_weight, {cat: varname}, nsnr_var)
# nsnr_var: item "No sabe/No responde" a excluir de la base (solo 2024 lo tiene,
# para que el punto 2024 coincida con las barras de lb_vecinos_2024.csv).
ROUNDS = [
    ("LAT1998/Latinobarometro_1998_datos_english_v2014_06_27.dta", 1998, "idenpa", "pondera",
     {"homosexuales": "np63a"}, None),
    ("LAT2009/Latinobarometro_2009_datos_eng_v2014_06_27.dta", 2009, "idenpa", "wt",
     {"homosexuales": "p64st_a", "inmigrantes": "p64n_d"}, None),
    ("Latinobarometro_2024_Stata_esp_v20250817.dta", 2024, "IDENPA", "WT",
     {"homosexuales": "P3NOIJ.3", "inmigrantes": "P3NOIJ.2"}, "P3NOIJ.9"),
]

rows = []
for fname, year, cpais, cw, catvars, nsnr in ROUNDS:
    path = os.path.join(LB, fname)
    cols = [cpais, cw] + list(catvars.values()) + ([nsnr] if nsnr else [])
    df, meta = pyreadstat.read_dta(path, usecols=cols, encoding="latin1")
    df["iso3"] = df[cpais].map(NUM2ISO3)
    df["w"] = pd.to_numeric(df[cw], errors="coerce"); df.loc[~(df.w > 0), "w"] = np.nan
    base = df if nsnr is None else df[df[nsnr] != 1]   # excluir NS/NR (base = respondió la batería)
    for cat, var in catvars.items():
        for iso3, g in base[base.iso3.notna()].groupby("iso3"):
            gg = g[g[var].isin([0, 1]) & g.w.notna()]
            if len(gg) < 150: continue
            pct = float(np.average((gg[var] == 1).astype(int), weights=gg.w) * 100)
            rows.append((cat, iso3, year, round(pct, 1), int(len(gg))))
    print(f"  {year}: {os.path.basename(fname)[:40]} cats={list(catvars)}")

long = pd.DataFrame(rows, columns=["cat","iso3","year","pct","n"])
lbh = {}
for cat, gc in long.groupby("cat"):
    lbh[cat] = {}
    for iso3, g in gc.groupby("iso3"):
        pts = [[int(r.year), r.pct, int(r.n)] for r in g.sort_values("year").itertuples()]
        if len(pts) >= 2: lbh[cat][iso3] = pts

meta = {"cats": sorted(lbh.keys()), "years": sorted(long.year.unique().tolist())}
out = ["// Serie histórica LB (chart 6 líneas). GENERADO por tools/lb_hist_build.py — no editar.",
       "// LBH[cat][iso3] = [[year,pct,n],...] (homosexuales 1998/2009/2024; inmigrantes 2009/2024).",
       "const LBH_META = " + json.dumps(meta, ensure_ascii=False) + ";",
       "const LBH = " + json.dumps(lbh, ensure_ascii=False, separators=(",",":")) + ";"]
path = os.path.join(HERE, "..", "data-lb-hist.js")
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(f"\ndata-lb-hist.js -> {os.path.getsize(path)/1024:.0f}KB")
for cat in lbh:
    npais = len(lbh[cat]); ar = lbh[cat].get("ARG")
    print(f"  {cat}: {npais} países con serie | ARG={ar}")
