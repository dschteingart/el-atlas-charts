// =============================================================
//  Especial partidos — Chart 8: quién gana los duelos entre confederaciones
// =============================================================
// Rendimiento de cada confederación en partidos ENTRE confederaciones distintas
// (solo cruces). Dos vistas:
//   Tabla de posiciones (barras apiladas Ganó/Empató/Perdió por confederación,
//     ordenadas por efectividad; efectividad en puntos + diferencia de gol).
//   Evolución (líneas en el tiempo; métrica: efectividad % con promedio móvil,
//     o diferencia de gol acumulada, con renderer propio que admite negativos).
// Controles: competencia, período, métrica + suavizado. Efectividad = puntos
// obtenidos sobre posibles con la regla actual (3 por victoria, 1 por empate, 0
// por derrota) aplicada a toda la serie.
// Datos: DATA_VERSUS.porConf[cf] = filas [anio-y0, cat_idx, jugados, G, E, P, dif_gol].

const VS_N = 8;
const VS_NS = 'http://www.w3.org/2000/svg';
const VS_WIN = '#5E9152', VS_DRAW = '#CBC3B4', VS_LOSS = '#A0442E';   // ganó / empató / perdió
const VS_BG = '#FAF8F3';
const VS_LINE_FLOOR = 6;   // mínimo de partidos en la ventana móvil para dibujar un punto de efectividad
function vs_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }
function vs_el(tag) { return document.createElementNS(VS_NS, tag); }
function vs_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function vs_nf(v) { return Math.round(v).toLocaleString(vs_lang() === 'en' ? 'en-US' : 'es-AR'); }
function vs_confLabel(cf) { return vs_t('c6-conf-' + cf, cf); }
let vs_touched = false;

function vs_state() {
  if (!window.state) window.state = {};
  if (!state[VS_N]) state[VS_N] = {};
  const s = state[VS_N];
  if (!s.view) s.view = 'rank';
  if (s.cat == null) s.cat = 'ALL';
  if (!s.metric) s.metric = 'eff';
  if (!s.maYears) s.maYears = 8;
  if (!s.period) s.period = [DATA_VERSUS.y0, DATA_VERSUS.y1];
  if (s.periodAuto == null) s.periodAuto = true;
  return s;
}

// ---- cálculo ----------------------------------------------------------------
// agregado de una confederación en el período+competencia elegidos
function vs_agg(cf, a, b, cat) {
  let m = 0, w = 0, d = 0, l = 0, gd = 0;
  const rows = DATA_VERSUS.porConf[cf] || [];
  for (const r of rows) {
    const y = r[0] + DATA_VERSUS.y0;
    if (y < a || y > b) continue;
    if (cat !== 'ALL' && r[1] !== cat) continue;
    m += r[2]; w += r[3]; d += r[4]; l += r[5]; gd += r[6];
  }
  return { cf, m, w, d, l, gd, eff: m ? (3 * w + d) / (3 * m) * 100 : 0 };
}
// efectividad global (todas las confederaciones juntas) en el período+competencia
function vs_pooledEff(a, b, cat) {
  let num = 0, den = 0;
  DATA_VERSUS.confOrder.forEach(cf => { const o = vs_agg(cf, a, b, cat); num += 3 * o.w + o.d; den += 3 * o.m; });
  return den ? num / den * 100 : 0;
}
// agregado de un enfrentamiento fila-vs-columna (matriz). Usa el par canónico
// (A antes que B en confOrder) y espeja si la fila es el segundo del par.
function vs_pairAgg(rowCf, colCf, a, b, cat) {
  if (rowCf === colCf) return null;
  const ord = DATA_VERSUS.confOrder, i = ord.indexOf(rowCf), j = ord.indexOf(colCf);
  const canon = i < j, key = canon ? rowCf + '|' + colCf : colCf + '|' + rowCf;
  const rows = (DATA_VERSUS.pairs && DATA_VERSUS.pairs[key]) || [];
  let m = 0, w = 0, d = 0, l = 0, gd = 0;
  for (const r of rows) {
    const y = r[0] + DATA_VERSUS.y0;
    if (y < a || y > b) continue;
    if (cat !== 'ALL' && r[1] !== cat) continue;
    m += r[2]; w += r[3]; d += r[4]; l += r[5]; gd += r[6];
  }
  if (!canon) { const tmp = w; w = l; l = tmp; gd = -gd; }   // fila = B del par → espejar
  return { m, w, d, l, gd, eff: m ? (3 * w + d) / (3 * m) * 100 : 0 };
}
// color divergente por efectividad: 50% neutro, verde arriba (gana más), rojo
// abajo (pierde más). Dominio útil ~[25,75].
function vs_diverge(eff) {
  const t = Math.max(0, Math.min(1, (eff - 25) / 50));
  const lerp = (c1, c2, u) => c1.map((v, k) => Math.round(v + (c2[k] - v) * u));
  const R = [176, 74, 52], N = [238, 231, 216], G = [94, 145, 82];
  const c = t < 0.5 ? lerp(R, N, t * 2) : lerp(N, G, (t - 0.5) * 2);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// categorías con al menos un cruce (para no ofrecer competencias vacías)
function vs_availCats() {
  const has = {};
  DATA_VERSUS.confOrder.forEach(cf => (DATA_VERSUS.porConf[cf] || []).forEach(r => { if (r[2] > 0) has[r[1]] = true; }));
  return has;
}
// primer año con cruces (para el auto-encuadre del slider)
function vs_firstYear(cat) {
  let mn = null;
  DATA_VERSUS.confOrder.forEach(cf => (DATA_VERSUS.porConf[cf] || []).forEach(r => {
    if (r[2] <= 0) return;
    if (cat != null && cat !== 'ALL' && r[1] !== cat) return;
    const y = r[0] + DATA_VERSUS.y0; if (mn === null || y < mn) mn = y;
  }));
  return mn === null ? DATA_VERSUS.y0 : mn;
}
// series temporales por confederación para la vista de evolución
function vs_series() {
  const s = vs_state(), y0 = DATA_VERSUS.y0, cat = s.cat, w = s.maYears;
  const N = DATA_VERSUS.y1 - y0 + 1;
  return DATA_VERSUS.confOrder.map(cf => {
    const num = new Array(N).fill(0), den = new Array(N).fill(0), gdy = new Array(N).fill(0);
    (DATA_VERSUS.porConf[cf] || []).forEach(r => {
      if (cat !== 'ALL' && r[1] !== cat) return;
      num[r[0]] += 3 * r[3] + r[4]; den[r[0]] += 3 * r[2]; gdy[r[0]] += r[6];
    });
    const pts = [];
    if (s.metric === 'eff') {
      // promedio móvil ponderado por volumen (suaviza num y den por separado).
      // Piso de muestra: no dibujamos puntos cuya ventana tenga menos de VS_LINE_FLOOR
      // partidos (den = 3·partidos). Sin esto, la era temprana (1 o 2 cruces por año)
      // dispara la línea a 0% o 100% y el gráfico se vuelve ilegible.
      for (let i = 0; i < N; i++) {
        let sn = 0, sd = 0;
        for (let j = Math.max(0, i - w + 1); j <= i; j++) { sn += num[j]; sd += den[j]; }
        if (sd >= 3 * VS_LINE_FLOOR) pts.push([y0 + i, sn / sd * 100]);
      }
    } else {
      // diferencia de gol acumulada dentro del período elegido
      let acc = 0;
      for (let i = 0; i < N; i++) { const yr = y0 + i; if (yr < s.period[0]) continue; acc += gdy[i]; pts.push([yr, acc]); }
    }
    return { key: cf, label: cf, color: CONF_FIFA_COLORS[cf], pts };
  });
}

// ---- ticks del eje Y con soporte de negativos -------------------------------
function vs_ticks(lo, hi, target) {
  const span = (hi - lo) || 1, raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw))), norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return { step, ticks: out };
}

