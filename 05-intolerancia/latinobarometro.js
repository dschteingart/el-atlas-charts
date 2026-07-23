// =============================================================
//  El Atlas N°5 — Chart 6: Latinobarómetro 2024 (barras horizontales)
// =============================================================
// Rechazo declarado a distintos tipos de vecino en 17 países de América Latina,
// medido por Latinobarómetro 2024 (misma batería que el WVS, otra encuestadora,
// dato fresco post-Qatar). Barras horizontales ordenadas, selector de categoría.
//
// Datos: LB_FOTO[cat] = [[iso3,pct,n],...] (data-lb.js), LB_REGION, LB_CATS.
// Argentina resaltada (terracota fuerte); resto terracota tenue — todos LatAm.

const LB_SVG_NS = 'http://www.w3.org/2000/svg';
const lb_ns = (t) => document.createElementNS(LB_SVG_NS, t);
const LB_ACCENT = '#BE5D32';        // terracota Atlas (Latam)
const LB_OTHER  = '#D8A488';        // terracota tenue
const LB_AXIS   = '#9C928A';
const LB_DEFAULT_CAT = 'inmigrantes';   // la historia distintiva de LB 2024 (migración)
const LB_HIGHLIGHT = 'ARG';

function lb_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport()
    : (window.innerWidth || 1024) < 768;
}
function lb_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function lb_measure(text, fs, w) {
  if (!lb_measure._c) { const c = document.createElement('canvas'); lb_measure._c = c.getContext('2d'); }
  lb_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return lb_measure._c.measureText(text).width;
}
function lb_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 40, right: 92, bottom: 78, left: 150 };
    case 'mobile': return { top: 30, right: 66, bottom: 60, left: 128 };
    default: return null;
  }
}

function lb_updateSubtitle() {
  const el = document.querySelector('.chart-subtitle[data-i18n="c6-subtitle-tpl"]');
  if (!el) return;
  const catA = (typeof t === 'function') ? t('catA-' + state[6].cat) : state[6].cat;
  const tpl = (typeof t === 'function') ? t('c6-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{CAT}', catA);
}

function drawLatino() {
  const svg = document.getElementById('chart6');
  if (!svg) return;
  svg.innerHTML = '';
  lb_updateSubtitle();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || lb_isMobile();
  const mobile = !editorFormat && lb_isMobile();

  const cat = state[6].cat;
  const data = (typeof LB_FOTO !== 'undefined' ? (LB_FOTO[cat] || []) : []).slice()
    .sort((a, b) => b[1] - a[1]);  // mayor rechazo arriba
  const n = data.length;

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, name: 27, value: 26 }
    : mobile
    ? { tick: 20, axisTitle: 23, name: 24, value: 22 }
    : { tick: 11, axisTitle: 11.5, name: 13, value: 12.5 };

  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH; MARGIN = lb_getMargins(editorFormat);
    BAR_GAP = Math.max(6, Math.round(90 / n));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = (plotH - (n - 1) * BAR_GAP) / n;
  } else {
    W = 1100;
    MARGIN = mobile ? { top: 24, right: 60, bottom: 54, left: 120 } : { top: 24, right: 84, bottom: 44, left: 140 };
    BAR_H = mobile ? 34 : 22; BAR_GAP = mobile ? 12 : 8;
    plotH = n * (BAR_H + BAR_GAP) - BAR_GAP;
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  // margen izq dinámico según el nombre más largo
  let maxNameW = 0;
  data.forEach(d => { const w = lb_measure(lb_name(d[0]), SIZES.name, 600); if (w > maxNameW) maxNameW = w; });
  MARGIN.left = Math.min(Math.round(W * 0.34), Math.max(MARGIN.left, Math.ceil(maxNameW) + (bigFmt ? 16 : 10)));

  const plotW = W - MARGIN.left - MARGIN.right;
  const maxV = Math.max(...data.map(d => d[1]), 5);
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const xScale = (v) => MARGIN.left + (v / (maxV * 1.06)) * plotW;
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, maxV * 1.06, 5) : [0, 10, 20, 30];

  // grid + ticks X
  const gridG = lb_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = lb_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = lb_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v) + '%';
    gridG.appendChild(lbl);
  });
  // eje X título
  const xTitle = lb_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 60 : 36));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c6-axis-x') : '% que no lo querría de vecino';
  svg.appendChild(xTitle);

  const tooltip = document.getElementById('tooltip6');
  const barsG = lb_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const [iso, pct, nn] = d;
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const isHi = iso === LB_HIGHLIGHT;
    const barW = xScale(pct) - MARGIN.left;
    // nombre país
    const nameTxt = lb_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 8); nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px'; nameTxt.setAttribute('font-weight', isHi ? 700 : 500);
    nameTxt.setAttribute('fill', isHi ? '#8B4220' : '#3A3530');
    nameTxt.textContent = lb_name(iso);
    barsG.appendChild(nameTxt);
    // barra
    const rect = lb_ns('rect');
    rect.setAttribute('x', MARGIN.left); rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', isHi ? LB_ACCENT : LB_OTHER);
    rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); lb_showTooltip(e, iso, pct, nn); });
    rect.addEventListener('mousemove', (e) => lb_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); lb_hideTooltip(); });
    barsG.appendChild(rect);
    // valor
    const valTxt = lb_ns('text');
    valTxt.setAttribute('x', MARGIN.left + barW + 6); valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = (typeof fmt === 'function') ? fmt(pct, 1) : pct;
    barsG.appendChild(valTxt);
  });
  // linea cero
  const zero = lb_ns('line');
  zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', LB_AXIS); zero.setAttribute('stroke-width', 1);
  svg.appendChild(zero);

  // título insight→neutral (insight solo en la categoría default)
  if (typeof atlasSetHeading === 'function') {
    const isDefault = cat === LB_DEFAULT_CAT;
    atlasSetHeading('6', false, { title: 'c6-title', titleNeutral: 'c6-title-neutral' });
  }
}

