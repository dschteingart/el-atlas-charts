// =============================================================
//  Especial partidos — Chart 1: el planeta se llenó de fútbol
// =============================================================
// Tres métricas conmutables:
//   partidos   partidos por año. Mundo como chip removible + buscador de
//              selecciones (cuántos partidos jugó cada una, estilo OWID).
//   activas    selecciones con actividad. Mundo removible + buscador de
//              confederaciones.
//   debut      selecciones que debutan. Filtro de confederación (línea
//              única) y tooltip que lista QUIÉNES debutaron ese año.
// Slider temporal doble (patrón del chart de trayectorias del N°3).
// Datos: DATA_ACTIVIDAD (data-partidos.js).

// Mundo = el total. Gris carbón cálido, distinto de las 6 confederaciones
// (antes era terracota y chocaba con CONMEBOL, que es terracota protagonista).
const AC_COL_WORLD = '#33312C';
const AC_YEAR_MIN = 1872, AC_YEAR_MAX = 2025;
const AC_PERIOD_DEFAULT = [1900, 2025];
const AC_MIN_WINDOW = 8;

// Paleta estándar del Atlas para multiserie (la misma del chart de
// trayectorias del N°3 y del chart 3 del N°2).
const AC_PALETTE = [
  '#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
  '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'
];
const ac_colorForSlot = (slot) => AC_PALETTE[slot % AC_PALETTE.length];

let ac_byName = null;
function ac_initData() {
  // no cachear un indice vacio si el dato todavia no cargo (robustez)
  if (typeof DATA_ACTIVIDAD === 'undefined') return;
  if (ac_byName) return;
  ac_byName = {};
  (DATA_ACTIVIDAD.porEquipo || []).forEach(tm => { ac_byName[tm.n] = tm; });
}

function ac_state() {
  if (!state[1]) state[1] = {};
  const s = state[1];
  if (!s.metric) s.metric = 'partidos';
  if (!s.period) s.period = AC_PERIOD_DEFAULT.slice();
  if (s.mundo === undefined) s.mundo = true;
  if (!(s.teams instanceof Map)) s.teams = new Map(s.teams || []);
  if (!(s.confs instanceof Map)) s.confs = new Map(s.confs || []);
  if (!s.debConf) s.debConf = 'ALL';
  return s;
}

function ac_isDefault() {
  const s = ac_state();
  return s.metric === 'partidos' && s.mundo && s.teams.size === 0
    && s.period[0] === AC_PERIOD_DEFAULT[0] && s.period[1] === AC_PERIOD_DEFAULT[1];
}

function ac_nextSlot(map) {
  const used = new Set(map.values());
  let i = 0; while (used.has(i)) i++; return i;
}

// nombre visible de una selección: SIEMPRE en el idioma de la página
// (regla de la casa; atlasCountryName vive en i18n-issue.js).
function ac_teamName(n) {
  return (typeof atlasCountryName === 'function') ? atlasCountryName(n) : n;
}

// Rellena con 0 los años sin partidos DENTRO de la vida de la selección (de su
// primer a su último partido), para que la línea baje a cero en vez de saltear
// el hueco. Antes del debut no dibuja nada (la selección no existía todavía).
function ac_densify(sparse) {
  if (!sparse || !sparse.length) return sparse || [];
  const m = new Map(sparse.map(p => [p[0], p[1]]));
  const y0 = sparse[0][0], y1 = sparse[sparse.length - 1][0];
  const dense = [];
  for (let y = y0; y <= y1; y++) dense.push([y, m.get(y) || 0]);
  return dense;
}

