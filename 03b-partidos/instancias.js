// Chart 10 del especial: los goles segun la instancia del Mundial.
//
// Una fila por instancia en orden de llave (no ordenadas por valor), con un punto
// por edicion y el promedio. No hay serie anual por instancia a proposito: la final
// es n=1 por edicion, asi que una linea seria ruido dibujado con cara de tendencia.
//
// Los dos toggles que importan (ver build_instancias_data.py):
//  - Ventana: "primeros 90 minutos" iguala la duracion entre instancias. Grupos
//    dura 90; la eliminacion dura 90 o 120 segun su propio marcador, asi que el
//    partido completo compara unidades de distinto largo.
//  - Referencia: "contra el promedio de su propio Mundial" mata el efecto epoca.
//    Sin eso comparas instancias que cubren epocas distintas (el 3er puesto solo
//    1934-2022, los 32avos solo 2026) con goles/partido cayendo de ~5 a ~2,5.
//
// Los dos formatos que existieron en una sola epoca (la segunda fase de grupos de
// 1974-1982 y la ronda final de 1950) van ocultos por default detras de un toggle:
// no son instancias del cuadro actual y meten ruido en la lectura principal.

const IN_N = 10;
let in_touched = false;

function in_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function in_en() { return in_lang() === 'en'; }
function in_t(key, fb) { const v = (typeof t === 'function') ? t(key) : key; return (v && v !== key) ? v : fb; }
function in_state() {
  if (!state[IN_N]) {
    state[IN_N] = {
      metric: 'goles',       // goles | ig90
      win: '90',             // 90 | full
      ref: 'bruto',          // bruto | cent
      hist: false,           // mostrar los formatos de una sola epoca
      from: DATA_INST.eds[0],
      to: DATA_INST.eds[DATA_INST.eds.length - 1],
    };
  }
  return state[IN_N];
}

function in_instName(i) {
  const es = DATA_INST.inst[i];
  if (!in_en()) return es;
  return ({
    'Fase de grupos': 'Group stage', '32avos': 'Round of 32', 'Octavos': 'Round of 16',
    'Cuartos': 'Quarter-finals', 'Semis': 'Semi-finals', '3er puesto': 'Third-place match',
    'Final': 'Final', '2da fase de grupos': 'Second group stage', 'Ronda final 1950': 'Final round 1950',
  })[es] || es;
}
function in_visibles() {
  const n = DATA_INST.n_princ;
  const base = DATA_INST.inst.map((_, i) => i).slice(0, n);
  return in_state().hist ? base.concat(DATA_INST.inst.map((_, i) => i).slice(n)) : base;
}

// --- datos ------------------------------------------------------------------
// Un partido: [ed, inst, local, visit, gl, gv, g90, ig90, et]
function in_goles(m) { return in_state().win === '90' ? m[6] : (m[4] + m[5]); }

// Promedio de goles de cada edicion dentro del recorte activo: es la referencia
// para centrar, o sea comparar cada partido contra el Mundial en el que se jugo.
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
function in_val(m, edm) {
  const s = in_state();
  if (s.metric === 'ig90') return m[7];
  const g = in_goles(m);
  return (s.ref === 'cent') ? g - edm[m[0]] : g;
}
function in_isPct() { return in_state().metric === 'ig90'; }
function in_isCent() { return in_state().metric === 'goles' && in_state().ref === 'cent'; }

