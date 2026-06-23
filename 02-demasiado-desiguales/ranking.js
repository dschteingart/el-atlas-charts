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
// Flag que prende png-export para re-renderizar el mapa al aspecto del continente al
// exportar (la versión interactiva queda apaisada sin scroll; el PNG toma el aspecto).
let rk_pngExporting = false;

const RK_NS = 'http://www.w3.org/2000/svg';
const rk_el = (t) => document.createElementNS(RK_NS, t);

const RK_BAR_COL = '#BE5D32';     // terracota Atlas — todas las barras igual
// Selección manual por default de Barras/Líneas: LatAm clave + grandes potencias.
// En Barras se le suman el país máx y mín dinámicos del año/deciles elegidos.
const RK_DEFAULT_COUNTRIES = ['ARG', 'BRA', 'MEX', 'CHL', 'USA', 'DEU', 'CHN', 'JPN'];
// Líneas arrancan con pocas (la vista temporal se satura con muchas): 4 países
// con buen contraste de la historia (dos LatAm + EE.UU. + Noruega como techo).
const RK_LINES_DEFAULT = ['ARG', 'BRA', 'USA', 'NOR'];
// Misma paleta que el chart 3 (deciles): 12 hues distintos, la primera repetición
// recién con 13+ países.
const RK_PALETTE = ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F', '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'];

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
// Formato para ticks del eje Y: sin decimales si es entero ($10, no $10.0);
// con decimal solo para valores < 1 ($0.1, $0.5).
function rk_fmtTick(v) {
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  if (Math.abs(v - Math.round(v)) < 1e-9) return '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
  return '$' + (v < 1 ? String(v) : v.toFixed(1));
}
function rk_unitSuffix() {
  const u = state[4].unit, en = (typeof LANG !== 'undefined' && LANG === 'en');
  if (u === 'day') return en ? '/day' : '/día';
  if (u === 'month') return en ? '/mo.' : '/mes';
  return en ? '/yr' : '/año';
}

// =================== Estado de accesores ===================
function rk_view() { return (state[4] && state[4].view) || 'bars'; }
// Barras/Mapa comparten la selección (selectedCountries); Líneas tiene la suya
// (linesCountries), que arranca con pocas. El buscador/chips operan sobre la activa.
function rk_listKey() { return rk_view() === 'lines' ? 'linesCountries' : 'selectedCountries'; }
function rk_sel() { return state[4][rk_listKey()] || []; }
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
// Etiqueta del decil para ENCABEZAR el subtítulo (sin artículo previo). Evocativa en los
// extremos (10% más pobre/rico), por N° en los medios, y "promedio de los deciles X a Y"
// cuando hay varios. Se capitaliza al usarla.
function rk_decileLabel() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en'), d = rk_deciles();
  if (d.length === 10) return en ? 'the whole population' : 'toda la población';
  if (d.length === 1) {
    if (d[0] === 1) return en ? 'the poorest 10%' : 'el 10% más pobre';
    if (d[0] === 10) return en ? 'the richest 10%' : 'el 10% más rico';
    return en ? ('decile ' + d[0]) : ('el decil ' + d[0]);
  }
  const contiguous = d.every((v, i) => i === 0 || v === d[i - 1] + 1);
  const list = contiguous ? (en ? (d[0] + '–' + d[d.length - 1]) : (d[0] + ' a ' + d[d.length - 1])) : d.join(', ');
  return en ? ('average of deciles ' + list) : ('promedio de los deciles ' + list);
}
function rk_cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
// Unidad como palabra suelta ("día"/"mes"/"año") para "en US$ PPA por día".
function rk_unitWord() {
  const u = state[4].unit, en = (typeof LANG !== 'undefined' && LANG === 'en');
  if (u === 'month') return en ? 'month' : 'mes';
  if (u === 'year') return en ? 'year' : 'año';
  return en ? 'day' : 'día';
}
// Nombre del continente activo para el subtítulo (vacío si es Mundo).
function rk_continentName() {
  const c = state[4].continent;
  if (!c || c === 'all') return '';
  return rk_tt('c4-cont-' + c, '');
}

// =================== Render principal ===================
function drawRanking() {
  const svg = document.getElementById('chart4'); if (!svg) return;
  svg.innerHTML = '';
  const tt = document.getElementById('tooltip4'); if (tt) { tt.style.opacity = '0'; tt.style.display = 'none'; }

  // visibilidad de controles por vista
  const view = rk_view();
  const isMap = view === 'map';
  const sng = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; };
  sng('rk-year-block', view !== 'lines');                  // año: barras y mapa
  sng('rk-search-wrap', true);                             // buscador: siempre (barras/líneas: agregar países; mapa: elegir país a comparar)
  sng('rk-selected-chips', !isMap);                        // chips: barras y líneas (en mapa el país comparado va en su propio control)
  sng('rk-map-hint', isMap);                               // hint del mapa: cómo elegir el país a comparar
  sng('rk-scale-group', view === 'lines');                 // escala lin/log: solo líneas
  sng('rk-range-block', view === 'lines');                 // slider temporal: solo líneas
  sng('rk-compare-group', isMap);                          // "Comparar con": solo mapa
  sng('rk-continent-group', isMap);                        // zoom continente: solo mapa
  sng('rk-labels-group', isMap);                           // toggle de etiquetas de valor: solo mapa
  if (isMap) rk_renderCompare();                           // chip Ninguno / país de comparación
  const sInput = document.getElementById('rk-search');     // placeholder según contexto
  if (sInput) sInput.placeholder = isMap ? rk_tt('c4-compare-placeholder', 'Comparar con un país…') : rk_tt('c4-search-placeholder', 'Agregar país…');

  // dimensiones según formato del editor / viewport
  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const mobile = !editorFormat && rk_isMobile();
  // ¿Estamos renderizando para el PNG? = formato del editor activo, O el flag que prende
  // png-export para re-renderizar el mapa al aspecto del continente al exportar (sin un
  // formato elegido). Eso permite que el INTERACTIVO quede apaisado (sin scroll) y el PNG
  // tome igual el aspecto del continente bien encuadrado.
  const exporting = !!editorFormat || rk_pngExporting;
  if (editorFormat) { const f = PNG_FORMATS[editorFormat]; RK_W = f.vbW; RK_H = f.vbH; RK_MARGIN = rk_getMargins(editorFormat); }
  else if (mobile) { RK_W = RK_W_MOBILE; RK_H = RK_H_MOBILE; RK_MARGIN = { ...RK_MARGIN_MOBILE }; }
  else { RK_W = RK_W_DESKTOP; RK_H = RK_H_DESKTOP; RK_MARGIN = { ...RK_MARGIN_DESKTOP }; }
  // El mapa toma su ASPECTO del continente (Europa cuadrado; Asia/Oceanía/mundo apaisado;
  // África/América vertical) SOLO al exportar. La versión interactiva se queda apaisada y
  // baja (RK_H=480) para que NO haya scroll en ninguna región.
  if (view === 'map') {
    if (exporting) {
      const cv = RK_CONT_VIEW[state[4].continent] || RK_CONT_VIEW.all;
      RK_W = cv.vbW; RK_H = cv.vbH;
    } else if (!mobile) {
      RK_H = 480;
    }
  }
  svg.setAttribute('viewBox', `0 0 ${RK_W} ${RK_H}`);
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);
  const bigFmt = !!editorFormat || mobile || rk_pngExporting;
  const isPngFormat = !!editorFormat || rk_pngExporting;

  const ctx = { bigFmt, isPngFormat, mobile };
  if (view === 'bars') rk_drawBars(svg, ctx);
  else if (view === 'lines') rk_drawLines(svg, ctx);
  else if (view === 'map') rk_drawMap(svg, ctx);

  rk_applyHeadings();
  rk_renderDecileButtons();
  rk_renderChips();   // máx/mín dinámicos → los chips se actualizan con año/deciles/unidad
}

// Placeholder temporal para vistas aún no construidas (líneas / mapa).
function rk_drawComing(svg, ctx, label) {
  const m = rk_el('text'); m.setAttribute('x', RK_W / 2); m.setAttribute('y', RK_H / 2); m.setAttribute('text-anchor', 'middle');
  m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (ctx.bigFmt ? 22 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)');
  m.textContent = label + ' — próximamente'; svg.appendChild(m);
}

