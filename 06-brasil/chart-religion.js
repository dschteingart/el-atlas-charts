// Chart 8 — Religión en los censos de Brasil. Dos vistas:
//   censos: católicos, evangélicos, sin religión y otras, 1872-2022 (puntos = censos; sin censo
//           comparable entre 1890 y 1940, la línea se corta);
//   edad:   % de una religión por grupo de edad, comparando censos (1991, 2000, 2010, 2022).
// Datos: BR_REL (data-religion.js).
const C8_REL = { cat: '#234B85', evg: '#BE5D32', sin: '#2C8484', otr: '#8A8579' };
const C8_SHADES = {
  cat: { 1991: '#A3B1C8', 2000: '#7F93B5', 2010: '#53699A', 2022: '#234B85' },
  evg: { 1991: '#E2B39E', 2000: '#D8946F', 2010: '#CB7A55', 2022: '#BE5D32' },
  sin: { 1991: '#A6CFCF', 2000: '#77B3B3', 2010: '#4A9898', 2022: '#2C8484' }
};
// etiquetas de los censos viejos en un tono legible sobre el fondo (la línea queda clara)
const C8_LABEL = { cat: '#6F84A8', evg: '#C08A72', sin: '#4F9E9E' };
const C8_EDADES = { es: ['10-14', '15-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'], en: ['10-14', '15-19', '20-24', '25-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'] };
const C8_DEF = { v: 'censos', p: [1872, 2022], rel: 'cat', censos: ['1991', '2022'] };
let c8_urlWired = false, c8_selector = null, c8_period = null, c8_togV = null, c8_togR = null;

