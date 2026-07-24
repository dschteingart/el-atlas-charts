// =============================================================
//  El Atlas N°5 — Chart 8: qué ve cada sociedad en su propio barrio
// =============================================================
// Perfil de un país (default Argentina) sobre la batería H002 del WVS: "¿con qué
// frecuencia pasan estas cosas en tu barrio?" (robos, alcohol en la calle, la
// policía que se mete en la vida privada, conductas racistas, venta de droga).
// Cinco barras horizontales ordenadas de mayor a menor, con la MEDIANA MUNDIAL de
// cada ítem como marcador y, al costado, el PUESTO MUNDIAL del país en ese ítem.
// El valor está en el perfil INTERNO: en Argentina el racismo es lo MENOS saliente
// del barrio, muy por debajo del resto de su propia batería.
//
// Datos: BA_FOTO[item][ola] = [[iso3,pct,year,rank,n],...] (data-barrio.js),
// BA_ITEMS, BA_META, BA_REGION. Clona el motor de perfil.js.

const BA_SVG_NS = 'http://www.w3.org/2000/svg';
const ba_ns = (t) => document.createElementNS(BA_SVG_NS, t);
// Color de las barras = color de la REGIÓN del país elegido (terracota = América
// Latina). Argentina (default) sigue terracota; cada país trae su región.
const BA_MED = '#5A5346';      // gris para la mediana mundial
const BA_AXIS = '#9C928A';
const BA_RANK = '#8A8579';     // gris del puesto mundial
const BA_DEFAULT_ISO = 'ARG';

