# Brasil: las grandes transformaciones

Once gráficos interactivos sobre cómo cambió Brasil entre 1872 y 2025: economía (convergencia,
exportaciones, China), bienestar (pobreza, educación), sociedad (demografía, hogares, religión,
valores) y dos ejes alternativos (homicidios, deforestación). Acompañan una columna de El Atlas
previa al balotaje del 25/10/2026.

## Estructura

- `br-motor.js`: motor compartido del número. `brLines` (líneas con halo, énfasis al hover también
  desde la etiqueta, crosshair que salta al año con dato, `wireTouchScrub`, etiquetas finales con
  anticolisión que conserva el orden y líneas guía, bandas de IC, rupturas de serie, proyección),
  `brStackH` (barras apiladas al 100%), `brBars` (barras anuales o bienales, preliminares rayadas),
  `brHBars` (ranking), y los controles: buscador + chips, slider de período universal, toggles,
  CSV estilo OWID, URL TODO-O-NADA, registro de formatos y nota del PNG.
- `chart-<slug>.js`: un adapter por gráfico (estado, series, controles, URL, CSV).
- `chart-<slug>.html` y `chart-<slug>-en.html` (landing inglesa para compartir), `index.html` e
  `index-en.html`, `nav.js`, `i18n-issue.js` (todas las claves ES/EN), `br.css`.
- `data-<tema>.js`: datos ya procesados. `thumbs/`: tarjetas ES/EN (son el PNG que baja cada página).

## Cómo se regenera

Los datos y las páginas salen de los scripts del proyecto de investigación
(`MEGAsync/Elecciones/brasil_2026/brasil_transformaciones/`), que documenta fuentes, procesamiento
y validación de cada serie:

```bash
python scripts/web/armar_datos_web.py
python scripts/web/armar_paginas.py --v N
```

`armar_paginas.py` escribe las 11 páginas, las 11 landings y el índice con UNA versión de caché
para toda la carpeta: subir `--v` en cada cambio de un `.js` o `.css` del número.
