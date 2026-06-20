// =============================================================
//  El Atlas N°3 — Chart 10: evolución de la altura de los mundialistas
// =============================================================
// ¿Cuánto más altos son los futbolistas que el varón promedio de su país y su
// generación? Línea de altura REAL vs ESPERADA (la del país de nacimiento en el
// año de nacimiento de cada jugador). Toggles:
//   - Forma: Líneas (promedio) ↔ Boxplot (distribución por Mundial).
//   - Desglose: Total ↔ Por puesto ↔ Por selección.
//   - vs país: mostrar la altura esperada (la brecha) — solo en líneas.
// Datos: ALTURA (data-altura.js). Motor/escala compartido con los otros charts.
//
// Mobile-first PNG (cuadrado por default) — ver skill graficos-atlas.

//==================================================================
//  Constantes
//==================================================================
const AL_REAL = '#BE5D32';            // altura real (terracota Atlas)
const AL_EXP = '#9A8F82';             // altura esperada del país (gris cálido)
const AL_POS_COL = { GK: '#C9A227', DEF: '#2B5C8A', MID: '#5BA152', FWD: '#9A4FA8' };
const AL_PALETTE = [
  '#2B5C8A', '#C0473A', '#5BA152', '#C9A227', '#9A4FA8', '#2BA0A8',
  '#1B3956', '#772C24', '#386433', '#7D6418', '#5F3168', '#1B6368'
];
function al_colorForSlot(s) { return AL_PALETTE[s % AL_PALETTE.length]; }

const AL_POS_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
const AL_POS_NAME = {
  GK: ['Arqueros', 'Goalkeepers'], DEF: ['Defensores', 'Defenders'],
  MID: ['Mediocampistas', 'Midfielders'], FWD: ['Delanteros', 'Forwards']
};
const AL_BIG = ['ARG', 'BRA', 'DEU', 'NLD', 'ESP'];   // selección default (team_code = ISO3)

const AL_W_DESKTOP = 1100, AL_H_DESKTOP = 520;
const AL_W_MOBILE = 1100, AL_H_MOBILE = 1000;
const AL_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 60 };
const AL_MARGIN_MOBILE = { top: 64, right: 168, bottom: 150, left: 96 };
function al_getMargins(format) {
  switch (format) {
    case 'public': return { top: 40, right: 168, bottom: 92, left: 74 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96, left: 104 };
    case 'square': return { top: 44, right: 184, bottom: 74, left: 104 };
    case 'mobile': return { top: 64, right: 176, bottom: 150, left: 110 };
    default: return { ...AL_MARGIN_DESKTOP };
  }
}
let AL_W = AL_W_DESKTOP, AL_H = AL_H_DESKTOP, AL_MARGIN = { ...AL_MARGIN_DESKTOP };
const AL_NS = 'http://www.w3.org/2000/svg';
const al_el = (t) => document.createElementNS(AL_NS, t);
const AL_YEAR_MIN = 1930, AL_YEAR_MAX = 2026;

//==================================================================
//  Data
//==================================================================
let al_years = null, al_overall = null, al_teams = null, al_positions = null, al_teamNames = null, al_proxies = null, al_proxyMap = null;
function al_initData() {
  if (al_overall) return;
  if (typeof ALTURA === 'undefined') { console.error('[altura] ALTURA no cargado'); al_years = []; al_overall = {}; al_teams = {}; al_positions = {}; al_teamNames = {}; al_proxies = {}; return; }
  al_years = ALTURA.years.slice();
  al_overall = ALTURA.overall;
  al_teams = ALTURA.teams;
  al_positions = ALTURA.positions;
  al_teamNames = ALTURA.teamNames;
  al_proxies = ALTURA.proxies || {};
  al_proxyMap = ALTURA.proxyMap || {};
}
function al_mode() { return (state[10] && state[10].mode) || 'line'; }
function al_group() { return (state[10] && state[10].group) || 'total'; }
function al_vsCountry() { return !!(state[10] && state[10].vsCountry); }

