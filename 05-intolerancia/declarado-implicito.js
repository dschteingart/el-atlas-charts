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
//
// CONTRATO DE INTERACCIÓN DEL SCATTER DEL ATLAS (el mismo de los charts 18 y
// 19 de este número, y el de los scatters del N°1, N°2 y N°3):
//   HOVER sobre una región de la leyenda → se ETIQUETAN todos los países de esa
//     región (se re-corre la anti-colisión sobre el conjunto ampliado) y el
//     resto de los puntos se atenúa por opacidad. Es transitorio: al salir, las
//     etiquetas reveladas desaparecen.
//   CLICK en la leyenda → apaga/prende la región (sus puntos salen del gráfico).
//   TAP sobre un punto → tooltip. Nada más.
// El redibujo del hover es SOLO el grupo de etiquetas (sc_renderLabels): los
// círculos y la leyenda quedan intactos, así el <g> de la leyenda no se recrea
// bajo el cursor y el mouseenter no entra en loop.

const SC_SVG_NS = 'http://www.w3.org/2000/svg';
const sc_ns = (t) => document.createElementNS(SC_SVG_NS, t);
const SC_AXIS = '#9C928A';
const SC_BG = '#FAF8F3';
const SC_DEFAULT_DIM = 'race';
// Países siempre etiquetados (la tesis + referencias); ARG resaltado.
const SC_LABEL_FORCED = ['ARG', 'BRA', 'COL', 'MEX', 'USA', 'GBR', 'FRA', 'DEU', 'JPN', 'KOR', 'ZAF', 'IND', 'ITA', 'ESP'];
const SC_HIGHLIGHT = 'ARG';
// Anclas globales: cuando el hover revela una región entera y no entran todas
// las etiquetas, la anti-colisión sacrifica a los chicos primero (criterio del
// N°1: subPriority 0 para las anclas de cada región, 1 para el resto).
const SC_ANCHORS = {
  USA: 1, DEU: 1, FRA: 1, GBR: 1, ESP: 1, ITA: 1, RUS: 1,
  CHN: 1, JPN: 1, KOR: 1, IND: 1, BRA: 1, MEX: 1, ARG: 1, ZAF: 1
};

// Círculos del último render (para el foco por región POR OPACIDAD) y contexto
// de etiquetas (para re-correr el placement en el hover sin redibujar todo).
let sc_dots = [];
let sc_labelCtx = null;

function sc_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function sc_t(k) {
  return (typeof t === 'function') ? t(k) : k;
}
function sc_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function sc_regionColor(reg) {
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function sc_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#444';
}
function sc_regionLabel(reg) {
  return reg ? sc_t('reg.' + reg) : '—';
}
function sc_measure(text, fs, w) {
  if (!sc_measure._c) { const c = document.createElement('canvas'); sc_measure._c = c.getContext('2d'); }
  sc_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return sc_measure._c.measureText(text).width;
}

// Márgenes por formato. NUNCA devuelve null: el editor ofrece 'public' (y
// 'worldmap'), y cuando esta función devolvía null las líneas que leen
// MARGIN.left tiraban TypeError y el gráfico salía EN BLANCO. `baseBottom` es
// el colchón que queda debajo del título del eje X; las filas de la leyenda se
// suman aparte (drawScatter), porque la leyenda ya no va dentro del plot.
function sc_getMargins(format) {
  switch (format) {
    case 'newsletter':
    case 'square':   return { top: 40, right: 40, bottom: 92, left: 92, baseBottom: 26 };
    case 'mobile':   return { top: 34, right: 34, bottom: 96, left: 82, baseBottom: 30 };
    case 'public':   return { top: 30, right: 34, bottom: 80, left: 84, baseBottom: 22 };
    case 'worldmap': return { top: 28, right: 34, bottom: 76, left: 82, baseBottom: 20 };
    default:         return { top: 30, right: 34, bottom: 80, left: 84, baseBottom: 22 };
  }
}

