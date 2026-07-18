// =============================================================
//  El Atlas N°3 — Chart 5: Trayectorias Elo de selecciones
// =============================================================
//
// Line chart: eje X = año, eje Y = puntaje Elo (toggle a posición en el
// ranking, invertido — 1° arriba). El lector arma su comparación con el
// buscador; cada país seleccionado es una línea de color distinto.
//
// LÓGICA DE COLOR — heredada del spaghetti del N°1 (timeseries.js):
//   - Paleta rotativa de 6 colores (TL_PALETTE), un slot por país
//     seleccionado. Al liberar un slot se reusa; pasados los 6 se cicla.
//   - state[5].selectedCountries: Map<iso3, colorIdx>.
//   ACÁ NO hay spaghetti de fondo (Daniel: "línea sin spaghetti"): solo se
//   dibujan las líneas seleccionadas. Sin selección, el plot queda con ejes.
//
// Toggle absoluto/ranking: en 'rank' el eje Y se invierte (1° arriba) y el
// dominio se autoajusta al peor puesto de los países visibles en el período.
//
// DATA: reutiliza DATA_ELO_PIB (data-elo-pib.js) — 184 países con
// elo:{año:valor} 1980-2026 + confed. El ranking por año se precomputa.
//
// Mobile-first PNG: este chart soporta re-render por formato del editor
// (square/newsletter/mobile) vía getActivePngFormat(); registra __atlas*.

//==================================================================
//  Constantes
//==================================================================
// Paleta rotativa para selección (copiada de lib/regions.js — el N°3 no carga
// esa lib, usa regions-fifa.js). 6 colores distintos del terracota
// protagonista, sin rojos/naranjas que compitan con CONMEBOL.
// Paleta rotativa de líneas. 6 hues base bien separados. Reemplaza a la del N°1
// (que tenía dos verdes — forest+teal — y dos morados/rojos — plum+burgundy —
// que con varias líneas juntas no se discernían).
const TL_PALETTE = [
  '#2B5C8A',  // azul cobalto
  '#5BA152',  // verde
  '#C9A227',  // oro / mostaza
  '#9A4FA8',  // violeta
  '#2BA0A8',  // turquesa / cian
  '#C0473A'   // rojo ladrillo
];

// Para MUCHAS líneas (>6) extendemos la paleta con VARIACIONES de luminosidad de
// cada hue (más oscuro / más claro / aún más oscuro), todas SÓLIDAS — estilo
// grilla de tintes de Excel. 24 colores únicos antes de repetir; más allá, el
// hover-aislado + las etiquetas de fin desambiguan. Orden por slot: primero los
// 6 bases, después la fila oscura, la clara, y la más oscura. (Generado con
// 03-futbol/data-sources/extpal — variar L sobre los 6 bases en HSL.)
const TL_PALETTE_EXT = [
  // Paleta estandar del Atlas (12 hues distintos, del chart 3 de N2). Norma multiserie.
  '#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
  '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'
];
function tl_colorForSlot(slot) {
  return TL_PALETTE_EXT[slot % TL_PALETTE_EXT.length];
}

const TL_YEAR_MIN = 1901;                  // la serie completa arranca en 1901
const TL_YEAR_MAX = 2026;
const TL_PERIOD_DEFAULT = [1980, 2026];    // ventana por default (no el rango total)
const TL_MIN_WINDOW = 5;                   // ventana mínima del slider (años)
const TL_MODE_DEFAULT = 'rank';            // 'rank' | 'elo'

// Selección default: Sudamérica vs Europa (cada país un color distinto).
// Arg/Bra (CONMEBOL) contra Francia/Alemania (UEFA). El orden define el
// colorIdx inicial (0..3 de TL_PALETTE).
const TL_DEFAULT_SELECTION = ['ARG', 'BRA', 'FRA', 'DEU'];

// Dimensiones por formato. El right margin es generoso porque las etiquetas
// de fin de línea (nombres de país) van ahí.
const TL_W_DESKTOP = 1100, TL_H_DESKTOP = 520;
const TL_W_MOBILE  = 1100, TL_H_MOBILE  = 1000;
const TL_MARGIN_DESKTOP = { top: 28, right: 146, bottom: 52, left: 66 };
const TL_MARGIN_MOBILE  = { top: 64, right: 168, bottom: 150, left: 110 };

function tl_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 168, bottom: 92,  left: 96 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96,  left: 116 };
    case 'square':     return { top: 44, right: 184, bottom: 74,  left: 116 };
    case 'mobile':     return { top: 64, right: 176, bottom: 150, left: 126 };
    default:           return { ...TL_MARGIN_DESKTOP };
  }
}

