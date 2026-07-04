// =============================================================
//  Especial partidos — Chart 6: las capitales del fútbol (mapa)
// =============================================================
// Calcado del chart de lugares de nacimiento del N°3 (birthplace.js):
//   - MAPA: una burbuja por ciudad sede (área ∝ partidos), LOD con el zoom,
//           toggle burbujas ↔ mapa de calor (hexágonos / finos / iluminación),
//           leyenda de tamaño, sin etiquetas de ciudad, tooltip por burbuja.
//   - RANKING: top de ciudades por partidos (barras).
// Novedades de este chart: filtro por cancha neutral y por tipo de
// competencia, y slider temporal continuo (1872-2026).
//
// Datos: DATA_CIUDADES (meta liviano) + DATA_CIUDADES_DET (matriz
// año×categoría×neutral por ciudad, cargada bajo demanda al tocar filtros).
// Stack: D3 v7 + d3-geo-projection (Robinson) + GEO_COUNTRIES_LITE.

//==================================================================
//  Constantes (mismas del birthplace para que se vean idénticos)
//==================================================================
const CI_ACCENT = '#BE5D32';
const CI_ACCENT_DARK = '#8F3F22';   // borde de las burbujas (distingue solapadas)
const CI_LAND = '#F1ECE3';
const CI_LAND_STROKE = '#FFFFFF';
const CI_OCEAN = '#DED7C9';
const CI_TOPN = 15;
const CI_BASE_DOTS = 1200;          // ciudades visibles a zoom 1 (más al acercar)
const CI_HEAT_RAMP = ['#F6E7DC', '#E7AE89', '#CF7B4E', '#BE5D32', '#7A2E16'];
const CI_GLOW_MAX = 4000;
const CI_YMIN = 1872, CI_YMAX = 2026, CI_MIN_WINDOW = 5;
// Vista Evolución (líneas): paleta categórica SIN terracota (el terracota es el
// acento del tablero: usarlo para un país confunde). Colores distintos y
// alternando cálido/frío para que 3-4 líneas se lean bien. El color queda FIJO
// a cada ciudad/país elegido (no se reasigna al sacar otro).
const CI_LINE_PALETTE = ['#34688F', '#C9902F', '#5B8C4E', '#7D4F8C', '#A23E4C', '#3E9E9E'];
const CI_LINE_MAX = 6;
const CI_CONF_ORDER = ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
// Paleta por índice de competencia 0..6, ordenada para que la luminancia
// alterne oscuro/claro entre tramos vecinos (así no quedan varios oscuros
// seguidos). "Otros torneos" (6) va gris, como el "Otros" de la casa.
const CI_CAT_PALETTE = ['#2E5A88', '#D8A43C', '#8C2F3D', '#7FA968', '#5B3A7A', '#4FA3AE', '#CFC9BC'];

// Nombres de ciudad en español (la fuente los trae en inglés) — mismo
// diccionario del birthplace del N°3.
const CI_CITY_ES = {
  'Mexico City': 'Ciudad de México', 'Vienna': 'Viena', 'Rio de Janeiro': 'Río de Janeiro',
  'Moscow': 'Moscú', 'Belgrade': 'Belgrado', 'Tehran': 'Teherán', 'Prague': 'Praga',
  'Lisbon': 'Lisboa', 'Antwerp': 'Amberes', 'Bucharest': 'Bucarest', 'Gothenburg': 'Gotemburgo',
  'London': 'Londres', 'Copenhagen': 'Copenhague', 'Munich': 'Múnich', 'Cologne': 'Colonia',
  'Rome': 'Roma', 'Milan': 'Milán', 'Naples': 'Nápoles', 'Turin': 'Turín', 'Geneva': 'Ginebra',
  'Warsaw': 'Varsovia', 'Athens': 'Atenas', 'Cairo': 'El Cairo', 'Seoul': 'Seúl', 'Tokyo': 'Tokio',
  'Brussels': 'Bruselas', 'Saint Petersburg': 'San Petersburgo', 'Zurich': 'Zúrich', 'Genoa': 'Génova',
  'Florence': 'Florencia', 'Stockholm': 'Estocolmo', 'Hamburg': 'Hamburgo', 'Edinburgh': 'Edimburgo',
  'Dublin': 'Dublín', 'Bern': 'Berna', 'The Hague': 'La Haya', 'Sofia': 'Sofía', 'Bordeaux': 'Burdeos',
  'Marseille': 'Marsella', 'Krakow': 'Cracovia', 'Kyiv': 'Kiev', 'Kiev': 'Kiev',
  'Kuwait City': 'Ciudad de Kuwait', 'New York': 'Nueva York', 'Panama City': 'Ciudad de Panamá',
  'Guatemala City': 'Ciudad de Guatemala', 'Havana': 'La Habana', 'Nicosia': 'Nicosia',
  'Bangkok': 'Bangkok', 'Singapore': 'Singapur', 'Beijing': 'Pekín', 'Damascus': 'Damasco',
  'Baghdad': 'Bagdad', 'Jerusalem': 'Jerusalén', 'Basel': 'Basilea', 'Frankfurt': 'Fráncfort',
  'Nuremberg': 'Núremberg', 'Seville': 'Sevilla', 'Port of Spain': 'Puerto España'
};

let ci_geo = null, ci_projection = null, ci_path = null, ci_zoom = null, ci_zoomT = null;
let ci_baseStroke = 0.8, ci_rafPending = false;
let ci_vpts = null, ci_gData = null, ci_rScale = null, ci_maxN = 1;
let ci_PW = 0, ci_PH = 0, ci_bigFmt = false, ci_isPng = false;
let ci_recomputeTimer = null, ci_lastRenderT = null, ci_lastT = null;
let ci_detLoading = false;
let ci_ytCache = {};              // totales por año (denominador del share), por cat|neutral
let ci_renderCityChips = null;    // ref para refrescar chips al cambiar de pestaña
let ci_everTouched = false;       // una vez que el usuario toca algo, el título queda neutral
// Timelapse: anima el mapa año a año (acumulado o ventana móvil de 4 años)
let ci_tlPlaying = false, ci_tlTimer = null, ci_tlMode = 'ma', ci_tlWinYears = 8;
let ci_tlProj = null, ci_tlMaxFixed = 1, ci_tlYearSel = null, ci_tlRecording = false;
const CI_TL_STEP = 150;           // ms por año base (desde 1990); antes va más rápido

//==================================================================
//  Estado + helpers
//==================================================================
function ci_state() {
  if (!state[6]) state[6] = {};
  const s = state[6];
  if (!s.view) s.view = 'map';                    // 'map' | 'bars' | 'line'
  if (!s.period) s.period = [CI_YMIN, CI_YMAX];
  if (s.heat == null) s.heat = false;
  if (!s.heatStyle) s.heatStyle = 'glow';          // 'glow' | 'hexsmall' (iluminación por default)
  if (s.neutral == null) s.neutral = false;       // solo cancha neutral
  if (s.cat == null) s.cat = 'ALL';               // 'ALL' | 0..6 (índice de categoría)
  if (s.geo === undefined) s.geo = null;          // filtro por sede: {type:'conf'|'country', key}
  if (s.cities === undefined) s.cities = null;    // ciudades elegidas para la vista línea
  if (s.countries === undefined) s.countries = null; // países elegidos (unidad país)
  if (!s.lineMode) s.lineMode = 'abs';            // 'abs' | 'share'
  if (!s.unit) s.unit = 'city';                   // 'city' | 'country' (ranking y línea)
  if (!s.smooth) s.smooth = 'ma';                 // 'raw' | 'ma' (vista línea)
  if (!s.maYears) s.maYears = 4;
  if (s.stacked == null) s.stacked = false;       // barras apiladas por competencia
  return s;
}
function ci_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function ci_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }
function ci_isHeat() { return !!ci_state().heat && ci_state().view === 'map'; }
function ci_heatStyle() { return ci_state().heatStyle; }
function ci_isGlow() { return ci_isHeat() && ci_heatStyle() === 'glow'; }
function ci_cityName(n) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  return (lang === 'es' && CI_CITY_ES[n]) ? CI_CITY_ES[n] : n;
}
function ci_paisName(p) {
  return (typeof atlasCountryName === 'function') ? atlasCountryName(p) : p;
}
function ci_loadGeo() {
  if (ci_geo) return;
  if (typeof GEO_COUNTRIES_LITE !== 'undefined') { ci_geo = GEO_COUNTRIES_LITE; return; }
  if (typeof GEO_COUNTRIES !== 'undefined') { ci_geo = GEO_COUNTRIES; return; }
  console.error('[ciudades] geometría no cargada');
}
// Tierra sin la Antártida: así el año del timelapse queda limpio sobre el
// océano al sur, y el mapa no gasta alto en un continente sin ciudades.
let ci_geoLandCache = null;
function ci_geoLand() {
  if (ci_geoLandCache) return ci_geoLandCache;
  if (!ci_geo) return [];
  ci_geoLandCache = ci_geo.features.filter(f => {
    try { return d3.geoBounds(f)[1][1] > -55; } catch (e) { return true; }
  });
  return ci_geoLandCache;
}
function ci_filtersDefault() {
  const s = ci_state();
  return s.cat === 'ALL' && !s.neutral
    && s.period[0] === CI_YMIN && s.period[1] === CI_YMAX;
}

// ---- filtro por sede (país o confederación anfitriona) --------------------
function ci_geoMatch(c) {
  const g = ci_state().geo;
  if (!g) return true;
  return g.type === 'conf' ? c.cf === g.key : c.pais === g.key;
}
function ci_geoLabel() {
  const g = ci_state().geo; if (!g) return '';
  return g.type === 'conf' ? ci_t('c6-conf-' + g.key, g.key) : ci_paisName(g.key);
}
// pool para el buscador de sede: 6 confederaciones + países anfitriones
let ci_geoPoolCache = null;
function ci_geoPool() {
  if (ci_geoPoolCache) return ci_geoPoolCache;
  const byCountry = new Map(), byConf = new Map();
  DATA_CIUDADES.cities.forEach(c => {
    byCountry.set(c.pais, (byCountry.get(c.pais) || 0) + c.p);
    if (c.cf) byConf.set(c.cf, (byConf.get(c.cf) || 0) + c.p);
  });
  const confs = CI_CONF_ORDER.filter(cf => byConf.has(cf)).map(cf => ({ key: cf, total: byConf.get(cf) }));
  const countries = Array.from(byCountry.entries()).map(([k, v]) => ({ key: k, total: v }));
  ci_geoPoolCache = { confs, countries };
  return ci_geoPoolCache;
}

