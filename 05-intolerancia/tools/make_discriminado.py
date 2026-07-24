# -*- coding: utf-8 -*-
"""Genera data-discriminado.js (CHART 11 del N°5).

"Cada vez más latinoamericanos se sienten parte de un grupo discriminado":
serie temporal del Latinobarómetro (2009-2020) del % que responde SÍ a
A_011_001 "¿Se describiría como parte de un grupo que es discriminado en (país)?"
(1 Sí / 2 No), ponderado por wt. Enunciado textualmente idéntico entre rondas.

Dos universos, misma forma de datos (clon del renderer de pelicula.js):
  - "pais"  : los 18 países del Latinobarómetro, una serie por país.
  - "etnia" : 5 grupos étnicos autopercibidos POOLED REGIONAL (no por país;
              Argentina no se puede abrir por etnia: afro/indígena con n<15).
              Cruce con A_011_011 "Raza a la que pertenece", recodificada
              blanco / mestizo / indígena / afro (negro+mulato) / otros.

Rondas y nombres crudos de las variables (verificados con metadata):
  año   discriminado   raza   encoding   archivo
  2009  p65n           s18    utf-8      LAT2009/..._esp_v2014_06_27.dta
  2010  P52ST          S20    latin1     LAT2010/..._esp_v2014_06_27.dta
  2011  P63ST          S27    latin1     LAT2011/Latinobarometro_2011_esp.dta
  2015  P64ST          S23    latin1     LAT2015/Latinobarometro_2015_Esp.dta
  2020  p57st          s12    utf-8      LAT2020/..._Esp_Stata_v1_0.dta

Gotchas: ponderar SIEMPRE (wt); códigos negativos = missing; España está en la
muestra 2009 pero SIN el ítem -> cae sola (si todo NaN). El set de países con
dato cambia entre rondas: la media regional se calcula sobre el panel balanceado.

Salida principal -> ../data-discriminado.js  (DISC_META + DISC_SERIES).
Salida auxiliar  -> lb_discriminado_pais_serie.csv  (país×año)
                    lb_discriminado_x_raza_serie.csv (grupo×año, pooled)
                    lb_discriminado_x_raza_pais.csv   (país×grupo×año)
No se redistribuyen microdatos: sólo agregados.
"""
import pyreadstat, pandas as pd, numpy as np, json, os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
LB = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\Latinobarometro"
HERE = os.path.dirname(os.path.abspath(__file__))

NUM2ISO3 = {32: "ARG", 68: "BOL", 76: "BRA", 152: "CHL", 170: "COL", 188: "CRI",
            214: "DOM", 218: "ECU", 222: "SLV", 320: "GTM", 340: "HND", 484: "MEX",
            558: "NIC", 591: "PAN", 600: "PRY", 604: "PER", 724: "ESP", 858: "URY", 862: "VEN"}
# recodificación analítica de raza (afro = negro + mulato); idéntica a lb_discrim_profile.py
RAZA_G = {1: "otros", 2: "afro", 3: "indigena", 4: "mestizo", 5: "afro", 6: "blanco", 7: "otros"}
ETNIA_ORDER = ["indigena", "afro", "mestizo", "otros", "blanco"]  # para keys/iteración
ETNIA_LABELS = {
    "es": {"blanco": "Blancos", "mestizo": "Mestizos", "indigena": "Indígenas",
           "afro": "Afrodescendientes", "otros": "Otros / asiáticos"},
    "en": {"blanco": "White", "mestizo": "Mestizo", "indigena": "Indigenous",
           "afro": "Afro-descendant", "otros": "Other / Asian"},
}

