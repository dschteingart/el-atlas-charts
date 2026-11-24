// PIB per cápita como porcentaje del de Estados Unidos (Banco Mundial, PPA, dólares constantes de 2021), 1990-2025.
// Vista de fábrica: Turquía, Europa oriental y América Latina y el Caribe. Europa oriental (EUE) es un agregado PROPIO
// (build_datos.py): el promedio de Bulgaria, Croacia, Eslovaquia, Eslovenia, Estonia, Hungría, Letonia, Lituania, Polonia,
// República Checa y Rumania, ponderado por población. Polonia y Rumania siguen en el buscador. El porcentaje se calcula acá, sobre la
// misma base que chart-pib (TUR_PIB, data-pib.js): valor del país / valor de Estados Unidos del mismo año.
// Estados Unidos no entra al buscador (sería una línea plana en 100%).
// Adapter de turSeries (tur-motor.js). Vista compartible: ?paises=TUR~KOR~MEX&periodo=2000~2025 (- = selección vacía).
const CCON = turSeries({
  id: 'convergencia', pre: 'ccon', data: () => TUR_PIB, def: ['TUR', 'EUE', 'LCN'], main: 'TUR',
  has: (k) => k !== 'USA',
  val: (D, k, i) => (D.v[k] && D.v[k][i] != null && D.v.USA[i] != null) ? D.v[k][i] / D.v.USA[i] * 100 : null,
  yFmt: (v) => br_fmt(v, 0) + '%',
  endFmt: (v) => br_fmt(v, 0) + '%',
  ttFmt: (v) => br_fmt(v, 1) + '%',
  aggTags: { EUE: 'ccon-tag-eue' },
  // la nota del PNG define Europa oriental solo si está a la vista
  pngSource: (sel) => br_t(sel.indexOf('EUE') >= 0 ? 'ccon-png-source-eue' : 'ccon-png-source'),
  csvName: { EUE: { es: 'Europa oriental (Bulgaria, Croacia, Eslovaquia, Eslovenia, Estonia, Hungría, Letonia, Lituania, Polonia, República Checa y Rumania, promedio ponderado por población)',
                    en: 'Eastern Europe (Bulgaria, Croatia, Czechia, Estonia, Hungary, Latvia, Lithuania, Poland, Romania, Slovakia and Slovenia, population-weighted average)' } },
  csv: { col: { es: 'pib_per_capita_pct_eeuu', en: 'gdp_per_capita_pct_us' }, dec: 2,
         file: { es: 'el-atlas-turquia-convergencia-eeuu.csv', en: 'the-atlas-turkey-convergence-us.csv' } }
});
function initCcon() { CCON.init(); }
function ccon_onLang() { CCON.onLang(); }
