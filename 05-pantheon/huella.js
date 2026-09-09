// =============================================================
//  huella.js — Chart 2 del N°5 "Talento"
//  La huella de cada país: heatmap país × disciplina, color = lift
//  (cuántas veces sobre-representa esa disciplina vs el mundo).
//  Cada fila se "enciende" en su especialidad. Se anotan con ×N solo
//  las celdas fuertes (la historia: RD béisbol ×99, Cuba boxeo ×21…).
//  Depende de: window.HUELLA (data-huella.js), LANG, utils.js.
// =============================================================

const HU_NS = 'http://www.w3.org/2000/svg';
const hu_el = (t) => document.createElementNS(HU_NS, t);

// columnas a mostrar (curado para legibilidad mobile), en orden
const HU_COL_ORDER = ['soccer', 'baseball', 'boxing', 'volley', 'cycling', 'tennis', 'racing', 'athletics', 'acting', 'music', 'celebrity', 'politics'];
const HU_MIN_N = 90;          // países con huella robusta
const HU_ANNOT_LIFT = 4;      // anotar ×N solo celdas con lift ≥ esto

// rampa terracota (claro → oscuro) sobre escala log del lift
const HU_RAMP = ['#FaF3EC', '#F0D6C2', '#E3AE8A', '#D07F4F', '#BE5D32', '#933F20', '#5E2814'];
function hu_lerp(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return 'rgb(' + c.join(',') + ')';
}
function hu_color(lift) {
  if (lift == null || lift <= 0) return '#F4F1E8';
  // log(lift) de 0.4 a 25 → [0,1]
  const t = Math.max(0, Math.min(1, (Math.log(lift) - Math.log(0.4)) / (Math.log(25) - Math.log(0.4))));
  const seg = t * (HU_RAMP.length - 1);
  const i = Math.min(HU_RAMP.length - 2, Math.floor(seg));
  return hu_lerp(HU_RAMP[i], HU_RAMP[i + 1], seg - i);
}
function hu_isDark(lift) { return lift != null && lift >= 3.2; }   // texto blanco sobre celda oscura

function hu_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function hu_colLabel(c) { return hu_lang() === 'en' ? c.en : c.es; }
function hu_rowLabel(r) { return hu_lang() === 'en' ? r.en : r.es; }
function hu_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function hu_measure(text, size, weight) {
  if (!hu_measure._c) hu_measure._c = document.createElement('canvas').getContext('2d');
  hu_measure._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return hu_measure._c.measureText(text).width;
}
function hu_liftFmt(v) {
  const en = hu_lang() === 'en';
  const s = v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, '').replace('.', en ? '.' : ',');
  return '×' + s;
}

