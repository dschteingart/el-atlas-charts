// =============================================================
//  El Atlas N°5 — Chart 2: la película (líneas temporales)
// =============================================================
// Evolución del rechazo declarado a cada tipo de vecino, 1981-2022, por país.
// Chips=selección (WYSIWYG). Default: homosexuales (derrumbe de la homofobia).
// Patrón de líneas históricas del Atlas (natividad N°3): slider de período,
// hover por opacidad (sin redibujar → no se tilda), crosshair con interpolación,
// etiquetas al FINAL de cada línea (no apiladas en el margen).
//
// Datos: PELI_SERIES[cat][iso3] = [[year,pct],...] (data-pelicula.js), PELI_CATS.

const PL_SVG_NS = 'http://www.w3.org/2000/svg';
const pl_ns = (t) => document.createElementNS(PL_SVG_NS, t);
// Paleta multiserie estándar del Atlas (12 hues, criterio de la auditoría).
const PL_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const PL_AXIS = '#9C928A';
const PL_DEFAULT_CAT = 'homosexuales';
const PL_DEFAULT_SEL = ['ARG', 'BRA', 'CHL', 'MEX', 'URY'];
const PL_YEAR_MIN = 1981, PL_YEAR_MAX = 2022;
const PL_YEARS = (() => { const a = []; for (let y = PL_YEAR_MIN; y <= PL_YEAR_MAX; y++) a.push(y); return a; })();

function pl_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function pl_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function pl_measure(text, fs, w) {
  if (!pl_measure._c) { const c = document.createElement('canvas'); pl_measure._c = c.getContext('2d'); }
  pl_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return pl_measure._c.measureText(text).width;
}
function pl_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 190, bottom: 92, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 74, left: 70 };
    default: return null;
  }
}

// color persistente por país (asignado al agregar; estable al sacar otros)
function pl_color(iso) {
  const s = state[2];
  if (!s._colors) s._colors = {};
  if (s._colors[iso] == null) {
    const used = new Set(Object.values(s._colors));
    let idx = 0; while (used.has(idx) && idx < PL_PALETTE.length) idx++;
    s._colors[iso] = idx % PL_PALETTE.length;
  }
  return PL_PALETTE[s._colors[iso]];
}

// valor interpolado de una serie en un año (null si el año cae fuera del rango
// con datos de esa serie). Para el crosshair.
function pl_valueAt(pts, year) {
  if (!pts.length) return null;
  if (year <= pts[0][0]) return year === pts[0][0] ? pts[0][1] : null;
  if (year >= pts[pts.length - 1][0]) return year === pts[pts.length - 1][0] ? pts[pts.length - 1][1] : null;
  for (let i = 1; i < pts.length; i++) {
    if (year <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + (y1 - y0) * (year - x0) / (x1 - x0);
    }
  }
  return null;
}

function pl_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c2-subtitle-tpl"]');
  if (!el) return;
  const catA = (typeof t === 'function') ? t('catA-' + state[2].cat) : state[2].cat;
  const tpl = (typeof t === 'function') ? t('c2-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA);
}

// países con serie en la categoría actual (para el buscador)
function pl_searchable() {
  const cat = state[2].cat;
  const src = (typeof PELI_SERIES !== 'undefined') ? (PELI_SERIES[cat] || {}) : {};
  return Object.keys(src).sort((a, b) => pl_name(a).localeCompare(pl_name(b), 'es'))
    .map(iso => ({ iso, name: pl_name(iso) }));
}

