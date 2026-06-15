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

function bp_dims(fmt, mobile, view) {
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    const f = PNG_FORMATS[fmt];
    return { W: f.vbW, H: view === 'bars' ? Math.max(f.vbH, 760) : f.vbH };
  }
  if (mobile) return { W: 1100, H: view === 'bars' ? 1180 : 720 };
  return { W: 1100, H: view === 'bars' ? 600 : 600 };
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
  if (typeof GEO_COUNTRIES === 'undefined') { console.error('[birthplace] GEO_COUNTRIES no cargado'); return; }
  bp_geo = GEO_COUNTRIES;
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
  const heat = bp_isHeat();

  bp_projection = d3.geoRobinson().fitSize([PW, PH], bp_geo);
  bp_path = d3.geoPath(bp_projection);

  const root = svg.append('g').attr('transform', `translate(${M},${M})`);
  // clip para que el zoom no derrame fuera del viewBox
  svg.append('defs').append('clipPath').attr('id', 'bp-clip').append('rect')
    .attr('x', -M).attr('y', -M).attr('width', W).attr('height', H);
  root.attr('clip-path', 'url(#bp-clip)');
  const gZoom = root.append('g');   // capa zoomable (base + datos)

  // backdrop países
  gZoom.append('g').attr('class', 'bp-land').selectAll('path').data(bp_geo.features).join('path')
    .attr('d', bp_path).attr('fill', BP_LAND).attr('stroke', BP_LAND_STROKE).attr('stroke-width', 0.5);

  const pts = bp_points(period);
  const maxN = d3.max(pts, d => d.n) || 1;

  if (heat) {
    // mapa de calor: densidad ponderada por nº de jugadores
    const xy = d => { const p = bp_projection([d.c.lon, d.c.lat]); return p || [-9999, -9999]; };
    const dens = d3.contourDensity().x(d => xy(d)[0]).y(d => xy(d)[1])
      .weight(d => d.n).size([PW, PH]).bandwidth(bigFmt ? 26 : 18).thresholds(18)(pts);
    const maxV = d3.max(dens, d => d.value) || 1;
    const color = d3.scaleSequential(d3.interpolateRgbBasis(BP_HEAT_RAMP)).domain([0, maxV]);
    gZoom.append('g').attr('class', 'bp-heat').selectAll('path').data(dens).join('path')
      .attr('d', d3.geoPath()).attr('fill', d => color(d.value)).attr('fill-opacity', 0.78)
      .attr('stroke', 'none');
  } else {
    // burbujas: borde definido + relleno translúcido → las solapadas se ven
    const maxR = bigFmt ? 32 : 19;
    const rScale = d3.scaleSqrt().domain([0, maxN]).range([0, maxR]);
    gZoom.append('g').attr('class', 'bp-dots').selectAll('circle').data(pts).join('circle')
      .attr('cx', d => { const p = bp_projection([d.c.lon, d.c.lat]); return p ? p[0] : -9999; })
      .attr('cy', d => { const p = bp_projection([d.c.lon, d.c.lat]); return p ? p[1] : -9999; })
      .attr('r', d => rScale(d.n))
      .attr('fill', BP_ACCENT).attr('fill-opacity', 0.4)
      .attr('stroke', BP_ACCENT_DARK).attr('stroke-width', bigFmt ? 1.1 : 0.8).attr('stroke-opacity', 0.85)
      .each(function (d) {
        if (isPngFormat || (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER)) return;
        const sel = d3.select(this);
        sel.style('cursor', 'pointer');
        sel.on('mouseenter', function () { d3.select(this).attr('fill-opacity', 0.85).raise(); bp_tip(d); })
          .on('mousemove', () => bp_tipMove())
          .on('mouseleave', function () { d3.select(this).attr('fill-opacity', 0.4); bp_tipHide(); });
      });
    bp_sizeLegend(root, rScale, maxN, PW, PH, bigFmt);
  }

  bp_scopeNote(root, period, PW, bigFmt);

  // zoom (solo en pantalla, no en PNG)
  if (!isPngFormat) {
    bp_zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [PW, PH]])
      .on('zoom', (ev) => { gZoom.attr('transform', ev.transform); bp_zoomT = ev.transform; });
    svg.call(bp_zoom);
    if (bp_zoomT) { svg.call(bp_zoom.transform, bp_zoomT); }  // re-aplicar zoom previo tras redraw
  }
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
    onChange: () => drawBirthplace()
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