function ba_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport() : (window.innerWidth || 1024) < 768;
}
function ba_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) return COUNTRY_NAMES[iso][lang] || COUNTRY_NAMES[iso].en || iso;
  return iso;
}
function ba_itemLabel(item) { return (typeof t === 'function') ? t('c8-item-' + item) : item; }
function ba_barColor(iso) {
  const reg = (typeof BA_REGION !== 'undefined') ? BA_REGION[iso] : null;
  return (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#BE5D32';
}
function ba_measure(text, fs, w) {
  if (!ba_measure._c) { const c = document.createElement('canvas'); ba_measure._c = c.getContext('2d'); }
  ba_measure._c.font = `${w || 400} ${fs}px "Source Sans 3", system-ui, sans-serif`;
  return ba_measure._c.measureText(text).width;
}
function ba_getMargins(format) {
  switch (format) {
    case 'newsletter': case 'square': return { top: 44, right: 210, bottom: 86, left: 300 };
    case 'mobile': return { top: 30, right: 170, bottom: 60, left: 250 };
    default: return null;
  }
}

// Ola activa y su etiqueta de años (BA_META.waves = [{w,label},...]).
function ba_waveLabel() {
  if (typeof BA_META === 'undefined' || !BA_META.waves) return '2017-2023';
  const m = BA_META.waves.find(x => x.w === state[8].wave); return m ? m.label : '2017-2023';
}
// Universo (países con los cinco ítems) de la ola activa = denominador del puesto.
function ba_universe() {
  const w = state[8].wave;
  if (typeof BA_META !== 'undefined' && BA_META.n_countries && BA_META.n_countries[w] != null) return BA_META.n_countries[w];
  return null;
}
// Filas de un ítem en la ola activa: [[iso,pct,year,rank,n],...].
function ba_waveRows(item) {
  const w = state[8].wave;
  if (typeof BA_FOTO !== 'undefined' && BA_FOTO[item] && BA_FOTO[item][w]) return BA_FOTO[item][w];
  return [];
}

// Universo de países para el selector: cualquier iso con dato en cualquier ítem/ola.
function ba_countries() {
  const set = new Set();
  (typeof BA_ITEMS !== 'undefined' ? BA_ITEMS : []).forEach(item => {
    const byWave = (typeof BA_FOTO !== 'undefined') ? BA_FOTO[item] : null;
    if (!byWave) return;
    Object.keys(byWave).forEach(w => byWave[w].forEach(r => set.add(r[0])));
  });
  return Array.from(set).sort((a, b) => ba_name(a).localeCompare(ba_name(b), 'es'));
}

// Mediana de un array de números.
function ba_median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Rótulo del puesto mundial ("5° de 64" / "#5 of 64").
function ba_rankLabel(rank, n) {
  const tpl = (typeof t === 'function') ? t('c8-rank-tpl') : '{R}/{N}';
  return tpl.replace('{R}', rank).replace('{N}', n != null ? n : '?');
}

// Datos del país: [{item, pct, med, year, rank}] ordenado por pct desc.
function ba_computeData(iso) {
  const items = (typeof BA_ITEMS !== 'undefined') ? BA_ITEMS : [];
  const out = [];
  items.forEach(item => {
    const rows = ba_waveRows(item);
    const mine = rows.find(r => r[0] === iso);
    if (!mine) return;
    const med = ba_median(rows.map(r => r[1]));
    out.push({ item, pct: mine[1], year: mine[2], rank: mine[3], med });
  });
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

function ba_updateSubtitle(iso) {
  const el = document.querySelector('.chart-subtitle[data-i18n="c8-subtitle-tpl"]');
  if (!el) return;
  const tpl = (typeof t === 'function') ? t('c8-subtitle-tpl') : '';
  if (tpl) el.textContent = tpl.replace('{PAIS}', ba_name(iso)).replace('{PERIODO}', ba_waveLabel());
}

function drawBarrio() {
  const svg = document.getElementById('chart8');
  if (!svg) return;
  svg.innerHTML = '';
  const iso = state[8].iso;
  ba_updateSubtitle(iso);

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigFmt = !!editorFormat || ba_isMobile();
  const mobile = !editorFormat && ba_isMobile();
  const data = ba_computeData(iso);
  const n = data.length;
  const uni = ba_universe();

  // Sin datos para ese país en esa ola (al retroceder en el slider).
  if (n === 0) {
    svg.setAttribute('viewBox', '0 0 1100 180');
    const msg = ba_ns('text');
    msg.setAttribute('x', 550); msg.setAttribute('y', 90); msg.setAttribute('text-anchor', 'middle');
    msg.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    msg.style.fontSize = '18px'; msg.setAttribute('fill', '#8A8579');
    const tpl = (typeof t === 'function') ? t('c8-nodata') : '{PAIS} no tiene datos en {PERIODO}.';
    msg.textContent = tpl.replace('{PAIS}', ba_name(iso)).replace('{PERIODO}', ba_waveLabel());
    svg.appendChild(msg);
    if (typeof atlasSetHeading === 'function') atlasSetHeading('8', false, { title: 'c8-title', titleNeutral: 'c8-title-neutral' });
    return;
  }

  const SIZES = editorFormat
    ? { tick: 22, axisTitle: 25, name: 26, value: 26, rank: 20, med: 21 }
    : mobile
    ? { tick: 20, axisTitle: 22, name: 23, value: 22, rank: 18, med: 19 }
    : { tick: 11, axisTitle: 11.5, name: 13, value: 12.5, rank: 11, med: 11 };

  let W, MARGIN, totalH, BAR_H, BAR_GAP, plotH;
  if (editorFormat) {
    const f = PNG_FORMATS[editorFormat];
    W = f.vbW; totalH = f.vbH; MARGIN = ba_getMargins(editorFormat);
    BAR_GAP = Math.max(10, Math.round(120 / n));
    plotH = totalH - MARGIN.top - MARGIN.bottom;
    BAR_H = (plotH - (n - 1) * BAR_GAP) / n;
  } else {
    W = 1100;
    MARGIN = mobile ? { top: 24, right: 150, bottom: 54, left: 220 } : { top: 24, right: 165, bottom: 44, left: 260 };
    BAR_H = mobile ? 34 : 26; BAR_GAP = mobile ? 14 : 12;
    plotH = n * (BAR_H + BAR_GAP) - BAR_GAP;
    totalH = MARGIN.top + plotH + MARGIN.bottom;
  }

  // margen izq dinámico según la etiqueta de ítem más larga (la del policía es larga)
  let maxNameW = 0;
  data.forEach(d => { const w = ba_measure(ba_itemLabel(d.item), SIZES.name, 600); if (w > maxNameW) maxNameW = w; });
  MARGIN.left = Math.min(Math.round(W * 0.46), Math.max(MARGIN.left, Math.ceil(maxNameW) + (bigFmt ? 18 : 12)));

  const plotW = W - MARGIN.left - MARGIN.right;
  const maxV = Math.max(...data.map(d => Math.max(d.pct, d.med || 0)), 5);
  svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const xScale = (v) => MARGIN.left + (v / (maxV * 1.08)) * plotW;
  const xticks = (typeof niceLinearTicks === 'function') ? niceLinearTicks(0, maxV * 1.08, 5) : [0, 20, 40, 60];

  const gridG = ba_ns('g'); svg.appendChild(gridG);
  xticks.forEach(v => {
    const x = xScale(v);
    const line = ba_ns('line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', MARGIN.top); line.setAttribute('y2', MARGIN.top + plotH);
    line.setAttribute('stroke', '#E5DDD0'); line.setAttribute('stroke-width', 1);
    gridG.appendChild(line);
    const lbl = ba_ns('text');
    lbl.setAttribute('x', x); lbl.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 30 : 15));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = SIZES.tick + 'px'; lbl.setAttribute('fill', '#7A6E62');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = Math.round(v) + '%';
    gridG.appendChild(lbl);
  });
  const xTitle = ba_ns('text');
  xTitle.setAttribute('x', MARGIN.left + plotW / 2);
  xTitle.setAttribute('y', MARGIN.top + plotH + (bigFmt ? 60 : 36));
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  xTitle.style.fontSize = SIZES.axisTitle + 'px'; xTitle.setAttribute('fill', '#7A6E62'); xTitle.setAttribute('font-weight', 500);
  xTitle.textContent = (typeof t === 'function') ? t('c8-axis-x') : '% que lo ve seguido en su barrio';
  svg.appendChild(xTitle);

  const barsG = ba_ns('g'); svg.appendChild(barsG);
  data.forEach((d, i) => {
    const y = MARGIN.top + i * (BAR_H + BAR_GAP);
    const barW = xScale(d.pct) - MARGIN.left;
    // etiqueta ítem
    const nameTxt = ba_ns('text');
    nameTxt.setAttribute('x', MARGIN.left - 10); nameTxt.setAttribute('y', y + BAR_H / 2);
    nameTxt.setAttribute('text-anchor', 'end'); nameTxt.setAttribute('dominant-baseline', 'central');
    nameTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    nameTxt.style.fontSize = SIZES.name + 'px'; nameTxt.setAttribute('font-weight', 500);
    nameTxt.setAttribute('fill', '#3A3530');
    nameTxt.textContent = ba_itemLabel(d.item);
    barsG.appendChild(nameTxt);
    // barra país
    const rect = ba_ns('rect');
    rect.setAttribute('x', MARGIN.left); rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(0, barW)); rect.setAttribute('height', BAR_H);
    rect.setAttribute('fill', ba_barColor(iso)); rect.setAttribute('rx', 2); rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => { rect.setAttribute('fill-opacity', 0.82); ba_showTooltip(e, d); });
    rect.addEventListener('mousemove', (e) => ba_posTooltip(e));
    rect.addEventListener('mouseleave', () => { rect.setAttribute('fill-opacity', 1); ba_hideTooltip(); });
    barsG.appendChild(rect);
    // valor (%)
    const valStr = ((typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct) + '%';
    const valTxt = ba_ns('text');
    valTxt.setAttribute('x', MARGIN.left + barW + 6); valTxt.setAttribute('y', y + BAR_H / 2);
    valTxt.setAttribute('dominant-baseline', 'central');
    valTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    valTxt.style.fontSize = SIZES.value + 'px'; valTxt.setAttribute('font-weight', 600);
    valTxt.setAttribute('fill', '#3A3530'); valTxt.setAttribute('font-variant-numeric', 'tabular-nums');
    valTxt.textContent = valStr;
    barsG.appendChild(valTxt);
    // puesto mundial, al costado del valor (gris, más chico)
    if (d.rank != null) {
      const valW = ba_measure(valStr, SIZES.value, 600);
      const rankTxt = ba_ns('text');
      rankTxt.setAttribute('x', MARGIN.left + barW + 6 + valW + (bigFmt ? 12 : 8));
      rankTxt.setAttribute('y', y + BAR_H / 2); rankTxt.setAttribute('dominant-baseline', 'central');
      rankTxt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      rankTxt.style.fontSize = SIZES.rank + 'px'; rankTxt.setAttribute('font-weight', 500);
      rankTxt.setAttribute('fill', BA_RANK); rankTxt.setAttribute('font-variant-numeric', 'tabular-nums');
      rankTxt.textContent = ba_rankLabel(d.rank, uni);
      barsG.appendChild(rankTxt);
    }
    // marcador mediana mundial (línea vertical fina)
    if (d.med != null) {
      const mx = xScale(d.med);
      const mline = ba_ns('line');
      mline.setAttribute('x1', mx); mline.setAttribute('x2', mx);
      mline.setAttribute('y1', y - 2); mline.setAttribute('y2', y + BAR_H + 2);
      mline.setAttribute('stroke', BA_MED); mline.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
      mline.setAttribute('pointer-events', 'none');
      barsG.appendChild(mline);
    }
  });

  // línea cero
  const zero = ba_ns('line');
  zero.setAttribute('x1', MARGIN.left); zero.setAttribute('x2', MARGIN.left);
  zero.setAttribute('y1', MARGIN.top); zero.setAttribute('y2', MARGIN.top + plotH);
  zero.setAttribute('stroke', BA_AXIS); zero.setAttribute('stroke-width', 1);
  svg.appendChild(zero);

  // Leyenda de la mediana (línea gris + label), ABAJO a la derecha del plot: en
  // este perfil las barras de abajo son cortas (racismo, policía) y queda despejado.
  const legG = ba_ns('g'); svg.appendChild(legG);
  const legTxt = (typeof t === 'function') ? t('c8-median-legend') : 'Mediana mundial';
  const fs = SIZES.med;
  const padX = bigFmt ? 12 : 8, padY = bigFmt ? 8 : 5, tickW = bigFmt ? 3 : 2, gap = bigFmt ? 10 : 7;
  const txtW = ba_measure(legTxt, fs, 500);
  const boxW = padX * 2 + tickW + gap + txtW, boxH = padY * 2 + fs * 1.15;
  const boxX = MARGIN.left + plotW - boxW, boxY = MARGIN.top + plotH - boxH - (bigFmt ? 8 : 5);
  const box = ba_ns('rect');
  box.setAttribute('x', boxX); box.setAttribute('y', boxY);
  box.setAttribute('width', boxW); box.setAttribute('height', boxH); box.setAttribute('rx', 5);
  box.setAttribute('fill', '#F2EEE3'); box.setAttribute('stroke', '#E0DCC8'); box.setAttribute('stroke-width', 1);
  legG.appendChild(box);
  const cy = boxY + boxH / 2;
  const ll = ba_ns('line');
  const lx = boxX + padX;
  ll.setAttribute('x1', lx); ll.setAttribute('x2', lx);
  ll.setAttribute('y1', cy - fs * 0.5); ll.setAttribute('y2', cy + fs * 0.5);
  ll.setAttribute('stroke', BA_MED); ll.setAttribute('stroke-width', bigFmt ? 2.4 : 1.6);
  legG.appendChild(ll);
  const lt = ba_ns('text');
  lt.setAttribute('x', lx + tickW + gap); lt.setAttribute('y', cy); lt.setAttribute('dominant-baseline', 'central');
  lt.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  lt.style.fontSize = fs + 'px'; lt.setAttribute('fill', BA_MED); lt.setAttribute('font-weight', 600);
  lt.textContent = legTxt;
  legG.appendChild(lt);

  // título insight→neutral (default NEUTRAL, como el resto de los charts del N°5)
  if (typeof atlasSetHeading === 'function') {
    atlasSetHeading('8', false, { title: 'c8-title', titleNeutral: 'c8-title-neutral' });
  }
}

