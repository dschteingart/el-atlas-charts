// =============================================================
//  El Atlas N°3 — Talento futbolístico per cápita (chart 2)
// =============================================================
//
// Barras horizontales: futbolistas en el top N mundial de HPI Pantheon
// dividido por la población promedio del país en el período de nacimiento
// elegido. Pone Uruguay arriba y muestra la "cantera" sudamericana.
//
// Inputs:
//   - PLAYERS_TALENTO: array [[iso3, birth_year, hpi], ...] ordenado por
//     hpi descendente. ~21k jugadores con birthyear + país + hpi.
//   - POP_TALENTO: {iso3: {year_str: pop_thousands}} OWID población anual.
//
// State (state[2]):
//   - period: [year_from, year_to] del slider de nacimiento (default 1900-2010)
//   - topN: 1000 | 5000 | 10000
//   - selected: array de iso3 a comparar (default 13 países)
//
// Caso Japón documentado en build_talento_data.py: HPI Pantheon penaliza
// dominancia de Wikipedia inglesa. J-League menores con artículo solo en
// ja.wp aparecen sobre-representados. El top 1000 mitiga, top 10000
// amplifica. El default 1000 cuenta la historia editorial sin distorsión.

//==================================================================
//  Constantes
//==================================================================
const TA_W = 1100, TA_H = 440;
const TA_MARGIN_DESKTOP = { top: 28, right: 88, bottom: 48, left: 132 };
const TA_MARGIN_MOBILE  = { top: 28, right: 60, bottom: 56, left: 110 };
const TA_BAR_H = 20;
const TA_BAR_GAP = 5;

// Colores: usamos la paleta terracota del Atlas para CONMEBOL/sudamericanos
// (BE5D32) y un gris-azulado neutral para el resto. Esto refuerza visualmente
// la historia: las barras más altas son las "rojas" sudamericanas.
const TA_COLOR_CONMEBOL = '#BE5D32';
const TA_COLOR_OTHER    = '#5E7E96';
const TA_COLOR_AXIS     = '#9C928A';
// Las 10 selecciones de la CONMEBOL con sus ISO 3166-1 alpha-3 oficiales.
// OJO: Paraguay es PRY, no PAR (PAR es el IOC code, no el ISO 3166-1).
// El chart 1 (scatter.js) usa la misma lista — debe quedar sincronizada.
const TA_CONMEBOL_ISOS = new Set([
  'ARG','BOL','BRA','CHL','COL','ECU','PER','PRY','URY','VEN'
]);

const TA_TOP_N_OPTIONS = [1000, 5000, 10000];
const TA_PERIOD_DEFAULT = [1850, 2015];
const TA_PERIOD_MIN = 1850;
const TA_PERIOD_MAX = 2015;
const TA_MIN_WINDOW = 5;  // mínimo 5 años entre thumbs
// 18 países por default. Incluye los 13 iniciales más NLD, PRY, DNK, SWE,
// BEL — todos países que aparecen en el podio (top 7 mundial por millón)
// en al menos UN escenario de período/topN. NLD desbanca a Uruguay en
// 1940-1980. BEL en 1990-2010 top1000 (generación dorada).
const TA_DEFAULT_SELECTED = [
  'URY','HRV','ARG','BRA','ESP','FRA','ITA','DEU','PRT','USA','CHN','RUS','GBR',
  'NLD','PRY','DNK','SWE','BEL'
];

const TA_SVG_NS = 'http://www.w3.org/2000/svg';
const ta_ns = (tag) => document.createElementNS(TA_SVG_NS, tag);

// Márgenes por formato de PNG (mobile-first). Left amplio para los nombres de
// país a tamaño grande; right para los valores.
function ta_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 40, right: 96, bottom: 84, left: 210 };
    case 'square':     return { top: 40, right: 96, bottom: 84, left: 210 };
    case 'mobile':     return { top: 28, right: 60, bottom: 56, left: 150 };
    default:           return null;
  }
}

//==================================================================
//  Helpers
//==================================================================

function ta_displayName(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}

