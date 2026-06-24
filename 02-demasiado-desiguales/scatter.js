// =============================================================
//  scatter.js — chart 2 del N°2 "Demasiado desiguales"
// =============================================================
//
// Scatter Gini vs PIB per cápita (PPP, USD constantes 2021), un punto por
// país. La regresión ajusta una curva sobre el snapshot del año activo y
// muestra cuánto se desvía cada región de "lo esperado" para su nivel de
// desarrollo. La tesis editorial: América Latina sistemáticamente por
// encima de la línea — más desigual de lo que su PIB predice.
//
// Modelo de regresión:
//   Lineal:    Gini = a + b · ln(PIB pc)
//   Cuadrática: Gini = a + b · ln(PIB pc) + c · ln(PIB pc)²
// (Los coefs vienen precomputados en data-scatter.js para Gini ajustado.
//  Para Gini "original" recalculamos client-side con s_ols/s_quadFit.)
//
// Features:
//   - Toggle Modelo: Lineal / Cuadrática (default Lineal).
//   - Toggle Gini: Original (gini_raw) / Ajustado (gini_adj × 1,13 para
//     consumo). Default Ajustado — es el que homogeneiza mediciones.
//   - Toggle Escala X: Log / Lineal (default Log).
//   - Slider temporal 2010-2025 con botón play (~8 seg recorrido completo).
//   - Hover sobre chip de región: banner regional pasa a mostrar su
//     residuo. Sin hover, muestra Latam (la protagonista del Atlas).
//   - Click en punto = toggle selección. Selección persiste entre años
//     (si el país no aparece en el año actual, el chip queda pero el
//     punto no se renderea).
//   - Buscador de país con resultados desplegables (mismo patrón que
//     el marimekko).
//   - Labels editorialmente curados: los 16 anclas (5 Latam + 11 no
//     Latam) + extremos del año (max y min Gini) + países seleccionados.
//   - Subtítulo dinámico: refleja el residuo % de Latam para el modelo
//     y año activos.
//   - Banner regional debajo del SVG: N · R² · Residuo de la región
//     activa (hover o Latam por default).
//
// Depende de: DATA_SCATTER, REGION_WB_ORDER, REGION_WB_COLORS,
// REGION_WB_LABEL_COLORS, COUNTRY_NAMES, LANG, t, state[2].

// =================== Constantes ===================
// Dimensiones desktop default (sin editor activo). Mobile interactivo
// (≤768px sin editor) usa viewBox portrait alto (1100×1500) cuyo aspect
// ratio matchea el container portrait (~412×540, ratio ≈0.76).
//
// Cuando hay un formato del editor activo (newsletter / square / mobile /
// public), las dimensiones vienen de PNG_FORMATS[format] en utils.js y los
// margins de s_getMargins(format). El PNG export rasteriza el SVG visible
// — no fuerza re-render.
const S_W_DESKTOP = 1100, S_H_DESKTOP = 540;
const S_W_MOBILE  = 1100, S_H_MOBILE  = 1500;
// Margin: top 30 (subtítulo va en HTML, no en SVG), bottom 60 (eje X +
// label), left 60 (eje Y + label), right 32 (padding para labels que
// caen al borde derecho).
const S_MARGIN_DESKTOP = { top: 30, right: 32, bottom: 60, left: 60 };
// Mobile interactivo (≤768px sin editor): plot ~3× más alto → margins
// escaladas.
//   - left 140: ticks Y a 32px SVG necesitan más ancho.
//   - bottom 240: axis title rotado + ticks rotados + banner = mucha más
//     altura bajo el plot (las etiquetas X log "$1k/$10k/$100k" tienen
//     ~28-30px SVG cada una).
//   - top 110: subtítulo en HTML, dejamos aire arriba.
//   - right 30: mínimo para que los puntos cercanos al máximo no toquen.
const S_MARGIN_MOBILE  = { top: 110, right: 30, bottom: 240, left: 140 };

// Margins por formato del editor (cuando el editor está activo).
function s_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 32, bottom: 100, left: 70 };
    case 'newsletter': return { top: 40, right: 40, bottom: 130, left: 70 };
    case 'square':     return { top: 40, right: 44, bottom: 70, left: 92 };
    case 'mobile':     return { top: 60,  right: 36, bottom: 220, left: 110 };
    default:           return { ...S_MARGIN_DESKTOP };
  }
}

let S_W = S_W_DESKTOP, S_H = S_H_DESKTOP;
let S_MARGIN = { ...S_MARGIN_DESKTOP };
let S_PLOT_W = S_W - S_MARGIN.left - S_MARGIN.right;
let S_PLOT_H = S_H - S_MARGIN.top - S_MARGIN.bottom;

// Eje Y fijo: Gini suele ir entre 18 y 65. Dejamos un margen editorial
// arriba y abajo para que los puntos no choquen contra los bordes.
const S_Y_MIN = 18, S_Y_MAX = 68;

// Slider temporal — mismos parámetros que el marimekko para que play se
// sienta consistente entre los dos charts.
const S_SLIDER_INTERVAL_MS = 320;  // ~5 segundos para 16 años (2010-2025)

// Países priority NO-Latam (anclas globales). Solo se usan como Tier 0
// cuando el lector hace hover sobre una región (su región hovered marca
// Tier 0 para sus anclas; el resto de la región es Tier 1). Por default
// (sin hover) solo se etiqueta Latam, ver labelTargets en drawScatter.
const S_PRIORITY_NONLATAM = new Set([
  'USA', 'DEU', 'FRA', 'GBR', 'ESP', 'ITA',
  'RUS', 'CHN', 'JPN', 'KOR', 'IND'
]);

// Sub-prioridad dentro de Latam para el placement greedy: los 5 grandes
// se colocan primero (subPriority 0), el resto de la región después (99).
const S_LATAM_BIG_FIVE = new Set(['ARG', 'BRA', 'MEX', 'COL', 'CHL']);

// "Latam puro" — el subset de la región WB "Latin America & Caribbean" que
// editorialmente queremos etiquetar por default. Excluye todo el Caribe
// (anglófono, holandés y francófono no-Haití): Bahamas, Antigua, Barbados,
// Belice, Granada, Guyana, Jamaica, Santa Lucía, Surinam, Trinidad y
// Tobago, etc. Incluye HTI y DOM y CUB porque son hispanoparlantes / parte
// del foco editorial de El Atlas. Mismo criterio que el N°1.
// Los países NO en este set siguen visibles como puntos coloreados — solo
// se excluyen del label pool default. Si el usuario los selecciona vía
// search/click, la etiqueta aparece igual.
const S_LATAM_PURE_CODES = new Set([
  'ARG', 'BOL', 'BRA', 'CHL', 'COL', 'CRI', 'CUB', 'DOM',
  'ECU', 'GTM', 'HND', 'HTI', 'MEX', 'NIC', 'PAN', 'PER',
  'PRY', 'SLV', 'URY', 'VEN'
]);

