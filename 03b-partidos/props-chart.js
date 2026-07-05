// =============================================================
//  Especial partidos — motor compartido de los charts 3 y 7
// =============================================================
// Charts gemelos ("% de partidos con la propiedad X, año a año"):
//   3 globalización → métrica 'cru' (partidos entre confederaciones)
//   7 neutral       → métrica 'neu' (partidos en cancha neutral)
// Dos vistas: Evolución (líneas, % en el tiempo, vía tsDraw) y Comparación
// (barras, % por competencia o por confederación). Controles compartidos con
// el resto del especial: ámbito (Mundo + confederaciones + país), competencia,
// suavizado (anual/móvil), período. Datos: DATA_PROPS (mundo/confed inline) +
// DATA_PROPS_TEAMS (países, lazy). Fila: [anio-1872, cat, total, neutral, cruce].

let pc_cfg = null;                 // config del chart activo (uno por página)
let pc_teamsLoading = false, pc_teamMap = null, pc_touched = false;
const PC_WORLD_COLOR = '#33312C';
const PC_CAT_PALETTE = ['#234B85', '#E0B84C', '#7A2A3F', '#7FA968', '#5B3A7A', '#5FB0BC', '#CFC9BC'];
// Paleta de países: como ahora conviven con las líneas de confederación, tiene
// que separarse de la paleta tierra de las confederaciones (que ya ocupa azul
// pizarra, oro, oliva, violeta, terracota y turquesa). Usamos tonos joya más
// saturados (vino, índigo, pino, púrpura, orquídea) sin terracota (el acento).
const PC_TEAM_PALETTE = ['#A62A47', '#2D4B8E', '#147D64', '#6A3D99', '#C74E8B'];
const PC_TEAM_MAX = 5;

function pc_t(k, fb) { return ((typeof t === 'function' ? t(k) : '') || fb); }
function pc_state() {
  const n = pc_cfg.n;
  if (!state[n]) state[n] = {};
  const s = state[n];
  if (!s.view) s.view = 'lines';
  // ámbito unificado: un solo arreglo de "series a mostrar" (Mundo + confederaciones
  // + países), todo elegido desde el mismo buscador y visible como chips removibles.
  // Antes eran controles separados (toggle Mundo, toggles confed, buscador país):
  // se unificó para que sea el mismo criterio que en los otros charts del especial.
  if (!Array.isArray(s.sel)) s.sel = ['W'];
  if (s.cat == null) s.cat = 'ALL';
  if (!s.smooth) s.smooth = 'ma';
  if (!s.maYears) s.maYears = 4;
  // por default, TODO el período posible (no arrancar recortado ni auto-reconfigurar
  // el slider al cambiar de competencia: eso confunde). La línea simplemente no
  // dibuja en los años sin datos de esa competencia.
  if (!s.period) s.period = [DATA_PROPS.y0, DATA_PROPS.y1];
  // el slider auto-ajusta su arranque al primer año con datos de lo mostrado
  // (Mundo → 1872; una confederación → su primer partido). Deja de auto-ajustar
  // en cuanto el usuario mueve el slider a mano.
  if (s.periodAuto == null) s.periodAuto = true;
  if (!s.barsBy) s.barsBy = 'cat';
  return s;
}
function pc_metricIdx() { return pc_cfg.metric === 'neu' ? 3 : 4; }
function pc_catName(k) { return pc_t('c6-cat-' + k, DATA_PROPS.cats[k]); }

