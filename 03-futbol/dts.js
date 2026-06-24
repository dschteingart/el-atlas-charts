// =============================================================
//  El Atlas N°3 — Chart 11: DTs (nacionalidad del entrenador + migración)
// =============================================================
// Espejo del chart 9 (orígenes), pero para el banquillo: ¿de qué país son los
// DTs de cada Mundial, y cuántos dirigen a OTRA selección? Cada nacionalidad de
// DT es UNA línea estilo OWID.
//   - Universo: "Todos" (todos los DTs de ese país) ↔ "Exportados" (los que
//     dirigen a otra selección). Brasil y Argentina saltan: exportan técnicos
//     a medio mundo pero casi nunca importan uno.
//   - Agrupación: País ↔ Región (confederación FIFA del DT).
//   - Forma: Líneas ↔ Área apilada ↔ Barras ↔ Flujos (Sankey, el default).
//   - Slider temporal por Mundial + buscador.
// Datos: DTS (data-dts.js), estructura idéntica a ORIGENES. 1930-2022.
//
// Mobile-first PNG (square default) — ver skill graficos-atlas.

//==================================================================
//  Constantes
//==================================================================
// Paleta estándar del Atlas (12 hues distintos en hue Y valor; del chart 3 de N°2).
// Norma para todas las series por país/categoría del número. La primera
// repetición recién aparece con 13+ series.
const DT_PALETTE_EXT = [
  '#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
  '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'
];
function dt_colorForSlot(slot) { return DT_PALETTE_EXT[slot % DT_PALETTE_EXT.length]; }
const DT_COL_OTH = '#CFC9BC', DT_COL_OTH_TXT = '#8A8170';

// Default país: las grandes escuelas de técnicos. Default región: 6 confederaciones.
const DT_BIG = ['BRA', 'ARG', 'ITA', 'DEU', 'FRA'];
const DT_REGION_ORDER = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
const DT_REGION_NAME = {
  CONMEBOL: ['Sudamérica', 'South America'], UEFA: ['Europa', 'Europe'],
  CONCACAF: ['Norteamérica y Caribe', 'North America & Caribbean'],
  CAF: ['África', 'Africa'], AFC: ['Asia', 'Asia'], OFC: ['Oceanía', 'Oceania'], OTRO: ['Otros', 'Other']
};

const DT_W_DESKTOP = 1100, DT_H_DESKTOP = 520;
const DT_W_MOBILE = 1100, DT_H_MOBILE = 1000;
const DT_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 64 };
const DT_MARGIN_MOBILE = { top: 64, right: 168, bottom: 150, left: 96 };
function dt_getMargins(format) {
  switch (format) {
    case 'public': return { top: 40, right: 168, bottom: 92, left: 78 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96, left: 112 };
    case 'square': return { top: 44, right: 184, bottom: 74, left: 112 };
    case 'mobile': return { top: 64, right: 176, bottom: 150, left: 116 };
    default: return { ...DT_MARGIN_DESKTOP };
  }
}
let DT_W = DT_W_DESKTOP, DT_H = DT_H_DESKTOP, DT_MARGIN = { ...DT_MARGIN_DESKTOP };
const DT_NS = 'http://www.w3.org/2000/svg';
const dt_el = (t) => document.createElementNS(DT_NS, t);
const DT_YEAR_MIN = 1930, DT_YEAR_MAX = 2026;   // 1930-2022 jfjelstul + 2026 (suplemento Wikipedia)

//==================================================================
//  Data + proyección según toggles
//==================================================================
let dt_years = null, dt_totals = null, dt_rawTeams = null, dt_names = null, dt_confed = null, dt_regionAgg = null;
function dt_initData() {
  if (dt_rawTeams) return;
  if (typeof DTS === 'undefined') { console.error('[origenes] DTS no cargado'); dt_years = []; dt_rawTeams = []; dt_totals = { all: {}, exp: {} }; dt_names = {}; dt_confed = {}; return; }
  dt_years = DTS.years.slice();
  dt_names = DTS.names;
  dt_confed = DTS.confed;
  dt_totals = { all: {}, exp: {} };
  DTS.totals.all.forEach(p => dt_totals.all[p[0]] = p[1]);
  DTS.totals.exp.forEach(p => dt_totals.exp[p[0]] = p[1]);
  dt_rawTeams = DTS.teams;          // [{iso3, all:[[y,n]], exp:[[y,n]]}]
  // agregados por región (confederación) y universo
  dt_regionAgg = {};
  DT_REGION_ORDER.concat(['OTRO']).forEach(r => dt_regionAgg[r] = { all: {}, exp: {} });
  dt_rawTeams.forEach(t => {
    const r = dt_confed[t.iso3] || 'OTRO';
    t.all.forEach(p => dt_regionAgg[r].all[p[0]] = (dt_regionAgg[r].all[p[0]] || 0) + p[1]);
    t.exp.forEach(p => dt_regionAgg[r].exp[p[0]] = (dt_regionAgg[r].exp[p[0]] || 0) + p[1]);
  });
}
function dt_universe() { return (state[11] && state[11].universe === 'exp') ? 'exp' : 'all'; }
function dt_group() { return (state[11] && state[11].group === 'region') ? 'region' : 'pais'; }
function dt_isAbs() { return !!(state[11] && state[11].metric === 'abs'); }
// Valor a graficar de un punto [year, pct, n]: cantidad o porcentaje.
function dt_mv(p) { return dt_isAbs() ? p[2] : p[1]; }

// Construye la vista (byIso + lista) para los toggles actuales: pts=[[year,pct,n]]
let dt_byIso = null, dt_teams = null;
function dt_project() {
  dt_initData();
  const U = dt_universe(), G = dt_group();
  const den = dt_totals[U];
  // Dentro del período activo del país (de su 1ª a su última aparición) mostramos
  // 0 los Mundiales sin DT, no un gap. Fuera de ese span (antes de existir o tras
  // desaparecer) no se dibuja — así Serbia no figura en 0 en 1950 (era Yugoslavia).
  const mk = (countsByYear) => {
    const present = Object.keys(countsByYear).map(Number).filter(y => countsByYear[y] > 0).sort((a, b) => a - b);
    if (!present.length) return [];
    const first = present[0], last = present[present.length - 1];
    const pts = [];
    dt_years.forEach(y => {
      if (y < first || y > last) return;
      const D = den[y] || 0; if (D <= 0) return;
      pts.push([y, +(100 * (countsByYear[y] || 0) / D).toFixed(1), countsByYear[y] || 0]);
    });
    return pts;
  };
  dt_byIso = {}; dt_teams = [];
  if (G === 'region') {
    DT_REGION_ORDER.forEach(r => {
      const pts = mk(dt_regionAgg[r][U]);
      if (!pts.length) return;
      const tm = { iso3: r, name: DT_REGION_NAME[r][0], en: DT_REGION_NAME[r][1], pts };
      dt_byIso[r] = tm; dt_teams.push(tm);
    });
  } else {
    dt_rawTeams.forEach(t => {
      const byY = {}; (U === 'exp' ? t.exp : t.all).forEach(p => byY[p[0]] = p[1]);
      const pts = mk(byY);
      const nm = dt_names[t.iso3] || [t.iso3, t.iso3];
      const tm = { iso3: t.iso3, name: nm[0], en: nm[1], pts, total: pts.reduce((s, p) => s + p[2], 0) };
      dt_byIso[t.iso3] = tm; if (pts.length) dt_teams.push(tm);
    });
    dt_teams.sort((a, b) => b.total - a.total);
  }
}

