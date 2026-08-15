// =============================================================
//  El Atlas N°4 — Chart 18: intolerancia CONTRA PIB per cápita
// =============================================================
// La pregunta: ¿América Latina es excepcionalmente intolerante, o es lo que
// corresponde a su nivel de ingreso? El protagonista es EL RESIDUO REGIONAL.
//
// Clon del scatter canónico del repo (02-demasiado-desiguales/scatter.js, el
// Gini vs PIB): mismo OLS lineal (s_ols → dv_ols), misma cuadrática
// (s_quadFit → dv_quadFit), mismo cálculo de residuos por región, mismo banner
// con R², mismo slider con play y misma escala log en X. El placement de
// etiquetas es el compartido de lib/scatter-render.js (s_layoutLabels /
// s_relaxLabels), igual que el chart 5 de este número.
//
// Configuración (pedido de Daniel):
//   - Eje X FIJO: PIB per cápita, con toggle LOGARÍTMICA / LINEAL (default log).
//   - Eje Y SELECCIONABLE: las 24 variables de CR_VARS, agrupadas por grupo.
//   - Slider de ola con PLAY, acotado a las olas que existen para la variable.
//
// EL MODELO SIEMPRE SE ESTIMA SOBRE log10(PIB pc). El toggle de escala cambia
// el EJE, no el modelo (igual que el N°2, que ajusta en ln(PIB) llueva o
// truene). Por eso la "recta" se ve recta con eje log y curvada con eje lineal.
// La pendiente se reporta en pp por cada ×10 de PIB per cápita.
//
// Trampas de los datos (documentadas en data-cruces.js):
//   - Las claves de ola de CR_FOTO son STRINGS ("7"); las de CR_VARS.olas son
//     ENTEROS. Todo lookup a CR_FOTO pasa por String(w).
//   - 'antecedentes' e 'inestables' mueren en la ola 5; musulmanes/judíos/
//     gitanos no tienen NINGÚN país de América Latina en la ola 7. Por eso el
//     slider se reconstruye con CR_VARS[i].olas en cada cambio de variable y el
//     banner dice explícitamente cuándo la región no está en la ola elegida.
//   - Un país sin PIB dentro de ±3 años NO entra: no se interpola nada.
//
// CONTRATO DE INTERACCIÓN DEL SCATTER DEL ATLAS (el de los scatters del N°1,
// N°2 y N°3, que este chart había perdido al importar la regla "el hover nunca
// redibuja" de los gráficos de LÍNEAS — donde redibujar sí los tilda):
//   HOVER sobre una región de la leyenda → se ETIQUETAN todos los países de esa
//     región (se re-corre la anti-colisión sobre el conjunto ampliado) y el
//     resto de los puntos se atenúa por opacidad. En un scatter el redibujo ES
//     el mecanismo de la feature; acá se redibuja SOLO el grupo de etiquetas
//     (dv_renderLabels), así la leyenda no se recrea bajo el cursor.
//   CLICK en la leyenda → apaga la región y la SACA del modelo
//     (state[18].hiddenRegions): la recta, el R², el n y los residuos se
//     recalculan sobre los países visibles. Misma norma del chart 1
//     (ranking.js, state[1].hiddenRegions).
//   TAP sobre un punto → tooltip. El chip se togglea desde el buscador y desde
//     la ✕ del chip, nunca tocando el punto.
// WYSIWYG conciliado: el CHIP es la selección persistente y siempre se etiqueta,
// aun durante el hover de otra región; las etiquetas que revela el hover son
// transitorias (más livianas, en el color de su región) y desaparecen al salir.
//
// Depende de: CR_META, CR_WAVES, CR_VARS, CR_REGION, CR_GDP, CR_FOTO
// (data-cruces.js), REGION_ORDER/REGION_COLORS/REGION_LABEL_COLORS
// (lib/regions.js), COUNTRY_NAMES, s_layoutLabels/s_relaxLabels
// (lib/scatter-render.js), y los utils compartidos (fmt, niceLinearTicks,
// niceLog10Ticks, fmtTickGDP, evClientX/Y, isMobileViewport, atlasSetHeading).

// =================== Constantes ===================
const DV_SVG_NS = 'http://www.w3.org/2000/svg';
const dv_ns = (tag) => document.createElementNS(DV_SVG_NS, tag);

const DV_DEFAULT_VAR = 'otra_raza';
// Default pre-tildado (regla WYSIWYG: los chips SON las etiquetas). Los seis
// grandes de América Latina —protagonistas del número— más tres referencias
// globales, para que la recta tenga anclas a los dos lados del ingreso.
// America Latina completa: la tesis del chart ES el residuo regional, asi que
// la region entera nace etiquetada (Daniel 2026-07-29). Son chips normales: se
// sacan de a uno con la cruz o con Limpiar.
const DV_DEFAULT_SEL = ['GTM','NIC','VEN','ECU','BOL','COL','PER','BRA','MEX','ARG','CHL','URY','PRI'];
// Sin pais destacado (ver la misma nota en correlaciones.js).
const DV_HIGHLIGHT = null;
// Anclas globales: cuando el hover revela una región entera y no entran todas
// las etiquetas, la anti-colisión sacrifica primero a los chicos (criterio del
// N°1: subPriority 0 para las anclas, 1 para el resto de la región).
const DV_ANCHORS = {
  USA: 1, DEU: 1, FRA: 1, GBR: 1, ESP: 1, ITA: 1, RUS: 1,
  CHN: 1, JPN: 1, KOR: 1, IND: 1, BRA: 1, MEX: 1, ARG: 1, ZAF: 1, NGA: 1
};
const DV_LATAM = 'Latin America';
const DV_PLAY_MS = 1100;
// Mínimo de países VISIBLES para estimar el ajuste. Si el usuario apaga
// regiones desde la leyenda y quedan menos, NO se estima nada: se ocultan la
// recta y el R² y sólo se informa el n. Nunca un ajuste sobre dos puntos.
const DV_MIN_FIT = 5;

// Dominio del eje X fijo para TODO el dataset (no por ola ni por variable): así
// el eje no salta al mover el slider. Maddison, en estos 112 países, va de
// US$ 936 (Etiopía 2007) a US$ 134.803 (Qatar 2010).
const DV_X_MIN_LOG = 800;
const DV_X_MAX = 150000;

const DV_AXIS_INK = '#7A6E62';
const DV_AXIS_TITLE_INK = '#5A5346';
const DV_GRID = '#ECE7D8';
const DV_BG = '#FAF8F3';
const DV_HI_INK = '#8B4220';

let dv_playTimer = null;
// Círculos del último render, para el foco por región POR OPACIDAD.
let dv_dots = [];
// Contexto del último render (grupo de etiquetas, puntos, escalas): permite
// re-correr el placement de etiquetas en el hover SIN redibujar el chart.
let dv_labelCtx = null;
// Último modelo dibujado: lo reusan el banner y la tira de estadísticos cuando
// cambia la región enfocada, sin volver a dibujar el gráfico.
let dv_lastModel = null;
// Países VISIBLES del último render (los que entraron al modelo). Es el n que
// muestran el banner y la tira, y cambia cuando se apaga una región.
let dv_lastN = 0;
// Países de la celda ANTES de apagar regiones. Distingue los dos "sin ajuste":
// la celda no tiene datos (c18-nodata) vs. el usuario apagó casi todo
// (c18-fewfit). Sin esto, apagar todas las regiones decía "no hay datos".
let dv_lastAll = 0;

// =================== Helpers ===================
function dv_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function dv_lang() {
  return (typeof LANG !== 'undefined') ? LANG : 'es';
}
function dv_t(k) {
  return (typeof t === 'function') ? t(k) : k;
}
function dv_name(iso) {
  const lang = dv_lang();
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}
function dv_regionColor(reg) {
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function dv_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#444';
}
function dv_regionLabel(reg) {
  return reg ? dv_t('reg.' + reg) : '—';
}

