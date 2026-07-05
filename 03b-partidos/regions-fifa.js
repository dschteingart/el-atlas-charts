// =============================================================
//  El Atlas N°3 — Taxonomía de confederaciones FIFA
// =============================================================
//
// El N°1 usa la taxonomía propia del Atlas (10 regiones), el N°2 la del
// Banco Mundial (7 regiones), y este N°3 las 6 confederaciones FIFA
// (CONMEBOL, UEFA, CONCACAF, CAF, AFC, OFC). El dataset trae el campo
// `confed` por país; este archivo solo define el orden de la leyenda y las
// paletas de color (full + label-darker).
//
// CONMEBOL mantiene el acento terracota del Atlas (#BE5D32) — es la
// protagonista del número y la confederación que sobre-rinde más en el
// scatter. Las otras 5 tienen su propia paleta sobria distinguible.
//
// Cuando otro número futuro repita esta taxonomía, este archivo se
// promueve a `lib/`.

const CONF_FIFA_ORDER = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

const CONF_FIFA_COLORS = {
  CONMEBOL: '#BE5D32',  // terracota — protagonista (igual que Latam en N°1/N°2)
  UEFA:     '#3E5A6E',  // azul pizarra
  CONCACAF: '#8B5A8C',  // violeta apagado
  CAF:      '#6B8E5A',  // verde oliva
  AFC:      '#C99A3B',  // amarillo mostaza
  OFC:      '#4A9BA8'   // turquesa
};

// Versiones más oscuras (~15% darker) para las labels de país. Mantienen
// identidad regional con más contraste sobre el fondo crema (#FAF8F3).
// CONMEBOL replica el #8B4220 que LATAM usa en N°1/N°2 — son el mismo color
// editorial. Para las otras 5 oscurecimos ~15-20% el principal.
const CONF_FIFA_LABEL_COLORS = {
  CONMEBOL: '#8B4220',
  UEFA:     '#26384A',
  CONCACAF: '#5E3B5E',
  CAF:      '#496B3A',
  AFC:      '#946C1F',
  OFC:      '#2D6B76'
};
