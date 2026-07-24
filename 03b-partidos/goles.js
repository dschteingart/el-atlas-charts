// =============================================================
//  Especial partidos — chart 9: goles por partido y diferencia de gol
// =============================================================
// Mismo molde que los charts 3/7 (motor props-chart.js), pero standalone para
// no tocar el motor compartido mientras la auditoria trabaja sobre el repo.
// Reusa lo REALMENTE compartido: tsDraw (ts-partidos.js) para las lineas,
// CONF_FIFA_COLORS (regions-fifa.js) para la paleta, el patron de chips+buscador,
// el boton "Limpiar" universal (lib/utils.js, engancha por id *-selected-chips)
// y los hooks de export PNG.
// Dos metricas (toggle): goles por partido y diferencia de gol promedio; ambas
// son promedios por partido = suma/den, con media movil ponderada por volumen.
// Dos vistas: Evolucion (lineas) y Comparacion (barras). Ambito: Mundo +
// confederaciones (sin pais). Datos: DATA_GOLES. Fila: [anio-1872, cat, partidos,
// goles, margen]. Serie anual hasta 2025.

let gl_cfg = null, gl_touched = false, gl_lastLang = null;
const GL_WORLD_COLOR = '#33312C';
const GL_CAT_PALETTE = ['#234B85', '#E0B84C', '#7A2A3F', '#7FA968', '#5B3A7A', '#5FB0BC', '#CFC9BC'];
// paleta de selecciones (tonos joya, sin terracota que es el acento de confederaciones)
const GL_TEAM_PALETTE = ['#A62A47', '#2D4B8E', '#147D64', '#6A3D99', '#C74E8B'];
const GL_TEAM_MAX = 5;
const GL_MIN = 1900;          // arranque por default del gráfico (el dato existe desde 1872, pero antes de 1900 son 4 selecciones británicas y ruido)
const GL_N = 9;
let gl_teamColorMap = {}, gl_teamsLoading = false, gl_teamMap = null;

function gl_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }
function gl_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function gl_state() {
  if (!state[GL_N]) state[GL_N] = {};
  const s = state[GL_N];
  if (!s.view) s.view = 'lines';
  if (!s.metric) s.metric = 'goles';          // 'goles' | 'margen'
  if (!Array.isArray(s.sel)) s.sel = ['W'];    // Mundo + confederaciones (chips removibles)
  if (s.cat == null) s.cat = 'ALL';
  if (!s.smooth) s.smooth = 'ma';
  if (!s.maYears) s.maYears = 4;
  if (!s.period) s.period = [GL_MIN, DATA_GOLES.y1];
  if (s.periodAuto == null) s.periodAuto = true;
  if (!s.barsBy) s.barsBy = 'cat';
  return s;
}
// metrica -> columna del numerador (den siempre col 2 = partidos):
//   goles por partido (3) · diferencia de gol con signo (4) · % empates (5) · % goleadas (6)
function gl_numIdx() { return ({ goles: 3, gd: 4, emp: 5, gol: 6 })[gl_state().metric] || 3; }
function gl_isPct() { const m = gl_state().metric; return m === 'emp' || m === 'gol'; }   // % (0-100)
function gl_isSigned() { return gl_state().metric === 'gd'; }                             // eje que cruza el 0
function gl_catName(k) { return gl_t('c6-cat-' + k, DATA_GOLES.cats[k]); }

// formato numerico: 2 decimales, coma decimal en es
function gl_fmt(v, dec) { const d = dec == null ? 2 : dec; const s = v.toFixed(d); return gl_lang() === 'en' ? s : s.replace('.', ','); }
// valor ya calculado (los % vienen en 0-100); withSign muestra el + en los positivos (diferencia)
function gl_fmtVal(v, withSign) { if (gl_isPct()) return Math.round(v) + '%'; const s = gl_fmt(v, 2); return (withSign && v > 0) ? '+' + s : s; }

