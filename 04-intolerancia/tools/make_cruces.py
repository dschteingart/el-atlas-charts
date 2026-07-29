# -*- coding: utf-8 -*-
"""Genera data-cruces.js: la base de los DOS scatters del N°4.

  Chart A — "¿Es cuestión de plata?": eje X FIJO = PIB per cápita (Maddison),
            eje Y = cualquier variable del menú. Residuos regionales, R², escala
            lineal/log en X, slider de ola.
  Chart B — "Cruce de intolerancias": eje X y eje Y elegibles, ambos del menú.

MENÚ (25 variables, tres grupos):
  · "Batería de vecinos" (14): las categorías core=1 de A124 — % que menciona al
    grupo entre los que NO querría de vecinos. Fuente: data/ivs_vecinos_largo.csv
    (formato largo por estudio); acá se combina EVS+WVS por promedio ponderado
    por n, igual que tools/make_waves.py, para que la foto por ola sea la MISMA
    que la del chart 1.
  · "Otras preguntas" (10): el resto de los indicadores IVS aprobados, ya
    agregados por país × ola en tools/ivs_discrim_largo.csv (una fila por
    var × iso3 × ola: ese pipeline ya combinó EVS+WVS, ponderó por S017 y
    filtró celdas chicas).
  · "Discriminación vivida" (1): la ÚNICA variable que NO es de la IVS. Viene del
    World Risk Poll 2023 (Lloyd's Register Foundation / Gallup): % que dice haber
    sufrido alguna vez discriminación por el color de su piel. Ver el bloque
    WORLD RISK POLL más abajo, que explica por qué se cuelga de la ola 7 y qué
    NO se puede concluir del cruce.

QUEDAN AFUERA A PROPÓSITO (decisión editorial, no las repongas):
  · G038/G040/G041/G043, G033-G036, E154-E161: baterías EVS puras — 47 países,
    CERO de América Latina. Un scatter regional con ellas no dice nada.
  · C002_01 y C001_01: en AR/BR/NG/US la escala de 5 puntos viene recodificada
    desde la de 3, así que el "% muy de acuerdo" da 0,0% POR CONSTRUCCIÓN.
  · G007_01 (2 olas viejas, 42 países) y C005 (solo ola 2): callejones sin salida.
  · A124_* con core=0: categorías que se preguntaron en un puñado de países.
  · G007_35_B, G007_18_B, H002_02/03/05, G006: existen en la fuente pero el menú
    curado del número no las incluye (se puede ampliar tocando OTRAS).

DIRECCIÓN DE CADA INDICADOR (reconstruida desde tools/ivs_discrim.pkl, celda por
celda, contra la columna pct del CSV — ver el bloque VERIFICACIÓN):
    H002_01 / H002_04  %{1,2 = muy/bastante seguido} sobre {1,2,3,4}
    C002 / C001        %{1 = de acuerdo} sobre {1,2,3}  (el "ni una ni otra" queda
                       en el denominador)
    E143               %{3,4 = límites estrictos / prohibir} sobre {1,2,3,4}
    G052               %{1,2 = muy/bastante malo} sobre {1..5}
    A035               %{1 = mencionada} sobre {0,1}
    G007_34_B/36_B     %{3,4 = confía poco/nada} sobre {1,2,3,4}
    A165               %{1 = se puede confiar en la mayoría} sobre {1,2}

  ¡OJO CON A165! En la fuente el pct es el % que CONFÍA. El menú del número la
  quiere en dirección "desconfianza" ("Desconfía de la gente en general"), así
  que acá se emite el COMPLEMENTO EXACTO: 100 − pct = %{2 = "uno nunca es lo
  bastante prudente"}. No es un invento: el ítem es binario y el denominador es
  el mismo, así que el complemento es el otro código, exacto. Es la ÚNICA
  variable que se transforma; todas las demás salen tal cual de la fuente.

WORLD RISK POLL (la variable de afuera):
  Es experiencia PROPIA y de por vida ("¿alguna vez sufriste discriminación por el
  color de tu piel?", sí/no/no corresponde/NS/NC, ponderado por WGT), no una
  opinión sobre terceros como todo el resto del menú. Dos consecuencias que hay
  que tener presentes al leer cualquier cruce contra ella:
    · Los dos ejes dejan de ser la misma encuesta y las mismas personas, así que
      desaparece el sesgo de estilo de respuesta compartido... y aparece todo el
      ruido de comparar dos operativos distintos.
    · Un país donde poca gente declara haber sufrido discriminación no es
      necesariamente menos racista: puede ser más homogéneo, o tener menos
      conciencia del problema. La correlación mide otra cosa que la intolerancia
      declarada, y por eso es interesante mirarlas juntas.
  Se cuelga de la OLA 7 (2017-2022), que es la más cercana, pero cada punto lleva
  su año real: el eje del WRP dice 2023 en el tooltip y el de la IVS el año de
  campo del país. El PIB de esas observaciones sale de 2022 (Maddison termina
  ahí, dentro de la ventana de ±3 años).

EL CRUCE CON EL PIB (lo delicado):
  Cada observación tiene SU año de trabajo de campo (ARG 2017, URY 2022): el PIB
  se toma del año propio de cada encuesta, nunca de un año común. Si Maddison no
  tiene ese año exacto, se busca el más cercano dentro de ±3 años y se guarda ESE
  año (el chart lo muestra en el tooltip). Si no hay nada a ±3, el país no tiene
  PIB y no se dibuja en el chart de desarrollo — no se interpola ni se arrastra.
  En la práctica: 468 de 469 pares país-año matchean el año exacto, el único
  aproximado es India 2023 → 2022 (Maddison termina en 2022) y los 11 pares sin
  PIB son 6 territorios que Maddison directamente no cubre (Andorra, Macao,
  Maldivas, Irlanda del Norte, Kosovo, Chipre del Norte).

ESTRUCTURA DE SALIDA (arrays compactos, constantes en MAYÚSCULAS):
  CR_VARS   = [{k, grupo, es, en, def_es, def_en, olas:[...], fuente}]
              orden: batería de vecinos primero, después las otras preguntas.
  CR_FOTO[k][wave] = [[iso3, pct, year, n], ...] ordenado ASC por pct.
  CR_GDP[iso3][year] = PIB per cápita. SOLO los años efectivamente usados.
              Lookup desde el chart: para una observación del año Y del país P,
              el PIB es CR_GDP[P][y*] con y* = la clave más cercana a Y con
              |y*−Y| <= 3 (no hay empates posibles: las claves guardadas son
              justamente las que eligió este script). Si CR_GDP[P] no existe o
              ninguna clave entra en la ventana, el país no va al scatter de PIB.
  CR_WAVES  = [{w, label}] — MISMAS etiquetas de período que WV_META en
              data-waves.js / PRIO_WAVES en data-prioridad.js. Una sola verdad.
  CR_REGION[iso3] = región Atlas (las mismas 10 del resto del número).
  CR_META   = {gdp_fuente, gdp_anio_max, n_vars, generado_por, ...}

Se descartan las celdas (variable × ola) con menos de MIN_COUNTRIES países: una
ola con 4 países no es un scatter, es ruido. Mismo umbral que make_waves.py.
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
OUT = os.path.join(HERE, "..", "data-cruces.js")

MIN_COUNTRIES = 8   # olas con muy pocos países no valen para una regresión
GDP_TOL = 3         # ventana ± años para pegarle el PIB a cada observación

# Etiquetas de período por ola: MISMO criterio que make_waves.py y make_prioridad.py.
WAVE_LABEL = {1: "1981-1984", 2: "1989-1993", 3: "1994-1998", 4: "1999-2004",
              5: "2005-2010", 6: "2010-2014", 7: "2017-2022"}

# Orden editorial de la batería de vecinos: primero las 9 del chart 1 (mismo
# orden que VE_CATS en data-vecinos.js), después el resto de las core=1.
VEC_ORDER = ["otra_raza", "inmigrantes", "homosexuales", "otra_religion", "otro_idioma",
             "parejas_no_casadas", "sida", "bebedores", "drogadictos",
             "antecedentes", "inestables", "musulmanes", "judios", "gitanos"]

GRUPO_VEC = ("Batería de vecinos", "Neighbour battery")
GRUPO_OTR = ("Otras preguntas", "Other questions")

# var IVS -> (label_es, label_en, def_es, def_en)
OTRAS = [
    ("C002", "Prioridad laboral a los nativos", "Job priority for the native-born",
     "% de acuerdo con que, cuando escasea el trabajo, los nativos deberían tener prioridad sobre los inmigrantes (el «ni una ni otra» queda en el denominador).",
     "% who agree that, when jobs are scarce, the native-born should get priority over immigrants (the “neither” stays in the denominator)."),
    ("C001", "Prioridad laboral a los varones", "Job priority for men",
     "% de acuerdo con que, cuando escasea el trabajo, los varones deberían tener más derecho a un empleo que las mujeres.",
     "% who agree that, when jobs are scarce, men should have more right to a job than women."),
    ("H002_04", "Ve conductas racistas en su barrio", "Sees racist behaviour in their neighbourhood",
     "% que dice que en su barrio hay conductas racistas «muy» o «bastante» seguido.",
     "% who say racist behaviour happens “very” or “quite” frequently in their neighbourhood."),
    ("H002_01", "Ve robos en su barrio", "Sees robberies in their neighbourhood",
     "% que dice que en su barrio hay robos «muy» o «bastante» seguido.",
     "% who say robberies happen “very” or “quite” frequently in their neighbourhood."),
    ("E143", "Quiere límites a la inmigración", "Wants limits on immigration",
     "% que quiere límites estrictos a la cantidad de extranjeros o directamente prohibir la inmigración.",
     "% who want strict limits on the number of foreigners, or to prohibit immigration altogether."),
    ("G052", "Cree que el inmigrante perjudica", "Thinks immigrants harm the country",
     "% que evalúa el impacto de los inmigrantes sobre el desarrollo del país como «muy» o «bastante» malo.",
     "% who rate the impact of immigrants on the country’s development as “very” or “quite” bad."),
    ("A165", "Desconfía de la gente en general", "Distrusts people in general",
     "% que dice que «uno nunca es lo bastante prudente» al tratar con la gente. Es el complemento exacto de «se puede confiar en la mayoría»: el ítem tiene solo esas dos opciones.",
     "% who say “you can’t be too careful” in dealing with people. The exact complement of “most people can be trusted”: the item has only those two options."),
    ("A035", "Enseña tolerancia a sus hijos", "Teaches tolerance to their children",
     "% que menciona la tolerancia y el respeto por los demás entre las cualidades importantes para inculcar a los hijos. OJO: acá más es MEJOR, al revés que casi todo el resto del menú.",
     "% who mention tolerance and respect for other people among the important qualities to teach children. NOTE: here more is BETTER, unlike most of the menu."),
    ("G007_36_B", "Desconfía de otra nacionalidad", "Distrusts people of another nationality",
     "% que confía «poco» o «nada» en la gente de otra nacionalidad.",
     "% who trust people of another nationality “not very much” or “not at all”."),
    ("G007_34_B", "Desconfía de un desconocido", "Distrusts someone they meet for the first time",
     "% que confía «poco» o «nada» en alguien que conoce por primera vez.",
     "% who trust someone they meet for the first time “not very much” or “not at all”."),
]
# La única variable que se emite invertida respecto de la fuente (ver docstring).
INVERTIR = {"A165"}


# ============================ FORMA DE TÍTULO ================================
# Los rotulos cortos son NOMBRES DE CATEGORIA ("Personas de otra raza"), no de
# medicion: pegados a un eje funcionan, pero sueltos en un titulo se leen como
# una lista de grupos de personas en vez de "el porcentaje que no los quiere de
# vecino". Por eso cada variable lleva ademas una FORMA DE TITULO, en minuscula
# y lista para componer: "{X} frente a {Y}" (dispersion) y "{X} y {Y}"
# (brechas). Decision de Daniel 2026-07-29, criterio OWID.
TITULO_VEC = {
    "otra_raza":          (u"rechazo a vecinos de otra raza", u"rejection of neighbours of another race"),
    "inmigrantes":        (u"rechazo a vecinos inmigrantes", u"rejection of immigrant neighbours"),
    "homosexuales":       (u"rechazo a vecinos homosexuales", u"rejection of homosexual neighbours"),
    "otra_religion":      (u"rechazo a vecinos de otra religión", u"rejection of neighbours of another religion"),
    "otro_idioma":        (u"rechazo a vecinos de otro idioma", u"rejection of neighbours who speak another language"),
    "parejas_no_casadas": (u"rechazo a vecinos que conviven sin casarse", u"rejection of unmarried couples as neighbours"),
    "sida":               (u"rechazo a vecinos con sida", u"rejection of neighbours with AIDS"),
    "bebedores":          (u"rechazo a vecinos bebedores", u"rejection of heavy-drinking neighbours"),
    "drogadictos":        (u"rechazo a vecinos drogadictos", u"rejection of drug-addicted neighbours"),
    "antecedentes":       (u"rechazo a vecinos con antecedentes penales", u"rejection of neighbours with a criminal record"),
    "inestables":         (u"rechazo a vecinos emocionalmente inestables", u"rejection of emotionally unstable neighbours"),
    "musulmanes":         (u"rechazo a vecinos musulmanes", u"rejection of Muslim neighbours"),
    "judios":             (u"rechazo a vecinos judíos", u"rejection of Jewish neighbours"),
    "gitanos":            (u"rechazo a vecinos gitanos", u"rejection of Roma neighbours"),
}
TITULO_OTRAS = {
    "C002":      (u"prioridad laboral a los nativos", u"job priority for the native-born"),
    "C001":      (u"prioridad laboral a los varones", u"job priority for men"),
    "H002_04":   (u"racismo visto en el barrio", u"racist behaviour seen in the neighbourhood"),
    "H002_01":   (u"robos vistos en el barrio", u"robberies seen in the neighbourhood"),
    "E143":      (u"apoyo a limitar la inmigración", u"support for limiting immigration"),
    "G052":      (u"creer que el inmigrante perjudica", u"believing immigrants harm the country"),
    "A165":      (u"desconfianza en la gente", u"distrust of people in general"),
    "A035":      (u"enseñar tolerancia a los hijos", u"teaching children tolerance"),
    "G007_36_B": (u"desconfianza en otra nacionalidad", u"distrust of people of another nationality"),
    "G007_34_B": (u"desconfianza en un desconocido", u"distrust of someone met for the first time"),
}

# ============================ 1. batería de vecinos ============================
cats = pd.read_csv(os.path.join(DATA, "ivs_vecinos_cats.csv"))
core = cats[cats.core == 1].set_index("cat")
assert set(VEC_ORDER) == set(core.index), \
    f"VEC_ORDER != core=1: faltan {set(core.index) - set(VEC_ORDER)}, sobran {set(VEC_ORDER) - set(core.index)}"

largo = pd.read_csv(os.path.join(DATA, "ivs_vecinos_largo.csv"))
largo = largo[largo.cat.isin(VEC_ORDER)]

foto = {}          # k -> {wave(int) -> rows}
region = {}
for cat, gcat in largo.groupby("cat"):
    foto[cat] = {}
    for wave, gw in gcat.groupby("wave"):
        rows = []
        for iso3, g in gw.groupby("iso3"):
            # combinado EVS+WVS ponderado por n — idéntico a make_waves.py
            pct = round(float(np.average(g.pct, weights=g.n)), 1)
            year = int(np.round(np.average(g.year, weights=g.n)))
            rows.append([iso3, pct, year, int(g.n.sum())])
        if len(rows) < MIN_COUNTRIES:
            continue
        rows.sort(key=lambda r: (r[1], r[0]))
        foto[cat][int(wave)] = rows
for r in largo.drop_duplicates("iso3").itertuples():
    region[r.iso3] = r.region

# ============================ 2. otras preguntas ==============================
disc = pd.read_csv(os.path.join(HERE, "ivs_discrim_largo.csv"))
VARS_OTRAS = [v[0] for v in OTRAS]
sub = disc[disc["var"].isin(VARS_OTRAS)]
assert not sub.duplicated(["var", "iso3", "wave"]).any(), "hay más de una fila por var×país×ola"

for var, gv in sub.groupby("var"):
    foto[var] = {}
    for wave, gw in gv.groupby("wave"):
        rows = []
        for r in gw.itertuples():
            pct = float(r.pct)
            if var in INVERTIR:
                pct = 100.0 - pct
            rows.append([r.iso3, round(pct, 1), int(r.year), int(r.n)])
        if len(rows) < MIN_COUNTRIES:
            continue
        rows.sort(key=lambda x: (x[1], x[0]))
        foto[var][int(wave)] = rows
for r in disc.drop_duplicates("iso3").itertuples():
    region.setdefault(r.iso3, r.region)

# ======================= 2b. World Risk Poll (fuente externa) =================
# Única variable que no sale de la IVS. El CSV crudo vive en data/ (bajado de la
# ficha pública del dataset, CC BY 4.0) para que este script no dependa de la web.
WRP_K = "wrp_piel"
WRP_WAVE = 7          # la ola de la IVS con la que se puede cruzar (2017-2022)
WRP_YEAR = 2023       # año real de campo: es el que va en el tooltip
GRUPO_WRP = ("Discriminación vivida", "Experienced discrimination")

wrp = pd.read_csv(os.path.join(DATA, "wrp_discriminacion_piel_2023.csv"), comment="#")
foto[WRP_K] = {WRP_WAVE: sorted(
    [[r.iso3, round(float(r.pct), 1), WRP_YEAR, None] for r in wrp.itertuples()],
    key=lambda x: (x[1], x[0]))}

# Región de los países que la IVS no cubre (34 de 139). Se toma de VD_REGION en
# data-vdem.js, que ya usa las mismas 10 regiones del número y está verificado:
# de los 105 países que están en las dos fuentes, no hay una sola discrepancia.
_vd = os.path.join(HERE, "..", "data-vdem.js")
if os.path.exists(_vd):
    import re as _re
    _m = _re.search(r"const VD_REGION = (\{.*?\});", open(_vd, encoding="utf-8").read(), _re.S)
    VD_REGION = json.loads(_m.group(1)) if _m else {}
else:
    VD_REGION = {}
sin_region_wrp = []
for r in wrp.itertuples():
    if r.iso3 in region:
        continue
    if r.iso3 in VD_REGION:
        region[r.iso3] = VD_REGION[r.iso3]
    else:
        sin_region_wrp.append(r.iso3)

# ============================ 3. menú de variables ============================
VARS = []
for cat in VEC_ORDER:
    VARS.append({
        "k": cat, "grupo": GRUPO_VEC[0],
        "es": core.loc[cat, "label_es"], "en": core.loc[cat, "label_en"],
        "def_es": "% que menciona a «" + str(core.loc[cat, "label_es"]).lower()
                  + "» entre los grupos que no querría de vecinos.",
        "def_en": "% who mention “" + str(core.loc[cat, "label_en"]).lower()
                  + "” among the groups they would not want as neighbours.",
        "olas": sorted(foto[cat]), "fuente": core.loc[cat, "ivs_var"],
        "titulo_es": TITULO_VEC[cat][0], "titulo_en": TITULO_VEC[cat][1],
    })
for var, es, en, d_es, d_en in OTRAS:
    VARS.append({"k": var, "grupo": GRUPO_OTR[0], "es": es, "en": en,
                 "def_es": d_es, "def_en": d_en,
                 "olas": sorted(foto[var]), "fuente": var,
                 "titulo_es": TITULO_OTRAS[var][0], "titulo_en": TITULO_OTRAS[var][1]})
# La de afuera va última y lleva "fuente_ext": el chart usa esa marca para avisar
# que los dos ejes ya no son la misma encuesta ni las mismas personas.
VARS.append({
    "k": WRP_K, "grupo": GRUPO_WRP[0],
    "es": "Sufrió discriminación por su color de piel",
    "en": "Has experienced discrimination over skin colour",
    "def_es": "% que dice haber sufrido ALGUNA VEZ discriminación por el color de su piel. "
              "Es experiencia propia y de por vida, no una opinión sobre otros, y viene de otra "
              "encuesta: World Risk Poll 2023 (Lloyd's Register Foundation / Gallup), 139 países. "
              "Ojo: que poca gente lo declare no prueba que el país sea menos racista.",
    "def_en": "% who say they have EVER experienced discrimination because of the colour of their "
              "skin. It is a first-person, lifetime experience, not an opinion about others, and it "
              "comes from a different survey: World Risk Poll 2023 (Lloyd's Register Foundation / "
              "Gallup), 139 countries. Note: fewer people reporting it does not prove the country is "
              "less racist.",
    "olas": sorted(foto[WRP_K]), "fuente": "WRP 2023 (skin colour)",
    "titulo_es": "discriminación vivida por color de piel",
    "titulo_en": "experienced discrimination over skin colour",
    "fuente_ext": "World Risk Poll 2023 (Lloyd's Register Foundation / Gallup)",
})
VARS = [v for v in VARS if v["olas"]]
KEYS = [v["k"] for v in VARS]

# ============================ 4. PIB per cápita ===============================
mad = pd.read_csv(os.path.join(DATA, "maddison_gdppc.csv"))
mad = mad[mad.Code.notna()]                       # fuera los agregados regionales
GDP_SRC = {}
for code, g in mad.groupby("Code"):
    GDP_SRC[code] = dict(zip(g.Year.astype(int), g["GDP per capita"].astype(float)))

pares = sorted({(r[0], r[2]) for k in KEYS for rows in foto[k].values() for r in rows})
gdp_out, sin_match, aproximados = {}, [], []
for iso3, year in pares:
    serie = GDP_SRC.get(iso3)
    cand = [y for y in serie if abs(y - year) <= GDP_TOL] if serie else []
    if not cand:
        sin_match.append((iso3, year))
        continue
    dmin = min(abs(y - year) for y in cand)
    best = min(y for y in cand if abs(y - year) == dmin)   # desempate: el más viejo
    if best != year:
        aproximados.append((iso3, year, best))
    gdp_out.setdefault(iso3, {})[best] = round(serie[best], 1)
gdp_out = {iso: {str(y): gdp_out[iso][y] for y in sorted(gdp_out[iso])} for iso in sorted(gdp_out)}

# ============================ 5. emisión ======================================
waves_present = sorted({w for k in KEYS for w in foto[k]})
CR_WAVES = [{"w": w, "label": WAVE_LABEL[w]} for w in waves_present]
CR_FOTO = {k: {str(w): foto[k][w] for w in sorted(foto[k])} for k in KEYS}
CR_REGION = {iso: region[iso] for iso in sorted(region) if any(
    any(r[0] == iso for r in rows) for k in KEYS for rows in foto[k].values())}
CR_META = {
    "gdp_fuente": "Maddison Project Database 2023 (vía Our World in Data)",
    "gdp_unidad_es": "dólares internacionales de 2011 (PPA)",
    "gdp_unidad_en": "2011 international dollars (PPP)",
    "gdp_anio_max": int(mad.Year.max()),
    "gdp_tolerancia": GDP_TOL,
    "gdp_sin_datos": sorted({iso for iso, _ in sin_match}),
    "n_vars": len(VARS),
    "min_paises": MIN_COUNTRIES,
    "ivs_fuente": "Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022)",
    "wrp_fuente": "World Risk Poll 2023 (Lloyd's Register Foundation / Gallup), CC BY 4.0",
    "wrp_pregunta_es": "¿Alguna vez sufrió discriminación por el color de su piel? (sí/no/no corresponde/NS/NC, ponderado por WGT)",
    "wrp_ola_ivs": WRP_WAVE,
    "generado_por": "tools/make_cruces.py",
}

out = [
    "// El Atlas N°4 — base de los DOS scatters: (A) intolerancia vs PIB per cápita,",
    "// (B) cruce de dos variables de la IVS. GENERADO por tools/make_cruces.py — no editar a mano.",
    "// CR_VARS  = [{k, grupo, es, en, def_es, def_en, olas, fuente}]  menú de variables.",
    "// CR_FOTO[k][ola] = [[iso3, pct, año, n], ...] ordenado ASC por pct.",
    "// CR_GDP[iso3][año] = PIB pc (Maddison). Se guarda SOLO el año usado por cada",
    "//   observación: para una observación del año Y del país P, el PIB es la clave de",
    "//   CR_GDP[P] más cercana a Y con |dif| <= CR_META.gdp_tolerancia. Sin match, el país",
    "//   no entra al scatter de PIB (no se interpola ni se arrastra el último dato).",
    "// CR_WAVES = etiquetas de período (las mismas que WV_META en data-waves.js).",
    "// OJO A165: la fuente mide el % que CONFÍA; acá se emite el complemento exacto",
    "//   (% que desconfía), que es el otro código del ítem binario. Ver make_cruces.py.",
    "const CR_META = " + json.dumps(CR_META, ensure_ascii=False) + ";",
    "const CR_WAVES = " + json.dumps(CR_WAVES, ensure_ascii=False) + ";",
    "const CR_VARS = " + json.dumps(VARS, ensure_ascii=False) + ";",
    "const CR_REGION = " + json.dumps(CR_REGION, ensure_ascii=False, separators=(",", ":")) + ";",
    "const CR_GDP = " + json.dumps(gdp_out, ensure_ascii=False, separators=(",", ":")) + ";",
    "const CR_FOTO = " + json.dumps(CR_FOTO, ensure_ascii=False, separators=(",", ":")) + ";",
]
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")

kb = os.path.getsize(OUT) / 1024
print(f"data-cruces.js -> {kb:.0f}KB | {len(VARS)} variables | "
      f"{sum(len(r) for k in KEYS for r in CR_FOTO[k].values())} observaciones | "
      f"{len(CR_REGION)} países | olas {[w['w'] for w in CR_WAVES]}")

# ================================ VERIFICACIÓN ================================
print("\n== 1. MENÚ (olas y países en la ola 7) ==")
for v in VARS:
    n7 = len(CR_FOTO[v["k"]].get("7", []))
    print(f"  {v['grupo'][:3]}  {v['k']:<19} {v['fuente']:<10} olas={str(v['olas']):<24} "
          f"ola7={n7:>3} países   {v['es']}")

print("\n== 2. ARG / URY en 'otra_raza' ola 7 ==")
w7 = CR_FOTO["otra_raza"]["7"]
ok = True
for iso, exp_pct, exp_year in [("ARG", 2.7, 2017), ("URY", 0.6, 2022)]:
    row = next(r for r in w7 if r[0] == iso)
    g = gdp_out.get(iso, {})
    gy = min(g, key=lambda y: abs(int(y) - row[2]))
    print(f"  {iso}: pct={row[1]} (esp {exp_pct}) | año encuesta={row[2]} (esp {exp_year}) | "
          f"PIB año {gy} = {g[gy]:,.0f}  -> {'OK' if row[1] == exp_pct and row[2] == exp_year else 'FALLA'}")
    ok &= (row[1] == exp_pct and row[2] == exp_year)
arg_gdp = gdp_out["ARG"]["2017"]
print(f"  ARG PIB pc 2017 = {arg_gdp:,.1f} (esp ~19.150) -> {'OK' if abs(arg_gdp - 19150) < 60 else 'FALLA'}")
ok &= abs(arg_gdp - 19150) < 60
print(f"  URY trae PIB del año 2022: {'2022' in gdp_out['URY']} -> "
      f"{gdp_out['URY'].get('2022')}")
ok &= "2022" in gdp_out["URY"]
print(f"  URY es el MÍNIMO mundial de la ola 7: {w7[0][0] == 'URY'} (primero={w7[0]})")
ok &= (w7[0][0] == "URY")

print("\n== 3. COBERTURA DEL PIB EN LA OLA 7 ==")
for k in ["otra_raza", "C002", "H002_04", "G052"]:
    rows = CR_FOTO[k].get("7", [])
    con = sum(1 for r in rows
              if r[0] in gdp_out and any(abs(int(y) - r[2]) <= GDP_TOL for y in gdp_out[r[0]]))
    falt = sorted(r[0] for r in rows if r[0] not in gdp_out)
    print(f"  {k:<10} ola7: {con}/{len(rows)} países con PIB   sin PIB: {falt}")
print(f"  pares país-año usados: {len(pares)} | sin match ±{GDP_TOL}: {len(sin_match)} "
      f"({sorted({i for i, _ in sin_match})})")
print(f"  match aproximado (año != año de encuesta): {len(aproximados)}"
      f" (primeros: {aproximados[:4]})")
print(f"  países en CR_GDP: {len(gdp_out)} | entradas totales: {sum(len(v) for v in gdp_out.values())}")

print("\n== 4. ORDEN ASC POR PCT EN TODAS LAS CELDAS ==")
mono = all(rows[i][1] <= rows[i + 1][1]
           for k in KEYS for rows in CR_FOTO[k].values() for i in range(len(rows) - 1))
print(f"  {mono}")
ok &= mono

print("\n== 5. ETIQUETAS DE OLA == WV_META de data-waves.js ==")
import re
wjs = os.path.join(HERE, "..", "data-waves.js")
if os.path.exists(wjs):
    m = re.search(r"const WV_META = (\[.*?\]);", open(wjs, encoding="utf-8").read(), re.S)
    wv = {d["w"]: d["label"] for d in json.loads(m.group(1))}
    same = all(wv.get(d["w"]) == d["label"] for d in CR_WAVES)
    print(f"  {same} -> { {d['w']: d['label'] for d in CR_WAVES} }")
    ok &= same

print("\n== 5b. WORLD RISK POLL ==")
_w7 = CR_FOTO[WRP_K][str(WRP_WAVE)]
print(f"  paises: {len(_w7)} | promedio simple: {np.mean([r[1] for r in _w7]):.2f}% (esp 7,8)")
print(f"  tope: {_w7[-1][:2]} | piso: {_w7[0][:2]}")
for _iso, _esp in [("ARG", 10.7), ("BRA", 18.1), ("USA", 27.4), ("URY", 6.1)]:
    _r = next((r for r in _w7 if r[0] == _iso), None)
    print(f"  {_iso}: {_r[1]}% (esp {_esp}) año={_r[2]} -> {'OK' if _r and _r[1] == _esp else 'FALLA'}")
    ok &= bool(_r and _r[1] == _esp)
print(f"  sin region (deberia estar vacio): {sin_region_wrp}")
ok &= not sin_region_wrp
_cruce = [r[0] for r in _w7 if any(x[0] == r[0] for x in CR_FOTO["otra_raza"].get("7", []))]
print(f"  cruzan con 'otra_raza' ola 7: {len(_cruce)} paises")
_pib = sum(1 for r in _w7 if r[0] in gdp_out and any(abs(int(y) - r[2]) <= GDP_TOL for y in gdp_out[r[0]]))
print(f"  con PIB (para el scatter de desarrollo): {_pib}/{len(_w7)}")

print("\n== 6. REGIONES ==")
print(f"  {len(set(CR_REGION.values()))} regiones: {sorted(set(CR_REGION.values()))}")
print(f"  países sin región: {[i for i in {r[0] for k in KEYS for rows in foto[k].values() for r in rows} if i not in CR_REGION]}")

print("\nRESULTADO:", "TODO OK" if ok else "HAY DISCREPANCIAS")
