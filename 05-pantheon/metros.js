// =============================================================
//  metros.js — Chart 9 del N°5 "Talento"
//  "Las ciudades de la fama": ranking absoluto de áreas metropolitanas
//  por figuras célebres nacidas ahí (clustering 35 km, +backfill Wikidata).
//  Barras horizontales, LatAm en terracota. Toggle Mundo / América Latina.
//  Depende de window.METROS (data-metros.js), LANG, utils.js.
//  Clonado del motor de barras de subnac.js (chart 8).
// =============================================================
const MT_NS = 'http://www.w3.org/2000/svg';
const mt_el = (t) => document.createElementNS(MT_NS, t);
const MT_LAT_COL = '#BE5D32';   // terracota — LatAm
const MT_OTH_COL = '#5C7A99';   // pizarra — resto
const MT_DOM_SHORT = { 'Deportes': { es: 'deporte', en: 'sport' }, 'Artes y espectáculo': { es: 'arte y espectáculo', en: 'arts' }, 'Ciencia y tecnología': { es: 'ciencia', en: 'science' }, 'Humanidades': { es: 'humanidades', en: 'humanities' }, 'Poder y figuras públicas': { es: 'poder', en: 'power' }, 'Negocios y exploración': { es: 'negocios', en: 'business' } };

function mt_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function mt_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function mt_measure(t, s, w) { if (!mt_measure._c) mt_measure._c = document.createElement('canvas').getContext('2d'); mt_measure._c.font = `${w || 400} ${s}px "Source Sans 3", system-ui, sans-serif`; return mt_measure._c.measureText(t).width; }
function mt_num(n) { return n.toLocaleString(mt_lang() === 'en' ? 'en-US' : 'es-AR'); }
function mt_part(p) { return String(p).split(',')[0].trim(); }
function mt_state() { if (!state[9]) state[9] = { scope: 'world' }; return state[9]; }

