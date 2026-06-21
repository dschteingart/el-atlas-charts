// =============================================================
//  ranking.js — chart 4 del N°2 "Demasiado desiguales"
// =============================================================
//
// Compara, para un DECIL (o promedio de varios deciles), el ranking de países.
// Tres vistas (toggle): Barras, Mapa, Líneas.
//
//   - Barras: un año, ranking de una selección de países (máx+mín dinámicos +
//     LatAm clave + potencias). Todas las barras del mismo color.
//   - Mapa: coroplético; modo clásico o benchmark (diverging vs un país); zoom
//     por continente.  [Bloque D — pendiente]
//   - Líneas: evolución en el tiempo, una línea por país, eje Y US$ PPA con
//     toggle lineal/log, slider temporal inicio–fin.  [Bloque C — pendiente]
//
// Controles compartidos: deciles (multi-select, promedia), unidad (día/mes/año),
// y año (slider) en Barras/Mapa.
//
// Dato: DATA_DECILES.data_by_year[año].countries[iso].deciles[] con
// income_daily_ppp (US$ PPA/día) por decil. Promedio de deciles = media simple
// (cada decil es 10% de la población → es el ingreso medio de ese grupo).
//
// Depende de: DATA_DECILES, COUNTRY_NAMES, REGION_WB_COLORS, LANG, t, state[4].

// =================== Constantes ===================
const RK_W_DESKTOP = 1100, RK_H_DESKTOP = 560;
const RK_W_MOBILE = 1100, RK_H_MOBILE = 1080;
const RK_MARGIN_DESKTOP = { top: 28, right: 40, bottom: 48, left: 60 };
const RK_MARGIN_MOBILE = { top: 56, right: 40, bottom: 120, left: 80 };
function rk_getMargins(format) {
  switch (format) {
    case 'public': return { top: 40, right: 44, bottom: 90, left: 74 };
    case 'newsletter': return { top: 44, right: 48, bottom: 96, left: 96 };
    case 'square': return { top: 44, right: 48, bottom: 74, left: 96 };
    case 'mobile': return { top: 56, right: 44, bottom: 120, left: 96 };
    default: return { ...RK_MARGIN_DESKTOP };
  }
}
let RK_W = RK_W_DESKTOP, RK_H = RK_H_DESKTOP, RK_MARGIN = { ...RK_MARGIN_DESKTOP };

const RK_NS = 'http://www.w3.org/2000/svg';
const rk_el = (t) => document.createElementNS(RK_NS, t);

const RK_BAR_COL = '#BE5D32';     // terracota Atlas — todas las barras igual
// Selección manual por default de Barras/Líneas: LatAm clave + grandes potencias.
// En Barras se le suman el país máx y mín dinámicos del año/deciles elegidos.
const RK_DEFAULT_COUNTRIES = ['ARG', 'BRA', 'MEX', 'CHL', 'USA', 'DEU', 'CHN', 'JPN'];
const RK_PALETTE = ['#2B5C8A', '#5BA152', '#9A4FA8', '#2BA0A8', '#C9A227', '#1B3956', '#386433', '#5F3168', '#1B6368', '#7D6418', '#C0473A', '#772C24'];

// =================== Helpers de datos ===================
let rk_years_cache = null;
function rk_years() {
  if (!rk_years_cache) rk_years_cache = Object.keys(DATA_DECILES.data_by_year).map(Number).sort((a, b) => a - b);
  return rk_years_cache;
}
function rk_yearMin() { return rk_years()[0]; }
function rk_yearMax() { return rk_years()[rk_years().length - 1]; }
function rk_country(iso, year) { const y = DATA_DECILES.data_by_year[String(year)]; return y && y.countries[iso]; }
function rk_allIsos(year) { const y = DATA_DECILES.data_by_year[String(year)]; return y ? Object.keys(y.countries) : []; }
function rk_unitMult(unit) { return unit === 'year' ? 365 : unit === 'month' ? (365 / 12) : 1; }

