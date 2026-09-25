// =============================================================
//  evolucion.js — "De qué está hecha la fama" (N°5, página evo)
//  Stacked area de composición por período de nacimiento:
//  bins 'Hasta 1500' + 50 años + '2000+'. Toggles share/absoluto y
//  dominio/ocupación (tonos por familia de dominio, apilado ordenado).
//  Selector Mundo/regiones/países; 2+ selecciones = small multiples
//  con escala compartida (patrón elo-lines del N°3).
//  Depende de window.EVOL, REGION_COLORS/REGION_ORDER, LANG, utils.js.
// =============================================================
// OJO: prohibido usar var(--x) en cualquier atributo/estilo del SVG. El clon
// que se rasteriza no resuelve CSS variables (y por file:// ni siquiera se
// embebe :root), asi que todo cae al serif por defecto. Solo literales.
const EV_SANS = "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const EV_NS = 'http://www.w3.org/2000/svg';
const ev_el = (t) => document.createElementNS(EV_NS, t);
const EV_DOM_COL = {
  'Poder y figuras públicas': '#6B3D8B', 'Humanidades': '#2D6A3D',
  'Ciencia y tecnología': '#234B85', 'Negocios y exploración': '#8A5A35',
  'Arte y espectáculo': '#C9A227', 'Deporte': '#BE5D32'
};
function ev_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function ev_loc() { return ev_lang() === 'en' ? 'en-US' : 'es-AR'; }
function ev_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }

// tonos por ocupación: gama del dominio, oscuro→claro (patrón percap)
function ev_shade(hex, p, P) {
  const f = P <= 1 ? 0 : (p / (P - 1)) * 0.6;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const m = (c) => Math.round(c + (255 - c) * f);
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
}
let EV_OCC_COLOR = null;
function ev_occColors() {
  if (EV_OCC_COLOR) return EV_OCC_COLOR;
  const E = window.EVOL;
  EV_OCC_COLOR = new Array(E.occs.length);
  for (let di = 0; di < E.doms.length; di++) {
    const idxs = [];
    E.occs.forEach((o, i) => { if (o.dom === di) idxs.push(i); });
    const base = EV_DOM_COL[E.doms[di].es] || '#888';
    idxs.forEach((oi, p) => { EV_OCC_COLOR[oi] = ev_shade(base, p, idxs.length); });
  }
  return EV_OCC_COLOR;
}

// ---------- estado + selección ----------
function ev_state() {
  if (!window.state) window.state = {};
  if (!state.evo) state.evo = { mode: 'share', nivel: 'dom', sel: [{ t: 'w' }], b0: 0, b1: 11 };
  return state.evo;
}
function ev_selLabel(u) {
  const en = ev_lang() === 'en', E = window.EVOL;
  if (u.t === 'w') return en ? 'World' : 'Mundo';
  if (u.t === 'r') return (typeof t === 'function') ? t('reg.' + u.reg) : u.reg;
  const m = E.isoMeta[u.i];
  return en ? m.en : m.es;
}
function ev_selColor(u) {
  const E = window.EVOL;
  if (u.t === 'w') return '#1A1A1A';
  const reg = u.t === 'r' ? u.reg : E.isoMeta[u.i].reg;
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
}
function ev_selKey(u) { return u.t + (u.t === 'r' ? u.reg : u.t === 'c' ? u.i : ''); }

// ---------- matrices bins x categorías ----------
function ev_matOcc(u) {
  const E = window.EVOL, NO = E.occs.length;
  if (u.t === 'w') return E.world.map(row => row.slice());
  const mat = []; for (let b = 0; b < E.bins.length; b++) mat.push(new Array(NO).fill(0));
  let ok = null;
  if (u.t === 'c') { ok = (i) => i === u.i; }
  else { const set = new Set(); E.isoMeta.forEach((m, i) => { if (m.reg === u.reg) set.add(i); }); ok = (i) => set.has(i); }
  const C = E.cells;
  for (let k = 0; k < C.length; k += 4) if (ok(C[k])) mat[C[k + 1]][C[k + 2]] += C[k + 3];
  return mat;
}
function ev_mat(u, nivel) {
  const E = window.EVOL, mo = ev_matOcc(u);
  if (nivel === 'occ') return mo;
  return mo.map(row => {
    const out = new Array(E.doms.length).fill(0);
    row.forEach((v, oi) => { out[E.occs[oi].dom] += v; });
    return out;
  });
}

