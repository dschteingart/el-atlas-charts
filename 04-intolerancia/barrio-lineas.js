// =============================================================
//  El Atlas N°4 — Chart 17: el barrio en el tiempo (olas 6 → 7)
// =============================================================
// Tercera vista del graficador del barrio (chart-barrio.html). El dataset tiene
// DOS olas del WVS (6: 2010-2016, 7: 2017-2023) y la vista de Comparación ya
// trae slider de ola, así que la vista temporal corresponde por criterio del
// número: mismo tipo de dato ⇒ mismas features.
//
// Con dos momentos el gráfico es de PENDIENTE (slope): una línea por país entre
// su medición de la ola 6 y la de la ola 7. Muestra quién subió y quién bajó,
// que es justo lo que la foto no deja ver.
//
// CLON del motor de líneas de discriminado.js (regla de oro: clonar el motor,
// no reimplementar). De ahí vienen: chips = selección (WYSIWYG), hover por
// opacidad sin redibujar (no se tilda), crosshair que NO interpola (helpers
// atlasSnapYears/atlasLineHoverRows de lib/utils.js) y etiquetas al final de
// cada línea con anti-colisión estilo OWID. Sin slider de período: son dos
// puntos, el eje x va fijo sobre todos los años del dataset para que las
// pendientes sean comparables entre países.
//
// Datos: se construyen EN RUNTIME desde BA_FOTO (data-barrio.js), sin regenerar
// nada. BA_FOTO[item][ola] = [[iso3, pct, year, rank, n], ...] con el AÑO REAL
// de campo de cada país en esa ola (Argentina 2013 y 2017; Brasil 2014 y 2018),
// así que la inclinación de cada pendiente es la real, no la del punto medio
// del período de la ola.
//
// State: state[17] = { cat, selected[] }. Las claves .cat y .selected son las
// que migra lib/grapher.js entre vistas (mismas que usa barrio-comp.js).

const BL_SVG_NS = 'http://www.w3.org/2000/svg';
const bl_ns = (tag) => document.createElementNS(BL_SVG_NS, tag);

// Paleta multiserie estándar del Atlas (12 hues, norma del número).
const BL_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const BL_AXIS = '#9C928A';
const BL_DEFAULT_CAT = 'racismo';
// Fallback de selección: el shell (initGrapher.defaultSelection) la pisa apenas
// activa la vista; esto sólo cubre el primer dibujo del init.
const BL_DEFAULT_SELECTED = ['ARG', 'BRA', 'CHL', 'MEX', 'PER', 'URY'];
const BL_WAVES = (typeof BA_META !== 'undefined' && BA_META.waves) ? BA_META.waves : [];

function bl_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}

function bl_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function bl_measure(text, fs, w) {
  if (!bl_measure._c) { const c = document.createElement('canvas'); bl_measure._c = c.getContext('2d'); }
  bl_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return bl_measure._c.measureText(text).width;
}

function bl_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 190, bottom: 92, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 74, left: 70 };
    default: return null;
  }
}

// ---------------------------------------------------------------
//  Series en runtime desde BA_FOTO
// ---------------------------------------------------------------
// bl_series(item, iso) → [[year, pct, n, ola], ...] ordenado por año.
// El año sale de la fila del país en cada ola (r[2]): es el año REAL de campo,
// nunca el punto medio del período de la ola.
function bl_series(item, iso) {
  const byWave = (typeof BA_FOTO !== 'undefined' && BA_FOTO[item]) ? BA_FOTO[item] : {};
  const pts = [];
  BL_WAVES.forEach(m => {
    const rows = byWave[String(m.w)] || byWave[m.w] || [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === iso) { pts.push([rows[i][2], rows[i][1], rows[i][4], m.w]); break; }
    }
  });
  pts.sort((a, b) => a[0] - b[0]);
  return pts;
}