let HU_W = 1100, HU_H = 700;
function hu_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && hu_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { HU_W = PNG_FORMATS[fmt].vbW; HU_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { HU_W = 1100; HU_H = 1480; }
  else { HU_W = 1100; HU_H = 720; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function hu_rows() {
  const cols = HU_COL_ORDER;
  return HUELLA.rows
    .filter(r => r.n >= HU_MIN_N)
    .map(r => {
      let mx = 0; cols.forEach(k => { const c = r.cells[k]; if (c && c.lift > mx) mx = c.lift; });
      return { ...r, _max: mx };
    })
    .sort((a, b) => b._max - a._max);
}

function drawHuella() {
  const svg = document.getElementById('chart2'); if (!svg || typeof HUELLA === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip2'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = hu_dims(); const { bigFmt, isPng } = dims;
  svg.setAttribute('viewBox', `0 0 ${HU_W} ${HU_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const cols = HU_COL_ORDER.map(k => HUELLA.cols.find(c => c.key === k)).filter(Boolean);
  const rows = hu_rows();

  const fsRow = bigFmt ? 24 : 13;
  const fsCol = bigFmt ? 20 : 11.5;
  const fsCell = bigFmt ? 20 : 11;
  const fsNote = bigFmt ? 22 : 12;

  let maxRowW = 0; rows.forEach(r => { const w = hu_measure(hu_rowLabel(r), fsRow, 600); if (w > maxRowW) maxRowW = w; });
  const left = Math.min(maxRowW + (bigFmt ? 22 : 12), HU_W * 0.30);
  const right = bigFmt ? 24 : 12;
  // espacio arriba para headers de columna rotados -45°
  let maxColW = 0; cols.forEach(c => { const w = hu_measure(hu_colLabel(c), fsCol, 600); if (w > maxColW) maxColW = w; });
  const top = Math.round(maxColW * 0.72) + (bigFmt ? 26 : 16);
  const legendH = bigFmt ? 92 : 58;
  const bottom = legendH;
  const plotW = HU_W - left - right;
  const plotH = HU_H - top - bottom;
  const cw = plotW / cols.length;
  const rh = plotH / rows.length;
  const cellPad = bigFmt ? 3 : 1.5;

  // headers de columna (rotados -45° desde el tope de cada columna)
  cols.forEach((c, j) => {
    const x = left + j * cw + cw / 2;
    const tx = hu_el('text'); tx.setAttribute('x', x); tx.setAttribute('y', top - (bigFmt ? 12 : 7));
    tx.setAttribute('text-anchor', 'start'); tx.setAttribute('transform', `rotate(-45 ${x} ${top - (bigFmt ? 12 : 7)})`);
    tx.style.fontSize = fsCol + 'px'; tx.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tx.style.fontWeight = '600'; tx.style.fill = '#4A4A4A';
    tx.textContent = hu_colLabel(c); svg.appendChild(tx);
  });

  // filas
  rows.forEach((r, i) => {
    const y = top + i * rh;
    const rl = hu_el('text'); rl.setAttribute('x', left - (bigFmt ? 12 : 7)); rl.setAttribute('y', y + rh / 2 + fsRow * 0.34); rl.setAttribute('text-anchor', 'end');
    rl.style.fontSize = fsRow + 'px'; rl.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; rl.style.fontWeight = '600'; rl.style.fill = '#1A1A1A';
    rl.setAttribute('data-hu-row', r.iso); rl.textContent = hu_rowLabel(r); svg.appendChild(rl);

    cols.forEach((c, j) => {
      const x = left + j * cw, cell = r.cells[c.key] || { lift: 0, n: 0 };
      const rect = hu_el('rect'); rect.setAttribute('x', x + cellPad); rect.setAttribute('y', y + cellPad);
      rect.setAttribute('width', Math.max(1, cw - cellPad * 2)); rect.setAttribute('height', Math.max(1, rh - cellPad * 2));
      rect.setAttribute('rx', bigFmt ? 3 : 2); rect.setAttribute('fill', hu_color(cell.lift));
      rect.setAttribute('data-hu', r.iso + '|' + c.key); rect.style.cursor = 'pointer'; svg.appendChild(rect);
      // anotar ×N solo en celdas fuertes
      if (cell.lift >= HU_ANNOT_LIFT) {
        const tx = hu_el('text'); tx.setAttribute('x', x + cw / 2); tx.setAttribute('y', y + rh / 2 + fsCell * 0.34); tx.setAttribute('text-anchor', 'middle');
        tx.style.fontSize = fsCell + 'px'; tx.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tx.style.fontWeight = '700';
        tx.style.fill = hu_isDark(cell.lift) ? '#FAF8F3' : '#1A1A1A'; tx.style.pointerEvents = 'none';
        tx.textContent = hu_liftFmt(cell.lift); svg.appendChild(tx);
      }
    });
  });

  // leyenda: gradiente de lift
  const en = hu_lang() === 'en';
  const lgY = HU_H - legendH + (bigFmt ? 30 : 18);
  const lgW = Math.min(plotW * 0.62, bigFmt ? 540 : 300), lgX = left + (plotW - lgW) / 2, lgH = bigFmt ? 16 : 10;
  const defs = hu_el('defs'); const grad = hu_el('linearGradient'); grad.id = 'hu-grad';
  [0, 0.25, 0.5, 0.75, 1].forEach(s => { const st = hu_el('stop'); st.setAttribute('offset', (s * 100) + '%'); const lift = Math.exp(Math.log(0.4) + s * (Math.log(25) - Math.log(0.4))); st.setAttribute('stop-color', hu_color(lift)); grad.appendChild(st); });
  defs.appendChild(grad); svg.appendChild(defs);
  const lr = hu_el('rect'); lr.setAttribute('x', lgX); lr.setAttribute('y', lgY); lr.setAttribute('width', lgW); lr.setAttribute('height', lgH); lr.setAttribute('rx', 2); lr.setAttribute('fill', 'url(#hu-grad)'); svg.appendChild(lr);
  const mkLab = (x, anchor, txt) => { const t = hu_el('text'); t.setAttribute('x', x); t.setAttribute('y', lgY + lgH + (bigFmt ? 26 : 16)); t.setAttribute('text-anchor', anchor); t.style.fontSize = fsNote + 'px'; t.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; t.style.fill = '#8A8579'; t.textContent = txt; svg.appendChild(t); };
  mkLab(lgX, 'start', en ? 'below world avg' : 'menos que el promedio');
  mkLab(lgX + lgW, 'end', en ? 'far above (×10+)' : 'mucho más (×10+)');
  const lgt = hu_el('text'); lgt.setAttribute('x', lgX + lgW / 2); lgt.setAttribute('y', lgY - (bigFmt ? 10 : 6)); lgt.setAttribute('text-anchor', 'middle');
  lgt.style.fontSize = fsNote + 'px'; lgt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; lgt.style.fontWeight = '600'; lgt.style.fill = '#4A4A4A';
  lgt.textContent = en ? 'Over-representation vs the world (×)' : 'Sobre-representación vs el mundo (×)'; svg.appendChild(lgt);

  const interactive = !isPng /* tooltips tambien en touch (criterio 6e) */;
  if (interactive) hu_wireHover(svg, rows, cols);
}

function hu_wireHover(svg, rows, cols) {
  const tip = document.getElementById('tooltip2'); if (!tip) return;
  const en = hu_lang() === 'en';
  const rowByIso = {}; rows.forEach(r => rowByIso[r.iso] = r);
  const colByKey = {}; cols.forEach(c => colByKey[c.key] = c);
  svg.querySelectorAll('rect[data-hu]').forEach(rect => {
    const [iso, ck] = rect.getAttribute('data-hu').split('|');
    rect.addEventListener('mouseenter', (ev) => {
      svg.querySelectorAll('rect[data-hu]').forEach(o => { o.style.opacity = o === rect ? '' : '0.3'; });
      const r = rowByIso[iso], c = colByKey[ck], cell = r.cells[ck] || { lift: 0, n: 0, pct: 0 };
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${hu_rowLabel(r)} · ${hu_colLabel(c)}</div>`
        + `<strong>${cell.lift ? hu_liftFmt(cell.lift) : '—'}</strong> ${en ? 'vs world avg' : 'vs el promedio mundial'}`
        + `<div style="color:#8A8579;margin-top:3px;">${cell.n} ${en ? 'figures' : 'figuras'} (${(cell.pct||0).toString().replace('.', en?'.':',')}% ${en ? 'of the country' : 'del país'})</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; hu_placeTip(tip, ev, svg);
    });
    rect.addEventListener('mousemove', (ev) => hu_placeTip(tip, ev, svg));
    rect.addEventListener('mouseleave', () => { svg.querySelectorAll('rect[data-hu]').forEach(o => o.style.opacity = ''); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function hu_placeTip(tip, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 220;
  const lft = (x + 16 + tw > rc.width || x > rc.width * 0.62) ? Math.max(2, x - tw - 16) : (x + 14);
  tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px';
}

window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedraw = drawHuella;
function initHuella() { drawHuella(); }

let _huMob = hu_isMobile();
window.addEventListener('resize', () => {
  if (!document.getElementById('chart2')) return;
  const now = hu_isMobile(); if (now === _huMob) return; _huMob = now; drawHuella();
});


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="2-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.HUELLA;
    const cols = ['iso3', 'country_es', 'country_en', 'n_country', 'discipline_key', 'discipline_es', 'discipline_en', 'lift', 'n', 'pct_of_country'];
    const rows = [];
    D.rows.forEach(r => D.cols.forEach(c => {
      const x = r.cells[c.key] || {};
      rows.push([r.iso, r.es, r.en, r.n, c.key, c.es, c.en, x.lift, x.n, x.pct]);
    }));
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-country-specialties.csv' : 'el-atlas-05-especialidad-por-pais.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
