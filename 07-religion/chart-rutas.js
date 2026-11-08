// Las dos rutas de salida del catolicismo (Latinobarómetro, 18 países) + composición religiosa año por año.
// Dos vistas con toggle de la casa (la selección viaja entre vistas, cada vista con su default, como lib/grapher.js):
//   · "Dos rutas" (de fábrica): scatter del motor rel-scatter.js. Cambio en evangélicos (x) contra cambio en sin
//     religión (y) entre 1996-1998 y 2023-2024; línea y = x punteada; "Ruta secular" arriba a la izquierda y
//     "Ruta evangélica" abajo a la derecha; todos los países etiquetados. Elegir un país (clic en su punto o
//     buscador) abre su composición.
//   · "Composición por año": áreas apiladas por país con relStack (rel-motor.js): católicos, evangélicos, otras y sin
//     religión (= ninguna + creyente sin iglesia), que suman 100. Un país = vista grande; dos o más = paneles chicos.
//     Venezuela hasta 2020. Sin selección tocada, muestra Uruguay y Guatemala (una punta de cada ruta).
// Datos: REL_RUTAS (data-rutas.js). Vista compartible: ?vista=composicion&paises=URY~GTM (- = selección vacía).
const CRU_ID = 'rutas';
const CRU_COMP_DEF = ['URY', 'GTM'];
const CRU_CATS = [
  { key: 'cat', color: '#D8A68A', labelColor: '#A9714F', valColor: '#1A1A1A' },
  { key: 'evg', color: '#BE5D32', labelColor: '#9A4A26', valColor: '#FFFFFF' },
  { key: 'otr', color: '#B9B2A3', labelColor: '#8A8579' },
  { key: 'sin', color: '#33312C', labelColor: '#33312C', valColor: '#FFFFFF' }
];
let cru_ctl = null, cru_toggle = null;

// sel null = selección sin tocar (cada vista usa su default); un array = elegida por el lector (viaja entre vistas)
function cru_state() {
  if (!state[CRU_ID]) state[CRU_ID] = { sel: null, hidden: [], hover: null, vista: 'rutas' };
  return state[CRU_ID];
}
function cru_isComp() { return cru_state().vista === 'comp'; }
function cru_eff() { const s = cru_state(); return s.sel ? s.sel : (cru_isComp() ? CRU_COMP_DEF.slice() : []); }
function cru_isDefault() { const s = cru_state(); return !cru_isComp() && !(s.sel && s.sel.length); }
function cru_cats() {
  const lab = { cat: 'rel-cat', evg: 'rel-evg', otr: 'rel-otr', sin: 'rel-sin' };
  return CRU_CATS.map(c => Object.assign({ label: t(lab[c.key]) }, c));
}
function cru_panels() {
  const cats = cru_cats();
  return cru_eff().filter(k => REL_RUTAS.comp[k]).map(k => {
    const d = REL_RUTAS.comp[k];
    return { key: k, label: br_name(k), w: d.w, tot: d.w.map((_, i) => d.cat[i] + d.evg[i] + d.otr[i] + d.sin[i]),
             cats: cats.map(c => Object.assign({ vals: d[c.key] }, c)) };
  });
}
function cru_period() {
  const ds = cru_eff().map(k => REL_RUTAS.comp[k]).filter(Boolean);
  if (!ds.length) return '';
  return Math.min.apply(null, ds.map(d => d.w[0])) + '-' + Math.max.apply(null, ds.map(d => d.w[d.w.length - 1]));
}
// elegir un país desde la vista de las rutas abre su composición
function cru_pick(k) {
  const s = cru_state(), cur = cru_eff();
  if (cur.indexOf(k) < 0) cur.push(k);
  s.sel = cur;
  s.vista = 'comp';
  if (cru_toggle) cru_toggle.sync();
  cru_ctl.selector.render();
  drawCru();
}

