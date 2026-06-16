// =============================================================
//  El Atlas N°3 (anexo mundiales) — Chart 8: lugares de nacimiento
// =============================================================
// ¿De dónde salen los mundialistas? Dos vistas (pestañas):
//   - MAPA: un punto por ciudad de nacimiento, tamaño ∝ nº de jugadores.
//           Toggle burbuja ↔ mapa de calor (densidad). Zoom + reset.
//   - RANKING: top de ciudades por nº de jugadores (barras).
// Slider de período: de Mundial en Mundial (1930-2026 por defecto). Cuenta
// jugadores ÚNICOS que disputaron al menos un Mundial dentro del rango.
//
// Stack: D3 v7 + d3-geo-projection (Robinson) + GEO_COUNTRIES. Datos: BIRTH.

//==================================================================
//  Constantes
//==================================================================
const BP_ACCENT = '#BE5D32';
const BP_ACCENT_DARK = '#8F3F22';   // borde de las burbujas (para distinguir solapadas)
const BP_LAND = '#ECE7DD';
const BP_LAND_STROKE = '#FFFFFF';
const BP_TOPN = 15;
const BP_BASE_DOTS = 1200;          // ciudades visibles a zoom 1 (más al acercar)
const BP_HEAT_RAMP = ['#F6E7DC', '#E7AE89', '#CF7B4E', '#BE5D32', '#7A2E16'];

// Nombres de ciudad en español (la fuente los trae en inglés). Para EN se usa
// el nombre tal cual viene; para ES, esta traducción cuando existe.
const BP_CITY_ES = {
  'Mexico City': 'Ciudad de México', 'Vienna': 'Viena', 'Rio de Janeiro': 'Río de Janeiro',
  'Moscow': 'Moscú', 'Belgrade': 'Belgrado', 'Tehran': 'Teherán', 'Prague': 'Praga',
  'Lisbon': 'Lisboa', 'Antwerp': 'Amberes', 'Bucharest': 'Bucarest', 'Gothenburg': 'Gotemburgo',
  'London': 'Londres', 'Copenhagen': 'Copenhague', 'Munich': 'Múnich', 'Cologne': 'Colonia',
  'Rome': 'Roma', 'Milan': 'Milán', 'Naples': 'Nápoles', 'Turin': 'Turín', 'Geneva': 'Ginebra',
  'Warsaw': 'Varsovia', 'Athens': 'Atenas', 'Cairo': 'El Cairo', 'Seoul': 'Seúl', 'Tokyo': 'Tokio',
  'Brussels': 'Bruselas', 'Saint Petersburg': 'San Petersburgo', 'Zurich': 'Zúrich', 'Genoa': 'Génova',
  'Florence': 'Florencia', 'Stockholm': 'Estocolmo', 'Hamburg': 'Hamburgo', 'Edinburgh': 'Edimburgo',
  'Dublin': 'Dublín', 'Bern': 'Berna', 'The Hague': 'La Haya', 'Sofia': 'Sofía', 'Bordeaux': 'Burdeos',
  'Marseille': 'Marsella', 'Krakow': 'Cracovia', 'Lyon': 'Lyon', 'Kyiv': 'Kiev', 'Kiev': 'Kiev'
};

let bp_geo = null, bp_projection = null, bp_path = null, bp_zoom = null, bp_zoomT = null;
let bp_baseStroke = 0.8, bp_rafPending = false;
let bp_vpts = null, bp_gData = null, bp_rScale = null, bp_maxN = 1;
let bp_PW = 0, bp_PH = 0, bp_bigFmt = false, bp_isPng = false;
let bp_renderRaf = false, bp_lastT = null;

// Redibujo coalescido por frame: el slider dispara muchos 'input' por segundo;
// sin esto, cada uno reconstruye el mapa entero (lento al arrastrar).
function bp_scheduleDraw() {
  if (bp_rafPending) return;
  bp_rafPending = true;
  requestAnimationFrame(() => { bp_rafPending = false; drawBirthplace(); });
}

function bp_dims(fmt, mobile, view) {
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    const f = PNG_FORMATS[fmt];
    return { W: f.vbW, H: view === 'bars' ? Math.max(f.vbH, 760) : f.vbH };
  }
  if (mobile) return { W: 1100, H: view === 'bars' ? 1180 : 720 };
  return { W: 1100, H: view === 'bars' ? 500 : 600 };
}

