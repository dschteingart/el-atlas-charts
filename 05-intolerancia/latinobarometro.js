// =============================================================
//  El Atlas N°5 — Chart 6: Latinobarómetro (barras 2024 + líneas históricas)
// =============================================================
// Dos vistas: BARRAS = ranking de 17 países LatAm en la foto 2024 (selector de
// categoría). LÍNEAS = serie histórica de la batería de vecinos donde LB la
// repitió (homosexuales 1998/2009/2024; inmigrantes 2009/2024), con chips de
// país. La homofobia declarada cae en toda la región — fuente independiente de
// la IVS que confirma el derrumbe.
//
// Datos: LB_FOTO[cat] (data-lb.js, foto 2024); LBH[cat][iso3]=[[year,pct,n]]
// (data-lb-hist.js, serie histórica).

const LB_SVG_NS = 'http://www.w3.org/2000/svg';
const lb_ns = (t) => document.createElementNS(LB_SVG_NS, t);
const LB_ACCENT = '#BE5D32';
const LB_OTHER = '#D8A488';
const LB_AXIS = '#9C928A';
const LB_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const LB_DEFAULT_CAT = 'inmigrantes';        // barras: la historia migratoria de 2024
const LB_LINES_DEFAULT_CAT = 'homosexuales'; // líneas: la serie más larga (1998-2024)
const LB_LINES_SEL = ['ARG', 'BRA', 'CHL', 'MEX', 'URY', 'COL'];
const LB_HIGHLIGHT = 'ARG';

function lb_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768; }
function lb_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function lb_measure(text, fs, w) {
  if (!lb_measure._c) { const c = document.createElement('canvas'); lb_measure._c = c.getContext('2d'); }
  lb_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return lb_measure._c.measureText(text).width;
}
function lb_histCats() { return (typeof LBH_META !== 'undefined') ? LBH_META.cats : ['homosexuales', 'inmigrantes']; }
function lb_color(iso) {
  const s = state[6]; if (!s._colors) s._colors = {};
  if (s._colors[iso] == null) { const u = new Set(Object.values(s._colors)); let i = 0; while (u.has(i) && i < LB_PALETTE.length) i++; s._colors[iso] = i % LB_PALETTE.length; }
  return LB_PALETTE[s._colors[iso]];
}

function lb_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c6-subtitle-tpl"]');
  if (!el) return;
  const catA = (typeof t === 'function') ? t('catA-' + state[6].cat) : state[6].cat;
  const key = state[6].view === 'lines' ? 'c6-subtitle-lines' : 'c6-subtitle-tpl';
  const tpl = (typeof t === 'function') ? t(key) : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA);
}

function drawLatino() {
  lb_updateSubtitle();
  // el selector de categoría en líneas solo ofrece las que tienen historia
  const picker = document.getElementById('lb-picker');
  if (picker) picker.style.display = state[6].view === 'lines' ? '' : 'none';
  if (state[6].view === 'lines') lb_drawLines(); else lb_drawBars();
  if (typeof atlasSetHeading === 'function') atlasSetHeading('6', false, { title: 'c6-title', titleNeutral: 'c6-title-neutral' });
}

