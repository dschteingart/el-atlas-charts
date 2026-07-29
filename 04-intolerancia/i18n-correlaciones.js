// Strings del chart 19 del N°4 — "¿Las intolerancias van juntas?": scatter que
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
    // Una sola línea: el lead largo costaba tres renglones de alto y el gráfico
    // no entraba en pantalla sin scrollear.
    'c19-lead':          'Elegí dos preguntas de la encuesta y mirá cómo se ordenan los países. Por encima de la línea de igual valor pesa más el eje vertical.',

    'c19-title':         'Las intolerancias van juntas, pero no son la misma cosa',
    'c19-title-neutral': 'Dos preguntas de la encuesta',
    // Vista de brechas: titulo corto y declarativo, subtitulo con la medicion
    // exacta (criterio de Daniel: "como si fuera un paper o el Economist"; nada
    // de "cada fila es un pais", que describe el dibujo y no el hallazgo).
    'c19-title-db':      'Cuando las dos preguntas no coinciden',
    'c19-title-db-neutral': 'La brecha entre dos preguntas',
    'c19-subtitle-db-tpl': '{X} frente a {Y}, en porcentaje. Ola {PERIODO}. Ordenados por el tamaño de la brecha.',
    'c19-x-label-db':    'Primera variable',
    'c19-y-label-db':    'Segunda variable',
    'c19-subtitle':      'Cada punto es un país. Los dos ejes son porcentajes de la misma encuesta.',
    // {X}, {Y} = nombre de la variable de cada eje; {PERIODO} = etiqueta de la
    // ola. La letra chica (cada país sale a campo en un año distinto dentro de
    // la ola) vive en «Ver metodología y fuentes».
    'c19-subtitle-tpl':  'Cada punto es un país. Eje horizontal: {X}. Eje vertical: {Y}. Ola {PERIODO}.',

    'c19-view-label':    'Vista',
    'c19-view-scatter':  'Dispersión',
    'c19-view-dumbbell': 'Brechas',
    'c19-db-empty':      'Agregá países con el buscador: cada país elegido es una fila.',
    'c19-x-label':       'Eje horizontal',
    'c19-y-label':       'Eje vertical',
    'c19-grp-bateria':   'No querría de vecinos a…',
    'c19-grp-otras':     'Otras preguntas de la encuesta',
    'c19-grp-wrp':       'Discriminación vivida (otra encuesta)',
    'c19-sources-wrp':   ' <strong>Ojo con «sufrió discriminación por su color de piel»</strong>: es la única variable del menú que NO sale de la Integrated Values Survey. Viene del World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup, 139 países, CC BY 4.0), que le pregunta a cada persona si alguna vez sufrió discriminación por el color de su piel (sí/no/no corresponde/NS/NC, ponderado por WGT). Cuando está en algún eje, el gráfico deja de cumplir la condición de arriba: los dos ejes salen de <strong>encuestas distintas y de personas distintas</strong>, así que no hay estilo de respuesta compartido —eso juega a favor— pero sí dos operativos, dos muestras y dos años distintos. Se la cruza contra la ola 2017-2022 de la IVS, que es la más cercana; el año real de cada punto (2023 del lado del World Risk Poll) está en el tooltip. Y sobre todo: mide <em>experiencia propia</em>, no opinión sobre terceros. Que en un país poca gente declare haber sufrido discriminación no prueba que sea menos racista: puede ser más homogéneo, o tener menos conciencia del problema.',
    'c19-swap':          'Invertir ejes',
    'c19-refs-label':    'Referencias',
    'c19-ref-diag':      'Igual valor',
    'c19-ref-fit':       'Recta de ajuste',
    'c19-swap-aria':     'Intercambiar el eje horizontal y el vertical',
    'c19-wave-label':    'Ola de la encuesta',
    'c19-play':          'Reproducir',
    'c19-pause':         'Pausar',

    'c19-search-ph':     'Agregar país…',
    'c19-pick-hint':     'Los países elegidos se etiquetan en el gráfico.',

    // Banner sobrio, como el del N°2: países, r y R². Nada más (la ola ya la
    // muestra el slider, al lado).
    'c19-banner-n':      'Países',
    'c19-banner-r':      'Correlación (r)',
    'c19-banner-r2':     'R²',
    'c19-fewfit':        'Muy pocos países para estimar un ajuste.',
    'c19-empty-short':   'Sin datos para esta combinación.',

    'c19-leg-diag':      'Igual valor en los dos ejes',
    'c19-leg-fit':       'Recta de ajuste',
    'c19-legend-hint':   'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla del ajuste.',
    'c19-show-all':      'Ver todas las regiones',

    'c19-axis-tpl':      '{VAR} (%)',
    'c19-def-x':         'Eje X',
    'c19-def-y':         'Eje Y',

    'c19-tt-year':       'Encuesta de {Y}',
    'c19-empty':         'Ninguna ola de la encuesta mide estas dos preguntas a la vez en al menos 8 países. Probá otra combinación.',

    'c19-sources':       'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Cada punto es un país en una ola de la encuesta, y los dos ejes salen de la <strong>misma encuesta y de las mismas personas</strong>. Las 14 variables de «no querría de vecinos a…» son la batería A124 (mención espontánea); las otras 10 son preguntas sueltas del cuestionario, y arriba del gráfico se aclara qué mide exactamente cada eje. Porcentajes ponderados (S017) sobre respuestas válidas; se muestran sólo las olas en las que las dos preguntas se midieron en al menos 8 países en común. Dentro de una misma ola cada país salió a campo en un año distinto (Argentina 2017, Uruguay 2022): el año de cada punto está en el tooltip. Un país que no midió las dos preguntas en esa ola no aparece: no se interpola ni se arrastra ningún dato. La recta es un ajuste por mínimos cuadrados sobre los países del cruce y el R² dice cuánta de la variación entre países de un eje acompaña a la del otro. <strong>Ojo</strong>: una correlación alta entre dos rechazos <em>no</em> prueba que sean el mismo prejuicio. Las dos respuestas vienen del mismo cuestionario y de la misma persona, así que parte de lo que se ve es estilo de respuesta —quien le dice que no a todo, le dice que no a todo— y parte es el clima general de esa encuesta. Es una correlación entre países, no una relación causal ni una regularidad individual. Dos indicadores del menú van al revés que el resto y conviene tenerlo presente al leer el signo: «desconfía de la gente en general» es el complemento exacto del % que dice que se puede confiar en la gente, y en «enseña tolerancia a sus hijos» más es mejor.',
    'c19-sources-tpl-ext': 'Datos: Integrated Values Survey (EVS + WVS) y World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup), ola {PERIODO}. Eje X: {X}. Eje Y: {Y}. {N} países. Los dos ejes salen de encuestas distintas y de personas distintas: no hay estilo de respuesta compartido, pero sí dos operativos y dos años distintos. El World Risk Poll mide experiencia propia de discriminación, no opinión sobre terceros.',
    'c19-sources-tpl':   'Datos: Integrated Values Survey (EVS + WVS), ola {PERIODO}. Eje X: {X}. Eje Y: {Y}. {N} países. Las dos preguntas salen de la misma encuesta y de la misma persona: parte de la correlación es estilo de respuesta, no el mismo prejuicio.',
  });

  Object.assign(I18N.en, {
    'c19-lead':          'Pick two survey questions and see how countries line up. Above the equal-value line, the vertical axis weighs more.',

    'c19-title':         'Intolerances travel together — but they are not the same thing',
    'c19-title-neutral': 'Two survey questions',
    'c19-title-db':      'When the two questions disagree',
    'c19-title-db-neutral': 'The gap between two questions',
    'c19-subtitle-db-tpl': '{X} versus {Y}, per cent. {PERIODO} wave. Ordered by the size of the gap.',
    'c19-x-label-db':    'First variable',
    'c19-y-label-db':    'Second variable',
    'c19-subtitle':      'Each dot is a country. Both axes are percentages from the same survey.',
    'c19-subtitle-tpl':  'Each dot is a country. Horizontal axis: {X}. Vertical axis: {Y}. {PERIODO} wave.',

    'c19-view-label':    'View',
    'c19-view-scatter':  'Scatter',
    'c19-view-dumbbell': 'Gaps',
    'c19-db-empty':      'Add countries with the search box: each selected country is a row.',
    'c19-x-label':       'Horizontal axis',
    'c19-y-label':       'Vertical axis',
    'c19-grp-bateria':   'Would not want as neighbours…',
    'c19-grp-otras':     'Other survey questions',
    'c19-grp-wrp':       'Experienced discrimination (another survey)',
    'c19-sources-wrp':   ' <strong>A note on “has experienced discrimination over skin colour”</strong>: it is the only variable in the menu that does NOT come from the Integrated Values Survey. It comes from the World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup, 139 countries, CC BY 4.0), which asks each respondent whether they have ever experienced discrimination because of the colour of their skin (yes/no/does not apply/DK/refused, weighted by WGT). Whenever it sits on an axis, the condition above no longer holds: the two axes come from <strong>different surveys and different people</strong>, so there is no shared response style —which helps— but there are two fieldworks, two samples and two different years. It is crossed against the IVS 2017-2022 wave, the closest one; each dot\u2019s real year (2023 on the World Risk Poll side) is in the tooltip. Above all: it measures <em>first-person experience</em>, not an opinion about others. Fewer people reporting discrimination does not prove a country is less racist: it may be more homogeneous, or less aware of the problem.',
    'c19-swap':          'Swap axes',
    'c19-refs-label':    'Reference lines',
    'c19-ref-diag':      'Equal value',
    'c19-ref-fit':       'Fit line',
    'c19-swap-aria':     'Swap the horizontal and the vertical axis',
    'c19-wave-label':    'Survey wave',
    'c19-play':          'Play',
    'c19-pause':         'Pause',

    'c19-search-ph':     'Add a country…',
    'c19-pick-hint':     'Selected countries are labelled on the chart.',

    'c19-banner-n':      'Countries',
    'c19-banner-r':      'Correlation (r)',
    'c19-banner-r2':     'R²',
    'c19-fewfit':        'Too few countries to estimate a fit.',
    'c19-empty-short':   'No data for this combination.',

    'c19-leg-diag':      'Equal value on both axes',
    'c19-leg-fit':       'Line of best fit',
    'c19-legend-hint':   'Hover a region in the legend to reveal its country names; click (or tap) to switch it off and drop it from the fit.',
    'c19-show-all':      'Show all regions',

    'c19-axis-tpl':      '{VAR} (%)',
    'c19-def-x':         'X axis',
    'c19-def-y':         'Y axis',

    'c19-tt-year':       'Surveyed in {Y}',
    'c19-empty':         'No survey wave measures these two questions at the same time in at least 8 countries. Try another combination.',

    'c19-sources':       'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022). Each dot is a country in one wave of the survey, and both axes come from the <strong>same survey and the same respondents</strong>. The 14 “would not want as neighbours” variables are the A124 battery (spontaneous mention); the other 10 are standalone questions, and the exact definition of each axis is shown above the chart. Weighted shares (S017) over valid answers; only waves in which both questions were measured in at least 8 common countries are shown. Within a wave each country went to the field in a different year (Argentina 2017, Uruguay 2022): the year of each dot is in the tooltip. A country that did not measure both questions in that wave is simply absent — nothing is interpolated or carried over. The line is an ordinary least-squares fit over the countries in the cross, and the R² says how much of the between-country variation on one axis goes along with the other. <strong>Careful</strong>: a high correlation between two rejections does <em>not</em> prove they are the same prejudice. Both answers come from the same questionnaire and the same person, so part of what you see is response style — whoever says no to everything says no to everything — and part is the general climate of that survey. This is a correlation across countries, not a causal relationship nor an individual-level regularity. Two indicators in the menu run the opposite way and it is worth keeping in mind when reading the sign: “distrusts people in general” is the exact complement of the share saying most people can be trusted, and in “teaches tolerance to their children” more is better.',
    'c19-sources-tpl-ext': 'Data: Integrated Values Survey (EVS + WVS) and World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup), {PERIODO} wave. X axis: {X}. Y axis: {Y}. {N} countries. The two axes come from different surveys and different people: no shared response style, but two fieldworks and two different years. The World Risk Poll measures first-person experience of discrimination, not opinions about others.',
    'c19-sources-tpl':   'Data: Integrated Values Survey (EVS + WVS), {PERIODO} wave. X axis: {X}. Y axis: {Y}. {N} countries. Both questions come from the same survey and the same respondent: part of the correlation is response style, not the same prejudice.',
  });
})();
