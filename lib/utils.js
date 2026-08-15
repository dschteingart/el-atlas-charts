// Utils COMPARTIDOS de El Atlas (lib/) — N°2, N°3 y especial. Fase 2 (2026-07).
// Contiene: fmt/ticks, HAS_HOVER, PNG_FORMATS, atlasSetHeading (títulos
// dinámicos), atlasApplyEditorTexts (textos custom del editor) y touch utils.
// Depende de LANG (definido en i18n-issue.js, cargado antes).

// Título/subtítulo dinámicos: insight editorial en el estado por DEFAULT;
// versión NEUTRAL apenas el usuario cambia algo en el interactivo. El PNG
// hereda el texto del DOM, así que el export por default (estado default)
// mantiene el insight, y si el usuario customiza y exporta, sale neutral.
//   keys = { title, titleNeutral, subtitle?, subtitleNeutral? }
// Si subtitle/subtitleNeutral faltan, NO toca el subtítulo (ej. chart 2, que
// tiene subtítulo descriptivo propio que se actualiza aparte).
// Respeta el título/subtítulo CUSTOM del editor (?nl) si está seteado.
function atlasSetHeading(chartId, isDefault, keys) {
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  const tt = (k) => (typeof t === 'function' && k) ? t(k) : (k || '');
  const block = document.querySelector('.chart-block[data-chart="' + chartId + '"]') || document;
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && keys.title && keys.titleNeutral && !(tx.title || '').trim()) {
    titleEl.textContent = isDefault ? tt(keys.title) : tt(keys.titleNeutral);
  }
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && keys.subtitle && keys.subtitleNeutral && !(tx.subtitle || '').trim()) {
    subEl.textContent = isDefault ? tt(keys.subtitle) : tt(keys.subtitleNeutral);
  }
}

// Aplica los textos CUSTOM del editor (?nl=1) al DOM. El editor solo guarda la
// config y emite 'atlas-editor-change' — NO escribe la página. En el N°2 cada
// renderer aplicaba el custom por su cuenta (ej. marimekko.js:868) y esa mitad
// se perdió al fotocopiar la infraestructura: quedaron solo los guards de "no
// pisar", con lo cual el título/subtítulo/caption custom no aparecía ni en
// pantalla ni en el PNG (png-export lee el DOM). Esta pasada central lo
// restituye para todos los charts de la carpeta.
// Orden garantizado: utils.js carga antes que los renderers, así que este
// listener corre PRIMERO en cada 'atlas-editor-change'; el redraw del chart
// corre después y sus guards evitan pisar lo aplicado acá. Si el custom está
// vacío, restaura el default del i18n (los títulos dinámicos se recalculan
// solos en el redraw que sigue).
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

// Botón "Limpiar" universal (regla de selección, criterio 11e): toda lista
// multi-select de chips gana un botón que vacía la selección de un golpe.
// Genérico a propósito: "limpiar" = clickear todas las ✕ visibles, reusando
// el handler propio de cada chart — así respeta fallbacks (el chip
// "Mundialistas" que vuelve en altura/edad) y exclusiones (los máx/mín del
// chart 4 del N°2). Se muestra solo con 2+ chips removibles (con 1 alcanza
// la ✕ del chip). Sigue los re-renders de chips con MutationObserver.
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
  document
    .querySelectorAll('[id*="-selected-chips"], #pc-team-chips, #ci-city-chips, #vs-team-chips, #vs-mrow-chips, #vs-line-chips')
    .forEach(wire);
}
window.addEventListener('load', () => setTimeout(atlasWireClearButtons, 0));

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
// Interacción TÁCTIL de los tooltips (tap en móvil)
// =============================================================
// En desktop el tooltip aparece al hover (mouseenter/mousemove). En touch no
// hay hover: el browser emite eventos de mouse SINTÉTICOS al tocar (mouseover
// sobre el elemento tocado), así que alcanza con cablear los handlers SIEMPRE
// (no gatearlos tras HAS_HOVER). Lo único que faltaba para que el tap funcione
// bien es: (a) cerrar el tooltip al tocar fuera de un dato, y (b) en los charts
// de "crosshair" (línea vertical que sigue el cursor) escuchar touchstart/
// touchmove, porque el touch-drag NO emite mousemove.

