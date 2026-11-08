// Creencia en Dios, América Latina contra Europa occidental (Integrated Values Surveys, 1990-2022). Port interactivo
// del PNG aprobado g17_creencia_trayectorias: cada país con una encuesta en 1989-1999 y otra en 2017-2022 es una línea;
// los elegidos van gruesos y con etiqueta al final (brLines, rel-motor.js), el resto queda de fondo, tenue, con el color
// de su región. Recuadro "Cambio típico" abajo a la izquierda: mediana, por región, del cambio entre la primera y la
// última encuesta de TODOS los países de la región (no depende de los chips: esos países siempre están dibujados).
// Se recalcula para las regiones a la vista: la leyenda (dentro del SVG, así viaja al PNG) resalta una región al pasar
// y la apaga con un clic (nunca las dos), y el recuadro muestra solo las que quedan.
// Interacciones: buscador + chips de la casa (color de la región, Limpiar), hover/tap en una línea elegida o en su
// etiqueta la resalta, crosshair que snapea a la encuesta más cercana (tolerancia de 4 años, año real en gris) con
// wireTouchScrub; una línea de fondo se resalta al pasar, muestra sus encuestas y con un clic (en escritorio) se suma
// a la selección. Vista compartible: ?paises=URY~CHL (- = selección vacía)&ocultas=WE.
// Datos: REL_CREENCIA (data-creencia.js).
const CCRE_ID = 'creencia';
const CCRE_REG = {
  LA: { color: '#BE5D32', label: '#8B3F1E', dark: '#CC693D' },
  WE: { color: '#658499', label: '#3E5C72', dark: '#6B899D' }
};
// los destacados del PNG aprobado
const CCRE_DEF = ['URY', 'CHL', 'ARG', 'MEX', 'BRA', 'NLD', 'SWE', 'GBR', 'FRA', 'ESP', 'ITA'];
const CCRE_X = [1989, 2023], CCRE_Y = [30, 101];
let ccre_urlWired = false, ccre_selector = null, ccre_bgKey = null;

function ccre_state() { if (!state[CCRE_ID]) state[CCRE_ID] = { sel: CCRE_DEF.slice(), hid: [] }; return state[CCRE_ID]; }
function ccre_isDefault(s) { return brSameList(s.sel, CCRE_DEF) && !s.hid.length; }
function ccre_reg(k) { const d = REL_CREENCIA.paises[k]; return d ? d.r : null; }
function ccre_vis(s, k) { return s.hid.indexOf(ccre_reg(k)) < 0; }
function ccre_regName(r) { return t('ccre-reg-' + r); }
function ccre_universe() {
  return Object.keys(REL_CREENCIA.paises).map(k => ({ key: k, label: br_name(k), tag: ccre_regName(ccre_reg(k)) }))
    .sort((a, b) => a.label.localeCompare(b.label, br_lang()));
}
// período del dato real de las regiones a la vista (los países de fondo también están dibujados)
function ccre_period(s) {
  const ys = [];
  Object.keys(REL_CREENCIA.paises).forEach(k => { if (ccre_vis(s, k)) REL_CREENCIA.paises[k].p.forEach(p => ys.push(p[0])); });
  return ys.length ? Math.min.apply(null, ys) + '-' + Math.max.apply(null, ys) : '';
}
function ccre_median(a) {
  const v = a.slice().sort((x, y) => x - y), n = v.length;
  return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}
// cambio típico de una región: mediana de (última - primera encuesta) entre sus países
function ccre_change(r) {
  return ccre_median(Object.keys(REL_CREENCIA.paises).filter(k => ccre_reg(k) === r).map(k => {
    const p = REL_CREENCIA.paises[k].p; return p[p.length - 1][1] - p[0][1];
  }));
}
function ccre_changeText(r) {
  const v = Math.round(ccre_change(r));
  const num = (v > 0 ? '+' : v < 0 ? '−' : '') + br_fmt(Math.abs(v), 0);
  return t('ccre-box-row').replace('{R}', ccre_regName(r)).replace('{V}', num).replace('{U}', t(Math.abs(v) === 1 ? 'ccre-punto' : 'ccre-puntos'));
}

// Resaltado de una región entera (hover en la leyenda): sus líneas, puntos y etiquetas plenos; el resto, atenuado.
function ccre_emphReg(svg, r) {
  svg.querySelectorAll('[data-k]').forEach(el => {
    el.style.opacity = (r == null || ccre_reg(el.getAttribute('data-k')) === r) ? '' : '0.15';
  });
}

