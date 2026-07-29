// El Atlas N°4 — Graficador V-Dem, vista MAPA (chart 22).
// CLON de mapa.js (Robinson vanilla, sin D3). Datos anuales de V-Dem.


// =============================================================
//  El Atlas N°4 — Chart 3: mapa mundial de la intolerancia
// =============================================================
// Coroplético del % que no querría de vecino a cada tipo de persona, por país.
// El "mapa viral del WaPo 2013" hecho bien: selector de categoría, SLIDER de ola
// con PLAY (ver cómo cambia en el tiempo), año en el tooltip. Escala de color
// ADAPTATIVA por categoría (cuantiles → siempre se ven diferencias, aun en
// drogadictos donde todos son altos). Hover con overlay (no muta los países, así
// no quedan contornos marcados). Tooltip con sparkline de la trayectoria (OWID).
// Proyección Robinson vanilla (sin D3/CDN). Antártida excluida.
//
// Datos: VD_SERIES[cat][wave] = [[iso3,pct,year,n,evs,wvs],...] (data-waves.js).

const VM_SVG_NS = 'http://www.w3.org/2000/svg';
const vm_ns = (t) => document.createElementNS(VM_SVG_NS, t);
const VM_W = 1100, VM_H = 560, VM_PAD = 10;
const VM_DEFAULT_CAT = 'v2xpe_exlsocgr';
const VM_NODATA = '#DAD5C8';
const VM_EXCLUDE = new Set(['ATA']);   // Antártida fuera
const VM_NBINS = 6;
const VM_COLORS = ['#F4E4CE', '#E8B98C', '#D98E5B', '#C0632F', '#8F3F1E', '#5A2412'];
// Bordes al estilo OWID: un stroke por país, no un contorno de costa aparte.
// El primer intento dibujaba el borde del landmask encima de los países, pero el
// landmask está simplificado distinto que los polígonos nacionales y las dos
// líneas no coincidían → doble contorno corrido (reporte de Daniel). Con stroke
// en cada país la costa sale sola y calza perfecto.
// Gris cálido MEDIO a propósito: más oscuro que los rellenos claros y más claro
// que los oscuros, así el borde se ve en toda la escala (un gris oscuro
// desaparecería en el bin #5A2412, donde Irán/Irak/Turquía se pegan).
const VM_STROKE = '#8C8376';
const VM_STROKE_W = 0.5;
const VM_STROKE_HOVER = '#1A1A1A';
const VM_HALO_HOVER = '#FFFFFF';   // halo debajo del hover: lo hace legible sobre rellenos oscuros

let vm_geo = null, vm_proj = null, vm_featCache = null, vm_playTimer = null;
// Duracion total de la animacion, del primer anio al ultimo (mismo criterio y
// mismos nombres que el scatter: VE_PLAY_TOTAL_MS / VE_PLAY_MS_MIN).
const VM_PLAY_TOTAL_MS = 10000;
const VM_PLAY_MS_MIN = 40;   // piso: por debajo el navegador no llega a repintar

function vm_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function vm_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function vm_isoOf(f) { return f.id || (f.properties && f.properties.iso) || null; }
function vm_waves() { return vd_yearList(state[22].cat); }
function vm_waveLabel(w) { const m = vm_waves().find(x => x.w === w); return m ? m.label : '' + w; }

