// =============================================================
//  El Atlas · Religión — motor de los scatters del número
// =============================================================
// Port de 04-intolerancia/desarrollo.js (el motor de scatter aprobado) con el placement de etiquetas compartido de
// lib/scatter-render.js (s_layoutLabels / s_relaxLabels con edgeAware / s_leaderLine) y los controles del número
// (rel-motor.js: brSelector, brCsv, brRegister, rel_layout). Lo usan chart-dios-pib, chart-dios-religion,
// chart-pib-evangelicos y la vista "dos rutas" de chart-rutas: cada página es un adapter que declara datos, ejes,
// línea de referencia y textos; acá viven el dibujo y las interacciones.
//
// Contrato de interacción portado de desarrollo.js (más los criterios 11 y 13 del manual):
//   · América Latina = realce editorial (terracota, borde oscuro, más grande y etiquetada). NO es selección: se
//     desinfla apenas el lector elige países (03-futbol/scatter.js, 02-demasiado-desiguales/scatter.js) y el realce
//     pasa a los chips.
//   · Buscador + chips de la casa (brSelector: chip con el color de la región, ✕, Limpiar universal). En escritorio
//     el clic en un punto lo elige; en touch el tap muestra el tooltip (el buscador elige).
//   · Leyenda de regiones dentro del SVG (viaja al PNG): HOVER etiqueta los países de esa región (re-corre la
//     anticolisión solo sobre el grupo de etiquetas) y atenúa el resto; CLIC apaga la región y la saca de la línea,
//     que se recalcula (también el R² y las distancias del banner). "Ver todas las regiones" vuelve a prender todo.
//   · Etiquetas con halo, anticolisión 2D y líneas guía del borde del punto al borde de la caja (scatter-render).
//   · Tooltip oscuro de la casa (región con REGION_COLORS_ON_DARK); hit-area r≈30 para el dedo; tap afuera lo cierra.
//   · Estadísticos (n, R², distancia promedio a la línea) SOLO en el banner HTML, nunca en el SVG ni en el PNG.
//   · Vista compartible TODO-O-NADA: ?paises=ARG~BRA&ocultas=wEurope (códigos cortos de región de lib/regions.js).
//   · Todo lo interactivo, gateado por L.interactive; durante el export el hover se congela.
// En el SVG solo literales (nunca var()): el PNG se rasteriza por file://.

const RS_LATAM = 'Latin America';
const RS_SERIF = '"Source Serif 4", Georgia, serif';
const RS_C = {
  bg: '#FAF8F3', tick: '#7A6E62', axisTitle: '#4A4A4A', grid: '#ECE7D8', spine: '#DDD7C6',
  fit: '#9A9488', diag: '#E0DCC8', edgeHi: '#4A2A1A', edgeSel: '#3A3530', guide: '#B8AE9C', legendInk: '#4A4A4A'
};
// región → código corto (para la URL: los nombres largos llevan comas y &)
const RS_REG_CODE = (function () {
  const o = {};
  if (typeof REGION_CODE_TO_FULL !== 'undefined') Object.keys(REGION_CODE_TO_FULL).forEach(c => { o[REGION_CODE_TO_FULL[c]] = c; });
  return o;
})();

// Calibres. PNG: el canvas cuadrado se lee a ~⅓ en el celular (ticks 23, ejes 25, etiquetas 25, como el scatter
// publicado del N°4 y los PNG aprobados del N°7). Celular interactivo: viewBox alto con fuentes grandes. Escritorio:
// ~1:1 con la pantalla.
function rs_sizes(L) {
  if (L.fmt) return { tick: 23, axis: 25, label: 25, legend: 21, dot: 8, dotHi: 12, corner: 27, halo: 6, fitW: 2.6, dash: '10 7' };
  if (L.mobile) return { tick: 28, axis: 29, label: 28, legend: 24, dot: 9.5, dotHi: 13.5, corner: 30, halo: 6, fitW: 2.6, dash: '10 7' };
  return { tick: 13, axis: 13.5, label: 13, legend: 12.5, dot: 5, dotHi: 7.5, corner: 15, halo: 3, fitW: 1.6, dash: '5 4' };
}
function rs_t(k) { return (typeof t === 'function') ? t(k) : k; }
function rs_regName(r) { return rs_t('reg.' + r); }
function rs_signed(v, dec) { return (v >= 0 ? '+' : '−') + br_fmt(Math.abs(v), dec); }
// $2k, $2,5k, $128k (con el separador decimal del idioma)
function rs_fmtK(v) { const n = v / 1000; return '$' + br_fmt(n, Number.isInteger(n) ? 0 : 1) + 'k'; }
function rs_fmtUSD(v) { return '$' + br_fmt(v, 0); }

