# -*- coding: utf-8 -*-
"""Extrae de la IVS (1981-2022) las variables de discriminacion / actitudes hacia
otros grupos aprobadas para el N.5, en UNA sola lectura del .dta.

Output: ivs_discrim.pkl  (subset crudo, codigos negativos ya pasados a NaN)
        ivs_discrim_labels.txt  (value labels de cada variable, para auditoria)

Gotchas replicados de ivs_extract.py / relevamiento de metadata:
  * S002VS viene VACIA para los casos de EVS -> derivar wave_u con S002EVS.
  * Codigos negativos = missing en toda la IVS (las convenciones cambian por
    variable: -5..-1, -5/-4/-2/-1, etc). Se filtra por signo, no por lista.
  * Los value labels traen basura string 'a'..'e' heredada de SPSS: ordenar con
    key=lambda z: (isinstance(z, str), z) o explota el sorted().
  * Ponderar SIEMPRE por S017.
"""
import pyreadstat, pandas as pd, numpy as np, os, time

DTA = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\World Values Survey\IVS\Integrated_values_surveys_1981-2022.dta"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ivs_discrim.pkl")
OUT_LAB = os.path.join(HERE, "ivs_discrim_labels.txt")

ADMIN = ["S001", "S002VS", "S002EVS", "S003", "S009", "S017", "S020"]

# --- variables aprobadas + hermanas de bateria que el relevamiento marco relevantes
VARS = [
    # bateria "frecuencia en tu barrio" (H002_04 = racismo; las 4 hermanas = benchmark)
    "H002_01", "H002_02", "H002_03", "H002_04", "H002_05",
    # prioridad de nativos en el empleo + hermanas de la misma bateria (C001/C005)
    "C002", "C002_01", "C001", "C001_01", "C005",
    # politica migratoria
    "E143",
    # impacto de los inmigrantes
    "G052",
    # bateria europea de 10 puntos
    "G038", "G040", "G041", "G043",
    # circulo moral (E156 = denominador natural de E161)
    "E161", "E156", "E154", "E157", "E158",
    # confianza en otros grupos (G007_36_B = la que agrego el relevamiento)
    "G007_36_B", "G007_35_B", "G007_34_B", "G007_18_B", "G007_01",
    # identidad nacional / nativismo (EVS)
    "G033", "G034", "G035", "G036", "G006",
    # tolerancia como valor + confianza generalizada
    "A035", "A165",
    # el cruce estrella: "no querria de vecinos a gente de otra raza"
    "A124_02", "A124_06",
    # etnia autodeclarada + clase (para cruces dentro de pais)
    "X051", "X045",
]

t0 = time.time()
_, meta0 = pyreadstat.read_dta(DTA, metadataonly=True)
avail = set(meta0.column_names)
missing = [v for v in ADMIN + VARS if v not in avail]
vars_ok = [v for v in VARS if v in avail]
if missing:
    print("NO EXISTEN en el .dta (se omiten):", missing)
print(f"metadata leida en {time.time()-t0:.0f}s | vars pedidas={len(VARS)} ok={len(vars_ok)}")

t0 = time.time()
df, meta = pyreadstat.read_dta(DTA, usecols=[c for c in ADMIN if c in avail] + vars_ok)
print(f"read in {time.time()-t0:.0f}s, shape={df.shape}")

# ---- fix de olas: S002VS vacia para EVS
df["wave_u"] = df["S002VS"]
evs_map = {1: 1, 2: 2, 3: 4, 4: 5, 5: 7}
m = df["wave_u"].isna() & (df["S001"] == 1)
df.loc[m, "wave_u"] = df.loc[m, "S002EVS"].map(evs_map)
print(f"wave_u imputada para {int(m.sum())} casos EVS | wave_u nula: {int(df['wave_u'].isna().sum())}")

# ---- negativos = missing
for c in vars_ok:
    df.loc[df[c] < 0, c] = np.nan

# ---- peso
df["w"] = pd.to_numeric(df["S017"], errors="coerce")
df.loc[~(df["w"] > 0), "w"] = np.nan

df.to_pickle(OUT)
print("saved subset ->", OUT, f"({os.path.getsize(OUT)/1e6:.0f} MB)")

# ---- dump de value labels (auditoria de escalas)
with open(OUT_LAB, "w", encoding="utf-8") as f:
    for c in vars_ok:
        lab = meta.column_names_to_labels.get(c, "")
        f.write(f"\n=== {c} :: {lab}\n")
        vl = meta.variable_value_labels.get(c, {})
        for k in sorted(vl, key=lambda z: (isinstance(z, str), z)):
            f.write(f"   {k!r:>10} -> {vl[k]}\n")
print("labels ->", OUT_LAB)

# ---- diagnostico rapido
print("\n== casos por ola x estudio ==")
print(pd.crosstab(df["wave_u"], df["S001"].map({1: "EVS", 2: "WVS"})).to_string())
print("\n== no-missing por variable ==")
for c in vars_ok:
    n = int(df[c].notna().sum())
    print(f"  {c:<12} n={n:>7}  paises={df.loc[df[c].notna(),'S003'].nunique():>3}  "
          f"anios={int(df.loc[df[c].notna(),'S020'].min()) if n else 0}-"
          f"{int(df.loc[df[c].notna(),'S020'].max()) if n else 0}")
