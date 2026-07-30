// Strings del N°4 · CHART 12 «¿Quién es el más discriminado?» (Latinobarómetro 2020).
// Se carga DESPUÉS de i18n-issue.js (que define I18N/LANG/t) y ANTES de quien.js.
// NO redefine I18N: extiende las claves con Object.assign (los otros agentes editan
// i18n-issue.js en paralelo; acá sólo agrego mis c12-* y qcat-*).

Object.assign(I18N.es, {
  // ---- Shell del graficador (encabezado + pestañas de vista, lib/grapher.js)
  'g12-eyebrow':        'Quién es el más discriminado',
  'g12-lead':           'A qué grupo señala cada sociedad como el más discriminado de su país. Mirá el mismo dato de tres maneras: la tabla completa, el ranking de los 18 países en un grupo, o el perfil de un país.',
  'g12-view-ranking':   'Ranking',
  'g12-view-perfil':    'Perfil',
  'g12-view-matriz':    'Matriz',

  // ---- Títulos (default NEUTRAL vía atlasSetHeading; el insight queda para el editor)
  'c12-title':          'En 14 de 18 países el más discriminado no es un grupo racial: son los pobres',
  'c12-title-neutral':  'El grupo más discriminado en cada país de América Latina',

  // ---- Subtítulos: estático (default, por si el editor restaura el data-i18n)
  // + dinámicos que el JS rellena según vista/categoría/país.
  'c12-subtitle':            'Porcentaje que nombra a Raza o etnia como el grupo más discriminado del país. Cada persona eligió una sola respuesta. Latinobarómetro 2020, 18 países.',
  'c12-subtitle-rank-tpl':   'Porcentaje que nombra a {CAT} como el grupo más discriminado del país. Cada persona eligió una sola respuesta. Latinobarómetro 2020, 18 países.',
  'c12-subtitle-perfil-tpl': 'A qué grupo señala como el más discriminado del país la gente de {PAIS}. Cada persona eligió una sola respuesta. Latinobarómetro 2020.',
  // Matriz: la bajada tiene que explicar QUÉ ordena las filas, porque el orden
  // cambia con el selector y sin eso el lector no sabe qué está mirando.
  'c12-subtitle-matriz-tpl': 'Porcentaje que nombra a cada grupo como el más discriminado de su país. Los ocho grupos más nombrados, con los países ordenados por {CAT}. Latinobarómetro 2020.',

  // ---- Controles (el viejo toggle Mostrar: ranking/perfil son hoy las pestañas g12-view-*)
  'c12-cat-label':      'Grupo señalado',
  'c12-country-label':  'País',
  'c12-refs-label':     'Referencias',
  'c12-heat-hint':      'Tocá el nombre de un grupo para ordenar los países por esa columna',
  'c12-ref-median':     'Mediana regional',

  // ---- Ejes / leyendas
  'c12-axis-x':         '% que lo nombra como el grupo más discriminado',
  'c12-median-lbl':     'Mediana regional',
  'c12-median-legend':  'Mediana regional',
  'c12-heat-legend':    '% que lo nombra como el más discriminado',
  'c12-heat-box-note':  'El número grande, en recuadro, es el grupo que ese país señala primero.',

  // ---- Tooltip
  'c12-tt-pct':         'Lo nombran como el más discriminado',
  'c12-tt-top':         'Grupo más señalado',
  'c12-tt-n':           'Muestra',
  'c12-tt-incl':        'Respuestas originales',
  'c12-tt-more-tpl':    'y {N} más',
  'c12-tt-above':       'Por encima de la mediana regional.',
  'c12-tt-below':       'Por debajo de la mediana regional.',
  'c12-nodata':         '{PAIS} no tiene datos en 2020.',

  // ---- Detalle de las 42 categorías crudas (vista perfil)
  'c12-detail-title':   'El detalle: las 42 categorías originales del Latinobarómetro',
  'c12-detail-intro-tpl': 'El Latinobarómetro ofrecía 42 respuestas posibles; nosotros las agrupamos en 12 macrocategorías (el recodeo es nuestro, no del Latinobarómetro). Así se reparte cada macro entre las respuestas originales en {PAIS} (% ponderado sobre respuestas válidas):',

  // ---- Fuentes / metodología
  'c12-sources':        'Datos: Latinobarómetro 2020, pregunta P58ST: «¿Cuáles cree Ud. que son las personas o grupos más discriminados en el país?» — RESPUESTA ÚNICA (cada persona nombró un solo grupo). 18 países de América Latina, muestras nacionales de ~1.000-1.200 casos; % ponderado (wt) sobre 16.752 respuestas válidas (82,9% de 20.204; el 17,1% no sabe o no responde). El menú original tenía 42 categorías: las agrupamos en 12 macrocategorías (el recodeo es nuestro, no del Latinobarómetro; el detalle de las 42 está en la pestaña «Perfil»). La pestaña «Matriz» dibuja las ocho macrocategorías más nombradas; ideología política, conducta o estigma, salud o discapacidad y religión u origen no aparecen ahí —ninguna es la más señalada en ningún país— así que sus filas no suman 100. Están enteras en «Ranking», en «Perfil» y en el CSV. «Ninguno» es una respuesta sustantiva (nadie es discriminado) y se muestra como tal. El indicador mide el grupo MÁS señalado, no cuántos grupos sufren discriminación. Sólo 2020: el menú de categorías se diseñó para esa ronda (incluía, por ejemplo, «inmigrantes de Venezuela»).',
  'c12-sources-png':    'Datos: Latinobarómetro 2020, pregunta P58ST (el grupo más discriminado, respuesta única). 18 países de América Latina, % ponderado sobre 16.752 respuestas válidas. 12 macrocategorías: recodeo propio de las 42 originales.',

  // ---- Etiquetas de las 12 macrocategorías (calzan con QUIEN_CATS)
  'qcat-pobres':          'Pobres',
  'qcat-raza_etnia':      'Raza o etnia',
  'qcat-migrantes':       'Migrantes',
  'qcat-lgbt':            'Personas LGBT',
  'qcat-edad':            'Edad (viejos/jóvenes)',
  'qcat-mujeres':         'Mujeres',
  'qcat-ideologia':       'Ideología política',
  'qcat-conducta':        'Conducta o estigma',
  'qcat-salud_discap':    'Salud o discapacidad',
  'qcat-religion_origen': 'Religión u origen',
  'qcat-ninguna':         'Ninguno',
  'qcat-otros':           'Otros'
});

