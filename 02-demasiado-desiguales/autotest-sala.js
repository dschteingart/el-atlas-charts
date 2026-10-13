// =============================================================
//  El Atlas · Escuela UNSAM 2026 · Tablero de la sala (docente)
// =============================================================
//
// Lee las respuestas crudas del Google Form (pais, ingreso_usd_mes, personas,
// calculo) y RECALCULA todo con autotest-core.js. Del campo "calculo" solo se
// usa la marca de prueba ("test":1) para descartar la fila.
//
// Entradas (todo en el navegador, sin backend):
//   ?csv=<url>   CSV publicado de Google Sheets (botón "Actualizar")
//   archivo      CSV descargado de la hoja (arrastrar o elegir)
//   pegado       filas copiadas de la hoja, con encabezados (tabuladas)
//   ?demo=1      respuestas sintéticas, con aviso "DATOS DE PRUEBA"

const SALA_SANS = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SALA_SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif';
const SALA_LATAM_COLOR = '#BE5D32';
const SALA_OTHER_COLOR = '#9A958A';
const SALA_NORDIC_COLOR = '#2C5F7C';
const SALA_REF_ISOS = ['ESP', 'USA', 'NOR'];

const salaParams = new URLSearchParams(location.search);
const salaState = { rows: null, result: null, source: null, csvUrl: salaParams.get('csv') || null };

let _salaIsoSet = null;
function salaIsoOk(iso) {
  if (!_salaIsoSet) _salaIsoSet = new Set(atUniverse().map(c => c.iso));
  return _salaIsoSet.has(iso);
}

function salaEsc(s) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// ---------------- Lectura de CSV / TSV ----------------

