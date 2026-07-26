// =============================================================
//  El Atlas N°5 — Adaptador de datos de V-Dem
// =============================================================
// ÚNICO lugar donde se traduce el formato comprimido de data-vdem.js a lo que
// esperan los motores clonados del número. Lo usan las tres vistas del
// graficador (comparación, mapa, evolución) y hay que cargarlo ANTES que ellas.
// Vivía duplicado en los tres archivos: se extrajo acá para que no diverjan,
// que es exactamente el problema que la auditoría de scatters encontró.

// ============================================================
//  Adaptador de datos V-Dem (compartido por las tres vistas)
// ============================================================
// VD_SERIES[k][iso] = [primerAño, [v, ...]] con años CONSECUTIVOS, null en los
// huecos y ENTEROS ESCALADOS (índice ×1000, componentes ×100). Estas funciones
// devuelven lo que esperan los motores clonados del N°5.
//
// OJO CON LA DIRECCIÓN: el índice v2xpe_exlsocgr va de 0 a 1 y MÁS ES PEOR
// (más exclusión). Los cinco componentes son escala de intervalo centrada en ~0
// y MÁS ES MEJOR. vd_peorEsMas() lo resuelve en un solo lugar para que el mapa
// no pinte de rojo cosas opuestas según la variable.
function vd_scaleOf(k) { return (k === 'v2xpe_exlsocgr') ? 1000 : 100; }
function vd_peorEsMas(k) { return k === 'v2xpe_exlsocgr'; }
function vd_varMetaOf(k) {
  for (let i = 0; i < VD_VARS.length; i++) if (VD_VARS[i].k === k) return VD_VARS[i];
  return VD_VARS[0];
}
function vd_varLabelOf(k) {
  const v = vd_varMetaOf(k);
  return ((typeof LANG !== 'undefined' && LANG === 'en') ? v.en : v.es);
}
function vd_at(serie, year, div) {
  if (!serie) return null;
  const i = year - serie[0];
  if (i < 0 || i >= serie[1].length) return null;
  const v = serie[1][i];
  return (v === null || v === undefined) ? null : v / div;
}
// Años con al menos un país con dato, para esa variable. Cacheado.
function vd_years(k) {
  if (!vd_years._c) vd_years._c = {};
  if (vd_years._c[k]) return vd_years._c[k];
  const src = VD_SERIES[k] || {};
  let lo = null, hi = null;
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    const s = src[iso];
    const a = s[0], b = s[0] + s[1].length - 1;
    if (lo === null || a < lo) lo = a;
    if (hi === null || b > hi) hi = b;
  }
  const out = [];
  for (let y = (lo === null ? 1900 : lo); y <= (hi === null ? 2023 : hi); y++) out.push(y);
  vd_years._c[k] = out;
  return out;
}
// Foto de un año: [[iso, valor, año, n(null), puesto], ...] ordenada ASC por valor.
// El puesto se cuenta desde el PEOR (1 = el peor del mundo), así el "1°" siempre
// significa lo mismo aunque la variable apunte al revés.
function vd_foto(k, year) {
  if (!vd_foto._c) vd_foto._c = {};
  const ck = k + '|' + year;
  if (vd_foto._c[ck]) return vd_foto._c[ck];
  const src = VD_SERIES[k] || {};
  const div = vd_scaleOf(k);
  const rows = [];
  for (const iso in src) {
    if (!Object.prototype.hasOwnProperty.call(src, iso)) continue;
    if (!VD_REGION[iso]) continue;
    const v = vd_at(src[iso], year, div);
    if (v === null) continue;
    rows.push([iso, v, year, null, 0]);
  }
  rows.sort(function (a, b) { return (a[1] - b[1]) || String(a[0]).localeCompare(String(b[0])); });
  const N = rows.length;
  for (let i = 0; i < N; i++) rows[i][4] = vd_peorEsMas(k) ? (N - i) : (i + 1);
  vd_foto._c[ck] = rows;
  return rows;
}
function vd_yearList(k) {
  return vd_years(k).map(function (y) { return { w: y, label: String(y) }; });
}

// Llena un <select> con las 6 variables de V-Dem, agrupadas por tipo. Los motores
// clonados leen el <select> del HTML en vez de construirlo, y el HTML venía con
// las categorías de la batería de vecinos: esto lo reemplaza en un solo lugar
// para las tres vistas.
function vd_fillVarSelect(id, current) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const en = (typeof LANG !== 'undefined' && LANG === 'en');
  sel.innerHTML = '';
  const grupos = [];
  VD_VARS.forEach(function (v) {
    const g = en ? (v.grupo_en || v.grupo) : v.grupo;
    if (grupos.indexOf(g) < 0) grupos.push(g);
  });
  grupos.forEach(function (g) {
    const og = document.createElement('optgroup');
    og.label = g;
    VD_VARS.filter(function (v) { return (en ? (v.grupo_en || v.grupo) : v.grupo) === g; })
      .forEach(function (v) {
        const o = document.createElement('option');
        o.value = v.k;
        o.textContent = en ? v.en : v.es;
        if (v.k === current) o.selected = true;
        og.appendChild(o);
      });
    sel.appendChild(og);
  });
}
