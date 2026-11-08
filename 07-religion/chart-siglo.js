// El siglo católico: porcentaje de la población que se identifica como católica en América Latina, 1872-2024. Port
// interactivo del PNG aprobado g01_catolicos_largo_plazo (10_graficos.py, g01_siglo_catolico). Cinco series:
//   pew  América Latina según Pew (1910, 1950, 1970 con la World Religion Database; 2014 encuesta): punteada, con
//        cuadrados en cada dato dibujados por encima de las demás series;
//   lb   América Latina según Latinobarómetro (16 países, 1996-2024): gruesa, terracota, sin marcadores (olas densas);
//   bra / mex / chl  censos: Brasil une 1890 con 1940 (no hubo censo comparable en el medio); Chile se corta entre
//        1952 y 1992 porque cambia el universo.
// Leyenda dentro del SVG (viaja al PNG): hover resalta la serie y un clic la apaga o la prende (patrón rk-leg-off del
// N°4; nunca las cinco apagadas). Rótulos de valor como el PNG: 94% y 92% debajo de los cuadrados de Pew, 69% arriba;
// la primera y la última ola de Latinobarómetro (79% y 57%). Slider de período universal (brPeriod, 06-brasil).
// Motor: brLines (rel-motor.js) con crosshair que snapea al dato más cercano (tolerancia 4 años, año real en gris) y
// wireTouchScrub. Vista compartible: ?ocultas=pew~chl&periodo=1950~2024.
// Datos: REL_SIGLO (data-siglo.js).
const CSIG_ID = 'siglo';
const CSIG_SER = {
  pew: { color: '#33312C', label: '#33312C' },
  lb:  { color: '#BE5D32', label: '#8B3F1E' },
  bra: { color: '#2D6A3D', label: '#2D6A3D' },
  mex: { color: '#234B85', label: '#234B85' },
  chl: { color: '#6B3D8B', label: '#6B3D8B' }
};
const CSIG_LEG = ['pew', 'lb', 'bra', 'mex', 'chl'];        // orden de la leyenda (el del PNG aprobado)
const CSIG_DRAW = ['bra', 'mex', 'chl', 'pew', 'lb'];       // orden de dibujo: Latinobarómetro arriba de todo
const CSIG_CENSOS = ['bra', 'mex', 'chl'];
const CSIG_P = [1872, 2024];
let csig_urlWired = false, csig_period = null;

function csig_state() { if (!state[CSIG_ID]) state[CSIG_ID] = { hid: [], p: CSIG_P.slice() }; return state[CSIG_ID]; }
function csig_isDefault(s) { return !s.hid.length && s.p[0] === CSIG_P[0] && s.p[1] === CSIG_P[1]; }
function csig_vis(s, k) { return s.hid.indexOf(k) < 0; }
function csig_in(s, y) { return y >= s.p[0] && y <= s.p[1]; }
// puntos de una serie dentro del período; en Chile, un null entre tramos corta la línea (br_runs)
function csig_pts(s, k) {
  const out = [];
  REL_SIGLO.data[k].filter(p => csig_in(s, p[0])).forEach((p, i, a) => {
    if (i && p[3] !== a[i - 1][3]) out.push([(p[0] + a[i - 1][0]) / 2, null]);
    out.push([p[0], p[1]]);
  });
  return out;
}
// período del dato real de las series a la vista
function csig_range(s) {
  const ys = [];
  CSIG_LEG.forEach(k => { if (csig_vis(s, k)) REL_SIGLO.data[k].forEach(p => { if (csig_in(s, p[0])) ys.push(p[0]); }); });
  return ys.length ? Math.min.apply(null, ys) + '-' + Math.max.apply(null, ys) : s.p[0] + '-' + s.p[1];
}
// nota del PNG: solo las fuentes de las series a la vista
function csig_sourceText(s) {
  const parts = [];
  if (csig_vis(s, 'pew')) parts.push(t('csig-src-pew'));
  if (csig_vis(s, 'lb')) parts.push(t('csig-src-lb'));
  const cs = CSIG_CENSOS.filter(k => csig_vis(s, k)).map(k => t('csig-cn-' + k));
  const y = t('csig-src-y');
  const join = (a) => a.length > 1 ? a.slice(0, -1).join(', ') + y + a[a.length - 1] : a.join('');
  if (cs.length) parts.push(t('csig-src-censos').replace('{C}', join(cs)));
  return t('csig-png-source').replace('{S}', join(parts));
}