// ---------------------------------------------------------------- controlador
// cfg = {
//   id, pts() → [{ k, r, x, v, ...extra }],
//   xLog?, xDomain: [a, b], xTicks: [...], xFmt(v), yDomain, yTicks, yFmt(v), keys: { axisX, axisY, ... },
//   fit: 'otros' (ajuste entre los no latinoamericanos visibles) | 'todos' | null, fitSpan: 'domain' | 'data',
//   diag?: [a, b] (línea y = x), corners?: [{ key, pos: 'tl' | 'br' }], legend?: bool (leyenda de regiones),
//   tt(p, ctl) → html del tooltip, residDec?, selOf?() (selección efectiva; por defecto st.sel),
//   onPointClick?(k) (clic de escritorio en un punto; por defecto, toggle de la selección),
//   noSelector?: bool (sin buscador, chips ni ?paises=: todos los puntos siempre a la vista y etiquetados, como
//     pib-evangelicos con sus 17 países; el clic en un punto solo muestra el tooltip)
// }
function rs_ctl(cfg) {
  if (!state[cfg.id]) state[cfg.id] = { sel: [], hidden: [], hover: null };
  const st = state[cfg.id];
  return { cfg, st, model: null, n: 0, nAll: 0, lab: null, dots: [], urlWired: false, selector: null };
}
function rs_sel(ctl) { return ctl.cfg.selOf ? ctl.cfg.selOf() : (ctl.st.sel || []); }
function rs_regionOf(ctl, k) {
  if (!ctl._reg) { ctl._reg = {}; ctl.cfg.pts().forEach(p => { ctl._reg[p.k] = p.r; }); }
  return ctl._reg[k] || RS_LATAM;
}
function rs_universe(ctl) {
  return ctl.cfg.pts().map(p => ({ key: p.k, label: br_name(p.k), tag: ctl.cfg.legend ? rs_regName(p.r) : null }))
    .sort((a, b) => a.label.localeCompare(b.label, br_lang()));
}
function rs_hidden(ctl) { return new Set(ctl.st.hidden || []); }
function rs_hoverRegion(ctl) {
  const h = ctl.st.hover;
  return (h && !rs_hidden(ctl).has(h)) ? h : null;
}
// puntos visibles (sin las regiones apagadas)
function rs_visible(ctl) { const hid = rs_hidden(ctl); return ctl.cfg.pts().filter(p => !hid.has(p.r)); }
// Período del dato real de los puntos visibles (años de encuesta), no la etiqueta nominal de la ola.
function rs_period(ctl) {
  const ys = rs_visible(ctl).map(p => p.y).filter(Boolean);
  if (!ys.length) return '';
  const a = Math.min.apply(null, ys), b = Math.max.apply(null, ys);
  return a === b ? String(a) : a + '-' + b;
}

// ---------------------------------------------------------------- línea de referencia
// OLS de v sobre x (o ln x en escala log). 'otros': solo países que no son de América Latina (la línea es lo
// "esperable" fuera de la región); 'todos': todos los visibles. Mínimo 5 países: nunca una línea sobre dos puntos.
const RS_MIN_FIT = 5;
function rs_model(ctl, pts) {
  const cfg = ctl.cfg;
  if (!cfg.fit) return null;
  const base = cfg.fit === 'otros' ? pts.filter(p => p.r !== RS_LATAM) : pts;
  if (base.length < RS_MIN_FIT) return null;
  const tx = cfg.xLog ? (v) => Math.log(v) : (v) => v;
  let sx = 0, sy = 0;
  base.forEach(p => { sx += tx(p.x); sy += p.v; });
  const mx = sx / base.length, my = sy / base.length;
  let num = 0, den = 0, ssT = 0;
  base.forEach(p => { const dx = tx(p.x) - mx, dy = p.v - my; num += dx * dy; den += dx * dx; ssT += dy * dy; });
  const b = den ? num / den : 0, a = my - b * mx;
  let ssR = 0;
  base.forEach(p => { const e = p.v - (a + b * tx(p.x)); ssR += e * e; });
  const predict = (x) => a + b * tx(x);
  // distancia promedio a la línea por región (todas las regiones visibles, también América Latina)
  const acc = {};
  pts.forEach(p => { const e = p.v - predict(p.x); (acc[p.r] = acc[p.r] || { s: 0, n: 0 }).s += e; acc[p.r].n++; });
  const byRegion = {};
  Object.keys(acc).forEach(r => { byRegion[r] = { d: acc[r].s / acc[r].n, n: acc[r].n }; });
  return { a, b, r2: ssT ? 1 - ssR / ssT : 0, n: base.length, predict, byRegion, xMin: Math.min.apply(null, base.map(p => p.x)), xMax: Math.max.apply(null, base.map(p => p.x)) };
}

