// Chart 10 del especial: los goles segun la instancia del Mundial.
//
// Dos vistas. "El cuadro" dibuja una fila por instancia en orden de llave (no
// ordenadas por valor), con un punto por edicion, el promedio y su intervalo. No
// hay serie anual por instancia a proposito: la final es n=1 por edicion, asi que
// una linea seria ruido dibujado con cara de tendencia. "El reloj" reparte los
// goles por tramo de minuto, solo para grupos vs eliminacion, que son los unicos
// dos agregados con goles suficientes como para que la distribucion signifique algo.
//
// Los dos toggles que importan (ver build_instancias_data.py):
//  - Ventana: "primeros 90 minutos" iguala la duracion entre instancias. Grupos
//    dura 90; la eliminacion dura 90 o 120 segun su propio marcador, asi que el
//    partido completo compara unidades de distinto largo.
//  - Referencia: "contra el promedio de su propio Mundial" mata el efecto epoca.
//    Sin eso comparas instancias que cubren epocas distintas (el 3er puesto solo
//    1934-2022, los 32avos solo 2026) con goles/partido cayendo de ~5 a ~2,5.

const IN_N = 10;
const IN_ACCENT = 'var(--accent)';
let in_touched = false;

function in_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function in_en() { return in_lang() === 'en'; }
function in_t(key, fb) { const v = (typeof t === 'function') ? t(key) : key; return (v && v !== key) ? v : fb; }
function in_state() {
  if (!state[IN_N]) {
    state[IN_N] = {
      view: 'cuadro',        // cuadro | reloj
      metric: 'goles',       // goles | ig90 | et
      win: '90',             // 90 | full
      ref: 'bruto',          // bruto | cent
      sel: null,             // instancias elegidas (null = todas)
      from: DATA_INST.eds[0],
      to: DATA_INST.eds[DATA_INST.eds.length - 1],
    };
  }
  return state[IN_N];
}
const IN_FLOOR = 0;   // "Fase de grupos" es el piso: no se puede sacar

function in_instName(i) {
  const es = DATA_INST.inst[i];
  if (!in_en()) return es;
  return ({
    'Fase de grupos': 'Group stage', '32avos': 'Round of 32', 'Octavos': 'Round of 16',
    'Cuartos': 'Quarter-finals', 'Semis': 'Semi-finals', '3er puesto': 'Third-place match',
    'Final': 'Final', '2da fase de grupos': 'Second group stage', 'Ronda final 1950': 'Final round 1950',
  })[es] || es;
}
function in_isKO(i) { return DATA_INST.ko.indexOf(i) >= 0; }
function in_selected() {
  const s = in_state();
  if (!s.sel) return DATA_INST.inst.map((_, i) => i);
  return s.sel.slice();
}

// --- datos ------------------------------------------------------------------
// Un partido: [ed, inst, local, visit, gl, gv, g90, ig90, et]
function in_goles(m) { return in_state().win === '90' ? m[6] : (m[4] + m[5]); }

// Promedio de goles de cada edicion, dentro del recorte activo. Es la referencia
// para centrar: cada partido se compara contra el Mundial en el que se jugo.
function in_edMeans(ms) {
  const acc = {};
  ms.forEach(m => { const e = m[0]; (acc[e] = acc[e] || [0, 0]); acc[e][0] += in_goles(m); acc[e][1]++; });
  const out = {};
  Object.keys(acc).forEach(e => { out[e] = acc[e][0] / acc[e][1]; });
  return out;
}
function in_matches() {
  const s = in_state();
  return DATA_INST.m.filter(m => m[0] >= s.from && m[0] <= s.to);
}
// Valor por partido segun la metrica activa. Para las proporciones es 0/1.
function in_val(m, edm) {
  const s = in_state();
  if (s.metric === 'ig90') return m[7];
  // el alargue viene resuelto en el dato: en 1954 los empates de la fase de grupos
  // tambien iban a suplementario, asi que no se puede asumir 0 fuera de la eliminacion
  if (s.metric === 'et') return m[8];
  const g = in_goles(m);
  return (s.ref === 'cent') ? g - edm[m[0]] : g;
}
function in_isPct() { const m = in_state().metric; return m === 'ig90' || m === 'et'; }
function in_isCent() { return in_state().metric === 'goles' && in_state().ref === 'cent'; }