// Leyenda dentro del SVG: muestra de línea con el trazo de cada serie (punteada con cuadrado, gruesa, fina) + nombre.
// En pantalla, hover resalta la serie y un clic la apaga o la prende (apagada: tenue y tachada). En el PNG, solo las
// series a la vista. Devuelve el alto que ocupa.
function csig_legend(svg, L, y0, s, onToggle) {
  const S = L.S, fs = Math.max(S.tick, S.ann + 1), sw = L.big ? 34 : 22, gapI = L.big ? 12 : 7, gap = L.big ? 30 : 18;
  const rowH = fs * 1.5;
  let x = 0, row = 0;
  CSIG_LEG.forEach(k => {
    const off = !csig_vis(s, k);
    if (off && !L.interactive) return;
    const label = t('csig-' + k), w = sw + gapI + br_measure(label, fs, 400);
    if (x + w > L.W && x > 0) { x = 0; row++; }
    const cy = y0 + row * rowH + rowH / 2;
    const g = br_el('g', { 'data-leg': k }); svg.appendChild(g);
    const c = off ? BR_C.rule : CSIG_SER[k].color;
    const ln = br_el('line', { x1: x, x2: x + sw, y1: cy, y2: cy, stroke: c, 'stroke-width': k === 'lb' ? (L.big ? 7 : 4.5) : k === 'pew' ? (L.big ? 5 : 3.2) : (L.big ? 3 : 2) });
    if (k === 'pew') ln.setAttribute('stroke-dasharray', L.big ? '7 4' : '4 3');
    g.appendChild(ln);
    if (k === 'pew') { const q = L.big ? 12 : 7; g.appendChild(br_el('rect', { x: x + sw / 2 - q / 2, y: cy - q / 2, width: q, height: q, fill: c })); }
    else if (CSIG_CENSOS.indexOf(k) >= 0) g.appendChild(br_el('circle', { cx: x + sw / 2, cy, r: L.big ? 4.5 : 2.8, fill: c }));
    const tx = br_text(g, x + sw + gapI, cy, label, { size: fs, fill: BR_C.soft, base: 'central' });
    if (off) { g.setAttribute('opacity', 0.38); tx.setAttribute('text-decoration', 'line-through'); }
    if (L.interactive) {
      g.appendChild(br_el('rect', { x: x - 4, y: cy - rowH / 2, width: w + 8, height: rowH, fill: 'transparent' }));
      g.style.cursor = 'pointer';
      g.addEventListener('mouseenter', () => { if (!off) br_emph(svg, k); });
      g.addEventListener('mouseleave', () => br_emph(svg, null));
      g.addEventListener('click', () => onToggle(k));
    }
    x += w + gap;
  });
  return (row + 1) * rowH;
}

