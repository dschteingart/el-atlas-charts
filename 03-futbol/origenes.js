// =============================================================
//  El Atlas N°3 — Chart 9: orígenes (país de nacimiento + migración)
// =============================================================
// ¿De qué país nacen los mundialistas, por Mundial? Complemento temporal del
// chart 8 (mapa de cunas). Cada país de nacimiento es UNA línea estilo OWID.
//   - Universo: "Todos" (todos los nacidos ahí) ↔ "Exportados" (nacidos ahí
//     pero que representan a OTRA selección). En "Exportados", Francia salta:
//     es la gran cantera que nutre a medio mundo.
//   - Agrupación: País ↔ Región (confederación FIFA de nacimiento).
//   - Forma: Líneas ↔ Área apilada.
//   - Slider temporal por Mundial + buscador.
// Motor compartido con el chart 7 (ligas). Datos: ORIGENES (data-origenes.js).
//
// Mobile-first PNG (square default) — ver skill graficos-atlas.

//==================================================================
//  Constantes
//==================================================================
const OG_PALETTE_EXT = [
  '#2B5C8A', '#5BA152', '#C9A227', '#9A4FA8', '#2BA0A8', '#C0473A',
  '#1B3956', '#386433', '#7D6418', '#5F3168', '#1B6368', '#772C24',
  '#3A7BB9', '#8CC185', '#E0C261', '#BC85C6', '#4AC8D1', '#D68279',
  '#18344E', '#284724', '#584711', '#44234A', '#154D51', '#541F1A'
];
function og_colorForSlot(slot) { return OG_PALETTE_EXT[slot % OG_PALETTE_EXT.length]; }
const OG_COL_OTH = '#CFC9BC', OG_COL_OTH_TXT = '#8A8170';

// Default país: grandes canteras. Default región: las 6 confederaciones.
const OG_BIG = ['ENG', 'BRA', 'FRA', 'DEU', 'ARG'];
const OG_REGION_ORDER = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
const OG_REGION_NAME = {
  CONMEBOL: ['Sudamérica', 'South America'], UEFA: ['Europa', 'Europe'],
  CONCACAF: ['Norteamérica y Caribe', 'North America & Caribbean'],
  CAF: ['África', 'Africa'], AFC: ['Asia', 'Asia'], OFC: ['Oceanía', 'Oceania'], OTRO: ['Otros', 'Other']
};

const OG_W_DESKTOP = 1100, OG_H_DESKTOP = 520;
const OG_W_MOBILE = 1100, OG_H_MOBILE = 1000;
const OG_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 64 };
const OG_MARGIN_MOBILE = { top: 64, right: 168, bottom: 150, left: 96 };
function og_getMargins(format) {
  switch (format) {
    case 'public': return { top: 40, right: 168, bottom: 92, left: 78 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96, left: 112 };
    case 'square': return { top: 44, right: 184, bottom: 74, left: 112 };
    case 'mobile': return { top: 64, right: 176, bottom: 150, left: 116 };
    default: return { ...OG_MARGIN_DESKTOP };
  }
}
let OG_W = OG_W_DESKTOP, OG_H = OG_H_DESKTOP, OG_MARGIN = { ...OG_MARGIN_DESKTOP };
const OG_NS = 'http://www.w3.org/2000/svg';
const og_el = (t) => document.createElementNS(OG_NS, t);
const OG_YEAR_MIN = 1930, OG_YEAR_MAX = 2026;

//==================================================================
//  Data + proyección según toggles
//==================================================================
let og_years = null, og_totals = null, og_rawTeams = null, og_names = null, og_confed = null, og_regionAgg = null;
function og_initData() {
  if (og_rawTeams) return;
  if (typeof ORIGENES === 'undefined') { console.error('[origenes] ORIGENES no cargado'); og_years = []; og_rawTeams = []; og_totals = { all: {}, exp: {} }; og_names = {}; og_confed = {}; return; }
  og_years = ORIGENES.years.slice();
  og_names = ORIGENES.names;
  og_confed = ORIGENES.confed;
  og_totals = { all: {}, exp: {} };
  ORIGENES.totals.all.forEach(p => og_totals.all[p[0]] = p[1]);
  ORIGENES.totals.exp.forEach(p => og_totals.exp[p[0]] = p[1]);
  og_rawTeams = ORIGENES.teams;          // [{iso3, all:[[y,n]], exp:[[y,n]]}]
  // agregados por región (confederación) y universo
  og_regionAgg = {};
  OG_REGION_ORDER.concat(['OTRO']).forEach(r => og_regionAgg[r] = { all: {}, exp: {} });
  og_rawTeams.forEach(t => {
    const r = og_confed[t.iso3] || 'OTRO';
    t.all.forEach(p => og_regionAgg[r].all[p[0]] = (og_regionAgg[r].all[p[0]] || 0) + p[1]);
    t.exp.forEach(p => og_regionAgg[r].exp[p[0]] = (og_regionAgg[r].exp[p[0]] || 0) + p[1]);
  });
}
function og_universe() { return (state[9] && state[9].universe === 'exp') ? 'exp' : 'all'; }
function og_group() { return (state[9] && state[9].group === 'region') ? 'region' : 'pais'; }
function og_isAbs() { return !!(state[9] && state[9].metric === 'abs'); }
// Valor a graficar de un punto [year, pct, n]: cantidad o porcentaje.
function og_mv(p) { return og_isAbs() ? p[2] : p[1]; }

