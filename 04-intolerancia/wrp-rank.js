// El Atlas N°4 — WRP (discriminacion vivida), vista RANKING. CLON VERBATIM de
// vdem-rank.js con ids renumerados (state 21->24, chart24->chart24, c24->c24) y
// nombre de archivo CSV propio; los datos los sirve wrp-adapter.js con la misma
// API vd_*. NO editar la logica aca: si hay un bug, esta tambien en el original.
// CLON de barrio-comp.js (que a su vez clona ranking.js). Sólo cambia el
// adaptador de datos: V-Dem es anual y viene comprimido.


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
// Inputs (data-barrio.js): VD_VARS, VD_SERIES (por ola), BA_META, VD_REGION.
// State (state[24]): cat, view ('sel'|'all'), selected[], showMedian,
//                   hiddenRegions[], activeRegion.

//==================================================================
//  Constantes
//==================================================================
const VR_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const VR_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 56, left: 110 };

const VR_LATAM_REGIONS = new Set(['Latin America', 'Caribbean']);
// Set curado inicial (WYSIWYG: son los chips = las etiquetas): LatAm con dato
// + referencias globales presentes en la ola 7 de la batería H002.
// Verificado contra VD_SERIES.racismo['7'] — ESP y ZAF no tienen ola 7, afuera.
const VR_DEFAULT_SELECTED = ['ARG', 'BRA', 'CHL', 'MEX', 'PER', 'URY', 'USA', 'ESP', 'SWE'];

// Olas disponibles de la batería (BA_META.waves = [{w,label},...], asc por ola).
const VR_DEFAULT_CAT = 'wrp_piel';
// Años disponibles: se recalculan por variable en vr_yearsNow().
let VR_WAVES = [];
function vr_yearsNow() {
  VR_WAVES = vd_yearList(state[24] ? state[24].cat : VR_DEFAULT_CAT);
  return VR_WAVES;
}

const VR_SVG_NS = 'http://www.w3.org/2000/svg';
const vr_ns = (tag) => document.createElementNS(VR_SVG_NS, tag);

// Márgenes por formato de PNG de la vista barras (mobile-first). Left amplio
// para los nombres de país; bottom con espacio para la leyenda de regiones.
function vr_getMargins(format) {
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
function vr_displayName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function vr_measureText(text, fontSize, weight) {
  if (!vr_measureText._ctx) {
    const c = document.createElement('canvas');
    vr_measureText._ctx = c.getContext('2d');
  }
  const ctx = vr_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function vr_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

function vr_regionColor(iso) {
  const reg = VD_REGION[iso];
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#5E7E96';
}
function vr_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#555';
}

function vr_isLatam(iso) { return VR_LATAM_REGIONS.has(VD_REGION[iso]); }

function vr_hidden() { return new Set(state[24].hiddenRegions || []); }

// Filas del ítem/ola activos, mapeadas a la forma que espera el motor.
// VD_SERIES[item][ola] = [[iso3, pct, year, rank, n], ...] (asc por pct; las
// claves de ola son strings "6"/"7") → [iso, pct, year, n, evs, wvs, rank].
// evs/wvs no existen en esta batería (es solo WVS): van null.
function vr_waveRows() {
  const rows = vd_foto(state[24].cat, state[24].wave);
  // [iso, valor, año, n, evs, wvs, puesto] — el formato que espera el motor.
  return rows.map(function (r) { return [r[0], r[1], r[2], r[3], null, null, r[4]]; });
}

function vr_computeData() {
  const s = state[24];
  const hid = vr_hidden();
  let rows = vr_waveRows().map(function (r) {
    return { iso: r[0], pct: r[1], year: r[2], n: r[3], rank: r[6], region: VD_REGION[r[0]] };
  }).filter(function (r) { return r.region && !hid.has(r.region); });
  if (s.view !== 'all') {
    const sel = new Set(s.selected);
    rows = rows.filter(function (r) { return sel.has(r.iso); });
  }
  return rows;
}

// Mediana MUNDIAL del año: sobre todos los países con dato.


// Estadistico MUNDIAL de la celda activa: sobre TODOS los paises con dato
// (ignora seleccion y regiones apagadas — es la referencia global).
// Mediana o promedio segun el toggle: la linea y la tabla regional tienen que
// mostrar el MISMO estadistico. Antes la linea era mediana y la tabla promedios
// (peras con manzanas, reporte de Daniel 2026-07-27).
function vr_isMean() { return state[24].stat === 'mean'; }
function vr_agg(vals) {
  if (!vals.length) return null;
  if (vr_isMean()) return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  const v = vals.slice().sort(function (a, b) { return a - b; });
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function vr_median() {
  const rows = vr_waveRows();
  if (!rows.length) return null;
  const vals = rows.map(function (r) { return r[1]; });
  return { value: vr_agg(vals), n: vals.length };
}

function vr_waveLabel() { return String(state[24].wave); }

function vr_universe() { return vd_foto(state[24].cat, state[24].wave).length; }

// Rótulo del puesto mundial ("5° de 64" / "#5 of 64") — reusa el tpl del perfil.
function vr_rankLabel(rank, n) {
  // c24-rank-tpl, no la del perfil (c8-rank-tpl no existe en este diccionario
  // y el tooltip terminaba imprimiendo el nombre de la clave).
  const tpl = (typeof t === 'function') ? t('c24-rank-tpl') : '{R}/{N}';
  return tpl.replace('{R}', rank).replace('{N}', n != null ? n : '?');
}

//==================================================================
//  Subtítulo dinámico (con la categoría activa)
//==================================================================
function vr_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c24-subtitle-tpl"]');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;
  const tpl = (typeof t === 'function') ? t('c24-subtitle-tpl') : '';
  // El nombre del indicador sale de VD_VARS, no del diccionario de ítems de la
  // batería del barrio, y el placeholder del template es {CAT}.
  el.textContent = tpl.replace('{CAT}', vd_varLabelOf(state[24].cat)).replace('{PERIODO}', vr_waveLabel());
}

//==================================================================
//  Dispatcher
//==================================================================
function drawVdemRank() {
  vr_updateSubtitle();
  vr_syncLegend();
  if (state[24].view === 'all') vr_drawMarimekko();
  else vr_drawBars();
  // (La tabla regional HTML de abajo la gobierna cada vista: vr_drawMarimekko
  // la muestra en mobile o cuando la flotante no entra; vr_drawBars la oculta.)
  // WYSIWYG: el buscador + chips van SIEMPRE visibles (los chips son las
  // barras en 'sel' y las etiquetas en 'all' — una sola fuente de verdad).
  const picker = document.getElementById('vr-country-picker');
  if (picker) picker.style.display = '';
  // El hint del picker cambia según la vista (qué "hacen" los chips).
  const hint = document.getElementById('vr-picker-hint');
  if (hint) {
    const k = state[24].view === 'all' ? 'c24-pick-hint-all' : 'c24-pick-hint-sel';
    hint.textContent = (typeof t === 'function') ? t(k) : '';
  }
  // Título: neutral por ahora (el insight queda en i18n para más adelante).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('24', false, { title: 'c24-title', titleNeutral: 'c24-title-neutral' });
  }
}