// ---- series por año (vista línea) -----------------------------------------
// Serie densa (índice = año - 1872) de partidos de UNA ciudad, respetando los
// filtros de competencia y cancha (no el de sede: la ciudad ya está elegida).
function ci_citySeries(ci) {
  const N = CI_YMAX - CI_YMIN + 1;
  const arr = new Array(N).fill(0);
  const m = ci_hasDet() ? DATA_CIUDADES_DET[ci] : null;
  if (!m) return arr;
  const s = ci_state();
  for (let k = 0; k < m.length; k++) {
    const code = m[k][1], cat = code >> 1, neu = code & 1;
    if (s.neutral && !neu) continue;
    if (s.cat !== 'ALL' && cat !== s.cat) continue;
    arr[m[k][0]] += m[k][2];
  }
  return arr;
}
// Total mundial por año (denominador del "share"), mismo filtro cat/cancha.
function ci_yearTotals(cat, neutral) {
  const key = cat + '|' + (neutral ? 1 : 0);
  if (ci_ytCache[key]) return ci_ytCache[key];
  const N = CI_YMAX - CI_YMIN + 1, arr = new Array(N).fill(0);
  if (!ci_hasDet()) return arr;
  for (let i = 0; i < DATA_CIUDADES_DET.length; i++) {
    const m = DATA_CIUDADES_DET[i]; if (!m) continue;
    for (let k = 0; k < m.length; k++) {
      const code = m[k][1], c = code >> 1, neu = code & 1;
      if (neutral && !neu) continue;
      if (cat !== 'ALL' && c !== cat) continue;
      arr[m[k][0]] += m[k][2];
    }
  }
  ci_ytCache[key] = arr;
  return arr;
}
// Color FIJO por ítem elegido: se asigna la primera ranura libre al agregar y
// se libera al sacar, así el color no salta cuando quitás otra línea (como en
// las series históricas del N°3).
let ci_lineColorMap = new Map();
function ci_colorIdxFor(key) {
  if (ci_lineColorMap.has(key)) return ci_lineColorMap.get(key);
  const used = new Set(ci_lineColorMap.values());
  let idx = 0; while (used.has(idx) && idx < CI_LINE_PALETTE.length) idx++;
  idx = idx % CI_LINE_PALETTE.length;
  ci_lineColorMap.set(key, idx);
  return idx;
}
function ci_colorFor(key) { return CI_LINE_PALETTE[ci_colorIdxFor(key)]; }
function ci_colorFree(key) { ci_lineColorMap.delete(key); }
function ci_colorReset() { ci_lineColorMap.clear(); }
function ci_lineKey(rawKey) { return (ci_state().unit === 'country' ? 'p' : 'c') + rawKey; }
// Promedio móvil hacia atrás de w años (w<=1 => crudo), como el mm4 de la casa.
function ci_maSeries(arr, w) {
  if (w <= 1) return arr.slice();
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let acc = 0, k = 0;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) { acc += arr[j]; k++; }
    out[i] = acc / k;
  }
  return out;
}

// ---- agregación por país (unidad "país") ----------------------------------
let ci_countryIdxCache = null;
function ci_countryIndex() {
  if (ci_countryIdxCache) return ci_countryIdxCache;
  const m = new Map();
  DATA_CIUDADES.cities.forEach((c, i) => {
    if (!m.has(c.pais)) m.set(c.pais, []);
    m.get(c.pais).push(i);
  });
  ci_countryIdxCache = m;
  return m;
}
function ci_countrySeries(pais) {
  const N = CI_YMAX - CI_YMIN + 1, out = new Array(N).fill(0);
  const idxs = ci_countryIndex().get(pais) || [];
  for (const i of idxs) { const s = ci_citySeries(i); for (let y = 0; y < N; y++) out[y] += s[y]; }
  return out;
}
// Desglose por competencia (7 categorías) de una ciudad, dentro de período y
// cancha (ignora el filtro de competencia: el apilado muestra todas).
function ci_catBreakdown(cityIdx) {
  const s = ci_state(), [a, b] = s.period, out = new Array(7).fill(0);
  const m = ci_hasDet() ? DATA_CIUDADES_DET[cityIdx] : null;
  if (!m) return out;
  for (let k = 0; k < m.length; k++) {
    const y = CI_YMIN + m[k][0]; if (y < a || y > b) continue;
    const code = m[k][1], cat = code >> 1, neu = code & 1;
    if (s.neutral && !neu) continue;
    out[cat] += m[k][2];
  }
  return out;
}
// Filas del ranking según la unidad (ciudad o país). Devuelve {key, label, n}.
function ci_rankRows() {
  const s = ci_state(), counts = ci_counts();
  if (s.unit === 'country') {
    const byC = new Map();
    counts.forEach(o => {
      const pais = DATA_CIUDADES.cities[o.i].pais;
      byC.set(pais, (byC.get(pais) || 0) + o.n);
    });
    return Array.from(byC.entries())
      .map(([pais, n]) => ({ key: pais, label: ci_paisName(pais), n }))
      .sort((u, w) => w.n - u.n);
  }
  return counts.map(o => ({
    key: o.i, i: o.i, n: o.n,
    label: `${ci_cityName(DATA_CIUDADES.cities[o.i].n)} (${ci_paisName(DATA_CIUDADES.cities[o.i].pais)})`
  })).sort((u, w) => w.n - u.n);
}
// Ítems de la vista línea (ciudades o países) con su serie anual cruda.
function ci_lineItems() {
  const s = ci_state();
  if (s.unit === 'country') {
    return (s.countries || []).slice(0, CI_LINE_MAX).map((pais) => ({
      key: pais, label: ci_paisName(pais), color: ci_colorFor('p' + pais), raw: ci_countrySeries(pais)
    }));
  }
  return (s.cities || []).slice(0, CI_LINE_MAX).map((ci) => ({
    key: ci, label: ci_cityName(DATA_CIUDADES.cities[ci].n), color: ci_colorFor('c' + ci), raw: ci_citySeries(ci)
  }));
}
function ci_lineSelection() { const s = ci_state(); return s.unit === 'country' ? (s.countries || []) : (s.cities || []); }
function ci_lineHasSel() { return ci_lineSelection().length > 0; }
function ci_ensureDefaultCities() {
  const s = ci_state();
  if (s.unit === 'country') {
    if (s.countries && s.countries.length) return;
    const byC = new Map();
    DATA_CIUDADES.cities.forEach(c => byC.set(c.pais, (byC.get(c.pais) || 0) + c.p));
    s.countries = Array.from(byC.entries()).sort((u, w) => w[1] - u[1]).slice(0, 3).map(o => o[0]);
    return;
  }
  if (s.cities && s.cities.length) return;
  s.cities = DATA_CIUDADES.cities
    .map((c, i) => ({ i, p: c.p })).sort((a, b) => b.p - a.p)
    .slice(0, 3).map(o => o.i);
}

// Detalle (matriz año×cat×neutral) bajo demanda: se inyecta el script la
// primera vez que hace falta; mientras no está, los totales precalculados
// alcanzan para la vista default.
function ci_hasDet() { return typeof DATA_CIUDADES_DET !== 'undefined'; }
function ci_ensureDet(cb) {
  if (ci_hasDet()) { if (cb) cb(); return; }
  if (ci_detLoading) return;
  ci_detLoading = true;
  const sc = document.createElement('script');
  sc.src = './data-ciudades-det.js?v=' + (window.__ESP_V || '1');
  sc.onload = () => { ci_detLoading = false; if (cb) cb(); };
  // si la red falla (server local intermitente), liberar para poder reintentar
  sc.onerror = () => { ci_detLoading = false; sc.remove(); };
  document.head.appendChild(sc);
}

// Conteo por ciudad según filtros. Devuelve array de {i, n} (solo n>0).
// Sin detalle cargado solo puede resolver la vista default (totales).
function ci_counts() {
  const s = ci_state();
  const C = DATA_CIUDADES.cities;
  const out = [];
  if (ci_filtersDefault() || !ci_hasDet()) {
    const neu = s.neutral;
    for (let i = 0; i < C.length; i++) {
      if (!ci_geoMatch(C[i])) continue;
      const n = neu ? C[i].neu : C[i].p;
      if (n > 0) out.push({ i, n });
    }
    return out;
  }
  const [a, b] = s.period;
  const y0 = DATA_CIUDADES.y0;
  const catSel = s.cat, neuOnly = s.neutral;
  for (let i = 0; i < C.length; i++) {
    if (!ci_geoMatch(C[i])) continue;
    const m = DATA_CIUDADES_DET[i];
    if (!m) continue;
    let n = 0;
    for (let k = 0; k < m.length; k++) {
      const y = y0 + m[k][0];
      if (y < a || y > b) continue;
      const code = m[k][1], cat = code >> 1, neu = code & 1;
      if (neuOnly && !neu) continue;
      if (catSel !== 'ALL' && cat !== catSel) continue;
      n += m[k][2];
    }
    if (n > 0) out.push({ i, n });
  }
  return out;
}
// puntos {i, c, n} ordenados desc por n (para LOD: las grandes primero)
function ci_points() {
  const C = DATA_CIUDADES.cities;
  return ci_counts().map(o => ({ i: o.i, c: C[o.i], n: o.n }))
    .sort((x, y) => y.n - x.n);
}

// Redibujo coalescido por frame (el slider dispara muchos input por segundo)
function ci_scheduleDraw() {
  if (ci_rafPending) return;
  ci_rafPending = true;
  requestAnimationFrame(() => { ci_rafPending = false; drawCiudades(); });
}

function ci_dims(fmt, mobile, view) {
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    const f = PNG_FORMATS[fmt];
    if (view === 'bars') return { W: f.vbW, H: fmt === 'worldmap' ? 650 : Math.max(f.vbH, 760) };
    if (view === 'line') return { W: f.vbW, H: fmt === 'worldmap' ? 520 : f.vbH };
    return { W: f.vbW, H: f.vbH };
  }
  if (mobile) return { W: 1100, H: view === 'bars' ? 1180 : (view === 'line' ? 620 : 720) };
  return { W: 1100, H: view === 'bars' ? 500 : (view === 'line' ? 460 : 500) };
}

