// =============================================================
//  El Atlas N°5 — CHART 12 «¿Quién es el más discriminado?»
// =============================================================
//
// Latinobarómetro 2020, pregunta P58ST (RESPUESTA ÚNICA: el grupo MÁS
// discriminado del país). 18 países de América Latina, % ponderado (wt) sobre
// respuestas válidas. Recodeo NUESTRO de 42 categorías originales a 12 macro.
//
// Dos vistas (clones de motores ya hechos del N°5):
//   - 'ranking' : barras horizontales de los 18 países para UNA macrocategoría
//                 (clon de la vista 'sel' de ranking.js). Selector de categoría,
//                 orden descendente, mediana regional con toggle.
//   - 'perfil'  : las 12 macrocategorías de un país (clon de perfil.js), con la
//                 mediana regional de cada una y el detalle de las 42 crudas.
//
// Inputs (data-quien.js): QUIEN_CATS, QUIEN_REGION, QUIEN_FOTO[cat]=[[iso,pct,
//   2020,study,nBase]], QUIEN_RAW[iso]=[[cod,pct,n]], QUIEN_META.
// State (state[12]): cat, view ('ranking'|'perfil'), iso, showMedian.

//==================================================================
//  Constantes
//==================================================================
const QN_SVG_NS = 'http://www.w3.org/2000/svg';
const qn_ns = (tag) => document.createElementNS(QN_SVG_NS, tag);

const QN_DEFAULT_CAT = 'raza_etnia';   // el gancho editorial arranca por lo racial
const QN_DEFAULT_ISO = 'ARG';
const QN_MED = '#5A5346';              // gris de la mediana regional
const QN_AXIS = '#9C928A';

const QN_RK_MARGIN_DESKTOP = { top: 34, right: 88, bottom: 48, left: 132 };
const QN_RK_MARGIN_MOBILE  = { top: 34, right: 60, bottom: 72, left: 118 };  // bottom holga p/ el título de eje (+64) en mobile

function qn_rkMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 44, right: 96, bottom: 96, left: 210 };
    case 'square':     return { top: 44, right: 96, bottom: 96, left: 210 };
    case 'mobile':     return { top: 34, right: 60, bottom: 76, left: 150 };
    default:           return null;
  }
}
function qn_pfMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 44, right: 96, bottom: 86, left: 300 };
    case 'mobile': return { top: 30, right: 70, bottom: 60, left: 250 };
    default: return null;
  }
}

//==================================================================
//  Helpers
//==================================================================
function qn_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }

function qn_name(iso) {
  const lang = qn_lang();
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}
function qn_catLabel(cat) { return (typeof t === 'function') ? t('qcat-' + cat) : cat; }
function qn_itemLabel(cod) {
  const lang = qn_lang();
  const L = QUIEN_META.itemLabels[lang] || QUIEN_META.itemLabels.es;
  return L[String(cod)] || String(cod);
}
function qn_regionColor(iso) {
  const reg = QUIEN_REGION[iso];
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#BE5D32';
}
function qn_regionLabelColor(iso) {
  const reg = QUIEN_REGION[iso];
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || '#8B3F1E';
}
function qn_measure(text, fs, w) {
  if (!qn_measure._c) { const c = document.createElement('canvas'); qn_measure._c = c.getContext('2d'); }
  qn_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return qn_measure._c.measureText(text).width;
}
function qn_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}
function qn_fmt(v, d) { return (typeof fmt === 'function') ? fmt(v, d) : String(v); }

