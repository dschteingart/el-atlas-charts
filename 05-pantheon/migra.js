// =============================================================
//  migra.js — Chart 7 del N°5 "Talento"
//  "La fama también emigra": saldo entre figuras célebres que un país
//  pierde (nacieron ahí, murieron afuera) y gana (nacieron afuera,
//  murieron ahí). Barras divergentes tipo pirámide: imanes a la derecha
//  (verde), desagües a la izquierda (terracota). Toggle absoluto / relativo.
//  Depende de window.MIGRACION (data-migracion.js), LANG, utils.js.
// =============================================================
const MG_NS = 'http://www.w3.org/2000/svg';
const mg_el = (t) => document.createElementNS(MG_NS, t);
const MG_POS = '#2E7D5B';   // imán (gana fama) — verde
const MG_NEG = '#C25B3F';   // desagüe (exporta fama) — terracota
const MG_GOLD = '#C9A227';  // marca LatAm
const MG_LAT = new Set(['ARG','BOL','BRA','CHL','COL','CRI','CUB','DOM','ECU','SLV','GTM','HTI','HND','MEX','NIC','PAN','PRY','PER','URY','VEN','PRI']);

function mg_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function mg_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function mg_measure(t, s, w) { if (!mg_measure._c) mg_measure._c = document.createElement('canvas').getContext('2d'); mg_measure._c.font = `${w || 400} ${s}px "Source Sans 3", system-ui, sans-serif`; return mg_measure._c.measureText(t).width; }
function mg_name(r) { return mg_lang() === 'en' ? r.en : r.es; }
function mg_state() { if (!state[7]) state[7] = { metric: 'abs' }; return state[7]; }
function mg_val(r, metric) { return metric === 'rel' ? (r.net / r.born * 100) : r.net; }
function mg_fmtVal(v, metric) {
  const en = mg_lang() === 'en';
  if (metric === 'rel') return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)) + '%';
  const s = Math.abs(Math.round(v)).toLocaleString(en ? 'en-US' : 'es-AR');
  return (v > 0 ? '+' : v < 0 ? '−' : '') + s;
}

