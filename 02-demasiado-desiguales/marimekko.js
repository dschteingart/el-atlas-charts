// =============================================================
//  marimekko.js — chart 1 del N°2 "Demasiado desiguales"
// =============================================================
//
// Ranking marimekko de coeficiente de Gini por país, ordenado desc.
// Cada barra es un país (ancho igual), coloreada por región (7 regiones BM).
//
// Features:
//   - Toggle Gini original (raw) / Gini ajustado (consumo × 1.13).
//   - Slider temporal 2000-2024 con botón play (~8 seg recorrido completo).
//   - Hover sobre chip de región: atenúa otras + muestra línea vertical
//     punteada con el promedio simple regional, posicionada en el ranking
//     como si fuera un país (entre los dos países que la rodean en valor).
//   - Anti-colisión greedy para etiquetas de país (lista de prioridad +
//     extremos del ranking).
//   - Para PNG export: todas las 7 líneas regionales visibles
//     simultáneamente (hook onBeforePngExport).
//
// Depende de: DATA_MARIMEKKO, REGION_WB_ORDER, REGION_WB_COLORS,
// REGION_WB_LABEL_COLORS, LANG, t, state[1].

// =================== Constantes ===================
// Dimensiones desktop default (cuando NO hay formato del editor activo).
// En mobile interactivo (≤768px sin editor) el render usa viewBox portrait
// alto (1100×1500) cuyo aspect ratio (≈0.73) matchea el container portrait
// (≈412×540, ratio ≈0.76). Sin esto, preserveAspectRatio="xMidYMid meet"
// dejaba bandas de ~250-300px arriba/abajo.
//
// Cuando hay un formato del editor activo (newsletter / square / mobile /
// public), las dimensiones vienen de PNG_FORMATS[format] en utils.js. La
// función m_getMargins(format) devuelve los margins ajustados a cada
// viewBox. El PNG export rasteriza el SVG visible — no fuerza re-render.
const M_W_DESKTOP = 1100, M_H_DESKTOP = 470;
const M_W_MOBILE  = 1100, M_H_MOBILE  = 1500;
// Top: 50px para 2 filas de labels de promedio regional con anti-colisión.
// Bottom: 110px — espacio para callout (palito o S) + texto rotado bajo el
// eje X. El texto se proyecta hasta yAnchor + ~0.707*textW; textos típicos
// de los priority (~80px) ocupan ~57px hacia abajo desde yAnchor=414.
const M_MARGIN_DESKTOP = { top: 50, right: 32, bottom: 110, left: 56 };
// Mobile interactivo (≤768px sin editor): plot tres veces más alto que
// desktop → margins escaladas acorde. La tabla regional NO se renderea en
// SVG (va como HTML colapsable).
//   - top 110: separa el eje del título sin bandas excesivas.
//   - left 130: tick labels Y escalados (32px SVG) necesitan más ancho.
//   - bottom 200: más espacio bajo el eje para callouts + texto rotado a
//     32px (font 32 + diagonal proyectada ≈ 90-110px de huella vertical).
//   - right 30: mínimo para que las barras de Gini bajo no toquen el borde.
// Plot area = 1500 - 110 - 200 = 1190px (~79% del viewBox).
const M_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 200, left: 130 };

// Margins por formato del editor (cuando el editor está activo).
// Iterables si encontramos problemas geométricos al cambiar de formato.
// Si format=null o desconocido → usar margins desktop default.
function m_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 50, right: 32, bottom: 130, left: 56 };
    case 'newsletter': return { top: 60, right: 30, bottom: 220, left: 70 };
    case 'square':     return { top: 60, right: 30, bottom: 260, left: 70 };
    // mobile: top reducido (40) — el formato mobile NO renderea tabla
    // regional dentro del SVG (va abajo del chart como HTML colapsable),
    // así que la zona superior solo necesita espacio para el título del
    // eje Y. Con top=100 quedaba una banda blanca grande arriba en el PNG
    // mobile (entre el subtítulo y la primera barra). bottom 300 se
    // mantiene para que los callouts y textos rotados respiren.
    case 'mobile':     return { top: 40,  right: 30, bottom: 300, left: 100 };
    default:           return { ...M_MARGIN_DESKTOP };
  }
}

// Constantes "live" — se reasignan en cada drawMarimekko según el viewport
// activo (editor format > mobile responsive > desktop default).
let M_W = M_W_DESKTOP, M_H = M_H_DESKTOP;
let M_MARGIN = { ...M_MARGIN_DESKTOP };

// Configuración del algoritmo de etiquetas estilo OWID.
//
// Reglas:
//   1. Texto rotado -45°: la primera letra (anclaje tx, ty) queda abajo-
//      izquierda y la última arriba-derecha (diagonal subiendo).
//   2. TODAS las etiquetas se anclan a la misma altura Y_LABEL_ANCHOR
//      (sin multi-row de etiquetas — el texto siempre arranca al mismo Y).
//   3. Línea guía:
//      a. Si la etiqueta cabe centrada sobre su barra: callout vertical
//         puro (palito recto desde la base de la barra hasta el texto).
//      b. Si no cabe (colisiona con etiqueta vecina): "S" o "Z" con tres
//         segmentos rectos — V corto desde la base de la barra hasta una
//         altura intermedia (bendY), H horizontal hasta x=tx, V final
//         hasta el ancla del texto. Los tres segmentos son variables.
//   4. Para evitar que las S se crucen entre sí, hay M_BEND_ROW_COUNT
//      filas de bend disponibles. Cada etiqueta con displacement toma la
//      fila más baja (cerca del eje X) cuyos H y V no choquen con S ya
//      colocadas. Las labels con poco displacement caen en filas bajas;
//      las que se desplazan mucho terminan en filas altas (cerca del
//      anchor de texto).
//   5. Greedy left→right por barX, sin movimiento a la izquierda
//      (preserva orden). Para seleccionadas que no entran, la patita
//      puede extenderse fuera del plot a la derecha.
const M_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const M_LABEL_FONT_SIZE = 10;
// Mobile: 28px en unidades SVG. Con viewBox 1100 → render ≈412px de ancho,
// el factor de escala SVG→pantalla es ~0.375, así que 28×0.375 ≈ 10.5px
// de tamaño efectivo en pantalla (legible para labels rotadas).
const M_LABEL_FONT_SIZE_MOBILE = 28;
const M_LABEL_ANCHOR_Y_OFFSET = 50;   // distancia eje X → fin de línea guía
// Mobile: con plot 3× más alto y font SVG 3× más grande, el callout
// también precisa más espacio bajo el eje para que la patita respire y
// las labels rotadas no se pisen entre sí.
const M_LABEL_ANCHOR_Y_OFFSET_MOBILE = 90;
const M_BEND_ROW_COUNT = 5;
const M_BEND_ROW_GAP = 8;             // separación vertical entre filas de bend
const M_BEND_ROW_OFFSET = 6;          // distancia eje X → primera fila de bend
const M_LABEL_MIN_GAP_X = 5;          // gap mínimo entre huellas horizontales
const M_CALLOUT_PAD = 2;              // separación mínima entre segmentos de callouts distintos
// Piso del auto-ajuste de fuente de las etiquetas de país: si a la fuente del
// formato no entran todas en el ancho, se achica lo justo pero NUNCA por debajo
// de esto (para que sigan legibles). Debajo, se acepta que se aprieten.
const M_LABEL_MIN_FONT = 14;
// Plot area: recalculado al inicio de cada drawMarimekko() (depende de
// M_W/M_H/M_MARGIN que cambian según viewport).
let M_PLOT_W = M_W - M_MARGIN.left - M_MARGIN.right;
let M_PLOT_H = M_H - M_MARGIN.top - M_MARGIN.bottom;
const M_Y_MIN = 0;
const M_Y_MAX_DESKTOP = 75;
// Portrait (mobilePng): el max real del dataset ronda ~63 (Sudáfrica) y
// los ticks visibles van hasta 60. Con max=75 quedaba ~20% de banda
// blanca arriba del gráfico (entre la barra más alta y el techo del
// plot) que en el PNG vertical se ve como un hueco grande entre el
// subtítulo y las barras. max=65 deja headroom mínimo para outliers
// (Sudáfrica ~63 año peor) sin desperdiciar alto — antes 68 dejaba
// ~17% de plot vacío arriba, ahora ~3%.
const M_Y_MAX_PORTRAIT = 65;
// M_Y_MAX se reasigna en drawMarimekko según el formato activo.
let M_Y_MAX = M_Y_MAX_DESKTOP;
const M_Y_TICKS = [0, 10, 20, 30, 40, 50, 60, 70];
// Mobile: subset más legible — 4 ticks redondos. El plot es más alto
// pero el eje sigue dando lecturas inmediatas (0/20/40/60).
const M_Y_TICKS_MOBILE = [0, 20, 40, 60];

