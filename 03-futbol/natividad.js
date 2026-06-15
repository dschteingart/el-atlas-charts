// =============================================================
//  El Atlas N°3 (anexo mundiales) — Chart 6: natividad de mundialistas
// =============================================================
// % de jugadores nacidos en el país que representan, por Mundial (1930-2026).
//   - Default (sin selección): DOS líneas del promedio del Mundial que suman
//     100 — "nacidos en el país" (cae) y "nacidos en otro país" (sube).
//   - Buscador: agrega selecciones; cada una es UNA línea de su % nacidos en
//     el país, estilo OWID (línea uniendo sus Mundiales + marcador en cada uno).
//     Al seleccionar, el promedio "en el país" queda como referencia gris y se
//     oculta la línea "afuera" (las selecciones se comparan en %nacidos-en-país).
//
// Mobile-first PNG (square default) — ver skill graficos-atlas.
// Datos: NATIVIDAD (data-natividad.js).

//==================================================================
//  Constantes
//==================================================================
// Paleta rotativa para selecciones (misma que el chart 5: 6 bases + variaciones).
const NV_PALETTE_EXT = [
  '#2B5C8A', '#5BA152', '#C9A227', '#9A4FA8', '#2BA0A8', '#C0473A',
  '#1B3956', '#386433', '#7D6418', '#5F3168', '#1B6368', '#772C24',
  '#3A7BB9', '#8CC185', '#E0C261', '#BC85C6', '#4AC8D1', '#D68279',
  '#18344E', '#284724', '#584711', '#44234A', '#154D51', '#541F1A'
];
function nv_colorForSlot(slot) { return NV_PALETTE_EXT[slot % NV_PALETTE_EXT.length]; }

const NV_COL_IN  = '#3E5A6E';   // promedio "nacidos en el país" (azul pizarra)
const NV_COL_OUT = '#BE5D32';   // promedio "nacidos en otro país" (terracota — la historia)
const NV_COL_REF = '#9a9488';   // referencia gris cuando hay selección

const NV_W_DESKTOP = 1100, NV_H_DESKTOP = 520;
const NV_W_MOBILE  = 1100, NV_H_MOBILE  = 1000;
const NV_MARGIN_DESKTOP = { top: 30, right: 150, bottom: 52, left: 64 };
const NV_MARGIN_MOBILE  = { top: 64, right: 168, bottom: 150, left: 96 };
function nv_getMargins(format) {
  switch (format) {
    case 'public':     return { top: 40, right: 168, bottom: 92,  left: 72 };
    case 'newsletter': return { top: 44, right: 184, bottom: 96,  left: 88 };
    case 'square':     return { top: 44, right: 184, bottom: 74,  left: 88 };
    case 'mobile':     return { top: 64, right: 176, bottom: 150, left: 100 };
    default:           return { ...NV_MARGIN_DESKTOP };
  }
}
let NV_W = NV_W_DESKTOP, NV_H = NV_H_DESKTOP, NV_MARGIN = { ...NV_MARGIN_DESKTOP };

const NV_NS = 'http://www.w3.org/2000/svg';
const nv_el = (t) => document.createElementNS(NV_NS, t);

//==================================================================
//  Data
//==================================================================
let nv_years = null, nv_avg = null, nv_byIso = null;
function nv_initData() {
  if (nv_avg) return;
  if (typeof NATIVIDAD === 'undefined') { console.error('[natividad] NATIVIDAD no cargado'); nv_avg = []; nv_byIso = {}; nv_years = []; return; }
  nv_years = NATIVIDAD.years.slice();
  nv_avg = NATIVIDAD.avg.slice();               // [[year, pctIn]]
  nv_byIso = {};
  NATIVIDAD.teams.forEach(t => nv_byIso[t.iso3] = t);
}
const NV_YEAR_MIN = 1930, NV_YEAR_MAX = 2026;

//==================================================================
//  Helpers
//==================================================================
function nv_displayName(iso3, fallback) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso3]) {
    return COUNTRY_NAMES[iso3][lang] || COUNTRY_NAMES[iso3].en || fallback || iso3;
  }
  return fallback || iso3;
}
function nv_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function nv_measureText(text, size, weight) {
  if (!nv_measureText._c) nv_measureText._c = document.createElement('canvas').getContext('2d');
  nv_measureText._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return nv_measureText._c.measureText(text).width;
}
function nv_selMap() {
  if (!(state[6].selectedCountries instanceof Map)) state[6].selectedCountries = new Map(state[6].selectedCountries || []);
  return state[6].selectedCountries;
}
function nv_getColor(iso3) { const s = nv_selMap().get(iso3); return s == null ? null : nv_colorForSlot(s); }
function nv_nextFreeSlot() { const u = new Set(nv_selMap().values()); let i = 0; while (u.has(i)) i++; return i; }
function nv_toggle(iso3) {
  const sel = nv_selMap();
  if (sel.has(iso3)) sel.delete(iso3); else sel.set(iso3, nv_nextFreeSlot());
  nv_renderChips(); drawNatividad();
}