// Construye la vista (byIso + lista) para los toggles actuales: pts=[[year,pct,n]]
let og_byIso = null, og_teams = null;
function og_project() {
  og_initData();
  const U = og_universe(), G = og_group();
  const den = og_totals[U];
  const mk = (countsByYear) => {
    const pts = [];
    Object.keys(countsByYear).map(Number).sort((a, b) => a - b).forEach(y => {
      const n = countsByYear[y], D = den[y] || 0;
      if (n > 0 && D > 0) pts.push([y, +(100 * n / D).toFixed(1), n]);
    });
    return pts;
  };
  og_byIso = {}; og_teams = [];
  if (G === 'region') {
    OG_REGION_ORDER.forEach(r => {
      const pts = mk(og_regionAgg[r][U]);
      if (!pts.length) return;
      const tm = { iso3: r, name: OG_REGION_NAME[r][0], en: OG_REGION_NAME[r][1], pts };
      og_byIso[r] = tm; og_teams.push(tm);
    });
  } else {
    og_rawTeams.forEach(t => {
      const byY = {}; (U === 'exp' ? t.exp : t.all).forEach(p => byY[p[0]] = p[1]);
      const pts = mk(byY);
      const nm = og_names[t.iso3] || [t.iso3, t.iso3];
      const tm = { iso3: t.iso3, name: nm[0], en: nm[1], pts, total: pts.reduce((s, p) => s + p[2], 0) };
      og_byIso[t.iso3] = tm; if (pts.length) og_teams.push(tm);
    });
    og_teams.sort((a, b) => b.total - a.total);
  }
}