// ---------------------------------------------------------------- dibujo
function rs_legendLayout(items, fs, maxW) {
  const dotR = fs * 0.45, gapDot = dotR * 2 + fs * 0.5, gapItem = fs * 1.5;
  const its = items.map(it => Object.assign({}, it, { w: (it.line ? fs * 2.2 + fs * 0.5 : gapDot) + br_measure(it.label, fs, 400) + gapItem }));
  const rows = []; let cur = [], curW = 0;
  its.forEach(it => {
    if (curW + it.w > maxW && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(it); curW += it.w;
  });
  if (cur.length) rows.push(cur);
  return { rows, dotR, gapDot, gapItem, rowH: fs * 1.7 };
}

function rs_draw(ctl) {
  const cfg = ctl.cfg, st = ctl.st, id = cfg.id;
  const svg = document.getElementById('chart' + id);
  if (!svg) return;
  const L = rel_layout(id);
  if (!L.fmt) L.H = L.mobile ? (cfg.legend ? 1250 : 1080) : (cfg.legend ? 520 : 480);   // escritorio: entra sin scrollear (desarrollo.js usa 480)
  const S = rs_sizes(L), big = L.big;
  br_prepSvg(svg, L);
  br_clearHover(svg);           // la vista de composición (relStack) cuelga sus listeners del mismo <svg>
  svg.onclick = null;
  const wrap = svg.closest('.chart-svg-wrap');
  if (wrap) wrap.classList.remove('rel-multi');
  const W = L.W, H = L.H;
  const hid = rs_hidden(ctl);
  const all = cfg.pts();
  const pts = all.filter(p => !hid.has(p.r));
  const sel = rs_sel(ctl), selSet = new Set(sel);
  const hasSel = sel.length > 0;
  const model = rs_model(ctl, pts);
  ctl.model = model; ctl.n = pts.length; ctl.nAll = all.length; ctl.dots = []; ctl.lab = null;

  // leyenda: regiones presentes (las apagadas también, para poder prenderlas; en el PNG solo lo dibujado) y, si hay
  // línea "del resto del mundo", su muestra punteada al final
  const regions = cfg.legend ? (typeof REGION_ORDER !== 'undefined' ? REGION_ORDER : []).filter(r => all.some(p => p.r === r))
    .filter(r => !L.fmt || !hid.has(r)) : [];
  const legItems = regions.map(r => ({ region: r, label: rs_regName(r) }));
  if (cfg.legend && model && cfg.fit === 'otros') legItems.push({ line: true, label: rs_t('sc-fit-otros') });
  let legFs = S.legend;
  let leg = legItems.length ? rs_legendLayout(legItems, legFs, W - 40) : null;
  if (leg && leg.rows.length * leg.rowH > H * 0.24) { legFs = S.legend * 0.85; leg = rs_legendLayout(legItems, legFs, W - 40); }

  // márgenes: izquierda = título del eje Y + ticks; abajo = ticks + título del eje X + leyenda
  const yLabW = Math.max.apply(null, cfg.yTicks.map(v => br_measure(cfg.yFmt(v), S.tick, 400)));
  const yTitleX = (big ? 6 : 3) + S.axis * 0.62;   // la línea de base del título rotado; las letras suben hacia la izquierda
  const left = yTitleX + S.axis * 0.55 + (big ? 10 : 8) + yLabW + (big ? 10 : 8);
  const right = W - (big ? 16 : 12);
  const top = L.png ? 22 : (big ? 16 : 10);
  const xTickGap = big ? S.tick * 1.45 : 17;
  const legBlock = leg ? legFs * 1.9 + (leg.rows.length - 1) * leg.rowH + leg.rowH * 0.5 : 0;
  const bottomH = xTickGap + S.axis * 1.55 + (leg ? legBlock : S.axis * 0.5) + (big ? 6 : 4);
  const bottom = H - bottomH;
  const pw = right - left, ph = bottom - top;
  const tx = cfg.xLog ? (v) => Math.log(v) : (v) => v;
  const X0 = tx(cfg.xDomain[0]), X1 = tx(cfg.xDomain[1]);
  const xS = (v) => left + (tx(v) - X0) / (X1 - X0) * pw;
  const yS = (v) => bottom - (v - cfg.yDomain[0]) / (cfg.yDomain[1] - cfg.yDomain[0]) * ph;
  const plotBox = { x1: left + 1, x2: right - 1, y1: top + 1, y2: bottom - 1 };
  // las etiquetas pueden usar el margen derecho vacío (trampa del borde de la skill: si no, el clamp las devuelve
  // encima de su punto)
  const labBox = { x1: left + 1, x2: W - 3, y1: top + 1, y2: bottom - 1 };

  // clip del área de datos (líneas de referencia)
  const clipId = 'rs-clip-' + id;
  const defs = br_el('defs'); svg.appendChild(defs);
  const cp = br_el('clipPath', { id: clipId }); defs.appendChild(cp);
  cp.appendChild(br_el('rect', { x: left, y: top, width: pw, height: ph }));

  // grilla, ticks y ejes
  const gridG = br_el('g'); svg.appendChild(gridG);
  cfg.xTicks.forEach(v => {
    const x = xS(v);
    if (x < left - 0.5 || x > right + 0.5) return;
    gridG.appendChild(br_el('line', { x1: x, x2: x, y1: top, y2: bottom, stroke: RS_C.grid, 'stroke-width': 1 }));
    br_text(gridG, x, bottom + xTickGap, cfg.xFmt(v), { size: S.tick, anchor: 'middle', fill: RS_C.tick });
  });
  cfg.yTicks.forEach(v => {
    const y = yS(v);
    gridG.appendChild(br_el('line', { x1: left, x2: right, y1: y, y2: y, stroke: RS_C.grid, 'stroke-width': 1 }));
    br_text(gridG, left - (big ? 12 : 8), y, cfg.yFmt(v), { size: S.tick, anchor: 'end', base: 'central', fill: RS_C.tick });
  });
  gridG.appendChild(br_el('line', { x1: left, x2: left, y1: top, y2: bottom, stroke: RS_C.spine, 'stroke-width': 1 }));
  gridG.appendChild(br_el('line', { x1: left, x2: right, y1: bottom, y2: bottom, stroke: RS_C.spine, 'stroke-width': 1 }));
  const xTitleY = bottom + xTickGap + S.axis * 1.55;
  br_text(svg, left + pw / 2, xTitleY, rs_t(cfg.keys.axisX), { size: S.axis, anchor: 'middle', fill: RS_C.axisTitle, weight: 500 });
  const yt = br_text(svg, yTitleX, top + ph / 2, rs_t(cfg.keys.axisY), { size: S.axis, anchor: 'middle', fill: RS_C.axisTitle, weight: 500 });
  yt.setAttribute('transform', 'rotate(-90 ' + yTitleX + ' ' + (top + ph / 2) + ')');

  // rótulos de zona ("Ruta secular" arriba a la izquierda, "Ruta evangélica" abajo a la derecha)
  const cornerObs = [];
  (cfg.corners || []).forEach(c => {
    const txt = rs_t(c.key), pad = big ? 16 : 9;
    const tl = c.pos === 'tl';
    const x = tl ? left + pad : right - pad, y = tl ? top + pad + S.corner * 0.8 : bottom - pad;
    const el = br_text(svg, x, y, txt, { size: S.corner, anchor: tl ? 'start' : 'end', fill: RS_C.axisTitle, italic: true });
    el.setAttribute('font-family', RS_SERIF);
    // el rótulo es obstáculo para las etiquetas de país (círculos a lo largo de su caja)
    const w = br_measure(txt, S.corner, 400) * 0.95, x0 = tl ? x : x - w, cy = y - S.corner * 0.35;
    for (let xx = x0; xx <= x0 + w; xx += S.corner * 0.6) cornerObs.push({ x: xx, y: cy, r: S.corner * 0.55 });
  });

  // línea y = x (mismo cambio en los dos ejes)
  if (cfg.diag) {
    const d0 = cfg.diag[0], d1 = cfg.diag[1];
    svg.appendChild(br_el('line', { x1: xS(d0), y1: yS(d0), x2: xS(d1), y2: yS(d1), stroke: RS_C.diag, 'stroke-width': big ? 2.2 : 1.4,
                                    'stroke-dasharray': big ? '9 8' : '5 4', 'clip-path': 'url(#' + clipId + ')' }));
  }
  // línea de referencia (ajuste), solo si hay al menos RS_MIN_FIT países
  if (model) {
    let a, b;
    if (cfg.fitSpan === 'data') { const m = (X1 - X0) * 0.03; a = tx(model.xMin) - m; b = tx(model.xMax) + m; }
    else { a = X0; b = X1; }
    let dd = '';
    for (let i = 0; i <= 120; i++) {
      const u = a + (b - a) * i / 120, xv = cfg.xLog ? Math.exp(u) : u;
      dd += (i ? ' L ' : 'M ') + xS(xv).toFixed(1) + ' ' + yS(model.predict(xv)).toFixed(1);
    }
    svg.appendChild(br_el('path', { d: dd, fill: 'none', stroke: RS_C.fit, 'stroke-width': S.fitW, 'stroke-dasharray': S.dash,
                                    'stroke-linecap': 'round', 'clip-path': 'url(#' + clipId + ')' }));
  }

  // puntos: el resto abajo, América Latina encima, los elegidos arriba de todo
  const hiLatam = (p) => p.r === RS_LATAM && !hasSel;
  const isHi = (p) => selSet.has(p.k) || hiLatam(p);
  const ordered = pts.slice().sort((p, q) => {
    const sc = (z) => (z.r === RS_LATAM ? 1 : 0) + (isHi(z) ? 2 : 0) + (selSet.has(z.k) ? 4 : 0);
    return sc(p) - sc(q);
  });
  const tip = document.getElementById('tooltip' + id);
  const dotsG = br_el('g'); svg.appendChild(dotsG);
  const targets = [];
  ordered.forEach(p => {
    const cx = xS(p.x), cy = yS(p.v), hi = isHi(p);
    const r = hi ? S.dotHi : S.dot;
    const c = br_el('circle', { cx, cy, r, fill: (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[p.r]) || '#888',
      'fill-opacity': hi ? 1 : 0.75, stroke: hi ? (p.r === RS_LATAM ? RS_C.edgeHi : RS_C.edgeSel) : '#FFFFFF',
      'stroke-width': hi ? (big ? 2 : 1.3) : (big ? 1.2 : 0.8) });
    c.dataset.k = p.k; c.dataset.region = p.r;
    dotsG.appendChild(c);
    ctl.dots.push(c);
    targets.push({ p, cx, cy, r });
  });

  // etiquetas (grupo propio: el hover de la leyenda lo rehace sin redibujar el resto)
  const labG = br_el('g'); svg.appendChild(labG);
  ctl.lab = { g: labG, pts, S, big, xS, yS, plotBox: labBox, isHi, selSet, extraObs: cornerObs, frozen: !!window.__atlasPngFormatOverride };
  rs_renderLabels(ctl);

  // Hit-area: una capa transparente sobre el área de datos que resuelve el punto MÁS CERCANO al puntero, dentro de un
  // radio generoso (r≈30 en el celular: el punto mide pocos px reales y el dedo no le pega). Con un círculo
  // transparente por punto, en los clusters el de arriba se comía al vecino (apuntar a Japón mostraba Nueva Zelanda).
  // Va arriba de las etiquetas, que no reciben puntero.
  if (L.interactive) {
    const hit = br_el('rect', { x: left - 12, y: top - 12, width: pw + 24, height: ph + 24, fill: 'transparent' });
    const reach = big ? 30 : 14;
    const nearest = (ev) => {
      const q = br_svgPoint(svg, ev);
      let best = null, bd = Infinity;
      const foco = rs_hoverRegion(ctl);
      targets.forEach(tg => {
        if (foco && tg.p.r !== foco && !selSet.has(tg.p.k)) return;   // los atenuados por el hover de la leyenda no compiten
        const d = Math.hypot(q.x - tg.cx, q.y - tg.cy) - tg.r;
        if (d < bd) { bd = d; best = tg; }
      });
      return (best && bd <= Math.max(reach, best.r * 1.2)) ? best : null;
    };
    let cur = null;
    hit.addEventListener('mousemove', (e) => {
      const tg = nearest(e);
      hit.style.cursor = (tg && !cfg.noSelector) ? 'pointer' : 'default';
      if (!tg) { cur = null; rs_tipHide(tip); return; }
      if (tg !== cur) { cur = tg; rs_tipShow(tip, e, cfg.tt(tg.p, ctl)); } else rs_tipPos(tip, e);
    });
    hit.addEventListener('mouseleave', () => { cur = null; rs_tipHide(tip); });
    // clic = elegir (escritorio). En touch el tap es la única forma de leer el tooltip: ahí solo muestra.
    hit.addEventListener('click', (e) => {
      const tg = nearest(e);
      if (!tg) return;   // sigue hasta svg.onclick, que suelta tooltip y hover
      e.stopPropagation();
      // sin selector (noSelector) el clic tampoco elige: hace lo mismo que el tap
      if (cfg.noSelector || (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER)) { cur = tg; rs_tipShow(tip, e, cfg.tt(tg.p, ctl)); return; }
      rs_tipHide(tip); cur = null;
      if (cfg.onPointClick) cfg.onPointClick(tg.p.k); else rs_toggle(ctl, tg.p.k);
    });
    svg.appendChild(hit);
  }

  // leyenda de regiones, centrada debajo del título del eje X
  if (leg) rs_drawLegend(ctl, svg, leg, legFs, xTitleY + legFs * 1.9, W, L, hid);

  // tocar/clickear fuera de un punto suelta el tooltip y el hover (en touch el mouseleave no llega)
  if (L.interactive) svg.onclick = () => { rs_tipHide(tip); rs_setHover(ctl, null); };
  rs_focus(ctl);
}

// Etiquetas: forzadas (realce de América Latina sin selección, o los chips) + transitorias (países de la región
// apuntada en la leyenda, más livianas; entran si hay lugar). La anticolisión se corre desde cero sobre el conjunto.
function rs_renderLabels(ctl) {
  const c = ctl.lab;
  if (!c || !c.g) return;
  while (c.g.firstChild) c.g.removeChild(c.g.firstChild);
  const S = c.S, big = c.big;
  const hover = c.frozen ? null : rs_hoverRegion(ctl);
  const items = [];
  // softLabels (scatters de una sola región, pib-evangelicos y rutas): con chips, el resto conserva su nombre en gris
  // liviano si hay lugar. Ahí "desinflar" sacando todas las etiquetas dejaba 17 puntos mudos para mirar uno.
  const soft = !!ctl.cfg.softLabels && c.selSet.size > 0;
  c.pts.forEach(p => {
    const forced = c.isHi(p);
    const trans = !forced && ((!!hover && p.r === hover) || soft);
    if (!forced && !trans) return;
    const fs = forced ? S.label : S.label * 0.92, weight = forced ? 600 : 500;
    const text = br_name(p.k);
    items.push({ k: p.k, r: p.r, cx: c.xS(p.x), cy: c.yS(p.v), text, fs, weight, textW: br_measure(text, fs, weight),
                 forced, transient: trans, soft: trans && soft, subPriority: forced ? 0 : 2, rad: forced ? S.dotHi : S.dot });
  });
  if (!items.length) return;
  const box = c.plotBox;
  // todos los puntos visibles: los no etiquetados pesan poco en la elección inicial (mejor no taparlos si se puede)
  const dots = c.pts.map(p => ({ k: p.k, x: c.xS(p.x), y: c.yS(p.v), r: c.isHi(p) ? S.dotHi : S.dot, lab: items.some(it => it.k === p.k) }));
  const placed = rs_greedy(items, box, dots, big);
  // obstáculos: SOLO los puntos etiquetados (criterio del N°1) y los rótulos de zona
  const obstacles = items.map(it => ({ x: it.cx, y: it.cy, r: it.rad + 2 })).concat(c.extraObs || []);
  // el alto que ve la relajación incluye el halo (si no, el halo crema borra letras del vecino: "ArgeBrasil")
  s_relaxLabels(placed, S.label + (big ? 5 : 3), box, big ? 220 : 80, obstacles, { edgeAware: true });
  placed.forEach(l => {
    // con una región apuntada en la leyenda, las etiquetas del realce de otras regiones se atenúan como sus puntos
    // (las de los chips no: son la selección del lector)
    const op = (hover && l.r !== hover && !c.selSet.has(l.k)) ? 0.3 : 1;
    const g = s_leaderLine(l, { x: l.cx, y: l.cy, r: l.rad }, l.fs, big ? 10 : 7);
    if (g) {
      c.g.appendChild(br_el('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, stroke: RS_C.guide,
        'stroke-width': big ? 1.3 : 0.8, 'stroke-opacity': (l.transient ? 0.55 : 1) * op }));
    }
    const tx = br_text(c.g, l.lx, l.ly, l.text, { size: l.fs, weight: l.weight, anchor: l.anchor,
      fill: l.soft ? RS_C.tick : ((typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[l.r]) || '#444'), halo: S.halo });
    tx.removeAttribute('font-variant-numeric');
    tx.style.pointerEvents = 'none';
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    if (op < 1) tx.setAttribute('opacity', op);
  });
}

