// =============================================================
//  El Atlas N°5 — Chart 19: ¿las intolerancias van juntas?
// =============================================================
// El chart EXPLORATORIO del número: cruza DOS variables cualesquiera de la
// Integrated Values Survey (24 en el menú) para el mismo conjunto de países y
// la misma ola. La pregunta: el que rechaza a un vecino de otra raza, ¿rechaza
// también a un homosexual? Default X = otra raza, Y = homosexuales.
//
// CLON del motor de scatter del repo (regla de oro: clonar, no reimplementar):
//   - 02-demasiado-desiguales/scatter.js → OLS client-side (s_ols), banner con
//     R², slider con play, buscador + chips, tooltip reubicable.
//   - 05-intolerancia/declarado-implicito.js → el scatter del propio N°5:
//     etiquetado forzado, resaltado de Argentina, leyenda de regiones dentro
//     del SVG, hit-area táctil, formatos del editor/PNG.
//   - lib/scatter-render.js → s_layoutLabels / s_relaxLabels / s_labelBox
//     (placement anti-colisión de etiquetas, el mismo del N°2 y el N°3).
//
// Decisiones propias de este chart:
//   - Los DOS ejes son porcentajes en la MISMA escala 0-100, así que el área de
//     ploteo es CUADRADA y se dibuja la línea de 45° punteada además de la
//     recta de ajuste: sobre la diagonal, el rechazo del eje Y pesa más.
//   - El slider de ola recorre sólo la INTERSECCIÓN de olas de las dos
//     variables, y sólo las celdas con al menos CO_MIN_N países en común
//     (mismo criterio que el resto del número). Si queda una sola ola, el
//     slider se esconde en vez de dejar un control inútil.
//   - WYSIWYG: los chips SON las etiquetas. Seleccionar no atenúa (eso lo hace
//     el hover, por opacidad y sin redibujar).
//
// Datos: data-cruces.js (CR_VARS, CR_FOTO, CR_REGION, CR_WAVES). CR_FOTO usa
// claves de ola STRING ("7"); CR_VARS[i].olas son ENTEROS.
// State: state[19] = { x, y, wave, selected[], playing }.

const CO_SVG_NS = 'http://www.w3.org/2000/svg';
const co_ns = (tag) => document.createElementNS(CO_SVG_NS, tag);

const CO_GRID      = '#ECE7D8';
const CO_BG        = '#FAF8F3';
const CO_INK       = '#3A3530';
const CO_INK_SOFT  = '#7A6E62';
const CO_AXIS      = '#9C928A';
const CO_DIAG      = '#B0A695';   // línea de 45° (punteada)
const CO_FIT       = '#5A5346';   // recta de ajuste
const CO_HIGHLIGHT = 'ARG';
const CO_HI_COLOR  = '#8B4220';

const CO_DEFAULT_X = 'otra_raza';
const CO_DEFAULT_Y = 'homosexuales';
// Mínimo de países en común para que una ola entre al slider. Mismo umbral que
// make_waves.py / make_prioridad.py / make_cruces.py: con menos de 8 países no
// hay regresión que valga.
const CO_MIN_N = 8;
// Mínimo de países VISIBLES para estimar la recta. Si el usuario apaga regiones
// desde la leyenda y quedan menos, no se dibuja recta ni se informa r / R²:
// sólo el n. Nunca un ajuste sobre dos puntos.
const CO_MIN_FIT = 5;
const CO_PLAY_MS = 1100;
// Selección default (chips = etiquetas): tres de América Latina, dos anclas de
// Europa, Estados Unidos y dos casos que rompen la diagonal (Corea y Nigeria
// rechazan poco por raza y muchísimo por orientación sexual).
const CO_DEFAULT_SELECTED = ['ARG', 'BRA', 'MEX', 'USA', 'ESP', 'SWE', 'KOR', 'NGA'];
// Los dos grupos de CR_VARS[i].grupo → clave i18n del <optgroup>.
const CO_GRP_KEY = {
  'Batería de vecinos': 'c19-grp-bateria',
  'Otras preguntas':    'c19-grp-otras'
};

// =================== Helpers ===================
function co_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function co_lang() {
  return (typeof LANG !== 'undefined') ? LANG : 'es';
}
function co_T(key) {
  return (typeof t === 'function') ? t(key) : key;
}
function co_name(iso) {
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][co_lang()] || COUNTRY_NAMES[iso].en || iso;
  }
  return iso;
}
function co_regionColor(reg) {
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function co_regionLabelColor(reg) {
  return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[reg]) || CO_INK;
}
function co_measure(text, fs, w) {
  if (!co_measure._c) { const c = document.createElement('canvas'); co_measure._c = c.getContext('2d'); }
  co_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return co_measure._c.measureText(text).width;
}
function co_fmt(v, dec) {
  return (typeof fmt === 'function') ? fmt(v, dec) : String(v);
}
// El margen izquierdo tiene que dar lugar a los ticks ("100%") Y al título de
// eje rotado: si se achica, el rotado se come los números.
function co_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 34, right: 34, bottom: 96, left: 104 };
    case 'public':                    return { top: 28, right: 30, bottom: 80, left: 92 };
    case 'mobile':                    return { top: 28, right: 30, bottom: 104, left: 104 };
    default: return null;
  }
}

