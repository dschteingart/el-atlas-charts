// Strings del motor de scatters del número (rel-scatter.js), compartidos por chart-dios-pib, chart-dios-religion,
// chart-pib-evangelicos y chart-rutas. Se enchufan sobre I18N (ya construido en i18n-issue.js), como
// 04-intolerancia/i18n-vecinos.js. Los textos propios de cada gráfico viven en su i18n-<página>.js.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'sc-lbl-sel': 'Países',
    'sc-search-ph': 'Agregar país…',
    'sc-banner-n': 'Países',
    'sc-banner-r2': 'R² de la línea',
    'sc-banner-resid': 'Distancia promedio a la línea',
    'sc-banner-none': 'sin países visibles',
    'sc-fewfit': 'Quedan muy pocos países para trazar la línea.',
    'sc-legend-hint': 'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla de la línea.',
    'sc-show-all': 'Ver todas las regiones',
    'sc-fit-otros': 'Tendencia del resto del mundo',
    'sc-tt-year': 'Año de la encuesta',
    'sc-tt-expected': 'Esperable según la línea',
    'sc-tt-diff': 'Diferencia',
    'sc-tt-n': 'Encuestados',
    'sc-tt-above': 'Por encima de la línea',
    'sc-tt-below': 'Por debajo de la línea',
    'sc-pts': 'puntos'
  });
  Object.assign(I18N.en, {
    'sc-lbl-sel': 'Countries',
    'sc-search-ph': 'Add country…',
    'sc-banner-n': 'Countries',
    'sc-banner-r2': 'R² of the line',
    'sc-banner-resid': 'Average distance from the line',
    'sc-banner-none': 'no visible countries',
    'sc-fewfit': 'Too few countries left to draw the line.',
    'sc-legend-hint': 'Hover over a region in the legend to see its country names; click (or tap) to switch it off and leave it out of the line.',
    'sc-show-all': 'Show all regions',
    'sc-fit-otros': 'Trend in the rest of the world',
    'sc-tt-year': 'Survey year',
    'sc-tt-expected': 'Expected from the line',
    'sc-tt-diff': 'Difference',
    'sc-tt-n': 'Respondents',
    'sc-tt-above': 'Above the line',
    'sc-tt-below': 'Below the line',
    'sc-pts': 'points'
  });
})();