// (a) Cierre por tap-away GENÉRICO. En fase de CAPTURA ocultamos cualquier
// tooltip abierto en cada touchstart; si el toque cayó sobre un dato, su propio
// handler (mouseover sintético, que corre DESPUÉS en fase de burbuja) lo vuelve
// a mostrar al instante. Si cayó en vacío, queda oculto. Así no hay que marcar
// cada elemento. En desktop no hay touchstart → impacto cero.
(function () {
  function hideAllTips() {
    document.querySelectorAll('.tooltip').forEach(t => { t.style.opacity = '0'; t.style.display = 'none'; });
  }
  document.addEventListener('touchstart', hideAllTips, true);
})();

// clientX/clientY desde un evento de mouse O de touch (primer dedo).
function evClientX(ev) { return (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX; }
function evClientY(ev) { return (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY; }

// (b) Cablea touchstart+touchmove sobre el SVG de un chart de crosshair para
// que la línea/tooltip sigan al dedo. `moveH` es el MISMO handler que usa
// mousemove (debe leer la posición con evClientX/evClientY). preventDefault
// frena el scroll de la página mientras se arrastra sobre el gráfico.
function wireTouchScrub(svg, moveH) {
  if (!svg) return;
  const h = (ev) => { moveH(ev); if (ev.cancelable) ev.preventDefault(); };
  svg.addEventListener('touchstart', h, { passive: false });
  svg.addEventListener('touchmove', h, { passive: false });
  svg.__atlasTouchScrub = h;
}

// (c) Clamp al VIEWPORT, automático. Cada chart posiciona su tooltip a su modo
// (relativo al SVG), y cerca de un borde —sobre todo en mobile— se salía de la
// pantalla. En vez de tocar cada renderer, un MutationObserver por tooltip
// observa cambios de `style`: cuando se muestra o reposiciona, lo corre hacia
// adentro si su rect real se pasa del viewport. Converge en 1-2 pasos (al
// reposicionar deja de haber overflow → no vuelve a moverlo) y no toca el
// posicionamiento de cada chart.
(function () {
  const PAD = 6;
  function clampOne(tt) {
    if (!tt || tt.style.display === 'none') return;
    const r = tt.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let l = parseFloat(tt.style.left) || 0, t = parseFloat(tt.style.top) || 0, nl = l, nt = t;
    if (r.right > window.innerWidth - PAD) nl = l - (r.right - (window.innerWidth - PAD));
    if (r.left + (nl - l) < PAD) nl = l + (PAD - r.left);         // si igual no entra (más ancho que el viewport), pegado a la izq
    if (r.bottom > window.innerHeight - PAD) nt = t - (r.bottom - (window.innerHeight - PAD));
    if (r.top + (nt - t) < PAD) nt = t + (PAD - r.top);
    if (Math.abs(nl - l) > 0.5) tt.style.left = nl + 'px';
    if (Math.abs(nt - t) > 0.5) tt.style.top = nt + 'px';
  }
  function wire() {
    document.querySelectorAll('.tooltip').forEach(tt => {
      if (tt.__atlasClamp) return;
      const obs = new MutationObserver(() => clampOne(tt));
      obs.observe(tt, { attributes: true, attributeFilter: ['style'] });
      tt.__atlasClamp = obs;
    });
  }
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);
})();

// =============================================================
// Hover de gráficos de LÍNEAS sin inventar datos (regla del Atlas)
// =============================================================
// PRINCIPIO INNEGOCIABLE: el tooltip NUNCA muestra un número que nadie midió.
//
// El bug que esto arregla: los charts de líneas del N°4 tomaban el año crudo
// bajo el cursor (Math.round del año fraccional) y calculaban el valor de cada
// serie INTERPOLANDO linealmente entre las dos olas vecinas. Como las series
// son olas de encuesta en años irregulares (Argentina 2017, Uruguay 2022,
// huecos de 4 a 9 años), pararse en 2003 devolvía cinco porcentajes con un
// decimal que no existen en ningún dataset. La línea que une dos olas es un
// CONECTOR VISUAL, no una serie anual.
//
// La solución es la de OWID (owid-grapher, LineChartHelpers.findClosestTimeAtMouse
// + LineChartTooltip):
//   1. SNAP: el crosshair no se para donde está el cursor sino en el año con
//      observación más cercano, tomando la UNIÓN de años de todas las series
//      visibles. Así nunca queda parado en un año fantasma.
//   2. MATCH EXACTO: en ese año, cada serie aporta su valor sólo si tiene una
//      observación ahí.
//   3. TOLERANCIA (modelo "tolerance" de OWID, CoreTableUtils.toleranceInterpolation):
//      si no tiene observación exacta pero sí una cerca, se ARRASTRA ese valor
//      —copiado, jamás promediado— y se muestra CON SU AÑO REAL al lado, como
//      hace TooltipContents.Variable con su ⓘ. Fuera de la tolerancia la serie
//      no aparece (igual que OWID descarta las series fuera de rango).
//   4. Los círculos del crosshair se dibujan en la x del AÑO REAL de cada
//      serie, no sobre la línea vertical (LineChartActiveTimeMarkers).
//
// Por qué 4 años de tolerancia (medido sobre nuestros datos, no a ojo):
//   - Distancia entre olas consecutivas dentro de una misma serie: mínimo 4,
//     mediana 8-9 (pelicula), mediana 7 (prioridad). Con tolerancia 4 el valor
//     arrastrado es, como máximo, el de la ola INMEDIATAMENTE anterior o
//     posterior; nunca salta ola y media.
//   - Cubre la dispersión DENTRO de una misma ola EVS/WVS: el trabajo de campo
//     de la ola 7 va de 2017 a 2022 según el país, así que exigir año exacto
//     compararía sólo países que salieron a campo el mismo año.
//   - Cobertura del tooltip con la selección default (5 países): 32-36% de las
//     series con tolerancia 0 → 89-100% con tolerancia 4. Con tolerancia 0 casi
//     nunca se ve más de un país a la vez y el gráfico deja de ser comparativo.
//   - Más arriba de 4 el rendimiento marginal es chico (+3 pts con 5, +5 con 6)
//     y el desfase mostrado crece: 4 años sobre un eje de 41 son ~10% del ancho,
//     un desplazamiento del punto que se VE.
// Cada chart puede pasar otra tolerancia por opts si sus datos son distintos
// (ej. una serie anual completa querría 0).
const ATLAS_LINE_TOLERANCE = 4;

// Unión ordenada de los años con observación de las series visibles. Es el
// conjunto al que snapea el crosshair. Hay que recalcularlo en cada redibujo
// (cambia con la selección de países, la categoría y el período).
//   series: [{ pts: [[year, value, ...], ...] }, ...]
function atlasSnapYears(series) {
  const set = {};
  (series || []).forEach(s => (s.pts || []).forEach(p => { set[p[0]] = true; }));
  return Object.keys(set).map(Number).sort((a, b) => a - b);
}

// Año del conjunto de snap más cercano a rawYear (que puede ser fraccional).
function atlasSnapYear(snapYears, rawYear) {
  if (!snapYears || !snapYears.length) return null;
  let best = snapYears[0], bd = Math.abs(rawYear - best);
  for (let i = 1; i < snapYears.length; i++) {
    const d = Math.abs(rawYear - snapYears[i]);
    if (d < bd) { bd = d; best = snapYears[i]; }
  }
  return best;
}

// Filas a mostrar en el tooltip de un chart de líneas, SIN inventar datos.
//   series    : [{ iso|key, color, pts: [[year, value, ...], ...] }]  pts ordenados por año
//   hoverYear : año bajo el cursor (puede ser fraccional)
//   opts      : { tolerance, snapYears }   tolerance 0 = sólo match exacto
// Devuelve { year, rows: [{ iso, key, color, value, year, exact, point, series }] }
//   year          = año SNAPEADO (siempre un año con encuesta) → va en el encabezado
//   row.year      = año REAL del dato de esa serie (== year si exact)
//   row.exact     = true si la serie midió justo en el año del encabezado
// Las series sin observación dentro de la tolerancia NO aparecen (y por lo
// tanto tampoco reciben círculo en el crosshair).
function atlasLineHoverRows(series, hoverYear, opts) {
  const o = opts || {};
  const tol = (o.tolerance === undefined || o.tolerance === null) ? ATLAS_LINE_TOLERANCE : o.tolerance;
  const snap = o.snapYears || atlasSnapYears(series);
  const year = atlasSnapYear(snap, hoverYear);
  const rows = [];
  if (year === null) return { year: null, rows: rows };
  (series || []).forEach(s => {
    const pts = s.pts || [];
    let bp = null, bd = Infinity;
    for (let k = 0; k < pts.length; k++) {
      const d = Math.abs(pts[k][0] - year);
      if (d < bd) { bd = d; bp = pts[k]; }
      else if (d > bd) break;          // pts ordenados por año: ya nos estamos alejando
    }
    if (!bp || bd > tol) return;
    rows.push({
      iso: s.iso, key: (s.key !== undefined ? s.key : s.iso), color: s.color,
      value: bp[1], year: bp[0], exact: bd === 0, point: bp, series: s
    });
  });
  return { year: year, rows: rows };
}

// HTML del tooltip de líneas. Una sola verdad para los charts de líneas del
// Atlas: encabezado con el año snapeado + una fila por serie, y cuando el dato
// NO es de ese año, su año real en gris chico antes del número (el equivalente
// del ⓘ de OWID) más una nota al pie del tooltip que lo explica.
//   rows: filas de atlasLineHoverRows enriquecidas con { label, italic? }
//   o   : { dec = 1, suffix = '%' }
function atlasLineTooltipHTML(year, rows, o) {
  const op = o || {};
  const dec = (op.dec === undefined || op.dec === null) ? 1 : op.dec;
  const suffix = (op.suffix === undefined || op.suffix === null) ? '%' : op.suffix;
  const L = (k) => (typeof t === 'function') ? t(k) : k;
  let anyNear = false;
  let html = '<div style="font-weight:600;margin-bottom:4px;">' + year + '</div>';
  rows.forEach(r => {
    const num = (typeof fmt === 'function') ? fmt(r.value, dec) : Number(r.value).toFixed(dec);
    let note = '';
    if (!r.exact) {
      anyNear = true;
      const ttl = String(L('tt-year-from')).replace('{YEAR}', r.year);
      note = '<span title="' + ttl + '" style="font-size:.82em;color:#8A8177;font-variant-numeric:tabular-nums;white-space:nowrap;">' + r.year + '</span>';
    }
    html += '<div style="display:flex;align-items:center;gap:6px;line-height:1.5;">'
      + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + r.color + ';"></span>'
      + '<span style="flex:1;' + (r.italic ? 'font-style:italic;' : '') + '">' + r.label + '</span>'
      + note
      + '<strong style="font-variant-numeric:tabular-nums;">' + num + suffix + '</strong></div>';
  });
  if (anyNear) {
    html += '<div style="margin-top:5px;font-size:.8em;color:#8A8177;line-height:1.35;">' + L('tt-nearest-note') + '</div>';
  }
  return html;
}

// Slider de rango que SOLO permite años de Mundial (los thumbs "saltan" de
// Mundial en Mundial; no caen en años intermedios como 1931 o 2015). Opera
// internamente sobre índices del array `years` y mapea a años reales.
//   o = { fromId, toId, dispId, trackId?, years, get(), set([y0,y1]), onChange() }
// get() devuelve [y0,y1] (años); set recibe [y0,y1] (años).
function setupWcRangeSlider(o) {
  const fromEl = document.getElementById(o.fromId), toEl = document.getElementById(o.toId);
  if (!fromEl || !toEl) return;
  const dispEl = o.dispId ? document.getElementById(o.dispId) : null;
  const trackEl = o.trackId ? document.getElementById(o.trackId) : null;
  const ys = o.years, N = ys.length;
  [fromEl, toEl].forEach(el => { el.min = 0; el.max = N - 1; el.step = 1; });
  const idxOf = (yr) => { let bi = 0, bd = Infinity; for (let i = 0; i < N; i++) { const d = Math.abs(ys[i] - yr); if (d < bd) { bd = d; bi = i; } } return bi; };
  function curIdx() { const p = o.get(); return [idxOf(p[0]), idxOf(p[1])]; }
  function paint() {
    const [a, b] = o.get(); if (dispEl) dispEl.textContent = `${a}–${b}`;
    if (trackEl) { const sp = N - 1; if (sp > 0) { const [ia, ib] = curIdx(); trackEl.style.left = (ia / sp * 100) + '%'; trackEl.style.right = ((sp - ib) / sp * 100) + '%'; } }
  }
  function syncInputs() { const [ia, ib] = curIdx(); fromEl.value = ia; toEl.value = ib; }
  fromEl.addEventListener('input', () => { let fi = +fromEl.value; const [, bi] = curIdx(); if (fi > bi) fi = bi; o.set([ys[fi], ys[bi]]); syncInputs(); paint(); if (o.onChange) o.onChange(); });
  toEl.addEventListener('input', () => { let ti = +toEl.value; const [ai] = curIdx(); if (ti < ai) ti = ai; o.set([ys[ai], ys[ti]]); syncInputs(); paint(); if (o.onChange) o.onChange(); });
  syncInputs(); paint();
  // Punto de resincronización: si alguien cambia el período POR AFUERA (p. ej.
  // el grapher aplicando ?periodo= de un link compartido), los dos thumbs y la
  // etiqueta se vuelven a leer del estado. Sin esto el dato quedaba bien pero
  // el control mostraba el rango anterior.
  (window.__atlasRangeSliders = window.__atlasRangeSliders || []).push(() => { syncInputs(); paint(); });
}
function atlasResyncRangeSliders() {
  (window.__atlasRangeSliders || []).forEach(fn => { try { fn(); } catch (_) {} });
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
// vbW/vbH = viewBox del SVG (la proporción del GRÁFICO en sí).
// nominalW/nominalH = canvas final del PNG (incluye título arriba + nota
//   abajo). square produce un PNG cuadrado (1200×1200) pero el gráfico
//   adentro es APAISADO (vbH 720, aspect ~1.5) para que llene el ancho;
//   el título grande arriba y la nota abajo completan el cuadrado. Sin
//   esto el gráfico cuadrado se achicaba al centro dejando bandas.
const PNG_FORMATS = {
  public:     { vbW: 1100, vbH: 619,  nominalW: 1600, nominalH: 900  },
  newsletter: { vbW: 1100, vbH: 760,  nominalW: 1080, nominalH: 1080 },
  square:     { vbW: 1100, vbH: 760,  nominalW: 1200, nominalH: 1200 },
  mobile:     { vbW: 1100, vbH: 1100, nominalW: 1000, nominalH: 1500 },
  // Mapamundi: el mapa es ancho (Robinson ~1.9:1). Un cuadrado le deja medio
  // canvas vacío abajo. Este formato lo ajusta: ancho completo, alto justo
  // para título + mapa + nota (sin desperdicio). Lo usa el chart 3 vía
  // __atlasDefaultPngFormat. Igual es mobile-first (chrome grande).
  worldmap:   { vbW: 1100, vbH: 580,  nominalW: 1200, nominalH: 920  }
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
    wrap.classList.add('ae-format-wrapper');
    wrap.style.setProperty('--ae-aspect', (f.vbW / f.vbH).toFixed(4));
  } else {
    wrap.classList.remove('ae-format-wrapper');
    wrap.style.removeProperty('--ae-aspect');
  }
}

// Re-dibuja el chart de la página cuando cambia la CLASE de viewport (cruza
// el breakpoint 768px): al rotar el celu, al redimensionar, o si el PRIMER
// render cayó en el viewport equivocado (ej. el chart se dibujó antes de que
// el navegador aplicara el <meta viewport> → quedó en tamaño DESKTOP dentro
// del viewBox móvil = tipografía a ~⅓, "muy chiquito"). Bug real detectado
// 2026-07-11 en el deciles del N°2.
//
// Usa el contrato UNIVERSAL window.__atlasRedraw (lo registran los 27 charts
// en Fase 2), así vale para TODOS los números — antes solo llamaba a los 3
// draws del N°2 por nombre. Throttle vía rAF para no martillar en el drag.
let _lastIsMobile = isMobileViewport();
let _resizeRaf = null;
function atlasResponsiveRedraw() {
  const nowMobile = isMobileViewport();
  if (nowMobile === _lastIsMobile) return;
  _lastIsMobile = nowMobile;
  if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
}
window.addEventListener('resize', () => {
  if (_resizeRaf) return;
  _resizeRaf = requestAnimationFrame(() => { _resizeRaf = null; atlasResponsiveRedraw(); });
});
window.addEventListener('orientationchange', atlasResponsiveRedraw);
// Red de seguridad contra el primer-render-malo: tras load (con el viewport
// ya estabilizado) forzamos UN re-render, sincronizando _lastIsMobile con el
// viewport final. Incondicional (no solo si cambió la clase) porque el primer
// render puede haber caído en desktop aunque _lastIsMobile ya fuera mobile
// (carrera entre el render y el meta viewport). Un re-draw extra inmediato es
// imperceptible y garantiza que lo que se ve refleje el ancho real.
window.addEventListener('load', () => setTimeout(() => {
  _lastIsMobile = isMobileViewport();
  if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
}, 80));

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

// === Vista compartible (Fase 5 — idea OWID) =================================
// El lector copia el link desde la barra de direcciones: el chart la mantiene
// al día. (Hubo un botón "Copiar link" junto a las descargas; Daniel lo probó
// y prefirió sacarlo, 2026-08-10 — la barra alcanza.)
// (a) atlasSyncUrl(params): mantiene el estado del chart en la URL con
//     history.replaceState — sin recargar ni ensuciar el historial. Solo
//     gestiona las claves pasadas; un valor null/''/undefined BORRA el
//     parámetro. Regla de oro (lección del grapher, 2026-07-31): la vista
//     DEFAULT viaja como URL limpia — el estado de fábrica NUNCA se escribe,
//     así el link no congela el default del día y los cambios editoriales
//     posteriores le llegan a quien ya tiene el link. Los parámetros ajenos
//     (lang, nl, titulo…) se preservan.
// Ruta que debe mostrar la barra de direcciones. Leyendo en inglés muestra la
// landing -en (misma vista, mismos parámetros); en español, la del gráfico.
// Por qué: la tarjeta que arman X/WhatsApp sale del HTML estático, y ningún
// crawler ejecuta JS ni lee ?lang — la única forma de que salga en inglés es
// compartir la landing. Antes había que cambiar el nombre del archivo a mano al
// compartir y era imposible acordarse (Daniel pegó el link del gráfico y le
// salió el card en español, 2026-08-14). Ahora lo que se copia de la barra ya
// es el link correcto para el idioma que se está leyendo. La página lo declara
// con <link rel="alternate" hreflang="en" href="./chart-X-en.html">; sin esa
// declaración no se toca nada.
const ATLAS_RUTA_REAL = (typeof location !== 'undefined') ? location.pathname : '';
function atlasSharePathname() {
  try {
    const alt = document.querySelector('link[rel="alternate"][hreflang="en"]');
    const enIngles = ((typeof LANG !== 'undefined' ? LANG : 'es') === 'en');
    if (alt && enIngles) return new URL(alt.getAttribute('href'), location.href).pathname;
    return ATLAS_RUTA_REAL || location.pathname;
  } catch (_) { return location.pathname; }
}
// En la landing el idioma lo fija la propia página, así que un ?lang= colgado
// del link anterior sobra y encima se contradice (…-en.html?lang=es).
function atlasLimpiarLangSiLanding(pathname, searchParams) {
  if (pathname !== ATLAS_RUTA_REAL) searchParams.delete('lang');
  return searchParams;
}
function atlasSyncSharePath() {
  try {
    const p = atlasSharePathname();
    const sp = atlasLimpiarLangSiLanding(p, new URLSearchParams(location.search));
    const q = sp.toString();
    const nueva = p + (q ? '?' + q : '') + location.hash;
    if (nueva !== location.pathname + location.search + location.hash) {
      history.replaceState(null, '', nueva);
    }
  } catch (_) {}
}
// La solapa del navegador también habla el idioma de la página. applyI18n no
// toca <title> (no es un nodo con data-i18n), así que en inglés la pestaña y el
// favorito quedaban en castellano. El título inglés viaja en data-title-en, con
// el mismo texto que ya muestra la tarjeta de la landing …-en.html: así no hay
// una clave de diccionario nueva por página ni dos redacciones que mantener.
function atlasSyncDocTitle() {
  try {
    const el = document.querySelector('title[data-title-en]');
    if (!el) return;
    if (!el.dataset.titleEs) el.dataset.titleEs = document.title;   // el castellano, tal como vino del HTML
    const en = ((typeof LANG !== 'undefined' ? LANG : 'es') === 'en');
    const nuevo = en ? el.dataset.titleEn : el.dataset.titleEs;
    if (nuevo && document.title !== nuevo) document.title = nuevo;
  } catch (_) {}
}
// Al cargar y al togglear idioma (los charts sin estado compartible no llaman
// a atlasSyncUrl, así que necesitan estos dos disparadores).
if (typeof window !== 'undefined') {
  const alCambiarIdioma = () => { atlasSyncSharePath(); atlasSyncDocTitle(); };
  window.addEventListener('load', () => setTimeout(alCambiarIdioma, 0));
  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest && e.target.closest('.lang-toggle')) setTimeout(alCambiarIdioma, 0);
  }, true);
}

