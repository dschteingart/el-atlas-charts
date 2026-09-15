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
  // idioma DINAMICO: lee el global LANG de lib/i18n (toggle de la casa)
  const en = () => (typeof LANG !== 'undefined' ? LANG === 'en' : false);
  const T = (es, eng) => (en() ? eng : es);

  const YMIN = E.yearMin, YMAX = E.yearMax, ND = E.domains.length, NSUB = E.subMeta.length;
  const SUBDOM = E.subMeta.map(s => s.dom);
  const ISO_META = {}; E.isoMeta.forEach((m, k) => { ISO_META[m.iso] = m; m._k = k; });
  const idxByIso = {}; E.isoMeta.forEach((m, k) => idxByIso[m.iso] = k);
  // dependencias y territorios que el mapa dibuja pero no tienen fila de datos
  const TERR = {}; (E.terrMeta || []).forEach(m => { TERR[m.iso] = m; });
  const dispName = (iso) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso][LANG])
    || (ISO_META[iso] ? ISO_META[iso][en() ? 'en' : 'es'] : (TERR[iso] ? TERR[iso][en() ? 'en' : 'es'] : iso));
  const fmtYear = (y) => y < 0 ? `${-y} ${T('a.C.', 'BC')}` : String(y);
  const subName = (s) => E.subMeta[s][en() ? 'en' : 'es'];
  const REG_LABEL = {
    'Latin America': ['América Latina', 'Latin America'], 'Caribbean': ['Caribe', 'Caribbean'],
    'Western Europe': ['Europa Occidental', 'Western Europe'], 'Eastern Europe & Central Asia': ['Europa del Este y Asia Central', 'Eastern Europe & C. Asia'],
    'North America, Australia & New Zealand': ['Norteamérica y Oceanía', 'N. America & Oceania'], 'East Asia': ['Asia Oriental', 'East Asia'],
    'Southeast Asia': ['Sudeste Asiático', 'Southeast Asia'], 'South Asia': ['Asia del Sur', 'South Asia'],
    'Middle East & North Africa': ['Medio Oriente y N. de África', 'Middle East & N. Africa'], 'Sub-Saharan Africa': ['África Subsahariana', 'Sub-Saharan Africa']
  };
  const regLabel = (k) => (REG_LABEL[k] ? REG_LABEL[k][en() ? 1 : 0] : k);

  // Paleta secuencial terracota (claro→oscuro) + gris "sin dato".
  const RAMP = ['#F1E0D2', '#E0B68F', '#CE8A5E', '#BE5D32', '#9B3D24', '#5A2818'];
  const NODATA = '#D8D3C8', STROKE = 'rgba(255,255,255,0.55)', STROKE_HOVER = '#1A1A1A', CARTO_COLOR = '#BE5D32';
  const M_W = 1100, MARGIN = { top: 8, right: 8, bottom: 8, left: 8 };
  const PW = M_W - MARGIN.left - MARGIN.right;
  const LEG_H = 46;                       // alto del bloque de leyenda bajo el mapa
  let M_H = 580, PH = M_H - MARGIN.top - MARGIN.bottom, LEG_Y = M_H + 10;

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
      return null;
    };
    const byIso = {};
    if (st.view === 'region') {
      const acc = {};
      for (let k = 0; k < NI; k++) { const reg = E.isoMeta[k].reg; if (!reg) continue; const a = acc[reg] || (acc[reg] = { c: 0, t: 0, pk: 0, sc: 0 }); a.c += filt[k]; a.t += total[k]; a.sc += fsco[k]; a.pk += avgPopK(PP.pop[E.isoMeta[k].iso], st.y0, st.y1); }
      const regVal = {};
      Object.keys(acc).forEach(reg => { const a = acc[reg]; regVal[reg] = st.measure === 'abs' ? (a.c > 0 ? a.c : null) : (a.c > 0 && a.pk > 0 ? a.c / (a.pk / 1000) : null); });
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

  // La Antartida no tiene figuras y se comia el tercio inferior del lienzo: en
  // vista region, donde las geometrias disueltas llegan hasta -55,8, el marco
  // reservaba hasta -90 y el PNG quedaba con un hueco entre el mapa y el pie.
  // Fuera del dibujo y fuera del encuadre; el landmask lo recorta el clip.
  const ANTARTIDA = { ATA: 1, ATF: 1, BVT: 1, HMD: 1, SGS: 1 };
  const esAntartida = (f) => !!ANTARTIDA[isoOf(f)];
  let geoFit = null;
  // El landmask es una sola pieza que baja hasta -90: se le quitan los anillos
  // integramente al sur del cono sur, o asomaria como una banda gris al pie.
  function sinSur(g, latMin) {
    const vive = (anillo) => anillo.some(pt => pt[1] > latMin);
    if (!g) return g;
    if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.coordinates.map(pol => pol.filter(vive)).filter(pol => pol.length) };
    if (g.type === 'Polygon') { const c = g.coordinates.filter(vive); return c.length ? { type: 'Polygon', coordinates: c } : null; }
    return g;
  }
  // El cartograma no lleva rotulo de escala, asi que reservarle el alto de la
  // leyenda dejaba una franja vacia entre el mapa y el pie del PNG.
  function ajustarAlto() {
    const svg = document.getElementById('chartmap'); if (!svg) return;
    const conLeyenda = st.mapMode !== 'dorling';
    svg.setAttribute('viewBox', '0 0 ' + M_W + ' ' + (conLeyenda ? LEG_Y + LEG_H : M_H + 6));
  }
  function ajustarMarco() {
    const d3 = window.d3; if (!d3 || !geo) return;
    geoFit = { type: 'FeatureCollection', features: geo.features.filter(f => !esAntartida(f)) };
    if (geo.landmask) geoFit.landmask = sinSur(geo.landmask, -56);
    const b = d3.geoPath(d3.geoRobinson().fitWidth(PW, geoFit)).bounds(geoFit);
    const alto = Math.ceil(b[1][1] - b[0][1]);
    M_H = alto + MARGIN.top + MARGIN.bottom;
    PH = M_H - MARGIN.top - MARGIN.bottom;
    LEG_Y = M_H + 10;
    ajustarAlto();
  }

  function fmtVal(v) {
    if (v == null) return '—';
    if (st.measure === 'abs') return Math.round(v).toLocaleString(en() ? 'en-US' : 'es-AR');
    return v >= 100 ? Math.round(v).toLocaleString(en() ? 'en-US' : 'es-AR') : v >= 10 ? v.toFixed(1) : v.toFixed(2);
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

  // ===== Vista compartible (?vista=&medida=&mapa=&filtro=&periodo=) =====
  let urlWired = false;
  function filtroAUrl() {
    if (st.filter === 'all') return null;
    if (st.filter.startsWith('dom:')) return atlasSlug(E.domains[+st.filter.slice(4)].es);
    return atlasSlug(E.subMeta[+st.filter.slice(4)].es);
  }
  function filtroDesdeUrl(v) {
    if (!v) return null;
    let i = atlasIdxPorSlug(E.domains, v);
    if (i >= 0) return 'dom:' + i;
    i = atlasIdxPorSlug(E.subMeta, v);
    if (i >= 0 && E.subMeta[i].dom >= 0) return 'sub:' + i;
    return null;
  }
  function applyUrlState() {
    if (typeof atlasUrlParam !== 'function') return;
    const v = atlasUrlParam('vista');
    if (v === 'region' || v === 'pais') st.view = (v === 'pais') ? 'country' : 'region';
    const md = atlasUrlParam('medida');
    if (md === 'percap' || md === 'abs') st.measure = md;
    const mp = atlasUrlParam('mapa');
    if (mp === 'cartograma' || mp === 'dorling') st.mapMode = 'dorling';
    const f = filtroDesdeUrl(atlasUrlParam('filtro'));
    if (f) st.filter = f;
    const per = atlasUrlParam('periodo');
    if (per && per.indexOf('~') > 0) {
      const [a, b] = per.split('~').map(Number);
      if (!isNaN(a) && !isNaN(b) && a <= b) { st.y0 = Math.max(YMIN, a); st.y1 = Math.min(YMAX, b); }
    }
    if (st.view === 'region' || st.measure !== 'abs') st.mapMode = 'choro';
    urlWired = true;
    if (window.__mapFillFilter) window.__mapFillFilter();
    if (window.__mapSyncPeriodo) window.__mapSyncPeriodo();
    syncControls(); draw();
  }
  function syncUrl() {
    if (!urlWired || typeof atlasSyncUrl !== 'function') return;
    const todoDefault = st.view === 'country' && st.measure === 'abs' && st.mapMode === 'choro'
      && st.filter === 'all' && st.y0 === 1800 && st.y1 === YMAX;
    atlasSyncUrl(todoDefault ? { vista: null, medida: null, mapa: null, filtro: null, periodo: null } : {
      vista: st.view === 'country' ? null : 'region',
      medida: st.measure === 'abs' ? null : 'percap',
      mapa: st.mapMode === 'choro' ? null : 'cartograma',
      filtro: filtroAUrl(),
      periodo: (st.y0 === 1800 && st.y1 === YMAX) ? null : (st.y0 + '~' + st.y1)
    });
  }

  function draw() {
    syncUrl();
    const d3 = window.d3, svg = d3.select('#chartmap');
    if (svg.empty() || !geo) return;
    svg.selectAll('*').remove();
    updateSub();
    const byIso = computeValues();
    const values = Object.keys(byIso).filter(k => !k.startsWith('__')).map(k => byIso[k]);
    buildColor(values);

    if (!geoFit) ajustarMarco();
    projection = d3.geoRobinson().fitSize([PW, PH], geoFit);   // marco fijo: paises sin Antartida (las regiones disueltas comparten fuente)
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
    ajustarAlto();
  }

  function drawPolys(gZoom, byIso) {
    const d3 = window.d3;
    // en vista REGION se dibujan las geometrias DISUELTAS (fronteras internas
    // fundidas, hechas con union en el builder): un solo contorno por region
    const regiones = st.view === 'region' && typeof GEO_REGIONS !== 'undefined';
    if (regiones) {
      const regVal = byIso.__regVal || {};
      // el fondo de "sin dato" son los paises sin region (quedan grises detras)
      gZoom.append('g').selectAll('path').data(geoFit.features, isoOf).join('path')
        .attr('d', path).attr('fill', NODATA).attr('stroke', 'none').attr('pointer-events', 'none');
      const feats = GEO_REGIONS.features.slice().sort((a, b) => d3.geoArea(b) - d3.geoArea(a));
      gZoom.append('g').selectAll('path').data(feats, f => f.id).join('path')
        .attr('class', 'm-country').attr('data-iso', f => f.id)
        .attr('data-bin', f => { const b = binOf(regVal[f.id]); return b == null ? '' : b; })
        .attr('d', path)
        .attr('fill', f => colorScale(regVal[f.id]))
        .attr('stroke', STROKE).attr('stroke-width', 0.8).attr('vector-effect', 'non-scaling-stroke')
        .on('mouseenter', onEnterRegion).on('mousemove', onMove).on('mouseleave', onLeave);
      return;
    }
    if (geoFit.landmask) gZoom.append('path').attr('d', path(geoFit.landmask)).attr('fill', NODATA).attr('pointer-events', 'none');
    const feats = geoFit.features.slice().sort((a, b) => d3.geoArea(b) - d3.geoArea(a));
    gZoom.append('g').selectAll('path').data(feats, isoOf).join('path')
      .attr('class', 'm-country').attr('data-iso', isoOf)
      .attr('data-bin', d => { const b = binOf(byIso[isoOf(d)]); return b == null ? '' : b; })
      .attr('d', path)
      .attr('fill', d => colorScale(byIso[isoOf(d)]))
      .attr('stroke', STROKE).attr('stroke-width', 0.5).attr('vector-effect', 'non-scaling-stroke')
      .on('mouseenter', onEnter).on('mousemove', onMove).on('mouseleave', onLeave);
  }

  function onEnterRegion(ev, f) {
    window.d3.select('.m-hover').attr('d', path(f));
    const regVal = (lastVals && lastVals.__regVal) || {};
    showTipXY(ev, regLabel(f.id), regVal[f.id], f.id, true);
  }

  // Centroide de la PIEZA MAS GRANDE del pais. Con el centroide del
  // multipoligono entero, Alaska y las islas arrastran el de EE.UU. al norte y
  // la burbuja caia sobre Canada (Daniel 2026-09-11). Mismo problema tenian
  // Francia, Holanda o Dinamarca por sus territorios de ultramar.
  function centroidMain(f) {
    const g = f && f.geometry; if (!g) return null;
    if (g.type !== 'MultiPolygon' || g.coordinates.length < 2) return path.centroid(f);
    let best = null, bestA = -1;
    for (let i = 0; i < g.coordinates.length; i++) {
      const piece = { type: 'Feature', geometry: { type: 'Polygon', coordinates: g.coordinates[i] } };
      const a2 = Math.abs(path.area(piece));
      if (a2 > bestA) { bestA = a2; best = piece; }
    }
    return best ? path.centroid(best) : path.centroid(f);
  }

  function drawDorling(gZoom, byIso) {
    const d3 = window.d3;
    // Fondo: los PAISES, no un landmask plano — asi se ven las fronteras
    // debajo de las burbujas (Daniel 2026-09-11).
    gZoom.append('g').attr('pointer-events', 'none').selectAll('path').data(geoFit.features, isoOf).join('path')
      .attr('d', path).attr('fill', NODATA).attr('fill-opacity', 0.45)
      .attr('stroke', '#B9B2A4').attr('stroke-width', 0.5).attr('vector-effect', 'non-scaling-stroke');
    let nodes;
    if (st.view === 'region') {
      const regVal = byIso.__regVal || {};
      // centroide de región = promedio de centroides de miembros (ponderado por área)
      const acc = {};
      geo.features.forEach(f => { const m = ISO_META[isoOf(f)]; if (!m) return; const reg = m.reg; const a = Math.abs(path.area(f)); const c = centroidMain(f); if (!(a > 0) || !c) return; const x = acc[reg] || (acc[reg] = { x: 0, y: 0, a: 0 }); x.x += c[0] * a; x.y += c[1] * a; x.a += a; });
      nodes = Object.keys(regVal).filter(r => regVal[r] > 0 && acc[r]).map(r => ({ key: r, name: regLabel(r), v: regVal[r], x: acc[r].x / acc[r].a, y: acc[r].y / acc[r].a, isReg: true }));
    } else {
      nodes = [];
      geo.features.forEach(f => { const iso = isoOf(f); const v = byIso[iso]; if (!(v > 0)) return; const c = centroidMain(f); if (!c || isNaN(c[0])) return; nodes.push({ key: iso, name: dispName(iso), v, x: c[0], y: c[1] }); });
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
      .attr('fill', CARTO_COLOR).attr('fill-opacity', 0.85).attr('stroke', '#FAF8F3').attr('stroke-width', 1.4)
      .style('cursor', 'pointer')
      .on('mouseenter', (ev, n) => showTipXY(ev, n.name, n.v, n.key, n.isReg)).on('mousemove', onMove).on('mouseleave', hideTip);
    // etiquetas para los más grandes
    g.selectAll('text').data(nodes.filter(n => n.r >= (st.view === 'region' ? 14 : 11))).join('text')
      .attr('x', n => n.x).attr('y', n => n.y + 3).attr('text-anchor', 'middle').attr('font-family', '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif,system-ui')
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
      if (!(isoc in idxByIso)) return;   // consistencia: sin fila en el mapa, sin figura en el tooltip
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
    if (tf) h += `<div class="tt-fig"><span class="tt-fig-name">${tf[0]} <span style="font-weight:400;color:#8A8579">(${fmtYear(tf[1])})</span></span><span class="tt-fig-meta">HPI ${tf[2]} · #${tf[3].toLocaleString(en() ? 'en-US' : 'es-AR')} ${T('global', 'global')}</span></div>`;
    tt.innerHTML = h; tt.style.display = 'block'; posTip(ev);
  }
  function posTip(ev) { const tt = document.getElementById('mTip'); if (!tt || tt.style.display === 'none') return; const w = tt.parentElement.getBoundingClientRect(); let px = ev.clientX - w.left + 14, py = ev.clientY - w.top - tt.offsetHeight - 8; if (px + tt.offsetWidth > w.width) px = ev.clientX - w.left - tt.offsetWidth - 14; if (py < 0) py = ev.clientY - w.top + 18; tt.style.left = px + 'px'; tt.style.top = py + 'px'; }
  function hideTip() { const tt = document.getElementById('mTip'); if (tt) tt.style.display = 'none'; }
  function measLabel() {
    const rub = st.filter === 'all' ? T('Figuras', 'Figures') : st.filter.startsWith('dom:') ? E.domains[+st.filter.slice(4)][en() ? 'en' : 'es'] : subName(+st.filter.slice(4));
    if (st.measure === 'percap') return rub + T(' / millón', ' / million');
    return rub;
  }

  // ===================== Leyenda =====================
  function drawLegend() {
    // leyenda ADENTRO del svg del mapa (asi el PNG exportado la incluye)
    const d3 = window.d3, svg = d3.select('#chartmap'); if (svg.empty()) return;
    svg.select('#legendG').remove();
    const leg = svg.append('g').attr('id', 'legendG').attr('transform', `translate(${MARGIN.left + 4},${LEG_Y}) scale(1.9)`);
    const FONT = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    if (st.mapMode === 'dorling') return;   // el cartograma no lleva rotulo (pedido de Daniel)
    const W_MAIN = 320, GAP = 12, ND_W = 14, BIN_H = 12, TEXT_Y = BIN_H + 12;
    const nBins = legendBreaks.length + 1, binW = W_MAIN / nBins;
    for (let i = 0; i < nBins; i++) leg.append('rect').attr('x', i * binW).attr('y', 0).attr('width', binW).attr('height', BIN_H).attr('fill', RAMP[i]).attr('stroke', 'rgba(0,0,0,.08)').attr('stroke-width', .5).attr('data-bin', i).style('cursor', 'pointer').on('mouseenter', () => hiBin(i)).on('mouseleave', clearHi);
    legendBreaks.forEach((b, idx) => leg.append('text').attr('x', (idx + 1) * binW).attr('y', TEXT_Y).attr('text-anchor', 'middle').attr('font-family', FONT).attr('font-size', 10).attr('fill', '#4A4A4A').attr('font-variant-numeric', 'tabular-nums').text(fmtVal(b)));
    const ndX = W_MAIN + GAP;
    leg.append('rect').attr('x', ndX).attr('y', 0).attr('width', ND_W).attr('height', BIN_H).attr('fill', NODATA).attr('stroke', 'rgba(0,0,0,.15)').attr('stroke-width', .5);
    leg.append('text').attr('x', ndX + ND_W / 2).attr('y', TEXT_Y).attr('text-anchor', 'middle').attr('font-family', FONT).attr('font-size', 10).attr('fill', '#4A4A4A').text(T('s/d', 'n/a'));
  }
  function hiBin(i) { window.d3.selectAll('.m-country').each(function () { const el = window.d3.select(this); const own = el.attr('data-bin'); if (own === String(i)) el.attr('stroke', STROKE_HOVER).attr('stroke-width', 1.2).attr('fill-opacity', 1); else el.attr('stroke', STROKE).attr('stroke-width', .5).attr('fill-opacity', .3); }); }
  function clearHi() { window.d3.selectAll('.m-country').attr('stroke', STROKE).attr('stroke-width', .5).attr('fill-opacity', 1); }

  // ===================== Subtítulo =====================
  // subtitulo OWID: quien (genitivo del dominio / ocupacion) + medida + corte
  const GEN_DOM_ES = { 'Deportes': 'del deporte', 'Artes y espectáculo': 'del arte y el espectáculo',
    'Ciencia y tecnología': 'de la ciencia y la tecnología', 'Humanidades': 'de las humanidades',
    'Poder y figuras públicas': 'del poder y las figuras públicas', 'Negocios y exploración': 'de los negocios y la exploración' };
  function updateSub() {
    const el = document.getElementById('mSub'); if (!el) return;
    const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
    const tx = (ae && ae.texts && ae.texts[en() ? 'en' : 'es']) || {};
    if ((tx.subtitle || '').trim()) return;
    const rangoCompleto = st.y0 <= YMIN && st.y1 >= YMAX;
    const corte = st.view === 'region' ? T('por región', 'by region') : T('por país', 'by country');
    const porQuien = rangoCompleto ? corte + T(' y período.', ' and period.')
                                   : corte + ', ' + T('nacidas', 'born') + ' ' + fmtYear(st.y0) + '–' + fmtYear(st.y1) + '.';
    const pc = st.measure === 'percap' ? T(' por millón de habitantes', ' per million people') : '';
    let quien;
    if (st.filter === 'all') quien = T('Figuras célebres', 'Famous figures');
    else if (st.filter.startsWith('dom:')) {
      const d = E.domains[+st.filter.slice(4)];
      quien = en() ? 'Famous figures in ' + d.en.toLowerCase() : 'Figuras célebres ' + (GEN_DOM_ES[d.es] || 'de ' + d.es.toLowerCase());
    } else quien = subName(+st.filter.slice(4)) + ': ' + T('figuras célebres', 'famous figures');
    el.textContent = quien + pc + ', ' + porQuien;
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
    grp('m-measure', 'measure', () => { if (st.measure !== 'abs') st.mapMode = 'choro'; });
    grp('m-mapmode', 'mapMode');

    const fs = document.getElementById('m-filter');
    window.__mapFillFilter = function () {
      let html = `<option value="all">${T('Todos los rubros', 'All fields')}</option>`;
      html += `<optgroup label="${T('Rubros', 'Fields')}">` + E.domains.map((d, i) => `<option value="dom:${i}">${d[en() ? 'en' : 'es']}</option>`).join('') + '</optgroup>';
      html += `<optgroup label="${T('Ocupaciones', 'Occupations')}">` + E.subMeta.map((s, i) => s.dom < 0 ? '' : `<option value="sub:${i}">${subName(i)}</option>`).join('') + '</optgroup>';
      fs.innerHTML = html; fs.value = st.filter;
    };
    window.__mapFillFilter();
    fs.addEventListener('change', () => { st.filter = fs.value; draw(); syncControls(); });


    // periodo UNIVERSAL de la casa: doble slider por tramos + cajitas (vacio = extremo)
    const ANC = [[0, YMIN], [250, 0], [500, 1500], [1000, YMAX]];
    const s2y = (v) => { v = +v; for (let k = 1; k < ANC.length; k++) if (v <= ANC[k][0]) { const a = ANC[k - 1], b = ANC[k]; return Math.round(a[1] + (v - a[0]) * (b[1] - a[1]) / (b[0] - a[0])); } return YMAX; };
    const y2s = (y) => { y = Math.max(YMIN, Math.min(YMAX, +y)); for (let k = 1; k < ANC.length; k++) if (y <= ANC[k][1]) { const a = ANC[k - 1], b = ANC[k]; return a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]); } return 1000; };
    const r0 = document.getElementById('m-r0'), r1 = document.getElementById('m-r1');
    const b0 = document.getElementById('m-y0'), b1 = document.getElementById('m-y1');
    function syncPeriodo() {
      r0.value = y2s(st.y0); r1.value = y2s(st.y1);
      b0.value = st.y0 === YMIN ? '' : st.y0;
      b1.value = st.y1 === YMAX ? '' : st.y1;
      const fill = document.getElementById('m-fill');
      fill.style.left = (y2s(st.y0) / 10) + '%';
      fill.style.width = Math.max(0, (y2s(st.y1) - y2s(st.y0)) / 10) + '%';
    }
    let drawT; const redraw = () => { clearTimeout(drawT); drawT = setTimeout(draw, 110); };
    window.__mapSyncPeriodo = syncPeriodo;
    r0.addEventListener('input', () => { st.y0 = Math.min(s2y(r0.value), st.y1); syncPeriodo(); redraw(); });
    r1.addEventListener('input', () => { st.y1 = Math.max(s2y(r1.value), st.y0); syncPeriodo(); redraw(); });
    b0.addEventListener('change', () => { const v = b0.value === '' ? YMIN : Math.round(+b0.value); if (isFinite(v)) st.y0 = Math.max(YMIN, Math.min(v, st.y1)); syncPeriodo(); draw(); });
    b1.addEventListener('change', () => { const v = b1.value === '' ? YMAX : Math.round(+b1.value); if (isFinite(v)) st.y1 = Math.min(YMAX, Math.max(v, st.y0)); syncPeriodo(); draw(); });
    [b0, b1].forEach(b => b.addEventListener('keydown', e => { if (e.key === 'Enter') b.blur(); }));
    syncPeriodo();
    document.getElementById('m-reset').addEventListener('click', () => window.d3.select('#chartmap').transition().duration(450).call(zoom.transform, window.d3.zoomIdentity));
    syncControls();
  }
  function setupZoom() {
    const d3 = window.d3, svg = d3.select('#chartmap');
    zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[-M_W * 0.2, -M_H * 0.2], [M_W * 1.2, M_H * 1.2]]).on('zoom', ev => svg.select('.m-zoom').attr('transform', ev.transform.toString()));
    svg.call(zoom).on('dblclick.zoom', null);
  }

  // store values for hover
  const _origCompute = computeValues;
  computeValues = function () { const r = _origCompute(); lastVals = r; return r; };

  // CSV de lo visible (pais o region, con ambas medidas y n)
  function csvActual() {
    const vals = computeValues();
    const q = (x) => '"' + String(x).replace(/"/g, '""') + '"';
    const lines = [];
    if (st.view === 'region') {
      lines.push(['region', 'n_figures', 'per_million'].join(','));
      const regVal = vals.__regVal || {}, f = vals.__filt;
      const accN = {}, accP = {};
      for (let k = 0; k < E.isoMeta.length; k++) { const r = E.isoMeta[k].reg; if (!r) continue; accN[r] = (accN[r] || 0) + f[k]; accP[r] = (accP[r] || 0) + avgPopK(PP.pop[E.isoMeta[k].iso], st.y0, st.y1); }
      Object.keys(accN).sort().forEach(r => lines.push([q(regLabel(r)), Math.round(accN[r]), accP[r] > 0 ? (accN[r] / (accP[r] / 1000)).toFixed(2) : ''].join(',')));
    } else {
      lines.push(['iso3', 'country', 'region', 'n_figures', 'per_million'].join(','));
      const f = vals.__filt;
      E.isoMeta.forEach((m, k) => {
        if (!(f[k] > 0)) return;
        const pm = avgPopM(m.iso, st.y0, st.y1);
        lines.push([m.iso, q(dispName(m.iso)), q(m.reg ? regLabel(m.reg) : ''), Math.round(f[k]), pm > 0 ? (f[k] / pm).toFixed(2) : ''].join(','));
      });
    }
    return '\ufeff' + lines.join('\n');
  }
  const csvBtn = document.querySelector('button.download[data-chart="map-csv"]');
  if (csvBtn) csvBtn.addEventListener('click', () => {
    const blob = new Blob([csvActual()], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = en() ? 'the-atlas-05-fame-map.csv' : 'el-atlas-05-mapa-fama.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });

  // toggle de idioma de la casa: re-render completo
  window.__mapRelang = function () { if (window.__mapFillFilter) window.__mapFillFilter(); draw(); };
  window.__atlasSupportsFormats = false;   // el PNG sale del viewBox actual (mapa apaisado)

  loadGeo(); ajustarMarco(); wire(); setupZoom(); draw();
  applyUrlState();
})();