//==================================================================
//  Vista 'sel': barras horizontales (motor talento N°3)
//==================================================================
function vr_drawBars() {
  const svg = document.getElementById('chart24');
  if (!svg) return;
  svg.innerHTML = '';
  // La tabla regional de abajo es exclusiva del marimekko.
  const _below = document.getElementById('vrm-avg-table-mobile-wrap');
  if (_below) _below.style.display = 'none';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && vr_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = vr_computeData();
  const n = data.length;
  const med = state[24].showMedian ? vr_median() : null;
  const activeRegion = state[24].activeRegion;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24, legend: 22 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20, legend: 0 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11, legend: 0 };

  let VR_W, VR_MARGIN, VR_BAR_H, VR_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    VR_W = f.vbW; totalH = f.vbH; VR_MARGIN = vr_getMargins(editorFormat);
    VR_BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - VR_MARGIN.top - VR_MARGIN.bottom;
    VR_BAR_H = n > 0 ? (plotH - (n - 1) * VR_BAR_GAP) / n : 10;
    const fitName = Math.floor((VR_BAR_H + VR_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    VR_W = 1100;
    VR_MARGIN = mobile ? { ...VR_MARGIN_MOBILE } : { ...VR_MARGIN_DESKTOP };
    VR_BAR_H = mobile ? 42 : 20; VR_BAR_GAP = mobile ? 13 : 5;
    plotH = Math.max(40, n * (VR_BAR_H + VR_BAR_GAP) - VR_BAR_GAP);
    totalH = VR_MARGIN.top + plotH + VR_MARGIN.bottom;
  }

  let maxNameW = 0;
  data.forEach(d => {
    const w = vr_measureText(vr_displayName(d.iso), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
  });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(VR_W * 0.42);
    VR_MARGIN.left = Math.min(maxLeft, Math.max(VR_MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${VR_W} ${totalH}`);

  const plotW = VR_W - VR_MARGIN.left - VR_MARGIN.right;
  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.pct), med ? med.value : 0, 1) : 1;
  const _rx = vd_rango(state[24].cat);
  const xMin = _rx[0], xMax = _rx[1];
  const xScale = (v) => VR_MARGIN.left + ((v - xMin) / (xMax - xMin)) * plotW;

  const gridG = vr_ns('g'); svg.appendChild(gridG);
  const axisG = vr_ns('g'); svg.appendChild(axisG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(xMin, xMax, 5) : [0, 25, 50, 75];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = vr_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', VR_MARGIN.top);
    line.setAttribute('y2', VR_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = vr_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', VR_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    // Cero decimales dejaba el eje en "0 0 0 1 1 1" (herencia de los porcentajes).
    lbl.textContent = vd_fmtVal(v, 1);
    axisG.appendChild(lbl);
  });

  const xTitle = vr_ns('text');
  xTitle.setAttribute('x', VR_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', VR_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c24-axis-x') : '% que lo ve seguido en su barrio';
  svg.appendChild(xTitle);

  const barsG = vr_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = VR_MARGIN.top + i * (VR_BAR_H + VR_BAR_GAP);
    const latam = vr_isLatam(d.iso);
    const color = vr_regionColor(d.iso);
    const barW = xScale(d.pct) - VR_MARGIN.left;
    const dimmed = activeRegion && d.region !== activeRegion;

    const nameTxt = vr_ns('text');
    nameTxt.setAttribute('x', VR_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + VR_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', latam ? 600 : 500);
    nameTxt.setAttribute('fill', latam ? '#8B4220' : '#3A3530');
    nameTxt.textContent = vr_displayName(d.iso);
    barsG.appendChild(nameTxt);

    const rect = vr_ns('rect');
    rect.setAttribute('x', VR_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', VR_BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', dimmed ? 0.18 : 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      if (!(state[24].activeRegion && d.region !== state[24].activeRegion)) rect.setAttribute('fill-opacity', 1);
      vr_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => vr_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', (state[24].activeRegion && d.region !== state[24].activeRegion) ? 0.18 : 0.92);
      vr_hideTooltip();
    });
    // Desktop: click en la barra saca al país (criterio 11f). En touch el
    // tap es del tooltip.
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { vr_hideTooltip(); vr_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);

    const valTxt = vr_ns('text');
    valTxt.setAttribute('x', VR_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + VR_BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', dimmed ? '#B5AC9F' : '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = vd_fmtVal(d.pct, 2);
    barsG.appendChild(valTxt);
  });

  if (med) {
    const mx = xScale(med.value);
    const mline = vr_ns('line');
    mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
    mline.setAttribute('y1', VR_MARGIN.top - (bigFmt ? 8 : 6));
    mline.setAttribute('y2', VR_MARGIN.top + plotH);
    mline.setAttribute('stroke', '#8A8579');
    mline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    svg.appendChild(mline);
    const mlbl = vr_ns('text');
    const mlblTxt = ((typeof t === 'function') ? t(vr_isMean() ? 'c24-mean-lbl' : 'c24-median-lbl') : 'Mediana mundial')
      + ': ' + vd_fmtVal(med.value, vd_dec());
    const lblW = vr_measureText(mlblTxt, SIZES.medLbl, 600);
    const anchorEnd = mx + 8 + lblW > VR_W - 4;
    mlbl.setAttribute('x', anchorEnd ? mx - 8 : mx + 8);
    mlbl.setAttribute('y', VR_MARGIN.top - (bigFmt ? 16 : 12));
    mlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = SIZES.medLbl + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#7A6E62');
    mlbl.textContent = mlblTxt;
    svg.appendChild(mlbl);
  }

  const zeroLine = vr_ns('line');
  zeroLine.setAttribute('x1', VR_MARGIN.left); zeroLine.setAttribute('x2', VR_MARGIN.left);
  zeroLine.setAttribute('y1', VR_MARGIN.top);
  zeroLine.setAttribute('y2', VR_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);

  if (editorFormat && SIZES.legend > 0) {
    vr_drawSvgLegend(svg, data, VR_W, VR_MARGIN.top + plotH + (bigFmt ? 96 : 60), SIZES.legend);
  }
}

// Leyenda dentro del SVG para el PNG de la vista barras.
function vr_drawSvgLegend(svg, data, width, yStart, fontSize) {
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const seen = new Set(data.map(d => VD_REGION[d.iso]).filter(Boolean));
  const items = order.filter(r => seen.has(r)).map(r => ({
    label: (typeof t === 'function') ? t('reg.' + r) : r,
    color: (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || '#888'
  }));
  if (!items.length) return;
  const dotR = fontSize * 0.32, gapItem = fontSize * 1.15, gapDot = dotR + fontSize * 0.35;
  const widths = items.map(it => gapDot + vr_measureText(it.label, fontSize, 500) + gapItem);
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
      const dot = vr_ns('circle');
      dot.setAttribute('cx', x + dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', dotR); dot.setAttribute('fill', it.color);
      svg.appendChild(dot);
      const txt = vr_ns('text');
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
const VRM_W_DESKTOP = 1100, VRM_H_DESKTOP = 470;
const VRM_W_MOBILE  = 1100, VRM_H_MOBILE  = 1500;
const VRM_MARGIN_DESKTOP = { top: 50, right: 32, bottom: 110, left: 56 };
const VRM_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 200, left: 130 };
function vrm_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'square':     return { top: 56, right: 34, bottom: 150, left: 74 };
    case 'mobile':     return { top: 90, right: 30, bottom: 200, left: 110 };
    default:           return { top: 50, right: 32, bottom: 110, left: 56 };
  }
}
const VRM_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const VRM_LABEL_FONT_SIZE = 10;
const VRM_LABEL_FONT_SIZE_MOBILE = 28;
// Más profundidad de filas de quiebre que el N°2 (50/5 filas): acá el default
// etiqueta ~24 países (22 seleccionados + extremos) contra ~17 de aquel, y con
// 5 filas el placement caía seguido al fallback SIN chequeo de colisión — las
// líneas guía se tocaban (reporte de Daniel, 2026-07-22).
const VRM_LABEL_ANCHOR_Y_OFFSET = 82;
const VRM_LABEL_ANCHOR_Y_OFFSET_MOBILE = 122;
const VRM_BEND_ROW_COUNT = 11;
const VRM_BEND_ROW_GAP = 8;
const VRM_BEND_ROW_OFFSET = 6;
const VRM_LABEL_MIN_GAP_X = 5;
// Separación mínima entre ANCLAS de dos etiquetas rotadas, en alturas de
// línea: a 45° las etiquetas son franjas paralelas y con ~2,3 no se tocan
// (OWID usa el mismo criterio). NO es el ancho del nombre.
const VRM_LABEL_GAP_K = 2.3;
const VRM_CALLOUT_PAD = 3;
// Tabla de promedios regionales (arriba-derecha, sobre las barras bajas).
const VRM_TABLE_X = 660, VRM_TABLE_W = 408, VRM_TABLE_Y_TITLE = 64, VRM_TABLE_Y_FIRST = 84, VRM_TABLE_ROW_H = 16;

// Algoritmo de etiquetas estilo OWID (port de m_layoutCountryLabels del N°2).
// WYSIWYG (norma de la auditoría del N°2): las etiquetas SON los chips
// (labelCodes). Sin priority list oculta ni extremos automáticos — una sola
// fuente de verdad. Todas son "must-show": se colocan con anti-colisión y solo
// se fuerzan (con overflow) si no entran limpias, así nunca se descarta un chip.
function vrm_layoutCountryLabels(sortedData, barWidth, plotArea, labelCodes) {
  const present = new Set(sortedData.map(d => d.iso));
  const codesToShow = new Set((labelCodes || []).filter(c => present.has(c)));

  const editorFormat = typeof getActivePngFormat === 'function' ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && vr_isMobile();
  const angle = VRM_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const aeCfg2 = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeLabelSize = (aeCfg2 && aeCfg2.sizes) ? aeCfg2.sizes.labels : null;
  const fmtDefaultFontSize = newsletter ? 16
    : square ? 17
    : mobilePng ? 26
    : mobile ? VRM_LABEL_FONT_SIZE_MOBILE
    : VRM_LABEL_FONT_SIZE;
  const fontSize = (aeLabelSize != null) ? aeLabelSize : fmtDefaultFontSize;
  const anchorYOffset = (mobile || mobilePng)
    ? VRM_LABEL_ANCHOR_Y_OFFSET_MOBILE
    : VRM_LABEL_ANCHOR_Y_OFFSET;
  const minGap = VRM_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + anchorYOffset;
  const yAnchor = yLine + 4;

  const anchors = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.iso)) return;
    const text = vr_displayName(d.iso);
    const textW = Math.max(22, vr_measureText(text, fontSize, 500));
    const projW = cos * textW + sin * fontSize + 2;
    anchors.push({
      code: d.iso, text,
      color: vr_regionLabelColor(d.region),
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
  const gapX = fontSize * VRM_LABEL_GAP_K;
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
  const maxRow = Math.max(0, Math.min(VRM_BEND_ROW_COUNT - 1,
    Math.floor((yLine - 4 - (plotArea.bottom + VRM_BEND_ROW_OFFSET)) / VRM_BEND_ROW_GAP)));
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
      filaQuiebre[k] = plotArea.bottom + VRM_BEND_ROW_OFFSET + Math.min(r, maxRow) * VRM_BEND_ROW_GAP;
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

function vr_drawMarimekko() {
  const svg = document.getElementById('chart24');
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
  const mobile = !editorFormat && vr_isMobile();

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH;
    MARGIN = vrm_getMargins(editorFormat);
  } else if (mobile) {
    W = VRM_W_MOBILE; H = VRM_H_MOBILE;
    MARGIN = { ...VRM_MARGIN_MOBILE };
  } else {
    W = VRM_W_DESKTOP; H = VRM_H_DESKTOP;
    MARGIN = { ...VRM_MARGIN_DESKTOP };
  }

  const s1 = state[24];
  // WYSIWYG: las etiquetas del marimekko SON los chips (state.selected), igual
  // que el N°2 tras la auditoría. Si el editor está activo, su lista manda.
  // La lista del editor pisa la selección del gráfico SOLO si tiene algo. Con
  // el editor recién abierto está vacía, y antes eso borraba las etiquetas de
  // los países que el lector había elegido (lo reportó Daniel, 2026-08-11).
  const labelCodes = (aeCfg && Array.isArray(aeCountries) && aeCountries.length)
    ? aeCountries : (s1.selected || []);
  // Mayor rechazo a la izquierda; las barras bajas (tolerantes) quedan a la
  // derecha, dejando el hueco arriba-derecha para la tabla regional.
  // El PEOR valor siempre a la izquierda (item 8 de Daniel, 2026-07-28): el
  // criterio de los marimekkos nunca fue "alto a la izquierda" sino "peor a la
  // izquierda" — en los porcentajes de rechazo coinciden. Con el indice (mas =
  // peor) se ordena desc; con los cinco componentes (mas = mejor) asc, para que
  // los paises no cambien de lado al cambiar de variable. El mapa ya invierte
  // la rampa con el mismo criterio (vd_peorEsMas).
  const data = vr_computeData().slice().sort((a, b) =>
    vd_peorEsMas(state[24].cat) ? (b.pct - a.pct) : (a.pct - b.pct));
  // Universo de países para el panel del editor (sección "Países
  // etiquetados"): sin esto la sección no aparece, aunque el chart sí
  // consuma la lista. Ver buildCountryUniverse en lib/editor.js.
  window.__atlasCountryUniverse = data.map(d => d.iso);
  const n = data.length;
  const med = s1.showMedian ? vr_median() : null;

  // Y máximo dinámico según la categoría (drogadictos llega a ~97).
  // Rango del eje según la variable: el índice va de 0 a 1 y los componentes
  // son escala de intervalo con negativos. El clon forzaba un mínimo de 10 y
  // múltiplos de 5, que venía de los porcentajes de la batería de vecinos.
  const _r = vd_rango(state[24].cat);
  const yMin = _r[0], yMax = _r[1];

  // Bottom dinámico para que las etiquetas rotadas no se corten.
  {
    const sin45 = Math.SQRT1_2;
    const fmtLabelDefault = newsletter ? 16 : square ? 17 : mobilePng ? 26
      : mobile ? VRM_LABEL_FONT_SIZE_MOBILE : VRM_LABEL_FONT_SIZE;
    const labelFontSize = atlasEditorSize(aeSizes, 'labels', fmtLabelDefault);
    const aOff = (mobile || mobilePng) ? VRM_LABEL_ANCHOR_Y_OFFSET_MOBILE : VRM_LABEL_ANCHOR_Y_OFFSET;
    const present0 = new Set(data.map(d => d.iso));
    const codesToShow0 = new Set((labelCodes || []).filter(c => present0.has(c)));
    let maxTextW = 0;
    data.forEach(d => {
      if (!codesToShow0.has(d.iso)) return;
      const w = Math.max(22, vr_measureText(vr_displayName(d.iso), labelFontSize, 500));
      if (w > maxTextW) maxTextW = w;
    });
    if (maxTextW > 0) {
      const projVert = sin45 * (maxTextW + labelFontSize * 0.3);
      const required = aOff + 4 + projVert + 30;
      if (MARGIN.bottom < required) {
        const extra = Math.ceil(required) - MARGIN.bottom;
        MARGIN.bottom += extra;
        // En pantalla el gráfico CRECE hacia abajo en vez de comprimir el área de
        // dibujo. Si el plot se achicara, las MISMAS barras subirían en pantalla
        // (yScale = top + PLOT_H*(1-v)) y se meterían debajo de la tabla regional:
        // ese es el mecanismo del "cuadrado que pisa una barra" que aparecía al
        // agregar países con nombres largos. En los formatos de PNG el alto es
        // parte de la definición del formato, así que ahí sí se comprime. En
        // mobile tampoco: la tabla va como bloque HTML debajo (no flota, no hay
        // nada que pisar) y con tipografías grandes el alto extra se dispara.
        if (!editorFormat && !mobile) H += extra;
      }
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
    : { tick: 11, axisLabel: 10.5, label: VRM_LABEL_FONT_SIZE, tableTitle: 10, tableLabel: 11 };
  const vr_pick = (v, fb) => (v != null ? v : fb);   // sin nullish coalescing (esprima no parsea ES2020)
  const SIZES = {
    tick:       atlasEditorSize(aeSizes, 'ticks', FMT_SIZES.tick),
    axisLabel:  atlasEditorSize(aeSizes, 'axisTitle', FMT_SIZES.axisLabel),
    label:      atlasEditorSize(aeSizes, 'labels', FMT_SIZES.label),
    tableTitle: atlasEditorSize(aeSizes, 'special', FMT_SIZES.tableTitle),
    tableLabel: atlasEditorSize(aeSizes, 'special', FMT_SIZES.tableLabel)
  };

  const yScale = (v) => MARGIN.top + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;
  const barWidth = n > 0 ? PLOT_W / n : PLOT_W;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // Tabla: solo desktop/PNG (en mobile va como HTML colapsable).
  const tableVisible = !mobile && n > 0;
  const tableX = mobilePng ? 520 : VRM_TABLE_X;
  const tableTopY = mobilePng ? 70 : (VRM_TABLE_Y_TITLE - 10);
  const tableRowH = ((SIZES.tableLabel != null) ? SIZES.tableLabel : 11) * 1.45;
  const regionsPresent = [];
  const seenReg = new Set();
  data.forEach(d => { if (d.region && !seenReg.has(d.region)) { seenReg.add(d.region); regionsPresent.push(d.region); } });
  // Geometría REAL de la tabla: se replica la cuenta de vrm_drawRegionalAvgTable
  // (primera fila = título + 2,4 alturas de fila) en vez de estimarla, porque de
  // esta medida depende si la tabla flota o se va abajo.
  const tableFirstY = (mobilePng ? 84 : VRM_TABLE_Y_TITLE) + ((SIZES.tableLabel != null) ? SIZES.tableLabel : 11) * 2.4;
  const tableBottomY = tableFirstY + Math.max(0, regionsPresent.length - 1) * tableRowH + tableRowH * 0.25;

  // === Grid Y + ticks ===
  const yTicksAll = (typeof niceLinearTicks === 'function') ? niceLinearTicks(yMin, yMax, (mobile || mobilePng) ? 4 : 6) : [0, 20, 40, 60];
  const yTicks = yTicksAll.filter(v => v >= yMin - 0.001 && v <= yMax + 0.001);
  if (!yTicks.includes(0)) yTicks.unshift(0);
  yTicks.forEach(tv => {
    const y = yScale(tv);
    const line = vr_ns('line');
    line.setAttribute('x1', MARGIN.left);
    const crossesTable = tableVisible && tv !== 0 && y >= tableTopY && y <= tableBottomY;
    line.setAttribute('x2', crossesTable ? tableX - 10 : MARGIN.left + PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', tv === 0 ? '#9C928A' : '#ECE7D8');
    line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
    const tx = vr_ns('text');
    tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y + 4);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', '#7A6E62');
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = vd_fmtVal(tv, vd_decEje());
    svg.appendChild(tx);
  });

  // Título del eje Y, rotado.
  const yLab = vr_ns('text');
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
  yLab.textContent = (typeof t === 'function') ? t('c24-axis-mk') : '% que lo ve seguido en su barrio';
  svg.appendChild(yLab);

  // === Barras ===
  const tooltip = document.getElementById('tooltip24');
  const barsG = vr_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const x = MARGIN.left + i * barWidth;
    const y = yScale(d.pct);
    const rect = vr_ns('rect');
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
    rect.addEventListener('mouseenter', (e) => vr_showTooltip(e, d));
    rect.addEventListener('mousemove', (e) => vr_positionTooltip(e));
    rect.addEventListener('mouseleave', () => vr_hideTooltip());
    // Selección por click solo en desktop (en touch el tap es del tooltip).
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { vr_hideTooltip(); vr_toggleSelect(d.iso); });
    }
    barsG.appendChild(rect);
  });

  // === Mediana mundial (línea horizontal punteada) ===
  if (med) {
    const my = yScale(med.value);
    const mline = vr_ns('line');
    mline.setAttribute('x1', MARGIN.left);
    mline.setAttribute('x2', MARGIN.left + PLOT_W);
    mline.setAttribute('y1', my); mline.setAttribute('y2', my);
    mline.setAttribute('stroke', '#5A5346');
    mline.setAttribute('stroke-width', (mobile || mobilePng) ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', (mobile || mobilePng) ? '8 7' : '5 4');
    mline.setAttribute('pointer-events', 'none');
    svg.appendChild(mline);
    // El lado lo decide el ORDEN, no una constante: la etiqueta va donde las
    // barras son BAJAS. Con el índice (más = peor) el orden es descendente y las
    // bajas quedan a la derecha; con los cinco componentes (más = mejor) el orden
    // es ascendente y quedan a la izquierda, así que la etiqueta se muda. Antes
    // estaba fija a la derecha y en ese caso la tapaban las barras más altas
    // (reporte de Daniel 2026-07-28). Como data va ordenada de forma monótona,
    // alcanza con comparar las dos puntas.
    const bajasALaDerecha = (n < 2) || (data[0].pct >= data[n - 1].pct);
    const mlbl = vr_ns('text');
    mlbl.setAttribute('x', bajasALaDerecha ? (MARGIN.left + PLOT_W - 6) : (MARGIN.left + 6));
    mlbl.setAttribute('y', my - 6);
    mlbl.setAttribute('text-anchor', bajasALaDerecha ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = ((mobile || mobilePng) ? 26 : SIZES.tick) + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#5A5346');
    mlbl.setAttribute('paint-order', 'stroke');
    mlbl.setAttribute('stroke', '#FAF8F3');
    mlbl.setAttribute('stroke-width', (mobile || mobilePng) ? 4 : 3);
    mlbl.setAttribute('stroke-linejoin', 'round');
    mlbl.setAttribute('pointer-events', 'none');
    mlbl.textContent = ((typeof t === 'function') ? t(vr_isMean() ? 'c24-mean-lbl' : 'c24-median-lbl') : 'Mediana mundial')
      + ': ' + vd_fmtVal(med.value, vd_dec());
    svg.appendChild(mlbl);
  }

  // === Etiquetas de país rotadas con callouts ===
  const labelsG = vr_ns('g'); svg.appendChild(labelsG);
  const plotArea = { left: MARGIN.left, right: MARGIN.left + PLOT_W, top: MARGIN.top, bottom: MARGIN.top + PLOT_H, vbRight: W };
  const placed = vrm_layoutCountryLabels(data, barWidth, plotArea, labelCodes);
  placed.forEach(l => {
    const path = vr_ns('path');
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
    const txt = vr_ns('text');
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
        value: vr_agg(vals)
      };
    })
    .sort((a, b) => b.value - a.value);
  // ¿Entra la tabla flotante en el hueco arriba-derecha? Ocupa la franja-x
  // derecha (~60%→100% del ancho) y necesita libre el ~64% superior de esa
  // franja. Si las barras bajo la tabla son altas (ej. drogadictos: todas
  // >37%), no entra → la tabla se muestra como bloque debajo del gráfico en
  // vez de taparlas (opción elegida por Daniel, 2026-07-23).
  // La comparación va en PÍXELES, no en unidades del dato. La altura del área de
  // dibujo cambia sola: el margen inferior crece con las etiquetas rotadas de los
  // países elegidos, y al achicarse el plot la MISMA barra sube en pantalla. Por
  // eso cualquier umbral del tipo "0,36 del eje" se desactualiza y la tabla
  // terminaba pisando una barra (reporte de Daniel 2026-07-26).
  // Cuál es la barra más alta de la franja que ocupa la tabla: NO se puede
  // suponer que es la del borde izquierdo (eso valía cuando data iba siempre
  // descendente; con orden ascendente —los cinco componentes— la más alta es la
  // del borde derecho). Se recorre la franja y se toma el máximo: vale para
  // cualquier orden.
  const idxDesde = n > 0 ? Math.max(0, Math.min(n - 1, Math.floor((tableX - MARGIN.left) / barWidth))) : 0;
  let maxUnderTable = 0;
  for (let i = idxDesde; i < n; i++) {
    if (data[i].pct > maxUnderTable) maxUnderTable = data[i].pct;
  }
  const tableFits = yScale(maxUnderTable) > tableBottomY + tableRowH * 0.5;
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
    vrm_drawRegionalAvgTable(svg, tableRows, s1.activeRegion, SIZES, mobilePng);
  }
  vrm_drawRegionalAvgTableHTML(tableRows, s1.activeRegion);
  // Tabla HTML debajo del gráfico: en mobile SIEMPRE (si wantTable); en desktop
  // solo cuando la flotante no entra. Con el toggle apagado, no aparece.
  const belowWrap = document.getElementById('vrm-avg-table-mobile-wrap');
  if (belowWrap) {
    const showBelow = wantTable && !showSvgTable;
    belowWrap.style.display = showBelow ? 'block' : 'none';
    const det = belowWrap.querySelector('details');
    if (det && !mobile) det.open = showBelow;
  }
}

function vrm_drawRegionalAvgTable(svg, rows, activeRegion, SIZES, mobilePng) {
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
  const yFirst = (mobilePng ? 84 : VRM_TABLE_Y_TITLE) + titleGap;
  const tableX = mobilePng ? 520 : VRM_TABLE_X;
  const tableW = mobilePng ? 540 : VRM_TABLE_W;
  const tableYTitle = mobilePng ? 80 : VRM_TABLE_Y_TITLE;
  const ruleY = tableYTitle + base * 0.7;
  const g = vr_ns('g');
  g.setAttribute('id', 'vrm-avg-table');
  svg.appendChild(g);

  const title = vr_ns('text');
  title.setAttribute('class', 'm-table-title');
  title.setAttribute('x', tableX);
  title.setAttribute('y', tableYTitle);
  if (titleSize) title.style.fontSize = titleSize + 'px';
  title.textContent = (typeof t === 'function') ? t(vr_isMean() ? 'c24-avg-table-title' : 'c24-median-table-title') : 'Mediana por región';
  g.appendChild(title);

  const rule = vr_ns('line');
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

    const swatch = vr_ns('rect');
    swatch.setAttribute('class', 'm-table-swatch' + stateClass);
    swatch.setAttribute('x', tableX);
    swatch.setAttribute('y', y - swatchSize + 1);
    swatch.setAttribute('width', swatchSize);
    swatch.setAttribute('height', swatchSize);
    swatch.setAttribute('fill', row.color);
    g.appendChild(swatch);

    const labelEl = vr_ns('text');
    labelEl.setAttribute('class', 'm-table-label' + stateClass);
    labelEl.setAttribute('x', tableX + swatchSize + swatchGap);
    labelEl.setAttribute('y', y);
    if (labelSize) labelEl.style.fontSize = labelSize + 'px';
    labelEl.textContent = row.label;
    g.appendChild(labelEl);

    const valueEl = vr_ns('text');
    valueEl.setAttribute('class', 'm-table-value' + stateClass);
    if (labelSize) valueEl.style.fontSize = labelSize + 'px';
    valueEl.setAttribute('x', tableX + tableW);
    valueEl.setAttribute('y', y);
    valueEl.setAttribute('text-anchor', 'end');
    valueEl.textContent = (typeof fmt === 'function') ? vd_fmtVal(row.value, vd_dec()) : row.value.toFixed(1);
    g.appendChild(valueEl);
  });
}

// Tabla HTML colapsable (solo visible en mobile vía CSS).
function vrm_drawRegionalAvgTableHTML(rows, activeRegion) {
  const container = document.getElementById('vrm-avg-table-mobile');
  if (!container) return;
  container.innerHTML = rows.map(row => {
    const isActive = activeRegion === row.region;
    const isDimmed = activeRegion && !isActive;
    const cls = 'm-mt-row' + (isActive ? ' m-mt-row-active' : '') + (isDimmed ? ' m-mt-row-dimmed' : '');
    return `<div class="${cls}">
      <span class="m-mt-swatch" style="background:${row.color}"></span>
      <span class="m-mt-label">${row.label}</span>
      <span class="m-mt-value">${(typeof fmt === 'function') ? vd_fmtVal(row.value, vd_dec()) : row.value.toFixed(1)}</span>
    </div>`;
  }).join('');
}

//==================================================================
//  Leyenda interactiva de regiones (ambas vistas)
//  hover: atenúa las demás · click: apaga/prende la región
//
//  OJO: la leyenda se CONSTRUYE una vez por categoría/idioma
//  (vr_buildLegend) y los redraws solo sincronizan clases
//  (vr_syncLegend). Si el redraw reconstruyera los chips, el chip bajo
//  el cursor se destruiría a mitad del hover: el mouseleave nunca
//  llegaría (dim colgado) y el click caería en un nodo muerto — bug
//  real reportado por Daniel (2026-07-22).
//==================================================================
function vr_buildLegend() {
  const cont = document.getElementById('vr-legend');
  if (!cont) return;
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const cat = state[24].cat;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const key = cat + '|' + lang + '|' + state[24].wave;
  if (cont.dataset.built === key) { vr_syncLegend(); return; }
  cont.dataset.built = key;
  const present = new Set(vr_waveRows().map(r => VD_REGION[r[0]]).filter(Boolean));
  cont.innerHTML = '';
  order.filter(r => present.has(r)).forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'vr-leg-item';
    chip.dataset.region = region;
    const col = (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[region]) || '#888';
    chip.innerHTML = `<span class="vr-leg-dot" style="background:${col}"></span>${(typeof t === 'function') ? t('reg.' + region) : region}`;
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        if (vr_hidden().has(region)) return;
        state[24].activeRegion = region;
        drawVdemRank();
      });
      chip.addEventListener('mouseleave', () => {
        if (state[24].activeRegion !== region) return;
        state[24].activeRegion = null;
        drawVdemRank();
      });
    }
    chip.addEventListener('click', () => {
      const arr = state[24].hiddenRegions || (state[24].hiddenRegions = []);
      const idx = arr.indexOf(region);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(region);
      if (state[24].activeRegion === region) state[24].activeRegion = null;
      drawVdemRank();
    });
    cont.appendChild(chip);
  });
  vr_syncLegend();
}

// Sincroniza el estado on/off de los chips sin reconstruir el DOM.
function vr_syncLegend() {
  const cont = document.getElementById('vr-legend');
  if (!cont) return;
  const hid = vr_hidden();
  cont.querySelectorAll('.vr-leg-item').forEach(chip => {
    chip.classList.toggle('vr-leg-off', hid.has(chip.dataset.region));
  });
}

//==================================================================
//  Tooltip (compartido por ambas vistas)
//==================================================================
function vr_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip24');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const reg = d.region ? tt('reg.' + d.region, d.region) : '';
  // Índice, no porcentaje: dos decimales y sin signo de %.
  const F = (v) => vd_fmtVal(v, vd_dec());
  // Sin rama EVS/WVS (la batería H002 es solo del WVS). En su lugar, el puesto
  // mundial "N° de M" sobre el universo de países con los cinco ítems.
  const uni = vr_universe();
  const rankLine = (d.rank != null)
    ? `<div class="tt-row"><span>${tt('c24-tt-rank', 'Puesto mundial')}</span><span>${vr_rankLabel(d.rank, uni)}</span></div>` : '';
  tooltip.innerHTML = `
    <strong>${vr_displayName(d.iso)}</strong>
    <div class="tt-sub">${reg} · ${vr_waveLabel()}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c24-tt-pct', 'Valor')}</span><span>${F(d.pct)}</span></div>
    <div class="tt-row"><span>${tt('c24-tt-year', 'Año')}</span><span>${d.year}</span></div>
    ${rankLine}
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  vr_positionTooltip(event);
}

function vr_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip24');
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

function vr_hideTooltip() {
  const tooltip = document.getElementById('tooltip24');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Controles: categoría + vista + mediana
//==================================================================
function setupVdemRankCat() {
  const sel = document.getElementById('vr-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!VD_SERIES[sel.value]) return;
    state[24].cat = sel.value;
    vr_buildLegend();   // las regiones presentes pueden cambiar con la categoría
    drawVdemRank();
  });
}

function setupVdemRankView() {
  document.querySelectorAll('#vr-view button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v !== 'sel' && v !== 'all') return;
      if (state[24].view === v) return;
      state[24].view = v;
      document.querySelectorAll('#vr-view button')
        .forEach(b => b.classList.toggle('active', b.dataset.view === v));
      drawVdemRank();
    });
  });
}

