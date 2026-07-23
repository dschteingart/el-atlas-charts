// =============================================================
//  El Atlas N°5 — Chart 2: la película (líneas temporales)
// =============================================================
// Evolución del rechazo declarado a cada tipo de vecino, 1981-2022, por país.
// Multi-línea con chips=selección (WYSIWYG). Default: homosexuales, con el
// derrumbe de la homofobia latinoamericana (ARG 39%→9%). Selector de categoría,
// hover que atenúa las demás líneas, etiqueta al final de cada línea.
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
    case 'newsletter': case 'square': return { top: 40, right: 200, bottom: 78, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 62, left: 70 };
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
  const cat = state[2].cat;
  const src = (typeof PELI_SERIES !== 'undefined') ? (PELI_SERIES[cat] || {}) : {};

  // series seleccionadas con dato en esta categoría
  const sel = (state[2].selected || []).filter(iso => src[iso] && src[iso].length >= 2);
  const series = sel.map(iso => ({ iso, pts: src[iso], color: pl_color(iso) }));

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, label: 24 }
    : mobile
    ? { tick: 20, axisTitle: 22, label: 22 }
    : { tick: 11, axisTitle: 11.5, label: 12.5 };

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = pl_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // dominios
  let years = []; series.forEach(s => s.pts.forEach(p => years.push(p[0])));
  const allYears = years.length ? years : [1990, 2020];
  const xMin = Math.min(...allYears), xMax = Math.max(...allYears);
  const yMaxData = series.length ? Math.max(...series.flatMap(s => s.pts.map(p => p[1]))) : 10;
  const yMax = Math.max(10, Math.ceil((yMaxData * 1.08) / 5) * 5);
  const xScale = (yr) => MARGIN.left + ((yr - xMin) / Math.max(1, xMax - xMin)) * plotW;
  const yScale = (v) => MARGIN.top + plotH - (v / yMax) * plotH;

  // grid + ticks
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
  // ticks X (años redondos)
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(xMin, xMax, mobile ? 4 : 7).filter(v => v >= xMin && v <= xMax) : [];
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

  // líneas
  const active = state[2].hover;   // iso resaltado por hover
  const linesG = pl_ns('g'); svg.appendChild(linesG);
  const labelSlots = [];   // para etiquetas al final de línea
  series.forEach(s => {
    const dim = active && active !== s.iso;
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'} ${xScale(p[0]).toFixed(1)},${yScale(p[1]).toFixed(1)}`).join(' ');
    const path = pl_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', bigFmt ? (active === s.iso ? 4.5 : 3) : (active === s.iso ? 3 : 2));
    path.setAttribute('stroke-opacity', dim ? 0.18 : 1); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    path.style.cursor = 'pointer'; path.dataset.iso = s.iso;
    linesG.appendChild(path);
    // puntos
    s.pts.forEach(p => {
      const c = pl_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', bigFmt ? 4 : 2.6); c.setAttribute('fill', s.color); c.setAttribute('fill-opacity', dim ? 0.18 : 1);
      linesG.appendChild(c);
    });
    // slot de etiqueta al final
    const last = s.pts[s.pts.length - 1];
    labelSlots.push({ iso: s.iso, color: s.color, y: yScale(last[1]), x: xScale(last[0]), dim });
    // hover en la línea
    path.addEventListener('mouseenter', () => { if (HAS_HOVER) { state[2].hover = s.iso; drawPelicula(); } });
    path.addEventListener('mouseleave', () => { if (HAS_HOVER && state[2].hover === s.iso) { state[2].hover = null; drawPelicula(); } });
  });

  // etiquetas al final (anti-colisión simple en Y)
  labelSlots.sort((a, b) => a.y - b.y);
  const labelH = (bigFmt ? SIZES.label : SIZES.label) * 1.05;
  for (let i = 1; i < labelSlots.length; i++) {
    if (labelSlots[i].y - labelSlots[i - 1].y < labelH) labelSlots[i].y = labelSlots[i - 1].y + labelH;
  }
  const maxY = MARGIN.top + plotH;
  const overflow = labelSlots.length ? Math.max(0, labelSlots[labelSlots.length - 1].y - maxY) : 0;
  if (overflow > 0) labelSlots.forEach(s => s.y -= overflow);
  const labG = pl_ns('g'); svg.appendChild(labG);
  labelSlots.forEach(s => {
    const tx = pl_ns('text'); tx.setAttribute('x', MARGIN.left + plotW + 8); tx.setAttribute('y', s.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', 600);
    tx.setAttribute('fill', s.color); tx.setAttribute('fill-opacity', s.dim ? 0.3 : 1);
    tx.textContent = pl_name(s.iso); labG.appendChild(tx);
  });

  // eje 0
  const zero = pl_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', PL_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair táctil
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, () => {});

  // título insight→neutral: insight solo en el estado default (homosexuales +
  // selección default)
  if (typeof atlasSetHeading === 'function') {
    const s2 = state[2];
    const selDefault = s2.cat === PL_DEFAULT_CAT && s2.selected.length === PL_DEFAULT_SEL.length
      && PL_DEFAULT_SEL.every(i => s2.selected.includes(i));
    atlasSetHeading('2', selDefault, { title: 'c2-title', titleNeutral: 'c2-title-neutral' });
  }
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
  if (!state[2]) state[2] = { cat: PL_DEFAULT_CAT, selected: [...PL_DEFAULT_SEL], hover: null };
  const sel = document.getElementById('pl-cat-select'); if (sel) sel.value = state[2].cat;
  setupPeliculaCat(); setupPeliculaSearch(); setupPeliculaCSV();
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
