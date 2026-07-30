// =============================================================
//  Strings del chart 18 — "Intolerancia y desarrollo" (chart-desarrollo.html)
// =============================================================
// Se carga DESPUÉS de i18n-issue.js (que define I18N) y ANTES de desarrollo.js.
// NO toca i18n-issue.js: ese archivo lo comparten todos los charts del número.
//
// Los nombres de las 25 variables del eje Y NO están acá: salen de CR_VARS[] en
// data-cruces.js, que es la única fuente de verdad del menú. De ahí salen tres
// formas distintas del mismo indicador, y cada una tiene su lugar:
//   .es/.en          rótulo corto del menú          "Personas de otra raza"
//   .titulo_es/_en   forma de título, minúscula     "rechazo a vecinos de otra raza"
//   .def_es/_en      definición completa            "% que menciona a «personas…"
//
// ARQUITECTURA DE TEXTOS (criterio OWID, decisión de Daniel 2026-07-30): tres
// capas y ninguna repite a la otra.
//   TÍTULO     el hallazgo, cuando el estado del gráfico lo sostiene.
//   SUBTÍTULO  QUÉ se mide y CUÁNDO. Nunca el número del hallazgo (ése vive en
//              el banner) ni "cada punto es un país" (eso es la nota).
//   FUENTE     de dónde salen los datos y la letra chica.
(function () {
  if (typeof I18N === 'undefined') return;

  Object.assign(I18N.es, {
    'c18-eyebrow': 'Intolerancia y desarrollo',

    // ---------- Título ----------
    // EDITORIAL: se arma con la forma de título de la variable elegida, así que
    // vale para las 14 categorías de la batería de vecinos y no sólo para la
    // racial. Sólo aparece cuando el gráfico realmente lo muestra: categoría de
    // la batería, foto por default y América Latina POR DEBAJO de lo previsto
    // (ver dv_updateTitle). Conserva el verbo DECLARA, que es la advertencia
    // central del número.
    'c18-title-tpl':         'América Latina declara menos {VAR} del que predice su ingreso',
    // NEUTRAL: nombra la MEDICIÓN, no el tema. "Intolerancia declarada" no
    // decía qué se estaba midiendo cuando el lector cambiaba de categoría
    // (mismo reporte que en el chart 19).
    'c18-title-neutral-tpl': '{VAR} y PIB per cápita',
    // Fallbacks estáticos: los pinta applyI18n antes del primer render y los usa
    // la tarjeta del índice del número.
    'c18-title':         'América Latina declara menos rechazo a vecinos de otra raza del que predice su ingreso',
    'c18-title-neutral': 'Intolerancia declarada y PIB per cápita',

    // ---------- Subtítulo ----------
    // Define el indicador y fecha la foto. El residuo de América Latina SALIÓ
    // de acá: lo dice el título cuando corresponde, y el número exacto está en
    // el banner; repetirlo en las tres capas era la redundancia que marcó
    // Daniel ("América Latina queda 10 pp por debajo… Eje vertical:… Eje
    // horizontal:…" decía tres veces lo mismo).
    'c18-subtitle': 'Porcentaje que menciona a personas de otra raza entre los grupos que no querría de vecinos, y PIB per cápita.',
    // {CAT} = rótulo del menú en minúscula; {DEF} = definición corta; {CUANDO} =
    // fecha de la foto. La batería tiene plantilla propia porque su definición
    // es una sola para las 14 categorías.
    'c18-subtitle-vec-tpl': 'Porcentaje que menciona a {CAT} entre los grupos que no querría de vecinos, y PIB per cápita. {CUANDO}',
    'c18-subtitle-tpl':     '{DEF}, y PIB per cápita. {CUANDO}',
    // Con la última ola la foto ES el último dato de cada país; con una ola
    // vieja no, y decirlo sería falso. {Y} = rango REAL de años de campo.
    'c18-when-last': 'Último dato por país, {Y}.',
    'c18-when-wave': 'Encuestas de {Y}.',

    'c18-var-label':      'Indicador (eje vertical)',
    'c18-grp-vecinos':    'Batería de vecinos',
    'c18-grp-otras':      'Otras preguntas',
    'c18-grp-wrp':        'Discriminación vivida (otra encuesta)',
    'c18-sources-wrp':    ' <strong>Ojo</strong>: «sufrió discriminación por su color de piel» es la única variable del menú que no sale de la Integrated Values Survey. Viene del World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 países, CC BY 4.0) y mide experiencia propia y de por vida, no una opinión sobre terceros. Sus puntos son de 2023 y se cruzan con el PIB per cápita de 2022, el último año de Maddison.',
    'c18-scale-label':    'Escala del PIB',
    'c18-scale-log':      'Logarítmica',
    'c18-scale-linear':   'Lineal',
    'c18-model-label':    'Ajuste',
    'c18-model-linear':   'Recta',
    'c18-model-quad':     'Curva',
    'c18-wave-label':     'Ola de la encuesta',
    'c18-play':           'Recorrer las olas',
    'c18-search-ph':      'Agregar país…',
    'c18-select-hint':    'Los países elegidos son los que quedan etiquetados en el gráfico.',

    'c18-axis-x-log':     'PIB per cápita (dólares internacionales de 2011, PPA) — escala logarítmica',
    'c18-axis-x-linear':  'PIB per cápita (dólares internacionales de 2011, PPA)',
    'c18-axis-y-suffix':  ' (%)',

    // Banner + tira de estadísticos adentro del SVG. Mismo set que el N°2
    // (países, R² y el residuo de la región enfocada). La PENDIENTE se sacó:
    // «pp por cada ×10 de PIB» es jerga y el N°2 nunca la mostró.
    'c18-banner-n':       'Países',
    'c18-banner-r2':      'R²',
    'c18-banner-resid':   'Residuo',
    'c18-banner-resid-note': 'respecto de lo previsto',
    'c18-banner-none':    'sin países de esta región en la ola elegida',
    'c18-banner-hint':    'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla del ajuste.',
    'c18-show-all':       'Ver todas las regiones',
    'c18-strip-resid-tpl': '{REG}: {V} respecto de lo previsto',
    'c18-fewfit':         'Muy pocos países para estimar un ajuste.',
    'c18-nodata':         'No hay datos suficientes para esta combinación de indicador y ola.',

    // El rótulo de la primera fila del tooltip es el nombre del indicador
    // (CR_VARS[].es/en), así que no hay clave 'valor' genérica.
    'c18-tt-year':        'Año de la encuesta',
    'c18-tt-n':           'Casos',
    'c18-tt-gdp':         'PIB per cápita',
    'c18-tt-expected':    'Predicho por su ingreso',
    'c18-tt-resid':       'Residuo',
    'c18-tt-resid-above': 'por encima de la recta',
    'c18-tt-resid-below': 'por debajo de la recta',

    // ---------- Fuentes ----------
    // Nombre unificado en todo el número: "Integrated Values Survey (WVS/EVS)".
    // Fuera la advertencia causal: no la usamos en ningún otro chart y ocupaba
    // dos renglones (decisión de Daniel 2026-07-30).
    'c18-sources': 'Datos: Integrated Values Survey (WVS/EVS, 1981-2022) para el eje vertical y Maddison Project Database 2023 —vía Our World in Data— para el PIB per cápita en dólares internacionales de 2011 (PPA). Cada punto es un país en una ola de la encuesta; el porcentaje es ponderado (S017) y se descartan las celdas con menos de 8 países, que no son una regresión. <strong>Cada país se cruza con el PIB de su propio año de trabajo de campo, y dentro de una misma ola los países salieron a campo en años distintos</strong>: en la ola 2017-2022, Argentina midió en 2017 y Uruguay en 2022. Si falta ese año exacto, el PIB se toma del más cercano dentro de ±3 años (el tooltip muestra siempre el año real); los países sin dato de Maddison —Andorra, Macao, Maldivas, Irlanda del Norte, Kosovo y el norte de Chipre— no aparecen, no se interpola nada. El ajuste se estima siempre sobre el logaritmo del PIB per cápita (el toggle de escala cambia el eje, no el modelo) y el residuo de una región es el promedio, en puntos porcentuales, de la diferencia entre lo que declara cada país y lo que la recta predice para su ingreso. Dos advertencias sobre el menú: «Desconfía de la gente en general» es el complemento exacto del clásico «se puede confiar en la mayoría» (el ítem tiene solo esas dos opciones), y en «Enseña tolerancia a sus hijos» más es <em>mejor</em>, al revés que en el resto, así que ahí el residuo se lee al revés. «Personas con antecedentes penales» y «personas emocionalmente inestables» dejaron de preguntarse después de la ola 2005-2010; musulmanes, judíos y gitanos solo se preguntan en Europa, así que en la última ola no hay ningún país de América Latina. Mide actitudes <em>declaradas</em> ante un encuestador.',
    'c18-sources-png': 'Datos: Integrated Values Survey (WVS/EVS) y Maddison Project Database. Cada punto es un país, cruzado con el PIB de su propio año de encuesta. El ajuste se estima sobre el logaritmo del PIB per cápita.',
    'c18-sources-png-ext': 'Datos: World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup) y Maddison Project Database. Cada punto es un país. El World Risk Poll pregunta por experiencia PROPIA de discriminación por el color de piel, alguna vez en la vida: no es una opinión sobre terceros, y sale de otra encuesta que el resto del número. Sus datos son de 2023 y se cruzan con el PIB de 2022, el último de Maddison. El ajuste se estima sobre el logaritmo del PIB.',
  });

  Object.assign(I18N.en, {
    'c18-eyebrow': 'Intolerance and development',

    'c18-title-tpl':         'Latin America reports less {VAR} than its income predicts',
    'c18-title-neutral-tpl': '{VAR} and GDP per capita',
    'c18-title':         'Latin America reports less rejection of neighbours of another race than its income predicts',
    'c18-title-neutral': 'Declared intolerance and GDP per capita',

    'c18-subtitle': 'Share who mention people of a different race among the groups they would not want as neighbours, and GDP per capita.',
    'c18-subtitle-vec-tpl': 'Share who mention {CAT} among the groups they would not want as neighbours, and GDP per capita. {CUANDO}',
    'c18-subtitle-tpl':     '{DEF}, and GDP per capita. {CUANDO}',
    'c18-when-last': 'Latest data per country, {Y}.',
    'c18-when-wave': 'Surveys from {Y}.',

    'c18-var-label':      'Indicator (vertical axis)',
    'c18-grp-vecinos':    'Neighbours battery',
    'c18-grp-otras':      'Other questions',
    'c18-grp-wrp':        'Experienced discrimination (another survey)',
    'c18-sources-wrp':    ' <strong>Note</strong>: “has experienced discrimination over skin colour” is the only variable in the menu that does not come from the Integrated Values Survey. It comes from the World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup, 139 countries, CC BY 4.0) and measures first-person, lifetime experience, not an opinion about others. Its dots are from 2023 and are matched with 2022 GDP per capita, the last year in Maddison.',
    'c18-scale-label':    'GDP scale',
    'c18-scale-log':      'Logarithmic',
    'c18-scale-linear':   'Linear',
    'c18-model-label':    'Fit',
    'c18-model-linear':   'Line',
    'c18-model-quad':     'Curve',
    'c18-wave-label':     'Survey wave',
    'c18-play':           'Play the waves',
    'c18-search-ph':      'Add country…',
    'c18-select-hint':    'The chosen countries are the ones labelled on the chart.',

    'c18-axis-x-log':     'GDP per capita (2011 international dollars, PPP) — log scale',
    'c18-axis-x-linear':  'GDP per capita (2011 international dollars, PPP)',
    'c18-axis-y-suffix':  ' (%)',

    'c18-banner-n':       'Countries',
    'c18-banner-r2':      'R²',
    'c18-banner-resid':   'Residual',
    'c18-banner-resid-note': 'vs. what its income predicts',
    'c18-banner-none':    'no countries from this region in the selected wave',
    'c18-banner-hint':    'Hover a region in the legend to reveal its country names; click (or tap) to switch it off and drop it from the fit.',
    'c18-show-all':       'Show all regions',
    'c18-strip-resid-tpl': '{REG}: {V} vs. what its income predicts',
    'c18-fewfit':         'Too few countries to estimate a fit.',
    'c18-nodata':         'Not enough data for this combination of indicator and wave.',

    'c18-tt-year':        'Survey year',
    'c18-tt-n':           'Cases',
    'c18-tt-gdp':         'GDP per capita',
    'c18-tt-expected':    'Predicted by its income',
    'c18-tt-resid':       'Residual',
    'c18-tt-resid-above': 'above the line',
    'c18-tt-resid-below': 'below the line',

    'c18-sources': 'Data: Integrated Values Survey (WVS/EVS, 1981-2022) for the vertical axis and the Maddison Project Database 2023 —via Our World in Data— for GDP per capita in 2011 international dollars (PPP). Each dot is a country in one survey wave; the share is weighted (S017) and cells with fewer than 8 countries are dropped, since they are not a regression. <strong>Each country is matched with the GDP of its own fieldwork year, and within a single wave countries were surveyed in different years</strong>: in the 2017-2022 wave Argentina was surveyed in 2017 and Uruguay in 2022. If that exact year is missing, GDP is taken from the nearest year within ±3 years (the tooltip always shows the actual year); countries with no Maddison reading —Andorra, Macao, the Maldives, Northern Ireland, Kosovo and Northern Cyprus— are absent, nothing is interpolated. The fit is always estimated on the logarithm of GDP per capita (the scale toggle changes the axis, not the model), and a region’s residual is the average, in percentage points, of the gap between what each country reports and what the line predicts for its income. Two warnings about the menu: “distrusts people in general” is the exact complement of the classic “most people can be trusted” (the item has only those two options), and in “teaches tolerance to their children” more is <em>better</em>, unlike the rest, so there the residual reads the other way round. “People with a criminal record” and “emotionally unstable people” stopped being asked after the 2005-2010 wave; Muslims, Jews and Gypsies are only asked in Europe, so in the latest wave there is no Latin American country at all. This measures attitudes <em>declared</em> to an interviewer.',
    'c18-sources-png': 'Data: Integrated Values Survey (WVS/EVS) and the Maddison Project Database. Each dot is a country, matched with the GDP of its own survey year. The fit is estimated on the logarithm of GDP per capita.',
    'c18-sources-png-ext': 'Data: World Risk Poll 2023 (Lloyd’s Register Foundation / Gallup) and the Maddison Project Database. One dot per country. The World Risk Poll asks about FIRST-PERSON, lifetime experience of discrimination over skin colour: it is not an opinion about others, and it comes from a different survey than the rest of the issue. Its data are from 2023 and are matched with 2022 GDP, the last year in Maddison. The fit is estimated on log GDP.',
  });
})();