function salaParseDelimited(text) {
  text = String(text || '').replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const count = ch => {
    let n = 0, q = false;
    for (const c of firstLine) { if (c === '"') q = !q; else if (!q && c === ch) n++; }
    return n;
  };
  const cands = [['\t', count('\t')], [',', count(',')], [';', count(';')]];
  cands.sort((a, b) => b[1] - a[1]);
  const delim = cands[0][1] > 0 ? cands[0][0] : ',';
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') { inQ = true; continue; }
    if (ch === delim) { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}

function salaMapColumns(header) {
  const norm = header.map(h => atNormalize(h).replace(/\s+/g, ' '));
  const find = (exacts, contains) => {
    let i = norm.findIndex(h => exacts.includes(h));
    if (i < 0) i = norm.findIndex(h => contains.some(c => h.includes(c)));
    return i;
  };
  return {
    ts: find(['marca temporal', 'timestamp'], ['marca temporal', 'timestamp']),
    pais: find(['pais', 'country', 'iso3', 'iso'], ['pais']),
    ing: find(['ingreso_usd_mes'], ['ingreso']),
    per: find(['personas'], ['persona']),
    calc: find(['calculo'], ['calculo'])
  };
}

// Devuelve { rows: [{ts, pais, ing, per, calc}], error }
function salaRowsFromText(text) {
  const table = salaParseDelimited(text);
  if (!table.length) return { rows: [], error: 'No encontré filas para leer.' };
  let cols = salaMapColumns(table[0]);
  let body = table.slice(1);
  if (cols.pais < 0 || cols.ing < 0 || cols.per < 0) {
    // Sin encabezados reconocibles: si parece el orden del formulario
    // (marca temporal, pais, ingreso, personas, calculo), se lee por posición.
    const r0 = table[0];
    if (r0.length >= 4 && /^[A-Za-z]{3}$/.test(String(r0[1]).trim())) {
      cols = { ts: 0, pais: 1, ing: 2, per: 3, calc: r0.length > 4 ? 4 : -1 };
      body = table;
    } else {
      return { rows: [], error: 'No encontré las columnas pais, ingreso_usd_mes y personas en la primera fila.' };
    }
  }
  const get = (r, i) => (i >= 0 && i < r.length) ? String(r[i]).trim() : '';
  return {
    rows: body.map(r => ({ ts: get(r, cols.ts), pais: get(r, cols.pais), ing: get(r, cols.ing), per: get(r, cols.per), calc: get(r, cols.calc) })),
    error: null
  };
}

// ---------------- Recalculo ----------------

function salaProcess(rows) {
  const valid = [];
  const drop = { invalid: 0, test: 0 };
  rows.forEach(rr => {
    let calc = null;
    if (rr.calc) { try { calc = JSON.parse(rr.calc); } catch (e) { calc = null; } }
    if (calc && (calc.test === 1 || calc.test === '1' || calc.test === true)) { drop.test++; return; }
    const iso = String(rr.pais || '').trim().toUpperCase();
    const inc = atParseNumber(rr.ing);
    const perNum = atParseNumber(rr.per);
    const per = Number.isInteger(perNum) ? perNum : NaN;
    if (!salaIsoOk(iso) || !(inc > 0) || inc > 100000 || !(per >= 1 && per <= 20)) { drop.invalid++; return; }
    const r = atCompute(iso, inc, per);
    if (!r) { drop.invalid++; return; }
    valid.push(r);
  });
  return { valid, drop };
}

// ---------------- Datos de prueba ----------------

function salaRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function salaDemoRows() {
  const rnd = salaRng(2026);
  const norm = () => {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // [país, cantidad, ingreso mensual mediano del hogar en US$, dispersión]
  const spec = [
    ['ARG', 22, 2300, 0.45], ['BRA', 3, 2800, 0.5], ['CHL', 2, 3300, 0.4],
    ['URY', 2, 3000, 0.4], ['MEX', 2, 2400, 0.45], ['COL', 2, 2100, 0.45],
    ['PER', 2, 1900, 0.45], ['ESP', 1, 3600, 0.3], ['VEN', 1, 900, 0.3]
  ];
  const personsPool = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5];
  const rows = [];
  let minute = 0;
  spec.forEach(([iso, n, med, sd]) => {
    for (let i = 0; i < n; i++) {
      const inc = Math.round(med * Math.exp(sd * norm()) / 50) * 50;
      const per = personsPool[Math.floor(rnd() * personsPool.length)];
      const r = atCompute(iso, inc, per);
      const calc = JSON.stringify({ v: 1, ppp: +r.ppp.toFixed(2), pc: r.pc == null ? null : +r.pc.toFixed(1), pw: +r.pw.toFixed(1), test: 0 });
      minute += 1;
      rows.push({ ts: '12/10/2026 18:' + String(minute % 60).padStart(2, '0') + ':00', pais: iso, ing: String(inc), per: String(per), calc });
    }
  });
  // Filas que el tablero tiene que descartar
  rows.push({ ts: '12/10/2026 18:50:00', pais: 'ARG', ing: '0', per: '2', calc: '' });
  rows.push({ ts: '12/10/2026 18:51:00', pais: 'XXX', ing: '2000', per: '2', calc: '' });
  rows.push({ ts: '12/10/2026 18:52:00', pais: 'ARG', ing: '2500', per: '2', calc: '{"v":1,"ppp":77.4,"pc":93.8,"pw":94.1,"test":1}' });
  return rows;
}

// ---------------- Beeswarm ----------------

function salaBeeswarm(xs, r) {
  const order = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
  const placed = [];
  const ys = new Array(xs.length);
  const D = 2 * r + 1.2;
  const D2 = D * D;
  order.forEach(i => {
    const x = xs[i];
    const near = placed.filter(p => Math.abs(p.x - x) < D);
    const cands = [0];
    near.forEach(p => {
      const dy = Math.sqrt(Math.max(0, D2 - (p.x - x) * (p.x - x)));
      cands.push(p.y + dy, p.y - dy);
    });
    cands.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
    let y = 0;
    for (const c of cands) {
      if (near.every(p => (p.x - x) * (p.x - x) + (p.y - c) * (p.y - c) >= D2 - 0.01)) { y = c; break; }
    }
    placed.push({ x, y });
    ys[i] = y;
  });
  return ys;
}

function salaTextW(str, fs) { return String(str).length * fs * 0.53; }

function salaSwarmChart(el, items, key, opts) {
  const W = Math.max(300, Math.round(el.clientWidth || 900));
  const big = W >= 820;
  const fsTick = big ? 17 : 13;
  const fsBand = big ? 16 : 12.5;
  const fsMed = big ? 19 : 14;
  const fsAxis = big ? 16 : 12.5;
  const mL = big ? 16 : 10, mR = big ? 16 : 10;
  const plotW = W - mL - mR;
  const x = v => mL + plotW * Math.max(0, Math.min(100, v)) / 100;

  const pts = items.filter(d => d[key] != null);
  const xs = pts.map(d => x(d[key]));
  const maxSwarm = big ? 250 : 170;
  let r = big ? 10 : 6.5;
  const minR = big ? 3.5 : 2.6;
  let ys = salaBeeswarm(xs, r);
  let ext = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0) + r;
  while (2 * ext > maxSwarm && r > minR) {
    r = Math.max(minR, r * 0.9);
    ys = salaBeeswarm(xs, r);
    ext = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0) + r;
  }
  const swarmH = Math.max(2 * ext + 12, big ? 110 : 80);

  const medRowH = fsMed + 14;
  const bandRow = fsBand + 8;
  const bandTop = medRowH;
  const swarmTop = bandTop + 2 * bandRow + 6;
  const axisY = swarmTop + swarmH;
  const H = axisY + fsTick + 14 + fsAxis + 14;
  const cy = swarmTop + swarmH / 2;

  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${salaEsc(opts.aria)}">`;
  // Franjas del 20% y del 10% más rico
  s += `<rect x="${x(80)}" y="${bandTop}" width="${x(100) - x(80)}" height="${axisY - bandTop}" fill="#F3E7DE"/>`;
  s += `<rect x="${x(90)}" y="${bandTop}" width="${x(100) - x(90)}" height="${axisY - bandTop}" fill="#EBD6C8"/>`;
  s += `<line x1="${x(80)}" x2="${x(80)}" y1="${bandTop}" y2="${axisY}" stroke="#D9B9A5" stroke-width="1"/>`;
  s += `<line x1="${x(90)}" x2="${x(90)}" y1="${bandTop}" y2="${axisY}" stroke="#D9B9A5" stroke-width="1"/>`;
  // Etiquetas de las franjas: se dibujan después de la mediana, con halo del
  // color de la franja para que la línea punteada no las tache.
  const bandLabel = (from, txt, row, halo) => {
    const ty = bandTop + bandRow * (row + 1) - 4;
    let tx = x(from) + 6, anchor = 'start';
    if (tx + salaTextW(txt, fsBand) > x(100) - 3) { tx = x(100) - 4; anchor = 'end'; }
    return `<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-family='${SALA_SANS}' font-size="${fsBand}" font-weight="600" fill="#8B4220" paint-order="stroke" stroke="${halo}" stroke-width="7" stroke-linejoin="round">${salaEsc(txt)}</text>`;
  };
  const bandLabels = bandLabel(80, big ? '20% más rico →' : '20% →', 0, '#F3E7DE') +
                     bandLabel(90, big ? '10% más rico →' : '10% →', 1, '#EBD6C8');

  // Grilla
  for (let k = 0; k <= 100; k += 10) {
    if (k === 80 || k === 90) continue;
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${swarmTop - 4}" y2="${axisY}" stroke="#ECE7D8" stroke-width="1"/>`;
  }

  // Mediana de la sala
  const med = atMedian(pts.map(d => d[key]));
  if (med != null) {
    const xm = x(med);
    s += `<line x1="${xm}" x2="${xm}" y1="${medRowH - 6}" y2="${axisY}" stroke="#1A1A1A" stroke-width="1.6" stroke-dasharray="6 4"/>`;
    s += bandLabels;
    const lab = `Mediana de la sala: ${atFmtPct(med)}`;
    const tw = salaTextW(lab, fsMed);
    let tx = xm, anchor = 'middle';
    if (xm + tw / 2 > W - 2) { tx = Math.min(W - 2, xm + 8); anchor = 'end'; }
    else if (xm - tw / 2 < 2) { tx = Math.max(2, xm - 8); anchor = 'start'; }
    s += `<text x="${tx}" y="${fsMed + 2}" text-anchor="${anchor}" font-family='${SALA_SANS}' font-size="${fsMed}" font-weight="700" fill="#1A1A1A">${salaEsc(lab)}</text>`;
  } else {
    s += bandLabels;
  }

  // Puntos
  pts.forEach((d, i) => {
    const fill = atIsLatam(d.iso) ? SALA_LATAM_COLOR : SALA_OTHER_COLOR;
    const tip = `${atName(d.iso)} · percentil ${atFmtPct(d[key])} · US$ ${atFmtDaily(d.ppp)} por día`;
    s += `<circle cx="${xs[i].toFixed(1)}" cy="${(cy + ys[i]).toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="#FAF8F3" stroke-width="${big ? 1.5 : 1}"><title>${salaEsc(tip)}</title></circle>`;
  });

  // Eje
  s += `<line x1="${x(0)}" x2="${x(100)}" y1="${axisY}" y2="${axisY}" stroke="#8A8579" stroke-width="1.2"/>`;
  for (let k = 0; k <= 100; k += 10) {
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${axisY}" y2="${axisY + 5}" stroke="#8A8579" stroke-width="1.2"/>`;
    if (!big && k % 20 !== 0) continue;
    const anchor = k === 0 ? 'start' : k === 100 ? 'end' : 'middle';
    s += `<text x="${x(k)}" y="${axisY + fsTick + 6}" text-anchor="${anchor}" font-family='${SALA_SANS}' font-size="${fsTick}" fill="#4A4A4A">${k}</text>`;
  }
  s += `<text x="${x(0)}" y="${H - 6}" text-anchor="start" font-family='${SALA_SANS}' font-size="${fsAxis}" fill="#8A8579">← más pobre</text>`;
  s += `<text x="${x(100)}" y="${H - 6}" text-anchor="end" font-family='${SALA_SANS}' font-size="${fsAxis}" fill="#8A8579">más rico →</text>`;
  s += `<text x="${x(50)}" y="${H - 6}" text-anchor="middle" font-family='${SALA_SANS}' font-size="${fsAxis}" font-weight="600" fill="#4A4A4A">${salaEsc(opts.axisTitle)}</text>`;
  s += '</svg>';
  el.innerHTML = s;
}

