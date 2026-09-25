// Utils compartidos por los charts del N°2 (formato de números, ticks).
// Replicados del N°1; cuando aparezca un tercer número que los use, conviene
// promoverlos a lib/utils.js para tener una sola copia.
// Depende de LANG (definido en i18n-issue.js, cargado antes).

// Detección de dispositivo con hover (desktop con mouse) vs solo touch (mobile).
// En mobile el hover no funciona bien — los handlers mouseenter/mouseleave
// quedan pegados después del tap. Cuando HAS_HOVER es false, los charts
// adaptan la interacción a tap-toggle en lugar de hover persistente.
const HAS_HOVER = window.matchMedia('(hover: hover)').matches;

// Detección de viewport mobile (≤768px de ancho). Usado para alternar
// dimensiones de SVG entre layout horizontal (desktop) y portrait-ish
// (mobile) que ocupa más del viewport.
//
// IMPORTANTE: cuando el editor está activo con un formato seleccionado,
// el chart adopta el viewBox del formato y este flag se IGNORA — el
// editor controla todo. Sin editor activo, el chart sigue su layout
// responsive normal (mobile portrait alto vs desktop landscape).
//
// Evaluado dinámicamente en cada render para que cambios de orientación o
// resize disparen el layout correcto.
function isMobileViewport() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// =============================================================
// PNG_FORMATS — viewBoxes y canvas sizes por formato del editor
// =============================================================
// Una sola fuente de verdad: lo que el usuario ve en pantalla cuando elige
// un formato (newsletter / square / mobile / public) es exactamente lo que
// el PNG export rasteriza. El SVG en pantalla adopta el aspect ratio del
// formato (via .ae-format-wrapper + --ae-aspect) y los charts dibujan con
// el viewBox correspondiente. PNG export clona el SVG actual y lo rasteriza
// a nominalW × nominalH — sin re-render forzado.
//
// vbW/vbH: dimensiones del viewBox del SVG en pantalla (también del clone
//   rasterizado). Mantenemos vbW=1100 para que las constantes de cada
//   chart (tablas, anclas, padding) sigan compatibles; varía vbH según
//   el ratio del formato.
// nominalW/nominalH: tamaño del canvas final del PNG. Es lo que se ve en
//   el filename "1000×1100" y lo que pide la newsletter / red social.
//
// Ratios:
//   public:     16:9  = 1.78   landscape
//   newsletter: 10:11 = 0.91   cuadrado-ish leve portrait
//   square:     1:1   = 1.00   cuadrado puro
//   mobile:      2:3  = 0.67   portrait alto (Stories / WhatsApp)
const PNG_FORMATS = {
  public:     { vbW: 1100, vbH: 619,  nominalW: 1600, nominalH: 900  },
  newsletter: { vbW: 1100, vbH: 1210, nominalW: 1000, nominalH: 1100 },
  square:     { vbW: 1100, vbH: 1100, nominalW: 1200, nominalH: 1200 },
  mobile:     { vbW: 1100, vbH: 1650, nominalW: 800,  nominalH: 1200 }
};

// Devuelve el formato activo del editor o null si:
//   - el editor no está montado,
//   - el editor está montado pero el sidebar nunca se abrió (la pestaña
//     lateral no aparece) Y no hay localStorage previo,
//   - de otra forma el chart se ve igual que la versión pública sin editor.
//
// Cuando devuelve un format → el chart usa PNG_FORMATS[format] para viewBox
// y getMargins(format) para margins (ignora isMobileViewport).
// Cuando devuelve null → el chart usa sus dimensiones default (desktop o
// mobile responsive según isMobileViewport).
function getActivePngFormat() {
  // Override del exportador PNG: cuando png-export.js va a generar la imagen
  // sin editor activo, fuerza un formato (por default 'square' mobile-first)
  // seteando window.__atlasPngFormatOverride. Tiene prioridad sobre todo:
  // permite "default cuadrado al clic" sin tocar el estado del editor.
  if (window.__atlasPngFormatOverride && PNG_FORMATS[window.__atlasPngFormatOverride]) {
    return window.__atlasPngFormatOverride;
  }
  if (!window.AtlasEditor || typeof window.AtlasEditor.getConfig !== 'function') {
    return null;
  }
  const cfg = window.AtlasEditor.getConfig();
  if (!cfg || !cfg.format) return null;
  // El editor está activo SOLO si el body tiene la clase ae-ever-activated
  // (se setea al abrir el panel por primera vez, o al detectar localStorage
  // previo en init). Sin esa marca, el chart se ve idéntico a la versión
  // pública aunque el editor.js esté cargado.
  if (!document.body.classList.contains('ae-ever-activated')) return null;
  return PNG_FORMATS[cfg.format] ? cfg.format : null;
}

