// Practicantes por religión (Latinobarómetro, 1996-2024): porcentaje de adultos que se declaran practicantes o muy
// practicantes, apilado según religión (católicos, evangélicos, otras); el borde de arriba es el total de practicantes.
// Selección de la casa (buscador + chips, multiselección, Limpiar): un panel = vista grande con etiquetas a la derecha;
// dos o más = paneles chicos con la misma escala (relStack, rel-motor.js).
// Toggle de suavizado (toggle de la casa, brToggle): "Cada ola" (de fábrica) o "Promedio móvil de 3 olas", centrado,
// por banda y por panel, con las vecinas que haya en las puntas. Lo que se dibuja (bandas, valores, totales, tooltip)
// sale de los valores suavizados; el CSV suma columnas suavizadas a las de cada ola. Es un cambio de vista, no de
// selección: con la selección de fábrica el título sigue siendo el hallazgo (como los toggles de escala).
// Datos: REL_PRAC (data-practicantes.js). Vista compartible: ?sel=ARG~BRA&media=movil (- = selección vacía).
const CPRAC_ID = 'prac';
const CPRAC_CATS = [
  { key: 'cat', color: '#D8A68A', labelColor: '#A9714F', valColor: '#1A1A1A' },
  { key: 'evg', color: '#BE5D32', labelColor: '#9A4A26', valColor: '#FFFFFF' },
  { key: 'otr', color: '#B9B2A3', labelColor: '#8A8579' }
];
const CPRAC_DEF = ['LATAM'];
// chips: los agregados en tinta; los países en terracota (todos son de América Latina)
const CPRAC_CHIP = { agg: '#1A1A1A', pais: '#BE5D32' };
let cprac_urlWired = false, cprac_selector = null, cprac_toggle = null;