// Leyenda de regiones dentro del SVG (como el PNG aprobado): muestra de línea + nombre. En pantalla, hover resalta la
// región y un clic la apaga o la prende (apagada: tenue y tachada, patrón rk-leg-off del N°4). En el PNG, solo las
// regiones a la vista. Devuelve el alto que ocupa.
function ccre_legend(svg, L, y0, s, onToggle) {
  const S = L.S, fs = Math.max(S.tick, S.ann + 1), sw = L.big ? 34 : 20, gapI = L.big ? 12 : 7, gap = L.big ? 34 : 20;
  const rowH = fs * 1.5;
  let x = 0, row = 0;
  REL_CREENCIA.regiones.forEach(r => {
    const off = s.hid.indexOf(r) >= 0;
    if (off && !L.interactive) return;
    const label = ccre_regName(r), w = sw + gapI + br_measure(label, fs, 400);
    if (x + w > L.W && x > 0) { x = 0; row++; }
    const cy = y0 + row * rowH + rowH / 2;
    const g = br_el('g', { 'data-leg': r }); svg.appendChild(g);
    g.appendChild(br_el('line', { x1: x, x2: x + sw, y1: cy, y2: cy, stroke: off ? BR_C.rule : CCRE_REG[r].color, 'stroke-width': L.big ? 5 : 3, 'stroke-linecap': 'round' }));
    const tx = br_text(g, x + sw + gapI, cy, label, { size: fs, fill: BR_C.soft, base: 'central' });
    if (off) { g.setAttribute('opacity', 0.38); tx.setAttribute('text-decoration', 'line-through'); }
    if (L.interactive) {
      // área de toque del ítem entero (el texto solo es un blanco chico)
      const hit = br_el('rect', { x: x - 4, y: cy - rowH / 2, width: w + 8, height: rowH, fill: 'transparent' });
      g.appendChild(hit);
      g.style.cursor = 'pointer';
      g.addEventListener('mouseenter', () => { if (!off) ccre_emphReg(svg, r); });
      g.addEventListener('mouseleave', () => ccre_emphReg(svg, null));
      g.addEventListener('click', () => onToggle(r));
    }
    x += w + gap;
  });
  // selección vacía (legítima: los defaults no resucitan) → invitación, a la derecha de la leyenda
  if (L.interactive && !s.sel.length) {
    const msg = t('ccre-vacio'), mw = br_measure(msg, S.ann, 400);
    if (x + mw > L.W && x > 0) { x = 0; row++; }
    br_text(svg, x, y0 + row * rowH + rowH / 2, msg, { size: S.ann, fill: BR_C.muted, base: 'central', italic: true });
  }
  return (row + 1) * rowH;
}

function ccre_bgTipHTML(k) {
  const d = REL_CREENCIA.paises[k];
  let h = '<strong>' + br_name(k) + '</strong><div class="tt-region" style="color:' + CCRE_REG[d.r].dark + '">' + ccre_regName(d.r) + '</div>';
  d.p.forEach(p => { h += '<div class="tt-row"><span>' + p[0] + '</span><span>' + br_fmt(p[1], 1) + '%</span></div>'; });
  if (HAS_HOVER) h += '<div class="tt-year">' + t('ccre-tt-add') + '</div>';
  return h;
}

