// Gasto en investigación y desarrollo como porcentaje del PIB (Banco Mundial, GB.XPD.RSDV.GD.ZS, con datos del Instituto
// de Estadística de la UNESCO), del primer al último año con dato (1996-2024). Vista de fábrica: Turquía, Argentina,
// Brasil, Chile y México. Adapter de turSeries (tur-motor.js), el mismo de chart-pib, chart-inflacion y chart-agro.
// Los cuatro latinoamericanos son terracota (regla de la casa) en estilos distintos de la misma familia (latamTones:
// terracota, terracota oscuro, terracota claro y terracota punteado), para que Chile y México, que terminan cerca, no
// se confundan. Los años sin dato cortan la línea (no se interpola) y el crosshair solo muestra años medidos.
// Datos: TUR_IYD (data-iyd.js). Vista compartible: ?paises=TUR~KOR~BRA&periodo=2000~2023 (- = selección vacía).
const CIYD = turSeries({
  id: 'iyd', pre: 'ciyd', data: () => TUR_IYD, def: ['TUR', 'ARG', 'BRA', 'CHL', 'MEX'], main: 'TUR', latamTones: true,
  yFmt: (v) => br_fmt(v, 1) + '%',
  endFmt: (v) => br_fmt(v, 2) + '%',
  ttFmt: (v) => br_fmt(v, 2) + '%',
  csv: { col: { es: 'gasto_iyd_pct_pib', en: 'rd_expenditure_pct_gdp' }, dec: 2,
         file: { es: 'el-atlas-turquia-investigacion-desarrollo.csv', en: 'the-atlas-turkey-research-development.csv' } }
});
function initCiyd() { CIYD.init(); }
function ciyd_onLang() { CIYD.onLang(); }
