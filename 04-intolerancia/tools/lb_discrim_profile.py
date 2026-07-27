# -*- coding: utf-8 -*-
"""Perfilado de las 3 variables de discriminacion/etnicidad del Latinobarometro (N.5).

  A_011_001  "Se describiria como parte de un grupo que es discriminado en (pais)"
             en disco: 2009 (p65n) + 2020 (p57st).  Faltan 2010/2011/2015.
  A_011_121  "Personas o grupos mas discriminados en (pais)"
             en disco: solo 2020 (p58st).           Faltan 2001/2008.
  A_011_011  "Raza/Etnia a la que pertenece"
             en disco: 2009 (s18) + 2020 (s12) + 2023 (S7) + 2024 (S7).
             Cruce con la bateria de vecinos P3NOIJ.1..9 (solo 2024).

Salidas -> tools/*.csv  (agregados por pais; no se redistribuyen microdatos).
Gotchas respetados: encoding por ronda, missings negativos (2009/2020/2023) vs
extended missings + dtype object (2024), nombres con punto en 2024, ponderar siempre.
"""
import pyreadstat, pandas as pd, numpy as np, os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
LB = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\Latinobarometro"
OUT = os.path.dirname(os.path.abspath(__file__))

NUM2ISO3 = {32: "ARG", 68: "BOL", 76: "BRA", 152: "CHL", 170: "COL", 188: "CRI",
            214: "DOM", 218: "ECU", 222: "SLV", 320: "GTM", 340: "HND", 484: "MEX",
            558: "NIC", 591: "PAN", 600: "PRY", 604: "PER", 724: "ESP", 858: "URY", 862: "VEN"}

RAZA = {1: "asiatico", 2: "negro", 3: "indigena", 4: "mestizo", 5: "mulato", 6: "blanco", 7: "otra"}
# agrupacion analitica para el cruce (celdas mas grandes)
RAZA_G = {1: "otros", 2: "afro", 3: "indigena", 4: "mestizo", 5: "afro", 6: "blanco", 7: "otros"}

VEC = {1: "otra_raza", 2: "inmigrantes", 3: "homosexuales", 4: "otra_religion",
       5: "bebedores_drogadictos", 6: "parejas_no_casadas", 7: "otro_idioma", 8: "jovenes"}


def num(s):
    return pd.to_numeric(s, errors="coerce")


def wmean(x, w):
    m = x.notna() & w.notna() & (w > 0)
    if m.sum() == 0:
        return np.nan
    return float(np.average(x[m].astype(float), weights=w[m]))


def load(fname, enc, cols, user_missing=False):
    df, meta = pyreadstat.read_dta(os.path.join(LB, fname), usecols=cols,
                                   encoding=enc, user_missing=user_missing)
    return df, meta


print("=" * 78)
print("1) A_011_001  Se describiria como parte de un grupo discriminado")
print("=" * 78)

rows1 = []
for year, fname, enc, cpais, cw, var in [
    (2009, "LAT2009/Latinobarometro_2009_datos_esp_v2014_06_27.dta", "utf-8", "idenpa", "wt", "p65n"),
    (2020, "LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", "p57st"),
]:
    df, _ = load(fname, enc, [cpais, cw, var])
    df["iso3"] = num(df[cpais]).map(NUM2ISO3)
    df["w"] = num(df[cw])
    v = num(df[var])
    df["si"] = np.where(v == 1, 1.0, np.where(v == 2, 0.0, np.nan))
    for iso3, g in df[df.iso3.notna()].groupby("iso3"):
        n_tot = len(g)
        n_val = int((g.si.notna() & g.w.notna() & (g.w > 0)).sum())
        pct = wmean(g.si, g.w) * 100
        rows1.append((iso3, year, round(pct, 1), n_val, n_tot, round(100 * n_val / n_tot, 1)))
    print(f"  {year} {var}: {df.iso3.nunique()} paises, n={len(df)}")