// ---- selecciones individuales (lazy, con reintento; el server local corta) ---
function gl_hasTeams() { return typeof DATA_GOLES_TEAMS !== 'undefined'; }
function gl_ensureTeams(cb, tries) {
  if (gl_hasTeams()) { if (cb) cb(); return; }
  if (!tries) { if (gl_teamsLoading) return; gl_teamsLoading = true; }
  tries = tries || 0;
  const onerr = () => { if (tries < 5) setTimeout(() => gl_ensureTeams(cb, tries + 1), 350); else gl_teamsLoading = false; };
  const sc = document.createElement('script');
  sc.src = './data-goles-teams.js?v=' + (window.__ESP_V || '1') + '&r=' + tries;
  sc.onload = () => { if (gl_hasTeams()) { gl_teamsLoading = false; if (cb) cb(); } else onerr(); };
  sc.onerror = onerr;
  document.head.appendChild(sc);
}
function gl_teamRows(name) {
  if (!gl_hasTeams()) return null;
  if (!gl_teamMap) { gl_teamMap = new Map(); DATA_GOLES_TEAMS.forEach(o => gl_teamMap.set(o.n, o)); }
  const o = gl_teamMap.get(name); return o ? o.r : null;
}
// color FIJO por seleccion: primera ranura libre al agregar, se libera al sacar
function gl_teamColor(name) {
  if (gl_teamColorMap[name] == null) {
    const used = new Set(Object.values(gl_teamColorMap));
    let i = 0; while (i < GL_TEAM_PALETTE.length && used.has(i)) i++;
    gl_teamColorMap[name] = (i < GL_TEAM_PALETTE.length) ? i : (Object.keys(gl_teamColorMap).length % GL_TEAM_PALETTE.length);
  }
  return GL_TEAM_PALETTE[gl_teamColorMap[name]];
}
function gl_teamCount() { return (gl_state().sel || []).filter(gl_isTeam).length; }

// ---- ambito: filas / color / etiqueta (Mundo, confederacion o seleccion) -----
function gl_isConf(key) { return !!(typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[key]); }
function gl_isTeam(key) { return key !== 'W' && !gl_isConf(key); }
function gl_ambitoRows(key) { return key === 'W' ? DATA_GOLES.mundo : (DATA_GOLES.porConf[key] || gl_teamRows(key)); }
function gl_ambColor(key) { return key === 'W' ? GL_WORLD_COLOR : (gl_isConf(key) ? CONF_FIFA_COLORS[key] : gl_teamColor(key)); }
function gl_ambLabel(key) { return key === 'W' ? gl_t('pc-world', 'Mundo') : (gl_isConf(key) ? t('conf.' + key) : (typeof atlasCountryName === 'function' ? atlasCountryName(key) : key)); }

// ---- calculo ----------------------------------------------------------------
// suma movil hacia atras (para ratio ponderado por volumen; w<=1 => crudo)
function gl_ma(arr, w) {
  if (w <= 1) return arr.slice();
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) { let acc = 0; for (let j = Math.max(0, i - w + 1); j <= i; j++) acc += arr[j]; out[i] = acc; }
  return out;
}
// serie [[anio, valor]] de un ambito para una competencia; suaviza num y den por
// separado (media movil ponderada por volumen) y recien ahi divide
function gl_series(rows, cat, w) {
  if (!rows) return [];
  const y0 = DATA_GOLES.y0, N = DATA_GOLES.y1 - y0 + 1, mi = gl_numIdx();
  const num = new Array(N).fill(0), den = new Array(N).fill(0);
  for (let k = 0; k < rows.length; k++) { const r = rows[k]; if (cat !== 'ALL' && r[1] !== cat) continue; num[r[0]] += r[mi]; den[r[0]] += r[2]; }
  const nS = gl_ma(num, w), dS = gl_ma(den, w), pts = [], pct = gl_isPct();
  for (let i = 0; i < N; i++) if (dS[i] > 0) pts.push([y0 + i, pct ? nS[i] / dS[i] * 100 : nS[i] / dS[i]]);
  return pts;
}
function gl_lineSeries() {
  const s = gl_state(), w = s.smooth === 'ma' ? s.maYears : 1, out = [];
  (s.sel || []).forEach(key => {
    const rows = gl_ambitoRows(key); if (!rows) return;
    let pts = gl_series(rows, s.cat, w);
    // en "diferencia a favor" el Mundo no domina a nadie (es zero-sum): línea base en 0,
    // en vez de la ventaja de localía. Los equipos/confederaciones se desvían de ahí.
    if (s.metric === 'gd' && key === 'W') pts = pts.map(p => [p[0], 0]);
    out.push({ label: gl_ambLabel(key), color: gl_ambColor(key), width: key === 'W' ? 1.8 : undefined, pts });
  });
  return out;
}
// datos para barras: valor promedio por competencia o por confederacion, mas una
// barra de referencia con el promedio mundial
function gl_barData() {
  const s = gl_state(), a = s.period[0], b = s.period[1], y0 = DATA_GOLES.y0, mi = gl_numIdx(), pct = gl_isPct();
  const inP = (yoff) => { const y = y0 + yoff; return y >= a && y <= b; };
  const bv = (n, d) => d > 0 ? (pct ? n / d * 100 : n / d) : 0;
  const byCat = s.barsBy === 'cat' && s.metric !== 'gd';   // en "diferencia a favor" solo por confederación (dominio); por competencia seria localia, no dominio
  let wn = 0, wd = 0;
  for (const r of DATA_GOLES.mundo) { if (!inP(r[0])) continue; if (!byCat && s.cat !== 'ALL' && r[1] !== s.cat) continue; wn += r[mi]; wd += r[2]; }
  const worldBar = { label: gl_t('pc-world-avg', 'Mundo (promedio)'), color: GL_WORLD_COLOR, val: bv(wn, wd), den: wd, world: true };
  let out;
  if (byCat) {
    const num = new Array(7).fill(0), den = new Array(7).fill(0);
    for (const r of DATA_GOLES.mundo) { if (!inP(r[0])) continue; num[r[1]] += r[mi]; den[r[1]] += r[2]; }
    out = DATA_GOLES.cats.map((nm, k) => ({ label: gl_catName(k), color: GL_CAT_PALETTE[k], val: bv(num[k], den[k]), den: den[k] })).filter(o => o.den > 0);
  } else {
    const cat = s.cat;
    out = CONF_FIFA_ORDER.map(cf => {
      const rows = gl_ambitoRows(cf); let num = 0, den = 0;
      for (const r of rows) { if (!inP(r[0])) continue; if (cat !== 'ALL' && r[1] !== cat) continue; num += r[mi]; den += r[2]; }
      return { label: gl_t('c6-conf-' + cf, t('conf.' + cf)), color: CONF_FIFA_COLORS[cf], val: bv(num, den), den };
    }).filter(o => o.den >= 10);
  }
  if (s.metric !== 'gd') out.push(worldBar);   // en diferencia a favor el Mundo es 0 (la línea del cero ya es la referencia)
  out.sort((x, y) => y.val - x.val);
  return out;
}

