// Chart 9 — Valores: % de adultos que cree que la homosexualidad, el divorcio, el aborto y la eutanasia nunca
// se justifican en Brasil (responde 1 en una escala de 1 a 10), World Values Survey 1991-2018 (5 olas). Una sola
// medida, sin intervalos de confianza (pedidos de Daniel: primero 6 a 10, el 21/10/2026 pasó a "nunca"); el CSV
// conserva los intervalos y las otras medidas.
// Datos: BR_VAL['<conducta>|<medida>'] = [[año, valor, ic_inf, ic_sup, n]]. Cada punto es una ola.
const C9_ITEMS = ['homosexualidad', 'divorcio', 'aborto', 'eutanasia'];
const C9_COL = { homosexualidad: '#BE5D32', divorcio: '#2C8484', aborto: '#234B85', eutanasia: '#6B3D8B' };
const C9_M = 'pct_nunca';
const C9_DEF = { sel: ['homosexualidad', 'divorcio', 'aborto'] };
let c9_urlWired = false, c9_selector = null;

function c9_state() {
  if (!state[9]) state[9] = { sel: C9_DEF.sel.slice() };
  return state[9];
}
function c9_isDefault(s) { return brSameList(s.sel, C9_DEF.sel); }
function drawC9() {
  const s = c9_state(), svg = document.getElementById('chart9');
  if (!svg) return;
  const series = s.sel.map(k => ({
    key: k, label: br_t('val-' + k), color: C9_COL[k], dots: true, main: true,
    pts: (BR_VAL[k + '|' + C9_M] || []).map(p => [p[0], p[1]])
  }));
  const all = series.flatMap(x => x.pts.map(p => p[1]));
  brLines({
    svg, id: '9', L: br_layout(), series, x0: 1989, x1: 2020, yMin: 0,
    yMax: Math.max(20, Math.ceil(Math.max.apply(null, all.concat([10])) * 1.1 / 10) * 10),
    xTicks: [1991, 1997, 2006, 2014, 2018], yFmt: (v) => br_fmt(v, 0) + '%',
    yTitle: br_t('c9-ytitle-pct'), tol: 0, ttDec: 1, ttSuffix: '%',
    endValue: (ser, last) => br_fmt(last[1], 0) + '%'
  });
  atlasSetHeading('9', c9_isDefault(s), { title: 'c9-title', titleNeutral: 'c9-title-neutral' });
  brSetSubtitle('9', br_t('c9-sub').replace('{P}', '1991-2018'));
  if (c9_urlWired) atlasSyncUrlTodoONada({ conductas: s.sel.length ? brList(s.sel) : '-' }, { conductas: brList(C9_DEF.sel) });
}
function initC9() {
  const s = c9_state();
  // con cuatro conductas, el buscador despliega todas al hacer foco (y marca las ya elegidas)
  c9_selector = brSelector({
    pre: 'c9', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC9, placeholderKey: 'c9-add-ph', focusAll: true,
    color: (k) => C9_COL[k], label: (k) => br_t('val-' + k),
    universe: () => C9_ITEMS.map(k => ({ key: k, label: br_t('val-' + k) }))
  });
  brRegister('9', drawC9, 'c9-png-source');
  brCsv('button.download[data-chart="9-csv"]', () => {
    const rows = [];
    C9_ITEMS.forEach(k => ['pct_nunca', 'pct_6a10', 'media'].forEach(m => (BR_VAL[k + '|' + m] || []).forEach(p => rows.push([br_t('val-' + k), m, p[0], p[1], p[2], p[3], p[4]]))));
    return {
      headers: { es: ['conducta', 'medida', 'anio', 'valor', 'ic95_inf', 'ic95_sup', 'n'], en: ['behaviour', 'measure', 'year', 'value', 'ci95_low', 'ci95_high', 'n'] },
      rows, file: { es: 'el-atlas-brasil-valores.csv', en: 'the-atlas-brazil-values.csv' }
    };
  });
  const cs = brParseList(atlasUrlParam('conductas'), (k) => C9_ITEMS.indexOf(k) >= 0); if (cs) s.sel = cs;
  c9_urlWired = true;
  c9_selector.render();
  drawC9();
}
function c9_onLang() { c9_selector.render(); drawC9(); }
