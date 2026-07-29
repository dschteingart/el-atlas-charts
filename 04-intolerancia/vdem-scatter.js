// =============================================================
//  El Atlas N°4 — Chart 20: exclusión social (V-Dem) vs PIB per cápita
// =============================================================
// CLON de desarrollo.js (chart 18) — regla del proyecto: clonar el motor, no
// reimplementarlo. Renombre mecánico ve_/VE_/state[20]/chart20/c20-. Se reescribió
// SOLO la capa de datos, por dos diferencias reales con el 18:
//   · V-Dem es ANUAL (1900-2023): el slider de ola pasa a ser de año.
//   · Los 5 COMPONENTES son escala de intervalo centrada en ~0 y tienen valores
//     NEGATIVOS, así que el eje Y ya no arranca en 0 (ve_yRangeFor -> [min,max]).
//     El ÍNDICE, en cambio, va de 0 a 1 y apunta al revés: MÁS es PEOR.
// Datos: data-vdem.js (VD_SERIES, VD_GDP, VD_VARS, VD_REGION, VD_META).
// PIB EMPALMADO: Maddison hasta 2022 + tasa de variación del Banco Mundial.
const VE_SVG_NS = 'http://www.w3.org/2000/svg';
const ve_ns = (tag) => document.createElementNS(VE_SVG_NS, tag);

const VE_DEFAULT_VAR = 'v2xpe_exlsocgr';
// Default pre-tildado (regla WYSIWYG: los chips SON las etiquetas). Los seis
// grandes de América Latina —protagonistas del número— más tres referencias
// globales, para que la recta tenga anclas a los dos lados del ingreso.
const VE_DEFAULT_SEL = ['ARG', 'BRA', 'CHL', 'MEX', 'PER', 'URY', 'USA', 'ESP', 'SWE'];
// Año inicial: el último con buena cobertura del índice.
const VE_DEFAULT_YEAR = 2023;
// Sin país resaltado: el chart 18 destacaba a Argentina porque el número gira
// alrededor de ella, pero acá el dato es de V-Dem y no hay protagonista.
const VE_HIGHLIGHT = null;
// Anclas globales: cuando el hover revela una región entera y no entran todas
// las etiquetas, la anti-colisión sacrifica primero a los chicos (criterio del
// N°1: subPriority 0 para las anclas, 1 para el resto de la región).
const VE_ANCHORS = {
  USA: 1, DEU: 1, FRA: 1, GBR: 1, ESP: 1, ITA: 1, RUS: 1,
  CHN: 1, JPN: 1, KOR: 1, IND: 1, BRA: 1, MEX: 1, ARG: 1, ZAF: 1, NGA: 1
};
const VE_LATAM = 'Latin America';
// El play recorre TODA la serie en 10 segundos, sea cual sea la variable
// (el índice tiene 124 años; poder político y libertades civiles, más).
const VE_PLAY_TOTAL_MS = 10000;
const VE_PLAY_MS_MIN = 40;   // piso: por debajo el navegador no llega a redibujar
// Mínimo de países VISIBLES para estimar el ajuste. Si el usuario apaga
// regiones desde la leyenda y quedan menos, NO se estima nada: se ocultan la
// recta y el R² y sólo se informa el n. Nunca un ajuste sobre dos puntos.
const VE_MIN_FIT = 5;

// Dominio del eje X fijo para TODO el dataset (no por ola ni por variable): así
// el eje no salta al mover el slider. Maddison, en estos 112 países, va de
// US$ 936 (Etiopía 2007) a US$ 134.803 (Qatar 2010).
const VE_X_MIN_LOG = 800;
const VE_X_MAX = 150000;

const VE_AXIS_INK = '#7A6E62';
const VE_AXIS_TITLE_INK = '#5A5346';
const VE_GRID = '#ECE7D8';
const VE_BG = '#FAF8F3';
const VE_HI_INK = '#8B4220';

let ve_playTimer = null;
// Círculos del último render, para el foco por región POR OPACIDAD.
let ve_dots = [];
// Contexto del último render (grupo de etiquetas, puntos, escalas): permite
// re-correr el placement de etiquetas en el hover SIN redibujar el chart.
let ve_labelCtx = null;
// Último modelo dibujado: lo reusan el banner y la tira de estadísticos cuando
// cambia la región enfocada, sin volver a dibujar el gráfico.
let ve_lastModel = null;
// Países VISIBLES del último render (los que entraron al modelo). Es el n que
// muestran el banner y la tira, y cambia cuando se apaga una región.
let ve_lastN = 0;
// Países de la celda ANTES de apagar regiones. Distingue los dos "sin ajuste":
// la celda no tiene datos (c20-nodata) vs. el usuario apagó casi todo
// (c20-fewfit). Sin esto, apagar todas las regiones decía "no hay datos".
let ve_lastAll = 0;

// =================== Helpers ===================
function ve_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function ve_lang() {
  return (typeof LANG !== 'undefined') ? LANG : 'es';
}
function ve_t(k) {
  return (typeof t === 'function') ? t(k) : k;
}
function ve_name(iso) {
  const lang = ve_lang();
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}
function ve_regionColor(reg) {
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function ve_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#444';
}
function ve_regionLabel(reg) {
  return reg ? ve_t('reg.' + reg) : '—';
}