function in_rows() {
  const ms = in_matches(), edm = in_edMeans(ms), sel = in_selected();
  const by = {};
  ms.forEach(m => { (by[m[1]] = by[m[1]] || []).push(m); });
  return sel.map(i => {
    const list = by[i] || [];
    const n = list.length;
    if (!n) return { i, n: 0, vacio: true, label: in_instName(i) };
    const vals = list.map(m => in_val(m, edm));
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    let ic;
    if (in_isPct()) {           // Wilson, que no se rompe cuando la proporcion es 0
      const z = 1.96, p = mean, d = 1 + z * z / n;
      const c = (p + z * z / (2 * n)) / d, half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
      ic = { lo: Math.max(0, c - half), hi: Math.min(1, c + half), c: c };
    } else {
      const sd = n > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1)) : 0;
      const half = n > 1 ? 1.96 * sd / Math.sqrt(n) : NaN;
      ic = { lo: mean - half, hi: mean + half, c: mean };
    }
    // un punto por edicion (solo tiene sentido para goles: con n=1 una proporcion es 0% o 100%)
    const pe = {};
    list.forEach(m => { const e = m[0]; (pe[e] = pe[e] || []).push(in_val(m, edm)); });
    const pts = Object.keys(pe).map(e => ({
      ed: +e, v: pe[e].reduce((a, b) => a + b, 0) / pe[e].length, n: pe[e].length,
    })).sort((a, b) => a.ed - b.ed);
    return {
      i, n, label: in_instName(i), mean, ic, pts, list,
      eds: pts.length,
      ko: in_isKO(i),
      raro: i >= DATA_INST.n_princ,
      hi: DATA_INST.inst[i] === '3er puesto',
      // la instancia se estreno en 2026 o le falta jugarse algo
      nueva: pts.length === 1 && pts[0].ed === DATA_INST.eds[DATA_INST.eds.length - 1],
    };
  }).filter(r => !r.vacio);
}
function in_fmt(v) {
  if (in_isPct()) return (v * 100).toFixed(1).replace('.', in_en() ? '.' : ',') + '%';
  const s = v.toFixed(2).replace('.', in_en() ? '.' : ',');
  return (in_isCent() && v > 0) ? '+' + s : s;
}