d1 = pd.DataFrame(rows1, columns=["iso3", "year", "pct_si", "n_valid", "n_total", "pct_respuesta"])
d1 = d1[d1.n_valid > 0]        # ESP 2009: la pregunta no se hizo en Espana
d1.to_csv(os.path.join(OUT, "lb_discriminado_pais.csv"), index=False)

piv1 = d1.pivot(index="iso3", columns="year", values="pct_si")
piv1["delta"] = (piv1[2020] - piv1[2009]).round(1)
print("\n%% que se describe como parte de un grupo discriminado (ponderado):")
print(piv1.sort_values(2020, ascending=False).to_string())
print("\nN validos:")
print(d1.pivot(index="iso3", columns="year", values="n_valid").to_string())
reg = d1.groupby("year").apply(lambda g: np.average(g.pct_si, weights=g.n_valid), include_groups=False)
print(f"\npooled AL (ponderado por n): {reg.round(1).to_dict()}")
comunes = piv1.dropna().index.tolist()
print(f"paises con las 2 rondas: {len(comunes)} -> {comunes}")
print("promedio simple sobre panel balanceado:",
      piv1.loc[comunes, [2009, 2020]].mean().round(1).to_dict())

# bonus 2009: p66n proporcion percibida de discriminados
df09, _ = load("LAT2009/Latinobarometro_2009_datos_esp_v2014_06_27.dta", "utf-8",
               ["idenpa", "wt", "p66n"])
df09["iso3"] = num(df09["idenpa"]).map(NUM2ISO3)
df09["w"] = num(df09["wt"])
p66 = num(df09["p66n"]); df09["p66"] = p66.where(p66 >= 0)
b = df09[df09.iso3.notna()].groupby("iso3").apply(lambda g: wmean(g.p66, g.w), include_groups=False)
print("\n[bonus 2009 p66n] %% de la poblacion que el entrevistado cree discriminada (media):")
print(b.round(1).sort_values(ascending=False).to_string())


print("\n" + "=" * 78)
print("2) A_011_121  Grupo mas discriminado (2020, p58st)")
print("=" * 78)

df20, meta20 = load("LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8",
                    ["idenpa", "wt", "p58st"])
LAB58 = meta20.value_labels[meta20.variable_to_label["p58st"]]
df20["iso3"] = num(df20["idenpa"]).map(NUM2ISO3)
df20["w"] = num(df20["wt"])
v58 = num(df20["p58st"]); df20["g"] = v58.where(v58 > 0)
base = df20[df20.iso3.notna() & df20.g.notna() & (df20.w > 0)].copy()

rows2 = []
for iso3, g in base.groupby("iso3"):
    tot = g.w.sum()
    for cat, gg in g.groupby("g"):
        rows2.append((iso3, int(cat), str(LAB58.get(int(cat), "?")).strip(),
                      round(100 * gg.w.sum() / tot, 1), int(len(gg))))
d2 = pd.DataFrame(rows2, columns=["iso3", "cod", "grupo", "pct", "n"])
d2 = d2.sort_values(["iso3", "pct"], ascending=[True, False])
d2.to_csv(os.path.join(OUT, "lb_grupo_discriminado_2020.csv"), index=False)

print(f"cobertura: {base.iso3.nunique()} paises, n valido={len(base)} de {len(df20)} "
      f"({100*len(base)/len(df20):.1f}%)")
print("\nTOP-3 grupo mas discriminado por pais (2020, %% ponderado):")
for iso3, g in d2.groupby("iso3"):
    t = g.head(3)
    print(f"  {iso3}: " + " | ".join(f"{r.grupo[:34]} {r.pct}%" for r in t.itertuples()))

print("\nPooled AL (promedio simple de los %% nacionales), top 15:")
pool2 = d2.groupby(["cod", "grupo"]).pct.mean().round(1).sort_values(ascending=False)
print(pool2.head(15).to_string())

