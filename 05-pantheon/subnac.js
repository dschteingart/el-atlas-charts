// =============================================================
//  subnac.js — Chart 8 del N°5 "Talento"
//  "El talento se hace en la capital": % de las figuras célebres de
//  cada país nacidas en su región líder (concentración subnacional).
//  Barras horizontales, LatAm en terracota. Toggle más concentrados /
//  más distribuidos. Depende de window.SUBNAC (data-subnacional.js).
//  Solo países con suficientes regiones (nreg≥10) para comparar justo.
// =============================================================
const SB_NS = 'http://www.w3.org/2000/svg';
const sb_el = (t) => document.createElementNS(SB_NS, t);
const SB_LAT_COL = '#BE5D32';   // terracota — LatAm
const SB_OTH_COL = '#5C7A99';   // pizarra — resto
const SB_LAT = new Set(['ARG','BOL','BRA','CHL','COL','CRI','CUB','DOM','ECU','SLV','GTM','HTI','HND','MEX','NIC','PAN','PRY','PER','URY','VEN','PRI']);
const SB_MIN_NREG = 10;         // comparar solo países con ≥10 regiones (evita estados/ciudad)

function sb_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function sb_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function sb_measure(t, s, w) { if (!sb_measure._c) sb_measure._c = document.createElement('canvas').getContext('2d'); sb_measure._c.font = `${w || 400} ${s}px "Source Sans 3", system-ui, sans-serif`; return sb_measure._c.measureText(t).width; }
function sb_name(r) { return sb_lang() === 'en' ? r.en : r.es; }
function sb_pct(v) { return v.toFixed(1).replace('.', sb_lang() === 'en' ? '.' : ',') + '%'; }
function sb_state() { if (!state[8]) state[8] = { view: 'conc' }; return state[8]; }