ROUNDS = [
    (2009, "LAT2009/Latinobarometro_2009_datos_esp_v2014_06_27.dta", "utf-8", "p65n", "s18"),
    (2010, "LAT2010/Latinobarometro_2010_datos_esp_v2014_06_27.dta", "latin1", "P52ST", "S20"),
    (2011, "LAT2011/Latinobarometro_2011_esp.dta", "latin1", "P63ST", "S27"),
    (2015, "LAT2015/Latinobarometro_2015_Esp.dta", "latin1", "P64ST", "S23"),
    (2020, "LAT2020/Latinobarometro_2020_Esp_Stata_v1_0.dta", "utf-8", "p57st", "s12"),
]
YEARS = [r[0] for r in ROUNDS]


def num(s):
    return pd.to_numeric(s, errors="coerce")


def wmean(x, w):
    m = x.notna() & w.notna() & (w > 0)
    if m.sum() == 0:
        return np.nan
    return float(np.average(x[m].astype(float), weights=w[m]))


# ---------------------------------------------------------------- carga cruda
pais_rows = []     # iso3, year, pct_si, n_valid, n_total, pct_respuesta
etnia_rows = []    # year, grupo, pct_si, n
paisxraza_rows = []  # iso3, year, grupo, pct_si, n

for year, fname, enc, vdisc, vraza in ROUNDS:
    df, _ = pyreadstat.read_dta(os.path.join(LB, fname),
                                usecols=["idenpa", "wt", vdisc, vraza], encoding=enc)
    df["iso3"] = num(df["idenpa"]).map(NUM2ISO3)
    df["w"] = num(df["wt"])
    v = num(df[vdisc])
    df["si"] = np.where(v == 1, 1.0, np.where(v == 2, 0.0, np.nan))
    df["grupo"] = num(df[vraza]).map(RAZA_G)

    # ---- % SÍ por país
    for iso3, g in df[df.iso3.notna()].groupby("iso3"):
        n_tot = len(g)
        valid = g.si.notna() & g.w.notna() & (g.w > 0)
        n_val = int(valid.sum())
        if n_val == 0:            # España 2009: la pregunta no se hizo -> cae sola
            continue
        pct = wmean(g.si, g.w) * 100
        pais_rows.append((iso3, year, round(pct, 1), n_val, n_tot, round(100 * n_val / n_tot, 1)))

    # ---- % SÍ por grupo étnico, POOLED regional (todos los países juntos, pond. wt)
    b = df[df.iso3.notna() & (df.w > 0) & df.si.notna() & df.grupo.notna()]
    for gr, g in b.groupby("grupo"):
        etnia_rows.append((year, gr, round(wmean(g.si, g.w) * 100, 1), int(len(g))))
    # ---- país × grupo (auxiliar; para inspección y la brecha intra-país)
    for (iso3, gr), g in b.groupby(["iso3", "grupo"]):
        paisxraza_rows.append((iso3, year, gr, round(wmean(g.si, g.w) * 100, 1), int(len(g))))

    print(f"  {year} {vdisc}/{vraza} ({enc}): {df.iso3.nunique()} países en el mapa, "
          f"n={len(df)}")

dp = pd.DataFrame(pais_rows, columns=["iso3", "year", "pct_si", "n_valid", "n_total", "pct_respuesta"])
de = pd.DataFrame(etnia_rows, columns=["year", "grupo", "pct_si", "n"])
dpr = pd.DataFrame(paisxraza_rows, columns=["iso3", "year", "grupo", "pct_si", "n"])

dp.to_csv(os.path.join(HERE, "lb_discriminado_pais_serie.csv"), index=False)
de.to_csv(os.path.join(HERE, "lb_discriminado_x_raza_serie.csv"), index=False)
dpr.to_csv(os.path.join(HERE, "lb_discriminado_x_raza_pais.csv"), index=False)

# ---------------------------------------------------------------- series JS
PAISES = sorted(dp.iso3.unique().tolist())
serie_pais = {}
for iso3, g in dp.sort_values("year").groupby("iso3"):
    serie_pais[iso3] = [[int(r.year), float(r.pct_si), int(r.n_valid)] for r in g.itertuples()]

