// =============================================================
//  El Atlas N°5 — Chart 9: perfil de hostilidad hacia el inmigrante
// =============================================================
// Clon de perfil.js (barras horizontales de un país, ordenadas de mayor a
// menor), adaptado a la batería migratoria del Latinobarómetro 2020 (14 ítems,
// 18 países). Dos modos:
//   · CENTRADO (default): DESVÍO de cada ítem respecto del perfil regional una
//     vez descontado el nivel general del país. Barras divergentes a ambos
//     lados de una línea 0 = mediana regional del desvío. Aísla la FORMA del
//     prejuicio (qué le molesta a cada sociedad) de su intensidad.
//   · CRUDO: % con postura hostil por ítem, con la mediana regional (MG_MED)
//     como marcador. Sensible al sesgo de NS/NR entre países; por eso el
//     default es el centrado.
// El hallazgo: el argentino no dice que el inmigrante sea un delincuente
// (crimen -18,5) sino que no le corresponde el hospital (acceso a salud y
// educación +26,1, casi el triple del segundo país).
//
// Datos: data-migrantes.js — MG_ITEMS, MG_META, MG_LEVEL, MG_PROFILE, MG_MED,
// MG_N, MG_REGION (arrays alineados al orden fijo de MG_ITEMS).

const MG_SVG_NS = 'http://www.w3.org/2000/svg';
const mg_ns = (t) => document.createElementNS(MG_SVG_NS, t);
const MG_NEG = '#B7B0A2';       // gris cálido: por debajo del perfil regional
const MG_MEDCOL = '#5A5346';    // gris de la mediana / línea de referencia
const MG_AXIS = '#9C928A';
const MG_DEFAULT_ISO = 'ARG';
const MG_DEFAULT_MODE = 'centrado';

function mg_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function mg_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function mg_itemLabel(code) {
  const k = 'c9-item-' + code;
  if (typeof t === 'function') { const s = t(k); if (s && s !== k) return s; }
  // fallback: etiqueta ES del payload
  const m = (typeof MG_META !== 'undefined') ? MG_META.items.find(p => p[0] === code) : null;
  return m ? m[1] : code;
}
function mg_barColor(iso) {
  const reg = (typeof MG_REGION !== 'undefined') ? MG_REGION[iso] : null;
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#BE5D32';
}
function mg_signed(v) {
  const s = (typeof fmt === 'function') ? fmt(Math.abs(v), 1) : Math.abs(v).toFixed(1);
  if (v > 0) return '+' + s;
  if (v < 0) return '−' + s;   // minus tipográfico
  return '0';
}
function mg_measure(text, fs, w) {
  if (!mg_measure._c) { const c = document.createElement('canvas'); mg_measure._c = c.getContext('2d'); }
  mg_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return mg_measure._c.measureText(text).width;
}

// Universo de países: los que tienen fila en MG_LEVEL, ordenados por nombre.
function mg_countries() {
  const src = (typeof MG_LEVEL !== 'undefined') ? MG_LEVEL : {};
  return Object.keys(src).sort((a, b) => mg_name(a).localeCompare(mg_name(b), 'es'));
}

// Datos del país en el modo activo: [{code, i, val, level, prof, med, n}]
// ordenado por val desc. Descarta ítems null (Venezuela no tiene el ítem 204).
function mg_computeData(iso, mode) {
  const items = (typeof MG_ITEMS !== 'undefined') ? MG_ITEMS : [];
  const level = (typeof MG_LEVEL !== 'undefined' && MG_LEVEL[iso]) ? MG_LEVEL[iso] : [];
  const prof = (typeof MG_PROFILE !== 'undefined' && MG_PROFILE[iso]) ? MG_PROFILE[iso] : [];
  const med = (typeof MG_MED !== 'undefined') ? MG_MED : [];
  const nn = (typeof MG_N !== 'undefined' && MG_N[iso]) ? MG_N[iso] : [];
  const out = [];
  items.forEach((code, i) => {
    const v = mode === 'centrado' ? prof[i] : level[i];
    if (v == null || isNaN(v)) return;
    out.push({ code, i, val: v, level: level[i], prof: prof[i], med: med[i], n: nn[i] });
  });
  out.sort((a, b) => b.val - a.val);
  return out;
}

function mg_updateSubtitle(iso, mode) {
  const el = document.querySelector('.chart-subtitle[data-i18n="c9-subtitle"]');
  if (!el) return;
  const key = mode === 'centrado' ? 'c9-subtitle-centered' : 'c9-subtitle-raw';
  const tpl = (typeof t === 'function') ? t(key) : '';
  if (tpl) el.textContent = tpl.replace('{PAIS}', mg_name(iso));
}