//==================================================================
//  Helpers
//==================================================================
function al_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function al_measureText(text, size, weight) {
  if (!al_measureText._c) al_measureText._c = document.createElement('canvas').getContext('2d');
  al_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return al_measureText._c.measureText(text).width;
}
const al_tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
function al_teamName(code) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const nm = al_teamNames && al_teamNames[code];
  if (nm) return lang === 'en' ? nm[1] : nm[0];
  return code;
}
function al_posName(p) { const lang = (typeof LANG !== 'undefined') ? LANG : 'es'; const nm = AL_POS_NAME[p]; return nm ? (lang === 'en' ? nm[1] : nm[0]) : p; }
function al_selMap() {
  if (!(state[10].selectedTeams instanceof Map)) state[10].selectedTeams = new Map(state[10].selectedTeams || []);
  return state[10].selectedTeams;
}
function al_getColor(code) { const s = al_selMap().get(code); return s == null ? null : al_colorForSlot(s); }
function al_nextFreeSlot() { const u = new Set(Array.from(al_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function al_toggleTeam(code) {
  const sel = al_selMap();
  if (sel.has(code)) sel.delete(code); else sel.set(code, al_nextFreeSlot());
  al_renderChips(); drawAltura();
}
function al_xTicks(y0, y1, plotW, minGapPx) {
  const ys = (al_years || []).filter(y => y >= y0 && y <= y1);
  if (!ys.length) return [];
  const xOf = (y) => ((y - y0) / (y1 - y0)) * plotW;
  const out = [ys[0]]; let lastX = xOf(ys[0]);
  for (let i = 1; i < ys.length - 1; i++) { const x = xOf(ys[i]); if (x - lastX >= minGapPx) { out.push(ys[i]); lastX = x; } }
  const last = ys[ys.length - 1];
  if (out[out.length - 1] !== last) { if (out.length > 1 && xOf(last) - lastX < minGapPx) out.pop(); out.push(last); }
  return out;
}
// Escala Y "linda" para cm: redondea a múltiplos de 5, ticks cada 5.
function al_yScale(min, max) {
  let lo = Math.floor((min - 1) / 5) * 5, hi = Math.ceil((max + 1) / 5) * 5;
  if (hi - lo < 10) hi = lo + 10;
  const ticks = []; for (let v = lo; v <= hi + 0.001; v += 5) ticks.push(v);
  return { min: lo, max: hi, ticks };
}

//==================================================================
//  Construcción de series según los toggles
//==================================================================
// Línea: lista de { key, label, color, pts:[[year,val]], dashed }
function al_lineSeries() {
  al_initData();
  const G = al_group(), out = [];
  const get = (obj, field) => { const r = []; (al_years || []).forEach(y => { const d = obj[String(y)]; if (d && d[field] != null) r.push([y, d[field]]); }); return r; };
  if (G === 'total') {
    out.push({ key: 'real', label: al_tt('c10-real', 'Mundialistas'), color: AL_REAL, pts: get(al_overall, 'act') });
    if (al_vsCountry()) out.push({ key: 'exp', label: al_tt('c10-exp', 'Varón promedio del país'), color: AL_EXP, pts: get(al_overall, 'exp'), dashed: true });
  } else if (G === 'pos') {
    AL_POS_ORDER.forEach(p => { const o = al_positions[p]; if (o) out.push({ key: 'pos:' + p, label: al_posName(p), color: AL_POS_COL[p], pts: get(o, 'act') }); });
  } else { // team
    Array.from(al_selMap().keys()).forEach(code => {
      const o = al_teams[code]; if (!o) return; const col = al_getColor(code);
      out.push({ key: 'team:' + code, label: al_teamName(code), color: col, pts: get(o, 'act') });
      if (al_vsCountry()) out.push({ key: 'teamexp:' + code, label: '', color: col, pts: get(o, 'exp'), dashed: true, faint: true });
    });
  }
  return out;
}
// Boxplot: lista de { key, label, color, boxes:[[year,mn,q1,md,q3,mx]] }
function al_boxGroups() {
  al_initData();
  const G = al_group(), out = [];
  const boxes = (obj) => { const r = []; (al_years || []).forEach(y => { const d = obj[String(y)]; if (d && d.box) r.push([y].concat(d.box)); }); return r; };
  if (G === 'pos') AL_POS_ORDER.forEach(p => { const o = al_positions[p]; if (o) out.push({ key: p, label: al_posName(p), color: AL_POS_COL[p], boxes: boxes(o) }); });
  else if (G === 'team') Array.from(al_selMap().keys()).forEach(code => { const o = al_teams[code]; if (o) out.push({ key: code, label: al_teamName(code), color: al_getColor(code), boxes: boxes(o) }); });
  else out.push({ key: 'all', label: al_tt('c10-real', 'Mundialistas'), color: AL_REAL, boxes: boxes(al_overall) });
  return out;
}

//==================================================================
//  DRAW
//==================================================================
function drawAltura() {
  const svg = document.getElementById('chart10');
  if (!svg) return;
  svg.innerHTML = '';
  al_clearHover(svg);
  al_initData();

  // Toggle de selección/buscador: solo visible en desglose "por selección".
  const showSearch = al_group() === 'team';
  const wrap = document.getElementById('al-search-wrap');
  if (wrap) wrap.style.display = showSearch ? '' : 'none';
  // "vs país" no aplica en boxplot ni por puesto.
  const vsBtn = document.getElementById('al-vscountry');
  if (vsBtn) { const g = vsBtn.closest('.lg-mode'); if (g) g.style.display = (al_mode() === 'box' || al_group() === 'pos') ? 'none' : ''; }

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && al_isMobile();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; AL_W = f.vbW;
    AL_H = square ? 910 : newsletter ? 860 : f.vbH;
    AL_MARGIN = al_getMargins(editorFormat);
  } else if (mobile) { AL_W = AL_W_MOBILE; AL_H = AL_H_MOBILE; AL_MARGIN = { ...AL_MARGIN_MOBILE }; }
  else { AL_W = AL_W_DESKTOP; AL_H = AL_H_DESKTOP; AL_MARGIN = { ...AL_MARGIN_DESKTOP }; }
  let PLOT_W = AL_W - AL_MARGIN.left - AL_MARGIN.right;
  const PLOT_H = AL_H - AL_MARGIN.top - AL_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${AL_W} ${AL_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const period = (state[10] && state[10].period) || [AL_YEAR_MIN, AL_YEAR_MAX];
  const y0 = period[0], y1 = period[1];
  const inP = (pts) => pts.filter(p => p[0] >= y0 && p[0] <= y1);

  // ── reunir valores visibles para la escala Y ──
  const isBox = al_mode() === 'box';
  const lineSeries = isBox ? [] : al_lineSeries();
  const boxGroups = isBox ? al_boxGroups() : [];
  let vmin = Infinity, vmax = -Infinity;
  if (isBox) boxGroups.forEach(g => inP(g.boxes).forEach(b => { if (b[1] < vmin) vmin = b[1]; if (b[5] > vmax) vmax = b[5]; }));
  else lineSeries.forEach(s => inP(s.pts).forEach(p => { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; }));
  if (!isFinite(vmin)) { vmin = 165; vmax = 185; }
  const yScale = al_yScale(vmin, vmax);

  // margen derecho dinámico (para los end-labels de líneas)
  if (!isBox) {
    const labelOffset = bigFmt ? 12 : 6;
    let maxLabelW = 0;
    lineSeries.filter(s => s.label).forEach(s => { const w = al_measureText(s.label, SIZES.label, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
    const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
    AL_MARGIN.right = Math.min(Math.round(AL_W * 0.42), Math.max(AL_MARGIN.right, neededRight));
    PLOT_W = AL_W - AL_MARGIN.left - AL_MARGIN.right;
  }

  const xS = (yr) => AL_MARGIN.left + ((yr - y0) / (y1 - y0 || 1)) * PLOT_W;
  const yS = (v) => AL_MARGIN.top + PLOT_H - ((v - yScale.min) / (yScale.max - yScale.min)) * PLOT_H;

  // grid + eje X
  al_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = al_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', AL_MARGIN.top); gl.setAttribute('y2', AL_MARGIN.top + PLOT_H); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = al_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', AL_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18)); lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y (cm)
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = al_el('line'); gl.setAttribute('x1', AL_MARGIN.left); gl.setAttribute('x2', AL_MARGIN.left + PLOT_W); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = al_el('text'); lbl.setAttribute('x', AL_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4)); lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = v; svg.appendChild(lbl);
  });
  // título eje Y
  const yT = al_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${AL_MARGIN.left - (mobile || mobilePng ? 80 : bigFmt ? 74 : 42)}, ${AL_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = al_tt('c10-axis-y', 'Altura (cm)'); svg.appendChild(yT);

  if (isBox) al_drawBoxes(svg, boxGroups, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW });
  else al_drawLines(svg, lineSeries, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP });

  al_applyHeadings();
}

