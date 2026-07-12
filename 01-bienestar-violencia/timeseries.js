// Lógica del timeseries (chart 3) del N°1.
// Específica del N°1; eventualmente migrará a lib/chart-timeseries.js.

//==================================================================
//  DRAW CHART 3 — Timeseries (LATAM+Caribe vs Mundo + spaghetti)
//==================================================================
// Estado del chart 3:
// - state[3].scaleY: 'log' | 'linear'
// - state[3].selectedCountries: Map<country, colorIdx> (selección persistente vía buscador o click; colorIdx indexa SELECTED_PALETTE)
// - state[3].hoverCountry: string | null  (transitorio, mientras el mouse está encima)

// Helpers para color de spaghetti hovereado (transitorio).
// Para selección persistente se usa la paleta rotativa (ver getSelectionColor).
function ts_regionColor(region) {
  return region === 'latam' ? '#BE5D32' : '#D89968';
}
function ts_regionLabelColor(region) {
  return region === 'latam' ? '#8B3F1E' : '#A35E2E';
}

// Color de la paleta rotativa para un país seleccionado (o null si no lo está).
function getSelectionColor(country) {
  const idx = state[3].selectedCountries.get(country);
  return idx == null ? null : SELECTED_PALETTE[idx % SELECTED_PALETTE.length];
}

// Próximo índice libre en la paleta. Si todos los slots están en uso (>= 6
// países seleccionados), arrancamos a ciclar reusando colores.
function nextFreeColorIndex() {
  const inUse = new Set(state[3].selectedCountries.values());
  for (let i = 0; i < SELECTED_PALETTE.length; i++) {
    if (!inUse.has(i)) return i;
  }
  return state[3].selectedCountries.size % SELECTED_PALETTE.length;
}

