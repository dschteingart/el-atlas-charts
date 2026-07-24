// Strings del Chart 10 del N°5 — "confianza al extranjero vs. desconfianza general".
// Se carga DESPUÉS de i18n-issue.js (que crea I18N) y ANTES de confianza.js.
// Mergea sobre I18N.es / I18N.en sin pisar al resto (otros agentes editan i18n-issue.js).
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'c10-title':          'Buena parte de la xenofobia declarada es, en realidad, desconfianza general',
    'c10-title-neutral':  'Desconfianza de un extranjero frente a desconfianza de un desconocido',
    'c10-subtitle':       'Cada punto es un país. Debajo de la diagonal, se desconfía menos de un extranjero que de un desconocido cualquiera.',
    'c10-subtitle-nat':   'Desconfianza de gente de otra nacionalidad frente a desconfianza de un desconocido. Cada punto, un país; la diagonal marca la igualdad y la recta, la tendencia general.',
    'c10-subtitle-rel':   'Desconfianza de gente de otra religión frente a desconfianza de un desconocido. Cada punto, un país; la diagonal marca la igualdad y la recta, la tendencia general.',
    'c10-dim-label':      'Desconfía de',
    'c10-dim-nat':        'Otra nacionalidad',
    'c10-dim-rel':        'Otra religión',
    'c10-axis-x':         'Desconfía de gente que conoce por primera vez (%)',
    'c10-axis-y-nat':     'Desconfía de gente de otra nacionalidad (%)',
    'c10-axis-y-rel':     'Desconfía de gente de otra religión (%)',
    'c10-tt-x':           'Desconfía de un desconocido',
    'c10-tt-y-nat':       'Desconfía de otra nacionalidad',
    'c10-tt-y-rel':       'Desconfía de otra religión',
    'c10-tt-gap':         'Brecha (extranjero − desconocido)',
    'c10-tt-resid':       'Residuo (controlando desconfianza general)',
    'c10-line-diag':      'Diagonal: igual desconfianza',
    'c10-line-fit':       'Tendencia general',
    'c10-sources':        'Datos: Integrated Values Surveys (EVS/WVS), ola 7 (2017-2023); 92 países. Cada eje mide el porcentaje que dice confiar &laquo;no mucho&raquo; o &laquo;nada&raquo; en un grupo, a la pregunta &laquo;¿cuánto confía en...?&raquo; (categorías 3 y 4 de una escala de 1 a 4), ponderado por el factor muestral (S017). Eje X: gente que conoce por primera vez. Eje Y: gente de otra nacionalidad (o de otra religión, según el control). La diagonal marca la igualdad de desconfianza; la recta es el ajuste lineal por mínimos cuadrados de la desconfianza al extranjero sobre la desconfianza a un desconocido, y el &laquo;residuo&raquo; de cada país es cuánto se aparta de esa tendencia. Es un dato declarativo: prueba que el resultado no sea un artefacto del estilo de respuesta (quien desconfía de todo el mundo), no la ausencia de prejuicio. El ítem de desconocidos tiene techo (Perú 90,9%, Ecuador 92,2%); por eso se reporta la diferencia y el residuo, nunca el cociente (que correlaciona con el nivel). El mismo control no es un salvoconducto argentino: aplicado a Brasil o Chile, los deja donde ya estaban.'
  });
  Object.assign(I18N.en, {
    'c10-title':          'Much of declared xenophobia is really just general distrust',
    'c10-title-neutral':  'Distrust of a foreigner versus distrust of a stranger',
    'c10-subtitle':       'Each dot is a country. Below the diagonal, people distrust a foreigner less than they distrust any stranger.',
    'c10-subtitle-nat':   'Distrust of people of another nationality versus distrust of a stranger. Each dot is a country; the diagonal marks equality and the line, the general trend.',
    'c10-subtitle-rel':   'Distrust of people of another religion versus distrust of a stranger. Each dot is a country; the diagonal marks equality and the line, the general trend.',
    'c10-dim-label':      'Distrusts',
    'c10-dim-nat':        'Another nationality',
    'c10-dim-rel':        'Another religion',
    'c10-axis-x':         'Distrusts people met for the first time (%)',
    'c10-axis-y-nat':     'Distrusts people of another nationality (%)',
    'c10-axis-y-rel':     'Distrusts people of another religion (%)',
    'c10-tt-x':           'Distrusts a stranger',
    'c10-tt-y-nat':       'Distrusts another nationality',
    'c10-tt-y-rel':       'Distrusts another religion',
    'c10-tt-gap':         'Gap (foreigner − stranger)',
    'c10-tt-resid':       'Residual (controlling for general distrust)',
    'c10-line-diag':      'Diagonal: equal distrust',
    'c10-line-fit':       'General trend',
    'c10-sources':        'Data: Integrated Values Surveys (EVS/WVS), wave 7 (2017-2023); 92 countries. Each axis is the share who say they trust a group &laquo;not very much&raquo; or &laquo;not at all&raquo;, on the question &laquo;how much do you trust...?&raquo; (categories 3 and 4 of a 1-to-4 scale), weighted by the sampling factor (S017). X axis: people met for the first time. Y axis: people of another nationality (or another religion, depending on the control). The diagonal marks equal distrust; the line is the least-squares fit of distrust of foreigners on distrust of a stranger, and each country\'s &laquo;residual&raquo; is how far it departs from that trend. This is self-reported: it tests that the result is not an artefact of response style (distrusting everyone), not the absence of prejudice. The stranger item is near its ceiling (Peru 90.9%, Ecuador 92.2%); that is why we report the difference and the residual, never the ratio (which correlates with the level). The same control is no Argentine free pass: applied to Brazil or Chile, it leaves them where they already were.'
  });
})();
