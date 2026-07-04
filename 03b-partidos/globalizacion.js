// =============================================================
//  Especial partidos — Chart 3: el fútbol que no se globalizó
// =============================================================
// % de partidos entre confederaciones (promedio móvil de 4 años).
// Línea protagonista: el mundo. Chips: el % de CADA confederación
// (qué parte de su calendario es contra otras). Datos: DATA_CRUCES.

// Mundo = gris carbón (distinto de CONMEBOL, que también es terracota y se
// puede sumar como línea). Mismo criterio que el chart de actividad.
const GL_COL_WORLD = '#33312C';
const GL_XMIN = 1950, GL_XMAX = 2025;

function gl_state() {
  if (!state[3]) state[3] = {};
  if (!(state[3].confs instanceof Set)) state[3].confs = new Set(state[3].confs || []);
  return state[3];
}

function gl_series() {
  const s = gl_state();
  const D = DATA_CRUCES;
  const pair = (arr) => D.anios.map((a, i) => [a, arr[i]]);
  const out = [{ label: t('c3-serie-global'), color: GL_COL_WORLD, width: 1.6, pts: pair(D.global.mm4) }];
  CONF_FIFA_ORDER.forEach(cf => {
    if (s.confs.has(cf)) out.push({ label: t('conf.' + cf), color: CONF_FIFA_COLORS[cf], pts: pair(D.porConf[cf].mm4) });
  });
  return out;
}

function drawGlobalizacion() {
  const s = gl_state();
  const series = gl_series();
  tsDraw(3, {
    svgId: 'chart3', tooltipId: 'tooltip3', mode: 'lines',
    xMin: GL_XMIN, xMax: GL_XMAX,
    yMax: s.confs.size ? 'auto' : 30,
    yFmt: (v) => v + '%', axisY: t('c3-axis-y'),
    series,
    endValFmt: (v) => Math.round(v) + '%',
    ttRows: (year) => series.map(sr => {
      const p = sr.pts.find(q => q[0] === year);
      return p && p[1] != null ? { label: sr.label, color: sr.color, v: p[1].toFixed(1) + '%' } : null;
    }).filter(Boolean),
  });
  atlasSetHeading('3', s.confs.size === 0, {
    title: 'c3-title', titleNeutral: 'c3-title-neutral',
    subtitle: 'c3-subtitle', subtitleNeutral: 'c3-subtitle-neutral',
  });
}

function gl_renderChips() {
  const c = document.getElementById('gl-legend'); if (!c) return;
  const s = gl_state();
  c.innerHTML = '';
  CONF_FIFA_ORDER.forEach(cf => {
    const chip = document.createElement('span');
    chip.className = 'region-chip' + (s.confs.has(cf) ? '' : ' inactive');
    chip.style.background = s.confs.has(cf) ? CONF_FIFA_COLORS[cf] : 'transparent';
    chip.style.color = s.confs.has(cf) ? '#fff' : CONF_FIFA_LABEL_COLORS[cf];
    chip.style.border = '1px solid ' + CONF_FIFA_COLORS[cf];
    chip.style.cursor = 'pointer';
    chip.textContent = t('conf.' + cf);
    chip.addEventListener('click', () => {
      if (s.confs.has(cf)) s.confs.delete(cf); else s.confs.add(cf);
      gl_renderChips(); drawGlobalizacion();
    });
    c.appendChild(chip);
  });
}

function setupGlobalizacionCSV() {
  document.querySelectorAll('button.download[data-chart="3-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_CRUCES;
    let csv = 'anio,pct_cruce,pct_cruce_mm4,' + CONF_FIFA_ORDER.map(c => 'mm4_' + c).join(',') + '\n';
    D.anios.forEach((a, i) => {
      csv += `${a},${D.global.pct[i] ?? ''},${D.global.mm4[i] ?? ''},`
        + CONF_FIFA_ORDER.map(c => D.porConf[c].mm4[i] ?? '').join(',') + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-cruces.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initGlobalizacion() {
  gl_state();
  gl_renderChips();
  drawGlobalizacion();
  setupGlobalizacionCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initGlobalizacion._wired) {
    initGlobalizacion._wired = true;
    window.addEventListener('atlas-editor-change', () => drawGlobalizacion());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawGlobalizacion;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '3') return null;
    return (typeof t === 'function' ? t('c3-sources-tpl') : '') || null;
  };
}