function ta_measureText(text, fontSize, weight) {
  if (!ta_measureText._ctx) {
    const c = document.createElement('canvas');
    ta_measureText._ctx = c.getContext('2d');
  }
  const ctx = ta_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function ta_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

// Agrupación: país (default) ↔ región (confederación FIFA).
function ta_isRegion() { return !!(state[2] && state[2].group === 'region'); }

//==================================================================
//  Cómputo de la métrica
//==================================================================
// Para cada país seleccionado:
//   - Filtra el top N global de HPI a los jugadores con bplace_country == iso
//     y birthyear ∈ [y0, y1].
//   - Promedia la población anual del período (avg de pop[iso][y]).
//   - rate = (count / avg_pop_millions) = count × 1000 / avg_pop_thousands.
//
// Devuelve array ordenado por rate desc.
function ta_computeRates() {
  const s = state[2];
  const [y0, y1] = s.period;
  const N = s.topN;

  // Top N global. PLAYERS_TALENTO ya está ordenado por hpi desc, así que
  // slice es O(N) y barato.
  const topPool = PLAYERS_TALENTO.slice(0, N);

  // === REGIÓN (confederación) ===
  // Numerador y denominador AGREGADOS por confederación, recién ahí se divide:
  // futbolistas de todos los países de la confed ÷ población total de la confed
  // (suma de TODOS sus países miembro, no solo los que tienen futbolistas).
  if (s.group === 'region' && typeof CONFED_TALENTO !== 'undefined' && typeof POP_CONFED_TALENTO !== 'undefined') {
    const num = {};
    for (let i = 0; i < topPool.length; i++) {
      const p = topPool[i];
      if (p[1] < y0 || p[1] > y1) continue;
      const c = CONFED_TALENTO[p[0]];
      if (c) num[c] = (num[c] || 0) + 1;
    }
    const order = (typeof CONF_FIFA_ORDER !== 'undefined') ? CONF_FIFA_ORDER
      : ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
    const out = order.filter(c => POP_CONFED_TALENTO[c]).map(c => {
      const ser = POP_CONFED_TALENTO[c];
      let sumPop = 0, nYears = 0;
      for (let y = y0; y <= y1; y++) { const v = ser[String(y)]; if (v != null) { sumPop += v; nYears++; } }
      const avgPopThousands = nYears > 0 ? sumPop / nYears : 0;
      const cnt = num[c] || 0;
      const rate = avgPopThousands > 0 ? (cnt * 1000) / avgPopThousands : 0;
      return { iso: c, confed: c, count: cnt, avgPopMillions: avgPopThousands / 1000, rate };
    });
    out.sort((a, b) => b.rate - a.rate);
    return out;
  }

  // === PAÍS (default) ===
  // Contar por iso, filtrando por birth year.
  const counts = {};
  for (let i = 0; i < topPool.length; i++) {
    const p = topPool[i];
    if (p[1] < y0 || p[1] > y1) continue;
    counts[p[0]] = (counts[p[0]] || 0) + 1;
  }

  // Avg pop por país en el período. Si un país no tiene pop para el rango
  // completo, promediamos lo que haya. Si no hay nada, rate = 0.
  const out = s.selected.map(iso => {
    const popByYear = POP_TALENTO[iso] || {};
    let sumPop = 0, nYears = 0;
    for (let y = y0; y <= y1; y++) {
      const v = popByYear[String(y)];
      if (v != null) { sumPop += v; nYears++; }
    }
    const avgPopThousands = nYears > 0 ? sumPop / nYears : 0;
    const c = counts[iso] || 0;
    const rate = avgPopThousands > 0 ? (c * 1000) / avgPopThousands : 0;
    return {
      iso,
      count: c,
      avgPopMillions: avgPopThousands / 1000,
      rate
    };
  });
  out.sort((a, b) => b.rate - a.rate);
  return out;
}

//==================================================================
//  Renderer SVG (barras horizontales)
//==================================================================
// Actualiza el subtítulo del HTML con los años del slider y el top N.
// Forma: "Futbolistas célebres del top 1.000 mundial nacidos entre 1900
// y 2010 por millón de habitantes." Se llama al inicio y en cada cambio
// del slider o del toggle topN. El PNG es WYSIWYG → este mismo texto va
// al PNG, sin necesidad de un hook aparte.
function ta_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c2-subtitle"]');
  if (!el) return;
  const s = state[2];
  const [y0, y1] = s.period;
  const N = s.topN;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const fmtN = N.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR');
  const tpl = tt('c2-subtitle-tpl',
    'Futbolistas célebres del top {N} mundial nacidos entre {Y0} y {Y1} por millón de habitantes.');
  el.textContent = tpl.replace('{N}', fmtN).replace('{Y0}', y0).replace('{Y1}', y1);
}