// Selección por default: los países que vienen YA tildados (chips) al cargar.
// Modelo unificado (ver más abajo): los chips SON las etiquetas. Esta lista es
// el set curado que aparece como chips + callouts por default; el usuario los
// saca o agrega y el PNG exporta exactamente lo que ve. Spread editorial:
// extremos (Namibia arriba, Eslovaquia abajo) + protagonistas Latam + economías
// de referencia. ~8 → legibles en cuadrado a ⅓ en el celu.
const M_DEFAULT_SELECTION = ['NAM', 'COL', 'BRA', 'ARG', 'USA', 'CHN', 'DEU', 'SVK'];

// Helper: devuelve el nombre del país en el idioma activo, usando el
// diccionario COUNTRY_NAMES (en country-names.js). Fallback al name que
// venga del dataset si el iso3 no está cargado.
function m_displayName(d) {
  return (COUNTRY_NAMES[d.code]?.[LANG]) || d.name;
}

const M_SVG_NS = 'http://www.w3.org/2000/svg';
const m_ns = (tag) => document.createElementNS(M_SVG_NS, tag);

// =================== Helpers ===================
function m_yScale(g) {
  return M_MARGIN.top + M_PLOT_H - (g - M_Y_MIN) / (M_Y_MAX - M_Y_MIN) * M_PLOT_H;
}

// Devuelve la posición X "intercalada en el ranking" donde encajaría el
// valor `val` dentro del array sorted por valKey desc.
function m_rankPositionX(sorted, valKey, val, barWidth) {
  // Busca el primer índice donde sorted[i][valKey] < val.
  let i = 0;
  while (i < sorted.length && sorted[i][valKey] >= val) i++;
  // i es donde va "entre" la barra i-1 y la barra i.
  return M_MARGIN.left + i * barWidth;
}

// Helper: medir ancho de texto reusando un canvas en memoria.
function m_measureText(text, fontSize) {
  if (!m_measureText._ctx) {
    m_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  m_measureText._ctx.font = `500 ${fontSize}px "Source Sans 3", sans-serif`;
  return m_measureText._ctx.measureText(text).width;
}

// Algoritmo de etiquetas estilo OWID. Devuelve array de objetos
// {tx, ty, bendY, displaced, barX, text, color, isSelected, ...} con la
// info necesaria para dibujar el callout (palito o S) + texto rotado.
//
// Modelo unificado: las etiquetas son EXACTAMENTE los países seleccionados
// (chips). No hay "priority" aparte ni extremos forzados — lo que está en los
// chips es lo que se etiqueta, y el PNG exporta lo mismo (WYSIWYG). El default
// viene con un set curado ya tildado (M_DEFAULT_SELECTION, aplicado en init).
function m_layoutCountryLabels(sortedData, barWidth, plotArea, selectedCodes, editorCodes) {
  const present = new Set(sortedData.map(d => d.code));
  // Fuente de labels: la lista del editor si está activa (Array.isArray
  // distingue [] = "no mostrar labels" de null/undefined = editor inactivo),
  // si no, la selección de chips del chart.
  const codesToShow = Array.isArray(editorCodes)
    ? new Set(editorCodes.filter(c => present.has(c)))
    : new Set((selectedCodes || []).filter(c => present.has(c)));

  // Detectar formato del editor (controla todo cuando está presente).
  const editorFormat = typeof getActivePngFormat === 'function'
    ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const publicFmt  = editorFormat === 'public';
  // mobile interactivo solo si no hay formato del editor activo y el
  // browser está en viewport pequeño. El editor controla todo cuando
  // tiene un format seleccionado.
  const mobile = !editorFormat
    && typeof isMobileViewport === 'function' && isMobileViewport();
  const angle = M_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);  // ambos ≈ 0.707
  // Si el editor proveyó un override de slider "labels", lo respetamos
  // SOBRE el default del formato. Esto permite a Daniel ajustar el tamaño
  // de las etiquetas de país sin importar el formato elegido.
  const aeCfg2 = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeLabelSize = aeCfg2?.sizes?.labels;
  const fmtDefaultFontSize = newsletter ? 16
    : square ? 24
    : mobilePng ? 26
    : mobile ? M_LABEL_FONT_SIZE_MOBILE
    : M_LABEL_FONT_SIZE;
  const fontSize = aeLabelSize ?? fmtDefaultFontSize;
  // anchorYOffset: distancia eje X → fin de línea guía. En viewports altos
  // (mobile/mobilePng) más espacio para que las labels respiren.
  const anchorYOffset = (mobile || mobilePng)
    ? M_LABEL_ANCHOR_Y_OFFSET_MOBILE
    : M_LABEL_ANCHOR_Y_OFFSET;
  const minGap = M_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + anchorYOffset;       // fin de línea guía
  const yAnchor = yLine + 4;  // pequeño gap entre fin de guía y "a" final

  // === Placement estilo OWID (owid-grapher MarimekkoChart) ===
  // Pasos:
  //   1. Anchors a la fuente del formato.
  //   2. Auto-ajuste con PISO legible: si a esa fuente no entran todas en el
  //      ancho, se achica lo justo (nunca por debajo de M_LABEL_MIN_FONT) para
  //      que entren TODAS sin que ninguna se salga del borde.
  //   3. Barrido 1D de DOS pasadas (como OWID): reparte el texto a lo ancho.
  //   4. Codos escalonados POR GRUPO (OWID markerStepSize): cada cluster de
  //      etiquetas corridas reparte la altura de su codo parejo, así los tramos
  //      horizontales no se apilan.

  // 1. Anchors. tx = ancla derecha del texto (rotado -45°, se proyecta a la
  //    izquierda; footprint horizontal [tx - projW, tx]).
  const ordered = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.code)) return;
    const text = m_displayName(d);
    const textW = Math.max(22, m_measureText(text, fontSize));
    const projW = cos * textW + sin * fontSize + 2;
    ordered.push({
      code: d.code, text,
      color: REGION_WB_LABEL_COLORS[d.region] || '#555',
      barX: plotArea.left + i * barWidth + barWidth / 2,
      textW, projW
    });
  });
  ordered.sort((a, b) => a.barX - b.barX);
  const n = ordered.length;
  if (n === 0) return { labels: [], fontSize };

  // 2. Auto-ajuste con PISO LEGIBLE. La fuente del formato es fija; SOLO si a ese
  //    tamaño las etiquetas no entran en el ancho (suma de huellas + gaps >
  //    ancho disponible) la achicamos lo justo para que entren TODAS — pero
  //    nunca por debajo de un piso legible (M_LABEL_MIN_FONT). Así ninguna se
  //    sale del borde (lo que cortaba a India y las de la derecha) y tampoco
  //    quedan ilegibles. projW escala ~lineal con la fuente. Con ~8 no se
  //    dispara (24px); con ~13 baja a ~17px.
  const availW = rightBound - leftBound;
  let effFont = fontSize;
  const totalAt = () => ordered.reduce((s, a) => s + a.projW, 0) + (n - 1) * minGap;
  if (totalAt() > availW) {
    effFont = Math.max(M_LABEL_MIN_FONT, fontSize * (availW / totalAt()) * 0.97);
    ordered.forEach(a => {
      a.textW = Math.max(22, m_measureText(a.text, effFont));
      a.projW = cos * a.textW + sin * effFont + 2;
    });
  }

  // 3. Barrido 1D de dos pasadas: izq→der empuja cada texto para no pisar la
  //    huella del anterior (arrancando en leftBound → no se sale por la
  //    izquierda); der→izq clampea al rightBound → no se sale por la derecha.
  //    Con el auto-ajuste, todas entran; sin borde cortado en ningún caso.
  let acc = leftBound;
  ordered.forEach(a => { a.tx = Math.max(a.barX, acc + a.projW); acc = a.tx + minGap; });
  let lim = rightBound;
  for (let i = n - 1; i >= 0; i--) { const a = ordered[i]; if (a.tx > lim) a.tx = lim; lim = a.tx - a.projW - minGap; }

  // 4. Codos escalonados por grupo. Un grupo = corrida de etiquetas CORRIDAS
  //    consecutivas cuyos brackets se solapan en x. Dentro del grupo, la altura
  //    del codo se reparte parejo en la franja del marker (altura/(grupo+1)); la
  //    más a la izquierda queda más abajo (cerca de las etiquetas) para
  //    minimizar cruces. Las no-corridas van con palito recto (bendY null).
  ordered.forEach(a => { a.displaced = Math.abs(a.tx - a.barX) > 0.5; });
  const markerTop = plotArea.bottom + 3;
  const markerBot = yLine - 3;
  const groups = [];
  let g = null;
  ordered.forEach(a => {
    if (!a.displaced) { g = null; return; }
    const x1 = Math.min(a.barX, a.tx), x2 = Math.max(a.barX, a.tx);
    if (g && x1 <= g.maxX2 + minGap) { g.items.push(a); g.maxX2 = Math.max(g.maxX2, x2); }
    else { g = { items: [a], maxX2: x2 }; groups.push(g); }
  });
  groups.forEach(grp => {
    const k = grp.items.length;
    const step = (markerBot - markerTop) / (k + 1);
    grp.items.forEach((it, i) => { it.bendY = markerBot - (i + 1) * step; });
  });

  const toDraw = ordered.map(a => ({ ...a, ty: yAnchor, yLine, bendY: a.displaced ? a.bendY : null }));
  return { labels: toDraw, fontSize: effFont };
}