// ---------- dimensiones ----------
let EV_W = 1100, EV_H = 640;
function ev_dims(nPan) {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && ev_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    // Zoom del editor: el viewBox se achica 1/k y todo lo de adentro sale k
    // veces mas grande en el mismo recuadro del PNG.
    const k = (typeof atlasEditorZoom === 'function') ? atlasEditorZoom() : 1;
    EV_W = Math.round(PNG_FORMATS[fmt].vbW / k);
    // Alto = el del hueco que el PNG le deja al grafico (lo que no ocupan
    // titulo, subtitulo y nota): si el lector achica un texto, el grafico lo
    // aprovecha. Sin png-export cargado, los altos fijos de la casa.
    const box = (typeof atlasPngBox === 'function') ? atlasPngBox('evo', fmt) : null;
    EV_H = box ? Math.round(EV_W * box.h / box.w)
               : Math.round((fmt === 'square' ? 910 : fmt === 'newsletter' ? 860 : PNG_FORMATS[fmt].vbH) / k);
  }
  else if (mobile) { EV_W = 1100; EV_H = 1150; }
  else { EV_W = 1100; EV_H = 560; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function ev_niceTicks(max, n) {
  const raw = max / n, pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => max / s <= n) || pow * 10;
  const out = []; for (let v = 0; v <= max + 1e-9; v += step) out.push(v);
  // el ultimo tick CUBRE el maximo (si no, la banda mas alta se sale del plot)
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}
const ev_fmtN = (v) => {
  const en = ev_lang() === 'en';
  if (v >= 1000) return (v / 1000).toLocaleString(ev_loc(), { maximumFractionDigits: v >= 10000 ? 0 : 1 }) + (en ? 'k' : ' mil');
  return String(Math.round(v));
};

// Resaltado de una BANDA del apilado (hover sobre el area o su etiqueta): la
// banda apuntada queda opaca y el resto se atenua. Portado tal cual del
// amistosos del N3 (ts_bandEmph en 03b-partidos/ts-partidos.js).
function ev_bandEmph(svg, band, domKey) {
  const off = band == null && domKey == null;
  svg.querySelectorAll('[data-band]').forEach(el => {
    if (off) { el.setAttribute('fill-opacity', el.getAttribute('data-band-op')); return; }
    const hit = band != null ? el.getAttribute('data-band') === band
                             : el.getAttribute('data-dom') === domKey;
    el.setAttribute('fill-opacity', hit ? 1 : 0.22);
  });
  svg.querySelectorAll('[data-band-label]').forEach(el => {
    el.style.opacity = (off || el.getAttribute('data-band-label') === (domKey != null ? domKey : band)) ? '' : '0.25';
  });
}

// ---------- dibujo ----------

// ===== Vista compartible (?medida=&apertura=&sel=&periodo=) =====
// Criterio de la casa: default = URL limpia; cualquier desvio escribe el estado
// completo. `sel` viaja como "mundo", el ISO3 del pais o el slug de la region.
let ev_urlWired = false;
function ev_selDesdeUrl(v) {
  const E = window.EVOL;
  if (!v || v === 'mundo' || v === 'world') return { t: 'w' };
  const iso = v.toUpperCase();
  const i = E.isoMeta.findIndex(m => m.iso === iso);
  if (i >= 0) return { t: 'c', i };
  const regs = [...new Set(E.isoMeta.map(m => m.reg).filter(Boolean))];
  const r = regs.find(x => atlasSlug(x) === atlasSlug(v));
  return r ? { t: 'r', reg: r } : null;
}
function ev_selAUrl(u) {
  if (!u || u.t === 'w') return 'mundo';
  if (u.t === 'r') return atlasSlug(u.reg);
  return window.EVOL.isoMeta[u.i].iso;
}
// bins <-> anios: bin 0 = todo lo anterior a 1500; bin 11 = 2000 en adelante.
const ev_binAAnio = (b) => b <= 0 ? 1500 : (b >= 11 ? 2000 : 1500 + (b - 1) * 50);
const ev_anioABin = (y) => y <= 1500 ? 0 : (y >= 2000 ? 11 : Math.max(0, Math.min(11, Math.round((y - 1500) / 50) + 1)));
function ev_applyUrlState() {
  if (typeof atlasUrlParam !== 'function') return;
  const s = ev_state();
  const md = atlasUrlParam('medida');
  if (md === 'abs' || md === 'share') s.mode = md;
  const ap = atlasUrlParam('apertura');
  if (ap === 'ocupaciones' || ap === 'occ') s.nivel = 'occ';
  else if (ap === 'rubros' || ap === 'dom') s.nivel = 'dom';
  const sel = atlasUrlParam('sel');
  if (sel) { const u = ev_selDesdeUrl(sel); if (u) s.sel = [u]; }
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) {
    const [a, b] = per.split('~').map(Number);
    if (!isNaN(a) && !isNaN(b)) {
      const b0 = ev_anioABin(a), b1 = ev_anioABin(b);
      if (b0 <= b1) { s.b0 = b0; s.b1 = b1; }
    }
  }
  ev_urlWired = true;
  const tm = document.getElementById('evo-mode');
  if (tm) tm.querySelectorAll('button').forEach(x => x.classList.toggle('active', x.dataset.mode === s.mode));
  const tn = document.getElementById('evo-nivel');
  if (tn) tn.querySelectorAll('button').forEach(x => x.classList.toggle('active', x.dataset.nivel === s.nivel));
  ev_syncPeriodo(); ev_renderChips(); drawEvo();
}
function ev_syncUrl() {
  if (!ev_urlWired || typeof atlasSyncUrl !== 'function') return;
  const s = ev_state();
  const u = s.sel[0] || { t: 'w' };
  const todoDefault = s.mode === 'share' && s.nivel === 'dom' && u.t === 'w' && s.b0 === 0 && s.b1 === 11;
  atlasSyncUrl(todoDefault ? { medida: null, apertura: null, sel: null, periodo: null } : {
    medida: s.mode === 'share' ? null : 'abs',
    apertura: s.nivel === 'dom' ? null : 'ocupaciones',
    sel: u.t === 'w' ? null : ev_selAUrl(u),
    periodo: (s.b0 === 0 && s.b1 === 11) ? null : (ev_binAAnio(s.b0) + '~' + ev_binAAnio(s.b1))
  });
}

