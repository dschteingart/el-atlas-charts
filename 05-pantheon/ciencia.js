// =============================================================
//  ciencia.js — Chart 3 del N°5 "Talento"
//  El talento que no tenemos. Scatter log-log: PIB per cápita (x)
//  vs figuras científicas célebres por millón (y). Línea = lo
//  esperado para cada nivel de PIB. LatAm (terracota) cae debajo:
//  produce menos ciencia de la que su desarrollo predeciría.
//  Depende de: window.CIENCIA (data-ciencia.js), LANG, utils.js.
// =============================================================

const CI_NS = 'http://www.w3.org/2000/svg';
const ci_el = (t) => document.createElementNS(CI_NS, t);
const CI_LATAM = '#BE5D32';   // terracota
const CI_REST  = '#C9C2B2';   // gris cálido (rule-strong)
// referencias globales a etiquetar (potencias científicas + contraste)
const CI_REFS = { USA: 'EE.UU.', ISR: 'Israel', CHE: 'Suiza', GBR: 'R. Unido', JPN: 'Japón', KOR: 'Corea del Sur' };
const CI_REFS_EN = { USA: 'USA', ISR: 'Israel', CHE: 'Switzerland', GBR: 'UK', JPN: 'Japan', KOR: 'South Korea' };
// países LatAm a etiquetar (los notables; el resto va sin etiqueta para no saturar)
const CI_LATAM_LABEL = new Set(['ARG', 'BRA', 'MEX', 'CHL', 'CUB', 'URY', 'COL', 'VEN', 'PER']);

function ci_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function ci_name(p) {
  if (p.latam) return p.es;
  const m = ci_lang() === 'en' ? CI_REFS_EN : CI_REFS; return m[p.iso] || p.iso;
}
function ci_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function ci_measure(text, size, weight) {
  if (!ci_measure._c) ci_measure._c = document.createElement('canvas').getContext('2d');
  ci_measure._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return ci_measure._c.measureText(text).width;
}

let CI_W = 1100, CI_H = 680;
function ci_dims() {
  const fmt = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !fmt && ci_isMobile();
  if (fmt && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[fmt]) { CI_W = PNG_FORMATS[fmt].vbW; CI_H = PNG_FORMATS[fmt].vbH; }
  else if (mobile) { CI_W = 1100; CI_H = 1320; }
  else { CI_W = 1100; CI_H = 680; }
  return { fmt, mobile, bigFmt: !!fmt || mobile, isPng: !!fmt };
}

