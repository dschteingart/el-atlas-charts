// Chart 13 — Brasil en el mundo: dos paneles con una sola curva cada uno (pedido de Daniel, 21/10/2026).
// Panel 1: PIB per cápita de Brasil como % del de EE.UU. (la serie del gráfico 1, variante A del empalme).
// Panel 2: participación de Brasil en el PIB mundial: Maddison 2023 hasta BR_MUNDO.ultMaddison y, después, la
// variación del PIB a PPA constante de Brasil y del Mundo (Banco Mundial); scripts/eje1_participacion_mundial.py.
// En escritorio los paneles van lado a lado; en el celular y en el PNG, uno arriba del otro. Cada panel tiene su
// crosshair y comparten el tooltip (br_crosshair con o.box).
// Datos: BR_MUNDO (data-mundo.js) = { years, pc: [%], share: [%], ultMaddison }.
const C13_Y0 = BR_MUNDO.years[0], C13_Y1 = BR_MUNDO.years[BR_MUNDO.years.length - 1];

function c13_pts(arr) { return BR_MUNDO.years.map((y, i) => arr[i] == null ? null : [y, arr[i]]).filter(Boolean); }
function c13_last(arr) { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] != null) return arr[i]; return null; }
function drawC13() {
  const svg = document.getElementById('chart13');
  if (!svg) return;
  const L = br_layout({ desktopH: 520, mobileH: 1400 });
  br_prepSvg(svg, L); br_clearHover(svg);
  const S = L.S, stack = L.mobile || !!L.fmt;
  const headH = S.label + (L.big ? 30 : 18), gap = stack ? (L.big ? 44 : 28) : (L.big ? 60 : 44);
  const boxes = stack
    ? (() => { const h = (L.H - 2 * headH - gap) / 2; return [{ x: 0, y: headH, w: L.W, h }, { x: 0, y: 2 * headH + h + gap, w: L.W, h }]; })()
    : (() => { const w = (L.W - gap) / 2; return [{ x: 0, y: headH, w, h: L.H - headH }, { x: w + gap, y: headH, w, h: L.H - headH }]; })();
  const xTicks = stack ? [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] : [1950, 1970, 1990, 2010];
  const ult = BR_MUNDO.ultMaddison;
  const panels = [
    { vals: BR_MUNDO.pc, head: 'c13-p1', yTitle: 'c13-y1', tt: 'c13-tt1', yMax: 35, yTicks: [0, 10, 20, 30], dec: 0, ttDec: 1 },
    { vals: BR_MUNDO.share, head: 'c13-p2', yTitle: 'c13-y2', tt: 'c13-tt2', yMax: 3.5, yTicks: [0, 1, 2, 3], dec: 0, ttDec: 2 }
  ];
  // mismos márgenes en los dos paneles, para que los ejes X queden alineados cuando van apilados
  const fmtEnd = (k, v) => br_fmt(v, k === 0 ? 0 : 1) + '%';
  const yLabWMin = Math.max.apply(null, panels.flatMap(p => p.yTicks.map(v => br_measure(br_fmt(v, p.dec) + '%', S.tick, 400))));
  const rightW = Math.max.apply(null, panels.map((p, k) => br_measure(fmtEnd(k, c13_last(p.vals)), S.label, 700))) + (L.big ? 30 : 18);
  panels.forEach((p, k) => {
    const b = boxes[k];
    br_text(svg, b.x, b.y - (L.big ? 16 : 10), br_t(p.head), { size: S.label, weight: 600, fill: BR_C.ink });
    const last = c13_last(p.vals);
    brLines({
      svg, id: '13', L, box: b, x0: C13_Y0, x1: C13_Y1, yMin: 0, yMax: p.yMax, yTicks: p.yTicks, xTicks, yLabWMin, rightW,
      series: [{ key: 'BRA', label: fmtEnd(k, last), color: BR_C.brasil, main: true, pts: c13_pts(p.vals) }],
      yFmt: (v) => br_fmt(v, p.dec) + '%', yTitle: br_t(p.yTitle), tol: 0,
      ttHTML: (year, rows) => br_ttHTML(String(year), [[br_t(p.tt), br_fmt(rows[0].value, p.ttDec) + '%']],
        [k === 1 && year > ult ? br_t('c13-tt-ext') : null])
    });
  });
  atlasSetHeading('13', true, { title: 'c13-title', titleNeutral: 'c13-title' });
  brSetSubtitle('13', br_t('c13-sub'));
}
function initC13() {
  brRegister('13', drawC13, 'c13-png-source', () => br_t('c13-png-sub'));
  brCsv('button.download[data-chart="13-csv"]', () => ({
    headers: { es: ['anio', 'pib_pc_pct_eeuu', 'pct_pib_mundial', 'fuente_participacion'],
               en: ['year', 'gdp_pc_pct_us', 'pct_world_gdp', 'share_source'] },
    rows: BR_MUNDO.years.map((y, i) => [y, BR_MUNDO.pc[i], BR_MUNDO.share[i],
      BR_MUNDO.share[i] == null ? '' : br_t(y > BR_MUNDO.ultMaddison ? 'c13-csv-ext' : 'c13-csv-mpd')]),
    file: { es: 'el-atlas-brasil-mundo.csv', en: 'the-atlas-brazil-world.csv' }
  }));
  drawC13();
}
function c13_onLang() { drawC13(); }