// Tamaño visual de los puntos.
//   - Latam: r=5px, opacity 0.92, stroke dark — protagonista.
//   - Resto: r=3.8px, opacity 0.7, stroke white — contexto.
//   - Seleccionado: r=7px, opacity 1, stroke dark más grueso.
const S_POINT_R_LATAM = 5;
const S_POINT_R_OTHER = 3.5;     // igual que N°3 (con ptScale 1.8 → 6.3px)
const S_POINT_R_SELECTED = 6.5;  // igual que N°3 (con ptScale 1.8 → 11.7px)

const S_SVG_NS = 'http://www.w3.org/2000/svg';
const s_ns = (tag) => document.createElementNS(S_SVG_NS, tag);

// =================== Helpers ===================
// Devuelve el nombre del país en el idioma activo. Fallback al name que
// venga del dataset si el iso3 no está cargado.
function s_displayName(d) {
  return (COUNTRY_NAMES[d.code]?.[LANG]) || d.name;
}

// Helper: medir ancho de texto reusando un canvas en memoria.
function s_measureText(text, fontSize, weight) {
  if (!s_measureText._ctx) {
    s_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  s_measureText._ctx.font = `${weight || 500} ${fontSize}px "Source Sans 3", sans-serif`;
  return s_measureText._ctx.measureText(text).width;
}

// =================== Regresión ===================
// OLS lineal client-side: y = a + b * x. Usado para el modo Gini original
// (los coefs precomputados son solo para gini_adj). Devuelve {a, b, r2}.
function s_ols(points) {
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
    ssRes += (points[i].y - yp) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a, b, r2 };
}

// OLS cuadrática: y = a + b·x + c·x². Resolución de las normal equations
// 3×3 a mano (sin libs). Suficientemente estable para los rangos de PIB
// que manejamos (ln(gdp_pc) ≈ 6 a 12).
function s_quadFit(points) {
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
  // Sistema:
  // [ n   sx   sx2 ] [a]   [sy  ]
  // [ sx  sx2  sx3 ] [b] = [sxy ]
  // [ sx2 sx3  sx4 ] [c]   [sx2y]
  // Resolución por Cramer con det 3×3.
  const M = [
    [n,   sx,  sx2],
    [sx,  sx2, sx3],
    [sx2, sx3, sx4]
  ];
  const det = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
  - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
  + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M);
  if (Math.abs(D) < 1e-12) return null;
  const Ma = [[sy, sx, sx2], [sxy, sx2, sx3], [sx2y, sx3, sx4]];
  const Mb = [[n, sy, sx2], [sx, sxy, sx3], [sx2, sx2y, sx4]];
  const Mc = [[n, sx, sy], [sx, sx2, sxy], [sx2, sx3, sx2y]];
  const a = det(Ma) / D;
  const b = det(Mb) / D;
  const c = det(Mc) / D;
  // r²
  const my = sy / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = points[i].x, y = points[i].y;
    const yp = a + b * x + c * x * x;
    ssTot += (y - my) ** 2;
    ssRes += (y - yp) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { a, b, c, r2 };
}

// Calcula los residuos por región (promedio en pp y promedio en %) dado
// un set de puntos {region, yReal, yPred}. Usado para el modo raw donde
// no podemos usar los precomputados.
function s_computeRegionalResiduals(points) {
  const byReg = {};
  points.forEach(p => {
    if (!byReg[p.region]) byReg[p.region] = { sumPp: 0, sumPct: 0, n: 0 };
    const r = byReg[p.region];
    r.sumPp += (p.yReal - p.yPred);
    r.sumPct += p.yPred === 0 ? 0 : ((p.yReal - p.yPred) / p.yPred) * 100;
    r.n++;
  });
  const pp = {}, pct = {};
  Object.entries(byReg).forEach(([reg, r]) => {
    pp[reg] = r.n === 0 ? 0 : r.sumPp / r.n;
    pct[reg] = r.n === 0 ? 0 : r.sumPct / r.n;
  });
  return { residuals_pp: pp, residuals_pct: pct };
}

// =================== Modelo activo ===================
// Devuelve la estructura de regresión usada por el año/modo/modelo
// activos: { a, b[, c], r2, residuals_pp, residuals_pct, n, yKey, predict }.
//   - Si modo='adj', usamos los precomputados de data-scatter.js (rápido,
//     consistente con lo que vamos a publicar).
//   - Si modo='raw', recalculamos sobre gini_raw.
function s_buildModel(year, mode, regression) {
  const snap = DATA_SCATTER.data_by_year[year];
  if (!snap) return null;
  const yKey = mode === 'raw' ? 'gini_raw' : 'gini_adj';

  // Filtrar puntos válidos: gdp_pc > 0 (necesitamos ln) y gini definido.
  const pts = snap.points.filter(p => p.gdp_pc > 0 && p[yKey] != null);
  const n = pts.length;

  if (mode === 'adj') {
    // Usamos los coefs precomputados (modelo = ln(gdp_pc) → gini_adj).
    const reg = snap[regression];
    if (!reg) return null;
    const predict = regression === 'linear'
      ? (gdp) => reg.a + reg.b * Math.log(gdp)
      : (gdp) => { const x = Math.log(gdp); return reg.a + reg.b * x + reg.c * x * x; };
    return {
      ...reg,
      n,
      yKey,
      predict,
      regression
    };
  }

  // Modo raw: ajustar client-side sobre gini_raw.
  const xy = pts.map(p => ({ x: Math.log(p.gdp_pc), y: p[yKey], region: p.region }));
  let reg;
  if (regression === 'linear') {
    reg = s_ols(xy);
  } else {
    reg = s_quadFit(xy);
  }
  if (!reg) return null;
  const predict = regression === 'linear'
    ? (gdp) => reg.a + reg.b * Math.log(gdp)
    : (gdp) => { const x = Math.log(gdp); return reg.a + reg.b * x + reg.c * x * x; };

  // Residuos por región (promedio en pp y %).
  const withPred = pts.map(p => ({
    region: p.region,
    yReal: p[yKey],
    yPred: predict(p.gdp_pc)
  }));
  const { residuals_pp, residuals_pct } = s_computeRegionalResiduals(withPred);

  return {
    a: reg.a, b: reg.b, c: reg.c,
    r2: reg.r2,
    residuals_pp, residuals_pct,
    n, yKey, predict,
    regression
  };
}

// =================== Subtítulo dinámico ===================
// Latam residuo % positivo → "más desigual"; negativo → "menos desigual".
// El residuo se reporta como entero (sin decimales) — el lector no precisa
// 17,3% vs 17%; el % es de por sí ruidoso entre años.
function s_updateSubtitle(model) {
  const el = document.querySelector('.chart-block[data-chart="2"] .chart-subtitle');
  if (!el || !model) return;
  const latamPct = model.residuals_pct?.['Latin America & Caribbean'];
  if (latamPct == null) {
    el.textContent = '';
    return;
  }
  const isMore = latamPct >= 0;
  const tplKey = isMore ? 'c2-subtitle-tpl-more' : 'c2-subtitle-tpl-less';
  const tpl = I18N[LANG][tplKey] || '';
  el.textContent = tpl.replace('{N}', Math.round(Math.abs(latamPct)));
}

