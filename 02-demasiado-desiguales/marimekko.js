// =============================================================
//  marimekko.js — chart 1 del N°2 "Demasiado desiguales"
// =============================================================
//
// Ranking marimekko de coeficiente de Gini por país, ordenado desc.
// Cada barra es un país (ancho igual), coloreada por región (7 regiones BM).
//
// Features:
//   - Toggle Gini original (raw) / Gini ajustado (consumo × 1.13).
//   - Slider temporal 2000-2024 con botón play (~8 seg recorrido completo).
//   - Hover sobre chip de región: atenúa otras + muestra línea vertical
//     punteada con el promedio simple regional, posicionada en el ranking
//     como si fuera un país (entre los dos países que la rodean en valor).
//   - Anti-colisión greedy para etiquetas de país (lista de prioridad +
//     extremos del ranking).
//   - Para PNG export: todas las 7 líneas regionales visibles
//     simultáneamente (hook onBeforePngExport).
//
// Depende de: DATA_MARIMEKKO, REGION_WB_ORDER, REGION_WB_COLORS,
// REGION_WB_LABEL_COLORS, LANG, t, state[1].

// =================== Constantes ===================
const M_W = 1100, M_H = 470;
// Top: 50px para 2 filas de labels de promedio regional con anti-colisión.
// Bottom: 110px — espacio para callout (palito o S) + texto rotado bajo el
// eje X. El texto se proyecta hasta yAnchor + ~0.707*textW; textos típicos
// de los priority (~80px) ocupan ~57px hacia abajo desde yAnchor=414.
const M_MARGIN = { top: 50, right: 32, bottom: 110, left: 56 };

// Configuración del algoritmo de etiquetas estilo OWID.
//
// Reglas:
//   1. Texto rotado -45°: la primera letra (anclaje tx, ty) queda abajo-
//      izquierda y la última arriba-derecha (diagonal subiendo).
//   2. TODAS las etiquetas se anclan a la misma altura Y_LABEL_ANCHOR
//      (sin multi-row de etiquetas — el texto siempre arranca al mismo Y).
//   3. Línea guía:
//      a. Si la etiqueta cabe centrada sobre su barra: callout vertical
//         puro (palito recto desde la base de la barra hasta el texto).
//      b. Si no cabe (colisiona con etiqueta vecina): "S" o "Z" con tres
//         segmentos rectos — V corto desde la base de la barra hasta una
//         altura intermedia (bendY), H horizontal hasta x=tx, V final
//         hasta el ancla del texto. Los tres segmentos son variables.
//   4. Para evitar que las S se crucen entre sí, hay M_BEND_ROW_COUNT
//      filas de bend disponibles. Cada etiqueta con displacement toma la
//      fila más baja (cerca del eje X) cuyos H y V no choquen con S ya
//      colocadas. Las labels con poco displacement caen en filas bajas;
//      las que se desplazan mucho terminan en filas altas (cerca del
//      anchor de texto).
//   5. Greedy left→right por barX, sin movimiento a la izquierda
//      (preserva orden). Para seleccionadas que no entran, la patita
//      puede extenderse fuera del plot a la derecha.
const M_LABEL_ANGLE_RAD = 45 * Math.PI / 180;
const M_LABEL_FONT_SIZE = 10;
const M_LABEL_ANCHOR_Y_OFFSET = 50;   // distancia eje X → fin de línea guía
const M_BEND_ROW_COUNT = 5;
const M_BEND_ROW_GAP = 8;             // separación vertical entre filas de bend
const M_BEND_ROW_OFFSET = 6;          // distancia eje X → primera fila de bend
const M_LABEL_MIN_GAP_X = 5;          // gap mínimo entre huellas horizontales
const M_CALLOUT_PAD = 2;              // separación mínima entre segmentos de callouts distintos
const M_PLOT_W = M_W - M_MARGIN.left - M_MARGIN.right;
const M_PLOT_H = M_H - M_MARGIN.top - M_MARGIN.bottom;
const M_Y_MIN = 0, M_Y_MAX = 75;
const M_Y_TICKS = [0, 10, 20, 30, 40, 50, 60, 70];

// Países cuyas etiquetas tienen prioridad en el anti-colisión (greedy).
// Lista curada editorialmente por Daniel para que se vean por default.
const M_PRIORITY_LABELS = new Set([
  'NAM', 'COL', 'BRA', 'CHL', 'ARG', 'MEX', 'CHN', 'NER',
  'ESP', 'JPN', 'USA', 'CAN', 'DEU', 'NOR', 'SVK'
]);

// Helper: devuelve el nombre del país en el idioma activo, usando el
// diccionario COUNTRY_NAMES (en country-names.js). Fallback al name que
// venga del dataset si el iso3 no está cargado.
function m_displayName(d) {
  return (COUNTRY_NAMES[d.code]?.[LANG]) || d.name;
}

const M_SVG_NS = 'http://www.w3.org/2000/svg';
const m_ns = (tag) => document.createElementNS(M_SVG_NS, tag);

// =================== Helpers ===================
function m_yScale(g) {
  return M_MARGIN.top + M_PLOT_H - (g - M_Y_MIN) / (M_Y_MAX - M_Y_MIN) * M_PLOT_H;
}

