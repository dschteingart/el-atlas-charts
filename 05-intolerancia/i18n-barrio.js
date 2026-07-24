// Strings del Chart 8 del N°5 — "En el barrio del argentino pasa de todo, menos
// racismo" (perfil de la batería H002 del WVS: qué ve cada sociedad en su barrio).
// Se carga DESPUÉS de i18n-issue.js (que crea el objeto I18N) y ANTES de barrio.js.
// No toca i18n-issue.js: solo agrega claves c8-* a I18N.es / I18N.en.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c8-title':          'En el barrio del argentino pasa de todo, menos racismo',
    'c8-title-neutral':  '¿Qué ve cada sociedad en su propio barrio?',
    'c8-subtitle-tpl':   'Qué tan seguido ve {PAIS} cada problema en su barrio, ordenado de lo más a lo menos frecuente. Mide saliencia percibida, no prevalencia: ver poco racismo puede significar que hay poco, o que no se lo registra. Encuesta de {PERIODO}.',
    'c8-country-label':  'País',
    'c8-wave-label':     'Ola de la encuesta',
    'c8-axis-x':         '% que lo ve muy o bastante seguido en su barrio',
    'c8-nodata':         '{PAIS} no tiene datos en {PERIODO}.',
    'c8-median-legend':  'Mediana mundial',
    'c8-rank-tpl':       '{R}° de {N}',
    'c8-tt-rank':        'Puesto mundial',
    'c8-tt-above':       'Por encima de la mediana mundial.',
    'c8-tt-below':       'Por debajo de la mediana mundial.',
    'c8-item-robos':     'Robos',
    'c8-item-alcohol':   'Alcohol en la vía pública',
    'c8-item-policia':   'La policía se mete en la vida privada',
    'c8-item-racismo':   'Conductas racistas',
    'c8-item-droga':     'Venta de droga en la calle',
    'c8-sources':        'Datos: World Values Survey, batería H002 ("¿con qué frecuencia pasan estas cosas en tu barrio?"), olas 6 (2010-2016) y 7 (2017-2023). Indicador: % que responde "muy" o "bastante seguido" sobre el total que contesta la pregunta, ponderado por S017. El puesto mundial y la mediana se calculan sobre los países con los cinco ítems en cada ola (64 en la ola 7, 59 en la 6). Es batería del WVS: no cubre Francia, Italia, los países nórdicos, Austria, Portugal ni los bálticos. La batería es fuertemente unidimensional (los ítems correlacionan alto entre sí), así que el valor no está en el ranking crudo de un ítem sino en el perfil interno de cada país.'
  });

  Object.assign(I18N.en, {
    'c8-title':          "In the Argentine's neighbourhood, everything happens — except racism",
    'c8-title-neutral':  'What does each society see in its own neighbourhood?',
    'c8-subtitle-tpl':   'How often {PAIS} sees each problem in its neighbourhood, ranked from most to least frequent. It measures perceived salience, not prevalence: seeing little racism may mean there is little, or that it goes unnoticed. Survey wave {PERIODO}.',
    'c8-country-label':  'Country',
    'c8-wave-label':     'Survey wave',
    'c8-axis-x':         '% who see it very or fairly often in their neighbourhood',
    'c8-nodata':         '{PAIS} has no data for {PERIODO}.',
    'c8-median-legend':  'World median',
    'c8-rank-tpl':       '#{R} of {N}',
    'c8-tt-rank':        'World rank',
    'c8-tt-above':       'Above the world median.',
    'c8-tt-below':       'Below the world median.',
    'c8-item-robos':     'Robberies',
    'c8-item-alcohol':   'Alcohol drunk in the street',
    'c8-item-policia':   'Police intrude on private life',
    'c8-item-racismo':   'Racist behaviour',
    'c8-item-droga':     'Drug dealing in the street',
    'c8-sources':        'Data: World Values Survey, H002 battery ("how frequently do these things occur in your neighbourhood?"), waves 6 (2010-2016) and 7 (2017-2023). Indicator: share answering "very" or "quite frequently" out of everyone who answered the question, weighted by S017. World rank and median are computed over the countries with all five items in each wave (64 in wave 7, 59 in wave 6). This is a WVS-only battery: it does not cover France, Italy, the Nordics, Austria, Portugal or the Baltics. The battery is strongly one-dimensional (the items correlate highly), so the point is not the raw ranking of a single item but each country\'s internal profile.'
  });
})();