// ---- regiones apagadas / región hovereada desde la leyenda ----
function sc_hidden() {
  return new Set((state[5] && state[5].hiddenRegions) || []);
}
function sc_hoverRegion() {
  const s = state[5];
  if (!s || !s.hoverRegion) return null;
  return sc_hidden().has(s.hoverRegion) ? null : s.hoverRegion;
}
function sc_toggleRegion(reg) {
  const arr = state[5].hiddenRegions || (state[5].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  state[5].hoverRegion = null;
  drawScatter();
}
function sc_showAllRegions() {
  state[5].hiddenRegions = [];
  state[5].hoverRegion = null;
  drawScatter();
}
function sc_syncShowAll() {
  const btn = document.getElementById('sc-show-all');
  if (!btn) return;
  if (((state[5] && state[5].hiddenRegions) || []).length) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}

// Devuelve los puntos {iso, region, x (declarado), y (implícito)} de la dimensión.
function sc_points() {
  const dim = state[5].dim;
  const dk = dim === 'race' ? 'dRace' : 'dGay';
  const ik = dim === 'race' ? 'iRace' : 'iGay';
  const out = [];
  for (const iso in IMP) {
    if (!Object.prototype.hasOwnProperty.call(IMP, iso)) continue;
    const r = IMP[iso];
    if (r[dk] == null || r[ik] == null) continue;
    out.push({ iso: iso, region: r.region, x: r[dk], y: r[ik] });
  }
  return out;
}

function sc_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c5-subtitle"]');
  if (!el) return;
  const key = state[5].dim === 'race' ? 'c5-subtitle-race' : 'c5-subtitle-gay';
  if (typeof t === 'function') el.textContent = t(key);
}