// Devuelve la posición X "intercalada en el ranking" donde encajaría el
// valor `val` dentro del array sorted por valKey desc.
function m_rankPositionX(sorted, valKey, val, barWidth) {
  // Busca el primer índice donde sorted[i][valKey] < val.
  let i = 0;
  while (i < sorted.length && sorted[i][valKey] >= val) i++;
  // i es donde va "entre" la barra i-1 y la barra i.
  return M_MARGIN.left + i * barWidth;
}

// Helper: medir ancho de texto reusando un canvas en memoria.
function m_measureText(text, fontSize) {
  if (!m_measureText._ctx) {
    m_measureText._ctx = document.createElement('canvas').getContext('2d');
  }
  m_measureText._ctx.font = `500 ${fontSize}px "Source Sans 3", sans-serif`;
  return m_measureText._ctx.measureText(text).width;
}

// Devuelve los iso3 a etiquetar en modo default (sin selección activa).
// Usa la lista curada por Daniel (15 países editorialmente relevantes)
// más los extremos del ranking del año/modo actual (rank 1 y rank último).
// Filtra a los que están presentes en sortedData (algunos años pueden no
// tener ciertos países si su última observación cae fuera de la ventana 15a).
function m_defaultLabelCodes(sortedData) {
  const priority = [
    'NAM', 'COL', 'BRA', 'CHL', 'ARG', 'MEX', 'CHN', 'NER',
    'ESP', 'JPN', 'USA', 'CAN', 'DEU', 'NOR', 'SVK'
  ];
  const present = new Set(sortedData.map(d => d.code));
  const result = new Set(priority.filter(c => present.has(c)));
  // Extremos del ranking — siempre presentes, sean quienes sean cada año.
  if (sortedData.length > 0) {
    result.add(sortedData[0].code);
    result.add(sortedData[sortedData.length - 1].code);
  }
  return result;
}

// Devuelve los iso3 de los extremos del ranking actual (rank 1 y último).
// Estos tienen tratamiento especial en el algoritmo de placement: si no
// entran en la fase 1 (sin overflow), se reintenta con allowOverflow para
// garantizar que siempre se rendereen.
function m_extremeCodes(sortedData) {
  if (sortedData.length === 0) return new Set();
  return new Set([sortedData[0].code, sortedData[sortedData.length - 1].code]);
}

