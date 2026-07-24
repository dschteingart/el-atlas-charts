// =============================================================
//  El Atlas N°5 — Chart 10: confianza al extranjero vs. desconfianza general
// =============================================================
// ¿Argentina desconfía menos del extranjero, o desconfía menos de todo el mundo?
// Scatter de 92 países, ambos ejes en la MISMA escala 0-100.
//   X = desconfía de un desconocido        (IVS G007_34_B)
//   Y = desconfía de otra nacionalidad      (G007_36_B)  [toggle → otra religión, G007_35_B]
// Como los dos ejes comparten escala se dibuja la LÍNEA DE 45° (igual desconfianza)
// y la recta de ajuste (tendencia general). Argentina cae MUY por debajo de la
// diagonal (brecha -26,4 pp) pero cerca de la tendencia (residuo -10,1): lo que
// parece xenofobia es, en buena parte, desconfianza general.
//
// Datos: CONF[iso3] = {region, x, yNat, yRel} + CONF_FIT + CONF_META (data-confianza.js).
// Placement de labels: lib/scatter-render.js (s_layoutLabels/s_relaxLabels).
// Motor clonado del scatter del chart 5 (mismo render de puntos/labels) y adaptado:
// ejes en escala común + diagonal y=x + recta de ajuste + residuo en el tooltip.

const SC_SVG_NS = 'http://www.w3.org/2000/svg';
const sc_ns = (t) => document.createElementNS(SC_SVG_NS, t);
const SC_DEFAULT_DIM = 'nat';
const SC_DOMAIN = [0, 100];            // escala común a ambos ejes (permite la 45°)
// Países siempre etiquetados: la tesis LatAm + la xenofobia específica + anclas.
const SC_LABEL_FORCED = ['ARG', 'PRI', 'BRA', 'CHL', 'PER', 'COL', 'BOL', 'MEX',
                         'ETH', 'MMR', 'PAK', 'BGD', 'USA', 'GBR', 'DEU', 'SWE', 'KOR'];
const SC_HIGHLIGHT = 'ARG';
const SC_LINE_DIAG = '#B8AE9C';        // diagonal y=x (dashed)
const SC_LINE_FIT = '#4A4A4A';         // recta de ajuste (solid)

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
    default: return { top: 40, right: 40, bottom: 84, left: 84 };
  }
}

// clave de la dimensión activa: 'nat' (default) | 'rel'
function sc_dim() { return (state[10] && state[10].dim === 'rel') ? 'rel' : 'nat'; }
function sc_yKey() { return sc_dim() === 'rel' ? 'yRel' : 'yNat'; }
function sc_fit() { return CONF_FIT[sc_dim()]; }

// Devuelve los puntos {iso, region, x (desconocido), y (extranjero)} de la dimensión.
function sc_points() {
  const yk = sc_yKey();
  const out = [];
  for (const iso in CONF) {
    const r = CONF[iso];
    if (r.x == null || r[yk] == null) continue;
    out.push({ iso, region: r.region, x: r.x, y: r[yk] });
  }
  return out;
}

// Clip de un segmento contra la caja [xmin,ymin,xmax,ymax] (Liang–Barsky). En
// coordenadas de DATO. Devuelve endpoints recortados o null si queda afuera.
function sc_clipSeg(x0, y0, x1, y1, xmin, ymin, xmax, ymax) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - xmin, xmax - x0, y0 - ymin, ymax - y0];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; }
    else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
  }
  return { x0: x0 + t0 * dx, y0: y0 + t0 * dy, x1: x0 + t1 * dx, y1: y0 + t1 * dy };
}

function sc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c10-subtitle"]');
  if (!el) return;
  const key = sc_dim() === 'rel' ? 'c10-subtitle-rel' : 'c10-subtitle-nat';
  if (typeof t === 'function') el.textContent = t(key);
}

