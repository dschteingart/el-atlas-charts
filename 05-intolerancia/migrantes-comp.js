// =============================================================
//  El Atlas N°5 — Comparación migratoria entre países (chart 15)
// =============================================================
//
// CLON de barrio-comp.js (que a su vez clona ranking.js; regla de oro: clonar
// el motor, no reimplementar). Es la TRANSPUESTA del perfil (chart 9): en vez
// de los 14 ítems de un país, un ítem en los 18 países del Latinobarómetro 2020.
// Dos vistas sobre el mismo dato (% con postura hostil en la frase elegida):
//   - 'sel'  : barras horizontales de la selección (motor 03-futbol/talento.js)
//   - 'all'  : pared marimekko de los 18 países (motor 02-demasiado-desiguales/
//              marimekko.js: labels rotadas estilo OWID con callouts)
//
// Diferencias con el clon (justificadas por el dataset):
//   · SIN olas: el Latinobarómetro 2020 es una sola ronda (foto, no película),
//     así que no hay slider de ola ni columna de año variable.
//   · SIN leyenda de regiones ni tabla de promedios regionales: los 18 países
//     son de la MISMA región (América Latina), con lo cual la leyenda tendría
//     un solo chip y la tabla una sola fila. La única referencia es la mediana
//     regional (MG_MED), la misma que marca el modo crudo del perfil.
//
// Inputs (data-migrantes.js): MG_ITEMS, MG_META, MG_LEVEL, MG_MED, MG_N,
// MG_REGION. Etiquetas de ítem: claves c9-item-<código> de i18n-migrantes.js.
// State (state[15]): cat (código de ítem), view ('sel'|'all'), selected[],
//                   showMedian.

//==================================================================
//  Constantes
//==================================================================
const MC_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const MC_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 56, left: 110 };

// Selección inicial (WYSIWYG: son los chips = las etiquetas del marimekko).
// Los seis más comentables de la región; verificado contra MG_LEVEL: los seis
// tienen dato en los 14 ítems.
const MC_DEFAULT_SELECTED = ['ARG','BRA','CHL','MEX','PER','COL'];

// Ítem default: el hallazgo del número (Argentina 1° de 18 con 53,6%).
const MC_DEFAULT_ITEM = 'C_004_213';

// Año de la ronda (una sola: MG_META.year = 2020).
const MC_YEAR = (typeof MG_META !== 'undefined' && MG_META.year) ? MG_META.year : 2020;

const MC_SVG_NS = 'http://www.w3.org/2000/svg';
const mc_ns = (tag) => document.createElementNS(MC_SVG_NS, tag);

// Márgenes por formato de PNG de la vista barras (mobile-first). Left amplio
// para los nombres de país; bottom sólo para los ticks y el título del eje
// (sin leyenda de regiones: los 18 países son de la misma región).
function mc_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 44, right: 96, bottom: 100, left: 210 };
    case 'square':     return { top: 44, right: 96, bottom: 100, left: 210 };
    case 'mobile':     return { top: 34, right: 60, bottom: 96, left: 150 };
    default:           return null;
  }
}

//==================================================================
//  Helpers
//==================================================================
function mc_displayName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function mc_measureText(text, fontSize, weight) {
  if (!mc_measureText._ctx) {
    const c = document.createElement('canvas');
    mc_measureText._ctx = c.getContext('2d');
  }
  const ctx = mc_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function mc_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

function mc_regionColor(iso) {
  const reg = MG_REGION[iso];
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#5E7E96';
}
function mc_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#555';
}

// Índice del ítem activo (o del código pedido) dentro de MG_ITEMS.
function mc_itemIndex(code) {
  const items = (typeof MG_ITEMS !== 'undefined') ? MG_ITEMS : [];
  const i = items.indexOf(code || state[15].cat);
  return i >= 0 ? i : 0;
}

// Etiqueta del ítem: REUSA las claves del perfil (c9-item-<código>) para no
// duplicar los 14 textos; fallback a la etiqueta ES del payload.
function mc_itemLabel(code) {
  const k = 'c9-item-' + code;
  if (typeof t === 'function') { const s = t(k); if (s && s !== k) return s; }
  const m = (typeof MG_META !== 'undefined') ? MG_META.items.find(p => p[0] === code) : null;
  return m ? m[1] : code;
}

// TRANSPUESTA de MG_LEVEL: dado un ítem, la fila de los países.
// -> [[iso, pct, year, n, rank], ...] ordenado ASC por pct (el motor de barras
// dibuja de menor a mayor). rank: 1 = el pct más alto (el más hostil).
// Saltea los iso con valor null (el ítem de Venezuela sólo tiene 17 países).
function mc_foto(itemIndex) {
  const lvl = (typeof MG_LEVEL !== 'undefined') ? MG_LEVEL : {};
  const nn = (typeof MG_N !== 'undefined') ? MG_N : {};
  const rows = [];
  Object.keys(lvl).forEach(iso => {
    const v = lvl[iso] ? lvl[iso][itemIndex] : null;
    if (v == null || isNaN(v)) return;
    rows.push([iso, v, MC_YEAR, (nn[iso] ? nn[iso][itemIndex] : null)]);
  });
  rows.sort((a, b) => a[1] - b[1]);
  const total = rows.length;
  return rows.map((r, i) => [r[0], r[1], r[2], r[3], total - i]);
}