# macro-categorias (para una eventual serie con 2001/2008 recodificada a mano)
MACRO = {**{c: "raza_etnia" for c in [1, 2, 3, 4, 5, 6, 39]},
         **{c: "migrantes" for c in [11, 12, 13, 14, 15, 16, 17]},
         **{c: "religion_origen" for c in [7, 8, 9, 27]},
         10: "pobres", 33: "pobres", 26: "pobres", 34: "pobres", 35: "pobres",
         18: "salud_discap", 19: "salud_discap", 40: "salud_discap",
         20: "lgbt", 23: "mujeres", 30: "mujeres", 32: "mujeres",
         24: "edad", 25: "edad", 21: "conducta", 38: "conducta", 22: "conducta",
         36: "conducta", 37: "conducta", 28: "ideologia", 29: "ideologia", 31: "ideologia",
         6: "raza_etnia", 96: "otros", 97: "ninguna"}
d2m = d2.copy()
d2m["macro"] = d2m.cod.map(MACRO).fillna("otros")
mac = d2m.groupby(["iso3", "macro"]).pct.sum().unstack(fill_value=0).round(1)
mac.to_csv(os.path.join(OUT, "lb_grupo_discriminado_macro_2020.csv"))
print("\nMacro-categorias por pais (%% ponderado, suma 100):")
print(mac.to_string())


print("\n" + "=" * 78)
print("3) A_011_011  Raza/Etnia autopercibida")
print("=" * 78)

ROUNDS_RAZA = [
    (2009, "LAT2009/Latinobarometro_2009_datos_esp_v2014_06_27.dta", "utf-8", "idenpa", "wt", "s18", False),
    (2020, "LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", "s12", False),
    (2023, "LAT2023/Latinobarometro_2023_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", "S7", False),
    (2024, "Latinobarometro_2024_Stata_esp_v20250817.dta", "latin1", "IDENPA", "WT", "S7", True),
]
rows3 = []
for year, fname, enc, cpais, cw, var, um in ROUNDS_RAZA:
    df, _ = load(fname, enc, [cpais, cw, var], user_missing=um)
    df["iso3"] = num(df[cpais]).map(NUM2ISO3)
    df["w"] = num(df[cw])
    v = num(df[var])                      # en 2024 los extended missings -> NaN
    df["r"] = v.where(v.isin(list(RAZA)))
    ok = df[df.iso3.notna() & (df.w > 0)]
    val = ok[ok.r.notna()]
    print(f"  {year} {var}: {ok.iso3.nunique()} paises | validos {len(val)}/{len(ok)} "
          f"({100*len(val)/len(ok):.1f}%)")
    for iso3, g in val.groupby("iso3"):
        tot = g.w.sum()
        for c, slug in RAZA.items():
            gg = g[g.r == c]
            rows3.append((iso3, year, slug, round(100 * gg.w.sum() / tot, 1), int(len(gg)), int(len(g))))
d3 = pd.DataFrame(rows3, columns=["iso3", "year", "raza", "pct", "n", "n_pais_ronda"])
d3.to_csv(os.path.join(OUT, "lb_raza_pais_ronda.csv"), index=False)

print("\nComposicion 2024 (%% ponderado):")
p24 = d3[d3.year == 2024].pivot(index="iso3", columns="raza", values="pct")
p24 = p24[["blanco", "mestizo", "indigena", "negro", "mulato", "asiatico", "otra"]]
print(p24.sort_values("blanco", ascending=False).to_string())

