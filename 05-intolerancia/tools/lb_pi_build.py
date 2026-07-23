# -*- coding: utf-8 -*-
"""Construye los CSVs de las dos fuentes complementarias del N.5:
  - lb_vecinos_2024.csv : Latinobarometro 2024, bateria P3NOIJ (vecinos), % ponderado (WT)
      Base: quienes respondieron la bateria (se excluye P3NOIJ.9 = NS/NR).
  - pi_implicito_paises.csv : Project Implicit International (Charlesworth et al., BRM 2023),
      resumen pais x test (subset residentes/ciudadanos, 2009-2019), OSF 26pkd.
Fuentes locales en MEGAsync\\FUNDAR\\Argentina en datos\\Bases\\{Latinobarometro, Project Implicit}.
"""
import pyreadstat, pandas as pd, numpy as np, re, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "data")
BASES = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases"

REPO1 = os.path.join(HERE, "..", "..", "01-bienestar-violencia", "data-scatter.js")
REGION = dict(re.findall(r'"iso3":"([A-Z]{3})","region":"([^"]+)"', open(REPO1, encoding="utf-8").read()))
REGION.update({"TWN":"East Asia","VEN":"Latin America","YEM":"Middle East & North Africa"})

# ---------------- Latinobarometro 2024 ----------------
NUM2ISO3 = {32:"ARG",68:"BOL",76:"BRA",152:"CHL",170:"COL",188:"CRI",214:"DOM",218:"ECU",
            222:"SLV",320:"GTM",340:"HND",484:"MEX",591:"PAN",600:"PRY",604:"PER",858:"URY",862:"VEN"}
LB_CATS = {1:"otra_raza",2:"inmigrantes",3:"homosexuales",4:"otra_religion",
           5:"bebedores_drogadictos",6:"parejas_no_casadas",7:"otro_idioma",8:"jovenes"}

dta = os.path.join(BASES, "Latinobarometro", "Latinobarometro_2024_Stata_esp_v20250817.dta")
cols = ["IDENPA","WT"] + [f"P3NOIJ.{i}" for i in range(1,10)]
lb, _ = pyreadstat.read_dta(dta, usecols=cols)
lb["iso3"] = lb["IDENPA"].map(NUM2ISO3)
assert lb["iso3"].notna().all()

rows = []
print("== LB 2024: NS/NR por pais (excluido de la base) ==")
for iso3, g in lb.groupby("iso3"):
    nsnr = g["P3NOIJ.9"] == 1
    print(f"  {iso3}: n={len(g)}, NS/NR={nsnr.mean()*100:.0f}%")
    v = g[~nsnr]
    for i, slug in LB_CATS.items():
        col = v[f"P3NOIJ.{i}"]
        m = col.isin([0, 1])
        pct = float(np.average(col[m], weights=v.loc[m, "WT"]) * 100)
        rows.append((iso3, REGION[iso3], 2024, slug, round(pct, 1), int(m.sum())))
lbo = pd.DataFrame(rows, columns=["iso3","region","year","cat","pct","n"]).sort_values(["cat","pct"])
lbo.to_csv(os.path.join(OUT, "lb_vecinos_2024.csv"), index=False)
print(f"lb_vecinos_2024.csv -> {len(lbo)} filas, {lbo.iso3.nunique()} paises")

# ---------------- Project Implicit ----------------
PI_NAME2ISO3 = {"Argentina":"ARG","Australia":"AUS","Austria":"AUT","Belgium":"BEL","Brazil":"BRA",
"Canada":"CAN","Chile":"CHL","China":"CHN","Colombia":"COL","Czech Republic":"CZE","Denmark":"DNK",
"Finland":"FIN","France":"FRA","Germany":"DEU","Greece":"GRC","Hong Kong":"HKG","Hungary":"HUN",
"India":"IND","Indonesia":"IDN","Ireland":"IRL","Israel":"ISR","Italy":"ITA","Japan":"JPN",
"Malaysia":"MYS","Mexico":"MEX","Netherlands":"NLD","New Zealand":"NZL","Norway":"NOR",
"Philippines":"PHL","Poland":"POL","Portugal":"PRT","Romania":"ROU","Russia":"RUS","Serbia":"SRB",
"Singapore":"SGP","Slovakia":"SVK","South Africa":"ZAF","South Korea":"KOR","Spain":"ESP",
"Sweden":"SWE","Switzerland":"CHE","Taiwan":"TWN","Thailand":"THA","Turkey":"TUR",
"United Kingdom":"GBR","United States":"USA"}

PI_NAME2ISO3.update({"Korea":"KOR","Switzerland (German)":"CHE","Switzerland (French)":"CHE",
                     "Canada (French)":"CAN","Canada (English)":"CAN"})
pi = pd.read_csv(os.path.join(BASES, "Project Implicit", "internationaldata_summary.csv"))
pi["iso3"] = pi["country"].map(PI_NAME2ISO3)
miss = pi.loc[pi.iso3.isna(), "country"].unique().tolist()
assert not miss, f"PI paises sin iso3: {miss}"
# CHE y CAN vienen partidas por idioma del sitio: se agrupan con promedio ponderado por n
pi = pi.rename(columns={"Ncountryressub":"n"})
def pool(g):
    w = g["n"]
    return pd.Series({"n": int(w.sum())} | {c: float(np.average(g[c], weights=w))
        for c in ["MD2","cohensdD2","Matt","Mtherm"]})
pi = pi.groupby(["iso3","task"], as_index=False).apply(pool, include_groups=False)
pio = pi.rename(columns={"MD2":"d_implicito","cohensdD2":"cohens_d",
                         "Matt":"explicito_pref","Mtherm":"explicito_termometro"})
pio["region"] = pio["iso3"].map(REGION)
pio = pio[["iso3","region","task","n","d_implicito","cohens_d","explicito_pref","explicito_termometro"]]
for c in ["d_implicito","cohens_d","explicito_pref","explicito_termometro"]:
    pio[c] = pio[c].round(3)
pio = pio.sort_values(["task","d_implicito"])
pio.to_csv(os.path.join(OUT, "pi_implicito_paises.csv"), index=False)
print(f"pi_implicito_paises.csv -> {len(pio)} filas, {pio.iso3.nunique()} paises, tests: {pio.task.nunique()}")

# ---------------- diagnosticos ----------------
print("\n== LB 2024 vs IVS (ultima ola) en otra_raza / homosexuales ==")
ivs = pd.read_csv(os.path.join(OUT, "ivs_vecinos_ultimo.csv"))
for cat in ["otra_raza","homosexuales","inmigrantes"]:
    a = lbo[lbo.cat==cat].set_index("iso3").pct
    b = ivs[ivs.cat==cat].set_index("iso3")[["year","pct"]]
    comp = pd.DataFrame({"LB24": a}).join(b.rename(columns={"pct":"IVS","year":"anioIVS"})).dropna(subset=["LB24"])
    comp["anioIVS"] = comp["anioIVS"].astype("Int64")
    print(f"\n{cat}:"); print(comp.sort_values("LB24").to_string())

print("\n== PI ranking d_implicito (Race y Sexuality) ==")
for t in ["Race","Sexuality","Skin-tone","Nationality"]:
    s = pio[pio.task==t].sort_values("d_implicito").reset_index(drop=True)
    pos = s.index[s.iso3=="ARG"]
    pos = (pos[0]+1) if len(pos) else "-"
    print(f"{t}: ARG {pos}/{len(s)} | menor sesgo: {', '.join(s.head(3).iso3)} | mayor: {', '.join(s.tail(3).iso3)}")