// Filas de la leyenda de regiones. Se calcula ANTES de fijar el margen inferior
// porque solo depende del ancho del plot (que solo depende de left/right).
function sc_legendLayout(regions, fs, plotW) {
  const dotR = fs * 0.45;
  const gapDot = dotR * 2 + fs * 0.5;
  const gapItem = fs * 1.5;
  const items = regions.map(r => {
    const label = sc_regionLabel(r);
    return { region: r, label: label, w: gapDot + sc_measure(label, fs, 500) + gapItem };
  });
  const rows = [];
  let cur = [], curW = 0;
  items.forEach(it => {
    if (curW + it.w > plotW && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(it); curW += it.w;
  });
  if (cur.length) rows.push(cur);
  return { rows: rows, dotR: dotR, gapDot: gapDot, gapItem: gapItem, rowH: fs * 1.7 };
}

function drawScatter() {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.innerHTML = '';
  sc_dots = [];
  sc_labelCtx = null;
  sc_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || sc_isMobile();
  const mobile = !editorFormat && sc_isMobile();

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 26, label: 24, dot: 9, legend: 20 }
    : mobile
    ? { tick: 20, axisTitle: 23, label: 22, dot: 8, legend: 18 }
    : { tick: 11, axisTitle: 12, label: 12, dot: 5.5, legend: 10.5 };

  let W, H, MARGIN;
  if (editorFormat) {
    const f = (typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[editorFormat]) ? PNG_FORMATS[editorFormat] : { vbW: 1100, vbH: 760 };
    W = f.vbW; H = f.vbH; MARGIN = sc_getMargins(editorFormat);
  } else if (mobile) {
    W = 1100; H = 1100; MARGIN = { top: 26, right: 30, bottom: 0, left: 78, baseBottom: 26 };
  } else {
    W = 1100; H = 620; MARGIN = { top: 20, right: 30, bottom: 0, left: 68, baseBottom: 16 };
  }

  // allPts = todos los países de la dimensión; pts = lo que queda después de
  // apagar regiones desde la leyenda. Las ESCALAS se calculan sobre allPts: el
  // eje no salta cuando el lector apaga una región.
  const allPts = sc_points();
  const hidden = sc_hidden();
  const pts = allPts.filter(p => !hidden.has(p.region));

  const plotW = W - MARGIN.left - MARGIN.right;

  // Leyenda: las regiones presentes en el dataset (incluidas las apagadas, para
  // poder volver a prenderlas). En los formatos de exportación las apagadas no
  // se listan: el PNG muestra sólo lo que está dibujado.
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const presentRegions = order
    .filter(r => allPts.some(p => p.region === r))
    .filter(r => !editorFormat || !hidden.has(r));
  let legendFs = SIZES.legend;
  let leg = sc_legendLayout(presentRegions, legendFs, plotW);
  if (leg.rows.length * leg.rowH > H * 0.26) {
    legendFs = SIZES.legend * 0.8;
    leg = sc_legendLayout(presentRegions, legendFs, plotW);
  }
  const legendH = leg.rows.length * leg.rowH;
  const xTickGap = bigFmt ? SIZES.tick * 1.5 : 16;
  MARGIN.bottom = xTickGap + MARGIN.baseBottom + SIZES.axisTitle * 1.7 + legendH + legendFs * 1.4;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  if (!allPts.length) {
    sc_syncShowAll();
    return;
  }

  // escalas. X declarado 0→max; Y implícito min→max con colchón.
  const xMax = Math.max(...allPts.map(p => p.x), 5) * 1.08;
  const yVals = allPts.map(p => p.y);
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
    const tx = sc_ns('text'); tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + plotH + xTickGap);
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
    const tx = sc_ns('text'); tx.setAttribute('x', MARGIN.left - SIZES.tick * 0.7); tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', '#7A6E62'); tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = v.toFixed(2); gridG.appendChild(tx);
  });

  // títulos de eje
  const xTitleY = MARGIN.top + plotH + xTickGap + SIZES.axisTitle * 1.6;
  const xTitle = sc_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2); xTitle.setAttribute('y', xTitleY);
  xTitle.setAttribute('text-anchor', 'middle'); xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#5A5346'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = sc_t('c5-axis-x');
  svg.appendChild(xTitle);
  const yTitle = sc_ns('text');
  const ytx = bigFmt ? 22 : 16;
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle'); yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px'; yTitle.setAttribute('fill', '#5A5346'); yTitle.setAttribute('font-weight', 500);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = sc_t('c5-axis-y');
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
    c.setAttribute('stroke', isHi ? '#3A3530' : SC_BG);
    c.setAttribute('stroke-width', isHi ? 2 : 1);
    c.style.cursor = 'pointer';
    c.dataset.iso = p.iso;
    c.dataset.region = p.region;
    c.addEventListener('mouseenter', (e) => sc_showTooltip(e, p));
    c.addEventListener('mousemove', (e) => sc_posTooltip(e));
    c.addEventListener('mouseleave', () => sc_hideTooltip());
    dotsG.appendChild(c);
    sc_dots.push(c);
    // hit-area invisible más grande (touch). TAP = tooltip, nada más: el
    // gráfico no tiene chips que togglear.
    const hit = sc_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy); hit.setAttribute('r', Math.max(14, SIZES.dot * 2));
    hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', (e) => sc_showTooltip(e, p));
    hit.addEventListener('mousemove', (e) => sc_posTooltip(e));
    hit.addEventListener('mouseleave', () => sc_hideTooltip());
    hit.addEventListener('click', (e) => { e.stopPropagation(); sc_showTooltip(e, p); });
    dotsG.appendChild(hit);
  });

  // labels: el grupo se re-dibuja solo (sc_renderLabels) cuando cambia el hover
  const labelsG = sc_ns('g'); svg.appendChild(labelsG);
  sc_labelCtx = {
    g: labelsG, pts: pts, plotBox: plotBox, SIZES: SIZES, bigFmt: bigFmt,
    xScale: xScale, yScale: yScale,
    // Durante la EXPORTACIÓN el hover se congela: png-export.js setea
    // __atlasPngFormatOverride y vuelve a llamar a __atlasRedraw, así que si el
    // mouse estaba sobre la leyenda el PNG salía con una región revelada y el
    // resto al 16%. Ojo: no alcanza con mirar editorFormat, porque con el
    // editor abierto (preview) el hover SÍ tiene que funcionar.
    frozen: !!window.__atlasPngFormatOverride
  };
  sc_renderLabels();

  // leyenda de regiones, DEBAJO del título del eje X (antes se dibujaba dentro
  // del área de plot y pisaba los puntos altos).
  sc_drawLegend(svg, leg, MARGIN, plotW, xTitleY, legendFs);

  // Tocar/clickear fuera de un punto: cierra el tooltip y suelta el hover.
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { sc_hideTooltip(); sc_setHoverRegion(null); }
  };

  sc_syncShowAll();
  sc_applyRegionFocus();

  // título insight→neutral (insight solo en la dimensión default = raza)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('5', false, { title: 'c5-title', titleNeutral: 'c5-title-neutral' });
  }
}