function drawCiencia() {
  const svg = document.getElementById('chart3'); if (!svg || typeof CIENCIA === 'undefined') return;
  svg.innerHTML = '';
  const tip = document.getElementById('tooltip3'); if (tip) { tip.style.opacity = '0'; tip.style.display = 'none'; }
  const dims = ci_dims(); const { bigFmt, isPng } = dims;
  svg.setAttribute('viewBox', `0 0 ${CI_W} ${CI_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, dims.fmt);
  const en = ci_lang() === 'en';

  const pts = CIENCIA.points.filter(p => p.pm > 0 && p.gdp > 0);
  const fsTick = bigFmt ? 21 : 12, fsAxis = bigFmt ? 23 : 12.5, fsLab = bigFmt ? 22 : 12;

  const M = { top: bigFmt ? 30 : 20, right: bigFmt ? 30 : 20, bottom: bigFmt ? 78 : 50, left: bigFmt ? 86 : 56 };
  const PW = CI_W - M.left - M.right, PH = CI_H - M.top - M.bottom;

  const xs = pts.map(p => p.gdp), ys = pts.map(p => p.pm);
  const xmin = Math.min(...xs) * 0.85, xmax = Math.max(...xs) * 1.15;
  const ymin = Math.max(0.02, Math.min(...ys) * 0.7), ymax = Math.max(...ys) * 1.5;
  const xS = (v) => M.left + (Math.log10(v) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin)) * PW;
  const yS = (v) => M.top + PH - (Math.log10(v) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin)) * PH;

  // grid + ticks
  const xticks = (typeof niceLog10Ticks === 'function') ? niceLog10Ticks(xmin, xmax) : [1000, 10000, 100000];
  const yticks = (typeof niceLog10Ticks === 'function') ? niceLog10Ticks(ymin, ymax) : [0.1, 1, 10];
  xticks.forEach(v => {
    const x = xS(v); if (x < M.left - 1 || x > M.left + PW + 1) return;
    const gl = ci_el('line'); gl.setAttribute('x1', x); gl.setAttribute('x2', x); gl.setAttribute('y1', M.top); gl.setAttribute('y2', M.top + PH); gl.style.stroke = 'var(--grid)'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = ci_el('text'); tk.setAttribute('x', x); tk.setAttribute('y', M.top + PH + (bigFmt ? 32 : 18)); tk.setAttribute('text-anchor', 'middle'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = 'var(--sans)'; tk.style.fill = 'var(--ink-muted)'; tk.textContent = (typeof fmtTickGDP === 'function') ? fmtTickGDP(v) : ('$' + v); svg.appendChild(tk);
  });
  yticks.forEach(v => {
    const y = yS(v); if (y < M.top - 1 || y > M.top + PH + 1) return;
    const gl = ci_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PW); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.style.stroke = 'var(--grid)'; gl.setAttribute('stroke-width', 1); svg.appendChild(gl);
    const tk = ci_el('text'); tk.setAttribute('x', M.left - (bigFmt ? 12 : 8)); tk.setAttribute('y', y + fsTick * 0.34); tk.setAttribute('text-anchor', 'end'); tk.style.fontSize = fsTick + 'px'; tk.style.fontFamily = 'var(--sans)'; tk.style.fill = 'var(--ink-muted)'; tk.textContent = v >= 1 ? v : v.toString().replace('.', en ? '.' : ','); svg.appendChild(tk);
  });
  // títulos de eje
  const xt = ci_el('text'); xt.setAttribute('x', M.left + PW / 2); xt.setAttribute('y', CI_H - (bigFmt ? 26 : 14)); xt.setAttribute('text-anchor', 'middle'); xt.style.fontSize = fsAxis + 'px'; xt.style.fontFamily = 'var(--sans)'; xt.style.fill = 'var(--ink-muted)'; xt.textContent = en ? 'GDP per capita (log)' : 'PIB per cápita (log)'; svg.appendChild(xt);
  const yt = ci_el('text'); yt.setAttribute('transform', `translate(${bigFmt ? 22 : 15}, ${M.top + PH / 2}) rotate(-90)`); yt.setAttribute('text-anchor', 'middle'); yt.style.fontSize = fsAxis + 'px'; yt.style.fontFamily = 'var(--sans)'; yt.style.fill = 'var(--ink-muted)'; yt.textContent = en ? 'Notable scientists per million (log)' : 'Científicos célebres por millón (log)'; svg.appendChild(yt);

  // línea de ajuste (log10): el modelo se ajustó en log natural; convertimos.
  // log(pm) = b0 + b1*log(gdp)  (log natural) → pm = exp(b0)*gdp^b1
  const b0 = CIENCIA.fit.b0, b1 = CIENCIA.fit.b1;
  const fitY = (gdp) => Math.exp(b0 + b1 * Math.log(gdp));
  const lx0 = xmin, lx1 = xmax;
  const fl = ci_el('line'); fl.setAttribute('x1', xS(lx0)); fl.setAttribute('y1', yS(fitY(lx0))); fl.setAttribute('x2', xS(lx1)); fl.setAttribute('y2', yS(fitY(lx1)));
  fl.style.stroke = 'var(--ink)'; fl.setAttribute('stroke-width', bigFmt ? 2 : 1.4); fl.setAttribute('stroke-dasharray', bigFmt ? '8 6' : '5 4'); fl.setAttribute('opacity', 0.6); svg.appendChild(fl);
  // etiqueta de la línea
  const flt = ci_el('text'); const lxMid = Math.exp((Math.log(lx0) + Math.log(lx1)) / 2);
  flt.setAttribute('x', xS(lxMid * 1.4)); flt.setAttribute('y', yS(fitY(lxMid * 1.4)) - (bigFmt ? 14 : 9)); flt.setAttribute('text-anchor', 'start');
  flt.style.fontSize = fsLab + 'px'; flt.style.fontFamily = 'var(--sans)'; flt.style.fontStyle = 'italic'; flt.style.fill = 'var(--ink-muted)';
  flt.textContent = en ? 'expected for income level' : 'lo esperado para su PIB'; svg.appendChild(flt);

  // dots: primero resto (gris), luego LatAm (terracota) encima
  const rDot = bigFmt ? 8 : 5, rLat = bigFmt ? 11 : 6.5;
  const dotsG = ci_el('g'); svg.appendChild(dotsG);
  pts.filter(p => !p.latam).forEach(p => { const c = ci_el('circle'); c.setAttribute('cx', xS(p.gdp)); c.setAttribute('cy', yS(p.pm)); c.setAttribute('r', rDot); c.setAttribute('fill', CI_REST); c.setAttribute('fill-opacity', 0.7); c.setAttribute('data-ci', p.iso); dotsG.appendChild(c); });
  pts.filter(p => p.latam).forEach(p => { const c = ci_el('circle'); c.setAttribute('cx', xS(p.gdp)); c.setAttribute('cy', yS(p.pm)); c.setAttribute('r', rLat); c.setAttribute('fill', CI_LATAM); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 2 : 1.2); c.setAttribute('data-ci', p.iso); dotsG.appendChild(c); });

  // etiquetas (LatAm notables + refs globales) con declutter vertical simple
  const labels = [];
  pts.forEach(p => {
    const show = (p.latam && CI_LATAM_LABEL.has(p.iso)) || (!p.latam && CI_REFS[p.iso]);
    if (!show) return;
    labels.push({ iso: p.iso, name: ci_name(p), x: xS(p.gdp), y: yS(p.pm), latam: p.latam, r: p.latam ? rLat : rDot });
  });
  // declutter: ordenar por y, empujar hacia abajo si se pisan
  labels.sort((a, b) => a.y - b.y);
  const gap = bigFmt ? fsLab + 4 : 14;
  labels.forEach((l, i) => { l.ly = (i === 0) ? l.y : Math.max(l.y, labels[i - 1].ly + gap); });
  const labG = ci_el('g'); svg.appendChild(labG);
  labels.forEach(l => {
    const lx = l.x + l.r + (bigFmt ? 9 : 5);
    const anchorRight = lx + ci_measure(l.name, fsLab, l.latam ? 700 : 500) > M.left + PW;
    const tx = ci_el('text'); tx.setAttribute('x', anchorRight ? l.x - l.r - (bigFmt ? 9 : 5) : lx); tx.setAttribute('y', l.ly + fsLab * 0.34); tx.setAttribute('text-anchor', anchorRight ? 'end' : 'start');
    tx.style.fontSize = fsLab + 'px'; tx.style.fontFamily = 'var(--sans)'; tx.style.fontWeight = l.latam ? '700' : '500'; tx.style.fill = l.latam ? CI_LATAM : 'var(--ink-muted)';
    tx.setAttribute('paint-order', 'stroke'); tx.setAttribute('stroke', '#FAF8F3'); tx.setAttribute('stroke-width', bigFmt ? 4 : 2.5); tx.setAttribute('stroke-linejoin', 'round');
    tx.textContent = l.name; labG.appendChild(tx);
    // línea guía si se corrió
    if (Math.abs(l.ly - l.y) > 2) { const gl = ci_el('line'); gl.setAttribute('x1', l.x); gl.setAttribute('y1', l.y); gl.setAttribute('x2', anchorRight ? l.x - l.r : l.x + l.r); gl.setAttribute('y2', l.ly - fsLab * 0.2); gl.style.stroke = l.latam ? CI_LATAM : 'var(--ink-muted)'; gl.setAttribute('stroke-width', bigFmt ? 1.2 : 0.8); gl.setAttribute('opacity', 0.45); labG.insertBefore(gl, labG.firstChild); }
  });

  const interactive = !isPng /* tooltips tambien en touch (criterio 6e) */;
  if (interactive) ci_wireHover(svg, pts, xS, yS);
}

function ci_wireHover(svg, pts, xS, yS) {
  const tip = document.getElementById('tooltip3'); if (!tip) return;
  const en = ci_lang() === 'en';
  const byIso = {}; pts.forEach(p => byIso[p.iso] = p);
  svg.querySelectorAll('circle[data-ci]').forEach(c => {
    const p = byIso[c.getAttribute('data-ci')];
    c.style.cursor = 'pointer';
    c.addEventListener('mouseenter', (ev) => {
      c.setAttribute('stroke', '#1A1A1A'); c.setAttribute('stroke-width', 1.6); c.parentNode.appendChild(c);
      tip.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${p.latam ? p.es : (en ? (CI_REFS_EN[p.iso]||p.iso) : (CI_REFS[p.iso]||p.iso))}</div>`
        + `<div>${en ? 'GDP pc' : 'PIB pc'}: <strong>$${p.gdp.toLocaleString(en ? 'en-US' : 'es-AR')}</strong></div>`
        + `<div>${en ? 'Scientists/M' : 'Científicos/M'}: <strong>${p.pm.toString().replace('.', en ? '.' : ',')}</strong> (${p.n})</div>`;
      tip.style.display = 'block'; tip.style.opacity = '1'; ci_placeTip(tip, ev, svg);
    });
    c.addEventListener('mousemove', (ev) => ci_placeTip(tip, ev, svg));
    c.addEventListener('mouseleave', () => { c.setAttribute('stroke', p.latam ? '#FAF8F3' : 'none'); c.setAttribute('stroke-width', p.latam ? 1.2 : 0); tip.style.opacity = '0'; tip.style.display = 'none'; });
  });
}
function ci_placeTip(tip, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tip.offsetWidth || 200;
  const lft = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tip.style.left = lft + 'px'; tip.style.top = (y + 14) + 'px';
}

