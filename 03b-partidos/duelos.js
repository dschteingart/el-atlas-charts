// =============================================================
//  Especial partidos — Chart 4: la red de duelos
// =============================================================
// Red de fuerza (D3): cada nodo es una selección (color = confederación,
// tamaño = partidos jugados EN EL PERÍODO elegido), cada línea un duelo con
// al menos el umbral elegido de partidos en ese período.
//
// Rendimiento y capas separadas:
//   · POSICIONES: el layout de fuerza se calcula por PERÍODO y se cachea. Al
//     cambiar el período (soltar el slider) se relocaliza, porque la centralidad
//     de cada selección cambia en el tiempo. El umbral NO reubica: solo filtra.
//   · APARIENCIA (du_paint): tamaños, qué se ve, etiquetas y énfasis. Barata,
//     coalescida con requestAnimationFrame. Por eso el umbral es instantáneo
//     aunque baje a 5 (miles de aristas) y no rebota el thumb.
//
// Datos: DATA_DUELOS (links y teamsY con serie anual RLE [offset, cant, ...]
// desde y0=1872; cada nodo trae su sigla FIFA). Requiere d3 v7.

const DU_W_DESKTOP = 1100, DU_H_DESKTOP = 560;   // más ancho que alto: usa el espacio y evita scroll
const DU_PERIOD_FULL = [1872, 2025];
const DU_LAYOUT_FLOOR = 8;   // aristas que "arman" el layout de cada época
// selecciones grandes que siempre llevan sigla por default (si la burbuja entra)
const DU_PRIORITY = ['Argentina', 'Brazil', 'Uruguay', 'Italy', 'Germany', 'Spain', 'Portugal', 'Netherlands', 'France', 'England'];

function du_state() {
  if (!state[4]) state[4] = {};
  if (!Array.isArray(state[4].period)) state[4].period = DU_PERIOD_FULL.slice();
  if (typeof state[4].minP !== 'number') state[4].minP = 25;
  if (!('highlight' in state[4])) state[4].highlight = null;   // id de selección destacada
  return state[4];
}

let du_layoutCache = {}, du_view = null;
let du_hoverIdx = null, du_dragging = false, du_dragMoved = false, du_rafId = 0;

function du_rleCount(rle, a, b) {
  const y0 = DATA_DUELOS.y0;
  let n = 0;
  for (let i = 0; i < rle.length; i += 2) { const y = y0 + rle[i]; if (y >= a && y <= b) n += rle[i + 1]; }
  return n;
}

// ---- estructura estable (una vez por formato): nodos + aristas ---------------
function du_structure(W, H) {
  const key = 's:' + W + 'x' + H;
  if (du_layoutCache[key]) return du_layoutCache[key];
  const [A, B] = DU_PERIOD_FULL;
  const nodes = DATA_DUELOS.nodes.map((nd, i) => ({ id: nd.id, conf: nd.conf, sig: nd.sig, idx: i, x: 0, y: 0, size: du_rleCount(DATA_DUELOS.teamsY[i], A, B) }));
  const links = [];
  DATA_DUELOS.links.forEach(l => { if (du_rleCount(l[2], A, B) >= 5) links.push({ source: nodes[l[0]], target: nodes[l[1]], rle: l[2], p: 0 }); });
  const touched = new Set(); links.forEach(l => { touched.add(l.source.idx); touched.add(l.target.idx); });
  const useNodes = nodes.filter(n => touched.has(n.idx));
  const cx = W / 2, cy = H / 2, anchor = {};
  CONF_FIFA_ORDER.forEach((cf, i) => { const a = -Math.PI / 2 + (i / CONF_FIFA_ORDER.length) * 2 * Math.PI; anchor[cf] = { x: cx + W * 0.40 * Math.cos(a), y: cy + H * 0.40 * Math.sin(a) }; });
  du_layoutCache[key] = { nodes: useNodes, links, anchor, cx, cy };
  return du_layoutCache[key];
}

