# -*- coding: utf-8 -*-
"""
Genera 04-intolerancia/data-vdem.js — base del graficador de exclusión social
(V-Dem) y del scatter contra PIB per cápita.

FUENTES
  1. V-Dem v16, paquete oficial de R (vdeminstitute/vdemdata en GitHub, vdem.RData,
     34 MB). V-Dem NO ofrece descarga por indicador: se baja ese archivo una vez y
     se extraen las 6 columnas con tools/../vdem_extract (ver Bases/V-Dem/).
     El CSV intermedio ya extraído: Bases/V-Dem/vdem_exclusion_social.csv
  2. PIB per cápita EMPALMADO:
       - Maddison Project Database 2023 (dólares internacionales de 2011, PPA),
         hasta 2022 -> data/maddison_gdppc.csv
       - Banco Mundial (dólares internacionales de 2021, PPA), 1990-2024
         -> data/worldbank_gdppc.csv
     Las dos series están en unidades DISTINTAS (2011 vs 2021), así que NO se
     concatenan: se empalma por TASA DE VARIACIÓN. Se conserva el nivel de
     Maddison y, de 2023 en adelante, se aplica el crecimiento del Banco Mundial:
         pib[t] = pib_maddison[2022] * (wb[t] / wb[2022])
     Así no hay salto artificial (Argentina 2017: Maddison 19.150 vs BM 28.335;
     concatenar habría inventado un +48%).

SALIDA (data-vdem.js)
  VD_META    metadatos y unidades
  VD_VARS    [{k, es, en, tipo:'indice'|'componente', escala:[min,max], def_es, def_en}]
  VD_SERIES[k][iso3] = [primerAño, [v, v, ...]]   años CONSECUTIVOS, null en huecos
  VD_GDP[iso3]       = [primerAño, [v, v, ...]]   idem, PIB pc empalmado
  VD_REGION[iso3]    región del Atlas
  VD_NAMES[iso3]     nombre del país según V-Dem (fallback; el display sale de i18n)
"""
import csv, io, json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
N5 = os.path.dirname(HERE)
BASES = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases"

VDEM_CSV = os.path.join(BASES, "V-Dem", "vdem_exclusion_social.csv")
MADD_CSV = os.path.join(N5, "data", "maddison_gdppc.csv")
WB_CSV   = os.path.join(N5, "data", "worldbank_gdppc.csv")
OUT      = os.path.join(N5, "data-vdem.js")

YEAR_MIN = 1900          # el índice arranca en 1900; recortamos ahí para no inflar el archivo