Object.assign(I18N.en, {
  'g12-eyebrow':        'Who is the most discriminated against',
  'g12-lead':           'Which group each society names as the most discriminated against in its own country. See the same data three ways: the full table, the ranking of all 18 countries on one group, or the profile of one country.',
  'g12-view-ranking':   'Ranking',
  'g12-view-perfil':    'Profile',
  'g12-view-matriz':    'Matrix',

  'c12-title':          'In 14 of 18 countries the most-discriminated group is not racial: it is the poor',
  'c12-title-neutral':  'The most-discriminated group in each Latin American country',

  'c12-subtitle':            'Share who name Race or ethnicity as the most-discriminated group in the country. Each respondent chose a single answer. Latinobarómetro 2020, 18 countries.',
  'c12-subtitle-rank-tpl':   'Share who name {CAT} as the most-discriminated group in the country. Each respondent chose a single answer. Latinobarómetro 2020, 18 countries.',
  'c12-subtitle-perfil-tpl': 'Which group people in {PAIS} name as the most discriminated against in the country. Each respondent chose a single answer. Latinobarómetro 2020.',
  'c12-subtitle-matriz-tpl': 'Share who name each group as the most-discriminated one in their country. The eight most-named groups, with countries ordered by {CAT}. Latinobarómetro 2020.',

  'c12-cat-label':      'Group named',
  'c12-country-label':  'Country',
  'c12-refs-label':     'References',
  'c12-heat-hint':      'Tap a group name to sort the countries by that column',
  'c12-ref-median':     'Regional median',

  'c12-axis-x':         '% who name it as the most-discriminated group',
  'c12-median-lbl':     'Regional median',
  'c12-median-legend':  'Regional median',
  'c12-heat-legend':    '% who name it as the most discriminated',
  'c12-heat-box-note':  'The large, boxed number is the group that country names first.',

  'c12-tt-pct':         'Name it as the most discriminated',
  'c12-tt-top':         'Most-named group',
  'c12-tt-n':           'Sample',
  'c12-tt-incl':        'Original answers',
  'c12-tt-more-tpl':    'and {N} more',
  'c12-tt-above':       'Above the regional median.',
  'c12-tt-below':       'Below the regional median.',
  'c12-nodata':         '{PAIS} has no data for 2020.',

  'c12-detail-title':   'The detail: Latinobarómetro’s 42 original categories',
  'c12-detail-intro-tpl': 'Latinobarómetro offered 42 possible answers; we grouped them into 12 macro-categories (the recoding is ours, not Latinobarómetro’s). Here is how each macro breaks down into the original answers in {PAIS} (weighted % over valid answers):',

  'c12-sources':        'Data: Latinobarómetro 2020, question P58ST: “Which people or groups do you think are the most discriminated against in the country?” — SINGLE answer (each respondent named one group only). 18 Latin American countries, national samples of ~1,000-1,200; weighted % (wt) over 16,752 valid answers (82.9% of 20,204; 17.1% don’t know or no answer). The original menu had 42 categories: we grouped them into 12 macro-categories (the recoding is ours, not Latinobarómetro’s; the full 42 are in the “Profile” tab). The “Matrix” tab draws the eight most-named macro-categories; political ideology, behaviour or stigma, health or disability and religion or origin are not there —none of them is the most-named group in any country— so its rows do not add up to 100. They are all in “Ranking”, in “Profile” and in the CSV. “None” is a substantive answer (no group is discriminated against) and is shown as such. The indicator measures the MOST-named group, not how many groups face discrimination. 2020 only: the category menu was designed for that round (it included, for example, “Venezuelan immigrants”).',
  'c12-sources-png':    'Data: Latinobarómetro 2020, question P58ST (the most-discriminated group, single answer). 18 Latin American countries, weighted % over 16,752 valid answers. 12 macro-categories: our recode of the 42 originals.',

  'qcat-pobres':          'The poor',
  'qcat-raza_etnia':      'Race or ethnicity',
  'qcat-migrantes':       'Migrants',
  'qcat-lgbt':            'LGBT people',
  'qcat-edad':            'Age (old / young)',
  'qcat-mujeres':         'Women',
  'qcat-ideologia':       'Political ideology',
  'qcat-conducta':        'Behavior or stigma',
  'qcat-salud_discap':    'Health or disability',
  'qcat-religion_origen': 'Religion or origin',
  'qcat-ninguna':         'None',
  'qcat-otros':           'Others'
});
