// =============================================================================
//  lib/scatter-render.js — motor de placement de labels del scatter (compartido)
// =============================================================================
// Helpers de colocación de etiquetas de país, COMPARTIDOS entre el scatter del
// N°2 (Gini vs PIB) y el del N°3 (Elo vs PIB). Antes estaban DUPLICADOS en cada
// scatter.js y se desincronizaron (N°2 quedó sin s_relaxLabels/s_labelBox → los
// labels se amontonaban). Esta es ahora la única fuente de verdad.
//
// Son funciones PURAS (sin estado, sin dependencias de datos): reciben cajas y
// puntos, devuelven posiciones. No saben de Gini ni de Elo.
//
// CARGAR EN EL HTML ANTES de scatter.js:
//   <script src="../lib/scatter-render.js"></script>
//   <script src="scatter.js"></script>
//
// Etapa 1 de la unificación del scatter (ver export-png-estado en memoria). La
// Etapa 2 moverá el cuerpo del render (drawScatterCore) acá también.

// =================== Label placement ===================
// Greedy: para cada candidato, default 1:30. Si choca, cardinales (12/3/6/9) y
// NW. Si nada entra, descartar (salvo forced, que se fuerza al default aunque
// pise). Después, en formatos grandes, s_relaxLabels separa en 2D + despeja
// los puntos.
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

