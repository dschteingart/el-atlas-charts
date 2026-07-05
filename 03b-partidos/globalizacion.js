// =============================================================
//  Especial partidos — Chart 3: el fútbol que no se globalizó
// =============================================================
// Config fina sobre el motor compartido props-chart.js (métrica 'cru' =
// partidos entre confederaciones distintas). Dos vistas (Evolución /
// Comparación) y controles de ámbito, competencia, suavizado y período.
const PC_CFG_GLOB = {
  n: 3, metric: 'cru', svgId: 'chart3', tooltipId: 'tooltip3',
  period: [1950, 2025],
  axisY: 'c3-axis-y', metricPhrase: 'c3-metric',
  titleKey: 'c3-title', titleNeutralKey: 'c3-title-neutral',
  csvName: 'el-atlas-especial-cruces.csv', srcTpl: 'c3-sources-tpl',
};
function initGlobalizacion() { initPropsChart(PC_CFG_GLOB); }
function drawGlobalizacion() { if (typeof pc_cfg !== 'undefined' && pc_cfg) drawPropsChart(); }
