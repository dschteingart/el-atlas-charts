// =============================================================
//  El Atlas N°5 — Chart 5: figuras célebres por millón vs PIB pc
// =============================================================
// MOTOR: clon del chart-desarrollo del N°4 (desarrollo.js), el scatter
// aprobado de la casa — chips WYSIWYG (el chip ES la etiqueta), leyenda
// adentro del SVG con hover-que-revela y click-que-apaga (la región sale del
// modelo), banner HTML con n/R²/residuo + hint, título dinámico con hallazgo
// sólo en el estado default, layouts por formato de export. Lo único que
// cambia es la CAPA DE DATOS: el cubo EXPLORA (iso×ocupación×año de
// nacimiento) de este número, con el modelo log-log de explora.js.
//
// Config (pedido de Daniel, punto 5 de la lista 2026-09-09):
//   - UNA sola medida: figuras célebres por millón (fuera Fama/Fama²/top-X%).
//   - Población mínima default: 1 millón.
//   - Título default (hallazgo): «La cantidad de famosos per cápita aumenta
//     con el desarrollo»; neutral al tocar cualquier control.
//   - Subtítulo: «Figuras célebres por millón vs PIB per cápita, nacidas
//     entre X y Y.» (rubro en genitivo si hay filtro).
//   - Slider de período UNIVERSAL de la casa (doble range + cajitas,
//     cajita vacía = extremo). Acá el rango es 1850–2010 (necesita PIB),
//     así que el track es lineal — las anclas por tramos son para charts
//     que arrancan en la Antigüedad.
//   - Escala LOG/LINEAL en AMBOS ejes (default log-log). EL MODELO SIEMPRE
//     SE ESTIMA EN LOG-LOG (ln fig/millón ~ ln PIB pc, corrección +0,5 para
//     los ceros): el toggle cambia el EJE, no el modelo — la misma norma del
//     N°2 y del N°4.
//   - PNG con el MISMO título/subtítulo/caption que el HTML.
//
// Depende de: EXPLORA (data-explora.js), REGION_ORDER/REGION_COLORS/
// REGION_LABEL_COLORS (lib/regions.js), COUNTRY_NAMES (country-names.js),
// s_layoutLabels/s_relaxLabels/s_leaderLine (lib/scatter-render.js), y los
// utils del número (fmt, niceLinearTicks, niceLog10Ticks, fmtTickGDP,
// getActivePngFormat, applyFormatWrapper, isMobileViewport, state).

// =================== Constantes ===================
const TP_NS = 'http://www.w3.org/2000/svg';
const tp_ns = (tag) => document.createElementNS(TP_NS, tag);
const TPX = (es, en) => (tp_lang() === 'en' ? en : es);

// América Latina completa nace etiquetada (regla de la casa, fijada en el
// chart-desarrollo del N°4: la región protagonista son chips normales, se
// sacan de a uno con la cruz).
// Seleccion editorial de Daniel (2026-09-13): latam grandes + referencias de
// todos los niveles de ingreso + los outliers que cuenta la nota (Croacia,
// Noruega, Camerun, China, India).
const TP_DEFAULT_SEL = ['ARG', 'BRA', 'URY', 'CUB', 'PER', 'CHL', 'MEX', 'COL',
  'HRV', 'NOR', 'USA', 'DEU', 'GBR', 'FRA', 'ESP', 'ITA', 'JPN', 'CHN', 'IND', 'RUS', 'CMR'];
const TP_DEFAULT_POP = 1;      // millones (pedido 5c)
const TP_DEF_Y0 = 1900;        // periodo por default: post-1900 (Daniel 2026-09-13)
const TP_ANCHORS = {
  USA: 1, DEU: 1, FRA: 1, GBR: 1, ESP: 1, ITA: 1, RUS: 1,
  CHN: 1, JPN: 1, KOR: 1, IND: 1, BRA: 1, MEX: 1, ARG: 1, ZAF: 1, NGA: 1
};
const TP_LATAM = 'Latin America';
const TP_MIN_FIT = 5;          // mínimo de países visibles para estimar

const TP_AXIS_INK = '#7A6E62';
const TP_AXIS_TITLE_INK = '#5A5346';
const TP_GRID = '#ECE7D8';
const TP_BG = '#FAF8F3';
const TP_FONT = '"Source Sans 3", system-ui, sans-serif';

let tp_dots = [];
let tp_labelCtx = null;
let tp_lastModel = null;
let tp_lastN = 0;
let tp_lastAll = 0;