function drawChart3() {
  const svg = document.getElementById('chart3');
  const tooltip = document.getElementById('tooltip3');
  if (!svg) return;
  svg.innerHTML = '';

  const ns = 'http://www.w3.org/2000/svg';
  // Tres modos:
  //  - desktop: 760×470, fuentes de clase CSS (12px).
  //  - mobile interactivo: 760×470, fuentes sobredimensionadas inline.
  //  - square (export PNG): 1100×760 con fuentes grandes — SIN esto, el PNG
  //    cuadrado rasterizaba el viewBox apaisado 760×470 letterboxeado y el
  //    canvas quedaba con mucho espacio vacío (Daniel lo vio, 2026-07-12).
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = fmt === 'square';
  const mobile = !fmt && typeof isMobileViewport === 'function' && isMobileViewport();
  const big = square || mobile;
  const SZ = big
    ? { tick: 22, axisTitle: 24, endLabel: 19, hover: 22 }
    : { tick: 12, axisTitle: 12.5, endLabel: 11.5, hover: 12 };
  // Square 1100×910 (no 760): con 760 el PNG cuadrado quedaba con ~200px de
  // espacio vacío abajo (2ª ronda de Daniel, 12/7) — este chart no dibuja
  // leyenda en el canvas como los scatters, así que el gráfico debe ser más
  // alto para llenar el 1200×1200 (mismo alto que usan las líneas del especial).
  const W = square ? 1100 : 760, H = square ? 910 : 470;
  const margin = square
    ? { top: 34, right: 200, bottom: 110, left: 118 }
    : mobile
    ? { top: 24, right: 152, bottom: 74, left: 86 }
    : { top: 18, right: 130, bottom: 54, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;
  // El viewBox del HTML está fijo en 760×470; en square hay que actualizarlo
  // o el contenido 1100×760 queda recortado.
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const years = TIMESERIES.years;
  const yMin = years[0];
  const yMax = years[years.length-1];

  const useLog = state[3].scaleY === 'log';
  const rateMin = useLog ? 0.5 : 0;

  // En log el rango fijo 0.5-120 cubre todo. En lineal partimos de 60 (donde
  // entran las principales y la mayoría del spaghetti latinoamericano) y
  // expandimos hacia arriba si algún país seleccionado lo rompe (ej. Honduras
  // con picos cerca de 85). Los outliers del spaghetti de fondo siguen
  // cortándose en lineal a propósito — son fondo, no protagonistas.
  let rateMax;
  if (useLog) {
    rateMax = 120;
  } else {
    rateMax = 60;
    state[3].selectedCountries.forEach((_idx, country) => {
      const c = TIMESERIES.countries.find(x => x.country === country);
      if (!c) return;
      c.data.forEach(d => {
        if (d.rate != null && d.rate > rateMax) rateMax = d.rate;
      });
    });
    if (rateMax > 60) {
      if (rateMax <= 80) rateMax = 80;
      else if (rateMax <= 100) rateMax = 100;
      else rateMax = Math.ceil(rateMax / 20) * 20;
    }
  }

  const xScale = (year) => margin.left + ((year - yMin) / (yMax - yMin)) * innerW;
  let yScale;
  if (useLog) {
    const yDomain = [Math.log10(rateMin), Math.log10(rateMax)];
    yScale = (rate) => margin.top + innerH - ((Math.log10(Math.max(rate, rateMin)) - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;
  } else {
    yScale = (rate) => margin.top + innerH - ((Math.min(Math.max(rate, rateMin), rateMax) - rateMin) / (rateMax - rateMin)) * innerH;
  }

  // === Eje X ===
  const xTicks = [2000, 2004, 2008, 2012, 2016, 2020, 2024];
  xTicks.forEach(yr => {
    const x = xScale(yr);
    const gl = document.createElementNS(ns, 'line');
    gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', margin.top); gl.setAttribute('y2', margin.top + innerH);
    gl.setAttribute('class', 'grid-line');
    svg.appendChild(gl);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', margin.top + innerH + (big ? 30 : 18));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 'axis');
    if (big) lbl.style.fontSize = SZ.tick + 'px';
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });

  // === Eje Y ===
  // Log: ticks fijos en potencias 1-2-5. Lineal: ticks dinámicos según rateMax
  // (porque rateMax puede crecer si hay seleccionados que rompen los 60).
  const yTicks = useLog
    ? [1, 2, 5, 10, 20, 50, 100]
    : niceLinearTicks(rateMin, rateMax, 6);
  yTicks.forEach(v => {
    const y = yScale(v);
    const gl = document.createElementNS(ns, 'line');
    gl.setAttribute('x1', margin.left); gl.setAttribute('x2', margin.left + innerW);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.setAttribute('class', 'grid-line');
    svg.appendChild(gl);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', margin.left - (big ? 12 : 8)); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('class', 'axis');
    if (big) lbl.style.fontSize = SZ.tick + 'px';
    lbl.textContent = v;
    svg.appendChild(lbl);
  });

  // Título eje Y
  const yTitle = document.createElementNS(ns, 'text');
  yTitle.setAttribute('class', 'axis-title');
  yTitle.setAttribute('text-anchor', 'middle');
  if (big) yTitle.style.fontSize = SZ.axisTitle + 'px';
  yTitle.setAttribute('transform', `translate(${margin.left - (big ? 64 : 42)}, ${margin.top + innerH/2}) rotate(-90)`);
  // En big (mobile/square) el título completo rotado desbordaba el alto del
  // plot (Daniel, 12/7) → versión corta.
  const yTitleKey = big ? 'c3-axis-y-short' : 'c3-axis-y';
  yTitle.textContent = (I18N[LANG][yTitleKey] || I18N.es[yTitleKey]) + (useLog ? ' — log' : '');
  svg.appendChild(yTitle);

  // === Helper para construir path ===
  function buildPath(data) {
    const valid = data.filter(d => d.rate != null && d.rate > 0);
    if (valid.length === 0) return '';
    return valid.map((d, i) => {
      const x = xScale(d.year);
      const y = yScale(d.rate);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  // === ORDEN DE DIBUJADO (de atrás hacia adelante) ===
  // 1. Spaghetti gris (fondo)
  // 2. Líneas seleccionadas (sobre el spaghetti pero debajo de las principales)
  // 3. Halos de las líneas principales (blanco grueso)
  // 4. Líneas principales (terracota / azul)
  // 5. Etiquetas de fin de líneas principales
  // 6. Línea vertical de hover y markers
  // 7. Etiquetas hover de spaghetti

  // === Spaghetti BG ===
  // Solo dibujamos como fondo gris a los países LATAM+Caribe (la "nube" del N°1).
  // El dataset incluye ~145 países del mundo entero, pero los no-LATAM solo
  // entran al chart si el lector los selecciona vía buscador o click.
  // También excluimos a los seleccionados de aquí: van como línea destacada
  // aparte (ts-line-highlight, ver más abajo).
  const linesGroup = document.createElementNS(ns, 'g');
  linesGroup.setAttribute('id', 'ts-spaghetti');
  svg.appendChild(linesGroup);

  TIMESERIES.countries.forEach(c => {
    if (c.region !== 'latam' && c.region !== 'caribbean') return;
    if (state[3].selectedCountries.has(c.country)) return;
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', buildPath(c.data));
    path.setAttribute('class', 'ts-line-bg ' + c.region);
    path.setAttribute('data-country', c.country);
    path.setAttribute('data-region', c.region);
    linesGroup.appendChild(path);
  });

  // === Líneas destacadas (países seleccionados, cualquier región) ===
  // Color de paleta rotativa, click sobre la línea = deseleccionar.
  const highlightGroup = document.createElementNS(ns, 'g');
  highlightGroup.setAttribute('id', 'ts-highlight');
  svg.appendChild(highlightGroup);

  state[3].selectedCountries.forEach((_idx, country) => {
    const c = TIMESERIES.countries.find(x => x.country === country);
    if (!c) return;
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', buildPath(c.data));
    path.setAttribute('class', 'ts-line-highlight');
    path.setAttribute('data-country', country);
    path.style.stroke = getSelectionColor(country);
    path.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleCountrySelection(country);
    });
    highlightGroup.appendChild(path);
  });

  // === Halo de líneas principales ===
  const halosGroup = document.createElementNS(ns, 'g');
  svg.appendChild(halosGroup);
  ['latam_caribe', 'world'].forEach(key => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', buildPath(TIMESERIES.aggregates[key]));
    path.setAttribute('class', 'ts-line-main-halo');
    halosGroup.appendChild(path);
  });

  // === Líneas principales ===
  const mainGroup = document.createElementNS(ns, 'g');
  mainGroup.setAttribute('id', 'ts-main');
  svg.appendChild(mainGroup);
  ['latam_caribe', 'world'].forEach(key => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', buildPath(TIMESERIES.aggregates[key]));
    path.setAttribute('class', 'ts-line-main ' + key);
    mainGroup.appendChild(path);
  });

  // === Etiquetas al final de líneas (LATAM, Mundo, seleccionados) ===
  // Recolectar candidatos con su Y ideal (donde termina la línea), luego ordenar
  // y empujar verticalmente para evitar solapamiento. Si una etiqueta queda
  // separada de su ideal, se dibuja una guía corta tipo OWID.
  const endLabels = [];

  ['latam_caribe', 'world'].forEach(key => {
    const data = TIMESERIES.aggregates[key];
    const last = data[data.length - 1];
    endLabels.push({
      lineEndX: xScale(last.year),
      idealY: yScale(last.rate),
      cssClass: 'ts-end-label ' + key,
      fill: null,  // viene del CSS (.ts-end-label.latam_caribe / .world)
      // En mobile el nombre largo ("América Latina y el Caribe") a fuente
      // sobredimensionada se salía del borde derecho → versión corta.
      text: (key === 'latam_caribe')
        ? (I18N[LANG][big ? 'c3-legend-latam-short' : 'c3-legend-latam'] || '')
        : (I18N[LANG]['c3-legend-world'] || ''),
      leaderColor: key === 'latam_caribe' ? '#8B3F1E' : '#243B4E',
    });
  });

  state[3].selectedCountries.forEach((_idx, country) => {
    const c = TIMESERIES.countries.find(x => x.country === country);
    if (!c) return;
    const last = [...c.data].reverse().find(d => d.rate != null && d.rate > 0);
    if (!last) return;
    const color = getSelectionColor(country);
    endLabels.push({
      lineEndX: xScale(last.year),
      idealY: yScale(last.rate),
      cssClass: 'ts-hover-label',
      fill: color,
      text: LANG === 'es' ? c.country_es : c.country,
      leaderColor: color,
    });
  });

  // Anti-colisión: sweep top-to-bottom, empujar si quedan a < LABEL_GAP px
  const LABEL_GAP = 14;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + LABEL_GAP);
    l.shifted = Math.abs(l.y - l.idealY) > 1;
  });

  // Render: leader line primero (si hace falta), luego texto
  const endLabelsGroup = document.createElementNS(ns, 'g');
  svg.appendChild(endLabelsGroup);
  endLabels.forEach(l => {
    if (l.shifted) {
      const guide = document.createElementNS(ns, 'line');
      guide.setAttribute('x1', l.lineEndX);
      guide.setAttribute('y1', l.idealY);
      guide.setAttribute('x2', l.lineEndX + 4);
      guide.setAttribute('y2', l.y);
      guide.setAttribute('stroke', l.leaderColor);
      guide.setAttribute('stroke-width', 0.8);
      guide.setAttribute('stroke-opacity', 0.5);
      guide.setAttribute('fill', 'none');
      endLabelsGroup.appendChild(guide);
    }
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', l.lineEndX + 6);
    lbl.setAttribute('y', l.y + 4);  // baseline offset
    lbl.setAttribute('class', l.cssClass);
    if (big) lbl.style.fontSize = SZ.endLabel + 'px';
    if (l.fill) lbl.setAttribute('fill', l.fill);
    lbl.textContent = l.text;
    endLabelsGroup.appendChild(lbl);
  });

  // === Capa de hover (vline + markers + labels transitorios) ===
  const hoverGroup = document.createElementNS(ns, 'g');
  hoverGroup.setAttribute('id', 'ts-hover-layer');
  hoverGroup.setAttribute('display', 'none');
  svg.appendChild(hoverGroup);

  const vline = document.createElementNS(ns, 'line');
  vline.setAttribute('class', 'ts-hover-vline');
  vline.setAttribute('y1', margin.top);
  vline.setAttribute('y2', margin.top + innerH);
  hoverGroup.appendChild(vline);

  // Etiqueta del país hovereado en spaghetti (se muestra al final de la línea)
  const hoverLabel = document.createElementNS(ns, 'text');
  hoverLabel.setAttribute('class', 'ts-hover-label');
  if (big) hoverLabel.style.fontSize = SZ.hover + 'px';
  hoverLabel.setAttribute('display', 'none');
  svg.appendChild(hoverLabel);

  // === Función que actualiza la capa de hover según año y país hovereado ===
  function updateHoverLayer(year, hoveredCountry) {
    if (year < yMin || year > yMax) {
      hoverGroup.setAttribute('display', 'none');
      tooltip.style.opacity = '0';
      tooltip.style.display = 'none';
      return;
    }
    hoverGroup.setAttribute('display', '');
    while (hoverGroup.children.length > 1) hoverGroup.removeChild(hoverGroup.lastChild);

    const xAtYear = xScale(year);
    vline.setAttribute('x1', xAtYear);
    vline.setAttribute('x2', xAtYear);

    // Determinar series a mostrar en tooltip:
    //   1. LATAM+Caribe (siempre)
    //   2. Mundo (siempre)
    //   3. País hovereado (si hay)
    //   4. Países seleccionados persistentemente (chips)
    const seriesToShow = [];

    // LATAM+Caribe
    const latamObs = TIMESERIES.aggregates.latam_caribe.find(d => d.year === year);
    if (latamObs) {
      seriesToShow.push({
        key: 'latam_caribe',
        label: I18N[LANG]['c3-tt-latam'] || 'LATAM+Caribe',
        rate: latamObs.rate,
        color: '#BE5D32',
        markerR: 4.5,
      });
    }
    // Mundo
    const worldObs = TIMESERIES.aggregates.world.find(d => d.year === year);
    if (worldObs) {
      seriesToShow.push({
        key: 'world',
        label: I18N[LANG]['c3-tt-world'] || 'World',
        rate: worldObs.rate,
        color: '#3E5A6E',
        markerR: 4.5,
      });
    }

    // Países seleccionados (chips persistentes) — mostrar todos
    const seenCountries = new Set();
    state[3].selectedCountries.forEach((_idx, country) => {
      const c = TIMESERIES.countries.find(x => x.country === country);
      if (!c) return;
      const obs = c.data.find(d => d.year === year);
      if (!obs || obs.rate == null) return;
      seenCountries.add(country);
      seriesToShow.push({
        key: 'selected:' + country,
        label: LANG === 'es' ? c.country_es : c.country,
        rate: obs.rate,
        color: getSelectionColor(country),
        markerR: 3.5,
      });
    });

    // País hovereado (si no está ya seleccionado)
    if (hoveredCountry && !seenCountries.has(hoveredCountry)) {
      const c = TIMESERIES.countries.find(x => x.country === hoveredCountry);
      if (c) {
        const obs = c.data.find(d => d.year === year);
        if (obs && obs.rate != null) {
          seriesToShow.push({
            key: 'hover:' + hoveredCountry,
            label: LANG === 'es' ? c.country_es : c.country,
            rate: obs.rate,
            color: ts_regionColor(c.region),
            markerR: 3.5,
          });
        }
      }
    }

    // Dibujar markers
    seriesToShow.forEach(s => {
      const cx = xAtYear;
      const cy = yScale(s.rate);
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('class', 'ts-hover-marker');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', s.markerR);
      circle.setAttribute('fill', s.color);
      hoverGroup.appendChild(circle);
    });

    // Tooltip
    if (seriesToShow.length > 0) {
      const yearLbl = I18N[LANG]['c3-tt-year'] || 'Año';
      let html = `<div style="font-weight:600;margin-bottom:4px;">${yearLbl} ${year}</div>`;
      // Ordenar por valor descendente para que se lea claro
      const sorted = [...seriesToShow].sort((a, b) => b.rate - a.rate);
      sorted.forEach(s => {
        html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};"></span>
          <span style="flex:1;">${s.label}</span>
          <strong style="font-variant-numeric:tabular-nums;">${s.rate.toFixed(1)}</strong>
        </div>`;
      });
      tooltip.innerHTML = html;
      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
    }
  }

  // === Captura de mouse: rect transparente al FONDO del z-order ===
  // Sirve para que mousemove se dispare incluso en zonas vacías (entre líneas).
  // Se inserta como primer hijo del SVG para que las líneas spaghetti queden
  // por encima y reciban click/mouseenter sin que este rect los intercepte.
  const captureRect = document.createElementNS(ns, 'rect');
  captureRect.setAttribute('x', margin.left);
  captureRect.setAttribute('y', margin.top);
  captureRect.setAttribute('width', innerW);
  captureRect.setAttribute('height', innerH);
  captureRect.setAttribute('fill', 'transparent');
  captureRect.setAttribute('pointer-events', 'all');
  svg.insertBefore(captureRect, svg.firstChild);

  // === Hover sobre líneas individuales del spaghetti ===
  const allBgLines = linesGroup.querySelectorAll('.ts-line-bg');

  function applyHoverState(country) {
    state[3].hoverCountry = country;
    allBgLines.forEach(l => {
      l.classList.remove('dimmed', 'highlight');
      const c = l.dataset.country;
      const isSelected = state[3].selectedCountries.has(c);
      if (country) {
        if (c === country) {
          l.classList.add('highlight');
        } else if (!isSelected) {
          l.classList.add('dimmed');
        }
      }
    });
  }

  function clearHoverState() {
    state[3].hoverCountry = null;
    allBgLines.forEach(l => l.classList.remove('dimmed', 'highlight'));
  }

  allBgLines.forEach(line => {
    const country = line.dataset.country;
    const region = line.dataset.region;
    const countryData = TIMESERIES.countries.find(c => c.country === country);

    line.addEventListener('mouseenter', () => {
      applyHoverState(country);
      const lastValid = [...countryData.data].reverse().find(d => d.rate != null && d.rate > 0);
      if (lastValid && !state[3].selectedCountries.has(country)) {
        hoverLabel.setAttribute('x', xScale(lastValid.year) + 6);
        hoverLabel.setAttribute('y', yScale(lastValid.rate) + 4);
        hoverLabel.setAttribute('fill', ts_regionLabelColor(region));
        hoverLabel.textContent = LANG === 'es' ? countryData.country_es : countryData.country;
        hoverLabel.setAttribute('display', '');
      }
    });

    line.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleCountrySelection(country);
    });

    line.addEventListener('mouseleave', () => {
      clearHoverState();
      hoverLabel.setAttribute('display', 'none');
    });
  });

  // === Captura de movimiento general del mouse para vline/markers/tooltip ===
  function getYearAtCursor(ev) {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / W;
    const localX = (ev.clientX - rect.left) / scale;
    const yearF = yMin + (localX - margin.left) / innerW * (yMax - yMin);
    return Math.round(yearF);
  }

  function moveHandler(ev) {
    const year = getYearAtCursor(ev);
    if (year < yMin || year > yMax) {
      updateHoverLayer(-1, null);
      return;
    }
    updateHoverLayer(year, state[3].hoverCountry);
    // Posicionar tooltip cerca del cursor
    const rect = svg.getBoundingClientRect();
    tooltip.style.left = (ev.clientX - rect.left + 14) + 'px';
    tooltip.style.top = (ev.clientY - rect.top + 14) + 'px';
  }

  function leaveHandler() {
    updateHoverLayer(-1, null);
  }

  // El svg entero captura mousemove (líneas + rect transparente)
  svg.addEventListener('mousemove', moveHandler);
  svg.addEventListener('mouseleave', leaveHandler);

  // Click sobre fondo (rect) deselecciona hover (no toca selección)
  captureRect.addEventListener('click', () => {});

  // Render de chips
  renderChipsTS();
}

//==================================================================
//  CHIPS Y BUSCADOR — Chart 3
//==================================================================
function renderChipsTS() {
  const container = document.getElementById('ts-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  state[3].selectedCountries.forEach((_idx, country) => {
    const c = TIMESERIES.countries.find(x => x.country === country);
    if (!c) return;
    const chip = document.createElement('span');
    chip.className = 'ts-chip';
    chip.style.background = getSelectionColor(country);
    chip.textContent = LANG === 'es' ? c.country_es : c.country;
    const x = document.createElement('button');
    x.className = 'ts-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Remove');
    x.addEventListener('click', () => toggleCountrySelection(country));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function toggleCountrySelection(country) {
  if (state[3].selectedCountries.has(country)) {
    state[3].selectedCountries.delete(country);
  } else {
    state[3].selectedCountries.set(country, nextFreeColorIndex());
  }
  drawChart3();
}

// Buscador
(function setupSearch() {
  const input = document.getElementById('ts-search');
  const results = document.getElementById('ts-search-results');
  if (!input || !results) return;

  function getMatches(q) {
    const norm = (s) => s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const qn = norm(q.trim());
    if (!qn) return [];
    return TIMESERIES.countries.filter(c =>
      norm(c.country).includes(qn) || norm(c.country_es).includes(qn)
    ).slice(0, 8);
  }

  function renderResults(matches, activeIdx) {
    if (matches.length === 0) {
      results.innerHTML = `<div class="ts-search-result" style="cursor:default;color:var(--ink-muted);">${I18N[LANG]['c3-no-results'] || 'Sin resultados'}</div>`;
      results.classList.add('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const name = LANG === 'es' ? c.country_es : c.country;
      const regFull = REGION_CODE_TO_FULL[c.region] || '';
      const regLbl = regFull ? t('reg.' + regFull) : '';
      const cls = 'ts-search-result' + (i === activeIdx ? ' active' : '');
      return `<div class="${cls}" data-country="${c.country}">${name}<span class="reg">${regLbl}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.ts-search-result[data-country]').forEach(el => {
      el.addEventListener('click', () => {
        toggleCountrySelection(el.dataset.country);
        input.value = '';
        results.classList.remove('open');
        input.focus();
      });
    });
  }

  let activeIdx = -1;
  let currentMatches = [];
  input.addEventListener('input', () => {
    currentMatches = getMatches(input.value);
    activeIdx = currentMatches.length > 0 ? 0 : -1;
    renderResults(currentMatches, activeIdx);
  });

  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (currentMatches.length === 0) return;
      activeIdx = (activeIdx + 1) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (currentMatches.length === 0) return;
      activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (activeIdx >= 0 && currentMatches[activeIdx]) {
        toggleCountrySelection(currentMatches[activeIdx].country);
        input.value = '';
        results.classList.remove('open');
      }
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

  input.addEventListener('focus', () => {
    if (input.value && currentMatches.length > 0) {
      results.classList.add('open');
    }
  });
})();