function drawMigrantes() {
  const svg = document.getElementById('chart9');
  if (!svg) return;
  svg.innerHTML = '';
  const iso = state[9].iso;
  const mode = state[9].mode;
  mg_updateSubtitle(iso, mode);

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || mg_isMobile();
  const mobile = !editorFormat && mg_isMobile();
  const centered = mode === 'centrado';
  const data = mg_computeData(iso, mode);
  const n = data.length;

  if (n === 0) {
    svg.setAttribute('viewBox', '0 0 1100 180');
    if (typeof atlasSetHeading === 'function') atlasSetHeading('9', false, { title: 'c9-title', titleNeutral: 'c9-title-neutral' });
    return;
  }

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 24, name: 22, value: 25, med: 21, hint: 20 }
    : mobile
    ? { tick: 20, axisTitle: 21, name: 21, value: 22, med: 19, hint: 19 }
    : { tick: 11, axisTitle: 11.5, name: 12.5, value: 12.5, med: 11, hint: 11 };

  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH;
    MARGIN = { top: 44, right: 96, bottom: 92, left: 300 };
    BAR_GAP = Math.max(9, Math.round(120 / n));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = (plotH - (n - 1) * BAR_GAP) / n;
  } else {
    W = 1100;
    MARGIN = mobile ? { top: 24, right: 62, bottom: 76, left: 220 } : { top: 24, right: 88, bottom: 62, left: 260 };
    BAR_H = mobile ? 32 : 24; BAR_GAP = mobile ? 14 : 12;
    plotH = n * (BAR_H + BAR_GAP) - BAR_GAP;
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  // Margen izquierdo dinámico + auto-fit del tamaño de fuente de las etiquetas:
  // las frases son largas; en vez de partirlas en dos líneas, achico la fuente
  // lo justo para que la más larga entre en UNA línea dentro del tope. Así nunca
  // se solapan filas (que es el riesgo del wrap con barras finas del PNG).
  const cap = Math.round(W * 0.46);
  const labelPad = bigFmt ? 16 : 11;
  let longest = 0;
  data.forEach(d => { const w = mg_measure(mg_itemLabel(d.code), SIZES.name, 600); if (w > longest) longest = w; });
  const availW = cap - labelPad;
  const scale = longest > availW ? availW / longest : 1;
  const nameFs = Math.max(bigFmt ? 15 : 9.5, SIZES.name * scale);
  MARGIN.left = Math.min(cap, Math.max(bigFmt ? 150 : 130, Math.ceil(longest * scale) + labelPad));

  const plotW = W - MARGIN.left - MARGIN.right;
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  // Dominio del eje.
  let d0, d1;
  if (centered) {
    const maxAbs = Math.max(...data.map(d => Math.abs(d.val)), 5);
    const pad = maxAbs * 1.14;
    d0 = -pad; d1 = pad;
  } else {
    const maxV = Math.max(...data.map(d => Math.max(d.val, d.med || 0)), 5);
    d0 = 0; d1 = maxV * 1.08;
  }
  const xScale = (v) => MARGIN.left + ((v - d0) / (d1 - d0)) * plotW;
  const zeroX = xScale(0);

  // ---- grilla + ticks ----
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(d0, d1, 5) : (centered ? [-20, -10, 0, 10, 20] : [0, 20, 40, 60]);
  const gridG = mg_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = mg_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = mg_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = centered ? (v > 0 ? '+' + Math.round(v) : v < 0 ? '−' + Math.round(Math.abs(v)) : '0') : (Math.round(v) + '%');
    gridG.appendChild(lbl);
  });

  // título de eje x
  const xTitle = mg_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 62 : 38));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t(centered ? 'c9-axis-centered' : 'c9-axis-raw') : '';
  svg.appendChild(xTitle);

  // ---- barras ----
  const barsG = mg_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const xv = xScale(d.val);
    const x0 = Math.min(zeroX, xv);
    const barW = Math.abs(xv - zeroX);

    // etiqueta del ítem (una sola línea, fuente auto-ajustada)
    const nameTxt = mg_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 10); nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = nameFs + 'px'; nameTxt.setAttribute('font-weight', 500);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = mg_itemLabel(d.code);
    barsG.appendChild(nameTxt);

    // barra
    const col = centered ? (d.val >= 0 ? mg_barColor(iso) : MG_NEG) : mg_barColor(iso);
    const rect = mg_ns('rect');
    rect.setAttribute('x', x0); rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', col); rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); mg_showTooltip(e, d); });
    rect.addEventListener('mousemove', (e) => mg_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); mg_hideTooltip(); });
    barsG.appendChild(rect);

    // valor al extremo exterior de la barra
    const valTxt = mg_ns('text');
    const rightSide = d.val >= 0;
    valTxt.setAttribute('x', rightSide ? xv + 6 : xv - 6);
    valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('text-anchor', rightSide ? 'start' : 'end');
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = centered ? mg_signed(d.val) : ((typeof fmt === 'function') ? fmt(d.val, 1) : d.val) + '%';
    barsG.appendChild(valTxt);

    // marcador de mediana regional (solo modo crudo)
    if (!centered && d.med != null) {
      const mx = xScale(d.med);
      const mline = mg_ns('line');
      mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
      mline.setAttribute('y1', y - 2); mline.setAttribute('y2', y + BAR_H + 2);
      mline.setAttribute('stroke', MG_MEDCOL); mline.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      mline.setAttribute('pointer-events', 'none');
      barsG.appendChild(mline);
    }
  });

  // ---- línea de referencia (0 / eje) ----
  const zero = mg_ns('line');
  zero.setAttribute('x1', zeroX); zero.setAttribute('x2', zeroX);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', centered ? MG_MEDCOL : MG_AXIS);
  zero.setAttribute('stroke-width', centered ? (bigFmt ? 2.2 : 1.5) : 1);
  svg.appendChild(zero);

  if (centered) {
    // rótulo de la línea 0 = perfil regional, arriba de la línea
    const zt = mg_ns('text');
    zt.setAttribute('x', zeroX); zt.setAttribute('y', MARGIN.top - (bigFmt ? 8 : 5));
    zt.setAttribute('text-anchor', 'middle');
    zt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    zt.style.fontSize = SIZES.hint + 'px'; zt.setAttribute('fill', MG_MEDCOL); zt.setAttribute('font-weight', 600);
    zt.setAttribute('paint-order', 'stroke'); zt.setAttribute('stroke', '#FAF8F3'); zt.setAttribute('stroke-width', bigFmt ? 4 : 3); zt.setAttribute('stroke-linejoin', 'round');
    zt.textContent = (typeof t === 'function') ? t('c9-zero-legend') : 'perfil regional';
    svg.appendChild(zt);
  } else {
    // leyenda de la mediana regional (recuadro abajo a la derecha, como perfil.js)
    const legG = mg_ns('g'); svg.appendChild(legG);
    const legTxt = (typeof t === 'function') ? t('c9-median-legend') : 'Mediana regional';
    const fs = SIZES.med;
    const padX = bigFmt ? 12 : 8, padY = bigFmt ? 8 : 5, tickW = bigFmt ? 3 : 2, gap = bigFmt ? 10 : 7;
    const txtW = mg_measure(legTxt, fs, 500);
    const boxW = padX * 2 + tickW + gap + txtW, boxH = padY * 2 + fs * 1.15;
    const boxX = MARGIN.left + plotW - boxW, boxY = MARGIN.top + plotH - boxH - (bigFmt ? 8 : 5);
    const box = mg_ns('rect');
    box.setAttribute('x', boxX); box.setAttribute('y', boxY);
    box.setAttribute('width', boxW); box.setAttribute('height', boxH); box.setAttribute('rx', 5);
    box.setAttribute('fill', '#F2EEE3'); box.setAttribute('stroke', '#E0DCC8'); box.setAttribute('stroke-width', 1);
    legG.appendChild(box);
    const cy = boxY + boxH / 2, lx = boxX + padX;
    const ll = mg_ns('line');
    ll.setAttribute('x1', lx); ll.setAttribute('x2', lx);
    ll.setAttribute('y1', cy - fs * 0.5); ll.setAttribute('y2', cy + fs * 0.5);
    ll.setAttribute('stroke', MG_MEDCOL); ll.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
    legG.appendChild(ll);
    const lt = mg_ns('text');
    lt.setAttribute('x', lx + tickW + gap); lt.setAttribute('y', cy); lt.setAttribute('dominant-baseline', 'central');
    lt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lt.style.fontSize = fs + 'px'; lt.setAttribute('fill', MG_MEDCOL); lt.setAttribute('font-weight', 600);
    lt.textContent = legTxt;
    legG.appendChild(lt);
  }

  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('9', false, { title: 'c9-title', titleNeutral: 'c9-title-neutral' });
  }
}