//==================================================================
//  Datos
//==================================================================
// Filas de una categoría: [{iso, pct, n, region}] (QUIEN_FOTO ya viene asc por pct).
function qn_rankRows(cat) {
  return (QUIEN_FOTO[cat] || []).map(r => ({
    iso: r[0], pct: r[1], year: r[2], study: r[3], n: r[4], region: QUIEN_REGION[r[0]]
  }));
}
// Mediana regional (= mediana de los 18) de la categoría.
function qn_median(cat) {
  const v = (QUIEN_FOTO[cat] || []).map(r => r[1]);   // asc
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  const med = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return { value: med, n: v.length };
}
// pct de un país en una categoría (0 si no está).
function qn_pctOf(iso, cat) {
  const row = (QUIEN_FOTO[cat] || []).find(r => r[0] === iso);
  return row ? row[1] : 0;
}
// Macrocategoría más señalada de un país: {cat, pct}.
function qn_topMacro(iso) {
  let best = null;
  (typeof QUIEN_CATS !== 'undefined' ? QUIEN_CATS : []).forEach(cat => {
    const p = qn_pctOf(iso, cat);
    if (!best || p > best.pct) best = { cat, pct: p };
  });
  return best || { cat: null, pct: 0 };
}
// Composición cruda de un país dentro de una macro: [[cod, pct, n], ...] desc.
function qn_composition(iso, cat) {
  const macroOf = QUIEN_META.itemMacro || {};
  return (QUIEN_RAW[iso] || []).filter(r => macroOf[String(r[0])] === cat);
}
// Perfil de un país: [{cat, pct, med}] ordenado desc por pct.
function qn_perfilData(iso) {
  const cats = (typeof QUIEN_CATS !== 'undefined') ? QUIEN_CATS : [];
  const out = cats.map(cat => {
    const m = qn_median(cat);
    return { cat, pct: qn_pctOf(iso, cat), med: m ? m.value : null };
  });
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

//==================================================================
//  Subtítulo dinámico
//==================================================================
function qn_updateSubtitle() {
  const block = document.querySelector('.chart-block[data-chart="12"]') || document;
  const el = block.querySelector('.chart-subtitle');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || qn_lang();
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;   // respeta el subtítulo custom del editor
  const s = state[12];
  if (s.view === 'perfil') {
    const tpl = (typeof t === 'function') ? t('c12-subtitle-perfil-tpl') : '';
    el.textContent = tpl.replace('{PAIS}', qn_name(s.iso));
  } else {
    const tpl = (typeof t === 'function') ? t('c12-subtitle-rank-tpl') : '';
    el.textContent = tpl.replace('{CAT}', qn_catLabel(s.cat));
  }
}

//==================================================================
//  Dispatcher
//==================================================================
function drawQuien() {
  const s = state[12];
  qn_updateSubtitle();

  // Visibilidad de controles según la vista.
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  show('qn-cat-group', s.view === 'ranking');
  show('qn-refs-group', s.view === 'ranking');
  show('qn-country-group', s.view === 'perfil');
  const detailWrap = document.getElementById('qn-detail-wrap');
  if (detailWrap) detailWrap.style.display = (s.view === 'perfil') ? '' : 'none';

  if (s.view === 'perfil') qn_drawPerfil();
  else qn_drawRanking();

  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('12', false, { title: 'c12-title', titleNeutral: 'c12-title-neutral' });
  }
}

