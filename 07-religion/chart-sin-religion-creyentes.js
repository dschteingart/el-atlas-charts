// Creencia en Dios entre quienes no tienen religión (Integrated Values Surveys, última encuesta de cada país,
// 2016-2022): barras horizontales ordenadas de mayor a menor, cada una del color de su región; los nombres van en el
// color de etiqueta de su región (América Latina en terracota y seminegrita), como el PNG aprobado (g12).
//
// Análogo: la vista "Mi selección" del ranking de vecinos (04-intolerancia/ranking.js: rk_drawBars, rk_buildLegend,
// rk_showTooltip). Se portan sus interacciones: tooltip oscuro por barra, clic en la barra (escritorio) que saca al
// país, leyenda de regiones que atenúa al pasar el mouse y oculta la región al hacer clic. Además, la casa de hoy
// (CLAUDE.md): el resaltado atenúa el resto y responde también desde la etiqueta (fila entera como zona de toque),
// y el tap del celular muestra el tooltip sin sacar al país.
// Selector de la casa (rel-motor.js, brSelector): buscador + chips del color de la región + Limpiar; los 26 países
// del PNG son la selección de fábrica, vaciar es legítimo y los defaults no resucitan.
// Vista compartible TODO-O-NADA: ?paises=ARG~BRA (- = selección vacía) & ocultas=wEurope~eAsia (códigos de
// lib/regions.js). Datos: REL_SINREL (data-sin-religion-creyentes.js).
const CSINREL_ID = 'sinrel';
const CSINREL_DEF = REL_SINREL.def.slice();
let csinrel_urlWired = false, csinrel_selector = null;

function csinrel_state() {
  if (!state[CSINREL_ID]) state[CSINREL_ID] = { sel: CSINREL_DEF.slice(), ocultas: [] };
  return state[CSINREL_ID];
}
function csinrel_isDefault(s) { return brSameList(s.sel, CSINREL_DEF) && !s.ocultas.length; }
function csinrel_d(k) { return REL_SINREL.data[k]; }
function csinrel_reg(k) { return csinrel_d(k).r; }
function csinrel_name(k) { return br_name(k); }
// en el gráfico, el asterisco de la pregunta de pertenencia (Colombia, Ecuador, Uruguay)
function csinrel_ast(k) { return REL_SINREL.ast.indexOf(k) >= 0; }
function csinrel_label(k) { return csinrel_name(k) + (csinrel_ast(k) ? '*' : ''); }
function csinrel_regName(r) { return br_t('reg.' + r); }
function csinrel_color(r) { return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[r]) || BR_C.gris; }
function csinrel_labColor(r) { return (typeof REGION_LABEL_COLORS !== 'undefined' && REGION_LABEL_COLORS[r]) || BR_C.soft; }
// región ↔ código corto de la URL (lib/regions.js, REGION_CODE_TO_FULL)
function csinrel_regCode(r) { return Object.keys(REGION_CODE_TO_FULL).find(c => REGION_CODE_TO_FULL[c] === r) || r; }
function csinrel_orderIdx(k) { return REL_SINREL.orden.indexOf(k); }

// regiones con algún país elegido, en el orden de la casa
function csinrel_regions(s) {
  const pres = new Set(s.sel.filter(csinrel_d).map(csinrel_reg));
  return REGION_ORDER.filter(r => pres.has(r));
}
// barras visibles: la selección sin las regiones ocultas, de mayor a menor (empates: el orden del dato sin redondear)
function csinrel_rows(s) {
  const hid = new Set(s.ocultas);
  return s.sel.filter(k => csinrel_d(k) && !hid.has(csinrel_reg(k)))
    .sort((a, b) => (csinrel_d(b).v - csinrel_d(a).v) || (csinrel_orderIdx(a) - csinrel_orderIdx(b)));
}
// años de campo reales de lo que se ve (Haití 2016; el resto 2017-2022)
function csinrel_period(rows) {
  const ys = rows.map(k => csinrel_d(k).y);
  if (!ys.length) return '2016-2022';
  const a = Math.min.apply(null, ys), b = Math.max.apply(null, ys);
  return a === b ? String(a) : a + '-' + b;
}
function csinrel_pngSource() {
  const rows = csinrel_rows(csinrel_state());
  const txt = t('csinrel-png-source').replace('{P}', csinrel_period(rows));
  return rows.some(csinrel_ast) ? txt + ' ' + t('csinrel-png-ast') : txt;
}