function ba_showTooltip(e, d) {
  const tt = document.getElementById('tooltip8'); if (!tt) return;
  const L = (typeof t === 'function') ? t : (k) => k;
  const uni = ba_universe();
  const cmp = d.med != null ? (d.pct >= d.med ? L('c8-tt-above') : L('c8-tt-below')) : '';
  const rankLine = (d.rank != null)
    ? `<div class="tt-row"><span>${L('c8-tt-rank')}</span><span>${ba_rankLabel(d.rank, uni)}</span></div>` : '';
  tt.innerHTML = `<strong>${ba_itemLabel(d.item)}</strong>`
    + `<div class="tt-row"><span>${ba_name(state[8].iso)}</span><span>${(typeof fmt === 'function') ? fmt(d.pct, 1) : d.pct}%</span></div>`
    + (d.med != null ? `<div class="tt-row"><span>${L('c8-median-legend')}</span><span>${(typeof fmt === 'function') ? fmt(d.med, 1) : d.med}%</span></div>` : '')
    + rankLine
    + (cmp ? `<div class="tt-sub">${cmp}</div>` : '');
  tt.style.display = 'block'; tt.style.opacity = '1';
  ba_posTooltip(e);
}
function ba_posTooltip(e) {
  const tt = document.getElementById('tooltip8'); if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const x = (typeof evClientX === 'function' ? evClientX(e) : e.clientX) - wrap.left;
  const y = (typeof evClientY === 'function' ? evClientY(e) : e.clientY) - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function ba_hideTooltip() { const tt = document.getElementById('tooltip8'); if (tt) tt.style.opacity = '0'; }

function setupBarrioCountry() {
  const sel = document.getElementById('ba-country-select');
  if (!sel) return;
  sel.innerHTML = '';
  ba_countries().forEach(iso => {
    const o = document.createElement('option');
    o.value = iso; o.textContent = ba_name(iso);
    sel.appendChild(o);
  });
  sel.value = state[8].iso;
  sel.addEventListener('change', () => { state[8].iso = sel.value; drawBarrio(); });
}

function setupBarrioCSV() {
  document.querySelectorAll('button.download[data-chart="8-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
      let csv = '# El Atlas N5 — que ve cada sociedad en su barrio (WVS, bateria H002)\n';
      csv += '# pct = % "muy/bastante seguido" {1,2} sobre {1,2,3,4}, ponderado S017. rank sobre el universo de paises con los 5 items.\n';
      csv += 'iso3,pais,item,var,ola,anio,pct,rank,n_universo,mediana_mundial,n_respondentes\n';
      const items = (typeof BA_ITEMS !== 'undefined') ? BA_ITEMS : [];
      const waves = (typeof BA_META !== 'undefined' && BA_META.waves) ? BA_META.waves.map(x => x.w) : [];
      items.forEach(item => {
        const varName = (BA_META.items[item] && BA_META.items[item].var) || '';
        waves.forEach(w => {
          const rows = (BA_FOTO[item] && BA_FOTO[item][w]) || [];
          const med = ba_median(rows.map(r => r[1]));
          const uni = (BA_META.n_countries && BA_META.n_countries[w] != null) ? BA_META.n_countries[w] : '';
          rows.forEach(r => {
            const nm = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[r[0]]) ? COUNTRY_NAMES[r[0]].en : r[0];
            csv += `${r[0]},${nm},${item},${varName},${w},${r[2]},${r[1]},${r[3]},${uni},${med != null ? med.toFixed(2) : ''},${r[4]}\n`;
          });
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = lang === 'en' ? 'the-atlas-05-neighbourhood.csv' : 'el-atlas-05-barrio.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
    });
  });
}

// Slider de ola (un thumb sobre BA_META.waves, default la más reciente).
function setupBarrioWave() {
  const input = document.getElementById('ba-wave-slider');
  const disp = document.getElementById('ba-wave-display');
  if (!input || typeof BA_META === 'undefined' || !BA_META.waves || !BA_META.waves.length) {
    const grp = document.getElementById('ba-wave-group'); if (grp) grp.style.display = 'none';
    return;
  }
  const waves = BA_META.waves;
  input.min = 0; input.max = waves.length - 1; input.step = 1;
  const idxOf = (w) => Math.max(0, waves.findIndex(x => x.w === w));
  input.value = idxOf(state[8].wave);
  if (disp) disp.textContent = ba_waveLabel();
  input.addEventListener('input', () => {
    state[8].wave = waves[+input.value].w;
    if (disp) disp.textContent = ba_waveLabel();
    drawBarrio();
  });
}

function initBarrio() {
  const lastWave = (typeof BA_META !== 'undefined' && BA_META.waves && BA_META.waves.length)
    ? BA_META.waves[BA_META.waves.length - 1].w : 7;
  if (!state[8]) state[8] = { iso: BA_DEFAULT_ISO, wave: lastWave };
  if (state[8].wave == null) state[8].wave = lastWave;
  setupBarrioCountry();
  setupBarrioWave();
  setupBarrioCSV();
  drawBarrio();
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawBarrio;
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initBarrio._wired) {
    initBarrio._wired = true;
    window.addEventListener('atlas-editor-change', () => drawBarrio());
  }
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (chartId !== '8') return null;
    return (typeof t === 'function') ? t('c8-sources') : null;
  };
}