//==================================================================
//  Vista 'ranking': barras horizontales de los 18 países (clon del render de barras de ranking.js)
//==================================================================
function qn_drawRanking() {
  const svg = document.getElementById('chart12');
  if (!svg) return;
  svg.innerHTML = '';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && qn_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const cat = state[12].cat;
  const data = qn_rankRows(cat).slice().sort((a, b) => a.pct - b.pct);   // asc → mayor arriba
  const n = data.length;
  const med = state[12].showMedian ? qn_median(cat) : null;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, medLbl: 24 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, medLbl: 20 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, medLbl: 11 };

  let W, MARGIN, BAR_H, BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH; MARGIN = qn_rkMargins(editorFormat);
    BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = n > 0 ? (plotH - (n - 1) * BAR_GAP) / n : 10;
    const fitName = Math.floor((BAR_H + BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    W = 1100;
    MARGIN = mobile ? { ...QN_RK_MARGIN_MOBILE } : { ...QN_RK_MARGIN_DESKTOP };
    BAR_H = mobile ? 40 : 20; BAR_GAP = mobile ? 12 : 5;
    plotH = Math.max(40, n * (BAR_H + BAR_GAP) - BAR_GAP);
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  // Margen izquierdo dinámico según el nombre de país más largo.
  let maxNameW = 0;
  data.forEach(d => { const w = qn_measure(qn_name(d.iso), SIZES.name, 700); if (w > maxNameW) maxNameW = w; });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    MARGIN.left = Math.min(Math.round(W * 0.42), Math.max(MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);

  const plotW = W - MARGIN.left - MARGIN.right;
  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.pct), med ? med.value : 0, 1) : 1;
  const xMax = maxPct * 1.06;
  const xScale = (v) => MARGIN.left + (v / xMax) * plotW;

  // Grid + ticks eje X.
  const gridG = qn_ns('g'); svg.appendChild(gridG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 20, 40, 60];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = qn_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = qn_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = qn_fmt(v, 0);
    gridG.appendChild(lbl);
  });

  const xTitle = qn_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c12-axis-x') : '% que lo nombra';
  svg.appendChild(xTitle);

  // Barras.
  const barsG = qn_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const color = qn_regionColor(d.iso);
    const barW = xScale(d.pct) - MARGIN.left;
    // Emphasis: cuando la categoría activa ES el grupo más señalado de ese país,
    // el nombre va en negrita y color de región (así se ve, literalmente, "en
    // cuántos países gana este grupo"). Solo la etiqueta — las barras quedan a
    // color pleno (el único atenuado por opacidad es el hover; norma del proyecto).
    const isTop = qn_topMacro(d.iso).cat === state[12].cat;

    const nameTxt = qn_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 8);
    nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', isTop ? 700 : 500);
    nameTxt.setAttribute('fill', isTop ? qn_regionLabelColor(d.iso) : '#3A3530');
    nameTxt.textContent = qn_name(d.iso);
    barsG.appendChild(nameTxt);

    const rect = qn_ns('rect');
    rect.setAttribute('x', MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', color);
    rect.setAttribute('fill-opacity', 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.iso = d.iso;
    rect.addEventListener('mouseenter', (ev) => { rect.setAttribute('fill-opacity', 1); qn_showTooltipRank(ev, d); });
    rect.addEventListener('mousemove', (ev) => qn_posTooltip(ev));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 0.92); qn_hideTooltip(); });
    barsG.appendChild(rect);

    const valTxt = qn_ns('text');
    valTxt.setAttribute('x', MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = qn_fmt(d.pct, 1);
    barsG.appendChild(valTxt);
  });

  // Mediana regional (línea vertical punteada).
  if (med) {
    const mx = xScale(med.value);
    const mline = qn_ns('line');
    mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
    mline.setAttribute('y1', MARGIN.top - (bigFmt ? 8 : 6));
    mline.setAttribute('y2', MARGIN.top + plotH);
    mline.setAttribute('stroke', '#8A8579');
    mline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    mline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    svg.appendChild(mline);
    const mlbl = qn_ns('text');
    const mlblTxt = ((typeof t === 'function') ? t('c12-median-lbl') : 'Mediana regional')
      + ': ' + qn_fmt(med.value, 1) + '%';
    const lblW = qn_measure(mlblTxt, SIZES.medLbl, 600);
    const anchorEnd = mx + 8 + lblW > W - 4;
    mlbl.setAttribute('x', anchorEnd ? mx - 8 : mx + 8);
    mlbl.setAttribute('y', MARGIN.top - (bigFmt ? 16 : 12));
    mlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    mlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    mlbl.style.fontSize = SIZES.medLbl + 'px';
    mlbl.setAttribute('font-weight', 600);
    mlbl.setAttribute('fill', '#7A6E62');
    mlbl.textContent = mlblTxt;
    svg.appendChild(mlbl);
  }

  // Línea cero.
  const zeroLine = qn_ns('line');
  zeroLine.setAttribute('x1', MARGIN.left); zeroLine.setAttribute('x2', MARGIN.left);
  zeroLine.setAttribute('y1', MARGIN.top); zeroLine.setAttribute('y2', MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A'); zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);
}