function c8_state() {
  if (!state[8]) state[8] = { v: C8_DEF.v, p: C8_DEF.p.slice(), rel: C8_DEF.rel, censos: C8_DEF.censos.slice() };
  return state[8];
}
function c8_isDefault(s) { return s.v === 'censos' && s.p[0] === C8_DEF.p[0] && s.p[1] === C8_DEF.p[1]; }
function c8_censosSeries(s) {
  return ['cat', 'evg', 'sin', 'otr'].map(k => {
    const pts = [];
    BR_REL.censos[k].filter(p => p[0] >= s.p[0] && p[0] <= s.p[1]).forEach((p, i, arr) => {
      // la línea une 1890 con 1940 (no hubo censo comparable en el medio); los puntos marcan cada censo
      pts.push([p[0], p[1]]);
    });
    return { key: k, label: br_t('rel-' + k), color: C8_REL[k], labelColor: k === 'otr' ? '#8A8579' : null, main: k === 'cat' || k === 'evg', dots: true, pts };
  });
}
function drawC8() {
  const s = c8_state(), svg = document.getElementById('chart8');
  if (!svg) return;
  document.getElementById('c8-ctl-censos').style.display = s.v === 'censos' ? 'contents' : 'none';
  document.getElementById('c8-ctl-rel').style.display = s.v !== 'censos' ? 'contents' : 'none';
  document.getElementById('c8-ctl-edad').style.display = s.v === 'edad' ? 'contents' : 'none';
  const gen = br_t('rel-gen-' + s.rel);
  if (s.v === 'censos') {
    const L = br_layout();
    brLines({
      svg, id: '8', L, series: c8_censosSeries(s), x0: s.p[0], x1: s.p[1], yMin: 0, yMax: 100,
      yTicks: [0, 20, 40, 60, 80, 100], xTicks: [1872, 1890, 1940, 1960, 1980, 2000, 2022].filter(x => x >= s.p[0] && x <= s.p[1]),
      yFmt: (v) => br_fmt(v, 0) + '%', yTitle: br_t('c8-ytitle-censos'), tol: 0, ttDec: 1, ttSuffix: '%',
      endValue: (ser, last) => br_fmt(last[1], 0) + '%'
    });
    atlasSetHeading('8', c8_isDefault(s), { title: 'c8-title-censos', titleNeutral: 'c8-title-neutral-censos' });
    brSetSubtitle('8', br_t('c8-sub-censos').replace('{P}', s.p[0] + '-' + s.p[1]));
  } else if (s.v === 'edad') {
    const L = br_layout();
    const series = s.censos.slice().sort().map(y => ({
      key: 'c' + y, label: y, color: C8_SHADES[s.rel][y], labelColor: (y === '1991' || y === '2000') ? C8_LABEL[s.rel] : null, main: y === '2022', dots: true,
      pts: (BR_REL.edad[s.rel][y] || []).map((v, i) => [i, v])
    }));
    const all = series.flatMap(x => x.pts.map(p => p[1]));
    brLines({
      svg, id: '8', L, series, x0: -0.3, x1: 9.3, yMin: 0, yMax: Math.max(20, Math.ceil(Math.max.apply(null, all.concat([10])) * 1.1 / 10) * 10),
      xTicks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], xLabel: (v) => C8_EDADES[br_lang()][v] || '',
      yFmt: (v) => br_fmt(v, 0) + '%', yTitle: br_t('c8-ytitle-edad'), tol: 0, ttDec: 1, ttSuffix: '%', ttYearLabel: (i) => C8_EDADES[br_lang()][i],
      endValue: (ser, last) => br_fmt(last[1], 0) + '%'
    });
    atlasSetHeading('8', false, { title: 'c8-title-edad', titleNeutral: 'c8-title-neutral-edad' });
    const cs = s.censos.slice().sort(), y_ = br_lang() === 'en' ? ' and ' : ' y ';
    brSetSubtitle('8', br_t('c8-sub-edad').replace('{R}', gen).replace('{C}', cs.length > 1 ? cs.slice(0, -1).join(', ') + y_ + cs[cs.length - 1] : cs.join('')));
  }
  c8_syncUrl();
}
function c8_syncUrl() {
  if (!c8_urlWired) return;
  const s = c8_state();
  atlasSyncUrlTodoONada(
    { vista: s.v, periodo: s.p[0] + '~' + s.p[1], religion: s.rel, censos: s.censos.length ? brList(s.censos) : '-' },
    { vista: C8_DEF.v, periodo: C8_DEF.p[0] + '~' + C8_DEF.p[1], religion: C8_DEF.rel, censos: brList(C8_DEF.censos) });
}
function c8_applyUrl() {
  const s = c8_state();
  const v = atlasUrlParam('vista'); if (['censos', 'edad'].indexOf(v) >= 0) s.v = v;
  const r = atlasUrlParam('religion'); if (C8_SHADES[r]) s.rel = r;
  const cs = brParseList(atlasUrlParam('censos'), (k) => ['1991', '2000', '2010', '2022'].indexOf(k) >= 0); if (cs) s.censos = cs;
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 1872 && b <= 2022 && a < b) s.p = [a, b]; }
  c8_urlWired = true;
  c8_togV.sync(); c8_togR.sync(); c8_period.sync(); c8_selector.render();
  drawC8();
}
function initC8() {
  const s = c8_state();
  c8_togV = brToggle({ el: 'c8-vista', get: () => s.v, set: (v) => { s.v = v; }, onChange: drawC8 });
  c8_togR = brToggle({ el: 'c8-rel', get: () => s.rel, set: (v) => { s.rel = v; }, onChange: () => { c8_selector.render(); drawC8(); } });
  c8_period = brPeriod({ pre: 'c8', min: 1872, max: 2022, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC8 });
  c8_selector = brSelector({
    pre: 'c8', get: () => s.censos, set: (a) => { s.censos = a; }, onChange: drawC8, placeholderKey: 'c8-add-ph', focusAll: true,
    color: (k) => C8_SHADES[s.rel][k], label: (k) => k,
    universe: () => ['1991', '2000', '2010', '2022'].map(k => ({ key: k, label: k }))
  });
  brRegister('8', drawC8, 'c8-png-source');
  brCsv('button.download[data-chart="8-csv"]', () => {
    const rows = [];
    ['cat', 'evg', 'sin', 'otr'].forEach(k => BR_REL.censos[k].forEach(p => rows.push([br_t('c8-v-censos'), br_t('rel-' + k), p[0], br_t('c8-todas'), p[1]])));
    ['cat', 'evg', 'sin'].forEach(k => Object.keys(BR_REL.edad[k]).forEach(y => BR_REL.edad[k][y].forEach((v, i) => rows.push([br_t('c8-v-edad'), br_t('rel-' + k), +y, C8_EDADES.es[i], v]))));
    return {
      headers: { es: ['vista', 'religion', 'anio_censo', 'grupo_de_edad', 'pct'], en: ['view', 'religion', 'census_year', 'age_group', 'pct'] },
      rows, file: { es: 'el-atlas-brasil-religion.csv', en: 'the-atlas-brazil-religion.csv' }
    };
  });
  drawC8();
  c8_applyUrl();
}
function c8_onLang() { c8_selector.render(); drawC8(); }