// Colocación inicial (antes de s_relaxLabels). El greedy de s_layoutLabels prueba posiciones fijas de 11 px y solo
// esquiva otras etiquetas: en los clusters de América Latina dejaba "Venezuela" pegada al punto de Nicaragua. Acá cada
// etiqueta prueba ocho lugares alrededor de su punto (derecha, izquierda, arriba, abajo y diagonales; después, un
// anillo más lejos que la relajación reconecta con línea guía) y se queda con el que menos pisa: otras etiquetas
// (mucho), puntos etiquetados (bastante), puntos sin etiqueta (poco) y el borde del gráfico (mucho). Los más
// apretados se ubican primero. Una etiqueta transitoria (hover de leyenda) que no encuentra lugar libre se descarta;
// una forzada nunca.
function rs_greedy(items, box, dots, big) {
  const H = big ? 4 : 2;   // colchón del halo
  const rectOf = (it, anchor, lx, ly) => {
    const w = it.textW, x1 = anchor === 'start' ? lx : anchor === 'end' ? lx - w : lx - w / 2;
    return { x1: x1 - H, x2: x1 + w + H, y1: ly - it.fs * 0.78 - H, y2: ly + it.fs * 0.22 + H };
  };
  const ov = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const dotHit = (rc, d) => {
    const nx = Math.max(rc.x1, Math.min(d.x, rc.x2)), ny = Math.max(rc.y1, Math.min(d.y, rc.y2));
    return Math.max(0, d.r + 2 - Math.hypot(nx - d.x, ny - d.y));
  };
  const rad = big ? 140 : 70;
  const crowd = (it) => items.filter(o => o !== it && Math.hypot(o.cx - it.cx, o.cy - it.cy) < rad).length;
  const order = items.slice().sort((a, b) => (b.forced - a.forced) || (crowd(b) - crowd(a)) || (b.cx - a.cx));
  const rects = [], out = [];
  order.forEach(it => {
    const fs = it.fs, r = it.rad, g = big ? 5 : 3;
    const cands = [];
    [1, 2.2].forEach((m, ring) => {
      const d = r + g * m + (ring ? fs * 0.9 : 0), dg = d * 0.75;
      cands.push(['start', it.cx + d, it.cy + fs * 0.32], ['end', it.cx - d, it.cy + fs * 0.32],
                 ['middle', it.cx, it.cy - d - fs * 0.22], ['middle', it.cx, it.cy + d + fs * 0.78],
                 ['start', it.cx + dg, it.cy - dg - fs * 0.05], ['start', it.cx + dg, it.cy + dg + fs * 0.7],
                 ['end', it.cx - dg, it.cy - dg - fs * 0.05], ['end', it.cx - dg, it.cy + dg + fs * 0.7]);
    });
    let best = null, bestS = Infinity, bestLab = Infinity;
    const dRect = (rc, x, y) => Math.hypot(x - Math.max(rc.x1, Math.min(x, rc.x2)), y - Math.max(rc.y1, Math.min(y, rc.y2)));
    cands.forEach((cd, i) => {
      const rc = rectOf(it, cd[0], cd[1], cd[2]);
      let sLab = 0, s = i * 0.5 + (i >= 8 ? 40 : 0);
      rects.forEach(q => { sLab += ov(rc, q); });
      dots.forEach(dd => { if (dd.k !== it.k) s += dotHit(rc, dd) * (dd.lab ? 60 : 6); });
      // la etiqueta no puede quedar más cerca de OTRO punto etiquetado que del suyo: se leería como el nombre del vecino
      // ("Uruguay" junto al punto de Chile). Mejor encima de puntos grises, que el halo deja leer.
      const own = dRect(rc, it.cx, it.cy) - r;
      dots.forEach(dd => { if (dd.lab && dd.k !== it.k) { const o = dRect(rc, dd.x, dd.y) - dd.r; if (o < own + 12) s += 400 + (own + 12 - o) * 10; } });
      const out = Math.max(0, box.x1 - rc.x1) + Math.max(0, rc.x2 - box.x2) + Math.max(0, box.y1 - rc.y1) + Math.max(0, rc.y2 - box.y2);
      s += sLab * 4 + out * 60;
      if (s < bestS) { bestS = s; best = cd; bestLab = sLab; }
    });
    if (!it.forced && bestLab > 0) return;
    rects.push(rectOf(it, best[0], best[1], best[2]));
    out.push(Object.assign({}, it, { anchor: best[0], lx: best[1], ly: best[2] }));
  });
  return out;
}