function drawPelicula() {
  const svg = document.getElementById('chart2');
  if (!svg) return;
  svg.innerHTML = '';
  pl_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || pl_isMobile();
  const mobile = !editorFormat && pl_isMobile();
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const cat = state[2].cat;
  const src = (typeof PELI_SERIES !== 'undefined') ? (PELI_SERIES[cat] || {}) : {};
  const period = state[2].period || [PL_YEAR_MIN, PL_YEAR_MAX];
  const [y0, y1] = period;

  // series seleccionadas con dato en esta categoría, recortadas al período
  const sel = (state[2].selected || []).filter(iso => src[iso] && src[iso].length >= 1);
  const series = sel.map(iso => ({
    iso, color: pl_color(iso),
    pts: src[iso].filter(p => p[0] >= y0 && p[0] <= y1)
  })).filter(s => s.pts.length >= 1);

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, label: 24 }
    : mobile
    ? { tick: 20, axisTitle: 22, label: 22 }
    : { tick: 11, axisTitle: 11.5, label: 12.5 };
  const lineW = bigFmt ? 3.4 : 2.2, haloW = lineW + (bigFmt ? 5 : 3), dotR = bigFmt ? 4 : 2.6;
  const labelHalo = bigFmt ? 5 : 3;

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = pl_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }

  // margen derecho dinámico por las etiquetas de fin de línea
  let maxLabelW = 0;
  series.forEach(s => { const w = pl_measure(pl_name(s.iso) + (isPngFormat ? '  100%' : ''), SIZES.label, 700); if (w > maxLabelW) maxLabelW = w; });
  const neededRight = (bigFmt ? 16 : 10) + maxLabelW + (bigFmt ? 12 : 8);
  MARGIN.right = Math.min(Math.round(W * 0.40), Math.max(MARGIN.right, neededRight));

  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const yMaxData = series.length ? Math.max(...series.flatMap(s => s.pts.map(p => p[1]))) : 10;
  const yMax = Math.max(10, Math.ceil((yMaxData * 1.08) / 5) * 5);
  const xScale = (yr) => MARGIN.left + ((yr - y0) / Math.max(1, y1 - y0)) * plotW;
  const yScale = (v) => MARGIN.top + plotH - (v / yMax) * plotH;

  // grid + ejes
  const gridG = pl_ns('g'); svg.appendChild(gridG);
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile ? 4 : 6)) : [0, 20, 40];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = pl_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = pl_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = Math.round(v) + '%';
    gridG.appendChild(tx);
  });
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, mobile ? 4 : 7).filter(v => v >= y0 && v <= y1) : [];
  xt.forEach(v => {
    const x = xScale(v);
    const tx = pl_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v); gridG.appendChild(tx);
  });
  // eje Y título
  const yTitle = pl_ns('text');
  const ytx = bigFmt ? 20 : 14;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c6-axis-x') : '% que no lo querría de vecino';
  svg.appendChild(yTitle);

  // capas
  const halosG = pl_ns('g'); svg.appendChild(halosG);
  const linesG = pl_ns('g'); svg.appendChild(linesG);
  const dotsG = pl_ns('g'); svg.appendChild(dotsG);
  const hitG = pl_ns('g'); svg.appendChild(hitG);

  const endLabels = [];
  series.forEach(s => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    // halo crema
    const halo = pl_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halo.setAttribute('data-pl', s.iso);
    halosG.appendChild(halo);
    // línea
    const path = pl_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('data-pl', s.iso); path.setAttribute('data-base-w', lineW); path.classList.add('pl-colored');
    linesG.appendChild(path);
    // puntos
    s.pts.forEach(p => {
      const c = pl_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3');
      c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); c.setAttribute('data-pl', s.iso); dotsG.appendChild(c);
    });
    // hit-area para el énfasis al hover (no redibuja)
    if (!isPngFormat) {
      const hit = pl_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => pl_emph(s.iso));
      hit.addEventListener('mouseleave', () => pl_emph(null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ iso: s.iso, color: s.color, text: pl_name(s.iso), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
  });

  // etiquetas al final de cada línea, con anti-colisión vertical entre las que
  // terminan cerca en X (línea guía si se corren). Estilo OWID.
  const GAP = (bigFmt ? SIZES.label : SIZES.label) + (bigFmt ? 5 : 3);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach(l => { l.y = l.idealY; });
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < endLabels.length; i++) for (let j = i + 1; j < endLabels.length; j++) {
      const a = endLabels[i], b = endLabels[j];
      const xClose = Math.abs(a.x - b.x) < maxLabelW + 10;   // solo colisionan si terminan cerca en X
      if (xClose && Math.abs(a.y - b.y) < GAP) {
        const push = (GAP - Math.abs(a.y - b.y)) / 2 + 0.5;
        if (a.y <= b.y) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; }
      }
    }
  }
  endLabels.forEach(l => { l.y = Math.max(MARGIN.top + (bigFmt ? 8 : 5), Math.min(MARGIN.top + plotH, l.y)); l.shifted = Math.abs(l.y - l.idealY) > 2; });
  const labG = pl_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const gl = pl_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY);
      gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y);
      gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5);
      gl.setAttribute('data-pl', l.iso); labG.appendChild(gl);
    }
    const tx = pl_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', bigFmt ? 700 : 600); tx.setAttribute('fill', l.color);
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-pl', l.iso);
    tx.textContent = l.text + (isPngFormat && l.valLast != null ? '  ' + Math.round(l.valLast) + '%' : '');
    labG.appendChild(tx);
  });

  // eje 0
  const zero = pl_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', PL_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair + tooltip (no en PNG)
  if (!isPngFormat && series.length) {
    pl_setupHover(svg, { W, H, MARGIN, plotW, plotH, y0, y1, xScale, yScale, series });
  }

  // título insight→neutral: insight solo en el estado default
  if (typeof atlasSetHeading === 'function') {
    const s2 = state[2];
    const periodDefault = (s2.period || [PL_YEAR_MIN, PL_YEAR_MAX])[0] === PL_YEAR_MIN && (s2.period || [PL_YEAR_MIN, PL_YEAR_MAX])[1] === PL_YEAR_MAX;
    const selDefault = s2.cat === PL_DEFAULT_CAT && s2.selected.length === PL_DEFAULT_SEL.length
      && PL_DEFAULT_SEL.every(i => s2.selected.includes(i)) && periodDefault;
    atlasSetHeading('2', selDefault, { title: 'c2-title', titleNeutral: 'c2-title-neutral' });
  }
}

