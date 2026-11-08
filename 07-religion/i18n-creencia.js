// Strings de chart-creencia.html (creencia en Dios, América Latina y Europa occidental).
// Se enchufan sobre I18N, ya armado por i18n-issue.js (mismo patrón que 04-intolerancia/i18n-vecinos.js).
// Título = hallazgo solo en la vista de fábrica; apenas el lector cambia países o regiones, pasa al neutral.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'ccre-title': 'La creencia en Dios cayó en Europa y casi no se movió en América Latina',
    'ccre-title-neutral': 'Creencia en Dios en América Latina y Europa occidental',
    'ccre-title-neutral-LA': 'Creencia en Dios en América Latina',
    'ccre-title-neutral-WE': 'Creencia en Dios en Europa occidental',
    'ccre-sub': 'Porcentaje que cree en Dios, {P}',
    'ccre-lbl-sel': 'Países',
    'ccre-search-ph': 'Agregar país…',
    'ccre-reg-LA': 'América Latina',
    'ccre-reg-WE': 'Europa occidental',
    'ccre-box-head': 'Cambio típico, de los noventa a 2017-2022',
    'ccre-box-row': '{R}: {V} {U}',
    'ccre-punto': 'punto', 'ccre-puntos': 'puntos',
    'ccre-vacio': 'Elegí países con el buscador',
    'ccre-tt-add': 'Clic para sumarlo a la selección',
    'br-sin-dato': 'Su región está oculta (tocá la leyenda para mostrarla)',
    'ccre-png-source': 'Datos: Integrated Values Surveys (EVS/WVS), {P}.',
    'ccre-sources': 'Datos: Integrated Values Surveys (European Values Study y World Values Survey). Porcentaje que responde que cree en Dios, sobre las respuestas válidas y con el ponderador de cada encuesta. Cada línea es un país con una encuesta en 1989-1999 y otra en 2017-2022; quedan afuera los países sin encuestas en las dos puntas (Bélgica, Chipre, Ecuador, Irlanda, Luxemburgo y Malta). Cada punto es una encuesta, ubicada en su año medio de trabajo de campo, y la línea une las encuestas que hay. Si un país tiene las dos encuestas en la misma ola, se usa la del World Values Survey. El cambio típico es la mediana, entre los países de cada región, del cambio entre la primera y la última encuesta. Irlanda del Norte se encuesta aparte del Reino Unido.'
  });
  Object.assign(I18N.en, {
    'ccre-title': 'Belief in God fell in Europe and barely moved in Latin America',
    'ccre-title-neutral': 'Belief in God in Latin America and Western Europe',
    'ccre-title-neutral-LA': 'Belief in God in Latin America',
    'ccre-title-neutral-WE': 'Belief in God in Western Europe',
    'ccre-sub': 'Share of people who believe in God, {P}',
    'ccre-lbl-sel': 'Countries',
    'ccre-search-ph': 'Add country…',
    'ccre-reg-LA': 'Latin America',
    'ccre-reg-WE': 'Western Europe',
    'ccre-box-head': 'Typical change, from the 1990s to 2017-2022',
    'ccre-box-row': '{R}: {V} {U}',
    'ccre-punto': 'point', 'ccre-puntos': 'points',
    'ccre-vacio': 'Pick countries with the search box',
    'ccre-tt-add': 'Click to add it to the selection',
    'br-sin-dato': 'Its region is hidden (click the legend to show it)',
    'ccre-png-source': 'Data: Integrated Values Surveys (EVS/WVS), {P}.',
    'ccre-sources': 'Data: Integrated Values Surveys (European Values Study and World Values Survey). Share who say they believe in God, out of valid answers and using each survey\'s weights. Each line is a country with one survey in 1989-1999 and another in 2017-2022; countries without surveys at both ends are left out (Belgium, Cyprus, Ecuador, Ireland, Luxembourg and Malta). Each dot is a survey, placed at its mean fieldwork year, and the line connects the available surveys. When a country has both surveys in the same wave, the World Values Survey is used. The typical change is the median, across the countries of each region, of the change between the first and the last survey. Northern Ireland is surveyed separately from the United Kingdom.'
  });
})();
