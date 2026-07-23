// =============================================================
//  El Atlas N°5 — Chart 5: declarado vs implícito (scatter)
// =============================================================
// El contrapunto metodológico. Eje X: rechazo DECLARADO (IVS, % que no querría
// de vecino). Eje Y: sesgo IMPLÍCITO (Project Implicit, D-score del IAT; >0 =
// sesgo a favor del grupo dominante: blancos sobre negros / heteros sobre gays).
// Toggle raza ↔ sexualidad. Argentina cae arriba-izquierda: declara poquísimo
// pero asocia mucho — la respuesta a "declaran poco porque les da vergüenza".
//
// Datos: IMP[iso3] = {region, dRace, iRace, dGay, iGay} (data-implicito.js).
// Placement de labels: lib/scatter-render.js (s_layoutLabels/s_relaxLabels).

const SC_SVG_NS = 'http://www.w3.org/2000/svg';
const sc_ns = (t) => document.createElementNS(SC_SVG_NS, t);
const SC_AXIS = '#9C928A';
const SC_DEFAULT_DIM = 'race';
// Países siempre etiquetados (la tesis + referencias); ARG resaltado.
const SC_LABEL_FORCED = ['ARG', 'BRA', 'COL', 'MEX', 'USA', 'GBR', 'FRA', 'DEU', 'JPN', 'KOR', 'ZAF', 'IND', 'ITA', 'ESP'];
const SC_HIGHLIGHT = 'ARG';

function sc_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function sc_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function sc_regionColor(reg) {
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function sc_measure(text, fs, w) {
  if (!sc_measure._c) { const c = document.createElement('canvas'); sc_measure._c = c.getContext('2d'); }
  sc_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return sc_measure._c.measureText(text).width;
}
function sc_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 44, right: 40, bottom: 92, left: 92 };
    case 'mobile': return { top: 34, right: 34, bottom: 76, left: 78 };
    default: return null;
  }
}

// Devuelve los puntos {iso, region, x (declarado), y (implícito)} de la dimensión.
function sc_points() {
  const dim = state[5].dim;
  const dk = dim === 'race' ? 'dRace' : 'dGay';
  const ik = dim === 'race' ? 'iRace' : 'iGay';
  const out = [];
  for (const iso in IMP) {
    const r = IMP[iso];
    if (r[dk] == null || r[ik] == null) continue;
    out.push({ iso, region: r.region, x: r[dk], y: r[ik] });
  }
  return out;
}

function sc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c5-subtitle"]');
  if (!el) return;
  const key = state[5].dim === 'race' ? 'c5-subtitle-race' : 'c5-subtitle-gay';
  if (typeof t === 'function') el.textContent = t(key);
}

