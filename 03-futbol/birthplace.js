// =============================================================
//  El Atlas N°3 (anexo mundiales) — Chart 8: lugares de nacimiento
// =============================================================
// ¿De dónde salen los mundialistas? Dos vistas (pestañas):
//   - MAPA: un punto por ciudad de nacimiento, tamaño ∝ nº de jugadores.
//   - RANKING: top de ciudades por nº de jugadores (barras).
// Selector de año: "Todos" (jugadores únicos, all-time) o un Mundial puntual
// (jugadores del plantel de ese Mundial).
//
// Stack: D3 v7 + d3-geo-projection (Robinson) + GEO_COUNTRIES (data-country-geo.js),
// mismo mapa base que el chart 3 principal. Datos: BIRTH (data-birthplace.js).

//==================================================================
//  Constantes
//==================================================================
const BP_ACCENT = '#BE5D32';        // puntos / barras (terracota El Atlas)
const BP_LAND = '#ECE7DD';          // relleno de los países (backdrop)
const BP_LAND_STROKE = '#FFFFFF';
const BP_TOPN = 15;                 // barras del ranking

let bp_geo = null, bp_projection = null, bp_path = null;

function bp_dims(fmt, mobile, view) {
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    const f = PNG_FORMATS[fmt];
    return { W: f.vbW, H: view === 'bars' ? Math.max(f.vbH, 900) : f.vbH };
  }
  if (mobile) return { W: 1100, H: view === 'bars' ? 1200 : 720 };
  return { W: 1100, H: view === 'bars' ? 820 : 600 };
}

const BP_NS = 'http://www.w3.org/2000/svg';

//==================================================================
//  Helpers
//==================================================================
function bp_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function bp_countryName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso][lang]) return COUNTRY_NAMES[iso][lang];
  return iso;
}
function bp_year() { return (state[8] && state[8].year) || 'all'; }
function bp_view() { return (state[8] && state[8].view) || 'map'; }
function bp_count(item, year) { return year === 'all' ? item.tot : (item.y[year] || 0); }
function bp_loadGeo() {
  if (bp_geo) return;
  if (typeof GEO_COUNTRIES === 'undefined') { console.error('[birthplace] GEO_COUNTRIES no cargado'); return; }
  bp_geo = GEO_COUNTRIES;
}
function bp_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }

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
//  Vista MAPA
//------------------------------------------------------------------
function bp_drawMapView(svg, W, H, opt) {
  const { bigFmt, isPngFormat } = opt;
  if (!bp_geo) return;
  const M = 8;
  const PW = W - 2 * M, PH = H - 2 * M;
  const year = bp_year();

  bp_projection = d3.geoRobinson().fitSize([PW, PH], bp_geo);
  bp_path = d3.geoPath(bp_projection);

  const g = svg.append('g').attr('transform', `translate(${M},${M})`);

  // backdrop: países
  g.append('g').selectAll('path').data(bp_geo.features).join('path')
    .attr('d', bp_path).attr('fill', BP_LAND)
    .attr('stroke', BP_LAND_STROKE).attr('stroke-width', 0.5);

  // ciudades con conteo > 0 en el alcance elegido
  const pts = BIRTH.cities
    .map(c => ({ c, n: bp_count(c, year) }))
    .filter(d => d.n > 0)
    .sort((a, b) => a.n - b.n);            // grandes al final → arriba
  const maxN = d3.max(pts, d => d.n) || 1;
  const maxR = bigFmt ? 34 : 20;
  const rScale = d3.scaleSqrt().domain([0, maxN]).range([0, maxR]);

  const dotsG = g.append('g');
  dotsG.selectAll('circle').data(pts).join('circle')
    .attr('cx', d => { const p = bp_projection([d.c.lon, d.c.lat]); return p ? p[0] : -9999; })
    .attr('cy', d => { const p = bp_projection([d.c.lon, d.c.lat]); return p ? p[1] : -9999; })
    .attr('r', d => rScale(d.n))
    .attr('fill', BP_ACCENT).attr('fill-opacity', 0.5)
    .attr('stroke', '#FFFFFF').attr('stroke-width', bigFmt ? 1 : 0.6)
    .each(function (d) {
      if (isPngFormat || (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER)) return;
      const sel = d3.select(this);
      sel.style('cursor', 'pointer');
      sel.on('mouseenter', function () { d3.select(this).attr('fill-opacity', 0.85); bp_tip(d); })
        .on('mousemove', () => bp_tipMove())
        .on('mouseleave', function () { d3.select(this).attr('fill-opacity', 0.5); bp_tipHide(); });
    });

  bp_sizeLegend(g, rScale, maxN, PW, PH, bigFmt);
  bp_scopeNote(g, year, PW, bigFmt);
}

