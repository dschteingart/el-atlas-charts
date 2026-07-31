// Strings del N°4 · CHART 12 «¿Quién es el más discriminado?» (Latinobarómetro 2020).
// Se carga DESPUÉS de i18n-issue.js (que define I18N/LANG/t) y ANTES de quien.js.
// NO redefine I18N: extiende las claves con Object.assign (los otros agentes editan
// i18n-issue.js en paralelo; acá sólo agrego mis c12-* y qcat-*).

Object.assign(I18N.es, {
  // ---- Shell del graficador (encabezado + pestañas de vista, lib/grapher.js)
  // La bajada de la página salió del HTML: era la cuarta capa de texto y decía
  // lo que ya dicen el título y los nombres de las pestañas.
  'g12-eyebrow':        'Quién es el más discriminado',
  'g12-view-ranking':   'Ranking',
  'g12-view-perfil':    'Perfil',
  'g12-view-matriz':    'Matriz',

  // ---- Títulos. El EDITORIAL es de la Matriz: es la única vista donde el
  // hallazgo se ve —las 18 filas juntas— y sus dos números los calcula el JS
  // (qn_conteoLideres), así que no pueden quedar desfasados del dibujo. En el
  // Ranking (una columna) y en el Perfil (una fila) el título nombra la
  // MEDICIÓN, que es lo que ahí está en pantalla.
  // El titular dice CREEN. Sin ese verbo, "el grupo más discriminado" se lee
  // como una medición de discriminación, y es otra cosa: es a quién señala la
  // gente. Mismo cuidado que el "declara" del chart 18. Medido contra el canvas
  // del PNG: 92 caracteres entran en dos líneas; a partir de ~95 se va a tres.
  // El JS sólo lo usa si "los pobres" gana de verdad en la mayoría de los
  // países (qn_conteoLideres); si no, cae al descriptivo.
  'c12-title-tpl':          'En gran parte de América Latina, las personas creen que los más discriminados son los pobres',
  'c12-title-neutral':      'El grupo más discriminado en cada país de América Latina',
  'c12-title-rank-tpl':     'Quién nombra a {CAT} como el más discriminado de su país',
  'c12-title-rank-ninguna': 'Quién dice que en su país no hay ningún grupo discriminado',
  'c12-title-perfil-tpl':   'El grupo más discriminado según la gente de {PAIS}',

  // ---- Subtítulos: estático (default, por si el editor restaura el data-i18n)
  // + dinámicos que el JS rellena según vista/categoría/país.
  // Subtítulos: qué se mide y cuándo. «Una sola respuesta por persona» SÍ va
  // acá —no es aritmética, es qué se midió—: sin eso el lector lee las columnas
  // como porcentajes independientes («el 25% dice que los pobres sufren
  // discriminación») y el dato es otro («puesto a elegir uno, el 25% eligió a
  // los pobres»). Salieron «cada fila suma 100», «países ordenados por X» (lo
  // dice la flecha del encabezado) y «18 países» (está en la nota).
  'c12-subtitle':            'Porcentaje que nombra a cada grupo como el más discriminado del país, en 2020.',
  'c12-subtitle-rank-tpl':   'Porcentaje que nombra a {CAT} como el más discriminado del país, en 2020.',
  'c12-subtitle-rank-ninguna': 'Porcentaje que dice que en su país no hay ningún grupo discriminado, en 2020.',
  'c12-subtitle-perfil-tpl': 'Porcentaje que nombra a cada grupo como el más discriminado del país, en 2020.',
  'c12-subtitle-matriz':     'Porcentaje que nombra a cada grupo como el más discriminado del país, en 2020.',

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
  'c12-heat-box-note':  'En cada fila, el número destacado es el grupo que ese país señala primero.',

  // ---- Tooltip
  'c12-tt-pct':         'Lo nombran como el más discriminado',
  'c12-tt-top':         'Grupo más señalado',
  'c12-tt-n':           'Muestra',
  'c12-tt-incl':        'Respuestas originales',
  'c12-tt-resto-incl':  'Incluye',
  'c12-tt-more-tpl':    'y {N} más',
  'c12-tt-above':       'Por encima de la mediana regional.',
  'c12-tt-below':       'Por debajo de la mediana regional.',
  'c12-nodata':         '{PAIS} no tiene datos en 2020.',

  // ---- Detalle de las 42 categorías crudas (vista perfil)
  'c12-detail-title':   'El detalle: las 42 categorías originales del Latinobarómetro',
  'c12-detail-intro-tpl': 'El Latinobarómetro ofrecía 42 respuestas posibles; nosotros las agrupamos en 12 macrocategorías (el recodeo es nuestro, no del Latinobarómetro). Así se reparte cada macro entre las respuestas originales en {PAIS} (% ponderado sobre respuestas válidas):',

  // ---- Fuentes / metodología
  'c12-sources':        'Datos: Latinobarómetro 2020, pregunta P58ST: «¿Cuáles cree Ud. que son las personas o grupos más discriminados en el país?». Es de <strong>respuesta única</strong>: cada persona nombró un solo grupo, así que los porcentajes de un país suman 100. 18 países de América Latina, % ponderado (wt) sobre 16.752 respuestas válidas; el 17,1% no sabe o no responde. Las 42 categorías originales están agrupadas en 12 macrocategorías —el recodeo es nuestro, no del Latinobarómetro— y se ven una por una en «Ranking», en «Perfil» y en el CSV. La «Matriz» dibuja ocho columnas: las seis más nombradas, «Ninguno» y un «Otros» que ahí suma además ideología política, conducta o estigma, salud o discapacidad y religión u origen. «Ninguno» es una respuesta sustantiva: nadie es discriminado. Mide a quién <em>señala</em> la gente, no quién sufre más discriminación, y sólo hay 2020: el menú de categorías se diseñó para esa ronda.',
  'c12-sources-png':    'Datos: Latinobarómetro (2020). Cada persona nombró un solo grupo, el que considera más discriminado en su país. Las categorías son un recodeo propio de las 42 originales.',
  // La matriz necesita su propia nota corta: es la única vista donde la fila
  // suma 100 y la única que agrupa cuatro macros dentro de «Otros».
  'c12-sources-png-matriz': 'Datos: Latinobarómetro (2020). Cada persona nombró un solo grupo. En negrita, el más señalado de cada país; «Otros» agrupa ideología, conducta, salud o discapacidad y religión u origen.',

  // ---- Etiquetas de las 12 macrocategorías (calzan con QUIEN_CATS)
  // ---- Forma de FRASE de cada macrocategoría (qcatf-*), la que entra en una
  // oración: «Quién nombra a LOS POBRES como el más discriminado». El rótulo del
  // menú (qcat-*) es una etiqueta y suelto en un título no concuerda («a
  // pobres», «a mujeres»). Mismo desdoblamiento que titulo_es en los charts 18
  // y 19. «Ninguno» no tiene forma de frase: su título y su subtítulo son
  // propios, porque no es un grupo.
  'qcatf-pobres':          'los pobres',
  'qcatf-raza_etnia':      'un grupo racial o étnico',
  'qcatf-migrantes':       'los migrantes',
  'qcatf-lgbt':            'las personas LGBT',
  'qcatf-edad':            'los viejos o los jóvenes',
  'qcatf-mujeres':         'las mujeres',
  'qcatf-ideologia':       'quienes piensan distinto',
  'qcatf-conducta':        'un grupo estigmatizado por su conducta',
  'qcatf-salud_discap':    'las personas con problemas de salud o discapacidad',
  'qcatf-religion_origen': 'un grupo religioso o de otro origen',
  'qcatf-otros':           'otro grupo',

  // ---- Encabezados de la MATRIZ (qcats-*). Van rotados 45°, así que la
  // etiqueta más larga cuesta margen derecho Y superior: "Edad (viejos/jóvenes)"
  // se comía 198 px de ancho del dibujo. Sólo se acortan las dos que hacían
  // falta; el resto cae al rótulo del menú, y el nombre completo sigue estando
  // en el tooltip y en las otras dos pestañas.
  'qcats-lgbt':           'LGBT',
  'qcats-edad':           'Edad',

  // ---- Etiquetas del menú (calzan con QUIEN_CATS)
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
  'g12-view-ranking':   'Ranking',
  'g12-view-perfil':    'Profile',
  'g12-view-matriz':    'Matrix',

  'c12-title-tpl':          'In much of Latin America, people believe the most discriminated against are the poor',
  'c12-title-neutral':      'The most-discriminated group in each Latin American country',
  'c12-title-rank-tpl':     'Who names {CAT} as the most discriminated against in their country',
  'c12-title-rank-ninguna': 'Who says no group is discriminated against in their country',
  'c12-title-perfil-tpl':   'The most-discriminated group according to people in {PAIS}',

  'c12-subtitle':            'Share who name each group as the most-discriminated one in the country, in 2020.',
  'c12-subtitle-rank-tpl':   'Share who name {CAT} as the most discriminated against in the country, in 2020.',
  'c12-subtitle-rank-ninguna': 'Share who say no group is discriminated against in their country, in 2020.',
  'c12-subtitle-perfil-tpl': 'Share who name each group as the most-discriminated one in the country, in 2020.',
  'c12-subtitle-matriz':     'Share who name each group as the most-discriminated one in the country, in 2020.',

  'c12-cat-label':      'Group named',
  'c12-country-label':  'Country',
  'c12-refs-label':     'References',
  'c12-heat-hint':      'Tap a group name to sort the countries by that column',
  'c12-ref-median':     'Regional median',

  'c12-axis-x':         '% who name it as the most-discriminated group',
  'c12-median-lbl':     'Regional median',
  'c12-median-legend':  'Regional median',
  'c12-heat-legend':    '% who name it as the most discriminated',
  'c12-heat-box-note':  'In each row, the highlighted number is the group that country names first.',

  'c12-tt-pct':         'Name it as the most discriminated',
  'c12-tt-top':         'Most-named group',
  'c12-tt-n':           'Sample',
  'c12-tt-incl':        'Original answers',
  'c12-tt-resto-incl':  'Includes',
  'c12-tt-more-tpl':    'and {N} more',
  'c12-tt-above':       'Above the regional median.',
  'c12-tt-below':       'Below the regional median.',
  'c12-nodata':         '{PAIS} has no data for 2020.',

  'c12-detail-title':   'The detail: Latinobarómetro’s 42 original categories',
  'c12-detail-intro-tpl': 'Latinobarómetro offered 42 possible answers; we grouped them into 12 macro-categories (the recoding is ours, not Latinobarómetro’s). Here is how each macro breaks down into the original answers in {PAIS} (weighted % over valid answers):',

  'c12-sources':        'Data: Latinobarómetro 2020, question P58ST: “Which people or groups do you think are the most discriminated against in the country?”. It is a <strong>single-answer</strong> question: each respondent named one group only, so a country’s shares add up to 100. 18 Latin American countries, weighted % (wt) over 16,752 valid answers; 17.1% don’t know or no answer. The 42 original categories are grouped into 12 macro-categories —the recoding is ours, not Latinobarómetro’s— and each one is shown separately in “Ranking”, in “Profile” and in the CSV. The “Matrix” draws eight columns: the six most-named ones, “None”, and an “Others” that there also adds up political ideology, behaviour or stigma, health or disability and religion or origin. “None” is a substantive answer: no group is discriminated against. This measures who people <em>name</em>, not who suffers the most discrimination, and 2020 is the only round: the category menu was designed for it.',
  'c12-sources-png':    'Data: Latinobarómetro (2020). Each respondent named a single group, the one they consider most discriminated against in their country. The categories are our recode of the 42 originals.',
  'c12-sources-png-matriz': 'Data: Latinobarómetro (2020). Each respondent named a single group. In bold, the group each country names first; “Others” bundles ideology, behaviour, health or disability and religion or origin.',

  'qcatf-pobres':          'the poor',
  'qcatf-raza_etnia':      'a racial or ethnic group',
  'qcatf-migrantes':       'migrants',
  'qcatf-lgbt':            'LGBT people',
  'qcatf-edad':            'the old or the young',
  'qcatf-mujeres':         'women',
  'qcatf-ideologia':       'people who think differently',
  'qcatf-conducta':        'a group stigmatised for its behaviour',
  'qcatf-salud_discap':    'people with health problems or disabilities',
  'qcatf-religion_origen': 'a religious group or one of another origin',
  'qcatf-otros':           'another group',

  'qcats-lgbt':           'LGBT',
  'qcats-edad':           'Age',

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
