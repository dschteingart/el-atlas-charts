// =============================================================
//  El Atlas N°5 — Chart 3: mapa mundial de la intolerancia
// =============================================================
// Coroplético del % que no querría de vecino a cada tipo de persona, por país.
// El "mapa viral del WaPo 2013" hecho bien: selector de categoría, SLIDER de ola
// con PLAY (ver cómo cambia en el tiempo), año en el tooltip. Escala de color
// ADAPTATIVA por categoría (cuantiles → siempre se ven diferencias, aun en
// drogadictos donde todos son altos). Hover con overlay (no muta los países, así
// no quedan contornos marcados). Tooltip con sparkline de la trayectoria (OWID).
// Proyección Robinson vanilla (sin D3/CDN). Antártida excluida.
//
// Datos: WV_FOTO[cat][wave] = [[iso3,pct,year,n,evs,wvs],...] (data-waves.js).

const MP_SVG_NS = 'http://www.w3.org/2000/svg';
const mp_ns = (t) => document.createElementNS(MP_SVG_NS, t);
const MP_W = 1100, MP_H = 560, MP_PAD = 10;
const MP_DEFAULT_CAT = 'otra_raza';
const MP_NODATA = '#DAD5C8';
const MP_EXCLUDE = new Set(['ATA']);   // Antártida fuera
const MP_NBINS = 6;
const MP_COLORS = ['#F4E4CE', '#E8B98C', '#D98E5B', '#C0632F', '#8F3F1E', '#5A2412'];
const MP_STROKE = 'rgba(255,255,255,0.55)';
const MP_STROKE_HOVER = '#1A1A1A';

let mp_geo = null, mp_proj = null, mp_featCache = null, mp_playTimer = null;

function mp_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function mp_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function mp_isoOf(f) { return f.id || (f.properties && f.properties.iso) || null; }
function mp_waves() { return (typeof WV_META !== 'undefined') ? WV_META : [{ w: 7, label: '2017-2022' }]; }
function mp_waveLabel(w) { const m = mp_waves().find(x => x.w === w); return m ? m.label : '' + w; }

// ---- Proyección Robinson (tabla estándar por 5° de latitud) ----
const MP_RB_X = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
const MP_RB_Y = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];
function mp_robinson(lon, lat) {
  const a = Math.min(Math.abs(lat), 89.999) / 5;
  const i = Math.min(17, Math.floor(a)), fr = a - i;
  const X = MP_RB_X[i] + (MP_RB_X[i + 1] - MP_RB_X[i]) * fr;
  const Y = MP_RB_Y[i] + (MP_RB_Y[i + 1] - MP_RB_Y[i]) * fr;
  return [0.8487 * X * (lon * Math.PI / 180), 1.3523 * Y * (lat < 0 ? -1 : 1)];
}
// features SIN Antártida (para fit + dibujo).
function mp_features() {
  if (!mp_featCache) mp_featCache = mp_geo.features.filter(f => f.geometry && !MP_EXCLUDE.has(mp_isoOf(f)));
  return mp_featCache;
}
function mp_fit() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const scan = (coords, depth) => {
    if (depth === 0) { const [x, y] = mp_robinson(coords[0], coords[1]); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    else for (const c of coords) scan(c, depth - 1);
  };
  mp_features().forEach(f => scan(f.geometry.coordinates, f.geometry.type === 'Polygon' ? 2 : 3));
  const gw = maxX - minX, gh = maxY - minY;
  const availW = MP_W - MP_PAD * 2, availH = MP_H - MP_PAD * 2;
  const scale = Math.min(availW / gw, availH / gh);
  mp_proj = { scale, tx: MP_PAD + (availW - gw * scale) / 2 - minX * scale, ty: MP_PAD + (availH - gh * scale) / 2 + maxY * scale };
}
function mp_project(lon, lat) { const [x, y] = mp_robinson(lon, lat); return [mp_proj.tx + x * mp_proj.scale, mp_proj.ty - y * mp_proj.scale]; }
// path 'd' con corte del antimeridiano (EE.UU./Rusia/Fiji/NZ/Kiribati).
function mp_pathD(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let d = '';
  polys.forEach(poly => poly.forEach(ring => {
    let open = false;
    ring.forEach((pt, i) => {
      const [x, y] = mp_project(pt[0], pt[1]);
      const jump = i > 0 && Math.abs(pt[0] - ring[i - 1][0]) > 180;
      if (i === 0 || jump) { if (open) d += 'Z'; d += 'M' + x.toFixed(1) + ',' + y.toFixed(1); open = true; }
      else d += 'L' + x.toFixed(1) + ',' + y.toFixed(1);
    });
    if (open) d += 'Z';
  }));
  return d;
}

