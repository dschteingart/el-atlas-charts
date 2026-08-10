# el-atlas-charts

Gráficos interactivos de **El Atlas** (newsletter de Daniel Schteingart, [elatlas.substack.com](https://elatlas.substack.com)). HTML estático sin build step, publicado con GitHub Pages en [dschteingart.github.io/el-atlas-charts](https://dschteingart.github.io/el-atlas-charts/).

## Estructura

- Una carpeta por entrega: `01-bienestar-violencia`, `02-demasiado-desiguales`, `03-futbol`, `03b-partidos`, `04-intolerancia`. Cada una tiene sus `chart-*.html`, un renderer JS por gráfico, sus `data-*.js` y sus strings de idioma (`i18n-issue.js`).
- **Ojo con el N°3**: desde la fusión de 2026-08-10 el N°3 es "El Atlas del fútbol" y abarca **dos carpetas** — `03-futbol` (12 gráficos) y `03b-partidos` (10, el ex "Especial de partidos"). Se fusionó lo que ve el lector (un índice único en `03-futbol/index.html`, una navegación de 22 que cruza de carpeta, una sola marca) **sin mover archivos**: mover rompería los links ya compartidos y las configuraciones guardadas del editor, que se indexan por el número interno de cada gráfico (1-12 en `03-futbol`, 1-10 en `03b-partidos`; por eso los números internos siguen chocando y las claves i18n `cN-*` viven separadas por carpeta — en el índice único los 10 del ex especial usan claves `pN-title`). Los índices viejos de `03b-partidos` redirigen al único. `nav.js` es idéntico en las dos carpetas.
- **`lib/`** — los motores compartidos (unificados en la Fase 2 de la auditoría, jul-2026):
  - `png-export.js` — compone el PNG en canvas (título/subtítulo/gráfico/nota/firma). Detecta el número por globals y elige filenames/formatos.
  - `editor.js` + `editor.css` — el modo edición `?nl=1` (ver abajo).
  - `svg-export.js` — SVG editable para Figma (botón en el editor, N°2 y N°3).
  - `utils.js` — formatos PNG, `atlasSetHeading` (títulos dinámicos), `atlasApplyEditorTexts` (aplica los textos custom del editor), utilidades touch.
  - `theme.js` — la identidad visual con nombre (paleta estándar de 12, categorías, semáforos). **Los charts nuevos toman los colores de acá.**
  - `country-names.js`, `regions.js`, `i18n.js`, `scatter-render.js`, `style.css`.
  - El N°1 todavía usa sus copias viejas locales (se moderniza en la Fase 3 con la rama `feat/n1-cuadrado`).
- **`charts.json`** — catálogo de todos los gráficos publicados (mantener al agregar charts).

## El modo edición `?nl=1`

A cualquier `chart-*.html` se le agrega `?nl=1` (o Ctrl/Cmd+Shift+E) y aparece el panel para retocar título, subtítulo y nota, elegir formato de PNG y (donde aplica) países etiquetados, ejes y tamaños. El panel muestra **solo las secciones que el gráfico consume** (`data-editor-caps="axis,sizes"` en el `.chart-block`). Persistencia en localStorage.

**Retoques por link:** `?nl=1&titulo=…&subtitulo=…&nota=…&formato=square` aplica los textos sin persistirlos — el link reproduce la vista exacta. Componer con `&lang=en` para la versión en inglés.

## Contrato de un chart nuevo

1. Registrar `window.__atlasSupportsFormats = true` y `window.__atlasRedraw = drawX` (+ `window.__atlasDefaultPngFormat = 'worldmap'` si es mapa).
2. Hooks opcionales del export: `onBeforePngExportGetSourceText` (nota "Datos:" dinámica), `...GetSubtitle`, `...Prepare`/`onAfterPngExportRestore` (re-encuadre), `...GetExtraGap`.
3. Escuchar `atlas-editor-change` → redraw, y en `applyHeadings` respetar el texto custom (`!(tx.title||'').trim()` antes de pisar).
4. Títulos con `atlasSetHeading`: insight en el estado default → neutral al customizar.
5. Checklist de integración: entrada en `FILENAMES` de `lib/png-export.js` (ES y EN), thumbs ES+EN + `og:image`, tarjeta en el index + `nav.js`, strings i18n completos, entrada en `charts.json`.
6. Cache-busting: **una** versión global por carpeta (`?v=N` idéntico en todas las páginas del número); las libs llevan la suya (`lib/*.js?v=N`). Bumpear al editar el archivo.

## Criterios de diseño

Documentados en la skill `graficos-atlas` (sesiones de Claude Code) y en el informe de la auditoría jul-2026. Los esenciales: paleta única (`lib/theme.js` — prohibido inventar paletas por chart), todo responde al tacto (nada detrás de `HAS_HOVER`), tooltip oscuro estándar, PNG cuadrado 1200×1200 mobile-first (mapas: apaisado 1200×920), números en locale (`es-AR`/`en-US`).
