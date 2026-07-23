# -*- coding: utf-8 -*-
"""Copia los CSVs de vecinos al repo agregando la region Atlas (10 regiones, criterio N.1)."""
import pandas as pd, re, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = r"C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\.claude\worktrees\vigilant-wing-c3e39e"
OUT = os.path.join(REPO, "05-intolerancia", "data")
os.makedirs(OUT, exist_ok=True)

src = open(os.path.join(REPO, "01-bienestar-violencia", "data-scatter.js"), encoding="utf-8").read()
REGION = dict(re.findall(r'"iso3":"([A-Z]{3})","region":"([^"]+)"', src))
print("regiones desde N.1:", len(REGION))

PATCH = {
    "NIR": "Western Europe",            # Irlanda del Norte (como GBR/IRL)
    "XKS": "Eastern Europe & Central Asia",
    "XNC": "Western Europe",            # Chipre del Norte (alineado con CYP en N.1)
    "MAC": "East Asia",                 # Macao (como HKG)
    "PRI": "Latin America",             # Puerto Rico: LatAm para El Atlas (pedido de Daniel, jul 2026)
    "TWN": "East Asia",
    "VEN": "Latin America",
    "YEM": "Middle East & North Africa",
}
def region_of(iso):
    r = PATCH.get(iso) or REGION.get(iso)   # el PATCH pisa al N.1 (ej. PRI)
    return r

for name in ["ivs_vecinos_largo", "ivs_vecinos_ultimo"]:
    df = pd.read_csv(os.path.join(HERE, name + ".csv"))
    df["region"] = df["iso3"].map(region_of)
    miss = sorted(df.loc[df.region.isna(), "iso3"].unique())
    if miss:
        print(f"{name}: SIN REGION -> {miss}")
    cols = ["iso3","region","study","wave","year","cat","pct","n"]
    df = df[[c for c in cols if c in df.columns]]
    df.to_csv(os.path.join(OUT, name + ".csv"), index=False)
    print(f"{name}.csv -> {len(df)} filas")

cats = pd.read_csv(os.path.join(HERE, "ivs_vecinos_cats.csv"))
cats.to_csv(os.path.join(OUT, "ivs_vecinos_cats.csv"), index=False)
print("cats ->", len(cats))

# sanity: CYP en N.1
print("CYP en N.1:", REGION.get("CYP"))
