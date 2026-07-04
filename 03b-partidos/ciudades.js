// =============================================================
//  Especial partidos — Chart 6: las capitales inesperadas (mapa)
// =============================================================
// Mapamundi Robinson con una burbuja por ciudad sede (área ∝ partidos
// organizados). Toggle: todos los partidos / solo cancha neutral. Buscador
// de ciudades, zoom/pan, tooltip. Requiere d3 v7 + d3-geo-projection y el
// GEO_COUNTRIES del N°3 (data-country-geo.js). Datos: DATA_CIUDADES.

const CI_COL = '#BE5D32';
const CI_COL_NEU = '#3E5A6E';

function ci_state() {
  if (!state[6]) state[6] = {};
  if (!state[6].mode) state[6].mode = 'all';    // 'all' | 'neutral'
  if (!state[6].sel) state[6].sel = null;       // ciudad seleccionada (búsqueda)
  return state[6];
}

let ci_zoomBehavior = null, ci_currentTransform = null;

function drawCiudades() {
  const svg = document.getElementById('chart6');
  if (!svg || typeof d3 === 'undefined' || typeof GEO_COUNTRIES_LITE === 'undefined') return;
  svg.innerHTML = '';
  const s = ci_state();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = 1100, H = 580;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = f.vbH; }
  else if (mobile) { W = 1100; H = 700; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = !!editorFormat;
  const SIZES = bigFmt ? { label: 23 } : { label: 11.5 };

  const PAD = 8;
  const projection = d3.geoRobinson()
    .fitExtent([[PAD, PAD], [W - PAD, H - PAD]], { type: 'Sphere' });
  const path = d3.geoPath(projection);

  const root = d3.select(svg).append('g');

  // fondo: países en gris cálido suave
  root.append('g').selectAll('path')
    .data(GEO_COUNTRIES_LITE.features).join('path')
    .attr('d', path)
    .attr('fill', '#EDE8DB')
    .attr('stroke', '#FAF8F3')
    .attr('stroke-width', 0.5)
    .attr('vector-effect', 'non-scaling-stroke');

  // burbujas
  const neutral = s.mode === 'neutral';
  const data = DATA_CIUDADES
    .map(c => ({ ...c, v: neutral ? c.neu : c.p }))
    .filter(c => c.v > 0)
    .sort((a, b) => b.v - a.v);
  const vMax = data.length ? data[0].v : 1;
  const rOf = d3.scaleSqrt().domain([1, vMax]).range(bigFmt ? [1.6, 34] : [1, 24]);
  const col = neutral ? CI_COL_NEU : CI_COL;

  const gB = root.append('g');
  const bubbles = gB.selectAll('circle')
    .data(data, c => c.n + '|' + c.pais).join('circle')
    .attr('cx', c => { const p = projection([c.lon, c.lat]); return p ? p[0] : -99; })
    .attr('cy', c => { const p = projection([c.lon, c.lat]); return p ? p[1] : -99; })
    .attr('r', c => rOf(c.v))
    .attr('fill', col).attr('fill-opacity', 0.55)
    .attr('stroke', col).attr('stroke-width', 0.8)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('cursor', 'pointer');

  // etiquetas del top (con halo)
  const nLbl = bigFmt ? 8 : 10;
  const gL = root.append('g');
  gL.selectAll('text').data(data.slice(0, nLbl)).join('text')
    .text(c => c.n)
    .attr('x', c => { const p = projection([c.lon, c.lat]); return (p ? p[0] : 0) + rOf(c.v) + 3; })
    .attr('y', c => { const p = projection([c.lon, c.lat]); return (p ? p[1] : 0) + 4; })
    .attr('font-family', 'var(--sans)').attr('font-weight', 600)
    .style('font-size', SIZES.label + 'px')
    .attr('fill', '#1A1A1A')
    .attr('paint-order', 'stroke').attr('stroke', '#FAF8F3')
    .attr('stroke-width', bigFmt ? 5 : 3).attr('stroke-linejoin', 'round')
    .attr('pointer-events', 'none');

  // tooltip
  const tooltip = document.getElementById('tooltip6');
  function showTT(ev, c) {
    if (!tooltip) return;
    let html = `<div style="font-weight:600;margin-bottom:2px;">${c.n} · ${atlasCountryName(c.pais)}</div>`;
    html += `<div>${fmt(c.p)} ${t('c6-tt-partidos')} (${fmt(c.neu)} ${t('c6-tt-neutrales')})</div>`;
    html += `<div style="opacity:0.75;">${t('c6-tt-periodo')}: ${c.y0}–${c.y1}</div>`;
    tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
    const rc = svg.getBoundingClientRect();
    tooltip.style.left = (evClientX(ev) - rc.left + 14) + 'px';
    tooltip.style.top = (evClientY(ev) - rc.top + 12) + 'px';
  }
  function hideTT() { if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } }
  if (!isPngFormat) {
    bubbles.on('mouseenter', function (ev, c) {
      d3.select(this).attr('fill-opacity', 0.9);
      showTT(ev, c);
    }).on('mouseleave', function () {
      d3.select(this).attr('fill-opacity', 0.55);
      hideTT();
    });
  }

  // resaltar la ciudad buscada
  if (s.sel) {
    const c = data.find(x => x.n === s.sel);
    if (c) {
      const p = projection([c.lon, c.lat]);
      if (p) {
        root.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', rOf(c.v) + 4)
          .attr('fill', 'none').attr('stroke', '#1A1A1A').attr('stroke-width', 1.6)
          .attr('vector-effect', 'non-scaling-stroke');
        gL.append('text').text(c.n)
          .attr('x', p[0] + rOf(c.v) + 4).attr('y', p[1] - 6)
          .attr('font-family', 'var(--sans)').attr('font-weight', 700)
          .style('font-size', SIZES.label + 'px').attr('fill', '#1A1A1A')
          .attr('paint-order', 'stroke').attr('stroke', '#FAF8F3')
          .attr('stroke-width', bigFmt ? 5 : 3);
      }
    }
  }

  // zoom + pan (solo interactivo, no en export)
  if (!isPngFormat) {
    ci_zoomBehavior = d3.zoom().scaleExtent([1, 9]).on('zoom', (ev) => {
      ci_currentTransform = ev.transform;
      root.attr('transform', ev.transform);
    });
    d3.select(svg).call(ci_zoomBehavior);
    if (ci_currentTransform) {
      d3.select(svg).call(ci_zoomBehavior.transform, ci_currentTransform);
    }
    const resetBtn = document.getElementById('ci-reset-zoom');
    if (resetBtn) resetBtn.onclick = () => {
      ci_currentTransform = null;
      d3.select(svg).transition().duration(250).call(ci_zoomBehavior.transform, d3.zoomIdentity);
    };
  }

  atlasSetHeading('6', s.mode === 'all' && !s.sel, {
    title: 'c6-title', titleNeutral: 'c6-title-neutral',
    subtitle: 'c6-subtitle', subtitleNeutral: 'c6-subtitle-neutral',
  });
}

