// Puesto en el ranking de complejidad económica (Growth Lab de Harvard, serie HS92), 1995-2024, con el eje
// invertido: el puesto 1 arriba. Vista de fábrica: Turquía, México, Brasil y Argentina.
// Adapter de turSeries (tur-motor.js). Los puestos son enteros: el tooltip los lista del mejor al peor.
// Datos: TUR_ECI (data-complejidad.js). Vista compartible: ?paises=TUR~KOR&periodo=2005~2024 (- = selección vacía).
const CCOM = turSeries({
  id: 'complejidad', pre: 'ccom', data: () => TUR_ECI, def: ['TUR', 'MEX', 'BRA', 'ARG'], main: 'TUR',
  invert: true, yTitleKey: 'ccom-ytitle', phKey: 'tur-search-ph-pais',
  yFmt: (v) => br_fmt(v, 0),
  endFmt: (v) => br_fmt(v, 0),
  ttFmt: (v) => br_fmt(v, 0),
  csv: { col: { es: 'puesto_ranking_complejidad', en: 'complexity_ranking_position' }, dec: 0,
         file: { es: 'el-atlas-turquia-complejidad-economica.csv', en: 'the-atlas-turkey-economic-complexity.csv' } }
});
function initCcom() { CCOM.init(); }
function ccom_onLang() { CCOM.onLang(); }