//==================================================================
//  Vista 'perfil': las 12 macrocategorías de un país (clon del render de perfil.js)
//==================================================================
function qn_drawPerfil() {
  const svg = document.getElementById('chart12');
  if (!svg) return;
  svg.innerHTML = '';
  const iso = state[12].iso;

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || qn_isMobile();
  const mobile = !editorFormat && qn_isMobile();
  const data = qn_perfilData(iso);
  const n = data.length;

  if (n === 0) {
    svg.setAttribute('viewBox', '0 0 1100 180');
    const msg = qn_ns('text');
    msg.setAttribute('x', 550); msg.setAttribute('y', 90); msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    msg.style.fontSize = '18px'; msg.setAttribute('fill', '#8A8579');
    const tpl = (typeof t === 'function') ? t('c12-nodata') : '{PAIS} — sin datos.';
    msg.textContent = tpl.replace('{PAIS}', qn_name(iso));
    svg.appendChild(msg);
    return;
  }

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, name: 26, value: 26, med: 21 }
    : mobile
    ? { tick: 20, axisTitle: 22, name: 23, value: 22, med: 19 }
    : { tick: 11, axisTitle: 11.5, name: 13, value: 12.5, med: 11 };

  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH; MARGIN = qn_pfMargins(editorFormat);
    BAR_GAP = Math.max(10, Math.round(120 / n));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = (plotH - (n - 1) * BAR_GAP) / n;
  } else {
    W = 1100;
    MARGIN = mobile ? { top: 24, right: 60, bottom: 68, left: 220 } : { top: 24, right: 84, bottom: 44, left: 260 };
    BAR_H = mobile ? 32 : 24; BAR_GAP = mobile ? 12 : 10;
    plotH = n * (BAR_H + BAR_GAP) - BAR_GAP;
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  let maxNameW = 0;
  data.forEach(d => { const w = qn_measure(qn_catLabel(d.cat), SIZES.name, 600); if (w > maxNameW) maxNameW = w; });
  MARGIN.left = Math.min(Math.round(W * 0.42), Math.max(MARGIN.left, Math.ceil(maxNameW) + (bigFmt ? 18 : 12)));

  const plotW = W - MARGIN.left - MARGIN.right;
  const maxV = Math.max(...data.map(d => Math.max(d.pct, d.med || 0)), 5);
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const xScale = (v) => MARGIN.left + (v / (maxV * 1.08)) * plotW;
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, maxV * 1.08, 5) : [0, 20, 40, 60];

  const gridG = qn_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = qn_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = qn_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v) + '%';
    gridG.appendChild(lbl);
  });
  const xTitle = qn_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 60 : 36));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c12-axis-x') : '% que lo nombra';
  svg.appendChild(xTitle);

  const barsG = qn_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const barW = xScale(d.pct) - MARGIN.left;
    const nameTxt = qn_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 10); nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px'; nameTxt.setAttribute('font-weight', 500);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = qn_catLabel(d.cat);
    barsG.appendChild(nameTxt);

    const rect = qn_ns('rect');
    rect.setAttribute('x', MARGIN.left); rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', qn_regionColor(iso)); rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); qn_showTooltipPerfil(e, d); });
    rect.addEventListener('mousemove', (e) => qn_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); qn_hideTooltip(); });
    barsG.appendChild(rect);

    const valTxt = qn_ns('text');
    valTxt.setAttribute('x', MARGIN.left + barW + 6); valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = qn_fmt(d.pct, 1);
    barsG.appendChild(valTxt);

    // Marcador de la mediana regional (línea vertical fina).
    if (d.med != null) {
      const mx = xScale(d.med);
      const mline = qn_ns('line');
      mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
      mline.setAttribute('y1', y - 2); mline.setAttribute('y2', y + BAR_H + 2);
      mline.setAttribute('stroke', QN_MED); mline.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      mline.setAttribute('pointer-events', 'none');
      barsG.appendChild(mline);
    }
  });

  // Línea cero.
  const zero = qn_ns('line');
  zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', QN_AXIS); zero.setAttribute('stroke-width', 1);
  svg.appendChild(zero);

  // Leyenda de la mediana (recuadro abajo-derecha, como en perfil.js).
  const legG = qn_ns('g'); svg.appendChild(legG);
  const legTxt = (typeof t === 'function') ? t('c12-median-legend') : 'Mediana regional';
  const fs = SIZES.med;
  const padX = bigFmt ? 12 : 8, padY = bigFmt ? 8 : 5, tickW = bigFmt ? 3 : 2, gap = bigFmt ? 10 : 7;
  const txtW = qn_measure(legTxt, fs, 500);
  const boxW = padX * 2 + tickW + gap + txtW, boxH = padY * 2 + fs * 1.15;
  const boxX = MARGIN.left + plotW - boxW, boxY = MARGIN.top + plotH - boxH - (bigFmt ? 8 : 5);
  const box = qn_ns('rect');
  box.setAttribute('x', boxX); box.setAttribute('y', boxY);
  box.setAttribute('width', boxW); box.setAttribute('height', boxH); box.setAttribute('rx', 5);
  box.setAttribute('fill', '#F2EEE3'); box.setAttribute('stroke', '#E0DCC8'); box.setAttribute('stroke-width', 1);
  legG.appendChild(box);
  const cy = boxY + boxH / 2;
  const ll = qn_ns('line');
  const lx = boxX + padX;
  ll.setAttribute('x1', lx); ll.setAttribute('x2', lx);
  ll.setAttribute('y1', cy - fs * 0.5); ll.setAttribute('y2', cy + fs * 0.5);
  ll.setAttribute('stroke', QN_MED); ll.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
  legG.appendChild(ll);
  const lt = qn_ns('text');
  lt.setAttribute('x', lx + tickW + gap); lt.setAttribute('y', cy); lt.setAttribute('dominant-baseline', 'central');
  lt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  lt.style.fontSize = fs + 'px'; lt.setAttribute('fill', QN_MED); lt.setAttribute('font-weight', 600);
  lt.textContent = legTxt;
  legG.appendChild(lt);

  // Panel de detalle (las 42 crudas del país).
  qn_renderDetail(iso);
}