// ---- DRAW: router -----------------------------------------------------------
function drawVersus() {
  if (typeof DATA_VERSUS === 'undefined') return;
  const s = vs_state();
  if (s.view === 'rank') vs_drawBars();
  else if (s.view === 'matrix') vs_drawMatrix();
  else if (s.view === 'scatter') vs_drawScatter();
  else vs_drawLines();
  vs_applyHeadings();
}
function vs_svg() { return document.getElementById('chart' + VS_N); }
function vs_clearHover(svg) {
  if (svg.__tsMove) { svg.removeEventListener('mousemove', svg.__tsMove); svg.removeEventListener('mouseleave', svg.__tsLeave); svg.__tsMove = null; svg.__tsLeave = null; }
  const tt = document.getElementById('tooltip' + VS_N); if (tt) { tt.style.display = 'none'; tt.style.opacity = '0'; }
}
function vs_drawEmpty() {
  const svg = vs_svg(); if (!svg) return;
  svg.innerHTML = ''; vs_clearHover(svg);
  const vb = (svg.getAttribute('viewBox') || '0 0 1100 520').split(' ').map(Number);
  const e = vs_el('text');
  e.setAttribute('x', vb[2] / 2); e.setAttribute('y', vb[3] / 2); e.setAttribute('text-anchor', 'middle');
  e.style.fontFamily = 'var(--sans)'; e.style.fontSize = '16px'; e.setAttribute('fill', 'var(--ink-muted, #8a857c)');
  e.textContent = vs_t('pc-empty', 'No hay partidos para mostrar con estos filtros.');
  svg.appendChild(e);
}