function atlasSyncUrl(params) {
  try {
    const u = new URL(location.href);
    Object.keys(params).forEach(k => {
      const v = params[k];
      if (v === null || v === undefined || v === '') u.searchParams.delete(k);
      else u.searchParams.set(k, String(v));
    });
    const ruta = atlasSharePathname();
    const q = atlasLimpiarLangSiLanding(ruta, u.searchParams).toString();
    history.replaceState(null, '', ruta + (q ? '?' + q : '') + u.hash);
  } catch (_) { /* URL inválida o history bloqueado: el chart sigue andando */ }
}

// (b) atlasUrlParam(k): lee un parámetro de la URL (string o null).
function atlasUrlParam(k) {
  try { return new URLSearchParams(location.search).get(k); } catch (_) { return null; }
}

// (b0) atlasEnsureGeo(cb, src): carga el mapa mundial (GEO_COUNTRIES) recién
//      cuando hace falta. Ese archivo pesa 2 MB —el 85% del peso de una página
//      con mapa— y en los charts multi-vista el lector puede no abrir nunca la
//      pestaña del mapa: cargarlo con la página es hacerle pagar de entrada
//      algo que quizá no mire. Reintenta unas veces por si la red falla.
//      Idempotente: si ya está cargado (o cargándose), el callback igual corre.
let atlasGeoCargando = false;
const atlasGeoPendientes = [];
function atlasEnsureGeo(cb, src, intentos) {
  if (typeof GEO_COUNTRIES !== 'undefined') { if (cb) cb(); return; }
  if (cb) atlasGeoPendientes.push(cb);
  if (atlasGeoCargando && !intentos) return;
  atlasGeoCargando = true;
  const n = intentos || 0;
  const listo = () => {
    atlasGeoCargando = false;
    while (atlasGeoPendientes.length) { try { atlasGeoPendientes.shift()(); } catch (_) {} }
  };
  const falló = () => {
    if (n < 4) setTimeout(() => atlasEnsureGeo(null, src, n + 1), 400);
    else { atlasGeoCargando = false; console.error('[geo] no se pudo cargar el mapa mundial'); }
  };
  const sc = document.createElement('script');
  sc.src = (src || '../03-futbol/data-country-geo.js') + '?r=' + n;
  sc.onload = () => { if (typeof GEO_COUNTRIES !== 'undefined') listo(); else falló(); };
  sc.onerror = falló;
  document.head.appendChild(sc);
}

