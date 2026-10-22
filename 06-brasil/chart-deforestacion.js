// Chart 11 — Deforestación anual (PRODES/INPE): Amazonia Legal 1988-2026 o Cerrado 2001-2026.
// Datos: BR_DEF (data-deforestacion.js). Amazonia: [año, km², preliminar]. Cerrado: [inicio, fin, km² del
// período, km² por año, preliminar]. Entre 2000 y 2012 el Cerrado se midió por bienios: cada bienio es UNA
// barra del mismo ancho que las anuales (rótulo "2001-02") con el promedio anual del bienio; no se reparte
// el dato en dos años inventados.
const C11_DEF = { b: 'amazonia', p: [1988, 2026] };
const C11_LIM = { amazonia: [1988, 2026], cerrado: [2001, 2026] };
let c11_urlWired = false, c11_period = null, c11_tog = null;

function c11_state() { if (!state[11]) state[11] = { b: C11_DEF.b, p: C11_DEF.p.slice() }; return state[11]; }
function c11_isDefault(s) { return s.b === C11_DEF.b && s.p[0] === C11_DEF.p[0] && s.p[1] === C11_DEF.p[1]; }
function c11_bars(s) {
  if (s.b === 'amazonia') {
    return BR_DEF.amazonia.filter(r => r[0] >= s.p[0] && r[0] <= s.p[1])
      .map(r => ({ key: String(r[0]), y0: r[0], y1: r[0], value: r[1], pre: r[2], tick: r[0] % 5 === 0 ? String(r[0]) : null }));
  }
  return BR_DEF.cerrado.map(r => {
    const y0 = r[0] + 1, y1 = r[1], bien = y1 > y0;
    return { key: y0 + '-' + y1, y0, y1, ini: r[0], fin: r[1], value: r[3], pre: r[4], bien,
      tick: bien ? y0 + '-' + String(y1).slice(2) : String(y1) };
  }).filter(b => b.y0 >= s.p[0] && b.y1 <= s.p[1]);
}
function drawC11() {
  const s = c11_state(), svg = document.getElementById('chart11');
  if (!svg) return;
  const L = br_layout();
  const bars = c11_bars(s);
  const off = bars.filter(b => !b.pre);
  if (off.length) {
    const mx = off.reduce((a, b) => b.value > a.value ? b : a), mn = off.reduce((a, b) => b.value < a.value ? b : a);
    const lab = [mx, mn, off[off.length - 1]];
    if (s.b === 'amazonia') off.forEach(b => { if (b.y0 === 2004 || b.y0 === 2021) lab.push(b); });
    lab.forEach(b => { b.lab = true; });
  }
  const amaz = s.b === 'amazonia';
  brBars({
    svg, id: '11', L, bars, color: amaz ? '#2D6A3D' : '#8A5A35', preColor: amaz ? '#A9C4A0' : '#D2B79E',
    labelColor: amaz ? '#1F4A2A' : '#5C3F26',
    yFmt: (v) => br_fmt(v, 0), yTitle: br_t('c11-ytitle'),
    ttBar: (b) => br_ttHTML(br_t(amaz ? 'c11-b-amazonia' : 'c11-b-cerrado') + ', ' + (b.bien ? b.y0 + '-' + b.y1 : b.y1),
      [[br_t('c11-tt'), br_fmt(b.value, 0) + ' km²']],
      [b.bien ? br_cap(br_t('c11-bienal').replace('{A}', b.y0).replace('{B}', b.y1)) : null, b.pre ? br_cap(br_t('c11-pre')) : null])
  });
  atlasSetHeading('11', c11_isDefault(s), { title: 'c11-title', titleNeutral: 'c11-title-neutral-' + s.b });
  const per = bars.length ? bars[0].y0 + '-' + bars[bars.length - 1].y1 : s.p[0] + '-' + s.p[1];
  brSetSubtitle('11', br_t('c11-sub-' + s.b).replace('{P}', per));
  if (c11_urlWired) atlasSyncUrlTodoONada({ bioma: s.b, periodo: s.p[0] + '~' + s.p[1] }, { bioma: C11_DEF.b, periodo: C11_DEF.p[0] + '~' + C11_DEF.p[1] });
}
function initC11() {
  const s = c11_state();
  c11_tog = brToggle({ el: 'c11-bioma', get: () => s.b, set: (v) => { s.b = v; s.p = C11_LIM[v].slice(); }, onChange: () => { c11_period.sync(); drawC11(); } });
  c11_period = brPeriod({ pre: 'c11', min: () => C11_LIM[s.b][0], max: () => C11_LIM[s.b][1], get: () => s.p, set: (p) => { s.p = p; }, onChange: drawC11 });
  brRegister('11', drawC11, 'c11-png-source');
  brCsv('button.download[data-chart="11-csv"]', () => {
    const rows = [];
    BR_DEF.amazonia.forEach(r => rows.push(['Amazonia Legal', r[0], r[0], r[1], r[1], r[2] ? 'preliminar' : 'oficial']));
    BR_DEF.cerrado.forEach(r => rows.push(['Cerrado', r[0] + 1, r[1], r[2], r[3], r[4] ? 'preliminar' : 'oficial']));
    return {
      headers: { es: ['bioma', 'anio_prodes_inicio', 'anio_prodes_fin', 'km2_periodo', 'km2_por_anio', 'estado'], en: ['biome', 'prodes_year_start', 'prodes_year_end', 'km2_period', 'km2_per_year', 'status'] },
      rows, file: { es: 'el-atlas-brasil-deforestacion.csv', en: 'the-atlas-brazil-deforestation.csv' }
    };
  });
  const b = atlasUrlParam('bioma'); if (C11_LIM[b]) { s.b = b; s.p = C11_LIM[b].slice(); }
  const per = atlasUrlParam('periodo');
  if (per && per.indexOf('~') > 0) { const [a, c] = per.split('~').map(Number); if (a >= C11_LIM[s.b][0] && c <= C11_LIM[s.b][1] && a < c) s.p = [a, c]; }
  c11_urlWired = true;
  c11_tog.sync(); c11_period.sync();
  drawC11();
}
function c11_onLang() { drawC11(); }