// =================== Render principal ===================
function drawMarimekko() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';

  // Editor hook: si el sidebar editorial está activo, leemos su config.
  // Aplicamos overrides de SIZES (font-sizes), texts (título/subtítulo/
  // caption) y countries (lista de iso3 a etiquetar reemplazando los
  // priority defaults). El editor.js carga ANTES que este script, así que
  // window.AtlasEditor ya existe; getConfig() devuelve null si el editor
  // nunca se montó (ej. en index.html sin data-editor-id).
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg?.sizes;
  // Cuando el editor está activo, su lista de countries manda como fuente de
  // etiquetas — incluso si está vacía ([] = "no mostrar ningún label", elección
  // explícita). Si el editor NO está activo (versión pública), las etiquetas
  // salen de la selección de chips del chart (state[1].selectedCountries, que
  // viene con el set curado por default).
  const aeCountries = aeCfg
    ? (aeCfg.countries || [])
    : null;

  // Decidir dimensiones según el formato del editor (si está activo) o
  // según el viewport del browser (sin editor activo). Tres situaciones:
  //
  //   1. Editor activo con formato → viewBox de PNG_FORMATS[format] +
  //      margins de m_getMargins(format). El SVG en pantalla se ve con
  //      el aspect ratio del formato (gracias al wrapper .ae-format-
  //      wrapper que setea aspect-ratio en CSS). El PNG export rasteriza
  //      exactamente esto. WYSIWYG.
  //
  //   2. Sin editor activo + mobile (≤768px): viewBox 1100×1500 portrait,
  //      sin tabla regional (HTML colapsable abajo del chart).
  //
  //   3. Sin editor activo + desktop: viewBox 1100×470 landscape (default).
  //
  // El editor controla TODO cuando tiene un format. isMobileViewport() se
  // ignora — no hay "responsive mobile" si el editor decide newsletter.
  const editorFormat = typeof getActivePngFormat === 'function'
    ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const publicFmt  = editorFormat === 'public';
  const mobile = !editorFormat
    && typeof isMobileViewport === 'function' && isMobileViewport();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    M_W = f.vbW; M_H = f.vbH;
    M_MARGIN = m_getMargins(editorFormat);
  } else if (mobile) {
    M_W = M_W_MOBILE; M_H = M_H_MOBILE;
    M_MARGIN = { ...M_MARGIN_MOBILE };
  } else {
    M_W = M_W_DESKTOP; M_H = M_H_DESKTOP;
    M_MARGIN = { ...M_MARGIN_DESKTOP };
  }
  // Y max por formato: mobilePng (formato del editor, 800×1200 vertical)
  // usa M_Y_MAX_PORTRAIT — apenas por encima del data max — para que las
  // barras llenen el plot vertical y no quede una banda blanca grande entre
  // el techo del plot y la barra más alta. Mobile interactivo (sin editor)
  // y desktop siguen en 75 para no cambiar la versión pública.
  M_Y_MAX = mobilePng ? M_Y_MAX_PORTRAIT : M_Y_MAX_DESKTOP;

  // === Bottom margin dinámico (P A) ===
  // El bottom default de cada formato (m_getMargins) era una conjetura
  // estática. Si Daniel tilda un país con nombre largo (ej. "República
  // Centroafricana") la huella vertical del texto rotado a -45° excede el
  // bottom estático y queda cortado.
  //
  // Algoritmo: simular el subset de labels que va a renderearse, calcular
  // la máxima huella proyectada (sin45 × textW + descender), y agrandar
  // M_MARGIN.bottom para que entre cómodo. Aplica SOLO cuando hay editor
  // format activo (public/newsletter/square/mobile del editor) o mobile
  // responsive. La versión pública sin editor (desktop default) mantiene
  // el M_MARGIN_DESKTOP histórico — no queremos que el layout cambie en
  // /index.html ni en chart-1.html sin editor.
  if (editorFormat || mobile) {
    const sin45 = Math.SQRT1_2;
    // SIZES.label aún no está computado en este punto del flujo —
    // reproducimos la fórmula (FMT_SIZES.label salvo override del editor).
    const fmtLabelDefault = newsletter ? 16
      : square ? 24
      : mobilePng ? 26
      : publicFmt ? 11
      : mobile ? M_LABEL_FONT_SIZE_MOBILE
      : M_LABEL_FONT_SIZE;
    const labelFontSize = aeSizes?.labels ?? fmtLabelDefault;
    const aOff = (mobile || mobilePng)
      ? M_LABEL_ANCHOR_Y_OFFSET_MOBILE
      : M_LABEL_ANCHOR_Y_OFFSET;
    // Subset que va a etiquetarse: las MISMAS chips que m_layoutCountryLabels
    // (selección del chart, o lista del editor si está activa). Necesitamos los
    // mismos códigos para calcular requiredBottom antes de fijar M_PLOT_H.
    // Inlineamos state[1] porque s1 se declara más abajo en drawMarimekko.
    const s1pre = state[1] || { mode: 'raw', year: 2024, selectedCountries: [] };
    const data0 = DATA_MARIMEKKO.data_by_year[String(s1pre.year)] || [];
    const valKey0 = s1pre.mode === 'raw' ? 'gini_raw' : 'gini_adj';
    const sorted0 = [...data0].sort((a, b) => b[valKey0] - a[valKey0]);
    const present0 = new Set(sorted0.map(d => d.code));
    const codesToShow0 = Array.isArray(aeCountries)
      ? new Set(aeCountries.filter(c => present0.has(c)))
      : new Set((s1pre.selectedCountries || []).filter(c => present0.has(c)));
    let maxTextW = 0;
    sorted0.forEach(d => {
      if (!codesToShow0.has(d.code)) return;
      const txt = m_displayName(d);
      const w = Math.max(22, m_measureText(txt, labelFontSize));
      if (w > maxTextW) maxTextW = w;
    });
    if (maxTextW > 0) {
      // Huella vertical del texto rotado -45°: yAnchor + sin45 × (textW +
      // descender). Descender ~ 0.3 × fontSize.
      //
      // safety = colchón EXTRA bajo el último pixel del texto y la base del
      // viewBox del SVG. Subido de 16 → 30 SVG units para que las etiquetas
      // queden bien adentro del SVG: en png-export.js el canvas pinta la
      // leyenda regional justo después del bottom del SVG rasterizado
      // (gapAfterSvgBase=4). Sin colchón generoso, en formatos donde
      // scaleY<1 (mobile vbH=1650 → scaleY≈0.55) los 16 SVG units se
      // proyectan a solo ~9 canvas-px, y los nombres colgantes terminan
      // visualmente pegados a los chips de la leyenda. Con 30 → 17-32 canvas-
      // px de buffer dentro del SVG según el formato. Combinado con el
      // extraGapBelowSvg que el hook abajo le pide a png-export, garantizamos
      // ≥30 canvas-px de separación visible entre la última letra del país
      // y el primer puntito de la leyenda en los 4 formatos del editor.
      const projVert = sin45 * (maxTextW + labelFontSize * 0.3);
      const safety = 30;
      const requiredBottom = aOff + 4 + projVert + safety;
      if (M_MARGIN.bottom < requiredBottom) {
        M_MARGIN.bottom = Math.ceil(requiredBottom);
      }
    }
  }

  M_PLOT_W = M_W - M_MARGIN.left - M_MARGIN.right;
  M_PLOT_H = M_H - M_MARGIN.top - M_MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${M_W} ${M_H}`);
  // Aplicar/quitar wrapper CSS según el formato del editor.
  if (typeof applyFormatWrapper === 'function') {
    applyFormatWrapper(svg, editorFormat);
  }

  // Font sizes en unidades SVG. En mobile interactivo el SVG se escala a
  // ~412px de ancho en pantalla (factor ≈0.375), así que multiplicamos los
  // tamaños por ~3 para que el render efectivo en pantalla quede en 9-13px.
  // Sin esto los textos en mobile salen a ~3.6-4px (ilegibles).
  // Estos overrides ganan sobre los font-size de los CSS classes porque
  // se aplican inline (attribute font-size).
  //
  // Cuando el editor está activo con un formato, el SVG se ve en pantalla
  // con el aspect ratio del formato (no escalado a mobile viewport) — los
  // sizes son los que tunean newsletter/square/mobilePng/public. WYSIWYG:
  // el PNG rasteriza el SVG exactamente como se ve.
  //
  // SIZES base por viewport. En desktop el editor puede sobreescribir cada
  // bucket (ticks/labels/axisTitle/special) vía el panel; los formatos
  // newsletter, square, mobilePng y public se mantienen pinned a sus
  // valores tuneados (el editor sirve para afinar desktop default y para
  // elegir formato — los sizes del formato son fijos).
  // Defaults por formato: el editor PUEDE sobreescribir cada bucket vía los
  // sliders (ticks/labels/axisTitle/special). Si el slider está en su default
  // de DEFAULT_SIZES, sale el valor pinned al formato; si Daniel mueve el
  // slider, su valor gana — incluso en newsletter/square/mobilePng/public.
  // Esto asegura que el slider "Etiquetas país" tenga efecto siempre.
  const FMT_SIZES = newsletter
    ? { tick: 20, axisLabel: 20, label: 16, tableTitle: 20, tableLabel: 20 }
    : square
    ? { tick: 20, axisLabel: 20, label: 24, tableTitle: 20, tableLabel: 20 }
    : mobilePng
    ? { tick: 30, axisLabel: 26, label: 26, tableTitle: 26, tableLabel: 28 }
    : publicFmt
    ? { tick: 14, axisLabel: 13, label: 11, tableTitle: 11, tableLabel: 13 }
    : mobile
    ? { tick: 32, axisLabel: 28, label: 28, tableTitle: 28, tableLabel: 30 }
    : { tick: 11, axisLabel: 10.5, label: M_LABEL_FONT_SIZE, tableTitle: 10, tableLabel: 11 };
  const SIZES = {
    tick:        aeSizes?.ticks     ?? FMT_SIZES.tick,
    axisLabel:   aeSizes?.axisTitle ?? FMT_SIZES.axisLabel,
    label:       aeSizes?.labels    ?? FMT_SIZES.label,
    tableTitle:  aeSizes?.special   ?? FMT_SIZES.tableTitle,
    tableLabel:  aeSizes?.special   ?? FMT_SIZES.tableLabel
  };

  const s1 = state[1];
  const year = String(s1.year);
  const mode = s1.mode;  // 'raw' | 'adj'
  const valKey = mode === 'raw' ? 'gini_raw' : 'gini_adj';
  const data = DATA_MARIMEKKO.data_by_year[year] || [];
  const sortedData = [...data].sort((a, b) => b[valKey] - a[valKey]);
  const n = sortedData.length;
  const barWidth = M_PLOT_W / n;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // === Grid Y + labels ===
  // Desktop: si la grid line atraviesa la zona vertical de la tabla regional
  // (arriba-derecha), la recortamos antes de la tabla para que no la cruce
  // visualmente. La línea del eje (y=0) llega siempre hasta el final.
  // Mobile: NO hay tabla en el SVG, así que las grids van hasta el final.
  // Mobile usa un set reducido de ticks (0/20/40/60) para que se lean a 11px.
  //
  // mobilePng: las coords de la tabla son distintas (más a la izquierda y
  // más alta verticalmente) — usamos las mismas que drawRegionalAvgTable
  // calcula para mobilePng (tableX=520, top=80-10=70, bottom=110+7*56=502).
  const tableTopY = mobilePng ? 70 : (M_TABLE_Y_TITLE - 10);
  const tableBottomY = mobilePng ? 502 : (M_TABLE_Y_FIRST + 7 * M_TABLE_ROW_H);
  const tableLeftX = mobilePng ? 520 : M_TABLE_X;
  // En viewports altos (mobile / mobilePng) usamos un subset reducido
  // de ticks Y para que la grilla no se vea apretada.
  const yTicksToRender = (mobile || mobilePng) ? M_Y_TICKS_MOBILE : M_Y_TICKS;
  // Tabla regional en SVG:
  //   - desktop / public / newsletter / square: arriba-derecha del plot.
  //   - mobilePng: arriba-derecha del plot también, con coords ampliadas
  //     para que entren los nombres a 28pt sin pisar las barras altas de la
  //     izquierda (que solo llegan hasta el medio del ranking).
  //   - mobile interactivo (≤768px sin editor): NO en SVG — se renderea
  //     como HTML colapsable abajo del chart (drawRegionalAvgTableHTML).
  //     El viewport en pantalla es muy chico y la tabla SVG quedaría
  //     ilegible o tapando barras.
  const tableVisible = !mobile;
  yTicksToRender.forEach(tv => {
    const y = m_yScale(tv);
    const line = m_ns('line');
    line.setAttribute('x1', M_MARGIN.left);
    const crossesTable = tableVisible && tv !== 0 && y >= tableTopY && y <= tableBottomY;
    const x2 = crossesTable ? tableLeftX - 10 : M_MARGIN.left + M_PLOT_W;
    line.setAttribute('x2', x2);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('class', tv === 0 ? 'm-axis-line' : 'm-grid-line');
    svg.appendChild(line);
    const tx = m_ns('text');
    tx.setAttribute('x', M_MARGIN.left - 8); tx.setAttribute('y', y + 4);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('class', 'm-tick');
    // Style inline (no attribute) para sobrescribir el font-size del CSS class:
    // los CSS rules ganan a los presentation attributes en SVG.
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = tv;
    svg.appendChild(tx);
  });
  // Label del eje Y. Rotado 90° (leído de abajo hacia arriba) y centrado
  // verticalmente en el plot area. Posicionado a la izquierda del eje (sin
  // pisar los ticks). Esto permite títulos largos ("Coeficiente de Gini")
  // sin que se salgan del SVG.
  // Si el editor define un axisY custom no vacío, lo aplicamos; si no,
  // usamos el default del i18n key c1-axis-y.
  const yLab = m_ns('text');
  const yLabX = M_MARGIN.left - 35;
  const yLabY = M_MARGIN.top + M_PLOT_H / 2;
  yLab.setAttribute('x', yLabX);
  yLab.setAttribute('y', yLabY);
  yLab.setAttribute('text-anchor', 'middle');
  yLab.setAttribute('transform', `rotate(-90, ${yLabX}, ${yLabY})`);
  yLab.setAttribute('class', 'm-axis-label');
  yLab.style.fontSize = SIZES.axisLabel + 'px';
  const customAxisY = (aeCfg?.texts?.[LANG]?.axisY || '').trim();
  yLab.textContent = customAxisY || t('c1-axis-y');
  svg.appendChild(yLab);

  // === Barras ===
  const tooltip = document.getElementById('tooltip1');
  // class m-bars: habilita el dim-por-hover en CSS (al pasar el mouse por una
  // barra, las demás se atenúan; ver chart-1.html). El hover es transitorio y
  // CSS-only — no re-dibuja ni afecta el PNG.
  const barsG = m_ns('g'); barsG.setAttribute('class', 'm-bars'); svg.appendChild(barsG);
  sortedData.forEach((d, i) => {
    const x = M_MARGIN.left + i * barWidth;
    const val = d[valKey];
    const y = m_yScale(val);
    const rect = m_ns('rect');
    rect.setAttribute('x', x + (barWidth - barInner) / 2);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barInner);
    rect.setAttribute('height', M_MARGIN.top + M_PLOT_H - y);
    rect.setAttribute('fill', REGION_WB_COLORS[d.region] || '#888');
    // Atenuación: SOLO por hover de región (transitorio). La selección NO
    // atenúa nada — seleccionar un país muestra su etiqueta (chip = label) y
    // las barras quedan a opacidad plena. (El dim al seleccionar tenía sentido
    // como "spotlight" pero rompía la lectura del resto; el hover de barra
    // —dim de las demás— se hace en CSS, ver chart-1.html.)
    const isSelected = (s1.selectedCountries || []).includes(d.code);
    const isDimmed = s1.activeRegion && s1.activeRegion !== d.region;
    rect.setAttribute('class', 'm-bar' + (isDimmed ? ' m-dim' : '') + (isSelected ? ' m-spotlight' : ''));
    rect.dataset.code = d.code;
    rect.dataset.region = d.region;
    if (HAS_HOVER) {
      // Desktop: tooltip aparece al hover, sigue al cursor, se cierra al
      // salir. El click toggle la selección.
      rect.addEventListener('mouseenter', (e) => m_showTooltip(e, d, tooltip));
      rect.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
      rect.addEventListener('mousemove', (e) => m_positionTooltip(e, tooltip));
      rect.addEventListener('click', () => m_toggleCountrySelection(d.code));
    } else {
      // Mobile: tap muestra el tooltip Y toggle la selección. El tooltip
      // queda visible hasta que el usuario haga tap en otra barra (cambia
      // de tooltip) o en cualquier otro lugar (handler global en document).
      // El stopPropagation evita que el handler global cierre el recién
      // abierto.
      rect.addEventListener('click', (e) => {
        e.stopPropagation();
        m_showTooltip(e, d, tooltip);
        m_toggleCountrySelection(d.code);
      });
    }
    barsG.appendChild(rect);
  });

  // === Etiquetas de país en abanico bajo el eje X (Argendata/OWID style) ===
  // Layout en grilla de hasta M_LABEL_ROW_COUNT filas con detección de
  // colisión por bounding box rotado proyectado. Cada label lleva una
  // línea guía con quiebre que conecta su barra con el texto.
  const labelsG = m_ns('g'); svg.appendChild(labelsG);
  const plotArea = {
    left: M_MARGIN.left,
    right: M_MARGIN.left + M_PLOT_W,
    top: M_MARGIN.top,
    bottom: M_MARGIN.top + M_PLOT_H
  };
  // m_layoutCountryLabels devuelve { labels, fontSize }: el fontSize puede ser
  // menor que SIZES.label si hubo auto-fit (muchas etiquetas) — hay que
  // renderear el texto con ESE tamaño para que matchee el layout.
  const _layout = m_layoutCountryLabels(
    sortedData, barWidth, plotArea, s1.selectedCountries || [], aeCountries
  );
  const placedLabels = _layout.labels;
  const fontSize = _layout.fontSize;
  placedLabels.forEach(l => {
    // Callout (línea guía) estilo OWID: palito vertical recto si el texto quedó
    // sobre su barra; bracket V-H-V (baja, corre horizontal a su fila de altura,
    // baja al texto) si se corrió. Las filas de altura las asigna
    // m_layoutCountryLabels por coloreo de intervalos para que no se apilen.
    const path = m_ns('path');
    path.setAttribute('class', 'm-callout');
    const d = l.displaced
      ? `M ${l.barX},${plotArea.bottom + 1} V ${l.bendY} H ${l.tx} V ${l.yLine}`
      : `M ${l.barX},${plotArea.bottom + 1} V ${l.yLine}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', l.color);
    // Estilo uniforme (todas son chips): línea guía fina y discreta.
    path.setAttribute('stroke-width', '0.7');
    path.setAttribute('stroke-opacity', '0.6');
    path.setAttribute('fill', 'none');
    labelsG.appendChild(path);
    // Texto rotado -45° con text-anchor:end. (tx, ty=yAnchor) es la línea
    // base de la ÚLTIMA letra. La rotación lleva la primera letra hacia
    // abajo-izquierda: primera letra abajo-izquierda, última arriba-
    // derecha (al final de la línea guía, con pequeño gap visual).
    const txt = m_ns('text');
    txt.setAttribute('class', 'm-country-label');
    txt.setAttribute('x', l.tx);
    txt.setAttribute('y', l.ty);
    txt.setAttribute('transform', `rotate(-45 ${l.tx} ${l.ty})`);
    txt.setAttribute('text-anchor', 'end');
    txt.setAttribute('fill', l.color);
    // font-size INLINE (no via setAttribute) porque la regla CSS
    // .m-country-label { font-size: 9.5px } gana sobre el presentation
    // attribute font-size en SVG. Sin inline, el SVG en pantalla y en el PNG
    // se rendereaba a 9.5px (casi invisible al rasterizar 1100×1650 en
    // 800×1200) y el slider "Etiquetas país" no tenía efecto.
    txt.style.fontSize = fontSize + 'px';
    txt.setAttribute('font-weight', '500');
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // === Tabla de promedios regionales (arriba-derecha del chart) ===
  // Reemplaza las líneas verticales punteadas que mostraban los promedios
  // de cada región intercalados en el ranking. Ubicada en la zona vacía
  // sobre las barras de la derecha (las de Gini más bajo). Filas ordenadas
  // por promedio descendente. Hover sobre chip de región → fila en bold.
  const regAvg = DATA_MARIMEKKO.regional_avg[year]?.[mode] || {};
  const tableRows = REGION_WB_ORDER
    .filter(reg => regAvg[reg] !== undefined)
    .map(reg => ({
      region: reg,
      color: REGION_WB_COLORS[reg],
      label: t('reg.' + reg),
      value: regAvg[reg]
    }))
    .sort((a, b) => b.value - a.value);

  // Desktop / public / newsletter / square / mobilePng: tabla en SVG.
  // Mobile interactivo (≤768px sin editor): NO en SVG; va como HTML
  // colapsable abajo del chart.
  if (tableVisible) {
    drawRegionalAvgTable(svg, tableRows, s1.activeRegion, SIZES, mobilePng);
  }
  drawRegionalAvgTableHTML(tableRows, s1.activeRegion);

  // Editor overrides de textos editoriales (título/subtítulo/caption).
  // Aplicados POSTrender: applyI18n() sobrescribe estos elementos cada
  // vez que cambia el idioma o el toggle raw/adj, así que el editor
  // tiene que pisarlos después. Strings vacíos = usa el default i18n.
  m_applyEditorTexts(aeCfg);
}