// ---- acceso a los datos ----
function co_vars() {
  return (typeof CR_VARS !== 'undefined') ? CR_VARS : [];
}
function co_var(k) {
  const vs = co_vars();
  for (let i = 0; i < vs.length; i++) if (vs[i].k === k) return vs[i];
  return null;
}
function co_varLabel(k) {
  const v = co_var(k);
  if (!v) return k;
  return co_lang() === 'en' ? v.en : v.es;
}
function co_varDef(k) {
  const v = co_var(k);
  if (!v) return '';
  return co_lang() === 'en' ? v.def_en : v.def_es;
}
function co_waveLabel(w) {
  if (typeof CR_WAVES === 'undefined' || w == null) return '';
  for (let i = 0; i < CR_WAVES.length; i++) if (CR_WAVES[i].w === w) return CR_WAVES[i].label;
  return String(w);
}
// ---- regiones apagadas desde la leyenda ----
// Norma del número, fijada en el chart 1 (ranking.js, state[1].hiddenRegions):
// hover = atenúa por opacidad; CLICK = apaga y QUITA a esos países. Apagar una
// región la saca del MODELO: la recta, r, R² y el n se recalculan sobre lo que
// queda visible. Por eso el click redibuja (la regla prohíbe redibujar en el
// HOVER, no en el click).
function co_hidden() {
  return new Set((state[19] && state[19].hiddenRegions) || []);
}
function co_toggleRegion(reg) {
  const arr = state[19].hiddenRegions || (state[19].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  co_regionEmph(null);
  drawCorrelaciones();
}
function co_showAllRegions() {
  state[19].hiddenRegions = [];
  co_regionEmph(null);
  drawCorrelaciones();
}
// El botón "Ver todas las regiones" existe sólo si hay algo apagado.
function co_syncShowAll() {
  const btn = document.getElementById('co-show-all');
  if (!btn) return;
  if (((state[19] && state[19].hiddenRegions) || []).length) btn.removeAttribute('hidden');
  else btn.setAttribute('hidden', '');
}

// Filas crudas de una variable en una ola. OJO: las claves de CR_FOTO son
// STRINGS ("7") y las de CR_VARS[i].olas son ENTEROS.
function co_cell(k, w) {
  if (typeof CR_FOTO === 'undefined' || !CR_FOTO[k]) return [];
  return CR_FOTO[k][String(w)] || [];
}

// Cruce de dos variables en una ola: sólo los países que tienen las DOS
// observaciones. Nunca se completa ni se arrastra un dato faltante.
function co_cross(kx, ky, w) {
  const rowsX = co_cell(kx, w), rowsY = co_cell(ky, w);
  const byIso = {};
  for (let i = 0; i < rowsX.length; i++) byIso[rowsX[i][0]] = rowsX[i];
  const out = [];
  for (let j = 0; j < rowsY.length; j++) {
    const ry = rowsY[j], rx = byIso[ry[0]];
    if (!rx) continue;
    const iso = ry[0];
    out.push({
      iso: iso,
      region: (typeof CR_REGION !== 'undefined' && CR_REGION[iso]) || '',
      x: rx[1], yearX: rx[2], nX: rx[3],
      y: ry[1], yearY: ry[2], nY: ry[3]
    });
  }
  out.sort((a, b) => a.x - b.x);
  return out;
}

// Olas donde las dos variables tienen datos Y el cruce llega a CO_MIN_N países.
// Se recalcula cada vez que cambia cualquiera de los dos ejes (cacheado por par:
// los datos son estáticos).
function co_waves(kx, ky) {
  if (!co_waves._c) co_waves._c = {};
  const key = kx + '|' + ky;
  if (co_waves._c[key]) return co_waves._c[key];
  const vx = co_var(kx), vy = co_var(ky);
  const out = [];
  if (vx && vy) {
    for (let i = 0; i < vx.olas.length; i++) {
      const w = vx.olas[i];
      if (vy.olas.indexOf(w) < 0) continue;
      if (co_cross(kx, ky, w).length >= CO_MIN_N) out.push(w);
    }
  }
  out.sort((a, b) => a - b);
  co_waves._c[key] = out;
  return out;
}

// OLS y = a + b·x sobre los puntos del cruce. Devuelve además r de Pearson
// (r² = R² en una regresión simple).
function co_ols(pts) {
  const n = pts.length;
  if (n < 2) return null;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += pts[i].x; sy += pts[i].y; }
  const mx = sx / n, my = sy / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = pts[i].x - mx, dy = pts[i].y - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  const b = sxy / sxx;
  const a = my - b * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { a: a, b: b, r: r, r2: r * r, n: n };
}

// =================== Textos dinámicos ===================
function co_editorCustom(field) {
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  if (!ae) return '';
  const lang = ae.lang || co_lang();
  const tx = (ae.texts && ae.texts[lang]) || {};
  return (tx[field] || '').trim();
}

function co_updateSubtitle() {
  const el = document.querySelector('.chart-block[data-chart="19"] .chart-subtitle');
  if (!el) return;
  if (co_editorCustom('subtitle')) return;   // respetar el subtítulo custom del editor (?nl)
  const s = state[19];
  const tpl = co_T('c19-subtitle-tpl');
  if (!tpl) return;
  el.textContent = tpl
    .replace('{X}', co_varLabel(s.x))
    .replace('{Y}', co_varLabel(s.y))
    .replace('{PERIODO}', co_waveLabel(s.wave));
}

// Definición exacta de cada eje (sale de CR_VARS[i].def_es/def_en): sin esto,
// un eje que dice "Personas de otra raza" no se entiende.
function co_updateDefs() {
  const el = document.getElementById('co-defs');
  if (!el) return;
  const s = state[19];
  el.innerHTML =
    '<p class="co-def"><span class="co-def-key">' + co_T('c19-def-x') + '</span> ' +
      co_varLabel(s.x) + ' — ' + co_varDef(s.x) + '</p>' +
    '<p class="co-def"><span class="co-def-key">' + co_T('c19-def-y') + '</span> ' +
      co_varLabel(s.y) + ' — ' + co_varDef(s.y) + '</p>';
}

// Banner: países · r · R². SOBRIO, como el del N°2 (scatter.js, #s-banner). El
// ítem de la OLA se sacó: el slider de ola ya la muestra al lado, con su propio
// rótulo. (El PNG no rasteriza HTML: los mismos números viajan en la nota de
// "Datos" vía onBeforePngExportGetSourceText.)
// nAll = países del cruce ANTES de apagar regiones: distingue "esta ola no
// cruza estas dos preguntas" de "el usuario apagó casi todas las regiones".
function co_updateBanner(model, nPts, nAll) {
  const el = document.getElementById('co-banner');
  if (!el) return;
  const nItem =
    '<span class="s-banner-item"><span class="s-banner-key">' + co_T('c19-banner-n') + '</span>' +
      '<span class="s-banner-val">' + nPts + '</span></span>';
  // Sin ajuste (menos de CO_MIN_FIT países visibles) mostramos el n y decimos
  // por qué no hay r ni R², en vez de inventar dos estadísticos.
  if (!model) {
    el.innerHTML = nItem +
      '<span class="s-banner-sep">·</span>' +
      '<span class="s-banner-item"><span class="s-banner-note">' +
        co_T(nAll ? 'c19-fewfit' : 'c19-empty-short') + '</span></span>';
    return;
  }
  el.innerHTML = nItem +
    '<span class="s-banner-sep">·</span>' +
    '<span class="s-banner-item"><span class="s-banner-key">' + co_T('c19-banner-r') + '</span>' +
      '<span class="s-banner-val">' + co_fmt(model.r, 2) + '</span></span>' +
    '<span class="s-banner-sep">·</span>' +
    '<span class="s-banner-item"><span class="s-banner-key">' + co_T('c19-banner-r2') + '</span>' +
      '<span class="s-banner-val">' + co_fmt(model.r2, 2) + '</span></span>';
}