// Aplica el wrapper CSS .ae-format-wrapper al .chart-svg-wrap del chart
// activo, seteando --ae-aspect al ratio del formato. Si format=null,
// quita la clase y restaura el comportamiento default.
//
// Esto hace que el SVG en pantalla se vea con el aspect ratio del formato
// (sin distorsionar — preserveAspectRatio en el SVG se encarga del fit),
// permitiendo WYSIWYG: lo que ves es lo que se rasteriza al PNG.
function applyFormatWrapper(svgEl, format) {
  if (!svgEl) return;
  const wrap = svgEl.closest('.chart-svg-wrap');
  if (!wrap) return;
  if (format && PNG_FORMATS[format]) {
    const f = PNG_FORMATS[format];
    // El aspecto es el del viewBox que el chart ACABA de fijar (en el N°5 el
    // alto se adapta al hueco que dejan titulo, subtitulo y nota del PNG, y el
    // zoom del editor achica el viewBox): con el del formato nominal, en
    // pantalla quedaban franjas vacias arriba y abajo del grafico.
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    const aspect = (vb && vb.width && vb.height) ? vb.width / vb.height : f.vbW / f.vbH;
    wrap.classList.add('ae-format-wrapper');
    wrap.style.setProperty('--ae-aspect', aspect.toFixed(4));
  } else {
    wrap.classList.remove('ae-format-wrapper');
    wrap.style.removeProperty('--ae-aspect');
  }
}

// Wire a resize listener that re-draws the 3 charts on viewport-class
// changes (cross 768px boundary). Throttle vía requestAnimationFrame para
// no martillar el render durante el drag de resize.
let _lastIsMobile = isMobileViewport();
let _resizeRaf = null;
window.addEventListener('resize', () => {
  if (_resizeRaf) return;
  _resizeRaf = requestAnimationFrame(() => {
    _resizeRaf = null;
    const nowMobile = isMobileViewport();
    if (nowMobile === _lastIsMobile) return;
    _lastIsMobile = nowMobile;
    // Llamamos a los draws si existen. Cada chart sólo redibuja si su SVG
    // está presente en el DOM (chart-N.html standalone trae solo uno).
    if (typeof drawMarimekko === 'function' && document.getElementById('chart1')) drawMarimekko();
    if (typeof drawScatter   === 'function' && document.getElementById('chart2')) drawScatter();
    if (typeof drawDeciles   === 'function' && document.getElementById('chart3')) drawDeciles();
  });
});

const fmt = (n, dec=0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const locale = LANG === 'es' ? 'es-AR' : 'en-US';
  return n.toLocaleString(locale, {minimumFractionDigits: dec, maximumFractionDigits: dec});
};

const fmtSmart = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const locale = LANG === 'es' ? 'es-AR' : 'en-US';
  if (Math.abs(n) >= 100) return n.toLocaleString(locale, {maximumFractionDigits: 0});
  return n.toLocaleString(locale, {maximumFractionDigits: 1});
};

function niceLog10Ticks(min, max) {
  const ticks = [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  for (let p = lo; p <= hi; p++) {
    const base = Math.pow(10, p);
    [1, 2, 5].forEach(m => {
      const v = m * base;
      if (v >= min * 0.95 && v <= max * 1.05) ticks.push(v);
    });
  }
  return ticks;
}

function niceLinearTicks(min, max, target=6) {
  const range = max - min;
  if (range <= 0) return [];
  const rough = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step;
  if (norm < 1.5) step = pow;
  else if (norm < 3) step = 2 * pow;
  else if (norm < 7) step = 5 * pow;
  else step = 10 * pow;
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

function fmtTickGDP(v) {
  if (v >= 1000) {
    const n = v / 1000;
    // Sin decimal cuando es entero ($1k, $10k, $100k); decimal solo si lo
    // necesita ($1.5k para ticks intermedios poco habituales).
    return '$' + (Number.isInteger(n) ? n : n.toFixed(1)) + 'k';
  }
  return '$' + v;
}

// ============================================================
// Mobile UX: botones "tuerca" (.m-controls-trigger) y "Seleccionar"
// (.m-search-trigger) que pliegan/despliegan los toggles y el buscador
// dentro del mismo .chart-block. Estilo OWID: en ≤ 768px ocupan menos
// chrome arriba del SVG. En desktop los botones están display:none vía
// CSS, así que esta función no tiene efecto visible ahí.
//
// Scope: cada botón opera SOLO sobre los nodos de su propio .chart-block
// (vía closest()), así en el index.html con los 3 charts juntos no se
// pisan entre sí. Singleton: registramos los listeners una sola vez aun
// si esta función se invoca desde múltiples init*().
// ============================================================
function setupMobileControlToggles() {
  if (setupMobileControlToggles._done) return;
  setupMobileControlToggles._done = true;

  document.querySelectorAll('.m-controls-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.chart-block');
      const panel = block && block.querySelector('.m-controls-panel');
      if (panel) panel.classList.toggle('open');
    });
  });
  document.querySelectorAll('.m-search-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.chart-block');
      const wrap = block && block.querySelector('.m-search-wrap');
      if (!wrap) return;
      wrap.classList.toggle('open');
      const input = wrap.querySelector('input');
      if (input && wrap.classList.contains('open')) {
        // focus diferido para que el teclado mobile aparezca después
        // del repaint, evitando jumps de layout.
        setTimeout(() => input.focus(), 0);
      }
    });
  });
}


