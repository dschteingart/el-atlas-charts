// =============================================================
//  El Atlas · Religión — motor compartido de los gráficos del número
// =============================================================
// Copia de 06-brasil/br-motor.js (el motor del número anterior) con los MISMOS
// nombres de funciones, para que un arreglo de un lado se porte al otro con un
// diff. Lo nuevo del número va al final, en la sección "áreas apiladas en
// paneles" (relStack: port de ev_panel de 05-pantheon/evolucion.js, con la
// grilla de paneles chicos de tl_drawMultiples, 03-futbol/elo-lines.js).
//
// Un solo motor por familia (criterio de la casa): cada página es un adapter
// que declara sus series y controles; acá viven el dibujo y las interacciones.
//
//   brLines()   líneas temporales (patrón 04-intolerancia/pelicula.js): halo,
//               énfasis al hover sin redibujar (también desde la etiqueta),
//               crosshair que SNAPEA al año con dato (atlasLineHoverRows, nunca
//               interpola), wireTouchScrub, etiquetas al final con anti-colisión
//               y línea guía, bandas de IC, tramos cortados (rupturas de serie),
//               proyección punteada sobre franja gris, escala log opcional.
//   brStackH()  barras horizontales apiladas al 100% con leyenda en el SVG;
//               hover/tap sobre un segmento o su leyenda resalta la categoría.
//   brBars()    barras verticales de ancho parejo (años o períodos), preliminares rayadas.
//   brStackV()  columnas apiladas (tiempo en el eje X) con leyenda en el SVG.
//   brArea()    áreas apiladas (patrón 03b-partidos/ts-partidos.js, modo 'stack').
//   relStack()  áreas apiladas por panel (N°7): un panel = vista grande con etiquetas
//               a la derecha, valores dentro de las bandas y total arriba; dos o más =
//               paneles chicos con la misma escala y la leyenda dentro del SVG.
//
// Controles portados de los charts publicados: slider de período universal
// (05-pantheon/evolucion.js: doble range + cajitas, cajita vacía = extremo),
// buscador + chips de lib/style.css (.m-search-*, .m-selected-chip con el color
// de la serie; el botón Limpiar lo engancha lib/utils.js a *-selected-chips),
// toggles, vista compartible TODO-O-NADA (atlasSyncUrlTodoONada) y CSV estilo
// OWID (BOM, encabezados localizados, campos citados, nombre propio por idioma).
//
// En el SVG solo literales (nunca var()): el PNG se rasteriza por file://.

const BR_NS = 'http://www.w3.org/2000/svg';
const BR_SANS = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const BR_C = {
  bg: '#FAF8F3', ink: '#1A1A1A', soft: '#4A4A4A', muted: '#8A8579', tick: '#7A6E62',
  axis: '#9C928A', grid: '#ECE7D8', rule: '#E0DCC8', proj: '#EFEBE0',
  brasil: '#BE5D32', mundo: '#33312C', gris: '#B5AEA0'
};
// Paleta estándar de 12 (lib/theme.js) + colores fijos por país, para que un
// mismo país tenga el mismo color en todos los gráficos del número.
const BR_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
                    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];
const BR_FIXED = {
  BRA: '#BE5D32', WLD: '#33312C', USA: '#3E5A6E', ARG: '#234B85', MEX: '#2D6A3D', CHN: '#C9A227',
  KOR: '#6B3D8B', CHL: '#2C8484', COL: '#7A2A3F', URY: '#1F8AC0', PER: '#6CB04D', JPN: '#B5639E',
  IND: '#E07A23', LCN: '#D89968', OCDE: '#5A7A4F'
};
// Nombres de agregados y entidades que no están en lib/country-names.js.
const BR_NAMES = {
  WLD: ['Mundo', 'World'], LCN: ['América Latina y el Caribe', 'Latin America & Caribbean'],
  OCDE: ['Promedio OCDE', 'OECD average'], EUR: ['Europa', 'Europe'], NAC: ['América del Norte', 'Northern America'],
  SSA: ['África subsahariana', 'Sub-Saharan Africa'], EAS: ['Asia oriental y sudoriental', 'East & South-East Asia'],
  PISA: ['Promedio de participantes PISA', 'PISA participants average']
};

function br_el(tag, attrs) {
  const e = document.createElementNS(BR_NS, tag);
  if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
  return e;
}
function br_lang() { return (typeof LANG !== 'undefined' && LANG === 'en') ? 'en' : 'es'; }
function br_t(k) { return (typeof t === 'function') ? t(k) : k; }
function br_fmt(v, dec) { return (typeof fmt === 'function') ? fmt(v, dec || 0) : String(v); }
function br_cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function br_name(code) {
  const L = br_lang();
  if (BR_NAMES[code]) return BR_NAMES[code][L === 'en' ? 1 : 0];
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[code]) return COUNTRY_NAMES[code][L] || COUNTRY_NAMES[code].en || code;
  return code;
}
// Fondo claro → texto oscuro (chips de tonos suaves).
function br_isLight(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return false;
  const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.66;
}
function br_measure(text, fs, w) {
  if (!br_measure._c) br_measure._c = document.createElement('canvas').getContext('2d');
  br_measure._c.font = (w || 400) + ' ' + fs + 'px "Source Sans 3", system-ui, sans-serif';
  return br_measure._c.measureText(String(text)).width;
}
// Color estable por clave: fijo si el país lo tiene; si no, el primer color de
// la paleta que no use otra serie de la selección (se guarda en el state).
function br_color(st, key) {
  if (BR_FIXED[key]) return BR_FIXED[key];
  if (!st._colors) st._colors = {};
  if (st._colors[key] == null) {
    const used = new Set(Object.values(st._colors));
    Object.keys(BR_FIXED).forEach(k => used.add(BR_FIXED[k]));
    let c = BR_PALETTE.find(p => !used.has(p));
    if (!c) c = BR_PALETTE[Object.keys(st._colors).length % BR_PALETTE.length];
    st._colors[key] = c;
  }
  return st._colors[key];
}

// ---------------------------------------------------------------- layout
// Formato del editor / del PNG → viewBox y calibres (skill graficos-atlas):
// cuadrado 1100×910 (convención 03b), newsletter 1100×860; celular 1100×1000;
// escritorio 1100×560.
function br_layout(opts) {
  const o = opts || {};
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = 1100, H;
  if (fmt) { const f = PNG_FORMATS[fmt]; H = fmt === 'square' ? 910 : fmt === 'newsletter' ? 860 : f.vbH; }
  else H = mobile ? (o.mobileH || 1000) : (o.desktopH || 560);
  const png = !!fmt && fmt !== 'public';
  const big = !!fmt || mobile;
  // Calibre (medido contra los charts publicados de los N°3 a N°5, oct. 2026): borde superior de la casa.
  // PNG: ejes 24 / etiquetas 27 (casa 22 / 26). Escritorio ≈ 12,5-14 px efectivos. Celular ≈ 9-10 px.
  const S = fmt ? { tick: 24, axis: 26, label: 27, ann: 23, val: 26 }
    : mobile ? { tick: 28, axis: 28, label: 31, ann: 25, val: 27 }
    : { tick: 13, axis: 13, label: 14.5, ann: 12.5, val: 13 };
  return { fmt, mobile, png, big, W, H, S, interactive: !png };
}
function br_prepSvg(svg, L) {
  svg.innerHTML = '';
  svg.__brPanels = [];   // crosshairs de los paneles de este dibujo (br_crosshair)
  svg.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, L.fmt);
}
function br_text(parent, x, y, s, o) {
  const op = o || {};
  const tx = br_el('text', { x: x, y: y });
  tx.setAttribute('font-family', BR_SANS);
  tx.style.fontSize = (op.size || 12) + 'px';
  if (op.weight) tx.setAttribute('font-weight', op.weight);
  tx.setAttribute('fill', op.fill || BR_C.tick);
  if (op.anchor) tx.setAttribute('text-anchor', op.anchor);
  if (op.base) tx.setAttribute('dominant-baseline', op.base);
  if (op.italic) tx.setAttribute('font-style', 'italic');
  if (op.halo) {
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', BR_C.bg);
    tx.setAttribute('stroke-width', op.halo); tx.setAttribute('stroke-linejoin', 'round');
  }
  tx.setAttribute('font-variant-numeric', 'tabular-nums');
  tx.textContent = s;
  parent.appendChild(tx);
  return tx;
}

// Título del eje Y, vertical a la izquierda (rotate -90), peso 500: convención de la casa
// (03b-partidos/ts-partidos.js, 03-futbol/elo-lines.js, 04-intolerancia/pelicula.js).
function br_yTitle(parent, x, cy, text, L) {
  const tx = br_text(parent, x, cy, text, { size: L.S.axis, fill: BR_C.soft, weight: 500, anchor: 'middle' });
  tx.setAttribute('transform', 'rotate(-90 ' + x + ' ' + cy + ')');
  return tx;
}
function br_yTitleW(L, has) { return has ? L.S.axis + (L.big ? 16 : 9) : 0; }

