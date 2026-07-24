// =============================================================
//  El Atlas N°5 — Chart 11: sentirse parte de un grupo discriminado
// =============================================================
// Serie temporal del Latinobarómetro: % que se describe como parte de un grupo
// discriminado en su país. Clon del motor de "la película" (pelicula.js):
// chips=selección (WYSIWYG), slider de período, hover por opacidad (sin redibujar
// → no se tilda), crosshair con interpolación, etiquetas al FINAL de cada línea.
//
// Toggle de universo: "por país" (18 países) / "por grupo étnico autopercibido"
// (5 grupos, agregado regional). Misma forma de datos [[año,pct,n]] en ambos, así
// que es el mismo renderer sin tocar. Referencia opcional: promedio regional simple
// del panel balanceado de 18 países (solo en modo país).
//
// Datos: DISC_SERIES[universo][clave] = [[año,pct,n],...] (data-discriminado.js),
//        DISC_META (años, keys, defaults, labels de etnia, regionAvg).

const DC_SVG_NS = 'http://www.w3.org/2000/svg';
const dc_ns = (t) => document.createElementNS(DC_SVG_NS, t);
// Paleta multiserie estándar del Atlas (12 hues, criterio de la auditoría).
const DC_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const DC_AXIS = '#9C928A';
const DC_REF_COLOR = '#6E6B66';                 // gris del promedio regional (referencia)
const DC_REF_KEY = '__avg';
const DC_DEFAULT_UNIV = 'pais';
const DC_YEARS = (typeof DISC_META !== 'undefined' && DISC_META.years) ? DISC_META.years.slice() : [2009, 2010, 2011, 2015, 2020];
const DC_YEAR_MIN = DC_YEARS[0], DC_YEAR_MAX = DC_YEARS[DC_YEARS.length - 1];

function dc_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function dc_defaultSel(univ) {
  const m = (typeof DISC_META !== 'undefined' && DISC_META[univ]) ? DISC_META[univ] : null;
  return (m && m.default) ? m.default.slice() : [];
}
// nombre de una clave según el universo (país → COUNTRY_NAMES; etnia → labels; ref → promedio)
function dc_name(univ, key) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (key === DC_REF_KEY) return (typeof t === 'function') ? t('c11-avg-label') : 'Promedio regional';
  if (univ === 'etnia') {
    const labs = (typeof DISC_META !== 'undefined' && DISC_META.etnia && DISC_META.etnia.labels && DISC_META.etnia.labels[lang]) || {};
    return labs[key] || key;
  }
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key]) return COUNTRY_NAMES[key][lang] || COUNTRY_NAMES[key].en || key;
  return key;
}
function dc_measure(text, fs, w) {
  if (!dc_measure._c) { const c = document.createElement('canvas'); dc_measure._c = c.getContext('2d'); }
  dc_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return dc_measure._c.measureText(text).width;
}
function dc_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 190, bottom: 92, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 74, left: 70 };
    default: return null;
  }
}

// color persistente por clave, por universo (estable al sacar otros; gris fijo para la referencia)
function dc_color(univ, key) {
  if (key === DC_REF_KEY) return DC_REF_COLOR;
  const s = state[11];
  if (!s._colors) s._colors = {};
  if (!s._colors[univ]) s._colors[univ] = {};
  const m = s._colors[univ];
  if (m[key] == null) {
    const used = new Set(Object.values(m));
    let idx = 0; while (used.has(idx) && idx < DC_PALETTE.length) idx++;
    m[key] = idx % DC_PALETTE.length;
  }
  return DC_PALETTE[m[key]];
}

// valor interpolado de una serie en un año (null si el año cae fuera del rango
// con datos de esa serie). Para el crosshair.
function dc_valueAt(pts, year) {
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

function dc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle');
  if (!el) return;
  // respetar subtítulo custom del editor (?nl)
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const custom = (ae && ae.texts && ae.texts[lang] && (ae.texts[lang].subtitle || '').trim());
  if (custom) return;
  const key = 'c11-subtitle-' + (state[11].univ || DC_DEFAULT_UNIV);
  const txt = (typeof t === 'function') ? t(key) : '';
  if (txt) el.textContent = txt;
}

// claves con serie en el universo actual (para el buscador)
function dc_searchable() {
  const univ = state[11].univ;
  const src = (typeof DISC_SERIES !== 'undefined') ? (DISC_SERIES[univ] || {}) : {};
  return Object.keys(src).sort((a, b) => dc_name(univ, a).localeCompare(dc_name(univ, b), 'es'))
    .map(key => ({ key, name: dc_name(univ, key) }));
}

