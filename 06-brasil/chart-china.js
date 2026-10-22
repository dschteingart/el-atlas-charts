// Chart 3 — China en el comercio de Brasil. Vista "socios" (panel, pedido de Daniel 22/10/2026): arriba, la
// participación de cada socio en las exportaciones, las importaciones o el intercambio total, 1989-2024 por defecto;
// abajo, barras apiladas con la composición por contenido tecnológico (Lall) de lo que se comercia con cada socio
// elegido, en el último año del período. Vista "comp": qué le vende y qué le compra Brasil a China (y qué le vende
// al resto del mundo), para un año.
// Datos: BR_CHINA (data-china.js; la composición por socio es BR_CHINA.lallSoc).
// Colores de los socios fuera de los de Lall, que comparten la figura (China era dorado como "baja tecnología").
const C3_SOC = [
  ['chn', 'China', '#E07A23'], ['usa', 'Estados Unidos', '#3E5A6E'], ['ue', 'Unión Europea (27)', '#7A2A3F'],
  ['arg', 'Argentina', '#6B3D8B'], ['merc', 'Resto Mercosur (PRY+URY)', '#2C8484'], ['resto', 'Resto del mundo', '#8A8579'],
  ['chnhk', 'China + Hong Kong + Macao (sensibilidad)', '#B5639E']
];
// Lall con los colores del gráfico 2 (chart-exportaciones.js), para que las dos figuras se lean igual
const C3_LALL = [
  ['prim', 'Productos primarios', '#2D6A3D', true], ['rrnn', 'Manuf. basadas en RRNN', '#6CB04D', false],
  ['baja', 'Manuf. baja tecnología', '#C9A227', false], ['alta', 'Manuf. media y alta tecnología', '#234B85', true],
  ['otras', 'Otras / sin clasificar', '#C9C3B6', false]
];
const C3_ROWS = ['EXP|China', 'IMP|China', 'EXP|Resto del mundo excl. China'];
const C3_DEF = { v: 'socios', f: 'EXP', sel: ['chn', 'usa', 'ue', 'arg'], p: [1989, 2024], y: 2025 };   // 2024, como el gráfico 2
let c3_urlWired = false, c3_selector = null, c3_period = null, c3_togV = null, c3_togF = null;

