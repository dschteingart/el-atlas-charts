// =============================================================
//  El Atlas N°5 — Chart 3: mapa mundial de la intolerancia
// =============================================================
// Coroplético del % que no querría de vecino a cada tipo de persona, por país.
// El "mapa viral del Washington Post 2013" hecho bien: ventana temporal única
// (último dato 2017-2022, año en el tooltip), selector de categoría, bins de %
// FIJOS (comparables entre categorías). Proyección Robinson vanilla (sin D3/CDN:
// funciona offline y sin red). Geo: GEO_COUNTRIES (data-country-geo.js, id=iso3).
//
// Datos: VE_FOTO[cat] = [[iso3,pct,year,study,n],...] (data-vecinos.js).

const MP_SVG_NS = 'http://www.w3.org/2000/svg';
const mp_ns = (t) => document.createElementNS(MP_SVG_NS, t);
const MP_W = 1100, MP_H = 580, MP_PAD = 10;
const MP_DEFAULT_CAT = 'otra_raza';
const MP_NODATA = '#DAD5C8';
// Bins de % FIJOS (absolutos) → el mapa es comparable entre categorías.
const MP_BREAKS = [2, 5, 10, 20, 40];
const MP_COLORS = ['#F4E4CE', '#E8B98C', '#D98E5B', '#C0632F', '#8F3F1E', '#5A2412'];
const MP_STROKE = 'rgba(255,255,255,0.5)';

let mp_geo = null, mp_proj = null;   // {scale, tx, ty}

function mp_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function mp_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function mp_isoOf(f) { return f.id || (f.properties && f.properties.iso) || null; }

// ---- Proyección Robinson (tabla estándar de coeficientes por 5° de latitud) ----
const MP_RB_X = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
const MP_RB_Y = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];
function mp_robinson(lon, lat) {
  const a = Math.min(Math.abs(lat), 89.999) / 5;
  const i = Math.min(17, Math.floor(a)), fr = a - i;
  const X = MP_RB_X[i] + (MP_RB_X[i + 1] - MP_RB_X[i]) * fr;
  const Y = MP_RB_Y[i] + (MP_RB_Y[i + 1] - MP_RB_Y[i]) * fr;
  const x = 0.8487 * X * (lon * Math.PI / 180);
  const y = 1.3523 * Y * (lat < 0 ? -1 : 1);
  return [x, y];
}

// Calcula scale+translate para encajar toda la geometría en el plot.
function mp_fit() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const scan = (coords, depth) => {
    if (depth === 0) { const [x, y] = mp_robinson(coords[0], coords[1]); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    else for (const c of coords) scan(c, depth - 1);
  };
  mp_geo.features.forEach(f => {
    if (!f.geometry) return;
    const d = f.geometry.type === 'Polygon' ? 2 : 3;
    scan(f.geometry.coordinates, d);
  });
  const gw = maxX - minX, gh = maxY - minY;
  const availW = MP_W - MP_PAD * 2, availH = MP_H - MP_PAD * 2;
  const scale = Math.min(availW / gw, availH / gh);
  const tx = MP_PAD + (availW - gw * scale) / 2 - minX * scale;
  const ty = MP_PAD + (availH - gh * scale) / 2 + maxY * scale;   // y invertida
  mp_proj = { scale, tx, ty, minX, maxY };
}
function mp_project(lon, lat) {
  const [x, y] = mp_robinson(lon, lat);
  return [mp_proj.tx + x * mp_proj.scale, mp_proj.ty - y * mp_proj.scale];
}
// Construye el path 'd' de un feature (Polygon o MultiPolygon). Corta el ring
// en el ANTIMERIDIANO (salto de longitud >180° entre puntos consecutivos): sin
// esto, países como EE.UU./Rusia/Fiji/N.Zelanda/Kiribati que cruzan ±180 dibujan
// una raya de lado a lado del mapa (Robinson vanilla no hace el corte que D3 sí).
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

function mp_colorFor(pct) {
  if (pct == null) return MP_NODATA;
  let i = 0; for (const b of MP_BREAKS) { if (pct < b) return MP_COLORS[i]; i++; }
  return MP_COLORS[MP_COLORS.length - 1];
}

// {iso3: {pct, year, n}} para la categoría actual.
function mp_dataFor(cat) {
  const map = {};
  ((typeof VE_FOTO !== 'undefined') ? (VE_FOTO[cat] || []) : []).forEach(r => { map[r[0]] = { pct: r[1], year: r[2], n: r[4] }; });
  return map;
}

function mp_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c3-subtitle-tpl"]');
  if (!el) return;
  const catA = (typeof t === 'function') ? t('catA-' + state[3].cat) : state[3].cat;
  const tpl = (typeof t === 'function') ? t('c3-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA);
}

