# Manual de la casa — el-atlas-charts

Reglas acumuladas de los números 1 a 5. Este archivo es la **fuente de verdad operativa**: si un chart viejo contradice un criterio de acá, el desactualizado es el chart. El detalle profundo (trampas del rasterizado, recetas de labels, calibres del PNG) vive en la skill `graficos-atlas`: **cargarla siempre que se toque un chart**. El README.md describe la estructura del repo.

## Proceso obligatorio antes de construir

1. **Identificar el chart análogo ya publicado y ABRIRLO.** Nada acá se diseña de cero. Referencias por tipo:
   - Stacked area → `03b-partidos/ts-partidos.js` (chart-amistosos) y `05-pantheon/evolucion.js`
   - Líneas temporales → `03-futbol/elo-lines.js`; series de encuesta → `04-intolerancia/pelicula.js`
   - Scatter → `04-intolerancia/desarrollo.js` (motor aprobado) + `lib/scatter-render.js`
   - Marimekko / ranking de barras → `04-intolerancia/ranking.js` (el del N°2 es anterior y peor)
   - Mapa coroplético → `04-intolerancia/mapa.js` / `vdem-mapa.js` (Robinson vanilla, sin D3); `05-pantheon/percap-map.js`
   - Tabla / heatmap → `05-pantheon/top.html`, `reparto.html`
   - Multi-vista (pestañas sobre un dataset) → `lib/grapher.js` (chart-vecinos del N°4)
   - Slider de período inicio/fin → `05-pantheon/evolucion.js` / `percap-map.js`
2. **Inventariar TODAS las interacciones del análogo y portarlas todas.** Cuando se pide "hacelo como el del N°3" se está dando un ejemplo, no una lista cerrada: la paridad completa de features es lo esperado. Checklist mínima: hover/tap que resalta y atenúa el resto (también desde la etiqueta), crosshair + tooltip + `wireTouchScrub`, etiquetas de fin de serie con halo + anti-colisión + líneas guía, leyenda interactiva (hover atenúa, click apaga y recalcula), buscador + chips + Limpiar, re-render por viewport (`__atlasRedraw`), formatos PNG, editor `?nl=1`, estado en la URL. Todo gateado por `isPngFormat` para que el export no lleve interacciones.
3. **Ante la duda, preguntar antes de construir.** Una pregunta corta cuesta menos que tres rondas de corrección.
4. **Grep del componente existente antes de escribir uno "nuevo".** Buscador, chips, slider, tooltip, toggle, export: todo ya existe en `lib/` o en un chart publicado. Construir de cero algo que ya existe es el error (ej.: un `<input list>` nativo donde la casa usa `.m-search-*`).
5. **Verificar con puntero real, no con `dispatchEvent`** (saltea el hit-testing y da falsos positivos), y **verificar el render, no el atributo** (`getComputedStyle` / `getBoundingClientRect`; un `hidden` puede estar puesto y el elemento seguir visible).

## Contrato de página (todo chart, desde la primera versión)

Sin excepción de "prototipo": si se va a mirar o mostrar, lleva el tratamiento completo. Solo un lab puramente interno queda afuera.

