// =============================================================
//  scatter.js — chart único del N°3 "Fútbol"
// =============================================================
//
// Scatter ELO vs PIB total PPA log, un punto por país. La regresión OLS
// ajusta una recta sobre el promedio del rango temporal elegido y muestra
// cuánto se desvía cada confederación de "lo esperado" para su economía.
// La tesis editorial: CONMEBOL (Sudamérica) sistemáticamente por encima
// de la línea — más fútbol del que su PIB predice.
//
// Modelo de regresión:
//   Lineal: ELO = a + b · log10(PIB total PPA)
//
// La diferencia clave con el scatter del N°2 es la fuente de los datos:
// no es un snapshot por año sino el PROMEDIO de los años en el rango
// elegido por el slider doble. Todo (puntos, regresión, R², residuos) se
// recalcula al mover el slider.
//
// Features:
//   - Slider temporal de RANGO: 2 thumbs (año inicio + fin), 1980-2026,
//     default 2000-2026. Mínimo 5 años de ventana para que la regresión
//     tenga sentido.
//   - Hover sobre chip de confederación: banner pasa a mostrar el residuo
//     de esa confederación. Sin hover, muestra CONMEBOL (protagonista).
//   - Click en chip oculta/muestra puntos de esa confederación
//     visualmente — la regresión SIEMPRE es global (no se recalcula).
//   - Click en punto = toggle etiqueta. La selección persiste al mover
//     el slider.
//   - Buscador de país con resultados desplegables.
//   - Labels editorialmente curados: los 10 países CONMEBOL por default
//     (equivalente a "Latam puro" del N°2 pero para esta taxonomía) +
//     extremos del rango (max y min ELO) + países seleccionados.
//   - Banner debajo del SVG: n, R², residuo medio de la confederación
//     activa (hover o CONMEBOL por default), período.
//
// REGLA CRÍTICA del handoff: la regresión, R² y residuos dependen SOLO
// del slider (período). El hover sobre chip NO recalcula la regresión —
// solo cambia qué residuo se muestra en el banner. El click sobre chip
// oculta puntos visualmente pero NO recalcula nada. La recta de
// referencia es siempre global (todos los países del período).
//
// Depende de: DATA_ELO_PIB, CONF_FIFA_ORDER, CONF_FIFA_COLORS,
// CONF_FIFA_LABEL_COLORS, COUNTRY_NAMES, state[1].

// =================== Constantes ===================
// Dimensiones desktop default (sin editor activo). Mobile interactivo
// (≤768px sin editor) usa viewBox portrait alto cuyo aspect ratio matchea
// el container portrait.
//
// Cuando hay un formato del editor activo (newsletter / square / mobile /
// public), las dimensiones vienen de PNG_FORMATS[format] en utils.js y
// los margins de s_getMargins(format). Mismo patrón que el N°2.
const S_W_DESKTOP = 1100, S_H_DESKTOP = 460;
const S_W_MOBILE  = 1100, S_H_MOBILE  = 1500;
const S_MARGIN_DESKTOP = { top: 30, right: 36, bottom: 60, left: 60 };
const S_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 240, left: 140 };

// Margins por formato del editor (cuando el editor está activo).
function s_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 36, bottom: 100, left: 70 };
    case 'newsletter': return { top: 40, right: 44, bottom: 130, left: 70 };
    case 'square':     return { top: 40, right: 44, bottom: 130, left: 70 };
    case 'mobile':     return { top: 60, right: 36, bottom: 220, left: 110 };
    default:           return { ...S_MARGIN_DESKTOP };
  }
}

let S_W = S_W_DESKTOP, S_H = S_H_DESKTOP;
let S_MARGIN = { ...S_MARGIN_DESKTOP };
let S_PLOT_W = S_W - S_MARGIN.left - S_MARGIN.right;
let S_PLOT_H = S_H - S_MARGIN.top - S_MARGIN.bottom;

// Slider temporal — rango fijo del dataset.
const S_YEAR_MIN = 1980;
const S_YEAR_MAX = 2026;
const S_PERIOD_DEFAULT = [2000, 2026];
// Mínimo de años de ventana: 5. Menos que eso y la regresión empieza a
// reflejar ruido de un año puntual. El handler del slider clampea si el
// usuario intenta acercar más los thumbs.
const S_MIN_WINDOW = 5;

// Países anclas del scatter por default = todos los CONMEBOL. Equivalente
// a S_LATAM_PURE_CODES del N°2 pero filtrado por confederación FIFA.
// Verificado contra el JSON: 10 países, iso3 OK (PRY, URY — no PAR, no URU).
const S_CONMEBOL_CODES = new Set([
  'ARG', 'BOL', 'BRA', 'CHL', 'COL', 'ECU', 'PER', 'PRY', 'URY', 'VEN'
]);

// Sub-prioridad dentro de CONMEBOL para el placement greedy: los "5 grandes"
// se colocan primero (subPriority 0), el resto subPriority 99. La selección
// editorial: ARG, BRA, URY (campeón histórico del Mundial), COL y CHL
// (los 5 que aparecen consistentemente arriba o cerca del top de ELO).
const S_CONMEBOL_BIG_FIVE = new Set(['ARG', 'BRA', 'URY', 'COL', 'CHL']);

// Anclas globales fuera de CONMEBOL — solo se usan como Tier 0 cuando el
// lector hace hover sobre una confederación distinta de CONMEBOL. Por
// default (sin hover) solo se etiqueta CONMEBOL.
const S_PRIORITY_NON_CONMEBOL = new Set([
  'USA', 'MEX', 'CAN',                      // CONCACAF grandes
  'DEU', 'FRA', 'GBR', 'ESP', 'ITA',        // UEFA históricos
  'PRT', 'NLD', 'BEL', 'HRV',               // UEFA modernos relevantes
  'RUS', 'CHN', 'JPN', 'KOR', 'IND',        // economías gigantes
  'NGA', 'EGY', 'MAR', 'SEN', 'CMR',        // CAF top
  'AUS', 'NZL'                              // OFC top
]);

// Tamaño visual de los puntos.
//   - Etiquetado/seleccionado: r=5px, opacity 0.95, stroke dark.
//   - Resto: r=3.5px, opacity 0.78, stroke white — contexto.
const S_POINT_R_LABELED  = 5;
const S_POINT_R_OTHER    = 3.5;
const S_POINT_R_SELECTED = 6.5;

const S_SVG_NS = 'http://www.w3.org/2000/svg';
const s_ns = (tag) => document.createElementNS(S_SVG_NS, tag);

// =================== Helpers ===================
// Nombre del país. En este pase los strings van en ES; cuando llegue el
// i18n bilingüe (Bloque 7), esta función va a leer LANG. Por ahora cae
// al name del dataset (ya en ES) si COUNTRY_NAMES no tiene el iso3.
function s_displayName(d) {
  const lang = typeof LANG !== 'undefined' ? LANG : 'es';
  return (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[d.iso3]?.[lang]) || d.name;
}

