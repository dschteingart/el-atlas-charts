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
