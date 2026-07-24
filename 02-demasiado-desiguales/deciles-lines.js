// =============================================================
//  deciles-lines.js — motor de líneas del deciles (N°2, chart 3)
// =============================================================
// FORK de 03b-partidos/ts-partidos.js (tsDraw), adaptado al deciles. NO toca
// el motor compartido (ts-partidos lo usan 4 charts del especial). Namespace
// dl_*. Diferencias con el motor base:
//   1. Eje Y LOG o lineal (el motor base es solo lineal).
//   2. Eje X CATEGÓRICO "D1..D10" con aclaración pobre/rico en los extremos
//      (el motor base son años).
//   3. Tooltip POR-MARKER (región/decil/ingreso/percentil/año-obs) con
//      hit-area táctil, NO el crosshair del motor base.
//
// La GANANCIA sobre el deciles.js viejo (motor mal construido, margen fijo):
// MARGEN DERECHO DINÁMICO auto-medido — mide el ancho real de la end-label
// más ancha, lo tope al 40% del ancho, y si aún no entra achica SOLO las
// end-labels (endLabelScale) para que "Argentina"/"Noruega" nunca se corten.
// Más font-size y stroke-width inline que escalan con el formato. Eso resuelve
// de raíz el layout que hacía dar vueltas (ejes pisados, PNG chico).
//
// API: dl_draw(cfg) — ver el objeto cfg documentado abajo. Todo lo específico
// del deciles (datos, tooltip, quitar-país) entra por cfg/callbacks; el motor
// no sabe de "país" ni "región". Reusa del entorno: getActivePngFormat,
// PNG_FORMATS, applyFormatWrapper, isMobileViewport, HAS_HOVER.

const DL_NS = 'http://www.w3.org/2000/svg';
const dl_el = (t) => document.createElementNS(DL_NS, t);
const DL_BG = '#FAF8F3';