// =================== Banner regional ===================
// [N: 162]  [R²: 0.208]  [Residuo Latam: +13.9%]
// La región mostrada es la del hoverRegion (si hay), si no, Latam.
function s_updateBanner(model) {
  const el = document.getElementById('s-banner');
  if (!el || !model) return;
  const hoverReg = state[2].hoverRegion;
  const reg = hoverReg || 'Latin America & Caribbean';
  const regPct = model.residuals_pct?.[reg];
  const regLabel = t('reg.' + reg);
  const regColor = REGION_WB_LABEL_COLORS[reg] || '#444';
  const sign = regPct == null ? '' : (regPct >= 0 ? '+' : '');
  const pctStr = regPct == null ? '—' : `${sign}${regPct.toFixed(1)}%`;

  el.innerHTML = `
    <span class="s-banner-item"><span class="s-banner-key">${t('c2-banner-n')}</span><span class="s-banner-val">${model.n}</span></span>
    <span class="s-banner-sep">·</span>
    <span class="s-banner-item"><span class="s-banner-key">${t('c2-banner-r2')}</span><span class="s-banner-val">${model.r2.toFixed(3)}</span></span>
    <span class="s-banner-sep">·</span>
    <span class="s-banner-item s-banner-region"><span class="s-banner-key">${t('c2-banner-region')}</span><span class="s-banner-region-name" style="color:${regColor}">${regLabel}</span><span class="s-banner-val">${pctStr}</span></span>
  `;
}

// =================== Escalas ===================
// xScale: si log, mapea ln(gdp) (interno) a píxeles. Si lineal, mapea gdp
// directo a píxeles. La regresión SIEMPRE está expresada en ln(gdp), eso
// no cambia con la escala del eje — solo la representación visual.
function s_makeScales(scaleX) {
  // xMin: $600 (Burundi histórico cerca de ahí). xMax dinámico al múltiplo
  // de 10k superior al máximo del dataset entero (no del año), para que el
  // dominio sea estable entre años (no salta cada vez que cambia un país).
  const xMinRaw = 600;
  // Calculamos xMax fijo recorriendo todos los años (más estable que por año).
  let xMaxRaw = 0;
  Object.values(DATA_SCATTER.data_by_year).forEach(snap => {
    snap.points.forEach(p => { if (p.gdp_pc > xMaxRaw) xMaxRaw = p.gdp_pc; });
  });
  xMaxRaw = Math.ceil(xMaxRaw / 10000) * 10000;

  const xDomain = scaleX === 'log'
    ? [Math.log10(xMinRaw), Math.log10(xMaxRaw)]
    : [0, xMaxRaw];

  const xScale = (gdp) => {
    const v = scaleX === 'log' ? Math.log10(gdp) : gdp;
    return S_MARGIN.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * S_PLOT_W;
  };
  const yScale = (gini) =>
    S_MARGIN.top + S_PLOT_H - ((gini - S_Y_MIN) / (S_Y_MAX - S_Y_MIN)) * S_PLOT_H;

  return { xScale, yScale, xMinRaw, xMaxRaw, xDomain };
}

// =================== Label placement ===================
// Greedy: para cada candidato, intentar offset 1:30 (default). Si choca
// con un placed previo, probar cardinales (12/3/6/9) y NW. Si nada
// entra, descartar (la etiqueta no aparece pero el tooltip sigue al
// hover). Mucho más simple que el marimekko porque los puntos están
// dispersos (no en ranking lineal).
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

