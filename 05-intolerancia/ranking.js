// =============================================================
//  El Atlas N°5 — Ranking de rechazo a vecinos (chart 1)
// =============================================================
//
// Dos vistas sobre el mismo dato (% que no querría de vecinos a [categoría],
// último dato disponible por país 2017-2022, IVS = EVS+WVS):
//   - 'sel'  : barras horizontales de la selección (motor 03-futbol/talento.js)
//   - 'all'  : pared marimekko de ~92 países (motor 02-demasiado-desiguales/
//              marimekko.js: labels rotadas estilo OWID con callouts, tabla de
//              promedios regionales, spotlight por selección)
//
// Leyenda interactiva (ambas vistas): hover = atenúa las otras regiones;
// click = apaga/prende la región (saca los países del chart).
// Mediana mundial con toggle (default visible).
//
// Inputs (data-vecinos.js): VE_CATS, VE_FOTO, VE_REGION.
// State (state[1]): cat, view ('sel'|'all'), selected[], showMedian,
//                   hiddenRegions[], activeRegion.

//==================================================================
//  Constantes
//==================================================================
const RK_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const RK_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 56, left: 110 };

const RK_LATAM_REGIONS = new Set(['Latin America', 'Caribbean']);
// 13 LatAm con dato 2017+ más referencias de cada región del mundo.
// Set curado inicial (WYSIWYG: son los chips = las etiquetas). La tesis
// rioplatense + spread LatAm + referencias globales. ~17 entra limpio en el
// marimekko; el usuario agrega/saca a gusto.
const RK_DEFAULT_SELECTED = [
  'URY','ARG','BRA','CHL','PER','COL','MEX','GTM','VEN',
  'USA','FRA','ESP','ITA','JPN','TUR'
];

const RK_SVG_NS = 'http://www.w3.org/2000/svg';
const rk_ns = (tag) => document.createElementNS(RK_SVG_NS, tag);

// Márgenes por formato de PNG de la vista barras (mobile-first). Left amplio
// para los nombres de país; bottom con espacio para la leyenda de regiones.
function rk_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 44, right: 96, bottom: 128, left: 210 };
    case 'square':     return { top: 44, right: 96, bottom: 128, left: 210 };
    case 'mobile':     return { top: 34, right: 60, bottom: 108, left: 150 };
    default:           return null;
  }
}

//==================================================================
//  Helpers
//==================================================================
function rk_displayName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function rk_measureText(text, fontSize, weight) {
  if (!rk_measureText._ctx) {
    const c = document.createElement('canvas');
    rk_measureText._ctx = c.getContext('2d');
  }
  const ctx = rk_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function rk_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

function rk_regionColor(iso) {
  const reg = VE_REGION[iso];
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#5E7E96';
}
function rk_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#555';
}

function rk_isLatam(iso) { return RK_LATAM_REGIONS.has(VE_REGION[iso]); }

function rk_hidden() { return new Set(state[1].hiddenRegions || []); }

// Filas de la ola activa (WV_FOTO[cat][wave]). Cada fila:
//   [iso3, pct, year, n, evs, wvs]  (pct = combinado EVS+WVS ponderado por n)
// Fallback a VE_FOTO (último dato) si data-waves.js no está cargado.
function rk_waveRows() {
  const cat = state[1].cat, w = state[1].wave;
  if (typeof WV_FOTO !== 'undefined' && WV_FOTO[cat] && WV_FOTO[cat][w]) return WV_FOTO[cat][w];
  return (typeof VE_FOTO !== 'undefined' ? (VE_FOTO[cat] || []) : []).map(r => [r[0], r[1], r[2], r[4], null, null]);
}

// Filas de la categoría/ola activa (sin regiones apagadas), orden asc.
// Vista 'sel': solo la selección. Vista 'all': todos.
function rk_computeData() {
  const s = state[1];
  const hid = rk_hidden();
  let rows = rk_waveRows().map(r => ({
    iso: r[0], pct: r[1], year: r[2], n: r[3], evs: r[4], wvs: r[5], region: VE_REGION[r[0]]
  })).filter(r => r.region && !hid.has(r.region));
  if (s.view !== 'all') {
    const sel = new Set(s.selected);
    rows = rows.filter(r => sel.has(r.iso));
  }
  return rows;
}

// Mediana MUNDIAL de la categoría/ola: sobre TODOS los países con dato (ignora
// selección y regiones apagadas — es la referencia global).
function rk_median() {
  const rows = rk_waveRows();
  if (!rows.length) return null;
  const v = rows.map(r => r[1]);           // ya ordenado asc
  const mid = Math.floor(v.length / 2);
  const med = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return { value: med, n: v.length };
}

// Label del período de la ola activa (ej. "2017-2022").
function rk_waveLabel() {
  if (typeof WV_META === 'undefined') return '2017-2022';
  const m = WV_META.find(x => x.w === state[1].wave);
  return m ? m.label : '2017-2022';
}

//==================================================================
//  Subtítulo dinámico (con la categoría activa)
//==================================================================
function rk_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c1-subtitle"]');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;
  const tpl = (typeof t === 'function') ? t('c1-subtitle-tpl') : '';
  const cat = (typeof t === 'function') ? t('catA-' + state[1].cat) : state[1].cat;
  el.textContent = tpl.replace('{CAT}', cat).replace('{PERIODO}', rk_waveLabel());
}

