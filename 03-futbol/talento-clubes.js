// =============================================================
//  El Atlas N°3 — Chart 4: Share fútbol vs antigüedad clubes
// =============================================================
//
// Scatter:
//   eje X = % del talento deportivo masculino que es fútbol
//   eje Y = año mediano de fundación de los clubes (ponderado por sitelinks)
//   color = confederación FIFA
//   etiquetas = CONMEBOL (cluster sudamericano destacado)
//
// La narrativa: Sudamérica está en la esquina superior-derecha — alto %
// fútbol Y clubes antiguos. Confirma que el talento atlético sudamericano
// se "queda" con el fútbol Y que la tradición institucional es vieja.
//
// Inputs:
//   SPORTS: array de {iso3, name, confed, clubAge, cats: {cat: {year: [all, hi]}}}
//   SPORT_CATS: ['Fútbol','Básquet','Ciclismo','Tenis','Natación','Lucha','Otros deportistas']
//
// El campo `cats[Cat][year]` es un par [all_count, hi_views_count]. El
// toggle "+5k views" selecciona el índice 1 en vez del 0.
//
// State (state[4]):
//   - period: [year_from, year_to] del slider (default 1940-2000)
//   - hiViews: boolean (default true)
//   - minN: número mínimo de deportistas por país (default 20)
//   - hoverConf / stickyConf: similar al scatter Elo/PIB
//   - selectedCountries: Set para etiquetas manuales

//==================================================================
//  Constantes
//==================================================================
const SC_W = 1100, SC_H = 420;
const SC_MARGIN_DESKTOP = { top: 24, right: 110, bottom: 60, left: 64 };
const SC_MARGIN_MOBILE  = { top: 90, right: 40, bottom: 220, left: 130 };

// Márgenes por formato de PNG (mobile-first). Mismo criterio que el scatter
// Elo/PIB: el cluster sudamericano cae arriba-derecha → margen derecho amplio
// para que las etiquetas respiren.
function sc_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 40, right: 80, bottom: 72, left: 92 };
    case 'square':     return { top: 40, right: 80, bottom: 72, left: 92 };
    case 'mobile':     return { top: 60, right: 40, bottom: 220, left: 110 };
    default:           return null;
  }
}

const SC_PERIOD_DEFAULT = [1900, 2010];
const SC_PERIOD_MIN = 1900;
const SC_PERIOD_MAX = 2010;
const SC_MIN_WINDOW = 5;
const SC_MIN_N_DEFAULT = 20;
const SC_HI_VIEWS_DEFAULT = false;

// Líneas de referencia editoriales — más fuertes que el resto del grid.
// 50%: mitad del eje X (figura clave: arriba del 50% el país "es de fútbol").
// 1950: mitad del siglo XX en el eje Y (línea editorial: clubes pre-1950
// son "fundacionales" del fútbol moderno).
const SC_REF_LINE_X = 0.50;
const SC_REF_LINE_Y = 1950;
const SC_GRID_COLOR_SUBTLE = '#EFE9D9';   // casi transparente
const SC_GRID_COLOR_REF    = '#9C928A';   // referencia editorial

// Colores confederación (mismos que scatter Elo/PIB del N°3 — coherencia
// editorial con el resto del número).
const SC_CONF_COLORS = {
  CONMEBOL: '#BE5D32',
  UEFA:     '#3E5A6E',
  CONCACAF: '#8B5A8C',
  CAF:      '#6B8E5A',
  AFC:      '#C99A3B',
  OFC:      '#4A9BA8',
  '':       '#B5AC9A',  // sin confederación
};
const SC_CONF_LABEL_COLORS = {
  CONMEBOL: '#8B4220',
  UEFA:     '#26384A',
  CONCACAF: '#5E3B5E',
  CAF:      '#496B3A',
  AFC:      '#946C1F',
  OFC:      '#2D6B76',
};
const SC_CONF_ORDER = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

// Países etiquetados SIEMPRE (sin estado, parte del default editorial del
// chart). Daniel: además de TODOS los CONMEBOL (lógica intrínseca por
// confed), también estos países: cubren las grandes potencias deportivas
// no-sudamericanas (USA, China, India, Australia), las potencias
// futbolísticas europeas (GBR, ESP, FRA, ITA, NLD, SWE), las africanas
// que sobre-rinden en el chart (GHA, NGA) y el referente CONCACAF (MEX).
// Aparecen con etiqueta normal (weight 500), no como selección manual.
const SC_DEFAULT_LABELED = new Set([
  'USA','CHN','IND','AUS','GHA','NGA',
  'GBR','ESP','FRA','ITA','NLD','DEU',
  'MEX'
]);

const SC_POINT_R_LABELED  = 6;
const SC_POINT_R_SELECTED = 7;
const SC_POINT_R_OTHER    = 4;

const SC_SVG_NS = 'http://www.w3.org/2000/svg';
const sc_ns = (tag) => document.createElementNS(SC_SVG_NS, tag);

// Conjunto interno: data normalizada cacheada del SPORTS array.
// Cada item: {iso3, name, confed, clubAge, byYearCat: {cat: {year: [all,hi]}}}
let sc_data = null;

//==================================================================
//  Helpers
//==================================================================
function sc_displayName(d) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[d.iso3]) {
    return COUNTRY_NAMES[d.iso3][lang] || COUNTRY_NAMES[d.iso3].en || d.name;
  }
  return d.name;
}

function sc_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