// items: [{cx, cy, text, textW, region, code, forced, subPriority}]
// forced=true (seleccionados): si nada entra, se fuerza el default igual.
function s_layoutLabels(items, plotBox) {
  // Orden de procesamiento:
  //   1. forced primero (selección > extremos).
  //   2. Dentro del resto, por subPriority ascendente — los Tier 0 (anclas
  //      de la región hovered, o los 5 grandes de Latam por default) van
  //      antes que los Tier 1 (resto de la región).
  //   3. Como desempate, X decreciente (los de más PIB primero) — los
  //      países ricos suelen estar en la zona más densa.
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
      // Último recurso: usar default aunque pise. Solo para seleccionados.
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

// Caja real de un label colocado, según su anchor + ancho medido + alto de
// fuente (labelH). Usado por s_relaxLabels y las líneas guía — necesitan la
// huella REAL del texto grande, no la del s_buildLabelRect (calibrado para
// fuente chica). Portado de N°3.
function s_labelBox(l, labelH) {
  let x1, x2;
  if (l.anchor === 'start')      { x1 = l.lx;             x2 = l.lx + l.textW; }
  else if (l.anchor === 'end')   { x1 = l.lx - l.textW;   x2 = l.lx; }
  else                           { x1 = l.lx - l.textW/2; x2 = l.lx + l.textW/2; }
  const y1 = l.ly - labelH * 0.78, y2 = l.ly + labelH * 0.22;
  return { x1, x2, y1, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

// Relajación anti-colisión 2D + repulsión de puntos (portado de N°3). Tras el
// placement greedy, en formatos grandes los labels caen apiñados y encima de
// sus puntos; esto empuja cada par solapado por su eje de menor solape y aleja
// cada label de los puntos (obstacles).
function s_relaxLabels(placed, labelH, plotBox, passes, obstacles) {
  const PAD = 8; const PT_PAD = 4;
  for (let p = 0; p < passes; p++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = s_labelBox(placed[i], labelH);
        const b = s_labelBox(placed[j], labelH);
        const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + PAD;
        const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + PAD;
        if (ox > 0 && oy > 0) {
          if (oy <= ox) { const push = oy/2;
            if (a.cy <= b.cy) { placed[i].ly -= push; placed[j].ly += push; }
            else              { placed[i].ly += push; placed[j].ly -= push; }
          } else { const push = ox/2;
            if (a.cx <= b.cx) { placed[i].lx -= push; placed[j].lx += push; }
            else              { placed[i].lx += push; placed[j].lx -= push; }
          }
          moved = true;
        }
      }
    }
    if (obstacles && obstacles.length) {
      for (let i = 0; i < placed.length; i++) {
        const a = s_labelBox(placed[i], labelH);
        for (let k = 0; k < obstacles.length; k++) {
          const ob = obstacles[k];
          const nx = Math.max(a.x1, Math.min(ob.x, a.x2));
          const ny = Math.max(a.y1, Math.min(ob.y, a.y2));
          const R = ob.r + PT_PAD;
          const d = Math.hypot(nx - ob.x, ny - ob.y);
          if (d < R) { const overlap = R - d;
            let ux = a.cx - ob.x, uy = a.cy - ob.y;
            const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
            placed[i].lx += ux * overlap; placed[i].ly += uy * overlap;
            moved = true;
          }
        }
      }
    }
    if (!moved) break;
  }
  const up = labelH * 0.78, dn = labelH * 0.22;
  placed.forEach(l => {
    l.ly = Math.max(plotBox.y1 + up, Math.min(plotBox.y2 - dn, l.ly));
    if (l.anchor === 'start')    l.lx = Math.max(plotBox.x1, Math.min(plotBox.x2 - l.textW, l.lx));
    else if (l.anchor === 'end') l.lx = Math.max(plotBox.x1 + l.textW, Math.min(plotBox.x2, l.lx));
    else                         l.lx = Math.max(plotBox.x1 + l.textW/2, Math.min(plotBox.x2 - l.textW/2, l.lx));
  });
}

// =================== Render principal ===================
function drawScatter() {
  const svg = document.getElementById('chart2');
  if (!svg) return;
  svg.innerHTML = '';

  // Editor sidebar: leemos config si el panel está activo. Overrides:
  //   - SIZES (font-sizes desktop).
  //   - Texts (título, subtítulo, caption editorial).
  //   - Countries: lista que se etiqueta SIEMPRE (reemplazando el priority
  //     de Latam puro + non-Latam globales). Si está, prevalece sobre la
  //     lógica hover/default.
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg?.sizes;
  const aeCountries = (aeCfg?.countries && aeCfg.countries.length > 0)
    ? new Set(aeCfg.countries) : null;

  // Decidir dimensiones según el formato del editor (si está activo) o
  // según el viewport del browser (sin editor activo). Cuando hay format:
  // viewBox de PNG_FORMATS[format] + margins de s_getMargins(format). El
  // PNG export rasteriza exactamente esto. WYSIWYG.
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
  // Aplicar/quitar wrapper CSS según el formato del editor.
  if (typeof applyFormatWrapper === 'function') {
    applyFormatWrapper(svg, editorFormat);
  }

  // Font sizes en unidades SVG. En mobile interactivo el SVG se renderea
  // a ~412px de ancho efectivo (factor ≈0.375 sobre viewBox 1100), así que
  // multiplicamos los tamaños desktop por ~3 para que en pantalla queden
  // en 9-13px. Aplicados inline (atributo font-size) sobrescriben los
  // valores de los CSS classes.
  //
  // Cuando el editor está activo con un formato, el SVG se ve en pantalla
  // con el aspect ratio del formato (gracias al wrapper aspect-ratio CSS)
  // y los sizes son los pineados de newsletter/square/mobilePng/public.
  // WYSIWYG: lo que ves es lo que el PNG rasteriza.
  // El bucket "special" del editor en este chart aplica al BANNER (cifras
  // N / R² / Residuo). El banner es HTML, así que su font-size se aplica
  // en s_applyEditorOverrides via inline style — no en SIZES (que es SVG).
  const SIZES = newsletter
    ? { tick: 18, axisTitle: 19, label: 17 }
    : square
    ? { tick: 22, axisTitle: 26, label: 26 }
    : mobilePng
    ? { tick: 28, axisTitle: 30, label: 24 }
    : mobile
    ? { tick: 32, axisTitle: 34, label: 28 }
    : {
        tick:      aeSizes?.ticks     ?? 11,
        axisTitle: aeSizes?.axisTitle ?? 11.5,
        label:     aeSizes?.labels    ?? 10.5
      };

    // Mobile-first: agrandar los puntos en los formatos PNG (×1.8 en cuadrado,
    // ×2 en mobile), igual que N°3 — si no, quedan diminutos al verse a ⅓.
    const ptScale = (square || newsletter) ? 1.8 : (mobilePng || mobile) ? 2.0 : 1;
    // Formato grande (PNG mobile-first): gatea relajación de labels + líneas
    // guía + halo grueso, dejando el render desktop interactivo intacto.
    const bigFmt = newsletter || square || mobilePng || mobile;

  const s2 = state[2];
  const year = String(s2.year);
  const mode = s2.mode;                 // 'raw' | 'adj'
  const regression = s2.regression;     // 'linear' | 'quadratic'
  const scaleX = s2.scaleX;             // 'log' | 'linear'

  const model = s_buildModel(year, mode, regression);
  if (!model) return;

  const yKey = model.yKey;
  const snap = DATA_SCATTER.data_by_year[year];
  const pts = snap.points.filter(p => p.gdp_pc > 0 && p[yKey] != null);

  const { xScale, yScale, xMinRaw, xMaxRaw } = s_makeScales(scaleX);

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

  const xTicksRaw = scaleX === 'log'
    ? niceLog10Ticks(xMinRaw, xMaxRaw)
    : niceLinearTicks(0, xMaxRaw);
  xTicksRaw.forEach(v => {
    const x = xScale(v);
    if (x < S_MARGIN.left - 1 || x > S_MARGIN.left + S_PLOT_W + 1) return;
    const line = s_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', S_MARGIN.top); line.setAttribute('y2', S_MARGIN.top + S_PLOT_H);
    line.setAttribute('class', 's-grid-line');
    gridG.appendChild(line);
    const lbl = s_ns('text');
    lbl.setAttribute('x', x);
    // En viewports con ticks grandes (mobile / mobilePng) más espacio bajo
    // el axis-line; en desktop/newsletter/square 18px alcanza.
    const xTickGap = mobile ? 44 : mobilePng ? 38 : 18;
    lbl.setAttribute('y', S_MARGIN.top + S_PLOT_H + xTickGap);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px';  // INLINE (no atributo): la clase .s-tick lo pisaría
    lbl.textContent = fmtTickGDP(v);
    axisG.appendChild(lbl);
  });

  // === Grid + ticks Y ===
  const yTicks = niceLinearTicks(S_Y_MIN, S_Y_MAX, 6);
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
    lbl.style.fontSize = SIZES.tick + 'px';  // INLINE (no atributo): la clase .s-tick lo pisaría
    lbl.textContent = Math.round(v);
    axisG.appendChild(lbl);
  });

  // === Ejes (líneas finas en y=ymax y x=xmin) ===
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
  // En mobile el axis-title queda ~70px arriba del fondo del viewBox
  // para evitar que el banner HTML lo tape; en desktop, 14px de margen.
  // Position del axis-x title: en viewports altos (mobile / mobilePng)
  // separamos del fondo del viewBox para que el banner HTML no lo tape.
  const xTitleY = mobile ? S_H - 70 : mobilePng ? S_H - 60 : S_H - 14;
  xT.setAttribute('y', xTitleY);
  xT.setAttribute('text-anchor', 'middle');
  xT.style.fontSize = SIZES.axisTitle + 'px';  // INLINE: la clase .s-axis-title lo pisaría
  // Editor: si hay axisX/Y custom no vacíos, los aplicamos. Si no, default
  // del i18n key (que cambia con el toggle scaleX o mode).
  const customAxisX = (aeCfg?.texts?.[LANG]?.axisX || '').trim();
  const customAxisY = (aeCfg?.texts?.[LANG]?.axisY || '').trim();
  xT.textContent = customAxisX
    || (scaleX === 'log' ? t('c2-axis-x-log') : t('c2-axis-x-linear'));
  svg.appendChild(xT);

  const yT = s_ns('text');
  yT.setAttribute('class', 's-axis-title');
  yT.setAttribute('x', -(S_MARGIN.top + S_PLOT_H / 2));
  // En mobile el yT rotado necesita más espacio a la izquierda porque
  // los ticks Y son ~3× más anchos. Lo posicionamos a 32px del borde
  // izquierdo del viewBox (vs 16 en desktop).
  yT.setAttribute('y', (mobile || mobilePng) ? 36 : 16);
  yT.setAttribute('transform', 'rotate(-90)');
  yT.setAttribute('text-anchor', 'middle');
  yT.style.fontSize = SIZES.axisTitle + 'px';  // INLINE: la clase .s-axis-title lo pisaría
  yT.textContent = customAxisY
    || (mode === 'raw' ? t('c2-axis-y-raw') : t('c2-axis-y-adj'));
  svg.appendChild(yT);

  // === Línea de regresión ===
  // Generamos un path con muchos puntos sobre el rango visible. La curva
  // se dibuja en gini-space, pero su X visible depende de la escala
  // (log o lineal): si lineal, las muestras siguen apareciendo curvadas
  // porque el modelo es en ln(gdp), pero el eje es lineal.
  const regPath = s_ns('path');
  regPath.setAttribute('class', 's-regression');
  regPath.setAttribute('stroke', 'var(--regression)');
  regPath.setAttribute('stroke-width', 1.5);
  regPath.setAttribute('stroke-opacity', 0.55);
  regPath.setAttribute('fill', 'none');
  regPath.setAttribute('stroke-dasharray', '5 3');
  const N_SAMPLES = 220;
  const xLow = Math.log(xMinRaw), xHigh = Math.log(xMaxRaw);
  let d = '';
  for (let i = 0; i <= N_SAMPLES; i++) {
    const t01 = i / N_SAMPLES;
    const lnGdp = xLow + t01 * (xHigh - xLow);
    const gdp = Math.exp(lnGdp);
    const yPred = model.predict(gdp);
    if (yPred < S_Y_MIN - 8 || yPred > S_Y_MAX + 8) {
      // Recorta el path cuando se sale verticalmente — evitamos colas
      // erráticas de la cuadrática fuera del rango razonable.
      continue;
    }
    const px = xScale(gdp), py = yScale(yPred);
    d += (d ? ' L ' : 'M ') + px.toFixed(2) + ' ' + py.toFixed(2);
  }
  regPath.setAttribute('d', d);
  regPath.setAttribute('clip-path', `url(#${clipId})`);
  svg.appendChild(regPath);

  // === Puntos ===
  const hoverReg = s2.hoverRegion;
  const selectedSet = new Set(s2.selectedCountries || []);
  // activeRegions: filtro visual. Por default contiene TODAS las regiones.
  // El click en chip toggle pertenencia. NO recalcula regresión/residuos
  // (esos son sobre el dataset completo del año).
  const activeRegions = s2.activeRegions;

  const ptsG = s_ns('g');
  ptsG.setAttribute('clip-path', `url(#${clipId})`);
  svg.appendChild(ptsG);

  // Filtramos por activeRegions, pero MANTENEMOS los seleccionados aunque
  // su región esté deselectada (la selección manual prevalece). También
  // dejamos pasar la región hovered (preview por hover anula filtro).
  const drawables = pts.filter(d =>
    activeRegions.has(d.region) || selectedSet.has(d.code) || d.region === hoverReg
  );

  // Orden de dibujo:
  //   - Hover region: las de esa región arriba.
  //   - Latam siempre algo arriba (protagonista del Atlas).
  //   - Seleccionados al final (encima de todo).
  const ordered = drawables.slice().sort((a, b) => {
    const score = (d) => {
      let s = 0;
      if (d.region === 'Latin America & Caribbean') s += 1;
      if (hoverReg && d.region === hoverReg) s += 5;
      if (selectedSet.has(d.code)) s += 10;
      return s;
    };
    return score(a) - score(b);
  });

  const tooltip = document.getElementById('tooltip2');

  ordered.forEach(d => {
    const cx = xScale(d.gdp_pc);
    const cy = yScale(d[yKey]);
    const isLatam = d.region === 'Latin America & Caribbean';
    const isHovered = hoverReg && d.region === hoverReg;
    const isSelected = selectedSet.has(d.code);
    const hasHover = !!hoverReg;
    const isDimmed = hasHover && !isHovered && !isSelected;

    let r, fillOp, stroke, strokeW;
    if (isSelected) {
      r = S_POINT_R_SELECTED * ptScale; fillOp = 1;    stroke = '#1A1A1A'; strokeW = 1.3;
    } else if (isHovered) {
      // Hover sobre chip de región: los puntos de esa región se agrandan.
      r = 6;                  fillOp = 0.95; stroke = '#1A1A1A'; strokeW = 0.9;
    } else if (isLatam) {
      r = S_POINT_R_LATAM * ptScale;    fillOp = 0.92; stroke = '#1A1A1A'; strokeW = 0.7;
    } else {
      r = S_POINT_R_OTHER * ptScale;    fillOp = 0.7;  stroke = 'white';   strokeW = 0.5;
    }

    const c = s_ns('circle');
    c.setAttribute('class', 's-point' + (isDimmed ? ' s-dim' : '') + (isSelected ? ' s-selected' : ''));
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', REGION_WB_COLORS[d.region] || '#888');
    c.setAttribute('fill-opacity', fillOp);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', strokeW);
    c.dataset.code = d.code;
    c.dataset.region = d.region;

    // Tooltip
    c.addEventListener('mouseenter', (e) => s_showTooltip(e, d, model, tooltip));
    c.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
    c.addEventListener('mousemove', (e) => s_positionTooltip(e, tooltip));
    // Click: toggle selección. stopPropagation para no limpiar la
    // selección con el click handler del SVG (no hay tal handler acá,
    // pero por las dudas si lo agregamos después).
    c.addEventListener('click', (ev) => {
      ev.stopPropagation();
      s_toggleCountrySelection(d.code);
    });

    ptsG.appendChild(c);
  });

  // === Labels ===
  // Universo de etiquetas:
  //   - Seleccionados (forced=true): siempre, aunque la región esté
  //     filtrada (la selección manual prevalece).
  //   - Extremos del año actual: max y min Gini sobre el yKey activo,
  //     sobre el dataset visible (filtrado por activeRegions).
  //   - Sin hover: SOLO Latam. Big Five (ARG/BRA/MEX/COL/CHL) son
  //     subPriority 0 (entran primero); resto de Latam subPriority 99.
  //   - Con hover sobre región: la región hovered. Anclas globales
  //     (USA/DEU/.../IND) que caigan en esa región son subPriority 0;
  //     resto de la región subPriority 1. (Si la región hovered es
  //     Latam, queda igual que el default.)
  //
  // IMPORTANTE: los extremos se calculan sobre los puntos VISIBLES (no
  // sobre el dataset completo) — si filtraste Africa, el "más desigual"
  // visible puede ser otro. Si no hay nada visible, no hay extremos.
  const plotBox = {
    x1: S_MARGIN.left + 1,
    y1: S_MARGIN.top + 1,
    x2: S_MARGIN.left + S_PLOT_W - 1,
    y2: S_MARGIN.top + S_PLOT_H - 1
  };

  // Universo de puntos donde buscamos labels (los dibujados = drawables).
  const labelPool = drawables;

  // Extremos sobre el labelPool actual.
  let extremeMax = null, extremeMin = null;
  if (labelPool.length > 0) {
    extremeMax = labelPool.reduce((acc, p) => p[yKey] > acc[yKey] ? p : acc, labelPool[0]);
    extremeMin = labelPool.reduce((acc, p) => p[yKey] < acc[yKey] ? p : acc, labelPool[0]);
  }

  const labelItems = [];
  const seenCodes = new Set();
  function addLabelItem(d, forced, subPriority) {
    if (seenCodes.has(d.code)) return;
    seenCodes.add(d.code);
    const text = s_displayName(d);
    const isSel = selectedSet.has(d.code);
    // Medimos a SIZES.label para que el layout (gaps/colisión) use el
    // ancho real del texto en pantalla. En mobile (font 28) los textos
    // son ~3× más anchos, así que el greedy descarta más overlaps.
    const textW = s_measureText(text, SIZES.label, isSel ? 600 : 500) + 2;
    labelItems.push({
      cx: xScale(d.gdp_pc),
      cy: yScale(d[yKey]),
      text,
      textW,
      region: d.region,
      code: d.code,
      forced: forced || isSel,
      isSelected: isSel,
      subPriority: subPriority ?? 99
    });
  }

  // Seleccionados primero (forced). Buscan en pts (no labelPool) porque la
  // selección persiste aunque la región esté deselectada por filtro.
  selectedSet.forEach(code => {
    const d = pts.find(p => p.code === code);
    if (d) addLabelItem(d, true, 0);
  });
  // Extremos del año (sobre puntos visibles).
  if (extremeMax) addLabelItem(extremeMax, true, 0);
  if (extremeMin) addLabelItem(extremeMin, true, 0);

  // Editor: lista explícita de iso3 a etiquetar (en addition a selección y
  // extremos). Cuando el editor define countries, REEMPLAZAMOS la lógica
  // default (Latam puro + non-Latam globales). El hover sigue agregando
  // su región si está activo (no excluyente).
  if (aeCountries && aeCountries.size > 0) {
    aeCountries.forEach(code => {
      const d = pts.find(p => p.code === code);
      if (d) addLabelItem(d, true, 0);
    });
  } else if (hoverReg) {
    // Modo hover-región: etiquetar países de ESA región. Dentro de la
    // región, las anclas globales hardcoded (USA, DEU, etc.) son Tier 0;
    // el resto es Tier 1. Si la región hovered ES Latam, Big Five sigue
    // siendo Tier 0 dentro de Latam y se aplica el filtro editorial
    // "Latam puro" (Caribe queda fuera).
    const isLatamHover = hoverReg === 'Latin America & Caribbean';
    labelPool.filter(p => p.region === hoverReg).forEach(p => {
      if (isLatamHover && !S_LATAM_PURE_CODES.has(p.code)) return;
      let sub;
      if (isLatamHover) {
        sub = S_LATAM_BIG_FIVE.has(p.code) ? 0 : 99;
      } else {
        sub = S_PRIORITY_NONLATAM.has(p.code) ? 0 : 1;
      }
      addLabelItem(p, false, sub);
    });
  } else {
    // Sin hover: solo Latam puro (sin Caribe). Big Five subPriority 0,
    // resto de Latam puro 99. Si hay espacio el algoritmo greedy mete
    // otros Latams puros; los del Caribe siguen visibles como puntos
    // coloreados pero sin etiqueta.
    labelPool.filter(p => S_LATAM_PURE_CODES.has(p.code)).forEach(p => {
      const sub = S_LATAM_BIG_FIVE.has(p.code) ? 0 : 99;
      addLabelItem(p, false, sub);
    });
  }

  const placed = s_layoutLabels(labelItems, plotBox);

  // En formatos grandes (PNG mobile-first) los labels caen apiñados y encima
  // de sus puntos. Relajación 2D + repulsión de puntos (portado de N°3).
  const ptR = (l) => (l.isSelected ? S_POINT_R_SELECTED : S_POINT_R_LATAM) * ptScale;
  if (bigFmt) {
    const obstacles = placed.map(l => ({ x: l.cx, y: l.cy, r: ptR(l) }));
    s_relaxLabels(placed, SIZES.label, plotBox, 260, obstacles);
  }

  // Halo grueso + weight: que el texto salte sobre puntos del mismo color.
  const labelHalo = bigFmt ? 6 : 2.5;
  const labelWeight = bigFmt ? 700 : null;

  // Líneas guía (estilo OWID): reconectan cada label corrido con su punto. Se
  // appendean ANTES de los labels para quedar por debajo.
  if (bigFmt) {
    const leaderG = s_ns('g'); svg.appendChild(leaderG);
    placed.forEach(l => {
      const B = s_labelBox(l, SIZES.label);
      const Px = l.cx, Py = l.cy, r = ptR(l);
      const nx = Math.max(B.x1, Math.min(Px, B.x2));
      const ny = Math.max(B.y1, Math.min(Py, B.y2));
      const dx = nx - Px, dy = ny - Py;
      const dist = Math.hypot(dx, dy);
      if (dist > r + 7) {
        const ux = dx / dist, uy = dy / dist;
        const line = s_ns('line');
        line.setAttribute('x1', Px + ux * r);
        line.setAttribute('y1', Py + uy * r);
        line.setAttribute('x2', nx - ux * 2);
        line.setAttribute('y2', ny - uy * 2);
        line.setAttribute('stroke', '#9a9488');
        line.setAttribute('stroke-width', 1.4);
        line.setAttribute('stroke-opacity', 0.7);
        line.setAttribute('stroke-linecap', 'round');
        leaderG.appendChild(line);
      }
    });
  }

  const labelsG = s_ns('g'); svg.appendChild(labelsG);
  placed.forEach(l => {
    const txt = s_ns('text');
    txt.setAttribute('class', 's-country-label' + (l.isSelected ? ' s-selected-label' : ''));
    txt.setAttribute('x', l.lx);
    txt.setAttribute('y', l.ly);
    txt.setAttribute('text-anchor', l.anchor);
    txt.setAttribute('fill', REGION_WB_LABEL_COLORS[l.region] || '#444');
    // INLINE (no atributo): la clase .s-country-label pisaría el font-size.
    txt.style.fontSize = SIZES.label + 'px';
    txt.style.stroke = 'var(--bg)';
    txt.style.strokeWidth = labelHalo + 'px';
    txt.style.paintOrder = 'stroke';
    txt.style.strokeLinejoin = 'round';
    if (labelWeight) txt.style.fontWeight = labelWeight;
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // === Click en zona vacía del SVG limpia tooltip ===
  // (no limpia selección — los chips son persistentes; para limpiar
  //  el usuario hace click en el × del chip.)
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') {
      tooltip.style.opacity = '0';
    }
  };

  // === Actualizar subtítulo dinámico y banner regional ===
  s_updateSubtitle(model);
  s_updateBanner(model);

  // Editor: aplicar font-size del bucket "special" al banner HTML, y los
  // textos editoriales (título/subtítulo/caption) si el usuario los editó.
  // Posterior a s_updateSubtitle/s_updateBanner para pisar lo dinámico.
  s_applyEditorOverrides(aeCfg, aeSizes);
}