function drawDiscriminado() {
  const svg = document.getElementById('chart11');
  if (!svg) return;
  svg.innerHTML = '';
  dc_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || dc_isMobile();
  const mobile = !editorFormat && dc_isMobile();
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const univ = state[11].univ;
  const src = (typeof DISC_SERIES !== 'undefined') ? (DISC_SERIES[univ] || {}) : {};
  const period = state[11].period || [DC_YEAR_MIN, DC_YEAR_MAX];
  const [y0, y1] = period;

  // series seleccionadas con dato en este universo, recortadas al período
  const selArr = (state[11].sel[univ] || []).filter(key => src[key] && src[key].length >= 1);
  const series = selArr.map(key => ({
    key, color: dc_color(univ, key),
    pts: src[key].filter(p => p[0] >= y0 && p[0] <= y1)
  })).filter(s => s.pts.length >= 1);

  // referencia: promedio regional simple (solo modo país). Va PRIMERO (debajo de
  // las líneas de país). No participa del énfasis por hover (queda fija).
  if (univ === 'pais' && state[11].showAvg && typeof DISC_META !== 'undefined' && Array.isArray(DISC_META.regionAvg)) {
    const rp = DISC_META.regionAvg.filter(p => p[0] >= y0 && p[0] <= y1);
    if (rp.length) series.unshift({ key: DC_REF_KEY, color: DC_REF_COLOR, isRef: true, pts: rp });
  }

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, label: 24 }
    : mobile
    ? { tick: 20, axisTitle: 22, label: 22 }
    : { tick: 11, axisTitle: 11.5, label: 12.5 };
  const lineW = bigFmt ? 3.4 : 2.2, haloW = lineW + (bigFmt ? 5 : 3), dotR = bigFmt ? 4 : 2.6;
  const labelHalo = bigFmt ? 5 : 3;

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = dc_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }

  // margen derecho dinámico por las etiquetas de fin de línea
  let maxLabelW = 0;
  series.forEach(s => { const w = dc_measure(dc_name(univ, s.key) + (isPngFormat ? '  100%' : ''), SIZES.label, 700); if (w > maxLabelW) maxLabelW = w; });
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
  const gridG = dc_ns('g'); svg.appendChild(gridG);
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile ? 4 : 6)) : [0, 20, 40];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = dc_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1); gridG.appendChild(l);
    const tx = dc_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = Math.round(v) + '%';
    gridG.appendChild(tx);
  });
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, mobile ? 4 : 7).filter(v => v >= y0 && v <= y1) : [];
  xt.forEach(v => {
    const x = xScale(v);
    const tx = dc_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v); gridG.appendChild(tx);
  });
  // eje Y título
  const yTitle = dc_ns('text');
  const ytx = bigFmt ? 20 : 14;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c11-axis-y') : '% que se siente parte de un grupo discriminado';
  svg.appendChild(yTitle);

  // capas
  const halosG = dc_ns('g'); svg.appendChild(halosG);
  const linesG = dc_ns('g'); svg.appendChild(linesG);
  const dotsG = dc_ns('g'); svg.appendChild(dotsG);
  const hitG = dc_ns('g'); svg.appendChild(hitG);

  const endLabels = [];
  series.forEach(s => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    // halo crema
    const halo = dc_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
    if (!s.isRef) halo.setAttribute('data-dc', s.key);
    halosG.appendChild(halo);
    // línea
    const path = dc_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', s.isRef ? Math.max(1.6, lineW - 0.8) : lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (s.isRef) path.setAttribute('stroke-dasharray', bigFmt ? '9 7' : '6 5');
    if (!s.isRef) { path.setAttribute('data-dc', s.key); path.setAttribute('data-base-w', lineW); path.classList.add('dc-colored'); }
    linesG.appendChild(path);
    // puntos
    s.pts.forEach(p => {
      const c = dc_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3');
      c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); if (!s.isRef) c.setAttribute('data-dc', s.key); dotsG.appendChild(c);
    });
    // hit-area para el énfasis al hover (no redibuja). La referencia no tiene hit.
    if (!isPngFormat && !s.isRef) {
      const hit = dc_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => dc_emph(s.key));
      hit.addEventListener('mouseleave', () => dc_emph(null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ key: s.key, color: s.color, isRef: !!s.isRef, text: dc_name(univ, s.key), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
  });

  // etiquetas al final de cada línea, con anti-colisión vertical entre las que
  // terminan cerca en X (línea guía si se corren). Estilo OWID.
  const GAP = SIZES.label + (bigFmt ? 5 : 3);
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
  const labG = dc_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const gl = dc_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY);
      gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y);
      gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5);
      if (!l.isRef) gl.setAttribute('data-dc', l.key); labG.appendChild(gl);
    }
    const tx = dc_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', l.isRef ? (bigFmt ? 600 : 500) : (bigFmt ? 700 : 600)); tx.setAttribute('fill', l.color);
    if (l.isRef) tx.setAttribute('font-style', 'italic');
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round');
    if (!l.isRef) tx.setAttribute('data-dc', l.key);
    tx.textContent = l.text + (isPngFormat && l.valLast != null ? '  ' + Math.round(l.valLast) + '%' : '');
    labG.appendChild(tx);
  });

  // eje 0
  const zero = dc_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', DC_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair + tooltip (no en PNG)
  if (!isPngFormat && series.length) {
    dc_setupHover(svg, { W, H, MARGIN, plotW, plotH, y0, y1, xScale, yScale, series, univ });
  }

  // título insight→neutral (default siempre neutral, como el resto del N°5)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('11', false, { title: 'c11-title', titleNeutral: 'c11-title-neutral' });
  }
}

