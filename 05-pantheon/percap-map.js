// =============================================================
//  El Atlas N°5 — Mapa de figuras célebres
// =============================================================
// Clona el motor del mapa del N°3 (clubage-map.js): D3 geoRobinson, leyenda
// escalonada OWID, hover-stroke, zoom. Reusa los datos del tablero (PCFIGS +
// PERCAP_POP) → misma metodología (per cápita = total / pob promedio histórica).
// Toggles: Vista País/Región · Medida Absoluto/Per cápita/Share · Filtro
// dominio u ocupación · y en Absoluto, Mapa Coroplético/Cartograma Dorling/
// Cartograma escalado. Share pinta el % de un rubro elegido. Geometría:
// GEO_COUNTRIES del N°3 (id = ISO3).
(function () {
  'use strict';
  const E = window.PCMAP, PP = window.PERCAP_POP;
  const LANG = (new URLSearchParams(location.search).get('lang') === 'en') ? 'en' : 'es';
  const en = LANG === 'en';
  const T = (es, eng) => (en ? eng : es);

  const YMIN = E.yearMin, YMAX = E.yearMax, ND = E.domains.length, NSUB = E.subMeta.length;
  const SUBDOM = E.subMeta.map(s => s.dom);
  const ISO_META = {}; E.isoMeta.forEach((m, k) => { ISO_META[m.iso] = m; m._k = k; });
  const idxByIso = {}; E.isoMeta.forEach((m, k) => idxByIso[m.iso] = k);
  const dispName = (iso) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso][LANG]) || (ISO_META[iso] ? ISO_META[iso][en ? 'en' : 'es'] : iso);
  const fmtYear = (y) => y < 0 ? `${-y} ${T('a.C.', 'BC')}` : String(y);
  const subName = (s) => E.subMeta[s][en ? 'en' : 'es'];
  const REG_LABEL = {
    'Latin America': ['América Latina', 'Latin America'], 'Caribbean': ['Caribe', 'Caribbean'],
    'Western Europe': ['Europa Occidental', 'Western Europe'], 'Eastern Europe & Central Asia': ['Europa del Este y Asia Central', 'Eastern Europe & C. Asia'],
    'North America, Australia & New Zealand': ['Norteamérica y Oceanía', 'N. America & Oceania'], 'East Asia': ['Asia Oriental', 'East Asia'],
    'Southeast Asia': ['Sudeste Asiático', 'Southeast Asia'], 'South Asia': ['Asia del Sur', 'South Asia'],
    'Middle East & North Africa': ['Medio Oriente y N. de África', 'Middle East & N. Africa'], 'Sub-Saharan Africa': ['África Subsahariana', 'Sub-Saharan Africa']
  };
  const regLabel = (k) => (REG_LABEL[k] ? REG_LABEL[k][en ? 1 : 0] : k);

  // Paleta secuencial terracota (claro→oscuro) + gris "sin dato".
  const RAMP = ['#F1E0D2', '#E0B68F', '#CE8A5E', '#BE5D32', '#9B3D24', '#5A2818'];
  const NODATA = '#D8D3C8', STROKE = 'rgba(255,255,255,0.55)', STROKE_HOVER = '#1A1A1A', CARTO_COLOR = '#BE5D32';
  const M_W = 1100, M_H = 580, MARGIN = { top: 8, right: 8, bottom: 8, left: 8 };
  const PW = M_W - MARGIN.left - MARGIN.right, PH = M_H - MARGIN.top - MARGIN.bottom;

  // multiOnly por DEFAULT (decisión de Daniel; se sacó el toggle). El mapa solo
  // cuenta figuras multiidioma (≥2 idiomas con vistas reales).
  const st = { y0: 1800, y1: YMAX, view: 'country', measure: 'abs', filter: 'all', mapMode: 'choro', multiOnly: true };

  // ===================== Decode + población =====================
  // F = 6 bytes/figura: iso, subId, [year 13b + multi bit15], score*100 uint16.
  function decodeF() {
    const F = E.F; if (F.iso) return;
    const bin = atob(F.b64), n = F.n;
    const iso = new Uint8Array(n), sub = new Uint8Array(n), year = new Int16Array(n), multi = new Uint8Array(n), score = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 6; iso[i] = bin.charCodeAt(o); sub[i] = bin.charCodeAt(o + 1);
      const yw = bin.charCodeAt(o + 2) | (bin.charCodeAt(o + 3) << 8);
      year[i] = (yw & 0x7FFF) - 4000; multi[i] = (yw >> 15) & 1;
      score[i] = (bin.charCodeAt(o + 4) | (bin.charCodeAt(o + 5) << 8)) / 100;
    }
    F.iso = iso; F.sub = sub; F.year = year; F.multi = multi; F.score = score;
  }
  function interp(pt, year) {
    if (!pt) return 0;
    const ys = pt.y, ps = pt.p, n = ys.length;
    if (year <= ys[0]) return ps[0]; if (year >= ys[n - 1]) return ps[n - 1];
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] <= year) lo = m; else hi = m; }
    return ps[lo] + (year - ys[lo]) / (ys[hi] - ys[lo]) * (ps[hi] - ps[lo]);
  }
  function avgPopK(pt, y0, y1) {
    if (!pt) return 0; if (y1 <= y0) return interp(pt, y0);
    const ys = pt.y, ps = pt.p, n = ys.length; let prevX = y0, prevV = interp(pt, y0), area = 0;
    for (let i = 0; i < n; i++) { if (ys[i] <= y0) continue; if (ys[i] >= y1) break; area += (ps[i] + prevV) / 2 * (ys[i] - prevX); prevX = ys[i]; prevV = ps[i]; }
    area += (interp(pt, y1) + prevV) / 2 * (y1 - prevX); return area / (y1 - y0);
  }
  const avgPopM = (iso, y0, y1) => avgPopK(PP.pop[iso], y0, y1) / 1000;

  function includeSet() {
    if (st.filter === 'all') return null;
    if (st.filter.startsWith('dom:')) { const d = +st.filter.slice(4); return new Set(SUBDOM.map((dd, i) => dd === d ? i : -1).filter(i => i >= 0)); }
    return new Set([+st.filter.slice(4)]);
  }

  // value por ISO (país) o por región (broadcast a miembros). null = sin dato.
  function computeValues() {
    decodeF();
    const F = E.F, N = F.iso.length, NI = E.isoMeta.length;
    const total = new Float64Array(NI), filt = new Float64Array(NI), fsco = new Float64Array(NI);
    const inc = includeSet(), mo = st.multiOnly;
    let worldScore = 0;
    for (let i = 0; i < N; i++) {
      const y = F.year[i]; if (y < st.y0 || y > st.y1) continue;
      if (mo && !F.multi[i]) continue;       // toggle multiidioma
      const k = F.iso[i]; total[k]++;
      if (!inc || inc.has(F.sub[i])) { filt[k]++; fsco[k] += F.score[i]; worldScore += F.score[i]; }
    }
    // hpishare = share del país/región en el total mundial PONDERADO por score_T50.
    const valOf = (cnt, tot, sco, iso) => {
      if (st.measure === 'abs') return cnt > 0 ? cnt : null;
      if (st.measure === 'percap') { const pm = avgPopM(iso, st.y0, st.y1); return (cnt > 0 && pm > 0) ? cnt / pm : null; }
      if (st.measure === 'hpishare') return (worldScore > 0 && sco > 0) ? sco / worldScore * 100 : null;
      return tot > 0 ? cnt / tot * 100 : null;   // share interno
    };
    const byIso = {};
    if (st.view === 'region') {
      const acc = {};
      for (let k = 0; k < NI; k++) { const reg = E.isoMeta[k].reg; if (!reg) continue; const a = acc[reg] || (acc[reg] = { c: 0, t: 0, pk: 0, sc: 0 }); a.c += filt[k]; a.t += total[k]; a.sc += fsco[k]; a.pk += avgPopK(PP.pop[E.isoMeta[k].iso], st.y0, st.y1); }
      const regVal = {};
      Object.keys(acc).forEach(reg => { const a = acc[reg]; regVal[reg] = st.measure === 'abs' ? (a.c > 0 ? a.c : null) : st.measure === 'percap' ? (a.c > 0 && a.pk > 0 ? a.c / (a.pk / 1000) : null) : st.measure === 'hpishare' ? (worldScore > 0 && a.sc > 0 ? a.sc / worldScore * 100 : null) : (a.t > 0 ? a.c / a.t * 100 : null); });
      for (let k = 0; k < NI; k++) { const reg = E.isoMeta[k].reg; byIso[E.isoMeta[k].iso] = reg ? regVal[reg] : null; }
      byIso.__regVal = regVal; byIso.__total = total; byIso.__filt = filt;
    } else {
      for (let k = 0; k < NI; k++) byIso[E.isoMeta[k].iso] = valOf(filt[k], total[k], fsco[k], E.isoMeta[k].iso);
      byIso.__total = total; byIso.__filt = filt;
    }
    return byIso;
  }

  // ===================== D3 map state =====================
  let geo = null, projection = null, path = null, zoom = null, centroidCache = {};
  function loadGeo() { const g = (typeof GEO_MINI !== 'undefined') ? GEO_MINI : (typeof GEO_COUNTRIES !== 'undefined' ? GEO_COUNTRIES : null); if (!g) throw new Error('geometría no cargada'); geo = g; }
  const isoOf = (f) => f.id || (f.properties && f.properties.iso) || null;

  function fmtVal(v) {
    if (v == null) return '—';
    if (st.measure === 'hpishare') return v.toFixed(v < 1 ? 2 : 1) + '%';
    if (st.measure === 'share') return v.toFixed(1) + '%';
    if (st.measure === 'abs') return Math.round(v).toLocaleString(en ? 'en-US' : 'es-AR');
    return v >= 100 ? Math.round(v).toLocaleString(en ? 'en-US' : 'es-AR') : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  }

  let colorScale = null, legendBreaks = [];
  function buildColor(values) {
    const vs = values.filter(v => v != null && v > 0).sort((a, b) => a - b);
    if (!vs.length) { colorScale = () => NODATA; legendBreaks = []; return; }
    const q = (p) => vs[Math.min(vs.length - 1, Math.floor(p * vs.length))];
    legendBreaks = [q(1 / 6), q(2 / 6), q(3 / 6), q(4 / 6), q(5 / 6)];
    // dedupe breaks (cuando hay muchos valores iguales)
    legendBreaks = legendBreaks.filter((b, i) => i === 0 || b > legendBreaks[i - 1]);
    const sc = window.d3.scaleThreshold().domain(legendBreaks).range(RAMP.slice(0, legendBreaks.length + 1));
    colorScale = (v) => v == null ? NODATA : sc(v);
  }
  const binOf = (v) => { if (v == null) return null; let i = 0; for (const b of legendBreaks) { if (v < b) return i; i++; } return i; };

  // ===================== Render =====================
  function draw() {
    const d3 = window.d3, svg = d3.select('#mapSvg');
    if (svg.empty() || !geo) return;
    svg.selectAll('*').remove();
    updateSub();
    const byIso = computeValues();
    const values = Object.keys(byIso).filter(k => !k.startsWith('__')).map(k => byIso[k]);
    buildColor(values);

    projection = d3.geoRobinson().fitSize([PW, PH], geo);
    path = d3.geoPath(projection);
    centroidCache = {};

    svg.append('defs').append('clipPath').attr('id', 'mclip').append('rect').attr('x', -MARGIN.left).attr('y', -MARGIN.top).attr('width', M_W).attr('height', M_H);
    const root = svg.append('g').attr('clip-path', 'url(#mclip)').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    const gZoom = root.append('g').attr('class', 'm-zoom');

    const carto = st.measure === 'abs' && st.view === 'country' && st.mapMode === 'dorling';
    if (carto) drawDorling(gZoom, byIso);
    else drawPolys(gZoom, byIso);

    // hover overlay
    gZoom.append('g').attr('pointer-events', 'none').append('path').attr('class', 'm-hover').attr('fill', 'none').attr('stroke', STROKE_HOVER).attr('stroke-width', 1.5).attr('vector-effect', 'non-scaling-stroke');

    if (zoom) { const cur = d3.zoomTransform(svg.node()); if (cur && (cur.k !== 1 || cur.x || cur.y)) gZoom.attr('transform', cur.toString()); }
    drawLegend();
  }

  function drawPolys(gZoom, byIso) {
    const d3 = window.d3;
    if (geo.landmask) gZoom.append('path').attr('d', path(geo.landmask)).attr('fill', NODATA).attr('pointer-events', 'none');
    const feats = geo.features.slice().sort((a, b) => d3.geoArea(b) - d3.geoArea(a));
    gZoom.append('g').selectAll('path').data(feats, isoOf).join('path')
      .attr('class', 'm-country').attr('data-iso', isoOf)
      .attr('data-bin', d => { const b = binOf(byIso[isoOf(d)]); return b == null ? '' : b; })
      .attr('d', path)
      .attr('fill', d => colorScale(byIso[isoOf(d)]))
      .attr('stroke', STROKE).attr('stroke-width', 0.5).attr('vector-effect', 'non-scaling-stroke')
      .on('mouseenter', onEnter).on('mousemove', onMove).on('mouseleave', onLeave);
  }

  function drawDorling(gZoom, byIso) {
    const d3 = window.d3;
    if (geo.landmask) gZoom.append('path').attr('d', path(geo.landmask)).attr('fill', NODATA).attr('opacity', 0.5).attr('pointer-events', 'none');
    let nodes;
    if (st.view === 'region') {
      const regVal = byIso.__regVal || {};
      // centroide de región = promedio de centroides de miembros (ponderado por área)
      const acc = {};
      geo.features.forEach(f => { const m = ISO_META[isoOf(f)]; if (!m) return; const reg = m.reg; const a = Math.abs(path.area(f)); const c = path.centroid(f); if (!(a > 0) || !c) return; const x = acc[reg] || (acc[reg] = { x: 0, y: 0, a: 0 }); x.x += c[0] * a; x.y += c[1] * a; x.a += a; });
      nodes = Object.keys(regVal).filter(r => regVal[r] > 0 && acc[r]).map(r => ({ key: r, name: regLabel(r), v: regVal[r], x: acc[r].x / acc[r].a, y: acc[r].y / acc[r].a, isReg: true }));
    } else {
      nodes = [];
      geo.features.forEach(f => { const iso = isoOf(f); const v = byIso[iso]; if (!(v > 0)) return; const c = path.centroid(f); if (!c || isNaN(c[0])) return; nodes.push({ key: iso, name: dispName(iso), v, x: c[0], y: c[1] }); });
    }
    const maxV = d3.max(nodes, n => n.v) || 1;
    const rMax = st.view === 'region' ? 60 : 26;
    const rOf = (v) => Math.max(2, Math.sqrt(v / maxV) * rMax);
    nodes.forEach(n => { n.r = rOf(n.v); n.x0 = n.x; n.y0 = n.y; });
    const sim = d3.forceSimulation(nodes).force('x', d3.forceX(n => n.x0).strength(0.35)).force('y', d3.forceY(n => n.y0).strength(0.35)).force('collide', d3.forceCollide(n => n.r + 0.6).strength(0.9)).stop();
    for (let i = 0; i < 160; i++) sim.tick();
    const g = gZoom.append('g');
    g.selectAll('circle').data(nodes).join('circle')
      .attr('cx', n => n.x).attr('cy', n => n.y).attr('r', n => n.r)
      .attr('fill', CARTO_COLOR).attr('fill-opacity', 0.82).attr('stroke', '#fff').attr('stroke-width', 0.6)
      .style('cursor', 'pointer')
      .on('mouseenter', (ev, n) => showTipXY(ev, n.name, n.v, n.key, n.isReg)).on('mousemove', onMove).on('mouseleave', hideTip);
    // etiquetas para los más grandes
    g.selectAll('text').data(nodes.filter(n => n.r >= (st.view === 'region' ? 14 : 11))).join('text')
      .attr('x', n => n.x).attr('y', n => n.y + 3).attr('text-anchor', 'middle').attr('font-family', 'var(--sans),system-ui')
      .attr('font-size', n => Math.min(13, n.r * 0.7)).attr('fill', '#fff').attr('font-weight', 600).attr('pointer-events', 'none')
      .text(n => st.view === 'region' ? n.name.split(',')[0] : (ISO_META[n.key] ? n.key : n.name));
  }

  // ===================== Hover =====================
  function onEnter(ev, d) {
    const iso = isoOf(d); window.d3.select('.m-hover').attr('d', path(d));
    if (st.view === 'region') { const reg = ISO_META[iso] ? ISO_META[iso].reg : null; showTipXY(ev, regLabel(reg), lastVals ? lastVals[iso] : null, reg, true); }
    else showTipXY(ev, dispName(iso), lastVals ? lastVals[iso] : null, iso, false);
  }
  function onMove(ev) { posTip(ev); }
  function onLeave() { window.d3.select('.m-hover').attr('d', null); hideTip(); }
  let lastVals = null;
  // share del rubro en el total de la entidad (respeta filtro+período).
  function entityShare(key, isReg) {
    const f = lastVals && lastVals.__filt, t = lastVals && lastVals.__total; if (!f || !t) return null;
    if (isReg) { let fc = 0, tc = 0; for (let k = 0; k < E.isoMeta.length; k++) if (E.isoMeta[k].reg === key) { fc += f[k]; tc += t[k]; } return tc > 0 ? fc / tc * 100 : null; }
    const k = idxByIso[key]; return (k != null && t[k] > 0) ? f[k] / t[k] * 100 : null;
  }
  // figura de mayor HPI de la entidad dado el filtro Y EL PERÍODO elegido.
  // PCTOP[iso][sub] = top-K [nombre, año, score, rank] (multiidioma). Elegimos la
  // de mayor score nacida en [y0,y1]. → [nombre, año, score, rank]
  function topFigFor(key, isReg) {
    const inc = includeSet(), TP = window.PCTOP; if (!TP) return null;
    const y0 = st.y0, y1 = st.y1; let best = null;
    const scan = (isoc) => {
      const d = TP[isoc]; if (!d) return;
      for (const sub in d) {
        if (inc && !inc.has(+sub)) continue;
        const arr = d[sub];
        for (let i = 0; i < arr.length; i++) { const e = arr[i]; if (e[1] < y0 || e[1] > y1) continue; if (!best || e[2] > best[2]) best = e; }
      }
    };
    if (isReg) { for (let k = 0; k < E.isoMeta.length; k++) if (E.isoMeta[k].reg === key) scan(E.isoMeta[k].iso); }
    else scan(key);
    return best;
  }
  // share de la entidad en el TOTAL MUNDIAL (del rubro filtrado) — siempre útil.
  function entityWorldShare(key, isReg) {
    const f = lastVals && lastVals.__filt; if (!f) return null;
    let W = 0; for (let k = 0; k < f.length; k++) W += f[k]; if (!(W > 0)) return null;
    let e = 0; if (isReg) { for (let k = 0; k < E.isoMeta.length; k++) if (E.isoMeta[k].reg === key) e += f[k]; } else { const k = idxByIso[key]; e = (k != null) ? f[k] : 0; }
    return e / W * 100;
  }
  function showTipXY(ev, name, v, key, isReg) {
    const tt = document.getElementById('mTip'); if (!tt) return;
    let h = `<strong>${name}</strong><div class="tt-period">${T('Nacidas', 'Born')} ${fmtYear(st.y0)}–${fmtYear(st.y1)}</div><div class="tt-row"><span>${measLabel()}</span><span>${fmtVal(v)}</span></div>`;
    const ws = entityWorldShare(key, isReg);
    if (ws != null) h += `<div class="tt-row"><span>${T('% del total mundial', '% of world total')}</span><span>${ws.toFixed(ws < 10 ? 2 : 1)}%</span></div>`;
    if (st.filter !== 'all') { const sh = entityShare(key, isReg); if (sh != null) h += `<div class="tt-row"><span>${isReg ? T('% de la región', '% of region') : T('% del país', '% of country')}</span><span>${sh.toFixed(1)}%</span></div>`; }
    const tf = topFigFor(key, isReg);
    if (tf) h += `<div class="tt-fig"><span class="tt-fig-name">${tf[0]} <span style="font-weight:400;color:var(--ink-muted)">(${fmtYear(tf[1])})</span></span><span class="tt-fig-meta">HPI ${tf[2]} · #${tf[3].toLocaleString(en ? 'en-US' : 'es-AR')} ${T('global', 'global')}</span></div>`;
    tt.innerHTML = h; tt.style.display = 'block'; posTip(ev);
  }
  function posTip(ev) { const tt = document.getElementById('mTip'); if (!tt || tt.style.display === 'none') return; const w = tt.parentElement.getBoundingClientRect(); let px = ev.clientX - w.left + 14, py = ev.clientY - w.top - tt.offsetHeight - 8; if (px + tt.offsetWidth > w.width) px = ev.clientX - w.left - tt.offsetWidth - 14; if (py < 0) py = ev.clientY - w.top + 18; tt.style.left = px + 'px'; tt.style.top = py + 'px'; }
  function hideTip() { const tt = document.getElementById('mTip'); if (tt) tt.style.display = 'none'; }
  function measLabel() {
    const rub = st.filter === 'all' ? T('Figuras', 'Figures') : st.filter.startsWith('dom:') ? E.domains[+st.filter.slice(4)][en ? 'en' : 'es'] : subName(+st.filter.slice(4));
    if (st.measure === 'hpishare') return T('Share del mundo (HPI)', 'World share (HPI)');
    if (st.measure === 'share') return T('Share', 'Share') + ' ' + rub;
    if (st.measure === 'percap') return rub + T(' / millón', ' / million');
    return rub;
  }

  // ===================== Leyenda =====================
  function drawLegend() {
    const d3 = window.d3, leg = d3.select('#m-legend'); if (leg.empty()) return;
    leg.selectAll('*').remove();
    if (st.mapMode === 'dorling') { // leyenda de tamaños
      const W = 240, H = 54; leg.attr('viewBox', `0 0 ${W} ${H}`);
      leg.append('text').attr('x', 0).attr('y', 10).attr('font-family', 'var(--sans)').attr('font-size', 11).attr('fill', 'var(--ink-soft)').text(T('Tamaño = ' + measLabel(), 'Size = ' + measLabel()));
      return;
    }
    const W_MAIN = 320, GAP = 12, ND_W = 14, BIN_H = 12, TEXT_Y = BIN_H + 12;
    leg.attr('viewBox', `0 0 ${W_MAIN + GAP + ND_W} ${TEXT_Y + 4}`);
    const nBins = legendBreaks.length + 1, binW = W_MAIN / nBins;
    for (let i = 0; i < nBins; i++) leg.append('rect').attr('x', i * binW).attr('y', 0).attr('width', binW).attr('height', BIN_H).attr('fill', RAMP[i]).attr('stroke', 'rgba(0,0,0,.08)').attr('stroke-width', .5).attr('data-bin', i).style('cursor', 'pointer').on('mouseenter', () => hiBin(i)).on('mouseleave', clearHi);
    legendBreaks.forEach((b, idx) => leg.append('text').attr('x', (idx + 1) * binW).attr('y', TEXT_Y).attr('text-anchor', 'middle').attr('font-family', 'var(--sans)').attr('font-size', 10).attr('fill', 'var(--ink-soft)').attr('font-variant-numeric', 'tabular-nums').text(fmtVal(b)));
    const ndX = W_MAIN + GAP;
    leg.append('rect').attr('x', ndX).attr('y', 0).attr('width', ND_W).attr('height', BIN_H).attr('fill', NODATA).attr('stroke', 'rgba(0,0,0,.15)').attr('stroke-width', .5);
    leg.append('text').attr('x', ndX + ND_W / 2).attr('y', TEXT_Y).attr('text-anchor', 'middle').attr('font-family', 'var(--sans)').attr('font-size', 10).attr('fill', 'var(--ink-soft)').text(T('s/d', 'n/a'));
  }
  function hiBin(i) { window.d3.selectAll('.m-country').each(function () { const el = window.d3.select(this); const own = el.attr('data-bin'); if (own === String(i)) el.attr('stroke', STROKE_HOVER).attr('stroke-width', 1.2).attr('fill-opacity', 1); else el.attr('stroke', STROKE).attr('stroke-width', .5).attr('fill-opacity', .3); }); }
  function clearHi() { window.d3.selectAll('.m-country').attr('stroke', STROKE).attr('stroke-width', .5).attr('fill-opacity', 1); }

  // ===================== Subtítulo =====================
  function updateSub() {
    const el = document.getElementById('mSub'); if (!el) return;
    const med = st.measure === 'hpishare' ? T('share del mundo ponderado por HPI', 'world share weighted by HPI') : st.measure === 'share' ? T('share interno', 'internal share') : st.measure === 'abs' ? T('cantidad', 'count') : T('por millón', 'per million');
    const lv = st.view === 'region' ? T('por región', 'by region') : T('por país', 'by country');
    const mode = st.measure === 'abs' && st.mapMode === 'dorling' ? T(' · cartograma Dorling', ' · Dorling cartogram') : '';
    el.textContent = `${measLabel()} — ${med} ${lv}${mode}, ${fmtYear(st.y0)}–${fmtYear(st.y1)}`;
  }

  // ===================== Controles =====================
  function syncControls() {
    [['m-view', 'view'], ['m-measure', 'measure'], ['m-mapmode', 'mapMode']].forEach(([id, key]) => document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.val === st[key])));
    // cartograma SOLO para países (en región no tiene sentido) y solo en Absoluto
    document.getElementById('m-mapmode-wrap').style.display = (st.measure === 'abs' && st.view === 'country') ? '' : 'none';
  }
  function wire() {
    const grp = (id, key, after) => document.querySelectorAll('#' + id + ' button').forEach(b => b.addEventListener('click', () => { st[key] = b.dataset.val; if (after) after(); syncControls(); draw(); }));
    grp('m-view', 'view', () => { if (st.view === 'region') st.mapMode = 'choro'; });
    grp('m-measure', 'measure', () => {
      if (st.measure !== 'abs') st.mapMode = 'choro';
      if (st.measure === 'share' && st.filter === 'all') { st.filter = 'dom:0'; const fs = document.getElementById('m-filter'); if (fs) fs.value = 'dom:0'; }
    });
    grp('m-mapmode', 'mapMode');

    const fs = document.getElementById('m-filter');
    let html = `<option value="all">${T('Todas las disciplinas', 'All fields')}</option>`;
    html += `<optgroup label="${T('Dominios', 'Domains')}">` + E.domains.map((d, i) => `<option value="dom:${i}">${d[en ? 'en' : 'es']}</option>`).join('') + '</optgroup>';
    html += `<optgroup label="${T('Sub-rubros', 'Sub-fields')}">` + E.subMeta.map((s, i) => s.dom < 0 ? '' : `<option value="sub:${i}">${subName(i)}</option>`).join('') + '</optgroup>';
    fs.innerHTML = html; fs.value = st.filter;
    fs.addEventListener('change', () => { st.filter = fs.value; if (st.measure === 'share' && st.filter === 'all') { st.measure = 'abs'; } draw(); syncControls(); });


    const f = document.getElementById('m-from'), tt = document.getElementById('m-to');
    const fb = document.getElementById('m-from-v'), tb = document.getElementById('m-to-v');
    [f, tt].forEach(r => { r.min = YMIN; r.max = YMAX; r.step = 1; });
    [fb, tb].forEach(b => { b.min = YMIN; b.max = YMAX; });
    f.value = st.y0; tt.value = st.y1; fb.value = st.y0; tb.value = st.y1;
    // arrastrar el slider redibuja con DEBOUNCE (sin esto, cada input dispara un
    // redraw pesado —geo 2MB + sim Dorling— y se traba/crashea).
    let drawT; const redraw = () => { clearTimeout(drawT); drawT = setTimeout(draw, 110); };
    const clampY = (v, d) => { v = Math.round(+v); if (!isFinite(v)) return d; return Math.max(YMIN, Math.min(YMAX, v)); };
    const fromSlider = () => { let a = +f.value, b = +tt.value; if (a > b) { if (document.activeElement === f) b = a; else a = b; f.value = a; tt.value = b; } st.y0 = a; st.y1 = b; fb.value = a; tb.value = b; redraw(); };
    const fromBox = () => { let a = clampY(fb.value, st.y0), b = clampY(tb.value, st.y1); if (a > b) { const tmp = a; a = b; b = tmp; } st.y0 = a; st.y1 = b; f.value = a; tt.value = b; fb.value = a; tb.value = b; draw(); };
    f.addEventListener('input', fromSlider); tt.addEventListener('input', fromSlider);
    fb.addEventListener('change', fromBox); tb.addEventListener('change', fromBox);
    fb.addEventListener('keydown', e => { if (e.key === 'Enter') fb.blur(); });
    tb.addEventListener('keydown', e => { if (e.key === 'Enter') tb.blur(); });
    document.getElementById('m-reset').addEventListener('click', () => window.d3.select('#mapSvg').transition().duration(450).call(zoom.transform, window.d3.zoomIdentity));
    syncControls();
  }
  function setupZoom() {
    const d3 = window.d3, svg = d3.select('#mapSvg');
    zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[-M_W * 0.2, -M_H * 0.2], [M_W * 1.2, M_H * 1.2]]).on('zoom', ev => svg.select('.m-zoom').attr('transform', ev.transform.toString()));
    svg.call(zoom).on('dblclick.zoom', null);
  }

  // store values for hover
  const _origCompute = computeValues;
  computeValues = function () { const r = _origCompute(); lastVals = r; return r; };

  loadGeo(); wire(); setupZoom(); draw();
})();