//==================================================================
//  Dispatcher
//==================================================================
function drawRanking() {
  rk_updateSubtitle();
  rk_syncLegend();
  if (state[1].view === 'all') rk_drawMarimekko();
  else rk_drawBars();
  // (La tabla regional HTML de abajo la gobierna cada vista: rk_drawMarimekko
  // la muestra en mobile o cuando la flotante no entra; rk_drawBars la oculta.)
  // WYSIWYG: el buscador + chips van SIEMPRE visibles (los chips son las
  // barras en 'sel' y las etiquetas en 'all' — una sola fuente de verdad).
  const picker = document.getElementById('rk-country-picker');
  if (picker) picker.style.display = '';
  // El hint del picker cambia según la vista (qué "hacen" los chips).
  const hint = document.getElementById('rk-picker-hint');
  if (hint) {
    const k = state[1].view === 'all' ? 'c1-pick-hint-all' : 'c1-pick-hint-sel';
    hint.textContent = (typeof t === 'function') ? t(k) : '';
  }
  // Título: neutral por ahora (el insight queda en i18n para más adelante).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('1', false, { title: 'c1-title', titleNeutral: 'c1-title-neutral' });
  }
}

//==================================================================
//  Vista 'sel': barras horizontales (motor talento N°3)
//==================================================================
function rk_drawBars() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';
  // La tabla regional de abajo es exclusiva del marimekko.
  const _below = document.getElementById('mk-avg-table-mobile-wrap');
  if (_below) _below.style.display = 'none';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && rk_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = rk_computeData();
  const n = data.length;
  const med = state[1].showMedian ? rk_median() : null;
  const activeRegion = state[1].activeRegion;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24, legend: 22 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20, legend: 0 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11, legend: 0 };

  let RK_W, RK_MARGIN, RK_BAR_H, RK_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    RK_W = f.vbW; totalH = f.vbH; RK_MARGIN = rk_getMargins(editorFormat);
    RK_BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - RK_MARGIN.top - RK_MARGIN.bottom;
    RK_BAR_H = n > 0 ? (plotH - (n - 1) * RK_BAR_GAP) / n : 10;
    const fitName = Math.floor((RK_BAR_H + RK_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    RK_W = 1100;
    RK_MARGIN = mobile ? { ...RK_MARGIN_MOBILE } : { ...RK_MARGIN_DESKTOP };
    RK_BAR_H = mobile ? 42 : 20; RK_BAR_GAP = mobile ? 13 : 5;
    plotH = Math.max(40, n * (RK_BAR_H + RK_BAR_GAP) - RK_BAR_GAP);
    totalH = RK_MARGIN.top + plotH + RK_MARGIN.bottom;
  }

  let maxNameW = 0;
  data.forEach(d => {
    const w = rk_measureText(rk_displayName(d.iso), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
  });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(RK_W * 0.42);
    RK_MARGIN.left = Math.min(maxLeft, Math.max(RK_MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${RK_W} ${totalH}`);

  const plotW = RK_W - RK_MARGIN.left - RK_MARGIN.right;
  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.pct), med ? med.value : 0, 1) : 1;
  const xMax = maxPct * 1.06;
  const xScale = (v) => RK_MARGIN.left + (v / xMax) * plotW;

  const gridG = rk_ns('g'); svg.appendChild(gridG);
  const axisG = rk_ns('g'); svg.appendChild(axisG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 25, 50, 75];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = rk_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', RK_MARGIN.top);
    line.setAttribute('y2', RK_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = rk_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', RK_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = (typeof fmt === 'function') ? fmt(v, 0) : String(v);
    axisG.appendChild(lbl);
  });

  const xTitle = rk_ns('text');
  xTitle.setAttribute('x', RK_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', RK_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c1-axis-x') : '% de rechazo';
  svg.appendChild(xTitle);

  const barsG = rk_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = RK_MARGIN.top + i * (RK_BAR_H + RK_BAR_GAP);
    const latam = rk_isLatam(d.iso);
    const color = rk_regionColor(d.iso);
    const barW = xScale(d.pct) - RK_MARGIN.left;
    const dimmed = activeRegion && d.region !== activeRegion;

    const nameTxt = rk_ns('text');
    nameTxt.setAttribute('x', RK_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + RK_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', latam ? 600 : 500);
    nameTxt.setAttribute('fill', latam ? '#8B4220' : '#3A3530');
    nameTxt.textContent = rk_displayName(d.iso);
    barsG.appendChild(nameTxt);

    const rect = rk_ns('rect');
    rect.setAttribute('x', RK_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', RK_BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', dimmed ? 0.18 : 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      if (!(state[1].activeRegion && d.region !== state[1].activeRegion)) rect.setAttribute('fill-opacity', 1);
      rk_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => rk_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', (state[1].activeRegion && d.region !== state[1].activeRegion) ? 0.18 : 0.92);
      rk_hideTooltip();
    });
    // Desktop: click en la barra saca al país (criterio 11f). En touch el
    // tap es del tooltip.
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { rk_hideTooltip(); rk_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);

    const valTxt = rk_ns('text');
    valTxt.setAttribute('x', RK_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + RK_BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', dimmed ? '#B5AC9F' : '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = (typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct;
    barsG.appendChild(valTxt);
  });

  if (med) {
    const mx = xScale(med.value);
    const mline = rk_ns('line');
    mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
    mline.setAttribute('y1', RK_MARGIN.top - (bigFmt ? 8 : 6));
    mline.setAttribute('y2', RK_MARGIN.top + plotH);
    mline.setAttribute('stroke', '#8A8579');
    mline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    svg.appendChild(mline);
    const mlbl = rk_ns('text');
    const mlblTxt = ((typeof t === 'function') ? t('c1-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    const lblW = rk_measureText(mlblTxt, SIZES.medLbl, 600);
    const anchorEnd = mx + 8 + lblW > RK_W - 4;
    mlbl.setAttribute('x', anchorEnd ? mx - 8 : mx + 8);
    mlbl.setAttribute('y', RK_MARGIN.top - (bigFmt ? 16 : 12));
    mlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = SIZES.medLbl + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#7A6E62');
    mlbl.textContent = mlblTxt;
    svg.appendChild(mlbl);
  }

  const zeroLine = rk_ns('line');
  zeroLine.setAttribute('x1', RK_MARGIN.left); zeroLine.setAttribute('x2', RK_MARGIN.left);
  zeroLine.setAttribute('y1', RK_MARGIN.top);
  zeroLine.setAttribute('y2', RK_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);

  if (editorFormat && SIZES.legend > 0) {
    rk_drawSvgLegend(svg, data, RK_W, RK_MARGIN.top + plotH + (bigFmt ? 96 : 60), SIZES.legend);
  }
}

// Leyenda dentro del SVG para el PNG de la vista barras.
function rk_drawSvgLegend(svg, data, width, yStart, fontSize) {
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const seen = new Set(data.map(d => VE_REGION[d.iso]).filter(Boolean));
  const items = order.filter(r => seen.has(r)).map(r => ({
    label: (typeof t === 'function') ? t('reg.' + r) : r,
    color: (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || '#888'
  }));
  if (!items.length) return;
  const dotR = fontSize * 0.32, gapItem = fontSize * 1.15, gapDot = dotR + fontSize * 0.35;
  const widths = items.map(it => gapDot + rk_measureText(it.label, fontSize, 500) + gapItem);
  const rows = [];
  let cur = [], curW = 0;
  items.forEach((it, i) => {
    if (curW + widths[i] > width * 0.94 && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(i); curW += widths[i];
  });
  if (cur.length) rows.push(cur);
  const rowH = fontSize * 1.6;
  rows.forEach((row, ri) => {
    const rowW = row.reduce((acc, i) => acc + widths[i], 0) - gapItem;
    let x = (width - rowW) / 2;
    const y = yStart + ri * rowH;
    row.forEach(i => {
      const it = items[i];
      const dot = rk_ns('circle');
      dot.setAttribute('cx', x + dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', dotR); dot.setAttribute('fill', it.color);
      svg.appendChild(dot);
      const txt = rk_ns('text');
      txt.setAttribute('x', x + gapDot); txt.setAttribute('y', y);
      txt.setAttribute('dominant-baseline', 'central');
      txt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      txt.style.fontSize = fontSize + 'px';
      txt.setAttribute('font-weight', 500);
      txt.setAttribute('fill', '#4A4A4A');
      txt.textContent = it.label;
      svg.appendChild(txt);
      x += widths[i];
    });
  });
}

//==================================================================
//  Vista 'all': pared marimekko (motor N°2 chart-1)
//==================================================================
const MK_W_DESKTOP = 1100, MK_H_DESKTOP = 470;
const MK_W_MOBILE  = 1100, MK_H_MOBILE  = 1500;
const MK_MARGIN_DESKTOP = { top: 50, right: 32, bottom: 110, left: 56 };
const MK_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 200, left: 130 };
function mk_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'square':     return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'mobile':     return { top: 90, right: 30, bottom: 200, left: 110 };
    default:           return { top: 50, right: 32, bottom: 110, left: 56 };
  }
}
const MK_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const MK_LABEL_FONT_SIZE = 10;
const MK_LABEL_FONT_SIZE_MOBILE = 28;
// Más profundidad de filas de quiebre que el N°2 (50/5 filas): acá el default
// etiqueta ~24 países (22 seleccionados + extremos) contra ~17 de aquel, y con
// 5 filas el placement caía seguido al fallback SIN chequeo de colisión — las
// líneas guía se tocaban (reporte de Daniel, 2026-07-22).
const MK_LABEL_ANCHOR_Y_OFFSET = 82;
const MK_LABEL_ANCHOR_Y_OFFSET_MOBILE = 122;
const MK_BEND_ROW_COUNT = 11;
const MK_BEND_ROW_GAP = 8;
const MK_BEND_ROW_OFFSET = 6;
const MK_LABEL_MIN_GAP_X = 5;
const MK_CALLOUT_PAD = 3;
// Tabla de promedios regionales (arriba-derecha, sobre las barras bajas).
const MK_TABLE_X = 660, MK_TABLE_W = 408, MK_TABLE_Y_TITLE = 64, MK_TABLE_Y_FIRST = 84, MK_TABLE_ROW_H = 16;

// Algoritmo de etiquetas estilo OWID (port de m_layoutCountryLabels del N°2).
// WYSIWYG (norma de la auditoría del N°2): las etiquetas SON los chips
// (labelCodes). Sin priority list oculta ni extremos automáticos — una sola
// fuente de verdad. Todas son "must-show": se colocan con anti-colisión y solo
// se fuerzan (con overflow) si no entran limpias, así nunca se descarta un chip.
function mk_layoutCountryLabels(sortedData, barWidth, plotArea, labelCodes) {
  const present = new Set(sortedData.map(d => d.iso));
  const codesToShow = new Set((labelCodes || []).filter(c => present.has(c)));

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && rk_isMobile();
  const angle = MK_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const aeCfg2 = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeLabelSize = aeCfg2?.sizes?.labels;
  const fmtDefaultFontSize = newsletter ? 16
    : square ? 17
    : mobilePng ? 26
    : mobile ? MK_LABEL_FONT_SIZE_MOBILE
    : MK_LABEL_FONT_SIZE;
  const fontSize = aeLabelSize ?? fmtDefaultFontSize;
  const anchorYOffset = (mobile || mobilePng)
    ? MK_LABEL_ANCHOR_Y_OFFSET_MOBILE
    : MK_LABEL_ANCHOR_Y_OFFSET;
  const minGap = MK_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + anchorYOffset;
  const yAnchor = yLine + 4;

  const anchors = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.iso)) return;
    const text = rk_displayName(d.iso);
    const textW = Math.max(22, rk_measureText(text, fontSize, 500));
    const projW = cos * textW + sin * fontSize + 2;
    anchors.push({
      code: d.iso, text,
      color: rk_regionLabelColor(d.region),
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
    const pad = MK_CALLOUT_PAD;
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
      for (let r = MK_BEND_ROW_COUNT - 1; r >= 0; r--) {
        const candY = plotArea.bottom + MK_BEND_ROW_OFFSET + r * MK_BEND_ROW_GAP;
        if (candY >= yLine - 4) continue;
        if (calloutIsClear(a.barX, tx, candY)) {
          return { ...a, tx, ty: yAnchor, yLine, bendY: candY, displaced: true, fontSize };
        }
      }
      // Ninguna fila limpia con este tx → correr el texto a la derecha y
      // reintentar (la única escapatoria real cuando una H previa bloquea).
      const nextTx = findFreeTx(tx + MK_LABEL_MIN_GAP_X + 2, a.projW, allowOverflow);
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
             bendY: displaced2 ? plotArea.bottom + MK_BEND_ROW_OFFSET : null,
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

function rk_drawMarimekko() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg?.sizes;
  const aeCountries = aeCfg ? (aeCfg.countries || []) : null;

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && rk_isMobile();

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH;
    MARGIN = mk_getMargins(editorFormat);
  } else if (mobile) {
    W = MK_W_MOBILE; H = MK_H_MOBILE;
    MARGIN = { ...MK_MARGIN_MOBILE };
  } else {
    W = MK_W_DESKTOP; H = MK_H_DESKTOP;
    MARGIN = { ...MK_MARGIN_DESKTOP };
  }

  const s1 = state[1];
  // WYSIWYG: las etiquetas del marimekko SON los chips (state.selected), igual
  // que el N°2 tras la auditoría. Si el editor está activo, su lista manda.
  const labelCodes = (aeCfg && Array.isArray(aeCountries)) ? aeCountries : (s1.selected || []);
  // Mayor rechazo a la izquierda; las barras bajas (tolerantes) quedan a la
  // derecha, dejando el hueco arriba-derecha para la tabla regional.
  const data = rk_computeData().slice().sort((a, b) => b.pct - a.pct);
  const n = data.length;
  const med = s1.showMedian ? rk_median() : null;

  // Y máximo dinámico según la categoría (drogadictos llega a ~97).
  const dataMax = n ? Math.max(...data.map(d => d.pct), med ? med.value : 0) : 10;
  const yMax = Math.max(10, Math.ceil((dataMax * 1.04) / 5) * 5);

  // Bottom dinámico para que las etiquetas rotadas no se corten.
  {
    const sin45 = Math.SQRT1_2;
    const fmtLabelDefault = newsletter ? 16 : square ? 17 : mobilePng ? 26
      : mobile ? MK_LABEL_FONT_SIZE_MOBILE : MK_LABEL_FONT_SIZE;
    const labelFontSize = aeSizes?.labels ?? fmtLabelDefault;
    const aOff = (mobile || mobilePng) ? MK_LABEL_ANCHOR_Y_OFFSET_MOBILE : MK_LABEL_ANCHOR_Y_OFFSET;
    const present0 = new Set(data.map(d => d.iso));
    const codesToShow0 = new Set((labelCodes || []).filter(c => present0.has(c)));
    let maxTextW = 0;
    data.forEach(d => {
      if (!codesToShow0.has(d.iso)) return;
      const w = Math.max(22, rk_measureText(rk_displayName(d.iso), labelFontSize, 500));
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
    ? { tick: 20, axisLabel: 20, label: 16, tableTitle: 16, tableLabel: 20 }
    : square
    ? { tick: 20, axisLabel: 20, label: 17, tableTitle: 16, tableLabel: 20 }
    : mobilePng
    ? { tick: 30, axisLabel: 26, label: 26, tableTitle: 26, tableLabel: 28 }
    : mobile
    ? { tick: 32, axisLabel: 28, label: 28, tableTitle: 28, tableLabel: 30 }
    : { tick: 11, axisLabel: 10.5, label: MK_LABEL_FONT_SIZE, tableTitle: 10, tableLabel: 11 };
  const SIZES = {
    tick:       aeSizes?.ticks     ?? FMT_SIZES.tick,
    axisLabel:  aeSizes?.axisTitle ?? FMT_SIZES.axisLabel,
    label:      aeSizes?.labels    ?? FMT_SIZES.label,
    tableTitle: aeSizes?.special   ?? FMT_SIZES.tableTitle,
    tableLabel: aeSizes?.special   ?? FMT_SIZES.tableLabel
  };

  const yScale = (v) => MARGIN.top + PLOT_H - (v / yMax) * PLOT_H;
  const barWidth = n > 0 ? PLOT_W / n : PLOT_W;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // Tabla: solo desktop/PNG (en mobile va como HTML colapsable).
  const tableVisible = !mobile && n > 0;
  const tableX = mobilePng ? 520 : MK_TABLE_X;
  const tableTopY = mobilePng ? 70 : (MK_TABLE_Y_TITLE - 10);
  const tableRowH = (SIZES.tableLabel ?? 11) * 1.45;
  const regionsPresent = [];
  const seenReg = new Set();
  data.forEach(d => { if (d.region && !seenReg.has(d.region)) { seenReg.add(d.region); regionsPresent.push(d.region); } });
  const tableBottomY = (mobilePng ? 110 : MK_TABLE_Y_FIRST) + regionsPresent.length * tableRowH;

  // === Grid Y + ticks ===
  const yTicksAll = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile || mobilePng) ? 4 : 6) : [0, 20, 40, 60];
  const yTicks = yTicksAll.filter(v => v <= yMax + 0.001);
  if (!yTicks.includes(0)) yTicks.unshift(0);
  yTicks.forEach(tv => {
    const y = yScale(tv);
    const line = rk_ns('line');
    line.setAttribute('x1', MARGIN.left);
    const crossesTable = tableVisible && tv !== 0 && y >= tableTopY && y <= tableBottomY;
    line.setAttribute('x2', crossesTable ? tableX - 10 : MARGIN.left + PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', tv === 0 ? '#9C928A' : '#ECE7D8');
    line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
    const tx = rk_ns('text');
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
  const yLab = rk_ns('text');
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
  yLab.textContent = (typeof t === 'function') ? t('c1-axis-mk') : '% de rechazo';
  svg.appendChild(yLab);

  // === Barras ===
  const tooltip = document.getElementById('tooltip1');
  const barsG = rk_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const x = MARGIN.left + i * barWidth;
    const y = yScale(d.pct);
    const rect = rk_ns('rect');
    rect.setAttribute('x', x + (barWidth - barInner) / 2);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barInner);
    rect.setAttribute('height', Math.max(0.5, MARGIN.top + PLOT_H - y));
    rect.setAttribute('fill', (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[d.region]) || '#888');
    // WYSIWYG: seleccionar NO atenúa ni destaca barras (norma de la auditoría).
    // Todas a color pleno; el único dim es el hover de región en la leyenda.
    const isDimmed = s1.activeRegion && s1.activeRegion !== d.region;
    rect.setAttribute('class', 'm-bar' + (isDimmed ? ' m-dim' : ''));
    rect.dataset.iso = d.iso;
    rect.dataset.region = d.region;
    rect.addEventListener('mouseenter', (e) => rk_showTooltip(e, d));
    rect.addEventListener('mousemove', (e) => rk_positionTooltip(e));
    rect.addEventListener('mouseleave', () => rk_hideTooltip());
    // Selección por click solo en desktop (en touch el tap es del tooltip).
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { rk_hideTooltip(); rk_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);
  });

  // === Mediana mundial (línea horizontal punteada) ===
  if (med) {
    const my = yScale(med.value);
    const mline = rk_ns('line');
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
    const mlbl = rk_ns('text');
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
    mlbl.textContent = ((typeof t === 'function') ? t('c1-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    svg.appendChild(mlbl);
  }

  // === Etiquetas de país rotadas con callouts ===
  const labelsG = rk_ns('g'); svg.appendChild(labelsG);
  const plotArea = { left: MARGIN.left, right: MARGIN.left + PLOT_W, top: MARGIN.top, bottom: MARGIN.top + PLOT_H, vbRight: W };
  const placed = mk_layoutCountryLabels(data, barWidth, plotArea, labelCodes);
  placed.forEach(l => {
    const path = rk_ns('path');
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
    const txt = rk_ns('text');
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

  // === Tabla de promedios regionales ===
  const tableRows = ((typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : regionsPresent)
    .filter(r => seenReg.has(r))
    .map(r => {
      const vals = data.filter(d => d.region === r).map(d => d.pct);
      return {
        region: r,
        color: (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || '#888',
        label: (typeof t === 'function') ? t('reg.' + r) : r,
        value: vals.reduce((a, b) => a + b, 0) / vals.length
      };
    })
    .sort((a, b) => b.value - a.value);
  // ¿Entra la tabla flotante en el hueco arriba-derecha? Ocupa la franja-x
  // derecha (~60%→100% del ancho) y necesita libre el ~64% superior de esa
  // franja. Si las barras bajo la tabla son altas (ej. drogadictos: todas
  // >37%), no entra → la tabla se muestra como bloque debajo del gráfico en
  // vez de taparlas (opción elegida por Daniel, 2026-07-23).
  const tableXFrac = (MK_TABLE_X - MK_MARGIN_DESKTOP.left) / (MK_W_DESKTOP - MK_MARGIN_DESKTOP.left - MK_MARGIN_DESKTOP.right);
  const rankUnder = n > 0 ? Math.min(n - 1, Math.floor(tableXFrac * n)) : 0;
  const maxUnderTable = n > 0 ? data[rankUnder].pct : 0;   // data ya está desc
  const tableFits = maxUnderTable < 0.36 * yMax;
  // El toggle "Tabla regional" (state.showTable) gobierna si se muestra; el
  // heurístico solo decide flotante-vs-abajo cuando sí se muestra.
  const wantTable = s1.showTable !== false;
  const showSvgTable = wantTable && tableVisible && tableFits;
  if (showSvgTable) {
    mk_drawRegionalAvgTable(svg, tableRows, s1.activeRegion, SIZES, mobilePng);
  }
  mk_drawRegionalAvgTableHTML(tableRows, s1.activeRegion);
  // Tabla HTML debajo del gráfico: en mobile SIEMPRE (si wantTable); en desktop
  // solo cuando la flotante no entra. Con el toggle apagado, no aparece.
  const belowWrap = document.getElementById('mk-avg-table-mobile-wrap');
  if (belowWrap) {
    const showBelow = wantTable && !showSvgTable;
    belowWrap.style.display = showBelow ? 'block' : 'none';
    const det = belowWrap.querySelector('details');
    if (det && !mobile) det.open = showBelow;
  }
}

function mk_drawRegionalAvgTable(svg, rows, activeRegion, SIZES, mobilePng) {
  const titleSize = SIZES?.tableTitle;
  const labelSize = SIZES?.tableLabel;
  const rowFactor = 1.45, swatchFactor = 0.82, gapFactor = 0.64;
  const base = labelSize ?? 11;
  const rowH = base * rowFactor;
  const swatchSize = base * swatchFactor;
  const swatchGap = base * gapFactor;
  // Más aire entre el título "PROMEDIO POR REGIÓN" y la primera fila (pedido de
  // Daniel 2026-07-23): ~2.4 alturas de fila bajo el título (antes ~20px, ahora ~26).
  const titleGap = base * 2.4;
  const yFirst = (mobilePng ? 84 : MK_TABLE_Y_TITLE) + titleGap;
  const tableX = mobilePng ? 520 : MK_TABLE_X;
  const tableW = mobilePng ? 540 : MK_TABLE_W;
  const tableYTitle = mobilePng ? 80 : MK_TABLE_Y_TITLE;
  const ruleY = tableYTitle + base * 0.7;
  const g = rk_ns('g');
  g.setAttribute('id', 'mk-avg-table');
  svg.appendChild(g);

  const title = rk_ns('text');
  title.setAttribute('class', 'm-table-title');
  title.setAttribute('x', tableX);
  title.setAttribute('y', tableYTitle);
  if (titleSize) title.style.fontSize = titleSize + 'px';
  title.textContent = (typeof t === 'function') ? t('c1-avg-table-title') : 'Promedio por región';
  g.appendChild(title);

  const rule = rk_ns('line');
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
    const stateClass = (isActive ? ' m-table-row-active' : '') + (isDimmed ? ' m-table-row-dimmed' : '');

    const swatch = rk_ns('rect');
    swatch.setAttribute('class', 'm-table-swatch' + stateClass);
    swatch.setAttribute('x', tableX);
    swatch.setAttribute('y', y - swatchSize + 1);
    swatch.setAttribute('width', swatchSize);
    swatch.setAttribute('height', swatchSize);
    swatch.setAttribute('fill', row.color);
    g.appendChild(swatch);

    const labelEl = rk_ns('text');
    labelEl.setAttribute('class', 'm-table-label' + stateClass);
    labelEl.setAttribute('x', tableX + swatchSize + swatchGap);
    labelEl.setAttribute('y', y);
    if (labelSize) labelEl.style.fontSize = labelSize + 'px';
    labelEl.textContent = row.label;
    g.appendChild(labelEl);

    const valueEl = rk_ns('text');
    valueEl.setAttribute('class', 'm-table-value' + stateClass);
    if (labelSize) valueEl.style.fontSize = labelSize + 'px';
    valueEl.setAttribute('x', tableX + tableW);
    valueEl.setAttribute('y', y);
    valueEl.setAttribute('text-anchor', 'end');
    valueEl.textContent = (typeof fmt === 'function') ? fmt(row.value, 1) : row.value.toFixed(1);
    g.appendChild(valueEl);
  });
}

// Tabla HTML colapsable (solo visible en mobile vía CSS).
function mk_drawRegionalAvgTableHTML(rows, activeRegion) {
  const container = document.getElementById('mk-avg-table-mobile');
  if (!container) return;
  container.innerHTML = rows.map(row => {
    const isActive = activeRegion === row.region;
    const isDimmed = activeRegion && !isActive;
    const cls = 'm-mt-row' + (isActive ? ' m-mt-row-active' : '') + (isDimmed ? ' m-mt-row-dimmed' : '');
    return `<div class="${cls}">
      <span class="m-mt-swatch" style="background:${row.color}"></span>
      <span class="m-mt-label">${row.label}</span>
      <span class="m-mt-value">${(typeof fmt === 'function') ? fmt(row.value, 1) : row.value.toFixed(1)}</span>
    </div>`;
  }).join('');
}

//==================================================================
//  Leyenda interactiva de regiones (ambas vistas)
//  hover: atenúa las demás · click: apaga/prende la región
//
//  OJO: la leyenda se CONSTRUYE una vez por categoría/idioma
//  (rk_buildLegend) y los redraws solo sincronizan clases
//  (rk_syncLegend). Si el redraw reconstruyera los chips, el chip bajo
//  el cursor se destruiría a mitad del hover: el mouseleave nunca
//  llegaría (dim colgado) y el click caería en un nodo muerto — bug
//  real reportado por Daniel (2026-07-22).
//==================================================================
function rk_buildLegend() {
  const cont = document.getElementById('rk-legend');
  if (!cont) return;
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const cat = state[1].cat;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const key = cat + '|' + lang + '|' + state[1].wave;
  if (cont.dataset.built === key) { rk_syncLegend(); return; }
  cont.dataset.built = key;
  const present = new Set(rk_waveRows().map(r => VE_REGION[r[0]]).filter(Boolean));
  cont.innerHTML = '';
  order.filter(r => present.has(r)).forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'rk-leg-item';
    chip.dataset.region = region;
    const col = (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[region]) || '#888';
    chip.innerHTML = `<span class="rk-leg-dot" style="background:${col}"></span>${(typeof t === 'function') ? t('reg.' + region) : region}`;
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        if (rk_hidden().has(region)) return;
        state[1].activeRegion = region;
        drawRanking();
      });
      chip.addEventListener('mouseleave', () => {
        if (state[1].activeRegion !== region) return;
        state[1].activeRegion = null;
        drawRanking();
      });
    }
    chip.addEventListener('click', () => {
      const arr = state[1].hiddenRegions || (state[1].hiddenRegions = []);
      const idx = arr.indexOf(region);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(region);
      if (state[1].activeRegion === region) state[1].activeRegion = null;
      drawRanking();
    });
    cont.appendChild(chip);
  });
  rk_syncLegend();
}

// Sincroniza el estado on/off de los chips sin reconstruir el DOM.
function rk_syncLegend() {
  const cont = document.getElementById('rk-legend');
  if (!cont) return;
  const hid = rk_hidden();
  cont.querySelectorAll('.rk-leg-item').forEach(chip => {
    chip.classList.toggle('rk-leg-off', hid.has(chip.dataset.region));
  });
}

//==================================================================
//  Tooltip (compartido por ambas vistas)
//==================================================================
function rk_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const reg = d.region ? tt('reg.' + d.region, d.region) : '';
  const F = (v) => (typeof fmt === 'function') ? fmt(v, 1) : v;
  // Cuando el país tiene EVS y WVS en la misma ola, mostramos ambos para que se
  // vea la consistencia (o su ausencia) entre encuestas (pedido de Daniel).
  const both = d.evs != null && d.wvs != null;
  const consistency = both
    ? `<div class="tt-row"><span>EVS</span><span>${F(d.evs)}%</span></div>`
      + `<div class="tt-row"><span>WVS</span><span>${F(d.wvs)}%</span></div>`
    : `<div class="tt-row"><span>${tt('c1-tt-survey', 'Encuesta')}</span><span>${d.evs != null ? 'EVS' : 'WVS'} ${d.year}</span></div>`;
  tooltip.innerHTML = `
    <strong>${rk_displayName(d.iso)}</strong>
    <div class="tt-sub">${reg} · ${rk_waveLabel()}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c1-tt-pct', 'Rechazo declarado')}</span><span>${F(d.pct)}%${both ? ' *' : ''}</span></div>
    ${consistency}
    <div class="tt-row"><span>${tt('c1-tt-n', 'Muestra')}</span><span>${(typeof fmt === 'function') ? fmt(d.n, 0) : d.n}</span></div>
    ${both ? `<div class="tt-sub" style="margin-top:3px;">${tt('c1-tt-both', '* promedio de ambas encuestas')}</div>` : ''}
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  rk_positionTooltip(event);
}

function rk_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip1');
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

function rk_hideTooltip() {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Controles: categoría + vista + mediana
//==================================================================
function setupRankingCat() {
  const sel = document.getElementById('rk-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!VE_FOTO[sel.value]) return;
    state[1].cat = sel.value;
    rk_buildLegend();   // las regiones presentes pueden cambiar con la categoría
    drawRanking();
  });
}

function setupRankingView() {
  document.querySelectorAll('#rk-view button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v !== 'sel' && v !== 'all') return;
      if (state[1].view === v) return;
      state[1].view = v;
      document.querySelectorAll('#rk-view button')
        .forEach(b => b.classList.toggle('active', b.dataset.view === v));
      drawRanking();
    });
  });
}

