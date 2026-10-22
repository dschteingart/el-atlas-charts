// Chart 4 — Pobreza y desigualdad en dos paneles (pedido de Daniel, 22/10/2026): a la izquierda (o arriba) la
// pobreza con la línea elegida (US$ 8,30 / 4,20 / 3 por día, PPA 2021); a la derecha (o abajo) el Gini.
// En escritorio los paneles van lado a lado; en el celular y en el PNG, uno arriba del otro (patrón chart-mundo).
// Datos: BR_POB (data-pobreza.js). Pobreza: Banco Mundial PIP sin rellenar huecos; cada punto trae su código de
// comparabilidad, la línea une los tramos y los puntos marcan cada medición. América Latina (LCN) y Mundo (WLD):
// pobreza regional del PIP. Gini: PIP por año de encuesta, en puntos de 0 a 100. América Latina (pedido de Daniel,
// 22/10/2026): promedio simple de un panel fijo de 16 países con encuesta de 1997 a 2024, interpolando dentro de
// cada país; antes de 1997, encadenado hacia 1981 con la variación de los países que tienen dato
// (brasil_transformaciones/scripts/eje4_gini_pip_lac.py).
const C4_DEF = { ind: '8.3', sel: ['BRA', 'LCN'], p: [1981, 2024] };
let c4_urlWired = false, c4_selector = null, c4_period = null, c4_tog = null;

