// Chart 2 — Exportaciones (o importaciones, con el selector de flujo) de bienes por contenido tecnológico (Lall),
// cualquier país, 1962-2024, en áreas
// apiladas (patrón 03b-partidos/ts-partidos.js, chart de amistosos). Empalme del Atlas of Economic Complexity
// (Harvard Growth Lab, SITC Rev. 2) hasta 1994 con BACI (CEPII) desde 2005, promediados en 1995-2004
// (scripts/eje2_baci_lall.py), agrupados con la clasificación de Lall de Argendata (Fundar), que cuenta
// minerales y oro como productos primarios. Sin las partidas sin producto (SITC 9310 y 9110). % del total o
// millones de US$ corrientes.
// Datos: BR_EXP.atlas y BR_EXP.atlasImp (data-exportaciones.js), los dos con {years, escala, tot: {iso3: [millones US$]},
//        g: {iso3: {pp|rrnn|baja|media|alta|otros: [participación × escala]}}} y los mismos países.
// Paleta: dos familias (pedido de Daniel): verdes para primarios y manufacturas de recursos naturales,
// azules para media y alta tecnología; baja tecnología en ocre; "otros" (Lall 9) en gris.
const C2_CATS = [['pp', '#2D6A3D'], ['rrnn', '#6CB04D'], ['baja', '#C9A227'], ['media', '#1F8AC0'], ['alta', '#234B85'], ['otros', '#C9C3B6']];
const C2_GRIS = { otros: '#9A9488' };   // color de la etiqueta (más oscuro que la banda)
const C2_A = BR_EXP.atlas;
const C2_MIN = C2_A.years[0], C2_MAX = C2_A.years[C2_A.years.length - 1];
const C2_DEF = { f: 'EXP', m: 'pct', p: [C2_MIN, C2_MAX], pais: 'BRA' };
let c2_urlWired = false, c2_period = null, c2_togM = null, c2_togF = null;

