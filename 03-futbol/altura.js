// =============================================================
//  El Atlas N°3 — Chart 10: evolución de la altura de los mundialistas
// =============================================================
// ¿Cuánto más altos son los futbolistas que el varón promedio de su país y su
// generación? Línea de altura REAL vs ESPERADA (la del país de nacimiento en el
// año de nacimiento de cada jugador). Controles:
//   - Forma: Líneas (promedio) ↔ Distribución (boxplot por Mundial).
//   - Buscador de selecciones (siempre): vacío = Total (todas); o agregás una/varias.
//   - Por puesto: arquero / defensor / medio / delantero.
//   - vs país: mostrar la altura esperada (la brecha) — solo en líneas.
// En Distribución se muestra UNA sola caja por Mundial (Total, o una selección,
// o un puesto): comparar muchas cajas a la vez no se lee.
// Datos: ALTURA (data-altura.js). Mobile-first PNG (cuadrado) — ver skill graficos-atlas.

//==================================================================
//  Constantes
//==================================================================
const AL_REAL = '#BE5D32';            // altura real (terracota Atlas)
const AL_EXP = '#9A8F82';             // altura esperada del país (gris cálido)
const AL_POS_ORDER = ['GK', 'DEF', 'MID', 'FWD'];
const AL_POS_COL = { GK: '#C9A227', DEF: '#2B5C8A', MID: '#5BA152', FWD: '#9A4FA8' };
const AL_POS_NAME = {
  GK: ['Arqueros', 'Goalkeepers'], DEF: ['Defensores', 'Defenders'],
  MID: ['Mediocampistas', 'Midfielders'], FWD: ['Delanteros', 'Forwards']
};
// El Mundial (referencia) es terracota (AL_REAL); la paleta de países EVITA los
// rojos/terracotas al principio para que el primer país agregado no se confunda.
const AL_PALETTE = [
  '#2B5C8A', '#5BA152', '#9A4FA8', '#2BA0A8', '#C9A227', '#1B3956',
  '#386433', '#5F3168', '#1B6368', '#7D6418', '#C0473A', '#772C24'
];
function al_colorForSlot(s) { return AL_PALETTE[s % AL_PALETTE.length]; }
const AL_BIG = ['ARG', 'BRA', 'DEU', 'NLD', 'ESP'];   // (team_code = ISO3)
const AL_WORLD = '_WORLD';   // "selección" especial = promedio de TODOS los mundialistas (seleccionable como un país más)
const AL_BAR_COL = '#5E7E96';   // azul neutro para las barras de un Mundial
// Potencias futbolísticas: siempre se muestran en el ranking de barras aunque no
// estén en el top/bottom 3 (team_code = ISO3; ENG por el split del Reino Unido).
const AL_IMPORTANT = ['BRA', 'ARG', 'DEU', 'FRA', 'ENG', 'ITA', 'ESP', 'NLD', 'URY', 'PRT', 'BEL', 'MEX'];

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
let al_years = null, al_overall = null, al_teams = null, al_positions = null, al_teamPos = null, al_teamNames = null, al_proxies = null, al_teamConfed = null;
let al_scHoverConf = null;   // confederación apuntada en la leyenda del scatter (transitorio)
let al_scHidden = new Set();  // confederaciones ocultadas con click en la leyenda (toggle)
function al_initData() {
  if (al_overall) return;
  if (typeof ALTURA === 'undefined') { console.error('[altura] ALTURA no cargado'); al_years = []; al_overall = {}; al_teams = {}; al_positions = {}; al_teamPos = {}; al_teamNames = {}; al_proxies = {}; al_teamConfed = {}; return; }
  al_years = ALTURA.years.slice();
  al_overall = ALTURA.overall; al_teams = ALTURA.teams; al_positions = ALTURA.positions; al_teamPos = ALTURA.teamPos || {};
  al_teamNames = ALTURA.teamNames; al_proxies = ALTURA.proxies || {}; al_teamConfed = ALTURA.teamConfed || {};
}
function al_teamPosSeries(country, p) { const o = al_teamPos[country] && al_teamPos[country][p]; if (!o) return []; const r = []; (al_years || []).forEach(y => { const v = o[String(y)]; if (v != null) r.push([y, v]); }); return r; }
function al_mode() { return (state[10] && state[10].mode) || 'line'; }
function al_byPos() { return !!(state[10] && state[10].byPos); }
function al_vsCountry() { return !!(state[10] && state[10].vsCountry); }
function al_boxPos() { return (state[10] && state[10].boxPos) || 'DEF'; }

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
// Ubica el tooltip junto al cursor, pero a la IZQUIERDA si no entra a la derecha
// (si no, contra el borde se comprime/deforma). Requiere el tooltip ya visible.
function al_placeTip(tt, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = evClientX(ev) - rc.left, y = evClientY(ev) - rc.top, tw = tt.offsetWidth || 170;
  const left = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tt.style.left = left + 'px'; tt.style.top = (y + 14) + 'px';
}
function al_teamName(code) { if (code === AL_WORLD) return al_totalName(); const lang = (typeof LANG !== 'undefined') ? LANG : 'es'; const nm = al_teamNames && al_teamNames[code]; return nm ? (lang === 'en' ? nm[1] : nm[0]) : code; }
function al_posName(p) { const lang = (typeof LANG !== 'undefined') ? LANG : 'es'; const nm = AL_POS_NAME[p]; return nm ? (lang === 'en' ? nm[1] : nm[0]) : p; }
function al_totalName() { return al_tt('c10-real', 'Mundialistas'); }
function al_selMap() { if (!(state[10].selectedTeams instanceof Map)) state[10].selectedTeams = new Map(state[10].selectedTeams || []); return state[10].selectedTeams; }
function al_getColor(code) { if (code === AL_WORLD) return AL_REAL; const s = al_selMap().get(code); return s == null ? null : al_colorForSlot(s); }
function al_selTeams() { return Array.from(al_selMap().keys()).filter(c => c === AL_WORLD || (al_teams && al_teams[c])); }
function al_nextFreeSlot() { const u = new Set(Array.from(al_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function al_toggleTeam(code) {
  const sel = al_selMap();
  if (al_mode() === 'box' || (al_byPos() && al_mode() === 'line')) {   // distribución y "por puesto" (líneas): una sola; barras/dispersión/líneas: varias
    if (sel.has(code)) sel.clear(); else { sel.clear(); sel.set(code, 0); }
  } else {
    if (sel.has(code)) sel.delete(code); else sel.set(code, al_nextFreeSlot());
  }
  al_renderChips(); drawAltura();
}
function al_seriesByYear(obj, field) { const r = []; (al_years || []).forEach(y => { const d = obj[String(y)]; if (d && d[field] != null) r.push([y, d[field]]); }); return r; }
function al_boxesByYear(obj) { const r = []; (al_years || []).forEach(y => { const d = obj[String(y)]; if (d && d.box) r.push([y].concat(d.box)); }); return r; }
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
function al_yScale(min, max) {
  let lo = Math.floor((min - 1) / 5) * 5, hi = Math.ceil((max + 1) / 5) * 5;
  if (hi - lo < 10) hi = lo + 10;
  const ticks = []; for (let v = lo; v <= hi + 0.001; v += 5) ticks.push(v);
  return { min: lo, max: hi, ticks };
}

//==================================================================
//  Construcción de series según los controles
//==================================================================
// Líneas: lista de { label, color, pts:[[year,val]], dashed, faint }
function al_lineSeries() {
  al_initData(); const out = [];
  if (al_byPos()) {
    const country = al_selTeams().find(c => c !== AL_WORLD);   // primer país elegido; si no hay, Mundial (overall)
    AL_POS_ORDER.forEach(p => {
      const pts = country ? al_teamPosSeries(country, p) : (al_positions[p] ? al_seriesByYear(al_positions[p], 'act') : []);
      if (pts.length) out.push({ label: al_posName(p), color: AL_POS_COL[p], pts, key: 'P_' + p });
    });
    return out;
  }
  let sel = al_selTeams(); if (!sel.length) sel = [AL_WORLD];
  sel.forEach(code => {
    const isW = code === AL_WORLD, o = isW ? al_overall : al_teams[code], col = isW ? AL_REAL : al_getColor(code);
    out.push({ label: al_teamName(code), color: col, pts: al_seriesByYear(o, 'act'), key: code });
    // "varón promedio": la referencia esperada de ESA selección. SIEMPRE etiquetada,
    // si no, al exportar el PNG quedan líneas punteadas sin explicación. El Mundial usa
    // el gris de referencia; cada país usa su color (pareja sólida/punteada, mismo color)
    // y un sufijo "· varón prom." para que se lea cuál es cuál.
    if (al_vsCountry()) {
      const lab = isW ? al_tt('c10-exp', 'Varón promedio de sus países') : (al_teamName(code) + al_tt('c10-exp-sfx', ' · varón prom.'));
      out.push({ label: lab, color: isW ? AL_EXP : col, pts: al_seriesByYear(o, 'exp'), dashed: true, key: code });
    }
  });
  return out;
}
// Distribución: UNA sola caja por año. Devuelve { label, color, boxes:[[year,mn,q1,md,q3,mx]] }
function al_boxOne() {
  al_initData();
  if (al_byPos()) { const p = al_boxPos(), o = al_positions[p]; return { label: al_posName(p), color: AL_POS_COL[p], boxes: o ? al_boxesByYear(o) : [] }; }
  const sel = al_selTeams(); const code = sel[0] || AL_WORLD, isW = code === AL_WORLD;
  return { label: al_teamName(code), color: isW ? AL_REAL : al_getColor(code), boxes: al_boxesByYear(isW ? al_overall : al_teams[code]) };
}

// Barras: ranking de selecciones de UN Mundial. pos='all' → altura del plantel;
// si no, la del puesto. Default = top 3 más altas + bottom 3 + hasta 5 potencias.
function al_barPos() { return (state[10] && state[10].barPos) || 'all'; }
function al_barRows(wc, pos) {
  al_initData(); const rows = [];
  Object.keys(al_teams).forEach(code => {
    let v = null;
    if (pos === 'all') { const d = al_teams[code][String(wc)]; v = d && d.act != null ? d.act : null; }
    else { const o = al_teamPos[code] && al_teamPos[code][pos]; v = o ? o[String(wc)] : null; }
    if (v != null) rows.push({ code, v });
  });
  rows.sort((a, b) => b.v - a.v || a.code.localeCompare(b.code));
  return rows;
}
function al_barDefault(wc, pos) {
  const rows = al_barRows(wc, pos);
  if (!rows.length) return [];
  const sel = al_selTeams().filter(c => c !== AL_WORLD && rows.find(r => r.code === c));   // selecciones agregadas a mano
  if (rows.length <= 11 && !sel.length) return rows;
  const top = rows.slice(0, 3), bottom = rows.slice(-3);
  const chosen = new Set(top.concat(bottom).map(r => r.code)), out = top.concat(bottom);
  let imp = 0;
  for (const c of AL_IMPORTANT) { if (imp >= 5) break; if (chosen.has(c)) continue; const r = rows.find(x => x.code === c); if (r) { out.push(r); chosen.add(c); imp++; } }
  sel.forEach(c => { if (!chosen.has(c)) { out.push(rows.find(r => r.code === c)); chosen.add(c); } });   // + las elegidas a mano
  return out.sort((a, b) => b.v - a.v);
}

//==================================================================
//  DRAW
//==================================================================
function drawAltura() {
  const svg = document.getElementById('chart10'); if (!svg) return;
  svg.innerHTML = ''; al_clearHover(svg); al_initData();

  // visibilidad de controles
  const box = al_mode() === 'box', bar = al_mode() === 'bar', scatter = al_mode() === 'scatter';
  const viewBtn = document.getElementById('al-view-sel'); if (viewBtn) { const g = viewBtn.closest('.lg-mode'); if (g) g.style.display = (bar || scatter) ? 'none' : ''; }   // desglose: oculto en barras y dispersión
  const wrap = document.getElementById('al-search-wrap'); if (wrap) wrap.style.display = '';     // buscador siempre (en barras/dispersión agrega/marca selecciones)
  const chipsEl = document.getElementById('al-selected-chips'); if (chipsEl) chipsEl.style.display = '';
  const vsBtn = document.getElementById('al-vscountry'); if (vsBtn) { const g = vsBtn.closest('.lg-mode'); if (g) g.style.display = (bar || box || scatter || al_byPos()) ? 'none' : ''; }
  const posSel = document.getElementById('al-boxpos'); if (posSel) posSel.style.display = (box && al_byPos()) ? '' : 'none';   // selector de puesto único, solo en box+puesto
  const barSel = document.getElementById('al-barpos'); if (barSel) barSel.style.display = bar ? '' : 'none';                  // selector de puesto del ranking, solo en barras
  const confLeg = document.getElementById('al-conf-legend'); if (confLeg) confLeg.style.display = scatter ? '' : 'none';      // leyenda de confederaciones, solo en dispersión
  const hint = document.getElementById('al-hint');   // solo en Líneas (en distribución/barras/dispersión no se compara contra el Mundial)
  if (hint) { const onlyWorld = al_mode() === 'line' && !al_byPos() && al_selTeams().filter(c => c !== AL_WORLD).length === 0; hint.style.display = onlyWorld ? '' : 'none'; }
  // En barras y dispersión el slider elige UN Mundial → un solo thumb.
  const sliderEl = document.getElementById('al-range-slider'); if (sliderEl) sliderEl.classList.toggle('s-range-single', bar || scatter);

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && al_isMobile();
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; AL_W = f.vbW; AL_H = square ? 910 : newsletter ? 860 : f.vbH; AL_MARGIN = al_getMargins(editorFormat); }
  else if (mobile) { AL_W = AL_W_MOBILE; AL_H = AL_H_MOBILE; AL_MARGIN = { ...AL_MARGIN_MOBILE }; }
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

  // Barras: ranking de selecciones de UN Mundial (el extremo derecho del slider).
  if (bar) { al_drawBars(svg, { wc: y1, pos: al_barPos(), bigFmt, isPngFormat }); al_applyHeadings(); return; }
  // Dispersión: altura del país (x) vs altura del plantel (y), un punto por selección.
  if (scatter) { al_drawScatter(svg, { wc: y1, bigFmt, isPngFormat, SIZES }); al_applyHeadings(); return; }

  const lineSeries = box ? [] : al_lineSeries();
  const boxOne = box ? al_boxOne() : null;
  let vmin = Infinity, vmax = -Infinity;
  if (box) inP(boxOne.boxes).forEach(b => { if (b[1] < vmin) vmin = b[1]; if (b[5] > vmax) vmax = b[5]; });
  else lineSeries.forEach(s => inP(s.pts).forEach(p => { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; }));
  if (!isFinite(vmin)) { vmin = 165; vmax = 185; }
  const yScale = al_yScale(vmin, vmax);

  if (!box) {
    // Las etiquetas de fin de línea se parten en 2 renglones si son largas, para
    // que el margen derecho no se coma el gráfico (presupuesto ~28% del ancho).
    // Cada serie guarda sus renglones en s._wrap; el margen sale del renglón más
    // ancho. El valor (PNG) va pegado al final del texto.
    const labelOffset = bigFmt ? 12 : 6, fw = bigFmt ? 700 : 600;
    const budget = AL_W * (bigFmt ? 0.27 : 0.31);   // ancho máximo por renglón
    let maxLineW = 0;
    lineSeries.filter(s => s.label).forEach(s => {
      const lv = (s.pts.filter(p => p[0] >= y0 && p[0] <= y1).slice(-1)[0] || [])[1];
      const disp = s.label + (isPngFormat && lv != null ? '  ' + Math.round(lv) : '');
      s._wrap = al_wrapLabel(disp, budget, SIZES.label, fw);
      s._wrap.forEach(ln => { const w = al_measureText(ln, SIZES.label, fw); if (w > maxLineW) maxLineW = w; });
    });
    AL_MARGIN.right = Math.min(Math.round(AL_W * 0.34), Math.max(AL_MARGIN.right, labelOffset + maxLineW + (bigFmt ? 16 : 8)));
    PLOT_W = AL_W - AL_MARGIN.left - AL_MARGIN.right;
  }
  // En distribución, inset horizontal para que la primera/última caja no se
  // pisen con el eje Y ni el borde derecho (las líneas sí pueden tocar el borde).
  const xInset = box ? (bigFmt ? 30 : 18) : 0;
  const xS = (yr) => AL_MARGIN.left + xInset + ((yr - y0) / (y1 - y0 || 1)) * (PLOT_W - 2 * xInset);
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
  const yT = al_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${AL_MARGIN.left - (mobile || mobilePng ? 80 : bigFmt ? 74 : 42)}, ${AL_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = al_tt('c10-axis-y', 'Altura (cm)'); svg.appendChild(yT);

  if (box) al_drawBox(svg, boxOne, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES });
  else al_drawLines(svg, lineSeries, { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP });

  al_applyHeadings();
}

// Parte una etiqueta larga en hasta 2 renglones que entren en maxW (greedy por
// palabras). Si entra en uno, devuelve un solo renglón. El valor (PNG) viaja
// pegado al final del texto, así cae naturalmente en el 2º renglón.
function al_wrapLabel(text, maxW, fs, fw) {
  if (al_measureText(text, fs, fw) <= maxW) return [text];
  const words = String(text).split(' ');
  if (words.length < 2) return [text];
  let l1 = '', i = 0;
  for (; i < words.length; i++) {
    const test = l1 ? l1 + ' ' + words[i] : words[i];
    if (!l1 || al_measureText(test, fs, fw) <= maxW) l1 = test; else break;
  }
  const l2 = words.slice(i).join(' ');
  return l2 ? [l1, l2] : [l1];
}

//------------------------------------------------------------------
//  Modo LÍNEAS
//------------------------------------------------------------------
function al_drawLines(svg, series, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES, lineW, haloW, labelHalo, dotR, inP } = ctx;
  const interactive = !isPngFormat;
  const halosG = al_el('g'); svg.appendChild(halosG);
  const linesG = al_el('g'); svg.appendChild(linesG);
  const dotsG = al_el('g'); svg.appendChild(dotsG);
  const hitG = al_el('g'); svg.appendChild(hitG);   // áreas invisibles para resaltar al pasar el mouse
  const endLabels = [], hoverSeries = [];
  series.forEach(s => {
    const pts = inP(s.pts); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
    const halo = al_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); if (s.key) halo.setAttribute('data-al', s.key); halosG.appendChild(halo);
    const path = al_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', s.dashed ? lineW * 0.85 : lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (s.dashed) path.setAttribute('stroke-dasharray', bigFmt ? '2 7' : '1 4');
    if (s.key) path.setAttribute('data-al', s.key);
    linesG.appendChild(path);
    if (!s.dashed) pts.forEach(p => { const c = al_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); if (s.key) c.setAttribute('data-al', s.key); dotsG.appendChild(c); });
    // área de hover ancha e invisible: al entrar, el resto de las líneas se atenúa
    if (interactive && s.key) {
      const hit = al_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 10, 12)); hit.setAttribute('stroke-linejoin', 'round'); hit.setAttribute('stroke-linecap', 'round'); hit.style.pointerEvents = 'stroke'; hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => al_emph(svg, s.key));
      hit.addEventListener('mouseleave', () => al_emph(svg, null));
      hitG.appendChild(hit);
    }
    const last = pts[pts.length - 1];
    if (s.label) endLabels.push({ label: s.label, lines: s._wrap, color: s.color, idealY: yS(last[1]), x: xS(y1), valLast: last[1], key: s.key });
    hoverSeries.push({ label: s.label || al_tt('c10-exp', 'esperada'), color: s.color, pts });
  });
  // anti-colisión de las etiquetas de fin de línea contemplando su ALTO (1 o 2
  // renglones): el gap entre dos vecinas es la semisuma de sus altos + un padding.
  const lineH = SIZES.label * (bigFmt ? 1.16 : 1.22), padY = bigFmt ? 6 : 4;
  endLabels.forEach(l => { l.n = (l.lines && l.lines.length) || 1; l.h = l.n * lineH; });
  const topB = AL_MARGIN.top + (bigFmt ? 6 : 2), botB = AL_MARGIN.top + (AL_H - AL_MARGIN.top - AL_MARGIN.bottom);
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    const minY = topB + l.h / 2;
    l.y = (i === 0) ? Math.max(l.idealY, minY) : Math.max(l.idealY, endLabels[i - 1].y + (endLabels[i - 1].h + l.h) / 2 + padY);
  });
  if (endLabels.length) {
    const last = endLabels[endLabels.length - 1], maxY = botB - last.h / 2;
    if (last.y > maxY) { last.y = maxY; for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - (endLabels[i].h + endLabels[i + 1].h) / 2 - padY); }
  }
  const endG = al_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    l.y = Math.max(l.y, topB + l.h / 2);
    const lines = (l.lines && l.lines.length) ? l.lines : [l.label + (isPngFormat ? '  ' + Math.round(l.valLast) : '')];
    if (Math.abs(l.y - l.idealY) > 1.5) { const g = al_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y); g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); if (l.key) g.setAttribute('data-al', l.key); endG.appendChild(g); }
    const x = l.x + (bigFmt ? 12 : 6), baseAdj = bigFmt ? 8 : 4;
    lines.forEach((ln, k) => {
      const txt = al_el('text'); txt.setAttribute('x', x); txt.setAttribute('y', l.y + (k - (lines.length - 1) / 2) * lineH + baseAdj); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
      txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
      txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
      if (l.key) txt.setAttribute('data-al', l.key);
      txt.textContent = ln; endG.appendChild(txt);
    });
  });
  if (!isPngFormat && hoverSeries.length) al_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries });
}
// Resalte: al pasar el mouse por una línea, las demás se atenúan. Las parejas
// real/esperada comparten data-al (= código de selección), así se resaltan juntas.
// Norma general de los gráficos del Atlas salvo pedido en contra.
function al_emph(svg, key) {
  if (!svg) return;
  svg.querySelectorAll('[data-al]').forEach(el => {
    el.style.opacity = (key == null || el.getAttribute('data-al') === key) ? '' : '0.14';
  });
}