- **Bilingüe ES/EN**: top-bar de la casa con lang-toggle; claves por página en `i18n-issue.js` (+ diccionario compartido `lib/i18n.js`); `<title>` con `data-title-en` (formato `"<frase> — El Atlas"`, la marca detrás); todo texto visible con `data-i18n` y su clave EN EXISTENTE (una clave faltante deja el castellano en silencio). Números SIEMPRE con locale (`fmt()` de lib, `es-AR`/`en-US`), incluidos índices y decimales ("48,3", no "48.3").
- **Descargas**: botón "Descargar datos (CSV)" + botón "Descargar PNG" en el footer (claves `footer-download` / `footer-download-png`). CSV estilo OWID: primera fila = encabezados (sin líneas `#`), encabezados localizados, BOM para Excel, campos citados, código + descripción legible cuando hay claves internas, nombres de país en ambos idiomas, filename propio por idioma (nunca dos charts pisándose el mismo nombre).
- **Vista compartible en la URL, criterio TODO-O-NADA**: la vista de fábrica viaja como URL limpia (nunca se escribe el default: los cambios editoriales futuros le llegan a quien ya tiene el link); cualquier desvío escribe el estado COMPLETO. Motor: `atlasSyncUrl`/`atlasUrlParam` (lib/utils.js), `history.replaceState`. Patrón: `xx_applyUrlState()` una vez en el init (leer, validar contra el universo real, aplicar MANEJANDO los controles reales, marcar `urlWired`) y `xx_syncUrl()` al final de cada draw, gateado por `urlWired` para que el primer draw no borre los params entrantes. Convención: params en castellano (`vista`, `paises`, `periodo`, `medida`, `anio`, `ocultas`), listas con `~`, `-` = selección custom vacía (vaciar es legítimo y los defaults no resucitan). Nunca aceptar "todas las regiones apagadas" desde la URL. Datasets diferidos: si la URL pide algo que vive en un archivo lazy, pedirlo y repintar al aterrizar.
- **Editor `?nl=1` cableado**: la página carga `lib/editor.js`; el texto custom del panel MANDA sobre títulos dinámicos y sobre los hooks del PNG (el guard `!(tx.title||'').trim()` antes de pisar, en CADA redraw); el panel muestra solo las perillas que el chart obedece (`data-editor-caps`, `__atlasCountryUniverse`) — un slider que no hace nada es peor que no tener slider; una selección que viene en la URL le gana a la lista guardada del editor (y el panel la adopta); el idioma NO se restaura de localStorage (sale de la página).
- **Touch universal**: nada gateado tras `HAS_HOVER` — todo responde al tap (un tap dispara mouse events sintéticos; el cierre tap-away global ya vive en lib). Targets chicos: hit-area transparente r≈30. Charts de línea: `wireTouchScrub`. En scatters/marimekkos densos el tap muestra tooltip y NO togglea selección (para elegir países en el celu está el buscador); en desktop el click sí selecciona.
- **Tooltip oscuro estándar** de lib (fondo `var(--ink)`, texto blanco); para nombres de región adentro usar las variantes `*_ON_DARK` de `lib/regions.js` (los colores de región calibrados para crema son ilegibles sobre oscuro). En líneas de encuesta el crosshair SNAPEA al año con dato (nunca interpolar valores; el año de la medición vecina va en gris). La capa de captura del crosshair jamás encima de los elementos interactivos (`pointer-events:none` + escuchar en el `<svg>`).
- **Mobile interactivo** (≠ del PNG): la vista entra sin scroll ni desborde horizontal (~320 px útiles), nota de fuentes a ancho completo, SVG con `max-height`, controles con `flex-wrap`, y re-render al cambiar la clase de viewport (registrar `__atlasRedraw`).

## Textos (criterio OWID: tres capas)

- **Título = el hallazgo** ("insight"), solo en el estado por default; apenas el lector cambia selección, filtro, período o categoría pasa al **neutral/descriptivo** que nombra la MEDICIÓN (los toggles de escala no neutralizan; el hover tampoco). El custom del editor gana siempre. Nada de clichés ("rompen el techo", "la gran X", grandilocuencia) ni de nombres internos de instrumento ("la batería", V-Dem, IVS) en títulos visibles.
- **Subtítulo = qué se mide, con qué unidad y cuándo**, autosuficiente (viaja solo al PNG y a las tarjetas): "Coeficiente de Gini frente al PIB per cápita, en US$ ajustados por poder adquisitivo. 2025." El período refleja el estado (slider recortado → ", nacidas 1800–2021."); el rango de años se CALCULA del dato real de campo, no de la etiqueta nominal de la ola. "Cada punto es un país" describe la marca, no la medición: va en la nota.
- **Nota (fuentes) = la letra chica**, en la página completa; **el caption del PNG es UNA línea** ("Datos: …" + período/parámetros dinámicos) vía `onBeforePngExportGetSourceText` — sin metodología larga, sin códigos de pregunta, sin avisos sobre controles que en la imagen no existen. La frase de fuente debe ser EXACTAMENTE verdadera para la base publicada. Nunca mencionar archivos internos en texto visible.
- **Tarjeta/OG**: el título del card es la PREGUNTA que el gráfico responde, entendible sin haber leído el newsletter y cierta en cualquier vista. La bajada dice qué puede hacer el lector + fuente y años. Card en inglés = landing `-en.html` propia (los crawlers no ejecutan JS ni leen `?lang`), que conserva los parámetros al redirigir; la página ES la declara con `<link rel="alternate" hreflang="en">`.
- **Marca**: barra superior "EL ATLAS · TÓPICO" (marca → home del sitio; tópico → índice de la entrega). El número de entrega no aparece en ningún texto visible al lector (solo ordena el índice raíz).
- **Escritura sin tics de IA**: guiones largos y dos puntos al mínimo, sin muletillas ("Ojo:", "Un dato para arrancar"), sin adjetivos de sentencia.

