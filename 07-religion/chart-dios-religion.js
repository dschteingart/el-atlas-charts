// Importancia de Dios contra importancia de la religión (IVS ola 7, 91 países). Adapter del motor de scatters
// (rel-scatter.js): línea punteada = ajuste entre los países que no son de América Latina (se recalcula al apagar
// regiones); América Latina realzada. Datos: REL_DIOSREL (data-dios-religion.js).
// Vista compartible: ?paises=ARG~CHL&ocultas=wEurope.
const CDR_ID = 'diosrel';
let cdr_ctl = null;

function initCdr() {
  const pts = () => REL_DIOSREL.pts;
  cdr_ctl = relScatterPage({
    id: CDR_ID, pts, legend: true, fit: 'otros', fitSpan: 'domain', residDec: 0,
    xLog: false, xDomain: [1.5, 10.3], xTicks: [2, 4, 6, 8, 10], xFmt: (v) => br_fmt(v, 0),
    yDomain: [0, 100], yTicks: [0, 25, 50, 75, 100], yFmt: (v) => br_fmt(v, 0) + '%',
    keys: { title: 'cdr-title', titleNeutral: 'cdr-title-neutral', sub: 'cdr-sub', pngSource: 'cdr-png-source',
            axisX: 'cdr-axis-x', axisY: 'cdr-axis-y' },
    tt: (p, ctl) => {
      const f = rs_ttFit(ctl, p, (v) => br_fmt(v, 0) + '%');
      return rs_ttHTML(ctl, p, [
        [rs_t('cdr-tt-y'), br_fmt(p.v, 0) + '%'],
        [rs_t('cdr-tt-x'), br_fmt(p.x, 1)],
        [rs_t('sc-tt-year'), p.y, true]
      ].concat(f.rows), [f.note]);
    },
    csv: () => {
      const m = rs_model({ cfg: { fit: 'otros', xLog: false } }, pts());   // la línea de fábrica (todas las regiones)
      const rows = pts().slice().sort((a, b) => a.k.localeCompare(b.k)).map(p => {
        const e = m.predict(p.x);
        return [p.k, rs_nameIn(p.k, 'es'), rs_nameIn(p.k, 'en'), rs_regIn(p.r, 'es'), rs_regIn(p.r, 'en'), p.y,
                p.x, p.v, +e.toFixed(2), +(p.v - e).toFixed(2)];
      });
      return {
        headers: {
          es: ['codigo', 'pais', 'pais_en', 'region', 'region_en', 'anio_encuesta', 'importancia_dios_1a10', 'religion_muy_importante_pct',
               'esperable_segun_resto_del_mundo_pct', 'diferencia_puntos'],
          en: ['code', 'country_es', 'country', 'region_es', 'region', 'survey_year', 'importance_of_god_1to10', 'religion_very_important_pct',
               'expected_from_rest_of_world_pct', 'difference_points']
        },
        rows, file: { es: 'el-atlas-religion-dios-religion.csv', en: 'the-atlas-religion-god-religion.csv' }
      };
    }
  });
}
function cdr_onLang() { cdr_ctl.onLang(); }
