// =============================================================
//  El Atlas N°4 — Adaptador del World Risk Poll para los motores de V-Dem
// =============================================================
// Esta pagina REUSA los motores del graficador de V-Dem (wrp-rank.js y
// wrp-mapa.js son clones con ids renumerados) sin tocar su logica: este
// adaptador les sirve la MISMA API vd_* sobre los datos del World Risk Poll.
// Un solo indicador (wrp_piel) y un solo anio (2023).
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
