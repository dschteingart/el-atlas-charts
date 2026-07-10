// =============================================================
//  El Atlas N°3 — Chart 12: evolución de la EDAD de los mundialistas
// =============================================================
// ¿Los planteles mundialistas envejecen? ¿Qué puesto es el más veterano?
// Clon (reducido) del chart de altura: SIN la capa "real vs esperada" (no existe
// una "edad esperada" de la población) ni el scatter. Controles:
//   - Forma: Líneas (edad promedio) ↔ Distribución (boxplot por Mundial) ↔ Barras.
//   - Buscador de selecciones (siempre): vacío = Total (todas); o agregás una/varias.
//   - Por puesto: arquero / defensor / medio / delantero.
// En Distribución se muestra UNA sola caja por Mundial (Total, o una selección,
// o un puesto): comparar muchas cajas a la vez no se lee.
// Datos: EDAD (data-edad.js). Mobile-first PNG (cuadrado) — ver skill graficos-atlas.

//==================================================================
//  Constantes
//==================================================================
const ED_REAL = '#BE5D32';            // el «Mundial» (promedio de todos) — terracota Atlas
const ED_POS_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
const ED_POS_COL = { GK: '#C9A227', DEF: '#2B5C8A', MID: '#5BA152', FWD: '#9A4FA8' };
const ED_POS_NAME = {
  GK: ['Arqueros', 'Goalkeepers'], DEF: ['Defensores', 'Defenders'],
  MID: ['Mediocampistas', 'Midfielders'], FWD: ['Delanteros', 'Forwards']
};
// El Mundial (referencia) es terracota (ED_REAL); la paleta de países EVITA los
// rojos/terracotas al principio para que el primer país agregado no se confunda.
const ED_PALETTE = [
  '#2B5C8A', '#5BA152', '#9A4FA8', '#2BA0A8', '#C9A227', '#1B3956',
  '#386433', '#5F3168', '#1B6368', '#7D6418', '#C0473A', '#772C24'
];
// Unidad de edad para tooltips/labels (el eje lleva la unidad por i18n).
function ed_unit() { return (typeof LANG !== 'undefined' && LANG === 'en') ? 'yrs' : 'años'; }
function ed_colorForSlot(s) { return ED_PALETTE[s % ED_PALETTE.length]; }
const ED_BIG = ['ARG', 'BRA', 'DEU', 'NLD', 'ESP'];   // (team_code = ISO3)
const ED_WORLD = '_WORLD';   // "selección" especial = promedio de TODOS los mundialistas (seleccionable como un país más)
const ED_BAR_COL = '#5E7E96';   // azul neutro para las barras de un Mundial
// Potencias futbolísticas: siempre se muestran en el ranking de barras aunque no
// estén en el top/bottom 3 (team_code = ISO3; ENG por el split del Reino Unido).
const ED_IMPORTANT = ['BRA', 'ARG', 'DEU', 'FRA', 'ENG', 'ITA', 'ESP', 'NLD', 'URY', 'PRT', 'BEL', 'MEX'];

const ED_W_DESKTOP = 1100, ED_H_DESKTOP = 520;
const ED_W_MOBILE = 1100, ED_H_MOBILE = 1000;
const ED_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 60 };
const ED_MARGIN_MOBILE = { top: 64, right: 168, bottom: 150, left: 96 };
function ed_getMargins(format) {
  switch (format) {
    case 'public': return { top: 40, right: 168, bottom: 92, left: 74 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96, left: 104 };
    case 'square': return { top: 44, right: 184, bottom: 74, left: 104 };
    case 'mobile': return { top: 64, right: 176, bottom: 150, left: 110 };
    default: return { ...ED_MARGIN_DESKTOP };
  }
}
let ED_W = ED_W_DESKTOP, ED_H = ED_H_DESKTOP, ED_MARGIN = { ...ED_MARGIN_DESKTOP };
const ED_NS = 'http://www.w3.org/2000/svg';
const ed_el = (t) => document.createElementNS(ED_NS, t);
const ED_YEAR_MIN = 1930, ED_YEAR_MAX = 2026;

//==================================================================
//  Data
//==================================================================
let ed_years = null, ed_overall = null, ed_teams = null, ed_positions = null, ed_teamPos = null, ed_teamNames = null;
function ed_initData() {
  if (ed_overall) return;
  if (typeof EDAD === 'undefined') { console.error('[edad] EDAD no cargado'); ed_years = []; ed_overall = {}; ed_teams = {}; ed_positions = {}; ed_teamPos = {}; ed_teamNames = {}; return; }
  ed_years = EDAD.years.slice();
  ed_overall = EDAD.overall; ed_teams = EDAD.teams; ed_positions = EDAD.positions; ed_teamPos = EDAD.teamPos || {};
  ed_teamNames = EDAD.teamNames;
}
function ed_teamPosSeries(country, p) { const o = ed_teamPos[country] && ed_teamPos[country][p]; if (!o) return []; const r = []; (ed_years || []).forEach(y => { const v = o[String(y)]; if (v != null) r.push([y, v]); }); return r; }
function ed_mode() { return (state[12] && state[12].mode) || 'line'; }
function ed_byPos() { return !!(state[12] && state[12].byPos); }
function ed_boxPos() { return (state[12] && state[12].boxPos) || 'DEF'; }

