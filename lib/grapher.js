// =============================================================
//  lib/grapher.js — shell de "mini-graficador" estilo OWID
// =============================================================
// Un dataset, varias VISTAS conmutables por pestañas (Ranking · Mapa ·
// Evolución · Perfil), estado del lector en la URL (?vista=&cat=) y un
// PNG/CSV por vista. NO reimplementa ningún renderer: cada vista es un chart
// standalone ya depurado (su <section> + su init() + sus draws). El shell:
//   1. muestra una vista por vez (paneles show/hide),
//   2. MIGRA la categoría y la selección de país al cambiar de pestaña
//      ("elegí ARG/BRA en el ranking → velos en el mapa / en el tiempo"),
//   3. repunta los hooks de PNG (window.__atlasRedraw / onBeforePngExport*)
//      a los de la vista activa,
//   4. sincroniza ?vista= (y ?cat=) en la URL con history.replaceState.
//
// El estado que "viaja" entre vistas:
//   - cat: la categoría de vecino (todas las vistas menos Perfil la usan).
//   - selected[]: la lista de países (Ranking y Evolución la comparten; Perfil
//     toma el primero como país enfocado).
// La ola/período de cada vista es propia (no se comparte: son escalas distintas).
//
// Config que recibe initGrapher (la define la página, ej. chart-vecinos.html):
//   { defaultView, views: [
//       { id, panelId, chartN, catSel, selKind:'multi'|'single'|'none',
//         init, redrawFull } ] }
//   - init:       la initX() del motor (se llama UNA vez, lazy).
//   - redrawFull: redibujo completo de la vista, incluidos chips/leyenda/select
//                 (para cambio de idioma y para reflejar el estado migrado).