// Hexbin propio (idéntico al del birthplace, sin CDN extra)
function ci_makeHexbin(r) {
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
// Frame de referencia del hexbin (proyección desktop 1100×600): la grilla es
// idéntica en todos los formatos (ver nota larga en birthplace.js).
let ci_hexRef = null;
function ci_hexRefFrame() {
  if (ci_hexRef || !ci_geo) return ci_hexRef;
  const M = 8, p = d3.geoRobinson().fitSize([1100 - 2 * M, 600 - 2 * M], ci_geo);
  ci_hexRef = { scale: p.scale(), tr: p.translate() };
  return ci_hexRef;
}

//==================================================================
//  DRAW
//==================================================================
function drawCiudades() {
  const svg = d3.select('#chart6');
  if (svg.empty() || typeof d3 === 'undefined') return;
  if (ci_tlPlaying) ci_tlStop(false);   // cualquier redibujo normal corta el timelapse
  svg.selectAll('*').remove();
  ci_loadGeo();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square',
        mobilePng = editorFormat === 'mobile', worldmap = editorFormat === 'worldmap';
  const mobile = !editorFormat && ci_isMobile();
  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng || worldmap;
  const view = ci_state().view;
  let { W, H } = ci_dims(editorFormat, mobile, view);
  const node = svg.node();
  node.style.width = '100%';
  node.style.maxHeight = '';

  // Los charts escalan la altura con el ancho, y el especial usa columna ancha
  // (~1300px), así que las alturas fijas se iban largas y quedaban fuera del
  // fold. Ajustamos cada vista al alto disponible del viewport:
  //  - mapa: tope de altura (queda algo más de océano a los lados si hace falta)
  //  - ranking/línea: recalculamos la altura del viewBox para calzar el alto
  //    usando todo el ancho (sin bandas laterales).
  if (!isPngFormat && !mobile) {
    const rect = node.getBoundingClientRect();
    const rw = rect.width || 1100;
    const availPx = Math.round(window.innerHeight - rect.top - 88);
    if (view === 'map') {
      node.style.maxHeight = Math.max(360, availPx) + 'px';
    } else {
      const minPx = view === 'bars' ? 430 : 320;
      H = Math.round(Math.max(minPx, availPx) * W / rw);
    }
  }
  node.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(node, editorFormat);

  if (view === 'bars') ci_drawBars(svg, W, H, { bigFmt, isPngFormat });
  else if (view === 'line') ci_drawLine(svg, W, H, { bigFmt, isPngFormat });
  else ci_drawMapView(svg, W, H, { bigFmt, isPngFormat });

  ci_applyHeadings();
}

//------------------------------------------------------------------
//  Vista MAPA (burbujas o calor) + zoom
//------------------------------------------------------------------
function ci_drawMapView(svg, W, H, opt) {
  const { bigFmt, isPngFormat } = opt;
  if (!ci_geo) return;
  const M = 8;
  const PW = W - 2 * M, PH = H - 2 * M;

  ci_projection = d3.geoRobinson().fitSize([PW, PH], ci_geo);
  ci_path = d3.geoPath(ci_projection);

  const glow = ci_isGlow();
  const defs = svg.append('defs');
  defs.append('clipPath').attr('id', 'ci-clip').append('rect')
    .attr('x', -M).attr('y', -M).attr('width', W).attr('height', H);
  if (glow) {
    defs.append('filter').attr('id', 'ci-glow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
      .append('feGaussianBlur').attr('stdDeviation', bigFmt ? 3 : 2);
  }
  const root = svg.append('g').attr('transform', `translate(${M},${M})`).attr('clip-path', 'url(#ci-clip)');
  root.append('rect').attr('x', -M).attr('y', -M).attr('width', W).attr('height', H).attr('fill', glow ? '#1b2027' : CI_OCEAN);
  const gZoom = root.append('g');

  gZoom.append('g').selectAll('path').data(ci_geoLand()).join('path')
    .attr('d', ci_path).attr('fill', glow ? '#2b313b' : CI_LAND).attr('stroke', glow ? '#3a414d' : CI_LAND_STROKE)
    .attr('stroke-width', 0.5).attr('vector-effect', 'non-scaling-stroke');

  // proyectar cada ciudad una sola vez, ordenadas desc (LOD: grandes primero)
  const pts = ci_points();
  for (let i = 0; i < pts.length; i++) {
    const p = ci_projection([pts[i].c.lon, pts[i].c.lat]);
    pts[i].x = p ? p[0] : null; pts[i].y = p ? p[1] : null;
  }
  ci_vpts = pts.filter(p => p.x != null);
  ci_maxN = ci_vpts.length ? ci_vpts[0].n : 1;
  ci_rScale = d3.scaleSqrt().domain([0, ci_maxN]).range([0, bigFmt ? 32 : 19]);
  ci_baseStroke = bigFmt ? 1.1 : 0.8;
  ci_PW = PW; ci_PH = PH; ci_bigFmt = bigFmt; ci_isPng = isPngFormat;

  ci_gData = root.append('g');
  const t0 = isPngFormat ? d3.zoomIdentity : (ci_zoomT || d3.zoomIdentity);
  ci_lastRenderT = t0;
  if (!isPngFormat && ci_zoomT) gZoom.attr('transform', ci_zoomT);
  ci_renderData(t0);

  if (!ci_isHeat()) ci_sizeLegend(root, ci_rScale, ci_maxN, PW, PH, bigFmt);

  // zoom: durante el gesto solo transforms (barato); recompute al soltar
  if (!isPngFormat) {
    ci_zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [PW, PH]])
      .on('zoom', (ev) => {
        const T = ev.transform; ci_zoomT = T;
        gZoom.attr('transform', T);
        const T0 = ci_lastRenderT, m = T.k / T0.k;
        ci_gData.attr('transform', `translate(${(T.x - m * T0.x).toFixed(2)},${(T.y - m * T0.y).toFixed(2)}) scale(${m.toFixed(4)})`);
        ci_scheduleRecompute(T);
      });
    svg.call(ci_zoom);
    if (ci_zoomT) svg.property('__zoom', ci_zoomT);
  }
}

// Capa de datos para la transform actual. LOD + cull, burbujas de tamaño
// constante en pantalla (se recalculan al soltar el zoom).
function ci_renderData(transform) {
  if (!ci_gData || !ci_vpts) return;
  ci_gData.selectAll('*').remove();
  const t = transform || d3.zoomIdentity, k = t.k, pad = 40;
  const inView = (sx, sy) => sx >= -pad && sx <= ci_PW + pad && sy >= -pad && sy <= ci_PH + pad;

  if (ci_isHeat()) {
    const style = ci_heatStyle();
    if (style === 'glow') {
      // luces nocturnas: halo difuso (acumula luz con "screen") + núcleo nítido
      // brillante en cada ciudad, sobre tierra oscura. Se lee la geografía porque
      // los puntos caen en las coordenadas reales (no en una grilla).
      const cap = Math.min(ci_vpts.length, CI_GLOW_MAX);
      const vis = [];
      for (let i = 0; i < cap; i++) { const p = ci_vpts[i], sx = t.applyX(p.x), sy = t.applyY(p.y); if (inView(sx, sy)) vis.push({ sx, sy, n: p.n }); }
      // radio y brillo suben con potencia >sqrt: los epicentros se destacan mucho
      // más que las sedes menores (clave para leer el mapa en medias móviles)
      const EXP = 0.78;
      const rHalo = d3.scalePow().exponent(EXP).domain([0, ci_maxN]).range([ci_bigFmt ? 2 : 1.5, ci_bigFmt ? 24 : 16]);
      const oHalo = d3.scalePow().exponent(0.6).domain([0, ci_maxN]).range([0.18, 0.85]).clamp(true);
      const gHalo = ci_gData.append('g').attr('filter', 'url(#ci-glow)').style('mix-blend-mode', 'screen');
      gHalo.selectAll('circle').data(vis).join('circle')
        .attr('cx', o => o.sx.toFixed(1)).attr('cy', o => o.sy.toFixed(1)).attr('r', o => rHalo(o.n))
        .attr('fill', '#FFAE1F').attr('fill-opacity', o => oHalo(o.n));
      const rCore = d3.scalePow().exponent(EXP).domain([0, ci_maxN]).range([ci_bigFmt ? 0.7 : 0.5, ci_bigFmt ? 6.5 : 4.5]);
      const oCore = d3.scaleLinear().domain([0, ci_maxN]).range([0.42, 1]).clamp(true);
      const gCore = ci_gData.append('g').style('mix-blend-mode', 'screen');
      gCore.selectAll('circle').data(vis).join('circle')
        .attr('cx', o => o.sx.toFixed(1)).attr('cy', o => o.sy.toFixed(1)).attr('r', o => rCore(o.n))
        .attr('fill', '#FFF6CC').attr('fill-opacity', o => oCore(o.n));
    } else {
      // hexbin anclado al frame de referencia (grilla idéntica entre formatos)
      const _ref = ci_hexRefFrame();
      const _sc = ci_projection.scale(), _tr = ci_projection.translate();
      const _f = _ref ? _ref.scale / _sc : 1;
      const _ax = t.applyX(_tr[0]), _ay = t.applyY(_tr[1]);
      const _rx = _ref ? _ref.tr[0] : 0, _ry = _ref ? _ref.tr[1] : 0;
      const vis = [];
      for (let i = 0; i < ci_vpts.length; i++) {
        const p = ci_vpts[i], sx = t.applyX(p.x), sy = t.applyY(p.y);
        if (inView(sx, sy)) vis.push({ x: (sx - _ax) * _f + _rx, y: (sy - _ay) * _f + _ry, n: p.n, c: p.c });
      }
      const R = (style === 'hexsmall') ? 5 : 10;
      const hb = ci_makeHexbin(R);
      const bins = hb(vis, o => o.x, o => o.y);
      for (let i = 0; i < bins.length; i++) { let v = 0; for (let j = 0; j < bins[i].length; j++) v += bins[i][j].n; bins[i]._v = v; }
      const maxV = d3.max(bins, b => b._v) || 1;
      const color = d3.scaleSequentialSqrt(d3.interpolateRgbBasis(CI_HEAT_RAMP)).domain([0, maxV]);
      const hex = hb.hexagon();
      const gHex = ci_gData.append('g')
        .attr('transform', `translate(${_ax.toFixed(2)},${_ay.toFixed(2)}) scale(${(1 / _f).toFixed(5)})`);
      gHex.selectAll('path').data(bins).join('path')
        .attr('transform', b => `translate(${(b.x - _rx).toFixed(2)},${(b.y - _ry).toFixed(2)})`)
        .attr('d', hex).attr('fill', b => color(b._v)).attr('stroke', 'none');
      if (!ci_isPng && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
        gHex.style('cursor', 'pointer')
          .on('mouseover', (ev) => { if (ev.target.tagName !== 'path') return; d3.select(ev.target).attr('stroke', '#FAF8F3').attr('stroke-width', ci_bigFmt ? 1.4 : 0.9).raise(); ci_hexTip(d3.select(ev.target).datum()); })
          .on('mousemove', () => ci_tipMove())
          .on('mouseout', (ev) => { if (ev.target.tagName !== 'path') return; d3.select(ev.target).attr('stroke', 'none'); ci_tipHide(); });
      }
    }
  } else {
    const maxDots = ci_isPng ? ci_vpts.length : Math.min(ci_vpts.length, Math.round(CI_BASE_DOTS * k));
    const vis = [];
    for (let i = 0; i < maxDots; i++) { const p = ci_vpts[i], sx = t.applyX(p.x), sy = t.applyY(p.y); if (inView(sx, sy)) vis.push({ d: p, sx, sy }); }
    const draw = vis.slice().reverse();   // grandes al final (arriba)
    const gDots = ci_gData.append('g');
    gDots.selectAll('circle').data(draw).join('circle')
      .attr('cx', o => o.sx).attr('cy', o => o.sy).attr('r', o => ci_rScale(o.d.n))
      .attr('fill', CI_ACCENT).attr('fill-opacity', 0.4)
      .attr('stroke', CI_ACCENT_DARK).attr('stroke-width', ci_baseStroke).attr('stroke-opacity', 0.85);
    if (!ci_isPng && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      gDots.style('cursor', 'pointer')
        .on('mouseover', (ev) => { if (ev.target.tagName !== 'circle') return; const c = d3.select(ev.target); c.attr('fill-opacity', 0.85).raise(); ci_tip(c.datum().d); })
        .on('mousemove', () => ci_tipMove())
        .on('mouseout', (ev) => { if (ev.target.tagName !== 'circle') return; d3.select(ev.target).attr('fill-opacity', 0.4); ci_tipHide(); });
    }
  }
}
function ci_scheduleRecompute(T) {
  ci_lastT = T;
  if (ci_recomputeTimer) clearTimeout(ci_recomputeTimer);
  ci_recomputeTimer = setTimeout(() => {
    ci_renderData(ci_lastT); ci_lastRenderT = ci_lastT;
    if (ci_gData) ci_gData.attr('transform', null);
  }, 110);
}