serie_etnia = {}
for gr in ETNIA_ORDER:
    g = de[de.grupo == gr].sort_values("year")
    serie_etnia[gr] = [[int(r.year), float(r.pct_si), int(r.n)] for r in g.itertuples()]

# ---- media regional simple sobre el PANEL BALANCEADO (países con dato en todas las rondas)
cnt = dp.groupby("iso3").year.nunique()
panel = sorted(cnt[cnt == len(YEARS)].index.tolist())
region_avg = []
for y in YEARS:
    sub = dp[(dp.year == y) & (dp.iso3.isin(panel))]
    region_avg.append([y, round(float(sub.pct_si.mean()), 1)])

DEFAULT_PAIS = ["ARG", "BRA", "CHL", "MEX", "URY"]
DEFAULT_ETNIA = ["indigena", "afro", "mestizo", "blanco"]

meta = {
    "years": YEARS,
    "pais": {"keys": PAISES, "default": DEFAULT_PAIS},
    "etnia": {"keys": ETNIA_ORDER, "default": DEFAULT_ETNIA, "labels": ETNIA_LABELS},
    "regionAvg": region_avg,          # media simple del panel balanceado
    "regionAvgPanel": panel,          # países que la componen (dato en las 5 rondas)
}
series = {"pais": serie_pais, "etnia": serie_etnia}

out = [
    "// GENERADO por tools/make_discriminado.py — no editar a mano.",
    "// CHART 11 N°5: % que se describe como parte de un grupo discriminado (Latinobarómetro).",
    "// DISC_SERIES[universo][clave] = [[año, pct, n], ...]  (el renderer sólo usa año y pct).",
    "//   universo 'pais'  -> clave = iso3 (18 países).",
    "//   universo 'etnia' -> clave = grupo étnico POOLED regional (blanco/mestizo/indigena/afro/otros).",
    "// DISC_META.regionAvg = media simple del panel balanceado (" + ",".join(panel) + ").",
    "const DISC_META = " + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";",
    "const DISC_SERIES = " + json.dumps(series, ensure_ascii=False, separators=(",", ":")) + ";",
]
path = os.path.join(HERE, "..", "data-discriminado.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"\ndata-discriminado.js -> {os.path.getsize(path)/1024:.1f}KB | "
      f"{len(PAISES)} países, {len(ETNIA_ORDER)} grupos, años {YEARS}")

# ================================================================ VERIFICACIÓN
print("\n" + "=" * 70)
print("VERIFICACIÓN contra el brief")
print("=" * 70)


def pais_val(iso3, year):
    r = dp[(dp.iso3 == iso3) & (dp.year == year)]
    return None if r.empty else float(r.pct_si.iloc[0])


def etnia_val(gr, year):
    r = de[(de.grupo == gr) & (de.year == year)]
    return None if r.empty else float(r.pct_si.iloc[0])


checks = []
# 1) media simple 18 países 2009 y 2020
p09 = dp[dp.year == 2009]; p20 = dp[dp.year == 2020]
m09, m20 = round(p09.pct_si.mean(), 1), round(p20.pct_si.mean(), 1)
checks.append(("media simple 2009 = 17,5", m09, 17.5))
checks.append(("media simple 2020 = 21,5", m20, 21.5))
print(f"[1] media simple {len(p09)} países 2009 = {m09} | {len(p20)} países 2020 = {m20}")

# 2) Argentina 19,3 -> 31,0 (+11,7)
a09, a20 = pais_val("ARG", 2009), pais_val("ARG", 2020)
checks += [("ARG 2009 = 19,3", a09, 19.3), ("ARG 2020 = 31,0", a20, 31.0),
           ("ARG delta = +11,7", round(a20 - a09, 1), 11.7)]
print(f"[2] ARG {a09} -> {a20} (delta {round(a20-a09,1)})")

