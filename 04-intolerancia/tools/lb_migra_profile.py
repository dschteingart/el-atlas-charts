# -*- coding: utf-8 -*-
"""Perfil de la bateria migratoria del Latinobarometro (codigos armonizados C_004_*).

Rondas en disco: 2020 (bateria completa, 14 items), 2023 (5 items), 2024 (4 items).
TODOS los items se orientan en el MISMO sentido: mayor % = MAS HOSTIL al inmigrante.

Salidas en tools/:
  lb_migra_pais_ronda.csv   long: iso3 x ronda x item, % ponderado + n
  lb_migra_wide_2020.csv    wide 2020 (18 paises x 14 items), la foto rica
  lb_migra_corr_2020.csv    matriz de correlacion entre items (cross-section 2020)
  lb_migra_corr_panel.csv   matriz de correlacion en el panel pais-ronda (items comunes)

Gotchas respetados: encoding utf-8 en 2020/2023 y latin1 en 2024; missings negativos
en 2020/2023 vs extended missings + dtype object en 2024; p37n_d usa 9=No aplica.
"""
import pyreadstat, pandas as pd, numpy as np, os, itertools

LB = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\Latinobarometro"
HERE = os.path.dirname(os.path.abspath(__file__))

NUM2ISO3 = {32:"ARG",68:"BOL",76:"BRA",152:"CHL",170:"COL",188:"CRI",214:"DOM",218:"ECU",
            222:"SLV",320:"GTM",340:"HND",484:"MEX",558:"NIC",591:"PAN",600:"PRY",604:"PER",
            724:"ESP",858:"URY",862:"VEN"}

# item -> (etiqueta corta, sentido)
#   "agree"    -> hostil = de acuerdo {1,2}      (el enunciado es negativo sobre el inmigrante)
#   "disagree" -> hostil = en desacuerdo {3,4}   (el enunciado es positivo sobre el inmigrante)
#   "eq:k"     -> hostil = categoria k
ITEMS = {
 "C_004_201": ("Recibir inmigrantes de fuera de AL: negativo", "in:3,4"),
 "C_004_202": ("Recibir inmigrantes de America Latina: negativo", "in:3,4"),
 "C_004_203": ("Recibir inmigrantes de Haiti: negativo", "in:3,4"),
 "C_004_204": ("Recibir inmigrantes de Venezuela: negativo", "in:3,4"),
 "C_004_205": ("La llegada de inmigrantes PERJUDICA", "eq:2"),
 "C_004_206": ("NO son buenos para la economia", "disagree"),
 "C_004_207": ("Compiten por nuestros puestos de trabajo", "agree"),
 "C_004_208": ("Causan aumento del crimen", "agree"),
 "C_004_209": ("NO mejoran la sociedad con ideas y cultura", "disagree"),
 "C_004_210": ("Son una carga para el estado", "agree"),
 "C_004_211": ("NO dan mas de lo que reciben", "disagree"),
 "C_004_212": ("NO ayudar a los perseguidos politicos", "disagree"),
 "C_004_213": ("NO deben tener igual acceso a salud/educacion", "disagree"),
 "C_004_214": ("Enviarlos de regreso a su pais", "eq:1"),
}

# (anio, archivo, encoding, var_pais, var_peso, {codigo: var_cruda})
ROUNDS = [
 (2020, "LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", {
    "C_004_201":"p37n_a", "C_004_202":"p37n_b", "C_004_203":"p37n_c", "C_004_204":"p37n_d",
    "C_004_205":"p38n",   "C_004_206":"p39n_a", "C_004_207":"p39st_b","C_004_208":"p39n_c",
    "C_004_209":"p39n_d", "C_004_210":"p39n_e", "C_004_211":"p39n_f", "C_004_212":"p39n_g",
    "C_004_213":"p39n_h", "C_004_214":"p40n"}),
 (2023, "LAT2023/Latinobarometro_2023_Esp_Stata_v1_0.dta", "utf-8", "idenpa", "wt", {
    "C_004_205":"P32INN", "C_004_206":"P33N_A", "C_004_207":"P33ST_B", "C_004_208":"P33N_C",
    "C_004_209":"P33N_D"}),
 (2024, "Latinobarometro_2024_Stata_esp_v20250817.dta", "latin1", "IDENPA", "WT", {
    "C_004_205":"P34ST", "C_004_206":"P33ST.A", "C_004_207":"P33ST.B", "C_004_208":"P33N.C"}),
]