// Canvas reusable para medir anchos de texto (mismo estilo que el CSS).
function dl_measure(text, size, weight) {
  if (!dl_measure._c) dl_measure._c = document.createElement('canvas').getContext('2d');
  dl_measure._c.font = `${weight || 600} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return dl_measure._c.measureText(text).width;
}

// Márgenes base por formato. El .right se RECALCULA dinámico más abajo (esto
// es solo el piso). left grande = ticks Y escalados ("$1k","$10k","$100k");
// bottom = eje X "D1..D10" + 2ª línea (pobre/rico) sin espacio muerto.
function dl_margins(format, mobile) {
  // left generoso: los ticks Y escalados ("$500") + el título del eje rotado +
  // un aire entre ambos (si no, el título pisa el "$" de los ticks).
  if (format === 'public')     return { top: 40, right: 180, bottom: 100, left: 90 };
  if (format === 'newsletter') return { top: 40, right: 190, bottom: 130, left: 96 };
  if (format === 'square')     return { top: 50, right: 190, bottom: 140, left: 96 };
  if (format === 'mobile')     return { top: 80, right: 180, bottom: 220, left: 110 };
  if (mobile)                  return { top: 110, right: 200, bottom: 150, left: 120 };
  return { top: 24, right: 180, bottom: 56, left: 82 };
}

// Anti-colisión de end-labels: forward sweep (empuja hacia abajo si choca) +
// backward sweep (si el grupo se pasó del piso, sube al grupo). Portado del
// deciles.js viejo — SUPERIOR al forward-only del motor base. plotBottom/Top
// acotan; devuelve labels con .y y .shifted.
function dl_placeEndLabels(labels, gap, plotTop, plotBottom) {
  labels.sort((a, b) => a.idealY - b.idealY);
  labels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, labels[i - 1].y + gap);
  });
  if (labels.length && labels[labels.length - 1].y > plotBottom) {
    let overflow = labels[labels.length - 1].y - plotBottom;
    for (let i = labels.length - 1; i >= 0 && overflow > 0; i--) {
      const target = labels[i].y - overflow;
      if (i === 0 || target > labels[i - 1].y + gap) { labels[i].y = target; overflow = 0; }
      else { const minY = labels[i - 1].y + gap; overflow -= (labels[i].y - minY); labels[i].y = minY; }
    }
  }
  labels.forEach(l => {
    l.y = Math.max(plotTop, Math.min(l.y, plotBottom));
    l.shifted = Math.abs(l.y - l.idealY) > 1;
  });
  return labels;
}

function dl_draw(cfg) {
  const svg = document.getElementById(cfg.svgId);
  if (!svg) return;
  svg.innerHTML = '';

  // ---- formato / viewport ----
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square', newsletter = editorFormat === 'newsletter', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W, H, M;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH; M = dl_margins(editorFormat, false);
  } else if (mobile) { W = 1100; H = 1500; M = dl_margins(null, true); }
  else { W = 1100; H = 470; M = dl_margins(null, false); }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = square || newsletter || mobilePng || mobile;
  const isPngFormat = square || newsletter || mobilePng;
  const SIZES = cfg.sizes;                              // {tick, tickExtra, axisTitle, endLabel} (los arma el wrapper: editor/format)
  const lineW = bigFmt ? 3.4 : 2.2;
  const haloExtra = bigFmt ? 5 : 3;
  const labelHalo = bigFmt ? 6 : 3;
  const markerR = mobile ? 8 : bigFmt ? 5 : 3.5;
  const hitR = mobile ? 30 : 0;                         // zona táctil (≈9px a 360px); solo mobile interactivo

  // ---- margen derecho DINÁMICO según la end-label más ancha ----
  let maxLabelW = 0;
  cfg.series.forEach(s => { const w = dl_measure(s.label, SIZES.endLabel, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
  const _rGap = (bigFmt ? 16 : 10) + labelHalo;
  const _rCap = Math.round(W * 0.40);
  M.right = Math.min(_rCap, Math.max(bigFmt ? 90 : 44, Math.ceil(maxLabelW + _rGap)));
  const _rBudget = M.right - _rGap;
  const endLabelScale = (maxLabelW > _rBudget && maxLabelW > 0) ? Math.max(0.6, _rBudget / maxLabelW) : 1;

  const PLOT_W = W - M.left - M.right;
  const PLOT_H = H - M.top - M.bottom;
  const plotTop = M.top, plotBottom = M.top + PLOT_H;

  // ---- escalas ----
  const deciles = cfg.deciles;
  const xS = (d) => M.left + ((d - 1) / (deciles.length - 1)) * PLOT_W;
  const yd = cfg.yDomain, logY = cfg.yScaleMode === 'log';
  const yS = logY
    ? (v) => { const lo = Math.log10(yd.min), hi = Math.log10(yd.max); const lv = Math.log10(Math.max(v, yd.min)); return M.top + PLOT_H - ((lv - lo) / (hi - lo)) * PLOT_H; }
    : (v) => { const cv = Math.min(Math.max(v, yd.min), yd.max); return M.top + PLOT_H - ((cv - yd.min) / (yd.max - yd.min)) * PLOT_H; };

  // ---- grid + ticks Y ----
  cfg.yTicks.forEach(tv => {
    const y = yS(tv);
    const gl = dl_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.setAttribute('class', tv === yd.min ? 'd-axis-line' : 'd-grid-line'); svg.appendChild(gl);
    const lbl = dl_el('text'); lbl.setAttribute('x', M.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 'd-tick'); lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = cfg.yFmt(tv); svg.appendChild(lbl);
  });

  // ---- título eje Y ----
  if (cfg.axisY) {
    const off = Math.min(bigFmt ? 80 : 54, M.left - Math.ceil(SIZES.axisTitle));
    const yT = dl_el('text'); yT.setAttribute('class', 'd-axis-title'); yT.setAttribute('text-anchor', 'middle');
    yT.setAttribute('transform', `translate(${M.left - off}, ${M.top + PLOT_H / 2}) rotate(-90)`);
    yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = cfg.axisY; svg.appendChild(yT);
  }

  // ---- eje X: "D1..D10" (o "Decil N" si el tick es chico) + extremos + guías ----
  const xLabelOffset = mobile ? 50 : mobilePng ? 42 : bigFmt ? 34 : 22;
  const xExtraOffset = mobile ? 88 : mobilePng ? 84 : bigFmt ? 72 : 42;
  const usaAbrev = SIZES.tick >= 16;                    // con fuentes grandes "Decil N" no entra → "DN"
  deciles.forEach(d => {
    const x = xS(d);
    const guide = dl_el('line'); guide.setAttribute('x1', x); guide.setAttribute('x2', x);
    guide.setAttribute('y1', M.top); guide.setAttribute('y2', M.top + PLOT_H); guide.setAttribute('class', 'd-vguide'); svg.appendChild(guide);
    const txt = dl_el('text'); txt.setAttribute('x', x); txt.setAttribute('y', M.top + PLOT_H + xLabelOffset);
    txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('class', 'd-tick'); txt.style.fontSize = SIZES.tick + 'px';
    txt.textContent = (usaAbrev ? 'D' : cfg.decilePrefix + ' ') + d; svg.appendChild(txt);
    if (d === deciles[0] || d === deciles[deciles.length - 1]) {
      const extra = dl_el('text'); extra.setAttribute('x', x); extra.setAttribute('y', M.top + PLOT_H + xExtraOffset);
      extra.setAttribute('text-anchor', 'middle'); extra.setAttribute('class', 'd-tick-extra'); extra.style.fontSize = SIZES.tickExtra + 'px';
      extra.textContent = d === deciles[0] ? cfg.poorestLabel : cfg.richestLabel; svg.appendChild(extra);
    }
  });
  // título eje X opcional (solo si el editor definió uno custom)
  if (cfg.axisX) {
    const xT = dl_el('text'); xT.setAttribute('class', 'd-axis-title'); xT.setAttribute('text-anchor', 'middle');
    xT.setAttribute('x', M.left + PLOT_W / 2); xT.setAttribute('y', M.top + PLOT_H + xExtraOffset + 26);
    xT.style.fontSize = SIZES.axisTitle + 'px'; xT.textContent = cfg.axisX; svg.appendChild(xT);
  }

  // ---- líneas (halo + color) + markers interactivos ----
  const halosG = dl_el('g'); svg.appendChild(halosG);
  const linesG = dl_el('g'); svg.appendChild(linesG);
  const tooltip = document.getElementById(cfg.tooltipId);
  const endLabels = [];

  cfg.series.forEach(s => {
    const pts = s.pts.filter(p => p[1] != null);
    if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join('');
    const halo = dl_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', DL_BG); halo.setAttribute('stroke-width', lineW + haloExtra);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halosG.appendChild(halo);
    const path = dl_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('data-code', s.key); linesG.appendChild(path);

    // markers por decil (con tooltip y quitar-país vía callbacks del wrapper)
    (s.markers || []).forEach(m => {
      const c = dl_el('circle'); c.setAttribute('cx', xS(m.decile)); c.setAttribute('cy', yS(m.value));
      c.setAttribute('r', markerR); c.setAttribute('fill', s.color); c.setAttribute('class', 'd-marker'); c.setAttribute('data-code', s.key);
      if (isPngFormat) { linesG.appendChild(c); return; }
      if (HAS_HOVER) {
        c.style.cursor = 'pointer';
        c.addEventListener('mouseenter', (e) => cfg.onMarkerShow(e, s, m));
        c.addEventListener('mousemove', (e) => cfg.onMarkerMove(e));
        c.addEventListener('mouseleave', () => cfg.onMarkerHide());
        c.addEventListener('click', () => { cfg.onMarkerHide(); cfg.onMarkerClick(s); });   // desktop: quitar país
        linesG.appendChild(c);
      } else {
        linesG.appendChild(c);
        const hit = dl_el('circle'); hit.setAttribute('cx', xS(m.decile)); hit.setAttribute('cy', yS(m.value));
        hit.setAttribute('r', hitR); hit.setAttribute('fill', 'transparent'); hit.setAttribute('class', 'd-marker-hit'); hit.style.cursor = 'pointer';
        hit.addEventListener('click', (e) => { e.stopPropagation(); cfg.onMarkerShow(e, s, m); });   // tap: solo tooltip
        linesG.appendChild(hit);
      }
    });

    const last = pts[pts.length - 1];
    endLabels.push({ key: s.key, color: s.color, text: s.label, idealY: yS(last[1]), lineEndX: xS(last[0]) });
  });

  // ---- end-labels anti-colisión (backward-sweep) ----
  const gap = bigFmt ? Math.round(SIZES.endLabel * 1.35) : 13;
  dl_placeEndLabels(endLabels, gap, plotTop + 2, plotBottom);
  const endG = dl_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const g = dl_el('line'); g.setAttribute('x1', l.lineEndX); g.setAttribute('y1', l.idealY);
      g.setAttribute('x2', l.lineEndX + (bigFmt ? 8 : 6)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.55); endG.appendChild(g);
    }
    const txt = dl_el('text'); txt.setAttribute('x', l.lineEndX + (bigFmt ? 12 : 9)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4));
    txt.setAttribute('class', 'd-end-label'); txt.setAttribute('fill', l.color);
    // font-size Y font-weight inline: la clase .d-end-label los fija (11.5px/600)
    // y en SVG la clase le gana al atributo (Trampa #1) → inline para que escalen.
    txt.style.fontSize = (SIZES.endLabel * endLabelScale) + 'px';
    txt.style.fontWeight = bigFmt ? 700 : 600;
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', DL_BG); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    txt.textContent = l.text; endG.appendChild(txt);
  });
}