let TL_W = TL_W_DESKTOP, TL_H = TL_H_DESKTOP;
let TL_MARGIN = { ...TL_MARGIN_DESKTOP };

const TL_NS = 'http://www.w3.org/2000/svg';
const tl_el = (tag) => document.createElementNS(TL_NS, tag);

//==================================================================
//  Data: normalización + ranking precomputado
//==================================================================
let tl_data = null;        // ELO_SERIES: [{iso3, name, en, confed, elo:{y:v}, rank:{y:v}}]
let tl_byIso = null;       // {iso3: dataItem}

function tl_initData() {
  if (tl_data) return;
  if (typeof ELO_SERIES === 'undefined') {
    console.error('[elo-lines] ELO_SERIES no cargado');
    tl_data = []; tl_byIso = {};
    return;
  }
  // ELO_SERIES ya trae, por país, la serie de rating Elo (elo) y el RANKING
  // mundial oficial (rank, columna del CSV de eloratings — NO recomputado).
  tl_data = ELO_SERIES;
  tl_byIso = {};
  tl_data.forEach(d => tl_byIso[d.iso3] = d);
}

// Valor en el eje Y de un país en un año, según el modo.
//   'elo'  -> rating Elo                  'rank' -> ranking mundial oficial (1 = mejor)
function tl_value(iso3, year, mode) {
  const d = tl_byIso[iso3];
  if (!d) return null;
  const v = (mode === 'rank' ? d.rank : d.elo)[String(year)];
  return v == null ? null : v;
}

//==================================================================
//  Helpers
//==================================================================
function tl_displayName(d) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[d.iso3]) {
    return COUNTRY_NAMES[d.iso3][lang] || COUNTRY_NAMES[d.iso3].en || d.name;
  }
  // Fallback para los equipos que COUNTRY_NAMES no cubre (ej. Palestina):
  // name = español (country_today del CSV), en = inglés (team del CSV).
  return (lang === 'en' && d.en) ? d.en : d.name;
}

function tl_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : false;
}

