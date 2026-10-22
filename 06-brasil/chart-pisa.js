// Chart 12 — PISA en tres paneles (matemática, lectura y ciencias), Brasil y países elegibles (pedido de Daniel,
// 22/10/2026; antes era una materia por vez con un toggle). Mismo eje Y y mismo período en los tres paneles para que
// se puedan comparar. En escritorio y en el PNG van lado a lado y solo el último lleva las etiquetas finales; en el
// celular van uno arriba del otro, cada uno con sus etiquetas.
// Datos: BR_EDU (data-educacion.js): pisa[materia][iso] = [[año, puntaje]] (OCDE vía OWID).
const C12_MATS = ['matematica', 'lectura', 'ciencias'];
const C12_MAX = 2025;   // PISA 2025 (OCDE, publicado en septiembre de 2026)
const C12_DEF = { sel: ['BRA', 'CHL', 'MEX', 'OCDE'], p: [2000, C12_MAX] };
let c12_urlWired = false, c12_selector = null, c12_period = null;

function c12_state() { if (!state[12]) state[12] = { sel: C12_DEF.sel.slice(), p: C12_DEF.p.slice() }; return state[12]; }
function c12_isDefault(s) { return s.p[0] === C12_DEF.p[0] && s.p[1] === C12_DEF.p[1] && brSameList(s.sel, C12_DEF.sel); }
function c12_series(s, mat) {
  const src = BR_EDU.pisa[mat] || {};
  return s.sel.filter(k => src[k]).map(k => ({
    key: k, label: br_name(k), color: br_color(s, k), main: k === 'BRA', dash: k === 'OCDE', dots: true,
    pts: src[k].filter(p => p[0] >= s.p[0] && p[0] <= s.p[1]).map(p => [p[0], p[1]])
  }));
}
function drawC12() {
  const s = c12_state(), svg = document.getElementById('chart12');
  if (!svg) return;
  const L = br_layout({ desktopH: 440, mobileH: 1700 });
  br_prepSvg(svg, L); br_clearHover(svg);
  const S = L.S, stack = L.mobile;
  const panels = C12_MATS.map(m => ({ mat: m, series: c12_series(s, m) }));
  const all = panels.flatMap(p => p.series.flatMap(x => x.pts.map(q => q[1])));
  const yMin = Math.floor((Math.min.apply(null, all.concat([380])) - 3) / 50) * 50;
  const yMax = Math.ceil((Math.max.apply(null, all.concat([480])) + 8) / 10) * 10;
  const yTicks = niceLinearTicks(yMin, yMax, 4).filter(v => v <= yMax);
  const yFmt = (v) => br_fmt(v, 0);
  // lado a lado, las etiquetas del último panel nombran las series de los tres: sin valor, que sería solo el de ciencias
  const endValue = stack ? (ser, last) => br_fmt(last[1], 0) : null;
  // márgenes comunes: mismo ancho de rótulos del eje Y en los tres paneles y lugar para las etiquetas finales
  const yLabWMin = Math.max.apply(null, yTicks.map(v => br_measure(yFmt(v), S.tick, 400)));
  const capW = L.big ? Math.round(L.W * 0.20) - 30 : 175;
  let labMax = 0;
  panels.forEach(p => p.series.forEach(ser => {
    const last = br_lastPt(ser.pts); if (!last) return;
    br_wrap2(ser.label + (L.png && endValue ? '  ' + endValue(ser, last) : ''), S.label, 700, capW).forEach(ln => { labMax = Math.max(labMax, br_measure(ln, S.label, 700)); });
  }));
  const labW = labMax + (L.big ? 30 : 18), small = L.big ? 14 : 10;
  const pad = L.big ? 16 : 10, yT = br_yTitleW(L, true);
  const headH = S.label + (L.big ? 30 : 18);
  let boxes;
  if (stack) {
    const gap = L.big ? 40 : 26, h = (L.H - 3 * headH - 2 * gap) / 3;
    boxes = [0, 1, 2].map(k => ({ x: 0, y: headH + k * (h + gap + headH), w: L.W, h, yTitle: true, labels: true, right: labW }));
  } else {
    const gap = L.big ? 24 : 18;
    const off = [yT + yLabWMin + pad, yLabWMin + pad, yLabWMin + pad];
    const right = [small, small, labW];
    const pw = (L.W - 2 * gap - off.reduce((a, b) => a + b, 0) - right.reduce((a, b) => a + b, 0)) / 3;
    let x = 0;
    boxes = [0, 1, 2].map(k => { const b = { x, y: headH, w: off[k] + pw + right[k], h: L.H - headH, yTitle: k === 0, labels: k === 2, right: right[k] }; x += b.w + gap; return b; });
  }
  const xTicks = (stack ? [2000, 2006, 2012, 2018, 2025] : [2000, 2012, 2025]).filter(y => y >= s.p[0] && y <= s.p[1]);
  panels.forEach((p, k) => {
    const b = boxes[k], matName = br_t('mat-' + p.mat);
    br_text(svg, b.x, b.y - (L.big ? 16 : 10), br_cap(matName), { size: S.label, weight: 600, fill: BR_C.ink });
    brLines({
      svg, id: '12', L, box: b, series: p.series, x0: s.p[0] - 0.6, x1: s.p[1] + 0.6, xTicks, yMin, yMax, yTicks, yLabWMin,
      rightW: b.right, noEndLabels: !b.labels,
      yFmt, yTitle: b.yTitle ? br_t('c12-ytitle') : null, tol: 0, ttDec: 0, ttSuffix: '',
      ttYearLabel: (y) => br_cap(matName) + ', ' + y, endValue
    });
  });
  atlasSetHeading('12', c12_isDefault(s), { title: 'c12-title', titleNeutral: 'c12-title-neutral' });
  brSetSubtitle('12', br_t('c12-sub').replace('{P}', s.p[0] + '-' + s.p[1]));
  if (c12_urlWired) atlasSyncUrlTodoONada(
    { paises: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1] },
    { paises: brList(C12_DEF.sel), periodo: C12_DEF.p[0] + '~' + C12_DEF.p[1] });
}
function c12_universe() {
  const ks = new Set();
  C12_MATS.forEach(m => Object.keys(BR_EDU.pisa[m] || {}).forEach(k => ks.add(k)));
  return Array.from(ks).map(k => ({ key: k, label: br_name(k) })).sort((a, b) => a.label.localeCompare(b.label, br_lang()));
}
function initC12() {
  const s = c12_state();
  c12_period = brPeriod({ pre: 'c12', min: 2000, max: C12_MAX, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC12 });
  c12_selector = brSelector({
    pre: 'c12', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC12, focusAll: true,
    color: (k) => br_color(s, k), label: br_name, universe: c12_universe
  });
  brRegister('12', drawC12, 'c12-png-source');
  window.__atlasDefaultPngFormat = 'worldmap';   // apaisado: en el cuadrado los tres paneles quedaban muy altos (Daniel, 22/10/2026)
  brCsv('button.download[data-chart="12-csv"]', () => {
    const rows = [];
    Object.keys(BR_EDU.pisa).forEach(m => Object.keys(BR_EDU.pisa[m]).forEach(k => BR_EDU.pisa[m][k].forEach(p => rows.push([m, k, br_name(k), p[0], p[1]]))));
    return {
      headers: { es: ['materia', 'codigo', 'pais', 'anio', 'puntaje'], en: ['subject', 'code', 'country', 'year', 'score'] },
      rows, file: { es: 'el-atlas-brasil-pisa.csv', en: 'the-atlas-brazil-pisa.csv' }
    };
  });
  const ks = new Set(c12_universe().map(x => x.key));
  const ps = brParseList(atlasUrlParam('paises'), (k) => ks.has(k.toUpperCase())); if (ps) s.sel = ps.map(k => k.toUpperCase());
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 2000 && b <= C12_MAX && a < b) s.p = [a, b]; }
  c12_urlWired = true;
  c12_period.sync(); c12_selector.render();
  drawC12();
}
function c12_onLang() { c12_selector.render(); drawC12(); }