// Leyenda de tamaño (2-3 círculos de referencia, abajo a la izquierda)
function bp_sizeLegend(g, rScale, maxN, PW, PH, bigFmt) {
  const refs = [1, Math.round(maxN / 4), maxN].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  if (refs.length < 2) return;
  const fs = bigFmt ? 22 : 11;
  const baseX = bigFmt ? 24 : 14, baseY = PH - (bigFmt ? 24 : 16);
  const lg = g.append('g').attr('transform', `translate(${baseX},${baseY})`);
  const maxRef = rScale(maxN);
  let x = maxRef;
  lg.append('text').attr('x', 0).attr('y', -2 * maxRef - (bigFmt ? 10 : 6))
    .style('font-family', 'var(--sans)').style('font-size', fs + 'px').style('font-weight', 600)
    .attr('fill', 'var(--ink-soft)').text(bp_t('c8-legend-size', 'Jugadores nacidos ahí'));
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

// Nota de alcance arriba a la derecha (qué año / cuántos jugadores)
function bp_scopeNote(g, year, PW, bigFmt) {
  const txt = year === 'all'
    ? bp_t('c8-scope-all', 'Todos los Mundiales (1930-2026)')
    : bp_t('c8-scope-year', 'Mundial de') + ' ' + year;
  g.append('text').attr('x', PW - (bigFmt ? 10 : 6)).attr('y', bigFmt ? 30 : 18)
    .attr('text-anchor', 'end').style('font-family', 'var(--serif)')
    .style('font-size', (bigFmt ? 28 : 15) + 'px').style('font-weight', 700)
    .attr('fill', 'var(--ink)').text(txt);
}

//------------------------------------------------------------------
//  Vista RANKING (barras)
//------------------------------------------------------------------
function bp_drawBars(svg, W, H, opt) {
  const { bigFmt } = opt;
  const year = bp_year();
  const rows = BIRTH.cities
    .map(c => ({ c, n: bp_count(c, year) }))
    .filter(d => d.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, BP_TOPN);

  const fs = bigFmt ? 24 : 13;
  const M = { top: bigFmt ? 24 : 16, right: bigFmt ? 92 : 54, bottom: bigFmt ? 30 : 20, left: bigFmt ? 360 : 210 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

  const maxN = d3.max(rows, d => d.n) || 1;
  const x = d3.scaleLinear().domain([0, maxN]).range([0, PW]);
  const y = d3.scaleBand().domain(rows.map((_, i) => i)).range([0, PH]).padding(0.28);
  const bh = y.bandwidth();

  // scope note
  svg.append('text').attr('x', W - M.right).attr('y', bigFmt ? 30 : 16).attr('text-anchor', 'end')
    .style('font-family', 'var(--serif)').style('font-size', (bigFmt ? 26 : 14) + 'px').style('font-weight', 700)
    .attr('fill', 'var(--ink-soft)')
    .text(year === 'all' ? bp_t('c8-scope-all', 'Todos los Mundiales (1930-2026)') : (bp_t('c8-scope-year', 'Mundial de') + ' ' + year));

  rows.forEach((d, i) => {
    const yy = y(i);
    g.append('rect').attr('x', 0).attr('y', yy).attr('width', Math.max(x(d.n), 1)).attr('height', bh)
      .attr('fill', BP_ACCENT).attr('rx', bigFmt ? 4 : 2);
    // etiqueta ciudad (país)
    g.append('text').attr('x', -(bigFmt ? 14 : 8)).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').attr('fill', 'var(--ink)')
      .text(`${d.c.c} (${bp_countryName(d.c.iso)})`);
    // valor
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
  const yr = bp_year();
  const lbl = yr === 'all' ? bp_t('c8-tip-all', 'jugadores (todos los Mundiales)') : (bp_t('c8-tip-year', 'jugadores en el Mundial') + ' ' + yr);
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${d.c.c}, ${bp_countryName(d.c.iso)}</div>`
    + `<div style="display:flex;align-items:center;gap:6px;"><strong style="font-variant-numeric:tabular-nums;">${d.n}</strong> <span>${lbl}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function bp_tipMove() {
  const tt = document.getElementById('tooltip8'); if (!tt) return;
  const svg = document.getElementById('chart8'); const rc = svg.getBoundingClientRect();
  const ev = window.event || bp_tipMove._e;
  if (ev) { tt.style.left = (ev.clientX - rc.left + 14) + 'px'; tt.style.top = (ev.clientY - rc.top + 14) + 'px'; }
}
function bp_tipHide() { const tt = document.getElementById('tooltip8'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

//------------------------------------------------------------------
//  Headings (editor override)
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
//  Controles: pestañas + selector de año + CSV
//==================================================================
function setupBirthplaceTabs() {
  const mapBtn = document.getElementById('bp-tab-map'), barsBtn = document.getElementById('bp-tab-bars');
  if (!mapBtn || !barsBtn) return;
  function sync() {
    const isMap = bp_view() === 'map';
    mapBtn.classList.toggle('lg-seg-on', isMap); barsBtn.classList.toggle('lg-seg-on', !isMap);
    mapBtn.setAttribute('aria-pressed', isMap ? 'true' : 'false'); barsBtn.setAttribute('aria-pressed', !isMap ? 'true' : 'false');
  }
  mapBtn.addEventListener('click', () => { if (bp_view() !== 'map') { state[8].view = 'map'; sync(); drawBirthplace(); } });
  barsBtn.addEventListener('click', () => { if (bp_view() !== 'bars') { state[8].view = 'bars'; sync(); drawBirthplace(); } });
  sync();
}
function setupBirthplaceYear() {
  const sel = document.getElementById('bp-year'); if (!sel) return;
  // poblar: Todos + Mundiales (desc)
  const opts = ['<option value="all">' + bp_t('c8-year-all', 'Todos los Mundiales') + '</option>']
    .concat(BIRTH.years.slice().reverse().map(y => `<option value="${y}">${y}</option>`));
  sel.innerHTML = opts.join('');
  sel.value = bp_year();
  sel.addEventListener('change', () => { state[8].year = sel.value; drawBirthplace(); });
}
function setupBirthplaceCSV() {
  document.querySelectorAll('button.download[data-chart="8-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'scope,city,country_iso,lat,lon,players\n';
    BIRTH.cities.forEach(c => {
      const nm = /[",]/.test(c.c) ? '"' + c.c.replace(/"/g, '""') + '"' : c.c;
      csv += `all,${nm},${c.iso},${c.lat},${c.lon},${c.tot}\n`;
      Object.keys(c.y).forEach(y => { csv += `${y},${nm},${c.iso},${c.lat},${c.lon},${c.y[y]}\n`; });
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
  if (!state[8].year) state[8].year = 'all';
  bp_loadGeo();
  drawBirthplace();
  setupBirthplaceTabs();
  setupBirthplaceYear();
  setupBirthplaceCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initBirthplace._wired) { initBirthplace._wired = true; window.addEventListener('atlas-editor-change', () => drawBirthplace()); }

  // track mouse para el tooltip (d3 mousemove no expone el event nativo igual en todos los browsers)
  document.getElementById('chart8')?.addEventListener('mousemove', (e) => { bp_tipMove._e = e; });

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawBirthplace;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '8') return null;
    return (typeof t === 'function' ? t('c8-sources-tpl') : '') || null;
  };
}