// ---- datos: países lazy -----------------------------------------------------
function pc_hasTeams() { return typeof DATA_PROPS_TEAMS !== 'undefined'; }
function pc_ensureTeams(cb) {
  if (pc_hasTeams()) { if (cb) cb(); return; }
  if (pc_teamsLoading) return;
  pc_teamsLoading = true;
  const sc = document.createElement('script');
  sc.src = './data-props-teams.js?v=' + (window.__ESP_V || '1');
  sc.onload = () => { pc_teamsLoading = false; if (cb) cb(); };
  sc.onerror = () => { pc_teamsLoading = false; };
  document.head.appendChild(sc);
}
function pc_teamRows(name) {
  if (!pc_hasTeams()) return null;
  if (!pc_teamMap) { pc_teamMap = new Map(); DATA_PROPS_TEAMS.forEach(o => pc_teamMap.set(o.n, o)); }
  const o = pc_teamMap.get(name); return o ? o.r : null;
}
function pc_ambitoRows(key) {
  if (key === 'W') return DATA_PROPS.mundo;
  if (DATA_PROPS.porConf[key]) return DATA_PROPS.porConf[key];
  return pc_teamRows(key);
}

// ---- cálculo ----------------------------------------------------------------
// promedio móvil hacia atrás (w<=1 => crudo)
function pc_ma(arr, w) {
  if (w <= 1) return arr.slice();
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let acc = 0, k = 0;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) { acc += arr[j]; k++; }
    out[i] = acc;   // suma (para ratio ponderado por volumen)
  }
  return out;
}
// serie [[año, %]] de un ámbito para una competencia; suaviza num y den por
// separado (promedio móvil ponderado por volumen) y recién ahí divide
function pc_pct(rows, cat, w) {
  if (!rows) return [];
  const y0 = DATA_PROPS.y0, N = DATA_PROPS.y1 - y0 + 1, mi = pc_metricIdx();
  const num = new Array(N).fill(0), den = new Array(N).fill(0);
  for (let k = 0; k < rows.length; k++) {
    const r = rows[k]; if (cat !== 'ALL' && r[1] !== cat) continue;
    num[r[0]] += r[mi]; den[r[0]] += r[2];
  }
  const nS = pc_ma(num, w), dS = pc_ma(den, w), pts = [];
  for (let i = 0; i < N; i++) if (dS[i] > 0) pts.push([y0 + i, nS[i] / dS[i] * 100]);
  return pts;
}
// ---- ámbito: color y etiqueta por ítem (Mundo / confederación / país) -------
// Color FIJO por ítem, como en el chart 6: Mundo carbón; cada confederación su
// color; cada país una ranura de la paleta que se le asigna al agregarlo y se
// libera al sacarlo. Nunca se reasigna por índice del arreglo (si sacás el 1ro,
// los demás NO cambian de color).
let pc_teamColorMap = {};
function pc_isConf(key) { return !!(typeof CONF_FIFA_COLORS !== 'undefined' && CONF_FIFA_COLORS[key]); }
function pc_isTeam(key) { return key !== 'W' && !pc_isConf(key); }
function pc_teamColor(name) {
  if (pc_teamColorMap[name] == null) {
    const used = new Set(Object.values(pc_teamColorMap));
    let i = 0; while (i < PC_TEAM_PALETTE.length && used.has(i)) i++;   // primera ranura libre
    pc_teamColorMap[name] = (i < PC_TEAM_PALETTE.length) ? i : (Object.keys(pc_teamColorMap).length % PC_TEAM_PALETTE.length);
  }
  return PC_TEAM_PALETTE[pc_teamColorMap[name]];
}
function pc_ambColor(key) { return key === 'W' ? PC_WORLD_COLOR : (pc_isConf(key) ? CONF_FIFA_COLORS[key] : pc_teamColor(key)); }
function pc_ambLabel(key) {
  if (key === 'W') return pc_t('pc-world', 'Mundo');
  if (pc_isConf(key)) return t('conf.' + key);
  return (typeof atlasCountryName === 'function' ? atlasCountryName(key) : key);
}
function pc_teamCount() { return (pc_state().sel || []).filter(pc_isTeam).length; }