//==================================================================
//  Panel de detalle: las 42 categorías crudas del país (vista perfil)
//==================================================================
function qn_renderDetail(iso) {
  const introEl = document.getElementById('qn-detail-intro');
  if (introEl) {
    const tpl = (typeof t === 'function') ? t('c12-detail-intro-tpl') : '';
    introEl.textContent = tpl.replace('{PAIS}', qn_name(iso));
  }
  const body = document.getElementById('qn-detail-body');
  if (!body) return;
  const cats = (typeof QUIEN_CATS !== 'undefined') ? QUIEN_CATS : [];
  // Orden de lectura: por pct total de la macro en el país (desc).
  const groups = cats.map(cat => {
    const items = qn_composition(iso, cat).slice().sort((a, b) => b[1] - a[1]);
    const total = items.reduce((s, r) => s + r[1], 0);
    return { cat, items, total };
  }).filter(g => g.items.length > 0)
    .sort((a, b) => b.total - a.total);

  body.innerHTML = groups.map(g => {
    const rows = g.items.map(r =>
      `<div class="qn-d-item"><span class="qn-d-item-lbl">${qn_itemLabel(r[0])}</span>` +
      `<span class="qn-d-item-val">${qn_fmt(r[1], 1)}%</span></div>`
    ).join('');
    return `<div class="qn-d-group">
      <div class="qn-d-head">
        <span class="qn-d-swatch" style="background:${qn_regionColor(iso)}"></span>
        <span class="qn-d-macro">${qn_catLabel(g.cat)}</span>
        <span class="qn-d-total">${qn_fmt(g.total, 1)}%</span>
      </div>
      <div class="qn-d-items">${rows}</div>
    </div>`;
  }).join('');
}