// ---- Proyección Robinson (tabla estándar por 5° de latitud) ----
const VM_RB_X = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
const VM_RB_Y = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];
function vm_robinson(lon, lat) {
  const a = Math.min(Math.abs(lat), 89.999) / 5;
  const i = Math.min(17, Math.floor(a)), fr = a - i;
  const X = VM_RB_X[i] + (VM_RB_X[i + 1] - VM_RB_X[i]) * fr;
  const Y = VM_RB_Y[i] + (VM_RB_Y[i + 1] - VM_RB_Y[i]) * fr;
  return [0.8487 * X * (lon * Math.PI / 180), 1.3523 * Y * (lat < 0 ? -1 : 1)];
}
// features SIN Antártida (para fit + dibujo).
function vm_features() {
  if (!vm_featCache) vm_featCache = vm_geo.features.filter(f => f.geometry && !VM_EXCLUDE.has(vm_isoOf(f)));
  return vm_featCache;
}
function vm_fit() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const scan = (coords, depth) => {
    if (depth === 0) { const [x, y] = vm_robinson(coords[0], coords[1]); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    else for (const c of coords) scan(c, depth - 1);
  };
  vm_features().forEach(f => scan(f.geometry.coordinates, f.geometry.type === 'Polygon' ? 2 : 3));
  const gw = maxX - minX, gh = maxY - minY;
  const availW = VM_W - VM_PAD * 2, availH = VM_H - VM_PAD * 2;
  const scale = Math.min(availW / gw, availH / gh);
  vm_proj = { scale, tx: VM_PAD + (availW - gw * scale) / 2 - minX * scale, ty: VM_PAD + (availH - gh * scale) / 2 + maxY * scale };
}
function vm_project(lon, lat) { const [x, y] = vm_robinson(lon, lat); return [vm_proj.tx + x * vm_proj.scale, vm_proj.ty - y * vm_proj.scale]; }
// path 'd' con corte del antimeridiano (EE.UU./Rusia/Fiji/NZ/Kiribati).
function vm_pathD(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let d = '';
  polys.forEach(poly => poly.forEach(ring => {
    let open = false;
    ring.forEach((pt, i) => {
      const [x, y] = vm_project(pt[0], pt[1]);
      const jump = i > 0 && Math.abs(pt[0] - ring[i - 1][0]) > 180;
      if (i === 0 || jump) { if (open) d += 'Z'; d += 'M' + x.toFixed(1) + ',' + y.toFixed(1); open = true; }
      else d += 'L' + x.toFixed(1) + ',' + y.toFixed(1);
    });
    if (open) d += 'Z';
  }));
  return d;
}

// {iso: {pct, year, n}} de la ola activa.
function vm_dataFor(cat, wave) {
  const rows = vd_foto(cat, wave);
  const out = {};
  for (let i = 0; i < rows.length; i++) {
    out[rows[i][0]] = { pct: rows[i][1], year: rows[i][2], n: rows[i][3] };
  }
  return out;
}
// trayectoria de un país a lo largo de las olas: [[year, pct], ...] (para el sparkline).
function vm_trajectory(iso, cat) {
  // Serie ANUAL del país. El clon recorría las olas de la batería del barrio y
  // devolvía siempre [], así que el sparkline del tooltip no aparecía nunca.
  if (typeof VD_SERIES === 'undefined' || !VD_SERIES[cat]) return [];
  const s = VD_SERIES[cat][iso];
  if (!s) return [];
  const div = vd_scaleOf(cat);
  const out = [];
  for (let i = 0; i < s[1].length; i++) {
    const v = s[1][i];
    if (v === null || v === undefined) continue;
    out.push([s[0] + i, v / div]);
  }
  return out;
}

// Cortes ADAPTATIVOS por cuantiles de los valores de la categoría/ola → 5 breaks
// (6 bins), redondeados y deduplicados. Así la escala se estira al rango real y
// se ven diferencias aun cuando todos los países son altos (drogadictos).
function vm_breaks(values) {
  const v = values.filter(x => x != null).sort((a, b) => a - b);
  if (v.length < VM_NBINS) return v.length ? [...new Set(v)] : [50];
  // Rango chico (indice 0-1, componentes ~-3,5 a 3,5) → dos decimales: con uno
  // solo, medio mundo caia en el mismo corte.
  const dec = (v[v.length - 1] - v[0]) < 12;
  const round = (x) => dec ? Math.round(x * 100) / 100 : Math.round(x);
  const breaks = [];
  for (let i = 1; i < VM_NBINS; i++) breaks.push(round(v[Math.floor(v.length * i / VM_NBINS)]));
  return [...new Set(breaks)];
}
// Devuelve una geometría sin los polígonos antárticos (todo su extremo norte
// por debajo de -55°). Se usa para el landmask, que viene como un único
// MultiPolygon de toda la tierra.
// Cortes FIJOS por variable, sobre TODOS los anios y paises. Se recalculaban con
// los valores del anio mostrado, asi que la escala saltaba al mover el slider: el
// mismo color significaba cosas distintas en 1902 y en 2023, y la leyenda cambiaba
// entera durante la animacion. Cacheado por variable.
function vm_breaksFor(cat) {
  if (!vm_breaksFor._c) vm_breaksFor._c = {};
  if (vm_breaksFor._c[cat]) return vm_breaksFor._c[cat];
  const src = (typeof VD_SERIES !== 'undefined' && VD_SERIES[cat]) ? VD_SERIES[cat] : {};
  const div = vd_scaleOf(cat);
  const vals = [];
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    if (typeof VD_REGION !== 'undefined' && !VD_REGION[iso]) continue;
    const arr = src[iso][1];
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v !== null && v !== undefined) vals.push(v / div);
    }
  }
  vm_breaksFor._c[cat] = vm_breaks(vals);
  return vm_breaksFor._c[cat];
}