// =================== Helpers ===================
function tp_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function tp_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function tp_t(k) { return (typeof t === 'function') ? t(k) : k; }
function tp_name(iso) {
  const lang = tp_lang();
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  const m = EXPLORA.isoMeta.find(x => x.iso === iso);
  return m ? m[lang === 'en' ? 'en' : 'es'] : iso;
}
function tp_regionColor(reg) { return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888'; }
function tp_regionLabelColor(reg) { return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#444'; }
function tp_regionLabel(reg) { return reg ? tp_t('reg.' + reg) : '—'; }
function tp_measure(text, fs, weight) {
  if (!tp_measure._c) tp_measure._c = document.createElement('canvas').getContext('2d');
  tp_measure._c.font = `${weight || 500} ${fs}px ${TP_FONT}`;
  return tp_measure._c.measureText(text).width;
}
function tp_num(n, dec) { return (typeof fmt === 'function') ? fmt(n, dec) : String(n); }
// Tasa por millón: 2 decimales por debajo de 1, 1 entre 1 y 10, entero arriba.
function tp_rate(v) {
  if (v == null) return '—';
  if (v === 0) return '0';
  const dec = v < 1 ? 2 : (v < 10 ? 1 : 0);
  return tp_num(v, dec);
}
function tp_signedPct(v) {
  return (v >= 0 ? '+' : '−') + tp_num(Math.abs(v), 0) + '%';
}
function tp_editorCustom(field) {
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  if (!ae || !ae.texts) return '';
  const tx = ae.texts[(ae.lang || tp_lang())] || {};
  return (tx[field] || '').trim();
}

// ---- regiones apagadas desde la leyenda (misma norma del N°4) ----
function tp_hidden() { return new Set(state[5].hiddenRegions || []); }
function tp_hoverRegion() {
  const s = state[5];
  if (!s || !s.hoverRegion) return null;
  return tp_hidden().has(s.hoverRegion) ? null : s.hoverRegion;
}
function tp_toggleRegion(reg) {
  const arr = state[5].hiddenRegions || (state[5].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  state[5].hoverRegion = null;
  drawTalento();
}
function tp_showAllRegions() {
  state[5].hiddenRegions = [];
  state[5].hoverRegion = null;
  drawTalento();
}
function tp_syncShowAll() {
  const btn = document.getElementById('tp-show-all');
  if (!btn) return;
  if ((state[5].hiddenRegions || []).length) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}

// =================== Capa de datos (cubo EXPLORA) ===================
function tp_decodeF() {
  const F = EXPLORA.F; if (F.iso) return;
  const bin = atob(F.b64), n = F.n;
  const iso = new Uint8Array(n), occ = new Uint8Array(n), yr = new Uint8Array(n), hpi = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const o = i * 4; iso[i] = bin.charCodeAt(o); occ[i] = bin.charCodeAt(o + 1); yr[i] = bin.charCodeAt(o + 2); hpi[i] = bin.charCodeAt(o + 3); }
  F.iso = iso; F.occ = occ; F.yr = yr; F.hpi = hpi;
}
function tp_occSet(s) {
  const E = EXPLORA;
  if (s.rubroType === 'all') return null;
  if (s.rubroType === 'sub') return new Set([E.subrubros[s.rubroIdx].idx]);
  return new Set(E.domains[s.rubroIdx].occ);
}
function tp_rubroLabel(s) {
  const E = EXPLORA, en = tp_lang() === 'en';
  if (s.rubroType === 'all') return TPX('Todos los rubros', 'All fields');
  if (s.rubroType === 'sub') return E.subrubros[s.rubroIdx][en ? 'en' : 'es'];
  return E.domains[s.rubroIdx][en ? 'en' : 'es'];
}

// Puntos del scatter: un país = {code, region, gdp_pc (promedio del período),
// popM (población promedio, millones), count, val (figuras por millón), figura
// destacada}. UNIVERSO COMPLETO: los países con 0 figuras entran (franja "0"
// del eje log). El puesto global de la figura destacada sale del orden por HPI
// desc del cubo.
function tp_points() {
  tp_decodeF();
  const s = state[5], E = EXPLORA, F = E.F, N = F.iso.length, Y0 = E.y0;
  const y0 = s.y0, y1 = s.y1, occSet = tp_occSet(s);
  const acc = {}; let nf = 0;
  for (let i = 0; i < N; i++) {
    if (occSet && !occSet.has(F.occ[i])) continue;
    const yr = F.yr[i] + Y0;
    if (yr < y0 || yr > y1) continue;
    nf++;
    const k = F.iso[i]; let a = acc[k]; if (!a) a = acc[k] = { count: 0, maxHpi: -1, maxIdx: -1, maxRank: 0 };
    if (a.maxHpi < 0) a.maxRank = nf;
    a.count++;
    if (F.hpi[i] > a.maxHpi) { a.maxHpi = F.hpi[i]; a.maxIdx = i; }
  }
  const out = [];
  for (let idx = 0; idx < E.isoMeta.length; idx++) {
    const m = E.isoMeta[idx], parr = E.pop[idx], garr = E.gdp[idx];
    if (!parr || !garr) continue;
    let sp = 0, sg = 0; const ny = y1 - y0 + 1;
    for (let y = y0; y <= y1; y++) { sp += parr[y - Y0]; sg += garr[y - Y0]; }
    const popM = (sp / ny) / 1000;
    if (popM < (s.minPopM || 0)) continue;
    const a = acc[idx] || { count: 0, maxIdx: -1, maxHpi: -1, maxRank: 0 };
    out.push({
      code: m.iso, region: m.reg, gdp_pc: sg / ny, popM,
      count: a.count, val: a.count / popM,
      topName: (a.maxIdx >= 0 ? (F.name[a.maxIdx] || null) : null),
      topHpi: (a.maxHpi >= 0 ? a.maxHpi : null),
      topRank: (a.maxIdx >= 0 ? a.maxRank : null)
    });
  }
  return out;
}

// =================== Modelo (log-log, clon de explora.js) ===================
function tp_ols(points) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += points[i].x; sy += points[i].y; }
  const mx = sx / n, my = sy / n;
  let num = 0, den = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - mx, dy = points[i].y - my;
    num += dx * dy; den += dx * dx; ssTot += dy * dy;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yp = a + b * points[i].x;
    ssRes += (points[i].y - yp) * (points[i].y - yp);
  }
  return { a, b, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot };
}

// El modelo SIEMPRE es ln(fig por millón, con +0,5 de continuidad para los
// ceros) sobre ln(PIB pc). El residuo regional es la media GEOMÉTRICA de
// observado/esperado (promedio en escala log: simétrico, no lo infla un
// outlier), expresada en %.
function tp_buildModel(pts) {
  if (pts.length < TP_MIN_FIT) return null;
  const reg = tp_ols(pts.map(p => ({ x: Math.log(p.gdp_pc), y: Math.log((p.count + 0.5) / p.popM) })));
  if (!reg) return null;
  const predict = (gdp) => Math.exp(reg.a + reg.b * Math.log(gdp));
  const byReg = {};
  let totalFigs = 0;
  pts.forEach(p => {
    totalFigs += p.count;
    const pred = predict(p.gdp_pc); if (!(pred > 0)) return;
    p.pred = pred;
    p.ratio = ((p.count + 0.5) / p.popM) / pred;
    const r = byReg[p.region] || (byReg[p.region] = { s: 0, n: 0 });
    r.s += Math.log(p.ratio); r.n++;
  });
  const byRegion = {};
  for (const rg in byReg) {
    if (!Object.prototype.hasOwnProperty.call(byReg, rg)) continue;
    byRegion[rg] = { pct: (Math.exp(byReg[rg].s / byReg[rg].n) - 1) * 100, n: byReg[rg].n };
  }
  return { a: reg.a, b: reg.b, r2: reg.r2, n: pts.length, totalFigs, predict, byRegion };
}

// =================== Escalas ===================
function tp_makeScales(pts, MARGIN, plotW, plotH) {
  const s = state[5];
  // Dominio X DINAMICO por render (con padding): un dominio fijo sobre todo
  // el dataset dejaba medio eje vacio al promediar periodos largos (los
  // promedios nunca llegan al maximo puntual) - pedido de Daniel 2026-09-10.
  let gLo = Infinity, gHi = 0;
  pts.forEach(p => { if (p.gdp_pc > 0) { if (p.gdp_pc < gLo) gLo = p.gdp_pc; if (p.gdp_pc > gHi) gHi = p.gdp_pc; } });
  if (!isFinite(gLo)) { gLo = 700; gHi = 50000; }
  const xd = { lo: gLo * 0.85, hi: gHi * 1.12 };
  const xLog = s.scaleX === 'log';
  const x0 = xLog ? Math.log10(xd.lo) : 0;
  const x1 = xLog ? Math.log10(xd.hi) : xd.hi * 1.02;
  const xScale = (gdp) => MARGIN.left + (((xLog ? Math.log10(gdp) : gdp) - x0) / (x1 - x0)) * plotW;

  const yLog = s.scaleY === 'log';
  let yMinRaw = Infinity, yMaxRaw = 0, hasZero = false;
  pts.forEach(p => {
    if (p.val > 0) { if (p.val < yMinRaw) yMinRaw = p.val; if (p.val > yMaxRaw) yMaxRaw = p.val; }
    else hasZero = true;
  });
  if (!isFinite(yMinRaw)) { yMinRaw = 0.1; yMaxRaw = 100; }
  if (yLog) {
    // Franja "0" abajo: el log no puede mostrar 0, así que los países sin
    // figuras viven en una banda propia bajo el área log (patrón de explora).
    const lo = Math.max(0.001, yMinRaw * 0.7), hi = yMaxRaw * 1.5;
    const yd = [Math.log10(lo), Math.log10(hi)];
    const logFrac = hasZero ? 0.88 : 1;
    const yTop = MARGIN.top, yLogBot = MARGIN.top + plotH * logFrac;
    const yZero = MARGIN.top + plotH * 0.97;
    const yScale = (v) => (v > 0)
      ? yLogBot - ((Math.log10(v) - yd[0]) / (yd[1] - yd[0])) * (yLogBot - yTop)
      : yZero;
    return { xScale, yScale, xLo: xd.lo, xHi: xd.hi, yLog: true, hasZero, yZero, yLogBot, yLo: lo, yHi: hi };
  }
  const hi = yMaxRaw * 1.08;
  const yScale = (v) => MARGIN.top + plotH - (v / hi) * plotH;
  return { xScale, yScale, xLo: xd.lo, xHi: xd.hi, yLog: false, hasZero: false, yLo: 0, yHi: hi };
}