//==================================================================
//  Series por métrica
//==================================================================
function ac_series() {
  const s = ac_state();
  const D = DATA_ACTIVIDAD;
  ac_initData();
  const pair = (arr) => D.anios.map((a, i) => [a, arr[i]]);
  const out = [];

  if (s.metric === 'partidos') {
    if (s.mundo) out.push({ key: '__world', label: t('c1-serie-total'), color: AC_COL_WORLD, width: 1.6, pts: pair(D.partidos) });
    s.teams.forEach((slot, name) => {
      const tm = ac_byName[name]; if (!tm) return;
      out.push({ key: name, label: ac_teamName(name), color: ac_colorForSlot(slot), pts: ac_densify(tm.s) });
    });
  } else if (s.metric === 'activas') {
    if (s.mundo) out.push({ key: '__world', label: t('c1-serie-total'), color: AC_COL_WORLD, width: 1.6, pts: pair(D.activas) });
    s.confs.forEach((_slot, cf) => {
      out.push({ key: cf, label: t('conf.' + cf), color: CONF_FIFA_COLORS[cf], pts: pair(D.porConf[cf].activas) });
    });
  } else {
    // debut: línea única (Mundo o la confederación elegida)
    if (s.debConf === 'ALL') {
      out.push({ key: '__world', label: t('c1-serie-total'), color: AC_COL_WORLD, width: 1.4, pts: pair(D.debutantes) });
    } else {
      const deb = D.debutNombres || {};
      const pts = D.anios.map(a => {
        const lst = deb[a] || [];
        return [a, lst.filter(e => e[1] === s.debConf).length];
      });
      out.push({ key: s.debConf, label: t('conf.' + s.debConf), color: CONF_FIFA_COLORS[s.debConf], width: 1.4, pts });
    }
  }
  return out;
}

//==================================================================
//  Draw
//==================================================================
function drawActividad() {
  const s = ac_state();
  ac_initData();
  const axisKey = s.metric === 'partidos' ? 'c1-axis-partidos'
    : s.metric === 'debut' ? 'c1-axis-debut' : 'c1-axis-activas';
  let series = ac_series();
  // Guardia anti gráfico vacío: si el usuario sacó Mundo en otra métrica y
  // acá no queda ninguna serie, Mundo vuelve solo (nunca un chart en blanco).
  if (!series.length) {
    s.mundo = true;
    ac_renderChips();
    series = ac_series();
  }
  const D = DATA_ACTIVIDAD;
  const deb = D.debutNombres || {};

  tsDraw(1, {
    svgId: 'chart1', tooltipId: 'tooltip1', mode: 'lines',
    xMin: s.period[0], xMax: s.period[1], yMax: 'auto',
    yFmt: (v) => fmt(v), axisY: t(axisKey),
    series,
    endValFmt: (v) => fmt(v),
    ttRows: (year) => {
      if (s.metric === 'debut') {
        const lst = (deb[year] || []).filter(e => s.debConf === 'ALL' || e[1] === s.debConf);
        if (!lst.length) return [{ label: t('c1-tt-debut-none'), color: '#9a9488', v: '' }];
        const serie = series[0];
        const rows = [{ label: serie.label, color: serie.color, v: fmt(lst.length) }];
        // Criterio UX: con Mundo, el puntito de color dice la confederación de
        // cada debutante (informa). Filtrado a UNA confederación, el color se
        // repetiría en todas las filas: los nombres van sin puntito.
        const dotColor = (e) => s.debConf === 'ALL' ? (CONF_FIFA_COLORS[e[1]] || '#9a9488') : null;
        lst.slice(0, 12).forEach(e => rows.push({ label: ac_teamName(e[0]), color: dotColor(e), v: '' }));
        if (lst.length > 12) rows.push({ label: `+${lst.length - 12} ${t('c1-tt-debut-mas')}`, color: null, v: '' });
        return rows;
      }
      return series.map(sr => {
        const p = sr.pts.find(q => q[0] === year);
        return p && p[1] != null ? { label: sr.label, color: sr.color, v: fmt(p[1]) } : null;
      }).filter(Boolean);
    },
  });

  // subtítulo descriptivo por métrica (con variante si hay selecciones buscadas)
  const subKey = s.metric === 'partidos'
    ? (s.teams.size ? 'c1-sub-partidos-eq' : 'c1-sub-partidos')
    : s.metric === 'debut' ? 'c1-sub-debut' : 'c1-sub-activas';
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const lang = (aeCfg && aeCfg.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (aeCfg && aeCfg.texts && aeCfg.texts[lang]) || {};
  const subEl = document.querySelector('.chart-block[data-chart="1"] .chart-subtitle');
  if (subEl && !(tx.subtitle || '').trim()) subEl.textContent = t(subKey);

  atlasSetHeading('1', ac_isDefault(), { title: 'c1-title', titleNeutral: 'c1-title-neutral' });

  // visibilidad de controles según métrica
  const searchWrap = document.getElementById('ac-search-wrap');
  if (searchWrap) searchWrap.style.display = (s.metric === 'debut') ? 'none' : '';
  const debGroup = document.getElementById('ac-debut-group');
  if (debGroup) debGroup.style.display = (s.metric === 'debut') ? '' : 'none';
  const input = document.getElementById('ac-search');
  if (input) {
    const ph = s.metric === 'activas' ? 'c1-search-placeholder-conf' : 'c1-search-placeholder';
    input.placeholder = t(ph);
  }
}

//==================================================================
//  Chips (Mundo + selecciones o confederaciones)
//==================================================================
function ac_renderChips() {
  const c = document.getElementById('ac-selected-chips'); if (!c) return;
  const s = ac_state();
  c.innerHTML = '';
  if (s.metric === 'debut') return;

  const mk = (label, color, onRemove) => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    chip.style.background = color;
    chip.textContent = label;
    const x = document.createElement('button');
    x.className = 'm-chip-x'; x.innerHTML = '×';
    x.setAttribute('aria-label', t('chip-remove'));
    x.addEventListener('click', onRemove);
    chip.appendChild(x);
    c.appendChild(chip);
  };

  if (s.mundo) mk(t('c1-serie-total'), AC_COL_WORLD, () => { s.mundo = false; ac_renderChips(); drawActividad(); });
  if (s.metric === 'partidos') {
    s.teams.forEach((slot, name) => mk(ac_teamName(name), ac_colorForSlot(slot),
      () => { s.teams.delete(name); ac_renderChips(); drawActividad(); }));
  } else {
    s.confs.forEach((_slot, cf) => mk(t('conf.' + cf), CONF_FIFA_COLORS[cf],
      () => { s.confs.delete(cf); ac_renderChips(); drawActividad(); }));
  }
}