function drawCsig() {
  const s = csig_state(), svg = document.getElementById('chart' + CSIG_ID);
  if (!svg) return;
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  atlasSetHeading(CSIG_ID, csig_isDefault(s), { title: 'csig-title', titleNeutral: 'csig-title-neutral' });
  brSetSubtitle(CSIG_ID, t('csig-sub').replace('{P}', csig_range(s)));
  const L = rel_layout(CSIG_ID), S = L.S, big = L.big;
  br_prepSvg(svg, L); br_clearHover(svg);
  br_tipHide(document.getElementById('tooltip' + CSIG_ID));
  const legY = L.png ? 14 : 0;   // en el PNG, aire entre el subtítulo y la leyenda
  const legH = csig_legend(svg, L, legY, s, (k) => {
    const i = s.hid.indexOf(k);
    if (i >= 0) s.hid.splice(i, 1);
    else if (s.hid.length + 1 < CSIG_LEG.length) s.hid.push(k);   // nunca las cinco apagadas
    else return;
    drawCsig();
  });
  const top = legY + legH + (L.png ? 26 : big ? 16 : 10);
  const box = { x: 0, y: top, w: L.W, h: L.H - top };
  const series = CSIG_DRAW.filter(k => csig_vis(s, k)).map(k => ({
    key: k, label: t('csig-' + k), color: CSIG_SER[k].color, labelColor: CSIG_SER[k].label,
    main: k === 'pew' || k === 'lb', dash: k === 'pew', dots: CSIG_CENSOS.indexOf(k) >= 0, pts: csig_pts(s, k)
  })).filter(x => x.pts.some(p => p[1] != null));
  // aire a los costados del período (el PNG aprobado va de 1865 a 2030 para 1872-2024)
  const pad = Math.max(1, Math.round((s.p[1] - s.p[0]) * 0.045));
  const step = (s.p[1] - s.p[0]) > 60 ? 20 : (s.p[1] - s.p[0]) > 24 ? 10 : 5;
  const xTicks = [];
  for (let y = Math.ceil(s.p[0] / step) * step; y <= s.p[1]; y += step) xTicks.push(y);
  const n0 = svg.children.length;
  const res = brLines({
    svg, id: CSIG_ID, L, box, series, x0: s.p[0] - pad, x1: s.p[1] + pad, yMin: 0, yMax: 100,
    yTicks: [0, 20, 40, 60, 80, 100], xTicks, yFmt: (v) => br_fmt(v, 0) + '%',
    tol: 4, ttDec: 1, ttSuffix: '%', noEndLabels: true, rightW: big ? 18 : 10
  });
  // grupos de brLines (modo box): grilla, bandas, halos, líneas, puntos, hit, etiquetas, [crosshair]
  const kids = Array.prototype.slice.call(svg.children, n0);
  // Latinobarómetro más gruesa que las demás (el PNG la dibuja a 7 px)
  const lbW = big ? 7 : 4.5;
  svg.querySelectorAll('path.br-line[data-k="lb"]').forEach(p => { p.setAttribute('stroke-width', lbW); p.setAttribute('data-base-w', lbW); });
  if (kids[2]) kids[2].querySelectorAll('path[data-k="lb"]').forEach(p => p.setAttribute('stroke-width', lbW + (big ? 5 : 3)));
  // cuadrados de Pew por encima de todas las líneas, y rótulos de valor (debajo del hit, para no robarle el hover)
  const sqG = br_el('g', { 'pointer-events': 'none' }), labG = br_el('g', { 'pointer-events': 'none' });
  svg.insertBefore(sqG, kids[5] || null); svg.insertBefore(labG, kids[5] || null);
  const fs = S.label, halo = big ? 5 : 3;
  const lab = (k, x, y, v, anchor, base) => {
    const tx = br_text(labG, x, y, br_fmt(v, 0) + '%', { size: fs, weight: 700, fill: CSIG_SER[k].label, anchor: anchor || 'middle', halo, base });
    tx.setAttribute('data-k', k);
  };
  if (csig_vis(s, 'pew')) {
    const q = big ? 14 : 8.5;
    let prev = null;
    REL_SIGLO.data.pew.filter(p => csig_in(s, p[0])).forEach(p => {
      const x = res.xS(p[0]), y = res.yS(p[1]);
      sqG.appendChild(br_el('rect', { x: x - q / 2, y: y - q / 2, width: q, height: q, fill: CSIG_SER.pew.color, stroke: BR_C.bg, 'stroke-width': big ? 1.5 : 1, 'data-k': 'pew' }));
      // 94% (1910) y 92% (1970) debajo del cuadrado; 69% (2014) arriba y a la izquierda, sobre la línea de
      // Latinobarómetro. 1950 repite el 94% de 1910 y no se rotula (como el PNG).
      if (prev != null && Math.round(p[1]) === Math.round(prev)) { prev = p[1]; return; }
      prev = p[1];
      if (p[0] >= 2000) lab('pew', x - fs * 0.5, y - fs * 1.55, p[1]);
      else lab('pew', x, y + fs * 1.6, p[1]);
    });
  }
  if (csig_vis(s, 'lb')) {
    const lb = REL_SIGLO.data.lb.filter(p => csig_in(s, p[0]));
    if (lb.length) {
      const a = lb[0], b = lb[lb.length - 1];
      lab('lb', res.xS(a[0]) + fs * 0.8, res.yS(a[1]) - fs * 0.95, a[1], 'middle', 'central');   // 79%, arriba de la primera ola
      if (b !== a) lab('lb', res.xS(b[0]), res.yS(b[1]) + fs * 1.75, b[1]);                   // 57%, debajo de la última
    }
  }
  if (csig_urlWired) atlasSyncUrlTodoONada({ ocultas: brList(s.hid), periodo: s.p[0] + '~' + s.p[1] }, { ocultas: '', periodo: CSIG_P[0] + '~' + CSIG_P[1] });
}
function csig_applyUrl() {
  const s = csig_state();
  const o = atlasUrlParam('ocultas');
  if (o != null) {
    const hs = (brParseList(o, (k) => CSIG_LEG.indexOf(k.toLowerCase()) >= 0) || []).map(k => k.toLowerCase()).filter((k, i, a) => a.indexOf(k) === i);
    if (hs.length < CSIG_LEG.length) s.hid = hs;   // nunca las cinco apagadas desde la URL
  }
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) {
    const [a, b] = per.split('~').map(Number);
    if (Number.isInteger(a) && Number.isInteger(b) && a >= CSIG_P[0] && b <= CSIG_P[1] && a < b) s.p = [a, b];
  }
  csig_urlWired = true;
  csig_period.sync();
  drawCsig();
}
function initCsig() {
  const s = csig_state();
  csig_period = brPeriod({ pre: CSIG_ID, min: CSIG_P[0], max: CSIG_P[1], get: () => s.p, set: (p) => { s.p = p; }, onChange: drawCsig });
  brRegister(CSIG_ID, drawCsig, () => csig_sourceText(s));
  brCsv('button.download[data-chart="' + CSIG_ID + '-csv"]', () => {
    const rows = [];
    const fuente = (k, p, L) => I18N[L]['csig-fuente-' + (k === 'pew' ? (p[0] < 2000 ? 'pew-est' : 'pew-enc') : k)];
    CSIG_LEG.forEach(k => REL_SIGLO.data[k].forEach(p => {
      const u = REL_SIGLO.univ[p[2]];
      rows.push([k, I18N.es['csig-' + k], I18N.en['csig-' + k], p[0], p[1], u[0], u[1], fuente(k, p, 'es'), fuente(k, p, 'en')]);
    }));
    return {
      headers: {
        es: ['serie', 'nombre', 'nombre_en', 'anio', 'catolicos_pct', 'universo', 'universo_en', 'fuente', 'fuente_en'],
        en: ['series', 'name_es', 'name', 'year', 'catholics_pct', 'universe_es', 'universe', 'source_es', 'source']
      },
      rows, file: { es: 'el-atlas-religion-catolicos-1872-2024.csv', en: 'the-atlas-religion-catholics-1872-2024.csv' }
    };
  });
  csig_applyUrl();
}
function csig_onLang() { drawCsig(); }
