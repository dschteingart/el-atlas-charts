// Panorama del talento — El Atlas N°5 (herramienta interna, no va en nav).
// Tabla-resumen: una fila por disciplina (o dominio) con, para los nacidos
// 1850-2010, las 8 métricas que pidió Daniel:
//   1) R² figuras/millón vs PIB pc   2) país +absoluto   3) país +per cápita
//   4) país LatAm +absoluto          5) país LatAm +per cápita
//   6) figura global top HPI         7) figura LatAm top HPI   8) residuo LatAm
//
// REUSA EL MOTOR del explorador (chart-5): copia verbatim las funciones puras
// de datos (decode F, conteo por país, OLS log-log con +0,5, residuo
// geométrico) para que los números MATCHEEN el scatter. Lo único nuevo es la
// salida (tabla en vez de gráfico). [[clonar-motor-no-reimplementar]]
(function () {
  'use strict';
  const E = window.EXPLORA;
  const LANG = (new URLSearchParams(location.search).get('lang') === 'en') ? 'en' : 'es';
  const en = LANG === 'en';
  const T = (es, eng) => (en ? eng : es);

  // Las 10 regiones de la taxonomía del N°1 (isoMeta.reg). Las columnas y el
  // residuo "regional" se calculan sobre la región elegida en el selector.
  // (Validado: la región 'Latin America' ≡ el set editorial S_LATAM_PURE_CODES
  // —Cuba/RD/Haití incluidos, Caribe anglo aparte en 'Caribbean'—, así que el
  // residuo de LatAm da idéntico que antes.)
  const REG_LABEL = {
    'Latin America': ['América Latina', 'Latin America'],
    'Caribbean': ['Caribe', 'Caribbean'],
    'Western Europe': ['Europa Occidental', 'Western Europe'],
    'Eastern Europe & Central Asia': ['Europa del Este y Asia Central', 'Eastern Europe & C. Asia'],
    'North America, Australia & New Zealand': ['Norteamérica, Australia y N.Z.', 'N. America, Aus. & N.Z.'],
    'East Asia': ['Asia Oriental', 'East Asia'],
    'Southeast Asia': ['Sudeste Asiático', 'Southeast Asia'],
    'South Asia': ['Asia del Sur', 'South Asia'],
    'Middle East & North Africa': ['Medio Oriente y N. de África', 'Middle East & N. Africa'],
    'Sub-Saharan Africa': ['África Subsahariana', 'Sub-Saharan Africa']
  };
  const REG_SHORT = {
    'Latin America': 'LatAm', 'Caribbean': 'Caribe', 'Western Europe': 'Eur. Occ.',
    'Eastern Europe & Central Asia': 'Eur. Este', 'North America, Australia & New Zealand': 'Norteam.+',
    'East Asia': 'Asia Or.', 'Southeast Asia': 'Sudeste As.', 'South Asia': 'Asia Sur',
    'Middle East & North Africa': 'MENA', 'Sub-Saharan Africa': 'África Sub.'
  };
  const REG_KEYS = Object.keys(REG_LABEL);
  const regLabel = (k) => (REG_LABEL[k] ? REG_LABEL[k][en ? 1 : 0] : k);
  const regShort = (k) => (REG_SHORT[k] || k);

  const DOM_COL = {
    'Deportes': '#BE5D32', 'Artes y espectáculo': '#C9A227', 'Humanidades': '#2D6A3D',
    'Ciencia y tecnología': '#234B85', 'Poder y figuras públicas': '#6B3D8B', 'Negocios y exploración': '#8A5A35'
  };
  const DOM_SHORT = {
    'Deportes': T('Deporte', 'Sports'), 'Artes y espectáculo': T('Arte', 'Arts'),
    'Humanidades': T('Humanidades', 'Humanities'), 'Ciencia y tecnología': T('Ciencia', 'Science'),
    'Poder y figuras públicas': T('Poder', 'Power'), 'Negocios y exploración': T('Negocios', 'Business')
  };

  // ===================== MOTOR (copiado de explora.js) =====================
  function decodeF() {
    const F = E.F; if (F.iso) return;
    const bin = atob(F.b64), n = F.n;
    const iso = new Uint8Array(n), occ = new Uint8Array(n), yr = new Uint8Array(n), hpi = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const o = i * 4; iso[i] = bin.charCodeAt(o); occ[i] = bin.charCodeAt(o + 1); yr[i] = bin.charCodeAt(o + 2); hpi[i] = bin.charCodeAt(o + 3); }
    F.iso = iso; F.occ = occ; F.yr = yr; F.hpi = hpi;
  }
  function ols(points) {
    const n = points.length; if (n < 2) return null;
    let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += points[i].x; sy += points[i].y; }
    const mx = sx / n, my = sy / n;
    let num = 0, den = 0, ssTot = 0;
    for (let i = 0; i < n; i++) { const dx = points[i].x - mx, dy = points[i].y - my; num += dx * dy; den += dx * dx; ssTot += dy * dy; }
    const b = den === 0 ? 0 : num / den, a = my - b * mx;
    let ssRes = 0; for (let i = 0; i < n; i++) { const yp = a + b * points[i].x; ssRes += (points[i].y - yp) ** 2; }
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    return { a, b, r2 };
  }
  // Devuelve { pts:[{code,name,gdp_pc,region,popM,count,respRaw,val}], topGlobal, topLatam }.
  // F viene ordenado por HPI desc → la 1ª figura filtrada es la #1 global; la
  // 1ª de un país LatAm es la #1 de la región.
  // topPct = filtro top-X% por HPI dentro del rubro+período (igual que ex_points
  // del explorador): umbral = percentil; solo cuentan figuras con hpi >= umbral.
  // minPopM = piso de población (prom. del período): filtra TODO el universo
  // (regresión, R², residuo, conteo y figuras top), igual que s.minPopM del
  // explorador. NO es solo para el líder per cápita.
  function buildPoints(occSet, y0, y1, topPct, minPopM, regKey) {
    decodeF();
    const F = E.F, N = F.iso.length, Y0 = E.y0, acc = {}, ny = y1 - y0 + 1;
    // Pre-cálculo por país: pob/PIB promedio del período + si pasa el piso.
    const NI = E.isoMeta.length, popMArr = new Float64Array(NI), gdpArr = new Float64Array(NI);
    const ok = new Uint8Array(NI), has = new Uint8Array(NI);
    for (let idx = 0; idx < NI; idx++) {
      const parr = E.pop[idx], garr = E.gdp[idx]; if (!parr || !garr) continue;
      let sp = 0, sg = 0; for (let y = y0; y <= y1; y++) { sp += parr[y - Y0]; sg += garr[y - Y0]; }
      const popM = (sp / ny) / 1000;
      popMArr[idx] = popM; gdpArr[idx] = sg / ny; has[idx] = 1;
      if (popM >= (minPopM || 0)) ok[idx] = 1;
    }
    const inFilter = (i) => { if (occSet && !occSet.has(F.occ[i])) return false; const yr = F.yr[i] + Y0; return yr >= y0 && yr <= y1; };
    let thr = -1;
    if (topPct && topPct < 100) {
      const hs = []; for (let i = 0; i < N; i++) if (inFilter(i)) hs.push(F.hpi[i]);
      if (hs.length) { hs.sort((a, b) => a - b); thr = hs[Math.min(hs.length - 1, Math.floor(hs.length * (1 - topPct / 100)))]; }
    }
    let topGlobal = -1, topRegion = -1;
    for (let i = 0; i < N; i++) {
      if (!inFilter(i)) continue;
      if (thr >= 0 && F.hpi[i] < thr) continue;
      const k = F.iso[i];
      (acc[k] || (acc[k] = { count: 0 })).count++;
      if (!ok[k]) continue;   // figuras top dentro del universo filtrado
      if (topGlobal < 0) topGlobal = i;
      if (topRegion < 0) { const m = E.isoMeta[k]; if (m && m.reg === regKey) topRegion = i; }
    }
    const out = [];
    for (let idx = 0; idx < NI; idx++) {
      if (!has[idx] || !ok[idx]) continue;   // piso de población sobre TODO el universo
      const m = E.isoMeta[idx], popM = popMArr[idx], a = acc[idx] || { count: 0 };
      out.push({ code: m.iso, name: m[en ? 'en' : 'es'], gdp_pc: gdpArr[idx], region: m.reg, popM, count: a.count, respRaw: a.count, val: popM > 0 ? a.count / popM : 0 });
    }
    const figOf = (i) => i < 0 ? null : {
      name: E.F.name[i] || null, code: E.isoMeta[E.F.iso[i]].iso, hpi: E.F.hpi[i],
      occ: E.occMeta[E.F.occ[i]] ? E.occMeta[E.F.occ[i]][en ? 'en' : 'es'] : null
    };
    return { pts: out, topGlobal: figOf(topGlobal), topRegion: figOf(topRegion) };
  }
  // Ajuste log-log SIN ponderar, +0,5 de continuidad (= ex_fit del explorador).
  function fit(pts) {
    const d = pts.filter(p => p.gdp_pc > 0 && p.popM > 0);
    if (d.length < 3) return null;
    const reg = ols(d.map(p => ({ x: Math.log(p.gdp_pc), y: Math.log((p.respRaw + 0.5) / p.popM) })));
    if (!reg) return null;
    return { r2: reg.r2, predict: (g) => Math.exp(reg.a + reg.b * Math.log(g)) };
  }

  // ===================== Fila resumen por rubro =====================
  function rowFor(label, dom, occSet, y0, y1, minPop, topPct, regKey) {
    const { pts, topGlobal, topRegion } = buildPoints(occSet, y0, y1, topPct, minPop, regKey);
    const f = fit(pts);
    let absG = null, pcG = null, absR = null, pcR = null, totalFigs = 0, totalReg = 0;
    for (const p of pts) {
      totalFigs += p.count;
      if (p.count > 0 && (!absG || p.count > absG.count)) absG = p;
      if (p.count > 0 && (!pcG || p.val > pcG.val)) pcG = p;
      if (p.region === regKey) {
        totalReg += p.count;
        if (p.count > 0 && (!absR || p.count > absR.count)) absR = p;
        if (p.count > 0 && (!pcR || p.val > pcR.val)) pcR = p;
      }
    }
    // Residuo de la región = media geométrica de (obs/esp) − 1 sobre los países
    // de esa región (misma fórmula que s_buildModel del explorador, agrupada
    // por región). El ajuste/predict es global (los 162 del universo filtrado).
    let s = 0, nn = 0;
    if (f) for (const p of pts) {
      if (p.region !== regKey || !(p.popM > 0)) continue;
      const pred = f.predict(p.gdp_pc); if (!(pred > 0)) continue;
      s += Math.log(((p.respRaw + 0.5) / p.popM) / pred); nn++;
    }
    const residR = nn ? (Math.exp(s / nn) - 1) * 100 : null;
    return { label, dom, r2: f ? f.r2 : null, totalFigs, totalReg, absG, pcG, absR, pcR, topGlobal, topRegion, residR };
  }

  // ===================== Estado + UI =====================
  const st = { level: 'sub', y0: 1850, y1: 2010, minPop: 1, topPct: 50, region: 'Latin America', domFilter: 'all', sortKey: null, sortDir: -1 };

  const fmtN = (n) => (n || 0).toLocaleString(en ? 'en-US' : 'es-AR');
  const fmtPC = (v) => v == null ? '—' : (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2));
  const fmtPct = (v) => v == null ? '—' : (v >= 0 ? '+' : '') + Math.round(v) + '%';

  function buildRows() {
    const rows = [];
    if (st.level === 'dom') {
      E.domains.forEach(d => rows.push(rowFor(d[en ? 'en' : 'es'], d.es, new Set(d.occ), st.y0, st.y1, st.minPop, st.topPct, st.region)));
    } else {
      E.subrubros.forEach(sr => {
        const occMeta = E.occMeta[sr.idx];
        const dom = occMeta ? occMeta.dom : '';
        if (st.domFilter !== 'all' && dom !== st.domFilter) return;
        rows.push(rowFor(sr[en ? 'en' : 'es'], dom, new Set([sr.idx]), st.y0, st.y1, st.minPop, st.topPct, st.region));
      });
    }
    if (st.sortKey) {
      const k = st.sortKey, dir = st.sortDir;
      const val = (r) => {
        switch (k) {
          case 'label': return r.label;
          case 'n': return r.totalFigs;
          case 'r2': return r.r2 == null ? -1 : r.r2;
          case 'absG': return r.absG ? r.absG.count : -1;
          case 'pcG': return r.pcG ? r.pcG.val : -1;
          case 'absR': return r.absR ? r.absR.count : -1;
          case 'pcR': return r.pcR ? r.pcR.val : -1;
          case 'resid': return r.residR == null ? -1e9 : r.residR;
          default: return 0;
        }
      };
      rows.sort((a, b) => {
        const va = val(a), vb = val(b);
        if (typeof va === 'string') return dir * va.localeCompare(vb, en ? 'en' : 'es');
        return dir * (va - vb);
      });
    }
    return rows;
  }

  const cellCountry = (p, valStr) => p
    ? `<span class="iso" title="${p.name}">${p.code}</span> <span class="cv">${valStr}</span>`
    : '<span class="cv">—</span>';
  const cellFig = (fg) => fg && fg.name
    ? `<span class="fg" title="${fg.occ || ''}${fg.code ? ' · ' + fg.code : ''}">${fg.name}</span> <span class="hp">${Math.round(fg.hpi)}</span>`
    : (fg ? `<span class="cv">${fg.code || '—'}</span>` : '<span class="cv">—</span>');

  function render() {
    const rows = buildRows();
    const rg = regShort(st.region);
    const arrow = (k) => st.sortKey === k ? (st.sortDir < 0 ? ' ▾' : ' ▴') : '';
    const th = (k, label, cls) => `<th class="${cls || ''} sortable" data-k="${k}">${label}${arrow(k)}</th>`;
    let h = '<table><thead><tr>'
      + th('label', T('Disciplina', 'Discipline'))
      + th('n', T('Figuras', 'Figures'), 'num')
      + th('r2', T('R² (PIB pc)', 'R² (GDP pc)'), 'num')
      + th('absG', T('Top país (abs.)', 'Top country (abs.)'))
      + th('pcG', T('Top país (per cáp.)', 'Top country (per cap.)'))
      + th('absR', T(`Top ${rg} (abs.)`, `Top ${rg} (abs.)`))
      + th('pcR', T(`Top ${rg} (per cáp.)`, `Top ${rg} (per cap.)`))
      + `<th>${T('Figura global (HPI)', 'Global figure (HPI)')}</th>`
      + `<th>${T(`Figura ${rg} (HPI)`, `${rg} figure (HPI)`)}</th>`
      + th('resid', T(`Residuo ${rg}`, `${rg} residual`), 'num')
      + '</tr></thead><tbody>';
    rows.forEach(r => {
      const col = DOM_COL[r.dom] || '#888';
      const residCls = r.residR == null ? '' : (r.residR >= 0 ? 'pos' : 'neg');
      h += `<tr>`
        + `<td class="disc"><span class="dot" style="background:${col}"></span>${r.label}`
        + (st.level === 'sub' ? `<span class="domtag" style="color:${col}">${DOM_SHORT[r.dom] || ''}</span>` : '') + `</td>`
        + `<td class="num">${fmtN(r.totalFigs)}</td>`
        + `<td class="num">${r.r2 == null ? '—' : r.r2.toFixed(2)}</td>`
        + `<td>${cellCountry(r.absG, r.absG ? fmtN(r.absG.count) : '')}</td>`
        + `<td>${cellCountry(r.pcG, r.pcG ? fmtPC(r.pcG.val) + '/M' : '')}</td>`
        + `<td>${cellCountry(r.absR, r.absR ? fmtN(r.absR.count) : '')}</td>`
        + `<td>${cellCountry(r.pcR, r.pcR ? fmtPC(r.pcR.val) + '/M' : '')}</td>`
        + `<td>${cellFig(r.topGlobal)}</td>`
        + `<td>${cellFig(r.topRegion)}</td>`
        + `<td class="num ${residCls}">${fmtPct(r.residR)}</td>`
        + `</tr>`;
    });
    h += '</tbody></table>';
    document.getElementById('tbl').innerHTML = h;
    document.querySelectorAll('th.sortable').forEach(t => t.addEventListener('click', () => {
      const k = t.dataset.k;
      if (st.sortKey === k) st.sortDir *= -1; else { st.sortKey = k; st.sortDir = (k === 'label') ? 1 : -1; }
      render();
    }));
    document.getElementById('count').textContent = T(`${rows.length} filas`, `${rows.length} rows`);
  }

  // ===================== Controles =====================
  function wire() {
    const lv = document.getElementById('c-level');
    lv.value = st.level;
    lv.addEventListener('change', () => { st.level = lv.value; document.getElementById('domwrap').style.display = st.level === 'sub' ? '' : 'none'; render(); });

    const df = document.getElementById('c-dom');
    df.innerHTML = `<option value="all">${T('Todos los dominios', 'All domains')}</option>`
      + E.domains.map(d => `<option value="${d.es}">${d[en ? 'en' : 'es']}</option>`).join('');
    df.addEventListener('change', () => { st.domFilter = df.value; render(); });

    const rg = document.getElementById('c-region');
    rg.innerHTML = REG_KEYS.map(k => `<option value="${k}">${regLabel(k)}</option>`).join('');
    rg.value = st.region;
    rg.addEventListener('change', () => { st.region = rg.value; render(); });

    const f = document.getElementById('c-from'), t2 = document.getElementById('c-to');
    [f, t2].forEach(r => { r.min = E.y0; r.max = E.y1; r.step = 10; });
    f.value = st.y0; t2.value = st.y1;
    const upd = () => {
      let a = +f.value, b = +t2.value;
      if (a > b) { if (document.activeElement === f) b = a; else a = b; f.value = a; t2.value = b; }
      st.y0 = a; st.y1 = b;
      document.getElementById('c-from-v').textContent = a; document.getElementById('c-to-v').textContent = b;
      render();
    };
    f.addEventListener('input', upd); t2.addEventListener('input', upd);

    const tp = document.getElementById('c-top');
    tp.value = String(st.topPct);
    tp.addEventListener('change', () => { st.topPct = +tp.value; render(); });

    const pop = document.getElementById('c-pop');
    pop.value = st.minPop;
    const updp = () => { st.minPop = +pop.value; document.getElementById('c-pop-v').textContent = st.minPop === 0 ? T('sin mín.', 'no min') : st.minPop + 'M'; render(); };
    pop.addEventListener('input', updp);

    document.getElementById('c-from-v').textContent = st.y0;
    document.getElementById('c-to-v').textContent = st.y1;
    document.getElementById('c-pop-v').textContent = st.minPop + 'M';
  }

  wire();
  render();
})();