function sc_measureText(text, fontSize, weight) {
  if (!sc_measureText._ctx) {
    const c = document.createElement('canvas');
    sc_measureText._ctx = c.getContext('2d');
  }
  const ctx = sc_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function sc_initDataFromGlobal() {
  if (sc_data) return;
  if (typeof SPORTS === 'undefined') {
    console.error('[talento-clubes] SPORTS no cargado');
    sc_data = [];
    return;
  }
  sc_data = SPORTS.map(d => ({
    iso3: d.iso3,
    name: d.name,
    confed: d.confed || '',
    clubAge: d.clubAge,
    cats: d.cats || {},
  }));
}

//==================================================================
//  Cómputo de share por país
//==================================================================
// counts[país] = sumar en el período (y0..y1), por categoría, índice all|hi.
// Devuelve {share, total} (share = futbol / total). Países con total < minN
// se filtran fuera.
function sc_computePoints() {
  const s = state[4];
  const [y0, y1] = s.period;
  const idx = s.hiViews ? 1 : 0;
  const minN = s.minN;
  const cats = (typeof SPORT_CATS !== 'undefined') ? SPORT_CATS : Object.keys(sc_data[0]?.cats || {});

  const pts = [];
  for (const d of sc_data) {
    if (d.clubAge == null) continue;
    let totFut = 0, totAll = 0;
    for (const c of cats) {
      const yd = d.cats[c];
      if (!yd) continue;
      let s = 0;
      for (let y = y0; y <= y1; y++) {
        const v = yd[String(y)];
        if (v) s += v[idx] || 0;
      }
      if (c === 'Fútbol') totFut = s;
      totAll += s;
    }
    if (totAll < minN) continue;
    pts.push({
      iso3: d.iso3,
      name: d.name,
      confed: d.confed,
      clubAge: d.clubAge,
      share: totFut / totAll,
      totFut,
      totAll,
    });
  }
  return pts;
}

//==================================================================
//  Niceness de ticks
//==================================================================
function sc_niceTicks(min, max, target) {
  if (typeof niceLinearTicks === 'function') {
    return niceLinearTicks(min, max, target);
  }
  const range = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(range / target)));
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max; v += step) ticks.push(v);
  return ticks;
}

