// Lógica de los scatters del N°1 (charts 1 y 2).
// Específica del N°1; eventualmente migrará a lib/chart-scatter.js.

//==================================================================
//  CONFIG
//==================================================================

// Países "garantizados": se procesan primero, así si hay pelea por espacio,
// estos se llevan la prioridad. La prioridad interna (cuanto más bajo, antes
// se procesa dentro del Tier 0) refleja el orden de relevancia editorial.
//
// LATAM: los 5 grandes
// Norte angloesfera: Estados Unidos
// Europa Occidental: Alemania > Francia > Reino Unido > España > Italia
// Europa del Este y Asia Central: Rusia
// Asia Oriental: China > Japón > Corea del Sur
// Asia del Sur: India
const GUARANTEED_PRIORITY = {
  // 0 = más alta dentro del Tier 0
  'Argentina': 0, 'Brazil': 0, 'Mexico': 0, 'Colombia': 0, 'Chile': 0,
  'United States': 0,
  'Germany': 0,
  'France': 1,
  'United Kingdom': 2,
  'Spain': 3,
  'Italy': 4,
  'Russia': 0,
  'China': 0,
  'Japan': 1,
  'South Korea': 2,
  'India': 0,
};
const PRIORITY_GUARANTEED = new Set(Object.keys(GUARANTEED_PRIORITY));

// state[1], state[2], state[3] se inician en cada HTML según los charts que tenga

// fmt, fmtSmart, niceLog10Ticks, niceLinearTicks, fmtTickGDP viven en utils.js
// (compartidos con timeseries.js).

function ols(points, xKey, yKey) {
  const xs = points.map(p => p[xKey]);
  const ys = points.map(p => p[yKey]);
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  return { a, b };
}

//==================================================================
//  REGION FILTERS UI
//==================================================================
function renderRegionFilters(chartId) {
  const container = document.querySelector(`.region-filters[data-chart="${chartId}"]`);
  container.innerHTML = '';
  REGION_ORDER.forEach(reg => {
    const chip = document.createElement('span');
    chip.className = 'region-chip';
    chip.textContent = t('reg.' + reg);
    const isActive = state[chartId].activeRegions.has(reg);
    if (isActive) {
      chip.style.background = REGION_COLORS[reg];
      chip.style.borderColor = REGION_COLORS[reg];
      chip.style.color = 'white';
    } else {
      chip.classList.add('inactive');
      chip.style.borderColor = REGION_COLORS[reg] + '66';
    }
    chip.addEventListener('click', () => {
      const s = state[chartId].activeRegions;
      if (s.has(reg)) s.delete(reg); else s.add(reg);
      renderRegionFilters(chartId);
      drawChart(chartId);
    });
    // Hover-preview de región: solo en dispositivos con mouse. En mobile el
    // tap dispara mouseenter pero nunca mouseleave, dejando la región
    // "destacada" pegada hasta que el usuario tap otra región.
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        state[chartId].hoverRegion = reg;
        drawChart(chartId);
      });
      chip.addEventListener('mouseleave', () => {
        state[chartId].hoverRegion = null;
        drawChart(chartId);
      });
    }
    container.appendChild(chip);
  });
}

//==================================================================
//  LABEL PLACEMENT (estilo OWID, dos fases)
//==================================================================
// Offsets compactos (estilo OWID, etiquetas cerca del punto).
// dx/dy son el offset del centro del punto al "ancla" del texto.
const OFFSET_DEFAULT = { dx:  5, dy: -5,  anchor: 'start'  };  // 1:30 (default)

// Posiciones cardinales puras (sin diagonales) — son las únicas alternativas
// permitidas para Tier 1, y las únicas excepciones permitidas para Tier 0
// si no entra en 1:30.
const OFFSETS_CARDINAL = [
  { dx:  0, dy: -7,  anchor: 'middle' },  // 12:00
  { dx:  8, dy:  4,  anchor: 'start'  },  // 3:00
  { dx:  0, dy: 13,  anchor: 'middle' },  // 6:00
  { dx: -8, dy:  4,  anchor: 'end'    },  // 9:00
];

// Diagonal "10:30" (arriba a la izquierda) — solo permitida para Tier 0
// si ni 1:30 ni cardinales entran.
const OFFSET_NW = { dx: -5, dy: -5, anchor: 'end' };

function rectsOverlap(a, b) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

function estimateLabelWidth(text) {
  return text.length * 6.0 + 4;
}

// Escala de offsets/dimensiones de labels. 1 en el interactivo; en el export
// cuadrado el viewBox y las fuentes son ~2.5× más grandes, así que los offsets
// (separación label↔punto) y el rectángulo estimado se escalan igual para que
// el label limpie el punto agrandado y la detección de colisión siga válida.
let LABEL_SCALE = 1;

