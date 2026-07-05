// =============================================================
//  Especial "La geografía de los partidos" — motor de series temporales
// =============================================================
// Renderer compartido por los charts 1 (actividad), 2 (amistosos, apilado),
// 3 (globalización) y 7 (neutral). Sigue el patrón de la casa (natividad.js):
// SIZES mobile-first, halos, etiquetas de fin anti-colisión, crosshair con
// tooltip (mouse + tap), formatos PNG vía getActivePngFormat/PNG_FORMATS.
//
// API: tsDraw(n, cfg) donde cfg =
//   { svgId, tooltipId,
//     mode: 'lines' | 'stack',
//     xMin, xMax,                     // rango de años visibles
//     yMax: number | 'auto',          // tope del eje Y ('auto' = nice)
//     yFmt: (v) => string,            // etiqueta de tick Y
//     axisY: string,                  // título del eje Y (ya traducido)
//     series: [{ key, label, color, pts: [[año, valor]...],
//                width?, dash?, markers?, ref? }],          (mode lines)
//     stack: { anios: [...], cats: [{key,label,color}], val: (catKey, i) => v,
//              total: (i) => v },                            (mode stack)
//     ttRows: (año) => [{label, color, v, fmt}] }            (tooltip)

const TS_NS = 'http://www.w3.org/2000/svg';
const ts_el = (t) => document.createElementNS(TS_NS, t);
const TS_BG = '#FAF8F3';

const TS_MARGIN_DESKTOP = { top: 26, right: 150, bottom: 46, left: 64 };
const TS_MARGIN_MOBILE  = { top: 56, right: 168, bottom: 130, left: 96 };
function ts_margins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 176, bottom: 88,  left: 84 };
    case 'newsletter': return { top: 44, right: 190, bottom: 92,  left: 112 };
    case 'square':     return { top: 44, right: 190, bottom: 72,  left: 112 };
    case 'mobile':     return { top: 60, right: 180, bottom: 146, left: 116 };
    default:           return { ...TS_MARGIN_DESKTOP };
  }
}

