// Chart 6 — Demografía: fecundidad, esperanza de vida o edad mediana, 1950-2023 (+ proyección ONU).
// Datos: BR_DEMO (data-demografia.js), UN World Population Prospects 2024, variante media.
// years = 1950..2023 anual + 2025..2100 cada 5 años; lastObs = 2023.
const C6_DEF = { ind: 'TFR', proy: 'no', sel: ['BRA', 'WLD', 'USA'], p: [1950, 2023] };
let c6_urlWired = false, c6_selector = null, c6_period = null, c6_togI = null, c6_togP = null;

function c6_state() {
  if (!state[6]) state[6] = { ind: C6_DEF.ind, proy: C6_DEF.proy, sel: C6_DEF.sel.slice(), p: C6_DEF.p.slice() };
  return state[6];
}
function c6_max(s) { return s.proy === 'si' ? 2100 : 2023; }
function c6_label(k) {
  if (BR_DEMO.aggNames[k]) return BR_DEMO.aggNames[k][br_lang() === 'en' ? 1 : 0];
  const n = br_name(k); return n === k ? (BR_DEMO.names[k] || k) : n;
}
function c6_isDefault(s) {
  return s.ind === C6_DEF.ind && s.proy === C6_DEF.proy && s.p[0] === C6_DEF.p[0] && s.p[1] === C6_DEF.p[1] && brSameList(s.sel, C6_DEF.sel);
}
function c6_series(s) {
  const yrs = BR_DEMO.years, src = BR_DEMO.ind[s.ind];
  return s.sel.filter(k => src[k]).map(k => ({
    key: k, label: c6_label(k), color: br_color(s, k), main: k === 'BRA', dash: k === 'WLD',
    pts: yrs.map((y, i) => (y < s.p[0] || y > s.p[1] || src[k][i] == null) ? null : [y, src[k][i]]).filter(Boolean)
  }));
}
function drawC6() {
  const s = c6_state(), svg = document.getElementById('chart6');
  if (!svg) return;
  const L = br_layout();
  const series = c6_series(s);
  const all = series.flatMap(x => x.pts.map(p => p[1]));
  const dec = s.ind === 'TFR' ? 1 : 0;
  let yMin = 0, yMax;
  if (s.ind === 'TFR') yMax = Math.max(3, Math.ceil(Math.max.apply(null, all.concat([2])) + 0.3));
  else if (s.ind === 'LEx') { yMin = Math.max(0, Math.floor((Math.min.apply(null, all.concat([90])) - 5) / 10) * 10); yMax = Math.ceil((Math.max.apply(null, all.concat([60])) + 3) / 10) * 10; }
  else yMax = Math.ceil((Math.max.apply(null, all.concat([20])) + 3) / 10) * 10;
  brLines({
    svg, id: '6', L, series, x0: s.p[0], x1: s.p[1], yMin, yMax,
    yFmt: (v) => br_fmt(v, s.ind === 'TFR' && v % 1 ? 1 : 0), yTitle: br_t('c6-ytitle-' + s.ind),
    tol: s.proy === 'si' ? 2 : 0, ttDec: s.ind === 'TFR' ? 2 : 1, ttSuffix: '',
    proj: (s.proy === 'si' && s.p[1] > BR_DEMO.lastObs) ? BR_DEMO.lastObs : null, projLabel: br_t('proyeccion'),
    refLines: s.ind === 'TFR' ? [{ y: 2.1, label: br_t('c6-reemplazo') }] : [],
    endValue: (ser, last) => br_fmt(last[1], s.ind === 'TFR' ? 1 : 0)
  });
  atlasSetHeading('6', c6_isDefault(s), { title: 'c6-title', titleNeutral: 'c6-title-neutral-' + s.ind });
  brSetSubtitle('6', br_t('c6-sub-' + s.ind).replace('{P}', s.p[0] + '-' + s.p[1]) + (s.proy === 'si' && s.p[1] > 2023 ? br_t('c6-sub-proy') : ''));
  c6_syncUrl();
}
function c6_syncUrl() {
  if (!c6_urlWired) return;
  const s = c6_state();
  atlasSyncUrlTodoONada(
    { indicador: s.ind, proyeccion: s.proy, paises: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1] },
    { indicador: C6_DEF.ind, proyeccion: C6_DEF.proy, paises: brList(C6_DEF.sel), periodo: C6_DEF.p[0] + '~' + C6_DEF.p[1] });
}
function c6_applyUrl() {
  const s = c6_state();
  const i = atlasUrlParam('indicador'); if (i && BR_DEMO.ind[i]) s.ind = i;
  const pr = atlasUrlParam('proyeccion'); if (pr === 'si' || pr === 'no') s.proy = pr;
  const ps = brParseList(atlasUrlParam('paises'), (k) => !!BR_DEMO.ind.TFR[k.toUpperCase()]);
  if (ps) s.sel = ps.map(k => k.toUpperCase());
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 1950 && b <= c6_max(s) && a < b) s.p = [a, b]; }
  c6_urlWired = true;
  c6_togI.sync(); c6_togP.sync(); c6_period.sync(); c6_selector.render(); drawC6();
}
function initC6() {
  const s = c6_state();
  c6_togI = brToggle({ el: 'c6-ind', get: () => s.ind, set: (v) => { s.ind = v; }, onChange: drawC6 });
  // Proyección: al activarla el período se extiende a 2100; al apagarla vuelve a 2023.
  c6_togP = brToggle({ el: 'c6-proy', get: () => s.proy, set: (v) => {
    s.proy = v;
    if (v === 'si' && s.p[1] === 2023) s.p[1] = 2100;
    if (s.p[1] > c6_max(s)) s.p[1] = c6_max(s);
    if (s.p[0] >= s.p[1]) s.p[0] = 1950;
  }, onChange: () => { c6_period.sync(); drawC6(); } });
  c6_period = brPeriod({ pre: 'c6', min: 1950, max: () => c6_max(s), get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC6 });
  c6_selector = brSelector({
    pre: 'c6', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC6,
    color: (k) => br_color(s, k), label: c6_label,
    universe: () => Object.keys(BR_DEMO.ind.TFR).map(k => ({ key: k, label: c6_label(k) })).sort((a, b) => a.label.localeCompare(b.label, br_lang()))
  });
  brRegister('6', drawC6, 'c6-png-source');
  brCsv('button.download[data-chart="6-csv"]', () => {
    const rows = [];
    c6_series(s).forEach(ser => ser.pts.forEach(p => rows.push([ser.key, c6_label(ser.key), p[0], p[1], p[0] > BR_DEMO.lastObs ? 'proyeccion' : 'estimacion'])));
    return {
      headers: { es: ['codigo', 'pais', 'anio', br_t('c6-i-' + s.ind).toLowerCase(), 'tipo'], en: ['code', 'country', 'year', s.ind, 'type'] },
      rows, file: { es: 'el-atlas-brasil-demografia.csv', en: 'the-atlas-brazil-demography.csv' }
    };
  });
  drawC6();
  c6_applyUrl();
}
function c6_onLang() { c6_selector.render(); drawC6(); }