// ---- regiones apagadas desde la leyenda ----
// Norma del número, fijada en el chart 1 (ranking.js, state[1].hiddenRegions):
// HOVER = revela las etiquetas de la región y atenúa el resto por opacidad;
// CLICK = apaga y QUITA a esos países. Apagar una región no es sólo esconder
// puntos: los saca del modelo, así que la recta, el R², el n y los residuos se
// recalculan sobre lo que queda visible. Por eso el click redibuja el chart
// entero y el hover redibuja SOLO el grupo de etiquetas.
function dv_hidden() {
  return new Set(state[18].hiddenRegions || []);
}
// Región apuntada por el hover, si sigue encendida (una región apagada no
// tiene puntos ni etiquetas que revelar).
function dv_hoverRegion() {
  const s = state[18];
  if (!s || !s.hoverRegion) return null;
  return dv_hidden().has(s.hoverRegion) ? null : s.hoverRegion;
}
function dv_toggleRegion(reg) {
  const arr = state[18].hiddenRegions || (state[18].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  // En touch el mouseenter llega pero el mouseleave nunca: soltamos el hover
  // en cada click para no dejar una región "apuntada" pegada.
  state[18].hoverRegion = null;
  drawDesarrollo();
}
function dv_showAllRegions() {
  state[18].hiddenRegions = [];
  state[18].hoverRegion = null;
  drawDesarrollo();
}
// El botón "Ver todas las regiones" sólo existe cuando hay algo apagado (así no
// gasta alto cuando no hace falta: ver el ajuste de altura del encabezado).
function dv_syncShowAll() {
  const btn = document.getElementById('dv-show-all');
  if (!btn) return;
  if ((state[18].hiddenRegions || []).length) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}
function dv_measure(text, fs, weight) {
  if (!dv_measure._c) {
    dv_measure._c = document.createElement('canvas').getContext('2d');
  }
  dv_measure._c.font = `${weight || 500} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return dv_measure._c.measureText(text).width;
}
function dv_num(n, dec) {
  return (typeof fmt === 'function') ? fmt(n, dec) : String(n);
}
// Residuo formateado con signo tipográfico (menos real, no guion).
function dv_signed(v, dec, unit) {
  return (v >= 0 ? '+' : '−') + dv_num(Math.abs(v), dec) + (unit || '');
}

// Metadatos de una variable del menú.
function dv_varMeta(k) {
  for (let i = 0; i < CR_VARS.length; i++) {
    if (CR_VARS[i].k === k) return CR_VARS[i];
  }
  return CR_VARS[0];
}
function dv_varLabel(v) {
  return dv_lang() === 'en' ? v.en : v.es;
}
function dv_varDef(v) {
  return dv_lang() === 'en' ? v.def_en : v.def_es;
}
// Forma de TÍTULO de la variable ("rechazo a vecinos de otra raza"): frase en
// minúscula lista para componer, no el rótulo del menú ("Personas de otra
// raza"), que suelto en un título se lee como una lista de grupos y no como una
// medición. Mismo criterio y mismo campo del dataset que el chart 19.
function dv_varTitulo(v) {
  if (!v) return '';
  const tit = dv_lang() === 'en' ? v.titulo_en : v.titulo_es;
  return tit || dv_varLabel(v);
}
// Definición CORTA para el subtítulo: la primera oración de def_es/def_en. Lo
// que sigue son advertencias («OJO: acá más es MEJOR», de dónde sale el World
// Risk Poll) y ésas viven en la nota, no en la bajada. Se abre el «%» en
// palabra —una bajada no empieza con un símbolo— y se saca el punto final,
// porque la plantilla sigue con «, y PIB per cápita».
function dv_defCorta(v) {
  let d = (dv_varDef(v) || '').trim();
  const i = d.indexOf('. ');
  if (i > 0) d = d.slice(0, i);
  d = d.replace(/\.$/, '');
  // Y sin la aclaración entre paréntesis del final ("(el «ni una ni otra» queda
  // en el denominador)"): es metodología, y la metodología va en la nota.
  d = d.replace(/\s*\([^()]*\)$/, '');
  return d.replace(/^%\s*/, dv_lang() === 'en' ? 'Share ' : 'Porcentaje ');
}
// ¿La variable es una de las 14 categorías de la batería de vecinos? Es la
// única familia donde «declara menos rechazo» es literal y donde una sola
// definición sirve para todas.
function dv_esBateria(v) {
  return !!v && DV_GRP_KEY[v.grupo] === 'c18-grp-vecinos';
}
// Rango REAL de años de campo de los puntos dibujados. La etiqueta de la ola
// ("2017-2023") es el nombre nominal del período; el campo de verdad llega
// hasta 2023 (India). Mismo helper que rk_rangoAnios en el chart 1.
function dv_rangoAnios(pts) {
  const ys = (pts || []).map(p => p.year).filter(y => y);
  if (!ys.length) return dv_waveLabel(state[18].wave);
  const a = Math.min.apply(null, ys), b = Math.max.apply(null, ys);
  return (a === b) ? String(a) : (a + '-' + b);
}
// ¿La ola elegida es la última que tiene esta variable? Con la última, la foto
// ES el último dato de cada país; con una ola vieja, decirlo sería falso.
function dv_esUltimaOla() {
  const olas = dv_wavesFor(state[18].k);
  return !!olas.length && state[18].wave === Math.max.apply(null, olas);
}
// ¿Estado por default? El título editorial afirma algo sobre América Latina en
// la foto completa: sigue valiendo si el lector cambia de CATEGORÍA (el título
// se rearma con la nueva), pero no si cambia de ola, apaga una región o toca la
// selección de países, porque entonces el número que lo sostiene ya no es el
// que se calculó (criterio de Daniel 2026-07-30: "al cambiar cualquier otra
// cosa, título neutral… agregar o sacar países también").
function dv_esDefault() {
  const s = state[18];
  if (!s) return false;
  if (!dv_esUltimaOla()) return false;
  if (dv_hidden().size) return false;
  const sel = (s.selected || []).slice().sort().join(',');
  return sel === DV_DEFAULT_SEL.slice().sort().join(',');
}
// Texto custom del editor (?nl=1) para un campo: si lo hay, los títulos
// dinámicos no lo pisan.
function dv_editorCustom(field) {
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  if (!ae || !ae.texts) return '';
  const tx = ae.texts[(ae.lang || dv_lang())] || {};
  return (tx[field] || '').trim();
}
function dv_waveLabel(w) {
  for (let i = 0; i < CR_WAVES.length; i++) {
    if (CR_WAVES[i].w === w) return CR_WAVES[i].label;
  }
  return String(w);
}
// Olas disponibles para una variable (enteros, ascendentes).
function dv_wavesFor(k) {
  const v = dv_varMeta(k);
  return (v.olas || []).slice().sort((a, b) => a - b);
}
// La ola de esa lista más cercana a `w` (empate → la más reciente).
function dv_nearestWave(waves, w) {
  if (!waves.length) return null;
  let best = waves[0], bestd = Math.abs(waves[0] - w);
  for (let i = 1; i < waves.length; i++) {
    const d = Math.abs(waves[i] - w);
    if (d < bestd || (d === bestd && waves[i] > best)) { best = waves[i]; bestd = d; }
  }
  return best;
}

// PIB del país para el año de SU encuesta: la clave de CR_GDP[iso] más cercana
// con |dif| <= CR_META.gdp_tolerancia. Sin match, el país NO entra al scatter.
// (Los 6 países sin Maddison no tienen NINGUNA entrada en CR_GDP, así que nunca
// hay match espurio; verificado en el generador, 480/480 pares.)
function dv_gdpFor(iso, year) {
  const d = CR_GDP[iso];
  if (!d) return null;
  const tol = CR_META.gdp_tolerancia;
  let best = null, bestd = null;
  for (const key in d) {
    if (!Object.prototype.hasOwnProperty.call(d, key)) continue;
    const y = parseInt(key, 10);
    const dd = Math.abs(y - year);
    if (dd <= tol && (bestd === null || dd < bestd)) {
      best = { gdp: d[key], gdpYear: y };
      bestd = dd;
    }
  }
  return best;
}

// Puntos de la celda activa (variable × ola), ya cruzados con el PIB.
function dv_points() {
  const s = state[18];
  const cell = CR_FOTO[s.k] ? CR_FOTO[s.k][String(s.wave)] : null;
  if (!cell) return [];
  const out = [];
  for (let i = 0; i < cell.length; i++) {
    const row = cell[i];
    const g = dv_gdpFor(row[0], row[2]);
    if (!g) continue;
    out.push({
      iso: row[0], pct: row[1], year: row[2], n: row[3],
      gdp: g.gdp, gdpYear: g.gdpYear,
      region: CR_REGION[row[0]] || ''
    });
  }
  return out;
}

// Tope del eje Y por variable, sobre TODAS sus olas: el eje no salta al mover
// el slider. Cacheado por clave.
function dv_yMaxFor(k) {
  if (!dv_yMaxFor._cache) dv_yMaxFor._cache = {};
  if (dv_yMaxFor._cache[k] != null) return dv_yMaxFor._cache[k];
  let mx = 0;
  const byWave = CR_FOTO[k] || {};
  for (const w in byWave) {
    if (!Object.prototype.hasOwnProperty.call(byWave, w)) continue;
    const rows = byWave[w];
    for (let i = 0; i < rows.length; i++) if (rows[i][1] > mx) mx = rows[i][1];
  }
  const top = Math.min(100, Math.max(10, Math.ceil(mx / 10) * 10));
  dv_yMaxFor._cache[k] = top;
  return top;
}

// =================== Regresión (clon de scatter.js del N°2) ===================
// OLS lineal: y = a + b·x. Devuelve {a, b, c:null, r2}.
function dv_ols(points) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += points[i].x; sy += points[i].y; }
  const mx = sx / n, my = sy / n;
  let num = 0, den = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - mx, dy = points[i].y - my;
    num += dx * dy;
    den += dx * dx;
    ssTot += dy * dy;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yp = a + b * points[i].x;
    ssRes += (points[i].y - yp) * (points[i].y - yp);
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a: a, b: b, c: null, r2: r2 };
}

// OLS cuadrática: y = a + b·x + c·x². Normal equations 3×3 resueltas por
// Cramer, sin libs (idéntico a s_quadFit del N°2).
function dv_quadFit(points) {
  const n = points.length;
  if (n < 3) return null;
  let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0;
  let sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < n; i++) {
    const x = points[i].x, y = points[i].y;
    const x2 = x * x;
    sx += x; sx2 += x2; sx3 += x2 * x; sx4 += x2 * x2;
    sy += y; sxy += x * y; sx2y += x2 * y;
  }
  const det = (m) =>
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det([[n, sx, sx2], [sx, sx2, sx3], [sx2, sx3, sx4]]);
  if (Math.abs(D) < 1e-12) return null;
  const a = det([[sy, sx, sx2], [sxy, sx2, sx3], [sx2y, sx3, sx4]]) / D;
  const b = det([[n, sy, sx2], [sx, sxy, sx3], [sx2, sx2y, sx4]]) / D;
  const c = det([[n, sx, sy], [sx, sx2, sxy], [sx2, sx3, sx2y]]) / D;
  const my = sy / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = points[i].x, y = points[i].y;
    const yp = a + b * x + c * x * x;
    ssTot += (y - my) * (y - my);
    ssRes += (y - yp) * (y - yp);
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a: a, b: b, c: c, r2: r2 };
}

// Residuo promedio por región, en puntos porcentuales (real − predicho).
function dv_regionResiduals(pts) {
  const acc = {};
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!acc[p.region]) acc[p.region] = { sum: 0, n: 0 };
    acc[p.region].sum += p.resid;
    acc[p.region].n += 1;
  }
  const out = {};
  for (const reg in acc) {
    if (!Object.prototype.hasOwnProperty.call(acc, reg)) continue;
    out[reg] = { pp: acc[reg].sum / acc[reg].n, n: acc[reg].n };
  }
  return out;
}

// Modelo activo. Muta los puntos agregándoles pred/resid.
// Devuelve null si no hay al menos DV_MIN_FIT países visibles: en ese caso el
// chart se dibuja igual (puntos, ejes, leyenda) pero sin recta ni R².
function dv_buildModel(pts) {
  if (pts.length < DV_MIN_FIT) return null;
  const xy = pts.map(p => ({ x: Math.log10(p.gdp), y: p.pct }));
  const quad = state[18].model === 'quad';
  const reg = quad ? dv_quadFit(xy) : dv_ols(xy);
  if (!reg) return null;
  const isQuad = quad && reg.c != null;
  const predict = isQuad
    ? (gdp) => { const x = Math.log10(gdp); return reg.a + reg.b * x + reg.c * x * x; }
    : (gdp) => reg.a + reg.b * Math.log10(gdp);
  for (let i = 0; i < pts.length; i++) {
    pts[i].pred = predict(pts[i].gdp);
    pts[i].resid = pts[i].pct - pts[i].pred;
  }
  return {
    a: reg.a, b: reg.b, c: reg.c, r2: reg.r2,
    n: pts.length,
    quad: isQuad,
    predict: predict,
    byRegion: dv_regionResiduals(pts)
  };
}

// =================== Escalas ===================
function dv_makeScales(scaleX, yMax, MARGIN, plotW, plotH) {
  const logMode = scaleX === 'log';
  const x0 = logMode ? Math.log10(DV_X_MIN_LOG) : 0;
  const x1 = logMode ? Math.log10(DV_X_MAX) : DV_X_MAX;
  const xScale = (gdp) => {
    const v = logMode ? Math.log10(gdp) : gdp;
    return MARGIN.left + ((v - x0) / (x1 - x0)) * plotW;
  };
  const yScale = (pct) => MARGIN.top + plotH - (pct / yMax) * plotH;
  return { xScale: xScale, yScale: yScale };
}

// =================== Layout por formato ===================
// baseBottom cubre el hueco de los ticks del eje X; encima se suman el título
// del eje y las filas de la leyenda (que se calculan antes, ver drawDesarrollo).
function dv_layout(editorFormat, mobile) {
  if (editorFormat === 'newsletter' || editorFormat === 'square') {
    return { W: 1100, H: 760, M: { top: 76, right: 44, left: 108 }, baseBottom: 30,
             SIZES: { tick: 22, axisTitle: 25, label: 24, dot: 8, strip: 22, legend: 20 } };
  }
  if (editorFormat === 'mobile') {
    return { W: 1100, H: 1100, M: { top: 84, right: 40, left: 108 }, baseBottom: 58,
             SIZES: { tick: 26, axisTitle: 28, label: 25, dot: 9, strip: 26, legend: 22 } };
  }
  if (editorFormat === 'public') {
    return { W: 1100, H: 619, M: { top: 54, right: 36, left: 82 }, baseBottom: 34,
             SIZES: { tick: 15, axisTitle: 17, label: 16, dot: 6, strip: 15, legend: 14 } };
  }
  if (editorFormat === 'worldmap') {
    return { W: 1100, H: 580, M: { top: 52, right: 36, left: 82 }, baseBottom: 32,
             SIZES: { tick: 15, axisTitle: 17, label: 16, dot: 6, strip: 15, legend: 14 } };
  }
  if (mobile) {
    return { W: 1100, H: 1250, M: { top: 110, right: 36, left: 126 }, baseBottom: 62,
             SIZES: { tick: 28, axisTitle: 30, label: 27, dot: 9, strip: 28, legend: 23 } };
  }
  // DESKTOP EN PANTALLA. Bajado de 1100x620 a 1100x480 para que el gráfico
  // entre sin scrollear (pedido de Daniel). OJO: esta rama NO toca el PNG —
  // los formatos de exportación son las ramas de arriba (newsletter/square/
  // mobile/public), que siguen con sus medidas de siempre.
  return { W: 1100, H: 480, M: { top: 44, right: 34, left: 72 }, baseBottom: 22,
           SIZES: { tick: 11, axisTitle: 12, label: 11.5, dot: 5, strip: 11, legend: 10.5 } };
}

// Filas de la leyenda de regiones. Se calcula ANTES de fijar el margen inferior
// porque solo depende del ancho del plot (que solo depende de left/right).
function dv_legendLayout(regions, fs, plotW) {
  const dotR = fs * 0.45;
  const gapDot = dotR * 2 + fs * 0.5;
  const gapItem = fs * 1.5;
  const items = regions.map(r => {
    const label = dv_regionLabel(r);
    return { region: r, label: label, w: gapDot + dv_measure(label, fs, 500) + gapItem };
  });
  const rows = [];
  let cur = [], curW = 0;
  items.forEach(it => {
    if (curW + it.w > plotW && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(it); curW += it.w;
  });
  if (cur.length) rows.push(cur);
  return { rows: rows, dotR: dotR, gapDot: gapDot, gapItem: gapItem, rowH: fs * 1.7 };
}

// =================== Render principal ===================
function drawDesarrollo() {
  const svg = document.getElementById('chart18');
  if (!svg) return;
  svg.innerHTML = '';
  dv_dots = [];
  dv_labelCtx = null;

  const s = state[18];
  const v = dv_varMeta(s.k);
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && dv_isMobile();
  const bigFmt = !!editorFormat || mobile;

  const L = dv_layout(editorFormat, mobile);
  const W = L.W, H = L.H, SIZES = L.SIZES;
  // El margen superior existe SÓLO para la tira de estadísticos, y la tira se
  // dibuja únicamente al exportar (en pantalla los mismos números están en el
  // banner HTML de abajo: mostrarlos dos veces era la duplicación que marcó
  // Daniel). Sin tira, ese alto se le devuelve al gráfico.
  // Sin tira de estadísticos tampoco en el PNG (decisión de Daniel 2026-07-27):
  // el margen superior devuelve ese alto al gráfico en TODOS los formatos.
  const marginTop = Math.max(editorFormat ? 28 : (mobile ? 26 : 16), L.M.top - SIZES.strip * 1.6);
  const MARGIN = { top: marginTop, right: L.M.right, left: L.M.left, bottom: 0 };
  const plotW = W - MARGIN.left - MARGIN.right;

  // allPts = todo lo que hay en la celda; pts = lo que queda después de apagar
  // regiones desde la leyenda. El MODELO se estima sobre pts.
  const allPts = dv_points();
  const hidden = dv_hidden();
  const pts = allPts.filter(p => !hidden.has(p.region));

  // Leyenda: las regiones REALMENTE presentes en la celda (incluidas las
  // apagadas, para poder volver a prenderlas), en el orden del Atlas. En los
  // formatos de exportación las apagadas no se listan: el PNG muestra sólo lo
  // que está dibujado.
  const presentRegions = (typeof REGION_ORDER !== 'undefined' ? REGION_ORDER : [])
    .filter(r => allPts.some(p => p.region === r))
    .filter(r => !editorFormat || !hidden.has(r));
  // Válvula de seguridad: si con el cuerpo elegido la leyenda se come más de un
  // cuarto del alto (pasa con nombres largos en formatos chicos), la achicamos
  // en vez de dejar el plot sin altura.
  let legendFs = SIZES.legend;
  let leg = dv_legendLayout(presentRegions, legendFs, plotW);
  if (leg.rows.length * leg.rowH > H * 0.26) {
    legendFs = SIZES.legend * 0.8;
    leg = dv_legendLayout(presentRegions, legendFs, plotW);
  }
  const legendH = leg.rows.length * leg.rowH;
  const xTickGap = bigFmt ? SIZES.tick * 1.5 : 17;
  MARGIN.bottom = xTickGap + L.baseBottom + SIZES.axisTitle * 1.7 + legendH + legendFs * 1.4;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const model = dv_buildModel(pts);
  dv_lastModel = model;
  dv_lastN = pts.length;
  dv_lastAll = allPts.length;

  // Celda sin NINGÚN dato: no dibujamos un par de ejes vacíos.
  // (Con modelo nulo pero puntos visibles sí se dibuja todo: lo único que
  // desaparece es la recta y el R². Ver dv_buildModel / DV_MIN_FIT.)
  if (!allPts.length) {
    const msg = dv_ns('text');
    msg.setAttribute('x', W / 2);
    msg.setAttribute('y', MARGIN.top + Math.max(60, plotH / 2));
    msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    msg.setAttribute('fill', DV_AXIS_INK);
    msg.style.fontSize = SIZES.axisTitle + 'px';
    msg.textContent = dv_t('c18-nodata');
    svg.appendChild(msg);
    dv_updateSubtitle(v, pts);
    dv_updateTitle(v, null);
    dv_updateBanner(null, 0);
    dv_syncShowAll();
    return;
  }

  const yMax = dv_yMaxFor(s.k);
  const sc = dv_makeScales(s.scaleX, yMax, MARGIN, plotW, plotH);
  const xScale = sc.xScale, yScale = sc.yScale;
  const plotBox = {
    x1: MARGIN.left + 1, x2: MARGIN.left + plotW - 1,
    y1: MARGIN.top + 1, y2: MARGIN.top + plotH - 1
  };

  // === Fondo del área de plot ===
  const bg = dv_ns('rect');
  bg.setAttribute('x', MARGIN.left); bg.setAttribute('y', MARGIN.top);
  bg.setAttribute('width', plotW); bg.setAttribute('height', plotH);
  bg.setAttribute('fill', DV_BG);
  svg.appendChild(bg);

  // === Grid + ticks X ===
  const gridG = dv_ns('g'); svg.appendChild(gridG);
  let xTicks;
  if (s.scaleX === 'log') {
    xTicks = (typeof niceLog10Ticks === 'function')
      ? niceLog10Ticks(DV_X_MIN_LOG, DV_X_MAX) : [1000, 10000, 100000];
    // En formatos grandes (PNG mobile-first) 7 ticks se pisan: potencias de 10.
    if (bigFmt) {
      xTicks = xTicks.filter(vv => Math.abs(Math.log10(vv) - Math.round(Math.log10(vv))) < 1e-9);
    }
  } else {
    xTicks = (typeof niceLinearTicks === 'function')
      ? niceLinearTicks(0, DV_X_MAX, 6) : [0, 50000, 100000, 150000];
    if (bigFmt) xTicks = xTicks.filter((vv, i) => i % 2 === 0);
  }
  xTicks.forEach(vv => {
    const x = xScale(vv);
    if (x < MARGIN.left - 0.5 || x > MARGIN.left + plotW + 0.5) return;
    const ln = dv_ns('line');
    ln.setAttribute('x1', x); ln.setAttribute('x2', x);
    ln.setAttribute('y1', MARGIN.top); ln.setAttribute('y2', MARGIN.top + plotH);
    ln.setAttribute('stroke', DV_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = dv_ns('text');
    tx.setAttribute('x', x);
    tx.setAttribute('y', MARGIN.top + plotH + xTickGap);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', DV_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = (typeof fmtTickGDP === 'function') ? fmtTickGDP(vv) : ('$' + vv);
    gridG.appendChild(tx);
  });

  // === Grid + ticks Y ===
  const yTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, 6) : [];
  yTicks.forEach(vv => {
    const y = yScale(vv);
    const ln = dv_ns('line');
    ln.setAttribute('x1', MARGIN.left); ln.setAttribute('x2', MARGIN.left + plotW);
    ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    ln.setAttribute('stroke', DV_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = dv_ns('text');
    tx.setAttribute('x', MARGIN.left - SIZES.tick * 0.7);
    tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', DV_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = Math.round(vv) + '%';
    gridG.appendChild(tx);
  });

  // === Títulos de eje ===
  const xTitleY = MARGIN.top + plotH + xTickGap + SIZES.axisTitle * 1.6;
  const xTitle = dv_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', xTitleY);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.setAttribute('fill', DV_AXIS_TITLE_INK);
  xTitle.setAttribute('font-weight', 500);
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.textContent = dv_t(s.scaleX === 'log' ? 'c18-axis-x-log' : 'c18-axis-x-linear');
  svg.appendChild(xTitle);

  const yTitle = dv_ns('text');
  const ytx = bigFmt ? 26 : 16;
  yTitle.setAttribute('x', ytx);
  yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.setAttribute('fill', DV_AXIS_TITLE_INK);
  yTitle.setAttribute('font-weight', 500);
  yTitle.style.fontSize = SIZES.axisTitle + 'px';
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  yTitle.textContent = dv_varLabel(v) + dv_t('c18-axis-y-suffix');
  svg.appendChild(yTitle);

  // === Curva de regresión ===
  // Se dibuja SOLO sobre el rango de PIB realmente observado: no extrapolamos
  // visualmente fuera de los datos. Se corta donde se sale del eje Y.
  // Sin modelo (menos de DV_MIN_FIT países visibles) no hay recta: no se
  // dibuja un ajuste sobre dos puntos.
  if (model) {
    let gLo = Infinity, gHi = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].gdp < gLo) gLo = pts[i].gdp;
      if (pts[i].gdp > gHi) gHi = pts[i].gdp;
    }
    const N_SAMPLES = 200;
    const lo = Math.log10(gLo), hi = Math.log10(gHi);
    let d = '', pen = false;
    for (let i = 0; i <= N_SAMPLES; i++) {
      const gdp = Math.pow(10, lo + (i / N_SAMPLES) * (hi - lo));
      const yp = model.predict(gdp);
      if (yp < 0 || yp > yMax) { pen = false; continue; }
      const px = xScale(gdp), py = yScale(yp);
      d += (pen ? ' L ' : ' M ') + px.toFixed(1) + ' ' + py.toFixed(1);
      pen = true;
    }
    if (d) {
      const path = dv_ns('path');
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
  state[18].selected.forEach(c => { selSet[c] = true; });
  // Orden de dibujo: el resto abajo, LatAm encima, los elegidos más arriba,
  // Argentina al final. (Seleccionar NO atenúa a nadie: eso lo hace el hover.)
  const ordered = pts.slice().sort((a, b) => {
    const score = (p) => (p.region === DV_LATAM ? 1 : 0)
      + (selSet[p.iso] ? 3 : 0) + (p.iso === DV_HIGHLIGHT ? 6 : 0);
    return score(a) - score(b);
  });
  const dotsG = dv_ns('g'); svg.appendChild(dotsG);
  ordered.forEach(p => {
    const cx = xScale(p.gdp), cy = yScale(p.pct);
    const isHi = p.iso === DV_HIGHLIGHT;
    const isSel = !!selSet[p.iso];
    const r = isHi ? SIZES.dot * 1.45 : (isSel ? SIZES.dot * 1.2 : SIZES.dot);
    const c = dv_ns('circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', dv_regionColor(p.region));
    c.setAttribute('fill-opacity', isHi ? 1 : (isSel ? 0.95 : 0.8));
    c.setAttribute('stroke', (isHi || isSel) ? '#3A3530' : DV_BG);
    c.setAttribute('stroke-width', isHi ? 2 : (isSel ? 1.2 : 1));
    c.style.cursor = 'pointer';
    c.dataset.iso = p.iso;
    c.dataset.region = p.region;
    c.addEventListener('mouseenter', (e) => dv_showTooltip(e, p));
    c.addEventListener('mousemove', (e) => dv_posTooltip(e));
    c.addEventListener('mouseleave', () => dv_hideTooltip());
    dotsG.appendChild(c);
    dv_dots.push(c);
    // Hit-area invisible: el punto mide ~2px reales en el celu, el tap sería
    // imposible sin ella.
    const hit = dv_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
    hit.setAttribute('r', Math.max(30, r * 2.4));   // 30 = área de toque canónica
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', (e) => dv_showTooltip(e, p));
    hit.addEventListener('mousemove', (e) => dv_posTooltip(e));
    hit.addEventListener('mouseleave', () => dv_hideTooltip());
    // CLIC = SELECCIONAR, igual que agregarlo desde el buscador (pedido de
    // Daniel 2026-07-26). En pantallas SIN hover el tap es la unica forma de
    // leer el tooltip, asi que ahi el tap sigue siendo tooltip y la seleccion
    // se hace desde el buscador y la cruz del chip.
    const clickH = (e) => {
      e.stopPropagation();
      if (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) { dv_showTooltip(e, p); return; }
      dv_toggleCountry(p.iso);
    };
    c.addEventListener('click', clickH);
    hit.addEventListener('click', clickH);
    dotsG.appendChild(hit);
  });

  // === Etiquetas ===
  // El grupo se re-dibuja SOLO (dv_renderLabels) cuando cambia la región
  // apuntada por el hover: es ahí donde se re-corre la anti-colisión sobre el
  // conjunto ampliado.
  const labelsG = dv_ns('g'); svg.appendChild(labelsG);
  dv_labelCtx = {
    g: labelsG, pts: pts, plotBox: plotBox, SIZES: SIZES, bigFmt: bigFmt,
    xScale: xScale, yScale: yScale,
    // Durante la EXPORTACIÓN el hover se congela: png-export.js setea
    // __atlasPngFormatOverride y vuelve a llamar a __atlasRedraw, así que si el
    // mouse estaba sobre la leyenda el PNG salía con una región revelada y el
    // resto al 16%. Ojo: no alcanza con mirar editorFormat, porque con el
    // editor abierto (preview) el hover SÍ tiene que funcionar.
    frozen: !!window.__atlasPngFormatOverride
  };
  dv_renderLabels();

  // === Tira de estadísticos DENTRO del SVG — SÓLO al exportar ===
  // El banner HTML no entra al PNG (png-export rasteriza el SVG), así que el R²
  // y el residuo regional tienen que ir adentro del gráfico… pero SÓLO ahí: en
  // pantalla el banner de abajo ya los muestra y repetirlos era la duplicación
  // que marcó Daniel («esto es redundante, misma lógica que en el N°2»).

  // === Leyenda de regiones, debajo del título del eje X ===
  dv_drawLegend(svg, leg, MARGIN, plotW, xTitleY, legendFs);

  // Cierre del tooltip al tocar/clickear fuera de un dato (y soltar el hover:
  // en touch el mouseleave de la leyenda no llega nunca).
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { dv_hideTooltip(); dv_setHoverRegion(null); }
  };

  dv_updateSubtitle(v, pts);
  // El título lo arman la variable elegida y el residuo recién calculado, así
  // que no puede salir de una clave fija y no va por atlasSetHeading (mismo
  // mecanismo que co_updateTitle en el chart 19).
  dv_updateTitle(v, model);
  dv_syncShowAll();
  dv_applyRegionFocus();
}

// =================== Etiquetas ===================
// Conjunto de etiquetas = los chips elegidos (selección PERSISTENTE, forced: si
// hay que sacrificar a alguien nunca es un chip) ∪ los países de la región
// apuntada por el hover (TRANSITORIOS: entran si hay lugar y desaparecen al
// salir). La anti-colisión se re-corre DESDE CERO sobre el conjunto nuevo: ése
// es el mecanismo de la feature, no hay layout precalculado ni caché.
function dv_renderLabels() {
  const ctx = dv_labelCtx;
  if (!ctx || !ctx.g) return;
  while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);

  const SIZES = ctx.SIZES, bigFmt = ctx.bigFmt;
  const hover = ctx.frozen ? null : dv_hoverRegion();
  const selSet = {};
  (state[18].selected || []).forEach(c => { selSet[c] = true; });

  const items = [];
  ctx.pts.forEach(p => {
    const isSel = !!selSet[p.iso];
    const isHover = !isSel && !!hover && p.region === hover;
    if (!isSel && !isHover) return;
    const isHi = p.iso === DV_HIGHLIGHT;
    const fs = isSel ? SIZES.label : SIZES.label * 0.92;
    const weight = isSel ? (isHi ? 700 : 600) : 500;
    const text = dv_name(p.iso);
    items.push({
      cx: ctx.xScale(p.gdp), cy: ctx.yScale(p.pct), text: text,
      textW: dv_measure(text, fs, weight),
      iso: p.iso, region: p.region,
      forced: isSel,
      subPriority: isSel ? 0 : (DV_ANCHORS[p.iso] ? 1 : 2),
      transient: !isSel, fs: fs, weight: weight,
      r: isHi ? SIZES.dot * 1.45 : (isSel ? SIZES.dot * 1.2 : SIZES.dot)
    });
  });

  const placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, ctx.plotBox) : [];
  if (typeof s_relaxLabels === 'function') {
    // Obstáculos: SOLO los puntos etiquetados (criterio del N°1, recuperado en
    // la auditoría de scatters). Con TODOS los puntos como obstáculo, el label
    // no encuentra hueco en la zona densa y huye lejos de su círculo — eso eran
    // las guías larguísimas que marcó Daniel (2026-07-27).
    const obstacles = items.map(it => ({ x: it.cx, y: it.cy, r: (it.r || SIZES.dot) + 2 }));
    // El alto que ve el relax incluye el HALO del texto (5 px en formatos
    // grandes): sin esto el modelo declara separados dos labels cuyos halos
    // todavia se pisan, y el halo crema BORRA las letras del vecino
    // (el "ArgeBrasil" del PNG que marco Daniel, 2026-07-27).
    s_relaxLabels(placed, SIZES.label + (bigFmt ? 5 : 3), ctx.plotBox, bigFmt ? 220 : 80, obstacles, { edgeAware: true });
  }

  placed.forEach(l => {
    const fs = l.fs || SIZES.label;
    let src = null;
    for (let i = 0; i < items.length; i++) if (items[i].iso === l.iso) { src = items[i]; break; }
    if (src) {
      // Geometría de la guía: s_leaderLine (borde del punto → borde de la caja).
      const guia = (typeof s_leaderLine === 'function')
        ? s_leaderLine(l, { x: src.cx, y: src.cy, r: src.r }, fs, bigFmt ? 10 : 7)
        : null;
      if (guia) {
        const gl = dv_ns('line');
        gl.setAttribute('x1', guia.x1); gl.setAttribute('y1', guia.y1);
        gl.setAttribute('x2', guia.x2); gl.setAttribute('y2', guia.y2);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.7);
        gl.setAttribute('stroke-opacity', l.transient ? 0.55 : 1);
        ctx.g.appendChild(gl);
      }
    }
    const tx = dv_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('font-weight', l.weight || 600);
    tx.setAttribute('fill', l.iso === DV_HIGHLIGHT ? DV_HI_INK : dv_regionLabelColor(l.region));
    // Peso y opacidad más livianos: se ve que la etiqueta revelada por el hover
    // no es lo mismo que un chip (la selección persistente).
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    tx.setAttribute('paint-order', 'stroke');
    tx.setAttribute('stroke', DV_BG);
    tx.setAttribute('stroke-width', bigFmt ? 5 : 2.6);
    tx.setAttribute('stroke-linejoin', 'round');
    tx.style.fontSize = fs + 'px';
    tx.textContent = l.text;
    ctx.g.appendChild(tx);
  });
}

// Dos líneas en el margen superior del SVG: R² + n, y el residuo de la región
// enfocada. La línea 2 lleva data-strip-line="2" para que el foco por región la
// reescriba sin redibujar el gráfico. SÓLO se dibuja al exportar (ver
// drawDesarrollo): en pantalla los mismos números viven en el banner HTML.
//
// SIN la pendiente: el N°2 (scatter.js, #s-banner) nunca la mostró, "pp por
// cada ×10 de PIB" es jerga, y la línea que ahorra es alto que hace falta para
// que el gráfico entre sin scrollear. El R² ya comunica el ajuste.

// Región enfocada: hover de leyenda > América Latina.
// Una región APAGADA no puede estar enfocada (no tiene puntos ni residuo); si
// la apagada es América Latina, el residuo pasa a la primera región encendida
// que el modelo tenga, para no mostrar un "sin países" que confunde.
//
// state[18].pinRegion SE BORRÓ (era código muerto: se leía acá y en
// dv_applyRegionFocus pero nunca se le asignaba una región, sólo null). No se
// le dio el sentido de "fijar el foco" al estilo del stickyConf del N°3 porque
// en este chart el CLICK en la leyenda ya está tomado —apaga la región y la
// saca del modelo, y eso Daniel ya lo aprobó—, así que no queda ningún gesto
// con el que fijar un pin sin inventar un tercero. Un campo que nada puede
// setear es exactamente el cableado a medias que marcó la auditoría.
function dv_focusRegion() {
  const s = state[18];
  const hid = dv_hidden();
  if (s.hoverRegion && !hid.has(s.hoverRegion)) return s.hoverRegion;
  if (!hid.has(DV_LATAM)) return DV_LATAM;
  const m = dv_lastModel;
  if (m) {
    const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
    for (let i = 0; i < order.length; i++) {
      if (!hid.has(order[i]) && m.byRegion[order[i]]) return order[i];
    }
  }
  return DV_LATAM;
}

// Leyenda de regiones adentro del SVG. Para el N°4, png-export NO dibuja
// leyenda propia (SHOWS_LEGEND devuelve false), así que tiene que estar acá.
//   HOVER → REVELA las etiquetas de los países de esa región (re-corriendo la
//           anti-colisión) + atenúa el resto por opacidad. No redibuja el chart.
//   CLICK → apaga/prende la región (cambia el modelo → sí redibuja).
// El ítem apagado va con el punto hueco, tachado y atenuado, como el chip
// .rk-leg-off del chart 1: tiene que verse que está apagado y poder prenderse.
function dv_drawLegend(svg, leg, MARGIN, plotW, xTitleY, fs) {
  const g = dv_ns('g'); svg.appendChild(g);
  const hid = dv_hidden();
  const y0 = xTitleY + fs * 2.2;
  leg.rows.forEach((row, ri) => {
    const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
    let x = MARGIN.left + Math.max(0, (plotW - rowW) / 2);
    const y = y0 + ri * leg.rowH;
    row.forEach(it => {
      const off = hid.has(it.region);
      const item = dv_ns('g');
      item.dataset.legendRegion = it.region;
      if (off) item.dataset.legendOff = '1';
      const dot = dv_ns('circle');
      dot.setAttribute('cx', x + leg.dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', leg.dotR);
      dot.setAttribute('fill', off ? 'none' : dv_regionColor(it.region));
      if (off) {
        dot.setAttribute('stroke', dv_regionColor(it.region));
        dot.setAttribute('stroke-width', Math.max(1, fs * 0.11));
      }
      item.appendChild(dot);
      const tx = dv_ns('text');
      tx.setAttribute('x', x + leg.gapDot); tx.setAttribute('y', y);
      tx.setAttribute('dominant-baseline', 'central');
      tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      tx.setAttribute('fill', '#4A4A4A');
      tx.style.fontSize = fs + 'px';
      tx.textContent = it.label;
      item.appendChild(tx);
      // Tachado dibujado a mano, no text-decoration: el rasterizado SVG→PNG no
      // garantiza el subrayado/tachado tipográfico, una línea sí.
      if (off) {
        const strike = dv_ns('line');
        strike.setAttribute('x1', x + leg.gapDot - 1);
        strike.setAttribute('x2', x + leg.gapDot + dv_measure(it.label, fs, 500) + 1);
        strike.setAttribute('y1', y); strike.setAttribute('y2', y);
        strike.setAttribute('stroke', '#4A4A4A');
        strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
        item.appendChild(strike);
      }
      // Hit-area del ítem (para que el tap agarre en el celu). Los listeners se
      // cablean siempre —también con el editor abierto, donde hay que poder
      // apagar regiones—: lo que el PNG no puede llevar es el ESTADO de hover,
      // y de eso se ocupa dv_labelCtx.frozen.
      item.style.cursor = 'pointer';
      const hit = dv_ns('rect');
      hit.setAttribute('x', x - 2); hit.setAttribute('y', y - leg.rowH / 2);
      hit.setAttribute('width', it.w); hit.setAttribute('height', leg.rowH);
      hit.setAttribute('fill', 'transparent');
      item.appendChild(hit);
      item.addEventListener('mouseenter', () => dv_setHoverRegion(it.region));
      item.addEventListener('mouseleave', () => dv_setHoverRegion(null));
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        dv_toggleRegion(it.region);
      });
      g.appendChild(item);
      x += it.w;
    });
  });
}

// Cambio de región apuntada por el hover. IDEMPOTENTE: si la región no cambió,
// no se toca el DOM (así el mouseenter no parpadea ni entra en loop). Rehace el
// grupo de etiquetas —con la anti-colisión corrida de nuevo— y aplica el foco
// por opacidad. El resto del chart (círculos, ejes, leyenda) queda intacto.
function dv_setHoverRegion(reg) {
  if (reg && dv_hidden().has(reg)) reg = null;
  if (!state[18]) return;
  if ((state[18].hoverRegion || null) === (reg || null)) return;
  state[18].hoverRegion = reg || null;
  dv_renderLabels();
  dv_applyRegionFocus();
}

// Foco por región: SOLO opacidad + reescritura de los textos que dependen de la
// región activa. Las etiquetas las rehace dv_renderLabels. El apagado de
// regiones NO pasa por acá: ese sí redibuja, porque cambia el modelo.
function dv_applyRegionFocus() {
  const focus = (dv_labelCtx && dv_labelCtx.frozen) ? null : dv_hoverRegion();
  for (let i = 0; i < dv_dots.length; i++) {
    const c = dv_dots[i];
    c.setAttribute('opacity', (!focus || c.dataset.region === focus) ? 1 : 0.16);
  }
  const svg = document.getElementById('chart18');
  if (svg) {
    svg.querySelectorAll('[data-legend-region]').forEach(el => {
      if (el.dataset.legendOff) { el.setAttribute('opacity', 0.34); return; }
      el.setAttribute('opacity', (!focus || el.dataset.legendRegion === focus) ? 1 : 0.38);
    });
  }
  dv_updateBanner(dv_lastModel, dv_lastN);
}

// =================== Título dinámico ===================
// Tres capas que no se repiten (criterio OWID): acá va EL HALLAZGO, y sólo
// cuando el gráfico que está en pantalla lo sostiene. Se pide todo junto:
//   · una categoría de la batería de vecinos (donde "declara menos rechazo a
//     vecinos X" es literal; con "enseña tolerancia a sus hijos" el signo se
//     lee al revés y con el World Risk Poll ni siquiera es la misma encuesta),
//   · el estado por default (ver dv_esDefault),
//   · y América Latina POR DEBAJO de lo previsto, con un residuo que no
//     redondee a cero: el titular afirma un hecho, y si el hecho se da vuelta
//     al mover un control el titular tiene que irse.
// En cualquier otro caso el título es DESCRIPTIVO y nombra la medición
// ("Rechazo a vecinos de otra raza y PIB per cápita"): el neutral fijo de antes
// —"Intolerancia declarada y PIB per cápita"— no decía qué se estaba midiendo
// cuando el lector cambiaba de categoría.
function dv_updateTitle(v, model) {
  const block = document.querySelector('.chart-block[data-chart="18"]');
  if (!block) return;
  const el = block.querySelector('.chart-title');
  if (!el || dv_editorCustom('title')) return;
  const nom = dv_varTitulo(v);
  const latam = (model && !dv_hidden().has(DV_LATAM)) ? model.byRegion[DV_LATAM] : null;
  const tplEd = dv_t('c18-title-tpl');
  if (dv_esBateria(v) && dv_esDefault() && latam &&
      latam.pp < 0 && Math.round(Math.abs(latam.pp)) > 0 &&
      tplEd && tplEd.indexOf('{VAR}') >= 0) {
    el.textContent = tplEd.replace('{VAR}', nom);
    return;
  }
  const tpl = dv_t('c18-title-neutral-tpl');
  if (tpl && tpl.indexOf('{VAR}') >= 0) {
    const txt = tpl.replace('{VAR}', nom);
    el.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
    return;
  }
  el.textContent = dv_t('c18-title-neutral');
}

// =================== Subtítulo dinámico ===================
// Capa del medio: QUÉ se mide y CUÁNDO. Nada más.
//
// ANTES contaba el hallazgo ("América Latina queda 10 pp por debajo…") y además
// describía los dos ejes, con lo cual el número aparecía tres veces —título,
// subtítulo y banner— y la descripción de ejes repetía los rótulos que ya están
// dibujados. El residuo se mudó al título (dv_updateTitle) y el número exacto
// quedó sólo en el banner.
function dv_updateSubtitle(v, pts) {
  dv_updateSources();
  const block = document.querySelector('.chart-block[data-chart="18"]');
  if (!block) return;
  const el = block.querySelector('.chart-subtitle');
  if (!el || dv_editorCustom('subtitle')) return;
  const cuando = dv_t(dv_esUltimaOla() ? 'c18-when-last' : 'c18-when-wave')
    .replace('{Y}', dv_rangoAnios(pts));
  if (dv_esBateria(v)) {
    const cat = dv_varLabel(v);
    el.textContent = dv_t('c18-subtitle-vec-tpl')
      .replace('{CAT}', cat.charAt(0).toLowerCase() + cat.slice(1))
      .replace('{CUANDO}', cuando);
    return;
  }
  el.textContent = dv_t('c18-subtitle-tpl')
    .replace('{DEF}', dv_defCorta(v))
    .replace('{CUANDO}', cuando);
}

// =================== Banner (HTML, debajo del SVG) ===================
// [Países 88] · [R² 0,148] · [Residuo · América Latina −9,6 pp respecto de lo
// previsto]. Exactamente el set del N°2 (scatter.js: c2-banner-n, c2-banner-r2,
// c2-banner-region). La PENDIENTE se sacó: no la tenía el N°2 y es jerga.
function dv_updateBanner(model, n) {
  const el = document.getElementById('dv-banner');
  if (!el) return;
  const nItem =
      `<span class="s-banner-item"><span class="s-banner-key">${dv_t('c18-banner-n')}</span>`
    + `<span class="s-banner-val">${n || 0}</span></span>`;
  // Sin modelo: mostramos el n igual (es lo que pidió Daniel) y decimos por qué
  // no hay ajuste, en vez de un R² inventado.
  if (!model) {
    el.innerHTML = nItem
      + `<span class="s-banner-sep">·</span>`
      + `<span class="s-banner-item"><span class="s-banner-note">${dv_t(dv_lastAll ? 'c18-fewfit' : 'c18-nodata')}</span></span>`;
    return;
  }
  const focus = dv_focusRegion();
  const rr = model.byRegion[focus];
  const color = dv_regionLabelColor(focus);
  const residHtml = rr
    ? `<span class="s-banner-val">${dv_signed(rr.pp, 1, ' pp')}</span>`
      + `<span class="s-banner-note">${dv_t('c18-banner-resid-note')}</span>`
    : `<span class="s-banner-val">—</span><span class="s-banner-note">${dv_t('c18-banner-none')}</span>`;
  el.innerHTML =
      nItem
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">${dv_t('c18-banner-r2')}</span><span class="s-banner-val">${dv_num(model.r2, 3)}</span></span>`
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">${dv_t('c18-banner-resid')}</span>`
    + `<span class="s-banner-region-name" style="color:${color}">${dv_regionLabel(focus)}</span>${residHtml}</span>`;
}

// =================== Tooltip ===================
function dv_showTooltip(e, p) {
  const tt = document.getElementById('tooltip18');
  if (!tt) return;
  const v = dv_varMeta(state[18].k);
  // Sin ajuste estimado (menos de DV_MIN_FIT países visibles) no hay predicho
  // ni residuo: el tooltip no inventa las dos filas.
  const hasFit = (typeof p.pred === 'number');
  const above = hasFit && p.resid >= 0;
  const fitRows = hasFit
    ? `<div class="tt-row"><span>${dv_t('c18-tt-expected')}</span><span>${dv_num(p.pred, 1)}%</span></div>`
      + `<div class="tt-row"><span>${dv_t('c18-tt-resid')}</span><span>${dv_signed(p.resid, 1, ' pp')}</span></div>`
      + `<div class="tt-sub">${dv_t(above ? 'c18-tt-resid-above' : 'c18-tt-resid-below')}</div>`
    : '';
  tt.innerHTML =
      `<strong>${dv_name(p.iso)}</strong>`
    + `<div class="tt-region" style="color:${(typeof REGION_COLORS_ON_DARK !== 'undefined' && REGION_COLORS_ON_DARK[p.region]) || '#C9C2B2'}">${dv_regionLabel(p.region)}</div>`
    + `<div class="tt-row"><span>${dv_varLabel(v)}</span><span>${dv_num(p.pct, 1)}%</span></div>`
    + `<div class="tt-row tt-row-sub"><span>${dv_t('c18-tt-year')}</span><span>${p.year}</span></div>`
    + `<div class="tt-row"><span>${dv_t('c18-tt-gdp')}</span><span>$${dv_num(p.gdp, 0)} (${p.gdpYear})</span></div>`
    + fitRows
    + `<div class="tt-row tt-row-sub"><span>${dv_t('c18-tt-n')}</span><span>${dv_num(p.n, 0)}</span></div>`;
  tt.style.display = 'block';
  tt.style.opacity = '1';
  dv_posTooltip(e);
}
function dv_posTooltip(e) {
  const tt = document.getElementById('tooltip18');
  if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = ((typeof evClientX === 'function') ? evClientX(e) : e.clientX) - wrap.left;
  const y = ((typeof evClientY === 'function') ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  // Cerca del borde derecho, el tooltip se reubica a la izquierda del cursor.
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (px < 0) px = 0;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px';
  tt.style.top = py + 'px';
}
function dv_hideTooltip() {
  const tt = document.getElementById('tooltip18');
  if (tt) tt.style.opacity = '0';
}

// =================== Selección de países (chips = etiquetas) ===================
function dv_selectableCountries() {
  const skip = {};
  (CR_META.gdp_sin_datos || []).forEach(c => { skip[c] = true; });
  const list = [];
  for (const iso in CR_REGION) {
    if (!Object.prototype.hasOwnProperty.call(CR_REGION, iso)) continue;
    if (skip[iso]) continue;   // sin dato en Maddison: nunca puede aparecer
    list.push({ iso: iso, name: dv_name(iso), region: CR_REGION[iso] });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, dv_lang()));
}

function dv_toggleCountry(iso) {
  const arr = state[18].selected;
  const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  dv_renderChips();
  drawDesarrollo();
}

function dv_renderChips() {
  const cont = document.getElementById('dv-selected-chips');
  if (!cont) return;
  cont.innerHTML = '';
  state[18].selected.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = dv_regionColor(CR_REGION[iso]);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(dv_name(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.type = 'button';
    x.innerHTML = '&times;';
    x.setAttribute('aria-label', dv_t('chip-remove'));
    x.addEventListener('click', () => dv_toggleCountry(iso));
    chip.appendChild(x);
    cont.appendChild(chip);
  });
}

// Búsqueda insensible a mayúsculas y a acentos (NFD + baja los diacríticos
// combinantes U+0300–U+036F, escritos con escape para que el archivo no dependa
// de que el editor preserve caracteres combinantes sueltos).
function dv_normalize(str) {
  return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function dv_setupSearch() {
  const input = document.getElementById('dv-search');
  const results = document.getElementById('dv-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;

  function render() {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '')
        + (state[18].selected.indexOf(c.iso) >= 0 ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('click', () => {
        dv_toggleCountry(el.dataset.iso);
        input.value = ''; results.classList.remove('open'); input.focus();
      });
    });
  }
  input.addEventListener('input', () => {
    const q = dv_normalize(input.value.trim());
    matches = q
      ? dv_selectableCountries().filter(c => dv_normalize(c.name).indexOf(q) >= 0).slice(0, 8)
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
      dv_toggleCountry(matches[active].iso);
      input.value = ''; results.classList.remove('open');
    } else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

// =================== Controles ===================
// Menú del eje Y: se construye desde CR_VARS (única fuente de verdad del menú)
// con un <optgroup> por grupo, en el orden del dataset.
// Grupo de CR_VARS -> clave i18n del <optgroup>.
const DV_GRP_KEY = {
  'Batería de vecinos':    'c18-grp-vecinos',
  'Otras preguntas':       'c18-grp-otras',
  'Discriminación vivida': 'c18-grp-wrp'
};

// La variable del World Risk Poll no es de la IVS: cuando está elegida, la nota
// de fuentes lo dice (CR_VARS[i].fuente_ext lo marca desde el generador).
function dv_updateSources() {
  const base = dv_t('c18-sources');
  if (base === 'c18-sources') return;
  const v = (typeof CR_VARS !== 'undefined') ? CR_VARS.find(function (x) { return x.k === state[18].k; }) : null;
  const ext = (v && v.fuente_ext) ? dv_t('c18-sources-wrp') : '';
  const add = (ext && ext !== 'c18-sources-wrp') ? ext : '';
  document.querySelectorAll('[data-i18n="c18-sources"]').forEach(function (el) {
    el.innerHTML = base + add;
  });
}

function dv_buildVarSelect() {
  const sel = document.getElementById('dv-var');
  if (!sel) return;
  sel.innerHTML = '';
  const groups = [];
  CR_VARS.forEach(v => { if (groups.indexOf(v.grupo) < 0) groups.push(v.grupo); });
  groups.forEach((grp, gi) => {
    const og = document.createElement('optgroup');
    // Por NOMBRE de grupo, no por posición: con el índice, cualquier grupo
    // nuevo del dataset se rotulaba "Otras preguntas".
    const gk = DV_GRP_KEY[grp] || (gi === 0 ? 'c18-grp-vecinos' : 'c18-grp-otras');
    og.label = dv_t(gk);
    CR_VARS.filter(v => v.grupo === grp).forEach(v => {
      const o = document.createElement('option');
      o.value = v.k;
      o.textContent = dv_varLabel(v);
      if (v.k === state[18].k) o.selected = true;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
}

function dv_setupVarSelect() {
  const sel = document.getElementById('dv-var');
  if (!sel) return;
  dv_buildVarSelect();
  sel.addEventListener('change', () => {
    dv_stopPlay();
    state[18].k = sel.value;
    // Las olas disponibles cambian con la variable: reconstruimos el slider y,
    // si la ola activa no existe para la nueva variable, saltamos a la más
    // cercana CON DATO (nunca dibujamos una ola vacía).
    const waves = dv_wavesFor(state[18].k);
    if (waves.indexOf(state[18].wave) < 0) state[18].wave = dv_nearestWave(waves, state[18].wave);
    dv_syncWave();
    drawDesarrollo();
  });
}

function dv_setupToggles() {
  document.querySelectorAll('#dv-scale button').forEach(btn => {
    btn.addEventListener('click', () => {
      state[18].scaleX = btn.dataset.scale;
      document.querySelectorAll('#dv-scale button').forEach(b => {
        b.classList.toggle('active', b.dataset.scale === state[18].scaleX);
      });
      drawDesarrollo();
    });
  });
  document.querySelectorAll('#dv-model button').forEach(btn => {
    btn.addEventListener('click', () => {
      state[18].model = btn.dataset.model;
      document.querySelectorAll('#dv-model button').forEach(b => {
        b.classList.toggle('active', b.dataset.model === state[18].model);
      });
      drawDesarrollo();
    });
  });
}

// Slider de ola + PLAY (mismo control que el mapa del graficador de vecinos).
function dv_syncWave() {
  const input = document.getElementById('dv-wave-slider');
  const disp = document.getElementById('dv-wave-display');
  if (!input) return;
  const waves = dv_wavesFor(state[18].k);
  input.min = 0;
  input.max = Math.max(0, waves.length - 1);
  input.step = 1;
  input.value = Math.max(0, waves.indexOf(state[18].wave));
  input.disabled = waves.length < 2;
  if (disp) disp.textContent = dv_waveLabel(state[18].wave);
}

function dv_setupWave() {
  const input = document.getElementById('dv-wave-slider');
  const playBtn = document.getElementById('dv-play');
  if (!input) return;
  input.addEventListener('input', () => {
    dv_stopPlay();
    const waves = dv_wavesFor(state[18].k);
    const i = Math.min(waves.length - 1, Math.max(0, parseInt(input.value, 10) || 0));
    state[18].wave = waves[i];
    dv_syncWave();
    drawDesarrollo();
  });
  if (playBtn) playBtn.addEventListener('click', () => {
    if (dv_playTimer) { dv_stopPlay(); return; }
    const waves = dv_wavesFor(state[18].k);
    if (waves.length < 2) return;
    playBtn.classList.add('playing');
    playBtn.textContent = '❚❚';
    state[18].wave = waves[0];
    dv_syncWave();
    drawDesarrollo();
    dv_playTimer = setInterval(() => {
      const ws = dv_wavesFor(state[18].k);
      const cur = ws.indexOf(state[18].wave);
      if (cur < 0 || cur >= ws.length - 1) { dv_stopPlay(); return; }
      state[18].wave = ws[cur + 1];
      dv_syncWave();
      drawDesarrollo();
    }, DV_PLAY_MS);
  });
  dv_syncWave();
}

// "Ver todas las regiones": vuelve a prender todo lo apagado desde la leyenda.
function dv_setupShowAll() {
  const btn = document.getElementById('dv-show-all');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => dv_showAllRegions());
}

function dv_stopPlay() {
  if (dv_playTimer) { clearInterval(dv_playTimer); dv_playTimer = null; }
  const playBtn = document.getElementById('dv-play');
  if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶'; }
}

// =================== CSV ===================
// Todas las observaciones del dataset (24 variables × olas) ya cruzadas con el
// PIB: el CSV reproduce exactamente lo que el chart puede dibujar.
function dv_setupCSV() {
  document.querySelectorAll('button.download[data-chart="18-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const en = dv_lang() === 'en';
      const q = (str) => '"' + String(str).replace(/"/g, '""') + '"';
      let csv = '';
      csv += 'var_key,var_code,var_label_en,wave,wave_label,iso3,country_en,region,pct,survey_year,n,gdp_pc,gdp_year\n';
      CR_VARS.forEach(v => {
        const byWave = CR_FOTO[v.k] || {};
        Object.keys(byWave).map(Number).sort((a, b) => a - b).forEach(w => {
          byWave[String(w)].forEach(row => {
            const g = dv_gdpFor(row[0], row[2]);
            if (!g) return;
            const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[row[0]])
              ? COUNTRY_NAMES[row[0]].en : row[0];
            csv += [v.k, v.fuente, q(v.en), w, dv_waveLabel(w), row[0], q(nm),
                    q(CR_REGION[row[0]] || ''), row[1], row[2], row[3],
                    g.gdp, g.gdpYear].join(',') + '\n';
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = en ? 'the-atlas-04-intolerance-vs-gdp.csv' : 'el-atlas-04-intolerancia-vs-pib.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

// =================== Init ===================
function initDesarrollo() {
  if (!state[18]) {
    state[18] = {
      k: DV_DEFAULT_VAR,
      wave: Math.max.apply(null, dv_wavesFor(DV_DEFAULT_VAR)),
      scaleX: 'log',
      model: 'linear',
      selected: DV_DEFAULT_SEL.slice(),
      hoverRegion: null,
      hiddenRegions: []
    };
  }
  if (!Array.isArray(state[18].hiddenRegions)) state[18].hiddenRegions = [];
  if (state[18].hoverRegion === undefined) state[18].hoverRegion = null;
  dv_setupVarSelect();
  dv_setupToggles();
  dv_setupWave();
  dv_setupSearch();
  dv_setupShowAll();
  dv_renderChips();
  dv_setupCSV();
  drawDesarrollo();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDesarrollo;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initDesarrollo._wired) {
    initDesarrollo._wired = true;
    window.addEventListener('atlas-editor-change', () => drawDesarrollo());
    // Tocar/clickear fuera del gráfico suelta tooltip y hover (en touch el
    // mouseleave de la leyenda no llega nunca y si no queda todo atenuado).
    document.addEventListener('click', (ev) => {
      const svg = document.getElementById('chart18');
      if (svg && !svg.contains(ev.target)) { dv_hideTooltip(); dv_setHoverRegion(null); }
    });
  }
  // El PNG rasteriza el SVG: soltamos tooltip y hover antes de exportar, para
  // que la imagen no salga con una región resaltada y el resto al 16%.
  // (El render ya ignora el hover cuando hay formato activo — dv_labelCtx.frozen
  // —; esto además deja limpio el estado de pantalla.)
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '18') return;
    dv_hideTooltip();
    if (state[18]) state[18].hoverRegion = null;
  };
  // Caption del PNG: versión corta (el "Fuentes" completo del HTML es enorme).
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '18') return null;
    // Con la variable de afuera en el eje Y, la nota que solo cita la IVS seria
    // incompleta: hay una version para ese caso.
    const _v = (typeof CR_VARS !== 'undefined') ? CR_VARS.find(function (x) { return x.k === state[18].k; }) : null;
    if (_v && _v.fuente_ext) {
      const _k = dv_t('c18-sources-png-ext');
      if (_k && _k !== 'c18-sources-png-ext') return _k;
    }
    return dv_t('c18-sources-png');
  };
}

// Cambio de idioma: el <select> del eje Y, los chips y la leyenda se rearman
// con los nombres del idioma nuevo.
function dv_onLangChange() {
  dv_buildVarSelect();
  dv_renderChips();
  dv_syncWave();
  drawDesarrollo();
}