// Rango de años de TODO el dataset (2010-2023). Eje x fijo: con dos puntos por
// país, un dominio que se moviera con la selección haría que la misma variación
// se viera con pendientes distintas según qué países estén elegidos.
function bl_yearBounds() {
  if (bl_yearBounds._c) return bl_yearBounds._c;
  let mn = Infinity, mx = -Infinity;
  if (typeof BA_FOTO !== 'undefined') {
    Object.keys(BA_FOTO).forEach(item => {
      const byWave = BA_FOTO[item];
      Object.keys(byWave).forEach(w => {
        byWave[w].forEach(r => { if (r[2] < mn) mn = r[2]; if (r[2] > mx) mx = r[2]; });
      });
    });
  }
  if (!isFinite(mn) || !isFinite(mx) || mx <= mn) { mn = 2010; mx = 2023; }
  bl_yearBounds._c = [mn, mx];
  return bl_yearBounds._c;
}

// Países con al menos una observación en el ítem activo (para el buscador).
function bl_searchable() {
  const item = state[17].cat;
  const byWave = (typeof BA_FOTO !== 'undefined' && BA_FOTO[item]) ? BA_FOTO[item] : {};
  const isos = {};
  Object.keys(byWave).forEach(w => byWave[w].forEach(r => { isos[r[0]] = true; }));
  return Object.keys(isos)
    .sort((a, b) => bl_name(a).localeCompare(bl_name(b), 'es'))
    .map(iso => ({ iso, name: bl_name(iso) }));
}

// Color persistente por país (estable al sacar otros de la selección).
function bl_color(iso) {
  const s = state[17];
  if (!s._colors) s._colors = {};
  const m = s._colors;
  if (m[iso] == null) {
    const used = new Set(Object.values(m));
    let idx = 0; while (used.has(idx) && idx < BL_PALETTE.length) idx++;
    m[iso] = idx % BL_PALETTE.length;
  }
  return BL_PALETTE[m[iso]];
}

function bl_itemLabel() {
  // El nombre del ítem sale de las claves del perfil (c8-item-*), una sola verdad.
  return (typeof t === 'function') ? t('c8-item-' + state[17].cat) : state[17].cat;
}

function bl_updateSubtitle() {
  // Selector SCOPEADO al bloque del chart 17: en esta página conviven tres
  // .chart-subtitle (charts 13, 17 y 8) y un querySelector global pisaría el
  // que no es (el bug que documenta chart-discriminado.html).
  const el = document.querySelector('.chart-block[data-chart="17"] .chart-subtitle');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const custom = (ae && ae.texts && ae.texts[lang] && (ae.texts[lang].subtitle || '').trim());
  if (custom) return;   // respetar subtítulo custom del editor (?nl)
  const tpl = (typeof t === 'function') ? t('c17-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{ITEM}', bl_itemLabel());
}

