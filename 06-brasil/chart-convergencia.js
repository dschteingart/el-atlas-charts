// Chart 1 — Convergencia: PIB per cápita como % de EE.UU. (o en US$ PPA, log), 1950-2025.
// Datos: BR_CONV (data-convergencia.js), según BR_CONV.variante (scripts/eje1_empalme_bm.py):
//   A (la del gráfico): Maddison 2023 (US$ 2011 PPA) hasta 2022, extendido con la variación del PIB per
//     cápita a precios constantes del Banco Mundial (NY.GDP.PCAP.KD) desde BR_CONV.empalme[pais] (2023);
//   B: Banco Mundial PPA 2021 desde 1990 y, antes, la variación de Maddison.
// 0 en empalme = país sin dato del BM para extender/empalmar. Mundo: promedio ponderado de los 145 países
// con datos continuos de Maddison (A: extendido con el agregado mundial del BM).
const C1_LAST = BR_CONV.years[BR_CONV.years.length - 1];
const C1_DEF = { sel: ['BRA', 'WLD', 'KOR', 'CHN', 'ARG', 'MEX'], m: 'pct', p: [1950, C1_LAST] };
let c1_urlWired = false, c1_selector = null, c1_period = null, c1_tog = null;

function c1_state() {
  if (!state[1]) state[1] = { sel: C1_DEF.sel.slice(), m: C1_DEF.m, p: C1_DEF.p.slice() };
  return state[1];
}
function c1_label(k) {
  const n = br_name(k);
  return (n === k && BR_CONV.mpdNames[k]) ? BR_CONV.mpdNames[k] : n;
}
// Fuente de cada tramo, para el CSV (según la variante del empalme).
const C1_A = BR_CONV.variante === 'A';
function c1_t(k) {
  const T = { es: { 'bm': 'Banco Mundial, WDI', 'maddison-var': 'Maddison 2023 (variación, empalmada al nivel del Banco Mundial)', 'maddison-cociente': 'Maddison 2023 (cociente con EE.UU.; sin dato del Banco Mundial)',
                    'mpd': 'Maddison Project Database 2023', 'mpd-ext': 'Maddison 2023 extendido con la variación del Banco Mundial' },
              en: { 'bm': 'World Bank, WDI', 'maddison-var': 'Maddison 2023 (growth, spliced to the World Bank level)', 'maddison-cociente': 'Maddison 2023 (ratio to the US; no World Bank data)',
                    'mpd': 'Maddison Project Database 2023', 'mpd-ext': 'Maddison 2023 extended with World Bank growth rates' } };
  return T[br_lang()][k];
}
function c1_tramo(e0, y) {
  if (C1_A) return (e0 && y >= e0) ? c1_t('mpd-ext') : c1_t('mpd');
  return !e0 ? c1_t('maddison-cociente') : (y >= e0 ? c1_t('bm') : c1_t('maddison-var'));
}
function c1_vals(k) { return k === 'WLD' ? BR_CONV.world : BR_CONV.gdppc[k]; }
function c1_isDefault(s) {
  return s.m === C1_DEF.m && s.p[0] === C1_DEF.p[0] && s.p[1] === C1_DEF.p[1] && brSameList(s.sel, C1_DEF.sel);
}
function c1_series(s) {
  const yrs = BR_CONV.years, usa = BR_CONV.gdppc.USA;
  return s.sel.filter(k => c1_vals(k)).map(k => {
    const v = c1_vals(k);
    const pts = yrs.map((y, i) => (y < s.p[0] || y > s.p[1] || v[i] == null) ? null : [y, s.m === 'pct' ? 100 * v[i] / usa[i] : v[i]]).filter(Boolean);
    return { key: k, label: c1_label(k), color: br_color(s, k), pts: pts, main: k === 'BRA', dash: k === 'WLD' };
  });
}
function drawC1() {
  const s = c1_state(), svg = document.getElementById('chart1');
  if (!svg) return;
  const L = br_layout();
  const series = c1_series(s);
  const all = series.flatMap(x => x.pts.map(p => p[1]));
  let yMin, yMax, yTicks = null;
  if (s.m === 'pct') {
    yMin = 0; yMax = Math.max(10, Math.ceil(((all.length ? Math.max.apply(null, all) : 50) * 1.06) / 10) * 10);
  } else {
    yMin = Math.pow(10, Math.floor(Math.log10(Math.max(100, all.length ? Math.min.apply(null, all) : 1000))));
    yMax = Math.pow(10, Math.ceil(Math.log10(all.length ? Math.max.apply(null, all) : 100000)));
    yTicks = br_logTicks(yMin, yMax);
  }
  const pctFmt = (v) => br_fmt(v, 0) + '%';
  const usdFmt = (v) => (br_lang() === 'en' ? '$' : 'US$ ') + br_fmt(v, 0);
  brLines({
    svg, id: '1', L, series, x0: s.p[0], x1: s.p[1], yMin, yMax, yLog: s.m === 'nivel', yTicks,
    yFmt: s.m === 'pct' ? pctFmt : (v) => (v >= 1000 ? br_fmt(v / 1000, 0) + 'k' : br_fmt(v, 0)),
    yTitle: br_t('c1-ytitle-' + s.m), tol: 0,
    ttDec: s.m === 'pct' ? 1 : 0, ttSuffix: s.m === 'pct' ? '%' : '',
    endValue: (ser, last) => s.m === 'pct' ? pctFmt(last[1]) : usdFmt(last[1])
  });
  atlasSetHeading('1', c1_isDefault(s), { title: 'c1-title', titleNeutral: s.m === 'pct' ? 'c1-title-neutral' : 'c1-title-neutral-nivel' });
  brSetSubtitle('1', br_t('c1-sub-' + s.m).replace('{P}', s.p[0] + '-' + s.p[1]));
  c1_syncUrl();
}
function c1_syncUrl() {
  if (!c1_urlWired) return;
  const s = c1_state();
  atlasSyncUrlTodoONada(
    { medida: s.m, paises: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1] },
    { medida: C1_DEF.m, paises: brList(C1_DEF.sel), periodo: C1_DEF.p[0] + '~' + C1_DEF.p[1] });
}
function c1_applyUrl() {
  const s = c1_state();
  const m = atlasUrlParam('medida'); if (m === 'pct' || m === 'nivel') s.m = m;
  const ps = brParseList(atlasUrlParam('paises'), (k) => !!c1_vals(k.toUpperCase()));
  if (ps) s.sel = ps.map(k => k.toUpperCase());
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) {
    const [a, b] = per.split('~').map(Number);
    if (a >= 1950 && b <= C1_LAST && a < b) s.p = [a, b];
  }
  c1_urlWired = true;
  c1_tog.sync(); c1_period.sync(); c1_selector.render(); drawC1();
}
function initC1() {
  const s = c1_state();
  c1_tog = brToggle({ el: 'c1-medida', get: () => s.m, set: (v) => { s.m = v; }, onChange: drawC1 });
  c1_period = brPeriod({ pre: 'c1', min: 1950, max: C1_LAST, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC1 });
  c1_selector = brSelector({
    pre: 'c1', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC1,
    color: (k) => br_color(s, k), label: c1_label,
    universe: () => ['WLD'].concat(Object.keys(BR_CONV.gdppc)).map(k => ({ key: k, label: c1_label(k) }))
      .sort((a, b) => a.label.localeCompare(b.label, br_lang()))
  });
  brRegister('1', drawC1, 'c1-png-source', () => br_t('c1-png-sub-' + s.m).replace('{P}', s.p[0] + '-' + s.p[1]));
  brCsv('button.download[data-chart="1-csv"]', () => {
    const rows = [];
    c1_series(s).forEach(ser => {
      const v = c1_vals(ser.key);
      const e0 = BR_CONV.empalme[ser.key] || 0;
      BR_CONV.years.forEach((y, i) => {
        if (y < s.p[0] || y > s.p[1] || v[i] == null) return;
        const tramo = c1_tramo(e0, y);
        rows.push([ser.key === 'WLD' ? 'WLD' : ser.key, c1_label(ser.key), y, +(100 * v[i] / BR_CONV.gdppc.USA[i]).toFixed(2), v[i], tramo]);
      });
    });
    return {
      headers: { es: ['codigo', 'pais', 'anio', 'pib_pc_pct_eeuu', C1_A ? 'pib_pc_usd_2011_ppa' : 'pib_pc_usd_2021_ppa', 'fuente_del_dato'],
                 en: ['code', 'country', 'year', 'gdp_pc_pct_us', C1_A ? 'gdp_pc_2011_usd_ppp' : 'gdp_pc_2021_usd_ppp', 'data_source'] },
      rows, file: { es: 'el-atlas-brasil-convergencia.csv', en: 'the-atlas-brazil-convergence.csv' }
    };
  });
  drawC1();
  c1_applyUrl();
}
function c1_onLang() { c1_selector.render(); drawC1(); }
