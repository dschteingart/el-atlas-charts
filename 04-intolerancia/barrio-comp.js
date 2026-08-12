// =============================================================
//  El Atlas N°4 — Comparación de barrios (chart 13)
// =============================================================
//
// CLON de ranking.js (regla de oro: clonar el motor, no reimplementar).
// Dos vistas sobre el mismo dato (% que dice que [ítem de la batería H002 del
// WVS] pasa muy o bastante seguido en su barrio; olas 6 y 7):
//   - 'sel'  : barras horizontales de la selección (motor 03-futbol/talento.js)
//   - 'all'  : pared marimekko de ~92 países (motor 02-demasiado-desiguales/
//              marimekko.js: labels rotadas estilo OWID con callouts, tabla de
//              promedios regionales, spotlight por selección)
//
// Leyenda interactiva (ambas vistas): hover = atenúa las otras regiones;
// click = apaga/prende la región (saca los países del chart).
// Mediana mundial con toggle (default visible).
//
// Inputs (data-barrio.js): BA_ITEMS, BA_FOTO (por ola), BA_META, BA_REGION.
// State (state[13]): cat, view ('sel'|'all'), selected[], showMedian,
//                   hiddenRegions[], activeRegion.

//==================================================================
//  Constantes
//==================================================================
const BC_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const BC_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 56, left: 110 };

const BC_LATAM_REGIONS = new Set(['Latin America', 'Caribbean']);
// Set curado inicial (WYSIWYG: son los chips = las etiquetas): LatAm con dato
// + referencias globales presentes en la ola 7 de la batería H002.
// Verificado contra BA_FOTO.racismo['7'] — ESP y ZAF no tienen ola 7, afuera.
const BC_DEFAULT_SELECTED = [
  'ARG','BRA','CHL','MEX','PER','URY',
  'USA','DEU','JPN','IND','TUR'
];

// Olas disponibles de la batería (BA_META.waves = [{w,label},...], asc por ola).
const BC_WAVES = (typeof BA_META !== 'undefined' && BA_META.waves) ? BA_META.waves : [];

const BC_SVG_NS = 'http://www.w3.org/2000/svg';
const bc_ns = (tag) => document.createElementNS(BC_SVG_NS, tag);

// Márgenes por formato de PNG de la vista barras (mobile-first). Left amplio
// para los nombres de país; bottom con espacio para la leyenda de regiones.
function bc_getMargins(format) {
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
function bc_displayName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function bc_measureText(text, fontSize, weight) {
  if (!bc_measureText._ctx) {
    const c = document.createElement('canvas');
    bc_measureText._ctx = c.getContext('2d');
  }
  const ctx = bc_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function bc_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

function bc_regionColor(iso) {
  const reg = BA_REGION[iso];
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#5E7E96';
}
function bc_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#555';
}

function bc_isLatam(iso) { return BC_LATAM_REGIONS.has(BA_REGION[iso]); }

function bc_hidden() { return new Set(state[13].hiddenRegions || []); }

// Filas del ítem/ola activos, mapeadas a la forma que espera el motor.
// BA_FOTO[item][ola] = [[iso3, pct, year, rank, n], ...] (asc por pct; las
// claves de ola son strings "6"/"7") → [iso, pct, year, n, evs, wvs, rank].
// evs/wvs no existen en esta batería (es solo WVS): van null.
function bc_waveRows() {
  const item = state[13].cat, w = state[13].wave;
  const byWave = (typeof BA_FOTO !== 'undefined' && BA_FOTO[item]) ? BA_FOTO[item] : {};
  const rows = byWave[String(w)] || byWave[w] || [];
  return rows.map(r => [r[0], r[1], r[2], r[4], null, null, r[3]]);
}

// Filas de la categoría/ola activa (sin regiones apagadas), orden asc.
// Vista 'sel': solo la selección. Vista 'all': todos.
function bc_computeData() {
  const s = state[13];
  const hid = bc_hidden();
  let rows = bc_waveRows().map(r => ({
    iso: r[0], pct: r[1], year: r[2], n: r[3], rank: r[6], region: BA_REGION[r[0]]
  })).filter(r => r.region && !hid.has(r.region));
  if (s.view !== 'all') {
    const sel = new Set(s.selected);
    rows = rows.filter(r => sel.has(r.iso));
  }
  return rows;
}

// Mediana MUNDIAL de la categoría/ola: sobre TODOS los países con dato (ignora
// selección y regiones apagadas — es la referencia global).


// Estadistico MUNDIAL de la celda activa: sobre TODOS los paises con dato
// (ignora seleccion y regiones apagadas — es la referencia global).
// Mediana o promedio segun el toggle: la linea y la tabla regional tienen que
// mostrar el MISMO estadistico. Antes la linea era mediana y la tabla promedios
// (peras con manzanas, reporte de Daniel 2026-07-27).
function bc_isMean() { return state[13].stat === 'mean'; }
function bc_agg(vals) {
  if (!vals.length) return null;
  if (bc_isMean()) return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  const v = vals.slice().sort(function (a, b) { return a - b; });
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function bc_median() {
  const rows = bc_waveRows();
  if (!rows.length) return null;
  const vals = rows.map(function (r) { return r[1]; });
  return { value: bc_agg(vals), n: vals.length };
}

// Label del período de la ola activa (ej. "2017-2023").
function bc_waveLabel() {
  const m = BC_WAVES.find(x => x.w === state[13].wave);
  return m ? m.label : '2017-2023';
}

// Universo del puesto mundial: países con los cinco ítems en la ola activa.
function bc_universe() {
  if (typeof BA_META === 'undefined' || !BA_META.n_countries) return null;
  const u = BA_META.n_countries[String(state[13].wave)];
  return (u != null) ? u : BA_META.n_countries[state[13].wave];
}

// Rótulo del puesto mundial ("5° de 64" / "#5 of 64") — reusa el tpl del perfil.
function bc_rankLabel(rank, n) {
  const tpl = (typeof t === 'function') ? t('c8-rank-tpl') : '{R}/{N}';
  return tpl.replace('{R}', rank).replace('{N}', n != null ? n : '?');
}

//==================================================================
//  Subtítulo dinámico (con la categoría activa)
//==================================================================
function bc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c13-subtitle-tpl"]');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;
  const tpl = (typeof t === 'function') ? t('c13-subtitle-tpl') : '';
  // El label del ítem sale directo de las claves del perfil (c8-item-*).
  const item = (typeof t === 'function') ? t('c8-item-' + state[13].cat) : state[13].cat;
  el.textContent = tpl.replace('{ITEM}', item).replace('{PERIODO}', bc_waveLabel());
}

//==================================================================
//  Dispatcher
//==================================================================
function drawBarrioComp() {
  bc_updateSubtitle();
  bc_syncLegend();
  if (state[13].view === 'all') bc_drawMarimekko();
  else bc_drawBars();
  // (La tabla regional HTML de abajo la gobierna cada vista: bc_drawMarimekko
  // la muestra en mobile o cuando la flotante no entra; bc_drawBars la oculta.)
  // WYSIWYG: el buscador + chips van SIEMPRE visibles (los chips son las
  // barras en 'sel' y las etiquetas en 'all' — una sola fuente de verdad).
  const picker = document.getElementById('bc-country-picker');
  if (picker) picker.style.display = '';
  // El hint del picker cambia según la vista (qué "hacen" los chips).
  const hint = document.getElementById('bc-picker-hint');
  if (hint) {
    const k = state[13].view === 'all' ? 'c13-pick-hint-all' : 'c13-pick-hint-sel';
    hint.textContent = (typeof t === 'function') ? t(k) : '';
  }
  // Título: neutral por ahora (el insight queda en i18n para más adelante).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('13', false, { title: 'c13-title', titleNeutral: 'c13-title-neutral' });
  }
}

