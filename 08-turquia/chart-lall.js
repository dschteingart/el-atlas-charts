// Exportaciones de bienes por contenido tecnológico (clasificación de Lall), en áreas apiladas al 100%, un panel por país.
// Vista de fábrica: Turquía, México, Brasil y Argentina, 1980-2024 (2×2 en el PNG cuadrado).
// Base, grupos, nombres y colores: los del gráfico de exportaciones del N°6 (06-brasil/chart-exportaciones.js, C2_CATS;
// la base es la misma, copiada sin cambios a data-lall.js por insumos/#8 - Turquia/scripts/build_lall.py). A pedido de
// Daniel (20/11/2026) el grupo «otros» de Lall (electricidad, materiales radiactivos, monedas) no se dibuja y las
// participaciones se calculan netas de él: las cinco bandas suman 100% (clall_val). La base queda intacta.
// Motor: relStack (tur-motor.js, el de chart-canasta y 07-religion/chart-practicantes): paneles con la misma escala,
// leyenda dentro del SVG, hover/tap que resalta un grupo en todos los paneles, crosshair por panel con la composición del
// año; un solo país = vista grande con etiquetas a la derecha y el valor de las puntas dentro de cada banda.
// Controles: buscador + chips + Limpiar (brSelector) y slider de período universal (brPeriod).
// Datos: TUR_LALL. Vista compartible TODO-O-NADA: ?paises=TUR~KOR&periodo=1962~2024 (- = selección vacía).
const CLALL_ID = 'lall';
// [clave, color] de C2_CATS del N°6, sin «otros»
const CLALL_CATS = [['pp', '#2D6A3D'], ['rrnn', '#6CB04D'], ['baja', '#C9A227'], ['media', '#1F8AC0'], ['alta', '#234B85']];
// valor dentro de la banda en la vista de un solo país: texto blanco sobre los tonos oscuros, tinta sobre los claros
const CLALL_VAL = { pp: '#FFFFFF', rrnn: '#1A1A1A', baja: '#1A1A1A', media: '#FFFFFF', alta: '#FFFFFF' };
const CLALL_D = TUR_LALL, CLALL_Y = CLALL_D.years;
const CLALL_MIN = CLALL_Y[0], CLALL_MAX = CLALL_Y[CLALL_Y.length - 1];
const CLALL_DEF = { sel: ['TUR', 'MEX', 'BRA', 'ARG'], p: [1980, CLALL_MAX] };
const CLALL_CHIP = { TUR: '#234B85', latam: '#BE5D32', otro: '#33312C' };
let clall_urlWired = false, clall_selector = null, clall_period = null;