function drawScatter() {
  const svg = document.getElementById('chart10');
  if (!svg) return;
  svg.innerHTML = '';
  sc_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || sc_isMobile();
  const mobile = !editorFormat && sc_isMobile();
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
    // Desktop: alto elegido para que el área de plot quede CUADRADA (la 45° real).
    W = 1100; H = 1090; MARGIN = { top: 30, right: 34, bottom: 58, left: 64 };
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // Plot CUADRADO centrado: los dos ejes comparten escala, así la línea y=x es una
  // verdadera diagonal a 45°. Se toma el menor lado disponible y se centra.
  const availW = W - MARGIN.left - MARGIN.right;
  const availH = H - MARGIN.top - MARGIN.bottom;
  const plotSize = Math.min(availW, availH);
  const mL = MARGIN.left + (availW - plotSize) / 2;
  const mT = MARGIN.top + (availH - plotSize) / 2;
  const plotW = plotSize, plotH = plotSize;

  // escalas: dominio COMÚN 0-100 en ambos ejes.
  const d0 = SC_DOMAIN[0], d1 = SC_DOMAIN[1];
  const xScale = (v) => mL + ((v - d0) / (d1 - d0)) * plotW;
  const yScale = (v) => mT + plotH - ((v - d0) / (d1 - d0)) * plotH;

  // grid + ticks (mismos valores en X e Y porque comparten escala)
  const gridG = sc_ns('g'); svg.appendChild(gridG);
  const ticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(d0, d1, 6) : [0, 20, 40, 60, 80, 100];
  ticks.forEach(v => {
    const x = xScale(v);
    const l = sc_ns('line'); l.setAttribute('x1', x); l.setAttribute('x2', x);
    l.setAttribute('y1', mT); l.setAttribute('y2', mT + plotH);
    l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = sc_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', mT + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v) + '%'; gridG.appendChild(tx);
  });
  ticks.forEach(v => {
    const y = yScale(v);
    const l = sc_ns('line'); l.setAttribute('x1', mL); l.setAttribute('x2', mL + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y);
    l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = sc_ns('text'); tx.setAttribute('x', mL - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v) + '%'; gridG.appendChild(tx);
  });

  const plotBox = { x1: mL, x2: mL + plotW, y1: mT, y2: mT + plotH };

  // ===== líneas de referencia (bajo los puntos) =====
  const fit = sc_fit();
  const linesG = sc_ns('g'); svg.appendChild(linesG);
  // (1) diagonal y=x: exacta de esquina a esquina (plot cuadrado + dominio común).
  const diag = sc_ns('line');
  diag.setAttribute('x1', xScale(d0)); diag.setAttribute('y1', yScale(d0));
  diag.setAttribute('x2', xScale(d1)); diag.setAttribute('y2', yScale(d1));
  diag.setAttribute('stroke', SC_LINE_DIAG); diag.setAttribute('stroke-width', bigFmt ? 2 : 1.4);
  diag.setAttribute('stroke-dasharray', bigFmt ? '9 7' : '6 5'); diag.setAttribute('fill', 'none');
  linesG.appendChild(diag);
  // (2) recta de ajuste y = intercept + slope·x, recortada al cuadro de datos.
  const seg = sc_clipSeg(d0, fit.intercept + fit.slope * d0, d1, fit.intercept + fit.slope * d1, d0, d0, d1, d1);
  if (seg) {
    const fl = sc_ns('line');
    fl.setAttribute('x1', xScale(seg.x0)); fl.setAttribute('y1', yScale(seg.y0));
    fl.setAttribute('x2', xScale(seg.x1)); fl.setAttribute('y2', yScale(seg.y1));
    fl.setAttribute('stroke', SC_LINE_FIT); fl.setAttribute('stroke-width', bigFmt ? 2.6 : 1.8);
    fl.setAttribute('fill', 'none'); fl.setAttribute('opacity', 0.9);
    linesG.appendChild(fl);
  }

  // títulos de eje
  const xTitle = sc_ns('text');
  xTitle.setAttribute('x', mL + plotW / 2); xTitle.setAttribute('y', mT + plotH + (bigFmt ? 64 : 40));
  xTitle.setAttribute('text-anchor', 'middle'); xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#5A5346'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c10-axis-x') : 'Desconfía de un desconocido (%)';
  svg.appendChild(xTitle);
  const yTitle = sc_ns('text');
  const ytx = bigFmt ? 22 : 16;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', mT + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#5A5346'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${mT + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t(sc_dim() === 'rel' ? 'c10-axis-y-rel' : 'c10-axis-y-nat') : 'Desconfía de otra nacionalidad (%)';
  svg.appendChild(yTitle);

  // puntos
  const dotsG = sc_ns('g'); svg.appendChild(dotsG);
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

  // leyenda de regiones (arriba) + leyenda de las dos líneas (abajo-derecha)
  sc_drawLegend(svg, pts, mL, mT, plotW, bigFmt, SIZES);
  sc_drawLineLegend(svg, plotBox, bigFmt, SIZES, fit);

  // título insight→neutral (por default, NEUTRAL: se pasa isDefault=false)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('10', false, { title: 'c10-title', titleNeutral: 'c10-title-neutral' });
  }
}