// =================== Layout por formato (clon del N°4) ===================
function tp_layout(editorFormat, mobile) {
  if (editorFormat === 'newsletter' || editorFormat === 'square') {
    // Aspecto ~1.40 = el del hueco disponible en el canvas cuadrado (1116 de
    // ancho x ~793 de alto): asi el SVG llena las dos dimensiones en vez de
    // sobrarle ancho. Margenes de abajo al minimo para que el plot crezca y la
    // leyenda baje hacia el caption (Daniel 2026-09-11).
    return { W: 1100, H: 786, M: { top: 44, right: 44, left: 108 }, baseBottom: 12,
             SIZES: { tick: 22, axisTitle: 25, label: 24, dot: 8, strip: 22, legend: 19 } };
  }
  if (editorFormat === 'mobile') {
    return { W: 1100, H: 1100, M: { top: 84, right: 40, left: 108 }, baseBottom: 58,
             SIZES: { tick: 26, axisTitle: 28, label: 25, dot: 9, strip: 26, legend: 22 } };
  }
  if (editorFormat === 'public') {
    return { W: 1100, H: 619, M: { top: 54, right: 36, left: 82 }, baseBottom: 34,
             SIZES: { tick: 15, axisTitle: 17, label: 16, dot: 6, strip: 15, legend: 14 } };
  }
  if (mobile) {
    return { W: 1100, H: 1250, M: { top: 110, right: 36, left: 126 }, baseBottom: 62,
             SIZES: { tick: 28, axisTitle: 30, label: 27, dot: 9, strip: 28, legend: 23 } };
  }
  // Desktop en pantalla: entra sin scrollear (criterio del N°4).
  return { W: 1100, H: 480, M: { top: 44, right: 34, left: 72 }, baseBottom: 22,
           SIZES: { tick: 11, axisTitle: 12, label: 11.5, dot: 5, strip: 11, legend: 10.5 } };
}