//==================================================================
//  Helpers
//==================================================================
function og_displayName(iso3, fallback) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tm = og_byIso ? og_byIso[iso3] : null;
  if (tm) return (lang === 'en' && tm.en) ? tm.en : (tm.name || fallback || iso3);
  const nm = og_names && og_names[iso3];
  if (nm) return lang === 'en' ? nm[1] : nm[0];
  return fallback || iso3;
}
function og_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function og_measureText(text, size, weight) {
  if (!og_measureText._c) og_measureText._c = document.createElement('canvas').getContext('2d');
  og_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return og_measureText._c.measureText(text).width;
}
function og_selMap() {
  if (!(state[9].selectedCountries instanceof Map)) state[9].selectedCountries = new Map(state[9].selectedCountries || []);
  return state[9].selectedCountries;
}
function og_getColor(iso3) { const s = og_selMap().get(iso3); return s == null ? null : og_colorForSlot(s); }
function og_nextFreeSlot() { const u = new Set(Array.from(og_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function og_toggle(iso3) {
  const sel = og_selMap();
  if (sel.has(iso3)) sel.delete(iso3); else sel.set(iso3, og_nextFreeSlot());
  // En barras, editar a mano fija la selección (deja de auto-ajustarse al año).
  if (state[9].mode === 'bar') state[9].barCustom = true;
  og_renderChips(); drawOrigenes();
}
function og_xTicks(y0, y1, plotW, minGapPx) {
  const ys = (og_years || []).filter(y => y >= y0 && y <= y1);
  if (!ys.length) return [];
  const xOf = (y) => ((y - y0) / (y1 - y0)) * plotW;
  const out = [ys[0]]; let lastX = xOf(ys[0]);
  for (let i = 1; i < ys.length - 1; i++) { const x = xOf(ys[i]); if (x - lastX >= minGapPx) { out.push(ys[i]); lastX = x; } }
  const last = ys[ys.length - 1];
  if (out[out.length - 1] !== last) { if (out.length > 1 && xOf(last) - lastX < minGapPx) out.pop(); out.push(last); }
  return out;
}
function og_niceScale(maxVal) {
  const cands = [[10, 2], [15, 5], [20, 5], [25, 5], [30, 5], [40, 10], [50, 10], [60, 20], [80, 20], [100, 20]];
  for (const [m, s] of cands) if (maxVal <= m + 0.001) { const ticks = []; for (let v = 0; v <= m; v += s) ticks.push(v); return { max: m, ticks }; }
  return { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
}
// Escala "linda" para cantidades absolutas (~5 ticks redondos).
function og_niceCount(maxVal) {
  const m = Math.max(maxVal, 1);
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const top = ([1, 1.5, 2, 3, 5, 10].map(x => x * pow).find(c => c >= m - 0.001)) || 10 * pow;
  const step = top / 5, ticks = [];
  for (let v = 0; v <= top + 1e-6; v += step) ticks.push(Math.round(v));
  return { max: top, ticks };
}
const og_tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);

//==================================================================
//  DRAW
//==================================================================
function drawOrigenes() {
  const svg = document.getElementById('chart9');
  if (!svg) return;
  svg.innerHTML = '';
  og_project();
  // En barras el slider representa UN Mundial → modo single-thumb (un solo año).
  const sliderEl = document.getElementById('og-range-slider');
  if (sliderEl) sliderEl.classList.toggle('s-range-single', state[9].mode === 'bar');

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && og_isMobile();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; OG_W = f.vbW;
    OG_H = square ? 910 : newsletter ? 860 : f.vbH;
    OG_MARGIN = og_getMargins(editorFormat);
  } else if (mobile) { OG_W = OG_W_MOBILE; OG_H = OG_H_MOBILE; OG_MARGIN = { ...OG_MARGIN_MOBILE }; }
  else { OG_W = OG_W_DESKTOP; OG_H = OG_H_DESKTOP; OG_MARGIN = { ...OG_MARGIN_DESKTOP }; }
  let PLOT_W = OG_W - OG_MARGIN.left - OG_MARGIN.right;
  const PLOT_H = OG_H - OG_MARGIN.top - OG_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${OG_W} ${OG_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const sel = og_selMap();
  const selected = Array.from(sel.keys()).filter(iso => og_byIso[iso]);
  const stackMode = !!(state[9] && state[9].mode === 'stack');
  const tt = og_tt;

  const period = (state[9] && state[9].period) || [OG_YEAR_MIN, OG_YEAR_MAX];
  const y0 = period[0], y1 = period[1];
  const inP = (pts) => pts.filter(p => p[0] >= y0 && p[0] <= y1 && p[1] != null);

  // Modo BARRAS: ranking de UN Mundial (el extremo derecho del slider). Sale
  // por acá; no usa la maquinaria de líneas/área.
  if (state[9].mode === 'bar') { og_drawBars(svg, { bigFmt, isPngFormat, wc: y1 }); og_applyHeadings(aeCfg); return; }

  // escala Y (depende de la métrica: % o cantidad)
  const abs = og_isAbs();
  let yScale;
  if (stackMode) {
    if (abs) {
      let mx = 0; og_years.filter(y => y >= y0 && y <= y1).forEach(y => { const T = og_totals[og_universe()][y] || 0; if (T > mx) mx = T; });
      yScale = og_niceCount(mx);
    } else yScale = { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
  } else {
    let maxVal = 0;
    selected.forEach(iso => inP(og_byIso[iso].pts).forEach(p => { const v = og_mv(p); if (v > maxVal) maxVal = v; }));
    yScale = abs ? og_niceCount(maxVal) : og_niceScale(Math.max(maxVal, 1));
  }

  // margen derecho dinámico
  const labelOffset = bigFmt ? 12 : 6;
  let maxLabelW = 0;
  const endNames = selected.map(iso => og_displayName(iso, og_byIso[iso].name));
  if (stackMode) endNames.push(tt('c9-label-otros', 'Otros'));
  const endSuffix = isPngFormat ? '  100%' : '';
  endNames.forEach(nm => { const w = og_measureText(nm + endSuffix, SIZES.label, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
  const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
  OG_MARGIN.right = Math.min(Math.round(OG_W * 0.42), Math.max(OG_MARGIN.right, neededRight));
  PLOT_W = OG_W - OG_MARGIN.left - OG_MARGIN.right;

  const xS = (yr) => OG_MARGIN.left + ((yr - y0) / (y1 - y0)) * PLOT_W;
  const yS = (v) => OG_MARGIN.top + PLOT_H - (v / yScale.max) * PLOT_H;

  // grid + eje X
  og_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = og_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', OG_MARGIN.top); gl.setAttribute('y2', OG_MARGIN.top + PLOT_H); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = og_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', OG_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = og_el('line'); gl.setAttribute('x1', OG_MARGIN.left); gl.setAttribute('x2', OG_MARGIN.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = og_el('text'); lbl.setAttribute('x', OG_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = abs ? v : v + '%'; svg.appendChild(lbl);
  });
  // título eje Y (depende de métrica + universo)
  const yT = og_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${OG_MARGIN.left - (mobile || mobilePng ? 84 : bigFmt ? 78 : 44)}, ${OG_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px';
  yT.textContent = abs
    ? (og_universe() === 'exp' ? tt('c9-axis-n-exp', 'Mundialistas "exportados" (cantidad)') : tt('c9-axis-n-all', 'Mundialistas (cantidad)'))
    : (og_universe() === 'exp' ? tt('c9-axis-y-exp', '% de los mundialistas "exportados"') : tt('c9-axis-y-all', '% de mundialistas (según país de nacimiento)'));
  svg.appendChild(yT);

  function build(pts) { const v = pts.filter(p => p[1] != null); if (!v.length) return ''; return v.map((p, i) => (i === 0 ? 'M' : 'L') + xS(p[0]).toFixed(1) + ',' + yS(og_mv(p)).toFixed(1)).join(' '); }
  const endLabels = [];
  const halosG = og_el('g'); svg.appendChild(halosG);
  const linesG = og_el('g'); svg.appendChild(linesG);
  const dotsG = og_el('g'); svg.appendChild(dotsG);
  const hitG = og_el('g'); svg.appendChild(hitG);

  function drawSeries(pts, color, opts) {
    opts = opts || {};
    const d = build(pts); if (!d) return;
    const halo = og_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); if (opts.iso) halo.setAttribute('data-og', opts.iso); halosG.appendChild(halo);
    const path = og_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', color); path.setAttribute('stroke-width', lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (opts.iso) { path.setAttribute('data-og', opts.iso); path.setAttribute('data-base-w', lineW); path.classList.add('og-colored'); }
    linesG.appendChild(path);
    if (opts.markers) pts.filter(p => p[1] != null).forEach(p => {
      const c = og_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(og_mv(p))); c.setAttribute('r', dotR);
      c.setAttribute('fill', color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); if (opts.iso) c.setAttribute('data-og', opts.iso); dotsG.appendChild(c);
    });
    if (opts.iso && !isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      const hit = og_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 9)); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => og_emph(opts.iso)); hit.addEventListener('mouseleave', () => og_emph(null));
      hit.addEventListener('click', (ev) => { ev.stopPropagation(); og_toggle(opts.iso); }); hitG.appendChild(hit);
    }
    const last = pts.filter(p => p[1] != null).slice(-1)[0];
    // Etiqueta siempre al borde derecho (no flotando en el fin de líneas que
    // terminan antes, p.ej. Oceanía que casi no exporta y corta en 2006).
    if (last) endLabels.push({ iso: opts.iso, color, text: opts.label, x: xS(y1), idealY: yS(og_mv(last)), valLast: og_mv(last) });
  }

  const hoverSeries = [];
  if (stackMode) {
    const yrs = og_years.filter(y => y >= y0 && y <= y1);
    const valOf = (iso, yr) => { const p = og_byIso[iso].pts.find(q => q[0] === yr); return p ? og_mv(p) : 0; };
    const bands = selected.map(iso => ({ iso, color: og_getColor(iso), name: og_displayName(iso, og_byIso[iso].name), get: (yr) => valOf(iso, yr) }));
    // Banda "Otros" = lo no seleccionado. En modo región las 6 confederaciones
    // cubren el total, así que da 0 → no se dibuja (no existe un continente
    // "Otros"). Solo se agrega si aporta algo en algún año visible.
    const othGet = (yr) => { let s = 0; selected.forEach(iso => s += valOf(iso, yr)); const tot = abs ? (og_totals[og_universe()][yr] || 0) : 100; return Math.max(0, +(tot - s).toFixed(1)); };
    if (Math.max(0, ...yrs.map(othGet)) > (abs ? 0.5 : 0.3))
      bands.push({ iso: '_OTH', color: OG_COL_OTH, name: tt('c9-label-otros', 'Otros'), get: othGet });
    const areasG = og_el('g'); svg.insertBefore(areasG, halosG);
    const lower = yrs.map(() => 0);
    bands.forEach(b => {
      const upper = yrs.map((yr, i) => lower[i] + b.get(yr));
      let d = 'M' + yrs.map((yr, i) => xS(yr).toFixed(1) + ',' + yS(upper[i]).toFixed(1)).join(' L');
      for (let i = yrs.length - 1; i >= 0; i--) d += ' L' + xS(yrs[i]).toFixed(1) + ',' + yS(lower[i]).toFixed(1);
      d += ' Z';
      const area = og_el('path'); area.setAttribute('d', d); area.setAttribute('fill', b.color); area.setAttribute('fill-opacity', b.iso === '_OTH' ? 0.5 : 0.9);
      area.setAttribute('stroke', '#FAF8F3'); area.setAttribute('stroke-width', bigFmt ? 1.6 : 1); area.setAttribute('stroke-linejoin', 'round');
      if (b.iso !== '_OTH') {
        area.setAttribute('data-og', b.iso); area.classList.add('og-colored'); area.setAttribute('data-base-w', bigFmt ? 1.6 : 1);
        if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
          area.style.cursor = 'pointer'; area.addEventListener('mouseenter', () => og_emph(b.iso)); area.addEventListener('mouseleave', () => og_emph(null));
          area.addEventListener('click', (ev) => { ev.stopPropagation(); og_toggle(b.iso); });
        }
      }
      areasG.appendChild(area);
      const li = yrs.length - 1, mid = (upper[li] + lower[li]) / 2;
      endLabels.push({ iso: b.iso === '_OTH' ? null : b.iso, color: b.iso === '_OTH' ? OG_COL_OTH_TXT : b.color, text: b.name, x: xS(yrs[li]), idealY: yS(mid), valLast: b.get(yrs[li]) });
      hoverSeries.push({ label: b.name, color: b.iso === '_OTH' ? OG_COL_OTH_TXT : b.color, pts: yrs.map((yr, i) => [yr, upper[i], b.get(yr)]) });
      yrs.forEach((yr, i) => { lower[i] = upper[i]; });
    });
  } else {
    selected.forEach(iso => {
      const tm = og_byIso[iso];
      const pts = inP(tm.pts);                          // [year, pct, n]
      drawSeries(pts, og_getColor(iso), { markers: true, iso, label: og_displayName(iso, tm.name) });
      // hover: [year, valor-graficado, valor-a-mostrar] (ambos = métrica activa)
      hoverSeries.push({ label: og_displayName(iso, tm.name), color: og_getColor(iso), pts: pts.map(p => [p[0], og_mv(p), og_mv(p)]) });
    });
  }

  // etiquetas de fin: anti-colisión BIDIRECCIONAL. Un solo pase hacia abajo
  // apila todo en el borde cuando varias series quedan pegadas (p.ej. regiones
  // que casi no exportan, todas cerca de 0). Pase 1 hacia abajo; si el último
  // se desborda, pase 2 reacomodando hacia arriba; las desplazadas llevan guía.
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  const og_topB = OG_MARGIN.top + (bigFmt ? 6 : 2), og_botB = OG_MARGIN.top + PLOT_H;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = (i === 0) ? Math.max(l.idealY, og_topB) : Math.max(l.idealY, endLabels[i - 1].y + GAP);
  });
  if (endLabels.length) {
    const lastL = endLabels[endLabels.length - 1];
    if (lastL.y > og_botB) {
      lastL.y = og_botB;
      for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - GAP);
    }
  }
  endLabels.forEach(l => { l.y = Math.max(l.y, og_topB); l.shifted = Math.abs(l.y - l.idealY) > 1.5; });
  const endG = og_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const g = og_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); if (l.iso) g.setAttribute('data-og', l.iso); endG.appendChild(g);
    }
    const txt = og_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4)); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = SIZES.label + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    if (l.iso) txt.setAttribute('data-og', l.iso);
    const valTxt = (isPngFormat && l.valLast != null) ? '  ' + Math.round(l.valLast) + (abs ? '' : '%') : '';
    txt.textContent = l.text + valTxt; endG.appendChild(txt);
  });

  if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER) && hoverSeries.length)
    og_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries, abs });

  og_applyHeadings(aeCfg);
}