const BP_NS = 'http://www.w3.org/2000/svg';

//==================================================================
//  Helpers
//==================================================================
function bp_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function bp_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }
function bp_countryName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso][lang]) return COUNTRY_NAMES[iso][lang];
  return iso;
}
function bp_cityName(c) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  return (lang === 'es' && BP_CITY_ES[c]) ? BP_CITY_ES[c] : c;
}
function bp_view() { return (state[8] && state[8].view) || 'map'; }
function bp_period() { return (state[8] && state[8].period) || [BIRTH.years[0], BIRTH.years[BIRTH.years.length - 1]]; }
function bp_isHeat() { return !!(state[8] && state[8].heat); }
function bp_loadGeo() {
  if (bp_geo) return;
  // backdrop liviano (simplificado) para que el mapa renderice rápido; fallback
  // al geo completo si no estuviera.
  if (typeof GEO_COUNTRIES_LITE !== 'undefined') { bp_geo = GEO_COUNTRIES_LITE; return; }
  if (typeof GEO_COUNTRIES !== 'undefined') { bp_geo = GEO_COUNTRIES; return; }
  console.error('[birthplace] geometría no cargada');
}
function bp_idxOf(year) { const ys = BIRTH.years; let bi = 0, bd = Infinity; for (let i = 0; i < ys.length; i++) { const d = Math.abs(ys[i] - year); if (d < bd) { bd = d; bi = i; } } return bi; }

// Conteo de jugadores únicos por ciudad para el período [y0,y1].
function bp_cityCounts(period) {
  const a = bp_idxOf(period[0]), b = bp_idxOf(period[1]);
  const counts = new Map();
  const P = BIRTH.players;
  for (let i = 0; i < P.length; i++) {
    const yrs = P[i][1]; let hit = false;
    for (let k = 0; k < yrs.length; k++) { if (yrs[k] >= a && yrs[k] <= b) { hit = true; break; } }
    if (hit) { const ci = P[i][0]; counts.set(ci, (counts.get(ci) || 0) + 1); }
  }
  return counts;
}
// pts ordenados ascendente por conteo (grandes al final). {ci, c, n}
function bp_points(period) {
  const counts = bp_cityCounts(period); const pts = [];
  counts.forEach((n, ci) => { pts.push({ ci, c: BIRTH.cities[ci], n }); });
  pts.sort((x, y) => x.n - y.n);
  return pts;
}

// Hexbin propio (sin depender del CDN d3-hexbin). Bina puntos en una grilla
// hexagonal de radio r; cada bin trae .x/.y (centro) y los puntos que cayeron.
function bp_makeHexbin(r) {
  const thirdPi = Math.PI / 3, dx = r * 2 * Math.sin(thirdPi), dy = r * 1.5;
  function bin(points, xacc, yacc) {
    const byId = new Map(), bins = [];
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]; let px = xacc(pt) / dx, py = yacc(pt) / dy;
      if (!isFinite(px) || !isFinite(py)) continue;
      let pj = Math.round(py); px -= (pj & 1) ? 0.5 : 0; let pi = Math.round(px);
      const py1 = py - pj;
      if (Math.abs(py1) * 3 > 1) {
        const px1 = px - pi, pi2 = pi + (px < pi ? -1 : 1) / 2, pj2 = pj + (py < pj ? -1 : 1), px2 = px - pi2, py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) { pi = pi2 + ((pj & 1) ? 1 : -1) / 2; pj = pj2; }
      }
      const id = pi + ',' + pj; let b = byId.get(id);
      if (!b) { b = []; b.x = (pi + ((pj & 1) ? 0.5 : 0)) * dx; b.y = pj * dy; byId.set(id, b); bins.push(b); }
      b.push(pt);
    }
    return bins;
  }
  bin.hexagon = function () {
    const pts = []; for (let i = 0; i < 6; i++) { const a = thirdPi * i; pts.push((Math.sin(a) * r).toFixed(2) + ',' + (-Math.cos(a) * r).toFixed(2)); }
    return 'M' + pts.join('L') + 'Z';
  };
  return bin;
}

