// =============================================================
//  deciles.js — chart 3 del N°2 "Demasiado desiguales"
// =============================================================
//
// Distribucion de ingreso por decil para una seleccion de paises, con:
//   - Toggle eje Y: Ingreso PPP/dia | Percentil mundial.
//   - Sub-toggle escala Y (solo en modo ingreso): Lineal | Log.
//   - Slider temporal 2010-2025 con play.
//   - Buscador + chips para agregar/quitar paises.
//   - End-labels al final de cada linea con anti-pisado.
//   - PNG export con leyenda inline + CSV export (todos los anos).
//
// Por defecto vienen seleccionados NOR, PRT, CHL, ARG, BRA, NER.
//
// Depende de: DATA_DECILES, REGION_WB_COLORS, REGION_WB_LABEL_COLORS,
// COUNTRY_NAMES, LANG, t, state[3], HAS_HOVER.

// =================== Constantes ===================
// Dimensiones desktop default (sin editor activo). Mobile interactivo
// (≤768px sin editor) usa portrait alto (1100×1500) cuyo aspect ratio
// matchea el container portrait (~412×540, ratio ≈0.76).
//
// Cuando hay un formato del editor activo (newsletter / square / mobile /
// public), las dimensiones vienen de PNG_FORMATS[format] en utils.js y los
// margins de d_getMargins(format). El PNG export rasteriza el SVG visible
// — no fuerza re-render.
const D_W_DESKTOP = 1100, D_H_DESKTOP = 470;
const D_W_MOBILE  = 1100, D_H_MOBILE  = 1500;
// Margin right grande en desktop (180px) para los end-labels al final de
// cada línea. En mobile usamos right 200 — los end-labels van escaladas
// (font 28 SVG) y necesitan espacio horizontal para textos típicos
// ("Argentina", "Noruega"...) que en mobile ocupan ~150-180px SVG.
// Bottom 150 da aire para el axis-x: "Decil N" en dos líneas a 32px (los
// labels usan ~91px; antes eran 240 → ~149px muertos abajo en el celu).
// Left 140 para los ticks Y escalados ("$1k", "$10k", "$100k").
const D_MARGIN_DESKTOP = { top: 24, right: 180, bottom: 56, left: 70 };
const D_MARGIN_MOBILE  = { top: 110, right: 200, bottom: 150, left: 140 };

// Margins por formato del editor (cuando el editor está activo).
function d_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 200, bottom: 100, left: 80 };
    case 'newsletter': return { top: 40, right: 200, bottom: 130, left: 80 };
    case 'square':     return { top: 50, right: 200, bottom: 140, left: 80 };
    case 'mobile':     return { top: 80, right: 180, bottom: 220, left: 100 };
    default:           return { ...D_MARGIN_DESKTOP };
  }
}

let D_W = D_W_DESKTOP, D_H = D_H_DESKTOP;
let D_MARGIN = { ...D_MARGIN_DESKTOP };
let D_PLOT_W = D_W - D_MARGIN.left - D_MARGIN.right;
let D_PLOT_H = D_H - D_MARGIN.top - D_MARGIN.bottom;

const D_DECILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const D_SLIDER_INTERVAL_MS = 320;

// Tipografias canvas para end-label measurement (debe matchear estilo CSS)
const D_LABEL_FONT_SIZE = 11.5;
const D_LABEL_FONT_WEIGHT = 600;
const D_END_LABEL_GAP = 13;       // gap minimo vertical entre end-labels

const D_DEFAULT_COUNTRIES = ['NOR', 'PRT', 'CHL', 'ARG', 'BRA', 'NER'];

// Paleta de colores para los países seleccionados en chart 3. Específica
// (no usa SELECTED_PALETTE de lib/regions.js que tiene solo 6 colores).
// 12 colores distintos en hue + valor para que la primera repetición
// recién aparezca con 13+ países seleccionados. Mezcla cool (azul, verde,
// teal, sage) y warm (gold, plum, burgundy, sienna, orange, lavender).
const D_PALETTE = [
  '#234B85',  // cobalt blue
  '#2D6A3D',  // forest green
  '#C9A227',  // gold mustard
  '#6B3D8B',  // plum
  '#2C8484',  // saturated teal
  '#7A2A3F',  // burgundy
  '#1F8AC0',  // sky blue
  '#6CB04D',  // bright olive
  '#E07A23',  // burnt orange
  '#B5639E',  // lavender
  '#8A5A35',  // sienna
  '#5A7A4F',  // sage
];

