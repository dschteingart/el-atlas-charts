// =============================================================
//  Especial partidos — Chart 2: la muerte del amistoso
// =============================================================
// Área apilada de la composición del calendario por tipo de partido.
// Toggle % / cantidad. Datos: DATA_TIPOS.

const AM_XMIN = 1946, AM_XMAX = 2025;
// Orden del apilado (abajo → arriba): el amistoso protagonista abajo.
const AM_CATS = [
  { key: 'Amistoso',                 i18n: 'c2-cat-Amistoso',               color: '#BE5D32' },
  { key: 'Eliminatoria del Mundial', i18n: 'c2-cat-EliminatoriaMundial',    color: '#3E5A6E' },
  { key: 'Mundial',                  i18n: 'c2-cat-Mundial',                color: '#26384A' },
  { key: 'Eliminatoria continental', i18n: 'c2-cat-EliminatoriaContinental', color: '#6B8E5A' },
  { key: 'Copa continental',         i18n: 'c2-cat-CopaContinental',        color: '#496B3A' },
  { key: 'Liga de Naciones',         i18n: 'c2-cat-LigaNaciones',           color: '#8B5A8C' },
  { key: 'Otros torneos',            i18n: 'c2-cat-Otros',                  color: '#9a9488' },
];

function am_state() {
  if (!state[2]) state[2] = {};
  if (!state[2].mode) state[2].mode = 'share';
  return state[2];
}

function am_totales() {
  const D = DATA_TIPOS;
  return D.anios.map((_, i) => AM_CATS.reduce((acc, c) => acc + (D.series[c.key][i] || 0), 0));
}

function drawAmistosos() {
  const s = am_state();
  const D = DATA_TIPOS;
  const tot = am_totales();
  const share = s.mode === 'share';
  const val = (catKey, i) => {
    const v = D.series[catKey][i] || 0;
    return share ? (tot[i] ? v / tot[i] * 100 : 0) : v;
  };
  tsDraw(2, {
    svgId: 'chart2', tooltipId: 'tooltip2', mode: 'stack',
    xMin: AM_XMIN, xMax: AM_XMAX,
    yMax: share ? 100 : 'auto',
    yFmt: (v) => share ? v + '%' : fmt(v),
    axisY: t(share ? 'c2-axis-share' : 'c2-axis-count'),
    stack: {
      anios: D.anios,
      cats: AM_CATS.map(c => ({ key: c.key, label: t(c.i18n), color: c.color })),
      val,
      total: (i) => share ? 100 : tot[i],
    },
    ttRows: (year) => {
      const i = D.anios.indexOf(year);
      if (i < 0 || !tot[i]) return null;
      const rows = AM_CATS.map(c => {
        const v = val(c.key, i);
        return { label: t(c.i18n), color: c.color, v: share ? v.toFixed(0) + '%' : fmt(v), raw: v };
      }).filter(r => r.raw > 0).sort((a, b) => b.raw - a.raw);
      rows.push({ label: 'Total', color: '#1A1A1A', v: share ? fmt(tot[i]) : fmt(tot[i]) });
      return rows;
    },
  });
  atlasSetHeading('2', s.mode === 'share', {
    title: 'c2-title', titleNeutral: 'c2-title-neutral',
    subtitle: 'c2-subtitle', subtitleNeutral: 'c2-subtitle-neutral',
  });
}

function setupAmistososCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_TIPOS;
    let csv = 'anio,' + AM_CATS.map(c => c.key.replace(/,/g, '')).join(',') + ',total\n';
    const tot = am_totales();
    D.anios.forEach((a, i) => {
      csv += a + ',' + AM_CATS.map(c => D.series[c.key][i] || 0).join(',') + ',' + tot[i] + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-tipos-de-partido.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initAmistosos() {
  am_state();
  document.querySelectorAll('#am-mode button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#am-mode button').forEach(x => x.classList.toggle('active', x === b));
    state[2].mode = b.dataset.mode;
    drawAmistosos();
  }));
  drawAmistosos();
  setupAmistososCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initAmistosos._wired) {
    initAmistosos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawAmistosos());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawAmistosos;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '2') return null;
    return (typeof t === 'function' ? t('c2-sources-tpl') : '') || null;
  };
}
