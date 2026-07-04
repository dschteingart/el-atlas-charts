// =============================================================
//  Especial partidos — Chart 4: la red de duelos (seis islas)
// =============================================================
// Red de fuerza (D3): cada nodo es una selección (color = confederación,
// tamaño = partidos totales), cada línea un duelo con al menos el umbral
// elegido de partidos. Toggle de período (historia / desde 1990) y slider
// de umbral. Hover: aísla el vecindario y lista los rivales más frecuentes.
// Datos: DATA_DUELOS (data-partidos.js). Requiere d3 v7.

const DU_W_DESKTOP = 1100, DU_H_DESKTOP = 640;

function du_state() {
  if (!state[4]) state[4] = {};
  if (!state[4].period) state[4].period = 'all';        // 'all' | '90'
  if (!state[4].minP) state[4].minP = { all: 25, '90': 12 };
  return state[4];
}

let du_sim = null, du_posCache = {};

function du_visible() {
  const s = du_state();
  const D = DATA_DUELOS;
  const use90 = s.period === '90';
  const min = s.minP[s.period];
  const links = D.links
    .map(l => ({ a: l[0], b: l[1], p: use90 ? l[3] : l[2] }))
    .filter(l => l.p >= min);
  const touched = new Set();
  links.forEach(l => { touched.add(l.a); touched.add(l.b); });
  const nodes = D.nodes.map((nd, i) => ({ ...nd, idx: i, size: use90 ? nd.p90 : nd.p }))
    .filter(nd => touched.has(nd.idx));
  return { nodes, links };
}

function drawDuelos() {
  const svg = document.getElementById('chart4');
  if (!svg || typeof d3 === 'undefined') return;
  svg.innerHTML = '';
  const s = du_state();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = DU_W_DESKTOP, H = DU_H_DESKTOP;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = editorFormat === 'square' ? 900 : f.vbH; }
  else if (mobile) { W = 1100; H = 1050; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = !!editorFormat;
  const SIZES = bigFmt ? { label: 24, hint: 20 } : { label: 11.5, hint: 11 };

  const { nodes, links } = du_visible();
  const tooltip = document.getElementById('tooltip4');

  // posiciones iniciales: cada confederación arranca agrupada en un ángulo
  // (así el force converge rápido y las islas quedan legibles).
  const angle = {}; CONF_FIFA_ORDER.forEach((cf, i) => angle[cf] = (i / CONF_FIFA_ORDER.length) * 2 * Math.PI);
  const cx = W / 2, cy = H / 2, R0 = Math.min(W, H) * 0.33;
  const cacheKey = s.period + ':' + s.minP[s.period];
  nodes.forEach(nd => {
    const cached = du_posCache[cacheKey] && du_posCache[cacheKey][nd.id];
    if (cached) { nd.x = cached[0]; nd.y = cached[1]; }
    else {
      nd.x = cx + R0 * Math.cos(angle[nd.conf]) + (Math.random() - 0.5) * 60;
      nd.y = cy + R0 * Math.sin(angle[nd.conf]) + (Math.random() - 0.5) * 60;
    }
  });
  const byIdx = {}; nodes.forEach(nd => byIdx[nd.idx] = nd);
  const linkObjs = links.map(l => ({ source: byIdx[l.a], target: byIdx[l.b], p: l.p }));

  const rOf = d3.scaleSqrt().domain([1, d3.max(nodes, nd => nd.size) || 1]).range(bigFmt ? [4, 26] : [2.5, 17]);
  const wOf = d3.scaleLinear().domain(d3.extent(linkObjs, l => l.p)).range(bigFmt ? [1.2, 7] : [0.7, 4.5]);

  const gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(gLinks); svg.appendChild(gNodes); svg.appendChild(gLabels);

  const linkSel = d3.select(gLinks).selectAll('line').data(linkObjs).join('line')
    .attr('stroke', '#8A8579').attr('stroke-opacity', 0.28)
    .attr('stroke-width', l => wOf(l.p));

  const nodeSel = d3.select(gNodes).selectAll('circle').data(nodes).join('circle')
    .attr('r', nd => rOf(nd.size))
    .attr('fill', nd => CONF_FIFA_COLORS[nd.conf] || '#9a9488')
    .attr('stroke', '#FAF8F3').attr('stroke-width', bigFmt ? 1.6 : 1)
    .style('cursor', 'pointer');

  // etiquetas: los nodos más grandes (por confederación, para que todas tengan presencia)
  const nLbl = bigFmt ? 2 : 3;
  const labeled = [];
  CONF_FIFA_ORDER.forEach(cf => {
    nodes.filter(nd => nd.conf === cf).sort((a, b) => b.size - a.size).slice(0, nLbl).forEach(nd => labeled.push(nd));
  });
  const lblSel = d3.select(gLabels).selectAll('text').data(labeled).join('text')
    .text(nd => atlasCountryName(nd.id))
    .attr('font-family', 'var(--sans)').attr('font-weight', 600)
    .style('font-size', SIZES.label + 'px')
    .attr('fill', nd => CONF_FIFA_LABEL_COLORS[nd.conf] || '#4A4A4A')
    .attr('paint-order', 'stroke').attr('stroke', '#FAF8F3')
    .attr('stroke-width', bigFmt ? 5 : 3).attr('stroke-linejoin', 'round')
    .attr('pointer-events', 'none');

  function tick() {
    linkSel.attr('x1', l => l.source.x).attr('y1', l => l.source.y)
      .attr('x2', l => l.target.x).attr('y2', l => l.target.y);
    nodeSel.attr('cx', nd => Math.max(14, Math.min(W - 14, nd.x)))
      .attr('cy', nd => Math.max(14, Math.min(H - 14, nd.y)));
    lblSel.attr('x', nd => nd.x + rOf(nd.size) + (bigFmt ? 6 : 3))
      .attr('y', nd => nd.y + 4);
  }

  if (du_sim) du_sim.stop();
  du_sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(linkObjs).distance(l => 46 - Math.min(28, l.p * 0.25)).strength(l => Math.min(0.9, 0.12 + l.p / 120)))
    .force('charge', d3.forceManyBody().strength(bigFmt ? -60 : -42))
    .force('center', d3.forceCenter(cx, cy))
    .force('collide', d3.forceCollide(nd => rOf(nd.size) + (bigFmt ? 3 : 2)))
    .alpha(du_posCache[cacheKey] ? 0.12 : 0.9)
    .on('tick', tick)
    .on('end', () => {
      du_posCache[cacheKey] = {};
      nodes.forEach(nd => du_posCache[cacheKey][nd.id] = [nd.x, nd.y]);
    });

  // hover / tap: aislar vecindario + tooltip con rivales más frecuentes
  function neighbors(nd) {
    return linkObjs.filter(l => l.source === nd || l.target === nd)
      .map(l => ({ other: l.source === nd ? l.target : l.source, p: l.p }))
      .sort((a, b) => b.p - a.p);
  }
  function emph(nd) {
    if (!nd) {
      nodeSel.style('opacity', ''); linkSel.style('opacity', ''); lblSel.style('opacity', '');
      if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; }
      return;
    }
    const nb = new Set(neighbors(nd).map(o => o.other)); nb.add(nd);
    nodeSel.style('opacity', o => nb.has(o) ? 1 : 0.12);
    linkSel.style('opacity', l => (l.source === nd || l.target === nd) ? 0.75 : 0.05);
    lblSel.style('opacity', o => nb.has(o) ? 1 : 0.15);
  }
  nodeSel
    .on('mouseenter', function (ev, nd) {
      if (isPngFormat) return;
      emph(nd);
      if (!tooltip) return;
      const rows = neighbors(nd).slice(0, 6);
      let html = `<div style="font-weight:600;margin-bottom:4px;">${atlasCountryName(nd.id)} · ${t('conf.' + nd.conf)}</div>`;
      html += `<div style="margin-bottom:4px;">${fmt(nd.size)} ${t('c4-tt-partidos').split(' ')[0]}</div>`;
      rows.forEach(r => {
        html += `<div style="display:flex;gap:8px;justify-content:space-between;"><span>${atlasCountryName(r.other.id)}</span><strong>${fmt(r.p)}</strong></div>`;
      });
      tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
      const rc = document.getElementById('chart4').getBoundingClientRect();
      tooltip.style.left = (evClientX(ev) - rc.left + 14) + 'px';
      tooltip.style.top = (evClientY(ev) - rc.top + 12) + 'px';
    })
    .on('mouseleave', () => emph(null))
    .call(d3.drag()
      .on('start', (ev, nd) => { if (!ev.active) du_sim.alphaTarget(0.2).restart(); nd.fx = nd.x; nd.fy = nd.y; })
      .on('drag', (ev, nd) => { nd.fx = ev.x; nd.fy = ev.y; })
      .on('end', (ev, nd) => { if (!ev.active) du_sim.alphaTarget(0); nd.fx = null; nd.fy = null; }));

  // resumen de la vista (n selecciones / n duelos)
  const info = document.getElementById('du-info');
  if (info) info.textContent = `${nodes.length} selecciones · ${linkObjs.length} duelos`;

  atlasSetHeading('4', s.period === 'all' && s.minP.all === 25, {
    title: 'c4-title', titleNeutral: 'c4-title-neutral',
    subtitle: 'c4-subtitle', subtitleNeutral: 'c4-subtitle-neutral',
  });
}