function tl_measureText(text, fontSize, weight) {
  if (!tl_measureText._ctx) {
    tl_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  const ctx = tl_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

// Color del país seleccionado (o null si no está seleccionado). El valor del
// Map es el "slot" (0,1,2,…) y se mapea a la paleta extendida.
function tl_getColor(iso3) {
  const slot = tl_selMap().get(iso3);
  return slot == null ? null : tl_colorForSlot(slot);
}

function tl_selMap() {
  if (!(state[5].selectedCountries instanceof Map)) {
    state[5].selectedCountries = new Map(state[5].selectedCountries || []);
  }
  return state[5].selectedCountries;
}

// Próximo slot libre: el menor entero no usado. Así cada línea nueva toma el
// siguiente color de la paleta extendida, y al borrar una se reusa su slot bajo.
function tl_nextFreeColorIndex() {
  const inUse = new Set(tl_selMap().values());
  let i = 0;
  while (inUse.has(i)) i++;
  return i;
}

function tl_toggleSelect(iso3) {
  const sel = tl_selMap();
  if (sel.has(iso3)) sel.delete(iso3);
  else sel.set(iso3, tl_nextFreeColorIndex());
  tl_renderChips();
  drawLines();
}

// Ticks del eje X (años). Regla:
//   1. SIEMPRE mostrar el primer año (y0) y el último (y1) del rango visible.
//   2. Entre medio, ticks "redondos" (múltiplos de un step elegido por el span,
//      apuntando a ~5-6 ticks).
//   3. Sacar un tick redondo si queda demasiado pegado (< 0.4·step) al primero
//      o al último, para que no se encimen las etiquetas.
// Ej.: 1990-2026 → 1990, 2000, 2010, 2020, 2026.  1980-2026 → +1980.
function tl_yearTicks(y0, y1) {
  const span = y1 - y0;
  let step;
  if (span <= 8)        step = 2;
  else if (span <= 18)  step = 5;
  else if (span <= 55)  step = 10;
  else if (span <= 110) step = 20;
  else                  step = 25;
  const minGap = step * 0.4;
  const ticks = [y0];
  const firstRound = Math.ceil(y0 / step) * step;
  for (let y = firstRound; y < y1; y += step) {
    if (y - y0 >= minGap && y1 - y >= minGap) ticks.push(y);
  }
  ticks.push(y1);
  return ticks;
}

// Ticks lineales "lindos" para el eje Elo.
function tl_niceTicks(min, max, target) {
  const range = max - min;
  if (range <= 0) return [min];
  const rawStep = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step;
  if (norm < 1.5) step = 1; else if (norm < 3) step = 2;
  else if (norm < 7) step = 5; else step = 10;
  step *= mag;
  const ticks = [];
  const first = Math.ceil(min / step) * step;
  for (let v = first; v <= max + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks;
}

//==================================================================
//  DRAW
//==================================================================
function drawLines() {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.innerHTML = '';
  tl_initData();

  const s5 = state[5];
  const mode = s5.mode || TL_MODE_DEFAULT;
  const [y0, y1] = s5.period;

  // Editor sidebar (si está activo).
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;

  // Formato (editor) vs viewport.
  const editorFormat = (typeof getActivePngFormat === 'function')
    ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && tl_isMobile();

  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    TL_W = f.vbW;
    // Line chart: para los formatos cuadrados del PNG usamos un viewBox MÁS
    // ALTO que el base (square/newsletter rondan vbH 760). png-export hace
    // aspect-fit del SVG dentro del rectángulo disponible; con el aspect
    // apaisado del line chart el SVG quedaba limitado por el ANCHO y dejaba un
    // hueco vertical abajo (entre el eje X y la nota). Subiendo el alto del
    // viewBox el gráfico pasa a estar limitado por el ALTO y llena el canvas.
    TL_H = editorFormat === 'square'     ? 910
         : editorFormat === 'newsletter' ? 860
         : f.vbH;
    TL_MARGIN = tl_getMargins(editorFormat);
  } else if (mobile) {
    TL_W = TL_W_MOBILE; TL_H = TL_H_MOBILE;
    TL_MARGIN = { ...TL_MARGIN_MOBILE };
  } else {
    TL_W = TL_W_DESKTOP; TL_H = TL_H_DESKTOP;
    TL_MARGIN = { ...TL_MARGIN_DESKTOP };
  }
  let PLOT_W = TL_W - TL_MARGIN.left - TL_MARGIN.right;
  const PLOT_H = TL_H - TL_MARGIN.top - TL_MARGIN.bottom;

  svg.setAttribute('viewBox', `0 0 ${TL_W} ${TL_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  // Mobile-first: fuentes sobredimensionadas para sobrevivir la reducción ÷3
  // del PNG en el celu (ver skill graficos-atlas). Inline style para ganarle
  // a la clase CSS (trampa #1).
  const SIZES = bigFmt
    ? { tick: 22, axisTitle: 26, label: 26 }
    : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW   = bigFmt ? 3.4 : 1.8;
  const haloW   = lineW + (bigFmt ? 5 : 3);
  const labelHalo = bigFmt ? 6 : 3;

  // Margen izquierdo SUFICIENTE para que entren, con aire: borde + título del eje
  // (texto rotado) + gap + los números del eje. En el PNG los números son grandes y
  // en modo Elo son de 4 dígitos: con el margen fijo, el título quedaba pegado a los
  // números (o se cortaba contra el borde). Si no alcanza, agrandamos el margen
  // (achica un poco el plot, pero nada se solapa ni se corta).
  const _tickGap  = bigFmt ? 12 : 8;
  const _titleGap = bigFmt ? 18 : 10;
  const _edgeAir  = bigFmt ? 18 : 10;
  const _titleW   = SIZES.axisTitle * 1.5;   // ancho horizontal del texto rotado (~1.5x el font-size)
  const _tickWRef = tl_measureText(mode === 'rank' ? '100°' : '2200', SIZES.tick, 400);
  const _needLeft = Math.ceil(_edgeAir + _titleW + _titleGap + _tickWRef + _tickGap);
  if (_needLeft > TL_MARGIN.left) {
    TL_MARGIN.left = _needLeft;
    PLOT_W = TL_W - TL_MARGIN.left - TL_MARGIN.right;
  }

  // Países seleccionados (en orden de colorIdx para estabilidad visual).
  const sel = tl_selMap();
  const selected = Array.from(sel.keys()).filter(iso => tl_byIso[iso]);

  // Margen derecho DINÁMICO: las etiquetas de fin de línea (nombres de país)
  // viven en el margen derecho. Un nombre largo (ej. "Bosnia and Herzegovina")
  // se sale del viewBox y el PNG lo recorta. Medimos la etiqueta más ancha de
  // los seleccionados y, si no entra en el margen base, lo agrandamos (achica
  // el plot, pero el label queda dentro). Tope para no comerse medio gráfico.
  const labelOffset = bigFmt ? 12 : 6;
  let maxLabelW = 0;
  selected.forEach(iso => {
    const w = tl_measureText(tl_displayName(tl_byIso[iso]), SIZES.label, bigFmt ? 700 : 600);
    if (w > maxLabelW) maxLabelW = w;
  });
  if (maxLabelW > 0) {
    const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
    const maxRight = Math.round(TL_W * 0.42);   // tope: no más del 42% del ancho
    const newRight = Math.min(maxRight, Math.max(TL_MARGIN.right, neededRight));
    if (newRight !== TL_MARGIN.right) {
      TL_MARGIN.right = newRight;
      PLOT_W = TL_W - TL_MARGIN.left - TL_MARGIN.right;
    }
  }

  //--------------------------------------------------------------
  // Escalas
  //--------------------------------------------------------------
  const xScale = (year) => TL_MARGIN.left + ((year - y0) / (y1 - y0 || 1)) * PLOT_W;

  let yScale, yTicks, yDomain;
  if (mode === 'rank') {
    // Dominio: 1 .. peor puesto de los seleccionados en el período (con
    // padding). Si no hay selección, default 1..20. Invertido (1° arriba).
    let worst = 1;
    selected.forEach(iso => {
      for (let y = y0; y <= y1; y++) {
        const r = tl_value(iso, y, 'rank');
        if (r != null && r > worst) worst = r;
      }
    });
    let rankMax = Math.max(10, Math.ceil((worst + 1) / 5) * 5);
    if (selected.length === 0) rankMax = 20;
    yDomain = [1, rankMax];
    yScale = (rank) => TL_MARGIN.top + ((rank - 1) / (rankMax - 1)) * PLOT_H;
    // Ticks: 1, luego múltiplos de 5/10 hasta rankMax.
    const step = rankMax <= 20 ? 5 : (rankMax <= 60 ? 10 : 20);
    yTicks = [1];
    for (let v = step; v <= rankMax; v += step) yTicks.push(v);
  } else {
    // Dominio Elo: min/max de los seleccionados en el período + padding.
    let lo = Infinity, hi = -Infinity;
    selected.forEach(iso => {
      for (let y = y0; y <= y1; y++) {
        const v = tl_value(iso, y, 'elo');
        if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
      }
    });
    if (!isFinite(lo)) { lo = 1300; hi = 2100; }   // sin selección
    const pad = Math.max(20, (hi - lo) * 0.08);
    lo = lo - pad; hi = hi + pad;
    yDomain = [lo, hi];
    yScale = (v) => TL_MARGIN.top + PLOT_H - ((v - lo) / (hi - lo || 1)) * PLOT_H;
    yTicks = tl_niceTicks(lo, hi, 6);
  }

  //--------------------------------------------------------------
  // Grid + eje X
  //--------------------------------------------------------------
  const xTicks = tl_yearTicks(y0, y1);
  xTicks.forEach(yr => {
    const x = xScale(yr);
    const gl = tl_el('line');
    gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', TL_MARGIN.top); gl.setAttribute('y2', TL_MARGIN.top + PLOT_H);
    gl.setAttribute('class', 's-grid-line');
    svg.appendChild(gl);
    const lbl = tl_el('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', TL_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px';   // inline gana a la clase (trampa #1)
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });

  //--------------------------------------------------------------
  // Grid + eje Y
  //--------------------------------------------------------------
  yTicks.forEach(v => {
    const y = yScale(v);
    if (y < TL_MARGIN.top - 1 || y > TL_MARGIN.top + PLOT_H + 1) return;
    const gl = tl_el('line');
    gl.setAttribute('x1', TL_MARGIN.left); gl.setAttribute('x2', TL_MARGIN.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.setAttribute('class', 's-grid-line');
    svg.appendChild(gl);
    const lbl = tl_el('text');
    lbl.setAttribute('x', TL_MARGIN.left - (bigFmt ? 12 : 8));
    lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = (mode === 'rank') ? (v + '°') : v;
    svg.appendChild(lbl);
  });

  // Título eje Y
  const yT = tl_el('text');
  yT.setAttribute('class', 's-axis-title');
  yT.setAttribute('text-anchor', 'middle');
  // X dinámica: a _titleGap a la izquierda del número de eje MÁS ANCHO (el margen
  // ya se dimensionó arriba para que entre). Clamp de _edgeAir para que el texto
  // rotado nunca se corte contra el borde izquierdo.
  const _widestTick = Math.max(0, ...yTicks.map(v => tl_measureText((mode === 'rank') ? (v + '°') : ('' + v), SIZES.tick, 400)));
  const _tickLeft = TL_MARGIN.left - _tickGap - _widestTick;
  const yTitleX = Math.max(_edgeAir + _titleW / 2, _tickLeft - _titleGap - _titleW / 2);
  yT.setAttribute('transform', `translate(${yTitleX}, ${TL_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px';
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : '') || fb;
  yT.textContent = (mode === 'rank')
    ? tt('c5-axis-y-rank', 'Posición en el ranking')
    : tt('c5-axis-y-elo', 'Puntaje Elo');
  svg.appendChild(yT);

  //--------------------------------------------------------------
  // Path builder (filtra años con dato; conecta lo válido)
  //--------------------------------------------------------------
  function buildPath(iso3) {
    const pts = [];
    for (let y = y0; y <= y1; y++) {
      const v = tl_value(iso3, y, mode);
      if (v != null) pts.push([xScale(y), yScale(v)]);
    }
    if (pts.length === 0) return '';
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  }
  // Último punto válido de una línea (para la etiqueta de fin).
  function lastPoint(iso3) {
    for (let y = y1; y >= y0; y--) {
      const v = tl_value(iso3, y, mode);
      if (v != null) return { year: y, val: v, x: xScale(y), y: yScale(v) };
    }
    return null;
  }

  //--------------------------------------------------------------
  // Líneas: halo crema + línea de color
  //--------------------------------------------------------------
  const halosG = tl_el('g'); svg.appendChild(halosG);
  const linesG = tl_el('g'); svg.appendChild(linesG);
  const hitG   = tl_el('g'); svg.appendChild(hitG);   // hit-areas transparentes (hover fácil)

  // Ancho de la hit-area: bastante más gruesa que la línea para que el hover
  // no exija puntería exacta sobre el trazo fino.
  const hitW = Math.max(lineW + 8, bigFmt ? 16 : 9);

  selected.forEach(iso => {
    const d = buildPath(iso);
    if (!d) return;
    const color = tl_getColor(iso);

    const halo = tl_el('path');
    halo.setAttribute('d', d);
    halo.setAttribute('fill', 'none');
    // Halo crema resuelto (NO var() — trampa #2: no resuelve al rasterizar).
    halo.setAttribute('stroke', '#FAF8F3');
    halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round');
    halo.setAttribute('stroke-linecap', 'round');
    halo.setAttribute('data-tl-line', iso);
    halosG.appendChild(halo);

    const path = tl_el('path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('data-tl-line', iso);
    path.setAttribute('data-base-w', lineW);
    path.classList.add('tl-colored');
    linesG.appendChild(path);

    // Hit-area transparente ancha: captura hover (dimming) y click sin exigir
    // puntería sobre el trazo. mouseenter resalta esta línea y atenúa el resto.
    const hit = tl_el('path');
    hit.setAttribute('d', d);
    hit.setAttribute('fill', 'none');
    hit.setAttribute('stroke', 'transparent');
    hit.setAttribute('stroke-width', hitW);
    hit.setAttribute('stroke-linejoin', 'round');
    hit.style.cursor = 'pointer';
    hit.addEventListener('mouseenter', () => tl_setLineEmphasis(iso));
    hit.addEventListener('mouseleave', () => tl_setLineEmphasis(null));
    if (typeof HAS_HOVER === 'undefined' || HAS_HOVER) hit.addEventListener('click', (ev) => { ev.stopPropagation(); tl_toggleSelect(iso); });   // toggle solo desktop
    hitG.appendChild(hit);
  });

  //--------------------------------------------------------------
  // Etiquetas de fin de línea (nombre país) — anti-colisión + guías
  //--------------------------------------------------------------
  const endLabels = [];
  selected.forEach(iso => {
    const lp = lastPoint(iso);
    if (!lp) return;
    endLabels.push({
      iso, color: tl_getColor(iso),
      text: tl_displayName(tl_byIso[iso]),
      lineEndX: lp.x, idealY: lp.y
    });
  });
  // Sweep top-to-bottom; empujar si quedan a < GAP px.
  const GAP = bigFmt ? SIZES.label + 8 : 14;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = (i === 0) ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + GAP);
    // Clamp dentro del plot (con un poco de aire arriba/abajo).
    l.y = Math.min(l.y, TL_MARGIN.top + PLOT_H);
    l.y = Math.max(l.y, TL_MARGIN.top + (bigFmt ? 6 : 2));
    l.shifted = Math.abs(l.y - l.idealY) > 1.5;
  });
  const endG = tl_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const guide = tl_el('line');
      guide.setAttribute('x1', l.lineEndX);
      guide.setAttribute('y1', l.idealY);
      guide.setAttribute('x2', l.lineEndX + (bigFmt ? 8 : 4));
      guide.setAttribute('y2', l.y);
      guide.setAttribute('stroke', l.color);
      guide.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8);
      guide.setAttribute('stroke-opacity', 0.5);
      guide.setAttribute('fill', 'none');
      guide.setAttribute('data-tl-line', l.iso);
      endG.appendChild(guide);
    }
    const txt = tl_el('text');
    txt.setAttribute('x', l.lineEndX + (bigFmt ? 12 : 6));
    txt.setAttribute('y', l.y + (bigFmt ? 8 : 4));
    txt.setAttribute('fill', l.color);
    txt.setAttribute('data-tl-line', l.iso);
    txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = SIZES.label + 'px';
    txt.style.fontFamily = 'var(--sans)';
    // Halo crema resuelto para legibilidad sobre grid (paint-order: stroke).
    txt.setAttribute('paint-order', 'stroke');
    txt.setAttribute('stroke', '#FAF8F3');
    txt.setAttribute('stroke-width', labelHalo);
    txt.setAttribute('stroke-linejoin', 'round');
    txt.textContent = l.text;
    endG.appendChild(txt);
  });

  //--------------------------------------------------------------
  // Capa de hover (vline + markers + tooltip) — solo desktop con hover
  //--------------------------------------------------------------
  // Hover/tooltip: se cablea siempre salvo en los formatos de export (PNG
  // estático: square/newsletter/mobilePng). En desktop con mouse y en touch
  // (tap → tooltip vía wireTouchScrub) funciona igual.
  const isPngFormat = newsletter || square || mobilePng;
  if (!isPngFormat && selected.length > 0) {
    tl_setupHover(svg, { y0, y1, mode, xScale, yScale, selected, PLOT_W, PLOT_H });
  }

  // Título dinámico (siempre NEUTRAL — Daniel pidió título descriptivo) +
  // subtítulo según el modo (rank/elo).
  tl_applyHeadings(mode, aeCfg);
}

