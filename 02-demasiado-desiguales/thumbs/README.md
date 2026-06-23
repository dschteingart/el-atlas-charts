# Miniaturas (previews) del index

Cada tarjeta del `index.html` muestra arriba una miniatura del gráfico. La
imagen se busca en esta carpeta con el nombre del gráfico. Si el archivo no
existe, la tarjeta queda sin imagen (no se rompe — `onerror` la quita).

Dejá acá los PNG con **estos nombres exactos** (el formato cuadrado del botón
"Descargar PNG" va perfecto; se recorta solo con CSS a 150px de alto):

| Gráfico | Archivo |
|---|---|
| 1 — El ranking mundial de la desigualdad        | `chart-1.png` |
| 2 — América Latina, demasiado desigual para su nivel | `chart-2.png` |
| 3 — Las élites cerca, los pobres lejos          | `chart-3.png` |
| 4 — El ingreso por decil, país por país (mapa)  | `chart-4.png` |

## Versión en inglés

El index muestra la miniatura en el idioma activo. Para cada gráfico hay un
par: `chart-N.png` (ES, default) y `chart-N.en.png` (EN). Si falta la
`.en.png`, esa tarjeta queda sin imagen en inglés (no se rompe). Mismos
nombres, con sufijo `.en` antes del `.png`.

Tip: no hace falta que sean chicos; el CSS los encuadra. Pero si querés que el
repo no pese, redimensionalos a ~600 px de ancho. Si re-exportás un thumbnail
(mismo nombre), bumpeá `THUMB_V` en `index.html` para forzar la recarga.
