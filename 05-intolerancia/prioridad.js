// =============================================================
//  El Atlas N°5 — Chart 7: "Primero los de acá" (líneas temporales)
// =============================================================
// Prioridad a los nativos / a los varones cuando escasea el trabajo, 1990-2023,
// por país. Toggle de indicador (origen = C002 nativos>inmigrantes;
// genero = C001 varones>mujeres). Chips=selección (WYSIWYG).
// Default: ARG BRA CHL MEX PER URY, indicador origen.
// Clon del motor de la película N°5 (pelicula.js): slider de período, hover por
// opacidad (sin redibujar → no se tilda), crosshair con interpolación,
// etiquetas al FINAL de cada línea.
//
// Datos: PRIO_SERIES[ind][iso3] = [[year,pct,n],...] (data-prioridad.js),
// PRIO_META, PRIO_REGION. El eje X va en AÑO REAL (las olas no coinciden entre
// países). n queda en el dato pero no se dibuja.

const PR_SVG_NS = 'http://www.w3.org/2000/svg';
const pr_ns = (t) => document.createElementNS(PR_SVG_NS, t);
// Paleta multiserie estándar del Atlas (12 hues, criterio de la auditoría).
const PR_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const PR_AXIS = '#9C928A';
const PR_DEFAULT_IND = 'origen';
const PR_DEFAULT_SEL = ['ARG', 'BRA', 'CHL', 'MEX', 'PER', 'URY'];
const PR_YEAR_MIN = 1990, PR_YEAR_MAX = 2023;
const PR_YEARS = (() => { const a = []; for (let y = PR_YEAR_MIN; y <= PR_YEAR_MAX; y++) a.push(y); return a; })();

function pr_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function pr_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function pr_measure(text, fs, w) {
  if (!pr_measure._c) { const c = document.createElement('canvas'); pr_measure._c = c.getContext('2d'); }
  pr_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return pr_measure._c.measureText(text).width;
}
function pr_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 190, bottom: 92, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 74, left: 70 };
    default: return null;
  }
}

// color persistente por país (asignado al agregar; estable al sacar otros)
function pr_color(iso) {
  const s = state[7];
  if (!s._colors) s._colors = {};
  if (s._colors[iso] == null) {
    const used = new Set(Object.values(s._colors));
    let idx = 0; while (used.has(idx) && idx < PR_PALETTE.length) idx++;
    s._colors[iso] = idx % PR_PALETTE.length;
  }
  return PR_PALETTE[s._colors[iso]];
}