## Componentes únicos (copiar, jamás redefinir por página)

- **Paleta**: `lib/theme.js` + `var(--…)` de `lib/style.css` para el chrome. Series multiserie: la paleta estándar Atlas de 12. Terracota `#BE5D32` = SIEMPRE América Latina / CONMEBOL. Prohibido inventar paletas por chart. En SVG los colores van hardcodeados (literales), copiados de estas paletas.
- **Buscador de países**: `.m-search-wrap/-input/-results` + JS del patrón explora/podios: acento-insensible, máx. 8 resultados con la región en gris, flechas/Enter/Escape, click-afuera, `.m-already` para los ya elegidos, excluir códigos sin metadata. Nunca `<input list>` nativo.
- **Chips de selección**: `.m-selected-chip` con **fondo del color de la región** y ✕ blanca — una sola estética en todo el sitio, ninguna página los redefine. La ✕ saca de a uno; botón **Limpiar** universal (se engancha solo a cualquier contenedor cuyo id termine en `-selected-chips`), visible con 2+ chips; los defaults NO resucitan al vaciar; agregados ("Mundo") son chips como cualquiera, y en single-select el piso va sin ✕. El realce editorial (Latam agrandada/etiquetada) se desinfla apenas alguien elige países — también si elige desde el editor.
- **Slider de período universal** (todo filtro inicio/fin): doble range superpuesto + cajitas numéricas compactas (60 px; 76–92 px si el placeholder es texto), **cajita vacía = extremo** (el placeholder muestra la etiqueta del extremo), escala por tramos si la historia es larga, snap en `change`, debounce en charts pesados. Copiar de `05-pantheon/evolucion.js`.
- **Nombres de país**: los datasets llevan CÓDIGOS; los nombres se resuelven CN-first con `lib/country-names.js` (fallback al par local solo si el código no está). Naciones raras nuevas se agregan a la lib, no se traducen a mano en el dato. Un mismo país jamás bajo dos códigos: canonizar al leer, antes de agrupar.
- **Grapher multi-vista** (`lib/grapher.js`): la selección viaja entre pestañas, pero cada vista puede declarar su default (`defaultSelection`/`defaultIso`) — 16 líneas no se leen. El default vive en el HTML (`defaultSelection`) Y en la constante del motor: deben coincidir o el título editorial no aparece nunca. Pasar por una vista sin tocarla no contagia su default.
- **Marimekkos**: peor valor a la izquierda; **ninguna etiqueta se descarta** (ancho de colisión = alto de línea, tres pasadas, guías escalonadas — motor del N°4); la línea mundial y la tabla regional muestran el MISMO estadístico (toggle Mediana/Promedio); la tabla regional se mide con la fuente real y se ancla a la derecha (flota en el hueco o baja como bloque).
- **Mapas**: un solo motor por familia (variantes vía adapter, no clones); proyección Robinson propia sin CDN; sin Antártida; bordes estilo OWID (stroke gris cálido por país, sin contorno de costa); leyenda cuyo alto se calcula de las filas reales (nunca un y0 fijo: la fila "Sin dato" se corta); "más oscuro = peor" aunque la variable apunte al revés; en animación, escala FIJA por variable y repintado de fills (no redibujo). El geo de 2 MB se carga diferido al abrir la vista (`atlasEnsureGeo`).
- **Líneas de encuesta**: marcadores solo donde hay medición (series anuales densas van sin marcadores); series que empiezan tarde arrancan con borde vertical (trim de bins vacíos). Los listeners colgados del `<svg>` sobreviven a `innerHTML=''`: guardar referencias y quitarlos en cada draw (o token de render).

