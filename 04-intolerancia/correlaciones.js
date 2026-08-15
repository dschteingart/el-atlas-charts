// =============================================================
//  El Atlas N°4 — Chart 19: ¿las intolerancias van juntas?
// =============================================================
// El chart EXPLORATORIO del número: cruza DOS variables cualesquiera de la
// Integrated Values Survey (24 en el menú) para el mismo conjunto de países y
// la misma ola. La pregunta: el que rechaza a un vecino de otra raza, ¿rechaza
// también a un homosexual? Default X = otra raza, Y = homosexuales.
//
// CLON del motor de scatter del repo (regla de oro: clonar, no reimplementar):
//   - 02-demasiado-desiguales/scatter.js → OLS client-side (s_ols), banner con
//     R², slider con play, buscador + chips, tooltip reubicable.
//   - 04-intolerancia/declarado-implicito.js → el scatter del propio N°4:
//     etiquetado forzado, resaltado de Argentina, leyenda de regiones dentro
//     del SVG, hit-area táctil, formatos del editor/PNG.
//   - lib/scatter-render.js → s_layoutLabels / s_relaxLabels / s_labelBox
//     (placement anti-colisión de etiquetas, el mismo del N°2 y el N°3).
//
// Decisiones propias de este chart:
//   - El área de ploteo es CUADRADA, pero cada eje va en el rango de SU variable
//     (co_axisBounds): con 0-100 fijo casi todos los cruces quedaban apelotonados
//     en una esquina. Como los rangos pueden diferir, la punteada ya no está a
//     45°: marca dónde los dos ejes valen lo mismo, y por encima de ella pesa
//     más el eje vertical. Las dos referencias (igual valor y recta de ajuste)
//     se prenden y apagan desde los toggles de la barra de controles.
//   - El slider de ola recorre sólo la INTERSECCIÓN de olas de las dos
//     variables, y sólo las celdas con al menos CO_MIN_N países en común
//     (mismo criterio que el resto del número). Si queda una sola ola, el
//     slider se esconde en vez de dejar un control inútil.
//   - WYSIWYG: los chips SON las etiquetas. Seleccionar no atenúa (eso lo hace
//     el hover, por opacidad).
//
// CONTRATO DE INTERACCIÓN DEL SCATTER DEL ATLAS (el mismo de los charts 5 y 18
// de este número, y el de los scatters del N°1, N°2 y N°3):
//   HOVER sobre una región de la leyenda → se ETIQUETAN todos los países de esa
//     región (se re-corre la anti-colisión sobre el conjunto ampliado) y el
//     resto de los puntos se atenúa por opacidad. Se redibuja SÓLO el grupo de
//     etiquetas (co_renderLabels): la leyenda no se recrea bajo el cursor.
//   CLICK en la leyenda → apaga la región y la saca del modelo.
//   TAP sobre un punto → tooltip (+ el mismo énfasis que aplica el hover).
// El CHIP es la selección persistente y siempre se etiqueta, aun durante el
// hover de otra región; las etiquetas reveladas por el hover son transitorias
// (más livianas, en el color de su región) y desaparecen al salir.
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
// Sin pais destacado: Argentina se dibujaba mas grande y con borde negro en
// todos los cruces, y no corresponde que un pais este marcado de fabrica.
const CO_HIGHLIGHT = null;
const CO_HI_COLOR  = '#8B4220';