function c2_state() {
  if (!state[2]) state[2] = { f: C2_DEF.f, m: C2_DEF.m, p: C2_DEF.p.slice(), pais: C2_DEF.pais };
  return state[2];
}
function c2_isDefault(s) { return s.f === C2_DEF.f && s.m === C2_DEF.m && s.p[0] === C2_DEF.p[0] && s.p[1] === C2_DEF.p[1] && s.pais === C2_DEF.pais; }
// serie del flujo elegido; las claves de texto de importaciones llevan el sufijo -IMP
function c2_data(s) { return s.f === 'IMP' ? BR_EXP.atlasImp : C2_A; }
function c2_k(s, key) { return s.f === 'IMP' ? key + '-IMP' : key; }
// valor de una categoría en el año i (null si el país no tiene dato ese año)
function c2_val(s, cat, i) {
  const D = c2_data(s), tot = (D.tot[s.pais] || [])[i];
  if (tot == null) return null;
  const v = ((D.g[s.pais] || {})[cat] || [])[i];
  const pct = (v == null ? 0 : v) / (D.escala || 1);
  return s.m === 'pct' ? pct : pct * tot / 100;
}
function drawC2() {
  const s = c2_state(), svg = document.getElementById('chart2');
  if (!svg) return;
  const pct = s.m === 'pct', D = c2_data(s);
  const cats = C2_CATS.filter(c => !C2_GRIS[c[0]] || (D.g[s.pais] || {})[c[0]])
    .map(c => ({ key: c[0], label: br_t('lall-' + c[0]), color: c[1], labelColor: C2_GRIS[c[0]] || null }));
  brArea({
    svg, id: '2', L: br_layout(), years: D.years, cats, val: (k, i) => c2_val(s, k, i),
    x0: s.p[0], x1: s.p[1], yMax: pct ? 100 : null,
    yFmt: pct ? (v) => br_fmt(v, 0) + '%' : (v) => br_fmt(v, 0),
    yTitle: br_t(pct ? c2_k(s, 'c2-ytitle-pct') : 'c2-ytitle-musd'),
    ttFmt: pct ? (v) => br_fmt(v, 1) + '%' : (v) => br_fmt(v, 0)
  });
  const pais = br_name(s.pais), per = s.p[0] + '-' + s.p[1];
  atlasSetHeading('2', c2_isDefault(s), { title: 'c2-title', titleNeutral: 'c2-title-neutral-lall' });
  const tEl = document.querySelector('.chart-block[data-chart="2"] .chart-title');
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const custom = ae && ae.texts && ae.texts[(ae.lang || br_lang())] && (ae.texts[(ae.lang || br_lang())].title || '').trim();
  if (tEl && !custom && !c2_isDefault(s)) tEl.textContent = br_t(c2_k(s, 'c2-title-neutral-lall')).replace('{C}', pais);
  brSetSubtitle('2', br_t(c2_k(s, pct ? 'c2-sub-lall-pct' : 'c2-sub-lall-musd')).replace('{C}', pais).replace('{P}', per));
  if (c2_urlWired) atlasSyncUrlTodoONada(
    { flujo: s.f, medida: s.m, periodo: s.p[0] + '~' + s.p[1], pais: s.pais },
    { flujo: C2_DEF.f, medida: C2_DEF.m, periodo: C2_DEF.p[0] + '~' + C2_DEF.p[1], pais: C2_DEF.pais });
}
function c2_fillPaises() {
  const sel = document.getElementById('c2-pais'), s = c2_state();
  if (!sel) return;
  const codes = Object.keys(C2_A.g).sort((a, b) => br_name(a).localeCompare(br_name(b), br_lang()));
  sel.innerHTML = '';
  codes.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = br_name(k); sel.appendChild(o); });
  sel.value = s.pais;
}
function initC2() {
  const s = c2_state();
  c2_togF = brToggle({ el: 'c2-flujo', get: () => s.f, set: (v) => { s.f = v; }, onChange: drawC2 });
  c2_togM = brToggle({ el: 'c2-medida', get: () => s.m, set: (v) => { s.m = v; }, onChange: drawC2 });
  c2_period = brPeriod({ pre: 'c2', min: C2_MIN, max: C2_MAX, get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC2 });
  c2_fillPaises();
  const sel = document.getElementById('c2-pais');
  if (sel) sel.addEventListener('change', () => { s.pais = sel.value; drawC2(); });
  // subtítulo propio del PNG, corto (pedido de Daniel, 22/10/2026)
  brRegister('2', drawC2, 'c2-png-source', () => br_t(c2_k(s, 'c2-png-sub-' + s.m)).replace('{C}', br_name(s.pais)).replace('{P}', s.p[0] + '-' + s.p[1]));
  brCsv('button.download[data-chart="2-csv"]', () => {
    const D = c2_data(s), imp = s.f === 'IMP', rows = [], tot = D.tot[s.pais] || [];
    C2_CATS.forEach(c => (((D.g[s.pais] || {})[c[0]]) || []).forEach((v, i) => {
      if (v == null || tot[i] == null) return;
      const p = v / (D.escala || 1);
      rows.push([s.pais, br_name(s.pais), br_t('lall-' + c[0]), D.years[i], p, +(p * tot[i] / 100).toFixed(1)]);
    }));
    return {
      headers: { es: ['codigo', 'pais', 'contenido_tecnologico', 'anio', imp ? 'pct_importaciones_bienes' : 'pct_exportaciones_bienes', 'millones_usd'],
                 en: ['code', 'country', 'technology_content', 'year', imp ? 'pct_of_goods_imports' : 'pct_of_goods_exports', 'usd_millions'] },
      rows, file: imp ? { es: 'el-atlas-brasil-importaciones.csv', en: 'the-atlas-brazil-imports.csv' }
                      : { es: 'el-atlas-brasil-exportaciones.csv', en: 'the-atlas-brazil-exports.csv' }
    };
  });
  const fl = (atlasUrlParam('flujo') || '').toUpperCase(); if (fl === 'EXP' || fl === 'IMP') s.f = fl;
  const m = atlasUrlParam('medida'); if (m === 'pct' || m === 'musd') s.m = m;
  const pa = (atlasUrlParam('pais') || '').toUpperCase(); if (C2_A.g[pa]) s.pais = pa;
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, b] = per.split('~').map(Number); if (a >= C2_MIN && b <= C2_MAX && a < b) s.p = [a, b]; }
  c2_urlWired = true;
  c2_togF.sync(); c2_togM.sync(); c2_period.sync(); if (sel) sel.value = s.pais;
  drawC2();
}
function c2_onLang() { c2_fillPaises(); drawC2(); }
