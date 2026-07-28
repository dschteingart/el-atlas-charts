// El Atlas N°4 — Graficador V-Dem, vista EVOLUCION (chart 23).
// =============================================================
// Tercera vista del graficador de V-Dem (chart-vdem.html): la serie ANUAL
// 1900-2023 del indicador elegido, un pais por linea. CLON del motor de lineas
// de discriminado.js (regla de oro: clonar el motor, no reimplementar). De ahi
// vienen: chips = seleccion (WYSIWYG), hover por opacidad sin redibujar,
// crosshair que NO interpola (atlasSnapYears/atlasLineHoverRows de lib/utils.js)
// y etiquetas al final de cada linea con anti-colision estilo OWID.
//
// Diferencias con el resto de los charts de lineas del numero: V-Dem es anual
// (124 puntos por pais), asi que las lineas van SIN marcadores —la norma de
// marcar donde hay medicion es para series de encuesta con pocas olas— y hay
// slider de PERIODO de dos manijas (setupWcRangeSlider, criterio del N°3).
//
// Datos: VD_SERIES[k][iso] = [primerAnio, [v,...]] con anios consecutivos y
// enteros escalados; el desescalado vive en vdem-adapter.js (vd_scaleOf).
// State: state[23] = { cat, selected[], period }. Las claves .cat y .selected
// las migra lib/grapher.js entre vistas.

const VL_SVG_NS = 'http://www.w3.org/2000/svg';
const vl_ns = (tag) => document.createElementNS(VL_SVG_NS, tag);

// Paleta multiserie estándar del Atlas (12 hues, norma del número).
const VL_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const VL_AXIS = '#9C928A';
const VL_DEFAULT_CAT = 'v2xpe_exlsocgr';
// Fallback de selección: el shell (initGrapher.defaultSelection) la pisa apenas
// activa la vista; esto sólo cubre el primer dibujo del init.
const VL_DEFAULT_SELECTED = ['ARG', 'BRA', 'CHL', 'MEX', 'PER', 'URY'];
const VL_WAVES = [];   // V-Dem es anual: no hay olas

function vl_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}

function vl_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function vl_measure(text, fs, w) {
  if (!vl_measure._c) { const c = document.createElement('canvas'); vl_measure._c = c.getContext('2d'); }
  vl_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return vl_measure._c.measureText(text).width;
}

function vl_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 190, bottom: 92, left: 78 };
    case 'mobile': return { top: 30, right: 150, bottom: 74, left: 70 };
    default: return null;
  }
}

// ---------------------------------------------------------------
//  Series en runtime desde VD_SERIES
// ---------------------------------------------------------------
// vl_series(item, iso) → [[year, pct, n, ola], ...] ordenado por año.
// El año sale de la fila del país en cada ola (r[2]): es el año REAL de campo,
// nunca el punto medio del período de la ola.
function vl_series(item, iso) {
  // Serie anual completa del país para esa variable, ya desescalada.
  const s = (VD_SERIES[item] || {})[iso];
  if (!s) return [];
  const div = vd_scaleOf(item);
  const out = [];
  for (let i = 0; i < s[1].length; i++) {
    const v = s[1][i];
    if (v === null || v === undefined) continue;
    out.push([s[0] + i, v / div]);
  }
  return out;
}

// Rango de años de TODO el dataset (2010-2023). Eje x fijo: con dos puntos por
// país, un dominio que se moviera con la selección haría que la misma variación
// se viera con pendientes distintas según qué países estén elegidos.
function vl_yearBounds() {
  // Rango del eje X. Si el lector movió el slider de período, manda su elección;
  // si no, el rango completo de la variable activa. El clon recorría la
  // estructura por olas de la batería del barrio y devolvía basura.
  const per = state[23] && state[23].period;
  if (per && per.length === 2 && per[1] > per[0]) return [per[0], per[1]];
  const ys = vd_years(state[23] ? state[23].cat : VL_DEFAULT_CAT);
  return ys.length ? [ys[0], ys[ys.length - 1]] : [1900, 2023];
}

