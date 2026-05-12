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

// Construye el rectángulo de una etiqueta dado offset y centro de punto
function buildRect(it, off) {
  const w = estimateLabelWidth(it.text);
  const lx = it.cx + off.dx;
  const ly = it.cy + off.dy;
  let x1, x2;
  if (off.anchor === 'start') { x1 = lx; x2 = lx + w; }
  else if (off.anchor === 'end') { x1 = lx - w; x2 = lx; }
  else { x1 = lx - w/2; x2 = lx + w/2; }
  return { rect: { x1, x2, y1: ly - 12, y2: ly + 2 }, lx, ly, anchor: off.anchor };
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
function placeLabels(items, pointPositions, plotBox) {
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

  const W = 760, H = 470;
  const margin = { top: 18, right: 22, bottom: 54, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

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
    lbl.setAttribute('y', margin.top + innerH + 16);
    lbl.setAttribute('text-anchor', 'middle');
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
    lbl.setAttribute('x', margin.left - 8);
    lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
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
  xT.setAttribute('y', H - 12);
  xT.setAttribute('text-anchor', 'middle');
  xT.textContent = t('axis-x') + (scaleX === 'log' ? t('log-suffix') : '');
  svg.appendChild(xT);

  const yLabel = chartId === 1 ? t('axis-y-1') : t('axis-y-2');
  const yT = document.createElementNS(ns, 'text');
  yT.setAttribute('class', 'axis-title');
  yT.setAttribute('x', -(margin.top + innerH / 2));
  yT.setAttribute('y', 16);
  yT.setAttribute('transform', 'rotate(-90)');
  yT.setAttribute('text-anchor', 'middle');
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

  // Estado de visibilidad, hover y spotlight pegado.
  // spotlightCountry: cuando el usuario hace click (o tap en mobile) en un
  // punto, ese país queda destacado y el resto atenuado al 12% hasta que se
  // limpie (click en zona vacía o nuevo click sobre el mismo punto).
  const visibleRegions = state[chartId].activeRegions;
  const hoverReg = state[chartId].hoverRegion;
  const spotCountry = state[chartId].spotlightCountry || null;
  const drawnRegions = new Set(visibleRegions);
  if (hoverReg) drawnRegions.add(hoverReg);
  if (spotCountry) {
    const spotPoint = allPoints.find(d => d.country === spotCountry);
    if (spotPoint) drawnRegions.add(spotPoint.region);
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
      return s;
    };
    return score(a) - score(b);
  });

  orderedDrawables.forEach(d => {
    const cx = xScale(scaleX === 'log' ? Math.log10(d.gdp_pc_ppp) : d.gdp_pc_ppp);
    const yval = scaleY === 'log' ? Math.log10(Math.max(d[yField], 0.05)) : d[yField];
    const cy = yScale(yval);

    const isLatam = d.region === 'Latin America';
    const isSpotlight = spotCountry && d.country === spotCountry;
    const isHovered = hoverReg && d.region === hoverReg;
    const noHoverNorSpot = !hoverReg && !spotCountry;

    // Tamaño y borde:
    // - Con spotlight: el país en spotlight queda muy destacado, el resto atenuado.
    // - Con hover sobre región (solo desktop): la región hovereada destacada.
    // - Sin nada: LATAM grande con borde (protagonista del Atlas), demás chicos.
    let r, fillOpacity, stroke, strokeWidth;
    if (isSpotlight) {
      r = 7; fillOpacity = 1; stroke = '#1A1A1A'; strokeWidth = 1.3;
    } else if (isHovered && !spotCountry) {
      r = 5.5; fillOpacity = 0.95; stroke = '#1A1A1A'; strokeWidth = 0.9;
    } else if (isLatam && noHoverNorSpot) {
      r = 5; fillOpacity = 0.92; stroke = '#1A1A1A'; strokeWidth = 0.7;
    } else {
      r = 3.8; fillOpacity = 0.7; stroke = 'white'; strokeWidth = 0.5;
    }

    const isDimmed = (hoverReg && !isHovered && !isSpotlight)
                  || (spotCountry && !isSpotlight);
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
    // Click (tap en mobile) = toggle spotlight pegado. El stopPropagation
    // impide que el click burbujee al SVG y se limpie inmediatamente.
    c.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (state[chartId].spotlightCountry === d.country) {
        state[chartId].spotlightCountry = null;
        tooltip.style.opacity = '0';
      } else {
        state[chartId].spotlightCountry = d.country;
      }
      drawChart(chartId);
    });
    ptsG.appendChild(c);
  });

  // Click en zona vacía del SVG limpia spotlight y tooltip pegados.
  // onclick (no addEventListener) para no acumular handlers en cada redraw.
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') {
      if (state[chartId].spotlightCountry) {
        state[chartId].spotlightCountry = null;
        drawChart(chartId);
      }
      tooltip.style.opacity = '0';
    }
  };

  // Etiquetas
  // - Con spotlight: solo el país en spotlight (forzado a entrar).
  // - Sin spotlight, con hover sobre región: todos los países de esa región
  //   (con los garantizados de esa región como Tier 0 — ej. al hover en
  //   "Europa Occidental", Alemania, Francia, UK, España e Italia son Tier 0).
  // - Sin nada: solo países LATAM (los 5 grandes garantizados; el resto si entra).
  let labelTargets;
  if (spotCountry) {
    labelTargets = orderedDrawables.filter(d => d.country === spotCountry);
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
    if (PRIORITY_GUARANTEED.has(d.country)) {
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

  const placed = placeLabels(labelCandidates, pointPositions, plotBox);

  placed.forEach(lbl => {
    const t_el = document.createElementNS(ns, 'text');
    t_el.setAttribute('class', 'country-label' + (hoverReg ? ' spotlight-label' : ''));
    t_el.setAttribute('x', lbl.x);
    t_el.setAttribute('y', lbl.y);
    t_el.setAttribute('text-anchor', lbl.anchor);
    t_el.setAttribute('fill', REGION_LABEL_COLORS[lbl.region] || '#1A1A1A');
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