function ts_measure(text, size, weight) {
  if (!ts_measure._c) ts_measure._c = document.createElement('canvas').getContext('2d');
  ts_measure._c.font = `${weight || 600} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return ts_measure._c.measureText(text).width;
}

// Énfasis al hover sobre una línea: la engrosa y atenúa el resto (patrón N°3).
function ts_emph(svg, key) {
  svg.querySelectorAll('[data-ts]').forEach(el => {
    const me = el.getAttribute('data-ts');
    if (key == null) {
      el.style.opacity = '';
      if (el.classList.contains('ts-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w'));
    } else if (me === key) {
      el.style.opacity = '1';
      if (el.classList.contains('ts-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1));
    } else {
      el.style.opacity = '0.14';
    }
  });
}

// Resaltado de una BANDA del apilado (hover sobre el área o su etiqueta): la
// banda apuntada queda opaca y el resto se atenúa. Las etiquetas también.
function ts_bandEmph(svg, key) {
  svg.querySelectorAll('[data-band]').forEach(el => {
    if (key == null) el.setAttribute('fill-opacity', el.getAttribute('data-band-op'));
    else el.setAttribute('fill-opacity', el.getAttribute('data-band') === key ? 1 : 0.22);
  });
  svg.querySelectorAll('[data-band-label]').forEach(el => {
    el.style.opacity = (key == null || el.getAttribute('data-band-label') === key) ? '' : '0.25';
  });
}

// Parte una etiqueta larga en dos renglones (por el espacio más cercano al
// medio), para que no coma ancho del gráfico. Cortas quedan en un renglón.
function ts_wrapLabel(text) {
  if (text.length <= 13 || text.indexOf(' ') < 0) return [text];
  const mid = text.length / 2;
  let best = -1, bestDist = Infinity;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') { const d = Math.abs(i - mid); if (d < bestDist) { bestDist = d; best = i; } }
  }
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

// Ticks de años "lindos" (décadas / múltiplos) con separación mínima en px.
function ts_xTicks(x0, x1, plotW, minGapPx) {
  const span = x1 - x0;
  const steps = [4, 5, 10, 20, 25, 50];
  let step = steps.find(s => (span / s) * minGapPx <= plotW) || 50;
  const out = [];
  for (let y = Math.ceil(x0 / step) * step; y <= x1; y += step) out.push(y);
  if (!out.length) out.push(x0, x1);
  return out;
}

function tsDraw(n, cfg) {
  const svg = document.getElementById(cfg.svgId);
  if (!svg) return;
  svg.innerHTML = '';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square', newsletter = editorFormat === 'newsletter',
        mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = 1100, H = 520, M;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = square ? 910 : newsletter ? 860 : f.vbH;
    M = ts_margins(editorFormat);
  } else if (mobile) { W = 1100; H = 1000; M = { ...TS_MARGIN_MOBILE }; }
  else { W = 1100; H = 520; M = { ...TS_MARGIN_DESKTOP }; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = square || newsletter || mobilePng || mobile;
  const isPngFormat = square || newsletter || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;

  // margen derecho dinámico según etiquetas de fin. En el apilado las etiquetas
  // largas van en DOS renglones, así el gráfico queda más ancho y la etiqueta
  // se pega al borde derecho.
  const isStack = cfg.mode === 'stack';
  const labels = isStack ? cfg.stack.cats.map(c => c.label) : cfg.series.map(s => s.label);
  let maxLabelW = 0;
  labels.forEach(nm => {
    const lines = isStack ? ts_wrapLabel(nm) : [nm];
    lines.forEach(ln => {
      const extra = (!isStack && isPngFormat) ? '  0000' : '';
      const w = ts_measure(ln + extra, SIZES.label, bigFmt ? 700 : 600);
      if (w > maxLabelW) maxLabelW = w;
    });
  });
  M.right = Math.min(Math.round(W * 0.34),
    Math.max(bigFmt ? 84 : 40, maxLabelW + (bigFmt ? 18 : 12)));
  let PLOT_W = W - M.left - M.right;
  const PLOT_H = H - M.top - M.bottom;

  const x0 = cfg.xMin, x1 = cfg.xMax;
  const xS = (yr) => M.left + ((yr - x0) / (x1 - x0)) * PLOT_W;

  // tope Y
  let yMax = cfg.yMax;
  if (yMax === 'auto') {
    let mx = 0;
    if (cfg.mode === 'stack') {
      cfg.stack.anios.forEach((a, i) => { if (a >= x0 && a <= x1) { const v = cfg.stack.total(i); if (v > mx) mx = v; } });
    } else {
      cfg.series.forEach(s => s.pts.forEach(p => { if (p[0] >= x0 && p[0] <= x1 && p[1] != null && p[1] > mx) mx = p[1]; }));
    }
    const ticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, mx * 1.06, 5) : [mx];
    yMax = ticks.length ? ticks[ticks.length - 1] : mx;
    if (yMax < mx) yMax += (ticks.length > 1 ? ticks[1] - ticks[0] : mx * 0.1);
    if (!(yMax > 0)) yMax = cfg.yMaxFloor || 10;   // serie toda en 0: piso para no dividir por cero
  }
  const yS = (v) => M.top + PLOT_H - (v / yMax) * PLOT_H;

  // grid + ejes
  ts_xTicks(x0, x1, PLOT_W, bigFmt ? 100 : 44).forEach(yr => {
    const x = xS(yr);
    const gl = ts_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', M.top); gl.setAttribute('y2', M.top + PLOT_H);
    gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = ts_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', M.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  const yTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, yMax, bigFmt ? 4 : 5) : [0, yMax];
  if (yTicks[0] !== 0) yTicks.unshift(0);
  yTicks.forEach(v => {
    if (v > yMax + 1e-9) return;
    const y = yS(v);
    const gl = ts_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = ts_el('text'); lbl.setAttribute('x', M.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = cfg.yFmt ? cfg.yFmt(v) : v; svg.appendChild(lbl);
  });
  if (cfg.axisY) {
    const yT = ts_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
    yT.setAttribute('transform', `translate(${M.left - (bigFmt ? 80 : 44)}, ${M.top + PLOT_H / 2}) rotate(-90)`);
    yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = cfg.axisY; svg.appendChild(yT);
  }

  const endLabels = [];

  if (cfg.mode === 'stack') {
    // ---- áreas apiladas (chart 2) ----
    const anios = cfg.stack.anios;
    const inRange = anios.map((a, i) => ({ a, i })).filter(o => o.a >= x0 && o.a <= x1);
    let base = inRange.map(() => 0);
    cfg.stack.cats.forEach(cat => {
      const tops = inRange.map((o, k) => base[k] + cfg.stack.val(cat.key, o.i));
      let d = '';
      inRange.forEach((o, k) => { d += (k ? 'L' : 'M') + xS(o.a).toFixed(1) + ',' + yS(tops[k]).toFixed(1); });
      for (let k = inRange.length - 1; k >= 0; k--) d += 'L' + xS(inRange[k].a).toFixed(1) + ',' + yS(base[k]).toFixed(1);
      d += 'Z';
      const path = ts_el('path'); path.setAttribute('d', d); path.setAttribute('fill', cat.color);
      path.setAttribute('fill-opacity', 0.92); path.setAttribute('stroke', TS_BG); path.setAttribute('stroke-width', bigFmt ? 1.6 : 1);
      path.setAttribute('data-band', cat.key); path.setAttribute('data-band-op', 0.92);
      if (!isPngFormat) {
        path.style.cursor = 'default';
        path.addEventListener('mouseenter', () => ts_bandEmph(svg, cat.key));
        path.addEventListener('mouseleave', () => ts_bandEmph(svg, null));
      }
      svg.appendChild(path);
      const lastK = inRange.length - 1;
      const midY = yS((base[lastK] + tops[lastK]) / 2);
      const bandPx = Math.abs(yS(base[lastK]) - yS(tops[lastK]));
      endLabels.push({ band: cat.key, color: cat.color, text: cat.label, x: xS(inRange[lastK].a), idealY: midY,
                       small: bandPx < (bigFmt ? SIZES.label + 4 : 12) });
      base = tops;
    });
  } else {
    // ---- líneas (charts 1, 3, 7) ----
    const halosG = ts_el('g'); svg.appendChild(halosG);
    const linesG = ts_el('g'); svg.appendChild(linesG);
    const hitG = ts_el('g'); svg.appendChild(hitG);
    cfg.series.forEach((s, si) => {
      const pts = s.pts.filter(p => p[0] >= x0 && p[0] <= x1 && p[1] != null);
      if (!pts.length) return;
      const key = s.key != null ? String(s.key) : 'serie-' + si;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join('');
      const w = (s.width || 1) * lineW;
      const halo = ts_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', TS_BG); halo.setAttribute('stroke-width', w + (bigFmt ? 5 : 3));
      halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
      halo.setAttribute('data-ts', key); halosG.appendChild(halo);
      const path = ts_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
      path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', s.ref ? w * 0.7 : w);
      path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
      if (s.dash) path.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
      path.setAttribute('data-ts', key); path.setAttribute('data-base-w', s.ref ? w * 0.7 : w);
      path.classList.add('ts-colored');
      linesG.appendChild(path);
      if (s.markers) pts.forEach(p => {
        const c = ts_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1]));
        c.setAttribute('r', bigFmt ? 4.5 : 2.6); c.setAttribute('fill', s.color);
        c.setAttribute('stroke', TS_BG); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
        c.setAttribute('data-ts', key); linesG.appendChild(c);
      });
      // hit-area para hover por línea (aísla la serie, como en el N°3)
      if (!isPngFormat) {
        const hit = ts_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
        hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(w + 8, 10));
        hit.addEventListener('mouseenter', () => ts_emph(svg, key));
        hit.addEventListener('mouseleave', () => ts_emph(svg, null));
        hitG.appendChild(hit);
      }
      const last = pts[pts.length - 1];
      endLabels.push({ key, color: s.color, text: s.label, x: xS(last[0]), idealY: yS(last[1]),
                       ref: s.ref, valLast: last[1] });
    });
  }

  // ---- etiquetas de fin, anti-colisión vertical ----
  // (en el apilado las etiquetas pueden ir en 2 renglones, así que dejan más aire)
  const GAP = isStack ? (bigFmt ? Math.round(SIZES.label * 1.7) : 20) : (bigFmt ? SIZES.label + 6 : 13);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + GAP);
    l.y = Math.min(l.y, M.top + PLOT_H + (bigFmt ? 0 : 2));
    l.y = Math.max(l.y, M.top + (bigFmt ? 6 : 2));
    l.shifted = Math.abs(l.y - l.idealY) > 1.5;
  });
  const endG = ts_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted || l.small) {
      const g = ts_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY);
      g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8);
      g.setAttribute('stroke-opacity', 0.6); endG.appendChild(g);
    }
    const lx = l.x + (bigFmt ? 12 : 6);
    const txt = ts_el('text'); txt.setAttribute('x', lx);
    txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = (l.ref ? SIZES.label * 0.85 : SIZES.label) + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', TS_BG);
    txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    if (l.key) txt.setAttribute('data-ts', l.key);
    // etiqueta de una banda apilada: hover sobre ella resalta esa banda
    if (l.band) {
      txt.setAttribute('data-band-label', l.band);
      if (!isPngFormat) {
        txt.style.cursor = 'default';
        txt.addEventListener('mouseenter', () => ts_bandEmph(svg, l.band));
        txt.addEventListener('mouseleave', () => ts_bandEmph(svg, null));
      }
    }
    const valTxt = (isPngFormat && l.valLast != null && !l.ref)
      ? '  ' + (cfg.endValFmt ? cfg.endValFmt(l.valLast) : Math.round(l.valLast)) : '';
    // apilado: etiqueta larga en 2 renglones (centrada en l.y). Otros: 1 renglón.
    const lines = l.band ? ts_wrapLabel(l.text) : [l.text + valTxt];
    // interlineado con aire: si va muy justo, los halos crema de los dos
    // renglones se superponen y el texto se ve grueso/embarrado.
    const lineH = (l.ref ? SIZES.label * 0.85 : SIZES.label) * 1.2;
    const yBase = l.y + (bigFmt ? 8 : 4) - (lines.length - 1) * lineH / 2;
    lines.forEach((ln, k) => {
      const ts = ts_el('tspan'); ts.setAttribute('x', lx); ts.setAttribute('y', yBase + k * lineH);
      ts.textContent = ln; txt.appendChild(ts);
    });
    endG.appendChild(txt);
  });

  // ---- hover: línea vertical + tooltip (mouse y tap) ----
  if (!isPngFormat && cfg.ttRows) {
    const tooltip = document.getElementById(cfg.tooltipId);
    const hoverG = ts_el('g'); hoverG.setAttribute('display', 'none');
    // la vline y los puntitos NO deben capturar el mouse: si no, al pasar por
    // encima de una banda le disparan mouseleave/mouseenter y el resaltado titila
    hoverG.setAttribute('pointer-events', 'none');
    svg.appendChild(hoverG);
    const vline = ts_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
    vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', M.top); vline.setAttribute('y2', M.top + PLOT_H);
    hoverG.appendChild(vline);
    const cap = ts_el('rect'); cap.setAttribute('x', M.left); cap.setAttribute('y', M.top);
    cap.setAttribute('width', PLOT_W); cap.setAttribute('height', PLOT_H);
    cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
    function update(year, ev) {
      if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
      const rows = cfg.ttRows(year);
      if (!rows || !rows.length) { update(null); return; }
      hoverG.setAttribute('display', '');
      while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);   // limpiar puntitos viejos (mantiene la vline)
      const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
      // en líneas, un puntito sobre cada serie en el año (el apilado usa
      // resaltado de banda, no puntitos)
      if (cfg.mode !== 'stack') {
        cfg.series.forEach(s => {
          if (s.ref) return;
          const p = s.pts.find(q => q[0] === year);
          if (p && p[1] != null && isFinite(yS(p[1]))) {
            const c = ts_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1]));
            c.setAttribute('r', 3.6); c.setAttribute('fill', s.color);
            c.setAttribute('stroke', TS_BG); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
          }
        });
      }
      if (tooltip) {
        let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
        rows.forEach(r => {
          // filas sin color (r.color null) van sin puntito, con sangría suave
          const dot = r.color
            ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span>`
            : `<span style="display:inline-block;width:8px;"></span>`;
          html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;">`
            + dot
            + `<span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v}</strong></div>`;
        });
        tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
        const rc = svg.getBoundingClientRect();
        const _x = evClientX(ev) - rc.left, _w = tooltip.offsetWidth || 180;
        tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
        tooltip.style.top = (evClientY(ev) - rc.top + 14) + 'px';
      }
    }
    const moveH = (ev) => {
      const rc = svg.getBoundingClientRect(); const sc = rc.width / W;
      const lx = (evClientX(ev) - rc.left) / sc;
      if (!isFinite(lx) || lx < M.left || lx > W - M.right) { update(null); return; }
      const yr = Math.round(x0 + ((lx - M.left) / PLOT_W) * (x1 - x0));
      update(Math.max(x0, Math.min(x1, yr)), ev);
    };
    const leaveH = () => update(null);
    // un solo listener vivo por SVG: si un redibujo anterior dejó los suyos,
    // se remueven (si no, se apilan y pelean por el tooltip)
    if (svg.__tsMove) {
      svg.removeEventListener('mousemove', svg.__tsMove);
      svg.removeEventListener('mouseleave', svg.__tsLeave);
      if (svg.__atlasTouchScrub) {
        svg.removeEventListener('touchstart', svg.__atlasTouchScrub);
        svg.removeEventListener('touchmove', svg.__atlasTouchScrub);
        svg.__atlasTouchScrub = null;
      }
    }
    svg.__tsMove = moveH; svg.__tsLeave = leaveH;
    svg.addEventListener('mousemove', moveH);
    svg.addEventListener('mouseleave', leaveH);
    if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, moveH);
  }
}