function ci_sizeLegend(g, rScale, maxN, PW, PH, bigFmt) {
  const refs = [1, Math.round(maxN / 4), maxN].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
  if (refs.length < 2) return;
  const fs = bigFmt ? 22 : 11;
  const baseX = bigFmt ? 24 : 14, baseY = PH - (bigFmt ? 24 : 16);
  const lg = g.append('g').attr('transform', `translate(${baseX},${baseY})`);
  lg.append('text').attr('x', 0).attr('y', -2 * rScale(maxN) - (bigFmt ? 10 : 6))
    .style('font-family', 'var(--sans)').style('font-size', fs + 'px').style('font-weight', 600)
    .attr('fill', 'var(--ink-soft)').text(ci_t('c6-legend-size', 'Partidos organizados'));
  let x = rScale(maxN);
  refs.forEach(v => {
    const r = rScale(v);
    lg.append('circle').attr('cx', x).attr('cy', -r).attr('r', r)
      .attr('fill', 'none').attr('stroke', CI_ACCENT).attr('stroke-width', bigFmt ? 1.6 : 1);
    lg.append('text').attr('x', x).attr('y', 2 + (bigFmt ? 8 : 4)).attr('text-anchor', 'middle')
      .style('font-family', 'var(--sans)').style('font-size', (fs - 1) + 'px')
      .attr('fill', 'var(--ink-soft)').style('font-variant-numeric', 'tabular-nums').text(fmt(v));
    x += rScale(maxN) + (bigFmt ? 30 : 18);
  });
}

