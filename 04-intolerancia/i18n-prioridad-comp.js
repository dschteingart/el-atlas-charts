// Strings del graficador de "Primero los de acá" (chart-prioridad.html):
// pestañas del shell (g7-*) + la vista Comparación (chart 14, clon de
// barrio-comp.js → prioridad-comp.js).
// Se carga DESPUÉS de i18n-issue.js e i18n-prioridad.js (de donde reusa las
// claves c7-ind-origen / c7-ind-genero para las opciones del selector de
// indicador) y ANTES de prioridad-comp.js. No toca i18n-issue.js: ese archivo
// lo comparten todos los charts del número.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // ---- shell del graficador ----
    'g7-eyebrow':        'Prioridad en el empleo',
    'g7-lead':           'Cuando escasea el trabajo, ¿quién debería tener prioridad? Compará países en cada ola de la encuesta, o seguí la evolución desde 1990.',
    'g7-view-comp':      'Comparación',
    'g7-view-evol':      'Evolución',

    // ---- chart 14 — comparación entre países (clon del ranking) ----
    'c14-title':         'En «primero los de acá», América Latina queda por debajo de la mediana mundial',
    'c14-title-neutral': 'Quién tiene prioridad cuando escasea el trabajo',
    // {PERIODO} = etiqueta de la ola activa (la misma que el resto del número).
    'c14-subtitle-origen': 'Porcentaje de acuerdo con que, cuando escasea el trabajo, los nativos deberían tener prioridad sobre los inmigrantes. Ola {PERIODO} de la encuesta: dentro de la ola, cada país salió a campo en un año distinto.',
    'c14-subtitle-genero': 'Porcentaje de acuerdo con que, cuando escasea el trabajo, los varones deberían tener más derecho a un empleo que las mujeres. Ola {PERIODO} de la encuesta: dentro de la ola, cada país salió a campo en un año distinto.',

    'c14-cat-label':     'Prioridad para…',
    'c14-wave-label':    'Ola de la encuesta',
    'c14-view-label':    'Mostrar',
    'c14-view-sel':      'Mi selección',
    'c14-view-all':      'Todos los países',
    'c14-refs-label':    'Referencias',
    'c14-ref-median':   'Línea mundial',
    'c14-stat-label':   'Estadístico',
    'c14-stat-median':  'Mediana',
    'c14-stat-mean':    'Promedio',
    'c14-median-table-title': 'Mediana por región',
    'c14-mean-lbl':     'Promedio mundial',
    'c14-ref-table':     'Tabla regional',
    'c14-avg-table-title': 'Promedio por región',
    'c14-search-ph':     'Agregar país…',
    'c14-pick-hint-sel': 'Los países elegidos se muestran como barras.',
    'c14-pick-hint-all': 'Los países elegidos se etiquetan en el gráfico.',
    'c14-median-lbl':    'Mediana mundial',
    'c14-axis-x':        '% de acuerdo con darles prioridad en el empleo',
    'c14-axis-mk':       '% de acuerdo',
    'c14-tt-pct':        'De acuerdo',
    'c14-tt-year':       'Año del dato',
    'c14-tt-n':          'Muestra',
    'c14-tt-rank':       'Puesto mundial',
    'c14-rank-tpl':      '{R}° de {N}',

    'c14-sources':       'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Dos afirmaciones de la misma batería: «cuando escasea el trabajo, los nativos deberían tener prioridad sobre los inmigrantes» (C002) y «…los varones deberían tener más derecho a un empleo que las mujeres» (C001). Se muestra el % que responde «de acuerdo» sobre el total de respuestas válidas (de acuerdo / ni de acuerdo ni en desacuerdo / en desacuerdo): el «ni una ni otra» queda en el denominador. % ponderado (S017); solo celdas con al menos 200 casos. Los países se comparan dentro de una misma <strong>ola</strong> de la encuesta, la que elija el slider: 1989-1993, 1994-1998, 1999-2004, 2005-2010, 2010-2014 o 2017-2022. <strong>Dentro de una misma ola cada país salió a campo en un año distinto</strong> (en la de 2017-2022, Argentina midió en 2017 y Uruguay en 2022): pasá el mouse por cada barra para ver el año de ese país. Un país que no midió en la ola elegida no aparece: no se interpola ni se completa nada. Países por ola — prioridad a los nativos: 42, 52, 69, 80, 55 y 92; prioridad a los varones: 42, 55, 70, 81, 60 y 92 (115 y 117 países distintos en total). La mediana mundial y el puesto se calculan sobre los países de la ola que se está viendo. Con unos 1.000 casos por medición el error estándar ronda los 1,6 puntos: diferencias de pocos puntos entre países no son informativas. Mide actitudes <em>declaradas</em> ante un encuestador.',
    'c14-sources-tpl':   'Datos: Integrated Values Survey (EVS + WVS). % de acuerdo. Ola {PERIODO} de la encuesta: dentro de la ola el año difiere entre países.',
  });

  Object.assign(I18N.en, {
    // ---- grapher shell ----
    'g7-eyebrow':        'Priority for jobs',
    'g7-lead':           'When jobs are scarce, who should get priority? Compare countries within each survey wave, or follow the trend since 1990.',
    'g7-view-comp':      'Comparison',
    'g7-view-evol':      'Trend',

    // ---- chart 14 — cross-country comparison (ranking clone) ----
    'c14-title':         'On “locals first”, Latin America sits below the world median',
    'c14-title-neutral': 'Who gets priority when jobs are scarce',
    'c14-subtitle-origen': 'Share who agree that, when jobs are scarce, employers should give priority to the native-born over immigrants. Survey wave {PERIODO}: within the wave, each country was surveyed in a different year.',
    'c14-subtitle-genero': 'Share who agree that, when jobs are scarce, men should have more right to a job than women. Survey wave {PERIODO}: within the wave, each country was surveyed in a different year.',

    'c14-cat-label':     'Priority for…',
    'c14-wave-label':    'Survey wave',
    'c14-view-label':    'Show',
    'c14-view-sel':      'My selection',
    'c14-view-all':      'All countries',
    'c14-refs-label':    'References',
    'c14-ref-median':   'World line',
    'c14-stat-label':   'Statistic',
    'c14-stat-median':  'Median',
    'c14-stat-mean':    'Mean',
    'c14-median-table-title': 'Regional median',
    'c14-mean-lbl':     'World mean',
    'c14-ref-table':     'Regional table',
    'c14-avg-table-title': 'Regional average',
    'c14-search-ph':     'Add country…',
    'c14-pick-hint-sel': 'The chosen countries show as bars.',
    'c14-pick-hint-all': 'The chosen countries are labelled on the chart.',
    'c14-median-lbl':    'World median',
    'c14-axis-x':        '% who agree they should get priority for jobs',
    'c14-axis-mk':       '% who agree',
    'c14-tt-pct':        'Agree',
    'c14-tt-year':       'Year of reading',
    'c14-tt-n':          'Sample',
    'c14-tt-rank':       'World rank',
    'c14-rank-tpl':      '#{R} of {N}',

    'c14-sources':       'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Two statements from the same battery: "when jobs are scarce, employers should give priority to [nation] people over immigrants" (C002) and "…men should have more right to a job than women" (C001). The chart shows the % answering "agree" out of all valid responses (agree / neither / disagree): the "neither" stays in the denominator. Weighted % (S017); only cells with at least 200 cases. <strong>Each country contributes its latest available reading, so the years do not line up</strong> (Argentina 2017, Uruguay 2022, Sweden 2017…): hover over each bar to see the year. Nothing is interpolated and no common-year snapshot is constructed. Priority for the native-born: 115 countries; priority for men: 117 countries. The world median and the rank are computed over those countries. With about 1,000 cases per reading the standard error is around 1.6 points: gaps of a few points between countries are not informative. Measures attitudes <em>declared</em> to an interviewer.',
    'c14-sources-tpl':   'Data: Integrated Values Survey (EVS + WVS). % who agree. Latest available reading for each country ({RANGO}): the year differs across countries.',
  });
})();
