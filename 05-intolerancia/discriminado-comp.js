// =============================================================
//  El Atlas N°5 — Comparación: grupo discriminado (chart 16)
// =============================================================
//
// CLON de ranking.js vía barrio-comp.js (regla de oro: clonar el motor, no
// reimplementar). Renombre sistemático: bc_→dk_, BC_→DK_, state[13]→state[16],
// chart13→chart16, tooltip13→tooltip16, bc-→dk-, c13-→c16-.
//
// QUÉ SE DESCARTÓ DEL CLON (y por qué):
//   · la sub-vista MARIMEKKO ("todos los países"): el dataset es una sola
//     región con 18 países; la pared de ~92 barras rotadas con callouts existe
//     para que entren decenas de países en un ancho fijo. Acá entran los 18 de
//     una como barras horizontales legibles, con el nombre y el valor escritos.
//   · la TABLA DE PROMEDIOS REGIONALES: tendría una fila (Latin America) y
//     media (Caribbean = sólo República Dominicana). No informa nada.
//   · la LEYENDA INTERACTIVA DE REGIONES (mostrar/ocultar por región): mismo
//     motivo — no hay regiones que contrastar. Con ella se fueron el
//     hiddenRegions/activeRegion y el color por región: es UNA sola serie, así
//     que va en un solo color (la terracota LatAm del Atlas).
//   · la sub-vista MARIMEKKO detrás del toggle "Mostrar": el toggle SÍ está
//     (es la norma de los graficadores de comparación del número), pero acá
//     "Todos" son las 18 barras y "Mi selección" son sólo las elegidas — no
//     hay marimekko de por medio.
//
// UN SOLO CONTROL DE SELECCIÓN (fix, Daniel 25/7): esta vista llegó a tener el
// toggle de VISTA (#dk-view) y ADEMÁS unos atajos "Todos / Ninguno" que editaban
// la selección. Con la vista en "Todos", "Ninguno" vaciaba los chips y el
// gráfico seguía mostrando las 18 barras: parecía roto. Los atajos se
// eliminaron. Queda el conjunto canónico de vecinos/barrio/prioridad/migrantes:
// buscador + chips con ✕ (+ el botón "Limpiar" universal que lib/utils.js
// engancha solo a los contenedores *-selected-chips).
//
// QUÉ SE CONSERVÓ: orden por valor (asc, la barra más larga abajo), referencia
// punteada (acá el promedio regional en vez de la mediana mundial), buscador +
// chips WYSIWYG, tooltip con puesto, PNG por formato, CSV.
//
// ADAPTACIÓN DE DATOS: el "selector de categoría" del ranking original (ítem de
// la batería) es acá la RONDA de la encuesta, con SLIDER (no select): las cinco
// rondas están ordenadas en el tiempo, y arrastrar el thumb muestra cómo se
// reordena el ranking entre 2009 y 2020 — un select obligaría a abrir el menú
// cada vez y perdería esa lectura de "película". Se suma el selector de
// UNIVERSO (país / grupo étnico), que es el mismo control que la vista de
// líneas y viaja con ella.
//
// Inputs (data-discriminado.js): DISC_META, DISC_SERIES.
// State (state[16]): univ, year, sel{pais[],etnia[]}, selected (espejo), showAvg.

//==================================================================
//  Constantes
//==================================================================
const DK_MARGIN_DESKTOP = { top: 34, right: 96, bottom: 46, left: 132 };
const DK_MARGIN_MOBILE  = { top: 34, right: 70, bottom: 56, left: 118 };

// Serie única → color único. Es la terracota que el Atlas usa para América
// Latina (REGION_COLORS['Latin America']), la región de todo el dataset.
const DK_BAR_COLOR = '#BE5D32';
const DK_REF_COLOR = '#6E6B66';   // gris del promedio regional (igual que la vista de líneas)

const DK_YEARS = (typeof DISC_META !== 'undefined' && DISC_META.years)
  ? DISC_META.years.slice() : [2009, 2010, 2011, 2015, 2020];
const DK_DEFAULT_YEAR = DK_YEARS[DK_YEARS.length - 1];   // ronda más reciente (2020)
const DK_DEFAULT_UNIV = 'pais';

const DK_SVG_NS = 'http://www.w3.org/2000/svg';
const dk_ns = (tag) => document.createElementNS(DK_SVG_NS, tag);

// Universo COMPARTIDO por las dos vistas del graficador (ver dk_bindShared).
let DK_UNIV = DK_DEFAULT_UNIV;