# --- el índice y sus 5 componentes, con los pesos de la estructura de agregación v16 ---
#
# ESCALAS (verificado sobre los datos, no sobre el codebook — la primera versión de
# este script decía 0-4 y estaba MAL):
#   · El ÍNDICE v2xpe_exlsocgr va de 0 a 1 (observado: 0,01 a 0,99). 1 = exclusión total.
#   · Los 5 COMPONENTES son las estimaciones puntuales del modelo de medición de V-Dem:
#     escala de INTERVALO centrada en ~0, desvío ~1,5, observada entre −3,4 y +3,6, con
#     alrededor de la mitad de los valores negativos. NO van de 0 a 4. El 0 es
#     aproximadamente el promedio histórico mundial, que es como los muestra OWID.
#     Mayor = más igualitario.
#   · El 0-4 del codebook es la escala ORDINAL original, que V-Dem publica aparte como
#     v2*_ord (verificado: existen las seis familias _ord en el .RData). Si alguna vez se
#     quiere la versión 0-4 "cruda de los expertos", hay que extraer esas columnas; acá
#     usamos la de intervalo porque es la comparable entre países y la que usa OWID.
VARS = [
    dict(k="v2xpe_exlsocgr", tipo="indice", escala=[0, 1],
         grupo="Índice", grupo_en="Index",
         es="Exclusión por grupo social (índice)",
         en="Exclusion by social group (index)",
         def_es="Índice de V-Dem: cuánto se le niega a la gente el acceso a servicios o la participación por pertenecer a un grupo social (etnia, lengua, raza, religión, casta, región). 0 = sin exclusión, 1 = exclusión total.",
         def_en="V-Dem index: how far people are denied access to services or participation because they belong to a social group (ethnicity, language, race, religion, caste, region). 0 = no exclusion, 1 = total exclusion."),
    dict(k="v2peapssoc", tipo="componente", grupo="Componentes del índice", grupo_en="Index components", escala=[-3.5, 3.6], peso=0.409,
         es="Acceso a servicios públicos", en="Access to public services",
         def_es="Componente del índice (peso 0,409). Igualdad en el acceso a servicios públicos según el grupo social. Escala de intervalo centrada en 0 (el promedio histórico mundial); mayor = más igualitario.",
         def_en="Index component (weight 0.409). Equality of access to public services by social group. Interval scale centred on 0 (the historical world average); higher = more equal."),
    dict(k="v2peasbsoc", tipo="componente", grupo="Componentes del índice", grupo_en="Index components", escala=[-3.5, 3.6], peso=0.306,
         es="Acceso a negocios con el Estado", en="Access to state business opportunities",
         def_es="Componente del índice (peso 0,306). Igualdad en el acceso a oportunidades de negocio con el Estado. Escala de intervalo centrada en 0; mayor = más igualitario.",
         def_en="Index component (weight 0.306). Equality of access to state business opportunities. Interval scale centred on 0; higher = more equal."),
    dict(k="v2peasjsoc", tipo="componente", grupo="Componentes del índice", grupo_en="Index components", escala=[-3.5, 3.6], peso=0.298,
         es="Acceso a empleos del Estado", en="Access to state jobs",
         def_es="Componente del índice (peso 0,298). Igualdad en el acceso a empleos estatales según el grupo social. Escala de intervalo centrada en 0; mayor = más igualitario.",
         def_en="Index component (weight 0.298). Equality of access to state jobs by social group. Interval scale centred on 0; higher = more equal."),
    dict(k="v2pepwrsoc", tipo="componente", grupo="Componentes del índice", grupo_en="Index components", escala=[-3.5, 3.6], peso=0.511,
         es="Poder político", en="Political power",
         def_es="Componente del índice (peso 0,511). Cuán repartido está el poder político entre grupos sociales. Escala de intervalo centrada en 0; mayor = más repartido.",
         def_en="Index component (weight 0.511). How evenly political power is distributed across social groups. Interval scale centred on 0; higher = more even."),
    dict(k="v2clsocgrp", tipo="componente", grupo="Componentes del índice", grupo_en="Index components", escala=[-3.5, 3.6], peso=0.522,
         es="Libertades civiles", en="Civil liberties",
         def_es="Componente del índice (peso 0,522). Igualdad en el respeto de las libertades civiles entre grupos sociales. Escala de intervalo centrada en 0; mayor = más igualitario.",
         def_en="Index component (weight 0.522). Equality in respect for civil liberties across social groups. Interval scale centred on 0; higher = more equal."),
]
KEYS = [v["k"] for v in VARS]

# ---------------------------------------------------------------- regiones
# lib/regions.js define la TAXONOMÍA (las 10 regiones y su paleta) pero NO el mapa
# país→región: ese viaja dentro de los datos de cada número. Se reusa el de los
# data-*.js ya generados (la fuente autorizada del N°4) y se completa a mano con
# los países que V-Dem cubre y la IVS no.
def load_regions():
    import re
    out = {}
    for f, n in [("data-cruces.js", "CR_REGION"), ("data-waves.js", "VE_REGION"),
                 ("data-prioridad.js", "PRIO_REGION"), ("data-quien.js", "QUIEN_REGION")]:
        p = os.path.join(N5, f)
        if not os.path.exists(p):
            continue
        txt = io.open(p, encoding="utf-8").read()
        m = re.search(r"const " + n + r"\s*=\s*(\{.*?\});", txt, re.S)
        if m:
            for k, v in json.loads(m.group(1)).items():
                out.setdefault(k, v)
    return out

