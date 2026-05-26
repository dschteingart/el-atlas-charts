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
const D_W = 1100, D_H = 470;
const D_MARGIN = { top: 24, right: 180, bottom: 56, left: 70 };
const D_PLOT_W = D_W - D_MARGIN.left - D_MARGIN.right;
const D_PLOT_H = D_H - D_MARGIN.top - D_MARGIN.bottom;

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
  labels.sort((a, b) => a.idealY - b.idealY);
  // Forward sweep: empujar hacia abajo si choca con la previa.
  labels.forEach((l, i) => {
    if (i === 0) {
      l.y = l.idealY;
    } else {
      l.y = Math.max(l.idealY, labels[i - 1].y + D_END_LABEL_GAP);
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
      if (i === 0 || target > labels[i - 1].y + D_END_LABEL_GAP) {
        labels[i].y = target;
        overflow = 0;
      } else {
        const minY = labels[i - 1].y + D_END_LABEL_GAP;
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
function drawDeciles() {
  const svg = document.getElementById('chart3');
  if (!svg) return;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${D_W} ${D_H}`);

  const s3 = state[3];
  const year = String(s3.year);
  const yearData = DATA_DECILES.data_by_year[year];
  if (!yearData) return;

  const yMode = s3.yMode;       // 'income' | 'percentile'
  const yScale = s3.yScale;     // 'linear' | 'log' (solo aplica si yMode=income)

  // Datos de los paises seleccionados (filtrando los que existen en el ano)
  const selectedCountries = (s3.selectedCountries || []).filter(
    code => yearData.countries[code]
  );
  const countriesData = selectedCountries.map(code => ({
    code,
    ...yearData.countries[code],
  }));

  const yDomain = d_computeYDomain(yMode, yScale, countriesData);
  const yScaleFn = (v) => d_yScale(v, yMode, yScale, yDomain);

  // === Grid Y + ticks ===
  const yTicks = d_yTicks(yMode, yScale, yDomain);
  yTicks.forEach(tv => {
    const y = yScaleFn(tv);
    const line = d_ns('line');
    line.setAttribute('x1', D_MARGIN.left);
    line.setAttribute('x2', D_MARGIN.left + D_PLOT_W);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('class', tv === yDomain.min ? 'd-axis-line' : 'd-grid-line');
    svg.appendChild(line);
    const txt = d_ns('text');
    txt.setAttribute('x', D_MARGIN.left - 8);
    txt.setAttribute('y', y + 4);
    txt.setAttribute('text-anchor', 'end');
    txt.setAttribute('class', 'd-tick');
    txt.textContent = d_formatYTick(tv, yMode);
    svg.appendChild(txt);
  });

  // Y axis title
  const yTitle = d_ns('text');
  yTitle.setAttribute('class', 'd-axis-title');
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute(
    'transform',
    `translate(${D_MARGIN.left - 50}, ${D_MARGIN.top + D_PLOT_H / 2}) rotate(-90)`
  );
  yTitle.textContent = yMode === 'income'
    ? t('c3-axis-y-income') + (yScale === 'log' ? ' (log)' : '')
    : t('c3-axis-y-percentile');
  svg.appendChild(yTitle);

  // === Eje X (deciles "Decil 1" ... "Decil 10") ===
  // Cada tick dice "Decil N" en lugar de "DN" — más explícito, ya no se
  // necesita un axis-title separado abajo. Los extremos (Decil 1 y Decil 10)
  // llevan aclaración entre paréntesis en una segunda línea para indicar
  // la dirección del eje (pobre → rico).
  D_DECILES.forEach(d => {
    const x = d_xScale(d);
    const txt = d_ns('text');
    txt.setAttribute('x', x);
    txt.setAttribute('y', D_MARGIN.top + D_PLOT_H + 22);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('class', 'd-tick');
    txt.textContent = t('c3-decile-prefix') + ' ' + d;
    svg.appendChild(txt);
    // Aclaración para extremos en segunda línea.
    if (d === 1 || d === 10) {
      const extra = d_ns('text');
      extra.setAttribute('x', x);
      extra.setAttribute('y', D_MARGIN.top + D_PLOT_H + 36);
      extra.setAttribute('text-anchor', 'middle');
      extra.setAttribute('class', 'd-tick-extra');
      extra.textContent = d === 1 ? t('c3-decile-poorest') : t('c3-decile-richest');
      svg.appendChild(extra);
    }
    // Vertical guide muy sutil
    const guide = d_ns('line');
    guide.setAttribute('x1', x); guide.setAttribute('x2', x);
    guide.setAttribute('y1', D_MARGIN.top); guide.setAttribute('y2', D_MARGIN.top + D_PLOT_H);
    guide.setAttribute('class', 'd-vguide');
    svg.appendChild(guide);
  });

  // === Lineas (una por pais) ===
  const linesG = d_ns('g');
  linesG.setAttribute('id', 'd-lines');
  svg.appendChild(linesG);

  const tooltip = document.getElementById('tooltip3');

  countriesData.forEach((country) => {
    // Color anclado al CÓDIGO del país (no al idx en el array filtrado),
    // para que el color no cambie durante el play del slider cuando algún
    // país queda fuera por falta de datos en ese año.
    const color = d_colorFor(country.code);
    const points = country.deciles.map(d => {
      const x = d_xScale(d.decile);
      const value = yMode === 'income' ? d.income_daily_ppp : d.world_percentile;
      const y = yScaleFn(value);
      return { x, y, d };
    });

    // Path
    const pathStr = points.map((p, i) =>
      (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)
    ).join(' ');
    const path = d_ns('path');
    path.setAttribute('d', pathStr);
    path.setAttribute('class', 'd-line');
    path.setAttribute('stroke', color);
    path.setAttribute('data-code', country.code);
    linesG.appendChild(path);

    // Markers en cada decil
    points.forEach(p => {
      const c = d_ns('circle');
      c.setAttribute('cx', p.x);
      c.setAttribute('cy', p.y);
      c.setAttribute('r', 3.5);
      c.setAttribute('fill', color);
      c.setAttribute('class', 'd-marker');
      c.setAttribute('data-code', country.code);
      // Tooltip
      if (HAS_HOVER) {
        c.addEventListener('mouseenter', (e) =>
          d_showTooltip(e, country, p.d, tooltip)
        );
        c.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
        c.addEventListener('mousemove', (e) => d_positionTooltip(e, tooltip));
      } else {
        // En mobile: tap muestra tooltip
        c.addEventListener('click', (e) => {
          d_showTooltip(e, country, p.d, tooltip);
          setTimeout(() => { tooltip.style.opacity = '0'; }, 2500);
        });
      }
      linesG.appendChild(c);
    });
  });

  // === End-labels ===
  const endLabels = countriesData.map((country) => {
    const last = country.deciles[country.deciles.length - 1];
    const value = yMode === 'income' ? last.income_daily_ppp : last.world_percentile;
    const idealY = yScaleFn(value);
    // Mismo color que la línea — anclado al código (estable a través del slider).
    const color = d_colorFor(country.code);
    const text = d_displayName(country.code, country.name);
    return {
      code: country.code,
      text,
      color,
      idealY,
      lineEndX: d_xScale(10),
      textW: d_measureText(text, D_LABEL_FONT_SIZE, D_LABEL_FONT_WEIGHT),
    };
  });
  d_placeEndLabels(endLabels);

  const endLabelsG = d_ns('g');
  endLabelsG.setAttribute('id', 'd-end-labels');
  svg.appendChild(endLabelsG);

  endLabels.forEach(l => {
    if (l.shifted) {
      // Guia corta del end-point al label
      const guide = d_ns('line');
      guide.setAttribute('x1', l.lineEndX);
      guide.setAttribute('y1', l.idealY);
      guide.setAttribute('x2', l.lineEndX + 6);
      guide.setAttribute('y2', l.y);
      guide.setAttribute('stroke', l.color);
      guide.setAttribute('stroke-width', 0.8);
      guide.setAttribute('stroke-opacity', 0.5);
      guide.setAttribute('fill', 'none');
      endLabelsG.appendChild(guide);
    }
    const txt = d_ns('text');
    txt.setAttribute('x', l.lineEndX + 9);
    txt.setAttribute('y', l.y + 4);  // baseline offset
    txt.setAttribute('class', 'd-end-label');
    txt.setAttribute('fill', l.color);
    txt.textContent = l.text;
    endLabelsG.appendChild(txt);
  });
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
  const scaleBlock = document.getElementById('d-scale-block');
  if (!scaleBlock) return;
  scaleBlock.style.display = state[3].yMode === 'income' ? '' : 'none';
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
// Las end-labels SVG tienen el problema de que las webfonts en contexto
// aislado de <img> a veces caen al fallback. Las mandamos a canvasLabels
// para garantizar la tipografia. Tambien sacamos clase shifted-guide del
// SVG (las guias quedan en el SVG, pero los textos van a canvas).
window.onBeforePngExport = (svgClone, chartId) => {
  if (chartId !== '3') return;
  const canvasLabels = [];
  const endLabelsG = svgClone.querySelector('#d-end-labels');
  if (endLabelsG) {
    endLabelsG.querySelectorAll('text.d-end-label').forEach(el => {
      canvasLabels.push({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        text: el.textContent,
        fill: el.getAttribute('fill') || '#444',
        weight: D_LABEL_FONT_WEIGHT,
        size: D_LABEL_FONT_SIZE,
        textAnchor: 'start',
      });
      el.style.display = 'none';
    });
  }
  return { canvasLabels };
};

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
}