// media: 'ola' (cada ola, de fábrica) | 'movil' (promedio móvil de 3 olas)
function cprac_state() { if (!state[CPRAC_ID]) state[CPRAC_ID] = { sel: CPRAC_DEF.slice(), media: 'ola' }; return state[CPRAC_ID]; }
function cprac_isMovil(s) { return s.media === 'movil'; }
// Promedio móvil centrado de 3 olas: cada ola con la anterior y la siguiente; en las puntas, con la única vecina.
// Las olas no son anuales (2011 → 2013, 2020 → 2024): se promedia por posición, nunca por año.
function cprac_smooth(v) {
  return v.map((_, i) => {
    const win = v.slice(Math.max(0, i - 1), i + 2).filter(x => x != null);
    return win.length ? win.reduce((a, b) => a + b, 0) / win.length : null;
  });
}
// Las tres bandas de un panel tal como se dibujan; el total es la suma de las bandas (cuadra con la pila).
function cprac_series(d, movil) {
  if (!movil) return { cat: d.cat, evg: d.evg, otr: d.otr, tot: d.tot };
  const o = { cat: cprac_smooth(d.cat), evg: cprac_smooth(d.evg), otr: cprac_smooth(d.otr) };
  o.tot = o.cat.map((v, i) => v + o.evg[i] + o.otr[i]);
  return o;
}
function cprac_isDefault(s) { return brSameList(s.sel, CPRAC_DEF); }
function cprac_isAgg(k) { return REL_PRAC.agg.indexOf(k) >= 0; }
function cprac_name(k) { return cprac_isAgg(k) ? t('geo-' + k) : br_name(k); }
function cprac_universe() {
  const paises = REL_PRAC.paises.map(k => ({ key: k, label: cprac_name(k) }))
    .sort((a, b) => a.label.localeCompare(b.label, br_lang()));
  return REL_PRAC.agg.map(k => ({ key: k, label: cprac_name(k), tag: t('geo-tag-' + k) })).concat(paises);
}
function cprac_cats() { return CPRAC_CATS.map(c => Object.assign({ label: t('rel-' + c.key) }, c)); }
function cprac_panels(s) {
  const cats = cprac_cats();
  return s.sel.filter(k => REL_PRAC.data[k]).map(k => {
    const d = REL_PRAC.data[k], v = cprac_series(d, cprac_isMovil(s));
    return { key: k, label: cprac_name(k), w: d.w, tot: v.tot, cats: cats.map(c => Object.assign({ vals: v[c.key] }, c)) };
  });
}
// período del dato real de la selección (Venezuela sola: 1996-2020)
function cprac_period(s) {
  const ds = s.sel.map(k => REL_PRAC.data[k]).filter(Boolean);
  if (!ds.length) return '1996-2024';
  return Math.min.apply(null, ds.map(d => d.w[0])) + '-' + Math.max.apply(null, ds.map(d => d.w[d.w.length - 1]));
}
function drawCprac() {
  const s = cprac_state(), svg = document.getElementById('chart' + CPRAC_ID);
  if (!svg) return;
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  atlasSetHeading(CPRAC_ID, cprac_isDefault(s), { title: 'cprac-title', titleNeutral: 'cprac-title-neutral' });
  const P = cprac_period(s);
  // con un solo panel que no es el de fábrica, el subtítulo dice de dónde es el dato (el PNG no lleva chips)
  const lugar = (s.sel.length === 1 && !cprac_isDefault(s)) ? cprac_name(s.sel[0]) : null;
  // el suavizado se nombra en el subtítulo (viaja al PNG, que no lleva el toggle)
  const sub = (lugar ? t('cprac-sub-lugar').replace('{L}', lugar) : t('cprac-sub')).replace('{P}', P);
  brSetSubtitle(CPRAC_ID, cprac_isMovil(s) ? sub + ' ' + t('cprac-sub-movil') : sub);
  relStack({
    svg, id: CPRAC_ID, L: rel_layout(CPRAC_ID), panels: cprac_panels(s), cats: cprac_cats(),
    yFmt: (v) => br_fmt(v, 0) + '%', ttFmt: (v) => br_fmt(v, 1) + '%',
    totalLabel: t('rel-total'), emptyText: t('cprac-vacio'),
    ttNote: cprac_isMovil(s) ? t('cprac-tt-movil') : null
  });
  if (cprac_urlWired) atlasSyncUrlTodoONada({ sel: s.sel.length ? brList(s.sel) : '-', media: s.media },
                                           { sel: brList(CPRAC_DEF), media: 'ola' });
}
function cprac_applyUrl() {
  const s = cprac_state();
  const v = atlasUrlParam('sel');
  if (v != null) {
    const ks = brParseList(v, (k) => !!REL_PRAC.data[k.toUpperCase()]);
    // '-' = selección vacía a propósito; una lista sin ningún código válido no pisa el default
    if (ks && (ks.length || v === '-')) s.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  const m = atlasUrlParam('media');
  if (m === 'movil' || m === 'ola') s.media = m;
  cprac_urlWired = true;
  if (cprac_toggle) cprac_toggle.sync();
  cprac_selector.render();
  drawCprac();
}
function initCprac() {
  const s = cprac_state();
  cprac_selector = brSelector({
    pre: CPRAC_ID, get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawCprac, focusAll: true,
    placeholderKey: 'rel-search-ph', universe: cprac_universe, label: cprac_name,
    color: (k) => cprac_isAgg(k) ? CPRAC_CHIP.agg : CPRAC_CHIP.pais
  });
  cprac_toggle = brToggle({ el: 'prac-media', get: () => s.media, set: (v) => { s.media = v; }, onChange: drawCprac });
  brRegister(CPRAC_ID, drawCprac, () => t('cprac-png-source').replace('{P}', cprac_period(s)));
  // CSV: siempre los valores de cada ola; con el promedio móvil prendido, además las columnas suavizadas (lo dibujado)
  brCsv('button.download[data-chart="' + CPRAC_ID + '-csv"]', () => {
    const rows = [], movil = cprac_isMovil(s);
    const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
    const nm = (k, L) => cprac_isAgg(k) ? I18N[L]['geo-' + k] : ((typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? COUNTRY_NAMES[k][L] : k);
    REL_PRAC.agg.concat(REL_PRAC.paises).forEach(k => {
      const d = REL_PRAC.data[k], m = movil ? cprac_series(d, true) : null;
      d.w.forEach((y, i) => rows.push([k, nm(k, 'es'), nm(k, 'en'), y, d.cat[i], d.evg[i], d.otr[i], d.tot[i]]
        .concat(m ? [r2(m.cat[i]), r2(m.evg[i]), r2(m.otr[i]), r2(m.tot[i])] : [])));
    });
    const hes = ['codigo', 'nombre', 'nombre_en', 'anio', 'catolicos_practicantes_pct', 'evangelicos_practicantes_pct', 'otras_religiones_practicantes_pct', 'total_practicantes_pct'];
    const hen = ['code', 'name_es', 'name', 'year', 'practicing_catholics_pct', 'practicing_evangelicals_pct', 'practicing_other_religions_pct', 'total_practicing_pct'];
    return {
      headers: {
        es: movil ? hes.concat(hes.slice(4).map(h => h + '_promedio_movil_3_olas')) : hes,
        en: movil ? hen.concat(hen.slice(4).map(h => h + '_3_wave_moving_average')) : hen
      },
      rows, file: movil ? { es: 'el-atlas-religion-practicantes-promedio-movil.csv', en: 'the-atlas-religion-practicing-moving-average.csv' }
                        : { es: 'el-atlas-religion-practicantes.csv', en: 'the-atlas-religion-practicing.csv' }
    };
  });
  cprac_applyUrl();
}
function cprac_onLang() { cprac_selector.render(); drawCprac(); }