function setupDuelosCSV() {
  document.querySelectorAll('button.download[data-chart="4-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_DUELOS;
    let csv = 'equipo_a,equipo_b,partidos,partidos_desde_1990\n';
    D.links.forEach(l => {
      csv += `${D.nodes[l[0]].id},${D.nodes[l[1]].id},${l[2]},${l[3]}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-duelos.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function du_legend() {
  const c = document.getElementById('du-legend'); if (!c) return;
  c.innerHTML = '';
  CONF_FIFA_ORDER.forEach(cf => {
    const it = document.createElement('span');
    it.style.cssText = 'display:inline-flex;align-items:center;gap:5px;font-family:var(--sans);font-size:12px;color:var(--ink-soft);margin-right:12px;';
    it.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CONF_FIFA_COLORS[cf]};"></span>${t('conf.' + cf)}`;
    c.appendChild(it);
  });
}

function initDuelos() {
  const s = du_state();
  document.querySelectorAll('#du-period button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#du-period button').forEach(x => x.classList.toggle('active', x === b));
    s.period = b.dataset.period;
    const slider = document.getElementById('du-min');
    if (slider) slider.value = s.minP[s.period];
    du_updateMinLabel();
    drawDuelos();
  }));
  const slider = document.getElementById('du-min');
  if (slider) {
    slider.value = s.minP[s.period];
    slider.addEventListener('input', () => {
      s.minP[s.period] = +slider.value;
      du_updateMinLabel();
      drawDuelos();
    });
  }
  du_updateMinLabel();
  du_legend();
  drawDuelos();
  setupDuelosCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initDuelos._wired) {
    initDuelos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawDuelos());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDuelos;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '4') return null;
    return (typeof t === 'function' ? t('c4-sources-tpl') : '') || null;
  };
}

function du_updateMinLabel() {
  const s = du_state();
  const el = document.getElementById('du-min-val');
  if (el) el.textContent = s.minP[s.period];
}