//==================================================================
//  Helpers
//==================================================================
function ed_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function ed_measureText(text, size, weight) {
  if (!ed_measureText._c) ed_measureText._c = document.createElement('canvas').getContext('2d');
  ed_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return ed_measureText._c.measureText(text).width;
}
const ed_tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
// Ubica el tooltip junto al cursor, pero a la IZQUIERDA si no entra a la derecha
// (si no, contra el borde se comprime/deforma). Requiere el tooltip ya visible.
function ed_placeTip(tt, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = evClientX(ev) - rc.left, y = evClientY(ev) - rc.top, tw = tt.offsetWidth || 170;
  const left = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tt.style.left = left + 'px'; tt.style.top = (y + 14) + 'px';
}
function ed_teamName(code) { if (code === ED_WORLD) return ed_totalName(); const lang = (typeof LANG !== 'undefined') ? LANG : 'es'; const nm = ed_teamNames && ed_teamNames[code]; return nm ? (lang === 'en' ? nm[1] : nm[0]) : code; }
function ed_posName(p) { const lang = (typeof LANG !== 'undefined') ? LANG : 'es'; const nm = ED_POS_NAME[p]; return nm ? (lang === 'en' ? nm[1] : nm[0]) : p; }
function ed_totalName() { return ed_tt('c12-real', 'Mundialistas'); }
function ed_selMap() { if (!(state[12].selectedTeams instanceof Map)) state[12].selectedTeams = new Map(state[12].selectedTeams || []); return state[12].selectedTeams; }
function ed_getColor(code) { if (code === ED_WORLD) return ED_REAL; const s = ed_selMap().get(code); return s == null ? null : ed_colorForSlot(s); }
function ed_selTeams() { return Array.from(ed_selMap().keys()).filter(c => c === ED_WORLD || (ed_teams && ed_teams[c])); }
function ed_nextFreeSlot() { const u = new Set(Array.from(ed_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function ed_toggleTeam(code) {
  const sel = ed_selMap();
  if (ed_mode() === 'box' || (ed_byPos() && ed_mode() === 'line')) {   // distribución y "por puesto" (líneas): una sola; barras/dispersión/líneas: varias
    if (sel.has(code)) sel.clear(); else { sel.clear(); sel.set(code, 0); }
  } else {
    if (sel.has(code)) sel.delete(code); else sel.set(code, ed_nextFreeSlot());
  }
  ed_renderChips(); drawEdad();
}
function ed_seriesByYear(obj, field) { const r = []; (ed_years || []).forEach(y => { const d = obj[String(y)]; if (d && d[field] != null) r.push([y, d[field]]); }); return r; }
function ed_boxesByYear(obj) { const r = []; (ed_years || []).forEach(y => { const d = obj[String(y)]; if (d && d.box) r.push([y].concat(d.box)); }); return r; }
function ed_xTicks(y0, y1, plotW, minGapPx) {
  const ys = (ed_years || []).filter(y => y >= y0 && y <= y1);
  if (!ys.length) return [];
  const xOf = (y) => ((y - y0) / (y1 - y0)) * plotW;
  const out = [ys[0]]; let lastX = xOf(ys[0]);
  for (let i = 1; i < ys.length - 1; i++) { const x = xOf(ys[i]); if (x - lastX >= minGapPx) { out.push(ys[i]); lastX = x; } }
  const last = ys[ys.length - 1];
  if (out[out.length - 1] !== last) { if (out.length > 1 && xOf(last) - lastX < minGapPx) out.pop(); out.push(last); }
  return out;
}
// Paso "lindo" según el rango: en líneas (promedios ~24-29) el span es chico → 1
// año; en distribución (jugadores individuales, ~17-45) el span es grande → 5.
function ed_yScale(min, max) {
  const span = max - min, step = span > 16 ? 5 : span > 7 ? 2 : 1;
  let lo = Math.floor((min - step * 0.4) / step) * step;
  let hi = Math.ceil((max + step * 0.4) / step) * step;
  if (hi - lo < step * 2) hi = lo + step * 2;
  const ticks = []; for (let v = lo; v <= hi + 0.001; v += step) ticks.push(v);
  return { min: lo, max: hi, ticks };
}

//==================================================================
//  Construcción de series según los controles
//==================================================================
// Líneas: lista de { label, color, pts:[[year,val]], dashed, faint }
function ed_lineSeries() {
  ed_initData(); const out = [];
  if (ed_byPos()) {
    const country = ed_selTeams().find(c => c !== ED_WORLD);   // primer país elegido; si no hay, Mundial (overall)
    ED_POS_ORDER.forEach(p => {
      const pts = country ? ed_teamPosSeries(country, p) : (ed_positions[p] ? ed_seriesByYear(ed_positions[p], 'act') : []);
      if (pts.length) out.push({ label: ed_posName(p), color: ED_POS_COL[p], pts, key: 'P_' + p });
    });
    return out;
  }
  let sel = ed_selTeams(); if (!sel.length) sel = [ED_WORLD];
  sel.forEach(code => {
    const isW = code === ED_WORLD, o = isW ? ed_overall : ed_teams[code], col = isW ? ED_REAL : ed_getColor(code);
    out.push({ label: ed_teamName(code), color: col, pts: ed_seriesByYear(o, 'act'), key: code });
  });
  return out;
}
// Distribución: UNA sola caja por año. Devuelve { label, color, boxes:[[year,mn,q1,md,q3,mx]] }
function ed_boxOne() {
  ed_initData();
  if (ed_byPos()) { const p = ed_boxPos(), o = ed_positions[p]; return { label: ed_posName(p), color: ED_POS_COL[p], boxes: o ? ed_boxesByYear(o) : [] }; }
  const sel = ed_selTeams(); const code = sel[0] || ED_WORLD, isW = code === ED_WORLD;
  return { label: ed_teamName(code), color: isW ? ED_REAL : ed_getColor(code), boxes: ed_boxesByYear(isW ? ed_overall : ed_teams[code]) };
}

// Barras: ranking de selecciones de UN Mundial. pos='all' → edad del plantel;
// si no, la del puesto. Default = top 3 más altas + bottom 3 + hasta 5 potencias.
function ed_barPos() { return (state[12] && state[12].barPos) || 'all'; }
function ed_barRows(wc, pos) {
  ed_initData(); const rows = [];
  Object.keys(ed_teams).forEach(code => {
    let v = null;
    if (pos === 'all') { const d = ed_teams[code][String(wc)]; v = d && d.act != null ? d.act : null; }
    else { const o = ed_teamPos[code] && ed_teamPos[code][pos]; v = o ? o[String(wc)] : null; }
    if (v != null) rows.push({ code, v });
  });
  rows.sort((a, b) => b.v - a.v || a.code.localeCompare(b.code));
  return rows;
}
function ed_barDefault(wc, pos) {
  const rows = ed_barRows(wc, pos);
  if (!rows.length) return [];
  const sel = ed_selTeams().filter(c => c !== ED_WORLD && rows.find(r => r.code === c));   // selecciones agregadas a mano
  if (rows.length <= 11 && !sel.length) return rows;
  const top = rows.slice(0, 3), bottom = rows.slice(-3);
  const chosen = new Set(top.concat(bottom).map(r => r.code)), out = top.concat(bottom);
  let imp = 0;
  for (const c of ED_IMPORTANT) { if (imp >= 5) break; if (chosen.has(c)) continue; const r = rows.find(x => x.code === c); if (r) { out.push(r); chosen.add(c); imp++; } }
  sel.forEach(c => { if (!chosen.has(c)) { out.push(rows.find(r => r.code === c)); chosen.add(c); } });   // + las elegidas a mano
  return out.sort((a, b) => b.v - a.v);
}

//==================================================================
//  DRAW
//==================================================================
function drawEdad() {
  const svg = document.getElementById('chart12'); if (!svg) return;
  svg.innerHTML = ''; ed_clearHover(svg); ed_initData();

  // visibilidad de controles
  const box = ed_mode() === 'box', bar = ed_mode() === 'bar';
  const viewBtn = document.getElementById('ed-view-sel'); if (viewBtn) { const g = viewBtn.closest('.lg-mode'); if (g) g.style.display = bar ? 'none' : ''; }   // desglose: oculto en barras
  const wrap = document.getElementById('ed-search-wrap'); if (wrap) wrap.style.display = '';     // buscador siempre (en barras agrega/marca selecciones)
  const chipsEl = document.getElementById('ed-selected-chips'); if (chipsEl) chipsEl.style.display = '';
  const posSel = document.getElementById('ed-boxpos'); if (posSel) posSel.style.display = (box && ed_byPos()) ? '' : 'none';   // selector de puesto único, solo en box+puesto
  const barSel = document.getElementById('ed-barpos'); if (barSel) barSel.style.display = bar ? '' : 'none';                  // selector de puesto del ranking, solo en barras
  const hint = document.getElementById('ed-hint');   // solo en Líneas (en distribución/barras no se compara contra el Mundial)
  if (hint) { const onlyWorld = ed_mode() === 'line' && !ed_byPos() && ed_selTeams().filter(c => c !== ED_WORLD).length === 0; hint.style.display = onlyWorld ? '' : 'none'; }
  // En barras el slider elige UN Mundial → un solo thumb.
  const sliderEl = document.getElementById('ed-range-slider'); if (sliderEl) sliderEl.classList.toggle('s-range-single', bar);

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && ed_isMobile();
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; ED_W = f.vbW; ED_H = square ? 910 : newsletter ? 860 : f.vbH; ED_MARGIN = ed_getMargins(editorFormat); }
  else if (mobile) { ED_W = ED_W_MOBILE; ED_H = ED_H_MOBILE; ED_MARGIN = { ...ED_MARGIN_MOBILE }; }
  else { ED_W = ED_W_DESKTOP; ED_H = ED_H_DESKTOP; ED_MARGIN = { ...ED_MARGIN_DESKTOP }; }
  let PLOT_W = ED_W - ED_MARGIN.left - ED_MARGIN.right;
  const PLOT_H = ED_H - ED_MARGIN.top - ED_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${ED_W} ${ED_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const period = (state[12] && state[12].period) || [ED_YEAR_MIN, ED_YEAR_MAX];
  const y0 = period[0], y1 = period[1];
  const inP = (pts) => pts.filter(p => p[0] >= y0 && p[0] <= y1);

  // Barras: ranking de selecciones de UN Mundial (el extremo derecho del slider).
  if (bar) { ed_drawBars(svg, { wc: y1, pos: ed_barPos(), bigFmt, isPngFormat }); ed_applyHeadings(); return; }

  const lineSeries = box ? [] : ed_lineSeries();
  const boxOne = box ? ed_boxOne() : null;
  let vmin = Infinity, vmax = -Infinity;
  if (box) inP(boxOne.boxes).forEach(b => { if (b[1] < vmin) vmin = b[1]; if (b[5] > vmax) vmax = b[5]; });
  else lineSeries.forEach(s => inP(s.pts).forEach(p => { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; }));
  if (!isFinite(vmin)) { vmin = 24; vmax = 30; }
  const yScale = ed_yScale(vmin, vmax);

  if (!box) {
    // Las etiquetas de fin de línea se parten en 2 renglones si son largas, para
    // que el margen derecho no se coma el gráfico (presupuesto ~28% del ancho).
    // Cada serie guarda sus renglones en s._wrap; el margen sale del renglón más
    // ancho. El valor (PNG) va pegado al final del texto.
    const labelOffset = bigFmt ? 12 : 6, fw = bigFmt ? 700 : 600;
    const budget = ED_W * (bigFmt ? 0.27 : 0.31);   // ancho máximo por renglón
    let maxLineW = 0;
    lineSeries.filter(s => s.label).forEach(s => {
      const lv = (s.pts.filter(p => p[0] >= y0 && p[0] <= y1).slice(-1)[0] || [])[1];
      const disp = s.label + (isPngFormat && lv != null ? '  ' + lv : '');
      s._wrap = ed_wrapLabel(disp, budget, SIZES.label, fw);
      s._wrap.forEach(ln => { const w = ed_measureText(ln, SIZES.label, fw); if (w > maxLineW) maxLineW = w; });
    });
    ED_MARGIN.right = Math.min(Math.round(ED_W * 0.34), Math.max(ED_MARGIN.right, labelOffset + maxLineW + (bigFmt ? 16 : 8)));
    PLOT_W = ED_W - ED_MARGIN.left - ED_MARGIN.right;
  }
  // En distribución, inset horizontal para que la primera/última caja no se
  // pisen con el eje Y ni el borde derecho (las líneas sí pueden tocar el borde).
  const xInset = box ? (bigFmt ? 30 : 18) : 0;
  const xS = (yr) => ED_MARGIN.left + xInset + ((yr - y0) / (y1 - y0 || 1)) * (PLOT_W - 2 * xInset);
  const yS = (v) => ED_MARGIN.top + PLOT_H - ((v - yScale.min) / (yScale.max - yScale.min)) * PLOT_H;

  // grid + eje X
  ed_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = ed_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', ED_MARGIN.top); gl.setAttribute('y2', ED_MARGIN.top + PLOT_H); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = ed_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', ED_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18)); lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y (años)
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = ed_el('line'); gl.setAttribute('x1', ED_MARGIN.left); gl.setAttribute('x2', ED_MARGIN.left + PLOT_W); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = ed_el('text'); lbl.setAttribute('x', ED_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4)); lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = v; svg.appendChild(lbl);
  });
  const yT = ed_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${ED_MARGIN.left - (mobile || mobilePng ? 80 : bigFmt ? 74 : 42)}, ${ED_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = ed_tt('c12-axis-y', 'Edad (años)'); svg.appendChild(yT);

  if (box) ed_drawBox(svg, boxOne, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES });
  else ed_drawLines(svg, lineSeries, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP });

  ed_applyHeadings();
}

