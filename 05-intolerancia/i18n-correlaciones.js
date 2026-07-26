// Strings del chart 19 del N°5 — "¿Las intolerancias van juntas?": scatter que
// cruza DOS variables cualesquiera de la Integrated Values Survey.
// Se carga DESPUÉS de lib/i18n.js e i18n-issue.js (de donde salen las claves
// compartidas: reg.*, ctrl-select, chip-remove, footer-download…) y ANTES de
// correlaciones.js. NO toca i18n-issue.js: ese archivo lo comparten todos los
// charts del número.
//
// Los nombres de las 24 variables del menú NO están acá: vienen de
// CR_VARS[i].es / .en (data-cruces.js), que es la única verdad sobre qué mide
// cada indicador. Acá sólo están los rótulos de la interfaz.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c19-lead':          'Elegí dos preguntas de la encuesta y mirá cómo se ordenan los países. Sobre la diagonal, el rechazo del eje vertical pesa más que el del horizontal; abajo, al revés.',

    'c19-title':         'Las intolerancias van juntas, pero no son la misma cosa',
    'c19-title-neutral': 'Dos preguntas de la encuesta, país por país',
    'c19-subtitle':      'Cada punto es un país. Los dos ejes son porcentajes de la misma encuesta.',
    // {X}, {Y} = nombre de la variable de cada eje; {PERIODO} = etiqueta de la ola.
    'c19-subtitle-tpl':  'Cada punto es un país. Eje horizontal: {X}. Eje vertical: {Y}. Ola {PERIODO} de la encuesta: dentro de la ola, cada país salió a campo en un año distinto.',

    'c19-x-label':       'Eje horizontal',
    'c19-y-label':       'Eje vertical',
    'c19-grp-bateria':   'No querría de vecinos a…',
    'c19-grp-otras':     'Otras preguntas de la encuesta',
    'c19-swap':          'Invertir ejes',
    'c19-swap-aria':     'Intercambiar el eje horizontal y el vertical',
    'c19-wave-label':    'Ola de la encuesta',
    'c19-play':          'Reproducir',
    'c19-pause':         'Pausar',

    'c19-search-ph':     'Agregar país…',
    'c19-pick-hint':     'Los países elegidos se etiquetan en el gráfico.',

    'c19-banner-n':      'Países',
    'c19-banner-r':      'Correlación (r)',
    'c19-banner-r2':     'R²',
    'c19-banner-wave':   'Ola',

    'c19-leg-diag':      'Línea de 45°: mismo % en los dos ejes',
    'c19-leg-fit':       'Recta de ajuste',

    'c19-axis-tpl':      '{VAR} (%)',
    'c19-def-x':         'Eje X',
    'c19-def-y':         'Eje Y',

    'c19-tt-year':       'Encuesta de {Y}',
    'c19-empty':         'Ninguna ola de la encuesta mide estas dos preguntas a la vez en al menos 8 países. Probá otra combinación.',

    'c19-sources':       'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Cada punto es un país en una ola de la encuesta, y los dos ejes salen de la <strong>misma encuesta y de las mismas personas</strong>. Las 14 variables de «no querría de vecinos a…» son la batería A124 (mención espontánea); las otras 10 son preguntas sueltas del cuestionario, y arriba del gráfico se aclara qué mide exactamente cada eje. Porcentajes ponderados (S017) sobre respuestas válidas; se muestran sólo las olas en las que las dos preguntas se midieron en al menos 8 países en común. Dentro de una misma ola cada país salió a campo en un año distinto (Argentina 2017, Uruguay 2022): el año de cada punto está en el tooltip. Un país que no midió las dos preguntas en esa ola no aparece: no se interpola ni se arrastra ningún dato. La recta es un ajuste por mínimos cuadrados sobre los países del cruce y el R² dice cuánta de la variación entre países de un eje acompaña a la del otro. <strong>Ojo</strong>: una correlación alta entre dos rechazos <em>no</em> prueba que sean el mismo prejuicio. Las dos respuestas vienen del mismo cuestionario y de la misma persona, así que parte de lo que se ve es estilo de respuesta —quien le dice que no a todo, le dice que no a todo— y parte es el clima general de esa encuesta. Es una correlación entre países, no una relación causal ni una regularidad individual. Dos indicadores del menú van al revés que el resto y conviene tenerlo presente al leer el signo: «desconfía de la gente en general» es el complemento exacto del % que dice que se puede confiar en la gente, y en «enseña tolerancia a sus hijos» más es mejor.',
    'c19-sources-tpl':   'Datos: Integrated Values Survey (EVS + WVS), ola {PERIODO}. Eje X: {X}. Eje Y: {Y}. {N} países, R² = {R2}. Las dos preguntas salen de la misma encuesta y de la misma persona: parte de la correlación es estilo de respuesta, no el mismo prejuicio.',
  });

  Object.assign(I18N.en, {
    'c19-lead':          'Pick two survey questions and see how countries line up. Above the diagonal, the rejection on the vertical axis weighs more than the one on the horizontal axis; below it, the other way around.',

    'c19-title':         'Intolerances travel together — but they are not the same thing',
    'c19-title-neutral': 'Two survey questions, country by country',
    'c19-subtitle':      'Each dot is a country. Both axes are percentages from the same survey.',
    'c19-subtitle-tpl':  'Each dot is a country. Horizontal axis: {X}. Vertical axis: {Y}. {PERIODO} wave of the survey: within a wave, each country went to the field in a different year.',

    'c19-x-label':       'Horizontal axis',
    'c19-y-label':       'Vertical axis',
    'c19-grp-bateria':   'Would not want as neighbours…',
    'c19-grp-otras':     'Other survey questions',
    'c19-swap':          'Swap axes',
    'c19-swap-aria':     'Swap the horizontal and the vertical axis',
    'c19-wave-label':    'Survey wave',
    'c19-play':          'Play',
    'c19-pause':         'Pause',

    'c19-search-ph':     'Add a country…',
    'c19-pick-hint':     'Selected countries are labelled on the chart.',

    'c19-banner-n':      'Countries',
    'c19-banner-r':      'Correlation (r)',
    'c19-banner-r2':     'R²',
    'c19-banner-wave':   'Wave',

    'c19-leg-diag':      '45° line: same % on both axes',
    'c19-leg-fit':       'Line of best fit',

    'c19-axis-tpl':      '{VAR} (%)',
    'c19-def-x':         'X axis',
    'c19-def-y':         'Y axis',

    'c19-tt-year':       'Surveyed in {Y}',
    'c19-empty':         'No survey wave measures these two questions at the same time in at least 8 countries. Try another combination.',

    'c19-sources':       'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Each dot is a country in one wave of the survey, and both axes come from the <strong>same survey and the same respondents</strong>. The 14 “would not want as neighbours” variables are the A124 battery (spontaneous mention); the other 10 are standalone questions, and the exact definition of each axis is shown above the chart. Weighted shares (S017) over valid answers; only waves in which both questions were measured in at least 8 common countries are shown. Within a wave each country went to the field in a different year (Argentina 2017, Uruguay 2022): the year of each dot is in the tooltip. A country that did not measure both questions in that wave is simply absent — nothing is interpolated or carried over. The line is an ordinary least-squares fit over the countries in the cross, and the R² says how much of the between-country variation on one axis goes along with the other. <strong>Careful</strong>: a high correlation between two rejections does <em>not</em> prove they are the same prejudice. Both answers come from the same questionnaire and the same person, so part of what you see is response style — whoever says no to everything says no to everything — and part is the general climate of that survey. This is a correlation across countries, not a causal relationship nor an individual-level regularity. Two indicators in the menu run the opposite way and it is worth keeping in mind when reading the sign: “distrusts people in general” is the exact complement of the share saying most people can be trusted, and in “teaches tolerance to their children” more is better.',
    'c19-sources-tpl':   'Data: Integrated Values Survey (EVS + WVS), {PERIODO} wave. X axis: {X}. Y axis: {Y}. {N} countries, R² = {R2}. Both questions come from the same survey and the same respondent: part of the correlation is response style, not the same prejudice.',
  });
})();