function c3_state() {
  if (!state[3]) state[3] = { v: C3_DEF.v, f: C3_DEF.f, sel: C3_DEF.sel.slice(), p: C3_DEF.p.slice(), y: C3_DEF.y };
  return state[3];
}
function c3_soc(code) { return C3_SOC.find(x => x[0] === code); }
function c3_isDefault(s) { return s.v === C3_DEF.v && s.f === C3_DEF.f && s.p[0] === C3_DEF.p[0] && s.p[1] === C3_DEF.p[1] && brSameList(s.sel, C3_DEF.sel); }
function c3_series(s) {
  return s.sel.map(code => {
    const it = c3_soc(code);
    return { key: code, label: br_t('soc-' + it[1]), color: it[2], main: code === 'chn',
      pts: (BR_CHINA.socios[s.f][it[1]] || []).filter(p => p[0] >= s.p[0] && p[0] <= s.p[1]).map(p => [p[0], p[1]]) };
  });
}
function drawC3() {
  const s = c3_state(), svg = document.getElementById('chart3');
  if (!svg) return;
  document.getElementById('c3-ctl-socios').style.display = s.v === 'socios' ? 'contents' : 'none';
  document.getElementById('c3-ctl-comp').style.display = s.v === 'comp' ? 'contents' : 'none';
  if (s.v === 'socios') {
    c3_drawSocios(s, svg);
    atlasSetHeading('3', c3_isDefault(s), { title: 'c3-title', titleNeutral: 'c3-title-neutral-' + s.f });
    brSetSubtitle('3', br_t('c3-sub-' + s.f).replace('{P}', s.p[0] + '-' + s.p[1]).replace('{Y}', s.p[1]));
  } else {
    const L = br_layout({ desktopH: 470, mobileH: 900 });
    const rows = C3_ROWS.map(rk => {
      const d = (BR_CHINA.comp[rk] || {})[s.y] || {};
      return { key: rk, label: br_t('c3-row-' + rk), segs: C3_LALL.map(g => ({ key: g[0], label: br_t('cat-' + g[1]), color: g[2], dark: g[3], value: d[g[1]] || 0 })) };
    });
    brStackH({
      svg, id: '3', L, rows, total: 100,
      legend: C3_LALL.slice(0, 4).map(g => ({ key: g[0], label: br_t('cat-' + g[1]), color: g[2] })),
      fmtSeg: (v) => br_fmt(v, 0) + '%',
      ttRow: (row, sg) => br_ttHTML(sg.label, [[br_t('tt-pct'), br_fmt(sg.value, 1) + '%']], [row.label + ', ' + s.y])
    });
    atlasSetHeading('3', false, { title: 'c3-title-comp', titleNeutral: 'c3-title-neutral-comp' });
    brSetSubtitle('3', br_t('c3-sub-comp').replace('{Y}', s.y));
  }
  c3_syncUrl();
}
// Panel (pedido de Daniel, 22/10/2026): arriba, la participación de cada socio; abajo, barras apiladas con la
// composición por contenido tecnológico (Lall) del comercio con cada socio elegido, en el último año del período.
function c3_drawSocios(s, svg) {
  const L = br_layout({ desktopH: 640, mobileH: 1750 });
  br_prepSvg(svg, L); br_clearHover(svg);
  const S = L.S, big = L.big;
  const series = c3_series(s);
  const all = series.flatMap(x => x.pts.map(p => p[1]));
  // composición de cada socio elegido que tenga datos (la serie de sensibilidad de China con Hong Kong no tiene)
  const comp = s.sel.map(c3_soc).filter(it => ((BR_CHINA.lallSoc || {})[s.f] || {})[it[1]]);
  const headH = S.label + (big ? 30 : 18);
  const linesH = comp.length ? Math.round(L.H * (L.mobile ? 0.5 : 0.56)) : L.H;
  br_text(svg, 0, headH - (big ? 16 : 10), br_t('c3-p-soc-' + s.f), { size: S.label, weight: 600, fill: BR_C.ink });
  if (series.length) {
    brLines({
      svg, id: '3', L, box: { x: 0, y: headH, w: L.W, h: linesH - headH }, series, x0: s.p[0], x1: s.p[1], yMin: 0,
      yMax: Math.max(10, Math.ceil(Math.max.apply(null, all.concat([10])) * 1.06 / 10) * 10),
      yFmt: (v) => br_fmt(v, 0) + '%', yTitle: br_t('c3-ytitle'), tol: 0, ttDec: 1, ttSuffix: '%',
      endValue: (ser, last) => br_fmt(last[1], 0) + '%'
    });
  }
  if (!comp.length) return;
  const yb = s.p[1];
  const top2 = linesH + (big ? 40 : 26);
  br_text(svg, 0, top2 + S.label * 0.8, br_t('c3-p-lall-' + s.f).replace('{Y}', yb), { size: S.label, weight: 600, fill: BR_C.ink });
  const boxTop = top2 + S.label + (big ? 16 : 10);
  const rows = comp.map(it => {
    const q = BR_CHINA.lallSoc[s.f][it[1]].find(r => r[0] === yb);
    return { key: it[0], label: br_t('soc-' + it[1]),
      segs: C3_LALL.map((g, j) => ({ key: g[0], label: br_t('c3-lall-' + g[0]), color: g[2], dark: g[3], value: q ? q[1 + j] : 0 })) };
  });
  brStackH({
    svg, id: '3', L, box: { x: 0, y: boxTop, w: L.W, h: L.H - boxTop }, rows, total: 100, kg: 'lall',
    legend: C3_LALL.map(g => ({ key: g[0], label: br_t('c3-lall-' + g[0]), color: g[2] })),
    fmtSeg: (v) => br_fmt(v, 0) + '%',
    ttRow: (row, sg) => br_ttHTML(sg.label, [[br_t('tt-pct'), br_fmt(sg.value, 1) + '%']], [row.label + ', ' + yb])
  });
}
function c3_syncUrl() {
  if (!c3_urlWired) return;
  const s = c3_state();
  atlasSyncUrlTodoONada(
    { vista: s.v, flujo: s.f, socios: s.sel.length ? brList(s.sel) : '-', periodo: s.p[0] + '~' + s.p[1], anio: s.y },
    { vista: C3_DEF.v, flujo: C3_DEF.f, socios: brList(C3_DEF.sel), periodo: C3_DEF.p[0] + '~' + C3_DEF.p[1], anio: C3_DEF.y });
}
function c3_applyUrl() {
  const s = c3_state();
  const v = atlasUrlParam('vista'); if (v === 'socios' || v === 'comp') s.v = v;
  const f = atlasUrlParam('flujo'); if (f === 'EXP' || f === 'IMP' || f === 'TOT') s.f = f;
  const so = brParseList(atlasUrlParam('socios'), (k) => !!c3_soc(k)); if (so) s.sel = so;
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= 1989 && b <= 2025 && a < b) s.p = [a, b]; }
  const y = +atlasUrlParam('anio'); if (y && (BR_CHINA.comp['EXP|China'] || {})[y]) s.y = y;
  c3_urlWired = true;
  c3_togV.sync(); c3_togF.sync(); c3_period.sync(); c3_selector.render();
  const sel = document.getElementById('c3-anio'); if (sel) sel.value = s.y;
  drawC3();
}
function initC3() {
  const s = c3_state();
  c3_togV = brToggle({ el: 'c3-vista', get: () => s.v, set: (v) => { s.v = v; }, onChange: drawC3 });
  c3_togF = brToggle({ el: 'c3-flujo', get: () => s.f, set: (v) => { s.f = v; }, onChange: drawC3 });
  c3_period = brPeriod({ pre: 'c3', min: 1989, max: 2025, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC3 });
  c3_selector = brSelector({
    pre: 'c3', get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawC3, placeholderKey: 'c3-add-ph', focusAll: true,
    color: (k) => c3_soc(k)[2], label: (k) => br_t('soc-' + c3_soc(k)[1]),
    universe: () => C3_SOC.map(it => ({ key: it[0], label: br_t('soc-' + it[1]) }))
  });
  const sel = document.getElementById('c3-anio');
  if (sel) {
    Object.keys(BR_CHINA.comp['EXP|China']).map(Number).sort((a, b) => b - a).forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; sel.appendChild(o); });
    sel.value = s.y;
    sel.addEventListener('change', () => { s.y = +sel.value; drawC3(); });
  }
  brRegister('3', drawC3, 'c3-png-source');
  brCsv('button.download[data-chart="3-csv"]', () => {
    const rows = [];
    ['EXP', 'IMP', 'TOT'].forEach(f => C3_SOC.forEach(it => (BR_CHINA.socios[f][it[1]] || []).forEach(p => rows.push([br_t('c3-f-' + f), br_t('soc-' + it[1]), p[0], p[1], p[2]]))));
    C3_ROWS.forEach(rk => Object.keys(BR_CHINA.comp[rk] || {}).forEach(y => C3_LALL.forEach(g => {
      const v = BR_CHINA.comp[rk][y][g[1]]; if (v != null) rows.push([br_t('c3-row-' + rk), br_t('cat-' + g[1]), +y, v, '']);
    })));
    // composición por socio (Lall), año por año: flujo · socio · categoría
    ['EXP', 'IMP', 'TOT'].forEach(f => Object.keys((BR_CHINA.lallSoc || {})[f] || {}).forEach(soc => BR_CHINA.lallSoc[f][soc].forEach(q =>
      C3_LALL.forEach((g, j) => rows.push([br_t('c3-f-' + f) + ' · ' + br_t('soc-' + soc), br_t('c3-lall-' + g[0]), q[0], q[1 + j], ''])))));
    return {
      headers: { es: ['flujo_o_comercio', 'socio_o_categoria', 'anio', 'pct', 'millones_usd'], en: ['flow_or_trade', 'partner_or_category', 'year', 'pct', 'usd_millions'] },
      rows, file: { es: 'el-atlas-brasil-china.csv', en: 'the-atlas-brazil-china.csv' }
    };
  });
  drawC3();
  c3_applyUrl();
}
function c3_onLang() { c3_selector.render(); drawC3(); }