// Default de barras (modo país): los que MÁS y MENOS producen en total
// (todos los Mundiales), para mostrar el rango — Francia vs Curaçao.
const OG_DEFUNCT = ['CSK', 'YUG', 'SUN', 'DDR', 'SCG'];   // estados desaparecidos
const OG_BAR_COL = '#5E7E96';                            // azul coherente con el chart 2
// Potencias futbolísticas para el default de barras (las "selecciones
// importantes" que se muestran aunque no estén en el top/bottom).
const OG_IMPORTANT = ['BRA', 'ARG', 'DEU', 'FRA', 'ENG', 'ITA', 'ESP', 'NLD', 'URY', 'PRT', 'BEL', 'MEX'];
// Default de barras (entre los presentes en ESE Mundial): top 5 + bottom 5 +
// 5 potencias importantes que hayan quedado afuera. Excluye estados defuntos.
function og_barDefault(wc) {
  og_initData();
  // candidatos = selecciones que JUEGAN ese Mundial (no cualquier país de
  // nacimiento), con al menos un jugador nacido en ellas.
  const teamSet = new Set((typeof ORIGENES !== 'undefined' && ORIGENES.teams_wc && ORIGENES.teams_wc[String(wc)]) || []);
  const present = og_rawTeams.map(t => { const p = t.all.find(q => q[0] === wc); return { iso: t.iso3, n: p ? p[1] : 0 }; })
    .filter(x => x.n > 0 && teamSet.has(x.iso) && OG_DEFUNCT.indexOf(x.iso) < 0)
    .sort((a, b) => b.n - a.n || a.iso.localeCompare(b.iso));
  const order = present.map(x => x.iso);
  if (order.length <= 15) return order;
  const top = order.slice(0, 5), bottom = order.slice(-5);
  const chosen = new Set(top.concat(bottom)), important = [];
  for (const iso of OG_IMPORTANT) { if (!chosen.has(iso) && order.indexOf(iso) >= 0) { important.push(iso); chosen.add(iso); if (important.length >= 5) break; } }
  for (let i = 5; i < order.length - 5 && important.length < 5; i++) { if (!chosen.has(order[i])) { important.push(order[i]); chosen.add(order[i]); } }
  return top.concat(important, bottom);
}

