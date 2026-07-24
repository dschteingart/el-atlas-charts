# -*- coding: utf-8 -*-
"""Genera data-confianza.js: datos del CHART 10 — "¿Argentina desconfía menos del
extranjero, o desconfía menos de todo el mundo?".

Scatter de 92 países (IVS, ola 7 = 2017-2023). Indicador: % que "no confía mucho /
nada" (respuestas 3-4 sobre la escala 1-4 de la batería de confianza G007_*_B),
ponderado por S017. Los tres ítems ya vienen agregados en tools/ivs_discrim_largo.csv
(iso3, region, wave, year, studies, var, pct, n), que reproduce el brief.

  x    = desconfía de gente que conoce por primera vez  (G007_34_B)  [eje X, común]
  yNat = desconfía de gente de otra nacionalidad        (G007_36_B)  [eje Y default]
  yRel = desconfía de gente de otra religión            (G007_35_B)  [toggle]

Salida (patrón data-implicito.js, clonado por chart 10):
  CONF[iso3] = {region, x, yNat, yRel}          (una fila compacta por país)
  CONF_FIT   = {nat:{slope,intercept,r,r2,n}, rel:{...}}   ajuste OLS y-sobre-x
  CONF_META  = {wave, years, items:{x,yNat,yRel:{es,en}}}

Los dos ejes van en la MISMA escala 0-100 (el chart dibuja la recta de 45° además
de la de ajuste). Reportar SIEMPRE diferencia (y-x) y residuo (y - ŷ), nunca el
cociente (correlaciona con el nivel, r~0,51).
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
LARGO = os.path.join(HERE, "ivs_discrim_largo.csv")

X_VAR, YNAT_VAR, YREL_VAR = "G007_34_B", "G007_36_B", "G007_35_B"
WAVE = 7

ITEMS = {
    "x":    {"es": "Desconfía de gente que conoce por primera vez",
             "en": "Distrusts people they meet for the first time"},
    "yNat": {"es": "Desconfía de gente de otra nacionalidad",
             "en": "Distrusts people of another nationality"},
    "yRel": {"es": "Desconfía de gente de otra religión",
             "en": "Distrusts people of another religion"},
}

# ---- leer el largo tidy y quedarnos con la ola 7 y los tres ítems
lg = pd.read_csv(LARGO)
sub = lg[(lg.wave == WAVE) & (lg["var"].isin([X_VAR, YNAT_VAR, YREL_VAR]))].copy()

# el largo trae una fila por iso3 x var (studies ya combinado EVS+WVS); si hubiera
# más de una, promediamos ponderando por n (mismo criterio que make_waves.py).
# series() devuelve PRECISIÓN COMPLETA (para el ajuste); CONF guarda 1 decimal.
def series(var):
    s = sub[sub["var"] == var]
    return {iso: float(np.average(g.pct, weights=g.n)) for iso, g in s.groupby("iso3")}

X, YNAT, YREL = series(X_VAR), series(YNAT_VAR), series(YREL_VAR)
region = dict(sub.drop_duplicates("iso3")[["iso3", "region"]].values.tolist())

# universo: países con X y al menos un eje Y (acá los tres coinciden: 92 países)
isos = sorted(i for i in X if (i in YNAT or i in YREL))
r1 = lambda v: None if v is None else round(v, 1)
conf = {}
for iso in isos:
    conf[iso] = {"region": region[iso], "x": r1(X[iso]),
                 "yNat": r1(YNAT.get(iso)), "yRel": r1(YREL.get(iso))}

# ---- ajuste OLS (y sobre x) por dimensión, sobre la PRECISIÓN COMPLETA del largo
#      (reproduce el brief: nat slope=1,083 R2=0,688). El chart dibuja la recta con
#      estos coeficientes; residuo_pais = y - (intercept + slope*x).
def ols(Y):
    pairs = [(X[i], Y[i]) for i in isos if i in Y]
    xs = np.array([p[0] for p in pairs], float)
    ys = np.array([p[1] for p in pairs], float)
    b1, b0 = np.polyfit(xs, ys, 1)
    yhat = b0 + b1 * xs
    r = float(np.corrcoef(xs, ys)[0, 1])
    r2 = 1 - np.sum((ys - yhat) ** 2) / np.sum((ys - ys.mean()) ** 2)
    return {"slope": round(float(b1), 3), "intercept": round(float(b0), 3),
            "r": round(r, 3), "r2": round(float(r2), 3), "n": int(len(xs))}

fit = {"nat": ols(YNAT), "rel": ols(YREL)}
meta = {"wave": WAVE, "years": "2017-2023", "items": ITEMS}

out = [
    "// GENERADO por tools/make_confianza.py — no editar a mano.",
    "// CONF[iso3] = {region, x, yNat, yRel}. IVS ola 7 (2017-2023), % que \"no confía",
    "// mucho / nada\" (respuestas 3-4 sobre 1-4, ponderado S017). Ambos ejes 0-100.",
    "//   x=desconoc. (G007_34_B) · yNat=otra nacion. (G007_36_B) · yRel=otra relig. (G007_35_B)",
    "const CONF_META = " + json.dumps(meta, ensure_ascii=False) + ";",
    "const CONF_FIT = " + json.dumps(fit, ensure_ascii=False) + ";",
    "const CONF = " + json.dumps(conf, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";",
]
path = os.path.join(HERE, "..", "data-confianza.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-confianza.js -> {os.path.getsize(path)/1024:.1f}KB | paises={len(conf)}")

# ================= VERIFICACIÓN contra el brief =================
def rank_desc(vals, iso):
    order = sorted(vals, key=lambda i: vals[i], reverse=True)  # 1 = más desconfía
    return order.index(iso) + 1, len(order)

gap = {i: round(conf[i]["yNat"] - conf[i]["x"], 1) for i in isos if conf[i]["yNat"] is not None}
b1, b0 = fit["nat"]["slope"], fit["nat"]["intercept"]
resid = {i: round(conf[i]["yNat"] - (b0 + b1 * conf[i]["x"]), 1) for i in gap}

print("\n== VERIFICACIÓN ==")
print(f"NAT fit: r={fit['nat']['r']}  slope={fit['nat']['slope']}  R2={fit['nat']['r2']}  n={fit['nat']['n']}")
print(f"REL fit: r={fit['rel']['r']}  slope={fit['rel']['slope']}  R2={fit['rel']['r2']}  n={fit['rel']['n']}")
print(f"ARG: x={conf['ARG']['x']}  yNat={conf['ARG']['yNat']}  gap={gap['ARG']}  residuo={resid['ARG']}")
pr, N = rank_desc({i: conf[i]['yNat'] for i in gap}, 'ARG')
prr, _ = rank_desc(resid, 'ARG')
print(f"ARG puesto crudo (por yNat, desc)={pr}/{N} · puesto por residuo (desc)={prr}/{N}")
print("gaps LatAm:", {c: gap[c] for c in ['PRI', 'PER', 'NIC', 'BOL', 'COL', 'BRA', 'CHL'] if c in gap})
print("controles LatAm (residuo):", {c: resid[c] for c in ['BRA', 'CHL'] if c in resid})
print("xenofobia específica (gap+ top):",
      {i: gap[i] for i in sorted(gap, key=gap.get, reverse=True)[:4]})
# cociente correlaciona con el nivel (advertencia del brief)
xs = np.array([conf[i]['x'] for i in gap], float)
ys = np.array([conf[i]['yNat'] for i in gap], float)
q = ys / xs
print(f"cociente yNat/x vs nivel x: r={np.corrcoef(q, xs)[0,1]:.3f}  (esperado ~0,51)")
