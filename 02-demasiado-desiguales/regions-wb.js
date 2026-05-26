// =============================================================
//  El Atlas N°2 — Taxonomía regional del Banco Mundial
// =============================================================
//
// El N°1 usa la taxonomía propia del Atlas (10 regiones). El N°2 usa la
// del Banco Mundial (7 regiones) porque los datos de Gini, PIB pc PPP y
// PIP están reportados con esa clasificación. Cuando un número futuro
// repita esta taxonomía, este archivo se promueve a lib/.
//
// LATAM mantiene su acento terracota del Atlas. Las otras 6 regiones
// tienen su propia paleta sobria, distinguible entre sí, FT/OWID-like.

const REGION_WB_ORDER = [
  'Latin America & Caribbean',
  'Sub-Saharan Africa',
  'Europe & Central Asia',
  'East Asia & Pacific',
  'South Asia',
  'Middle East, North Africa, Afghanistan & Pakistan',
  'North America'
];

const REGION_WB_COLORS = {
  'Latin America & Caribbean':                          '#BE5D32',
  'Sub-Saharan Africa':                                 '#6B4A26',
  'Europe & Central Asia':                              '#2C5F7C',
  'East Asia & Pacific':                                '#7A9B5E',
  'South Asia':                                         '#C4A050',
  'Middle East, North Africa, Afghanistan & Pakistan':  '#A87B8A',
  'North America':                                      '#5A6B7C'
};

// Variantes oscurecidas para labels y elementos secundarios (tick de país,
// línea de promedio regional). Mantienen identidad regional con más contraste
// sobre el fondo crema (#FAF8F3).
const REGION_WB_LABEL_COLORS = {
  'Latin America & Caribbean':                          '#8B4220',
  'Sub-Saharan Africa':                                 '#4A2F15',
  'Europe & Central Asia':                              '#1A3A4D',
  'East Asia & Pacific':                                '#52703A',
  'South Asia':                                         '#8A6F2F',
  'Middle East, North Africa, Afghanistan & Pakistan':  '#7A4A5D',
  'North America':                                      '#3A4A5C'
};