## PNG de descarga (resumen; el calibre fino está en la skill)

- **Mobile-first**: el PNG se lee a ~⅓ en el celular → todo sobredimensionado. Cuadrado 1200×1200 por default; mapas → apaisado `worldmap` 1200×920 o alto dinámico (`__atlasPngDynamicHeight`). Calibre de la casa: título 52 Source Serif 4 bold / subtítulo 32 Source Serif 4 **itálica** / ticks ~22 / labels ~26 / firma en dos renglones terracota. Plot ≥72% del lienzo, margen derecho ≤20% (labels largos → dos líneas, nunca inflar el margen).
- **viewBox del cuadrado**: `W = vbW; H = square ? 910 : newsletter ? 860 : f.vbH` (convención 03b). Un viewBox 1100×1100 en el box útil (~1116×900) escala a 0,86 y achica toda la tipografía.
- **En el SVG solo literales, jamás `var()`**: los charts se abren por `file://` y ahí el CSS embebido no viaja — `var(--sans)` cae a serif, el halo desaparece. Font stack literal: `"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- **Leyendas dentro del SVG** (el export rasteriza el SVG, no el HTML). Los estadísticos de scatters (R², n, residuo) viven SOLO en el banner HTML: el PNG va sin ellos.
- **Imágenes en el canvas** (retratos, etc.): siempre mismo origen (carpeta del repo) — el hotlink muere por CORS/antivirus. Por `file://` el canvas puede quedar vedado: reintentar sin imágenes y descargar igual (nunca morir en silencio); círculo placeholder neutro donde falte una foto.
- **Hooks**: `onBeforePngExportGetSourceText/GetSubtitle/GetTitle/Prepare/Restore/GetExtraGap/GetSourceLayout`. `GetSourceText` es UN global: en páginas multi-vista cada vista ENCADENA con el hook anterior. El texto custom del editor gana sobre todos los hooks.
- **Registro**: `__atlasSupportsFormats = true`, `__atlasRedraw = drawX`, `__atlasDefaultPngFormat = 'worldmap'` si es mapa.
- **Verificación**: mirar el PNG REAL (capturar el canvas, decodificar, verlo) y ponerlo AL LADO de un export ya aprobado comparando proporciones. "Los bytes dan bien" no es verificación; "el código es correcto" tampoco.

## Checklist de integración de un chart nuevo

Cada ítem se olvidó al menos una vez:

- [ ] Entrada en `FILENAMES` de `lib/png-export.js` (ES **y** EN, nombre descriptivo, no `chart-N` genérico)
- [ ] Thumbs ES + EN en `thumbs/` con el nombre que espera el index, y `og:image`/`twitter:image` válidos (páginas no publicadas: tarjeta de texto, sin og:image roto)
- [ ] Tarjeta en el index (ES y EN) + entrada en `nav.js` (+ contadores y strings que enumeran charts) + `charts.json`
- [ ] Landing `-en.html` con OG en inglés que conserva parámetros
- [ ] `i18n-issue.js` completo en ambos idiomas (barrer los `data-i18n` contra el diccionario)
- [ ] CSV + PNG + URL compartible + editor + touch, según el contrato de arriba
- [ ] `?v=` unificado con el resto de la carpeta

## Disciplina

- **Cache-busting: UNA versión global por carpeta** (`?v=N` idéntico en todas las páginas del número; las libs llevan la suya). Bumpear en CADA edición de un `.js` — sin bump, el fix no le llega a nadie y "no funciona". Ningún `<script>`/`<link>` sin `?v=`.
- **El entorno real es `file://`** (doble clic en el .html): todo lo verificado solo por `http://localhost` puede mentir (fuentes, CORS, fetch).
- **Cuando muchas iteraciones no resuelven**: instrumentar con `console.log` y pedir el output del navegador real, en vez de seguir parchando a ciegas.
- **Al regenerar datos**: verificar que el cambio sea quirúrgico (diff contra HEAD; lo que no debía cambiar, byte a byte idéntico), y subir el `?v=` de cada `data-*.js` tocado.
- El N°5 usa copias locales de `utils.js`/`png-export.js` (deuda conocida, igualadas a lib); los charts nuevos usan `lib/` directamente.