//==================================================================
//  Render
//==================================================================
function drawBarrioLineas() {
  const svg = document.getElementById('chart17');
  if (!svg) return;
  svg.innerHTML = '';
  bl_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || bl_isMobile();
  const mobile = !editorFormat && bl_isMobile();
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const item = state[17].cat;
  const bounds = bl_yearBounds();
  const y0 = bounds[0], y1 = bounds[1];

  // Series de la selección con al menos una observación en el ítem activo.
  const series = (state[17].selected || [])
    .map(iso => ({ iso: iso, key: iso, color: bl_color(iso), pts: bl_series(item, iso) }))
    .filter(s => s.pts.length >= 1);

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, label: 24 }
    : mobile
    ? { tick: 20, axisTitle: 22, label: 22 }
    : { tick: 11, axisTitle: 11.5, label: 12.5 };
  const lineW = bigFmt ? 3.4 : 2.2, haloW = lineW + (bigFmt ? 5 : 3), dotR = bigFmt ? 5 : 3.4;
  const labelHalo = bigFmt ? 5 : 3;

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = bl_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }

  // margen derecho dinámico por las etiquetas de fin de línea
  let maxLabelW = 0;
  series.forEach(s => {
    const w = bl_measure(bl_name(s.iso) + (isPngFormat ? '  100%' : ''), SIZES.label, 700);
    if (w > maxLabelW) maxLabelW = w;
  });
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
  const gridG = bl_ns('g'); svg.appendChild(gridG);
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, (mobile ? 4 : 6)) : [0, 20, 40];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = bl_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1);
    gridG.appendChild(l);
    const tx = bl_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v) + '%';
    gridG.appendChild(tx);
  });
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, mobile ? 4 : 7).filter(v => v >= y0 && v <= y1) : [];
  xt.forEach(v => {
    const x = xScale(v);
    const tx = bl_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v); gridG.appendChild(tx);
  });
  // eje Y título
  const yTitle = bl_ns('text');
  const ytx = bigFmt ? 20 : 14;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c17-axis-y') : '% que lo ve seguido en su barrio';
  svg.appendChild(yTitle);

  // capas
  const halosG = bl_ns('g'); svg.appendChild(halosG);
  const linesG = bl_ns('g'); svg.appendChild(linesG);
  const dotsG = bl_ns('g'); svg.appendChild(dotsG);
  const hitG = bl_ns('g'); svg.appendChild(hitG);

  const endLabels = [];
  series.forEach(s => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    if (s.pts.length > 1) {
      // halo crema
      const halo = bl_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
      halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
      halo.setAttribute('data-bl', s.iso);
      halosG.appendChild(halo);
      // línea (pendiente entre las dos olas)
      const path = bl_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW);
      path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('data-bl', s.iso); path.setAttribute('data-base-w', lineW); path.classList.add('bl-colored');
      linesG.appendChild(path);
    }
    // marcadores: se ve DÓNDE hay medición (norma del número). Con un solo punto
    // (país que no está en las dos olas) el marcador es todo lo que hay.
    s.pts.forEach(p => {
      const c = bl_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3');
      c.setAttribute('stroke-width', bigFmt ? 2 : 1.4); c.setAttribute('data-bl', s.iso); dotsG.appendChild(c);
    });
    // hit-area para el énfasis al hover (no redibuja)
    if (!isPngFormat && s.pts.length > 1) {
      const hit = bl_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => bl_emph(s.iso));
      hit.addEventListener('mouseleave', () => bl_emph(null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ key: s.iso, color: s.color, text: bl_name(s.iso), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
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
  const labG = bl_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const gl = bl_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY);
      gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y);
      gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5);
      gl.setAttribute('data-bl', l.key); labG.appendChild(gl);
    }
    const tx = bl_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', bigFmt ? 700 : 600); tx.setAttribute('fill', l.color);
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-bl', l.key);
    tx.textContent = l.text + (isPngFormat && l.valLast != null ? '  ' + Math.round(l.valLast) + '%' : '');
    labG.appendChild(tx);
  });

  // eje 0
  const zero = bl_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', BL_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair + tooltip (no en PNG)
  if (!isPngFormat && series.length) {
    bl_setupHover(svg, { W, H, MARGIN, plotW, plotH, y0, y1, xScale, yScale, series });
  }

  // título insight→neutral (default siempre neutral, como el resto del N°4)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('17', false, { title: 'c17-title', titleNeutral: 'c17-title-neutral' });
  }
}