//==================================================================
//  DRAW
//==================================================================
function drawBirthplace() {
  const svg = d3.select('#chart8');
  if (svg.empty()) return;
  svg.selectAll('*').remove();
  bp_loadGeo();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && bp_isMobile();
  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const view = bp_view();
  const { W, H } = bp_dims(editorFormat, mobile, view);
  const node = svg.node();
  node.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(node, editorFormat);

  if (view === 'bars') bp_drawBars(svg, W, H, { bigFmt, isPngFormat });
  else bp_drawMapView(svg, W, H, { bigFmt, isPngFormat });

  bp_applyHeadings();
}

//------------------------------------------------------------------
//  Vista MAPA (burbuja o calor) + zoom
//------------------------------------------------------------------
function bp_drawMapView(svg, W, H, opt) {
  const { bigFmt, isPngFormat } = opt;
  if (!bp_geo) return;
  const M = 8;
  const PW = W - 2 * M, PH = H - 2 * M;
  const period = bp_period();

  bp_projection = d3.geoRobinson().fitSize([PW, PH], bp_geo);
  bp_path = d3.geoPath(bp_projection);

  const root = svg.append('g').attr('transform', `translate(${M},${M})`);
  svg.append('defs').append('clipPath').attr('id', 'bp-clip').append('rect')
    .attr('x', -M).attr('y', -M).attr('width', W).attr('height', H);
  root.attr('clip-path', 'url(#bp-clip)');
  const gZoom = root.append('g');   // SOLO el mapa base se transforma con el zoom

  gZoom.append('g').attr('class', 'bp-land').selectAll('path').data(bp_geo.features).join('path')
    .attr('d', bp_path).attr('fill', BP_LAND).attr('stroke', BP_LAND_STROKE)
    .attr('stroke-width', 0.5).attr('vector-effect', 'non-scaling-stroke');

  // proyectar cada ciudad una sola vez; ordenar por nº de jugadores (desc)
  const pts = bp_points(period);
  for (let i = 0; i < pts.length; i++) { const p = bp_projection([pts[i].c.lon, pts[i].c.lat]); pts[i].x = p ? p[0] : null; pts[i].y = p ? p[1] : null; }
  bp_vpts = pts.filter(p => p.x != null).sort((a, b) => b.n - a.n);
  bp_maxN = bp_vpts.length ? bp_vpts[0].n : 1;
  bp_rScale = d3.scaleSqrt().domain([0, bp_maxN]).range([0, bigFmt ? 32 : 19]);
  bp_baseStroke = bigFmt ? 1.1 : 0.8;
  bp_PW = PW; bp_PH = PH; bp_bigFmt = bigFmt; bp_isPng = isPngFormat;

  // Capa de datos (puntos/calor) en coords de PANTALLA: se recalcula con el zoom
  // → el calor "cambia según el zoom" y se cullean los puntos fuera de vista.
  bp_gData = root.append('g');
  bp_renderData(bp_zoomT || d3.zoomIdentity);

  if (!bp_isHeat()) bp_sizeLegend(root, bp_rScale, bp_maxN, PW, PH, bigFmt);
  bp_scopeNote(root, period, PW, bigFmt);

  if (!isPngFormat) {
    bp_zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [PW, PH]])
      .on('zoom', (ev) => { gZoom.attr('transform', ev.transform); bp_zoomT = ev.transform; bp_scheduleRenderData(ev.transform); });
    svg.call(bp_zoom);
    if (bp_zoomT) svg.call(bp_zoom.transform, bp_zoomT);  // re-aplicar zoom previo tras redraw
  }
}