// =================== Etiquetas ===================
// Conjunto de etiquetas = la lista editorial fija (persistente, siempre entra)
// ∪ los países de la región hovereada (transitorios, entran si hay lugar).
// Se re-corre la anti-colisión DESDE CERO sobre el conjunto nuevo: ése es el
// mecanismo, no hay layout precalculado.
function sc_renderLabels() {
  const ctx = sc_labelCtx;
  if (!ctx || !ctx.g) return;
  while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);

  const SIZES = ctx.SIZES, bigFmt = ctx.bigFmt;
  const hover = ctx.frozen ? null : sc_hoverRegion();
  const forcedSet = new Set(SC_LABEL_FORCED);

  const items = [];
  ctx.pts.forEach(p => {
    const isBase = forcedSet.has(p.iso);
    const isHover = !isBase && !!hover && p.region === hover;
    if (!isBase && !isHover) return;
    const isHi = p.iso === SC_HIGHLIGHT;
    const fs = isBase ? SIZES.label : SIZES.label * 0.92;
    const weight = isBase ? (isHi ? 700 : 500) : 400;
    const text = sc_name(p.iso);
    items.push({
      cx: ctx.xScale(p.x), cy: ctx.yScale(p.y), text: text,
      textW: sc_measure(text, fs, weight),
      iso: p.iso, region: p.region,
      forced: isBase,
      subPriority: isBase ? 0 : (SC_ANCHORS[p.iso] ? 1 : 2),
      transient: !isBase, fs: fs, weight: weight,
      r: isHi ? SIZES.dot * 1.4 : SIZES.dot
    });
  });

  const placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, ctx.plotBox) : [];
  if (typeof s_relaxLabels === 'function') {
    const obstacles = ctx.pts.map(p => ({ x: ctx.xScale(p.x), y: ctx.yScale(p.y), r: SIZES.dot + 2 }));
    s_relaxLabels(placed, SIZES.label, ctx.plotBox, bigFmt ? 220 : 80, obstacles);
  }

  placed.forEach(l => {
    const fs = l.fs || SIZES.label;
    // línea guía si el label se alejó del punto
    let src = null;
    for (let i = 0; i < items.length; i++) if (items[i].iso === l.iso) { src = items[i]; break; }
    if (src) {
      const dx = l.lx - src.cx, dy = l.ly - src.cy;
      if (Math.hypot(dx, dy) > src.r + (bigFmt ? 14 : 11)) {
        const gl = sc_ns('line');
        gl.setAttribute('x1', src.cx); gl.setAttribute('y1', src.cy);
        gl.setAttribute('x2', l.lx); gl.setAttribute('y2', l.ly - fs * 0.3);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1 : 0.7);
        gl.setAttribute('stroke-opacity', l.transient ? 0.55 : 0.85);
        ctx.g.appendChild(gl);
      }
    }
    const tx = sc_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = fs + 'px';
    tx.setAttribute('font-weight', l.weight || 500);
    // Las reveladas por hover van en el color de su región y más livianas: se
    // distinguen de la selección editorial, que es la persistente.
    tx.setAttribute('fill', l.transient
      ? sc_regionLabelColor(l.region)
      : (l.iso === SC_HIGHLIGHT ? '#8B4220' : '#3A3530'));
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', SC_BG);
    tx.setAttribute('stroke-width', bigFmt ? 4 : 2.6); tx.setAttribute('stroke-linejoin', 'round');
    tx.textContent = l.text;
    ctx.g.appendChild(tx);
  });
}