// ---------------- BARRAS (foto 2024) ----------------
function lb_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 92, bottom: 78, left: 150 };
    case 'mobile': return { top: 30, right: 66, bottom: 60, left: 128 };
    default: return null;
  }
}
function lb_drawBars() {
  const svg = document.getElementById('chart6'); if (!svg) return; svg.innerHTML = '';
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || lb_isMobile();
  const mobile = !editorFormat && lb_isMobile();
  const cat = state[6].cat;
  const data = (typeof LB_FOTO !== 'undefined' ? (LB_FOTO[cat] || []) : []).slice().sort((a, b) => b[1] - a[1]);
  const n = data.length;
  const SIZES = editorFormat ? { tick: 22, axisTitle: 25, name: 27, value: 26 }
    : mobile ? { tick: 20, axisTitle: 23, name: 24, value: 22 } : { tick: 11, axisTitle: 11.5, name: 13, value: 12.5 };
  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; totalH = f.vbH; MARGIN = lb_getMargins(editorFormat); BAR_GAP = Math.max(6, Math.round(90 / n)); plotH = totalH - MARGIN.top - MARGIN.bottom; BAR_H = (plotH - (n - 1) * BAR_GAP) / n; }
  else { W = 1100; MARGIN = mobile ? { top: 24, right: 60, bottom: 54, left: 120 } : { top: 24, right: 84, bottom: 44, left: 140 }; BAR_H = mobile ? 34 : 22; BAR_GAP = mobile ? 12 : 8; plotH = n * (BAR_H + BAR_GAP) - BAR_GAP; totalH = MARGIN.top + plotH + MARGIN.bottom; }
  let maxNameW = 0; data.forEach(d => { const w = lb_measure(lb_name(d[0]), SIZES.name, 600); if (w > maxNameW) maxNameW = w; });
  MARGIN.left = Math.min(Math.round(W * 0.34), Math.max(MARGIN.left, Math.ceil(maxNameW) + (bigFmt ? 16 : 10)));
  const plotW = W - MARGIN.left - MARGIN.right;
  const maxV = Math.max(...data.map(d => d[1]), 5);
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const xScale = (v) => MARGIN.left + (v / (maxV * 1.06)) * plotW;
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, maxV * 1.06, 5) : [0, 10, 20, 30];
  const gridG = lb_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = lb_ns('line'); line.setAttribute('x1', x); line.setAttribute('x2', x); line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH); line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1); gridG.appendChild(line);
    const lbl = lb_ns('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15)); lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62'); lbl.setAttribute('font-variant-numeric', 'tabular-nums'); lbl.textContent = Math.round(v) + '%'; gridG.appendChild(lbl);
  });
  const xTitle = lb_ns('text'); xTitle.setAttribute('x', MARGIN.left + plotW / 2); xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 60 : 36)); xTitle.setAttribute('text-anchor', 'middle'); xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500); xTitle.textContent = (typeof t === 'function') ? t('c6-axis-x') : '% que no lo querría de vecino'; svg.appendChild(xTitle);
  const barsG = lb_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const [iso, pct, nn] = d; const y = MARGIN.top + i * (BAR_H + BAR_GAP); const isHi = iso === LB_HIGHLIGHT; const barW = xScale(pct) - MARGIN.left;
    const nameTxt = lb_ns('text'); nameTxt.setAttribute('x', MARGIN.left - 8); nameTxt.setAttribute('y', y + BAR_H / 2); nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central'); nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); nameTxt.style.fontSize = SIZES.name + 'px'; nameTxt.setAttribute('font-weight', isHi ? 700 : 500); nameTxt.setAttribute('fill', isHi ? '#8B4220' : '#3A3530'); nameTxt.textContent = lb_name(iso); barsG.appendChild(nameTxt);
    const rect = lb_ns('rect'); rect.setAttribute('x', MARGIN.left); rect.setAttribute('y', y); rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H); rect.setAttribute('fill', isHi ? LB_ACCENT : LB_OTHER); rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); lb_showBarTooltip(e, iso, pct, nn); });
    rect.addEventListener('mousemove', (e) => lb_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); lb_hideTooltip(); });
    barsG.appendChild(rect);
    const valTxt = lb_ns('text'); valTxt.setAttribute('x', MARGIN.left + barW + 6); valTxt.setAttribute('y', y + BAR_H / 2); valTxt.setAttribute('dominant-baseline', 'central'); valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600); valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums'); valTxt.textContent = (typeof fmt === 'function') ? fmt(pct, 1) : pct; barsG.appendChild(valTxt);
  });
  const zero = lb_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left); zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH); zero.setAttribute('stroke', LB_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);
}

