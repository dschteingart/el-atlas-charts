// =============================================================
//  El Atlas N°5 — Ranking de rechazo a vecinos (chart 1)
// =============================================================
//
// Barras horizontales: % que no querría tener de vecinos a [categoría],
// último dato disponible por país (2017-2022, IVS = EVS+WVS). Motor clonado
// de 03-futbol/talento.js (criterio "clonar el motor, no reimplementar").
//
// Inputs (data-vecinos.js):
//   - VE_CATS: orden de las 9 categorías globales.
//   - VE_FOTO: {cat: [[iso3, pct, year, study, n], ...]} asc por pct.
//   - VE_REGION: {iso3: region Atlas} (colores de lib/regions.js).
//
// State (state[1]):
//   - cat: slug de la categoría activa (default 'otra_raza')
//   - view: 'sel' (selección editable) | 'all' (los ~92 países)
//   - selected: array de iso3 (default LatAm + referencias)

//==================================================================
//  Constantes
//==================================================================
const RK_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const RK_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 56, left: 110 };

const RK_LATAM_REGIONS = new Set(['Latin America', 'Caribbean']);
// 13 LatAm con dato 2017+ más referencias de cada región del mundo.
const RK_DEFAULT_SELECTED = [
  'ARG','BOL','BRA','CHL','COL','ECU','GTM','MEX','NIC','PER','PRI','URY','VEN',
  'USA','ESP','FRA','ITA','DEU','SWE','JPN','TUR','ZAF'
];

const RK_SVG_NS = 'http://www.w3.org/2000/svg';
const rk_ns = (tag) => document.createElementNS(RK_SVG_NS, tag);

// Márgenes por formato de PNG (mobile-first). Left amplio para los nombres de
// país a tamaño grande; bottom con espacio extra para la leyenda de regiones.
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

function rk_isLatam(iso) { return RK_LATAM_REGIONS.has(VE_REGION[iso]); }

// Filas de la categoría activa según la vista. VE_FOTO ya viene asc por pct.
function rk_computeData() {
  const s = state[1];
  const rows = (VE_FOTO[s.cat] || []).map(r => ({
    iso: r[0], pct: r[1], year: r[2], study: r[3], n: r[4]
  }));
  if (s.view === 'all') return rows;
  const sel = new Set(s.selected);
  return rows.filter(r => sel.has(r.iso));
}

function rk_median() {
  const rows = VE_FOTO[state[1].cat] || [];
  if (!rows.length) return null;
  const v = rows.map(r => r[1]);           // ya ordenado asc
  const mid = Math.floor(v.length / 2);
  const med = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return { value: med, n: v.length };
}

//==================================================================
//  Subtítulo dinámico (con la categoría activa)
//==================================================================
function rk_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c1-subtitle"]');
  if (!el) return;
  // No pisar el subtítulo custom del editor (?nl=1).
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;
  const tpl = (typeof t === 'function') ? t('c1-subtitle-tpl') : '';
  const cat = (typeof t === 'function') ? t('catA-' + state[1].cat) : state[1].cat;
  el.textContent = tpl.replace('{CAT}', cat);
}