// Ranking horizontal de UN Mundial. Aplica universo (todos/exportados) y
// métrica (% de ese Mundial / cantidad). Click en la barra la saca.
function og_drawBars(svg, opt) {
  const bigFmt = opt.bigFmt, isPngFormat = opt.isPngFormat, wc = opt.wc;
  const abs = og_isAbs(), U = og_universe(), den = og_totals[U][wc] || 0;
  const rows = Array.from(og_selMap().keys()).filter(iso => og_byIso[iso]).map(iso => {
    const p = og_byIso[iso].pts.find(q => q[0] === wc);
    const n = p ? p[2] : 0;
    return { iso, name: og_displayName(iso, og_byIso[iso].name),
      n, v: abs ? n : (den ? +(100 * n / den).toFixed(1) : 0) };
  }).filter(r => r.n > 0)                                 // solo países presentes en ese Mundial
    .sort((a, b) => b.v - a.v || b.n - a.n);

  const fs = bigFmt ? 23 : 12.5;
  const top = OG_MARGIN.top + (bigFmt ? 26 : 16), bottom = bigFmt ? 24 : 12;
  let nameW = 0; rows.forEach(r => { const w = og_measureText(r.name, fs, 600); if (w > nameW) nameW = w; });
  const valW = og_measureText(abs ? '1888' : '100%', fs, 700);
  const left = (bigFmt ? 18 : 12) + nameW + (bigFmt ? 16 : 10);
  const right = valW + (bigFmt ? 22 : 14);
  const plotW = Math.max(40, OG_W - left - right);
  const availH = OG_H - top - bottom;
  // las barras llenan el alto disponible (con pocas, p.ej. 6 regiones, se
  // ensanchan para ocupar más pantalla).
  const rowH = rows.length ? Math.min(availH / rows.length, bigFmt ? 150 : 96) : 24;
  const barH = rowH * 0.6, maxV = Math.max(1, ...rows.map(r => r.v));
  const xW = (v) => Math.max(0, (v / maxV) * plotW);
  const baseline = (y) => y + fs * 0.34;

  // indicador del Mundial mostrado
  const wcLbl = og_el('text'); wcLbl.setAttribute('x', OG_W - right); wcLbl.setAttribute('y', OG_MARGIN.top + (bigFmt ? 8 : 4));
  wcLbl.setAttribute('text-anchor', 'end'); wcLbl.style.fontSize = (bigFmt ? 26 : 13) + 'px'; wcLbl.style.fontFamily = 'var(--sans)';
  wcLbl.style.fontWeight = '700'; wcLbl.setAttribute('fill', 'var(--accent)'); wcLbl.textContent = og_tt('c9-bar-wc', 'Mundial') + ' ' + wc; svg.appendChild(wcLbl);

  rows.forEach((r, i) => {
    const cy = top + i * rowH, midY = cy + rowH / 2, bw = xW(r.v);
    const nm = og_el('text'); nm.setAttribute('x', left - (bigFmt ? 12 : 8)); nm.setAttribute('y', baseline(midY)); nm.setAttribute('text-anchor', 'end');
    nm.style.fontSize = fs + 'px'; nm.style.fontFamily = 'var(--sans)'; nm.style.fontWeight = '600'; nm.setAttribute('fill', 'var(--ink)'); nm.textContent = r.name; svg.appendChild(nm);
    const bar = og_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', midY - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', OG_BAR_COL); svg.appendChild(bar);
    const vt = og_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', baseline(midY));
    vt.style.fontSize = fs + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.setAttribute('fill', 'var(--ink)'); vt.textContent = abs ? r.n : (r.v + '%'); svg.appendChild(vt);
    if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) { bar.style.cursor = 'pointer'; bar.addEventListener('click', () => og_toggle(r.iso)); }
  });
  // en barras el slider representa UN Mundial → mostrar solo ese año
  const disp = document.getElementById('og-range-display'); if (disp) disp.textContent = wc;
}