// {iso: {pct, year, n}} de la ola activa.
function mp_dataFor(cat, wave) {
  const map = {};
  const rows = (typeof WV_FOTO !== 'undefined' && WV_FOTO[cat] && WV_FOTO[cat][wave]) ? WV_FOTO[cat][wave]
    : (typeof VE_FOTO !== 'undefined' ? (VE_FOTO[cat] || []).map(r => [r[0], r[1], r[2], r[4]]) : []);
  rows.forEach(r => { map[r[0]] = { pct: r[1], year: r[2], n: r[3] }; });
  return map;
}
// trayectoria de un país a lo largo de las olas: [[year, pct], ...] (para el sparkline).
function mp_trajectory(iso, cat) {
  if (typeof WV_FOTO === 'undefined' || !WV_FOTO[cat]) return [];
  const out = [];
  mp_waves().forEach(m => {
    const rows = WV_FOTO[cat][m.w]; if (!rows) return;
    const r = rows.find(x => x[0] === iso); if (r) out.push([r[2], r[1]]);
  });
  return out.sort((a, b) => a[0] - b[0]);
}

// Cortes ADAPTATIVOS por cuantiles de los valores de la categoría/ola → 5 breaks
// (6 bins), redondeados y deduplicados. Así la escala se estira al rango real y
// se ven diferencias aun cuando todos los países son altos (drogadictos).
function mp_breaks(values) {
  const v = values.filter(x => x != null).sort((a, b) => a - b);
  if (v.length < MP_NBINS) return v.length ? [...new Set(v)] : [50];
  const dec = (v[v.length - 1] - v[0]) < 12;   // rango chico → 1 decimal
  const round = (x) => dec ? Math.round(x * 10) / 10 : Math.round(x);
  const breaks = [];
  for (let i = 1; i < MP_NBINS; i++) breaks.push(round(v[Math.floor(v.length * i / MP_NBINS)]));
  return [...new Set(breaks)];
}
function mp_colorFor(pct, breaks) {
  if (pct == null) return MP_NODATA;
  let i = 0; for (const b of breaks) { if (pct < b) return MP_COLORS[i]; i++; }
  return MP_COLORS[Math.min(i, MP_COLORS.length - 1)];
}

function mp_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c3-subtitle-tpl"]');
  if (!el) return;
  const catA = (typeof t === 'function') ? t('catA-' + state[3].cat) : state[3].cat;
  const tpl = (typeof t === 'function') ? t('c3-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA).replace('{PERIODO}', mp_waveLabel(state[3].wave));
}