// ---- layout por período (cacheado): reubica según la centralidad de la época -
function du_layoutFor(a, b, W, H) {
  const st = du_structure(W, H);
  const key = 'p:' + a + '-' + b + ':' + W + 'x' + H;
  if (du_layoutCache[key]) { st.nodes.forEach(nd => { const p = du_layoutCache[key][nd.idx]; nd.x = p[0]; nd.y = p[1]; }); return st; }
  const nodes = st.nodes, anchor = st.anchor, cx = st.cx, cy = st.cy;
  nodes.forEach(nd => { nd.size = du_rleCount(DATA_DUELOS.teamsY[nd.idx], a, b); const an = anchor[nd.conf] || { x: cx, y: cy }; nd.x = an.x + (Math.random() - 0.5) * 60; nd.y = an.y + (Math.random() - 0.5) * 60; });
  const rOf = d3.scaleLinear().domain([0, d3.max(nodes, nd => nd.size) || 1]).range([3, 30]);
  const strong = st.links.map(l => ({ source: l.source, target: l.target, w: du_rleCount(l.rle, a, b) })).filter(l => l.w >= DU_LAYOUT_FLOOR);
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(strong).distance(l => 46 - Math.min(28, l.w * 0.25)).strength(l => Math.min(0.9, 0.12 + l.w / 120)))
    .force('charge', d3.forceManyBody().strength(-60).distanceMax(Math.min(W, H) * 0.32))
    .force('x', d3.forceX(nd => (anchor[nd.conf] || { x: cx }).x).strength(0.07))
    .force('y', d3.forceY(nd => (anchor[nd.conf] || { y: cy }).y).strength(0.09))
    .force('collide', d3.forceCollide(nd => rOf(nd.size) + 3))
    .stop();
  for (let i = 0; i < 240; i++) { sim.tick(); nodes.forEach(nd => { const r = rOf(nd.size) + 4; nd.x = Math.max(r, Math.min(W - r, nd.x)); nd.y = Math.max(r, Math.min(H - r, nd.y)); }); }
  // encajar y llenar: medir el recuadro de los nodos ACTIVOS (los que se ven en
  // el período) y escalar/centrar la red para que ocupe todo el lienzo. Sin esto
  // queda un blob chico en el medio con mucho vacío alrededor (en PNG y en la web).
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
  nodes.forEach(nd => { if (nd.size <= 0) return; const r = rOf(nd.size) + 2; if (nd.x - r < mnx) mnx = nd.x - r; if (nd.x + r > mxx) mxx = nd.x + r; if (nd.y - r < mny) mny = nd.y - r; if (nd.y + r > mxy) mxy = nd.y + r; });
  const M = Math.min(W, H) * 0.05, bw = mxx - mnx, bh = mxy - mny;
  if (bw > 0 && bh > 0) {
    // escala por eje con tope, pero limitando la anisotropía a 1.35x para no
    // deformar mucho las islas (los círculos no se deforman: solo se separan más)
    let sx = Math.min(1.8, (W - 2 * M) / bw), sy = Math.min(1.8, (H - 2 * M) / bh);
    sx = Math.min(sx, sy * 1.35); sy = Math.min(sy, sx * 1.35);
    const bcx = (mnx + mxx) / 2, bcy = (mny + mxy) / 2;
    nodes.forEach(nd => { nd.x = W / 2 + (nd.x - bcx) * sx; nd.y = H / 2 + (nd.y - bcy) * sy; });
  }
  du_layoutCache[key] = {}; nodes.forEach(nd => du_layoutCache[key][nd.idx] = [nd.x, nd.y]);
  return st;
}

// ---- construir DOM (una vez por formato) -----------------------------------
function du_build(W, H, bigFmt) {
  const svg = document.getElementById('chart4');
  svg.innerHTML = '';
  const s = du_state();
  const st = du_layoutFor(s.period[0], s.period[1], W, H);
  const gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(gLinks); svg.appendChild(gNodes); svg.appendChild(gLabels);

  const linkSel = d3.select(gLinks).selectAll('line').data(st.links).join('line').attr('stroke', '#8A8579');
  const nodeSel = d3.select(gNodes).selectAll('circle').data(st.nodes).join('circle')
    .attr('fill', nd => CONF_FIFA_COLORS[nd.conf] || '#9a9488')
    .attr('stroke', '#FAF8F3').attr('stroke-width', bigFmt ? 1.6 : 1).style('cursor', 'pointer');
  const lblSel = d3.select(gLabels).selectAll('text').data(st.nodes).join('text')
    .text(nd => nd.sig).attr('font-family', 'var(--sans)').attr('font-weight', 700)
    .attr('fill', '#fff').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('pointer-events', 'none');

  const incident = st.nodes.map(() => []);
  const idxOf = {}; st.nodes.forEach((n, i) => idxOf[n.idx] = i);
  linkSel.each(function (l) { incident[idxOf[l.source.idx]].push({ el: this, end: '1' }); incident[idxOf[l.target.idx]].push({ el: this, end: '2' }); });

  du_view = { key: W + 'x' + H, W, H, bigFmt, st, linkSel, nodeSel, lblSel, incident, idxOf, visLinks: [], visNodes: new Set(), rOf: null };
  du_positions();
  du_wireEvents();
  return du_view;
}