function sc_drawLegend(svg, pts, mL, mT, plotW, bigFmt, SIZES) {
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
  const yStart = mT + (bigFmt ? 10 : 6);
  rows.forEach((row, ri) => {
    const rowW = row.reduce((a, i) => a + widths[i], 0) - gapItem;
    let x = mL + (plotW - rowW) / 2, y = yStart + ri * rowH;
    row.forEach(i => {
      const it = items[i];
      const dot = sc_ns('circle'); dot.setAttribute('cx', x + dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', dotR); dot.setAttribute('fill', it.color); g.appendChild(dot);
      const tx = sc_ns('text'); tx.setAttribute('x', x + gapDot); tx.setAttribute('y', y);
      tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      tx.style.fontSize = fs + 'px'; tx.setAttribute('fill', '#4A4A4A');
      tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', bigFmt ? 3 : 2);
      tx.setAttribute('stroke-linejoin', 'round');
      tx.textContent = it.label; g.appendChild(tx);
      x += widths[i];
    });
  });
}

// Leyenda de las dos líneas de referencia, abajo-derecha del plot (zona vacía:
// mucha desconfianza al desconocido + poca al extranjero es rara).
function sc_drawLineLegend(svg, box, bigFmt, SIZES, fit) {
  const L = (typeof t === 'function') ? t : (k) => k;
  const fs = bigFmt ? SIZES.tick : 11;
  const swW = bigFmt ? 30 : 22, gap = bigFmt ? 9 : 6, rowH = fs * 1.7;
  const rItems = [
    { color: SC_LINE_DIAG, dash: true, label: L('c10-line-diag') },
    { color: SC_LINE_FIT, dash: false, label: `${L('c10-line-fit')} (r = ${(typeof fmt === 'function') ? fmt(fit.r, 2) : fit.r})` }
  ];
  const g = sc_ns('g'); svg.appendChild(g);
  const pad = bigFmt ? 14 : 9;
  const xRight = box.x2 - pad;
  const yBase = box.y2 - pad - (rItems.length - 1) * rowH;
  rItems.forEach((it, i) => {
    const y = yBase + i * rowH;
    const tw = sc_measure(it.label, fs, 500);
    const xText = xRight;
    const xSw1 = xText - tw - gap - swW;
    const ln = sc_ns('line');
    ln.setAttribute('x1', xSw1); ln.setAttribute('x2', xSw1 + swW);
    ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    ln.setAttribute('stroke', it.color); ln.setAttribute('stroke-width', bigFmt ? 2.6 : 1.8);
    if (it.dash) ln.setAttribute('stroke-dasharray', bigFmt ? '9 7' : '6 5');
    g.appendChild(ln);
    const tx = sc_ns('text'); tx.setAttribute('x', xText); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = fs + 'px'; tx.setAttribute('fill', '#4A4A4A');
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3');
    tx.setAttribute('stroke-width', bigFmt ? 3.5 : 2.4); tx.setAttribute('stroke-linejoin', 'round');
    tx.textContent = it.label; g.appendChild(tx);
  });
}

function sc_signed(v) {
  const f = (typeof fmt === 'function') ? fmt(Math.abs(v), 1) : Math.abs(v).toFixed(1);
  return (v >= 0 ? '+' : '−') + f;
}

function sc_showTooltip(e, p) {
  const tt = document.getElementById('tooltip10'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  const fit = sc_fit();
  const gap = p.y - p.x;                                  // brecha extranjero − desconocido
  const resid = p.y - (fit.intercept + fit.slope * p.x);  // residuo vs. tendencia
  const yLbl = sc_dim() === 'rel' ? L('c10-tt-y-rel') : L('c10-tt-y-nat');
  const pc = (v) => ((typeof fmt === 'function') ? fmt(v, 1) : v) + '%';
  tt.innerHTML = `<strong>${sc_name(p.iso)}</strong>`
    + `<div class="tt-row"><span>${L('c10-tt-x')}</span><span>${pc(p.x)}</span></div>`
    + `<div class="tt-row"><span>${yLbl}</span><span>${pc(p.y)}</span></div>`
    + `<div class="tt-row tt-gap"><span>${L('c10-tt-gap')}</span><span>${sc_signed(gap)} pp</span></div>`
    + `<div class="tt-row"><span>${L('c10-tt-resid')}</span><span>${sc_signed(resid)} pp</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
  sc_posTooltip(e);
}
function sc_posTooltip(e) {
  const tt = document.getElementById('tooltip10'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function sc_hideTooltip() { const tt = document.getElementById('tooltip10'); if (tt) tt.style.opacity = '0'; }

function setupScatterToggle() {
  document.querySelectorAll('#sc-dim button').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dim;
      if (d !== 'nat' && d !== 'rel') return;
      state[10].dim = d;
      document.querySelectorAll('#sc-dim button').forEach(b => b.classList.toggle('active', b.dataset.dim === d));
      drawScatter();
    });
  });
}

function setupScatterCSV() {
  document.querySelectorAll('button.download[data-chart="10-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const fnat = CONF_FIT.nat;
      let csv = '# El Atlas N5 — desconfianza al extranjero vs. desconfianza general (IVS EVS/WVS, ola 7, 2017-2023)\n';
      csv += '# Valores en % que dice confiar "no mucho / nada" (cat. 3-4 de 1-4), ponderado por S017.\n';
      csv += '# distrust_stranger=G007_34_B · distrust_nationality=G007_36_B · distrust_religion=G007_35_B\n';
      csv += '# gap_nationality = nationality - stranger · residual_nationality = nationality - (' + fnat.intercept + ' + ' + fnat.slope + '*stranger)\n';
      csv += 'iso3,country,region,distrust_stranger,distrust_nationality,distrust_religion,gap_nationality_pp,residual_nationality_pp\n';
      Object.keys(CONF).sort().forEach(iso => {
        const r = CONF[iso];
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
        const gap = (r.yNat - r.x).toFixed(1);
        const res = (r.yNat - (fnat.intercept + fnat.slope * r.x)).toFixed(1);
        csv += `${iso},${nm},${r.region || ''},${r.x},${r.yNat},${r.yRel},${gap},${res}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-distrust-foreigner-vs-stranger.csv' : 'el-atlas-05-desconfianza-extranjero-vs-desconocido.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initScatter() {
  if (!state[10]) state[10] = { dim: SC_DEFAULT_DIM };
  window.__atlasDefaultPngFormat = 'mobile';   // scatter cuadrado: el lienzo casi-cuadrado le da todo el ancho
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
    if (chartId !== '10') return null;
    return (typeof t === 'function') ? t('c10-sources') : null;
  };
}