// Algoritmo de etiquetas estilo OWID. Devuelve array de objetos
// {tx, ty, bendY, displaced, barX, text, color, isSelected, ...} con la
// info necesaria para dibujar el callout (palito o S) + texto rotado.
//
// Modos:
//   - default: 15 países priority (lista curada de Daniel).
//   - con selección: priority + seleccionados. Los seleccionados se procesan
//     primero (greedy) para que conserven su posición ideal.
function m_layoutCountryLabels(sortedData, barWidth, plotArea, selectedCodes) {
  const priorityCodes = m_defaultLabelCodes(sortedData);
  const extremeCodes = m_extremeCodes(sortedData);
  const selSet = new Set(selectedCodes || []);
  const codesToShow = new Set([...priorityCodes, ...selSet]);

  const angle = M_LABEL_ANGLE_RAD;
  const cos = Math.cos(angle), sin = Math.sin(angle);  // ambos ≈ 0.707
  const fontSize = M_LABEL_FONT_SIZE;
  const minGap = M_LABEL_MIN_GAP_X;
  const leftBound  = plotArea.left + 2;
  const rightBound = plotArea.right - 4;
  const yLine = plotArea.bottom + M_LABEL_ANCHOR_Y_OFFSET;       // fin de línea guía
  const yAnchor = yLine + 4;  // pequeño gap entre fin de guía y "a" final

  // 1. Construir anchors. (tx, ty=yAnchor) será la posición de la ÚLTIMA letra
  //    del texto rotado -45° con text-anchor:end. El texto se proyecta hacia
  //    abajo-izquierda: footprint horizontal = [tx - projW, tx].
  //    projW = cos*textW + sin*fontSize (ancho de la huella del rectángulo
  //    rotado proyectado sobre el eje X).
  const anchors = [];
  sortedData.forEach((d, i) => {
    if (!codesToShow.has(d.code)) return;
    const text = m_displayName(d);
    const textW = Math.max(22, m_measureText(text, fontSize));
    const projW = cos * textW + sin * fontSize + 2;
    const isSel = selSet.has(d.code);
    const isPri = priorityCodes.has(d.code);
    const isExtreme = extremeCodes.has(d.code);
    anchors.push({
      code: d.code,
      text,
      color: REGION_WB_LABEL_COLORS[d.region] || '#555',
      barX: plotArea.left + i * barWidth + barWidth / 2,
      textW, projW,
      source: isSel ? (isPri ? 'both' : 'selected') : 'priority',
      isSelected: isSel,
      isExtreme
    });
  });

  // 2. Greedy left→right por barX SIN priorizar seleccionados.
  //    Procesamos todas en orden por posición de barra. Esto evita que un
  //    seleccionado conserve "palito recto" (tx=barX) y obligue a las
  //    priority adyacentes a hacer Z muy largas — todas siguen las mismas
  //    reglas geométricas. Para garantizar que los seleccionados nunca se
  //    omiten, hacemos un retry con allowOverflow si no entran sin él.
  const orderedAnchors = anchors.slice().sort((a, b) => a.barX - b.barX);

  // Boxes de colisión ya colocados:
  //   - text footprints: huella horizontal del texto en y=yAnchor (todos
  //     comparten el mismo y, así que basta comparar rangos en x).
  //   - callout segments: H y V finales de las S ya colocadas (para que
  //     una nueva S no cruce visualmente a una previa).
  const placedTextFootprints = [];  // {x1, x2}
  const placedCalloutSegments = [];  // {kind:'H', y, x1, x2} o {kind:'V', x, y1, y2}
  const toDraw = [];

  // Encuentra un tx libre a partir de idealTx, avanzando hacia la derecha.
  // El footprint del texto va de [tx - projW, tx] (proyectado a la izquierda).
  // Greedy: si choca con un footprint previo, mueve tx a la derecha hasta
  // que (tx - projW) >= prev.x2 + minGap. Devuelve null si no entra en el
  // bound permitido. Mínimo absoluto: tx >= leftBound + projW (para que el
  // texto no se salga por la izquierda del plot).
  function findFreeTx(idealTx, projW, allowOverflow) {
    const maxX = allowOverflow ? rightBound + 80 : rightBound;
    const minX = leftBound + projW;
    let tx = Math.max(minX, idealTx);
    let guard = 0;
    while (guard++ < 60) {
      // Footprint propuesto: [tx - projW, tx]
      const conflict = placedTextFootprints.find(f =>
        !(tx <= f.x1 - minGap || (tx - projW) >= f.x2 + minGap)
      );
      if (!conflict) return tx <= maxX ? tx : null;
      // Mover tx para que (tx - projW) = conflict.x2 + minGap
      tx = conflict.x2 + minGap + projW;
      if (tx > maxX) return null;
    }
    return null;
  }

  // Para un callout S propuesto (barX → bendY → tx → yLine), verifica que
  // ningún segmento existente lo cruce, considerando un padding de
  // M_CALLOUT_PAD para que las líneas no se "rocen" visualmente aunque no
  // se crucen geométricamente.
  function calloutIsClear(barX, tx, bendY) {
    const pad = M_CALLOUT_PAD;
    const hSeg = { kind: 'H', y: bendY, x1: Math.min(barX, tx), x2: Math.max(barX, tx) };
    const vFinalSeg = { kind: 'V', x: tx, y1: bendY, y2: yLine };
    for (const s of placedCalloutSegments) {
      if (s.kind === 'H') {
        // H vs H: muy cerca en y Y se solapan en x.
        if (Math.abs(s.y - hSeg.y) < pad &&
            !(hSeg.x2 + pad < s.x1 || hSeg.x1 > s.x2 + pad)) return false;
        // H vs V propuesta.
        if (vFinalSeg.x >= s.x1 - pad && vFinalSeg.x <= s.x2 + pad &&
            s.y >= vFinalSeg.y1 - pad && s.y <= vFinalSeg.y2 + pad) return false;
      } else if (s.kind === 'V') {
        // V vs H propuesta.
        if (s.x >= hSeg.x1 - pad && s.x <= hSeg.x2 + pad &&
            hSeg.y >= s.y1 - pad && hSeg.y <= s.y2 + pad) return false;
        // V vs V: muy cerca en x Y se solapan en y.
        if (Math.abs(s.x - vFinalSeg.x) < pad &&
            !(vFinalSeg.y2 + pad < s.y1 || vFinalSeg.y1 > s.y2 + pad)) return false;
      }
    }
    return true;
  }

  function tryPlace(a, allowOverflow) {
    const idealTx = a.barX;  // posición ideal: línea guía vertical pura sobre la barra
    const tx = findFreeTx(idealTx, a.projW, allowOverflow);
    if (tx === null) return null;
    const displaced = Math.abs(tx - a.barX) > 0.5;
    let bendY = null;
    if (displaced) {
      // Probamos filas desde la MÁS CERCANA AL LABEL (bendY grande, V final
      // corta) hacia la MÁS CERCANA AL EJE X (bendY chico, V final larga).
      // Razón: si la label anterior dejó su V final cerca del label
      // (bendY alto), la H actual puede pasar POR DEBAJO en SVG (y menor)
      // sin cruzar esa V. Esto evita que las S sucesivas se enreden — la
      // regla geométrica de OWID.
      for (let r = M_BEND_ROW_COUNT - 1; r >= 0; r--) {
        const candidateBendY = plotArea.bottom + M_BEND_ROW_OFFSET + r * M_BEND_ROW_GAP;
        if (candidateBendY >= yLine - 4) continue;  // no debe pegarse al yLine
        if (calloutIsClear(a.barX, tx, candidateBendY)) {
          bendY = candidateBendY;
          break;
        }
      }
      if (bendY === null) {
        // Fallback: la fila más cercana al eje X (último recurso).
        bendY = plotArea.bottom + M_BEND_ROW_OFFSET;
      }
    }
    return { ...a, tx, ty: yAnchor, yLine, bendY, displaced };
  }

  function commit(p) {
    // Footprint del texto: [tx - projW, tx] (texto se extiende hacia la izquierda de tx).
    placedTextFootprints.push({ x1: p.tx - p.projW, x2: p.tx });
    if (p.displaced) {
      placedCalloutSegments.push({
        kind: 'H', y: p.bendY,
        x1: Math.min(p.barX, p.tx), x2: Math.max(p.barX, p.tx)
      });
      // V final: de bendY hasta yLine (no hasta yAnchor; el texto empieza
      // un poco más abajo, con un gap visual).
      placedCalloutSegments.push({
        kind: 'V', x: p.tx, y1: p.bendY, y2: yLine
      });
      placedCalloutSegments.push({
        kind: 'V', x: p.barX, y1: plotArea.bottom, y2: p.bendY
      });
    } else {
      placedCalloutSegments.push({
        kind: 'V', x: p.barX, y1: plotArea.bottom, y2: yLine
      });
    }
    toDraw.push(p);
  }

  // Fase 1: sin overflow (palitos y S dentro del plot).
  const notPlacedForced = [];
  orderedAnchors.forEach(a => {
    const p = tryPlace(a, false);
    if (p) commit(p);
    else if (a.isSelected || a.isExtreme) notPlacedForced.push(a);
    // Las priority "comunes" que no entran se descartan silenciosamente.
    // Garantizamos colocación de: (a) las seleccionadas por el usuario y
    // (b) los extremos del ranking (rank 1 y rank último) que son
    // editorialmente clave para entender el rango.
  });

  // Fase 2: forzar colocación con allowOverflow (la patita puede
  // extenderse fuera del rightBound). NUNCA se omiten selecciones ni
  // extremos.
  notPlacedForced.forEach(a => {
    const p = tryPlace(a, true);
    if (p) commit(p);
  });

  return toDraw;
}

