// =============================================================
//  El Atlas N°4 — CHART 12 «¿Quién es el más discriminado?»
// =============================================================
//
// Latinobarómetro 2020, pregunta P58ST (RESPUESTA ÚNICA: el grupo MÁS
// discriminado del país). 18 países de América Latina, % ponderado (wt) sobre
// respuestas válidas. Recodeo NUESTRO de 42 categorías originales a 12 macro.
//
// Dos vistas (clones de motores ya hechos del N°4), hoy conmutadas por las
// PESTAÑAS del shell lib/grapher.js (antes: un toggle propio #qn-view):
//   - 'ranking' : barras horizontales de los 18 países para UNA macrocategoría
//                 (clon de la vista 'sel' de ranking.js). Selector de categoría,
//                 mediana regional con toggle.
//   - 'perfil'  : las 12 macrocategorías de un país (clon de perfil.js), con la
//                 mediana regional de cada una y el detalle de las 42 crudas.
// Ambas comparten el MISMO <svg id="chart12"> y el MISMO state[12]: el shell
// sólo muestra/oculta el panel de controles de cada vista y setea state[12].view
// antes de llamar a drawQuien() (ver el initGrapher de chart-quien.html).
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
// Rampa secuencial del Atlas: la misma del mapa del número (mapa.js), para que
// "más oscuro = más lo señalan" signifique lo mismo en las dos páginas.
const QN_HEAT_COLORS = ['#F4E4CE', '#E8B98C', '#D98E5B', '#C0632F', '#8F3F1E', '#5A2412'];

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
  } else if (s.view === 'matriz') {
    const tpl = (typeof t === 'function') ? t('c12-subtitle-matriz-tpl') : '';
    el.textContent = tpl.replace('{CAT}', qn_catLabel(s.cat));
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
  // El shell puede inyectar la categoría desde la URL (?cat=): si no existe,
  // volvemos al default en vez de dibujar un chart vacío.
  if (!QUIEN_FOTO[s.cat]) s.cat = QN_DEFAULT_CAT;
  // Los dos <select> de categoría (Ranking y Matriz) son vistas del MISMO
  // state[12].cat: se sincronizan en cada dibujo, así el valor sobrevive al
  // cambio de pestaña y a la categoría que inyecta la URL (?cat=).
  ['qn-cat-select', 'qn-sort-select'].forEach(id => {
    const cs = document.getElementById(id);
    if (cs && cs.value !== s.cat) cs.value = s.cat;
  });
  qn_hideTooltip();   // al cambiar de pestaña/control el SVG se rehace: no dejar el tooltip colgado
  qn_updateSubtitle();

  // Visibilidad de controles según la vista.
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  show('qn-cat-group', s.view === 'ranking');
  show('qn-refs-group', s.view === 'ranking');
  show('qn-country-group', s.view === 'perfil');
  show('qn-sort-group', s.view === 'matriz');
  const detailWrap = document.getElementById('qn-detail-wrap');
  if (detailWrap) detailWrap.style.display = (s.view === 'perfil') ? '' : 'none';

  if (s.view === 'perfil') qn_drawPerfil();
  else if (s.view === 'matriz') qn_drawMatriz();
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
//  Vista 'matriz': el heatmap de 18 países × 12 grupos
//==================================================================
// Las otras dos vistas son cortes de esta misma tabla: el Ranking es UNA COLUMNA
// dibujada como barras y el Perfil es UNA FILA. La matriz las muestra juntas, que
// es donde se ve el hallazgo del chart: la columna de los pobres es la oscura en
// casi todas las filas.
//
// Como la pregunta es de respuesta ÚNICA, cada fila suma 100: los valores son una
// composición, no 12 mediciones independientes. Por eso el recuadro que marca el
// máximo de cada fila es la lectura principal —"a quién señala primero cada
// país"— y no un adorno.
//
// La categoría elegida en el selector ORDENA las filas y resalta su columna: es
// el mismo state[12].cat que usa el Ranking, así que pasar de una pestaña a la
// otra no pierde el hilo.
function qn_drawMatriz() {
  const svg = document.getElementById('chart12');
  if (!svg) return;
  svg.innerHTML = '';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigPng = editorFormat === 'square' || editorFormat === 'newsletter' || editorFormat === 'mobile';
  const mobile = !editorFormat && qn_isMobile();
  const bigFmt = bigPng || mobile;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = bigPng
    ? { name: 26, head: 24, cell: 22, legend: 22, note: 22 }
    : mobile
    ? { name: 20, head: 17, cell: 14, legend: 18, note: 18 }
    : { name: 12.5, head: 11.5, cell: 11, legend: 11, note: 11 };

  const cats = qn_heatCols();
  const rows = qn_heatRows();
  const nC = cats.length, nR = rows.length;
  if (!nC || !nR) return;

  // Geometría. El margen superior y el derecho salen del ancho REAL de la
  // etiqueta de columna más larga: van rotadas 45°, así que ocupan su ancho
  // por el coseno de 45 en las dos direcciones. Medirlo es lo que evita que
  // "Salud o discapacidad" se corte contra el borde del viewBox.
  let W, totalH;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; totalH = f.vbH; }
  else { W = 1100; totalH = 0; }

  let maxHead = 0;
  cats.forEach(c => { const w = qn_measure(qn_catLabel(c), SIZES.head, 600); if (w > maxHead) maxHead = w; });
  let maxName = 0;
  rows.forEach(r => { const w = qn_measure(qn_name(r.iso), SIZES.name, 500); if (w > maxName) maxName = w; });

  // Una etiqueta rotada 45° ocupa, en cada eje, (ancho + alto) × cos 45. El alto
  // NO es despreciable en los formatos PNG, donde la tipografía se duplica: con
  // sólo el ancho, la fila de encabezados se salía 7 px por arriba del viewBox.
  const diag = (maxHead + SIZES.head * 1.15) * Math.SQRT1_2;
  const MARGIN = {
    top:    Math.ceil(diag) + (bigFmt ? 18 : 12),
    right:  Math.min(Math.round(W * 0.24), Math.ceil(diag) + (bigFmt ? 16 : 10)),
    left:   Math.ceil(maxName) + (bigFmt ? 18 : 10),
    bottom: bigFmt ? 118 : 74           // leyenda de color + nota del recuadro
  };

  let cellH;
  if (editorFormat) {
    cellH = (totalH - MARGIN.top - MARGIN.bottom) / nR;
  } else {
    cellH = mobile ? 30 : 24;
    totalH = MARGIN.top + nR * cellH + MARGIN.bottom;
  }
  const plotW = W - MARGIN.left - MARGIN.right;
  const cellW = plotW / nC;
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);

  // El número se achica a la celda: son 216, y el cuerpo de los otros formatos
  // (22 px, pensado para barras) no entra en una celda de 24. Si ni así entra
  // —pantalla angosta— la matriz se queda sólo con el color, que es su lectura
  // principal, y el valor exacto lo da el tooltip.
  SIZES.cell = Math.min(SIZES.cell, cellH * 0.62, cellW * 0.36);
  // En pantalla la medida que importa no es la del viewBox sino la REAL: el SVG
  // se escala al ancho del contenedor, así que en un celular de 400 px estos
  // 14 px de viewBox se dibujan como 5. Ahí los números se van y queda el color,
  // que es lo que la matriz tiene para decir de un vistazo; el valor exacto lo
  // sigue dando el tooltip al tocar.
  const cssW = editorFormat ? W : ((svg.getBoundingClientRect().width || W));
  const showVals = SIZES.cell >= 8 && SIZES.cell * (cssW / W) >= 7;

  // Escala de color: cuantiles sobre las 216 celdas, no sobre un 0-100 fijo.
  // La distribución es muy asimétrica (la mayoría de los grupos ronda el 2% y
  // los pobres se van al 30%), así que con cortes iguales la matriz quedaba
  // casi toda del tono más claro.
  const todos = [];
  rows.forEach(r => cats.forEach(c => todos.push(r.pct[c])));
  const breaks = qn_heatBreaks(todos);

  const gCells = qn_ns('g'); svg.appendChild(gCells);

  // ---- Encabezados de columna (rotados 45°) ----
  cats.forEach((c, j) => {
    const cx = MARGIN.left + j * cellW + cellW / 2;
    const sel = (c === state[12].cat);
    const th = qn_ns('text');
    th.setAttribute('x', cx);
    th.setAttribute('y', MARGIN.top - (bigFmt ? 10 : 7));
    th.setAttribute('text-anchor', 'start');
    th.setAttribute('transform', `rotate(-45, ${cx}, ${MARGIN.top - (bigFmt ? 10 : 7)})`);
    th.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    th.style.fontSize = SIZES.head + 'px';
    th.setAttribute('font-weight', sel ? 700 : 500);
    th.setAttribute('fill', sel ? '#8B3F1E' : '#5A5346');
    th.textContent = qn_catLabel(c);
    gCells.appendChild(th);
  });

  // ---- Celdas ----
  rows.forEach((r, i) => {
    const y = MARGIN.top + i * cellH;

    const nm = qn_ns('text');
    nm.setAttribute('x', MARGIN.left - (bigFmt ? 10 : 6));
    nm.setAttribute('y', y + cellH / 2);
    nm.setAttribute('text-anchor', 'end');
    nm.setAttribute('dominant-baseline', 'central');
    nm.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nm.style.fontSize = SIZES.name + 'px';
    nm.setAttribute('font-weight', 500);
    nm.setAttribute('fill', '#3A3530');
    nm.textContent = qn_name(r.iso);
    gCells.appendChild(nm);

    cats.forEach((c, j) => {
      const x = MARGIN.left + j * cellW;
      const v = r.pct[c];
      const bin = qn_heatBin(v, breaks);

      const rect = qn_ns('rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', cellW); rect.setAttribute('height', cellH);
      rect.setAttribute('fill', QN_HEAT_COLORS[bin]);
      rect.setAttribute('stroke', '#FBF8F1');      // el fondo del papel: separa sin dibujar una grilla
      rect.setAttribute('stroke-width', 1);
      rect.style.cursor = 'pointer';
      const show = (ev) => qn_showTooltipHeat(ev, r.iso, c, v);
      rect.addEventListener('mouseenter', show);
      rect.addEventListener('click', show);        // en touch no hay hover: el tap abre el tooltip
      rect.addEventListener('mousemove', (ev) => qn_posTooltip(ev));
      rect.addEventListener('mouseleave', qn_hideTooltip);
      gCells.appendChild(rect);

      if (showVals) {
        const tx = qn_ns('text');
        tx.setAttribute('x', x + cellW / 2);
        tx.setAttribute('y', y + cellH / 2);
        tx.setAttribute('text-anchor', 'middle');
        tx.setAttribute('dominant-baseline', 'central');
        tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
        tx.style.fontSize = SIZES.cell + 'px';
        tx.setAttribute('font-variant-numeric', 'tabular-nums');
        tx.setAttribute('font-weight', c === r.top ? 700 : 400);
        // Texto claro sobre los dos tonos más oscuros; si no, no se lee.
        tx.setAttribute('fill', bin >= 4 ? '#FBF8F1' : '#3A3530');
        tx.style.pointerEvents = 'none';
        tx.textContent = qn_fmt(v, 0);
        gCells.appendChild(tx);
      }
    });

    // Recuadro del máximo de la fila: el grupo que ESE país señala primero.
    const jTop = cats.indexOf(r.top);
    if (jTop >= 0) {
      const box = qn_ns('rect');
      box.setAttribute('x', MARGIN.left + jTop * cellW + 1);
      box.setAttribute('y', y + 1);
      box.setAttribute('width', cellW - 2); box.setAttribute('height', cellH - 2);
      box.setAttribute('fill', 'none');
      box.setAttribute('stroke', '#2E2A25');
      box.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      box.style.pointerEvents = 'none';
      gCells.appendChild(box);
    }
  });

  // ---- Marco de la columna ordenadora ----
  const jSel = cats.indexOf(state[12].cat);
  if (jSel >= 0) {
    const col = qn_ns('rect');
    col.setAttribute('x', MARGIN.left + jSel * cellW);
    col.setAttribute('y', MARGIN.top);
    col.setAttribute('width', cellW); col.setAttribute('height', nR * cellH);
    col.setAttribute('fill', 'none');
    col.setAttribute('stroke', '#8B3F1E');
    col.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
    col.style.pointerEvents = 'none';
    svg.appendChild(col);
  }

  // ---- Leyenda de color + nota del recuadro ----
  qn_drawHeatLegend(svg, MARGIN, plotW, MARGIN.top + nR * cellH + (bigFmt ? 40 : 26),
                    breaks, SIZES, bigFmt);
}