function drawMapa() {
  const svg = document.getElementById('chart3');
  if (!svg || !mp_geo) return;
  svg.innerHTML = '';
  mp_updateSubtitle();
  if (!mp_proj) mp_fit();
  svg.setAttribute('viewBox', `0 0 ${MP_W} ${MP_H}`);
  if (typeof applyFormatWrapper === 'function' && typeof getActivePngFormat === 'function') applyFormatWrapper(svg, getActivePngFormat());

  const cat = state[3].cat, wave = state[3].wave;
  const data = mp_dataFor(cat, wave);
  const breaks = mp_breaks(Object.values(data).map(d => d.pct));

  // landmask gris "sin dato"
  const lmGeom = mp_geo.landmask && (mp_geo.landmask.geometry || (mp_geo.landmask.type !== 'Feature' ? mp_geo.landmask : null));
  if (lmGeom) {
    const lm = mp_ns('path'); lm.setAttribute('d', mp_pathD(lmGeom));
    lm.setAttribute('fill', MP_NODATA); lm.setAttribute('stroke', 'none'); lm.setAttribute('pointer-events', 'none');
    svg.appendChild(lm);
  }

  // países
  const g = mp_ns('g'); svg.appendChild(g);
  // overlay de hover: un solo path encima, sin mutar los países (así NO quedan
  // contornos marcados al pasar el mouse — bug reportado por Daniel 2026-07-23).
  const hoverPath = mp_ns('path');
  hoverPath.setAttribute('class', 'mp-hover'); hoverPath.setAttribute('fill', 'none');
  hoverPath.setAttribute('stroke', MP_STROKE_HOVER); hoverPath.setAttribute('stroke-width', 1.5);
  hoverPath.setAttribute('pointer-events', 'none'); hoverPath.setAttribute('d', '');

  mp_features().forEach(f => {
    const iso = mp_isoOf(f), v = data[iso], d = mp_pathD(f.geometry);
    const path = mp_ns('path');
    path.setAttribute('d', d);
    path.setAttribute('fill', mp_colorFor(v ? v.pct : null, breaks));
    path.setAttribute('stroke', MP_STROKE); path.setAttribute('stroke-width', 0.5);
    path.style.cursor = 'pointer';
    path.addEventListener('mouseenter', (e) => { hoverPath.setAttribute('d', d); mp_showTooltip(e, iso, v, cat); });
    path.addEventListener('mousemove', (e) => mp_posTooltip(e));
    path.addEventListener('mouseleave', () => { hoverPath.setAttribute('d', ''); mp_hideTooltip(); });
    path.addEventListener('click', (e) => { hoverPath.setAttribute('d', d); mp_showTooltip(e, iso, v, cat); });
    g.appendChild(path);
  });
  svg.appendChild(hoverPath);

  mp_drawLegend(svg, breaks);

  if (typeof atlasSetHeading === 'function') atlasSetHeading('3', false, { title: 'c3-title', titleNeutral: 'c3-title-neutral' });
}

function mp_drawLegend(svg, breaks) {
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const big = !!editorFormat || mp_isMobile();
  const sw = big ? 26 : 18, sh = big ? 15 : 11, fs = big ? 21 : 11.5;
  const x0 = big ? 20 : 18, y0 = MP_H - (big ? 150 : 118);
  // etiquetas adaptativas: "<b1", "b1–b2", ..., "≥bN"
  const labels = [];
  for (let i = 0; i <= breaks.length; i++) {
    if (i === 0) labels.push('<' + breaks[0] + '%');
    else if (i === breaks.length) labels.push('≥' + breaks[breaks.length - 1] + '%');
    else labels.push(breaks[i - 1] + '–' + breaks[i]);
  }
  const g = mp_ns('g'); svg.appendChild(g);
  const title = mp_ns('text');
  title.setAttribute('x', x0); title.setAttribute('y', y0 - (big ? 12 : 8));
  title.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  title.style.fontSize = fs + 'px'; title.setAttribute('font-weight', 600); title.setAttribute('fill', '#3A3530');
  title.textContent = (typeof t === 'function') ? t('c3-legend-title') : '% que lo rechaza';
  g.appendChild(title);
  labels.forEach((lab, i) => {
    const y = y0 + i * (sh + (big ? 8 : 5));
    const r = mp_ns('rect'); r.setAttribute('x', x0); r.setAttribute('y', y); r.setAttribute('width', sw); r.setAttribute('height', sh);
    r.setAttribute('fill', MP_COLORS[Math.min(i, MP_COLORS.length - 1)]); r.setAttribute('stroke', 'rgba(0,0,0,0.12)'); r.setAttribute('stroke-width', 0.5); g.appendChild(r);
    const tx = mp_ns('text'); tx.setAttribute('x', x0 + sw + (big ? 10 : 7)); tx.setAttribute('y', y + sh * 0.82);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = fs + 'px';
    tx.setAttribute('fill', '#3A3530'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = lab; g.appendChild(tx);
  });
  const ny = y0 + labels.length * (sh + (big ? 8 : 5)) + (big ? 6 : 4);
  const nr = mp_ns('rect'); nr.setAttribute('x', x0); nr.setAttribute('y', ny); nr.setAttribute('width', sw); nr.setAttribute('height', sh);
  nr.setAttribute('fill', MP_NODATA); nr.setAttribute('stroke', 'rgba(0,0,0,0.12)'); nr.setAttribute('stroke-width', 0.5); g.appendChild(nr);
  const nt = mp_ns('text'); nt.setAttribute('x', x0 + sw + (big ? 10 : 7)); nt.setAttribute('y', ny + sh * 0.82);
  nt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); nt.style.fontSize = fs + 'px'; nt.setAttribute('fill', '#3A3530');
  nt.textContent = (typeof t === 'function') ? t('c3-legend-nodata') : 'Sin dato'; g.appendChild(nt);
}

