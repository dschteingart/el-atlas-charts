// Composición de las exportaciones de bienes por rubro (Growth Lab de Harvard, HS92, 1995-2024), en áreas apiladas
// al 100%, un panel por país. Vista de fábrica: Turquía, México, Brasil y Argentina (2×2 en el PNG cuadrado).
// Análogos: 07-religion/chart-practicantes.js (paneles por país con buscador + chips, relStack) y
// 06-brasil/chart-exportaciones.js (composición de exportaciones; de ahí sale excluir las partidas sin producto).
// Ocho rubros armados con los capítulos del Sistema Armonizado (insumos/#8 - Turquia/scripts/build_datos.py), con el
// mismo color en todos los paneles: primarios abajo (verde y marrón), después metales, químicos y textiles, y arriba
// maquinaria y vehículos (los dos azules) y el resto en gris. Colores de la paleta estándar (lib/theme.js).
// Un panel = vista grande con etiquetas a la derecha y el valor de 1995 y 2024 dentro de cada banda.
// Datos: TUR_CAN (data-canasta.js). Vista compartible: ?paises=TUR~KOR~CHL (- = selección vacía).
const CCAN_ID = 'canasta';
const CCAN_CATS = [
  { key: 'agro',  color: '#2D6A3D', valColor: '#FFFFFF' },
  { key: 'min',   color: '#8A5A35', valColor: '#FFFFFF' },
  { key: 'metal', color: '#2C8484', valColor: '#FFFFFF' },
  { key: 'quim',  color: '#6B3D8B', valColor: '#FFFFFF' },
  { key: 'text',  color: '#C9A227', labelColor: '#8B6F1E', valColor: '#1A1A1A' },
  { key: 'maq',   color: '#234B85', valColor: '#FFFFFF' },
  { key: 'veh',   color: '#1F8AC0', valColor: '#FFFFFF' },
  { key: 'resto', color: '#C9C3B6', labelColor: '#8A8579', valColor: '#1A1A1A' }
];
const CCAN_DEF = ['TUR', 'MEX', 'BRA', 'ARG'];
// chips: Turquía con su color del número, América Latina en terracota, el resto en carbón (los paneles no llevan color de país)
const CCAN_CHIP = { TUR: '#234B85', latam: '#BE5D32', otro: '#33312C' };
const CCAN_Y = TUR_CAN.years, CCAN_P = CCAN_Y[0] + '-' + CCAN_Y[CCAN_Y.length - 1];
let ccan_urlWired = false, ccan_selector = null;

function ccan_state() { if (!state[CCAN_ID]) state[CCAN_ID] = { sel: CCAN_DEF.slice() }; return state[CCAN_ID]; }
// el orden de los paneles es parte de la vista: Turquía primero
function ccan_isDefault(s) { return s.sel.length === CCAN_DEF.length && s.sel.every((k, i) => k === CCAN_DEF[i]); }
function ccan_cats() { return CCAN_CATS.map(c => Object.assign({ label: t('can-' + c.key) }, c)); }
function ccan_universe() {
  return Object.keys(TUR_CAN.v).map(k => ({ key: k, label: br_name(k), tag: t('tur-reg-' + TUR_CAN.reg[k]) }))
    .sort((a, b) => a.label.localeCompare(b.label, br_lang()));
}
function ccan_panels(s) {
  const cats = ccan_cats();
  return s.sel.filter(k => TUR_CAN.v[k]).map(k => ({
    key: k, label: br_name(k), w: CCAN_Y, tot: CCAN_Y.map(() => 100),
    cats: cats.map(c => Object.assign({ vals: TUR_CAN.v[k][c.key] }, c))
  }));
}
function drawCcan() {
  const s = ccan_state(), svg = document.getElementById('chart' + CCAN_ID);
  if (!svg) return;
  // textos primero: el hueco del PNG se mide con el título y el subtítulo que van a salir
  atlasSetHeading(CCAN_ID, ccan_isDefault(s), { title: 'ccan-title', titleNeutral: 'ccan-title-neutral' });
  // con un solo panel, el subtítulo dice de qué país es el dato (el PNG no lleva chips ni título de panel)
  const lugar = s.sel.length === 1 ? br_name(s.sel[0]) : null;
  brSetSubtitle(CCAN_ID, (lugar ? t('ccan-sub-lugar').replace('{L}', lugar) : t('ccan-sub')).replace('{P}', CCAN_P));
  relStack({
    svg, id: CCAN_ID, L: rel_layout(CCAN_ID), panels: ccan_panels(s), cats: ccan_cats(), noTotal: true,
    yFmt: (v) => br_fmt(v, 0) + '%', ttFmt: (v) => br_fmt(v, 1) + '%', emptyText: t('tur-vacio')
  });
  // la vista de fábrica viaja como URL limpia; cualquier otra escribe la lista completa, en su orden
  if (ccan_urlWired) atlasSyncUrl({ paises: ccan_isDefault(s) ? null : (s.sel.length ? brList(s.sel) : '-') });
}
function ccan_applyUrl() {
  const s = ccan_state();
  const v = atlasUrlParam('paises');
  if (v != null) {
    const ks = brParseList(v, (k) => !!TUR_CAN.v[k.toUpperCase()]);
    // '-' = selección vacía a propósito; una lista sin ningún código válido no pisa la vista de fábrica
    if (ks && (ks.length || v === '-')) s.sel = ks.map(k => k.toUpperCase()).filter((k, i, a) => a.indexOf(k) === i);
  }
  ccan_urlWired = true;
  ccan_selector.render();
  drawCcan();
}
function initCcan() {
  const s = ccan_state();
  ccan_selector = brSelector({
    pre: CCAN_ID, get: () => s.sel, set: (a) => { s.sel = a; }, onChange: drawCcan,
    placeholderKey: 'tur-search-ph-pais', universe: ccan_universe, label: br_name,
    color: (k) => CCAN_CHIP[k] || (TUR_CAN.reg[k] === 'LCN' ? CCAN_CHIP.latam : CCAN_CHIP.otro)
  });
  brRegister(CCAN_ID, drawCcan, () => t('ccan-png-source'));
  // CSV estilo OWID: toda la base (todos los países, años y rubros), con el total exportado de cada año
  brCsv('button.download[data-chart="' + CCAN_ID + '-csv"]', () => {
    const nm = (k, L) => (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[k]) ? COUNTRY_NAMES[k][L] : k;
    const rows = [];
    Object.keys(TUR_CAN.v).forEach(k => CCAN_Y.forEach((y, i) => CCAN_CATS.forEach(c => {
      rows.push([k, nm(k, 'es'), nm(k, 'en'), y, I18N.es['can-' + c.key], I18N.en['can-' + c.key], TUR_CAN.v[k][c.key][i], TUR_CAN.tot[k][i]]);
    })));
    return {
      headers: {
        es: ['codigo', 'pais', 'pais_en', 'anio', 'rubro', 'rubro_en', 'pct_exportaciones_bienes', 'exportaciones_bienes_millones_usd'],
        en: ['code', 'country_es', 'country', 'year', 'product_group_es', 'product_group', 'pct_of_goods_exports', 'goods_exports_usd_millions']
      },
      rows, file: { es: 'el-atlas-turquia-canasta-exportadora.csv', en: 'the-atlas-turkey-export-basket.csv' }
    };
  });
  ccan_applyUrl();
}
function ccan_onLang() { ccan_selector.render(); drawCcan(); }