// Aplica los textos custom del editor a título/subtítulo/caption del chart.
// Llamado al final de drawMarimekko (después de que applyI18n y los
// handlers de toggle hayan dejado los textos default).
//
// Caption: si el editor lo dejó vacío (trim) → restauramos el default del
// i18n key c1-sources. Esto permite que el usuario "borre" un caption
// custom y vuelva al automático sin tener que limpiar localStorage.
function m_applyEditorTexts(aeCfg) {
  // LANG es un global de i18n-issue.js (declarado con `let`, no es prop
  // de window). Accedemos por lookup léxico; aeCfg.lang prevalece para los
  // overrides de texto pero el caption default se lee del LANG del DOM.
  const docLang = typeof LANG !== 'undefined' ? LANG : 'es';
  const lang = aeCfg?.lang || docLang;
  const t = aeCfg?.texts?.[lang] || {};
  const block = document.querySelector('.chart-block[data-chart="1"]');
  if (!block) return;
  const customTitle    = (t.title    || '').trim();
  const customSubtitle = (t.subtitle || '').trim();
  const customCaption  = (t.caption  || '').trim();
  if (customTitle) {
    const el = block.querySelector('.chart-title');
    if (el) el.textContent = customTitle;
  }
  if (customSubtitle) {
    const el = block.querySelector('.chart-subtitle');
    if (el) el.textContent = customSubtitle;
  }
  // Caption desktop vive en .footer p[data-i18n="c1-sources"]; en mobile
  // duplicado dentro de un <details>. Si hay caption custom no vacío, lo
  // aplicamos a AMBOS. Si está vacío, restauramos el default del i18n key.
  const captionEls = document.querySelectorAll(
    '.footer p[data-i18n="c1-sources"], .footer details[class*="mobile-collapse"] p[data-i18n="c1-sources"]'
  );
  if (customCaption) {
    captionEls.forEach(el => { el.textContent = customCaption; });
  } else if (typeof I18N !== 'undefined' && I18N[docLang] && I18N[docLang]['c1-sources']) {
    // applyI18n setea innerHTML (el string puede tener <strong>), así que
    // restauramos igual con innerHTML para no perder formatting.
    captionEls.forEach(el => { el.innerHTML = I18N[docLang]['c1-sources']; });
  }
}