//==================================================================
//  Helpers
//==================================================================
function dt_displayName(iso3, fallback) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tm = dt_byIso ? dt_byIso[iso3] : null;
  if (tm) return (lang === 'en' && tm.en) ? tm.en : (tm.name || fallback || iso3);
  const nm = dt_names && dt_names[iso3];
  if (nm) return lang === 'en' ? nm[1] : nm[0];
  return fallback || iso3;
}
function dt_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function dt_measureText(text, size, weight) {
  if (!dt_measureText._c) dt_measureText._c = document.createElement('canvas').getContext('2d');
  dt_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return dt_measureText._c.measureText(text).width;
}
function dt_selMap() {
  if (!(state[11].selectedCountries instanceof Map)) state[11].selectedCountries = new Map(state[11].selectedCountries || []);
  return state[11].selectedCountries;
}
function dt_getColor(iso3) { const s = dt_selMap().get(iso3); return s == null ? null : dt_colorForSlot(s); }
function dt_nextFreeSlot() { const u = new Set(Array.from(dt_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function dt_toggle(iso3) {
  const sel = dt_selMap();
  if (sel.has(iso3)) sel.delete(iso3); else sel.set(iso3, dt_nextFreeSlot());
  // En barras, editar a mano fija la selección (deja de auto-ajustarse al año).
  if (state[11].mode === 'bar') state[11].barCustom = true;
  dt_renderChips(); drawDts();
}
function dt_xTicks(y0, y1, plotW, minGapPx) {
  const ys = (dt_years || []).filter(y => y >= y0 && y <= y1);
  if (!ys.length) return [];
  const xOf = (y) => ((y - y0) / (y1 - y0)) * plotW;
  const out = [ys[0]]; let lastX = xOf(ys[0]);
  for (let i = 1; i < ys.length - 1; i++) { const x = xOf(ys[i]); if (x - lastX >= minGapPx) { out.push(ys[i]); lastX = x; } }
  const last = ys[ys.length - 1];
  if (out[out.length - 1] !== last) { if (out.length > 1 && xOf(last) - lastX < minGapPx) out.pop(); out.push(last); }
  return out;
}
function dt_niceScale(maxVal) {
  const cands = [[10, 2], [15, 5], [20, 5], [25, 5], [30, 5], [40, 10], [50, 10], [60, 20], [80, 20], [100, 20]];
  for (const [m, s] of cands) if (maxVal <= m + 0.001) { const ticks = []; for (let v = 0; v <= m; v += s) ticks.push(v); return { max: m, ticks }; }
  return { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
}
// Escala "linda" para cantidades absolutas (~5 ticks redondos).
function dt_niceCount(maxVal) {
  const m = Math.max(maxVal, 1);
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const top = ([1, 1.5, 2, 3, 5, 10].map(x => x * pow).find(c => c >= m - 0.001)) || 10 * pow;
  const step = top / 5, ticks = [];
  for (let v = 0; v <= top + 1e-6; v += step) ticks.push(Math.round(v));
  return { max: top, ticks };
}
const dt_tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);

//==================================================================
//  DRAW
//==================================================================
function drawDts() {
  const svg = document.getElementById('chart11');
  if (!svg) return;
  svg.innerHTML = '';
  dt_clearHover(svg);   // matar el hover del render anterior (si no, en barras/flujos sale un tooltip fantasma del modo líneas)
  dt_project();
  // Solo en barras el slider representa UN Mundial → single-thumb. Flujos
  // (sankey) agrega un RANGO de Mundiales, así que usa el slider doble.
  const sliderEl = document.getElementById('dt-range-slider');
  if (sliderEl) sliderEl.classList.toggle('s-range-single', state[11].mode === 'bar');
  // En flujos (sankey) y en la tendencia (local vs. extranjero) se ocultan los
  // toggles que no aplican (universo, métrica, agrupación); el buscador lo
  // maneja dt_renderChips.
  const dt_aggView = state[11].mode === 'sankey' || state[11].mode === 'trend';
  ['dt-univ-all', 'dt-metric-pct', 'dt-group-pais'].forEach(id => { const e = document.getElementById(id); const g = e && e.closest('.lg-mode'); if (g) g.style.display = dt_aggView ? 'none' : ''; });

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && dt_isMobile();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; DT_W = f.vbW;
    DT_H = square ? 910 : newsletter ? 860 : f.vbH;
    DT_MARGIN = dt_getMargins(editorFormat);
  } else if (mobile) { DT_W = DT_W_MOBILE; DT_H = DT_H_MOBILE; DT_MARGIN = { ...DT_MARGIN_MOBILE }; }
  else { DT_W = DT_W_DESKTOP; DT_H = DT_H_DESKTOP; DT_MARGIN = { ...DT_MARGIN_DESKTOP }; }
  let PLOT_W = DT_W - DT_MARGIN.left - DT_MARGIN.right;
  const PLOT_H = DT_H - DT_MARGIN.top - DT_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${DT_W} ${DT_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const sel = dt_selMap();
  const selected = Array.from(sel.keys()).filter(iso => dt_byIso[iso]);
  const stackMode = !!(state[11] && state[11].mode === 'stack');
  const tt = dt_tt;

  const period = (state[11] && state[11].period) || [DT_YEAR_MIN, DT_YEAR_MAX];
  const y0 = period[0], y1 = period[1];
  const inP = (pts) => pts.filter(p => p[0] >= y0 && p[0] <= y1 && p[1] != null);
  // Display del slider: barras = un Mundial; el resto (líneas/área/flujos) = rango.
  const _dispEl = document.getElementById('dt-range-display');
  if (_dispEl) _dispEl.textContent = (state[11].mode === 'bar') ? y1 : (y0 === y1 ? y0 : (y0 + '–' + y1));

  // Modo BARRAS: ranking de UN Mundial (el extremo derecho del slider). Sale
  // por acá; no usa la maquinaria de líneas/área.
  if (state[11].mode === 'bar') { dt_drawBars(svg, { bigFmt, isPngFormat, wc: y1 }); dt_applyHeadings(aeCfg); return; }
  if (state[11].mode === 'sankey') { dt_drawSankey(svg, { bigFmt, isPngFormat, y0, y1 }); dt_applyHeadings(aeCfg); return; }
  if (state[11].mode === 'trend') { dt_drawTrend(svg, { bigFmt, isPngFormat, y0, y1 }); dt_applyHeadings(aeCfg); return; }

  // escala Y (depende de la métrica: % o cantidad)
  const abs = dt_isAbs();
  let yScale;
  if (stackMode) {
    if (abs) {
      let mx = 0; dt_years.filter(y => y >= y0 && y <= y1).forEach(y => { const T = dt_totals[dt_universe()][y] || 0; if (T > mx) mx = T; });
      yScale = dt_niceCount(mx);
    } else yScale = { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
  } else {
    let maxVal = 0;
    selected.forEach(iso => inP(dt_byIso[iso].pts).forEach(p => { const v = dt_mv(p); if (v > maxVal) maxVal = v; }));
    yScale = abs ? dt_niceCount(maxVal) : dt_niceScale(Math.max(maxVal, 1));
  }

  // margen derecho dinámico
  const labelOffset = bigFmt ? 12 : 6;
  let maxLabelW = 0;
  const endNames = selected.map(iso => dt_displayName(iso, dt_byIso[iso].name));
  if (stackMode) endNames.push(tt('c11-label-otros', 'Otros'));
  const endSuffix = isPngFormat ? '  100%' : '';
  endNames.forEach(nm => { const w = dt_measureText(nm + endSuffix, SIZES.label, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
  const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
  DT_MARGIN.right = Math.min(Math.round(DT_W * 0.42), Math.max(DT_MARGIN.right, neededRight));
  PLOT_W = DT_W - DT_MARGIN.left - DT_MARGIN.right;

  const xS = (yr) => DT_MARGIN.left + ((yr - y0) / (y1 - y0)) * PLOT_W;
  const yS = (v) => DT_MARGIN.top + PLOT_H - (v / yScale.max) * PLOT_H;

  // grid + eje X
  dt_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = dt_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', DT_MARGIN.top); gl.setAttribute('y2', DT_MARGIN.top + PLOT_H); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = dt_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', DT_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = dt_el('line'); gl.setAttribute('x1', DT_MARGIN.left); gl.setAttribute('x2', DT_MARGIN.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = dt_el('text'); lbl.setAttribute('x', DT_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = abs ? v : v + '%'; svg.appendChild(lbl);
  });
  // título eje Y (depende de métrica + universo)
  const yT = dt_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${DT_MARGIN.left - (mobile || mobilePng ? 84 : bigFmt ? 78 : 44)}, ${DT_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px';
  yT.textContent = abs
    ? (dt_universe() === 'exp' ? tt('c11-axis-n-exp', 'DTs "exportados" (cantidad)') : tt('c11-axis-n-all', 'DTs (cantidad)'))
    : (dt_universe() === 'exp' ? tt('c11-axis-y-exp', '% de los DTs "exportados"') : tt('c11-axis-y-all', '% de DTs (según nacionalidad)'));
  svg.appendChild(yT);

  function build(pts) { const v = pts.filter(p => p[1] != null); if (!v.length) return ''; return v.map((p, i) => (i === 0 ? 'M' : 'L') + xS(p[0]).toFixed(1) + ',' + yS(dt_mv(p)).toFixed(1)).join(' '); }
  const endLabels = [];
  const halosG = dt_el('g'); svg.appendChild(halosG);
  const linesG = dt_el('g'); svg.appendChild(linesG);
  const dotsG = dt_el('g'); svg.appendChild(dotsG);
  const hitG = dt_el('g'); svg.appendChild(hitG);

  function drawSeries(pts, color, opts) {
    opts = opts || {};
    const d = build(pts); if (!d) return;
    const halo = dt_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); if (opts.iso) halo.setAttribute('data-dt', opts.iso); halosG.appendChild(halo);
    const path = dt_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (opts.iso) { path.setAttribute('data-dt', opts.iso); path.setAttribute('data-base-w', lineW); path.classList.add('dt-colored'); }
    linesG.appendChild(path);
    if (opts.markers) pts.filter(p => p[1] != null).forEach(p => {
      const c = dt_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(dt_mv(p))); c.setAttribute('r', dotR);
      c.setAttribute('fill', color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); if (opts.iso) c.setAttribute('data-dt', opts.iso); dotsG.appendChild(c);
    });
    if (opts.iso && !isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      const hit = dt_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 9)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => dt_emph(opts.iso)); hit.addEventListener('mouseleave', () => dt_emph(null));
      hit.addEventListener('click', (ev) => { ev.stopPropagation(); dt_toggle(opts.iso); }); hitG.appendChild(hit);
    }
    const last = pts.filter(p => p[1] != null).slice(-1)[0];
    // Etiqueta siempre al borde derecho (no flotando en el fin de líneas que
    // terminan antes, p.ej. Oceanía que casi no exporta y corta en 2006).
    if (last) endLabels.push({ iso: opts.iso, color, text: opts.label, x: xS(y1), idealY: yS(dt_mv(last)), valLast: dt_mv(last) });
  }

  const hoverSeries = [];
  if (stackMode) {
    const yrs = dt_years.filter(y => y >= y0 && y <= y1);
    const valOf = (iso, yr) => { const p = dt_byIso[iso].pts.find(q => q[0] === yr); return p ? dt_mv(p) : 0; };
    const bands = selected.map(iso => ({ iso, color: dt_getColor(iso), name: dt_displayName(iso, dt_byIso[iso].name), get: (yr) => valOf(iso, yr) }));
    // Banda "Otros" = lo no seleccionado. En modo región las 6 confederaciones
    // cubren el total, así que da 0 → no se dibuja (no existe un continente
    // "Otros"). Solo se agrega si aporta algo en algún año visible.
    const othGet = (yr) => { let s = 0; selected.forEach(iso => s += valOf(iso, yr)); const tot = abs ? (dt_totals[dt_universe()][yr] || 0) : 100; return Math.max(0, +(tot - s).toFixed(1)); };
    if (Math.max(0, ...yrs.map(othGet)) > (abs ? 0.5 : 0.3))
      bands.push({ iso: '_OTH', color: DT_COL_OTH, name: tt('c11-label-otros', 'Otros'), get: othGet });
    const areasG = dt_el('g'); svg.insertBefore(areasG, halosG);
    const lower = yrs.map(() => 0);
    bands.forEach(b => {
      const upper = yrs.map((yr, i) => lower[i] + b.get(yr));
      let d = 'M' + yrs.map((yr, i) => xS(yr).toFixed(1) + ',' + yS(upper[i]).toFixed(1)).join(' L');
      for (let i = yrs.length - 1; i >= 0; i--) d += ' L' + xS(yrs[i]).toFixed(1) + ',' + yS(lower[i]).toFixed(1);
      d += ' Z';
      const area = dt_el('path'); area.setAttribute('d', d); area.setAttribute('fill', b.color); area.setAttribute('fill-opacity', b.iso === '_OTH' ? 0.5 : 0.9);
      area.setAttribute('stroke', '#FAF8F3'); area.setAttribute('stroke-width', bigFmt ? 1.6 : 1); area.setAttribute('stroke-linejoin', 'round');
      if (b.iso !== '_OTH') {
        area.setAttribute('data-dt', b.iso); area.classList.add('dt-colored'); area.setAttribute('data-base-w', bigFmt ? 1.6 : 1);
        if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
          area.style.cursor = 'pointer'; area.addEventListener('mouseenter', () => dt_emph(b.iso)); area.addEventListener('mouseleave', () => dt_emph(null));
          area.addEventListener('click', (ev) => { ev.stopPropagation(); dt_toggle(b.iso); });
        }
      }
      areasG.appendChild(area);
      const li = yrs.length - 1, mid = (upper[li] + lower[li]) / 2;
      endLabels.push({ iso: b.iso === '_OTH' ? null : b.iso, color: b.iso === '_OTH' ? DT_COL_OTH_TXT : b.color, text: b.name, x: xS(yrs[li]), idealY: yS(mid), valLast: b.get(yrs[li]) });
      hoverSeries.push({ label: b.name, color: b.iso === '_OTH' ? DT_COL_OTH_TXT : b.color, pts: yrs.map((yr, i) => [yr, upper[i], b.get(yr)]) });
      yrs.forEach((yr, i) => { lower[i] = upper[i]; });
    });
  } else {
    selected.forEach(iso => {
      const tm = dt_byIso[iso];
      const pts = inP(tm.pts);                          // [year, pct, n]
      drawSeries(pts, dt_getColor(iso), { markers: true, iso, label: dt_displayName(iso, tm.name) });
      // hover: [year, valor-graficado, valor-a-mostrar] (ambos = métrica activa)
      hoverSeries.push({ label: dt_displayName(iso, tm.name), color: dt_getColor(iso), pts: pts.map(p => [p[0], dt_mv(p), dt_mv(p)]) });
    });
  }

  // etiquetas de fin: anti-colisión BIDIRECCIONAL. Un solo pase hacia abajo
  // apila todo en el borde cuando varias series quedan pegadas (p.ej. regiones
  // que casi no exportan, todas cerca de 0). Pase 1 hacia abajo; si el último
  // se desborda, pase 2 reacomodando hacia arriba; las desplazadas llevan guía.
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  const dt_topB = DT_MARGIN.top + (bigFmt ? 6 : 2), dt_botB = DT_MARGIN.top + PLOT_H;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = (i === 0) ? Math.max(l.idealY, dt_topB) : Math.max(l.idealY, endLabels[i - 1].y + GAP);
  });
  if (endLabels.length) {
    const lastL = endLabels[endLabels.length - 1];
    if (lastL.y > dt_botB) {
      lastL.y = dt_botB;
      for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - GAP);
    }
  }
  endLabels.forEach(l => { l.y = Math.max(l.y, dt_topB); l.shifted = Math.abs(l.y - l.idealY) > 1.5; });
  const endG = dt_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const g = dt_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); if (l.iso) g.setAttribute('data-dt', l.iso); endG.appendChild(g);
    }
    const txt = dt_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4)); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    if (l.iso) txt.setAttribute('data-dt', l.iso);
    const valTxt = (isPngFormat && l.valLast != null) ? '  ' + Math.round(l.valLast) + (abs ? '' : '%') : '';
    txt.textContent = l.text + valTxt; endG.appendChild(txt);
  });

  if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER) && hoverSeries.length)
    dt_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries, abs });

  dt_applyHeadings(aeCfg);
}