# Países que V-Dem cubre y la IVS no. Se completan a mano una sola vez.
REGION_EXTRA = {
    # África subsahariana
    "AGO": "Sub-Saharan Africa", "BDI": "Sub-Saharan Africa", "BEN": "Sub-Saharan Africa",
    "BWA": "Sub-Saharan Africa", "CAF": "Sub-Saharan Africa", "CIV": "Sub-Saharan Africa",
    "CMR": "Sub-Saharan Africa", "COD": "Sub-Saharan Africa", "COG": "Sub-Saharan Africa",
    "COM": "Sub-Saharan Africa", "CPV": "Sub-Saharan Africa", "DJI": "Sub-Saharan Africa",
    "ERI": "Sub-Saharan Africa", "GAB": "Sub-Saharan Africa", "GIN": "Sub-Saharan Africa",
    "GMB": "Sub-Saharan Africa", "GNB": "Sub-Saharan Africa", "GNQ": "Sub-Saharan Africa",
    "LBR": "Sub-Saharan Africa", "LSO": "Sub-Saharan Africa", "MDG": "Sub-Saharan Africa",
    "MOZ": "Sub-Saharan Africa", "MRT": "Sub-Saharan Africa", "MUS": "Sub-Saharan Africa",
    "MWI": "Sub-Saharan Africa", "NAM": "Sub-Saharan Africa", "NER": "Sub-Saharan Africa",
    "SDN": "Sub-Saharan Africa", "SEN": "Sub-Saharan Africa", "SLE": "Sub-Saharan Africa",
    "SML": "Sub-Saharan Africa", "SOM": "Sub-Saharan Africa", "SSD": "Sub-Saharan Africa",
    "STP": "Sub-Saharan Africa", "SWZ": "Sub-Saharan Africa", "SYC": "Sub-Saharan Africa",
    "TCD": "Sub-Saharan Africa", "TGO": "Sub-Saharan Africa",
    # Asia del Sur / Sudeste / Este
    "AFG": "South Asia", "BTN": "South Asia", "LKA": "South Asia", "NPL": "South Asia",
    "KHM": "Southeast Asia", "LAO": "Southeast Asia", "TLS": "Southeast Asia",
    "PRK": "East Asia",
    # Medio Oriente y Norte de África
    "ARE": "Middle East & North Africa", "BHR": "Middle East & North Africa",
    "OMN": "Middle East & North Africa", "SYR": "Middle East & North Africa",
    "PSG": "Middle East & North Africa",
    # Europa del Este y Asia Central
    "TKM": "Eastern Europe & Central Asia", "XKX": "Eastern Europe & Central Asia",
    # Caribe (incluye Guyana y Surinam, que son sudamericanos pero no latinos y
    # se agrupan con el Caribe en la taxonomía del Atlas)
    "BRB": "Caribbean", "CUB": "Caribbean", "JAM": "Caribbean",
    "GUY": "Caribbean", "SUR": "Caribbean",
}
# Deliberadamente SIN región, y por lo tanto descartados:
#   · entidades históricas que V-Dem cubre y hoy no existen como país (Baden,
#     Baviera, Brunswick, Hannover, Hesse-Darmstadt, Mecklemburgo, Módena, Nassau,
#     Oldemburgo, Estados Pontificios, Parma, Piamonte-Cerdeña, Sajonia,
#     Sajonia-Weimar, Toscana, Dos Sicilias, Wurtemberg, RDA, Vietnam del Sur,
#     Yemen del Sur, Zanzíbar, Palestina/Mandato Británico);
#   · las islas del Pacífico (Fiyi, Papúa Nueva Guinea, Islas Salomón, Vanuatu):
#     la taxonomía del Atlas no tiene un bucket de Oceanía que no sea
#     "Norteamérica, Australia y N.Z.", y meterlas ahí sería falso.

REGION = load_regions()
REGION.update(REGION_EXTRA)

def compact(by_year, ymin=None):
    """{año: valor} -> [primerAño, [v,...]] con años consecutivos y null en huecos."""
    if not by_year:
        return None
    ys = sorted(by_year)
    y0 = max(ys[0], ymin) if ymin else ys[0]
    ys = [y for y in ys if y >= y0]
    if not ys:
        return None
    y1 = ys[-1]
    return [y0, [by_year.get(y) for y in range(y0, y1 + 1)]]

# ---------------------------------------------------------------- V-Dem
print("leyendo V-Dem...")
series = {k: collections.defaultdict(dict) for k in KEYS}
names = {}
for r in csv.DictReader(io.open(VDEM_CSV, encoding="utf-8")):
    iso = (r.get("country_text_id") or "").strip()
    if len(iso) != 3:
        continue
    try:
        y = int(float(r["year"]))
    except (ValueError, KeyError):
        continue
    if y < YEAR_MIN:
        continue
    names.setdefault(iso, r.get("country_name", iso))
    for k in KEYS:
        v = r.get(k, "")
        if v not in ("", "NA", None):
            try:
                # Se guardan ENTEROS ESCALADOS (ver VD_META.escalado): el índice
                # ×1000 y los componentes ×100. Un archivo de 856 KB baja a ~450:
                # "126" ocupa la mitad que "0.126" y son ~134.000 valores. El JS
                # divide al leer.
                series[k][iso][y] = int(round(float(v) * (1000 if k == KEYS[0] else 100)))
            except ValueError:
                pass