// Parte una etiqueta larga en hasta 2 renglones que entren en maxW (greedy por
// palabras). Si entra en uno, devuelve un solo renglón. El valor (PNG) viaja
// pegado al final del texto, así cae naturalmente en el 2º renglón.
function ed_wrapLabel(text, maxW, fs, fw) {
  if (ed_measureText(text, fs, fw) <= maxW) return [text];
  const words = String(text).split(' ');
  if (words.length < 2) return [text];
  let l1 = '', i = 0;
  for (; i < words.length; i++) {
    const test = l1 ? l1 + ' ' + words[i] : words[i];
    if (!l1 || ed_measureText(test, fs, fw) <= maxW) l1 = test; else break;
  }
  const l2 = words.slice(i).join(' ');
  return l2 ? [l1, l2] : [l1];
}

//------------------------------------------------------------------
//  Modo LÍNEAS
//------------------------------------------------------------------
function ed_drawLines(svg, series, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP } = ctx;
  const interactive = !isPngFormat;   // en touch los handlers se cablean igual (tap → tooltip)
  const halosG = ed_el('g'); svg.appendChild(halosG);
  const linesG = ed_el('g'); svg.appendChild(linesG);
  const dotsG = ed_el('g'); svg.appendChild(dotsG);
  const hitG = ed_el('g'); svg.appendChild(hitG);   // áreas invisibles para resaltar al pasar el mouse
  const endLabels = [], hoverSeries = [];
  series.forEach(s => {
    const pts = inP(s.pts); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
    const halo = ed_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); if (s.key) halo.setAttribute('data-al', s.key); halosG.appendChild(halo);
    const path = ed_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', s.dashed ? lineW * 0.85 : lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (s.dashed) path.setAttribute('stroke-dasharray', bigFmt ? '2 7' : '1 4');
    if (s.key) path.setAttribute('data-al', s.key);
    linesG.appendChild(path);
    if (!s.dashed) pts.forEach(p => { const c = ed_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); if (s.key) c.setAttribute('data-al', s.key); dotsG.appendChild(c); });
    // área de hover ancha e invisible: al entrar, el resto de las líneas se atenúa
    if (interactive && s.key) {
      const hit = ed_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 10, 12)); hit.setAttribute('stroke-linejoin', 'round'); hit.setAttribute('stroke-linecap', 'round'); hit.style.pointerEvents = 'stroke'; hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => ed_emph(svg, s.key));
      hit.addEventListener('mouseleave', () => ed_emph(svg, null));
      hitG.appendChild(hit);
    }
    const last = pts[pts.length - 1];
    if (s.label) endLabels.push({ label: s.label, lines: s._wrap, color: s.color, idealY: yS(last[1]), x: xS(y1), valLast: last[1], key: s.key });
    hoverSeries.push({ label: s.label || '', color: s.color, pts });
  });
  // anti-colisión de las etiquetas de fin de línea contemplando su ALTO (1 o 2
  // renglones): el gap entre dos vecinas es la semisuma de sus altos + un padding.
  const lineH = SIZES.label * (bigFmt ? 1.16 : 1.22), padY = bigFmt ? 6 : 4;
  endLabels.forEach(l => { l.n = (l.lines && l.lines.length) || 1; l.h = l.n * lineH; });
  const topB = ED_MARGIN.top + (bigFmt ? 6 : 2), botB = ED_MARGIN.top + (ED_H - ED_MARGIN.top - ED_MARGIN.bottom);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    const minY = topB + l.h / 2;
    l.y = (i === 0) ? Math.max(l.idealY, minY) : Math.max(l.idealY, endLabels[i - 1].y + (endLabels[i - 1].h + l.h) / 2 + padY);
  });
  if (endLabels.length) {
    const last = endLabels[endLabels.length - 1], maxY = botB - last.h / 2;
    if (last.y > maxY) { last.y = maxY; for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - (endLabels[i].h + endLabels[i + 1].h) / 2 - padY); }
  }
  const endG = ed_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    l.y = Math.max(l.y, topB + l.h / 2);
    const lines = (l.lines && l.lines.length) ? l.lines : [l.label + (isPngFormat ? '  ' + Math.round(l.valLast) : '')];
    if (Math.abs(l.y - l.idealY) > 1.5) { const g = ed_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y); g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); if (l.key) g.setAttribute('data-al', l.key); endG.appendChild(g); }
    const x = l.x + (bigFmt ? 12 : 6), baseAdj = bigFmt ? 8 : 4;
    lines.forEach((ln, k) => {
      const txt = ed_el('text'); txt.setAttribute('x', x); txt.setAttribute('y', l.y + (k - (lines.length - 1) / 2) * lineH + baseAdj); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
      txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
      txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
      if (l.key) txt.setAttribute('data-al', l.key);
      txt.textContent = ln; endG.appendChild(txt);
    });
  });
  if (!isPngFormat && hoverSeries.length) ed_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries });
}
// Resalte: al pasar el mouse por una línea, las demás se atenúan. Las parejas
// real/esperada comparten data-al (= código de selección), así se resaltan juntas.
// Norma general de los gráficos del Atlas salvo pedido en contra.
function ed_emph(svg, key) {
  if (!svg) return;
  svg.querySelectorAll('[data-al]').forEach(el => {
    el.style.opacity = (key == null || el.getAttribute('data-al') === key) ? '' : '0.14';
  });
}