function clall_state() { if (!state[CLALL_ID]) state[CLALL_ID] = { sel: CLALL_DEF.sel.slice(), p: CLALL_DEF.p.slice() }; return state[CLALL_ID]; }
// el orden de los paneles es parte de la vista: Turquía primero
function clall_isDefault(s) {
  return s.sel.length === CLALL_DEF.sel.length && s.sel.every((k, i) => k === CLALL_DEF.sel[i]) && s.p[0] === CLALL_DEF.p[0] && s.p[1] === CLALL_DEF.p[1];
}
// participación del grupo en el año i, neta de «otros»: sobre la suma de los cinco grupos (null si no hay dato)
function clall_raw(k, cat, i) { const v = ((CLALL_D.g[k] || {})[cat] || [])[i]; return v == null ? 0 : v / (CLALL_D.escala || 1); }
function clall_val(k, cat, i) {
  if ((CLALL_D.tot[k] || [])[i] == null) return null;
  const net = CLALL_CATS.reduce((a, c) => a + clall_raw(k, c[0], i), 0);
  return net > 0 ? clall_raw(k, cat, i) / net * 100 : null;
}
// años con dato del país dentro del período
function clall_idx(s, k) {
  const out = [];
  CLALL_Y.forEach((y, i) => { if (y >= s.p[0] && y <= s.p[1] && clall_val(k, 'pp', i) != null) out.push(i); });
  return out;
}
function clall_cats() {
  return CLALL_CATS.map(c => ({ key: c[0], label: t('lall-' + c[0]), color: c[1], valColor: CLALL_VAL[c[0]] }));
}
function clall_universe() {
  return Object.keys(CLALL_D.g).map(k => ({ key: k, label: br_name(k), tag: CLALL_D.reg[k] ? t('tur-reg-' + CLALL_D.reg[k]) : '' }))
    .sort((a, b) => a.label.localeCompare(b.label, br_lang()));
}
function clall_panels(s) {
  const cats = clall_cats();
  return s.sel.filter(k => CLALL_D.g[k]).map(k => {
    const ix = clall_idx(s, k);
    return { key: k, label: br_name(k), w: ix.map(i => CLALL_Y[i]), tot: ix.map(() => 100),
             cats: cats.map(c => Object.assign({ vals: ix.map(i => clall_val(k, c.key, i)) }, c)) };
  }).filter(p => p.w.length > 1);
}
function drawClall() {
  const s = clall_state(), svg = document.getElementById('chart' + CLALL_ID);
  if (!svg) return;
  const panels = clall_panels(s);
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  atlasSetHeading(CLALL_ID, clall_isDefault(s), { title: 'clall-title', titleNeutral: 'clall-title-neutral' });
  // período del dato real de los paneles a la vista
  const ys = panels.flatMap(p => [p.w[0], p.w[p.w.length - 1]]);
  const P = ys.length ? Math.min.apply(null, ys) + '-' + Math.max.apply(null, ys) : s.p[0] + '-' + s.p[1];
  // con un solo panel, el subtítulo dice de qué país es el dato (el PNG no lleva chips ni título de panel)
  const lugar = panels.length === 1 ? panels[0].label : null;
  brSetSubtitle(CLALL_ID, (lugar ? t('clall-sub-lugar').replace('{L}', lugar) : t('clall-sub')).replace('{P}', P));
  relStack({
    svg, id: CLALL_ID, L: rel_layout(CLALL_ID), panels, cats: clall_cats(), noTotal: true, xMid: [1995, 2010],
    cols: (n) => n === 4 ? 2 : null,   // el PNG con los cuatro de fábrica va en 2×2 (con la leyenda de seis grupos, el motor elegía 3 columnas)
    yFmt: (v) => br_fmt(v, 0) + '%', ttFmt: (v) => br_fmt(v, 1) + '%', emptyText: t(s.sel.length ? 'tur-sin-dato' : 'tur-vacio')
  });
  // TODO-O-NADA: la vista de fábrica viaja como URL limpia; cualquier desvío escribe los dos parámetros
  if (clall_urlWired) {
    const def = clall_isDefault(s);
    atlasSyncUrl({ paises: def ? null : (s.sel.length ? brList(s.sel) : '-'), periodo: def ? null : s.p[0] + '~' + s.p[1] });
  }
}
function clall_applyUrl() {
  const s = clall_state();
  const v = atlasUrlParam('paises');
  if (v != null) {
    const ks = brParseList(v, (k) => !!CLALL_D.g[k.toUpperCase()]);
    // '-' = selección vacía a propósito; una lista sin ningún código válido no pisa la vista de fábrica
    if (ks && (ks.length || v === '-')) s.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) {
    const ab = per.split('~').map(Number), a = ab[0], b = ab[1];
    if (Number.isInteger(a) && Number.isInteger(b) && a >= CLALL_MIN && b <= CLALL_MAX && a < b) s.p = [a, b];
  }
  clall_urlWired = true;
  clall_period.sync(); clall_selector.render();
  drawClall();
}
function initClall() {
  const s = clall_state();
  clall_period = brPeriod({ pre: CLALL_ID, min: CLALL_MIN, max: CLALL_MAX, get: () => s.p, set: (p) => { s.p = p; }, onChange: () => { clall_selector.render(); drawClall(); } });
  clall_selector = brSelector({
    pre: CLALL_ID, get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawClall,
    placeholderKey: 'tur-search-ph-pais', universe: clall_universe, label: br_name,
    color: (k) => CLALL_CHIP[k] || (CLALL_D.reg[k] === 'LCN' ? CLALL_CHIP.latam : CLALL_CHIP.otro),
    // elegido pero sin dato en el período a la vista: chip atenuado
    dim: (k) => clall_idx(s, k).length < 2
  });
  brRegister(CLALL_ID, drawClall, () => t('clall-png-source'));
  // CSV estilo OWID: toda la base (todos los países, años y grupos), con la participación como en el gráfico (neta de
  // «otros», lo dice el encabezado) y el valor de cada grupo en millones de US$ (ese no cambia)
  brCsv('button.download[data-chart="' + CLALL_ID + '-csv"]', () => {
    const nm = (k, L) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? COUNTRY_NAMES[k][L] : k;
    const rows = [];
    Object.keys(CLALL_D.g).forEach(k => CLALL_Y.forEach((y, i) => {
      const tot = CLALL_D.tot[k][i];
      if (tot == null) return;
      CLALL_CATS.forEach(c => {
        const p = clall_val(k, c[0], i);
        if (p == null) return;
        rows.push([k, nm(k, 'es'), nm(k, 'en'), y, I18N.es['lall-' + c[0]], I18N.en['lall-' + c[0]], Math.round(p * 100) / 100, +(clall_raw(k, c[0], i) * tot / 100).toFixed(1)]);
      });
    }));
    return {
      headers: {
        es: ['codigo', 'pais', 'pais_en', 'anio', 'contenido_tecnologico', 'contenido_tecnologico_en', 'pct_exportaciones_bienes_sin_otros', 'millones_usd'],
        en: ['code', 'country_es', 'country', 'year', 'technology_content_es', 'technology_content', 'pct_of_goods_exports_excluding_other', 'usd_millions']
      },
      rows, file: { es: 'el-atlas-turquia-exportaciones-lall.csv', en: 'the-atlas-turkey-exports-lall.csv' }
    };
  });
  clall_applyUrl();
}
function clall_onLang() { clall_selector.render(); drawClall(); }
