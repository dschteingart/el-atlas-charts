// Strings del graficador "grupo discriminado" (chart-discriminado.html):
// pestañas del shell (g11-*) + la vista Comparación (chart 16, clon de
// ranking.js → discriminado-comp.js).
// Se carga DESPUÉS de i18n-issue.js e i18n-discriminado.js (reusa las claves
// c11-univ-* del selector de universo, que es el mismo control en las dos
// vistas). No toca i18n-issue.js (lo comparten los otros agentes).
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // ---- shell del graficador ----
    'g11-eyebrow':        'Sentirse discriminado',
    'g11-lead':           'Cuánta gente se describe como parte de un grupo discriminado en su país. Compará países en una ronda de la encuesta, o seguí la evolución 2009-2020.',
    'g11-view-comp':      'Comparación',
    'g11-view-evol':      'Evolución',

    // ---- chart 16 — comparación entre países / grupos (clon del ranking) ----
    'c16-title':          'Brasil, Chile y Bolivia encabezan la sensación de ser parte de un grupo discriminado',
    'c16-title-neutral':  'Sentirse parte de un grupo discriminado, ronda por ronda',

    'c16-subtitle-pais-tpl':  'Porcentaje que se describe como parte de un grupo discriminado en su país, en la ronda {RONDA} del Latinobarómetro. Es percepción declarada, no discriminación medida.',
    'c16-subtitle-etnia-tpl': 'Porcentaje que se describe como parte de un grupo discriminado, por grupo étnico autopercibido, en la ronda {RONDA} del Latinobarómetro. Es un agregado regional de 18 países, no país por país.',

    'c16-round-label':    'Ronda',
    'c16-refs-label':     'Referencia',
    'c16-view-label':     'Mostrar',
    'c16-view-sel':       'Mi selección',
    'c16-view-all':       'Todos',
    'c16-ref-avg':        'Promedio regional',
    'c16-avg-lbl':        'Promedio regional',
    'c16-search-ph':      'Agregar…',
    // Dos hints según la vista (mismo criterio que c1/c13/c14/c15): en «Mi
    // selección» los chips SON las barras; en «Todos» se dibujan todas y la
    // selección sólo viaja a la vista de Evolución.
    'c16-pick-hint-sel':  'Los elegidos se muestran como barras.',
    'c16-pick-hint-all':  'Se muestran todos; la selección viaja a la vista de Evolución.',
    'c16-axis-x':         '% que se describe como parte de un grupo discriminado',

    'c16-tt-pct':         'Se siente discriminado',
    'c16-tt-round':       'Ronda',
    'c16-tt-n':           'Muestra',
    'c16-tt-rank':        'Puesto regional',
    'c16-tt-rank-etnia':  'Puesto entre grupos',
    'c16-rank-tpl':       '{R}° de {N}',
    'c16-tt-vs-avg':      'Vs. promedio regional',

    'c16-sources':        'Datos: Latinobarómetro, pregunta A_011_001 «¿Se describiría como parte de un grupo que es discriminado en (país)?» (Sí/No), en las rondas 2009, 2010, 2011, 2015 y 2020. Se grafica el porcentaje de «Sí», ponderado por el factor de expansión (wt) sobre respuestas válidas (los códigos negativos se tratan como no-respuesta). Se incluyen los 18 países con dato en las cinco rondas (panel balanceado; España aparece en la muestra de 2009 pero no incluyó el ítem, así que queda afuera). Cada ronda se muestra sola: el gráfico toma la observación de ESE año exacto, sin interpolar ni completar rondas faltantes. En la vista <strong>por país</strong>, la línea de referencia es el promedio simple de los 18 países en esa ronda. En la vista <strong>por grupo étnico</strong>, el corte (variable A_011_011, recodificada a blanco / mestizo / indígena / afrodescendiente —negro y mulato— / otros) es un agregado REGIONAL, no país por país: dentro de cada país las submuestras étnicas son chicas. Es una medida de PERCEPCIÓN de discriminación declarada ante el encuestador, nunca de discriminación efectivamente medida.',
    'c16-sources-tpl':    'Datos: Latinobarómetro, pregunta A_011_001 («¿se describiría como parte de un grupo discriminado en su país?»), ronda {R}. % de «Sí», ponderado por wt. Percepción declarada, no discriminación medida.'
  });

  Object.assign(I18N.en, {
    // ---- grapher shell ----
    'g11-eyebrow':        'Feeling discriminated against',
    'g11-lead':           'How many people describe themselves as part of a discriminated group in their country. Compare countries within one survey round, or follow the 2009-2020 trend.',
    'g11-view-comp':      'Comparison',
    'g11-view-evol':      'Trend',

    // ---- chart 16 — cross-country comparison (ranking clone) ----
    'c16-title':          'Brazil, Chile and Bolivia lead the sense of belonging to a discriminated group',
    'c16-title-neutral':  'Feeling part of a discriminated group, round by round',

    'c16-subtitle-pais-tpl':  'Share who describe themselves as part of a discriminated group in their country, in the {RONDA} Latinobarómetro round. This is declared perception, not measured discrimination.',
    'c16-subtitle-etnia-tpl': 'Share who describe themselves as part of a discriminated group, by self-identified ethnic group, in the {RONDA} Latinobarómetro round. A regional aggregate of 18 countries, not country by country.',

    'c16-round-label':    'Round',
    'c16-refs-label':     'Reference',
    'c16-view-label':     'Show',
    'c16-view-sel':       'My selection',
    'c16-view-all':       'All',
    'c16-ref-avg':        'Regional average',
    'c16-avg-lbl':        'Regional average',
    'c16-search-ph':      'Add…',
    'c16-pick-hint-sel':  'The ones you pick show as bars.',
    'c16-pick-hint-all':  'All are shown; your selection carries over to the Trend view.',
    'c16-axis-x':         '% who describe themselves as part of a discriminated group',

    'c16-tt-pct':         'Feels discriminated against',
    'c16-tt-round':       'Round',
    'c16-tt-n':           'Sample',
    'c16-tt-rank':        'Regional rank',
    'c16-tt-rank-etnia':  'Rank among groups',
    'c16-rank-tpl':       '#{R} of {N}',
    'c16-tt-vs-avg':      'Vs. regional average',

    'c16-sources':        'Data: Latinobarómetro, question A_011_001 "Would you describe yourself as part of a group that is discriminated against in (country)?" (Yes/No), in the 2009, 2010, 2011, 2015 and 2020 rounds. The chart shows the share of "Yes", weighted by the expansion factor (wt) over valid responses (negative codes are treated as non-response). The 18 countries with data in all five rounds are included (balanced panel; Spain is in the 2009 sample but did not carry the item, so it is dropped). Each round is shown on its own: the chart takes the observation for that exact year, with no interpolation and no filling in of missing rounds. The reference line is the simple mean of those 18 countries in that round. The ethnic breakdown (variable A_011_011, recoded to white / mestizo / Indigenous / Afro-descendant —black and mixed— / other) is a REGIONAL aggregate, not country by country: within each country the ethnic subsamples are small. It measures the PERCEPTION of discrimination as declared to the interviewer, never discrimination as actually measured.',
    'c16-sources-tpl':    'Data: Latinobarómetro, question A_011_001 ("would you describe yourself as part of a discriminated group in your country?"), {R} round. Share of "Yes", weighted by wt. Declared perception, not measured discrimination.'
  });
})();
