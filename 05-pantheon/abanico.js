// =============================================================
//  abanico.js — Chart 1 del N°5 "Talento"
//  Abanico de especialización: % del talento MUNDIAL de cada
//  disciplina que es latinoamericano. Barras horizontales,
//  coloreadas por dominio, ordenadas de mayor a menor share.
//  Línea de referencia = peso de LatAm en la población mundial.
//  Lectura: arriba de la línea = sobre-representado (deporte);
//  abajo = sub-representado (ciencia).
//  Depende de: window.ABANICO (data-abanico.js), LANG, utils.js.
//  NOTA: los colores con var() se setean vía .style (NO setAttribute,
//  que no resuelve custom properties en atributos de presentación).
// =============================================================

const AB_NS = 'http://www.w3.org/2000/svg';
const ab_el = (t) => document.createElementNS(AB_NS, t);

// Colores por dominio (paleta multiserie del Atlas, hues distintos).
// Deporte en terracota (color insignia) para que el bloque de arriba "sea"
// el Atlas; ciencia en azul, el contraste de la tesis.
const AB_COLORS = {
  'Deportes':                 '#BE5D32',  // terracota
  'Artes y espectáculo':      '#C9A227',  // dorado
  'Humanidades':              '#2D6A3D',  // verde
  'Ciencia y tecnología':     '#234B85',  // azul
  'Poder y figuras públicas': '#6B3D8B',  // violeta
  'Negocios y exploración':   '#8A5A35',
};
const AB_GROUP_LABEL = {
  'Deportes':                 { es: 'Deporte',           en: 'Sports' },
  'Artes y espectáculo':      { es: 'Arte y espectáculo', en: 'Arts' },
  'Humanidades':              { es: 'Humanidades',       en: 'Humanities' },
  'Ciencia y tecnología':     { es: 'Ciencia',           en: 'Science' },
  'Poder y figuras públicas': { es: 'Poder',             en: 'Power' },
  'Negocios y exploración':   { es: 'Negocios',          en: 'Business' },
};
const AB_GROUP_ORDER = ['Deportes', 'Artes y espectáculo', 'Humanidades', 'Poder y figuras públicas', 'Ciencia y tecnología'];

function ab_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function ab_label(d) { return ab_lang() === 'en' ? d.en : d.es; }
function ab_pct(v) { return v.toFixed(1).replace('.', ab_lang() === 'en' ? '.' : ',') + '%'; }
function ab_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function ab_measure(text, size, weight) {
  if (!ab_measure._c) ab_measure._c = document.createElement('canvas').getContext('2d');
  ab_measure._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return ab_measure._c.measureText(text).width;
}