// === Wiring de scale toggle para chart 3 ===
document.querySelectorAll('.toggle[data-target="scaleY3"]').forEach(toggle => {
  toggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[3].scaleY = btn.dataset.scale;
      drawChart3();
    });
  });
});

// === Wiring del download CSV (timeseries) ===
// Procesa solo botones con data-chart="3". Otros scopes los maneja scatter.js.
document.querySelectorAll('button[data-chart="3"]').forEach(btn => {
  btn.addEventListener('click', () => {
    // Formato long: una fila por (país, año). Incluye también los aggregates
    // LATAM+Caribe y Mundo para que el CSV reproduzca exactamente lo que el
    // chart muestra. Aggregates usan iso3 OWID/Banco Mundial (LAC, WLD).
    // Region en codes cortos del JSON se expande a nombres completos del
    // Atlas para que matchee con los CSV de chart-1 y chart-2.
    const cols = ['country', 'iso3', 'region', 'year', 'rate'];
    const rows = [];
    TIMESERIES.countries.forEach(c => {
      const regionFull = REGION_CODE_TO_FULL[c.region] || c.region;
      c.data.forEach(d => {
        rows.push([c.country, c.iso3, regionFull, d.year, d.rate]);
      });
    });
    TIMESERIES.aggregates.latam_caribe.forEach(d => {
      rows.push(['Latin America and the Caribbean', 'LAC', '', d.year, d.rate]);
    });
    TIMESERIES.aggregates.world.forEach(d => {
      rows.push(['World', 'WLD', '', d.year, d.rate]);
    });

    let csv = cols.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(v => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
        return v;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'el-atlas-01-homicide-timeseries.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});

// Contrato de re-dibujo (para el re-render on-resize de 01/utils.js y para el
// export PNG cuadrado). Antes el timeseries no lo registraba → no se
// re-dibujaba al cambiar de viewport ni al exportar.
window.__atlasSupportsFormats = true;
window.__atlasRedraw = drawChart3;
window.__atlasDefaultPngFormat = 'square';