# Sólo entran los países CON región: eso descarta de una las entidades históricas
# que V-Dem cubre (Baden, Dos Sicilias, RDA, Vietnam del Sur…) y las islas del
# Pacífico, que la taxonomía del Atlas no sabe ubicar.
VD_SERIES = {}
descartados = set()
for k in KEYS:
    VD_SERIES[k] = {}
    for iso, by in series[k].items():
        if iso not in REGION:
            descartados.add(iso)
            continue
        c = compact(by, YEAR_MIN)
        if c and any(x is not None for x in c[1]):
            VD_SERIES[k][iso] = c
    print("  %-16s paises=%d" % (k, len(VD_SERIES[k])))
print("  descartados por no tener región: %d (%s…)"
      % (len(descartados), ", ".join(sorted(descartados)[:6])))

# ---------------------------------------------------------------- PIB empalmado
print("empalmando PIB per cápita...")
madd = collections.defaultdict(dict)
for r in csv.DictReader(io.open(MADD_CSV, encoding="utf-8")):
    iso = (r.get("Code") or "").strip()
    if len(iso) != 3 or not r.get("GDP per capita"):
        continue
    try:
        madd[iso][int(r["Year"])] = float(r["GDP per capita"])
    except ValueError:
        pass

wb = collections.defaultdict(dict)
wb_col = None
for r in csv.DictReader(io.open(WB_CSV, encoding="utf-8")):
    if wb_col is None:
        wb_col = [c for c in r if "GDP" in c][0]
    iso = (r.get("Code") or "").strip()
    if len(iso) != 3 or not r.get(wb_col):
        continue
    try:
        wb[iso][int(r["Year"])] = float(r[wb_col])
    except ValueError:
        pass

VD_GDP = {}
empalmados = solo_madd = 0
for iso in set(list(madd) + list(wb)):
    m, w = madd.get(iso, {}), wb.get(iso, {})
    out = dict(m)
    comunes = sorted(set(m) & set(w))
    if comunes and w:
        # año de anclaje: el último con dato en ambas (normalmente 2022)
        anc = comunes[-1]
        ratio = m[anc] / w[anc] if w[anc] else None
        if ratio:
            for y, v in w.items():
                if y > anc:
                    out[y] = round(v * ratio, 1)
            if any(y > anc for y in w):
                empalmados += 1
    elif not m:
        continue  # sin Maddison no hay nivel de referencia: se descarta
    else:
        solo_madd += 1
    c = compact({y: round(v, 1) for y, v in out.items()}, YEAR_MIN)
    if c:
        VD_GDP[iso] = c

print("  paises con PIB: %d (empalmados hacia adelante: %d, solo Maddison: %d)"
      % (len(VD_GDP), empalmados, solo_madd))

# ---------------------------------------------------------------- salida
VD_META = {
    "vdem_version": "v16",
    "vdem_fuente": "V-Dem (Varieties of Democracy) v16, Universidad de Gotemburgo",
    "vdem_anio_max": 2023,
    "gdp_fuente_es": "Maddison Project Database 2023 empalmada con Banco Mundial",
    "gdp_fuente_en": "Maddison Project Database 2023 spliced with World Bank",
    "gdp_unidad_es": "dólares internacionales de 2011 (PPA)",
    "gdp_unidad_en": "2011 international dollars (PPP)",
    "gdp_empalme_es": "Hasta 2022, Maddison. Desde 2023, se aplica la tasa de variación del Banco Mundial sobre el nivel de Maddison (las dos series están en años base distintos, así que no se concatenan).",
    "gdp_empalme_en": "Maddison through 2022. From 2023 on, the World Bank growth rate is applied to the Maddison level (the two series use different base years, so they are not concatenated).",
    "year_min": YEAR_MIN,
    "generado_por": "tools/make_vdem.py",
    # Los valores de VD_SERIES van como ENTEROS ESCALADOS para achicar el archivo:
    # el índice ×1000 (0-1000) y los cinco componentes ×100 (0-400). Dividir al leer.
    "escalado": {"v2xpe_exlsocgr": 1000, "_componentes": 100},
    "gdp_escalado": 1,
}

VD_REGION = {iso: REGION.get(iso) for iso in VD_SERIES[KEYS[0]] if REGION.get(iso)}

def dump(name, obj):
    return "const %s = %s;\n" % (name, json.dumps(obj, ensure_ascii=False, separators=(",", ":")))