const D_SVG_NS = 'http://www.w3.org/2000/svg';
const d_ns = (tag) => document.createElementNS(D_SVG_NS, tag);

// Helper: devuelve el nombre del pais en el idioma activo.
function d_displayName(code, fallback) {
  return (COUNTRY_NAMES[code]?.[LANG]) || fallback || code;
}

// Color asignado a un código de país. Lookup por índice en
// state[3].selectedCountries ORIGINAL (no filtrado por año), así el color
// queda anclado al país y no cambia cuando el filtro temporal deja afuera
// algunos países. Bug previo: el `idx` del forEach sobre la lista filtrada
// se reasignaba al cambiar el año, causando que los países cambien de
// color durante el play del slider.
function d_colorFor(code) {
  const arr = state[3]?.selectedCountries || [];
  const idx = arr.indexOf(code);
  if (idx === -1) return '#888';
  return D_PALETTE[idx % D_PALETTE.length];
}

// Canvas reusable para medir text widths.
function d_measureText(text, fontSize, weight) {
  if (!d_measureText._ctx) {
    d_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  d_measureText._ctx.font = `${weight || 500} ${fontSize}px "Source Sans 3", sans-serif`;
  return d_measureText._ctx.measureText(text).width;
}

// =================== Escalas ===================
function d_xScale(decile) {
  // 10 decil bins distribuidos uniformemente sobre el plot.
  // Usamos posiciones del centro de cada bin.
  return D_MARGIN.left + ((decile - 1) / 9) * D_PLOT_W;
}

// Para el eje Y necesitamos el dominio segun el modo activo. Calculamos
// dinamicamente segun los paises seleccionados para el ano actual.
function d_computeYDomain(yMode, yScale, countriesData) {
  if (yMode === 'percentile') {
    return { min: 0, max: 100 };
  }
  // Ingreso: rango dinamico segun datos visibles
  let maxV = 0;
  countriesData.forEach(c => {
    c.deciles.forEach(d => {
      if (d.income_daily_ppp > maxV) maxV = d.income_daily_ppp;
    });
  });
  if (maxV === 0) maxV = 100;
  if (yScale === 'log') {
    return { min: 0.5, max: Math.max(500, Math.ceil(maxV * 1.1)) };
  }
  // Lineal: redondear hacia arriba a un nice number
  let max;
  if (maxV <= 100) max = 100;
  else if (maxV <= 200) max = 200;
  else if (maxV <= 300) max = 300;
  else if (maxV <= 500) max = 500;
  else max = Math.ceil(maxV / 100) * 100;
  return { min: 0, max };
}

function d_yScale(value, yMode, yScale, yDomain) {
  if (yMode === 'income' && yScale === 'log') {
    const lo = Math.log10(yDomain.min);
    const hi = Math.log10(yDomain.max);
    const v = Math.log10(Math.max(value, yDomain.min));
    return D_MARGIN.top + D_PLOT_H - ((v - lo) / (hi - lo)) * D_PLOT_H;
  }
  const v = Math.min(Math.max(value, yDomain.min), yDomain.max);
  return D_MARGIN.top + D_PLOT_H - ((v - yDomain.min) / (yDomain.max - yDomain.min)) * D_PLOT_H;
}

function d_yTicks(yMode, yScale, yDomain) {
  if (yMode === 'percentile') {
    return [0, 20, 40, 60, 80, 100];
  }
  if (yScale === 'log') {
    const ticks = [];
    for (let p = -1; p <= 3; p++) {
      const base = Math.pow(10, p);
      [1, 2, 5].forEach(m => {
        const v = m * base;
        if (v >= yDomain.min * 0.95 && v <= yDomain.max * 1.05) ticks.push(v);
      });
    }
    return ticks;
  }
  // Lineal
  return niceLinearTicks(yDomain.min, yDomain.max, 6);
}

function d_formatYTick(v, yMode) {
  if (yMode === 'percentile') return v;
  if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'k';
  if (v >= 1) return '$' + Math.round(v);
  return '$' + v.toFixed(1);
}

// =================== End-label placement (anti-pisado) ===================
// Algoritmo: cada label tiene un idealY (donde termina la linea, en D10).
// Hacemos sweep top-to-bottom y empujamos hacia abajo si dos labels
// estarian a < D_END_LABEL_GAP px. Si la label se desplaza > 1px de su
// ideal, se dibuja una guia corta.
function d_placeEndLabels(labels) {
  // Gap vertical entre end-labels. Escala con el viewport para que las
  // labels no se pisen aún cuando el SVG se renderea más grande.
  const editorFormat = typeof getActivePngFormat === 'function'
    ? getActivePngFormat() : null;
  const mobile = !editorFormat
    && typeof isMobileViewport === 'function' && isMobileViewport();
  const mobilePng = editorFormat === 'mobile';
  const newsletter = editorFormat === 'newsletter';
  const square = editorFormat === 'square';
  // Gap proporcional al endLabel. Con los SIZES del PNG subidos a 22 (2026-07),
  // el gap de desktop (~14) dejaba que Chile/Portugal/Brasil/Argentina se
  // pisaran; newsletter/square necesitan ~30 como mobilePng.
  const gap = (newsletter || square) ? 30 : mobilePng ? 30 : mobile ? 34 : D_END_LABEL_GAP;
  labels.sort((a, b) => a.idealY - b.idealY);
  // Forward sweep: empujar hacia abajo si choca con la previa.
  labels.forEach((l, i) => {
    if (i === 0) {
      l.y = l.idealY;
    } else {
      l.y = Math.max(l.idealY, labels[i - 1].y + gap);
    }
  });
  // Backward sweep: si la ultima quedo muy lejos, empujamos para arriba al
  // grupo anterior si era posible. Esto evita pile-up al fondo cuando hay
  // muchos paises con valores similares. (sweep simple: corregimos si las
  // ultimas quedaron tirando hacia abajo mas alla del plot bottom).
  const plotBottom = D_MARGIN.top + D_PLOT_H;
  if (labels.length > 0 && labels[labels.length - 1].y > plotBottom) {
    let overflow = labels[labels.length - 1].y - plotBottom;
    for (let i = labels.length - 1; i >= 0 && overflow > 0; i--) {
      const target = labels[i].y - overflow;
      if (i === 0 || target > labels[i - 1].y + gap) {
        labels[i].y = target;
        overflow = 0;
      } else {
        const minY = labels[i - 1].y + gap;
        const moved = labels[i].y - minY;
        labels[i].y = minY;
        overflow -= moved;
      }
    }
  }
  labels.forEach(l => {
    l.shifted = Math.abs(l.y - l.idealY) > 1;
  });
  return labels;
}

// =================== Render principal ===================
// drawDeciles quedó como WRAPPER FINO: arma el cfg desde state[3] y delega el
// dibujo a dl_draw (deciles-lines.js, el fork del motor bueno). Toda la
// interactividad (tooltip, quitar-país) vive acá y entra al motor por callbacks;
// el motor no sabe de "país"/"región". El margen derecho dinámico, el eje X
// D1..D10, la escala log y el anti-colisión backward-sweep los resuelve el motor.
function drawDeciles() {
  const svg = document.getElementById('chart3');
  if (!svg) return;

  // Config del editor (sizes/textos custom) si el panel está activo.
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeSizes = aeCfg?.sizes;

  // Formato del editor / viewport → SIZES de fuente. (Las dimensiones W/H/M y
  // el margen derecho dinámico los calcula el motor; acá solo los tamaños, que
  // en desktop dependen del editor.)
  const editorFormat = typeof getActivePngFormat === 'function'
    ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter';
  const square     = editorFormat === 'square';
  const mobilePng  = editorFormat === 'mobile';
  const mobile = !editorFormat
    && typeof isMobileViewport === 'function' && isMobileViewport();
  const SIZES = (newsletter || square)
    ? { tick: 24, tickExtra: 19, axisTitle: 24, endLabel: 22 }
    : mobilePng
    ? { tick: 28, tickExtra: 22, axisTitle: 30, endLabel: 24 }
    : mobile
    ? { tick: 32, tickExtra: 26, axisTitle: 34, endLabel: 28 }
    : {
        tick:      aeSizes?.ticks     ?? 11,
        tickExtra: aeSizes?.ticks ? Math.max(8, aeSizes.ticks - 1.5) : 9.5,
        axisTitle: aeSizes?.axisTitle ?? 11.5,
        endLabel:  aeSizes?.special   ?? D_LABEL_FONT_SIZE
      };

  const s3 = state[3];
  const yearData = DATA_DECILES.data_by_year[String(s3.year)];
  if (!yearData) { svg.innerHTML = ''; return; }
  const yMode = s3.yMode;      // 'income' | 'percentile'
  const yScale = s3.yScale;    // 'linear' | 'log' (solo si yMode=income)

  // Países del año (filtrando los sin dato) con sus datos por decil.
  const countriesData = (s3.selectedCountries || [])
    .filter(code => yearData.countries[code])
    .map(code => ({ code, ...yearData.countries[code] }));

  const yDomain = d_computeYDomain(yMode, yScale, countriesData);
  const yTicks  = d_yTicks(yMode, yScale, yDomain);

  // Títulos de eje: el custom del editor manda; si no, el default del modo.
  const customAxisY = (aeCfg?.texts?.[LANG]?.axisY || '').trim();
  const axisY = customAxisY || (yMode === 'income'
    ? t('c3-axis-y-income') + (yScale === 'log' ? ' (log)' : '')
    : t('c3-axis-y-percentile'));
  const axisX = (aeCfg?.texts?.[LANG]?.axisX || '').trim() || null;

  const tooltip = document.getElementById('tooltip3');
  const valOf = (dd) => yMode === 'income' ? dd.income_daily_ppp : dd.world_percentile;

  // Series: una por país (color anclado al código → estable durante el play).
  const series = countriesData.map(country => ({
    key: country.code,
    label: d_displayName(country.code, country.name),
    color: d_colorFor(country.code),
    country,   // para el tooltip (región / año-obs)
    pts: country.deciles.map(dd => [dd.decile, valOf(dd)]),
    markers: country.deciles.map(dd => ({ decile: dd.decile, value: valOf(dd), data: dd })),
  }));

  dl_draw({
    svgId: 'chart3', tooltipId: 'tooltip3', deciles: D_DECILES,
    decilePrefix: t('c3-decile-prefix'),
    poorestLabel: t('c3-decile-poorest'),
    richestLabel: t('c3-decile-richest'),
    sizes: SIZES,
    yScaleMode: (yMode === 'income' && yScale === 'log') ? 'log' : 'linear',
    yDomain, yTicks,
    yFmt: (v) => d_formatYTick(v, yMode),
    axisY, axisX, series,
    onMarkerShow: (ev, s, m) => d_showTooltip(ev, s.country, m.data, tooltip),
    onMarkerMove: (ev) => d_positionTooltip(ev, tooltip),
    onMarkerHide: () => { if (tooltip) tooltip.style.opacity = '0'; },
    onMarkerClick: (s) => d_toggleCountrySelection(s.key),
  });

  // Editor: pisamos textos editoriales (título/subtítulo/caption) al final.
  d_applyEditorTexts(aeCfg);
}

// Caption: si el editor lo dejó vacío (trim) → restauramos el default del
// i18n key c3-sources. Esto permite que el usuario "borre" un caption
// custom y vuelva al automático sin tener que limpiar localStorage.
function d_applyEditorTexts(aeCfg) {
  const docLang = typeof LANG !== 'undefined' ? LANG : 'es';
  const lang = aeCfg?.lang || docLang;
  const t = aeCfg?.texts?.[lang] || {};
  const block = document.querySelector('.chart-block[data-chart="3"]');
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
    '.footer p[data-i18n="c3-sources"], .footer details[class*="mobile-collapse"] p[data-i18n="c3-sources"]'
  );
  if (customCaption) {
    captionEls.forEach(el => { el.textContent = customCaption; });
  } else if (typeof I18N !== 'undefined' && I18N[docLang] && I18N[docLang]['c3-sources']) {
    captionEls.forEach(el => { el.innerHTML = I18N[docLang]['c3-sources']; });
  }
}