// ---- regiones apagadas desde la leyenda ----
// Norma del número, fijada en el chart 1 (ranking.js, state[1].hiddenRegions):
// HOVER = revela las etiquetas de la región y atenúa el resto por opacidad;
// CLICK = apaga y QUITA a esos países. Apagar una región no es sólo esconder
// puntos: los saca del modelo, así que la recta, el R², el n y los residuos se
// recalculan sobre lo que queda visible. Por eso el click redibuja el chart
// entero y el hover redibuja SOLO el grupo de etiquetas.
function ve_hidden() {
  return new Set(state[20].hiddenRegions || []);
}
// Región apuntada por el hover, si sigue encendida (una región apagada no
// tiene puntos ni etiquetas que revelar).
function ve_hoverRegion() {
  const s = state[20];
  if (!s || !s.hoverRegion) return null;
  return ve_hidden().has(s.hoverRegion) ? null : s.hoverRegion;
}
function ve_toggleRegion(reg) {
  const arr = state[20].hiddenRegions || (state[20].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  // En touch el mouseenter llega pero el mouseleave nunca: soltamos el hover
  // en cada click para no dejar una región "apuntada" pegada.
  state[20].hoverRegion = null;
  drawVdemScatter();
}
function ve_showAllRegions() {
  state[20].hiddenRegions = [];
  state[20].hoverRegion = null;
  drawVdemScatter();
}
// El botón "Ver todas las regiones" sólo existe cuando hay algo apagado (así no
// gasta alto cuando no hace falta: ver el ajuste de altura del encabezado).
function ve_syncShowAll() {
  const btn = document.getElementById('ve-show-all');
  if (!btn) return;
  if ((state[20].hiddenRegions || []).length) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}
function ve_measure(text, fs, weight) {
  if (!ve_measure._c) {
    ve_measure._c = document.createElement('canvas').getContext('2d');
  }
  ve_measure._c.font = `${weight || 500} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return ve_measure._c.measureText(text).width;
}
function ve_num(n, dec) {
  return (typeof fmt === 'function') ? fmt(n, dec) : String(n);
}
// Residuo formateado con signo tipográfico (menos real, no guion).
function ve_signed(v, dec, unit) {
  return (v >= 0 ? '+' : '−') + ve_num(Math.abs(v), dec) + (unit || '');
}

// Metadatos de una variable del menú.
// VD_VARS trae 'tipo' ('indice'|'componente') donde CR_VARS traía 'grupo':
// se sintetiza para que el <optgroup> del selector siga funcionando igual.
function ve_varMeta(k) {
  for (let i = 0; i < VD_VARS.length; i++) {
    if (VD_VARS[i].k === k) return VD_VARS[i];
  }
  return VD_VARS[0];
}
function ve_varLabel(v) {
  return ve_lang() === 'en' ? v.en : v.es;
}
function ve_varDef(v) {
  return ve_lang() === 'en' ? v.def_en : v.def_es;
}
// ============================================================
//  Capa de datos — V-Dem (ANUAL) + PIB per cápita empalmado
// ============================================================
// Única parte reescrita respecto de desarrollo.js. Dos diferencias de fondo:
//   (a) V-Dem es ANUAL: donde el chart 18 tenía olas de encuesta, acá hay años,
//       así que el "slider de ola" pasa a ser un slider de año corrido.
//   (b) Los 5 COMPONENTES tienen valores NEGATIVOS (escala de intervalo centrada
//       en ~0, el promedio histórico mundial), así que el eje Y ya no puede
//       arrancar en 0 como en el 18: ve_yRangeFor devuelve [min, max].
// Formato de VD_SERIES/VD_GDP: [primerAño, [v, v, ...]] con años CONSECUTIVOS y
// null en los huecos, y valores como ENTEROS ESCALADOS (índice ×1000,
// componentes ×100). ve_raw() deshace las dos cosas.

// Divisor del escalado entero, por variable.
function ve_scaleOf(k) {
  return (k === 'v2xpe_exlsocgr') ? 1000 : 100;
}

// Valor real de una serie compacta en un año (null si no hay dato).
function ve_at(serie, year, div) {
  if (!serie) return null;
  const i = year - serie[0];
  if (i < 0 || i >= serie[1].length) return null;
  const v = serie[1][i];
  return (v === null || v === undefined) ? null : v / div;
}

// Años con al menos un país para esa variable. Cacheado.
function ve_yearsFor(k) {
  if (!ve_yearsFor._c) ve_yearsFor._c = {};
  if (ve_yearsFor._c[k]) return ve_yearsFor._c[k];
  const src = VD_SERIES[k] || {};
  let lo = null, hi = null;
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    const s = src[iso];
    const a = s[0], b = s[0] + s[1].length - 1;
    if (lo === null || a < lo) lo = a;
    if (hi === null || b > hi) hi = b;
  }
  const out = [];
  for (let y = (lo === null ? 1900 : lo); y <= (hi === null ? 2023 : hi); y++) out.push(y);
  ve_yearsFor._c[k] = out;
  return out;
}

function ve_waveLabel(y) { return String(y); }
function ve_wavesFor(k) { return ve_yearsFor(k); }
function ve_nearestWave(years, y) {
  if (!years.length) return null;
  let best = years[0], bd = Math.abs(years[0] - y);
  for (let i = 1; i < years.length; i++) {
    const d = Math.abs(years[i] - y);
    if (d < bd || (d === bd && years[i] > best)) { best = years[i]; bd = d; }
  }
  return best;
}

// PIB per cápita del país EN ESE MISMO AÑO. A diferencia del chart 18 acá no hay
// tolerancia: las dos series son anuales, así que o hay dato o el país no entra.
function ve_gdpFor(iso, year) {
  const v = ve_at(VD_GDP[iso], year, 1);
  return (v === null) ? null : { gdp: v, gdpYear: year };
}

// Puntos de la celda activa (variable × año), ya cruzados con el PIB.
function ve_points() {
  const s = state[20];
  const src = VD_SERIES[s.k] || {};
  const div = ve_scaleOf(s.k);
  const out = [];
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    const val = ve_at(src[iso], s.wave, div);
    if (val === null) continue;
    const g = ve_gdpFor(iso, s.wave);
    if (!g) continue;
    out.push({
      iso: iso, pct: val, year: s.wave, n: null,
      gdp: g.gdp, gdpYear: g.gdpYear,
      region: VD_REGION[iso] || ''
    });
  }
  return out;
}

// Rango del eje Y por variable, sobre TODOS sus años: el eje no salta al mover el
// slider. El índice arranca en 0; los componentes tienen negativos y se redondea
// hacia afuera al medio punto. Cacheado.
function ve_yRangeFor(k) {
  if (!ve_yRangeFor._c) ve_yRangeFor._c = {};
  if (ve_yRangeFor._c[k]) return ve_yRangeFor._c[k];
  const src = VD_SERIES[k] || {};
  const div = ve_scaleOf(k);
  let mn = null, mx = null;
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    const arr = src[iso][1];
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v === null || v === undefined) continue;
      const r = v / div;
      if (mn === null || r < mn) mn = r;
      if (mx === null || r > mx) mx = r;
    }
  }
  if (mn === null) { mn = 0; mx = 1; }
  let lo, hi;
  if (k === 'v2xpe_exlsocgr') { lo = 0; hi = 1; }
  else { lo = Math.floor(mn * 2) / 2; hi = Math.ceil(mx * 2) / 2; }
  ve_yRangeFor._c[k] = [lo, hi];
  return ve_yRangeFor._c[k];
}

// =================== Regresión (clon de scatter.js del N°2) ===================
// OLS lineal: y = a + b·x. Devuelve {a, b, c:null, r2}.
function ve_ols(points) {
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
function ve_quadFit(points) {
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
function ve_regionResiduals(pts) {
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
// Devuelve null si no hay al menos VE_MIN_FIT países visibles: en ese caso el
// chart se dibuja igual (puntos, ejes, leyenda) pero sin recta ni R².
function ve_buildModel(pts) {
  if (pts.length < VE_MIN_FIT) return null;
  const xy = pts.map(p => ({ x: Math.log10(p.gdp), y: p.pct }));
  const quad = state[20].model === 'quad';
  const reg = quad ? ve_quadFit(xy) : ve_ols(xy);
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
    byRegion: ve_regionResiduals(pts)
  };
}

// =================== Escalas ===================
function ve_makeScales(scaleX, yRange, MARGIN, plotW, plotH) {
  const y0v = yRange[0], y1v = yRange[1];
  const logMode = scaleX === 'log';
  const x0 = logMode ? Math.log10(VE_X_MIN_LOG) : 0;
  const x1 = logMode ? Math.log10(VE_X_MAX) : VE_X_MAX;
  const xScale = (gdp) => {
    const v = logMode ? Math.log10(gdp) : gdp;
    return MARGIN.left + ((v - x0) / (x1 - x0)) * plotW;
  };
  // A diferencia del 18, el eje puede arrancar por debajo de 0 (componentes).
  const yScale = (pct) => MARGIN.top + plotH - ((pct - y0v) / (y1v - y0v)) * plotH;
  return { xScale: xScale, yScale: yScale };
}

// =================== Layout por formato ===================
// baseBottom cubre el hueco de los ticks del eje X; encima se suman el título
// del eje y las filas de la leyenda (que se calculan antes, ver drawVdemScatter).
function ve_layout(editorFormat, mobile) {
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
function ve_legendLayout(regions, fs, plotW) {
  const dotR = fs * 0.45;
  const gapDot = dotR * 2 + fs * 0.5;
  const gapItem = fs * 1.5;
  const items = regions.map(r => {
    const label = ve_regionLabel(r);
    return { region: r, label: label, w: gapDot + ve_measure(label, fs, 500) + gapItem };
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
function drawVdemScatter() {
  const svg = document.getElementById('chart20');
  if (!svg) return;
  svg.innerHTML = '';
  ve_dots = [];
  ve_labelCtx = null;

  const s = state[20];
  const v = ve_varMeta(s.k);
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && ve_isMobile();
  const bigFmt = !!editorFormat || mobile;

  const L = ve_layout(editorFormat, mobile);
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
  const allPts = ve_points();
  const hidden = ve_hidden();
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
  let leg = ve_legendLayout(presentRegions, legendFs, plotW);
  if (leg.rows.length * leg.rowH > H * 0.26) {
    legendFs = SIZES.legend * 0.8;
    leg = ve_legendLayout(presentRegions, legendFs, plotW);
  }
  const legendH = leg.rows.length * leg.rowH;
  const xTickGap = bigFmt ? SIZES.tick * 1.5 : 17;
  MARGIN.bottom = xTickGap + L.baseBottom + SIZES.axisTitle * 1.7 + legendH + legendFs * 1.4;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const model = ve_buildModel(pts);
  ve_lastModel = model;
  ve_lastN = pts.length;
  ve_lastAll = allPts.length;

  // Celda sin NINGÚN dato: no dibujamos un par de ejes vacíos.
  // (Con modelo nulo pero puntos visibles sí se dibuja todo: lo único que
  // desaparece es la recta y el R². Ver ve_buildModel / VE_MIN_FIT.)
  if (!allPts.length) {
    const msg = ve_ns('text');
    msg.setAttribute('x', W / 2);
    msg.setAttribute('y', MARGIN.top + Math.max(60, plotH / 2));
    msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    msg.setAttribute('fill', VE_AXIS_INK);
    msg.style.fontSize = SIZES.axisTitle + 'px';
    msg.textContent = ve_t('c20-nodata');
    svg.appendChild(msg);
    ve_updateSubtitle(v, null);
    ve_updateBanner(null, 0);
    ve_syncShowAll();
    return;
  }

  const yRange = ve_yRangeFor(s.k);
  const sc = ve_makeScales(s.scaleX, yRange, MARGIN, plotW, plotH);
  const xScale = sc.xScale, yScale = sc.yScale;
  const plotBox = {
    x1: MARGIN.left + 1, x2: MARGIN.left + plotW - 1,
    y1: MARGIN.top + 1, y2: MARGIN.top + plotH - 1
  };

  // === Fondo del área de plot ===
  const bg = ve_ns('rect');
  bg.setAttribute('x', MARGIN.left); bg.setAttribute('y', MARGIN.top);
  bg.setAttribute('width', plotW); bg.setAttribute('height', plotH);
  bg.setAttribute('fill', VE_BG);
  svg.appendChild(bg);

  // === Grid + ticks X ===
  const gridG = ve_ns('g'); svg.appendChild(gridG);
  let xTicks;
  if (s.scaleX === 'log') {
    xTicks = (typeof niceLog10Ticks === 'function')
      ? niceLog10Ticks(VE_X_MIN_LOG, VE_X_MAX) : [1000, 10000, 100000];
    // En formatos grandes (PNG mobile-first) 7 ticks se pisan: potencias de 10.
    if (bigFmt) {
      xTicks = xTicks.filter(vv => Math.abs(Math.log10(vv) - Math.round(Math.log10(vv))) < 1e-9);
    }
  } else {
    xTicks = (typeof niceLinearTicks === 'function')
      ? niceLinearTicks(0, VE_X_MAX, 6) : [0, 50000, 100000, 150000];
    if (bigFmt) xTicks = xTicks.filter((vv, i) => i % 2 === 0);
  }
  xTicks.forEach(vv => {
    const x = xScale(vv);
    if (x < MARGIN.left - 0.5 || x > MARGIN.left + plotW + 0.5) return;
    const ln = ve_ns('line');
    ln.setAttribute('x1', x); ln.setAttribute('x2', x);
    ln.setAttribute('y1', MARGIN.top); ln.setAttribute('y2', MARGIN.top + plotH);
    ln.setAttribute('stroke', VE_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = ve_ns('text');
    tx.setAttribute('x', x);
    tx.setAttribute('y', MARGIN.top + plotH + xTickGap);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', VE_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.textContent = (typeof fmtTickGDP === 'function') ? fmtTickGDP(vv) : ('$' + vv);
    gridG.appendChild(tx);
  });

  // === Grid + ticks Y ===
  const yTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(yRange[0], yRange[1], 6) : [];
  yTicks.forEach(vv => {
    const y = yScale(vv);
    const ln = ve_ns('line');
    ln.setAttribute('x1', MARGIN.left); ln.setAttribute('x2', MARGIN.left + plotW);
    ln.setAttribute('y1', y); ln.setAttribute('y2', y);
    ln.setAttribute('stroke', VE_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = ve_ns('text');
    tx.setAttribute('x', MARGIN.left - SIZES.tick * 0.7);
    tx.setAttribute('y', y);
    tx.setAttribute('text-anchor', 'end');
    tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('fill', VE_AXIS_INK);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.style.fontSize = SIZES.tick + 'px';
    // NO es un porcentaje: el índice va de 0 a 1 y los componentes son una
    // escala de intervalo centrada en 0. Un decimal, con coma.
    tx.textContent = (typeof fmt === 'function') ? fmt(vv, 1) : vv.toFixed(1).replace('.', ',');
    gridG.appendChild(tx);
  });

  // === Títulos de eje ===
  const xTitleY = MARGIN.top + plotH + xTickGap + SIZES.axisTitle * 1.6;
  const xTitle = ve_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', xTitleY);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.setAttribute('fill', VE_AXIS_TITLE_INK);
  xTitle.setAttribute('font-weight', 500);
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.textContent = ve_t(s.scaleX === 'log' ? 'c20-axis-x-log' : 'c20-axis-x-linear');
  svg.appendChild(xTitle);

  const yTitle = ve_ns('text');
  const ytx = bigFmt ? 26 : 16;
  yTitle.setAttribute('x', ytx);
  yTitle.setAttribute('y', MARGIN.top + plotH / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.setAttribute('fill', VE_AXIS_TITLE_INK);
  yTitle.setAttribute('font-weight', 500);
  yTitle.style.fontSize = SIZES.axisTitle + 'px';
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${MARGIN.top + plotH / 2})`);
  // Sin sufijo: el chart 18 agregaba « (%)» porque su eje era un porcentaje.
  // Acá no lo es, y dejar la clave vacía hacía que ve_t() devolviera el NOMBRE
  // de la clave y se viera «…c20-axis-y-suffix» pegado al rótulo.
  yTitle.textContent = ve_varLabel(v);
  svg.appendChild(yTitle);

  // === Curva de regresión ===
  // Se dibuja SOLO sobre el rango de PIB realmente observado: no extrapolamos
  // visualmente fuera de los datos. Se corta donde se sale del eje Y.
  // Sin modelo (menos de VE_MIN_FIT países visibles) no hay recta: no se
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
      if (yp < yRange[0] || yp > yRange[1]) { pen = false; continue; }
      const px = xScale(gdp), py = yScale(yp);
      d += (pen ? ' L ' : ' M ') + px.toFixed(1) + ' ' + py.toFixed(1);
      pen = true;
    }
    if (d) {
      const path = ve_ns('path');
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
  state[20].selected.forEach(c => { selSet[c] = true; });
  // Orden de dibujo: el resto abajo, LatAm encima, los elegidos más arriba,
  // Argentina al final. (Seleccionar NO atenúa a nadie: eso lo hace el hover.)
  const ordered = pts.slice().sort((a, b) => {
    const score = (p) => (p.region === VE_LATAM ? 1 : 0)
      + (selSet[p.iso] ? 3 : 0) + (p.iso === VE_HIGHLIGHT ? 6 : 0);
    return score(a) - score(b);
  });
  const dotsG = ve_ns('g'); svg.appendChild(dotsG);
  ordered.forEach(p => {
    const cx = xScale(p.gdp), cy = yScale(p.pct);
    const isHi = p.iso === VE_HIGHLIGHT;
    const isSel = !!selSet[p.iso];
    const r = isHi ? SIZES.dot * 1.45 : (isSel ? SIZES.dot * 1.2 : SIZES.dot);
    const c = ve_ns('circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', ve_regionColor(p.region));
    c.setAttribute('fill-opacity', isHi ? 1 : (isSel ? 0.95 : 0.8));
    c.setAttribute('stroke', (isHi || isSel) ? '#3A3530' : VE_BG);
    c.setAttribute('stroke-width', isHi ? 2 : (isSel ? 1.2 : 1));
    c.style.cursor = 'pointer';
    c.dataset.iso = p.iso;
    c.dataset.region = p.region;
    c.addEventListener('mouseenter', (e) => ve_showTooltip(e, p));
    c.addEventListener('mousemove', (e) => ve_posTooltip(e));
    c.addEventListener('mouseleave', () => ve_hideTooltip());
    dotsG.appendChild(c);
    ve_dots.push(c);
    // Hit-area invisible: el punto mide ~2px reales en el celu, el tap sería
    // imposible sin ella.
    const hit = ve_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
    hit.setAttribute('r', Math.max(15, r * 2.4));
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', (e) => ve_showTooltip(e, p));
    hit.addEventListener('mousemove', (e) => ve_posTooltip(e));
    hit.addEventListener('mouseleave', () => ve_hideTooltip());
    // CLIC = SELECCIONAR, igual que agregarlo desde el buscador (pedido de
    // Daniel 2026-07-26). En pantallas SIN hover el tap es la unica forma de
    // leer el tooltip, asi que ahi el tap sigue siendo tooltip y la seleccion
    // se hace desde el buscador y la cruz del chip.
    const clickH = (e) => {
      e.stopPropagation();
      if (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) { ve_showTooltip(e, p); return; }
      ve_toggleCountry(p.iso);
    };
    c.addEventListener('click', clickH);
    hit.addEventListener('click', clickH);
    dotsG.appendChild(hit);
  });

  // === Etiquetas ===
  // El grupo se re-dibuja SOLO (ve_renderLabels) cuando cambia la región
  // apuntada por el hover: es ahí donde se re-corre la anti-colisión sobre el
  // conjunto ampliado.
  const labelsG = ve_ns('g'); svg.appendChild(labelsG);
  ve_labelCtx = {
    g: labelsG, pts: pts, plotBox: plotBox, SIZES: SIZES, bigFmt: bigFmt,
    xScale: xScale, yScale: yScale,
    // Durante la EXPORTACIÓN el hover se congela: png-export.js setea
    // __atlasPngFormatOverride y vuelve a llamar a __atlasRedraw, así que si el
    // mouse estaba sobre la leyenda el PNG salía con una región revelada y el
    // resto al 16%. Ojo: no alcanza con mirar editorFormat, porque con el
    // editor abierto (preview) el hover SÍ tiene que funcionar.
    frozen: !!window.__atlasPngFormatOverride
  };
  ve_renderLabels();

  // === Tira de estadísticos DENTRO del SVG — SÓLO al exportar ===
  // El banner HTML no entra al PNG (png-export rasteriza el SVG), así que el R²
  // y el residuo regional tienen que ir adentro del gráfico… pero SÓLO ahí: en
  // pantalla el banner de abajo ya los muestra y repetirlos era la duplicación
  // que marcó Daniel («esto es redundante, misma lógica que en el N°2»).

  // === Leyenda de regiones, debajo del título del eje X ===
  ve_drawLegend(svg, leg, MARGIN, plotW, xTitleY, legendFs);

  // Cierre del tooltip al tocar/clickear fuera de un dato (y soltar el hover:
  // en touch el mouseleave de la leyenda no llega nunca).
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { ve_hideTooltip(); ve_setHoverRegion(null); }
  };

  ve_updateSubtitle(v, model);
  ve_syncShowAll();
  ve_applyRegionFocus();

  // Título NEUTRAL por default, como los otros 21 charts del repo (norma de
  // Daniel: "para todos los charts, dejemos por ahora titulos neutrales por
  // default; luego vemos editorialización"). La clave c20-title con el insight
  // queda escrita y lista para cuando se decida activarla.
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('20', false, { title: 'c20-title', titleNeutral: 'c20-title-neutral' });
  }
}