function vm_dropAntarctic(geom) {
  const keep = (poly) => {
    let maxLat = -90;
    poly.forEach(ring => ring.forEach(pt => { if (pt[1] > maxLat) maxLat = pt[1]; }));
    return maxLat > -55;
  };
  if (geom.type === 'Polygon') return keep(geom.coordinates) ? geom : { type: 'Polygon', coordinates: [] };
  return { type: 'MultiPolygon', coordinates: geom.coordinates.filter(keep) };
}

// Si la variable apunta al revés (componentes: más = mejor), se invierte la
// rampa para que el color oscuro signifique SIEMPRE lo peor.
function vm_ramp() {
  return vd_peorEsMas(state[22].cat) ? VM_COLORS : VM_COLORS.slice().reverse();
}
function vm_colorFor(pct, breaks) {
  if (pct == null) return VM_NODATA;
  let i = 0; for (const b of breaks) { if (pct < b) return vm_ramp()[i]; i++; }
  return vm_ramp()[Math.min(i, VM_COLORS.length - 1)];
}

function vm_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c22-subtitle-tpl"]');
  if (!el) return;
  // El texto custom del editor manda (criterio 5 de la auditoria): si Daniel
  // escribio un subtitulo en ?nl=1, no se pisa en cada redibujo. Las otras dos
  // vistas del graficador ya lo hacian; esta era la unica que no.
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  if (ae && ae.texts && ae.texts[lang] && (ae.texts[lang].subtitle || '').trim()) return;
  // El nombre del indicador sale de VD_VARS: 'catA-'+cat es una clave de la
  // batería del barrio y acá se imprimía cruda ("catA-v2xpe_exlsocgr").
  const catA = vd_varLabelOf(state[22].cat);
  const tpl = (typeof t === 'function') ? t('c22-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA).replace('{PERIODO}', vm_waveLabel(state[22].wave));
}