# 3) ranking ARG 2009 y 2020
rk09 = p09.sort_values("pct_si", ascending=False).reset_index(drop=True)
rk20 = p20.sort_values("pct_si", ascending=False).reset_index(drop=True)
pos09 = int(rk09.index[rk09.iso3 == "ARG"][0]) + 1
pos20 = int(rk20.index[rk20.iso3 == "ARG"][0]) + 1
checks += [("ARG ranking 2009 = 7", pos09, 7), ("ARG ranking 2020 = 4", pos20, 4)]
print(f"[3] ranking ARG: 2009 = {pos09}/{len(rk09)} | 2020 = {pos20}/{len(rk20)}")

# 4) mayores subas: Chile 14,7->35,3 ; Brasil 26,4->40,3
c09, c20 = pais_val("CHL", 2009), pais_val("CHL", 2020)
b09, b20 = pais_val("BRA", 2009), pais_val("BRA", 2020)
checks += [("CHL 2009 = 14,7", c09, 14.7), ("CHL 2020 = 35,3", c20, 35.3),
           ("BRA 2009 = 26,4", b09, 26.4), ("BRA 2020 = 40,3", b20, 40.3)]
print(f"[4] CHL {c09}->{c20} (+{round(c20-c09,1)}) | BRA {b09}->{b20} (+{round(b20-b09,1)})")

# 5) bajas: Honduras -3,9 Guatemala -3,6 Ecuador -2,9 México -2,3 Perú -1,3
for iso, exp in [("HND", -3.9), ("GTM", -3.6), ("ECU", -2.9), ("MEX", -2.3), ("PER", -1.3)]:
    d = round(pais_val(iso, 2020) - pais_val(iso, 2009), 1)
    checks.append((f"{iso} delta = {exp}", d, exp))
    print(f"[5] {iso} delta 2009->2020 = {d} (brief {exp})")

# 6) cruce étnico pooled 2009 y 2020
for gr, y, exp in [("indigena", 2009, 32.4), ("indigena", 2020, 29.8),
                   ("blanco", 2009, 14.1), ("blanco", 2020, 20.2),
                   ("afro", 2009, 20.3), ("afro", 2020, 25.8),
                   ("mestizo", 2009, 16.2), ("mestizo", 2020, 20.9)]:
    val = etnia_val(gr, y)
    checks.append((f"{gr} {y} = {exp}", val, exp))
print("[6] pooled étnico 2009/2020:",
      {gr: (etnia_val(gr, 2009), etnia_val(gr, 2020)) for gr in ["indigena", "blanco", "afro", "mestizo"]})

# 7) brecha indígena-blanco DENTRO de país (paired, media simple), 2009 y 2020
for y, exp in [(2009, 12.6), (2020, 10.6)]:
    difs = []
    for iso3 in dpr.iso3.unique():
        bl = dpr[(dpr.iso3 == iso3) & (dpr.year == y) & (dpr.grupo == "blanco")]
        ind = dpr[(dpr.iso3 == iso3) & (dpr.year == y) & (dpr.grupo == "indigena")]
        # celdas con n>=50 para que el pareado sea estable (criterio del brief)
        if bl.empty or ind.empty or bl.n.iloc[0] < 50 or ind.n.iloc[0] < 50:
            continue
        difs.append(ind.pct_si.iloc[0] - bl.pct_si.iloc[0])
    gap = round(float(np.mean(difs)), 1)
    checks.append((f"brecha indígena-blanco intra-país {y} = {exp}", gap, exp))
    print(f"[7] brecha indígena-blanco intra-país {y} = {gap} pp "
          f"(n países={len(difs)}, brief {exp})")

print("\n" + "-" * 70)
ok = True
for name, got, exp in checks:
    hit = (got is not None) and abs(got - exp) <= 0.15
    ok = ok and hit
    print(f"  {'OK ' if hit else 'XX '} {name:42s} obtenido={got}")
print("-" * 70)
print("TODOS COINCIDEN" if ok else ">>> HAY DISCREPANCIAS, revisar <<<")