// ===== Editor manual (?nl=1) — pasada central portada de lib/utils.js =====
// Aplica titulo/subtitulo/caption custom del editor al DOM. Sin esto, editar
// con ?nl=1 no se ve ni en pantalla ni en el PNG (png-export lee el DOM).
function atlasApplyEditorTexts() {
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  if (!ae) return;
  const lang = ae.lang || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae.texts && ae.texts[lang]) || {};
  const dict = (typeof I18N !== 'undefined' && I18N[lang]) || {};
  const apply = (el, custom) => {
    const c = (custom || '').trim();
    if (c) el.textContent = c;
    else if (el.dataset.i18n && dict[el.dataset.i18n]) el.innerHTML = dict[el.dataset.i18n];
  };
  document.querySelectorAll('.chart-title').forEach(el => apply(el, tx.title));
  document.querySelectorAll('.chart-subtitle').forEach(el => apply(el, tx.subtitle));
  document.querySelectorAll('.footer p[data-i18n$="sources"]').forEach(el => apply(el, tx.caption));
}
window.addEventListener('atlas-editor-change', atlasApplyEditorTexts);
window.addEventListener('load', () => setTimeout(atlasApplyEditorTexts, 0));
// el toggle de idioma re-aplica el i18n y pisaria el custom: envolvemos applyI18n
if (typeof applyI18n === 'function') {
  const _applyI18n_orig = applyI18n;
  applyI18n = function () { _applyI18n_orig(); try { atlasApplyEditorTexts(); } catch (e) {} };
}


// ===== Perillas de tamaño del editor (?nl=1) — portado de lib/utils.js =====
// atlasEditorSize(aeSizes, clave, preset): el slider del editor pisa el preset
// del formato SOLO si el lector lo movio (config.sizesTouched); si no, manda el
// preset. Publica el tamaño realmente usado para que el panel muestre ese
// numero (si no, la perilla "parece rota": marca 11 con el grafico en 22).
function atlasEditorSize(aeSizes, clave, preset) {
  let out = preset;
  if (aeSizes && typeof aeSizes[clave] === 'number') {
    const cfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
      ? window.AtlasEditor.getConfig() : null;
    const tocado = !!(cfg && cfg.sizesTouched && cfg.sizesTouched[clave]);
    if (tocado) out = aeSizes[clave];
  }
  if (!window.__atlasEffectiveSizes) window.__atlasEffectiveSizes = {};
  window.__atlasEffectiveSizes[clave] = out;
  return out;
}
// Los tamaños guardados por el editor (null sin editor: la version publica).
function atlasEditorSizes() {
  const cfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  return cfg ? cfg.sizes : null;
}
// Zoom del CONTENIDO del grafico (perilla "Gráfico" del editor, en %). Los
// charts SVG lo aplican dibujando en un viewBox 1/k mas chico: el recuadro del
// PNG no cambia, pero todo lo de adentro (marcas, etiquetas, ejes, margenes)
// sale k veces mas grande. Las tablas multiplican sus medidas por k. 1 = sin
// tocar (siempre, sin editor).
function atlasEditorZoom() {
  const pct = atlasEditorSize(atlasEditorSizes(), 'chart', 100);
  return Math.max(0.5, Math.min(1.6, (+pct || 100) / 100));
}


// ===== Caption minimalista en el PNG (regla editorial) =====
// El PNG usa la clave cN-png-note (una linea) en vez de la nota completa de la
// pagina. Si el editor (?nl=1) tiene un caption custom, ese manda y no pisamos.
window.onBeforePngExportGetSourceText = function (chartId) {
  try {
    const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
    const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
    const tx = (ae && ae.texts && ae.texts[lang]) || {};
    if ((tx.caption || '').trim()) return null;
    const key = 'c' + chartId + '-png-note';
    const short = (typeof t === 'function') ? t(key) : key;
    return short !== key ? short : null;
  } catch (e) { return null; }
};