//------------------------------------------------------------------
//  Modo DISTRIBUCIÓN — UNA caja por Mundial
//------------------------------------------------------------------
function al_drawBox(svg, grp, ctx) {
  const { xS, yS, y0, y1, bigFmt, isPngFormat, SIZES } = ctx;
  const yrs = (al_years || []).filter(y => y >= y0 && y <= y1);
  const slot = yrs.length > 1 ? (xS(yrs[1]) - xS(yrs[0])) : (AL_W - AL_MARGIN.left - AL_MARGIN.right);
  const bw = Math.max(4, Math.min(bigFmt ? 40 : 22, slot * 0.66));
  const g = al_el('g'); svg.appendChild(g);
  const tooltip = document.getElementById('tooltip10');
  const tMed = al_tt('c10-box-median', 'mediana'), tRange = al_tt('c10-box-range', 'mín–máx');
  grp.boxes.filter(b => b[0] >= y0 && b[0] <= y1).forEach(b => {
    const [yr, mn, q1, md, q3, mx] = b; const cx = xS(yr);
    const yb1 = yS(q1), yb3 = yS(q3), ymd = yS(md), ymn = yS(mn), ymx = yS(mx);
    const wk = al_el('line'); wk.setAttribute('x1', cx); wk.setAttribute('x2', cx); wk.setAttribute('y1', ymx); wk.setAttribute('y2', ymn); wk.setAttribute('stroke', grp.color); wk.setAttribute('stroke-width', bigFmt ? 1.8 : 1.1); wk.setAttribute('stroke-opacity', 0.7); g.appendChild(wk);
    // bigotes con tope horizontal
    [ymn, ymx].forEach(yy => { const cap = al_el('line'); cap.setAttribute('x1', cx - bw * 0.22); cap.setAttribute('x2', cx + bw * 0.22); cap.setAttribute('y1', yy); cap.setAttribute('y2', yy); cap.setAttribute('stroke', grp.color); cap.setAttribute('stroke-width', bigFmt ? 1.6 : 1); cap.setAttribute('stroke-opacity', 0.7); g.appendChild(cap); });
    const rect = al_el('rect'); rect.setAttribute('x', cx - bw / 2); rect.setAttribute('y', yb3); rect.setAttribute('width', bw); rect.setAttribute('height', Math.max(1, yb1 - yb3)); rect.setAttribute('fill', grp.color); rect.setAttribute('fill-opacity', 0.32); rect.setAttribute('stroke', grp.color); rect.setAttribute('stroke-width', bigFmt ? 1.8 : 1.1); rect.setAttribute('rx', 2); g.appendChild(rect);
    const me = al_el('line'); me.setAttribute('x1', cx - bw / 2); me.setAttribute('x2', cx + bw / 2); me.setAttribute('y1', ymd); me.setAttribute('y2', ymd); me.setAttribute('stroke', grp.color); me.setAttribute('stroke-width', bigFmt ? 3 : 2); g.appendChild(me);
    if (!isPngFormat && tooltip) {
      const hit = al_el('rect'); hit.setAttribute('x', cx - bw / 2 - 2); hit.setAttribute('y', ymx); hit.setAttribute('width', bw + 4); hit.setAttribute('height', Math.max(2, ymn - ymx)); hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', (ev) => { tooltip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${grp.label} · ${yr}</div>${tMed} <strong>${md} cm</strong><br><span style="color:var(--ink-muted);">${mn}–${mx} cm (${tRange})</span>`; tooltip.style.display = 'block'; tooltip.style.opacity = '1'; al_placeTip(tooltip, ev, svg); });
      hit.addEventListener('mousemove', (ev) => al_placeTip(tooltip, ev, svg));
      hit.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; });
      g.appendChild(hit);
    }
  });
  // etiqueta del grupo (qué se está mostrando), arriba a la izquierda
  const lbl = al_el('text'); lbl.setAttribute('x', AL_MARGIN.left + 4); lbl.setAttribute('y', AL_MARGIN.top + (bigFmt ? 22 : 13)); lbl.style.fontSize = SIZES.label + 'px'; lbl.style.fontFamily = 'var(--sans)'; lbl.setAttribute('font-weight', bigFmt ? 700 : 600); lbl.setAttribute('fill', grp.color); lbl.textContent = grp.label; svg.appendChild(lbl);
}