// Construye el rectángulo de una etiqueta dado offset y centro de punto
function buildRect(it, off) {
  const s = LABEL_SCALE;
  const w = estimateLabelWidth(it.text) * s;
  const lx = it.cx + off.dx * s;
  const ly = it.cy + off.dy * s;
  let x1, x2;
  if (off.anchor === 'start') { x1 = lx; x2 = lx + w; }
  else if (off.anchor === 'end') { x1 = lx - w; x2 = lx; }
  else { x1 = lx - w/2; x2 = lx + w/2; }
  return { rect: { x1, x2, y1: ly - 12 * s, y2: ly + 2 * s }, lx, ly, anchor: off.anchor };
}

function fitsInBox(rect, plotBox) {
  return rect.x1 >= plotBox.x1 && rect.x2 <= plotBox.x2 &&
         rect.y1 >= plotBox.y1 && rect.y2 <= plotBox.y2;
}

function tryPlace(it, off, placedRects, plotBox) {
  const r = buildRect(it, off);
  if (!fitsInBox(r.rect, plotBox)) return null;
  if (placedRects.some(p => rectsOverlap(p, r.rect))) return null;
  return r;
}

// items: [{cx, cy, text, region, tier, country, subPriority}]
// pointPositions: NO se usa
// plotBox: { x1, y1, x2, y2 }
function placeLabels(items, pointPositions, plotBox, scale = 1) {
  LABEL_SCALE = scale;
  const placed = [];
  const result = [];

  // Separar Tier 0 (garantizados) y Tier 1 (resto)
  const tier0 = items.filter(it => (it.tier ?? 99) === 0);
  const tier1 = items.filter(it => (it.tier ?? 99) > 0);

  // Ordenar Tier 0 por subPriority y luego X decreciente (los de más PIB primero)
  tier0.sort((a, b) => {
    const sA = a.subPriority ?? 99, sB = b.subPriority ?? 99;
    if (sA !== sB) return sA - sB;
    return b.cx - a.cx;
  });

  // ===== FASE A: colocar los Tier 0 =====
  // Estrategia:
  //   1. Intentar todos en 1:30 (default).
  //   2. Si alguno no entra, dejar los que sí entraron en 1:30 y para los que no,
  //      buscar entre los offsets cardinales (12/3/6/9).
  //   3. Si todavía no entra, probar 10:30 (NW). Esta es la única diagonal extra
  //      permitida para Tier 0.
  //   4. Si nada funciona, forzar 1:30 aunque pise otra etiqueta (último recurso).
  //
  // Intentamos primero la versión "ideal": todos en 1:30. Si entra, listo.
  // Si no, vamos colocando uno por uno con la cascada definida arriba.

  // Intento 1: todos en 1:30
  let phaseAplaced = [];
  let phaseAresult = [];
  let allDefault = true;
  for (const it of tier0) {
    const r = tryPlace(it, OFFSET_DEFAULT, phaseAplaced, plotBox);
    if (r) {
      phaseAplaced.push(r.rect);
      phaseAresult.push({ it, r });
    } else {
      allDefault = false;
      break;
    }
  }

  if (allDefault) {
    // Todos los Tier 0 entraron en 1:30 → usamos esto
    phaseAresult.forEach(({ it, r }) => {
      placed.push(r.rect);
      result.push({ text: it.text, x: r.lx, y: r.ly, anchor: r.anchor, region: it.region });
    });
  } else {
    // Alguno no entró: rehacer con cascada por país
    for (const it of tier0) {
      // 1. Intentar 1:30
      let r = tryPlace(it, OFFSET_DEFAULT, placed, plotBox);
      // 2. Cardinales (12, 3, 6, 9)
      if (!r) {
        for (const off of OFFSETS_CARDINAL) {
          r = tryPlace(it, off, placed, plotBox);
          if (r) break;
        }
      }
      // 3. 10:30 (NW)
      if (!r) {
        r = tryPlace(it, OFFSET_NW, placed, plotBox);
      }
      // 4. Forzar 1:30 aunque pise (último recurso para Tier 0)
      if (!r) {
        const forced = buildRect(it, OFFSET_DEFAULT);
        if (fitsInBox(forced.rect, plotBox)) r = forced;
      }
      if (r) {
        placed.push(r.rect);
        result.push({ text: it.text, x: r.lx, y: r.ly, anchor: r.anchor, region: it.region });
      }
    }
  }

  // ===== FASE B: colocar los Tier 1 =====
  // Para cada uno: intentar 1:30, luego cardinales puras (12/3/6/9). Si nada
  // funciona limpio, NO se muestra (queda el tooltip al hover).
  // Orden: por X decreciente (los de más PIB primero).
  tier1.sort((a, b) => b.cx - a.cx);

  for (const it of tier1) {
    let r = tryPlace(it, OFFSET_DEFAULT, placed, plotBox);
    if (!r) {
      for (const off of OFFSETS_CARDINAL) {
        r = tryPlace(it, off, placed, plotBox);
        if (r) break;
      }
    }
    if (r) {
      placed.push(r.rect);
      result.push({ text: it.text, x: r.lx, y: r.ly, anchor: r.anchor, region: it.region });
    }
  }

  return result;
}