// ---------------- Render ----------------

function salaPctShare(arr, pred) {
  if (!arr.length) return null;
  return 100 * arr.filter(pred).length / arr.length;
}

function salaRender() {
  const res = salaState.result;
  const main = document.getElementById('sala-main');
  const empty = document.getElementById('sala-empty');
  if (!res || !res.valid.length) {
    main.hidden = true;
    empty.hidden = false;
    if (res) empty.textContent = 'Todavía no hay respuestas válidas para mostrar.';
    return;
  }
  main.hidden = false;
  empty.hidden = true;

  const V = res.valid;
  const N = V.length;
  const withPc = V.filter(d => d.pc != null);
  const medPw = atMedian(V.map(d => d.pw));
  const medPc = atMedian(withPc.map(d => d.pc));
  const T = atMedian(V.map(d => d.ppp));

  // a) Titular
  document.getElementById('sala-insight').innerHTML = medPc != null
    ? `La mediana de esta sala está en el percentil <b>${atFmtPct(medPw)}</b> del mundo y en el percentil <b>${atFmtPct(medPc)}</b> de su país`
    : `La mediana de esta sala está en el percentil <b>${atFmtPct(medPw)}</b> del mundo`;
  const dropped = res.drop.invalid + res.drop.test;
  let nTxt = `${atFmt(N)} ${N === 1 ? 'respuesta' : 'respuestas'}`;
  if (dropped) {
    const parts = [];
    if (res.drop.invalid) parts.push(`${atFmt(res.drop.invalid)} ${res.drop.invalid === 1 ? 'inválida' : 'inválidas'}`);
    if (res.drop.test) parts.push(`${atFmt(res.drop.test)} de prueba`);
    nTxt += ` · ${atFmt(dropped)} ${dropped === 1 ? 'descartada' : 'descartadas'} (${parts.join(', ')})`;
  }
  document.getElementById('sala-n').textContent = nTxt;

  // Leyenda
  const nLat = V.filter(d => atIsLatam(d.iso)).length;
  const leg = [];
  if (nLat) leg.push(`<span><i style="background:${SALA_LATAM_COLOR}"></i>América Latina y el Caribe</span>`);
  if (N - nLat) leg.push(`<span><i style="background:${SALA_OTHER_COLOR}"></i>Otros países</span>`);
  document.getElementById('sala-legend-1').innerHTML = leg.join('');

  // b) y c) Gráficos
  salaDrawCharts();
  const missing = N - withPc.length;
  document.getElementById('sala-country-note').textContent = missing
    ? `${atFmt(missing)} ${missing === 1 ? 'respuesta no aparece' : 'respuestas no aparecen'} porque su país no tiene una encuesta de hogares reciente en la plataforma PIP del Banco Mundial.`
    : '';

  // d) Tarjetas
  const shW = salaPctShare(V, d => d.pw >= 90);
  const shC = salaPctShare(withPc, d => d.pc >= 80);
  const tiles = [];
  tiles.push(`<div class="sala-tile"><div class="sala-tile-val">${atFmt(shW)}<small>%</small></div><p class="sala-tile-lab">de la sala está en el 10% más rico del mundo</p></div>`);
  tiles.push(`<div class="sala-tile"><div class="sala-tile-val">${shC == null ? 's/d' : atFmt(shC) + '<small>%</small>'}</div><p class="sala-tile-lab">de la sala está en el 20% más rico de su país${missing && withPc.length ? ` (sobre ${atFmt(withPc.length)} respuestas con dato)` : ''}</p></div>`);
  tiles.push(`<div class="sala-tile"><div class="sala-tile-val"><small>US$</small> ${atFmtDaily(T)}</div><p class="sala-tile-lab">ingreso mediano por persona de la sala, por día (PPA, dólares de 2021)</p></div>`);
  document.getElementById('sala-tiles').innerHTML = tiles.join('');

  // e) La torta
  salaRenderTorta(T, V);

  // Fuentes
  document.getElementById('sala-sources').textContent =
    'Datos: Banco Mundial, Poverty and Inequality Platform (deciles de ingreso o consumo de la última encuesta de cada país, llevados a 2025) y World Development Indicators (PIB per cápita PPA 2024, dólares de 2021); FMI, World Economic Outlook abril 2026 (niveles de precios 2026). Cálculos de El Atlas a partir de las respuestas crudas.';
}

