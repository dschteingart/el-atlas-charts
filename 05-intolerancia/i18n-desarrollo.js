// =============================================================
//  Strings del chart 18 — "Intolerancia y desarrollo" (chart-desarrollo.html)
// =============================================================
// Se carga DESPUÉS de i18n-issue.js (que define I18N) y ANTES de desarrollo.js.
// NO toca i18n-issue.js: ese archivo lo comparten todos los charts del número.
//
// Los nombres de las 24 variables del eje Y NO están acá: salen de CR_VARS[].es
// y CR_VARS[].en en data-cruces.js, que es la única fuente de verdad del menú
// (así el rótulo del eje, la opción del select y la definición de "Fuentes"
// nunca se desincronizan).
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c18-eyebrow': 'Intolerancia y desarrollo',
    // Una sola línea: el lead de tres líneas costaba 59 px de alto y el gráfico
    // no entraba en pantalla sin scrollear.
    'c18-lead':    'Los países ricos declaran menos rechazo. La pregunta es otra: puesto en la fila de su ingreso, ¿dónde queda cada país?',

    // Título: insight en el estado default (rechazo racial, ola 2017-2022,
    // recta, eje log); neutral apenas se cambia algo.
    'c18-title':         'Aun ajustando por ingreso, América Latina declara menos rechazo racial que el resto del mundo',
    'c18-title-neutral': 'Intolerancia declarada y PIB per cápita, país por país',

    // Subtítulo estático (el que pinta applyI18n antes del primer render y el
    // que restaura el editor). El JS lo reemplaza por la versión con la
    // definición exacta del indicador y la ola activa.
    'c18-subtitle': 'Cada punto es un país: intolerancia declarada en el eje vertical, PIB per cápita en el horizontal.',
    // {DEF} = definición del indicador; {PERIODO} = etiqueta de la ola.
    // Acortado a una línea: la letra chica (cada país con el PIB de su propio
    // año de campo, la recta como asociación y no causa) vive en «Ver
    // metodología y fuentes» (c18-sources).
    'c18-subtitle-tpl': 'Cada punto es un país. Eje vertical: {DEF} Eje horizontal: PIB per cápita, ola {PERIODO}.',
    // Cuando hay ajuste estimado, el subtítulo cuenta EL HALLAZGO en palabras:
    // dos plantillas según el signo del residuo de América Latina, con el
    // número REDONDEADO A ENTERO (criterio del N°2: el lector no precisa 9,6 pp
    // vs 10 pp, y el residuo se mueve de ola en ola). {N} = pp, sin signo.
    'c18-subtitle-tpl-more': 'América Latina queda {N} pp por encima de lo que predice su ingreso. Eje vertical: {DEF} Eje horizontal: PIB per cápita, ola {PERIODO}.',
    'c18-subtitle-tpl-less': 'América Latina queda {N} pp por debajo de lo que predice su ingreso. Eje vertical: {DEF} Eje horizontal: PIB per cápita, ola {PERIODO}.',

    'c18-var-label':      'Indicador (eje vertical)',
    'c18-grp-vecinos':    'Batería de vecinos',
    'c18-grp-otras':      'Otras preguntas',
    'c18-grp-wrp':        'Discriminación vivida (otra encuesta)',
    'c18-sources-png-ext': 'Datos: World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup) para el eje vertical y Maddison Project Database 2023 para el PIB per cápita. Un punto por país. El World Risk Poll pregunta por experiencia PROPIA de discriminación por el color de piel, alguna vez en la vida: no es una opinión sobre terceros, y sale de otra encuesta que el resto del número. Sus datos son de 2023 y se cruzan con el PIB de 2022, el último de Maddison. El ajuste se estima sobre el logaritmo del PIB.',
    'c18-sources-wrp':    ' <strong>Ojo</strong>: «sufrió discriminación por su color de piel» es la única variable del menú que no sale de la Integrated Values Survey. Viene del World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 países, CC BY 4.0) y mide experiencia propia y de por vida, no una opinión sobre terceros. Sus puntos son de 2023 y se cruzan con el PIB per cápita de 2022, el último año de Maddison.',
    'c18-scale-label':    'Escala del PIB',
    'c18-scale-log':      'Logarítmica',
    'c18-scale-linear':   'Lineal',
    'c18-model-label':    'Ajuste',
    'c18-model-linear':   'Recta',
    'c18-model-quad':     'Curva',
    'c18-wave-label':     'Ola de la encuesta',
    'c18-play':           'Recorrer las olas',
    'c18-search-ph':      'Agregar país…',
    'c18-select-hint':    'Los países elegidos son los que quedan etiquetados en el gráfico.',

    'c18-axis-x-log':     'PIB per cápita (dólares internacionales de 2011, PPA) — escala logarítmica',
    'c18-axis-x-linear':  'PIB per cápita (dólares internacionales de 2011, PPA)',
    'c18-axis-y-suffix':  ' (%)',

    // Banner + tira de estadísticos adentro del SVG. Mismo set que el N°2
    // (países, R² y el residuo de la región enfocada). La PENDIENTE se sacó:
    // «pp por cada ×10 de PIB» es jerga y el N°2 nunca la mostró.
    'c18-banner-n':       'Países',
    'c18-banner-r2':      'R²',
    'c18-banner-resid':   'Residuo',
    'c18-banner-resid-note': 'respecto de lo previsto',
    'c18-banner-none':    'sin países de esta región en la ola elegida',
    'c18-banner-hint':    'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla del ajuste.',
    'c18-show-all':       'Ver todas las regiones',
    'c18-strip-resid-tpl': '{REG}: {V} respecto de lo previsto',
    'c18-fewfit':         'Muy pocos países para estimar un ajuste.',
    'c18-nodata':         'No hay datos suficientes para esta combinación de indicador y ola.',

    // El rótulo de la primera fila del tooltip es el nombre del indicador
    // (CR_VARS[].es/en), así que no hay clave 'valor' genérica.
    'c18-tt-year':        'Año de la encuesta',
    'c18-tt-n':           'Casos',
    'c18-tt-gdp':         'PIB per cápita',
    'c18-tt-expected':    'Predicho por su ingreso',
    'c18-tt-resid':       'Residuo',
    'c18-tt-resid-above': 'por encima de la recta',
    'c18-tt-resid-below': 'por debajo de la recta',

    'c18-sources': 'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022) para el eje vertical y Maddison Project Database 2023 —vía Our World in Data— para el PIB per cápita en dólares internacionales de 2011 (PPA). Cada punto es un país en una ola de la encuesta; el porcentaje es ponderado (S017) y se descartan las celdas con menos de 8 países, que no son una regresión. <strong>Cada país se cruza con el PIB de su propio año de trabajo de campo, y dentro de una misma ola los países salieron a campo en años distintos</strong>: en la ola 2017-2022, Argentina midió en 2017 y Uruguay en 2022, así que sus PIB tampoco son del mismo año. El PIB se toma del año de la encuesta o, si falta, del año más cercano dentro de ±3 años (el tooltip muestra siempre el año real). Los países sin dato de Maddison —Andorra, Macao, Maldivas, Irlanda del Norte, Kosovo y el norte de Chipre— no aparecen: no se interpola ni se arrastra ningún valor. El ajuste se estima siempre sobre el logaritmo del PIB per cápita (el toggle de escala cambia el eje, no el modelo) y el residuo de una región es el promedio, en puntos porcentuales, de la diferencia entre lo que declara cada país y lo que la recta predice para su ingreso. <strong>Es una correlación, no una relación causal</strong>: ni el ingreso explica la tolerancia ni la tolerancia el ingreso, y buena parte de lo que separa a los países queda fuera del modelo (el R² se muestra arriba del gráfico). Dos advertencias sobre el menú: «Desconfía de la gente en general» es el complemento exacto del clásico «se puede confiar en la mayoría» (el ítem tiene solo esas dos opciones), y en «Enseña tolerancia a sus hijos» más es <em>mejor</em>, al revés que en el resto, así que ahí el residuo se lee al revés. «Personas con antecedentes penales» y «personas emocionalmente inestables» dejaron de preguntarse después de la ola 2005-2010; musulmanes, judíos y gitanos solo se preguntan en Europa, así que en la última ola no hay ningún país de América Latina. Mide actitudes <em>declaradas</em> ante un encuestador.',
    'c18-sources-png': 'Datos: Integrated Values Survey (EVS + WVS) y Maddison Project Database 2023. Un punto por país; cada país se cruza con el PIB de su propio año de encuesta y, dentro de una misma ola, los países salieron a campo en años distintos. El ajuste se estima sobre el logaritmo del PIB per cápita. Es una correlación, no una relación causal.',
  });

  Object.assign(I18N.en, {
    'c18-eyebrow': 'Intolerance and development',
    'c18-lead':    'Rich countries report less rejection. The real question is another one: lined up against its own income, where does each country land?',

    'c18-title':         'Even adjusting for income, Latin America reports less racial rejection than the rest of the world',
    'c18-title-neutral': 'Declared intolerance and GDP per capita, country by country',

    'c18-subtitle': 'Each dot is a country: declared intolerance on the vertical axis, GDP per capita on the horizontal one.',
    'c18-subtitle-tpl': 'Each dot is a country. Vertical axis: {DEF} Horizontal axis: GDP per capita, {PERIODO} wave.',
    'c18-subtitle-tpl-more': 'Latin America sits {N} pp above what its income predicts. Vertical axis: {DEF} Horizontal axis: GDP per capita, {PERIODO} wave.',
    'c18-subtitle-tpl-less': 'Latin America sits {N} pp below what its income predicts. Vertical axis: {DEF} Horizontal axis: GDP per capita, {PERIODO} wave.',

    'c18-var-label':      'Indicator (vertical axis)',
    'c18-grp-vecinos':    'Neighbours battery',
    'c18-grp-otras':      'Other questions',
    'c18-grp-wrp':        'Experienced discrimination (another survey)',
    'c18-sources-png-ext': 'Data: World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup) for the vertical axis and the Maddison Project Database 2023 for GDP per capita. One dot per country. The World Risk Poll asks about FIRST-PERSON, lifetime experience of discrimination over skin colour: it is not an opinion about others, and it comes from a different survey than the rest of the issue. Its data are from 2023 and are matched with 2022 GDP, the last year in Maddison. The fit is estimated on log GDP.',
    'c18-sources-wrp':    ' <strong>Note</strong>: “has experienced discrimination over skin colour” is the only variable in the menu that does not come from the Integrated Values Survey. It comes from the World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 countries, CC BY 4.0) and measures first-person, lifetime experience, not an opinion about others. Its dots are from 2023 and are matched with 2022 GDP per capita, the last year in Maddison.',
    'c18-scale-label':    'GDP scale',
    'c18-scale-log':      'Logarithmic',
    'c18-scale-linear':   'Linear',
    'c18-model-label':    'Fit',
    'c18-model-linear':   'Line',
    'c18-model-quad':     'Curve',
    'c18-wave-label':     'Survey wave',
    'c18-play':           'Play the waves',
    'c18-search-ph':      'Add country…',
    'c18-select-hint':    'The chosen countries are the ones labelled on the chart.',

    'c18-axis-x-log':     'GDP per capita (2011 international dollars, PPP) — log scale',
    'c18-axis-x-linear':  'GDP per capita (2011 international dollars, PPP)',
    'c18-axis-y-suffix':  ' (%)',

    'c18-banner-n':       'Countries',
    'c18-banner-r2':      'R²',
    'c18-banner-resid':   'Residual',
    'c18-banner-resid-note': 'vs. what its income predicts',
    'c18-banner-none':    'no countries from this region in the selected wave',
    'c18-banner-hint':    'Hover a region in the legend to reveal its country names; click (or tap) to switch it off and drop it from the fit.',
    'c18-show-all':       'Show all regions',
    'c18-strip-resid-tpl': '{REG}: {V} vs. what its income predicts',
    'c18-fewfit':         'Too few countries to estimate a fit.',
    'c18-nodata':         'Not enough data for this combination of indicator and wave.',

    'c18-tt-year':        'Survey year',
    'c18-tt-n':           'Cases',
    'c18-tt-gdp':         'GDP per capita',
    'c18-tt-expected':    'Predicted by its income',
    'c18-tt-resid':       'Residual',
    'c18-tt-resid-above': 'above the line',
    'c18-tt-resid-below': 'below the line',

    'c18-sources': 'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022) for the vertical axis and the Maddison Project Database 2023 —via Our World in Data— for GDP per capita in 2011 international dollars (PPP). Each dot is a country in one survey wave; the share is weighted (S017) and cells with fewer than 8 countries are dropped, since they are not a regression. <strong>Each country is matched with the GDP of its own fieldwork year, and within a single wave countries were surveyed in different years</strong>: in the 2017-2022 wave Argentina was surveyed in 2017 and Uruguay in 2022, so their GDP figures are not from the same year either. GDP is taken from the survey year or, failing that, from the nearest year within ±3 years (the tooltip always shows the actual year). Countries with no Maddison reading —Andorra, Macao, the Maldives, Northern Ireland, Kosovo and Northern Cyprus— are absent: nothing is interpolated and no value is carried forward. The fit is always estimated on the logarithm of GDP per capita (the scale toggle changes the axis, not the model), and a region’s residual is the average, in percentage points, of the gap between what each country reports and what the line predicts for its income. <strong>This is a correlation, not a causal relationship</strong>: income does not explain tolerance nor tolerance income, and much of what separates these countries sits outside the model (the R² is shown above the chart). Two warnings about the menu: “distrusts people in general” is the exact complement of the classic “most people can be trusted” (the item has only those two options), and in “teaches tolerance to their children” more is <em>better</em>, unlike the rest, so there the residual reads the other way round. “People with a criminal record” and “emotionally unstable people” stopped being asked after the 2005-2010 wave; Muslims, Jews and Gypsies are only asked in Europe, so in the latest wave there is no Latin American country at all. This measures attitudes <em>declared</em> to an interviewer.',
    'c18-sources-png': 'Data: Integrated Values Survey (EVS + WVS) and Maddison Project Database 2023. One dot per country; each country is matched with the GDP of its own survey year and, within a wave, countries were surveyed in different years. The fit is estimated on the logarithm of GDP per capita. This is a correlation, not a causal relationship.',
  });
})();
