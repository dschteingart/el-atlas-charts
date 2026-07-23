// =============================================================
//  El Atlas N°5 — Chart 4: perfil de intolerancia de un país
// =============================================================
// Para un país elegido (default Argentina): barras horizontales del % que lo
// rechazaría como vecino, categoría por categoría, ordenadas de mayor a menor,
// con la MEDIANA MUNDIAL de cada categoría como marcador de referencia. Muestra
// "a quién le teme cada sociedad": la Argentina rechaza a la conducta
// (drogadictos, bebedores) mucho más que a la identidad (raza, inmigrantes, gay).
//
// Datos: VE_FOTO[cat] = [[iso3,pct,year,study,n],...] (data-vecinos.js), VE_CATS.

const PF_SVG_NS = 'http://www.w3.org/2000/svg';
const pf_ns = (t) => document.createElementNS(PF_SVG_NS, t);
const PF_BAR = '#BE5D32';      // terracota (el país)
const PF_MED = '#5A5346';      // gris para la mediana mundial
const PF_AXIS = '#9C928A';
const PF_DEFAULT_ISO = 'ARG';

function pf_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function pf_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function pf_catLabel(cat) { return (typeof t === 'function') ? t('cat-' + cat) : cat; }
function pf_measure(text, fs, w) {
  if (!pf_measure._c) { const c = document.createElement('canvas'); pf_measure._c = c.getContext('2d'); }
  pf_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return pf_measure._c.measureText(text).width;
}
function pf_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 44, right: 96, bottom: 86, left: 300 };
    case 'mobile': return { top: 30, right: 70, bottom: 60, left: 250 };
    default: return null;
  }
}

// Universo de países: los que tienen dato en la categoría ancla (otra_raza).
function pf_countries() {
  const set = new Set();
  (typeof VE_CATS !== 'undefined' ? VE_CATS : []).forEach(c => (VE_FOTO[c] || []).forEach(r => set.add(r[0])));
  return Array.from(set).sort((a, b) => pf_name(a).localeCompare(pf_name(b), 'es'));
}

// Mediana de un array de números.
function pf_median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Datos del país: [{cat, pct, med, year}] ordenado por pct desc.
function pf_computeData(iso) {
  const cats = (typeof VE_CATS !== 'undefined') ? VE_CATS : [];
  const out = [];
  cats.forEach(cat => {
    const rows = VE_FOTO[cat] || [];
    const mine = rows.find(r => r[0] === iso);
    if (!mine) return;
    const med = pf_median(rows.map(r => r[1]));
    out.push({ cat, pct: mine[1], year: mine[2], med });
  });
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

function pf_updateSubtitle(iso) {
  const el = document.querySelector('.chart-subtitle[data-i18n="c4-subtitle-tpl"]');
  if (!el) return;
  const tpl = (typeof t === 'function') ? t('c4-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{PAIS}', pf_name(iso));
}

function drawPerfil() {
  const svg = document.getElementById('chart4');
  if (!svg) return;
  svg.innerHTML = '';
  const iso = state[4].iso;
  pf_updateSubtitle(iso);

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || pf_isMobile();
  const mobile = !editorFormat && pf_isMobile();
  const data = pf_computeData(iso);
  const n = data.length;

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, name: 26, value: 26, med: 21 }
    : mobile
    ? { tick: 20, axisTitle: 22, name: 23, value: 22, med: 19 }
    : { tick: 11, axisTitle: 11.5, name: 13, value: 12.5, med: 11 };

  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH; MARGIN = pf_getMargins(editorFormat);
    BAR_GAP = Math.max(10, Math.round(120 / n));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = (plotH - (n - 1) * BAR_GAP) / n;
  } else {
    W = 1100;
    MARGIN = mobile ? { top: 24, right: 60, bottom: 54, left: 220 } : { top: 24, right: 84, bottom: 44, left: 260 };
    BAR_H = mobile ? 34 : 26; BAR_GAP = mobile ? 14 : 12;
    plotH = n * (BAR_H + BAR_GAP) - BAR_GAP;
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  // margen izq dinámico según la etiqueta de categoría más larga
  let maxNameW = 0;
  data.forEach(d => { const w = pf_measure(pf_catLabel(d.cat), SIZES.name, 600); if (w > maxNameW) maxNameW = w; });
  MARGIN.left = Math.min(Math.round(W * 0.42), Math.max(MARGIN.left, Math.ceil(maxNameW) + (bigFmt ? 18 : 12)));

  const plotW = W - MARGIN.left - MARGIN.right;
  const maxV = Math.max(...data.map(d => Math.max(d.pct, d.med || 0)), 5);
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const xScale = (v) => MARGIN.left + (v / (maxV * 1.08)) * plotW;
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, maxV * 1.08, 5) : [0, 20, 40, 60];

  const gridG = pf_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = pf_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = pf_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v) + '%';
    gridG.appendChild(lbl);
  });
  const xTitle = pf_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 60 : 36));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c6-axis-x') : '% que no lo querría de vecino';
  svg.appendChild(xTitle);

  const tooltip = document.getElementById('tooltip4');
  const barsG = pf_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const barW = xScale(d.pct) - MARGIN.left;
    // etiqueta categoría
    const nameTxt = pf_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 10); nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px'; nameTxt.setAttribute('font-weight', 500);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = pf_catLabel(d.cat);
    barsG.appendChild(nameTxt);
    // barra país
    const rect = pf_ns('rect');
    rect.setAttribute('x', MARGIN.left); rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', PF_BAR); rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); pf_showTooltip(e, d); });
    rect.addEventListener('mousemove', (e) => pf_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); pf_hideTooltip(); });
    barsG.appendChild(rect);
    // valor
    const valTxt = pf_ns('text');
    valTxt.setAttribute('x', MARGIN.left + barW + 6); valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = (typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct;
    barsG.appendChild(valTxt);
    // marcador mediana mundial (rombo + linea vertical fina)
    if (d.med != null) {
      const mx = xScale(d.med);
      const mline = pf_ns('line');
      mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
      mline.setAttribute('y1', y - 2); mline.setAttribute('y2', y + BAR_H + 2);
      mline.setAttribute('stroke', PF_MED); mline.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      mline.setAttribute('pointer-events', 'none');
      barsG.appendChild(mline);
    }
  });

  // linea cero
  const zero = pf_ns('line');
  zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', PF_AXIS); zero.setAttribute('stroke-width', 1);
  svg.appendChild(zero);

  // Leyenda de la mediana (línea gris + label), ABAJO a la derecha del plot:
  // arriba-derecha la tapaba la primera barra (la más larga); abajo las barras
  // son cortas y queda despejado (pedido de Daniel 2026-07-23). Con halo crema.
  const legG = pf_ns('g'); svg.appendChild(legG);
  const legTxt = (typeof t === 'function') ? t('c4-median-legend') : 'Mediana mundial';
  const legW = pf_measure(legTxt, SIZES.med, 500) + 16;
  const lx = MARGIN.left + plotW - legW, ly = MARGIN.top + plotH - (bigFmt ? 18 : 12);
  const ll = pf_ns('line');
  ll.setAttribute('x1', lx); ll.setAttribute('x2', lx); ll.setAttribute('y1', ly - 6); ll.setAttribute('y2', ly + 6);
  ll.setAttribute('stroke', PF_MED); ll.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
  legG.appendChild(ll);
  const lt = pf_ns('text');
  lt.setAttribute('x', lx + 8); lt.setAttribute('y', ly); lt.setAttribute('dominant-baseline', 'central');
  lt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  lt.style.fontSize = SIZES.med + 'px'; lt.setAttribute('fill', PF_MED); lt.setAttribute('font-weight', 500);
  lt.setAttribute('paint-order', 'stroke'); lt.setAttribute('stroke', '#FAF8F3'); lt.setAttribute('stroke-width', bigFmt ? 4 : 3); lt.setAttribute('stroke-linejoin', 'round');
  lt.textContent = legTxt;
  legG.appendChild(lt);

  // título insight→neutral (insight solo para Argentina)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('4', false, { title: 'c4-title', titleNeutral: 'c4-title-neutral' });
  }
}