// Recalcula la capa de datos para el zoom/posición actuales. LOD: más ciudades
// al acercar; cull de las que caen fuera del viewport (clave para la fluidez).
// En calor, recomputa la densidad para la vista actual (cambia con el zoom).
function bp_renderData(transform) {
  if (!bp_gData || !bp_vpts) return;
  bp_gData.selectAll('*').remove();
  const t = transform || d3.zoomIdentity, k = t.k, pad = 40;
  const inView = (sx, sy) => sx >= -pad && sx <= bp_PW + pad && sy >= -pad && sy <= bp_PH + pad;

  if (bp_isHeat()) {
    // HEXBIN: bina TODOS los puntos visibles en hexágonos → grilla fina y nítida
    // (sin "manchón" del KDE), y se re-grilla con el zoom (más detalle al acercar).
    // El binning es O(n): barato aun con miles de puntos.
    const vis = [];
    for (let i = 0; i < bp_vpts.length; i++) { const p = bp_vpts[i], sx = t.applyX(p.x), sy = t.applyY(p.y); if (inView(sx, sy)) vis.push({ x: sx, y: sy, n: p.n }); }
    const R = bp_bigFmt ? 15 : 10;
    const hb = bp_makeHexbin(R);
    const bins = hb(vis, o => o.x, o => o.y);
    for (let i = 0; i < bins.length; i++) { let v = 0; for (let j = 0; j < bins[i].length; j++) v += bins[i][j].n; bins[i]._v = v; }
    const maxV = d3.max(bins, b => b._v) || 1;
    // escala de color sqrt: los clusters chicos no desaparecen al lado de Europa
    const color = d3.scaleSequentialSqrt(d3.interpolateRgbBasis(BP_HEAT_RAMP)).domain([0, maxV]);
    const hex = hb.hexagon();
    bp_gData.append('g').attr('class', 'bp-heat').selectAll('path').data(bins).join('path')
      .attr('transform', b => `translate(${b.x.toFixed(1)},${b.y.toFixed(1)})`)
      .attr('d', hex).attr('fill', b => color(b._v)).attr('stroke', 'none');
  } else {
    const maxDots = bp_isPng ? bp_vpts.length : Math.min(bp_vpts.length, Math.round(BP_BASE_DOTS * k));
    const vis = [];
    for (let i = 0; i < maxDots; i++) { const p = bp_vpts[i], sx = t.applyX(p.x), sy = t.applyY(p.y); if (inView(sx, sy)) vis.push({ d: p, sx, sy }); }
    const draw = vis.slice().reverse();   // dibujar las grandes al final (arriba)
    const gDots = bp_gData.append('g').attr('class', 'bp-dots');
    gDots.selectAll('circle').data(draw).join('circle')
      .attr('cx', o => o.sx).attr('cy', o => o.sy).attr('r', o => bp_rScale(o.d.n))
      .attr('fill', BP_ACCENT).attr('fill-opacity', 0.4)
      .attr('stroke', BP_ACCENT_DARK).attr('stroke-width', bp_baseStroke).attr('stroke-opacity', 0.85);
    if (!bp_isPng && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      gDots.style('cursor', 'pointer')
        .on('mouseover', (ev) => { if (ev.target.tagName !== 'circle') return; const c = d3.select(ev.target); c.attr('fill-opacity', 0.85).raise(); bp_tip(c.datum().d); })
        .on('mousemove', () => bp_tipMove())
        .on('mouseout', (ev) => { if (ev.target.tagName !== 'circle') return; d3.select(ev.target).attr('fill-opacity', 0.4); bp_tipHide(); });
    }
  }
}
function bp_scheduleRenderData(t) {
  bp_lastT = t; if (bp_renderRaf) return; bp_renderRaf = true;
  requestAnimationFrame(() => { bp_renderRaf = false; bp_renderData(bp_lastT); });
}

function bp_sizeLegend(g, rScale, maxN, PW, PH, bigFmt) {
  const refs = [1, Math.round(maxN / 4), maxN].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  if (refs.length < 2) return;
  const fs = bigFmt ? 22 : 11;
  const baseX = bigFmt ? 24 : 14, baseY = PH - (bigFmt ? 24 : 16);
  const lg = g.append('g').attr('transform', `translate(${baseX},${baseY})`);
  lg.append('text').attr('x', 0).attr('y', -2 * rScale(maxN) - (bigFmt ? 10 : 6))
    .style('font-family', 'var(--sans)').style('font-size', fs + 'px').style('font-weight', 600)
    .attr('fill', 'var(--ink-soft)').text(bp_t('c8-legend-size', 'Jugadores nacidos ahí'));
  let x = rScale(maxN);
  refs.forEach(v => {
    const r = rScale(v);
    lg.append('circle').attr('cx', x).attr('cy', -r).attr('r', r)
      .attr('fill', 'none').attr('stroke', BP_ACCENT).attr('stroke-width', bigFmt ? 1.6 : 1);
    lg.append('text').attr('x', x).attr('y', 2 + (bigFmt ? 8 : 4)).attr('text-anchor', 'middle')
      .style('font-family', 'var(--sans)').style('font-size', (fs - 1) + 'px')
      .attr('fill', 'var(--ink-soft)').style('font-variant-numeric', 'tabular-nums').text(v);
    x += rScale(maxN) + (bigFmt ? 30 : 18);
  });
}