// Énfasis al hover sobre una línea: atenúa el resto (NO redibuja → no se tilda).
function bl_emph(key) {
  const svg = document.getElementById('chart17'); if (!svg) return;
  svg.querySelectorAll('[data-bl]').forEach(el => {
    const me = el.getAttribute('data-bl');
    if (key == null) { el.style.opacity = ''; if (el.classList.contains('bl-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === key) { el.style.opacity = '1'; if (el.classList.contains('bl-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Crosshair vertical + tooltip. NO interpola: el crosshair snapea al año de ola
// más cercano y cada serie aporta su valor MEDIDO (con su año real al lado si no
// es el del encabezado). Ver atlasLineHoverRows en lib/utils.js.
function bl_setupHover(svg, ctx) {
  const { W, MARGIN, plotH, y0, y1, xScale, yScale, series } = ctx;
  const tooltip = document.getElementById('tooltip17');
  // años con encuesta de las series VISIBLES (se recalcula en cada redibujo)
  const snapYears = atlasSnapYears(series);
  const hoverG = bl_ns('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = bl_ns('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', MARGIN.top); vline.setAttribute('y2', MARGIN.top + plotH);
  hoverG.appendChild(vline);
  const cap = bl_ns('rect'); cap.setAttribute('x', MARGIN.left); cap.setAttribute('y', MARGIN.top);
  cap.setAttribute('width', W - MARGIN.left - MARGIN.right); cap.setAttribute('height', plotH);
  cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  // el crosshair salta de ola en ola: si el año snapeado no cambió no hay nada
  // que redibujar (menos escrituras al DOM por mousemove)
  let lastYear = null;
  const hide = () => { lastYear = null; hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } };
  function update(rawYear) {
    if (rawYear == null) { hide(); return; }
    const hit = atlasLineHoverRows(series, rawYear, { snapYears: snapYears });
    if (hit.year == null || !hit.rows.length) { hide(); return; }
    const year = hit.year;
    // (el tap-away genérico de utils.js puede ocultar el tooltip sin que cambie
    //  el año, así que además exigimos que siga visible)
    if (year === lastYear && hoverG.getAttribute('display') !== 'none' && (!tooltip || tooltip.style.display === 'block')) return;
    lastYear = year;
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    vline.setAttribute('x1', xScale(year)); vline.setAttribute('x2', xScale(year));
    const rows = hit.rows.slice().sort((a, b) => b.value - a.value);
    rows.forEach(r => {
      // el círculo va en la x del AÑO REAL del dato, no sobre la vertical
      const c = bl_ns('circle'); c.setAttribute('cx', xScale(r.year)); c.setAttribute('cy', yScale(r.value)); c.setAttribute('r', 4.5);
      c.setAttribute('fill', r.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5);
      if (!r.exact) c.setAttribute('opacity', 0.85);
      hoverG.appendChild(c);
      r.label = bl_name(r.key);
    });
    if (tooltip) {
      tooltip.innerHTML = atlasLineTooltipHTML(year, rows, { dec: 1 });
      tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  const moveH = (ev) => {
    const rc = svg.getBoundingClientRect(); const sc = rc.width / W; const lx = ((typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left) / sc;
    if (lx < MARGIN.left || lx > W - MARGIN.right) { update(null); return; }
    const raw = y0 + (lx - MARGIN.left) / (W - MARGIN.left - MARGIN.right) * (y1 - y0);
    update(Math.max(y0, Math.min(y1, raw)));
    if (tooltip) { const _x = (typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left, _w = tooltip.offsetWidth || 170;
      tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
      tooltip.style.top = ((typeof evClientY === 'function' ? evClientY(ev) : ev.clientY) - rc.top + 14) + 'px'; }
  };
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', () => update(null));
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, moveH);
}

//==================================================================
//  Chips + buscador (WYSIWYG: los chips SON las etiquetas)
//==================================================================
function bl_toggleSelect(iso) {
  const arr = state[17].selected; const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  renderBarrioLineasChips(); drawBarrioLineas();
}

function renderBarrioLineasChips() {
  const cont = document.getElementById('bl-selected-chips'); if (!cont) return;
  cont.innerHTML = '';
  (state[17].selected || []).slice().sort((a, b) => bl_name(a).localeCompare(bl_name(b), 'es')).forEach(iso => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = bl_color(iso);
    chip.appendChild(dot); chip.appendChild(document.createTextNode(bl_name(iso)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => bl_toggleSelect(iso));
    chip.appendChild(x); cont.appendChild(chip);
  });
}

function setupBarrioLineasSearch() {
  const input = document.getElementById('bl-search'); const results = document.getElementById('bl-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) { if (!q) return []; const qn = norm(q); return bl_searchable().filter(c => norm(c.name).includes(qn)).slice(0, 8); }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    const sel = state[17].selected || [];
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${sel.includes(c.iso) ? ' m-already' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (e) => {
      e.preventDefault(); bl_toggleSelect(el.dataset.iso); input.value = ''; results.classList.remove('open');
    }));
  }
  input.addEventListener('input', (e) => { matches = getM(e.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); bl_toggleSelect(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}

//==================================================================
//  Controles
//==================================================================
function setupBarrioLineasCat() {
  const sel = document.getElementById('bl-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof BA_FOTO === 'undefined' || !BA_FOTO[sel.value]) return;
    state[17].cat = sel.value;
    drawBarrioLineas();
  });
}

// Sincroniza el select con el estado (el shell migra .cat entre vistas).
function bl_syncControls() {
  const sel = document.getElementById('bl-cat-select');
  if (sel && state[17] && state[17].cat) sel.value = state[17].cat;
}

//==================================================================
//  Download CSV — las dos olas de los cinco ítems, con el año real
//==================================================================
function setupBarrioLineasCSV() {
  document.querySelectorAll('button.download[data-chart="17-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += '# El Atlas N4 — que pasa seguido en el barrio, olas 6 y 7 (WVS, bateria H002)\n';
      csv += '# pct = % "muy/bastante seguido" {1,2} sobre {1,2,3,4}, ponderado S017.\n';
      csv += '# anio = ano REAL de campo del pais en esa ola (es el que se usa en el eje x).\n';
      csv += 'iso3,pais,item,ola,anio,pct,n\n';
      const items = (typeof BA_ITEMS !== 'undefined') ? BA_ITEMS : [];
      items.forEach(item => {
        const isos = {};
        BL_WAVES.forEach(m => {
          const byWave = (typeof BA_FOTO !== 'undefined' && BA_FOTO[item]) ? BA_FOTO[item] : {};
          const rows = byWave[String(m.w)] || byWave[m.w] || [];
          rows.forEach(r => { isos[r[0]] = true; });
        });
        Object.keys(isos).sort().forEach(iso => {
          const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? (COUNTRY_NAMES[iso].en || iso) : iso;
          const nameQ = (name.indexOf(',') >= 0) ? '"' + name + '"' : name;
          bl_series(item, iso).forEach(p => {
            csv += [iso, nameQ, item, p[3], p[0], p[1], (p[2] != null ? p[2] : '')].join(',') + '\n';
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-04-neighbourhood-change.csv' : 'el-atlas-04-barrio-evolucion.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initBarrioLineas() {
  if (!state[17]) {
    state[17] = { cat: BL_DEFAULT_CAT, selected: BL_DEFAULT_SELECTED.slice() };
  }
  if (!state[17].cat) state[17].cat = BL_DEFAULT_CAT;
  if (!Array.isArray(state[17].selected)) state[17].selected = BL_DEFAULT_SELECTED.slice();

  setupBarrioLineasCat();
  setupBarrioLineasSearch();
  setupBarrioLineasCSV();
  bl_syncControls();
  renderBarrioLineasChips();
  drawBarrioLineas();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawBarrioLineas;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initBarrioLineas._wired) {
    initBarrioLineas._wired = true;
    window.addEventListener('atlas-editor-change', () => drawBarrioLineas());
  }
  // Nota "Datos" corta del PNG, con el ítem realmente mostrado.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '17') return null;
    const tpl = (typeof t === 'function') ? t('c17-sources-tpl') : '';
    if (!tpl) return null;
    return tpl.replace('{ITEM}', bl_itemLabel());
  };
}
