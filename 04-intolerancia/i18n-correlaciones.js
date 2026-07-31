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

    // Titular editorial: sólo con el par por default y sólo si el dato lo
    // sostiene (|r| < 0,25 — ver co_updateTitle). Puede ser evocativo porque el
    // subtítulo nombra las dos mediciones con toda precisión.
    'c19-title-editorial': 'Decimos una cosa, vemos otra',
    'c19-title-neutral': 'Dos preguntas de la encuesta',
    // Titulo dinamico, criterio OWID (decision de Daniel 2026-07-29): el titulo
    // son las DOS mediciones; el conector distingue la vista ("frente a" cruza,
    // "y" compara). Los nombres salen de CR_VARS[i].titulo_es, que son formas de
    // titulo y no rotulos de categoria.
    'c19-db-axis':       '% de encuestados de cada país',
    'c19-title-tpl':     '{X} frente a {Y}',
    'c19-title-db-tpl':  '{X} y {Y}',
    'c19-subtitle-tpl':  'Porcentaje que {X} frente al porcentaje que {Y}. Ola {PERIODO}.',
    // Vista de brechas: titulo corto y declarativo, subtitulo con la medicion
    // exacta (criterio de Daniel: "como si fuera un paper o el Economist"; nada
    // de "cada fila es un pais", que describe el dibujo y no el hallazgo).
    'c19-x-label-db':    'Primera variable',
    'c19-y-label-db':    'Segunda variable',
    'c19-subtitle':      'Porcentaje de encuestados que da cada respuesta.',
    // {X}, {Y} = nombre de la variable de cada eje; {PERIODO} = etiqueta de la
    // ola. La letra chica (cada país sale a campo en un año distinto dentro de
    // la ola) vive en «Ver metodología y fuentes».

    'c19-view-label':    'Vista',
    'c19-view-scatter':  'Dispersión',
    'c19-view-dumbbell': 'Brechas',
    'c19-db-empty':      'Agregá países con el buscador: cada país elegido es una fila.',
    'c19-x-label':       'Eje horizontal',
    'c19-y-label':       'Eje vertical',
    // Forma VERBAL de cada variable, sólo para el subtítulo. El título las nombra
    // en sustantivo («racismo visto en el barrio») y eso no dice qué se preguntó;
    // acá el sujeto es la persona encuestada: «porcentaje que DICE VER conductas
    // racistas en su barrio». Mismo desdoblamiento que titulo_es en el chart 18 y
    // que qcatf-* en el 12.
    'c19-frase-otra_raza':             'rechaza tener vecinos de otra raza',
    'c19-frase-inmigrantes':           'rechaza tener vecinos inmigrantes o trabajadores extranjeros',
    'c19-frase-homosexuales':          'rechaza tener vecinos homosexuales',
    'c19-frase-otra_religion':         'rechaza tener vecinos de otra religión',
    'c19-frase-otro_idioma':           'rechaza tener vecinos que hablan otro idioma',
    'c19-frase-parejas_no_casadas':    'rechaza tener de vecinos a parejas que conviven sin casarse',
    'c19-frase-sida':                  'rechaza tener vecinos con sida',
    'c19-frase-bebedores':             'rechaza tener vecinos bebedores empedernidos',
    'c19-frase-drogadictos':           'rechaza tener vecinos drogadictos',
    'c19-frase-antecedentes':          'rechaza tener vecinos con antecedentes penales',
    'c19-frase-inestables':            'rechaza tener vecinos emocionalmente inestables',
    'c19-frase-musulmanes':            'rechaza tener vecinos musulmanes',
    'c19-frase-judios':                'rechaza tener vecinos judíos',
    'c19-frase-gitanos':               'rechaza tener vecinos gitanos',
    'c19-frase-C002':                  'está de acuerdo con dar prioridad laboral a los nativos',
    'c19-frase-C001':                  'está de acuerdo con dar prioridad laboral a los varones',
    'c19-frase-H002_04':               'dice ver conductas racistas en su barrio',
    'c19-frase-H002_01':               'dice ver robos en su barrio',
    'c19-frase-E143':                  'quiere límites estrictos a la inmigración',
    'c19-frase-G052':                  'cree que el inmigrante perjudica al país',
    'c19-frase-A165':                  'desconfía de la gente en general',
    'c19-frase-A035':                  'menciona la tolerancia entre los valores a enseñar a los hijos',
    'c19-frase-G007_36_B':             'desconfía de la gente de otra nacionalidad',
    'c19-frase-G007_34_B':             'desconfía de un desconocido',
    'c19-frase-wrp_piel':              'dice haber sufrido discriminación por su color de piel',

    'c19-grp-bateria':   'No querría de vecinos a…',
    'c19-grp-otras':     'Otras preguntas de la encuesta',
    'c19-grp-wrp':       'Discriminación vivida (otra encuesta)',
    'c19-sources-wrp':   ' «Sufrió discriminación por su color de piel» es la única variable del menú que no sale de la Integrated Values Survey: viene del World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 países) y mide experiencia propia, no opinión sobre terceros. Con ella en algún eje, los dos valores salen de encuestas distintas y de personas distintas.',
    'c19-swap':          'Invertir ejes',
    // En brechas no hay ejes: el botón intercambia cuál de las dos variables va
    // primera —la naranja— y, como las filas se ordenan por la brecha, invierte
    // también el orden de los países.
    'c19-swap-db':       'Intercambiar variables',
    'c19-swap-aria-db':  'Intercambiar la primera y la segunda variable',
    'c19-refs-label':    'Referencias',
    'c19-ref-diag':      'Igual valor',
    'c19-ref-fit':       'Recta de ajuste',
    'c19-swap-aria':     'Intercambiar el eje horizontal y el vertical',
    'c19-wave-label':    'Ola de la encuesta',
    'c19-play':          'Reproducir',
    'c19-pause':         'Pausar',

    'c19-search-ph':     'Agregar país…',
    'c19-pick-hint':     'Los países elegidos se etiquetan en el gráfico.',
    'c19-pick-hint-db':  'Cada país elegido es una fila del gráfico.',

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

    // Notas cortas, con el intervalo de la OLA que se muestra y no el rango del
    // dataset: el gráfico es una foto, no una serie. Las advertencias de los dos
    // indicadores invertidos («desconfía de la gente», «enseña tolerancia») no se
    // repiten acá: ya las trae la definición de cada eje, arriba del gráfico.
    'c19-sources':       'Datos: Integrated Values Survey (WVS/EVS), ola {PERIODO}. Porcentajes ponderados sobre respuestas válidas.',
    'c19-sources-db':    'Datos: Integrated Values Survey (WVS/EVS), ola {PERIODO}. Cada barra une los dos valores de un mismo país, en la misma escala; las filas se ordenan por la distancia entre ambos. Porcentajes ponderados sobre respuestas válidas.',
    'c19-sources-tpl-ext': 'Datos: Integrated Values Survey (WVS/EVS), ola {PERIODO}, y World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup). Porcentajes ponderados sobre respuestas válidas.',
    'c19-sources-tpl':   'Datos: Integrated Values Survey (WVS/EVS), ola {PERIODO}. Porcentajes ponderados sobre respuestas válidas.',
    'c19-sources-png-db': 'Datos: Integrated Values Survey (WVS/EVS), ola {PERIODO}. Cada barra une los dos valores de un mismo país, ordenados por la distancia entre ambos.',
  });

  Object.assign(I18N.en, {
    'c19-lead':          'Pick two survey questions and see how countries line up. Above the equal-value line, the vertical axis weighs more.',

    'c19-title-editorial': 'We say one thing and see another',
    'c19-title-neutral': 'Two survey questions',
    'c19-db-axis':       '% of respondents in each country',
    'c19-title-tpl':     '{X} vs. {Y}',
    'c19-title-db-tpl':  '{X} and {Y}',
    'c19-subtitle-tpl':  'Share who {X} vs. share who {Y}. {PERIODO} wave.',
    'c19-x-label-db':    'First variable',
    'c19-y-label-db':    'Second variable',
    'c19-subtitle':      'Share of respondents giving each answer.',

    'c19-view-label':    'View',
    'c19-view-scatter':  'Scatter',
    'c19-view-dumbbell': 'Gaps',
    'c19-db-empty':      'Add countries with the search box: each selected country is a row.',
    'c19-x-label':       'Horizontal axis',
    'c19-y-label':       'Vertical axis',
    // Verb form of each variable, for the subtitle only (see the Spanish block).
    'c19-frase-otra_raza':             'would not want neighbours of another race',
    'c19-frase-inmigrantes':           'would not want immigrant or foreign-worker neighbours',
    'c19-frase-homosexuales':          'would not want homosexual neighbours',
    'c19-frase-otra_religion':         'would not want neighbours of another religion',
    'c19-frase-otro_idioma':           'would not want neighbours who speak another language',
    'c19-frase-parejas_no_casadas':    'would not want unmarried couples as neighbours',
    'c19-frase-sida':                  'would not want neighbours with AIDS',
    'c19-frase-bebedores':             'would not want heavy-drinking neighbours',
    'c19-frase-drogadictos':           'would not want drug-addict neighbours',
    'c19-frase-antecedentes':          'would not want neighbours with a criminal record',
    'c19-frase-inestables':            'would not want emotionally unstable neighbours',
    'c19-frase-musulmanes':            'would not want Muslim neighbours',
    'c19-frase-judios':                'would not want Jewish neighbours',
    'c19-frase-gitanos':               'would not want Gypsy neighbours',
    'c19-frase-C002':                  'agree the native-born should get job priority',
    'c19-frase-C001':                  'agree men should get job priority',
    'c19-frase-H002_04':               'say they see racist behaviour in their neighbourhood',
    'c19-frase-H002_01':               'say they see robberies in their neighbourhood',
    'c19-frase-E143':                  'want strict limits on immigration',
    'c19-frase-G052':                  'think immigrants harm the country',
    'c19-frase-A165':                  'distrust people in general',
    'c19-frase-A035':                  'mention tolerance among the values to teach children',
    'c19-frase-G007_36_B':             'distrust people of another nationality',
    'c19-frase-G007_34_B':             'distrust a stranger',
    'c19-frase-wrp_piel':              'say they have experienced discrimination over their skin colour',

    'c19-grp-bateria':   'Would not want as neighbours…',
    'c19-grp-otras':     'Other survey questions',
    'c19-grp-wrp':       'Experienced discrimination (another survey)',
    'c19-sources-wrp':   ' “Has experienced discrimination over skin colour” is the only variable in the menu that does not come from the Integrated Values Survey: it comes from the World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 countries) and measures first-person experience, not an opinion about others. With it on an axis, the two values come from different surveys and different people.',
    'c19-swap':          'Swap axes',
    'c19-swap-db':       'Swap variables',
    'c19-swap-aria-db':  'Swap the first and the second variable',
    'c19-refs-label':    'Reference lines',
    'c19-ref-diag':      'Equal value',
    'c19-ref-fit':       'Fit line',
    'c19-swap-aria':     'Swap the horizontal and the vertical axis',
    'c19-wave-label':    'Survey wave',
    'c19-play':          'Play',
    'c19-pause':         'Pause',

    'c19-search-ph':     'Add a country…',
    'c19-pick-hint':     'Selected countries are labelled on the chart.',
    'c19-pick-hint-db':  'Each selected country is a row of the chart.',

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

    'c19-sources':       'Data: Integrated Values Survey (WVS/EVS), {PERIODO} wave. Weighted shares over valid answers.',
    'c19-sources-db':    'Data: Integrated Values Survey (WVS/EVS), {PERIODO} wave. Each bar joins the two values for the same country, on the same scale; rows are ordered by the distance between them. Weighted shares over valid answers.',
    'c19-sources-tpl-ext': 'Data: Integrated Values Survey (WVS/EVS), {PERIODO} wave, and the World Risk Poll 2023 (Lloyd\u2019s Register Foundation / Gallup). Weighted shares over valid answers.',
    'c19-sources-tpl':   'Data: Integrated Values Survey (WVS/EVS), {PERIODO} wave. Weighted shares over valid answers.',
    'c19-sources-png-db': 'Data: Integrated Values Survey (WVS/EVS), {PERIODO} wave. Each bar joins the two values for the same country, ordered by the distance between them.',
  });
})();