//------------------------------------------------------------------
//  Modo BARRAS — ranking de selecciones para UN Mundial
//------------------------------------------------------------------
function al_drawBars(svg, opt) {
  const { wc, pos, bigFmt } = opt;
  const rows = al_barDefault(wc, pos);
  const col = pos === 'all' ? AL_BAR_COL : AL_POS_COL[pos];
  if (!rows.length) { const m = al_el('text'); m.setAttribute('x', AL_W / 2); m.setAttribute('y', AL_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (bigFmt ? 24 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = al_tt('c10-bar-empty', 'Sin datos para este Mundial.'); svg.appendChild(m); return; }
  const fs = bigFmt ? 23 : 12.5;
  const top = AL_MARGIN.top + (bigFmt ? 26 : 16), bottom = bigFmt ? 24 : 12;
  let nameW = 0; rows.forEach(r => { const w = al_measureText(al_teamName(r.code), fs, 600); if (w > nameW) nameW = w; });
  const valW = al_measureText('188.8 cm', fs, 700);
  const left = (bigFmt ? 18 : 12) + nameW + (bigFmt ? 16 : 10);
  const right = valW + (bigFmt ? 22 : 14);
  const plotW = Math.max(40, AL_W - left - right);
  const availH = AL_H - top - bottom;
  const rowH = rows.length ? Math.min(availH / rows.length, bigFmt ? 84 : 54) : 24;
  const barH = rowH * 0.58;
  const minV = Math.min(...rows.map(r => r.v)), maxV = Math.max(...rows.map(r => r.v));
  const base = Math.max(140, Math.floor(minV) - 6);                 // baseline para que se note la diferencia
  const xW = (v) => Math.max(0, ((v - base) / Math.max(1, maxV * 1.005 - base)) * plotW);
  const yBase = (y) => y + fs * 0.34;
  rows.forEach((r, i) => {
    const cy = top + i * rowH, midY = cy + rowH / 2, bw = xW(r.v);
    const nm = al_el('text'); nm.setAttribute('x', left - (bigFmt ? 12 : 8)); nm.setAttribute('y', yBase(midY)); nm.setAttribute('text-anchor', 'end'); nm.style.fontSize = fs + 'px'; nm.style.fontFamily = 'var(--sans)'; nm.style.fontWeight = '600'; nm.setAttribute('fill', 'var(--ink)'); nm.textContent = al_teamName(r.code); svg.appendChild(nm);
    const bar = al_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', midY - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', col); svg.appendChild(bar);
    const vt = al_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', yBase(midY)); vt.style.fontSize = fs + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.setAttribute('fill', 'var(--ink)'); vt.style.fontVariantNumeric = 'tabular-nums'; vt.textContent = r.v + ' cm'; svg.appendChild(vt);
  });
  const disp = document.getElementById('al-range-display'); if (disp) disp.textContent = wc;
}

//------------------------------------------------------------------
//  Modo DISPERSIÓN — altura del país (x) vs altura del plantel (y),
//  un punto por selección de UN Mundial. Color por confederación FIFA
//  (misma paleta que el scatter Elo-PIB del N°3) + recta de regresión.
//------------------------------------------------------------------
function al_scatterPoints(wc) {
  al_initData(); const w = String(wc); const out = [];
  Object.keys(al_teams || {}).forEach(code => {
    const d = al_teams[code] && al_teams[code][w];
    if (!d || d.act == null || d.exp == null) return;     // necesita altura real Y esperada
    out.push({ code, name: al_teamName(code), x: d.exp, y: d.act, confed: (al_teamConfed && al_teamConfed[code]) || null, n: d.n || 0 });
  });
  return out;
}
// Ticks "lindos" en cm para un dominio chico (rangos de ~15 cm): paso 5/2/1.
function al_scTicks(lo, hi) {
  const span = hi - lo; const step = span > 24 ? 5 : span > 10 ? 2 : 1;
  const out = []; let v = Math.ceil(lo / step) * step;
  for (; v <= hi + 1e-6; v += step) out.push(v);
  return out;
}
function al_drawScatter(svg, opt) {
  const { wc, bigFmt, isPngFormat, SIZES } = opt;
  const interactive = !isPngFormat;
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const M = { top: bigFmt ? 40 : 28, right: bigFmt ? 44 : 36, bottom: bigFmt ? 100 : 66, left: bigFmt ? 100 : 60 };
  const availW = AL_W - M.left - M.right, availH = AL_H - M.top - M.bottom;
  // Plot CUADRADO: misma escala en ambos ejes ⇒ la diagonal es de 45° reales y
  // significa "plantel = país". Se centra en el ancho disponible.
  const side = Math.max(40, Math.min(availW, availH));
  const ox = M.left + (availW - side) / 2, oy = M.top + (availH - side) / 2;
  const pts = al_scatterPoints(wc);
  const visible = pts.filter(p => !al_scHidden.has(p.confed));   // confederaciones destildadas en la leyenda se ocultan
  const disp = document.getElementById('al-range-display'); if (disp) disp.textContent = wc;
  al_renderConfLegend(pts);
  if (pts.length < 2) {
    const m = al_el('text'); m.setAttribute('x', AL_W / 2); m.setAttribute('y', AL_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (bigFmt ? 24 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = al_tt('c10-sc-empty', 'Sin datos suficientes para este Mundial.'); svg.appendChild(m); return;
  }
  // dominio COMPARTIDO entre ambos ejes (lo exige la diagonal de 45°)
  let lo = Infinity, hi = -Infinity;
  pts.forEach(p => { lo = Math.min(lo, p.x, p.y); hi = Math.max(hi, p.x, p.y); });
  const pad = Math.max(1, (hi - lo) * 0.08), d0 = lo - pad, d1 = hi + pad;
  const xS = v => ox + ((v - d0) / (d1 - d0)) * side;
  const yS = v => oy + side - ((v - d0) / (d1 - d0)) * side;

  const bg = al_el('rect'); bg.setAttribute('x', ox); bg.setAttribute('y', oy); bg.setAttribute('width', side); bg.setAttribute('height', side); bg.setAttribute('fill', 'var(--bg)'); svg.appendChild(bg);
  // grid + ticks (mismos valores en X e Y)
  const ticks = al_scTicks(d0, d1);
  ticks.forEach(v => {
    const x = xS(v); if (x >= ox - 0.5 && x <= ox + side + 0.5) {
      const gl = al_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', oy); gl.setAttribute('y2', oy + side); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
      const lb = al_el('text'); lb.setAttribute('x', x); lb.setAttribute('y', oy + side + (bigFmt ? 32 : 17)); lb.setAttribute('text-anchor', 'middle'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px'; lb.textContent = v; svg.appendChild(lb);
    }
    const y = yS(v); if (y >= oy - 0.5 && y <= oy + side + 0.5) {
      const gl = al_el('line'); gl.setAttribute('x1', ox); gl.setAttribute('x2', ox + side); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
      const lb = al_el('text'); lb.setAttribute('x', ox - (bigFmt ? 10 : 7)); lb.setAttribute('y', y + (bigFmt ? 8 : 4)); lb.setAttribute('text-anchor', 'end'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = SIZES.tick + 'px'; lb.textContent = v; svg.appendChild(lb);
    }
  });
  // títulos de eje
  const xT = al_el('text'); xT.setAttribute('class', 's-axis-title'); xT.setAttribute('x', ox + side / 2); xT.setAttribute('y', oy + side + (bigFmt ? 32 : 17) + (bigFmt ? 40 : 26)); xT.setAttribute('text-anchor', 'middle'); xT.style.fontSize = SIZES.axisTitle + 'px'; xT.textContent = al_tt('c10-sc-axis-x', 'Altura del país (varón promedio, cm)'); svg.appendChild(xT);
  const yT = al_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle'); yT.setAttribute('transform', `translate(${ox - (bigFmt ? 70 : 44)}, ${oy + side / 2}) rotate(-90)`); yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = al_tt('c10-sc-axis-y', 'Altura del plantel (cm)'); svg.appendChild(yT);

  // diagonal 45° = "plantel = país". Los puntos casi siempre quedan ARRIBA
  // (jugadores más altos que el varón promedio de su país).
  const diag = al_el('line'); diag.setAttribute('x1', xS(d0)); diag.setAttribute('y1', yS(d0)); diag.setAttribute('x2', xS(d1)); diag.setAttribute('y2', yS(d1));
  diag.setAttribute('stroke', 'var(--ink)'); diag.setAttribute('stroke-width', bigFmt ? 1.8 : 1.2); diag.setAttribute('stroke-opacity', 0.5); diag.setAttribute('stroke-dasharray', bigFmt ? '7 5' : '5 3'); svg.appendChild(diag);
  const dl = al_el('text'); const dmx = (xS(d0) + xS(d1)) / 2, dmy = (yS(d0) + yS(d1)) / 2;
  dl.setAttribute('transform', `translate(${dmx}, ${dmy}) rotate(-45)`); dl.setAttribute('text-anchor', 'middle'); dl.setAttribute('y', bigFmt ? -12 : -7);
  dl.style.fontFamily = 'var(--sans)'; dl.style.fontSize = (bigFmt ? 18 : 10.5) + 'px'; dl.setAttribute('fill', 'var(--ink-muted)');
  dl.setAttribute('paint-order', 'stroke'); dl.setAttribute('stroke', '#FAF8F3'); dl.setAttribute('stroke-width', bigFmt ? 5 : 2.5); dl.setAttribute('stroke-linejoin', 'round');
  dl.textContent = al_tt('c10-sc-diag', 'plantel = país'); svg.appendChild(dl);

  // selección manual (buscador/click): se etiquetan y agrandan
  const selSet = new Set(Array.from(al_selMap().keys()).filter(c => c !== AL_WORLD && al_teams[c]));

  // puntos (si hay una confederación apuntada en la leyenda, el resto se atenúa)
  const tooltip = document.getElementById('tooltip10');
  const hoverConf = al_scHoverConf;
  const r = bigFmt ? 7 : 4.2;
  const ptsG = al_el('g'); svg.appendChild(ptsG);
  visible.forEach(p => {
    const cx = xS(p.x), cy = yS(p.y), sel = selSet.has(p.code);
    const dim = hoverConf && p.confed !== hoverConf && !sel;
    const col = (typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[p.confed]) || '#888';
    const c = al_el('circle'); c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', sel ? r * 1.45 : r); c.setAttribute('fill', col); c.setAttribute('fill-opacity', dim ? 0.1 : (sel ? 0.95 : 0.82)); c.setAttribute('stroke', sel ? '#1A1A1A' : '#FAF8F3'); c.setAttribute('stroke-width', sel ? (bigFmt ? 2 : 1.2) : (bigFmt ? 1.6 : 1));
    if (p.confed) c.setAttribute('data-confed', p.confed);
    if (interactive) {
      c.style.cursor = 'pointer';
      const gap = +(p.y - p.x).toFixed(1);
      if (tooltip) {
        c.addEventListener('mouseenter', (ev) => {
          tooltip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${p.name}</div><div style="display:flex;gap:8px;"><span style="flex:1;">${en ? 'Squad' : 'Plantel'}</span><strong style="font-variant-numeric:tabular-nums;">${p.y} cm</strong></div><div style="display:flex;gap:8px;"><span style="flex:1;">${en ? 'Country' : 'País'}</span><strong style="font-variant-numeric:tabular-nums;">${p.x} cm</strong></div><div style="color:var(--ink-muted);margin-top:2px;">${en ? 'Gap' : 'Brecha'} ${gap >= 0 ? '+' : ''}${gap} cm</div>`;
          tooltip.style.display = 'block'; tooltip.style.opacity = '1'; al_placeTip(tooltip, ev, svg); c.setAttribute('r', (sel ? r * 1.45 : r) * 1.3);
        });
        c.addEventListener('mousemove', (ev) => al_placeTip(tooltip, ev, svg));
        c.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; c.setAttribute('r', sel ? r * 1.45 : r); });
      }
      c.addEventListener('click', (ev) => { ev.stopPropagation(); al_toggleTeam(p.code); });   // clic = marcar/desmarcar
    }
    ptsG.appendChild(c);
  });

  // etiquetas: si hay confederación apuntada → TODOS sus países (como Elo-PIB);
  // si no → seleccionadas + curadas (potencias presentes + plantel más alto/bajo).
  let want;
  if (hoverConf) {
    want = new Set(visible.filter(p => p.confed === hoverConf).map(p => p.code));
    selSet.forEach(c => want.add(c));
  } else {
    want = new Set(selSet); AL_IMPORTANT.forEach(c => want.add(c));
    if (visible.length) {
      let tallest = visible[0], shortest = visible[0];
      visible.forEach(p => { if (p.y > tallest.y) tallest = p; if (p.y < shortest.y) shortest = p; });
      want.add(tallest.code); want.add(shortest.code);
    }
  }
  al_placeScatterLabels(svg, visible.filter(p => want.has(p.code)), xS, yS, { ox, oy, side, bigFmt, SIZES, r, selSet });
}
// Colocación greedy de etiquetas del scatter: 4 posiciones candidatas
// (arriba/derecha/abajo/izquierda); si todas chocan o salen del plot, se omite.
// Las seleccionadas van en negrita. data-confed permite atenuarlas al hacer
// hover sobre una confederación.
function al_placeScatterLabels(svg, items, xS, yS, ctx) {
  const { ox, oy, side, bigFmt, SIZES, r, selSet } = ctx;
  const box = { x1: ox + 1, y1: oy + 1, x2: ox + side - 1, y2: oy + side - 1 };
  const placed = [];
  const over = (a, b) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  const inBox = (q) => q.x1 >= box.x1 && q.x2 <= box.x2 && q.y1 >= box.y1 && q.y2 <= box.y2;
  const g = al_el('g'); svg.appendChild(g);
  items.slice().sort((a, b) => yS(a.y) - yS(b.y)).forEach(p => {
    const cx = xS(p.x), cy = yS(p.y), sel = selSet && selSet.has(p.code);
    const fs = SIZES.label, fw = sel ? (bigFmt ? 800 : 700) : (bigFmt ? 700 : 600), halo = bigFmt ? 6 : 3, rr = sel ? r * 1.45 : r;
    const w = al_measureText(p.name, fs, fw) + 2;
    const cands = [
      { lx: cx, ly: cy - (rr + 5), anchor: 'middle' },
      { lx: cx + rr + 6, ly: cy + fs * 0.34, anchor: 'start' },
      { lx: cx, ly: cy + rr + fs, anchor: 'middle' },
      { lx: cx - rr - 6, ly: cy + fs * 0.34, anchor: 'end' },
    ];
    let chosen = null;
    for (const cd of cands) {
      let x1; if (cd.anchor === 'start') x1 = cd.lx; else if (cd.anchor === 'end') x1 = cd.lx - w; else x1 = cd.lx - w / 2;
      const q = { x1, x2: x1 + w, y1: cd.ly - fs * 0.8, y2: cd.ly + fs * 0.2 };
      if (!inBox(q)) continue;
      if (placed.some(pp => over(pp, q))) continue;
      chosen = { ...cd, rect: q }; break;
    }
    if (!chosen) return;
    placed.push(chosen.rect);
    const col = (typeof CONF_FIFA_LABEL_COLORS !== 'undefined' && CONF_FIFA_LABEL_COLORS[p.confed]) || '#444';
    const t = al_el('text'); t.setAttribute('x', chosen.lx); t.setAttribute('y', chosen.ly); t.setAttribute('text-anchor', chosen.anchor); t.setAttribute('fill', col);
    if (p.confed) t.setAttribute('data-confed', p.confed);
    t.style.fontSize = fs + 'px'; t.style.fontFamily = 'var(--sans)'; t.style.fontWeight = fw;
    t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#FAF8F3'); t.setAttribute('stroke-width', halo); t.setAttribute('stroke-linejoin', 'round');
    t.textContent = p.name; g.appendChild(t);
  });
}
// Leyenda de confederaciones. Hover sobre una → redibuja el scatter resaltando
// sus países (con etiquetas, como el scatter Elo-PIB). Es IDEMPOTENTE: si el set
// de confederaciones no cambió, no recrea el DOM — así los handlers sobreviven al
// redibujo del hover y no se dispara un loop de mouseenter.
function al_renderConfLegend(pts) {
  const el = document.getElementById('al-conf-legend'); if (!el) return;
  const present = new Set((pts || []).map(p => p.confed).filter(Boolean));
  const order = ((typeof CONF_FIFA_ORDER !== 'undefined') ? CONF_FIFA_ORDER : Array.from(present)).filter(c => present.has(c));
  // La key incluye el set de confederaciones Y cuáles están ocultas: así un CLICK
  // (que cambia lo oculto) recrea los chips con el estilo nuevo, pero un HOVER (que
  // no cambia ni el set ni lo oculto) salta el rebuild y no dispara loop de mouseenter.
  const key = order.join(',') + '|' + order.filter(c => al_scHidden.has(c)).join(',');
  if (el.dataset.key === key) return;
  if (el.dataset.confset !== order.join(',')) { al_scHoverConf = null; }   // cambió el Mundial → limpiar hover colgado
  el.dataset.key = key; el.dataset.confset = order.join(','); el.innerHTML = '';
  order.forEach(c => {
    const col = (typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[c]) || '#888';
    const hidden = al_scHidden.has(c);
    const chip = document.createElement('span'); chip.className = 'al-conf-chip' + (hidden ? ' al-conf-off' : '');
    chip.innerHTML = `<span class="al-conf-dot" style="background:${col};"></span>${c}`;
    chip.addEventListener('mouseenter', () => { if (al_scHidden.has(c)) return; al_scHoverConf = c; drawAltura(); });   // hover → resalta+etiqueta sus países
    chip.addEventListener('mouseleave', () => { al_scHoverConf = null; drawAltura(); });
    chip.addEventListener('click', () => { if (al_scHidden.has(c)) al_scHidden.delete(c); else al_scHidden.add(c); al_scHoverConf = null; drawAltura(); });   // click → oculta/muestra
    el.appendChild(chip);
  });
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
  const moveH = (ev) => { const rc = svg.getBoundingClientRect(); const sc = rc.width / AL_W; const lx = (evClientX(ev) - rc.left) / sc; if (lx < AL_MARGIN.left || lx > AL_W - AL_MARGIN.right) { update(null); return; } update(nearest(lx)); if (tooltip) al_placeTip(tooltip, ev, svg); };
  const leaveH = () => update(null);
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', leaveH);
  wireTouchScrub(svg, moveH);   // tap/arrastre con el dedo mueve el crosshair
  svg.__alHoverMove = moveH; svg.__alHoverLeave = leaveH;
}
function al_clearHover(svg) {
  if (svg.__alHoverMove) { svg.removeEventListener('mousemove', svg.__alHoverMove); svg.__alHoverMove = null; }
  if (svg.__alHoverLeave) { svg.removeEventListener('mouseleave', svg.__alHoverLeave); svg.__alHoverLeave = null; }
  if (svg.__atlasTouchScrub) { svg.removeEventListener('touchstart', svg.__atlasTouchScrub); svg.removeEventListener('touchmove', svg.__atlasTouchScrub); svg.__atlasTouchScrub = null; }
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
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), box = al_mode() === 'box', bar = al_mode() === 'bar', scatter = al_mode() === 'scatter', per = al_periodPhrase(en);
  const someTeams = !al_byPos() && Array.from(al_selMap().keys()).filter(c => al_teams && al_teams[c]).length > 0;
  if (scatter) {
    const wc = ((state[10] && state[10].period) || [AL_YEAR_MIN, AL_YEAR_MAX])[1];
    return en ? `Squad height vs. the average man of the players' birth countries, by team in the ${wc} World Cup.` : `Altura del plantel vs. el varón promedio de los países de nacimiento de sus jugadores, por selección en el Mundial ${wc}.`;
  }
  if (bar) {
    const wc = ((state[10] && state[10].period) || [AL_YEAR_MIN, AL_YEAR_MAX])[1], pos = al_barPos();
    if (pos !== 'all') return en ? `Average height of each team's ${al_posName(pos).toLowerCase()} in the ${wc} World Cup.` : `Altura promedio de los ${al_posName(pos).toLowerCase()} de cada selección en el Mundial ${wc}.`;
    return en ? `Average squad height by team in the ${wc} World Cup.` : `Altura promedio del plantel de cada selección en el Mundial ${wc}.`;
  }
  if (box) return en ? `Distribution of player height ${per}.` : `Distribución de la altura de los jugadores ${per}.`;
  if (al_byPos()) {
    const country = al_selTeams().find(c => c !== AL_WORLD);
    if (country) return en ? `Average height by position — ${al_teamName(country)} ${per}.` : `Altura promedio por puesto — ${al_teamName(country)} ${per}.`;
    return en ? `Average player height by position ${per}.` : `Altura promedio de los jugadores por puesto ${per}.`;
  }
  if (someTeams) return en ? `Average height of the selected teams' players ${per}.` : `Altura promedio de los jugadores de las selecciones elegidas ${per}.`;
  if (al_vsCountry()) return en ? `Average height of World Cup players vs. the average man of their birth country and cohort, ${per}.` : `Altura promedio de los mundialistas vs. el varón promedio de su país de nacimiento y generación, ${per}.`;
  return en ? `Average height of World Cup players ${per}.` : `Altura promedio de los mundialistas ${per}.`;
}
// Título: insight por default SOLO en las vistas de serie histórica (líneas o
// distribución) que muestran la media mundial; apenas se customiza (un país, por
// puesto, o barras) pasa a uno neutral/descriptivo. El PNG hereda el del DOM.
function al_title() {
  const insight = (al_mode() === 'line' || al_mode() === 'box') && !al_byPos() && al_selTeams().filter(c => c !== AL_WORLD).length === 0;
  return insight ? al_tt('c10-title', 'Los mundialistas son cada vez más altos') : al_tt('c10-title-neutral', 'La altura de los mundialistas');
}
function al_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="10"]') || document;
  const titleEl = block.querySelector('.chart-title'); if (titleEl) titleEl.textContent = al_title();
  const subEl = block.querySelector('.chart-subtitle'); if (subEl) subEl.textContent = al_subtitle();
}

//==================================================================
//  Chips + buscador + toggles
//==================================================================
function al_renderChips() {
  const c = document.getElementById('al-selected-chips'); if (!c) return;
  c.innerHTML = '';
  const scatter = al_mode() === 'scatter';
  Array.from(al_selMap().keys()).forEach(code => {
    if (code !== AL_WORLD && !al_teams[code]) return;
    if (code === AL_WORLD && (al_mode() === 'bar' || scatter)) return;   // en barras/dispersión el "Mundial" no es un punto
    // en dispersión el color del chip es el de la confederación (igual que el punto)
    const bg = code === AL_WORLD ? AL_REAL : (scatter ? ((typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[al_teamConfed && al_teamConfed[code]]) || '#888') : al_getColor(code));
    const chip = document.createElement('span'); chip.className = 'm-selected-chip'; chip.style.background = bg; chip.style.color = '#fff'; chip.textContent = al_teamName(code);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×'; x.addEventListener('click', () => al_toggleTeam(code)); chip.appendChild(x); c.appendChild(chip);
  });
}
function al_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupAlturaSearch() {
  const input = document.getElementById('al-search'), results = document.getElementById('al-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  // En barras solo se ofrecen las selecciones que JUEGAN el Mundial elegido (las
  // que tienen plantel ese año). En líneas/distribución, todas + el "Mundial".
  const all = () => {
    if (al_mode() === 'bar' || al_mode() === 'scatter') {   // solo selecciones que juegan el Mundial elegido
      const wc = String(((state[10] && state[10].period) || [])[1]);
      return Object.keys(al_teams || {}).filter(c => al_teams[c][wc]).map(code => ({ code, name: al_teamName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    const base = Object.keys(al_teams || {}).map(code => ({ code, name: al_teamName(code) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return [{ code: AL_WORLD, name: al_teamName(AL_WORLD) }].concat(base);
  };
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
// Toggle segmentado genérico (clase lg-seg-on)
function al_seg(ids, getCur, setCur, after) {
  const B = {}; ids.forEach(id => B[id] = document.getElementById('al-' + id)); if (Object.values(B).some(x => !x)) return null;
  function sync() { ids.forEach(id => { const on = getCur() === id.split('-').pop(); B[id].classList.toggle('lg-seg-on', on); B[id].setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  ids.forEach(id => B[id].addEventListener('click', () => { const v = id.split('-').pop(); if (getCur() === v) return; setCur(v); sync(); if (after) after(); al_renderChips(); drawAltura(); }));
  sync(); return sync;
}
function setupAlturaToggles() {
  // Forma: líneas / distribución / barras / dispersión. Al pasar a distribución, una sola selección.
  al_seg(['mode-line', 'mode-box', 'mode-bar', 'mode-scatter'], () => state[10].mode, v => {
    state[10].mode = v; al_scHoverConf = null; al_scHidden.clear();
    if (v === 'box') { const sel = al_selMap(); if (sel.size > 1) { const first = sel.keys().next().value; sel.clear(); sel.set(first, 0); } }
  });
  // Puesto del ranking de barras: todos / cada puesto.
  al_seg(['barpos-all', 'barpos-GK', 'barpos-DEF', 'barpos-MID', 'barpos-FWD'], () => al_barPos(), v => { state[10].barPos = v; });
  // Desglose: selección (buscador) / por puesto. Al pasar a "por puesto", una sola selección.
  al_seg(['view-sel', 'view-pos'], () => (al_byPos() ? 'pos' : 'sel'), v => {
    state[10].byPos = (v === 'pos');
    if (v === 'pos') { const sel = al_selMap(); if (sel.size > 1) { const first = sel.keys().next().value; sel.clear(); sel.set(first, 0); } }
  });
  // Selector de puesto único (solo en box+puesto)
  al_seg(['boxpos-GK', 'boxpos-DEF', 'boxpos-MID', 'boxpos-FWD'], () => al_boxPos(), v => { state[10].boxPos = v; });
  // vs país
  const vs = document.getElementById('al-vscountry');
  if (vs) { const sync = () => { vs.classList.toggle('lg-seg-on', al_vsCountry()); vs.setAttribute('aria-pressed', al_vsCountry() ? 'true' : 'false'); }; vs.addEventListener('click', () => { state[10].vsCountry = !al_vsCountry(); sync(); drawAltura(); }); sync(); }
}
function setupAlturaSlider() { setupWcRangeSlider({ fromId: 'al-slider-from', toId: 'al-slider-to', dispId: 'al-range-display', trackId: 'al-range-track-active', years: al_years, get: () => state[10].period, set: (p) => { state[10].period = p; }, onChange: () => drawAltura() }); }
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
  if (state[10].byPos == null) state[10].byPos = false;
  if (state[10].vsCountry == null) state[10].vsCountry = true;
  if (!state[10].boxPos) state[10].boxPos = 'DEF';
  if (!state[10].barPos) state[10].barPos = 'all';
  if (!(state[10].selectedTeams instanceof Map)) state[10].selectedTeams = new Map(state[10].selectedTeams || []);
  if (state[10].selectedTeams.size === 0) state[10].selectedTeams.set(AL_WORLD, 0);   // default: Mundial (todos)

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