// series para la vista líneas: una por cada ítem del ámbito (Mundo/confed/país)
function pc_lineSeries() {
  const s = pc_state(), w = s.smooth === 'ma' ? s.maYears : 1, out = [];
  (s.sel || []).forEach(key => {
    const rows = pc_ambitoRows(key); if (!rows) return;   // país aún no cargado (lazy)
    out.push({ label: pc_ambLabel(key), color: pc_ambColor(key), width: key === 'W' ? 1.8 : undefined, pts: pc_pct(rows, s.cat, w) });
  });
  return out;
}
// datos para la vista barras. Incluye una barra de referencia con el promedio
// mundial (gris carbón), para que se lea contra qué se compara cada categoría.
function pc_barData() {
  const s = pc_state(), a = s.period[0], b = s.period[1], y0 = DATA_PROPS.y0, mi = pc_metricIdx();
  const inP = (yoff) => { const y = y0 + yoff; return y >= a && y <= b; };
  const byCat = s.barsBy === 'cat';
  // barra de referencia: mundo (para la competencia elegida si comparamos confeds)
  let wn = 0, wd = 0;
  for (const r of DATA_PROPS.mundo) { if (!inP(r[0])) continue; if (!byCat && s.cat !== 'ALL' && r[1] !== s.cat) continue; wn += r[mi]; wd += r[2]; }
  const worldBar = { label: pc_t('pc-world-avg', 'Mundo (promedio)'), color: PC_WORLD_COLOR, pct: wd > 0 ? wn / wd * 100 : 0, den: wd, world: true };
  let out;
  if (byCat) {
    const num = new Array(7).fill(0), den = new Array(7).fill(0);
    for (const r of DATA_PROPS.mundo) { if (!inP(r[0])) continue; num[r[1]] += r[mi]; den[r[1]] += r[2]; }
    out = DATA_PROPS.cats.map((nm, k) => ({ label: pc_catName(k), color: PC_CAT_PALETTE[k], pct: den[k] > 0 ? num[k] / den[k] * 100 : 0, den: den[k] }))
      .filter(o => o.den > 0);
  } else {
    const cat = s.cat;
    out = CONF_FIFA_ORDER.map(cf => {
      const rows = pc_ambitoRows(cf); let num = 0, den = 0;
      for (const r of rows) { if (!inP(r[0])) continue; if (cat !== 'ALL' && r[1] !== cat) continue; num += r[mi]; den += r[2]; }
      return { label: pc_t('c6-conf-' + cf, t('conf.' + cf)), color: CONF_FIFA_COLORS[cf], pct: den > 0 ? num / den * 100 : 0, den };
    }).filter(o => o.den >= 10);   // ocultar confederaciones que casi no juegan esa competencia
  }
  out.push(worldBar);
  out.sort((x, y) => y.pct - x.pct);
  return out;
}