// posiciona los elementos según nd.x / nd.y (tras layout o drag)
function du_positions() {
  const v = du_view; if (!v) return;
  v.linkSel.attr('x1', l => l.source.x).attr('y1', l => l.source.y).attr('x2', l => l.target.x).attr('y2', l => l.target.y);
  v.nodeSel.attr('cx', nd => nd.x).attr('cy', nd => nd.y);
  v.lblSel.attr('x', nd => nd.x).attr('y', nd => nd.y);
}

// ---- pintar apariencia (por interacción; NO reubica) -----------------------
function du_paint() {
  const v = du_view; if (!v) return;
  const s = du_state(), [a, b] = s.period, min = s.minP;
  let maxSize = 1;
  v.st.nodes.forEach(nd => { nd.size = du_rleCount(DATA_DUELOS.teamsY[nd.idx], a, b); if (nd.size > maxSize) maxSize = nd.size; });
  const rOf = d3.scaleLinear().domain([0, maxSize]).range(v.bigFmt ? [3, 30] : [2, 26]);
  v.rOf = rOf;

  const visNodes = new Set(), visLinks = [];
  v.st.links.forEach(l => { l.p = du_rleCount(l.rle, a, b); if (l.p >= min) { visLinks.push(l); visNodes.add(l.source.idx); visNodes.add(l.target.idx); } });
  const hi = s.highlight != null ? (v.st.nodes.find(n => n.id === s.highlight) || null) : null;
  if (hi) visNodes.add(hi.idx);
  v.visNodes = visNodes; v.visLinks = visLinks;
  const wExt = d3.extent(visLinks, l => l.p);
  const wOf = d3.scaleLinear().domain(wExt[0] == null ? [1, 1] : wExt).range(v.bigFmt ? [1.2, 7] : [0.7, 4.5]);

  v.linkSel.attr('display', l => (l.p >= min ? null : 'none')).attr('stroke-width', l => wOf(l.p)).attr('stroke-opacity', 0.28);
  v.nodeSel.attr('display', nd => (visNodes.has(nd.idx) ? null : 'none')).attr('r', nd => rOf(nd.size)).style('opacity', 1);

  const info = document.getElementById('du-info');
  if (info) info.textContent = `${visNodes.size} selecciones · ${visLinks.length} duelos`;

  du_refreshFocus();
  du_applyHeadings();
}

// etiquetas: por default los grandes + la lista prioritaria; con foco (hover o
// destacado) las siglas de TODO el vecindario, con tamaño ajustado a la burbuja.
function du_updateLabels(srcIdx) {
  const v = du_view; if (!v) return;
  const rOf = v.rOf, bigFmt = v.bigFmt;
  const SIG_MAX = bigFmt ? 18 : 26, SIG_MIN_R = bigFmt ? 12 : 9, MINI = bigFmt ? 6 : 5;
  let labelSet;
  if (srcIdx != null) {
    labelSet = new Set([srcIdx]);
    v.visLinks.forEach(l => { if (l.source.idx === srcIdx) labelSet.add(l.target.idx); else if (l.target.idx === srcIdx) labelSet.add(l.source.idx); });
  } else {
    const shown = v.st.nodes.filter(nd => v.visNodes.has(nd.idx));
    labelSet = new Set(shown.filter(nd => rOf(nd.size) >= SIG_MIN_R).sort((x, y) => y.size - x.size).slice(0, SIG_MAX).map(nd => nd.idx));
    DU_PRIORITY.forEach(id => { const nd = v.st.nodes.find(n => n.id === id); if (nd && v.visNodes.has(nd.idx) && rOf(nd.size) >= SIG_MIN_R) labelSet.add(nd.idx); });
  }
  v.lblSel.attr('display', nd => (labelSet.has(nd.idx) && rOf(nd.size) >= MINI) ? null : 'none')
    .style('font-size', nd => Math.min(bigFmt ? 15 : 13, Math.max(6.5, rOf(nd.size) * 0.92)) + 'px');
}

