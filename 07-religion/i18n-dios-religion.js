// Strings de chart-dios-religion.html (importancia de Dios contra importancia de la religión). Se enchufan sobre I18N
// (i18n-issue.js). Período ({P}) calculado de los años de encuesta de los puntos visibles.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'cdr-title': 'América Latina es la región donde más se separan Dios y la religión',
    'cdr-title-neutral': 'Importancia de Dios y de la religión',
    'cdr-sub': 'Importancia de Dios y de la religión en la propia vida, {P}',
    'cdr-axis-x': 'Importancia de Dios en la propia vida (1 a 10)',
    'cdr-axis-y': 'La religión es muy importante (%)',
    'cdr-tt-x': 'Importancia de Dios (1 a 10)',
    'cdr-tt-y': 'La religión es muy importante',
    'cdr-png-source': 'Datos: Integrated Values Surveys (EVS/WVS).',
    'cdr-sources': 'Datos: Integrated Values Surveys (EVS/WVS), última encuesta de cada país, hecha entre 2017 y 2023. Cada punto es un país. La importancia de Dios es el promedio de una escala de 1 (nada importante) a 10 (muy importante). La religión cuenta como muy importante para quienes eligen esa respuesta entre cuatro (muy, bastante, no muy o nada importante). La línea punteada es la relación estimada entre los países que no son de América Latina; si se apagan regiones en la leyenda, se recalcula sin ellas.'
  });
  Object.assign(I18N.en, {
    'cdr-title': 'Latin America is the region where God and religion drift furthest apart',
    'cdr-title-neutral': 'Importance of God and of religion',
    'cdr-sub': 'Importance of God and of religion in one\'s life, {P}',
    'cdr-axis-x': 'Importance of God in one\'s life (1 to 10)',
    'cdr-axis-y': 'Religion is very important (%)',
    'cdr-tt-x': 'Importance of God (1 to 10)',
    'cdr-tt-y': 'Religion is very important',
    'cdr-png-source': 'Data: Integrated Values Surveys (EVS/WVS).',
    'cdr-sources': 'Data: Integrated Values Surveys (EVS/WVS), latest survey in each country, fielded between 2017 and 2023. Each dot is a country. Importance of God is the average on a scale from 1 (not at all important) to 10 (very important). Religion counts as very important for those who choose that answer out of four (very, rather, not very or not at all important). The dashed line is the relationship estimated among countries outside Latin America; switching regions off in the legend recalculates it without them.'
  });
})();