// valor interpolado de una serie en un año (null si el año cae fuera del rango
// con datos de esa serie). Para el crosshair.
function pr_valueAt(pts, year) {
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

function pr_updateSubtitle() {
  const block = document.querySelector('.chart-block[data-chart="7"]');
  const el = block ? block.querySelector('.chart-subtitle') : null;
  if (!el) return;
  const key = state[7].ind === 'genero' ? 'c7-subtitle-genero' : 'c7-subtitle-origen';
  const txt = (typeof t === 'function') ? t(key) : '';
  if (txt) el.textContent = txt;
}

// países con serie en el indicador actual (para el buscador)
function pr_searchable() {
  const ind = state[7].ind;
  const src = (typeof PRIO_SERIES !== 'undefined') ? (PRIO_SERIES[ind] || {}) : {};
  return Object.keys(src).sort((a, b) => pr_name(a).localeCompare(pr_name(b), 'es'))
    .map(iso => ({ iso, name: pr_name(iso) }));
}

function drawPrioridad() {
  const svg = document.getElementById('chart7');
  if (!svg) return;
  svg.innerHTML = '';
  pr_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || pr_isMobile();
  const mobile = !editorFormat && pr_isMobile();
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const ind = state[7].ind;
  const src = (typeof PRIO_SERIES !== 'undefined') ? (PRIO_SERIES[ind] || {}) : {};
  const period = state[7].period || [PR_YEAR_MIN, PR_YEAR_MAX];
  const [y0, y1] = period;

  // series seleccionadas con dato en este indicador, recortadas al período
  const sel = (state[7].selected || []).filter(iso => src[iso] && src[iso].length >= 1);
  const series = sel.map(iso => ({
    iso, color: pr_color(iso),
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
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = pr_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }

  // margen derecho dinámico por las etiquetas de fin de línea
  let maxLabelW = 0;
  series.forEach(s => { const w = pr_measure(pr_name(s.iso) + (isPngFormat ? '  100%' : ''), SIZES.label, 700); if (w > maxLabelW) maxLabelW = w; });
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
  const gridG = pr_ns('g'); svg.appendChild(gridG);
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile ? 4 : 6)) : [0, 20, 40];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = pr_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = pr_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = Math.round(v) + '%';
    gridG.appendChild(tx);
  });
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, mobile ? 4 : 7).filter(v => v >= y0 && v <= y1) : [];
  xt.forEach(v => {
    const x = xScale(v);
    const tx = pr_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v); gridG.appendChild(tx);
  });
  // eje Y título
  const yTitle = pr_ns('text');
  const ytx = bigFmt ? 20 : 14;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c7-axis-y') : '% de acuerdo';
  svg.appendChild(yTitle);

  // capas
  const halosG = pr_ns('g'); svg.appendChild(halosG);
  const linesG = pr_ns('g'); svg.appendChild(linesG);
  const dotsG = pr_ns('g'); svg.appendChild(dotsG);
  const hitG = pr_ns('g'); svg.appendChild(hitG);

  const endLabels = [];
  series.forEach(s => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    // halo crema
    const halo = pr_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halo.setAttribute('data-pr', s.iso);
    halosG.appendChild(halo);
    // línea
    const path = pr_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('data-pr', s.iso); path.setAttribute('data-base-w', lineW); path.classList.add('pr-colored');
    linesG.appendChild(path);
    // puntos
    s.pts.forEach(p => {
      const c = pr_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3');
      c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); c.setAttribute('data-pr', s.iso); dotsG.appendChild(c);
    });
    // hit-area para el énfasis al hover (no redibuja)
    if (!isPngFormat) {
      const hit = pr_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => pr_emph(s.iso));
      hit.addEventListener('mouseleave', () => pr_emph(null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ iso: s.iso, color: s.color, text: pr_name(s.iso), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
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
  const labG = pr_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const gl = pr_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY);
      gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y);
      gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5);
      gl.setAttribute('data-pr', l.iso); labG.appendChild(gl);
    }
    const tx = pr_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', bigFmt ? 700 : 600); tx.setAttribute('fill', l.color);
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-pr', l.iso);
    tx.textContent = l.text + (isPngFormat && l.valLast != null ? '  ' + Math.round(l.valLast) + '%' : '');
    labG.appendChild(tx);
  });

  // eje 0
  const zero = pr_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', PR_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair + tooltip (no en PNG)
  if (!isPngFormat && series.length) {
    pr_setupHover(svg, { W, H, MARGIN, plotW, plotH, y0, y1, xScale, yScale, series });
  }

  // título insight→neutral: neutral por default (decisión editorial del N°5)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('7', false, { title: 'c7-title', titleNeutral: 'c7-title-neutral' });
  }
}

