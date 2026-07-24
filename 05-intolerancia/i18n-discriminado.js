// Strings del Chart 11 del N°5 — "Sentirse parte de un grupo discriminado"
// (Latinobarómetro). Se carga DESPUÉS de i18n-issue.js y ANTES de discriminado.js.
// No toca i18n-issue.js (lo editan otros agentes en paralelo): sólo agrega claves.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // Título: default NEUTRAL (descriptivo); el insight editorial queda para el editor.
    'c11-title':          'Cada vez más latinoamericanos se sienten parte de un grupo discriminado',
    'c11-title-neutral':  'Sentirse parte de un grupo discriminado, en América Latina',

    'c11-subtitle-pais':  'Porcentaje que responde que sí es parte de un grupo discriminado en su país (Latinobarómetro, 2009-2020). Es percepción declarada, no discriminación medida.',
    'c11-subtitle-etnia': 'Porcentaje que responde que sí es parte de un grupo discriminado, por grupo étnico autopercibido (agregado regional de 18 países, no país por país). Percepción declarada, no discriminación medida.',

    'c11-univ-label':     'Ver por',
    'c11-univ-pais':      'País',
    'c11-univ-etnia':     'Grupo étnico (regional)',
    'c11-period-label':   'Período',
    'c11-search-ph':      'Agregar…',
    'c11-avg-label':      'Promedio regional',
    'c11-avg-toggle':     'Promedio regional (18 países)',
    'c11-axis-y':         '% que se siente parte de un grupo discriminado',

    'c11-sources':        'Datos: Latinobarómetro, pregunta A_011_001 «¿Se describiría como parte de un grupo que es discriminado en (país)?» (Sí/No), en las rondas 2009, 2010, 2011, 2015 y 2020. Se grafica el porcentaje de «Sí», ponderado por el factor de expansión (wt) sobre respuestas válidas (los códigos negativos se tratan como no-respuesta). Se incluyen los 18 países con dato en las cinco rondas (panel balanceado; España aparece en la muestra de 2009 pero no incluyó el ítem, así que queda afuera). El promedio regional es la media simple de esos 18 países. El corte por grupo étnico (variable A_011_011, recodificada a blanco / mestizo / indígena / afrodescendiente —negro y mulato— / otros) es un agregado REGIONAL, no país por país: dentro de cada país las submuestras étnicas son chicas (en Argentina, por ejemplo, afrodescendientes e indígenas no llegan a una docena de casos en 2020), por eso Argentina no se abre por etnia. Es una medida de PERCEPCIÓN de discriminación declarada ante el encuestador, nunca de discriminación efectivamente medida; la tasa de respuesta al ítem baja con los años (es no-respuesta, no rechazo del ítem).'
  });

  Object.assign(I18N.en, {
    'c11-title':          'More and more Latin Americans feel part of a discriminated group',
    'c11-title-neutral':  'Feeling part of a discriminated group, in Latin America',

    'c11-subtitle-pais':  'Share who answer that yes, they are part of a discriminated group in their country (Latinobarómetro, 2009-2020). This is declared perception, not measured discrimination.',
    'c11-subtitle-etnia': 'Share who answer that yes, they are part of a discriminated group, by self-identified ethnic group (regional aggregate of 18 countries, not country by country). Declared perception, not measured discrimination.',

    'c11-univ-label':     'Break down by',
    'c11-univ-pais':      'Country',
    'c11-univ-etnia':     'Ethnic group (regional)',
    'c11-period-label':   'Period',
    'c11-search-ph':      'Add…',
    'c11-avg-label':      'Regional average',
    'c11-avg-toggle':     'Regional average (18 countries)',
    'c11-axis-y':         '% who feel part of a discriminated group',

    'c11-sources':        'Data: Latinobarómetro, question A_011_001 "Would you describe yourself as part of a group that is discriminated against in (country)?" (Yes/No), in the 2009, 2010, 2011, 2015 and 2020 rounds. The chart shows the share of "Yes", weighted by the expansion factor (wt) over valid responses (negative codes are treated as non-response). The 18 countries with data in all five rounds are included (balanced panel; Spain is in the 2009 sample but did not carry the item, so it is dropped). The regional average is the simple mean of those 18 countries. The ethnic breakdown (variable A_011_011, recoded to white / mestizo / Indigenous / Afro-descendant —black and mixed— / other) is a REGIONAL aggregate, not country by country: within each country the ethnic subsamples are small (in Argentina, for instance, Afro-descendants and Indigenous people number fewer than a dozen cases in 2020), which is why Argentina cannot be split by ethnicity. It measures the PERCEPTION of discrimination as declared to the interviewer, never discrimination as actually measured; the item response rate falls over the years (this is non-response, not a refusal of the item).'
  });
})();
