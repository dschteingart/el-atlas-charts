// =============================================================
//  El Atlas N°5 — De qué está hecha la fama (barras apiladas)
// =============================================================
// Reemplaza al prototipo percap.html ("tablero"). Barras horizontales, una por
// región o por país, apiladas por RUBRO (o por ocupación, con tonos de la gama
// del rubro). Medida: % del total (default), absoluto o per cápita.
//
// Criterios de la casa que aplica (pedido de Daniel 2026-09-11):
//   · Universo = la base depurada: SIEMPRE multiidioma. Se fueron los toggles
//     de "solo multiidioma", "ponderar por HPI" y "población mínima": el
//     criterio es uno solo y es el mismo de todos los gráficos del número.
//   · Período: el doble slider universal con cajitas (vacía = extremo).
//   · Chips de país: los de lib/style.css (fondo del color de la región, texto
//     blanco) + el botón "Limpiar" universal. Mismos en todo el número.
//   · Vocabulario: Vista (País/Región), Apertura (Total/Rubros/Ocupaciones).
//   · Título editorial sólo en el estado por default; si el lector toca algo,
//     título descriptivo. Subtítulo OWID con el período dinámico.
//   · Leyenda DENTRO del SVG (el PNG rasteriza el SVG, no el HTML).
//
// Datos: PCMAP (mismo cubo que el mapa: iso × sub-rubro × año + flag multi) y
// PERCAP_POP (series de población OWID, para el per cápita por población
// promedio del período).
(function () {
  'use strict';
  const E = window.PCMAP, PP = window.PERCAP_POP;
  const en = () => (typeof LANG !== 'undefined' ? LANG === 'en' : false);
  const T = (es, eng) => (en() ? eng : es);
  const NS = 'http://www.w3.org/2000/svg';
  const ns = (t) => document.createElementNS(NS, t);
  const FONT = "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const YMIN = E.yearMin, YMAX = E.yearMax, ND = E.domains.length, NSUB = E.subMeta.length;
  const SUBDOM = E.subMeta.map(s => s.dom);
  const DEF_Y0 = 1900;                       // período por default (Daniel)
  const EXC_DEF = { XKX: 1, MCO: 1 };        // fuera de la selección inicial de países

  // paleta de rubros: la misma de evolución (EV_DOM_COL)
  const DOM_COL = {
    'Deportes': '#BE5D32', 'Artes y espectáculo': '#C9A227', 'Humanidades': '#2D6A3D',
    'Ciencia y tecnología': '#234B85', 'Poder y figuras públicas': '#6B3D8B', 'Negocios y exploración': '#8A5A35'
  };
  const CO = { bar: '#5E7E96', world: '#BE5D32', axis: '#9C928A', grid: '#E5DDD0',
               ink: '#3A3530', muted: '#7A6E62', bg: '#FAF8F3' };
  const domColor = (d) => DOM_COL[E.domains[d].es] || '#888';

  // tonos por ocupación dentro de la gama del rubro (oscuro → claro)
  function shade(hex, p, P) {
    const f = P <= 1 ? 0 : (p / (P - 1)) * 0.62;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const m = (c) => Math.round(c + (255 - c) * f);
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  const SUB_COLOR = new Array(NSUB).fill('#9aa');
  for (let di = 0; di < ND; di++) {
    const subs = []; E.subMeta.forEach((s, i) => { if (s.dom === di) subs.push(i); });
    subs.forEach((sid, p) => { SUB_COLOR[sid] = shade(domColor(di), p, subs.length); });
  }

  const ISO_META = {}; E.isoMeta.forEach(m => { ISO_META[m.iso] = m; });
  const dispName = (iso) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso] && COUNTRY_NAMES[iso][LANG])
    || (ISO_META[iso] ? ISO_META[iso][en() ? 'en' : 'es'] : iso);
  const REG_LABEL = {
    'Latin America': ['América Latina', 'Latin America'], 'Caribbean': ['Caribe', 'Caribbean'],
    'Western Europe': ['Europa Occidental', 'Western Europe'], 'Eastern Europe & Central Asia': ['Europa del Este y Asia Central', 'Eastern Europe & C. Asia'],
    'North America, Australia & New Zealand': ['Norteamérica y Oceanía', 'N. America & Oceania'], 'East Asia': ['Asia Oriental', 'East Asia'],
    'Southeast Asia': ['Sudeste Asiático', 'Southeast Asia'], 'South Asia': ['Asia del Sur', 'South Asia'],
    'Middle East & North Africa': ['Medio Oriente y N. de África', 'Middle East & N. Africa'], 'Sub-Saharan Africa': ['África Subsahariana', 'Sub-Saharan Africa']
  };
  const regLabel = (k) => (REG_LABEL[k] ? REG_LABEL[k][en() ? 1 : 0] : k);
  const domName = (d) => E.domains[d][en() ? 'en' : 'es'];
  const subName = (s) => E.subMeta[s][en() ? 'en' : 'es'];
  const fmtYear = (y) => y < 0 ? (-y) + ' ' + T('a.C.', 'BC') : String(y);
  const loc = () => en() ? 'en-US' : 'es-AR';
  const fmtInt = (n) => Math.round(n).toLocaleString(loc());
  function fmtVal(v) {
    if (v >= 100) return Math.round(v).toLocaleString(loc());
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(3);
    return v > 0 ? v.toFixed(4) : '0';
  }

  const st = { y0: DEF_Y0, y1: YMAX, view: 'region', measure: 'share', breakdown: 'dom',
               domainFilter: 'all', selected: [], offDoms: [] };
  const isOff = (d) => st.offDoms.indexOf(d) >= 0;

  // ===================== Datos =====================
  // F = 6 bytes/figura: iso, subId, [año 15b + bit multi], score*100.
  function decodeF() {
    const F = E.F; if (F.iso) return;
    const bin = atob(F.b64), n = F.n;
    const iso = new Uint8Array(n), sub = new Uint8Array(n), year = new Int16Array(n), multi = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      iso[i] = bin.charCodeAt(o); sub[i] = bin.charCodeAt(o + 1);
      const yw = bin.charCodeAt(o + 2) | (bin.charCodeAt(o + 3) << 8);
      year[i] = (yw & 0x7FFF) - 4000; multi[i] = (yw >> 15) & 1;
    }
    F.iso = iso; F.sub = sub; F.year = year; F.multi = multi;
  }
  function interp(pt, year) {
    if (!pt) return 0;
    const ys = pt.y, ps = pt.p, n = ys.length;
    if (year <= ys[0]) return ps[0];
    if (year >= ys[n - 1]) return ps[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] <= year) lo = m; else hi = m; }
    const t = (year - ys[lo]) / (ys[hi] - ys[lo]);
    return ps[lo] + t * (ps[hi] - ps[lo]);
  }
  // población PROMEDIO del período (integral trapezoidal de la serie OWID)
  function avgPopK(pt, y0, y1) {
    if (!pt) return 0;
    if (y1 <= y0) return interp(pt, y0);
    const ys = pt.y, ps = pt.p, n = ys.length;
    let prevX = y0, prevV = interp(pt, y0), area = 0;
    for (let i = 0; i < n; i++) {
      if (ys[i] <= y0) continue;
      if (ys[i] >= y1) break;
      area += (ps[i] + prevV) / 2 * (ys[i] - prevX);
      prevX = ys[i]; prevV = ps[i];
    }
    area += (interp(pt, y1) + prevV) / 2 * (y1 - prevX);
    return area / (y1 - y0);
  }
  const avgPopM = (iso, y0, y1) => avgPopK(PP.pop[iso], y0, y1) / 1000;

  function aggregate() {
    decodeF();
    const F = E.F, N = F.iso.length, NI = E.isoMeta.length;
    const total = new Float64Array(NI), bySub = new Float64Array(NI * NSUB), byDom = new Float64Array(NI * ND);
    let wTotal = 0; const wSub = new Float64Array(NSUB), wDom = new Float64Array(ND);
    const y0 = st.y0, y1 = st.y1;
    for (let i = 0; i < N; i++) {
      if (!F.multi[i]) continue;                 // universo = base depurada
      const y = F.year[i]; if (y < y0 || y > y1) continue;
      const k = F.iso[i], s = F.sub[i], d = SUBDOM[s];
      total[k]++; wTotal++; bySub[k * NSUB + s]++; wSub[s]++;
      if (d >= 0) { byDom[k * ND + d]++; wDom[d]++; }
    }
    return { total, bySub, byDom, NI, wTotal, wSub, wDom };
  }

  function computeEntities(agg) {
    const { total, bySub, byDom, NI } = agg;
    const out = [];
    if (st.view === 'region') {
      const acc = {};
      for (let k = 0; k < NI; k++) {
        const reg = E.isoMeta[k].reg; if (!reg) continue;
        let a = acc[reg]; if (!a) a = acc[reg] = { total: 0, dom: new Float64Array(ND), sub: new Float64Array(NSUB), avgK: 0 };
        a.total += total[k];
        for (let d = 0; d < ND; d++) a.dom[d] += byDom[k * ND + d];
        for (let s = 0; s < NSUB; s++) a.sub[s] += bySub[k * NSUB + s];
        a.avgK += avgPopK(PP.pop[E.isoMeta[k].iso], st.y0, st.y1);
      }
      Object.keys(acc).forEach(reg => {
        const a = acc[reg];
        out.push({ key: reg, name: regLabel(reg), color: null, total: a.total, dom: a.dom, sub: a.sub, popM: a.avgK / 1000 });
      });
    } else {
      const idx = {}; E.isoMeta.forEach((m, k) => { idx[m.iso] = k; });
      st.selected.forEach(iso => {
        const k = idx[iso]; if (k == null) return;
        const dom = new Float64Array(ND), sub = new Float64Array(NSUB);
        for (let d = 0; d < ND; d++) dom[d] = byDom[k * ND + d];
        for (let s = 0; s < NSUB; s++) sub[s] = bySub[k * NSUB + s];
        out.push({ key: iso, name: dispName(iso), total: total[k], dom, sub, popM: avgPopM(iso, st.y0, st.y1) });
      });
    }
    return out;
  }
  const worldEntity = (agg) => ({ key: '__world', name: T('Mundo', 'World'), isWorld: true,
    total: agg.wTotal, dom: agg.wDom, sub: agg.wSub, popM: avgPopK(PP.world, st.y0, st.y1) / 1000 });

  // Fila lista para dibujar: segmentos activos + etiqueta de punta.
  function rowOf(e) {
    const val = (cnt) => st.measure === 'abs' ? cnt
      : st.measure === 'percap' ? (e.popM > 0 ? cnt / e.popM : 0)
      : (e.total > 0 ? cnt / e.total * 100 : 0);
    let segs = [];
    if (st.breakdown === 'total') {
      const cnt = st.domainFilter === 'all' ? e.total : e.dom[+st.domainFilter];
      segs = [{ key: '_', dom: -1, color: e.isWorld ? CO.world : CO.bar, v: val(cnt), label: '' }];
    } else if (st.breakdown === 'dom') {
      for (let d = 0; d < ND; d++) {
        if (isOff(d)) continue;
        segs.push({ key: 'd' + d, dom: d, color: domColor(d), v: val(e.dom[d]), label: domName(d) });
      }
    } else {
      // ocupaciones: agrupadas por rubro, y dentro del rubro de mayor a menor
      for (let d = 0; d < ND; d++) {
        if (isOff(d)) continue;
        const subs = [];
        for (let s = 0; s < NSUB; s++) if (SUBDOM[s] === d && e.sub[s] > 0) subs.push(s);
        subs.sort((a, b) => e.sub[b] - e.sub[a]);
        subs.forEach(s => segs.push({ key: 's' + s, dom: d, color: SUB_COLOR[s], v: val(e.sub[s]), label: subName(s) }));
      }
    }
    const barValue = segs.reduce((a, x) => a + x.v, 0);
    const todos = st.breakdown === 'total' || !st.offDoms.length;
    let endLabel;
    if (st.measure === 'share') endLabel = todos ? fmtInt(e.total) : fmtVal(barValue) + '%';
    else endLabel = st.measure === 'abs' ? fmtInt(barValue) : fmtVal(barValue);
    let sortVal = barValue;
    if (st.measure === 'share' && st.breakdown !== 'total') sortVal = segs.length ? segs[0].v : 0;
    else if (st.measure === 'share') sortVal = e.total;
    return { key: e.key, name: e.name, isWorld: e.isWorld, segs, barValue, endLabel,
             total: e.total, popM: e.popM, sortVal };
  }

  // ===================== Layout por formato =====================
  const W = 1100;
  function isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768; }
  function layout(fmt, mobile) {
    if (fmt === 'newsletter' || fmt === 'square') return { barH: 42, gap: 12, fs: { name: 23, tick: 20, axis: 23, leg: 20, val: 21 }, pad: 26 };
    if (fmt === 'mobile') return { barH: 42, gap: 12, fs: { name: 26, tick: 22, axis: 26, leg: 23, val: 24 }, pad: 28 };
    if (fmt === 'public' || fmt === 'worldmap') return { barH: 28, gap: 9, fs: { name: 16, tick: 14, axis: 16, leg: 15, val: 15 }, pad: 20 };
    if (mobile) return { barH: 34, gap: 10, fs: { name: 22, tick: 19, axis: 22, leg: 20, val: 20 }, pad: 24 };
    return { barH: 22, gap: 7, fs: { name: 13, tick: 11, axis: 12, leg: 12, val: 12 }, pad: 16 };
  }
  function measure(text, fs, w) {
    if (!measure._c) measure._c = document.createElement('canvas').getContext('2d');
    measure._c.font = (w || 400) + ' ' + fs + 'px ' + FONT;
    return measure._c.measureText(text).width;
  }
  function txt(parent, x, y, s, o) {
    const t2 = ns('text');
    t2.setAttribute('x', x); t2.setAttribute('y', y);
    t2.setAttribute('font-family', FONT);
    t2.style.fontSize = (o.fs) + 'px';
    if (o.anchor) t2.setAttribute('text-anchor', o.anchor);
    if (o.baseline) t2.setAttribute('dominant-baseline', o.baseline);
    if (o.weight) t2.setAttribute('font-weight', o.weight);
    t2.setAttribute('fill', o.fill || CO.ink);
    if (o.tnum) t2.setAttribute('font-variant-numeric', 'tabular-nums');
    t2.textContent = s;
    parent.appendChild(t2);
    return t2;
  }

  // ===================== Render =====================

  // ===== Vista compartible (?vista=&medida=&apertura=&rubro=&periodo=&paises=&ocultos=) =====
  let urlWired = false;
  function applyUrlState() {
    if (typeof atlasUrlParam !== 'function') return;
    const v = atlasUrlParam('vista');
    if (v === 'pais') st.view = 'country';
    else if (v === 'region') st.view = 'region';
    const md = atlasUrlParam('medida');
    if (md === 'abs' || md === 'percap' || md === 'share') st.measure = md;
    const ap = atlasUrlParam('apertura');
    if (ap === 'total' || ap === 'ocupaciones' || ap === 'rubros') st.breakdown = (ap === 'ocupaciones') ? 'occ' : (ap === 'rubros' ? 'dom' : 'total');
    const rub = atlasUrlParam('rubro');
    if (rub) { const i = atlasIdxPorSlug(E.domains, rub); if (i >= 0) st.domainFilter = String(i); }
    const per = atlasUrlParam('periodo');
    if (per && per.indexOf('~') > 0) {
      const [a, b] = per.split('~').map(Number);
      if (!isNaN(a) && !isNaN(b) && a <= b) { st.y0 = Math.max(YMIN, a); st.y1 = Math.min(YMAX, b); }
    }
    const ps = atlasUrlParam('paises');
    if (ps !== null) {
      st.selected = (ps === 'ninguno') ? []
        : ps.split('~').map(x => x.toUpperCase()).filter(iso => ISO_META[iso]);
      if (st.selected.length) st.view = 'country';
    } else if (st.view === 'country') st.selected = defaultSelection();
    const oc = atlasUrlParam('ocultos');
    if (oc) {
      const off = oc.split('~').map(x => atlasIdxPorSlug(E.domains, x)).filter(i => i >= 0);
      if (off.length < ND) st.offDoms = off;
    }
    urlWired = true;
    fillDomainSelect(); syncControls(); renderChips();
    if (window.__compSyncPeriodo) window.__compSyncPeriodo();
    draw();
  }
  function syncUrl() {
    if (!urlWired || typeof atlasSyncUrl !== 'function') return;
    const todoDefault = st.view === 'region' && st.measure === 'share' && st.breakdown === 'dom'
      && st.domainFilter === 'all' && !st.offDoms.length && st.y0 === DEF_Y0 && st.y1 === YMAX;
    atlasSyncUrl(todoDefault ? { vista: null, medida: null, apertura: null, rubro: null, periodo: null, paises: null, ocultos: null } : {
      vista: st.view === 'region' ? null : 'pais',
      medida: st.measure === 'share' ? null : st.measure,
      apertura: st.breakdown === 'dom' ? null : (st.breakdown === 'occ' ? 'ocupaciones' : 'total'),
      rubro: (st.breakdown === 'total' && st.domainFilter !== 'all') ? atlasSlug(E.domains[+st.domainFilter].es) : null,
      periodo: (st.y0 === DEF_Y0 && st.y1 === YMAX) ? null : (st.y0 + '~' + st.y1),
      paises: st.view === 'country' ? (st.selected.length ? st.selected.join('~') : 'ninguno') : null,
      ocultos: st.offDoms.length ? st.offDoms.map(d => atlasSlug(E.domains[d].es)).join('~') : null
    });
  }

  function draw() {
    syncUrl();
    const svg = document.getElementById('chartcomp'); if (!svg) return;
    svg.innerHTML = '';
    const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
    const mobile = !fmt && isMobile();
    const L = layout(fmt, mobile), FS = L.fs;
    const agg = aggregate();
    const rows = computeEntities(agg).map(rowOf).sort((a, b) => b.sortVal - a.sortVal);
    const relativa = st.measure === 'percap' || st.measure === 'share';
    const worldRow = relativa ? rowOf(worldEntity(agg)) : null;
    syncTextos();

    if (!rows.length) {
      svg.setAttribute('viewBox', '0 0 ' + W + ' 160');
      txt(svg, W / 2, 90, T('Elegí al menos un país con el buscador.', 'Pick at least one country with the search box.'),
          { fs: FS.axis, anchor: 'middle', fill: CO.muted });
      return;
    }

    // --- geometría ---
    const nBars = rows.length + (worldRow ? 1 : 0);
    const WGAP = L.gap * 2.2;
    let maxName = 0;
    rows.concat(worldRow || []).forEach(d => { const w2 = measure(d.name, FS.name, 700); if (w2 > maxName) maxName = w2; });
    const left = Math.min(Math.round(W * 0.42), Math.ceil(maxName) + FS.name * 1.1);
    let maxEnd = 0;
    rows.concat(worldRow || []).forEach(d => { const w2 = measure(d.endLabel, FS.val, 600); if (w2 > maxEnd) maxEnd = w2; });
    const right = Math.ceil(maxEnd) + FS.val * 1.6;
    const top = L.pad;
    const plotW = W - left - right;
    const plotH = nBars * (L.barH + L.gap) - L.gap + (worldRow ? WGAP : 0);

    // leyenda de RUBROS (en ocupaciones también: los tonos son de su gama)
    const conLeyenda = st.breakdown !== 'total';
    const leg = conLeyenda ? legendLayout(FS.leg, plotW) : null;
    const legH = leg ? leg.rows.length * leg.rowH + FS.leg * 1.2 : 0;
    // el titulo del eje respira antes de la leyenda: con 2.1 quedaban pegados
    // (Daniel 2026-09-14). El colchon escala con el cuerpo de la leyenda.
    const ejeH = FS.tick * 1.6 + FS.axis * 1.5 + FS.leg * 2.0;
    const H = top + plotH + ejeH + legH + L.pad;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, fmt);

    const isShare = st.measure === 'share';
    const maxBar = Math.max.apply(null, rows.map(d => d.barValue).concat([worldRow ? worldRow.barValue : 0, 1e-9]));
    const xMax = isShare && !st.offDoms.length ? 100 : maxBar * 1.08;
    const xS = (v) => (v / xMax) * plotW;

    // --- grilla + eje X ---
    const ticks = niceTicks(0, xMax, 5);
    const dec = xMax >= 10 ? 0 : xMax >= 1 ? 1 : xMax >= 0.1 ? 2 : 3;
    ticks.forEach(v => {
      const x = left + xS(v);
      const ln = ns('line');
      ln.setAttribute('x1', x); ln.setAttribute('x2', x);
      ln.setAttribute('y1', top); ln.setAttribute('y2', top + plotH);
      ln.setAttribute('stroke', CO.grid); svg.appendChild(ln);
      txt(svg, x, top + plotH + FS.tick * 1.45, v.toFixed(dec) + (isShare ? '%' : ''),
          { fs: FS.tick, anchor: 'middle', fill: CO.muted, tnum: true });
    });
    txt(svg, left + plotW / 2, top + plotH + FS.tick * 1.6 + FS.axis * 1.5, axisTitle(),
        { fs: FS.axis, anchor: 'middle', fill: CO.muted, weight: 500 });

    // --- barras ---
    const drawRow = (d, y) => {
      txt(svg, left - FS.name * 0.5, y + L.barH / 2, d.name,
          { fs: FS.name, anchor: 'end', baseline: 'central', weight: d.isWorld ? 700 : 500, fill: d.isWorld ? CO.world : CO.ink });
      let xc = left;
      d.segs.forEach(seg => {
        if (!(seg.v > 0)) return;
        const w2 = xS(seg.v);
        const r = ns('rect');
        r.setAttribute('x', xc); r.setAttribute('y', y);
        r.setAttribute('width', Math.max(0, w2)); r.setAttribute('height', L.barH);
        r.setAttribute('fill', seg.color); r.setAttribute('fill-opacity', d.isWorld ? 0.75 : 0.92);
        if (st.breakdown === 'total') r.setAttribute('rx', 2);
        if (!fmt) {
          r.style.cursor = 'pointer';
          r.addEventListener('mouseenter', (ev) => { r.setAttribute('fill-opacity', 1); showTip(ev, d, seg); });
          r.addEventListener('mousemove', posTip);
          r.addEventListener('mouseleave', () => { r.setAttribute('fill-opacity', d.isWorld ? 0.75 : 0.92); hideTip(); });
        }
        svg.appendChild(r); xc += w2;
      });
      txt(svg, xc + FS.val * 0.5, y + L.barH / 2, d.endLabel,
          { fs: FS.val, baseline: 'central', weight: 600, tnum: true, fill: d.isWorld ? CO.world : CO.ink });
    };
    rows.forEach((d, i) => drawRow(d, top + i * (L.barH + L.gap)));
    if (worldRow) {
      const yDiv = top + rows.length * (L.barH + L.gap) + WGAP / 2 - 1;
      const dv = ns('line');
      dv.setAttribute('x1', left); dv.setAttribute('x2', left + plotW);
      dv.setAttribute('y1', yDiv); dv.setAttribute('y2', yDiv);
      dv.setAttribute('stroke', '#D8CFC2'); dv.setAttribute('stroke-dasharray', '3 3'); svg.appendChild(dv);
      drawRow(worldRow, top + rows.length * (L.barH + L.gap) + WGAP);
    }
    const z = ns('line');
    z.setAttribute('x1', left); z.setAttribute('x2', left);
    z.setAttribute('y1', top); z.setAttribute('y2', top + plotH);
    z.setAttribute('stroke', CO.axis); svg.appendChild(z);

    if (leg) drawLegend(svg, leg, left, plotW, top + plotH + ejeH, FS.leg, !!fmt);
  }

  function niceTicks(min, max, target) {
    const raw = (max - min) / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag, step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(8));
    return out;
  }
  function axisTitle() {
    const quien = T('figuras célebres', 'notable figures');
    if (st.breakdown === 'total') {
      if (st.measure === 'abs') return T('Figuras célebres', 'Notable figures');
      if (st.measure === 'percap') return T('Figuras célebres por millón de habitantes', 'Notable figures per million people');
      return T('% del total mundial', '% of the world total');
    }
    const apert = st.breakdown === 'occ' ? T('ocupación', 'occupation') : T('rubro', 'field');
    if (st.measure === 'share') return st.view === 'region'
      ? T('% de las figuras célebres de cada región, por ' + apert, '% of each region’s notable figures, by ' + apert)
      : T('% de las figuras célebres de cada país, por ' + apert, '% of each country’s notable figures, by ' + apert);
    if (st.measure === 'abs') return T('Figuras célebres por ' + apert, 'Notable figures by ' + apert);
    return T('Figuras célebres por millón, por ' + apert, 'Notable figures per million, by ' + apert);
  }

  // ---- leyenda de rubros DENTRO del svg (clic = prender/apagar) ----
  function legendLayout(fs, plotW) {
    const dotR = fs * 0.45, gapDot = dotR * 2 + fs * 0.5, gapItem = fs * 1.5;
    const items = [];
    for (let d = 0; d < ND; d++) {
      const label = domName(d);
      items.push({ d, label, w: gapDot + measure(label, fs, 500) + gapItem });
    }
    const rows = []; let cur = [], curW = 0;
    items.forEach(it => {
      if (curW + it.w > plotW && cur.length) { rows.push(cur); cur = []; curW = 0; }
      cur.push(it); curW += it.w;
    });
    if (cur.length) rows.push(cur);
    return { rows, dotR, gapDot, gapItem, rowH: fs * 1.7 };
  }
  function drawLegend(svg, leg, left, plotW, y0, fs, isPng) {
    const g = ns('g'); svg.appendChild(g);
    leg.rows.forEach((row, ri) => {
      const rowW = row.reduce((a, it) => a + it.w, 0) - leg.gapItem;
      let x = left + Math.max(0, (plotW - rowW) / 2);
      const y = y0 + ri * leg.rowH;
      row.forEach(it => {
        const off = isOff(it.d);
        const item = ns('g');
        const dot = ns('circle');
        dot.setAttribute('cx', x + leg.dotR); dot.setAttribute('cy', y); dot.setAttribute('r', leg.dotR);
        dot.setAttribute('fill', off ? 'none' : domColor(it.d));
        if (off) { dot.setAttribute('stroke', domColor(it.d)); dot.setAttribute('stroke-width', Math.max(1, fs * 0.11)); }
        item.appendChild(dot);
        txt(item, x + leg.gapDot, y, it.label, { fs, baseline: 'central', fill: '#4A4A4A' });
        if (off) {
          const strike = ns('line');
          strike.setAttribute('x1', x + leg.gapDot - 1);
          strike.setAttribute('x2', x + leg.gapDot + measure(it.label, fs, 400) + 1);
          strike.setAttribute('y1', y); strike.setAttribute('y2', y);
          strike.setAttribute('stroke', '#4A4A4A'); strike.setAttribute('stroke-width', Math.max(1, fs * 0.09));
          item.appendChild(strike);
        }
        if (!isPng) {
          const hit = ns('rect');
          hit.setAttribute('x', x - 2); hit.setAttribute('y', y - leg.rowH / 2);
          hit.setAttribute('width', it.w); hit.setAttribute('height', leg.rowH);
          hit.setAttribute('fill', 'transparent');
          item.appendChild(hit);
          item.style.cursor = 'pointer';
          item.addEventListener('click', () => {
            const i = st.offDoms.indexOf(it.d);
            if (i >= 0) st.offDoms.splice(i, 1); else st.offDoms.push(it.d);
            draw();
          });
        }
        g.appendChild(item);
        x += it.w;
      });
    });
  }

  // ===================== Tooltip =====================
  function showTip(ev, d, seg) {
    const tt = document.getElementById('compTip'); if (!tt) return;
    let h = '<strong>' + d.name + '</strong>';
    h += '<div class="tt-period">' + T('Nacidas', 'Born') + ' ' + fmtYear(st.y0) + '–' + fmtYear(st.y1) + '</div>';
    if (seg.label) {
      const v = st.measure === 'share' ? seg.v.toFixed(1) + '%'
        : fmtVal(seg.v) + (st.measure === 'percap' ? T(' / millón', ' / million') : '');
      h += '<div class="tt-row"><span style="color:' + seg.color + ';font-weight:700">' + seg.label + '</span><span>' + v + '</span></div>';
      if (seg.dom >= 0 && st.breakdown === 'occ') h += '<div class="tt-row"><span>' + T('Rubro', 'Field') + '</span><span>' + domName(seg.dom) + '</span></div>';
    }
    h += '<div class="tt-row"><span>' + T('Total de figuras', 'Total figures') + '</span><span>' + fmtInt(d.total) + '</span></div>';
    if (st.measure === 'percap') h += '<div class="tt-row"><span>' + T('Población promedio', 'Average population') + '</span><span>' + d.popM.toFixed(1) + ' M</span></div>';
    tt.innerHTML = h; tt.style.display = 'block'; posTip(ev);
  }
  function posTip(ev) {
    const tt = document.getElementById('compTip'); if (!tt || tt.style.display === 'none') return;
    const wrap = tt.parentElement.getBoundingClientRect();
    const x = ev.clientX - wrap.left, y = ev.clientY - wrap.top;
    let px = x + 14, py = y - tt.offsetHeight - 8;
    if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
    if (px < 0) px = 0;
    if (py < 0) py = y + 18;
    tt.style.left = px + 'px'; tt.style.top = py + 'px';
  }
  function hideTip() { const tt = document.getElementById('compTip'); if (tt) tt.style.display = 'none'; }

  // ===================== Título y subtítulo =====================
  const GEN_DOM_ES = { 'Deportes': 'del deporte', 'Artes y espectáculo': 'del arte y el espectáculo',
    'Ciencia y tecnología': 'de la ciencia y la tecnología', 'Humanidades': 'de las humanidades',
    'Poder y figuras públicas': 'del poder y las figuras públicas', 'Negocios y exploración': 'de los negocios y la exploración' };
  function editorCustom(campo) {
    const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
    if (!ae || !ae.texts) return '';
    const tx = ae.texts[(ae.lang || (en() ? 'en' : 'es'))] || {};
    return (tx[campo] || '').trim();
  }
  // El título editorial afirma algo sobre América Latina: sólo vale en la foto
  // que lo sostiene (región · % del total · por rubro · período por default).
  const esDefault = () => st.view === 'region' && st.measure === 'share' && st.breakdown === 'dom'
    && st.domainFilter === 'all' && !st.offDoms.length && st.y0 === DEF_Y0 && st.y1 === YMAX;

  function syncTextos() {
    const blk = document.querySelector('.chart-block[data-chart="comp"]'); if (!blk) return;
    const h2 = blk.querySelector('.chart-title'), sub = blk.querySelector('.chart-subtitle');
    if (h2 && !editorCustom('title')) {
      if (esDefault()) h2.textContent = T('Los famosos latinoamericanos son mayormente deportistas',
                                          'Latin America’s famous are mostly athletes');
      else if (st.breakdown !== 'total') h2.textContent = st.view === 'region'
        ? T('De qué está hecha la fama de cada región', 'What fame is made of in each region')
        : T('De qué está hecha la fama de cada país', 'What fame is made of in each country');
      else h2.textContent = st.measure === 'percap'
        ? T('Cuántas figuras célebres por millón de habitantes', 'How many notable figures per million people')
        : (st.view === 'region' ? T('Cuántas figuras célebres dio cada región', 'How many notable figures each region produced')
                                : T('Cuántas figuras célebres dio cada país', 'How many notable figures each country produced'));
    }
    if (sub && !editorCustom('subtitle')) sub.textContent = subText();
  }
  function subText() {
    let quien;
    if (st.measure === 'share') quien = T('Porcentaje de las figuras célebres', 'Share of notable figures');
    else if (st.measure === 'percap') quien = T('Figuras célebres por millón de habitantes', 'Notable figures per million people');
    else quien = T('Figuras célebres', 'Notable figures');
    let apertura = '';
    if (st.breakdown !== 'total') {
      apertura = st.breakdown === 'occ' ? T(' según ocupación', ' by occupation') : T(' según rubro', ' by field');
    } else if (st.domainFilter !== 'all') {
      const d = E.domains[+st.domainFilter];
      apertura = en() ? ' in ' + d.en.toLowerCase() : ' ' + (GEN_DOM_ES[d.es] || 'de ' + d.es.toLowerCase());
    }
    const corte = st.view === 'region' ? T('por región', 'by region') : T('por país', 'by country');
    const completo = st.y0 <= YMIN && st.y1 >= YMAX;
    const periodo = completo ? T(' y período.', ' and period.')
      : ', ' + T('nacidas', 'born') + ' ' + fmtYear(st.y0) + '–' + fmtYear(st.y1) + '.';
    return quien + apertura + ', ' + corte + periodo;
  }

  // ===================== Chips + buscador =====================
  const regColor = (reg) => (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
  function renderChips() {
    const c = document.getElementById('comp-selected-chips'); if (!c) return;
    c.innerHTML = '';
    st.selected.slice().sort((a, b) => dispName(a).localeCompare(dispName(b), en() ? 'en' : 'es')).forEach(iso => {
      const chip = document.createElement('span');
      chip.className = 'm-selected-chip';
      chip.style.background = regColor(ISO_META[iso] ? ISO_META[iso].reg : null);
      chip.appendChild(document.createTextNode(dispName(iso)));
      const x = document.createElement('button');
      x.className = 'm-chip-x'; x.type = 'button'; x.innerHTML = '&times;';
      x.setAttribute('aria-label', T('Quitar', 'Remove'));
      x.addEventListener('click', () => toggleIso(iso));
      chip.appendChild(x); c.appendChild(chip);
    });
  }
  function toggleIso(iso) {
    const i = st.selected.indexOf(iso);
    if (i >= 0) st.selected.splice(i, 1); else st.selected.push(iso);
    renderChips(); draw();
  }
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function setupSearch() {
    const input = document.getElementById('comp-search'), results = document.getElementById('comp-search-results');
    if (!input) return;
    let matches = [], active = -1;
    const lista = () => E.isoMeta.filter(m => PP.pop[m.iso]).map(m => ({ iso: m.iso, name: dispName(m.iso) }))
      .sort((a, b) => a.name.localeCompare(b.name, en() ? 'en' : 'es'));
    const render = () => {
      if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
      results.innerHTML = matches.map((c, i) => '<div class="m-search-result' + (i === active ? ' m-active' : '')
        + (st.selected.indexOf(c.iso) >= 0 ? ' m-already' : '') + '" data-iso="' + c.iso + '">' + c.name + '</div>').join('');
      results.classList.add('open');
      results.querySelectorAll('[data-iso]').forEach(el => el.addEventListener('mousedown', (ev) => {
        ev.preventDefault(); toggleIso(el.dataset.iso); input.value = ''; matches = []; render();
      }));
    };
    input.addEventListener('input', () => {
      const q = norm(input.value.trim());
      matches = q ? lista().filter(c => norm(c.name).indexOf(q) >= 0).slice(0, 8) : [];
      active = matches.length ? 0 : -1; render();
    });
    input.addEventListener('keydown', (ev) => {
      if (!matches.length) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(); }
      else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); toggleIso(matches[active].iso); input.value = ''; matches = []; render(); }
      else if (ev.key === 'Escape') { matches = []; render(); input.blur(); }
    });
    document.addEventListener('click', (ev) => {
      if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
    });
  }
  // Selección inicial de países: los 8 con más figuras + los 3 de mayor tasa
  // (con al menos 1 M de habitantes, si no aparecen microestados) + los 4
  // latinoamericanos más grandes. Kosovo y Mónaco quedan afuera a pedido.
  function defaultSelection() {
    decodeF();
    const F = E.F, N = F.iso.length, tot = {};
    for (let i = 0; i < N; i++) {
      if (!F.multi[i]) continue;
      const y = F.year[i]; if (y < DEF_Y0 || y > YMAX) continue;
      tot[F.iso[i]] = (tot[F.iso[i]] || 0) + 1;
    }
    const isoOf = (k) => E.isoMeta[k].iso;
    const ks = Object.keys(tot).map(Number).filter(k => !EXC_DEF[isoOf(k)]);
    const top = ks.slice().sort((a, b) => tot[b] - tot[a]).slice(0, 8).map(isoOf);
    const latam = ks.filter(k => E.isoMeta[k].reg === 'Latin America').sort((a, b) => tot[b] - tot[a]).slice(0, 4).map(isoOf);
    const pc = ks.filter(k => tot[k] >= 20).map(k => ({ iso: isoOf(k), pm: avgPopM(isoOf(k), DEF_Y0, YMAX), n: tot[k] }))
      .filter(x => x.pm >= 1).map(x => ({ iso: x.iso, v: x.n / x.pm }))
      .sort((a, b) => b.v - a.v).slice(0, 3).map(x => x.iso);
    const sel = []; const add = (iso) => { if (iso && sel.indexOf(iso) < 0 && sel.length < 15) sel.push(iso); };
    top.forEach(add); pc.forEach(add); latam.forEach(add);
    return sel;
  }

  // ===================== Controles =====================
  function syncControls() {
    [['comp-view', 'view'], ['comp-measure', 'measure'], ['comp-breakdown', 'breakdown']].forEach(([id, key]) => {
      document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.val === st[key]));
    });
    document.getElementById('comp-domwrap').style.display = st.breakdown === 'total' ? '' : 'none';
    const paisOn = st.view === 'country';
    document.getElementById('comp-paises').style.display = paisOn ? '' : 'none';
    const chips = document.getElementById('comp-selected-chips');
    chips.style.display = paisOn ? '' : 'none';
    const limpiar = chips.nextElementSibling;
    if (limpiar && limpiar.classList.contains('atlas-clear-btn') && !paisOn) limpiar.style.display = 'none';
  }
  function fillDomainSelect() {
    const dm = document.getElementById('comp-domain'); if (!dm) return;
    dm.innerHTML = '<option value="all">' + T('Todos los rubros', 'All fields') + '</option>'
      + E.domains.map((d, i) => '<option value="' + i + '">' + d[en() ? 'en' : 'es'] + '</option>').join('');
    dm.value = st.domainFilter;
  }
  function wire() {
    const grp = (id, key, after) => document.querySelectorAll('#' + id + ' button').forEach(b =>
      b.addEventListener('click', () => {
        st[key] = b.dataset.val;
        if (after) after();
        syncControls(); renderChips(); draw();
      }));
    grp('comp-view', 'view', () => {
      // al pasar a País por primera vez, la selección inicial
      if (st.view === 'country' && !st.selected.length) st.selected = defaultSelection();
    });
    grp('comp-measure', 'measure');
    grp('comp-breakdown', 'breakdown', () => {
      if (st.breakdown === 'total') st.offDoms = [];
      else if (st.measure === 'abs' && false) st.measure = 'share';
    });
    const dm = document.getElementById('comp-domain');
    fillDomainSelect();
    dm.addEventListener('change', () => { st.domainFilter = dm.value; draw(); });

    // ---- período: doble slider universal de la casa ----
    const ANC = [[0, YMIN], [250, 0], [500, 1500], [1000, YMAX]];
    const s2y = (s) => {
      for (let i = 1; i < ANC.length; i++) if (s <= ANC[i][0]) {
        const [s0, y0] = ANC[i - 1], [s1, y1] = ANC[i];
        return Math.round(y0 + (s - s0) / (s1 - s0) * (y1 - y0));
      }
      return YMAX;
    };
    const y2s = (y) => {
      for (let i = 1; i < ANC.length; i++) if (y <= ANC[i][1]) {
        const [s0, y0] = ANC[i - 1], [s1, y1] = ANC[i];
        return Math.round(s0 + (y - y0) / (y1 - y0) * (s1 - s0));
      }
      return 1000;
    };
    const r0 = document.getElementById('comp-r0'), r1 = document.getElementById('comp-r1');
    const c0 = document.getElementById('comp-y0'), c1 = document.getElementById('comp-y1');
    const fill = document.getElementById('comp-fill');
    let timer = null;
    const redraw = () => { clearTimeout(timer); timer = setTimeout(draw, 110); };
    function sync(desdeCajas) {
      if (desdeCajas) {
        let a = c0.value.trim() === '' ? YMIN : parseInt(c0.value, 10);
        let b = c1.value.trim() === '' ? YMAX : parseInt(c1.value, 10);
        if (isNaN(a)) a = YMIN;
        if (isNaN(b)) b = YMAX;
        a = Math.max(YMIN, Math.min(YMAX, a)); b = Math.max(YMIN, Math.min(YMAX, b));
        if (a > b) { const t2 = a; a = b; b = t2; }
        st.y0 = a; st.y1 = b;
      } else {
        let a = s2y(+r0.value), b = s2y(+r1.value);
        if (a > b) { const t2 = a; a = b; b = t2; }
        st.y0 = a; st.y1 = b;
      }
      r0.value = y2s(st.y0); r1.value = y2s(st.y1);
      c0.value = st.y0 === YMIN ? '' : String(st.y0);
      c1.value = st.y1 === YMAX ? '' : String(st.y1);
      const lo = Math.min(+r0.value, +r1.value) / 10, hi = Math.max(+r0.value, +r1.value) / 10;
      if (fill) { fill.style.left = lo + '%'; fill.style.width = (hi - lo) + '%'; }
      syncTextos();
    }
    window.__compSyncPeriodo = () => {
      c0.value = st.y0 === YMIN ? '' : String(st.y0);
      c1.value = st.y1 === YMAX ? '' : String(st.y1);
      sync(true);
    };
    r0.addEventListener('input', () => { sync(false); redraw(); });
    r1.addEventListener('input', () => { sync(false); redraw(); });
    c0.addEventListener('change', () => { sync(true); redraw(); });
    c1.addEventListener('change', () => { sync(true); redraw(); });
    c0.placeholder = fmtYear(YMIN); c1.placeholder = String(YMAX);
    // sembrar las cajitas con el estado (si no, sync(true) las lee vacias y el
    // periodo arranca completo en vez de en el default)
    c0.value = st.y0 === YMIN ? '' : String(st.y0);
    c1.value = st.y1 === YMAX ? '' : String(st.y1);
    sync(true);

    setupSearch();
    syncControls();
  }

  // ===================== CSV =====================
  function csvActual() {
    const agg = aggregate();
    const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const ents = computeEntities(agg).concat(st.measure === 'abs' ? [] : [worldEntity(agg)]);
    const head = st.view === 'region' ? 'region' : 'iso3,country';
    let csv = head + ',born_from,born_to,category,field,n_figures,per_million,share_pct,pop_millions\n';
    ents.forEach(e => {
      const base = st.view === 'region' ? q(regLabel(e.key)) : (e.key === '__world' ? 'WLD,' + q(e.name) : e.key + ',' + q(e.name));
      const filas = [];
      if (st.breakdown === 'total') {
        const cnt = st.domainFilter === 'all' ? e.total : e.dom[+st.domainFilter];
        filas.push([T('Total', 'Total'), '', cnt]);
      } else if (st.breakdown === 'dom') {
        for (let d = 0; d < ND; d++) filas.push([domName(d), domName(d), e.dom[d]]);
      } else {
        for (let s = 0; s < NSUB; s++) if (SUBDOM[s] >= 0 && e.sub[s] > 0) filas.push([subName(s), domName(SUBDOM[s]), e.sub[s]]);
      }
      filas.forEach(([cat, dom, cnt]) => {
        csv += [base, st.y0, st.y1, q(cat), q(dom), Math.round(cnt),
                e.popM > 0 ? (cnt / e.popM).toFixed(3) : '',
                e.total > 0 ? (cnt / e.total * 100).toFixed(2) : '',
                e.popM.toFixed(2)].join(',') + '\n';
      });
    });
    return csv;
  }
  function wireDescargas() {
    document.querySelectorAll('button.download[data-chart="comp-csv"]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        const blob = new Blob([csvActual()], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = en() ? 'the-atlas-05-fame-composition.csv' : 'el-atlas-05-composicion-fama.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      });
    });
  }

  // ===================== Init =====================
  wire();
  renderChips();
  draw();
  applyUrlState();
  wireDescargas();
  window.__atlasSupportsFormats = true;
  window.__atlasDefaultPngFormat = 'square';
  window.__atlasRedraw = draw;
  window.__compRelang = function () { fillDomainSelect(); renderChips(); draw(); };
  window.addEventListener('atlas-editor-change', draw);
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
})();