function c4_state() {
  if (!state[4]) state[4] = { ind: C4_DEF.ind, sel: C4_DEF.sel.slice(), p: C4_DEF.p.slice() };
  return state[4];
}
function c4_src(k) { return BR_POB.paises[k] || BR_POB.regiones[k] || null; }
function c4_label(k) { return br_name(k) + (k === 'ARG' ? br_t('c4-arg') : ''); }
function c4_isDefault(s) { return s.ind === C4_DEF.ind && s.p[0] === C4_DEF.p[0] && s.p[1] === C4_DEF.p[1] && brSameList(s.sel, C4_DEF.sel); }
function c4_lineLabel(ind) { return br_lang() === 'en' ? ({ '8.3': '8.30', '4.2': '4.20', '3.0': '3' })[ind] : ({ '8.3': '8,30', '4.2': '4,20', '3.0': '3' })[ind]; }
function c4_series(s, key) {
  return s.sel.filter(k => c4_src(k) && c4_src(k)[key]).map(k => {
    const pts = c4_src(k)[key].filter(p => p[0] >= s.p[0] && p[0] <= s.p[1]).map(p => [p[0], p[1], null, null, p[2]]);
    const reg = k === 'LCN' || k === 'WLD';
    // el promedio del Gini es de 16 países de América Latina, sin el Caribe: otro rótulo que el de la pobreza del PIP
    const label = key === 'gini' && k === 'LCN' ? br_t('c4-lat-gini') : c4_label(k);
    return { key: k, label, color: br_color(s, k), main: k === 'BRA', dash: reg, dots: !reg, pts };
  }).filter(x => x.pts.length);
}
function c4_last(pts) { return pts.length ? pts[pts.length - 1] : null; }
function drawC4() {
  const s = c4_state(), svg = document.getElementById('chart4');
  if (!svg) return;
  const L = br_layout({ desktopH: 520, mobileH: 1400 });
  br_prepSvg(svg, L); br_clearHover(svg);
  const S = L.S, stack = L.mobile || !!L.fmt;
  const pov = c4_series(s, 'pov' + s.ind), gin = c4_series(s, 'gini');
  const povAll = pov.flatMap(x => x.pts.map(p => p[1])), ginAll = gin.flatMap(x => x.pts.map(p => p[1]));
  const povMax = Math.max(10, Math.ceil(Math.max.apply(null, povAll.concat([10])) * 1.08 / 10) * 10);
  const gMin = Math.floor((Math.min.apply(null, ginAll.concat([45])) - 2) / 5) * 5;
  const gMax = Math.ceil((Math.max.apply(null, ginAll.concat([50])) + 1) / 5) * 5;
  const panels = [
    { series: pov, head: br_t('c4-p-pov').replace('{L}', c4_lineLabel(s.ind)), yTitle: br_t('c4-ytitle-pov'), yMin: 0, yMax: povMax,
      yFmt: (v) => br_fmt(v, 0) + '%', ttDec: 1, ttSuffix: '%', end: (v) => br_fmt(v, 0) + '%' },
    { series: gin, head: br_t('c4-p-gini'), yTitle: br_t('c4-ytitle-gini'), yMin: gMin, yMax: gMax,
      yFmt: (v) => br_fmt(v, 0), ttDec: 1, ttSuffix: '', end: (v) => br_fmt(v, 0) }
  ];
  panels.forEach(p => { p.yTicks = niceLinearTicks(p.yMin, p.yMax, L.mobile ? 4 : 5).filter(v => v <= p.yMax + 1e-9 && v >= p.yMin - 1e-9); });
  // márgenes comunes, para que los ejes X queden alineados cuando los paneles van apilados
  const yLabWMin = Math.max.apply(null, panels.flatMap(p => p.yTicks.map(v => br_measure(p.yFmt(v), S.tick, 400))));
  const capW = L.big ? Math.round(L.W * 0.20) - 30 : 175;
  let labMax = 0;
  panels.forEach(p => p.series.forEach(ser => {
    const last = c4_last(ser.pts); if (!last) return;
    br_wrap2(ser.label + (L.png ? '  ' + p.end(last[1]) : ''), S.label, 700, capW).forEach(ln => { labMax = Math.max(labMax, br_measure(ln, S.label, 700)); });
  }));
  const rightW = labMax + (L.big ? 30 : 18);
  const headH = S.label + (L.big ? 30 : 18);
  const boxes = stack
    ? (() => { const gap = L.big ? 44 : 28, h = (L.H - 2 * headH - gap) / 2; return [{ x: 0, y: headH, w: L.W, h }, { x: 0, y: 2 * headH + h + gap, w: L.W, h }]; })()
    : (() => { const gap = L.big ? 60 : 44, w = (L.W - gap) / 2; return [{ x: 0, y: headH, w, h: L.H - headH }, { x: w + gap, y: headH, w, h: L.H - headH }]; })();
  const xTicks = niceLinearTicks(s.p[0], s.p[1], stack ? 6 : 4).filter(v => v >= s.p[0] && v <= s.p[1] && Number.isInteger(v));
  panels.forEach((p, k) => {
    const b = boxes[k];
    br_text(svg, b.x, b.y - (L.big ? 16 : 10), p.head, { size: S.label, weight: 600, fill: BR_C.ink });
    if (!p.series.length) {
      br_text(svg, b.x + b.w / 2, b.y + b.h / 2, br_t('c4-sin-dato'), { size: S.ann, fill: BR_C.muted, anchor: 'middle' });
      return;
    }
    brLines({
      svg, id: '4', L, box: b, series: p.series, x0: s.p[0], x1: s.p[1], xTicks, yMin: p.yMin, yMax: p.yMax, yTicks: p.yTicks,
      yFmt: p.yFmt, yTitle: p.yTitle, yLabWMin, rightW, tol: 2, ttDec: p.ttDec, ttSuffix: p.ttSuffix,
      ttYearLabel: (y) => p.head + ', ' + y, endValue: (ser, last) => p.end(last[1])
    });
  });
  atlasSetHeading('4', c4_isDefault(s), { title: 'c4-title', titleNeutral: 'c4-title-neutral' });
  brSetSubtitle('4', br_t('c4-sub').replace('{L}', c4_lineLabel(s.ind)).replace('{P}', s.p[0] + '-' + s.p[1]));
  c4_syncUrl();
}
function c4_syncUrl() {
  if (!c4_urlWired) return;
  const s = c4_state();
  atlasSyncUrlTodoONada(
    { indicador: s.ind, paises: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1] },
    { indicador: C4_DEF.ind, paises: brList(C4_DEF.sel), periodo: C4_DEF.p[0] + '~' + C4_DEF.p[1] });
}
function c4_applyUrl() {
  const s = c4_state();
  const i = atlasUrlParam('indicador'); if (['8.3', '4.2', '3.0'].indexOf(i) >= 0) s.ind = i;
  const ps = brParseList(atlasUrlParam('paises'), (k) => !!c4_src(k.toUpperCase()));
  if (ps) s.sel = ps.map(k => k.toUpperCase());
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 1981 && b <= 2024 && a < b) s.p = [a, b]; }
  c4_urlWired = true;
  c4_tog.sync(); c4_period.sync(); c4_selector.render(); drawC4();
}
function initC4() {
  const s = c4_state();
  c4_tog = brToggle({ el: 'c4-ind', get: () => s.ind, set: (v) => { s.ind = v; }, onChange: () => { c4_selector.render(); drawC4(); } });
  c4_period = brPeriod({ pre: 'c4', min: 1981, max: 2024, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC4 });
  c4_selector = brSelector({
    pre: 'c4', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC4,
    color: (k) => br_color(s, k), label: c4_label,
    universe: () => Object.keys(BR_POB.paises).concat(Object.keys(BR_POB.regiones)).map(k => ({ key: k, label: c4_label(k) }))
      .sort((a, b) => a.label.localeCompare(b.label, br_lang()))
  });
  brRegister('4', drawC4, 'c4-png-source');
  brCsv('button.download[data-chart="4-csv"]', () => {
    const rows = [];
    s.sel.forEach(k => {
      const src = c4_src(k); if (!src) return;
      ['pov8.3', 'pov4.2', 'pov3.0', 'gini'].forEach(ind => (src[ind] || []).forEach(p => {
        if (p[0] >= s.p[0] && p[0] <= s.p[1]) rows.push([k, c4_label(k), ind, p[0], p[1], k === 'LCN' && ind === 'gini' ? '' : p[2], k === 'LCN' && ind === 'gini' ? 'PIP, promedio simple de 16 países' : 'PIP']);
      }));
    });
    return {
      headers: { es: ['codigo', 'pais_o_region', 'indicador', 'anio', 'valor', 'tramo_comparable', 'fuente'], en: ['code', 'country_or_region', 'indicator', 'year', 'value', 'comparable_spell', 'source'] },
      rows, file: { es: 'el-atlas-brasil-pobreza.csv', en: 'the-atlas-brazil-poverty.csv' }
    };
  });
  drawC4();
  c4_applyUrl();
}
function c4_onLang() { c4_selector.render(); drawC4(); }