// Slider de OLA: un solo thumb sobre las olas presentes (WV_META). Al moverlo
// se ve la misma categoría en distintas ondas EVS/WVS. Default: la más reciente.
function setupRankingWave() {
  const input = document.getElementById('rk-wave-slider');
  const disp = document.getElementById('rk-wave-display');
  if (!input || typeof WV_META === 'undefined' || !WV_META.length) {
    const grp = document.getElementById('rk-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = WV_META;   // asc por ola
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  const sync = () => {
    input.value = idxOf(state[1].wave);
    if (disp) disp.textContent = rk_waveLabel();
  };
  input.addEventListener('input', () => {
    const w = waves[+input.value].w;
    if (w === state[1].wave) return;
    state[1].wave = w;
    if (disp) disp.textContent = rk_waveLabel();
    rk_buildLegend();   // las regiones presentes cambian según la ola
    drawRanking();
  });
  sync();
}

// Toggle unificado "Referencias": Mediana y Tabla regional, cada uno on/off
// independiente (ambos, uno o ninguno). Reemplaza los dos toggles mostrar/ocultar
// (pedido de Daniel 2026-07-23). El botón activo = referencia visible.
function setupRankingRefs() {
  document.querySelectorAll('#rk-refs button[data-ref]').forEach(btn => {
    const key = btn.dataset.ref === 'table' ? 'showTable' : 'showMedian';
    btn.classList.toggle('active', state[1][key] !== false);
    btn.addEventListener('click', () => {
      state[1][key] = !(state[1][key] !== false);   // toggle
      btn.classList.toggle('active', state[1][key]);
      drawRanking();
    });
  });
}

//==================================================================
//  Buscador de países + chips (vista 'sel'; en 'all' la selección
//  espejea como spotlight + etiqueta)
//==================================================================
function rk_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function rk_searchableCountries() {
  const isos = new Set();
  VE_CATS.forEach(c => (VE_FOTO[c] || []).forEach(r => isos.add(r[0])));
  return Array.from(isos)
    .sort((a, b) => rk_displayName(a).localeCompare(rk_displayName(b), 'es'))
    .map(iso => ({ iso, name: rk_displayName(iso) }));
}

function rk_toggleSelect(iso) {
  const arr = state[1].selected;
  const idx = arr.indexOf(iso);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(iso);
  renderRankingChips();
  drawRanking();
}

function renderRankingChips() {
  const container = document.getElementById('rk-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  const arr = state[1].selected.slice()
    .sort((a, b) => rk_displayName(a).localeCompare(rk_displayName(b), 'es'));
  arr.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = rk_regionColor(iso);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(rk_displayName(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => rk_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupRankingSearch() {
  const input = document.getElementById('rk-search');
  const results = document.getElementById('rk-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = rk_normalize(q);
    return rk_searchableCountries()
      .filter(c => rk_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[1].selected.includes(c.iso);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        rk_toggleSelect(el.dataset.iso);
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
      rk_toggleSelect(currentMatches[activeIdx].iso);
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
//  Download CSV — todas las categorías, todos los países (foto 2017+)
//==================================================================
function setupRankingDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="1-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += '# El Atlas N°5 — Rechazo declarado a distintos tipos de vecinos (IVS: EVS+WVS)\n';
      csv += '# Todas las olas por pais. pct = % ponderado combinado (EVS+WVS) que menciona al\n';
      csv += '# grupo como vecino no deseado; evs/wvs = valor de cada estudio en esa ola.\n';
      csv += 'iso3,name,region,category,wave,period,pct,year,n,evs,wvs\n';
      const waves = (typeof WV_META !== 'undefined') ? WV_META : [{ w: 7, label: '2017-2022' }];
      const src = (typeof WV_FOTO !== 'undefined') ? WV_FOTO : null;
      VE_CATS.forEach(cat => {
        waves.forEach(m => {
          const rows = src ? (src[cat] && src[cat][m.w]) : (m.w === 7 ? (VE_FOTO[cat] || []).map(r => [r[0], r[1], r[2], r[4], null, null]) : null);
          (rows || []).forEach(r => {
            const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]])
              ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
            const nameQ = (name.includes(',')) ? '"' + name + '"' : name;
            csv += [r[0], nameQ, VE_REGION[r[0]] || '', cat, m.w, m.label, r[1], r[2], r[3], r[4] == null ? '' : r[4], r[5] == null ? '' : r[5]].join(',') + '\n';
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lang === 'en'
        ? 'the-atlas-05-unwanted-neighbours.csv'
        : 'el-atlas-05-vecinos-no-deseados.csv';
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
function initRanking() {
  const lastWave = (typeof WV_META !== 'undefined' && WV_META.length) ? WV_META[WV_META.length - 1].w : 7;
  if (!state[1]) {
    state[1] = {
      cat: 'otra_raza',
      view: 'sel',
      wave: lastWave,            // default = ola más reciente (== "último dato >=2017")
      selected: [...RK_DEFAULT_SELECTED],
      showMedian: true,
      showTable: true,
      hiddenRegions: [],
      activeRegion: null
    };
  }
  if (state[1].wave == null) state[1].wave = lastWave;

  setupRankingCat();
  setupRankingView();
  setupRankingRefs();
  setupRankingWave();
  setupRankingSearch();
  setupRankingDownloadCSV();
  renderRankingChips();
  rk_buildLegend();
  drawRanking();

  if (!initRanking._editorWired) {
    initRanking._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawRanking());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawRanking;

  // Nota "Datos" corta del PNG, con el rango de años realmente mostrado.
  window.onBeforePngExportGetSourceText = function(chartId) {
    if (chartId !== '1') return null;
    const tpl = (typeof t === 'function') ? t('c1-sources-tpl') : '';
    if (!tpl) return null;
    const data = rk_computeData();
    const years = data.map(d => d.year);
    const y = years.length ? Math.min(...years) + '-' + Math.max(...years) : '2017-2022';
    return tpl.replace('{Y}', y);
  };

  // Marimekko: los textos de la tabla regional van al canvas (las webfonts
  // no resuelven bien dentro del <img> SVG rasterizado — port del N°2).
  window.onBeforePngExport = function(svgClone, chartId) {
    if (chartId !== '1') return;
    const tableEl = svgClone.querySelector('#mk-avg-table');
    if (!tableEl) return;
    const canvasLabels = [];
    const readFS = (el, fb) => {
      const v = parseFloat(el.style.fontSize);
      return Number.isFinite(v) && v > 0 ? v : fb;
    };
    const titleEl = tableEl.querySelector('.m-table-title');
    if (titleEl) {
      canvasLabels.push({
        x: parseFloat(titleEl.getAttribute('x')), y: parseFloat(titleEl.getAttribute('y')),
        text: titleEl.textContent.toUpperCase(), fill: '#8A8579', weight: '600',
        size: readFS(titleEl, 10), textAnchor: 'start'
      });
      titleEl.style.display = 'none';
    }
    tableEl.querySelectorAll('.m-table-label, .m-table-value').forEach(el => {
      canvasLabels.push({
        x: parseFloat(el.getAttribute('x')), y: parseFloat(el.getAttribute('y')),
        text: el.textContent, fill: '#1A1A1A', weight: '500',
        size: readFS(el, 11), textAnchor: el.getAttribute('text-anchor') || 'start'
      });
      el.style.display = 'none';
    });
    return { canvasLabels };
  };
}