// Filas del ítem activo, orden asc.
// Vista 'sel': solo la selección. Vista 'all': todos.
function mc_computeData() {
  const s = state[15];
  let rows = mc_foto(mc_itemIndex()).map(r => ({
    iso: r[0], pct: r[1], year: r[2], n: r[3], rank: r[4], region: MG_REGION[r[0]]
  }));
  if (s.view !== 'all') {
    const sel = new Set(s.selected);
    rows = rows.filter(r => sel.has(r.iso));
  }
  return rows;
}

// Mediana REGIONAL del ítem: la precalculada en el payload (MG_MED), que es la
// misma que marca el modo crudo del perfil (chart 9) — una sola fuente de
// verdad entre las dos vistas del graficador. No se recalcula acá: MG_MED sale
// de los porcentajes sin redondear del generador.
function mc_median() {
  const idx = mc_itemIndex();
  const v = (typeof MG_MED !== 'undefined') ? MG_MED[idx] : null;
  if (v == null) return null;
  return { value: v, n: mc_universe() };
}

// Label del período: el Latinobarómetro 2020 es una sola ronda.
function mc_yearLabel() { return String(MC_YEAR); }

// Universo del puesto regional: países con dato en el ítem activo (18; 17 en el
// ítem de migrantes venezolanos, que no se preguntó en Venezuela).
function mc_universe() {
  return mc_foto(mc_itemIndex()).length;
}

// Rótulo del puesto regional ("5° de 18" / "#5 of 18").
function mc_rankLabel(rank, n) {
  const tpl = (typeof t === 'function') ? t('c15-rank-tpl') : '{R}/{N}';
  return tpl.replace('{R}', rank).replace('{N}', n != null ? n : '?');
}

//==================================================================
//  Subtítulo dinámico (con el ítem activo)
//==================================================================
function mc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c15-subtitle-tpl"]');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;
  const tpl = (typeof t === 'function') ? t('c15-subtitle-tpl') : '';
  el.textContent = tpl
    .replace('{ITEM}', mc_itemLabel(state[15].cat))
    .replace('{N}', String(mc_universe()))
    .replace('{PERIODO}', mc_yearLabel());
}

//==================================================================
//  Dispatcher
//==================================================================
function drawMigrantesComp() {
  // Guarda: la categoría puede llegar de ?cat= (el shell la lee de la URL y la
  // migra entre vistas). Si no es un código de ítem válido, volver al default.
  if (MG_ITEMS.indexOf(state[15].cat) < 0) {
    state[15].cat = MC_DEFAULT_ITEM;
    const catSel = document.getElementById('mc-cat-select');
    if (catSel) catSel.value = state[15].cat;
  }
  mc_updateSubtitle();
  if (state[15].view === 'all') mc_drawMarimekko();
  else mc_drawBars();
  // WYSIWYG: el buscador + chips van SIEMPRE visibles (los chips son las
  // barras en 'sel' y las etiquetas en 'all' — una sola fuente de verdad).
  const picker = document.getElementById('mc-country-picker');
  if (picker) picker.style.display = '';
  // El hint del picker cambia según la vista (qué "hacen" los chips).
  const hint = document.getElementById('mc-picker-hint');
  if (hint) {
    const k = state[15].view === 'all' ? 'c15-pick-hint-all' : 'c15-pick-hint-sel';
    hint.textContent = (typeof t === 'function') ? t(k) : '';
  }
  // Título: neutral por default (norma del proyecto).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('15', false, { title: 'c15-title', titleNeutral: 'c15-title-neutral' });
  }
}

