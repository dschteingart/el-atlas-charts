// =============================================================
//  Strings propios del chart 5 — "Lo que se dice y lo que se asocia"
// =============================================================
// Se carga DESPUÉS de i18n-issue.js (que define I18N y ya trae c5-title,
// c5-subtitle, c5-axis-*, c5-tt-* y c5-sources) y ANTES de
// declarado-implicito.js. NO toca i18n-issue.js: ese archivo lo comparten
// todos los charts del número.
//
// Acá viven sólo las claves que nacieron con el contrato de interacción del
// scatter (hover revela la región / click apaga la región), que el chart 5 no
// tenía hasta ahora.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c5-legend-hint': 'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla.',
    'c5-show-all':    'Ver todas las regiones',
  });

  Object.assign(I18N.en, {
    'c5-legend-hint': 'Hover a region in the legend to reveal its country names; click (or tap) to switch it off.',
    'c5-show-all':    'Show all regions',
  });
})();