// tooltip
function lb_showTooltip(e, iso, pct, nn) {
  const tt = document.getElementById('tooltip6'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  tt.innerHTML = `<strong>${lb_name(iso)}</strong>`
    + `<div class="tt-row"><span>${L('c1-tt-pct')}</span><span>${(typeof fmt === 'function') ? fmt(pct, 1) : pct}%</span></div>`
    + `<div class="tt-row"><span>${L('c6-tt-survey')}</span><span>Latinobarómetro 2024</span></div>`
    + `<div class="tt-row"><span>${L('c1-tt-n')}</span><span>${(typeof fmt === 'function') ? fmt(nn, 0) : nn}</span></div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
  lb_posTooltip(e);
}
function lb_posTooltip(e) {
  const tt = document.getElementById('tooltip6'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function lb_hideTooltip() { const tt = document.getElementById('tooltip6'); if (tt) tt.style.opacity = '0'; }

function setupLatinoCat() {
  const sel = document.getElementById('lb-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (typeof LB_FOTO === 'undefined' || !LB_FOTO[sel.value]) return;
    state[6].cat = sel.value;
    drawLatino();
  });
}

function setupLatinoCSV() {
  document.querySelectorAll('button.download[data-chart="6-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — Latinobarometro 2024, bateria de vecinos (P3NOIJ)\n';
      csv += '# % que menciona a cada grupo como vecino no deseado (base: respondieron la bateria).\n';
      csv += 'iso3,pais,categoria,pct,n\n';
      (typeof LB_CATS !== 'undefined' ? LB_CATS : Object.keys(LB_FOTO)).forEach(c => {
        (LB_FOTO[c] || []).forEach(([iso, pct, nn]) => {
          const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
          csv += `${iso},${nm},${c},${pct},${nn}\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-latinobarometro-2024.csv' : 'el-atlas-05-latinobarometro-2024.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initLatino() {
  if (!state[6]) state[6] = { cat: LB_DEFAULT_CAT };
  const sel = document.getElementById('lb-cat-select');
  if (sel) sel.value = state[6].cat;   // sincronizar el selector con el default
  setupLatinoCat();
  setupLatinoCSV();
  drawLatino();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawLatino;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initLatino._wired) {
    initLatino._wired = true;
    window.addEventListener('atlas-editor-change', () => drawLatino());
  }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '6') return null;
    return (typeof t === 'function') ? t('c6-sources') : null;
  };
}