// El cruce con el que abre el chart: lo declarado sobre uno mismo (rechazo al
// vecino de otra raza) contra lo que se dice ver alrededor (racismo en el
// barrio). Son las dos preguntas que el número contrapone.
const CO_DEFAULT_X = 'otra_raza';
const CO_DEFAULT_Y = 'H002_04';
// Y abre en BRECHAS: el par de arriba es una historia de "estas dos no
// coinciden", y eso el dumbbell lo muestra directo; el scatter lo hace deducir.
const CO_DEFAULT_VISTA = 'dumbbell';
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
// Los diez del PNG que aprobó Daniel (2026-07-30). Cubren las dos puntas del
// contraste: el este asiático declara mucho rechazo y ve poco racismo, y en
// América pasa al revés. OJO: la selección es una sola para las dos vistas, así
// que en Dispersión estos son además los países etiquetados.
const CO_DEFAULT_SELECTED = ['MMR', 'VNM', 'JPN', 'KOR', 'URY', 'ARG', 'GBR', 'USA', 'CHL', 'BRA'];
// Anclas globales: cuando el hover revela una región entera y no entran todas
// las etiquetas, la anti-colisión sacrifica primero a los chicos (criterio del
// N°1: subPriority 0 para las anclas, 1 para el resto de la región).
const CO_ANCHORS = {
  USA: 1, DEU: 1, FRA: 1, GBR: 1, ESP: 1, ITA: 1, RUS: 1,
  CHN: 1, JPN: 1, KOR: 1, IND: 1, BRA: 1, MEX: 1, ARG: 1, ZAF: 1, NGA: 1
};
// Contexto del último render (grupo de etiquetas, puntos, escalas): permite
// re-correr el placement de etiquetas en el hover SIN redibujar el chart.
let co_labelCtx = null;
// Los dos grupos de CR_VARS[i].grupo → clave i18n del <optgroup>.
const CO_GRP_KEY = {
  'Batería de vecinos':    'c19-grp-bateria',
  'Otras preguntas':       'c19-grp-otras',
  'Discriminación vivida': 'c19-grp-wrp'
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
// NUNCA devuelve null: un formato nuevo del editor (hoy 'worldmap') no puede
// dejar el gráfico en blanco por un TypeError al leer MARGIN.left.
function co_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 34, right: 34, bottom: 96, left: 104 };
    case 'public':                    return { top: 28, right: 30, bottom: 80, left: 92 };
    case 'mobile':                    return { top: 28, right: 30, bottom: 104, left: 104 };
    default:                          return { top: 28, right: 30, bottom: 80, left: 92 };
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
// Región apuntada por el hover, si sigue encendida (una región apagada no tiene
// puntos ni etiquetas que revelar).
function co_hoverRegion() {
  const s = state[19];
  if (!s || !s.hoverRegion) return null;
  return co_hidden().has(s.hoverRegion) ? null : s.hoverRegion;
}
function co_toggleRegion(reg) {
  const arr = state[19].hiddenRegions || (state[19].hiddenRegions = []);
  const i = arr.indexOf(reg);
  if (i >= 0) arr.splice(i, 1); else arr.push(reg);
  // En touch el mouseenter llega pero el mouseleave nunca: soltamos el hover en
  // cada click para no dejar una región "apuntada" pegada.
  state[19].hoverRegion = null;
  drawCorrelaciones();
}
function co_showAllRegions() {
  state[19].hiddenRegions = [];
  state[19].hoverRegion = null;
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

// Forma de titulo de una variable: CR_VARS[i].titulo_es/_en. Son frases en
// minuscula, listas para componer ("rechazo a vecinos de otra raza"), no los
// rotulos de categoria del menu ("Personas de otra raza"), que sueltos en un
// titulo se leen como una lista de grupos y no como una medicion.
function co_varTitulo(k) {
  const v = co_var(k);
  if (!v) return k;
  const tit = (co_lang() === 'en') ? v.titulo_en : v.titulo_es;
  return tit || co_varLabel(k);
}

// Forma de titulo con mayuscula inicial, para la leyenda y los titulos de eje:
// son los lugares donde el lector tiene que entender QUE se mide sin ir a la
// nota. El rotulo corto del menu no alcanza ("Homosexuales" no dice que se mide
// el rechazo a tenerlos de vecinos): reporte de Daniel 2026-07-29.
function co_varTituloCap(k) {
  const s = co_varTitulo(k);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Titulo del chart: lo arman las DOS variables elegidas (criterio OWID), asi
// que no puede salir de una clave fija. Respeta el titulo custom del editor,
// igual que el subtitulo.
// ¿Estado por default? El titular editorial afirma algo sobre ESTE cruce: vale
// mientras no se toque el par, la ola ni la selección de países.
function co_esDefault() {
  const s = state[19];
  if (!s) return false;
  if (s.x !== CO_DEFAULT_X || s.y !== CO_DEFAULT_Y) return false;
  const ws = co_waves(s.x, s.y);
  if (!ws.length || s.wave !== ws[ws.length - 1]) return false;
  if (co_hidden().size) return false;
  const sel = (s.selected || []).slice().sort().join(',');
  return sel === CO_DEFAULT_SELECTED.slice().sort().join(',');
}

function co_updateTitle() {
  const el = document.querySelector('.chart-block[data-chart="19"] .chart-title');
  if (!el) return;
  if (co_editorCustom('title')) return;
  const s = state[19];
  // Titular editorial: sólo en el estado por default Y sólo si el dato lo
  // sostiene. El hallazgo de este cruce es que las dos preguntas NO se
  // predicen (r = −0,14 sobre 65 países), así que la guarda es un |r| chico:
  // si algún día el dato se ordena, el titular se va solo en vez de mentir.
  const ed = co_T('c19-title-editorial');
  if (ed && ed !== 'c19-title-editorial' && co_esDefault()) {
    const pts = (s.wave == null) ? [] : co_cross(s.x, s.y, s.wave);
    const m = (pts.length >= CO_MIN_FIT) ? co_ols(pts) : null;
    if (m && Math.abs(Math.sqrt(Math.max(0, m.r2)) * (m.b < 0 ? -1 : 1)) < 0.25) {
      el.textContent = ed;
      return;
    }
  }
  const tpl = co_T(s.vista === 'dumbbell' ? 'c19-title-db-tpl' : 'c19-title-tpl');
  if (!tpl || tpl.indexOf('{X}') < 0) return;
  const txt = tpl.replace('{X}', co_varTitulo(s.x)).replace('{Y}', co_varTitulo(s.y));
  el.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
}

// Forma verbal de una variable («rechaza tener vecinos de otra raza»), la que
// entra en el subtítulo. Si falta la clave cae a la forma de título, que es
// sustantiva pero al menos nombra la medición.
function co_varFrase(k) {
  const key = 'c19-frase-' + k;
  const v = co_T(key);
  return (v && v !== key) ? v : co_varTitulo(k);
}

function co_updateSubtitle() {
  const el = document.querySelector('.chart-block[data-chart="19"] .chart-subtitle');
  if (!el) return;
  if (co_editorCustom('subtitle')) return;   // respetar el subtítulo custom del editor (?nl)
  const s = state[19];
  const tpl = co_T('c19-subtitle-tpl');
  if (!tpl) return;
  el.textContent = tpl
    .replace('{X}', co_varFrase(s.x))
    .replace('{Y}', co_varFrase(s.y))
    .replace('{PERIODO}', co_waveLabel(s.wave));
}

// ¿Alguno de los dos ejes viene de una fuente ajena a la IVS? La marca la pone
// el generador (CR_VARS[i].fuente_ext), no una lista de claves acá: si mañana
// entra otra variable de afuera, esto sigue funcionando solo.
function co_ejeExterno() {
  const s = state[19];
  const vx = co_var(s.x), vy = co_var(s.y);
  return !!((vx && vx.fuente_ext) || (vy && vy.fuente_ext));
}

// La nota de fuentes afirma que los dos ejes salen de la MISMA encuesta y de las
// mismas personas. Con una variable del World Risk Poll en algún eje eso deja de
// ser cierto, así que se agrega el párrafo que lo aclara (y se saca al volver).
// La nota lleva el intervalo de la OLA que se está mirando, no el rango entero
// del dataset: el gráfico es una foto, no una serie temporal. Y cambia por
// vista, porque en brechas no hay ejes ni ajuste que explicar.
function co_updateSources() {
  const s = state[19];
  const key = (s && s.vista === 'dumbbell') ? 'c19-sources-db' : 'c19-sources';
  let base = co_T(key);
  if (base === key) return;
  base = base.replace('{PERIODO}', co_waveLabel(s ? s.wave : null));
  // Con un eje del World Risk Poll la fuente ya no es una sola.
  const ext = co_ejeExterno() ? co_T('c19-sources-wrp') : '';
  const add = (ext && ext !== 'c19-sources-wrp') ? ext : '';
  document.querySelectorAll('[data-i18n="c19-sources"]').forEach(function (el) {
    el.innerHTML = base + add;
  });
}

// Definición exacta de cada eje (sale de CR_VARS[i].def_es/def_en): sin esto,
// un eje que dice "Personas de otra raza" no se entiende.
function co_updateDefs() {
  co_updateSources();
  const el = document.getElementById('co-defs');
  if (!el) return;
  // En la vista de brechas no hay eje X ni eje Y —las dos variables comparten la
  // misma vara— así que el bloque de definiciones se oculta entero (pedido de
  // Daniel 2026-07-28). Se vacía además del display para no dejar el margen.
  if (state[19] && state[19].vista === 'dumbbell') {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
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
// ---------------- Rango de los ejes ----------------
// Los dos ejes iban SIEMPRE de 0 a 100 y casi todos los cruces quedaban
// apelotonados en una esquina (reporte de Daniel 2026-07-26). Ahora cada eje se
// ajusta al nivel de su variable.
//
// El rango se calcula sobre TODAS las olas del par, no sobre la ola mostrada: si
// se recalculara ola por ola, el eje saltaría al mover el slider y la animación
// del play sería ilegible. Mismo criterio que dv_yMaxFor() en desarrollo.js.
// Cacheado por par (los datos son estáticos).
function co_niceStep(span) {
  // El paso mas chico de la escalera (1, 2, 2.5, 5, 10) que deje como mucho 8
  // intervalos. Pedir "un sexto del rango" y redondear hacia arriba daba saltos
  // feos: un rango de 67 caia en paso 20 y el eje se estiraba hasta 80.
  if (!(span > 0)) return 1;
  const mags = [1, 2, 2.5, 5, 10];
  const p0 = Math.pow(10, Math.floor(Math.log10(span)) - 1);
  for (let k = 0; k < 6; k++) {
    const p = p0 * Math.pow(10, k);
    for (let i = 0; i < mags.length; i++) {
      const st = mags[i] * p;
      if (span / st <= 8) return st;
    }
  }
  return span / 5;
}
function co_niceRange(vals) {
  if (!vals.length) return { lo: 0, hi: 100, step: 20, dec: 0 };
  let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  if (hi === lo) { lo = Math.max(0, lo - 1); hi = Math.min(100, hi + 1); }
  const pad = (hi - lo) * 0.08;   // aire para que ningún punto quede pegado al marco
  lo = Math.max(0, lo - pad); hi = Math.min(100, hi + pad);
  const step = co_niceStep(hi - lo);
  lo = Math.max(0, Math.floor(lo / step) * step);
  hi = Math.min(100, Math.ceil(hi / step) * step);
  if (hi <= lo) hi = Math.min(100, lo + step);
  return { lo: lo, hi: hi, step: step, dec: (step < 1) ? 1 : 0 };
}
function co_axisBounds(kx, ky, wave) {
  if (!co_axisBounds._c) co_axisBounds._c = {};
  const key = kx + '|' + ky + '|' + (wave == null ? 'all' : wave);
  if (co_axisBounds._c[key]) return co_axisBounds._c[key];
  const ws = (wave == null) ? co_waves(kx, ky) : [wave];
  const xs = [], ys = [];
  ws.forEach(function (w) {
    co_cross(kx, ky, w).forEach(function (p) { xs.push(p.x); ys.push(p.y); });
  });
  const out = { x: co_niceRange(xs), y: co_niceRange(ys) };
  co_axisBounds._c[key] = out;
  return out;
}
function co_ticksOf(r) {
  const out = [];
  for (let v = r.lo; v <= r.hi + 1e-9; v += r.step) out.push(+v.toFixed(6));
  return out;
}
// ¿Se muestra cada referencia? Por defecto sí (es lo que había).
function co_showDiag() { return state[19].showDiag !== false; }
function co_showFit()  { return state[19].showFit  !== false; }

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
  // Los dos ítems de línea sólo si la referencia está prendida: la leyenda tiene
  // que describir lo que se ve, no lo que podría verse.
  if (co_showDiag()) items.push({ kind: 'dash', color: CO_DIAG, label: co_T('c19-leg-diag') });
  if (co_showFit())  items.push({ kind: 'line', color: CO_FIT,  label: co_T('c19-leg-fit') });
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
//   HOVER → REVELA las etiquetas de los países de esa región (re-corriendo la
//           anti-colisión sobre el conjunto ampliado) + atenúa el resto por
//           opacidad. Se redibuja sólo el grupo de etiquetas.
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
  g.addEventListener('mouseenter', () => co_setHoverRegion(it.region));
  g.addEventListener('mouseleave', () => co_setHoverRegion(null));
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
  co_labelCtx = null;

  const s = state[19];
  const waves = co_waves(s.x, s.y);
  if (waves.length === 0) s.wave = null;
  else if (waves.indexOf(s.wave) < 0) s.wave = waves[waves.length - 1];
  co_syncWaveControl(waves);
  co_updateSubtitle();
  co_updateDefs();

  // Controles que son SOLO de la dispersión: las referencias (igual valor /
  // recta) y el banner de estadísticos no significan nada en la vista de
  // brechas, así que se esconden ahí en vez de quedar muertos.
  const _db = s.vista === 'dumbbell';
  // Los selectores dejan de ser "ejes" en la vista de brechas: ahí las dos
  // variables son las dos puntas de la misma barra, sobre una única escala.
  const _lblX = document.querySelector('[data-i18n="c19-x-label"]');
  const _lblY = document.querySelector('[data-i18n="c19-y-label"]');
  if (_lblX) _lblX.textContent = co_T(_db ? 'c19-x-label-db' : 'c19-x-label');
  if (_lblY) _lblY.textContent = co_T(_db ? 'c19-y-label-db' : 'c19-y-label');
  // Y el botón de intercambio deja de hablar de ejes: en brechas cambia cuál de
  // las dos variables va primera y, con eso, el orden de las filas.
  const _swap = document.querySelector('[data-i18n="c19-swap"]');
  if (_swap) {
    _swap.textContent = co_T(_db ? 'c19-swap-db' : 'c19-swap');
    const _btn = _swap.closest('button') || _swap;
    _btn.setAttribute('aria-label', co_T(_db ? 'c19-swap-aria-db' : 'c19-swap-aria'));
  }
  const _refsGrp = document.getElementById('co-refs');
  if (_refsGrp && _refsGrp.closest('.m-ctrl-group')) _refsGrp.closest('.m-ctrl-group').style.display = _db ? 'none' : '';
  const _banner = document.getElementById('co-banner');
  if (_banner) _banner.style.display = _db ? 'none' : '';
  // La pista de la leyenda de regiones habla de algo que en brechas no existe.
  const _legHint = document.querySelector('.co-legend-hint');
  if (_legHint) _legHint.style.display = _db ? 'none' : '';
  // Y los países elegidos no "se etiquetan": son las filas.
  const _pickHint = document.querySelector('[data-i18n="c19-pick-hint"]');
  if (_pickHint) _pickHint.textContent = co_T(_db ? 'c19-pick-hint-db' : 'c19-pick-hint');
  if (_db) { co_drawDumbbell(svg); return; }

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && co_isMobile();
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 26, label: 24, legend: 21, dot: 9, strip: 22 }
    : mobile
    ? { tick: 19, axisTitle: 22, label: 21, legend: 18, dot: 8, strip: 19 }
    : { tick: 11, axisTitle: 12.5, label: 12, legend: 11.5, dot: 5, strip: 11 };

  let W, H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat] || PNG_FORMATS.square;
    W = f.vbW; H = f.vbH; MARGIN = co_getMargins(editorFormat);
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
  // Tira de estadísticos (n · r · R²) DENTRO del SVG: sólo al exportar, porque
  // png-export rasteriza el SVG y el banner HTML no existe en el PNG. En
  // pantalla no se dibuja: el banner de arriba ya los muestra y repetirlos era
  // la duplicación que marcó Daniel. Reserva su renglón en el margen superior.
  // Sin tira de estadísticos en el PNG (decisión de Daniel 2026-07-27: el R²
  // vive solo en el banner HTML de la pantalla, como en los scatters del N°2 y
  // N°3): el margen superior no reserva ese renglón.
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
    co_updateTitle();
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
  // Cada eje en el rango de SU variable (ver co_axisBounds). El área de ploteo
  // sigue siendo cuadrada, así que con rangos distintos la línea de igual valor
  // deja de estar a 45°: por eso ya no se llama "línea de 45°".
  // Rango de la OLA mostrada: es lo que aprovecha el espacio de verdad (con el
  // rango de todas las olas juntas, un par cuyos valores viejos eran altos deja
  // media pantalla vacia). MIENTRAS CORRE EL PLAY se usa el de todas las olas:
  // si el eje cambiara cuadro a cuadro, la animacion no se podria leer.
  const RB = co_axisBounds(s.x, s.y, s.playing ? null : s.wave);
  const rx = RB.x, ry = RB.y;
  const xScale = (v) => plotX + ((v - rx.lo) / (rx.hi - rx.lo)) * side;
  const yScale = (v) => plotY + side - ((v - ry.lo) / (ry.hi - ry.lo)) * side;

  // --- grid + ticks (uno por eje: ya no comparten escala) ---
  const xTicks = co_ticksOf(rx), yTicks = co_ticksOf(ry);
  const gridG = co_ns('g'); svg.appendChild(gridG);
  xTicks.forEach(v => {
    const x = xScale(v);
    const lv = co_ns('line');
    lv.setAttribute('x1', x); lv.setAttribute('x2', x);
    lv.setAttribute('y1', plotY); lv.setAttribute('y2', plotY + side);
    lv.setAttribute('stroke', CO_GRID); lv.setAttribute('stroke-width', 1);
    gridG.appendChild(lv);

    const tx = co_ns('text');
    tx.setAttribute('x', x); tx.setAttribute('y', plotY + side + (bigFmt ? 30 : 16));
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px';
    tx.setAttribute('fill', CO_INK_SOFT);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = ((typeof fmt === 'function') ? fmt(v, rx.dec) : v) + '%';
    gridG.appendChild(tx);
  });
  yTicks.forEach(v => {
    const y = yScale(v);
    const lh = co_ns('line');
    lh.setAttribute('x1', plotX); lh.setAttribute('x2', plotX + side);
    lh.setAttribute('y1', y); lh.setAttribute('y2', y);
    lh.setAttribute('stroke', CO_GRID); lh.setAttribute('stroke-width', 1);
    gridG.appendChild(lh);

    const ty = co_ns('text');
    ty.setAttribute('x', plotX - (bigFmt ? 12 : 8)); ty.setAttribute('y', y);
    ty.setAttribute('text-anchor', 'end');
    ty.setAttribute('dominant-baseline', 'central');
    ty.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    ty.style.fontSize = SIZES.tick + 'px';
    ty.setAttribute('fill', CO_INK_SOFT);
    ty.setAttribute('font-variant-numeric', 'tabular-nums');
    ty.textContent = ((typeof fmt === 'function') ? fmt(v, ry.dec) : v) + '%';
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

  // --- línea de IGUAL VALOR (punteada): y = x. Con los ejes en rangos distintos
  //     ya no es la diagonal del cuadrado, así que se recorta al tramo donde los
  //     dos rangos se superponen. Si no se superponen, no se dibuja. ---
  const eqLo = Math.max(rx.lo, ry.lo), eqHi = Math.min(rx.hi, ry.hi);
  if (co_showDiag() && eqHi > eqLo) {
    const diag = co_ns('line');
    diag.setAttribute('x1', xScale(eqLo)); diag.setAttribute('y1', yScale(eqLo));
    diag.setAttribute('x2', xScale(eqHi)); diag.setAttribute('y2', yScale(eqHi));
    diag.setAttribute('stroke', CO_DIAG);
    diag.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
    diag.setAttribute('stroke-dasharray', bigFmt ? '10 8' : '5 4');
    svg.appendChild(diag);
  }

  // --- recta de ajuste (OLS), recortada al rango dibujado ---
  if (model && co_showFit()) {
    let xa = rx.lo, xb = rx.hi;
    if (model.b !== 0) {
      const xAtLo = (ry.lo - model.a) / model.b;
      const xAtHi = (ry.hi - model.a) / model.b;
      const lo = Math.min(xAtLo, xAtHi), hi = Math.max(xAtLo, xAtHi);
      xa = Math.max(rx.lo, lo); xb = Math.min(rx.hi, hi);
    } else {
      if (model.a < ry.lo || model.a > ry.hi) { xa = 0; xb = -1; }
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
  xTitle.textContent = axisTpl.replace('{VAR}', co_varTituloCap(s.x));
  svg.appendChild(xTitle);

  const ytx = Math.max(bigFmt ? 22 : 14, plotX - (bigFmt ? 80 : 48));
  const yTitle = co_ns('text');
  yTitle.setAttribute('x', ytx); yTitle.setAttribute('y', plotY + side / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  yTitle.style.fontSize = SIZES.axisTitle + 'px';
  yTitle.setAttribute('fill', '#5A5346'); yTitle.setAttribute('font-weight', 600);
  yTitle.setAttribute('transform', `rotate(-90 ${ytx} ${plotY + side / 2})`);
  yTitle.textContent = axisTpl.replace('{VAR}', co_varTituloCap(s.y));
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
    // Hover: tooltip + énfasis del país.
    c.style.cursor = 'pointer';
    const hit = co_ns('circle');
    hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
    hit.setAttribute('r', Math.max(bigFmt ? 22 : 30, r * 2));   // 30 = área de toque canónica
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
    // CLIC = SELECCIONAR, igual que agregarlo desde el buscador (pedido de
    // Daniel 2026-07-26). En pantallas SIN hover el tap es la unica forma de
    // leer el tooltip, asi que ahi el tap sigue siendo tooltip y la seleccion
    // se hace desde el buscador y la cruz del chip.
    const clickH = (e) => {
      if (typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) { enter(e); return; }
      e.stopPropagation();
      co_toggleSelect(p.iso);
    };
    c.addEventListener('click', clickH);
    hit.addEventListener('click', clickH);
    dotsG.appendChild(hit);
  });

  // --- etiquetas ---
  // El grupo se re-dibuja SOLO (co_renderLabels) cuando cambia la región
  // apuntada por el hover: ahí se re-corre la anti-colisión sobre el conjunto
  // ampliado (chips ∪ países de la región).
  const labelsG = co_ns('g'); svg.appendChild(labelsG);
  co_labelCtx = {
    g: labelsG, pts: pts, plotBox: plotBox, SIZES: SIZES, bigFmt: bigFmt,
    xScale: xScale, yScale: yScale,
    // Durante la EXPORTACIÓN el hover se congela: png-export.js setea
    // __atlasPngFormatOverride y vuelve a llamar a __atlasRedraw, así que si el
    // mouse estaba sobre la leyenda el PNG salía con una región revelada y el
    // resto al 16%. Con el editor abierto (preview) el hover SÍ funciona.
    frozen: !!window.__atlasPngFormatOverride
  };
  co_renderLabels();
  co_applyRegionFocus();

  // Tap en zona vacía: cerrar tooltip y sacar el énfasis. (El click en la
  // leyenda no llega acá: co_legendNode hace stopPropagation.)
  svg.onclick = (ev) => {
    if (ev.target.tagName !== 'circle') { co_hideTooltip(); co_emph(null); co_setHoverRegion(null); }
  };

  // Título: lo arman las dos variables elegidas (ver co_updateTitle).
  co_updateTitle();
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

// =================== Etiquetas ===================
// Conjunto de etiquetas = los chips elegidos (selección PERSISTENTE, forced: si
// hay que sacrificar a alguien nunca es un chip) ∪ los países de la región
// apuntada por el hover (TRANSITORIOS: entran si hay lugar y desaparecen al
// salir). La anti-colisión se re-corre DESDE CERO sobre el conjunto nuevo: ése
// es el mecanismo de la feature, no hay layout precalculado ni caché.
function co_renderLabels() {
  const ctx = co_labelCtx;
  if (!ctx || !ctx.g) return;
  while (ctx.g.firstChild) ctx.g.removeChild(ctx.g.firstChild);

  const SIZES = ctx.SIZES, bigFmt = ctx.bigFmt;
  const hover = ctx.frozen ? null : co_hoverRegion();
  const selected = (state[19] && state[19].selected) || [];
  const selSet = {};
  selected.forEach(iso => { selSet[iso] = true; });

  const items = [];
  ctx.pts.forEach(p => {
    const isSel = !!selSet[p.iso];
    const isHover = !isSel && !!hover && p.region === hover;
    if (!isSel && !isHover) return;
    const isHi = p.iso === CO_HIGHLIGHT;
    const fs = isSel ? SIZES.label : SIZES.label * 0.92;
    const weight = isSel ? (isHi ? 700 : 600) : 500;
    const text = co_name(p.iso);
    items.push({
      cx: ctx.xScale(p.x), cy: ctx.yScale(p.y), text: text,
      textW: co_measure(text, fs, weight) + 2,
      iso: p.iso, region: p.region,
      forced: isSel,
      subPriority: isSel ? 0 : (CO_ANCHORS[p.iso] ? 1 : 2),
      transient: !isSel, fs: fs, weight: weight,
      r: (isHi ? SIZES.dot * 1.45 : SIZES.dot)
    });
  });

  const placed = (typeof s_layoutLabels === 'function') ? s_layoutLabels(items, ctx.plotBox) : [];
  if (typeof s_relaxLabels === 'function') {
    // Obstáculos: SOLO los puntos etiquetados (criterio del N°1, recuperado en
    // la auditoría de scatters). Con TODOS los puntos como obstáculo, el label
    // no encuentra hueco en la zona densa y huye lejos de su círculo — eso eran
    // las guías larguísimas que marcó Daniel (2026-07-27).
    const obstacles = items.map(it => ({ x: it.cx, y: it.cy, r: (it.r || SIZES.dot) + 2 }));
    // El alto que ve el relax incluye el HALO del texto (5 px en formatos
    // grandes): sin esto el modelo declara separados dos labels cuyos halos
    // todavia se pisan, y el halo crema BORRA las letras del vecino
    // (el "ArgeBrasil" del PNG que marco Daniel, 2026-07-27).
    s_relaxLabels(placed, SIZES.label + (bigFmt ? 5 : 3), ctx.plotBox, bigFmt ? 220 : 120, obstacles, { edgeAware: true });
  }

  placed.forEach(l => {
    const fs = l.fs || SIZES.label;
    let src = null;
    for (let i = 0; i < items.length; i++) if (items[i].iso === l.iso) { src = items[i]; break; }
    if (src) {
      // Geometría de la guía: s_leaderLine (borde del punto → borde de la caja).
      const guia = (typeof s_leaderLine === 'function')
        ? s_leaderLine(l, { x: src.cx, y: src.cy, r: src.r }, fs, bigFmt ? 10 : 7)
        : null;
      if (guia) {
        const gl = co_ns('line');
        gl.setAttribute('x1', guia.x1); gl.setAttribute('y1', guia.y1);
        gl.setAttribute('x2', guia.x2); gl.setAttribute('y2', guia.y2);
        gl.setAttribute('stroke', '#B8AE9C');
        gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.8);
        gl.setAttribute('stroke-opacity', l.transient ? 0.55 : 0.75);
        gl.setAttribute('data-co', l.iso);
        ctx.g.appendChild(gl);
      }
    }
    const tx = co_ns('text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly);
    tx.setAttribute('text-anchor', l.anchor);
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = fs + 'px';
    tx.setAttribute('font-weight', l.weight || 600);
    tx.setAttribute('fill', l.iso === CO_HIGHLIGHT ? CO_HI_COLOR : co_regionLabelColor(l.region));
    // Peso y opacidad más livianos: se ve que la etiqueta revelada por el hover
    // no es lo mismo que un chip (la selección persistente).
    if (l.transient) tx.setAttribute('fill-opacity', 0.9);
    tx.setAttribute('paint-order', 'stroke');
    tx.setAttribute('stroke', CO_BG);
    tx.setAttribute('stroke-width', bigFmt ? 5 : 3);
    tx.setAttribute('stroke-linejoin', 'round');
    tx.setAttribute('data-co', l.iso);
    tx.textContent = l.text;
    ctx.g.appendChild(tx);
  });
}

// Cambio de región apuntada por el hover. IDEMPOTENTE: si la región no cambió,
// no se toca el DOM (así el mouseenter no parpadea ni entra en loop). Rehace el
// grupo de etiquetas —con la anti-colisión corrida de nuevo— y aplica el foco
// por opacidad. El resto del chart (círculos, ejes, leyenda) queda intacto.
function co_setHoverRegion(reg) {
  if (reg && co_hidden().has(reg)) reg = null;
  if (!state[19]) return;
  if ((state[19].hoverRegion || null) === (reg || null)) return;
  state[19].hoverRegion = reg || null;
  co_renderLabels();
  co_applyRegionFocus();
}

// Foco por REGIÓN: opacidad sobre los círculos ya dibujados + la leyenda. Las
// etiquetas NO se atenúan acá (las rehace co_renderLabels): las de los chips
// son la selección persistente y tienen que verse aunque el hover apunte a otra
// región. El apagado NO pasa por acá: ese cambia el modelo y redibuja.
function co_applyRegionFocus() {
  const svg = document.getElementById('chart19');
  if (!svg) return;
  const reg = (co_labelCtx && co_labelCtx.frozen) ? null : co_hoverRegion();
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

// =================== Tira de estadísticos (sólo PNG) ===================
// png-export rasteriza el SVG: el banner HTML (#co-banner) no existe en la
// imagen. Estos son los mismos números del banner —países · r · R²—, dibujados
// adentro del gráfico SÓLO cuando hay un formato de exportación activo, para
// que no aparezcan dos veces en pantalla.

// =================== Tooltip ===================
// =================== Vista BRECHAS (dumbbell) ===================
// El gráfico 3 del texto: cada fila es un país de la SELECCIÓN (WYSIWYG, los
// chips son las filas), con una punta por variable, ordenado por la brecha
// X − Y. Cuenta "mismo país, dos varas" mejor que la dispersión cuando el
// punto son los países con distancia grande (Brasil declara poco rechazo y ve
// mucho racismo). Colores fijos por EJE (no por región): terracota = eje
// horizontal elegido, azul = eje vertical.
const CO_DB_X = '#BE5D32';
const CO_DB_Y = '#234B85';

function setupCorrelacionesVista() {
  const box = document.getElementById('co-vista');
  if (!box) return;
  const sync = () => {
    box.querySelectorAll('button[data-vista]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-vista') === (state[19].vista || 'scatter'));
    });
  };
  box.querySelectorAll('button[data-vista]').forEach(b => {
    b.addEventListener('click', () => {
      state[19].vista = b.getAttribute('data-vista');
      sync();
      drawCorrelaciones();
    });
  });
  sync();
}

function co_drawDumbbell(svg) {
  const s = state[19];
  // El título, PRIMERO: drawCorrelaciones sale por return antes de llegar al
  // título del camino de la dispersión, y más abajo hay otro return para la
  // selección vacía.
  co_updateTitle();
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && co_isMobile();
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = editorFormat === 'newsletter' || editorFormat === 'square' || editorFormat === 'mobile';
  const SIZES = editorFormat
    ? { tick: 22, name: 24, val: 21, legend: 22, dot: 10 }
    : mobile
    ? { tick: 19, name: 21, val: 18, legend: 19, dot: 8 }
    : { tick: 11, name: 12.5, val: 11, legend: 12, dot: 5.5 };

  // Filas: la selección con las DOS observaciones en la ola, ordenada por la
  // brecha X − Y (los dos extremos del contraste quedan en las puntas).
  const sel = s.selected || [];
  const cruce = (s.wave == null) ? [] : co_cross(s.x, s.y, s.wave);
  const rows = cruce.filter(p => sel.indexOf(p.iso) >= 0)
    .sort((a, b) => (b.x - b.y) - (a.x - a.y));

  const W = 1100;
  const legendH = SIZES.legend * 3.4;
  const rowH = Math.max(bigFmt ? 44 : 26, SIZES.name * 2.1);

  // CANALETA entre la columna de nombres y el área de dibujo. El valor de la
  // punta menor se escribe a la IZQUIERDA de su punto, así que cuando ese valor
  // está cerca del cero la etiqueta se mete en la zona del nombre y lo pisa
  // (reporte de Daniel: Uruguay con su 1, Argentina con su 2,7). No es un
  // problema de anti-colisión: es que no había lugar reservado. Se calcula
  // midiendo el nombre más largo y el valor más ancho, así que no puede fallar
  // con ningún dato. Los valores sólo se dibujan en bigFmt; en pantalla la
  // canaleta vuelve a ser el respiro de siempre.
  let maxNameW = 0, maxValW = 0;
  rows.forEach(p => {
    const w = co_measure(co_name(p.iso), SIZES.name, 600);
    if (w > maxNameW) maxNameW = w;
    [p.x, p.y].forEach(v => {
      const wv = co_measure((typeof fmt === 'function') ? fmt(v, 1) : String(v), SIZES.val, 400);
      if (wv > maxValW) maxValW = wv;
    });
  });
  const canaleta = bigFmt ? Math.ceil(SIZES.dot + 6 + maxValW + 8) : 10;
  const bordeVal = Math.ceil(SIZES.dot + 6 + maxValW + 10);   // idem del lado derecho

  let H, MARGIN;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat] || PNG_FORMATS.square;
    H = f.vbH;
    MARGIN = { top: 30 + legendH, right: Math.max(70, bordeVal), bottom: 78, left: 210 };
  } else {
    MARGIN = { top: 12 + legendH, right: Math.max(mobile ? 54 : 60, bigFmt ? bordeVal : 0), bottom: mobile ? 84 : 62, left: mobile ? 180 : 150 };
    H = MARGIN.top + Math.max(1, rows.length) * rowH + MARGIN.bottom;
  }
  MARGIN.left = Math.min(Math.round(W * 0.42), Math.max(MARGIN.left, Math.ceil(maxNameW) + canaleta));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  if (!rows.length) {
    const tx = co_ns('text');
    tx.setAttribute('x', W / 2); tx.setAttribute('y', H / 2);
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = (SIZES.name + 2) + 'px'; tx.setAttribute('fill', CO_INK_SOFT);
    tx.textContent = co_T('c19-db-empty');
    svg.appendChild(tx);
    return;
  }

  const plotW = W - MARGIN.left - MARGIN.right;
  const innerH = editorFormat ? (H - MARGIN.top - MARGIN.bottom) : rows.length * rowH;
  const rH = innerH / rows.length;

  // Escala compartida por las dos variables: la brecha se lee en la MISMA vara.
  const vals = [];
  rows.forEach(p => { vals.push(p.x); vals.push(p.y); });
  const R = co_niceRange(vals);
  const xScale = (v) => MARGIN.left + ((v - R.lo) / (R.hi - R.lo)) * plotW;

  // grid + ticks
  const gridG = co_ns('g'); svg.appendChild(gridG);
  co_ticksOf(R).forEach(v => {
    const x = xScale(v);
    const ln = co_ns('line');
    ln.setAttribute('x1', x); ln.setAttribute('x2', x);
    ln.setAttribute('y1', MARGIN.top); ln.setAttribute('y2', MARGIN.top + innerH);
    ln.setAttribute('stroke', CO_GRID); ln.setAttribute('stroke-width', 1);
    gridG.appendChild(ln);
    const tx = co_ns('text');
    tx.setAttribute('x', x); tx.setAttribute('y', MARGIN.top + innerH + (bigFmt ? 30 : 17));
    tx.setAttribute('text-anchor', 'middle');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.tick + 'px'; tx.setAttribute('fill', CO_INK_SOFT);
    tx.setAttribute('font-variant-numeric', 'tabular-nums');
    tx.textContent = ((typeof fmt === 'function') ? fmt(v, R.dec) : v) + '%';
    gridG.appendChild(tx);
  });

  // leyenda: qué es cada punta (los nombres largos van en dos renglones)
  const legG = co_ns('g'); svg.appendChild(legG);
  [[CO_DB_X, co_varTituloCap(s.x)], [CO_DB_Y, co_varTituloCap(s.y)]].forEach((par, i) => {
    const y = (bigFmt ? 16 : 10) + i * SIZES.legend * 1.5;
    const c = co_ns('circle');
    c.setAttribute('cx', MARGIN.left + SIZES.dot); c.setAttribute('cy', y);
    c.setAttribute('r', SIZES.dot * 0.85); c.setAttribute('fill', par[0]);
    legG.appendChild(c);
    const tx = co_ns('text');
    tx.setAttribute('x', MARGIN.left + SIZES.dot * 2 + 6); tx.setAttribute('y', y);
    tx.setAttribute('dominant-baseline', 'central');
    tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    tx.style.fontSize = SIZES.legend + 'px'; tx.setAttribute('fill', CO_INK);
    tx.setAttribute('font-weight', 600);
    tx.textContent = par[1];
    legG.appendChild(tx);
  });

  // filas
  const rowsG = co_ns('g'); svg.appendChild(rowsG);
  rows.forEach((p, i) => {
    const cy = MARGIN.top + i * rH + rH / 2;
    const x1 = xScale(p.x), x2 = xScale(p.y);
    const name = co_ns('text');
    name.setAttribute('x', MARGIN.left - canaleta); name.setAttribute('y', cy);
    name.setAttribute('text-anchor', 'end'); name.setAttribute('dominant-baseline', 'central');
    name.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    name.style.fontSize = SIZES.name + 'px'; name.setAttribute('font-weight', 600);
    name.setAttribute('fill', CO_INK);
    name.textContent = co_name(p.iso);
    rowsG.appendChild(name);

    const ln = co_ns('line');
    ln.setAttribute('x1', x1); ln.setAttribute('x2', x2);
    ln.setAttribute('y1', cy); ln.setAttribute('y2', cy);
    ln.setAttribute('stroke', '#B8AE9C'); ln.setAttribute('stroke-width', bigFmt ? 3 : 2);
    rowsG.appendChild(ln);

    [[x1, CO_DB_X, p.x], [x2, CO_DB_Y, p.y]].forEach(par => {
      const c = co_ns('circle');
      c.setAttribute('cx', par[0]); c.setAttribute('cy', cy);
      c.setAttribute('r', SIZES.dot); c.setAttribute('fill', par[1]);
      c.setAttribute('stroke', CO_BG); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2);
      rowsG.appendChild(c);
    });

    // valores en las puntas SOLO en PNG/mobile (en pantalla los da el tooltip);
    // el de la punta menor va a la izquierda y el de la mayor a la derecha,
    // para que no se pisen entre sí cuando la brecha es corta.
    if (bigFmt) {
      const menor = (p.x <= p.y) ? [x1, p.x] : [x2, p.y];
      const mayor = (p.x <= p.y) ? [x2, p.y] : [x1, p.x];
      [[menor, 'end', -1], [mayor, 'start', 1]].forEach(spec => {
        const tx = co_ns('text');
        tx.setAttribute('x', spec[0][0] + spec[2] * (SIZES.dot + 6));
        tx.setAttribute('y', cy);
        tx.setAttribute('text-anchor', spec[1]); tx.setAttribute('dominant-baseline', 'central');
        tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
        tx.style.fontSize = SIZES.val + 'px'; tx.setAttribute('fill', CO_INK_SOFT);
        tx.setAttribute('font-variant-numeric', 'tabular-nums');
        tx.textContent = (typeof fmt === 'function') ? fmt(spec[0][1], 1) : spec[0][1];
        rowsG.appendChild(tx);
      });
    }

    if (!isPngFormat) {
      const hit = co_ns('rect');
      hit.setAttribute('x', 0); hit.setAttribute('y', MARGIN.top + i * rH);
      hit.setAttribute('width', W); hit.setAttribute('height', rH);
      hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', (e) => co_showTooltip(e, p));
      hit.addEventListener('mousemove', (e) => co_posTooltip(e));
      hit.addEventListener('mouseleave', () => co_hideTooltip());
      rowsG.appendChild(hit);
    }
  });

  // Sin línea vertical en el cero: no hay nada apoyado en ella —las barras
  // flotan— así que era un trazo más y no una referencia (pedido de Daniel
  // 2026-07-30). La grilla ya marca dónde está el cero.

  // Título del eje: acá las dos variables comparten la misma vara, así que no
  // puede nombrar una sola; dice la UNIDAD, que es lo que faltaba (quién es
  // cada punta lo dice la leyenda, con la medición completa).
  const axTitle = co_ns('text');
  axTitle.setAttribute('x', MARGIN.left + plotW / 2);
  axTitle.setAttribute('y', MARGIN.top + innerH + (bigFmt ? 62 : 36));
  axTitle.setAttribute('text-anchor', 'middle');
  axTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  axTitle.style.fontSize = (SIZES.tick + (bigFmt ? 3 : 1)) + 'px';
  axTitle.setAttribute('fill', CO_INK_SOFT);
  axTitle.setAttribute('font-weight', 500);
  axTitle.textContent = co_T('c19-db-axis');
  svg.appendChild(axTitle);

}