function drawEvo() {
  ev_syncUrl();
  const svg = document.getElementById('chartevo');
  if (!svg || typeof EVOL === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltipevo'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const s = ev_state(), E = window.EVOL, en = ev_lang() === 'en';
  const nivel = s.nivel, share = s.mode === 'share';
  const B0 = Math.min(s.b0, s.b1), B1 = Math.max(s.b0, s.b1);
  const panels = s.sel.map(u => {
    const matFull = ev_mat(u, nivel);
    const mat = matFull.slice(B0, B1 + 1);
    const totals = mat.map(row => row.reduce((a, b) => a + b, 0));
    // trim de bins vacios en los extremos: la serie ARRANCA vertical donde hay datos
    let d0 = 0, d1 = totals.length - 1;
    while (d0 < d1 && !totals[d0]) d0++;
    while (d1 > d0 && !totals[d1]) d1--;
    return { u, label: ev_selLabel(u), color: ev_selColor(u), mat, totals, d0, d1 };
  });
  const n = panels.length;
  const dims = ev_dims(n); const { bigFmt, isPng, mobile } = dims;

  if (!n) {
    svg.setAttribute('viewBox', '0 0 1100 300');
    const tx = ev_el('text'); tx.setAttribute('x', 550); tx.setAttribute('y', 150); tx.setAttribute('text-anchor', 'middle');
    tx.style.cssText = 'font-family:' + EV_SANS + ';font-size:17px;fill:#8A8579;font-style:italic;';
    tx.textContent = (typeof t === 'function') ? t('cevo-vacio') : 'Elegí países o regiones con el buscador.';
    svg.appendChild(tx);
    ev_syncSub(); return;
  }

  // escala Y compartida (abs): el bin más alto de TODOS los paneles
  let absMax = 1;
  if (!share) panels.forEach(p => p.totals.forEach(v => { if (v > absMax) absMax = v; }));
  const yTicksAbs = share ? null : ev_niceTicks(absMax, bigFmt ? 4 : 5);
  if (!share) absMax = yTicksAbs[yTicksAbs.length - 1] || absMax;

  // Perillas del editor (?nl=1): etiquetas de rubro y ticks. Sin editor, los presets.
  const aeSz = (typeof atlasEditorSizes === 'function') ? atlasEditorSizes() : null;
  const edSz = (k, preset) => (typeof atlasEditorSize === 'function') ? atlasEditorSize(aeSz, k, preset) : preset;
  const fsLbl = edSz('labels', bigFmt ? 26 : 16), fsTick = edSz('ticks', bigFmt ? 22 : 14), fsPan = bigFmt ? 26 : 16;
  const NB = E.bins.length;
  const cats = nivel === 'dom' ? E.doms.map((d, i) => ({ i, name: en ? d.en : d.es, color: EV_DOM_COL[d.es] }))
                               : E.occs.map((o, i) => ({ i, name: en ? o.en : o.es, color: ev_occColors()[i], dom: o.dom }));

  // ----- layout: un solo panel (la seleccion es unica; sin small multiples) -----
  svg.setAttribute('viewBox', '0 0 ' + EV_W + ' ' + EV_H);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const anchoLab = (nombre) => Math.max(...ev_wrapLab(nombre, fsLbl, bigFmt).map(l => ev_measure(l, fsLbl, 700)));
  // +42 de colchon en PNG: el texto arranca en x=+16 y la medicion de canvas
  // puede quedar corta vs el raster final (carrera de fuentes) -> "figuras
  // publicas" se salia del borde derecho (Daniel, 2026-09-10).
  const rightSingle = Math.ceil(Math.max(...E.doms.map(dm => anchoLab(en ? dm.en : dm.es)))) + (bigFmt ? 42 : 16);
  const yTickW = share ? ev_measure('100%', fsTick) : Math.max(...yTicksAbs.map(v => ev_measure(ev_fmtN(v), fsTick)));
  const M = {
    top: bigFmt ? 34 : 18,
    right: rightSingle,
    // el pie acompaña al cuerpo de los ticks (60 con el preset de 22)
    bottom: bigFmt ? Math.round(fsTick * 60 / 22) : 40,
    left: Math.ceil(yTickW + (bigFmt ? 22 : 14))
  };
  const panW = EV_W - M.left - M.right, panH = EV_H - M.top - M.bottom;
  const pnl = panels[0];
  ev_panel(svg, pnl, {
    x: M.left, y: M.top, w: panW, h: panH, cats, nivel, share, absMax, yTicksAbs, B0, isPng,
    fsLbl, fsTick, fsPan, bigFmt, single: true, en,
    firstCol: true, lastRow: true
  });

  // contexto de hover: los listeners se cablean UNA sola vez y leen esto.
  // En PNG (o si algun dia no hay panel) queda null y el tooltip no aparece.
  if (!isPng) {
    const vline = ev_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1);
    vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('display', 'none');
    vline.setAttribute('pointer-events', 'none'); svg.appendChild(vline);
    svg.__evCtx = { zones: [{ p: pnl, x: M.left, y: M.top, w: panW, h: panH }],
                    cats, nivel, share, NB: B1 - B0 + 1, B0, vline };
    ev_wireHover(svg);
  } else svg.__evCtx = null;

  ev_syncSub();
}