// Énfasis al hover sobre una línea: atenúa el resto (NO redibuja → no se tilda).
// La referencia (sin data-dc) queda fija.
function dc_emph(key) {
  const svg = document.getElementById('chart11'); if (!svg) return;
  svg.querySelectorAll('[data-dc]').forEach(el => {
    const me = el.getAttribute('data-dc');
    if (key == null) { el.style.opacity = ''; if (el.classList.contains('dc-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === key) { el.style.opacity = '1'; if (el.classList.contains('dc-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Crosshair vertical + tooltip con valores interpolados al año bajo el cursor.
function dc_setupHover(svg, ctx) {
  const { W, MARGIN, plotH, y0, y1, xScale, yScale, series, univ } = ctx;
  const tooltip = document.getElementById('tooltip11');
  const hoverG = dc_ns('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = dc_ns('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', MARGIN.top); vline.setAttribute('y2', MARGIN.top + plotH);
  hoverG.appendChild(vline);
  const cap = dc_ns('rect'); cap.setAttribute('x', MARGIN.left); cap.setAttribute('y', MARGIN.top);
  cap.setAttribute('width', W - MARGIN.left - MARGIN.right); cap.setAttribute('height', plotH);
  cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xScale(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => {
      const v = dc_valueAt(s.pts, year); if (v == null) return;
      const c = dc_ns('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yScale(v)); c.setAttribute('r', 4);
      c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      rows.push({ label: dc_name(univ, s.key), color: s.color, v, isRef: !!s.isRef });
    });
    if (tooltip && rows.length) {
      rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;${r.isRef ? 'font-style:italic;' : ''}">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${(typeof fmt === 'function') ? fmt(r.v, 1) : r.v.toFixed(1)}%</strong></div>`; });
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
function dc_toggle(key) {
  const arr = state[11].sel[state[11].univ]; const i = arr.indexOf(key);
  if (i >= 0) arr.splice(i, 1); else arr.push(key);
  renderDiscriminadoChips(); drawDiscriminado();
}
function renderDiscriminadoChips() {
  const cont = document.getElementById('dc-chips'); if (!cont) return;
  const univ = state[11].univ;
  cont.innerHTML = '';
  (state[11].sel[univ] || []).slice().sort((a, b) => dc_name(univ, a).localeCompare(dc_name(univ, b), 'es')).forEach(key => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = dc_color(univ, key);
    chip.appendChild(dot); chip.appendChild(document.createTextNode(dc_name(univ, key)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => dc_toggle(key));
    chip.appendChild(x); cont.appendChild(chip);
  });
}
function setupDiscriminadoSearch() {
  const input = document.getElementById('dc-search'); const results = document.getElementById('dc-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) { if (!q) return []; const qn = norm(q); return dc_searchable().filter(c => norm(c.name).includes(qn)).slice(0, 8); }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    const univ = state[11].univ;
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${(state[11].sel[univ] || []).includes(c.key) ? ' m-already' : ''}" data-key="${c.key}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-key]').forEach(el => el.addEventListener('mousedown', (e) => { e.preventDefault(); dc_toggle(el.dataset.key); input.value = ''; results.classList.remove('open'); }));
  }
  input.addEventListener('input', (e) => { matches = getM(e.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); dc_toggle(matches[active].key); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}
function dc_syncAvgVisibility() {
  const grp = document.getElementById('dc-avg-group');
  if (grp) grp.style.display = (state[11].univ === 'pais') ? '' : 'none';
}
function setupDiscriminadoUniv() {
  const sel = document.getElementById('dc-univ-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof DISC_SERIES === 'undefined' || !DISC_SERIES[sel.value]) return;
    state[11].univ = sel.value;
    dc_syncAvgVisibility();
    renderDiscriminadoChips();
    drawDiscriminado();
  });
}
function setupDiscriminadoAvg() {
  const chk = document.getElementById('dc-avg-toggle'); if (!chk) return;
  chk.checked = !!state[11].showAvg;
  chk.addEventListener('change', () => { state[11].showAvg = chk.checked; drawDiscriminado(); });
}
function setupDiscriminadoSlider() {
  if (typeof setupWcRangeSlider !== 'function') return;
  setupWcRangeSlider({
    fromId: 'dc-slider-from', toId: 'dc-slider-to', dispId: 'dc-range-display', trackId: 'dc-range-track-active',
    years: DC_YEARS,
    get: () => state[11].period, set: (p) => { state[11].period = p; },
    onChange: () => drawDiscriminado()
  });
}
function setupDiscriminadoCSV() {
  document.querySelectorAll('button.download[data-chart="11-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — % que se describe como parte de un grupo discriminado (Latinobarometro 2009-2020)\n';
      csv += '# Pregunta A_011_001: "Se describiria como parte de un grupo que es discriminado en (pais)?" (Si/No). % de Si, ponderado por wt.\n';
      csv += '# universo=pais: 18 paises. universo=etnia: grupo etnico autopercibido, agregado regional (pooled).\n';
      csv += '# regionAvg = promedio simple del panel balanceado de 18 paises.\n';
      csv += 'universo,clave,nombre,anio,pct,n\n';
      ['pais', 'etnia'].forEach(univ => {
        const s = (typeof DISC_SERIES !== 'undefined') ? (DISC_SERIES[univ] || {}) : {};
        Object.keys(s).forEach(key => {
          const nm = (univ === 'pais')
            ? ((typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key]) ? COUNTRY_NAMES[key].en : key)
            : ((DISC_META.etnia && DISC_META.etnia.labels && DISC_META.etnia.labels.en && DISC_META.etnia.labels.en[key]) || key);
          s[key].forEach(row => { csv += `${univ},${key},${nm},${row[0]},${row[1]},${row[2] != null ? row[2] : ''}\n`; });
        });
      });
      if (typeof DISC_META !== 'undefined' && Array.isArray(DISC_META.regionAvg)) {
        DISC_META.regionAvg.forEach(([yr, pct]) => { csv += `regionAvg,__avg,Regional average,${yr},${pct},\n`; });
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-discriminated-group.csv' : 'el-atlas-05-grupo-discriminado.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

// Primer año con datos dado el estado (universo + selección). Para que el default
// arranque donde realmente empiezan las series.
function dc_firstDataYear(univ, selected) {
  const src = (typeof DISC_SERIES !== 'undefined') ? (DISC_SERIES[univ] || {}) : {};
  let min = DC_YEAR_MAX;
  (selected || []).forEach(key => { const s = src[key]; if (s && s.length) min = Math.min(min, s[0][0]); });
  return Math.max(DC_YEAR_MIN, Math.min(min, DC_YEAR_MAX));
}

function initDiscriminado() {
  if (!state[11]) state[11] = {
    univ: DC_DEFAULT_UNIV,
    sel: { pais: dc_defaultSel('pais'), etnia: dc_defaultSel('etnia') },
    showAvg: true
  };
  if (!state[11].period) state[11].period = [dc_firstDataYear(state[11].univ, state[11].sel[state[11].univ]), DC_YEAR_MAX];
  const sel = document.getElementById('dc-univ-select'); if (sel) sel.value = state[11].univ;
  dc_syncAvgVisibility();
  setupDiscriminadoUniv(); setupDiscriminadoAvg(); setupDiscriminadoSearch(); setupDiscriminadoSlider(); setupDiscriminadoCSV();
  renderDiscriminadoChips(); drawDiscriminado();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDiscriminado;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initDiscriminado._wired) { initDiscriminado._wired = true; window.addEventListener('atlas-editor-change', () => drawDiscriminado()); }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '11') return null;
    return (typeof t === 'function') ? t('c11-sources') : null;
  };
}