//==================================================================
//  BUSCADOR DE PAÍSES + CHIPS
//==================================================================
// Portado del scatter del N°2 (análogo más cercano), parametrizado por chartId
// porque los charts 1 y 2 comparten este archivo. Identificador: iso3.
// La selección vive en state[chartId].selectedCountries (array de iso3) y
// reemplaza al viejo spotlightCountry (single) por selección múltiple.
function s_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function s_searchableCountries() {
  const seen = new Set();
  const list = [];
  DATA.forEach(d => {
    if (!d.iso3 || seen.has(d.iso3)) return;
    seen.add(d.iso3);
    const name = LANG === 'es' ? (d.country_es || d.country) : d.country;
    list.push({ code: d.iso3, name, region: d.region });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, LANG));
}

function toggleCountrySelection(chartId, code) {
  const arr = state[chartId].selectedCountries;
  const idx = arr.indexOf(code);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(code);
  renderSelectedChips(chartId);
  drawChart(chartId);
}

function renderSelectedChips(chartId) {
  const container = document.getElementById('s-selected-chips-' + chartId);
  if (!container) return;
  container.innerHTML = '';
  (state[chartId].selectedCountries || []).forEach(code => {
    const sample = DATA.find(d => d.iso3 === code);
    if (!sample) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = REGION_COLORS[sample.region] || '#888';
    chip.textContent = LANG === 'es' ? (sample.country_es || sample.country) : sample.country;
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Quitar');
    x.addEventListener('click', () => toggleCountrySelection(chartId, code));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupCountrySearch(chartId) {
  const input = document.getElementById('s-search-' + chartId);
  const results = document.getElementById('s-search-results-' + chartId);
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
    const sel = new Set(state[chartId].selectedCountries || []);
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (sel.has(c.code) ? ' m-already' : '');
      return `<div class="${cls}" data-code="${c.code}">${c.name}<span class="m-search-region">${t('reg.' + c.region) || ''}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => {
      el.addEventListener('click', () => {
        toggleCountrySelection(chartId, el.dataset.code);
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
      toggleCountrySelection(chartId, currentMatches[activeIdx].code);
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
//  DRAW CHART
//==================================================================
function drawChart(chartId) {
  const yField = chartId === 1 ? 'life_satisfaction' : 'homicide_rate';
  const yYearField = chartId === 1 ? 'year_lifesat' : 'year_homicide';

  const svg = document.getElementById('chart' + chartId);
  const tooltip = document.getElementById('tooltip' + chartId);

  const allPoints = DATA.filter(d =>
    d.gdp_pc_ppp != null &&
    d[yField] != null &&
    d.gdp_pc_ppp > 0 &&
    (chartId === 2 ? d[yField] >= 0 : true)
  );

  const scaleX = state[chartId].scaleX;
  const scaleY = state[chartId].scaleY;

  // Regresión sobre TODOS los puntos válidos (no filtrados por región)
  const regPoints = allPoints.map(d => ({
    x: scaleX === 'log' ? Math.log10(d.gdp_pc_ppp) : d.gdp_pc_ppp,
    y: scaleY === 'log'
      ? Math.log10(Math.max(d[yField], 0.05))
      : d[yField]
  }));

  // Formato activo: null = interactivo (apaisado, fuentes de la clase CSS),
  // 'square' = export PNG cuadrado mobile-first (todo sobredimensionado).
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = fmt === 'square';
  const bigFmt = square;

  let W, H, margin;
  if (square) {
    W = PNG_FORMATS.square.vbW; H = PNG_FORMATS.square.vbH;   // 1100 × 760
    margin = { top: 30, right: 44, bottom: 96, left: 88 };
  } else {
    W = 760; H = 470;
    margin = { top: 18, right: 22, bottom: 54, left: 60 };
  }
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Tamaños mobile-first SOLO en el export cuadrado; en interactivo se aplican
  // como inline (igual a la clase CSS) para no alterar la vista. Trampa #1:
  // font-size va por el.style.fontSize (inline), nunca setAttribute (la clase
  // CSS le ganaría). Ver skill graficos-atlas.
  const SIZES = square
    ? { tick: 22, axisTitle: 26, label: 26, halo: 6, weight: 700 }
    : { tick: 12, axisTitle: 12.5, label: 10.5, halo: 0, weight: null };
  // Los puntos se agrandan en el cuadrado (el canvas final se ve a ~⅓).
  const ptScale = square ? 1.8 : 1;
  // Escala de offsets/dims de labels para placeLabels (≈ ratio de fuente).
  const labelScale = square ? SIZES.label / 10.5 : 1;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // xMin fijo (padding editorial bajo el país más pobre, ~$1k).
  // xMax dinámico: redondeo hacia arriba al múltiplo de 10k del país más rico
  // del dataset, así outliers como Singapur (~$132k) o Macao (~$112k) entran
  // sin recortarse contra el borde derecho.
  const xMinRaw = 600;
  const xMaxFromData = Math.max(...allPoints.map(d => d.gdp_pc_ppp));
  const xMaxRaw = Math.ceil(xMaxFromData / 10000) * 10000;
  const xDomain = scaleX === 'log'
    ? [Math.log10(xMinRaw), Math.log10(xMaxRaw)]
    : [0, xMaxRaw];

  let yMinRaw, yMaxRaw;
  if (chartId === 1) { yMinRaw = 1; yMaxRaw = 8; }
  else { yMinRaw = scaleY === 'log' ? 0.05 : 0; yMaxRaw = 90; }
  const yDomain = scaleY === 'log'
    ? [Math.log10(Math.max(yMinRaw, 0.05)), Math.log10(yMaxRaw)]
    : [yMinRaw, yMaxRaw];

  const xScale = v => margin.left + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerW;
  const yScale = v => margin.top + innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;

  const ns = 'http://www.w3.org/2000/svg';
  svg.innerHTML = '';

  // ClipPath para que ni puntos ni etiquetas se salgan del área de plot
  const clipId = 'plot-clip-' + chartId;
  const defs = document.createElementNS(ns, 'defs');
  const clip = document.createElementNS(ns, 'clipPath');
  clip.setAttribute('id', clipId);
  const clipRect = document.createElementNS(ns, 'rect');
  clipRect.setAttribute('x', margin.left);
  clipRect.setAttribute('y', margin.top);
  clipRect.setAttribute('width', innerW);
  clipRect.setAttribute('height', innerH);
  clip.appendChild(clipRect);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // Background del área del gráfico
  const bgRect = document.createElementNS(ns, 'rect');
  bgRect.setAttribute('x', margin.left);
  bgRect.setAttribute('y', margin.top);
  bgRect.setAttribute('width', innerW);
  bgRect.setAttribute('height', innerH);
  bgRect.setAttribute('fill', 'var(--bg)');
  svg.appendChild(bgRect);

  const gridG = document.createElementNS(ns, 'g');
  gridG.setAttribute('class', 'grid');
  svg.appendChild(gridG);

  const axisG = document.createElementNS(ns, 'g');
  axisG.setAttribute('class', 'axis');
  svg.appendChild(axisG);

  const xTicksRaw = scaleX === 'log'
    ? niceLog10Ticks(xMinRaw, xMaxRaw)
    : niceLinearTicks(0, xMaxRaw);
  xTicksRaw.forEach(v => {
    const x = xScale(scaleX === 'log' ? Math.log10(v) : v);
    if (x < margin.left - 1 || x > margin.left + innerW + 1) return;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', margin.top); line.setAttribute('y2', margin.top + innerH);
    gridG.appendChild(line);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', margin.top + innerH + (square ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    if (square) lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = fmtTickGDP(v);
    axisG.appendChild(lbl);
  });

  const yTicksRaw = scaleY === 'log'
    ? niceLog10Ticks(Math.max(yMinRaw, 0.05), yMaxRaw)
    : niceLinearTicks(yMinRaw, yMaxRaw);
  yTicksRaw.forEach(v => {
    const y = yScale(scaleY === 'log' ? Math.log10(v) : v);
    if (y < margin.top - 1 || y > margin.top + innerH + 1) return;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', margin.left); line.setAttribute('x2', margin.left + innerW);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    gridG.appendChild(line);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', margin.left - (square ? 14 : 8));
    lbl.setAttribute('y', y + (square ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end');
    if (square) lbl.style.fontSize = SIZES.tick + 'px';
    // Formateo del eje Y. Para chart 1: enteros. Para chart 2 lineal: enteros.
    // Para chart 2 en log: si v<1 con suficiente precisión (0.05 → "0.05", 0.1 → "0.1", 0.2 → "0.2")
    let label;
    if (chartId === 1) {
      label = Math.round(v);
    } else if (scaleY === 'log') {
      if (v >= 1) label = Math.round(v);
      else if (v >= 0.1) label = v.toFixed(1);   // 0.1, 0.2, 0.5
      else label = v.toFixed(2);                  // 0.05
    } else {
      label = Math.round(v);
    }
    lbl.textContent = label;
    axisG.appendChild(lbl);
  });

  const xAx = document.createElementNS(ns, 'line');
  xAx.setAttribute('x1', margin.left); xAx.setAttribute('x2', margin.left + innerW);
  xAx.setAttribute('y1', margin.top + innerH); xAx.setAttribute('y2', margin.top + innerH);
  axisG.appendChild(xAx);
  const yAx = document.createElementNS(ns, 'line');
  yAx.setAttribute('x1', margin.left); yAx.setAttribute('x2', margin.left);
  yAx.setAttribute('y1', margin.top); yAx.setAttribute('y2', margin.top + innerH);
  axisG.appendChild(yAx);

  const xT = document.createElementNS(ns, 'text');
  xT.setAttribute('class', 'axis-title');
  xT.setAttribute('x', margin.left + innerW / 2);
  xT.setAttribute('y', H - (square ? 22 : 12));
  xT.setAttribute('text-anchor', 'middle');
  if (square) xT.style.fontSize = SIZES.axisTitle + 'px';
  xT.textContent = t('axis-x') + (scaleX === 'log' ? t('log-suffix') : '');
  svg.appendChild(xT);

  const yLabel = chartId === 1 ? t('axis-y-1') : t('axis-y-2');
  const yT = document.createElementNS(ns, 'text');
  yT.setAttribute('class', 'axis-title');
  yT.setAttribute('x', -(margin.top + innerH / 2));
  yT.setAttribute('y', square ? 28 : 16);
  yT.setAttribute('transform', 'rotate(-90)');
  yT.setAttribute('text-anchor', 'middle');
  if (square) yT.style.fontSize = SIZES.axisTitle + 'px';
  yT.textContent = yLabel + (scaleY === 'log' ? t('log-suffix-y') : '');
  svg.appendChild(yT);

  // Regression
  const regr = ols(regPoints, 'x', 'y');
  if (regr) {
    const x0 = xDomain[0], x1 = xDomain[1];
    const regLine = document.createElementNS(ns, 'line');
    regLine.setAttribute('class', 'regression');
    regLine.setAttribute('x1', xScale(x0));
    regLine.setAttribute('x2', xScale(x1));
    regLine.setAttribute('y1', yScale(regr.a + regr.b * x0));
    regLine.setAttribute('y2', yScale(regr.a + regr.b * x1));
    svg.appendChild(regLine);
  }

  // Estado de visibilidad, hover y selección.
  // selectedCountries (array de iso3): países elegidos por el buscador o por
  // click/tap en un punto. Quedan destacados y el resto atenuado, hasta que se
  // quiten (chip ×, re-click en el punto, o click en zona vacía).
  const visibleRegions = state[chartId].activeRegions;
  const hoverReg = state[chartId].hoverRegion;
  const selectedSet = new Set(state[chartId].selectedCountries || []);
  const hasSelection = selectedSet.size > 0;
  const drawnRegions = new Set(visibleRegions);
  if (hoverReg) drawnRegions.add(hoverReg);
  // Asegurar que los países seleccionados se dibujen aunque su región esté
  // filtrada (su región completa entra, como hacía el viejo spotlight).
  if (hasSelection) {
    allPoints.forEach(d => { if (selectedSet.has(d.iso3)) drawnRegions.add(d.region); });
  }

  const ptsG = document.createElementNS(ns, 'g');
  ptsG.setAttribute('clip-path', `url(#${clipId})`);
  svg.appendChild(ptsG);

  const drawables = allPoints.filter(d => drawnRegions.has(d.region));

  // Acumulador de posiciones de puntos NO atenuados (los dimmed se tratan como inexistentes)
  const pointPositions = [];

  // Orden de dibujo
  // - Si hay hover: hovered al final (encima de todo)
  // - LATAM siempre algo arriba (protagonista del Atlas)
  const orderedDrawables = [...drawables].sort((a, b) => {
    const score = (d) => {
      let s = 0;
      if (d.region === 'Latin America') s += 1;
      if (hoverReg && d.region === hoverReg) s += 5;
      if (selectedSet.has(d.iso3)) s += 10;   // seleccionados, encima de todo
      return s;
    };
    return score(a) - score(b);
  });

  orderedDrawables.forEach(d => {
    const cx = xScale(scaleX === 'log' ? Math.log10(d.gdp_pc_ppp) : d.gdp_pc_ppp);
    const yval = scaleY === 'log' ? Math.log10(Math.max(d[yField], 0.05)) : d[yField];
    const cy = yScale(yval);

    const isLatam = d.region === 'Latin America';
    const isSelected = hasSelection && selectedSet.has(d.iso3);
    const isHovered = hoverReg && d.region === hoverReg;
    const noHoverNorSel = !hoverReg && !hasSelection;

    // Tamaño y borde:
    // - Con selección: los seleccionados muy destacados, el resto atenuado.
    // - Con hover sobre región (solo desktop): la región hovereada destacada.
    // - Sin nada: LATAM grande con borde (protagonista del Atlas), demás chicos.
    let r, fillOpacity, stroke, strokeWidth;
    if (isSelected) {
      r = 7; fillOpacity = 1; stroke = '#1A1A1A'; strokeWidth = 1.3;
    } else if (isHovered && !hasSelection) {
      r = 5.5; fillOpacity = 0.95; stroke = '#1A1A1A'; strokeWidth = 0.9;
    } else if (isLatam && noHoverNorSel) {
      r = 5; fillOpacity = 0.92; stroke = '#1A1A1A'; strokeWidth = 0.7;
    } else {
      r = 3.8; fillOpacity = 0.7; stroke = 'white'; strokeWidth = 0.5;
    }
    // Sobredimensionar puntos en el export cuadrado (el PNG se ve a ~⅓).
    r *= ptScale;
    if (square) strokeWidth *= 1.6;

    const isDimmed = (hoverReg && !isHovered && !isSelected)
                  || (hasSelection && !isSelected);
    if (!isDimmed) {
      pointPositions.push({ cx, cy, r, region: d.region });
    }

    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('class', 'point');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', cy);
    c.setAttribute('r', r);
    c.setAttribute('fill', REGION_COLORS[d.region]);
    c.setAttribute('fill-opacity', fillOpacity);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', strokeWidth);

    if (isDimmed) {
      c.classList.add('dimmed');
    }

    c.addEventListener('mouseenter', () => {
      const countryDisplay = LANG === 'es' ? d.country_es : d.country;
      const yLabel = chartId === 1 ? t('tt-life') : t('tt-hom');
      const yYearLabel = chartId === 1 ? t('tt-year-life') : t('tt-year-hom');
      tooltip.innerHTML = `
        <strong>${countryDisplay}</strong>
        <div class="tt-region">${t('reg.' + d.region)}</div>
        <div class="tt-row"><span>${t('tt-gdppc')}</span><span>$${fmt(d.gdp_pc_ppp, 0)}</span></div>
        <div class="tt-row"><span>${yLabel}</span><span>${fmtSmart(d[yField])}</span></div>
        <div class="tt-year">${t('tt-gdppc')} ${d.year_gdp} · ${yYearLabel} ${d[yYearField]}</div>
      `;
      tooltip.style.opacity = '1';
    });
    c.addEventListener('mousemove', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      let tx = x + 12;
      if (tx + tw > rect.width) tx = x - tw - 12;
      let ty = y - th - 8;
      if (ty < 0) ty = y + 14;
      tooltip.style.left = tx + 'px';
      tooltip.style.top = ty + 'px';
    });
    c.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    // Click (tap en mobile) = toggle de selección (agrega/quita el país). El
    // stopPropagation impide que el click burbujee al SVG y limpie todo.
    c.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleCountrySelection(chartId, d.iso3);
    });
    ptsG.appendChild(c);
  });

  // Click en zona vacía del SVG limpia toda la selección y el tooltip.
  // onclick (no addEventListener) para no acumular handlers en cada redraw.
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') {
      if ((state[chartId].selectedCountries || []).length) {
        state[chartId].selectedCountries = [];
        renderSelectedChips(chartId);
        drawChart(chartId);
      }
      tooltip.style.opacity = '0';
    }
  };

  // Etiquetas
  // - Con selección: solo los países seleccionados (forzados a entrar).
  // - Sin selección, con hover sobre región: todos los países de esa región
  //   (con los garantizados de esa región como Tier 0 — ej. al hover en
  //   "Europa Occidental", Alemania, Francia, UK, España e Italia son Tier 0).
  // - Sin nada: solo países LATAM (los 5 grandes garantizados; el resto si entra).
  let labelTargets;
  if (hasSelection) {
    labelTargets = orderedDrawables.filter(d => selectedSet.has(d.iso3));
  } else if (hoverReg) {
    labelTargets = orderedDrawables.filter(d => d.region === hoverReg);
  } else {
    labelTargets = orderedDrawables.filter(d => d.region === 'Latin America');
  }

  const labelCandidates = labelTargets.map(d => {
    const cx = xScale(scaleX === 'log' ? Math.log10(d.gdp_pc_ppp) : d.gdp_pc_ppp);
    const yval = scaleY === 'log' ? Math.log10(Math.max(d[yField], 0.05)) : d[yField];
    const cy = yScale(yval);
    const txt = LANG === 'es' ? d.country_es : d.country;

    let tier;
    let subPriority = 99;
    if (hasSelection && selectedSet.has(d.iso3)) {
      tier = 0;          // los seleccionados siempre se etiquetan
      subPriority = 0;
    } else if (PRIORITY_GUARANTEED.has(d.country)) {
      tier = 0;
      subPriority = GUARANTEED_PRIORITY[d.country];
    } else {
      tier = 1;
    }

    return { cx, cy, text: txt, tier, subPriority, region: d.region, country: d.country };
  });

  // plotBox = el rectángulo del área de plot (sin márgenes), para no salirnos
  const plotBox = {
    x1: margin.left,
    y1: margin.top,
    x2: margin.left + innerW,
    y2: margin.top + innerH
  };

  const placed = placeLabels(labelCandidates, pointPositions, plotBox, labelScale);

  // En el export grande (cuadrado) reusamos el motor compartido de elo-pib
  // (lib/scatter-render.js) para: (a) relajar los labels en 2D y despejarlos de
  // los puntos, y (b) reconectar cada label corrido con su punto vía línea guía
  // (estilo OWID). En interactivo no corre → la vista queda igual.
  if (bigFmt && typeof s_relaxLabels === 'function') {
    const textScale = SIZES.label / 10.5;   // estimateLabelWidth está en px ~10.5
    const r0 = (hasSelection ? 7 : 5) * ptScale;   // ~radio del punto etiquetado
    const relaxItems = placed.map(lbl => {
      const cand = labelCandidates.find(c => c.text === lbl.text);
      return {
        lx: lbl.x, ly: lbl.y, anchor: lbl.anchor,
        textW: estimateLabelWidth(lbl.text) * textScale,
        px: cand ? cand.cx : lbl.x, py: cand ? cand.cy : lbl.y
      };
    });
    // Obstáculos = SOLO los puntos etiquetados (los que importa que se vean), no
    // la nube gris de fondo. Un label de 26px no puede esquivar los ~150 puntos
    // en zona densa; sobre los grises SÍ puede pasar (el halo los tapa, es normal
    // en OWID). Así los labels se acomodan cerca de su punto en vez de huir al
    // borde. Cada punto etiquetado se protege con su radio r0.
    const obstacles = labelCandidates.map(c => ({ x: c.cx, y: c.cy, r: r0 }));
    s_relaxLabels(relaxItems, SIZES.label, plotBox, 220, obstacles);

    // Cap de drift: ningún label debe alejarse demasiado de su punto. En racimos
    // densos la relajación si no manda alguno al borde con una guía larguísima
    // (ej. Chile en el chart 1). Lo traemos de vuelta a maxDrift del punto.
    const maxDrift = 80;
    relaxItems.forEach(l => {
      const dx = l.lx - l.px, dy = l.ly - l.py;
      const d = Math.hypot(dx, dy);
      if (d > maxDrift) { const k = maxDrift / d; l.lx = l.px + dx * k; l.ly = l.py + dy * k; }
    });

    // Pull-back: la relajación minimiza solapes pero NO el largo de las guías
    // (empuja por el eje de menor solape, que para labels anchos suele ser el
    // horizontal → líneas largas al costado). Esta pasada acerca cada label de
    // vuelta hacia su punto en pasos chicos, hasta el instante antes de volver a
    // chocar con otro label o tapar un punto. Acorta cada guía al mínimo y deja
    // sin línea a los que pueden volver a pegarse al punto (técnica OWID).
    const PB_PAD = 8, PB_PT_PAD = 4, PB_STEP = 3;
    const pbBoxesHit = (a, b) =>
      !(a.x2 < b.x1 - PB_PAD || a.x1 > b.x2 + PB_PAD || a.y2 < b.y1 - PB_PAD || a.y1 > b.y2 + PB_PAD);
    const pbCollides = (idx, lx, ly) => {
      const box = s_labelBox({ ...relaxItems[idx], lx, ly }, SIZES.label);
      for (let j = 0; j < relaxItems.length; j++) {
        if (j === idx) continue;
        if (pbBoxesHit(box, s_labelBox(relaxItems[j], SIZES.label))) return true;
      }
      for (const ob of obstacles) {
        const nx = Math.max(box.x1, Math.min(ob.x, box.x2));
        const ny = Math.max(box.y1, Math.min(ob.y, box.y2));
        if (Math.hypot(nx - ob.x, ny - ob.y) < ob.r + PB_PT_PAD) return true;
      }
      return false;
    };
    relaxItems.forEach((l, i) => {
      for (let iter = 0; iter < 40; iter++) {
        const dx = l.px - l.lx, dy = l.py - l.ly;
        const d = Math.hypot(dx, dy);
        if (d < PB_STEP) break;
        const nx = l.lx + (dx / d) * PB_STEP, ny = l.ly + (dy / d) * PB_STEP;
        if (pbCollides(i, nx, ny)) break;
        l.lx = nx; l.ly = ny;
      }
    });

    // Vertical-snap: los labels que quedaron LEJOS de su punto están en un racimo
    // horizontal denso (ej. Colombia/México/Brasil, misma altura). Correrlos al
    // costado da guías largas; en cambio los reubicamos justo ARRIBA o ABAJO de
    // su propio punto (sobre su misma X). Adjacentes a distinta altura no chocan
    // aunque se solapen en X → guía corta y vertical. Probamos arriba y abajo y
    // tomamos la primera libre; procesar en secuencia alterna solo/abajo.
    const SNAP_GAP = 10;
    const up = SIZES.label * 0.78, dn = SIZES.label * 0.22;
    const snapHits = (box, exceptIdx) => {
      for (let j = 0; j < relaxItems.length; j++) {
        if (j === exceptIdx) continue;
        if (pbBoxesHit(box, s_labelBox(relaxItems[j], SIZES.label))) return true;
      }
      for (const ob of obstacles) {
        const nx = Math.max(box.x1, Math.min(ob.x, box.x2));
        const ny = Math.max(box.y1, Math.min(ob.y, box.y2));
        if (Math.hypot(nx - ob.x, ny - ob.y) < ob.r + PB_PT_PAD) return true;
      }
      return false;
    };
    relaxItems.forEach((l, i) => {
      const cur = s_labelBox(l, SIZES.label);
      const cnx = Math.max(cur.x1, Math.min(l.px, cur.x2));
      const cny = Math.max(cur.y1, Math.min(l.py, cur.y2));
      if (Math.hypot(cnx - l.px, cny - l.py) < 26) return;   // ya está cerca
      const cands = [
        { lx: l.px, ly: l.py - r0 - SNAP_GAP - dn, anchor: 'middle' },  // arriba
        { lx: l.px, ly: l.py + r0 + SNAP_GAP + up, anchor: 'middle' }   // abajo
      ];
      for (const c of cands) {
        const box = s_labelBox({ ...l, ...c }, SIZES.label);
        if (box.x1 < plotBox.x1 || box.x2 > plotBox.x2 ||
            box.y1 < plotBox.y1 || box.y2 > plotBox.y2) continue;
        if (!snapHits(box, i)) { l.lx = c.lx; l.ly = c.ly; l.anchor = c.anchor; break; }
      }
    });

    // Líneas guía: del punto al borde más cercano de la caja del label. Solo si
    // el label se corrió de verdad (umbral alto → sin stubs cortos que ensucian).
    const leaderG = document.createElementNS(ns, 'g');
    svg.appendChild(leaderG);
    relaxItems.forEach(l => {
      const B = s_labelBox(l, SIZES.label);
      const nx = Math.max(B.x1, Math.min(l.px, B.x2));
      const ny = Math.max(B.y1, Math.min(l.py, B.y2));
      const dx = nx - l.px, dy = ny - l.py;
      const dist = Math.hypot(dx, dy);
      if (dist > r0 + 16) {
        const ux = dx / dist, uy = dy / dist;
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', l.px + ux * r0);
        line.setAttribute('y1', l.py + uy * r0);
        line.setAttribute('x2', nx - ux * 2);
        line.setAttribute('y2', ny - uy * 2);
        line.setAttribute('stroke', '#9a9488');
        line.setAttribute('stroke-width', 1.2);
        line.setAttribute('stroke-opacity', 0.6);
        line.setAttribute('stroke-linecap', 'round');
        leaderG.appendChild(line);
      }
    });
    // Volcar las posiciones relajadas a placed para el render.
    placed.forEach((lbl, i) => { lbl.x = relaxItems[i].lx; lbl.y = relaxItems[i].ly; });
  }

  placed.forEach(lbl => {
    const t_el = document.createElementNS(ns, 'text');
    t_el.setAttribute('class', 'country-label' + (hoverReg ? ' spotlight-label' : ''));
    t_el.setAttribute('x', lbl.x);
    t_el.setAttribute('y', lbl.y);
    t_el.setAttribute('text-anchor', lbl.anchor);
    t_el.setAttribute('fill', REGION_LABEL_COLORS[lbl.region] || '#1A1A1A');
    if (square) {
      t_el.style.fontSize = SIZES.label + 'px';
      // Halo crema para legibilidad sobre puntos del mismo color. stroke usa
      // var(--bg): png-export lo resuelve a rgb al rasterizar (trampa #2).
      t_el.style.stroke = 'var(--bg)';
      t_el.style.strokeWidth = SIZES.halo + 'px';
      t_el.style.paintOrder = 'stroke';
      t_el.style.strokeLinejoin = 'round';
      if (SIZES.weight) t_el.style.fontWeight = SIZES.weight;
    }
    t_el.textContent = lbl.text;
    svg.appendChild(t_el);
  });
}