// =================== Render principal ===================
function drawMarimekko() {
  const svg = document.getElementById('chart1');
  if (!svg) return;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${M_W} ${M_H}`);

  const s1 = state[1];
  const year = String(s1.year);
  const mode = s1.mode;  // 'raw' | 'adj'
  const valKey = mode === 'raw' ? 'gini_raw' : 'gini_adj';
  const data = DATA_MARIMEKKO.data_by_year[year] || [];
  const sortedData = [...data].sort((a, b) => b[valKey] - a[valKey]);
  const n = sortedData.length;
  const barWidth = M_PLOT_W / n;
  const barInner = Math.max(1.2, barWidth - 0.4);

  // === Grid Y + labels ===
  // Si la grid line atraviesa la zona vertical de la tabla regional
  // (arriba-derecha), la recortamos antes de la tabla para que no la cruce
  // visualmente. La línea del eje (y=0) llega siempre hasta el final.
  const tableTopY = M_TABLE_Y_TITLE - 10;
  const tableBottomY = M_TABLE_Y_FIRST + 7 * M_TABLE_ROW_H;
  M_Y_TICKS.forEach(tv => {
    const y = m_yScale(tv);
    const line = m_ns('line');
    line.setAttribute('x1', M_MARGIN.left);
    const crossesTable = tv !== 0 && y >= tableTopY && y <= tableBottomY;
    const x2 = crossesTable ? M_TABLE_X - 10 : M_MARGIN.left + M_PLOT_W;
    line.setAttribute('x2', x2);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('class', tv === 0 ? 'm-axis-line' : 'm-grid-line');
    svg.appendChild(line);
    const tx = m_ns('text');
    tx.setAttribute('x', M_MARGIN.left - 8); tx.setAttribute('y', y + 4);
    tx.setAttribute('text-anchor', 'end'); tx.setAttribute('class', 'm-tick');
    tx.textContent = tv;
    svg.appendChild(tx);
  });
  // Label "Gini" arriba del eje
  const yLab = m_ns('text');
  yLab.setAttribute('x', M_MARGIN.left - 8); yLab.setAttribute('y', M_MARGIN.top - 8);
  yLab.setAttribute('text-anchor', 'end'); yLab.setAttribute('class', 'm-axis-label');
  yLab.textContent = t('c1-axis-y');
  svg.appendChild(yLab);

  // === Barras ===
  const tooltip = document.getElementById('tooltip1');
  const barsG = m_ns('g'); svg.appendChild(barsG);
  sortedData.forEach((d, i) => {
    const x = M_MARGIN.left + i * barWidth;
    const val = d[valKey];
    const y = m_yScale(val);
    const rect = m_ns('rect');
    rect.setAttribute('x', x + (barWidth - barInner) / 2);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barInner);
    rect.setAttribute('height', M_MARGIN.top + M_PLOT_H - y);
    rect.setAttribute('fill', REGION_WB_COLORS[d.region] || '#888');
    // Atenuación: solo las barras se atenúan. Las labels (abajo) mantienen
    // su color sólido siempre (estilo OWID — el lector siempre puede leer
    // el nombre del país aunque no esté destacado).
    const hasSelection = s1.selectedCountries && s1.selectedCountries.length > 0;
    const isSelected = hasSelection && s1.selectedCountries.includes(d.code);
    const dimByRegion = s1.activeRegion && s1.activeRegion !== d.region;
    const dimBySelection = hasSelection && !isSelected;
    const isDimmed = dimByRegion || dimBySelection;
    rect.setAttribute('class', 'm-bar' + (isDimmed ? ' m-dim' : '') + (isSelected ? ' m-spotlight' : ''));
    rect.dataset.code = d.code;
    rect.dataset.region = d.region;
    if (HAS_HOVER) {
      // Desktop: tooltip aparece al hover, sigue al cursor, se cierra al
      // salir. El click toggle la selección.
      rect.addEventListener('mouseenter', (e) => m_showTooltip(e, d, tooltip));
      rect.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
      rect.addEventListener('mousemove', (e) => m_positionTooltip(e, tooltip));
      rect.addEventListener('click', () => m_toggleCountrySelection(d.code));
    } else {
      // Mobile: tap muestra el tooltip Y toggle la selección. El tooltip
      // queda visible hasta que el usuario haga tap en otra barra (cambia
      // de tooltip) o en cualquier otro lugar (handler global en document).
      // El stopPropagation evita que el handler global cierre el recién
      // abierto.
      rect.addEventListener('click', (e) => {
        e.stopPropagation();
        m_showTooltip(e, d, tooltip);
        m_toggleCountrySelection(d.code);
      });
    }
    barsG.appendChild(rect);
  });

  // === Etiquetas de país en abanico bajo el eje X (Argendata/OWID style) ===
  // Layout en grilla de hasta M_LABEL_ROW_COUNT filas con detección de
  // colisión por bounding box rotado proyectado. Cada label lleva una
  // línea guía con quiebre que conecta su barra con el texto.
  const labelsG = m_ns('g'); svg.appendChild(labelsG);
  const plotArea = {
    left: M_MARGIN.left,
    right: M_MARGIN.left + M_PLOT_W,
    top: M_MARGIN.top,
    bottom: M_MARGIN.top + M_PLOT_H
  };
  const placedLabels = m_layoutCountryLabels(
    sortedData, barWidth, plotArea, s1.selectedCountries || []
  );
  const fontSize = M_LABEL_FONT_SIZE;
  placedLabels.forEach(l => {
    // Callout (línea guía) estilo OWID:
    //   - Sin displacement: VERTICAL puro desde la base de la barra hasta
    //     el ancla del texto. Palito recto.
    //   - Con displacement: forma "S/Z" — V corto desde la base de la barra
    //     hasta bendY, después H horizontal ("patita") hasta x=tx, después
    //     V final hasta y=ty (el ancla del texto). Los tres tramos varían
    //     en largo según la fila de bend asignada y el desplazamiento
    //     horizontal necesario.
    const path = m_ns('path');
    path.setAttribute('class', 'm-callout');
    path.setAttribute('data-source', l.source);
    let d;
    if (!l.displaced) {
      d = `M ${l.barX},${plotArea.bottom + 1} V ${l.yLine}`;
    } else {
      d = `M ${l.barX},${plotArea.bottom + 1} V ${l.bendY} H ${l.tx} V ${l.yLine}`;
    }
    path.setAttribute('d', d);
    path.setAttribute('stroke', l.color);
    path.setAttribute('stroke-width', l.isSelected ? '1.1' : '0.7');
    path.setAttribute('stroke-opacity', l.isSelected ? '0.9' : '0.6');
    path.setAttribute('fill', 'none');
    labelsG.appendChild(path);
    // Texto rotado -45° con text-anchor:end. (tx, ty=yAnchor) es la línea
    // base de la ÚLTIMA letra. La rotación lleva la primera letra hacia
    // abajo-izquierda: primera letra abajo-izquierda, última arriba-
    // derecha (al final de la línea guía, con pequeño gap visual).
    const txt = m_ns('text');
    txt.setAttribute('class', 'm-country-label' + (l.isSelected ? ' m-spotlight-label' : ''));
    txt.setAttribute('data-source', l.source);
    txt.setAttribute('x', l.tx);
    txt.setAttribute('y', l.ty);
    txt.setAttribute('transform', `rotate(-45 ${l.tx} ${l.ty})`);
    txt.setAttribute('text-anchor', 'end');
    txt.setAttribute('fill', l.color);
    txt.setAttribute('font-size', fontSize);
    txt.setAttribute('font-weight', l.isSelected ? '700' : '500');
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // === Tabla de promedios regionales (arriba-derecha del chart) ===
  // Reemplaza las líneas verticales punteadas que mostraban los promedios
  // de cada región intercalados en el ranking. Ubicada en la zona vacía
  // sobre las barras de la derecha (las de Gini más bajo). Filas ordenadas
  // por promedio descendente. Hover sobre chip de región → fila en bold.
  const regAvg = DATA_MARIMEKKO.regional_avg[year]?.[mode] || {};
  const tableRows = REGION_WB_ORDER
    .filter(reg => regAvg[reg] !== undefined)
    .map(reg => ({
      region: reg,
      color: REGION_WB_COLORS[reg],
      label: t('reg.' + reg),
      value: regAvg[reg]
    }))
    .sort((a, b) => b.value - a.value);

  drawRegionalAvgTable(svg, tableRows, s1.activeRegion);
}

// =================== Tabla de promedios regionales ===================
// Renderiza arriba-derecha del chart. Cada fila: swatch de color + nombre
// de región + valor (Gini promedio). El título arriba dice "PROMEDIO GINI
// POR REGIÓN". La fila correspondiente al activeRegion va en bold 700.
const M_TABLE_X      = 720;   // x_start (izquierda de la tabla)
const M_TABLE_W      = 348;   // ancho total (hasta plotArea.right ≈ 1068)
const M_TABLE_Y_TITLE = 64;   // y de la línea baseline del título
const M_TABLE_Y_FIRST = 84;   // y de la baseline de la primera fila
const M_TABLE_ROW_H  = 16;
const M_TABLE_SWATCH = 9;
const M_TABLE_SWATCH_GAP = 7;

function drawRegionalAvgTable(svg, rows, activeRegion) {
  const g = m_ns('g');
  g.setAttribute('id', 'm-avg-table');
  svg.appendChild(g);

  // Título
  const title = m_ns('text');
  title.setAttribute('class', 'm-table-title');
  title.setAttribute('x', M_TABLE_X);
  title.setAttribute('y', M_TABLE_Y_TITLE);
  title.textContent = t('c1-avg-table-title');
  g.appendChild(title);

  // Línea sutil bajo el título
  const rule = m_ns('line');
  rule.setAttribute('class', 'm-table-rule');
  rule.setAttribute('x1', M_TABLE_X);
  rule.setAttribute('x2', M_TABLE_X + M_TABLE_W);
  rule.setAttribute('y1', M_TABLE_Y_TITLE + 6);
  rule.setAttribute('y2', M_TABLE_Y_TITLE + 6);
  g.appendChild(rule);

  rows.forEach((row, i) => {
    const y = M_TABLE_Y_FIRST + i * M_TABLE_ROW_H;
    const isActive = activeRegion === row.region;
    const isDimmed = activeRegion && !isActive;
    const stateClass =
        (isActive ? ' m-table-row-active' : '')
      + (isDimmed ? ' m-table-row-dimmed' : '');

    // Swatch (cuadrito de color) — también se atenúa cuando otra región
    // está activa, para que el contraste con la fila activa sea claro.
    const swatch = m_ns('rect');
    swatch.setAttribute('class', 'm-table-swatch' + stateClass);
    swatch.setAttribute('data-region', row.region);
    swatch.setAttribute('x', M_TABLE_X);
    swatch.setAttribute('y', y - M_TABLE_SWATCH + 1);
    swatch.setAttribute('width', M_TABLE_SWATCH);
    swatch.setAttribute('height', M_TABLE_SWATCH);
    swatch.setAttribute('fill', row.color);
    g.appendChild(swatch);

    // Nombre región
    const labelEl = m_ns('text');
    labelEl.setAttribute('class', 'm-table-label' + stateClass);
    labelEl.setAttribute('data-region', row.region);
    labelEl.setAttribute('x', M_TABLE_X + M_TABLE_SWATCH + M_TABLE_SWATCH_GAP);
    labelEl.setAttribute('y', y);
    labelEl.textContent = row.label;
    g.appendChild(labelEl);

    // Valor (promedio Gini)
    const valueEl = m_ns('text');
    valueEl.setAttribute('class', 'm-table-value' + stateClass);
    valueEl.setAttribute('data-region', row.region);
    valueEl.setAttribute('x', M_TABLE_X + M_TABLE_W);
    valueEl.setAttribute('y', y);
    valueEl.setAttribute('text-anchor', 'end');
    valueEl.textContent = row.value.toFixed(1);
    g.appendChild(valueEl);
  });
}

// =================== Tooltip ===================
function m_showTooltip(e, d, tooltip) {
  const welfareLabel = t('c1-tt-welfare-' + d.welfare);
  const regionLabel = t('reg.' + d.region);
  const regionColor = REGION_WB_COLORS[d.region] || '#888';
  tooltip.innerHTML = `
    <strong>${m_displayName(d)}</strong>
    <div class="tt-region" style="color:${regionColor}">${regionLabel}</div>
    <div class="tt-row"><span>${t('c1-tt-year')}</span><span>${d.year}</span></div>
    <div class="tt-row"><span>${t('c1-tt-welfare')}</span><span>${welfareLabel}</span></div>
    <div class="tt-row"><span>${t('c1-tt-gini-raw')}</span><span>${d.gini_raw.toFixed(1)}</span></div>
    <div class="tt-row"><span>${t('c1-tt-gini-adj')}</span><span>${d.gini_adj.toFixed(1)}</span></div>
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  m_positionTooltip(e, tooltip);
}