// Medir ancho de texto reusando un canvas en memoria (idéntico al N°2).
function s_measureText(text, fontSize, weight) {
  if (!s_measureText._ctx) {
    s_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  s_measureText._ctx.font = `${weight || 500} ${fontSize}px "Source Sans 3", sans-serif`;
  return s_measureText._ctx.measureText(text).width;
}

// Promedio de un array de números. Asume no vacío.
function s_mean(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

// Formato moneda en ESPAÑOL — `mil M` = miles de millones (10⁹),
// `bill.` = billones (10¹²). NUNCA usar B/T (notación anglo que confunde
// billón ≠ billion). Decisión del handoff, capítulo 4.1.
//   >= 1e13: $30 bill.
//   >= 1e12: $1,2 bill.
//   >= 1e9:  $120 mil M
//   >= 1e6:  $120 M
//   resto:   $xxx
// Format money con sufijos localizados:
//  ES: M / mil M / bill. (1e12)  — convención del Atlas N°2.
//  EN: M / B / T               — short scale anglosajona.
// La coma decimal solo se usa en ES.
function s_fmtMoney(v) {
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  if (en) {
    if (v >= 1e13) return '$' + (v / 1e12).toFixed(0) + 'T';
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(1) + 'T';
    if (v >= 1e9)  return '$' + Math.round(v / 1e9) + 'B';
    if (v >= 1e6)  return '$' + Math.round(v / 1e6) + 'M';
    return '$' + Math.round(v);
  }
  if (v >= 1e13) return '$' + (v / 1e12).toFixed(0) + ' bill.';
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(1).replace('.', ',') + ' bill.';
  if (v >= 1e9)  return '$' + Math.round(v / 1e9) + ' mil M';
  if (v >= 1e6)  return '$' + Math.round(v / 1e6) + ' M';
  return '$' + Math.round(v);
}

// =================== Datos: cálculo de puntos por período ===================
// Para cada país, promedia ELO y PIB sobre los años del rango [y0, y1].
// Filtra países sin ningún dato en el rango (raro pero posible para los
// estados sucesores en años tempranos). x = log10(PIB).
//
// IMPORTANTE: las claves de año en data-elo-pib.js son strings; el for
// las accede con índice numérico y JS hace la coerción automática.
function s_computePoints(period) {
  const [y0, y1] = period;
  const pts = [];
  for (const d of DATA_ELO_PIB) {
    const es = [], gs = [];
    for (let y = y0; y <= y1; y++) {
      if (d.elo[y] != null) es.push(d.elo[y]);
      if (d.gdp[y] != null) gs.push(d.gdp[y]);
    }
    if (es.length === 0 || gs.length === 0) continue;
    const elo = s_mean(es);
    const gdp = s_mean(gs);
    pts.push({
      iso3: d.iso3,
      name: d.name,
      confed: d.confed,
      elo,
      gdp,
      x: Math.log10(gdp)
    });
  }
  return pts;
}

// =================== Regresión OLS ===================
// y = a + b · x donde x = log10(gdp), y = elo. Devuelve {a, b, r2, n}.
// Mismo solver que el N°2, simplificado (sin cuadrática — acá solo lineal).
function s_ols(pts) {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += pts[i].x; sy += pts[i].elo; }
  const mx = sx / n, my = sy / n;
  let num = 0, den = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const dx = pts[i].x - mx, dy = pts[i].elo - my;
    num += dx * dy;
    den += dx * dx;
    ssTot += dy * dy;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yp = a + b * pts[i].x;
    ssRes += (pts[i].elo - yp) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a, b, r2, n };
}

// Residuo medio por confederación. Toma cada punto, calcula su residuo
// (elo real - elo predicho por la regresión global) y promedia por confed.
// Devuelve {CONMEBOL: {abs: +273, pct: +18.5}, UEFA: {...}, ...}.
//   - abs: residuo medio en puntos Elo (escala original).
//   - pct: residuo medio relativo al Elo esperado, en porcentaje.
// El % se promedia por país (no se calcula sobre las medias) — es la
// lectura editorial natural: "el país promedio CONMEBOL sobre-rinde 18%".
function s_residualsByConf(pts, reg) {
  if (!reg) return {};
  const accAbs = {}, accPct = {};
  for (const p of pts) {
    const expected = reg.a + reg.b * p.x;
    const resid = p.elo - expected;
    p.resid = resid;                          // se guarda en el punto para el tooltip
    p.residPct = expected > 0 ? (resid / expected) * 100 : null;
    (accAbs[p.confed] = accAbs[p.confed] || []).push(resid);
    if (p.residPct != null) (accPct[p.confed] = accPct[p.confed] || []).push(p.residPct);
  }
  const out = {};
  for (const c in accAbs) {
    out[c] = {
      abs: s_mean(accAbs[c]),
      pct: (accPct[c] && accPct[c].length) ? s_mean(accPct[c]) : null,
    };
  }
  return out;
}

// =================== Estado precomputado del render ===================
// Los puntos, regresión y residuos se calculan una vez por draw (cuando
// cambia el slider). El hover sobre chip y el toggle de visibilidad solo
// alteran la apariencia visual — no recalculan nada de esto.
let s_allPts = [];
let s_reg = null;
let s_residByConf = {};

// =================== Escalas ===================
// Eje X: log10 del PIB. Ticks fijos en valores redondos del rango del
// dataset (~1e10 - ~3e13). El dominio se calcula desde los puntos
// promedio actuales pero ampliamos un 8% a cada lado para que los puntos
// extremos no toquen los bordes.
function s_makeScales(pts) {
  if (pts.length === 0) {
    return { xScale: (() => 0), yScale: (() => 0), xMinRaw: 1e10, xMaxRaw: 1e13 };
  }
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  for (const p of pts) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.elo < yMin) yMin = p.elo;
    if (p.elo > yMax) yMax = p.elo;
  }
  // Padding ~5% del rango en log para X y ~6% en lineal para Y.
  const xPad = (xMax - xMin) * 0.05;
  const yPad = (yMax - yMin) * 0.06;
  const xDomain = [xMin - xPad, xMax + xPad];
  const yDomain = [yMin - yPad, yMax + yPad];

  const xScale = (logX) =>
    S_MARGIN.left + ((logX - xDomain[0]) / (xDomain[1] - xDomain[0])) * S_PLOT_W;
  const yScale = (elo) =>
    S_MARGIN.top + S_PLOT_H - ((elo - yDomain[0]) / (yDomain[1] - yDomain[0])) * S_PLOT_H;

  // Para placar la regresión sobre el rango visible necesitamos los
  // valores raw (no log) en los bordes del eje X.
  const xMinRaw = Math.pow(10, xDomain[0]);
  const xMaxRaw = Math.pow(10, xDomain[1]);

  return { xScale, yScale, xMinRaw, xMaxRaw, xDomain, yDomain };
}

// Ticks fijos del eje X (en PIB raw, se convierten a log10 al usarlos).
// Cubre desde ~$100 M (1e8) hasta ~$30 bill. (3e13) para incluir economías
// chicas del Pacífico (Palaos ~$300M, Tuvalu, etc) en el lado izquierdo,
// que el array previo cortaba abruptamente en $10 mil M. Filtramos los que
// caen fuera del dominio actual.
const S_X_TICKS_RAW = [1e8, 3e8, 1e9, 3e9, 1e10, 3e10, 1e11, 3e11, 1e12, 3e12, 1e13, 3e13];