// Países con al menos una observación en el ítem activo (para el buscador).
function vl_searchable() {
  // Ver vd_paises(): el recorrido por olas del clon no aplica a V-Dem.
  return vd_paises(state[23].cat).slice()
    .sort((a, b) => vl_name(a).localeCompare(vl_name(b), 'es'))
    .map(iso => ({ iso, name: vl_name(iso) }));
}

// Color persistente por país (estable al sacar otros de la selección).
function vl_color(iso) {
  const s = state[23];
  if (!s._colors) s._colors = {};
  const m = s._colors;
  if (m[iso] == null) {
    const used = new Set(Object.values(m));
    let idx = 0; while (used.has(idx) && idx < VL_PALETTE.length) idx++;
    m[iso] = idx % VL_PALETTE.length;
  }
  return VL_PALETTE[m[iso]];
}

function vl_itemLabel() {
  // Una sola fuente de verdad para el nombre del indicador: VD_VARS.
  return vd_varLabelOf(state[23].cat);
}

function vl_updateSubtitle() {
  // Selector SCOPEADO al bloque del chart 17: en esta página conviven tres
  // .chart-subtitle (charts 13, 17 y 8) y un querySelector global pisaría el
  // que no es (el bug que documenta chart-discriminado.html).
  const el = document.querySelector('.chart-block[data-chart="23"] .chart-subtitle');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const custom = (ae && ae.texts && ae.texts[lang] && (ae.texts[lang].subtitle || '').trim());
  if (custom) return;   // respetar subtítulo custom del editor (?nl)
  const tpl = (typeof t === 'function') ? t('c23-subtitle-tpl') : '';
  // El nombre del indicador sale de VD_VARS (vd_varLabelOf), no del
  // diccionario de ítems de la batería del barrio.
  if (tpl) el.textContent = tpl.replace('{CAT}', vd_varLabelOf(state[23].cat));
}