// Cortes por cuantiles → 6 bins (mismo criterio que el mapa del número).
function qn_heatBreaks(values) {
  const v = values.filter(x => x != null).sort((a, b) => a - b);
  const N = QN_HEAT_COLORS.length;
  if (v.length < N) return v.length ? [...new Set(v)] : [10];
  const br = [];
  for (let i = 1; i < N; i++) br.push(Math.round(v[Math.floor(v.length * i / N)]));
  return [...new Set(br)];
}
function qn_heatBin(v, breaks) {
  if (v == null) return 0;
  let i = 0; for (const b of breaks) { if (v < b) return i; i++; }
  return Math.min(i, QN_HEAT_COLORS.length - 1);
}
// Columnas ordenadas por la mediana regional, de más a menos señalado: la matriz
// se lee de izquierda a derecha como el orden en que América Latina nombra a sus
// discriminados.
// «Ninguno» y «Otros» van siempre al final aunque su mediana sea alta: no son
// grupos, y metidos en el medio de la fila rompen la lectura de izquierda a
// derecha (Nicaragua contesta «ninguno» tanto como Brasil contesta «pobres»).
const QN_HEAT_LAST = ['ninguna', 'otros'];
function qn_heatCols() {
  const cats = (typeof QUIEN_CATS !== 'undefined') ? QUIEN_CATS.slice() : [];
  return cats.sort((a, b) => {
    const ra = QN_HEAT_LAST.indexOf(a), rb = QN_HEAT_LAST.indexOf(b);
    if (ra >= 0 || rb >= 0) return (ra < 0 ? -1 : ra) - (rb < 0 ? -1 : rb);
    const ma = qn_median(a), mb = qn_median(b);
    return (mb ? mb.value : 0) - (ma ? ma.value : 0);
  });
}
// Filas: un país por fila, ordenadas DESC por la categoría elegida.
function qn_heatRows() {
  const cats = (typeof QUIEN_CATS !== 'undefined') ? QUIEN_CATS : [];
  const isos = Array.from(new Set((QUIEN_FOTO[cats[0]] || []).map(r => r[0])));
  const out = isos.map(iso => {
    const pct = {};
    cats.forEach(c => { pct[c] = qn_pctOf(iso, c); });
    return { iso, pct, top: qn_topMacro(iso).cat };
  });
  const k = state[12].cat;
  out.sort((a, b) => (b.pct[k] || 0) - (a.pct[k] || 0));
  return out;
}