// Tabla HTML colapsable (solo visible en mobile vía CSS). Se renderea
// SIEMPRE; el CSS la oculta en desktop. Idempotente — limpia y rebuilds.
function drawRegionalAvgTableHTML(rows, activeRegion) {
  const container = document.querySelector('#m-avg-table-mobile');
  if (!container) return;
  const html = rows.map(row => {
    const isActive = activeRegion === row.region;
    const isDimmed = activeRegion && !isActive;
    const cls = 'm-mt-row'
      + (isActive ? ' m-mt-row-active' : '')
      + (isDimmed ? ' m-mt-row-dimmed' : '');
    return `<div class="${cls}">
      <span class="m-mt-swatch" style="background:${row.color}"></span>
      <span class="m-mt-label">${row.label}</span>
      <span class="m-mt-value">${row.value.toFixed(1)}</span>
    </div>`;
  }).join('');
  container.innerHTML = html;
}

// =================== Tabla de promedios regionales ===================
// Renderiza arriba-derecha del chart. Cada fila: swatch de color + nombre
// de región + valor (Gini promedio). El título arriba dice "PROMEDIO GINI
// POR REGIÓN". La fila correspondiente al activeRegion va en bold 700.
const M_TABLE_X      = 720;   // x_start (izquierda de la tabla)
const M_TABLE_W      = 348;   // ancho total (hasta plotArea.right ≈ 1068)
const M_TABLE_Y_TITLE = 64;   // y de la línea baseline del título
const M_TABLE_Y_FIRST = 84;   // y de la baseline de la primera fila
const M_TABLE_ROW_H  = 16;
const M_TABLE_SWATCH = 9;
const M_TABLE_SWATCH_GAP = 7;