// ---------------------------------------------------------------- líneas
// o = {
//   svg, id, L (br_layout), box?: {x,y,w,h} (para paneles; si falta, todo el SVG),
//   series: [{ key, label, color, pts: [[x, y, lo?, hi?], ...] (null en y = corte),
//              main?: bool (más gruesa), dots?: bool, ci?: bool, labelColor? }],
//   x0, x1, yMin, yMax, yLog?, yTicks?, yFmt(v), xTicks?, yTitle?,
//   proj?: año desde el que es proyección, projLabel?,
//   tol?: tolerancia del snap (0 = series anuales), ttDec, ttSuffix,
//   endValue?: (serie, últimoPunto) => texto que va junto a la etiqueta en el PNG,
//   refLines?: [{ y, label }]
// }
function brLines(o) {
  const L = o.L, S = L.S, svg = o.svg;
  const full = !o.box;
  if (full) br_prepSvg(svg, L);
  const series = (o.series || []).filter(s => s.pts && s.pts.some(p => p && p[1] != null));
  // márgenes: izquierda según el tick más ancho; derecha según la etiqueta final más ancha
  const yTicks = o.yTicks || (o.yLog ? br_logTicks(o.yMin, o.yMax) : niceLinearTicks(o.yMin, o.yMax, L.mobile ? 5 : 6));
  // o.yLabWMin / o.rightW: paneles apilados que comparten el eje X fijan los mismos márgenes (chart-mundo.js)
  const yLabW = Math.max.apply(null, yTicks.map(v => br_measure(o.yFmt(v), S.tick, 400)).concat([10, o.yLabWMin || 0]));
  // etiquetas finales: si una es muy larga se parte en dos renglones (no le roba ancho al gráfico)
  // contrato: margen derecho ≤ 20% del lienzo en el PNG y en el celu (labels largos → dos renglones)
  const capW = L.big ? Math.round(L.W * 0.20) - 30 : 175;
  const labLines = (s, last) => br_wrap2(s.label + (L.png && o.endValue && last ? '  ' + o.endValue(s, last) : ''), S.label, 700, capW);
  let maxLab = 0;
  series.forEach(s => {
    const last = br_lastPt(s.pts);
    labLines(s, last).forEach(ln => { maxLab = Math.max(maxLab, br_measure(ln, S.label, 700)); });
  });
  const box = o.box || { x: 0, y: 0, w: L.W, h: L.H };
  const top = box.y + (L.big ? 14 : 8);
  const left = box.x + br_yTitleW(L, !!o.yTitle) + yLabW + (L.big ? 16 : 10);
  const right = o.rightW != null ? o.rightW : Math.min(box.w * 0.40, maxLab + (L.big ? 30 : 18));
  const bottom = box.y + box.h - (S.tick + (L.big ? 24 : 14));
  const pw = box.x + box.w - right - left, ph = bottom - top;
  const xS = (x) => left + (x - o.x0) / Math.max(1e-9, o.x1 - o.x0) * pw;
  const yS = o.yLog
    ? (v) => bottom - (Math.log10(v) - Math.log10(o.yMin)) / (Math.log10(o.yMax) - Math.log10(o.yMin)) * ph
    : (v) => bottom - (v - o.yMin) / (o.yMax - o.yMin) * ph;
  const g = br_el('g'); svg.appendChild(g);
  // proyección
  if (o.proj != null && o.proj < o.x1) {
    const xp = xS(Math.max(o.proj, o.x0));
    g.appendChild(br_el('rect', { x: xp, y: top, width: left + pw - xp, height: ph, fill: BR_C.proj }));
    if (o.projLabel) br_text(g, (xp + left + pw) / 2, top + S.ann + 4, o.projLabel, { size: S.ann, fill: BR_C.muted, anchor: 'middle', italic: true });
  }
  // grilla y ticks
  yTicks.forEach(v => {
    const y = yS(v);
    g.appendChild(br_el('line', { x1: left, x2: left + pw, y1: y, y2: y, stroke: BR_C.grid, 'stroke-width': 1 }));
    br_text(g, left - (L.big ? 10 : 7), y, o.yFmt(v), { size: S.tick, anchor: 'end', base: 'central' });
  });
  const xt = o.xTicks || niceLinearTicks(o.x0, o.x1, L.mobile ? 5 : 8).filter(v => v >= o.x0 && v <= o.x1 && Number.isInteger(v));
  xt.forEach(v => br_text(g, xS(v), bottom + (L.big ? 30 : 17), o.xLabel ? o.xLabel(v) : String(v), { size: o.xLabel ? S.tick * 0.9 : S.tick, anchor: 'middle' }));
  g.appendChild(br_el('line', { x1: left, x2: left + pw, y1: bottom, y2: bottom, stroke: BR_C.axis, 'stroke-width': 1 }));
  if (o.yTitle) br_yTitle(g, box.x + S.axis * 0.8, (top + bottom) / 2, o.yTitle, L);
  (o.refLines || []).forEach(rl => {
    const y = yS(rl.y);
    g.appendChild(br_el('line', { x1: left, x2: left + pw, y1: y, y2: y, stroke: BR_C.muted, 'stroke-width': L.big ? 1.6 : 1, 'stroke-dasharray': '4 4' }));
    if (rl.label) br_text(g, left + 6, y - (L.big ? 8 : 5), rl.label, { size: S.ann, fill: BR_C.muted, halo: L.big ? 5 : 3 });
  });
  const bandG = br_el('g'), haloG = br_el('g'), lineG = br_el('g'), dotG = br_el('g'), hitG = br_el('g'), labG = br_el('g');
  [bandG, haloG, lineG, dotG, hitG, labG].forEach(x => svg.appendChild(x));
  const lw = (s) => (s.main ? (L.big ? 5 : 3.2) : (L.big ? 3 : 2)) * (s.thin ? 0.75 : 1);
  const ends = [];
  series.forEach(s => {
    const segs = br_segments(s.pts, o.proj);
    // banda de IC
    if (s.ci) {
      br_runs(s.pts).forEach(run => {
        const okRun = run.filter(p => p[2] != null && p[3] != null);
        if (okRun.length < 2) return;
        const d = okRun.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[3]).toFixed(1)).join(' ')
          + ' ' + okRun.slice().reverse().map(p => 'L' + xS(p[0]).toFixed(1) + ',' + yS(p[2]).toFixed(1)).join(' ') + ' Z';
        const band = br_el('path', { d: d, fill: s.color, 'fill-opacity': 0.16, stroke: 'none', 'data-k': s.key });
        bandG.appendChild(band);
      });
    }
    segs.forEach(seg => {
      if (seg.pts.length < 1) return;
      const d = seg.pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
      const w = lw(s);
      haloG.appendChild(br_el('path', { d: d, fill: 'none', stroke: BR_C.bg, 'stroke-width': w + (L.big ? 5 : 3), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-k': s.key }));
      const pth = br_el('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': seg.proj ? w * 0.75 : w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-k': s.key, 'data-base-w': seg.proj ? w * 0.75 : w });
      if (seg.proj) pth.setAttribute('stroke-dasharray', L.big ? '2 7' : '1.5 4.5');
      if (s.dash) pth.setAttribute('stroke-dasharray', L.big ? '12 7' : '7 4');
      pth.classList.add('br-line');
      lineG.appendChild(pth);
      if (L.interactive) {
        const hit = br_el('path', { d: d, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(w + 10, 14) });
        hit.style.cursor = 'pointer';
        hit.addEventListener('mouseenter', () => br_emph(svg, s.key));
        hit.addEventListener('mouseleave', () => br_emph(svg, null));
        hitG.appendChild(hit);
      }
      if (seg.pts.length === 1 && !s.dots) {
        dotG.appendChild(br_el('circle', { cx: xS(seg.pts[0][0]), cy: yS(seg.pts[0][1]), r: L.big ? 4.5 : 3, fill: s.color, 'data-k': s.key }));
      }
    });
    if (s.dots) {
      s.pts.forEach(p => {
        if (!p || p[1] == null) return;
        if (p[0] < o.x0 || p[0] > o.x1) return;
        dotG.appendChild(br_el('circle', { cx: xS(p[0]), cy: yS(p[1]), r: s.main ? (L.big ? 6 : 3.6) : (L.big ? 4.5 : 2.8), fill: s.color, stroke: BR_C.bg, 'stroke-width': L.big ? 2 : 1.2, 'data-k': s.key }));
      });
    }
    const last = br_lastPt(s.pts.filter(p => p && p[0] >= o.x0 && p[0] <= o.x1));
    if (last) ends.push({ key: s.key, color: s.labelColor || s.color, x: xS(last[0]), y0: yS(last[1]), lines: labLines(s, last) });
  });
  // o.noEndLabels: paneles que comparten etiquetas con el último (chart-pisa.js)
  if (!o.noEndLabels) br_endLabels(svg, labG, ends, { L: L, top: top, bottom: bottom });
  if (L.interactive && series.length) br_crosshair(svg, o, { left, right: left + pw, top, bottom, xS, yS, series });
  return { xS, yS, left, top, bottom, pw, ph, right: left + pw };
}
function br_lastPt(pts) { for (let i = (pts || []).length - 1; i >= 0; i--) if (pts[i] && pts[i][1] != null) return pts[i]; return null; }
// corridas sin cortes (un null en y corta la línea: ruptura de serie)
function br_runs(pts) {
  const runs = []; let cur = [];
  (pts || []).forEach(p => { if (!p || p[1] == null) { if (cur.length) runs.push(cur); cur = []; } else cur.push(p); });
  if (cur.length) runs.push(cur);
  return runs;
}
// corta cada corrida en tramo observado y tramo proyectado (el año de corte va en los dos)
function br_segments(pts, proj) {
  const out = [];
  br_runs(pts).forEach(run => {
    if (proj == null) { out.push({ pts: run, proj: false }); return; }
    const obs = run.filter(p => p[0] <= proj), pr = run.filter(p => p[0] >= proj);
    if (obs.length) out.push({ pts: obs, proj: false });
    if (pr.length > 1) out.push({ pts: pr, proj: true });
  });
  return out;
}
function br_logTicks(min, max) {
  const out = [];
  for (let p = Math.floor(Math.log10(min)); p <= Math.ceil(Math.log10(max)); p++) {
    [1, 2, 5].forEach(m => { const v = m * Math.pow(10, p); if (v >= min * 0.999 && v <= max * 1.001) out.push(v); });
  }
  return out;
}
// Énfasis al hover: atenúa el resto sin redibujar (no se tilda).
// kg (opcional): grupo de claves. Con kg, solo se resaltan/atenúan los elementos de ese grupo (data-kg); sin kg,
// solo los que no tienen grupo. Así, en un panel con líneas de socios y áreas de categorías (chart-china.js), pasar
// por una categoría no apaga las líneas y viceversa.
function br_emph(svg, key, kg) {
  svg.querySelectorAll(kg ? '[data-k][data-kg="' + kg + '"]' : '[data-k]:not([data-kg])').forEach(el => {
    const me = el.getAttribute('data-k');
    if (key == null) { el.style.opacity = ''; if (el.classList.contains('br-line')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === key) { el.style.opacity = '1'; if (el.classList.contains('br-line')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.45).toFixed(1)); }
    else el.style.opacity = '0.15';
  });
}
// Etiquetas al final de cada línea con anti-colisión vertical y línea guía.
// Parte una etiqueta en dos renglones si supera capW (corte que equilibra los dos renglones).
function br_wrap2(text, fs, w, capW) {
  if (br_measure(text, fs, w) <= capW || text.indexOf(' ') < 0) return [text];
  // primero, cortar entre el nombre y el valor ("Corea del Sur" / "71%") si el nombre entra solo
  const dv = text.indexOf('  ');
  if (dv > 0) {
    const a = text.slice(0, dv).trim(), b = text.slice(dv).trim();
    if (br_measure(a, fs, w) <= capW || a.indexOf(' ') < 0) return [a, b];
  }
  const words = text.split(' ');
  let best = [text], bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').trim(), b = words.slice(i).join(' ').trim();
    if (!a || !b) continue;
    const mw = Math.max(br_measure(a, fs, w), br_measure(b, fs, w));
    if (mw < bestW) { bestW = mw; best = [a, b]; }
  }
  return best;
}
function br_endLabels(svg, g, ends, c) {
  const L = c.L, S = L.S;
  const LH = S.label * 1.1, PAD = L.big ? 6 : 3;
  ends.forEach(e => { e.lines = e.lines || [e.text]; e.h = S.label + (e.lines.length - 1) * LH; });
  // Separación que CONSERVA el orden vertical de los valores: solo se separan vecinos
  // (en el orden de y0), cada uno la mitad, y se acota al área del gráfico en cada vuelta.
  ends.sort((a, b) => a.y0 - b.y0);
  ends.forEach(e => { e.y = e.y0; });
  const lo = (e) => c.top + e.h * 0.5, hi = (e) => c.bottom - (e.h - S.label) * 0.5;
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 1; i < ends.length; i++) {
      const a = ends[i - 1], b = ends[i];
      if (Math.abs(a.x - b.x) >= 160) continue;
      const need = (a.h + b.h) / 2 + PAD, ov = a.y + need - b.y;
      if (ov > 0.5) { a.y -= ov / 2; b.y += ov / 2; moved = true; }
    }
    ends.forEach(e => { e.y = Math.max(lo(e), Math.min(hi(e), e.y)); });
    if (!moved) break;
  }
  ends.forEach(e => {
    const off = L.big ? 12 : 7;
    if (Math.abs(e.y - e.y0) > 2) {
      g.appendChild(br_el('line', { x1: e.x + 2, y1: e.y0, x2: e.x + off - 2, y2: e.y, stroke: e.color, 'stroke-width': L.big ? 1.4 : 0.9, 'stroke-opacity': 0.55, 'data-k': e.key }));
    }
    const y1 = e.y - (e.lines.length - 1) * LH / 2;
    const tx = br_text(g, e.x + off, y1, e.lines[0], { size: S.label, weight: L.big ? 700 : 600, fill: e.color, base: 'central', halo: L.big ? 5 : 3 });
    if (e.lines.length > 1) {
      tx.textContent = '';
      e.lines.forEach((ln, i) => { const ts = br_el('tspan', { x: e.x + off, y: y1 + i * LH, 'dominant-baseline': 'central' }); ts.textContent = ln; tx.appendChild(ts); });
    }
    tx.setAttribute('data-k', e.key);
    if (L.interactive) {
      tx.style.cursor = 'pointer';
      tx.addEventListener('mouseenter', () => br_emph(svg, e.key));
      tx.addEventListener('mouseleave', () => br_emph(svg, null));
    }
  });
}
// Crosshair + tooltip: snapea al año con observación más cercano y cada serie
// aporta su valor medido (o el de la medición vecina dentro de la tolerancia,
// con su año a la vista). Nunca interpola (lib/utils.js, atlasLineHoverRows).
function br_crosshair(svg, o, ctx) {
  const tip = document.getElementById('tooltip' + o.id);
  const ser = ctx.series.map(s => ({ key: s.key, color: s.color, label: s.label,
    pts: s.pts.filter(p => p && p[1] != null && p[0] >= o.x0 && p[0] <= o.x1) }));
  const snap = atlasSnapYears(ser);
  // pointer-events none: los puntos del crosshair no deben robarle el hover a las líneas (br_emph parpadeaba)
  const hg = br_el('g', { display: 'none', 'pointer-events': 'none' }); svg.appendChild(hg);
  const vl = br_el('line', { y1: ctx.top, y2: ctx.bottom, stroke: '#9a9488', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
  hg.appendChild(vl);
  let lastYear = null;
  // Con varios paneles en el mismo SVG (o.box) el tooltip es uno solo: cada panel lo oculta solo si es suyo.
  const me = {};
  const hide = () => {
    lastYear = null; hg.setAttribute('display', 'none');
    if (tip && (!tip.__brOwner || tip.__brOwner === me)) { tip.__brOwner = null; tip.style.opacity = '0'; tip.style.display = 'none'; }
  };
  const update = (raw) => {
    if (raw == null) { hide(); return; }
    const hit = atlasLineHoverRows(ser, raw, { snapYears: snap, tolerance: o.tol == null ? 0 : o.tol });
    if (hit.year == null || !hit.rows.length) { hide(); return; }
    if (hit.year === lastYear && hg.getAttribute('display') !== 'none' && (!tip || (tip.style.display === 'block' && tip.__brOwner === me))) return;
    lastYear = hit.year;
    hg.setAttribute('display', ''); while (hg.children.length > 1) hg.removeChild(hg.lastChild);
    vl.setAttribute('x1', ctx.xS(hit.year)); vl.setAttribute('x2', ctx.xS(hit.year));
    const rows = hit.rows.slice().sort((a, b) => b.value - a.value);
    rows.forEach(r => {
      hg.appendChild(br_el('circle', { cx: ctx.xS(r.year), cy: ctx.yS(r.value), r: 4, fill: r.color, stroke: BR_C.bg, 'stroke-width': 1.5 }));
      r.label = r.series.label;
    });
    if (tip) {
      tip.innerHTML = (o.ttHTML ? o.ttHTML(hit.year, rows) : atlasLineTooltipHTML(o.ttYearLabel ? o.ttYearLabel(hit.year) : hit.year, rows, { dec: o.ttDec == null ? 1 : o.ttDec, suffix: o.ttSuffix == null ? '' : o.ttSuffix }));
      tip.style.display = 'block'; tip.style.opacity = '1'; tip.__brOwner = me;
    }
  };
  const moveH = (ev) => {
    const p = br_svgPoint(svg, ev), lx = p.x, ly = p.y;
    if (lx < ctx.left - 4 || lx > ctx.right + 4 || ly < ctx.top - 10 || ly > ctx.bottom + 10) { update(null); return; }
    const raw = o.x0 + (lx - ctx.left) / (ctx.right - ctx.left) * (o.x1 - o.x0);
    update(Math.max(o.x0, Math.min(o.x1, raw)));
    if (tip && tip.style.display === 'block') br_tipPlace(tip, ev, 'line');
  };
  // Los listeners colgados del <svg> sobreviven a innerHTML='': se reemplazan en cada dibujo. Un solo
  // despachador por SVG reparte el evento entre los paneles (gráfico normal = un panel).
  if (!o.box || !svg.__brPanels) svg.__brPanels = [];
  svg.__brPanels.push({ move: moveH, leave: () => update(null) });
  if (svg.__brMove) { svg.removeEventListener('mousemove', svg.__brMove); svg.removeEventListener('mouseleave', svg.__brLeave); }
  if (svg.__atlasTouchScrub) { svg.removeEventListener('touchstart', svg.__atlasTouchScrub); svg.removeEventListener('touchmove', svg.__atlasTouchScrub); }
  svg.__brMove = (ev) => svg.__brPanels.forEach(p => p.move(ev));
  svg.__brLeave = () => svg.__brPanels.forEach(p => p.leave());
  svg.addEventListener('mousemove', svg.__brMove); svg.addEventListener('mouseleave', svg.__brLeave);
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, svg.__brMove);
}
function br_clearHover(svg) {
  svg.__brPanels = [];
  if (svg.__brMove) { svg.removeEventListener('mousemove', svg.__brMove); svg.removeEventListener('mouseleave', svg.__brLeave); svg.__brMove = null; }
  if (svg.__atlasTouchScrub) { svg.removeEventListener('touchstart', svg.__atlasTouchScrub); svg.removeEventListener('touchmove', svg.__atlasTouchScrub); svg.__atlasTouchScrub = null; }
}

// ---------------------------------------------------------------- barras apiladas horizontales (100%)
// o = { svg, id, L, rows: [{ key, label, segs: [{ key, value, color, label, dark? }] , note? }],
//       legend: [{ key, label, color }], fmtSeg(v), ttRow(row, seg) => html, box? }
function brStackH(o) {
  const L = o.L, S = L.S, svg = o.svg;
  if (!o.box) { br_prepSvg(svg, L); br_clearHover(svg); }   // como panel, no borra el hover de los demás
  const box = o.box || { x: 0, y: 0, w: L.W, h: L.H };
  const tip = document.getElementById('tooltip' + o.id);
  // leyenda arriba, en filas que se arman midiendo el texto
  const legG = br_el('g'); svg.appendChild(legG);
  const sq = L.big ? 22 : 12, gapI = L.big ? 26 : 16;
  let lx = box.x, ly = box.y + (L.big ? 6 : 2), rowH = sq + (L.big ? 14 : 8);
  (o.legend || []).forEach(it => {
    const w = sq + 6 + br_measure(it.label, S.ann + 1, 400);
    if (lx + w > box.x + box.w && lx > box.x) { lx = box.x; ly += rowH; }
    const gi = br_el('g', { 'data-k': it.key }); legG.appendChild(gi);
    if (o.kg) gi.setAttribute('data-kg', o.kg);
    gi.appendChild(br_el('rect', { x: lx, y: ly, width: sq, height: sq, fill: it.color, stroke: BR_C.rule, 'stroke-width': 0.8 }));
    br_text(gi, lx + sq + 6, ly + sq / 2, it.label, { size: S.ann + 1, fill: BR_C.soft, base: 'central' });
    if (L.interactive) {
      gi.style.cursor = 'pointer';
      gi.addEventListener('mouseenter', () => br_emph(svg, it.key, o.kg));
      gi.addEventListener('mouseleave', () => br_emph(svg, null, o.kg));
    }
    lx += w + gapI;
  });
  const top = ly + rowH + (L.big ? 18 : 10);
  const labW = Math.max.apply(null, o.rows.map(r => br_measure(r.label, S.label, 500)).concat([20]));
  const left = box.x + labW + (L.big ? 16 : 10);
  const right = box.x + box.w - (o.rightPad || 4);
  const n = o.rows.length;
  const bandH = (box.y + box.h - top) / n;
  const barH = Math.min(bandH * 0.72, L.big ? 120 : 60);
  const xS = (v) => left + v / (o.total || 100) * (right - left);
  o.rows.forEach((row, i) => {
    const cy = top + bandH * i + bandH / 2;
    br_text(svg, left - (L.big ? 12 : 8), cy, row.label, { size: S.label, weight: 500, fill: BR_C.ink, anchor: 'end', base: 'central' });
    let acc = 0;
    row.segs.forEach(sg => {
      const v = sg.value || 0;
      const x0 = xS(acc), x1 = xS(acc + v);
      const rc = br_el('rect', { x: x0, y: cy - barH / 2, width: Math.max(0, x1 - x0), height: barH, fill: sg.color, 'fill-opacity': 0.92, stroke: BR_C.bg, 'stroke-width': L.big ? 2 : 1, 'data-k': sg.key });
      if (o.kg) rc.setAttribute('data-kg', o.kg);
      svg.appendChild(rc);
      const pct = v / (o.total || 100) * 100;
      const txt = o.fmtSeg ? o.fmtSeg(v, sg) : br_fmt(v, 0);
      const segFs = L.png ? S.label : S.val;   // en el PNG, del tamaño de las etiquetas (se lee en el celu)
      if (x1 - x0 > br_measure(txt, segFs, 600) + (L.big ? 12 : 6)) {
        const tx = br_text(svg, (x0 + x1) / 2, cy, txt, { size: segFs, weight: 600, fill: sg.dark ? '#FFFFFF' : BR_C.ink, anchor: 'middle', base: 'central' });
        tx.setAttribute('data-k', sg.key); tx.style.pointerEvents = 'none';
        if (o.kg) tx.setAttribute('data-kg', o.kg);
      }
      if (L.interactive) {
        rc.style.cursor = 'pointer';
        // como composicion (N°5): el segmento bajo el puntero sube a opacidad plena; atenuar el resto queda
        // para el hover de la leyenda (atenuar en cada segmento hacía titilar todo el gráfico)
        rc.addEventListener('mouseenter', (ev) => { rc.setAttribute('fill-opacity', 1); br_tipAt(tip, svg, ev, o.ttRow ? o.ttRow(row, sg) : br_ttHTML(row.label, [[sg.label, txt]])); });
        rc.addEventListener('mousemove', (ev) => br_tipMove(tip, svg, ev));
        rc.addEventListener('mouseleave', () => { rc.setAttribute('fill-opacity', 0.92); br_tipHide(tip); });
      }
      acc += v;
    });
    if (row.note) br_text(svg, right, cy + barH / 2 + (L.big ? 22 : 13), row.note, { size: S.ann, fill: BR_C.muted, anchor: 'end' });
  });
}
// Puntero → coordenadas del viewBox con la matriz real de pantalla (svgPoint de brasil-2026/js/charts.js).
// Con max-height el SVG queda en letterbox (preserveAspectRatio meet): rect.width / W da una escala falsa
// y el crosshair se corría del puntero (a 1366×768, hasta un año entero en exportaciones).
function br_svgPoint(svg, ev) {
  const cx = (typeof evClientX === 'function' ? evClientX(ev) : ev.clientX);
  const cy = (typeof evClientY === 'function' ? evClientY(ev) : ev.clientY);
  const m = svg.getScreenCTM ? svg.getScreenCTM() : null;
  if (m) { const p = svg.createSVGPoint(); p.x = cx; p.y = cy; const q = p.matrixTransform(m.inverse()); return { x: q.x, y: q.y, cx, cy }; }
  const rc = svg.getBoundingClientRect(), sc = rc.width / svg.viewBox.baseVal.width;
  return { x: (cx - rc.left) / sc, y: (cy - rc.top) / sc, cx, cy };
}
// Ubicación del tooltip relativa a su contenedor (.chart-svg-wrap), como los charts publicados.
// 'line' (pelicula, ts-partidos, elo-lines): a la derecha y debajo del puntero; a la izquierda pasado el 72%.
// 'bar' (latinobarometro, composicion): arriba del puntero; a la izquierda si no entra, debajo si se sale arriba.
// El clamp al viewport lo hace lib/utils.js (MutationObserver sobre el style).
function br_tipPlace(tip, ev, mode) {
  if (!tip) return;
  const wrap = tip.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(ev) : ev.clientY) - wrap.top;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let px, py;
  if (mode === 'bar') {
    px = x + 14; if (px + w > wrap.width) px = x - w - 14; if (px < 0) px = 0;
    py = y - h - 8; if (py < 0) py = y + 18;
  } else {
    px = (x + 14 + w > wrap.width || x > wrap.width * 0.72) ? Math.max(2, x - w - 14) : x + 14;
    py = y + 14;
  }
  tip.style.left = px + 'px'; tip.style.top = py + 'px';
}
function br_tipAt(tip, svg, ev, html) {
  if (!tip) return;
  tip.innerHTML = html; tip.style.display = 'block'; tip.style.opacity = '1';
  tip.__brOwner = 'bar';   // los crosshairs de otros paneles no lo ocultan (br_crosshair, brArea)
  br_tipPlace(tip, ev, 'bar');
}
function br_tipMove(tip, svg, ev) { if (tip && tip.style.display === 'block') br_tipPlace(tip, ev, 'bar'); }
function br_tipHide(tip) { if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; tip.__brOwner = null; } }
// Contenido de los tooltips de barras en el formato de la casa: <strong> de encabezado (lib/style.css lo
// pone en bloque, serif) + filas .tt-row etiqueta/valor + notas .tt-year. rows = [[etiqueta, valor]].
function br_ttHTML(head, rows, notes) {
  let h = '<strong>' + head + '</strong>';
  (rows || []).forEach(r => { h += '<div class="tt-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
  (notes || []).filter(Boolean).forEach(n => { h += '<div class="tt-year">' + n + '</div>'; });
  return h;
}

// ---------------------------------------------------------------- barras verticales
// Cada barra ocupa una ranura del mismo ancho, sea un año o un período (bienios del Cerrado): nunca barras
// de ancho distinto. o = { svg, id, L, bars: [{ key, value, pre?: bool (preliminar, rayada), tick?: texto del
// eje X (o null), lab?: bool (rotular el valor), labText?: rótulo propio, color?: color propio }], color, preColor,
// labelColor, yFmt(v), yTitle?, ttBar(bar) }
function brBars(o) {
  const L = o.L, S = L.S, svg = o.svg;
  br_prepSvg(svg, L);
  br_clearHover(svg);
  const tip = document.getElementById('tooltip' + o.id);
  const vmax = o.yMax || Math.max.apply(null, o.bars.map(b => b.value)) * 1.1;
  const yT = niceLinearTicks(0, vmax, L.mobile ? 5 : 6);
  const yMax = Math.max(vmax, yT[yT.length - 1]);
  const labW = Math.max.apply(null, yT.map(v => br_measure(o.yFmt(v), S.tick, 400)));
  const left = br_yTitleW(L, !!o.yTitle) + labW + (L.big ? 16 : 10), right = L.W - (L.big ? 14 : 8);
  const top = L.big ? 30 : 16, bottom = L.H - (S.tick + (L.big ? 26 : 15));
  const n = o.bars.length, slot = (right - left) / Math.max(1, n);
  const xS = (i) => left + i * slot;
  const yS = (v) => bottom - v / yMax * (bottom - top);
  if (o.yTitle) br_yTitle(svg, S.axis * 0.8, (top + bottom) / 2, o.yTitle, L);
  yT.forEach(v => {
    svg.appendChild(br_el('line', { x1: left, x2: right, y1: yS(v), y2: yS(v), stroke: BR_C.grid, 'stroke-width': 1 }));
    br_text(svg, left - (L.big ? 10 : 7), yS(v), o.yFmt(v), { size: S.tick, anchor: 'end', base: 'central' });
  });
  // rótulos del eje X: los que trae cada barra, salteando los que se pisarían con el anterior
  let lastR = -Infinity;
  o.bars.forEach((b, i) => {
    if (b.tick == null) return;
    const w = br_measure(String(b.tick), S.tick, 400), cx = xS(i) + slot / 2;
    if (cx - w / 2 < lastR + (L.big ? 14 : 8)) return;
    br_text(svg, cx, bottom + (L.big ? 30 : 17), String(b.tick), { size: S.tick, anchor: 'middle' });
    lastR = cx + w / 2;
  });
  // barras preliminares: rayado diagonal (patrón dentro del mismo SVG → sale igual en el PNG)
  const hatchId = 'br-hatch-' + o.id;
  if (o.bars.some(b => b.pre)) {
    const defs = br_el('defs'); svg.appendChild(defs);
    const hw = L.big ? 9 : 6;
    const pat = br_el('pattern', { id: hatchId, patternUnits: 'userSpaceOnUse', width: hw, height: hw, patternTransform: 'rotate(45)' });
    pat.appendChild(br_el('rect', { x: 0, y: 0, width: hw, height: hw, fill: o.preColor || '#A9C4A0' }));
    pat.appendChild(br_el('line', { x1: 0, y1: 0, x2: 0, y2: hw, stroke: o.color, 'stroke-width': L.big ? 3.5 : 2.4 }));
    defs.appendChild(pat);
  }
  const barG = br_el('g'), labG = br_el('g'), hitG = br_el('g');
  [barG, labG, hitG].forEach(g => svg.appendChild(g));   // rótulos por encima de TODAS las barras
  o.bars.forEach((b, i) => {
    const x0 = xS(i) + slot * 0.12, x1 = xS(i) + slot * 0.88;
    const rc = br_el('rect', { x: x0, y: yS(b.value), width: Math.max(1, x1 - x0), height: bottom - yS(b.value), fill: b.pre ? 'url(#' + hatchId + ')' : (b.color || o.color), 'fill-opacity': b.pre ? 1 : 0.92 });
    if (b.pre) { rc.setAttribute('stroke', o.color); rc.setAttribute('stroke-width', L.big ? 1.6 : 1); }
    barG.appendChild(rc);
    if (b.lab) {
      const tx = br_text(labG, (x0 + x1) / 2, yS(b.value) - (L.big ? 10 : 6), b.labText || o.yFmt(b.value), { size: S.val, weight: 600, fill: o.labelColor || BR_C.ink, anchor: 'middle', halo: L.big ? 6 : 3 });
      tx.style.pointerEvents = 'none';
    }
    if (L.interactive) {
      // hit-area de alto completo: en el celular el dedo no le pega a barras finas
      const hit = br_el('rect', { x: xS(i), y: top, width: slot, height: bottom - top, fill: 'transparent' });
      hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', (ev) => { rc.setAttribute('fill-opacity', b.pre ? 0.75 : 0.7); br_tipAt(tip, svg, ev, o.ttBar(b)); });
      hit.addEventListener('mousemove', (ev) => br_tipMove(tip, svg, ev));
      hit.addEventListener('mouseleave', () => { rc.setAttribute('fill-opacity', b.pre ? 1 : 0.92); br_tipHide(tip); });
      hitG.appendChild(hit);
    }
  });
  svg.appendChild(br_el('line', { x1: left, x2: right, y1: bottom, y2: bottom, stroke: BR_C.axis, 'stroke-width': 1 }));
  return { xS, yS, slot, top, bottom, left, right };
}

// ---------------------------------------------------------------- leyenda en el SVG (filas medidas)
// Devuelve el y donde termina. Hover sobre un ítem resalta su serie (br_emph).
function br_legend(svg, L, box, items, kg) {
  const S = L.S;
  const legG = br_el('g'); svg.appendChild(legG);
  const sq = L.big ? 22 : 12, gapI = L.big ? 26 : 16;
  let lx = box.x, ly = box.y + (L.big ? 6 : 2);
  const rowH = sq + (L.big ? 14 : 8);
  items.forEach(it => {
    const w = sq + 6 + br_measure(it.label, S.ann + 1, 400);
    if (lx + w > box.x + box.w && lx > box.x) { lx = box.x; ly += rowH; }
    const gi = br_el('g', { 'data-k': it.key }); legG.appendChild(gi);
    if (kg) gi.setAttribute('data-kg', kg);
    gi.appendChild(br_el('rect', { x: lx, y: ly, width: sq, height: sq, fill: it.color, 'fill-opacity': 0.92 }));
    br_text(gi, lx + sq + 6, ly + sq / 2, it.label, { size: S.ann + 1, fill: BR_C.soft, base: 'central' });
    if (L.interactive) {
      gi.style.cursor = 'pointer';
      gi.addEventListener('mouseenter', () => br_emph(svg, it.key, kg));
      gi.addEventListener('mouseleave', () => br_emph(svg, null, kg));
    }
    lx += w + gapI;
  });
  return ly + rowH;
}

// ---------------------------------------------------------------- columnas apiladas (tiempo en el eje X)
// o = { svg, id, L, cols: [{ key, label, segs: [{ key, value, color, label, dark? }] }], legend: [{ key, label, color }],
//       total?: número (100 = al 100%; si falta, el máximo de las columnas), yFmt(v), yTitle?, fmtSeg(v, seg), ttSeg(col, seg) }
function brStackV(o) {
  const L = o.L, S = L.S, svg = o.svg;
  br_prepSvg(svg, L);
  br_clearHover(svg);
  const tip = document.getElementById('tooltip' + o.id);
  const top = br_legend(svg, L, { x: 0, y: 0, w: L.W, h: L.H }, o.legend || []) + (L.big ? 18 : 10);
  const sums = o.cols.map(c => c.segs.reduce((a, sg) => a + (sg.value || 0), 0));
  const vmax = o.total || Math.max.apply(null, sums);
  const yT = niceLinearTicks(0, vmax, L.mobile ? 4 : 5);
  const yMax = o.total || Math.max(vmax, yT[yT.length - 1]);
  const labW = Math.max.apply(null, yT.map(v => br_measure(o.yFmt(v), S.tick, 400)));
  const left = br_yTitleW(L, !!o.yTitle) + labW + (L.big ? 16 : 10), right = L.W - (L.big ? 14 : 8);
  const bottom = L.H - (S.tick + (L.big ? 26 : 15));
  const n = o.cols.length, slot = (right - left) / n, cw = Math.min(slot * 0.62, L.big ? 150 : 90);
  const yS = (v) => bottom - v / yMax * (bottom - top);
  if (o.yTitle) br_yTitle(svg, S.axis * 0.8, (top + bottom) / 2, o.yTitle, L);
  yT.forEach(v => {
    if (v > yMax + 1e-9) return;
    svg.appendChild(br_el('line', { x1: left, x2: right, y1: yS(v), y2: yS(v), stroke: BR_C.grid, 'stroke-width': 1 }));
    br_text(svg, left - (L.big ? 10 : 7), yS(v), o.yFmt(v), { size: S.tick, anchor: 'end', base: 'central' });
  });
  const segFs = L.png ? S.label : S.val;
  o.cols.forEach((col, i) => {
    const cx = left + slot * i + slot / 2, x0 = cx - cw / 2;
    br_text(svg, cx, bottom + (L.big ? 30 : 17), col.label, { size: S.tick, anchor: 'middle' });
    let acc = 0;
    col.segs.forEach(sg => {
      const v = sg.value || 0, y1 = yS(acc + v), y0 = yS(acc);
      const rc = br_el('rect', { x: x0, y: y1, width: cw, height: Math.max(0, y0 - y1), fill: sg.color, 'fill-opacity': 0.92, stroke: BR_C.bg, 'stroke-width': L.big ? 2 : 1, 'data-k': sg.key });
      svg.appendChild(rc);
      const txt = o.fmtSeg ? o.fmtSeg(v, sg) : br_fmt(v, 0);
      if (y0 - y1 > segFs + (L.big ? 8 : 4) && cw > br_measure(txt, segFs, 600) + 6) {
        const tx = br_text(svg, cx, (y0 + y1) / 2, txt, { size: segFs, weight: 600, fill: sg.dark ? '#FFFFFF' : BR_C.ink, anchor: 'middle', base: 'central' });
        tx.setAttribute('data-k', sg.key); tx.style.pointerEvents = 'none';
      }
      if (L.interactive) {
        rc.style.cursor = 'pointer';
        rc.addEventListener('mouseenter', (ev) => { rc.setAttribute('fill-opacity', 1); br_tipAt(tip, svg, ev, o.ttSeg(col, sg)); });
        rc.addEventListener('mousemove', (ev) => br_tipMove(tip, svg, ev));
        rc.addEventListener('mouseleave', () => { rc.setAttribute('fill-opacity', 0.92); br_tipHide(tip); });
      }
      acc += v;
    });
  });
  svg.appendChild(br_el('line', { x1: left, x2: right, y1: bottom, y2: bottom, stroke: BR_C.axis, 'stroke-width': 1 }));
}

// ---------------------------------------------------------------- áreas apiladas
// Patrón 03b-partidos/ts-partidos.js (modo 'stack', chart de amistosos): bandas con fill-opacity 0,92 y borde
// crema, hover sobre la banda o su etiqueta la resalta, etiquetas a la derecha (dos renglones si son largas) con
// anticolisión y guía, línea vertical + tooltip con todas las categorías del año (mouse y tap).
// o = { svg, id, L, years, cats: [{ key, label, color, labelColor? }], val(catKey, i) → valor o null,
//       x0, x1, yMax?, yFmt(v), yTitle?, ttFmt(v), ttHead?(año),
//       panel (chart-china.js): box?: {x,y,w,h}, kg? (grupo de resaltado), noEndLabels?, rightW?, xTicks?, yTicks?,
//       yLabWMin?, noYLabels? }
function brArea(o) {
  const L = o.L, S = L.S, svg = o.svg;
  if (!o.box) { br_prepSvg(svg, L); br_clearHover(svg); }
  const box = o.box || { x: 0, y: 0, w: L.W, h: L.H };
  const idx = o.years.map((y, i) => ({ y, i })).filter(d => d.y >= o.x0 && d.y <= o.x1 && o.cats.some(c => o.val(c.key, d.i) != null));
  if (!idx.length) return;
  const tots = idx.map(d => o.cats.reduce((a, c) => a + (o.val(c.key, d.i) || 0), 0));
  let yMax = o.yMax;
  if (!yMax) { const t = niceLinearTicks(0, Math.max.apply(null, tots) * 1.04, 5); yMax = Math.max(t[t.length - 1], Math.max.apply(null, tots)); }
  const yTicks = o.yTicks || niceLinearTicks(0, yMax, L.mobile ? 4 : 5).filter(v => v <= yMax + 1e-9);
  const yLabW = o.noYLabels ? 0 : Math.max.apply(null, yTicks.map(v => br_measure(o.yFmt(v), S.tick, 400)).concat([10, o.yLabWMin || 0]));
  const capW = L.big ? Math.round(L.W * 0.20) - 30 : 175;
  const labLines = (c) => br_wrap2(c.label, S.label, 700, capW);
  let maxLab = 0;
  o.cats.forEach(c => labLines(c).forEach(ln => { maxLab = Math.max(maxLab, br_measure(ln, S.label, 700)); }));
  const top = box.y + (L.big ? 14 : 8), bottom = box.y + box.h - (S.tick + (L.big ? 24 : 14));
  const left = box.x + br_yTitleW(L, !!o.yTitle) + (o.noYLabels ? 0 : yLabW + (L.big ? 16 : 10));
  const right = o.rightW != null ? o.rightW : o.noEndLabels ? (L.big ? 12 : 6) : Math.min(box.w * 0.30, maxLab + (L.big ? 30 : 18));
  const pw = box.x + box.w - right - left, ph = bottom - top;
  const xS = (x) => left + (x - o.x0) / Math.max(1e-9, o.x1 - o.x0) * pw;
  const yS = (v) => bottom - v / yMax * ph;
  const g = br_el('g'); svg.appendChild(g);
  yTicks.forEach(v => {
    g.appendChild(br_el('line', { x1: left, x2: left + pw, y1: yS(v), y2: yS(v), stroke: BR_C.grid, 'stroke-width': 1 }));
    if (!o.noYLabels) br_text(g, left - (L.big ? 10 : 7), yS(v), o.yFmt(v), { size: S.tick, anchor: 'end', base: 'central' });
  });
  const xt = o.xTicks || niceLinearTicks(o.x0, o.x1, L.mobile ? 5 : 8).filter(v => v >= o.x0 && v <= o.x1 && Number.isInteger(v));
  xt.forEach(v => br_text(g, xS(v), bottom + (L.big ? 30 : 17), String(v), { size: S.tick, anchor: 'middle' }));
  if (o.yTitle) br_yTitle(g, box.x + S.axis * 0.8, (top + bottom) / 2, o.yTitle, L);
  const bandG = br_el('g'), labG = br_el('g'); svg.appendChild(bandG); svg.appendChild(labG);
  let base = idx.map(() => 0);
  const ends = [];
  o.cats.forEach(c => {
    const tops = idx.map((d, k) => base[k] + (o.val(c.key, d.i) || 0));
    let dd = '';
    idx.forEach((d, k) => { dd += (k ? 'L' : 'M') + xS(d.y).toFixed(1) + ',' + yS(tops[k]).toFixed(1); });
    for (let k = idx.length - 1; k >= 0; k--) dd += 'L' + xS(idx[k].y).toFixed(1) + ',' + yS(base[k]).toFixed(1);
    const path = br_el('path', { d: dd + 'Z', fill: c.color, 'fill-opacity': 0.92, stroke: BR_C.bg, 'stroke-width': L.big ? 1.6 : 1, 'data-k': c.key });
    if (o.kg) path.setAttribute('data-kg', o.kg);
    if (L.interactive) {
      path.addEventListener('mouseenter', () => br_emph(svg, c.key, o.kg));
      path.addEventListener('mouseleave', () => br_emph(svg, null, o.kg));
    }
    bandG.appendChild(path);
    const k = idx.length - 1;
    if (tops[k] - base[k] > 0) ends.push({ key: c.key, color: c.labelColor || c.color, x: xS(idx[k].y), y0: yS((base[k] + tops[k]) / 2), lines: labLines(c) });
    base = tops;
  });
  g.appendChild(br_el('line', { x1: left, x2: left + pw, y1: bottom, y2: bottom, stroke: BR_C.axis, 'stroke-width': 1 }));
  if (!o.noEndLabels) br_endLabels(svg, labG, ends, { L: L, top: top, bottom: bottom });
  if (!L.interactive) return;
  // línea vertical + tooltip con las categorías del año (snap al año con dato)
  const tip = document.getElementById('tooltip' + o.id);
  const hg = br_el('g', { display: 'none', 'pointer-events': 'none' }); svg.appendChild(hg);
  const vl = br_el('line', { y1: top, y2: bottom, stroke: '#9a9488', 'stroke-width': 1, 'stroke-dasharray': '3 3' }); hg.appendChild(vl);
  // con varios paneles el tooltip es uno solo: cada panel lo oculta solo si es suyo (como br_crosshair)
  const me = {};
  const hide = () => { hg.setAttribute('display', 'none'); if (tip && (!tip.__brOwner || tip.__brOwner === me)) { tip.__brOwner = null; br_tipHide(tip); } };
  const moveH = (ev) => {
    const p = br_svgPoint(svg, ev), lx = p.x, ly = p.y;
    if (lx < left - 4 || lx > left + pw + 4 || ly < top - 10 || ly > bottom + 10) { hide(); return; }
    const raw = o.x0 + (lx - left) / pw * (o.x1 - o.x0);
    let best = idx[0]; idx.forEach(d => { if (Math.abs(d.y - raw) < Math.abs(best.y - raw)) best = d; });
    hg.setAttribute('display', ''); vl.setAttribute('x1', xS(best.y)); vl.setAttribute('x2', xS(best.y));
    if (!tip) return;
    let h = '<div style="font-weight:600;margin-bottom:4px;">' + (o.ttHead ? o.ttHead(best.y) : best.y) + '</div>';
    o.cats.slice().reverse().forEach(c => {
      const v = o.val(c.key, best.i); if (v == null) return;
      h += '<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + c.color + ';"></span>'
        + '<span style="flex:1;">' + c.label + '</span><strong style="font-variant-numeric:tabular-nums;">' + o.ttFmt(v) + '</strong></div>';
    });
    tip.innerHTML = h; tip.style.display = 'block'; tip.style.opacity = '1'; tip.__brOwner = me;
    br_tipPlace(tip, ev, 'line');
  };
  // un solo despachador por SVG reparte el evento entre los paneles (gráfico normal = un panel)
  if (!o.box || !svg.__brPanels) svg.__brPanels = [];
  svg.__brPanels.push({ move: moveH, leave: hide });
  if (svg.__brMove) { svg.removeEventListener('mousemove', svg.__brMove); svg.removeEventListener('mouseleave', svg.__brLeave); }
  if (svg.__atlasTouchScrub) { svg.removeEventListener('touchstart', svg.__atlasTouchScrub); svg.removeEventListener('touchmove', svg.__atlasTouchScrub); }
  svg.__brMove = (ev) => svg.__brPanels.forEach(p => p.move(ev));
  svg.__brLeave = () => svg.__brPanels.forEach(p => p.leave());
  svg.addEventListener('mousemove', svg.__brMove); svg.addEventListener('mouseleave', svg.__brLeave);
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, svg.__brMove);
}

// ================================================================ controles
// Selección con buscador + chips (lib/style.css). o = { pre, universe() → [{key, label, tag?}],
//   get() → [keys], set([keys]), color(key), label(key), fixed?: [keys sin ✕], max?, onChange,
//   dim?(key) → true si está elegido pero no tiene dato en la vista actual,
//   focusAll?: true → con pocas opciones, el desplegable muestra todas al hacer foco }
function brSelector(o) {
  const input = document.getElementById(o.pre + '-search');
  const results = document.getElementById(o.pre + '-search-results');
  const chips = document.getElementById(o.pre + '-selected-chips');
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function toggle(key) {
    const arr = o.get().slice(); const i = arr.indexOf(key);
    if (i >= 0) { if ((o.fixed || []).indexOf(key) >= 0) return; arr.splice(i, 1); }
    else { if (o.max && arr.length >= o.max) arr.shift(); arr.push(key); }
    o.set(arr); render(); o.onChange();
  }
  function render() {
    if (!chips) return;
    chips.innerHTML = '';
    o.get().forEach(key => {
      const chip = document.createElement('span'); chip.className = 'm-selected-chip';
      const bg = o.color(key);
      chip.style.background = bg;
      if (br_isLight(bg)) { chip.style.color = BR_C.ink; chip.classList.add('br-chip-light'); }
      chip.appendChild(document.createTextNode(o.label(key)));
      // seleccionado pero sin dato en la vista actual (p. ej. una región en el Gini): chip atenuado
      if (o.dim && o.dim(key)) { chip.style.opacity = '0.45'; chip.title = br_t('br-sin-dato'); }
      if ((o.fixed || []).indexOf(key) < 0) {
        const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.innerHTML = '×';
        x.setAttribute('aria-label', br_lang() === 'en' ? 'Remove' : 'Quitar');
        x.addEventListener('click', () => toggle(key));
        chip.appendChild(x);
      }
      chips.appendChild(chip);
    });
    if (input) input.placeholder = br_t(o.placeholderKey || 'br-search-ph');
  }
  if (input && results) {
    let matches = [], active = -1;
    const paint = () => {
      if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
      const sel = o.get();
      results.innerHTML = matches.map((c, i) => '<div class="m-search-result' + (i === active ? ' m-active' : '') + (sel.indexOf(c.key) >= 0 ? ' m-already' : '')
        + '" data-i="' + i + '">' + c.label + (c.tag ? '<span class="m-search-region">' + c.tag + '</span>' : '') + '</div>').join('');
      results.classList.add('open');
      results.querySelectorAll('.m-search-result').forEach(el => el.addEventListener('mousedown', (e) => {
        e.preventDefault(); toggle(matches[+el.dataset.i].key); input.value = ''; results.classList.remove('open');
      }));
    };
    const search = () => {
      const q = norm(input.value);
      matches = q ? o.universe().filter(c => norm(c.label).indexOf(q) >= 0).slice(0, 8) : (o.focusAll ? o.universe() : []);
      active = matches.length ? 0 : -1; paint();
    };
    input.addEventListener('input', search);
    if (o.focusAll) { input.addEventListener('focus', search); input.addEventListener('click', search); }
    input.addEventListener('keydown', (e) => {
      if (!results.classList.contains('open')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; paint(); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); toggle(matches[active].key); input.value = ''; results.classList.remove('open'); }
      else if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
    });
    document.addEventListener('click', (e) => { if (!input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open'); });
  }
  render();
  return { render };
}

// Slider de período universal (05-pantheon/evolucion.js): doble range + cajitas.
// Cajita vacía = extremo (el placeholder muestra el año extremo).
// o = { pre, min, max, get() → [y0,y1], set([y0,y1]), onChange }
function brPeriod(o) {
  const r0 = document.getElementById(o.pre + '-r0'), r1 = document.getElementById(o.pre + '-r1');
  const n0 = document.getElementById(o.pre + '-y0'), n1 = document.getElementById(o.pre + '-y1');
  const fill = document.getElementById(o.pre + '-fill');
  if (!r0 || !r1) return { sync: () => {} };
  // min y max pueden ser funciones (el máximo cambia, p. ej., al activar una proyección)
  const mn = () => (typeof o.min === 'function' ? o.min() : o.min);
  const mx = () => (typeof o.max === 'function' ? o.max() : o.max);
  const sync = () => {
    const a = mn(), b = mx(), p = o.get();
    [r0, r1].forEach(r => { r.min = a; r.max = b; r.step = 1; });
    n0.placeholder = a; n1.placeholder = b;
    r0.value = p[0]; r1.value = p[1];
    n0.value = p[0] === a ? '' : p[0];
    n1.value = p[1] === b ? '' : p[1];
    const span = b - a || 1;
    if (fill) { fill.style.left = ((p[0] - a) / span * 100) + '%'; fill.style.width = ((p[1] - p[0]) / span * 100) + '%'; }
  };
  const clampY = (v, d) => { const n = parseInt(v, 10); return isFinite(n) ? Math.max(mn(), Math.min(mx(), n)) : d; };
  r0.addEventListener('input', () => { const p = o.get(); o.set([Math.min(+r0.value, p[1] - 1), p[1]]); sync(); o.onChange(); });
  r1.addEventListener('input', () => { const p = o.get(); o.set([p[0], Math.max(+r1.value, p[0] + 1)]); sync(); o.onChange(); });
  n0.addEventListener('change', () => { const p = o.get(); const v = n0.value === '' ? mn() : clampY(n0.value, p[0]); o.set([Math.min(v, p[1] - 1), p[1]]); sync(); o.onChange(); });
  n1.addEventListener('change', () => { const p = o.get(); const v = n1.value === '' ? mx() : clampY(n1.value, p[1]); o.set([p[0], Math.max(v, p[0] + 1)]); sync(); o.onChange(); });
  sync();
  return { sync };
}

// Toggle de segmentos: <div class="toggle" id="..."><button data-v="...">. o = { el, get, set, onChange }
function brToggle(o) {
  const el = typeof o.el === 'string' ? document.getElementById(o.el) : o.el;
  if (!el) return { sync: () => {} };
  const sync = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === o.get()));
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { o.set(b.dataset.v); sync(); o.onChange(); }));
  sync();
  return { sync };
}