//==================================================================
//  Vista 'sel': barras horizontales (motor talento N°3)
//==================================================================
function mc_drawBars() {
  const svg = document.getElementById('chart15');
  if (!svg) return;
  svg.innerHTML = '';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && mc_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = mc_computeData();
  const n = data.length;
  const med = state[15].showMedian ? mc_median() : null;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // Sin leyenda de regiones (los 18 países son de la misma región): el bottom
  // de los formatos PNG no reserva lugar para ella.
  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11 };

  let MC_W, MC_MARGIN, MC_BAR_H, MC_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    MC_W = f.vbW; totalH = f.vbH; MC_MARGIN = mc_getMargins(editorFormat);
    MC_BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - MC_MARGIN.top - MC_MARGIN.bottom;
    MC_BAR_H = n > 0 ? (plotH - (n - 1) * MC_BAR_GAP) / n : 10;
    const fitName = Math.floor((MC_BAR_H + MC_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    MC_W = 1100;
    MC_MARGIN = mobile ? { ...MC_MARGIN_MOBILE } : { ...MC_MARGIN_DESKTOP };
    MC_BAR_H = mobile ? 42 : 20; MC_BAR_GAP = mobile ? 13 : 5;
    plotH = Math.max(40, n * (MC_BAR_H + MC_BAR_GAP) - MC_BAR_GAP);
    totalH = MC_MARGIN.top + plotH + MC_MARGIN.bottom;
  }

  let maxNameW = 0;
  data.forEach(d => {
    const w = mc_measureText(mc_displayName(d.iso), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
  });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(MC_W * 0.42);
    MC_MARGIN.left = Math.min(maxLeft, Math.max(MC_MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${MC_W} ${totalH}`);

  const plotW = MC_W - MC_MARGIN.left - MC_MARGIN.right;
  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.pct), med ? med.value : 0, 1) : 1;
  const xMax = maxPct * 1.06;
  const xScale = (v) => MC_MARGIN.left + (v / xMax) * plotW;

  const gridG = mc_ns('g'); svg.appendChild(gridG);
  const axisG = mc_ns('g'); svg.appendChild(axisG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 25, 50, 75];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = mc_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MC_MARGIN.top);
    line.setAttribute('y2', MC_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = mc_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', MC_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = (typeof fmt === 'function') ? fmt(v, 0) : String(v);
    axisG.appendChild(lbl);
  });

  const xTitle = mc_ns('text');
  xTitle.setAttribute('x', MC_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MC_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c15-axis-x') : '% con una postura hostil';
  svg.appendChild(xTitle);

  const barsG = mc_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MC_MARGIN.top + i * (MC_BAR_H + MC_BAR_GAP);
    const color = mc_regionColor(d.iso);
    const barW = xScale(d.pct) - MC_MARGIN.left;

    const nameTxt = mc_ns('text');
    nameTxt.setAttribute('x', MC_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + MC_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    // Todos los países son de la misma región: sin resaltado por región, el
    // nombre va uniforme (WYSIWYG: seleccionar no destaca ni atenúa).
    nameTxt.setAttribute('font-weight', 500);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = mc_displayName(d.iso);
    barsG.appendChild(nameTxt);

    const rect = mc_ns('rect');
    rect.setAttribute('x', MC_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', MC_BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      rect.setAttribute('fill-opacity', 1);
      mc_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => mc_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', 0.92);
      mc_hideTooltip();
    });
    // Desktop: click en la barra saca al país (criterio 11f). En touch el
    // tap es del tooltip.
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { mc_hideTooltip(); mc_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);

    const valTxt = mc_ns('text');
    valTxt.setAttribute('x', MC_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + MC_BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = (typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct;
    barsG.appendChild(valTxt);
  });

  if (med) {
    const mx = xScale(med.value);
    const mline = mc_ns('line');
    mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
    mline.setAttribute('y1', MC_MARGIN.top - (bigFmt ? 8 : 6));
    mline.setAttribute('y2', MC_MARGIN.top + plotH);
    mline.setAttribute('stroke', '#8A8579');
    mline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    svg.appendChild(mline);
    const mlbl = mc_ns('text');
    const mlblTxt = ((typeof t === 'function') ? t('c15-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    const lblW = mc_measureText(mlblTxt, SIZES.medLbl, 600);
    const anchorEnd = mx + 8 + lblW > MC_W - 4;
    mlbl.setAttribute('x', anchorEnd ? mx - 8 : mx + 8);
    mlbl.setAttribute('y', MC_MARGIN.top - (bigFmt ? 16 : 12));
    mlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = SIZES.medLbl + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#7A6E62');
    mlbl.textContent = mlblTxt;
    svg.appendChild(mlbl);
  }

  const zeroLine = mc_ns('line');
  zeroLine.setAttribute('x1', MC_MARGIN.left); zeroLine.setAttribute('x2', MC_MARGIN.left);
  zeroLine.setAttribute('y1', MC_MARGIN.top);
  zeroLine.setAttribute('y2', MC_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);
}

//==================================================================
//  Vista 'all': pared marimekko (motor N°2 chart-1)
//==================================================================
const MCM_W_DESKTOP = 1100, MCM_H_DESKTOP = 470;
const MCM_W_MOBILE  = 1100, MCM_H_MOBILE  = 1500;
const MCM_MARGIN_DESKTOP = { top: 50, right: 32, bottom: 110, left: 56 };
const MCM_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 200, left: 130 };
function mcm_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'square':     return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'mobile':     return { top: 90, right: 30, bottom: 200, left: 110 };
    default:           return { top: 50, right: 32, bottom: 110, left: 56 };
  }
}
const MCM_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const MCM_LABEL_FONT_SIZE = 10;
const MCM_LABEL_FONT_SIZE_MOBILE = 28;
// Profundidad de filas de quiebre heredada del clon (11 filas): acá se etiquetan
// pocos países (los chips) sobre 18 barras anchas, así que casi siempre alcanza
// el palito recto; las filas extra sólo actúan si el lector selecciona muchos.
const MCM_LABEL_ANCHOR_Y_OFFSET = 82;
const MCM_LABEL_ANCHOR_Y_OFFSET_MOBILE = 122;
const MCM_BEND_ROW_COUNT = 11;
const MCM_BEND_ROW_GAP = 8;
const MCM_BEND_ROW_OFFSET = 6;
const MCM_LABEL_MIN_GAP_X = 5;
const MCM_CALLOUT_PAD = 3;

// Algoritmo de etiquetas estilo OWID (port de m_layoutCountryLabels del N°2).
// WYSIWYG (norma de la auditoría del N°2): las etiquetas SON los chips
// (labelCodes). Sin priority list oculta ni extremos automáticos — una sola
// fuente de verdad. Todas son "must-show": se colocan con anti-colisión y solo
// se fuerzan (con overflow) si no entran limpias, así nunca se descarta un chip.
function mcm_layoutCountryLabels(sortedData, barWidth, plotArea, labelCodes) {
  const present = new Set(sortedData.map(d => d.iso));
  const codesToShow = new Set((labelCodes || []).filter(c => present.has(c)));

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && mc_isMobile();
  const angle = MCM_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const aeCfg2 = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeLabelSize = (aeCfg2 && aeCfg2.sizes) ? aeCfg2.sizes.labels : null;
  const fmtDefaultFontSize = newsletter ? 16
    : square ? 17
    : mobilePng ? 26
    : mobile ? MCM_LABEL_FONT_SIZE_MOBILE
    : MCM_LABEL_FONT_SIZE;
  const fontSize = (aeLabelSize != null) ? aeLabelSize : fmtDefaultFontSize;
  const anchorYOffset = (mobile || mobilePng)
    ? MCM_LABEL_ANCHOR_Y_OFFSET_MOBILE
    : MCM_LABEL_ANCHOR_Y_OFFSET;
  const minGap = MCM_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + anchorYOffset;
  const yAnchor = yLine + 4;

  const anchors = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.iso)) return;
    const text = mc_displayName(d.iso);
    const textW = Math.max(22, mc_measureText(text, fontSize, 500));
    const projW = cos * textW + sin * fontSize + 2;
    anchors.push({
      code: d.iso, text,
      color: mc_regionLabelColor(d.region),
      barX: plotArea.left + i * barWidth + barWidth / 2,
      textW, projW
    });
  });

  const orderedAnchors = anchors.slice().sort((a, b) => a.barX - b.barX);
  const placedTextFootprints = [];
  const placedCalloutSegments = [];
  const toDraw = [];

  // Tope duro: el borde del viewBox. La fase forzada (allowOverflow) empujaba
  // hasta rightBound+80, que se pasaba del SVG → la etiqueta se cortaba en el
  // PNG (ej. España en el borde derecho, reporte de Daniel 2026-07-23). Ahora
  // ninguna etiqueta puede exceder el viewBox: si no entra, se descarta.
  const hardRight = (plotArea.vbRight || (plotArea.right + 40)) - 6;
  function findFreeTx(idealTx, projW, allowOverflow) {
    const maxX = Math.min(allowOverflow ? rightBound + 80 : rightBound, hardRight);
    const minX = leftBound + projW;
    let tx = Math.max(minX, idealTx);
    let guard = 0;
    while (guard++ < 60) {
      const conflict = placedTextFootprints.find(f =>
        !(tx <= f.x1 - minGap || (tx - projW) >= f.x2 + minGap)
      );
      if (!conflict) return tx <= maxX ? tx : null;
      tx = conflict.x2 + minGap + projW;
      if (tx > maxX) return null;
    }
    return null;
  }

  // Valida el callout COMPLETO contra los ya colocados. bendY === null =
  // palito recto (una sola V de la barra al texto). A diferencia del motor
  // original del N°2, acá también se chequean la V inicial y los palitos
  // rectos — sin eso, un palito posterior podía cruzar la H de una etiqueta
  // anterior sin que el algoritmo lo viera (cruce real detectado 2026-07-22).
  function calloutIsClear(barX, tx, bendY) {
    const pad = MCM_CALLOUT_PAD;
    const cand = [];
    if (bendY === null) {
      cand.push({ kind: 'V', x: barX, y1: plotArea.bottom, y2: yLine });
    } else {
      cand.push({ kind: 'V', x: barX, y1: plotArea.bottom, y2: bendY });
      cand.push({ kind: 'H', y: bendY, x1: Math.min(barX, tx), x2: Math.max(barX, tx) });
      cand.push({ kind: 'V', x: tx, y1: bendY, y2: yLine });
    }
    for (const c of cand) {
      for (const s of placedCalloutSegments) {
        if (c.kind === 'H' && s.kind === 'H') {
          if (Math.abs(s.y - c.y) < pad && !(c.x2 + pad < s.x1 || c.x1 > s.x2 + pad)) return false;
        } else if (c.kind === 'V' && s.kind === 'V') {
          if (Math.abs(s.x - c.x) < pad && !(c.y2 + pad < s.y1 || c.y1 > s.y2 + pad)) return false;
        } else {
          const v = c.kind === 'V' ? c : s;
          const h = c.kind === 'H' ? c : s;
          if (v.x >= h.x1 - pad && v.x <= h.x2 + pad && h.y >= v.y1 - pad && h.y <= v.y2 + pad) return false;
        }
      }
    }
    return true;
  }

  function tryPlace(a, allowOverflow) {
    let tx = findFreeTx(a.barX, a.projW, allowOverflow);
    let guard = 0;
    while (tx !== null && guard++ < 24) {
      const displaced = Math.abs(tx - a.barX) > 0.5;
      // Palito recto si el texto quedó sobre su barra y el camino está libre.
      if (!displaced && calloutIsClear(a.barX, tx, null)) {
        return { ...a, tx, ty: yAnchor, yLine, bendY: null, displaced: false, fontSize };
      }
      // Con desplazamiento (o palito bloqueado): probar filas de quiebre desde
      // la más cercana al label hacia la más cercana al eje (regla OWID).
      for (let r = MCM_BEND_ROW_COUNT - 1; r >= 0; r--) {
        const candY = plotArea.bottom + MCM_BEND_ROW_OFFSET + r * MCM_BEND_ROW_GAP;
        if (candY >= yLine - 4) continue;
        if (calloutIsClear(a.barX, tx, candY)) {
          return { ...a, tx, ty: yAnchor, yLine, bendY: candY, displaced: true, fontSize };
        }
      }
      // Ninguna fila limpia con este tx → correr el texto a la derecha y
      // reintentar (la única escapatoria real cuando una H previa bloquea).
      const nextTx = findFreeTx(tx + MCM_LABEL_MIN_GAP_X + 2, a.projW, allowOverflow);
      if (nextTx === null || nextTx <= tx + 0.5) break;
      tx = nextTx;
    }
    // Último recurso (fase forzada): colocar aunque roce, para garantizar
    // seleccionados y extremos.
    if (!allowOverflow) return null;
    const tx2 = findFreeTx(a.barX, a.projW, true);
    if (tx2 === null) return null;
    const displaced2 = Math.abs(tx2 - a.barX) > 0.5;
    return { ...a, tx: tx2, ty: yAnchor, yLine,
             bendY: displaced2 ? plotArea.bottom + MCM_BEND_ROW_OFFSET : null,
             displaced: displaced2, fontSize };
  }

  function commit(p) {
    placedTextFootprints.push({ x1: p.tx - p.projW, x2: p.tx });
    if (p.displaced) {
      placedCalloutSegments.push({ kind: 'H', y: p.bendY, x1: Math.min(p.barX, p.tx), x2: Math.max(p.barX, p.tx) });
      placedCalloutSegments.push({ kind: 'V', x: p.tx, y1: p.bendY, y2: yLine });
      placedCalloutSegments.push({ kind: 'V', x: p.barX, y1: plotArea.bottom, y2: p.bendY });
    } else {
      placedCalloutSegments.push({ kind: 'V', x: p.barX, y1: plotArea.bottom, y2: yLine });
    }
    toDraw.push(p);
  }

  // Fase 1: colocar sin overflow (colisión-libre). Fase 2: forzar el resto con
  // overflow — como todas son chips del usuario, ninguna se descarta.
  const notPlaced = [];
  orderedAnchors.forEach(a => {
    const p = tryPlace(a, false);
    if (p) commit(p);
    else notPlaced.push(a);
  });
  notPlaced.forEach(a => {
    const p = tryPlace(a, true);
    if (p) commit(p);
  });

  return toDraw;
}

function mc_drawMarimekko() {
  const svg = document.getElementById('chart15');
  if (!svg) return;
  svg.innerHTML = '';

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg ? aeCfg.sizes : null;
  const aeCountries = aeCfg ? (aeCfg.countries || []) : null;

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && mc_isMobile();

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH;
    MARGIN = mcm_getMargins(editorFormat);
  } else if (mobile) {
    W = MCM_W_MOBILE; H = MCM_H_MOBILE;
    MARGIN = { ...MCM_MARGIN_MOBILE };
  } else {
    W = MCM_W_DESKTOP; H = MCM_H_DESKTOP;
    MARGIN = { ...MCM_MARGIN_DESKTOP };
  }

  const s1 = state[15];
  // WYSIWYG: las etiquetas del marimekko SON los chips (state.selected), igual
  // que el N°2 tras la auditoría. Si el editor está activo, su lista manda.
  const labelCodes = (aeCfg && Array.isArray(aeCountries)) ? aeCountries : (s1.selected || []);
  // Mayor hostilidad a la izquierda; las barras bajas quedan a la derecha, que
  // es donde va la etiqueta de la mediana.
  const data = mc_computeData().slice().sort((a, b) => b.pct - a.pct);
  const n = data.length;
  const med = s1.showMedian ? mc_median() : null;

  // Y máximo dinámico según el ítem (el de "no dan más de lo que reciben" llega a ~79).
  const dataMax = n ? Math.max(...data.map(d => d.pct), med ? med.value : 0) : 10;
  const yMax = Math.max(10, Math.ceil((dataMax * 1.04) / 5) * 5);

  // Bottom dinámico para que las etiquetas rotadas no se corten.
  {
    const sin45 = Math.SQRT1_2;
    const fmtLabelDefault = newsletter ? 16 : square ? 17 : mobilePng ? 26
      : mobile ? MCM_LABEL_FONT_SIZE_MOBILE : MCM_LABEL_FONT_SIZE;
    const labelFontSize = (aeSizes && aeSizes.labels != null) ? aeSizes.labels : fmtLabelDefault;
    const aOff = (mobile || mobilePng) ? MCM_LABEL_ANCHOR_Y_OFFSET_MOBILE : MCM_LABEL_ANCHOR_Y_OFFSET;
    const present0 = new Set(data.map(d => d.iso));
    const codesToShow0 = new Set((labelCodes || []).filter(c => present0.has(c)));
    let maxTextW = 0;
    data.forEach(d => {
      if (!codesToShow0.has(d.iso)) return;
      const w = Math.max(22, mc_measureText(mc_displayName(d.iso), labelFontSize, 500));
      if (w > maxTextW) maxTextW = w;
    });
    if (maxTextW > 0) {
      const projVert = sin45 * (maxTextW + labelFontSize * 0.3);
      const required = aOff + 4 + projVert + 30;
      if (MARGIN.bottom < required) MARGIN.bottom = Math.ceil(required);
    }
  }

  const PLOT_W = W - MARGIN.left - MARGIN.right;
  const PLOT_H = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const FMT_SIZES = newsletter
    ? { tick: 20, axisLabel: 20, label: 16 }
    : square
    ? { tick: 20, axisLabel: 20, label: 17 }
    : mobilePng
    ? { tick: 30, axisLabel: 26, label: 26 }
    : mobile
    ? { tick: 32, axisLabel: 28, label: 28 }
    : { tick: 11, axisLabel: 10.5, label: MCM_LABEL_FONT_SIZE };
  const mc_pick = (v, fb) => (v != null ? v : fb);   // sin nullish coalescing (esprima no parsea ES2020)
  const SIZES = {
    tick:      mc_pick(aeSizes && aeSizes.ticks,     FMT_SIZES.tick),
    axisLabel: mc_pick(aeSizes && aeSizes.axisTitle, FMT_SIZES.axisLabel),
    label:     mc_pick(aeSizes && aeSizes.labels,    FMT_SIZES.label)
  };

  const yScale = (v) => MARGIN.top + PLOT_H - (v / yMax) * PLOT_H;
  const barWidth = n > 0 ? PLOT_W / n : PLOT_W;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // === Grid Y + ticks ===
  // (Sin tabla regional flotante: las líneas de grilla cruzan todo el ancho.)
  const yTicksAll = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile || mobilePng) ? 4 : 6) : [0, 20, 40, 60];
  const yTicks = yTicksAll.filter(v => v <= yMax + 0.001);
  if (!yTicks.includes(0)) yTicks.unshift(0);
  yTicks.forEach(tv => {
    const y = yScale(tv);
    const line = mc_ns('line');
    line.setAttribute('x1', MARGIN.left);
    line.setAttribute('x2', MARGIN.left + PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', tv === 0 ? '#9C928A' : '#ECE7D8');
    line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
    const tx = mc_ns('text');
    tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y + 4);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', '#7A6E62');
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = tv;
    svg.appendChild(tx);
  });

  // Título del eje Y, rotado.
  const yLab = mc_ns('text');
  const yLabX = MARGIN.left - 35;
  const yLabY = MARGIN.top + PLOT_H / 2;
  yLab.setAttribute('x', yLabX);
  yLab.setAttribute('y', yLabY);
  yLab.setAttribute('text-anchor', 'middle');
  yLab.setAttribute('transform', `rotate(-90, ${yLabX}, ${yLabY})`);
  yLab.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yLab.setAttribute('fill', '#7A6E62');
  yLab.setAttribute('font-weight', 500);
  yLab.style.fontSize = SIZES.axisLabel + 'px';
  yLab.textContent = (typeof t === 'function') ? t('c15-axis-mk') : '% con una postura hostil';
  svg.appendChild(yLab);

  // === Barras ===
  const barsG = mc_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const x = MARGIN.left + i * barWidth;
    const y = yScale(d.pct);
    const rect = mc_ns('rect');
    rect.setAttribute('x', x + (barWidth - barInner) / 2);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barInner);
    rect.setAttribute('height', Math.max(0.5, MARGIN.top + PLOT_H - y));
    rect.setAttribute('fill', (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[d.region]) || '#888');
    // WYSIWYG: seleccionar NO atenúa ni destaca barras (norma de la auditoría).
    // Todas a color pleno; la única atenuación es el hover (opacidad por CSS).
    rect.setAttribute('class', 'm-bar');
    rect.dataset.iso = d.iso;
    rect.dataset.region = d.region;
    rect.addEventListener('mouseenter', (e) => mc_showTooltip(e, d));
    rect.addEventListener('mousemove', (e) => mc_positionTooltip(e));
    rect.addEventListener('mouseleave', () => mc_hideTooltip());
    // Selección por click solo en desktop (en touch el tap es del tooltip).
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { mc_hideTooltip(); mc_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);
  });

  // === Mediana mundial (línea horizontal punteada) ===
  if (med) {
    const my = yScale(med.value);
    const mline = mc_ns('line');
    mline.setAttribute('x1', MARGIN.left);
    mline.setAttribute('x2', MARGIN.left + PLOT_W);
    mline.setAttribute('y1', my); mline.setAttribute('y2', my);
    mline.setAttribute('stroke', '#5A5346');
    mline.setAttribute('stroke-width', (mobile || mobilePng) ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', (mobile || mobilePng) ? '8 7' : '5 4');
    mline.setAttribute('pointer-events', 'none');
    svg.appendChild(mline);
    // Etiqueta a la DERECHA: en el marimekko las barras más altas están a la
    // izquierda (más intolerantes) y taparían el texto; a la derecha las barras
    // son bajas y queda despejado (pedido de Daniel 2026-07-23).
    const mlbl = mc_ns('text');
    mlbl.setAttribute('x', MARGIN.left + PLOT_W - 6);
    mlbl.setAttribute('y', my - 6);
    mlbl.setAttribute('text-anchor', 'end');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = ((mobile || mobilePng) ? 26 : SIZES.tick) + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#5A5346');
    mlbl.setAttribute('paint-order', 'stroke');
    mlbl.setAttribute('stroke', '#FAF8F3');
    mlbl.setAttribute('stroke-width', (mobile || mobilePng) ? 4 : 3);
    mlbl.setAttribute('stroke-linejoin', 'round');
    mlbl.setAttribute('pointer-events', 'none');
    mlbl.textContent = ((typeof t === 'function') ? t('c15-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    svg.appendChild(mlbl);
  }

  // === Etiquetas de país rotadas con callouts ===
  const labelsG = mc_ns('g'); svg.appendChild(labelsG);
  const plotArea = { left: MARGIN.left, right: MARGIN.left + PLOT_W, top: MARGIN.top, bottom: MARGIN.top + PLOT_H, vbRight: W };
  const placed = mcm_layoutCountryLabels(data, barWidth, plotArea, labelCodes);
  placed.forEach(l => {
    const path = mc_ns('path');
    path.setAttribute('class', 'm-callout');
    let dPath;
    if (!l.displaced) dPath = `M ${l.barX},${plotArea.bottom + 1} V ${l.yLine}`;
    else dPath = `M ${l.barX},${plotArea.bottom + 1} V ${l.bendY} H ${l.tx} V ${l.yLine}`;
    path.setAttribute('d', dPath);
    path.setAttribute('stroke', l.color);
    path.setAttribute('stroke-width', '0.8');
    path.setAttribute('stroke-opacity', '0.65');
    path.setAttribute('fill', 'none');
    labelsG.appendChild(path);
    const txt = mc_ns('text');
    // Peso uniforme (WYSIWYG: todas las etiquetas son chips, ninguna en negrita).
    txt.setAttribute('class', 'm-country-label');
    txt.setAttribute('x', l.tx);
    txt.setAttribute('y', l.ty);
    txt.setAttribute('transform', `rotate(-45 ${l.tx} ${l.ty})`);
    txt.setAttribute('text-anchor', 'end');
    txt.setAttribute('fill', l.color);
    txt.style.fontSize = l.fontSize + 'px';
    txt.setAttribute('font-weight', '500');
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });
  // (Sin tabla de promedios regionales: los 18 países son de la misma región,
  // así que la tabla del clon tendría una sola fila. La referencia es la
  // mediana regional, ya dibujada arriba.)
}

//==================================================================
//  Tooltip (compartido por ambas vistas)
//==================================================================
function mc_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip15');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const F = (v) => (typeof fmt === 'function') ? fmt(v, 1) : v;
  // Sin rama EVS/WVS (esto es Latinobarómetro, una sola ronda). En su lugar, el
  // puesto regional "N° de M" sobre los países con dato en el ítem activo.
  const uni = mc_universe();
  const med = mc_median();
  const rankLine = (d.rank != null)
    ? `<div class="tt-row"><span>${tt('c15-tt-rank', 'Puesto regional')}</span><span>${mc_rankLabel(d.rank, uni)}</span></div>` : '';
  const medLine = (med != null)
    ? `<div class="tt-row"><span>${tt('c15-tt-median', 'Mediana regional')}</span><span>${F(med.value)}%</span></div>` : '';
  tooltip.innerHTML = `
    <strong>${mc_displayName(d.iso)}</strong>
    <div class="tt-sub">${mc_itemLabel(state[15].cat)} · ${mc_yearLabel()}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c15-tt-pct', 'Postura hostil')}</span><span>${F(d.pct)}%</span></div>
    ${rankLine}
    ${medLine}
    <div class="tt-row"><span>${tt('c15-tt-n', 'Muestra')}</span><span>${(typeof fmt === 'function') ? fmt(d.n, 0) : d.n}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  mc_positionTooltip(event);
}

function mc_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip15');
  if (!tooltip || !tooltip.parentElement) return;
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const cx = (typeof evClientX === 'function') ? evClientX(event) : event.clientX;
  const cy = (typeof evClientY === 'function') ? evClientY(event) : event.clientY;
  const x = cx - wrap.left;
  const y = cy - wrap.top;
  const ttW = tooltip.offsetWidth;
  const ttH = tooltip.offsetHeight;
  let px = x + 14;
  let py = y - ttH - 8;
  if (px + ttW > wrap.width) px = x - ttW - 14;   // borde derecho → a la izquierda
  if (py < 0) py = y + 18;
  tooltip.style.left = px + 'px';
  tooltip.style.top  = py + 'px';
}

function mc_hideTooltip() {
  const tooltip = document.getElementById('tooltip15');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Controles: ítem + vista + mediana
//==================================================================
function setupMigrantesCompCat() {
  const sel = document.getElementById('mc-cat-select');
  if (!sel) return;
  sel.value = state[15].cat;
  sel.addEventListener('change', () => {
    if (MG_ITEMS.indexOf(sel.value) < 0) return;
    state[15].cat = sel.value;
    drawMigrantesComp();
  });
}

function setupMigrantesCompView() {
  document.querySelectorAll('#mc-view button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v !== 'sel' && v !== 'all') return;
      if (state[15].view === v) return;
      state[15].view = v;
      document.querySelectorAll('#mc-view button')
        .forEach(b => b.classList.toggle('active', b.dataset.view === v));
      drawMigrantesComp();
    });
  });
}