// nombres largos a dos lineas en el PNG (corte cerca del medio); en pantalla, una
function ev_wrapLab(nombre, fs, bigFmt) {
  if (!bigFmt || ev_measure(nombre, fs, 700) <= fs * 7.4 || nombre.indexOf(' ') < 0) return [nombre];
  const w = nombre.split(' ');
  let best = 1, diff = Infinity;
  for (let i = 1; i < w.length; i++) {
    const d = Math.abs(ev_measure(w.slice(0, i).join(' '), fs, 700) - ev_measure(w.slice(i).join(' '), fs, 700));
    if (d < diff) { diff = d; best = i; }
  }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}
function ev_measure(t2, s2, w2) {
  if (!ev_measure._c) ev_measure._c = document.createElement('canvas').getContext('2d');
  ev_measure._c.font = (w2 || 400) + ' ' + s2 + 'px "Source Sans 3", system-ui, sans-serif';
  return ev_measure._c.measureText(t2).width;
}

function ev_panel(svg, p, o) {
  const E = window.EVOL, NB = p.mat.length;
  const xS = (i) => o.x + (NB <= 1 ? 0.5 * o.w : (i / (NB - 1)) * o.w);
  const yS = (v) => o.y + o.h - (v / (o.share ? 1 : o.absMax)) * o.h;   // apila desde abajo en ambos modos

  // título del panel (multiples)
  if (!o.single) {
    const tt = ev_el('text'); tt.setAttribute('x', o.x); tt.setAttribute('y', o.y - (o.bigFmt ? 12 : 7));
    tt.style.cssText = 'font-family:' + EV_SANS + ';font-size:' + o.fsPan + 'px;font-weight:700;fill:' + p.color + ';';
    tt.textContent = p.label; svg.appendChild(tt);
  }

  // grid + ticks Y (solo primera columna)
  const yVals = o.share ? [0, .25, .5, .75, 1] : o.yTicksAbs;
  yVals.forEach(v => {
    const y = yS(v);
    const gl = ev_el('line'); gl.setAttribute('x1', o.x); gl.setAttribute('x2', o.x + o.w);
    gl.setAttribute('y1', y); gl.setAttribute('y2', y);
    gl.style.stroke = '#ECE7D8'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    if (o.firstCol) {
      const tk = ev_el('text'); tk.setAttribute('x', o.x - (o.bigFmt ? 10 : 6)); tk.setAttribute('y', y + o.fsTick * 0.34);
      tk.setAttribute('text-anchor', 'end');
      tk.style.cssText = 'font-family:' + EV_SANS + ';font-size:' + o.fsTick + 'px;fill:#8A8579;';
      tk.textContent = o.share ? Math.round(v * 100) + '%' : ev_fmtN(v);
      svg.appendChild(tk);
    }
  });

  // ticks X (fila de abajo): <1500, 1600, 1700, 1800, 1900, 2000+
  if (o.lastRow) {
    const lab = (abs) => abs === 0 ? 'Pre-1500' : abs === 11 ? 'Post-2000' : String(1500 + (abs - 1) * 50);
    const paso = (o.single || o.w > 500) ? (NB > 7 ? 2 : 1) : Math.max(1, Math.ceil(NB / 3));
    const ks = []; for (let k = 0; k < NB; k += paso) ks.push(k);
    // el ultimo bin SIEMPRE tiene tick (si el anterior queda pegado, se lo saca)
    if (ks[ks.length - 1] !== NB - 1) {
      if (NB - 1 - ks[ks.length - 1] < paso) ks.pop();
      ks.push(NB - 1);
    }
    // 'Pre-1500' es ancho y va anclado al inicio: si pisa al tick siguiente, se lo saltea
    if (ks.length > 2 && o.B0 + ks[0] === 0) {
      const finPre = xS(ks[0]) + ev_measure('Pre-1500', o.fsTick);
      const iniSig = xS(ks[1]) - ev_measure(lab(o.B0 + ks[1]), o.fsTick) / 2;
      if (iniSig - finPre < 24) ks.splice(1, 1);
    }
    ks.forEach(kk => {
      const tk = ev_el('text'); tk.setAttribute('x', xS(kk)); tk.setAttribute('y', o.y + o.h + (o.bigFmt ? Math.round(o.fsTick * 34 / 22) : 20));
      tk.setAttribute('text-anchor', kk === 0 ? 'start' : kk === NB - 1 ? 'end' : 'middle');
      tk.style.cssText = 'font-family:' + EV_SANS + ';font-size:' + o.fsTick + 'px;fill:#8A8579;';
      tk.textContent = lab(o.B0 + kk); svg.appendChild(tk);
    });
  }

  // áreas apiladas: cats en orden de índice; en share cada bin normaliza a 1
  const fr = p.mat.map((row, b) => {
    const tot = p.totals[b] || 1;
    return o.cats.map(c => o.share ? row[c.i] / tot : row[c.i]);
  });
  const cum = fr.map(row => { let a = 0; return row.map(v => (a += v)); });
  const g = ev_el('g'); svg.appendChild(g);
  const D0 = p.d0, D1 = p.d1;
  o.cats.forEach((c, k) => {
    let dp = 'M ';
    for (let b = D0; b <= D1; b++) { const up = k === 0 ? 0 : cum[b][k - 1]; dp += (b > D0 ? ' L ' : '') + xS(b).toFixed(1) + ' ' + yS(up).toFixed(1); }
    for (let b = D1; b >= D0; b--) dp += ' L ' + xS(b).toFixed(1) + ' ' + yS(cum[b][k]).toFixed(1);
    dp += ' Z';
    const path = ev_el('path'); path.setAttribute('d', dp); path.setAttribute('fill', c.color);
    path.setAttribute('fill-opacity', 0.92);
    path.setAttribute('stroke', '#FAF8F3'); path.setAttribute('stroke-width', o.nivel === 'occ' ? 0.4 : (o.bigFmt ? 1 : 0.6));
    // clave de banda: SIEMPRE la categoria puntual (en ocupaciones, esa ocupacion);
    // data-dom permite que la etiqueta del bloque resalte el dominio entero
    const bandKey = String(c.i);
    const domKey = o.nivel === 'occ' ? 'd' + c.dom : bandKey;
    path.setAttribute('data-band', bandKey); path.setAttribute('data-band-op', 0.92);
    path.setAttribute('data-dom', domKey);
    if (!o.isPng) {
      path.addEventListener('mouseenter', () => { svg.__evHoverCat = o.nivel === 'occ' ? c.i : null; ev_bandEmph(svg, bandKey, domKey); });
      path.addEventListener('mouseleave', () => { svg.__evHoverCat = null; ev_bandEmph(svg, null, null); });
    }
    g.appendChild(path);
  });

  // labels de dominio a la derecha (solo single): en occ, centrados en el BLOQUE del dominio
  if (o.single) {
    const last = p.d1, tot = p.totals[last] || 1;
    let blocks;
    if (o.nivel === 'dom') {
      blocks = o.cats.map((c, k) => ({ name: c.name, color: c.color, band: String(c.i),
        lo: k === 0 ? 0 : cum[last][k - 1], hi: cum[last][k] }));
    } else {
      blocks = E.doms.map((dm, di) => {
        let lo = null, hi = 0;
        o.cats.forEach((c, k) => { if (c.dom === di) { if (lo === null) lo = k === 0 ? 0 : cum[last][k - 1]; hi = cum[last][k]; } });
        return { name: o.en ? dm.en : dm.es, color: EV_DOM_COL[dm.es], band: 'd' + di, lo: lo || 0, hi };
      });
    }
    const labs = blocks.map(b2 => {
      const lineas = ev_wrapLab(b2.name, o.fsLbl, o.bigFmt);
      return { ...b2, lineas, hh: lineas.length * o.fsLbl * 1.08, yy: yS((b2.lo + b2.hi) / 2) };
    }).filter(b2 => b2.hi - b2.lo > 1e-9);
    labs.sort((a, b) => a.yy - b.yy);
    const sep = 6;
    for (let i2 = 1; i2 < labs.length; i2++) {
      const min = labs[i2 - 1].yy + labs[i2 - 1].hh / 2 + labs[i2].hh / 2 + sep;
      if (labs[i2].yy < min) labs[i2].yy = min;
    }
    // que el bloque no se pase del plot: clamp abajo y pasada inversa
    const btm = o.y + o.h;
    if (labs.length && labs[labs.length - 1].yy + labs[labs.length - 1].hh / 2 > btm) {
      labs[labs.length - 1].yy = btm - labs[labs.length - 1].hh / 2;
      for (let i2 = labs.length - 2; i2 >= 0; i2--) {
        const max = labs[i2 + 1].yy - labs[i2 + 1].hh / 2 - labs[i2].hh / 2 - sep;
        if (labs[i2].yy > max) labs[i2].yy = max;
      }
    }
    labs.forEach(l => {
      const midBanda = yS((l.lo + l.hi) / 2);
      if (Math.abs(l.yy - midBanda) > o.fsLbl * 0.75) {
        const gl = ev_el('line');
        gl.setAttribute('x1', o.x + o.w + 2); gl.setAttribute('y1', midBanda);
        gl.setAttribute('x2', o.x + o.w + (o.bigFmt ? 12 : 6)); gl.setAttribute('y2', l.yy);
        gl.setAttribute('stroke', l.color); gl.setAttribute('stroke-width', o.bigFmt ? 1.6 : 1);
        gl.setAttribute('stroke-opacity', 0.55); svg.appendChild(gl);
      }
      const lh = o.fsLbl * 1.08;
      l.lineas.forEach((linea, li) => {
        const tx = ev_el('text');
        tx.setAttribute('x', o.x + o.w + (o.bigFmt ? 16 : 9));
        tx.setAttribute('y', l.yy - ((l.lineas.length - 1) / 2 - li) * lh + o.fsLbl * 0.34);
        tx.style.cssText = 'font-family:' + EV_SANS + ';font-size:' + o.fsLbl + 'px;font-weight:700;fill:' + l.color + ';';
        tx.textContent = linea;
        // hover sobre la etiqueta resalta su banda, igual que en el amistosos
        if (l.band != null) {
          tx.setAttribute('data-band-label', l.band);
          if (!o.isPng) {
            tx.style.cursor = 'default';
            tx.addEventListener('mouseenter', () => ev_bandEmph(svg, null, l.band));
            tx.addEventListener('mouseleave', () => ev_bandEmph(svg, null, null));
          }
        }
        svg.appendChild(tx);
      });
    });
  }
}