function qn_drawHeatLegend(svg, MARGIN, plotW, y, breaks, SIZES, bigFmt) {
  const g = qn_ns('g'); svg.appendChild(g);
  const swW = bigFmt ? 54 : 34, swH = bigFmt ? 14 : 10;
  const total = QN_HEAT_COLORS.length * swW;
  const x0 = MARGIN.left;

  const title = qn_ns('text');
  title.setAttribute('x', x0); title.setAttribute('y', y - (bigFmt ? 10 : 7));
  title.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  title.style.fontSize = SIZES.legend + 'px';
  title.setAttribute('fill', '#7A6E62'); title.setAttribute('font-weight', 600);
  title.textContent = (typeof t === 'function') ? t('c12-heat-legend') : '% que lo nombra';
  g.appendChild(title);

  QN_HEAT_COLORS.forEach((col, i) => {
    const sw = qn_ns('rect');
    sw.setAttribute('x', x0 + i * swW); sw.setAttribute('y', y);
    sw.setAttribute('width', swW); sw.setAttribute('height', swH);
    sw.setAttribute('fill', col);
    g.appendChild(sw);
    if (i < breaks.length) {
      const lb = qn_ns('text');
      lb.setAttribute('x', x0 + (i + 1) * swW);
      lb.setAttribute('y', y + swH + (bigFmt ? 20 : 13));
      lb.setAttribute('text-anchor', 'middle');
      lb.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      lb.style.fontSize = SIZES.legend + 'px';
      lb.setAttribute('fill', '#7A6E62');
      lb.setAttribute('font-variant-numeric', 'tabular-nums');
      lb.textContent = qn_fmt(breaks[i], 0);
      g.appendChild(lb);
    }
  });

  // Nota del recuadro, a la derecha de la leyenda si hay lugar; si no, debajo.
  const nota = (typeof t === 'function') ? t('c12-heat-box-note') : '';
  if (!nota) return;
  const notaW = qn_measure(nota, SIZES.note, 400);
  const cabe = (x0 + total + 24 + notaW) <= (MARGIN.left + plotW);
  const nt = qn_ns('text');
  nt.setAttribute('x', cabe ? x0 + total + 24 : x0);
  nt.setAttribute('y', cabe ? y + swH - (bigFmt ? 1 : 1) : y + swH + (bigFmt ? 44 : 30));
  nt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  nt.style.fontSize = SIZES.note + 'px';
  nt.setAttribute('fill', '#7A6E62');
  nt.textContent = nota;
  svg.appendChild(nt);
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

// Tooltip de una celda de la matriz. Da el valor con decimal (la celda muestra
// el entero) y, sobre todo, el grupo que ese país señala primero: sin eso, un
// 12% suelto no dice si es mucho o poco para ESE país.
function qn_showTooltipHeat(event, iso, cat, pct) {
  const tt = document.getElementById('tooltip12');
  if (!tt) return;
  const L = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const top = qn_topMacro(iso);
  const med = qn_median(cat);
  tt.innerHTML =
    `<strong>${qn_name(iso)}</strong>` +
    `<div class="tt-sub">${qn_catLabel(cat)} · Latinobarómetro 2020</div>` +
    `<div class="tt-row tt-row-strong"><span>${L('c12-tt-pct', 'Lo nombran')}</span><span>${qn_fmt(pct, 1)}%</span></div>` +
    (med ? `<div class="tt-row"><span>${L('c12-median-legend', 'Mediana regional')}</span><span>${qn_fmt(med.value, 1)}%</span></div>` : '') +
    `<div class="tt-row"><span>${L('c12-tt-top', 'Grupo más señalado')}</span><span>${qn_catLabel(top.cat)} (${qn_fmt(top.pct, 1)}%)</span></div>` +
    qn_compositionLine(iso, cat);
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
// La conmutación ranking↔perfil la hacen las pestañas del shell (grapher.js):
// setean state[12].view en su redrawFull y llaman a drawQuien(). Acá sólo queda
// el cableado de los controles propios de cada vista.

function setupQuienCat() {
  const sel = document.getElementById('qn-cat-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!QUIEN_FOTO[sel.value]) return;
    state[12].cat = sel.value;
    drawQuien();
  });
}

// Rellena el <select> de país (se re-llama al cambiar de idioma y al entrar a
// la vista Perfil, para reflejar el país que migró desde otra vista). El
// listener se cablea UNA sola vez: si no, cada recarga de opciones apilaría
// otro 'change' y drawQuien() correría de más.
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
  if (isos.indexOf(state[12].iso) === -1 && isos.length) state[12].iso = isos[0];
  sel.value = state[12].iso;
  if (!setupQuienCountry._wired) {
    setupQuienCountry._wired = true;
    sel.addEventListener('change', () => { state[12].iso = sel.value; qn_hideTooltip(); drawQuien(); });
  }
}