// Default de barras (modo país): las nacionalidades que MÁS aportaron DTs a ese
// Mundial. El eje es el origen del DT (no la selección que juega), así que NO se
// filtra por las selecciones presentes — un país puede aportar técnicos sin jugar.
const DT_DEFUNCT = ['CSK', 'YUG', 'SUN', 'DDR', 'SCG'];   // estados desaparecidos
const DT_BAR_COL = '#5E7E96';                            // azul coherente con el chart 2
// Default de barras: las nacionalidades que MÁS aportaron DTs a ESE Mundial,
// hasta 12 (= largo de la paleta, así cada barra tiene su color sin repetir).
// Excluye estados desaparecidos.
function dt_barDefault(wc) {
  dt_initData();
  const present = dt_rawTeams.map(t => { const p = t.all.find(q => q[0] === wc); return { iso: t.iso3, n: p ? p[1] : 0 }; })
    .filter(x => x.n > 0 && DT_DEFUNCT.indexOf(x.iso) < 0)
    .sort((a, b) => b.n - a.n || a.iso.localeCompare(b.iso));
  return present.slice(0, 12).map(x => x.iso);
}

// Ranking horizontal de UN Mundial. Aplica universo (todos/exportados) y
// métrica (% de ese Mundial / cantidad). Click en la barra la saca.
function dt_drawBars(svg, opt) {
  const bigFmt = opt.bigFmt, isPngFormat = opt.isPngFormat, wc = opt.wc;
  const abs = dt_isAbs(), U = dt_universe(), den = dt_totals[U][wc] || 0;
  const rows = Array.from(dt_selMap().keys()).filter(iso => dt_byIso[iso]).map(iso => {
    const p = dt_byIso[iso].pts.find(q => q[0] === wc);
    const n = p ? p[2] : 0;
    return { iso, name: dt_displayName(iso, dt_byIso[iso].name),
      n, v: abs ? n : (den ? +(100 * n / den).toFixed(1) : 0) };
  }).filter(r => r.n > 0)                                 // solo países presentes en ese Mundial
    .sort((a, b) => b.v - a.v || b.n - a.n);

  const fs = bigFmt ? 23 : 12.5;
  const top = DT_MARGIN.top + (bigFmt ? 26 : 16), bottom = bigFmt ? 24 : 12;
  let nameW = 0; rows.forEach(r => { const w = dt_measureText(r.name, fs, 600); if (w > nameW) nameW = w; });
  const valW = dt_measureText(abs ? '1888' : '100%', fs, 700);
  const left = (bigFmt ? 18 : 12) + nameW + (bigFmt ? 16 : 10);
  const right = valW + (bigFmt ? 22 : 14);
  const plotW = Math.max(40, DT_W - left - right);
  const availH = DT_H - top - bottom;
  // las barras llenan el alto disponible (con pocas, p.ej. 6 regiones, se
  // ensanchan para ocupar más pantalla).
  const rowH = rows.length ? Math.min(availH / rows.length, bigFmt ? 150 : 96) : 24;
  const barH = rowH * 0.6, maxV = Math.max(1, ...rows.map(r => r.v));
  const xW = (v) => Math.max(0, (v / maxV) * plotW);
  const baseline = (y) => y + fs * 0.34;
  // El Mundial mostrado va en el subtítulo (dt_subtitle), no dentro del gráfico.

  rows.forEach((r, i) => {
    const cy = top + i * rowH, midY = cy + rowH / 2, bw = xW(r.v);
    const nm = dt_el('text'); nm.setAttribute('x', left - (bigFmt ? 12 : 8)); nm.setAttribute('y', baseline(midY)); nm.setAttribute('text-anchor', 'end');
    nm.style.fontSize = fs + 'px'; nm.style.fontFamily = 'var(--sans)'; nm.style.fontWeight = '600'; nm.setAttribute('fill', 'var(--ink)'); nm.textContent = r.name; svg.appendChild(nm);
    const bar = dt_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', midY - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', DT_BAR_COL); svg.appendChild(bar);
    const vt = dt_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', baseline(midY));
    vt.style.fontSize = fs + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.setAttribute('fill', 'var(--ink)'); vt.textContent = abs ? r.n : (r.v + '%'); svg.appendChild(vt);
    if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) { bar.style.cursor = 'pointer'; bar.addEventListener('click', () => dt_toggle(r.iso)); }
  });
  // en barras el slider representa UN Mundial → mostrar solo ese año
  const disp = document.getElementById('dt-range-display'); if (disp) disp.textContent = wc;
}