// Ingreso promedio (en la unidad elegida) de los deciles seleccionados de un país.
function rk_value(iso, year, deciles, unit) {
  const c = rk_country(iso, year); if (!c) return null;
  const sel = c.deciles.filter(d => deciles.indexOf(d.decile) >= 0);
  if (!sel.length) return null;
  const daily = sel.reduce((s, d) => s + d.income_daily_ppp, 0) / sel.length;
  return daily * rk_unitMult(unit);
}

function rk_name(iso) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  const nm = (typeof COUNTRY_NAMES !== 'undefined') && COUNTRY_NAMES[iso];
  if (nm) return (lang === 'en' ? (nm.en || nm.es) : (nm.es || nm.en));
  const c = rk_country(iso, state[4].year) || rk_country(iso, rk_yearMax());
  return (c && c.name) || iso;
}
function rk_region(iso) { const c = rk_country(iso, state[4].year) || rk_country(iso, rk_yearMax()); return c ? c.region : ''; }

const rk_tt = (k, fb) => ((typeof t === 'function' ? t(k) : '') || fb);
function rk_isMobile() { return (typeof isMobileViewport === 'function') ? isMobileViewport() : false; }
function rk_measure(text, size, weight) {
  if (!rk_measure._c) rk_measure._c = document.createElement('canvas').getContext('2d');
  rk_measure._c.font = `${weight || 400} ${size}px "Source Sans 3", system-ui, sans-serif`;
  return rk_measure._c.measureText(text).width;
}
// Tooltip junto al cursor; si no entra a la derecha o está en el tercio derecho,
// se reubica a la izquierda (norma general del Atlas).
function rk_placeTip(tt, ev, svg) {
  const rc = svg.getBoundingClientRect();
  const x = ev.clientX - rc.left, y = ev.clientY - rc.top, tw = tt.offsetWidth || 170;
  const left = (x + 16 + tw > rc.width || x > rc.width * 0.72) ? Math.max(2, x - tw - 16) : (x + 14);
  tt.style.left = left + 'px'; tt.style.top = (y + 14) + 'px';
}

// Formato de moneda PPA según unidad. Día: 1 decimal si <100. Mes/año: enteros con
// separador de miles. ES usa punto de miles / EN coma.
function rk_fmt(v, unit) {
  if (v == null) return '—';
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  let s;
  if (unit === 'day') s = (v < 100 ? v.toFixed(1) : Math.round(v).toString());
  else s = Math.round(v).toString();
  // separador de miles
  s = s.replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
  return '$' + s;
}
function rk_unitSuffix() {
  const u = state[4].unit, en = (typeof LANG !== 'undefined' && LANG === 'en');
  if (u === 'day') return en ? '/day' : '/día';
  if (u === 'month') return en ? '/mo.' : '/mes';
  return en ? '/yr' : '/año';
}

// =================== Estado de accesores ===================
function rk_view() { return (state[4] && state[4].view) || 'bars'; }
function rk_deciles() { const d = state[4] && state[4].deciles; return (d && d.length) ? d.slice().sort((a, b) => a - b) : [1]; }
function rk_unit() { return (state[4] && state[4].unit) || 'day'; }

// Frase de los deciles elegidos para los subtítulos, CON artículo ("del decil 1",
// "de los deciles 1–2", "de todos los deciles" / EN "of decile 1"...).
function rk_decilePhrase() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), d = rk_deciles();
  if (d.length === 10) return en ? 'of all deciles (full population)' : 'de todos los deciles (población total)';
  const contiguous = d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  const word = en ? (d.length === 1 ? 'decile' : 'deciles') : (d.length === 1 ? 'decil' : 'deciles');
  const body = (contiguous && d.length > 1) ? `${word} ${d[0]}–${d[d.length - 1]}` : `${word} ${d.join(', ')}`;
  if (en) return 'of ' + body;
  return (d.length === 1 ? 'del ' : 'de los ') + body;
}