// === Wiring de scale toggles (charts 1 y 2) ===
document.querySelectorAll('.toggle').forEach(toggle => {
  const target = toggle.dataset.target;
  if (!target || target === 'scaleY3') return;  // chart 3 lo maneja timeseries.js
  toggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const scale = btn.dataset.scale;
      const chartId = parseInt(target.slice(-1));
      const which = target.startsWith('scaleX') ? 'scaleX' : 'scaleY';
      state[chartId][which] = scale;
      drawChart(chartId);
    });
  });
});

// === Wiring del download CSV (snapshot del scatter) ===
// Procesa botones con data-chart="1" | "2" | "snapshot".
// Para data-chart="3" hay handler dedicado en timeseries.js (formato distinto).
document.querySelectorAll('button[data-chart]').forEach(btn => {
  const scope = btn.dataset.chart;
  if (scope === '3') return;

  let cols, filename;
  if (scope === '1') {
    cols = ['country', 'iso3', 'region', 'gdp_pc_ppp', 'year_gdp', 'life_satisfaction', 'year_lifesat'];
    filename = 'el-atlas-01-wellbeing-vs-gdp.csv';
  } else if (scope === '2') {
    cols = ['country', 'iso3', 'region', 'gdp_pc_ppp', 'year_gdp', 'homicide_rate', 'year_homicide'];
    filename = 'el-atlas-01-homicide-vs-gdp.csv';
  } else {  // 'snapshot' — dataset combinado del scatter en el index
    cols = ['country', 'iso3', 'region', 'gdp_pc_ppp', 'year_gdp', 'life_satisfaction', 'year_lifesat', 'homicide_rate', 'year_homicide'];
    filename = 'el-atlas-01-snapshot.csv';
  }

  btn.addEventListener('click', () => {
    let csv = cols.join(',') + '\n';
    DATA.forEach(d => {
      csv += cols.map(c => {
        const v = d[c];
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
        return v;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});

// === Registro para el export PNG mobile-first ===
// png-export.js setea __atlasPngFormatOverride = 'square' y llama __atlasRedraw()
// para re-renderizar el/los chart(s) en grande antes de rasterizar, y luego
// restaura. Usamos un registro de funciones porque el index.html carga scatter.js
// y timeseries.js juntos: cada uno empuja su redraw sin pisar al otro.
window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedrawFns = window.__atlasRedrawFns || [];
window.__atlasRedrawFns.push(function () {
  [1, 2].forEach(id => {
    if (state[id] && document.getElementById('chart' + id)) drawChart(id);
  });
});
window.__atlasRedraw = function () { window.__atlasRedrawFns.forEach(fn => fn()); };
