#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera 03-futbol/index-en.html a partir de index.html.

Por qué existe: el robot que arma el preview al compartir (X, WhatsApp,
Substack) NO ejecuta JS ni lee ?lang=en, así que el index normal previsualiza
siempre en español. index-en.html es una página COMPLETA en inglés (no una
redirección — los crawlers no arman card con páginas-redirección flacas) con
sus meta Open Graph/Twitter en inglés.

No edites index-en.html a mano: corré este script cada vez que cambie index.html
    python build_index_en.py
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent                      # carpeta 03-futbol/
src = (ROOT / "index.html").read_text(encoding="utf-8")

def replace_once(s, old, new, label):
    if s.count(old) != 1:
        sys.exit("ERROR: esperaba 1 ocurrencia de [%s], encontré %d. "
                 "¿Cambió index.html? Revisá build_index_en.py." % (label, s.count(old)))
    return s.replace(old, new)

# 1) idioma del documento
src = replace_once(src, '<html lang="es">', '<html lang="en">', "html lang")

# 2) bloque <head>: title + description + Open Graph/Twitter, todo en inglés
ES_HEAD = '''<title>El Atlas N°3 — La geografía del talento futbolístico</title>
<meta name="description" content="Dónde nacen los jugadores, dónde juegan y por qué algunos países rinden muy por encima del tamaño de su economía. 9 gráficos interactivos de El Atlas.">

<!-- Open Graph / Twitter: preview del link al compartir (X, WhatsApp, etc.).
     Las URLs deben ser ABSOLUTAS. Idioma del preview = español (las meta tags
     son estáticas; el crawler no ejecuta JS ni lee ?lang). -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="El Atlas · Cartografías del desarrollo">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/">
<meta property="og:title" content="La geografía del talento futbolístico — El Atlas N°3">
<meta property="og:description" content="Dónde nacen los jugadores, dónde juegan y por qué algunos países rinden muy por encima del tamaño de su economía.">
<meta property="og:image" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/thumbs/chart-birthplace.png">
<meta property="og:image:alt" content="Mapa mundial de las ciudades de nacimiento de los jugadores mundialistas">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="La geografía del talento futbolístico — El Atlas N°3">
<meta name="twitter:description" content="Dónde nacen los jugadores, dónde juegan y por qué algunos países rinden muy por encima del tamaño de su economía.">
<meta name="twitter:image" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/thumbs/chart-birthplace.png">'''

EN_HEAD = '''<title>The Atlas N°3 — The geography of football talent</title>
<meta name="description" content="Where players are born, where they play, and why some countries punch far above the size of their economy. 9 interactive charts from The Atlas.">

<!-- Open Graph / Twitter (INGLÉS). Generado por data-sources/build_index_en.py
     desde index.html — NO editar a mano. Página completa (no redirección) para
     que el robot de X/Substack arme bien el card. -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Atlas · Mapping development">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/index-en.html">
<meta property="og:title" content="The geography of football talent — The Atlas N°3">
<meta property="og:description" content="Where players are born, where they play, and why some countries punch far above the size of their economy.">
<meta property="og:image" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/thumbs/chart-birthplace.en.png">
<meta property="og:image:alt" content="World map of the birthplaces of World Cup players">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The geography of football talent — The Atlas N°3">
<meta name="twitter:description" content="Where players are born, where they play, and why some countries punch far above the size of their economy.">
<meta name="twitter:image" content="https://dschteingart.github.io/el-atlas-charts/03-futbol/thumbs/chart-birthplace.en.png">'''

src = replace_once(src, ES_HEAD, EN_HEAD, "head meta block")

# 3) miniaturas: el src por defecto pasa a la versión .en (data-thumb-* intacto)
src, n = re.subn(r'(<img class="idx-thumb" src="\./thumbs/chart-[a-z0-9-]+)\.png"',
                 r'\1.en.png"', src)
if n != 9:
    sys.exit("ERROR: esperaba 9 miniaturas, cambié %d." % n)

# 4) toggle: marcar EN como activo (evita el flash de ES antes de que corra el JS)
src = replace_once(src,
    '<button data-lang="es" class="active">ES</button>\n        <button data-lang="en">EN</button>',
    '<button data-lang="es">ES</button>\n        <button data-lang="en" class="active">EN</button>',
    "lang toggle active")

# 5) forzar inglés en el arranque (sin depender de ?lang ni de localStorage)
src = replace_once(src,
    '  applyI18n();\n  applyThumbLang();',
    "  // index-en.html: forzar inglés por defecto (no depende de ?lang).\n"
    "  try { LANG = 'en'; } catch (e) {}\n"
    "  try { localStorage.setItem('atlas-lang', 'en'); } catch (e) {}\n"
    "  document.documentElement.lang = 'en';\n"
    "  applyI18n();\n  applyThumbLang();",
    "inline force-EN")

(ROOT / "index-en.html").write_text(src, encoding="utf-8")
print("OK: index-en.html regenerado (página completa en inglés).")