// =================== Etiquetas ===================
// Conjunto de etiquetas = los chips elegidos (selección PERSISTENTE, forced: si
// hay que sacrificar a alguien nunca es un chip) ∪ los países de la región
// apuntada por el hover (TRANSITORIOS: entran si hay lugar y desaparecen al
// salir). La anti-colisión se re-corre DESDE CERO sobre el conjunto nuevo: ése
// es el mecanismo de la feature, no hay layout precalculado ni caché.
function ve_renderLabels() {
  const ctx = ve_labelCtx;
  if (!ctx || !ctx.g) return;
  while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);

  const SIZES = ctx.SIZES, bigFmt = ctx.bigFmt;
  const hover = ctx.frozen ? null : ve_hoverRegion();
  const selSet = {};
  (state[20].selected || []).forEach(c => { selSet[c] = true; });

  const items = [];
  ctx.pts.forEach(p => {
    const isSel = !!selSet[p.iso];
    const isHover = !isSel && !!hover && p.region === hover;
    if (!isSel && !isHover) return;
    const isHi = p.iso === VE_HIGHLIGHT;
    const fs = isSel ? SIZES.label : SIZES.label * 0.92;
    const weight = isSel ? (isHi ? 700 : 600) : 500;
    const text = ve_name(p.iso);
    items.push({
      cx: ctx.xScale(p.gdp), cy: ctx.yScale(p.pct), text: text,
      textW: ve_measure(text, fs, weight),
      iso: p.iso, region: p.region,
      forced: isSel,
      subPriority: isSel ? 0 : (VE_ANCHORS[p.iso] ? 1 : 2),
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
      // Geometría de la guía: s_leaderLine (borde del punto → borde de la caja,
      // con aire antes del texto — el fix de «LLetonia» ya viene incluido).
      const guia = (typeof s_leaderLine === 'function')
        ? s_leaderLine(l, { x: src.cx, y: src.cy, r: src.r }, fs, bigFmt ? 10 : 7)
        : null;
      if (guia) {
        const gl = ve_ns('line');
        gl.setAttribute('x1', guia.x1); gl.setAttribute('y1', guia.y1);
        gl.setAttribute('x2', guia.x2); gl.setAttribute('y2', guia.y2);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.7);
        gl.setAttribute('stroke-opacity', l.transient ? 0.55 : 1);
        ctx.g.appendChild(gl);
      }
    }
    const tx = ve_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.setAttribute('font-weight', l.weight || 600);
    tx.setAttribute('fill', l.iso === VE_HIGHLIGHT ? VE_HI_INK : ve_regionLabelColor(l.region));
    // Peso y opacidad más livianos: se ve que la etiqueta revelada por el hover
    // no es lo mismo que un chip (la selección persistente).
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    tx.setAttribute('paint-order', 'stroke');
    tx.setAttribute('stroke', VE_BG);
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
// drawVdemScatter): en pantalla los mismos números viven en el banner HTML.
//
// SIN la pendiente: el N°2 (scatter.js, #s-banner) nunca la mostró, "pp por
// cada ×10 de PIB" es jerga, y la línea que ahorra es alto que hace falta para
// que el gráfico entre sin scrollear. El R² ya comunica el ajuste.

// Región enfocada: hover de leyenda > América Latina.
// Una región APAGADA no puede estar enfocada (no tiene puntos ni residuo); si
// la apagada es América Latina, el residuo pasa a la primera región encendida
// que el modelo tenga, para no mostrar un "sin países" que confunde.
//
// state[20].pinRegion SE BORRÓ (era código muerto: se leía acá y en
// ve_applyRegionFocus pero nunca se le asignaba una región, sólo null). No se
// le dio el sentido de "fijar el foco" al estilo del stickyConf del N°3 porque
// en este chart el CLICK en la leyenda ya está tomado —apaga la región y la
// saca del modelo, y eso Daniel ya lo aprobó—, así que no queda ningún gesto
// con el que fijar un pin sin inventar un tercero. Un campo que nada puede
// setear es exactamente el cableado a medias que marcó la auditoría.
function ve_focusRegion() {
  const s = state[20];
  const hid = ve_hidden();
  if (s.hoverRegion && !hid.has(s.hoverRegion)) return s.hoverRegion;
  if (!hid.has(VE_LATAM)) return VE_LATAM;
  const m = ve_lastModel;
  if (m) {
    const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
    for (let i = 0; i < order.length; i++) {
      if (!hid.has(order[i]) && m.byRegion[order[i]]) return order[i];
    }
  }
  return VE_LATAM;
}

// Leyenda de regiones adentro del SVG. Para el N°4, png-export NO dibuja
// leyenda propia (SHOWS_LEGEND devuelve false), así que tiene que estar acá.
//   HOVER → REVELA las etiquetas de los países de esa región (re-corriendo la
//           anti-colisión) + atenúa el resto por opacidad. No redibuja el chart.
//   CLICK → apaga/prende la región (cambia el modelo → sí redibuja).
// El ítem apagado va con el punto hueco, tachado y atenuado, como el chip
// .rk-leg-off del chart 1: tiene que verse que está apagado y poder prenderse.
function ve_drawLegend(svg, leg, MARGIN, plotW, xTitleY, fs) {
  const g = ve_ns('g'); svg.appendChild(g);
  const hid = ve_hidden();
  const y0 = xTitleY + fs * 2.2;
  leg.rows.forEach((row, ri) => {
    const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
    let x = MARGIN.left + Math.max(0, (plotW - rowW) / 2);
    const y = y0 + ri * leg.rowH;
    row.forEach(it => {
      const off = hid.has(it.region);
      const item = ve_ns('g');
      item.dataset.legendRegion = it.region;
      if (off) item.dataset.legendOff = '1';
      const dot = ve_ns('circle');
      dot.setAttribute('cx', x + leg.dotR); dot.setAttribute('cy', y);
      dot.setAttribute('r', leg.dotR);
      dot.setAttribute('fill', off ? 'none' : ve_regionColor(it.region));
      if (off) {
        dot.setAttribute('stroke', ve_regionColor(it.region));
        dot.setAttribute('stroke-width', Math.max(1, fs * 0.11));
      }
      item.appendChild(dot);
      const tx = ve_ns('text');
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
        const strike = ve_ns('line');
        strike.setAttribute('x1', x + leg.gapDot - 1);
        strike.setAttribute('x2', x + leg.gapDot + ve_measure(it.label, fs, 500) + 1);
        strike.setAttribute('y1', y); strike.setAttribute('y2', y);
        strike.setAttribute('stroke', '#4A4A4A');
        strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
        item.appendChild(strike);
      }
      // Hit-area del ítem (para que el tap agarre en el celu). Los listeners se
      // cablean siempre —también con el editor abierto, donde hay que poder
      // apagar regiones—: lo que el PNG no puede llevar es el ESTADO de hover,
      // y de eso se ocupa ve_labelCtx.frozen.
      item.style.cursor = 'pointer';
      const hit = ve_ns('rect');
      hit.setAttribute('x', x - 2); hit.setAttribute('y', y - leg.rowH / 2);
      hit.setAttribute('width', it.w); hit.setAttribute('height', leg.rowH);
      hit.setAttribute('fill', 'transparent');
      item.appendChild(hit);
      item.addEventListener('mouseenter', () => ve_setHoverRegion(it.region));
      item.addEventListener('mouseleave', () => ve_setHoverRegion(null));
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ve_toggleRegion(it.region);
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
function ve_setHoverRegion(reg) {
  if (reg && ve_hidden().has(reg)) reg = null;
  if (!state[20]) return;
  if ((state[20].hoverRegion || null) === (reg || null)) return;
  state[20].hoverRegion = reg || null;
  ve_renderLabels();
  ve_applyRegionFocus();
}

// Foco por región: SOLO opacidad + reescritura de los textos que dependen de la
// región activa. Las etiquetas las rehace ve_renderLabels. El apagado de
// regiones NO pasa por acá: ese sí redibuja, porque cambia el modelo.
function ve_applyRegionFocus() {
  const focus = (ve_labelCtx && ve_labelCtx.frozen) ? null : ve_hoverRegion();
  for (let i = 0; i < ve_dots.length; i++) {
    const c = ve_dots[i];
    c.setAttribute('opacity', (!focus || c.dataset.region === focus) ? 1 : 0.16);
  }
  const svg = document.getElementById('chart20');
  if (svg) {
    svg.querySelectorAll('[data-legend-region]').forEach(el => {
      if (el.dataset.legendOff) { el.setAttribute('opacity', 0.34); return; }
      el.setAttribute('opacity', (!focus || el.dataset.legendRegion === focus) ? 1 : 0.38);
    });
  }
  ve_updateBanner(ve_lastModel, ve_lastN);
}

// =================== Subtítulo dinámico ===================
// El subtítulo es el lugar donde el hallazgo se cuenta EN PALABRAS: con ajuste
// estimado y residuo de América Latina, dice de qué lado de lo previsto queda
// la región. Dos plantillas según el signo (c20-subtitle-tpl-more /
// c20-subtitle-tpl-less), como el N°2 (scatter.js:305-317), y el residuo
// REDONDEADO A ENTERO: el lector no precisa 9,6 pp vs 10 pp, y el número se
// mueve de ola en ola. Sin modelo —o con América Latina apagada desde la
// leyenda— cae a la plantilla descriptiva de siempre (c20-subtitle-tpl).
//
// NO se duplica con el banner: el banner da el número exacto (+/−9,6 pp) y el
// subtítulo da la frase redondeada. La tira dentro del SVG ya no se dibuja en
// pantalla (sólo al exportar).
function ve_updateSubtitle(v, model) {
  const block = document.querySelector('.chart-block[data-chart="18"]');
  if (!block) return;
  const el = block.querySelector('.chart-subtitle');
  if (!el) return;
  // No pisamos el subtítulo custom del editor (?nl=1).
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  if (ae && ae.texts) {
    const tx = ae.texts[(ae.lang || ve_lang())] || {};
    if ((tx.subtitle || '').trim()) return;
  }
  const wave = ve_waveLabel(state[20].wave);
  const latam = (model && !ve_hidden().has(VE_LATAM)) ? model.byRegion[VE_LATAM] : null;
  const n = latam ? Math.round(Math.abs(latam.pp)) : 0;
  // Con residuo que redondea a 0 no hay nada que contar: "queda 0 pp por
  // encima" es peor que la descripción de siempre.
  if (latam && n > 0) {
    const key = latam.pp >= 0 ? 'c20-subtitle-tpl-more' : 'c20-subtitle-tpl-less';
    const tpl = ve_t(key);
    if (tpl && tpl !== key) {
      el.textContent = tpl
        .replace('{N}', String(n))
        .replace('{DEF}', ve_varDef(v))
        .replace('{PERIODO}', wave);
      return;
    }
  }
  el.textContent = ve_t('c20-subtitle-tpl')
    .replace('{DEF}', ve_varDef(v))
    .replace('{PERIODO}', wave);
}

// =================== Banner (HTML, debajo del SVG) ===================
// [Países 88] · [R² 0,148] · [Residuo · América Latina −9,6 pp respecto de lo
// previsto]. Exactamente el set del N°2 (scatter.js: c2-banner-n, c2-banner-r2,
// c2-banner-region). La PENDIENTE se sacó: no la tenía el N°2 y es jerga.
function ve_updateBanner(model, n) {
  const el = document.getElementById('ve-banner');
  if (!el) return;
  const nItem =
      `<span class="s-banner-item"><span class="s-banner-key">${ve_t('c20-banner-n')}</span>`
    + `<span class="s-banner-val">${n || 0}</span></span>`;
  // Sin modelo: mostramos el n igual (es lo que pidió Daniel) y decimos por qué
  // no hay ajuste, en vez de un R² inventado.
  if (!model) {
    el.innerHTML = nItem
      + `<span class="s-banner-sep">·</span>`
      + `<span class="s-banner-item"><span class="s-banner-note">${ve_t(ve_lastAll ? 'c20-fewfit' : 'c20-nodata')}</span></span>`;
    return;
  }
  const focus = ve_focusRegion();
  const rr = model.byRegion[focus];
  const color = ve_regionLabelColor(focus);
  const residHtml = rr
    ? `<span class="s-banner-val">${ve_signed(rr.pp, 2, '')}</span>`
      + `<span class="s-banner-note">${ve_t('c20-banner-resid-note')}</span>`
    : `<span class="s-banner-val">—</span><span class="s-banner-note">${ve_t('c20-banner-none')}</span>`;
  el.innerHTML =
      nItem
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">${ve_t('c20-banner-r2')}</span><span class="s-banner-val">${ve_num(model.r2, 3)}</span></span>`
    + `<span class="s-banner-sep">·</span>`
    + `<span class="s-banner-item"><span class="s-banner-key">${ve_t('c20-banner-resid')}</span>`
    + `<span class="s-banner-region-name" style="color:${color}">${ve_regionLabel(focus)}</span>${residHtml}</span>`;
}

// =================== Tooltip ===================
function ve_showTooltip(e, p) {
  const tt = document.getElementById('tooltip20');
  if (!tt) return;
  const v = ve_varMeta(state[20].k);
  // Sin ajuste estimado (menos de VE_MIN_FIT países visibles) no hay predicho
  // ni residuo: el tooltip no inventa las dos filas.
  const hasFit = (typeof p.pred === 'number');
  const above = hasFit && p.resid >= 0;
  const fitRows = hasFit
    ? `<div class="tt-row"><span>${ve_t('c20-tt-expected')}</span><span>${ve_num(p.pred, 1)}%</span></div>`
      + `<div class="tt-row"><span>${ve_t('c20-tt-resid')}</span><span>${ve_signed(p.resid, 2, '')}</span></div>`
      + `<div class="tt-sub">${ve_t(above ? 'c20-tt-resid-above' : 'c20-tt-resid-below')}</div>`
    : '';
  tt.innerHTML =
      `<strong>${ve_name(p.iso)}</strong>`
    + `<div class="tt-region" style="color:${ve_regionColor(p.region)}">${ve_regionLabel(p.region)}</div>`
    + `<div class="tt-row"><span>${ve_varLabel(v)}</span><span>${ve_num(p.pct, 1)}%</span></div>`
    + `<div class="tt-row tt-row-sub"><span>${ve_t('c20-tt-year')}</span><span>${p.year}</span></div>`
    + `<div class="tt-row"><span>${ve_t('c20-tt-gdp')}</span><span>$${ve_num(p.gdp, 0)} (${p.gdpYear})</span></div>`
    + fitRows
    + `<div class="tt-row tt-row-sub"><span>${ve_t('c20-tt-n')}</span><span>${ve_num(p.n, 0)}</span></div>`;
  tt.style.display = 'block';
  tt.style.opacity = '1';
  ve_posTooltip(e);
}
function ve_posTooltip(e) {
  const tt = document.getElementById('tooltip20');
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
function ve_hideTooltip() {
  const tt = document.getElementById('tooltip20');
  if (tt) tt.style.opacity = '0';
}

// =================== Selección de países (chips = etiquetas) ===================
function ve_selectableCountries() {
  const skip = {};
  (VD_META.gdp_sin_datos || []).forEach(c => { skip[c] = true; });
  const list = [];
  for (const iso in VD_REGION) {
    if (!Object.prototype.hasOwnProperty.call(VD_REGION, iso)) continue;
    if (skip[iso]) continue;   // sin dato en Maddison: nunca puede aparecer
    list.push({ iso: iso, name: ve_name(iso), region: VD_REGION[iso] });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, ve_lang()));
}

function ve_toggleCountry(iso) {
  const arr = state[20].selected;
  const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  ve_renderChips();
  drawVdemScatter();
}

function ve_renderChips() {
  const cont = document.getElementById('ve-selected-chips');
  if (!cont) return;
  cont.innerHTML = '';
  state[20].selected.forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = ve_regionColor(VD_REGION[iso]);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(ve_name(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.type = 'button';
    x.innerHTML = '&times;';
    x.setAttribute('aria-label', ve_t('chip-remove'));
    x.addEventListener('click', () => ve_toggleCountry(iso));
    chip.appendChild(x);
    cont.appendChild(chip);
  });
}

// Búsqueda insensible a mayúsculas y a acentos (NFD + baja los diacríticos
// combinantes U+0300–U+036F, escritos con escape para que el archivo no dependa
// de que el editor preserve caracteres combinantes sueltos).
function ve_normalize(str) {
  return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function ve_setupSearch() {
  const input = document.getElementById('ve-search');
  const results = document.getElementById('ve-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;

  function render() {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '')
        + (state[20].selected.indexOf(c.iso) >= 0 ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('click', () => {
        ve_toggleCountry(el.dataset.iso);
        input.value = ''; results.classList.remove('open'); input.focus();
      });
    });
  }
  input.addEventListener('input', () => {
    const q = ve_normalize(input.value.trim());
    matches = q
      ? ve_selectableCountries().filter(c => ve_normalize(c.name).indexOf(q) >= 0).slice(0, 8)
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
      ve_toggleCountry(matches[active].iso);
      input.value = ''; results.classList.remove('open');
    } else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

// =================== Controles ===================
// Menú del eje Y: se construye desde VD_VARS (única fuente de verdad del menú)
// con un <optgroup> por grupo, en el orden del dataset.
function ve_buildVarSelect() {
  const sel = document.getElementById('ve-var');
  if (!sel) return;
  sel.innerHTML = '';
  const groups = [];
  // La etiqueta del <optgroup> viaja en el propio VD_VARS (grupo / grupo_en),
  // no en i18n: es un rótulo de dos valores que no vale una clave por idioma.
  const gkey = (v) => (ve_lang() === 'en' ? (v.grupo_en || v.grupo) : v.grupo);
  VD_VARS.forEach(v => { if (groups.indexOf(gkey(v)) < 0) groups.push(gkey(v)); });
  groups.forEach((grp, gi) => {
    const og = document.createElement('optgroup');
    // El rótulo sale del propio VD_VARS, no de claves fijas: el chart 18 tenía
    // dos grupos conocidos de antemano ("Batería de vecinos" / "Otras preguntas")
    // y acá son los de V-Dem ("Índice" / "Componentes del índice").
    og.label = grp;
    VD_VARS.filter(v => gkey(v) === grp).forEach(v => {
      const o = document.createElement('option');
      o.value = v.k;
      o.textContent = ve_varLabel(v);
      if (v.k === state[20].k) o.selected = true;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
}

function ve_setupVarSelect() {
  const sel = document.getElementById('ve-var');
  if (!sel) return;
  ve_buildVarSelect();
  sel.addEventListener('change', () => {
    ve_stopPlay();
    state[20].k = sel.value;
    // Las olas disponibles cambian con la variable: reconstruimos el slider y,
    // si la ola activa no existe para la nueva variable, saltamos a la más
    // cercana CON DATO (nunca dibujamos una ola vacía).
    const waves = ve_wavesFor(state[20].k);
    if (waves.indexOf(state[20].wave) < 0) state[20].wave = ve_nearestWave(waves, state[20].wave);
    ve_syncWave();
    drawVdemScatter();
  });
}

function ve_setupToggles() {
  document.querySelectorAll('#ve-scale button').forEach(btn => {
    btn.addEventListener('click', () => {
      state[20].scaleX = btn.dataset.scale;
      document.querySelectorAll('#ve-scale button').forEach(b => {
        b.classList.toggle('active', b.dataset.scale === state[20].scaleX);
      });
      drawVdemScatter();
    });
  });
  document.querySelectorAll('#ve-model button').forEach(btn => {
    btn.addEventListener('click', () => {
      state[20].model = btn.dataset.model;
      document.querySelectorAll('#ve-model button').forEach(b => {
        b.classList.toggle('active', b.dataset.model === state[20].model);
      });
      drawVdemScatter();
    });
  });
}

// Slider de ola + PLAY (mismo control que el mapa del graficador de vecinos).
function ve_syncWave() {
  const input = document.getElementById('ve-wave-slider');
  const disp = document.getElementById('ve-wave-display');
  if (!input) return;
  const waves = ve_wavesFor(state[20].k);
  input.min = 0;
  input.max = Math.max(0, waves.length - 1);
  input.step = 1;
  input.value = Math.max(0, waves.indexOf(state[20].wave));
  input.disabled = waves.length < 2;
  if (disp) disp.textContent = ve_waveLabel(state[20].wave);
}

function ve_setupWave() {
  const input = document.getElementById('ve-wave-slider');
  const playBtn = document.getElementById('ve-play');
  if (!input) return;
  input.addEventListener('input', () => {
    ve_stopPlay();
    const waves = ve_wavesFor(state[20].k);
    const i = Math.min(waves.length - 1, Math.max(0, parseInt(input.value, 10) || 0));
    state[20].wave = waves[i];
    ve_syncWave();
    drawVdemScatter();
  });
  if (playBtn) playBtn.addEventListener('click', () => {
    if (ve_playTimer) { ve_stopPlay(); return; }
    const waves = ve_wavesFor(state[20].k);
    if (waves.length < 2) return;
    playBtn.classList.add('playing');
    playBtn.textContent = '❚❚';
    state[20].wave = waves[0];
    ve_syncWave();
    drawVdemScatter();
    ve_playTimer = setInterval(() => {
      const ws = ve_wavesFor(state[20].k);
      const cur = ws.indexOf(state[20].wave);
      if (cur < 0 || cur >= ws.length - 1) { ve_stopPlay(); return; }
      state[20].wave = ws[cur + 1];
      ve_syncWave();
      drawVdemScatter();
    }, Math.max(VE_PLAY_MS_MIN, Math.round(VE_PLAY_TOTAL_MS / Math.max(1, waves.length - 1))));
  });
  ve_syncWave();
}

// "Ver todas las regiones": vuelve a prender todo lo apagado desde la leyenda.
function ve_setupShowAll() {
  const btn = document.getElementById('ve-show-all');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => ve_showAllRegions());
}

function ve_stopPlay() {
  if (ve_playTimer) { clearInterval(ve_playTimer); ve_playTimer = null; }
  const playBtn = document.getElementById('ve-play');
  if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶'; }
}

// =================== CSV ===================
// Todas las observaciones del dataset (6 variables × años × países) ya cruzadas
// con el PIB: el CSV reproduce exactamente lo que el chart puede dibujar.
// Se exportan los valores YA DESESCALADOS (el data.js los guarda como enteros).
function ve_setupCSV() {
  document.querySelectorAll('button.download[data-chart="20-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const en = ve_lang() === 'en';
      const q = (str) => '"' + String(str).replace(/"/g, '""') + '"';
      let csv = '';
      csv += 'var_key,var_label_en,tipo,year,iso3,country_en,region,value,gdp_pc\n';
      VD_VARS.forEach(v => {
        const src = VD_SERIES[v.k] || {};
        const div = ve_scaleOf(v.k);
        Object.keys(src).sort().forEach(iso => {
          const s = src[iso];
          for (let i = 0; i < s[1].length; i++) {
            const raw = s[1][i];
            if (raw === null || raw === undefined) continue;
            const year = s[0] + i;
            const g = ve_gdpFor(iso, year);
            if (!g) continue;
            const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso])
              ? COUNTRY_NAMES[iso].en : (VD_NAMES[iso] || iso);
            csv += [v.k, q(v.en), v.tipo, year, iso, q(nm),
                    q(VD_REGION[iso] || ''), (raw / div), g.gdp].join(',') + '\n';
          }
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = en ? 'the-atlas-04-social-exclusion-vs-gdp.csv' : 'el-atlas-04-exclusion-social-vs-pib.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

// =================== Init ===================
function initVdemScatter() {
  if (!state[20]) {
    state[20] = {
      k: VE_DEFAULT_VAR,
      wave: Math.max.apply(null, ve_wavesFor(VE_DEFAULT_VAR)),
      scaleX: 'log',
      model: 'linear',
      selected: VE_DEFAULT_SEL.slice(),
      hoverRegion: null,
      hiddenRegions: []
    };
  }
  if (!Array.isArray(state[20].hiddenRegions)) state[20].hiddenRegions = [];
  if (state[20].hoverRegion === undefined) state[20].hoverRegion = null;
  ve_setupVarSelect();
  ve_setupToggles();
  ve_setupWave();
  ve_setupSearch();
  ve_setupShowAll();
  ve_renderChips();
  ve_setupCSV();
  drawVdemScatter();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawVdemScatter;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initVdemScatter._wired) {
    initVdemScatter._wired = true;
    window.addEventListener('atlas-editor-change', () => drawVdemScatter());
    // Tocar/clickear fuera del gráfico suelta tooltip y hover (en touch el
    // mouseleave de la leyenda no llega nunca y si no queda todo atenuado).
    document.addEventListener('click', (ev) => {
      const svg = document.getElementById('chart20');
      if (svg && !svg.contains(ev.target)) { ve_hideTooltip(); ve_setHoverRegion(null); }
    });
  }
  // El PNG rasteriza el SVG: soltamos tooltip y hover antes de exportar, para
  // que la imagen no salga con una región resaltada y el resto al 16%.
  // (El render ya ignora el hover cuando hay formato activo — ve_labelCtx.frozen
  // —; esto además deja limpio el estado de pantalla.)
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '20') return;
    ve_hideTooltip();
    if (state[20]) state[20].hoverRegion = null;
  };
  // Caption del PNG: versión corta (el "Fuentes" completo del HTML es enorme).
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '20') return null;
    return ve_t('c20-sources-png');
  };
}

// Cambio de idioma: el <select> del eje Y, los chips y la leyenda se rearman
// con los nombres del idioma nuevo.
function ve_onLangChange() {
  ve_buildVarSelect();
  ve_renderChips();
  ve_syncWave();
  drawVdemScatter();
}
