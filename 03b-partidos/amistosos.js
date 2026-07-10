// =============================================================
//  Especial partidos — Chart 2: el amistoso pierde terreno
// =============================================================
// Área apilada de la composición del calendario por tipo de partido.
// Ámbito filtrable (default Mundo; se puede elegir una confederación o una
// selección con el buscador). Toggle % / cantidad. Promedio móvil con
// selector de años (default 4). Datos: DATA_TIPOS.

const AM_XMIN_DEF = 1946, AM_XMAX = 2025;

// Paleta de los apilados del N°3 (dts.js): estándar del Atlas + gris para
// "Otros". El orden del apilado va de abajo (Amistoso) hacia arriba.
const AM_CATS = [
  { key: 'Amistoso',                 i18n: 'c2-cat-Amistoso',               color: '#234B85' },
  { key: 'Eliminatoria del Mundial', i18n: 'c2-cat-EliminatoriaMundial',    color: '#2D6A3D' },
  { key: 'Mundial',                  i18n: 'c2-cat-Mundial',                color: '#C9A227' },
  { key: 'Eliminatoria continental', i18n: 'c2-cat-EliminatoriaContinental', color: '#6B3D8B' },
  { key: 'Copa continental',         i18n: 'c2-cat-CopaContinental',        color: '#2C8484' },
  { key: 'Liga de Naciones',         i18n: 'c2-cat-LigaNaciones',           color: '#7A2A3F' },
  { key: 'Otros torneos',            i18n: 'c2-cat-Otros',                  color: '#CFC9BC' },
];

// El desglose por selección (data-tipos-teams.js, ~230KB) NO se carga con la
// página: se trae BAJO DEMANDA la primera vez que el usuario toca el buscador.
// Así el chart (Mundo) dibuja al toque con un archivo chico, y lo de países
// solo pesa si hace falta. am_ensureTeams inyecta el script una sola vez.
let am_byName = null, am_teamsLoading = false;
function am_teams() {
  return (typeof DATA_TIPOS_TEAMS !== 'undefined') ? DATA_TIPOS_TEAMS : [];
}
function am_initData() {
  if (am_byName) return;
  const ts = am_teams();
  if (!ts.length) return;               // todavía no cargó el archivo de selecciones
  am_byName = {};
  ts.forEach(tm => { am_byName[tm.n] = tm; });
}
function am_ensureTeams(cb) {
  if (typeof DATA_TIPOS_TEAMS !== 'undefined') { am_initData(); if (cb) cb(); return; }
  if (am_teamsLoading) { return; }
  am_teamsLoading = true;
  const sc = document.createElement('script');
  sc.src = './data-tipos-teams.js?v=' + (window.__ESP_V || '1');
  sc.onload = () => { am_byName = null; am_initData(); if (cb) cb(); };
  document.head.appendChild(sc);
}

const AM_PERIOD_DEF = [1950, 2025];   // vista por default (el dato llega a 1872)
const AM_MIN_WINDOW = 6;

function am_state() {
  if (!state[2]) state[2] = {};
  const s = state[2];
  if (!s.mode) s.mode = 'share';                 // 'share' | 'count'
  if (!s.smooth) s.smooth = 'ma';                // 'raw' | 'ma'
  if (!s.maYears) s.maYears = 4;
  if (!s.scope) s.scope = { kind: 'mundo' };     // {kind:'mundo'} | {kind:'conf',id} | {kind:'team',id}
  if (!s.period) s.period = AM_PERIOD_DEF.slice();
  return s;
}

function am_isDefault() {
  const s = am_state();
  return s.scope.kind === 'mundo' && s.mode === 'share'
    && s.smooth === 'ma' && s.maYears === 4
    && s.period[0] === AM_PERIOD_DEF[0] && s.period[1] === AM_PERIOD_DEF[1];
}

function am_scopeLabel() {
  const s = am_state();
  if (s.scope.kind === 'mundo') return t('c1-serie-total');
  if (s.scope.kind === 'conf') return t('conf.' + s.scope.id);
  return (typeof atlasCountryName === 'function') ? atlasCountryName(s.scope.id) : s.scope.id;
}