//==================================================================
//  Vista 'sel': barras horizontales (motor talento N°3)
//==================================================================
function bc_drawBars() {
  const svg = document.getElementById('chart13');
  if (!svg) return;
  svg.innerHTML = '';
  // La tabla regional de abajo es exclusiva del marimekko.
  const _below = document.getElementById('bcm-avg-table-mobile-wrap');
  if (_below) _below.style.display = 'none';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && bc_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = bc_computeData();
  const n = data.length;
  const med = state[13].showMedian ? bc_median() : null;
  const activeRegion = state[13].activeRegion;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24, legend: 22 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20, legend: 0 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11, legend: 0 };

  let BC_W, BC_MARGIN, BC_BAR_H, BC_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    BC_W = f.vbW; totalH = f.vbH; BC_MARGIN = bc_getMargins(editorFormat);
    BC_BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - BC_MARGIN.top - BC_MARGIN.bottom;
    BC_BAR_H = n > 0 ? (plotH - (n - 1) * BC_BAR_GAP) / n : 10;
    const fitName = Math.floor((BC_BAR_H + BC_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    BC_W = 1100;
    BC_MARGIN = mobile ? { ...BC_MARGIN_MOBILE } : { ...BC_MARGIN_DESKTOP };
    BC_BAR_H = mobile ? 42 : 20; BC_BAR_GAP = mobile ? 13 : 5;
    plotH = Math.max(40, n * (BC_BAR_H + BC_BAR_GAP) - BC_BAR_GAP);
    totalH = BC_MARGIN.top + plotH + BC_MARGIN.bottom;
  }

  let maxNameW = 0;
  data.forEach(d => {
    const w = bc_measureText(bc_displayName(d.iso), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
  });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(BC_W * 0.42);
    BC_MARGIN.left = Math.min(maxLeft, Math.max(BC_MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${BC_W} ${totalH}`);

  const plotW = BC_W - BC_MARGIN.left - BC_MARGIN.right;
  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.pct), med ? med.value : 0, 1) : 1;
  const xMax = maxPct * 1.06;
  const xScale = (v) => BC_MARGIN.left + (v / xMax) * plotW;

  const gridG = bc_ns('g'); svg.appendChild(gridG);
  const axisG = bc_ns('g'); svg.appendChild(axisG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 25, 50, 75];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = bc_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', BC_MARGIN.top);
    line.setAttribute('y2', BC_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = bc_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', BC_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = (typeof fmt === 'function') ? fmt(v, 0) : String(v);
    axisG.appendChild(lbl);
  });

  const xTitle = bc_ns('text');
  xTitle.setAttribute('x', BC_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', BC_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c13-axis-x') : '% que lo ve seguido en su barrio';
  svg.appendChild(xTitle);

  const barsG = bc_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = BC_MARGIN.top + i * (BC_BAR_H + BC_BAR_GAP);
    const latam = bc_isLatam(d.iso);
    const color = bc_regionColor(d.iso);
    const barW = xScale(d.pct) - BC_MARGIN.left;
    const dimmed = activeRegion && d.region !== activeRegion;

    const nameTxt = bc_ns('text');
    nameTxt.setAttribute('x', BC_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + BC_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', latam ? 600 : 500);
    nameTxt.setAttribute('fill', latam ? '#8B4220' : '#3A3530');
    nameTxt.textContent = bc_displayName(d.iso);
    barsG.appendChild(nameTxt);

    const rect = bc_ns('rect');
    rect.setAttribute('x', BC_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', BC_BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', dimmed ? 0.18 : 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      if (!(state[13].activeRegion && d.region !== state[13].activeRegion)) rect.setAttribute('fill-opacity', 1);
      bc_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => bc_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', (state[13].activeRegion && d.region !== state[13].activeRegion) ? 0.18 : 0.92);
      bc_hideTooltip();
    });
    // Desktop: click en la barra saca al país (criterio 11f). En touch el
    // tap es del tooltip.
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { bc_hideTooltip(); bc_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);

    const valTxt = bc_ns('text');
    valTxt.setAttribute('x', BC_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + BC_BAR_H / 2);
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
    const mline = bc_ns('line');
    mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
    mline.setAttribute('y1', BC_MARGIN.top - (bigFmt ? 8 : 6));
    mline.setAttribute('y2', BC_MARGIN.top + plotH);
    mline.setAttribute('stroke', '#8A8579');
    mline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    svg.appendChild(mline);
    const mlbl = bc_ns('text');
    const mlblTxt = ((typeof t === 'function') ? t(bc_isMean() ? 'c13-mean-lbl' : 'c13-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    const lblW = bc_measureText(mlblTxt, SIZES.medLbl, 600);
    const anchorEnd = mx + 8 + lblW > BC_W - 4;
    mlbl.setAttribute('x', anchorEnd ? mx - 8 : mx + 8);
    mlbl.setAttribute('y', BC_MARGIN.top - (bigFmt ? 16 : 12));
    mlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = SIZES.medLbl + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#7A6E62');
    mlbl.textContent = mlblTxt;
    svg.appendChild(mlbl);
  }

  const zeroLine = bc_ns('line');
  zeroLine.setAttribute('x1', BC_MARGIN.left); zeroLine.setAttribute('x2', BC_MARGIN.left);
  zeroLine.setAttribute('y1', BC_MARGIN.top);
  zeroLine.setAttribute('y2', BC_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);

  if (editorFormat && SIZES.legend > 0) {
    bc_drawSvgLegend(svg, data, BC_W, BC_MARGIN.top + plotH + (bigFmt ? 96 : 60), SIZES.legend);
  }
}

// Leyenda dentro del SVG para el PNG de la vista barras.
function bc_drawSvgLegend(svg, data, width, yStart, fontSize) {
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const seen = new Set(data.map(d => BA_REGION[d.iso]).filter(Boolean));
  const items = order.filter(r => seen.has(r)).map(r => ({
    label: (typeof t === 'function') ? t('reg.' + r) : r,
    color: (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || '#888'
  }));
  if (!items.length) return;
  const dotR = fontSize * 0.32, gapItem = fontSize * 1.15, gapDot = dotR + fontSize * 0.35;
  const widths = items.map(it => gapDot + bc_measureText(it.label, fontSize, 500) + gapItem);
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
      const dot = bc_ns('circle');
      dot.setAttribute('cx', x + dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', dotR); dot.setAttribute('fill', it.color);
      svg.appendChild(dot);
      const txt = bc_ns('text');
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
const BCM_W_DESKTOP = 1100, BCM_H_DESKTOP = 470;
const BCM_W_MOBILE  = 1100, BCM_H_MOBILE  = 1500;
const BCM_MARGIN_DESKTOP = { top: 50, right: 32, bottom: 110, left: 56 };
const BCM_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 200, left: 130 };
function bcm_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'square':     return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'mobile':     return { top: 90, right: 30, bottom: 200, left: 110 };
    default:           return { top: 50, right: 32, bottom: 110, left: 56 };
  }
}
const BCM_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const BCM_LABEL_FONT_SIZE = 10;
const BCM_LABEL_FONT_SIZE_MOBILE = 28;
// Más profundidad de filas de quiebre que el N°2 (50/5 filas): acá el default
// etiqueta ~24 países (22 seleccionados + extremos) contra ~17 de aquel, y con
// 5 filas el placement caía seguido al fallback SIN chequeo de colisión — las
// líneas guía se tocaban (reporte de Daniel, 2026-07-22).
const BCM_LABEL_ANCHOR_Y_OFFSET = 82;
const BCM_LABEL_ANCHOR_Y_OFFSET_MOBILE = 122;
const BCM_BEND_ROW_COUNT = 11;
const BCM_BEND_ROW_GAP = 8;
const BCM_BEND_ROW_OFFSET = 6;
const BCM_LABEL_MIN_GAP_X = 5;
// Separación mínima entre ANCLAS de dos etiquetas rotadas, en alturas de
// línea: a 45° las etiquetas son franjas paralelas y con ~2,3 no se tocan
// (OWID usa el mismo criterio). NO es el ancho del nombre.
const BCM_LABEL_GAP_K = 2.3;
const BCM_CALLOUT_PAD = 3;
// Tabla de promedios regionales (arriba-derecha, sobre las barras bajas).
const BCM_TABLE_X = 660, BCM_TABLE_W = 408, BCM_TABLE_Y_TITLE = 64, BCM_TABLE_Y_FIRST = 84, BCM_TABLE_ROW_H = 16;

// Algoritmo de etiquetas estilo OWID (port de m_layoutCountryLabels del N°2).
// WYSIWYG (norma de la auditoría del N°2): las etiquetas SON los chips
// (labelCodes). Sin priority list oculta ni extremos automáticos — una sola
// fuente de verdad. Todas son "must-show": se colocan con anti-colisión y solo
// se fuerzan (con overflow) si no entran limpias, así nunca se descarta un chip.
function bcm_layoutCountryLabels(sortedData, barWidth, plotArea, labelCodes) {
  const present = new Set(sortedData.map(d => d.iso));
  const codesToShow = new Set((labelCodes || []).filter(c => present.has(c)));

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && bc_isMobile();
  const angle = BCM_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const aeCfg2 = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const fmtDefaultFontSize = newsletter ? 16
    : square ? 17
    : mobilePng ? 26
    : mobile ? BCM_LABEL_FONT_SIZE_MOBILE
    : BCM_LABEL_FONT_SIZE;
  const fontSize = atlasEditorSize(aeCfg2 && aeCfg2.sizes, 'labels', fmtDefaultFontSize);
  const anchorYOffset = (mobile || mobilePng)
    ? BCM_LABEL_ANCHOR_Y_OFFSET_MOBILE
    : BCM_LABEL_ANCHOR_Y_OFFSET;
  const minGap = BCM_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + anchorYOffset;
  const yAnchor = yLine + 4;

  const anchors = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.iso)) return;
    const text = bc_displayName(d.iso);
    const textW = Math.max(22, bc_measureText(text, fontSize, 500));
    const projW = cos * textW + sin * fontSize + 2;
    anchors.push({
      code: d.iso, text,
      color: bc_regionLabelColor(d.region),
      barX: plotArea.left + i * barWidth + barWidth / 2,
      textW, projW
    });
  });

  // ===================== Colocación: técnica del Marimekko de OWID =====================
  // ANTES: empaquetado voraz de izquierda a derecha que SOLO podía correr las
  // etiquetas hacia la derecha y, al chocar contra el borde del viewBox, las
  // DESCARTABA en silencio — aunque fueran países elegidos por el lector
  // (reporte de Daniel 2026-07-29: "selecciono países y a veces no los muestra").
  // Se reemplaza por lo que hace OWID en MarimekkoChart.tsx
  // (labelsWithPlacementInfo), con dos cambios de fondo:
  //
  //   1. EL ANCHO DE COLISIÓN ES EL ALTO DE LÍNEA, no el ancho proyectado del
  //      texto. Dos etiquetas rotadas 45° son franjas PARALELAS: no se pisan
  //      mientras sus anclas estén separadas ~2,3 alturas de línea, aunque sus
  //      proyecciones horizontales se superpongan. Medir con el ancho proyectado
  //      reservaba de 2 a 4 veces más lugar del necesario, y por eso el espacio
  //      se agotaba tan pronto.
  //   2. TRES PASADAS en vez de una: izquierda→derecha, clamp del extremo
  //      derecho y derecha→izquierda. La tercera es la clave: propaga el tope
  //      del borde hacia adentro. Sin ella, el clamp del último lo hace pisar al
  //      anteúltimo — o desaparecer. Es lo que vuelve innecesario espejar la "L".
  //
  // GARANTÍA: ninguna etiqueta se descarta. Si el conjunto no entra ni usando
  // todo el ancho del SVG, se aceptan roces (que se ven y se pueden corregir
  // sacando un chip) antes que una ausencia muda.
  const orderedAnchors = anchors.slice().sort((a, b) => a.barX - b.barX);
  const nLbl = orderedAnchors.length;
  const gapX = fontSize * BCM_LABEL_GAP_K;
  const hardRight = (plotArea.vbRight || (plotArea.right + 40)) - 6;
  const hardLeft = 2;
  const xs = orderedAnchors.map(a => a.barX);
  // El ancla es el extremo DERECHO del texto (rotado -45°, anchor 'end'): el
  // texto se despliega hacia abajo-izquierda, así que el piso de cada ancla es
  // su propio ancho proyectado. Debajo del eje el margen izquierdo está vacío,
  // así que el límite real es el borde del viewBox, no el del área de dibujo.
  const minAnchor = orderedAnchors.map(a => hardLeft + a.projW);

  for (let i = 0; i < nLbl; i++) {                       // 1) izquierda → derecha
    if (i > 0 && xs[i] < xs[i - 1] + gapX) xs[i] = xs[i - 1] + gapX;
    if (xs[i] < minAnchor[i]) xs[i] = minAnchor[i];
  }
  if (nLbl) xs[nLbl - 1] = Math.min(xs[nLbl - 1], hardRight);   // 2) tope derecho
  for (let i = nLbl - 2; i >= 0; i--) {                  // 3) derecha → izquierda
    if (xs[i] > xs[i + 1] - gapX) xs[i] = xs[i + 1] - gapX;
  }
  for (let i = 0; i < nLbl; i++) {                       // 4) piso izquierdo
    if (xs[i] < minAnchor[i]) xs[i] = minAnchor[i];
  }

  const desplazada = xs.map((x, i) => Math.abs(x - orderedAnchors[i].barX) > 0.5);

  // Filas de quiebre de las guías en Z: escalonadas dentro de cada corrida
  // contigua de etiquetas desplazadas, e INVERTIDAS según el lado hacia el que
  // se movió cada una, para que los tramos horizontales no crucen las bajadas
  // verticales (mismo criterio que OWID). Con las etiquetas que se fueron a la
  // izquierda, la de más a la izquierda toma la fila más cercana al eje; con las
  // que se fueron a la derecha, al revés.
  const filaQuiebre = new Array(nLbl).fill(null);
  const maxRow = Math.max(0, Math.min(BCM_BEND_ROW_COUNT - 1,
    Math.floor((yLine - 4 - (plotArea.bottom + BCM_BEND_ROW_OFFSET)) / BCM_BEND_ROW_GAP)));
  let iRun = 0;
  while (iRun < nLbl) {
    if (!desplazada[iRun]) { iRun++; continue; }
    let jRun = iRun;
    while (jRun + 1 < nLbl && desplazada[jRun + 1]) jRun++;
    const largo = jRun - iRun + 1;
    for (let k = iRun; k <= jRun; k++) {
      const pos = k - iRun;
      const haciaIzquierda = xs[k] < orderedAnchors[k].barX;
      const r = haciaIzquierda ? pos : (largo - 1 - pos);
      filaQuiebre[k] = plotArea.bottom + BCM_BEND_ROW_OFFSET + Math.min(r, maxRow) * BCM_BEND_ROW_GAP;
    }
    iRun = jRun + 1;
  }

  const toDraw = orderedAnchors.map((a, i) => ({
    ...a, tx: xs[i], ty: yAnchor, yLine,
    bendY: desplazada[i] ? filaQuiebre[i] : null,
    displaced: desplazada[i], fontSize
  }));

  return toDraw;
}

function bc_drawMarimekko() {
  const svg = document.getElementById('chart13');
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
  const mobile = !editorFormat && bc_isMobile();

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH;
    MARGIN = bcm_getMargins(editorFormat);
  } else if (mobile) {
    W = BCM_W_MOBILE; H = BCM_H_MOBILE;
    MARGIN = { ...BCM_MARGIN_MOBILE };
  } else {
    W = BCM_W_DESKTOP; H = BCM_H_DESKTOP;
    MARGIN = { ...BCM_MARGIN_DESKTOP };
  }

  const s1 = state[13];
  // WYSIWYG: las etiquetas del marimekko SON los chips (state.selected), igual
  // que el N°2 tras la auditoría. Si el editor está activo, su lista manda.
  // La lista del editor pisa la selección del gráfico SOLO si tiene algo. Con
  // el editor recién abierto está vacía, y antes eso borraba las etiquetas de
  // los países que el lector había elegido (lo reportó Daniel, 2026-08-11).
  const labelCodes = (aeCfg && Array.isArray(aeCountries) && aeCountries.length)
    ? aeCountries : (s1.selected || []);
  // Mayor rechazo a la izquierda; las barras bajas (tolerantes) quedan a la
  // derecha, dejando el hueco arriba-derecha para la tabla regional.
  const data = bc_computeData().slice().sort((a, b) => b.pct - a.pct);
  // Universo de países para el panel del editor (sección "Países
  // etiquetados"): sin esto la sección no aparece, aunque el chart sí
  // consuma la lista. Ver buildCountryUniverse en lib/editor.js.
  window.__atlasCountryUniverse = data.map(d => d.iso);
  const n = data.length;
  const med = s1.showMedian ? bc_median() : null;

  // Y máximo dinámico según la categoría (drogadictos llega a ~97).
  const dataMax = n ? Math.max(...data.map(d => d.pct), med ? med.value : 0) : 10;
  const yMax = Math.max(10, Math.ceil((dataMax * 1.04) / 5) * 5);

  // Bottom dinámico para que las etiquetas rotadas no se corten.
  {
    const sin45 = Math.SQRT1_2;
    const fmtLabelDefault = newsletter ? 16 : square ? 17 : mobilePng ? 26
      : mobile ? BCM_LABEL_FONT_SIZE_MOBILE : BCM_LABEL_FONT_SIZE;
    const labelFontSize = atlasEditorSize(aeSizes, 'labels', fmtLabelDefault);
    const aOff = (mobile || mobilePng) ? BCM_LABEL_ANCHOR_Y_OFFSET_MOBILE : BCM_LABEL_ANCHOR_Y_OFFSET;
    const present0 = new Set(data.map(d => d.iso));
    const codesToShow0 = new Set((labelCodes || []).filter(c => present0.has(c)));
    let maxTextW = 0;
    data.forEach(d => {
      if (!codesToShow0.has(d.iso)) return;
      const w = Math.max(22, bc_measureText(bc_displayName(d.iso), labelFontSize, 500));
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
    : { tick: 11, axisLabel: 10.5, label: BCM_LABEL_FONT_SIZE, tableTitle: 10, tableLabel: 11 };
  const bc_pick = (v, fb) => (v != null ? v : fb);   // sin nullish coalescing (esprima no parsea ES2020)
  const SIZES = {
    tick:       atlasEditorSize(aeSizes, 'ticks', FMT_SIZES.tick),
    axisLabel:  atlasEditorSize(aeSizes, 'axisTitle', FMT_SIZES.axisLabel),
    label:      atlasEditorSize(aeSizes, 'labels', FMT_SIZES.label),
    tableTitle: atlasEditorSize(aeSizes, 'special', FMT_SIZES.tableTitle),
    tableLabel: atlasEditorSize(aeSizes, 'special', FMT_SIZES.tableLabel)
  };

  const yScale = (v) => MARGIN.top + PLOT_H - (v / yMax) * PLOT_H;
  const barWidth = n > 0 ? PLOT_W / n : PLOT_W;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // Tabla: solo desktop/PNG (en mobile va como HTML colapsable).
  const tableVisible = !mobile && n > 0;
  const tableX = mobilePng ? 520 : BCM_TABLE_X;
  const tableTopY = mobilePng ? 70 : (BCM_TABLE_Y_TITLE - 10);
  const tableRowH = ((SIZES.tableLabel != null) ? SIZES.tableLabel : 11) * 1.45;
  const regionsPresent = [];
  const seenReg = new Set();
  data.forEach(d => { if (d.region && !seenReg.has(d.region)) { seenReg.add(d.region); regionsPresent.push(d.region); } });
  const tableBottomY = (mobilePng ? 110 : BCM_TABLE_Y_FIRST) + regionsPresent.length * tableRowH;

  // === Grid Y + ticks ===
  const yTicksAll = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile || mobilePng) ? 4 : 6) : [0, 20, 40, 60];
  const yTicks = yTicksAll.filter(v => v <= yMax + 0.001);
  if (!yTicks.includes(0)) yTicks.unshift(0);
  yTicks.forEach(tv => {
    const y = yScale(tv);
    const line = bc_ns('line');
    line.setAttribute('x1', MARGIN.left);
    const crossesTable = tableVisible && tv !== 0 && y >= tableTopY && y <= tableBottomY;
    line.setAttribute('x2', crossesTable ? tableX - 10 : MARGIN.left + PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', tv === 0 ? '#9C928A' : '#ECE7D8');
    line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
    const tx = bc_ns('text');
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
  const yLab = bc_ns('text');
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
  yLab.textContent = (typeof t === 'function') ? t('c13-axis-mk') : '% que lo ve seguido en su barrio';
  svg.appendChild(yLab);

  // === Barras ===
  const tooltip = document.getElementById('tooltip13');
  const barsG = bc_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const x = MARGIN.left + i * barWidth;
    const y = yScale(d.pct);
    const rect = bc_ns('rect');
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
    rect.addEventListener('mouseenter', (e) => bc_showTooltip(e, d));
    rect.addEventListener('mousemove', (e) => bc_positionTooltip(e));
    rect.addEventListener('mouseleave', () => bc_hideTooltip());
    // Selección por click solo en desktop (en touch el tap es del tooltip).
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { bc_hideTooltip(); bc_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);
  });

  // === Mediana mundial (línea horizontal punteada) ===
  if (med) {
    const my = yScale(med.value);
    const mline = bc_ns('line');
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
    const mlbl = bc_ns('text');
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
    mlbl.textContent = ((typeof t === 'function') ? t(bc_isMean() ? 'c13-mean-lbl' : 'c13-median-lbl') : 'Mediana mundial')
      + ': ' + ((typeof fmt === 'function') ? fmt(med.value, 1) : med.value) + '%';
    svg.appendChild(mlbl);
  }

  // === Etiquetas de país rotadas con callouts ===
  const labelsG = bc_ns('g'); svg.appendChild(labelsG);
  const plotArea = { left: MARGIN.left, right: MARGIN.left + PLOT_W, top: MARGIN.top, bottom: MARGIN.top + PLOT_H, vbRight: W };
  const placed = bcm_layoutCountryLabels(data, barWidth, plotArea, labelCodes);
  placed.forEach(l => {
    const path = bc_ns('path');
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
    const txt = bc_ns('text');
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
        value: bc_agg(vals)
      };
    })
    .sort((a, b) => b.value - a.value);
  // ¿Entra la tabla flotante en el hueco arriba-derecha? Ocupa la franja-x
  // derecha (~60%→100% del ancho) y necesita libre el ~64% superior de esa
  // franja. Si las barras bajo la tabla son altas (ej. drogadictos: todas
  // >37%), no entra → la tabla se muestra como bloque debajo del gráfico en
  // vez de taparlas (opción elegida por Daniel, 2026-07-23).
  const tableXFrac = (BCM_TABLE_X - BCM_MARGIN_DESKTOP.left) / (BCM_W_DESKTOP - BCM_MARGIN_DESKTOP.left - BCM_MARGIN_DESKTOP.right);
  const rankUnder = n > 0 ? Math.min(n - 1, Math.floor(tableXFrac * n)) : 0;
  const maxUnderTable = n > 0 ? data[rankUnder].pct : 0;   // data ya está desc
  const tableFits = maxUnderTable < 0.36 * yMax;
  // Además: la etiqueta de la mediana va a la derecha (misma franja-x que la
  // tabla). Si la línea de la mediana cae en la banda vertical de la tabla, su
  // etiqueta colisiona con las filas (reporte de Daniel 2026-07-24). En ese caso,
  // mismo criterio que con las barras: la tabla se va abajo y el lado derecho
  // queda libre para la etiqueta de la mediana.
  const medY = med ? yScale(med.value) : null;
  const medHitsTable = med && medY >= (tableTopY - tableRowH) && medY <= (tableBottomY + tableRowH * 0.5);
  // El toggle "Tabla regional" (state.showTable) gobierna si se muestra; el
  // heurístico solo decide flotante-vs-abajo cuando sí se muestra.
  const wantTable = s1.showTable !== false;
  const showSvgTable = wantTable && tableVisible && tableFits && !medHitsTable;
  if (showSvgTable) {
    bcm_drawRegionalAvgTable(svg, tableRows, s1.activeRegion, SIZES, mobilePng);
  }
  bcm_drawRegionalAvgTableHTML(tableRows, s1.activeRegion);
  // Tabla HTML debajo del gráfico: en mobile SIEMPRE (si wantTable); en desktop
  // solo cuando la flotante no entra. Con el toggle apagado, no aparece.
  const belowWrap = document.getElementById('bcm-avg-table-mobile-wrap');
  if (belowWrap) {
    const showBelow = wantTable && !showSvgTable;
    belowWrap.style.display = showBelow ? 'block' : 'none';
    const det = belowWrap.querySelector('details');
    if (det && !mobile) det.open = showBelow;
  }
}

function bcm_drawRegionalAvgTable(svg, rows, activeRegion, SIZES, mobilePng) {
  const titleSize = SIZES ? SIZES.tableTitle : null;
  const labelSize = SIZES ? SIZES.tableLabel : null;
  const rowFactor = 1.45, swatchFactor = 0.82, gapFactor = 0.64;
  const base = (labelSize != null) ? labelSize : 11;
  const rowH = base * rowFactor;
  const swatchSize = base * swatchFactor;
  const swatchGap = base * gapFactor;
  // Más aire entre el título "PROMEDIO POR REGIÓN" y la primera fila (pedido de
  // Daniel 2026-07-23): ~2.4 alturas de fila bajo el título (antes ~20px, ahora ~26).
  const titleGap = base * 2.4;
  const yFirst = (mobilePng ? 84 : BCM_TABLE_Y_TITLE) + titleGap;
  const tableX = mobilePng ? 520 : BCM_TABLE_X;
  const tableW = mobilePng ? 540 : BCM_TABLE_W;
  const tableYTitle = mobilePng ? 80 : BCM_TABLE_Y_TITLE;
  const ruleY = tableYTitle + base * 0.7;
  const g = bc_ns('g');
  g.setAttribute('id', 'bcm-avg-table');
  svg.appendChild(g);

  const title = bc_ns('text');
  title.setAttribute('class', 'm-table-title');
  title.setAttribute('x', tableX);
  title.setAttribute('y', tableYTitle);
  if (titleSize) title.style.fontSize = titleSize + 'px';
  title.textContent = (typeof t === 'function') ? t(bc_isMean() ? 'c13-avg-table-title' : 'c13-median-table-title') : 'Mediana por región';
  g.appendChild(title);

  const rule = bc_ns('line');
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

    const swatch = bc_ns('rect');
    swatch.setAttribute('class', 'm-table-swatch' + stateClass);
    swatch.setAttribute('x', tableX);
    swatch.setAttribute('y', y - swatchSize + 1);
    swatch.setAttribute('width', swatchSize);
    swatch.setAttribute('height', swatchSize);
    swatch.setAttribute('fill', row.color);
    g.appendChild(swatch);

    const labelEl = bc_ns('text');
    labelEl.setAttribute('class', 'm-table-label' + stateClass);
    labelEl.setAttribute('x', tableX + swatchSize + swatchGap);
    labelEl.setAttribute('y', y);
    if (labelSize) labelEl.style.fontSize = labelSize + 'px';
    labelEl.textContent = row.label;
    g.appendChild(labelEl);

    const valueEl = bc_ns('text');
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
function bcm_drawRegionalAvgTableHTML(rows, activeRegion) {
  const container = document.getElementById('bcm-avg-table-mobile');
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
//  (bc_buildLegend) y los redraws solo sincronizan clases
//  (bc_syncLegend). Si el redraw reconstruyera los chips, el chip bajo
//  el cursor se destruiría a mitad del hover: el mouseleave nunca
//  llegaría (dim colgado) y el click caería en un nodo muerto — bug
//  real reportado por Daniel (2026-07-22).
//==================================================================
function bc_buildLegend() {
  const cont = document.getElementById('bc-legend');
  if (!cont) return;
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const cat = state[13].cat;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const key = cat + '|' + lang + '|' + state[13].wave;
  if (cont.dataset.built === key) { bc_syncLegend(); return; }
  cont.dataset.built = key;
  const present = new Set(bc_waveRows().map(r => BA_REGION[r[0]]).filter(Boolean));
  cont.innerHTML = '';
  order.filter(r => present.has(r)).forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'bc-leg-item';
    chip.dataset.region = region;
    const col = (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[region]) || '#888';
    chip.innerHTML = `<span class="bc-leg-dot" style="background:${col}"></span>${(typeof t === 'function') ? t('reg.' + region) : region}`;
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        if (bc_hidden().has(region)) return;
        state[13].activeRegion = region;
        drawBarrioComp();
      });
      chip.addEventListener('mouseleave', () => {
        if (state[13].activeRegion !== region) return;
        state[13].activeRegion = null;
        drawBarrioComp();
      });
    }
    chip.addEventListener('click', () => {
      const arr = state[13].hiddenRegions || (state[13].hiddenRegions = []);
      const idx = arr.indexOf(region);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(region);
      if (state[13].activeRegion === region) state[13].activeRegion = null;
      drawBarrioComp();
    });
    cont.appendChild(chip);
  });
  bc_syncLegend();
}

// Sincroniza el estado on/off de los chips sin reconstruir el DOM.
function bc_syncLegend() {
  const cont = document.getElementById('bc-legend');
  if (!cont) return;
  const hid = bc_hidden();
  cont.querySelectorAll('.bc-leg-item').forEach(chip => {
    chip.classList.toggle('bc-leg-off', hid.has(chip.dataset.region));
  });
}

//==================================================================
//  Tooltip (compartido por ambas vistas)
//==================================================================
function bc_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip13');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const reg = d.region ? tt('reg.' + d.region, d.region) : '';
  const F = (v) => (typeof fmt === 'function') ? fmt(v, 1) : v;
  // Sin rama EVS/WVS (la batería H002 es solo del WVS). En su lugar, el puesto
  // mundial "N° de M" sobre el universo de países con los cinco ítems.
  const uni = bc_universe();
  const rankLine = (d.rank != null)
    ? `<div class="tt-row"><span>${tt('c13-tt-rank', 'Puesto mundial')}</span><span>${bc_rankLabel(d.rank, uni)}</span></div>` : '';
  tooltip.innerHTML = `
    <strong>${bc_displayName(d.iso)}</strong>
    <div class="tt-sub">${reg} · ${bc_waveLabel()}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c13-tt-pct', 'Lo ve seguido')}</span><span>${F(d.pct)}%</span></div>
    <div class="tt-row"><span>${tt('c13-tt-year', 'Año')}</span><span>${d.year}</span></div>
    <div class="tt-row"><span>${tt('c13-tt-n', 'Muestra')}</span><span>${(typeof fmt === 'function') ? fmt(d.n, 0) : d.n}</span></div>
    ${rankLine}
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  bc_positionTooltip(event);
}

function bc_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip13');
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

function bc_hideTooltip() {
  const tooltip = document.getElementById('tooltip13');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Controles: categoría + vista + mediana
//==================================================================
function setupBarrioCompCat() {
  const sel = document.getElementById('bc-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!BA_FOTO[sel.value]) return;
    state[13].cat = sel.value;
    bc_buildLegend();   // las regiones presentes pueden cambiar con la categoría
    drawBarrioComp();
  });
}

function setupBarrioCompView() {
  document.querySelectorAll('#bc-view button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v !== 'sel' && v !== 'all') return;
      if (state[13].view === v) return;
      state[13].view = v;
      document.querySelectorAll('#bc-view button')
        .forEach(b => b.classList.toggle('active', b.dataset.view === v));
      drawBarrioComp();
    });
  });
}