// CSV estilo OWID: BOM, encabezados localizados, campos citados, filename por idioma.
// spec() → { headers: {es:[...], en:[...]}, rows: [[...]], file: {es, en} }
function brCsv(btnSelector, spec) {
  document.querySelectorAll(btnSelector).forEach(btn => btn.addEventListener('click', () => {
    const s = spec(); const L = br_lang();
    const q = (v) => {
      if (v === null || v === undefined) return '""';
      if (typeof v === 'number') return '"' + String(v) + '"';
      return '"' + String(v).replace(/"/g, '""') + '"';
    };
    const lines = [s.headers[L].map(q).join(',')].concat(s.rows.map(r => r.map(q).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = s.file[L];
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

// Subtítulo dinámico que respeta el texto custom del editor (?nl=1).
function brSetSubtitle(id, text) {
  const el = document.querySelector('.chart-block[data-chart="' + id + '"] .chart-subtitle');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const aeL = (ae && ae.lang) || br_lang();
  if (ae && ae.texts && ae.texts[aeL] && (ae.texts[aeL].subtitle || '').trim()) return;
  el.textContent = text;
}
// Lista ~ para la URL (orden indiferente), y vuelta.
function brList(arr) { return (arr || []).join('~'); }
function brParseList(v, valid) { if (v == null) return null; if (v === '-') return []; return v.split('~').filter(x => !valid || valid(x)); }
function brSameList(a, b) { return a.length === b.length && a.every(x => b.indexOf(x) >= 0); }

// Registro estándar de un chart: redraw, formatos, editor y nota del PNG.
function brRegister(id, draw, pngSourceKey, pngSubtitle) {
  window.__atlasSupportsFormats = true;
  window.__atlasDefaultPngFormat = 'square';
  window.__atlasRedraw = draw;
  window.addEventListener('atlas-editor-change', () => draw());
  if (pngSourceKey) {
    window.onBeforePngExportGetSourceText = function (chartId) {
      if (String(chartId) !== String(id)) return null;
      return typeof pngSourceKey === 'function' ? pngSourceKey() : br_t(pngSourceKey);
    };
  }
  // subtítulo propio del PNG (más corto que el de la página), si el chart lo da
  if (pngSubtitle) {
    window.onBeforePngExportGetSubtitle = function (chartId) {
      if (String(chartId) !== String(id)) return null;
      return pngSubtitle();
    };
  }
}

// ================================================================ áreas apiladas en paneles (N°7)
// Port de ev_panel / drawEvo (05-pantheon/evolucion.js), que había quedado en selección única: acá vuelven los
// paneles chicos. Un panel = vista grande: etiquetas de banda a la derecha con anticolisión y línea guía (ev_panel),
// valor de la primera y la última ola dentro de las bandas que lo piden (valColor) y el total arriba de la pila en
// las dos puntas, sin pisar el área. Dos o más = grilla de paneles con la MISMA escala Y (el total más alto de la
// selección, redondeado a 10 hacia arriba), título por panel, ticks Y solo en la primera columna, años solo debajo
// del último panel de cada columna (tl_drawMultiples, 03-futbol/elo-lines.js) y leyenda arriba, DENTRO del SVG
// para que viaje al PNG. Hover/tap sobre una banda, su etiqueta o su ítem de leyenda la resalta en todos los paneles
// (ev_bandEmph: 1 contra 0,22); crosshair que salta a la ola con dato del panel (nunca interpola: la línea entre olas
// es un conector) con el tooltip oscuro de la casa y wireTouchScrub. Todo lo interactivo, gateado por L.interactive.
//
// p (panel) = { key, label, w: [olas], tot: [total por ola],
//               cats: [{ key, label, color (relleno), labelColor, valColor? (texto del valor dentro de la banda), vals }] }
// o = { svg, id, L (rel_layout), panels, cats (leyenda), yFmt(v), ttFmt(v), totalLabel, emptyText, ttNote? }

// Resaltado de una banda (ev_bandEmph): la categoría apuntada queda plena y el resto se atenúa, en todos los paneles.
function rel_bandEmph(svg, band) {
  svg.querySelectorAll('[data-band]').forEach(el => {
    el.setAttribute('fill-opacity', band == null ? el.getAttribute('data-band-op') : (el.getAttribute('data-band') === band ? 1 : 0.22));
  });
  svg.querySelectorAll('[data-band-label]').forEach(el => {
    el.style.opacity = (band == null || el.getAttribute('data-band-label') === band) ? '' : '0.25';
  });
}
// Valor de una serie en el año x por interpolación lineal entre olas. SOLO geometría (dónde cabe un rótulo sin pisar
// el área); los números que ve el lector son siempre los de una ola medida.
function rel_at(w, v, x) {
  if (x <= w[0]) return v[0];
  for (let i = 1; i < w.length; i++) if (x <= w[i]) return v[i - 1] + (x - w[i - 1]) / (w[i] - w[i - 1]) * (v[i] - v[i - 1]);
  return v[v.length - 1];
}
function rel_maxIn(w, v, a, b) { let m = Math.max(rel_at(w, v, a), rel_at(w, v, b)); w.forEach((x, i) => { if (x > a && x < b) m = Math.max(m, v[i]); }); return m; }
function rel_minIn(w, v, a, b) { let m = Math.min(rel_at(w, v, a), rel_at(w, v, b)); w.forEach((x, i) => { if (x > a && x < b) m = Math.min(m, v[i]); }); return m; }

// Hueco que lib/png-export.js le deja al gráfico en el lienzo del formato: lo que no ocupan título, subtítulo, nota y
// firma. lib/png-export no expone atlasPngBox (el N°5 lo tiene en su copia local), así que se replica su cuenta
// (padX 42/32, padTop 36, título 52/64, subtítulo 32/42, gaps 6/28/32, nota 18/24 al 70% del ancho, firma 34, pie 24).
// Por qué: con título y subtítulo de dos renglones el cuadrado deja ~1116×820; dibujar 1100×910 achicaba todo al 90%
// y dejaba franjas muertas a los costados (trampa 6 de la skill). Si cambia la composición de lib/png-export, revisar acá.
function rel_wrapCount(ctx, text, maxW) {
  let n = 0;
  String(text).split('\n').forEach(para => {
    const words = para.split(/\s+/).filter(Boolean); let line = '';
    words.forEach(wd => { const test = line ? line + ' ' + wd : wd; if (ctx.measureText(test).width > maxW && line) { n++; line = wd; } else line = test; });
    if (line) n++;
  });
  return n;
}
function rel_pngBox(fmt, id) {
  if (typeof PNG_FORMATS === 'undefined' || !PNG_FORMATS[fmt]) return null;
  const f = PNG_FORMATS[fmt];
  const nl = fmt === 'newsletter', sq = fmt === 'square', mb = fmt === 'mobile', wm = fmt === 'worldmap';
  const mf = nl || sq || mb || wm;
  const padX = (nl || mb) ? 32 : 42, padTop = 36, padBottom = mf ? 24 : 36;
  const titleSize = mf ? 52 : 36, titleLineH = mf ? 64 : 48, subSize = mf ? 32 : 20, subLineH = mf ? 42 : 30;
  const srcSize = mf ? 18 : 14, srcLineH = mf ? 24 : 20, attribSize = mf ? 34 : 28;
  const innerW = f.nominalW - 2 * padX;
  // los mismos textos que va a leer png-export: DOM y hooks del chart, salvo que el texto custom del editor gane
  const block = document.querySelector('.chart-block[data-chart="' + id + '"]');
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const tx = (ae && ae.texts && ae.texts[ae.lang || br_lang()]) || {};
  const custom = (k) => ((tx[k] || '') + '').trim();
  const dom = (sel) => { const el = block && block.querySelector(sel); return el ? el.textContent.trim() : ''; };
  const hook = (name, cur, k) => {
    if (custom(k) || typeof window[name] !== 'function') return cur;
    try { const v = window[name](id); return v || cur; } catch (_) { return cur; }
  };
  const title = hook('onBeforePngExportGetTitle', dom('.chart-title'), 'title');
  const sub = hook('onBeforePngExportGetSubtitle', dom('.chart-subtitle'), 'subtitle');
  const srcEl = document.querySelector('.footer p[data-i18n$="sources"]');
  const src = hook('onBeforePngExportGetSourceText', srcEl ? srcEl.textContent.trim() : '', 'caption');
  const attribEl = document.querySelector('.footer .attribution');
  const attrib = attribEl ? attribEl.textContent.trim() : '';
  if (!rel_pngBox._c) rel_pngBox._c = document.createElement('canvas').getContext('2d');
  const c = rel_pngBox._c;
  const lines = (txt, font, maxW) => { if (!txt) return 0; c.font = font; return rel_wrapCount(c, txt, maxW); };
  const tl = lines(title, '700 ' + titleSize + 'px "Source Serif 4", Georgia, serif', innerW);
  const sl = lines(sub, 'italic ' + subSize + 'px "Source Serif 4", Georgia, serif', innerW);
  c.font = '600 ' + attribSize + 'px "Source Sans 3", -apple-system, sans-serif';
  const attribW = attrib ? c.measureText(attrib).width : 0;
  const srcMaxW = attrib ? Math.min(innerW * 0.70, innerW - attribW - 30) : innerW * 0.70;
  const srcl = lines(src, '400 ' + srcSize + 'px "Source Sans 3", -apple-system, sans-serif', srcMaxW);
  const above = padTop + tl * titleLineH + (sl ? 6 + sl * subLineH : 0) + (mb ? 12 : 28);
  const below = (srcl ? 32 + (srcl - 1) * srcLineH + Math.max(srcLineH, attribSize * 1.15) : (attrib ? 32 + attribSize * 1.15 : 0)) + padBottom;
  return { w: innerW, h: Math.max(200, f.nominalH - above - below) };
}
// br_layout con el alto del PNG medido sobre el hueco real (en pantalla, los altos de la casa).
function rel_layout(id) {
  const L = br_layout();
  if (L.fmt) { const b = rel_pngBox(L.fmt, id); if (b) L.H = Math.round(L.W * b.h / b.w); }
  return L;
}

// Años del eje: las puntas del período y los redondos del medio (2005, 2015), los mismos en los paneles chicos.
// En un panel angosto se cae el del medio que se pisa con un vecino; las puntas quedan siempre.
function rel_xTickRow(g, L, xS, x0, x1, y, single) {
  const S = L.S, gap = L.big ? 16 : 8;
  const ys = [x0].concat([2005, 2015].filter(v => v > x0 + 2 && v < x1 - 2), x1 > x0 ? [x1] : []);
  const it = ys.map((v, i) => {
    const w = br_measure(String(v), S.tick, 400), x = xS(v);
    // en los paneles chicos las puntas van hacia adentro, para no chocar con los años del panel vecino
    const anchor = single ? 'middle' : (i === 0 ? 'start' : i === ys.length - 1 ? 'end' : 'middle');
    const l = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
    return { v, x, anchor, l, r: l + w };
  });
  const keep = [it[0]], lastIt = it[it.length - 1];
  for (let i = 1; i < it.length - 1; i++) if (it[i].l >= keep[keep.length - 1].r + gap && it[i].r + gap <= lastIt.l) keep.push(it[i]);
  if (it.length > 1) keep.push(lastIt);
  keep.forEach(k => br_text(g, k.x, y, String(k.v), { size: S.tick, anchor: k.anchor }));
}

// Leyenda dentro del SVG (paneles chicos): cuadrado del color de la banda + nombre en el color de su etiqueta.
// Devuelve el alto que ocupa (con draw = false solo mide). Hover sobre un ítem resalta su banda en todos los paneles.
function rel_legend(svg, L, box, cats, draw) {
  const fs = L.S.label, sq = L.big ? 22 : 12, inner = L.big ? 10 : 6, gap = L.big ? 34 : 20;
  const rowH = fs + (L.big ? 14 : 8);
  let lx = box.x, row = 0;
  cats.forEach(c => {
    const w = sq + inner + br_measure(c.label, fs, 700);
    if (lx + w > box.x + box.w && lx > box.x) { lx = box.x; row++; }
    if (draw) {
      const cy = box.y + row * rowH + rowH / 2;
      const gi = br_el('g', { 'data-band-label': c.key }); svg.appendChild(gi);
      gi.appendChild(br_el('rect', { x: lx, y: cy - sq / 2, width: sq, height: sq, rx: 2, fill: c.color }));
      br_text(gi, lx + sq + inner, cy, c.label, { size: fs, weight: 700, fill: c.labelColor || c.color, base: 'central' });
      if (L.interactive) {
        gi.style.cursor = 'pointer';
        gi.addEventListener('mouseenter', () => rel_bandEmph(svg, c.key));
        gi.addEventListener('mouseleave', () => rel_bandEmph(svg, null));
      }
    }
    lx += w + gap;
  });
  return (row + 1) * rowH;
}

function rel_ttHTML(p, k, o) {
  const row = (color, label, v, sepTop) => '<div style="display:flex;align-items:center;gap:6px;line-height:1.5;'
    + (sepTop ? 'margin-top:3px;padding-top:3px;border-top:1px solid rgba(255,255,255,0.22);' : '') + '">'
    + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (color || 'transparent') + ';"></span>'
    + '<span style="flex:1;">' + label + '</span><strong style="font-variant-numeric:tabular-nums;">' + o.ttFmt(v) + '</strong></div>';
  let h = '<div style="font-weight:600;margin-bottom:4px;">' + p.label + ', ' + p.w[k] + '</div>';
  // de arriba hacia abajo, como se ven las bandas; el total cierra
  p.cats.slice().reverse().forEach(c => { h += row(c.color, c.label, c.vals[k]); });
  h += row(null, o.totalLabel, p.tot[k], true);
  // nota en gris debajo (o.ttNote), p. ej. cuando los valores son un promedio móvil y no la ola sola
  return h + (o.ttNote ? '<div class="tt-year">' + o.ttNote + '</div>' : '');
}

// Un panel: grilla, ticks, bandas y (si es la vista grande) etiquetas, valores y totales. Devuelve las escalas.
function rel_panel(svg, p, o) {
  const L = o.L, S = L.S, big = L.big, b = o.box;
  const xS = (x) => b.x + (x - o.x0) / Math.max(1e-9, o.x1 - o.x0) * b.w;
  const yS = (v) => b.y + b.h - v / o.D * b.h;
  const yearAt = (px) => o.x0 + (px - b.x) / b.w * (o.x1 - o.x0);
  const g = br_el('g'); svg.appendChild(g);
  if (!o.single) {
    const tl = br_wrap2(p.label, S.label, 700, b.w);
    tl.forEach((ln, i) => br_text(g, b.x, b.y - (big ? 12 : 7) - (tl.length - 1 - i) * S.label * 1.08, ln, { size: S.label, weight: 700, fill: BR_C.ink }));
  }
  o.yTicks.forEach(v => {
    g.appendChild(br_el('line', { x1: b.x, x2: b.x + b.w, y1: yS(v), y2: yS(v), stroke: BR_C.grid, 'stroke-width': 1 }));
    if (o.firstCol) br_text(g, b.x - (big ? 10 : 7), yS(v), o.yFmt(v), { size: S.tick, anchor: 'end', base: 'central' });
  });
  if (o.bottomRow) rel_xTickRow(g, L, xS, o.x0, o.x1, b.y + b.h + (big ? 30 : 17), o.single);
  // bandas apiladas de abajo hacia arriba, borde crema entre bandas
  const N = p.w.length, bands = [];
  let base = new Array(N).fill(0);
  p.cats.forEach(c => {
    const top = base.map((v, i) => v + (c.vals[i] || 0));
    let d = '';
    for (let i = 0; i < N; i++) d += (i ? 'L' : 'M') + xS(p.w[i]).toFixed(1) + ',' + yS(top[i]).toFixed(1);
    for (let i = N - 1; i >= 0; i--) d += 'L' + xS(p.w[i]).toFixed(1) + ',' + yS(base[i]).toFixed(1);
    const path = br_el('path', { d: d + 'Z', fill: c.color, 'fill-opacity': 1, stroke: BR_C.bg, 'stroke-width': big ? 1.6 : 1,
                                 'stroke-linejoin': 'round', 'data-band': c.key, 'data-band-op': 1 });
    if (L.interactive) {
      path.addEventListener('mouseenter', () => rel_bandEmph(svg, c.key));
      path.addEventListener('mouseleave', () => rel_bandEmph(svg, null));
    }
    g.appendChild(path);
    bands.push({ c, lo: base, hi: top });
    base = top;
  });
  g.appendChild(br_el('line', { x1: b.x, x2: b.x + b.w, y1: b.y + b.h, y2: b.y + b.h, stroke: BR_C.axis, 'stroke-width': 1 }));
  if (o.single) {
    const labG = br_el('g'); svg.appendChild(labG);
    const fs = S.label, N1 = N - 1;
    // (1) etiquetas de banda a la derecha, centradas en la banda de la última ola (ev_panel): se separan sin
    // perder el orden, no se pasan del gráfico y, si se corren, una guía las une con su banda
    const LH = fs * 1.08, sep = big ? 8 : 5;
    const labs = bands.filter(bd => bd.hi[N1] - bd.lo[N1] > 1e-9).map(bd => {
      const lines = br_wrap2(bd.c.label, fs, 700, o.capW);
      return { key: bd.c.key, color: bd.c.labelColor || bd.c.color, lines, hh: lines.length * LH, y0: yS((bd.lo[N1] + bd.hi[N1]) / 2) };
    }).sort((a, c) => a.y0 - c.y0);
    labs.forEach(l => { l.yy = l.y0; });
    for (let i = 1; i < labs.length; i++) {
      const min = labs[i - 1].yy + labs[i - 1].hh / 2 + labs[i].hh / 2 + sep;
      if (labs[i].yy < min) labs[i].yy = min;
    }
    const btm = b.y + b.h, lastL = labs[labs.length - 1];
    if (lastL && lastL.yy + lastL.hh / 2 > btm) {
      lastL.yy = btm - lastL.hh / 2;
      for (let i = labs.length - 2; i >= 0; i--) {
        const max = labs[i + 1].yy - labs[i + 1].hh / 2 - labs[i].hh / 2 - sep;
        if (labs[i].yy > max) labs[i].yy = max;
      }
    }
    const xr = xS(p.w[N1]), xl = b.x + b.w + (big ? 16 : 9);
    labs.forEach(l => {
      if (Math.abs(l.yy - l.y0) > fs * 0.75) {
        labG.appendChild(br_el('line', { x1: xr + 2, y1: l.y0, x2: xl - 4, y2: l.yy, stroke: l.color, 'stroke-width': big ? 1.6 : 1, 'stroke-opacity': 0.55, 'data-band-label': l.key }));
      }
      const y1 = l.yy - (l.lines.length - 1) * LH / 2;
      const tx = br_text(labG, xl, y1, l.lines[0], { size: fs, weight: 700, fill: l.color, base: 'central' });
      if (l.lines.length > 1) {
        tx.textContent = '';
        l.lines.forEach((ln, i) => {
          const ts = br_el('tspan', { x: xl, y: y1 + i * LH, 'dominant-baseline': 'central' });
          ts.textContent = ln; tx.appendChild(ts);
        });
      }
      tx.setAttribute('data-band-label', l.key);
      if (L.interactive) {
        tx.style.cursor = 'pointer';
        tx.addEventListener('mouseenter', () => rel_bandEmph(svg, l.key));
        tx.addEventListener('mouseleave', () => rel_bandEmph(svg, null));
      }
    });
    // (2) valor de la primera y la última ola dentro de las bandas que lo piden, si entra en la franja que la banda
    // deja libre a lo ancho de todo el número (si no entra, queda en el tooltip)
    const pad = big ? 14 : 8;
    [[0, 'start'], [N1, 'end']].forEach(([i, anchor]) => {
      bands.forEach(bd => {
        if (!bd.c.valColor) return;
        const txt = br_fmt(bd.c.vals[i], 0) + '%';
        const tw = br_measure(txt, fs, 700);
        const xa = anchor === 'start' ? xS(p.w[i]) + pad : xS(p.w[i]) - pad - tw;
        const ya = yearAt(xa - 2), yb = yearAt(xa + tw + 2);
        const yTop = yS(rel_minIn(p.w, bd.hi, ya, yb)), yBot = yS(rel_maxIn(p.w, bd.lo, ya, yb));
        if (yBot - yTop < fs + (big ? 8 : 4)) return;
        // a la altura del centro de la banda bajo el centro de la etiqueta (no de la franja libre: con la banda
        // subiendo, el 5% de 1996 quedaba bajo; Daniel, 7-nov), sin salirse de la franja
        const yc = yearAt(xa + tw / 2);
        const yMid = yS((rel_at(p.w, bd.lo, yc) + rel_at(p.w, bd.hi, yc)) / 2);
        const yv = Math.min(Math.max(yMid, yTop + fs / 2 + 2), yBot - fs / 2 - 2);
        const tv = br_text(labG, anchor === 'start' ? xa : xa + tw, yv, txt, { size: fs, weight: 700, fill: bd.c.valColor, anchor, base: 'central' });
        tv.setAttribute('data-band-label', bd.c.key); tv.style.pointerEvents = 'none';
      });
    });
    // (3) total arriba de la pila en las dos puntas, apoyado sobre el punto más alto que tiene debajo
    [[0, 'start'], [N1, 'end']].forEach(([i, anchor]) => {
      const txt = o.totalLabel + ' ' + br_fmt(p.tot[i], 0) + '%';
      const tw = br_measure(txt, fs, 700);
      const xa = anchor === 'start' ? xS(p.w[i]) : xS(p.w[i]) - tw;
      const m = rel_maxIn(p.w, p.tot, yearAt(xa - 4), yearAt(xa + tw + 4));
      const tt = br_text(labG, anchor === 'start' ? xa : xa + tw, yS(m) - o.totPad, txt, { size: fs, weight: 700, fill: BR_C.ink, anchor, halo: big ? 5 : 3 });
      tt.style.pointerEvents = 'none';
    });
  }
  return { xS, yS };
}

function relStack(o) {
  const L = o.L, S = L.S, svg = o.svg, big = L.big;
  const panels = (o.panels || []).filter(p => p.w && p.w.length);
  const n = panels.length;
  br_tipHide(document.getElementById('tooltip' + o.id));
  const wrap = svg.closest('.chart-svg-wrap');
  if (wrap) wrap.classList.toggle('rel-multi', n > 1);   // rel.css: sin tope de alto con paneles chicos
  if (!n) {
    // selección vacía (es legítimo: los defaults no resucitan) → invitación a elegir, como evolucion
    if (!L.fmt) L.H = L.mobile ? 520 : 300;
    br_prepSvg(svg, L); br_clearHover(svg);
    br_text(svg, L.W / 2, L.H / 2, o.emptyText || '', { size: big ? S.label : 17, fill: BR_C.muted, anchor: 'middle', base: 'central', italic: true });
    return;
  }
  const single = n === 1;
  // período: un panel = sus olas; varios = el mismo para todos (Venezuela termina antes y se ve)
  const x0 = Math.min.apply(null, panels.map(p => p.w[0]));
  const x1 = Math.max.apply(null, panels.map(p => p.w[p.w.length - 1]));
  const maxTot = Math.max.apply(null, panels.map(p => Math.max.apply(null, p.tot)));
  const yTop = Math.max(10, Math.ceil(maxTot / 10 - 1e-9) * 10);
  const yTicks = niceLinearTicks(0, yTop, (L.mobile || n > 3) ? 4 : 5).filter(v => v <= yTop + 1e-9);
  const yLabW = Math.max.apply(null, yTicks.map(v => br_measure(o.yFmt(v), S.tick, 400)));
  const left = Math.ceil(yLabW) + (big ? 16 : 10);
  const bottomH = S.tick + (big ? 24 : 14);
  const capW = big ? Math.round(L.W * 0.20) - 30 : 175;   // margen derecho ≤ 20%: etiquetas largas a dos renglones
  const base = { L, x0, x1, yTicks, yFmt: o.yFmt, totalLabel: o.totalLabel, capW, totPad: big ? 12 : 7 };
  const hover = [];
  if (single) {
    const p = panels[0], N1 = p.w.length - 1, fs = S.label;
    let maxLab = 0;
    p.cats.forEach(c => { if (c.vals[N1] > 0) br_wrap2(c.label, fs, 700, capW).forEach(ln => { maxLab = Math.max(maxLab, br_measure(ln, fs, 700)); }); });
    const right = Math.ceil(maxLab) + (big ? 34 : 18);
    const top = L.png ? 26 : big ? 12 : 6;   // en el PNG, aire entre el subtítulo y el gráfico (molde de los PNG publicados)
    br_prepSvg(svg, L); br_clearHover(svg);
    const box = { x: left, y: top, w: L.W - left - right, h: L.H - bottomH - top };
    // Dominio Y: los ticks llegan a yTop y arriba queda el aire justo para que "Total 41%" se apoye sobre la pila
    // sin pisarla ni salirse del recuadro del gráfico (el aire de arriba queda libre).
    const xToYear = (px) => x0 + (px - box.x) / box.w * (x1 - x0);
    const cap = fs * 0.74;
    let D = yTop;
    [[0, 'start'], [N1, 'end']].forEach(([i, anchor]) => {
      const tw = br_measure(o.totalLabel + ' ' + br_fmt(p.tot[i], 0) + '%', fs, 700);
      const xp = box.x + (p.w[i] - x0) / Math.max(1e-9, x1 - x0) * box.w;
      const xa = anchor === 'start' ? xp : xp - tw;
      const m = rel_maxIn(p.w, p.tot, xToYear(xa - 4), xToYear(xa + tw + 4));
      const room = box.h - base.totPad - cap;
      if (room > 0) D = Math.max(D, m * box.h / room);
    });
    const r = rel_panel(svg, p, Object.assign({}, base, { box, D, single: true, firstCol: true, bottomRow: true }));
    hover.push({ p, box, xS: r.xS, yS: r.yS });
  } else {
    const gridW = L.W - left - (big ? 14 : 8);
    const legY = L.png ? 14 : 0;   // en el PNG, aire entre el subtítulo y la leyenda
    const legH = legY + rel_legend(svg, L, { x: left, y: legY, w: gridW }, o.cats, false) + (big ? 8 : 4);
    let titleH = S.label + (big ? 16 : 10);
    const gapX = big ? 40 : 24;
    let gapY = titleH + (big ? 22 : 14);
    let cols;
    if (L.mobile) cols = 1;                                  // celular: una columna a todo el ancho (elo-lines)
    else if (L.fmt) {
      // lienzo fijo: las columnas que dejan los paneles más cerca de 1,6:1 (una serie de 28 años pide ancho)
      const gh = L.H - legH - titleH - bottomH;
      let bd = Infinity; cols = 1;
      for (let c = 1; c <= Math.min(n, 5); c++) {
        const rws = Math.ceil(n / c);
        const asp = ((gridW - (c - 1) * gapX) / c) / ((gh - (rws - 1) * gapY) / rws);
        const d = Math.abs(Math.log(asp / 1.6));
        if (d < bd - 1e-9) { bd = d; cols = c; }
      }
    } else cols = n <= 3 ? n : Math.min(4, Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);
    const pw = (gridW - (cols - 1) * gapX) / cols;
    // un título más ancho que su panel ("América Latina sin Brasil" en cinco columnas) va en dos renglones: si no,
    // se mete en el título del panel vecino. Todas las filas reservan el mismo alto de título.
    const tLines = Math.max.apply(null, panels.map(p => br_wrap2(p.label, S.label, 700, pw).length));
    titleH += (tLines - 1) * S.label * 1.08; gapY += (tLines - 1) * S.label * 1.08;
    // en pantalla el alto crece con las filas (se scrollea) para que cada panel conserve su forma
    if (!L.fmt) L.H = Math.round(legH + titleH + rows * (L.mobile ? pw / 1.7 : Math.max(150, Math.min(400, pw / 1.55))) + (rows - 1) * gapY + bottomH);
    const ph = (L.H - legH - titleH - bottomH - (rows - 1) * gapY) / rows;
    br_prepSvg(svg, L); br_clearHover(svg);
    rel_legend(svg, L, { x: left, y: legY, w: gridW }, o.cats, true);
    panels.forEach((p, i) => {
      const c = i % cols, rw = Math.floor(i / cols);
      const box = { x: left + c * (pw + gapX), y: legH + titleH + rw * (ph + gapY), w: pw, h: ph };
      const r = rel_panel(svg, p, Object.assign({}, base, { box, D: yTop, single: false, firstCol: c === 0, bottomRow: i + cols >= n }));
      hover.push({ p, box, xS: r.xS, yS: r.yS });
    });
  }
  if (!L.interactive) return;
  // crosshair por panel: salta a la ola con dato más cercana DE ESE PANEL; un solo tooltip para todos (br_crosshair)
  const tip = document.getElementById('tooltip' + o.id);
  hover.forEach(hp => {
    const b = hp.box, p = hp.p;
    const hg = br_el('g', { display: 'none', 'pointer-events': 'none' }); svg.appendChild(hg);
    const vl = br_el('line', { y1: b.y, y2: b.y + b.h, stroke: '#9a9488', 'stroke-width': 1, 'stroke-dasharray': '3 3' }); hg.appendChild(vl);
    const dot = br_el('circle', { r: big ? 6 : 3.5, fill: BR_C.ink, stroke: BR_C.bg, 'stroke-width': 1.5 }); hg.appendChild(dot);
    const me = {};
    const hide = () => { hg.setAttribute('display', 'none'); if (tip && (!tip.__brOwner || tip.__brOwner === me)) br_tipHide(tip); };
    const move = (ev) => {
      const q = br_svgPoint(svg, ev);
      if (q.x < b.x - 4 || q.x > b.x + b.w + 4 || q.y < b.y - 10 || q.y > b.y + b.h + 10) { hide(); return; }
      const raw = x0 + (q.x - b.x) / b.w * (x1 - x0);
      let k = 0; p.w.forEach((y, i) => { if (Math.abs(y - raw) < Math.abs(p.w[k] - raw)) k = i; });
      const xp = hp.xS(p.w[k]);
      hg.setAttribute('display', '');
      vl.setAttribute('x1', xp); vl.setAttribute('x2', xp);
      dot.setAttribute('cx', xp); dot.setAttribute('cy', hp.yS(p.tot[k]));
      if (!tip) return;
      tip.innerHTML = rel_ttHTML(p, k, o);
      tip.style.display = 'block'; tip.style.opacity = '1'; tip.__brOwner = me;
      br_tipPlace(tip, ev, 'line');
    };
    svg.__brPanels.push({ move, leave: hide });
  });
  svg.__brMove = (ev) => svg.__brPanels.forEach(q => q.move(ev));
  svg.__brLeave = () => { svg.__brPanels.forEach(q => q.leave()); rel_bandEmph(svg, null); };
  svg.addEventListener('mousemove', svg.__brMove); svg.addEventListener('mouseleave', svg.__brLeave);
  if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, svg.__brMove);
}