function in_rows() {
  const ms = in_matches(), edm = in_edMeans(ms);
  const by = {};
  ms.forEach(m => { (by[m[1]] = by[m[1]] || []).push(m); });
  return in_visibles().map(i => {
    const list = by[i] || [];
    const n = list.length;
    if (!n) return null;
    const vals = list.map(m => in_val(m, edm));
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    // un punto por edicion (con proporciones no aplica: con n=1 una proporcion es 0% o 100%)
    const pe = {};
    list.forEach(m => { const e = m[0]; (pe[e] = pe[e] || []).push(in_val(m, edm)); });
    const pts = Object.keys(pe).map(e => ({
      ed: +e, v: pe[e].reduce((a, b) => a + b, 0) / pe[e].length, n: pe[e].length,
    })).sort((a, b) => a.ed - b.ed);
    let max = null, min = null;
    pts.forEach(p => { if (!max || p.v > max.v) max = p; if (!min || p.v < min.v) min = p; });
    return {
      i, n, label: in_instName(i), mean, pts, list, max, min,
      eds: pts.length,
      raro: i >= DATA_INST.n_princ,
      nueva: pts.length === 1 && pts[0].ed === DATA_INST.eds[DATA_INST.eds.length - 1],
    };
  }).filter(Boolean);
}
function in_fmt(v) {
  if (in_isPct()) return (v * 100).toFixed(1).replace('.', in_en() ? '.' : ',') + '%';
  const s = v.toFixed(2).replace('.', in_en() ? '.' : ',');
  return (in_isCent() && v > 0) ? '+' + s : s;
}
function in_pngMode() { return (typeof getActivePngFormat === 'function') && !!getActivePngFormat(); }

