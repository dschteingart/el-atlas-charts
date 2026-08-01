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
    'c26-title':              'El perfil del racismo en cada región',
    'c26-subtitle-reg':       'Distintas formas de medir el racismo y la exclusión. Último dato de cada país, 2010-2023.',
    'c26-subtitle-paises':    'Distintas formas de medir el racismo y la exclusión. Último dato de cada país, 2010-2023.',

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
    'c26-sources-reg':        '<strong>Qué mide cada columna.</strong> <em>Rechaza un vecino de otra raza</em>: porcentaje que menciona a «personas de otra raza» entre los grupos que no querría de vecinos. <em>Ve racismo en su barrio</em>: porcentaje que dice que en su barrio hay conductas racistas muy o bastante seguido. <em>Sufrió discriminación por su color de piel</em>: porcentaje que dice haberla sufrido alguna vez. <em>Exclusión institucional</em>: índice de V-Dem, de 0 a 1, sobre cuánto se le niega a la gente el acceso a servicios, empleo público, poder político y libertades civiles por su grupo social. <em>Desigualdad de ingresos</em>: coeficiente de Gini (ajustado por diferencias entre consumo e ingresos). Datos: Integrated Values Survey y World Values Survey (último dato por país, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) y Poverty and Inequality Platform (Banco Mundial). Cada valor es el promedio simple de los países de la región con dato. Las cinco columnas no cubren los mismos países.',
    'c26-sources-paises':     '<strong>Qué mide cada columna.</strong> <em>Rechaza un vecino de otra raza</em>: porcentaje que menciona a «personas de otra raza» entre los grupos que no querría de vecinos. <em>Ve racismo en su barrio</em>: porcentaje que dice que en su barrio hay conductas racistas muy o bastante seguido. <em>Sufrió discriminación por su color de piel</em>: porcentaje que dice haberla sufrido alguna vez. <em>Exclusión institucional</em>: índice de V-Dem, de 0 a 1, sobre cuánto se le niega a la gente el acceso a servicios, empleo público, poder político y libertades civiles por su grupo social. <em>Desigualdad de ingresos</em>: coeficiente de Gini (ajustado por diferencias entre consumo e ingresos). Datos: Integrated Values Survey y World Values Survey (último dato por país, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) y Poverty and Inequality Platform (Banco Mundial). El color marca la posición del país <em>entre los que están en la tabla</em>, así que cambia al agregar o sacar países. Las cinco columnas no cubren los mismos países.',
    'c26-sources-png-reg':    'Qué mide cada columna: % que no querría de vecino a una persona de otra raza · % que dice ver conductas racistas muy o bastante seguido en su barrio · % que dice haber sufrido discriminación por su color de piel alguna vez · índice de V-Dem (0 a 1) sobre cuánto se le niega el acceso a servicios, empleo público, poder político y libertades civiles por el grupo social al que se pertenece · Gini ajustado por diferencias entre consumo e ingresos. Datos: Integrated Values Survey y World Values Survey (último dato por país, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) y PIP-Banco Mundial. Promedio simple de los países de cada región con dato. Las cinco columnas no cubren los mismos países.',
    'c26-sources-png-paises':  'Qué mide cada columna: % que no querría de vecino a una persona de otra raza · % que dice ver conductas racistas muy o bastante seguido en su barrio · % que dice haber sufrido discriminación por su color de piel alguna vez · índice de V-Dem (0 a 1) sobre cuánto se le niega el acceso a servicios, empleo público, poder político y libertades civiles por el grupo social al que se pertenece · Gini ajustado por diferencias entre consumo e ingresos. Datos: Integrated Values Survey y World Values Survey (último dato por país, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) y PIP-Banco Mundial. Las cinco columnas no cubren los mismos países.',
  });

  Object.assign(I18N.en, {
    'c26-eyebrow': 'The profile of each region',
    'c26-title':              'The profile of racism in each region',
    'c26-subtitle-reg':       'Different ways of measuring racism and exclusion. Latest reading per country, 2010-2023.',
    'c26-subtitle-paises':    'Different ways of measuring racism and exclusion. Latest reading per country, 2010-2023.',

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

    'c26-sources-reg':        '<strong>What each column measures.</strong> <em>Would reject a neighbour of another race</em>: share who mention “people of a different race” among the groups they would not want as neighbours. <em>Sees racism in their area</em>: share who say racist behaviour happens very or quite frequently in their neighbourhood. <em>Has faced discrimination over skin colour</em>: share who say they have ever experienced it. <em>Institutional exclusion</em>: V-Dem index, 0 to 1, of how far people are denied access to services, public jobs, political power and civil liberties because of their social group. <em>Income inequality</em>: Gini coefficient (adjusted for differences between consumption and income). Data: Integrated Values Survey and World Values Survey (latest reading per country, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) and the Poverty and Inequality Platform (World Bank). Each value is the simple average of the countries in the region with data. The five columns do not cover the same countries.',
    'c26-sources-paises':     '<strong>What each column measures.</strong> <em>Would reject a neighbour of another race</em>: share who mention “people of a different race” among the groups they would not want as neighbours. <em>Sees racism in their area</em>: share who say racist behaviour happens very or quite frequently in their neighbourhood. <em>Has faced discrimination over skin colour</em>: share who say they have ever experienced it. <em>Institutional exclusion</em>: V-Dem index, 0 to 1, of how far people are denied access to services, public jobs, political power and civil liberties because of their social group. <em>Income inequality</em>: Gini coefficient (adjusted for differences between consumption and income). Data: Integrated Values Survey and World Values Survey (latest reading per country, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) and the Poverty and Inequality Platform (World Bank). Colour marks the country’s position <em>among those in the table</em>, so it changes when countries are added or removed. The five columns do not cover the same countries.',
    'c26-sources-png-reg':    'What each column measures: % who would not want a neighbour of another race · % who say racist behaviour happens very or quite frequently in their area · % who say they have ever faced discrimination over their skin colour · V-Dem index (0 to 1) of how far people are denied access to services, public jobs, political power and civil liberties because of their social group · Gini adjusted for differences between consumption and income. Data: Integrated Values Survey and World Values Survey (latest reading per country, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) and PIP-World Bank. Simple average of the countries in each region with data. The five columns do not cover the same countries.',
    'c26-sources-png-paises':  'What each column measures: % who would not want a neighbour of another race · % who say racist behaviour happens very or quite frequently in their area · % who say they have ever faced discrimination over their skin colour · V-Dem index (0 to 1) of how far people are denied access to services, public jobs, political power and civil liberties because of their social group · Gini adjusted for differences between consumption and income. Data: Integrated Values Survey and World Values Survey (latest reading per country, 2010-2023), World Risk Poll 2023, V-Dem v16 (2023) and PIP-World Bank. The five columns do not cover the same countries.',
  });
})();