window.__atlasSupportsFormats = true;
window.__atlasDefaultPngFormat = 'square';
window.__atlasRedraw = drawCiencia;
function initCiencia() { drawCiencia(); }

let _ciMob = ci_isMobile();
window.addEventListener('resize', () => {
  if (!document.getElementById('chart3')) return;
  const now = ci_isMobile(); if (now === _ciMob) return; _ciMob = now; drawCiencia();
});


// ===== Descarga de datos (CSV) — botón estándar del footer =====
(function () {
  const btn = document.querySelector('button.download[data-chart="3-csv"]');
  if (!btn) return;
  const cell = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  btn.addEventListener('click', () => {

    const D = window.CIENCIA;
    const cols = ['block', 'iso3', 'label_es', 'label_en', 'gdp_pc', 'scientists_per_million', 'n_scientists', 'latam', 'resid_sport', 'resid_science'];
    const rows = [];
    D.points.forEach(p => rows.push(['scatter', p.iso, p.es, p.en, p.gdp, p.pm, p.n, p.latam ? 1 : 0, null, null]));
    (D.dumbbell || []).forEach(p => rows.push(['dumbbell_residuals', p.iso, p.es, p.en, null, null, null, null, p.sport, p.sci]));
    let csv = cols.join(',') + '\n';
    rows.forEach(r => { csv += r.map(cell).join(',') + '\n'; });
    // BOM para que Excel abra bien las tildes
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (typeof LANG !== 'undefined' && LANG === 'en') ? 'the-atlas-05-scientists-vs-gdp.csv' : 'el-atlas-05-cientificos-vs-pib.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
})();