// ---- DRAW -------------------------------------------------------------------
let pc_lastLang = null;
function drawPropsChart() {
  const s = pc_state();
  // al cambiar de idioma, refrescar las etiquetas de los chips del ámbito (el
  // handler de idioma solo redibuja el SVG). Se hace solo cuando cambió el idioma,
  // no en cada redibujo del slider.
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (lang !== pc_lastLang) { pc_lastLang = lang; if (pc_renderTeamChips) pc_renderTeamChips(); }
  if (s.view === 'bars') pc_drawBars();
  else pc_drawLines();
  pc_applyHeadings();
}
function pc_drawEmpty() {
  const svg = document.getElementById(pc_cfg.svgId); if (!svg) return;
  svg.innerHTML = '';
  if (svg.__tsMove) { svg.removeEventListener('mousemove', svg.__tsMove); svg.removeEventListener('mouseleave', svg.__tsLeave); svg.__tsMove = null; svg.__tsLeave = null; }
  const tt = document.getElementById(pc_cfg.tooltipId); if (tt) { tt.style.display = 'none'; tt.style.opacity = '0'; }
  const vb = (svg.getAttribute('viewBox') || '0 0 1100 520').split(' ').map(Number);
  const W = vb[2] || 1100, H = vb[3] || 520, NS = 'http://www.w3.org/2000/svg';
  const e = document.createElementNS(NS, 'text');
  e.setAttribute('x', W / 2); e.setAttribute('y', H / 2); e.setAttribute('text-anchor', 'middle');
  e.style.fontFamily = 'var(--sans)'; e.style.fontSize = '16px'; e.setAttribute('fill', 'var(--muted, #8a857c)');
  e.textContent = pc_t('pc-empty', 'No hay partidos para mostrar con estos filtros.');
  svg.appendChild(e);
}
function pc_drawLines() {
  const s = pc_state(), series = pc_lineSeries(), a = s.period[0], b = s.period[1];
  // estado vacío: cuando lo elegido no tiene NINGÚN partido en el período (p.ej.
  // CONMEBOL no juega Ligas de Naciones), mostrar un cartel en vez de un eje roto.
  if (!series.some(sr => sr.pts.some(p => p[0] >= a && p[0] <= b && p[1] != null))) { pc_drawEmpty(); return; }
  tsDraw(pc_cfg.n, {
    svgId: pc_cfg.svgId, tooltipId: pc_cfg.tooltipId, mode: 'lines',
    xMin: s.period[0], xMax: s.period[1], yMax: 'auto',
    yFmt: (v) => v + '%', axisY: pc_t(pc_cfg.axisY, '%'),
    series, endValFmt: (v) => Math.round(v) + '%',
    ttRows: (year) => series.map(sr => {
      const p = sr.pts.find(q => q[0] === year);
      return p && p[1] != null ? { label: sr.label, color: sr.color, v: p[1].toFixed(1) + '%' } : null;
    }).filter(Boolean),
  });
}
function pc_drawBars() {
  const svg = document.getElementById(pc_cfg.svgId); if (!svg) return;
  svg.innerHTML = '';
  // tsDraw deja mousemove/mouseleave en el <svg> (no en hijos): innerHTML no los
  // borra y dispararían el tooltip de líneas sobre las barras. Los sacamos.
  if (svg.__tsMove) { svg.removeEventListener('mousemove', svg.__tsMove); svg.removeEventListener('mouseleave', svg.__tsLeave); svg.__tsMove = null; svg.__tsLeave = null; }
  const tt = document.getElementById(pc_cfg.tooltipId); if (tt) { tt.style.display = 'none'; tt.style.opacity = '0'; }
  const NS = 'http://www.w3.org/2000/svg';
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && (typeof isMobileViewport === 'function') && isMobileViewport();
  const bigFmt = !!editorFormat || mobile;
  let W = 1100, H = 520;
  if (editorFormat && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[editorFormat]) { W = PNG_FORMATS[editorFormat].vbW; H = Math.max(PNG_FORMATS[editorFormat].vbH, 620); }
  else if (mobile) H = 700;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const rows = pc_barData();
  const fs = bigFmt ? 22 : 13;
  const M = { top: bigFmt ? 22 : 14, right: bigFmt ? 96 : 60, bottom: bigFmt ? 24 : 16, left: bigFmt ? 300 : 190 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const maxV = Math.max(10, ...rows.map(r => r.pct));
  const x = (v) => (v / maxV) * PW;
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
  const hover = !editorFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  rows.forEach((d, i) => {
    const yy = i * step + step / 2, w = Math.max(x(d.pct), 1.5);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', yy - bh / 2); rect.setAttribute('width', w); rect.setAttribute('height', bh);
    rect.setAttribute('fill', d.color); rect.setAttribute('rx', bigFmt ? 4 : 2);
    if (d.world) { rect.setAttribute('fill-opacity', 0.85); rect.setAttribute('stroke', PC_WORLD_COLOR); rect.setAttribute('stroke-dasharray', '4 3'); rect.setAttribute('stroke-width', 1); }
    g.appendChild(rect);
    txt(-(bigFmt ? 14 : 8), yy, d.label, { anchor: 'end', weight: d.world ? 700 : null });
    txt(w + (bigFmt ? 12 : 7), yy, (d.pct < 1 ? d.pct.toFixed(1) : Math.round(d.pct)) + '%', { weight: 700 });
    if (hover) {
      const hit = document.createElementNS(NS, 'rect');
      hit.setAttribute('x', -M.left); hit.setAttribute('y', yy - step / 2); hit.setAttribute('width', W); hit.setAttribute('height', step);
      hit.setAttribute('fill', 'transparent'); hit.style.cursor = 'default'; g.appendChild(hit);
      hit.addEventListener('mouseenter', () => { rect.setAttribute('fill-opacity', d.world ? 1 : 0.82); pc_barTip(d); });
      hit.addEventListener('mousemove', () => pc_tipMove());
      hit.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', d.world ? 0.85 : 1); pc_tipHide(); });
    }
  });
}
function pc_barTip(d) {
  const tt = document.getElementById(pc_cfg.tooltipId); if (!tt) return;
  const noun = pc_t(pc_cfg.metricPhrase, '');
  tt.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${d.label}</div>`
    + `<div><strong style="font-variant-numeric:tabular-nums;">${d.pct < 1 ? d.pct.toFixed(1) : Math.round(d.pct)}%</strong> ${noun}</div>`
    + `<div style="opacity:.7;">${d.den.toLocaleString('es')} ${pc_t('pc-matches', 'partidos')}</div>`;
  tt.style.display = 'block'; tt.style.opacity = '1';
}
function pc_tipMove() {
  const tt = document.getElementById(pc_cfg.tooltipId); if (!tt) return;
  const svg = document.getElementById(pc_cfg.svgId); const rc = svg.getBoundingClientRect();
  const ev = pc_tipMove._e; if (!ev) return;
  const _x = ev.clientX - rc.left, _w = tt.offsetWidth || 160;
  tt.style.left = ((_x + 14 + _w > rc.width || _x > rc.width * 0.72) ? Math.max(2, _x - _w - 14) : (_x + 14)) + 'px';
  tt.style.top = (ev.clientY - rc.top + 14) + 'px';
}
function pc_tipHide() { const tt = document.getElementById(pc_cfg.tooltipId); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; } }

// ---- headings (título insight en pristino; subtítulo dinámico) --------------
function pc_pristine() {
  const s = pc_state();
  return !pc_touched && s.view === 'lines' && s.cat === 'ALL' && (s.sel || []).length === 1 && s.sel[0] === 'W';
}
function pc_subtitle() {
  const s = pc_state(), lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const metric = pc_t(pc_cfg.metricPhrase, '');           // "en cancha neutral" / "entre confederaciones distintas"
  const period = s.period[0] + '–' + s.period[1];
  // La competencia va como frase de arranque (sin guión largo: punto seguido). El
  // ÁMBITO (Mundo/confederaciones/países) NO se enumera acá: lo comunican los chips,
  // y nombrarlo se vuelve redundante ("de cada confederación… entre confederaciones")
  // y no escala a varios países. El subtítulo define la MEDIDA + competencia + período.
  if (s.view === 'bars') {
    const by = s.barsBy === 'cat' ? pc_t('pc-by-cat-lc', 'tipo de competencia') : pc_t('pc-by-conf-lc', 'confederación');
    const lead = (s.barsBy === 'conf' && s.cat !== 'ALL') ? pc_catName(s.cat) + '. ' : '';
    return (lang === 'en' ? `${lead}Share of matches ${metric}, by ${by} (${period}).`
      : `${lead}Porcentaje de partidos ${metric}, por ${by} (${period}).`);
  }
  const maTxt = s.smooth === 'ma' ? (lang === 'en' ? `, ${s.maYears}-yr moving avg` : `, promedio móvil de ${s.maYears} años`) : '';
  if (s.cat === 'ALL') {
    return (lang === 'en' ? `Share of international matches ${metric} (${period}${maTxt}).`
      : `Porcentaje de partidos internacionales ${metric} (${period}${maTxt}).`);
  }
  const cat = pc_catName(s.cat);
  return (lang === 'en' ? `${cat}. Share of matches ${metric} (${period}${maTxt}).`
    : `${cat}. Porcentaje de partidos ${metric} (${period}${maTxt}).`);
}
function pc_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="' + pc_cfg.n + '"]') || document;
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const titleEl = block.querySelector('.chart-title');
  if (titleEl && !(tx.title || '').trim()) titleEl.textContent = pc_t(pc_pristine() ? pc_cfg.titleKey : pc_cfg.titleNeutralKey, '');
  const subEl = block.querySelector('.chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = pc_subtitle();
}

// ---- controles --------------------------------------------------------------
function pc_syncCtx() {
  const s = pc_state(), lines = s.view === 'lines';
  const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
  show('pc-ambito-controls', lines);
  show('pc-smooth-group', lines);
  show('pc-ma-group', lines && s.smooth === 'ma');
  show('pc-barsby-group', !lines);
  // la competencia solo aplica a líneas y a barras "por confederación"; en barras
  // "por competencia" es redundante (las barras YA son las competencias)
  show('pc-cat-group', lines || s.barsBy === 'conf');
}
function setupPropsTabs() {
  const lb = document.getElementById('pc-tab-lines'), bb = document.getElementById('pc-tab-bars');
  if (!lb || !bb) return;
  const go = (v) => { if (pc_state().view === v) return; pc_state().view = v; pc_touched = true; sync(); if (v === 'bars') pc_ensureTeams(); drawPropsChart(); };
  function sync() { const v = pc_state().view; lb.classList.toggle('active', v === 'lines'); bb.classList.toggle('active', v === 'bars'); pc_syncCtx(); }
  lb.addEventListener('click', () => go('lines'));
  bb.addEventListener('click', () => go('bars'));
  sync();
}
function setupPropsCat() {
  const sel = document.getElementById('pc-cat-select'); if (!sel) return;
  sel.value = String(pc_state().cat);
  sel.addEventListener('change', () => {
    const s = pc_state(); s.cat = sel.value === 'ALL' ? 'ALL' : +sel.value; pc_touched = true;
    // re-encuadra el período al primer año con datos de la competencia (salvo que
    // el usuario ya haya movido el slider a mano)
    pc_ensureTeams(() => { pc_autofitPeriod(); drawPropsChart(); }); pc_autofitPeriod(); drawPropsChart();
  });
}
function setupPropsBarsBy() {
  document.querySelectorAll('#pc-barsby button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#pc-barsby button').forEach(x => x.classList.toggle('active', x === b));
    pc_state().barsBy = b.dataset.by; pc_syncCtx(); pc_ensureTeams(() => drawPropsChart()); drawPropsChart();
  }));
}
function setupPropsSmooth() {
  document.querySelectorAll('#pc-smooth button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#pc-smooth button').forEach(x => x.classList.toggle('active', x === b));
    pc_state().smooth = b.dataset.smooth; pc_touched = true; pc_syncCtx(); drawPropsChart();
  }));
  const ma = document.getElementById('pc-ma'), val = document.getElementById('pc-ma-val');
  if (ma) {
    ma.value = pc_state().maYears; if (val) val.textContent = ma.value;
    ma.addEventListener('input', () => { pc_state().maYears = +ma.value; if (val) val.textContent = ma.value; pc_touched = true; drawPropsChart(); });
  }
}
// primer año con datos (con partidos) de un ámbito para la competencia actual
function pc_seriesFirstYear(key) {
  const rows = pc_ambitoRows(key); if (!rows) return null;
  const s = pc_state(); let mn = null;
  for (const r of rows) {
    if (s.cat !== 'ALL' && r[1] !== s.cat) continue;
    if (r[2] > 0) { const y = r[0] + DATA_PROPS.y0; if (mn === null || y < mn) mn = y; }
  }
  return mn;
}
// arranque del slider = primer año con datos entre todas las series mostradas
function pc_dataStartYear() {
  const s = pc_state(); let mn = null;
  (s.sel || []).forEach(key => { const y = pc_seriesFirstYear(key); if (y !== null && (mn === null || y < mn)) mn = y; });
  return mn === null ? DATA_PROPS.y0 : mn;
}
// re-encuadra el período al rango con datos, salvo que el usuario ya lo haya tocado
function pc_autofitPeriod() {
  const s = pc_state(); if (s.periodAuto === false) return;
  const a = pc_dataStartYear();
  s.period = [Math.min(a, DATA_PROPS.y1 - 5), DATA_PROPS.y1];
  pc_updateSlider();
}
function pc_updateSlider() {
  const s = pc_state();
  const f = document.getElementById('pc-slider-from'), tt = document.getElementById('pc-slider-to');
  const disp = document.getElementById('pc-range-display'), tr = document.getElementById('pc-range-track-active');
  if (!f || !tt) return;
  f.value = s.period[0]; tt.value = s.period[1];
  if (disp) disp.textContent = `${s.period[0]}–${s.period[1]}`;
  if (tr) { const mn = +f.min, mx = +f.max, sp = mx - mn; if (sp > 0) { tr.style.left = ((s.period[0] - mn) / sp * 100) + '%'; tr.style.right = ((mx - s.period[1]) / sp * 100) + '%'; } }
}
function setupPropsSlider() {
  const f = document.getElementById('pc-slider-from'), tt = document.getElementById('pc-slider-to'); if (!f || !tt) return;
  const MINW = 5;
  f.addEventListener('input', () => { const s = pc_state(); let a = +f.value; if (a > s.period[1] - MINW) a = s.period[1] - MINW; s.period[0] = a; s.periodAuto = false; pc_touched = true; pc_updateSlider(); drawPropsChart(); });
  tt.addEventListener('input', () => { const s = pc_state(); let b = +tt.value; if (b < s.period[0] + MINW) b = s.period[0] + MINW; s.period[1] = b; s.periodAuto = false; pc_touched = true; pc_updateSlider(); drawPropsChart(); });
  pc_updateSlider();
}
// ámbito unificado: UN solo buscador que encuentra Mundo, confederaciones y
// países; lo elegido aparece como chips removibles (mismo criterio que el resto
// del especial, en vez de toggles sueltos por un lado y buscador por otro).
function setupPropsAmbito() {
  const leg = document.getElementById('pc-legend');
  if (leg) { leg.style.display = 'none'; leg.innerHTML = ''; }   // ya no hay leyenda de toggles
  const input = document.getElementById('pc-team-search'), results = document.getElementById('pc-team-results'), chips = document.getElementById('pc-team-chips');
  if (!input || !results || !chips) return;

  function renderChips() {
    const s = pc_state(); chips.innerHTML = '';
    (s.sel || []).forEach(key => {
      const el = document.createElement('span'); el.className = 'm-selected-chip'; el.style.background = pc_ambColor(key);
      el.innerHTML = `<span>${pc_ambLabel(key)}</span>`;
      const x = document.createElement('button'); x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
      x.addEventListener('click', () => {
        pc_state().sel = (pc_state().sel || []).filter(v => v !== key);
        if (pc_isTeam(key)) delete pc_teamColorMap[key];   // liberar la ranura de color del país
        pc_touched = true; renderChips(); renderResults(); pc_autofitPeriod(); drawPropsChart();
      });
      el.appendChild(x); chips.appendChild(el);
    });
  }
  pc_renderTeamChips = renderChips; pc_renderLegend = renderChips;

  // pool de candidatos del buscador: Mundo + confederaciones + países (lazy),
  // menos los que ya están elegidos
  function pool() {
    const chosen = new Set(pc_state().sel || []), out = [];
    if (!chosen.has('W')) out.push({ key: 'W', label: pc_t('pc-world', 'Mundo'), alt: '' });
    CONF_FIFA_ORDER.forEach(cf => { if (!chosen.has(cf)) out.push({ key: cf, label: t('conf.' + cf), alt: pc_t('c6-conf-' + cf, '') }); });
    if (pc_hasTeams()) DATA_PROPS_TEAMS.forEach(o => { if (!chosen.has(o.n)) out.push({ key: o.n, label: (typeof atlasCountryName === 'function' ? atlasCountryName(o.n) : o.n), alt: o.n }); });
    return out;
  }
  function items() {
    const q = input.value.trim().toLowerCase(); if (!q) return [];
    return pool().filter(o => o.label.toLowerCase().includes(q) || (o.alt || '').toLowerCase().includes(q) || o.key.toLowerCase().includes(q)).slice(0, 9);
  }
  function renderResults() {
    results.innerHTML = '';
    const teamFull = pc_teamCount() >= PC_TEAM_MAX;
    items().forEach(o => {
      const isTeam = pc_isTeam(o.key), blocked = isTeam && teamFull;
      const r = document.createElement('div'); r.className = 'm-search-result';
      // el puntito muestra el color de la serie: Mundo/confed su color real; país
      // un gris neutro (no le asignamos ranura hasta que lo agreguen de verdad)
      const dot = isTeam ? '#c9c4ba' : pc_ambColor(o.key);
      r.innerHTML = `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${dot};margin-right:7px;vertical-align:middle;"></span><span>${o.label}</span>`;
      if (blocked) { r.style.opacity = '0.4'; r.style.cursor = 'not-allowed'; r.title = pc_t('pc-team-max', ''); }
      r.addEventListener('mousedown', (e) => {
        e.preventDefault(); if (isTeam && pc_teamCount() >= PC_TEAM_MAX) return;
        pc_state().sel = (pc_state().sel || []).concat(o.key); pc_touched = true;
        input.value = ''; results.classList.remove('open'); renderChips(); pc_autofitPeriod(); drawPropsChart();
      });
      results.appendChild(r);
    });
    results.classList.toggle('open', results.children.length > 0);
  }
  input.addEventListener('focus', () => { pc_ensureTeams(renderResults); renderResults(); });
  input.addEventListener('input', () => { pc_ensureTeams(renderResults); renderResults(); });
  input.addEventListener('blur', () => setTimeout(() => results.classList.remove('open'), 130));
  renderChips();
}
let pc_renderLegend = null, pc_renderTeamChips = null;