print("\nEstabilidad entre rondas (%% BLANCO por pais):")
pb = d3[d3.raza == "blanco"].pivot(index="iso3", columns="year", values="pct")
pb["rango"] = (pb.max(axis=1) - pb.min(axis=1)).round(1)
print(pb.sort_values("rango", ascending=False).to_string())
print("\nEstabilidad entre rondas (%% INDIGENA por pais):")
pi_ = d3[d3.raza == "indigena"].pivot(index="iso3", columns="year", values="pct")
pi_["rango"] = (pi_.max(axis=1) - pi_.min(axis=1)).round(1)
print(pi_.sort_values("rango", ascending=False).to_string())
print("\nEstabilidad entre rondas (%% MESTIZO por pais):")
pm = d3[d3.raza == "mestizo"].pivot(index="iso3", columns="year", values="pct")
pm["rango"] = (pm.max(axis=1) - pm.min(axis=1)).round(1)
print(pm.sort_values("rango", ascending=False).to_string())


print("\n" + "=" * 78)
print("3b) CRUCE raza autopercibida x bateria de vecinos (2024)")
print("=" * 78)

cols = ["IDENPA", "WT", "S7"] + [f"P3NOIJ.{i}" for i in range(1, 10)]
d, _ = load("Latinobarometro_2024_Stata_esp_v20250817.dta", "latin1", cols, user_missing=True)
d["iso3"] = num(d["IDENPA"]).map(NUM2ISO3)
d["w"] = num(d["WT"])
s7 = num(d["S7"])
d["raza"] = s7.map(RAZA)
d["grupo"] = s7.map(RAZA_G)
for i in range(1, 10):
    d[f"v{i}"] = num(d[f"P3NOIJ.{i}"])
# base: respondio la bateria (excluye NS/NR), tiene peso y tiene raza
base = d[(d.v9 != 1) & (d.w > 0) & d.grupo.notna() & d.iso3.notna()].copy()
print(f"base del cruce: n={len(base)} (de {len(d)} casos totales); "
      f"pierde {len(d)-len(base)} por NS/NR de la bateria, peso o raza faltante")

rows4 = []
for (iso3, gr), g in base.groupby(["iso3", "grupo"]):
    rec = {"iso3": iso3, "grupo": gr, "n": int(len(g))}
    for i, slug in VEC.items():
        rec[slug] = round(wmean(g[f"v{i}"], g.w) * 100, 1)
    rows4.append(rec)
d4 = pd.DataFrame(rows4)
for (gr), g in base.groupby("grupo"):
    rec = {"iso3": "POOL", "grupo": gr, "n": int(len(g))}
    for i, slug in VEC.items():
        rec[slug] = round(wmean(g[f"v{i}"], g.w) * 100, 1)
    d4 = pd.concat([d4, pd.DataFrame([rec])], ignore_index=True)
d4 = d4[["iso3", "grupo", "n"] + list(VEC.values())]
d4.to_csv(os.path.join(OUT, "lb_raza_x_vecinos_2024.csv"), index=False)

print("\nPOOLED regional -- %% que NO querria de vecinos, por autoidentificacion etnica:")
print(d4[d4.iso3 == "POOL"].set_index("grupo").drop(columns="iso3").to_string())

print("\nPor pais: %% que rechaza vecinos de OTRA RAZA (celdas con n<50 marcadas con *):")
w = d4[d4.iso3 != "POOL"].pivot(index="iso3", columns="grupo", values="otra_raza")
nn = d4[d4.iso3 != "POOL"].pivot(index="iso3", columns="grupo", values="n")
show = w.copy().astype(object)
for c in w.columns:
    for i in w.index:
        if pd.notna(w.loc[i, c]):
            star = "*" if nn.loc[i, c] < 50 else " "
            show.loc[i, c] = f"{w.loc[i,c]:5.1f}{star}({int(nn.loc[i,c])})"
        else:
            show.loc[i, c] = "     -"
print(show.to_string())

small = d4[(d4.iso3 != "POOL") & (d4.n < 50)]
print(f"\nceldas con n<50: {len(small)} de {len(d4[d4.iso3!='POOL'])} "
      f"({100*len(small)/len(d4[d4.iso3!='POOL']):.0f}%)")
print(small[["iso3", "grupo", "n"]].to_string(index=False))
print("\nceldas n<100:", int(((d4.iso3 != "POOL") & (d4.n < 100)).sum()))