// =================== Leyenda ===================
// Regiones presentes + las dos líneas (45° y ajuste). Dos modos: columna a la
// derecha del cuadrado (desktop / formatos anchos) o filas arriba (mobile).
// Se arma sobre TODOS los países de la ola (allPts), no sobre los visibles: si
// una región apagada desapareciera de la leyenda, no habría dónde prenderla de
// nuevo. En los formatos de exportación sí se ocultan las apagadas: el PNG
// muestra sólo lo que está dibujado.
function co_legendItems(allPts, hideOff) {
  const order = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER : [];
  const hid = co_hidden();
  const items = [];
  order.forEach(r => {
    for (let i = 0; i < allPts.length; i++) {
      if (allPts[i].region === r) {
        if (hideOff && hid.has(r)) return;
        items.push({ kind: 'dot', region: r, off: hid.has(r), color: co_regionColor(r), label: co_T('reg.' + r) });
        return;
      }
    }
  });
  items.push({ kind: 'dash', color: CO_DIAG, label: co_T('c19-leg-diag') });
  items.push({ kind: 'line', color: CO_FIT,  label: co_T('c19-leg-fit') });
  return items;
}

function co_legendItemW(it, fs) {
  return (it.kind === 'dot' ? fs * 1.5 : fs * 2.4) + 6 + co_measure(it.label, fs, 500);
}

function co_legendRows(items, fs, maxW) {
  const rows = [];
  let cur = [], curW = 0;
  const gap = fs * 1.6;
  items.forEach((it, i) => {
    const w = co_legendItemW(it, fs) + gap;
    if (curW + w > maxW && cur.length) { rows.push(cur); cur = []; curW = 0; }
    cur.push(i); curW += w;
  });
  if (cur.length) rows.push(cur);
  return rows;
}

function co_legendSwatch(g, it, x, y, fs) {
  if (it.kind === 'dot') {
    const c = co_ns('circle');
    c.setAttribute('cx', x + fs * 0.42); c.setAttribute('cy', y);
    c.setAttribute('r', fs * 0.42);
    // Región apagada: punto hueco (mismo criterio visual que el chip
    // .rk-leg-off del chart 1).
    c.setAttribute('fill', it.off ? 'none' : it.color);
    if (it.off) {
      c.setAttribute('stroke', it.color);
      c.setAttribute('stroke-width', Math.max(1, fs * 0.11));
    }
    g.appendChild(c);
  } else {
    const l = co_ns('line');
    l.setAttribute('x1', x); l.setAttribute('x2', x + fs * 2);
    l.setAttribute('y1', y); l.setAttribute('y2', y);
    l.setAttribute('stroke', it.color);
    l.setAttribute('stroke-width', Math.max(1.4, fs * 0.16));
    if (it.kind === 'dash') l.setAttribute('stroke-dasharray', (fs * 0.42) + ' ' + (fs * 0.34));
    g.appendChild(l);
  }
}

// Un ítem de la leyenda como <g> propio: swatch + rótulo (+ tachado si está
// apagado) + hit-area táctil. Los ítems de REGIÓN quedan cableados:
//   HOVER → atenúa el resto por opacidad, sin redibujar (co_regionEmph).
//   CLICK → apaga/prende la región y redibuja, porque cambia el modelo.
// Los ítems de línea (45° y ajuste) no son regiones: no se cablean.
function co_legendNode(it, x, y, fs, rowH) {
  const g = co_ns('g');
  co_legendSwatch(g, it, x, y, fs);
  const labelX = x + (it.kind === 'dot' ? fs * 1.5 : fs * 2.4) + 6;
  const tx = co_ns('text');
  tx.setAttribute('x', labelX);
  tx.setAttribute('y', y);
  tx.setAttribute('dominant-baseline', 'central');
  tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  tx.style.fontSize = fs + 'px';
  tx.setAttribute('fill', CO_INK_SOFT);
  tx.textContent = it.label;
  g.appendChild(tx);
  if (!it.region) return g;

  g.dataset.coLegend = it.region;
  if (it.off) {
    g.dataset.coLegendOff = '1';
    g.setAttribute('opacity', 0.34);
    // Tachado dibujado a mano, no text-decoration: el rasterizado SVG→PNG no
    // garantiza el tachado tipográfico, una línea sí.
    const strike = co_ns('line');
    strike.setAttribute('x1', labelX - 1);
    strike.setAttribute('x2', labelX + co_measure(it.label, fs, 500) + 1);
    strike.setAttribute('y1', y); strike.setAttribute('y2', y);
    strike.setAttribute('stroke', CO_INK_SOFT);
    strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
    g.appendChild(strike);
  }
  const hit = co_ns('rect');
  hit.setAttribute('x', x - 3);
  hit.setAttribute('y', y - rowH / 2);
  hit.setAttribute('width', co_legendItemW(it, fs) + 8);
  hit.setAttribute('height', rowH);
  hit.setAttribute('fill', 'transparent');
  g.appendChild(hit);
  g.style.cursor = 'pointer';
  g.addEventListener('mouseenter', () => {
    if (co_hidden().has(it.region)) return;   // apagada: no hay foco que aplicar
    co_regionEmph(it.region);
  });
  g.addEventListener('mouseleave', () => co_regionEmph(null));
  g.addEventListener('click', (ev) => { ev.stopPropagation(); co_toggleRegion(it.region); });
  return g;
}

function co_drawLegendSide(svg, items, x, y, fs) {
  const g = co_ns('g'); svg.appendChild(g);
  const rowH = fs * 1.85;
  items.forEach((it, i) => {
    g.appendChild(co_legendNode(it, x, y + i * rowH, fs, rowH));
  });
}