function drawRegionalAvgTable(svg, rows, activeRegion, SIZES, mobilePng) {
  // mobilePng: el viewBox es portrait alto (1100×1650) y la tabla va arriba-
  // derecha, sobre las barras de Gini bajo (que en el ranking del 2024 ocupan
  // la mitad derecha del plot, con tops a y≥620 cuando M_Y_MAX=65). Para
  // que los nombres regionales a 28pt entren sin pisar las barras altas
  // (que están a la izquierda), ampliamos M_TABLE_W y desplazamos el TABLE_X
  // a la izquierda para tener más ancho horizontal. Row height más grande
  // para que el font 28 respire.
  const titleSize = SIZES?.tableTitle;
  const labelSize = SIZES?.tableLabel;
  // Escala TODO proporcionalmente al font de las filas (lo que controla el
  // slider "Tabla regional" en el editor). A labelSize=11 (default) los
  // valores coinciden con los antiguos hardcoded (rowH 16, swatch 9, gap 7).
  // A labelSize=28 (slider al máximo), rowH=40.6 → filas no se encimean.
  // Aplica a TODOS los formatos: pantalla y PNG quedan sincronizados.
  const rowFactor    = 1.45;
  const swatchFactor = 0.82;
  const gapFactor    = 0.64;
  const base = labelSize ?? M_TABLE_ROW_H / rowFactor;  // ~11 si no hay SIZES
  const rowH       = base * rowFactor;
  const swatchSize = base * swatchFactor;
  const swatchGap  = base * gapFactor;
  const yFirst = mobilePng ? 110
               : M_TABLE_Y_FIRST;
  // Posición horizontal/vertical del header de la tabla.
  // mobilePng usa coords propias: arriba-derecha del plot, ancho 540 SVG
  // units (vs 348 default) para alojar "Latinoamérica y el Caribe" a 28pt.
  // tableX=520 deja desde x=520 hasta x=1060, dentro del plot (left=100,
  // right=30) y por encima de las barras de Gini medio-alto (que llegan a
  // y≈620 en x=600 para Gini 36). Sin pisar las barras altas (izquierda).
  const tableX = mobilePng ? 520 : M_TABLE_X;
  const tableW = mobilePng ? 540 : M_TABLE_W;
  const tableYTitle = mobilePng ? 80 : M_TABLE_Y_TITLE;
  const ruleY = mobilePng ? tableYTitle + 12 : M_TABLE_Y_TITLE + 6;
  const g = m_ns('g');
  g.setAttribute('id', 'm-avg-table');
  svg.appendChild(g);

  // Título
  const title = m_ns('text');
  title.setAttribute('class', 'm-table-title');
  title.setAttribute('x', tableX);
  title.setAttribute('y', tableYTitle);
  if (titleSize) title.style.fontSize = titleSize + 'px';
  title.textContent = t('c1-avg-table-title');
  g.appendChild(title);

  // Línea sutil bajo el título
  const rule = m_ns('line');
  rule.setAttribute('class', 'm-table-rule');
  rule.setAttribute('x1', tableX);
  rule.setAttribute('x2', tableX + tableW);
  rule.setAttribute('y1', ruleY);
  rule.setAttribute('y2', ruleY);
  g.appendChild(rule);

  rows.forEach((row, i) => {
    const y = yFirst + i * rowH;
    const isActive = activeRegion === row.region;
    const isDimmed = activeRegion && !isActive;
    const stateClass =
        (isActive ? ' m-table-row-active' : '')
      + (isDimmed ? ' m-table-row-dimmed' : '');

    // Swatch (cuadrito de color) — también se atenúa cuando otra región
    // está activa, para que el contraste con la fila activa sea claro.
    const swatch = m_ns('rect');
    swatch.setAttribute('class', 'm-table-swatch' + stateClass);
    swatch.setAttribute('data-region', row.region);
    swatch.setAttribute('x', tableX);
    swatch.setAttribute('y', y - swatchSize + 1);
    swatch.setAttribute('width', swatchSize);
    swatch.setAttribute('height', swatchSize);
    swatch.setAttribute('fill', row.color);
    g.appendChild(swatch);

    // Nombre región
    const labelEl = m_ns('text');
    labelEl.setAttribute('class', 'm-table-label' + stateClass);
    labelEl.setAttribute('data-region', row.region);
    labelEl.setAttribute('x', tableX + swatchSize + swatchGap);
    labelEl.setAttribute('y', y);
    if (labelSize) labelEl.style.fontSize = labelSize + 'px';
    labelEl.textContent = row.label;
    g.appendChild(labelEl);

    // Valor (promedio Gini)
    const valueEl = m_ns('text');
    valueEl.setAttribute('class', 'm-table-value' + stateClass);
    valueEl.setAttribute('data-region', row.region);
    if (labelSize) valueEl.style.fontSize = labelSize + 'px';
    valueEl.setAttribute('x', tableX + tableW);
    valueEl.setAttribute('y', y);
    valueEl.setAttribute('text-anchor', 'end');
    valueEl.textContent = row.value.toFixed(1);
    g.appendChild(valueEl);
  });
}