function salaDrawCharts() {
  const res = salaState.result;
  if (!res || !res.valid.length) return;
  const V = res.valid;
  salaSwarmChart(document.getElementById('sala-chart-world'), V, 'pw', {
    aria: 'Percentil mundial de cada respuesta',
    axisTitle: 'Percentil mundial'
  });
  salaSwarmChart(document.getElementById('sala-chart-country'), V, 'pc', {
    aria: 'Percentil de cada respuesta en su país',
    axisTitle: 'Percentil en su país'
  });
}

function salaRenderTorta(T, V) {
  const M = AUTOTEST_META;
  const gL = M.gini_latam, gN = M.gini_nordic;
  const cur = M.gdppc_latam_2024;
  const scen = [
    { q: 0.5, label: 'Para que la mitad de la población viva como la mediana de esta sala' },
    { q: 0.1, label: 'Para que 9 de cada 10 personas vivan como la mediana de esta sala (o mejor)' }
  ];
  const cols = [
    { G: gL, color: SALA_LATAM_COLOR, head: `Con la desigualdad de América Latina (Gini ${atFmt(gL, 1)})` },
    { G: gN, color: SALA_NORDIC_COLOR, head: `Con la desigualdad de los países nórdicos (Gini ${atFmt(gN)})` }
  ];
  const vals = scen.map(sc => cols.map(c => requiredGDPpc(T, c.G, sc.q)));
  const maxV = Math.max(cur, ...vals.flat()) * 1.04;
  const round = v => v >= 100000 ? Math.round(v / 1000) * 1000 : Math.round(v / 100) * 100;

  // Referencia empírica: el país más frecuente de la sala
  const counts = {};
  V.forEach(d => { counts[d.iso] = (counts[d.iso] || 0) + 1; });
  const modal = Object.keys(counts).filter(atHasDist).sort((a, b) => counts[b] - counts[a])[0];
  let modalTxt = '';
  if (modal) {
    const mm = medianIncome(modal);
    modalTxt = ` Es ${atFmt(T / mm, 1)} veces el ingreso del hogar mediano de ${salaEsc(atName(modal))} (US$ ${atFmtDaily(mm)} por día).`;
  }

  let g = '<div class="torta-grid">';
  g += '<div class="torta-corner"></div>';
  cols.forEach(c => { g += `<div class="torta-colhead"><span class="sw" style="background:${c.color}"></span><span>${salaEsc(c.head)}</span></div>`; });
  scen.forEach((sc, i) => {
    g += `<div class="torta-rowhead">${salaEsc(sc.label)}</div>`;
    cols.forEach((c, j) => {
      const v = vals[i][j];
      g += `<div class="torta-cell">
        <div class="tlabel">${salaEsc(c.head)}</div>
        <div class="tv">US$ ${atFmt(round(v))}</div>
        <div class="tm"><b>×${atFmt(v / cur, 1)}</b> el PIB per cápita actual de América Latina</div>
        <div class="torta-bar"><div class="f" style="width:${(100 * v / maxV).toFixed(2)}%;background:${c.color}"></div><div class="k" style="left:${(100 * cur / maxV).toFixed(2)}%"></div></div>
      </div>`;
    });
  });
  g += '</div>';

  const refs = SALA_REF_ISOS.filter(k => AUTOTEST_GDPPC[k]).map(k => `${salaEsc(atName(k))} US$ ${atFmt(AUTOTEST_GDPPC[k])}`).join(' · ');

  // Países cuyo hogar mediano ya vive como la mediana de la sala
  const all = Object.keys(AUTOTEST_COUNTRIES).filter(atHasDist);
  const rich = all.map(k => ({ k, m: medianIncome(k) })).filter(o => o.m >= T).sort((a, b) => b.m - a.m);
  const MAXC = 24;
  let chips;
  if (rich.length) {
    chips = '<div class="torta-chips">' + rich.slice(0, MAXC).map(o =>
      `<span class="torta-chip">${salaEsc(atName(o.k))}<span>US$ ${atFmtDaily(o.m)}</span></span>`).join('') +
      (rich.length > MAXC ? `<span class="torta-chip">y ${atFmt(rich.length - MAXC)} más</span>` : '') + '</div>';
  } else {
    chips = `<p class="torta-none">Ninguno. En los ${atFmt(all.length)} países con encuesta, el hogar mediano vive con menos que la mediana de esta sala.</p>`;
  }

  document.getElementById('sala-torta').innerHTML =
    `<h2>¿Cuánta torta hace falta?</h2>
     <p class="torta-lede">La mediana de esta sala vive con <b>US$ ${atFmtDaily(T)} por persona por día</b> (PPA, dólares de 2021).${modalTxt} ¿Qué PIB per cápita necesitaría un país para que su población viva así?</p>
     ${g}
     <p class="torta-key"><i></i>PIB per cápita actual de América Latina</p>
     <p class="torta-ref">PIB per cápita actual de América Latina: <b>US$ ${atFmt(cur)}</b> (PPA, dólares de 2021, 2024). Como referencia: ${refs}.</p>
     <div class="torta-countries">
       <h3>Países donde el hogar mediano vive como la mediana de esta sala</h3>
       <p class="sala-sub">Ingreso por persona por día del hogar mediano de cada país (PPA, dólares de 2021). ${rich.length ? `${atFmt(rich.length)} de ${atFmt(all.length)} países con encuesta.` : ''}</p>
       ${chips}
     </div>
     <p class="torta-method">Supuestos de la torta: el ingreso se distribuye como una lognormal con el Gini indicado, y lo que miden las encuestas de hogares equivale al ${atFmt(M.survey_to_gdp * 100)}% del PIB per cápita. El hogar mediano de cada país sale de sus deciles en la plataforma PIP.</p>`;
}