// =================== Vista BARRAS ===================
// Barras y chips espejados: ambos = selección manual ∪ {máx, mín}. El máx y el
// mín se recalculan en cada cambio de año/deciles/unidad (chips automáticos, sin
// ×); la selección manual queda fija y removible.
function rk_extremes(year, dec, unit) {
  const vals = {};
  rk_allIsos(year).forEach(iso => { const v = rk_value(iso, year, dec, unit); if (v != null) vals[iso] = v; });
  const isos = Object.keys(vals); if (!isos.length) return null;
  let mx = isos[0], mn = isos[0];
  isos.forEach(iso => { if (vals[iso] > vals[mx]) mx = iso; if (vals[iso] < vals[mn]) mn = iso; });
  return { max: mx, min: mn };
}
function rk_excluded(iso) { return !!(state[4].excluded && state[4].excluded.has(iso)); }
function rk_barRows() {
  const year = state[4].year, dec = rk_deciles(), unit = rk_unit();
  const set = new Set((state[4].selectedCountries || []).filter(iso => !rk_excluded(iso)));
  const ext = rk_extremes(year, dec, unit);
  if (ext) { if (!rk_excluded(ext.max)) set.add(ext.max); if (!rk_excluded(ext.min)) set.add(ext.min); }   // máx/mín dinámicos, salvo los sacados
  const rows = [];
  set.forEach(iso => { const v = rk_value(iso, year, dec, unit); if (v != null) rows.push({ iso, v }); });
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

// =================== Vista LÍNEAS ===================
// Una línea por país de la selección manual (sin máx/mín automáticos). X = año,
// Y = ingreso del decil elegido en la unidad elegida; toggle lin/log. Slider de
// período inicio–fin. Hover-resalte (atenúa el resto) + tooltip reubicable.
function rk_period() {
  const p = (state[4].period && state[4].period.length === 2) ? state[4].period : [rk_yearMin(), rk_yearMax()];
  return [Math.max(rk_yearMin(), Math.min(p[0], p[1])), Math.min(rk_yearMax(), Math.max(p[0], p[1]))];
}
function rk_lineSeries() {
  const dec = rk_deciles(), unit = rk_unit(), [p0, p1] = rk_period();
  const out = [];
  (state[4].linesCountries || []).forEach(iso => {
    const pts = [];
    rk_years().forEach(y => { if (y < p0 || y > p1) return; const v = rk_value(iso, y, dec, unit); if (v != null) pts.push([y, v]); });
    if (pts.length) out.push({ iso, name: rk_name(iso), color: rk_lineColor(iso), pts });
  });
  return out;
}
function rk_niceLog(lo, hi) {   // ticks 1,2,5 por década (1,2,5,10,20,50,100…)
  const ticks = [];
  for (let e = Math.floor(Math.log10(lo)); Math.pow(10, e) <= hi * 1.0001; e++) {
    [1, 2, 5].forEach(m => { const v = m * Math.pow(10, e); if (v >= lo * 0.999 && v <= hi * 1.0001) ticks.push(v); });
  }
  return ticks.length ? ticks : [lo, hi];
}
function rk_niceLin(lo, hi, n) {
  const span = hi - lo || 1; const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = (raw / mag >= 5 ? 5 : raw / mag >= 2 ? 2 : 1) * mag;
  const ticks = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-6; v += step) ticks.push(v);
  return ticks;
}
function rk_drawLines(svg, ctx) {
  const { bigFmt, isPngFormat } = ctx;
  const interactive = !isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  const unit = rk_unit(), logScale = (state[4].yScale === 'log');
  const series = rk_lineSeries();
  const [p0, p1] = rk_period();
  const dispR = document.getElementById('rk-range-display'); if (dispR) dispR.textContent = p0 + '–' + p1;
  if (!series.length) {
    const m = rk_el('text'); m.setAttribute('x', RK_W / 2); m.setAttribute('y', RK_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.style.fontSize = (bigFmt ? 22 : 14) + 'px'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = rk_tt('c4-empty-lines', 'Elegí al menos un país.'); svg.appendChild(m); return;
  }
  // escala Y
  let vmin = Infinity, vmax = -Infinity;
  series.forEach(s => s.pts.forEach(p => { if (p[1] < vmin) vmin = p[1]; if (p[1] > vmax) vmax = p[1]; }));
  if (!isFinite(vmin)) { vmin = 1; vmax = 10; }
  const fs = bigFmt ? 22 : 11.5, labelFs = bigFmt ? 22 : 12;
  // margen derecho dinámico para los end-labels (nombre + valor en PNG)
  let nameW = 0; series.forEach(s => { const w = rk_measure(s.name + (isPngFormat ? '  ' + rk_fmt(s.pts[s.pts.length - 1][1], unit) : ''), labelFs, 600); if (w > nameW) nameW = w; });
  const M = { top: RK_MARGIN.top, bottom: bigFmt ? 56 : 40, left: bigFmt ? 96 : 64, right: Math.min(Math.round(RK_W * 0.34), (bigFmt ? 22 : 12) + nameW + (bigFmt ? 16 : 10)) };
  const PW = RK_W - M.left - M.right, PH = RK_H - M.top - M.bottom;
  let yLo, yHi, yTicks;
  if (logScale) { yLo = Math.max(0.1, Math.pow(10, Math.floor(Math.log10(vmin)))); yHi = Math.pow(10, Math.ceil(Math.log10(vmax))); yTicks = rk_niceLog(yLo, yHi); }
  else { const t = rk_niceLin(Math.min(0, vmin), vmax, 6); yLo = 0; yHi = t[t.length - 1]; yTicks = t; }
  const xS = (yr) => M.left + ((yr - p0) / (p1 - p0 || 1)) * PW;
  const yS = (v) => {
    if (logScale) { const a = Math.log10(yLo), b = Math.log10(yHi); return M.top + PH - ((Math.log10(Math.max(v, yLo)) - a) / (b - a)) * PH; }
    return M.top + PH - ((v - yLo) / (yHi - yLo || 1)) * PH;
  };
  // grid + ticks Y
  yTicks.forEach(v => {
    const y = yS(v); if (y < M.top - 1 || y > M.top + PH + 1) return;
    const gl = rk_el('line'); gl.setAttribute('x1', M.left); gl.setAttribute('x2', M.left + PW); gl.setAttribute('y1', y); gl.setAttribute('y2', y); gl.setAttribute('class', 's-grid-line'); svg.appendChild(gl);
    const lb = rk_el('text'); lb.setAttribute('x', M.left - (bigFmt ? 12 : 8)); lb.setAttribute('y', y + (bigFmt ? 7 : 4)); lb.setAttribute('text-anchor', 'end'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = fs + 'px'; lb.textContent = rk_fmtTick(v); svg.appendChild(lb);
  });
  // grid + ticks X (años)
  const xticks = []; const ys = rk_years().filter(y => y >= p0 && y <= p1); let lastX = -1e9; const minGap = bigFmt ? 90 : 48;
  ys.forEach((y, i) => { const x = xS(y); if (i === 0 || i === ys.length - 1 || x - lastX >= minGap) { if (i === ys.length - 1 && xticks.length && (x - xS(xticks[xticks.length - 1])) < minGap) xticks.pop(); xticks.push(y); lastX = x; } });
  xticks.forEach(y => {
    const x = xS(y);
    const lb = rk_el('text'); lb.setAttribute('x', x); lb.setAttribute('y', M.top + PH + (bigFmt ? 34 : 18)); lb.setAttribute('text-anchor', 'middle'); lb.setAttribute('class', 's-tick'); lb.style.fontSize = fs + 'px'; lb.textContent = y; svg.appendChild(lb);
  });
  // título eje Y
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const yT = rk_el('text'); yT.setAttribute('class', 's-axis-title'); yT.setAttribute('text-anchor', 'middle'); yT.setAttribute('transform', `translate(${M.left - (bigFmt ? 74 : 46)}, ${M.top + PH / 2}) rotate(-90)`); yT.style.fontSize = (bigFmt ? 22 : 11.5) + 'px'; yT.textContent = (en ? 'US$ PPP' : 'US$ PPA') + ' ' + rk_unitSuffix(); svg.appendChild(yT);

  // líneas + halos + dots + áreas de hover (resalte)
  const lineW = bigFmt ? 3.2 : 2, haloW = lineW + (bigFmt ? 5 : 3), dotR = bigFmt ? 4 : 2.4;
  const halosG = rk_el('g'), linesG = rk_el('g'), dotsG = rk_el('g'), hitG = rk_el('g');
  [halosG, linesG, dotsG, hitG].forEach(g => svg.appendChild(g));
  const endLabels = [];
  series.forEach(s => {
    const d = s.pts.map((p, i) => (i ? 'L' : 'M') + xS(p[0]).toFixed(1) + ',' + yS(p[1]).toFixed(1)).join(' ');
    const halo = rk_el('path'); halo.setAttribute('d', d); halo.setAttribute('fill', 'none'); halo.setAttribute('stroke', '#FAF8F3'); halo.setAttribute('stroke-width', haloW); halo.setAttribute('stroke-linejoin', 'round'); halo.setAttribute('stroke-linecap', 'round'); halo.setAttribute('data-rk', s.iso); halosG.appendChild(halo);
    const path = rk_el('path'); path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', s.color); path.setAttribute('stroke-width', lineW); path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('data-rk', s.iso); linesG.appendChild(path);
    s.pts.forEach(p => { const c = rk_el('circle'); c.setAttribute('cx', xS(p[0])); c.setAttribute('cy', yS(p[1])); c.setAttribute('r', dotR); c.setAttribute('fill', s.color); c.setAttribute('stroke', '#FAF8F3'); c.setAttribute('stroke-width', bigFmt ? 1.6 : 1); c.setAttribute('data-rk', s.iso); dotsG.appendChild(c); });
    if (interactive) {
      const hit = rk_el('path'); hit.setAttribute('d', d); hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', Math.max(lineW + 10, 12)); hit.style.pointerEvents = 'stroke'; hit.style.cursor = 'pointer';
      hit.addEventListener('mouseenter', () => rk_emph(svg, s.iso)); hit.addEventListener('mouseleave', () => rk_emph(svg, null));
      hitG.appendChild(hit);
    }
    const last = s.pts[s.pts.length - 1];
    endLabels.push({ name: s.name, color: s.color, idealY: yS(last[1]), x: xS(last[0]), valLast: last[1], iso: s.iso });
  });
  // end-labels con anti-pisado vertical
  const gap = bigFmt ? labelFs + 6 : 14, topB = M.top + (bigFmt ? 6 : 2), botB = M.top + PH;
  endLabels.sort((a, b) => a.idealY - b.idealY);
  endLabels.forEach((l, i) => { l.y = (i === 0) ? Math.max(l.idealY, topB) : Math.max(l.idealY, endLabels[i - 1].y + gap); });
  if (endLabels.length) { const last = endLabels[endLabels.length - 1]; if (last.y > botB) { last.y = botB; for (let i = endLabels.length - 2; i >= 0; i--) endLabels[i].y = Math.min(endLabels[i].y, endLabels[i + 1].y - gap); } }
  const endG = rk_el('g'); svg.appendChild(endG);
  endLabels.forEach(l => {
    l.y = Math.max(l.y, topB);
    if (Math.abs(l.y - l.idealY) > 1.5) { const g = rk_el('line'); g.setAttribute('x1', l.x); g.setAttribute('y1', l.idealY); g.setAttribute('x2', l.x + (bigFmt ? 8 : 4)); g.setAttribute('y2', l.y); g.setAttribute('stroke', l.color); g.setAttribute('stroke-width', bigFmt ? 1.4 : 0.8); g.setAttribute('stroke-opacity', 0.5); g.setAttribute('data-rk', l.iso); endG.appendChild(g); }
    const txt = rk_el('text'); txt.setAttribute('x', l.x + (bigFmt ? 12 : 6)); txt.setAttribute('y', l.y + (bigFmt ? 7 : 4)); txt.setAttribute('fill', l.color); txt.setAttribute('font-weight', bigFmt ? 700 : 600); txt.style.fontSize = labelFs + 'px'; txt.style.fontFamily = 'var(--sans)'; txt.setAttribute('paint-order', 'stroke'); txt.setAttribute('stroke', '#FAF8F3'); txt.setAttribute('stroke-width', bigFmt ? 5 : 2.5); txt.setAttribute('stroke-linejoin', 'round'); txt.setAttribute('data-rk', l.iso);
    txt.textContent = l.name + (isPngFormat ? '  ' + rk_fmt(l.valLast, unit) : ''); endG.appendChild(txt);
  });
  if (interactive) rk_linesHover(svg, { p0, p1, xS, yS, series, unit, M, PW, PH });
}
function rk_emph(svg, iso) {
  if (!svg) return;
  svg.querySelectorAll('[data-rk]').forEach(el => { el.style.opacity = (iso == null || el.getAttribute('data-rk') === iso) ? '' : '0.14'; });
}
function rk_linesHover(svg, c) {
  const tooltip = document.getElementById('tooltip4'); if (!tooltip) return;
  const years = rk_years().filter(y => y >= c.p0 && y <= c.p1);
  const hoverG = rk_el('g'); hoverG.setAttribute('display', 'none'); svg.appendChild(hoverG);
  const vline = rk_el('line'); vline.setAttribute('stroke', '#9a9488'); vline.setAttribute('stroke-width', 1); vline.setAttribute('stroke-dasharray', '3 3'); vline.setAttribute('y1', c.M.top); vline.setAttribute('y2', c.M.top + c.PH); hoverG.appendChild(vline);
  const cap = rk_el('rect'); cap.setAttribute('x', c.M.left); cap.setAttribute('y', c.M.top); cap.setAttribute('width', c.PW); cap.setAttribute('height', c.PH); cap.setAttribute('fill', 'transparent'); svg.insertBefore(cap, svg.firstChild);
  const nearest = (px) => { let best = years[0], bd = Infinity; years.forEach(y => { const d = Math.abs(c.xS(y) - px); if (d < bd) { bd = d; best = y; } }); return best; };
  const update = (yr) => {
    if (yr == null) { hoverG.setAttribute('display', 'none'); tooltip.style.opacity = '0'; tooltip.style.display = 'none'; return; }
    hoverG.setAttribute('display', ''); while (hoverG.children.length > 1) hoverG.removeChild(hoverG.lastChild);
    const xAt = c.xS(yr); vline.setAttribute('x1', xAt); vline.setAttribute('x2', xAt);
    const rows = [];
    c.series.forEach(s => { const p = s.pts.find(q => q[0] === yr); if (!p) return; const dot = rk_el('circle'); dot.setAttribute('cx', xAt); dot.setAttribute('cy', c.yS(p[1])); dot.setAttribute('r', 4); dot.setAttribute('fill', s.color); dot.setAttribute('stroke', '#FAF8F3'); dot.setAttribute('stroke-width', 1.5); hoverG.appendChild(dot); rows.push({ name: s.name, color: s.color, v: p[1] }); });
    rows.sort((a, b) => b.v - a.v);
    let html = `<div style="font-weight:600;margin-bottom:4px;">${yr}</div>`;
    rows.forEach(r => { html += `<div style="display:flex;align-items:center;gap:6px;line-height:1.5;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${r.color};"></span><span style="flex:1;">${r.name}</span><strong style="font-variant-numeric:tabular-nums;">${rk_fmt(r.v, c.unit)}</strong></div>`; });
    tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1';
  };
  const moveH = (ev) => { const rc = svg.getBoundingClientRect(); const sc = rc.width / RK_W; const lx = (ev.clientX - rc.left) / sc; if (lx < c.M.left || lx > c.M.left + c.PW) { update(null); return; } update(nearest(lx)); rk_placeTip(tooltip, ev, svg); };
  svg.addEventListener('mousemove', moveH); svg.addEventListener('mouseleave', () => update(null));
}

// =================== Vista MAPA ===================
// Coroplético D3 (Robinson). Modo clásico (rampa terracota, bins fijos estilo
// OWID) o benchmark (diverging vs un país: encima en terracota, debajo en azul;
// el país de referencia va en un color aparte). Zoom por continente (fitExtent a
// un MultiPoint del bbox — un Polygon lo interpreta como la esfera complementaria
// y no zoomea). Sin Antártida (norma de mapas). Hover en la leyenda → atenúa los
// países fuera de ese tramo (mismo criterio que el mapa de clubes del N°3).
const RK_MAP_NODATA = '#E2DDD0';
const RK_MAP_CLASSIC = ['#F2D9C9', '#E2A782', '#CF7E54', '#BE5D32', '#8E3F20', '#5A2818'];   // terracota claro→oscuro
const RK_MAP_DIVERGE = ['#2D4256', '#5E7E96', '#A5BFD0', '#E2A782', '#9B3D24', '#5A2818'];   // azul (debajo) → terracota (encima)
const RK_MAP_BENCH = '#595550';   // país de referencia: gris cálido oscuro, neutro y fuera de la escala azul/terracota
const RK_MAP_BREAKS = [1, 2, 5, 10, 20];      // US$ PPA/día (escalados por unidad) — bins fijos OWID
const RK_BENCH_BREAKS = [0.5, 0.8, 1, 1.25, 2];
// Países "relevantes" (economías/poblaciones grandes + notables). Se usan para dos
// cosas en el etiquetado del mapa: (a) prioridad de colocación (se procesan primero,
// ganan colisiones), y (b) elegibilidad de línea guía: solo un país relevante que no
// entre adentro puede llevar etiqueta externa al mar. El resto, si no entra adentro,
// no se muestra.
const RK_RELEVANT = new Set([
  'USA', 'CHN', 'JPN', 'DEU', 'IND', 'GBR', 'FRA', 'ITA', 'BRA', 'CAN', 'RUS', 'KOR', 'AUS', 'ESP', 'MEX',
  'IDN', 'NLD', 'SAU', 'TUR', 'CHE', 'POL', 'SWE', 'BEL', 'ARG', 'NOR', 'AUT', 'THA', 'ISR', 'ARE', 'DNK',
  'SGP', 'ZAF', 'COL', 'CHL', 'EGY', 'NGA', 'PHL', 'VNM', 'MYS', 'PER', 'PRT', 'IRL', 'FIN', 'GRC', 'NZL'
]);
// Transcontinentales: se muestran también en el continente que comparten (además del
// que dicta su centroide geográfico).
const RK_CONT_EXTRA = { europe: ['RUS', 'TUR', 'KAZ', 'GEO', 'AZE', 'CYP'], asia: ['RUS', 'TUR', 'KAZ', 'EGY', 'GEO', 'AZE'], africa: ['EGY'] };
const RK_CONT_BBOX = {
  all: [[-168, -56], [178, 80]], america: [[-168, -56], [-32, 73]], europe: [[-25, 34], [60, 72]],
  africa: [[-20, -36], [52, 38]], asia: [[26, -11], [150, 78]], oceania: [[110, -50], [179, 10]]
};
// Aspecto del MAPA por continente: cada uno tiene su forma natural. vbW/vbH = viewBox del
// SVG (pantalla con formato + PNG); nW/nH = canvas del PNG (define el aspecto final del PNG).
// Europa cuadrado; Asia/Oceanía/mundo apaisado; África/América vertical. (Números a afinar
// visualmente — el mapa no se puede previsualizar acá.)
const RK_CONT_VIEW = {
  all:     { vbW: 1100, vbH: 480,  nW: 1600, nH: 900 },   // mundo: apaisado (sin scroll en pantalla)
  asia:    { vbW: 1240, vbH: 720,  nW: 1600, nH: 1060 },  // apaisado
  oceania: { vbW: 1200, vbH: 740,  nW: 1560, nH: 1060 },  // apaisado
  europe:  { vbW: 1020, vbH: 800,  nW: 1180, nH: 1180 },  // cuadrado
  africa:  { vbW: 900,  vbH: 1040, nW: 1120, nH: 1440 },  // vertical
  america: { vbW: 840,  vbH: 1080, nW: 1080, nH: 1480 }   // vertical
};
let rk_map_proj = null, rk_map_path = null;
function rk_mapValues(year, dec, unit) {
  const vals = {};
  rk_allIsos(year).forEach(iso => { const v = rk_value(iso, year, dec, unit); if (v != null) vals[iso] = v; });
  return vals;
}
function rk_isoOf(d) { return d.id || (d.properties && d.properties.iso) || null; }
// Continente GEOGRÁFICO de un país, para filtrar etiquetas y el swatch de la leyenda con
// zoom. Se deriva de la región del Banco Mundial (rk_region) + overrides para los casos
// que la taxonomía WB mezcla: el Norte de África viene junto al Medio Oriente, Asia Central
// junto a Europa, y Oceanía junto a Asia Oriental. Así, p.ej., Túnez es África (no Europa)
// aunque su land aparezca como contexto en el zoom a Europa.
const RK_NORTH_AFRICA = new Set(['DZA', 'EGY', 'LBY', 'MAR', 'TUN', 'ESH']);
const RK_CENTRAL_ASIA = new Set(['KAZ', 'UZB', 'TKM', 'KGZ', 'TJK']);
const RK_OCEANIA_ISO = new Set(['AUS', 'NZL', 'PNG', 'FJI', 'SLB', 'VUT', 'WSM', 'TON', 'KIR', 'FSM', 'MHL', 'PLW', 'NRU', 'TUV', 'NCL', 'PYF']);
function rk_isoContinent(iso) {
  if (RK_OCEANIA_ISO.has(iso)) return 'oceania';
  if (RK_NORTH_AFRICA.has(iso)) return 'africa';
  if (RK_CENTRAL_ASIA.has(iso)) return 'asia';
  const r = rk_region(iso);
  if (r === 'North America' || r === 'Latin America & Caribbean') return 'america';
  if (r === 'Europe & Central Asia') return 'europe';
  if (r === 'Sub-Saharan Africa') return 'africa';
  // East Asia & Pacific, South Asia y lo que queda de "Middle East, North Africa,
  // Afghanistan & Pakistan" (Medio Oriente + Afganistán + Pakistán) → Asia.
  if (r === 'East Asia & Pacific' || r === 'South Asia' || r === 'Middle East, North Africa, Afghanistan & Pakistan') return 'asia';
  return '';
}
// ¿El país (iso) pertenece al continente activo? (+ transcontinentales de RK_CONT_EXTRA).
// Sirve para NO mostrar en la leyenda el swatch del país de comparación cuando el zoom
// regional lo deja afuera (la clave de color no apuntaría a ningún país del recorte).
function rk_isoInContinent(iso) {
  const cont = state[4].continent;
  if (!cont || cont === 'all') return true;
  if ((RK_CONT_EXTRA[cont] || []).indexOf(iso) >= 0) return true;
  return rk_isoContinent(iso) === cont;
}
// Atenúa los países que no están en el tramo (bin) apuntado en la leyenda.
function rk_mapDim(binId) {
  const svg = document.getElementById('chart4'); if (!svg) return;
  svg.querySelectorAll('path.rk-country').forEach(p => { p.style.opacity = (binId == null || p.getAttribute('data-bin') === String(binId)) ? '' : '0.16'; });
}
function rk_drawMap(svg, ctx) {
  const { bigFmt } = ctx;
  if (typeof d3 === 'undefined' || typeof GEO_COUNTRIES === 'undefined') {
    const m = rk_el('text'); m.setAttribute('x', RK_W / 2); m.setAttribute('y', RK_H / 2); m.setAttribute('text-anchor', 'middle'); m.style.fontFamily = 'var(--sans)'; m.setAttribute('fill', 'var(--ink-muted)'); m.textContent = 'Cargando mapa…'; svg.appendChild(m); return;
  }
  const year = state[4].year, dec = rk_deciles(), unit = rk_unit();
  const vals = rk_mapValues(year, dec, unit);
  const benchOn = state[4].mapMode === 'bench';
  const benchV = benchOn ? vals[state[4].benchmark] : null;
  const pad = bigFmt ? 14 : 8;
  const legendH = bigFmt ? 74 : 56;   // espacio reservado abajo para la leyenda (más grande)
  const PW = RK_W - pad * 2, PH = RK_H - pad - legendH;

  // proyección: fit a un MultiPoint del bbox del continente (sin Antártida)
  const box = RK_CONT_BBOX[state[4].continent] || RK_CONT_BBOX.all;
  const fitObj = { type: 'MultiPoint', coordinates: [box[0], [box[1][0], box[0][1]], box[1], [box[0][0], box[1][1]]] };
  rk_map_proj = d3.geoRobinson().fitExtent([[pad, pad], [pad + PW, pad + PH]], fitObj);
  rk_map_path = d3.geoPath(rk_map_proj);
  const svgSel = d3.select(svg); svgSel.selectAll('*').remove();

  // bins + color
  const mult = rk_unitMult(unit);
  const classicBreaks = RK_MAP_BREAKS.map(b => b * mult);
  const classicSc = d3.scaleThreshold().domain(classicBreaks).range(RK_MAP_CLASSIC);
  const benchSc = d3.scaleThreshold().domain(RK_BENCH_BREAKS).range(RK_MAP_DIVERGE);
  // bin + fill por país. Devuelve {fill, bin} ('nd' sin dato, 'bench' país ref.)
  function paint(iso) {
    const v = vals[iso];
    if (v == null) return { fill: RK_MAP_NODATA, bin: 'nd' };
    if (benchOn && benchV) {
      if (iso === state[4].benchmark) return { fill: RK_MAP_BENCH, bin: 'bench' };
      const r = v / benchV; return { fill: benchSc(r), bin: d3.bisect(RK_BENCH_BREAKS, r) };
    }
    return { fill: classicSc(v), bin: d3.bisect(classicBreaks, v) };
  }

  // clip al área de plot
  svgSel.append('defs').append('clipPath').attr('id', 'rk-map-clip').append('rect').attr('x', 0).attr('y', 0).attr('width', RK_W).attr('height', pad + PH);
  const g = svgSel.append('g').attr('clip-path', 'url(#rk-map-clip)');
  if (GEO_COUNTRIES.landmask) g.append('path').attr('class', 'rk-landmask').attr('d', rk_map_path(GEO_COUNTRIES.landmask)).attr('fill', RK_MAP_NODATA).attr('stroke', 'none');
  const feats = GEO_COUNTRIES.features.filter(d => rk_isoOf(d) !== 'ATA').sort((a, b) => d3.geoArea(b) - d3.geoArea(a));   // sin Antártida
  const tooltip = document.getElementById('tooltip4');
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const interactive = !ctx.isPngFormat && (typeof HAS_HOVER === 'undefined' || HAS_HOVER);
  g.append('g').selectAll('path.rk-country').data(feats).join('path')
    .attr('class', 'rk-country').attr('d', rk_map_path)
    .attr('data-iso', d => rk_isoOf(d))
    .attr('fill', d => paint(rk_isoOf(d)).fill)
    .attr('data-bin', d => paint(rk_isoOf(d)).bin)
    .attr('stroke', d => (benchOn && rk_isoOf(d) === state[4].benchmark) ? '#1A1A1A' : 'rgba(255,255,255,0.55)')
    .attr('stroke-width', d => (benchOn && rk_isoOf(d) === state[4].benchmark) ? (bigFmt ? 2.2 : 1.6) : 0.5)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('cursor', interactive ? 'pointer' : 'default')
    .on('mouseenter', interactive ? function (ev, d) {
      const iso = rk_isoOf(d), v = vals[iso]; if (v == null) { if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; } return; }
      d3.select(this).attr('stroke', '#1A1A1A').attr('stroke-width', bigFmt ? 2 : 1.4).raise();
      let html = `<div style="font-weight:600;margin-bottom:3px;">${rk_name(iso)}</div><strong style="font-variant-numeric:tabular-nums;">${rk_fmt(v, unit)}</strong> ${rk_unitSuffix()}`;
      if (benchOn && benchV && iso !== state[4].benchmark) { const pct = Math.round((v / benchV - 1) * 100); html += `<div style="color:var(--ink-muted);margin-top:2px;">${pct >= 0 ? '+' : ''}${pct}% vs ${rk_name(state[4].benchmark)}</div>`; }
      else if (benchOn && iso === state[4].benchmark) { html += `<div style="color:var(--ink-muted);margin-top:2px;">${en ? 'reference' : 'referencia'}</div>`; }
      if (tooltip) { tooltip.innerHTML = html; tooltip.style.display = 'block'; tooltip.style.opacity = '1'; rk_placeTip(tooltip, ev, svg); }
    } : null)
    .on('mousemove', interactive ? (ev) => { if (tooltip) rk_placeTip(tooltip, ev, svg); } : null)
    .on('mouseleave', interactive ? function (ev, d) {
      const iso = rk_isoOf(d);
      d3.select(this).attr('stroke', (benchOn && iso === state[4].benchmark) ? '#1A1A1A' : 'rgba(255,255,255,0.55)').attr('stroke-width', (benchOn && iso === state[4].benchmark) ? (bigFmt ? 2.2 : 1.6) : 0.5);
      if (tooltip) { tooltip.style.opacity = '0'; tooltip.style.display = 'none'; }
    } : null)
    .on('click', interactive ? function (ev, d) { const iso = rk_isoOf(d); if (vals[iso] != null) { state[4].benchmark = iso; state[4].mapMode = 'bench'; drawRanking(); } } : null);   // clic en cualquier país → comparar contra él

  if (state[4].mapLabels) {
    const fillByIso = {}; feats.forEach(f => { fillByIso[rk_isoOf(f)] = paint(rk_isoOf(f)).fill; });
    rk_drawMapLabels(svg, { feats, vals, fillByIso, benchV, box: { x1: pad, y1: pad, x2: pad + PW, y2: pad + PH }, bigFmt, unit });
  }
  rk_drawMapLegend(svg, { bigFmt, benchOn, benchV, classicBreaks, unit, interactive, pngExport: ctx.isPngFormat });
  rk_renderCompare();
  const disp = document.getElementById('rk-year-display'); if (disp) disp.textContent = year;
}
// ¿El color de fondo es oscuro? (para decidir texto blanco o negro encima).
function rk_isDark(hex) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.58;
}
// Parte CONTINENTAL de un país (polígono proyectado más grande): da el centroide
// sobre el territorio principal y no en el mar (Francia + Guayana, EE.UU. +
// Alaska/Hawái, etc.).
function rk_mainland(f) {
  const geom = f && f.geometry; if (!geom) return f;
  if (geom.type !== 'MultiPolygon') return f;
  let best = f, bestA = -1;
  geom.coordinates.forEach(poly => { const tmp = { type: 'Feature', geometry: { type: 'Polygon', coordinates: poly } }; let a = 0; try { a = Math.abs(rk_map_path.area(tmp)); } catch (e) { } if (a > bestA) { bestA = a; best = tmp; } });
  return best;
}
// Etiquetas de valor sobre los países (toggle "Valores", criterio OWID). Tres
// niveles, en orden:
//   1. Centroide de la parte CONTINENTAL: si la etiqueta entra ahí (4 esquinas
//      dentro del país) y no choca → se coloca centrada. Cubre la mayoría de los
//      países grandes/medianos bien centrados (Brasil, EE.UU., Francia, Suecia…).
//   2. Si no entra en el centroide (país cóncavo/curvo): se busca en una grilla el
//      punto interior que entre más cercano al centroide.
//   3. Si no entra DENTRO (país chico con costa): etiqueta EXTERNA en el mar, con
//      línea guía. El punto externo debe estar sobre océano (no sobre el landmask,
//      o sea ningún país) y dentro del encuadre. Cubre Portugal, Países Bajos,
//      Bélgica, etc.
// Si nada de eso entra (país chico sin costa cercana libre) → no se muestra.
// Texto: dentro → blanco sobre fondo oscuro / negro sobre claro; externo (sobre el
// mar crema) → tinta oscura con halo crema.
function rk_drawMapLabels(svg, o) {
  const { feats, vals, fillByIso, benchV, box, bigFmt } = o;
  const unit = o.unit, benchOn = state[4].mapMode === 'bench';
  // PNG/export (bigFmt): cifras GRANDES para que se lean tuiteadas (~13-15px en el
  // timeline de X, que muestra la imagen a ~506px). Con cifras grandes la anti-colisión
  // (free) muestra menos etiquetas, pero legibles — que es lo que se quiere para redes.
  const fs = bigFmt ? 32 : 10, fw = bigFmt ? 700 : 600;
  const placed = [], leaderSegs = [], g = rk_el('g'); svg.appendChild(g);
  const land = svg.querySelector('path.rk-landmask');
  const sp = svg.createSVGPoint();
  const over = (a, b) => !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  // ¿Se cruzan los segmentos ab y cd? (para que las líneas guía no se crucen entre sí.)
  const segCross = (a, b, c, d) => { const cw = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return ((cw(c, d, a) > 0) !== (cw(c, d, b) > 0)) && ((cw(a, b, c) > 0) !== (cw(a, b, d) > 0)); };
  const inFill = (el, x, y) => { if (!el) return false; sp.x = x; sp.y = y; try { return el.isPointInFill(sp); } catch (e) { return false; } };
  // Caja de la etiqueta (validación interior, colisión, viewport y mar). Media-altura
  // 0.55h: deja aire para que la anti-colisión separe bien y las cifras no se amontonen.
  const AX = (w) => w / 2 + 1, AY = (h) => h * 0.55;
  const rectOf = (cx, cy, w, h) => ({ x1: cx - AX(w), x2: cx + AX(w), y1: cy - AY(h), y2: cy + AY(h) });
  const inView = (cx, cy, w, h) => (cx - AX(w) >= box.x1 && cx + AX(w) <= box.x2 && cy - AY(h) >= box.y1 && cy + AY(h) <= box.y2);
  const overSea = (cx, cy, w, h) => { if (!land) return false; const a = AX(w), b = AY(h); return !inFill(land, cx - a, cy - b) && !inFill(land, cx + a, cy - b) && !inFill(land, cx - a, cy + b) && !inFill(land, cx + a, cy + b) && !inFill(land, cx, cy); };
  const free = (cx, cy, w, h) => !placed.some(p => over(p, rectOf(cx, cy, w, h)));
  // Hit-test contra el CUERPO PRINCIPAL (mainland), no contra el país con islas: una
  // <path> oculta a la que le seteamos el path del mainland por país. Así la etiqueta y
  // el origen de la línea guía nunca caen en una isla (Lofoten, archipiélago ártico,
  // islas australes de Chile) en vez del continente.
  const probe = rk_el('path'); probe.setAttribute('fill', '#000'); probe.style.opacity = '0'; probe.style.pointerEvents = 'none'; svg.appendChild(probe);
  let mlEl = null;   // = probe (mainland) por país; it.el de fallback si no hay path
  // Fit con tolerancia horizontal (~14%): la cifra se centra igual aunque el texto sea un
  // poco más ancho ("-75%" vs "$4.3"), para que NO salte de lugar al cambiar de modo
  // clásico↔comparar (mismo país, ancho de etiqueta distinto). El overflow es chico y solo
  // lateral → en países anchos cae sobre sí mismos. Vertical estricto (un desborde
  // arriba/abajo suele caer en otro país). La colisión y el test de mar usan el ancho real.
  const cornersIn = (cx, cy, w, h) => { const a = w * 0.43 + 1, b = AY(h); return inFill(mlEl, cx - a, cy - b) && inFill(mlEl, cx + a, cy - b) && inFill(mlEl, cx - a, cy + b) && inFill(mlEl, cx + a, cy + b); };

  // Filtro por continente: con zoom a un continente, etiquetar SOLO países de ESE
  // continente (por MEMBRESÍA geográfica — rk_isoContinent —, no por bbox: el land de
  // África/Medio Oriente puede aparecer como contexto en el zoom a Europa pero NO se
  // etiqueta). Los transcontinentales (Rusia, Turquía…) se incluyen vía RK_CONT_EXTRA.
  const cont = state[4].continent;
  const inContinent = (iso) => {
    if (cont === 'all') return true;
    if ((RK_CONT_EXTRA[cont] || []).indexOf(iso) >= 0) return true;
    return rk_isoContinent(iso) === cont;
  };
  const items = feats.filter(f => vals[rk_isoOf(f)] != null).map(f => {
    const iso = rk_isoOf(f), ml = rk_mainland(f); let c = null, b = null, gc = null, dpath = null;
    try { c = rk_map_path.centroid(ml); b = rk_map_path.bounds(ml); } catch (e) { }
    try { gc = d3.geoCentroid(f); } catch (e) { }
    try { dpath = rk_map_path(ml); } catch (e) { }   // path del mainland (para la probe)
    return { iso, el: svg.querySelector('path.rk-country[data-iso="' + iso + '"]'), c, b, gc, dpath, area: b ? (b[1][0] - b[0][0]) * (b[1][1] - b[0][1]) : 0 };
  }).filter(it => inContinent(it.iso))
    // Prioridad: países relevantes primero (procesados antes → ganan colisiones y son
    // los únicos elegibles para línea guía), y dentro de cada grupo por superficie
    // visible. Así en el mundo se etiquetan primero los importantes y los chicos
    // rellenan el espacio que queda.
    .sort((a, b) => {
      const ra = RK_RELEVANT.has(a.iso) ? 0 : 1, rb = RK_RELEVANT.has(b.iso) ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return b.area - a.area;
    });

  // Líneas guía: NINGUNA en la vista mundial (los países demasiado chicos para
  // etiquetar adentro simplemente no se etiquetan — el color del coroplético ya
  // comunica; quien quiera el valor hace zoom). Con zoom a un continente sí se
  // permiten, acotadas a países relevantes, porque ahí hay lugar y sentido.
  let leaders = 0; const maxLeaders = (cont === 'all') ? 0 : (bigFmt ? 12 : 9);
  items.forEach(it => {
    if (!it.el || !it.c || isNaN(it.c[0])) return;
    if (benchOn && benchV && it.iso === state[4].benchmark) return;   // el país de referencia no se etiqueta (solo si hay benchV)
    const v = vals[it.iso];
    const txt = (benchOn && benchV) ? (() => { const p = Math.round((v / benchV - 1) * 100); return (p >= 0 ? '+' : '') + p + '%'; })() : rk_fmt(v, unit);
    const w = rk_measure(txt, fs, fw), h = fs, cx0 = it.c[0], cy0 = it.c[1];
    mlEl = it.dpath ? (probe.setAttribute('d', it.dpath), probe) : it.el;   // probe = mainland de este país
    let anchor = null, external = false, leaderStart = null, interiorPt = null;

    // 1) centroide del mainland, si la etiqueta entra (caso ideal: países convexos →
    //    queda exactamente en el centro: México, Brasil, China, India…).
    if (inView(cx0, cy0, w, h) && cornersIn(cx0, cy0, w, h) && free(cx0, cy0, w, h)) anchor = [cx0, cy0];

    // 2) grilla interior con score = clearance − λ·dist(centroide): el punto queda
    //    CENTRAL pero bien adentro. Esto corrige el sesgo del pole puro hacia el lóbulo
    //    más ancho (que mandaba Canadá/Noruega al sur, México al norte). clearance vía
    //    distance-transform de Chebyshev (2 pasadas, O(N²)). Se prueba primero fit
    //    estricto (4 esquinas) y luego laxo (centro + medios verticales) para angostos.
    //    Poda: si el bbox del mainland no llega a contener la etiqueta, ni se intenta.
    if (!anchor && it.b && it.area >= w * h * 0.7) {
      const sx0 = Math.max(it.b[0][0], box.x1), sx1 = Math.min(it.b[1][0], box.x2), sy0 = Math.max(it.b[0][1], box.y1), sy1 = Math.min(it.b[1][1], box.y2);
      if (sx1 > sx0 && sy1 > sy0) {
        const N = 14, gx = i => sx0 + (sx1 - sx0) * i / N, gy = j => sy0 + (sy1 - sy0) * j / N;
        const ins = [], cl = [];
        for (let i = 0; i <= N; i++) { ins[i] = []; cl[i] = []; for (let j = 0; j <= N; j++) { ins[i][j] = inFill(mlEl, gx(i), gy(j)); cl[i][j] = 0; } }
        // distance-transform Chebyshev al "afuera" (incl. el borde de la grilla = mar/clip)
        const C = (i, j) => (i < 0 || j < 0 || i > N || j > N) ? 0 : cl[i][j];
        for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) cl[i][j] = ins[i][j] ? Math.min(C(i - 1, j), C(i, j - 1), C(i - 1, j - 1), C(i - 1, j + 1)) + 1 : 0;
        for (let i = N; i >= 0; i--) for (let j = N; j >= 0; j--) if (ins[i][j]) cl[i][j] = Math.min(cl[i][j], Math.min(C(i + 1, j), C(i, j + 1), C(i + 1, j + 1), C(i + 1, j - 1)) + 1);
        const diag = Math.sqrt((sx1 - sx0) ** 2 + (sy1 - sy0) ** 2) || 1, LAM = 1.3;
        const raw = []; let bestCl = -1;
        for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
          if (!ins[i][j]) continue;
          const x = gx(i), y = gy(j);
          raw.push({ x, y, cl: cl[i][j], dc: Math.sqrt((x - cx0) ** 2 + (y - cy0) ** 2) });
          if (cl[i][j] > bestCl) { bestCl = cl[i][j]; interiorPt = [x, y]; }   // punto más adentro → destino del rayo (nivel 3)
        }
        // Score ADIMENSIONAL (estable entre niveles de zoom): clearance normalizada por su
        // máximo − λ·distancia normalizada por la diagonal del bbox. Queda central pero
        // bien adentro, sin que el zoom cambie el balance.
        const cand = raw.map(p => ({ x: p.x, y: p.y, score: (bestCl > 0 ? p.cl / bestCl : 0) - LAM * (p.dc / diag) }));
        cand.sort((p, q) => q.score - p.score);
        // Fit ESTRICTO únicamente: la cifra debe entrar ENTERA adentro (4 esquinas). Si no
        // entra, no se etiqueta — no se tolera desborde al mar ni sobre el país vecino.
        for (const p of cand) { if (inView(p.x, p.y, w, h) && cornersIn(p.x, p.y, w, h) && free(p.x, p.y, w, h)) { anchor = [p.x, p.y]; break; } }
      }
    }

    // 3) etiqueta externa al mar con línea guía — EXCEPCIONAL: solo con zoom a un
    // continente (maxLeaders=0 en la vista mundial), solo para países RELEVANTES que no
    // entran adentro, con su centroide en el encuadre, línea corta y con un tope total.
    // Así son pocas y no ensucian. El resto de los países chicos no se etiquetan.
    if (!anchor && it.b && RK_RELEVANT.has(it.iso) && leaders < maxLeaders
      && cx0 >= box.x1 && cx0 <= box.x2 && cy0 >= box.y1 && cy0 <= box.y2) {
      // destino del rayo: el punto interior del nivel 2 si existe; si no, el centroide
      // (en un cóncavo podría caer en agua → el rayo no entra y el país no lleva etiqueta
      // externa, lo cual es aceptable: preferimos no mostrarla a mostrarla flotando).
      const tgt = interiorPt || [cx0, cy0];
      const hW = (it.b[1][0] - it.b[0][0]) / 2, hH = (it.b[1][1] - it.b[0][1]) / 2;
      const dirs = [[1, 0], [0.7, -0.7], [0, -1], [-0.7, -0.7], [-1, 0], [-0.7, 0.7], [0, 1], [0.7, 0.7]];
      const step = bigFmt ? 10 : 7, maxR = bigFmt ? 52 : 34;
      // Regla: la línea guía es CORTA y SOLO va por mar. Se recorre el radio de menor a
      // mayor y nos quedamos con el PRIMER radio que tenga alguna dirección válida (=> la
      // más corta posible); entre las válidas de ese radio se elige la de más aire. Si
      // ninguna sirve dentro de maxR, el país NO se etiqueta (mejor sin dato que con una
      // línea larga o confusa). "Válida" exige, sobre todo, que la línea NO atraviese otro
      // país (solo mar) — eso descarta los mediterráneos/landlocked y las salidas confusas.
      let best = null;
      for (let r = step; r <= maxR && !best; r += step) {
        let rBest = null, rBestSea = -1;
        for (const d of dirs) {
          const cx = cx0 + d[0] * (hW + AX(w) + r), cy = cy0 + d[1] * (hH + AY(h) + r);
          if (!inView(cx, cy, w, h) || !overSea(cx, cy, w, h) || !free(cx, cy, w, h)) continue;
          // Origen = costa real: de la etiqueta (mar) hacia el punto interior, primer inFill.
          let st = null;
          for (let t = 0; t <= 1.001; t += 0.03) { const px = cx + (tgt[0] - cx) * t, py = cy + (tgt[1] - cy) * t; if (inFill(mlEl, px, py)) { st = [px, py]; break; } }
          if (!st) continue;
          // CLAVE: el trayecto st→ancla debe ir SOLO por mar. Si algún punto cae en tierra
          // de OTRO país (land pero no el propio mainland), o pisa otra etiqueta → descartar.
          let bad = false;
          for (let t = 0.04; t <= 1.001; t += 0.04) {
            const px = st[0] + (cx - st[0]) * t, py = st[1] + (cy - st[1]) * t;
            if (land && inFill(land, px, py) && !inFill(mlEl, px, py)) { bad = true; break; }
            if (placed.some(p => px >= p.x1 && px <= p.x2 && py >= p.y1 && py <= p.y2)) { bad = true; break; }
          }
          if (bad) continue;
          // …ni cruzar otra línea guía ya dibujada (Suecia/Noruega).
          if (leaderSegs.some(s => segCross(st, [cx, cy], s[0], s[1]))) continue;
          // desempate entre direcciones del MISMO radio: la de más mar abierto alrededor.
          const rr = AX(w) + r * 0.6; let sea = 0;
          for (const e of dirs) if (land && !inFill(land, cx + e[0] * rr, cy + e[1] * rr)) sea++;
          if (sea > rBestSea) { rBestSea = sea; rBest = { cx, cy, st }; }
        }
        if (rBest) best = rBest;   // primer radio con salida válida = la línea más corta
      }
      if (best) { anchor = [best.cx, best.cy]; external = true; leaderStart = best.st; leaderSegs.push([best.st, [best.cx, best.cy]]); }
    }
    if (!anchor) return;
    placed.push(rectOf(anchor[0], anchor[1], w, h));

    if (external) {   // línea guía desde el borde del país hasta la etiqueta en el mar
      leaders++;
      const ls = leaderStart || [cx0, cy0];
      const ln = rk_el('line'); ln.setAttribute('x1', ls[0]); ln.setAttribute('y1', ls[1]); ln.setAttribute('x2', anchor[0]); ln.setAttribute('y2', anchor[1]); ln.setAttribute('stroke', '#1A1A1A'); ln.setAttribute('stroke-width', bigFmt ? 1 : 0.7); ln.setAttribute('stroke-opacity', 0.45); g.appendChild(ln);
    }
    const t = rk_el('text'); t.setAttribute('x', anchor[0]); t.setAttribute('y', anchor[1] + h * 0.34); t.setAttribute('text-anchor', 'middle'); t.style.fontSize = fs + 'px'; t.style.fontFamily = 'var(--sans)'; t.style.fontWeight = fw;
    if (external) { t.setAttribute('fill', '#1A1A1A'); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#FAF8F3'); t.setAttribute('stroke-width', bigFmt ? 5 : 2); t.setAttribute('stroke-linejoin', 'round'); }
    else t.setAttribute('fill', rk_isDark(fillByIso[it.iso]) ? '#FFFFFF' : '#1A1A1A');
    t.textContent = txt; g.appendChild(t);
  });
  if (probe.parentNode) probe.parentNode.removeChild(probe);   // sacar la probe oculta del mainland
}
// Leyenda estilo OWID: barra escalonada centrada abajo + swatch "Sin dato" (y el
// dorado de referencia en modo benchmark). Hover sobre cada tramo → atenúa el resto.
function rk_drawMapLegend(svg, o) {
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const bw = o.bigFmt ? 52 : 38, bh = o.bigFmt ? 18 : 14, fs = o.bigFmt ? 18 : 13, gap = o.bigFmt ? 16 : 11;
  const colors = (o.benchOn && o.benchV) ? RK_MAP_DIVERGE : RK_MAP_CLASSIC;
  // etiquetas en el borde IZQUIERDO de cada bloque
  let edge;
  if (o.benchOn && o.benchV) edge = ['', '-50%', '-20%', '=', '+25%', '+100%'];   // % vs el país, consistente con las etiquetas de valor
  else edge = ['$0'].concat(o.classicBreaks.map(b => rk_fmtTick(b)));
  // El swatch del país de referencia es la clave para ubicar ese color en el mapa: solo
  // tiene sentido si el país está EN el encuadre. Con zoom a un continente que lo deja
  // fuera (ej. comparar vs EE.UU. en el zoom a Europa) se omite — el subtítulo ya dice
  // contra quién se compara, así que no se pierde información.
  const showBench = o.benchOn && o.benchV && rk_isoInContinent(state[4].benchmark);
  const barW = colors.length * bw;
  const ndW = bw * 0.9;
  const totalW = ndW + gap + barW + (showBench ? gap + bw * 1.1 : 0);
  const x0 = (RK_W - totalW) / 2, yb = RK_H - (o.bigFmt ? 46 : 38);
  const g = rk_el('g'); svg.appendChild(g);
  const mk = (tag) => rk_el(tag);
  const addText = (x, y, txt, anchor) => { const t = mk('text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', anchor || 'middle'); t.style.fontFamily = 'var(--sans)'; t.style.fontSize = fs + 'px'; t.setAttribute('fill', 'var(--ink-soft)'); t.textContent = txt; g.appendChild(t); };
  // "Sin dato"
  const nd = mk('rect'); nd.setAttribute('x', x0); nd.setAttribute('y', yb); nd.setAttribute('width', ndW); nd.setAttribute('height', bh); nd.setAttribute('fill', RK_MAP_NODATA); nd.style.cursor = 'default'; g.appendChild(nd);
  addText(x0 + ndW / 2, yb + bh + fs + 1, en ? 'No data' : 'Sin dato');
  if (o.interactive) { nd.addEventListener('mouseenter', () => rk_mapDim('nd')); nd.addEventListener('mouseleave', () => rk_mapDim(null)); }
  // barra escalonada
  const bx = x0 + ndW + gap;
  colors.forEach((c, i) => {
    const r = mk('rect'); r.setAttribute('x', bx + i * bw); r.setAttribute('y', yb); r.setAttribute('width', bw); r.setAttribute('height', bh); r.setAttribute('fill', c); r.style.cursor = o.interactive ? 'pointer' : 'default'; g.appendChild(r);
    if (edge[i]) addText(bx + i * bw, yb + bh + fs + 1, edge[i]);
    if (o.interactive) { r.addEventListener('mouseenter', () => rk_mapDim(i)); r.addEventListener('mouseleave', () => rk_mapDim(null)); }
  });
  // swatch del país de referencia (solo si está dentro del encuadre — ver showBench)
  if (showBench) {
    const gx = bx + barW + gap;
    const r = mk('rect'); r.setAttribute('x', gx); r.setAttribute('y', yb); r.setAttribute('width', bw * 1.1); r.setAttribute('height', bh); r.setAttribute('fill', RK_MAP_BENCH); r.setAttribute('stroke', '#1A1A1A'); r.setAttribute('stroke-width', 1); r.style.cursor = o.interactive ? 'pointer' : 'default'; g.appendChild(r);
    addText(gx + bw * 0.55, yb + bh + fs + 1, rk_name(state[4].benchmark));
    if (o.interactive) { r.addEventListener('mouseenter', () => rk_mapDim('bench')); r.addEventListener('mouseleave', () => rk_mapDim(null)); }
  }
}
// Control "Comparar con": Ninguno (= mapa absoluto) o el país de referencia con × para
// volver a absoluto. Reemplaza el toggle Clásico/Comparar: un solo control autoexplicativo.
function rk_renderCompare() {
  const host = document.getElementById('rk-compare-chip'); if (!host) return;
  host.innerHTML = '';
  if (state[4].mapMode === 'bench') {
    const pill = document.createElement('span'); pill.className = 'rk-compare-pill rk-compare-on';
    pill.textContent = rk_name(state[4].benchmark);
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×'; x.setAttribute('aria-label', 'Quitar comparación');
    x.addEventListener('click', () => { state[4].mapMode = 'classic'; drawRanking(); });
    pill.appendChild(x); host.appendChild(pill);
  } else {
    const b = document.createElement('button'); b.className = 'rk-compare-pill rk-compare-none';
    b.textContent = rk_tt('c4-compare-none', 'Ninguno');
    b.addEventListener('click', () => { const s = document.getElementById('rk-search'); if (s) s.focus(); });
    host.appendChild(b);
  }
}