// (Sin slider de ola: el Latinobarómetro 2020 es una sola ronda.)

// Toggle "Referencias": mediana regional on/off. El clon traía además la tabla
// de promedios regionales, que acá no aplica (una sola región).
function setupMigrantesCompRefs() {
  document.querySelectorAll('#mc-refs button[data-ref]').forEach(btn => {
    btn.classList.toggle('active', state[15].showMedian !== false);
    btn.addEventListener('click', () => {
      state[15].showMedian = !(state[15].showMedian !== false);   // toggle
      btn.classList.toggle('active', state[15].showMedian);
      drawMigrantesComp();
    });
  });
}

//==================================================================
//  Buscador de países + chips (vista 'sel'; en 'all' la selección
//  se espeja como etiqueta del marimekko)
//==================================================================
function mc_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function mc_searchableCountries() {
  const lvl = (typeof MG_LEVEL !== 'undefined') ? MG_LEVEL : {};
  return Object.keys(lvl)
    .sort((a, b) => mc_displayName(a).localeCompare(mc_displayName(b), 'es'))
    .map(iso => ({ iso, name: mc_displayName(iso) }));
}

function mc_toggleSelect(iso) {
  const arr = state[15].selected;
  const idx = arr.indexOf(iso);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(iso);
  renderMigrantesCompChips();
  drawMigrantesComp();
}