// Y ticks: niceLinearTicks del rango actual. El rango varía con el período
// (1980-2026 ~ 800 a 2200; 2020-2026 más comprimido).
function s_yTicks(yDomain, target=6) {
  if (typeof niceLinearTicks === 'function') {
    return niceLinearTicks(yDomain[0], yDomain[1], target);
  }
  // Fallback simple si utils.js no estuviera cargado (no debería pasar).
  const range = yDomain[1] - yDomain[0];
  const step = Math.pow(10, Math.floor(Math.log10(range / target)));
  const ticks = [];
  const start = Math.ceil(yDomain[0] / step) * step;
  for (let v = start; v <= yDomain[1]; v += step) ticks.push(v);
  return ticks;
}

// =================== Label placement ===================
// Greedy idéntico al N°2: para cada candidato, default 1:30. Si choca,
// cardinales (12/3/6/9) y NW. Si nada entra, descartar (salvo forced que
// se fuerza al default aunque pise).
const S_OFF_DEFAULT = { dx: 7, dy: -6, anchor: 'start' };
const S_OFF_CARDINAL = [
  { dx: 0,  dy: -9,  anchor: 'middle' },  // 12:00
  { dx: 9,  dy: 4,   anchor: 'start' },   // 3:00
  { dx: 0,  dy: 14,  anchor: 'middle' },  // 6:00
  { dx: -9, dy: 4,   anchor: 'end' },     // 9:00
];
const S_OFF_NW = { dx: -7, dy: -6, anchor: 'end' };

function s_rectsOverlap(a, b) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

function s_buildLabelRect(cx, cy, textW, off) {
  const lx = cx + off.dx;
  const ly = cy + off.dy;
  let x1, x2;
  if (off.anchor === 'start') { x1 = lx; x2 = lx + textW; }
  else if (off.anchor === 'end') { x1 = lx - textW; x2 = lx; }
  else { x1 = lx - textW / 2; x2 = lx + textW / 2; }
  return { rect: { x1, x2, y1: ly - 11, y2: ly + 3 }, lx, ly, anchor: off.anchor };
}

function s_fitsInBox(rect, plotBox) {
  return rect.x1 >= plotBox.x1 && rect.x2 <= plotBox.x2 &&
         rect.y1 >= plotBox.y1 && rect.y2 <= plotBox.y2;
}

function s_tryPlaceLabel(cx, cy, textW, off, placed, plotBox) {
  const r = s_buildLabelRect(cx, cy, textW, off);
  if (!s_fitsInBox(r.rect, plotBox)) return null;
  if (placed.some(p => s_rectsOverlap(p, r.rect))) return null;
  return r;
}

// items: [{cx, cy, text, textW, confed, iso3, forced, subPriority}]
function s_layoutLabels(items, plotBox) {
  // Orden: forced primero → subPriority asc → X decreciente (zona densa
  // primero).
  const sorted = items.slice().sort((a, b) => {
    const fa = a.forced ? 0 : 1;
    const fb = b.forced ? 0 : 1;
    if (fa !== fb) return fa - fb;
    const sa = a.subPriority ?? 99, sb = b.subPriority ?? 99;
    if (sa !== sb) return sa - sb;
    return b.cx - a.cx;
  });
  const placed = [];
  const out = [];
  sorted.forEach(it => {
    let r = s_tryPlaceLabel(it.cx, it.cy, it.textW, S_OFF_DEFAULT, placed, plotBox);
    if (!r) {
      for (const off of S_OFF_CARDINAL) {
        r = s_tryPlaceLabel(it.cx, it.cy, it.textW, off, placed, plotBox);
        if (r) break;
      }
    }
    if (!r) {
      r = s_tryPlaceLabel(it.cx, it.cy, it.textW, S_OFF_NW, placed, plotBox);
    }
    if (!r && it.forced) {
      // Último recurso: usar default aunque pise. Solo para forced.
      const forced = s_buildLabelRect(it.cx, it.cy, it.textW, S_OFF_DEFAULT);
      if (s_fitsInBox(forced.rect, plotBox)) r = forced;
    }
    if (r) {
      placed.push(r.rect);
      out.push({ ...it, lx: r.lx, ly: r.ly, anchor: r.anchor });
    }
  });
  return out;
}

