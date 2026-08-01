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
    restoreHooks(id);   // los hooks de PNG de ESTA vista
    v.redrawFull();     // redibujar con el estado ya aplicado

    curId = id;
    if (!opts.noURL) syncURL();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  function syncURL() {
    try {
      const p = new URLSearchParams(location.search);
      p.set('vista', curId);
      const v = view(curId), s = v && st(v);
      if (v && v.catSel && s && s.cat) p.set('cat', s.cat); else p.delete('cat');
      // selección de países en la URL (para linkear "la línea con ARG, BRA…")
      // Sólo se escribe la selección si el lector la eligió. Si es la de
      // fábrica, el parámetro NO va: si no, la URL congela el default del día en
      // que se abrió y un cambio posterior no le llega nunca a quien ya tiene el
      // link (le pasó a Daniel el 2026-07-31).
      const defV = defaultDeVista(v);
      if (v && v.selKind === 'multi' && s && Array.isArray(s.selected) && s.selected.length) {
        if (mismoConjunto(s.selected, defV)) p.delete('paises');
        else p.set('paises', s.selected.join('~'));
      } else if (v && v.selKind === 'single' && s && s.iso) {
        if (v.defaultIso && s.iso === v.defaultIso) p.delete('paises');
        else p.set('paises', s.iso);
      } else { p.delete('paises'); }
      history.replaceState(null, '', location.pathname + '?' + p.toString() + location.hash);
    } catch (e) {}
  }

  function initGrapher(config) {
    CFG = config;
    const q = new URLSearchParams(location.search);
    const qCat = q.get('cat');
    if (qCat) shared.cat = qCat;                       // categoría inicial desde la URL
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