//==================================================================
//  Renderer
//==================================================================
// Caja de un label colocado. Maneja anchor (start/end/middle) en X y baseline
// (central/alphabetic) en Y — chart 4 usa ambos.
function sc_labelBox(l, labelH) {
  let x1, x2;
  if (l.anchor === 'middle')    { x1 = l.lx - l.textW / 2; x2 = l.lx + l.textW / 2; }
  else if (l.anchor === 'end')  { x1 = l.lx - l.textW;     x2 = l.lx; }
  else                          { x1 = l.lx;               x2 = l.lx + l.textW; }
  let y1, y2;
  if (l.baseline === 'central') { y1 = l.ly - labelH * 0.5;  y2 = l.ly + labelH * 0.5; }
  else                          { y1 = l.ly - labelH * 0.78; y2 = l.ly + labelH * 0.22; }
  return { x1, x2, y1, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

// Relajación anti-colisión 2D + repulsión de puntos (mismo criterio que el
// scatter Elo/PIB). Separa labels que se pisan (ej. Perú/Chile) y los corre
// de encima de su punto; se reconectan con línea guía gris en el draw.
function sc_relaxLabels(placed, labelH, plotBox, passes, obstacles) {
  const PAD = 6, PT_PAD = 4;
  for (let p = 0; p < passes; p++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = sc_labelBox(placed[i], labelH);
        const b = sc_labelBox(placed[j], labelH);
        const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + PAD;
        const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + PAD;
        if (ox > 0 && oy > 0) {
          if (oy <= ox) {
            const push = oy / 2;
            if (a.cy <= b.cy) { placed[i].ly -= push; placed[j].ly += push; }
            else              { placed[i].ly += push; placed[j].ly -= push; }
          } else {
            const push = ox / 2;
            if (a.cx <= b.cx) { placed[i].lx -= push; placed[j].lx += push; }
            else              { placed[i].lx += push; placed[j].lx -= push; }
          }
          moved = true;
        }
      }
    }
    if (obstacles && obstacles.length) {
      for (let i = 0; i < placed.length; i++) {
        const a = sc_labelBox(placed[i], labelH);
        for (let k = 0; k < obstacles.length; k++) {
          const ob = obstacles[k];
          const nx = Math.max(a.x1, Math.min(ob.x, a.x2));
          const ny = Math.max(a.y1, Math.min(ob.y, a.y2));
          const R = ob.r + PT_PAD;
          const d = Math.hypot(nx - ob.x, ny - ob.y);
          if (d < R) {
            const overlap = R - d;
            let ux = a.cx - ob.x, uy = a.cy - ob.y;
            const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
            placed[i].lx += ux * overlap;
            placed[i].ly += uy * overlap;
            moved = true;
          }
        }
      }
    }
    if (!moved) break;
  }
  // Pasada FINAL solo-punto: garantiza que ningún label tape su círculo
  // (Daniel: los puntos tienen que verse enteros). Tiene prioridad sobre la
  // separación label↔label — el halo crema cubre cualquier roce menor que
  // esto pueda reintroducir entre etiquetas.
  if (obstacles && obstacles.length) {
    for (let p = 0; p < 100; p++) {
      let moved = false;
      for (let i = 0; i < placed.length; i++) {
        const a = sc_labelBox(placed[i], labelH);
        for (let k = 0; k < obstacles.length; k++) {
          const ob = obstacles[k];
          const nx = Math.max(a.x1, Math.min(ob.x, a.x2));
          const ny = Math.max(a.y1, Math.min(ob.y, a.y2));
          const R = ob.r + PT_PAD;
          const d = Math.hypot(nx - ob.x, ny - ob.y);
          if (d < R) {
            const overlap = R - d;
            let ux = a.cx - ob.x, uy = a.cy - ob.y;
            const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
            placed[i].lx += ux * overlap;
            placed[i].ly += uy * overlap;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }
  // Clamp al área de plot.
  placed.forEach(l => {
    const b = sc_labelBox(l, labelH);
    if (b.x1 < plotBox.x1) l.lx += plotBox.x1 - b.x1;
    if (b.x2 > plotBox.x2) l.lx -= b.x2 - plotBox.x2;
    if (b.y1 < plotBox.y1) l.ly += plotBox.y1 - b.y1;
    if (b.y2 > plotBox.y2) l.ly -= b.y2 - plotBox.y2;
  });
}

function drawTalentoClubes() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';
  sc_initDataFromGlobal();

  // Editor sidebar
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeCountries = (aeCfg?.countries && aeCfg.countries.length > 0)
    ? new Set(aeCfg.countries) : null;

  // Formato activo del PNG (square por default al descargar). Igual que el
  // scatter Elo/PIB: viewBox + márgenes + tamaños cambian según el formato.
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat && sc_isMobile();
  const bigFmt = newsletter || square || mobilePng || mobile;

  let SC_W, SC_H, SC_MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    SC_W = f.vbW; SC_H = f.vbH; SC_MARGIN = sc_getMargins(editorFormat);
  } else if (mobile) {
    SC_W = 1100; SC_H = 1500; SC_MARGIN = { ...SC_MARGIN_MOBILE };
  } else {
    SC_W = 1100; SC_H = 420;  SC_MARGIN = { ...SC_MARGIN_DESKTOP };
  }
  const PLOT_W = SC_W - SC_MARGIN.left - SC_MARGIN.right;
  const PLOT_H = SC_H - SC_MARGIN.top - SC_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${SC_W} ${SC_H}`);

  // Tamaños mobile-first. CLAVE: se aplican como ESTILO INLINE (no atributo),
  // porque las clases CSS .s-tick / .s-axis-title / .s-country-label tienen
  // font-size propio que le gana al atributo en SVG (mismo bug que el scatter
  // Elo/PIB). El estilo inline le gana a la clase.
  const SIZES = (newsletter || square || mobilePng)
    ? { tick: 22, axisTitle: 26, label: 26 }
    : mobile
    ? { tick: 20, axisTitle: 24, label: 22 }
    : { tick: 11, axisTitle: 11.5, label: 10.5 };
  // Escala de radios de punto: en mobile-first los puntos chicos desaparecen
  // al reducir la imagen al celu.
  const ptScale = (square || newsletter) ? 1.8 : (mobilePng || mobile) ? 2.0 : 1;

  const pts = sc_computePoints();
  if (pts.length === 0) {
    const txt = sc_ns('text');
    txt.setAttribute('x', SC_W / 2); txt.setAttribute('y', SC_H / 2);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', 'var(--sans)');
    txt.setAttribute('fill', 'var(--ink-muted)');
    txt.textContent = (typeof t === 'function') ? t('c4-empty') : 'Sin datos en el rango seleccionado';
    svg.appendChild(txt);
    return;
  }

  // Escalas
  const shareMax = Math.max(...pts.map(p => p.share), 0.1);
  const yExt = [Math.min(...pts.map(p => p.clubAge)), Math.max(...pts.map(p => p.clubAge))];
  const xDomain = [0, Math.ceil(shareMax * 10) / 10];  // redondeo a 10%
  const yDomain = [yExt[0] - 4, yExt[1] + 4];

  const xScale = v => SC_MARGIN.left + (v - xDomain[0]) / (xDomain[1] - xDomain[0]) * PLOT_W;
  const yScale = v => SC_MARGIN.top + PLOT_H - (v - yDomain[0]) / (yDomain[1] - yDomain[0]) * PLOT_H;

  // === Grid + ticks X ===
  const xTicks = [];
  const xStep = xDomain[1] >= 0.5 ? 0.1 : 0.05;
  for (let v = 0; v <= xDomain[1] + 1e-9; v += xStep) xTicks.push(Math.round(v * 100) / 100);

  const gridG = sc_ns('g'); svg.appendChild(gridG);
  const axisG = sc_ns('g'); svg.appendChild(axisG);
  xTicks.forEach(v => {
    const x = xScale(v);
    const isRef = Math.abs(v - SC_REF_LINE_X) < 1e-9;
    const line = sc_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', SC_MARGIN.top); line.setAttribute('y2', SC_MARGIN.top + PLOT_H);
    line.setAttribute('stroke', isRef ? SC_GRID_COLOR_REF : SC_GRID_COLOR_SUBTLE);
    line.setAttribute('stroke-width', isRef ? 1.2 : 1);
    if (isRef) line.setAttribute('stroke-dasharray', '4 3');
    gridG.appendChild(line);
    const lbl = sc_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', SC_MARGIN.top + PLOT_H + (bigFmt ? 36 : 18));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';   // inline gana a .s-tick
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v * 100) + '%';
    axisG.appendChild(lbl);
  });

  // === Grid + ticks Y ===
  // Ticks fijos cada 25 años (1900, 1925, 1950, 1975, 2000). Más legibles
  // que niceLinearTicks que producía rótulos sucios tipo 1893, 1908, etc.
  const SC_Y_TICKS_FIXED = [1900, 1925, 1950, 1975, 2000];
  const yTicks = SC_Y_TICKS_FIXED.filter(v => v >= yDomain[0] && v <= yDomain[1]);
  yTicks.forEach(v => {
    if (v < yDomain[0] - 1 || v > yDomain[1] + 1) return;
    const y = yScale(v);
    const isRef = v === SC_REF_LINE_Y;
    const line = sc_ns('line');
    line.setAttribute('x1', SC_MARGIN.left); line.setAttribute('x2', SC_MARGIN.left + PLOT_W);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', isRef ? SC_GRID_COLOR_REF : SC_GRID_COLOR_SUBTLE);
    line.setAttribute('stroke-width', isRef ? 1.2 : 1);
    if (isRef) line.setAttribute('stroke-dasharray', '4 3');
    gridG.appendChild(line);
    const lbl = sc_ns('text');
    lbl.setAttribute('x', SC_MARGIN.left - 8);
    lbl.setAttribute('y', y);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('dominant-baseline', 'central');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';   // inline gana a .s-tick
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v);
    axisG.appendChild(lbl);
  });

  // Títulos de ejes
  const xT = sc_ns('text');
  xT.setAttribute('x', SC_MARGIN.left + PLOT_W / 2);
  xT.setAttribute('y', SC_MARGIN.top + PLOT_H + (bigFmt ? 66 : 44));
  xT.setAttribute('text-anchor', 'middle');
  xT.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xT.style.fontSize = SIZES.axisTitle + 'px';   // inline gana a .s-axis-title
  xT.setAttribute('font-weight', 500);
  xT.setAttribute('fill', '#7A6E62');
  // Eje X simple (regla del N°3: ejes simples, metodología + período en la
  // nota de Datos). El período del slider se inyecta en la nota del PNG.
  xT.textContent = (typeof t === 'function')
    ? t('c4-axis-x')
    : '% del talento que se dedicó al fútbol';
  svg.appendChild(xT);

  const yT = sc_ns('text');
  yT.setAttribute('x', -(SC_MARGIN.top + PLOT_H / 2));
  yT.setAttribute('y', (mobile || mobilePng) ? 36 : (square || newsletter) ? 30 : 18);
  yT.setAttribute('transform', 'rotate(-90)');
  yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yT.style.fontSize = SIZES.axisTitle + 'px';   // inline gana a .s-axis-title
  yT.setAttribute('font-weight', 500);
  yT.setAttribute('fill', '#7A6E62');
  yT.textContent = (typeof t === 'function')
    ? t('c4-axis-y')
    : 'Año mediano de fundación de los clubes (ponderado por relevancia)';
  svg.appendChild(yT);

  // === Hover/dimming ===
  const s4 = state[4];
  const hoverConf = s4.hoverConf;
  const hiddenConfs = s4.hiddenConfs;
  const selectedSet = s4.selectedCountries instanceof Set
    ? s4.selectedCountries
    : new Set(s4.selectedCountries || []);
  s4.selectedCountries = selectedSet;
  // Al elegir país(es) (chip/clic), los preseleccionados por default
  // (CONMEBOL + SC_DEFAULT_LABELED) se desinflan y el realce pasa a los chips
  // (misma lógica que el scatter Elo/PIB).
  const hasSelection = selectedSet.size > 0;

  const drawables = pts.filter(p =>
    !hiddenConfs.has(p.confed) || selectedSet.has(p.iso3) || p.confed === hoverConf
  );

  // Sort: CONMEBOL al frente, selected al tope.
  const ordered = drawables.slice().sort((a, b) => {
    const score = d => {
      let s = 0;
      if (d.confed === 'CONMEBOL') s += 1;
      if (hoverConf && d.confed === hoverConf) s += 5;
      if (selectedSet.has(d.iso3)) s += 10;
      return s;
    };
    return score(a) - score(b);
  });

  // Tooltip
  const tooltip = document.getElementById('tooltip1');

  const ptsG = sc_ns('g'); svg.appendChild(ptsG);
  ordered.forEach(d => {
    const cx = xScale(d.share);
    const cy = yScale(d.clubAge);
    const isSel = selectedSet.has(d.iso3);
    const isAuto = d.confed === 'CONMEBOL' && !hasSelection;  // desinfla con chips
    const isHov = hoverConf && d.confed === hoverConf;
    const isDim = hoverConf && !isHov && !isSel;

    let r, op, stroke, sw;
    if (isSel) {
      r = SC_POINT_R_SELECTED * ptScale; op = 0.95; stroke = '#1A1A1A'; sw = 1.1;
    } else if (isAuto) {
      r = SC_POINT_R_LABELED * ptScale; op = 0.95; stroke = '#1A1A1A'; sw = 0.9;
    } else if (isHov) {
      r = 5.5 * ptScale; op = 0.9; stroke = '#1A1A1A'; sw = 0.7;
    } else {
      r = SC_POINT_R_OTHER * ptScale; op = 0.78; stroke = 'white'; sw = 0.5;
    }
    const c = sc_ns('circle');
    c.setAttribute('class', 's-point' + (isDim ? ' s-dim' : ''));
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', SC_CONF_COLORS[d.confed] || SC_CONF_COLORS['']);
    c.setAttribute('fill-opacity', op);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', sw);
    if (tooltip) {
      c.addEventListener('mouseenter', (e) => sc_showTooltip(e, d, tooltip));
      c.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
      c.addEventListener('mousemove',  (e) => sc_positionTooltip(e, tooltip));
    }
    c.addEventListener('click', (ev) => {
      ev.stopPropagation();
      sc_toggleSelect(d.iso3);
    });
    ptsG.appendChild(c);
  });

  // === Labels ===
  // Auto-label: CONMEBOL completo + SC_DEFAULT_LABELED (USA, ESP, ...).
  // Manual: selectedCountries (click en punto / búsqueda).
  // Hover: si hay hoverConf, etiquetar esa confed entera mientras el
  //   mouse está sobre el chip de la leyenda.
  // Editor: aeCountries override completo si el editor sidebar tiene
  //   lista propia.
  const labelsG = sc_ns('g'); svg.appendChild(labelsG);
  const labelTargets = [];
  if (aeCountries && aeCountries.size > 0) {
    aeCountries.forEach(iso => {
      const d = pts.find(p => p.iso3 === iso);
      if (d) labelTargets.push(d);
    });
  } else {
    pts.forEach(d => {
      const isConmebolAuto = d.confed === 'CONMEBOL' && !hiddenConfs.has('CONMEBOL');
      const isDefaultLabeled = SC_DEFAULT_LABELED.has(d.iso3)
        && !hiddenConfs.has(d.confed);
      // Los preseleccionados (CONMEBOL + default) solo si NO hay chips.
      if ((isConmebolAuto || isDefaultLabeled) && !hasSelection) labelTargets.push(d);
      else if (selectedSet.has(d.iso3)) labelTargets.push(d);
      else if (hoverConf && d.confed === hoverConf) labelTargets.push(d);
    });
  }
  // Layout greedy de labels — intenta 8 offsets cardinales para evitar
  // que se pisen entre sí (Suecia/Países Bajos, Paraguay/Uruguay, etc.).
  // Para cada label probamos en orden:
  //   1. Derecha (default): centro a la derecha del punto.
  //   2. Cardinales: arriba, debajo, izquierda.
  //   3. Diagonales: NE, SE, NO, SO.
  // Si ninguna entra sin pisar, usamos la primera (default) y aceptamos
  // el solapamiento — es preferible mostrar la etiqueta a esconderla.
  const fontSize = SIZES.label;
  const placed = [];  // bboxes ya colocadas

  // Sort para priorizar CONMEBOL y selected al ubicar primero (les damos
  // la mejor posición; los auto-labeled cedidos resuelven después).
  const labelPriority = (d) => {
    if (selectedSet.has(d.iso3)) return 0;
    if (d.confed === 'CONMEBOL') return 1;
    return 2;
  };
  labelTargets.sort((a, b) => labelPriority(a) - labelPriority(b));

  // Offsets en orden de preferencia. dx/dy en pixeles, anchor para text-anchor.
  const OFFSETS = [
    { dx:  8, dy:  3, anchor: 'start',  baseline: 'central' },   // derecha (default)
    { dx: -8, dy:  3, anchor: 'end',    baseline: 'central' },   // izquierda
    { dx:  0, dy: -8, anchor: 'middle', baseline: 'alphabetic' },// arriba
    { dx:  0, dy: 14, anchor: 'middle', baseline: 'central' },   // abajo
    { dx:  8, dy: -7, anchor: 'start',  baseline: 'alphabetic' },// NE
    { dx:  8, dy: 13, anchor: 'start',  baseline: 'central' },   // SE
    { dx: -8, dy: -7, anchor: 'end',    baseline: 'alphabetic' },// NO
    { dx: -8, dy: 13, anchor: 'end',    baseline: 'central' },   // SO
  ];

  function bboxOf(text, x, y, off, w) {
    let bx = x;
    if (off.anchor === 'middle') bx = x - w / 2;
    else if (off.anchor === 'end') bx = x - w;
    const by = off.baseline === 'central'
      ? y - fontSize * 0.65
      : (off.baseline === 'alphabetic' ? y - fontSize : y);
    return { x: bx, y: by, w: w, h: fontSize * 1.15 };
  }
  function overlaps(a, b) {
    return !(a.x + a.w + 1 < b.x || b.x + b.w + 1 < a.x ||
             a.y + a.h + 1 < b.y || b.y + b.h + 1 < a.y);
  }

  // Caja de clamp: los labels pueden usar el MARGEN DERECHO (vacío, justo
  // para eso) y un poco del superior, pero no el izquierdo (eje Y) ni el
  // inferior (eje X). CLAVE para Bolivia/Uruguay, que caen al borde derecho:
  // sin esto, el clamp al área de plot los devolvía encima de su punto.
  const clampBox = { x1: SC_MARGIN.left, y1: 10,
                     x2: SC_W - 6, y2: SC_MARGIN.top + PLOT_H };
  const inClamp = (bb) => bb.x >= clampBox.x1 && bb.x + bb.w <= clampBox.x2
                       && bb.y >= clampBox.y1 && bb.y + bb.h <= clampBox.y2;

  // Pass 1: posición greedy (elige el offset que menos pisa Y entra en límites).
  // En formato grande el punto es ~2x más grande (ptScale): escalamos el
  // offset para que el label ARRANQUE despejado del círculo, no encima.
  const OFF_SCALE = bigFmt ? 2.4 : 1;
  const labelObjs = [];
  labelTargets.forEach(d => {
    const text = sc_displayName(d);
    const cx = xScale(d.share);
    const cy = yScale(d.clubAge);
    const w = sc_measureText(text, fontSize, selectedSet.has(d.iso3) ? 600 : 500) + 2;
    let chosen = OFFSETS[0];
    for (const o of OFFSETS) {
      const bb = bboxOf(text, cx + o.dx * OFF_SCALE, cy + o.dy * OFF_SCALE, o, w);
      // Solo elegir si no pisa Y (en grande) entra en la caja de clamp.
      if (!placed.some(p => overlaps(bb, p)) && (!bigFmt || inClamp(bb))) { chosen = o; break; }
    }
    placed.push(bboxOf(text, cx + chosen.dx * OFF_SCALE, cy + chosen.dy * OFF_SCALE, chosen, w));
    labelObjs.push({
      d, text, cx, cy, textW: w,
      lx: cx + chosen.dx * OFF_SCALE, ly: cy + chosen.dy * OFF_SCALE,
      anchor: chosen.anchor, baseline: chosen.baseline,
      isSelected: selectedSet.has(d.iso3),
    });
  });

  // Radio real del punto de cada label (para repulsión y línea guía).
  const labelPtR = (l) => l.isSelected ? SC_POINT_R_SELECTED * ptScale
    : (l.d.confed === 'CONMEBOL' && !hasSelection) ? SC_POINT_R_LABELED * ptScale
    : SC_POINT_R_OTHER * ptScale;

  // Pass 2 (formatos grandes): anti-colisión 2D + repulsión de puntos (corre
  // los labels de encima de los puntos, ej. Perú/Chile, Bolivia/Uruguay).
  if (bigFmt) {
    const obstacles = labelObjs.map(l => ({ x: l.cx, y: l.cy, r: labelPtR(l) }));
    sc_relaxLabels(labelObjs, fontSize, clampBox, 260, obstacles);

    // Pass 3a: líneas guía grises (van bajo los labels, sobre los puntos).
    const leaderG = sc_ns('g'); svg.insertBefore(leaderG, labelsG);
    labelObjs.forEach(l => {
      const B = sc_labelBox(l, fontSize);
      const Px = l.cx, Py = l.cy, r = labelPtR(l);
      const nx = Math.max(B.x1, Math.min(Px, B.x2));
      const ny = Math.max(B.y1, Math.min(Py, B.y2));
      const dx = nx - Px, dy = ny - Py, dist = Math.hypot(dx, dy);
      if (dist > r + 7) {
        const ux = dx / dist, uy = dy / dist;
        const line = sc_ns('line');
        line.setAttribute('x1', Px + ux * r); line.setAttribute('y1', Py + uy * r);
        line.setAttribute('x2', nx - ux * 2); line.setAttribute('y2', ny - uy * 2);
        line.setAttribute('stroke', '#9a9488');
        line.setAttribute('stroke-width', 1.4);
        line.setAttribute('stroke-opacity', 0.7);
        line.setAttribute('stroke-linecap', 'round');
        leaderG.appendChild(line);
      }
    });
  }

  // Pass 3b: dibujar los textos.
  labelObjs.forEach(l => {
    const d = l.d;
    const txt = sc_ns('text');
    txt.setAttribute('class', 's-country-label' + (l.isSelected ? ' s-labeled-label' : ''));
    txt.setAttribute('x', l.lx);
    txt.setAttribute('y', l.ly);
    txt.setAttribute('text-anchor', l.anchor);
    if (l.baseline === 'central') txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    txt.style.fontSize = fontSize + 'px';   // inline gana a .s-country-label
    txt.style.fontWeight = (l.isSelected || bigFmt) ? 700 : 500;
    txt.setAttribute('fill', SC_CONF_LABEL_COLORS[d.confed] || '#444');
    txt.style.stroke = 'var(--bg)';
    txt.style.strokeWidth = (bigFmt ? 6 : 2.5) + 'px';   // halo fuerte en grande
    txt.style.paintOrder = 'stroke';
    txt.style.strokeLinejoin = 'round';
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // NO re-renderizamos la leyenda acá: recrearla durante el draw genera el
  // bug del hover "pegado" — el browser dispara mouseenter en el chip
  // recién recreado bajo el cursor y mouseleave del viejo se pierde.

  // Título/subtítulo dinámicos: insight en el estado por default; neutral si
  // el usuario cambió selección, período, filtro de vistas o mín. deportistas.
  const isDefaultView = selectedSet.size === 0 && hiddenConfs.size === 0
    && s4.hiViews === SC_HI_VIEWS_DEFAULT && s4.minN === SC_MIN_N_DEFAULT
    && s4.period[0] === SC_PERIOD_DEFAULT[0] && s4.period[1] === SC_PERIOD_DEFAULT[1];
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('4', isDefaultView, {
      title: 'c4-title', titleNeutral: 'c4-title-neutral',
      subtitle: 'c4-subtitle', subtitleNeutral: 'c4-subtitle-neutral'
    });
  }
}

//==================================================================
//  Tooltip
//==================================================================
function sc_showTooltip(e, d, tooltip) {
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const sharePct = (d.share * 100).toFixed(1) + '%';
  tooltip.innerHTML = `
    <strong>${sc_displayName(d)}</strong>
    <div class="tt-region" style="color:${SC_CONF_COLORS[d.confed] || '#888'}">${d.confed || '—'}</div>
    <div class="tt-row"><span>${tt('c4-tt-share', 'Fútbol / deportes físicos')}</span><span>${sharePct}</span></div>
    <div class="tt-row"><span>${tt('c4-tt-clubage', 'Año mediano clubes')}</span><span>${d.clubAge}</span></div>
    <div class="tt-row tt-row-sub"><span>${tt('c4-tt-cohort', 'Cohorte (deportistas físicos)')}</span><span>${d.totFut} / ${d.totAll}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  sc_positionTooltip(e, tooltip);
}

function sc_positionTooltip(e, tooltip) {
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const x = e.clientX - wrap.left;
  const y = e.clientY - wrap.top;
  const ttW = tooltip.offsetWidth, ttH = tooltip.offsetHeight;
  let px = x + 14, py = y - ttH - 8;
  if (px + ttW > wrap.width) px = x - ttW - 14;
  if (py < 0) py = y + 18;
  tooltip.style.left = px + 'px';
  tooltip.style.top  = py + 'px';
}

//==================================================================
//  Legend (chips clickeables)
//==================================================================
function renderTalentoClubesLegend() {
  const container = document.querySelector('.m-legend[data-chart="4"]');
  if (!container) return;
  container.innerHTML = '';
  const hiddenConfs = state[4].hiddenConfs;
  SC_CONF_ORDER.forEach(conf => {
    const chip = document.createElement('span');
    chip.className = 'm-legend-chip';
    chip.dataset.confed = conf;
    if (hiddenConfs.has(conf)) chip.classList.add('inactive');
    chip.innerHTML = `
      <span class="m-legend-swatch" style="background:${SC_CONF_COLORS[conf]}"></span>
      <span class="m-legend-label">${conf}</span>
    `;
    chip.addEventListener('mouseenter', () => {
      if (state[4].hiddenConfs.has(conf)) return;
      state[4].hoverConf = conf;
      state[4].stickyConf = conf;
      drawTalentoClubes();
    });
    chip.addEventListener('mouseleave', () => {
      state[4].hoverConf = null;
      drawTalentoClubes();
    });
    chip.addEventListener('click', () => {
      const h = state[4].hiddenConfs;
      if (h.has(conf)) h.delete(conf); else h.add(conf);
      state[4].hoverConf = null;
      renderTalentoClubesLegend();
      drawTalentoClubes();
    });
    container.appendChild(chip);
  });
}

//==================================================================
//  Toggle select (click en punto)
//==================================================================
function sc_toggleSelect(iso3) {
  if (!(state[4].selectedCountries instanceof Set)) {
    state[4].selectedCountries = new Set(state[4].selectedCountries || []);
  }
  const sel = state[4].selectedCountries;
  if (sel.has(iso3)) sel.delete(iso3); else sel.add(iso3);
  if (typeof renderTalentoClubesChips === 'function') renderTalentoClubesChips();
  drawTalentoClubes();
}

//==================================================================
//  Slider rango (idéntico al del scatter del chart 1)
//==================================================================
function setupTalentoClubesSlider() {
  const fromEl = document.getElementById('sc-slider-from');
  const toEl   = document.getElementById('sc-slider-to');
  const dispEl = document.getElementById('sc-range-display');
  const trackActiveEl = document.getElementById('sc-range-track-active');
  if (!fromEl || !toEl || !dispEl) return;

  function updateDisplay() {
    const [a, b] = state[4].period;
    dispEl.textContent = `${a}–${b}`;
    if (trackActiveEl) {
      const min = parseInt(fromEl.min, 10);
      const max = parseInt(fromEl.max, 10);
      const span = max - min;
      if (span > 0) {
        trackActiveEl.style.left  = ((a - min) / span * 100) + '%';
        trackActiveEl.style.right = ((max - b) / span * 100) + '%';
      }
    }
  }
  function sync() {
    fromEl.value = state[4].period[0];
    toEl.value   = state[4].period[1];
  }
  function onFrom() {
    let from = parseInt(fromEl.value, 10);
    let to   = state[4].period[1];
    if (from > to - SC_MIN_WINDOW) from = to - SC_MIN_WINDOW;
    state[4].period = [from, to];
    sync(); updateDisplay(); drawTalentoClubes();
  }
  function onTo() {
    let from = state[4].period[0];
    let to   = parseInt(toEl.value, 10);
    if (to < from + SC_MIN_WINDOW) to = from + SC_MIN_WINDOW;
    state[4].period = [from, to];
    sync(); updateDisplay(); drawTalentoClubes();
  }
  fromEl.addEventListener('input', onFrom);
  toEl.addEventListener('input', onTo);
  sync(); updateDisplay();
}

//==================================================================
//  Toggle "+5k views" + input min deportistas
//==================================================================
function setupTalentoClubesControls() {
  const hiCb = document.getElementById('sc-hi-views');
  if (hiCb) {
    hiCb.checked = state[4].hiViews;
    hiCb.addEventListener('change', () => {
      state[4].hiViews = hiCb.checked;
      drawTalentoClubes();
    });
  }
  const minEl = document.getElementById('sc-min-n');
  if (minEl) {
    minEl.value = state[4].minN;
    minEl.addEventListener('input', () => {
      const v = parseInt(minEl.value, 10);
      if (!isNaN(v) && v >= 3) {
        state[4].minN = v;
        drawTalentoClubes();
      }
    });
  }
}

//==================================================================
//  Buscador de país (mismo patrón que el scatter del chart 1)
//==================================================================
function sc_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function sc_searchableCountries() {
  if (!sc_data) sc_initDataFromGlobal();
  // Solo países con clubAge (los que pueden aparecer en el scatter).
  return sc_data
    .filter(d => d.clubAge != null)
    .map(d => ({ iso3: d.iso3, name: sc_displayName(d), confed: d.confed || '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function setupTalentoClubesSearch() {
  const input = document.getElementById('sc-search');
  const results = document.getElementById('sc-search-results');
  if (!input || !results) return;

  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = sc_normalize(q);
    return sc_searchableCountries()
      .filter(c => sc_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[4].selectedCountries instanceof Set
        ? state[4].selectedCountries.has(c.iso3)
        : (state[4].selectedCountries || []).includes(c.iso3);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso3}">${c.name}<span class="m-search-region">${c.confed}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        sc_toggleSelect(el.dataset.iso);
        input.value = '';
        results.classList.remove('open');
      });
    });
  }
  input.addEventListener('input', (e) => {
    currentMatches = getMatches(e.target.value);
    activeIdx = -1;
    renderResults(currentMatches, activeIdx);
  });
  input.addEventListener('keydown', (ev) => {
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
      sc_toggleSelect(currentMatches[activeIdx].iso3);
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

function renderTalentoClubesChips() {
  const container = document.getElementById('sc-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  if (!(state[4].selectedCountries instanceof Set)) {
    state[4].selectedCountries = new Set(state[4].selectedCountries || []);
  }
  if (!sc_data) sc_initDataFromGlobal();
  const byIso = {};
  sc_data.forEach(d => byIso[d.iso3] = d);
  const arr = Array.from(state[4].selectedCountries)
    .map(iso => byIso[iso])
    .filter(Boolean)
    .sort((a, b) => sc_displayName(a).localeCompare(sc_displayName(b), 'es'));
  arr.forEach(d => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = SC_CONF_COLORS[d.confed] || SC_CONF_COLORS[''];
    chip.textContent = sc_displayName(d);
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Quitar');
    x.addEventListener('click', () => sc_toggleSelect(d.iso3));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

//==================================================================
//  CSV download
//==================================================================
function setupTalentoClubesCsv() {
  document.querySelectorAll('button.download[data-chart="4-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pts = sc_computePoints();
      pts.sort((a, b) => a.iso3.localeCompare(b.iso3));
      const cols = ['iso3','name','confed','clubAge','share_futbol','count_futbol','count_total_phys'];
      const [y0, y1] = state[4].period;
      let csv = `# El Atlas N°3 chart 4 — Share futbol vs antiguedad clubes\n`;
      csv += `# Periodo: ${y0}-${y1}  hi_views: ${state[4].hiViews ? 'true' : 'false'}  min_N: ${state[4].minN}\n`;
      csv += cols.join(',') + '\n';
      pts.forEach(p => {
        const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[p.iso3]?.en) || p.name;
        const nameQ = (name.includes(',') || name.includes('"'))
          ? '"' + name.replace(/"/g, '""') + '"'
          : name;
        csv += [p.iso3, nameQ, p.confed, p.clubAge, p.share.toFixed(4), p.totFut, p.totAll].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (typeof LANG !== 'undefined' && LANG === 'en')
        ? 'the-atlas-03-football-share-vs-club-age.csv'
        : 'el-atlas-03-share-futbol-vs-clubes.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initTalentoClubes() {
  if (!state[4]) {
    state[4] = {
      period: [...SC_PERIOD_DEFAULT],
      hiViews: SC_HI_VIEWS_DEFAULT,
      minN: SC_MIN_N_DEFAULT,
      hoverConf: null,
      stickyConf: 'CONMEBOL',
      hiddenConfs: new Set(),
      selectedCountries: new Set(),
    };
  } else {
    if (!state[4].period)   state[4].period = [...SC_PERIOD_DEFAULT];
    if (state[4].hiViews == null) state[4].hiViews = SC_HI_VIEWS_DEFAULT;
    if (!state[4].minN)     state[4].minN = SC_MIN_N_DEFAULT;
    if (!state[4].hiddenConfs) state[4].hiddenConfs = new Set();
    if (!state[4].selectedCountries) state[4].selectedCountries = new Set();
    if (state[4].hoverConf == null) state[4].hoverConf = null;
    if (state[4].stickyConf == null) state[4].stickyConf = 'CONMEBOL';
  }

  renderTalentoClubesLegend();
  setupTalentoClubesSlider();
  setupTalentoClubesControls();
  setupTalentoClubesSearch();
  setupTalentoClubesCsv();
  renderTalentoClubesChips();
  drawTalentoClubes();

  if (!initTalentoClubes._editorWired) {
    initTalentoClubes._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawTalentoClubes());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  // Soporte de formato PNG: png-export usa 'square' por default al clic y
  // fuerza el re-render en ese formato vía estos globals (mismo patrón que el
  // scatter Elo/PIB → ahora el PNG del chart 4 también sale cuadrado).
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawTalentoClubes;

  // Hook para el PNG export: sources distinto según el toggle "+5k views".
  // Sin esto, el PNG default (con toggle OFF) mostraba el texto largo
  // explicando el toggle — confunde porque el toggle NO se aplicó.
  window.onBeforePngExportGetSourceText = function(chartId) {
    if (chartId !== '4') return null;
    const key = state[4].hiViews ? 'c4-sources-with-filter' : 'c4-sources-no-filter';
    const base = (typeof t === 'function') ? t(key) : '';
    if (!base) return null;
    // El eje X se simplificó: el período de nacimiento (años del slider) se
    // explicita acá, en la nota.
    const p = state[4].period || SC_PERIOD_DEFAULT;
    const periodTxt = (typeof LANG !== 'undefined' && LANG === 'en')
      ? ' Birth period: ' + p[0] + '–' + p[1] + '.'
      : ' Período de nacimiento: ' + p[0] + '–' + p[1] + '.';
    return base + periodTxt;
  };
}
