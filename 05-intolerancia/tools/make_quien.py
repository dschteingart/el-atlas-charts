# -*- coding: utf-8 -*-
"""Genera data-quien.js: CHART 12 — "¿Quién es el más discriminado?".

Latinobarómetro 2020, variable p58st (RESPUESTA ÚNICA: "personas o grupos MÁS
discriminados en el país"). 38 categorías presentes de las 42 del menú, recodeadas
a 12 macro-categorías (recodeo NUESTRO, no del Latinobarómetro). Ponderado (wt).

FOTO / perfil calzan con los motores existentes (ranking.js 'sel' + perfil.js):
  QUIEN_CATS         : 12 macro keys (orden de lectura; el default lo pone el chart).
  QUIEN_FOTO[cat]    = [[iso3, pct, 2020, "Latinobarómetro", nBase], ...] asc por pct.
                       pct = % ponderado que señala a esa macro como el grupo MÁS
                       discriminado; nBase = respuestas válidas del país (denominador).
  QUIEN_REGION[iso3] : región (todas 'Latin America', igual que LB_REGION).
  QUIEN_RAW[iso3]    = [[cod, pct, n], ...] desc por pct — las 38 crudas para el
                       tooltip (n = cuántos eligieron ese código, sin ponderar).
  QUIEN_META         : year, study, nValid/nTotal/pctValid, etiquetas es/en de las
                       12 macro y de los 38 ítems, y el mapa código→macro.

Fuentes de entrada (ya construidas por tools/lb_discrim_profile.py):
  tools/lb_grupo_discriminado_2020.csv        (38 crudas por país: iso3,cod,grupo,pct,n)
  tools/lb_grupo_discriminado_macro_2020.csv  (12 macro por país; para verificar)
Ejecutar desde 05-intolerancia/tools/.
"""
import pandas as pd, json, os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))

# --- Recodeo a 12 macro (idéntico a lb_discrim_profile.py MACRO; fillna -> otros) ---
MACRO = {**{c: "raza_etnia" for c in [1, 2, 3, 4, 5, 6, 39]},
         **{c: "migrantes" for c in [11, 12, 13, 14, 15, 16, 17]},
         **{c: "religion_origen" for c in [7, 8, 9, 27]},
         10: "pobres", 33: "pobres", 26: "pobres", 34: "pobres", 35: "pobres",
         18: "salud_discap", 19: "salud_discap", 40: "salud_discap",
         20: "lgbt", 23: "mujeres", 30: "mujeres", 32: "mujeres",
         24: "edad", 25: "edad", 21: "conducta", 38: "conducta", 22: "conducta",
         36: "conducta", 37: "conducta", 28: "ideologia", 29: "ideologia", 31: "ideologia",
         6: "raza_etnia", 96: "otros", 97: "ninguna"}

# Orden de lectura de las macro (el chart fija el default = raza_etnia).
QUIEN_CATS = ["pobres", "raza_etnia", "migrantes", "lgbt", "edad", "mujeres",
              "ideologia", "conducta", "salud_discap", "religion_origen", "ninguna", "otros"]

# Etiquetas de las 12 macro (es canónico + en). El recodeo es nuestro.
CAT_LABELS_ES = {
    "pobres": "Pobres", "raza_etnia": "Raza o etnia", "migrantes": "Migrantes",
    "lgbt": "Personas LGBT", "edad": "Edad (viejos/jóvenes)", "mujeres": "Mujeres",
    "ideologia": "Ideología política", "conducta": "Conducta o estigma",
    "salud_discap": "Salud o discapacidad", "religion_origen": "Religión u origen",
    "ninguna": "Ninguno", "otros": "Otros"}
CAT_LABELS_EN = {
    "pobres": "The poor", "raza_etnia": "Race or ethnicity", "migrantes": "Migrants",
    "lgbt": "LGBT people", "edad": "Age (old / young)", "mujeres": "Women",
    "ideologia": "Political ideology", "conducta": "Behavior or stigma",
    "salud_discap": "Health or disability", "religion_origen": "Religion or origin",
    "ninguna": "None", "otros": "Others"}

# Traducciones EN de los ítems crudos (por código). El es se toma del CSV (canónico).
ITEM_EN = {
    1: "Black / Afro-descendants", 2: "Indigenous people", 3: "White people",
    4: "Mixed-race (mulatto)", 5: "Mestizos", 6: "Asians (Chinese / Japanese)",
    10: "The poor", 11: "Immigrants (in general)", 12: "Immigrants from Latin America",
    13: "Venezuelan immigrants", 14: "Colombian immigrants", 15: "Bolivian immigrants",
    16: "Peruvian immigrants", 18: "People with disabilities", 19: "People with AIDS",
    20: "Homosexuals", 21: "Drug addicts", 22: "People with tattoos", 23: "Women",
    24: "Elderly people", 25: "Young people", 26: "Illiterate / uneducated people",
    27: "Religious groups (evangelicals, Mormons, Pentecostals)",
    28: "Members of a political party (communist, socialist, etc.)",
    29: "Members of movements or interest groups (unions)", 30: "Feminist groups",
    31: "Discriminated for their ideology", 32: "Single mothers",
    33: "Homeless / destitute people", 34: "Peasants / farm workers",
    35: "People from rural areas", 36: "Criminals / gang members",
    37: "Members of armed groups", 38: "Alcoholics",
    39: "Discriminated by race (unspecified)", 40: "Doctors / healthcare workers",
    96: "Others", 97: "None (no group is discriminated against)"}