# desagregacion fina (7 categorias) solo pooled
rows5 = []
for r, g in base[base.raza.notna()].groupby("raza"):
    rec = {"raza": r, "n": int(len(g))}
    for i, slug in VEC.items():
        rec[slug] = round(wmean(g[f"v{i}"], g.w) * 100, 1)
    rows5.append(rec)
d5 = pd.DataFrame(rows5).sort_values("n", ascending=False)
d5.to_csv(os.path.join(OUT, "lb_raza7_x_vecinos_2024_pooled.csv"), index=False)
print("\nPooled con las 7 categorias originales:")
print(d5.to_string(index=False))

# gap intra-pais blanco vs no-blanco (para ver si el efecto sobrevive al control por pais)
print("\nGap intra-pais en 'otra_raza': blanco - (mestizo/indigena/afro ponderado):")
gaps = []
for iso3, g in base.groupby("iso3"):
    b_ = g[g.grupo == "blanco"]; nb = g[g.grupo.isin(["mestizo", "indigena", "afro"])]
    if len(b_) < 50 or len(nb) < 50:
        continue
    pb_ = wmean(b_.v1, b_.w) * 100; pn = wmean(nb.v1, nb.w) * 100
    gaps.append((iso3, round(pb_, 1), round(pn, 1), round(pb_ - pn, 1), len(b_), len(nb)))
g4 = pd.DataFrame(gaps, columns=["iso3", "blanco", "no_blanco", "gap", "n_blanco", "n_noblanco"])
print(g4.sort_values("gap", ascending=False).to_string(index=False))
print(f"\ngap medio (simple) = {g4.gap.mean():.1f} pp | paises con gap>0: "
      f"{(g4.gap>0).sum()}/{len(g4)}")

print("\n" + "=" * 78)
print("3c) CRUCE ajustado por composicion de paises (estandarizacion directa)")
print("=" * 78)
# El pooled crudo confunde: los paises con mas indigenas/afro (GTM, BOL, DOM, PAN)
# tienen rechazo mas alto en general. Se re-pondera cada grupo etnico usando la MISMA
# distribucion de paises (la del total de la base), = country fixed effects.
tot_pais = base.groupby("iso3").w.sum()
tot_pais = tot_pais / tot_pais.sum()
rows6 = []
for gr, g in base.groupby("grupo"):
    rec = {"grupo": gr, "n": int(len(g))}
    for i, slug in VEC.items():
        num_, den_ = 0.0, 0.0
        for iso3, gg in g.groupby("iso3"):
            if len(gg) < 30:      # celdas ridiculas no entran
                continue
            p = wmean(gg[f"v{i}"], gg.w)
            if np.isnan(p):
                continue
            num_ += tot_pais[iso3] * p
            den_ += tot_pais[iso3]
        rec[slug] = round(100 * num_ / den_, 1) if den_ > 0 else np.nan
        if i == 1:
            rec["cobertura_paises"] = round(100 * den_, 1)
    rows6.append(rec)
d6 = pd.DataFrame(rows6)[["grupo", "n", "cobertura_paises"] + list(VEC.values())]
d6.to_csv(os.path.join(OUT, "lb_raza_x_vecinos_2024_ajustado.csv"), index=False)
print("\n%% que NO querria de vecinos, con distribucion de paises FIJA:")
print(d6.to_string(index=False))
print("\n(comparar con el crudo de 3b: el crudo da indigena 9.3 > blanco 5.9;")
print(" ajustado el orden se invierte o se aplana -> el efecto crudo era composicion de paises)")

print("\nGap intra-pais blanco - no_blanco en TODAS las categorias (promedio simple, "
      "paises con ambas celdas n>=50):")