function drawTalento() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';
  ta_updateSubtitle();

  // Formato activo del PNG (square por default al descargar).
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && ta_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const data = ta_computeRates();
  const n = data.length;
  const region = ta_isRegion();
  // El buscador + chips son de país; en región (6 confeds fijas) se ocultan.
  const _picker = document.getElementById('ta-country-picker');
  if (_picker) _picker.style.display = region ? 'none' : '';

  // Tamaños mobile-first (inline style). Los nombres de país son el label
  // protagonista → los más grandes.
  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12 };

  // En formato PNG la altura es FIJA (vbH) y el grosor de barra se calcula
  // para llenar el alto disponible con las n barras. En pantalla, al revés:
  // grosor fijo y altura dinámica (comportamiento original).
  let TA_W, TA_MARGIN, TA_BAR_H, TA_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    TA_W = f.vbW; totalH = f.vbH; TA_MARGIN = ta_getMargins(editorFormat);
    TA_BAR_GAP = Math.max(6, Math.round(110 / n));
    plotH = totalH - TA_MARGIN.top - TA_MARGIN.bottom;
    TA_BAR_H = (plotH - (n - 1) * TA_BAR_GAP) / n;
  } else {
    TA_W = 1100;
    TA_MARGIN = mobile ? { ...TA_MARGIN_MOBILE } : { ...TA_MARGIN_DESKTOP };
    // En mobile el viewBox es ancho (1100) y se renderiza a ~360px → el alto
    // colapsa. Barras más gruesas = gráfico bastante más alto y legible.
    TA_BAR_H = mobile ? 42 : 20; TA_BAR_GAP = mobile ? 13 : 5;
    plotH = n * (TA_BAR_H + TA_BAR_GAP) - TA_BAR_GAP;
    totalH = TA_MARGIN.top + plotH + TA_MARGIN.bottom;
  }
  svg.setAttribute('viewBox', `0 0 ${TA_W} ${totalH}`);

  // Margen izquierdo DINÁMICO: los nombres de país van a la izquierda (anchor
  // end) en x = left-8, así que un nombre más ancho que el margen se sale por
  // el borde del viewBox y el PNG lo recorta (p.ej. "Bosnia y Herzegovina" en
  // cuadrado, donde SIZES.name=28). Expandimos el margen para que entre el
  // nombre más largo de los que se muestran, con tope (no más del 42% del ancho).
  let ta_maxNameW = 0;
  data.forEach(d => { const w = ta_measureText(ta_displayName(d.iso), SIZES.name, 600); if (w > ta_maxNameW) ta_maxNameW = w; });
  if (ta_maxNameW > 0) {
    const neededLeft = Math.ceil(ta_maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(TA_W * 0.42);
    TA_MARGIN.left = Math.min(maxLeft, Math.max(TA_MARGIN.left, neededLeft));
  }

  const plotW = TA_W - TA_MARGIN.left - TA_MARGIN.right;
  const maxRate = data.length > 0 ? Math.max(...data.map(d => d.rate), 0.01) : 1;

  // Eje X: niceLinearTicks o paso simple.
  function ta_yTicks(min, max, target) {
    // Reusamos niceLinearTicks de utils.js si está cargado.
    if (typeof niceLinearTicks === 'function') {
      return niceLinearTicks(min, max, target);
    }
    const step = Math.pow(10, Math.floor(Math.log10(max / target)));
    const ticks = [];
    for (let v = 0; v <= max; v += step) ticks.push(v);
    return ticks;
  }
  const xTicks = ta_yTicks(0, maxRate * 1.05, 5);
  const xScale = (v) => TA_MARGIN.left + (v / (maxRate * 1.05)) * plotW;

  // === Grid vertical + ticks X ===
  const gridG = ta_ns('g'); svg.appendChild(gridG);
  const axisG = ta_ns('g'); svg.appendChild(axisG);
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = ta_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', TA_MARGIN.top);
    line.setAttribute('y2', TA_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = ta_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', TA_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = v.toFixed(v < 10 ? 1 : 0);
    axisG.appendChild(lbl);
  });

  // Eje X título
  const xTitle = ta_ns('text');
  xTitle.setAttribute('x', TA_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', TA_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function')
    ? t('c2-axis-x')
    : 'Futbolistas célebres por millón de habitantes';
  svg.appendChild(xTitle);

  // === Barras + labels ===
  const barsG = ta_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = TA_MARGIN.top + i * (TA_BAR_H + TA_BAR_GAP);
    const isCon = region ? (d.confed === 'CONMEBOL') : TA_CONMEBOL_ISOS.has(d.iso);
    const color = region ? ((typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[d.confed]) || TA_COLOR_OTHER) : (isCon ? TA_COLOR_CONMEBOL : TA_COLOR_OTHER);
    const nameCol = region ? ((typeof CONF_FIFA_LABEL_COLORS !== 'undefined' && CONF_FIFA_LABEL_COLORS[d.confed]) || '#3A3530') : (isCon ? '#8B4220' : '#3A3530');
    const barW = xScale(d.rate) - TA_MARGIN.left;

    // Label izquierda: nombre país
    const nameTxt = ta_ns('text');
    nameTxt.setAttribute('x', TA_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + TA_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', isCon ? 600 : 500);
    nameTxt.setAttribute('fill', nameCol);
    nameTxt.textContent = region ? d.confed : ta_displayName(d.iso);
    barsG.appendChild(nameTxt);

    // Barra. Listeners de tooltip al hover.
    const rect = ta_ns('rect');
    rect.setAttribute('x', TA_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW));
    rect.setAttribute('height', TA_BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => {
      rect.setAttribute('fill-opacity', 1);
      ta_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => ta_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', 0.92);
      ta_hideTooltip();
    });
    barsG.appendChild(rect);

    // Valor numérico a la derecha de la barra (sin el "(n=X)" — eso va al
    // tooltip ahora, mantiene el chart visualmente más limpio).
    const valTxt = ta_ns('text');
    valTxt.setAttribute('x', TA_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + TA_BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = d.rate >= 10
      ? d.rate.toFixed(1)
      : d.rate.toFixed(2);
    barsG.appendChild(valTxt);
  });

  // Linea cero
  const zeroLine = ta_ns('line');
  zeroLine.setAttribute('x1', TA_MARGIN.left); zeroLine.setAttribute('x2', TA_MARGIN.left);
  zeroLine.setAttribute('y1', TA_MARGIN.top);
  zeroLine.setAttribute('y2', TA_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', TA_COLOR_AXIS);
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);

  // Título dinámico: el insight ("Uruguay produce más…") solo en el estado
  // por default; neutral si el usuario cambió período, top N o la selección.
  // El subtítulo ya es descriptivo, no cambia.
  const s2 = state[2];
  const periodDefault = s2.period[0] === TA_PERIOD_DEFAULT[0]
    && s2.period[1] === TA_PERIOD_DEFAULT[1] && s2.topN === 1000;
  if (typeof atlasSetHeading === 'function') {
    if (region) {
      // Región tiene su propio insight (Sudamérica #1) en el estado por default.
      atlasSetHeading('2', periodDefault, { title: 'c2-title-region', titleNeutral: 'c2-title-neutral' });
    } else {
      const selDefault = s2.selected.length === TA_DEFAULT_SELECTED.length
        && TA_DEFAULT_SELECTED.every(iso => s2.selected.includes(iso));
      atlasSetHeading('2', selDefault && periodDefault, { title: 'c2-title', titleNeutral: 'c2-title-neutral' });
    }
  }
}