// ==== Tooltips (portado de lib/utils.js, 2026-09-09) ====
// (a) tap-afuera cierra todo .tooltip (en touch no hay mouseleave); el propio
// dato lo reabre via los eventos sinteticos del tap.
document.addEventListener('touchstart', function () {
  document.querySelectorAll('.tooltip').forEach(function (t) { t.style.opacity = '0'; t.style.display = 'none'; });
}, { capture: true, passive: true });
// (b) clamp al viewport via MutationObserver sobre style (igual que lib).
(function () {
  var PAD = 6;
  function clampOne(tt) {
    if (!tt || tt.style.display === 'none') return;
    var r = tt.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var l = parseFloat(tt.style.left) || 0, t = parseFloat(tt.style.top) || 0, nl = l, nt = t;
    if (r.right > window.innerWidth - PAD) nl = l - (r.right - (window.innerWidth - PAD));
    if (r.left + (nl - l) < PAD) nl = l + (PAD - r.left);
    if (r.bottom > window.innerHeight - PAD) nt = t - (r.bottom - (window.innerHeight - PAD));
    if (r.top + (nt - t) < PAD) nt = t + (PAD - r.top);
    if (Math.abs(nl - l) > 0.5) tt.style.left = nl + 'px';
    if (Math.abs(nt - t) > 0.5) tt.style.top = nt + 'px';
  }
  function wire() {
    document.querySelectorAll('.tooltip').forEach(function (tt) {
      if (tt.__atlasClamp) return;
      var obs = new MutationObserver(function () { clampOne(tt); });
      obs.observe(tt, { attributes: true, attributeFilter: ['style'] });
      tt.__atlasClamp = obs;
    });
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);
})();

// Boton "Limpiar" universal (criterio 11e de la casa, portado de lib/utils.js):
// toda lista de chips multi-select con id *-selected-chips gana un boton que
// clickea todas las cruces. Aparece con 2+ chips.
function atlasWireClearButtons() {
  const wire = (cont) => {
    if (!cont || cont.__atlasClearWired) return;
    cont.__atlasClearWired = true;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'atlas-clear-btn';
    btn.addEventListener('click', () => {
      Array.from(cont.querySelectorAll('.m-chip-x, .ts-chip-x')).forEach(x => x.click());
    });
    cont.insertAdjacentElement('afterend', btn);
    const sync = () => {
      const n = cont.querySelectorAll('.m-chip-x, .ts-chip-x').length;
      btn.textContent = (typeof LANG !== 'undefined' && LANG === 'en') ? 'Clear' : 'Limpiar';
      btn.style.display = n >= 2 ? '' : 'none';
    };
    new MutationObserver(sync).observe(cont, { childList: true, subtree: true });
    sync();
  };
  document.querySelectorAll('[id*="-selected-chips"]').forEach(wire);
}
window.addEventListener('load', () => setTimeout(atlasWireClearButtons, 0));


// ===== Vista compartible (criterio de la casa, N°4 y backport a N°1-3) =====
// La barra de direcciones refleja el estado del chart, asi el lector copia el
// link y comparte exactamente lo que esta mirando. Regla TODO-O-NADA: la vista
// de fabrica viaja como URL LIMPIA (nunca se escribe el default, para que los
// cambios editoriales posteriores le lleguen a quien ya tiene el link) y
// cualquier desvio escribe el estado completo. Copia local de lib/utils.js.
function atlasSyncUrl(params) {
  try {
    const u = new URL(location.href);
    Object.keys(params).forEach(k => {
      const v = params[k];
      if (v === null || v === undefined || v === '') u.searchParams.delete(k);
      else u.searchParams.set(k, String(v));
    });
    const q = u.searchParams.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + u.hash);
  } catch (_) { /* URL invalida o history bloqueado: el chart sigue andando */ }
}
function atlasUrlParam(k) {
  try { return new URLSearchParams(location.search).get(k); } catch (_) { return null; }
}
// Slug estable para meter nombres en la URL ("Arte y espectáculo" ->
// "arte-y-espectaculo"). Se compara SIEMPRE por slug, nunca por indice: un
// rebuild del dataset puede reordenar las ocupaciones y romper los links.
function atlasSlug(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// Indice del primer elemento de `lista` cuyo slug (de cualquiera de sus campos
// es/en) coincide con `valor`. -1 si no hay match (parametro invalido: se ignora).
// Los datasets no escriben igual el mismo rubro ("Deporte" en data-top,
// "Deportes" en el cubo del mapa), asi que la comparacion ignora las eses
// finales de cada palabra. Sin esto, un link de un chart no abre en otro.
function atlasSinPlural(slug) {
  return String(slug).split('-').map(w => w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w).join('-');
}
function atlasIdxPorSlug(lista, valor, campos) {
  if (!valor) return -1;
  const v = atlasSinPlural(atlasSlug(valor));
  const cs = campos || ['es', 'en'];
  for (let i = 0; i < lista.length; i++) {
    for (let c = 0; c < cs.length; c++) {
      if (lista[i] && atlasSinPlural(atlasSlug(lista[i][cs[c]])) === v) return i;
    }
  }
  return -1;
}