// énfasis (opacidad) del vecindario de un nodo; null = todo normal
function du_applyEmph(idx) {
  const v = du_view; if (!v) return;
  if (idx == null) { v.nodeSel.style('opacity', 1); v.linkSel.style('stroke-opacity', 0.28); v.lblSel.style('opacity', null); return; }
  const nb = new Set([idx]);
  v.visLinks.forEach(l => { if (l.source.idx === idx) nb.add(l.target.idx); else if (l.target.idx === idx) nb.add(l.source.idx); });
  v.nodeSel.style('opacity', nd => nb.has(nd.idx) ? 1 : 0.12);
  v.linkSel.style('stroke-opacity', l => (l.source.idx === idx || l.target.idx === idx) ? 0.75 : 0.05);
  v.lblSel.style('opacity', nd => nb.has(nd.idx) ? 1 : 0.15);
}
// foco efectivo = hover si hay, si no el destacado (buscador/clic)
function du_refreshFocus() {
  const v = du_view; if (!v) return;
  const s = du_state();
  const hiIdx = s.highlight != null ? ((v.st.nodes.find(n => n.id === s.highlight) || {}).idx) : null;
  const src = du_hoverIdx != null ? du_hoverIdx : (hiIdx != null ? hiIdx : null);
  du_applyEmph(src);
  du_updateLabels(src);
}

function du_requestPaint() { if (du_rafId) return; du_rafId = requestAnimationFrame(() => { du_rafId = 0; du_paint(); }); }

// relocaliza según el período (cachea) y repinta. Snap directo (sin animar) por
// robustez: con umbral bajo hay miles de líneas y transicionarlas todas trabaría.
function du_relayout() {
  const v = du_view; if (!v) return;
  const s = du_state();
  du_layoutFor(s.period[0], s.period[1], v.W, v.H);
  du_positions();
  du_paint();
}

// ---- eventos (hover con tooltip, drag, clic = destacar) --------------------
function du_wireEvents() {
  const v = du_view, tooltip = document.getElementById('tooltip4');
  const isPng = (typeof getActivePngFormat === 'function') && getActivePngFormat();
  v.nodeSel
    .on('mouseenter', function (ev, nd) {
      if (isPng || du_dragging) return;
      du_hoverIdx = nd.idx; du_refreshFocus(); du_showTooltip(ev, nd, tooltip);
    })
    .on('mousemove', function (ev) { if (!du_dragging && tooltip && tooltip.style.display === 'block') du_moveTooltip(ev, tooltip); })
    .on('mouseleave', function () { if (du_dragging) return; du_hoverIdx = null; du_refreshFocus(); if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } })
    .call(d3.drag()
      .on('start', function (ev, nd) { du_dragging = true; du_dragMoved = false; if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } nd.fx = nd.x; nd.fy = nd.y; })
      .on('drag', function (ev, nd) {
        du_dragMoved = true;
        const r = v.rOf ? v.rOf(nd.size) + 4 : 8;
        nd.x = Math.max(r, Math.min(v.W - r, ev.x)); nd.y = Math.max(r, Math.min(v.H - r, ev.y));
        d3.select(this).attr('cx', nd.x).attr('cy', nd.y);
        const li = v.idxOf[nd.idx], lbl = v.lblSel.nodes()[li];
        if (lbl) { lbl.setAttribute('x', nd.x); lbl.setAttribute('y', nd.y); }
        v.incident[li].forEach(seg => { seg.el.setAttribute('x' + seg.end, nd.x); seg.el.setAttribute('y' + seg.end, nd.y); });
      })
      .on('end', function (ev, nd) {
        du_dragging = false;
        if (!du_dragMoved) {   // clic sin arrastre = destacar (equivale al buscador)
          const s = du_state(); s.highlight = (s.highlight === nd.id) ? null : nd.id;
          if (du_setupSearch._renderChip) du_setupSearch._renderChip();
          du_paint();
        }
      }));
}