//==================================================================
//  Tooltip
//==================================================================
function ta_fmtNumber(n, decimals) {
  if (n == null || !isFinite(n)) return '—';
  // Locale ES: separador de miles "." y decimal ",". Mantenemos
  // tabular-nums vía CSS para que las cifras alineen.
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  return n.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function ta_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const name = d.confed ? d.confed : ta_displayName(d.iso);
  // d.avgPopMillions y d.rate ya vienen calculadas en computeRates.
  const popLbl  = tt('c2-tt-pop',   'Población promedio');
  const cntLbl  = tt('c2-tt-count', 'Cantidad de futbolistas célebres');
  const rateLbl = tt('c2-tt-rate',  'Futbolistas célebres por millón');
  tooltip.innerHTML = `
    <strong>${name}</strong>
    <div class="tt-row"><span>${cntLbl}</span><span>${ta_fmtNumber(d.count, 0)}</span></div>
    <div class="tt-row"><span>${popLbl}</span><span>${ta_fmtNumber(d.avgPopMillions, 1)} M</span></div>
    <div class="tt-row tt-row-strong"><span>${rateLbl}</span><span>${ta_fmtNumber(d.rate, d.rate >= 10 ? 1 : 2)}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  ta_positionTooltip(event);
}

function ta_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip || !tooltip.parentElement) return;
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const x = event.clientX - wrap.left;
  const y = event.clientY - wrap.top;
  const ttW = tooltip.offsetWidth;
  const ttH = tooltip.offsetHeight;
  // Anclado arriba-derecha del cursor. Si se sale, voltea.
  let px = x + 14;
  let py = y - ttH - 8;
  if (px + ttW > wrap.width) px = x - ttW - 14;
  if (py < 0) py = y + 18;
  tooltip.style.left = px + 'px';
  tooltip.style.top  = py + 'px';
}

function ta_hideTooltip() {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Slider range birth year (mismo patrón que el scatter del N°3)
//==================================================================
function setupTalentoSlider() {
  const fromEl = document.getElementById('ta-slider-from');
  const toEl   = document.getElementById('ta-slider-to');
  const dispEl = document.getElementById('ta-range-display');
  const trackActiveEl = document.getElementById('ta-range-track-active');
  if (!fromEl || !toEl || !dispEl) return;

  function updateDisplay() {
    const [a, b] = state[2].period;
    dispEl.textContent = `${a}–${b}`;
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
  function sync() {
    fromEl.value = state[2].period[0];
    toEl.value   = state[2].period[1];
  }
  function onChangeFrom() {
    let from = parseInt(fromEl.value, 10);
    let to   = state[2].period[1];
    if (from > to - TA_MIN_WINDOW) from = to - TA_MIN_WINDOW;
    state[2].period = [from, to];
    sync(); updateDisplay(); drawTalento();
  }
  function onChangeTo() {
    let from = state[2].period[0];
    let to   = parseInt(toEl.value, 10);
    if (to < from + TA_MIN_WINDOW) to = from + TA_MIN_WINDOW;
    state[2].period = [from, to];
    sync(); updateDisplay(); drawTalento();
  }
  fromEl.addEventListener('input', onChangeFrom);
  toEl.addEventListener('input', onChangeTo);
  sync(); updateDisplay();
}

//==================================================================
//  Toggle top N
//==================================================================
function setupTalentoTopN() {
  document.querySelectorAll('.m-mode-toggle[data-toggle="topn"] button').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.topn, 10);
      if (!TA_TOP_N_OPTIONS.includes(n)) return;
      state[2].topN = n;
      document.querySelectorAll('.m-mode-toggle[data-toggle="topn"] button')
        .forEach(b => b.classList.toggle('active', parseInt(b.dataset.topn, 10) === n));
      drawTalento();
    });
  });
}

// Toggle País ↔ Región (confederación).
function setupTalentoGroup() {
  document.querySelectorAll('.m-mode-toggle[data-toggle="group"] button').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.group;
      if (g !== 'pais' && g !== 'region') return;
      if (state[2].group === g) return;
      state[2].group = g;
      document.querySelectorAll('.m-mode-toggle[data-toggle="group"] button')
        .forEach(b => b.classList.toggle('active', b.dataset.group === g));
      drawTalento();
    });
  });
}

//==================================================================
//  Buscador de países + chips de seleccionados
//==================================================================
function ta_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function ta_searchableCountries() {
  // Países con AL MENOS un jugador en PLAYERS_TALENTO y AL MENOS un dato
  // de población. Eso es ~180 países (filtrado en build_talento_data.py).
  const isos = Object.keys(POP_TALENTO).sort((a, b) =>
    ta_displayName(a).localeCompare(ta_displayName(b), 'es')
  );
  return isos.map(iso => ({
    iso,
    name: ta_displayName(iso),
  }));
}

function ta_toggleSelect(iso) {
  const arr = state[2].selected;
  const idx = arr.indexOf(iso);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(iso);
  renderTalentoChips();
  drawTalento();
}

function renderTalentoChips() {
  const container = document.getElementById('ta-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  const arr = state[2].selected.slice()
    .sort((a, b) => ta_displayName(a).localeCompare(ta_displayName(b), 'es'));
  arr.forEach(iso => {
    const isCon = TA_CONMEBOL_ISOS.has(iso);
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    // Chip neutro con un puntito del color de la barra (terracota CONMEBOL /
    // azul resto). Más sobrio que el fondo de color completo.
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    dot.style.background = isCon ? TA_COLOR_CONMEBOL : TA_COLOR_OTHER;
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(ta_displayName(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
    x.addEventListener('click', () => ta_toggleSelect(iso));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupTalentoSearch() {
  const input = document.getElementById('ta-search');
  const results = document.getElementById('ta-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = ta_normalize(q);
    return ta_searchableCountries()
      .filter(c => ta_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[2].selected.includes(c.iso);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-iso="${c.iso}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ta_toggleSelect(el.dataset.iso);
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
      ta_toggleSelect(currentMatches[activeIdx].iso);
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

//==================================================================
//  Download CSV — formato detallado (país × año)
//==================================================================
// Emite una fila por (iso3 × birthyear) con población y conteos para los
// 3 top N (1.000 / 5.000 / 10.000) y las tasas por millón en ese año
// puntual. Permite al lector reconstruir cualquier rango temporal:
//
//   total_count = SUM(top1000_count) sobre [y0..y1]
//   avg_pop_M  = AVG(population_millions) sobre [y0..y1]
//   rate       = total_count / avg_pop_M
//
// (Exactamente lo que computa el chart en ta_computeRates.)
//
// El "per_million_at_year" anual es útil para análisis de cohorte sin
// agregar — pero NO es la métrica del chart, que agrega periodo.
//
// Filtra países sin player en ningún top (sus tasas serían 0 en todos
// los rangos). Para los países incluidos, emite TODOS los años con pop
// data, incluyendo los que tienen 0 jugadores en los tres tops — esto
// es CRÍTICO para que el promedio de población del rango se reconstruya
// bien. Si Argentina tiene 0 jugadores en 1900 y 2 en 1901, el rate del
// rango 1900-1901 debe usar AVG(pop_1900, pop_1901), no solo pop_1901.
function setupTalentoDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const TOPS = [1000, 5000, 10000];

      // counters[N][iso][year] = cantidad de jugadores nacidos ese año
      // que están en top N. PLAYERS_TALENTO viene ordenado por HPI desc
      // (script Python), así que slice(0, N) es el top N global.
      const counters = {};
      for (const N of TOPS) {
        counters[N] = {};
        const pool = PLAYERS_TALENTO.slice(0, N);
        for (let i = 0; i < pool.length; i++) {
          const iso = pool[i][0], year = pool[i][1];
          if (!counters[N][iso]) counters[N][iso] = {};
          counters[N][iso][year] = (counters[N][iso][year] || 0) + 1;
        }
      }

      // Países a incluir: con AL MENOS 1 jugador en top 10000 + pop data.
      const playerIsos = new Set();
      Object.keys(counters[10000]).forEach(iso => playerIsos.add(iso));
      const isos = Array.from(playerIsos)
        .filter(iso => POP_TALENTO[iso])
        .sort();

      const cols = [
        'iso3', 'name', 'year', 'population_millions',
        'top1000_count', 'top5000_count', 'top10000_count'
      ];
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += '# El Atlas N°3 — Futbolistas celebres por pais x ano de nacimiento\n';
      csv += '# Fuente: Pantheon Datawheel 2025 (SOCCER PLAYER masculino, views_no_en >= 5000) + OWID poblacion.\n';
      csv += '#\n';
      csv += '# Para reproducir la metrica del chart en un rango [y0, y1]:\n';
      csv += '#   total      = SUM(top{N}_count)         sobre [y0..y1]\n';
      csv += '#   avg_pop_M  = AVG(population_millions)  sobre [y0..y1]\n';
      csv += '#   per_million = total / avg_pop_M\n';
      csv += '#\n';
      csv += '# IMPORTANTE: NO calcular tasas anuales y promediarlas — el promedio\n';
      csv += '# de tasas no es igual a la tasa del promedio. Hay que agregar PRIMERO\n';
      csv += '# (sumar counts, promediar poblaciones) y dividir DESPUES.\n';
      csv += cols.join(',') + '\n';

      const YEAR_FROM = 1850, YEAR_TO = 2015;
      for (const iso of isos) {
        const name = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso].en)
          ? COUNTRY_NAMES[iso].en
          : iso;
        const popByYear = POP_TALENTO[iso] || {};
        const c1 = counters[1000][iso]  || {};
        const c5 = counters[5000][iso]  || {};
        const c10 = counters[10000][iso] || {};
        for (let y = YEAR_FROM; y <= YEAR_TO; y++) {
          const popK = popByYear[String(y)];
          if (popK == null) continue;
          const popM = popK / 1000;
          const n1  = c1[y]  || 0;
          const n5  = c5[y]  || 0;
          const n10 = c10[y] || 0;
          // NO saltamos años con 0 jugadores: el reconstructor del promedio
          // necesita la población de TODOS los años del rango, no solo los
          // que tienen al menos 1 jugador. Ver comentario arriba.
          const nameQ = (name.includes(',') || name.includes('"'))
            ? '"' + name.replace(/"/g, '""') + '"'
            : name;
          csv += [
            iso, nameQ, y, popM.toFixed(3),
            n1, n5, n10
          ].join(',') + '\n';
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lang === 'en'
        ? 'the-atlas-03-soccer-talent-per-million.csv'
        : 'el-atlas-03-talento-futbolistico-por-millon.csv';
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
function initTalento() {
  if (!state[2]) {
    state[2] = {
      period: [...TA_PERIOD_DEFAULT],
      topN: 1000,
      selected: [...TA_DEFAULT_SELECTED],
      group: 'pais'
    };
  } else {
    if (!state[2].period)   state[2].period = [...TA_PERIOD_DEFAULT];
    if (!state[2].topN)     state[2].topN = 1000;
    if (!state[2].selected) state[2].selected = [...TA_DEFAULT_SELECTED];
    if (!state[2].group)    state[2].group = 'pais';
  }

  setupTalentoSlider();
  setupTalentoTopN();
  setupTalentoGroup();
  setupTalentoSearch();
  setupTalentoDownloadCSV();
  renderTalentoChips();
  drawTalento();

  // Editor sidebar: re-render cuando el editor cambia algo.
  if (!initTalento._editorWired) {
    initTalento._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawTalento());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  // Soporte de formato PNG: png-export usa 'square' por default al clic y
  // fuerza el re-render vía estos globals (el PNG del chart 2 sale cuadrado).
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawTalento;

  // Nota "Datos" del PNG: versión estilizada y corta (fuentes + métrica +
  // período + aclaración del terracota). El detalle metodológico queda en el
  // footer del HTML. Inyecta el top N y los años del slider.
  window.onBeforePngExportGetSourceText = function(chartId) {
    if (chartId !== '2') return null;
    const tpl = (typeof t === 'function') ? t('c2-sources-tpl') : '';
    if (!tpl) return null;
    const p = state[2].period || TA_PERIOD_DEFAULT;
    const lang = (typeof LANG !== 'undefined' && LANG === 'en') ? 'en-US' : 'es-AR';
    const N = (state[2].topN || 1000).toLocaleString(lang);
    return tpl.replace('{N}', N).replace('{Y0}', p[0]).replace('{Y1}', p[1]);
  };
}