// ---------------- tooltip ----------------
function mg_showTooltip(e, d) {
  const tt = document.getElementById('tooltip9'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  const F = (v, dec) => (typeof fmt === 'function') ? fmt(v, dec) : v;
  const centered = state[9].mode === 'centrado';
  let html = `<strong>${mg_itemLabel(d.code)}</strong>`;
  if (centered) {
    html += `<div class="tt-row"><span>${L('c9-tt-profile')}</span><span>${mg_signed(d.val)}</span></div>`;
    if (d.level != null) html += `<div class="tt-row"><span>${L('c9-tt-level')}</span><span>${F(d.level, 1)}%</span></div>`;
    if (d.med != null) html += `<div class="tt-row"><span>${L('c9-tt-median')}</span><span>${F(d.med, 1)}%</span></div>`;
    if (d.n != null) html += `<div class="tt-row"><span>${L('c1-tt-n')}</span><span>${F(d.n, 0)}</span></div>`;
    html += `<div class="tt-sub">${d.val >= 0 ? L('c9-tt-more') : L('c9-tt-less')}</div>`;
  } else {
    if (d.level != null) html += `<div class="tt-row"><span>${L('c9-tt-level')}</span><span>${F(d.level, 1)}%</span></div>`;
    if (d.med != null) html += `<div class="tt-row"><span>${L('c9-tt-median')}</span><span>${F(d.med, 1)}%</span></div>`;
    if (d.n != null) html += `<div class="tt-row"><span>${L('c1-tt-n')}</span><span>${F(d.n, 0)}</span></div>`;
    if (d.med != null) html += `<div class="tt-sub">${d.level >= d.med ? L('c9-tt-above') : L('c9-tt-below')}</div>`;
  }
  tt.innerHTML = html;
  tt.style.display = 'block'; tt.style.opacity = '1';
  mg_posTooltip(e);
}
function mg_posTooltip(e) {
  const tt = document.getElementById('tooltip9'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function mg_hideTooltip() { const tt = document.getElementById('tooltip9'); if (tt) tt.style.opacity = '0'; }

// ---------------- controles ----------------
function setupMigrantesCountry() {
  const sel = document.getElementById('mg-country-select');
  if (!sel) return;
  sel.innerHTML = '';
  mg_countries().forEach(iso => {
    const o = document.createElement('option');
    o.value = iso; o.textContent = mg_name(iso);
    sel.appendChild(o);
  });
  sel.value = state[9].iso;
  sel.addEventListener('change', () => { state[9].iso = sel.value; drawMigrantes(); });
}
function setupMigrantesMode() {
  document.querySelectorAll('#mg-mode button').forEach(btn => btn.addEventListener('click', () => {
    const m = btn.dataset.mode;
    if ((m !== 'centrado' && m !== 'crudo') || state[9].mode === m) return;
    state[9].mode = m;
    document.querySelectorAll('#mg-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    drawMigrantes();
  }));
}
function setupMigrantesCSV() {
  document.querySelectorAll('button.download[data-chart="9-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      const items = (typeof MG_ITEMS !== 'undefined') ? MG_ITEMS : [];
      let csv = '# El Atlas N5 — perfil de hostilidad hacia el inmigrante (Latinobarometro 2020, 14 items)\n';
      csv += '# nivel_pct = % con postura hostil; perfil_desvio = desvio del perfil regional (pp); mediana_regional = mediana del nivel crudo\n';
      csv += 'iso3,pais,item_code,item,nivel_pct,perfil_desvio,mediana_regional,n\n';
      mg_countries().forEach(iso => {
        const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) ? COUNTRY_NAMES[iso].en : iso;
        items.forEach((code, i) => {
          const lv = MG_LEVEL[iso] ? MG_LEVEL[iso][i] : null;
          const pr = MG_PROFILE[iso] ? MG_PROFILE[iso][i] : null;
          const md = (typeof MG_MED !== 'undefined') ? MG_MED[i] : null;
          const nn = MG_N[iso] ? MG_N[iso][i] : null;
          const label = mg_itemLabel(code).replace(/"/g, '""');
          csv += `${iso},"${nm}",${code},"${label}",${lv == null ? '' : lv},${pr == null ? '' : pr},${md == null ? '' : md},${nn == null ? '' : nn}\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-immigrant-profile.csv' : 'el-atlas-05-perfil-inmigrante.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

function initMigrantes() {
  if (!state[9]) state[9] = { iso: MG_DEFAULT_ISO, mode: MG_DEFAULT_MODE };
  if (!state[9].mode) state[9].mode = MG_DEFAULT_MODE;
  setupMigrantesCountry();
  setupMigrantesMode();
  setupMigrantesCSV();
  document.querySelectorAll('#mg-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === state[9].mode));
  drawMigrantes();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawMigrantes;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initMigrantes._wired) {
    initMigrantes._wired = true;
    window.addEventListener('atlas-editor-change', () => drawMigrantes());
  }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '9') return null;
    return (typeof t === 'function') ? t('c9-sources') : null;
  };
}