function drawVdemMapa() {
  const svg = document.getElementById('chart22');
  if (!svg || !vm_geo) return;
  svg.innerHTML = '';
  vm_updateSubtitle();
  if (!vm_proj) vm_fit();
  svg.setAttribute('viewBox', `0 0 ${VM_W} ${VM_H}`);
  if (typeof applyFormatWrapper === 'function' && typeof getActivePngFormat === 'function') applyFormatWrapper(svg, getActivePngFormat());

  const cat = state[22].cat, wave = state[22].wave;
  const data = vm_dataFor(cat, wave);
  const breaks = vm_breaksFor(cat);

  // landmask gris "sin dato". OJO: el landmask es UN MultiPolygon de toda la
  // tierra e incluye la Antártida — filtrar solo el feature ATA no alcanzaba y
  // seguía dibujándose (reporte de Daniel). Se descartan los polígonos cuyo
  // extremo norte cae por debajo de -55° (la Antártida, entera bajo -60°).
  const lmGeom = vm_geo.landmask && (vm_geo.landmask.geometry || (vm_geo.landmask.type !== 'Feature' ? vm_geo.landmask : null));
  if (lmGeom) {
    const lm = vm_ns('path'); lm.setAttribute('d', vm_pathD(vm_dropAntarctic(lmGeom)));
    lm.setAttribute('fill', VM_NODATA); lm.setAttribute('stroke', 'none'); lm.setAttribute('pointer-events', 'none');
    svg.appendChild(lm);
  }

  // países
  const g = vm_ns('g'); svg.appendChild(g);
  // overlay de hover: un solo path encima, sin mutar los países (así NO quedan
  // contornos marcados al pasar el mouse — bug reportado por Daniel 2026-07-23).
  // Dos trazos: halo blanco abajo + línea negra arriba, así el país resaltado se
  // lee igual sobre un relleno claro que sobre el terracota más oscuro.
  const hoverHalo = vm_ns('path');
  hoverHalo.setAttribute('class', 'vm-hover-halo'); hoverHalo.setAttribute('fill', 'none');
  hoverHalo.setAttribute('stroke', VM_HALO_HOVER); hoverHalo.setAttribute('stroke-width', 3.4);
  hoverHalo.setAttribute('stroke-linejoin', 'round'); hoverHalo.setAttribute('pointer-events', 'none');
  hoverHalo.setAttribute('d', '');
  const hoverPath = vm_ns('path');
  hoverPath.setAttribute('class', 'vm-hover'); hoverPath.setAttribute('fill', 'none');
  hoverPath.setAttribute('stroke', VM_STROKE_HOVER); hoverPath.setAttribute('stroke-width', 1.7);
  hoverPath.setAttribute('stroke-linejoin', 'round');
  hoverPath.setAttribute('pointer-events', 'none'); hoverPath.setAttribute('d', '');
  const vm_setHover = (d) => { hoverHalo.setAttribute('d', d); hoverPath.setAttribute('d', d); };

  vm_features().forEach(f => {
    const iso = vm_isoOf(f), v = data[iso], d = vm_pathD(f.geometry);
    const path = vm_ns('path');
    path.setAttribute('d', d);
    path.setAttribute('data-iso', iso);   // lo usa vm_paintYear() para repintar
    path.setAttribute('fill', vm_colorFor(v ? v.pct : null, breaks));
    path.setAttribute('stroke', VM_STROKE); path.setAttribute('stroke-width', VM_STROKE_W);
    path.setAttribute('stroke-linejoin', 'round');
    path.style.cursor = 'pointer';
    // El dato se lee del estado en el momento del hover, no del cierre: durante
    // la animacion los rellenos cambian sin redibujar y el cierre quedaria viejo.
    const datoAhora = () => vm_dataFor(state[22].cat, state[22].wave)[iso];
    path.addEventListener('mouseenter', (e) => { vm_setHover(d); vm_showTooltip(e, iso, datoAhora(), state[22].cat); });
    path.addEventListener('mousemove', (e) => vm_posTooltip(e));
    path.addEventListener('mouseleave', () => { vm_setHover(''); vm_hideTooltip(); });
    path.addEventListener('click', (e) => { vm_setHover(d); vm_showTooltip(e, iso, datoAhora(), state[22].cat); });
    g.appendChild(path);
  });
  svg.appendChild(hoverHalo);
  svg.appendChild(hoverPath);

  vm_drawLegend(svg, breaks);

  if (typeof atlasSetHeading === 'function') atlasSetHeading('22', false, { title: 'c22-title', titleNeutral: 'c22-title-neutral' });
}