function pf_showTooltip(e, d) {
  const tt = document.getElementById('tooltip4'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  const cmp = d.med != null ? (d.pct >= d.med ? L('c4-tt-above') : L('c4-tt-below')) : '';
  tt.innerHTML = `<strong>${pf_catLabel(d.cat)}</strong>`
    + `<div class="tt-row"><span>${pf_name(state[4].iso)}</span><span>${(typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct}%</span></div>`
    + (d.med != null ? `<div class="tt-row"><span>${L('c4-median-legend')}</span><span>${(typeof fmt === 'function') ? fmt(d.med, 1) : d.med}%</span></div>` : '')
    + (cmp ? `<div class="tt-sub">${cmp}</div>` : '');
  tt.style.display = 'block'; tt.style.opacity = '1';
  pf_posTooltip(e);
}
function pf_posTooltip(e) {
  const tt = document.getElementById('tooltip4'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function pf_hideTooltip() { const tt = document.getElementById('tooltip4'); if (tt) tt.style.opacity = '0'; }

function setupPerfilCountry() {
  const sel = document.getElementById('pf-country-select');
  if (!sel) return;
  // poblar
  sel.innerHTML = '';
  pf_countries().forEach(iso => {
    const o = document.createElement('option');
    o.value = iso; o.textContent = pf_name(iso);
    sel.appendChild(o);
  });
  sel.value = state[4].iso;
  sel.addEventListener('change', () => { state[4].iso = sel.value; drawPerfil(); });
}

function setupPerfilCSV() {
  document.querySelectorAll('button.download[data-chart="4-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — perfil de intolerancia por pais (IVS, ultimo dato 2017-2022)\n';
      csv += 'iso3,pais,categoria,pct,mediana_mundial,anio\n';
      (typeof VE_CATS !== 'undefined' ? VE_CATS : []).forEach(cat => {
        const rows = VE_FOTO[cat] || [];
        const med = pf_median(rows.map(r => r[1]));
        rows.forEach(r => {
          const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? COUNTRY_NAMES[r[0]].en : r[0];
          csv += `${r[0]},${nm},${cat},${r[1]},${med != null ? med.toFixed(1) : ''},${r[2]}\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-country-profile.csv' : 'el-atlas-05-perfil-pais.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initPerfil() {
  if (!state[4]) state[4] = { iso: PF_DEFAULT_ISO };
  setupPerfilCountry();
  setupPerfilCSV();
  drawPerfil();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawPerfil;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initPerfil._wired) {
    initPerfil._wired = true;
    window.addEventListener('atlas-editor-change', () => drawPerfil());
  }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '4') return null;
    return (typeof t === 'function') ? t('c4-sources') : null;
  };
}