function m_positionTooltip(e, tooltip) {
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
function renderMarimekkoLegend() {
  const container = document.querySelector('.m-legend[data-chart="1"]');
  if (!container) return;
  container.innerHTML = '';
  REGION_WB_ORDER.forEach(region => {
    const chip = document.createElement('span');
    chip.className = 'm-legend-chip';
    chip.dataset.region = region;
    chip.innerHTML = `
      <span class="m-legend-swatch" style="background:${REGION_WB_COLORS[region]}"></span>
      <span class="m-legend-label">${t('reg.' + region)}</span>
    `;
    if (HAS_HOVER) {
      chip.addEventListener('mouseenter', () => {
        state[1].activeRegion = region;
        drawMarimekko();
      });
      chip.addEventListener('mouseleave', () => {
        state[1].activeRegion = null;
        drawMarimekko();
      });
    }
    // Click: en mobile (sin hover), tap = toggle región activa.
    chip.addEventListener('click', () => {
      state[1].activeRegion = state[1].activeRegion === region ? null : region;
      drawMarimekko();
    });
    container.appendChild(chip);
  });
}

// =================== Slider con play ===================
const M_SLIDER_INTERVAL_MS = 320;  // ~8 segundos para 25 años

function setupMarimekkoSlider() {
  const slider = document.getElementById('m-slider');
  const playBtn = document.getElementById('m-play');
  const display = document.getElementById('m-year-display');
  if (!slider || !playBtn || !display) return;

  function updateDisplay() {
    display.textContent = state[1].year;
    slider.value = state[1].year;
  }
  updateDisplay();

  slider.addEventListener('input', () => {
    state[1].year = parseInt(slider.value, 10);
    updateDisplay();
    drawMarimekko();
  });

  let timer = null;
  function startPlay() {
    state[1].playing = true;
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', t('slider-pause'));
    timer = setInterval(() => {
      const next = state[1].year + 1;
      if (next > parseInt(slider.max, 10)) {
        stopPlay();
        return;
      }
      state[1].year = next;
      updateDisplay();
      drawMarimekko();
    }, M_SLIDER_INTERVAL_MS);
  }
  function stopPlay() {
    state[1].playing = false;
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', t('slider-play'));
    if (timer) { clearInterval(timer); timer = null; }
  }

  playBtn.addEventListener('click', () => {
    if (state[1].playing) stopPlay();
    else {
      // Si ya está en el final, reiniciar al inicio.
      if (state[1].year >= parseInt(slider.max, 10)) {
        state[1].year = parseInt(slider.min, 10);
        updateDisplay();
        drawMarimekko();
      }
      startPlay();
    }
  });
}

// =================== Toggle Gini original/ajustado ===================
function setupMarimekkoToggle() {
  document.querySelectorAll('.m-mode-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.m-mode-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state[1].mode = btn.dataset.mode;
      // Actualizar el data-i18n del subtítulo según el modo
      const subtitle = document.querySelector('.chart-block[data-chart="1"] .chart-subtitle');
      if (subtitle) {
        subtitle.dataset.i18n = state[1].mode === 'raw' ? 'c1-subtitle-raw' : 'c1-subtitle-adj';
        subtitle.innerHTML = I18N[LANG][subtitle.dataset.i18n] || '';
      }
      drawMarimekko();
    });
  });
}

