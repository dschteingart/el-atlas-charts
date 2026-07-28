// Strings del graficador del barrio (chart-barrio.html): pestañas del shell
// (g8-*) + la vista Comparación (chart 13, clon de ranking.js → barrio-comp.js).
// Se carga DESPUÉS de i18n-issue.js e i18n-barrio.js (reusa las claves
// c8-item-* y c8-rank-tpl del perfil). No toca i18n-issue.js.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // shell del graficador
    'g8-eyebrow':        'El barrio',
    'g8-lead':           'Qué dice cada sociedad que pasa seguido en su barrio. Compará países en un ítem, o mirá el perfil completo de un país.',
    'g8-view-comp':      'Comparación',
    'g8-view-perfil':    'Perfil',

    // chart 13 — comparación entre países (clon del ranking)
    'c13-title':         'El barrio latinoamericano, entre los más agitados del mundo',
    'c13-title-neutral': 'Qué pasa seguido en el barrio, país por país',
    'c13-subtitle-tpl':  'Porcentaje que dice que «{ITEM}» pasa muy o bastante seguido en su barrio. Encuesta de {PERIODO}. Mide saliencia percibida, no prevalencia: ver poco puede significar que hay poco, o que no se lo registra.',
    'c13-cat-label':     'Qué pasa en el barrio…',
    'c13-wave-label':    'Ola de la encuesta',
    'c13-view-label':    'Mostrar',
    'c13-view-sel':      'Mi selección',
    'c13-view-all':      'Todos los países',
    'c13-refs-label':    'Referencias',
    'c13-ref-median':   'Línea mundial',
    'c13-stat-label':   'Estadístico',
    'c13-stat-median':  'Mediana',
    'c13-stat-mean':    'Promedio',
    'c13-median-table-title': 'Mediana por región',
    'c13-mean-lbl':     'Promedio mundial',
    'c13-ref-table':     'Tabla regional',
    'c13-avg-table-title': 'Promedio por región',
    'c13-search-ph':     'Agregar país…',
    'c13-pick-hint-sel': 'Los países elegidos se muestran como barras.',
    'c13-pick-hint-all': 'Los países elegidos se etiquetan en el gráfico.',
    'c13-median-lbl':    'Mediana mundial',
    'c13-axis-x':        '% que dice que pasa muy o bastante seguido en su barrio',
    'c13-axis-mk':       '% que lo ve seguido en su barrio',
    'c13-tt-pct':        'Lo ve seguido',
    'c13-tt-year':       'Año',
    'c13-tt-n':          'Muestra',
    'c13-tt-rank':       'Puesto mundial',
    'c13-sources':       'Datos: World Values Survey, batería H002 («¿con qué frecuencia pasan estas cosas en tu barrio?»), olas 6 (2010-2016) y 7 (2017-2023). Indicador: % que responde «muy seguido» o «bastante seguido» sobre las cuatro opciones de respuesta, ponderado por S017; muestras de 1.000-2.000 casos. La mediana mundial y el puesto se calculan sobre los países con los cinco ítems en cada ola (64 en la ola 7, 59 en la 6). Es batería del WVS: no cubre Francia, Italia, los países nórdicos, Austria, Portugal ni los bálticos. Ojo: mide <em>saliencia percibida</em>, no prevalencia — cuánto registra la gente cada problema, no cuánto ocurre efectivamente.',
    'c13-sources-tpl':   'Datos: World Values Survey, batería H002 («¿qué pasa seguido en tu barrio?»). % «muy/bastante seguido», ponderado S017, {Y}. Mide saliencia percibida, no prevalencia.',
  });

  Object.assign(I18N.en, {
    // grapher shell
    'g8-eyebrow':        'The neighbourhood',
    'g8-lead':           'What each society says happens often in its neighbourhood. Compare countries on one item, or see a country’s full profile.',
    'g8-view-comp':      'Comparison',
    'g8-view-perfil':    'Profile',

    // chart 13 — cross-country comparison (ranking clone)
    'c13-title':         'The Latin American neighbourhood, among the world’s most eventful',
    'c13-title-neutral': 'What happens often in the neighbourhood, country by country',
    'c13-subtitle-tpl':  'Share who say “{ITEM}” happens very or quite frequently in their neighbourhood. Survey wave {PERIODO}. Measures perceived salience, not prevalence: seeing little may mean there is little, or that it goes unnoticed.',
    'c13-cat-label':     'What happens in the neighbourhood…',
    'c13-wave-label':    'Survey wave',
    'c13-view-label':    'Show',
    'c13-view-sel':      'My selection',
    'c13-view-all':      'All countries',
    'c13-refs-label':    'References',
    'c13-ref-median':   'World line',
    'c13-stat-label':   'Statistic',
    'c13-stat-median':  'Median',
    'c13-stat-mean':    'Mean',
    'c13-median-table-title': 'Regional median',
    'c13-mean-lbl':     'World mean',
    'c13-ref-table':     'Regional table',
    'c13-avg-table-title': 'Regional average',
    'c13-search-ph':     'Add country…',
    'c13-pick-hint-sel': 'The chosen countries show as bars.',
    'c13-pick-hint-all': 'The chosen countries are labelled on the chart.',
    'c13-median-lbl':    'World median',
    'c13-axis-x':        '% who say it happens very or quite frequently in their neighbourhood',
    'c13-axis-mk':       '% who see it often in their neighbourhood',
    'c13-tt-pct':        'Sees it often',
    'c13-tt-year':       'Year',
    'c13-tt-n':          'Sample',
    'c13-tt-rank':       'World rank',
    'c13-sources':       'Data: World Values Survey, H002 battery ("how frequently do these things occur in your neighbourhood?"), waves 6 (2010-2016) and 7 (2017-2023). Indicator: share answering "very frequently" or "quite frequently" out of the four response options, weighted by S017; samples of 1,000-2,000 cases. The world median and rank are computed over the countries with all five items in each wave (64 in wave 7, 59 in wave 6). This is a WVS-only battery: it does not cover France, Italy, the Nordics, Austria, Portugal or the Baltics. Note: it measures <em>perceived salience</em>, not prevalence — how much people register each problem, not how much actually occurs.',
    'c13-sources-tpl':   'Data: World Values Survey, H002 battery ("what happens often in your neighbourhood?"). % "very/quite frequently", weighted by S017, {Y}. Measures perceived salience, not prevalence.',
  });
})();