function drawMapa() {
  const svg = document.getElementById('chart3');
  if (!svg || !mp_geo) return;
  svg.innerHTML = '';
  mp_updateSubtitle();
  if (!mp_proj) mp_fit();
  svg.setAttribute('viewBox', `0 0 ${MP_W} ${MP_H}`);
  if (typeof applyFormatWrapper === 'function' && typeof getActivePngFormat === 'function') {
    applyFormatWrapper(svg, getActivePngFormat());
  }

  const cat = state[3].cat;
  const data = mp_dataFor(cat);

  // landmask (fondo gris "sin dato"). Es un Feature → usar .geometry.
  const lmGeom = mp_geo.landmask && (mp_geo.landmask.geometry || (mp_geo.landmask.type !== 'Feature' ? mp_geo.landmask : null));
  if (lmGeom) {
    const lm = mp_ns('path'); lm.setAttribute('d', mp_pathD(lmGeom));
    lm.setAttribute('fill', MP_NODATA); lm.setAttribute('stroke', 'none'); lm.setAttribute('pointer-events', 'none');
    svg.appendChild(lm);
  }

  // países (grandes primero para que enclaves chicos queden arriba)
  const feats = mp_geo.features.slice().filter(f => f.geometry);
  const g = mp_ns('g'); svg.appendChild(g);
  feats.forEach(f => {
    const iso = mp_isoOf(f);
    const v = data[iso];
    const path = mp_ns('path');
    path.setAttribute('d', mp_pathD(f.geometry));
    path.setAttribute('fill', mp_colorFor(v ? v.pct : null));
    path.setAttribute('stroke', MP_STROKE); path.setAttribute('stroke-width', 0.5);
    path.dataset.iso = iso;
    path.addEventListener('mouseenter', (e) => { path.setAttribute('stroke', '#1A1A1A'); path.setAttribute('stroke-width', 1.4); path.parentNode.appendChild(path); mp_showTooltip(e, iso, v); });
    path.addEventListener('mousemove', (e) => mp_posTooltip(e));
    path.addEventListener('mouseleave', () => { path.setAttribute('stroke', MP_STROKE); path.setAttribute('stroke-width', 0.5); mp_hideTooltip(); });
    path.addEventListener('click', (e) => mp_showTooltip(e, iso, v));
    g.appendChild(path);
  });

  // leyenda de bins (discreta, abajo-izquierda sobre el Pacífico)
  mp_drawLegend(svg);

  // título insight→neutral (insight solo en la categoría default)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('3', false, { title: 'c3-title', titleNeutral: 'c3-title-neutral' });
  }
}

function mp_drawLegend(svg) {
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const big = !!editorFormat || mp_isMobile();
  const sw = big ? 26 : 18, sh = big ? 15 : 11, fs = big ? 21 : 11.5;
  const x0 = big ? 20 : 18, y0 = MP_H - (big ? 150 : 118);
  const labels = ['<2%', '2–5', '5–10', '10–20', '20–40', '≥40%'];
  const g = mp_ns('g'); svg.appendChild(g);
  const title = mp_ns('text');
  title.setAttribute('x', x0); title.setAttribute('y', y0 - (big ? 12 : 8));
  title.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  title.style.fontSize = fs + 'px'; title.setAttribute('font-weight', 600); title.setAttribute('fill', '#3A3530');
  title.textContent = (typeof t === 'function') ? t('c3-legend-title') : '% que lo rechaza';
  g.appendChild(title);
  MP_COLORS.forEach((col, i) => {
    const y = y0 + i * (sh + (big ? 8 : 5));
    const r = mp_ns('rect'); r.setAttribute('x', x0); r.setAttribute('y', y); r.setAttribute('width', sw); r.setAttribute('height', sh);
    r.setAttribute('fill', col); r.setAttribute('stroke', 'rgba(0,0,0,0.12)'); r.setAttribute('stroke-width', 0.5); g.appendChild(r);
    const tx = mp_ns('text'); tx.setAttribute('x', x0 + sw + (big ? 10 : 7)); tx.setAttribute('y', y + sh * 0.82);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = fs + 'px';
    tx.setAttribute('fill', '#3A3530'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = labels[i]; g.appendChild(tx);
  });
  // sin dato
  const ny = y0 + MP_COLORS.length * (sh + (big ? 8 : 5)) + (big ? 6 : 4);
  const nr = mp_ns('rect'); nr.setAttribute('x', x0); nr.setAttribute('y', ny); nr.setAttribute('width', sw); nr.setAttribute('height', sh);
  nr.setAttribute('fill', MP_NODATA); nr.setAttribute('stroke', 'rgba(0,0,0,0.12)'); nr.setAttribute('stroke-width', 0.5); g.appendChild(nr);
  const nt = mp_ns('text'); nt.setAttribute('x', x0 + sw + (big ? 10 : 7)); nt.setAttribute('y', ny + sh * 0.82);
  nt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); nt.style.fontSize = fs + 'px'; nt.setAttribute('fill', '#3A3530');
  nt.textContent = (typeof t === 'function') ? t('c3-legend-nodata') : 'Sin dato'; g.appendChild(nt);
}

function mp_showTooltip(e, iso, v) {
  const tt = document.getElementById('tooltip3'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  if (!v) {
    tt.innerHTML = `<strong>${mp_name(iso)}</strong><div class="tt-row tt-muted">${L('c3-tt-nodata')}</div>`;
  } else {
    tt.innerHTML = `<strong>${mp_name(iso)}</strong>`
      + `<div class="tt-row"><span>${L('c1-tt-pct')}</span><span>${(typeof fmt === 'function') ? fmt(v.pct, 1) : v.pct}%</span></div>`
      + `<div class="tt-row tt-row-sub"><span>${L('c3-tt-year')}</span><span>${v.year}</span></div>`;
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
function setupMapaCSV() {
  document.querySelectorAll('button.download[data-chart="3-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — mapa de rechazo de vecinos (IVS, ultimo dato 2017-2022)\n';
      csv += 'iso3,pais,categoria,pct,anio,n\n';
      (typeof VE_CATS !== 'undefined' ? VE_CATS : Object.keys(VE_FOTO)).forEach(cat => {
        (VE_FOTO[cat] || []).forEach(r => {
          const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? COUNTRY_NAMES[r[0]].en : r[0];
          csv += `${r[0]},${nm},${cat},${r[1]},${r[2]},${r[4]}\n`;
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
  if (!state[3]) state[3] = { cat: MP_DEFAULT_CAT };
  const sel = document.getElementById('mp-cat-select'); if (sel) sel.value = state[3].cat;
  setupMapaCat(); setupMapaCSV();
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