// ---------- hover / tap: crosshair por panel ----------
function ev_wireHover(svg) {
  if (svg.__evWired) return; svg.__evWired = true;
  const tip = document.getElementById('tooltipevo'); if (!tip) return;
  const oculta = () => {
    const c = svg.__evCtx;
    if (c && c.vline) c.vline.setAttribute('display', 'none');
    tip.style.opacity = '0'; tip.style.display = 'none';
  };
  svg.addEventListener('mousemove', (ev2) => {
    const c = svg.__evCtx;
    if (!c || !c.zones.length) { oculta(); return; }
    const en = ev_lang() === 'en', E = window.EVOL;
    const rc = svg.getBoundingClientRect(), sc = rc.width / EV_W;
    const lx = (ev2.clientX - rc.left) / sc, ly = (ev2.clientY - rc.top) / sc;
    const z = c.zones.find(z2 => lx >= z2.x && lx <= z2.x + z2.w && ly >= z2.y && ly <= z2.y + z2.h);
    if (!z) { oculta(); return; }
    let bi = Math.round((lx - z.x) / z.w * (c.NB - 1)); bi = Math.max(0, Math.min(c.NB - 1, bi));
    const xpix = z.x + (c.NB <= 1 ? 0.5 * z.w : (bi / (c.NB - 1)) * z.w);
    c.vline.setAttribute('display', ''); c.vline.setAttribute('x1', xpix); c.vline.setAttribute('x2', xpix);
    c.vline.setAttribute('y1', z.y); c.vline.setAttribute('y2', z.y + z.h);
    const row = z.p.mat[bi], tot = z.p.totals[bi];
    const binLab = en ? E.bins[c.B0 + bi].en : E.bins[c.B0 + bi].es;
    let html = '<div style="font-weight:600;margin-bottom:4px;">' + z.p.label + ' · ' + binLab +
      ' · ' + tot.toLocaleString(ev_loc()) + (en ? ' figures' : ' figuras') + '</div>';
    let items = c.cats.map(cat => ({ cat, v: row[cat.i] })).filter(x => x.v > 0);
    items.sort((a, b) => b.v - a.v);
    // en ocupaciones, la banda bajo el puntero va PRIMERA y destacada
    const hc = c.nivel === 'occ' ? svg.__evHoverCat : null;
    if (hc != null) {
      const k = items.findIndex(x => x.cat.i === hc);
      if (k > 0) items.unshift(items.splice(k, 1)[0]);
    }
    const top = c.nivel === 'occ' ? items.slice(0, 8) : items;
    top.forEach(x => {
      const dest = hc != null && x.cat.i === hc;
      const pc = tot ? Math.round(x.v / tot * 100) : 0;
      html += '<div style="display:flex;gap:6px;align-items:center;line-height:1.5;' + (dest ? 'font-weight:700;' : '') + '">' +
        '<span style="width:8px;height:8px;border-radius:2px;background:' + x.cat.color + ';flex:0 0 auto;' + (dest ? 'outline:1.5px solid #fff;' : '') + '"></span>' +
        '<span style="flex:1;">' + x.cat.name + '</span>' +
        '<strong>' + (c.share ? pc + '%' : x.v.toLocaleString(ev_loc())) + '</strong></div>';
    });
    if (c.nivel === 'occ' && items.length > 8) {
      const resto = items.slice(8).reduce((a, x) => a + x.v, 0);
      const pc = tot ? Math.round(resto / tot * 100) : 0;
      html += '<div style="display:flex;gap:6px;line-height:1.5;color:#C9C2B2;"><span style="width:8px;"></span><span style="flex:1;">' +
        (en ? 'others' : 'otras') + '</span><strong>' + (c.share ? pc + '%' : resto.toLocaleString(ev_loc())) + '</strong></div>';
    }
    tip.innerHTML = html; tip.style.display = 'block'; tip.style.opacity = '1';
    const x2 = ev2.clientX - rc.left, y2 = ev2.clientY - rc.top, tw = tip.offsetWidth || 220;
    tip.style.left = ((x2 + 16 + tw > rc.width) ? Math.max(2, x2 - tw - 16) : x2 + 14) + 'px';
    tip.style.top = (y2 + 14) + 'px';
  });
  svg.addEventListener('mouseleave', () => { oculta(); ev_bandEmph(svg, null, null); });
}

