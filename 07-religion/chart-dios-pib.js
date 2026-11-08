// Importancia de Dios contra PIB per cápita (IVS ola 7, 91 países). Adapter del motor de scatters (rel-scatter.js):
// eje X logarítmico con ticks de base 2 ($2k a $128k, arrancando cerca del país más pobre), línea punteada = ajuste
// entre los países que no son de América Latina (se recalcula al apagar regiones), América Latina realzada.
// Datos: REL_DIOSPIB (data-dios-pib.js). Vista compartible: ?paises=ARG~CHL&ocultas=wEurope.
const CDP_ID = 'diospib';
let cdp_ctl = null;

function initCdp() {
  const pts = () => REL_DIOSPIB.pts;
  cdp_ctl = relScatterPage({
    id: CDP_ID, pts, legend: true, fit: 'otros', fitSpan: 'domain', residDec: 1,
    xLog: true, xDomain: [1900, 150000], xTicks: [2000, 4000, 8000, 16000, 32000, 64000, 128000], xFmt: rs_fmtK,
    yDomain: [2, 10.4], yTicks: [2, 4, 6, 8, 10], yFmt: (v) => br_fmt(v, 0),
    keys: { title: 'cdp-title', titleNeutral: 'cdp-title-neutral', sub: 'cdp-sub', pngSource: 'cdp-png-source',
            axisX: 'cdp-axis-x', axisY: 'cdp-axis-y' },
    tt: (p, ctl) => {
      const f = rs_ttFit(ctl, p, (v) => br_fmt(v, 1));
      return rs_ttHTML(ctl, p, [
        [rs_t('cdp-tt-y'), br_fmt(p.v, 1)],
        [rs_t('cdp-tt-x'), rs_fmtUSD(p.x)],
        [rs_t('sc-tt-year'), p.y, true]
      ].concat(f.rows, [[rs_t('sc-tt-n'), br_fmt(p.n, 0), true]]), [f.note]);
    },
    csv: () => {
      const m = rs_model({ cfg: { fit: 'otros', xLog: true } }, pts());   // la línea de fábrica (todas las regiones)
      const rows = pts().slice().sort((a, b) => a.k.localeCompare(b.k)).map(p => {
        const e = m.predict(p.x);
        return [p.k, rs_nameIn(p.k, 'es'), rs_nameIn(p.k, 'en'), rs_regIn(p.r, 'es'), rs_regIn(p.r, 'en'), p.y,
                Math.round(p.x), p.v, +e.toFixed(3), +(p.v - e).toFixed(3), p.n];
      });
      return {
        headers: {
          es: ['codigo', 'pais', 'pais_en', 'region', 'region_en', 'anio_encuesta', 'pib_per_capita_ppa_2021', 'importancia_dios_1a10',
               'esperable_segun_resto_del_mundo', 'diferencia', 'encuestados'],
          en: ['code', 'country_es', 'country', 'region_es', 'region', 'survey_year', 'gdp_per_capita_ppp_2021', 'importance_of_god_1to10',
               'expected_from_rest_of_world', 'difference', 'respondents']
        },
        rows, file: { es: 'el-atlas-religion-dios-pib.csv', en: 'the-atlas-religion-god-gdp.csv' }
      };
    }
  });
}
function cdp_onLang() { cdp_ctl.onLang(); }
