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
    'c20-eyebrow': 'Exclusión social',
    // Una sola línea: el lead de tres líneas costaba 59 px de alto y el gráfico
    // no entraba en pantalla sin scrollear.
    'c20-lead':    'Cuánto se le niega a la gente el acceso a servicios o a la participación por pertenecer a un grupo social, según V-Dem, frente al nivel de ingreso de cada país.',

    // Título: insight en el estado default (rechazo racial, ola 2017-2022,
    // recta, eje log); neutral apenas se cambia algo.
    'c20-title':         'Los países más ricos excluyen menos a sus grupos sociales, pero la relación es floja',
    'c20-title-neutral': 'Exclusión social y PIB per cápita, país por país',

    // Subtítulo estático (el que pinta applyI18n antes del primer render y el
    // que restaura el editor). El JS lo reemplaza por la versión con la
    // definición exacta del indicador y la ola activa.
    'c20-subtitle': 'Cada punto es un país: exclusión social en el eje vertical, PIB per cápita en el horizontal.',
    // {DEF} = definición del indicador; {PERIODO} = etiqueta de la ola.
    // Acortado a una línea: la letra chica (cada país con el PIB de su propio
    // año de campo, la recta como asociación y no causa) vive en «Ver
    // metodología y fuentes» (c20-sources).
    'c20-subtitle-tpl': 'Cada punto es un país. Eje vertical: {DEF} Eje horizontal: PIB per cápita. Año {PERIODO}.',
    // Cuando hay ajuste estimado, el subtítulo cuenta EL HALLAZGO en palabras:
    // dos plantillas según el signo del residuo de América Latina, con el
    // número REDONDEADO A ENTERO (criterio del N°2: el lector no precisa 9,6 pp
    // vs 10 pp, y el residuo se mueve de ola en ola). {N} = pp, sin signo.
    'c20-subtitle-tpl-more': 'América Latina queda {N} puntos por encima de lo que predice su ingreso. Eje vertical: {DEF} Eje horizontal: PIB per cápita, año {PERIODO}.',
    'c20-subtitle-tpl-less': 'América Latina queda {N} puntos por debajo de lo que predice su ingreso. Eje vertical: {DEF} Eje horizontal: PIB per cápita, año {PERIODO}.',

    'c20-var-label':      'Indicador (eje vertical)',
    'c20-grp-vecinos':    'Batería de vecinos',
    'c20-grp-otras':      'Otras preguntas',
    'c20-scale-label':    'Escala del PIB',
    'c20-scale-log':      'Logarítmica',
    'c20-scale-linear':   'Lineal',
    'c20-model-label':    'Ajuste',
    'c20-model-linear':   'Recta',
    'c20-model-quad':     'Curva',
    'c20-wave-label':     'Año',
    'c20-play':           'Recorrer los años',
    'c20-search-ph':      'Agregar país…',
    'c20-select-hint':    'Los países elegidos son los que quedan etiquetados en el gráfico.',

    'c20-axis-x-log':     'PIB per cápita (dólares internacionales de 2011, PPA) — escala logarítmica',
    'c20-axis-x-linear':  'PIB per cápita (dólares internacionales de 2011, PPA)',
    'c20-axis-y-suffix':  '',

    // Banner + tira de estadísticos adentro del SVG. Mismo set que el N°2
    // (países, R² y el residuo de la región enfocada). La PENDIENTE se sacó:
    // «pp por cada ×10 de PIB» es jerga y el N°2 nunca la mostró.
    'c20-banner-n':       'Países',
    'c20-banner-r2':      'R²',
    'c20-banner-resid':   'Residuo',
    'c20-banner-resid-note': 'respecto de lo previsto',
    'c20-banner-none':    'sin países de esta región en el año elegido',
    'c20-banner-hint':    'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla del ajuste.',
    'c20-show-all':       'Ver todas las regiones',
    'c20-strip-resid-tpl': '{REG}: {V} respecto de lo previsto',
    'c20-fewfit':         'Muy pocos países para estimar un ajuste.',
    'c20-nodata':         'No hay datos suficientes para esta combinación de indicador y año.',

    // El rótulo de la primera fila del tooltip es el nombre del indicador
    // (CR_VARS[].es/en), así que no hay clave 'valor' genérica.
    'c20-tt-year':        'Año',
    'c20-tt-n':           'Casos',
    'c20-tt-gdp':         'PIB per cápita',
    'c20-tt-expected':    'Predicho por su ingreso',
    'c20-tt-resid':       'Residuo',
    'c20-tt-resid-above': 'por encima de la recta',
    'c20-tt-resid-below': 'por debajo de la recta',

    'c20-sources': 'Datos: <strong>V-Dem (Varieties of Democracy) v16</strong>, Universidad de Gotemburgo, para el eje vertical; PIB per cápita del <strong>Maddison Project Database 2023</strong> empalmado con el Banco Mundial para el horizontal. <strong>Las escalas de las seis variables no son iguales</strong>: el índice de exclusión por grupo social (v2xpe_exlsocgr) va de 0 (sin exclusión) a 1 (exclusión total), mientras que sus cinco componentes son estimaciones del modelo de medición de V-Dem en escala de intervalo centrada en 0 —aproximadamente el promedio histórico mundial— y apuntan al revés: ahí <em>más es mejor</em> (más igualitario). Es decir que el residuo se lee al revés según qué variable esté elegida. El índice y los tres componentes de acceso cubren 1900-2023; poder político y libertades civiles llegan más atrás. <strong>El PIB está empalmado</strong>: hasta 2022 es Maddison, en dólares internacionales de 2011 (PPA), y de 2023 en adelante se le aplica la tasa de variación del Banco Mundial. No se concatenan las dos series porque están en años base distintos (2011 y 2021) y pegarlas habría inventado un salto de nivel. Cada país se cruza con el PIB de ese mismo año; si falta, el país no se dibuja: no se interpola nada. Quedan afuera las entidades históricas que V-Dem cubre y hoy no existen como país, y las islas del Pacífico, que la taxonomía regional del Atlas no sabe ubicar. El ajuste se estima siempre sobre el logaritmo del PIB per cápita (el toggle de escala cambia el eje, no el modelo), y el residuo de una región es el promedio de la diferencia entre su valor observado y el que la recta predice para su ingreso. <strong>Es una correlación, no una relación causal</strong>: buena parte de lo que separa a los países queda fuera del modelo, y el R² está arriba del gráfico para que se vea cuánta. V-Dem son estimaciones de expertos, con su propia incertidumbre: no son un censo.',
    'c20-sources-png': 'Datos: V-Dem v16 (Universidad de Gotemburgo) y PIB per cápita de Maddison 2023 empalmado con el Banco Mundial. El índice va de 0 a 1 (más = más exclusión); sus cinco componentes están centrados en 0 y apuntan al revés (más = más igualitario). El ajuste se estima sobre el logaritmo del PIB. Es una correlación, no una relación causal.',
  });

  Object.assign(I18N.en, {
    'c20-eyebrow': 'Social exclusion',
    'c20-lead':    'How far people are denied access to services or participation because of the social group they belong to, according to V-Dem, set against the income level of each country.',

    'c20-title':         'Richer countries exclude their social groups less, but the link is loose',
    'c20-title-neutral': 'Social exclusion and GDP per capita, country by country',

    'c20-subtitle': 'Each dot is a country: social exclusion on the vertical axis, GDP per capita on the horizontal one.',
    'c20-subtitle-tpl': 'Each dot is a country. Vertical axis: {DEF} Horizontal axis: GDP per capita. Year {PERIODO}.',
    'c20-subtitle-tpl-more': 'Latin America sits {N} points above what its income predicts. Vertical axis: {DEF} Horizontal axis: GDP per capita, year {PERIODO}.',
    'c20-subtitle-tpl-less': 'Latin America sits {N} points below what its income predicts. Vertical axis: {DEF} Horizontal axis: GDP per capita, year {PERIODO}.',

    'c20-var-label':      'Indicator (vertical axis)',
    'c20-grp-vecinos':    'Neighbours battery',
    'c20-grp-otras':      'Other questions',
    'c20-scale-label':    'GDP scale',
    'c20-scale-log':      'Logarithmic',
    'c20-scale-linear':   'Linear',
    'c20-model-label':    'Fit',
    'c20-model-linear':   'Line',
    'c20-model-quad':     'Curve',
    'c20-wave-label':     'Year',
    'c20-play':           'Play the waves',
    'c20-search-ph':      'Add country…',
    'c20-select-hint':    'The chosen countries are the ones labelled on the chart.',

    'c20-axis-x-log':     'GDP per capita (2011 international dollars, PPP) — log scale',
    'c20-axis-x-linear':  'GDP per capita (2011 international dollars, PPP)',
    'c20-axis-y-suffix':  '',

    'c20-banner-n':       'Countries',
    'c20-banner-r2':      'R²',
    'c20-banner-resid':   'Residual',
    'c20-banner-resid-note': 'vs. what its income predicts',
    'c20-banner-none':    'no countries from this region in the selected wave',
    'c20-banner-hint':    'Hover a region in the legend to reveal its country names; click (or tap) to switch it off and drop it from the fit.',
    'c20-show-all':       'Show all regions',
    'c20-strip-resid-tpl': '{REG}: {V} vs. what its income predicts',
    'c20-fewfit':         'Too few countries to estimate a fit.',
    'c20-nodata':         'Not enough data for this combination of indicator and wave.',

    'c20-tt-year':        'Survey year',
    'c20-tt-n':           'Cases',
    'c20-tt-gdp':         'GDP per capita',
    'c20-tt-expected':    'Predicted by its income',
    'c20-tt-resid':       'Residual',
    'c20-tt-resid-above': 'above the line',
    'c20-tt-resid-below': 'below the line',

    'c20-sources': 'Data: <strong>V-Dem (Varieties of Democracy) v16</strong>, University of Gothenburg, for the vertical axis; GDP per capita from the <strong>Maddison Project Database 2023</strong> spliced with the World Bank for the horizontal one. <strong>The six variables are not on the same scale</strong>: the social group exclusion index (v2xpe_exlsocgr) runs from 0 (no exclusion) to 1 (total exclusion), while its five components are V-Dem measurement-model estimates on an interval scale centred on 0 —roughly the historical world average— and point the other way: there, <em>higher is better</em> (more equal). So the residual reads in the opposite direction depending on which variable is selected. The index and the three access components cover 1900-2023; political power and civil liberties go further back. <strong>GDP is spliced</strong>: Maddison through 2022, in 2011 international dollars (PPP), and from 2023 on the World Bank growth rate is applied to it. The two series are not concatenated because they use different base years (2011 and 2021) and joining them would have invented a jump in levels. Each country is matched with the GDP of that same year; if it is missing, the country is not drawn — nothing is interpolated. Historical polities that V-Dem covers but no longer exist as countries are excluded, as are the Pacific islands, which the Atlas regional taxonomy cannot place. The fit is always estimated on the logarithm of GDP per capita (the scale toggle changes the axis, not the model), and a region\'s residual is the average gap between its observed value and what the line predicts for its income. <strong>This is a correlation, not a causal relationship</strong>: much of what separates countries falls outside the model, and the R² is shown above the chart so you can see how much. V-Dem figures are expert estimates with their own uncertainty: they are not a census.',
    'c20-sources-png': 'Data: V-Dem v16 (University of Gothenburg) and GDP per capita from Maddison 2023 spliced with the World Bank. The index runs 0 to 1 (higher = more exclusion); its five components are centred on 0 and point the other way (higher = more equal). The fit is estimated on log GDP. This is a correlation, not a causal relationship.',
  });
})();