function drawScatter() {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.innerHTML = '';
  sc_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || sc_isMobile();
  const mobile = !editorFormat && sc_isMobile();
  const dim = state[5].dim;
  const pts = sc_points();

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 26, label: 24, dot: 9 }
    : mobile
    ? { tick: 20, axisTitle: 23, label: 22, dot: 8 }
    : { tick: 11, axisTitle: 12, label: 12, dot: 5.5 };

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH; MARGIN = sc_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1100; MARGIN = { top: 30, right: 30, bottom: 66, left: 72 };
  } else {
    W = 1100; H = 620; MARGIN = { top: 24, right: 30, bottom: 54, left: 68 };
  }
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // escalas. X declarado 0→max; Y implícito min→max con colchón.
  const xMax = Math.max(...pts.map(p => p.x), 5) * 1.08;
  const yVals = pts.map(p => p.y);
  const yMin = Math.min(...yVals), yMaxV = Math.max(...yVals);
  const yPad = (yMaxV - yMin) * 0.12 || 0.05;
  const y0 = yMin - yPad, y1 = yMaxV + yPad;
  const xScale = (v) => MARGIN.left + (v / xMax) * plotW;
  const yScale = (v) => MARGIN.top + plotH - ((v - y0) / (y1 - y0)) * plotH;

  // grid + ticks
  const gridG = sc_ns('g'); svg.appendChild(gridG);
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 6) : [0, 10, 20, 30];
  xticks.forEach(v => {
    const x = xScale(v);
    const l = sc_ns('line'); l.setAttribute('x1', x); l.setAttribute('x2', x);
    l.setAttribute('y1', MARGIN.top); l.setAttribute('y2', MARGIN.top + plotH);
    l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = sc_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v) + '%'; gridG.appendChild(tx);
  });
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, 5) : [];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = sc_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y);
    l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = sc_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = v.toFixed(2); gridG.appendChild(tx);
  });

  // títulos de eje
  const xTitle = sc_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2); xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 64 : 40));
  xTitle.setAttribute('text-anchor', 'middle'); xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#5A5346'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c5-axis-x') : 'Rechazo declarado (%)';
  svg.appendChild(xTitle);
  const yTitle = sc_ns('text');
  const ytx = bigFmt ? 22 : 16;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#5A5346'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c5-axis-y') : 'Sesgo implícito (IAT)';
  svg.appendChild(yTitle);

  // puntos
  const dotsG = sc_ns('g'); svg.appendChild(dotsG);
  const plotBox = { x1: MARGIN.left, x2: MARGIN.left + plotW, y1: MARGIN.top, y2: MARGIN.top + plotH };
  pts.forEach(p => {
    const cx = xScale(p.x), cy = yScale(p.y);
    const isHi = p.iso === SC_HIGHLIGHT;
    const c = sc_ns('circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy);
    c.setAttribute('r', isHi ? SIZES.dot * 1.4 : SIZES.dot);
    c.setAttribute('fill', sc_regionColor(p.region));
    c.setAttribute('fill-opacity', isHi ? 1 : 0.82);
    c.setAttribute('stroke', isHi ? '#3A3530' : '#FAF8F3');
    c.setAttribute('stroke-width', isHi ? 2 : 1);
    c.style.cursor = 'pointer'; c.dataset.iso = p.iso;
    c.addEventListener('mouseenter', (e) => sc_showTooltip(e, p));
    c.addEventListener('mousemove', (e) => sc_posTooltip(e));
    c.addEventListener('mouseleave', () => sc_hideTooltip());
    // hit-area invisible más grande (touch)
    const hit = sc_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', Math.max(14, SIZES.dot * 2));
    hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', (e) => sc_showTooltip(e, p));
    hit.addEventListener('mousemove', (e) => sc_posTooltip(e));
    hit.addEventListener('mouseleave', () => sc_hideTooltip());
    hit.addEventListener('click', (e) => sc_showTooltip(e, p));
    dotsG.appendChild(c); dotsG.appendChild(hit);
  });

  // labels (scatter-render): forced para la tesis + referencias
  const forcedSet = new Set(SC_LABEL_FORCED);
  const items = pts.filter(p => forcedSet.has(p.iso)).map(p => {
    const text = sc_name(p.iso);
    return { cx: xScale(p.x), cy: yScale(p.y), text, textW: sc_measure(text, SIZES.label, p.iso === SC_HIGHLIGHT ? 700 : 500),
             iso: p.iso, region: p.region, forced: true, r: (p.iso === SC_HIGHLIGHT ? SIZES.dot * 1.4 : SIZES.dot) };
  });
  let placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, plotBox) : [];
  if (bigFmt && typeof s_relaxLabels === 'function') {
    const obstacles = pts.map(p => ({ x: xScale(p.x), y: yScale(p.y), r: SIZES.dot + 2 }));
    s_relaxLabels(placed, SIZES.label, plotBox, 60, obstacles);
  }
  const labelsG = sc_ns('g'); svg.appendChild(labelsG);
  placed.forEach(l => {
    // linea guía si el label se alejó del punto
    const it = items.find(i => i.iso === l.iso);
    if (it) {
      const dx = l.lx - it.cx, dy = l.ly - it.cy;
      if (Math.hypot(dx, dy) > (it.r + 12)) {
        const gl = sc_ns('line');
        gl.setAttribute('x1', it.cx); gl.setAttribute('y1', it.cy);
        gl.setAttribute('x2', l.lx); gl.setAttribute('y2', l.ly - SIZES.label * 0.3);
        gl.setAttribute('stroke', '#B8AE9C'); gl.setAttribute('stroke-width', bigFmt ? 1 : 0.7);
        labelsG.appendChild(gl);
      }
    }
    const tx = sc_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px';
    tx.setAttribute('font-weight', l.iso === SC_HIGHLIGHT ? 700 : 500);
    tx.setAttribute('fill', l.iso === SC_HIGHLIGHT ? '#8B4220' : '#3A3530');
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3');
    tx.setAttribute('stroke-width', bigFmt ? 4 : 2.6); tx.setAttribute('stroke-linejoin', 'round');
    tx.textContent = l.text;
    labelsG.appendChild(tx);
  });

  // leyenda de regiones (compacta, dentro del SVG, arriba)
  sc_drawLegend(svg, pts, MARGIN, plotW, bigFmt, SIZES);

  // título insight→neutral (insight solo en la dimensión default = raza)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('5', dim === SC_DEFAULT_DIM, { title: 'c5-title', titleNeutral: 'c5-title-neutral' });
  }
}