function drawCru() {
  const s = cru_state(), id = CRU_ID;
  const svg = document.getElementById('chart' + id);
  if (!svg) return;
  const hint = document.getElementById('rutas-hint');
  if (hint) {
    hint.style.display = cru_isComp() ? 'none' : '';
    // en touch el tap en un punto solo muestra el tooltip (criterio de la casa): la pista nombra solo el buscador
    hint.textContent = t((typeof HAS_HOVER !== 'undefined' && !HAS_HOVER) ? 'cru-hint-touch' : 'cru-hint');
  }
  if (!cru_isComp()) {
    atlasSetHeading(id, cru_isDefault(), { title: 'cru-title', titleNeutral: 'cru-title-neutral' });
    brSetSubtitle(id, t('cru-sub'));
    rs_draw(cru_ctl);
  } else {
    atlasSetHeading(id, false, { title: 'cru-title', titleNeutral: 'cru-title-comp' });
    const panels = cru_panels(), P = cru_period();
    // sin países elegidos no hay período: el subtítulo queda en la medición, sin la coma colgando
    brSetSubtitle(id, (panels.length === 1 ? t('cru-sub-comp-lugar').replace('{L}', panels[0].label) : t('cru-sub-comp'))
      .replace('{P}', P).replace(/,\s*$/, ''));
    svg.onclick = null;
    relStack({
      svg, id, L: rel_layout(id), panels, cats: cru_cats(),
      yFmt: (v) => br_fmt(v, 0) + '%', ttFmt: (v) => br_fmt(v, 1) + '%',
      totalLabel: t('rel-total'), emptyText: t('cru-vacio')
    });
    // las cuatro categorías suman 100: el "Total 100%" arriba de la pila no dice nada y se saca
    const tot = t('rel-total') + ' ';
    svg.querySelectorAll('text').forEach(el => { if (el.textContent.indexOf(tot) === 0) el.remove(); });
  }
  if (cru_ctl.urlWired) {
    const eff = cru_eff();
    atlasSyncUrlTodoONada(
      { vista: cru_isComp() ? 'composicion' : 'rutas', paises: cru_isComp() ? (eff.length ? brList(eff) : '-') : brList(s.sel || []) },
      { vista: 'rutas', paises: '' });
  }
}
function cru_applyUrl() {
  const s = cru_state();
  const v = atlasUrlParam('vista');
  if (v === 'composicion') s.vista = 'comp';
  const p = atlasUrlParam('paises');
  if (p != null) {
    const ks = brParseList(p, (k) => !!REL_RUTAS.comp[k.toUpperCase()]);
    if (ks && (ks.length || p === '-')) s.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  cru_ctl.urlWired = true;
  if (cru_toggle) cru_toggle.sync();
  cru_ctl.selector.render();
  drawCru();
}

function initCru() {
  const s = cru_state();
  const pts = REL_RUTAS.pts.map(p => Object.assign({ r: RS_LATAM }, p));
  cru_ctl = rs_ctl({
    id: CRU_ID, pts: () => pts, legend: false, softLabels: true, fit: null,
    selOf: () => s.sel || [],
    onPointClick: cru_pick,
    xLog: false, xDomain: [-4, 33], xTicks: [0, 5, 10, 15, 20, 25, 30], xFmt: (v) => br_fmt(v, 0),
    yDomain: [-4, 31], yTicks: [0, 5, 10, 15, 20, 25, 30], yFmt: (v) => br_fmt(v, 0),
    diag: [-2, 32],
    corners: [{ key: 'cru-ruta-secular', pos: 'tl' }, { key: 'cru-ruta-evangelica', pos: 'br' }],
    keys: { axisX: 'cru-axis-x', axisY: 'cru-axis-y' },
    tt: (p, ctl) => {
      const fila = (lab, a, b, d) => [lab, br_fmt(a, 0) + '% → ' + br_fmt(b, 0) + '% (' + rs_signed(d, 1) + ')'];
      return rs_ttHTML(ctl, p, [
        fila(t('rel-evg'), p.e0, p.e1, p.x),
        fila(t('rel-sin'), p.s0, p.s1, p.v),
        fila(t('rel-cat'), p.c0, p.c1, p.c),
        [t('cru-tt-olas'), p.d0 + ' → ' + p.d1, true]
      ], [(typeof HAS_HOVER === 'undefined' || HAS_HOVER) ? t('cru-tt-click') : null]);
    }
  });
  cru_ctl.draw = drawCru;
  cru_ctl.selector = brSelector({
    pre: CRU_ID, get: cru_eff, focusAll: true,
    set: (a) => {
      const antes = cru_eff();
      s.sel = a;
      // elegir un país en la vista de las rutas abre su composición (quitar uno, no)
      if (!cru_isComp() && a.some(k => antes.indexOf(k) < 0)) { s.vista = 'comp'; if (cru_toggle) cru_toggle.sync(); }
    },
    onChange: drawCru, placeholderKey: 'sc-search-ph',
    universe: () => pts.map(p => ({ key: p.k, label: br_name(p.k) })).sort((a, b) => a.label.localeCompare(b.label, br_lang())),
    label: br_name, color: () => REGION_COLORS[RS_LATAM]
  });
  cru_toggle = brToggle({
    el: 'rutas-vista', get: () => s.vista, set: (v) => { s.vista = v; },
    onChange: () => { s.hover = null; cru_ctl.selector.render(); drawCru(); }
  });
  brRegister(CRU_ID, drawCru, () => (cru_isComp() && cru_period()) ? t('cru-png-source-comp').replace('{P}', cru_period()) : t('cru-png-source'));
  brCsv('button.download[data-chart="' + CRU_ID + '-csv"]', () => {
    const ks = REL_RUTAS.pts.map(p => p.k).sort();
    if (cru_isComp()) {
      const rows = [];
      ks.forEach(k => {
        const d = REL_RUTAS.comp[k];
        d.w.forEach((w, i) => rows.push([k, rs_nameIn(k, 'es'), rs_nameIn(k, 'en'), w, d.cat[i], d.evg[i], d.otr[i], d.sin[i]]));
      });
      return {
        headers: {
          es: ['codigo', 'pais', 'pais_en', 'anio', 'catolicos_pct', 'evangelicos_pct', 'otras_religiones_pct', 'sin_religion_pct'],
          en: ['code', 'country_es', 'country', 'year', 'catholics_pct', 'evangelicals_pct', 'other_religions_pct', 'no_religion_pct']
        },
        rows, file: { es: 'el-atlas-religion-composicion-por-anio.csv', en: 'the-atlas-religion-makeup-by-year.csv' }
      };
    }
    const rows = REL_RUTAS.pts.slice().sort((a, b) => a.k.localeCompare(b.k)).map(p =>
      [p.k, rs_nameIn(p.k, 'es'), rs_nameIn(p.k, 'en'), p.d0, p.d1, p.c0, p.c1, p.c, p.e0, p.e1, p.x, p.s0, p.s1, p.v]);
    return {
      headers: {
        es: ['codigo', 'pais', 'pais_en', 'olas_inicio', 'olas_fin', 'catolicos_inicio_pct', 'catolicos_fin_pct', 'cambio_catolicos_puntos',
             'evangelicos_inicio_pct', 'evangelicos_fin_pct', 'cambio_evangelicos_puntos', 'sin_religion_inicio_pct', 'sin_religion_fin_pct',
             'cambio_sin_religion_puntos'],
        en: ['code', 'country_es', 'country', 'start_waves', 'end_waves', 'catholics_start_pct', 'catholics_end_pct', 'change_in_catholics_points',
             'evangelicals_start_pct', 'evangelicals_end_pct', 'change_in_evangelicals_points', 'no_religion_start_pct', 'no_religion_end_pct',
             'change_in_no_religion_points']
      },
      rows, file: { es: 'el-atlas-religion-dos-rutas.csv', en: 'the-atlas-religion-two-routes.csv' }
    };
  });
  rs_wireGlobal(cru_ctl);
  cru_applyUrl();
}
function cru_onLang() { cru_ctl.selector.render(); drawCru(); }
