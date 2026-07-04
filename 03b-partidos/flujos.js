// =============================================================
//  Especial partidos — Chart 5: puertas adentro (chord de flujos)
// =============================================================
// Diagrama de cuerdas entre las 6 confederaciones: los arcos son los
// partidos de cada una, las cintas los partidos entre dos. La diagonal
// (partidos adentro del mismo bloque) es el 85% de la torta, y es la cinta
// que vuelve sobre sí misma. Toggle de período. Requiere d3 v7.
// Datos: DATA_CHORD.

function fl_state() {
  if (!state[5]) state[5] = {};
  if (!state[5].period) state[5].period = 'reciente';   // 'historia' | 'reciente'
  return state[5];
}

function drawFlujos() {
  const svg = document.getElementById('chart5');
  if (!svg || typeof d3 === 'undefined') return;
  svg.innerHTML = '';
  const s = fl_state();
  const D = DATA_CHORD;
  const M = D[s.period === 'historia' ? 'historia' : 'reciente'];
  const confs = D.confs;

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = 1100, H = 620;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = editorFormat === 'square' ? 880 : f.vbH; }
  else if (mobile) { W = 1100; H = 1000; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = !!editorFormat;
  const SIZES = bigFmt ? { label: 26, sub: 21 } : { label: 13, sub: 11 };

  const total = M.reduce((acc, row) => acc + row.reduce((a, v) => a + v, 0), 0)
    - confs.reduce((acc, _, i) => acc + M[i][i], 0) / 1;   // total con intra contada una vez
  const totalReal = (() => { let t2 = 0; for (let i = 0; i < confs.length; i++) for (let j = i; j < confs.length; j++) t2 += M[i][j]; return t2; })();
  const intra = confs.reduce((acc, _, i) => acc + M[i][i], 0);

  const R = Math.min(W, H) / 2 - (bigFmt ? 120 : 78);
  const cx = W / 2, cy = H / 2 + (bigFmt ? 6 : 4);

  const chord = d3.chordDirected ? d3.chord().padAngle(0.045).sortSubgroups(d3.descending) : d3.chord();
  const chords = chord(M);
  const arc = d3.arc().innerRadius(R).outerRadius(R + (bigFmt ? 22 : 14));
  const ribbon = d3.ribbon().radius(R - 1);

  const g = d3.select(svg).append('g').attr('transform', `translate(${cx},${cy})`);

  const ribbons = g.append('g').selectAll('path').data(chords).join('path')
    .attr('d', ribbon)
    .attr('fill', d => {
      const i = d.source.index, j = d.target.index;
      if (i === j) return CONF_FIFA_COLORS[confs[i]];
      return M[i][j] >= 0 && (M[i].reduce((a, v) => a + v, 0) >= M[j].reduce((a, v) => a + v, 0))
        ? CONF_FIFA_COLORS[confs[i]] : CONF_FIFA_COLORS[confs[j]];
    })
    .attr('fill-opacity', d => d.source.index === d.target.index ? 0.72 : 0.45)
    .attr('stroke', '#FAF8F3').attr('stroke-width', 0.6);

  const groups = g.append('g').selectAll('g').data(chords.groups).join('g');
  groups.append('path')
    .attr('d', arc)
    .attr('fill', d => CONF_FIFA_COLORS[confs[d.index]])
    .attr('stroke', '#FAF8F3').attr('stroke-width', 1);

  groups.append('text')
    .attr('transform', d => {
      const a = (d.startAngle + d.endAngle) / 2 - Math.PI / 2;
      const r = R + (bigFmt ? 34 : 22);
      return `translate(${Math.cos(a) * r},${Math.sin(a) * r})`;
    })
    .attr('text-anchor', d => {
      const a = (d.startAngle + d.endAngle) / 2;
      return (a > Math.PI * 0.02 && a < Math.PI * 0.98) ? 'start' : (a > Math.PI * 1.02 && a < Math.PI * 1.98) ? 'end' : 'middle';
    })
    .attr('dy', 4)
    .attr('font-family', 'var(--sans)').attr('font-weight', 700)
    .style('font-size', SIZES.label + 'px')
    .attr('fill', d => CONF_FIFA_LABEL_COLORS[confs[d.index]])
    .attr('paint-order', 'stroke').attr('stroke', '#FAF8F3')
    .attr('stroke-width', bigFmt ? 5 : 3)
    .text(d => t('conf.' + confs[d.index]));

  // % puertas adentro, en el centro
  const pctIntra = Math.round(100 * intra / totalReal);
  const ctr = d3.select(svg).append('text')
    .attr('x', cx).attr('y', cy - (bigFmt ? 12 : 6)).attr('text-anchor', 'middle')
    .attr('font-family', 'var(--serif)').attr('font-weight', 700)
    .style('font-size', (bigFmt ? 64 : 34) + 'px').attr('fill', '#1A1A1A');
  ctr.text(pctIntra + '%');
  d3.select(svg).append('text')
    .attr('x', cx).attr('y', cy + (bigFmt ? 26 : 14)).attr('text-anchor', 'middle')
    .attr('font-family', 'var(--sans)')
    .style('font-size', SIZES.sub + 'px').attr('fill', '#4A4A4A')
    .text(LANG === 'en' ? 'played within a confederation' : 'se juega dentro de una confederación');

  // hover: aislar cinta / arco + tooltip
  const tooltip = document.getElementById('tooltip5');
  function showTT(ev, html) {
    if (!tooltip) return;
    tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    const rc = svg.getBoundingClientRect();
    tooltip.style.left = (evClientX(ev) - rc.left + 14) + 'px';
    tooltip.style.top = (evClientY(ev) - rc.top + 12) + 'px';
  }
  function hideTT() { if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } }
  if (!isPngFormat) {
    ribbons
      .on('mouseenter', function (ev, d) {
        ribbons.style('opacity', x => x === d ? 1 : 0.08);
        const i = d.source.index, j = d.target.index;
        const v = M[i][j];
        const pct = (100 * v / totalReal);
        const nm = i === j
          ? `${t('conf.' + confs[i])}: ${fmt(v)} ${t('c5-tt-intra')}`
          : `${t('conf.' + confs[i])} – ${t('conf.' + confs[j])}: ${fmt(v)} ${t('c5-tt-inter')}`;
        showTT(ev, `<div style="font-weight:600;margin-bottom:2px;">${nm}</div>` +
          `<div>${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}% del total</div>`);
      })
      .on('mouseleave', () => { ribbons.style('opacity', ''); hideTT(); });
    groups.on('mouseenter', function (ev, d) {
      const i = d.index;
      ribbons.style('opacity', x => (x.source.index === i || x.target.index === i) ? 1 : 0.08);
      const tot = M[i].reduce((a, v) => a + v, 0);
      const own = M[i][i];
      showTT(ev, `<div style="font-weight:600;margin-bottom:2px;">${t('conf.' + confs[i])} · ${t('conf-long.' + confs[i])}</div>` +
        `<div>${fmt(tot)} partidos · ${Math.round(100 * own / tot)}% ${t('c5-tt-intra')}</div>`);
    }).on('mouseleave', () => { ribbons.style('opacity', ''); hideTT(); });
  }

  atlasSetHeading('5', s.period === 'reciente', {
    title: 'c5-title', titleNeutral: 'c5-title-neutral',
    subtitle: 'c5-subtitle', subtitleNeutral: 'c5-subtitle-neutral',
  });
}

function setupFlujosCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_CHORD;
    let csv = 'periodo,conf_a,conf_b,partidos\n';
    ['historia', 'reciente'].forEach(per => {
      const M = D[per];
      for (let i = 0; i < D.confs.length; i++)
        for (let j = i; j < D.confs.length; j++)
          csv += `${per === 'historia' ? 'historia completa' : 'desde 1990'},${D.confs[i]},${D.confs[j]},${M[i][j]}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-flujos.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initFlujos() {
  const s = fl_state();
  document.querySelectorAll('#fl-period button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#fl-period button').forEach(x => x.classList.toggle('active', x === b));
    s.period = b.dataset.period;
    drawFlujos();
  }));
  drawFlujos();
  setupFlujosCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initFlujos._wired) {
    initFlujos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawFlujos());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawFlujos;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '5') return null;
    return (typeof t === 'function' ? t('c5-sources-tpl') : '') || null;
  };
}