// =================== Render principal ===================
function drawScatter() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';

  // Editor sidebar: leemos config si está activo. Mismo patrón que N°2.
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg?.sizes;
  const aeCountries = (aeCfg?.countries && aeCfg.countries.length > 0)
    ? new Set(aeCfg.countries) : null;

  // Decidir dimensiones según formato del editor o viewport (igual N°2).
  const editorFormat = typeof getActivePngFormat === 'function'
    ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const publicFmt  = editorFormat === 'public';
  const mobile = !editorFormat
    && typeof isMobileViewport === 'function' && isMobileViewport();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    S_W = f.vbW; S_H = f.vbH;
    S_MARGIN = s_getMargins(editorFormat);
  } else if (mobile) {
    S_W = S_W_MOBILE; S_H = S_H_MOBILE;
    S_MARGIN = { ...S_MARGIN_MOBILE };
  } else {
    S_W = S_W_DESKTOP; S_H = S_H_DESKTOP;
    S_MARGIN = { ...S_MARGIN_DESKTOP };
  }
  S_PLOT_W = S_W - S_MARGIN.left - S_MARGIN.right;
  S_PLOT_H = S_H - S_MARGIN.top - S_MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${S_W} ${S_H}`);
  if (typeof applyFormatWrapper === 'function') {
    applyFormatWrapper(svg, editorFormat);
  }

  // Font sizes (idéntico al N°2: viewBox 1100 → escalados por formato).
  const SIZES = newsletter
    ? { tick: 18, axisTitle: 19, label: 17 }
    : square
    ? { tick: 18, axisTitle: 19, label: 17 }
    : mobilePng
    ? { tick: 28, axisTitle: 30, label: 24 }
    : mobile
    ? { tick: 32, axisTitle: 34, label: 28 }
    : {
        tick:      aeSizes?.ticks     ?? 11,
        axisTitle: aeSizes?.axisTitle ?? 11.5,
        label:     aeSizes?.labels    ?? 10.5
      };

  const s1 = state[1];
  const period = s1.period;
  const hoverConf = s1.hoverConf;
  const hiddenConfs = s1.hiddenConfs;
  // Dos conjuntos distintos (mismo modelo que N°2 chart-2):
  //  - selectedSet: países que el USER eligió manualmente vía búsqueda o
  //    click. Estos llevan chip, círculo más grande y label más bold.
  //  - auto-labeled (CONMEBOL): se etiquetan SIEMPRE como contexto editorial
  //    del número. No llevan chip ni círculo agrandado: son "default".
  //    La lógica es intrínseca (confed === 'CONMEBOL'), no estado.
  const selectedSet = s1.selectedCountries instanceof Set
    ? s1.selectedCountries
    : new Set(s1.selectedCountries || []);
  s1.selectedCountries = selectedSet; // normaliza por si vino como array

  // === Recalcular puntos / regresión / residuos ===
  // (depende SOLO del slider — handler del slider llama drawScatter, lo
  // mismo cuando el render se dispara por hover/click el contenido ya
  // estaría cached aunque acá lo recalculamos por simplicidad: cada
  // computePoints sobre 184 países × ~27 años toma <2ms.)
  s_allPts = s_computePoints(period);
  s_reg = s_ols(s_allPts);
  s_residByConf = s_residualsByConf(s_allPts, s_reg);

  const { xScale, yScale, xMinRaw, xMaxRaw, xDomain, yDomain } = s_makeScales(s_allPts);

  // === ClipPath para que puntos/labels no se salgan del plot ===
  const defs = s_ns('defs');
  const clip = s_ns('clipPath');
  const clipId = 's-plot-clip';
  clip.setAttribute('id', clipId);
  const clipRect = s_ns('rect');
  clipRect.setAttribute('x', S_MARGIN.left);
  clipRect.setAttribute('y', S_MARGIN.top);
  clipRect.setAttribute('width', S_PLOT_W);
  clipRect.setAttribute('height', S_PLOT_H);
  clip.appendChild(clipRect);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // === Background del área de plot ===
  const bg = s_ns('rect');
  bg.setAttribute('x', S_MARGIN.left);
  bg.setAttribute('y', S_MARGIN.top);
  bg.setAttribute('width', S_PLOT_W);
  bg.setAttribute('height', S_PLOT_H);
  bg.setAttribute('fill', 'var(--bg)');
  svg.appendChild(bg);

  // === Grid + ticks X ===
  const gridG = s_ns('g'); gridG.setAttribute('class', 's-grid'); svg.appendChild(gridG);
  const axisG = s_ns('g'); axisG.setAttribute('class', 's-axis'); svg.appendChild(axisG);

  // Filtramos los ticks fijos al dominio actual.
  const xTicksRaw = S_X_TICKS_RAW.filter(v => {
    const logV = Math.log10(v);
    return logV >= xDomain[0] - 0.001 && logV <= xDomain[1] + 0.001;
  });
  xTicksRaw.forEach(v => {
    const x = xScale(Math.log10(v));
    const line = s_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', S_MARGIN.top); line.setAttribute('y2', S_MARGIN.top + S_PLOT_H);
    line.setAttribute('class', 's-grid-line');
    gridG.appendChild(line);
    const lbl = s_ns('text');
    lbl.setAttribute('x', x);
    const xTickGap = mobile ? 44 : mobilePng ? 38 : 18;
    lbl.setAttribute('y', S_MARGIN.top + S_PLOT_H + xTickGap);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 's-tick');
    lbl.setAttribute('font-size', SIZES.tick);
    lbl.textContent = s_fmtMoney(v);
    axisG.appendChild(lbl);
  });

  // === Grid + ticks Y ===
  const yTicks = s_yTicks(yDomain, 6);
  yTicks.forEach(v => {
    const y = yScale(v);
    if (y < S_MARGIN.top - 1 || y > S_MARGIN.top + S_PLOT_H + 1) return;
    const line = s_ns('line');
    line.setAttribute('x1', S_MARGIN.left); line.setAttribute('x2', S_MARGIN.left + S_PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('class', 's-grid-line');
    gridG.appendChild(line);
    const lbl = s_ns('text');
    lbl.setAttribute('x', S_MARGIN.left - 8);
    lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('class', 's-tick');
    lbl.setAttribute('font-size', SIZES.tick);
    lbl.textContent = Math.round(v);
    axisG.appendChild(lbl);
  });

  // === Ejes (líneas finas) ===
  const xAx = s_ns('line');
  xAx.setAttribute('x1', S_MARGIN.left); xAx.setAttribute('x2', S_MARGIN.left + S_PLOT_W);
  xAx.setAttribute('y1', S_MARGIN.top + S_PLOT_H); xAx.setAttribute('y2', S_MARGIN.top + S_PLOT_H);
  xAx.setAttribute('class', 's-axis-line');
  axisG.appendChild(xAx);
  const yAx = s_ns('line');
  yAx.setAttribute('x1', S_MARGIN.left); yAx.setAttribute('x2', S_MARGIN.left);
  yAx.setAttribute('y1', S_MARGIN.top); yAx.setAttribute('y2', S_MARGIN.top + S_PLOT_H);
  yAx.setAttribute('class', 's-axis-line');
  axisG.appendChild(yAx);

  // === Títulos de ejes ===
  const xT = s_ns('text');
  xT.setAttribute('class', 's-axis-title');
  xT.setAttribute('x', S_MARGIN.left + S_PLOT_W / 2);
  const xTitleY = mobile ? S_H - 70 : mobilePng ? S_H - 60 : S_H - 14;
  xT.setAttribute('y', xTitleY);
  xT.setAttribute('text-anchor', 'middle');
  xT.setAttribute('font-size', SIZES.axisTitle);
  const customAxisX = (aeCfg?.texts?.[(aeCfg?.lang || 'es')]?.axisX || '').trim();
  const customAxisY = (aeCfg?.texts?.[(aeCfg?.lang || 'es')]?.axisY || '').trim();
  xT.textContent = customAxisX || (typeof t === 'function' ? t('c1-axis-x') : 'PIB total (PPA, US$ int. constantes) — escala log');
  svg.appendChild(xT);

  const yT = s_ns('text');
  yT.setAttribute('class', 's-axis-title');
  yT.setAttribute('x', -(S_MARGIN.top + S_PLOT_H / 2));
  yT.setAttribute('y', (mobile || mobilePng) ? 36 : 16);
  yT.setAttribute('transform', 'rotate(-90)');
  yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('font-size', SIZES.axisTitle);
  yT.textContent = customAxisY || (typeof t === 'function' ? t('c1-axis-y') : 'ELO promedio del período');
  svg.appendChild(yT);

  // === Línea de regresión ===
  // Generamos un path sobre el rango visible. El modelo es en log10(gdp),
  // así que sampleamos en log space.
  if (s_reg) {
    const regPath = s_ns('path');
    regPath.setAttribute('class', 's-regression');
    regPath.setAttribute('stroke', 'var(--ink)');
    regPath.setAttribute('stroke-width', 1.4);
    regPath.setAttribute('stroke-opacity', 0.6);
    regPath.setAttribute('fill', 'none');
    regPath.setAttribute('stroke-dasharray', '5 3');
    const N_SAMPLES = 60;
    let d = '';
    for (let i = 0; i <= N_SAMPLES; i++) {
      const t01 = i / N_SAMPLES;
      const logX = xDomain[0] + t01 * (xDomain[1] - xDomain[0]);
      const yPred = s_reg.a + s_reg.b * logX;
      const px = xScale(logX), py = yScale(yPred);
      d += (d ? ' L ' : 'M ') + px.toFixed(2) + ' ' + py.toFixed(2);
    }
    regPath.setAttribute('d', d);
    regPath.setAttribute('clip-path', `url(#${clipId})`);
    svg.appendChild(regPath);
  }

  // === Puntos ===
  const ptsG = s_ns('g');
  ptsG.setAttribute('clip-path', `url(#${clipId})`);
  svg.appendChild(ptsG);

  // Filtramos por hiddenConfs, pero MANTENEMOS los seleccionados aunque su
  // confed esté oculta (la selección explícita del user prevalece). También
  // dejamos pasar la confed hovered. CONMEBOL NO se exenta: si el user
  // desactiva el chip CONMEBOL en la leyenda, esperamos que se oculten.
  const drawables = s_allPts.filter(p =>
    !hiddenConfs.has(p.confed) || selectedSet.has(p.iso3) || p.confed === hoverConf
  );

  // Orden de dibujo (mayor score → encima):
  //  +1 si CONMEBOL (default editorial)
  //  +5 si confed hovered
  //  +10 si selected manualmente (user)
  const ordered = drawables.slice().sort((a, b) => {
    const score = (d) => {
      let s = 0;
      if (d.confed === 'CONMEBOL') s += 1;
      if (hoverConf && d.confed === hoverConf) s += 5;
      if (selectedSet.has(d.iso3)) s += 10;
      return s;
    };
    return score(a) - score(b);
  });

  const tooltip = document.getElementById('tooltip1');

  ordered.forEach(d => {
    const cx = xScale(d.x);
    const cy = yScale(d.elo);
    const isSelected   = selectedSet.has(d.iso3);
    const isAutoLabel  = d.confed === 'CONMEBOL';
    const isHovered    = hoverConf && d.confed === hoverConf;
    const hasHover     = !!hoverConf;
    // Dim solo se aplica cuando hay hover y este punto no es ni el hovered
    // ni el manualmente seleccionado. CONMEBOL SÍ se dimea — mismo modelo
    // que LATAM en el N°2 cuando hovereás otra región.
    const isDimmed = hasHover && !isHovered && !isSelected;

    // Tres tamaños — selected > auto-labeled (CONMEBOL) > otros:
    let r, fillOp, stroke, strokeW;
    if (isSelected) {
      // Selected manualmente (chip): círculo grande con outline negro.
      r = S_POINT_R_SELECTED; fillOp = 0.95; stroke = '#1A1A1A'; strokeW = 1.1;
    } else if (isAutoLabel) {
      // CONMEBOL default: tamaño mediano, outline gris oscuro.
      r = S_POINT_R_LABELED; fillOp = 0.95; stroke = '#1A1A1A'; strokeW = 0.9;
    } else if (isHovered) {
      r = 5; fillOp = 0.9; stroke = '#1A1A1A'; strokeW = 0.7;
    } else {
      r = S_POINT_R_OTHER; fillOp = 0.78; stroke = 'white'; strokeW = 0.5;
    }

    const c = s_ns('circle');
    c.setAttribute('class', 's-point' + (isDimmed ? ' s-dim' : ''));
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', CONF_FIFA_COLORS[d.confed] || '#888');
    c.setAttribute('fill-opacity', fillOp);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', strokeW);
    c.dataset.iso3 = d.iso3;
    c.dataset.confed = d.confed;

    // Tooltip
    if (tooltip) {
      c.addEventListener('mouseenter', (e) => s_showTooltip(e, d, tooltip));
      c.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
      c.addEventListener('mousemove', (e) => s_positionTooltip(e, tooltip));
    }
    // Click: toggle label.
    c.addEventListener('click', (ev) => {
      ev.stopPropagation();
      s_toggleLabel(d.iso3);
    });

    ptsG.appendChild(c);
  });

  // === Labels ===
  const plotBox = {
    x1: S_MARGIN.left + 1,
    y1: S_MARGIN.top + 1,
    x2: S_MARGIN.left + S_PLOT_W - 1,
    y2: S_MARGIN.top + S_PLOT_H - 1
  };

  // Universo de búsqueda para hover (los visibles).
  const labelPool = drawables;
  // Daniel: por default SOLO CONMEBOL etiquetado — sin extremos. Si quisieras
  // re-agregar "el equipo más fuerte del mundo" (extremeMax) o "el más
  // chico" (extremeMin, suele caer en Palaos/Tuvalu), descomentar el bloque
  // que calculaba ambos y los addLabelItem() de más abajo.

  const labelItems = [];
  const seenCodes = new Set();
  function addLabelItem(d, forced, subPriority) {
    if (seenCodes.has(d.iso3)) return;
    seenCodes.add(d.iso3);
    const text = s_displayName(d);
    const isSelected  = selectedSet.has(d.iso3);
    const isAutoLabel = d.confed === 'CONMEBOL';
    // Bold (600) solo para selected manual; auto-labeled mantiene weight 500
    // para distinguir visualmente "viene por default" vs "el user lo eligió".
    const textW = s_measureText(text, SIZES.label, isSelected ? 600 : 500) + 2;
    labelItems.push({
      cx: xScale(d.x),
      cy: yScale(d.elo),
      text,
      textW,
      confed: d.confed,
      iso3: d.iso3,
      forced: forced || isSelected || isAutoLabel,
      isSelected,
      isAutoLabel,
      subPriority: subPriority ?? 99
    });
  }

  // 1. Auto-labeled (CONMEBOL): default editorial, label SIEMPRE visible.
  //    Buscan en s_allPts por si la confed CONMEBOL está oculta en hiddenConfs
  //    — en ese caso queremos respetar el hide y NO etiquetarlos.
  s_allPts.forEach(d => {
    if (d.confed === 'CONMEBOL' && !hiddenConfs.has('CONMEBOL')) {
      addLabelItem(d, true, 0);
    }
  });

  // 2. Selected manualmente por el user (chip): label visible siempre, con
  //    estilo bold para diferenciarse del auto-label. Buscan en s_allPts por
  //    si su confed está oculta — el chip prevalece sobre el filtro.
  selectedSet.forEach(iso3 => {
    const d = s_allPts.find(p => p.iso3 === iso3);
    if (d) addLabelItem(d, true, 0);
  });

  // 3. Editor: lista explícita override (para captura de PNG editorial).
  if (aeCountries && aeCountries.size > 0) {
    aeCountries.forEach(iso3 => {
      const d = s_allPts.find(p => p.iso3 === iso3);
      if (d) addLabelItem(d, true, 0);
    });
  } else if (hoverConf) {
    // 4. Modo hover-confed: etiquetar países de ESA confed. Anclas globales
    //    (USA, DEU, etc.) que caigan ahí son Tier 0; resto Tier 1. Si la
    //    confed hovered ES CONMEBOL, Big Five es Tier 0 (mismo que default).
    const isConmebolHover = hoverConf === 'CONMEBOL';
    labelPool.filter(p => p.confed === hoverConf).forEach(p => {
      let sub;
      if (isConmebolHover) {
        sub = S_CONMEBOL_BIG_FIVE.has(p.iso3) ? 0 : 99;
      } else {
        sub = S_PRIORITY_NON_CONMEBOL.has(p.iso3) ? 0 : 1;
      }
      addLabelItem(p, false, sub);
    });
  }

  const placed = s_layoutLabels(labelItems, plotBox);

  const labelsG = s_ns('g'); svg.appendChild(labelsG);
  placed.forEach(l => {
    const txt = s_ns('text');
    // Clase s-labeled-label solo para selected manualmente — auto-labeled
    // (CONMEBOL) usa s-country-label "neutra" (weight 500). Consistente con
    // el N°2 chart 2 donde LATAM default no lleva el modifier.
    txt.setAttribute('class', 's-country-label' + (l.isSelected ? ' s-labeled-label' : ''));
    txt.setAttribute('x', l.lx);
    txt.setAttribute('y', l.ly);
    txt.setAttribute('text-anchor', l.anchor);
    txt.setAttribute('fill', CONF_FIFA_LABEL_COLORS[l.confed] || '#444');
    txt.setAttribute('font-size', SIZES.label);
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // Click en zona vacía limpia tooltip (no limpia selección).
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle' && tooltip) {
      tooltip.style.opacity = '0';
    }
  };

  // === Banner ===
  s_updateBanner();

  // Refrescar SOLO los residuos de los chips (no recrear el DOM de la
  // leyenda). Recrear chips desde drawScatter generaba un loop infinito:
  // el browser re-dispara mouseenter en el chip recreado bajo el cursor,
  // mouseenter llama drawScatter, drawScatter recrea chips, etc.
  // updateLegendResiduals muta los textContent in-place; no toca handlers.
  updateLegendResiduals();

  // Editor overrides al final para pisar lo dinámico.
  s_applyEditorOverrides(aeCfg, aeSizes);
}

