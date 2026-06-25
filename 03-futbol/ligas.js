// =============================================================
//  El Atlas N°3 (anexo mundiales) — Chart 7: ligas de destino
// =============================================================
// ¿Dónde juegan su fútbol de clubes los mundialistas? % de jugadores de cada
// Mundial según el país donde está radicado su club (1930-2026).
//   - Default: las 5 grandes ligas europeas (Inglaterra, España, Italia,
//     Alemania, Francia) preseleccionadas. Cada una es UNA línea estilo OWID
//     (línea uniendo sus Mundiales + marcador en cada uno).
//   - El Reino Unido va separado por nación (Inglaterra / Escocia / Irlanda
//     del Norte): la Premier League es inglesa, no se mezcla con la escocesa.
//   - Buscador: agrega/saca cualquier país-de-club.
//   - Toggle "En Europa (total)": superpone el agregado de europeización
//     (~28% en 1930 → ~69% en 2026). Al activarse, el eje Y se reescala.
//   - El eje Y se autoajusta a los datos visibles (las ligas individuales
//     rondan 0-20%, así que un 0-100 fijo las aplastaría).
//
// Mobile-first PNG (square default) — ver skill graficos-atlas.
// Datos: LIGAS (data-ligas.js).

//==================================================================
//  Constantes
//==================================================================
const LG_PALETTE_EXT = [
  // Paleta estandar del Atlas (12 hues distintos, del chart 3 de N2). Norma multiserie.
  '#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
  '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'
];
function lg_colorForSlot(slot) { return LG_PALETTE_EXT[slot % LG_PALETTE_EXT.length]; }

const LG_COL_EUR = '#6E6A62';      // agregado "en Europa (total)" — gris cálido
const LG_COL_OTH = '#CFC9BC';      // banda "otras ligas / resto" en modo apilado
const LG_COL_OTH_TXT = '#8A8170';  // etiqueta de esa banda (más oscura, legible)
const LG_BIG5 = ['ENG', 'ESP', 'ITA', 'DEU', 'FRA'];
const LG_EUR = '_EUR';             // iso sentinela para la serie agregada

const LG_W_DESKTOP = 1100, LG_H_DESKTOP = 520;
const LG_W_MOBILE  = 1100, LG_H_MOBILE  = 1000;
const LG_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 64 };
const LG_MARGIN_MOBILE  = { top: 64, right: 168, bottom: 150, left: 96 };
function lg_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 168, bottom: 92,  left: 78 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96,  left: 112 };
    case 'square':     return { top: 44, right: 184, bottom: 74,  left: 112 };
    case 'mobile':     return { top: 64, right: 176, bottom: 150, left: 116 };
    default:           return { ...LG_MARGIN_DESKTOP };
  }
}
let LG_W = LG_W_DESKTOP, LG_H = LG_H_DESKTOP, LG_MARGIN = { ...LG_MARGIN_DESKTOP };

const LG_NS = 'http://www.w3.org/2000/svg';
const lg_el = (t) => document.createElementNS(LG_NS, t);

//==================================================================
//  Data
//==================================================================
let lg_years = null, lg_europa = null, lg_byIso = null, lg_teams = null;
function lg_initData() {
  if (lg_teams) return;
  if (typeof LIGAS === 'undefined') { console.error('[ligas] LIGAS no cargado'); lg_europa = []; lg_byIso = {}; lg_years = []; lg_teams = []; return; }
  lg_years = LIGAS.years.slice();
  lg_europa = LIGAS.europa.slice();             // [[year, pctEnEuropa]]
  lg_teams = LIGAS.teams.slice();
  lg_byIso = {};
  lg_teams.forEach(t => lg_byIso[t.iso3] = t);
}
const LG_YEAR_MIN = 1930, LG_YEAR_MAX = 2026;