function sc_drawLegend(svg, pts, MARGIN, plotW, bigFmt, SIZES) {
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const present = order.filter(r => pts.some(p => p.region === r));
  const fs = bigFmt ? SIZES.tick : 11;
  const dotR = bigFmt ? 7 : 5, gapDot = dotR * 2 + 5, gapItem = bigFmt ? 26 : 16;
  const items = present.map(r => ({ region: r, color: sc_regionColor(r), label: (typeof t === 'function') ? t('reg.' + r) : r }));
  const widths = items.map(it => gapDot + sc_measure(it.label, fs, 500) + gapItem);
  // filas centradas arriba del plot
  const rows = []; let cur = [], curW = 0;
  items.forEach((it, i) => { if (curW + widths[i] > plotW * 0.98 && cur.length) { rows.push(cur); cur = []; curW = 0; } cur.push(i); curW += widths[i]; });
  if (cur.length) rows.push(cur);
  const g = sc_ns('g'); svg.appendChild(g);
  const rowH = fs * 1.6;
  const yStart = MARGIN.top + (bigFmt ? 10 : 6);
  rows.forEach((row, ri) => {
    const rowW = row.reduce((a, i) => a + widths[i], 0) - gapItem;
    let x = MARGIN.left + (plotW - rowW) / 2, y = yStart + ri * rowH;
    row.forEach(i => {
      const it = items[i];
      const dot = sc_ns('circle'); dot.setAttribute('cx', x + dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', dotR); dot.setAttribute('fill', it.color); g.appendChild(dot);
      const tx = sc_ns('text'); tx.setAttribute('x', x + gapDot); tx.setAttribute('y', y);
      tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      tx.style.fontSize = fs + 'px'; tx.setAttribute('fill', '#4A4A4A'); tx.textContent = it.label; g.appendChild(tx);
      x += widths[i];
    });
  });
}

function sc_showTooltip(e, p) {
  const tt = document.getElementById('tooltip5'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  tt.innerHTML = `<strong>${sc_name(p.iso)}</strong>`
    + `<div class="tt-row"><span>${L('c5-tt-declared')}</span><span>${(typeof fmt === 'function') ? fmt(p.x, 1) : p.x}%</span></div>`
    + `<div class="tt-row"><span>${L('c5-tt-implicit')}</span><span>${p.y.toFixed(2)}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
  sc_posTooltip(e);
}
function sc_posTooltip(e) {
  const tt = document.getElementById('tooltip5'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function sc_hideTooltip() { const tt = document.getElementById('tooltip5'); if (tt) tt.style.opacity = '0'; }

function setupScatterToggle() {
  document.querySelectorAll('#sc-dim button').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dim;
      if (d !== 'race' && d !== 'gay') return;
      state[5].dim = d;
      document.querySelectorAll('#sc-dim button').forEach(b => b.classList.toggle('active', b.dataset.dim === d));
      drawScatter();
    });
  });
}

function setupScatterCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — declarado (IVS) vs implicito (Project Implicit, IAT D-score)\n';
      csv += '# dRace/dGay: % que no querria de vecino (IVS, ultimo dato). iRace/iGay: D-score IAT (>0 sesgo pro-dominante).\n';
      csv += 'iso3,pais,region,decl_raza,impl_raza,decl_gay,impl_gay\n';
      Object.keys(IMP).sort().forEach(iso => {
        const r = IMP[iso];
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
        csv += `${iso},${nm},${r.region || ''},${r.dRace ?? ''},${r.iRace ?? ''},${r.dGay ?? ''},${r.iGay ?? ''}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-declared-vs-implicit.csv' : 'el-atlas-05-declarado-vs-implicito.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initScatter() {
  if (!state[5]) state[5] = { dim: SC_DEFAULT_DIM };
  setupScatterToggle();
  setupScatterCSV();
  drawScatter();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawScatter;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initScatter._wired) {
    initScatter._wired = true;
    window.addEventListener('atlas-editor-change', () => drawScatter());
  }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '5') return null;
    return (typeof t === 'function') ? t('c5-sources') : null;
  };
}