// Slider de OLA: un solo thumb sobre las olas presentes (BC_WAVES). Al moverlo
// se ve la misma categoría en distintas ondas EVS/WVS. Default: la más reciente.
function setupBarrioCompWave() {
  const input = document.getElementById('bc-wave-slider');
  const disp = document.getElementById('bc-wave-display');
  if (!input || !BC_WAVES.length) {
    const grp = document.getElementById('bc-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = BC_WAVES;   // asc por ola
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  const sync = () => {
    input.value = idxOf(state[13].wave);
    if (disp) disp.textContent = bc_waveLabel();
  };
  input.addEventListener('input', () => {
    const w = waves[+input.value].w;
    if (w === state[13].wave) return;
    state[13].wave = w;
    if (disp) disp.textContent = bc_waveLabel();
    bc_buildLegend();   // las regiones presentes cambian según la ola
    drawBarrioComp();
  });
  sync();
}

// Toggle unificado "Referencias": Mediana y Tabla regional, cada uno on/off
// independiente (ambos, uno o ninguno). Reemplaza los dos toggles mostrar/ocultar
// (pedido de Daniel 2026-07-23). El botón activo = referencia visible.
// Toggle Mediana / Promedio. Es un selector EXCLUYENTE (mismo patron que
// "Mostrar: Mi seleccion | Todos los paises"), separado de "Referencias", que son
// dos interruptores on/off. Se oculta cuando las dos referencias estan apagadas:
// sin linea ni tabla no hay estadistico que elegir.
function setupBarrioCompRefsStat() {
  const box = document.getElementById('bc-stat');
  if (!box) return;
  const sync = () => {
    box.querySelectorAll('button[data-stat]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-stat') === (state[13].stat || 'median'));
    });
    const grp = box.closest('.m-ctrl-group') || box;
    const hay = (state[13].showMedian !== false) || (state[13].showTable !== false);
    grp.style.display = hay ? '' : 'none';
  };
  box.querySelectorAll('button[data-stat]').forEach(b => {
    b.addEventListener('click', () => {
      state[13].stat = b.getAttribute('data-stat');
      sync();
      drawBarrioComp();
    });
  });
  sync();
  setupBarrioCompRefsStat._sync = sync;
}