// ---- DRAW -------------------------------------------------------------------
function drawGoles() {
  const s = gl_state(), lang = gl_lang();
  if (lang !== gl_lastLang) { gl_lastLang = lang; if (gl_renderChips) gl_renderChips(); }
  if (s.view === 'bars') gl_drawBars(); else gl_drawLines();
  gl_applyHeadings();
}
function gl_drawEmpty() {
  const svg = document.getElementById('chart' + GL_N); if (!svg) return;
  svg.innerHTML = '';
  if (svg.__tsMove) { svg.removeEventListener('mousemove', svg.__tsMove); svg.removeEventListener('mouseleave', svg.__tsLeave); svg.__tsMove = null; svg.__tsLeave = null; }
  const tt = document.getElementById('tooltip' + GL_N); if (tt) { tt.style.display = 'none'; tt.style.opacity = '0'; }
  const vb = (svg.getAttribute('viewBox') || '0 0 1100 520').split(' ').map(Number);
  const W = vb[2] || 1100, H = vb[3] || 520, NS = 'http://www.w3.org/2000/svg';
  const e = document.createElementNS(NS, 'text');
  e.setAttribute('x', W / 2); e.setAttribute('y', H / 2); e.setAttribute('text-anchor', 'middle');
  e.style.fontFamily = 'var(--sans)'; e.style.fontSize = '16px'; e.setAttribute('fill', 'var(--muted, #8a857c)');
  e.textContent = gl_t('pc-empty', 'No hay partidos para mostrar con estos filtros.');
  svg.appendChild(e);
}
function gl_axisY() {
  const en = gl_lang() === 'en', m = gl_state().metric;
  if (m === 'gd') return en ? 'goal difference (net)' : 'diferencia de gol (a favor)';
  if (m === 'emp') return en ? '% of draws' : '% de empates';
  if (m === 'gol') return en ? '% blowouts (3+)' : '% de goleadas (3+)';
  return en ? 'goals per match' : 'goles por partido';
}
function gl_drawLines() {
  const s = gl_state(), series = gl_lineSeries(), a = s.period[0], b = s.period[1];
  if (!series.some(sr => sr.pts.some(p => p[0] >= a && p[0] <= b && p[1] != null))) { gl_drawEmpty(); return; }
  const signed = gl_isSigned(), pct = gl_isPct();
  let yMinArg = 0, yMaxArg = 'auto';
  if (signed) {   // rango simétrico con piso, para que el 0 quede centrado con sus bandas
    let mn = 0, mx = 0;
    series.forEach(sr => sr.pts.forEach(p => { if (p[0] >= a && p[0] <= b && p[1] != null) { if (p[1] < mn) mn = p[1]; if (p[1] > mx) mx = p[1]; } }));
    yMinArg = Math.min(-0.6, mn * 1.1);
    yMaxArg = Math.max(0.6, mx * 1.1);
  }
  tsDraw(GL_N, {
    svgId: 'chart' + GL_N, tooltipId: 'tooltip' + GL_N, mode: 'lines',
    xMin: s.period[0], xMax: s.period[1], yMax: yMaxArg, yMin: yMinArg, zeroBands: signed,
    yFmt: (v) => pct ? Math.round(v) + '%' : ((signed && v > 0 ? '+' : '') + gl_fmt(v, 1)),
    axisY: gl_axisY(),
    series, endValFmt: (v) => gl_fmtVal(v, signed),
    ttRows: (year) => series.map(sr => {
      const p = sr.pts.find(q => q[0] === year);
      return p && p[1] != null ? { label: sr.label, color: sr.color, v: gl_fmtVal(p[1], signed) } : null;
    }).filter(Boolean),
  });
}
function gl_drawBars() {
  const svg = document.getElementById('chart' + GL_N); if (!svg) return;
  svg.innerHTML = '';
  if (svg.__tsMove) { svg.removeEventListener('mousemove', svg.__tsMove); svg.removeEventListener('mouseleave', svg.__tsLeave); svg.__tsMove = null; svg.__tsLeave = null; }
  const tt = document.getElementById('tooltip' + GL_N); if (tt) { tt.style.display = 'none'; tt.style.opacity = '0'; }
  const NS = 'http://www.w3.org/2000/svg';
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!editorFormat || mobile;
  let W = 1100, H = 520;
  if (editorFormat && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[editorFormat]) { W = PNG_FORMATS[editorFormat].vbW; H = Math.max(PNG_FORMATS[editorFormat].vbH, 620); }
  else if (mobile) H = 700;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const rows = gl_barData();
  let fs = bigFmt ? 22 : 13;
  const _lPad = bigFmt ? 14 : 8, _lCap = Math.round(W * 0.46);
  const _lMeas = (str, size) => (typeof ts_measure === 'function') ? ts_measure(str, size, 500) : str.length * size * 0.56;
  const _lTexts = rows.map(r => String(r.label || ''));
  let _lWide = Math.max(0, ..._lTexts.map(tx => _lMeas(tx, fs)));
  while (fs > (bigFmt ? 14 : 10) && _lWide + _lPad + 8 > _lCap) { fs -= 1; _lWide = Math.max(0, ..._lTexts.map(tx => _lMeas(tx, fs))); }
  const M = { top: bigFmt ? 22 : 14, right: bigFmt ? 108 : 68, bottom: bigFmt ? 24 : 16, left: Math.min(_lCap, Math.max(bigFmt ? 260 : 150, Math.ceil(_lWide + _lPad + 8))) };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  // escala: con signo (diferencia) las barras divergen desde el 0; si no, desde la izquierda.
  // En el modo divergente reservamos espacio en las puntas para las etiquetas de valor,
  // así las negativas no se montan sobre las etiquetas de confederación.
  const signed = gl_isSigned();
  const gap = bigFmt ? 12 : 7;
  let x, zeroX;
  if (signed) {
    const rawMax = Math.max(...rows.map(r => r.val), 0.05), rawMin = Math.min(...rows.map(r => r.val), -0.05);
    const rawSpan = (rawMax - rawMin) || 1;
    const roomPx = Math.max(0, ...rows.map(r => _lMeas(gl_fmtVal(r.val, true), fs))) + gap + (bigFmt ? 10 : 6);
    const usable = Math.max(10, PW - 2 * roomPx);
    x = (v) => roomPx + ((v - rawMin) / rawSpan) * usable;
    zeroX = x(0);
  } else {
    const maxV = Math.max(0.1, ...rows.map(r => r.val)) * 1.02;
    x = (v) => (v / maxV) * PW; zeroX = 0;
  }
  const bh = rows.length ? Math.min(bigFmt ? 66 : 40, PH / rows.length * 0.72) : 20;
  const step = rows.length ? PH / rows.length : 0;
  const g = document.createElementNS(NS, 'g'); g.setAttribute('transform', `translate(${M.left},${M.top})`); svg.appendChild(g);
  const txt = (xx, yy, s2, opt) => {
    const e = document.createElementNS(NS, 'text');
    e.setAttribute('x', xx); e.setAttribute('y', yy); e.setAttribute('dy', '0.35em');
    e.style.fontFamily = 'var(--sans)'; e.style.fontSize = (opt && opt.fs || fs) + 'px';
    if (opt && opt.anchor) e.setAttribute('text-anchor', opt.anchor);
    if (opt && opt.weight) e.style.fontWeight = opt.weight;
    e.setAttribute('fill', (opt && opt.fill) || 'var(--ink)'); e.textContent = s2; g.appendChild(e); return e;
  };
  if (signed) {   // línea del 0
    const zl = document.createElementNS(NS, 'line'); zl.setAttribute('x1', zeroX); zl.setAttribute('x2', zeroX);
    zl.setAttribute('y1', -2); zl.setAttribute('y2', PH); zl.setAttribute('stroke', 'var(--ink-soft)'); zl.setAttribute('stroke-width', 1); zl.setAttribute('opacity', 0.55); g.appendChild(zl);
  }
  // Touch universal (criterio 3): NO gatear la hit-rect tras HAS_HOVER. En el celu
  // un tap dispara mouseenter/mousemove sinteticos, asi que el mismo handler de
  // mouse muestra el tooltip; el cierre tap-away global vive en lib/utils.js. Solo
  // se evita en export (editorFormat). Mismo patron que la vista Comparacion de
  // instancias.js. Antes, con && HAS_HOVER, la vista Barras no daba globito al tocar.
  const hover = !editorFormat;
  rows.forEach((d, i) => {
    const yy = i * step + step / 2, xv = x(d.val);
    const bx = signed ? Math.min(zeroX, xv) : 0, bw = Math.max(signed ? Math.abs(xv - zeroX) : xv, 1.5);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', bx); rect.setAttribute('y', yy - bh / 2); rect.setAttribute('width', bw); rect.setAttribute('height', bh);
    rect.setAttribute('fill', d.color); rect.setAttribute('rx', bigFmt ? 4 : 2);
    if (d.world) { rect.setAttribute('fill-opacity', 0.85); rect.setAttribute('stroke', GL_WORLD_COLOR); rect.setAttribute('stroke-dasharray', '4 3'); rect.setAttribute('stroke-width', 1); }
    g.appendChild(rect);
    txt(-(bigFmt ? 14 : 8), yy, d.label, { anchor: 'end', weight: d.world ? 700 : null });
    const neg = signed && d.val < 0;
    txt(neg ? xv - gap : xv + gap, yy, gl_fmtVal(d.val, signed), { weight: 700, anchor: neg ? 'end' : 'start' });
    if (hover) {
      const hit = document.createElementNS(NS, 'rect');
      hit.setAttribute('x', -M.left); hit.setAttribute('y', yy - step / 2); hit.setAttribute('width', W); hit.setAttribute('height', step);
      hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'default'; g.appendChild(hit);
      hit.addEventListener('mouseenter', () => { rect.setAttribute('fill-opacity', d.world ? 1 : 0.82); gl_barTip(d); });
      hit.addEventListener('mousemove', () => gl_tipMove());
      hit.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', d.world ? 0.85 : 1); gl_tipHide(); });
    }
  });
}
function gl_metricNoun() {
  const en = gl_lang() === 'en', m = gl_state().metric;
  if (m === 'gd') return en ? 'goal difference (net, per match)' : 'de diferencia de gol a favor, por partido';
  if (m === 'emp') return en ? 'of matches drawn' : 'de partidos empatados';
  if (m === 'gol') return en ? 'decided by 3+ goals' : 'de goleadas (3+ goles)';
  return en ? 'goals per match' : 'goles por partido';
}
function gl_barTip(d) {
  const tt = document.getElementById('tooltip' + GL_N); if (!tt) return;
  const noun = gl_metricNoun();
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${d.label}</div>`
    + `<div><strong style="font-variant-numeric:tabular-nums;">${gl_fmtVal(d.val, gl_isSigned())}</strong> ${noun}</div>`
    + `<div style="opacity:.7;">${d.den.toLocaleString(gl_lang() === 'en' ? 'en' : 'es')} ${gl_t('pc-matches', 'partidos')}</div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function gl_tipMove() {
  const tt = document.getElementById('tooltip' + GL_N); if (!tt) return;
  const svg = document.getElementById('chart' + GL_N); const rc = svg.getBoundingClientRect();
  const ev = gl_tipMove._e; if (!ev) return;
  const _x = ev.clientX - rc.left, _w = tt.offsetWidth || 160;
  tt.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
  tt.style.top = (ev.clientY - rc.top + 14) + 'px';
}
function gl_tipHide() { const tt = document.getElementById('tooltip' + GL_N); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

// ---- headings (titulo insight en pristino; subtitulo dinamico) --------------
function gl_pristine() {
  const s = gl_state();
  return !gl_touched && s.view === 'lines' && s.metric === 'goles' && s.cat === 'ALL' && (s.sel || []).length === 1 && s.sel[0] === 'W';
}
function gl_measurePhrase() {
  const en = gl_lang() === 'en', m = gl_state().metric;
  if (m === 'gd') return en ? 'Average goal difference (for/against) per match' : 'Diferencia de gol promedio a favor, por partido';
  if (m === 'emp') return en ? 'Share of matches drawn' : 'Porcentaje de partidos empatados';
  if (m === 'gol') return en ? 'Share of matches decided by 3+ goals' : 'Porcentaje de partidos ganados por 3 o más goles';
  return en ? 'Goals per match' : 'Goles por partido';
}
function gl_subtitle() {
  const s = gl_state(), en = gl_lang() === 'en', period = s.period[0] + '–' + s.period[1];
  const measure = gl_measurePhrase();
  if (s.view === 'bars') {
    const by = s.barsBy === 'cat' ? (en ? 'type of competition' : 'tipo de competencia') : (en ? 'confederation' : 'confederación');
    const lead = (s.barsBy === 'conf' && s.cat !== 'ALL') ? gl_catName(s.cat) + '. ' : '';
    return en ? `${lead}${measure}, by ${by} (${period}).` : `${lead}${measure}, por ${by} (${period}).`;
  }
  const maTxt = s.smooth === 'ma' ? (en ? `, ${s.maYears}-yr moving avg` : `, promedio móvil de ${s.maYears} años`) : '';
  if (s.cat === 'ALL') return en ? `${measure} in international football (${period}${maTxt}).` : `${measure} en el fútbol internacional (${period}${maTxt}).`;
  const cat = gl_catName(s.cat);
  return en ? `${cat}. ${measure} (${period}${maTxt}).` : `${cat}. ${measure} (${period}${maTxt}).`;
}
function gl_maActive() { const s = gl_state(); return s.view === 'lines' && s.smooth === 'ma'; }
function gl_maClause() {
  const s = gl_state(), en = gl_lang() === 'en', n = s.maYears;
  if (en) return n === 4 ? '4-year moving average (one window covers a full World Cup cycle).' : n + '-year moving average.';
  return n === 4 ? 'Promedio móvil de 4 años (una ventana cubre un ciclo mundialista completo).' : 'Promedio móvil de ' + n + ' años.';
}
function gl_sourceText(key) { const base = gl_t(key, ''); if (!gl_maActive()) return base || null; return (base ? base + ' ' : '') + gl_maClause(); }
function gl_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="' + GL_N + '"]') || document;
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[gl_lang()]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = gl_t(gl_pristine() ? 'c9-title' : 'c9-title-neutral', '');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = gl_subtitle();
  const srcTxt = gl_sourceText('c9-sources');
  if (srcTxt) document.querySelectorAll('[data-i18n="c9-sources"]').forEach(el => { el.textContent = srcTxt; });
}