// Selector de la matriz: es el MISMO state[12].cat que el del Ranking (el shell
// los sincroniza vía catSel), así que elegir "Migrantes" en una pestaña y pasar
// a la otra mantiene el hilo. Acá ordena las filas y resalta la columna.
function setupQuienSort() {
  const sel = document.getElementById('qn-sort-select');
  if (!sel) return;
  sel.value = state[12].cat;
  if (setupQuienSort._wired) return;
  setupQuienSort._wired = true;
  sel.addEventListener('change', () => {
    if (!QUIEN_FOTO[sel.value]) return;
    state[12].cat = sel.value;
    const otro = document.getElementById('qn-cat-select');
    if (otro) otro.value = sel.value;
    qn_hideTooltip();
    drawQuien();
  });
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
        ? 'the-atlas-04-most-discriminated-group.csv'
        : 'el-atlas-04-grupo-mas-discriminado.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
// initQuien() es el init de las DOS vistas del shell (grapher.js lleva su flag
// 'inited' por vista, así que lo llama una vez por pestaña): los hooks de PNG se
// resetean siempre —el shell los captura justo después de cada init()— pero el
// cableado de controles corre una sola vez.
function initQuien() {
  if (!state[12]) {
    state[12] = {
      cat: QN_DEFAULT_CAT,
      view: 'ranking',
      iso: QN_DEFAULT_ISO,
      showMedian: true
    };
  }

  // ---- Hooks de PNG (los captura el shell tras cada init) ----
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawQuien;
  // Nota corta para el PNG.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '12') return null;
    return (typeof t === 'function') ? t('c12-sources-png') : null;
  };

  if (initQuien._wired) return;
  initQuien._wired = true;

  // Sincronizar el <select> de categoría con el default.
  const catSel = document.getElementById('qn-cat-select');
  if (catSel) catSel.value = state[12].cat;

  setupQuienCat();
  setupQuienCountry();
  setupQuienSort();
  setupQuienMedian();
  setupQuienCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  window.addEventListener('atlas-editor-change', () => drawQuien());
  drawQuien();
}
