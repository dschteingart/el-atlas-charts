// Chart 7 — Hogares según cantidad de integrantes, censos 1980-2022 (% o millones de hogares), en columnas
// apiladas con los censos en el eje horizontal.
// Datos: BR_HOG (data-hogares.js): dist[año][categoría] = [pct, cantidad]; media[año] = personas por hogar.
const C7_CATS = [['1', '#BE5D32', true], ['2', '#D89968', false], ['3', '#EAD7C3', false], ['4', '#C7D0DD', false], ['5', '#7F93B5', true], ['6+', '#234B85', true]];
const C7_DEF = { m: 'pct' };
let c7_urlWired = false, c7_tog = null;

function c7_state() { if (!state[7]) state[7] = { m: C7_DEF.m }; return state[7]; }
function c7_catTT(k) { return k === '1' ? br_t('c7-tt-n-1') : k === '6+' ? br_t('c7-tt-n-6+') : br_t('c7-tt-n').replace('{N}', k); }
function drawC7() {
  const s = c7_state(), svg = document.getElementById('chart7');
  if (!svg) return;
  const L = br_layout({ desktopH: 540, mobileH: 1000 });
  const years = Object.keys(BR_HOG.dist).map(Number).sort((a, b) => a - b);
  const abs = s.m === 'abs';
  // columnas apiladas con los censos en el eje X (el tiempo va en el eje horizontal); los hogares de una
  // persona abajo, para que su crecimiento se lea desde la base
  const cols = years.map(y => ({
    key: String(y), label: String(y),
    segs: C7_CATS.map(c => {
      const d = BR_HOG.dist[y][c[0]] || [0, 0];
      return { key: 'n' + c[0].replace('+', 'p'), cat: c[0], label: br_t('c7-n-' + c[0]), color: c[1], dark: c[2], value: abs ? d[1] / 1e6 : d[0], pct: d[0], n: d[1], year: y };
    })
  }));
  brStackV({
    svg, id: '7', L, cols, total: abs ? null : 100,
    legend: C7_CATS.map(c => ({ key: 'n' + c[0].replace('+', 'p'), label: br_t('c7-n-' + c[0]), color: c[1] })),
    yFmt: abs ? (v) => br_fmt(v, 0) : (v) => br_fmt(v, 0) + '%', yTitle: br_t(abs ? 'c7-ytitle-abs' : 'c7-ytitle-pct'),
    fmtSeg: (v) => abs ? br_fmt(v, 1) : br_fmt(v, 0),
    ttSeg: (col, sg) => {
      const med = BR_HOG.media[sg.year];
      return br_ttHTML(br_cap(c7_catTT(sg.cat)) + ', ' + sg.year, [
        [br_t('tt-pct'), br_fmt(sg.pct, 1) + '%'],
        [br_t('c7-tt-hog'), br_t('c7-tt-mill').replace('{V}', br_fmt(sg.n / 1e6, 2))]
      ], [med ? br_t('c7-media').replace('{V}', br_fmt(med, 2)) + ' (' + sg.year + ')' : null]);
    }
  });
  atlasSetHeading('7', s.m === C7_DEF.m, { title: 'c7-title', titleNeutral: 'c7-title-neutral' });
  brSetSubtitle('7', br_t(abs ? 'c7-sub-abs' : 'c7-sub-pct'));
  if (c7_urlWired) atlasSyncUrlTodoONada({ medida: s.m }, { medida: C7_DEF.m });
}
function initC7() {
  const s = c7_state();
  c7_tog = brToggle({ el: 'c7-medida', get: () => s.m, set: (v) => { s.m = v; }, onChange: drawC7 });
  brRegister('7', drawC7, 'c7-png-source');
  brCsv('button.download[data-chart="7-csv"]', () => {
    const rows = [];
    Object.keys(BR_HOG.dist).forEach(y => C7_CATS.forEach(c => { const d = BR_HOG.dist[y][c[0]]; if (d) rows.push([+y, c[0], d[0], d[1]]); }));
    return {
      headers: { es: ['anio_censo', 'integrantes', 'pct_hogares', 'hogares'], en: ['census_year', 'members', 'pct_households', 'households'] },
      rows, file: { es: 'el-atlas-brasil-hogares.csv', en: 'the-atlas-brazil-households.csv' }
    };
  });
  const m = atlasUrlParam('medida'); if (m === 'pct' || m === 'abs') s.m = m;
  c7_urlWired = true;
  c7_tog.sync();
  drawC7();
}
function c7_onLang() { drawC7(); }