MIN_N = 150


def hostile_flag(s, rule):
    """Devuelve serie 0/1 (hostil) con NaN en los casos no validos."""
    if rule == "agree":      valid, hostile = {1, 2, 3, 4}, {1, 2}
    elif rule == "disagree": valid, hostile = {1, 2, 3, 4}, {3, 4}
    elif rule == "in:3,4":   valid, hostile = {1, 2, 3, 4}, {3, 4}
    elif rule.startswith("eq:"):
        valid, hostile = {1, 2, 3}, {int(rule.split(":")[1])}
    else: raise ValueError(rule)
    out = pd.Series(np.nan, index=s.index)
    m = s.isin(valid)
    out[m] = s[m].isin(hostile).astype(float)
    return out


def load_round(year, fname, enc, cpais, cw, varmap):
    cols = [cpais, cw] + list(varmap.values())
    df, _ = pyreadstat.read_dta(os.path.join(LB, fname), usecols=cols, encoding=enc)
    for c in cols:                                   # 2024 viene como object (strings)
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["iso3"] = df[cpais].map(NUM2ISO3)
    df["w"] = df[cw]
    df.loc[~(df["w"] > 0), "w"] = np.nan
    assert df["iso3"].notna().all(), f"{year}: codigos de pais sin mapear"
    for code, raw in varmap.items():
        df[code] = hostile_flag(df[raw], ITEMS[code][1])
    return df


def wavg(vals, w):
    m = vals.notna() & w.notna()
    if m.sum() < MIN_N: return None, int(m.sum())
    return float(np.average(vals[m], weights=w[m]) * 100), int(m.sum())


# ---------------- 1) % por pais x ronda x item ----------------
rows, micro = [], {}
for year, fname, enc, cpais, cw, varmap in ROUNDS:
    df = load_round(year, fname, enc, cpais, cw, varmap)
    micro[year] = df
    print(f"{year}: n={len(df):,}  paises={df.iso3.nunique()}  items={len(varmap)}")
    for iso3, g in df.groupby("iso3"):
        for code in varmap:
            pct, n = wavg(g[code], g["w"])
            if pct is None:
                print(f"    ! {iso3} {year} {code}: n={n} < {MIN_N}, se descarta")
                continue
            rows.append((iso3, year, code, ITEMS[code][0], round(pct, 1), n))

long = pd.DataFrame(rows, columns=["iso3", "ronda", "item", "item_label", "pct_hostil", "n"])
long = long.sort_values(["item", "ronda", "pct_hostil"])
long.to_csv(os.path.join(HERE, "lb_migra_pais_ronda.csv"), index=False, encoding="utf-8")
print(f"\nlb_migra_pais_ronda.csv -> {len(long)} filas")

wide = long.pivot_table(index=["iso3", "ronda"], columns="item", values="pct_hostil")
w2020 = wide.xs(2020, level="ronda")
w2020.round(1).to_csv(os.path.join(HERE, "lb_migra_wide_2020.csv"), encoding="utf-8")

# tabla ancha pais x (item, ronda), la mas comoda para leer
tab = long.pivot_table(index="iso3", columns=["item", "ronda"], values="pct_hostil")
tab = tab.reindex(sorted(tab.columns, key=lambda c: (c[0], c[1])), axis=1)
tab.columns = [f"{i}_{r}" for i, r in tab.columns]
COMMON4 = ["C_004_205", "C_004_206", "C_004_207", "C_004_208"]
for r in (2020, 2023, 2024):
    cs = [f"{i}_{r}" for i in COMMON4 if f"{i}_{r}" in tab.columns]
    tab[f"IDX4_{r}"] = tab[cs].mean(axis=1).round(1)
tab["IDX14_2020"] = w2020.mean(axis=1).round(1)
tab.round(1).to_csv(os.path.join(HERE, "lb_migra_tabla_pais_item_ronda.csv"), encoding="utf-8")

# ---------------- 2) correlaciones ----------------
def cronbach(X):
    X = X.dropna()
    k = X.shape[1]
    if k < 2 or len(X) < 3: return np.nan, len(X)
    return float(k / (k - 1) * (1 - X.var(ddof=1).sum() / X.sum(axis=1).var(ddof=1))), len(X)

c2020 = w2020.corr()
c2020.round(3).to_csv(os.path.join(HERE, "lb_migra_corr_2020.csv"), encoding="utf-8")