// SANKEY: flujos nacionalidad -> selección de los DTs "exportados", agregados
// sobre el RANGO de Mundiales elegido [y0,y1]. Izquierda = nacionalidad del DT,
// derecha = selección que dirige. Top-N orígenes y destinos; el resto en "Otros".
function dt_drawSankey(svg, opt) {
  const bigFmt = opt.bigFmt, isPngFormat = opt.isPngFormat, y0 = opt.y0, y1 = opt.y1;
  // Agregar los flujos de todos los Mundiales del rango: sumar n por par
  // (nacionalidad → selección) a lo largo de [y0,y1].
  const flowMap = {};
  ((typeof DTS !== 'undefined' && DTS.years) || []).forEach(y => {
    if (y < y0 || y > y1) return;
    ((DTS.flows && DTS.flows[String(y)]) || []).forEach(([b, r, n]) => {
      const k = b + '|' + r; flowMap[k] = (flowMap[k] || 0) + n;
    });
  });
  const flows = Object.keys(flowMap).map(k => { const p = k.split('|'); return [p[0], p[1], flowMap[k]]; });
  if (!flows.length) {
    const msg = dt_el('text'); msg.setAttribute('x', DT_W / 2); msg.setAttribute('y', DT_H / 2); msg.setAttribute('text-anchor', 'middle');
    msg.style.fontFamily = 'var(--sans)'; msg.style.fontSize = (bigFmt ? 24 : 14) + 'px'; msg.setAttribute('fill', 'var(--ink-muted)');
    msg.textContent = dt_tt('c11-sankey-empty', 'Sin DTs «exportados» en el período elegido.'); svg.appendChild(msg); return;
  }
  const OS = '_OTRO_S', OT = '_OTRO_T', TOPN = bigFmt ? 9 : 12;
  const srcTot = {}, tgtTot = {};
  flows.forEach(([b, r, n]) => { srcTot[b] = (srcTot[b] || 0) + n; tgtTot[r] = (tgtTot[r] || 0) + n; });
  const srcSet = new Set(Object.keys(srcTot).sort((a, b) => srcTot[b] - srcTot[a]).slice(0, TOPN));
  const tgtSet = new Set(Object.keys(tgtTot).sort((a, b) => tgtTot[b] - tgtTot[a]).slice(0, TOPN));
  // Para el tooltip de "Otros": el desglose de los que quedaron fuera del top-N.
  const srcOthers = Object.keys(srcTot).filter(b => !srcSet.has(b)).sort((a, b) => srcTot[b] - srcTot[a]).map(b => [b, srcTot[b]]);
  const tgtOthers = Object.keys(tgtTot).filter(r => !tgtSet.has(r)).sort((a, b) => tgtTot[b] - tgtTot[a]).map(r => [r, tgtTot[r]]);
  const agg = {};
  flows.forEach(([b, r, n]) => { const s = srcSet.has(b) ? b : OS, t = tgtSet.has(r) ? r : OT; agg[s + '|' + t] = (agg[s + '|' + t] || 0) + n; });
  const srcVal = {}, tgtVal = {};
  Object.keys(agg).forEach(k => { const p = k.split('|'); srcVal[p[0]] = (srcVal[p[0]] || 0) + agg[k]; tgtVal[p[1]] = (tgtVal[p[1]] || 0) + agg[k]; });
  const srcNodes = Object.keys(srcVal).filter(x => x !== OS).sort((a, b) => srcVal[b] - srcVal[a]); if (srcVal[OS]) srcNodes.push(OS);
  // Un color por país de ORIGEN (paleta multicolor); "Otros" en gris.
  const srcColor = {}; let _ci = 0; srcNodes.forEach(iso => srcColor[iso] = (iso === OS) ? '#9C928A' : dt_colorForSlot(_ci++));
  const tgtNodes = Object.keys(tgtVal).filter(x => x !== OT).sort((a, b) => tgtVal[b] - tgtVal[a]); if (tgtVal[OT]) tgtNodes.push(OT);
  const sIdx = {}, tIdx = {}; srcNodes.forEach((k, i) => sIdx[k] = i); tgtNodes.forEach((k, i) => tIdx[k] = i);

  const nmOf = (iso) => (iso === OS || iso === OT) ? dt_tt('c11-sankey-otros', 'Otros') : dt_displayName(iso);
  const fs = bigFmt ? 19 : 11.5;
  const top = DT_MARGIN.top + (bigFmt ? 10 : 6), bottom = bigFmt ? 18 : 10, availH = DT_H - top - bottom;
  const nodeW = bigFmt ? 13 : 9, padLbl = bigFmt ? 9 : 6;
  let lblWs = 0, lblWt = 0;
  srcNodes.forEach(s => { const w = dt_measureText(nmOf(s), fs, 600); if (w > lblWs) lblWs = w; });
  tgtNodes.forEach(t => { const w = dt_measureText(nmOf(t), fs, 600); if (w > lblWt) lblWt = w; });
  const leftX = (bigFmt ? 14 : 10) + lblWs + padLbl;
  const rightX = DT_W - (bigFmt ? 14 : 10) - lblWt - padLbl - nodeW;
  const gap = bigFmt ? 9 : 5, totalN = Object.values(agg).reduce((a, b) => a + b, 0);
  const usableL = availH - Math.max(0, srcNodes.length - 1) * gap, usableR = availH - Math.max(0, tgtNodes.length - 1) * gap;
  const scale = Math.min(usableL, usableR) / totalN;
  const stack = (nodes, val) => { let y = top; const pos = {}; nodes.forEach(k => { const h = Math.max(1.5, val[k] * scale); pos[k] = { y0: y, y1: y + h, h }; y += h + gap; }); return pos; };
  const sPos = stack(srcNodes, srcVal), tPos = stack(tgtNodes, tgtVal);

  const links = Object.keys(agg).map(k => { const p = k.split('|'); return { s: p[0], t: p[1], n: agg[k] }; })
    .sort((a, b) => (sIdx[a.s] - sIdx[b.s]) || (tIdx[a.t] - tIdx[b.t]));
  const sOff = {}, tOff = {}; srcNodes.forEach(k => sOff[k] = sPos[k].y0); tgtNodes.forEach(k => tOff[k] = tPos[k].y0);
  const tooltip = document.getElementById('tooltip11');
  const linksG = dt_el('g'); svg.appendChild(linksG);
  links.forEach(L => {
    const h = L.n * scale, y0 = sOff[L.s], y1 = tOff[L.t]; sOff[L.s] += h; tOff[L.t] += h;
    const x0 = leftX + nodeW, x1 = rightX, xm = (x0 + x1) / 2;
    const d = `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1} L${x1},${y1 + h} C${xm},${y1 + h} ${xm},${y0 + h} ${x0},${y0 + h} Z`;
    const path = dt_el('path'); path.setAttribute('d', d); path.setAttribute('fill', srcColor[L.s]); path.setAttribute('fill-opacity', 0.42); path.setAttribute('stroke', 'none');
    if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      path.style.cursor = 'default';
      path.addEventListener('mouseenter', () => { path.setAttribute('fill-opacity', 0.72); if (tooltip) { tooltip.innerHTML = `<strong>${nmOf(L.s)} → ${nmOf(L.t)}</strong><br>${L.n} ${L.n === 1 ? dt_tt('c11-sankey-dt1', 'DT') : dt_tt('c11-sankey-dtN', 'DTs')}`; tooltip.style.display = 'block'; tooltip.style.opacity = '1'; } });
      path.addEventListener('mousemove', (ev) => { if (!tooltip) return; const rc = svg.getBoundingClientRect(); const _x = ev.clientX - rc.left, _w = tooltip.offsetWidth || 170; tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; });   // si no entra a la derecha, a la izquierda del cursor
      path.addEventListener('mouseleave', () => { path.setAttribute('fill-opacity', 0.42); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } });
    }
    linksG.appendChild(path);
  });
  const nodesG = dt_el('g'); svg.appendChild(nodesG);
  // Tooltip de nodo: total de DTs por país (= grosor de la barra). En "Otros",
  // total + desglose por país de los que quedaron fuera del top-N.
  const dtN = (n) => n + ' ' + (n === 1 ? dt_tt('c11-sankey-dt1', 'DT') : dt_tt('c11-sankey-dtN', 'DTs'));
  const moveTip = (ev) => { if (!tooltip) return; const rc = svg.getBoundingClientRect(); const _x = ev.clientX - rc.left, _w = tooltip.offsetWidth || 180; tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; };
  function nodeTipHtml(k, side) {
    const total = (side === 'src' ? srcVal[k] : tgtVal[k]) || 0;
    if (k !== OS && k !== OT) return `<strong>${nmOf(k)}</strong><br>${dtN(total)}`;
    const list = (side === 'src' ? srcOthers : tgtOthers);
    let html = `<strong>${dt_tt('c11-sankey-otros', 'Otros')}</strong> · ${dtN(total)}<div style="margin-top:5px;display:grid;grid-template-columns:auto auto;gap:1px 12px;">`;
    list.slice(0, 14).forEach(([iso, n]) => { html += `<span>${dt_displayName(iso)}</span><strong style="text-align:right;font-variant-numeric:tabular-nums;">${n}</strong>`; });
    html += '</div>';
    if (list.length > 14) html += `<div style="margin-top:3px;opacity:.7;">+${list.length - 14} ${dt_tt('c11-sankey-more', 'más')}</div>`;
    return html;
  }
  const nodeHover = !isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  const drawCol = (nodes, pos, x, side) => nodes.forEach(k => {
    const p = pos[k];
    const rect = dt_el('rect'); rect.setAttribute('x', x); rect.setAttribute('y', p.y0); rect.setAttribute('width', nodeW); rect.setAttribute('height', Math.max(1.5, p.h));
    rect.setAttribute('fill', side === 'src' ? srcColor[k] : '#9C928A'); rect.setAttribute('rx', 1.5); nodesG.appendChild(rect);
    const txt = dt_el('text'); txt.setAttribute('x', side === 'src' ? x - padLbl : x + nodeW + padLbl); txt.setAttribute('y', (p.y0 + p.y1) / 2 + fs * 0.34);
    txt.setAttribute('text-anchor', side === 'src' ? 'end' : 'start'); txt.style.fontSize = fs + 'px'; txt.style.fontFamily = 'var(--sans)'; txt.style.fontWeight = '600'; txt.setAttribute('fill', 'var(--ink)');
    txt.textContent = nmOf(k); nodesG.appendChild(txt);
    if (nodeHover) [rect, txt].forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', () => { if (tooltip) { tooltip.innerHTML = nodeTipHtml(k, side); tooltip.style.display = 'block'; tooltip.style.opacity = '1'; } });
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', () => { if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } });
    });
  });
  drawCol(srcNodes, sPos, leftX, 'src'); drawCol(tgtNodes, tPos, rightX, 'tgt');
}