// ---------- subtítulo dinámico (el custom del editor manda) ----------
function ev_syncSub() {
  const el = document.querySelector('.chart-block[data-chart="evo"] .chart-subtitle'); if (!el) return;
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const tx = (ae && ae.texts && ae.texts[ev_lang() === 'en' ? 'en' : 'es']) || {};
  if ((tx.subtitle || '').trim()) return;
  const s = ev_state(), en = ev_lang() === 'en', u = s.sel[0];
  const lugar = u.t === 'w' ? null : ev_selLabel(u);
  const nivel = s.nivel === 'dom' ? (en ? 'domain' : 'rubro') : (en ? 'occupation' : 'ocupación');
  const b0 = Math.min(s.b0, s.b1), b1 = Math.max(s.b0, s.b1);
  const full = b0 === 0 && b1 === 11;
  const y0 = b0 === 0 ? null : 1500 + (b0 - 1) * 50;
  const y1 = b1 === 11 ? null : 1549 + (b1 - 1) * 50;
  let frase;
  if (en) {
    frase = 'Composition of famous figures by ' + nivel;
    if (full) frase += ' across history' + (lugar ? ', ' + lugar : ' worldwide');
    else {
      const per = y0 && y1 ? y0 + '–' + y1 : y0 ? 'since ' + y0 : 'until ' + y1;
      frase += ', ' + per + ', ' + (lugar || 'World');
    }
  } else {
    frase = 'Composición de las figuras célebres por ' + nivel;
    if (full) frase += ' a lo largo de la historia' + (lugar ? ', ' + lugar : ' en el Mundo');
    else {
      const per = y0 && y1 ? y0 + '–' + y1 : y0 ? 'desde ' + y0 : 'hasta ' + y1;
      frase += ', ' + per + ', ' + (lugar || 'Mundo');
    }
  }
  frase += '.';
  if (s.mode === 'abs') frase += en ? ' In counts.' : ' En cantidades.';
  el.textContent = frase;
}