function renderMigrantesCompChips() {
  const container = document.getElementById('mc-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  const arr = state[15].selected.slice()
    .sort((a, b) => mc_displayName(a).localeCompare(mc_displayName(b), 'es'));
  arr.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = mc_regionColor(iso);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(mc_displayName(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => mc_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupMigrantesCompSearch() {
  const input = document.getElementById('mc-search');
  const results = document.getElementById('mc-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = mc_normalize(q);
    return mc_searchableCountries()
      .filter(c => mc_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[15].selected.includes(c.iso);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        mc_toggleSelect(el.dataset.iso);
        input.value = '';
        results.classList.remove('open');
      });
    });
  }
  input.addEventListener('input', (e) => {
    currentMatches = getMatches(e.target.value);
    activeIdx = -1;
    renderResults(currentMatches, activeIdx);
  });
  input.addEventListener('keydown', (ev) => {
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
      mc_toggleSelect(currentMatches[activeIdx].iso);
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

//==================================================================
//  Download CSV — los 14 ítems, los 18 países (la matriz completa)
//==================================================================
function setupMigrantesCompDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="15-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += '# El Atlas N°5 — postura hostil hacia el inmigrante (Latinobarometro 2020)\n';
      csv += '# pct = % con postura hostil sobre respuestas validas, ponderado (wt).\n';
      csv += '# rank: 1 = pct mas alto del item, sobre los paises con dato en ese item.\n';
      csv += '# mediana_regional = MG_MED (mediana de los 18 paises; 17 en el item venezolano).\n';
      csv += 'iso3,pais,item_code,item,anio,pct,rank,mediana_regional,n\n';
      MG_ITEMS.forEach((code, idx) => {
        const label = mc_itemLabel(code).replace(/"/g, '""');
        const med = (typeof MG_MED !== 'undefined' && MG_MED[idx] != null) ? MG_MED[idx] : '';
        mc_foto(idx).forEach(r => {
          const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]])
            ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
          const nameQ = (name.includes(',')) ? '"' + name + '"' : name;
          csv += [r[0], nameQ, code, '"' + label + '"', r[2], r[1], r[4], med,
                  (r[3] == null ? '' : r[3])].join(',') + '\n';
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lang === 'en'
        ? 'the-atlas-05-immigrant-comparison.csv'
        : 'el-atlas-05-inmigrante-comparacion.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initMigrantesComp() {
  if (!state[15]) {
    state[15] = {
      cat: MC_DEFAULT_ITEM,        // el ítem del hallazgo (salud y educación)
      view: 'sel',
      selected: [...MC_DEFAULT_SELECTED],
      showMedian: true
    };
  }
  if (MG_ITEMS.indexOf(state[15].cat) < 0) state[15].cat = MC_DEFAULT_ITEM;

  setupMigrantesCompCat();
  setupMigrantesCompView();
  setupMigrantesCompRefs();
  setupMigrantesCompSearch();
  setupMigrantesCompDownloadCSV();
  renderMigrantesCompChips();
  drawMigrantesComp();

  if (!initMigrantesComp._editorWired) {
    initMigrantesComp._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawMigrantesComp());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawMigrantesComp;

  // Nota "Datos" corta del PNG, con el ítem realmente mostrado.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '15') return null;
    const tpl = (typeof t === 'function') ? t('c15-sources-tpl') : '';
    if (!tpl) return null;
    return tpl.replace('{ITEM}', mc_itemLabel(state[15].cat)).replace('{Y}', mc_yearLabel());
  };

  // Sin tabla regional en el SVG: no hace falta el hook de canvasLabels que el
  // clon usaba para rasterizarla.
  window.onBeforePngExport = null;
}
