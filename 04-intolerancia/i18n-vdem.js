// =============================================================
//  Strings del graficador de V-Dem (chart-vdem.html)
// =============================================================
// Se carga DESPUÉS de i18n-issue.js (que define I18N) y ANTES de los motores.
// NO toca i18n-issue.js: ese archivo lo comparten todos los charts del número.
//
// Los nombres de las 6 variables NO están acá: salen de VD_VARS[].es/.en en
// data-vdem.js, que es la única fuente de verdad del menú (así el rótulo del eje,
// la opción del selector y la definición de «Fuentes» nunca se desincronizan).
//
// OJO CON LA DIRECCIÓN, que es la trampa de este dataset: el ÍNDICE va de 0 (sin
// exclusión) a 1 (exclusión total) — más es PEOR — mientras que sus cinco
// COMPONENTES son escala de intervalo centrada en ~0 y apuntan al revés — más es
// MEJOR. Los textos tienen que decirlo o el lector interpreta al revés la mitad
// del menú.
(function () {
  if (typeof I18N === 'undefined') return;

  var FUENTES_ES = 'Datos: <strong>V-Dem (Varieties of Democracy) v16</strong>, Universidad de Gotemburgo. '
    + 'El <strong>índice de exclusión por grupo social</strong> (v2xpe_exlsocgr) mide cuánto se le niega a la gente '
    + 'el acceso a servicios o la participación por pertenecer a un grupo social —etnia, lengua, raza, religión, '
    + 'casta, región—, y va de 0 (sin exclusión) a 1 (exclusión total). '
    + '<strong>Sus cinco componentes no están en la misma escala ni apuntan en la misma dirección</strong>: son '
    + 'estimaciones del modelo de medición de V-Dem en escala de intervalo centrada en 0 (aproximadamente el '
    + 'promedio histórico mundial), y ahí <em>más es mejor</em>, es decir más igualitario. Es la misma escala que '
    + 'publica Our World in Data; el 0-4 que aparece en el codebook es la escala ordinal con la que codifican los '
    + 'expertos, que V-Dem distribuye aparte. En el mapa, el tono oscuro significa siempre <em>peor</em>: la rampa '
    + 'se invierte sola cuando la variable elegida apunta al revés. '
    + 'Los pesos de cada componente dentro del índice, según la estructura de agregación oficial, son: acceso a '
    + 'servicios públicos 0,409; acceso a negocios con el Estado 0,306; acceso a empleos del Estado 0,298; poder '
    + 'político 0,511; libertades civiles 0,522. '
    + 'La cobertura llega hasta 2023 para el índice y los tres componentes de acceso, y hasta 2025 para poder '
    + 'político y libertades civiles; el selector de año usa el rango propio de cada variable. Se incluyen 174 '
    + 'países. Quedan afuera las entidades históricas que V-Dem cubre y hoy no existen como país (Baden, Dos '
    + 'Sicilias, la RDA, Vietnam del Sur, entre otras) y las islas del Pacífico, que la taxonomía regional del '
    + 'Atlas no puede ubicar sin forzarla. '
    + '<strong>V-Dem son estimaciones de expertos</strong>, con su propia incertidumbre: no son un censo ni una '
    + 'encuesta a la población.';

  var FUENTES_EN = 'Data: <strong>V-Dem (Varieties of Democracy) v16</strong>, University of Gothenburg. '
    + 'The <strong>exclusion by social group index</strong> (v2xpe_exlsocgr) measures how far people are denied '
    + 'access to services or participation because they belong to a social group —ethnicity, language, race, '
    + 'religion, caste, region— and runs from 0 (no exclusion) to 1 (total exclusion). '
    + '<strong>Its five components are neither on the same scale nor pointing the same way</strong>: they are '
    + 'V-Dem measurement-model estimates on an interval scale centred on 0 (roughly the historical world average), '
    + 'and there <em>higher is better</em>, meaning more equal. It is the same scale Our World in Data publishes; '
    + 'the 0-4 range in the codebook is the ordinal scale experts code with, which V-Dem distributes separately. '
    + 'On the map, darker always means <em>worse</em>: the ramp flips automatically when the selected variable '
    + 'points the other way. '
    + 'The weight of each component within the index, per the official aggregation structure, is: access to public '
    + 'services 0.409; access to state business opportunities 0.306; access to state jobs 0.298; political power '
    + '0.511; civil liberties 0.522. '
    + 'Coverage runs to 2023 for the index and the three access components, and to 2025 for political power and '
    + 'civil liberties; the year selector uses each variable\'s own range. 174 countries are included. Historical '
    + 'polities that V-Dem covers but no longer exist as countries (Baden, the Two Sicilies, the GDR, South '
    + 'Vietnam, among others) are excluded, as are the Pacific islands, which the Atlas regional taxonomy cannot '
    + 'place without forcing it. '
    + '<strong>V-Dem figures are expert estimates</strong> with their own uncertainty: they are neither a census '
    + 'nor a population survey.';

  Object.assign(I18N.es, {
    // ---- shell del graficador ----
    'gvd-eyebrow':   'Exclusión social',
    'gvd-lead':      'Cuánto se le niega a la gente el acceso a servicios o a la participación por pertenecer a un grupo social. El índice de V-Dem y los cinco indicadores que lo componen, en 174 países desde 1900.',
    'gvd-view-comp': 'Comparación',
    'gvd-view-mapa': 'Mapa',
    'gvd-view-evol': 'Evolución',
    'gvd-card-title': 'La exclusión social en el mundo: comparación, mapa y evolución',

    // ---- común a las tres vistas ----
    'cvd-var-label':  'Indicador',
    'cvd-year-label': 'Año',

    // ---- chart 21: comparación (ranking + marimekko) ----
    'c21-title':          'La exclusión por grupo social separa más a los países que su ingreso',
    'c21-title-neutral':  'Exclusión por grupo social',
    'c21-subtitle-tpl':   '{CAT}. Año {PERIODO}.',
    'c21-cat-label':      'Indicador',
    'c21-wave-label':     'Año',
    'c21-view-label':     'Mostrar',
    'c21-view-sel':       'Mi selección',
    'c21-view-all':       'Todos los países',
    'c21-refs-label':     'Referencias',
    'c21-ref-median':   'Línea mundial',
    'c21-stat-label':   'Estadístico',
    'c21-stat-median':  'Mediana',
    'c21-stat-mean':    'Promedio',
    'c21-median-table-title': 'Mediana por región',
    'c21-mean-lbl':     'Promedio mundial',
    'c21-ref-table':      'Tabla regional',
    'c21-median-lbl':     'Mediana mundial',
    'c21-avg-table-title':'Promedio por región',
    'c21-search-ph':      'Agregar país…',
    'c21-pick-hint-sel':  'Los elegidos son las barras del gráfico.',
    'c21-pick-hint-all':  'Los países elegidos se etiquetan en el gráfico.',
    'c21-axis-x':         'Valor del indicador',
    'c21-axis-mk':        'Valor del indicador',
    'c21-tt-pct':         'Valor',
    'c21-tt-year':        'Año',
    'c21-tt-rank':        'Puesto mundial',
    'c21-rank-tpl':       '{R}° de {N}',
    'c21-tt-n':           'Países con dato',
    'c21-sources':        FUENTES_ES,
    'c21-sources-tpl':    'Datos: V-Dem v16 (Universidad de Gotemburgo), año {R}. El índice va de 0 a 1 (más = más exclusión); sus cinco componentes están centrados en 0 y apuntan al revés (más = más igualitario).',

    // ---- chart 22: mapa ----
    'c22-title':          'El mapa de la exclusión social',
    'c22-title-neutral':  'Exclusión por grupo social en el mundo',
    'c22-subtitle-tpl':   '{CAT}. Año {PERIODO}. En el mapa, el tono más oscuro es siempre el peor valor.',
    'c22-tt-value':       'Valor del indicador',
    'c22-tt-year':        'Año',
    'c22-tt-nodata':      'Sin dato',
    'c22-tt-trend':       'Trayectoria',
    'c22-legend-title':   'Valor del indicador',
    'c22-legend-nodata':  'Sin dato',
    'c22-sources':        FUENTES_ES,
    'c22-sources-tpl':    'Datos: V-Dem v16 (Universidad de Gotemburgo), año {R}. El tono oscuro es siempre el peor valor: la rampa se invierte cuando la variable apunta al revés.',

    // ---- chart 23: evolución ----
    'c23-title':          'Un siglo de exclusión social',
    'c23-title-neutral':  'La evolución de la exclusión por grupo social',
    'c23-subtitle-tpl':   '{CAT}, a lo largo del tiempo. V-Dem, desde 1900.',
    'c23-axis-y':         'Valor del indicador',
    'c23-sources':        FUENTES_ES,
    'c23-sources-tpl':    'Datos: V-Dem v16 (Universidad de Gotemburgo), 1900 en adelante. El índice va de 0 a 1 (más = más exclusión); sus cinco componentes están centrados en 0 y apuntan al revés.'
  });

  Object.assign(I18N.en, {
    'gvd-eyebrow':   'Social exclusion',
    'gvd-lead':      'How far people are denied access to services or participation because of the social group they belong to. The V-Dem index and its five components, across 174 countries since 1900.',
    'gvd-view-comp': 'Comparison',
    'gvd-view-mapa': 'Map',
    'gvd-view-evol': 'Trend',
    'gvd-card-title': 'Social exclusion around the world: comparison, map and trend',

    'cvd-var-label':  'Indicator',
    'cvd-year-label': 'Year',

    'c21-title':          'Exclusion by social group separates countries more than their income does',
    'c21-title-neutral':  'Exclusion by social group',
    'c21-subtitle-tpl':   '{CAT}. Year {PERIODO}.',
    'c21-cat-label':      'Indicator',
    'c21-wave-label':     'Year',
    'c21-view-label':     'Show',
    'c21-view-sel':       'My selection',
    'c21-view-all':       'All countries',
    'c21-refs-label':     'References',
    'c21-ref-median':   'World line',
    'c21-stat-label':   'Statistic',
    'c21-stat-median':  'Median',
    'c21-stat-mean':    'Mean',
    'c21-median-table-title': 'Regional median',
    'c21-mean-lbl':     'World mean',
    'c21-ref-table':      'Regional table',
    'c21-median-lbl':     'World median',
    'c21-avg-table-title':'Regional average',
    'c21-search-ph':      'Add country…',
    'c21-pick-hint-sel':  'The ones you pick are the bars.',
    'c21-pick-hint-all':  'The countries you pick get labelled on the chart.',
    'c21-axis-x':         'Indicator value',
    'c21-axis-mk':        'Indicator value',
    'c21-tt-pct':         'Value',
    'c21-tt-year':        'Year',
    'c21-tt-rank':        'World rank',
    'c21-rank-tpl':       '#{R} of {N}',
    'c21-tt-n':           'Countries with data',
    'c21-sources':        FUENTES_EN,
    'c21-sources-tpl':    'Data: V-Dem v16 (University of Gothenburg), year {R}. The index runs 0 to 1 (higher = more exclusion); its five components are centred on 0 and point the other way (higher = more equal).',

    'c22-title':          'The map of social exclusion',
    'c22-title-neutral':  'Exclusion by social group around the world',
    'c22-subtitle-tpl':   '{CAT}. Year {PERIODO}. On the map, the darkest shade is always the worst value.',
    'c22-tt-value':       'Indicator value',
    'c22-tt-year':        'Year',
    'c22-tt-nodata':      'No data',
    'c22-tt-trend':       'Trend',
    'c22-legend-title':   'Indicator value',
    'c22-legend-nodata':  'No data',
    'c22-sources':        FUENTES_EN,
    'c22-sources-tpl':    'Data: V-Dem v16 (University of Gothenburg), year {R}. Darker always means worse: the ramp flips when the variable points the other way.',

    'c23-title':          'A century of social exclusion',
    'c23-title-neutral':  'The trend in exclusion by social group',
    'c23-subtitle-tpl':   '{CAT}, over time. V-Dem, from 1900 on.',
    'c23-axis-y':         'Indicator value',
    'c23-sources':        FUENTES_EN,
    'c23-sources-tpl':    'Data: V-Dem v16 (University of Gothenburg), 1900 onwards. The index runs 0 to 1 (higher = more exclusion); its five components are centred on 0 and point the other way.'
  });
})();
