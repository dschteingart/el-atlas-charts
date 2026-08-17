// =============================================================
//  El Atlas N°4 — Adaptador del World Risk Poll para los motores de V-Dem
// =============================================================
// Esta pagina REUSA los motores del graficador de V-Dem: la vista MAPA carga el
// MISMO vdem-mapa.js que la pagina de V-Dem (parametrizado con VM_PAGE, abajo);
// wrp-rank.js sigue siendo un clon con ids renumerados porque el ranking de las
// dos paginas divergio de verdad (titulo, fila del promedio mundial). Este
// adaptador les sirve la MISMA API vd_* sobre los datos del World Risk Poll.
// Un solo indicador (wrp_piel) y un solo anio (2023).

// Config del motor de mapa compartido. Tiene que estar declarada ANTES de que
// cargue vdem-mapa.js (este archivo va primero en el HTML).
const VM_PAGE = {
  n: 25,                       // state[25], chart25, tooltip25, claves c25-*
  defaultCat: 'wrp_piel',
  csvEs: 'el-atlas-04-discriminacion-color-piel-mapa.csv',
  csvEn: 'the-atlas-04-skin-colour-discrimination-map.csv',
  notaPng: false               // la nota "Datos" del PNG la pone ESTE archivo, para las dos vistas
};
const VD_VARS = [{
  k: 'wrp_piel', grupo: 'Discriminación vivida', grupo_en: 'Experienced discrimination',
  es: 'Sufrió discriminación por su color de piel',
  en: 'Has experienced discrimination over skin colour'
}];
const VD_REGION = WRP_REGION;
// VD_SERIES con el formato comprimido que esperan los motores:
// [primerAnio, [valores...]] — aca una sola celda, 2023.
const VD_SERIES = { wrp_piel: {} };
WRP_ROWS.forEach(function (r) { VD_SERIES.wrp_piel[r[0]] = [2023, [r[1]]]; });

function vd_scaleOf() { return 1; }
function vd_peorEsMas() { return true; }   // mas % = peor (mas discriminacion vivida)
function vd_varMetaOf() { return VD_VARS[0]; }
function vd_varLabelOf() {
  return (typeof LANG !== 'undefined' && LANG === 'en') ? VD_VARS[0].en : VD_VARS[0].es;
}
function vd_years() { return [2023]; }
function vd_yearList() { return [{ w: 2023, label: '2023' }]; }
function vd_paises() { return WRP_ROWS.map(function (r) { return r[0]; }); }
function vd_at(serie, year) {
  if (!serie || year !== serie[0]) return null;
  return serie[1][0];
}
// Foto: [[iso, pct, anio, n(null), puesto], ...] ASC por valor; puesto 1 = el
// peor del mundo (el % mas alto), igual que en V-Dem.
function vd_foto() {
  if (vd_foto._c) return vd_foto._c;
  const N = WRP_ROWS.length;
  vd_foto._c = WRP_ROWS.map(function (r, i) { return [r[0], r[1], 2023, null, N - i]; });
  return vd_foto._c;
}
function vd_rango() { return [0, 30]; }   // max observado 27,4%
function vd_fmtVal(v, dec) {
  const d = (dec == null) ? 1 : dec;
  return (typeof fmt === 'function') ? fmt(v, d) : Number(v).toFixed(d).replace('.', ',');
}
function vd_fillVarSelect(id, current) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = '';
  const o = document.createElement('option');
  o.value = 'wrp_piel'; o.selected = true; o.textContent = vd_varLabelOf();
  sel.appendChild(o);
  // Un solo indicador: el selector no decide nada, se esconde el grupo entero.
  const grp = sel.closest('.m-ctrl-group');
  if (grp) grp.style.display = 'none';
}

// Decimales de la tabla regional y de la etiqueta de la mediana: son porcentajes
// de 0 a 30, con uno alcanza.
function vd_dec() { return 1; }

// Decimales de las ESCALAS (ticks del eje, cortes de la leyenda del mapa).
// Van mas cortos que los valores puntuales: un eje no necesita precision,
// necesita leerse de un vistazo.
function vd_decEje() { return 0; }

// ---------------------------------------------------------------------------
//  Notas del PNG — para las DOS vistas, desde un solo lugar
// ---------------------------------------------------------------------------
// onBeforePngExportGetSourceText es UN global, y ranking y mapa viven en la
// misma pagina: cada motor lo seteaba en su init y el segundo en arrancar
// pisaba al primero, asi que la vista que se inicializaba antes se quedaba sin
// su nota corta. Encima el del mapa devolvia 'c25-sources' —la nota larga del
// HTML, 8 renglones en el PNG— en vez de 'c25-sources-tpl'. Va uno solo aca,
// que atiende a los dos chartIds y sale del mismo par de strings.
window.onBeforePngExportGetSourceText = function (chartId) {
  var k = String(chartId) === '24' ? 'c24-sources-tpl'
        : String(chartId) === '25' ? 'c25-sources-tpl' : null;
  return (k && typeof t === 'function') ? t(k) : null;
};

// Misma caja de nota que el chart 26: mas ancha (hasta donde arranca la firma,
// que se mide como se dibuja y no como una linea) y un punto mas chica. En el
// mapa cada renglon de nota le come 24 px de alto al gráfico.
window.onBeforePngExportGetSourceLayout = function (chartId) {
  var c = String(chartId);
  return (c === '24' || c === '25') ? { ratio: 0.82, escala: 0.89 } : null;
};

// ---------------------------------------------------------------------------
//  Titulo y subtitulo del PNG del MAPA
// ---------------------------------------------------------------------------
// En la pagina el titulo se puede dar el lujo del "en el mundo" y el subtitulo
// del "alguna vez": no compiten con nada. En el PNG cada uno cuesta un renglon
// —64 px el del titulo, 42 el del subtitulo— que sale del alto del mapa, que es
// el formato mas apretado del numero. Medido: el mapa pasa de 522 a 628 px.
// El "alguna vez" no se pierde, lo dice la nota.
window.onBeforePngExportGetTitle = function (chartId) {
  return (String(chartId) === '25' && typeof t === 'function') ? t('c25-title-png') : null;
};
window.onBeforePngExportGetSubtitle = function (chartId) {
  if (String(chartId) !== '25' || typeof t !== 'function') return null;
  var tpl = t('c25-subtitle-png');
  if (!tpl || tpl.indexOf('c25-') === 0) return null;
  // El {PERIODO} lo resuelve el mismo helper que usa el subtitulo de pantalla.
  var per = (typeof vm_waveLabel === 'function' && typeof state !== 'undefined' && state[25])
    ? vm_waveLabel(state[25].wave) : '2023';
  return tpl.replace('{PERIODO}', per);
};
