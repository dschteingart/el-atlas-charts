// =============================================================
//  Especial partidos — Chart 5: flujos entre confederaciones
// =============================================================
// Cómo se reparten los partidos entre las 6 confederaciones. Dos vistas de lo
// mismo (toggle Cuerdas / Matriz), filtrables por período (slider) y por
// competencia (dropdown). El "aha": el ~86% se juega puertas adentro, PERO eso
// lo empujan las eliminatorias (98-100% intra); en el Mundial el 69% cruza.
// Datos: DATA_CHORD (flows por categoría y año; el cliente arma la matriz 6x6).
// Requiere d3 v7.

function fl_state() {
  if (!state[5]) state[5] = {};
  if (!Array.isArray(state[5].period)) state[5].period = [DATA_CHORD.y0, 2025];
  if (state[5].cat == null) state[5].cat = 'ALL';
  if (!state[5].view) state[5].view = 'chord';
  if (state[5].touched == null) state[5].touched = false;
  return state[5];
}

// matriz 6x6 (simétrica) para el período + competencia actuales
function fl_matrix() {
  const s = fl_state(), [a, b] = s.period, C = DATA_CHORD.confs.length;
  const M = Array.from({ length: C }, () => new Array(C).fill(0));
  const cats = s.cat === 'ALL' ? DATA_CHORD.flows.map((_, i) => i) : [+s.cat];
  const y0 = DATA_CHORD.y0, pairs = DATA_CHORD.pairs;
  cats.forEach(ci => {
    (DATA_CHORD.flows[ci] || []).forEach(row => {
      const y = y0 + row[0]; if (y < a || y > b) return;
      for (let k = 0; k < pairs.length; k++) {
        const v = row[k + 1]; if (!v) continue;
        const i = pairs[k][0], j = pairs[k][1];
        M[i][j] += v; if (i !== j) M[j][i] += v;
      }
    });
  });
  return M;
}
// total real (cada partido una vez), intra y cruces
function fl_stats(M) {
  const C = M.length; let total = 0, intra = 0;
  for (let i = 0; i < C; i++) for (let j = i; j < C; j++) { total += M[i][j]; if (i === j) intra += M[i][j]; }
  return { total, intra, cross: total - intra };
}
function fl_catName(k) { return pc_catNameSafe(k); }
function pc_catNameSafe(k) { return (typeof t === 'function' ? t('c6-cat-' + k) : '') || DATA_CHORD.cats[k]; }
function fl_confName(i) { return t('conf.' + DATA_CHORD.confs[i]); }

// texto del tooltip de un par (cinta del chord y celda de la matriz). Criterio
// ÚNICO para intra e inter: encabezado · cantidad de partidos · % del total ·
// % de su tipo (de lo que se juega puertas adentro, o de los cruces).
function fl_pairTip(i, j, M, st) {
  const v = M[i][j], p = q => (q < 10 ? q.toFixed(1) : q.toFixed(0));
  const pctTotal = st.total ? v / st.total * 100 : 0;
  const head = i === j ? `${fl_confName(i)} · ${t('c5-within')}` : `${fl_confName(i)} ↔ ${fl_confName(j)}`;
  const pctKind = i === j ? (st.intra ? v / st.intra * 100 : 0) : (st.cross ? v / st.cross * 100 : 0);
  const kindLbl = i === j ? t('c5-of-intra') : t('c5-of-cross');
  return `<div style="font-weight:600;margin-bottom:2px;">${head}</div>`
    + `<div>${fmt(v)} ${t('c5-tt-partidos')}</div>`
    + `<div style="opacity:.7;">${p(pctTotal)}% ${t('c5-of-total')} · ${p(pctKind)}% ${kindLbl}</div>`;
}

