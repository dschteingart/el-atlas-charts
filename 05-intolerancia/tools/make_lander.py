# -*- coding: utf-8 -*-
"""
Genera "landers" finos para embeber una VISTA concreta del graficador en Substack.

El problema (opción A de la auditoría OWID, ver [[atlas-graficador-plan]]): GitHub
Pages es estático, así que chart-vecinos.html?vista=mapa y ?vista=linea comparten el
mismo <head> => el mismo preview OG. Para que "un link de línea y uno de mapa" tengan
previews distintos en Substack, cada vista embebida necesita su propia URL con su propio
<head> estático. Este script genera esa paginita: OG estático apuntando al PNG de esa
vista + redirect instantáneo al graficador en la vista/categoría correctas.

Uso: editar LANDERS abajo y correr `python make_lander.py`. Salen en 05-intolerancia/v/.
El PNG de OG (thumbs/chart-vecinos-<slug>.png) se genera aparte (pasada de thumbnails).
"""
import os

BASE_URL = "https://dschteingart.github.io/el-atlas-charts/05-intolerancia"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "v")

# slug | vista | cat | título OG | descripción OG
LANDERS = [
    ("vecinos-mapa", "mapa", "otra_raza",
     "El mapa mundial de la intolerancia declarada — El Atlas · N°5",
     "El porcentaje que no querría de vecino a personas de otra raza, país por país (IVS 2017-2022)."),
    ("vecinos-evolucion", "pelicula", "homosexuales",
     "El derrumbe del rechazo a los homosexuales — El Atlas · N°5",
     "Cómo cambió el rechazo declarado a tener vecinos homosexuales, país por país, entre 1981 y 2022."),
]

TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="El Atlas · Cartografías del desarrollo">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="{base}/v/{slug}.html">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{base}/thumbs/chart-{slug}.png">
<meta property="og:image:alt" content="{title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{base}/thumbs/chart-{slug}.png">
<link rel="canonical" href="../chart-vecinos.html?vista={view}&cat={cat}">
<meta http-equiv="refresh" content="0; url=../chart-vecinos.html?vista={view}&cat={cat}">
</head>
<body>
<p style="font-family:system-ui,sans-serif;padding:24px;color:#3A3530">
  Abriendo el gráfico interactivo…
  <a href="../chart-vecinos.html?vista={view}&cat={cat}">Entrar</a>
</p>
<script>location.replace('../chart-vecinos.html?vista={view}&cat={cat}');</script>
</body>
</html>
"""

os.makedirs(OUT_DIR, exist_ok=True)
for slug, view, cat, title, desc in LANDERS:
    html = TEMPLATE.format(base=BASE_URL, slug=slug, view=view, cat=cat, title=title, desc=desc)
    path = os.path.join(OUT_DIR, slug + ".html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", path)
