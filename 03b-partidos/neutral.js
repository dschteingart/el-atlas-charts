// =============================================================
//  Especial partidos — Chart 7: el fútbol se muda a canchas ajenas
// =============================================================
// Config fina sobre el motor compartido props-chart.js (métrica 'neu' =
// cancha neutral). Dos vistas (Evolución / Comparación) y controles de ámbito,
// competencia, suavizado y período.
const PC_CFG_NEUTRAL = {
  n: 7, metric: 'neu', svgId: 'chart7', tooltipId: 'tooltip7',
  period: [1950, 2025],
  axisY: 'c7-axis-y', metricPhrase: 'c7-metric',
  titleKey: 'c7-title', titleNeutralKey: 'c7-title-neutral',
  csvName: 'el-atlas-especial-neutral.csv', srcTpl: 'c7-sources-tpl',
};
function initNeutral() { initPropsChart(PC_CFG_NEUTRAL); }
function drawNeutral() { if (typeof pc_cfg !== 'undefined' && pc_cfg) drawPropsChart(); }