COMMON = ["C_004_205", "C_004_206", "C_004_207", "C_004_208"]
panel = wide[COMMON].dropna()
# correlacion "within": se saca la media de cada ronda para que el nivel no infle la r
dm = panel.groupby(level="ronda").transform(lambda s: s - s.mean())
cpan = panel.corr()
cpan.round(3).to_csv(os.path.join(HERE, "lb_migra_corr_panel.csv"), encoding="utf-8")

print("\n===== CORRELACION 2020 (18 paises, 14 items) =====")
print(c2020.round(2).to_string())
print("\n===== r promedio de cada item con el resto (2020) =====")
avg_r = ((c2020.sum() - 1) / (len(c2020) - 1)).sort_values()
print(avg_r.round(3).to_string())

print("\n===== PANEL pais-ronda, items comunes =====")
print(f"obs={len(panel)}  (2020/2023/2024)")
print("r cruda:\n" + cpan.round(3).to_string())
print("r within-ronda:\n" + dm.corr().round(3).to_string())

print("\n===== ALFA DE CRONBACH (nivel pais) =====")
sets = {
 "14 items (2020)": list(w2020.columns),
 "13 items sin 208 (2020)": [c for c in w2020.columns if c != "C_004_208"],
 "bateria nucleo 205-209 (2020)": ["C_004_205","C_004_206","C_004_207","C_004_208","C_004_209"],
 "nucleo sin 208 (2020)": ["C_004_205","C_004_206","C_004_207","C_004_209"],
 "4 comunes (panel)": None,
}
for name, cols in sets.items():
    X = panel if cols is None else w2020[cols]
    a, n = cronbach(X)
    print(f"  {name:34s} k={X.shape[1]:2d} n={n:3d}  alpha={a:.3f}")

print("\n== alpha-if-item-deleted (14 items, 2020) ==")
base_a, _ = cronbach(w2020)
for c in w2020.columns:
    a, _ = cronbach(w2020.drop(columns=[c]))
    print(f"  sin {c} ({ITEMS[c][0][:40]:40s}) alpha={a:.3f}  delta={a-base_a:+.3f}")

# ---------------- 3) alfa a nivel individual (2020, el test psicometrico duro) ----------------
d20 = micro[2020]
IND = ["C_004_205","C_004_206","C_004_207","C_004_208","C_004_209",
       "C_004_210","C_004_211","C_004_212","C_004_213"]
Xi = d20[IND].dropna()
a_i, n_i = cronbach(Xi)
print(f"\n===== ALFA a nivel INDIVIDUAL 2020 (9 items dicotomizados) k=9 n={n_i:,} alpha={a_i:.3f} =====")
print("r individual (Pearson sobre el 0/1 hostil):")
print(Xi.corr().round(2).to_string())

# ---------------- 4) indice promedio y ranking de Argentina ----------------
idx = w2020.mean(axis=1).sort_values(ascending=False)
print("\n===== INDICE PROMEDIO 2020 (media simple de los 14 items, mayor = mas hostil) =====")
print(idx.round(1).to_string())

print("\n===== POSICION DE ARGENTINA (1 = MAS hostil) =====")
for code in sorted(long.item.unique()):
    for r in sorted(long[long.item == code].ronda.unique()):
        s = long[(long.item == code) & (long.ronda == r)].sort_values("pct_hostil", ascending=False)
        s = s.reset_index(drop=True)
        pos = s.index[s.iso3 == "ARG"]
        if not len(pos): continue
        i = pos[0]
        print(f"  {code} {r}: ARG {i+1}/{len(s)} = {s.loc[i,'pct_hostil']:.1f}%  "
              f"(mediana {s.pct_hostil.median():.1f}%, max {s.iloc[0].iso3} {s.iloc[0].pct_hostil:.1f}%, "
              f"min {s.iloc[-1].iso3} {s.iloc[-1].pct_hostil:.1f}%)")

# correlacion del indice con cada item (que tan bien lo representa una sola pregunta)
print("\n===== r del INDICE 2020 con cada item (y con 205 sola) =====")
for c in w2020.columns:
    print(f"  {c}: r(item, indice)={w2020[c].corr(idx):.3f}   r(item, 205)={w2020[c].corr(w2020['C_004_205']):.3f}")
print(f"\n  r(205, indice) = {w2020['C_004_205'].corr(idx):.3f}")
print(f"  r(205, indice sin 205) = {w2020['C_004_205'].corr(w2020.drop(columns=['C_004_205']).mean(axis=1)):.3f}")