// Márgenes por formato de PNG. Sin leyenda de regiones el bottom es mucho más
// corto que en el clon original (allá reservaba 108-128px para la leyenda).
function dk_getMargins(format) {
  switch (format) {
    case 'newsletter': return { top: 44, right: 112, bottom: 78, left: 210 };
    case 'square':     return { top: 44, right: 112, bottom: 78, left: 210 };
    case 'mobile':     return { top: 34, right: 80, bottom: 72, left: 158 };
    default:           return null;
  }
}

//==================================================================
//  Helpers
//==================================================================
function dk_src(univ) {
  return (typeof DISC_SERIES !== 'undefined') ? (DISC_SERIES[univ] || {}) : {};
}
function dk_keys(univ) {
  return Object.keys(dk_src(univ));
}
function dk_defaultSel(univ) {
  const m = (typeof DISC_META !== 'undefined' && DISC_META[univ]) ? DISC_META[univ] : null;
  return (m && m.default) ? m.default.slice() : dk_keys(univ);
}

// Nombre de una clave según el universo (país → COUNTRY_NAMES; etnia → labels
// de DISC_META). Mismo criterio que dc_name() en la vista de líneas.
function dk_displayName(univ, key) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (univ === 'etnia') {
    const labs = (typeof DISC_META !== 'undefined' && DISC_META.etnia && DISC_META.etnia.labels
      && DISC_META.etnia.labels[lang]) || {};
    return labs[key] || key;
  }
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key]) {
    return COUNTRY_NAMES[key][lang] || COUNTRY_NAMES[key].en || key;
  }
  return key;
}

function dk_measureText(text, fontSize, weight) {
  if (!dk_measureText._ctx) {
    const c = document.createElement('canvas');
    dk_measureText._ctx = c.getContext('2d');
  }
  const ctx = dk_measureText._ctx;
  ctx.font = `${weight || 400} ${fontSize}px "Source Sans 3", system-ui, sans-serif`;
  return ctx.measureText(text).width;
}

function dk_isMobile() {
  return (typeof isMobileViewport === 'function')
    ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}

//==================================================================
//  Datos: la FOTO de una ronda
//==================================================================
// dk_foto(univ, year) -> [[clave, pct, year, n], ...] ordenado ASC por pct.
// Toma de DISC_SERIES[univ][clave] la observación con ESE año EXACTO. Las
// rondas del Latinobarómetro son discretas (2009, 2010, 2011, 2015, 2020): no
// se interpola ni se busca "la más cercana". Si una clave no tiene ese año, se
// omite de la foto (hoy las 18+5 claves tienen las cinco rondas, pero la regla
// vale igual: nunca inventar un dato).
function dk_foto(univ, year) {
  const src = dk_src(univ);
  const rows = [];
  Object.keys(src).forEach(function (key) {
    const serie = src[key] || [];
    for (let i = 0; i < serie.length; i++) {
      if (serie[i][0] === year) {
        rows.push([key, serie[i][1], serie[i][0], (serie[i][2] != null ? serie[i][2] : null)]);
        break;
      }
    }
  });
  rows.sort(function (a, b) {
    return (a[1] - b[1]) || String(a[0]).localeCompare(String(b[0]));
  });
  return rows;
}

// Filas a dibujar: sólo las claves seleccionadas (los chips), en el orden ASC
// de la foto completa. El puesto se calcula sobre la foto COMPLETA del universo
// (1 = el más alto), así sacar países de la selección no mueve el ranking.
function dk_computeData() {
  const s = state[16];
  const univ = s.univ;
  const foto = dk_foto(univ, s.year);
  const N = foto.length;
  // Vista 'all' (default): todas las claves del universo — con 18 países en
  // barras entran holgadas y comparar TODOS es el punto de esta vista. Vista
  // 'sel': sólo los chips. Mismo criterio que el toggle de ranking.js en los
  // otros graficadores del número; los chips siguen siendo la selección que
  // viaja a la vista de Evolución.
  const showAll = s.view === 'all';
  const sel = new Set(s.sel[univ] || []);
  const out = [];
  foto.forEach(function (r, i) {
    if (!showAll && !sel.has(r[0])) return;
    out.push({ key: r[0], pct: r[1], year: r[2], n: r[3], rank: N - i, universe: N });
  });
  return out;
}