function du_showTooltip(ev, nd, tooltip) {
  if (!tooltip) return;
  const s = du_state(), [a, b] = s.period;
  const neigh = du_view.visLinks.filter(l => l.source.idx === nd.idx || l.target.idx === nd.idx)
    .map(l => ({ other: l.source.idx === nd.idx ? l.target : l.source, p: l.p })).sort((x, y) => y.p - x.p).slice(0, 6);
  let html = `<div style="font-weight:600;margin-bottom:4px;">${atlasCountryName(nd.id)} · ${t('conf.' + nd.conf)}</div>`;
  html += `<div style="margin-bottom:4px;">${fmt(nd.size)} ${t('c4-tt-partidos').split(' ')[0]}</div>`;
  neigh.forEach(r => { html += `<div style="display:flex;gap:8px;justify-content:space-between;"><span>${atlasCountryName(r.other.id)}</span><strong>${fmt(r.p)}</strong></div>`; });
  // rival de otra confederación: precomputado (histórico, sin el piso de 5), así
  // aparece aun cuando ese cruce tenga pocos partidos y no esté entre las aristas.
  const xc = DATA_DUELOS.nodes[nd.idx].x;   // [idRival, partidos] o null si nunca cruzó
  if (xc) html += `<div style="margin-top:5px;padding-top:4px;border-top:1px solid rgba(255,255,255,.18);opacity:.85;">${t('c4-tt-cross')}: <strong>${atlasCountryName(xc[0])}</strong> (${fmt(xc[1])})</div>`;
  tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
  du_moveTooltip(ev, tooltip);
}
function du_moveTooltip(ev, tooltip) {
  const rc = document.getElementById('chart4').getBoundingClientRect();
  tooltip.style.left = (evClientX(ev) - rc.left + 14) + 'px';
  tooltip.style.top = (evClientY(ev) - rc.top + 12) + 'px';
}

// ---- títulos y subtítulo (dinámico, sirve también para el PNG) --------------
function du_subtitle() {
  const s = du_state(), [a, b] = s.period, n = s.minP;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const per = (a === DU_PERIOD_FULL[0] && b === DU_PERIOD_FULL[1]) ? `${a}–${b}` : `${a}–${b}`;
  if (s.highlight != null) {
    const name = atlasCountryName(s.highlight);
    return lang === 'en'
      ? `${name} and the teams it faced most. Each line is a fixture of at least ${n} matches (${per}).`
      : `${name} y las selecciones con las que más jugó. Cada línea marca al menos ${n} partidos entre sí (${per}).`;
  }
  return lang === 'en'
    ? `Each bubble is a national team; its size, matches played. Lines link teams that met at least ${n} times (${per}).`
    : `Cada burbuja es una selección; su tamaño, los partidos que jugó. Las líneas unen a las que se enfrentaron al menos ${n} veces (${per}).`;
}
function du_applyHeadings() {
  const s = du_state();
  const pristine = s.minP === 25 && s.period[0] === DU_PERIOD_FULL[0] && s.period[1] === DU_PERIOD_FULL[1] && s.highlight == null;
  atlasSetHeading('4', pristine, { title: 'c4-title', titleNeutral: 'c4-title-neutral' });
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  const subEl = (document.querySelector('.chart-block[data-chart="4"]') || document).querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = du_subtitle();
}

// ---- orquestador (init / cambio de formato) --------------------------------
function drawDuelos() {
  const svg = document.getElementById('chart4');
  if (!svg || typeof d3 === 'undefined') return;
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = DU_W_DESKTOP, H = DU_H_DESKTOP;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = editorFormat === 'square' ? 900 : f.vbH; }
  else if (mobile) { W = 1100; H = 1050; }
  else {
    // desktop: la altura del viewBox se ajusta al alto que quede de viewport para
    // que el SVG entre sin scroll (el SVG escala al ancho del contenedor, así que
    // un viewBox alto se vuelve altísimo). El paso de "encajar y llenar" completa
    // el espacio, sea cual sea la altura resultante.
    const wrap = svg.closest('.chart-svg-wrap');
    const cw = (wrap && wrap.clientWidth) || 1100;
    const top = wrap ? wrap.getBoundingClientRect().top : 240;
    const avail = window.innerHeight - top - 100;   // reserva para el footer (botones + fuentes)
    H = Math.max(360, Math.min(600, Math.round(W * avail / cw)));
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  du_build(W, H, !!editorFormat || mobile);
  du_paint();
}