// Cuenta cruda por categoría para el ámbito elegido: {cat: [n por anio]} denso
// sobre los años de DATA_TIPOS. Devuelve también el primer año con datos.
function am_scopeCounts() {
  const s = am_state();
  const D = DATA_TIPOS;
  const anios = D.anios;
  const out = {};
  let first = null;
  if (s.scope.kind === 'mundo') {
    AM_CATS.forEach(c => out[c.key] = (D.mundo[c.key] || anios.map(() => 0)).slice());
  } else if (s.scope.kind === 'conf') {
    const src = D.porConf[s.scope.id] || {};
    AM_CATS.forEach(c => out[c.key] = (src[c.key] || anios.map(() => 0)).slice());
  } else {
    am_initData();
    const tm = am_byName[s.scope.id];
    AM_CATS.forEach(c => out[c.key] = anios.map(() => 0));
    // el dato viene con la categoría como índice (0..6, posición en AM_CATS)
    if (tm) AM_CATS.forEach((c, ci) => {
      (tm.cats[ci] || []).forEach(([y, n]) => {
        const i = anios.indexOf(y);
        if (i >= 0) out[c.key][i] = n;
      });
    });
  }
  // primer año con algún partido (para arrancar el eje ahí en país/confed)
  for (let i = 0; i < anios.length; i++) {
    if (AM_CATS.some(c => out[c.key][i] > 0)) { first = anios[i]; break; }
  }
  return { anios, counts: out, first: first || anios[0] };
}

// Promedio móvil hacia atrás de w años (w=1 => crudo), como el mm4 de la casa.
function am_ma(arr, w) {
  if (w <= 1) return arr.slice();
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let acc = 0, k = 0;
    for (let j = Math.max(0, i - w + 1); j <= i; j++) { acc += arr[j]; k++; }
    out[i] = acc / k;
  }
  return out;
}