// ---------------- LÍNEAS (serie histórica) ----------------
function lb_drawLines() {
  const svg = document.getElementById('chart6'); if (!svg) return; svg.innerHTML = '';
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || lb_isMobile();
  const mobile = !editorFormat && lb_isMobile();
  const cat = state[6].cat;
  const src = (typeof LBH !== 'undefined') ? (LBH[cat] || {}) : {};
  const sel = (state[6].selected || []).filter(iso => src[iso] && src[iso].length >= 2);
  const series = sel.map(iso => ({ iso, color: lb_color(iso), pts: src[iso] }));

  const SIZES = editorFormat ? { tick: 22, axisTitle: 25, label: 24 } : mobile ? { tick: 20, axisTitle: 22, label: 22 } : { tick: 11, axisTitle: 11.5, label: 12.5 };
  const lineW = bigFmt ? 3.4 : 2.4, haloW = lineW + (bigFmt ? 5 : 3), dotR = bigFmt ? 5 : 3.4, labelHalo = bigFmt ? 5 : 3;
  let W, H, MARGIN;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = { top: 40, right: 190, bottom: 78, left: 78 }; }
  else if (mobile) { W = 1100; H = 900; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 }; }
  else { W = 1100; H = 520; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 }; }
  let maxLabelW = 0; series.forEach(s => { const w = lb_measure(lb_name(s.iso), SIZES.label, 700); if (w > maxLabelW) maxLabelW = w; });
  MARGIN.right = Math.min(Math.round(W * 0.40), Math.max(MARGIN.right, maxLabelW + (bigFmt ? 20 : 14)));
  const plotW = W - MARGIN.left - MARGIN.right, plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const years = (typeof LBH_META !== 'undefined') ? LBH_META.years : [1998, 2009, 2024];
  const xMin = Math.min(...years), xMax = Math.max(...years);
  const yMaxData = series.length ? Math.max(...series.flatMap(s => s.pts.map(p => p[1]))) : 10;
  const yMax = Math.max(10, Math.ceil((yMaxData * 1.1) / 5) * 5);
  const xScale = (yr) => MARGIN.left + ((yr - xMin) / Math.max(1, xMax - xMin)) * plotW;
  const yScale = (v) => MARGIN.top + plotH - (v / yMax) * plotH;

  const gridG = lb_ns('g'); svg.appendChild(gridG);
  ((typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, mobile ? 4 : 6) : [0, 20, 40]).forEach(v => {
    const y = yScale(v);
    const l = lb_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW); l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = lb_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y); tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = Math.round(v) + '%'; gridG.appendChild(tx);
  });
  years.forEach(yr => {
    const x = xScale(yr);
    const tx = lb_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16)); tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = yr; gridG.appendChild(tx);
  });
  const yTitle = lb_ns('text'); const ytx = bigFmt ? 20 : 14; yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2); yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500); yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`); yTitle.textContent = (typeof t === 'function') ? t('c6-axis-x') : '% que no lo querría de vecino'; svg.appendChild(yTitle);

  const halosG = lb_ns('g'); svg.appendChild(halosG);
  const linesG = lb_ns('g'); svg.appendChild(linesG);
  const hitG = lb_ns('g'); svg.appendChild(hitG);
  const endLabels = [];
  series.forEach(s => {
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    const halo = lb_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halo.setAttribute('data-lb', s.iso); halosG.appendChild(halo);
    const path = lb_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('data-lb', s.iso); path.setAttribute('data-base-w', lineW); path.classList.add('lb-colored'); linesG.appendChild(path);
    s.pts.forEach(p => { const c = lb_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); c.setAttribute('data-lb', s.iso); c.style.cursor = 'pointer';
      c.addEventListener('mouseenter', (e) => { lb_emph(s.iso); lb_showPointTooltip(e, s.iso, p); });
      c.addEventListener('mousemove', (e) => lb_posTooltip(e));
      c.addEventListener('mouseleave', () => { lb_emph(null); lb_hideTooltip(); });
      linesG.appendChild(c); });
    if (!editorFormat) { const hit = lb_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer'; hit.addEventListener('mouseenter', () => lb_emph(s.iso)); hit.addEventListener('mouseleave', () => lb_emph(null)); hitG.appendChild(hit); }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ iso: s.iso, color: s.color, text: lb_name(s.iso), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
  });
  // etiquetas al final (anti-colisión vertical)
  const GAP = SIZES.label + (bigFmt ? 5 : 3);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach(l => { l.y = l.idealY; });
  for (let pass = 0; pass < 6; pass++) for (let i = 1; i < endLabels.length; i++) if (endLabels[i].y - endLabels[i - 1].y < GAP) endLabels[i].y = endLabels[i - 1].y + GAP;
  const overflow = endLabels.length ? Math.max(0, endLabels[endLabels.length - 1].y - (MARGIN.top + plotH)) : 0;
  if (overflow > 0) endLabels.forEach(l => l.y -= overflow);
  const labG = lb_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (Math.abs(l.y - l.idealY) > 2) { const gl = lb_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY); gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y); gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5); gl.setAttribute('data-lb', l.iso); labG.appendChild(gl); }
    const tx = lb_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y); tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', bigFmt ? 700 : 600); tx.setAttribute('fill', l.color); tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round'); tx.setAttribute('data-lb', l.iso); tx.textContent = l.text + (editorFormat ? '  ' + Math.round(l.valLast) + '%' : ''); labG.appendChild(tx);
  });
  const zero = lb_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left); zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH); zero.setAttribute('stroke', LB_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);
}
function lb_emph(iso) {
  const svg = document.getElementById('chart6'); if (!svg) return;
  svg.querySelectorAll('[data-lb]').forEach(el => {
    const me = el.getAttribute('data-lb');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('lb-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('lb-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// ---------------- tooltips ----------------
function lb_showBarTooltip(e, iso, pct, nn) {
  const tt = document.getElementById('tooltip6'); if (!tt) return; const L = (typeof t === 'function') ? t : (k) => k;
  tt.innerHTML = `<strong>${lb_name(iso)}</strong>`
    + `<div class="tt-row"><span>${L('c1-tt-pct')}</span><span>${(typeof fmt === 'function') ? fmt(pct, 1) : pct}%</span></div>`
    + `<div class="tt-row"><span>${L('c6-tt-survey')}</span><span>Latinobarómetro 2024</span></div>`
    + `<div class="tt-row"><span>${L('c1-tt-n')}</span><span>${(typeof fmt === 'function') ? fmt(nn, 0) : nn}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1'; lb_posTooltip(e);
}
function lb_showPointTooltip(e, iso, p) {
  const tt = document.getElementById('tooltip6'); if (!tt) return; const L = (typeof t === 'function') ? t : (k) => k;
  tt.innerHTML = `<strong>${lb_name(iso)}</strong>`
    + `<div class="tt-row"><span>${p[0]}</span><span>${(typeof fmt === 'function') ? fmt(p[1], 1) : p[1]}%</span></div>`
    + `<div class="tt-row"><span>${L('c1-tt-n')}</span><span>${(typeof fmt === 'function') ? fmt(p[2], 0) : p[2]}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1'; lb_posTooltip(e);
}
function lb_posTooltip(e) {
  const tt = document.getElementById('tooltip6'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function lb_hideTooltip() { const tt = document.getElementById('tooltip6'); if (tt) tt.style.opacity = '0'; }

// ---------------- controles ----------------
function lb_syncCatOptions() {
  // en líneas, dejar solo las categorías con serie histórica
  const sel = document.getElementById('lb-cat-select'); if (!sel) return;
  const histOnly = state[6].view === 'lines';
  const hc = new Set(lb_histCats());
  Array.from(sel.options).forEach(o => { o.hidden = histOnly && !hc.has(o.value); });
  if (histOnly && !hc.has(state[6].cat)) { state[6].cat = LB_LINES_DEFAULT_CAT; }
  sel.value = state[6].cat;
}
function setupLatinoView() {
  document.querySelectorAll('#lb-view button').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.dataset.view; if (v !== 'bars' && v !== 'lines' || state[6].view === v) return;
    state[6].view = v;
    document.querySelectorAll('#lb-view button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    lb_syncCatOptions(); drawLatino();
  }));
}
function setupLatinoCat() {
  const sel = document.getElementById('lb-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (state[6].view === 'lines' ? (typeof LBH === 'undefined' || !LBH[sel.value]) : (typeof LB_FOTO === 'undefined' || !LB_FOTO[sel.value])) return;
    state[6].cat = sel.value; drawLatino();
  });
}
function lb_toggle(iso) { const a = state[6].selected; const i = a.indexOf(iso); if (i >= 0) a.splice(i, 1); else a.push(iso); renderLatinoChips(); drawLatino(); }
function renderLatinoChips() {
  const cont = document.getElementById('lb-chips'); if (!cont) return; cont.innerHTML = '';
  state[6].selected.slice().sort((a, b) => lb_name(a).localeCompare(lb_name(b), 'es')).forEach(iso => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = lb_color(iso); chip.appendChild(dot);
    chip.appendChild(document.createTextNode(lb_name(iso)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×'; x.addEventListener('click', () => lb_toggle(iso)); chip.appendChild(x);
    cont.appendChild(chip);
  });
}
function lb_searchable() {
  const src = (typeof LBH !== 'undefined') ? (LBH[state[6].cat] || {}) : {};
  return Object.keys(src).sort((a, b) => lb_name(a).localeCompare(lb_name(b), 'es')).map(iso => ({ iso, name: lb_name(iso) }));
}
function setupLatinoSearch() {
  const input = document.getElementById('lb-search'), results = document.getElementById('lb-search-results');
  if (!input || !results) return; let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${state[6].selected.includes(c.iso) ? ' m-already' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (e) => { e.preventDefault(); lb_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); }));
  }
  input.addEventListener('input', (e) => { const q = norm(e.target.value); matches = q ? lb_searchable().filter(c => norm(c.name).includes(q)).slice(0, 8) : []; active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); lb_toggle(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}
function setupLatinoCSV() {
  document.querySelectorAll('button.download[data-chart="6-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
    let csv = '# El Atlas N5 — Latinobarometro: bateria de vecinos (foto 2024 + serie historica)\n';
    csv += 'iso3,pais,categoria,anio,pct,n\n';
    (typeof LB_CATS !== 'undefined' ? LB_CATS : Object.keys(LB_FOTO)).forEach(c => (LB_FOTO[c] || []).forEach(([iso, pct, nn]) => {
      const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso; csv += `${iso},${nm},${c},2024,${pct},${nn}\n`; }));
    if (typeof LBH !== 'undefined') Object.keys(LBH).forEach(c => Object.keys(LBH[c]).forEach(iso => LBH[c][iso].forEach(([yr, pct, nn]) => {
      if (yr === 2024) return; const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso; csv += `${iso},${nm},${c},${yr},${pct},${nn}\n`; })));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = lang === 'en' ? 'the-atlas-05-latinobarometro.csv' : 'el-atlas-05-latinobarometro.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initLatino() {
  if (!state[6]) state[6] = { cat: LB_DEFAULT_CAT, view: 'bars', selected: [...LB_LINES_SEL] };
  if (!state[6].selected) state[6].selected = [...LB_LINES_SEL];
  const sel = document.getElementById('lb-cat-select'); if (sel) sel.value = state[6].cat;
  setupLatinoView(); setupLatinoCat(); setupLatinoSearch(); setupLatinoCSV();
  renderLatinoChips(); lb_syncCatOptions(); drawLatino();
  window.__atlasSupportsFormats = true; window.__atlasRedraw = drawLatino;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initLatino._wired) { initLatino._wired = true; window.addEventListener('atlas-editor-change', () => drawLatino()); }
  window.onBeforePngExportGetSourceText = function (chartId) { if (chartId !== '6') return null; return (typeof t === 'function') ? t('c6-sources') : null; };
}