function drawCcre() {
  const s = ccre_state(), svg = document.getElementById('chart' + CCRE_ID);
  if (!svg) return;
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  const neutral = s.hid.indexOf('WE') >= 0 ? 'ccre-title-neutral-LA' : s.hid.indexOf('LA') >= 0 ? 'ccre-title-neutral-WE' : 'ccre-title-neutral';
  atlasSetHeading(CCRE_ID, ccre_isDefault(s), { title: 'ccre-title', titleNeutral: neutral });
  const P = ccre_period(s);
  brSetSubtitle(CCRE_ID, t('ccre-sub').replace('{P}', P));
  const L = rel_layout(CCRE_ID), S = L.S, big = L.big;
  br_prepSvg(svg, L); br_clearHover(svg);
  ccre_bgKey = null;
  const tip = document.getElementById('tooltip' + CCRE_ID);
  br_tipHide(tip);
  const legY = L.png ? 14 : 0;   // en el PNG, aire entre el subtítulo y la leyenda
  const legH = ccre_legend(svg, L, legY, s, (r) => {
    const i = s.hid.indexOf(r);
    if (i >= 0) s.hid.splice(i, 1);
    else if (s.hid.length + 1 < REL_CREENCIA.regiones.length) s.hid.push(r);   // nunca las dos regiones apagadas
    else return;
    ccre_selector.render(); drawCcre();
  });
  const top = legY + legH + (L.png ? 26 : big ? 14 : 8);
  const box = { x: 0, y: top, w: L.W, h: L.H - top };
  const sel = s.sel.filter(k => REL_CREENCIA.paises[k] && ccre_vis(s, k));
  const series = sel.map(k => {
    const r = ccre_reg(k);
    return { key: k, label: br_name(k), color: CCRE_REG[r].color, labelColor: CCRE_REG[r].label, dots: true,
             pts: REL_CREENCIA.paises[k].p.map(p => [p[0], p[1]]) };
  });
  const n0 = svg.children.length;
  const res = brLines({
    svg, id: CCRE_ID, L, box, series, x0: CCRE_X[0], x1: CCRE_X[1], yMin: CCRE_Y[0], yMax: CCRE_Y[1],
    yTicks: [40, 60, 80, 100], xTicks: [1990, 2000, 2010, 2020], yFmt: (v) => br_fmt(v, 0) + '%',
    tol: 4, ttDec: 1, ttSuffix: '%'
  });
  // grupos de brLines (modo box): grilla, bandas, halos, líneas, puntos, hit, etiquetas, [crosshair]
  const kids = Array.prototype.slice.call(svg.children, n0);
  // (1) países de fondo, debajo de las líneas elegidas: tenues, con el color de su región
  const bg = br_el('g');
  svg.insertBefore(bg, kids[1] || null);
  const bgW = big ? 1.8 : 1.1, bgR = big ? 3 : 1.8;
  Object.keys(REL_CREENCIA.paises).forEach(k => {
    if (sel.indexOf(k) >= 0 || !ccre_vis(s, k)) return;
    const c = CCRE_REG[ccre_reg(k)].color, p = REL_CREENCIA.paises[k].p;
    const d = p.map((q, i) => (i ? 'L' : 'M') + res.xS(q[0]).toFixed(1) + ',' + res.yS(q[1]).toFixed(1)).join(' ');
    const ln = br_el('path', { d, fill: 'none', stroke: c, 'stroke-width': bgW, 'stroke-opacity': 0.45, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'data-k': k, 'data-base-w': bgW });
    ln.classList.add('br-line');
    bg.appendChild(ln);
    p.forEach(q => bg.appendChild(br_el('circle', { cx: res.xS(q[0]), cy: res.yS(q[1]), r: bgR, fill: c, 'fill-opacity': 0.45, 'data-k': k })));
    if (!L.interactive) return;
    const hit = br_el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': big ? 16 : 10 });
    hit.style.cursor = HAS_HOVER ? 'pointer' : 'default';
    const lit = (on) => { ln.setAttribute('stroke-opacity', on ? 0.95 : 0.45); br_emph(svg, on ? k : null); };
    hit.addEventListener('mouseenter', (ev) => {
      ccre_bgKey = k; lit(true);
      if (!tip) return;
      tip.innerHTML = ccre_bgTipHTML(k); tip.style.display = 'block'; tip.style.opacity = '1'; tip.__brOwner = 'bg';
      br_tipPlace(tip, ev, 'line');
    });
    hit.addEventListener('mousemove', (ev) => { if (tip && tip.__brOwner === 'bg') br_tipPlace(tip, ev, 'line'); });
    hit.addEventListener('mouseleave', () => { if (ccre_bgKey === k) ccre_bgKey = null; lit(false); if (tip && tip.__brOwner === 'bg') br_tipHide(tip); });
    // en el celular el tap muestra el dato y no cambia la selección (para elegir está el buscador)
    if (HAS_HOVER) hit.addEventListener('click', () => { ccre_bgKey = null; br_tipHide(tip); ccre_add(k); });
    bg.appendChild(hit);
  });
  // sobre una línea de fondo manda su tooltip; el crosshair de las elegidas se calla (con el dedo, el arrastre lo
  // retoma: wireTouchScrub no pasa por mouseleave)
  if (svg.__brPanels && svg.__brPanels.length) {
    const pan = svg.__brPanels[0], orig = pan.move;
    pan.move = (ev) => {
      if (ev.type && ev.type.indexOf('touch') === 0) { if (ccre_bgKey) { br_emph(svg, null); bg.querySelectorAll('.br-line').forEach(x => x.setAttribute('stroke-opacity', 0.45)); ccre_bgKey = null; } orig(ev); return; }
      if (ccre_bgKey) { pan.leave(); return; }
      orig(ev);
    };
  }
  // (2) recuadro "Cambio típico" abajo a la izquierda, solo con las regiones a la vista
  const fsB = S.tick, lh = fsB * 1.45;   // como el PNG aprobado: del tamaño de los ejes
  const rows = [{ text: t('ccre-box-head'), fill: BR_C.ink }].concat(
    REL_CREENCIA.regiones.filter(r => s.hid.indexOf(r) < 0).map(r => ({ text: ccre_changeText(r), fill: CCRE_REG[r].label })));
  const boxG = br_el('g', { 'pointer-events': 'none' });
  svg.insertBefore(boxG, kids[7] || null);
  const by0 = res.bottom - (big ? 18 : 10) - (rows.length - 1) * lh;
  rows.forEach((rw, i) => br_text(boxG, res.left + (big ? 16 : 9), by0 + i * lh, rw.text, { size: fsB, weight: 600, fill: rw.fill, halo: big ? 5 : 3 }));
  if (ccre_urlWired) atlasSyncUrlTodoONada({ paises: s.sel.length ? brList(s.sel) : '-', ocultas: brList(s.hid) }, { paises: brList(CCRE_DEF), ocultas: '' });
}
// sumar un país (clic en su línea de fondo o buscador): si su región estaba apagada, se prende
function ccre_add(k) {
  const s = ccre_state();
  if (s.sel.indexOf(k) < 0) s.sel.push(k);
  const i = s.hid.indexOf(ccre_reg(k)); if (i >= 0) s.hid.splice(i, 1);
  ccre_selector.render(); drawCcre();
}
function ccre_applyUrl() {
  const s = ccre_state();
  const up = (a) => a.map(k => k.toUpperCase()).filter((k, i, arr) => arr.indexOf(k) === i);
  const v = atlasUrlParam('paises');
  if (v != null) {
    const ks = brParseList(v, (k) => !!REL_CREENCIA.paises[k.toUpperCase()]);
    // '-' = selección vacía a propósito; una lista sin ningún código válido no pisa el default
    if (ks && (ks.length || v === '-')) s.sel = up(ks);
  }
  const o = atlasUrlParam('ocultas');
  if (o != null) {
    const hs = up(brParseList(o, (k) => REL_CREENCIA.regiones.indexOf(k.toUpperCase()) >= 0) || []);
    if (hs.length < REL_CREENCIA.regiones.length) s.hid = hs;   // nunca todas las regiones apagadas desde la URL
  }
  ccre_urlWired = true;
  ccre_selector.render();
  drawCcre();
}
function initCcre() {
  const s = ccre_state();
  ccre_selector = brSelector({
    pre: CCRE_ID, get: () => s.sel, onChange: drawCcre, focusAll: true,
    // un país de una región apagada vuelve a prender su región
    set: (a) => { a.forEach(k => { if (s.sel.indexOf(k) < 0) { const i = s.hid.indexOf(ccre_reg(k)); if (i >= 0) s.hid.splice(i, 1); } }); s.sel = a; },
    placeholderKey: 'ccre-search-ph', universe: ccre_universe, label: br_name,
    color: (k) => CCRE_REG[ccre_reg(k)].color, dim: (k) => !ccre_vis(s, k)
  });
  brRegister(CCRE_ID, drawCcre, () => t('ccre-png-source').replace('{P}', ccre_period(s)));
  brCsv('button.download[data-chart="' + CCRE_ID + '-csv"]', () => {
    const nm = (k, L) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? COUNTRY_NAMES[k][L] : k;
    const rows = [];
    Object.keys(REL_CREENCIA.paises).forEach(k => {
      const d = REL_CREENCIA.paises[k];
      d.p.forEach(p => rows.push([k, nm(k, 'es'), nm(k, 'en'), I18N.es['ccre-reg-' + d.r], I18N.en['ccre-reg-' + d.r], p[0], p[1], p[2]]));
    });
    return {
      headers: {
        es: ['codigo', 'pais', 'pais_en', 'region', 'region_en', 'anio', 'cree_en_dios_pct', 'encuesta'],
        en: ['code', 'country_es', 'country', 'region_es', 'region', 'year', 'believe_in_god_pct', 'survey']
      },
      rows, file: { es: 'el-atlas-religion-creencia-en-dios.csv', en: 'the-atlas-religion-belief-in-god.csv' }
    };
  });
  ccre_applyUrl();
}
function ccre_onLang() { ccre_selector.render(); drawCcre(); }