function co_drawLegendTop(svg, items, rows, x0, y0, maxW, fs) {
  const g = co_ns('g'); svg.appendChild(g);
  const rowH = fs * 1.7, gap = fs * 1.6;
  rows.forEach((row, ri) => {
    let rowW = 0;
    row.forEach(i => { rowW += co_legendItemW(items[i], fs) + gap; });
    rowW -= gap;
    let x = x0 + Math.max(0, (maxW - rowW) / 2);
    const y = y0 + ri * rowH + fs * 0.6;
    row.forEach(i => {
      const it = items[i];
      g.appendChild(co_legendNode(it, x, y, fs, rowH));
      x += co_legendItemW(it, fs) + gap;
    });
  });
}

// =================== Render ===================
function drawCorrelaciones() {
  const svg = document.getElementById('chart19');
  if (!svg) return;
  svg.innerHTML = '';

  const s = state[19];
  const waves = co_waves(s.x, s.y);
  if (waves.length === 0) s.wave = null;
  else if (waves.indexOf(s.wave) < 0) s.wave = waves[waves.length - 1];
  co_syncWaveControl(waves);
  co_updateSubtitle();
  co_updateDefs();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && co_isMobile();
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 26, label: 24, legend: 21, dot: 9 }
    : mobile
    ? { tick: 19, axisTitle: 22, label: 21, legend: 18, dot: 8 }
    : { tick: 11, axisTitle: 12.5, label: 12, legend: 11.5, dot: 5 };

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; H = f.vbH; MARGIN = co_getMargins(editorFormat) || { top: 34, right: 34, bottom: 96, left: 96 };
  } else if (mobile) {
    W = 1100; H = 1240; MARGIN = { top: 20, right: 26, bottom: 108, left: 108 };
  } else {
    // DESKTOP EN PANTALLA. Bajado de 1100x620 a 1100x490 para que el gráfico
    // entre sin scrollear (pedido de Daniel). Acá el alto es caro: el área de
    // ploteo es CUADRADA, así que cada píxel de alto que se saca achica también
    // el ancho útil. 490 es el máximo que entra en un viewport de 720 px una
    // vez compactado el encabezado (medido: el SVG termina en y=694).
    // Los formatos de exportación NO se tocan: salen de PNG_FORMATS +
    // co_getMargins, arriba.
    W = 1100; H = 490; MARGIN = { top: 14, right: 20, bottom: 50, left: 58 };
  }
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  co_syncShowAll();

  // Sin ninguna ola en común: mensaje en vez de un gráfico vacío.
  if (s.wave == null) {
    co_updateBanner(null, 0, 0);
    const msg = co_ns('text');
    msg.setAttribute('x', W / 2); msg.setAttribute('y', MARGIN.top + plotH / 2);
    msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    msg.style.fontSize = (bigFmt ? 26 : 14) + 'px';
    msg.setAttribute('fill', CO_INK_SOFT);
    msg.textContent = co_T('c19-empty');
    svg.appendChild(msg);
    if (typeof atlasSetHeading === 'function') {
      atlasSetHeading('19', false, { title: 'c19-title', titleNeutral: 'c19-title-neutral' });
    }
    return;
  }

  // allPts = el cruce completo de la ola; pts = lo que queda después de apagar
  // regiones desde la leyenda. El MODELO (recta, r, R², n) se estima sobre pts.
  const allPts = co_cross(s.x, s.y, s.wave);
  const hidden = co_hidden();
  const pts = allPts.filter(p => !hidden.has(p.region));
  const model = (pts.length >= CO_MIN_FIT) ? co_ols(pts) : null;
  co_updateBanner(model, pts.length, allPts.length);

  // --- layout: el área de ploteo es CUADRADA (los dos ejes son 0-100) ---
  const legItems = co_legendItems(allPts, !!editorFormat);
  // La leyenda no se puede comer el cuadrado: si el ítem más ancho ("América
  // del Norte, Australia y N.Z.") pide más del 34% del ancho, se achica la
  // tipografía de la leyenda hasta que entre (con piso, para que en los PNG
  // mobile-first siga siendo legible). El ancho del texto es lineal en el
  // font-size, así que alcanza con reescalar.
  let legFs = SIZES.legend;
  let legNeed = 0;
  legItems.forEach(it => { legNeed = Math.max(legNeed, co_legendItemW(it, legFs)); });
  legNeed += 4;
  const legCap = plotW * 0.34;
  if (legNeed > legCap) {
    const minFs = bigFmt ? 16 : 9.5;
    const scaled = Math.max(minFs, legFs * legCap / legNeed);
    legNeed = legNeed * scaled / legFs;
    legFs = scaled;
  }
  const legColW = Math.min(legNeed, plotW * 0.42);
  const legGap = bigFmt ? 30 : 22;
  const availSide = plotW - legColW - legGap;

  let plotX, plotY, side, legendMode, legRows = null;
  if (availSide >= plotH * 0.72 && availSide > 140) {
    legendMode = 'side';
    side = Math.min(availSide, plotH);
    plotX = MARGIN.left + Math.max(0, Math.round((availSide - side) / 2));
    plotY = MARGIN.top + Math.max(0, Math.round((plotH - side) / 2));
  } else {
    legendMode = 'top';
    legRows = co_legendRows(legItems, legFs, plotW);
    const legH = legRows.length * legFs * 1.7 + legFs * 1.1;
    side = Math.max(80, Math.min(plotW, plotH - legH));
    plotX = MARGIN.left + Math.round((plotW - side) / 2);
    plotY = MARGIN.top + legH;
  }
  const plotBox = { x1: plotX, x2: plotX + side, y1: plotY, y2: plotY + side };
  const xScale = (v) => plotX + (v / 100) * side;
  const yScale = (v) => plotY + side - (v / 100) * side;

  // --- grid + ticks (0-100 en los dos ejes) ---
  const ticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, 100, 6) : [0, 20, 40, 60, 80, 100];
  const gridG = co_ns('g'); svg.appendChild(gridG);
  ticks.forEach(v => {
    const x = xScale(v), y = yScale(v);
    const lv = co_ns('line');
    lv.setAttribute('x1', x); lv.setAttribute('x2', x);
    lv.setAttribute('y1', plotY); lv.setAttribute('y2', plotY + side);
    lv.setAttribute('stroke', CO_GRID); lv.setAttribute('stroke-width', 1);
    gridG.appendChild(lv);
    const lh = co_ns('line');
    lh.setAttribute('x1', plotX); lh.setAttribute('x2', plotX + side);
    lh.setAttribute('y1', y); lh.setAttribute('y2', y);
    lh.setAttribute('stroke', CO_GRID); lh.setAttribute('stroke-width', 1);
    gridG.appendChild(lh);

    const tx = co_ns('text');
    tx.setAttribute('x', x); tx.setAttribute('y', plotY + side + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', CO_INK_SOFT);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = Math.round(v) + '%';
    gridG.appendChild(tx);

    const ty = co_ns('text');
    ty.setAttribute('x', plotX - (bigFmt ? 12 : 8)); ty.setAttribute('y', y);
    ty.setAttribute('text-anchor', 'end');
    ty.setAttribute('dominant-baseline', 'central');
    ty.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    ty.style.fontSize = SIZES.tick + 'px';
    ty.setAttribute('fill', CO_INK_SOFT);
    ty.setAttribute('font-variant-numeric', 'tabular-nums');
    ty.textContent = Math.round(v) + '%';
    gridG.appendChild(ty);
  });

  // marco del área de ploteo (los dos ejes en 0)
  const axG = co_ns('g'); svg.appendChild(axG);
  const axX = co_ns('line');
  axX.setAttribute('x1', plotX); axX.setAttribute('x2', plotX + side);
  axX.setAttribute('y1', plotY + side); axX.setAttribute('y2', plotY + side);
  axX.setAttribute('stroke', CO_AXIS); axX.setAttribute('stroke-width', 1);
  axG.appendChild(axX);
  const axY = co_ns('line');
  axY.setAttribute('x1', plotX); axY.setAttribute('x2', plotX);
  axY.setAttribute('y1', plotY); axY.setAttribute('y2', plotY + side);
  axY.setAttribute('stroke', CO_AXIS); axY.setAttribute('stroke-width', 1);
  axG.appendChild(axY);

  // --- línea de 45° (punteada): y = x. Con el plot cuadrado y los dos ejes en
  //     la misma escala, es la diagonal exacta del área de ploteo. ---
  const diag = co_ns('line');
  diag.setAttribute('x1', xScale(0));   diag.setAttribute('y1', yScale(0));
  diag.setAttribute('x2', xScale(100)); diag.setAttribute('y2', yScale(100));
  diag.setAttribute('stroke', CO_DIAG);
  diag.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
  diag.setAttribute('stroke-dasharray', bigFmt ? '10 8' : '5 4');
  svg.appendChild(diag);

  // --- recta de ajuste (OLS), recortada al cuadrado 0-100 ---
  if (model) {
    let xa = 0, xb = 100;
    if (model.b !== 0) {
      const xAt0   = (0 - model.a) / model.b;
      const xAt100 = (100 - model.a) / model.b;
      const lo = Math.min(xAt0, xAt100), hi = Math.max(xAt0, xAt100);
      xa = Math.max(0, lo); xb = Math.min(100, hi);
    } else {
      if (model.a < 0 || model.a > 100) { xa = 0; xb = -1; }
    }
    if (xb > xa) {
      const fit = co_ns('line');
      fit.setAttribute('x1', xScale(xa)); fit.setAttribute('y1', yScale(model.a + model.b * xa));
      fit.setAttribute('x2', xScale(xb)); fit.setAttribute('y2', yScale(model.a + model.b * xb));
      fit.setAttribute('stroke', CO_FIT);
      fit.setAttribute('stroke-width', bigFmt ? 3 : 1.8);
      fit.setAttribute('stroke-opacity', 0.7);
      fit.setAttribute('stroke-linecap', 'round');
      svg.appendChild(fit);
    }
  }

  // --- títulos de eje ---
  const axisTpl = co_T('c19-axis-tpl');
  const xTitle = co_ns('text');
  xTitle.setAttribute('x', plotX + side / 2);
  xTitle.setAttribute('y', plotY + side + (bigFmt ? 66 : 40));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px';
  xTitle.setAttribute('fill', '#5A5346'); xTitle.setAttribute('font-weight', 600);
  xTitle.textContent = axisTpl.replace('{VAR}', co_varLabel(s.x));
  svg.appendChild(xTitle);

  const ytx = Math.max(bigFmt ? 22 : 14, plotX - (bigFmt ? 80 : 48));
  const yTitle = co_ns('text');
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', plotY + side / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px';
  yTitle.setAttribute('fill', '#5A5346'); yTitle.setAttribute('font-weight', 600);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${plotY + side / 2})`);
  yTitle.textContent = axisTpl.replace('{VAR}', co_varLabel(s.y));
  svg.appendChild(yTitle);

  // --- leyenda ---
  if (legendMode === 'side') {
    co_drawLegendSide(svg, legItems, plotX + side + legGap, plotY + legFs * 1.2, legFs);
  } else {
    co_drawLegendTop(svg, legItems, legRows, MARGIN.left, MARGIN.top, plotW, legFs);
  }

  // --- puntos ---
  const dotsG = co_ns('g'); svg.appendChild(dotsG);
  const selected = state[19].selected || [];
  // Argentina y los seleccionados se dibujan al final (arriba de todo).
  const ordered = pts.slice().sort((a, b) => {
    const score = (p) => (p.iso === CO_HIGHLIGHT ? 2 : 0) + (selected.indexOf(p.iso) >= 0 ? 1 : 0);
    return score(a) - score(b);
  });
  ordered.forEach(p => {
    const cx = xScale(p.x), cy = yScale(p.y);
    const isHi = p.iso === CO_HIGHLIGHT;
    const r = isHi ? SIZES.dot * 1.45 : SIZES.dot;
    const c = co_ns('circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', co_regionColor(p.region));
    c.setAttribute('fill-opacity', isHi ? 1 : 0.82);
    c.setAttribute('stroke', isHi ? '#3A3530' : CO_BG);
    c.setAttribute('stroke-width', isHi ? (bigFmt ? 3 : 2) : (bigFmt ? 1.6 : 1));
    c.setAttribute('data-co', p.iso);
    c.setAttribute('data-co-reg', p.region);   // foco por región desde la leyenda
    dotsG.appendChild(c);

    if (isPngFormat) return;   // el PNG no necesita hit-areas ni hover
    c.style.cursor = 'pointer';
    const hit = co_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
    hit.setAttribute('r', Math.max(bigFmt ? 22 : 13, r * 2));
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';
    const enter = (e) => { co_emph(p.iso); co_showTooltip(e, p); };
    const leave = () => { co_emph(null); co_hideTooltip(); };
    c.addEventListener('mouseenter', enter);
    c.addEventListener('mousemove', co_posTooltip);
    c.addEventListener('mouseleave', leave);
    hit.addEventListener('mouseenter', enter);
    hit.addEventListener('mousemove', co_posTooltip);
    hit.addEventListener('mouseleave', leave);
    hit.addEventListener('click', enter);
    dotsG.appendChild(hit);
  });

  // --- etiquetas: WYSIWYG, los chips SON las etiquetas ---
  const items = [];
  pts.forEach(p => {
    if (selected.indexOf(p.iso) < 0) return;
    const text = co_name(p.iso);
    const isHi = p.iso === CO_HIGHLIGHT;
    items.push({
      cx: xScale(p.x), cy: yScale(p.y), text: text,
      textW: co_measure(text, SIZES.label, isHi ? 700 : 600) + 2,
      iso: p.iso, region: p.region, forced: true,
      r: (isHi ? SIZES.dot * 1.45 : SIZES.dot)
    });
  });
  const placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, plotBox) : [];
  if (typeof s_relaxLabels === 'function') {
    const obstacles = pts.map(p => ({ x: xScale(p.x), y: yScale(p.y), r: SIZES.dot + 2 }));
    s_relaxLabels(placed, SIZES.label, plotBox, bigFmt ? 220 : 120, obstacles);
  }
  const labelsG = co_ns('g'); svg.appendChild(labelsG);
  placed.forEach(l => {
    let src = null;
    for (let i = 0; i < items.length; i++) if (items[i].iso === l.iso) { src = items[i]; break; }
    if (src) {
      const dx = l.lx - src.cx, dy = l.ly - src.cy;
      if (Math.hypot(dx, dy) > src.r + (bigFmt ? 18 : 12)) {
        const gl = co_ns('line');
        gl.setAttribute('x1', src.cx); gl.setAttribute('y1', src.cy);
        gl.setAttribute('x2', l.lx); gl.setAttribute('y2', l.ly - SIZES.label * 0.3);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.8);
        gl.setAttribute('stroke-opacity', 0.75);
        gl.setAttribute('data-co', l.iso);
        gl.setAttribute('data-co-reg', l.region);
        labelsG.appendChild(gl);
      }
    }
    const tx = co_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.label + 'px';
    tx.setAttribute('font-weight', l.iso === CO_HIGHLIGHT ? 700 : 600);
    tx.setAttribute('fill', l.iso === CO_HIGHLIGHT ? CO_HI_COLOR : co_regionLabelColor(l.region));
    tx.setAttribute('paint-order', 'stroke');
    tx.setAttribute('stroke', CO_BG);
    tx.setAttribute('stroke-width', bigFmt ? 5 : 3);
    tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-co', l.iso);
    tx.setAttribute('data-co-reg', l.region);
    tx.textContent = l.text;
    labelsG.appendChild(tx);
  });

  // Tap en zona vacía: cerrar tooltip y sacar el énfasis. (El click en la
  // leyenda no llega acá: co_legendNode hace stopPropagation.)
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { co_hideTooltip(); co_emph(null); co_regionEmph(null); }
  };

  // Título: siempre el neutral (norma del número).
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('19', false, { title: 'c19-title', titleNeutral: 'c19-title-neutral' });
  }
}

// Énfasis al hover: atenúa el resto por OPACIDAD, sin redibujar (redibujar en
// el hover tilda el chart).
function co_emph(iso) {
  const svg = document.getElementById('chart19');
  if (!svg) return;
  const els = svg.querySelectorAll('[data-co]');
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (iso == null) el.style.opacity = '';
    else el.style.opacity = (el.getAttribute('data-co') === iso) ? '1' : '0.16';
  }
}

// Énfasis por REGIÓN al pasar por la leyenda: mismo mecanismo (opacidad sobre
// lo ya dibujado, cero redibujado). El apagado NO pasa por acá: ese cambia el
// modelo y redibuja.
function co_regionEmph(reg) {
  const svg = document.getElementById('chart19');
  if (!svg) return;
  const els = svg.querySelectorAll('[data-co-reg]');
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (reg == null) el.style.opacity = '';
    else el.style.opacity = (el.getAttribute('data-co-reg') === reg) ? '1' : '0.16';
  }
  const leg = svg.querySelectorAll('[data-co-legend]');
  for (let j = 0; j < leg.length; j++) {
    const el = leg[j];
    if (el.dataset.coLegendOff) { el.setAttribute('opacity', 0.34); continue; }
    el.setAttribute('opacity', (reg == null || el.dataset.coLegend === reg) ? 1 : 0.38);
  }
}

// =================== Tooltip ===================
function co_showTooltip(e, p) {
  const tt = document.getElementById('tooltip19');
  if (!tt) return;
  const s = state[19];
  const regLabel = p.region ? co_T('reg.' + p.region) : '';
  const regColor = co_regionColor(p.region);
  const yearTpl = co_T('c19-tt-year');
  let html = '<strong>' + co_name(p.iso) + '</strong>';
  if (regLabel) html += '<div class="tt-region" style="color:' + regColor + '">' + regLabel + '</div>';
  html += '<div class="tt-row"><span>' + co_varLabel(s.x) + '</span><span>' + co_fmt(p.x, 1) + '%</span></div>';
  html += '<div class="tt-row"><span>' + co_varLabel(s.y) + '</span><span>' + co_fmt(p.y, 1) + '%</span></div>';
  if (p.yearX === p.yearY) {
    html += '<div class="tt-year">' + yearTpl.replace('{Y}', p.yearX) + '</div>';
  } else {
    html += '<div class="tt-year">' + co_varLabel(s.x) + ': ' + yearTpl.replace('{Y}', p.yearX) + '</div>';
    html += '<div class="tt-year">' + co_varLabel(s.y) + ': ' + yearTpl.replace('{Y}', p.yearY) + '</div>';
  }
  tt.innerHTML = html;
  tt.style.display = 'block';
  tt.style.opacity = '1';
  co_posTooltip(e);
}

// Se reubica a la izquierda cerca del borde derecho (norma de interacción).
function co_posTooltip(e) {
  const tt = document.getElementById('tooltip19');
  if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = ((typeof evClientX === 'function') ? evClientX(e) : e.clientX) - wrap.left;
  const y = ((typeof evClientY === 'function') ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (px < 0) px = 2;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px';
  tt.style.top = py + 'px';
}

function co_hideTooltip() {
  const tt = document.getElementById('tooltip19');
  if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }
}

// =================== Chips + buscador (WYSIWYG) ===================
function co_toggleSelect(iso) {
  const arr = state[19].selected;
  const i = arr.indexOf(iso);
  if (i >= 0) arr.splice(i, 1); else arr.push(iso);
  renderCorrelacionesChips();
  drawCorrelaciones();
}

function renderCorrelacionesChips() {
  const cont = document.getElementById('co-selected-chips');
  if (!cont) return;
  cont.innerHTML = '';
  const pts = (state[19].wave == null) ? [] : co_cross(state[19].x, state[19].y, state[19].wave);
  const region = {};
  pts.forEach(p => { region[p.iso] = p.region; });
  (state[19].selected || []).slice()
    .sort((a, b) => co_name(a).localeCompare(co_name(b), co_lang()))
    .forEach(iso => {
      const chip = document.createElement('span');
      chip.className = 'm-selected-chip';
      const dot = document.createElement('span');
      dot.className = 'm-chip-dot';
      dot.style.background = region[iso] ? co_regionColor(region[iso]) : '#C4BCAE';
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(co_name(iso)));
      if (!region[iso]) chip.classList.add('co-chip-absent');
      const x = document.createElement('button');
      x.className = 'm-chip-x';
      x.innerHTML = '×';
      x.setAttribute('aria-label', co_T('chip-remove'));
      x.addEventListener('click', () => co_toggleSelect(iso));
      chip.appendChild(x);
      cont.appendChild(chip);
    });
}

// Países buscables: los que tienen dato en CUALQUIER ola del cruce activo.
function co_searchable() {
  const s = state[19];
  const seen = {};
  co_waves(s.x, s.y).forEach(w => {
    co_cross(s.x, s.y, w).forEach(p => { seen[p.iso] = true; });
  });
  return Object.keys(seen)
    .map(iso => ({ iso: iso, name: co_name(iso) }))
    .sort((a, b) => a.name.localeCompare(b.name, co_lang()));
}

function setupCorrelacionesSearch() {
  const input = document.getElementById('co-search');
  const results = document.getElementById('co-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const norm = (v) => (v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function getM(q) {
    if (!q) return [];
    const qn = norm(q);
    return co_searchable().filter(c => norm(c.name).indexOf(qn) >= 0).slice(0, 8);
  }
  function render(ms, act) {
    if (!ms.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    const sel = state[19].selected || [];
    results.innerHTML = ms.map((c, i) =>
      '<div class="m-search-result' + (i === act ? ' m-active' : '') +
      (sel.indexOf(c.iso) >= 0 ? ' m-already' : '') + '" data-iso="' + c.iso + '">' + c.name + '</div>'
    ).join('');
    results.classList.add('open');
    results.querySelectorAll('[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        co_toggleSelect(el.getAttribute('data-iso'));
        input.value = '';
        results.classList.remove('open');
      });
    });
  }
  input.addEventListener('input', (ev) => { matches = getM(ev.target.value); active = -1; render(matches, active); });
  input.addEventListener('keydown', (ev) => {
    if (!matches.length) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(matches, active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(matches, active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); co_toggleSelect(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

// =================== Selectores de eje + invertir ===================
function co_buildSelects() {
  const build = (id, value) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '';
    const groups = [];
    co_vars().forEach(v => { if (groups.indexOf(v.grupo) < 0) groups.push(v.grupo); });
    groups.forEach(g => {
      const og = document.createElement('optgroup');
      og.label = co_T(CO_GRP_KEY[g] || g);
      co_vars().forEach(v => {
        if (v.grupo !== g) return;
        const op = document.createElement('option');
        op.value = v.k;
        op.textContent = co_lang() === 'en' ? v.en : v.es;
        og.appendChild(op);
      });
      sel.appendChild(og);
    });
    sel.value = value;
  };
  build('co-x-select', state[19].x);
  build('co-y-select', state[19].y);
}

function setupCorrelacionesSelects() {
  const sx = document.getElementById('co-x-select');
  const sy = document.getElementById('co-y-select');
  if (sx) {
    sx.addEventListener('change', () => {
      const prev = state[19].x;
      state[19].x = sx.value;
      // Elegir en un eje la variable que ya está en el otro = invertir ejes.
      if (state[19].x === state[19].y) state[19].y = prev;
      co_stopPlay();
      co_buildSelects();
      // Primero el dibujo (que reajusta la ola al nuevo par) y después los
      // chips: si no, el chip se marca "sin dato" mirando una ola que ya no es.
      drawCorrelaciones();
      renderCorrelacionesChips();
    });
  }
  if (sy) {
    sy.addEventListener('change', () => {
      const prev = state[19].y;
      state[19].y = sy.value;
      if (state[19].y === state[19].x) state[19].x = prev;
      co_stopPlay();
      co_buildSelects();
      drawCorrelaciones();
      renderCorrelacionesChips();
    });
  }
  const swap = document.getElementById('co-swap');
  if (swap) {
    swap.addEventListener('click', () => {
      const kx = state[19].x;
      state[19].x = state[19].y;
      state[19].y = kx;
      co_buildSelects();
      drawCorrelaciones();
    });
  }
}

// =================== Slider de ola con play ===================
function co_syncWaveControl(waves) {
  const group = document.getElementById('co-wave-group');
  const slider = document.getElementById('co-wave-slider');
  const display = document.getElementById('co-wave-display');
  if (display) display.textContent = (state[19].wave == null) ? '—' : co_waveLabel(state[19].wave);
  if (!group || !slider) return;
  if (waves.length < 2) {
    co_stopPlay();
    group.style.display = 'none';
    return;
  }
  group.style.display = '';
  slider.min = '0';
  slider.max = String(waves.length - 1);
  slider.step = '1';
  const idx = waves.indexOf(state[19].wave);
  slider.value = String(idx < 0 ? waves.length - 1 : idx);
}

function co_stopPlay() {
  const btn = document.getElementById('co-play');
  if (state[19]) state[19].playing = false;
  if (co_stopPlay._timer) { clearInterval(co_stopPlay._timer); co_stopPlay._timer = null; }
  if (btn) {
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', co_T('c19-play'));
  }
}

function setupCorrelacionesWave() {
  const slider = document.getElementById('co-wave-slider');
  const btn = document.getElementById('co-play');
  if (slider) {
    slider.addEventListener('input', () => {
      const ws = co_waves(state[19].x, state[19].y);
      const i = Math.max(0, Math.min(ws.length - 1, parseInt(slider.value, 10)));
      if (ws[i] == null) return;
      state[19].wave = ws[i];
      renderCorrelacionesChips();
      drawCorrelaciones();
    });
  }
  if (btn) {
    btn.setAttribute('aria-label', co_T('c19-play'));
    btn.addEventListener('click', () => {
      if (state[19].playing) { co_stopPlay(); return; }
      const ws = co_waves(state[19].x, state[19].y);
      if (ws.length < 2) return;
      if (ws.indexOf(state[19].wave) === ws.length - 1) {
        state[19].wave = ws[0];
        renderCorrelacionesChips();
        drawCorrelaciones();
      }
      state[19].playing = true;
      btn.classList.add('playing');
      btn.setAttribute('aria-label', co_T('c19-pause'));
      co_stopPlay._timer = setInterval(() => {
        const list = co_waves(state[19].x, state[19].y);
        const i = list.indexOf(state[19].wave);
        if (i < 0 || i >= list.length - 1) { co_stopPlay(); return; }
        state[19].wave = list[i + 1];
        renderCorrelacionesChips();
        drawCorrelaciones();
      }, CO_PLAY_MS);
    });
  }
}

// "Ver todas las regiones": vuelve a prender todo lo apagado desde la leyenda.
function setupCorrelacionesShowAll() {
  const btn = document.getElementById('co-show-all');
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => co_showAllRegions());
}

// =================== Download CSV ===================
// El cruce que se está viendo: los dos indicadores, la ola activa, el año real
// de campo de cada país y el n de cada medición.
function setupCorrelacionesCSV() {
  document.querySelectorAll('button.download[data-chart="19-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = state[19];
      const vx = co_var(s.x), vy = co_var(s.y);
      let csv = '';
      csv += '# El Atlas N5 — cruce de dos preguntas de la Integrated Values Survey (EVS + WVS)\n';
      csv += '# ola=' + (s.wave == null ? '' : s.wave) + ' (' + co_waveLabel(s.wave) + ')\n';
      csv += '# x=' + s.x + ' (' + (vx ? vx.fuente : '') + ') | y=' + s.y + ' (' + (vy ? vy.fuente : '') + ')\n';
      csv += '# anio_x / anio_y: ano real de campo del pais. Solo paises con las DOS observaciones.\n';
      csv += 'iso3,pais,region,ola,x_var,x_pct,x_anio,x_n,y_var,y_pct,y_anio,y_n\n';
      const pts = (s.wave == null) ? [] : co_cross(s.x, s.y, s.wave);
      pts.slice().sort((a, b) => a.iso.localeCompare(b.iso)).forEach(p => {
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[p.iso])
          ? (COUNTRY_NAMES[p.iso].en || p.iso) : p.iso;
        const nmQ = (nm.indexOf(',') >= 0) ? '"' + nm + '"' : nm;
        csv += [p.iso, nmQ, p.region, s.wave, s.x, p.x, p.yearX, p.nX, s.y, p.y, p.yearY, p.nY].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (co_lang() === 'en')
        ? 'the-atlas-05-value-cross.csv'
        : 'el-atlas-05-cruce-valores.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

// =================== Init ===================
function initCorrelaciones() {
  if (!state[19]) state[19] = {};
  const s = state[19];
  if (!co_var(s.x)) s.x = CO_DEFAULT_X;
  if (!co_var(s.y)) s.y = CO_DEFAULT_Y;
  if (s.x === s.y) { s.x = CO_DEFAULT_X; s.y = CO_DEFAULT_Y; }
  if (!Array.isArray(s.selected)) s.selected = CO_DEFAULT_SELECTED.slice();
  if (!Array.isArray(s.hiddenRegions)) s.hiddenRegions = [];
  s.playing = false;
  const ws = co_waves(s.x, s.y);
  if (ws.indexOf(s.wave) < 0) s.wave = ws.length ? ws[ws.length - 1] : null;

  co_buildSelects();
  setupCorrelacionesSelects();
  setupCorrelacionesWave();
  setupCorrelacionesSearch();
  setupCorrelacionesCSV();
  setupCorrelacionesShowAll();
  renderCorrelacionesChips();
  drawCorrelaciones();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawCorrelaciones;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initCorrelaciones._wired) {
    initCorrelaciones._wired = true;
    window.addEventListener('atlas-editor-change', () => drawCorrelaciones());
    // Tocar/clickear fuera del gráfico apaga tooltip y énfasis (en touch el
    // mouseleave del punto no llega nunca y si no queda todo atenuado).
    document.addEventListener('click', (ev) => {
      const svg = document.getElementById('chart19');
      if (svg && !svg.contains(ev.target)) { co_hideTooltip(); co_emph(null); }
    });
  }

  // El PNG rasteriza el SVG: apagamos tooltip y énfasis antes de exportar.
  window.onBeforePngExport = function (svgClone, chartId) {
    if (chartId !== '19') return;
    co_hideTooltip();
    co_emph(null);
    co_regionEmph(null);
  };
  // Nota "Datos" corta del PNG, con los dos ejes, la ola y los estadísticos
  // que en pantalla viven en el banner (el PNG no rasteriza HTML).
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '19') return null;
    const tpl = co_T('c19-sources-tpl');
    if (!tpl) return null;
    // Los mismos países que el gráfico: si el usuario apagó regiones, el n y el
    // R² de la nota son los del ajuste que se ve, no los del cruce completo.
    const hid = co_hidden();
    const pts = (s.wave == null)
      ? []
      : co_cross(s.x, s.y, s.wave).filter(p => !hid.has(p.region));
    const model = (pts.length >= CO_MIN_FIT) ? co_ols(pts) : null;
    return tpl
      .replace('{PERIODO}', co_waveLabel(s.wave))
      .replace('{X}', co_varLabel(s.x))
      .replace('{Y}', co_varLabel(s.y))
      .replace('{N}', String(pts.length))
      .replace('{R2}', model ? co_fmt(model.r2, 2) : '—');
  };
}

// Relee los textos que dependen del idioma (los llama el toggle ES/EN).
function co_onLangChange() {
  co_buildSelects();
  renderCorrelacionesChips();
  drawCorrelaciones();
}