function co_showTooltip(e, p) {
  const tt = document.getElementById('tooltip19');
  if (!tt) return;
  const s = state[19];
  const regLabel = p.region ? co_T('reg.' + p.region) : '';
  // Variante aclarada: este texto va DENTRO del tooltip oscuro (los colores de
  // región calibrados para crema quedan bajo 4.5:1 sobre var(--ink)).
  const regColor = (typeof REGION_COLORS_ON_DARK !== 'undefined' && REGION_COLORS_ON_DARK[p.region]) || '#C9C2B2';
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

// Toggles de las dos referencias (igual valor / recta de ajuste). Son
// independientes entre sí, como los del ranking del graficador.
function setupCorrelacionesRefs() {
  const box = document.getElementById('co-refs');
  if (!box) return;
  const sync = () => {
    box.querySelectorAll('button[data-ref]').forEach(b => {
      const on = (b.getAttribute('data-ref') === 'diag') ? co_showDiag() : co_showFit();
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  box.querySelectorAll('button[data-ref]').forEach(b => {
    b.addEventListener('click', () => {
      const k = (b.getAttribute('data-ref') === 'diag') ? 'showDiag' : 'showFit';
      state[19][k] = !(state[19][k] !== false);
      sync();
      drawCorrelaciones();
    });
  });
  sync();
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
      if (state[19].playing) { co_stopPlay(); drawCorrelaciones(); return; }
      const ws = co_waves(state[19].x, state[19].y);
      if (ws.length < 2) return;
      if (ws.indexOf(state[19].wave) === ws.length - 1) {
        state[19].wave = ws[0];
        renderCorrelacionesChips();
        drawCorrelaciones();
      }
      state[19].playing = true;
      drawCorrelaciones();   // el rango del eje pasa al de todas las olas
      btn.classList.add('playing');
      btn.setAttribute('aria-label', co_T('c19-pause'));
      co_stopPlay._timer = setInterval(() => {
        const list = co_waves(state[19].x, state[19].y);
        const i = list.indexOf(state[19].wave);
        if (i < 0 || i >= list.length - 1) { co_stopPlay(); drawCorrelaciones(); return; }
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
      csv += 'iso3,pais,region,ola,x_var,x_label_en,x_pct,x_anio,x_n,y_var,y_label_en,y_pct,y_anio,y_n\n';
      // Etiquetas legibles al lado del codigo: un lector que abre el archivo no
      // tiene por que saber que C002 es la prioridad laboral a los nativos.
      const xLabQ = '"' + ((vx && vx.en) || s.x) + '"';
      const yLabQ = '"' + ((vy && vy.en) || s.y) + '"';
      const pts = (s.wave == null) ? [] : co_cross(s.x, s.y, s.wave);
      pts.slice().sort((a, b) => a.iso.localeCompare(b.iso)).forEach(p => {
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[p.iso])
          ? (COUNTRY_NAMES[p.iso].en || p.iso) : p.iso;
        const nmQ = (nm.indexOf(',') >= 0) ? '"' + nm + '"' : nm;
        csv += [p.iso, nmQ, p.region, s.wave, s.x, xLabQ, p.x, p.yearX, p.nX, s.y, yLabQ, p.y, p.yearY, p.nY].join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (co_lang() === 'en')
        ? 'the-atlas-04-value-cross.csv'
        : 'el-atlas-04-cruce-valores.csv';
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
  if (s.hoverRegion === undefined) s.hoverRegion = null;
  if (s.showDiag === undefined) s.showDiag = true;
  if (s.showFit === undefined) s.showFit = true;
  if (s.vista !== 'scatter' && s.vista !== 'dumbbell') s.vista = CO_DEFAULT_VISTA;
  s.playing = false;
  const ws = co_waves(s.x, s.y);
  if (ws.indexOf(s.wave) < 0) s.wave = ws.length ? ws[ws.length - 1] : null;

  co_buildSelects();
  setupCorrelacionesSelects();
  setupCorrelacionesRefs();
  setupCorrelacionesVista();
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
      if (svg && !svg.contains(ev.target)) { co_hideTooltip(); co_emph(null); co_setHoverRegion(null); }
    });
  }

  // El PNG rasteriza el SVG: apagamos tooltip y énfasis antes de exportar.
  // (El render ya ignora el hover mientras dura la exportación —
  // co_labelCtx.frozen —; esto además deja limpio el estado de pantalla.)
  window.onBeforePngExport = function (svgClone, chartId) {
    if (String(chartId) !== '19') return;
    co_hideTooltip();
    co_emph(null);
    if (state[19]) state[19].hoverRegion = null;
    co_applyRegionFocus();
  };
  // Nota "Datos" corta del PNG, con los dos ejes, la ola y los estadísticos
  // que en pantalla viven en el banner (el PNG no rasteriza HTML).
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '19') return null;
    // Con un eje de afuera, la plantilla que habla de "la misma encuesta y la
    // misma persona" sería falsa: hay una alternativa para ese caso.
    // En brechas no hay dos ejes ni ajuste: la nota de la dispersión hablaría
    // de un eje X, un eje Y y un n que ahí no significan nada.
    const db = s.vista === 'dumbbell';
    const tplKey = db ? 'c19-sources-png-db'
      : (co_ejeExterno() ? 'c19-sources-tpl-ext' : 'c19-sources-tpl');
    let tpl = co_T(tplKey);
    if (tpl === tplKey) tpl = co_T('c19-sources-tpl');
    if (!tpl) return null;
    return tpl.replace('{PERIODO}', co_waveLabel(s.wave));
  };
}

// Relee los textos que dependen del idioma (los llama el toggle ES/EN).
function co_onLangChange() {
  co_buildSelects();
  renderCorrelacionesChips();
  drawCorrelaciones();
}