// items: [{cx, cy, text, textW, ..., forced, subPriority}]
// forced=true: si nada entra, se fuerza el default aunque pise.
function s_layoutLabels(items, plotBox) {
  // Orden: forced primero → subPriority asc → X decreciente (zona densa
  // primero).
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
      // Último recurso: usar default aunque pise. Solo para forced.
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
// fuente. labelH ≈ tamaño de fuente; el texto se ancla por baseline, así que
// el alto se reparte ~0.78 arriba (ascendentes) / ~0.22 abajo (descendentes).
function s_labelBox(l, labelH) {
  let x1, x2;
  if (l.anchor === 'start')      { x1 = l.lx;            x2 = l.lx + l.textW; }
  else if (l.anchor === 'end')   { x1 = l.lx - l.textW;  x2 = l.lx; }
  else                           { x1 = l.lx - l.textW/2; x2 = l.lx + l.textW/2; }
  const y1 = l.ly - labelH * 0.78, y2 = l.ly + labelH * 0.22;
  return { x1, x2, y1, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

// Relajación anti-colisión 2D. Para formatos grandes (PNG mobile-first), el
// placement greedy deja los labels apiñados y encima de sus puntos. Esta pasada
// empuja iterativamente:
//   (a) cada par de labels solapado por su eje de MENOR solape, y
//   (b) cada label que cubra un PUNTO (obstáculo) lo corre para despejarlo.
// Así se reparten en 2D Y se sacan de encima de los puntos; quedan reconectados
// con una línea guía gris (dibujada en drawScatter). Bounded por `passes`;
// clamp al área de plot.
function s_relaxLabels(placed, labelH, plotBox, passes, obstacles) {
  const PAD = 8;       // colchón mínimo entre cajas
  const PT_PAD = 4;    // separación mínima entre caja de label y punto
  for (let p = 0; p < passes; p++) {
    let moved = false;
    // (a) label ↔ label
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = s_labelBox(placed[i], labelH);
        const b = s_labelBox(placed[j], labelH);
        const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) + PAD;
        const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) + PAD;
        if (ox > 0 && oy > 0) {
          if (oy <= ox) {            // menor solape vertical → empujar en Y
            const push = oy / 2;
            if (a.cy <= b.cy) { placed[i].ly -= push; placed[j].ly += push; }
            else              { placed[i].ly += push; placed[j].ly -= push; }
          } else {                   // menor solape horizontal → empujar en X
            const push = ox / 2;
            if (a.cx <= b.cx) { placed[i].lx -= push; placed[j].lx += push; }
            else              { placed[i].lx += push; placed[j].lx -= push; }
          }
          moved = true;
        }
      }
    }
    // (b) label ↔ punto: si la caja del label invade el círculo de un punto,
    // empujar el label en la dirección punto→centro-de-la-caja hasta despejar.
    if (obstacles && obstacles.length) {
      for (let i = 0; i < placed.length; i++) {
        const a = s_labelBox(placed[i], labelH);
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
  // Mantener cada label dentro del área de plot.
  const up = labelH * 0.78, dn = labelH * 0.22;
  placed.forEach(l => {
    l.ly = Math.max(plotBox.y1 + up, Math.min(plotBox.y2 - dn, l.ly));
    if (l.anchor === 'start')    l.lx = Math.max(plotBox.x1, Math.min(plotBox.x2 - l.textW, l.lx));
    else if (l.anchor === 'end') l.lx = Math.max(plotBox.x1 + l.textW, Math.min(plotBox.x2, l.lx));
    else                         l.lx = Math.max(plotBox.x1 + l.textW/2, Math.min(plotBox.x2 - l.textW/2, l.lx));
  });
}

// =============================================================================
//  drawScatterCore — esqueleto de render COMPARTIDO (Etapa 2)
// =============================================================================
// Emite el SVG común a los dos scatters (N°2 Gini-vs-PIB y N°3 Elo-vs-PIB):
// clipPath + fondo, grid + ticks, líneas de eje, títulos de eje, línea de
// regresión, puntos, y la pipeline de labels (placement greedy → relajación 2D
// en formatos grandes → líneas guía → texto con halo). Antes este cuerpo estaba
// DUPLICADO casi verbatim en cada scatter.js (~180 líneas c/u) y era la fuente
// del drift.
//
// La función NO sabe de Gini ni de Elo: todo lo chart-specific (escalas, valores
// y formato de ticks, estilo de cada punto, qué países etiquetar, el path de la
// regresión, los textos de eje) lo computa el wrapper y lo pasa por `opts`. El
// wrapper sigue dueño de: dims/formato/SIZES/ptScale, datos/regresión/residuos,
// y todo lo posterior al SVG (banner, subtítulo, leyenda, editor overrides).
//
// opts:
//   svg                 elemento <svg> ya limpio, con viewBox + wrapper aplicados
//   margin {top,right,bottom,left}, plotW, plotH
//   clipId              id del clipPath (default 's-plot-clip')
//   sizes {tick, axisTitle, label}   font-sizes en unidades viewBox
//   bigFmt              true en formatos PNG grandes (gatea relax + halo grueso)
//   labelHalo           ancho del halo crema del label (px)
//   labelWeight         font-weight del label en bigFmt, o null (usa el de la clase)
//   ptScale, labelRadii {selected, base}   para calcular el radio de repulsión
//   xTicks   [{x, text}]    ya posicionados (px) y formateados
//   xTickLabelY            y (px) de las etiquetas del eje X
//   yTicks   [{y, text}]    ya posicionados (px) y formateados
//   axisTitleX {text, y}    título del eje X (x = centro del plot)
//   axisTitleY {text, y}    título del eje Y (rotado -90; x = -(centro vertical))
//   regression {d, stroke, strokeWidth, strokeOpacity, dash} | null
//   points   [{cx,cy,r,fill,fillOp,stroke,strokeW,className,dataset,handlers}]
//            handlers: {enter,leave,move,click} (cualquiera opcional)
//   labelItems, plotBox    para s_layoutLabels (cada item lleva su `fill`)
//   labelBaseClass         default 's-country-label'
//   labelSelectedClass     clase extra para l.isSelected ('s-selected-label' | 's-labeled-label')
//   tooltip                elemento del tooltip (para el click en zona vacía) | null
function drawScatterCore(opts) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ns = (tag) => document.createElementNS(SVG_NS, tag);
  const {
    svg, margin, plotW, plotH, clipId = 's-plot-clip',
    sizes, bigFmt, labelHalo, labelWeight,
    ptScale, labelRadii,
    xTicks = [], xTickLabelY, yTicks = [],
    axisTitleX, axisTitleY,
    regression, points = [],
    labelItems = [], plotBox,
    labelBaseClass = 's-country-label', labelSelectedClass = '',
    tooltip = null,
  } = opts;

  const plotLeft = margin.left, plotTop = margin.top;
  const plotRight = margin.left + plotW, plotBottom = margin.top + plotH;

  // === ClipPath para que puntos/labels no se salgan del plot ===
  const defs = ns('defs');
  const clip = ns('clipPath');
  clip.setAttribute('id', clipId);
  const clipRect = ns('rect');
  clipRect.setAttribute('x', plotLeft);
  clipRect.setAttribute('y', plotTop);
  clipRect.setAttribute('width', plotW);
  clipRect.setAttribute('height', plotH);
  clip.appendChild(clipRect);
  defs.appendChild(clip);
  svg.appendChild(defs);

  // === Background del área de plot ===
  const bg = ns('rect');
  bg.setAttribute('x', plotLeft);
  bg.setAttribute('y', plotTop);
  bg.setAttribute('width', plotW);
  bg.setAttribute('height', plotH);
  bg.setAttribute('fill', 'var(--bg)');
  svg.appendChild(bg);

  // === Grid + ticks ===
  const gridG = ns('g'); gridG.setAttribute('class', 's-grid'); svg.appendChild(gridG);
  const axisG = ns('g'); axisG.setAttribute('class', 's-axis'); svg.appendChild(axisG);

  // X: línea vertical de grid + etiqueta. Guard: descartar ticks que caigan
  // fuera del área de plot (en N°2 puede pasar en los bordes; en N°3 vienen
  // pre-filtrados al dominio, así que el guard no los toca).
  xTicks.forEach(tk => {
    if (tk.x < plotLeft - 1 || tk.x > plotRight + 1) return;
    const line = ns('line');
    line.setAttribute('x1', tk.x); line.setAttribute('x2', tk.x);
    line.setAttribute('y1', plotTop); line.setAttribute('y2', plotBottom);
    line.setAttribute('class', 's-grid-line');
    gridG.appendChild(line);
    const lbl = ns('text');
    lbl.setAttribute('x', tk.x);
    lbl.setAttribute('y', xTickLabelY);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = sizes.tick + 'px';  // INLINE: la clase .s-tick lo pisaría
    lbl.textContent = tk.text;
    axisG.appendChild(lbl);
  });

  // Y: línea horizontal de grid + etiqueta. Guard: descartar fuera de rango.
  yTicks.forEach(tk => {
    if (tk.y < plotTop - 1 || tk.y > plotBottom + 1) return;
    const line = ns('line');
    line.setAttribute('x1', plotLeft); line.setAttribute('x2', plotRight);
    line.setAttribute('y1', tk.y); line.setAttribute('y2', tk.y);
    line.setAttribute('class', 's-grid-line');
    gridG.appendChild(line);
    const lbl = ns('text');
    lbl.setAttribute('x', plotLeft - 8);
    lbl.setAttribute('y', tk.y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = sizes.tick + 'px';  // INLINE: la clase .s-tick lo pisaría
    lbl.textContent = tk.text;
    axisG.appendChild(lbl);
  });

  // === Ejes (líneas finas en y=ymax y x=xmin) ===
  const xAx = ns('line');
  xAx.setAttribute('x1', plotLeft); xAx.setAttribute('x2', plotRight);
  xAx.setAttribute('y1', plotBottom); xAx.setAttribute('y2', plotBottom);
  xAx.setAttribute('class', 's-axis-line');
  axisG.appendChild(xAx);
  const yAx = ns('line');
  yAx.setAttribute('x1', plotLeft); yAx.setAttribute('x2', plotLeft);
  yAx.setAttribute('y1', plotTop); yAx.setAttribute('y2', plotBottom);
  yAx.setAttribute('class', 's-axis-line');
  axisG.appendChild(yAx);

  // === Títulos de ejes ===
  if (axisTitleX) {
    const xT = ns('text');
    xT.setAttribute('class', 's-axis-title');
    xT.setAttribute('x', plotLeft + plotW / 2);
    xT.setAttribute('y', axisTitleX.y);
    xT.setAttribute('text-anchor', 'middle');
    xT.style.fontSize = sizes.axisTitle + 'px';  // INLINE: la clase lo pisaría
    xT.textContent = axisTitleX.text;
    svg.appendChild(xT);
  }
  if (axisTitleY) {
    const yT = ns('text');
    yT.setAttribute('class', 's-axis-title');
    yT.setAttribute('x', -(plotTop + plotH / 2));
    yT.setAttribute('y', axisTitleY.y);
    yT.setAttribute('transform', 'rotate(-90)');
    yT.setAttribute('text-anchor', 'middle');
    yT.style.fontSize = sizes.axisTitle + 'px';  // INLINE: la clase lo pisaría
    yT.textContent = axisTitleY.text;
    svg.appendChild(yT);
  }

  // === Línea de regresión ===
  if (regression && regression.d) {
    const regPath = ns('path');
    regPath.setAttribute('class', 's-regression');
    regPath.setAttribute('stroke', regression.stroke);
    regPath.setAttribute('stroke-width', regression.strokeWidth);
    regPath.setAttribute('stroke-opacity', regression.strokeOpacity);
    regPath.setAttribute('fill', 'none');
    if (regression.dash) regPath.setAttribute('stroke-dasharray', regression.dash);
    regPath.setAttribute('d', regression.d);
    regPath.setAttribute('clip-path', `url(#${clipId})`);
    svg.appendChild(regPath);
  }

  // === Puntos ===
  const ptsG = ns('g');
  ptsG.setAttribute('clip-path', `url(#${clipId})`);
  svg.appendChild(ptsG);
  points.forEach(p => {
    const c = ns('circle');
    c.setAttribute('class', p.className);
    c.setAttribute('cx', p.cx);
    c.setAttribute('cy', p.cy);
    c.setAttribute('r', p.r);
    c.setAttribute('fill', p.fill);
    c.setAttribute('fill-opacity', p.fillOp);
    c.setAttribute('stroke', p.stroke);
    c.setAttribute('stroke-width', p.strokeW);
    if (p.dataset) for (const k in p.dataset) c.dataset[k] = p.dataset[k];
    const h = p.handlers || {};
    if (h.enter) c.addEventListener('mouseenter', h.enter);
    if (h.leave) c.addEventListener('mouseleave', h.leave);
    if (h.move)  c.addEventListener('mousemove', h.move);
    if (h.click) c.addEventListener('click', h.click);
    ptsG.appendChild(c);
  });

  // === Labels: placement greedy → (bigFmt) relajación 2D → líneas guía → texto ===
  const placed = s_layoutLabels(labelItems, plotBox);
  const ptR = (l) => (l.isSelected ? labelRadii.selected : labelRadii.base) * ptScale;
  if (bigFmt) {
    const obstacles = placed.map(l => ({ x: l.cx, y: l.cy, r: ptR(l) }));
    s_relaxLabels(placed, sizes.label, plotBox, 260, obstacles);
  }

  // Líneas guía (estilo OWID): reconectan cada label corrido con su punto.
  // Se appendean ANTES de los labels para quedar por debajo del halo.
  if (bigFmt) {
    const leaderG = ns('g'); svg.appendChild(leaderG);
    placed.forEach(l => {
      const B = s_labelBox(l, sizes.label);
      const Px = l.cx, Py = l.cy, r = ptR(l);
      const nx = Math.max(B.x1, Math.min(Px, B.x2));
      const ny = Math.max(B.y1, Math.min(Py, B.y2));
      const dx = nx - Px, dy = ny - Py;
      const dist = Math.hypot(dx, dy);
      if (dist > r + 7) {
        const ux = dx / dist, uy = dy / dist;
        const line = ns('line');
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

  const labelsG = ns('g'); svg.appendChild(labelsG);
  placed.forEach(l => {
    const txt = ns('text');
    txt.setAttribute('class', labelBaseClass + (l.isSelected && labelSelectedClass ? ' ' + labelSelectedClass : ''));
    txt.setAttribute('x', l.lx);
    txt.setAttribute('y', l.ly);
    txt.setAttribute('text-anchor', l.anchor);
    txt.setAttribute('fill', l.fill || '#444');
    txt.style.fontSize = sizes.label + 'px';  // INLINE: la clase lo pisaría
    txt.style.stroke = 'var(--bg)';            // halo crema
    txt.style.strokeWidth = labelHalo + 'px';
    txt.style.paintOrder = 'stroke';
    txt.style.strokeLinejoin = 'round';
    if (labelWeight) txt.style.fontWeight = labelWeight;
    txt.textContent = l.text;
    labelsG.appendChild(txt);
  });

  // === Click en zona vacía del SVG limpia tooltip (no limpia selección) ===
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle' && tooltip) tooltip.style.opacity = '0';
  };

  return { placed };
}
