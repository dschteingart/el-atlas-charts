// Chart 10 — Homicidios por 100.000 habitantes. Vista países (Brasil: IPEA/SIM 1980-2024; resto: UNODC;
// mundo: OWID sobre UNODC) o vista regiones de Brasil (IPEA). Datos: BR_HOM (data-homicidios.js).
const C10_REG = ['Norte', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste'];
const C10_REGCOL = { Norte: '#2D6A3D', Nordeste: '#7A2A3F', Sudeste: '#234B85', Sul: '#2C8484', 'Centro-Oeste': '#C9A227' };
const C10_DEF = { v: 'paises', sel: ['BRA', 'MEX', 'COL', 'USA', 'ARG', 'WLD'], p: [1980, 2024] };
let c10_urlWired = false, c10_selector = null, c10_period = null, c10_tog = null;

function c10_state() {
  if (!state[10]) state[10] = { v: C10_DEF.v, sel: C10_DEF.sel.slice(), p: C10_DEF.p.slice() };
  return state[10];
}
function c10_isDefault(s) { return s.v === C10_DEF.v && s.p[0] === C10_DEF.p[0] && s.p[1] === C10_DEF.p[1] && brSameList(s.sel, C10_DEF.sel); }
function c10_clip(pts, s) { return pts.filter(p => p[0] >= s.p[0] && p[0] <= s.p[1]); }
function c10_series(s) {
  if (s.v === 'regiones') {
    return [{ key: 'BRA', label: br_name('BRA'), color: BR_C.brasil, main: true, pts: c10_clip(BR_HOM.paises.BRA, s) }]
      .concat(C10_REG.map(r => ({ key: r, label: br_t('reg-' + r), color: C10_REGCOL[r], pts: c10_clip(BR_HOM.regiones[r] || [], s) })));
  }
  return s.sel.filter(k => BR_HOM.paises[k]).map(k => ({ key: k, label: br_name(k), color: br_color(s, k), main: k === 'BRA', dash: k === 'WLD', pts: c10_clip(BR_HOM.paises[k], s) }));
}
function drawC10() {
  const s = c10_state(), svg = document.getElementById('chart10');
  if (!svg) return;
  const L = br_layout();
  const series = c10_series(s);
  const all = series.flatMap(x => x.pts.map(p => p[1]));
  const yMax = Math.max(10, Math.ceil(Math.max.apply(null, all.concat([10])) * 1.06 / 10) * 10);
  brLines({
    svg, id: '10', L, series, x0: s.p[0], x1: s.p[1], yMin: 0, yMax,
    yFmt: (v) => br_fmt(v, 0), yTitle: br_t('c10-ytitle'), tol: 0, ttDec: 1, ttSuffix: '',
    endValue: (ser, last) => br_fmt(last[1], 1)
  });
  atlasSetHeading('10', c10_isDefault(s), { title: 'c10-title', titleNeutral: s.v === 'regiones' ? 'c10-title-neutral-reg' : 'c10-title-neutral' });
  brSetSubtitle('10', br_t('c10-sub').replace('{P}', s.p[0] + '-' + s.p[1]));
  const box = document.getElementById('c10-ctl-paises'); if (box) box.style.display = s.v === 'paises' ? 'contents' : 'none';
  c10_syncUrl();
}
function c10_syncUrl() {
  if (!c10_urlWired) return;
  const s = c10_state();
  atlasSyncUrlTodoONada(
    { vista: s.v, paises: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1] },
    { vista: C10_DEF.v, paises: brList(C10_DEF.sel), periodo: C10_DEF.p[0] + '~' + C10_DEF.p[1] });
}
function c10_applyUrl() {
  const s = c10_state();
  const v = atlasUrlParam('vista'); if (v === 'paises' || v === 'regiones') s.v = v;
  const ps = brParseList(atlasUrlParam('paises'), (k) => !!BR_HOM.paises[k.toUpperCase()]); if (ps) s.sel = ps.map(k => k.toUpperCase());
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 1980 && b <= 2024 && a < b) s.p = [a, b]; }
  c10_urlWired = true;
  c10_tog.sync(); c10_period.sync(); c10_selector.render(); drawC10();
}
function initC10() {
  const s = c10_state();
  c10_tog = brToggle({ el: 'c10-vista', get: () => s.v, set: (v) => { s.v = v; }, onChange: drawC10 });
  c10_period = brPeriod({ pre: 'c10', min: 1980, max: 2024, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC10 });
  c10_selector = brSelector({
    pre: 'c10', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC10,
    color: (k) => br_color(s, k), label: br_name,
    universe: () => Object.keys(BR_HOM.paises).map(k => ({ key: k, label: br_name(k) })).sort((a, b) => a.label.localeCompare(b.label, br_lang()))
  });
  brRegister('10', drawC10, 'c10-png-source');
  brCsv('button.download[data-chart="10-csv"]', () => {
    const rows = [];
    c10_series(s).forEach(ser => ser.pts.forEach(p => rows.push([ser.key, ser.label, p[0], p[1]])));
    return {
      headers: { es: ['codigo', 'pais_o_region', 'anio', 'homicidios_por_100_mil'], en: ['code', 'country_or_region', 'year', 'homicides_per_100k'] },
      rows, file: { es: 'el-atlas-brasil-homicidios.csv', en: 'the-atlas-brazil-homicides.csv' }
    };
  });
  drawC10();
  c10_applyUrl();
}
function c10_onLang() { c10_selector.render(); drawC10(); }
