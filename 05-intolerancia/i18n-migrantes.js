// i18n del Chart 9 del N°5 — perfil de hostilidad hacia el inmigrante
// (Latinobarómetro 2020). Se carga DESPUÉS de i18n-issue.js (que define I18N)
// y ANTES de migrantes.js. NO tocar i18n-issue.js: lo editan otros agentes.
// Solo agrega claves c9-* a I18N.es / I18N.en vía Object.assign.

Object.assign(I18N.es, {
  // título: insight (default se muestra la NEUTRAL vía atlasSetHeading)
  'c9-title':          'El argentino no dice que el inmigrante sea un delincuente: dice que no le corresponde el hospital',
  'c9-title-neutral':  'Qué le reprocha cada país al inmigrante',

  'c9-subtitle':          'Cuánto se aparta cada país del perfil regional en su hostilidad hacia el inmigrante, frase por frase. Latinobarómetro 2020.',
  'c9-subtitle-centered': 'Cuánto se aparta {PAIS} del promedio de la región en cada frase sobre el inmigrante, una vez descontado su nivel general de rechazo. Latinobarómetro 2020, en plena pandemia y pico del éxodo venezolano.',
  'c9-subtitle-raw':      'Porcentaje de {PAIS} con una postura hostil hacia el inmigrante en cada frase, contra la mediana de 18 países. Latinobarómetro 2020, en plena pandemia y pico del éxodo venezolano.',

  // controles
  'c9-country-label': 'País',
  'c9-mode-label':    'Ver',
  'c9-mode-centered': 'Perfil centrado',
  'c9-mode-raw':      'Nivel crudo',

  // ejes / leyendas
  'c9-axis-centered': 'Desvío del perfil regional (puntos porcentuales) · a la derecha, más hostil de lo esperado',
  'c9-axis-raw':      '% con una postura hostil hacia el inmigrante',
  'c9-zero-legend':   'perfil regional (0)',
  'c9-median-legend': 'Mediana regional',

  // tooltip
  'c9-tt-profile': 'Desvío del perfil regional',
  'c9-tt-level':   'Postura hostil',
  'c9-tt-median':  'Mediana regional',
  'c9-tt-more':    'Por encima del perfil regional.',
  'c9-tt-less':    'Por debajo del perfil regional.',
  'c9-tt-above':   'Más hostil que la mediana regional.',
  'c9-tt-below':   'Menos hostil que la mediana regional.',

  // etiquetas de los 14 ítems (polo hostil; mayor % = más hostil)
  'c9-item-C_004_201': 'No recibir migrantes de fuera de la región',
  'c9-item-C_004_202': 'No recibir migrantes latinoamericanos',
  'c9-item-C_004_203': 'No recibir migrantes de Haití',
  'c9-item-C_004_204': 'No recibir migrantes de Venezuela',
  'c9-item-C_004_205': 'La inmigración perjudica al país',
  'c9-item-C_004_206': 'No son buenos para la economía',
  'c9-item-C_004_207': 'Compiten por nuestros empleos',
  'c9-item-C_004_208': 'Aumentan el crimen',
  'c9-item-C_004_209': 'No aportan ideas ni cultura',
  'c9-item-C_004_210': 'Son una carga para el Estado',
  'c9-item-C_004_211': 'No dan más de lo que reciben',
  'c9-item-C_004_212': 'No ayudar a los perseguidos políticos',
  'c9-item-C_004_213': 'Sin igual acceso a salud y educación',
  'c9-item-C_004_214': 'Habría que enviarlos de vuelta',

  'c9-sources': 'Datos: Latinobarómetro 2020, batería de 14 afirmaciones sobre la inmigración (módulo de migraciones), 18 países de América Latina; entre 790 y 1.189 casos por celda, % ponderado (peso muestral <em>wt</em>) sobre respuestas válidas. Todos los ítems se orientan igual: mayor valor = postura más hostil hacia el inmigrante. El «perfil centrado» descuenta el nivel general de cada país —le resta el promedio de sus 14 ítems— y a ese desvío le resta la mediana regional del mismo ítem; así aísla la <em>forma</em> del prejuicio (qué le molesta a cada sociedad) de su intensidad. La batería es muy consistente (alfa de Cronbach 0,963; el primer componente explica el 70,6% de la varianza). Es una única ronda: foto, no película; y 2020 se relevó en plena pandemia y en el pico del éxodo venezolano. El ítem sobre migrantes venezolanos no se preguntó en Venezuela (esa barra usa 17 países). El «no sabe / no contesta» va del 7% (Paraguay) al 28% (México), con Argentina en 20%: ese sesgo afecta los niveles crudos, no el perfil centrado (por eso el modo por default es el centrado).'
});