// =================== Títulos dinámicos ===================
function rk_title() {
  // Líneas es temporal → "año a año" (paralelo a "país por país"); barras/mapa comparan países.
  if (rk_view() === 'lines') return rk_tt('c4-title-lines', 'El ingreso por decil, año a año');
  return rk_tt('c4-title', 'El ingreso por decil, país por país');
}
// El subtítulo ENCABEZA con el decil (evocativo) y NO repite "ingreso" ni "por país": eso
// ya lo dice el título. Suma unidad + tiempo (+ continente en el mapa con zoom). En modo
// comparación es un % → sin unidad.
function rk_subtitle() {
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  const lead = rk_cap(rk_decileLabel()), ccy = en ? 'PPP US$' : 'US$ PPA', uw = rk_unitWord();
  if (rk_view() === 'lines') {
    const p = (state[4].period) || [rk_yearMin(), rk_yearMax()];
    return en ? `${lead}, in ${ccy} per ${uw}. ${p[0]}–${p[1]}.` : `${lead}, en ${ccy} por ${uw}. ${p[0]}–${p[1]}.`;
  }
  const cont = (rk_view() === 'map') ? rk_continentName() : '';
  const when = (cont ? cont + ', ' : '') + state[4].year;   // "Europa, 2025" o "2025"
  if (rk_view() === 'map' && state[4].mapMode === 'bench') {
    const b = rk_name(state[4].benchmark);
    return en ? `${lead}, relative to ${b}. ${when}.` : `${lead}, en relación con ${b}. ${when}.`;
  }
  return en ? `${lead}, in ${ccy} per ${uw}. ${when}.` : `${lead}, en ${ccy} por ${uw}. ${when}.`;
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
// Chips ordenados alfabéticamente. En Barras: selección manual (gris, removible) +
// máx/mín dinámicos (gris claro, etiqueta "máx/mín", sin ×). En Líneas: solo la
// selección manual, cada una con su color (= su línea). El color de Líneas se
// asigna por orden alfabético para que coincida con la línea (ver rk_lineColor).
function rk_renderChips() {
  const c = document.getElementById('rk-selected-chips'); if (!c) return;
  c.innerHTML = '';
  const view = rk_view(); if (view === 'map') return;
  let items;
  if (view === 'lines') {
    items = (state[4].linesCountries || []).map(iso => ({ iso }));   // sin máx/mín ni excluidos
  } else {
    const manual = (state[4].selectedCountries || []).filter(iso => !rk_excluded(iso));
    items = manual.map(iso => ({ iso, auto: false }));
    const ext = rk_extremes(state[4].year, rk_deciles(), rk_unit());
    if (ext) {
      if (!rk_excluded(ext.max) && manual.indexOf(ext.max) < 0) items.push({ iso: ext.max, auto: true });
      if (!rk_excluded(ext.min) && manual.indexOf(ext.min) < 0) items.push({ iso: ext.min, auto: true });
      items.forEach(it => {
        if (ext.max === it.iso) it.tag = rk_tt('c4-tag-max', 'máx');
        else if (ext.min === it.iso) it.tag = rk_tt('c4-tag-min', 'mín');
      });
    }
  }
  items.sort((a, b) => rk_name(a.iso).localeCompare(rk_name(b.iso), 'es'));
  items.forEach((it) => {
    const chip = document.createElement('span'); chip.className = 'm-selected-chip';
    chip.style.background = (view === 'lines') ? rk_lineColor(it.iso) : (it.auto ? '#A8A192' : '#6F6A5E');
    chip.style.color = '#fff';
    chip.textContent = rk_name(it.iso) + (it.tag ? ' · ' + it.tag : '');
    const x = document.createElement('button'); x.className = 'm-chip-x'; x.innerHTML = '×';
    x.addEventListener('click', () => rk_removeCountry(it.iso));
    chip.appendChild(x);
    c.appendChild(chip);
  });
}
function rk_removeCountry(iso) {
  const key = rk_listKey();
  if (key === 'selectedCountries' && state[4].excluded) state[4].excluded.add(iso);   // excluido solo aplica a barras/mapa
  state[4][key] = (state[4][key] || []).filter(c2 => c2 !== iso);
  drawRanking();
}
// Color estable por país en Líneas: índice alfabético dentro de la selección.
function rk_lineColor(iso) {
  const ordered = (state[4].linesCountries || []).slice().sort((a, b) => rk_name(a).localeCompare(rk_name(b), 'es'));
  const i = ordered.indexOf(iso);
  return RK_PALETTE[(i < 0 ? 0 : i) % RK_PALETTE.length];
}
function rk_toggleCountry(iso) {
  const key = rk_listKey(), arr = state[4][key] || [];
  if (arr.indexOf(iso) >= 0) { rk_removeCountry(iso); return; }
  if (key === 'selectedCountries' && state[4].excluded) state[4].excluded.delete(iso);   // volver a buscarlo lo reincorpora
  state[4][key] = arr.concat([iso]);
  drawRanking();
}
// El buscador: en mapa+benchmark elige el país de referencia; en el resto, toggle.
function rk_searchPick(iso) {
  if (rk_view() === 'map') { state[4].benchmark = iso; state[4].mapMode = 'bench'; drawRanking(); }   // en mapa, el buscador elige el país a comparar
  else rk_toggleCountry(iso);
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
    results.innerHTML = matches.map((c, i) => `<div class="m-search-result${i === a ? ' m-active' : ''}${rk_sel().indexOf(c.iso) >= 0 ? ' m-already' : ''}" data-iso="${c.iso}"><span>${c.name}</span></div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => el.addEventListener('click', () => { rk_searchPick(el.dataset.iso); input.value = ''; results.classList.remove('open'); input.focus(); }));
  };
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); rk_searchPick(matches[active].iso); input.value = ''; results.classList.remove('open'); }
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
  // Mapa: zoom por continente
  document.querySelectorAll('[data-rk-cont]').forEach(b => b.addEventListener('click', () => {
    state[4].continent = b.dataset.rkCont;
    document.querySelectorAll('[data-rk-cont]').forEach(x => x.classList.toggle('active', x === b));
    drawRanking();
  }));
  // Mapa: toggle de etiquetas de valor sobre los países
  const lblBtn = document.getElementById('rk-maplabels-btn');
  if (lblBtn) lblBtn.addEventListener('click', () => { state[4].mapLabels = !state[4].mapLabels; lblBtn.classList.toggle('active', !!state[4].mapLabels); lblBtn.setAttribute('aria-pressed', state[4].mapLabels ? 'true' : 'false'); drawRanking(); });
  // Deciles
  const decHost = document.getElementById('rk-decile-btns');
  if (decHost) decHost.querySelectorAll('button[data-decile]').forEach(b => b.addEventListener('click', () => rk_toggleDecile(+b.dataset.decile)));
  // Año (slider simple)
  const yr = document.getElementById('rk-year'); const disp = document.getElementById('rk-year-display');
  if (yr) { yr.min = rk_yearMin(); yr.max = rk_yearMax(); yr.value = state[4].year; yr.addEventListener('input', () => { state[4].year = +yr.value; if (disp) disp.textContent = yr.value; drawRanking(); }); }
  // Slider de período (2 thumbs) — Líneas
  rk_setupRange();
}
function rk_setupRange() {
  const from = document.getElementById('rk-range-from'), to = document.getElementById('rk-range-to'), fill = document.getElementById('rk-range-fill');
  if (!from || !to) return;
  const lo = rk_yearMin(), hi = rk_yearMax();
  [from, to].forEach(el => { el.min = lo; el.max = hi; });
  const p = rk_period(); from.value = p[0]; to.value = p[1];
  const paint = () => {
    let a = +from.value, b = +to.value; if (a > b) { const t = a; a = b; b = t; }
    if (fill) { fill.style.left = ((a - lo) / (hi - lo) * 100) + '%'; fill.style.width = ((b - a) / (hi - lo) * 100) + '%'; }
  };
  const onInput = () => {
    let a = +from.value, b = +to.value; if (a > b) { const t = a; a = b; b = t; }
    state[4].period = [a, b]; paint(); drawRanking();
  };
  from.addEventListener('input', onInput); to.addEventListener('input', onInput);
  paint();
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
  if (!s.linesCountries) s.linesCountries = RK_LINES_DEFAULT.slice();   // líneas: pocas por default (≤4)
  if (!s.period) s.period = [rk_yearMin(), rk_yearMax()];
  if (!s.benchmark) s.benchmark = 'USA';
  if (!s.continent) s.continent = 'all';
  if (!s.mapMode) s.mapMode = 'classic';
  if (s.mapLabels == null) s.mapLabels = false;
  if (!(s.excluded instanceof Set)) s.excluded = new Set(s.excluded || []);   // países que el user sacó (no reaparecen como máx/mín)

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
  // png-export llama esto ANTES de leer el SVG: re-renderiza el mapa al aspecto del
  // continente (bien encuadrado, cifras grandes) para el PNG. Restore vuelve al interactivo.
  window.onBeforePngExportPrepare = function (id) {
    if (String(id) === '4' && rk_view() === 'map') { rk_pngExporting = true; drawRanking(); return true; }
    return false;
  };
  window.onAfterPngExportRestore = function () {
    if (rk_pngExporting) { rk_pngExporting = false; drawRanking(); }
  };
}