//==================================================================
//  Helpers
//==================================================================
function lg_displayName(iso3, fallback) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
  if (iso3 === LG_EUR) return tt('c7-label-europa', 'En Europa (total)');
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso3]) {
    return COUNTRY_NAMES[iso3][lang] || COUNTRY_NAMES[iso3].en || fallback || iso3;
  }
  // Estados disueltos (CSK/YUG/SUN/DDR/SCG): el dato trae name (es) + en.
  const tm = (lg_byIso) ? lg_byIso[iso3] : null;
  if (tm) return (lang === 'en' && tm.en) ? tm.en : (tm.name || fallback || iso3);
  return fallback || iso3;
}
function lg_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function lg_measureText(text, size, weight) {
  if (!lg_measureText._c) lg_measureText._c = document.createElement('canvas').getContext('2d');
  lg_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return lg_measureText._c.measureText(text).width;
}
function lg_selMap() {
  if (!(state[7].selectedCountries instanceof Map)) state[7].selectedCountries = new Map(state[7].selectedCountries || []);
  return state[7].selectedCountries;
}
function lg_getColor(iso3) { const s = lg_selMap().get(iso3); return s == null ? null : lg_colorForSlot(s); }
function lg_nextFreeSlot() { const u = new Set(Array.from(lg_selMap().values()).filter(v => v >= 0)); let i = 0; while (u.has(i)) i++; return i; }
function lg_toggle(iso3) {
  const sel = lg_selMap();
  if (sel.has(iso3)) sel.delete(iso3); else sel.set(iso3, lg_nextFreeSlot());
  lg_renderChips(); drawLigas();
}