//==================================================================
//  Render
//==================================================================
function drawVdemLineas() {
  const svg = document.getElementById('chart23');
  if (!svg) return;
  svg.innerHTML = '';
  vl_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || vl_isMobile();
  const mobile = !editorFormat && vl_isMobile();
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const item = state[23].cat;
  const bounds = vl_yearBounds();
  const y0 = bounds[0], y1 = bounds[1];

  // Series de la selección con al menos una observación en el ítem activo.
  // Los puntos se recortan al período elegido. Sin esto la línea se dibujaba con
  // TODOS los años del país y el xScale mandaba el tramo anterior a y0 fuera del
  // área de dibujo, encima del eje y del título (lo que se veía al mover el
  // slider).
  const series = (state[23].selected || [])
    .map(iso => ({ iso: iso, key: iso, color: vl_color(iso),
                   pts: vl_series(item, iso).filter(p => p[0] >= y0 && p[0] <= y1) }))
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
    const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; MARGIN = vl_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1000; MARGIN = { top: 24, right: 140, bottom: 58, left: 66 };
  } else {
    W = 1100; H = 560; MARGIN = { top: 20, right: 168, bottom: 48, left: 60 };
  }

  // margen derecho dinámico por las etiquetas de fin de línea
  let maxLabelW = 0;
  series.forEach(s => {
    const w = vl_measure(vl_name(s.iso) + (isPngFormat ? '  0,00' : ''), SIZES.label, 700);
    if (w > maxLabelW) maxLabelW = w;
  });
  const neededRight = (bigFmt ? 16 : 10) + maxLabelW + (bigFmt ? 12 : 8);
  MARGIN.right = Math.min(Math.round(W * 0.40), Math.max(MARGIN.right, neededRight));

  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // Rango por variable (ver vd_rango): el clon forzaba mínimo 10 y múltiplos de 5.
  const _r = vd_rango(state[23].cat);
  const yMin = _r[0], yMax = _r[1];
  const xScale = (yr) => MARGIN.left + ((yr - y0) / Math.max(1, y1 - y0)) * plotW;
  const yScale = (v) => MARGIN.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // grid + ejes
  const gridG = vl_ns('g'); svg.appendChild(gridG);
  const yticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(yMin, yMax, (mobile ? 4 : 6)) : [0, 20, 40];
  yticks.forEach(v => {
    const y = yScale(v);
    const l = vl_ns('line'); l.setAttribute('x1', MARGIN.left); l.setAttribute('x2', MARGIN.left + plotW);
    l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('stroke', '#ECE7D8'); l.setAttribute('stroke-width', 1);
    gridG.appendChild(l);
    const tx = vl_ns('text'); tx.setAttribute('x', MARGIN.left - 8); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    // El índice va de 0 a 1: Math.round dejaba el eje entero en "0" y "1".
    tx.textContent = vd_fmtVal(v, 1);
    gridG.appendChild(tx);
  });
  const xt = (typeof niceLinearTicks === 'function') ? niceLinearTicks(y0, y1, mobile ? 4 : 7).filter(v => v >= y0 && v <= y1) : [];
  xt.forEach(v => {
    const x = xScale(v);
    const tx = vl_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v); gridG.appendChild(tx);
  });
  // eje Y título
  const yTitle = vl_ns('text');
  const ytx = bigFmt ? 20 : 14;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#7A6E62'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = (typeof t === 'function') ? t('c23-axis-y') : '% que lo ve seguido en su barrio';
  svg.appendChild(yTitle);

  // capas
  const halosG = vl_ns('g'); svg.appendChild(halosG);
  const linesG = vl_ns('g'); svg.appendChild(linesG);
  const dotsG = vl_ns('g'); svg.appendChild(dotsG);
  const hitG = vl_ns('g'); svg.appendChild(hitG);

  const endLabels = [];
  series.forEach(s => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xScale(p[0]).toFixed(1) + ',' + yScale(p[1]).toFixed(1)).join(' ');
    if (s.pts.length > 1) {
      // halo crema
      const halo = vl_ns('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
      halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
      halo.setAttribute('data-bl', s.iso);
      halosG.appendChild(halo);
      // línea (pendiente entre las dos olas)
      const path = vl_ns('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW);
      path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('data-bl', s.iso); path.setAttribute('data-base-w', lineW); path.classList.add('vl-colored');
      linesG.appendChild(path);
    }
    // Sin marcadores: V-Dem es anual y con 124 puntos por país la línea se
    // convertía en un rosario. La norma de marcar dónde hay medición vale para
    // series de encuesta con pocas olas, no para una serie continua. El único
    // caso que conserva el punto es el país con UNA sola observación en el
    // período, donde el marcador es todo lo que hay para dibujar.
    if (s.pts.length === 1) {
      const p = s.pts[0];
      const c = vl_ns('circle'); c.setAttribute('cx', xScale(p[0])); c.setAttribute('cy', yScale(p[1]));
      c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3');
      c.setAttribute('stroke-width', bigFmt ? 2 : 1.4); c.setAttribute('data-bl', s.iso); dotsG.appendChild(c);
    }
    // hit-area para el énfasis al hover (no redibuja)
    if (!isPngFormat && s.pts.length > 1) {
      const hit = vl_ns('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => vl_emph(s.iso));
      hit.addEventListener('mouseleave', () => vl_emph(null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ key: s.iso, color: s.color, text: vl_name(s.iso), x: xScale(last[0]), idealY: yScale(last[1]), valLast: last[1] });
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
  const labG = vl_ns('g'); svg.appendChild(labG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const gl = vl_ns('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.idealY);
      gl.setAttribute('x2', l.x + (bigFmt ? 8 : 5)); gl.setAttribute('y2', l.y);
      gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', bigFmt ? 1.3 : 0.8); gl.setAttribute('stroke-opacity', 0.5);
      gl.setAttribute('data-bl', l.key); labG.appendChild(gl);
    }
    const tx = vl_ns('text'); tx.setAttribute('x', l.x + (bigFmt ? 12 : 7)); tx.setAttribute('y', l.y);
    tx.setAttribute('dominant-baseline', 'central'); tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px'; tx.setAttribute('font-weight', bigFmt ? 700 : 600); tx.setAttribute('fill', l.color);
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', labelHalo); tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-bl', l.key);
    tx.textContent = l.text + (isPngFormat && l.valLast != null ? '  ' + vd_fmtVal(l.valLast, 2) : '');
    labG.appendChild(tx);
  });

  // eje 0
  const zero = vl_ns('line'); zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', VL_AXIS); zero.setAttribute('stroke-width', 1); svg.appendChild(zero);

  // crosshair + tooltip (no en PNG)
  if (!isPngFormat && series.length) {
    vl_setupHover(svg, { W, H, MARGIN, plotW, plotH, y0, y1, xScale, yScale, series });
  }

  // título insight→neutral (default siempre neutral, como el resto del N°4)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('23', false, { title: 'c23-title', titleNeutral: 'c23-title-neutral' });
  }
}