//------------------------------------------------------------------
//  Modo DISTRIBUCIÓN — UNA caja por Mundial
//------------------------------------------------------------------
function ed_drawBox(svg, grp, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES } = ctx;
  const yrs = (ed_years || []).filter(y => y >= y0 && y <= y1);
  const slot = yrs.length > 1 ? (xS(yrs[1]) - xS(yrs[0])) : (ED_W - ED_MARGIN.left - ED_MARGIN.right);
  const bw = Math.max(4, Math.min(bigFmt ? 40 : 22, slot * 0.66));
  const g = ed_el('g'); svg.appendChild(g);
  const tooltip = document.getElementById('tooltip12');
  const tMed = ed_tt('c12-box-median', 'mediana'), tRange = ed_tt('c12-box-range', 'mín–máx');
  grp.boxes.filter(b => b[0] >= y0 && b[0] <= y1).forEach(b => {
    const [yr, mn, q1, md, q3, mx] = b; const cx = xS(yr);
    const yb1 = yS(q1), yb3 = yS(q3), ymd = yS(md), ymn = yS(mn), ymx = yS(mx);
    const wk = ed_el('line'); wk.setAttribute('x1', cx); wk.setAttribute('x2', cx); wk.setAttribute('y1', ymx); wk.setAttribute('y2', ymn); wk.setAttribute('stroke', grp.color); wk.setAttribute('stroke-width', bigFmt ? 1.8 : 1.1); wk.setAttribute('stroke-opacity', 0.7); g.appendChild(wk);
    // bigotes con tope horizontal
    [ymn, ymx].forEach(yy => { const cap = ed_el('line'); cap.setAttribute('x1', cx - bw * 0.22); cap.setAttribute('x2', cx + bw * 0.22); cap.setAttribute('y1', yy); cap.setAttribute('y2', yy); cap.setAttribute('stroke', grp.color); cap.setAttribute('stroke-width', bigFmt ? 1.6 : 1); cap.setAttribute('stroke-opacity', 0.7); g.appendChild(cap); });
    const rect = ed_el('rect'); rect.setAttribute('x', cx - bw / 2); rect.setAttribute('y', yb3); rect.setAttribute('width', bw); rect.setAttribute('height', Math.max(1, yb1 - yb3)); rect.setAttribute('fill', grp.color); rect.setAttribute('fill-opacity', 0.32); rect.setAttribute('stroke', grp.color); rect.setAttribute('stroke-width', bigFmt ? 1.8 : 1.1); rect.setAttribute('rx', 2); g.appendChild(rect);
    const me = ed_el('line'); me.setAttribute('x1', cx - bw / 2); me.setAttribute('x2', cx + bw / 2); me.setAttribute('y1', ymd); me.setAttribute('y2', ymd); me.setAttribute('stroke', grp.color); me.setAttribute('stroke-width', bigFmt ? 3 : 2); g.appendChild(me);
    if (!isPngFormat && tooltip) {
      const hit = ed_el('rect'); hit.setAttribute('x', cx - bw / 2 - 2); hit.setAttribute('y', ymx); hit.setAttribute('width', bw + 4); hit.setAttribute('height', Math.max(2, ymn - ymx)); hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', (ev) => { tooltip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${grp.label} · ${yr}</div>${tMed} <strong>${md} ${ed_unit()}</strong><br><span style="color:var(--ink-muted);">${mn}–${mx} ${ed_unit()} (${tRange})</span>`; tooltip.style.display = 'block'; tooltip.style.opacity = '1'; ed_placeTip(tooltip, ev, svg); });
      hit.addEventListener('mousemove', (ev) => ed_placeTip(tooltip, ev, svg));
      hit.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; });
      g.appendChild(hit);
    }
  });
  // etiqueta del grupo (qué se está mostrando), arriba a la izquierda
  const lbl = ed_el('text'); lbl.setAttribute('x', ED_MARGIN.left + 4); lbl.setAttribute('y', ED_MARGIN.top + (bigFmt ? 22 : 13)); lbl.style.fontSize = SIZES.label + 'px'; lbl.style.fontFamily = 'var(--sans)'; lbl.setAttribute('font-weight', bigFmt ? 700 : 600); lbl.setAttribute('fill', grp.color); lbl.textContent = grp.label; svg.appendChild(lbl);
}

