// =============================================================
//  theme.js — identidad visual de El Atlas (tokens con nombre)
// =============================================================
// Fuente de verdad de los colores de DATOS (series, categorías). El chrome
// de página (fondos, tintas, reglas) vive como var(--…) en lib/style.css;
// las series van hardcodeadas en los renderers porque el export PNG no
// resuelve var() — pero SIEMPRE copiadas de acá, nunca inventadas por chart.
// (Criterio de la auditoría 2026-07: prohibido crear paletas nuevas por
// gráfico; altura/edad lo hicieron y el especial terminó con tres amarillos
// distintos para "Mundial".)
//
// Charts NUEVOS: usar ATLAS.series / ATLAS.categorias por índice o nombre.
// Charts VIEJOS: convergen a esta paleta cuando se los retoque.

const ATLAS = {
  // Chrome (referencia; el CSS manda): crema #FAF8F3, tinta #1A1A1A,
  // tinta-suave #4A4A4A, apagado #8A8579, regla #E0DCC8, grilla #ECE7D8.
  accent: '#BE5D32',       // terracota — SIEMPRE Latam/CONMEBOL/lo propio
  mundo:  '#33312C',       // carbón — la serie "Mundo" en series temporales

  // Paleta estándar de 12 para multiseries (la de elo-lines, natividad,
  // ligas, origenes, dts y el chart 1 del especial):
  series: [
    '#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F',
    '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'
  ],

  // Categorías de competencia (especial de partidos). Canónica = la del
  // chart 2 (amistosos); los charts 3/6/7 tienen variantes que convergen
  // acá cuando se los retoque. "Mundial" es UN solo amarillo: #C9A227.
  categorias: {
    amistosos:      '#234B85',
    eliminatorias:  '#2D6A3D',
    mundial:        '#C9A227',
    copasContinentales: '#6B3D8B',
    eliminatoriasContinentales: '#2C8484',
    otros:          '#7A2A3F',
    resto:          '#CFC9BC'
  },

  // Confederaciones FIFA: la fuente es regions-fifa.js (CONF_FIFA_COLORS);
  // se replican acá solo como referencia rápida:
  //   CONMEBOL #BE5D32 · UEFA #3E5A6E · CONCACAF #8B5A8C
  //   CAF #6B8E5A · AFC #C99A3B · OFC #4A9BA8
  // Regiones del mundo: lib/regions.js (10 propias, N°1) y
  // regions-wb.js (7 del Banco Mundial, N°2).

  // Semáforo (chart 8 del especial): ganó / empató / perdió
  resultado: { gano: '#5E9152', empato: '#CBC3B4', perdio: '#A0442E' }
};