// Leyenda de regiones dentro del SVG (png-export del N°7 no dibuja leyenda propia). HOVER revela las etiquetas de la
// región; CLIC la apaga o la prende (cambia la línea → redibuja). Apagada = punto hueco, tachada y atenuada.
function rs_drawLegend(ctl, svg, leg, fs, y0, W, L, hid) {
  const g = br_el('g'); svg.appendChild(g);
  leg.rows.forEach((row, ri) => {
    const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
    let x = Math.max(4, (W - rowW) / 2);
    const y = y0 + ri * leg.rowH;
    row.forEach(it => {
      const item = br_el('g'); g.appendChild(item);
      if (it.line) {
        const lw = fs * 2.2;
        item.appendChild(br_el('line', { x1: x, x2: x + lw, y1: y, y2: y, stroke: RS_C.fit, 'stroke-width': L.big ? 2.6 : 1.6,
                                         'stroke-dasharray': L.big ? '8 5' : '5 3', 'stroke-linecap': 'round' }));
        br_text(item, x + lw + fs * 0.5, y, it.label, { size: fs, fill: RS_C.legendInk, base: 'central' });
        x += it.w;
        return;
      }
      const off = hid.has(it.region);
      item.dataset.legendRegion = it.region;
      if (off) item.dataset.legendOff = '1';
      const col = REGION_COLORS[it.region] || '#888';
      const dot = br_el('circle', { cx: x + leg.dotR, cy: y, r: leg.dotR, fill: off ? 'none' : col });
      if (off) { dot.setAttribute('stroke', col); dot.setAttribute('stroke-width', Math.max(1, fs * 0.11)); }
      item.appendChild(dot);
      br_text(item, x + leg.gapDot, y, it.label, { size: fs, fill: RS_C.legendInk, base: 'central' });
      // tachado dibujado a mano: el rasterizado no garantiza text-decoration
      if (off) item.appendChild(br_el('line', { x1: x + leg.gapDot - 1, x2: x + leg.gapDot + br_measure(it.label, fs, 400) + 1, y1: y, y2: y,
                                                stroke: RS_C.legendInk, 'stroke-width': Math.max(1, fs * 0.09) }));
      if (L.interactive) {
        item.style.cursor = 'pointer';
        item.appendChild(br_el('rect', { x: x - 2, y: y - leg.rowH / 2, width: it.w, height: leg.rowH, fill: 'transparent' }));
        item.addEventListener('mouseenter', () => rs_setHover(ctl, it.region));
        item.addEventListener('mouseleave', () => rs_setHover(ctl, null));
        item.addEventListener('click', (ev) => { ev.stopPropagation(); rs_toggleRegion(ctl, it.region); });
      }
      x += it.w;
    });
  });
}

