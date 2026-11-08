// PIB per cápita de 1996 contra cambio en evangélicos 1996-2024 (Latinobarómetro y Banco Mundial, 17 países de América
// Latina). Adapter del motor de scatters (rel-scatter.js): eje X logarítmico con ticks de base 2 ($2,5k a $20k, el eje
// cubre $2,5k-$27k), línea punteada = ajuste entre los 17 países, todos etiquetados. Sin leyenda (una sola región).
// Sin selector de países (noSelector): los 17 están siempre a la vista y etiquetados, así que elegir no agregaba nada;
// el título queda en el hallazgo (salvo texto del editor) y la página no tiene estado en la URL.
// Datos: REL_PIBEV (data-pib-evangelicos.js).
const CPE_ID = 'pibev';
let cpe_ctl = null;

function initCpe() {
  const pts = () => REL_PIBEV.pts.map(p => Object.assign({ r: RS_LATAM }, p));
  const cache = pts();
  cpe_ctl = relScatterPage({
    id: CPE_ID, pts: () => cache, legend: false, softLabels: true, fit: 'todos', fitSpan: 'data', residDec: 1, noSelector: true,
    xLog: true, xDomain: [2500, 27000], xTicks: [2500, 5000, 10000, 20000], xFmt: rs_fmtK,
    yDomain: [-3, 26], yTicks: [0, 5, 10, 15, 20, 25], yFmt: (v) => br_fmt(v, 0),
    keys: { title: 'cpe-title', titleNeutral: 'cpe-title-neutral', sub: 'cpe-sub', pngSource: 'cpe-png-source',
            axisX: 'cpe-axis-x', axisY: 'cpe-axis-y' },
    tt: (p, ctl) => {
      const f = rs_ttFit(ctl, p, (v) => rs_signed(v, 1));
      return rs_ttHTML(ctl, p, [
        [rs_t('cpe-tt-y'), rs_signed(p.v, 1) + ' ' + rs_t('sc-pts')],
        [rs_t('cpe-tt-ev') + ' ' + p.d0 + ' → ' + p.d1, br_fmt(p.e0, 1) + '% → ' + br_fmt(p.e1, 1) + '%', true],
        [rs_t('cpe-tt-x'), rs_fmtUSD(p.x)]
      ].concat(f.rows), [f.note]);
    },
    csv: () => {
      const rows = cache.slice().sort((a, b) => a.k.localeCompare(b.k)).map(p =>
        [p.k, rs_nameIn(p.k, 'es'), rs_nameIn(p.k, 'en'), Math.round(p.x), p.d0, p.d1, p.e0, p.e1, p.v]);
      return {
        headers: {
          es: ['codigo', 'pais', 'pais_en', 'pib_per_capita_ppa_2021_1995_1997', 'olas_inicio', 'olas_fin', 'evangelicos_inicio_pct',
               'evangelicos_fin_pct', 'cambio_evangelicos_puntos'],
          en: ['code', 'country_es', 'country', 'gdp_per_capita_ppp_2021_1995_1997', 'start_waves', 'end_waves', 'evangelicals_start_pct',
               'evangelicals_end_pct', 'change_in_evangelicals_points']
        },
        rows, file: { es: 'el-atlas-religion-pib-evangelicos.csv', en: 'the-atlas-religion-gdp-evangelicals.csv' }
      };
    }
  });
}
function cpe_onLang() { cpe_ctl.onLang(); }