//==================================================================
//  Renderer SVG (barras horizontales)
//==================================================================
function drawRanking() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';
  rk_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && rk_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = rk_computeData();
  const n = data.length;
  const med = rk_median();

  // El buscador + chips son de la vista 'sel'; en 'all' se ocultan.
  const allView = state[1].view === 'all';
  const _picker = document.getElementById('rk-country-picker');
  if (_picker) _picker.style.display = allView ? 'none' : '';

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24, legend: 22 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20, legend: 0 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11, legend: 0 };

  // En formato PNG la altura es FIJA (vbH) y el grosor de barra se calcula
  // para llenar el alto disponible. En pantalla: grosor fijo, altura dinámica.
  let RK_W, RK_MARGIN, RK_BAR_H, RK_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    RK_W = f.vbW; totalH = f.vbH; RK_MARGIN = rk_getMargins(editorFormat);
    RK_BAR_GAP = Math.max(4, Math.round(110 / n));
    plotH = totalH - RK_MARGIN.top - RK_MARGIN.bottom;
    RK_BAR_H = (plotH - (n - 1) * RK_BAR_GAP) / n;
    // Con muchas barras (vista 'all') los nombres no entran a 28px: escalamos.
    const fitName = Math.floor((RK_BAR_H + RK_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    RK_W = 1100;
    RK_MARGIN = mobile ? { ...RK_MARGIN_MOBILE } : { ...RK_MARGIN_DESKTOP };
    RK_BAR_H = mobile ? 42 : 20; RK_BAR_GAP = mobile ? 13 : 5;
    plotH = n * (RK_BAR_H + RK_BAR_GAP) - RK_BAR_GAP;
    totalH = RK_MARGIN.top + plotH + RK_MARGIN.bottom;
  }

  // Margen izquierdo dinámico para que entre el nombre más largo mostrado.
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

  // === Grid vertical + ticks X ===
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

  // Eje X título
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

  // === Barras + labels ===
  const barsG = rk_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = RK_MARGIN.top + i * (RK_BAR_H + RK_BAR_GAP);
    const latam = rk_isLatam(d.iso);
    const color = rk_regionColor(d.iso);
    const barW = xScale(d.pct) - RK_MARGIN.left;

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
    rect.setAttribute('fill-opacity', 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      rect.setAttribute('fill-opacity', 1);
      rk_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => rk_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', 0.92);
      rk_hideTooltip();
    });
    // Desktop, vista selección: click en la barra saca al país (criterio 11f).
    // En touch el tap es del tooltip; en 'all' las barras son fijas.
    if (!allView && HAS_HOVER) {
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
    valTxt.setAttribute('fill', '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = (typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct;
    barsG.appendChild(valTxt);
  });

  // === Mediana mundial (línea vertical punteada sobre todos los países) ===
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
    // Si la mediana cae muy a la derecha, anclamos el label hacia la izquierda.
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

  // Línea cero
  const zeroLine = rk_ns('line');
  zeroLine.setAttribute('x1', RK_MARGIN.left); zeroLine.setAttribute('x2', RK_MARGIN.left);
  zeroLine.setAttribute('y1', RK_MARGIN.top);
  zeroLine.setAttribute('y2', RK_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);

  // === Leyenda de regiones ===
  // En pantalla: HTML bajo los controles. En PNG: dentro del SVG (abajo).
  rk_renderHtmlLegend(data);
  if (editorFormat && SIZES.legend > 0) {
    rk_drawSvgLegend(svg, data, RK_W, RK_MARGIN.top + plotH + (bigFmt ? 96 : 60), SIZES.legend);
  }

  // Título dinámico: insight (Río de la Plata) solo con la categoría default
  // y la selección default (o vista 'todos', donde el ranking mundial se ve).
  const s = state[1];
  const selDefault = s.selected.length === RK_DEFAULT_SELECTED.length
    && RK_DEFAULT_SELECTED.every(iso => s.selected.includes(iso));
  const isInsight = s.cat === 'otra_raza' && (s.view === 'all' || selDefault);
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('1', isInsight, { title: 'c1-title', titleNeutral: 'c1-title-neutral' });
  }
}

// Leyenda HTML (pantalla): regiones presentes en la vista, con su color.
function rk_renderHtmlLegend(data) {
  const cont = document.getElementById('rk-legend');
  if (!cont) return;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const present = [];
  const seen = new Set();
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  data.forEach(d => { const r = VE_REGION[d.iso]; if (r && !seen.has(r)) { seen.add(r); } });
  order.forEach(r => { if (seen.has(r)) present.push(r); });
  cont.innerHTML = present.map(r => {
    const col = (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || '#888';
    const name = (typeof t === 'function') ? t('reg.' + r) : r;
    return `<span class="rk-leg-item"><span class="rk-leg-dot" style="background:${col}"></span>${name}</span>`;
  }).join('');
}

// Leyenda dentro del SVG para el PNG (filas centradas de dot+label).
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
  // Repartimos en filas que entren en el ancho.
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
//  Tooltip
//==================================================================
function rk_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const reg = VE_REGION[d.iso] ? tt('reg.' + VE_REGION[d.iso], VE_REGION[d.iso]) : '';
  tooltip.innerHTML = `
    <strong>${rk_displayName(d.iso)}</strong>
    <div class="tt-sub">${reg}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c1-tt-pct', 'Rechazo declarado')}</span><span>${(typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct}%</span></div>
    <div class="tt-row"><span>${tt('c1-tt-survey', 'Encuesta')}</span><span>${d.study} ${d.year}</span></div>
    <div class="tt-row"><span>${tt('c1-tt-n', 'Muestra')}</span><span>${(typeof fmt === 'function') ? fmt(d.n, 0) : d.n}</span></div>
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
//  Controles: categoría + vista
//==================================================================
function setupRankingCat() {
  const sel = document.getElementById('rk-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!VE_FOTO[sel.value]) return;
    state[1].cat = sel.value;
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

//==================================================================
//  Buscador de países + chips (vista 'sel')
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
      csv += '# Ultimo dato disponible por pais (2017-2022). pct = % ponderado que menciona\n';
      csv += '# al grupo como vecino no deseado, sobre respuestas validas.\n';
      csv += 'iso3,name,region,category,pct,year,survey,n\n';
      VE_CATS.forEach(cat => {
        (VE_FOTO[cat] || []).forEach(r => {
          const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]])
            ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
          const nameQ = (name.includes(',')) ? '"' + name + '"' : name;
          csv += [r[0], nameQ, VE_REGION[r[0]] || '', cat, r[1], r[2], r[3], r[4]].join(',') + '\n';
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
  if (!state[1]) {
    state[1] = {
      cat: 'otra_raza',
      view: 'sel',
      selected: [...RK_DEFAULT_SELECTED]
    };
  }

  setupRankingCat();
  setupRankingView();
  setupRankingSearch();
  setupRankingDownloadCSV();
  renderRankingChips();
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
}