// Slider de OLA: un solo thumb sobre las olas presentes (VR_WAVES). Al moverlo
// se ve la misma categoría en distintas ondas EVS/WVS. Default: la más reciente.
function setupVdemRankWave() {
  vr_yearsNow();
  const input = document.getElementById('vr-wave-slider');
  const disp = document.getElementById('vr-wave-display');
  // Un solo anio en el dataset -> el slider no decide nada: se esconde.
  if (!input || VR_WAVES.length < 2) {
    const grp = document.getElementById('vr-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = VR_WAVES;   // asc por ola
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  const sync = () => {
    input.value = idxOf(state[24].wave);
    if (disp) disp.textContent = vr_waveLabel();
  };
  input.addEventListener('input', () => {
    const w = waves[+input.value].w;
    if (w === state[24].wave) return;
    state[24].wave = w;
    if (disp) disp.textContent = vr_waveLabel();
    vr_buildLegend();   // las regiones presentes cambian según la ola
    drawVdemRank();
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
function setupVdemRankRefsStat() {
  const box = document.getElementById('vr-stat');
  if (!box) return;
  const sync = () => {
    box.querySelectorAll('button[data-stat]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-stat') === (state[24].stat || 'median'));
    });
    const grp = box.closest('.m-ctrl-group') || box;
    const hay = (state[24].showMedian !== false) || (state[24].showTable !== false);
    grp.style.display = hay ? '' : 'none';
  };
  box.querySelectorAll('button[data-stat]').forEach(b => {
    b.addEventListener('click', () => {
      state[24].stat = b.getAttribute('data-stat');
      sync();
      drawVdemRank();
    });
  });
  sync();
  setupVdemRankRefsStat._sync = sync;
}

function setupVdemRankRefs() {
  document.querySelectorAll('#vr-refs button[data-ref]').forEach(btn => {
    const key = btn.dataset.ref === 'table' ? 'showTable' : 'showMedian';
    btn.classList.toggle('active', state[24][key] !== false);
    btn.addEventListener('click', () => {
      state[24][key] = !(state[24][key] !== false);   // toggle
      btn.classList.toggle('active', state[24][key]);
      // el selector de estadistico se esconde si no queda ninguna referencia
      if (setupVdemRankRefsStat._sync) setupVdemRankRefsStat._sync();
      drawVdemRank();
    });
  });
}

//==================================================================
//  Buscador de países + chips (vista 'sel'; en 'all' la selección
//  espejea como spotlight + etiqueta)
//==================================================================
function vr_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function vr_searchableCountries() {
  // vd_paises() por variable: el recorrido anterior asumía la estructura por olas
  // de la batería de vecinos y devolvía basura (el buscador no encontraba nada).
  const isos = new Set();
  VD_VARS.forEach(v => vd_paises(v.k).forEach(iso => isos.add(iso)));
  return Array.from(isos)
    .sort((a, b) => vr_displayName(a).localeCompare(vr_displayName(b), 'es'))
    .map(iso => ({ iso, name: vr_displayName(iso) }));
}

function vr_toggleSelect(iso) {
  const arr = state[24].selected;
  const idx = arr.indexOf(iso);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(iso);
  renderVdemRankChips();
  drawVdemRank();
}

function renderVdemRankChips() {
  const container = document.getElementById('vr-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  const arr = state[24].selected.slice()
    .sort((a, b) => vr_displayName(a).localeCompare(vr_displayName(b), 'es'));
  arr.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = vr_regionColor(iso);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(vr_displayName(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => vr_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupVdemRankSearch() {
  const input = document.getElementById('vr-search');
  const results = document.getElementById('vr-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = vr_normalize(q);
    return vr_searchableCountries()
      .filter(c => vr_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[24].selected.includes(c.iso);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        vr_toggleSelect(el.dataset.iso);
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
      vr_toggleSelect(currentMatches[activeIdx].iso);
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
function setupVdemRankDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="24-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // El clon exportaba recorriendo VD_SERIES por olas (las claves son ISO3,
      // no olas): el archivo bajaba con encabezado y CERO filas, describiendo
      // ademas la bateria del barrio y con el MISMO nombre de archivo que el
      // CSV del barrio. Ahora: la foto del anio mostrado, con puesto mundial.
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const cat = state[24].cat, year = state[24].wave;
      let csv = '';
      csv += 'iso3,pais,variable,variable_label_en,anio,valor,puesto\n';
      const meta = vd_varMetaOf(cat);
      const labQ = '"' + (meta.en || cat) + '"';
      vd_foto(cat, year).forEach(r => {
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
        const nmQ = (nm.indexOf(',') >= 0) ? '"' + nm + '"' : nm;
        csv += [r[0], nmQ, cat, labQ, r[2], r[1], r[4]].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-04-skin-colour-discrimination.csv' : 'el-atlas-04-discriminacion-color-piel.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initVdemRank() {
  vd_fillVarSelect('vr-cat-select', VR_DEFAULT_CAT);
  // V-Dem es anual: el default es el último año CON DATO de la variable
  // (el índice llega a 2023; poder político y libertades civiles, a 2025).
  const _yrs = vd_years(VR_DEFAULT_CAT);
  const lastWave = _yrs[_yrs.length - 1];
  if (!state[24]) {
    state[24] = {
      cat: VR_DEFAULT_CAT,
      view: 'sel',
      wave: lastWave,            // default = ola más reciente (== "último dato >=2017")
      selected: [...VR_DEFAULT_SELECTED],
      showMedian: true,
      showTable: true,
      hiddenRegions: [],
      activeRegion: null
    };
  }
  if (state[24].wave == null) state[24].wave = lastWave;

  setupVdemRankCat();
  setupVdemRankView();
  setupVdemRankRefs();
  setupVdemRankRefsStat();
  setupVdemRankWave();
  setupVdemRankSearch();
  setupVdemRankDownloadCSV();
  renderVdemRankChips();
  vr_buildLegend();
  drawVdemRank();

  if (!initVdemRank._editorWired) {
    initVdemRank._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawVdemRank());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawVdemRank;

  // La nota "Datos" del PNG la pone wrp-adapter.js para las dos vistas: acá
  // pisaba la del mapa (el hook es un global) y encima cada vista terminaba con
  // una nota distinta.

  // Marimekko: los textos de la tabla regional van al canvas (las webfonts
  // no resuelven bien dentro del <img> SVG rasterizado — port del N°2).
  window.onBeforePngExport = function(svgClone, chartId) {
    if (chartId !== '24') return;
    const tableEl = svgClone.querySelector('#vrm-avg-table');
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