// ---- DRAW: tabla de posiciones (barras apiladas G/E/P) ----------------------
function vs_drawBars() {
  const svg = vs_svg(); if (!svg) return;
  svg.innerHTML = ''; vs_clearHover(svg);
  const s = vs_state(), a = s.period[0], b = s.period[1];
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!editorFormat || mobile;
  let W = 1100, H = 520;
  if (editorFormat && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[editorFormat]) { W = PNG_FORMATS[editorFormat].vbW; H = Math.max(PNG_FORMATS[editorFormat].vbH, 640); }
  else if (mobile) { W = 1100; H = 760; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  let rows = DATA_VERSUS.confOrder.map(cf => vs_agg(cf, a, b, s.cat)).filter(o => o.m > 0);
  if (!rows.length) { vs_drawEmpty(); return; }
  rows.sort((x, y) => y.eff - x.eff);

  const fs = bigFmt ? 24 : 14, fsSmall = bigFmt ? 17 : 11;
  const M = { top: bigFmt ? 92 : 54, right: bigFmt ? 250 : 168, bottom: bigFmt ? 28 : 18, left: bigFmt ? 360 : 268 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const step = PH / rows.length, bh = Math.min(bigFmt ? 74 : 44, step * 0.62);
  const x0 = M.left, barW = PW;
  const g = vs_el('g'); svg.appendChild(g);
  const txt = (xx, yy, s2, o) => {
    const e = vs_el('text'); e.setAttribute('x', xx); e.setAttribute('y', yy);
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((o && o.fs) || fs) + 'px';
    if (o && o.anchor) e.setAttribute('text-anchor', o.anchor);
    e.setAttribute('font-weight', (o && o.weight) || 400);
    e.setAttribute('fill', (o && o.fill) || 'var(--ink)'); e.textContent = s2; g.appendChild(e); return e;
  };

  // encabezados de columna (arriba)
  txt(x0, M.top - (bigFmt ? 22 : 14), vs_t('c8-col-record', 'Ganó / empató / perdió'), { fs: fsSmall, fill: 'var(--ink-muted)' });
  txt(W - M.right + (bigFmt ? 66 : 44), M.top - (bigFmt ? 22 : 14), vs_t('c8-col-eff', 'Efectividad'), { fs: fsSmall, anchor: 'end', fill: 'var(--ink-muted)' });
  txt(W - (bigFmt ? 8 : 4), M.top - (bigFmt ? 22 : 14), vs_t('c8-col-gd', 'Dif. de gol'), { fs: fsSmall, anchor: 'end', fill: 'var(--ink-muted)' });

  // leyenda G/E/P (arriba a la izquierda)
  const legY = bigFmt ? 40 : 24, sw = bigFmt ? 16 : 12;
  let lx = 2;
  [[VS_WIN, vs_t('c8-won', 'Ganó')], [VS_DRAW, vs_t('c8-drew', 'Empató')], [VS_LOSS, vs_t('c8-lost', 'Perdió')]].forEach(([col, lab]) => {
    const r = vs_el('rect'); r.setAttribute('x', lx); r.setAttribute('y', legY - sw + 2); r.setAttribute('width', sw); r.setAttribute('height', sw); r.setAttribute('rx', 2); r.setAttribute('fill', col); g.appendChild(r);
    const e = txt(lx + sw + 6, legY, lab, { fs: fsSmall, fill: 'var(--ink-soft)' });
    lx += sw + 12 + (lab.length * fsSmall * 0.58) + 14;
  });

  const hover = !editorFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  let dividerDrawn = false;
  rows.forEach((d, i) => {
    const yc = M.top + i * step + step / 2, by = yc - bh / 2;
    // divisor: entre las que ganan más de lo que pierden (G>P) y el resto
    if (!dividerDrawn && d.w <= d.l && i > 0) {
      const dy = M.top + i * step;
      const ln = vs_el('line'); ln.setAttribute('x1', x0); ln.setAttribute('x2', W - M.right); ln.setAttribute('y1', dy); ln.setAttribute('y2', dy);
      ln.setAttribute('stroke', 'var(--ink-muted)'); ln.setAttribute('stroke-width', 1); ln.setAttribute('stroke-dasharray', '4 3'); ln.setAttribute('stroke-opacity', 0.7); g.appendChild(ln);
      txt(x0, dy - (bigFmt ? 8 : 5), vs_t('c8-divider', 'Ganan más de lo que pierden ↑'), { fs: fsSmall, fill: 'var(--ink-muted)' });
      dividerDrawn = true;
    }
    // barra apilada 100% G/E/P
    const segs = [[d.w, VS_WIN], [d.d, VS_DRAW], [d.l, VS_LOSS]];
    let cx = x0;
    segs.forEach(([val, col]) => {
      const wpx = val / d.m * barW;
      const r = vs_el('rect'); r.setAttribute('x', cx); r.setAttribute('y', by); r.setAttribute('width', Math.max(0, wpx)); r.setAttribute('height', bh); r.setAttribute('fill', col);
      r.setAttribute('data-vs', d.cf); g.appendChild(r); cx += wpx;
    });
    // etiquetas: nombre + jugados (izquierda), efectividad + dif. gol (derecha)
    txt(x0 - (bigFmt ? 16 : 10), yc - (bigFmt ? 2 : 1), vs_confLabel(d.cf), { anchor: 'end', weight: 500 });
    txt(x0 - (bigFmt ? 16 : 10), yc + (bigFmt ? 22 : 14), vs_nf(d.m) + ' ' + vs_t('c8-played', 'jugados'), { anchor: 'end', fs: fsSmall, fill: 'var(--ink-muted)' });
    txt(W - M.right + (bigFmt ? 66 : 44), yc + (bigFmt ? 8 : 5), (Math.round(d.eff)) + '%', { anchor: 'end', weight: 700, fs: bigFmt ? 26 : 15 });
    const gdCol = d.gd > 0 ? '#3B6D2E' : d.gd < 0 ? '#93331F' : 'var(--ink-muted)';
    txt(W - (bigFmt ? 8 : 4), yc + (bigFmt ? 8 : 5), (d.gd > 0 ? '+' : '') + vs_nf(d.gd), { anchor: 'end', weight: 600, fill: gdCol });
    // hit-area para tooltip
    if (hover) {
      const hit = vs_el('rect'); hit.setAttribute('x', 0); hit.setAttribute('y', M.top + i * step); hit.setAttribute('width', W); hit.setAttribute('height', step);
      hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'default'; g.appendChild(hit);
      hit.addEventListener('mouseenter', () => { svg.querySelectorAll('[data-vs]').forEach(el => { el.setAttribute('fill-opacity', el.getAttribute('data-vs') === d.cf ? 1 : 0.32); }); vs_barTip(d); });
      hit.addEventListener('mousemove', (ev) => vs_tipMove(ev));
      hit.addEventListener('mouseleave', () => { svg.querySelectorAll('[data-vs]').forEach(el => el.setAttribute('fill-opacity', 1)); vs_tipHide(); });
    }
  });
}
function vs_barTip(d) {
  const tt = document.getElementById('tooltip' + VS_N); if (!tt) return;
  const pts = 3 * d.w + d.d;
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${vs_confLabel(d.cf)}</div>`
    + `<div style="opacity:.8;margin-bottom:4px;">${vs_t('c8-vs-others', 'vs. otras confederaciones')}</div>`
    + `<div style="display:flex;gap:6px;align-items:center;line-height:1.55;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${VS_WIN};"></span><span style="flex:1;">${vs_t('c8-won', 'Ganó')}</span><strong style="font-variant-numeric:tabular-nums;">${vs_nf(d.w)}</strong></div>`
    + `<div style="display:flex;gap:6px;align-items:center;line-height:1.55;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${VS_DRAW};"></span><span style="flex:1;">${vs_t('c8-drew', 'Empató')}</span><strong style="font-variant-numeric:tabular-nums;">${vs_nf(d.d)}</strong></div>`
    + `<div style="display:flex;gap:6px;align-items:center;line-height:1.55;"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${VS_LOSS};"></span><span style="flex:1;">${vs_t('c8-lost', 'Perdió')}</span><strong style="font-variant-numeric:tabular-nums;">${vs_nf(d.l)}</strong></div>`
    + `<div style="border-top:1px solid rgba(0,0,0,.12);margin-top:5px;padding-top:5px;">${vs_t('c8-eff-tip', 'Efectividad')}: <strong>${d.eff.toFixed(1)}%</strong> <span style="opacity:.7;">(${vs_nf(pts)}/${vs_nf(3 * d.m)} ${vs_t('c8-points', 'puntos')})</span></div>`
    + `<div>${vs_t('c8-col-gd', 'Dif. de gol')}: <strong>${d.gd > 0 ? '+' : ''}${vs_nf(d.gd)}</strong></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function vs_tipMove(ev) {
  const tt = document.getElementById('tooltip' + VS_N); if (!tt) return;
  const svg = vs_svg(), rc = svg.getBoundingClientRect();
  const _x = ev.clientX - rc.left, _w = tt.offsetWidth || 180;
  tt.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
  tt.style.top = (ev.clientY - rc.top + 14) + 'px';
}
function vs_tipHide() { const tt = document.getElementById('tooltip' + VS_N); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

// ---- DRAW: matriz de enfrentamientos (quién le gana a quién) ----------------
function vs_drawMatrix() {
  const svg = vs_svg(); if (!svg) return;
  svg.innerHTML = ''; vs_clearHover(svg);
  const s = vs_state(), a = s.period[0], b = s.period[1], ord = DATA_VERSUS.confOrder, n = ord.length;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!editorFormat || mobile;
  let W = 1100, H = 520;
  if (editorFormat && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[editorFormat]) { W = PNG_FORMATS[editorFormat].vbW; H = Math.max(PNG_FORMATS[editorFormat].vbH, 760); }
  else if (mobile) { W = 1100; H = 820; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const fs = bigFmt ? 20 : 13, fsCell = bigFmt ? 24 : 15;
  const M = { top: bigFmt ? 96 : 60, right: bigFmt ? 44 : 26, bottom: bigFmt ? 34 : 20, left: bigFmt ? 220 : 140 };
  const gridW = W - M.left - M.right, gridH = H - M.top - M.bottom;
  const cw = gridW / n, ch = gridH / n;
  const g = vs_el('g'); svg.appendChild(g);
  const txt = (x, y, s2, o) => { const e = vs_el('text'); e.setAttribute('x', x); e.setAttribute('y', y); e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((o && o.fs) || fs) + 'px'; if (o && o.anchor) e.setAttribute('text-anchor', o.anchor); e.setAttribute('font-weight', (o && o.weight) || 400); e.setAttribute('fill', (o && o.fill) || 'var(--ink)'); e.textContent = s2; g.appendChild(e); return e; };
  const hover = !editorFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  // headers: columna (arriba) y fila (izquierda), en el color de cada confederación
  for (let j = 0; j < n; j++) txt(M.left + j * cw + cw / 2, M.top - (bigFmt ? 16 : 9), ord[j], { anchor: 'middle', weight: 600, fs: bigFmt ? 17 : 11.5, fill: CONF_FIFA_COLORS[ord[j]] });
  for (let i = 0; i < n; i++) txt(M.left - (bigFmt ? 14 : 8), M.top + i * ch + ch / 2 + (bigFmt ? 6 : 4), vs_confLabel(ord[i]), { anchor: 'end', weight: 600, fs: bigFmt ? 17 : 12, fill: CONF_FIFA_COLORS[ord[i]] });
  // celdas: fila = confederación, columna = rival; color por efectividad de la fila
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = M.left + j * cw, y = M.top + i * ch;
    const rect = vs_el('rect'); rect.setAttribute('x', x + 1.5); rect.setAttribute('y', y + 1.5); rect.setAttribute('width', cw - 3); rect.setAttribute('height', ch - 3); rect.setAttribute('rx', 3);
    if (i === j) { rect.setAttribute('fill', '#E7E1D4'); rect.setAttribute('fill-opacity', 0.55); g.appendChild(rect); continue; }
    const o = vs_pairAgg(ord[i], ord[j], a, b, s.cat);
    if (!o || !o.m) { rect.setAttribute('fill', '#E7E1D4'); rect.setAttribute('fill-opacity', 0.3); g.appendChild(rect); txt(x + cw / 2, y + ch / 2 + 4, '·', { anchor: 'middle', fill: 'var(--ink-muted)' }); continue; }
    rect.setAttribute('fill', vs_diverge(o.eff)); g.appendChild(rect);
    txt(x + cw / 2, y + ch / 2 + (bigFmt ? 3 : 1), Math.round(o.eff) + '%', { anchor: 'middle', weight: 700, fs: fsCell, fill: '#2A2824' });
    if (hover) {
      rect.style.cursor = 'default';
      rect.addEventListener('mouseenter', () => { rect.setAttribute('stroke', '#33312C'); rect.setAttribute('stroke-width', 2); vs_matTip(ord[i], ord[j], o); });
      rect.addEventListener('mousemove', (ev) => vs_tipMove(ev));
      rect.addEventListener('mouseleave', () => { rect.removeAttribute('stroke'); vs_tipHide(); });
    }
  }
}
function vs_matTip(rowCf, colCf, o) {
  const tt = document.getElementById('tooltip' + VS_N); if (!tt) return;
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${vs_confLabel(rowCf)} <span style="opacity:.6;">vs</span> ${vs_confLabel(colCf)}</div>`
    + `<div style="line-height:1.5;"><strong>${vs_nf(o.w)}</strong> ${vs_t('c8-won', 'Ganó')} · <strong>${vs_nf(o.d)}</strong> ${vs_t('c8-drew', 'Empató')} · <strong>${vs_nf(o.l)}</strong> ${vs_t('c8-lost', 'Perdió')}</div>`
    + `<div style="opacity:.85;line-height:1.5;">${vs_nf(o.m)} ${vs_t('c8-played', 'jugados')} · ${vs_t('c8-eff-tip', 'Efectividad')} <strong>${o.eff.toFixed(0)}%</strong> · ${vs_t('c8-col-gd', 'Dif. de gol')} <strong>${o.gd > 0 ? '+' : ''}${vs_nf(o.gd)}</strong></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}

// ---- DRAW: scatter por selección (volumen de partidos vs efectividad) --------
let vs_teamsLoading = false;
function vs_hasTeams() { return typeof DATA_VERSUS_TEAMS !== 'undefined'; }
function vs_ensureTeams(cb) {
  if (vs_hasTeams()) { if (cb) cb(); return; }
  if (vs_teamsLoading) return;
  vs_teamsLoading = true;
  const sc = document.createElement('script');
  sc.src = './data-versus-teams.js?v=' + (window.__ESP_V || '1');
  sc.onload = () => { vs_teamsLoading = false; if (cb) cb(); };
  sc.onerror = () => { vs_teamsLoading = false; };
  document.head.appendChild(sc);
}
function vs_teamName(n) { return (typeof atlasCountryName === 'function') ? atlasCountryName(n) : n; }
function vs_teamAgg(o, a, b, cat) {
  let m = 0, w = 0, d = 0, l = 0, gd = 0;
  for (const r of o.r) { const y = r[0] + DATA_VERSUS.y0; if (y < a || y > b) continue; if (cat !== 'ALL' && r[1] !== cat) continue; m += r[2]; w += r[3]; d += r[4]; l += r[5]; gd += r[6]; }
  return { n: o.n, c: o.c, m, w, d, l, gd, eff: m ? (3 * w + d) / (3 * m) * 100 : 0 };
}
const VS_SCATTER_MIN = 20;   // mínimo de partidos cruzados para entrar al scatter
function vs_drawScatter() {
  const svg = vs_svg(); if (!svg) return;
  if (!vs_hasTeams()) {
    svg.innerHTML = ''; vs_clearHover(svg); vs_ensureTeams(() => drawVersus());
    const e = vs_el('text'); e.setAttribute('x', 550); e.setAttribute('y', 260); e.setAttribute('text-anchor', 'middle'); e.style.fontFamily = 'var(--sans)'; e.style.fontSize = '15px'; e.setAttribute('fill', 'var(--ink-muted)'); e.textContent = vs_t('c8-loading', 'Cargando…'); svg.appendChild(e); return;
  }
  svg.innerHTML = ''; vs_clearHover(svg);
  const s = vs_state(), a = s.period[0], b = s.period[1];
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square', newsletter = editorFormat === 'newsletter', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = square || newsletter || mobilePng || mobile, isPng = square || newsletter || mobilePng;
  let W = 1100, H = 520, M;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = square ? 910 : newsletter ? 860 : f.vbH; M = { top: 30, right: 42, bottom: 80, left: 78 }; }
  else if (mobile) { W = 1100; H = 820; M = { top: 24, right: 36, bottom: 108, left: 84 }; }
  else { W = 1100; H = 520; M = { top: 20, right: 32, bottom: 48, left: 70 }; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const SIZES = bigFmt ? { tick: 22, axisTitle: 23, label: 21 } : { tick: 11, axisTitle: 11.5, label: 12 };
  const pts = DATA_VERSUS_TEAMS.map(o => vs_teamAgg(o, a, b, s.cat)).filter(o => o.m >= VS_SCATTER_MIN);
  if (!pts.length) { vs_drawEmpty(); return; }
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const maxM = Math.max(...pts.map(p => p.m));
  const xS = (m) => M.left + Math.sqrt(m / maxM) * PW;   // raíz: despliega el racimo de pocos partidos
  const yS = (e) => M.top + PH - (e / 100) * PH;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = yS(v);
    const gl = vs_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PW); gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    if (v === 50) { gl.setAttribute('stroke', 'var(--ink-soft)'); gl.setAttribute('stroke-dasharray', '4 3'); gl.setAttribute('stroke-opacity', 0.7); } else gl.setAttribute('class', 's-grid-line');
    svg.appendChild(gl);
    const lb = vs_el('text'); lb.setAttribute('x', M.left - (bigFmt ? 12 : 8)); lb.setAttribute('y', y + (bigFmt ? 8 : 4)); lb.setAttribute('text-anchor', 'end'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px'; lb.textContent = v + '%'; svg.appendChild(lb);
  });
  [25, 50, 100, 200, 400].filter(v => v <= maxM).forEach(v => {
    const x = xS(v);
    const gl = vs_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', M.top); gl.setAttribute('y2', M.top + PH); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lb = vs_el('text'); lb.setAttribute('x', x); lb.setAttribute('y', M.top + PH + (bigFmt ? 32 : 18)); lb.setAttribute('text-anchor', 'middle'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px'; lb.textContent = v; svg.appendChild(lb);
  });
  const yT = vs_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle'); yT.setAttribute('transform', `translate(${M.left - (bigFmt ? 58 : 44)}, ${M.top + PH / 2}) rotate(-90)`); yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = vs_t('c8-axis-eff', 'Efectividad (%)'); svg.appendChild(yT);
  const xT = vs_el('text'); xT.setAttribute('class', 's-axis-title'); xT.setAttribute('text-anchor', 'middle'); xT.setAttribute('x', M.left + PW / 2); xT.setAttribute('y', M.top + PH + (bigFmt ? 66 : 40)); xT.style.fontSize = SIZES.axisTitle + 'px'; xT.textContent = vs_t('c8-axis-played', 'Partidos entre confederaciones jugados'); svg.appendChild(xT);
  const dotsG = vs_el('g'); svg.appendChild(dotsG);
  const rad = bigFmt ? 7 : 5;
  pts.forEach(p => {
    const c = vs_el('circle'); c.setAttribute('cx', xS(p.m)); c.setAttribute('cy', yS(p.eff)); c.setAttribute('r', rad);
    c.setAttribute('fill', CONF_FIFA_COLORS[p.c] || '#888'); c.setAttribute('fill-opacity', 0.82); c.setAttribute('stroke', VS_BG); c.setAttribute('stroke-width', bigFmt ? 1.5 : 1);
    if (!isPng && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      c.style.cursor = 'default';
      c.addEventListener('mouseenter', () => { c.setAttribute('r', rad + 2); vs_scatterTip(p); });
      c.addEventListener('mousemove', (ev) => vs_tipMove(ev));
      c.addEventListener('mouseleave', () => { c.setAttribute('r', rad); vs_tipHide(); });
    }
    dotsG.appendChild(c);
  });
  // etiquetas: los de más partidos + los extremos de efectividad, con anti-solape simple
  const labeled = [], cand = pts.slice().sort((x, y) => y.m - x.m).slice(0, bigFmt ? 16 : 20);
  const byEff = pts.slice().sort((x, y) => y.eff - x.eff);
  [byEff[0], byEff[byEff.length - 1]].forEach(p => { if (p && cand.indexOf(p) < 0) cand.push(p); });
  cand.forEach(p => {
    const px = xS(p.m), py = yS(p.eff);
    if (labeled.some(q => Math.abs(q.x - px) < (bigFmt ? 74 : 54) && Math.abs(q.y - py) < (bigFmt ? 18 : 13))) return;
    labeled.push({ x: px, y: py });
    const e = vs_el('text'); e.setAttribute('x', px + (rad + 3)); e.setAttribute('y', py + (bigFmt ? 7 : 4)); e.style.fontFamily = 'var(--sans)'; e.style.fontSize = SIZES.label + 'px'; e.setAttribute('font-weight', bigFmt ? 600 : 500); e.setAttribute('fill', 'var(--ink)');
    e.setAttribute('paint-order', 'stroke'); e.setAttribute('stroke', VS_BG); e.setAttribute('stroke-width', bigFmt ? 4 : 2.5); e.setAttribute('stroke-linejoin', 'round');
    e.textContent = vs_teamName(p.n); svg.appendChild(e);
  });
}
function vs_scatterTip(p) {
  const tt = document.getElementById('tooltip' + VS_N); if (!tt) return;
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${vs_teamName(p.n)} <span style="opacity:.6;">${vs_confLabel(p.c)}</span></div>`
    + `<div style="line-height:1.5;">${vs_nf(p.m)} ${vs_t('c8-played', 'jugados')} · <strong>${vs_nf(p.w)}-${vs_nf(p.d)}-${vs_nf(p.l)}</strong></div>`
    + `<div style="opacity:.85;">${vs_t('c8-eff-tip', 'Efectividad')} <strong>${p.eff.toFixed(0)}%</strong> · ${vs_t('c8-col-gd', 'Dif. de gol')} <strong>${p.gd > 0 ? '+' : ''}${vs_nf(p.gd)}</strong></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}

// ---- DRAW: evolución (líneas, renderer propio con negativos) ----------------
function vs_drawLines() {
  const svg = vs_svg(); if (!svg) return;
  svg.innerHTML = ''; vs_clearHover(svg);
  const s = vs_state(), a = s.period[0], b = s.period[1], isEff = s.metric === 'eff';
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square', newsletter = editorFormat === 'newsletter', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = square || newsletter || mobilePng || mobile, isPng = square || newsletter || mobilePng;
  let W = 1100, H = 520, M;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = square ? 910 : newsletter ? 860 : f.vbH; M = { top: 40, right: 132, bottom: 84, left: 104 }; }
  else if (mobile) { W = 1100; H = 900; M = { top: 52, right: 128, bottom: 120, left: 100 }; }
  else { W = 1100; H = 520; M = { top: 24, right: 116, bottom: 46, left: 80 }; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const SIZES = bigFmt ? { tick: 22, axisTitle: 25, label: 24 } : { tick: 11, axisTitle: 11.5, label: 12 };
  const lineW = bigFmt ? 3.4 : 2;

  const series = vs_series();
  let vmin = Infinity, vmax = -Infinity;
  series.forEach(se => se.pts.forEach(p => { if (p[0] >= a && p[0] <= b && p[1] != null) { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; } }));
  if (!isFinite(vmin)) { vs_drawEmpty(); return; }
  let yMin, yMax;
  if (isEff) { yMin = 0; yMax = Math.max(10, vmax); }
  else { const pad = (vmax - vmin) * 0.08 || 10; yMin = Math.min(0, vmin) - pad; yMax = Math.max(0, vmax) + pad; }
  const tk = vs_ticks(yMin, yMax, bigFmt ? 5 : 6);
  yMin = Math.min(yMin, tk.ticks[0]); yMax = Math.max(yMax, tk.ticks[tk.ticks.length - 1]);

  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const xS = (yr) => M.left + ((yr - a) / ((b - a) || 1)) * PW;
  const yS = (v) => M.top + PH - ((v - yMin) / ((yMax - yMin) || 1)) * PH;

  // grid X (reusa ts_xTicks de ts-partidos.js)
  const xticks = (typeof ts_xTicks === 'function') ? ts_xTicks(a, b, PW, bigFmt ? 100 : 44) : [a, b];
  xticks.forEach(yr => {
    const x = xS(yr);
    const gl = vs_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', M.top); gl.setAttribute('y2', M.top + PH); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lb = vs_el('text'); lb.setAttribute('x', x); lb.setAttribute('y', M.top + PH + (bigFmt ? 34 : 18)); lb.setAttribute('text-anchor', 'middle'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px'; lb.textContent = yr; svg.appendChild(lb);
  });
  // grid Y + línea de cero enfatizada (métrica dif. de gol)
  tk.ticks.forEach(v => {
    if (v < yMin - 1e-9 || v > yMax + 1e-9) return;
    const y = yS(v), zero = (!isEff && Math.abs(v) < 1e-9);
    const gl = vs_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PW); gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    if (zero) { gl.setAttribute('stroke', 'var(--ink-soft)'); gl.setAttribute('stroke-width', bigFmt ? 1.8 : 1.2); gl.setAttribute('stroke-opacity', 0.8); }
    else gl.setAttribute('class', 's-grid-line');
    svg.appendChild(gl);
    const lb = vs_el('text'); lb.setAttribute('x', M.left - (bigFmt ? 12 : 8)); lb.setAttribute('y', y + (bigFmt ? 8 : 4)); lb.setAttribute('text-anchor', 'end'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px';
    lb.textContent = isEff ? v + '%' : (v > 0 ? '+' : '') + vs_nf(v); svg.appendChild(lb);
  });
  const axisT = isEff ? vs_t('c8-axis-eff', 'Efectividad (%)') : vs_t('c8-axis-gd', 'Diferencia de gol acumulada');
  const yT = vs_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${M.left - (bigFmt ? 78 : 46)}, ${M.top + PH / 2}) rotate(-90)`); yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = axisT; svg.appendChild(yT);

  const halosG = vs_el('g'); svg.appendChild(halosG);
  const linesG = vs_el('g'); svg.appendChild(linesG);
  const hitG = vs_el('g'); svg.appendChild(hitG);
  const endLabels = [];
  series.forEach(se => {
    const pts = se.pts.filter(p => p[0] >= a && p[0] <= b && p[1] != null);
    if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join('');
    const halo = vs_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', VS_BG); halo.setAttribute('stroke-width', lineW + (bigFmt ? 5 : 3)); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halo.setAttribute('data-ts', se.key); halosG.appendChild(halo);
    const path = vs_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', se.color); path.setAttribute('stroke-width', lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('data-ts', se.key); path.setAttribute('data-base-w', lineW); path.classList.add('ts-colored'); linesG.appendChild(path);
    if (!isPng) {
      const hit = vs_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 10));
      hit.addEventListener('mouseenter', () => { if (typeof ts_emph === 'function') ts_emph(svg, se.key); });
      hit.addEventListener('mouseleave', () => { if (typeof ts_emph === 'function') ts_emph(svg, null); });
      hitG.appendChild(hit);
    }
    const last = pts[pts.length - 1];
    endLabels.push({ key: se.key, color: se.color, text: se.label, x: xS(last[0]), idealY: yS(last[1]), valLast: last[1] });
  });

  // etiquetas de fin anti-colisión
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  endLabels.sort((p, q) => p.idealY - q.idealY);
  endLabels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + GAP);
    l.y = Math.min(l.y, M.top + PH); l.y = Math.max(l.y, M.top + (bigFmt ? 6 : 2));
    l.shifted = Math.abs(l.y - l.idealY) > 1.5;
  });
  const endG = vs_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) { const ln = vs_el('line'); ln.setAttribute('x1', l.x); ln.setAttribute('y1', l.idealY); ln.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); ln.setAttribute('y2', l.y); ln.setAttribute('stroke', l.color); ln.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); ln.setAttribute('stroke-opacity', 0.6); endG.appendChild(ln); }
    const lx = l.x + (bigFmt ? 12 : 6);
    const e = vs_el('text'); e.setAttribute('x', lx); e.setAttribute('y', l.y + (bigFmt ? 8 : 4)); e.setAttribute('fill', l.color); e.setAttribute('font-weight', bigFmt ? 700 : 600); e.style.fontSize = SIZES.label + 'px'; e.style.fontFamily = 'var(--sans)';
    e.setAttribute('paint-order', 'stroke'); e.setAttribute('stroke', VS_BG); e.setAttribute('stroke-width', bigFmt ? 6 : 3); e.setAttribute('stroke-linejoin', 'round'); e.setAttribute('data-ts', l.key);
    const val = isPng ? '  ' + (isEff ? Math.round(l.valLast) + '%' : (l.valLast > 0 ? '+' : '') + vs_nf(l.valLast)) : '';
    e.textContent = l.text + val; endG.appendChild(e);
  });

  // hover: crosshair + tooltip
  if (!isPng) {
    const tooltip = document.getElementById('tooltip' + VS_N);
    const hoverG = vs_el('g'); hoverG.setAttribute('display', 'none'); hoverG.setAttribute('pointer-events', 'none'); svg.appendChild(hoverG);
    const vline = vs_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', M.top); vline.setAttribute('y2', M.top + PH); hoverG.appendChild(vline);
    const cap = vs_el('rect'); cap.setAttribute('x', M.left); cap.setAttribute('y', M.top); cap.setAttribute('width', PW); cap.setAttribute('height', PH); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
    const nearest = (yr) => { let best = null, bd = Infinity; return (pts) => { best = null; bd = Infinity; pts.forEach(p => { const dd = Math.abs(p[0] - yr); if (dd < bd) { bd = dd; best = p; } }); return best; }; };
    function update(year, ev) {
      if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
      hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
      const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
      const rows = [];
      series.forEach(se => {
        const p = se.pts.find(q => q[0] === year); if (!p || p[1] == null) return;
        const c = vs_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 3.6); c.setAttribute('fill', se.color); c.setAttribute('stroke', VS_BG); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
        rows.push({ label: vs_confLabel(se.key), color: se.color, v: isEff ? Math.round(p[1]) + '%' : (p[1] > 0 ? '+' : '') + vs_nf(p[1]), sort: p[1] });
      });
      if (!rows.length) { update(null); return; }
      rows.sort((p, q) => q.sort - p.sort);
      if (tooltip) {
        let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
        rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v}</strong></div>`; });
        tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
        const rc = svg.getBoundingClientRect(); const _x = (typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left, _w = tooltip.offsetWidth || 180;
        tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
        tooltip.style.top = ((typeof evClientY === 'function' ? evClientY(ev) : ev.clientY) - rc.top + 14) + 'px';
      }
    }
    const moveH = (ev) => {
      const rc = svg.getBoundingClientRect(), sc = rc.width / W;
      const lx = ((typeof evClientX === 'function' ? evClientX(ev) : ev.clientX) - rc.left) / sc;
      if (!isFinite(lx) || lx < M.left || lx > W - M.right) { update(null); return; }
      const yr = Math.round(a + ((lx - M.left) / PW) * (b - a));
      update(Math.max(a, Math.min(b, yr)), ev);
    };
    const leaveH = () => update(null);
    svg.__tsMove = moveH; svg.__tsLeave = leaveH;
    svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', leaveH);
    if (typeof wireTouchScrub === 'function') wireTouchScrub(svg, moveH);
  }
}

// ---- headings (título insight en pristino; subtítulo dinámico) --------------
function vs_pristine() {
  const s = vs_state();
  return !vs_touched && s.view === 'rank' && s.cat === 'ALL';
}
function vs_periodTxt() { const s = vs_state(); return s.period[0] + '–' + s.period[1]; }
function vs_catTxt() {
  const s = vs_state(); if (s.cat === 'ALL') return '';
  return vs_t('c6-cat-' + s.cat, '') + '. ';
}
function vs_subtitle() {
  const s = vs_state(), en = vs_lang() === 'en', per = vs_periodTxt(), cat = vs_catTxt();
  const base = en ? 'in matches between different confederations' : 'en partidos entre confederaciones distintas';
  if (s.view === 'matrix') {
    return en ? `${cat}Points effectiveness of each confederation (row) against each rival (column) ${base} (${per}). Green: wins more.`
      : `${cat}Efectividad en puntos de cada confederación (fila) contra cada rival (columna) ${base} (${per}). Verde: gana más.`;
  }
  if (s.view === 'scatter') {
    return en ? `${cat}Each national team's points effectiveness ${base}, against how many it has played (${per}). Teams with 20+ matches.`
      : `${cat}Efectividad en puntos de cada selección ${base}, según cuántos jugó (${per}). Selecciones con 20 partidos o más.`;
  }
  if (s.view === 'rank') {
    return en ? `${cat}Points won (3 for a win, 1 for a draw) ${base} (${per}).`
      : `${cat}Efectividad en puntos (3 por victoria, 1 por empate) ${base} (${per}).`;
  }
  if (s.metric === 'gd') {
    return en ? `${cat}Cumulative goal difference ${base} (${per}).`
      : `${cat}Diferencia de gol acumulada ${base} (${per}).`;
  }
  const ma = s.maYears > 1 ? (en ? `, ${s.maYears}-yr moving average` : `, promedio móvil de ${s.maYears} años`) : '';
  return en ? `${cat}Points won ${base}, over time (${per}${ma}).`
    : `${cat}Efectividad en puntos ${base}, a lo largo del tiempo (${per}${ma}).`;
}
function vs_source() {
  const s = vs_state(), en = vs_lang() === 'en';
  const yy = (typeof DATA_VERSUS !== 'undefined' && DATA_VERSUS.y1) ? DATA_VERSUS.y1 : 2026;
  let base = en
    ? `Data: Mart Jürisoo (martj42), own elaboration. Only matches between teams from different confederations. Effectiveness = points won over points available, with the current rule (3 for a win, 1 for a draw, 0 for a loss) applied across the whole series. Each team's confederation is the one in force on the match date. Series through ${yy} (includes the matches already played at the ${yy} World Cup).`
    : `Datos: la base de resultados internacionales de Mart Jürisoo (martj42) y elaboración propia. Solo partidos entre selecciones de confederaciones distintas. Efectividad = puntos obtenidos sobre posibles, con la regla actual (3 por victoria, 1 por empate, 0 por derrota) aplicada a toda la serie. La confederación de cada selección es la vigente en la fecha del partido. Serie hasta ${yy} (incluye los partidos ya jugados del Mundial ${yy}).`;
  if (s.view === 'lines' && s.metric === 'eff' && s.maYears > 1) base += en ? ` ${s.maYears}-year moving average.` : ` Promedio móvil de ${s.maYears} años.`;
  return base;
}
function vs_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="' + VS_N + '"]') || document;
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[vs_lang()]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = vs_t(vs_pristine() ? 'c8-title' : 'c8-title-neutral', '');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = vs_subtitle();
  const srcTxt = vs_source();
  document.querySelectorAll('[data-i18n="c8-sources"]').forEach(el => { el.textContent = srcTxt; });
}