function setupPropsCSV() {
  document.querySelectorAll('button.download[data-chart="' + pc_cfg.n + '-csv"]').forEach(btn => btn.addEventListener('click', () => {
    let csv = 'anio,cat,total,neutral,entre_confederaciones\n';
    DATA_PROPS.mundo.forEach(r => { csv += `${r[0] + DATA_PROPS.y0},${DATA_PROPS.cats[r[1]]},${r[2]},${r[3]},${r[4]}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = pc_cfg.csvName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initPropsChart(cfg) {
  pc_cfg = cfg;
  pc_state();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawPropsChart;
  window.onBeforePngExportGetSourceText = function (chartId) {
    return String(chartId) === String(cfg.n) ? (pc_t(cfg.srcTpl, '') || null) : null;
  };
  window.onBeforePngExportGetSubtitle = function (chartId) {
    return String(chartId) === String(cfg.n) ? pc_subtitle() : null;
  };
  drawPropsChart();
  setupPropsTabs();
  setupPropsCat();
  setupPropsBarsBy();
  setupPropsSmooth();
  setupPropsSlider();
  setupPropsAmbito();
  setupPropsCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initPropsChart._wired) { initPropsChart._wired = true; window.addEventListener('atlas-editor-change', () => drawPropsChart()); }
  document.getElementById(cfg.svgId)?.addEventListener('mousemove', (e) => { pc_tipMove._e = e; });
  setTimeout(() => pc_ensureTeams(), 400);
}