// ---------------- Carga ----------------

function salaSetStatus(html) {
  document.getElementById('sala-status').innerHTML = html;
  const btn = document.getElementById('sala-refresh');
  if (btn) btn.addEventListener('click', salaFetchCsv);
}

function salaStatusLine(extra) {
  const res = salaState.result;
  const parts = [];
  if (salaState.source) parts.push(`Fuente: ${salaEsc(salaState.source)}`);
  if (res) parts.push(`${atFmt(res.valid.length)} válidas, ${atFmt(res.drop.invalid + res.drop.test)} descartadas`);
  const now = new Date();
  parts.push(`leído a las ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })}`);
  let html = `<span>${parts.join(' · ')}</span>`;
  if (salaState.csvUrl) html += '<button type="button" class="sala-btn ghost" id="sala-refresh">Actualizar</button>';
  if (extra) html += extra;
  return html;
}

function salaLoadRows(rows, source, collapse) {
  salaState.rows = rows;
  salaState.source = source;
  salaState.result = salaProcess(rows);
  salaSetStatus(salaStatusLine());
  if (collapse && salaState.result.valid.length) document.getElementById('sala-load').open = false;
  salaRender();
}

function salaLoadText(text, source) {
  const { rows, error } = salaRowsFromText(text);
  if (error) {
    salaSetStatus(`<span class="err">${salaEsc(error)}</span>`);
    return;
  }
  salaLoadRows(rows, source, true);
}