// ---- controles --------------------------------------------------------------
function vs_syncCtx() {
  const s = vs_state(), lines = s.view === 'lines';
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  show('vs-metric-group', lines);
  show('vs-ma-group', lines && s.metric === 'eff');
}
function vs_setActiveTab() {
  const v = vs_state().view;
  [['vs-tab-rank', 'rank'], ['vs-tab-matrix', 'matrix'], ['vs-tab-evo', 'lines'], ['vs-tab-scatter', 'scatter']].forEach(([id, val]) => {
    const btn = document.getElementById(id); if (btn) btn.classList.toggle('active', v === val);
  });
}
function vs_dataStartYear() {
  const s = vs_state();
  // en la vista de efectividad, el primer año dibujado depende del piso de muestra
  // (no del primer cruce): arrancar ahí evita el vacío a la izquierda. En dif. de
  // gol y en la tabla, el primer año con cruces.
  if (s.view === 'lines' && s.metric === 'eff') {
    let mn = null;
    vs_series().forEach(se => { if (se.pts.length && (mn === null || se.pts[0][0] < mn)) mn = se.pts[0][0]; });
    if (mn !== null) return mn;
  }
  return vs_firstYear(s.cat);
}
function vs_autofitPeriod() {
  const s = vs_state(); if (s.periodAuto === false) return;
  s.period = [Math.min(vs_dataStartYear(), DATA_VERSUS.y1 - 5), DATA_VERSUS.y1];
  vs_updateSlider();
}
function vs_updateSlider() {
  const s = vs_state();
  const f = document.getElementById('vs-slider-from'), tt = document.getElementById('vs-slider-to');
  const disp = document.getElementById('vs-range-display'), tr = document.getElementById('vs-range-track-active');
  if (!f || !tt) return;
  f.value = s.period[0]; tt.value = s.period[1];
  if (disp) disp.textContent = `${s.period[0]}–${s.period[1]}`;
  if (tr) { const mn = +f.min, mx = +f.max, sp = mx - mn; if (sp > 0) { tr.style.left = ((s.period[0] - mn) / sp * 100) + '%'; tr.style.right = ((mx - s.period[1]) / sp * 100) + '%'; } }
}
function vs_setupTabs() {
  const map = [['vs-tab-rank', 'rank'], ['vs-tab-matrix', 'matrix'], ['vs-tab-evo', 'lines'], ['vs-tab-scatter', 'scatter']];
  const go = (v) => { const s = vs_state(); if (s.view === v) return; s.view = v; vs_touched = true; if (v === 'scatter') vs_ensureTeams(() => drawVersus()); vs_setActiveTab(); vs_syncCtx(); vs_autofitPeriod(); drawVersus(); };
  map.forEach(([id, v]) => { const btn = document.getElementById(id); if (btn) btn.addEventListener('click', () => go(v)); });
  vs_setActiveTab(); vs_syncCtx();
}
function vs_setupCat() {
  const sel = document.getElementById('vs-cat-select'); if (!sel) return;
  // ocultar competencias sin cruces
  const avail = vs_availCats();
  Array.from(sel.options).forEach(o => { if (o.value !== 'ALL' && !avail[+o.value]) o.style.display = 'none'; });
  sel.value = String(vs_state().cat);
  sel.addEventListener('change', () => { const s = vs_state(); s.cat = sel.value === 'ALL' ? 'ALL' : +sel.value; vs_touched = true; vs_autofitPeriod(); drawVersus(); });
}
function vs_setupMetric() {
  document.querySelectorAll('#vs-metric button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#vs-metric button').forEach(x => x.classList.toggle('active', x === b));
    vs_state().metric = b.dataset.metric; vs_touched = true; vs_syncCtx(); vs_autofitPeriod(); drawVersus();
  }));
  const ma = document.getElementById('vs-ma'), val = document.getElementById('vs-ma-val');
  if (ma) { ma.value = vs_state().maYears; if (val) val.textContent = ma.value; ma.addEventListener('input', () => { vs_state().maYears = +ma.value; if (val) val.textContent = ma.value; vs_touched = true; drawVersus(); }); }
}
function vs_setupSlider() {
  const f = document.getElementById('vs-slider-from'), tt = document.getElementById('vs-slider-to'); if (!f || !tt) return;
  const MINW = 5;
  f.addEventListener('input', () => { const s = vs_state(); let x = +f.value; if (x > s.period[1] - MINW) x = s.period[1] - MINW; s.period[0] = x; s.periodAuto = false; vs_touched = true; vs_updateSlider(); drawVersus(); });
  tt.addEventListener('input', () => { const s = vs_state(); let x = +tt.value; if (x < s.period[0] + MINW) x = s.period[0] + MINW; s.period[1] = x; s.periodAuto = false; vs_touched = true; vs_updateSlider(); drawVersus(); });
  vs_updateSlider();
}
function vs_setupCSV() {
  document.querySelectorAll('button.download[data-chart="' + VS_N + '-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'confederacion,anio,competencia,jugados,gano,empato,perdio,dif_gol\n';
    DATA_VERSUS.confOrder.forEach(cf => (DATA_VERSUS.porConf[cf] || []).forEach(r => {
      csv += `${cf},${r[0] + DATA_VERSUS.y0},${DATA_VERSUS.cats[r[1]]},${r[2]},${r[3]},${r[4]},${r[5]},${r[6]}\n`;
    }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-cruces-resultados.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initVersus() {
  if (typeof DATA_VERSUS === 'undefined') return;
  vs_state();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawVersus;
  window.__atlasDefaultPngFormat = 'square';
  window.onBeforePngExportGetSubtitle = function (chartId) { return String(chartId) === String(VS_N) ? vs_subtitle() : null; };
  window.onBeforePngExportGetSourceText = function (chartId) { return String(chartId) === String(VS_N) ? vs_source() : null; };
  vs_setupTabs(); vs_setupCat(); vs_setupMetric(); vs_setupSlider(); vs_setupCSV();
  vs_syncCtx();
  vs_autofitPeriod();
  drawVersus();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initVersus._wired) { initVersus._wired = true; window.addEventListener('atlas-editor-change', () => drawVersus()); window.addEventListener('resize', () => { clearTimeout(initVersus._rz); initVersus._rz = setTimeout(() => drawVersus(), 160); }); }
}