// =================== Render principal ===================
function drawRanking() {
  const svg = document.getElementById('chart4'); if (!svg) return;
  svg.innerHTML = '';
  const tt = document.getElementById('tooltip4'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }

  // visibilidad de controles por vista
  const view = rk_view();
  const sng = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };
  sng('rk-year-block', view !== 'lines');          // año: barras y mapa
  sng('rk-search-wrap', view !== 'map');           // buscador de países: barras y líneas
  sng('rk-selected-chips', view !== 'map');
  sng('rk-scale-group', view === 'lines');         // escala lin/log: solo líneas
  sng('rk-range-block', view === 'lines');         // slider temporal: solo líneas
  sng('rk-bench-group', view === 'map');           // benchmark: solo mapa
  sng('rk-continent-group', view === 'map');       // zoom continente: solo mapa

  // dimensiones según formato del editor / viewport
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && rk_isMobile();
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; RK_W = f.vbW; RK_H = f.vbH; RK_MARGIN = rk_getMargins(editorFormat); }
  else if (mobile) { RK_W = RK_W_MOBILE; RK_H = RK_H_MOBILE; RK_MARGIN = { ...RK_MARGIN_MOBILE }; }
  else { RK_W = RK_W_DESKTOP; RK_H = RK_H_DESKTOP; RK_MARGIN = { ...RK_MARGIN_DESKTOP }; }
  svg.setAttribute('viewBox', `0 0 ${RK_W} ${RK_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const bigFmt = !!editorFormat || mobile;
  const isPngFormat = !!editorFormat;

  const ctx = { bigFmt, isPngFormat, mobile };
  if (view === 'bars') rk_drawBars(svg, ctx);
  else if (view === 'lines') rk_drawComing(svg, ctx, 'Líneas');
  else if (view === 'map') rk_drawComing(svg, ctx, 'Mapa');

  rk_applyHeadings();
  rk_renderDecileButtons();
}

// Placeholder temporal para vistas aún no construidas (líneas / mapa).
function rk_drawComing(svg, ctx, label) {
  const m = rk_el('text'); m.setAttribute('x', RK_W / 2); m.setAttribute('y', RK_H / 2); m.setAttribute('text-anchor', 'middle');
  m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (ctx.bigFmt ? 22 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)');
  m.textContent = label + ' — próximamente'; svg.appendChild(m);
}

// =================== Vista BARRAS ===================
// Países mostrados = máx + mín dinámicos (del año/deciles) + selección manual.
function rk_barRows() {
  const year = state[4].year, dec = rk_deciles(), unit = rk_unit();
  const vals = {};
  rk_allIsos(year).forEach(iso => { const v = rk_value(iso, year, dec, unit); if (v != null) vals[iso] = v; });
  const isos = Object.keys(vals);
  if (!isos.length) return [];
  let maxIso = isos[0], minIso = isos[0];
  isos.forEach(iso => { if (vals[iso] > vals[maxIso]) maxIso = iso; if (vals[iso] < vals[minIso]) minIso = iso; });
  const set = new Set([maxIso, minIso].concat(state[4].selectedCountries || []));
  const rows = Array.from(set).filter(iso => vals[iso] != null).map(iso => ({ iso, v: vals[iso] }));
  rows.sort((a, b) => b.v - a.v);
  return rows;
}
function rk_drawBars(svg, ctx) {
  const { bigFmt } = ctx;
  const rows = rk_barRows();
  const unit = rk_unit();
  if (!rows.length) {
    const m = rk_el('text'); m.setAttribute('x', RK_W / 2); m.setAttribute('y', RK_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (bigFmt ? 22 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = rk_tt('c4-empty', 'Sin datos para este año.'); svg.appendChild(m); return;
  }
  const fs = bigFmt ? 22 : 13;
  const top = RK_MARGIN.top + (bigFmt ? 8 : 4), bottom = bigFmt ? 16 : 10;
  let nameW = 0; rows.forEach(r => { const w = rk_measure(rk_name(r.iso), fs, 600); if (w > nameW) nameW = w; });
  const valW = rk_measure(rk_fmt(rows[0].v, unit) + '0', fs, 700);
  const left = (bigFmt ? 16 : 10) + nameW + (bigFmt ? 14 : 9);
  const right = valW + (bigFmt ? 20 : 12);
  const plotW = Math.max(40, RK_W - left - right);
  const availH = RK_H - top - bottom;
  const rowH = Math.min(availH / rows.length, bigFmt ? 76 : 46);
  const barH = rowH * 0.6;
  const maxV = rows[0].v, minV = rows[rows.length - 1].v;
  // baseline en 0 para barras de ingreso (la magnitud importa, no solo el ranking)
  const xW = (v) => Math.max(0, (v / (maxV * 1.005)) * plotW);
  const yBase = (y) => y + fs * 0.34;
  rows.forEach((r, i) => {
    const cy = top + i * rowH, midY = cy + rowH / 2, bw = xW(r.v);
    const nm = rk_el('text'); nm.setAttribute('x', left - (bigFmt ? 10 : 7)); nm.setAttribute('y', yBase(midY)); nm.setAttribute('text-anchor', 'end'); nm.style.fontSize = fs + 'px'; nm.style.fontFamily = 'var(--sans)'; nm.style.fontWeight = '600'; nm.setAttribute('fill', 'var(--ink)'); nm.textContent = rk_name(r.iso); svg.appendChild(nm);
    const bar = rk_el('rect'); bar.setAttribute('x', left); bar.setAttribute('y', midY - barH / 2); bar.setAttribute('width', bw); bar.setAttribute('height', barH); bar.setAttribute('rx', bigFmt ? 3 : 2); bar.setAttribute('fill', RK_BAR_COL); svg.appendChild(bar);
    const vt = rk_el('text'); vt.setAttribute('x', left + bw + (bigFmt ? 9 : 6)); vt.setAttribute('y', yBase(midY)); vt.style.fontSize = fs + 'px'; vt.style.fontFamily = 'var(--sans)'; vt.style.fontWeight = '700'; vt.setAttribute('fill', 'var(--ink)'); vt.style.fontVariantNumeric = 'tabular-nums'; vt.textContent = rk_fmt(r.v, unit); svg.appendChild(vt);
  });
  const disp = document.getElementById('rk-year-display'); if (disp) disp.textContent = state[4].year;
}

// =================== Títulos dinámicos ===================
function rk_title() {
  return rk_tt('c4-title', 'El ingreso por decil, país por país');
}
function rk_subtitle() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const dec = rk_decilePhrase(), sfx = rk_unitSuffix();
  if (rk_view() === 'lines') {
    const p = (state[4].period) || [rk_yearMin(), rk_yearMax()];
    return en ? `Average income ${dec}, PPP US$${sfx}, ${p[0]}–${p[1]}.` : `Ingreso promedio ${dec}, US$ PPA${sfx}, ${p[0]}–${p[1]}.`;
  }
  return en ? `Average income ${dec}, PPP US$${sfx}, by country in ${state[4].year}.` : `Ingreso promedio ${dec}, US$ PPA${sfx}, por país en ${state[4].year}.`;
}
function rk_applyHeadings() {
  const block = document.querySelector('.chart-block[data-chart="4"]') || document;
  const tEl = block.querySelector('.chart-title'); if (tEl) tEl.textContent = rk_title();
  const sEl = block.querySelector('.chart-subtitle'); if (sEl) sEl.textContent = rk_subtitle();
}

// =================== Controles: deciles, unidad, vista, año, buscador ===================
function rk_renderDecileButtons() {
  const host = document.getElementById('rk-decile-btns'); if (!host) return;
  const sel = rk_deciles();
  host.querySelectorAll('button[data-decile]').forEach(b => {
    const on = sel.indexOf(+b.dataset.decile) >= 0;
    b.classList.toggle('rk-dec-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function rk_toggleDecile(d) {
  let arr = (state[4].deciles || []).slice();
  const i = arr.indexOf(d);
  if (i >= 0) { if (arr.length > 1) arr.splice(i, 1); }   // no permitir quedar sin ningún decil
  else arr.push(d);
  state[4].deciles = arr.sort((a, b) => a - b);
  rk_renderDecileButtons(); drawRanking();
}

function rk_norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function rk_renderChips() {
  const c = document.getElementById('rk-selected-chips'); if (!c) return;
  c.innerHTML = '';
  (state[4].selectedCountries || []).forEach((iso, i) => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = (rk_view() === 'lines') ? RK_PALETTE[i % RK_PALETTE.length] : RK_BAR_COL;
    chip.style.color = '#fff'; chip.textContent = rk_name(iso);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => { state[4].selectedCountries = state[4].selectedCountries.filter(c2 => c2 !== iso); rk_renderChips(); drawRanking(); });
    chip.appendChild(x); c.appendChild(chip);
  });
}
function rk_toggleCountry(iso) {
  const arr = state[4].selectedCountries || [];
  if (arr.indexOf(iso) >= 0) state[4].selectedCountries = arr.filter(c => c !== iso);
  else state[4].selectedCountries = arr.concat([iso]);
  rk_renderChips(); drawRanking();
}
function rk_setupSearch() {
  const input = document.getElementById('rk-search'), results = document.getElementById('rk-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  const all = () => rk_allIsos(rk_yearMax()).map(iso => ({ iso, name: rk_name(iso), region: rk_region(iso) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const get = (q) => { if (!q) return []; const qn = rk_norm(q); return all().filter(c => rk_norm(c.name).includes(qn)).slice(0, 8); };
  const render = (a) => {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${(state[4].selectedCountries || []).indexOf(c.iso) >= 0 ? ' m-already' : ''}" data-iso="${c.iso}"><span>${c.name}</span></div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { rk_toggleCountry(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  };
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); rk_toggleCountry(matches[active].iso); input.value = ''; results.classList.remove('open'); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => { if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open'); });
}
function rk_setupToggles() {
  // Vista
  document.querySelectorAll('[data-rk-view]').forEach(b => b.addEventListener('click', () => {
    state[4].view = b.dataset.rkView;
    document.querySelectorAll('[data-rk-view]').forEach(x => x.classList.toggle('active', x === b));
    rk_renderChips(); drawRanking();
  }));
  // Unidad
  document.querySelectorAll('[data-rk-unit]').forEach(b => b.addEventListener('click', () => {
    state[4].unit = b.dataset.rkUnit;
    document.querySelectorAll('[data-rk-unit]').forEach(x => x.classList.toggle('active', x === b));
    drawRanking();
  }));
  // Escala (líneas)
  document.querySelectorAll('[data-rk-scale]').forEach(b => b.addEventListener('click', () => {
    state[4].yScale = b.dataset.rkScale;
    document.querySelectorAll('[data-rk-scale]').forEach(x => x.classList.toggle('active', x === b));
    drawRanking();
  }));
  // Deciles
  const decHost = document.getElementById('rk-decile-btns');
  if (decHost) decHost.querySelectorAll('button[data-decile]').forEach(b => b.addEventListener('click', () => rk_toggleDecile(+b.dataset.decile)));
  // Año (slider simple)
  const yr = document.getElementById('rk-year'); const disp = document.getElementById('rk-year-display');
  if (yr) { yr.min = rk_yearMin(); yr.max = rk_yearMax(); yr.value = state[4].year; yr.addEventListener('input', () => { state[4].year = +yr.value; if (disp) disp.textContent = yr.value; drawRanking(); }); }
}

// =================== Init + PNG ===================
function initRanking() {
  if (!state[4]) state[4] = {};
  const s = state[4];
  if (!s.view) s.view = 'bars';
  if (!s.deciles) s.deciles = [1];
  if (!s.unit) s.unit = 'day';
  if (!s.yScale) s.yScale = 'log';
  if (s.year == null) s.year = rk_yearMax();
  if (!s.selectedCountries) s.selectedCountries = RK_DEFAULT_COUNTRIES.slice();
  if (!s.period) s.period = [rk_yearMin(), rk_yearMax()];
  if (!s.benchmark) s.benchmark = 'USA';
  if (!s.continent) s.continent = 'all';

  rk_setupToggles();
  rk_setupSearch();
  rk_renderChips();
  rk_renderDecileButtons();
  drawRanking();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initRanking._wired) { initRanking._wired = true; window.addEventListener('atlas-editor-change', () => drawRanking()); }

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawRanking;
  window.onBeforePngExportGetSubtitle = function (id) { return (String(id) === '4') ? rk_subtitle() : null; };
}