// (b1) atlasEditorSize(aeSizes, clave, preset): resuelve un tamaño de fuente
//      combinando el slider del editor con el preset del formato activo.
//      El slider PISA el preset solo si el lector lo movió de su valor de
//      fábrica; si está en el default, manda el preset.
//      Por qué: los presets por formato (newsletter/cuadrado/mobile) son
//      grandes a propósito, y los sliders arrancan en tamaños de PANTALLA
//      (11/10). Sin esta regla, abrir el editor encogía el gráfico y había que
//      volver a subir los cuatro sliders antes de exportar cada PNG. Y en los
//      charts que solo leían los sliders cuando NO había formato activo, el
//      slider directamente no hacía nada (bug que reportó Daniel, 2026-08-11).
function atlasEditorSize(aeSizes, clave, preset) {
  let out = preset;
  if (aeSizes && typeof aeSizes[clave] === 'number') {
    // "Lo movió" es explícito (config.sizesTouched), no se deduce comparando
    // con el default: si se dedujera, un valor elegido a mano que coincida con
    // el default se ignoraría, y el slider mostraría un número distinto del
    // dibujado.
    const cfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
      ? window.AtlasEditor.getConfig() : null;
    const tocado = !!(cfg && cfg.sizesTouched && cfg.sizesTouched[clave]);
    if (tocado) out = aeSizes[clave];
  }
  // Publicamos el tamaño REALMENTE usado para que el panel muestre ese número
  // en el slider mientras el lector no lo movió (si no, el slider marca 11 y
  // el gráfico dibuja 20: moverlo "achica" y parece roto — lo reportó Daniel,
  // 2026-08-11).
  if (!window.__atlasEffectiveSizes) window.__atlasEffectiveSizes = {};
  window.__atlasEffectiveSizes[clave] = out;
  return out;
}