// ---------------------------------------------------------------- resaltado (sin redibujar)
// fila: la apuntada plena y el resto atenuado (también desde la etiqueta); región: la de la leyenda plena
function csinrel_emph(svg, attr, val, op) {
  svg.querySelectorAll('[data-row]').forEach(g => { g.style.opacity = (val == null || g.getAttribute(attr) === val) ? '' : String(op); });
}
function csinrel_tipHTML(k) {
  const d = csinrel_d(k);
  const onDark = (typeof REGION_COLORS_ON_DARK !== 'undefined' && REGION_COLORS_ON_DARK[d.r]) || '#C9C2B2';
  let h = '<strong>' + csinrel_name(k) + '</strong>'
    + '<div class="tt-region" style="color:' + onDark + '">' + csinrel_regName(d.r) + '</div>';
  [[t('csinrel-tt-cree'), br_fmt(d.v, 1) + '%'], [t('csinrel-tt-enc'), d.s + ' ' + d.y], [t('csinrel-tt-n'), br_fmt(d.n, 0)]]
    .forEach(r => { h += '<div class="tt-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>'; });
  if (csinrel_ast(k)) h += '<div class="tt-year">' + t('csinrel-tt-ast') + '</div>';
  return h;
}

// ---------------------------------------------------------------- barras
function csinrel_bars(svg, rows, L) {
  const S = L.S, big = L.big, n = rows.length;
  const tip = document.getElementById('tooltip' + CSINREL_ID);
  // en pantalla el alto crece con las filas (la página se scrollea, como el ranking de vecinos); en el PNG, el hueco
  const slotScreen = L.mobile ? 52 : 26;
  const top = L.png ? 26 : big ? 12 : 8;
  const tickFs0 = S.tick;
  const bottomH = tickFs0 + (big ? 30 : 18);
  if (!L.fmt) L.H = Math.round(top + n * slotScreen + bottomH);
  const slot = (L.H - top - bottomH) / n;
  // el grosor del PNG aprobado; con pocos países el PNG reparte el alto entre las filas, pero las barras no engordan
  // más allá de un tope (brStackH)
  const barH = Math.min(slot * 0.68, big ? 64 : 30);
  // nombres: el calibre de la casa, salvo que la fila no les dé lugar (rk_drawBars: fitName)
  const fsName = Math.max(9, Math.min(S.label, Math.floor(slot * 0.88)));
  const fsVal = Math.max(8, Math.min(S.val, Math.round(fsName * 0.92)));
  const fsTick = Math.min(S.tick, Math.max(fsVal, 9));
  const gapL = big ? 14 : 8, gapV = big ? 10 : 6;
  const nameW = Math.max.apply(null, rows.map(k => br_measure(csinrel_label(k), fsName, csinrel_reg(k) === 'Latin America' ? 600 : 400)));
  const left = Math.ceil(nameW) + gapL + (big ? 4 : 2);
  const right = L.W - Math.ceil(br_measure('100%', fsVal, 500)) - gapV - (big ? 8 : 4);
  const plotB = top + n * slot;
  const xS = (v) => left + v / 100 * (right - left);
  br_prepSvg(svg, L);
  // grilla y eje (0-100 fijo: una selección distinta no cambia la escala)
  const gridG = br_el('g'); svg.appendChild(gridG);
  [0, 25, 50, 75, 100].forEach(v => {
    gridG.appendChild(br_el('line', { x1: xS(v), x2: xS(v), y1: top, y2: plotB, stroke: BR_C.grid, 'stroke-width': 1 }));
    br_text(gridG, xS(v), plotB + fsTick + (big ? 12 : 6), br_fmt(v, 0) + '%', { size: fsTick, anchor: 'middle' });
  });
  gridG.appendChild(br_el('line', { x1: left, x2: right, y1: plotB, y2: plotB, stroke: BR_C.rule, 'stroke-width': big ? 1.6 : 1 }));
  const barsG = br_el('g'), hitG = br_el('g');
  svg.appendChild(barsG); svg.appendChild(hitG);
  rows.forEach((k, i) => {
    const d = csinrel_d(k), la = d.r === 'Latin America';
    const cy = top + slot * i + slot / 2;
    const g = br_el('g', { 'data-row': k, 'data-reg': d.r }); barsG.appendChild(g);
    br_text(g, left - gapL, cy, csinrel_label(k), { size: fsName, weight: la ? 600 : 400, fill: csinrel_labColor(d.r), anchor: 'end', base: 'central' });
    g.appendChild(br_el('rect', { x: left, y: cy - barH / 2, width: Math.max(1.5, xS(d.v) - left), height: barH, fill: csinrel_color(d.r) }));
    br_text(g, xS(d.v) + gapV, cy, br_fmt(d.v, 0) + '%', { size: fsVal, weight: 500, fill: BR_C.soft, base: 'central' });
    if (!L.interactive) return;
    // zona de toque = la fila entera (etiqueta, barra y valor), sin huecos entre filas: el dedo no erra y pasar de
    // una fila a la siguiente no apaga el resaltado
    const hit = br_el('rect', { x: 0, y: top + slot * i, width: L.W, height: slot, fill: 'transparent' });
    hit.style.cursor = 'pointer';
    const show = (ev) => { csinrel_emph(svg, 'data-row', k, 0.3); br_tipAt(tip, svg, ev, csinrel_tipHTML(k)); };
    hit.addEventListener('mouseenter', show);
    hit.addEventListener('mousemove', (ev) => br_tipMove(tip, svg, ev));
    hit.addEventListener('mouseleave', () => { csinrel_emph(svg, 'data-row', null); br_tipHide(tip); });
    // escritorio: el clic saca al país (rk_drawBars). En el celular el tap es del tooltip (y un segundo tap en la
    // misma fila lo vuelve a mostrar, porque el touchstart global de lib/utils.js lo cerró)
    hit.addEventListener('click', (ev) => {
      if (HAS_HOVER) { br_tipHide(tip); csinrel_toggle(k); }
      else show(ev);
    });
    hitG.appendChild(hit);
  });
}