//==================================================================
//  Énfasis al hover sobre una línea (atenúa el resto)
//==================================================================
// iso = país a resaltar; null = restaurar todo. Atenúa líneas, halos y
// etiquetas de los demás países (opacity baja) y engrosa la línea resaltada.
function tl_setLineEmphasis(iso) {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  svg.querySelectorAll('[data-tl-line]').forEach(el => {
    const me = el.getAttribute('data-tl-line');
    const isColored = el.classList.contains('tl-colored');
    if (iso == null) {
      el.style.opacity = '';
      if (isColored) el.setAttribute('stroke-width', el.getAttribute('data-base-w'));
    } else if (me === iso) {
      el.style.opacity = '1';
      if (isColored) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1));
    } else {
      el.style.opacity = '0.14';
    }
  });
}

//==================================================================
//  Hover layer
//==================================================================
function tl_setupHover(svg, ctx) {
  const { y0, y1, mode, xScale, yScale, selected } = ctx;
  const tooltip = document.getElementById('tooltip5');

  const hoverG = tl_el('g');
  hoverG.setAttribute('display', 'none');
  svg.appendChild(hoverG);

  const vline = tl_el('line');
  vline.setAttribute('stroke', '#9a9488');
  vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3');
  vline.setAttribute('y1', TL_MARGIN.top);
  vline.setAttribute('y2', TL_MARGIN.top + (TL_H - TL_MARGIN.top - TL_MARGIN.bottom));
  hoverG.appendChild(vline);

  const captureRect = tl_el('rect');
  captureRect.setAttribute('x', TL_MARGIN.left);
  captureRect.setAttribute('y', TL_MARGIN.top);
  captureRect.setAttribute('width', TL_W - TL_MARGIN.left - TL_MARGIN.right);
  captureRect.setAttribute('height', TL_H - TL_MARGIN.top - TL_MARGIN.bottom);
  captureRect.setAttribute('fill', 'transparent');
  svg.insertBefore(captureRect, svg.firstChild);

  function update(year) {
    if (year < y0 || year > y1) {
      hoverG.setAttribute('display', 'none');
      if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; }
      return;
    }
    hoverG.setAttribute('display', '');
    while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xScale(year);
    vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);

    const rows = [];
    selected.forEach(iso => {
      const v = tl_value(iso, year, mode);
      if (v == null) return;
      const cy = yScale(v);
      const c = tl_el('circle');
      c.setAttribute('cx', xAt); c.setAttribute('cy', cy); c.setAttribute('r', 4);
      c.setAttribute('fill', tl_getColor(iso));
      c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5);
      hoverG.appendChild(c);
      rows.push({ name: tl_displayName(tl_byIso[iso]), color: tl_getColor(iso), v });
    });

    if (tooltip && rows.length) {
      rows.sort((a, b) => mode === 'rank' ? a.v - b.v : b.v - a.v);
      const fmt = (v) => mode === 'rank' ? (v + '°') : Math.round(v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => {
        html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span>
          <span style="flex:1;">${r.name}</span>
          <strong style="font-variant-numeric:tabular-nums;">${fmt(r.v)}</strong></div>`;
      });
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
    }
  }

  function yearAt(ev) {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / TL_W;
    const localX = (evClientX(ev) - rect.left) / scale;
    return Math.round(y0 + (localX - TL_MARGIN.left) / (TL_W - TL_MARGIN.left - TL_MARGIN.right) * (y1 - y0));
  }
  const moveH = (ev) => {
    const yr = yearAt(ev);
    update(yr);
    if (tooltip) {
      const rect = svg.getBoundingClientRect();
      const _x = evClientX(ev) - rect.left, _w = tooltip.offsetWidth || 170;   // si no entra a la derecha, a la izquierda del cursor
      tooltip.style.left = ((_x + 14 + _w > rect.width || _x > rect.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
      tooltip.style.top = (evClientY(ev) - rect.top + 14) + 'px';
    }
  };
  svg.addEventListener('mousemove', moveH);
  svg.addEventListener('mouseleave', () => update(-1));
  wireTouchScrub(svg, moveH);   // tap/arrastre con el dedo mueve el crosshair
}

//==================================================================
//  Títulos (neutral) + subtítulo dinámico por modo
//==================================================================
function tl_applyHeadings(mode, aeCfg) {
  const block = document.querySelector('.chart-block[data-chart="5"]') || document;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);

  // Título: neutral siempre. Respeta override del editor.
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) {
    titleEl.textContent = tt('c5-title', 'Trayectorias de las selecciones');
  }
  // Subtítulo: descriptivo según el modo. Respeta override del editor.
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) {
    subEl.textContent = (mode === 'rank')
      ? tt('c5-subtitle-rank', 'Posición en el ranking mundial de selecciones según su rating Elo.')
      : tt('c5-subtitle-elo', 'Rating Elo de las selecciones nacionales a lo largo del tiempo.');
  }
}

//==================================================================
//  Chips
//==================================================================
function tl_renderChips() {
  const container = document.getElementById('tl-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  tl_initData();
  const sel = tl_selMap();
  Array.from(sel.keys()).forEach(iso => {
    const d = tl_byIso[iso];
    if (!d) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = tl_getColor(iso);
    chip.textContent = tl_displayName(d);
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', typeof t === 'function' ? t('chip-remove') : 'Remove');
    x.addEventListener('click', () => tl_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

//==================================================================
//  Buscador (país + confederación sutil)
//==================================================================
function tl_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function tl_searchable() {
  return tl_data
    .map(d => ({ iso3: d.iso3, name: tl_displayName(d), confed: d.confed }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
function setupLinesSearch() {
  const input = document.getElementById('tl-search');
  const results = document.getElementById('tl-search-results');
  if (!input || !results) return;
  let matches = [], activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = tl_normalize(q);
    return tl_searchable().filter(c => tl_normalize(c.name).includes(qn)).slice(0, 8);
  }
  function render(active) {
    if (matches.length === 0) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => {
      const isSel = tl_selMap().has(c.iso3);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso3}">${c.name}<span class="m-search-region">${c.confed}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('click', () => {
        tl_toggleSelect(el.dataset.iso);
        input.value = ''; results.classList.remove('open'); input.focus();
      });
    });
  }
  input.addEventListener('input', () => { matches = getMatches(input.value); activeIdx = matches.length ? 0 : -1; render(activeIdx); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); activeIdx = (activeIdx + 1) % matches.length; render(activeIdx); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); activeIdx = (activeIdx - 1 + matches.length) % matches.length; render(activeIdx); }
    else if (ev.key === 'Enter' && activeIdx >= 0) { ev.preventDefault(); tl_toggleSelect(matches[activeIdx].iso3); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

//==================================================================
//  Toggle absoluto/ranking
//==================================================================
function setupLinesToggle() {
  document.querySelectorAll('.toggle[data-target="tl-mode"] button').forEach(btn => {
    btn.addEventListener('click', () => {
      const grp = btn.closest('.toggle');
      grp.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[5].mode = btn.dataset.mode;
      drawLines();
    });
  });
}

//==================================================================
//  Slider de período
//==================================================================
function setupLinesSlider() {
  const fromEl = document.getElementById('tl-slider-from');
  const toEl   = document.getElementById('tl-slider-to');
  const dispEl = document.getElementById('tl-range-display');
  const trackActiveEl = document.getElementById('tl-range-track-active');
  if (!fromEl || !toEl || !dispEl) return;

  function updateDisplay() {
    const [a, b] = state[5].period;
    dispEl.textContent = `${a}–${b}`;
    if (trackActiveEl) {
      const min = parseInt(fromEl.min, 10), max = parseInt(fromEl.max, 10), span = max - min;
      if (span > 0) {
        trackActiveEl.style.left = ((a - min) / span) * 100 + '%';
        trackActiveEl.style.right = ((max - b) / span) * 100 + '%';
      }
    }
  }
  function syncInputs() { fromEl.value = state[5].period[0]; toEl.value = state[5].period[1]; }
  function onFrom() {
    let from = parseInt(fromEl.value, 10), to = state[5].period[1];
    if (from > to - TL_MIN_WINDOW) from = to - TL_MIN_WINDOW;
    state[5].period = [from, to]; syncInputs(); updateDisplay(); drawLines();
  }
  function onTo() {
    let from = state[5].period[0], to = parseInt(toEl.value, 10);
    if (to < from + TL_MIN_WINDOW) to = from + TL_MIN_WINDOW;
    state[5].period = [from, to]; syncInputs(); updateDisplay(); drawLines();
  }
  fromEl.addEventListener('input', onFrom);
  toEl.addEventListener('input', onTo);
  syncInputs(); updateDisplay();
}

//==================================================================
//  Download CSV
//==================================================================
function setupLinesDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      tl_initData();
      const cols = ['iso3', 'name', 'confed', 'year', 'elo', 'rank'];
      let csv = cols.join(',') + '\n';
      tl_data.forEach(d => {
        Object.keys(d.elo).sort().forEach(y => {
          const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[d.iso3]?.en) || d.en || d.name;
          const nameQ = /[",]/.test(name) ? '"' + name.replace(/"/g, '""') + '"' : name;
          const rank = (d.rank && d.rank[y] != null) ? d.rank[y] : '';
          csv += [d.iso3, nameQ, d.confed, y, d.elo[y], rank].join(',') + '\n';
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'el-atlas-03-elo-trayectorias.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

//==================================================================
//  Init + registro PNG
//==================================================================
function initLines() {
  tl_initData();
  if (!state[5]) state[5] = {};
  if (!state[5].period) state[5].period = [...TL_PERIOD_DEFAULT];
  if (!state[5].mode) state[5].mode = TL_MODE_DEFAULT;
  // Selección default (Map<iso3, colorIdx>). Solo si no hay una previa.
  if (!(state[5].selectedCountries instanceof Map)) {
    const m = new Map();
    if (Array.isArray(state[5].selectedCountries)) {
      state[5].selectedCountries.forEach(iso => m.set(iso, tl_nextFreeColorIndexFrom(m)));
    } else {
      TL_DEFAULT_SELECTION.forEach((iso, i) => m.set(iso, i));
    }
    state[5].selectedCountries = m;
  }

  drawLines();
  setupLinesToggle();
  setupLinesSlider();
  setupLinesSearch();
  setupLinesDownloadCSV();
  tl_renderChips();

  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initLines._editorWired) {
    initLines._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawLines());
  }

  // PNG mobile-first: soporta re-render por formato. Default = square.
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawLines;

  // Nota "Datos" del PNG (texto fijo, ya sin período — el período va en el
  // subtítulo del PNG, ver abajo).
  window.onBeforePngExportGetSourceText = function(chartId) {
    if (String(chartId) !== '5') return null;
    const tpl = (typeof t === 'function' ? t('c5-sources-tpl') : '') || '';
    return tpl || null;
  };

  // Subtítulo del PNG: el del modo activo + el PERÍODO mostrado entre
  // paréntesis (ej. "…según su rating Elo (1980–2026)."). Solo en el PNG; el
  // subtítulo en pantalla queda sin el período. Respeta override del editor.
  window.onBeforePngExportGetSubtitle = function(chartId) {
    if (String(chartId) !== '5') return null;
    const ae = (window.AtlasEditor && window.AtlasEditor.getConfig)
      ? window.AtlasEditor.getConfig() : null;
    const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
    const aeSub = ae && ae.texts && ae.texts[lang] && ae.texts[lang].subtitle;
    const mode = (state[5] && state[5].mode) || TL_MODE_DEFAULT;
    const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
    const base = (aeSub && aeSub.trim())
      ? aeSub.trim()
      : (mode === 'rank'
          ? tt('c5-subtitle-rank', 'Posición en el ranking mundial de selecciones según su rating Elo.')
          : tt('c5-subtitle-elo', 'Rating Elo de las selecciones nacionales a lo largo del tiempo.'));
    const p = (state[5] && state[5].period) || TL_PERIOD_DEFAULT;
    return base.replace(/\s*\.?\s*$/, '') + ' (' + p[0] + '–' + p[1] + ').';
  };
}

// Helper para asignar color al migrar desde un array previo (state restaurado).
function tl_nextFreeColorIndexFrom(m) {
  const inUse = new Set(m.values());
  let i = 0;
  while (inUse.has(i)) i++;
  return i;
}