//------------------------------------------------------------------
//  Modo LÍNEAS (multi-serie + end-labels anti-colisión)
//------------------------------------------------------------------
function al_drawLines(svg, series, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP } = ctx;
  const halosG = al_el('g'); svg.appendChild(halosG);
  const linesG = al_el('g'); svg.appendChild(linesG);
  const dotsG = al_el('g'); svg.appendChild(dotsG);
  const endLabels = [], hoverSeries = [];

  series.forEach(s => {
    const pts = inP(s.pts); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
    const halo = al_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halosG.appendChild(halo);
    const path = al_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', s.faint ? lineW * 0.7 : lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (s.dashed) path.setAttribute('stroke-dasharray', bigFmt ? '2 7' : '1 4');
    if (s.faint) path.setAttribute('stroke-opacity', 0.55);
    linesG.appendChild(path);
    if (!s.faint) pts.forEach(p => { const c = al_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); dotsG.appendChild(c); });
    const last = pts[pts.length - 1];
    if (s.label) endLabels.push({ label: s.label, color: s.color, idealY: yS(last[1]), x: xS(y1), valLast: last[1] });
    hoverSeries.push({ label: s.label || (al_tt('c10-exp', 'esperada')), color: s.color, faint: s.faint, pts });
  });

  // end-labels: anti-colisión hacia abajo + corrección si se desborda
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  const topB = AL_MARGIN.top + (bigFmt ? 6 : 2), botB = AL_MARGIN.top + (AL_H - AL_MARGIN.top - AL_MARGIN.bottom);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => { l.y = (i === 0) ? Math.max(l.idealY, topB) : Math.max(l.idealY, endLabels[i - 1].y + GAP); });
  if (endLabels.length) { const last = endLabels[endLabels.length - 1]; if (last.y > botB) { last.y = botB; for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - GAP); } }
  const endG = al_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    l.y = Math.max(l.y, topB);
    if (Math.abs(l.y - l.idealY) > 1.5) { const g = al_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y); g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); endG.appendChild(g); }
    const txt = al_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4)); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    const valTxt = isPngFormat ? '  ' + Math.round(l.valLast) : '';
    txt.textContent = l.label + valTxt; endG.appendChild(txt);
  });

  if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER) && hoverSeries.length) al_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries });
}