// --- vista "El cuadro" ------------------------------------------------------
function in_drawCuadro(svg, W, H, bigFmt) {
  const NS = 'http://www.w3.org/2000/svg';
  const rows = in_rows();
  if (!rows.length) return;
  const FS = bigFmt ? 21 : 12.5, FSN = bigFmt ? 15 : 9.2, FSV = bigFmt ? 19 : 11;
  const meas = (s, sz, w) => (typeof ts_measure === 'function') ? ts_measure(s, sz, w || 500) : s.length * sz * 0.56;
  const labW = Math.max(0, ...rows.map(r => meas(r.label, FS, 600)));
  const subW = Math.max(0, ...rows.map(r => meas(in_subLabel(r), FSN, 400)));
  const M = {
    top: bigFmt ? 44 : 30, bottom: bigFmt ? 48 : 34,
    left: Math.ceil(Math.max(labW, subW) + (bigFmt ? 52 : 34)),
    right: bigFmt ? 132 : 84,
  };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  // El 3er puesto cuelga de semis y los formatos raros van abajo de una hairline.
  // El descuelgue se hace con aire ARRIBA de la fila, no corriendo la fila dentro de
  // su carril: si no, empuja su propio renglon de n contra la etiqueta de la de abajo.
  const nRaros = rows.filter(r => r.raro).length;
  const hasHi = rows.some(r => r.hi);
  const lanes = rows.length + (hasHi ? 0.45 : 0) + (nRaros ? 0.55 : 0);
  const LANE = PH / lanes;
  const rowY = [];
  let acc = 0;
  rows.forEach((r, k) => {
    if (r.hi) acc += 0.45;
    if (r.raro && (k === 0 || !rows[k - 1].raro)) acc += 0.55;
    rowY.push(M.top + LANE * (acc + 0.5));
    acc += 1;
  });

  const vals = [];
  rows.forEach(r => { r.pts.forEach(p => vals.push(p.v)); vals.push(r.ic.lo, r.ic.hi); });
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (in_isPct()) { lo = 0; hi = Math.max(hi, 0.45); }
  else if (in_isCent()) { const a = Math.max(Math.abs(lo), Math.abs(hi)); lo = -a * 1.05; hi = a * 1.05; }
  else { lo = 0; hi = hi * 1.05; }
  const X = v => M.left + ((v - lo) / ((hi - lo) || 1)) * PW;

  const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
  const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); g.appendChild(e); return e; };
  const txt = (x, y, s, o) => {
    const e = mk('text', { x, y, dy: '0.35em' });
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((o && o.fs) || FS) + 'px';
    if (o && o.anchor) e.setAttribute('text-anchor', o.anchor);
    if (o && o.weight) e.style.fontWeight = o.weight;
    e.setAttribute('fill', (o && o.fill) || 'var(--ink)');
    if (o && o.italic) e.style.fontStyle = 'italic';
    e.textContent = s; return e;
  };
  // grilla
  const ticks = in_isPct() ? [0, .1, .2, .3, .4] : in_isCent() ? [-2, -1, 0, 1, 2, 3] : [0, 2, 4, 6, 8];
  ticks.filter(v => v >= lo && v <= hi).forEach(v => {
    const cero = in_isCent() && v === 0;
    mk('line', { x1: X(v), x2: X(v), y1: M.top - (bigFmt ? 14 : 9), y2: H - M.bottom + 2, stroke: cero ? 'var(--ink-soft)' : 'var(--rule)', 'stroke-width': cero ? 1.3 : 1, 'stroke-dasharray': cero ? '' : '2 3' });
    txt(X(v), M.top - (bigFmt ? 24 : 16), in_isPct() ? Math.round(v * 100) + '%' : ((in_isCent() && v > 0 ? '+' : '') + v), { fs: bigFmt ? 15 : 9.5, anchor: 'middle', fill: 'var(--ink-muted)' });
  });
  const _axFs = bigFmt ? 16 : 10;
  txt(M.left, H - (bigFmt ? 14 : 10), in_axisLabel(), { fs: _axFs, fill: 'var(--ink-muted)' });
  // Referencia del margen de error, con el mismo glifo que se dibuja en las filas:
  // sin esto la linea horizontal no se entiende (Daniel, 18/7).
  (() => {
    const ky = H - (bigFmt ? 14 : 10);
    let kx = M.left + meas(in_axisLabel(), _axFs, 400) + (bigFmt ? 34 : 22);
    const w = bigFmt ? 34 : 22, cap = bigFmt ? 5 : 3.5;
    const lbl = in_en() ? 'margin of error (95%)' : 'margen de error (95%)';
    const need = w + (bigFmt ? 8 : 5) + meas(lbl, bigFmt ? 15 : 9.5, 400);
    if (kx + need > W - (bigFmt ? 16 : 10)) kx = Math.max(M.left, W - (bigFmt ? 16 : 10) - need);
    mk('line', { x1: kx, x2: kx + w, y1: ky, y2: ky, stroke: 'var(--ink-muted)', 'stroke-width': bigFmt ? 2 : 1.2, opacity: .75 });
    [kx, kx + w].forEach(v => mk('line', { x1: v, x2: v, y1: ky - cap, y2: ky + cap, stroke: 'var(--ink-muted)', 'stroke-width': bigFmt ? 2 : 1.2, opacity: .75 }));
    txt(kx + w + (bigFmt ? 8 : 5), ky, lbl, { fs: bigFmt ? 15 : 9.5, fill: 'var(--ink-muted)' });
  })();
  txt(W - M.right + (bigFmt ? 122 : 78), M.top - (bigFmt ? 24 : 16), in_sideHeader(), { fs: bigFmt ? 14 : 9, anchor: 'end', weight: 600, fill: 'var(--ink-muted)' });

  const hover = !in_pngMode() && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  const grupos = [];
  rows.forEach((r, k) => {
    const y = rowY[k], col = r.hi ? IN_ACCENT : 'var(--ink)';
    const gr = document.createElementNS(NS, 'g'); g.appendChild(gr); grupos.push(gr);
    const mkr = (tag, at) => { const e = document.createElementNS(NS, tag); for (const kk in at) e.setAttribute(kk, at[kk]); gr.appendChild(e); return e; };
    // hairline que separa los formatos raros
    if (r.raro && (k === 0 || !rows[k - 1].raro)) {
      mk('line', { x1: M.left - (bigFmt ? 40 : 26), x2: W - M.right, y1: y - LANE * 0.72, y2: y - LANE * 0.72, stroke: 'var(--rule)', 'stroke-width': 1 });
    }
    // la rama del 3er puesto: cuelga de semis, es la que no lleva a la copa
    if (r.hi && k > 0) {
      const y0 = rowY[k - 1], x0 = M.left - (bigFmt ? 46 : 30);
      mkr('path', { d: `M ${x0} ${y0} C ${x0} ${(y0 + y) / 2}, ${x0 + 10} ${y}, ${x0 + 20} ${y}`, fill: 'none', stroke: 'var(--ink-muted)', 'stroke-width': bigFmt ? 1.6 : 1, 'stroke-dasharray': '2 2.5', opacity: .8 });
      mkr('circle', { cx: x0 + 23, cy: y, r: bigFmt ? 4 : 2.6, fill: 'none', stroke: 'var(--ink-muted)', 'stroke-width': bigFmt ? 1.6 : 1.1 });
    }
    const lx = M.left - (bigFmt ? (r.hi ? 34 : 20) : (r.hi ? 22 : 13));
    // el nombre y el renglon del n van apilados: separacion generosa, si se rozan
    // el bloque se lee como una sola linea sucia
    const lb = txt(lx, y - (bigFmt ? 15 : 9), r.label, { anchor: 'end', weight: r.hi ? 700 : 500, fill: r.hi ? IN_ACCENT : 'var(--ink)', italic: r.raro });
    gr.appendChild(lb);
    const sb = txt(lx, y + (bigFmt ? 18 : 10.5), in_subLabel(r), { anchor: 'end', fs: FSN, fill: 'var(--ink-muted)' });
    gr.appendChild(sb);
    // puntos por edicion (solo para goles: una proporcion con n=1 es 0% o 100%, no informa)
    if (!in_isPct()) {
      r.pts.forEach(p => {
        const rad = Math.min(bigFmt ? 11 : 6.5, (bigFmt ? 3.4 : 2) + Math.sqrt(p.n) * (bigFmt ? .9 : .55));
        const c = mkr('circle', { cx: X(p.v), cy: y, r: rad, fill: col, opacity: r.hi ? .3 : .18 });
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = p.ed + ': ' + in_fmt(p.v) + ' (' + p.n + ' ' + in_t('pc-matches', in_en() ? 'matches' : 'partidos') + ')';
        c.appendChild(ti);
      });
    }
    // barra para proporciones, tick + bigote para promedios
    if (in_isPct()) {
      const bh = Math.min(bigFmt ? 26 : 15, LANE * .5);
      mkr('rect', { x: X(0), y: y - bh / 2, width: Math.max(1.5, X(r.mean) - X(0)), height: bh, fill: col, opacity: r.hi ? .85 : .55, rx: bigFmt ? 3 : 2 });
    }
    // Margen de error. Con terminaciones verticales: una linea pelada se lee como
    // "otra barra", con las patitas se lee como barra de error, que es el lenguaje
    // visual convencional.
    if (isFinite(r.ic.lo)) {
      const cap = bigFmt ? 7 : 4.5;
      mkr('line', { x1: X(r.ic.lo), x2: X(r.ic.hi), y1: y, y2: y, stroke: col, 'stroke-width': bigFmt ? 2 : 1.2, opacity: .55 });
      [r.ic.lo, r.ic.hi].forEach(v => mkr('line', { x1: X(v), x2: X(v), y1: y - cap, y2: y + cap, stroke: col, 'stroke-width': bigFmt ? 2 : 1.2, opacity: .55 }));
    }
    mkr('line', { x1: X(r.mean), x2: X(r.mean), y1: y - (bigFmt ? 13 : 8), y2: y + (bigFmt ? 13 : 8), stroke: col, 'stroke-width': bigFmt ? 5 : 3.4 });
    // Con proporciones la barra arranca en el cero, asi que una etiqueta centrada
    // sobre una barra de 0% cae en la canaleta de nombres: va despues de la barra.
    const vl = in_isPct()
      ? txt(X(r.mean) + (bigFmt ? 14 : 9), y, in_fmt(r.mean), { fs: FSV, anchor: 'start', weight: 700, fill: col })
      : txt(Math.max(M.left + (bigFmt ? 22 : 14), Math.min(W - M.right - (bigFmt ? 22 : 14), X(r.mean))),
            y - (bigFmt ? 22 : 13.5), in_fmt(r.mean), { fs: FSV, anchor: 'middle', weight: 700, fill: col });
    gr.appendChild(vl);
    if (r.nueva) {
      // con proporciones el valor va sobre el mismo renglon, asi que la nota
      // arranca despues del numero y no encima
      const gapV = bigFmt ? 14 : 9;
      const nx = in_isPct()
        ? X(r.mean) + gapV + meas(in_fmt(r.mean), FSV, 700) + gapV
        : X(r.mean) + (bigFmt ? 26 : 16);
      const nl = txt(nx, y + (bigFmt ? 6 : 4), in_t('c10-nueva', in_en() ? 'debut 2026' : 'estreno 2026'), { fs: bigFmt ? 13 : 8.5, fill: 'var(--ink-muted)', italic: true });
      gr.appendChild(nl);
    }
    // columna derecha: siempre la otra medida, para no perderla de vista
    const sv = txt(W - M.right + (bigFmt ? 122 : 78), y, in_sideValue(r), { fs: bigFmt ? 20 : 12.5, anchor: 'end', weight: r.hi ? 700 : 600, fill: r.hi ? IN_ACCENT : 'var(--ink-soft)' });
    gr.appendChild(sv);

    if (hover) {
      const hit = mk('rect', { x: 0, y: y - LANE / 2, width: W, height: LANE, fill: 'transparent' });
      hit.style.cursor = 'default';
      hit.addEventListener('mouseenter', () => { grupos.forEach((o, j) => o.setAttribute('opacity', j === k ? 1 : .25)); in_tip(r); });
      hit.addEventListener('mousemove', e => { in_tipMove._e = e; in_tipMove(); });
      hit.addEventListener('mouseleave', () => { grupos.forEach(o => o.setAttribute('opacity', 1)); in_tipHide(); });
    }
  });
}
function in_subLabel(r) {
  const en = in_en();
  const p = en ? (r.n === 1 ? 'match' : 'matches') : 'part.';
  const e = en ? (r.eds === 1 ? 'ed.' : 'eds.') : 'ed.';
  return r.n.toLocaleString(en ? 'en' : 'es') + ' ' + p + ', ' + r.eds + ' ' + e;
}
function in_axisLabel() {
  const s = in_state(), en = in_en();
  if (s.metric === 'ig90') return en ? 'share of matches level at 90 minutes' : 'porcentaje de partidos igualados a los 90 minutos';
  if (s.metric === 'et') return en ? 'share of matches that went to extra time' : 'porcentaje de partidos que fueron al alargue';
  const w = s.win === '90' ? (en ? 'first 90 minutes' : 'primeros 90 minutos') : (en ? 'full match, extra time included' : 'partido completo, alargue incluido');
  return (s.ref === 'cent')
    ? (en ? 'goals vs. the average of its own World Cup (' + w + ')' : 'goles respecto del promedio de su propio Mundial (' + w + ')')
    : (en ? 'goals per match (' + w + ')' : 'goles por partido (' + w + ')');
}
function in_sideHeader() {
  const s = in_state(), en = in_en();
  if (s.metric === 'goles') return en ? 'LEVEL AT 90' : "IGUAL. 90'";
  return en ? 'GOALS/MATCH' : 'GOLES/PART.';
}
function in_sideValue(r) {
  const s = in_state();
  if (s.metric === 'goles') { const p = r.list.filter(m => m[7]).length / r.n; return (p * 100).toFixed(1).replace('.', in_en() ? '.' : ',') + '%'; }
  const g = r.list.reduce((a, m) => a + in_goles(m), 0) / r.n;
  return g.toFixed(2).replace('.', in_en() ? '.' : ',');
}

