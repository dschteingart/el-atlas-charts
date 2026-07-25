// Strings del chart 17 del N°5 — "Evolución": el barrio entre las dos olas del
// WVS (gráfico de pendiente). Tercera vista del graficador chart-barrio.html.
// Se carga DESPUÉS de i18n-issue.js, i18n-barrio.js e i18n-barrio-comp.js (reusa
// las claves c8-item-* del perfil para los nombres de los ítems). No toca
// i18n-issue.js ni los i18n de los otros charts: sólo agrega claves.
//
// Excepción deliberada: 'g8-view-evol' (la pestaña nueva) y 'g8-lead' (el copete
// del graficador, que ahora tiene que nombrar las TRES vistas) son del shell.
// Se definen/pisan acá, en el archivo del chart que las introduce, en vez de
// editar i18n-barrio-comp.js.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // shell del graficador: pestaña nueva + copete actualizado
    'g8-view-evol':      'Evolución',
    'g8-lead':           'Qué dice cada sociedad que pasa seguido en su barrio. Compará países en un ítem, mirá cómo cambió entre las dos olas de la encuesta, o abrí el perfil completo de un país.',

    // chart 17 — evolución entre olas (gráfico de pendiente)
    'c17-title':         'En casi toda América Latina se ve más racismo en el barrio que hace una década',
    'c17-title-neutral': 'Qué cambió en el barrio entre las dos olas de la encuesta',
    'c17-subtitle-tpl':  'Porcentaje que dice que «{ITEM}» pasa muy o bastante seguido en su barrio, en la ola 6 (2010-2016) y en la 7 (2017-2023). Cada línea une las dos mediciones de un país, ubicadas en el año real en que se hizo el trabajo de campo.',
    'c17-cat-label':     'Qué pasa en el barrio…',
    'c17-search-ph':     'Agregar país…',
    'c17-pick-hint':     'Los países elegidos se dibujan como líneas.',
    'c17-axis-y':        '% que dice que pasa muy o bastante seguido en su barrio',
    'c17-sources':       'Datos: World Values Survey, batería H002 («¿con qué frecuencia pasan estas cosas en tu barrio?»), olas 6 (2010-2016) y 7 (2017-2023). Indicador: % que responde «muy seguido» o «bastante seguido» sobre las cuatro opciones de respuesta, ponderado por S017; muestras de 1.000-2.000 casos. Cada punto se ubica en el año real del trabajo de campo de ese país (Argentina 2013 y 2017; Brasil 2014 y 2018), no en el punto medio del período de la ola: por eso las pendientes no son todas paralelas. La línea que une los dos puntos es un conector visual, no una serie anual: entre una ola y otra no hay mediciones. Un país que no salió a campo en las dos olas aparece como un punto suelto. Es batería del WVS: no cubre Francia, Italia, los países nórdicos, Austria, Portugal ni los bálticos. Ojo: mide <em>saliencia percibida</em>, no prevalencia — cuánto registra la gente cada problema, no cuánto ocurre efectivamente.',
    'c17-sources-tpl':   'Datos: World Values Survey, batería H002, «{ITEM}». % «muy/bastante seguido», ponderado S017, olas 6 (2010-2016) y 7 (2017-2023), cada punto en el año real de campo. Mide saliencia percibida, no prevalencia.',
  });

  Object.assign(I18N.en, {
    // grapher shell: new tab + updated lead
    'g8-view-evol':      'Change over time',
    'g8-lead':           'What each society says happens often in its neighbourhood. Compare countries on one item, see how it changed between the two survey waves, or open a country’s full profile.',

    // chart 17 — change between waves (slope chart)
    'c17-title':         'Across most of Latin America, more racism is seen in the neighbourhood than a decade ago',
    'c17-title-neutral': 'What changed in the neighbourhood between the two survey waves',
    'c17-subtitle-tpl':  'Share who say “{ITEM}” happens very or quite frequently in their neighbourhood, in wave 6 (2010-2016) and wave 7 (2017-2023). Each line joins a country’s two measurements, placed at the actual year of fieldwork.',
    'c17-cat-label':     'What happens in the neighbourhood…',
    'c17-search-ph':     'Add country…',
    'c17-pick-hint':     'The chosen countries are drawn as lines.',
    'c17-axis-y':        '% who say it happens very or quite frequently in their neighbourhood',
    'c17-sources':       'Data: World Values Survey, H002 battery ("how frequently do these things occur in your neighbourhood?"), waves 6 (2010-2016) and 7 (2017-2023). Indicator: share answering "very frequently" or "quite frequently" out of the four response options, weighted by S017; samples of 1,000-2,000 cases. Each point sits at the actual year of fieldwork for that country (Argentina 2013 and 2017; Brazil 2014 and 2018), not at the midpoint of the wave period — which is why the slopes are not all parallel. The line joining the two points is a visual connector, not an annual series: there are no measurements in between. A country surveyed in only one wave shows up as a single dot. This is a WVS-only battery: it does not cover France, Italy, the Nordics, Austria, Portugal or the Baltics. Note: it measures <em>perceived salience</em>, not prevalence — how much people register each problem, not how much actually occurs.',
    'c17-sources-tpl':   'Data: World Values Survey, H002 battery, "{ITEM}". % "very/quite frequently", weighted by S017, waves 6 (2010-2016) and 7 (2017-2023), each point at the actual fieldwork year. Measures perceived salience, not prevalence.',
  });
})();