// Referencia: promedio regional (media simple del panel balanceado de 18
// países) en la ronda activa. Sale tal cual de DISC_META.regionAvg.
function dk_regionAvg(year) {
  if (typeof DISC_META === 'undefined' || !Array.isArray(DISC_META.regionAvg)) return null;
  const panel = DISC_META.regionAvgPanel || [];
  for (let i = 0; i < DISC_META.regionAvg.length; i++) {
    if (DISC_META.regionAvg[i][0] === year) {
      return { value: DISC_META.regionAvg[i][1], n: panel.length };
    }
  }
  return null;
}

function dk_yearLabel() {
  return String(state[16].year);
}

// Rótulo del puesto ("4° de 18" / "#4 of 18").
function dk_rankLabel(rank, n) {
  const tpl = (typeof t === 'function') ? t('c16-rank-tpl') : '{R}/{N}';
  return tpl.replace('{R}', rank).replace('{N}', n != null ? n : '?');
}

//==================================================================
//  Subtítulo dinámico (universo + ronda)
//==================================================================
function dk_updateSubtitle() {
  // Scoped al bloque del chart 16: la vista de líneas (discriminado.js) escribe
  // su subtítulo con un querySelector GLOBAL de .chart-subtitle, así que cada
  // panel tiene que tocar solamente el suyo.
  const el = document.querySelector('.chart-block[data-chart="16"] .chart-subtitle');
  if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  if ((tx.subtitle || '').trim()) return;   // subtítulo custom del editor: no pisar
  const key = 'c16-subtitle-' + (state[16].univ || DK_DEFAULT_UNIV) + '-tpl';
  const tpl = (typeof t === 'function') ? t(key) : '';
  el.textContent = tpl.replace('{RONDA}', dk_yearLabel());
}

//==================================================================
//  Dibujo: barras horizontales
//==================================================================
function drawDiscriminadoComp() {
  dk_updateSubtitle();
  dk_drawBars();
  // El hint del picker cambia según la vista (qué "hacen" los chips), igual que
  // en ranking.js / barrio-comp.js. En 'sel' los chips SON las barras; en 'all'
  // se dibujan todas, así que lo único que hace la selección es viajar a la
  // vista de Evolución — decirlo evita que "Todos/Ninguno" parezca roto.
  const hint = document.getElementById('dk-picker-hint');
  if (hint) {
    const k = (state[16].view === 'all') ? 'c16-pick-hint-all' : 'c16-pick-hint-sel';
    hint.textContent = (typeof t === 'function') ? t(k) : '';
  }
  // Títulos NEUTRALES por default (norma del N°5).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('16', false, { title: 'c16-title', titleNeutral: 'c16-title-neutral' });
  }
}