// Update minimal: solo refresca los textos de residuo de los chips. NO
// recrea elementos del DOM (eso generaría re-disparos de mouseenter cuando
// el cursor está sobre un chip — loop infinito). Llamado desde drawScatter
// cada vez que cambian s_residByConf (período/slider).
function updateLegendResiduals() {
  const container = document.querySelector('.m-legend[data-chart="1"]');
  if (!container) return;
  CONF_FIFA_ORDER.forEach(conf => {
    const chip = container.querySelector(`.m-legend-chip[data-confed="${conf}"]`);
    if (!chip) return;
    const span = chip.querySelector('.m-legend-rz');
    if (!span) return;
    const rz = (typeof s_residByConf !== 'undefined') ? s_residByConf[conf] : null;
    const pct = (rz && typeof rz === 'object') ? rz.pct : null;
    span.textContent = (pct == null) ? '—' : ((pct >= 0 ? '+' : '') + pct.toFixed(1) + '%');
    span.style.color = (pct == null) ? 'var(--ink-muted)' : (pct >= 0 ? '#3E6B47' : '#A23B2A');
  });
}

// =================== Banner ===================
// 4 stats horizontal:
//   PAÍSES (n): 184    R²: 0.44    RESIDUO MEDIO · CONMEBOL: +273    PERÍODO: 2000–2026
//
// La confed mostrada en el banner es:
//   1. hoverConf si hay hover activo (banner sigue al mouse en tiempo real),
//   2. stickyConf en otro caso (la última confed sobre la que se posó el
//      mouse — sticky, NO se borra al salir del chip).
//   3. CONMEBOL como fallback inicial antes del primer hover.
// Daniel quiso este comportamiento: si el lector compara CONMEBOL vs AFC,
// al salir del chip AFC el banner se queda en AFC en lugar de saltar a
// CONMEBOL — preserva el "estado mental" del lector.
// El residuo SE PINTA: positivo en verde, negativo en rojo del Atlas.
function s_updateBanner() {
  const el = document.getElementById('s-banner');
  if (!el) return;
  const s1 = state[1];
  const period = s1.period;
  const conf = s1.hoverConf || s1.stickyConf || 'CONMEBOL';
  const rz = s_residByConf[conf];

  const n = s_reg ? s_reg.n : 0;
  const r2 = s_reg ? s_reg.r2.toFixed(2) : '–';
  // rz puede ser {abs, pct} (formato nuevo) o number (formato viejo). Toleramos
  // ambos por compatibilidad.
  const rzPct = (rz && typeof rz === 'object') ? rz.pct : null;
  const rzAbs = (rz && typeof rz === 'object') ? rz.abs : rz;
  const sign = (v) => (v == null) ? '' : (v >= 0 ? '+' : '');
  const rzPctStr = rzPct == null ? '—' : `${sign(rzPct)}${rzPct.toFixed(1)}%`;
  const rzAbsStr = rzAbs == null ? '' : `${sign(rzAbs)}${Math.round(rzAbs)} Elo`;
  const rzColor = rzPct == null ? 'var(--ink)' : (rzPct >= 0 ? '#3E6B47' : '#A23B2A');

  const bt = (k, fallback) => (typeof t === 'function' ? t(k) : fallback);
  el.innerHTML = `
    <span class="s-banner-item"><span class="s-banner-key">${bt('c1-banner-n', 'Países (n)')}</span><span class="s-banner-val">${n}</span></span>
    <span class="s-banner-sep">·</span>
    <span class="s-banner-item"><span class="s-banner-key">${bt('c1-banner-r2', 'R²')}</span><span class="s-banner-val">${r2}</span></span>
    <span class="s-banner-sep">·</span>
    <span class="s-banner-item">
      <span class="s-banner-key">${bt('c1-banner-residual', 'Residuo medio')} · ${conf}</span>
      <span class="s-banner-val" style="color:${rzColor}">${rzPctStr}</span>
      <span class="s-banner-sub" style="color:${rzColor};opacity:.65;font-size:.85em;font-style:italic;margin-left:2px">${rzAbsStr}</span>
    </span>
    <span class="s-banner-sep">·</span>
    <span class="s-banner-item"><span class="s-banner-key">${bt('c1-banner-period', 'Período')}</span><span class="s-banner-val">${period[0]}–${period[1]}</span></span>
  `;
}