Object.assign(I18N.en, {
  'c9-title':          'Argentines don’t call the immigrant a criminal — they say the hospital isn’t for them',
  'c9-title-neutral':  'What each country holds against the immigrant',

  'c9-subtitle':          'How far each country departs from the regional profile in its hostility toward immigrants, statement by statement. Latinobarómetro 2020.',
  'c9-subtitle-centered': 'How far {PAIS} departs from the regional average on each statement about immigrants, once its overall level of rejection is netted out. Latinobarómetro 2020, amid the pandemic and the peak of the Venezuelan exodus.',
  'c9-subtitle-raw':      'Share of {PAIS} taking a hostile stance toward immigrants on each statement, against the median of 18 countries. Latinobarómetro 2020, amid the pandemic and the peak of the Venezuelan exodus.',

  'c9-country-label': 'Country',
  'c9-mode-label':    'View',
  'c9-mode-centered': 'Centred profile',
  'c9-mode-raw':      'Raw level',

  'c9-axis-centered': 'Deviation from the regional profile (percentage points) · to the right, more hostile than expected',
  'c9-axis-raw':      '% taking a hostile stance toward immigrants',
  'c9-zero-legend':   'regional profile (0)',
  'c9-median-legend': 'Regional median',

  'c9-tt-profile': 'Deviation from regional profile',
  'c9-tt-level':   'Hostile stance',
  'c9-tt-median':  'Regional median',
  'c9-tt-more':    'Above the regional profile.',
  'c9-tt-less':    'Below the regional profile.',
  'c9-tt-above':   'More hostile than the regional median.',
  'c9-tt-below':   'Less hostile than the regional median.',

  'c9-item-C_004_201': 'Against migrants from outside the region',
  'c9-item-C_004_202': 'Against Latin American migrants',
  'c9-item-C_004_203': 'Against Haitian migrants',
  'c9-item-C_004_204': 'Against Venezuelan migrants',
  'c9-item-C_004_205': 'Immigration harms the country',
  'c9-item-C_004_206': 'They are bad for the economy',
  'c9-item-C_004_207': 'They compete for our jobs',
  'c9-item-C_004_208': 'They increase crime',
  'c9-item-C_004_209': 'They add no ideas or culture',
  'c9-item-C_004_210': 'They are a burden on the state',
  'c9-item-C_004_211': 'They take more than they give',
  'c9-item-C_004_212': 'Don’t help political refugees',
  'c9-item-C_004_213': 'No equal access to health, schooling',
  'c9-item-C_004_214': 'They should be sent back home',

  'c9-sources': 'Data: Latinobarómetro 2020, a 14-statement battery on immigration (migration module), 18 Latin American countries; 790–1,189 cases per cell, weighted % (sampling weight <em>wt</em>) over valid responses. All items point the same way: a higher value means a more hostile stance toward immigrants. The “centred profile” removes each country’s overall level —subtracting the average of its 14 items— and then subtracts the regional median of that same item; this isolates the <em>shape</em> of prejudice (what bothers each society) from its intensity. The battery is highly consistent (Cronbach’s alpha 0.963; the first component explains 70.6% of the variance). It is a single round: a snapshot, not a trend; and 2020 was fielded amid the pandemic and the peak of the Venezuelan exodus. The item on Venezuelan migrants was not asked in Venezuela (that bar uses 17 countries). “Don’t know / no answer” ranges from 7% (Paraguay) to 28% (Mexico), with Argentina at 20%: that bias affects the raw levels, not the centred profile (which is why the default mode is the centred one).'
});