// =================== Leyenda ===================
// Dentro del SVG (png-export no dibuja leyenda propia en el N°5) pero FUERA del
// área de plot, debajo del título del eje X.
//   HOVER → revela las etiquetas de la región + atenúa el resto por opacidad.
//   CLICK → apaga/prende la región.
function sc_drawLegend(svg, leg, MARGIN, plotW, xTitleY, fs) {
  const g = sc_ns('g'); svg.appendChild(g);
  const hid = sc_hidden();
  const y0 = xTitleY + fs * 2.2;
  leg.rows.forEach((row, ri) => {
    const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
    let x = MARGIN.left + Math.max(0, (plotW - rowW) / 2);
    const y = y0 + ri * leg.rowH;
    row.forEach(it => {
      const off = hid.has(it.region);
      const item = sc_ns('g');
      item.dataset.legendRegion = it.region;
      if (off) item.dataset.legendOff = '1';
      const dot = sc_ns('circle');
      dot.setAttribute('cx', x + leg.dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', leg.dotR);
      dot.setAttribute('fill', off ? 'none' : sc_regionColor(it.region));
      if (off) {
        dot.setAttribute('stroke', sc_regionColor(it.region));
        dot.setAttribute('stroke-width', Math.max(1, fs * 0.11));
      }
      item.appendChild(dot);
      const tx = sc_ns('text');
      tx.setAttribute('x', x + leg.gapDot); tx.setAttribute('y', y);
      tx.setAttribute('dominant-baseline', 'central');
      tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      tx.style.fontSize = fs + 'px'; tx.setAttribute('fill', '#4A4A4A');
      tx.textContent = it.label;
      item.appendChild(tx);
      // Tachado a mano, no text-decoration: el rasterizado SVG→PNG no garantiza
      // el tachado tipográfico, una línea sí.
      if (off) {
        const strike = sc_ns('line');
        strike.setAttribute('x1', x + leg.gapDot - 1);
        strike.setAttribute('x2', x + leg.gapDot + sc_measure(it.label, fs, 500) + 1);
        strike.setAttribute('y1', y); strike.setAttribute('y2', y);
        strike.setAttribute('stroke', '#4A4A4A');
        strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
        item.appendChild(strike);
      }
      // Hit-area del ítem (para que el tap agarre en el celu). Los listeners se
      // cablean siempre —también con el editor abierto, donde hay que poder
      // apagar regiones—: lo que el PNG no puede llevar es el ESTADO de hover,
      // y de eso se ocupa sc_labelCtx.frozen.
      item.style.cursor = 'pointer';
      const hit = sc_ns('rect');
      hit.setAttribute('x', x - 2); hit.setAttribute('y', y - leg.rowH / 2);
      hit.setAttribute('width', it.w); hit.setAttribute('height', leg.rowH);
      hit.setAttribute('fill', 'transparent');
      item.appendChild(hit);
      item.addEventListener('mouseenter', () => sc_setHoverRegion(it.region));
      item.addEventListener('mouseleave', () => sc_setHoverRegion(null));
      item.addEventListener('click', (ev) => { ev.stopPropagation(); sc_toggleRegion(it.region); });
      g.appendChild(item);
      x += it.w;
    });
  });
}

// Idempotente: si la región apuntada no cambió, no se toca el DOM (así el
// mouseenter no parpadea ni entra en loop).
function sc_setHoverRegion(reg) {
  if (reg && sc_hidden().has(reg)) reg = null;
  if (!state[5]) return;
  if ((state[5].hoverRegion || null) === (reg || null)) return;
  state[5].hoverRegion = reg || null;
  sc_renderLabels();
  sc_applyRegionFocus();
}

// Foco por región: SOLO opacidad sobre los círculos ya dibujados + la leyenda.
// Las etiquetas las rehace sc_renderLabels.
function sc_applyRegionFocus() {
  const focus = (sc_labelCtx && sc_labelCtx.frozen) ? null : sc_hoverRegion();
  for (let i = 0; i < sc_dots.length; i++) {
    const c = sc_dots[i];
    c.setAttribute('opacity', (!focus || c.dataset.region === focus) ? 1 : 0.16);
  }
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.querySelectorAll('[data-legend-region]').forEach(el => {
    if (el.dataset.legendOff) { el.setAttribute('opacity', 0.34); return; }
    el.setAttribute('opacity', (!focus || el.dataset.legendRegion === focus) ? 1 : 0.38);
  });
}

// =================== Tooltip ===================
function sc_showTooltip(e, p) {
  const tt = document.getElementById('tooltip5'); if (!tt) return;
  tt.innerHTML = `<strong>${sc_name(p.iso)}</strong>`
    + `<div class="tt-region" style="color:${sc_regionColor(p.region)}">${sc_regionLabel(p.region)}</div>`
    + `<div class="tt-row"><span>${sc_t('c5-tt-declared')}</span><span>${(typeof fmt === 'function') ? fmt(p.x, 1) : p.x}%</span></div>`
    + `<div class="tt-row"><span>${sc_t('c5-tt-implicit')}</span><span>${p.y.toFixed(2)}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
  sc_posTooltip(e);
}
// Se reubica a la izquierda cerca del borde derecho (norma de interacción) y
// se clampea contra el borde IZQUIERDO, que era por donde se salía.
function sc_posTooltip(e) {
  const tt = document.getElementById('tooltip5'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (px < 0) px = 2;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function sc_hideTooltip() { const tt = document.getElementById('tooltip5'); if (tt) tt.style.opacity = '0'; }

// =================== Controles ===================
function setupScatterToggle() {
  document.querySelectorAll('#sc-dim button').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dim;
      if (d !== 'race' && d !== 'gay') return;
      state[5].dim = d;
      state[5].hoverRegion = null;
      document.querySelectorAll('#sc-dim button').forEach(b => b.classList.toggle('active', b.dataset.dim === d));
      drawScatter();
    });
  });
}

function setupScatterShowAll() {
  const btn = document.getElementById('sc-show-all');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => sc_showAllRegions());
}

function setupScatterCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const cell = (v) => (v == null ? '' : v);
      let csv = '# El Atlas N5 — declarado (IVS) vs implicito (Project Implicit, IAT D-score)\n';
      csv += '# dRace/dGay: % que no querria de vecino (IVS, ultimo dato). iRace/iGay: D-score IAT (>0 sesgo pro-dominante).\n';
      csv += 'iso3,pais,region,decl_raza,impl_raza,decl_gay,impl_gay\n';
      Object.keys(IMP).sort().forEach(iso => {
        const r = IMP[iso];
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
        csv += `${iso},${nm},${r.region || ''},${cell(r.dRace)},${cell(r.iRace)},${cell(r.dGay)},${cell(r.iGay)}\n`;
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
  if (!Array.isArray(state[5].hiddenRegions)) state[5].hiddenRegions = [];
  if (state[5].hoverRegion === undefined) state[5].hoverRegion = null;
  setupScatterToggle();
  setupScatterShowAll();
  setupScatterCSV();
  drawScatter();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawScatter;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initScatter._wired) {
    initScatter._wired = true;
    window.addEventListener('atlas-editor-change', () => drawScatter());
  }
  // El PNG rasteriza el SVG: soltamos hover y tooltip antes de exportar, para
  // que la imagen no salga con una región resaltada (y el resto al 16%).
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '5') return;
    sc_hideTooltip();
    if (state[5]) state[5].hoverRegion = null;
  };
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '5') return null;
    return (typeof t === 'function') ? t('c5-sources') : null;
  };
}

// Cambio de idioma: la leyenda y las etiquetas viven dentro del SVG.
function sc_onLangChange() {
  drawScatter();
}