let SB_W = 1100, SB_H = 640;
function sb_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && sb_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { SB_W = PNG_FORMATS[fmt].vbW; SB_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { SB_W = 1100; SB_H = 1500; } else { SB_W = 1100; SB_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawSubnac() {
  const svg = document.getElementById('chart8'); if (!svg || typeof SUBNAC === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip8'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = sb_dims(); const { bigFmt, isPng } = dims; const en = sb_lang() === 'en';
  svg.setAttribute('viewBox', `0 0 ${SB_W} ${SB_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const view = sb_state().view;   // 'conc' (desc) | 'disp' (asc)
  const N = bigFmt ? 26 : 22;
  let pool = SUBNAC.rows.filter(r => r.nreg >= SB_MIN_NREG && r.total >= 50);
  pool.sort((a, b) => view === 'conc' ? b.topShare - a.topShare : a.topShare - b.topShare);
  const rows = pool.slice(0, N);
  // siempre mostradas de mayor a menor share dentro del recorte (más legible)
  rows.sort((a, b) => b.topShare - a.topShare);

  const fsLbl = bigFmt ? 22 : 12.5, fsVal = bigFmt ? 22 : 12.5, fsTick = bigFmt ? 20 : 11.5, fsAxis = bigFmt ? 22 : 12.5, fsLeg = bigFmt ? 22 : 12.5;
  let maxLblW = 0; rows.forEach(r => { const w = sb_measure(sb_name(r), fsLbl, 600); if (w > maxLblW) maxLblW = w; });
  const left = Math.min(maxLblW + (bigFmt ? 22 : 12), SB_W * 0.30);
  const right = bigFmt ? 90 : 56;
  const top = bigFmt ? 56 : 34;
  const legendH = bigFmt ? 52 : 34;
  const axisH = bigFmt ? 64 : 40;
  const bottom = axisH + legendH;
  const plotW = SB_W - left - right;
  const plotH = SB_H - top - bottom;
  const rowH = plotH / rows.length;
  const barH = Math.min(rowH * 0.66, bigFmt ? 34 : 18);

  const xMax = (typeof niceLinearTicks === 'function') ? (niceLinearTicks(0, Math.max(...rows.map(r => r.topShare)) * 1.04, 5).slice(-1)[0] || 100) : 100;
  const xS = (v) => left + (v / xMax) * plotW;
  let xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 20, 40, 60, 80];
  if (xticks[0] !== 0) xticks.unshift(0);

  xticks.forEach(v => {
    const x = xS(v);
    const gl = sb_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', top); gl.setAttribute('y2', top + plotH); gl.style.stroke = '#ECE7D8'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = sb_el('text'); tk.setAttribute('x', x); tk.setAttribute('y', top + plotH + (bigFmt ? 28 : 16)); tk.setAttribute('text-anchor', 'middle'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tk.style.fill = '#8A8579'; tk.textContent = v + '%'; svg.appendChild(tk);
  });

  const g = sb_el('g'); svg.appendChild(g);
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2, isLat = SB_LAT.has(r.iso), col = isLat ? SB_LAT_COL : SB_OTH_COL;
    const lb = sb_el('text'); lb.setAttribute('x', left - (bigFmt ? 12 : 7)); lb.setAttribute('y', cy + fsLbl * 0.34); lb.setAttribute('text-anchor', 'end');
    lb.style.fontSize = fsLbl + 'px'; lb.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; lb.style.fontWeight = isLat ? '700' : '500'; lb.style.fill = isLat ? '#1A1A1A' : '#4A4A4A';
    lb.setAttribute('data-sb', r.iso); lb.textContent = sb_name(r); g.appendChild(lb);
    const bw = Math.max(2, xS(r.topShare) - left);
    const bar = sb_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', cy - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', col); bar.setAttribute('data-sb', r.iso); bar.style.cursor = 'pointer'; g.appendChild(bar);
    const vt = sb_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 10 : 6)); vt.setAttribute('y', cy + fsVal * 0.34); vt.style.fontSize = fsVal + 'px'; vt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; vt.style.fontWeight = '700'; vt.style.fill = '#1A1A1A'; vt.style.fontVariantNumeric = 'tabular-nums'; vt.setAttribute('data-sb', r.iso); vt.textContent = sb_pct(r.topShare); g.appendChild(vt);
  });

  // título eje X
  const axt = sb_el('text'); axt.setAttribute('x', left + plotW / 2); axt.setAttribute('y', top + plotH + (bigFmt ? 54 : 34)); axt.setAttribute('text-anchor', 'middle'); axt.style.fontSize = fsAxis + 'px'; axt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; axt.style.fill = '#8A8579';
  axt.textContent = en ? '% of the country’s notable people born in its leading region' : '% de las figuras célebres del país nacidas en su región líder'; svg.appendChild(axt);

  // leyenda
  const legY = SB_H - legendH / 2 - (bigFmt ? 4 : 3);
  const swR = bigFmt ? 11 : 7, gapTxt = bigFmt ? 9 : 6, gapItem = bigFmt ? 32 : 18;
  const items = [{ c: SB_LAT_COL, l: en ? 'Latin America' : 'América Latina' }, { c: SB_OTH_COL, l: en ? 'Rest of the world' : 'Resto del mundo' }];
  items.forEach(it => it.w = swR * 2 + gapTxt + sb_measure(it.l, fsLeg, 500));
  const totalW = items.reduce((s, it, i) => s + it.w + (i ? gapItem : 0), 0);
  let cx = left + plotW / 2 - totalW / 2; if (cx < 8) cx = 8;
  items.forEach(it => {
    const sw = sb_el('rect'); sw.setAttribute('x', cx); sw.setAttribute('y', legY - swR); sw.setAttribute('width', swR * 2); sw.setAttribute('height', swR * 2); sw.setAttribute('rx', 3); sw.setAttribute('fill', it.c); svg.appendChild(sw);
    const tx = sb_el('text'); tx.setAttribute('x', cx + swR * 2 + gapTxt); tx.setAttribute('y', legY + fsLeg * 0.34); tx.style.fontSize = fsLeg + 'px'; tx.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tx.style.fontWeight = '500'; tx.style.fill = '#4A4A4A'; tx.textContent = it.l; svg.appendChild(tx);
    cx += it.w + gapItem;
  });

  if (!isPng /* tooltips tambien en touch (criterio 6e) */) sb_wireHover(svg, rows);
}

function sb_emph(svg, iso) { svg.querySelectorAll('[data-sb]').forEach(el => { el.style.opacity = (iso == null || el.getAttribute('data-sb') === iso) ? '' : '0.2'; }); }
function sb_wireHover(svg, rows) {
  const tip = document.getElementById('tooltip8'); if (!tip) return; const en = sb_lang() === 'en';
  const by = {}; rows.forEach(r => by[r.iso] = r);
  svg.querySelectorAll('rect[data-sb]').forEach(bar => {
    const iso = bar.getAttribute('data-sb'), r = by[iso];
    bar.addEventListener('mouseenter', (ev) => {
      sb_emph(svg, iso);
      const nf = (n) => n.toLocaleString(en ? 'en-US' : 'es-AR');
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${sb_name(r)}</div>`
        + `<div style="line-height:1.55;">`
        + `<strong style="font-variant-numeric:tabular-nums;">${sb_pct(r.topShare)}</strong> ${en ? 'in' : 'en'} <strong>${r.topName}</strong><br>`
        + `<span style="color:#8A8579;">${nf(r.total)} ${en ? 'figures across' : 'figuras en'} ${r.nreg} ${en ? 'regions' : 'regiones'}</span>`
        + `</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; sb_placeTip(tip, ev, svg);
    });
    bar.addEventListener('mousemove', (ev) => sb_placeTip(tip, ev, svg));
    bar.addEventListener('mouseleave', () => { sb_emph(svg, null); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function sb_placeTip(tip, ev, svg) { const rc = svg.getBoundingClientRect(); const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200; const lft = (x + 16 + tw > rc.width || x > rc.width * 0.66) ? Math.max(2, x - tw - 16) : (x + 14); tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px'; }

window.__atlasSupportsFormats = true; window.__atlasDefaultPngFormat = 'square'; window.__atlasRedraw = drawSubnac;
function initSubnac() { sb_state(); drawSubnac(); sb_wireToggle(); }
function sb_wireToggle() {
  const t = document.getElementById('sb-view'); if (t && !t._b) { t._b = true; t.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { sb_state().view = b.dataset.view; t.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); drawSubnac(); })); }
  const v = sb_state().view, tt = document.getElementById('sb-view'); if (tt) tt.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
}
let _sbMob = sb_isMobile();
window.addEventListener('resize', () => { if (!document.getElementById('chart8')) return; const n = sb_isMobile(); if (n === _sbMob) return; _sbMob = n; drawSubnac(); });


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="8-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.SUBNAC;
    const cols = ['iso3', 'country_es', 'country_en', 'region', 'figures_total', 'subregions_n', 'top_region_share_pct', 'top_region', 'top_region_pop'];
    const rows = D.rows.map(r => [r.iso, r.es, r.en, r.region, r.total, r.nreg, r.topShare, r.topName, r.topPop]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-subnational-concentration.csv' : 'el-atlas-05-concentracion-subnacional.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