// --- dibujo -----------------------------------------------------------------
function in_draw(svg, W, H, bigFmt, rows) {
  const NS = 'http://www.w3.org/2000/svg';
  const FS = bigFmt ? 22 : 13, FSN = bigFmt ? 15 : 9.5, FSV = bigFmt ? 20 : 12;
  const meas = (s, sz, w) => (typeof ts_measure === 'function') ? ts_measure(s, sz, w || 500) : s.length * sz * 0.56;
  const labW = Math.max(0, ...rows.map(r => meas(r.label, FS, 600)));
  const subW = Math.max(0, ...rows.map(r => meas(in_subLabel(r), FSN, 400)));
  const M = {
    top: bigFmt ? 46 : 32, bottom: bigFmt ? 50 : 34,
    left: Math.ceil(Math.max(labW, subW) + (bigFmt ? 46 : 30)),
    right: bigFmt ? 60 : 38,
  };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const nRaros = rows.filter(r => r.raro).length;
  const lanes = rows.length + (nRaros ? 0.55 : 0);
  const LANE = PH / lanes;
  const rowY = [];
  let acc = 0;
  rows.forEach((r, k) => {
    if (r.raro && (k === 0 || !rows[k - 1].raro)) acc += 0.55;
    rowY.push(M.top + LANE * (acc + 0.5));
    acc += 1;
  });

  const vals = [];
  rows.forEach(r => { r.pts.forEach(p => vals.push(p.v)); vals.push(r.mean); });
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (in_isPct()) { lo = 0; hi = Math.max(hi * 1.08, 0.45); }
  else if (in_isCent()) { const a = Math.max(Math.abs(lo), Math.abs(hi)) * 1.06; lo = -a; hi = a; }
  else { lo = 0; hi = hi * 1.05; }
  const X = v => M.left + ((v - lo) / ((hi - lo) || 1)) * PW;

  const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
  const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); g.appendChild(e); return e; };
  const txt = (x, y, s, o) => {
    const e = mk('text', { x, y, dy: '0.35em' });
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = ((o && o.fs) || FS) + 'px';
    if (o && o.anchor) e.setAttribute('text-anchor', o.anchor);
    if (o && o.weight) e.style.fontWeight = o.weight;
    if (o && o.italic) e.style.fontStyle = 'italic';
    e.setAttribute('fill', (o && o.fill) || 'var(--ink)');
    e.textContent = s; return e;
  };
  const ticks = in_isPct() ? [0, .1, .2, .3, .4] : in_isCent() ? [-2, -1, 0, 1, 2, 3] : [0, 2, 4, 6, 8];
  ticks.filter(v => v >= lo && v <= hi).forEach(v => {
    const cero = in_isCent() && v === 0;
    mk('line', { x1: X(v), x2: X(v), y1: M.top - (bigFmt ? 14 : 9), y2: H - M.bottom + 2, stroke: cero ? 'var(--ink-soft)' : 'var(--rule)', 'stroke-width': cero ? 1.3 : 1, 'stroke-dasharray': cero ? '' : '2 3' });
    txt(X(v), M.top - (bigFmt ? 24 : 16), in_isPct() ? Math.round(v * 100) + '%' : ((in_isCent() && v > 0 ? '+' : '') + v), { fs: bigFmt ? 15 : 9.5, anchor: 'middle', fill: 'var(--ink-muted)' });
  });
  txt(M.left, H - (bigFmt ? 16 : 11), in_axisLabel(), { fs: bigFmt ? 16 : 10, fill: 'var(--ink-muted)' });

  // REGLA DE LA CASA: el tooltip NO se gatea tras HAS_HOVER. En touch HAS_HOVER es
  // false y el listener no se anclaba nunca, o sea que en el celu no habia tooltip.
  // Un tap emite mouseenter/mousemove sinteticos, asi que el handler de mouse
  // alcanza, y el cierre por tap-away global ya vive en lib/utils.js.
  const hover = !in_pngMode();
  // El resaltado si se gatea a desktop: en touch no hay mouseleave y quedaria
  // pegado, con el resto de las filas apagadas para siempre.
  const puedeResaltar = (typeof HAS_HOVER === 'undefined') || HAS_HOVER;
  const grupos = [];
  const COL = 'var(--ink)';
  rows.forEach((r, k) => {
    const y = rowY[k];
    const gr = document.createElementNS(NS, 'g'); g.appendChild(gr); grupos.push(gr);
    const mkr = (tag, at) => { const e = document.createElementNS(NS, tag); for (const kk in at) e.setAttribute(kk, at[kk]); gr.appendChild(e); return e; };
    if (r.raro && (k === 0 || !rows[k - 1].raro)) {
      mk('line', { x1: M.left - (bigFmt ? 34 : 22), x2: W - M.right, y1: y - LANE * 0.62, y2: y - LANE * 0.62, stroke: 'var(--rule)', 'stroke-width': 1 });
    }
    const lx = M.left - (bigFmt ? 20 : 13);
    gr.appendChild(txt(lx, y - (bigFmt ? 15 : 9), r.label, { anchor: 'end', weight: 500, fill: 'var(--ink)', italic: r.raro }));
    gr.appendChild(txt(lx, y + (bigFmt ? 18 : 10.5), in_subLabel(r), { anchor: 'end', fs: FSN, fill: 'var(--ink-muted)' }));
    if (!in_isPct()) {
      r.pts.forEach(p => {
        const rad = Math.min(bigFmt ? 11 : 6.5, (bigFmt ? 3.4 : 2) + Math.sqrt(p.n) * (bigFmt ? .9 : .55));
        const c = mkr('circle', { cx: X(p.v), cy: y, r: rad, fill: COL, opacity: .2 });
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = p.ed + ': ' + in_fmt(p.v) + ' (' + p.n + ' ' + (in_en() ? 'match' + (p.n > 1 ? 'es' : '') : 'partido' + (p.n > 1 ? 's' : '')) + ')';
        c.appendChild(ti);
      });
    } else {
      const bh = Math.min(bigFmt ? 26 : 15, LANE * .46);
      mkr('rect', { x: X(0), y: y - bh / 2, width: Math.max(1.5, X(r.mean) - X(0)), height: bh, fill: COL, opacity: .5, rx: bigFmt ? 3 : 2 });
    }
    mkr('line', { x1: X(r.mean), x2: X(r.mean), y1: y - (bigFmt ? 14 : 8.5), y2: y + (bigFmt ? 14 : 8.5), stroke: COL, 'stroke-width': bigFmt ? 5 : 3.4 });
    const vl = in_isPct()
      ? txt(X(r.mean) + (bigFmt ? 14 : 9), y, in_fmt(r.mean), { fs: FSV, anchor: 'start', weight: 700 })
      : txt(Math.max(M.left + (bigFmt ? 22 : 14), Math.min(W - M.right - (bigFmt ? 22 : 14), X(r.mean))),
            y - (bigFmt ? 24 : 14.5), in_fmt(r.mean), { fs: FSV, anchor: 'middle', weight: 700 });
    gr.appendChild(vl);
    if (r.nueva) {
      const gapV = bigFmt ? 14 : 9;
      const nx = in_isPct() ? X(r.mean) + gapV + meas(in_fmt(r.mean), FSV, 700) + gapV : X(r.mean) + (bigFmt ? 26 : 16);
      gr.appendChild(txt(nx, y + (bigFmt ? 6 : 4), in_t('c10-nueva', in_en() ? 'debut 2026' : 'estreno 2026'), { fs: bigFmt ? 15.5 : 8.5, fill: 'var(--ink-muted)', italic: true }));
    }
    if (hover) {
      const hit = mk('rect', { x: 0, y: y - LANE / 2, width: W, height: LANE, fill: 'transparent' });
      hit.style.cursor = 'default';
      hit.addEventListener('mouseenter', () => {
        if (puedeResaltar) grupos.forEach((o, j) => o.setAttribute('opacity', j === k ? 1 : .25));
        in_tip(r);
      });
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
  const w = s.win === '90' ? (en ? 'first 90 minutes' : 'primeros 90 minutos') : (en ? 'full match, extra time included' : 'partido completo, alargue incluido');
  return (s.ref === 'cent')
    ? (en ? 'goals vs. the average of its own World Cup (' + w + ')' : 'goles respecto del promedio de su propio Mundial (' + w + ')')
    : (en ? 'goals per match (' + w + ')' : 'goles por partido (' + w + ')');
}

// --- tooltip ----------------------------------------------------------------
function in_tip(r) {
  const tt = document.getElementById('tooltip' + IN_N); if (!tt) return;
  const en = in_en();
  let html = `<div style="font-weight:600;margin-bottom:3px;">${r.label}</div>`;
  // con n chico no promediamos: mostramos los partidos, que es lo que hay
  if (r.n <= 4) {
    html += `<div style="opacity:.75;margin-bottom:3px;">${r.n} ${en ? 'match' + (r.n > 1 ? 'es' : '') : 'partido' + (r.n > 1 ? 's' : '')}, ${en ? 'too few to average' : 'muy pocos para promediar'}</div>`;
    r.list.slice(0, 5).forEach(m => {
      html += `<div style="font-variant-numeric:tabular-nums;">${m[0]}: ${atlasCountryName(DATA_INST.teams[m[2]])} ${m[4]}-${m[5]} ${atlasCountryName(DATA_INST.teams[m[3]])}${m[8] ? (en ? ' (a.e.t.)' : ' (alargue)') : ''}</div>`;
    });
  } else {
    html += `<div><strong style="font-variant-numeric:tabular-nums;">${in_fmt(r.mean)}</strong> ${in_metricNoun()}</div>`;
    html += `<div style="opacity:.7;">${r.n.toLocaleString(en ? 'en' : 'es')} ${en ? 'matches' : 'partidos'}, ${r.eds} ${en ? 'editions' : 'ediciones'}</div>`;
    // a que Mundial corresponden los extremos: sin esto los puntos de las puntas
    // son anonimos y no se puede leer la dispersion
    if (!in_isPct() && r.max && r.min && r.max.ed !== r.min.ed) {
      html += `<div style="margin-top:4px;font-variant-numeric:tabular-nums;">`
        + `<span style="opacity:.7;">${en ? 'Most' : 'Máximo'}:</span> <strong>${r.max.ed}</strong> (${in_fmt(r.max.v)})<br>`
        + `<span style="opacity:.7;">${en ? 'Fewest' : 'Mínimo'}:</span> <strong>${r.min.ed}</strong> (${in_fmt(r.min.v)})</div>`;
    }
  }
  tt.innerHTML = html; tt.style.display = 'block'; tt.style.opacity = '1';
  in_tipMove();   // en touch el tap puede no traer mousemove: lo ubicamos ya
}
function in_metricNoun() {
  const s = in_state(), en = in_en();
  if (s.metric === 'ig90') return en ? 'level at 90 minutes' : 'igualados a los 90 minutos';
  if (s.ref === 'cent') return en ? 'vs. its own World Cup' : 'respecto de su propio Mundial';
  return en ? 'goals per match' : 'goles por partido';
}
function in_tipMove() {
  const tt = document.getElementById('tooltip' + IN_N); if (!tt) return;
  // En pantalla angosta el tooltip NO flota bajo el dedo: se ancla al borde
  // inferior, asi la mano no tapa justo el dato que se quiere leer.
  const angosta = (typeof isMobileViewport === 'function')
    ? isMobileViewport() : window.matchMedia('(max-width: 768px)').matches;
  if (angosta) {
    tt.style.position = 'fixed';
    tt.style.left = '8px'; tt.style.right = '8px';
    tt.style.bottom = '8px'; tt.style.top = 'auto'; tt.style.maxWidth = 'none';
    return;
  }
  tt.style.position = ''; tt.style.right = ''; tt.style.bottom = ''; tt.style.maxWidth = '';
  const svg = document.getElementById('chart' + IN_N), rc = svg.getBoundingClientRect(), ev = in_tipMove._e;
  if (!ev) return;
  const x = ev.clientX - rc.left, w = tt.offsetWidth || 180;
  tt.style.left = ((x + 14 + w > rc.width || x > rc.width * .72) ? Math.max(2, x - w - 14) : (x + 14)) + 'px';
  tt.style.top = (ev.clientY - rc.top + 14) + 'px';
}
function in_tipHide() { const tt = document.getElementById('tooltip' + IN_N); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

// --- draw -------------------------------------------------------------------
function drawInstancias() {
  const svg = document.getElementById('chart' + IN_N); if (!svg) return;
  svg.innerHTML = '';
  in_tipHide();
  const rows = in_rows();
  if (!rows.length) return;
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!fmt || mobile;
  // El alto sigue a la cantidad de filas: con los formatos historicos ocultos son
  // siete, y dejar el alto de nueve sobraria espacio en blanco.
  //
  // En el celu el viewBox se angosta a 620 (no 1100). Con 1100 la escala contra un
  // telefono de ~412px es 0,375, asi que una tipografia de 22 termina en 8px
  // efectivos: ilegible. A 620 la escala sube a ~0,66 y esa misma tipografia
  // rinde ~15px. Ademas el alto pasa a formato retrato, para que el grafico llene
  // la pantalla en vez de quedar en una banda de 200px.
  let W = 1100, H = 92 + rows.length * 46;
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    W = PNG_FORMATS[fmt].vbW;
    H = Math.max(PNG_FORMATS[fmt].vbH, 150 + rows.length * 74);
  } else if (mobile) { W = 620; H = 128 + rows.length * 74; }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, fmt);
  in_draw(svg, W, H, bigFmt, rows);
  const sub = document.querySelector('[data-i18n="c10-subtitle"]');
  if (sub) sub.textContent = in_subtitle();
}
function in_subtitle() {
  const s = in_state(), en = in_en();
  const m = s.metric === 'ig90'
    ? (en ? 'Matches level at 90 minutes' : 'Partidos igualados a los 90 minutos')
    : s.ref === 'cent'
      ? (en ? 'Goals per match against the average of each World Cup' : 'Goles por partido respecto del promedio de cada Mundial')
      : (en ? 'Goals per match' : 'Goles por partido');
  return m + (en ? ', by stage of the World Cup, ' : ', según la instancia del Mundial, ') + s.from + '-' + s.to + '.';
}

// --- controles --------------------------------------------------------------
function in_wireToggle(id, key, dataKey) {
  const box = document.getElementById(id); if (!box) return;
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    Array.from(box.querySelectorAll('button')).forEach(x => x.classList.toggle('active', x === b));
    in_touched = true;
    const v = b.dataset[dataKey];
    in_state()[key] = (v === 'true') ? true : (v === 'false') ? false : v;
    in_syncCtrls();
    drawInstancias();
  });
}
function in_syncCtrls() {
  const s = in_state();
  // ventana y referencia solo aplican a los goles: una proporcion no se centra
  ['in-win-group', 'in-ref-group'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = s.metric === 'goles' ? '' : 'none';
  });
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
  in_wireToggle('in-metric', 'metric', 'metric');
  in_wireToggle('in-win', 'win', 'win');
  in_wireToggle('in-ref', 'ref', 'ref');
  in_wireToggle('in-hist', 'hist', 'hist');
  in_wireSlider();
  in_setupCSV();
  in_syncCtrls();
  drawInstancias();
}