//------------------------------------------------------------------
//  Modo BARRAS — ranking de selecciones para UN Mundial
//------------------------------------------------------------------
function ed_drawBars(svg, opt) {
  const { wc, pos, bigFmt } = opt;
  const rows = ed_barDefault(wc, pos);
  const col = pos === 'all' ? ED_BAR_COL : ED_POS_COL[pos];
  if (!rows.length) { const m = ed_el('text'); m.setAttribute('x', ED_W / 2); m.setAttribute('y', ED_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (bigFmt ? 24 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = ed_tt('c12-bar-empty', 'Sin datos para este Mundial.'); svg.appendChild(m); return; }
  const fs = bigFmt ? 23 : 12.5;
  const top = ED_MARGIN.top + (bigFmt ? 26 : 16), bottom = bigFmt ? 24 : 12;
  let nameW = 0; rows.forEach(r => { const w = ed_measureText(ed_teamName(r.code), fs, 600); if (w > nameW) nameW = w; });
  const valW = ed_measureText('45.0 ' + ed_unit(), fs, 700);
  const left = (bigFmt ? 18 : 12) + nameW + (bigFmt ? 16 : 10);
  const right = valW + (bigFmt ? 22 : 14);
  const plotW = Math.max(40, ED_W - left - right);
  const availH = ED_H - top - bottom;
  const rowH = rows.length ? Math.min(availH / rows.length, bigFmt ? 84 : 54) : 24;
  const barH = rowH * 0.58;
  const minV = Math.min(...rows.map(r => r.v)), maxV = Math.max(...rows.map(r => r.v));
  const base = Math.max(0, Math.floor(minV) - 2);                   // baseline (años) para que se note la diferencia
  const xW = (v) => Math.max(0, ((v - base) / Math.max(1, maxV * 1.005 - base)) * plotW);
  const yBase = (y) => y + fs * 0.34;
  rows.forEach((r, i) => {
    const cy = top + i * rowH, midY = cy + rowH / 2, bw = xW(r.v);
    const nm = ed_el('text'); nm.setAttribute('x', left - (bigFmt ? 12 : 8)); nm.setAttribute('y', yBase(midY)); nm.setAttribute('text-anchor', 'end'); nm.style.fontSize = fs + 'px'; nm.style.fontFamily = 'var(--sans)'; nm.style.fontWeight = '600'; nm.setAttribute('fill', 'var(--ink)'); nm.textContent = ed_teamName(r.code); svg.appendChild(nm);
    const bar = ed_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', midY - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', col); svg.appendChild(bar);
    const vt = ed_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', yBase(midY)); vt.style.fontSize = fs + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.setAttribute('fill', 'var(--ink)'); vt.style.fontVariantNumeric = 'tabular-nums'; vt.textContent = r.v + ' ' + ed_unit(); svg.appendChild(vt);
  });
  const disp = document.getElementById('ed-range-display'); if (disp) disp.textContent = wc;
}

//------------------------------------------------------------------
//  Hover (líneas)
//------------------------------------------------------------------
function ed_setupHover(svg, ctx) {
  const { y0, y1, xS, yS, series } = ctx;
  const tooltip = document.getElementById('tooltip12');
  const wcYears = ed_years.filter(y => y >= y0 && y <= y1);
  const plotBottom = ED_MARGIN.top + (ED_H - ED_MARGIN.top - ED_MARGIN.bottom);
  const hoverG = ed_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = ed_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', ED_MARGIN.top); vline.setAttribute('y2', plotBottom); hoverG.appendChild(vline);
  const cap = ed_el('rect'); cap.setAttribute('x', ED_MARGIN.left); cap.setAttribute('y', ED_MARGIN.top); cap.setAttribute('width', ED_W - ED_MARGIN.left - ED_MARGIN.right); cap.setAttribute('height', ED_H - ED_MARGIN.top - ED_MARGIN.bottom); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function nearest(px) { let best = wcYears[0], bd = Infinity; wcYears.forEach(y => { const d = Math.abs(xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; }
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => { const p = s.pts.find(q => q[0] === year); if (!p) return; const c = ed_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 4); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c); rows.push({ label: s.label, color: s.color, v: p[1] }); });
    if (tooltip && rows.length) {
      rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v} ${ed_unit()}</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  const moveH = (ev) => { const rc = svg.getBoundingClientRect(); const sc = rc.width / ED_W; const lx = (evClientX(ev) - rc.left) / sc; if (lx < ED_MARGIN.left || lx > ED_W - ED_MARGIN.right) { update(null); return; } update(nearest(lx)); if (tooltip) ed_placeTip(tooltip, ev, svg); };
  const leaveH = () => update(null);
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', leaveH);
  wireTouchScrub(svg, moveH);   // tap/arrastre con el dedo mueve el crosshair
  svg.__edHoverMove = moveH; svg.__edHoverLeave = leaveH;
}
function ed_clearHover(svg) {
  if (svg.__edHoverMove) { svg.removeEventListener('mousemove', svg.__edHoverMove); svg.__edHoverMove = null; }
  if (svg.__edHoverLeave) { svg.removeEventListener('mouseleave', svg.__edHoverLeave); svg.__edHoverLeave = null; }
  if (svg.__atlasTouchScrub) { svg.removeEventListener('touchstart', svg.__atlasTouchScrub); svg.removeEventListener('touchmove', svg.__atlasTouchScrub); svg.__atlasTouchScrub = null; }
  const tt = document.getElementById('tooltip12'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }
}

//==================================================================
//  Subtítulo dinámico + headings
//==================================================================
function ed_periodPhrase(en) {
  const p = (state[12] && state[12].period) || [ED_YEAR_MIN, ED_YEAR_MAX];
  if (p[0] <= ED_YEAR_MIN && p[1] >= ED_YEAR_MAX) return en ? 'across every World Cup (1930–2026)' : 'en cada Mundial (1930-2026)';
  return en ? `in the World Cups between ${p[0]} and ${p[1]}` : `en los Mundiales entre ${p[0]} y ${p[1]}`;
}
function ed_subtitle() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), box = ed_mode() === 'box', bar = ed_mode() === 'bar', per = ed_periodPhrase(en);
  const someTeams = !ed_byPos() && Array.from(ed_selMap().keys()).filter(c => ed_teams && ed_teams[c]).length > 0;
  if (bar) {
    const wc = ((state[12] && state[12].period) || [ED_YEAR_MIN, ED_YEAR_MAX])[1], pos = ed_barPos();
    if (pos !== 'all') return en ? `Average age of each team's ${ed_posName(pos).toLowerCase()} in the ${wc} World Cup.` : `Edad promedio de los ${ed_posName(pos).toLowerCase()} de cada selección en el Mundial ${wc}.`;
    return en ? `Average squad age by team in the ${wc} World Cup.` : `Edad promedio del plantel de cada selección en el Mundial ${wc}.`;
  }
  if (box) return en ? `Distribution of player age ${per}.` : `Distribución de la edad de los jugadores ${per}.`;
  if (ed_byPos()) {
    const country = ed_selTeams().find(c => c !== ED_WORLD);
    if (country) return en ? `Average age by position — ${ed_teamName(country)} ${per}.` : `Edad promedio por puesto — ${ed_teamName(country)} ${per}.`;
    return en ? `Average player age by position ${per}.` : `Edad promedio de los jugadores por puesto ${per}.`;
  }
  if (someTeams) return en ? `Average age of the selected teams' players ${per}.` : `Edad promedio de los jugadores de las selecciones elegidas ${per}.`;
  return en ? `Average age of World Cup players ${per}.` : `Edad promedio de los mundialistas ${per}.`;
}
// Título: insight por default SOLO en las vistas de serie histórica (líneas o
// distribución) que muestran la media mundial; apenas se customiza (un país, por
// puesto, o barras) pasa a uno neutral/descriptivo. El PNG hereda el del DOM.
function ed_title() {
  const insight = (ed_mode() === 'line' || ed_mode() === 'box') && !ed_byPos() && ed_selTeams().filter(c => c !== ED_WORLD).length === 0;
  return insight ? ed_tt('c12-title', 'Los mundialistas son cada vez más veteranos') : ed_tt('c12-title-neutral', 'La edad de los mundialistas');
}
function ed_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="12"]') || document;
  // Guard del editor (?nl=1): si hay texto custom seteado, no pisarlo en cada
  // redraw (mismo patrón que natividad/ligas/origenes/dts).
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const titleEl = block.querySelector('.chart-title'); if (titleEl && !(tx.title || '').trim()) titleEl.textContent = ed_title();
  const subEl = block.querySelector('.chart-subtitle'); if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = ed_subtitle();
}