// =================== Tooltip ===================
function m_showTooltip(e, d, tooltip) {
  const welfareLabel = t('c1-tt-welfare-' + d.welfare);
  const regionLabel = t('reg.' + d.region);
  const regionColor = REGION_WB_COLORS[d.region] || '#888';
  tooltip.innerHTML = `
    <strong>${m_displayName(d)}</strong>
    <div class="tt-region" style="color:${regionColor}">${regionLabel}</div>
    <div class="tt-row"><span>${t('c1-tt-year')}</span><span>${d.year}</span></div>
    <div class="tt-row"><span>${t('c1-tt-welfare')}</span><span>${welfareLabel}</span></div>
    <div class="tt-row"><span>${t('c1-tt-gini-raw')}</span><span>${d.gini_raw.toFixed(1)}</span></div>
    <div class="tt-row"><span>${t('c1-tt-gini-adj')}</span><span>${d.gini_adj.toFixed(1)}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  m_positionTooltip(e, tooltip);
}

function m_positionTooltip(e, tooltip) {
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  let tx = e.clientX - wrap.left + 12;
  if (tx + tw > wrap.width) tx = e.clientX - wrap.left - tw - 12;
  let ty = e.clientY - wrap.top - th - 8;
  if (ty < 0) ty = e.clientY - wrap.top + 14;
  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';
}

// =================== Legend (chips de región) ===================
function renderMarimekkoLegend() {
  const container = document.querySelector('.m-legend[data-chart="1"]');
  if (!container) return;
  container.innerHTML = '';
  REGION_WB_ORDER.forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'm-legend-chip';
    chip.dataset.region = region;
    chip.innerHTML = `
      <span class="m-legend-swatch" style="background:${REGION_WB_COLORS[region]}"></span>
      <span class="m-legend-label">${t('reg.' + region)}</span>
    `;
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        state[1].activeRegion = region;
        drawMarimekko();
      });
      chip.addEventListener('mouseleave', () => {
        state[1].activeRegion = null;
        drawMarimekko();
      });
    }
    // Click: en mobile (sin hover), tap = toggle región activa.
    chip.addEventListener('click', () => {
      state[1].activeRegion = state[1].activeRegion === region ? null : region;
      drawMarimekko();
    });
    container.appendChild(chip);
  });
}

// =================== Slider con play ===================
const M_SLIDER_INTERVAL_MS = 320;  // ~8 segundos para 25 años

function setupMarimekkoSlider() {
  const slider = document.getElementById('m-slider');
  const playBtn = document.getElementById('m-play');
  const display = document.getElementById('m-year-display');
  if (!slider || !playBtn || !display) return;

  function updateDisplay() {
    display.textContent = state[1].year;
    slider.value = state[1].year;
  }
  updateDisplay();

  slider.addEventListener('input', () => {
    state[1].year = parseInt(slider.value, 10);
    updateDisplay();
    drawMarimekko();
  });

  let timer = null;
  function startPlay() {
    state[1].playing = true;
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', t('slider-pause'));
    timer = setInterval(() => {
      const next = state[1].year + 1;
      if (next > parseInt(slider.max, 10)) {
        stopPlay();
        return;
      }
      state[1].year = next;
      updateDisplay();
      drawMarimekko();
    }, M_SLIDER_INTERVAL_MS);
  }
  function stopPlay() {
    state[1].playing = false;
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', t('slider-play'));
    if (timer) { clearInterval(timer); timer = null; }
  }

  playBtn.addEventListener('click', () => {
    if (state[1].playing) stopPlay();
    else {
      // Si ya está en el final, reiniciar al inicio.
      if (state[1].year >= parseInt(slider.max, 10)) {
        state[1].year = parseInt(slider.min, 10);
        updateDisplay();
        drawMarimekko();
      }
      startPlay();
    }
  });
}

// =================== Toggle Gini original/ajustado ===================
function setupMarimekkoToggle() {
  document.querySelectorAll('.m-mode-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.m-mode-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[1].mode = btn.dataset.mode;
      // Actualizar el data-i18n del subtítulo según el modo
      const subtitle = document.querySelector('.chart-block[data-chart="1"] .chart-subtitle');
      if (subtitle) {
        subtitle.dataset.i18n = state[1].mode === 'raw' ? 'c1-subtitle-raw' : 'c1-subtitle-adj';
        subtitle.innerHTML = I18N[LANG][subtitle.dataset.i18n] || '';
      }
      drawMarimekko();
    });
  });
}

// =================== Hook PNG export ===================
// El png-export.js llama esto antes de rasterizar. Mostramos todas las
// líneas regionales en el clone para que aparezcan simultáneamente en
// el PNG (en interactivo solo se ve la hovereada).
window.onBeforePngExport = (svgClone, chartId) => {
  if (chartId !== '1') return;
  // El crop del bottom (más abajo) se decide por si HAY labels de país en el
  // clon, no por "hay selección". Razón histórica: el crop se gateaba con
  // hasSelection (state[1] + editor.countries); pero el set *priority* por
  // default (los ~7 países curados) se dibuja SIN ninguna selección → el crop
  // se disparaba y decapitaba los callouts, dejando solo las "rayitas cortas"
  // que Daniel observó. Ahora chequeamos directamente la presencia de labels.
  const vb = svgClone.viewBox.baseVal;
  const canvasLabels = [];

  // Tabla de promedios regionales: la TABLA va siempre (con y sin selección).
  // Los swatches (rects de color) y la línea del título quedan en el SVG.
  // Los TEXTOS (título + labels de región + valores) se sacan y se mandan a
  // canvas — el contexto aislado del <img> SVG no resuelve bien las
  // webfonts (Source Sans 3) y los textos salen con tracking equivocado.
  // PNG es estado actual sin "activeRegion" (no hay hover en estático).
  const tableEl = svgClone.querySelector('#m-avg-table');
  if (tableEl) {
    // BUG histórico: `size: 10` y `size: 11` eran HARDCODED acá. Eso
    // ignoraba el slider "Tabla regional" del editor (que sí se aplica al
    // SVG en pantalla vía drawRegionalAvgTable → style.fontSize). Fix:
    // leer el font-size del <text> que ya viene calibrado con el slider.
    // Fallback al hardcoded original si por algún motivo no hay inline.
    const readFontSize = (el, fallback) => {
      const v = parseFloat(el.style.fontSize);
      return Number.isFinite(v) && v > 0 ? v : fallback;
    };
    // Título
    const titleEl = tableEl.querySelector('.m-table-title');
    if (titleEl) {
      canvasLabels.push({
        x: parseFloat(titleEl.getAttribute('x')),
        y: parseFloat(titleEl.getAttribute('y')),
        text: titleEl.textContent.toUpperCase(),
        fill: '#8A8579',
        weight: '600',
        size: readFontSize(titleEl, 10),
        textAnchor: 'start'
      });
      titleEl.style.display = 'none';
    }
    // Filas: labels + values. Quitamos la clase activa (PNG es sin hover).
    tableEl.querySelectorAll('.m-table-label, .m-table-value').forEach(el => {
      canvasLabels.push({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        text: el.textContent,
        fill: '#1A1A1A',
        weight: '500',
        size: readFontSize(el, 11),
        textAnchor: el.getAttribute('text-anchor') || 'start'
      });
      el.style.display = 'none';
    });
  }

  // Crop del bottom SOLO si NO hay ningún callout de país en el clon. Caso
  // único: el editor está activo con la lista de países vacía (elección
  // explícita "no mostrar labels") → el margen inferior queda como espacio
  // muerto y lo recortamos a +8px bajo el eje X. Si HAY labels (el set priority
  // por default, o selección manual, o editor con países), NO cropeamos: el
  // bottom margin ya viene dimensionado (bottom dinámico en drawMarimekko) para
  // alojar los callouts rotados -45°; cualquier crop acá los decapitaría.
  const hasCountryLabels = svgClone.querySelectorAll('.m-country-label').length > 0;
  if (!hasCountryLabels) {
    const bottomKeep = M_MARGIN.top + M_PLOT_H + 8;
    const cropFromBottom = Math.max(0, vb.height - bottomKeep);
    svgClone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height - cropFromBottom}`);
  }
  // Devolver labels que png-export debe pintar directamente en canvas para
  // garantizar la tipografía correcta.
  return { canvasLabels };
};

// Hook adicional: pedirle a png-export.js que reserve canvas-px EXTRA entre
// el bottom del SVG rasterizado y el top de la leyenda regional. Necesario
// porque las etiquetas de país rotadas -45° viven INSIDE el bottom margin
// del SVG (dentro del viewBox, gracias al bottom dinámico). El SVG se
// rasteriza entero pero el gapAfterSvgBase=4 dejaba la leyenda canvas
// "pegada" visualmente a la huella de los textos colgantes. Este extra
// se suma a chromeBelow al calcular svgH (con WYSIWYG el SVG se achica un
// poquito) y se aplica al posicionar la leyenda. Solo pedimos extra cuando
// hay editor format activo — la versión pública sin editor mantiene el
// comportamiento histórico (gap=4) intacto, como Daniel explícitamente
// pidió.
window.onBeforePngExportGetExtraGap = (chartId, format) => {
  if (chartId !== '1') return 0;
  if (!format) return 0;  // versión pública sin editor: NO tocar.
  // Valores por formato calibrados para garantizar separación visible:
  //   - public (scaleY≈1.06): 16 canvas-px adicionales → total visible ~50.
  //   - newsletter (scaleY≈0.69): 24 canvas-px adicionales.
  //   - square (scaleY≈0.87): 20 canvas-px adicionales.
  //   - mobile (scaleY≈0.55): 32 canvas-px adicionales (más por scaleY chico).
  switch (format) {
    case 'public':     return 16;
    case 'newsletter': return 24;
    case 'square':     return 20;
    case 'mobile':     return 32;
    default:           return 0;
  }
};