// ---- dimensiones (altura adaptada al viewport en desktop, como en duelos) ----
function fl_dims(svg) {
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  let W = 1100, H = 560;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; W = f.vbW; H = editorFormat === 'square' ? 900 : f.vbH; }
  else if (mobile) { W = 1100; H = 980; }
  else {
    const wrap = svg.closest('.chart-svg-wrap');
    const cw = (wrap && wrap.clientWidth) || 1100;
    const top = wrap ? wrap.getBoundingClientRect().top : 240;
    const avail = window.innerHeight - top - 100;
    H = Math.max(380, Math.min(600, Math.round(W * avail / cw)));
  }
  return { W, H, editorFormat, mobile, bigFmt: !!editorFormat || mobile, isPng: !!editorFormat };
}

function drawFlujos() {
  const svg = document.getElementById('chart5');
  if (!svg || typeof d3 === 'undefined') return;
  svg.innerHTML = '';
  const s = fl_state();
  const d = fl_dims(svg);
  svg.setAttribute('viewBox', `0 0 ${d.W} ${d.H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, d.editorFormat);
  const M = fl_matrix(), st = fl_stats(M);
  if (!st.total) { fl_empty(svg, d); fl_applyHeadings(st); return; }
  if (s.view === 'matrix') fl_drawMatrix(svg, d, M, st);
  else fl_drawChord(svg, d, M, st);
  fl_applyHeadings(st);
}

function fl_empty(svg, d) {
  const NS = 'http://www.w3.org/2000/svg';
  const e = document.createElementNS(NS, 'text');
  e.setAttribute('x', d.W / 2); e.setAttribute('y', d.H / 2); e.setAttribute('text-anchor', 'middle');
  e.style.fontFamily = 'var(--sans)'; e.style.fontSize = '16px'; e.setAttribute('fill', 'var(--muted, #8a857c)');
  e.textContent = t('c5-empty') || 'No hay partidos para mostrar con estos filtros.';
  svg.appendChild(e);
}

// ---- tooltip compartido ----------------------------------------------------
function fl_tt() { return document.getElementById('tooltip5'); }
function fl_showTT(svg, ev, html) {
  const tt = fl_tt(); if (!tt) return;
  tt.innerHTML = html; tt.style.display = 'block'; tt.style.opacity = '1';
  const rc = svg.getBoundingClientRect();
  tt.style.left = (evClientX(ev) - rc.left + 14) + 'px';
  tt.style.top = (evClientY(ev) - rc.top + 12) + 'px';
}
function fl_hideTT() { const tt = fl_tt(); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

// ---- vista CUERDAS (chord) --------------------------------------------------
function fl_drawChord(svg, d, M, st) {
  const confs = DATA_CHORD.confs, bigFmt = d.bigFmt;
  const SIZES = bigFmt ? { label: 24, sub: 20 } : { label: 13, sub: 11 };
  // R limitado por DOS restricciones: la general (vertical) y la HORIZONTAL, para
  // que las etiquetas a las 3/9 (las más anchas, CONMEBOL/CONCACAF) entren en el
  // marco. Sin esto, en formato cuadrado/mobile (W≈H) R queda grande y la etiqueta
  // horizontal se salía del PNG. Regla de la casa: nunca texto fuera del marco.
  const _flMaxLw = Math.max(0, ...confs.map(c => (t('conf.' + c) || '').length * SIZES.label * 0.56));
  const _flArcGap = bigFmt ? 22 : 14, _flOff = Math.max(bigFmt ? 18 : 10, (Math.min(d.W, d.H) / 2) * 0.09), _flMrg = bigFmt ? 8 : 5;
  const R = Math.min(Math.min(d.W, d.H) / 2 - (bigFmt ? 110 : 74),
                     d.W / 2 - _flArcGap - _flOff - _flMaxLw - _flMrg);
  const cx = d.W / 2, cy = d.H / 2;
  // solo confederaciones con partidos en el filtro: sin esto, las que dan 0 meten
  // un arco de ancho cero y su etiqueta cae encima de la vecina (colisión).
  const act = []; for (let i = 0; i < confs.length; i++) if (M[i].reduce((a, v) => a + v, 0) > 0) act.push(i);
  const Mr = act.map(i => act.map(j => M[i][j]));      // matriz reducida (reindexada)
  const oi = k => act[k];                               // índice reducido -> original
  const chord = d3.chord().padAngle(0.045).sortSubgroups(d3.descending);
  const chords = chord(Mr);
  const arc = d3.arc().innerRadius(R).outerRadius(R + (bigFmt ? 22 : 14));
  const ribbon = d3.ribbon().radius(R - 1);
  const g = d3.select(svg).append('g').attr('transform', `translate(${cx},${cy})`);

  const ribbons = g.append('g').selectAll('path').data(chords).join('path')
    .attr('d', ribbon)
    .attr('fill', c => {
      const i = c.source.index, j = c.target.index;
      if (i === j) return CONF_FIFA_COLORS[confs[oi(i)]];
      const si = Mr[i].reduce((a, v) => a + v, 0), sj = Mr[j].reduce((a, v) => a + v, 0);
      return CONF_FIFA_COLORS[confs[oi(si >= sj ? i : j)]];
    })
    .attr('fill-opacity', c => c.source.index === c.target.index ? 0.72 : 0.5)
    .attr('stroke', '#FAF8F3').attr('stroke-width', 0.6);

  // ángulos de etiqueta anti-colisión: parten del centro de cada arco y, si
  // dos quedan muy juntas (arcos chicos apilados), se separan por relajación
  // simétrica (empuja ambas alrededor del centro del cluster, no hacia un lado).
  // La separación mínima es mayor cerca de arriba/abajo, donde las etiquetas son
  // horizontales y anchas (CONMEBOL, CONCACAF) y se tocan aunque el ángulo alcance.
  const arcOut = R + (bigFmt ? 22 : 14);
  // radio de etiqueta PROPORCIONAL a R: con un offset fijo, en el PNG (R grande)
  // las etiquetas quedaban pegadas al diagrama (proporcionalmente más cerca).
  const labelR = arcOut + Math.max(bigFmt ? 18 : 10, R * 0.09);
  const TWO = Math.PI * 2;
  const anchorOf = a => { const n = ((a % TWO) + TWO) % TWO; return (n > Math.PI * 0.04 && n < Math.PI * 0.96) ? 'start' : (n > Math.PI * 1.04 && n < Math.PI * 1.96) ? 'end' : 'middle'; };

  // anti-colisión de etiquetas por ANCHO REAL: separa dos etiquetas solo cuando
  // de verdad se pisan (no un gap angular fijo, que descentraba a las que no
  // colisionaban). ext(k) = medio-tamaño de la etiqueta en la dirección tangente
  // (usa el ancho cerca de arriba/abajo, el alto cerca de los costados).
  const la0 = chords.groups.map(gp => (gp.startAngle + gp.endAngle) / 2);
  const la = la0.slice();
  const lw = chords.groups.map(gp => (t('conf.' + confs[oi(gp.index)]) || '').length * SIZES.label * 0.56);
  const lh = SIZES.label, pad = bigFmt ? 10 : 5;
  const ext = k => (lw[k] / 2) * Math.abs(Math.cos(la[k])) + (lh / 2) * Math.abs(Math.sin(la[k]));
  const idx = la.map((_, k) => k).sort((x, y) => la[x] - la[y]);
  for (let iter = 0; iter < 60; iter++) {
    for (let n = 0; n < idx.length; n++) {
      const a = idx[n], b = idx[(n + 1) % idx.length];
      let gap = la[b] - la[a]; if (n === idx.length - 1) gap += TWO;   // par que cruza el 0/2π
      const need = (ext(a) + ext(b) + pad) / labelR;
      if (gap < need) { const push = (need - gap) / 2; la[a] -= push; la[b] += push; }
    }
  }

  // líneas guía para las etiquetas que se corrieron de su arco: el hilo termina en
  // el EXTREMO de la etiqueta que mira al arco (si se corrió a la derecha, su borde
  // izquierdo; si a la izquierda, el derecho), no en su centro.
  const NSl = 'http://www.w3.org/2000/svg', leadG = g.append('g');
  chords.groups.forEach(gp => {
    const k = gp.index; if (Math.abs(la[k] - la0[k]) < 0.04) return;
    const sx = Math.cos(la[k] - Math.PI / 2) * labelR, sy = Math.sin(la[k] - Math.PI / 2) * labelR;
    const anch = anchorOf(la[k]), w = lw[k];
    const leftX = anch === 'start' ? sx : (anch === 'end' ? sx - w : sx - w / 2);
    const rightX = anch === 'start' ? sx + w : (anch === 'end' ? sx : sx + w / 2);
    const nearX = (la[k] > la0[k]) ? leftX : rightX;   // extremo que mira al arco
    const a0 = la0[k] - Math.PI / 2;
    const ln = document.createElementNS(NSl, 'line');
    ln.setAttribute('x1', Math.cos(a0) * (arcOut + 2)); ln.setAttribute('y1', Math.sin(a0) * (arcOut + 2));
    ln.setAttribute('x2', nearX); ln.setAttribute('y2', sy + (bigFmt ? 3 : 2));
    ln.setAttribute('stroke', '#B7B1A6'); ln.setAttribute('stroke-width', bigFmt ? 1.4 : 0.9);
    leadG.node().appendChild(ln);
  });

  const groups = g.append('g').selectAll('g').data(chords.groups).join('g');
  groups.append('path').attr('d', arc)
    .attr('fill', gp => CONF_FIFA_COLORS[confs[oi(gp.index)]])
    .attr('stroke', '#FAF8F3').attr('stroke-width', 1).style('cursor', 'default');
  groups.append('text')
    .attr('transform', gp => { const a = la[gp.index] - Math.PI / 2; return `translate(${Math.cos(a) * labelR},${Math.sin(a) * labelR})`; })
    .attr('text-anchor', gp => anchorOf(la[gp.index]))
    .attr('dy', 4).attr('font-family', 'var(--sans)').attr('font-weight', 700).style('font-size', SIZES.label + 'px')
    .attr('fill', gp => CONF_FIFA_LABEL_COLORS[confs[oi(gp.index)]])
    .attr('paint-order', 'stroke').attr('stroke', '#FAF8F3').attr('stroke-width', bigFmt ? 5 : 3)
    .text(gp => t('conf.' + confs[oi(gp.index)]));

  // % puertas adentro, dinámico, en el centro
  const pct = st.total ? Math.round(100 * st.intra / st.total) : 0;
  d3.select(svg).append('text').attr('x', cx).attr('y', cy - (bigFmt ? 10 : 5)).attr('text-anchor', 'middle')
    .attr('font-family', 'var(--serif)').attr('font-weight', 700).style('font-size', (bigFmt ? 58 : 34) + 'px')
    .attr('fill', '#1A1A1A').text(pct + '%');
  d3.select(svg).append('text').attr('x', cx).attr('y', cy + (bigFmt ? 26 : 15)).attr('text-anchor', 'middle')
    .attr('font-family', 'var(--sans)').style('font-size', SIZES.sub + 'px').attr('fill', '#4A4A4A')
    .text(t('c5-center-lbl') || 'puertas adentro');

  if (d.isPng) return;
  ribbons.on('mouseenter', function (ev, c) {
    ribbons.style('opacity', x => x === c ? 1 : 0.08);
    fl_showTT(svg, ev, fl_pairTip(oi(c.source.index), oi(c.target.index), M, st));
  }).on('mousemove', function (ev) { const tt = fl_tt(); if (tt && tt.style.display === 'block') fl_showTT(svg, ev, tt.innerHTML); })
    .on('mouseleave', () => { ribbons.style('opacity', ''); fl_hideTT(); });
  groups.on('mouseenter', function (ev, gp) {
    const i = gp.index; ribbons.style('opacity', x => (x.source.index === i || x.target.index === i) ? 1 : 0.08);
    fl_showTT(svg, ev, fl_arcTip(oi(i), M, st));
  }).on('mousemove', function (ev) { const tt = fl_tt(); if (tt && tt.style.display === 'block') fl_showTT(svg, ev, tt.innerHTML); })
    .on('mouseleave', () => { ribbons.style('opacity', ''); fl_hideTT(); });
}

// tooltip de una confederación: total, % puertas adentro y principal socio externo
function fl_arcTip(i, M, st) {
  const tot = M[i].reduce((a, v) => a + v, 0), own = M[i][i];
  let bj = -1, bv = -1;
  for (let j = 0; j < M.length; j++) if (j !== i && M[i][j] > bv) { bv = M[i][j]; bj = j; }
  let html = `<div style="font-weight:600;margin-bottom:2px;">${fl_confName(i)} · ${t('conf-long.' + DATA_CHORD.confs[i])}</div>`
    + `<div>${fmt(fl_stats0(M, i))} ${t('c5-tt-partidos') || 'partidos'} · ${tot ? Math.round(100 * own / tot) : 0}% ${t('c5-tt-intra')}</div>`;
  if (bj >= 0 && bv > 0) html += `<div style="margin-top:4px;padding-top:3px;border-top:1px solid rgba(255,255,255,.18);opacity:.85;">${t('c5-partner') || 'Principal socio externo'}: <strong>${fl_confName(bj)}</strong> (${fmt(bv)})</div>`;
  return html;
}
// partidos reales de la confederación i (intra una vez + cruces)
function fl_stats0(M, i) { let s = M[i][i]; for (let j = 0; j < M.length; j++) if (j !== i) s += M[i][j]; return s; }

// ---- vista MATRIZ (heatmap 6x6) --------------------------------------------
function fl_drawMatrix(svg, d, M, st) {
  const confs = DATA_CHORD.confs, C = confs.length, bigFmt = d.bigFmt, NS = 'http://www.w3.org/2000/svg';
  const fs = bigFmt ? 22 : 13, labW = bigFmt ? 220 : 128, headH = bigFmt ? 40 : 26;
  const padL = labW, padT = headH + (bigFmt ? 20 : 12), padR = bigFmt ? 40 : 24, padB = bigFmt ? 30 : 18;
  const cell = Math.min((d.W - padL - padR) / C, (d.H - padT - padB) / C);
  const gridW = cell * C, gridH = cell * C;
  const ox = (d.W - gridW - labW) / 2 + labW;   // centrar la grilla (con espacio para labels a la izq)
  const oy = padT + Math.max(0, (d.H - padT - padB - gridH) / 2);

  let maxCross = 1; for (let i = 0; i < C; i++) for (let j = 0; j < C; j++) if (i !== j && M[i][j] > maxCross) maxCross = M[i][j];
  const ramp = d3.interpolateRgb('#F1E7D6', '#7A2A3F');
  const g = d3.select(svg).append('g');
  const mk = (x, y, txt, opt) => {
    const e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('dy', '0.35em');
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((opt && opt.fs) || fs) + 'px';
    if (opt && opt.anchor) e.setAttribute('text-anchor', opt.anchor); if (opt && opt.weight) e.style.fontWeight = opt.weight;
    e.setAttribute('fill', (opt && opt.fill) || 'var(--ink)'); e.textContent = txt; svg.appendChild(e); return e;
  };
  // labels de columnas (arriba) y filas (izquierda), coloreadas por confederación
  for (let i = 0; i < C; i++) {
    mk(ox + i * cell + cell / 2, oy - (bigFmt ? 16 : 10), t('conf.' + confs[i]), { anchor: 'middle', weight: 700, fill: CONF_FIFA_LABEL_COLORS[confs[i]], fs: bigFmt ? 18 : 11.5 });
    mk(ox - (bigFmt ? 12 : 7), oy + i * cell + cell / 2, t('conf.' + confs[i]), { anchor: 'end', weight: 700, fill: CONF_FIFA_LABEL_COLORS[confs[i]], fs: bigFmt ? 18 : 11.5 });
  }
  const hover = !d.isPng;
  for (let i = 0; i < C; i++) for (let j = 0; j < C; j++) {
    const v = M[i][j], x = ox + j * cell, y = oy + i * cell;
    const diag = i === j;
    const intensity = diag ? 1 : Math.sqrt(v / maxCross);
    const bg = diag ? CONF_FIFA_COLORS[confs[i]] : ramp(intensity);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x + 1.5); rect.setAttribute('y', y + 1.5); rect.setAttribute('width', cell - 3); rect.setAttribute('height', cell - 3);
    rect.setAttribute('rx', bigFmt ? 5 : 3); rect.setAttribute('fill', bg); rect.setAttribute('fill-opacity', diag ? 0.9 : (v ? 1 : 0.35));
    svg.appendChild(rect);
    if (v) {
      const dark = diag || intensity > 0.55;
      mk(x + cell / 2, y + cell / 2, fmt(v), { anchor: 'middle', weight: diag ? 700 : 600, fill: dark ? '#fff' : '#3a3630', fs: cell < (bigFmt ? 70 : 42) ? (bigFmt ? 16 : 11) : fs });
    }
    if (hover) {
      rect.style.cursor = 'default';
      rect.addEventListener('mouseenter', (ev) => { rect.setAttribute('stroke', '#33312C'); rect.setAttribute('stroke-width', 2); fl_showTT(svg, ev, fl_pairTip(i, j, M, st)); });
      rect.addEventListener('mousemove', (ev) => fl_showTT(svg, ev, fl_pairTip(i, j, M, st)));
      rect.addEventListener('mouseleave', () => { rect.removeAttribute('stroke'); rect.removeAttribute('stroke-width'); fl_hideTT(); });
    }
  }
  // leyenda: diagonal = puertas adentro; fuera = entre confederaciones. En el PNG
  // NO va acá (el compositor pega las fuentes justo abajo y chocan): se pliega a
  // la línea de fuentes en onBeforePngExportGetSourceText.
  if (!d.isPng) mk(ox, oy + gridH + (bigFmt ? 26 : 15), (t('c5-matrix-note') || 'Diagonal: puertas adentro. Fuera de la diagonal: entre dos confederaciones.'), { anchor: 'start', fill: 'var(--ink-soft, #6b6559)', fs: bigFmt ? 15 : 10.5 });
}

// ---- títulos / subtítulo (dinámico, apto para PNG) --------------------------
function fl_subtitle() {
  const s = fl_state(), [a, b] = s.period, st = fl_stats(fl_matrix());
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const pct = st.total ? Math.round(100 * st.intra / st.total) : 0;
  const lead = s.cat === 'ALL' ? '' : fl_catName(+s.cat) + '. ';
  return lang === 'en'
    ? `${lead}Of ${fmt(st.total)} matches, ${pct}% were played within a single confederation (${a}–${b}).`
    : `${lead}De ${fmt(st.total)} partidos, ${pct}% se jugaron dentro de una misma confederación (${a}–${b}).`;
}
function fl_applyHeadings() {
  const s = fl_state();
  const pristine = !s.touched && s.cat === 'ALL' && s.period[0] === DATA_CHORD.y0 && s.period[1] === 2025;
  atlasSetHeading('5', pristine, { title: 'c5-title', titleNeutral: 'c5-title-neutral' });
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[lang]) || {};
  const subEl = (document.querySelector('.chart-block[data-chart="5"]') || document).querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = fl_subtitle();
}

// ---- controles --------------------------------------------------------------
function fl_updateSlider() {
  const s = fl_state();
  const f = document.getElementById('fl-slider-from'), tt = document.getElementById('fl-slider-to');
  const disp = document.getElementById('fl-range-display'), tr = document.getElementById('fl-range-track-active');
  if (!f || !tt) return;
  f.value = s.period[0]; tt.value = s.period[1];
  if (disp) disp.textContent = `${s.period[0]}–${s.period[1]}`;
  if (tr) { const mn = +f.min, mx = +f.max, sp = mx - mn; if (sp > 0) { tr.style.left = ((s.period[0] - mn) / sp * 100) + '%'; tr.style.right = ((mx - s.period[1]) / sp * 100) + '%'; } }
}
function fl_setupTabs() {
  const cb = document.getElementById('fl-tab-chord'), mb = document.getElementById('fl-tab-matrix');
  if (!cb || !mb) return;
  const go = v => { const s = fl_state(); if (s.view === v) return; s.view = v; s.touched = true; sync(); drawFlujos(); };
  function sync() { const v = fl_state().view; cb.classList.toggle('active', v === 'chord'); mb.classList.toggle('active', v === 'matrix'); }
  cb.addEventListener('click', () => go('chord')); mb.addEventListener('click', () => go('matrix')); sync();
}
function fl_setupCat() {
  const sel = document.getElementById('fl-cat-select'); if (!sel) return;
  sel.value = String(fl_state().cat);
  sel.addEventListener('change', () => { const s = fl_state(); s.cat = sel.value === 'ALL' ? 'ALL' : +sel.value; s.touched = true; drawFlujos(); });
}
function fl_setupSlider() {
  const f = document.getElementById('fl-slider-from'), tt = document.getElementById('fl-slider-to'); if (!f || !tt) return;
  const MINW = 3;
  f.addEventListener('input', () => { const s = fl_state(); let a = +f.value; if (a > s.period[1] - MINW) a = s.period[1] - MINW; s.period[0] = a; s.touched = true; fl_updateSlider(); drawFlujos(); });
  tt.addEventListener('input', () => { const s = fl_state(); let b = +tt.value; if (b < s.period[0] + MINW) b = s.period[0] + MINW; s.period[1] = b; s.touched = true; fl_updateSlider(); drawFlujos(); });
  fl_updateSlider();
}

function setupFlujosCSV() {
  document.querySelectorAll('button.download[data-chart="5-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const M = fl_matrix(), confs = DATA_CHORD.confs, s = fl_state();
    let csv = `conf_a,conf_b,partidos  (periodo ${s.period[0]}-${s.period[1]}, ${s.cat === 'ALL' ? 'todas' : DATA_CHORD.cats[s.cat]})\n`;
    for (let i = 0; i < confs.length; i++) for (let j = i; j < confs.length; j++) csv += `${confs[i]},${confs[j]},${M[i][j]}\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-flujos.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initFlujos() {
  fl_state();
  fl_setupTabs(); fl_setupCat(); fl_setupSlider();
  drawFlujos();
  setupFlujosCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initFlujos._wired) {
    initFlujos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawFlujos());
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawFlujos, 200); });
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawFlujos;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '5') return null;
    let src = (typeof t === 'function' ? t('c5-sources-tpl') : '') || '';
    // en la vista matriz, la leyenda "Diagonal…" no se dibuja en el SVG (chocaría
    // con el footer compuesto): la ponemos al frente de la línea de fuentes.
    if (fl_state().view === 'matrix') src = (t('c5-matrix-note') || '') + ' ' + src;
    return src || null;
  };
  window.onBeforePngExportGetSubtitle = function (chartId) { return String(chartId) === '5' ? fl_subtitle() : null; };
}