// ---------- selector (buscador + chips, patrón podios) ----------
function ev_candidatos() {
  const E = window.EVOL, en = ev_lang() === 'en';
  const out = [{ t: 'w' }];
  (typeof REGION_ORDER !== 'undefined' ? REGION_ORDER : []).forEach(r => out.push({ t: 'r', reg: r }));
  E.isoMeta.forEach((m, i) => { if (m.reg) out.push({ t: 'c', i }); });
  return out;
}
function ev_renderChips() {
  // seleccion UNICA: un chip; Mundo es el piso (sin x); elegir otro REEMPLAZA
  const s = ev_state();
  const box = document.getElementById('evo-chips'); box.innerHTML = '';
  const u = s.sel[0];
  const chip = document.createElement('span');
  chip.className = 'm-selected-chip';
  chip.style.background = ev_selColor(u);
  chip.textContent = ev_selLabel(u);
  if (u.t !== 'w') {
    const x = document.createElement('button');
    x.className = 'm-chip-x'; x.innerHTML = '×'; x.setAttribute('aria-label', 'Volver al Mundo');
    x.addEventListener('click', () => { s.sel = [{ t: 'w' }]; ev_renderChips(); drawEvo(); });
    chip.appendChild(x);
  }
  box.appendChild(chip);
  document.getElementById('evo-search').placeholder = (typeof t === 'function') ? t('cevo-buscar') : 'Buscar país o región…';
}
function ev_setupSearch() {
  const input = document.getElementById('evo-search');
  const results = document.getElementById('evo-search-results');
  const s = ev_state();
  let matches = [], activeIdx = -1;
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const enSel = (u) => s.sel.some(v => ev_selKey(v) === ev_selKey(u));
  function toggle(u) {
    s.sel = [u];   // seleccion unica: reemplaza (Daniel, ronda 2)
    ev_renderChips(); drawEvo();
  }
  function getMatches(q) {
    if (!q) return [];
    const qn = norm(q);
    return ev_candidatos().filter(u => norm(ev_selLabel(u)).includes(qn)).slice(0, 8);
  }
  function paint() {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    const en = ev_lang() === 'en';
    results.innerHTML = matches.map((u, k) => {
      const cls = 'm-search-result' + (k === activeIdx ? ' m-active' : '') + (enSel(u) ? ' m-already' : '');
      // solo los paises llevan la region en gris; Mundo y regiones van a nombre pelado
      const tag = u.t === 'c' && typeof t === 'function' ? t('reg.' + window.EVOL.isoMeta[u.i].reg) : '';
      return '<div class="' + cls + '" data-k="' + k + '">' + ev_selLabel(u) +
        '<span class="m-search-region">' + tag + '</span></div>';
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result').forEach(el => {
      el.addEventListener('click', () => {
        toggle(matches[+el.dataset.k]); input.value = ''; results.classList.remove('open'); input.focus();
      });
    });
  }
  input.addEventListener('input', () => { matches = getMatches(input.value); activeIdx = matches.length ? 0 : -1; paint(); });
  input.addEventListener('keydown', ev2 => {
    if (!results.classList.contains('open')) return;
    if (ev2.key === 'ArrowDown') { ev2.preventDefault(); activeIdx = (activeIdx + 1) % matches.length; paint(); }
    else if (ev2.key === 'ArrowUp') { ev2.preventDefault(); activeIdx = (activeIdx - 1 + matches.length) % matches.length; paint(); }
    else if (ev2.key === 'Enter' && activeIdx >= 0) { ev2.preventDefault(); toggle(matches[activeIdx]); input.value = ''; results.classList.remove('open'); }
    else if (ev2.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', ev2 => {
    if (!input.contains(ev2.target) && !results.contains(ev2.target)) results.classList.remove('open');
  });
}

// ---------- periodo: doble slider sobre bins + cajitas de anio ----------
function ev_yearToBin(y) {
  y = +y;
  if (!isFinite(y)) return null;
  if (y < 1500) return 0;
  if (y >= 2000) return 11;
  return 1 + Math.floor((y - 1500) / 50);
}
function ev_syncPeriodo() {
  const s = ev_state();
  const r0 = document.getElementById('evo-r0'), r1 = document.getElementById('evo-r1');
  const n0 = document.getElementById('evo-y0'), n1 = document.getElementById('evo-y1');
  r0.value = s.b0; r1.value = s.b1;
  n0.value = s.b0 === 0 ? '' : 1500 + (s.b0 - 1) * 50;
  n1.value = s.b1 === 11 ? '' : 1549 + (s.b1 - 1) * 50;
  const f = document.getElementById('evo-fill');
  f.style.left = (s.b0 / 11 * 100) + '%';
  f.style.width = ((s.b1 - s.b0) / 11 * 100) + '%';
}
function ev_wirePeriodo() {
  const s = ev_state();
  document.getElementById('evo-r0').addEventListener('input', e => {
    s.b0 = Math.min(+e.target.value, s.b1); ev_syncPeriodo(); drawEvo();
  });
  document.getElementById('evo-r1').addEventListener('input', e => {
    s.b1 = Math.max(+e.target.value, s.b0); ev_syncPeriodo(); drawEvo();
  });
  document.getElementById('evo-y0').addEventListener('change', e => {
    const b = e.target.value === '' ? 0 : ev_yearToBin(e.target.value);
    if (b !== null) s.b0 = Math.min(b, s.b1);
    ev_syncPeriodo(); drawEvo();
  });
  document.getElementById('evo-y1').addEventListener('change', e => {
    const b = e.target.value === '' ? 11 : ev_yearToBin(e.target.value);
    if (b !== null) s.b1 = Math.max(b, s.b0);
    ev_syncPeriodo(); drawEvo();
  });
}

// ---------- toggles ----------
function ev_wireToggles() {
  const tm = document.getElementById('evo-mode');
  tm.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    ev_state().mode = b.dataset.mode;
    tm.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    drawEvo();
  }));
  const tn = document.getElementById('evo-nivel');
  tn.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    ev_state().nivel = b.dataset.nivel;
    tn.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    drawEvo();
  }));
}