let MT_W = 1100, MT_H = 640;
function mt_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && mt_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { MT_W = PNG_FORMATS[fmt].vbW; MT_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { MT_W = 1100; MT_H = 1500; } else { MT_W = 1100; MT_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawMetros() {
  const svg = document.getElementById('chart9'); if (!svg || typeof METROS === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip9'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = mt_dims(); const { bigFmt, isPng } = dims; const en = mt_lang() === 'en';
  svg.setAttribute('viewBox', `0 0 ${MT_W} ${MT_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const scope = mt_state().scope;
  const N = bigFmt ? 26 : 22;
  let pool = METROS.metros.slice();
  if (scope === 'latam') pool = pool.filter(m => m.lat_am);
  pool.sort((a, b) => b.n - a.n);
  const rows = pool.slice(0, N);

  const fsLbl = bigFmt ? 22 : 12.5, fsVal = bigFmt ? 22 : 12.5, fsTick = bigFmt ? 20 : 11.5, fsAxis = bigFmt ? 22 : 12.5, fsLeg = bigFmt ? 22 : 12.5;
  let maxLblW = 0; rows.forEach(r => { const w = mt_measure(r.city, fsLbl, 600); if (w > maxLblW) maxLblW = w; });
  const left = Math.min(maxLblW + (bigFmt ? 22 : 12), MT_W * 0.28);
  const right = bigFmt ? 96 : 60;
  const top = bigFmt ? 56 : 34;
  const legendH = scope === 'world' ? (bigFmt ? 52 : 34) : 0;
  const axisH = bigFmt ? 64 : 40;
  const bottom = axisH + legendH;
  const plotW = MT_W - left - right;
  const plotH = MT_H - top - bottom;
  const rowH = plotH / rows.length;
  const barH = Math.min(rowH * 0.66, bigFmt ? 34 : 18);

  // tope robusto: paso "lindo" garantizando xMax >= max (evita que la barra mayor desborde)
  const maxN = Math.max(...rows.map(r => r.n));
  const rawStep = maxN / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = ([1, 2, 2.5, 5, 10].map(x => x * mag).find(s => s >= rawStep)) || mag * 10;
  const xMax = Math.ceil(maxN / step) * step;
  const xS = (v) => left + (v / xMax) * plotW;
  let xticks = []; for (let v = 0; v <= xMax + 1e-9; v += step) xticks.push(Math.round(v));

  xticks.forEach(v => {
    const x = xS(v);
    const gl = mt_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', top); gl.setAttribute('y2', top + plotH); gl.style.stroke = 'var(--grid)'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = mt_el('text'); tk.setAttribute('x', x); tk.setAttribute('y', top + plotH + (bigFmt ? 28 : 16)); tk.setAttribute('text-anchor', 'middle'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = 'var(--sans)'; tk.style.fill = 'var(--ink-muted)'; tk.textContent = mt_num(v); svg.appendChild(tk);
  });

  const g = mt_el('g'); svg.appendChild(g);
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2, isLat = r.lat_am, col = isLat ? MT_LAT_COL : MT_OTH_COL;
    const lb = mt_el('text'); lb.setAttribute('x', left - (bigFmt ? 12 : 7)); lb.setAttribute('y', cy + fsLbl * 0.34); lb.setAttribute('text-anchor', 'end');
    lb.style.fontSize = fsLbl + 'px'; lb.style.fontFamily = 'var(--sans)'; lb.style.fontWeight = isLat ? '700' : '500'; lb.style.fill = isLat ? 'var(--ink)' : 'var(--ink-soft)';
    lb.setAttribute('data-mt', i); lb.textContent = r.city; g.appendChild(lb);
    const bw = Math.max(2, xS(r.n) - left);
    const bar = mt_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', cy - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', col); bar.setAttribute('data-mt', i); bar.style.cursor = 'pointer'; g.appendChild(bar);
    const vt = mt_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', cy + fsVal * 0.34); vt.style.fontSize = fsVal + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.style.fill = 'var(--ink)'; vt.style.fontVariantNumeric = 'tabular-nums'; vt.setAttribute('data-mt', i); vt.textContent = mt_num(r.n); g.appendChild(vt);
  });

  // título eje X
  const axt = mt_el('text'); axt.setAttribute('x', left + plotW / 2); axt.setAttribute('y', top + plotH + (bigFmt ? 54 : 34)); axt.setAttribute('text-anchor', 'middle'); axt.style.fontSize = fsAxis + 'px'; axt.style.fontFamily = 'var(--sans)'; axt.style.fill = 'var(--ink-muted)';
  axt.textContent = en ? 'Notable people born in the metro area' : 'Figuras célebres nacidas en el área metropolitana'; svg.appendChild(axt);

  // leyenda (solo en vista Mundo, donde hay LatAm vs resto)
  if (scope === 'world') {
    const legY = MT_H - legendH / 2 - (bigFmt ? 4 : 3);
    const swR = bigFmt ? 11 : 7, gapTxt = bigFmt ? 9 : 6, gapItem = bigFmt ? 32 : 18;
    const items = [{ c: MT_LAT_COL, l: en ? 'Latin America' : 'América Latina' }, { c: MT_OTH_COL, l: en ? 'Rest of the world' : 'Resto del mundo' }];
    items.forEach(it => it.w = swR * 2 + gapTxt + mt_measure(it.l, fsLeg, 500));
    const totalW = items.reduce((s, it, i) => s + it.w + (i ? gapItem : 0), 0);
    let cx = left + plotW / 2 - totalW / 2; if (cx < 8) cx = 8;
    items.forEach(it => {
      const sw = mt_el('rect'); sw.setAttribute('x', cx); sw.setAttribute('y', legY - swR); sw.setAttribute('width', swR * 2); sw.setAttribute('height', swR * 2); sw.setAttribute('rx', 3); sw.setAttribute('fill', it.c); svg.appendChild(sw);
      const tx = mt_el('text'); tx.setAttribute('x', cx + swR * 2 + gapTxt); tx.setAttribute('y', legY + fsLeg * 0.34); tx.style.fontSize = fsLeg + 'px'; tx.style.fontFamily = 'var(--sans)'; tx.style.fontWeight = '500'; tx.style.fill = 'var(--ink-soft)'; tx.textContent = it.l; svg.appendChild(tx);
      cx += it.w + gapItem;
    });
  }

  if (!isPng /* tooltips tambien en touch (criterio 6e) */) mt_wireHover(svg, rows);
}

function mt_emph(svg, k) { svg.querySelectorAll('[data-mt]').forEach(el => { el.style.opacity = (k == null || el.getAttribute('data-mt') === k) ? '' : '0.2'; }); }
function mt_wireHover(svg, rows) {
  const tip = document.getElementById('tooltip9'); if (!tip) return; const en = mt_lang() === 'en';
  svg.querySelectorAll('rect[data-mt]').forEach(bar => {
    const k = bar.getAttribute('data-mt'), r = rows[+k];
    bar.addEventListener('mouseenter', (ev) => {
      mt_emph(svg, k);
      const di = r.dom.indexOf(Math.max(...r.dom)); const dom = (METROS.doms[di] && MT_DOM_SHORT[METROS.doms[di]]) ? MT_DOM_SHORT[METROS.doms[di]][en ? 'en' : 'es'] : '';
      const parts = (r.parts || []).map(mt_part).filter(p => p && p !== r.city).slice(0, 3);
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:2px;">${r.city} <span style="color:var(--ink-muted);font-weight:400;">· ${r.country}</span></div>`
        + `<div style="line-height:1.55;">`
        + `<strong style="font-variant-numeric:tabular-nums;">${mt_num(r.n)}</strong> ${en ? 'notable people' : 'figuras célebres'}<br>`
        + (dom ? `<span style="color:var(--ink-muted);">${en ? 'mostly' : 'sobre todo'} ${dom}</span><br>` : '')
        + `${en ? 'most famous' : 'la más célebre'}: <strong>${r.top}</strong>`
        + (parts.length ? `<br><span style="color:var(--ink-muted);font-size:11px;">${en ? 'incl.' : 'incluye'} ${parts.join(', ')}</span>` : '')
        + `</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; mt_placeTip(tip, ev, svg);
    });
    bar.addEventListener('mousemove', (ev) => mt_placeTip(tip, ev, svg));
    bar.addEventListener('mouseleave', () => { mt_emph(svg, null); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function mt_placeTip(tip, ev, svg) { const rc = svg.getBoundingClientRect(); const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 220; const lft = (x + 16 + tw > rc.width || x > rc.width * 0.62) ? Math.max(2, x - tw - 16) : (x + 14); tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px'; }

window.__atlasSupportsFormats = true; window.__atlasDefaultPngFormat = 'square'; window.__atlasRedraw = drawMetros;
function initMetros() { mt_state(); drawMetros(); mt_wireToggle(); }
function mt_wireToggle() {
  const t = document.getElementById('mt-scope'); if (t && !t._b) { t._b = true; t.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { mt_state().scope = b.dataset.scope; t.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); drawMetros(); })); }
  const v = mt_state().scope, tt = document.getElementById('mt-scope'); if (tt) tt.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.scope === v));
}
let _mtMob = mt_isMobile();
window.addEventListener('resize', () => { if (!document.getElementById('chart9')) return; const n = mt_isMobile(); if (n === _mtMob) return; _mtMob = n; drawMetros(); });


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="9-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.METROS;
    const cols = ['city', 'country', 'n_figures', 'latam', 'top_figure', 'satellite_towns'].concat(D.doms.map(d => 'n_' + d));
    const rows = D.metros.map(m => [m.city, m.country, m.n, m.lat_am ? 1 : 0, m.top, (m.parts || []).join(' / ')].concat(m.dom));
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-fame-cities.csv' : 'el-atlas-05-ciudades-de-la-fama.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