(function () {
  let CFG = null, curId = null;
  const inited = {};   // id -> true (init llamado)
  const hooks = {};    // id -> {redraw, fmt, be, bst} capturados tras su init
  const shared = { cat: null, selected: null };  // estado que viaja entre vistas
  // ?ola= / ?periodo= de la URL: son PROPIOS de cada vista (escalas distintas),
  // así que no viajan en `shared` — se aplican una vez, a la vista que abre el
  // link. La ola se aplica MOVIENDO EL PROPIO SLIDER (no el estado a mano): así
  // el control y su etiqueta nunca se separan del dato. Como el slider mapea
  // índice→ola por dentro, se prueban sus posiciones hasta dar con la pedida
  // (son pocas, ≤8, y el redibujo es instantáneo).
  let pendingOla = null, pendingPeriodo = null;

  function aplicarOla(v, ola) {
    const s = st(v);
    if (!s || s.wave == null || !/^\d+$/.test(ola)) return;
    const target = parseInt(ola, 10);
    if (String(s.wave) === String(target)) return;
    const panel = document.getElementById(v.panelId);
    const input = panel && panel.querySelector('input[type="range"]');
    if (!input) { s.wave = target; return; }
    const prev = input.value, max = parseInt(input.max, 10) || 0;
    for (let i = 0; i <= max; i++) {
      input.value = i;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (String(s.wave) === String(target)) return;
    }
    // ola inexistente en esta vista (URL a mano): volver a donde estaba
    input.value = prev;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function aplicarPeriodo(v, periodo) {
    const s = st(v);
    if (!s || !Array.isArray(s.period)) return;
    const m = String(periodo).split('~').map(x => parseInt(x, 10));
    if (m.length !== 2 || m.some(isNaN) || m[0] > m[1]) return;
    s.period = m;
    // los dos thumbs y la etiqueta se releen del estado (lib/utils.js)
    if (typeof atlasResyncRangeSliders === 'function') atlasResyncRangeSliders();
  }

  const view = (id) => CFG && CFG.views.find(v => v.id === id);
  const st = (v) => (typeof state !== 'undefined' ? state[v.chartN] : null);

  // ---- hooks de PNG: cada motor setea estos globales en su init; conviven mal
  //      (son uno solo), así que los capturamos por vista y los restauramos. ----
  function captureHooks(id) {
    hooks[id] = {
      redraw: window.__atlasRedraw || null,
      fmt: (typeof window.__atlasDefaultPngFormat !== 'undefined') ? window.__atlasDefaultPngFormat : null,
      be: window.onBeforePngExport || null,
      bst: window.onBeforePngExportGetSourceText || null,
    };
  }
  function restoreHooks(id) {
    const h = hooks[id] || {};
    window.__atlasRedraw = h.redraw || null;
    window.__atlasDefaultPngFormat = h.fmt || null;
    window.onBeforePngExport = h.be || null;
    window.onBeforePngExportGetSourceText = h.bst || null;
  }

  // ---- defaults POR VISTA ----
  // La selección viaja entre vistas, pero no todas quieren la misma: dieciséis
  // países son el marimekko del ranking y una maraña ilegible en la vista de
  // líneas. Una vista puede declarar su propio `defaultSelection` (multi) o
  // `defaultIso` (single); rige mientras el lector no haya elegido países, y
  // apenas elige, vuelve a mandar la selección compartida.
  function mismoConjunto(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const x = a.slice().sort().join(','), y = b.slice().sort().join(',');
    return x === y;
  }
  function defaultDeVista(v) {
    return Array.isArray(v.defaultSelection) ? v.defaultSelection : (CFG.defaultSelection || []);
  }
  // ¿La selección compartida sigue siendo la de fábrica?
  function globalIntacto() {
    return mismoConjunto(shared.selected || [], CFG.defaultSelection || []);
  }

  // ---- migración de estado entre vistas ----
  function harvest(id) {
    const v = view(id); if (!v) return;
    const s = st(v); if (!s) return;
    if (v.catSel && s.cat) shared.cat = s.cat;
    if (v.selKind === 'multi' && Array.isArray(s.selected)) {
      // Si la vista está mostrando SU default y nadie lo tocó, no contagia: pasar
      // por Evolución no puede reducirle la selección al Ranking.
      if (Array.isArray(v.defaultSelection) && mismoConjunto(s.selected, v.defaultSelection)) return;
      shared.selected = s.selected.slice();
    } else if (v.selKind === 'single' && s.iso) {
      if (v.defaultIso && s.iso === v.defaultIso && globalIntacto()) return;
      // el país perfilado pasa al frente de la selección compartida
      shared.selected = [s.iso].concat((shared.selected || []).filter(x => x !== s.iso));
    }
  }

  function applyShared(v) {
    const s = st(v); if (!s) return;
    if (v.catSel && shared.cat) {
      s.cat = shared.cat;
      const sel = document.getElementById(v.catSel);
      if (sel) sel.value = shared.cat;
    }
    if (shared.selected && shared.selected.length) {
      const intacto = globalIntacto();
      if (v.selKind === 'multi') {
        s.selected = (intacto && Array.isArray(v.defaultSelection))
          ? v.defaultSelection.slice() : shared.selected.slice();
      } else if (v.selKind === 'single') {
        s.iso = (intacto && v.defaultIso) ? v.defaultIso : (shared.selected[0] || s.iso);
      }
    }
  }

  function ensureInit(v) {
    if (inited[v.id]) return;
    v.init();               // dibuja con sus defaults y setea sus hooks de PNG
    if (typeof v.postInit === 'function') v.postInit();  // ajuste de vista (ej. marimekko por default)
    // Foto de los DEFAULTS de la vista, tomada justo después de su init y antes
    // de aplicarle nada heredado ni de la URL. Es contra esta foto que se decide
    // si la vista está "de fábrica" (ver esDefault).
    const s0 = st(v);
    v._def = s0 ? {
      cat: s0.cat,
      wave: s0.wave,
      period: Array.isArray(s0.period) ? s0.period.slice() : null,
      selected: Array.isArray(s0.selected) ? s0.selected.slice() : null,
      iso: s0.iso
    } : {};
    captureHooks(v.id);
    inited[v.id] = true;
  }

  function activate(id, opts) {
    opts = opts || {};
    const v = view(id); if (!v) return;
    if (curId && curId !== id) harvest(curId);   // recoger estado de la vista que dejamos

    // mostrar el panel activo ANTES de dibujar (para que haya layout)
    CFG.views.forEach(w => {
      const p = document.getElementById(w.panelId);
      if (p) p.style.display = (w.id === id) ? 'block' : 'none';   // 'block', no '' (la regla .g-panel es display:none)
    });
    document.querySelectorAll('#g-tabs [data-gview]').forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-gview') === id));

    ensureInit(v);      // primera vez: init con defaults
    applyShared(v);     // volcar categoría/selección heredada
    // ?ola= / ?periodo= del link: son PROPIOS de cada vista, así que se aplican
    // una sola vez, a la vista que abre el link.
    if (pendingOla != null)     { aplicarOla(v, pendingOla);         pendingOla = null; }
    if (pendingPeriodo != null) { aplicarPeriodo(v, pendingPeriodo); pendingPeriodo = null; }
    restoreHooks(id);   // los hooks de PNG de ESTA vista
    v.redrawFull();     // redibujar con el estado ya aplicado

    curId = id;
    if (!opts.noURL) syncURL();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  // ¿La vista actual está EXACTAMENTE como sale de fábrica (pestaña, categoría,
  // ola y selección)? Decide entre URL limpia y URL completa.
  function esDefault() {
    if (curId !== CFG.defaultView) return false;
    const v = view(curId), s = v && st(v);
    if (!v || !s) return true;
    const d = v._def || {};
    if (v.catSel && d.cat != null && s.cat !== d.cat) return false;
    if (d.wave != null && s.wave != null && String(s.wave) !== String(d.wave)) return false;
    if (Array.isArray(d.period) && Array.isArray(s.period) && String(s.period) !== String(d.period)) return false;
    if (v.selKind === 'multi' && Array.isArray(s.selected) && !mismoConjunto(s.selected, defaultDeVista(v))) return false;
    if (v.selKind === 'single' && s.iso && v.defaultIso && s.iso !== v.defaultIso) return false;
    return true;
  }

  // TODO-O-NADA (criterio de Daniel, 2026-08-10): la vista de fábrica viaja como
  // URL LIMPIA — es el link "oficial", evergreen: si mañana cambia el default
  // editorial, a quien lo tenga le llega el cambio. Apenas el lector toca algo,
  // la URL pasa a llevar el estado COMPLETO (pestaña + categoría + ola +
  // países), aunque algunas dimensiones sigan en su valor de fábrica. Así el
  // link es una FOTO fiel de lo que el lector estaba viendo: sin esto, un link
  // con países cambiados pero año default se "movía" solo cuando el default del
  // año cambiaba, y el destinatario veía otra cosa que quien lo compartió.
  const URL_KEYS = ['vista', 'cat', 'ola', 'periodo', 'paises'];
  function syncURL() {
    try {
      const p = new URLSearchParams(location.search);
      const v = view(curId), s = v && st(v);
      if (esDefault()) {
        URL_KEYS.forEach(k => p.delete(k));
      } else {
        p.set('vista', curId);
        if (v && v.catSel && s && s.cat) p.set('cat', s.cat); else p.delete('cat');
        if (v && s && s.wave != null) p.set('ola', s.wave); else p.delete('ola');
        if (v && s && Array.isArray(s.period)) p.set('periodo', s.period.join('~')); else p.delete('periodo');
        if (v && v.selKind === 'multi' && s && Array.isArray(s.selected) && s.selected.length) {
          p.set('paises', s.selected.join('~'));
        } else if (v && v.selKind === 'single' && s && s.iso) {
          p.set('paises', s.iso);
        } else { p.delete('paises'); }
      }
      const q = p.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    } catch (e) {}
  }

  // La URL se resincroniza tras CUALQUIER interacción del lector (cambio de
  // categoría, países, ola, toggles…): los handlers de cada vista mutan su
  // estado y redibujan; este listener corre DESPUÉS (setTimeout 0) y vuelca el
  // estado ya fresco a la URL. Antes solo se sincronizaba al cambiar de
  // pestaña, y la URL quedaba vieja (bug que encontró Daniel el 2026-08-10:
  // cambiaba la categoría de Evolución y el link seguía diciendo la anterior).
  let _resyncT = null;
  function resyncSoon() {
    if (!CFG || _resyncT) return;
    _resyncT = setTimeout(() => {
      _resyncT = null;
      harvest(curId);
      syncURL();
    }, 0);
  }
  document.addEventListener('change', resyncSoon, true);
  document.addEventListener('click', resyncSoon, true);
  document.addEventListener('input', resyncSoon, true);

  function initGrapher(config) {
    CFG = config;
    const q = new URLSearchParams(location.search);
    const qCat = q.get('cat');
    if (qCat) shared.cat = qCat;                       // categoría inicial desde la URL
    pendingOla = q.get('ola');
    pendingPeriodo = q.get('periodo');
    const qPaises = q.get('paises');
    if (qPaises) shared.selected = qPaises.split('~').filter(Boolean);
    else if (Array.isArray(CFG.defaultSelection)) shared.selected = CFG.defaultSelection.slice();
    const initial = view(q.get('vista')) ? q.get('vista') : CFG.defaultView;

    if (typeof applyI18n === 'function') applyI18n();   // i18n estático de todos los paneles

    document.querySelectorAll('#g-tabs [data-gview]').forEach(b =>
      b.addEventListener('click', () => activate(b.getAttribute('data-gview'))));

    activate(initial);

    if (typeof setupLangToggle === 'function') {
      setupLangToggle(() => { const v = view(curId); if (v) v.redrawFull(); });
    }
  }

  window.initGrapher = initGrapher;
})();