// Hover de región (idempotente): rehace solo las etiquetas y aplica el foco por opacidad.
function rs_setHover(ctl, reg) {
  if (reg && rs_hidden(ctl).has(reg)) reg = null;
  if ((ctl.st.hover || null) === (reg || null)) return;
  ctl.st.hover = reg || null;
  rs_renderLabels(ctl);
  rs_focus(ctl);
}
function rs_focus(ctl) {
  const focus = (ctl.lab && ctl.lab.frozen) ? null : rs_hoverRegion(ctl);
  ctl.dots.forEach(c => c.setAttribute('opacity', (!focus || c.dataset.region === focus) ? 1 : 0.16));
  const svg = document.getElementById('chart' + ctl.cfg.id);
  if (svg) svg.querySelectorAll('[data-legend-region]').forEach(el => {
    if (el.dataset.legendOff) { el.setAttribute('opacity', 0.34); return; }
    el.setAttribute('opacity', (!focus || el.dataset.legendRegion === focus) ? 1 : 0.38);
  });
  rs_banner(ctl);
}
function rs_toggleRegion(ctl, reg) {
  const arr = ctl.st.hidden || (ctl.st.hidden = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  ctl.st.hover = null;   // en touch el mouseleave no llega: soltar el hover en cada clic
  ctl.draw();
}
function rs_toggle(ctl, k) {
  const arr = ctl.st.sel.slice(), i = arr.indexOf(k);
  if (i >= 0) arr.splice(i, 1); else arr.push(k);
  ctl.st.sel = arr;
  if (ctl.selector) ctl.selector.render();
  ctl.draw();
}

// ---------------------------------------------------------------- banner (HTML, debajo del SVG; nunca en el PNG)
// Países · R² de la línea · distancia promedio de la región enfocada (hover de leyenda > América Latina).
function rs_banner(ctl) {
  const el = document.getElementById(ctl.cfg.id + '-banner');
  if (!el) return;
  const m = ctl.model;
  const item = (k, v) => '<span class="s-banner-item"><span class="s-banner-key">' + k + '</span><span class="s-banner-val">' + v + '</span></span>';
  const sep = '<span class="s-banner-sep">·</span>';
  let h = item(rs_t('sc-banner-n'), br_fmt(ctl.n, 0));
  if (!m) { el.innerHTML = h + sep + '<span class="s-banner-item"><span class="s-banner-note">' + rs_t('sc-fewfit') + '</span></span>'; return; }
  h += sep + item(rs_t('sc-banner-r2'), br_fmt(m.r2, 2));
  if (ctl.cfg.fit === 'otros') {
    const hid = rs_hidden(ctl);
    let focus = rs_hoverRegion(ctl);
    if (!focus) focus = !hid.has(RS_LATAM) ? RS_LATAM : (REGION_ORDER.find(r => !hid.has(r) && m.byRegion[r]) || RS_LATAM);
    const rr = m.byRegion[focus];
    const col = (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[focus]) || '#444';
    h += sep + '<span class="s-banner-item"><span class="s-banner-key">' + rs_t('sc-banner-resid') + '</span>'
      + '<span class="s-banner-region-name" style="color:' + col + '">' + rs_regName(focus) + '</span>'
      + (rr ? '<span class="s-banner-val">' + rs_signed(rr.d, ctl.cfg.residDec == null ? 1 : ctl.cfg.residDec) + ' ' + rs_t('sc-pts') + '</span>'
            : '<span class="s-banner-note">' + rs_t('sc-banner-none') + '</span>') + '</span>';
  }
  el.innerHTML = h;
}
function rs_syncShowAll(ctl) {
  const btn = document.getElementById(ctl.cfg.id + '-show-all');
  if (!btn) return;
  btn.hidden = !(ctl.st.hidden || []).length;
  btn.style.display = btn.hidden ? 'none' : '';
}

// ---------------------------------------------------------------- tooltip (oscuro de la casa)
function rs_tipShow(tip, e, html) {
  if (!tip) return;
  tip.innerHTML = html; tip.style.display = 'block'; tip.style.opacity = '1';
  rs_tipPos(tip, e);
}
function rs_tipPos(tip, e) {
  if (!tip || !tip.parentElement) return;
  const wrap = tip.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tip.offsetHeight - 8;
  if (px + tip.offsetWidth > wrap.width) px = x - tip.offsetWidth - 14;
  if (px < 0) px = 0;
  if (py < 0) py = y + 18;
  tip.style.left = px + 'px'; tip.style.top = py + 'px';
}
function rs_tipHide(tip) { if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; } }
// Encabezado + filas en el formato de la casa. rows = [[etiqueta, valor, sub?]]
function rs_ttHTML(ctl, p, rows, notes) {
  const on = (typeof REGION_COLORS_ON_DARK !== 'undefined' && REGION_COLORS_ON_DARK[p.r]) || '#C9C2B2';
  let h = '<strong>' + br_name(p.k) + '</strong>';
  if (ctl.cfg.legend) h += '<div class="tt-region" style="color:' + on + '">' + rs_regName(p.r) + '</div>';
  rows.forEach(r => { h += '<div class="tt-row' + (r[2] ? ' tt-row-sub' : '') + '"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
  (notes || []).filter(Boolean).forEach(n => { h += '<div class="tt-sub">' + n + '</div>'; });
  return h;
}
// Filas "esperable" y "diferencia" del tooltip (solo si hay línea).
function rs_ttFit(ctl, p, fmtV) {
  const m = ctl.model;
  if (!m) return { rows: [], note: null };
  const e = m.predict(p.x), d = p.v - e;
  return { rows: [[rs_t('sc-tt-expected'), fmtV(e)], [rs_t('sc-tt-diff'), rs_signed(d, ctl.cfg.residDec == null ? 1 : ctl.cfg.residDec)]],
           note: rs_t(d >= 0 ? 'sc-tt-above' : 'sc-tt-below') };
}

// ---------------------------------------------------------------- página estándar (dios-pib, dios-religion, pib-evangelicos)
// cfg además: keys: { title, titleNeutral, sub (con {P} opcional), pngSource }, focusAll?, csv() → spec de brCsv.
function rs_isDefault(ctl) { return !(ctl.st.sel || []).length && !(ctl.st.hidden || []).length; }
function rs_pageDraw(ctl) {
  const cfg = ctl.cfg, st = ctl.st;
  // textos primero: el hueco del PNG (rel_layout) se mide con el título y el subtítulo que van a salir
  atlasSetHeading(cfg.id, rs_isDefault(ctl), { title: cfg.keys.title, titleNeutral: cfg.keys.titleNeutral });
  brSetSubtitle(cfg.id, rs_t(cfg.keys.sub).replace('{P}', rs_period(ctl)));
  rs_draw(ctl);
  rs_syncShowAll(ctl);
  if (ctl.urlWired) {
    // sin selector, paises viaja siempre vacío: así un ?paises= viejo que llegue en el link se borra de la barra
    atlasSyncUrlTodoONada({ paises: cfg.noSelector ? '' : brList(st.sel), ocultas: brList((st.hidden || []).map(r => RS_REG_CODE[r] || r)) },
                          { paises: '', ocultas: '' });
  }
}
// Estado entrante de la URL: se valida contra el universo real (países con dato, regiones presentes) y se aplica
// por los mismos caminos que los controles. Nunca se aceptan todas las regiones apagadas.
function rs_applyUrl(ctl) {
  const st = ctl.st, pts = ctl.cfg.pts();
  const keys = new Set(pts.map(p => p.k));
  const v = ctl.cfg.noSelector ? null : atlasUrlParam('paises');
  if (v != null) {
    const ks = brParseList(v, (k) => keys.has(k.toUpperCase()));
    if (ks) st.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  const h = atlasUrlParam('ocultas');
  if (h != null && ctl.cfg.legend && typeof REGION_CODE_TO_FULL !== 'undefined') {
    const present = new Set(pts.map(p => p.r));
    const regs = (brParseList(h) || []).map(c => REGION_CODE_TO_FULL[c]).filter(r => r && present.has(r))
      .filter((r, i, a) => a.indexOf(r) === i);
    if (regs.length < present.size) st.hidden = regs;
  }
  ctl.urlWired = true;
  if (ctl.selector) ctl.selector.render();
  ctl.draw();
}
// Cableado común: tooltip y hover se sueltan al tocar afuera; el PNG sale sin hover.
function rs_wireGlobal(ctl) {
  const id = ctl.cfg.id;
  document.addEventListener('click', (ev) => {
    const svg = document.getElementById('chart' + id);
    if (svg && !svg.contains(ev.target)) { rs_tipHide(document.getElementById('tooltip' + id)); rs_setHover(ctl, null); }
  });
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== String(id)) return;
    rs_tipHide(document.getElementById('tooltip' + id));
    ctl.st.hover = null;
  };
  const btn = document.getElementById(id + '-show-all');
  if (btn) btn.addEventListener('click', () => { ctl.st.hidden = []; ctl.st.hover = null; ctl.draw(); });
}
function relScatterPage(cfg) {
  const ctl = rs_ctl(cfg);
  ctl.draw = () => rs_pageDraw(ctl);
  ctl.selector = cfg.noSelector ? null : brSelector({
    pre: cfg.id, get: () => ctl.st.sel, set: (a) => { ctl.st.sel = a; }, onChange: ctl.draw, focusAll: !!cfg.focusAll,
    placeholderKey: 'sc-search-ph', universe: () => rs_universe(ctl), label: br_name,
    color: (k) => REGION_COLORS[rs_regionOf(ctl, k)] || '#888'
  });
  brRegister(cfg.id, ctl.draw, () => rs_t(cfg.keys.pngSource));
  if (cfg.csv) brCsv('button.download[data-chart="' + cfg.id + '-csv"]', cfg.csv);
  rs_wireGlobal(ctl);
  rs_applyUrl(ctl);
  ctl.onLang = () => { if (ctl.selector) ctl.selector.render(); ctl.draw(); };
  return ctl;
}
// Nombre del país en los dos idiomas (CSV): CN-first, como br_name.
function rs_nameIn(k, L) { return (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? (COUNTRY_NAMES[k][L] || COUNTRY_NAMES[k].en || k) : k; }
function rs_regIn(r, L) { return (I18N[L] && I18N[L]['reg.' + r]) || r; }