// (b2) atlasSyncToggleUI(target, valor, attr): marca activo el botón que
//      corresponde dentro de .toggle[data-target="…"]. Hace falta al aplicar
//      estado desde la URL: el botón activo viene hardcodeado en el HTML, así
//      que si solo se cambia el estado, el control sigue mostrando el default
//      (mismo problema que tenía el slider de olas).
function atlasSyncToggleUI(target, valor, attr) {
  const a = attr || 'scale';
  document.querySelectorAll('.toggle[data-target="' + target + '"]').forEach(t => {
    t.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset[a] === valor));
  });
}

// (b3) atlasSyncActiveBtn(attr, valor): marca .active en el botón cuyo
//      data-<attr> coincide con `valor` (toggles tipo segmento: data-mode,
//      data-rk-view, data-rk-unit…). Igual que (b2) pero para el markup que no
//      usa .toggle[data-target]. camelCase del dataset: 'rk-view' → rkView.
function atlasSyncActiveBtn(attr, valor) {
  const camel = attr.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
  document.querySelectorAll('[data-' + attr + ']').forEach(b => {
    b.classList.toggle('active', b.dataset[camel] === valor);
  });
}

// (c) atlasSyncUrlTodoONada(actual, defaults): la regla de la casa (criterio de
//     Daniel, 2026-08-10). Recibe DOS objetos con las mismas claves, ya
//     serializadas a string. Si TODAS coinciden con su default → borra todos
//     los parámetros (URL limpia = link "oficial", evergreen). Si alguna
//     difiere → escribe TODAS (el link es una foto fiel de lo que el lector
//     veía, sin dimensiones sueltas que se muevan con un cambio de default).
//     Las listas separadas por ~ se comparan como conjunto (agregar A y B en
//     otro orden no cuenta como customizar).
function atlasSyncUrlTodoONada(actual, defaults) {
  if (typeof atlasSyncUrl !== 'function') return;
  const norm = (v) => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return s.indexOf('~') >= 0 ? s.split('~').slice().sort().join('~') : s;
  };
  const claves = Object.keys(actual);
  const esDefault = claves.every(k => norm(actual[k]) === norm(defaults[k]));
  const out = {};
  claves.forEach(k => { out[k] = esDefault ? null : actual[k]; });
  atlasSyncUrl(out);
}