function tp_legendLayout(regions, fs, plotW, bigFmt) {
  const dotR = fs * 0.45;
  const gapDot = dotR * 2 + fs * 0.5;
  const gapItem = fs * 1.5;
  const items = regions.map(r => {
    const label = tp_regionLabel(r);
    return { region: r, label, w: gapDot + tp_measure(label, fs, 500) + gapItem };
  });
  const rows = [];
  let cur = [], curW = 0;
  items.forEach(it => {
    if (curW + it.w > plotW && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(it); curW += it.w;
  });
  if (cur.length) rows.push(cur);
  return { rows, dotR, gapDot, gapItem, rowH: fs * (bigFmt ? 1.5 : 1.7) };
}

// =================== Render principal ===================
function drawTalento() {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.innerHTML = '';
  tp_dots = [];
  tp_labelCtx = null;

  const s = state[5];
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && tp_isMobile();
  const bigFmt = !!editorFormat || mobile;

  const L = tp_layout(editorFormat, mobile);
  const W = L.W, H = L.H, SIZES = L.SIZES;
  const marginTop = Math.max(editorFormat ? 28 : (mobile ? 26 : 16), L.M.top - SIZES.strip * 1.6);
  const MARGIN = { top: marginTop, right: L.M.right, left: L.M.left, bottom: 0 };
  const plotW = W - MARGIN.left - MARGIN.right;

  const allPts = tp_points();
  const hidden = tp_hidden();
  const pts = allPts.filter(p => !hidden.has(p.region));

  const presentRegions = (typeof REGION_ORDER !== 'undefined' ? REGION_ORDER : [])
    .filter(r => allPts.some(p => p.region === r))
    .filter(r => !editorFormat || !hidden.has(r));
  let legendFs = SIZES.legend;
  let leg = tp_legendLayout(presentRegions, legendFs, plotW, bigFmt);
  if (leg.rows.length * leg.rowH > H * 0.26) {
    legendFs = SIZES.legend * 0.8;
    leg = tp_legendLayout(presentRegions, legendFs, plotW, bigFmt);
  }
  const legendH = leg.rows.length * leg.rowH;
  const xTickGap = bigFmt ? SIZES.tick * 1.5 : 17;
  MARGIN.bottom = xTickGap + L.baseBottom + SIZES.axisTitle * 1.7 + legendH + legendFs * (bigFmt ? 0.9 : 1.4);
  const plotH = H - MARGIN.top - MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const model = tp_buildModel(pts);
  tp_lastModel = model;
  tp_lastN = pts.length;
  tp_lastAll = allPts.length;

  if (!allPts.length) {
    const msg = tp_ns('text');
    msg.setAttribute('x', W / 2);
    msg.setAttribute('y', MARGIN.top + Math.max(60, plotH / 2));
    msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', TP_FONT);
    msg.setAttribute('fill', TP_AXIS_INK);
    msg.style.fontSize = SIZES.axisTitle + 'px';
    msg.textContent = TPX('No hay países con datos para esta combinación.', 'No countries with data for this combination.');
    svg.appendChild(msg);
    tp_updateSubtitle();
    tp_updateTitle(null);
    tp_updateBanner(null, 0);
    tp_syncShowAll();
    return;
  }

  const sc = tp_makeScales(pts, MARGIN, plotW, plotH);
  const xScale = sc.xScale, yScale = sc.yScale;
  const plotBox = {
    x1: MARGIN.left + 1, x2: MARGIN.left + plotW - 1,
    y1: MARGIN.top + 1, y2: MARGIN.top + plotH - 1
  };

  // === Fondo ===
  const bg = tp_ns('rect');
  bg.setAttribute('x', MARGIN.left); bg.setAttribute('y', MARGIN.top);
  bg.setAttribute('width', plotW); bg.setAttribute('height', plotH);
  bg.setAttribute('fill', TP_BG);
  svg.appendChild(bg);

  // === Grid + ticks X ===
  const gridG = tp_ns('g'); svg.appendChild(gridG);
  let xTicks;
  if (s.scaleX === 'log') {
    xTicks = (typeof niceLog10Ticks === 'function') ? niceLog10Ticks(sc.xLo, sc.xHi) : [1000, 10000, 100000];
    if (bigFmt && xTicks.length > 6) xTicks = xTicks.filter(vv => Math.abs(Math.log10(vv) - Math.round(Math.log10(vv))) < 1e-9);
  } else {
    xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, sc.xHi, 6) : [0, 50000, 100000];
    if (bigFmt && xTicks.length > 6) xTicks = xTicks.filter((vv, i) => i % 2 === 0);
  }
  xTicks.forEach(vv => {
    const x = xScale(Math.max(vv, s.scaleX === 'log' ? sc.xLo : 0));
    if (vv > 0 && s.scaleX === 'log' && (vv < sc.xLo || vv > sc.xHi)) return;
    if (x < MARGIN.left - 0.5 || x > MARGIN.left + plotW + 0.5) return;
    const ln = tp_ns('line');
    ln.setAttribute('x1', x); ln.setAttribute('x2', x);
    ln.setAttribute('y1', MARGIN.top); ln.setAttribute('y2', MARGIN.top + plotH);
    ln.setAttribute('stroke', TP_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = tp_ns('text');
    tx.setAttribute('x', x);
    tx.setAttribute('y', MARGIN.top + plotH + xTickGap);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', TP_FONT);
    tx.setAttribute('fill', TP_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = (typeof fmtTickGDP === 'function') ? fmtTickGDP(vv) : ('$' + vv);
    gridG.appendChild(tx);
  });

  // === Grid + ticks Y ===
  let yTicks;
  if (sc.yLog) {
    yTicks = (typeof niceLog10Ticks === 'function') ? niceLog10Ticks(sc.yLo, sc.yHi) : [0.1, 1, 10];
    if (bigFmt) yTicks = yTicks.filter(vv => Math.abs(Math.log10(vv) - Math.round(Math.log10(vv))) < 1e-9);
  } else {
    yTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, sc.yHi, 6) : [];
  }
  yTicks.forEach(vv => {
    if (sc.yLog && (vv < sc.yLo || vv > sc.yHi)) return;
    const y = yScale(vv);
    const ln = tp_ns('line');
    ln.setAttribute('x1', MARGIN.left); ln.setAttribute('x2', MARGIN.left + plotW);
    ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    ln.setAttribute('stroke', TP_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = tp_ns('text');
    tx.setAttribute('x', MARGIN.left - SIZES.tick * 0.7);
    tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', TP_FONT);
    tx.setAttribute('fill', TP_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = tp_rate(vv);
    gridG.appendChild(tx);
  });
  // Franja "0" del eje log
  if (sc.yLog && sc.hasZero) {
    const sep = tp_ns('line');
    const ySep = (sc.yLogBot + sc.yZero) / 2;
    sep.setAttribute('x1', MARGIN.left); sep.setAttribute('x2', MARGIN.left + plotW);
    sep.setAttribute('y1', ySep); sep.setAttribute('y2', ySep);
    sep.setAttribute('stroke', TP_GRID); sep.setAttribute('stroke-width', 1);
    sep.setAttribute('stroke-dasharray', '3 3');
    gridG.appendChild(sep);
    const tz = tp_ns('text');
    tz.setAttribute('x', MARGIN.left - SIZES.tick * 0.7);
    tz.setAttribute('y', sc.yZero);
    tz.setAttribute('text-anchor', 'end');
    tz.setAttribute('dominant-baseline', 'central');
    tz.setAttribute('font-family', TP_FONT);
    tz.setAttribute('fill', TP_AXIS_INK);
    tz.style.fontSize = SIZES.tick + 'px';
    tz.textContent = '0';
    gridG.appendChild(tz);
  }

  // === Títulos de eje ===
  const xTitleY = MARGIN.top + plotH + xTickGap + SIZES.axisTitle * 1.6;
  const xTitle = tp_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', xTitleY);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', TP_FONT);
  xTitle.setAttribute('fill', TP_AXIS_TITLE_INK);
  xTitle.setAttribute('font-weight', 500);
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.textContent = s.scaleX === 'log'
    ? TPX('PIB per cápita (US$, escala logarítmica)', 'GDP per capita (US$, log scale)')
    : TPX('PIB per cápita (US$)', 'GDP per capita (US$)');
  svg.appendChild(xTitle);

  const yTitle = tp_ns('text');
  const ytx = bigFmt ? 26 : 16;
  yTitle.setAttribute('x', ytx);
  yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', TP_FONT);
  yTitle.setAttribute('fill', TP_AXIS_TITLE_INK);
  yTitle.setAttribute('font-weight', 500);
  yTitle.style.fontSize = SIZES.axisTitle + 'px';
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = s.scaleY === 'log'
    ? TPX('Figuras célebres por millón (escala log)', 'Notable figures per million (log scale)')
    : TPX('Figuras célebres por millón', 'Notable figures per million');
  svg.appendChild(yTitle);

  // === Curva del modelo (siempre log-log; se dibuja sólo sobre el rango
  // observado, sin extrapolar) ===
  if (model) {
    let gLo = Infinity, gHi = 0;
    pts.forEach(p => { if (p.gdp_pc < gLo) gLo = p.gdp_pc; if (p.gdp_pc > gHi) gHi = p.gdp_pc; });
    const N_SAMPLES = 200;
    const lo = Math.log10(gLo), hi = Math.log10(gHi);
    let d = '', pen = false;
    for (let i = 0; i <= N_SAMPLES; i++) {
      const gdp = Math.pow(10, lo + (i / N_SAMPLES) * (hi - lo));
      const yp = model.predict(gdp);
      const yLimLo = sc.yLog ? sc.yLo : 0;
      if (yp < yLimLo || yp > sc.yHi) { pen = false; continue; }
      const px = xScale(gdp), py = yScale(yp);
      d += (pen ? ' L ' : ' M ') + px.toFixed(1) + ' ' + py.toFixed(1);
      pen = true;
    }
    if (d) {
      const path = tp_ns('path');
      path.setAttribute('d', d.trim());
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#9C928A');
      path.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      path.setAttribute('stroke-dasharray', bigFmt ? '9 6' : '5 3');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
  }

  // === Puntos ===
  const selSet = {};
  state[5].selected.forEach(c => { selSet[c] = true; });
  const ordered = pts.slice().sort((a, b) => {
    const score = (p) => (p.region === TP_LATAM ? 1 : 0) + (selSet[p.code] ? 3 : 0);
    return score(a) - score(b);
  });
  const dotsG = tp_ns('g'); svg.appendChild(dotsG);
  ordered.forEach(p => {
    const cx = xScale(p.gdp_pc), cy = yScale(p.val);
    const isSel = !!selSet[p.code];
    const r = isSel ? SIZES.dot * 1.2 : SIZES.dot;
    const c = tp_ns('circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', tp_regionColor(p.region));
    c.setAttribute('fill-opacity', isSel ? 0.95 : 0.8);
    c.setAttribute('stroke', isSel ? '#3A3530' : TP_BG);
    c.setAttribute('stroke-width', isSel ? 1.2 : 1);
    c.style.cursor = 'pointer';
    c.dataset.iso = p.code;
    c.dataset.region = p.region;
    c.addEventListener('mouseenter', (e) => tp_showTooltip(e, p));
    c.addEventListener('mousemove', (e) => tp_posTooltip(e));
    c.addEventListener('mouseleave', () => tp_hideTooltip());
    dotsG.appendChild(c);
    tp_dots.push(c);
    const hit = tp_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
    // Con MOUSE el hit generoso de 30px dispara el tooltip lejos del punto
    // ("descalibrado", Daniel 2026-09-13): en dispositivos con hover el radio
    // acompana al punto; el area tactil de 30px queda solo para touch.
    hit.setAttribute('r', (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) ? Math.max(30, r * 2.4) : Math.max(9, r * 1.5));
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', (e) => tp_showTooltip(e, p));
    hit.addEventListener('mousemove', (e) => tp_posTooltip(e));
    hit.addEventListener('mouseleave', () => tp_hideTooltip());
    // Clic = seleccionar (agrega/saca el chip); en touch, tap = tooltip.
    const clickH = (e) => {
      e.stopPropagation();
      if (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) { tp_showTooltip(e, p); return; }
      tp_toggleCountry(p.code);
    };
    c.addEventListener('click', clickH);
    hit.addEventListener('click', clickH);
    dotsG.appendChild(hit);
  });

  // === Etiquetas ===
  // pointer-events:none: una etiqueta que tapa un punto ajeno no debe tragarse
  // su hover (el tooltip de Japon moria bajo el label de Chile).
  const labelsG = tp_ns('g'); labelsG.setAttribute('pointer-events', 'none');
  svg.appendChild(labelsG);
  tp_labelCtx = {
    g: labelsG, pts, plotBox, SIZES, bigFmt, xScale, yScale,
    frozen: !!window.__atlasPngFormatOverride
  };
  tp_renderLabels();

  // === Leyenda ===
  tp_drawLegend(svg, leg, MARGIN, plotW, xTitleY, legendFs);

  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { tp_hideTooltip(); tp_setHoverRegion(null); }
  };

  tp_updateSubtitle();
  tp_updateTitle(model);
  tp_syncShowAll();
  tp_applyRegionFocus();
}

// =================== Etiquetas ===================
function tp_renderLabels() {
  const ctx = tp_labelCtx;
  if (!ctx || !ctx.g) return;
  while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);

  const SIZES = ctx.SIZES, bigFmt = ctx.bigFmt;
  const hover = ctx.frozen ? null : tp_hoverRegion();
  const selSet = {};
  (state[5].selected || []).forEach(c => { selSet[c] = true; });

  const items = [];
  ctx.pts.forEach(p => {
    const isSel = !!selSet[p.code];
    const isHover = !isSel && !!hover && p.region === hover;
    if (!isSel && !isHover) return;
    const fs = isSel ? SIZES.label : SIZES.label * 0.92;
    const weight = isSel ? 600 : 500;
    const text = tp_name(p.code);
    items.push({
      cx: ctx.xScale(p.gdp_pc), cy: ctx.yScale(p.val), text,
      textW: tp_measure(text, fs, weight),
      iso: p.code, region: p.region,
      forced: isSel,
      subPriority: isSel ? 0 : (TP_ANCHORS[p.code] ? 1 : 2),
      transient: !isSel, fs, weight,
      r: isSel ? SIZES.dot * 1.2 : SIZES.dot
    });
  });

  const placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, ctx.plotBox) : [];
  if (typeof s_relaxLabels === 'function') {
    const obstacles = items.map(it => ({ x: it.cx, y: it.cy, r: (it.r || SIZES.dot) + 2 }));
    s_relaxLabels(placed, SIZES.label + (bigFmt ? 5 : 3), ctx.plotBox, bigFmt ? 220 : 80, obstacles, { edgeAware: true });
  }

  placed.forEach(l => {
    const fs = l.fs || SIZES.label;
    let src = null;
    for (let i = 0; i < items.length; i++) if (items[i].iso === l.iso) { src = items[i]; break; }
    if (src && typeof s_leaderLine === 'function') {
      const guia = s_leaderLine(l, { x: src.cx, y: src.cy, r: src.r }, fs, bigFmt ? 10 : 7);
      if (guia) {
        const gl = tp_ns('line');
        gl.setAttribute('x1', guia.x1); gl.setAttribute('y1', guia.y1);
        gl.setAttribute('x2', guia.x2); gl.setAttribute('y2', guia.y2);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.7);
        gl.setAttribute('stroke-opacity', l.transient ? 0.55 : 1);
        ctx.g.appendChild(gl);
      }
    }
    const tx = tp_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', TP_FONT);
    tx.setAttribute('font-weight', l.weight || 600);
    tx.setAttribute('fill', tp_regionLabelColor(l.region));
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    tx.setAttribute('paint-order', 'stroke');
    tx.setAttribute('stroke', TP_BG);
    tx.setAttribute('stroke-width', bigFmt ? 5 : 2.6);
    tx.setAttribute('stroke-linejoin', 'round');
    tx.style.fontSize = fs + 'px';
    tx.textContent = l.text;
    ctx.g.appendChild(tx);
  });
}