function salaFetchCsv() {
  const url = salaState.csvUrl;
  if (!url) return;
  salaSetStatus('<span>Leyendo la hoja…</span>');
  fetch(url, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => salaLoadText(text, 'hoja publicada'))
    .catch(err => {
      salaSetStatus(`<span class="err">No se pudo leer el CSV (${salaEsc(err.message || err)}). Si la hoja no está publicada, descargala como CSV y arrastrala acá.</span>` +
        '<button type="button" class="sala-btn ghost" id="sala-refresh">Actualizar</button>');
    });
}

function salaReadFile(file) {
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => salaLoadText(fr.result, file.name);
  fr.onerror = () => salaSetStatus('<span class="err">No se pudo leer el archivo.</span>');
  fr.readAsText(file, 'utf-8');
}

function salaInit() {
  const drop = document.getElementById('sala-drop');
  const file = document.getElementById('sala-file');
  file.addEventListener('change', () => { salaReadFile(file.files[0]); file.value = ''; });
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, ev => { ev.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'dragend'].forEach(t => drop.addEventListener(t, () => drop.classList.remove('drag')));
  drop.addEventListener('drop', ev => {
    ev.preventDefault();
    drop.classList.remove('drag');
    const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    salaReadFile(f);
  });
  // Que un archivo soltado fuera de la zona no navegue fuera de la página
  window.addEventListener('dragover', ev => ev.preventDefault());
  window.addEventListener('drop', ev => ev.preventDefault());

  document.getElementById('sala-text-go').addEventListener('click', () => {
    const txt = document.getElementById('sala-text').value;
    if (!txt.trim()) { salaSetStatus('<span class="err">Pegá primero las filas de la hoja.</span>'); return; }
    salaLoadText(txt, 'filas pegadas');
  });

  if (salaParams.get('demo') === '1') {
    document.getElementById('sala-demo').hidden = false;
    salaLoadRows(salaDemoRows(), 'datos de prueba', true);
  } else if (salaState.csvUrl) {
    salaFetchCsv();
  }

  let lastW = window.innerWidth;
  let tmr = null;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(tmr);
    tmr = setTimeout(salaDrawCharts, 120);
  });
}

salaInit();