// Vista "Local vs. extranjero" (estilo natividad, chart 6): dos líneas por
// Mundial — % de selecciones con DT de su propio país vs. con DT extranjero.
// Se cruzan en 2026. Es el modo por default. Datos: dt_totals (all/exp).
const DT_COL_LOCAL = '#3E5A6E';     // DT local (azul pizarra, como natividad)
const DT_COL_FOREIGN = '#BE5D32';   // DT extranjero (terracota — la historia)
function dt_drawTrend(svg, opt) {
  const bigFmt = opt.bigFmt, isPngFormat = opt.isPngFormat, y0 = opt.y0, y1 = opt.y1;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3, dotR = bigFmt ? 4.5 : 2.6;
  const localLbl = dt_tt('c11-trend-local', 'DT local'), foreignLbl = dt_tt('c11-trend-foreign', 'DT extranjero');
  const sfx = isPngFormat ? '  100%' : '';
  const maxLabelW = Math.max(dt_measureText(localLbl + sfx, SIZES.label, bigFmt ? 700 : 600), dt_measureText(foreignLbl + sfx, SIZES.label, bigFmt ? 700 : 600));
  DT_MARGIN.right = Math.min(Math.round(DT_W * 0.42), Math.max(DT_MARGIN.right, (bigFmt ? 12 : 6) + maxLabelW + (bigFmt ? 16 : 8)));
  const PLOT_W = DT_W - DT_MARGIN.left - DT_MARGIN.right, PLOT_H = DT_H - DT_MARGIN.top - DT_MARGIN.bottom;
  const yScale = { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
  const xS = (yr) => DT_MARGIN.left + ((yr - y0) / (y1 - y0 || 1)) * PLOT_W;
  const yS = (v) => DT_MARGIN.top + PLOT_H - (v / yScale.max) * PLOT_H;
  // grid + eje X
  dt_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = dt_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', DT_MARGIN.top); gl.setAttribute('y2', DT_MARGIN.top + PLOT_H); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = dt_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', DT_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18)); lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = dt_el('line'); gl.setAttribute('x1', DT_MARGIN.left); gl.setAttribute('x2', DT_MARGIN.left + PLOT_W); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = dt_el('text'); lbl.setAttribute('x', DT_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4)); lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = v + '%'; svg.appendChild(lbl);
  });
  const yT = dt_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${DT_MARGIN.left - (bigFmt ? 78 : 44)}, ${DT_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = dt_tt('c11-trend-axis', '% de las selecciones'); svg.appendChild(yT);
  // series: local vs extranjero (de los totales por año)
  const yrs = dt_years.filter(y => y >= y0 && y <= y1);
  const localPts = [], foreignPts = [];
  yrs.forEach(y => { const all = dt_totals.all[y] || 0, exp = dt_totals.exp[y] || 0; if (all > 0) { const f = +(100 * exp / all).toFixed(1); foreignPts.push([y, f, exp]); localPts.push([y, +(100 - f).toFixed(1), all - exp]); } });
  const halosG = dt_el('g'); svg.appendChild(halosG); const linesG = dt_el('g'); svg.appendChild(linesG); const dotsG = dt_el('g'); svg.appendChild(dotsG);
  const endLabels = [];
  function drawLine(pts, color, label) {
    if (!pts.length) return;
    const d = 'M' + pts.map(p => xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' L');
    const halo = dt_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halosG.appendChild(halo);
    const path = dt_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round'); linesG.appendChild(path);
    pts.forEach(p => { const c = dt_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); dotsG.appendChild(c); });
    const last = pts[pts.length - 1];
    endLabels.push({ color, text: label, x: xS(last[0]), idealY: yS(last[1]), valLast: last[1] });
  }
  drawLine(localPts, DT_COL_LOCAL, localLbl);
  drawLine(foreignPts, DT_COL_FOREIGN, foreignLbl);
  // etiquetas de fin con anti-colisión simple
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => { l.y = (i === 0) ? Math.max(l.idealY, DT_MARGIN.top + (bigFmt ? 6 : 2)) : Math.max(l.idealY, endLabels[i - 1].y + GAP); });
  const endG = dt_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    const txt = dt_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4)); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600); txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    txt.textContent = l.text + (isPngFormat ? '  ' + Math.round(l.valLast) + '%' : ''); endG.appendChild(txt);
  });
  if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER))
    dt_setupHover(svg, { y0, y1, xS, yS, abs: false, series: [
      { label: localLbl, color: DT_COL_LOCAL, pts: localPts.map(p => [p[0], p[1], p[1]]) },
      { label: foreignLbl, color: DT_COL_FOREIGN, pts: foreignPts.map(p => [p[0], p[1], p[1]]) }
    ] });
}

