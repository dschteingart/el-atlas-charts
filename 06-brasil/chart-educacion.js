// Chart 5 — Jóvenes de 25 a 29 años con la secundaria completa, censos de Brasil 1991-2022 (barras).
// 1991 y 2000 se aproximan con 11 años de estudio o más (asterisco y tono más claro). Los puntajes PISA
// pasaron a su propio gráfico (chart-pisa.js, chart 12).
// Datos: BR_EDU (data-educacion.js): sec2529 = [[año, %, aproximado]].
function drawC5() {
  const svg = document.getElementById('chart5');
  if (!svg) return;
  const L = br_layout({ desktopH: 520, mobileH: 900 });
  const bars = BR_EDU.sec2529.map(b => ({
    key: String(b[0]), year: b[0], value: b[1], aprox: b[2], tick: String(b[0]) + (b[2] ? '*' : ''), lab: true,
    labText: br_fmt(b[1], 0) + '%', color: b[2] ? '#D89968' : BR_C.brasil
  }));
  brBars({
    svg, id: '5', L, bars, color: BR_C.brasil, labelColor: '#8B3F1E', yMax: 80,
    yFmt: (v) => br_fmt(v, 0) + '%', yTitle: br_t('c5-ytitle'),
    ttBar: (b) => br_ttHTML(br_t('c5-tt-head').replace('{Y}', b.year) + (b.aprox ? '*' : ''), [[br_t('c5-tt'), br_fmt(b.value, 1) + '%']],
      [b.aprox ? '* ' + br_cap(br_t('c5-aprox')) : null])
  });
  atlasSetHeading('5', true, { title: 'c5-title', titleNeutral: 'c5-title-neutral' });
  brSetSubtitle('5', br_t('c5-sub'));
}
function initC5() {
  brRegister('5', drawC5, 'c5-png-source');
  brCsv('button.download[data-chart="5-csv"]', () => ({
    headers: { es: ['anio_censo', 'pct_25_29_secundaria_completa', 'nota'], en: ['census_year', 'pct_25_29_completed_secondary', 'note'] },
    rows: BR_EDU.sec2529.map(b => [b[0], b[1], b[2] ? br_t('c5-aprox') : '']),
    file: { es: 'el-atlas-brasil-educacion.csv', en: 'the-atlas-brazil-education.csv' }
  }));
  drawC5();
}
function c5_onLang() { drawC5(); }