// Ticks del eje X: SOLO años de Mundial (coinciden con los datos; no caen en
// años sin Mundial como los 40s). Se densifican hasta donde entren sin
// encimarse: desktop ~cada 4 años; formatos grandes / mobile se ralean.
function lg_xTicks(y0, y1, plotW, minGapPx) {
  const ys = (lg_years || []).filter(y => y >= y0 && y <= y1);
  if (!ys.length) return [];
  const xOf = (y) => ((y - y0) / (y1 - y0)) * plotW;
  const out = [ys[0]]; let lastX = xOf(ys[0]);
  for (let i = 1; i < ys.length - 1; i++) {
    const x = xOf(ys[i]);
    if (x - lastX >= minGapPx) { out.push(ys[i]); lastX = x; }
  }
  const last = ys[ys.length - 1];
  if (out[out.length - 1] !== last) {
    if (out.length > 1 && xOf(last) - lastX < minGapPx) out.pop();
    out.push(last);
  }
  return out;
}
// Escala Y "linda" según el máximo visible (las ligas rondan 0-20%).
function lg_niceScale(maxVal) {
  const cands = [[20, 5], [25, 5], [30, 5], [40, 10], [50, 10], [60, 20], [80, 20], [100, 20]];
  for (const [m, s] of cands) if (maxVal <= m + 0.001) {
    const ticks = []; for (let v = 0; v <= m; v += s) ticks.push(v);
    return { max: m, ticks };
  }
  return { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
}

//==================================================================
//  DRAW
//==================================================================
function drawLigas() {
  const svg = document.getElementById('chart7');
  if (!svg) return;
  svg.innerHTML = '';
  lg_initData();

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && lg_isMobile();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; LG_W = f.vbW;
    LG_H = square ? 910 : newsletter ? 860 : f.vbH;
    LG_MARGIN = lg_getMargins(editorFormat);
  } else if (mobile) { LG_W = LG_W_MOBILE; LG_H = LG_H_MOBILE; LG_MARGIN = { ...LG_MARGIN_MOBILE }; }
  else { LG_W = LG_W_DESKTOP; LG_H = LG_H_DESKTOP; LG_MARGIN = { ...LG_MARGIN_DESKTOP }; }
  let PLOT_W = LG_W - LG_MARGIN.left - LG_MARGIN.right;
  const PLOT_H = LG_H - LG_MARGIN.top - LG_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${LG_W} ${LG_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const isPngFormat = newsletter || square || mobilePng;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const sel = lg_selMap();
  const selected = Array.from(sel.keys()).filter(iso => lg_byIso[iso]);
  const stackMode = !!(state[7] && state[7].mode === 'stack');
  const showEur = !stackMode && !!(state[7] && state[7].showEuropa);
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);

  // período (slider)
  const period = (state[7] && state[7].period) || [LG_YEAR_MIN, LG_YEAR_MAX];
  const y0 = period[0], y1 = period[1];
  const inP = (pts) => pts.filter(p => p[0] >= y0 && p[0] <= y1 && p[1] != null);

  // --- escala Y --------------------------------------------------------------
  // Modo apilado: parte-sobre-el-todo (0-100%). Modo líneas: autoajustada (las
  // ligas individuales rondan 0-20%, un 0-100 fijo las aplastaría).
  let yScale;
  if (stackMode) {
    yScale = { max: 100, ticks: [0, 20, 40, 60, 80, 100] };
  } else {
    let maxVal = 0;
    selected.forEach(iso => inP(lg_byIso[iso].pts).forEach(p => { if (p[1] > maxVal) maxVal = p[1]; }));
    if (showEur) inP(lg_europa).forEach(p => { if (p[1] > maxVal) maxVal = p[1]; });
    yScale = lg_niceScale(Math.max(maxVal, 1));
  }

  // margen derecho dinámico para las etiquetas de fin de línea/banda
  const labelOffset = bigFmt ? 12 : 6;
  let maxLabelW = 0;
  const endNames = selected.map(iso => lg_displayName(iso, lg_byIso[iso].name));
  if (stackMode) endNames.push(tt('c7-label-otros', 'Otras ligas'));
  else if (showEur) endNames.push(lg_displayName(LG_EUR));
  const endSuffix = isPngFormat ? '  100%' : '';   // en PNG las etiquetas llevan %
  endNames.forEach(nm => { const w = lg_measureText(nm + endSuffix, SIZES.label, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
  const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
  const maxRight = Math.round(LG_W * 0.42);
  LG_MARGIN.right = Math.min(maxRight, Math.max(LG_MARGIN.right, neededRight));
  PLOT_W = LG_W - LG_MARGIN.left - LG_MARGIN.right;

  // escalas
  const xS = (yr) => LG_MARGIN.left + ((yr - y0) / (y1 - y0)) * PLOT_W;
  const yS = (v) => LG_MARGIN.top + PLOT_H - (v / yScale.max) * PLOT_H;

  // grid + eje X (solo años de Mundial)
  lg_xTicks(y0, y1, PLOT_W, bigFmt ? 92 : 30).forEach(yr => {
    const x = xS(yr);
    const gl = lg_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', LG_MARGIN.top); gl.setAttribute('y2', LG_MARGIN.top + PLOT_H);
    gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = lg_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', LG_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y (ticks autoajustados)
  yScale.ticks.forEach(v => {
    const y = yS(v);
    const gl = lg_el('line'); gl.setAttribute('x1', LG_MARGIN.left); gl.setAttribute('x2', LG_MARGIN.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = lg_el('text'); lbl.setAttribute('x', LG_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = v + '%'; svg.appendChild(lbl);
  });
  // título eje Y
  const yT = lg_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${LG_MARGIN.left - (mobile || mobilePng ? 84 : bigFmt ? 78 : 44)}, ${LG_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = tt('c7-axis-y', '% de mundialistas (según país del club)'); svg.appendChild(yT);

  // builder
  function build(pts) {
    const v = pts.filter(p => p[1] != null);
    if (!v.length) return '';
    return v.map((p, i) => (i === 0 ? 'M' : 'L') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
  }
  const endLabels = [];
  const halosG = lg_el('g'); svg.appendChild(halosG);
  const linesG = lg_el('g'); svg.appendChild(linesG);
  const dotsG = lg_el('g'); svg.appendChild(dotsG);
  const hitG = lg_el('g'); svg.appendChild(hitG);

  function drawSeries(pts, color, opts) {
    opts = opts || {};
    const d = build(pts); if (!d) return;
    const halo = lg_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
    if (opts.iso) halo.setAttribute('data-lg', opts.iso); halosG.appendChild(halo);
    const path = lg_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color); path.setAttribute('stroke-width', opts.ref ? lineW * 0.8 : lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (opts.dash) path.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    if (opts.iso) { path.setAttribute('data-lg', opts.iso); path.setAttribute('data-base-w', opts.ref ? lineW * 0.8 : lineW); path.classList.add('lg-colored'); }
    linesG.appendChild(path);
    if (opts.markers) pts.filter(p => p[1] != null).forEach(p => {
      const c = lg_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR);
      c.setAttribute('fill', color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
      if (opts.iso) c.setAttribute('data-lg', opts.iso); dotsG.appendChild(c);
    });
    if (opts.iso && !isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      const hit = lg_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 9));
      hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => lg_emph(opts.iso));
      hit.addEventListener('mouseleave', () => lg_emph(null));
      if (opts.iso !== LG_EUR) hit.addEventListener('click', (ev) => { ev.stopPropagation(); lg_toggle(opts.iso); });
      hitG.appendChild(hit);
    }
    const last = pts.filter(p => p[1] != null).slice(-1)[0];
    if (last) endLabels.push({ iso: opts.iso, color, text: opts.label, x: xS(last[0]), idealY: yS(last[1]), ref: opts.ref, valLast: last[1] });
  }

  const hoverSeries = [];
  if (stackMode) {
    // --- modo ÁREA APILADA: ligas seleccionadas (abajo) + "otras ligas" arriba
    //     hasta 100% (parte-sobre-el-todo). -------------------------------------
    const yrs = lg_years.filter(y => y >= y0 && y <= y1);
    const valOf = (iso, yr) => { const p = lg_byIso[iso].pts.find(q => q[0] === yr); return p ? p[1] : 0; };
    const bands = selected.map(iso => ({ iso, color: lg_getColor(iso), name: lg_displayName(iso, lg_byIso[iso].name), get: (yr) => valOf(iso, yr) }));
    bands.push({ iso: '_OTH', color: LG_COL_OTH, name: tt('c7-label-otros', 'Otras ligas'),
      get: (yr) => { let s = 0; selected.forEach(iso => s += valOf(iso, yr)); return Math.max(0, +(100 - s).toFixed(1)); } });
    const areasG = lg_el('g'); svg.insertBefore(areasG, halosG);   // áreas sobre la grilla
    const lower = yrs.map(() => 0);
    bands.forEach(b => {
      const upper = yrs.map((yr, i) => lower[i] + b.get(yr));
      let d = 'M' + yrs.map((yr, i) => xS(yr).toFixed(1) + ',' + yS(upper[i]).toFixed(1)).join(' L');
      for (let i = yrs.length - 1; i >= 0; i--) d += ' L' + xS(yrs[i]).toFixed(1) + ',' + yS(lower[i]).toFixed(1);
      d += ' Z';
      const area = lg_el('path'); area.setAttribute('d', d); area.setAttribute('fill', b.color);
      area.setAttribute('fill-opacity', b.iso === '_OTH' ? 0.5 : 0.9);
      area.setAttribute('stroke', '#FAF8F3'); area.setAttribute('stroke-width', bigFmt ? 1.6 : 1); area.setAttribute('stroke-linejoin', 'round');
      if (b.iso !== '_OTH') {
        area.setAttribute('data-lg', b.iso); area.classList.add('lg-colored'); area.setAttribute('data-base-w', bigFmt ? 1.6 : 1);
        if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
          area.style.cursor = 'pointer';
          area.addEventListener('mouseenter', () => lg_emph(b.iso));
          area.addEventListener('mouseleave', () => lg_emph(null));
          area.addEventListener('click', (ev) => { ev.stopPropagation(); lg_toggle(b.iso); });
        }
      }
      areasG.appendChild(area);
      const li = yrs.length - 1, mid = (upper[li] + lower[li]) / 2;
      endLabels.push({ iso: b.iso === '_OTH' ? null : b.iso, color: b.iso === '_OTH' ? LG_COL_OTH_TXT : b.color, text: b.name, x: xS(yrs[li]), idealY: yS(mid), valLast: b.get(yrs[li]) });
      // hover: punto en el tope acumulado, muestra el share propio
      hoverSeries.push({ label: b.name, color: b.iso === '_OTH' ? LG_COL_OTH_TXT : b.color, pts: yrs.map((yr, i) => [yr, upper[i], b.get(yr)]) });
      yrs.forEach((yr, i) => { lower[i] = upper[i]; });
    });
  } else {
    // --- modo LÍNEAS -----------------------------------------------------------
    selected.forEach(iso => {
      const tm = lg_byIso[iso];
      const pts = inP(tm.pts.map(p => [p[0], p[1]]));
      drawSeries(pts, lg_getColor(iso), { markers: true, iso, label: lg_displayName(iso, tm.name) });
      hoverSeries.push({ label: lg_displayName(iso, tm.name), color: lg_getColor(iso), pts });
    });
    if (showEur) {
      const ep = inP(lg_europa);
      drawSeries(ep, LG_COL_EUR, { markers: true, ref: true, iso: LG_EUR, label: lg_displayName(LG_EUR) });
      hoverSeries.push({ label: lg_displayName(LG_EUR), color: LG_COL_EUR, pts: ep });
    }
  }

  // etiquetas de fin (anti-colisión vertical)
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + GAP);
    l.y = Math.min(l.y, LG_MARGIN.top + PLOT_H); l.y = Math.max(l.y, LG_MARGIN.top + (bigFmt ? 6 : 2));
    l.shifted = Math.abs(l.y - l.idealY) > 1.5;
  });
  const endG = lg_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const g = lg_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY);
      g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8);
      g.setAttribute('stroke-opacity', 0.5); if (l.iso) g.setAttribute('data-lg', l.iso); endG.appendChild(g);
    }
    const txt = lg_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4));
    txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = (l.ref ? SIZES.label * 0.9 : SIZES.label) + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    if (l.iso) txt.setAttribute('data-lg', l.iso);
    // En PNG la etiqueta incluye el % del último año (no hay tooltip).
    const valTxt = (isPngFormat && l.valLast != null && !l.ref) ? '  ' + Math.round(l.valLast) + '%' : '';
    txt.textContent = l.text + valTxt; endG.appendChild(txt);
  });

  // Hover (solo dispositivos con mouse; nunca en export PNG)
  if (!isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER) && hoverSeries.length)
    lg_setupHover(svg, { y0, y1, xS, yS, series: hoverSeries });

  lg_applyHeadings(aeCfg);
}