function dk_drawBars() {
  const svg = document.getElementById('chart16');
  if (!svg) return;
  svg.innerHTML = '';

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const square = editorFormat === 'square';
  const newsletter = editorFormat === 'newsletter';
  const mobilePng = editorFormat === 'mobile';
  const mobile = !editorFormat && dk_isMobile();
  const bigFmt = square || newsletter || mobilePng || mobile;

  const univ = state[16].univ;
  const data = dk_computeData();
  const n = data.length;
  const ref = state[16].showAvg ? dk_regionAvg(state[16].year) : null;

  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const SIZES = (square || newsletter || mobilePng)
    ? { tick: 22, axisTitle: 26, name: 28, value: 26, refLbl: 24 }
    : mobile
    ? { tick: 20, axisTitle: 24, name: 24, value: 22, refLbl: 20 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12, refLbl: 11 };

  let DK_W, DK_MARGIN, DK_BAR_H, DK_BAR_GAP, totalH, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    DK_W = f.vbW; totalH = f.vbH; DK_MARGIN = dk_getMargins(editorFormat);
    DK_BAR_GAP = Math.max(4, Math.round(110 / Math.max(1, n)));
    plotH = totalH - DK_MARGIN.top - DK_MARGIN.bottom;
    DK_BAR_H = n > 0 ? (plotH - (n - 1) * DK_BAR_GAP) / n : 10;
    const fitName = Math.floor((DK_BAR_H + DK_BAR_GAP) * 0.92);
    if (fitName < SIZES.name) {
      SIZES.name = Math.max(9, fitName);
      SIZES.value = Math.max(8, Math.round(SIZES.name * 0.92));
    }
  } else {
    DK_W = 1100;
    DK_MARGIN = mobile ? Object.assign({}, DK_MARGIN_MOBILE) : Object.assign({}, DK_MARGIN_DESKTOP);
    DK_BAR_H = mobile ? 42 : 20; DK_BAR_GAP = mobile ? 13 : 5;
    plotH = Math.max(40, n * (DK_BAR_H + DK_BAR_GAP) - DK_BAR_GAP);
    totalH = DK_MARGIN.top + plotH + DK_MARGIN.bottom;
  }

  // Margen izquierdo dinámico: nunca cortar el nombre (regla del Atlas).
  let maxNameW = 0;
  data.forEach(d => {
    const w = dk_measureText(dk_displayName(univ, d.key), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
  });
  if (maxNameW > 0) {
    const neededLeft = Math.ceil(maxNameW) + 8 + (bigFmt ? 10 : 6);
    const maxLeft = Math.round(DK_W * 0.42);
    DK_MARGIN.left = Math.min(maxLeft, Math.max(DK_MARGIN.left, neededLeft));
  }
  svg.setAttribute('viewBox', `0 0 ${DK_W} ${totalH}`);

  const plotW = DK_W - DK_MARGIN.left - DK_MARGIN.right;
  // La referencia entra en la escala aunque no haya barras (selección vacía):
  // si no, la línea del promedio quedaría fuera del marco.
  const maxPct = Math.max(
    data.length ? Math.max(...data.map(d => d.pct)) : 0,
    ref ? ref.value : 0,
    1
  );
  const xMax = maxPct * 1.06;
  const xScale = (v) => DK_MARGIN.left + (v / xMax) * plotW;

  // === Grid + eje X ===
  const gridG = dk_ns('g'); svg.appendChild(gridG);
  const axisG = dk_ns('g'); svg.appendChild(axisG);
  const xTicks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 10, 20, 30, 40];
  xTicks.forEach(v => {
    const x = xScale(v);
    const line = dk_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', DK_MARGIN.top);
    line.setAttribute('y2', DK_MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0');
    line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = dk_ns('text');
    lbl.setAttribute('x', x);
    lbl.setAttribute('y', DK_MARGIN.top + plotH + (bigFmt ? 32 : 16));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px';
    lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = (typeof fmt === 'function') ? fmt(v, 0) : String(v);
    axisG.appendChild(lbl);
  });

  const xTitle = dk_ns('text');
  xTitle.setAttribute('x', DK_MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', DK_MARGIN.top + plotH + (bigFmt ? 64 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#7A6E62');
  xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c16-axis-x') : '% que se describe como parte de un grupo discriminado';
  svg.appendChild(xTitle);

  // === Barras ===
  const barsG = dk_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = DK_MARGIN.top + i * (DK_BAR_H + DK_BAR_GAP);
    const barW = xScale(d.pct) - DK_MARGIN.left;

    const nameTxt = dk_ns('text');
    nameTxt.setAttribute('x', DK_MARGIN.left - 8);
    nameTxt.setAttribute('y', y + DK_BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end');
    nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px';
    nameTxt.setAttribute('font-weight', 600);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = dk_displayName(univ, d.key);
    barsG.appendChild(nameTxt);

    const rect = dk_ns('rect');
    rect.setAttribute('x', DK_MARGIN.left);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1.5, barW));
    rect.setAttribute('height', DK_BAR_H);
    rect.setAttribute('fill', DK_BAR_COLOR);
    rect.setAttribute('fill-opacity', 0.92);
    rect.setAttribute('rx', 2);
    rect.style.cursor = 'pointer';
    rect.dataset.key = d.key;
    // Hover: SOLO opacidad (nunca redibujar el chart en el hover).
    rect.addEventListener('mouseenter', (ev) => {
      rect.setAttribute('fill-opacity', 1);
      dk_showTooltip(ev, d);
    });
    rect.addEventListener('mousemove', (ev) => dk_positionTooltip(ev));
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('fill-opacity', 0.92);
      dk_hideTooltip();
    });
    // Desktop: click en la barra la saca de la selección. En touch el tap es
    // del tooltip (criterio del clon).
    if (HAS_HOVER) {
      rect.addEventListener('click', () => { dk_hideTooltip(); dk_toggleSelect(d.key); });
    }
    barsG.appendChild(rect);

    const valTxt = dk_ns('text');
    valTxt.setAttribute('x', DK_MARGIN.left + barW + 6);
    valTxt.setAttribute('y', y + DK_BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px';
    valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530');
    valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = ((typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct) + '%';
    barsG.appendChild(valTxt);
  });

  // === Referencia: promedio regional de la ronda (línea punteada vertical) ===
  if (ref) {
    const rx = xScale(ref.value);
    const rline = dk_ns('line');
    rline.setAttribute('x1', rx); rline.setAttribute('x2', rx);
    rline.setAttribute('y1', DK_MARGIN.top - (bigFmt ? 8 : 6));
    rline.setAttribute('y2', DK_MARGIN.top + plotH);
    rline.setAttribute('stroke', DK_REF_COLOR);
    rline.setAttribute('stroke-width', bigFmt ? 2.5 : 1.4);
    rline.setAttribute('stroke-dasharray', bigFmt ? '7 6' : '4 4');
    rline.setAttribute('pointer-events', 'none');
    svg.appendChild(rline);
    const rlbl = dk_ns('text');
    const rlblTxt = ((typeof t === 'function') ? t('c16-avg-lbl') : 'Promedio regional')
      + ': ' + ((typeof fmt === 'function') ? fmt(ref.value, 1) : ref.value) + '%';
    const lblW = dk_measureText(rlblTxt, SIZES.refLbl, 600);
    const anchorEnd = rx + 8 + lblW > DK_W - 4;
    rlbl.setAttribute('x', anchorEnd ? rx - 8 : rx + 8);
    rlbl.setAttribute('y', DK_MARGIN.top - (bigFmt ? 16 : 12));
    rlbl.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
    rlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    rlbl.style.fontSize = SIZES.refLbl + 'px';
    rlbl.setAttribute('font-weight', 600);
    rlbl.setAttribute('fill', '#7A6E62');
    rlbl.setAttribute('pointer-events', 'none');
    rlbl.textContent = rlblTxt;
    svg.appendChild(rlbl);
  }

  // === Eje 0 ===
  const zeroLine = dk_ns('line');
  zeroLine.setAttribute('x1', DK_MARGIN.left); zeroLine.setAttribute('x2', DK_MARGIN.left);
  zeroLine.setAttribute('y1', DK_MARGIN.top);
  zeroLine.setAttribute('y2', DK_MARGIN.top + plotH);
  zeroLine.setAttribute('stroke', '#9C928A');
  zeroLine.setAttribute('stroke-width', 1);
  svg.appendChild(zeroLine);
}