function dt_setupHover(svg, ctx) {
  const { y0, y1, xS, yS, series } = ctx;
  const unit = ctx.abs ? '' : '%';
  const tooltip = document.getElementById('tooltip11');
  const wcYears = dt_years.filter(y => y >= y0 && y <= y1);
  const plotBottom = DT_MARGIN.top + (DT_H - DT_MARGIN.top - DT_MARGIN.bottom);
  const hoverG = dt_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = dt_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', DT_MARGIN.top); vline.setAttribute('y2', plotBottom); hoverG.appendChild(vline);
  const cap = dt_el('rect'); cap.setAttribute('x', DT_MARGIN.left); cap.setAttribute('y', DT_MARGIN.top); cap.setAttribute('width', DT_W - DT_MARGIN.left - DT_MARGIN.right); cap.setAttribute('height', DT_H - DT_MARGIN.top - DT_MARGIN.bottom); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function nearest(px) { let best = wcYears[0], bd = Infinity; wcYears.forEach(y => { const d = Math.abs(xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; }
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => { const p = s.pts.find(q => q[0] === year); if (!p || p[1] == null) return;
      const c = dt_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 4); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      rows.push({ label: s.label, color: s.color, v: (p[2] != null ? p[2] : p[1]) }); });
    if (tooltip && rows.length) { rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v}${unit}</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  // Handlers a nivel <svg> (innerHTML='' borra hijos, no listeners del svg).
  // Se guardan en el nodo para que dt_clearHover pueda quitarlos en el próximo
  // render — sin esto, al cambiar de modo queda vivo el hover del modo anterior.
  const moveH = (ev) => {
    const rc = svg.getBoundingClientRect(); const sc = rc.width / DT_W; const lx = (ev.clientX - rc.left) / sc;
    if (lx < DT_MARGIN.left || lx > DT_W - DT_MARGIN.right) { update(null); return; }
    update(nearest(lx));
    if (tooltip) { const _x = ev.clientX - rc.left, _w = tooltip.offsetWidth || 170; tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; }   // si no entra a la derecha, a la izquierda del cursor
  };
  const leaveH = () => update(null);
  svg.addEventListener('mousemove', moveH);
  svg.addEventListener('mouseleave', leaveH);
  svg.__ogHoverMove = moveH; svg.__ogHoverLeave = leaveH;
}
// Quita los listeners de hover (líneas/área) que viven en el propio <svg> y
// oculta el tooltip. Se llama al inicio de cada drawDts para que barras y
// flujos —que no instalan hover— no arrastren el tooltip fantasma del modo previo.
function dt_clearHover(svg) {
  if (svg.__ogHoverMove) { svg.removeEventListener('mousemove', svg.__ogHoverMove); svg.__ogHoverMove = null; }
  if (svg.__ogHoverLeave) { svg.removeEventListener('mouseleave', svg.__ogHoverLeave); svg.__ogHoverLeave = null; }
  const tt = document.getElementById('tooltip11');
  if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }
}