// Sparkline (OWID): mini serie de la trayectoria del país a lo largo de las olas.
function mp_sparkline(traj, curYear) {
  if (traj.length < 2) return '';
  const W = 132, H = 38, pad = 4;
  const xs = traj.map(p => p[0]), ys = traj.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), yMax = Math.max(...ys, 1);
  const X = (yr) => pad + (x1 === x0 ? 0.5 : (yr - x0) / (x1 - x0)) * (W - pad * 2);
  const Y = (v) => H - pad - (v / yMax) * (H - pad * 2);
  const d = traj.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
  let dots = '';
  traj.forEach(p => { const isCur = p[0] === curYear; dots += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${isCur ? 3.2 : 1.8}" fill="${isCur ? '#BE5D32' : '#FFFFFF'}" stroke="#BE5D32" stroke-width="1.2"/>`; });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;margin-top:5px;overflow:visible;">`
    + `<path d="${d}" fill="none" stroke="#BE5D32" stroke-width="1.6" stroke-linejoin="round"/>${dots}`
    + `<text x="${X(x0).toFixed(1)}" y="${H}" font-size="8.5" fill="#8A8579" text-anchor="start">${x0}</text>`
    + `<text x="${X(x1).toFixed(1)}" y="${H}" font-size="8.5" fill="#8A8579" text-anchor="end">${x1}</text></svg>`;
}

function mp_showTooltip(e, iso, v, cat) {
  const tt = document.getElementById('tooltip3'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  if (!v) {
    tt.innerHTML = `<strong>${mp_name(iso)}</strong><div class="tt-row tt-muted">${L('c3-tt-nodata')}</div>`;
  } else {
    const traj = mp_trajectory(iso, cat);
    tt.innerHTML = `<strong>${mp_name(iso)}</strong>`
      + `<div class="tt-row"><span>${L('c1-tt-pct')}</span><span>${(typeof fmt === 'function') ? fmt(v.pct, 1) : v.pct}%</span></div>`
      + `<div class="tt-row tt-row-sub"><span>${L('c3-tt-year')}</span><span>${v.year}</span></div>`
      + (traj.length >= 2 ? `<div class="tt-sub" style="margin-top:4px;">${L('c3-tt-trend')}</div>` + mp_sparkline(traj, v.year) : '');
  }
  tt.style.display = 'block'; tt.style.opacity = '1';
  mp_posTooltip(e);
}
function mp_posTooltip(e) {
  const tt = document.getElementById('tooltip3'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function mp_hideTooltip() { const tt = document.getElementById('tooltip3'); if (tt) tt.style.opacity = '0'; }

function setupMapaCat() {
  const sel = document.getElementById('mp-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof VE_FOTO === 'undefined' || !VE_FOTO[sel.value]) return;
    state[3].cat = sel.value; drawMapa();
  });
}

// Slider de ola + botón PLAY (anima 1ra→última ola y frena al final).
function setupMapaWave() {
  const input = document.getElementById('mp-wave-slider');
  const disp = document.getElementById('mp-wave-display');
  const playBtn = document.getElementById('mp-play');
  if (!input || typeof WV_META === 'undefined' || !WV_META.length) {
    const grp = document.getElementById('mp-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = WV_META;
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  const sync = () => { input.value = idxOf(state[3].wave); if (disp) disp.textContent = mp_waveLabel(state[3].wave); };
  input.addEventListener('input', () => {
    mp_stopPlay();
    state[3].wave = waves[+input.value].w;
    if (disp) disp.textContent = mp_waveLabel(state[3].wave);
    drawMapa();
  });
  if (playBtn) playBtn.addEventListener('click', () => {
    if (mp_playTimer) { mp_stopPlay(); return; }
    playBtn.classList.add('playing'); playBtn.textContent = '❚❚';
    // arrancar desde la 1ra ola
    state[3].wave = waves[0].w; sync(); drawMapa();
    mp_playTimer = setInterval(() => {
      const cur = idxOf(state[3].wave);
      if (cur >= waves.length - 1) { mp_stopPlay(); return; }
      state[3].wave = waves[cur + 1].w; sync(); drawMapa();
    }, 1100);
  });
  sync();
}
function mp_stopPlay() {
  if (mp_playTimer) { clearInterval(mp_playTimer); mp_playTimer = null; }
  const playBtn = document.getElementById('mp-play');
  if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶'; }
}

function setupMapaCSV() {
  document.querySelectorAll('button.download[data-chart="3-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — mapa de rechazo de vecinos (IVS, por ola)\n';
      csv += 'iso3,pais,categoria,ola,periodo,pct,anio,n\n';
      const waves = (typeof WV_META !== 'undefined') ? WV_META : [{ w: 7, label: '2017-2022' }];
      (typeof VE_CATS !== 'undefined' ? VE_CATS : Object.keys(VE_FOTO)).forEach(cat => {
        waves.forEach(m => {
          const rows = (typeof WV_FOTO !== 'undefined' && WV_FOTO[cat]) ? WV_FOTO[cat][m.w] : null;
          (rows || []).forEach(r => {
            const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? COUNTRY_NAMES[r[0]].en : r[0];
            csv += `${r[0]},${nm},${cat},${m.w},${m.label},${r[1]},${r[2]},${r[3]}\n`;
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-neighbours-map.csv' : 'el-atlas-05-mapa-vecinos.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initMapa() {
  if (typeof GEO_COUNTRIES === 'undefined') { console.error('[mapa] GEO_COUNTRIES no cargado'); return; }
  mp_geo = GEO_COUNTRIES;
  const lastWave = (typeof WV_META !== 'undefined' && WV_META.length) ? WV_META[WV_META.length - 1].w : 7;
  if (!state[3]) state[3] = { cat: MP_DEFAULT_CAT, wave: lastWave };
  if (state[3].wave == null) state[3].wave = lastWave;
  const sel = document.getElementById('mp-cat-select'); if (sel) sel.value = state[3].cat;
  setupMapaCat(); setupMapaWave(); setupMapaCSV();
  drawMapa();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawMapa;
  window.__atlasDefaultPngFormat = 'worldmap';
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initMapa._wired) { initMapa._wired = true; window.addEventListener('atlas-editor-change', () => drawMapa()); }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '3') return null;
    return (typeof t === 'function') ? t('c3-sources') : null;
  };
}