// ---------- CSV (lo que se ve) ----------
function ev_csv() {
  const s = ev_state(), E = window.EVOL, en = ev_lang() === 'en';
  const q = (v) => (typeof v === 'string' && (v.includes(',') || v.includes('"'))) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const head = ['selection', 'period', s.nivel === 'dom' ? 'domain' : 'occupation', 'domain', 'n', 'share_pct'];
  const lines = [head.join(',')];
  s.sel.forEach(u => {
    const mat = ev_mat(u, s.nivel), lab = ev_selLabel(u);
    mat.forEach((row, b) => {
      const tot = row.reduce((a, v) => a + v, 0);
      row.forEach((v, k) => {
        if (!v) return;
        const cat = s.nivel === 'dom' ? E.doms[k] : E.occs[k];
        const dm = s.nivel === 'dom' ? cat : E.doms[cat.dom];
        lines.push([q(lab), q(en ? E.bins[b].en : E.bins[b].es), q(en ? cat.en : cat.es),
                    q(en ? dm.en : dm.es), v, tot ? (v / tot * 100).toFixed(1) : ''].join(','));
      });
    });
  });
  return '﻿' + lines.join('\n');
}

// ---------- init ----------
window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedraw = drawEvo;
function initEvo() {
  ev_state(); ev_renderChips(); ev_setupSearch(); ev_wireToggles(); ev_wirePeriodo(); ev_syncPeriodo(); drawEvo();
  ev_applyUrlState();
  // el editor (?nl=1) cambia formato, textos y tamaños: redibujar al instante
  window.addEventListener('atlas-editor-change', () => drawEvo());
  const btn = document.querySelector('button.download[data-chart="evo-csv"]');
  if (btn) btn.addEventListener('click', () => {
    const blob = new Blob([ev_csv()], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ev_lang() === 'en' ? 'the-atlas-05-fame-profile.csv' : 'el-atlas-05-perfil-de-la-fama.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
}
let _evMob = ev_isMobile();
window.addEventListener('resize', () => {
  if (!document.getElementById('chartevo')) return;
  const n2 = ev_isMobile(); if (n2 === _evMob) return; _evMob = n2; drawEvo();
});
