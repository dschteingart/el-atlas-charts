// Strings del N°4 · CHART 26 «El perfil de cada región» (chart-perfil.html).
// Se carga DESPUÉS de i18n-issue.js (que define I18N) y ANTES de perfil-tabla.js.
//
// Los nombres de los cinco indicadores NO están acá: salen de PF_META.cols en
// data-perfil.js, que es donde se decide qué mide cada columna.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c26-eyebrow': 'El perfil de cada región',

    // El título dice qué hace la tabla, no qué encontró: el hallazgo cambia
    // según la fila que el lector mire, y son nueve.
    'c26-title': 'No hay un país más racista del mundo: hay cinco respuestas distintas',
    'c26-subtitle-reg':    'Cinco indicadores del número, uno por columna. El color marca la posición de cada región dentro de su columna, y el número, el valor.',
    'c26-subtitle-paises': 'Cinco indicadores del número, uno por columna. El color marca la posición de cada país entre los elegidos, y el número, el valor.',

    'c26-view-label':   'Comparar',
    'c26-view-reg':     'Regiones',
    'c26-view-paises':  'Países',
    'c26-search-ph':    'Agregar país…',
    'c26-pick-hint':    'Cada país elegido es una fila de la tabla.',
    'c26-sort-hint':    'Tocá el nombre de un indicador para ordenar por esa columna.',

    'c26-legend':  'Posición dentro de la columna',
    'c26-niv-bajo':       'bajo',
    'c26-niv-mediobajo':  'medio-bajo',
    'c26-niv-medio':      'medio',
    'c26-niv-medioalto':  'medio-alto',
    'c26-niv-alto':       'alto',
    'c26-nodata':  'sin dato',

    'c26-tt-valor': 'Valor',
    'c26-tt-nivel': 'Posición',
    'c26-tt-n':     'Países con dato',
    'c26-tt-de':    'de',
    'c26-tt-anio':  'Año del dato',

    // La nota tiene que decir las tres cosas que el color no puede: que cada
    // columna viene de otra encuesta, que "alto" es magnitud y no juicio, y que
    // la cobertura de la IVS en África y Medio Oriente es fina.
    'c26-sources-reg': 'Datos: V-Dem v16 (exclusión por grupo social, 2023); World Values Survey / Integrated Values Survey (racismo visto en el barrio y rechazo al vecino de otra raza, último dato de cada país entre 2010 y 2023); World Risk Poll 2023 (discriminación vivida por color de piel); y Gini ajustado del N°2 de El Atlas. Cada valor es el promedio simple de los países de la región con dato, sin ponderar por población. <strong>Las cinco columnas no cubren los mismos países</strong>: V-Dem y el Gini llegan a casi todo el mundo, pero la encuesta de valores tiene siete países en África Subsahariana —de 49— y trece en Medio Oriente. Un asterisco marca las celdas que se apoyan en menos de cinco países. «Alto» describe el nivel, no un juicio: en «ve racismo en su barrio», un valor alto puede significar más racismo o más conciencia del problema.',
    'c26-sources-paises': 'Datos: V-Dem v16 (exclusión por grupo social, 2023); World Values Survey / Integrated Values Survey (racismo visto en el barrio y rechazo al vecino de otra raza, último dato de cada país entre 2010 y 2023); World Risk Poll 2023 (discriminación vivida por color de piel); y Gini ajustado del N°2 de El Atlas. El color marca la posición del país <em>entre los que están en la tabla</em>, así que cambia al agregar o sacar países. «Alto» describe el nivel, no un juicio: en «ve racismo en su barrio», un valor alto puede significar más racismo o más conciencia del problema.',
    'c26-sources-png-reg': 'Datos: V-Dem v16 (2023), World Values Survey / IVS (último dato por país, 2010-2023), World Risk Poll 2023 y el Gini ajustado del N°2 de El Atlas. Promedio simple de los países de cada región con dato; el color marca la posición dentro de cada columna. Las cinco columnas no cubren los mismos países.',
    'c26-sources-png-paises': 'Datos: V-Dem v16 (2023), World Values Survey / IVS (último dato por país, 2010-2023), World Risk Poll 2023 y el Gini ajustado del N°2 de El Atlas. El color marca la posición de cada país entre los que están en la tabla.',
  });

  Object.assign(I18N.en, {
    'c26-eyebrow': 'The profile of each region',
    'c26-title': 'There is no single most racist country: there are five different answers',
    'c26-subtitle-reg':    'Five indicators from this issue, one per column. Colour marks each region’s position within its column; the number is the value.',
    'c26-subtitle-paises': 'Five indicators from this issue, one per column. Colour marks each country’s position among those selected; the number is the value.',

    'c26-view-label':   'Compare',
    'c26-view-reg':     'Regions',
    'c26-view-paises':  'Countries',
    'c26-search-ph':    'Add country…',
    'c26-pick-hint':    'Each selected country is a row of the table.',
    'c26-sort-hint':    'Tap an indicator name to sort by that column.',

    'c26-legend':  'Position within the column',
    'c26-niv-bajo':       'low',
    'c26-niv-mediobajo':  'mid-low',
    'c26-niv-medio':      'mid',
    'c26-niv-medioalto':  'mid-high',
    'c26-niv-alto':       'high',
    'c26-nodata':  'no data',

    'c26-tt-valor': 'Value',
    'c26-tt-nivel': 'Position',
    'c26-tt-n':     'Countries with data',
    'c26-tt-de':    'of',
    'c26-tt-anio':  'Year of the reading',

    'c26-sources-reg': 'Data: V-Dem v16 (exclusion by social group, 2023); World Values Survey / Integrated Values Survey (racism seen in the neighbourhood and rejection of a neighbour of another race, latest reading per country between 2010 and 2023); World Risk Poll 2023 (experienced discrimination over skin colour); and the adjusted Gini from issue N°2 of El Atlas. Each value is the simple average of the countries in the region with data, not weighted by population. <strong>The five columns do not cover the same countries</strong>: V-Dem and the Gini reach almost the whole world, but the values survey has seven countries in Sub-Saharan Africa —out of 49— and thirteen in the Middle East. An asterisk marks cells resting on fewer than five countries. “High” describes the level, not a judgement: in “sees racism in their area”, a high value may mean more racism or more awareness of it.',
    'c26-sources-paises': 'Data: V-Dem v16 (exclusion by social group, 2023); World Values Survey / Integrated Values Survey (racism seen in the neighbourhood and rejection of a neighbour of another race, latest reading per country between 2010 and 2023); World Risk Poll 2023 (experienced discrimination over skin colour); and the adjusted Gini from issue N°2 of El Atlas. Colour marks each country’s position <em>among those in the table</em>, so it changes when countries are added or removed. “High” describes the level, not a judgement: in “sees racism in their area”, a high value may mean more racism or more awareness of it.',
    'c26-sources-png-reg': 'Data: V-Dem v16 (2023), World Values Survey / IVS (latest reading per country, 2010-2023), World Risk Poll 2023 and the adjusted Gini from issue N°2 of El Atlas. Simple average of the countries in each region with data; colour marks the position within each column. The five columns do not cover the same countries.',
    'c26-sources-png-paises': 'Data: V-Dem v16 (2023), World Values Survey / IVS (latest reading per country, 2010-2023), World Risk Poll 2023 and the adjusted Gini from issue N°2 of El Atlas. Colour marks each country’s position among those in the table.',
  });
})();