//==================================================================
//  Buscador (selecciones en "partidos", confederaciones en "activas")
//==================================================================
function ac_norm(x) { return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

function setupActividadSearch() {
  const input = document.getElementById('ac-search'), results = document.getElementById('ac-search-results');
  if (!input || !results) return;
  let matches = [], active = -1;

  function universo() {
    const s = ac_state();
    // "Mundo" reaparece en el buscador si el usuario sacó su chip
    const mundo = s.mundo ? [] : [{ id: '__world', name: t('c1-serie-total'), extra: '', world: true }];
    if (s.metric === 'activas') {
      return mundo.concat(CONF_FIFA_ORDER.map(cf => ({
        id: cf, name: t('conf.' + cf) + ' · ' + t('conf-long.' + cf), extra: '', conf: true,
      })));
    }
    ac_initData();
    return mundo.concat(DATA_ACTIVIDAD.porEquipo.map(tm => ({
      id: tm.n, name: ac_teamName(tm.n), extra: tm.c, conf: false,
    })));
  }
  function get(q) {
    if (!q) return [];
    const qn = ac_norm(q);
    // matchea en el idioma de la página Y en inglés (el nombre del dato)
    return universo().filter(u =>
      ac_norm(u.name).includes(qn) || ac_norm(String(u.id)).includes(qn)
    ).slice(0, 8);
  }
  function elegir(u) {
    const s = ac_state();
    if (u.world) s.mundo = true;
    else if (u.conf) { if (!s.confs.has(u.id)) s.confs.set(u.id, ac_nextSlot(s.confs)); }
    else { if (!s.teams.has(u.id)) s.teams.set(u.id, ac_nextSlot(s.teams)); }
    input.value = ''; results.classList.remove('open');
    ac_renderChips(); drawActividad();
  }
  function render(a) {
    if (!matches.length) { results.innerHTML = ''; results.classList.remove('open'); return; }
    results.innerHTML = matches.map((u, i) =>
      `<div class="m-search-result${i === a ? ' m-active' : ''}" data-id="${u.id}">` +
      `<span>${u.name}</span><span style="opacity:.6;">${u.extra}</span></div>`).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result').forEach((el, i) =>
      el.addEventListener('click', () => elegir(matches[i])));
  }
  input.addEventListener('input', () => { matches = get(input.value); active = matches.length ? 0 : -1; render(active); });
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
//  Slider de período (doble thumb, patrón trayectorias N°3)
//==================================================================
function setupActividadSlider() {
  const s = ac_state();
  const fromEl = document.getElementById('ac-slider-from');
  const toEl = document.getElementById('ac-slider-to');
  const dispEl = document.getElementById('ac-range-display');
  const trackActiveEl = document.getElementById('ac-range-track-active');
  if (!fromEl || !toEl || !dispEl) return;

  function updateDisplay() {
    const [a, b] = s.period;
    dispEl.textContent = `${a}–${b}`;
    if (trackActiveEl) {
      const min = parseInt(fromEl.min, 10), max = parseInt(fromEl.max, 10), span = max - min;
      if (span > 0) {
        trackActiveEl.style.left = ((a - min) / span) * 100 + '%';
        trackActiveEl.style.right = ((max - b) / span) * 100 + '%';
      }
    }
  }
  function syncInputs() { fromEl.value = s.period[0]; toEl.value = s.period[1]; }
  fromEl.addEventListener('input', () => {
    let from = parseInt(fromEl.value, 10); const to = s.period[1];
    if (from > to - AC_MIN_WINDOW) from = to - AC_MIN_WINDOW;
    s.period = [from, to]; syncInputs(); updateDisplay(); drawActividad();
  });
  toEl.addEventListener('input', () => {
    const from = s.period[0]; let to = parseInt(toEl.value, 10);
    if (to < from + AC_MIN_WINDOW) to = from + AC_MIN_WINDOW;
    s.period = [from, to]; syncInputs(); updateDisplay(); drawActividad();
  });
  syncInputs(); updateDisplay();
}

//==================================================================
//  CSV + init
//==================================================================
function setupActividadCSV() {
  document.querySelectorAll('button.download[data-chart="1-csv"]').forEach(btn => btn.addEventListener('click', () => {
    const D = DATA_ACTIVIDAD;
    let csv = 'anio,partidos,selecciones_activas,debutantes\n';
    D.anios.forEach((a, i) => { csv += `${a},${D.partidos[i]},${D.activas[i]},${D.debutantes[i]}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'el-atlas-especial-actividad.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }));
}

function initActividad() {
  const s = ac_state();
  ac_initData();
  document.querySelectorAll('#ac-metric button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ac-metric button').forEach(x => x.classList.toggle('active', x === b));
    s.metric = b.dataset.metric;
    ac_renderChips();
    drawActividad();
  }));
  document.querySelectorAll('#ac-debut button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('#ac-debut button').forEach(x => x.classList.toggle('active', x === b));
    s.debConf = b.dataset.conf;
    drawActividad();
  }));
  setupActividadSlider();
  setupActividadSearch();
  ac_renderChips();
  drawActividad();
  setupActividadCSV();
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initActividad._wired) {
    initActividad._wired = true;
    window.addEventListener('atlas-editor-change', () => drawActividad());
  }
  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawActividad;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '1') return null;
    return (typeof t === 'function' ? t('c1-sources-tpl') : '') || null;
  };
}