// =================== Leyenda + foco por región ===================
function tp_focusRegion() {
  const s = state[5];
  const hid = tp_hidden();
  if (s.hoverRegion && !hid.has(s.hoverRegion)) return s.hoverRegion;
  if (!hid.has(TP_LATAM)) return TP_LATAM;
  const m = tp_lastModel;
  if (m) {
    const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
    for (let i = 0; i < order.length; i++) {
      if (!hid.has(order[i]) && m.byRegion[order[i]]) return order[i];
    }
  }
  return TP_LATAM;
}

function tp_drawLegend(svg, leg, MARGIN, plotW, xTitleY, fs) {
  const g = tp_ns('g'); svg.appendChild(g);
  const hid = tp_hidden();
  const y0 = xTitleY + fs * 2.2;
  leg.rows.forEach((row, ri) => {
    const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
    let x = MARGIN.left + Math.max(0, (plotW - rowW) / 2);
    const y = y0 + ri * leg.rowH;
    row.forEach(it => {
      const off = hid.has(it.region);
      const item = tp_ns('g');
      item.dataset.legendRegion = it.region;
      if (off) item.dataset.legendOff = '1';
      const dot = tp_ns('circle');
      dot.setAttribute('cx', x + leg.dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', leg.dotR);
      dot.setAttribute('fill', off ? 'none' : tp_regionColor(it.region));
      if (off) {
        dot.setAttribute('stroke', tp_regionColor(it.region));
        dot.setAttribute('stroke-width', Math.max(1, fs * 0.11));
      }
      item.appendChild(dot);
      const tx = tp_ns('text');
      tx.setAttribute('x', x + leg.gapDot); tx.setAttribute('y', y);
      tx.setAttribute('dominant-baseline', 'central');
      tx.setAttribute('font-family', TP_FONT);
      tx.setAttribute('fill', '#4A4A4A');
      tx.style.fontSize = fs + 'px';
      tx.textContent = it.label;
      item.appendChild(tx);
      if (off) {
        const strike = tp_ns('line');
        strike.setAttribute('x1', x + leg.gapDot - 1);
        strike.setAttribute('x2', x + leg.gapDot + tp_measure(it.label, fs, 500) + 1);
        strike.setAttribute('y1', y); strike.setAttribute('y2', y);
        strike.setAttribute('stroke', '#4A4A4A');
        strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
        item.appendChild(strike);
      }
      item.style.cursor = 'pointer';
      const hit = tp_ns('rect');
      hit.setAttribute('x', x - 2); hit.setAttribute('y', y - leg.rowH / 2);
      hit.setAttribute('width', it.w); hit.setAttribute('height', leg.rowH);
      hit.setAttribute('fill', 'transparent');
      item.appendChild(hit);
      item.addEventListener('mouseenter', () => tp_setHoverRegion(it.region));
      item.addEventListener('mouseleave', () => tp_setHoverRegion(null));
      item.addEventListener('click', (ev) => { ev.stopPropagation(); tp_toggleRegion(it.region); });
      g.appendChild(item);
      x += it.w;
    });
  });
}

function tp_setHoverRegion(reg) {
  if (reg && tp_hidden().has(reg)) reg = null;
  if (!state[5]) return;
  if ((state[5].hoverRegion || null) === (reg || null)) return;
  state[5].hoverRegion = reg || null;
  tp_renderLabels();
  tp_applyRegionFocus();
}

function tp_applyRegionFocus() {
  const focus = (tp_labelCtx && tp_labelCtx.frozen) ? null : tp_hoverRegion();
  for (let i = 0; i < tp_dots.length; i++) {
    const c = tp_dots[i];
    c.setAttribute('opacity', (!focus || c.dataset.region === focus) ? 1 : 0.16);
  }
  const svg = document.getElementById('chart5');
  if (svg) {
    svg.querySelectorAll('[data-legend-region]').forEach(el => {
      if (el.dataset.legendOff) { el.setAttribute('opacity', 0.34); return; }
      el.setAttribute('opacity', (!focus || el.dataset.legendRegion === focus) ? 1 : 0.38);
    });
  }
  tp_updateBanner(tp_lastModel, tp_lastN);
}

// =================== Título / subtítulo dinámicos ===================
// Genitivos de dominio (los mismos del mapa y el reparto).
const TP_GEN_DOM_ES = { 'Deportes': 'del deporte', 'Artes y espectáculo': 'del arte y el espectáculo',
  'Ciencia y tecnología': 'de la ciencia y la tecnología', 'Humanidades': 'de las humanidades',
  'Poder y figuras públicas': 'del poder y las figuras públicas', 'Negocios y exploración': 'de los negocios y la exploración' };

// "Quién": «Figuras célebres», «Figuras célebres del deporte», «Físicos:
// figuras célebres». Reutilizado por subtítulo y título neutral.
function tp_quien(cap) {
  const s = state[5], E = EXPLORA, en = tp_lang() === 'en';
  const base = en ? 'notable figures' : 'figuras célebres';
  let out;
  if (s.rubroType === 'all') out = base;
  else if (s.rubroType === 'dom') {
    const d = E.domains[s.rubroIdx];
    out = en ? ('notable figures in ' + d.en.toLowerCase())
             : (base + ' ' + (TP_GEN_DOM_ES[d.es] || 'de ' + d.es.toLowerCase()));
  } else {
    const sub = E.subrubros[s.rubroIdx][en ? 'en' : 'es'];
    out = sub + ': ' + base;
  }
  return cap ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

// ¿Estado default? El título editorial sólo se sostiene en la foto que se
// calculó: todas las disciplinas, período completo, población default, todas
// las regiones prendidas y la selección de nacimiento (norma del N°4).
function tp_esDefault() {
  const s = state[5];
  if (!s) return false;
  if (s.rubroType !== 'all') return false;
  if (s.y0 !== TP_DEF_Y0 || s.y1 !== EXPLORA.y1) return false;
  if (s.minPopM !== TP_DEFAULT_POP) return false;
  if (tp_hidden().size) return false;
  const sel = (s.selected || []).slice().sort().join(',');
  return sel === TP_DEFAULT_SEL.slice().sort().join(',');
}

function tp_updateTitle(model) {
  const block = document.querySelector('.chart-block[data-chart="5"]');
  if (!block) return;
  const el = block.querySelector('.chart-title');
  if (!el || tp_editorCustom('title')) return;
  // Hallazgo sólo cuando el gráfico en pantalla lo sostiene: estado default y
  // pendiente positiva. En cualquier otro caso, título descriptivo.
  if (tp_esDefault() && model && model.b > 0) {
    el.textContent = TPX('La cantidad de famosos per cápita aumenta con el desarrollo',
                         'Fame per capita rises with development');
    return;
  }
  el.textContent = tp_quien(true) + TPX(' por millón y PIB per cápita', ' per million and GDP per capita');
}

function tp_updateSubtitle() {
  const block = document.querySelector('.chart-block[data-chart="5"]');
  if (!block) return;
  const el = block.querySelector('.chart-subtitle');
  if (!el || tp_editorCustom('subtitle')) return;
  const s = state[5];
  el.textContent = tp_quien(true)
    + TPX(' por millón vs PIB per cápita, nacidas entre ' + s.y0 + ' y ' + s.y1 + '.',
          ' per million vs GDP per capita, born ' + s.y0 + '–' + s.y1 + '.');
}

// =================== Banner (HTML, debajo del SVG) ===================
// [Figuras 25.634] · [Países 138] · [R² 0,45] · [Residuo · América Latina
// −23% respecto de lo previsto]. Mismo lugar y mismo set que los scatters del
// N°2 y N°4; el residuo acá es % (modelo log), no pp.
function tp_updateBanner(model, n) {
  const el = document.getElementById('tp-banner');
  if (!el) return;
  const nItem =
      `<span class="s-banner-item"><span class="s-banner-key">${TPX('Países', 'Countries')}</span>`
    + `<span class="s-banner-val">${n || 0}</span></span>`;
  if (!model) {
    el.innerHTML = nItem
      + `<span class="s-banner-sep">·</span>`
      + `<span class="s-banner-item"><span class="s-banner-note">${tp_lastAll
          ? TPX('Muy pocos países visibles para estimar el ajuste.', 'Too few visible countries to fit the model.')
          : TPX('No hay datos para esta combinación.', 'No data for this combination.')}</span></span>`;
    return;
  }
  const figs = (model.totalFigs || 0).toLocaleString(tp_lang() === 'en' ? 'en-US' : 'es-AR');
  const focus = tp_focusRegion();
  const rr = model.byRegion[focus];
  const color = tp_regionLabelColor(focus);
  const residHtml = rr
    ? `<span class="s-banner-val">${tp_signedPct(rr.pct)}</span>`
      + `<span class="s-banner-note">${TPX('respecto de lo previsto por su PIB', 'vs. what its GDP predicts')}</span>`
    : `<span class="s-banner-val">—</span><span class="s-banner-note">${TPX('sin países en esta vista', 'no countries in this view')}</span>`;
  el.innerHTML =
      `<span class="s-banner-item"><span class="s-banner-key">${TPX('Figuras', 'Figures')}</span><span class="s-banner-val">${figs}</span></span>`
    + `<span class="s-banner-sep">·</span>`
    + nItem
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">R²</span><span class="s-banner-val">${tp_num(model.r2, 2)}</span></span>`
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">${TPX('Residuo', 'Residual')}</span>`
    + `<span class="s-banner-region-name" style="color:${color}">${tp_regionLabel(focus)}</span>${residHtml}</span>`;
}

// =================== Tooltip ===================
function tp_showTooltip(e, p) {
  const tt = document.getElementById('tooltip5');
  if (!tt) return;
  const hasFit = (typeof p.pred === 'number' && p.pred > 0);
  const fitRows = hasFit
    ? `<div class="tt-row"><span>${TPX('Esperado por su PIB', 'Expected for its GDP')}</span><span>${tp_rate(p.pred)}</span></div>`
      + `<div class="tt-row"><span>${TPX('Residuo', 'Residual')}</span><span>${tp_signedPct((p.ratio - 1) * 100)}</span></div>`
    : '';
  const topRow = p.topName
    ? `<div class="tt-sub">★ ${p.topName}${p.topRank ? ' · #' + p.topRank.toLocaleString(tp_lang() === 'en' ? 'en-US' : 'es-AR') + (state[5].rubroType === 'all' ? TPX(' del ranking mundial', ' worldwide') : TPX(' del rubro', ' in this field')) : ''}</div>`
    : '';
  tt.innerHTML =
      `<strong>${tp_name(p.code)}</strong>`
    + `<div class="tt-region" style="color:${(typeof REGION_COLORS_ON_DARK !== 'undefined' && REGION_COLORS_ON_DARK[p.region]) || '#C9C2B2'}">${tp_regionLabel(p.region)}</div>`
    + `<div class="tt-row"><span>${TPX('Figuras', 'Figures')}</span><span>${p.count.toLocaleString(tp_lang() === 'en' ? 'en-US' : 'es-AR')}</span></div>`
    + `<div class="tt-row"><span>${TPX('Por millón', 'Per million')}</span><span>${tp_rate(p.val)}</span></div>`
    + `<div class="tt-row"><span>${TPX('PIB per cápita', 'GDP per capita')}</span><span>$${tp_num(p.gdp_pc, 0)}</span></div>`
    + fitRows + topRow;
  tt.style.display = 'block';
  tt.style.opacity = '1';
  tp_posTooltip(e);
}
function tp_posTooltip(e) {
  const tt = document.getElementById('tooltip5');
  if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = ((typeof evClientX === 'function') ? evClientX(e) : e.clientX) - wrap.left;
  const y = ((typeof evClientY === 'function') ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (px < 0) px = 0;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px';
  tt.style.top = py + 'px';
}
function tp_hideTooltip() {
  const tt = document.getElementById('tooltip5');
  if (tt) tt.style.opacity = '0';
}

// =================== Selección de países (chips = etiquetas) ===================
function tp_selectableCountries() {
  return EXPLORA.isoMeta
    .map(m => ({ iso: m.iso, name: tp_name(m.iso), region: m.reg }))
    .sort((a, b) => a.name.localeCompare(b.name, tp_lang()));
}
function tp_toggleCountry(iso) {
  const arr = state[5].selected;
  const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  tp_renderChips();
  drawTalento();
}
function tp_renderChips() {
  const cont = document.getElementById('tp-selected-chips');
  if (!cont) return;
  cont.innerHTML = '';
  state[5].selected.forEach(iso => {
    const meta = EXPLORA.isoMeta.find(m => m.iso === iso);
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = tp_regionColor(meta ? meta.reg : '');
    chip.appendChild(document.createTextNode(tp_name(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.type = 'button';
    x.innerHTML = '&times;';
    x.setAttribute('aria-label', TPX('Quitar', 'Remove'));
    x.addEventListener('click', () => tp_toggleCountry(iso));
    chip.appendChild(x);
    cont.appendChild(chip);
  });
}

function tp_normalize(str) {
  return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function tp_setupSearch() {
  const input = document.getElementById('tp-search');
  const results = document.getElementById('tp-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  function render() {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '')
        + (state[5].selected.indexOf(c.iso) >= 0 ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('click', () => {
        tp_toggleCountry(el.dataset.iso);
        input.value = ''; results.classList.remove('open'); input.focus();
      });
    });
  }
  input.addEventListener('input', () => {
    const q = tp_normalize(input.value.trim());
    matches = q
      ? tp_selectableCountries().filter(c => tp_normalize(c.name).indexOf(q) >= 0).slice(0, 8)
      : [];
    active = matches.length ? 0 : -1;
    render();
  });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(); }
    else if (ev.key === 'Enter' && active >= 0) {
      ev.preventDefault();
      tp_toggleCountry(matches[active].iso);
      input.value = ''; results.classList.remove('open');
    } else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

// =================== Controles ===================
function tp_buildRubroSelect() {
  const sel = document.getElementById('tp-rubro');
  if (!sel) return;
  const E = EXPLORA, en = tp_lang() === 'en', s = state[5];
  sel.innerHTML = '';
  const oAll = document.createElement('option');
  oAll.value = 'all'; oAll.textContent = TPX('Todos los rubros', 'All fields');
  sel.appendChild(oAll);
  const g1 = document.createElement('optgroup'); g1.label = TPX('Rubros', 'Fields');
  E.domains.forEach((d, i) => {
    const o = document.createElement('option'); o.value = 'dom:' + i; o.textContent = d[en ? 'en' : 'es'];
    g1.appendChild(o);
  });
  const g2 = document.createElement('optgroup'); g2.label = TPX('Ocupaciones', 'Occupations');
  E.subrubros.forEach((d, i) => {
    const o = document.createElement('option'); o.value = 'sub:' + i; o.textContent = d[en ? 'en' : 'es'];
    g2.appendChild(o);
  });
  sel.appendChild(g1); sel.appendChild(g2);
  sel.value = s.rubroType === 'all' ? 'all' : (s.rubroType + ':' + s.rubroIdx);
}
function tp_buildPopSelect() {
  const sel = document.getElementById('tp-pop');
  if (!sel) return;
  sel.innerHTML = '';
  [0, 1, 3, 5, 10, 20].forEach(v => {
    const o = document.createElement('option');
    o.value = String(v);
    o.textContent = v === 0 ? TPX('Sin filtro', 'No filter') : ('≥ ' + v + TPX(' M', ' M'));
    sel.appendChild(o);
  });
  sel.value = String(state[5].minPopM || 0);
}
function tp_setupControls() {
  const rubro = document.getElementById('tp-rubro');
  if (rubro && !rubro.dataset.wired) {
    rubro.dataset.wired = '1';
    rubro.addEventListener('change', () => {
      const v = rubro.value, s = state[5];
      if (v === 'all') s.rubroType = 'all';
      else { const parts = v.split(':'); s.rubroType = parts[0]; s.rubroIdx = +parts[1]; }
      drawTalento();
    });
  }
  const pop = document.getElementById('tp-pop');
  if (pop && !pop.dataset.wired) {
    pop.dataset.wired = '1';
    pop.addEventListener('change', () => { state[5].minPopM = +pop.value; drawTalento(); });
  }
  [['tp-scale-x', 'scaleX'], ['tp-scale-y', 'scaleY']].forEach(([id, key]) => {
    document.querySelectorAll('#' + id + ' button').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        state[5][key] = btn.dataset.scale;
        document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('active', b.dataset.scale === state[5][key]));
        drawTalento();
      });
    });
  });
  const showAll = document.getElementById('tp-show-all');
  if (showAll && !showAll.dataset.wired) {
    showAll.dataset.wired = '1';
    showAll.addEventListener('click', () => tp_showAllRegions());
  }
}

// ---- período UNIVERSAL de la casa (doble slider + cajitas, vacío = extremo).
// Rango moderno (1850–2010): track lineal, sin anclas por tramos.
function tp_setupPeriodo() {
  const YMIN = EXPLORA.y0, YMAX = EXPLORA.y1;
  const r0 = document.getElementById('tp-r0'), r1 = document.getElementById('tp-r1');
  const y0 = document.getElementById('tp-y0'), y1 = document.getElementById('tp-y1');
  const fill = document.getElementById('tp-fill');
  if (!r0 || r0.dataset.wired) return;
  r0.dataset.wired = '1';
  const s2y = (v) => Math.round(YMIN + (v / 1000) * (YMAX - YMIN));
  const y2s = (y) => Math.round(((y - YMIN) / (YMAX - YMIN)) * 1000);
  let timer = null;
  const redraw = () => { clearTimeout(timer); timer = setTimeout(drawTalento, 110); };
  function syncPeriodo(fromBoxes) {
    const s = state[5];
    if (fromBoxes) {
      // cajita vacía = extremo (criterio universal)
      let a = y0.value.trim() === '' ? YMIN : parseInt(y0.value, 10);
      let b = y1.value.trim() === '' ? YMAX : parseInt(y1.value, 10);
      if (isNaN(a)) a = YMIN; if (isNaN(b)) b = YMAX;
      a = Math.max(YMIN, Math.min(YMAX, a));
      b = Math.max(YMIN, Math.min(YMAX, b));
      if (a > b) { const tmp = a; a = b; b = tmp; }
      s.y0 = a; s.y1 = b;
    } else {
      let a = s2y(+r0.value), b = s2y(+r1.value);
      if (a > b) { const tmp = a; a = b; b = tmp; }
      s.y0 = a; s.y1 = b;
    }
    r0.value = y2s(s.y0); r1.value = y2s(s.y1);
    y0.value = s.y0 === YMIN ? '' : String(s.y0);
    y1.value = s.y1 === YMAX ? '' : String(s.y1);
    if (fill) {
      const lo = Math.min(+r0.value, +r1.value) / 10, hi = Math.max(+r0.value, +r1.value) / 10;
      fill.style.left = lo + '%'; fill.style.width = (hi - lo) + '%';
    }
    tp_updateSubtitle();
  }
  r0.addEventListener('input', () => { syncPeriodo(false); redraw(); });
  r1.addEventListener('input', () => { syncPeriodo(false); redraw(); });
  y0.addEventListener('change', () => { syncPeriodo(true); redraw(); });
  y1.addEventListener('change', () => { syncPeriodo(true); redraw(); });
  y0.placeholder = String(YMIN); y1.placeholder = String(YMAX);
  y0.value = state[5].y0 === YMIN ? '' : String(state[5].y0);
  y1.value = state[5].y1 === YMAX ? '' : String(state[5].y1);
  syncPeriodo(true);
}

// =================== CSV ===================
// La vista ACTUAL (rubro × período × filtro de población), un país por fila.
function tp_setupCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      const en = tp_lang() === 'en', s = state[5];
      const q = (str) => '"' + String(str).replace(/"/g, '""') + '"';
      let csv = 'iso3,country,region,field,born_from,born_to,n_figures,pop_millions,per_million,gdp_pc\n';
      tp_points().forEach(p => {
        csv += [p.code, q(tp_name(p.code)), q(p.region || ''), q(tp_rubroLabel(s)), s.y0, s.y1,
                p.count, p.popM.toFixed(2), p.val.toFixed(3), Math.round(p.gdp_pc)].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = en ? 'the-atlas-05-fame-vs-gdp.csv' : 'el-atlas-05-fama-vs-pib.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

// =================== Init ===================
function initTalento() {
  if (!state[5]) {
    state[5] = {
      rubroType: 'all', rubroIdx: 0,
      y0: TP_DEF_Y0, y1: EXPLORA.y1,
      minPopM: TP_DEFAULT_POP,
      scaleX: 'log', scaleY: 'log',
      selected: TP_DEFAULT_SEL.slice(),
      hoverRegion: null,
      hiddenRegions: []
    };
  }
  tp_buildRubroSelect();
  tp_buildPopSelect();
  tp_setupControls();
  tp_setupPeriodo();
  tp_setupSearch();
  tp_renderChips();
  tp_setupCSV();
  drawTalento();

  window.__atlasSupportsFormats = true;
  window.__atlasDefaultPngFormat = 'square';
  window.__atlasRedraw = drawTalento;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initTalento._wired) {
    initTalento._wired = true;
    window.addEventListener('atlas-editor-change', () => drawTalento());
    document.addEventListener('click', (ev) => {
      const svg = document.getElementById('chart5');
      if (svg && !svg.contains(ev.target)) { tp_hideTooltip(); tp_setHoverRegion(null); }
    });
  }
  // El PNG rasteriza el SVG: soltamos tooltip y hover antes de exportar.
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '5') return;
    tp_hideTooltip();
    if (state[5]) state[5].hoverRegion = null;
  };
}

// Cambio de idioma: selects, chips y todo el chart se rearman.
function tp_onLangChange() {
  tp_buildRubroSelect();
  tp_buildPopSelect();
  tp_renderChips();
  drawTalento();
}