function drawAmistosos() {
  const s = am_state();
  const { anios, counts } = am_scopeCounts();
  const w = s.smooth === 'ma' ? s.maYears : 1;
  const share = s.mode === 'share';

  // solo las categorías con algún partido en este ámbito (Argentina no tiene
  // eliminatorias continentales, así que esa banda no aparece)
  const cats = AM_CATS.filter(c => counts[c.key].some(v => v > 0));

  // suavizo cada categoría y armo el total por año
  const sm = {};
  cats.forEach(c => sm[c.key] = am_ma(counts[c.key], w));
  const total = anios.map((_, i) => cats.reduce((a, c) => a + sm[c.key][i], 0));

  const val = (catKey, i) => {
    const v = sm[catKey][i];
    return share ? (total[i] > 0 ? v / total[i] * 100 : 0) : v;
  };

  tsDraw(2, {
    svgId: 'chart2', tooltipId: 'tooltip2', mode: 'stack',
    xMin: s.period[0], xMax: s.period[1],
    yMax: share ? 100 : 'auto',
    yFmt: (v) => share ? v + '%' : fmt(v),
    axisY: t(share ? 'c2-axis-share' : 'c2-axis-count'),
    stack: {
      anios,
      cats: cats.map(c => ({ key: c.key, label: t(c.i18n), color: c.color })),
      val,
      total: (i) => share ? 100 : total[i],
    },
    ttRows: (year) => {
      const i = anios.indexOf(year);
      if (i < 0 || !total[i]) return null;
      const rows = cats.map(c => {
        const v = val(c.key, i);
        return { label: t(c.i18n), color: c.color, v: share ? v.toFixed(0) + '%' : fmt(Math.round(v)), raw: v };
      }).filter(r => r.raw > 0.05).sort((a, b) => b.raw - a.raw);
      rows.push({ label: t('c2-tt-total'), color: null, v: fmt(Math.round(total[i])) });
      return rows;
    },
  });

  // subtítulo por estado
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (aeCfg && aeCfg.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const subEl = document.querySelector('.chart-block[data-chart="2"] .chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) {
    let base = am_isDefault()
      ? t('c2-subtitle')
      : (s.scope.kind === 'mundo' ? t('c2-subtitle-neutral')
        : t('c2-subtitle-scope').replace('{scope}', am_scopeLabel()));
    // reflejar el suavizado en el subtítulo (así también sale en el PNG)
    if (s.smooth === 'ma') base += ' ' + t('c2-sub-ma').replace('{n}', s.maYears);
    subEl.textContent = base;
  }
  atlasSetHeading('2', am_isDefault(), { title: 'c2-title', titleNeutral: 'c2-title-neutral' });

  // visibilidad del selector de años
  const maGroup = document.getElementById('am-ma-group');
  if (maGroup) maGroup.style.display = (s.smooth === 'ma') ? '' : 'none';
}

//==================================================================
//  Ámbito: chip + buscador (single-select, default Mundo)
//==================================================================
function am_renderChip() {
  const c = document.getElementById('am-scope-chip'); if (!c) return;
  const s = am_state();
  c.innerHTML = '';
  // Siempre hay un chip del ámbito (Mundo por default, gris carbón), para que
  // sea consistente con el chart 1. La × de un ámbito elegido vuelve a Mundo.
  // Regla de selección (criterio 11): "Mundo" es el PISO de este single-select,
  // así que su chip va SIN × — una × que no saca nada simula removibilidad.
  const chip = document.createElement('span');
  chip.className = 'm-selected-chip';
  chip.style.background = s.scope.kind === 'conf' ? CONF_FIFA_COLORS[s.scope.id] : '#33312C';
  chip.textContent = am_scopeLabel();
  if (s.scope.kind !== 'mundo') {
    const x = document.createElement('button');
    x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', t('chip-remove'));
    x.addEventListener('click', () => { am_setScope({ kind: 'mundo' }); });
    chip.appendChild(x);
  }
  c.appendChild(chip);
}

// Cambia el ámbito y ajusta el período: mundo/confederación desde 1946; una
// selección desde su primer partido (para no dejar años vacíos a la izquierda).
function am_setScope(scope) {
  const s = am_state();
  s.scope = scope;
  if (scope.kind === 'team') {
    const first = am_scopeCounts().first;
    s.period = [first, AM_PERIOD_DEF[1]];
  } else {
    s.period = AM_PERIOD_DEF.slice();
  }
  am_syncSlider();
  am_renderChip();
  drawAmistosos();
}

function am_norm(x) { return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

function setupAmistososSearch() {
  const input = document.getElementById('am-search'), results = document.getElementById('am-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;
  function universo() {
    am_initData();
    const confs = CONF_FIFA_ORDER.map(cf => ({
      id: cf, kind: 'conf', name: t('conf.' + cf) + ' · ' + t('conf-long.' + cf), extra: '',
    }));
    const teams = am_teams().map(tm => ({
      id: tm.n, kind: 'team',
      name: (typeof atlasCountryName === 'function') ? atlasCountryName(tm.n) : tm.n,
      extra: t('conf.' + tm.c),
    }));
    return confs.concat(teams);
  }
  function get(q) {
    if (!q) return [];
    const qn = am_norm(q);
    return universo().filter(u => am_norm(u.name).includes(qn)).slice(0, 8);
  }
  function elegir(u) {
    input.value = ''; results.classList.remove('open');
    am_setScope({ kind: u.kind, id: u.id });
  }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((u, i) =>
      `<div class="m-search-result${i === a ? ' m-active' : ''}" data-i="${i}">` +
      `<span>${u.name}</span><span style="opacity:.6;">${u.extra}</span></div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result').forEach((el, i) => el.addEventListener('click', () => elegir(matches[i])));
  }
  // al tocar el buscador, traer el archivo de selecciones (bajo demanda)
  input.addEventListener('focus', () => am_ensureTeams(() => {
    if (input.value) { matches = get(input.value); active = matches.length ? 0 : -1; render(active); }
  }));
  input.addEventListener('input', () => {
    // si el archivo de selecciones aún no llegó, se dispara ahora y al terminar
    // re-renderiza los resultados con las selecciones incluidas
    am_ensureTeams(() => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
    matches = get(input.value); active = matches.length ? 0 : -1; render(active);
  });
  input.addEventListener('keydown', (ev) => {
    if (!results.classList.contains('open')) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % matches.length; render(active); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(active); }
    else if (ev.key === 'Enter' && active >= 0) { ev.preventDefault(); elegir(matches[active]); }
    else if (ev.key === 'Escape') { results.classList.remove('open'); input.blur(); }
  });
  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) results.classList.remove('open');
  });
}

//==================================================================
//  Slider temporal (doble thumb, patrón del chart 1)
//==================================================================
function am_syncSlider() {
  const s = am_state();
  const fromEl = document.getElementById('am-slider-from');
  const toEl = document.getElementById('am-slider-to');
  const dispEl = document.getElementById('am-range-display');
  const trackActiveEl = document.getElementById('am-range-track-active');
  if (!fromEl || !toEl) return;
  fromEl.value = s.period[0]; toEl.value = s.period[1];
  if (dispEl) dispEl.textContent = `${s.period[0]}–${s.period[1]}`;
  if (trackActiveEl) {
    const min = parseInt(fromEl.min, 10), max = parseInt(fromEl.max, 10), span = max - min;
    if (span > 0) {
      trackActiveEl.style.left = ((s.period[0] - min) / span) * 100 + '%';
      trackActiveEl.style.right = ((max - s.period[1]) / span) * 100 + '%';
    }
  }
}

function setupAmistososSlider() {
  const s = am_state();
  const fromEl = document.getElementById('am-slider-from');
  const toEl = document.getElementById('am-slider-to');
  if (!fromEl || !toEl) return;
  fromEl.addEventListener('input', () => {
    let from = parseInt(fromEl.value, 10); const to = s.period[1];
    if (from > to - AM_MIN_WINDOW) from = to - AM_MIN_WINDOW;
    s.period = [from, to]; am_syncSlider(); drawAmistosos();
  });
  toEl.addEventListener('input', () => {
    const from = s.period[0]; let to = parseInt(toEl.value, 10);
    if (to < from + AM_MIN_WINDOW) to = from + AM_MIN_WINDOW;
    s.period = [from, to]; am_syncSlider(); drawAmistosos();
  });
  am_syncSlider();
}

//==================================================================
//  CSV + init
//==================================================================
function setupAmistososCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_TIPOS;
    let csv = 'ambito,anio,' + AM_CATS.map(c => c.key.replace(/[ ,]/g, '_')).join(',') + '\n';
    D.anios.forEach((a, i) => {
      csv += 'mundo,' + a + ',' + AM_CATS.map(c => (D.mundo[c.key] || [])[i] || 0).join(',') + '\n';
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-tipos-de-partido.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initAmistosos() {
  am_state();
  am_initData();
  document.querySelectorAll('#am-mode button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#am-mode button').forEach(x => x.classList.toggle('active', x === b));
    state[2].mode = b.dataset.mode; drawAmistosos();
  }));
  document.querySelectorAll('#am-smooth button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#am-smooth button').forEach(x => x.classList.toggle('active', x === b));
    state[2].smooth = b.dataset.smooth; drawAmistosos();
  }));
  const slider = document.getElementById('am-ma');
  if (slider) {
    slider.value = state[2].maYears;
    slider.addEventListener('input', () => {
      state[2].maYears = +slider.value;
      const v = document.getElementById('am-ma-val'); if (v) v.textContent = slider.value;
      drawAmistosos();
    });
  }
  setupAmistososSearch();
  setupAmistososSlider();
  am_renderChip();
  drawAmistosos();
  setupAmistososCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initAmistosos._wired) {
    initAmistosos._wired = true;
    window.addEventListener('atlas-editor-change', () => drawAmistosos());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawAmistosos;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '2') return null;
    return (typeof t === 'function' ? t('c2-sources-tpl') : '') || null;
  };
}