gap_all = {}
for i, slug in VEC.items():
    vals = []
    for iso3, g in base.groupby("iso3"):
        b_ = g[g.grupo == "blanco"]; nb = g[g.grupo.isin(["mestizo", "indigena", "afro"])]
        if len(b_) < 50 or len(nb) < 50:
            continue
        vals.append(wmean(b_[f"v{i}"], b_.w) * 100 - wmean(nb[f"v{i}"], nb.w) * 100)
    gap_all[slug] = (round(float(np.mean(vals)), 1), sum(1 for v in vals if v > 0), len(vals))
for k, (m, pos, tot) in gap_all.items():
    print(f"  {k:24s} gap medio {m:+5.1f} pp | blanco>no-blanco en {pos}/{tot} paises")

print("\nBlanco vs NO-blanco por pais en 'otra_raza' (todos los paises, ambas celdas n>=50):")
print(g4.sort_values("gap", ascending=False).to_string(index=False))

print("\n" + "=" * 78)
print("EXTRA) Argentina en detalle")
print("=" * 78)
arg58 = d2[d2.iso3 == "ARG"].head(12)
print("\nARG 2020 - grupo mas discriminado (top 12):")
print(arg58[["cod", "grupo", "pct", "n"]].to_string(index=False))
print("\nARG 2024 - rechazo a vecinos por autoidentificacion etnica (n de cada celda):")
print(d4[d4.iso3 == "ARG"].set_index("grupo").drop(columns="iso3").to_string())
print("\nARG - 'me describo como parte de un grupo discriminado':")
print(d1[d1.iso3 == "ARG"].to_string(index=False))
rk09 = d1[(d1.year == 2009) & d1.pct_si.notna()].sort_values("pct_si", ascending=False).reset_index(drop=True)
rk20 = d1[(d1.year == 2020) & d1.pct_si.notna()].sort_values("pct_si", ascending=False).reset_index(drop=True)
print(f"  ranking ARG: 2009 = {rk09.index[rk09.iso3=='ARG'][0]+1}/{len(rk09)} | "
      f"2020 = {rk20.index[rk20.iso3=='ARG'][0]+1}/{len(rk20)}")

print("\n" + "=" * 78)
print("3d) CRUCE pareado dentro de pais (blanco = referencia) -- la version honesta")
print("=" * 78)
rows7 = []
for gr in ["mestizo", "indigena", "afro", "otros"]:
    for i, slug in VEC.items():
        pares = []
        for iso3, g in base.groupby("iso3"):
            a_ = g[g.grupo == "blanco"]; b_ = g[g.grupo == gr]
            if len(a_) < 50 or len(b_) < 50:
                continue
            pares.append((iso3, wmean(b_[f"v{i}"], b_.w) * 100 - wmean(a_[f"v{i}"], a_.w) * 100))
        if not pares:
            continue
        v = [p[1] for p in pares]
        rows7.append({"grupo": gr, "cat": slug, "n_paises": len(v),
                      "dif_vs_blanco": round(float(np.mean(v)), 1),
                      "mediana": round(float(np.median(v)), 1),
                      "paises_positivos": sum(1 for x in v if x > 0),
                      "paises": ",".join(p[0] for p in pares)})
d7 = pd.DataFrame(rows7)
d7.to_csv(os.path.join(OUT, "lb_raza_x_vecinos_2024_pareado.csv"), index=False)
for gr, g in d7.groupby("grupo"):
    print(f"\n--- {gr.upper()} vs blanco (paises comparables: {g.n_paises.iloc[0]} -> {g.paises.iloc[0]})")
    print(g[["cat", "dif_vs_blanco", "mediana", "paises_positivos", "n_paises"]].to_string(index=False))

print("\nCeldas pais x grupo (base del cruce):")
ct = base.groupby(["iso3", "grupo"]).size().unstack(fill_value=0)
ct["TOTAL"] = ct.sum(axis=1)
print(ct.to_string())

