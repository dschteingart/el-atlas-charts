// Strings del graficador migratorio (chart-migrantes.html): pestañas del shell
// (g9-*) + la vista Comparación (chart 15, clon de barrio-comp.js →
// migrantes-comp.js). Se carga DESPUÉS de i18n-issue.js e i18n-migrantes.js:
// las etiquetas de los 14 ítems NO se duplican acá, se reusan las claves
// c9-item-<código> del perfil. No toca i18n-issue.js (lo comparten otros charts).
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    // shell del graficador
    'g9-eyebrow':        'El inmigrante',
    'g9-lead':           'Qué le reprocha cada país al inmigrante. Compará países en una frase, o mirá el perfil completo de un país.',
    'g9-view-comp':      'Comparación',
    'g9-view-perfil':    'Perfil',

    // chart 15 — comparación entre países (clon del ranking)
    'c15-title':         'Argentina encabeza la región en negarle el hospital y la escuela al inmigrante',
    'c15-title-neutral': 'La misma frase sobre el inmigrante, país por país',
    'c15-subtitle-tpl':  'Porcentaje con una postura hostil en la frase «{ITEM}», sobre {N} países de América Latina. Latinobarómetro {PERIODO}, en plena pandemia y pico del éxodo venezolano.',
    'c15-cat-label':     'Frase sobre el inmigrante…',
    'c15-view-label':    'Mostrar',
    'c15-view-sel':      'Mi selección',
    'c15-view-all':      'Todos los países',
    'c15-refs-label':    'Referencias',
    'c15-ref-median':    'Mediana',
    'c15-search-ph':     'Agregar país…',
    'c15-pick-hint-sel': 'Los países elegidos se muestran como barras.',
    'c15-pick-hint-all': 'Los países elegidos se etiquetan en el gráfico.',
    'c15-median-lbl':    'Mediana regional',
    'c15-rank-tpl':      '{R}° de {N}',
    'c15-axis-x':        '% con una postura hostil en esta frase',
    'c15-axis-mk':       '% con una postura hostil en esta frase',
    'c15-tt-pct':        'Postura hostil',
    'c15-tt-rank':       'Puesto regional',
    'c15-tt-median':     'Mediana regional',
    'c15-tt-n':          'Muestra',
    'c15-sources':       'Datos: Latinobarómetro 2020, batería de 14 afirmaciones sobre la inmigración (módulo de migraciones), 18 países de América Latina; entre 790 y 1.189 casos por celda, % ponderado (peso muestral <em>wt</em>) sobre respuestas válidas. Todos los ítems se orientan igual: mayor valor = postura más hostil hacia el inmigrante. Esta vista muestra el <em>nivel crudo</em>: el puesto y la mediana regional se calculan sobre los países con dato en la frase elegida (18; 17 en la de migrantes venezolanos, que no se preguntó en Venezuela). Ojo con comparar niveles entre países: el «no sabe / no contesta» va del 7% (Paraguay) al 28% (México), con Argentina en 20%, y ese sesgo mueve los niveles crudos —no el perfil centrado de la pestaña «Perfil», que descuenta el nivel general de cada país—. Es una única ronda: foto, no película; y 2020 se relevó en plena pandemia y en el pico del éxodo venezolano.',
    'c15-sources-tpl':   'Datos: Latinobarómetro {Y}, batería de 14 afirmaciones sobre la inmigración. % con postura hostil en «{ITEM}», ponderado (wt), sobre respuestas válidas.',
  });

  Object.assign(I18N.en, {
    // grapher shell
    'g9-eyebrow':        'The immigrant',
    'g9-lead':           'What each country holds against the immigrant. Compare countries on one statement, or see a country’s full profile.',
    'g9-view-comp':      'Comparison',
    'g9-view-perfil':    'Profile',

    // chart 15 — cross-country comparison (ranking clone)
    'c15-title':         'Argentina leads the region in denying immigrants the hospital and the school',
    'c15-title-neutral': 'The same statement about immigrants, country by country',
    'c15-subtitle-tpl':  'Share taking a hostile stance on the statement “{ITEM}”, across {N} Latin American countries. Latinobarómetro {PERIODO}, amid the pandemic and the peak of the Venezuelan exodus.',
    'c15-cat-label':     'Statement about immigrants…',
    'c15-view-label':    'Show',
    'c15-view-sel':      'My selection',
    'c15-view-all':      'All countries',
    'c15-refs-label':    'References',
    'c15-ref-median':    'Median',
    'c15-search-ph':     'Add country…',
    'c15-pick-hint-sel': 'The chosen countries show as bars.',
    'c15-pick-hint-all': 'The chosen countries are labelled on the chart.',
    'c15-median-lbl':    'Regional median',
    'c15-rank-tpl':      '#{R} of {N}',
    'c15-axis-x':        '% taking a hostile stance on this statement',
    'c15-axis-mk':       '% taking a hostile stance on this statement',
    'c15-tt-pct':        'Hostile stance',
    'c15-tt-rank':       'Regional rank',
    'c15-tt-median':     'Regional median',
    'c15-tt-n':          'Sample',
    'c15-sources':       'Data: Latinobarómetro 2020, a 14-statement battery on immigration (migration module), 18 Latin American countries; 790–1,189 cases per cell, weighted % (sampling weight <em>wt</em>) over valid responses. All items point the same way: a higher value means a more hostile stance toward immigrants. This view shows the <em>raw level</em>: the rank and the regional median are computed over the countries with data on the chosen statement (18; 17 on the one about Venezuelan migrants, which was not asked in Venezuela). Take cross-country level comparisons with care: “don’t know / no answer” ranges from 7% (Paraguay) to 28% (Mexico), with Argentina at 20%, and that bias moves the raw levels —not the centred profile in the “Profile” tab, which nets out each country’s overall level. It is a single round: a snapshot, not a trend; and 2020 was fielded amid the pandemic and the peak of the Venezuelan exodus.',
    'c15-sources-tpl':   'Data: Latinobarómetro {Y}, a 14-statement battery on immigration. % taking a hostile stance on “{ITEM}”, weighted (wt), over valid responses.',
  });
})();