//==================================================================
//  Tooltips (comparten #tooltip12)
//==================================================================
function qn_compositionLine(iso, cat) {
  const comp = qn_composition(iso, cat).slice().sort((a, b) => b[1] - a[1]);
  if (!comp.length) return '';
  const MAX = 3;
  const parts = comp.slice(0, MAX).map(r => `${qn_itemLabel(r[0])} ${qn_fmt(r[1], 1)}%`);
  let txt = parts.join(' · ');
  if (comp.length > MAX) {
    const more = (typeof t === 'function') ? t('c12-tt-more-tpl') : 'y {N} más';
    txt += ' · ' + more.replace('{N}', comp.length - MAX);
  }
  const lbl = (typeof t === 'function') ? t('c12-tt-incl') : 'Respuestas originales';
  return `<div class="tt-sub"><em>${lbl}:</em> ${txt}</div>`;
}

function qn_showTooltipRank(event, d) {
  const tt = document.getElementById('tooltip12');
  if (!tt) return;
  const L = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const reg = d.region ? L('reg.' + d.region, d.region) : '';
  const top = qn_topMacro(d.iso);
  tt.innerHTML =
    `<strong>${qn_name(d.iso)}</strong>` +
    `<div class="tt-sub">${reg} · Latinobarómetro 2020</div>` +
    `<div class="tt-row tt-row-strong"><span>${qn_catLabel(state[12].cat)}</span><span>${qn_fmt(d.pct, 1)}%</span></div>` +
    `<div class="tt-row"><span>${L('c12-tt-top', 'Grupo más señalado')}</span><span>${qn_catLabel(top.cat)} (${qn_fmt(top.pct, 1)}%)</span></div>` +
    `<div class="tt-row"><span>${L('c12-tt-n', 'Muestra')}</span><span>${qn_fmt(d.n, 0)}</span></div>` +
    qn_compositionLine(d.iso, state[12].cat);
  tt.style.display = 'block'; tt.style.opacity = '1';
  qn_posTooltip(event);
}

function qn_showTooltipPerfil(event, d) {
  const tt = document.getElementById('tooltip12');
  if (!tt) return;
  const L = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const iso = state[12].iso;
  const cmp = d.med != null ? (d.pct >= d.med ? L('c12-tt-above', '') : L('c12-tt-below', '')) : '';
  tt.innerHTML =
    `<strong>${qn_catLabel(d.cat)}</strong>` +
    `<div class="tt-sub">${qn_name(iso)} · Latinobarómetro 2020</div>` +
    `<div class="tt-row tt-row-strong"><span>${L('c12-tt-pct', 'Lo nombran')}</span><span>${qn_fmt(d.pct, 1)}%</span></div>` +
    (d.med != null ? `<div class="tt-row"><span>${L('c12-median-legend', 'Mediana regional')}</span><span>${qn_fmt(d.med, 1)}%</span></div>` : '') +
    qn_compositionLine(iso, d.cat) +
    (cmp ? `<div class="tt-sub">${cmp}</div>` : '');
  tt.style.display = 'block'; tt.style.opacity = '1';
  qn_posTooltip(event);
}

function qn_posTooltip(event) {
  const tt = document.getElementById('tooltip12');
  if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const cx = (typeof evClientX === 'function') ? evClientX(event) : event.clientX;
  const cy = (typeof evClientY === 'function') ? evClientY(event) : event.clientY;
  const x = cx - wrap.left, y = cy - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;   // borde derecho → a la izquierda
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function qn_hideTooltip() { const tt = document.getElementById('tooltip12'); if (tt) tt.style.opacity = '0'; }

//==================================================================
//  Controles
//==================================================================
function setupQuienView() {
  document.querySelectorAll('#qn-view button').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v !== 'ranking' && v !== 'perfil') return;
      if (state[12].view === v) return;
      state[12].view = v;
      document.querySelectorAll('#qn-view button')
        .forEach(b => b.classList.toggle('active', b.dataset.view === v));
      qn_hideTooltip();
      drawQuien();
    });
  });
}

function setupQuienCat() {
  const sel = document.getElementById('qn-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!QUIEN_FOTO[sel.value]) return;
    state[12].cat = sel.value;
    drawQuien();
  });
}