// =================== Tooltip ===================
function d_showTooltip(e, country, decileData, tooltip) {
  if (!tooltip) return;
  const regionColor = REGION_WB_COLORS[country.region] || '#888';
  const regionLabel = t('reg.' + country.region);
  const yObs = country.year_obs;
  tooltip.innerHTML = `
    <strong>${d_displayName(country.code, country.name)}</strong>
    <div class="tt-region" style="color:${regionColor}">${regionLabel}</div>
    <div class="tt-row"><span>${t('c3-tt-decile')}</span><span>D${decileData.decile}</span></div>
    <div class="tt-row"><span>${t('c3-tt-income')}</span><span>$${decileData.income_daily_ppp.toFixed(2)}</span></div>
    <div class="tt-row"><span>${t('c3-tt-percentile')}</span><span>${decileData.world_percentile.toFixed(1)}</span></div>
    <div class="tt-row"><span>${t('c3-tt-year-obs')}</span><span>${yObs}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  d_positionTooltip(e, tooltip);
}

function d_positionTooltip(e, tooltip) {
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
  let tx = e.clientX - wrap.left + 12;
  if (tx + tw > wrap.width) tx = e.clientX - wrap.left - tw - 12;
  let ty = e.clientY - wrap.top - th - 8;
  if (ty < 0) ty = e.clientY - wrap.top + 14;
  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';
}

// =================== Slider con play ===================
function setupDecilesSlider() {
  const slider = document.getElementById('d-slider');
  const playBtn = document.getElementById('d-play');
  const display = document.getElementById('d-year-display');
  if (!slider || !playBtn || !display) return;

  function updateDisplay() {
    display.textContent = state[3].year;
    slider.value = state[3].year;
  }
  updateDisplay();

  slider.addEventListener('input', () => {
    state[3].year = parseInt(slider.value, 10);
    updateDisplay();
    drawDeciles();
  });

  let timer = null;
  function startPlay() {
    state[3].playing = true;
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', t('slider-pause'));
    timer = setInterval(() => {
      const next = state[3].year + 1;
      if (next > parseInt(slider.max, 10)) {
        stopPlay();
        return;
      }
      state[3].year = next;
      updateDisplay();
      drawDeciles();
    }, D_SLIDER_INTERVAL_MS);
  }
  function stopPlay() {
    state[3].playing = false;
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', t('slider-play'));
    if (timer) { clearInterval(timer); timer = null; }
  }

  playBtn.addEventListener('click', () => {
    if (state[3].playing) stopPlay();
    else {
      if (state[3].year >= parseInt(slider.max, 10)) {
        state[3].year = parseInt(slider.min, 10);
        updateDisplay();
        drawDeciles();
      }
      startPlay();
    }
  });
}

// =================== Toggles ===================
function setupDecilesToggles() {
  // Toggle eje Y (income/percentile)
  document.querySelectorAll('.d-mode-toggle[data-toggle="yMode"] button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.d-mode-toggle[data-toggle="yMode"] button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[3].yMode = btn.dataset.ymode;
      updateScaleToggleVisibility();
      drawDeciles();
    });
  });

  // Sub-toggle escala Y (linear/log) — solo visible cuando yMode=income
  document.querySelectorAll('.d-mode-toggle[data-toggle="yScale"] button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.d-mode-toggle[data-toggle="yScale"] button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[3].yScale = btn.dataset.yscale;
      drawDeciles();
    });
  });
}

function updateScaleToggleVisibility() {
  // Ocultar/mostrar el grupo entero (label + toggle) — no solo el toggle —
  // para que cuando el modo es percentile el label "Escala" no quede
  // huérfano. El wrapper #d-scale-group contiene ambos.
  const scaleGroup = document.getElementById('d-scale-group');
  if (!scaleGroup) return;
  scaleGroup.style.display = state[3].yMode === 'income' ? '' : 'none';
}

// =================== Buscador + chips ===================
function d_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Lista unica de paises del dataset (recorremos todos los anos)
function d_searchableCountries() {
  const seen = new Set();
  const list = [];
  Object.values(DATA_DECILES.data_by_year).forEach(yearObj => {
    Object.entries(yearObj.countries).forEach(([code, c]) => {
      if (seen.has(code)) return;
      seen.add(code);
      list.push({
        code,
        name: d_displayName(code, c.name),
        region: c.region,
      });
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, LANG));
}

function d_toggleCountrySelection(code) {
  const arr = state[3].selectedCountries;
  const idx = arr.indexOf(code);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(code);
  renderDecilesSelectedChips();
  drawDeciles();
  // Sincronizar con el editor sidebar: la lista del editor refleja
  // state[3].selectedCountries (son la misma cosa). Si hay un panel
  // abierto, su checkbox UI debe actualizarse a tildado/destildado.
  d_notifyEditor();
}

// Si el editor está montado, escribe state[3].selectedCountries en
// config.countries y dispara un re-render del panel + chart. Es idempotente
// y no-op si el editor nunca se montó (window.AtlasEditor existe siempre,
// pero getConfig() devuelve null si no hay chart-block con data-editor-id).
function d_notifyEditor() {
  if (!window.AtlasEditor) return;
  const cfg = window.AtlasEditor.getConfig();
  if (!cfg || cfg.chartId !== 'deciles') return;
  cfg.countries = (state[3].selectedCountries || []).slice();
  try {
    localStorage.setItem('atlas-editor-deciles', JSON.stringify(cfg));
  } catch (_) {}
  // reloadFromStorage rebuilds the country-list UI con los checkboxes
  // actualizados. Llama syncUI internamente.
  if (typeof window.AtlasEditor.reloadFromStorage === 'function') {
    window.AtlasEditor.reloadFromStorage();
  }
}

function renderDecilesSelectedChips() {
  const container = document.getElementById('d-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  state[3].selectedCountries.forEach((code) => {
    // Buscar el pais en el dataset para obtener nombre (cualquier ano).
    // El COLOR del chip se asigna por código vía d_colorFor — match exacto
    // con la línea correspondiente, estable a través del slider.
    let sample = null;
    for (const yearObj of Object.values(DATA_DECILES.data_by_year)) {
      if (yearObj.countries[code]) {
        sample = yearObj.countries[code];
        break;
      }
    }
    if (!sample) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = d_colorFor(code);
    chip.textContent = d_displayName(code, sample.name);
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Remove');
    x.addEventListener('click', () => d_toggleCountrySelection(code));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupDecilesSearch() {
  const input = document.getElementById('d-search');
  const results = document.getElementById('d-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = d_normalize(q);
    return d_searchableCountries()
      .filter(c => d_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[3].selectedCountries.includes(c.code);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-code="${c.code}">${c.name}<span class="m-search-region">${t('reg-short.' + c.region) || ''}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => {
      el.addEventListener('click', () => {
        d_toggleCountrySelection(el.dataset.code);
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
      d_toggleCountrySelection(currentMatches[activeIdx].code);
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
// Dataset completo: todos los anos, todos los paises, todos los deciles.
// Columnas: iso3, country, region, year, year_obs, welfare, decile,
// income_daily_ppp, world_percentile, mean_daily_ppp
function setupDecilesDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="3-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cols = ['iso3', 'country', 'region', 'year', 'year_obs',
                    'welfare', 'decile', 'income_daily_ppp',
                    'world_percentile', 'mean_daily_ppp'];
      const rows = [];
      Object.entries(DATA_DECILES.data_by_year).forEach(([year, yearObj]) => {
        Object.entries(yearObj.countries).forEach(([code, c]) => {
          c.deciles.forEach(d => {
            rows.push([
              code,
              (COUNTRY_NAMES[code]?.en) || c.name,
              c.region,
              year,
              c.year_obs,
              c.welfare_type,
              d.decile,
              d.income_daily_ppp,
              d.world_percentile,
              c.mean_daily_ppp,
            ]);
          });
        });
      });
      rows.sort((a, b) =>
        a[0].localeCompare(b[0]) ||
        Number(a[3]) - Number(b[3]) ||
        a[6] - b[6]
      );

      let csv = cols.join(',') + '\n';
      rows.forEach(r => {
        csv += r.map(v => {
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
      a.download = 'el-atlas-02-deciles.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

// =================== Hook PNG export ===================
// (El hook onBeforePngExport que mandaba las end-labels a canvasLabels se
// eliminó: el motor dl_draw las embebe en el SVG con halo (paint-order stroke),
// y png-export ya embebe las webfonts en el SVG rasterizado (Fase 2), así que
// se dibujan bien sin el workaround. Dejarlo doblaría las etiquetas.)

// Hook adicional: el caption del PNG depende del modo activo. El
// interactivo usa el c3-sources general (que menciona ambos modos);
// el PNG usa la versión específica del modo para no mencionar lo que
// no se ve.
window.onBeforePngExportGetSourceText = (chartId) => {
  if (chartId !== '3') return null;
  const yMode = state[3]?.yMode || 'income';
  const key = yMode === 'percentile' ? 'c3-sources-percentile' : 'c3-sources-income';
  const html = I18N[LANG]?.[key];
  if (!html) return null;
  // El i18n string puede contener HTML (ej. <em>). Lo limpiamos a texto plano
  // para que el canvas no renderee tags literales.
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent;
};

// =================== Init ===================
function initDeciles() {
  if (!state[3]) {
    state[3] = {
      yMode: 'income',
      yScale: 'log',
      year: DATA_DECILES.latest_year || 2025,
      playing: false,
      selectedCountries: [...D_DEFAULT_COUNTRIES],
      spotlightCountry: null,
    };
  } else {
    if (!state[3].selectedCountries) {
      state[3].selectedCountries = [...D_DEFAULT_COUNTRIES];
    }
  }
  updateScaleToggleVisibility();
  renderDecilesSelectedChips();
  drawDeciles();
  setupDecilesSlider();
  setupDecilesToggles();
  setupDecilesSearch();
  setupDecilesDownloadCSV();
  // Editor sidebar: re-render del chart cuando el usuario edita textos/
  // sizes/países en el panel. Tambien re-sync de state[3] con la lista del
  // editor, por si el evento vino de un import o reset.
  if (!initDeciles._editorWired) {
    initDeciles._editorWired = true;
    window.addEventListener('atlas-editor-change', () => {
      const cfg = window.AtlasEditor?.getConfig?.();
      if (cfg && cfg.chartId === 'deciles' && Array.isArray(cfg.countries)) {
        // Solo sincronizamos si la lista cambió (evita loops).
        const current = state[3].selectedCountries || [];
        if (current.length !== cfg.countries.length ||
            current.some((c, i) => c !== cfg.countries[i])) {
          state[3].selectedCountries = cfg.countries.slice();
          renderDecilesSelectedChips();
        }
      }
      drawDeciles();
    });
  }
  // Export PNG: soporta formatos (cuadrado por defecto) y se re-dibuja vía
  // drawDeciles cuando el exportador fuerza un formato.
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDeciles;
  // Mobile (≤768px): botones tuerca + "Seleccionar". Singleton — si ya
  // lo llamó otro init en el index.html, no hace nada.
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  // Mobile: handler global que cierra el tooltip al tap fuera de los
  // markers. Los markers hacen stopPropagation así que un tap sobre uno
  // no llega acá. Solo registramos una vez (singleton).
  if (!HAS_HOVER && !initDeciles._tooltipGlobalRegistered) {
    initDeciles._tooltipGlobalRegistered = true;
    document.addEventListener('click', () => {
      const tt = document.getElementById('tooltip3');
      if (tt) tt.style.opacity = '0';
    });
  }
}