// ---- buscador (destacar una selección) -------------------------------------
function du_setupSearch() {
  const input = document.getElementById('du-search'), results = document.getElementById('du-search-results'), chip = document.getElementById('du-search-chip');
  if (!input || !results || !chip) return;
  function renderChip() {
    const s = du_state(); chip.innerHTML = '';
    if (s.highlight == null) return;
    const el = document.createElement('span'); el.className = 'm-selected-chip';
    const nd = DATA_DUELOS.nodes.find(n => n.id === s.highlight);
    el.style.background = (nd && CONF_FIFA_COLORS[nd.conf]) || '#8a857c';
    el.innerHTML = `<span>${atlasCountryName(s.highlight)}</span>`;
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
    x.addEventListener('click', () => { s.highlight = null; renderChip(); du_paint(); });
    el.appendChild(x); chip.appendChild(el);
  }
  du_setupSearch._renderChip = renderChip;
  function items() {
    const q = input.value.trim().toLowerCase(); if (!q) return [];
    return DATA_DUELOS.nodes.filter(nd => {
      const es = (typeof atlasCountryName === 'function' ? atlasCountryName(nd.id) : nd.id).toLowerCase();
      return es.includes(q) || nd.id.toLowerCase().includes(q) || (nd.sig || '').toLowerCase().includes(q);
    }).slice(0, 8);
  }
  function render() {
    results.innerHTML = '';
    items().forEach(nd => {
      const r = document.createElement('div'); r.className = 'm-search-result';
      r.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${CONF_FIFA_COLORS[nd.conf] || '#8a857c'};margin-right:7px;vertical-align:middle;"></span><span>${atlasCountryName(nd.id)}</span>`;
      r.addEventListener('mousedown', (e) => { e.preventDefault(); du_state().highlight = nd.id; input.value = ''; results.classList.remove('open'); renderChip(); du_paint(); });
      results.appendChild(r);
    });
    results.classList.toggle('open', results.children.length > 0);
  }
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 130));
  renderChip();
}

function setupDuelosCSV() {
  document.querySelectorAll('button.download[data-chart="4-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_DUELOS, s = du_state(), [a, b] = s.period;
    let csv = `equipo_a,equipo_b,partidos_total,partidos_${a}_${b}\n`;
    D.links.forEach(l => { csv += `${D.nodes[l[0]].id},${D.nodes[l[1]].id},${du_rleCount(l[2], DU_PERIOD_FULL[0], DU_PERIOD_FULL[1])},${du_rleCount(l[2], a, b)}\n`; });
    const a2 = document.createElement('a');
    a2.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a2.download = 'el-atlas-especial-duelos.csv';
    document.body.appendChild(a2); a2.click(); document.body.removeChild(a2); URL.revokeObjectURL(a2.href);
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

function du_updateSlider() {
  const s = du_state();
  const f = document.getElementById('du-slider-from'), tt = document.getElementById('du-slider-to');
  const disp = document.getElementById('du-range-display'), tr = document.getElementById('du-range-track-active');
  if (!f || !tt) return;
  f.value = s.period[0]; tt.value = s.period[1];
  if (disp) disp.textContent = `${s.period[0]}–${s.period[1]}`;
  if (tr) { const mn = +f.min, mx = +f.max, sp = mx - mn; if (sp > 0) { tr.style.left = ((s.period[0] - mn) / sp * 100) + '%'; tr.style.right = ((mx - s.period[1]) / sp * 100) + '%'; } }
}

function initDuelos() {
  const s = du_state();
  const f = document.getElementById('du-slider-from'), tt = document.getElementById('du-slider-to');
  const MINW = 5;
  if (f && tt) {
    // 'input' (arrastrando): repinta tamaños/visibilidad en el acto. 'change'
    // (al soltar): reubica las burbujas para la centralidad de ese período.
    f.addEventListener('input', () => { let a = +f.value; if (a > s.period[1] - MINW) a = s.period[1] - MINW; s.period[0] = a; du_updateSlider(); du_requestPaint(); });
    tt.addEventListener('input', () => { let b = +tt.value; if (b < s.period[0] + MINW) b = s.period[0] + MINW; s.period[1] = b; du_updateSlider(); du_requestPaint(); });
    f.addEventListener('change', du_relayout);
    tt.addEventListener('change', du_relayout);
    du_updateSlider();
  }
  const slider = document.getElementById('du-min');
  if (slider) {
    slider.value = s.minP;
    slider.addEventListener('input', () => { s.minP = +slider.value; du_updateMinLabel(); du_requestPaint(); });
  }
  du_updateMinLabel();
  du_legend();
  drawDuelos();
  du_setupSearch();
  setupDuelosCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initDuelos._wired) {
    initDuelos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawDuelos());
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawDuelos, 200); });
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawDuelos;
  window.onBeforePngExportGetSourceText = function (chartId) { return String(chartId) === '4' ? ((typeof t === 'function' ? t('c4-sources-tpl') : '') || null) : null; };
  window.onBeforePngExportGetSubtitle = function (chartId) { return String(chartId) === '4' ? du_subtitle() : null; };
}

function du_updateMinLabel() {
  const el = document.getElementById('du-min-val');
  if (el) el.textContent = du_state().minP;
}