// Pisa título/subtítulo/caption con valores del editor (si los hay) y
// aplica font-size del bucket "special" al banner regional HTML.
//
// Caption: si el editor lo dejó vacío (trim) → restauramos el default del
// i18n key c2-sources. Esto permite que el usuario "borre" un caption
// custom y vuelva al automático sin tener que limpiar localStorage.
function s_applyEditorOverrides(aeCfg, aeSizes) {
  // Font del banner (HTML): bucket "special" del editor. Aplicado inline
  // para sobreescribir el CSS class .s-banner (font-size: 13px).
  const banner = document.getElementById('s-banner');
  if (banner && aeSizes && typeof aeSizes.special === 'number') {
    banner.style.fontSize = aeSizes.special + 'px';
  }
  const docLang = typeof LANG !== 'undefined' ? LANG : 'es';
  const lang = aeCfg?.lang || docLang;
  const t = aeCfg?.texts?.[lang] || {};
  const block = document.querySelector('.chart-block[data-chart="2"]');
  if (!block) return;
  const customTitle    = (t.title    || '').trim();
  const customSubtitle = (t.subtitle || '').trim();
  const customCaption  = (t.caption  || '').trim();
  if (customTitle) {
    const el = block.querySelector('.chart-title');
    if (el) el.textContent = customTitle;
  }
  if (customSubtitle) {
    const el = block.querySelector('.chart-subtitle');
    if (el) el.textContent = customSubtitle;
  }
  const captionEls = document.querySelectorAll(
    '.footer p[data-i18n="c2-sources"], .footer details[class*="mobile-collapse"] p[data-i18n="c2-sources"]'
  );
  if (customCaption) {
    captionEls.forEach(el => { el.textContent = customCaption; });
  } else if (typeof I18N !== 'undefined' && I18N[docLang] && I18N[docLang]['c2-sources']) {
    captionEls.forEach(el => { el.innerHTML = I18N[docLang]['c2-sources']; });
  }
}