//------------------------------------------------------------------
//  Modo BOXPLOT (una caja por Mundial; varias por año si hay grupos)
//------------------------------------------------------------------
function al_drawBoxes(svg, groups, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, lineW, SIZES } = ctx;
  const yrs = (al_years || []).filter(y => y >= y0 && y <= y1);
  const nG = Math.max(1, groups.length);
  // ancho de slot por año; dividir entre grupos
  const slot = yrs.length > 1 ? (xS(yrs[1]) - xS(yrs[0])) : (AL_W - AL_MARGIN.left - AL_MARGIN.right);
  const bw = Math.max(3, Math.min(bigFmt ? 26 : 14, (slot * 0.62) / nG));
  const g = al_el('g'); svg.appendChild(g);
  const tooltip = document.getElementById('tooltip10');
  groups.forEach((grp, gi) => {
    const off = (gi - (nG - 1) / 2) * (bw + (bigFmt ? 3 : 2));
    grp.boxes.filter(b => b[0] >= y0 && b[0] <= y1).forEach(b => {
      const [yr, mn, q1, md, q3, mx] = b; const cx = xS(yr) + off;
      const yb1 = yS(q1), yb3 = yS(q3), ymd = yS(md), ymn = yS(mn), ymx = yS(mx);
      // whisker
      const wk = al_el('line'); wk.setAttribute('x1', cx); wk.setAttribute('x2', cx); wk.setAttribute('y1', ymx); wk.setAttribute('y2', ymn); wk.setAttribute('stroke', grp.color); wk.setAttribute('stroke-width', bigFmt ? 1.6 : 1); wk.setAttribute('stroke-opacity', 0.7); g.appendChild(wk);
      // caja q1-q3
      const box = al_el('rect'); box.setAttribute('x', cx - bw / 2); box.setAttribute('y', yb3); box.setAttribute('width', bw); box.setAttribute('height', Math.max(1, yb1 - yb3)); box.setAttribute('fill', grp.color); box.setAttribute('fill-opacity', 0.32); box.setAttribute('stroke', grp.color); box.setAttribute('stroke-width', bigFmt ? 1.6 : 1); g.appendChild(box);
      // mediana
      const me = al_el('line'); me.setAttribute('x1', cx - bw / 2); me.setAttribute('x2', cx + bw / 2); me.setAttribute('y1', ymd); me.setAttribute('y2', ymd); me.setAttribute('stroke', grp.color); me.setAttribute('stroke-width', bigFmt ? 2.6 : 1.8); g.appendChild(me);
      if (!isPngFormat && tooltip && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
        const hit = al_el('rect'); hit.setAttribute('x', cx - bw / 2 - 2); hit.setAttribute('y', ymx); hit.setAttribute('width', bw + 4); hit.setAttribute('height', Math.max(2, ymn - ymx)); hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
        hit.addEventListener('mouseenter', () => { tooltip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${grp.label} · ${yr}</div>mediana <strong>${md} cm</strong><br><span style="color:var(--ink-muted);">${mn}–${mx} cm (mín–máx)</span>`; tooltip.style.display = 'block'; tooltip.style.opacity = '1'; });
        hit.addEventListener('mousemove', (ev) => { const rc = svg.getBoundingClientRect(); tooltip.style.left = (ev.clientX - rc.left + 14) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; });
        hit.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; });
        g.appendChild(hit);
      }
    });
  });
  // leyenda de grupos (chips de color) cuando hay más de uno
  if (groups.length > 1) {
    const lg = al_el('g'); svg.appendChild(lg); let lx = AL_MARGIN.left + 4; const ly = AL_MARGIN.top + (bigFmt ? 4 : 2); const fs = SIZES.label * 0.86;
    groups.forEach(grp => {
      const sw = al_el('rect'); sw.setAttribute('x', lx); sw.setAttribute('y', ly); sw.setAttribute('width', fs * 0.8); sw.setAttribute('height', fs * 0.8); sw.setAttribute('fill', grp.color); sw.setAttribute('rx', 2); lg.appendChild(sw);
      const tx = al_el('text'); tx.setAttribute('x', lx + fs); tx.setAttribute('y', ly + fs * 0.8); tx.style.fontSize = fs + 'px'; tx.style.fontFamily = 'var(--sans)'; tx.setAttribute('font-weight', 600); tx.setAttribute('fill', grp.color); tx.textContent = grp.label; lg.appendChild(tx);
      lx += fs + al_measureText(grp.label, fs, 600) + fs * 1.1;
    });
  }
}

//------------------------------------------------------------------
//  Hover (líneas)
//------------------------------------------------------------------
function al_setupHover(svg, ctx) {
  const { y0, y1, xS, yS, series } = ctx;
  const tooltip = document.getElementById('tooltip10');
  const wcYears = al_years.filter(y => y >= y0 && y <= y1);
  const plotBottom = AL_MARGIN.top + (AL_H - AL_MARGIN.top - AL_MARGIN.bottom);
  const hoverG = al_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = al_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', AL_MARGIN.top); vline.setAttribute('y2', plotBottom); hoverG.appendChild(vline);
  const cap = al_el('rect'); cap.setAttribute('x', AL_MARGIN.left); cap.setAttribute('y', AL_MARGIN.top); cap.setAttribute('width', AL_W - AL_MARGIN.left - AL_MARGIN.right); cap.setAttribute('height', AL_H - AL_MARGIN.top - AL_MARGIN.bottom); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function nearest(px) { let best = wcYears[0], bd = Infinity; wcYears.forEach(y => { const d = Math.abs(xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; }
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => { const p = s.pts.find(q => q[0] === year); if (!p) return; const c = al_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 4); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c); rows.push({ label: s.label, color: s.color, v: p[1] }); });
    if (tooltip && rows.length) {
      rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v} cm</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  const moveH = (ev) => { const rc = svg.getBoundingClientRect(); const sc = rc.width / AL_W; const lx = (ev.clientX - rc.left) / sc; if (lx < AL_MARGIN.left || lx > AL_W - AL_MARGIN.right) { update(null); return; } update(nearest(lx)); if (tooltip) { tooltip.style.left = (ev.clientX - rc.left + 14) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; } };
  const leaveH = () => update(null);
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', leaveH);
  svg.__alHoverMove = moveH; svg.__alHoverLeave = leaveH;
}
function al_clearHover(svg) {
  if (svg.__alHoverMove) { svg.removeEventListener('mousemove', svg.__alHoverMove); svg.__alHoverMove = null; }
  if (svg.__alHoverLeave) { svg.removeEventListener('mouseleave', svg.__alHoverLeave); svg.__alHoverLeave = null; }
  const tt = document.getElementById('tooltip10'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }
}

//==================================================================
//  Subtítulo dinámico + headings
//==================================================================
function al_periodPhrase(en) {
  const p = (state[10] && state[10].period) || [AL_YEAR_MIN, AL_YEAR_MAX];
  if (p[0] <= AL_YEAR_MIN && p[1] >= AL_YEAR_MAX) return en ? 'across every World Cup (1930–2026)' : 'en cada Mundial (1930-2026)';
  return en ? `in the World Cups between ${p[0]} and ${p[1]}` : `en los Mundiales entre ${p[0]} y ${p[1]}`;
}
function al_subtitle() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), G = al_group(), box = al_mode() === 'box', per = al_periodPhrase(en);
  if (box) return en ? `Distribution of player height ${per}.` : `Distribución de la altura de los jugadores ${per}.`;
  if (G === 'pos') return en ? `Average player height by position ${per}.` : `Altura promedio de los jugadores por puesto ${per}.`;
  if (G === 'team') return en ? `Average height of the selected teams' players ${per}.` : `Altura promedio de los jugadores de las selecciones elegidas ${per}.`;
  if (al_vsCountry()) return en ? `Average height of World Cup players vs. the average man of their birth country and cohort, ${per}.` : `Altura promedio de los mundialistas vs. el varón promedio de su país de nacimiento y generación, ${per}.`;
  return en ? `Average height of World Cup players ${per}.` : `Altura promedio de los mundialistas ${per}.`;
}
function al_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="10"]') || document;
  const titleEl = block.querySelector('.chart-title'); if (titleEl) titleEl.textContent = al_tt('c10-title', 'Los mundialistas son cada vez más altos');
  const subEl = block.querySelector('.chart-subtitle'); if (subEl) subEl.textContent = al_subtitle();
}

//==================================================================
//  Chips + buscador + toggles
//==================================================================
function al_renderChips() {
  const c = document.getElementById('al-selected-chips'); if (!c) return;
  c.innerHTML = '';
  if (al_group() !== 'team') return;
  Array.from(al_selMap().keys()).forEach(code => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip'; chip.style.background = al_getColor(code); chip.style.color = '#fff'; chip.textContent = al_teamName(code);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×'; x.addEventListener('click', () => al_toggleTeam(code)); chip.appendChild(x); c.appendChild(chip);
  });
}
function al_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupAlturaSearch() {
  const input = document.getElementById('al-search'), results = document.getElementById('al-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => Object.keys(al_teams || {}).map(code => ({ code, name: al_teamName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  function get(q) { if (!q) return []; const qn = al_norm(q); return all().filter(c => al_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${al_selMap().has(c.code) ? ' m-already' : ''}" data-code="${c.code}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => el.addEventListener('click', () => { al_toggleTeam(el.dataset.code); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); al_toggleTeam(matches[active].code); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
function setupAlturaSegToggle(ids, getCur, setCur) {
  const B = {}; ids.forEach(id => B[id] = document.getElementById('al-' + id));
  if (Object.values(B).some(x => !x)) return;
  function sync() { ids.forEach(id => { const on = getCur() === id.split('-').pop(); B[id].classList.toggle('lg-seg-on', on); B[id].setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  ids.forEach(id => B[id].addEventListener('click', () => { const v = id.split('-').pop(); if (getCur() === v) return; setCur(v); sync(); al_renderChips(); drawAltura(); }));
  sync();
}
function setupAlturaToggles() {
  // Forma: línea / box
  setupAlturaSegToggle(['mode-line', 'mode-box'], () => state[10].mode, v => state[10].mode = v);
  // Desglose: total / pos / team
  setupAlturaSegToggle(['group-total', 'group-pos', 'group-team'], () => state[10].group, v => {
    state[10].group = v;
    if (v === 'team' && al_selMap().size === 0) AL_BIG.forEach((c, i) => { if (al_teams[c]) al_selMap().set(c, i); });
  });
  // vs país (toggle simple)
  const vs = document.getElementById('al-vscountry');
  if (vs) { const sync = () => { vs.classList.toggle('lg-seg-on', al_vsCountry()); vs.setAttribute('aria-pressed', al_vsCountry() ? 'true' : 'false'); }; vs.addEventListener('click', () => { state[10].vsCountry = !al_vsCountry(); sync(); drawAltura(); }); sync(); }
}
function setupAlturaSlider() {
  setupWcRangeSlider({ fromId: 'al-slider-from', toId: 'al-slider-to', dispId: 'al-range-display', trackId: 'al-range-track-active', years: al_years, get: () => state[10].period, set: (p) => { state[10].period = p; }, onChange: () => drawAltura() });
}
function setupAlturaCSV() {
  document.querySelectorAll('button.download[data-chart="10-csv"]').forEach(btn => btn.addEventListener('click', () => {
    al_initData();
    let csv = 'year,grupo,n,altura_real,altura_esperada,min,q1,mediana,q3,max\n';
    const row = (yr, label, d) => { if (!d) return; csv += `${yr},${label},${d.n || ''},${d.act != null ? d.act : ''},${d.exp != null ? d.exp : ''},${d.box ? d.box.join(',') : ',,,,'}\n`; };
    al_years.forEach(y => row(y, 'Total', al_overall[String(y)]));
    Object.keys(al_positions).forEach(p => al_years.forEach(y => row(y, 'pos:' + p, al_positions[p][String(y)])));
    Object.keys(al_teams).forEach(tc => al_years.forEach(y => row(y, 'team:' + tc, al_teams[tc][String(y)])));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'el-atlas-03-altura-mundialistas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function initAltura() {
  al_initData();
  if (!state[10]) state[10] = {};
  if (!state[10].period) state[10].period = [AL_YEAR_MIN, AL_YEAR_MAX];
  if (!state[10].mode) state[10].mode = 'line';
  if (!state[10].group) state[10].group = 'total';
  if (state[10].vsCountry == null) state[10].vsCountry = true;
  if (!(state[10].selectedTeams instanceof Map)) state[10].selectedTeams = new Map(state[10].selectedTeams || []);

  drawAltura();
  setupAlturaSlider();
  setupAlturaSearch();
  setupAlturaToggles();
  setupAlturaCSV();
  al_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initAltura._wired) { initAltura._wired = true; window.addEventListener('atlas-editor-change', () => drawAltura()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawAltura;
  window.onBeforePngExportGetSourceText = function (chartId) { return (String(chartId) === '10') ? ((typeof t === 'function' ? t('c10-sources-tpl') : '') || null) : null; };
  window.onBeforePngExportGetSubtitle = function (chartId) { return (String(chartId) === '10') ? al_subtitle() : null; };
}