function vm_drawLegend(svg, breaks) {
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const big = !!editorFormat || vm_isMobile();
  const sw = big ? 26 : 18, sh = big ? 15 : 11, fs = big ? 21 : 11.5;
  const x0 = big ? 20 : 18, y0 = VM_H - (big ? 150 : 118);
  // etiquetas adaptativas: "<b1", "b1–b2", ..., "≥bN"
  const labels = [];
  for (let i = 0; i <= breaks.length; i++) {
    if (i === 0) labels.push('<' + vd_fmtVal(breaks[0]));
    else if (i === breaks.length) labels.push('≥' + vd_fmtVal(breaks[breaks.length - 1]));
    // Los cortes intermedios salían crudos ("0.1–0.2") mientras el primero y
    // el último ya pasaban por vd_fmtVal: mismo formato para los tres.
    else {
      // Con cortes negativos (los componentes) el guion pegado daba "-1,58–-0,57":
      // ahí el rango se escribe con espacios para que se lea.
      const a = vd_fmtVal(breaks[i - 1]), b = vd_fmtVal(breaks[i]);
      labels.push((breaks[i - 1] < 0 || breaks[i] < 0) ? (a + ' – ' + b) : (a + '–' + b));
    }
  }
  const g = vm_ns('g'); svg.appendChild(g);
  const title = vm_ns('text');
  title.setAttribute('x', x0); title.setAttribute('y', y0 - (big ? 12 : 8));
  title.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  title.style.fontSize = fs + 'px'; title.setAttribute('font-weight', 600); title.setAttribute('fill', '#3A3530');
  title.textContent = (typeof t === 'function') ? t('c22-legend-title') : '% que lo rechaza';
  g.appendChild(title);
  labels.forEach((lab, i) => {
    const y = y0 + i * (sh + (big ? 8 : 5));
    const r = vm_ns('rect'); r.setAttribute('x', x0); r.setAttribute('y', y); r.setAttribute('width', sw); r.setAttribute('height', sh);
    r.setAttribute('fill', vm_ramp()[Math.min(i, VM_COLORS.length - 1)]); r.setAttribute('stroke', 'rgba(0,0,0,0.12)'); r.setAttribute('stroke-width', 0.5); g.appendChild(r);
    const tx = vm_ns('text'); tx.setAttribute('x', x0 + sw + (big ? 10 : 7)); tx.setAttribute('y', y + sh * 0.82);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); tx.style.fontSize = fs + 'px';
    tx.setAttribute('fill', '#3A3530'); tx.setAttribute('font-variant-numeric', 'tabular-nums'); tx.textContent = lab; g.appendChild(tx);
  });
  const ny = y0 + labels.length * (sh + (big ? 8 : 5)) + (big ? 6 : 4);
  const nr = vm_ns('rect'); nr.setAttribute('x', x0); nr.setAttribute('y', ny); nr.setAttribute('width', sw); nr.setAttribute('height', sh);
  nr.setAttribute('fill', VM_NODATA); nr.setAttribute('stroke', 'rgba(0,0,0,0.12)'); nr.setAttribute('stroke-width', 0.5); g.appendChild(nr);
  const nt = vm_ns('text'); nt.setAttribute('x', x0 + sw + (big ? 10 : 7)); nt.setAttribute('y', ny + sh * 0.82);
  nt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif'); nt.style.fontSize = fs + 'px'; nt.setAttribute('fill', '#3A3530');
  nt.textContent = (typeof t === 'function') ? t('c22-legend-nodata') : 'Sin dato'; g.appendChild(nt);
}