function bp_scopeNote(g, period, PW, bigFmt) {
  g.append('text').attr('x', PW - (bigFmt ? 10 : 6)).attr('y', bigFmt ? 30 : 18)
    .attr('text-anchor', 'end').style('font-family', 'var(--serif)')
    .style('font-size', (bigFmt ? 28 : 15) + 'px').style('font-weight', 700)
    .attr('fill', 'var(--ink)').text(bp_scopeLabel(period));
}
function bp_scopeLabel(period) {
  const [a, b] = period, ymin = BIRTH.years[0], ymax = BIRTH.years[BIRTH.years.length - 1];
  if (a === b) return bp_t('c8-scope-year', 'Mundial de') + ' ' + a;
  if (a === ymin && b === ymax) return bp_t('c8-scope-all', 'Todos los Mundiales (1930-2026)');
  return bp_t('c8-scope-range', 'Mundiales') + ' ' + a + '–' + b;
}

//------------------------------------------------------------------
//  Vista RANKING (barras)
//------------------------------------------------------------------
function bp_drawBars(svg, W, H, opt) {
  const { bigFmt } = opt;
  const period = bp_period();
  const rows = bp_points(period).slice().sort((a, b) => b.n - a.n).slice(0, BP_TOPN);

  const fs = bigFmt ? 22 : 12.5;
  const M = { top: bigFmt ? 24 : 14, right: bigFmt ? 92 : 52, bottom: bigFmt ? 28 : 18, left: bigFmt ? 360 : 208 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

  const maxN = d3.max(rows, d => d.n) || 1;
  const x = d3.scaleLinear().domain([0, maxN]).range([0, PW]);
  const y = d3.scaleBand().domain(rows.map((_, i) => i)).range([0, PH]).padding(0.26);
  const bh = y.bandwidth();

  svg.append('text').attr('x', W - M.right).attr('y', bigFmt ? 30 : 14).attr('text-anchor', 'end')
    .style('font-family', 'var(--serif)').style('font-size', (bigFmt ? 26 : 14) + 'px').style('font-weight', 700)
    .attr('fill', 'var(--ink-soft)').text(bp_scopeLabel(period));

  rows.forEach((d, i) => {
    const yy = y(i);
    g.append('rect').attr('x', 0).attr('y', yy).attr('width', Math.max(x(d.n), 1)).attr('height', bh)
      .attr('fill', BP_ACCENT).attr('rx', bigFmt ? 4 : 2);
    g.append('text').attr('x', -(bigFmt ? 14 : 8)).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').attr('fill', 'var(--ink)')
      .text(`${bp_cityName(d.c.c)} (${bp_countryName(d.c.iso)})`);
    g.append('text').attr('x', x(d.n) + (bigFmt ? 12 : 7)).attr('y', yy + bh / 2).attr('dy', '0.35em')
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').style('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums').attr('fill', 'var(--ink)').text(d.n);
  });
}

//------------------------------------------------------------------
//  Tooltip (mapa)
//------------------------------------------------------------------
function bp_tip(d) {
  const tt = document.getElementById('tooltip8'); if (!tt) return;
  const period = bp_period(), one = d.n === 1;
  const noun = one ? bp_t('c8-noun-1', 'jugador') : bp_t('c8-noun-n', 'jugadores');
  let scope;
  if (period[0] === period[1]) scope = bp_t('c8-tip-year', 'en el Mundial') + ' ' + period[0];
  else if (period[0] === BIRTH.years[0] && period[1] === BIRTH.years[BIRTH.years.length - 1]) scope = bp_t('c8-tip-all', '(todos los Mundiales)');
  else scope = bp_t('c8-tip-range', 'en los Mundiales') + ' ' + period[0] + '–' + period[1];
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${bp_cityName(d.c.c)}, ${bp_countryName(d.c.iso)}</div>`
    + `<div style="display:flex;align-items:center;gap:6px;"><strong style="font-variant-numeric:tabular-nums;">${d.n}</strong> <span>${noun} ${scope}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function bp_tipMove() {
  const tt = document.getElementById('tooltip8'); if (!tt) return;
  const svg = document.getElementById('chart8'); const rc = svg.getBoundingClientRect();
  const ev = bp_tipMove._e;
  if (ev) { tt.style.left = (ev.clientX - rc.left + 14) + 'px'; tt.style.top = (ev.clientY - rc.top + 14) + 'px'; }
}
function bp_tipHide() { const tt = document.getElementById('tooltip8'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

//------------------------------------------------------------------
//  Headings
//------------------------------------------------------------------
function bp_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="8"]') || document;
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = bp_t('c8-title', 'De dónde salen los mundialistas');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = bp_t('c8-subtitle', 'Ciudad de nacimiento de los jugadores de cada Mundial.');
}

//==================================================================
//  Controles
//==================================================================
function setupBirthplaceTabs() {
  const mapBtn = document.getElementById('bp-tab-map'), barsBtn = document.getElementById('bp-tab-bars');
  if (!mapBtn || !barsBtn) return;
  const mapOnly = document.getElementById('bp-map-controls');
  function sync() {
    const isMap = bp_view() === 'map';
    mapBtn.classList.toggle('lg-seg-on', isMap); barsBtn.classList.toggle('lg-seg-on', !isMap);
    mapBtn.setAttribute('aria-pressed', isMap); barsBtn.setAttribute('aria-pressed', !isMap);
    if (mapOnly) mapOnly.style.display = isMap ? '' : 'none';
  }
  mapBtn.addEventListener('click', () => { if (bp_view() !== 'map') { state[8].view = 'map'; sync(); drawBirthplace(); } });
  barsBtn.addEventListener('click', () => { if (bp_view() !== 'bars') { state[8].view = 'bars'; bp_zoomT = null; sync(); drawBirthplace(); } });
  sync();
}
function setupBirthplaceSlider() {
  setupWcRangeSlider({
    fromId: 'bp-slider-from', toId: 'bp-slider-to', dispId: 'bp-range-display', trackId: 'bp-range-track-active',
    years: BIRTH.years,
    get: () => bp_period(), set: (p) => { state[8].period = p; },
    onChange: () => bp_scheduleDraw()
  });
}
function setupBirthplaceHeatToggle() {
  const btn = document.getElementById('bp-heat-toggle'); if (!btn) return;
  function sync() { const on = bp_isHeat(); btn.classList.toggle('lg-toggle-on', on); btn.setAttribute('aria-pressed', on); }
  btn.addEventListener('click', () => { state[8].heat = !state[8].heat; sync(); drawBirthplace(); });
  sync();
}
function setupBirthplaceZoomReset() {
  const btn = document.getElementById('bp-reset-zoom'); if (!btn) return;
  btn.addEventListener('click', () => {
    bp_zoomT = null;
    const svg = d3.select('#chart8');
    if (bp_zoom) svg.transition().duration(300).call(bp_zoom.transform, d3.zoomIdentity);
  });
}
function setupBirthplaceCSV() {
  document.querySelectorAll('button.download[data-chart="8-csv"]').forEach(btn => btn.addEventListener('click', () => {
    // export all-time por ciudad (jugadores únicos)
    const counts = bp_cityCounts([BIRTH.years[0], BIRTH.years[BIRTH.years.length - 1]]);
    let csv = 'city,country_iso,lat,lon,players_alltime\n';
    BIRTH.cities.forEach((c, ci) => {
      const nm = /[",]/.test(c.c) ? '"' + c.c.replace(/"/g, '""') + '"' : c.c;
      csv += `${nm},${c.iso},${c.lat},${c.lon},${counts.get(ci) || 0}\n`;
    });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-03-lugares-nacimiento.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function initBirthplace() {
  if (!state[8]) state[8] = {};
  if (!state[8].view) state[8].view = 'map';
  if (!state[8].period) state[8].period = [BIRTH.years[0], BIRTH.years[BIRTH.years.length - 1]];
  if (state[8].heat == null) state[8].heat = false;
  bp_loadGeo();
  drawBirthplace();
  setupBirthplaceTabs();
  setupBirthplaceSlider();
  setupBirthplaceHeatToggle();
  setupBirthplaceZoomReset();
  setupBirthplaceCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initBirthplace._wired) { initBirthplace._wired = true; window.addEventListener('atlas-editor-change', () => drawBirthplace()); }
  document.getElementById('chart8')?.addEventListener('mousemove', (e) => { bp_tipMove._e = e; });

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawBirthplace;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '8') return null;
    return (typeof t === 'function' ? t('c8-sources-tpl') : '') || null;
  };
}