// Ticks del eje X: primer y último Mundial + redondos intermedios (igual regla
// que el chart 5).
function nv_xTicks(y0, y1) {
  const span = y1 - y0;
  let step = span <= 18 ? 5 : span <= 55 ? 10 : 20;
  const minGap = step * 0.4, ticks = [y0];
  for (let y = Math.ceil(y0 / step) * step; y < y1; y += step)
    if (y - y0 >= minGap && y1 - y >= minGap) ticks.push(y);
  ticks.push(y1);
  return ticks;
}

//==================================================================
//  DRAW
//==================================================================
function drawNatividad() {
  const svg = document.getElementById('chart6');
  if (!svg) return;
  svg.innerHTML = '';
  nv_initData();

  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const newsletter = editorFormat === 'newsletter', square = editorFormat === 'square', mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && nv_isMobile();
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat]; NV_W = f.vbW;
    NV_H = square ? 910 : newsletter ? 860 : f.vbH;
    NV_MARGIN = nv_getMargins(editorFormat);
  } else if (mobile) { NV_W = NV_W_MOBILE; NV_H = NV_H_MOBILE; NV_MARGIN = { ...NV_MARGIN_MOBILE }; }
  else { NV_W = NV_W_DESKTOP; NV_H = NV_H_DESKTOP; NV_MARGIN = { ...NV_MARGIN_DESKTOP }; }
  let PLOT_W = NV_W - NV_MARGIN.left - NV_MARGIN.right;
  const PLOT_H = NV_H - NV_MARGIN.top - NV_MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${NV_W} ${NV_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const bigFmt = newsletter || square || mobilePng || mobile;
  const SIZES = bigFmt ? { tick: 22, axisTitle: 26, label: 26 } : { tick: 11, axisTitle: 11.5, label: 11.5 };
  const lineW = bigFmt ? 3.4 : 2, haloW = lineW + (bigFmt ? 5 : 3), labelHalo = bigFmt ? 6 : 3;
  const dotR = bigFmt ? 4.5 : 2.6;

  const sel = nv_selMap();
  const selected = Array.from(sel.keys()).filter(iso => nv_byIso[iso]);
  const hasSel = selected.length > 0;
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);

  // margen derecho dinámico para las etiquetas de fin de línea
  const labelOffset = bigFmt ? 12 : 6;
  let maxLabelW = 0;
  const endNames = hasSel ? selected.map(iso => nv_displayName(iso, nv_byIso[iso].name))
                          : [tt('c6-label-in', 'Nacidos en el país'), tt('c6-label-out', 'Nacidos en otro país')];
  endNames.forEach(nm => { const w = nv_measureText(nm, SIZES.label, bigFmt ? 700 : 600); if (w > maxLabelW) maxLabelW = w; });
  const neededRight = labelOffset + maxLabelW + (bigFmt ? 16 : 8);
  const maxRight = Math.round(NV_W * 0.42);
  NV_MARGIN.right = Math.min(maxRight, Math.max(NV_MARGIN.right, neededRight));
  PLOT_W = NV_W - NV_MARGIN.left - NV_MARGIN.right;

  // escalas: X = año (lineal), Y = % (0-100)
  const y0 = NV_YEAR_MIN, y1 = NV_YEAR_MAX;
  const xS = (yr) => NV_MARGIN.left + ((yr - y0) / (y1 - y0)) * PLOT_W;
  const yS = (v) => NV_MARGIN.top + PLOT_H - (v / 100) * PLOT_H;

  // grid + eje X
  nv_xTicks(y0, y1).forEach(yr => {
    const x = xS(yr);
    const gl = nv_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x);
    gl.setAttribute('y1', NV_MARGIN.top); gl.setAttribute('y2', NV_MARGIN.top + PLOT_H);
    gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = nv_el('text'); lbl.setAttribute('x', x); lbl.setAttribute('y', NV_MARGIN.top + PLOT_H + (bigFmt ? 34 : 18));
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('class', 's-tick');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.textContent = yr; svg.appendChild(lbl);
  });
  // grid + eje Y (0..100 cada 20)
  [0, 20, 40, 60, 80, 100].forEach(v => {
    const y = yS(v);
    const gl = nv_el('line'); gl.setAttribute('x1', NV_MARGIN.left); gl.setAttribute('x2', NV_MARGIN.left + PLOT_W);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lbl = nv_el('text'); lbl.setAttribute('x', NV_MARGIN.left - (bigFmt ? 12 : 8)); lbl.setAttribute('y', y + (bigFmt ? 8 : 4));
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('class', 's-tick'); lbl.style.fontSize = SIZES.tick + 'px';
    lbl.textContent = v + '%'; svg.appendChild(lbl);
  });
  // título eje Y
  const yT = nv_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle');
  yT.setAttribute('transform', `translate(${NV_MARGIN.left - (mobile || mobilePng ? 60 : bigFmt ? 52 : 44)}, ${NV_MARGIN.top + PLOT_H / 2}) rotate(-90)`);
  yT.style.fontSize = SIZES.axisTitle + 'px'; yT.textContent = tt('c6-axis-y', '% de jugadores nacidos en el país'); svg.appendChild(yT);

  // builder: pts = [[year, pct], ...]
  function build(pts) {
    const v = pts.filter(p => p[1] != null);
    if (!v.length) return '';
    return v.map((p, i) => (i === 0 ? 'M' : 'L') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
  }
  const endLabels = [];
  const halosG = nv_el('g'); svg.appendChild(halosG);
  const linesG = nv_el('g'); svg.appendChild(linesG);
  const dotsG = nv_el('g'); svg.appendChild(dotsG);
  const hitG = nv_el('g'); svg.appendChild(hitG);

  function drawSeries(pts, color, opts) {
    opts = opts || {};
    const d = build(pts); if (!d) return;
    const halo = nv_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW);
    halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round');
    if (opts.iso) halo.setAttribute('data-nv', opts.iso); halosG.appendChild(halo);
    const path = nv_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color); path.setAttribute('stroke-width', opts.ref ? lineW * 0.7 : lineW);
    path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
    if (opts.dash) path.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    if (opts.iso) { path.setAttribute('data-nv', opts.iso); path.setAttribute('data-base-w', lineW); path.classList.add('nv-colored'); }
    linesG.appendChild(path);
    // markers (OWID): un punto por dato
    if (opts.markers) pts.filter(p => p[1] != null).forEach(p => {
      const c = nv_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR);
      c.setAttribute('fill', color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
      if (opts.iso) c.setAttribute('data-nv', opts.iso); dotsG.appendChild(c);
    });
    // hit-area + hover (solo selecciones, desktop)
    if (opts.iso && !bigFmt && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) {
      const hit = nv_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 8, 9));
      hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => nv_emph(opts.iso));
      hit.addEventListener('mouseleave', () => nv_emph(null));
      hit.addEventListener('click', (ev) => { ev.stopPropagation(); nv_toggle(opts.iso); });
      hitG.appendChild(hit);
    }
    // etiqueta de fin
    const last = pts.filter(p => p[1] != null).slice(-1)[0];
    if (last) endLabels.push({ iso: opts.iso, color, text: opts.label, x: xS(last[0]), idealY: yS(last[1]), ref: opts.ref });
  }

  // --- promedio del Mundial ---
  const avgOut = nv_avg.map(p => [p[0], +(100 - p[1]).toFixed(1)]);
  if (!hasSel) {
    drawSeries(nv_avg, NV_COL_IN, { markers: true, label: tt('c6-label-in', 'Nacidos en el país') });
    drawSeries(avgOut, NV_COL_OUT, { markers: true, label: tt('c6-label-out', 'Nacidos en otro país') });
  } else {
    // referencia: promedio nacidos en el país (gris, sin marcadores)
    drawSeries(nv_avg, NV_COL_REF, { ref: true, dash: true, label: tt('c6-label-avg', 'Promedio Mundial') });
    selected.forEach(iso => {
      const tm = nv_byIso[iso];
      drawSeries(tm.pts.map(p => [p[0], p[1]]), nv_getColor(iso), { markers: true, iso, label: nv_displayName(iso, tm.name) });
    });
  }

  // etiquetas de fin (anti-colisión vertical)
  const GAP = bigFmt ? SIZES.label + 6 : 13;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => {
    l.y = i === 0 ? l.idealY : Math.max(l.idealY, endLabels[i - 1].y + GAP);
    l.y = Math.min(l.y, NV_MARGIN.top + PLOT_H); l.y = Math.max(l.y, NV_MARGIN.top + (bigFmt ? 6 : 2));
    l.shifted = Math.abs(l.y - l.idealY) > 1.5;
  });
  const endG = nv_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    if (l.shifted) {
      const g = nv_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY);
      g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y);
      g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8);
      g.setAttribute('stroke-opacity', 0.5); if (l.iso) g.setAttribute('data-nv', l.iso); endG.appendChild(g);
    }
    const txt = nv_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 8 : 4));
    txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600);
    txt.style.fontSize = (l.ref ? SIZES.label * 0.85 : SIZES.label) + 'px'; txt.style.fontFamily = 'var(--sans)';
    txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', labelHalo); txt.setAttribute('stroke-linejoin', 'round');
    if (l.iso) txt.setAttribute('data-nv', l.iso);
    txt.textContent = l.text; endG.appendChild(txt);
  });

  nv_applyHeadings(hasSel, aeCfg);
}