//==================================================================
//  Tooltip
//==================================================================
function dk_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip16');
  if (!tooltip) return;
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);
  const F = (v) => (typeof fmt === 'function') ? fmt(v, 1) : v;
  const univ = state[16].univ;
  const rankKey = (univ === 'etnia') ? 'c16-tt-rank-etnia' : 'c16-tt-rank';
  const rankLine = (d.rank != null)
    ? `<div class="tt-row"><span>${tt(rankKey, 'Puesto')}</span><span>${dk_rankLabel(d.rank, d.universe)}</span></div>` : '';
  const ref = dk_regionAvg(d.year);
  const gap = ref ? (d.pct - ref.value) : null;
  const gapLine = (gap != null)
    ? `<div class="tt-row"><span>${tt('c16-tt-vs-avg', 'Vs. promedio regional')}</span><span>${gap >= 0 ? '+' : '−'}${F(Math.abs(gap))} pp</span></div>` : '';
  const nLine = (d.n != null)
    ? `<div class="tt-row"><span>${tt('c16-tt-n', 'Muestra')}</span><span>${(typeof fmt === 'function') ? fmt(d.n, 0) : d.n}</span></div>` : '';
  tooltip.innerHTML = `
    <strong>${dk_displayName(univ, d.key)}</strong>
    <div class="tt-sub">${tt('c16-tt-round', 'Ronda')} ${d.year}</div>
    <div class="tt-row tt-row-strong"><span>${tt('c16-tt-pct', 'Se siente discriminado')}</span><span>${F(d.pct)}%</span></div>
    ${rankLine}
    ${gapLine}
    ${nLine}
  `;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  dk_positionTooltip(event);
}

// El tooltip se reubica a la izquierda cerca del borde derecho (norma del Atlas).
function dk_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip16');
  if (!tooltip || !tooltip.parentElement) return;
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const cx = (typeof evClientX === 'function') ? evClientX(event) : event.clientX;
  const cy = (typeof evClientY === 'function') ? evClientY(event) : event.clientY;
  const x = cx - wrap.left;
  const y = cy - wrap.top;
  const ttW = tooltip.offsetWidth;
  const ttH = tooltip.offsetHeight;
  let px = x + 14;
  let py = y - ttH - 8;
  if (px + ttW > wrap.width) px = x - ttW - 14;
  if (py < 0) py = y + 18;
  tooltip.style.left = px + 'px';
  tooltip.style.top  = py + 'px';
}