function ci_norm(x) { return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

function setupCiudadesSearch() {
  const input = document.getElementById('ci-search'), results = document.getElementById('ci-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  function get(q) {
    if (!q) return [];
    const qn = ci_norm(q);
    return DATA_CIUDADES
      .filter(c => ci_norm(c.n).includes(qn) || ci_norm(c.pais).includes(qn) || ci_norm(atlasCountryName(c.pais)).includes(qn))
      .sort((a, b) => b.p - a.p).slice(0, 8);
  }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) =>
      `<div class="m-search-result${i === a ? ' m-active' : ''}" data-city="${c.n}">` +
      `<span>${c.n} · ${atlasCountryName(c.pais)}</span><span>${fmt(c.p)}</span></div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result').forEach(el => el.addEventListener('click', () => {
      state[6].sel = el.dataset.city; input.value = el.dataset.city;
      results.classList.remove('open'); drawCiudades();
    }));
  }
  input.addEventListener('input', () => {
    if (!input.value) { state[6].sel = null; drawCiudades(); }
    matches = get(input.value); active = matches.length ? 0 : -1; render(active);
  });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) {
      ev.preventDefault(); state[6].sel = matches[active].n; input.value = matches[active].n;
      results.classList.remove('open'); drawCiudades();
    }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

function setupCiudadesCSV() {
  document.querySelectorAll('button.download[data-chart="6-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'ciudad,pais,lat,lon,partidos,neutrales,primer_anio,ultimo_anio\n';
    DATA_CIUDADES.forEach(c => {
      const nm = /[",]/.test(c.n) ? '"' + c.n.replace(/"/g, '""') + '"' : c.n;
      const ps = /[",]/.test(c.pais) ? '"' + c.pais.replace(/"/g, '""') + '"' : c.pais;
      csv += `${nm},${ps},${c.lat},${c.lon},${c.p},${c.neu},${c.y0},${c.y1}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-ciudades.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initCiudades() {
  ci_state();
  document.querySelectorAll('#ci-mode button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ci-mode button').forEach(x => x.classList.toggle('active', x === b));
    state[6].mode = b.dataset.mode;
    drawCiudades();
  }));
  drawCiudades();
  setupCiudadesSearch();
  setupCiudadesCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initCiudades._wired) {
    initCiudades._wired = true;
    window.addEventListener('atlas-editor-change', () => drawCiudades());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawCiudades;
  window.__atlasDefaultPngFormat = 'worldmap';
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '6') return null;
    return (typeof t === 'function' ? t('c6-sources-tpl') : '') || null;
  };
}