function dt_emph(iso) {
  const svg = document.getElementById('chart11'); if (!svg) return;
  svg.querySelectorAll('[data-dt]').forEach(el => {
    const me = el.getAttribute('data-dt');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('dt-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('dt-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

// Fragmento de período: en barras un solo Mundial; en líneas/área el rango.
function dt_periodPhrase(en) {
  if (state[11].mode === 'bar') return en ? `in the ${state[11].period[1]} World Cup` : `del Mundial ${state[11].period[1]}`;
  const y0 = state[11].period[0], y1 = state[11].period[1];
  if (y0 === y1) return en ? `in the ${y1} World Cup` : `del Mundial ${y1}`;
  if (y0 <= DT_YEAR_MIN && y1 >= DT_YEAR_MAX) return en ? 'in each World Cup' : 'de cada Mundial';
  return en ? `in the World Cups between ${y0} and ${y1}` : `de los Mundiales entre ${y0} y ${y1}`;
}
// Subtítulo dinámico: refleja universo (todos/exportados), métrica (%/cantidad)
// y el período/Mundial elegido. El PNG lo toma del DOM, así que respeta todo.
function dt_subtitle() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), abs = dt_isAbs(), exp = dt_universe() === 'exp';
  const per = dt_periodPhrase(en);
  if (state[11].mode === 'trend') {
    return en ? `Share of teams ${per} led by a manager of their own nationality vs. a foreign one.`
              : `Porcentaje de selecciones ${per} dirigidas por un DT de su propio país vs. uno extranjero.`;
  }
  if (state[11].mode === 'sankey') {
    return en ? `Managers ${per} directing a national team other than their own: from the manager's nationality (left) to the team they coach (right).`
              : `DTs ${per} que dirigen a una selección distinta de su país: de la nacionalidad del DT (izquierda) a la selección que dirige (derecha).`;
  }
  if (en) {
    if (exp) return abs ? `Number of managers ${per} coaching a foreign national team, by their nationality.`
                        : `Managers ${per} coaching a foreign team, as a share of the "exported", by their nationality.`;
    return abs ? `Number of managers ${per}, by nationality.` : `Share of each World Cup's managers ${per}, by nationality.`;
  }
  if (exp) return abs ? `Cantidad de DTs ${per} que dirigen a una selección extranjera, según su nacionalidad.`
                      : `DTs ${per} que dirigen a una selección extranjera, como % de los «exportados», según su nacionalidad.`;
  return abs ? `Cantidad de DTs ${per} según su nacionalidad.` : `Porcentaje de los DTs ${per} según su nacionalidad.`;
}
function dt_applyHeadings(aeCfg) {
  const block = document.querySelector('.chart-block[data-chart="11"]') || document;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = dt_tt('c11-title', 'La migración de los técnicos');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = dt_subtitle();
}

//==================================================================
//  Chips + buscador + toggles
//==================================================================
function dt_renderChips() {
  const c = document.getElementById('dt-selected-chips'); if (!c) return;
  c.innerHTML = ''; dt_project();
  // Buscador/chips no aplican en región, ni en flujos, ni en la tendencia agregada.
  const hideSearch = (dt_group() === 'region') || (state[11].mode === 'sankey') || (state[11].mode === 'trend');
  const wrap = document.getElementById('dt-search-wrap');
  if (wrap) wrap.style.display = hideSearch ? 'none' : '';
  if (hideSearch) return;
  Array.from(dt_selMap().keys()).forEach(iso => {
    if (!dt_byIso[iso]) return;
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = dt_getColor(iso); chip.textContent = dt_displayName(iso, dt_byIso[iso].name);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => dt_toggle(iso)); chip.appendChild(x); c.appendChild(chip);
  });
}
function dt_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupDtsSearch() {
  const input = document.getElementById('dt-search'), results = document.getElementById('dt-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => dt_teams.map(t => ({ iso3: t.iso3, name: dt_displayName(t.iso3, t.name) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  function get(q) { if (!q) return []; const qn = dt_norm(q); return all().filter(c => dt_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${dt_selMap().has(c.iso3) ? ' m-already' : ''}" data-iso="${c.iso3}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { dt_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); dt_toggle(matches[active].iso3); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
// Toggle de forma: Local vs. extranjero / Líneas / Área / Barras / Flujos.
function setupDtsModeToggle() {
  const MODES = ['trend', 'line', 'stack', 'bar', 'sankey'];
  const B = {}; MODES.forEach(m => B[m] = document.getElementById('dt-mode-' + m));
  if (!B.trend || !B.line || !B.stack || !B.bar || !B.sankey) return;
  function sync() { MODES.forEach(k => { B[k].classList.toggle('lg-seg-on', state[11].mode === k); B[k].setAttribute('aria-pressed', state[11].mode === k ? 'true' : 'false'); }); }
  function switchTo(m) {
    if (state[11].mode === m) return;
    const prev = state[11].mode;
    state[11].mode = m;
    if (m === 'bar') state[11].barCustom = false;          // default fresco: auto-ajusta al año
    // En país: barras trae su propio default; al volver a líneas/área desde un
    // modo agregado (barras/flujos/tendencia) se restauran las grandes escuelas.
    if (dt_group() === 'pais') {
      if (m === 'bar') state[11].selectedCountries = new Map(dt_barDefault(state[11].period[1]).map((iso, i) => [iso, i]));
      else if ((m === 'line' || m === 'stack') && (prev === 'bar' || prev === 'sankey' || prev === 'trend')) state[11].selectedCountries = new Map(DT_BIG.map((iso, i) => [iso, i]));
    }
    sync(); dt_renderChips(); drawDts();
  }
  MODES.forEach(m => B[m].addEventListener('click', () => switchTo(m)));
  sync();
}
// Toggle universo Todos ↔ Exportados.
function setupDtsUnivToggle() {
  const allBtn = document.getElementById('dt-univ-all'), expBtn = document.getElementById('dt-univ-exp');
  if (!allBtn || !expBtn) return;
  function sync() {
    const exp = state[11].universe === 'exp';
    allBtn.classList.toggle('lg-seg-on', !exp); expBtn.classList.toggle('lg-seg-on', exp);
    allBtn.setAttribute('aria-pressed', !exp ? 'true' : 'false'); expBtn.setAttribute('aria-pressed', exp ? 'true' : 'false');
  }
  allBtn.addEventListener('click', () => { if (state[11].universe !== 'all') { state[11].universe = 'all'; sync(); drawDts(); } });
  expBtn.addEventListener('click', () => { if (state[11].universe !== 'exp') { state[11].universe = 'exp'; sync(); drawDts(); } });
  sync();
}
// Toggle agrupación País ↔ Región. Al cambiar, resetea la selección al default.
function setupDtsGroupToggle() {
  const paisBtn = document.getElementById('dt-group-pais'), regBtn = document.getElementById('dt-group-region');
  if (!paisBtn || !regBtn) return;
  function applyDefaultSelection() {
    let isos;
    if (dt_group() === 'region') isos = DT_REGION_ORDER;
    else if (state[11].mode === 'bar') isos = dt_barDefault(state[11].period[1]);  // país + barras
    else isos = DT_BIG;
    if (state[11].mode === 'bar') state[11].barCustom = false;   // volver al default reactiva el auto-ajuste
    state[11].selectedCountries = new Map(isos.map((iso, i) => [iso, i]));
  }
  function sync() {
    const reg = state[11].group === 'region';
    paisBtn.classList.toggle('lg-seg-on', !reg); regBtn.classList.toggle('lg-seg-on', reg);
    paisBtn.setAttribute('aria-pressed', !reg ? 'true' : 'false'); regBtn.setAttribute('aria-pressed', reg ? 'true' : 'false');
  }
  function switchTo(g) { if (state[11].group === g) return; state[11].group = g; dt_project(); applyDefaultSelection(); sync(); dt_renderChips(); drawDts(); }
  paisBtn.addEventListener('click', () => switchTo('pais'));
  regBtn.addEventListener('click', () => switchTo('region'));
  sync();
}
// Toggle métrica % ↔ cantidad absoluta.
function setupDtsMetricToggle() {
  const pctBtn = document.getElementById('dt-metric-pct'), absBtn = document.getElementById('dt-metric-abs');
  if (!pctBtn || !absBtn) return;
  function sync() {
    const abs = state[11].metric === 'abs';
    pctBtn.classList.toggle('lg-seg-on', !abs); absBtn.classList.toggle('lg-seg-on', abs);
    pctBtn.setAttribute('aria-pressed', !abs ? 'true' : 'false'); absBtn.setAttribute('aria-pressed', abs ? 'true' : 'false');
  }
  pctBtn.addEventListener('click', () => { if (state[11].metric !== 'pct') { state[11].metric = 'pct'; sync(); drawDts(); } });
  absBtn.addEventListener('click', () => { if (state[11].metric !== 'abs') { state[11].metric = 'abs'; sync(); drawDts(); } });
  sync();
}

//==================================================================
//  CSV + Init + PNG
//==================================================================
function setupDtsCSV() {
  document.querySelectorAll('button.download[data-chart="11-csv"]').forEach(btn => btn.addEventListener('click', () => {
    dt_initData();
    let csv = 'year,iso3,name_en,n_dts,n_exportados\n';
    dt_rawTeams.forEach(t => {
      const byAll = {}; t.all.forEach(p => byAll[p[0]] = p[1]);
      const byExp = {}; t.exp.forEach(p => byExp[p[0]] = p[1]);
      const nm = (dt_names[t.iso3] || [t.iso3, t.iso3])[1];
      const nq = /[",]/.test(nm) ? '"' + nm.replace(/"/g, '""') + '"' : nm;
      Object.keys(byAll).map(Number).sort((a, b) => a - b).forEach(y => { csv += `${y},${t.iso3},${nq},${byAll[y]},${byExp[y] || 0}\n`; });
    });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-03-dts-mundiales.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}
function setupDtsSlider() {
  setupWcRangeSlider({
    fromId: 'dt-slider-from', toId: 'dt-slider-to', dispId: 'dt-range-display', trackId: 'dt-range-track-active',
    years: dt_years, get: () => state[11].period, set: (p) => { state[11].period = p; },
    onChange: () => {
      // En barras (sin edición manual) la selección por defecto se reajusta al
      // Mundial elegido. Si el usuario ya la editó (barCustom), queda fija.
      if (state[11].mode === 'bar' && !state[11].barCustom && dt_group() === 'pais') {
        state[11].selectedCountries = new Map(dt_barDefault(state[11].period[1]).map((iso, i) => [iso, i]));
        dt_renderChips();
      }
      drawDts();
    }
  });
}
function initDts() {
  dt_initData();
  if (!state[11]) state[11] = {};
  if (!state[11].period) state[11].period = [DT_YEAR_MIN, DT_YEAR_MAX];
  if (!state[11].mode) state[11].mode = 'trend';    // por default, la tendencia local vs. extranjero (estilo natividad)
  if (!state[11].universe) state[11].universe = 'all';
  if (!state[11].group) state[11].group = 'pais';
  if (!state[11].metric) state[11].metric = 'pct';
  if (!(state[11].selectedCountries instanceof Map)) {
    const init = state[11].selectedCountries;
    state[11].selectedCountries = new Map(init || []);
    if (state[11].selectedCountries.size === 0) DT_BIG.forEach((iso, i) => state[11].selectedCountries.set(iso, i));
  }
  drawDts();
  setupDtsSlider();
  setupDtsSearch();
  setupDtsModeToggle();
  setupDtsUnivToggle();
  setupDtsGroupToggle();
  setupDtsMetricToggle();
  setupDtsCSV();
  dt_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initDts._wired) { initDts._wired = true; window.addEventListener('atlas-editor-change', () => drawDts()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDts;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '11') return null;
    return (typeof t === 'function' ? t('c11-sources-tpl') : '') || null;
  };
  // El subtítulo del PNG refleja universo + métrica + período/Mundial.
  window.onBeforePngExportGetSubtitle = function (chartId) {
    return (String(chartId) === '11') ? dt_subtitle() : null;
  };
}