// Hook adicional: el caption del PNG cambia según el modo activo (raw/adj).
// El interactivo sigue mostrando el c1-sources general (que menciona ambos
// modos); el PNG usa la versión específica del modo.
//
// IMPORTANTE: si el editor tiene un caption custom no vacío, respetamos ESO
// — el override del modo es solo para la versión "default automática". Sin
// esto, el caption editado por Daniel en el sidebar nunca aparecía en el PNG.
window.onBeforePngExportGetSourceText = (chartId) => {
  if (chartId !== '1') return null;
  // Editor custom caption gana sobre el mode-specific default.
  try {
    const aeCfg = window.AtlasEditor?.getConfig?.();
    if (aeCfg) {
      const lang = aeCfg.lang || (typeof LANG !== 'undefined' ? LANG : 'es');
      const customCaption = (aeCfg.texts?.[lang]?.caption || '').trim();
      if (customCaption) return customCaption;
    }
  } catch (_) {}
  const key = state[1]?.mode === 'adj' ? 'c1-sources-adj' : 'c1-sources-raw';
  const html = I18N[LANG]?.[key];
  if (!html) return null;
  // El i18n string puede contener HTML (ej. <strong>). Lo limpiamos a texto plano
  // para que el canvas no renderee tags literales.
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent;
};

// =================== Init ===================
function initMarimekko() {
  // Default: el chart arranca con el set curado YA tildado como chips. Esos
  // chips SON las etiquetas (modelo unificado) y el PNG exporta lo mismo. El
  // HTML siembra state[1] sin selectedCountries → cae acá y aplicamos el default.
  if (!state[1]) {
    state[1] = { mode: 'raw', year: 2024, activeRegion: null, playing: false, selectedCountries: [...M_DEFAULT_SELECTION] };
  } else if (!state[1].selectedCountries) {
    state[1].selectedCountries = [...M_DEFAULT_SELECTION];
  }
  // Editor sidebar: re-render cuando el usuario edita textos/sizes/países.
  // CRÍTICO que se wire ANTES del primer drawMarimekko: el inline-script de
  // chart-1.html corre SINCRÓNICAMENTE antes de DOMContentLoaded, así que la
  // primera llamada a drawMarimekko ocurre antes de que editor.js monte el
  // panel y setee body.ae-ever-activated. El re-render correcto sucede
  // cuando editor.js emite atlas-editor-change post-mount → el listener
  // debe estar wireado ya. Singleton vía initMarimekko._editorWired por si
  // este init se llama varias veces (ej. desde el index.html que monta los
  // 3 charts en la misma página).
  if (!initMarimekko._editorWired) {
    initMarimekko._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawMarimekko());
  }
  // Export PNG: este chart soporta formatos (cuadrado por defecto) y sabe
  // re-dibujarse en el formato target vía drawMarimekko cuando el exportador
  // setea __atlasPngFormatOverride.
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawMarimekko;
  renderMarimekkoLegend();
  drawMarimekko();
  setupMarimekkoSlider();
  setupMarimekkoToggle();
  setupMarimekkoSearch();
  renderMarimekkoSelectedChips();
  setupMarimekkoDownloadCSV();
  // Mobile (≤768px): botones tuerca + "Seleccionar". Singleton — si ya
  // lo llamó otro init en el index.html, no hace nada.
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  // Mobile: handler global que cierra el tooltip al tap fuera de las
  // barras. Las barras hacen stopPropagation así que un tap sobre una
  // barra no llega acá. Solo registramos una vez (singleton).
  if (!HAS_HOVER && !initMarimekko._tooltipGlobalRegistered) {
    initMarimekko._tooltipGlobalRegistered = true;
    document.addEventListener('click', () => {
      const tt = document.getElementById('tooltip1');
      if (tt) tt.style.opacity = '0';
    });
  }
}

// =================== Buscador + chips de país seleccionado ===================
// Permite que el usuario destaque un país (o varios). Los seleccionados
// quedan con su color original; el resto se atenúa. Las etiquetas de los
// seleccionados se fuerzan a aparecer (prioridad máxima en el greedy).

function m_normalize(s) {
  // Para búsqueda case- y acento-insensitive
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function m_searchableCountries() {
  // Lista única de países del dataset (recorremos todos los años por las dudas
  // de que algún país aparezca solo en años específicos)
  const seen = new Set();
  const list = [];
  Object.values(DATA_MARIMEKKO.data_by_year).forEach(arr => {
    arr.forEach(d => {
      if (seen.has(d.code)) return;
      seen.add(d.code);
      list.push({ code: d.code, name: m_displayName(d), region: d.region });
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, LANG));
}

function m_toggleCountrySelection(code) {
  const arr = state[1].selectedCountries;
  const idx = arr.indexOf(code);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(code);
  renderMarimekkoSelectedChips();
  drawMarimekko();
}

function renderMarimekkoSelectedChips() {
  const container = document.getElementById('m-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  state[1].selectedCountries.forEach(code => {
    // Buscar el país en el dataset para obtener su region
    const sample = Object.values(DATA_MARIMEKKO.data_by_year)
      .flat().find(d => d.code === code);
    if (!sample) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = REGION_WB_COLORS[sample.region] || '#888';
    chip.textContent = (COUNTRY_NAMES[code]?.[LANG]) || sample.name;
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Remove');
    x.addEventListener('click', () => m_toggleCountrySelection(code));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupMarimekkoSearch() {
  const input = document.getElementById('m-search');
  const results = document.getElementById('m-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = m_normalize(q);
    return m_searchableCountries()
      .filter(c => m_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[1].selectedCountries.includes(c.code);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-code="${c.code}">${c.name}<span class="m-search-region">${t('reg-short.' + c.region) || ''}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => {
      el.addEventListener('click', () => {
        m_toggleCountrySelection(el.dataset.code);
        input.value = '';
        results.classList.remove('open');
        input.focus();
      });
    });
  }
  input.addEventListener('input', () => {
    currentMatches = getMatches(input.value);
    activeIdx = currentMatches.length > 0 ? 0 : -1;
    renderResults(currentMatches, activeIdx);
  });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      activeIdx = (activeIdx + 1) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'Enter' && activeIdx >= 0) {
      ev.preventDefault();
      m_toggleCountrySelection(currentMatches[activeIdx].code);
      input.value = '';
      results.classList.remove('open');
    } else if (ev.key === 'Escape') {
      results.classList.remove('open');
      input.blur();
    }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) {
      results.classList.remove('open');
    }
  });
}

// =================== Download CSV ===================
// Dataset completo: todas las observaciones únicas (país × año) del PIP.
// Una observación es única por (iso3, year). Las "ventanas de 15 años" que
// usa el slider son derivadas de estas observaciones; el CSV exporta la
// fuente real, no la vista derivada.
// Convención de columnas: iso3 primero, descripciones después.
function setupMarimekkoDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="1-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const seen = new Set();
      const rows = [];
      Object.values(DATA_MARIMEKKO.data_by_year).flat().forEach(d => {
        const key = `${d.code}|${d.year}|${d.welfare}|${d.level}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(d);
      });
      rows.sort((a, b) => a.code.localeCompare(b.code) || a.year - b.year);

      const cols = ['iso3', 'country', 'region', 'year', 'welfare', 'reporting_level', 'gini_raw', 'gini_adj'];
      let csv = cols.join(',') + '\n';
      rows.forEach(d => {
        const row = [
          d.code,
          (COUNTRY_NAMES[d.code]?.en) || d.name,
          d.region,
          d.year,
          d.welfare,
          d.level,
          d.gini_raw,
          d.gini_adj
        ];
        csv += row.map(v => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
          return v;
        }).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'el-atlas-02-gini-observaciones.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}