hdr = (
    "// =============================================================\n"
    "//  El Atlas N°4 — exclusión social (V-Dem) + PIB per cápita\n"
    "// =============================================================\n"
    "// GENERADO por tools/make_vdem.py — no editar a mano.\n"
    "// VD_SERIES[var][iso3] = [primerAño, [v, v, ...]] con años CONSECUTIVOS y null\n"
    "//   en los huecos (formato compacto: no se repite el año en cada punto).\n"
    "// VD_GDP[iso3] = igual formato. PIB EMPALMADO: Maddison hasta 2022 y, de ahí en\n"
    "//   adelante, la tasa de variación del Banco Mundial aplicada sobre el nivel de\n"
    "//   Maddison — las dos series están en años base distintos (2011 vs 2021), así\n"
    "//   que concatenarlas habría inventado un salto (Argentina 2017: 19.150 vs 28.335).\n"
    "// Escalas: el ÍNDICE va de 0 (sin exclusión) a 1 (exclusión total). Los 5\n"
    "//   COMPONENTES son estimaciones del modelo de medición de V-Dem: escala de\n"
    "//   INTERVALO centrada en ~0 (el promedio histórico mundial), NO de 0 a 4, y\n"
    "//   apuntan al REVÉS que el índice (mayor = más igualitario). El 0-4 del\n"
    "//   codebook es la escala ordinal, que V-Dem publica aparte como v2*_ord.\n"
)

# SE EMITE EN VARIOS ARCHIVOS, uno por variable, y no en uno solo.
# Motivo práctico, no estético: el servidor de preview local corta las respuestas
# de archivos grandes servidos como <script src> (ERR_CONNECTION_RESET; ya pasó
# con data-country-geo.js de 2 MB y data-elo-series.js de 359 KB). Un único
# data-vdem.js de 610 KB no cargaba. Partido por variable, cada archivo queda en
# ~90 KB y además una página que sólo necesite el índice puede cargar sólo ese.
with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(hdr)
    f.write("// Este archivo trae el NÚCLEO. Las series de cada variable viven en\n"
            "// data-vdem-<variable>.js y se van sumando a VD_SERIES; hay que cargarlas\n"
            "// DESPUÉS de este archivo.\n")
    f.write(dump("VD_META", VD_META))
    f.write(dump("VD_VARS", VARS))
    f.write(dump("VD_REGION", VD_REGION))
    f.write(dump("VD_NAMES", {k: v for k, v in names.items() if k in VD_REGION}))
    f.write(dump("VD_GDP", VD_GDP))
    f.write("const VD_SERIES = {};\n")

escritos = [(os.path.basename(OUT), os.path.getsize(OUT))]
for k in KEYS:
    p = os.path.join(N5, "data-vdem-%s.js" % k)
    with io.open(p, "w", encoding="utf-8") as f:
        f.write("// GENERADO por tools/make_vdem.py — serie de %s. Cargar DESPUÉS de data-vdem.js.\n" % k)
        f.write("VD_SERIES[%s] = %s;\n"
                % (json.dumps(k), json.dumps(VD_SERIES[k], ensure_ascii=False, separators=(",", ":"))))
    escritos.append((os.path.basename(p), os.path.getsize(p)))

print("\narchivos escritos:")
for n, s in escritos:
    print("  %-34s %6.0f KB" % (n, s / 1024))
print("  %-34s %6.0f KB  (total)" % ("", sum(s for _, s in escritos) / 1024))

# ---------------------------------------------------------------- verificación
print("\n== verificación ==")
def val(k, iso, year):
    """Devuelve el valor REAL (deshace el escalado), como hará el JS."""
    s = VD_SERIES[k].get(iso)
    if not s:
        return None
    i = year - s[0]
    raw = s[1][i] if 0 <= i < len(s[1]) else None
    if raw is None:
        return None
    return raw / (1000.0 if k == KEYS[0] else 100.0)

for iso in ("ARG", "BRA", "URY"):
    print("  %s 2023: indice=%s  poder=%s  libertades=%s  PIBpc=%s"
          % (iso, val("v2xpe_exlsocgr", iso, 2023), val("v2pepwrsoc", iso, 2023),
             val("v2clsocgrp", iso, 2023),
             (lambda s: s[1][2023 - s[0]] if s and 0 <= 2023 - s[0] < len(s[1]) else None)(VD_GDP.get("ARG" if iso == "ARG" else iso))))

g = VD_GDP.get("ARG")
if g:
    for y in (2017, 2022, 2023, 2024):
        i = y - g[0]
        if 0 <= i < len(g[1]):
            print("  ARG PIBpc %d = %s" % (y, g[1][i]))