// Énfasis al hover sobre una línea (atenúa el resto).
function nv_emph(iso) {
  const svg = document.getElementById('chart6'); if (!svg) return;
  svg.querySelectorAll('[data-nv]').forEach(el => {
    const me = el.getAttribute('data-nv');
    if (iso == null) { el.style.opacity = ''; if (el.classList.contains('nv-colored')) el.setAttribute('stroke-width', el.getAttribute('data-base-w')); }
    else if (me === iso) { el.style.opacity = '1'; if (el.classList.contains('nv-colored')) el.setAttribute('stroke-width', (parseFloat(el.getAttribute('data-base-w')) * 1.5).toFixed(1)); }
    else el.style.opacity = '0.14';
  });
}

function nv_applyHeadings(hasSel, aeCfg) {
  const block = document.querySelector('.chart-block[data-chart="6"]') || document;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = tt('c6-title', 'La selección nacional, cada vez menos nacional');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = tt('c6-subtitle', 'Porcentaje de jugadores de cada Mundial nacidos en el país que representan.');
}

//==================================================================
//  Chips + buscador
//==================================================================
function nv_renderChips() {
  const c = document.getElementById('nv-selected-chips'); if (!c) return;
  c.innerHTML = ''; nv_initData();
  Array.from(nv_selMap().keys()).forEach(iso => {
    if (!nv_byIso[iso]) return;
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = nv_getColor(iso); chip.textContent = nv_displayName(iso, nv_byIso[iso].name);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => nv_toggle(iso)); chip.appendChild(x); c.appendChild(chip);
  });
}
function nv_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function setupNatividadSearch() {
  const input = document.getElementById('nv-search'), results = document.getElementById('nv-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => NATIVIDAD.teams.map(t => ({ iso3: t.iso3, name: nv_displayName(t.iso3, t.name) })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  function get(q) { if (!q) return []; const qn = nv_norm(q); return all().filter(c => nv_norm(c.name).includes(qn)).slice(0, 8); }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${nv_selMap().has(c.iso3) ? ' m-already' : ''}" data-iso="${c.iso3}">${c.name}</div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { nv_toggle(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); nv_toggle(matches[active].iso3); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}

//==================================================================
//  CSV
//==================================================================
function setupNatividadCSV() {
  document.querySelectorAll('button.download[data-chart="6-csv"]').forEach(btn => btn.addEventListener('click', () => {
    nv_initData();
    let csv = 'year,scope,iso3,name,pct_born_in_country,n_squad\n';
    nv_avg.forEach(p => { csv += `${p[0]},promedio,,,${p[1]},\n`; });
    NATIVIDAD.teams.forEach(t => t.pts.forEach(p => {
      const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[t.iso3]?.en) || t.name || t.iso3;
      const nq = /[",]/.test(nm) ? '"' + nm.replace(/"/g, '""') + '"' : nm;
      csv += `${p[0]},seleccion,${t.iso3},${nq},${p[1]},${p[2] != null ? p[2] : ''}\n`;
    }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-03-natividad-mundialistas.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

//==================================================================
//  Init + PNG
//==================================================================
function initNatividad() {
  nv_initData();
  if (!state[6]) state[6] = {};
  if (!(state[6].selectedCountries instanceof Map)) state[6].selectedCountries = new Map();
  drawNatividad();
  setupNatividadSearch();
  setupNatividadCSV();
  nv_renderChips();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initNatividad._wired) { initNatividad._wired = true; window.addEventListener('atlas-editor-change', () => drawNatividad()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawNatividad;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '6') return null;
    return (typeof t === 'function' ? t('c6-sources-tpl') : '') || null;
  };
}