print("\nNS/NR de la bateria de vecinos 2024 (excluidos de la base) y no-respuesta de raza:")
d["nsnr"] = (d.v9 == 1).astype(float)
d["sin_raza"] = num(d["S7"]).isna().astype(float)
qa = d[d.iso3.notna()].groupby("iso3").apply(lambda g: pd.Series({
    "n": len(g), "pct_NSNR_bateria": round(wmean(g.nsnr, g.w) * 100, 1),
    "pct_sin_raza": round(wmean(g.sin_raza, g.w) * 100, 1)}), include_groups=False)
qa.to_csv(os.path.join(OUT, "lb_vecinos_2024_nsnr.csv"))
print(qa.sort_values("pct_NSNR_bateria", ascending=False).to_string())
print(f"total: NS/NR bateria {wmean(d.nsnr, d.w)*100:.1f}% | sin raza {wmean(d.sin_raza, d.w)*100:.1f}%")


print("\n" + "=" * 78)
print("4) CRUCE A_011_001 x A_011_011  (discriminado x raza) -- 2009 y 2020")
print("=" * 78)
rows8 = []
for year, fn, enc, cp, cw, vd, vr in [
    (2009, "LAT2009/Latinobarometro_2009_datos_esp_v2014_06_27.dta", "utf-8", "idenpa", "wt", "p65n", "s18"),
    (2020, "LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", "p57st", "s12"),
]:
    df, _ = load(fn, enc, [cp, cw, vd, vr])
    df["iso3"] = num(df[cp]).map(NUM2ISO3); df["w"] = num(df[cw])
    v = num(df[vd]); df["si"] = np.where(v == 1, 1.0, np.where(v == 2, 0.0, np.nan))
    df["grupo"] = num(df[vr]).map(RAZA_G)
    b_ = df[df.iso3.notna() & (df.w > 0) & df.si.notna() & df.grupo.notna()]
    print(f"\n--- {year} pooled crudo (%% que se describe como discriminado):")
    for gr, g in b_.groupby("grupo"):
        rows8.append({"year": year, "grupo": gr, "n": int(len(g)),
                      "pct_si": round(wmean(g.si, g.w) * 100, 1)})
    print(pd.DataFrame([r for r in rows8 if r["year"] == year]).to_string(index=False))
    print("  pareado dentro de pais vs blanco (celdas n>=50):")
    for gr in ["mestizo", "indigena", "afro"]:
        difs = []
        for iso3, g in b_.groupby("iso3"):
            x = g[g.grupo == "blanco"]; y = g[g.grupo == gr]
            if len(x) < 50 or len(y) < 50:
                continue
            difs.append(wmean(y.si, y.w) * 100 - wmean(x.si, x.w) * 100)
        if difs:
            print(f"    {gr:9s} {np.mean(difs):+5.1f} pp  "
                  f"({sum(1 for v_ in difs if v_ > 0)}/{len(difs)} paises positivos)")
    if year == 2020:
        arg = b_[b_.iso3 == "ARG"]
        print("  ARG 2020 por raza:")
        print(arg.groupby("grupo").apply(lambda g: pd.Series(
            {"n": len(g), "pct_si": round(wmean(g.si, g.w) * 100, 1)}),
            include_groups=False).to_string())
pd.DataFrame(rows8).to_csv(os.path.join(OUT, "lb_discriminado_x_raza.csv"), index=False)

print("\nArchivos escritos en", OUT)
for f in ["lb_discriminado_pais.csv", "lb_grupo_discriminado_2020.csv",
          "lb_grupo_discriminado_macro_2020.csv", "lb_raza_pais_ronda.csv",
          "lb_raza_x_vecinos_2024.csv", "lb_raza7_x_vecinos_2024_pooled.csv",
          "lb_raza_x_vecinos_2024_ajustado.csv", "lb_raza_x_vecinos_2024_pareado.csv",
          "lb_vecinos_2024_nsnr.csv", "lb_discriminado_x_raza.csv"]:
    print(f"  {f}  {os.path.getsize(os.path.join(OUT,f))} bytes")
