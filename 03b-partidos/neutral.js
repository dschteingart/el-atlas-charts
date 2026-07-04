// =============================================================
//  Especial partidos — Chart 7: el fútbol se muda a canchas ajenas
// =============================================================
// % de partidos en cancha neutral: promedio móvil de 4 años (protagonista)
// + dato anual (referencia finita). Datos: DATA_NEUTRAL.

const NE_XMIN = 1946, NE_XMAX = 2025;

function ne_series() {
  const D = DATA_NEUTRAL;
  const pair = (arr) => D.anios.map((a, i) => [a, arr[i]]);
  return [
    { label: t('c7-serie-anual'), color: '#9a9488', ref: true, dash: true, pts: pair(D.pct) },
    { label: t('c7-serie-mm4'), color: '#BE5D32', width: 1.6, pts: pair(D.mm4) },
  ];
}

function drawNeutral() {
  const series = ne_series();
  tsDraw(7, {
    svgId: 'chart7', tooltipId: 'tooltip7', mode: 'lines',
    xMin: NE_XMIN, xMax: NE_XMAX, yMax: 'auto',
    yFmt: (v) => v + '%', axisY: t('c7-axis-y'),
    series,
    endValFmt: (v) => Math.round(v) + '%',
    ttRows: (year) => series.map(sr => {
      const p = sr.pts.find(q => q[0] === year);
      return p && p[1] != null ? { label: sr.label, color: sr.color, v: p[1].toFixed(1) + '%' } : null;
    }).filter(Boolean).reverse(),
  });
  atlasSetHeading('7', true, {
    title: 'c7-title', titleNeutral: 'c7-title-neutral',
    subtitle: 'c7-subtitle', subtitleNeutral: 'c7-subtitle-neutral',
  });
}

function setupNeutralCSV() {
  document.querySelectorAll('button.download[data-chart="7-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_NEUTRAL;
    let csv = 'anio,pct_neutral,pct_neutral_mm4\n';
    D.anios.forEach((a, i) => { csv += `${a},${D.pct[i] ?? ''},${D.mm4[i] ?? ''}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-neutral.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initNeutral() {
  drawNeutral();
  setupNeutralCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initNeutral._wired) {
    initNeutral._wired = true;
    window.addEventListener('atlas-editor-change', () => drawNeutral());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawNeutral;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '7') return null;
    return (typeof t === 'function' ? t('c7-sources-tpl') : '') || null;
  };
}