// Énfasis al hover sobre una línea: atenúa el resto (NO redibuja → no se tilda).
function vl_emph(key) {
  const svg = document.getElementById('chart23'); if (!svg) return;
  svg.querySelectorAll('[data-bl]').forEach(el => {
    const me = el.getAttribute('data-bl');
    if (key == null) { el.style.opacity = ''; if (el.classList.contains('vl-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === key) { el.style.opacity = '1'; if (el.classList.contains('vl-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Crosshair vertical + tooltip. NO interpola: el crosshair snapea al año de ola
// más cercano y cada serie aporta su valor MEDIDO (con su año real al lado si no
// es el del encabezado). Ver atlasLineHoverRows en lib/utils.js.
function vl_setupHover(svg, ctx) {
  const { W, MARGIN, plotH, y0, y1, xScale, yScale, series } = ctx;
  const tooltip = document.getElementById('tooltip23');
  // años con encuesta de las series VISIBLES (se recalcula en cada redibujo)
  const snapYears = atlasSnapYears(series);
  const hoverG = vl_ns('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = vl_ns('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', MARGIN.top); vline.setAttribute('y2', MARGIN.top + plotH);
  hoverG.appendChild(vline);
  const cap = vl_ns('rect'); cap.setAttribute('x', MARGIN.left); cap.setAttribute('y', MARGIN.top);
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
      const c = vl_ns('circle'); c.setAttribute('cx', xScale(r.year)); c.setAttribute('cy', yScale(r.value)); c.setAttribute('r', 4.5);
      c.setAttribute('fill', r.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5);
      if (!r.exact) c.setAttribute('opacity', 0.85);
      hoverG.appendChild(c);
      r.label = vl_name(r.key);
    });
    if (tooltip) {
      tooltip.innerHTML = atlasLineTooltipHTML(year, rows, { dec: 2, suffix: '' });
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
function vl_toggleSelect(iso) {
  const arr = state[23].selected; const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  renderVdemLineasChips(); drawVdemLineas();
}

function renderVdemLineasChips() {
  // El contenedor del panel es #vl-chips (el clon buscaba #vl-selected-chips,
  // que es el id de la vista de comparación: por eso no aparecía ningún chip y
  // no había forma de sacar países de la vista).
  const cont = document.getElementById('vl-chips'); if (!cont) return;
  cont.innerHTML = '';
  (state[23].selected || []).slice().sort((a, b) => vl_name(a).localeCompare(vl_name(b), 'es')).forEach(iso => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    const dot = document.createElement('span'); dot.className = 'm-chip-dot'; dot.style.background = vl_color(iso);
    chip.appendChild(dot); chip.appendChild(document.createTextNode(vl_name(iso)));
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => vl_toggleSelect(iso));
    chip.appendChild(x); cont.appendChild(chip);
  });
}

function setupVdemLineasSearch() {
  const input = document.getElementById('vl-search'); const results = document.getElementById('vl-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) { if (!q) return []; const qn = norm(q); return vl_searchable().filter(c => norm(c.name).includes(qn)).slice(0, 8); }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    const sel = state[23].selected || [];
    results.innerHTML = ms.map((c, i) => `<div class="m-search-result${i === act ? ' m-active' : ''}${sel.includes(c.iso) ? ' m-already' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (e) => {
      e.preventDefault(); vl_toggleSelect(el.dataset.iso); input.value = ''; results.classList.remove('open');
    }));
  }
  input.addEventListener('input', (e) => { matches = getM(e.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); vl_toggleSelect(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
}

//==================================================================
//  Controles
//==================================================================
function setupVdemLineasCat() {
  const sel = document.getElementById('vl-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof VD_SERIES === 'undefined' || !VD_SERIES[sel.value]) return;
    state[23].cat = sel.value;
    drawVdemLineas();
  });
}

// Sincroniza el select con el estado (el shell migra .cat entre vistas).
function vl_syncControls() {
  const sel = document.getElementById('vl-cat-select');
  if (sel && state[23] && state[23].cat) sel.value = state[23].cat;
}

//==================================================================
//  Download CSV — las dos olas de los cinco ítems, con el año real
//==================================================================
function setupVdemLineasCSV() {
  document.querySelectorAll('button.download[data-chart="23-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // El clon exportaba recorriendo VL_WAVES, que en V-Dem está vacío: el CSV
      // salía sin una sola fila. Acá va la serie ANUAL de la variable mostrada,
      // recortada al período que el lector tiene en pantalla.
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const item = state[23].cat;
      const b = vl_yearBounds();
      let csv = '';
      csv += '# El Atlas N4 - V-Dem v16, serie anual por pais\n';
      csv += '# variable: ' + item + ' (' + vd_varLabelOf(item) + ')\n';
      csv += '# periodo exportado: ' + b[0] + '-' + b[1] + ' (el que muestra el grafico)\n';
      csv += 'iso3,pais,variable,variable_label_en,anio,valor\n';
      const labQ = '"' + (vd_varMetaOf(item).en || item) + '"';
      vd_paises(item).slice().sort().forEach(iso => {
        const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? (COUNTRY_NAMES[iso].en || iso) : iso;
        const nameQ = (name.indexOf(',') >= 0) ? '"' + name + '"' : name;
        vl_series(item, iso).forEach(p => {
          if (p[0] < b[0] || p[0] > b[1]) return;
          csv += [iso, nameQ, item, labQ, p[0], p[1]].join(',') + '\n';
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-04-vdem-over-time.csv' : 'el-atlas-04-vdem-evolucion.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initVdemLineas() {
  vd_fillVarSelect('vl-cat-select', VL_DEFAULT_CAT);
  if (!state[23]) {
    state[23] = { cat: VL_DEFAULT_CAT, selected: VL_DEFAULT_SELECTED.slice() };
  }
  if (!state[23].cat) state[23].cat = VL_DEFAULT_CAT;
  if (!Array.isArray(state[23].selected)) state[23].selected = VL_DEFAULT_SELECTED.slice();

  setupVdemLineasCat();
  setupVdemLineasSearch();
  setupVdemLineasCSV();
  vl_syncControls();
  renderVdemLineasChips();
  // El slider necesita state[23] YA creado: por eso va acá y no al principio.
  setupVdemLineasPeriodo();
  drawVdemLineas();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawVdemLineas;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initVdemLineas._wired) {
    initVdemLineas._wired = true;
    window.addEventListener('atlas-editor-change', () => drawVdemLineas());
  }
  // Nota "Datos" corta del PNG, con el ítem realmente mostrado.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '23') return null;
    const tpl = (typeof t === 'function') ? t('c23-sources-tpl') : '';
    if (!tpl) return null;
    return tpl.replace('{ITEM}', vl_itemLabel());
  };
}

// Slider de período de dos manijas (setupWcRangeSlider de lib/utils.js), el mismo
// criterio que los gráficos de líneas del N°3 y del especial. Sin esto el eje X
// mostraba el siglo entero y las series se veían aplastadas.
function setupVdemLineasPeriodo() {
  if (typeof setupWcRangeSlider !== 'function') return;
  // Una sola vez: setupWcRangeSlider agrega listeners cada vez que se llama, y
  // las seis variables comparten el mismo rango de años (1900-2023).
  if (setupVdemLineasPeriodo._done) return;
  setupVdemLineasPeriodo._done = true;
  const ys = vd_years(state[23].cat);
  if (!ys.length) return;
  if (!state[23].period) state[23].period = [ys[0], ys[ys.length - 1]];
  // La firma real de setupWcRangeSlider es {fromId, toId, dispId, trackId, years,
  // get, set, onChange}: opera sobre ÍNDICES del array `years`, no sobre min/max.
  setupWcRangeSlider({
    fromId: 'vl-slider-from', toId: 'vl-slider-to',
    dispId: 'vl-range-display', trackId: 'vl-range-track-active',
    years: ys,
    get: function () { return state[23].period; },
    set: function (p) { state[23].period = p; },
    onChange: function () { drawVdemLineas(); }
  });
}