function og_setupHover(svg, ctx) {
  const { y0, y1, xS, yS, series } = ctx;
  const unit = ctx.abs ? '' : '%';
  const tooltip = document.getElementById('tooltip9');
  const wcYears = og_years.filter(y => y >= y0 && y <= y1);
  const plotBottom = OG_MARGIN.top + (OG_H - OG_MARGIN.top - OG_MARGIN.bottom);
  const hoverG = og_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = og_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', OG_MARGIN.top); vline.setAttribute('y2', plotBottom); hoverG.appendChild(vline);
  const cap = og_el('rect'); cap.setAttribute('x', OG_MARGIN.left); cap.setAttribute('y', OG_MARGIN.top); cap.setAttribute('width', OG_W - OG_MARGIN.left - OG_MARGIN.right); cap.setAttribute('height', OG_H - OG_MARGIN.top - OG_MARGIN.bottom); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function nearest(px) { let best = wcYears[0], bd = Infinity; wcYears.forEach(y => { const d = Math.abs(xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; }
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => { const p = s.pts.find(q => q[0] === year); if (!p || p[1] == null) return;
      const c = og_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 4); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      rows.push({ label: s.label, color: s.color, v: (p[2] != null ? p[2] : p[1]) }); });
    if (tooltip && rows.length) { rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v}${unit}</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  svg.addEventListener('mousemove', (ev) => {
    const rc = svg.getBoundingClientRect(); const sc = rc.width / OG_W; const lx = (ev.clientX - rc.left) / sc;
    if (lx < OG_MARGIN.left || lx > OG_W - OG_MARGIN.right) { update(null); return; }
    update(nearest(lx));
    if (tooltip) { tooltip.style.left = (ev.clientX - rc.left + 14) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; }
  });
  svg.addEventListener('mouseleave', () => update(null));
}

function og_emph(iso) {
  const svg = document.getElementById('chart9'); if (!svg) return;
  svg.querySelectorAll('[data-og]').forEach(el => {
    const me = el.getAttribute('data-og');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('og-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('og-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

function og_applyHeadings(aeCfg) {
  const block = document.querySelector('.chart-block[data-chart="9"]') || document;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = og_tt('c9-title', 'De qué país nacen los mundialistas');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) {
    subEl.textContent = og_universe() === 'exp'
      ? og_tt('c9-subtitle-exp', 'Mundialistas nacidos en cada país pero que representan a otra selección, como % de los "exportados" de ese Mundial.')
      : og_tt('c9-subtitle-all', 'Porcentaje de los jugadores de cada Mundial según su país de nacimiento.');
  }
}

//==================================================================
//  Chips + buscador + toggles
//==================================================================
function og_renderChips() {
  const c = document.getElementById('og-selected-chips'); if (!c) return;
  c.innerHTML = ''; og_project();
  // En modo región el buscador/chips no aplican (se muestran las 6 regiones).
  const wrap = document.getElementById('og-search-wrap');
  if (wrap) wrap.style.display = (og_group() === 'region') ? 'none' : '';
  if (og_group() === 'region') return;
  Array.from(og_selMap().keys()).forEach(iso => {
    if (!og_byIso[iso]) return;
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = og_getColor(iso); chip.textContent = og_displayName(iso, og_byIso[iso].name);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => og_toggle(iso)); chip.appendChild(x); c.appendChild(chip);
  });
}
function og_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupOrigenesSearch() {
  const input = document.getElementById('og-search'), results = document.getElementById('og-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => og_teams.map(t => ({ iso3: t.iso3, name: og_displayName(t.iso3, t.name) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  function get(q) { if (!q) return []; const qn = og_norm(q); return all().filter(c => og_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${og_selMap().has(c.iso3) ? ' m-already' : ''}" data-iso="${c.iso3}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { og_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); og_toggle(matches[active].iso3); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
// Toggle de forma: Líneas / Área apilada / Barras.
function setupOrigenesModeToggle() {
  const B = { line: document.getElementById('og-mode-line'), stack: document.getElementById('og-mode-stack'), bar: document.getElementById('og-mode-bar') };
  if (!B.line || !B.stack || !B.bar) return;
  function sync() {
    ['line', 'stack', 'bar'].forEach(k => { B[k].classList.toggle('lg-seg-on', state[9].mode === k); B[k].setAttribute('aria-pressed', state[9].mode === k ? 'true' : 'false'); });
  }
  function switchTo(m) {
    if (state[9].mode === m) return;
    const wasBar = state[9].mode === 'bar';
    state[9].mode = m;
    // En país, barras trae su propio default (más/menos productores en total);
    // al volver a líneas/área se restauran las grandes canteras.
    if (m === 'bar') state[9].barCustom = false;          // default fresco: auto-ajusta al año
    if (og_group() === 'pais') {
      if (m === 'bar') state[9].selectedCountries = new Map(og_barDefault(state[9].period[1]).map((iso, i) => [iso, i]));
      else if (wasBar) state[9].selectedCountries = new Map(OG_BIG.map((iso, i) => [iso, i]));
    }
    sync(); og_renderChips(); drawOrigenes();
  }
  B.line.addEventListener('click', () => switchTo('line'));
  B.stack.addEventListener('click', () => switchTo('stack'));
  B.bar.addEventListener('click', () => switchTo('bar'));
  sync();
}
// Toggle universo Todos ↔ Exportados.
function setupOrigenesUnivToggle() {
  const allBtn = document.getElementById('og-univ-all'), expBtn = document.getElementById('og-univ-exp');
  if (!allBtn || !expBtn) return;
  function sync() {
    const exp = state[9].universe === 'exp';
    allBtn.classList.toggle('lg-seg-on', !exp); expBtn.classList.toggle('lg-seg-on', exp);
    allBtn.setAttribute('aria-pressed', !exp ? 'true' : 'false'); expBtn.setAttribute('aria-pressed', exp ? 'true' : 'false');
  }
  allBtn.addEventListener('click', () => { if (state[9].universe !== 'all') { state[9].universe = 'all'; sync(); drawOrigenes(); } });
  expBtn.addEventListener('click', () => { if (state[9].universe !== 'exp') { state[9].universe = 'exp'; sync(); drawOrigenes(); } });
  sync();
}
// Toggle agrupación País ↔ Región. Al cambiar, resetea la selección al default.
function setupOrigenesGroupToggle() {
  const paisBtn = document.getElementById('og-group-pais'), regBtn = document.getElementById('og-group-region');
  if (!paisBtn || !regBtn) return;
  function applyDefaultSelection() {
    let isos;
    if (og_group() === 'region') isos = OG_REGION_ORDER;
    else if (state[9].mode === 'bar') isos = og_barDefault(state[9].period[1]);  // país + barras
    else isos = OG_BIG;
    if (state[9].mode === 'bar') state[9].barCustom = false;   // volver al default reactiva el auto-ajuste
    state[9].selectedCountries = new Map(isos.map((iso, i) => [iso, i]));
  }
  function sync() {
    const reg = state[9].group === 'region';
    paisBtn.classList.toggle('lg-seg-on', !reg); regBtn.classList.toggle('lg-seg-on', reg);
    paisBtn.setAttribute('aria-pressed', !reg ? 'true' : 'false'); regBtn.setAttribute('aria-pressed', reg ? 'true' : 'false');
  }
  function switchTo(g) { if (state[9].group === g) return; state[9].group = g; og_project(); applyDefaultSelection(); sync(); og_renderChips(); drawOrigenes(); }
  paisBtn.addEventListener('click', () => switchTo('pais'));
  regBtn.addEventListener('click', () => switchTo('region'));
  sync();
}
// Toggle métrica % ↔ cantidad absoluta.
function setupOrigenesMetricToggle() {
  const pctBtn = document.getElementById('og-metric-pct'), absBtn = document.getElementById('og-metric-abs');
  if (!pctBtn || !absBtn) return;
  function sync() {
    const abs = state[9].metric === 'abs';
    pctBtn.classList.toggle('lg-seg-on', !abs); absBtn.classList.toggle('lg-seg-on', abs);
    pctBtn.setAttribute('aria-pressed', !abs ? 'true' : 'false'); absBtn.setAttribute('aria-pressed', abs ? 'true' : 'false');
  }
  pctBtn.addEventListener('click', () => { if (state[9].metric !== 'pct') { state[9].metric = 'pct'; sync(); drawOrigenes(); } });
  absBtn.addEventListener('click', () => { if (state[9].metric !== 'abs') { state[9].metric = 'abs'; sync(); drawOrigenes(); } });
  sync();
}

//==================================================================
//  CSV + Init + PNG
//==================================================================
function setupOrigenesCSV() {
  document.querySelectorAll('button.download[data-chart="9-csv"]').forEach(btn => btn.addEventListener('click', () => {
    og_initData();
    let csv = 'year,iso3,name_en,n_nacidos,n_exportados\n';
    og_rawTeams.forEach(t => {
      const byAll = {}; t.all.forEach(p => byAll[p[0]] = p[1]);
      const byExp = {}; t.exp.forEach(p => byExp[p[0]] = p[1]);
      const nm = (og_names[t.iso3] || [t.iso3, t.iso3])[1];
      const nq = /[",]/.test(nm) ? '"' + nm.replace(/"/g, '""') + '"' : nm;
      Object.keys(byAll).map(Number).sort((a, b) => a - b).forEach(y => { csv += `${y},${t.iso3},${nq},${byAll[y]},${byExp[y] || 0}\n`; });
    });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-03-origenes-mundialistas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}
function setupOrigenesSlider() {
  setupWcRangeSlider({
    fromId: 'og-slider-from', toId: 'og-slider-to', dispId: 'og-range-display', trackId: 'og-range-track-active',
    years: og_years, get: () => state[9].period, set: (p) => { state[9].period = p; },
    onChange: () => {
      // En barras (sin edición manual) la selección por defecto se reajusta al
      // Mundial elegido. Si el usuario ya la editó (barCustom), queda fija.
      if (state[9].mode === 'bar' && !state[9].barCustom && og_group() === 'pais') {
        state[9].selectedCountries = new Map(og_barDefault(state[9].period[1]).map((iso, i) => [iso, i]));
        og_renderChips();
      }
      drawOrigenes();
    }
  });
}
function initOrigenes() {
  og_initData();
  if (!state[9]) state[9] = {};
  if (!state[9].period) state[9].period = [OG_YEAR_MIN, OG_YEAR_MAX];
  if (!state[9].mode) state[9].mode = 'line';
  if (!state[9].universe) state[9].universe = 'all';
  if (!state[9].group) state[9].group = 'pais';
  if (!state[9].metric) state[9].metric = 'pct';
  if (!(state[9].selectedCountries instanceof Map)) {
    const init = state[9].selectedCountries;
    state[9].selectedCountries = new Map(init || []);
    if (state[9].selectedCountries.size === 0) OG_BIG.forEach((iso, i) => state[9].selectedCountries.set(iso, i));
  }
  drawOrigenes();
  setupOrigenesSlider();
  setupOrigenesSearch();
  setupOrigenesModeToggle();
  setupOrigenesUnivToggle();
  setupOrigenesGroupToggle();
  setupOrigenesMetricToggle();
  setupOrigenesCSV();
  og_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initOrigenes._wired) { initOrigenes._wired = true; window.addEventListener('atlas-editor-change', () => drawOrigenes()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawOrigenes;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '9') return null;
    return (typeof t === 'function' ? t('c9-sources-tpl') : '') || null;
  };
}
