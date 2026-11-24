// PIB per cápita, PPA, dólares internacionales constantes de 2021 (Banco Mundial), 1990-2025.
// Vista de fábrica: Turquía y América Latina y el Caribe. Adapter de turSeries (tur-motor.js): buscador de países
// y regiones + chips, slider de período, crosshair anual, etiquetas al final con el valor de 2025 en el PNG.
// Datos: TUR_PIB (data-pib.js). Vista compartible: ?paises=TUR~BRA~MEX&periodo=2000~2025 (- = selección vacía).
const CPIB = turSeries({
  id: 'pib', pre: 'cpib', data: () => TUR_PIB, def: ['TUR', 'LCN'], main: 'TUR',
  has: (k) => k !== 'EUE',   // Europa oriental (agregado propio) es de chart-convergencia
  yFmt: (v) => fmtTickGDP(v),
  endFmt: (v) => '$' + br_fmt(v, 0),
  ttFmt: (v) => '$' + br_fmt(v, 0),
  csv: { col: { es: 'pib_per_capita_ppa_usd_2021', en: 'gdp_per_capita_ppp_2021_usd' }, dec: 1,
         file: { es: 'el-atlas-turquia-pib-per-capita.csv', en: 'the-atlas-turkey-gdp-per-capita.csv' } }
});
function initCpib() { CPIB.init(); }
function cpib_onLang() { CPIB.onLang(); }
