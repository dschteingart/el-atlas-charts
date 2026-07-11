// Utils compartidos por scatter.js y timeseries.js (formato de números, ticks).
// Específicos del N°1; eventualmente migrarán a lib/utils.js.
// Depende de LANG (definido en i18n-issue.js, cargado antes).

// Detección de dispositivo con hover (desktop con mouse) vs solo touch (mobile).
// En mobile el hover no funciona bien — los handlers mouseenter/mouseleave
// quedan pegados después del tap. Cuando HAS_HOVER es false, los charts
// adaptan la interacción a tap-toggle en lugar de hover persistente.
const HAS_HOVER = window.matchMedia('(hover: hover)').matches;

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

//==================================================================
//  FORMATOS DE EXPORT PNG (mobile-first)
//==================================================================
// El N°1 no tiene editor de formatos: el interactivo se renderiza apaisado
// (viewBox chico, fuentes de la clase CSS) y SOLO al exportar el PNG se fuerza
// el formato `square` (1:1, mobile-first) vía window.__atlasPngFormatOverride.
// Cada chart-N.html prende window.__atlasDefaultPngFormat = 'square' (o lo deja
// y png-export usa 'square' por defecto). Clonado de la maquinaria del N°2/N°3.
//
//   vbW/vbH   = dimensiones del viewBox del SVG en ese formato (el gráfico).
//   nominalW/H = tamaño del canvas PNG final (el lienzo completo con chrome).
const PNG_FORMATS = {
  square: { vbW: 1100, vbH: 760, nominalW: 1200, nominalH: 1200 }
};

// Devuelve la key del formato activo, o null si estamos en el interactivo.
// png-export.js setea __atlasPngFormatOverride justo antes de rasterizar y lo
// limpia después; el renderer (scatter.js / timeseries.js) consulta esto para
// decidir si dibuja en grande.
function getActivePngFormat() {
  const ov = window.__atlasPngFormatOverride;
  if (ov && PNG_FORMATS[ov]) return ov;
  return null;
}

// Modo móvil (COPIA de lib/utils.js — el N°1 usa su stack local). En el celu
// el scatter/timeseries dibujan sobredimensionados (mismas dimensiones que el
// PNG cuadrado pero como vista interactiva); en desktop, apaisado chico.
function isMobileViewport() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// Re-dibuja al cambiar la CLASE de viewport (rotar el celu, redimensionar, o
// primer-render-malo antes de que se aplique el meta viewport). Sin esto, un
// chart que carga en desktop y se mira en mobile queda con fuentes desktop =
// ~⅓, ilegible. Mismo mecanismo que lib/utils.js (bug 2026-07-11).
let _n1LastMobile = isMobileViewport();
let _n1ResizeRaf = null;
function n1ResponsiveRedraw() {
  const nowMobile = isMobileViewport();
  if (nowMobile === _n1LastMobile) return;
  _n1LastMobile = nowMobile;
  if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
}
window.addEventListener('resize', () => {
  if (_n1ResizeRaf) return;
  _n1ResizeRaf = requestAnimationFrame(() => { _n1ResizeRaf = null; n1ResponsiveRedraw(); });
});
window.addEventListener('orientationchange', n1ResponsiveRedraw);
window.addEventListener('load', () => setTimeout(() => {
  _n1LastMobile = isMobileViewport();
  if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
}, 80));

// Botón "Limpiar" universal (regla de selección, criterio 11e) — COPIA de
// lib/utils.js (el N°1 todavía usa su stack local; se des-duplica cuando
// pase a lib/). Limpiar = clickear todas las ✕ del contenedor.
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

// Aplica los textos CUSTOM del editor (?nl=1) al DOM — COPIA de lib/utils.js
// (el N°1 todavía usa su stack local; se des-duplica cuando pase a lib/).
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