function setupQuienCountry() {
  const sel = document.getElementById('qn-country-select');
  if (!sel) return;
  const isos = (typeof QUIEN_CATS !== 'undefined')
    ? Array.from(new Set((QUIEN_FOTO[QUIEN_CATS[0]] || []).map(r => r[0])))
    : [];
  isos.sort((a, b) => qn_name(a).localeCompare(qn_name(b), 'es'));
  sel.innerHTML = '';
  isos.forEach(iso => {
    const o = document.createElement('option');
    o.value = iso; o.textContent = qn_name(iso);
    sel.appendChild(o);
  });
  sel.value = state[12].iso;
  sel.addEventListener('change', () => { state[12].iso = sel.value; drawQuien(); });
}

function setupQuienMedian() {
  const btn = document.querySelector('#qn-refs button[data-ref="median"]');
  if (!btn) return;
  btn.classList.toggle('active', state[12].showMedian !== false);
  btn.addEventListener('click', () => {
    state[12].showMedian = !(state[12].showMedian !== false);
    btn.classList.toggle('active', state[12].showMedian);
    drawQuien();
  });
}

//==================================================================
//  Descarga CSV — macro (lo que muestra el chart) + crudas (nuestro valor)
//==================================================================
function setupQuienCSV() {
  document.querySelectorAll('button.download[data-chart="12-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = qn_lang();
      const nm = (iso) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso])
        ? (COUNTRY_NAMES[iso].en || iso) : iso;
      const catEn = (cat) => (QUIEN_META.catLabels.en && QUIEN_META.catLabels.en[cat]) || cat;
      let csv = '';
      csv += '# El Atlas N°5 — Grupo mas discriminado por pais (Latinobarometro 2020, P58ST, respuesta unica)\n';
      csv += '# pct = % ponderado (wt) que nombra a la categoria como el grupo MAS discriminado; nBase = respuestas validas del pais.\n';
      csv += '# BLOQUE 1: 12 macrocategorias (recodeo propio). BLOQUE 2: 42 categorias originales.\n';
      csv += '\n# macro\niso3,country,macro_key,macro_label_en,pct,year,n_base\n';
      (typeof QUIEN_CATS !== 'undefined' ? QUIEN_CATS : []).forEach(cat => {
        (QUIEN_FOTO[cat] || []).forEach(r => {
          csv += [r[0], nm(r[0]), cat, catEn(cat), r[1], r[2], r[4]].join(',') + '\n';
        });
      });
      csv += '\n# raw\niso3,country,code,item_label_en,macro_key,pct\n';
      const macroOf = QUIEN_META.itemMacro || {};
      const labEn = QUIEN_META.itemLabels.en || {};
      Object.keys(QUIEN_RAW).forEach(iso => {
        QUIEN_RAW[iso].forEach(r => {
          const lab = (labEn[String(r[0])] || '').replace(/,/g, ';');
          csv += [iso, nm(iso), r[0], lab, macroOf[String(r[0])] || '', r[1]].join(',') + '\n';
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = lang === 'en'
        ? 'the-atlas-05-most-discriminated-group.csv'
        : 'el-atlas-05-grupo-mas-discriminado.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initQuien() {
  if (!state[12]) {
    state[12] = {
      cat: QN_DEFAULT_CAT,
      view: 'ranking',
      iso: QN_DEFAULT_ISO,
      showMedian: true
    };
  }
  // Sincronizar el <select> de categoría con el default.
  const catSel = document.getElementById('qn-cat-select');
  if (catSel) catSel.value = state[12].cat;

  setupQuienView();
  setupQuienCat();
  setupQuienCountry();
  setupQuienMedian();
  setupQuienCSV();
  drawQuien();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawQuien;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initQuien._wired) {
    initQuien._wired = true;
    window.addEventListener('atlas-editor-change', () => drawQuien());
  }
  // Nota corta para el PNG.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '12') return null;
    return (typeof t === 'function') ? t('c12-sources-png') : null;
  };
}