function dk_hideTooltip() {
  const tooltip = document.getElementById('tooltip16');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Selección: buscador + chips WYSIWYG (con ✕) — sin atajos propios.
//  El botón "Limpiar" lo agrega solo lib/utils.js (atlasWireClearButtons
//  engancha todo contenedor con id *-selected-chips y clickea las ✕).
//==================================================================
function dk_normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function dk_searchable() {
  const univ = state[16].univ;
  return dk_keys(univ)
    .sort((a, b) => dk_displayName(univ, a).localeCompare(dk_displayName(univ, b), 'es'))
    .map(key => ({ key, name: dk_displayName(univ, key) }));
}

function dk_toggleSelect(key) {
  const arr = state[16].sel[state[16].univ];
  const idx = arr.indexOf(key);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(key);
  renderDiscriminadoCompChips();
  drawDiscriminadoComp();
}

function renderDiscriminadoCompChips() {
  const container = document.getElementById('dk-selected-chips');
  if (!container) return;
  const univ = state[16].univ;
  container.innerHTML = '';
  (state[16].sel[univ] || []).slice()
    .sort((a, b) => dk_displayName(univ, a).localeCompare(dk_displayName(univ, b), 'es'))
    .forEach(key => {
      const chip = document.createElement('span');
      chip.className = 'm-selected-chip';
      const dot = document.createElement('span');
      dot.className = 'm-chip-dot';
      dot.style.background = DK_BAR_COLOR;
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(dk_displayName(univ, key)));
      const x = document.createElement('button');
      x.className = 'm-chip-x';
      x.innerHTML = '×';
      x.setAttribute('aria-label', (typeof t === 'function') ? t('chip-remove') : 'Quitar');
      x.addEventListener('click', () => dk_toggleSelect(key));
      chip.appendChild(x);
      container.appendChild(chip);
    });
}