// Énfasis al hover sobre una línea: atenúa el resto (NO redibuja → no se tilda).
function pl_emph(iso) {
  const svg = document.getElementById('chart2'); if (!svg) return;
  svg.querySelectorAll('[data-pl]').forEach(el => {
    const me = el.getAttribute('data-pl');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('pl-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('pl-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Crosshair vertical + tooltip con valores interpolados al año bajo el cursor.
function pl_setupHover(svg, ctx) {
  const { W, MARGIN, plotH, y0, y1, xScale, yScale, series } = ctx;
  const tooltip = document.getElementById('tooltip2');
  const hoverG = pl_ns('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = pl_ns('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', MARGIN.top); vline.setAttribute('y2', MARGIN.top + plotH);
  hoverG.appendChild(vline);
  const cap = pl_ns('rect'); cap.setAttribute('x', MARGIN.left); cap.setAttribute('y', MARGIN.top);
  cap.setAttribute('width', W - MARGIN.left - MARGIN.right); cap.setAttribute('height', plotH);
  cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xScale(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => {
      const v = pl_valueAt(s.pts, year); if (v == null) return;
      const c = pl_ns('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yScale(v)); c.setAttribute('r', 4);
      c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      rows.push({ label: pl_name(s.iso), color: s.color, v });
    });
    if (tooltip && rows.length) {
      rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${(typeof fmt === 'function') ? fmt(r.v, 1) : r.v.toFixed(1)}%</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    } else if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; }
  }
  const moveH = (ev) => {
    const rc = svg.getBoundingClientRect(); const sc = rc.width / W; const lx = ((typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left) / sc;
    if (lx < MARGIN.left || lx > W - MARGIN.right) { update(null); return; }
    const yr = Math.round(y0 + (lx - MARGIN.left) / (W - MARGIN.left - MARGIN.right) * (y1 - y0));
    update(Math.max(y0, Math.min(y1, yr)));
    if (tooltip) { const _x = (typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left, _w = tooltip.offsetWidth || 170;
      tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
      tooltip.style.top = ((typeof evClientY === 'function' ? evClientY(ev) : ev.clientY) - rc.top + 14) + 'px'; }
  };
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', () => update(null));
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, moveH);
}

// ---- chips + buscador (WYSIWYG) ----
function pl_toggle(iso) {
  const arr = state[2].selected; const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  renderPeliculaChips(); drawPelicula();
}
function renderPeliculaChips() {
  const cont = document.getElementById('pl-chips'); if (!cont) return;
  cont.innerHTML = '';
  state[2].selected.slice().sort((a, b) => pl_name(a).localeCompare(pl_name(b), 'es')).forEach(iso => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = pl_color(iso);
    chip.appendChild(dot); chip.appendChild(document.createTextNode(pl_name(iso)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => pl_toggle(iso));
    chip.appendChild(x); cont.appendChild(chip);
  });
}
function setupPeliculaSearch() {
  const input = document.getElementById('pl-search'); const results = document.getElementById('pl-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) { if (!q) return []; const qn = norm(q); return pl_searchable().filter(c => norm(c.name).includes(qn)).slice(0, 8); }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${state[2].selected.includes(c.iso) ? ' m-already' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (e) => { e.preventDefault(); pl_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); }));
  }
  input.addEventListener('input', (e) => { matches = getM(e.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pl_toggle(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}
function setupPeliculaCat() {
  const sel = document.getElementById('pl-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof PELI_SERIES === 'undefined' || !PELI_SERIES[sel.value]) return;
    state[2].cat = sel.value; drawPelicula();
  });
}
function setupPeliculaSlider() {
  if (typeof setupWcRangeSlider !== 'function') return;
  setupWcRangeSlider({
    fromId: 'pl-slider-from', toId: 'pl-slider-to', dispId: 'pl-range-display', trackId: 'pl-range-track-active',
    years: PL_YEARS,
    get: () => state[2].period, set: (p) => { state[2].period = p; },
    onChange: () => drawPelicula()
  });
}
function setupPeliculaCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — evolucion del rechazo de vecinos (IVS, EVS+WVS, 1981-2022)\n';
      csv += '# Una serie por pais y categoria (un estudio elegido por continuidad). % ponderado.\n';
      csv += 'iso3,pais,categoria,anio,pct\n';
      (typeof PELI_CATS !== 'undefined' ? PELI_CATS : Object.keys(PELI_SERIES)).forEach(cat => {
        const src = PELI_SERIES[cat] || {};
        Object.keys(src).forEach(iso => {
          const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
          src[iso].forEach(([yr, pct]) => { csv += `${iso},${nm},${cat},${yr},${pct}\n`; });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-neighbours-trend.csv' : 'el-atlas-05-evolucion-vecinos.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initPelicula() {
  if (!state[2]) state[2] = { cat: PL_DEFAULT_CAT, selected: [...PL_DEFAULT_SEL] };
  if (!state[2].period) state[2].period = [PL_YEAR_MIN, PL_YEAR_MAX];
  const sel = document.getElementById('pl-cat-select'); if (sel) sel.value = state[2].cat;
  setupPeliculaCat(); setupPeliculaSearch(); setupPeliculaSlider(); setupPeliculaCSV();
  renderPeliculaChips(); drawPelicula();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawPelicula;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initPelicula._wired) { initPelicula._wired = true; window.addEventListener('atlas-editor-change', () => drawPelicula()); }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '2') return null;
    return (typeof t === 'function') ? t('c2-sources') : null;
  };
}