// =================== Hook PNG export ===================
// El png-export.js llama esto antes de rasterizar. Mostramos todas las
// líneas regionales en el clone para que aparezcan simultáneamente en
// el PNG (en interactivo solo se ve la hovereada).
window.onBeforePngExport = (svgClone, chartId) => {
  if (chartId !== '1') return;
  const hasSelection = state[1]?.selectedCountries?.length > 0;
  // En el PNG nunca van las labels priority — son ruido en la versión
  // estática. PNG es o "panorámico con líneas regionales" (sin selección)
  // o "enfocado en los países elegidos" (con selección).
  svgClone.querySelectorAll('[data-source="priority"]').forEach(el => {
    el.style.display = 'none';
  });
  const vb = svgClone.viewBox.baseVal;
  const canvasLabels = [];

  // Tabla de promedios regionales: la TABLA va siempre (con y sin selección).
  // Los swatches (rects de color) y la línea del título quedan en el SVG.
  // Los TEXTOS (título + labels de región + valores) se sacan y se mandan a
  // canvas — el contexto aislado del <img> SVG no resuelve bien las
  // webfonts (Source Sans 3) y los textos salen con tracking equivocado.
  // PNG es estado actual sin "activeRegion" (no hay hover en estático).
  const tableEl = svgClone.querySelector('#m-avg-table');
  if (tableEl) {
    // Título
    const titleEl = tableEl.querySelector('.m-table-title');
    if (titleEl) {
      canvasLabels.push({
        x: parseFloat(titleEl.getAttribute('x')),
        y: parseFloat(titleEl.getAttribute('y')),
        text: titleEl.textContent.toUpperCase(),
        fill: '#8A8579',
        weight: '600',
        size: 10,
        textAnchor: 'start'
      });
      titleEl.style.display = 'none';
    }
    // Filas: labels + values. Quitamos la clase activa (PNG es sin hover).
    tableEl.querySelectorAll('.m-table-label, .m-table-value').forEach(el => {
      canvasLabels.push({
        x: parseFloat(el.getAttribute('x')),
        y: parseFloat(el.getAttribute('y')),
        text: el.textContent,
        fill: '#1A1A1A',
        weight: '500',
        size: 11,
        textAnchor: el.getAttribute('text-anchor') || 'start'
      });
      el.style.display = 'none';
    });
  }

  if (!hasSelection) {
    // PNG sin selección: solo barras + tabla regional arriba.
    const bottomKeep = M_MARGIN.top + M_PLOT_H + 8;
    const cropFromBottom = Math.max(0, vb.height - bottomKeep);
    svgClone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height - cropFromBottom}`);
  } else {
    // PNG con selección: barras + labels seleccionadas + callouts + tabla.
    // Recortamos dejando bottomKeep = yAnchor + 60 (margen para la
    // primera letra). Textos muy largos pueden cortarse 1-2px abajo.
    const bottomKeep = M_MARGIN.top + M_PLOT_H + M_LABEL_ANCHOR_Y_OFFSET + 60;
    const cropFromBottom = Math.max(0, vb.height - bottomKeep);
    svgClone.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height - cropFromBottom}`);
  }
  // Devolver labels que png-export debe pintar directamente en canvas para
  // garantizar la tipografía correcta.
  return { canvasLabels };
};