function setupDiscriminadoCompSearch() {
  const input = document.getElementById('dk-search');
  const results = document.getElementById('dk-search-results');
  if (!input || !results) return;
  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = dk_normalize(q);
    return dk_searchable().filter(c => dk_normalize(c.name).includes(qn)).slice(0, 8);
  }
  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    const sel = state[16].sel[state[16].univ] || [];
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '')
        + (sel.includes(c.key) ? ' m-already' : '');
      return `<div class="${cls}" data-key="${c.key}">${c.name}</div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-key]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        dk_toggleSelect(el.dataset.key);
        input.value = '';
        results.classList.remove('open');
      });
    });
  }
  input.addEventListener('input', (e) => {
    currentMatches = getMatches(e.target.value);
    activeIdx = -1;
    renderResults(currentMatches, activeIdx);
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      activeIdx = (activeIdx + 1) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'Enter' && activeIdx >= 0) {
      ev.preventDefault();
      dk_toggleSelect(currentMatches[activeIdx].key);
      input.value = '';
      results.classList.remove('open');
    } else if (ev.key === 'Escape') {
      results.classList.remove('open');
      input.blur();
    }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) {
      results.classList.remove('open');
    }
  });
}

// Toggle de vista: 'all' (todas las claves del universo, default) o 'sel' (los
// chips). No toca la selección, así que los chips siguen viajando intactos a la
// vista de Evolución al cambiar de pestaña.
function setupDiscriminadoCompView() {
  const box = document.getElementById('dk-view');
  if (!box || box.__dkWired) return;
  box.__dkWired = true;
  box.querySelectorAll('button[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const v = btn.getAttribute('data-view');
      if (state[16].view === v) return;
      state[16].view = v;
      box.querySelectorAll('button[data-view]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-view') === v);
      });
      drawDiscriminadoComp();
    });
  });
}

//==================================================================
//  Controles: universo · ronda (slider) · referencia
//==================================================================
function setupDiscriminadoCompUniv() {
  const sel = document.getElementById('dk-univ-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    if (!dk_src(sel.value) || !dk_keys(sel.value).length) return;
    state[16].univ = sel.value;     // setter compartido → la vista de líneas lo hereda
    renderDiscriminadoCompChips();
    drawDiscriminadoComp();
  });
}

// Slider de RONDA: un solo thumb sobre las cinco rondas (DK_YEARS). Al moverlo
// se ve cómo se reordena el ranking entre 2009 y 2020.
function setupDiscriminadoCompYear() {
  const input = document.getElementById('dk-year-slider');
  const disp = document.getElementById('dk-year-display');
  if (!input || !DK_YEARS.length) {
    const grp = document.getElementById('dk-year-group');
    if (grp) grp.style.display = 'none';
    return;
  }
  input.min = 0; input.max = DK_YEARS.length - 1; input.step = 1;
  input.value = Math.max(0, DK_YEARS.indexOf(state[16].year));
  if (disp) disp.textContent = dk_yearLabel();
  input.addEventListener('input', () => {
    const y = DK_YEARS[+input.value];
    if (y === state[16].year) return;
    state[16].year = y;
    if (disp) disp.textContent = dk_yearLabel();
    drawDiscriminadoComp();
  });
}

function setupDiscriminadoCompRefs() {
  const btn = document.getElementById('dk-ref-avg');
  if (!btn) return;
  btn.classList.toggle('active', state[16].showAvg !== false);
  btn.addEventListener('click', () => {
    state[16].showAvg = !(state[16].showAvg !== false);
    btn.classList.toggle('active', state[16].showAvg);
    drawDiscriminadoComp();
  });
}

// Sincroniza los controles con el estado (lo llama el redrawFull del shell tras
// migrar universo/selección desde la otra vista, y el cambio de idioma).
function dk_syncCompControls() {
  const sel = document.getElementById('dk-univ-select');
  if (sel) sel.value = state[16].univ;
  const input = document.getElementById('dk-year-slider');
  if (input) input.value = Math.max(0, DK_YEARS.indexOf(state[16].year));
  const disp = document.getElementById('dk-year-display');
  if (disp) disp.textContent = dk_yearLabel();
  const btn = document.getElementById('dk-ref-avg');
  if (btn) btn.classList.toggle('active', state[16].showAvg !== false);
}

//==================================================================
//  CSV
//==================================================================
function setupDiscriminadoCompCSV() {
  document.querySelectorAll('button.download[data-chart="16-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '';
      csv += '# El Atlas N5 — % que se describe como parte de un grupo discriminado (Latinobarometro)\n';
      csv += '# Pregunta A_011_001: "Se describiria como parte de un grupo que es discriminado en (pais)?" (Si/No). % de Si, ponderado por wt.\n';
      csv += '# universo=pais: 18 paises con dato en las cinco rondas. universo=etnia: agregado REGIONAL por grupo etnico autopercibido.\n';
      csv += '# rank: 1 = el pct mas alto de la ronda, dentro del universo.\n';
      csv += 'universo,clave,nombre,ronda,pct,rank,n\n';
      ['pais', 'etnia'].forEach(univ => {
        DK_YEARS.forEach(y => {
          const foto = dk_foto(univ, y);
          const N = foto.length;
          foto.forEach((r, i) => {
            const nm = (univ === 'pais')
              ? ((typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? (COUNTRY_NAMES[r[0]].en || r[0]) : r[0])
              : ((DISC_META.etnia && DISC_META.etnia.labels && DISC_META.etnia.labels.en
                  && DISC_META.etnia.labels.en[r[0]]) || r[0]);
            const nmQ = (nm.indexOf(',') >= 0) ? '"' + nm + '"' : nm;
            csv += [univ, r[0], nmQ, r[2], r[1], N - i, (r[3] != null ? r[3] : '')].join(',') + '\n';
          });
        });
      });
      if (typeof DISC_META !== 'undefined' && Array.isArray(DISC_META.regionAvg)) {
        DISC_META.regionAvg.forEach(p => {
          csv += ['regionAvg', '__avg', 'Regional average (simple mean of 18)', p[0], p[1], '', ''].join(',') + '\n';
        });
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lang === 'en'
        ? 'the-atlas-05-discriminated-group-comparison.csv'
        : 'el-atlas-05-grupo-discriminado-comparacion.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

//==================================================================
//  LA COSTURA con la vista de líneas (state[11])
//==================================================================
// El shell (lib/grapher.js) migra la selección leyendo/escribiendo
// state[chartN].selected — un array PLANO. Pero la vista de líneas guarda la
// selección en state[11].sel[univ] (un array por universo) y el universo en
// state[11].univ, que también tiene que ser el mismo en las dos vistas.
//
// En vez de espejar a mano en cada redrawFull (frágil: el shell "cosecha"
// .selected ANTES de que corra el redrawFull de la vista nueva, así que
// cualquier toggle hecho dentro de una vista llegaría viejo), se redefinen las
// dos propiedades como accessors:
//   · .univ     -> lee/escribe la variable compartida DK_UNIV (una sola verdad
//                  para los dos charts: cambiarlo en cualquier vista se ve en
//                  la otra, sin importar el orden en que corran).
//   · .selected -> lee/escribe state.sel[DK_UNIV] (el array vivo).
// Así el shell sigue creyendo que trabaja con .selected plano y nunca hay copia
// desincronizada. El setter además filtra claves que no existen en el universo
// activo (llegan de ?paises= en la URL) y, si todas pertenecen al OTRO universo,
// cambia el universo en vez de vaciar la selección.
function dk_bindShared(s) {
  if (!s || s.__dkBound) return;
  s.__dkBound = true;
  if (!s.sel) s.sel = { pais: dk_defaultSel('pais'), etnia: dk_defaultSel('etnia') };
  if (!s.sel.pais) s.sel.pais = dk_defaultSel('pais');
  if (!s.sel.etnia) s.sel.etnia = dk_defaultSel('etnia');
  Object.defineProperty(s, 'univ', {
    configurable: true, enumerable: true,
    get: function () { return DK_UNIV; },
    set: function (v) { if (v === 'pais' || v === 'etnia') DK_UNIV = v; }
  });
  Object.defineProperty(s, 'selected', {
    configurable: true, enumerable: true,
    get: function () {
      if (!this.sel[DK_UNIV]) this.sel[DK_UNIV] = [];
      return this.sel[DK_UNIV];
    },
    set: function (v) {
      if (!Array.isArray(v)) return;
      const here = dk_keys(DK_UNIV);
      const clean = v.filter(k => here.indexOf(k) >= 0);
      if (clean.length) { this.sel[DK_UNIV] = clean; return; }
      const other = (DK_UNIV === 'pais') ? 'etnia' : 'pais';
      const there = dk_keys(other);
      const alt = v.filter(k => there.indexOf(k) >= 0);
      if (alt.length) { DK_UNIV = other; this.sel[other] = alt; }
      // Nada reconocible (ej. ?paises= basura): se deja la selección vigente.
    }
  });
}

// postInit de la vista 'evol' en el shell: initDiscriminado() ya creó state[11]
// con .univ y .sel propios, y esto los engancha a la verdad compartida ANTES de
// que el shell vuelque la selección migrada.
function dk_bindEvolState() {
  if (typeof state === 'undefined' || !state[11]) return;
  dk_bindShared(state[11]);
}

// Pre-paso del redrawFull de la vista 'evol': deja sus controles en línea con el
// universo compartido (el <select> y la visibilidad del toggle de promedio).
function dk_syncEvolControls() {
  if (typeof state === 'undefined' || !state[11]) return;
  const sel = document.getElementById('dc-univ-select');
  if (sel) sel.value = state[11].univ;
  if (typeof dc_syncAvgVisibility === 'function') dc_syncAvgVisibility();
}

//==================================================================
//  Init
//==================================================================
function initDiscriminadoComp() {
  if (!state[16]) {
    state[16] = {
      year: DK_DEFAULT_YEAR,
      sel: { pais: dk_defaultSel('pais'), etnia: dk_defaultSel('etnia') },
      showAvg: true,
      view: 'all'
    };
  }
  dk_bindShared(state[16]);
  if (state[16].year == null) state[16].year = DK_DEFAULT_YEAR;
  if (state[16].view == null) state[16].view = 'all';

  setupDiscriminadoCompUniv();
  setupDiscriminadoCompView();
  setupDiscriminadoCompYear();
  setupDiscriminadoCompRefs();
  setupDiscriminadoCompSearch();
  setupDiscriminadoCompCSV();
  renderDiscriminadoCompChips();
  drawDiscriminadoComp();

  if (!initDiscriminadoComp._editorWired) {
    initDiscriminadoComp._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawDiscriminadoComp());
  }
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDiscriminadoComp;

  // Nota "Datos" corta del PNG, con la ronda realmente mostrada.
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '16') return null;
    const tpl = (typeof t === 'function') ? t('c16-sources-tpl') : '';
    if (!tpl) return null;
    return tpl.replace('{R}', dk_yearLabel());
  };
  window.onBeforePngExport = null;   // esta vista no manda labels al canvas
}