function lg_setupHover(svg, ctx) {
  const { y0, y1, xS, yS, series } = ctx;
  const tooltip = document.getElementById('tooltip7');
  const wcYears = lg_years.filter(y => y >= y0 && y <= y1);
  const plotBottom = LG_MARGIN.top + (LG_H - LG_MARGIN.top - LG_MARGIN.bottom);
  const hoverG = lg_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = lg_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
  vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', LG_MARGIN.top); vline.setAttribute('y2', plotBottom);
  hoverG.appendChild(vline);
  const cap = lg_el('rect'); cap.setAttribute('x', LG_MARGIN.left); cap.setAttribute('y', LG_MARGIN.top);
  cap.setAttribute('width', LG_W - LG_MARGIN.left - LG_MARGIN.right); cap.setAttribute('height', LG_H - LG_MARGIN.top - LG_MARGIN.bottom);
  cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  function nearest(px) { let best = wcYears[0], bd = Infinity; wcYears.forEach(y => { const d = Math.abs(xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; }
  function update(year) {
    if (year == null) { hoverG.setAttribute('display', 'none'); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = xS(year); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    series.forEach(s => { const p = s.pts.find(q => q[0] === year); if (!p || p[1] == null) return;
      const c = lg_el('circle'); c.setAttribute('cx', xAt); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', 4);
      c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', 1.5); hoverG.appendChild(c);
      // p[2] = valor a mostrar (share propio en modo apilado); por defecto p[1].
      rows.push({ label: s.label, color: s.color, v: (p[2] != null ? p[2] : p[1]) }); });
    if (tooltip && rows.length) { rows.sort((a, b) => b.v - a.v);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${year}</div>`;
      rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.label}</span><strong style="font-variant-numeric:tabular-nums;">${r.v}%</strong></div>`; });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    }
  }
  svg.addEventListener('mousemove', (ev) => {
    const rc = svg.getBoundingClientRect(); const sc = rc.width / LG_W; const lx = (ev.clientX - rc.left) / sc;
    if (lx < LG_MARGIN.left || lx > LG_W - LG_MARGIN.right) { update(null); return; }
    update(nearest(lx));
    if (tooltip) { const _x = ev.clientX - rc.left, _w = tooltip.offsetWidth || 170; tooltip.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px'; tooltip.style.top = (ev.clientY - rc.top + 14) + 'px'; }   // si no entra a la derecha, a la izquierda del cursor
  });
  svg.addEventListener('mouseleave', () => update(null));
}

// Énfasis al hover sobre una línea (atenúa el resto).
function lg_emph(iso) {
  const svg = document.getElementById('chart7'); if (!svg) return;
  svg.querySelectorAll('[data-lg]').forEach(el => {
    const me = el.getAttribute('data-lg');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('lg-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('lg-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

function lg_applyHeadings(aeCfg) {
  const block = document.querySelector('.chart-block[data-chart="7"]') || document;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = tt('c7-title', 'Dónde juegan su fútbol de clubes los mundialistas');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = tt('c7-subtitle', 'Porcentaje de jugadores de cada Mundial según el país donde está radicado su club.');
}

//==================================================================
//  Chips + buscador + toggle Europa
//==================================================================
function lg_renderChips() {
  const c = document.getElementById('lg-selected-chips'); if (!c) return;
  c.innerHTML = ''; lg_initData();
  Array.from(lg_selMap().keys()).forEach(iso => {
    if (!lg_byIso[iso]) return;
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = lg_getColor(iso); chip.textContent = lg_displayName(iso, lg_byIso[iso].name);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => lg_toggle(iso)); chip.appendChild(x); c.appendChild(chip);
  });
}
function lg_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupLigasSearch() {
  const input = document.getElementById('lg-search'), results = document.getElementById('lg-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => lg_teams.map(t => ({ iso3: t.iso3, name: lg_displayName(t.iso3, t.name) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  function get(q) { if (!q) return []; const qn = lg_norm(q); return all().filter(c => lg_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${lg_selMap().has(c.iso3) ? ' m-already' : ''}" data-iso="${c.iso3}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { lg_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); lg_toggle(matches[active].iso3); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
function setupLigasEuropaToggle() {
  const btn = document.getElementById('lg-europa-toggle'); if (!btn) return;
  function sync() {
    const on = !!state[7].showEuropa;
    btn.classList.toggle('lg-toggle-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    // El agregado "en Europa" no aplica en modo apilado → ocultar el toggle ahí.
    btn.style.display = (state[7].mode === 'stack') ? 'none' : '';
  }
  btn.addEventListener('click', () => { state[7].showEuropa = !state[7].showEuropa; sync(); drawLigas(); });
  sync();
}
// Toggle líneas ↔ área apilada.
function setupLigasModeToggle() {
  const lineBtn = document.getElementById('lg-mode-line'), stackBtn = document.getElementById('lg-mode-stack');
  if (!lineBtn || !stackBtn) return;
  const eurBtn = document.getElementById('lg-europa-toggle');
  function sync() {
    const stack = state[7].mode === 'stack';
    lineBtn.classList.toggle('lg-seg-on', !stack);
    stackBtn.classList.toggle('lg-seg-on', stack);
    lineBtn.setAttribute('aria-pressed', !stack ? 'true' : 'false');
    stackBtn.setAttribute('aria-pressed', stack ? 'true' : 'false');
    if (eurBtn) eurBtn.style.display = stack ? 'none' : '';
  }
  lineBtn.addEventListener('click', () => { if (state[7].mode !== 'line') { state[7].mode = 'line'; sync(); drawLigas(); } });
  stackBtn.addEventListener('click', () => { if (state[7].mode !== 'stack') { state[7].mode = 'stack'; sync(); drawLigas(); } });
  sync();
}

//==================================================================
//  CSV
//==================================================================
function setupLigasCSV() {
  document.querySelectorAll('button.download[data-chart="7-csv"]').forEach(btn => btn.addEventListener('click', () => {
    lg_initData();
    let csv = 'year,scope,iso3,name,pct,n_players\n';
    lg_europa.forEach(p => { csv += `${p[0]},europa,,En Europa (total),${p[1]},\n`; });
    LIGAS.teams.forEach(t => t.pts.forEach(p => {
      const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[t.iso3]?.en) || t.en || t.name || t.iso3;
      const nq = /[",]/.test(nm) ? '"' + nm.replace(/"/g, '""') + '"' : nm;
      csv += `${p[0]},pais_club,${t.iso3},${nq},${p[1]},${p[2] != null ? p[2] : ''}\n`;
    }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-03-ligas-mundialistas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function setupLigasSlider() {
  // Slider de rango que salta de Mundial en Mundial (sin años intermedios).
  setupWcRangeSlider({
    fromId: 'lg-slider-from', toId: 'lg-slider-to', dispId: 'lg-range-display', trackId: 'lg-range-track-active',
    years: lg_years,
    get: () => state[7].period, set: (p) => { state[7].period = p; },
    onChange: () => drawLigas()
  });
}

function initLigas() {
  lg_initData();
  if (!state[7]) state[7] = {};
  if (!state[7].period) state[7].period = [LG_YEAR_MIN, LG_YEAR_MAX];
  if (state[7].showEuropa == null) state[7].showEuropa = false;
  if (!state[7].mode) state[7].mode = 'line';
  if (!(state[7].selectedCountries instanceof Map)) {
    const init = state[7].selectedCountries;
    state[7].selectedCountries = new Map(init || []);
    if (state[7].selectedCountries.size === 0) LG_BIG5.forEach((iso, i) => state[7].selectedCountries.set(iso, i));
  }
  drawLigas();
  setupLigasSlider();
  setupLigasSearch();
  setupLigasModeToggle();
  setupLigasEuropaToggle();
  setupLigasCSV();
  lg_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initLigas._wired) { initLigas._wired = true; window.addEventListener('atlas-editor-change', () => drawLigas()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawLigas;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '7') return null;
    return (typeof t === 'function' ? t('c7-sources-tpl') : '') || null;
  };
}