// ---- controles --------------------------------------------------------------
function gl_syncCtx() {
  const s = gl_state(), lines = s.view === 'lines';
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  const effByCat = s.barsBy === 'cat' && s.metric !== 'gd';   // "diferencia a favor" fuerza por confederación
  show('gl-ambito-controls', lines);
  show('gl-smooth-group', lines);
  show('gl-ma-group', lines && s.smooth === 'ma');
  show('gl-barsby-group', !lines && s.metric !== 'gd');
  show('gl-cat-group', lines || !effByCat);
}
function gl_setupTabs() {
  const lb = document.getElementById('gl-tab-lines'), bb = document.getElementById('gl-tab-bars');
  if (!lb || !bb) return;
  const go = (v) => { if (gl_state().view === v) return; gl_state().view = v; gl_touched = true; sync(); drawGoles(); };
  function sync() { const v = gl_state().view; lb.classList.toggle('active', v === 'lines'); bb.classList.toggle('active', v === 'bars'); gl_syncCtx(); }
  lb.addEventListener('click', () => go('lines'));
  bb.addEventListener('click', () => go('bars'));
  sync();
}
function gl_setupMetric() {
  document.querySelectorAll('#gl-metric button').forEach(b => b.addEventListener('click', () => {
    if (gl_state().metric === b.dataset.metric) return;
    document.querySelectorAll('#gl-metric button').forEach(x => x.classList.toggle('active', x === b));
    gl_state().metric = b.dataset.metric; gl_touched = true; gl_syncCtx(); drawGoles();
  }));
}
function gl_setupCat() {
  const sel = document.getElementById('gl-cat-select'); if (!sel) return;
  sel.value = String(gl_state().cat);
  sel.addEventListener('change', () => {
    const s = gl_state(); s.cat = sel.value === 'ALL' ? 'ALL' : +sel.value; gl_touched = true;
    gl_autofitPeriod(); drawGoles();
  });
}
function gl_setupBarsBy() {
  document.querySelectorAll('#gl-barsby button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#gl-barsby button').forEach(x => x.classList.toggle('active', x === b));
    gl_state().barsBy = b.dataset.by; gl_syncCtx(); drawGoles();
  }));
}
function gl_setupSmooth() {
  document.querySelectorAll('#gl-smooth button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#gl-smooth button').forEach(x => x.classList.toggle('active', x === b));
    gl_state().smooth = b.dataset.smooth; gl_touched = true; gl_syncCtx(); drawGoles();
  }));
  const ma = document.getElementById('gl-ma'), val = document.getElementById('gl-ma-val');
  if (ma) {
    ma.value = gl_state().maYears; if (val) val.textContent = ma.value;
    ma.addEventListener('input', () => { gl_state().maYears = +ma.value; if (val) val.textContent = ma.value; gl_touched = true; drawGoles(); });
  }
}
function gl_seriesFirstYear(key) {
  const rows = gl_ambitoRows(key); if (!rows) return null;
  const s = gl_state(); let mn = null;
  for (const r of rows) { if (s.cat !== 'ALL' && r[1] !== s.cat) continue; if (r[2] > 0) { const y = r[0] + DATA_GOLES.y0; if (mn === null || y < mn) mn = y; } }
  return mn;
}
function gl_dataStartYear() {
  const s = gl_state(); let mn = null;
  (s.sel || []).forEach(key => { const y = gl_seriesFirstYear(key); if (y !== null && (mn === null || y < mn)) mn = y; });
  return Math.max(GL_MIN, mn === null ? DATA_GOLES.y0 : mn);   // piso 1900
}
function gl_autofitPeriod() {
  const s = gl_state(); if (s.periodAuto === false) return;
  const a = gl_dataStartYear();
  s.period = [Math.min(a, DATA_GOLES.y1 - 5), DATA_GOLES.y1];
  gl_updateSlider();
}
function gl_updateSlider() {
  const s = gl_state();
  const f = document.getElementById('gl-slider-from'), tt = document.getElementById('gl-slider-to');
  const disp = document.getElementById('gl-range-display'), tr = document.getElementById('gl-range-track-active');
  if (!f || !tt) return;
  f.value = s.period[0]; tt.value = s.period[1];
  if (disp) disp.textContent = `${s.period[0]}–${s.period[1]}`;
  if (tr) { const mn = +f.min, mx = +f.max, sp = mx - mn; if (sp > 0) { tr.style.left = ((s.period[0] - mn) / sp * 100) + '%'; tr.style.right = ((mx - s.period[1]) / sp * 100) + '%'; } }
}
function gl_setupSlider() {
  const f = document.getElementById('gl-slider-from'), tt = document.getElementById('gl-slider-to'); if (!f || !tt) return;
  const MINW = 5;
  f.addEventListener('input', () => { const s = gl_state(); let a = +f.value; if (a > s.period[1] - MINW) a = s.period[1] - MINW; s.period[0] = a; s.periodAuto = false; gl_touched = true; gl_updateSlider(); drawGoles(); });
  tt.addEventListener('input', () => { const s = gl_state(); let b = +tt.value; if (b < s.period[0] + MINW) b = s.period[0] + MINW; s.period[1] = b; s.periodAuto = false; gl_touched = true; gl_updateSlider(); drawGoles(); });
  gl_updateSlider();
}
// ambito: Mundo + confederaciones, mismo patron de chips+buscador que los hermanos.
// El contenedor de chips se llama *-selected-chips para que enganche el boton
// "Limpiar" universal (lib/utils.js) sin tocar lib.
let gl_renderChips = null;
function gl_setupAmbito() {
  const input = document.getElementById('gl-team-search'), results = document.getElementById('gl-team-results'), chips = document.getElementById('gl-selected-chips');
  if (!input || !results || !chips) return;
  function renderChips() {
    const s = gl_state(); chips.innerHTML = '';
    (s.sel || []).forEach(key => {
      const el = document.createElement('span'); el.className = 'm-selected-chip'; el.style.background = gl_ambColor(key);
      el.innerHTML = `<span>${gl_ambLabel(key)}</span>`;
      const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
      x.addEventListener('click', () => {
        gl_state().sel = (gl_state().sel || []).filter(v => v !== key);
        if (gl_isTeam(key)) delete gl_teamColorMap[key];   // liberar la ranura de color de la selección
        gl_touched = true; renderChips(); renderResults(); gl_autofitPeriod(); drawGoles();
      });
      el.appendChild(x); chips.appendChild(el);
    });
  }
  gl_renderChips = renderChips;
  // pool: Mundo + confederaciones + selecciones (lazy), menos lo ya elegido
  function pool() {
    const chosen = new Set(gl_state().sel || []), out = [];
    if (!chosen.has('W')) out.push({ key: 'W', label: gl_t('pc-world', 'Mundo'), alt: '' });
    CONF_FIFA_ORDER.forEach(cf => { if (!chosen.has(cf)) out.push({ key: cf, label: t('conf.' + cf), alt: gl_t('c6-conf-' + cf, '') }); });
    if (gl_hasTeams()) DATA_GOLES_TEAMS.forEach(o => { if (!chosen.has(o.n)) out.push({ key: o.n, label: (typeof atlasCountryName === 'function' ? atlasCountryName(o.n) : o.n), alt: o.n }); });
    return out;
  }
  function items() {
    const q = input.value.trim().toLowerCase();
    if (!q) return [];   // el desplegable aparece al escribir (mismo criterio que el resto de los charts)
    return pool().filter(o => o.label.toLowerCase().includes(q) || (o.alt || '').toLowerCase().includes(q) || o.key.toLowerCase().includes(q)).slice(0, 9);
  }
  function renderResults() {
    results.innerHTML = '';
    const teamFull = gl_teamCount() >= GL_TEAM_MAX;
    items().forEach(o => {
      const isTeam = gl_isTeam(o.key), blocked = isTeam && teamFull;
      const r = document.createElement('div'); r.className = 'm-search-result';
      const dot = isTeam ? '#c9c4ba' : gl_ambColor(o.key);   // país sin color hasta agregarlo
      r.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${dot};margin-right:7px;vertical-align:middle;"></span><span>${o.label}</span>`;
      if (blocked) { r.style.opacity = '0.4'; r.style.cursor = 'not-allowed'; r.title = gl_t('pc-team-max', ''); }
      r.addEventListener('mousedown', (e) => {
        e.preventDefault(); if (isTeam && gl_teamCount() >= GL_TEAM_MAX) return;
        gl_state().sel = (gl_state().sel || []).concat(o.key); gl_touched = true;
        input.value = ''; results.classList.remove('open'); renderChips(); gl_autofitPeriod(); drawGoles();
      });
      results.appendChild(r);
    });
    results.classList.toggle('open', results.children.length > 0);
  }
  input.addEventListener('focus', () => { gl_ensureTeams(renderResults); renderResults(); });
  input.addEventListener('input', () => { gl_ensureTeams(renderResults); renderResults(); });
  input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 130));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); } });
  renderChips();
}
function gl_setupCSV() {
  document.querySelectorAll('button.download[data-chart="' + GL_N + '-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'anio,cat,partidos,goles_totales,dif_gol_con_signo,empates,goleadas_3plus\n';
    DATA_GOLES.mundo.forEach(r => { csv += `${r[0] + DATA_GOLES.y0},${DATA_GOLES.cats[r[1]]},${r[2]},${r[3]},${r[4]},${r[5]},${r[6]}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-goles.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initGoles() {
  gl_state();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawGoles;
  window.onBeforePngExportGetSourceText = function (chartId) { return String(chartId) === String(GL_N) ? gl_sourceText('c9-sources-tpl') : null; };
  window.onBeforePngExportGetSubtitle = function (chartId) { return String(chartId) === String(GL_N) ? gl_subtitle() : null; };
  drawGoles();
  gl_setupTabs();
  gl_setupMetric();
  gl_setupCat();
  gl_setupBarsBy();
  gl_setupSmooth();
  gl_setupSlider();
  gl_setupAmbito();
  gl_setupCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initGoles._wired) { initGoles._wired = true; window.addEventListener('atlas-editor-change', () => drawGoles()); }
  document.getElementById('chart' + GL_N)?.addEventListener('mousemove', (e) => { gl_tipMove._e = e; });
  setTimeout(() => gl_ensureTeams(), 400);   // precargar selecciones para el buscador
}
