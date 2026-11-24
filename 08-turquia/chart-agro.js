// Empleo en la agricultura como porcentaje del empleo total (Banco Mundial, SL.AGR.EMPL.ZS, estimación modelada de la
// OIT), 1991-2025. Vista de fábrica: Turquía y México (México en terracota, como todo país de América Latina).
// Adapter de turSeries (tur-motor.js), el mismo de chart-pib y chart-inflacion: buscador de países y regiones + chips,
// slider de período, crosshair anual, etiquetas al final con el valor de 2025 en el PNG.
// Datos: TUR_AGR (data-agro.js). Vista compartible: ?paises=TUR~MEX~POL&periodo=2000~2025 (- = selección vacía).
const CAGR = turSeries({
  id: 'agro', pre: 'cagr', data: () => TUR_AGR, def: ['TUR', 'MEX'], main: 'TUR',
  yFmt: (v) => br_fmt(v, 0) + '%',
  endFmt: (v) => br_fmt(v, 0) + '%',
  ttFmt: (v) => br_fmt(v, 1) + '%',
  csv: { col: { es: 'empleo_agricola_pct', en: 'agricultural_employment_pct' }, dec: 1,
         file: { es: 'el-atlas-turquia-empleo-agricola.csv', en: 'the-atlas-turkey-agricultural-employment.csv' } }
});
function initCagr() { CAGR.init(); }
function cagr_onLang() { CAGR.onLang(); }
