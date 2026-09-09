// =============================================================
//  genero.js — Chart 4 del N°5 "Talento"
//  Dumbbell: % de mujeres entre las figuras célebres, por dominio,
//  América Latina (terracota) vs el mundo (gris). La mujer LatAm
//  rompe el techo justo donde la región es débil (arte, ciencia)
//  y queda atrás en deporte y poder.
//  Depende de: window.GENERO (data-genero.js), LANG, utils.js.
// =============================================================

const GN_NS = 'http://www.w3.org/2000/svg';
const gn_el = (t) => document.createElementNS(GN_NS, t);
const GN_LAT = '#BE5D32';   // terracota — LatAm
const GN_WLD = '#8A8579';   // gris cálido — mundo

function gn_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function gn_label(d) { return gn_lang() === 'en' ? d.en : d.es; }
function gn_pct(v) { return Math.round(v) + '%'; }
function gn_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function gn_measure(text, size, weight) {
  if (!gn_measure._c) gn_measure._c = document.createElement('canvas').getContext('2d');
  gn_measure._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return gn_measure._c.measureText(text).width;
}

let GN_W = 1100, GN_H = 640;
function gn_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && gn_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { GN_W = PNG_FORMATS[fmt].vbW; GN_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { GN_W = 1100; GN_H = 1180; }
  else { GN_W = 1100; GN_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawGenero() {
  const svg = document.getElementById('chart4'); if (!svg || typeof GENERO === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip4'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = gn_dims(); const { bigFmt, isPng } = dims;
  svg.setAttribute('viewBox', `0 0 ${GN_W} ${GN_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);
  const en = gn_lang() === 'en';

  const rows = GENERO.domains.slice().sort((a, b) => b.latam_fem - a.latam_fem);
  const fsLbl = bigFmt ? 25 : 14, fsVal = bigFmt ? 23 : 13, fsTick = bigFmt ? 21 : 12, fsAxis = bigFmt ? 23 : 12.5, fsLeg = bigFmt ? 24 : 13;

  let maxLblW = 0; rows.forEach(r => { const w = gn_measure(gn_label(r), fsLbl, 600); if (w > maxLblW) maxLblW = w; });
  const left = Math.min(maxLblW + (bigFmt ? 24 : 12), GN_W * 0.34);
  const right = bigFmt ? 80 : 48;
  const top = bigFmt ? 96 : 56;       // leyenda arriba
  const axisH = bigFmt ? 60 : 38;
  const bottom = axisH;
  const plotW = GN_W - left - right;
  const plotH = GN_H - top - bottom;
  const rowH = plotH / rows.length;

  const xMax = 60;
  const xS = (v) => left + (v / xMax) * plotW;
  let xticks = [0, 10, 20, 30, 40, 50, 60];

  // grid + ticks
  xticks.forEach(v => {
    const x = xS(v);
    const gl = gn_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', top); gl.setAttribute('y2', top + plotH); gl.style.stroke = '#ECE7D8'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = gn_el('text'); tk.setAttribute('x', x); tk.setAttribute('y', top + plotH + (bigFmt ? 30 : 18)); tk.setAttribute('text-anchor', 'middle'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tk.style.fill = '#8A8579'; tk.textContent = v + '%'; svg.appendChild(tk);
  });
  // ref 50% (paridad)
  const xPar = xS(50);
  const pr = gn_el('line'); pr.setAttribute('x1', xPar); pr.setAttribute('x2', xPar); pr.setAttribute('y1', top - (bigFmt ? 4 : 2)); pr.setAttribute('y2', top + plotH); pr.style.stroke = '#C9C2B2'; pr.setAttribute('stroke-width', bigFmt ? 1.6 : 1); pr.setAttribute('stroke-dasharray', bigFmt ? '5 5' : '3 3'); svg.appendChild(pr);
  const prt = gn_el('text'); prt.setAttribute('x', xPar); prt.setAttribute('y', top - (bigFmt ? 12 : 7)); prt.setAttribute('text-anchor', 'middle'); prt.style.fontSize = fsTick + 'px'; prt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; prt.style.fill = '#8A8579'; prt.textContent = en ? 'parity' : 'paridad'; svg.appendChild(prt);

  // filas (dumbbell)
  const rDot = bigFmt ? 13 : 7.5;
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    // etiqueta dominio
    const lb = gn_el('text'); lb.setAttribute('x', left - (bigFmt ? 14 : 8)); lb.setAttribute('y', cy + fsLbl * 0.34); lb.setAttribute('text-anchor', 'end'); lb.style.fontSize = fsLbl + 'px'; lb.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; lb.style.fontWeight = '600'; lb.style.fill = '#1A1A1A'; lb.setAttribute('data-gn', r.key); lb.textContent = gn_label(r); svg.appendChild(lb);
    // línea conectora
    const xw = xS(r.world_fem), xl = xS(r.latam_fem);
    const cn = gn_el('line'); cn.setAttribute('x1', xw); cn.setAttribute('x2', xl); cn.setAttribute('y1', cy); cn.setAttribute('y2', cy); cn.style.stroke = '#C9C2B2'; cn.setAttribute('stroke-width', bigFmt ? 3 : 2); svg.appendChild(cn);
    // dot mundo
    const dw = gn_el('circle'); dw.setAttribute('cx', xw); dw.setAttribute('cy', cy); dw.setAttribute('r', rDot); dw.setAttribute('fill', GN_WLD); dw.setAttribute('data-gn', r.key); dw.style.cursor = 'pointer'; svg.appendChild(dw);
    // dot LatAm
    const dl = gn_el('circle'); dl.setAttribute('cx', xl); dl.setAttribute('cy', cy); dl.setAttribute('r', rDot); dl.setAttribute('fill', GN_LAT); dl.setAttribute('data-gn', r.key); dl.style.cursor = 'pointer'; svg.appendChild(dl);
    // valores: a los costados (el menor a su izquierda, el mayor a su derecha)
    const loIsW = r.world_fem <= r.latam_fem;
    const loX = loIsW ? xw : xl, hiX = loIsW ? xl : xw;
    const loV = loIsW ? r.world_fem : r.latam_fem, hiV = loIsW ? r.latam_fem : r.world_fem;
    const loCol = loIsW ? GN_WLD : GN_LAT, hiCol = loIsW ? GN_LAT : GN_WLD;
    const vlo = gn_el('text'); vlo.setAttribute('x', loX - rDot - (bigFmt ? 10 : 6)); vlo.setAttribute('y', cy + fsVal * 0.34); vlo.setAttribute('text-anchor', 'end'); vlo.style.fontSize = fsVal + 'px'; vlo.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; vlo.style.fontWeight = '700'; vlo.style.fill = loCol; vlo.style.fontVariantNumeric = 'tabular-nums'; vlo.textContent = gn_pct(loV); svg.appendChild(vlo);
    const vhi = gn_el('text'); vhi.setAttribute('x', hiX + rDot + (bigFmt ? 10 : 6)); vhi.setAttribute('y', cy + fsVal * 0.34); vhi.setAttribute('text-anchor', 'start'); vhi.style.fontSize = fsVal + 'px'; vhi.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; vhi.style.fontWeight = '700'; vhi.style.fill = hiCol; vhi.style.fontVariantNumeric = 'tabular-nums'; vhi.textContent = gn_pct(hiV); svg.appendChild(vhi);
  });

  // título eje X
  const axt = gn_el('text'); axt.setAttribute('x', left + plotW / 2); axt.setAttribute('y', GN_H - (bigFmt ? 16 : 8)); axt.setAttribute('text-anchor', 'middle'); axt.style.fontSize = fsAxis + 'px'; axt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; axt.style.fill = '#8A8579'; axt.textContent = en ? '% of notable figures who are women' : '% de las figuras célebres que son mujeres'; svg.appendChild(axt);

  // leyenda (arriba)
  const legItems = [{ c: GN_LAT, t: en ? 'Latin America' : 'América Latina' }, { c: GN_WLD, t: en ? 'World' : 'Mundo' }];
  const swR = bigFmt ? 12 : 7, gapTxt = bigFmt ? 10 : 6, gapItem = bigFmt ? 40 : 22;
  const widths = legItems.map(it => swR * 2 + gapTxt + gn_measure(it.t, fsLeg, 600));
  const totalW = widths.reduce((s, w, i) => s + w + (i ? gapItem : 0), 0);
  let cx = left + plotW / 2 - totalW / 2; const lgY = bigFmt ? 40 : 24;
  legItems.forEach((it, i) => {
    const dc = gn_el('circle'); dc.setAttribute('cx', cx + swR); dc.setAttribute('cy', lgY); dc.setAttribute('r', swR); dc.setAttribute('fill', it.c); svg.appendChild(dc);
    const tx = gn_el('text'); tx.setAttribute('x', cx + swR * 2 + gapTxt); tx.setAttribute('y', lgY + fsLeg * 0.34); tx.style.fontSize = fsLeg + 'px'; tx.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tx.style.fontWeight = '600'; tx.style.fill = '#4A4A4A'; tx.textContent = it.t; svg.appendChild(tx);
    cx += widths[i] + gapItem;
  });

  const interactive = !isPng /* tooltips tambien en touch (criterio 6e) */;
  if (interactive) gn_wireHover(svg, rows);
}

function gn_wireHover(svg, rows) {
  const tip = document.getElementById('tooltip4'); if (!tip) return;
  const en = gn_lang() === 'en';
  const byKey = {}; rows.forEach(r => byKey[r.key] = r);
  svg.querySelectorAll('circle[data-gn]').forEach(c => {
    c.addEventListener('mouseenter', (ev) => {
      const r = byKey[c.getAttribute('data-gn')];
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${gn_label(r)}</div>`
        + `<div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${GN_LAT};"></span>${en ? 'Latin America' : 'América Latina'}: <strong>${gn_pct(r.latam_fem)}</strong></div>`
        + `<div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${GN_WLD};"></span>${en ? 'World' : 'Mundo'}: <strong>${gn_pct(r.world_fem)}</strong></div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; gn_placeTip(tip, ev, svg);
    });
    c.addEventListener('mousemove', (ev) => gn_placeTip(tip, ev, svg));
    c.addEventListener('mouseleave', () => { tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function gn_placeTip(tip, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200;
  const lft = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px';
}

window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedraw = drawGenero;
function initGenero() { drawGenero(); }

let _gnMob = gn_isMobile();
window.addEventListener('resize', () => {
  if (!document.getElementById('chart4')) return;
  const now = gn_isMobile(); if (now === _gnMob) return; _gnMob = now; drawGenero();
});


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="4-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.GENERO;
    const cols = ['domain_key', 'domain_es', 'domain_en', 'women_latam_pct', 'women_world_pct', 'n_latam', 'n_world'];
    const rows = D.domains.map(d => [d.key, d.es, d.en, d.latam_fem, d.world_fem, d.n_latam, d.n_world]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-women-by-domain.csv' : 'el-atlas-05-mujeres-por-dominio.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