# Etiquetas es limpias donde la fuente viene truncada o con typo del cuestionario.
ITEM_ES_OVERRIDE = {
    31: "Discriminados por su ideología",
    27: "Pertenecen a grupos religiosos (evangélicos, mormones, pentecostales)"}

# El menú de p58st tiene 42 códigos; en 2020 se eligieron 38 (fuente del chart).
N_MENU_CODES = 42
N_TOTAL_SAMPLE = 20204   # muestra total 18 países (del cuestionario 2020)

# ---------------------------------------------------------------------------
raw = pd.read_csv(os.path.join(HERE, "lb_grupo_discriminado_2020.csv"), encoding="utf-8")
raw["macro"] = raw.cod.map(MACRO).fillna("otros")

ISOS = sorted(raw.iso3.unique())
assert len(ISOS) == 18, f"esperaba 18 países, hay {len(ISOS)}"

# Etiquetas es canónicas desde el CSV (un label por código), con overrides.
es_from_csv = raw.drop_duplicates("cod").set_index("cod").grupo.to_dict()
codes = sorted(es_from_csv)
item_labels_es = {int(c): ITEM_ES_OVERRIDE.get(int(c), es_from_csv[c]) for c in codes}
item_labels_en = {int(c): ITEM_EN[int(c)] for c in codes}
item_macro = {int(c): MACRO.get(int(c), "otros") for c in codes}
missing_en = [c for c in codes if int(c) not in ITEM_EN]
assert not missing_en, f"faltan traducciones EN: {missing_en}"

# nBase por país = respuestas válidas (denominador de los %); total = nValid.
nbase = {iso: int(raw[raw.iso3 == iso].n.sum()) for iso in ISOS}
n_valid = int(raw.n.sum())

# Macro pct por (iso, macro) = suma de las crudas (mismo criterio que el CSV macro).
macro_pct = (raw.groupby(["iso3", "macro"]).pct.sum().round(1)).unstack(fill_value=0.0)

# QUIEN_FOTO[cat] = [[iso, pct, 2020, study, nBase], ...] asc por pct.
STUDY = "Latinobarómetro"
QUIEN_FOTO = {}
for cat in QUIEN_CATS:
    rows = []
    for iso in ISOS:
        pct = float(macro_pct.loc[iso, cat]) if cat in macro_pct.columns else 0.0
        rows.append([iso, round(pct, 1), 2020, STUDY, nbase[iso]])
    rows.sort(key=lambda r: r[1])
    QUIEN_FOTO[cat] = rows

QUIEN_REGION = {iso: "Latin America" for iso in ISOS}

# QUIEN_RAW[iso] = [[cod, pct, n], ...] desc por pct (las 38 crudas).
QUIEN_RAW = {}
for iso in ISOS:
    g = raw[raw.iso3 == iso].sort_values("pct", ascending=False)
    QUIEN_RAW[iso] = [[int(r.cod), float(round(r.pct, 1)), int(r.n)] for r in g.itertuples()]

QUIEN_META = {
    "year": 2020,
    "study": STUDY,
    "question": "p58st",
    "single_choice": True,
    "nValid": n_valid,
    "nTotal": N_TOTAL_SAMPLE,
    "pctValid": round(100 * n_valid / N_TOTAL_SAMPLE, 1),
    "menuCodes": N_MENU_CODES,
    "codesPresent": len(codes),
    "catLabels": {"es": CAT_LABELS_ES, "en": CAT_LABELS_EN},
    "itemLabels": {"es": item_labels_es, "en": item_labels_en},
    "itemMacro": item_macro,
    "nBase": nbase,
}

# ---------------------------------------------------------------------------
J = lambda o, sk=False: json.dumps(o, ensure_ascii=False, separators=(",", ":"), sort_keys=sk)
out = [
    "// data-quien.js — CHART 12 «¿Quién es el más discriminado?». GENERADO por tools/make_quien.py — no editar a mano.",
    "// Latinobarómetro 2020, p58st (RESPUESTA ÚNICA: el grupo MÁS discriminado). Ponderado (wt). Recodeo a 12 macro NUESTRO.",
    "// QUIEN_FOTO[cat] = [[iso3, pct, 2020, \"Latinobarómetro\", nBase], ...] asc por pct. QUIEN_RAW[iso3] = [[cod, pct, n], ...] desc (38 crudas).",
    "const QUIEN_CATS = " + J(QUIEN_CATS) + ";",
    "const QUIEN_REGION = " + J(QUIEN_REGION, True) + ";",
    "const QUIEN_FOTO = " + J(QUIEN_FOTO) + ";",
    "const QUIEN_RAW = " + J(QUIEN_RAW, True) + ";",
    "const QUIEN_META = " + J(QUIEN_META) + ";",
]
path = os.path.join(HERE, "..", "data-quien.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-quien.js -> {os.path.getsize(path)/1024:.1f}KB | {len(ISOS)} países, {len(QUIEN_CATS)} macro, {len(codes)} crudas")

