// =============================================================
//  El Atlas N°5 — Tablero de figuras célebres (barras)
// =============================================================
// Toggles: Vista (País|Región) · Medida (Absoluto|Per cápita|Share) ·
// Desglose (Total|Por dominio|Por dominio detalle) · Pob. mínima · período · chips.
// PER CÁPITA = MÉTODO B: total ÷ POBLACIÓN PROMEDIO HISTÓRICA del período × 1e6
// (integral trapezoidal de la serie OWID interpolada). Share = % del total del país.
// "Por dominio detalle": sub-rubros grandes (Fútbol, etc.) en tonos del color del
// dominio + "Resto". Media mundial: línea (Total) o BARRA "Mundo" (relativas).
// Datos: PCFIGS (iso, subId, año; subMeta[subId]={es,en,dom}) + PERCAP_POP.
(function () {
  'use strict';
  const E = window.PCMAP, PP = window.PERCAP_POP;   // dataset CORREGIDO (multi + score_T50)
  const LANG = (new URLSearchParams(location.search).get('lang') === 'en') ? 'en' : 'es';
  const en = LANG === 'en';
  const T = (es, eng) => (en ? eng : es);
  const NS = 'http://www.w3.org/2000/svg';
  const ns = (t) => document.createElementNS(NS, t);

  const YMIN = E.yearMin, YMAX = E.yearMax, ND = E.domains.length, NSUB = E.subMeta.length;
  const COLOR_BAR = '#5E7E96', COLOR_AXIS = '#9C928A', COLOR_WORLD = '#BE5D32';
  const DOM_COL = {
    'Deportes': '#BE5D32', 'Artes y espectáculo': '#C9A227', 'Humanidades': '#2D6A3D',
    'Ciencia y tecnología': '#234B85', 'Poder y figuras públicas': '#6B3D8B', 'Negocios y exploración': '#8A5A35'
  };
  const domColor = (d) => DOM_COL[E.domains[d].es] || '#888';
  const REG_LABEL = {
    'Latin America': ['América Latina', 'Latin America'], 'Caribbean': ['Caribe', 'Caribbean'],
    'Western Europe': ['Europa Occidental', 'Western Europe'], 'Eastern Europe & Central Asia': ['Europa del Este y Asia Central', 'Eastern Europe & C. Asia'],
    'North America, Australia & New Zealand': ['Norteamérica y Oceanía', 'N. America & Oceania'], 'East Asia': ['Asia Oriental', 'East Asia'],
    'Southeast Asia': ['Sudeste Asiático', 'Southeast Asia'], 'South Asia': ['Asia del Sur', 'South Asia'],
    'Middle East & North Africa': ['Medio Oriente y N. de África', 'Middle East & N. Africa'], 'Sub-Saharan Africa': ['África Subsahariana', 'Sub-Saharan Africa']
  };
  const regLabel = (k) => (REG_LABEL[k] ? REG_LABEL[k][en ? 1 : 0] : k);
  const subName = (s) => E.subMeta[s][en ? 'en' : 'es'];

  // Tonos por sub-rubro (gama del dominio, oscuro→claro; "Resto" el más claro).
  const SUBDOM = E.subMeta.map(s => s.dom);
  const SUB_COLOR = new Array(NSUB).fill('#9aa');
  function shade(hex, p, P) {
    const f = P <= 1 ? 0 : (p / (P - 1)) * 0.6;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const m = (c) => Math.round(c + (255 - c) * f);
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  }
  for (let di = 0; di < ND; di++) {
    const subs = []; E.subMeta.forEach((s, i) => { if (s.dom === di) subs.push(i); });
    const base = domColor(di);
    subs.forEach((sid, p) => SUB_COLOR[sid] = shade(base, p, subs.length));
  }

  const ISO_META = {}; E.isoMeta.forEach(m => { ISO_META[m.iso] = m; });
  const dispName = (iso) => ISO_META[iso] ? ISO_META[iso][en ? 'en' : 'es'] : iso;
  const fmtYear = (y) => y < 0 ? `${-y} ${T('a.C.', 'BC')}` : String(y);

  const DEF_Y0 = 1800;
  const st = { y0: DEF_Y0, y1: YMAX, view: 'country', measure: 'percap', breakdown: 'total', minPopM: 0, domainFilter: 'all', selected: [], activeSegs: new Set(), activeFor: null, latamAll: false, savedSel: null, multiOnly: false, weightHPI: false };
  const LATAM_ISOS = E.isoMeta.filter(m => m.reg === 'Latin America').map(m => m.iso);

  // Categorías activas de la leyenda (dom o subId). Al togglear, las barras
  // muestran solo lo activo y se reordenan; en share el denominador sigue siendo
  // el total del país (no se renormaliza), para comparar el share real.
  const SUBCATS = []; for (let i = 0; i < NSUB; i++) if (SUBDOM[i] >= 0) SUBCATS.push(i);
  const currentCats = (bk) => bk === 'subdom' ? SUBCATS.slice() : Array.from({ length: ND }, (_, i) => i);
  const catCount = (bk) => bk === 'subdom' ? SUBCATS.length : ND;
  function ensureActive() {
    if (st.breakdown === 'total') return;
    if (st.activeFor !== st.breakdown) { st.activeSegs = new Set(currentCats(st.breakdown)); st.activeFor = st.breakdown; }
  }

  // ===================== Decode F =====================
  // F = 6 bytes/figura: iso, subId, [year 13b + multi bit15], score*100 uint16.
  function decodeF() {
    const F = E.F; if (F.iso) return;
    const bin = atob(F.b64), n = F.n;
    const iso = new Uint8Array(n), sub = new Uint8Array(n), year = new Int16Array(n), multi = new Uint8Array(n), score = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      iso[i] = bin.charCodeAt(o); sub[i] = bin.charCodeAt(o + 1);
      const yw = bin.charCodeAt(o + 2) | (bin.charCodeAt(o + 3) << 8);
      year[i] = (yw & 0x7FFF) - 4000; multi[i] = (yw >> 15) & 1;
      score[i] = (bin.charCodeAt(o + 4) | (bin.charCodeAt(o + 5) << 8)) / 100;
    }
    F.iso = iso; F.sub = sub; F.year = year; F.multi = multi; F.score = score;
  }

  // ===================== Población =====================
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

  // ===================== Agregación =====================
  function aggregate() {
    decodeF();
    const F = E.F, N = F.iso.length, NI = E.isoMeta.length;
    const total = new Float64Array(NI), bySub = new Float64Array(NI * NSUB), byDom = new Float64Array(NI * ND);
    let wTotal = 0; const wSub = new Float64Array(NSUB), wDom = new Float64Array(ND);
    const y0 = st.y0, y1 = st.y1, mo = st.multiOnly, wh = st.weightHPI;
    for (let i = 0; i < N; i++) {
      const y = F.year[i]; if (y < y0 || y > y1) continue;
      if (mo && !F.multi[i]) continue;          // toggle multiidioma
      const w = wh ? F.score[i] : 1;            // toggle Ponderar por HPI (suma score_T50)
      const k = F.iso[i], s = F.sub[i], d = SUBDOM[s];
      total[k] += w; wTotal += w; bySub[k * NSUB + s] += w; wSub[s] += w;
      if (d >= 0) { byDom[k * ND + d] += w; wDom[d] += w; }
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
        const a = acc[reg]; if (a.avgK / 1000 < st.minPopM) return;
        out.push({ key: reg, name: regLabel(reg), total: a.total, dom: a.dom, sub: a.sub, popM: a.avgK / 1000 });
      });
    } else {
      const idx = {}; E.isoMeta.forEach((m, k) => idx[m.iso] = k);
      st.selected.forEach(iso => {
        const k = idx[iso]; if (k == null) return;
        const pm = avgPopM(iso, st.y0, st.y1);
        if (pm < st.minPopM) return;
        const dom = new Float64Array(ND), sub = new Float64Array(NSUB);
        for (let d = 0; d < ND; d++) dom[d] = byDom[k * ND + d];
        for (let s = 0; s < NSUB; s++) sub[s] = bySub[k * NSUB + s];
        out.push({ key: iso, name: dispName(iso), total: total[k], dom, sub, popM: pm });
      });
    }
    return out;
  }
  function worldEntity(agg) {
    return { key: '__world', name: T('Mundo', 'World'), isWorld: true, total: agg.wTotal, dom: agg.wDom, sub: agg.wSub, popM: avgPopK(PP.world, st.y0, st.y1) / 1000 };
  }

  // ===================== Filas con valores =====================
  function valForEntity(e) {
    const measure = st.measure, bk = st.breakdown;
    const val = (cnt) => measure === 'abs' ? cnt : (measure === 'percap' ? (e.popM > 0 ? cnt / e.popM : 0) : (e.total > 0 ? cnt / e.total * 100 : 0));
    let segs;
    if (bk === 'total') {
      const cnt = st.domainFilter === 'all' ? e.total : e.dom[+st.domainFilter];
      segs = [{ key: '_', color: e.isWorld ? COLOR_WORLD : COLOR_BAR, v: val(cnt), label: '' }];
    } else if (bk === 'dom') {
      segs = [];
      for (let d = 0; d < ND; d++) segs.push({ key: d, color: domColor(d), v: val(e.dom[d]), label: E.domains[d][en ? 'en' : 'es'] });
    } else { // subdom
      segs = [];
      for (let s = 0; s < NSUB; s++) { if (SUBDOM[s] < 0) continue; segs.push({ key: s, color: SUB_COLOR[s], v: val(e.sub[s]), label: subName(s) }); }
    }
    // sólo segmentos activos (leyenda); en total no hay toggle
    const active = bk === 'total' ? segs : segs.filter(sg => st.activeSegs.has(sg.key));
    const allOn = bk === 'total' || st.activeSegs.size >= catCount(bk);
    let barValue, endLabel, sortVal;
    barValue = active.reduce((a, x) => a + x.v, 0);
    if (measure === 'share') { endLabel = allOn ? fmtInt(e.total) : fmtVal(barValue) + '%'; sortVal = allOn ? e.total : barValue; }
    else { endLabel = measure === 'abs' ? fmtInt(barValue) : fmtVal(barValue); sortVal = barValue; }
    return { key: e.key, name: e.name, isWorld: e.isWorld, segs: active, barValue, endLabel, total: e.total, popM: e.popM, sortVal };
  }

  // ===================== Formato =====================
  const fmtInt = (n) => Math.round(n).toLocaleString(en ? 'en-US' : 'es-AR');
  function fmtVal(v) {
    if (v >= 100) return Math.round(v).toLocaleString(en ? 'en-US' : 'es-AR');
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(3);
    if (v > 0) return v.toFixed(4);
    return '0';
  }

  // ===================== Render =====================
  const M = { top: 30, right: 110, bottom: 52, left: 150 };
  const W = 1100, BAR_H = 22, BAR_GAP = 7, WGAP = 16;
  function measure(text, fs, w) {
    if (!measure._c) measure._c = document.createElement('canvas').getContext('2d');
    measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
    return measure._c.measureText(text).width;
  }

  function draw() {
    const svg = document.getElementById('pcChart'); if (!svg) return;
    svg.innerHTML = '';
    ensureActive();
    const agg = aggregate();
    const ents = computeEntities(agg);
    let rows = ents.map(valForEntity).sort((a, b) => b.sortVal - a.sortVal);
    const relative = st.measure === 'percap' || st.measure === 'share';
    const worldRow = relative ? valForEntity(worldEntity(agg)) : null;
    updateSub(); renderLegend();

    const n = rows.length, nBars = n + (worldRow ? 1 : 0);
    const margin = { ...M };
    let maxName = 0; rows.concat(worldRow || []).forEach(d => { const w = measure(d.name, 13, 700); if (w > maxName) maxName = w; });
    margin.left = Math.min(Math.round(W * 0.42), Math.max(margin.left, Math.ceil(maxName) + 14));

    const plotH = nBars * (BAR_H + BAR_GAP) - BAR_GAP + (worldRow ? WGAP : 0);
    const totalH = margin.top + Math.max(plotH, 40) + margin.bottom;
    svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
    const plotW = W - margin.left - margin.right;
    const isShare = st.measure === 'share';
    const maxBar = isShare ? 100 : Math.max(...rows.map(d => d.barValue), worldRow ? worldRow.barValue : 0, 1e-9);
    const xMax = isShare ? 100 : maxBar * 1.08;
    const xScale = (v) => (v / xMax) * plotW;

    const ticks = niceTicks(0, xMax, 5);
    const tickDec = xMax >= 10 ? 0 : xMax >= 1 ? 1 : xMax >= 0.1 ? 2 : 3;
    ticks.forEach(v => {
      const x = margin.left + xScale(v);
      const ln = ns('line'); ln.setAttribute('x1', x); ln.setAttribute('x2', x);
      ln.setAttribute('y1', margin.top); ln.setAttribute('y2', margin.top + plotH);
      ln.setAttribute('stroke', '#E5DDD0'); svg.appendChild(ln);
      const lb = ns('text'); lb.setAttribute('x', x); lb.setAttribute('y', margin.top + plotH + 16);
      lb.setAttribute('text-anchor', 'middle'); lb.setAttribute('fill', '#7A6E62');
      lb.setAttribute('font-family', '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, system-ui'); lb.style.fontSize = '11px';
      lb.setAttribute('font-variant-numeric', 'tabular-nums'); lb.textContent = v.toFixed(tickDec) + (isShare ? '%' : '');
      svg.appendChild(lb);
    });
    const xt = ns('text'); xt.setAttribute('x', margin.left + plotW / 2); xt.setAttribute('y', margin.top + plotH + 40);
    xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('fill', '#7A6E62'); xt.setAttribute('font-weight', 500);
    xt.setAttribute('font-family', '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, system-ui'); xt.style.fontSize = '12px'; xt.textContent = axisTitle();
    svg.appendChild(xt);

    const drawRow = (d, y) => {
      const nm = ns('text'); nm.setAttribute('x', margin.left - 8); nm.setAttribute('y', y + BAR_H / 2);
      nm.setAttribute('text-anchor', 'end'); nm.setAttribute('dominant-baseline', 'central');
      nm.setAttribute('font-family', '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, system-ui'); nm.style.fontSize = '13px';
      nm.setAttribute('font-weight', d.isWorld ? 700 : 500); nm.setAttribute('fill', d.isWorld ? COLOR_WORLD : '#3A3530');
      nm.textContent = d.name; svg.appendChild(nm);
      let xc = margin.left;
      d.segs.forEach(seg => {
        if (seg.v <= 0) return;
        const segW = xScale(seg.v);
        const rect = ns('rect'); rect.setAttribute('x', xc); rect.setAttribute('y', y);
        rect.setAttribute('width', Math.max(0, segW)); rect.setAttribute('height', BAR_H);
        rect.setAttribute('fill', seg.color); rect.setAttribute('fill-opacity', d.isWorld ? 0.78 : 0.92);
        if (st.breakdown === 'total') rect.setAttribute('rx', 2);
        rect.style.cursor = 'pointer';
        rect.addEventListener('mouseenter', (ev) => { rect.setAttribute('fill-opacity', 1); showTip(ev, d, seg); });
        rect.addEventListener('mousemove', posTip);
        rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', d.isWorld ? 0.78 : 0.92); hideTip(); });
        svg.appendChild(rect); xc += segW;
      });
      const vt = ns('text'); vt.setAttribute('x', xc + 6); vt.setAttribute('y', y + BAR_H / 2);
      vt.setAttribute('dominant-baseline', 'central'); vt.setAttribute('font-family', '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, system-ui');
      vt.style.fontSize = '12px'; vt.setAttribute('font-weight', 600); vt.setAttribute('fill', d.isWorld ? COLOR_WORLD : '#3A3530');
      vt.setAttribute('font-variant-numeric', 'tabular-nums'); vt.textContent = d.endLabel; svg.appendChild(vt);
    };

    rows.forEach((d, i) => drawRow(d, margin.top + i * (BAR_H + BAR_GAP)));
    if (worldRow) {
      const yDiv = margin.top + n * (BAR_H + BAR_GAP) + WGAP / 2 - 1;
      const dv = ns('line'); dv.setAttribute('x1', margin.left); dv.setAttribute('x2', margin.left + plotW);
      dv.setAttribute('y1', yDiv); dv.setAttribute('y2', yDiv); dv.setAttribute('stroke', '#D8CFC2'); dv.setAttribute('stroke-dasharray', '3 3'); svg.appendChild(dv);
      drawRow(worldRow, margin.top + n * (BAR_H + BAR_GAP) + WGAP);
    }

    const z = ns('line'); z.setAttribute('x1', margin.left); z.setAttribute('x2', margin.left);
    z.setAttribute('y1', margin.top); z.setAttribute('y2', margin.top + plotH);
    z.setAttribute('stroke', COLOR_AXIS); svg.appendChild(z);
  }

  function niceTicks(min, max, target) {
    const span = max - min, raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag, step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = []; for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(8));
    return out;
  }
  function axisTitle() {
    const Fig = st.weightHPI ? T('Fama (HPI)', 'Fame (HPI)') : T('Figuras célebres', 'Notable figures');
    if (st.breakdown !== 'total') {
      const what = st.breakdown === 'subdom' ? T('sub-rubro', 'sub-field') : T('dominio', 'field');
      if (st.measure === 'share') return T(`Composición por ${what} (% del total del país)`, `Composition by ${what} (% of country total)`);
      if (st.measure === 'abs') return T(`${Fig} por ${what}`, `${Fig} by ${what}`);
      return T(`${Fig} por millón, por ${what}`, `${Fig} per million, by ${what}`);
    }
    if (st.measure === 'abs') return st.weightHPI ? T('Fama total (HPI)', 'Total fame (HPI)') : T('Total de figuras célebres', 'Total notable figures');
    return T(`${Fig} por millón de habitantes`, `${Fig} per million inhabitants`);
  }
  function renderLegend() {
    const el = document.getElementById('pc-legend'); if (!el) return;
    if (st.breakdown === 'total') { el.innerHTML = ''; el.style.display = 'none'; return; }
    ensureActive();
    el.style.display = 'flex';
    const items = st.breakdown === 'dom'
      ? E.domains.map((d, i) => ({ k: i, color: domColor(i), name: d[en ? 'en' : 'es'] }))
      : E.subMeta.map((s, i) => ({ k: i, color: SUB_COLOR[i], name: subName(i), dom: s.dom })).filter(x => x.dom >= 0);
    const allOn = st.activeSegs.size >= catCount(st.breakdown);
    el.innerHTML = items.map(it => `<span class="lg${st.activeSegs.has(it.k) ? '' : ' off'}" data-k="${it.k}"><span class="sw" style="background:${it.color}"></span>${it.name}</span>`).join('')
      + (allOn ? '' : `<span class="lg lg-reset" data-reset="1">${T('↻ todos', '↻ all')}</span>`);
    el.querySelectorAll('.lg').forEach(node => node.addEventListener('click', () => {
      if (node.dataset.reset) st.activeSegs = new Set(currentCats(st.breakdown));
      else { const k = +node.dataset.k; if (st.activeSegs.has(k)) st.activeSegs.delete(k); else st.activeSegs.add(k); }
      draw();
    }));
  }

  // ===================== Tooltip =====================
  function showTip(ev, d, seg) {
    const tt = document.getElementById('pcTip'); if (!tt) return;
    let h = `<strong>${d.name}</strong>`;
    if (st.breakdown !== 'total' && seg.label) {
      const valTxt = st.measure === 'share' ? seg.v.toFixed(1) + '%' : fmtVal(seg.v) + (st.measure === 'percap' ? T(' / millón', ' / million') : '');
      h += `<div class="tt-row"><span style="color:${seg.color};font-weight:700">${seg.label}</span><span>${valTxt}</span></div>`;
    }
    h += `<div class="tt-row"><span>${st.weightHPI ? T('Fama total (HPI)', 'Total fame (HPI)') : T('Total figuras', 'Total figures')}</span><span>${fmtInt(d.total)}</span></div>`;
    h += `<div class="tt-row"><span>${T('Pob. prom. período', 'Avg. pop. period')}</span><span>${d.popM.toFixed(2)} M</span></div>`;
    if (st.breakdown === 'total') h += `<div class="tt-row tt-strong"><span>${st.measure === 'abs' ? (st.weightHPI ? T('Fama', 'Fame') : T('Figuras', 'Figures')) : T('Por millón', 'Per million')}</span><span>${d.endLabel}</span></div>`;
    tt.innerHTML = h; tt.style.display = 'block'; posTip(ev);
  }
  function posTip(ev) {
    const tt = document.getElementById('pcTip'); if (!tt || tt.style.display === 'none') return;
    const wrap = tt.parentElement.getBoundingClientRect();
    const x = ev.clientX - wrap.left, y = ev.clientY - wrap.top;
    let px = x + 14, py = y - tt.offsetHeight - 8;
    if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
    if (py < 0) py = y + 18;
    tt.style.left = px + 'px'; tt.style.top = py + 'px';
  }
  function hideTip() { const tt = document.getElementById('pcTip'); if (tt) tt.style.display = 'none'; }

  // ===================== Subtítulo =====================
  function updateSub() {
    const el = document.getElementById('pcSub'); if (!el) return;
    const dl = (st.breakdown === 'total' && st.domainFilter !== 'all') ? E.domains[+st.domainFilter][en ? 'en' : 'es'] : T('Todas las disciplinas', 'All fields');
    const figw = st.weightHPI ? T('fama (HPI)', 'fame (HPI)') : T('figuras célebres', 'notable figures');
    const med = st.measure === 'share' ? T('composición', 'composition') : st.measure === 'abs' ? (st.weightHPI ? T('fama total (HPI)', 'total fame (HPI)') : T('total de figuras célebres', 'total notable figures')) : T(`${figw} por millón`, `${figw} per million`);
    const lv = st.view === 'region' ? T('por región', 'by region') : T('por país', 'by country');
    const ml = st.multiOnly ? T(' · solo multiidioma', ' · multi-language only') : '';
    el.textContent = T(`${dl} — ${med} ${lv}, nacidas entre ${fmtYear(st.y0)} y ${fmtYear(st.y1)}${ml}`,
      `${dl} — ${med} ${lv}, born ${fmtYear(st.y0)}–${fmtYear(st.y1)}${ml}`);
  }

  // ===================== Controles =====================
  function syncControls() {
    document.getElementById('pc-domwrap').style.display = st.breakdown === 'total' ? '' : 'none';
    document.getElementById('pc-countrywrap').style.display = st.view === 'country' ? '' : 'none';
    const lw = document.getElementById('pc-latam-wrap'); if (lw) lw.style.display = st.view === 'country' ? '' : 'none';
    const lb = document.getElementById('pc-latam'); if (lb) lb.classList.toggle('on', st.latamAll);
    const shareBtn = document.querySelector('#pc-measure button[data-val="share"]');
    if (shareBtn) shareBtn.style.display = st.breakdown === 'total' ? 'none' : '';
    [['pc-view', 'view'], ['pc-measure', 'measure'], ['pc-breakdown', 'breakdown']].forEach(([id, key]) => {
      document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.val === st[key]));
    });
  }
  function wire() {
    const grp = (id, key, after) => {
      document.querySelectorAll('#' + id + ' button').forEach(b => b.addEventListener('click', () => {
        st[key] = b.dataset.val; if (after) after(); syncControls(); draw();
      }));
    };
    grp('pc-view', 'view');
    grp('pc-measure', 'measure');
    grp('pc-breakdown', 'breakdown', () => { if (st.breakdown === 'total' && st.measure === 'share') st.measure = 'percap'; });

    const dm = document.getElementById('pc-domain');
    dm.innerHTML = `<option value="all">${T('Todas las disciplinas', 'All fields')}</option>`
      + E.domains.map((d, i) => `<option value="${i}">${d[en ? 'en' : 'es']}</option>`).join('');
    dm.value = st.domainFilter;
    dm.addEventListener('change', () => { st.domainFilter = dm.value; draw(); });

    const mp = document.getElementById('pc-minpop');
    mp.value = st.minPopM || '';
    mp.addEventListener('input', () => { st.minPopM = parseFloat(mp.value) || 0; draw(); });

    const mc = document.getElementById('pc-multi');
    if (mc) { mc.checked = st.multiOnly; mc.addEventListener('change', () => { st.multiOnly = mc.checked; draw(); }); }
    const wc = document.getElementById('pc-weight');
    if (wc) { wc.checked = st.weightHPI; wc.addEventListener('change', () => { st.weightHPI = wc.checked; draw(); }); }

    const lb = document.getElementById('pc-latam');
    if (lb) lb.addEventListener('click', () => {
      if (!st.latamAll) { st.savedSel = st.selected.slice(); st.selected = LATAM_ISOS.slice(); st.latamAll = true; }
      else { st.selected = st.savedSel ? st.savedSel.slice() : defaultSelection(); st.latamAll = false; }
      lb.classList.toggle('on', st.latamAll); renderChips(); draw();
    });

    const f = document.getElementById('pc-from'), tt = document.getElementById('pc-to');
    [f, tt].forEach(r => { r.min = YMIN; r.max = YMAX; r.step = 1; });
    f.value = st.y0; tt.value = st.y1;
    const upd = () => {
      let a = +f.value, b = +tt.value;
      if (a > b) { if (document.activeElement === f) b = a; else a = b; f.value = a; tt.value = b; }
      st.y0 = a; st.y1 = b;
      document.getElementById('pc-from-v').textContent = fmtYear(a); document.getElementById('pc-to-v').textContent = fmtYear(b);
      draw();
    };
    f.addEventListener('input', upd); tt.addEventListener('input', upd);
    document.getElementById('pc-from-v').textContent = fmtYear(st.y0); document.getElementById('pc-to-v').textContent = fmtYear(st.y1);
    setupSearch(); syncControls();
  }

  function renderChips() {
    const c = document.getElementById('pc-chips'); if (!c) return;
    c.innerHTML = '';
    st.selected.slice().sort((a, b) => dispName(a).localeCompare(dispName(b), en ? 'en' : 'es')).forEach(iso => {
      const chip = document.createElement('span'); chip.className = 'pc-chip';
      chip.appendChild(document.createTextNode(dispName(iso)));
      const x = document.createElement('button'); x.className = 'pc-chip-x'; x.innerHTML = '×';
      x.addEventListener('click', () => toggle(iso)); chip.appendChild(x); c.appendChild(chip);
    });
  }
  function toggle(iso) {
    const i = st.selected.indexOf(iso);
    if (i >= 0) st.selected.splice(i, 1); else st.selected.push(iso);
    if (st.latamAll) { st.latamAll = false; const lb = document.getElementById('pc-latam'); if (lb) lb.classList.remove('on'); }
    renderChips(); draw();
  }
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function setupSearch() {
    const input = document.getElementById('pc-search'), results = document.getElementById('pc-results');
    if (!input) return;
    const all = Object.keys(PP.pop).filter(iso => ISO_META[iso]).map(iso => ({ iso, name: dispName(iso) }))
      .sort((a, b) => a.name.localeCompare(b.name, en ? 'en' : 'es'));
    let matches = [], active = -1;
    const renderRes = () => {
      if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
      results.innerHTML = matches.map((c, i) => `<div class="pc-res${i === active ? ' on' : ''}${st.selected.includes(c.iso) ? ' sel' : ''}" data-iso="${c.iso}">${c.name}</div>`).join('');
      results.classList.add('open');
      results.querySelectorAll('.pc-res').forEach(el => el.addEventListener('mousedown', (ev) => { ev.preventDefault(); toggle(el.dataset.iso); input.value = ''; matches = []; renderRes(); }));
    };
    input.addEventListener('input', () => { const q = norm(input.value); matches = q ? all.filter(c => norm(c.name).includes(q)).slice(0, 8) : []; active = -1; renderRes(); });
    input.addEventListener('keydown', (ev) => {
      if (!matches.length) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; renderRes(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; renderRes(); }
      else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); toggle(matches[active].iso); input.value = ''; matches = []; renderRes(); }
      else if (ev.key === 'Escape') { matches = []; renderRes(); input.blur(); }
    });
    document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
  }

  function defaultSelection() {
    decodeF();
    const F = E.F, N = F.iso.length, totals = {};
    for (let i = 0; i < N; i++) totals[F.iso[i]] = (totals[F.iso[i]] || 0) + 1;
    const ks = Object.keys(totals).map(Number);
    const isoOf = (k) => E.isoMeta[k].iso;
    const worldTop = ks.slice().sort((a, b) => totals[b] - totals[a]).slice(0, 8).map(isoOf);
    const latamTop = ks.filter(k => E.isoMeta[k].reg === 'Latin America').sort((a, b) => totals[b] - totals[a]).slice(0, 4).map(isoOf);
    const pc = ks.filter(k => totals[k] >= 20).map(k => ({ iso: isoOf(k), v: totals[k] / Math.max(0.01, avgPopM(isoOf(k), DEF_Y0, YMAX)) })).sort((a, b) => b.v - a.v).slice(0, 3).map(x => x.iso);
    const sel = []; const add = (iso) => { if (iso && !sel.includes(iso) && sel.length < 15) sel.push(iso); };
    worldTop.forEach(add); pc.forEach(add); latamTop.forEach(add);
    return sel;
  }

  st.selected = defaultSelection();
  wire(); renderChips(); draw();
})();
