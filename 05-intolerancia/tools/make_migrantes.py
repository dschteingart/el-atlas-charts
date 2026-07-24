# -*- coding: utf-8 -*-
"""Genera data-migrantes.js: CHART 9 del N°5 (perfil migratorio, Latinobarometro 2020).

Perfil de pais con la bateria de 14 items sobre inmigrantes (mayor % = MAS hostil).
Dos modos que consume el chart (toggle, default CENTRADO):

  - NIVEL CRUDO   : MG_LEVEL[iso] = [% hostil por item] + MG_MED (mediana regional cruda).
  - PERFIL CENTRADO: MG_PROFILE[iso] = desvio por item, con la receta
        perfil = (pct_item_pais - promedio de los 14 items del pais)
                 - mediana regional de ESE MISMO desvio.
    Por construccion, la mediana regional de cada columna del perfil es 0: cada barra
    dice cuanto SOBRESALE ese item respecto de lo que seria normal en la region, una vez
    descontado que el pais sea en general mas/menos hostil.

Foto, no pelicula: la bateria de 14 items existe solo en 2020 (relevado en pico de crisis
migratoria venezolana + pandemia). Venezuela no tiene el item 204 (inmigrantes de Venezuela):
esa barra va con 17 paises.

Lee el CSV ya agregado y ponderado tools/lb_migra_pais_ronda.csv (lo produjo
lb_migra_profile.py desde el .dta, ponderando con wt y tratando negativos como missing).
Patron: make_waves.py / make_all_datajs.py (leen los CSV agregados, no el crudo).
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
YEAR = 2020

# orden fijo de los 14 items + etiqueta corta ES (fallback; el display real sale de i18n).
# Todos orientados en el MISMO sentido: mayor % = mas hostil al inmigrante.
ITEMS = [
    ("C_004_201", "Recibir inmigrantes de fuera de América Latina"),
    ("C_004_202", "Recibir inmigrantes de América Latina"),
    ("C_004_203", "Recibir inmigrantes de Haití"),
    ("C_004_204", "Recibir inmigrantes de Venezuela"),
    ("C_004_205", "La inmigración perjudica al país"),
    ("C_004_206", "No son buenos para la economía"),
    ("C_004_207", "Compiten por nuestros puestos de trabajo"),
    ("C_004_208", "Causan un aumento del crimen"),
    ("C_004_209", "No mejoran la sociedad con ideas y cultura"),
    ("C_004_210", "Son una carga para el Estado"),
    ("C_004_211", "No dan más de lo que reciben"),
    ("C_004_212", "No hay que ayudar a los perseguidos políticos"),
    ("C_004_213", "No deben tener igual acceso a salud y educación"),
    ("C_004_214", "Habría que enviarlos de regreso a su país"),
]
CODES = [c for c, _ in ITEMS]
REGION = "Latin America"

# ---------------- 1) leer y armar las matrices pais x item (solo 2020) ----------------
long = pd.read_csv(os.path.join(HERE, "lb_migra_pais_ronda.csv"))
long = long[long.ronda == YEAR]

pct = long.pivot_table(index="iso3", columns="item", values="pct_hostil").reindex(columns=CODES)
nn = long.pivot_table(index="iso3", columns="item", values="n").reindex(columns=CODES)
isos = list(pct.index)
assert len(isos) == 18, f"esperaba 18 paises, hay {len(isos)}"

# ---------------- 2) perfil centrado ----------------
# nivel general del pais = promedio de sus items disponibles (VEN promedia 13, sin el 204).
mean_pais = pct.mean(axis=1, skipna=True)                 # serie por pais
dev = pct.sub(mean_pais, axis=0)                          # pct_item - promedio del pais
med_dev = dev.median(axis=0, skipna=True)                 # mediana regional de ese desvio, por item
profile = dev.sub(med_dev, axis=1)                        # perfil centrado (mediana por columna = 0)

med_raw = pct.median(axis=0, skipna=True)                 # mediana regional del nivel crudo, por item

def row(series):
    """Fila alineada a CODES; None donde falta (VEN 204). Normaliza -0.0 -> 0.0."""
    out = []
    for c in CODES:
        if pd.isna(series[c]):
            out.append(None)
        else:
            v = round(float(series[c]), 1)
            out.append(0.0 if v == 0 else v)
    return out

MG_LEVEL = {iso: row(pct.loc[iso]) for iso in isos}
MG_PROFILE = {iso: row(profile.loc[iso]) for iso in isos}
MG_N = {iso: [None if pd.isna(nn.loc[iso, c]) else int(nn.loc[iso, c]) for c in CODES] for iso in isos}
MG_MED = [round(float(med_raw[c]), 1) for c in CODES]
MG_REGION = {iso: REGION for iso in isos}

n_all = [int(v) for iso in isos for v in MG_N[iso] if v is not None]
META = {
    "year": YEAR,
    "items": [[c, lab] for c, lab in ITEMS],
    "nItems": len(CODES),
    "nCountries": len(isos),
    "nRange": [min(n_all), max(n_all)],
    "alpha": 0.963,      # alfa de Cronbach de la escala (14 items, nivel pais)
    "pc1": 70.6,         # % de varianza del 1er componente principal
    "region": REGION,
}

# ---------------- 3) escribir data-migrantes.js ----------------
CO = (",", ":")
out = [
    "// GENERADO por tools/make_migrantes.py — no editar a mano.",
    "// CHART 9 N°5 — perfil migratorio, Latinobarómetro 2020 (14 ítems, 18 países; 17 en el ítem de Venezuela).",
    "// Todos los ítems en el mismo sentido: mayor % = más hostil al inmigrante.",
    "// MG_ITEMS: orden fijo de los 14 códigos de ítem.",
    "// MG_META.items = [[código, etiqueta ES], ...] (fallback; el display sale de i18n).",
    "// MG_LEVEL[iso]   = [% hostil por ítem]  (nivel crudo; null en el ítem ausente).",
    "// MG_PROFILE[iso] = [desvío por ítem]  perfil centrado:",
    "//   (pct_ítem - promedio de los 14 ítems del país) - mediana regional de ese desvío.",
    "//   Por construcción la mediana regional de cada columna del perfil vale 0.",
    "// MG_MED = [mediana regional del nivel crudo por ítem]  (marcador del modo crudo).",
    "// MG_N[iso] = [n por ítem].  MG_REGION[iso] = región (color de barra).",
    "const MG_ITEMS = " + json.dumps(CODES) + ";",
    "const MG_META = " + json.dumps(META, ensure_ascii=False) + ";",
    "const MG_LEVEL = " + json.dumps(MG_LEVEL, ensure_ascii=False, separators=CO, sort_keys=True) + ";",
    "const MG_PROFILE = " + json.dumps(MG_PROFILE, ensure_ascii=False, separators=CO, sort_keys=True) + ";",
    "const MG_MED = " + json.dumps(MG_MED, separators=CO) + ";",
    "const MG_N = " + json.dumps(MG_N, ensure_ascii=False, separators=CO, sort_keys=True) + ";",
    "const MG_REGION = " + json.dumps(MG_REGION, ensure_ascii=False, separators=CO, sort_keys=True) + ";",
]
path = os.path.join(HERE, "..", "data-migrantes.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-migrantes.js -> {os.path.getsize(path)/1024:.1f}KB | {len(isos)} paises x {len(CODES)} items | n {META['nRange']}")

# ---------------- 4) VERIFICACION contra el brief ----------------
def code(c): return CODES.index(c)
print("\n== VERIFICACION (perfil centrado ARG) ==")
for c, exp in [("C_004_213", 26.1), ("C_004_214", 12.5), ("C_004_210", 6.3),
               ("C_004_211", 5.8), ("C_004_212", 5.4), ("C_004_207", 3.4),
               ("C_004_208", -18.5), ("C_004_205", -20.5)]:
    got = MG_PROFILE["ARG"][code(c)]
    flag = "OK" if abs(got - exp) <= 0.15 else "!!"
    print(f"  {c}: got {got:+.1f}  brief {exp:+.1f}  {flag}")

print("\n== crudo ARG (posiciones del brief) ==")
for c in ["C_004_208", "C_004_213", "C_004_207", "C_004_214"]:
    col = pct[c].dropna().sort_values(ascending=False)
    posic = list(col.index).index("ARG") + 1
    print(f"  {c}: ARG {col['ARG']:.1f}%  puesto {posic}/{len(col)}  (mediana {col.median():.1f})")

print("\n== empate tecnico acceso (213): ARG vs PER ==")
print(f"  ARG={pct.loc['ARG','C_004_213']:.1f}  PER={pct.loc['PER','C_004_213']:.1f}")
print("\n== 213 centrado: top-2 paises ==")
p213 = pd.Series({iso: MG_PROFILE[iso][code('C_004_213')] for iso in isos}).sort_values(ascending=False)
print(p213.head(3).round(1).to_string())

print("\n== indice general ARG (media 14 items) ==")
idx = mean_pais.sort_values(ascending=False)
print(f"  ARG media={mean_pais['ARG']:.2f}  puesto {list(idx.index).index('ARG')+1}/{len(idx)}")

print("\n== chequeo: mediana de cada columna del perfil ~ 0 ==")
med_check = pd.Series({c: np.nanmedian([MG_PROFILE[iso][code(c)] for iso in isos
                                        if MG_PROFILE[iso][code(c)] is not None]) for c in CODES})
print(f"  max |mediana columna| = {med_check.abs().max():.3f}")
print(f"  VEN item204 (esperado null): {MG_PROFILE['VEN'][code('C_004_204')]}  n={MG_N['VEN'][code('C_004_204')]}")