// Hook adicional: el caption del PNG cambia según el modo activo (raw/adj).
// El interactivo sigue mostrando el c1-sources general (que menciona ambos
// modos); el PNG usa la versión específica del modo.
window.onBeforePngExportGetSourceText = (chartId) => {
  if (chartId !== '1') return null;
  const key = state[1]?.mode === 'adj' ? 'c1-sources-adj' : 'c1-sources-raw';
  const html = I18N[LANG]?.[key];
  if (!html) return null;
  // El i18n string puede contener HTML (ej. <strong>). Lo limpiamos a texto plano
  // para que el canvas no renderee tags literales.
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent;
};

// =================== Init ===================
function initMarimekko() {
  if (!state[1]) {
    state[1] = { mode: 'raw', year: 2024, activeRegion: null, playing: false, selectedCountries: [] };
  } else if (!state[1].selectedCountries) {
    state[1].selectedCountries = [];
  }
  renderMarimekkoLegend();
  drawMarimekko();
  setupMarimekkoSlider();
  setupMarimekkoToggle();
  setupMarimekkoSearch();
  renderMarimekkoSelectedChips();
  setupMarimekkoDownloadCSV();
  // Mobile: handler global que cierra el tooltip al tap fuera de las
  // barras. Las barras hacen stopPropagation así que un tap sobre una
  // barra no llega acá. Solo registramos una vez (singleton).
  if (!HAS_HOVER && !initMarimekko._tooltipGlobalRegistered) {
    initMarimekko._tooltipGlobalRegistered = true;
    document.addEventListener('click', () => {
      const tt = document.getElementById('tooltip1');
      if (tt) tt.style.opacity = '0';
    });
  }
}