function csinrel_empty(svg, L, text) {
  if (!L.fmt) L.H = L.mobile ? 520 : 300;
  br_prepSvg(svg, L);
  br_text(svg, L.W / 2, L.H / 2, text, { size: L.big ? L.S.label : 17, fill: BR_C.muted, anchor: 'middle', base: 'central', italic: true });
}

// ---------------------------------------------------------------- leyenda de regiones (HTML, como #rk-legend)
// Solo las regiones de la selección. Hover (escritorio) atenúa las demás; clic oculta o muestra la región. No se
// puede apagar la última región visible (un gráfico vacío por la leyenda no tiene salida a la vista).
function csinrel_legend(s) {
  const cont = document.getElementById(CSINREL_ID + '-legend');
  if (!cont) return;
  const svg = document.getElementById('chart' + CSINREL_ID);
  const regs = csinrel_regions(s);
  cont.innerHTML = '';
  cont.style.display = regs.length > 1 ? '' : 'none';
  regs.forEach(r => {
    const off = s.ocultas.indexOf(r) >= 0;
    const it = document.createElement('span');
    it.className = 'rk-leg-item' + (off ? ' rk-leg-off' : '');
    it.title = t('csinrel-leg-hint');
    // también con teclado (Tab + Enter o espacio)
    it.setAttribute('role', 'button'); it.tabIndex = 0; it.setAttribute('aria-pressed', off ? 'false' : 'true');
    it.setAttribute('aria-label', csinrel_regName(r));
    it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); } });
    it.innerHTML = '<span class="rk-leg-dot" style="background:' + csinrel_color(r) + '"></span>' + csinrel_regName(r);
    if (HAS_HOVER) {
      it.addEventListener('mouseenter', () => { if (!off && svg) csinrel_emph(svg, 'data-reg', r, 0.18); });
      it.addEventListener('mouseleave', () => { if (svg) csinrel_emph(svg, 'data-reg', null); });
    }
    it.addEventListener('click', () => {
      const i = s.ocultas.indexOf(r);
      if (i >= 0) s.ocultas.splice(i, 1);
      else if (regs.filter(x => s.ocultas.indexOf(x) < 0).length > 1) s.ocultas.push(r);
      else return;
      csinrel_selector.render();
      drawCsinrel();
    });
    cont.appendChild(it);
  });
}

function csinrel_toggle(k) {
  const s = csinrel_state(), i = s.sel.indexOf(k);
  if (i >= 0) s.sel.splice(i, 1); else s.sel.push(k);
  csinrel_selector.render();
  drawCsinrel();
}