// Énfasis al hover sobre una línea: atenúa el resto (NO redibuja → no se tilda).
function pr_emph(iso) {
  const svg = document.getElementById('chart7'); if (!svg) return;
  svg.querySelectorAll('[data-pr]').forEach(el => {
    const me = el.getAttribute('data-pr');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('pr-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('pr-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Crosshair vertical + tooltip con valores interpolados al año bajo el cursor.
function pr_setupHover(svg, ctx) {
  const { W, MARGIN, plotH, y0, y1, xScale, yScale, series } = ctx;
  const tooltip = document.getElementById('tooltip7');
  const hoverG = pr_ns('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = pr_ns('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', MARGIN.top); vline.setAttribute('y2', MARGIN.top + plotH);
  hoverG.appendChild(vline);
  const cap = pr_ns('rect'); cap.setAttribute('x', MARGIN.left); cap.setAttribute('y', MARGIN.top);
  cap.setAttribute('width', W - MARGIN.left - MARGIN.right); cap.setAttribute('height', plotH);
  cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xScale(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => {
      const v = pr_valueAt(s.pts, year); if (v == null) return;
      const c = pr_ns('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yScale(v)); c.setAttribute('r', 4);
      c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      rows.push({ label: pr_name(s.iso), color: s.color, v });
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
function pr_toggle(iso) {
  const arr = state[7].selected; const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  renderPrioridadChips(); drawPrioridad();
}
function renderPrioridadChips() {
  const cont = document.getElementById('pr-chips'); if (!cont) return;
  cont.innerHTML = '';
  state[7].selected.slice().sort((a, b) => pr_name(a).localeCompare(pr_name(b), 'es')).forEach(iso => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = pr_color(iso);
    chip.appendChild(dot); chip.appendChild(document.createTextNode(pr_name(iso)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => pr_toggle(iso));
    chip.appendChild(x); cont.appendChild(chip);
  });
}
function setupPrioridadSearch() {
  const input = document.getElementById('pr-search'); const results = document.getElementById('pr-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) { if (!q) return []; const qn = norm(q); return pr_searchable().filter(c => norm(c.name).includes(qn)).slice(0, 8); }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${state[7].selected.includes(c.iso) ? ' m-already' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (e) => { e.preventDefault(); pr_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); }));
  }
  input.addEventListener('input', (e) => { matches = getM(e.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pr_toggle(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}
function setupPrioridadInd() {
  document.querySelectorAll('#pr-ind button').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.dataset.ind;
    if ((v !== 'origen' && v !== 'genero') || state[7].ind === v) return;
    if (typeof PRIO_SERIES === 'undefined' || !PRIO_SERIES[v]) return;
    state[7].ind = v;
    document.querySelectorAll('#pr-ind button').forEach(b => b.classList.toggle('active', b.dataset.ind === v));
    drawPrioridad();
  }));
}
function setupPrioridadSlider() {
  if (typeof setupWcRangeSlider !== 'function') return;
  setupWcRangeSlider({
    fromId: 'pr-slider-from', toId: 'pr-slider-to', dispId: 'pr-range-display', trackId: 'pr-range-track-active',
    years: PR_YEARS,
    get: () => state[7].period, set: (p) => { state[7].period = p; },
    onChange: () => drawPrioridad()
  });
}
function setupPrioridadCSV() {
  document.querySelectorAll('button.download[data-chart="7-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — prioridad en el empleo cuando escasea el trabajo (IVS, EVS+WVS, 1990-2023)\n';
      csv += '# indicador origen = C002 (prioridad a nativos sobre inmigrantes); genero = C001 (prioridad a varones sobre mujeres)\n';
      csv += '# pct = % de acuerdo sobre {de acuerdo, ni/ni, en desacuerdo}, ponderado S017, celdas n>=200. Ano = ano real de la encuesta.\n';
      csv += 'iso3,pais,indicador,var_ivs,anio,pct,n\n';
      const inds = (typeof PRIO_META !== 'undefined' && PRIO_META.inds) ? PRIO_META.inds : Object.keys(PRIO_SERIES);
      const vars = (typeof PRIO_META !== 'undefined' && PRIO_META.vars) ? PRIO_META.vars : {};
      inds.forEach(ind => {
        const src = PRIO_SERIES[ind] || {};
        Object.keys(src).forEach(iso => {
          const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
          src[iso].forEach(([yr, pct, n]) => { csv += `${iso},${nm},${ind},${vars[ind] || ''},${yr},${pct},${n}\n`; });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-jobs-priority.csv' : 'el-atlas-05-prioridad-empleo.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

// Primer año con datos dado el estado (indicador + selección). Para que el
// default arranque donde realmente empiezan las series y no deje un tramo vacío;
// el slider igual permite abrir hasta PR_YEAR_MIN.
function pr_firstDataYear(ind, selected) {
  const src = (typeof PRIO_SERIES !== 'undefined') ? (PRIO_SERIES[ind] || {}) : {};
  let min = PR_YEAR_MAX;
  (selected || []).forEach(iso => { const s = src[iso]; if (s && s.length) min = Math.min(min, s[0][0]); });
  return Math.max(PR_YEAR_MIN, Math.min(min, PR_YEAR_MAX));
}

function initPrioridad() {
  if (!state[7]) state[7] = { ind: PR_DEFAULT_IND, selected: [...PR_DEFAULT_SEL] };
  if (!state[7].period) state[7].period = [pr_firstDataYear(state[7].ind, state[7].selected), PR_YEAR_MAX];
  document.querySelectorAll('#pr-ind button').forEach(b => b.classList.toggle('active', b.dataset.ind === state[7].ind));
  setupPrioridadInd(); setupPrioridadSearch(); setupPrioridadSlider(); setupPrioridadCSV();
  renderPrioridadChips(); drawPrioridad();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawPrioridad;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initPrioridad._wired) { initPrioridad._wired = true; window.addEventListener('atlas-editor-change', () => drawPrioridad()); }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '7') return null;
    return (typeof t === 'function') ? t('c7-sources') : null;
  };
}