// =================== Buscador + chips de país seleccionado ===================
// Permite que el usuario destaque un país (o varios). Los seleccionados
// quedan con su color original; el resto se atenúa. Las etiquetas de los
// seleccionados se fuerzan a aparecer (prioridad máxima en el greedy).

function m_normalize(s) {
  // Para búsqueda case- y acento-insensitive
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function m_searchableCountries() {
  // Lista única de países del dataset (recorremos todos los años por las dudas
  // de que algún país aparezca solo en años específicos)
  const seen = new Set();
  const list = [];
  Object.values(DATA_MARIMEKKO.data_by_year).forEach(arr => {
    arr.forEach(d => {
      if (seen.has(d.code)) return;
      seen.add(d.code);
      list.push({ code: d.code, name: m_displayName(d), region: d.region });
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, LANG));
}

function m_toggleCountrySelection(code) {
  const arr = state[1].selectedCountries;
  const idx = arr.indexOf(code);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(code);
  renderMarimekkoSelectedChips();
  drawMarimekko();
}

function renderMarimekkoSelectedChips() {
  const container = document.getElementById('m-selected-chips');
  if (!container) return;
  container.innerHTML = '';
  state[1].selectedCountries.forEach(code => {
    // Buscar el país en el dataset para obtener su region
    const sample = Object.values(DATA_MARIMEKKO.data_by_year)
      .flat().find(d => d.code === code);
    if (!sample) return;
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = REGION_WB_COLORS[sample.region] || '#888';
    chip.textContent = (COUNTRY_NAMES[code]?.[LANG]) || sample.name;
    const x = document.createElement('button');
    x.className = 'm-chip-x';
    x.innerHTML = '×';
    x.setAttribute('aria-label', 'Remove');
    x.addEventListener('click', () => m_toggleCountrySelection(code));
    chip.appendChild(x);
    container.appendChild(chip);
  });
}

function setupMarimekkoSearch() {
  const input = document.getElementById('m-search');
  const results = document.getElementById('m-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = m_normalize(q);
    return m_searchableCountries()
      .filter(c => m_normalize(c.name).includes(qn))
      .slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const isSel = state[1].selectedCountries.includes(c.code);
      const cls = 'm-search-result' + (i === active ? ' m-active' : '') + (isSel ? ' m-already' : '');
      return `<div class="${cls}" data-code="${c.code}">${c.name}<span class="m-search-region">${t('reg-short.' + c.region) || ''}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => {
      el.addEventListener('click', () => {
        m_toggleCountrySelection(el.dataset.code);
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
      m_toggleCountrySelection(currentMatches[activeIdx].code);
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
// Dataset completo: todas las observaciones únicas (país × año) del PIP.
// Una observación es única por (iso3, year). Las "ventanas de 15 años" que
// usa el slider son derivadas de estas observaciones; el CSV exporta la
// fuente real, no la vista derivada.
// Convención de columnas: iso3 primero, descripciones después.
function setupMarimekkoDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="1-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const seen = new Set();
      const rows = [];
      Object.values(DATA_MARIMEKKO.data_by_year).flat().forEach(d => {
        const key = `${d.code}|${d.year}|${d.welfare}|${d.level}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(d);
      });
      rows.sort((a, b) => a.code.localeCompare(b.code) || a.year - b.year);

      const cols = ['iso3', 'country', 'region', 'year', 'welfare', 'reporting_level', 'gini_raw', 'gini_adj'];
      let csv = cols.join(',') + '\n';
      rows.forEach(d => {
        const row = [
          d.code,
          (COUNTRY_NAMES[d.code]?.en) || d.name,
          d.region,
          d.year,
          d.welfare,
          d.level,
          d.gini_raw,
          d.gini_adj
        ];
        csv += row.map(v => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
          return v;
        }).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'el-atlas-02-gini-observaciones.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}