// Editor overrides — solo aplica font-size al banner y textos editoriales
// si el editor está activo. Mismo patrón que N°2.
function s_applyEditorOverrides(aeCfg, aeSizes) {
  const banner = document.getElementById('s-banner');
  if (banner && aeSizes && typeof aeSizes.special === 'number') {
    banner.style.fontSize = aeSizes.special + 'px';
  }
  const lang = aeCfg?.lang || 'es';
  const t = aeCfg?.texts?.[lang] || {};
  const block = document.querySelector('.chart-block[data-chart="1"]');
  if (!block) return;
  const customTitle    = (t.title    || '').trim();
  const customSubtitle = (t.subtitle || '').trim();
  if (customTitle) {
    const el = block.querySelector('.chart-title');
    if (el) el.textContent = customTitle;
  }
  if (customSubtitle) {
    const el = block.querySelector('.chart-subtitle');
    if (el) el.textContent = customSubtitle;
  }
}

// =================== Tooltip ===================
function s_showTooltip(e, d, tooltip) {
  // Residuo en % grande + Elo chiquito en italic al lado (decisión editorial:
  // el % es más interpretable para el lector general, el valor en puntos Elo
  // es contexto técnico).
  const pct = d.residPct;
  const abs = d.resid;
  const sign = v => (v == null) ? '' : (v >= 0 ? '+' : '');
  const pctStr = pct == null ? '—' : `${sign(pct)}${pct.toFixed(1)}%`;
  const absStr = abs == null ? '' : `${sign(abs)}${Math.round(abs)} Elo`;
  const confColor = CONF_FIFA_COLORS[d.confed] || '#888';

  const tt = (k, fallback) => (typeof t === 'function' ? t(k) : fallback);
  tooltip.innerHTML = `
    <strong>${s_displayName(d)}</strong>
    <div class="tt-region" style="color:${confColor}">${d.confed}</div>
    <div class="tt-row"><span>${tt('c1-tt-elo', 'ELO prom')}</span><span>${Math.round(d.elo)}</span></div>
    <div class="tt-row"><span>${tt('c1-tt-gdp', 'PIB')}</span><span>${s_fmtMoney(d.gdp)}</span></div>
    <div class="tt-row"><span>${tt('c1-tt-residual', 'Residuo')}</span><span>${pctStr} <span style="font-size:.85em;opacity:.65;font-style:italic;margin-left:2px">${absStr}</span></span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  s_positionTooltip(e, tooltip);
}

function s_positionTooltip(e, tooltip) {
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  let tx = e.clientX - wrap.left + 12;
  if (tx + tw > wrap.width) tx = e.clientX - wrap.left - tw - 12;
  let ty = e.clientY - wrap.top - th - 8;
  if (ty < 0) ty = e.clientY - wrap.top + 14;
  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';
}

// =================== Legend (chips de confederación) ===================
// Doble interacción:
//   - Hover (desktop): preview → banner cambia + puntos no-confed dim + se
//     etiquetan los países de esa confed. Al salir, vuelve al default.
//   - Click: toggle visibilidad. hiddenConfs es un Set; click agrega/quita.
//     NO afecta regresión / R² / residuos del banner. La regresión sigue
//     siendo global sobre TODOS los países del período (handoff §4.1.1).
function renderScatterLegend() {
  const container = document.querySelector('.m-legend[data-chart="1"]');
  if (!container) return;
  container.innerHTML = '';
  const hiddenConfs = state[1].hiddenConfs;
  CONF_FIFA_ORDER.forEach(conf => {
    const chip = document.createElement('span');
    chip.className = 'm-legend-chip';
    chip.dataset.confed = conf;
    const isHidden = hiddenConfs.has(conf);
    if (isHidden) chip.classList.add('inactive');
    // Residuo inline en cada chip — mismo cálculo que el banner pero por
    // confed individual. Da comparación 6-way de un vistazo sin tener que
    // hovear cada chip. s_residByConf se popula al fin de drawScatter() —
    // en el primer render puede no estar todavía, ahí mostramos "—".
    const rz = (typeof s_residByConf !== 'undefined') ? s_residByConf[conf] : null;
    const rzStr = (rz == null) ? '—' : ((rz >= 0 ? '+' : '') + Math.round(rz));
    const rzColor = (rz == null) ? 'var(--ink-muted)' : (rz >= 0 ? '#3E6B47' : '#A23B2A');
    chip.innerHTML = `
      <span class="m-legend-swatch" style="background:${CONF_FIFA_COLORS[conf]}"></span>
      <span class="m-legend-label">${conf}</span>
      <span class="m-legend-rz" style="color:${rzColor}">${rzStr}</span>
    `;
    if (typeof HAS_HOVER === 'undefined' || HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        if (state[1].hiddenConfs.has(conf)) return;
        state[1].hoverConf = conf;
        // Sticky: el banner se queda en esta confed aunque el mouse salga.
        state[1].stickyConf = conf;
        drawScatter();
      });
      chip.addEventListener('mouseleave', () => {
        // hoverConf se borra (chart pierde la iluminación), pero
        // stickyConf NO — el banner mantiene la última visitada.
        state[1].hoverConf = null;
        drawScatter();
      });
    }
    chip.addEventListener('click', () => {
      const h = state[1].hiddenConfs;
      if (h.has(conf)) h.delete(conf); else h.add(conf);
      state[1].hoverConf = null;
      renderScatterLegend();
      drawScatter();
    });
    container.appendChild(chip);
  });
}

// =================== Slider temporal de RANGO ===================
// Diferencia clave con el N°2: 2 thumbs (from + to) en lugar de uno solo.
// Implementado como dos <input type=range> superpuestos visualmente vía
// CSS — sin librerías externas (sin noUiSlider). Mínimo 5 años entre
// thumbs para que la regresión tenga sentido.
//
// Botón play: omitido en este pase (no es trivial con 2 thumbs y el
// brief lo deja como opcional). Se puede agregar después incrementando
// ambos thumbs en paralelo con un timer.
function setupScatterSlider() {
  const fromEl = document.getElementById('s-slider-from');
  const toEl   = document.getElementById('s-slider-to');
  const dispEl = document.getElementById('s-range-display');
  // Track activo coloreado entre los dos thumbs (puramente decorativo, opcional)
  const trackActiveEl = document.getElementById('s-range-track-active');
  if (!fromEl || !toEl || !dispEl) return;

  function updateDisplay() {
    const [a, b] = state[1].period;
    dispEl.textContent = `${a}–${b}`;
    // Pinta el segmento entre from y to en el color de acento.
    // Convertimos los valores a porcentajes del rango total del input.
    if (trackActiveEl) {
      const min = parseInt(fromEl.min, 10);
      const max = parseInt(fromEl.max, 10);
      const span = max - min;
      if (span > 0) {
        const leftPct  = ((a - min) / span) * 100;
        const rightPct = ((max - b) / span) * 100;
        trackActiveEl.style.left  = leftPct + '%';
        trackActiveEl.style.right = rightPct + '%';
      }
    }
  }

  // Sincroniza los inputs con el state. Llamado al iniciar y en cada
  // cambio para corregir el thumb que el usuario no movió (por si el
  // clamp lo desplazó).
  function syncInputs() {
    fromEl.value = state[1].period[0];
    toEl.value   = state[1].period[1];
  }

  function onChangeFrom() {
    let from = parseInt(fromEl.value, 10);
    let to   = state[1].period[1];
    // Clamp: from no puede acercarse a to más de S_MIN_WINDOW.
    if (from > to - S_MIN_WINDOW) from = to - S_MIN_WINDOW;
    state[1].period = [from, to];
    syncInputs();
    updateDisplay();
    drawScatter();
  }

  function onChangeTo() {
    let from = state[1].period[0];
    let to   = parseInt(toEl.value, 10);
    if (to < from + S_MIN_WINDOW) to = from + S_MIN_WINDOW;
    state[1].period = [from, to];
    syncInputs();
    updateDisplay();
    drawScatter();
  }

  fromEl.addEventListener('input', onChangeFrom);
  toEl.addEventListener('input', onChangeTo);

  syncInputs();
  updateDisplay();
}

// =================== Buscador + chips de selección ===================
function s_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function s_searchableCountries() {
  // Lista única de países (todos los del dataset — son estables, no
  // dependen del período).
  return DATA_ELO_PIB
    .map(d => ({ iso3: d.iso3, name: s_displayName(d), confed: d.confed }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Toggle de selección manual (chip + círculo grande). NO afecta a CONMEBOL
// "default" — esos están etiquetados por la lógica intrínseca del chart, no
// por estado. Si selectedSet ya tiene un CONMEBOL, removerlo solo quita el
// chip y el círculo grande; el país sigue etiquetado vía la rama auto-label.
function s_toggleSelect(iso3) {
  if (!(state[1].selectedCountries instanceof Set)) {
    state[1].selectedCountries = new Set(state[1].selectedCountries || []);
  }
  const sel = state[1].selectedCountries;
  if (sel.has(iso3)) sel.delete(iso3);
  else sel.add(iso3);
  renderScatterSelectedChips();
  drawScatter();
}
// Alias de compatibilidad por si algún caller viejo todavía la usa.
const s_toggleLabel = s_toggleSelect;

function renderScatterSelectedChips() {
  const container = document.getElementById('s-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  if (!(state[1].selectedCountries instanceof Set)) {
    state[1].selectedCountries = new Set(state[1].selectedCountries || []);
  }
  // Solo selectedCountries — NO los CONMEBOL auto-labeled. Si el user busca
  // un CONMEBOL (ej. Argentina) y lo selecciona, ahí sí aparece el chip.
  const byIso = {};
  DATA_ELO_PIB.forEach(d => byIso[d.iso3] = d);
  const arr = Array.from(state[1].selectedCountries)
    .map(iso3 => byIso[iso3])
    .filter(Boolean)
    .sort((a, b) => s_displayName(a).localeCompare(s_displayName(b), 'es'));

  arr.forEach(d => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = CONF_FIFA_COLORS[d.confed] || '#888';
    chip.textContent = s_displayName(d);
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', typeof t === 'function' ? t('chip-remove') : 'Remove');
    x.addEventListener('click', () => s_toggleSelect(d.iso3));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupScatterSearch() {
  const input = document.getElementById('s-search');
  const results = document.getElementById('s-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = s_normalize(q);
    return s_searchableCountries()
      .filter(c => s_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[1].selectedCountries.has(c.iso3);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso3}">${c.name}<span class="m-search-region">${c.confed}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('click', () => {
        s_toggleLabel(el.dataset.iso);
        input.value = '';
        results.classList.remove('open');
        input.focus();
      });
    });
  }
  input.addEventListener('input', () => {
    currentMatches = getMatches(input.value);
    activeIdx = currentMatches.length > 0 ? 0 : -1;
    renderResults(currentMatches, activeIdx);
  });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      activeIdx = (activeIdx + 1) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'Enter' && activeIdx >= 0) {
      ev.preventDefault();
      s_toggleLabel(currentMatches[activeIdx].iso3);
      input.value = '';
      results.classList.remove('open');
    } else if (ev.key === 'Escape') {
      results.classList.remove('open');
      input.blur();
    }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) {
      results.classList.remove('open');
    }
  });
}

// =================== Download CSV ===================
// Dataset completo en formato LONG: una fila por (país × año) con elo y pib.
// PIB es el TOTAL (no per cápita) del dataset embebido (FMI, PPP, USD const).
// Un país aparece solo en años donde tiene AL MENOS uno de los dos campos.
// El N°3 no usa snapshot por año del slider (a diferencia del N°2), así que
// no hay duplicados — cada fila es una observación única.
function setupScatterDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="1-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rows = [];
      DATA_ELO_PIB.forEach(c => {
        const years = new Set([
          ...Object.keys(c.elo || {}),
          ...Object.keys(c.gdp || {})
        ]);
        years.forEach(y => {
          rows.push({
            iso3:  c.iso3,
            name:  (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[c.iso3]?.en) || c.name,
            confed: c.confed,
            year:  parseInt(y, 10),
            elo:   c.elo?.[y] ?? null,
            gdp_ppp_constant_2021_usd: c.gdp?.[y] ?? null
          });
        });
      });
      // Orden estable: por iso3, después por año.
      rows.sort((a, b) => a.iso3.localeCompare(b.iso3) || a.year - b.year);

      const cols = ['iso3', 'name', 'confed', 'year', 'elo', 'gdp_ppp_constant_2021_usd'];
      let csv = cols.join(',') + '\n';
      rows.forEach(r => {
        const row = cols.map(k => {
          const v = r[k];
          if (v === null || v === undefined) return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          return v;
        });
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (typeof LANG !== 'undefined' && LANG === 'en')
        ? 'the-atlas-03-elo-vs-gdp.csv'
        : 'el-atlas-03-elo-vs-pib.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

// =================== Init ===================
function initScatter() {
  // selectedCountries arranca VACÍO — los CONMEBOL se etiquetan por la lógica
  // intrínseca del chart (confed === 'CONMEBOL'), no por estado pre-cargado.
  // Esto refleja el modelo del N°2 chart 2: LATAM viene etiquetada sin chip,
  // y solo aparece chip cuando el user agrega manualmente desde el buscador.
  if (!state[1]) {
    state[1] = {
      period: [...S_PERIOD_DEFAULT],
      hoverConf: null,
      stickyConf: 'CONMEBOL',  // banner default — última conf hovereada
      hiddenConfs: new Set(),
      selectedCountries: new Set(),
      playing: false
    };
  } else {
    if (!state[1].period)      state[1].period = [...S_PERIOD_DEFAULT];
    if (state[1].hoverConf == null) state[1].hoverConf = null;
    if (state[1].stickyConf == null) state[1].stickyConf = 'CONMEBOL';
    if (!state[1].hiddenConfs) state[1].hiddenConfs = new Set();
    // Soporta state previo con `.labeled` (array o Set) — migra a
    // selectedCountries pero filtra los CONMEBOL (que pasan a ser auto).
    if (!state[1].selectedCountries) {
      if (state[1].labeled) {
        const arr = state[1].labeled instanceof Set
          ? Array.from(state[1].labeled)
          : (state[1].labeled || []);
        const conmebolIsos = new Set();
        DATA_ELO_PIB.forEach(d => { if (d.confed === 'CONMEBOL') conmebolIsos.add(d.iso3); });
        state[1].selectedCountries = new Set(arr.filter(iso => !conmebolIsos.has(iso)));
        delete state[1].labeled;
      } else {
        state[1].selectedCountries = new Set();
      }
    } else if (!(state[1].selectedCountries instanceof Set)) {
      state[1].selectedCountries = new Set(state[1].selectedCountries);
    }
    if (state[1].playing == null) state[1].playing = false;
  }

  renderScatterLegend();
  drawScatter();
  setupScatterSlider();
  setupScatterSearch();
  setupScatterDownloadCSV();
  renderScatterSelectedChips();

  // Editor sidebar: re-render cuando el usuario edita.
  if (!initScatter._editorWired) {
    initScatter._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawScatter());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
}