function setupBarrioCompRefs() {
  document.querySelectorAll('#bc-refs button[data-ref]').forEach(btn => {
    const key = btn.dataset.ref === 'table' ? 'showTable' : 'showMedian';
    btn.classList.toggle('active', state[13][key] !== false);
    btn.addEventListener('click', () => {
      state[13][key] = !(state[13][key] !== false);   // toggle
      btn.classList.toggle('active', state[13][key]);
      // el selector de estadistico se esconde si no queda ninguna referencia
      if (setupBarrioCompRefsStat._sync) setupBarrioCompRefsStat._sync();
      drawBarrioComp();
    });
  });
}

//==================================================================
//  Buscador de países + chips (vista 'sel'; en 'all' la selección
//  espejea como spotlight + etiqueta)
//==================================================================
function bc_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function bc_searchableCountries() {
  const isos = new Set();
  BA_ITEMS.forEach(item => {
    const byWave = (typeof BA_FOTO !== 'undefined') ? BA_FOTO[item] : null;
    if (!byWave) return;
    Object.keys(byWave).forEach(w => byWave[w].forEach(r => isos.add(r[0])));
  });
  return Array.from(isos)
    .sort((a, b) => bc_displayName(a).localeCompare(bc_displayName(b), 'es'))
    .map(iso => ({ iso, name: bc_displayName(iso) }));
}