//==================================================================
//  Chips + buscador + toggles
//==================================================================
function ed_renderChips() {
  const c = document.getElementById('ed-selected-chips'); if (!c) return;
  c.innerHTML = '';
  Array.from(ed_selMap().keys()).forEach(code => {
    if (code !== ED_WORLD && !ed_teams[code]) return;
    if (code === ED_WORLD && ed_mode() === 'bar') return;   // en barras el "Mundial" no es un punto
    const bg = code === ED_WORLD ? ED_REAL : ed_getColor(code);
    const chip = document.createElement('span'); chip.className = 'm-selected-chip'; chip.style.background = bg; chip.style.color = '#fff'; chip.textContent = ed_teamName(code);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×'; x.addEventListener('click', () => ed_toggleTeam(code)); chip.appendChild(x); c.appendChild(chip);
  });
}
function ed_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupEdadSearch() {
  const input = document.getElementById('ed-search'), results = document.getElementById('ed-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  // En barras solo se ofrecen las selecciones que JUEGAN el Mundial elegido (las
  // que tienen plantel ese año). En líneas/distribución, todas + el "Mundial".
  const all = () => {
    if (ed_mode() === 'bar') {   // solo selecciones que juegan el Mundial elegido
      const wc = String(((state[12] && state[12].period) || [])[1]);
      return Object.keys(ed_teams || {}).filter(c => ed_teams[c][wc]).map(code => ({ code, name: ed_teamName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    const base = Object.keys(ed_teams || {}).map(code => ({ code, name: ed_teamName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return [{ code: ED_WORLD, name: ed_teamName(ED_WORLD) }].concat(base);
  };
  function get(q) { if (!q) return []; const qn = ed_norm(q); return all().filter(c => ed_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${ed_selMap().has(c.code) ? ' m-already' : ''}" data-code="${c.code}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-code]').forEach(el => el.addEventListener('click', () => { ed_toggleTeam(el.dataset.code); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); ed_toggleTeam(matches[active].code); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
// Toggle segmentado genérico (clase lg-seg-on)
function ed_seg(ids, getCur, setCur, after) {
  const B = {}; ids.forEach(id => B[id] = document.getElementById('ed-' + id)); if (Object.values(B).some(x => !x)) return null;
  function sync() { ids.forEach(id => { const on = getCur() === id.split('-').pop(); B[id].classList.toggle('lg-seg-on', on); B[id].setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  ids.forEach(id => B[id].addEventListener('click', () => { const v = id.split('-').pop(); if (getCur() === v) return; setCur(v); sync(); if (after) after(); ed_renderChips(); drawEdad(); }));
  sync(); return sync;
}
function setupEdadToggles() {
  // Forma: líneas / distribución / barras. Al pasar a distribución, una sola selección.
  ed_seg(['mode-line', 'mode-box', 'mode-bar'], () => state[12].mode, v => {
    state[12].mode = v;
    if (v === 'box') { const sel = ed_selMap(); if (sel.size > 1) { const first = sel.keys().next().value; sel.clear(); sel.set(first, 0); } }
  });
  // Puesto del ranking de barras: todos / cada puesto.
  ed_seg(['barpos-all', 'barpos-GK', 'barpos-DEF', 'barpos-MID', 'barpos-FWD'], () => ed_barPos(), v => { state[12].barPos = v; });
  // Desglose: selección (buscador) / por puesto. Al pasar a "por puesto", una sola selección.
  ed_seg(['view-sel', 'view-pos'], () => (ed_byPos() ? 'pos' : 'sel'), v => {
    state[12].byPos = (v === 'pos');
    if (v === 'pos') { const sel = ed_selMap(); if (sel.size > 1) { const first = sel.keys().next().value; sel.clear(); sel.set(first, 0); } }
  });
  // Selector de puesto único (solo en box+puesto)
  ed_seg(['boxpos-GK', 'boxpos-DEF', 'boxpos-MID', 'boxpos-FWD'], () => ed_boxPos(), v => { state[12].boxPos = v; });
}
function setupEdadSlider() { setupWcRangeSlider({ fromId: 'ed-slider-from', toId: 'ed-slider-to', dispId: 'ed-range-display', trackId: 'ed-range-track-active', years: ed_years, get: () => state[12].period, set: (p) => { state[12].period = p; }, onChange: () => drawEdad() }); }
function setupEdadCSV() {
  document.querySelectorAll('button.download[data-chart="12-csv"]').forEach(btn => btn.addEventListener('click', () => {
    ed_initData();
    let csv = 'year,grupo,n,edad_promedio,min,q1,mediana,q3,max\n';
    const row = (yr, label, d) => { if (!d) return; csv += `${yr},${label},${d.n || ''},${d.act != null ? d.act : ''},${d.box ? d.box.join(',') : ',,,,'}\n`; };
    ed_years.forEach(y => row(y, 'Total', ed_overall[String(y)]));
    Object.keys(ed_positions).forEach(p => ed_years.forEach(y => row(y, 'pos:' + p, ed_positions[p][String(y)])));
    Object.keys(ed_teams).forEach(tc => ed_years.forEach(y => row(y, 'team:' + tc, ed_teams[tc][String(y)])));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'el-atlas-03-edad-mundialistas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function initEdad() {
  ed_initData();
  if (!state[12]) state[12] = {};
  if (!state[12].period) state[12].period = [ED_YEAR_MIN, ED_YEAR_MAX];
  if (!state[12].mode) state[12].mode = 'line';
  if (state[12].byPos == null) state[12].byPos = false;
  if (!state[12].boxPos) state[12].boxPos = 'DEF';
  if (!state[12].barPos) state[12].barPos = 'all';
  if (!(state[12].selectedTeams instanceof Map)) state[12].selectedTeams = new Map(state[12].selectedTeams || []);
  if (state[12].selectedTeams.size === 0) state[12].selectedTeams.set(ED_WORLD, 0);   // default: Mundial (todos)

  drawEdad();
  setupEdadSlider();
  setupEdadSearch();
  setupEdadToggles();
  setupEdadCSV();
  ed_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initEdad._wired) { initEdad._wired = true; window.addEventListener('atlas-editor-change', () => drawEdad()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawEdad;
  window.onBeforePngExportGetSourceText = function (chartId) { return (String(chartId) === '12') ? ((typeof t === 'function' ? t('c12-sources-tpl') : '') || null) : null; };
  window.onBeforePngExportGetSubtitle = function (chartId) { return (String(chartId) === '12') ? ed_subtitle() : null; };
}
