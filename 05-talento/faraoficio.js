// =============================================================
//  faraoficio.js — Chart 6 del N°5 "Talento"
//  "La fama cambió de oficio": composición del talento mundial por
//  década de nacimiento (área apilada 100%). El poder/ciencia/letras
//  ceden ante el deporte y el espectáculo. Toggle Mundo / LatAm.
//  Depende de window.FAMAOFICIO, LANG, utils.js.
// =============================================================
const FO_NS = 'http://www.w3.org/2000/svg';
const fo_el = (t) => document.createElementNS(FO_NS, t);
const FO_COLORS = {
  'Poder y figuras públicas': '#6B3D8B', 'Ciencia y tecnología': '#234B85',
  'Humanidades': '#2D6A3D', 'Artes y espectáculo': '#C9A227', 'Deportes': '#BE5D32',
};
function fo_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function fo_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function fo_measure(t, s, w) { if (!fo_measure._c) fo_measure._c = document.createElement('canvas').getContext('2d'); fo_measure._c.font = `${w || 400} ${s}px "Source Sans 3", system-ui, sans-serif`; return fo_measure._c.measureText(t).width; }

let FO_W = 1100, FO_H = 640;
function fo_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && fo_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { FO_W = PNG_FORMATS[fmt].vbW; FO_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { FO_W = 1100; FO_H = 1400; } else { FO_W = 1100; FO_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}
function fo_state() { if (!state[6]) state[6] = { scope: 'world' }; return state[6]; }

function drawFama() {
  const svg = document.getElementById('chart6'); if (!svg || typeof FAMAOFICIO === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip6'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = fo_dims(); const { bigFmt, isPng } = dims; const en = fo_lang() === 'en';
  svg.setAttribute('viewBox', `0 0 ${FO_W} ${FO_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const E = FAMAOFICIO, s = fo_state(), doms = E.domains, decs = E.decades;
  const ser = E[s.scope];
  // share por década (0-1) por dominio (en orden doms)
  const shares = decs.map(d => { const arr = ser[d] || doms.map(() => 0); const tot = arr.reduce((a, b) => a + b, 0) || 1; return arr.map(v => v / tot); });
  const totals = decs.map(d => (ser[d] || []).reduce((a, b) => a + b, 0));

  const fsLbl = bigFmt ? 25 : 14, fsTick = bigFmt ? 21 : 12, fsAxis = bigFmt ? 23 : 12.5;
  const right = bigFmt ? 200 : 130;   // espacio para etiquetas de dominio a la derecha
  const M = { top: bigFmt ? 30 : 18, right, bottom: bigFmt ? 64 : 40, left: bigFmt ? 56 : 40 };
  const PW = FO_W - M.left - M.right, PH = FO_H - M.top - M.bottom;
  const xS = (i) => M.left + (i / (decs.length - 1)) * PW;
  const yS = (frac) => M.top + frac * PH;   // frac 0 arriba, 1 abajo (100% apilado)

  // grid + ticks Y (0/25/50/75/100%)
  [0, .25, .5, .75, 1].forEach(f => {
    const y = yS(f);
    const gl = fo_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PW); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.style.stroke = 'var(--grid)'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = fo_el('text'); tk.setAttribute('x', M.left - (bigFmt ? 10 : 6)); tk.setAttribute('y', y + fsTick * 0.34); tk.setAttribute('text-anchor', 'end'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = 'var(--sans)'; tk.style.fill = 'var(--ink-muted)'; tk.textContent = Math.round(f * 100) + '%'; svg.appendChild(tk);
  });
  // ticks X (décadas, cada 40 años)
  decs.forEach((d, i) => { if (d % 40 !== 0 && d !== decs[decs.length - 1]) return;
    const tk = fo_el('text'); tk.setAttribute('x', xS(i)); tk.setAttribute('y', M.top + PH + (bigFmt ? 34 : 18)); tk.setAttribute('text-anchor', 'middle'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = 'var(--sans)'; tk.style.fill = 'var(--ink-muted)'; tk.textContent = d; svg.appendChild(tk);
  });

  // bandas apiladas (cumulativo). doms[0] abajo (frac 0..) → doms[last] arriba? Apilamos
  // desde arriba: el 1er dominio ocupa la franja superior. Usamos cumulativo top->bottom.
  const nd = doms.length;
  // cumulado por década: cum[i][k] = suma shares[0..k]
  const cum = shares.map(row => { let acc = 0; return row.map(v => (acc += v)); });
  const bandsG = fo_el('g'); svg.appendChild(bandsG);
  for (let k = 0; k < nd; k++) {
    let dpath = 'M ';
    // borde superior (cum hasta k-1) de izq a der
    for (let i = 0; i < decs.length; i++) { const up = k === 0 ? 0 : cum[i][k - 1]; dpath += (i ? ' L ' : '') + xS(i).toFixed(1) + ' ' + yS(up).toFixed(1); }
    // borde inferior (cum hasta k) de der a izq
    for (let i = decs.length - 1; i >= 0; i--) { dpath += ' L ' + xS(i).toFixed(1) + ' ' + yS(cum[i][k]).toFixed(1); }
    dpath += ' Z';
    const p = fo_el('path'); p.setAttribute('d', dpath); p.setAttribute('fill', FO_COLORS[doms[k].key] || '#999'); p.setAttribute('fill-opacity', 0.92);
    p.setAttribute('stroke', '#FAF8F3'); p.setAttribute('stroke-width', bigFmt ? 1 : 0.6); p.setAttribute('data-fo', doms[k].key); bandsG.appendChild(p);
  }
  // etiquetas de dominio a la derecha (en el centro vertical de su banda en la última década)
  const last = decs.length - 1;
  const labs = doms.map((dm, k) => { const up = k === 0 ? 0 : cum[last][k - 1], lo = cum[last][k]; return { dm, y: yS((up + lo) / 2), share: shares[last][k] }; });
  // anti-solape vertical simple
  labs.sort((a, b) => a.y - b.y); const gap = bigFmt ? fsLbl + 4 : 15;
  for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < gap) labs[i].y = labs[i - 1].y + gap;
  labs.forEach(l => {
    const tx = fo_el('text'); tx.setAttribute('x', M.left + PW + (bigFmt ? 14 : 8)); tx.setAttribute('y', l.y + fsLbl * 0.34); tx.setAttribute('text-anchor', 'start');
    tx.style.fontSize = fsLbl + 'px'; tx.style.fontFamily = 'var(--sans)'; tx.style.fontWeight = '700'; tx.style.fill = FO_COLORS[l.dm.key];
    tx.textContent = l.dm[en ? 'en' : 'es']; svg.appendChild(tx);
  });
  if (!isPng && (typeof HAS_HOVER === 'undefined' || HAS_HOVER)) fo_hover(svg, { decs, doms, shares, totals, M, PW, PH, xS, yS });
}

function fo_hover(svg, c) {
  const tip = document.getElementById('tooltip6'); if (!tip) return; const en = fo_lang() === 'en';
  const vline = fo_el('line'); vline.setAttribute('y1', c.M.top); vline.setAttribute('y2', c.M.top + c.PH); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('display', 'none'); svg.appendChild(vline);
  const cap = fo_el('rect'); cap.setAttribute('x', c.M.left); cap.setAttribute('y', c.M.top); cap.setAttribute('width', c.PW); cap.setAttribute('height', c.PH); cap.setAttribute('fill', 'transparent'); svg.appendChild(cap);
  const move = (ev) => {
    const rc = svg.getBoundingClientRect(), sc = rc.width / FO_W, lx = (ev.clientX - rc.left) / sc;
    let i = Math.round((lx - c.M.left) / c.PW * (c.decs.length - 1)); i = Math.max(0, Math.min(c.decs.length - 1, i));
    vline.setAttribute('display', ''); vline.setAttribute('x1', c.xS(i)); vline.setAttribute('x2', c.xS(i));
    let html = `<div style="font-weight:600;margin-bottom:4px;">${c.decs[i]}s · ${c.totals[i].toLocaleString(en ? 'en-US' : 'es-AR')} ${en ? 'figures' : 'figuras'}</div>`;
    c.doms.forEach((dm, k) => { const pc = Math.round(c.shares[i][k] * 100); if (pc < 1) return; html += `<div style="display:flex;gap:6px;align-items:center;line-height:1.5;"><span style="width:8px;height:8px;border-radius:2px;background:${FO_COLORS[dm.key]};"></span><span style="flex:1;">${dm[en ? 'en' : 'es']}</span><strong>${pc}%</strong></div>`; });
    tip.innerHTML = html; tip.style.display = 'block'; tip.style.opacity = '1';
    const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200;
    tip.style.left = ((x + 16 + tw > rc.width) ? Math.max(2, x - tw - 16) : x + 14) + 'px'; tip.style.top = (y + 14) + 'px';
  };
  svg.addEventListener('mousemove', move); svg.addEventListener('mouseleave', () => { vline.setAttribute('display', 'none'); tip.style.opacity = '0'; tip.style.display = 'none'; });
}

window.__atlasSupportsFormats = true; window.__atlasDefaultPngFormat = 'square'; window.__atlasRedraw = drawFama;
function initFama() { fo_state(); drawFama(); fo_wireToggle(); }
function fo_wireToggle() {
  const t = document.getElementById('fo-scope'); if (t && !t._b) { t._b = true; t.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { fo_state().scope = b.dataset.scope; t.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); drawFama(); fo_syncSubtitle(); })); }
  fo_syncSubtitle();
}
function fo_syncSubtitle() {
  const el = document.querySelector('.chart-block[data-chart="6"] .chart-subtitle'); if (!el) return; const en = fo_lang() === 'en', sc = fo_state().scope;
  el.textContent = en
    ? `Composition of notable people by birth decade. ${sc === 'latam' ? 'Latin America' : 'World'}: power, science and letters give way to sport and entertainment.`
    : `Composición de las figuras célebres por década de nacimiento. ${sc === 'latam' ? 'América Latina' : 'Mundo'}: el poder, la ciencia y las letras ceden ante el deporte y el espectáculo.`;
  const t = document.getElementById('fo-scope'); if (t) t.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.scope === sc));
}
let _foMob = fo_isMobile();
window.addEventListener('resize', () => { if (!document.getElementById('chart6')) return; const n = fo_isMobile(); if (n === _foMob) return; _foMob = n; drawFama(); });