// Dimensiones por formato. vbW siempre 1100 (compat. con utils/png-export).
let AB_W = 1100, AB_H = 640;
function ab_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && ab_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) {
    AB_W = PNG_FORMATS[fmt].vbW; AB_H = PNG_FORMATS[fmt].vbH;
  } else if (mobile) { AB_W = 1100; AB_H = 1500; }
  else { AB_W = 1100; AB_H = 640; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawAbanico() {
  const svg = document.getElementById('chart1'); if (!svg || typeof ABANICO === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip1'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = ab_dims(); const { bigFmt, isPng } = dims;
  svg.setAttribute('viewBox', `0 0 ${AB_W} ${AB_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);

  const rows = ABANICO.disciplines.slice().sort((a, b) => b.share - a.share);
  const refPop = ABANICO.pop_share;

  // sobredimensionado para el PNG (se lee a ⅓ en el celu)
  const fsLbl  = bigFmt ? 25 : 14;
  const fsVal  = bigFmt ? 25 : 14;
  const fsTick = bigFmt ? 21 : 12;
  const fsAxis = bigFmt ? 23 : 12.5;
  const fsLeg  = bigFmt ? 23 : 13;

  let maxLblW = 0; rows.forEach(r => { const w = ab_measure(ab_label(r), fsLbl, 600); if (w > maxLblW) maxLblW = w; });
  const left = Math.min(maxLblW + (bigFmt ? 26 : 14), AB_W * 0.42);
  const right = (bigFmt ? 86 : 52);
  const top = bigFmt ? 64 : 38;
  const legendH = bigFmt ? 64 : 40;
  const axisH = bigFmt ? 70 : 44;
  const bottom = axisH + legendH;
  const plotW = AB_W - left - right;
  const plotH = AB_H - top - bottom;
  const rowH = plotH / rows.length;
  const barH = Math.min(rowH * 0.64, bigFmt ? 46 : 26);

  const maxShare = rows[0].share;
  const xMax = (typeof niceLinearTicks === 'function')
    ? (niceLinearTicks(0, maxShare * 1.06, 5).slice(-1)[0] || Math.ceil(maxShare))
    : Math.ceil(maxShare / 5) * 5;
  const xS = (v) => left + (v / xMax) * plotW;
  let xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, xMax, 5) : [0, 5, 10, 15, 20];
  if (xticks[0] !== 0) xticks.unshift(0);

  // grid + ticks X
  xticks.forEach(v => {
    const x = xS(v);
    const gl = ab_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', top); gl.setAttribute('y2', top + plotH);
    gl.style.stroke = '#ECE7D8'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = ab_el('text'); tk.setAttribute('x', x); tk.setAttribute('y', top + plotH + (bigFmt ? 30 : 18)); tk.setAttribute('text-anchor', 'middle');
    tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tk.style.fill = '#8A8579';
    tk.textContent = v + '%'; svg.appendChild(tk);
  });

  // barras + etiquetas
  const barsG = ab_el('g'); svg.appendChild(barsG);
  rows.forEach((r, i) => {
    const cy = top + i * rowH + rowH / 2;
    const col = AB_COLORS[r.group] || '#888';
    const lb = ab_el('text'); lb.setAttribute('x', left - (bigFmt ? 14 : 8)); lb.setAttribute('y', cy + fsLbl * 0.34); lb.setAttribute('text-anchor', 'end');
    lb.style.fontSize = fsLbl + 'px'; lb.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; lb.style.fontWeight = '600'; lb.style.fill = '#1A1A1A';
    lb.setAttribute('data-ab', r.key); lb.textContent = ab_label(r); barsG.appendChild(lb);
    const bw = Math.max(2, xS(r.share) - left);
    const bar = ab_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', cy - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH);
    bar.setAttribute('rx', bigFmt ? 4 : 2); bar.setAttribute('fill', col); bar.setAttribute('data-ab', r.key); bar.style.cursor = 'pointer'; barsG.appendChild(bar);
    const vt = ab_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 12 : 7)); vt.setAttribute('y', cy + fsVal * 0.34);
    vt.style.fontSize = fsVal + 'px'; vt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; vt.style.fontWeight = '700'; vt.style.fill = '#1A1A1A';
    vt.style.fontVariantNumeric = 'tabular-nums'; vt.setAttribute('data-ab', r.key); vt.textContent = ab_pct(r.share); barsG.appendChild(vt);
  });

  // línea de referencia (peso poblacional de LatAm)
  const en = ab_lang() === 'en';
  const xRef = xS(refPop);
  const rl = ab_el('line'); rl.setAttribute('x1', xRef); rl.setAttribute('x2', xRef); rl.setAttribute('y1', top - (bigFmt ? 6 : 4)); rl.setAttribute('y2', top + plotH);
  rl.style.stroke = '#1A1A1A'; rl.setAttribute('stroke-width', bigFmt ? 2 : 1.3); rl.setAttribute('stroke-dasharray', bigFmt ? '7 5' : '4 3'); svg.appendChild(rl);
  const rlt = ab_el('text'); rlt.setAttribute('y', top - (bigFmt ? 16 : 10));
  rlt.style.fontSize = fsAxis + 'px'; rlt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; rlt.style.fontWeight = '600'; rlt.style.fill = '#1A1A1A';
  rlt.textContent = (en ? 'LatAm = ' + ab_pct(refPop) + ' of world population' : 'LatAm = ' + ab_pct(refPop) + ' de la población mundial');
  if (xRef + (bigFmt ? 8 : 5) + ab_measure(rlt.textContent, fsAxis, 600) > AB_W - 8) {
    rlt.setAttribute('x', xRef - (bigFmt ? 8 : 5)); rlt.setAttribute('text-anchor', 'end');
  } else { rlt.setAttribute('x', xRef + (bigFmt ? 8 : 5)); rlt.setAttribute('text-anchor', 'start'); }
  svg.appendChild(rlt);

  // título eje X
  const axt = ab_el('text'); axt.setAttribute('x', left + plotW / 2); axt.setAttribute('y', top + plotH + (bigFmt ? 62 : 38)); axt.setAttribute('text-anchor', 'middle');
  axt.style.fontSize = fsAxis + 'px'; axt.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; axt.style.fill = '#8A8579';
  axt.textContent = en ? '% of the world’s notable people in each field who are Latin American'
                       : '% de las figuras célebres del mundo en cada disciplina que son latinoamericanas';
  svg.appendChild(axt);

  // leyenda de dominios (in-SVG)
  const legGroups = AB_GROUP_ORDER.filter(g => rows.some(r => r.group === g));
  const legY = AB_H - legendH / 2 - (bigFmt ? 6 : 4);
  const swR = bigFmt ? 13 : 8, gapTxt = bigFmt ? 10 : 6, gapItem = bigFmt ? 34 : 18;
  const items = legGroups.map(g => ({ g, label: AB_GROUP_LABEL[g][ab_lang()], w: 0 }));
  items.forEach(it => { it.w = swR * 2 + gapTxt + ab_measure(it.label, fsLeg, 500); });
  const totalW = items.reduce((s, it, i) => s + it.w + (i ? gapItem : 0), 0);
  let cx = left + plotW / 2 - totalW / 2; if (cx < 8) cx = 8;
  items.forEach(it => {
    const sw = ab_el('rect'); sw.setAttribute('x', cx); sw.setAttribute('y', legY - swR); sw.setAttribute('width', swR * 2); sw.setAttribute('height', swR * 2);
    sw.setAttribute('rx', 3); sw.setAttribute('fill', AB_COLORS[it.g]); svg.appendChild(sw);
    const tx = ab_el('text'); tx.setAttribute('x', cx + swR * 2 + gapTxt); tx.setAttribute('y', legY + fsLeg * 0.34);
    tx.style.fontSize = fsLeg + 'px'; tx.style.fontFamily = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; tx.style.fontWeight = '500'; tx.style.fill = '#4A4A4A';
    tx.textContent = it.label; svg.appendChild(tx);
    cx += it.w + gapItem;
  });

  // hover
  const interactive = !isPng /* tooltips tambien en touch (criterio 6e) */;
  if (interactive) ab_wireHover(svg, rows);
}

function ab_emph(svg, key) {
  svg.querySelectorAll('[data-ab]').forEach(el => {
    el.style.opacity = (key == null || el.getAttribute('data-ab') === key) ? '' : '0.22';
  });
}
function ab_wireHover(svg, rows) {
  const tip = document.getElementById('tooltip1'); if (!tip) return;
  const en = ab_lang() === 'en';
  const byKey = {}; rows.forEach(r => byKey[r.key] = r);
  svg.querySelectorAll('rect[data-ab]').forEach(bar => {
    const key = bar.getAttribute('data-ab'), r = byKey[key];
    bar.addEventListener('mouseenter', (ev) => {
      ab_emph(svg, key);
      const nLat = r.n_latam.toLocaleString(en ? 'en-US' : 'es-AR');
      const nW = r.n_world.toLocaleString(en ? 'en-US' : 'es-AR');
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${ab_label(r)}</div>`
        + `<strong style="font-variant-numeric:tabular-nums;">${ab_pct(r.share)}</strong> ${en ? 'is Latin American' : 'es latinoamericano'}`
        + `<div style="color:#8A8579;margin-top:3px;">${nLat} ${en ? 'of' : 'de'} ${nW} ${en ? 'worldwide' : 'en el mundo'}</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; ab_placeTip(tip, ev, svg);
    });
    bar.addEventListener('mousemove', (ev) => ab_placeTip(tip, ev, svg));
    bar.addEventListener('mouseleave', () => { ab_emph(svg, null); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function ab_placeTip(tip, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200;
  const lft = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px';
}

// Globals para png-export.js (formato cuadrado al exportar).
window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedraw = drawAbanico;
function initAbanico() { drawAbanico(); }

let _abMob = ab_isMobile();
window.addEventListener('resize', () => {
  if (!document.getElementById('chart1')) return;
  const now = ab_isMobile(); if (now === _abMob) return; _abMob = now; drawAbanico();
});


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="1-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.ABANICO;
    const cols = ['discipline_key', 'discipline_es', 'discipline_en', 'group', 'latam_share_pct', 'latam_share_hpi_pct', 'n_world', 'n_latam', 'latam_pop_share_pct', 'latam_gdp_share_pct'];
    const rows = D.disciplines.map(d => [d.key, d.es, d.en, d.group, d.share, d.share_hpi, d.n_world, d.n_latam, D.pop_share, D.gdp_share]);
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-latam-specialization.csv' : 'el-atlas-05-especializacion-latam.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