function bc_toggleSelect(iso) {
  const arr = state[13].selected;
  const idx = arr.indexOf(iso);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(iso);
  renderBarrioCompChips();
  drawBarrioComp();
}

function renderBarrioCompChips() {
  const container = document.getElementById('bc-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  const arr = state[13].selected.slice()
    .sort((a, b) => bc_displayName(a).localeCompare(bc_displayName(b), 'es'));
  arr.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = bc_regionColor(iso);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(bc_displayName(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => bc_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupBarrioCompSearch() {
  const input = document.getElementById('bc-search');
  const results = document.getElementById('bc-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = bc_normalize(q);
    return bc_searchableCountries()
      .filter(c => bc_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[13].selected.includes(c.iso);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        bc_toggleSelect(el.dataset.iso);
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
      bc_toggleSelect(currentMatches[activeIdx].iso);
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
//  Download CSV — los cinco ítems del barrio, todas las olas
//==================================================================
function setupBarrioCompDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="13-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += 'iso3,pais,item,ola,anio,pct,rank,n\n';
      BA_ITEMS.forEach(item => {
        BC_WAVES.forEach(m => {
          const byWave = (typeof BA_FOTO !== 'undefined' && BA_FOTO[item]) ? BA_FOTO[item] : {};
          const rows = byWave[String(m.w)] || byWave[m.w] || [];
          rows.forEach(r => {
            const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]])
              ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
            const nameQ = (name.includes(',')) ? '"' + name + '"' : name;
            csv += [r[0], nameQ, item, m.w, r[2], r[1], r[3], r[4]].join(',') + '\n';
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lang === 'en'
        ? 'the-atlas-04-neighbourhood-comparison.csv'
        : 'el-atlas-04-barrio-comparacion.csv';
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
function initBarrioComp() {
  const lastWave = BC_WAVES.length ? BC_WAVES[BC_WAVES.length - 1].w : 7;
  if (!state[13]) {
    state[13] = {
      cat: 'racismo',
      view: 'sel',
      wave: lastWave,            // default = ola más reciente (== "último dato >=2017")
      selected: [...BC_DEFAULT_SELECTED],
      showMedian: true,
      showTable: true,
      hiddenRegions: [],
      activeRegion: null
    };
  }
  if (state[13].wave == null) state[13].wave = lastWave;

  setupBarrioCompCat();
  setupBarrioCompView();
  setupBarrioCompRefs();
  setupBarrioCompRefsStat();
  setupBarrioCompWave();
  setupBarrioCompSearch();
  setupBarrioCompDownloadCSV();
  renderBarrioCompChips();
  bc_buildLegend();
  drawBarrioComp();

  if (!initBarrioComp._editorWired) {
    initBarrioComp._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawBarrioComp());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawBarrioComp;

  // Nota "Datos" corta del PNG, con el rango de años realmente mostrado.
  window.onBeforePngExportGetSourceText = function(chartId) {
    if (chartId !== '13') return null;
    const tpl = (typeof t === 'function') ? t('c13-sources-tpl') : '';
    if (!tpl) return null;
    const data = bc_computeData();
    const years = data.map(d => d.year);
    const y = years.length ? Math.min(...years) + '-' + Math.max(...years) : '2017-2023';
    return tpl.replace('{Y}', y);
  };

  // Marimekko: los textos de la tabla regional van al canvas (las webfonts
  // no resuelven bien dentro del <img> SVG rasterizado — port del N°2).
  window.onBeforePngExport = function(svgClone, chartId) {
    if (chartId !== '13') return;
    const tableEl = svgClone.querySelector('#bcm-avg-table');
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