//------------------------------------------------------------------
//  Timelapse (animación del mapa año a año)
//------------------------------------------------------------------
function ci_tlWin(year) {
  return ci_tlMode === 'accum' ? [CI_YMIN, year] : [Math.max(CI_YMIN, year - (ci_tlWinYears - 1)), year];
}
// pacing variable: rápido en los años vacíos, más lento donde pasa la acción
function ci_tlStepFor(year) {
  if (year < 1960) return Math.round(CI_TL_STEP / 2);        // x2  (~75ms)
  if (year < 1990) return Math.round(CI_TL_STEP / 1.75);     // x1.75 (~86ms)
  return Math.round(CI_TL_STEP / 1.5);                       // x1.5 (100ms)
}
// precomputa posición proyectada + suma acumulada por ciudad (una vez por play)
function ci_tlBuild() {
  const s = ci_state(), C = DATA_CIUDADES.cities;
  ci_tlProj = [];
  for (let i = 0; i < C.length; i++) {
    if (s.geo && !ci_geoMatch(C[i])) continue;
    const p = ci_projection([C[i].lon, C[i].lat]); if (!p) continue;
    const ser = ci_citySeries(i), N = ser.length, cum = new Array(N + 1); cum[0] = 0;
    for (let y = 0; y < N; y++) cum[y + 1] = cum[y] + ser[y];
    ci_tlProj.push({ sx: p[0], sy: p[1], c: C[i], cum });
  }
  // máximo fijo sobre todos los cuadros, para que la escala no salte
  let mx = 1;
  for (let year = CI_YMIN; year <= CI_YMAX; year++) {
    const [a, b] = ci_tlWin(year), ai = a - CI_YMIN, bi = b - CI_YMIN + 1;
    for (const o of ci_tlProj) { const n = o.cum[bi] - o.cum[ai]; if (n > mx) mx = n; }
  }
  ci_tlMaxFixed = mx;
  ci_rScale = d3.scaleSqrt().domain([0, mx]).range([0, ci_bigFmt ? 32 : 19]);
}
function ci_tlFrame(year) {
  const [a, b] = ci_tlWin(year), ai = a - CI_YMIN, bi = b - CI_YMIN + 1;
  const pts = [];
  for (const o of ci_tlProj) { const n = o.cum[bi] - o.cum[ai]; if (n > 0) pts.push({ x: o.sx, y: o.sy, n, c: o.c }); }
  pts.sort((u, w) => w.n - u.n);
  ci_vpts = pts; ci_maxN = ci_tlMaxFixed;
  ci_renderData(ci_zoomT || d3.zoomIdentity);
  if (ci_tlYearSel) ci_tlYearSel.text(year);
}
// Subtítulo del timelapse, adaptado a los filtros: cambia el sustantivo según
// la competencia (partidos del Mundial, amistosos, etc.) y agrega cláusulas por
// cancha neutral y por sede. El período no aplica (el timelapse corre el tiempo).
function ci_tlSub() {
  const s = ci_state(), lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const noun = ci_t(s.cat === 'ALL' ? 'c6-tl-noun-all' : 'c6-tl-noun-' + s.cat, '');
  const base = ci_t(ci_tlMode === 'accum' ? 'c6-tl-sub-accum' : 'c6-tl-sub-ma', '').replace('{noun}', noun);
  const extra = [];
  if (s.neutral) extra.push(ci_t('c6-scope-neutral', 'en cancha neutral'));
  if (s.geo) extra.push(ci_t('c6-scope-conf', lang === 'en' ? 'venues in' : 'sedes de') + ' ' + ci_geoLabel());
  return extra.length ? base + ' · ' + extra.join(' · ') : base;
}
function ci_tlTitle() {
  const block = document.querySelector('.chart-block[data-chart="6"]') || document;
  const titleEl = block.querySelector('.chart-title');
  const key = ci_tlMode === 'accum' ? 'c6-title-timelapse-accum' : 'c6-title-timelapse';
  if (titleEl) titleEl.textContent = ci_t(key, 'La geografía del fútbol internacional');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl) subEl.textContent = ci_tlSub();
}
// el año como texto SVG: fuente consistente y siempre dentro del mapa
function ci_tlYearMake() {
  const svg = d3.select('#chart6');
  svg.selectAll('.ci-tl-year').remove();
  const vb = svg.node().viewBox.baseVal, W = vb.width, H = vb.height;
  const glow = ci_isHeat() && ci_heatStyle() === 'glow';
  ci_tlYearSel = svg.append('text').attr('class', 'ci-tl-year')
    .attr('x', W / 2).attr('y', H - 16).attr('text-anchor', 'middle')
    .style('font-family', "'Source Serif 4', Georgia, 'Times New Roman', serif")
    .style('font-weight', 700).style('font-size', Math.round(H * 0.155) + 'px')
    .style('font-variant-numeric', 'tabular-nums').style('pointer-events', 'none')
    .attr('fill', glow ? '#FFF6CC' : '#33312C').attr('fill-opacity', 0.96)
    .attr('paint-order', 'stroke').attr('stroke', glow ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.65)')
    .attr('stroke-width', glow ? 1 : 2).attr('stroke-linejoin', 'round');
}
// visibilidad de los controles del timelapse (modo visible al reproducir; el
// slider de años solo en modo móvil)
function ci_tlCtrls() {
  const m = document.getElementById('ci-tl-mode'); if (m) m.style.display = ci_tlPlaying ? '' : 'none';
  const w = document.getElementById('ci-tl-win'); if (w) w.style.display = (ci_tlPlaying && ci_tlMode === 'ma') ? '' : 'none';
}
function ci_tlStop(resetFull) {
  ci_tlPlaying = false;
  if (ci_tlTimer) { clearTimeout(ci_tlTimer); ci_tlTimer = null; }
  if (ci_tlYearSel) { ci_tlYearSel.remove(); ci_tlYearSel = null; }
  ci_tlCtrls();
  ci_tlSyncBtn();
  if (resetFull) { state[6].period = [CI_YMIN, CI_YMAX]; drawCiudades(); }
}
// al llegar al final se queda CONGELADO en el último cuadro (no resetea al total)
function ci_tlFinish() {
  ci_tlPlaying = false;
  if (ci_tlTimer) { clearTimeout(ci_tlTimer); ci_tlTimer = null; }
  ci_tlCtrls();
  ci_tlSyncBtn();
}
function ci_tlPlay() {
  if (ci_state().view !== 'map') return;
  if (ci_tlPlaying) { ci_tlStop(false); return; }
  if (!ci_projection || !ci_gData) drawCiudades();
  ci_tlBuild();
  ci_tlPlaying = true; ci_tlCtrls(); ci_tlSyncBtn(); ci_tlTitle(); ci_tlYearMake();
  let year = CI_YMIN;
  const step = () => {
    if (!ci_tlPlaying) return;
    ci_tlFrame(year);
    if (year >= CI_YMAX) { ci_tlFinish(); return; }   // se queda en el último cuadro
    const d = ci_tlStepFor(year); year++;
    ci_tlTimer = setTimeout(step, d);
  };
  step();
}
function ci_tlSyncBtn() {
  const b = document.getElementById('ci-tl-play'); if (!b) return;
  b.textContent = ci_tlPlaying ? ci_t('c6-tl-pause', '⏸ Pausar') : ci_t('c6-tl-play', '▶ Reproducir');
  b.classList.toggle('active', ci_tlPlaying);
}
// Graba el timelapse a un canvas y descarga un .webm (respeta modo/ventana/
// filtros/estilo activos). El video es autónomo: lleva el título y el año.
function ci_tlRecord() {
  if (ci_tlRecording) return;
  ci_loadGeo();
  const btn = document.getElementById('ci-tl-video-dl');
  if (!ci_geo || typeof MediaRecorder === 'undefined' || !document.createElement('canvas').captureStream) {
    if (typeof alert === 'function') alert('Tu navegador no permite grabar el video acá. Probá con Chrome actualizado.');
    return;
  }
  const glow = ci_isHeat() && ci_heatStyle() === 'glow';
  const cw = 1600, M = 36, mapW = cw - 2 * M;
  const topBand = 132, botBand = 84;              // bandas de texto FUERA del mapa
  // proyección ajustada al ancho; recortamos el ártico vacío (arriba) y la
  // Antártida (abajo), así el mundo habitado ocupa todo el alto disponible
  const proj = d3.geoRobinson().fitWidth(mapW, ci_geo);
  const yTop = proj([0, 80])[1], yBot = proj([0, -56])[1];   // -56: apenas al sur de Ushuaia
  const mapVisH = Math.round(yBot - yTop);
  const offY = topBand - yTop;                    // desplaza el mapa a la banda central
  const ch = topBand + mapVisH + botBand;
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d'); const path = d3.geoPath(proj, ctx);
  const k = mapW / 1084;    // escala vs el mapa en pantalla (plot 1084px)

  // proyectar ciudades + prefijos (respeta sede / competencia / cancha)
  const s = ci_state(), C = DATA_CIUDADES.cities, items = [];
  for (let i = 0; i < C.length; i++) {
    if (s.geo && !ci_geoMatch(C[i])) continue;
    const p = proj([C[i].lon, C[i].lat]); if (!p) continue;
    const ser = ci_citySeries(i), N = ser.length, cum = new Array(N + 1); cum[0] = 0;
    for (let y = 0; y < N; y++) cum[y + 1] = cum[y] + ser[y];
    items.push({ x: p[0] + M, y: p[1] + offY, cum });
  }
  let mx = 1;
  for (let year = CI_YMIN; year <= CI_YMAX; year++) {
    const [a, b] = ci_tlWin(year), ai = a - CI_YMIN, bi = b - CI_YMIN + 1;
    for (const o of items) { const n = o.cum[bi] - o.cum[ai]; if (n > mx) mx = n; }
  }
  const rHalo = d3.scalePow().exponent(0.78).domain([0, mx]).range([2 * k, 24 * k]);
  const oHalo = d3.scalePow().exponent(0.6).domain([0, mx]).range([0.18, 0.85]).clamp(true);
  const rCore = d3.scalePow().exponent(0.78).domain([0, mx]).range([0.7 * k, 6.5 * k]);
  const oCore = d3.scaleLinear().domain([0, mx]).range([0.42, 1]).clamp(true);
  const rBub = d3.scaleSqrt().domain([0, mx]).range([0, 32 * k]);
  const titleTxt = ci_t(ci_tlMode === 'accum' ? 'c6-title-timelapse-accum' : 'c6-title-timelapse', '');
  const subTxt = ci_tlSub();
  const srcTxt = ci_t('c6-tl-source-vid', 'Datos: Mart Jürisoo y elaboración propia · 1872–2026');
  const creditTxt = 'El Atlas · Daniel Schteingart';
  const bandBg = glow ? '#141a20' : '#F4F0E6', mapBg = glow ? '#181e25' : CI_OCEAN;
  // el subtítulo es largo: achicamos su tamaño hasta que entre en una línea
  let subFs = 27;
  ctx.font = "400 " + subFs + "px 'Source Sans 3', system-ui, sans-serif";
  while (subFs > 16 && ctx.measureText(subTxt).width > mapW) { subFs--; ctx.font = "400 " + subFs + "px 'Source Sans 3', system-ui, sans-serif"; }

  function frame(year) {
    // fondo (bandas de texto) en todo el lienzo
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bandBg; ctx.fillRect(0, 0, cw, ch);
    // --- región del mapa (recortada, sin Antártida) ---
    ctx.save();
    ctx.beginPath(); ctx.rect(M, topBand, mapW, mapVisH); ctx.clip();
    ctx.fillStyle = mapBg; ctx.fillRect(M, topBand, mapW, mapVisH);
    ctx.save(); ctx.translate(M, offY);
    ctx.beginPath(); path(ci_geo);
    ctx.fillStyle = glow ? '#2b313b' : CI_LAND; ctx.fill();
    ctx.lineWidth = 0.6; ctx.strokeStyle = glow ? '#3a414d' : CI_LAND_STROKE; ctx.stroke();
    ctx.restore();
    const [a, b] = ci_tlWin(year), ai = a - CI_YMIN, bi = b - CI_YMIN + 1;
    if (glow) {
      ctx.globalCompositeOperation = 'lighter';
      for (const o of items) { const n = o.cum[bi] - o.cum[ai]; if (!n) continue; const r = rHalo(n), g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r); g.addColorStop(0, 'rgba(255,174,31,' + oHalo(n) + ')'); g.addColorStop(1, 'rgba(255,174,31,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 6.2832); ctx.fill(); }
      for (const o of items) { const n = o.cum[bi] - o.cum[ai]; if (!n) continue; ctx.fillStyle = 'rgba(255,246,204,' + oCore(n) + ')'; ctx.beginPath(); ctx.arc(o.x, o.y, rCore(n), 0, 6.2832); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    } else {
      for (const o of items) { const n = o.cum[bi] - o.cum[ai]; if (!n) continue; ctx.beginPath(); ctx.arc(o.x, o.y, rBub(n), 0, 6.2832); ctx.fillStyle = 'rgba(190,93,50,0.42)'; ctx.fill(); ctx.lineWidth = 0.9; ctx.strokeStyle = CI_ACCENT_DARK; ctx.stroke(); }
    }
    // año grande, centrado abajo (sobre el océano al sur de África, no tapa NZ)
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = "700 116px 'Source Serif 4', Georgia, serif";
    ctx.fillStyle = glow ? '#FFF6CC' : '#33312C'; ctx.fillText(year, M + mapW / 2, topBand + mapVisH - 18);
    ctx.restore();   // fin región mapa
    // --- banda superior: título + subtítulo ---
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = "700 46px 'Source Serif 4', Georgia, serif";
    ctx.fillStyle = glow ? '#F7F1E3' : '#2A2824'; ctx.fillText(titleTxt, M, 58);
    ctx.font = "400 " + subFs + "px 'Source Sans 3', system-ui, sans-serif";
    ctx.fillStyle = glow ? 'rgba(245,239,224,0.74)' : 'rgba(51,49,44,0.78)'; ctx.fillText(subTxt, M, 98);
    // --- banda inferior: crédito + fuente ---
    const by = topBand + mapVisH;
    ctx.font = "700 26px 'Source Sans 3', system-ui, sans-serif";
    ctx.fillStyle = glow ? '#EFE8D9' : '#2A2824'; ctx.fillText(creditTxt, M, by + 34);
    ctx.font = "400 20px 'Source Sans 3', system-ui, sans-serif";
    ctx.fillStyle = glow ? 'rgba(239,232,217,0.6)' : 'rgba(51,49,44,0.6)'; ctx.fillText(srcTxt, M, by + 62);
  }

  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 8e6 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    a.download = 'el-atlas-sedes-timelapse.webm';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    ci_tlRecording = false; if (btn) { btn.textContent = ci_t('c6-tl-video-dl', 'Descargar video'); btn.disabled = false; }
  };
  ci_tlRecording = true; if (btn) btn.disabled = true;
  frame(CI_YMIN); rec.start();
  let year = CI_YMIN;
  const step = () => {
    frame(year);
    if (btn) btn.textContent = ci_t('c6-tl-rec', 'Grabando') + ' ' + Math.round((year - CI_YMIN) / (CI_YMAX - CI_YMIN) * 100) + '%';
    if (year >= CI_YMAX) { setTimeout(() => rec.stop(), 700); return; }
    const d = ci_tlStepFor(year); year++;
    setTimeout(step, d);
  };
  step();
}

//------------------------------------------------------------------
//  Vista RANKING (barras)
//------------------------------------------------------------------
function ci_drawBars(svg, W, H, opt) {
  const bigFmt = opt.bigFmt || opt.isPngFormat;
  const s = ci_state();
  const rows = ci_rankRows().slice(0, CI_TOPN);
  // el desglose por competencia (para tooltip y apilado) necesita el detalle y
  // solo tiene sentido sin un tipo de competencia ya filtrado
  if (s.cat === 'ALL' && !ci_hasDet()) ci_ensureDet(() => ci_scheduleDraw());
  const wantBd = ci_hasDet() && s.cat === 'ALL';
  const doStack = s.stacked && wantBd;

  if (wantBd) {
    const cidx = ci_countryIndex();
    rows.forEach(d => {
      let bd;
      if (s.unit === 'country') {
        bd = new Array(7).fill(0);
        (cidx.get(d.key) || []).forEach(i => { const b = ci_catBreakdown(i); for (let k = 0; k < 7; k++) bd[k] += b[k]; });
      } else bd = ci_catBreakdown(d.i);
      d.bd = bd;
    });
  }

  const fs = bigFmt ? 22 : 12.5;
  const legendH = doStack ? (bigFmt ? 54 : 34) : 0;
  const M = { top: (bigFmt ? 24 : 14) + legendH, right: bigFmt ? 92 : 52, bottom: bigFmt ? 28 : 18, left: bigFmt ? 360 : 208 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;

  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);
  const maxN = d3.max(rows, d => d.n) || 1;
  const x = d3.scaleLinear().domain([0, maxN]).range([0, PW]);
  const y = d3.scaleBand().domain(rows.map((_, i) => i)).range([0, PH]).padding(0.26);
  const bh = y.bandwidth();
  const sep = doStack ? (bigFmt ? 2 : 1.2) : 0;   // separador fino entre tramos

  const gSeg = g.append('g').style('pointer-events', 'none');  // barras/tramos
  rows.forEach((d, i) => {
    const yy = y(i);
    if (doStack) {
      let xacc = 0;
      for (let k = 0; k < 7; k++) {
        const val = d.bd[k]; if (!val) continue;
        gSeg.append('rect').attr('data-cat', k)
          .attr('x', x(xacc)).attr('y', yy).attr('width', Math.max(x(xacc + val) - x(xacc) - sep, 0.6)).attr('height', bh)
          .attr('fill', CI_CAT_PALETTE[k]);
        xacc += val;
      }
    } else {
      // barra total: terracota, salvo que se haya filtrado a una competencia
      // (ahí toma el color de esa competencia, para coherencia con el apilado)
      const barColor = s.cat === 'ALL' ? CI_ACCENT : CI_CAT_PALETTE[s.cat];
      gSeg.append('rect').attr('x', 0).attr('y', yy).attr('width', Math.max(x(d.n), 1)).attr('height', bh)
        .attr('fill', barColor).attr('rx', bigFmt ? 4 : 2);
    }
    gSeg.append('text').attr('x', -(bigFmt ? 14 : 8)).attr('y', yy + bh / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').attr('fill', 'var(--ink)').text(d.label);
    gSeg.append('text').attr('x', x(d.n) + (bigFmt ? 12 : 7)).attr('y', yy + bh / 2).attr('dy', '0.35em')
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').style('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums').attr('fill', 'var(--ink)').text(fmt(d.n));
  });

  // leyenda (con hover que resalta la competencia sobre las barras)
  if (doStack) {
    const present = [];
    for (let k = 0; k < 7; k++) if (rows.some(d => d.bd[k] > 0)) present.push(k);
    ci_barsLegend(svg.append('g').attr('transform', `translate(${M.left},${bigFmt ? 26 : 14})`),
      present, W - M.left - M.right, bigFmt, gSeg, opt.isPngFormat);
  }

  // overlay transparente por fila: tooltip con el desglose (anda en total y apilado)
  if (!opt.isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
    const gov = g.append('g');
    rows.forEach((d, i) => {
      gov.append('rect').attr('x', -M.left).attr('y', y(i)).attr('width', M.left + PW).attr('height', bh)
        .attr('fill', 'transparent').style('cursor', 'pointer')
        .on('mouseover', () => { ci_barTip(d); })
        .on('mousemove', () => ci_tipMove())
        .on('mouseout', () => ci_tipHide());
    });
  }
}
// tooltip del ranking: nombre + total + desglose por competencia
function ci_barTip(row) {
  const tt = document.getElementById('tooltip6'); if (!tt) return;
  const noun = row.n === 1 ? ci_t('c6-noun-1', 'partido') : ci_t('c6-noun-n', 'partidos');
  let html = `<div style="font-weight:600;margin-bottom:2px;">${row.label}</div>`
    + `<div><strong style="font-variant-numeric:tabular-nums;">${fmt(row.n)}</strong> ${noun}${ci_scopeText()}</div>`;
  if (row.bd) {
    const its = [], tot = row.n || 1;
    for (let k = 0; k < 7; k++) if (row.bd[k] > 0) its.push({ k, n: row.bd[k] });
    its.sort((a, b) => b.n - a.n);
    if (its.length > 1) html += '<div style="margin-top:4px;border-top:1px solid var(--grid);padding-top:3px;">'
      + its.map(it => `<div style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:2px;background:${CI_CAT_PALETTE[it.k]};display:inline-block;"></span>${ci_t('c6-cat-' + it.k, '')}: <strong style="font-variant-numeric:tabular-nums;">${fmt(it.n)}</strong> <span style="opacity:.7;">(${Math.round(it.n / tot * 100)}%)</span></div>`).join('') + '</div>';
  }
  tt.innerHTML = html; tt.style.display = 'block'; tt.style.opacity = '1';
}
// leyenda horizontal de competencias (con wrap). Hover resalta esa competencia.
function ci_barsLegend(g, cats, PW, bigFmt, gSeg, isPng) {
  const fs = bigFmt ? 16 : 10.5, sw = bigFmt ? 14 : 10, lineH = bigFmt ? 26 : 17, gapItem = bigFmt ? 24 : 15;
  const emph = (k) => { if (gSeg) gSeg.selectAll('rect[data-cat]').attr('opacity', function () { return +this.getAttribute('data-cat') === k ? 1 : 0.15; }); };
  const clear = () => { if (gSeg) gSeg.selectAll('rect[data-cat]').attr('opacity', 1); };
  let x = 0, yln = 0;
  cats.forEach(k => {
    const name = ci_t('c6-cat-' + k, '');
    const wItem = sw + 5 + name.length * (fs * 0.52) + gapItem;
    if (x + wItem > PW && x > 0) { x = 0; yln += lineH; }
    const gi = g.append('g').attr('transform', `translate(${x},${yln})`);
    if (!isPng) gi.style('cursor', 'pointer').on('mouseover', () => emph(k)).on('mouseout', clear);
    gi.append('rect').attr('x', 0).attr('y', -1).attr('width', wItem - gapItem + 3).attr('height', sw + 2).attr('fill', 'transparent');
    gi.append('rect').attr('x', 0).attr('y', 0).attr('width', sw).attr('height', sw).attr('rx', 2).attr('fill', CI_CAT_PALETTE[k]);
    gi.append('text').attr('x', sw + 5).attr('y', sw - (bigFmt ? 2 : 1.5))
      .style('font-family', 'var(--sans)').style('font-size', fs + 'px').attr('fill', 'var(--ink-soft)').text(name);
    x += wItem;
  });
}

//------------------------------------------------------------------
//  Vista EVOLUCIÓN (líneas por ciudad)
//------------------------------------------------------------------
function ci_drawLine(svg, W, H, opt) {
  const bigFmt = opt.bigFmt || opt.isPngFormat;
  const s = ci_state();
  const share = s.lineMode === 'share';
  const fs = bigFmt ? 20 : 12;
  const M = { top: bigFmt ? 20 : 12, right: bigFmt ? 150 : 116, bottom: bigFmt ? 44 : 30, left: bigFmt ? 78 : 52 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);
  const [a, b] = s.period;

  const w = s.smooth === 'ma' ? s.maYears : 1;
  const items = ci_lineItems();
  if (!items.length) {
    svg.append('text').attr('x', W / 2).attr('y', H / 2).attr('text-anchor', 'middle')
      .style('font-family', 'var(--sans)').style('font-size', (fs + 1) + 'px').attr('fill', 'var(--ink-muted)')
      .text(ci_t('c6-line-empty', 'Elegí una o más ciudades para ver su evolución.'));
    return;
  }
  if (!ci_hasDet()) { ci_ensureDet(() => ci_scheduleDraw()); }

  const totals = share ? ci_yearTotals(s.cat, s.neutral) : null;
  const N = CI_YMAX - CI_YMIN + 1;
  const series = items.map((it, idx) => {
    // valor por año (abs o share) sobre toda la serie, luego promedio móvil
    const val = new Array(N);
    for (let y = 0; y < N; y++) {
      let v = it.raw[y] || 0;
      if (share) { const tot = totals[y] || 0; v = tot > 0 ? (v / tot) * 100 : 0; }
      val[y] = v;
    }
    const sm = ci_maSeries(val, w), pts = [];
    for (let yr = a; yr <= b; yr++) pts.push({ year: yr, v: sm[yr - CI_YMIN] || 0 });
    return { idx, label: it.label, pts, color: it.color };
  });

  const maxV = d3.max(series, ss => d3.max(ss.pts, p => p.v)) || 1;
  const x = d3.scaleLinear().domain([a, b]).range([0, PW]);
  const y = d3.scaleLinear().domain([0, maxV * 1.08]).nice().range([PH, 0]);
  const fmtV = share ? (v => (Math.round(v * 10) / 10) + '%') : (v => fmt(Math.round(v)));

  // grilla horizontal + eje Y
  y.ticks(5).forEach(tv => {
    g.append('line').attr('x1', 0).attr('x2', PW).attr('y1', y(tv)).attr('y2', y(tv)).attr('class', 's-grid-line');
    g.append('text').attr('x', -8).attr('y', y(tv)).attr('dy', '0.32em').attr('text-anchor', 'end')
      .attr('class', 's-tick').style('font-size', (bigFmt ? 18 : 11) + 'px').text(fmtV(tv));
  });
  // eje X (años)
  const xt = x.ticks(bigFmt ? 6 : 7).filter(v => Number.isInteger(v));
  xt.forEach(tv => {
    g.append('text').attr('x', x(tv)).attr('y', PH + (bigFmt ? 30 : 18)).attr('text-anchor', 'middle')
      .attr('class', 's-tick').style('font-size', (bigFmt ? 18 : 11) + 'px').text(String(tv));
  });
  g.append('text').attr('x', 0).attr('y', bigFmt ? -6 : -2).attr('text-anchor', 'start')
    .attr('class', 's-axis-title').style('font-size', (bigFmt ? 18 : 11.5) + 'px')
    .text(ci_t(share ? 'c6-line-y-share' : 'c6-line-y-abs', share ? '% de los partidos del año' : 'Partidos por año'));

  // líneas
  const line = d3.line().x(p => x(p.year)).y(p => y(p.v)).curve(d3.curveMonotoneX);
  series.forEach(ss => {
    g.append('path').datum(ss.pts).attr('d', line).attr('fill', 'none')
      .attr('stroke', ss.color).attr('stroke-width', bigFmt ? 2.6 : 1.9)
      .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
  });
  // etiquetas al final, des-encimadas verticalmente (varias terminan cerca de 0)
  const gap = bigFmt ? 22 : 14;
  const labels = series.map(ss => ({ y: y(ss.pts[ss.pts.length - 1].v), name: ss.label, color: ss.color }))
    .sort((u, w) => u.y - w.y);
  for (let i = 1; i < labels.length; i++)
    if (labels[i].y - labels[i - 1].y < gap) labels[i].y = labels[i - 1].y + gap;
  const overflow = labels.length ? labels[labels.length - 1].y - PH : 0;
  if (overflow > 0) for (let i = 0; i < labels.length; i++) labels[i].y -= overflow;
  if (labels.length && labels[0].y < 0) for (let i = 0; i < labels.length; i++) labels[i].y -= labels[0].y;
  labels.forEach(l => {
    g.append('text').attr('x', PW + 8).attr('y', l.y).attr('dy', '0.32em')
      .style('font-family', 'var(--sans)').style('font-size', (bigFmt ? 17 : 11.5) + 'px').style('font-weight', 600)
      .attr('fill', l.color).text(l.name);
  });

  // hover: guía vertical + puntos + tooltip con el valor de cada ciudad
  if (!opt.isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
    const hoverG = g.append('g').style('pointer-events', 'none').style('display', 'none');
    const vline = hoverG.append('line').attr('y1', 0).attr('y2', PH).attr('stroke', 'var(--ink-soft)').attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    const dots = series.map(ss => hoverG.append('circle').attr('r', bigFmt ? 5 : 3.5).attr('fill', ss.color).attr('stroke', '#fff').attr('stroke-width', 1.2));
    g.append('rect').attr('x', 0).attr('y', 0).attr('width', PW).attr('height', PH).attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (ev) => {
        const mx = d3.pointer(ev, g.node())[0];
        let yr = Math.round(x.invert(mx)); yr = Math.max(a, Math.min(b, yr));
        vline.attr('x1', x(yr)).attr('x2', x(yr));
        const rows = series.map((ss, si) => {
          const p = ss.pts[yr - a]; dots[si].attr('cx', x(yr)).attr('cy', y(p.v));
          return { color: ss.color, name: ss.label, v: p.v };
        }).sort((u, w) => w.v - u.v);
        hoverG.style('display', null);
        const tt = document.getElementById('tooltip6');
        if (tt) {
          tt.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${yr}</div>` + rows.map(r =>
            `<div style="display:flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:2px;background:${r.color};display:inline-block;"></span>${r.name}: <strong style="font-variant-numeric:tabular-nums;">${fmtV(r.v)}</strong></div>`).join('');
          tt.style.display = 'block'; tt.style.opacity = '1';
        }
        ci_tipMove();
      })
      .on('mouseout', () => { hoverG.style('display', 'none'); ci_tipHide(); });
  }
}

//------------------------------------------------------------------
//  Tooltips
//------------------------------------------------------------------
function ci_scopeText() {
  const s = ci_state();
  const parts = [];
  if (s.period[0] !== CI_YMIN || s.period[1] !== CI_YMAX) parts.push(`${s.period[0]}–${s.period[1]}`);
  if (s.cat !== 'ALL') parts.push(ci_t('c6-cat-' + s.cat, DATA_CIUDADES.cats[s.cat]).toLowerCase());
  if (s.neutral) parts.push(ci_t('c6-scope-neutral', 'en cancha neutral'));
  return parts.length ? ' (' + parts.join(', ') + ')' : '';
}
function ci_tip(d) {
  const tt = document.getElementById('tooltip6'); if (!tt) return;
  const noun = d.n === 1 ? ci_t('c6-noun-1', 'partido') : ci_t('c6-noun-n', 'partidos');
  let extra = '';
  if (ci_filtersDefault() && !ci_state().neutral && d.c.neu > 0) {
    extra = `<div style="opacity:.75;">${fmt(d.c.neu)} ${ci_t('c6-tt-neutrales', 'en cancha neutral')} · ${d.c.a0}–${d.c.a1}</div>`;
  }
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${ci_cityName(d.c.n)}, ${ci_paisName(d.c.pais)}</div>`
    + `<div><strong style="font-variant-numeric:tabular-nums;">${fmt(d.n)}</strong> ${noun}${ci_scopeText()}</div>` + extra;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function ci_hexTip(bin) {
  const tt = document.getElementById('tooltip6'); if (!tt || !bin || !bin.length) return;
  let total = 0, top = bin[0];
  for (let i = 0; i < bin.length; i++) { total += bin[i].n; if (bin[i].n > top.n) top = bin[i]; }
  const noun = total === 1 ? ci_t('c6-noun-1', 'partido') : ci_t('c6-noun-n', 'partidos');
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${fmt(total)} ${noun} ${ci_t('c6-hex-zona', 'en esta zona')}${ci_scopeText()}</div>`
    + `<div>${ci_t('c6-hex-top', 'Ciudad con más')}: ${ci_cityName(top.c.n)}, ${ci_paisName(top.c.pais)} <strong style="font-variant-numeric:tabular-nums;">(${fmt(top.n)})</strong></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function ci_tipMove() {
  const tt = document.getElementById('tooltip6'); if (!tt) return;
  const svg = document.getElementById('chart6'); const rc = svg.getBoundingClientRect();
  const ev = ci_tipMove._e;
  if (ev) { const _x = ev.clientX - rc.left, _w = tt.offsetWidth || 170; tt.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px'; tt.style.top = (ev.clientY - rc.top + 14) + 'px'; }
}
function ci_tipHide() { const tt = document.getElementById('tooltip6'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

//------------------------------------------------------------------
//  Headings (título insight en default; subtítulo dinámico con filtros)
//------------------------------------------------------------------
function ci_subtitle() {
  const s = ci_state();
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const view = s.view, bars = view === 'bars', line = view === 'line';
  const heat = view === 'map' && s.heat;
  const period = (s.period[0] === CI_YMIN && s.period[1] === CI_YMAX)
    ? '1872–2026' : s.period[0] + '–' + s.period[1];
  const catTxt = s.cat === 'ALL' ? '' : ci_t('c6-cat-' + s.cat, '') + ' — ';
  const neuTxt = s.neutral ? (lang === 'en' ? ', neutral venue only' : ', solo cancha neutral') : '';
  // el filtro de sede solo aplica a mapa/ranking (la vista línea elige ciudades)
  const geoTxt = (!line && s.geo)
    ? ', ' + ci_t('c6-scope-conf', lang === 'en' ? 'venues in' : 'sedes de') + ' ' + ci_geoLabel() : '';
  const country = s.unit === 'country';
  const unitSg = lang === 'en' ? (country ? 'country' : 'city') : (country ? 'país' : 'ciudad');
  if (line) {
    const maTxt = s.smooth === 'ma'
      ? (lang === 'en' ? `, ${s.maYears}-yr moving average` : `, promedio móvil de ${s.maYears} años`) : '';
    const modeTxt = s.lineMode === 'share'
      ? (lang === 'en' ? `Each ${unitSg}’s share of the year’s matches` : `Participación de cada ${unitSg} en los partidos del año`)
      : (lang === 'en' ? `Matches hosted per year by each ${unitSg}` : `Partidos organizados por año en cada ${unitSg}`);
    return `${catTxt}${modeTxt} (${period}${neuTxt}${maTxt}).`;
  }
  const stackTxt = (bars && s.stacked && s.cat === 'ALL')
    ? (lang === 'en' ? ', by competition' : ', por tipo de competencia') : '';
  if (lang === 'en') {
    if (bars) return `${catTxt}The ${CI_TOPN} ${country ? 'countries' : 'cities'} that hosted the most internationals (${period}${neuTxt}${geoTxt}${stackTxt}).`;
    return `${catTxt}${heat ? 'Hosting density' : 'Matches hosted by each city'} (${period}${neuTxt}${geoTxt}).`;
  }
  if (bars) return `${catTxt}${country ? 'Los' : 'Las'} ${CI_TOPN} ${country ? 'países' : 'ciudades'} que más partidos internacionales organizaron (${period}${neuTxt}${geoTxt}${stackTxt}).`;
  return `${catTxt}${heat ? 'Densidad de partidos organizados' : 'Partidos organizados por cada ciudad'} (${period}${neuTxt}${geoTxt}).`;
}
function ci_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="6"]') || document;
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const s = ci_state();
  const isPristine = ci_filtersDefault() && !s.geo && s.view === 'map' && !s.heat;
  // el título insight solo vale hasta que el usuario toca algo; después queda
  // neutral aunque vuelva a los filtros por defecto (recién vuelve con refresh)
  if (!isPristine) ci_everTouched = true;
  const showInsight = isPristine && !ci_everTouched;
  const titleKey = showInsight ? 'c6-title' : (s.view === 'line' ? 'c6-title-line' : 'c6-title-neutral');
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = ci_t(titleKey, 'Las capitales del fútbol');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = ci_subtitle();
}

//==================================================================
//  Controles
//==================================================================
// Muestra/oculta controles contextuales según vista y estado (una sola fuente).
function ci_syncCtx() {
  const v = ci_state().view;
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  show('ci-map-controls', v === 'map');
  show('ci-geo-controls', v !== 'line');
  show('ci-unit-controls', v !== 'map');
  show('ci-line-controls', v === 'line');
  show('ci-city-chips', v === 'line');
  show('ci-stacked-group', v === 'bars' && ci_state().cat === 'ALL');
  show('ci-ma-group', ci_state().smooth === 'ma');
  const country = ci_state().unit === 'country';
  const pl = document.getElementById('ci-picker-label');
  if (pl) pl.textContent = ci_t(country ? 'c6-country-label' : 'c6-city-label', country ? 'Países' : 'Ciudades');
  const si = document.getElementById('ci-city-search');
  if (si) si.placeholder = ci_t(country ? 'c6-country-ph' : 'c6-city-ph', country ? 'Agregar país…' : 'Agregar ciudad o país…');
  if (typeof ci_tlVideoDlSync === 'function') ci_tlVideoDlSync();
}
function setupCiudadesTabs() {
  const mapBtn = document.getElementById('ci-tab-map'), barsBtn = document.getElementById('ci-tab-bars');
  const lineBtn = document.getElementById('ci-tab-line');
  if (!mapBtn || !barsBtn) return;
  function sync() {
    const v = ci_state().view;
    mapBtn.classList.toggle('active', v === 'map');
    barsBtn.classList.toggle('active', v === 'bars');
    if (lineBtn) lineBtn.classList.toggle('active', v === 'line');
    ci_syncCtx();
  }
  function go(v, resetZoom) {
    if (ci_state().view === v) return;
    state[6].view = v;
    if (resetZoom) ci_zoomT = null;
    if (v === 'line') { ci_ensureDefaultCities(); if (ci_renderCityChips) ci_renderCityChips(); }
    sync();
    if (v === 'line') ci_ensureDet(() => ci_scheduleDraw());
    drawCiudades();
  }
  mapBtn.addEventListener('click', () => go('map', false));
  barsBtn.addEventListener('click', () => go('bars', true));
  if (lineBtn) lineBtn.addEventListener('click', () => go('line', true));
  sync();
}
function setupCiudadesNeutral() {
  document.querySelectorAll('#ci-neutral button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ci-neutral button').forEach(x => x.classList.toggle('active', x === b));
    state[6].neutral = b.dataset.neu === '1';
    ci_ensureDet(() => ci_scheduleDraw());
    ci_scheduleDraw();
  }));
}
function setupCiudadesCat() {
  const sel = document.getElementById('ci-cat-select');
  if (!sel) return;
  sel.value = String(ci_state().cat);
  sel.addEventListener('change', () => {
    state[6].cat = sel.value === 'ALL' ? 'ALL' : +sel.value;
    ci_syncCtx();
    ci_ensureDet(() => ci_scheduleDraw());
    ci_scheduleDraw();
  });
}
// Toggle Ciudades / Países (ranking y evolución)
function setupCiudadesUnit() {
  document.querySelectorAll('#ci-unit button').forEach(b => b.addEventListener('click', () => {
    if (ci_state().unit === b.dataset.unit) return;
    document.querySelectorAll('#ci-unit button').forEach(x => x.classList.toggle('active', x === b));
    state[6].unit = b.dataset.unit;
    ci_colorReset();   // los colores se reasignan a la selección de la nueva unidad
    if (ci_state().view === 'line') { ci_ensureDefaultCities(); if (ci_renderCityChips) ci_renderCityChips(); }
    ci_syncCtx();
    ci_ensureDet(() => ci_scheduleDraw());
    ci_scheduleDraw();
  }));
}
// Toggle Total / Por competencia (apilado del ranking)
function setupCiudadesStacked() {
  document.querySelectorAll('#ci-stacked button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ci-stacked button').forEach(x => x.classList.toggle('active', x === b));
    state[6].stacked = b.dataset.stk === '1';
    ci_ensureDet(() => ci_scheduleDraw());
    ci_scheduleDraw();
  }));
}
// Suavizado Anual / Promedio móvil + slider de años (vista línea)
function setupCiudadesSmooth() {
  document.querySelectorAll('#ci-smooth button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ci-smooth button').forEach(x => x.classList.toggle('active', x === b));
    state[6].smooth = b.dataset.smooth; ci_syncCtx(); ci_scheduleDraw();
  }));
  const ma = document.getElementById('ci-ma'), val = document.getElementById('ci-ma-val');
  if (ma) {
    ma.value = ci_state().maYears;
    if (val) val.textContent = ma.value;
    ma.addEventListener('input', () => { state[6].maYears = +ma.value; if (val) val.textContent = ma.value; ci_scheduleDraw(); });
  }
}
// Buscador de sede (país o confederación): filtra qué ciudades se muestran.
function setupCiudadesGeo() {
  const input = document.getElementById('ci-geo-search');
  const results = document.getElementById('ci-geo-results');
  const chip = document.getElementById('ci-geo-chip');
  if (!input || !results || !chip) return;
  function renderChip() {
    chip.innerHTML = '';
    const g = ci_state().geo; if (!g) return;
    const el = document.createElement('span'); el.className = 'm-selected-chip'; el.style.background = CI_ACCENT;
    el.innerHTML = `<span>${ci_geoLabel()}</span>`;
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
    x.addEventListener('click', () => { state[6].geo = null; renderChip(); ci_scheduleDraw(); });
    el.appendChild(x); chip.appendChild(el);
  }
  function items() {
    const q = input.value.trim().toLowerCase();
    const pool = ci_geoPool(), list = [];
    pool.confs.forEach(c => list.push({ type: 'conf', key: c.key, label: ci_t('c6-conf-' + c.key, c.key), total: c.total }));
    pool.countries.forEach(c => list.push({ type: 'country', key: c.key, label: ci_paisName(c.key), raw: c.key, total: c.total }));
    const f = list.filter(o => q
      ? (o.label.toLowerCase().includes(q) || (o.raw || '').toLowerCase().includes(q))
      : o.type === 'conf');
    f.sort((u, w) => (u.type === w.type) ? w.total - u.total : (u.type === 'conf' ? -1 : 1));
    return f.slice(0, 9);
  }
  function render() {
    results.innerHTML = '';
    const list = items();
    list.forEach(o => {
      const r = document.createElement('div'); r.className = 'm-search-result';
      r.innerHTML = `<span>${o.label}</span><span style="opacity:.6;font-variant-numeric:tabular-nums;">${fmt(o.total)}</span>`;
      r.addEventListener('mousedown', (e) => {
        e.preventDefault();
        state[6].geo = { type: o.type, key: o.key };
        input.value = ''; results.classList.remove('open'); renderChip(); ci_scheduleDraw();
      });
      results.appendChild(r);
    });
    results.classList.toggle('open', list.length > 0);
  }
  input.addEventListener('focus', render);
  input.addEventListener('input', render);
  input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 130));
  renderChip();
}
// Buscador para la vista línea (multi-selección hasta 6). Según la unidad,
// elige ciudades (índices) o países (nombres).
function setupCiudadesCityPicker() {
  const input = document.getElementById('ci-city-search');
  const results = document.getElementById('ci-city-results');
  const chips = document.getElementById('ci-city-chips');
  if (!input || !results || !chips) return;
  const sel = () => ci_lineSelection();   // s.cities o s.countries según unidad
  function selRemove(key) {
    const s = ci_state();
    if (s.unit === 'country') s.countries = (s.countries || []).filter(v => v !== key);
    else s.cities = (s.cities || []).filter(v => v !== key);
  }
  function selAdd(key) {
    const s = ci_state();
    if (s.unit === 'country') { if (!s.countries) s.countries = []; s.countries = s.countries.concat(key); }
    else { if (!s.cities) s.cities = []; s.cities = s.cities.concat(key); }
  }
  function renderChips() {
    chips.innerHTML = '';
    const country = ci_state().unit === 'country';
    sel().forEach((key) => {
      const ckey = (country ? 'p' : 'c') + key;
      const label = country ? ci_paisName(key) : ci_cityName(DATA_CIUDADES.cities[key].n);
      const el = document.createElement('span'); el.className = 'm-selected-chip'; el.style.background = ci_colorFor(ckey);
      el.innerHTML = `<span>${label}</span>`;
      const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
      x.addEventListener('click', () => { selRemove(key); ci_colorFree(ckey); renderChips(); ci_scheduleDraw(); });
      el.appendChild(x); chips.appendChild(el);
    });
  }
  ci_renderCityChips = renderChips;
  function items() {
    const q = input.value.trim().toLowerCase(); if (!q) return [];
    const s = ci_state(), chosen = sel();
    if (s.unit === 'country') {
      const totals = new Map();
      DATA_CIUDADES.cities.forEach(c => { if (!s.geo || ci_geoMatch(c)) totals.set(c.pais, (totals.get(c.pais) || 0) + c.p); });
      const res = [];
      totals.forEach((p, pais) => {
        if (chosen.includes(pais)) return;
        if (ci_paisName(pais).toLowerCase().includes(q) || pais.toLowerCase().includes(q)) res.push({ key: pais, label: ci_paisName(pais), p });
      });
      return res.sort((u, w) => w.p - u.p).slice(0, 9);
    }
    const C = DATA_CIUDADES.cities, res = [];
    for (let i = 0; i < C.length; i++) {
      const c = C[i];
      if (s.geo && !ci_geoMatch(c)) continue;
      if (chosen.includes(i)) continue;
      const nm = ci_cityName(c.n).toLowerCase(), pais = ci_paisName(c.pais).toLowerCase();
      if (nm.includes(q) || pais.includes(q) || c.n.toLowerCase().includes(q) || (c.pais || '').toLowerCase().includes(q))
        res.push({ key: i, label: `${ci_cityName(c.n)} <span style="opacity:.6;">(${ci_paisName(c.pais)})</span>`, p: c.p });
    }
    return res.sort((u, w) => w.p - u.p).slice(0, 9);
  }
  function render() {
    results.innerHTML = '';
    const full = sel().length >= CI_LINE_MAX;
    const list = items();
    list.forEach(o => {
      const r = document.createElement('div'); r.className = 'm-search-result';
      r.innerHTML = `<span>${o.label}</span><span style="opacity:.6;font-variant-numeric:tabular-nums;">${fmt(o.p)}</span>`;
      if (full) { r.style.opacity = '0.4'; r.style.cursor = 'not-allowed'; }
      r.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (sel().length >= CI_LINE_MAX) return;
        selAdd(o.key);
        input.value = ''; results.classList.remove('open');
        renderChips(); ci_ensureDet(() => ci_scheduleDraw()); ci_scheduleDraw();
      });
      results.appendChild(r);
    });
    results.classList.toggle('open', list.length > 0);
  }
  input.addEventListener('focus', render);
  input.addEventListener('input', render);
  input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 130));
  renderChips();
}
function setupCiudadesLineMode() {
  document.querySelectorAll('#ci-line-mode button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ci-line-mode button').forEach(x => x.classList.toggle('active', x === b));
    state[6].lineMode = b.dataset.mode;
    ci_ensureDet(() => ci_scheduleDraw());
    ci_scheduleDraw();
  }));
}
function setupCiudadesSlider() {
  const s = ci_state();
  const fromEl = document.getElementById('ci-slider-from');
  const toEl = document.getElementById('ci-slider-to');
  const dispEl = document.getElementById('ci-range-display');
  const trackActiveEl = document.getElementById('ci-range-track-active');
  if (!fromEl || !toEl) return;
  function updateDisplay() {
    const [a, b] = s.period;
    if (dispEl) dispEl.textContent = `${a}–${b}`;
    if (trackActiveEl) {
      const min = parseInt(fromEl.min, 10), max = parseInt(fromEl.max, 10), span = max - min;
      if (span > 0) {
        trackActiveEl.style.left = ((a - min) / span) * 100 + '%';
        trackActiveEl.style.right = ((max - b) / span) * 100 + '%';
      }
    }
  }
  function syncInputs() { fromEl.value = s.period[0]; toEl.value = s.period[1]; }
  fromEl.addEventListener('input', () => {
    let from = parseInt(fromEl.value, 10); const to = s.period[1];
    if (from > to - CI_MIN_WINDOW) from = to - CI_MIN_WINDOW;
    s.period = [from, to]; syncInputs(); updateDisplay();
    ci_ensureDet(() => ci_scheduleDraw()); ci_scheduleDraw();
  });
  toEl.addEventListener('input', () => {
    const from = s.period[0]; let to = parseInt(toEl.value, 10);
    if (to < from + CI_MIN_WINDOW) to = from + CI_MIN_WINDOW;
    s.period = [from, to]; syncInputs(); updateDisplay();
    ci_ensureDet(() => ci_scheduleDraw()); ci_scheduleDraw();
  });
  syncInputs(); updateDisplay();
}
function setupCiudadesHeatToggle() {
  const btn = document.getElementById('ci-heat-toggle'); if (!btn) return;
  const styleWrap = document.getElementById('ci-heatstyle');
  function sync() {
    const on = !!ci_state().heat;
    btn.classList.toggle('active', on);
    if (styleWrap) styleWrap.style.display = on ? '' : 'none';
  }
  btn.addEventListener('click', () => { state[6].heat = !state[6].heat; sync(); drawCiudades(); });
  sync();
}
function setupCiudadesHeatStyle() {
  const btns = Array.from(document.querySelectorAll('#ci-heatstyle button'));
  if (!btns.length) return;
  function sync() { btns.forEach(b => b.classList.toggle('active', b.dataset.style === ci_heatStyle())); }
  btns.forEach(b => b.addEventListener('click', () => {
    if (ci_heatStyle() !== b.dataset.style) { state[6].heatStyle = b.dataset.style; sync(); drawCiudades(); }
  }));
  sync();
}
function setupCiudadesTimelapse() {
  const play = document.getElementById('ci-tl-play');
  if (play) play.addEventListener('click', () => {
    if (ci_tlPlaying) { ci_tlStop(false); return; }
    ci_ensureDet(() => ci_tlPlay());
  });
  document.querySelectorAll('#ci-tl-mode button').forEach(b => b.addEventListener('click', () => {
    if (ci_tlMode === b.dataset.tl) return;
    document.querySelectorAll('#ci-tl-mode button').forEach(x => x.classList.toggle('active', x === b));
    ci_tlMode = b.dataset.tl;
    ci_tlCtrls();
    if (ci_tlPlaying) { ci_tlStop(false); ci_tlPlay(); }   // reiniciar con el modo nuevo
  }));
  const wr = document.getElementById('ci-tl-win-range'), wv = document.getElementById('ci-tl-win-val');
  if (wr) {
    wr.value = ci_tlWinYears; if (wv) wv.textContent = ci_tlWinYears;
    wr.addEventListener('input', () => { ci_tlWinYears = +wr.value; if (wv) wv.textContent = wr.value; });
    wr.addEventListener('change', () => { if (ci_tlPlaying) { ci_tlStop(false); ci_tlPlay(); } });   // rehacer escala
  }
  ci_tlSyncBtn();
}
// Botón "Descargar video" abajo, junto a Descargar PNG (misma estética), solo
// visible en la vista Mapa (donde vive el timelapse).
function setupCiudadesVideoDownload() {
  const pngBtn = document.querySelector('button.download[data-png="6"]');
  if (!pngBtn) return;
  let vb = document.getElementById('ci-tl-video-dl');
  if (!vb) {
    vb = document.createElement('button');
    vb.className = 'download'; vb.id = 'ci-tl-video-dl'; vb.type = 'button';
    vb.textContent = ci_t('c6-tl-video-dl', 'Descargar video');
    pngBtn.after(document.createTextNode(' '), vb);   // espacio como en el HTML (gap parejo)
    vb.addEventListener('click', () => { if (!ci_tlRecording) ci_ensureDet(() => ci_tlRecord()); });
  }
  ci_tlVideoDlSync();
}
function ci_tlVideoDlSync() {
  const vb = document.getElementById('ci-tl-video-dl'); if (!vb) return;
  vb.style.display = ci_state().view === 'map' ? '' : 'none';
}
function setupCiudadesZoomReset() {
  const btn = document.getElementById('ci-reset-zoom'); if (!btn) return;
  btn.addEventListener('click', () => {
    ci_zoomT = null;
    const svg = d3.select('#chart6');
    if (ci_zoom) svg.transition().duration(300).call(ci_zoom.transform, d3.zoomIdentity);
  });
}
function setupCiudadesCSV() {
  document.querySelectorAll('button.download[data-chart="6-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'ciudad,pais,lat,lon,partidos,neutrales,primer_anio,ultimo_anio\n';
    DATA_CIUDADES.cities.forEach(c => {
      const nm = /[",]/.test(c.n) ? '"' + c.n.replace(/"/g, '""') + '"' : c.n;
      const ps = /[",]/.test(c.pais) ? '"' + c.pais.replace(/"/g, '""') + '"' : c.pais;
      csv += `${nm},${ps},${c.lat},${c.lon},${c.p},${c.neu},${c.a0},${c.a1}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-ciudades.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function initCiudades() {
  ci_state();
  ci_loadGeo();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawCiudades;
  window.__atlasDefaultPngFormat = 'worldmap';
  window.onBeforePngExportGetSourceText = function (chartId) {
    return String(chartId) === '6' ? ((typeof t === 'function' ? t('c6-sources-tpl') : '') || null) : null;
  };
  window.onBeforePngExportGetSubtitle = function (chartId) {
    return String(chartId) === '6' ? ci_subtitle() : null;
  };
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '6') return;
    const clipped = svgClone.querySelector('[clip-path]'); if (clipped) clipped.removeAttribute('clip-path');
    svgClone.setAttribute('overflow', 'visible');
  };
  drawCiudades();
  setupCiudadesTabs();
  setupCiudadesNeutral();
  setupCiudadesCat();
  setupCiudadesUnit();
  setupCiudadesStacked();
  setupCiudadesSmooth();
  setupCiudadesGeo();
  setupCiudadesCityPicker();
  setupCiudadesLineMode();
  setupCiudadesSlider();
  setupCiudadesHeatToggle();
  setupCiudadesHeatStyle();
  setupCiudadesTimelapse();
  setupCiudadesVideoDownload();
  setupCiudadesZoomReset();
  setupCiudadesCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initCiudades._wired) {
    initCiudades._wired = true;
    window.addEventListener('atlas-editor-change', () => drawCiudades());
    let rz = null;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => drawCiudades(), 160); });
  }
  document.getElementById('chart6')?.addEventListener('mousemove', (e) => { ci_tipMove._e = e; });
  // precargar el detalle en segundo plano (no bloquea el primer dibujo)
  setTimeout(() => ci_ensureDet(), 400);
}