let MG_W = 1100, MG_H = 640;
function mg_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && mg_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { MG_W = PNG_FORMATS[fmt].vbW; MG_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { MG_W = 1100; MG_H = 1500; } else { MG_W = 1100; MG_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawMigra() {
  const svg = document.getElementById('chart7'); if (!svg || typeof MIGRACION === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip7'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = mg_dims(); const { bigFmt, isPng } = dims; const en = mg_lang() === 'en';
  svg.setAttribute('viewBox', `0 0 ${MG_W} ${MG_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const metric = mg_state().metric;
  const N = bigFmt ? 15 : 13;   // top N imanes + top N desagües
  const all = MIGRACION.rows.map(r => ({ r, v: mg_val(r, metric) }));
  all.sort((a, b) => b.v - a.v);
  const pos = all.filter(x => x.v > 0).slice(0, N);
  const neg = all.filter(x => x.v < 0).slice(-N);
  const rows = pos.concat(neg);   // ya ordenados de + a −

  const fsLbl = bigFmt ? 23 : 13, fsVal = bigFmt ? 22 : 12.5, fsAxis = bigFmt ? 22 : 12.5, fsHdr = bigFmt ? 24 : 13.5;
  let maxNameW = 0; rows.forEach(x => { const w = mg_measure(mg_name(x.r), fsLbl, MG_LAT.has(x.r.iso) ? 700 : 500) + (MG_LAT.has(x.r.iso) ? (bigFmt ? 22 : 13) : 0); if (w > maxNameW) maxNameW = w; });
  const nameW = Math.min(maxNameW, MG_W * 0.26);
  const top = bigFmt ? 96 : 58;     // espacio para títulos de columna
  const bottom = bigFmt ? 54 : 34;
  const leftPad = bigFmt ? 28 : 16, rightPad = bigFmt ? 28 : 16;
  const gapName = bigFmt ? 18 : 10;
  const valW = bigFmt ? 78 : 50;    // espacio reservado para etiqueta de valor a cada lado
  const plotH = MG_H - top - bottom;
  const rowH = plotH / rows.length;
  const barH = Math.min(rowH * 0.66, bigFmt ? 30 : 17);

  const maxPos = Math.max(1, ...rows.filter(x => x.v > 0).map(x => x.v));
  const maxNeg = Math.max(1, ...rows.filter(x => x.v < 0).map(x => -x.v));
  const sc = (metric === 'rel') ? (v => Math.abs(v)) : (v => Math.sqrt(Math.abs(v)));   // sqrt comprime a EE.UU. en absoluto
  const barsSpan = MG_W - leftPad - rightPad - nameW - gapName - 2 * valW;
  const UNIT = barsSpan / (sc(maxNeg) + sc(maxPos));
  const W = (v) => sc(v) * UNIT;
  const xZero = leftPad + nameW + gapName + valW + W(maxNeg);

  // títulos de columna
  const hdrPos = mg_el('text'); hdrPos.setAttribute('x', xZero + (bigFmt ? 14 : 8)); hdrPos.setAttribute('y', top - (bigFmt ? 30 : 20)); hdrPos.setAttribute('text-anchor', 'start');
  hdrPos.style.fontSize = fsHdr + 'px'; hdrPos.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; hdrPos.style.fontWeight = '700'; hdrPos.style.fill = MG_POS;
  hdrPos.textContent = en ? '▸ Magnets (gain fame)' : '▸ Imanes (ganan fama)'; svg.appendChild(hdrPos);
  const hdrNeg = mg_el('text'); hdrNeg.setAttribute('x', xZero - (bigFmt ? 14 : 8)); hdrNeg.setAttribute('y', top - (bigFmt ? 30 : 20)); hdrNeg.setAttribute('text-anchor', 'end');
  hdrNeg.style.fontSize = fsHdr + 'px'; hdrNeg.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; hdrNeg.style.fontWeight = '700'; hdrNeg.style.fill = MG_NEG;
  hdrNeg.textContent = en ? 'Exporters (lose fame) ◂' : 'Desagües (exportan fama) ◂'; svg.appendChild(hdrNeg);

  // línea cero
  const zl = mg_el('line'); zl.setAttribute('x1', xZero); zl.setAttribute('x2', xZero); zl.setAttribute('y1', top - (bigFmt ? 10 : 6)); zl.setAttribute('y2', top + plotH); zl.style.stroke = '#1A1A1A'; zl.setAttribute('stroke-width', bigFmt ? 1.6 : 1.1); svg.appendChild(zl);

  const g = mg_el('g'); svg.appendChild(g);
  rows.forEach((x, i) => {
    const r = x.r, v = x.v, isLat = MG_LAT.has(r.iso), col = v >= 0 ? MG_POS : MG_NEG;
    const cy = top + i * rowH + rowH / 2;
    const bw = Math.max(2, W(v));
    const bx = v >= 0 ? xZero : xZero - bw;
    // nombre (en el gutter izquierdo)
    const lb = mg_el('text'); lb.setAttribute('x', leftPad + nameW); lb.setAttribute('y', cy + fsLbl * 0.34); lb.setAttribute('text-anchor', 'end');
    lb.style.fontSize = fsLbl + 'px'; lb.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; lb.style.fontWeight = isLat ? '700' : '500'; lb.style.fill = isLat ? '#1A1A1A' : '#4A4A4A';
    lb.setAttribute('data-mg', r.iso); lb.textContent = mg_name(r); g.appendChild(lb);
    if (isLat) { const dot = mg_el('circle'); dot.setAttribute('cx', leftPad + nameW - mg_measure(mg_name(r), fsLbl, 700) - (bigFmt ? 12 : 7)); dot.setAttribute('cy', cy); dot.setAttribute('r', bigFmt ? 5 : 3); dot.setAttribute('fill', MG_GOLD); g.appendChild(dot); }
    // barra
    const bar = mg_el('rect'); bar.setAttribute('x', bx); bar.setAttribute('y', cy - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', col); bar.setAttribute('data-mg', r.iso); bar.style.cursor = 'pointer'; g.appendChild(bar);
    // valor
    const vt = mg_el('text'); vt.setAttribute('x', v >= 0 ? (bx + bw + (bigFmt ? 9 : 5)) : (bx - (bigFmt ? 9 : 5))); vt.setAttribute('y', cy + fsVal * 0.34); vt.setAttribute('text-anchor', v >= 0 ? 'start' : 'end');
    vt.style.fontSize = fsVal + 'px'; vt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; vt.style.fontWeight = '700'; vt.style.fill = col; vt.style.fontVariantNumeric = 'tabular-nums'; vt.setAttribute('data-mg', r.iso); vt.textContent = mg_fmtVal(v, metric); g.appendChild(vt);
  });

  // título eje
  const axt = mg_el('text'); axt.setAttribute('x', xZero); axt.setAttribute('y', top + plotH + (bigFmt ? 40 : 24)); axt.setAttribute('text-anchor', 'middle');
  axt.style.fontSize = fsAxis + 'px'; axt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; axt.style.fill = '#8A8579';
  axt.textContent = metric === 'rel'
    ? (en ? 'Net balance as % of figures born in the country' : 'Saldo neto como % de las figuras nacidas en el país')
    : (en ? 'Net balance (figures who died there − who were born there)' : 'Saldo neto (figuras que murieron ahí − que nacieron ahí)');
  svg.appendChild(axt);

  if (!isPng /* tooltips tambien en touch (criterio 6e) */) mg_wireHover(svg, rows, metric);
}

function mg_emph(svg, iso) { svg.querySelectorAll('[data-mg]').forEach(el => { el.style.opacity = (iso == null || el.getAttribute('data-mg') === iso) ? '' : '0.2'; }); }
function mg_wireHover(svg, rows, metric) {
  const tip = document.getElementById('tooltip7'); if (!tip) return; const en = mg_lang() === 'en';
  const by = {}; rows.forEach(x => by[x.r.iso] = x.r);
  svg.querySelectorAll('rect[data-mg]').forEach(bar => {
    const iso = bar.getAttribute('data-mg'), r = by[iso];
    bar.addEventListener('mouseenter', (ev) => {
      mg_emph(svg, iso);
      const nf = (n) => n.toLocaleString(en ? 'en-US' : 'es-AR');
      const regLbl = (typeof t === 'function') ? t('reg.' + r.region) : r.region;
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:3px;">${mg_name(r)}</div>`
        + `<div style="color:#8A8579;font-size:11px;margin-bottom:5px;">${regLbl}</div>`
        + `<div style="line-height:1.55;">`
        + `${en ? 'Born there' : 'Nacidas ahí'}: <strong>${nf(r.born)}</strong><br>`
        + `${en ? 'Died there' : 'Murieron ahí'}: <strong>${nf(r.died)}</strong><br>`
        + `${en ? 'Emigrated' : 'Emigraron'}: <strong>${r.emig_rate}%</strong>`
        + (r.topDest ? ` <span style="color:#8A8579;">(→ ${r.topDest})</span>` : '')
        + `<br><span style="color:${r.net >= 0 ? MG_POS : MG_NEG};font-weight:700;">${en ? 'Net' : 'Saldo'}: ${mg_fmtVal(r.net, 'abs')}</span>`
        + `</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; mg_placeTip(tip, ev, svg);
    });
    bar.addEventListener('mousemove', (ev) => mg_placeTip(tip, ev, svg));
    bar.addEventListener('mouseleave', () => { mg_emph(svg, null); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function mg_placeTip(tip, ev, svg) { const rc = svg.getBoundingClientRect(); const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200; const lft = (x + 16 + tw > rc.width || x > rc.width * 0.6) ? Math.max(2, x - tw - 16) : (x + 14); tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px'; }

window.__atlasSupportsFormats = true; window.__atlasDefaultPngFormat = 'square'; window.__atlasRedraw = drawMigra;
function initMigra() { mg_state(); drawMigra(); mg_wireToggle(); }
function mg_wireToggle() {
  const t = document.getElementById('mg-metric'); if (t && !t._b) { t._b = true; t.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { mg_state().metric = b.dataset.metric; t.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); drawMigra(); })); }
  const sc = mg_state().metric, tt = document.getElementById('mg-metric'); if (tt) tt.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.metric === sc));
}
let _mgMob = mg_isMobile();
window.addEventListener('resize', () => { if (!document.getElementById('chart7')) return; const n = mg_isMobile(); if (n === _mgMob) return; _mgMob = n; drawMigra(); });


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="7-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.MIGRACION;
    const cols = ['iso3', 'country_es', 'country_en', 'region', 'born', 'died', 'net_died_minus_born', 'emigrants', 'emig_rate_pct', 'top_destination'];
    const rows = D.rows.map(r => [r.iso, r.es, r.en, r.region, r.born, r.died, r.net, r.emig, r.emig_rate, r.topDest]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-fame-migration.csv' : 'el-atlas-05-migracion-de-la-fama.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