// Sparkline (OWID): mini serie de la trayectoria del país a lo largo de las olas.
function vm_sparkline(traj, curYear) {
  if (traj.length < 2) return '';
  // AXIS_H reserva la banda de abajo para los dos anios: antes el trazo llegaba
  // hasta el borde y se montaba sobre las etiquetas.
  const W = 132, H = 46, pad = 4, AXIS_H = 12;
  const plotH = H - AXIS_H;
  const xs = traj.map(p => p[0]), ys = traj.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  // Escala entre el minimo y el maximo de la propia serie: medir contra 0 dejaba
  // fuera del recuadro a los componentes (centrados en 0, con negativos).
  const yLo = Math.min(...ys), yHi = Math.max(...ys), ySpan = (yHi - yLo) || 1;
  const X = (yr) => pad + (x1 === x0 ? 0.5 : (yr - x0) / (x1 - x0)) * (W - pad * 2);
  const Y = (v) => plotH - pad - ((v - yLo) / ySpan) * (plotH - pad * 2);
  const d = traj.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
  // Marcadores SOLO en el primero, el ultimo y el anio mostrado. Con 124 puntos
  // anuales, un circulo por observacion convertia la linea en un rosario.
  const first = traj[0], last = traj[traj.length - 1];
  const cur = traj.find(p => p[0] === curYear);
  const marks = [first, last];
  if (cur && cur !== first && cur !== last) marks.push(cur);
  let dots = '';
  marks.forEach(p => {
    const isCur = p[0] === curYear;
    dots += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${isCur ? 3 : 2.4}" `
         +  `fill="${isCur ? '#BE5D32' : '#FFFFFF'}" stroke="#BE5D32" stroke-width="1.2"/>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;margin-top:5px;overflow:visible;">`
    + `<path d="${d}" fill="none" stroke="#BE5D32" stroke-width="1.6" stroke-linejoin="round"/>${dots}`
    + `<text x="${X(x0).toFixed(1)}" y="${H - 1}" font-size="8.5" fill="#8A8579" text-anchor="start">${x0}</text>`
    + `<text x="${X(x1).toFixed(1)}" y="${H - 1}" font-size="8.5" fill="#8A8579" text-anchor="end">${x1}</text></svg>`;
}

function vm_showTooltip(e, iso, v, cat) {
  const tt = document.getElementById('tooltip22'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  if (!v) {
    tt.innerHTML = `<strong>${vm_name(iso)}</strong><div class="tt-row tt-muted">${L('c22-tt-nodata')}</div>`;
  } else {
    const traj = vm_trajectory(iso, cat);
    tt.innerHTML = `<strong>${vm_name(iso)}</strong>`
      + `<div class="tt-row"><span>${L('c22-tt-value')}</span><span>${vd_fmtVal(v.pct, 2)}</span></div>`
      + `<div class="tt-row tt-row-sub"><span>${L('c22-tt-year')}</span><span>${v.year}</span></div>`
      + (traj.length >= 2 ? `<div class="tt-sub" style="margin-top:4px;">${L('c22-tt-trend')}</div>` + vm_sparkline(traj, v.year) : '');
  }
  tt.style.display = 'block'; tt.style.opacity = '1';
  vm_posTooltip(e);
}
function vm_posTooltip(e) {
  const tt = document.getElementById('tooltip22'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function vm_hideTooltip() { const tt = document.getElementById('tooltip22'); if (tt) tt.style.opacity = '0'; }

function setupMapaCat() {
  const sel = document.getElementById('vm-cat-select'); if (!sel) return;
  sel.addEventListener('change', () => {
    // El guard preguntaba por VE_FOTO (la foto de la bateria de vecinos), que en
    // esta pagina no existe: el handler cortaba siempre y el selector de
    // indicador del mapa no hacia absolutamente nada.
    if (typeof VD_SERIES === 'undefined' || !VD_SERIES[sel.value]) return;
    vm_stopPlay();
    state[22].cat = sel.value;
    // El anio elegido puede caer fuera del rango de la variable nueva.
    const ys = vd_years(state[22].cat);
    if (ys.length) {
      state[22].wave = Math.min(Math.max(state[22].wave, ys[0]), ys[ys.length - 1]);
      const input = document.getElementById('vm-wave-slider');
      const disp = document.getElementById('vm-wave-display');
      if (input) {
        input.max = ys.length - 1;
        input.value = Math.max(0, ys.indexOf(state[22].wave));
      }
      if (disp) disp.textContent = vm_waveLabel(state[22].wave);
    }
    drawVdemMapa();
  });
}

// Slider de ola + botón PLAY (anima 1ra→última ola y frena al final).
function setupMapaWave() {
  const input = document.getElementById('vm-wave-slider');
  const disp = document.getElementById('vm-wave-display');
  const playBtn = document.getElementById('vm-play');
  if (!input) {
    const grp = document.getElementById('vm-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = vd_yearList(state[22].cat);
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  const sync = () => { input.value = idxOf(state[22].wave); if (disp) disp.textContent = vm_waveLabel(state[22].wave); };
  input.addEventListener('input', () => {
    vm_stopPlay();
    state[22].wave = waves[+input.value].w;
    if (disp) disp.textContent = vm_waveLabel(state[22].wave);
    drawVdemMapa();
  });
  if (playBtn) playBtn.addEventListener('click', () => {
    if (vm_playTimer) { vm_stopPlay(); return; }
    playBtn.classList.add('playing'); playBtn.textContent = '❚❚';
    // arrancar desde la 1ra ola
    state[22].wave = waves[0].w; sync(); drawVdemMapa();
    // Recorrer toda la serie en ~10 segundos (mismo criterio que el resto del
    // numero). Con 124 anios son ~81 ms por cuadro; el piso de 40 ms evita pedir
    // mas de 25 cuadros por segundo si alguna vez la serie es mas corta.
    const paso = Math.max(VM_PLAY_MS_MIN, Math.round(VM_PLAY_TOTAL_MS / Math.max(1, waves.length - 1)));
    vm_playTimer = setInterval(() => {
      const cur = idxOf(state[22].wave);
      if (cur >= waves.length - 1) { vm_stopPlay(); return; }
      vm_paintYear(waves[cur + 1].w); sync();
    }, paso);
  });
  sync();
}
// Repintado rapido: durante la animacion solo cambian los rellenos. La geometria
// y la leyenda son las mismas (la escala es fija por variable), y un redibujo
// completo cuesta ~73 ms, que no entra en los ~81 ms por anio que pide recorrer
// el siglo en 10 segundos.
function vm_paintYear(year) {
  const svg = document.getElementById('chart22');
  if (!svg) return;
  state[22].wave = year;
  const cat = state[22].cat;
  const data = vm_dataFor(cat, year);
  const breaks = vm_breaksFor(cat);
  svg.querySelectorAll('path[data-iso]').forEach(p => {
    const v = data[p.getAttribute('data-iso')];
    p.setAttribute('fill', vm_colorFor(v ? v.pct : null, breaks));
  });
  vm_updateSubtitle();
}

function vm_stopPlay() {
  if (vm_playTimer) { clearInterval(vm_playTimer); vm_playTimer = null; }
  const playBtn = document.getElementById('vm-play');
  if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶'; }
}

function setupMapaCSV() {
  document.querySelectorAll('button.download[data-chart="22-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      // El clon recorria las olas de la bateria de vecinos, que en V-Dem no
      // existen: el archivo salia vacio. Ahora es la foto del anio mostrado.
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const cat = state[22].cat, year = state[22].wave;
      let csv = '';
      csv += 'iso3,pais,variable,variable_label_en,anio,valor,puesto\n';
      const labQ = '"' + (vd_varMetaOf(cat).en || cat) + '"';
      vd_foto(cat, year).forEach(r => {
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0];
        const nmQ = (nm.indexOf(',') >= 0) ? '"' + nm + '"' : nm;
        csv += [r[0], nmQ, cat, labQ, r[2], r[1], r[4]].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-04-vdem-map.csv' : 'el-atlas-04-vdem-mapa.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initVdemMapa() {
  vd_fillVarSelect('vm-cat-select', VM_DEFAULT_CAT);
  if (typeof GEO_COUNTRIES === 'undefined') { console.error('[mapa] GEO_COUNTRIES no cargado'); return; }
  vm_geo = GEO_COUNTRIES;
  // V-Dem es anual: último año con dato de la variable por defecto.
  const _yrs = vd_years(VM_DEFAULT_CAT);
  const lastWave = _yrs[_yrs.length - 1];
  if (!state[22]) state[22] = { cat: VM_DEFAULT_CAT, wave: lastWave };
  if (state[22].wave == null) state[22].wave = lastWave;
  const sel = document.getElementById('vm-cat-select'); if (sel) sel.value = state[22].cat;
  setupMapaCat(); setupMapaWave(); setupMapaCSV();
  drawVdemMapa();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawVdemMapa;
  window.__atlasDefaultPngFormat = 'worldmap';
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initVdemMapa._wired) { initVdemMapa._wired = true; window.addEventListener('atlas-editor-change', () => drawVdemMapa()); }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '22') return null;
    return (typeof t === 'function') ? t('c22-sources') : null;
  };
}