function drawCsinrel() {
  const s = csinrel_state(), svg = document.getElementById('chart' + CSINREL_ID);
  if (!svg) return;
  // una región oculta sin países elegidos deja de contar (si no, la URL arrastraría un filtro invisible)
  const regs = csinrel_regions(s);
  s.ocultas = s.ocultas.filter(r => regs.indexOf(r) >= 0);
  const rows = csinrel_rows(s);
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  atlasSetHeading(CSINREL_ID, csinrel_isDefault(s), { title: 'csinrel-title', titleNeutral: 'csinrel-title-neutral' });
  brSetSubtitle(CSINREL_ID, t('csinrel-sub').replace('{P}', csinrel_period(rows)));
  csinrel_legend(s);
  br_tipHide(document.getElementById('tooltip' + CSINREL_ID));
  const L = rel_layout(CSINREL_ID);
  if (rows.length) csinrel_bars(svg, rows, L);
  else csinrel_empty(svg, L, t('csinrel-vacio'));
  if (csinrel_urlWired) {
    atlasSyncUrlTodoONada(
      { paises: s.sel.length ? brList(s.sel) : '-', ocultas: brList(s.ocultas.map(csinrel_regCode)) },
      { paises: brList(CSINREL_DEF), ocultas: '' });
  }
}

function csinrel_applyUrl() {
  const s = csinrel_state();
  const v = atlasUrlParam('paises');
  if (v != null) {
    const ks = brParseList(v, (k) => !!csinrel_d(k.toUpperCase()));
    // '-' = selección vacía a propósito; una lista sin ningún código válido no pisa el default
    if (ks && (ks.length || v === '-')) s.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  const o = atlasUrlParam('ocultas');
  if (o) {
    const regs = csinrel_regions(s);
    const hid = o.split('~').map(c => REGION_CODE_TO_FULL[c]).filter(r => r && regs.indexOf(r) >= 0)
      .filter((r, i, a) => a.indexOf(r) === i);
    // nunca todas las regiones apagadas desde la URL
    if (hid.length < regs.length) s.ocultas = hid;
  }
  csinrel_urlWired = true;
  csinrel_selector.render();
  drawCsinrel();
}

function initCsinrel() {
  const s = csinrel_state();
  const byName = (a, b) => csinrel_name(a).localeCompare(csinrel_name(b), br_lang());
  csinrel_selector = brSelector({
    pre: CSINREL_ID,
    // chips en orden alfabético, como los del ranking de vecinos
    get: () => s.sel.slice().sort(byName), set: (a) => { s.sel = a; }, onChange: drawCsinrel,
    placeholderKey: 'sinrel-search-ph',
    universe: () => REL_SINREL.orden.slice().sort(byName).map(k => ({ key: k, label: csinrel_name(k), tag: csinrel_regName(csinrel_reg(k)) })),
    label: csinrel_name,
    color: (k) => csinrel_color(csinrel_reg(k)),
    dim: (k) => s.ocultas.indexOf(csinrel_reg(k)) >= 0
  });
  brRegister(CSINREL_ID, drawCsinrel, csinrel_pngSource);
  brCsv('button.download[data-chart="' + CSINREL_ID + '-csv"]', () => {
    const nm = (k, L) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? COUNTRY_NAMES[k][L] : k;
    const si = { es: ['sí', 'no'], en: ['yes', 'no'] }[br_lang()];
    const rows = REL_SINREL.orden.map(k => {
      const d = csinrel_d(k);
      return [k, nm(k, 'es'), nm(k, 'en'), I18N.es['reg.' + d.r], I18N.en['reg.' + d.r], d.s, d.w, d.y, d.n, d.v, csinrel_ast(k) ? si[0] : si[1]];
    });
    return {
      headers: {
        es: ['codigo', 'pais', 'pais_en', 'region', 'region_en', 'encuesta', 'ola', 'anio_campo', 'casos_sin_religion', 'cree_en_dios_pct', 'pregunta_como_pertenencia'],
        en: ['code', 'country_es', 'country', 'region_es', 'region', 'survey', 'wave', 'field_year', 'respondents_no_religion', 'believe_in_god_pct', 'asked_as_membership']
      },
      rows, file: { es: 'el-atlas-religion-sin-religion-creen.csv', en: 'the-atlas-religion-nones-believe.csv' }
    };
  });
  // touch: cada toque apaga el resaltado, como el touchstart global de lib/utils.js apaga el tooltip; si el toque
  // cae en una fila, su mouseenter/click sintético lo vuelve a prender (y con él el tooltip)
  document.addEventListener('touchstart', () => {
    const svg = document.getElementById('chart' + CSINREL_ID);
    if (svg) csinrel_emph(svg, 'data-row', null);
  }, true);
  csinrel_applyUrl();
}
function csinrel_onLang() { csinrel_selector.render(); drawCsinrel(); }