# ===========================================================================
#  VERIFICACIÓN contra el brief (recalcular desde lo que se acaba de escribir)
# ===========================================================================
print("\n=== VERIFICACIÓN ===")
foto_pct = {cat: {r[0]: r[1] for r in QUIEN_FOTO[cat]} for cat in QUIEN_CATS}

# 1) Macro pct reproduce el CSV macro (fuente verificada).
macro_csv = pd.read_csv(os.path.join(HERE, "lb_grupo_discriminado_macro_2020.csv")).set_index("iso3")
maxdiff = 0.0
for iso in ISOS:
    for cat in QUIEN_CATS:
        a = foto_pct[cat][iso]
        b = float(macro_csv.loc[iso, cat])
        maxdiff = max(maxdiff, abs(a - b))
print(f"1) macro pct vs lb_grupo_discriminado_macro_2020.csv: maxdiff={maxdiff:.2f} (esperado ~0)")
assert maxdiff < 0.06, "las macro no reproducen el CSV verificado"

# 2) Ganador por país (12 macro): pobres=14, raza_etnia=3, ninguna=1.
winners = {}
for iso in ISOS:
    best = max(QUIEN_CATS, key=lambda c: foto_pct[c][iso])
    winners.setdefault(best, []).append(iso)
counts = {k: len(v) for k, v in winners.items()}
print(f"2) ganador macro por país: {counts}")
for k in sorted(winners):
    print(f"     {k}: {sorted(winners[k])}")
assert counts.get("pobres") == 14, f"pobres debía ganar en 14, ganó en {counts.get('pobres')}"
assert counts.get("raza_etnia") == 3, f"raza_etnia debía ganar en 3, ganó en {counts.get('raza_etnia')}"
assert counts.get("ninguna") == 1, f"ninguna debía ganar en 1, ganó en {counts.get('ninguna')}"

# 3) Valores puntuales del brief.
checks = [
    ("PRY", "pobres", 53.8), ("BOL", "pobres", 48.6), ("PER", "pobres", 41.4),
    ("MEX", "pobres", 39.3), ("SLV", "pobres", 37.3), ("GTM", "pobres", 36.9),
    ("BRA", "raza_etnia", 53.0), ("PAN", "raza_etnia", 34.5), ("COL", "raza_etnia", 32.7),
    ("ARG", "pobres", 27.3), ("ARG", "otros", 15.3), ("ARG", "edad", 12.2),
    ("ARG", "raza_etnia", 11.6), ("ARG", "ninguna", 10.1), ("ARG", "migrantes", 6.3),
]
ok = True
for iso, cat, exp in checks:
    got = foto_pct[cat][iso]
    flag = "OK" if abs(got - exp) < 0.05 else "MISMATCH"
    if flag != "OK":
        ok = False
    print(f"3) {iso} {cat}: {got} (brief {exp}) {flag}")
assert ok, "algún valor puntual del brief no coincide"

# 4) Argentina en el detalle crudo: pobres 26.6, negros 2.4, inmig. Bolivia 2.1.
arg_raw = {c: p for c, p, n in QUIEN_RAW["ARG"]}
print(f"4) ARG crudas: pobres(10)={arg_raw.get(10)} (26.6), negros(1)={arg_raw.get(1)} (2.4), "
      f"inmig.Bolivia(15)={arg_raw.get(15)} (2.1)")
assert abs(arg_raw.get(10) - 26.6) < 0.05
assert abs(arg_raw.get(1) - 2.4) < 0.05
assert abs(arg_raw.get(15) - 2.1) < 0.05

# 5) n válido / total.
print(f"5) nValid={n_valid} (brief 16752), nTotal={N_TOTAL_SAMPLE} (20204), "
      f"pctValid={QUIEN_META['pctValid']}% (brief 82,9%)")
assert n_valid == 16752, f"nValid={n_valid} != 16752"

# 6) Nota de conteo del brief: con las 38 crudas, ¿en cuántos países gana 'pobres'
#    como código único (10)? Con 12 macro son 14; el brief dice 13 con crudas.
raw_winner_pobres = 0
raw_win = {}
for iso in ISOS:
    top = max(QUIEN_RAW[iso], key=lambda r: r[1])   # [cod,pct,n]
    raw_win[iso] = top[0]
    if top[0] == 10:   # código 10 = Pobres
        raw_winner_pobres += 1
print(f"6) 'pobres' (código 10) como ganador crudo: en {raw_winner_pobres} países "
      f"(macro=14). Países donde NO gana el código 10: "
      f"{[iso for iso in ISOS if raw_win[iso] != 10]}")

print("\nTodas las verificaciones pasaron.")