// =================== Tooltip ===================
function s_showTooltip(e, d, model, tooltip) {
  const yKey = model.yKey;
  const yPred = model.predict(d.gdp_pc);
  const residualPp = d[yKey] - yPred;
  const residualPct = yPred === 0 ? 0 : (residualPp / yPred) * 100;

  const regionLabel = t('reg.' + d.region);
  const regionColor = REGION_WB_COLORS[d.region] || '#888';
  const giniRawLabel = t('c2-tt-gini-raw');
  const giniAdjLabel = t('c2-tt-gini-adj');
  const signPp = residualPp >= 0 ? '+' : '';
  const signPct = residualPct >= 0 ? '+' : '';

  tooltip.innerHTML = `
    <strong>${s_displayName(d)}</strong>
    <div class="tt-region" style="color:${regionColor}">${regionLabel}</div>
    <div class="tt-row"><span>${t('c2-tt-year')}</span><span>${d.year}</span></div>
    <div class="tt-row"><span>${t('c2-tt-gdp')}</span><span>$${fmt(d.gdp_pc, 0)}</span></div>
    <div class="tt-row"><span>${giniRawLabel}</span><span>${d.gini_raw.toFixed(1)}</span></div>
    <div class="tt-row"><span>${giniAdjLabel}</span><span>${d.gini_adj.toFixed(1)}</span></div>
    <div class="tt-row"><span>${t('c2-tt-residual-pp')}</span><span>${signPp}${residualPp.toFixed(1)}</span></div>
    <div class="tt-row"><span>${t('c2-tt-residual-pct')}</span><span>${signPct}${residualPct.toFixed(1)}%</span></div>
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

// =================== Legend (chips de región) ===================
// Doble interacción (estilo N°1):
//   - Hover (solo desktop): preview de la región → banner + puntos
//     destacados + labels recompuestas. Cuando salís, vuelve al default.
//   - Click: TOGGLE filtro visual. activeRegions es un Set que arranca
//     con TODAS; click quita/agrega la región. Los chips quitados se
//     muestran con estilo .inactive (tachado, sin background). NO afecta
//     regresión / R² / banner.
function renderScatterLegend() {
  const container = document.querySelector('.m-legend[data-chart="2"]');
  if (!container) return;
  container.innerHTML = '';
  const activeRegions = state[2].activeRegions;
  REGION_WB_ORDER.forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'm-legend-chip';
    chip.dataset.region = region;
    const isActive = activeRegions.has(region);
    if (!isActive) chip.classList.add('inactive');
    chip.innerHTML = `
      <span class="m-legend-swatch" style="background:${REGION_WB_COLORS[region]}"></span>
      <span class="m-legend-label">${t('reg.' + region)}</span>
    `;
    // Hover solo en desktop. En mobile (touch) NO registramos
    // mouseenter/mouseleave porque el tap dispara mouseenter pero nunca
    // mouseleave, dejando el preview pegado.
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        state[2].hoverRegion = region;
        drawScatter();
      });
      chip.addEventListener('mouseleave', () => {
        state[2].hoverRegion = null;
        drawScatter();
      });
    }
    // Click = toggle filtro. Re-renderiza legend (para el estilo inactive)
    // y el scatter (para filtrar puntos).
    chip.addEventListener('click', () => {
      const s = state[2].activeRegions;
      if (s.has(region)) s.delete(region); else s.add(region);
      renderScatterLegend();
      drawScatter();
    });
    container.appendChild(chip);
  });
}

// =================== Slider con play ===================
function setupScatterSlider() {
  const slider = document.getElementById('s-slider');
  const playBtn = document.getElementById('s-play');
  const display = document.getElementById('s-year-display');
  if (!slider || !playBtn || !display) return;

  function updateDisplay() {
    display.textContent = state[2].year;
    slider.value = state[2].year;
  }
  updateDisplay();

  slider.addEventListener('input', () => {
    state[2].year = parseInt(slider.value, 10);
    updateDisplay();
    drawScatter();
  });

  let timer = null;
  function startPlay() {
    state[2].playing = true;
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', t('slider-pause'));
    timer = setInterval(() => {
      const next = state[2].year + 1;
      if (next > parseInt(slider.max, 10)) {
        stopPlay();
        return;
      }
      state[2].year = next;
      updateDisplay();
      drawScatter();
    }, S_SLIDER_INTERVAL_MS);
  }
  function stopPlay() {
    state[2].playing = false;
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', t('slider-play'));
    if (timer) { clearInterval(timer); timer = null; }
  }

  playBtn.addEventListener('click', () => {
    if (state[2].playing) stopPlay();
    else {
      if (state[2].year >= parseInt(slider.max, 10)) {
        state[2].year = parseInt(slider.min, 10);
        updateDisplay();
        drawScatter();
      }
      startPlay();
    }
  });
}

// =================== Toggles ===================
// Tres toggles: modelo (linear/quadratic), gini (raw/adj), scale-x (log/linear).
// Cada uno tiene su .m-mode-toggle con data-toggle="model" | "gini" | "scaleX".
function setupScatterToggles() {
  document.querySelectorAll('.m-mode-toggle[data-toggle]').forEach(toggle => {
    const kind = toggle.dataset.toggle;
    toggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (kind === 'model') {
          state[2].regression = btn.dataset.model;
        } else if (kind === 'gini') {
          state[2].mode = btn.dataset.mode;
        } else if (kind === 'scaleX') {
          state[2].scaleX = btn.dataset.scale;
        }
        drawScatter();
      });
    });
  });
}

// =================== Buscador + chips ===================
// Mismo patrón que el marimekko. Search es case- y acento-insensitive.

function s_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function s_searchableCountries() {
  // Lista única de países en TODOS los años (algunos países pueden aparecer
  // solo en años específicos por la ventana de 15 años).
  const seen = new Set();
  const list = [];
  Object.values(DATA_SCATTER.data_by_year).forEach(snap => {
    snap.points.forEach(d => {
      if (seen.has(d.code)) return;
      seen.add(d.code);
      list.push({ code: d.code, name: s_displayName(d), region: d.region });
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, LANG));
}

function s_toggleCountrySelection(code) {
  const arr = state[2].selectedCountries;
  const idx = arr.indexOf(code);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(code);
  renderScatterSelectedChips();
  drawScatter();
}

function renderScatterSelectedChips() {
  const container = document.getElementById('s-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  state[2].selectedCountries.forEach(code => {
    // Para sacar el color de la región del país, buscamos cualquier
    // muestra del país en el dataset (la región es estable año a año).
    let sample = null;
    for (const snap of Object.values(DATA_SCATTER.data_by_year)) {
      const found = snap.points.find(d => d.code === code);
      if (found) { sample = found; break; }
    }
    if (!sample) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = REGION_WB_COLORS[sample.region] || '#888';
    chip.textContent = (COUNTRY_NAMES[code]?.[LANG]) || sample.name;
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Remove');
    x.addEventListener('click', () => s_toggleCountrySelection(code));
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
      const isSel = state[2].selectedCountries.includes(c.code);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-code="${c.code}">${c.name}<span class="m-search-region">${t('reg-short.' + c.region) || ''}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => {
      el.addEventListener('click', () => {
        s_toggleCountrySelection(el.dataset.code);
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
      s_toggleCountrySelection(currentMatches[activeIdx].code);
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
// Dataset completo: todas las observaciones (país × año del slider).
// Cada fila es la observación que el snapshot del año t usaría para
// representar al país (last-observed Gini dentro de los 15 años previos).
// Hay duplicados de (iso3, year_dato) cuando un mismo punto se usa en
// múltiples años del slider; los preservamos porque cada uno tiene
// residuos calculados contra una regresión distinta (la del año del
// slider). Si Daniel quiere "observaciones únicas", filtraría en post.
function setupScatterDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rows = [];
      Object.entries(DATA_SCATTER.data_by_year).forEach(([yearSlider, snap]) => {
        snap.points.forEach(d => {
          rows.push({ ...d, year_slider: parseInt(yearSlider, 10) });
        });
      });
      // Orden estable: por iso3, después por año del slider.
      rows.sort((a, b) =>
        a.code.localeCompare(b.code) || a.year_slider - b.year_slider
      );

      const cols = [
        'iso3', 'country', 'region',
        'year_slider', 'year',
        'welfare', 'gini_raw', 'gini_adj',
        'gdp_pc', 'residual_linear', 'residual_quadratic'
      ];
      let csv = cols.join(',') + '\n';
      rows.forEach(d => {
        const row = [
          d.code,
          (COUNTRY_NAMES[d.code]?.en) || d.name,
          d.region,
          d.year_slider,
          d.year,
          d.welfare,
          d.gini_raw,
          d.gini_adj,
          d.gdp_pc,
          d.residual_linear,
          d.residual_quadratic
        ];
        csv += row.map(v => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          return v;
        }).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = LANG === 'en'
        ? 'the-atlas-02-gini-vs-gdp-observations.csv'
        : 'el-atlas-02-gini-vs-pib-observaciones.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

// =================== Hook PNG export ===================
// El png-export.js llama esto antes de rasterizar. Para el chart 2:
//   - Limpiamos cualquier hoverRegion del state visual (no se renderiza
//     en el clone, pero forzamos que el subtítulo del clone refleje el
//     residuo de Latam, sin importar el hover momentáneo).
//   - Ocultamos el tooltip si está visible.
//   - Pasamos los textos de país a canvas (canvasLabels) para garantizar
//     que la tipografía sea la correcta (mismo truco que el marimekko).
window.onBeforePngExport = (svgClone, chartId) => {
  if (chartId !== '2') return;
  const tooltip = document.getElementById('tooltip2');
  if (tooltip) tooltip.style.opacity = '0';

  // Pasamos las etiquetas de país a canvas — el contexto aislado del
  // <img> SVG rasterizado no resuelve bien las webfonts (Source Sans 3)
  // y los textos salen con tracking equivocado. Mismo truco que el chart 1.
  const canvasLabels = [];
  svgClone.querySelectorAll('text.s-country-label').forEach(el => {
    canvasLabels.push({
      x: parseFloat(el.getAttribute('x')),
      y: parseFloat(el.getAttribute('y')),
      text: el.textContent,
      fill: el.getAttribute('fill') || '#444',
      weight: el.classList.contains('s-selected-label') ? '600' : '500',
      size: 10.5,
      halo: '#FAF8F3',   // el bg crema, para que el texto se "destaque" sobre los puntos
      textAnchor: el.getAttribute('text-anchor') || 'start'
    });
    el.style.display = 'none';
  });

  return { canvasLabels };
};

// Hook adicional: el sourceText del PNG queda como el del HTML
// (c2-sources). No cambia con el modo/regresión activos — Daniel decidió
// que el caption del PNG explica el modelo general, no el snapshot.
// Si en el futuro queremos versiones específicas, las agregamos como
// 'c2-sources-raw' / 'c2-sources-adj' (igual al chart 1).
window.onBeforePngExportGetSourceText = (chartId) => {
  if (chartId !== '2') return null;
  const html = I18N[LANG]?.['c2-sources'];
  if (!html) return null;
  // Limpiar tags HTML del string (puede contener <em>, <strong>).
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent;
};

// =================== Init ===================
function initScatter() {
  const allRegions = new Set(REGION_WB_ORDER);
  if (!state[2]) {
    state[2] = {
      mode: 'adj',
      regression: 'linear',
      scaleX: 'log',
      year: DATA_SCATTER.latest_year || 2025,
      playing: false,
      hoverRegion: null,
      activeRegions: allRegions,
      selectedCountries: []
    };
  } else {
    // Defaults defensivos si el HTML sembró un state[2] parcial.
    if (state[2].mode == null)        state[2].mode = 'adj';
    if (state[2].regression == null)  state[2].regression = 'linear';
    if (state[2].scaleX == null)      state[2].scaleX = 'log';
    if (state[2].year == null)        state[2].year = DATA_SCATTER.latest_year || 2025;
    if (state[2].playing == null)     state[2].playing = false;
    if (state[2].hoverRegion == null) state[2].hoverRegion = null;
    if (!state[2].activeRegions)      state[2].activeRegions = allRegions;
    if (!state[2].selectedCountries)  state[2].selectedCountries = [];
  }
  renderScatterLegend();
  drawScatter();
  setupScatterSlider();
  setupScatterToggles();
  setupScatterSearch();
  renderScatterSelectedChips();
  setupScatterDownloadCSV();
  // Editor sidebar: re-render cuando el usuario edita textos/sizes/países.
  if (!initScatter._editorWired) {
    initScatter._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawScatter());
  }
  // Export PNG: soporta formatos (cuadrado por defecto) y se re-dibuja vía
  // drawScatter cuando el exportador fuerza un formato.
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawScatter;
  // Mobile (≤768px): botones tuerca + "Seleccionar". Singleton — si ya
  // lo llamó otro init en el index.html, no hace nada.
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
}