// --- vista "El reloj" -------------------------------------------------------
// Solo grupos vs eliminacion: una instancia suelta tiene ~70 goles repartidos en
// 7 tramos, o sea diez por tramo, que no alcanza para leer una distribucion.
const IN_TRAMOS = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75], [76, 90], [91, 200]];
function in_relojData() {
  const s = in_state();
  const gs = DATA_INST.g.filter(x => x[0] >= s.from && x[0] <= s.to);
  const mk = pred => {
    const c = IN_TRAMOS.map(() => 0); let tot = 0;
    gs.forEach(x => {
      if (!pred(x[1])) return;
      const k = IN_TRAMOS.findIndex(t => x[2] >= t[0] && x[2] <= t[1]);
      if (k >= 0) { c[k]++; tot++; }
    });
    return { c, tot, p: c.map(v => tot ? v / tot : 0) };
  };
  return {
    grupos: mk(i => !in_isKO(i)),
    elim: mk(i => in_isKO(i)),
  };
}
function in_decadas() {
  const s = in_state();
  const acc = {};
  DATA_INST.g.filter(x => x[0] >= s.from && x[0] <= s.to).forEach(x => {
    const d = Math.floor(x[0] / 10) * 10;
    (acc[d] = acc[d] || [0, 0]);
    acc[d][1]++;
    if (x[2] >= 76 && x[2] <= 90) acc[d][0]++;
  });
  return Object.keys(acc).map(d => ({ d: +d, p: acc[d][0] / acc[d][1], n: acc[d][1] })).sort((a, b) => a.d - b.d);
}
function in_drawReloj(svg, W, H, bigFmt) {
  const NS = 'http://www.w3.org/2000/svg';
  const D = in_relojData(), dec = in_decadas();
  const FS = bigFmt ? 19 : 11.5;
  const M = { top: bigFmt ? 46 : 32, right: bigFmt ? 150 : 96, bottom: bigFmt ? 40 : 28, left: bigFmt ? 76 : 50 };
  const SEP = bigFmt ? 82 : 56;                                // aire entre los dos bloques
  const H1 = Math.round((H - M.top - M.bottom) * 0.56);        // perfiles por minuto
  const H2 = (H - M.top - M.bottom) - H1 - SEP;                // tira del gol tardio
  const PW = W - M.left - M.right;
  const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
  const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); g.appendChild(e); return e; };
  const txt = (x, y, s, o) => {
    const e = mk('text', { x, y, dy: '0.35em' });
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((o && o.fs) || FS) + 'px';
    if (o && o.anchor) e.setAttribute('text-anchor', o.anchor);
    if (o && o.weight) e.style.fontWeight = o.weight;
    if (o && o.italic) e.style.fontStyle = 'italic';
    e.setAttribute('fill', (o && o.fill) || 'var(--ink)'); e.textContent = s; return e;
  };
  const maxP = Math.max(0.26, ...D.grupos.p, ...D.elim.p);
  const bw = PW / IN_TRAMOS.length;
  const X = k => M.left + bw * (k + .5);
  const Y = p => M.top + H1 - (p / maxP) * H1;
  // banda del ultimo cuarto de hora
  mk('rect', { x: M.left + bw * 5, y: M.top - (bigFmt ? 8 : 5), width: bw, height: H1 + (bigFmt ? 8 : 5), fill: 'var(--ink)', opacity: .045 });
  [0, .1, .2].filter(v => v <= maxP).forEach(v => {
    mk('line', { x1: M.left, x2: M.left + PW, y1: Y(v), y2: Y(v), stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': v ? '2 3' : '' });
    txt(M.left - (bigFmt ? 12 : 8), Y(v), Math.round(v * 100) + '%', { fs: bigFmt ? 15 : 9.5, anchor: 'end', fill: 'var(--ink-muted)' });
  });
  const labs = IN_TRAMOS.map((t, k) => k === 6 ? (in_en() ? 'extra time' : 'alargue') : (t[0] + '-' + t[1]));
  labs.forEach((s, k) => txt(X(k), M.top + H1 + (bigFmt ? 22 : 15), s, { fs: bigFmt ? 15 : 9.5, anchor: 'middle', fill: k === 5 ? 'var(--ink)' : 'var(--ink-muted)', weight: k === 5 ? 600 : null }));
  txt(X(5), M.top + H1 + (bigFmt ? 46 : 30), in_en() ? '(includes stoppage)' : '(incluye descuento)', { fs: bigFmt ? 13 : 8.5, anchor: 'middle', fill: 'var(--ink-muted)', italic: true });

  // Leyenda arriba a la derecha y no al final de cada linea: el ultimo tramo es el
  // del alargue, donde la curva de grupos se apoya en el cero y el nombre terminaba
  // pegado a la etiqueta del eje.
  [['grupos', 'var(--ink-soft)', in_en() ? 'Group stage' : 'Fase de grupos'],
   ['elim', IN_ACCENT, in_en() ? 'Knockout' : 'Eliminación']].forEach(([k, col, name], li) => {
    const S = D[k];
    const d = S.p.map((p, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(p)).join(' ');
    mk('path', { d, fill: 'none', stroke: col, 'stroke-width': bigFmt ? 3.4 : 2.2, 'stroke-linejoin': 'round' });
    S.p.forEach((p, i) => {
      const c = mk('circle', { cx: X(i), cy: Y(p), r: bigFmt ? 6 : 3.6, fill: col });
      const ti = document.createElementNS(NS, 'title');
      ti.textContent = name + ' ' + labs[i] + ': ' + (p * 100).toFixed(1) + '% (' + S.c[i] + ' ' + (in_en() ? 'goals' : 'goles') + ')';
      c.appendChild(ti);
    });
    // anclada al borde derecho y medida, para que no se salga del marco en ningun formato
    const ly = M.top + (bigFmt ? 6 : 4) + li * (bigFmt ? 26 : 17);
    const fsL = bigFmt ? 16 : 10.5, xEnd = W - (bigFmt ? 22 : 14);
    const tw = (typeof ts_measure === 'function') ? ts_measure(name, fsL, 600) : name.length * fsL * 0.56;
    txt(xEnd, ly, name, { fs: fsL, anchor: 'end', weight: 600, fill: col });
    mk('line', { x1: xEnd - tw - (bigFmt ? 38 : 24), x2: xEnd - tw - (bigFmt ? 12 : 8), y1: ly, y2: ly, stroke: col, 'stroke-width': bigFmt ? 3.4 : 2.2 });
  });
  // tira: gol tardio por decada
  const y2 = M.top + H1 + SEP;
  txt(M.left, y2 - (bigFmt ? 16 : 11), in_en() ? 'Goals in the last 15 minutes of regulation, by decade' : 'Goles en los últimos 15 minutos del tiempo reglamentario, por década', { fs: bigFmt ? 15 : 10, weight: 600, fill: 'var(--ink-soft)' });
  const maxD = Math.max(.3, ...dec.map(d => d.p));
  const dw = PW / Math.max(1, dec.length);
  dec.forEach((d, i) => {
    const h = (d.p / maxD) * H2;
    mk('rect', { x: M.left + dw * i + dw * .18, y: y2 + H2 - h, width: dw * .64, height: Math.max(1, h), fill: 'var(--ink-soft)', opacity: .5, rx: 2 });
    txt(M.left + dw * (i + .5), y2 + H2 + (bigFmt ? 16 : 11), "'" + String(d.d).slice(2), { fs: bigFmt ? 14 : 9, anchor: 'middle', fill: 'var(--ink-muted)' });
    txt(M.left + dw * (i + .5), y2 + H2 - h - (bigFmt ? 12 : 8), Math.round(d.p * 100) + '%', { fs: bigFmt ? 14 : 9, anchor: 'middle', fill: 'var(--ink-muted)' });
  });
}

// --- tooltip ----------------------------------------------------------------
function in_tip(r) {
  const tt = document.getElementById('tooltip' + IN_N); if (!tt) return;
  const en = in_en(), s = in_state();
  let html = `<div style="font-weight:600;margin-bottom:3px;">${r.label}</div>`;
  // con n chico no promediamos: mostramos los partidos, que es lo que hay
  if (r.n <= 4) {
    html += `<div style="opacity:.75;margin-bottom:3px;">${r.n} ${en ? 'match' + (r.n > 1 ? 'es' : '') : 'partido' + (r.n > 1 ? 's' : '')}, ${en ? 'too few to average' : 'muy pocos para promediar'}</div>`;
    r.list.slice(0, 5).forEach(m => {
      html += `<div style="font-variant-numeric:tabular-nums;">${m[0]}: ${atlasCountryName(DATA_INST.teams[m[2]])} ${m[4]}-${m[5]} ${atlasCountryName(DATA_INST.teams[m[3]])}${m[8] ? (en ? ' (a.e.t.)' : ' (alargue)') : ''}</div>`;
    });
  } else {
    html += `<div><strong style="font-variant-numeric:tabular-nums;">${in_fmt(r.mean)}</strong> ${in_metricNoun()}</div>`;
    if (isFinite(r.ic.lo)) html += `<div style="opacity:.7;font-variant-numeric:tabular-nums;">${en ? 'range' : 'entre'} ${in_fmt(r.ic.lo)} ${en ? 'and' : 'y'} ${in_fmt(r.ic.hi)}</div>`;
    html += `<div style="opacity:.7;">${r.n.toLocaleString(en ? 'en' : 'es')} ${en ? 'matches' : 'partidos'}, ${r.eds} ${en ? 'editions' : 'ediciones'}</div>`;
  }
  tt.innerHTML = html; tt.style.display = 'block'; tt.style.opacity = '1';
}
function in_metricNoun() {
  const s = in_state(), en = in_en();
  if (s.metric === 'ig90') return en ? 'level at 90 minutes' : 'igualados a los 90 minutos';
  if (s.metric === 'et') return en ? 'went to extra time' : 'fueron al alargue';
  if (s.ref === 'cent') return en ? 'vs. its own World Cup' : 'respecto de su propio Mundial';
  return en ? 'goals per match' : 'goles por partido';
}
function in_tipMove() {
  const tt = document.getElementById('tooltip' + IN_N); if (!tt) return;
  const svg = document.getElementById('chart' + IN_N), rc = svg.getBoundingClientRect(), ev = in_tipMove._e;
  if (!ev) return;
  const x = ev.clientX - rc.left, w = tt.offsetWidth || 180;
  tt.style.left = ((x + 14 + w > rc.width || x > rc.width * .72) ? Math.max(2, x - w - 14) : (x + 14)) + 'px';
  tt.style.top = (ev.clientY - rc.top + 14) + 'px';
}
function in_tipHide() { const tt = document.getElementById('tooltip' + IN_N); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }
function in_pngMode() { return (typeof getActivePngFormat === 'function') && !!getActivePngFormat(); }

// --- draw -------------------------------------------------------------------
function drawInstancias() {
  const svg = document.getElementById('chart' + IN_N); if (!svg) return;
  svg.innerHTML = '';
  in_tipHide();
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!fmt || mobile;
  // El cuadro son nueve filas con dos renglones de texto cada una: en formatos
  // bajos (public da 619) los carriles quedan mas chicos que el bloque de etiqueta
  // y el n de una fila se monta sobre el nombre de la siguiente. Por eso el piso
  // de alto es mayor en el cuadro que en el reloj.
  const cuadro = in_state().view !== 'reloj';
  let W = 1100, H = cuadro ? 470 : 440;
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { W = PNG_FORMATS[fmt].vbW; H = Math.max(PNG_FORMATS[fmt].vbH, cuadro ? 730 : 600); }
  else if (mobile) H = cuadro ? 660 : 600;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, fmt);
  if (in_state().view === 'reloj') in_drawReloj(svg, W, H, bigFmt);
  else in_drawCuadro(svg, W, H, bigFmt);
  in_syncHeadings();
}

// --- headings ---------------------------------------------------------------
function in_pristine() {
  const s = in_state();
  return !in_touched && s.view === 'cuadro' && s.metric === 'goles' && s.win === '90' && s.ref === 'bruto' && !s.sel;
}
function in_subtitle() {
  const s = in_state(), en = in_en();
  if (s.view === 'reloj') return en
    ? 'When goals are scored, by minute: group stage vs. knockout. World Cups, ' + s.from + '-' + s.to + '.'
    : 'En qué minuto se hacen los goles, en grupos y en eliminación. Mundiales, ' + s.from + '-' + s.to + '.';
  const m = s.metric === 'ig90' ? (en ? 'Matches level at 90 minutes' : 'Partidos igualados a los 90 minutos')
    : s.metric === 'et' ? (en ? 'Matches that went to extra time' : 'Partidos que fueron al alargue')
    : s.ref === 'cent' ? (en ? 'Goals per match against the average of each World Cup' : 'Goles por partido respecto del promedio de cada Mundial')
    : (en ? 'Goals per match' : 'Goles por partido');
  return m + (en ? ', by stage of the World Cup, ' : ', según la instancia del Mundial, ') + s.from + '-' + s.to + '.';
}
function in_syncHeadings() {
  const sub = document.querySelector('[data-i18n="c10-subtitle"]');
  if (sub) sub.textContent = in_subtitle();
  const ttl = document.querySelector('[data-i18n="c10-title"]');
  if (ttl && !in_pristine()) { /* el titulo insight se mantiene: es el hallazgo, no el estado */ }
}
function in_sourceText(key) {
  const base = in_t(key, '');
  return base;
}

// --- controles --------------------------------------------------------------
function in_wireToggle(id, key, cb) {
  const box = document.getElementById(id); if (!box) return;
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    Array.from(box.querySelectorAll('button')).forEach(x => x.classList.toggle('active', x === b));
    in_touched = true;
    in_state()[key] = b.dataset[cb];
    in_syncCtrls();
    drawInstancias();
  });
}
function in_syncCtrls() {
  const s = in_state();
  // la referencia solo tiene sentido para goles; las proporciones no se centran
  const refG = document.getElementById('in-ref-group');
  if (refG) refG.style.display = s.metric === 'goles' ? '' : 'none';
  const winG = document.getElementById('in-win-group');
  if (winG) winG.style.display = (s.metric === 'goles' && s.view === 'cuadro') ? '' : 'none';
  const cuadroOnly = document.getElementById('in-cuadro-controls');
  if (cuadroOnly) cuadroOnly.style.display = s.view === 'cuadro' ? '' : 'none';
}
function in_renderChips() {
  const box = document.getElementById('in-selected-chips'); if (!box) return;
  box.innerHTML = '';
  in_selected().forEach(i => {
    const el = document.createElement('span');
    el.className = 'm-selected-chip';
    if (DATA_INST.inst[i] === '3er puesto') el.style.background = 'var(--accent)';
    el.textContent = in_instName(i);
    if (i !== IN_FLOOR) {
      const x = document.createElement('button');
      x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
      x.addEventListener('click', () => {
        in_touched = true;
        in_state().sel = in_selected().filter(k => k !== i);
        in_renderChips(); drawInstancias();
      });
      el.appendChild(x);
    }
    box.appendChild(el);
  });
}
function in_wireSearch() {
  const inp = document.getElementById('in-inst-search'), res = document.getElementById('in-inst-results');
  if (!inp || !res) return;
  const render = () => {
    const q = (inp.value || '').trim().toLowerCase();
    const sel = in_selected();
    const cand = DATA_INST.inst.map((_, i) => i)
      .filter(i => sel.indexOf(i) < 0 && (!q || in_instName(i).toLowerCase().indexOf(q) >= 0));
    res.innerHTML = '';
    if (!cand.length) { res.classList.remove('open'); return; }
    cand.forEach(i => {
      const d = document.createElement('div');
      d.className = 'm-search-result'; d.textContent = in_instName(i);
      d.addEventListener('mousedown', e => {
        e.preventDefault();
        in_touched = true;
        const cur = in_selected(); cur.push(i);
        in_state().sel = DATA_INST.inst.map((_, k) => k).filter(k => cur.indexOf(k) >= 0);
        inp.value = ''; res.classList.remove('open');
        in_renderChips(); drawInstancias();
      });
      res.appendChild(d);
    });
    res.classList.add('open');
  };
  inp.addEventListener('focus', render);
  inp.addEventListener('input', render);
  inp.addEventListener('blur', () => setTimeout(() => res.classList.remove('open'), 120));
}
function in_wireSlider() {
  const eds = DATA_INST.eds;
  const a = document.getElementById('in-slider-from'), b = document.getElementById('in-slider-to');
  const disp = document.getElementById('in-range-display'), act = document.getElementById('in-range-track-active');
  if (!a || !b) return;
  a.min = b.min = 0; a.max = b.max = eds.length - 1;
  a.value = 0; b.value = eds.length - 1;
  const MIN_EDS = 3;   // no dejamos pedir un recorte donde la final sea n=1
  const upd = () => {
    let i = +a.value, j = +b.value;
    if (j - i < MIN_EDS - 1) { if (document.activeElement === a) i = Math.max(0, j - (MIN_EDS - 1)); else j = Math.min(eds.length - 1, i + (MIN_EDS - 1)); a.value = i; b.value = j; }
    const s = in_state(); s.from = eds[i]; s.to = eds[j];
    if (disp) disp.textContent = s.from + '–' + s.to;
    if (act) { const p = 100 / (eds.length - 1); act.style.left = (i * p) + '%'; act.style.width = ((j - i) * p) + '%'; }
    in_touched = true;
    drawInstancias();
  };
  a.addEventListener('input', upd); b.addEventListener('input', upd);
  upd(); in_touched = false;
}
function in_setupCSV() {
  document.querySelectorAll('button.download[data-chart="' + IN_N + '-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'edicion,instancia,local,visitante,goles_local,goles_visitante,goles_primeros_90,igualado_a_los_90,fue_al_alargue\n';
    DATA_INST.m.forEach(m => {
      csv += [m[0], DATA_INST.inst[m[1]], DATA_INST.teams[m[2]], DATA_INST.teams[m[3]], m[4], m[5], m[6], m[7], m[8]].join(',') + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-instancias.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}
function initInstancias() {
  if (typeof DATA_INST === 'undefined') { console.error('DATA_INST no cargado'); return; }
  in_state();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawInstancias;
  window.onBeforePngExportGetSourceText = function (id) { return String(id) === String(IN_N) ? in_t('c10-sources-tpl', '') : null; };
  window.onBeforePngExportGetSubtitle = function (id) { return String(id) === String(IN_N) ? in_subtitle() : null; };
  in_wireToggle('in-tabs', 'view', 'view');
  in_wireToggle('in-metric', 'metric', 'metric');
  in_wireToggle('in-win', 'win', 'win');
  in_wireToggle('in-ref', 'ref', 'ref');
  in_wireSearch();
  in_renderChips();
  in_wireSlider();
  in_setupCSV();
  in_syncCtrls();
  drawInstancias();
}
