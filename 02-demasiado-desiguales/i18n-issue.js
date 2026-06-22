// Strings específicos del N°2 + helpers de i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según los charts que tenga.

//==================================================================
//  I18N — específico del N°2 "Demasiado desiguales"
//==================================================================
const ISSUE_I18N = {
  es: {
    'issue-num':  'N° 2',
    'page-title': '¿Es América Latina realmente la región más desigual del mundo?',
    'page-lede':  'La excepcionalidad latinoamericana en desigualdad existe, pero no donde solemos creer.',

    // Chart 1 — Marimekko ranking Gini
    'c1-title':            'El ranking mundial de la desigualdad',
    'c1-subtitle-raw':     'Coeficiente de Gini por país, tal como aparece en las fuentes originales: América Latina por encima de África Subsahariana. Cada barra es un país y el color muestra su región.',
    'c1-subtitle-adj':     'Gini comparable por método de medición: los Ginis de consumo se multiplican por 1,13 para aproximarlos a Ginis de ingreso. Con este ajuste, África Subsahariana queda por encima de América Latina. Cada barra es un país y el color muestra su región.',
    'c1-toggle-label':     'Medición',
    'c1-toggle-raw':       'Gini original',
    'c1-toggle-adj':       'Gini ajustado',
    'c1-axis-y':           'Gini',
    'c1-tt-year':          'Año del dato',
    'c1-tt-welfare':       'Medición',
    'c1-tt-gini-raw':      'Gini original',
    'c1-tt-gini-adj':      'Gini ajustado',
    'c1-tt-welfare-income':      'Ingreso',
    'c1-tt-welfare-consumption': 'Consumo',
    'c1-avg-prefix':       'Promedio regional',
    'c1-avg-table-title':  'Gini promedio por región',

    // Chart 2 — Scatter Gini vs PIB
    // El subtítulo es dinámico: cambia con el año, modo (raw/adj) y modelo
    // (linear/quadratic) activos. Las versiones "-more"/"-less" son para
    // residuo positivo (Latam más desigual de lo esperado) o negativo
    // (improbable, pero por las dudas).
    'c2-title':              'América Latina es demasiado desigual para su nivel de desarrollo',
    'c2-subtitle-tpl-more':  'América Latina es {N}% más desigual de lo esperado para su nivel de desarrollo.',
    'c2-subtitle-tpl-less':  'América Latina es {N}% menos desigual de lo esperado para su nivel de desarrollo.',
    'c2-toggle-model-label': 'Modelo',
    'c2-toggle-linear':      'Lineal',
    'c2-toggle-quadratic':   'Cuadrática',
    'c2-toggle-gini-label':  'Gini',
    'c2-toggle-gini-raw':    'Original',
    'c2-toggle-gini-adj':    'Ajustado',
    'c2-toggle-scale-label': 'Escala X',
    'c2-toggle-scale-log':   'Log',
    'c2-toggle-scale-linear':'Lineal',
    'c2-axis-x-log':         'PIB per cápita PPP (USD const. 2021, escala log)',
    'c2-axis-x-linear':      'PIB per cápita PPP (USD constantes 2021)',
    'c2-axis-y-raw':         'Gini original',
    'c2-axis-y-adj':         'Gini ajustado',
    'c2-banner-n':           'N',
    'c2-banner-r2':          'R²',
    'c2-banner-residual':    'Residuo',
    'c2-banner-region':      'Residuo',
    'c2-tt-gdp':             'PIB pc PPP',
    'c2-tt-gini-raw':        'Gini original',
    'c2-tt-gini-adj':        'Gini ajustado',
    'c2-tt-residual-pp':     'Residuo (pp)',
    'c2-tt-residual-pct':    'Residuo (%)',
    'c2-tt-year':            'Año del dato',
    'c2-search-placeholder': 'Buscar país…',

    // Chart 4 — Ranking de ingreso por decil
    'c4-title':                  'El ingreso por decil, país por país',
    'c4-subtitle':               'Ingreso promedio del decil elegido, US$ PPA, por país.',
    'c4-view-bars':              'Barras',
    'c4-view-map':               'Mapa',
    'c4-view-lines':             'Líneas',
    'c4-deciles-label':          'Deciles',
    'c4-unit-label':             'Unidad',
    'c4-unit-day':               'Día',
    'c4-unit-month':             'Mes',
    'c4-unit-year':              'Año',
    'c4-scale-label':            'Escala',
    'c4-scale-linear':           'Lineal',
    'c4-scale-log':              'Log',
    'c4-bench-label':            'Comparar vs',
    'c4-map-classic':            'Clásico',
    'c4-map-bench':              'Comparar vs',
    'c4-continent-label':        'Zoom',
    'c4-cont-all':               'Mundo',
    'c4-cont-america':           'América',
    'c4-cont-europe':            'Europa',
    'c4-cont-africa':            'África',
    'c4-cont-asia':              'Asia',
    'c4-cont-oceania':           'Oceanía',
    'c4-period-label':           'Período',
    'c4-search-placeholder':     'Agregar país…',
    'c4-bench-placeholder':      'Comparar contra…',
    'c4-map-hint':               'Hacé clic en un país del mapa (o buscalo arriba) para elegir el país de comparación.',
    'c4-tag-max':                'máx',
    'c4-tag-min':                'mín',
    'c4-empty':                  'Sin datos para este año.',
    'c4-empty-lines':            'Elegí al menos un país.',
    'c4-sources':                'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Ingreso por decil en US$ PPA por persona; media nacional interpolada por año.',

    // Chart 3 — Deciles
    'c3-title':                  'Las élites cerca, los pobres lejos',
    'c3-subtitle':               'El ingreso de los hogares ricos de América Latina se acerca al de Europa. El de los hogares pobres, no.',
    'c3-toggle-y-label':         'Eje Y',
    'c3-toggle-income':          'Ingreso PPP/día',
    'c3-toggle-percentile':      'Percentil mundial',
    'c3-toggle-scale-label':     'Escala',
    'c3-toggle-scale-linear':    'Lineal',
    'c3-toggle-scale-log':       'Log',
    'c3-axis-x':                 'Decil',
    'c3-decile-prefix':          'Decil',
    'c3-decile-poorest':         '(10% más pobre)',
    'c3-decile-richest':         '(10% más rico)',
    'c3-axis-y-income':          'Ingreso per cápita familiar (USD PPP/día)',
    'c3-axis-y-percentile':      'Percentil de la distribución mundial',
    'c3-search-placeholder':     'Buscar país…',
    'c3-tt-decile':              'Decil',
    'c3-tt-income':              'Ingreso PPP/día',
    'c3-tt-percentile':          'Percentil mundial',
    'c3-tt-year-obs':            'Año de la encuesta',
    // Captions específicos del PNG por modo (vía hook). El interactivo usa
    // el c3-sources general del footer.
    'c3-sources-income':         'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Para cada país, la distribución del ingreso por decil corresponde a su última encuesta dentro de los 15 años previos al año mostrado. Los valores en USD PPP/día se reescalan con la media nacional interpolada para ese año. En algunos países la encuesta mide consumo en lugar de ingreso; ambas mediciones se muestran como "ingreso" para fines comparativos.',
    'c3-sources-percentile':     'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). El percentil mundial de cada decil se calcula ordenando todos los decil-país del mundo por ingreso (USD PPP/día) y acumulando población. Para cada país, los deciles corresponden a su última encuesta dentro de los 15 años previos al año mostrado. En algunos países la encuesta mide consumo en lugar de ingreso; ambas mediciones se muestran como "ingreso" para fines comparativos.',

    // Slider temporal (compartido charts 1 y 2)
    'slider-year-label':         'Año',
    'slider-play':               'Reproducir',
    'slider-pause':              'Pausar',

    // Controles mobile: botones tuerca + "Seleccionar" que pliegan
    // toggles + buscador detrás de un tap (estilo OWID). Solo visibles en
    // pantallas ≤ 768px; en desktop los controles se ven inline.
    'ctrl-options':              'Opciones',
    'ctrl-select':               'Seleccionar',
    // Colapsables mobile: la nota metodológica y la tabla de promedios
    // regionales (chart 1) quedan detrás de un toggle en pantallas ≤768px
    // para liberar espacio vertical para el SVG.
    'ctrl-show-method':          'Ver metodología y fuentes',
    'c1-show-avg-table':         'Ver promedios regionales',

    // Nombres traducidos de las 7 regiones del Banco Mundial.
    // Convención: puntos cardinales en mayúscula cuando forman parte del
    // nombre regional ("América del Norte", "Asia del Sur", "Asia Oriental",
    // "Norte de África") por uniformidad.
    'reg.Latin America & Caribbean':                          'América Latina y el Caribe',
    'reg.Sub-Saharan Africa':                                 'África Subsahariana',
    'reg.Europe & Central Asia':                              'Europa y Asia Central',
    'reg.East Asia & Pacific':                                'Asia Oriental y Pacífico',
    'reg.South Asia':                                         'Asia del Sur',
    'reg.Middle East, North Africa, Afghanistan & Pakistan':  'Medio Oriente y Norte de África',
    'reg.North America':                                      'América del Norte',

    // Versiones cortas para labels de líneas regionales en el marimekko
    'reg-short.Latin America & Caribbean':                          'Latam y Caribe',
    'reg-short.Sub-Saharan Africa':                                 'África Subsahariana',
    'reg-short.Europe & Central Asia':                              'Europa y Asia Central',
    'reg-short.East Asia & Pacific':                                'Asia Oriental',
    'reg-short.South Asia':                                         'Asia del Sur',
    'reg-short.Middle East, North Africa, Afghanistan & Pakistan':  'Medio Oriente',
    'reg-short.North America':                                      'América del Norte',

    // Footer-sources por chart (específicas de los datasets que usa cada uno)
    'c1-sources': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Para cada año del slider, se muestra el último Gini observado de cada país dentro de los 15 años previos. <strong>Gini original</strong>: medición tal como la reporta cada país (ingreso o consumo). <strong>Gini ajustado</strong>: el Gini de consumo se multiplica por 1,13, convención del Banco Mundial para hacerlo comparable al de ingreso.',
    // Versiones específicas por modo, usadas en el PNG (donde solo se ve un modo)
    'c1-sources-raw': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Para cada año, se muestra el último Gini observado de cada país dentro de los 15 años previos. Medición tal como la reporta cada país: por ingreso o por consumo, sin ajuste.',
    'c1-sources-adj': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Para cada año, se muestra el último Gini observado de cada país dentro de los 15 años previos. Los Ginis de consumo se multiplican por 1,13 (convención del Banco Mundial) para aproximarlos a Ginis de ingreso y hacer las mediciones comparables entre países.',
    'c2-sources': 'Datos: Banco Mundial — PIP (Gini) y WDI (PIB pc PPP, USD constantes 2021). Cada país se muestra con su último Gini observado dentro de los 15 años previos. Se multiplicó por 1,13 el Gini de los países que miden desigualdad en base a consumo para que sea comparable con el Gini de los que miden en base a ingreso.',
    'c3-sources': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP). Para cada año del slider, se usa la última encuesta observada de cada país dentro de los 15 años previos (shares por decil) combinada con la media nacional interpolada del año del slider. El percentil mundial se calcula ordenando todos los decil-país por ingreso y acumulando población. En algunos países la encuesta mide consumo en lugar de ingreso; ambas mediciones se muestran como "ingreso" para fines comparativos.',
    'footer-sources':  'Datos: Banco Mundial — Poverty and Inequality Platform (PIP) y World Development Indicators. Ginis ajustados: el de consumo se multiplica por 1,13 (convención del Banco Mundial). Ventana de 15 años hacia atrás desde el año del slider.',
    'footer-signature': 'El Atlas · Daniel Schteingart · 2026',
  },
  en: {
    'issue-num':  'No. 2',
    'page-title': "Is Latin America really the world's most unequal region?",
    'page-lede':  "Latin America's inequality exception is real — but not in the way we usually think.",

    // Chart 1
    'c1-title':            'The world ranking of inequality',
    'c1-subtitle-raw':     'Gini coefficient by country, as reported in original sources: Latin America above Sub-Saharan Africa. Each bar is a country and the color shows its region.',
    'c1-subtitle-adj':     'Gini made comparable by measurement method: consumption Ginis are multiplied by 1.13 to approximate income Ginis. With this adjustment, Sub-Saharan Africa moves above Latin America. Each bar is a country and the color shows its region.',
    'c1-toggle-label':     'Measurement',
    'c1-toggle-raw':       'Original Gini',
    'c1-toggle-adj':       'Adjusted Gini',
    'c1-axis-y':           'Gini',
    'c1-tt-year':          'Year of data',
    'c1-tt-welfare':       'Measurement',
    'c1-tt-gini-raw':      'Original Gini',
    'c1-tt-gini-adj':      'Adjusted Gini',
    'c1-tt-welfare-income':      'Income',
    'c1-tt-welfare-consumption': 'Consumption',
    'c1-avg-prefix':       'Regional average',
    'c1-avg-table-title':  'Average Gini by region',

    // Chart 2
    'c2-title':              'Latin America is too unequal for its level of development',
    'c2-subtitle-tpl-more':  'Latin America is {N}% more unequal than expected for its level of development.',
    'c2-subtitle-tpl-less':  'Latin America is {N}% less unequal than expected for its level of development.',
    'c2-toggle-model-label': 'Model',
    'c2-toggle-linear':      'Linear',
    'c2-toggle-quadratic':   'Quadratic',
    'c2-toggle-gini-label':  'Gini',
    'c2-toggle-gini-raw':    'Original',
    'c2-toggle-gini-adj':    'Adjusted',
    'c2-toggle-scale-label': 'X scale',
    'c2-toggle-scale-log':   'Log',
    'c2-toggle-scale-linear':'Linear',
    'c2-axis-x-log':         'GDP per capita PPP (constant 2021 USD, log scale)',
    'c2-axis-x-linear':      'GDP per capita PPP (constant 2021 USD)',
    'c2-axis-y-raw':         'Gini (original)',
    'c2-axis-y-adj':         'Gini (adjusted)',
    'c2-banner-n':           'N',
    'c2-banner-r2':          'R²',
    'c2-banner-residual':    'Residual',
    'c2-banner-region':      'Residual',
    'c2-tt-gdp':             'GDP pc PPP',
    'c2-tt-gini-raw':        'Gini (original)',
    'c2-tt-gini-adj':        'Gini (adjusted)',
    'c2-tt-residual-pp':     'Residual (pp)',
    'c2-tt-residual-pct':    'Residual (%)',
    'c2-tt-year':            'Data year',
    'c2-search-placeholder': 'Search country…',

    // Chart 4 — Income-by-decile ranking
    'c4-title':                  'Income by decile, country by country',
    'c4-subtitle':               'Average income of the selected decile, PPP US$, by country.',
    'c4-view-bars':              'Bars',
    'c4-view-map':               'Map',
    'c4-view-lines':             'Lines',
    'c4-deciles-label':          'Deciles',
    'c4-unit-label':             'Unit',
    'c4-unit-day':               'Day',
    'c4-unit-month':             'Month',
    'c4-unit-year':              'Year',
    'c4-scale-label':            'Scale',
    'c4-scale-linear':           'Linear',
    'c4-scale-log':              'Log',
    'c4-bench-label':            'Compare vs',
    'c4-map-classic':            'Classic',
    'c4-map-bench':              'Compare vs',
    'c4-continent-label':        'Zoom',
    'c4-cont-all':               'World',
    'c4-cont-america':           'Americas',
    'c4-cont-europe':            'Europe',
    'c4-cont-africa':            'Africa',
    'c4-cont-asia':              'Asia',
    'c4-cont-oceania':           'Oceania',
    'c4-period-label':           'Period',
    'c4-search-placeholder':     'Add a country…',
    'c4-bench-placeholder':      'Compare against…',
    'c4-map-hint':               'Click a country on the map (or search above) to pick the reference country.',
    'c4-tag-max':                'max',
    'c4-tag-min':                'min',
    'c4-empty':                  'No data for this year.',
    'c4-empty-lines':            'Pick at least one country.',
    'c4-sources':                'Data: World Bank — Poverty and Inequality Platform (PIP). Income by decile in PPP US$ per person; national mean interpolated by year.',

    // Chart 3
    'c3-title':                  'Elites close, poor far',
    'c3-subtitle':               'Rich households in Latin America are close to European ones in income. Poor households are not.',
    'c3-toggle-y-label':         'Y axis',
    'c3-toggle-income':          'Income PPP/day',
    'c3-toggle-percentile':      'World percentile',
    'c3-toggle-scale-label':     'Scale',
    'c3-toggle-scale-linear':    'Linear',
    'c3-toggle-scale-log':       'Log',
    'c3-axis-x':                 'Decile',
    'c3-decile-prefix':          'Decile',
    'c3-decile-poorest':         '(poorest 10%)',
    'c3-decile-richest':         '(richest 10%)',
    'c3-axis-y-income':          'Per capita household income (PPP USD/day)',
    'c3-axis-y-percentile':      'Percentile of world distribution',
    'c3-search-placeholder':     'Search country…',
    'c3-tt-decile':              'Decile',
    'c3-tt-income':              'Income PPP/day',
    'c3-tt-percentile':          'World percentile',
    'c3-tt-year-obs':            'Survey year',
    'c3-sources-income':         'Data: World Bank — Poverty and Inequality Platform (PIP). For each country, the income distribution by decile corresponds to its last survey within the previous 15 years of the year shown. Values in PPP USD/day are rescaled with the national mean interpolated for that year. In some countries the survey measures consumption rather than income; both are shown as "income" here for comparability.',
    'c3-sources-percentile':     'Data: World Bank — Poverty and Inequality Platform (PIP). The world percentile of each decile is computed by sorting all decile-country combinations globally by income (PPP USD/day) and accumulating population. For each country, deciles correspond to its last survey within the previous 15 years of the year shown. In some countries the survey measures consumption rather than income; both are shown as "income" here for comparability.',

    // Slider
    'slider-year-label':         'Year',
    'slider-play':               'Play',
    'slider-pause':              'Pause',

    // Mobile controls: gear + "Select" buttons that collapse the toggles +
    // search behind a tap (OWID-style). Only visible on screens ≤ 768px;
    // on desktop the controls show inline.
    'ctrl-options':              'Options',
    'ctrl-select':               'Select',
    // Mobile collapsibles: methodology note and chart-1 regional averages
    // table collapse behind a toggle on ≤768px to free vertical room for SVG.
    'ctrl-show-method':          'Methodology and sources',
    'c1-show-avg-table':         'Show regional averages',

    // Sources
    // Traducciones de las 7 regiones del Banco Mundial
    'reg.Latin America & Caribbean':                          'Latin America & Caribbean',
    'reg.Sub-Saharan Africa':                                 'Sub-Saharan Africa',
    'reg.Europe & Central Asia':                              'Europe & Central Asia',
    'reg.East Asia & Pacific':                                'East Asia & Pacific',
    'reg.South Asia':                                         'South Asia',
    'reg.Middle East, North Africa, Afghanistan & Pakistan':  'Middle East and North Africa',
    'reg.North America':                                      'North America',

    // Short versions for marimekko regional avg labels
    'reg-short.Latin America & Caribbean':                          'Latam & Caribbean',
    'reg-short.Sub-Saharan Africa':                                 'Sub-Saharan Africa',
    'reg-short.Europe & Central Asia':                              'Europe & C. Asia',
    'reg-short.East Asia & Pacific':                                'East Asia',
    'reg-short.South Asia':                                         'South Asia',
    'reg-short.Middle East, North Africa, Afghanistan & Pakistan':  'Middle East',
    'reg-short.North America':                                      'North America',

    'c1-sources': "Data: World Bank — Poverty and Inequality Platform (PIP). For each year of the slider, the last Gini observed for each country within the previous 15 years is shown. <strong>Original Gini</strong>: as reported by each country (income or consumption). <strong>Adjusted Gini</strong>: consumption Gini multiplied by 1.13, World Bank convention to make it comparable to income.",
    // Mode-specific captions used in PNGs (where only one mode is visible)
    'c1-sources-raw': "Data: World Bank — Poverty and Inequality Platform (PIP). For each year, the last Gini observed for each country within the previous 15 years is shown. Measurement as reported by each country: by income or by consumption, unadjusted.",
    'c1-sources-adj': "Data: World Bank — Poverty and Inequality Platform (PIP). For each year, the last Gini observed for each country within the previous 15 years is shown. Consumption Ginis are multiplied by 1.13 (World Bank convention) to approximate income Ginis and make measurements comparable across countries.",
    'c2-sources': 'Data: World Bank — PIP (Gini) and WDI (GDP pc PPP, constant 2021 USD). Each country is shown with its latest Gini observed within the previous 15 years. The Gini of countries that measure inequality based on consumption was multiplied by 1.13 to make it comparable with the Gini of those that measure it based on income.',
    'c3-sources': 'Data: World Bank — Poverty and Inequality Platform (PIP). For each slider year, the last observed survey of each country within the previous 15 years is used (decile shares) combined with the national mean interpolated for the slider year. World percentile is calculated by sorting all decile-country combinations by income and accumulating population. In some countries the survey measures consumption rather than income; both are shown as "income" here for comparability.',
    'footer-sources':  'Data: World Bank — Poverty and Inequality Platform (PIP) and World Development Indicators. Adjusted Ginis: consumption Gini multiplied by 1.13 (World Bank convention). 15-year backward window from the slider year.',
    'footer-signature': 'The Atlas · Daniel Schteingart · 2026',
  }
};

// Merge shared base (loaded from ../lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...BASE_I18N.es, ...ISSUE_I18N.es },
  en: { ...BASE_I18N.en, ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => I18N[LANG][key] || key;

const state = {};

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[LANG][key]) el.innerHTML = I18N[LANG][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[LANG][key]) el.placeholder = I18N[LANG][key];
  });
  document.querySelectorAll('[data-i18n-href]').forEach(el => {
    const key = el.dataset.i18nHref;
    if (I18N[LANG][key]) el.setAttribute('href', I18N[LANG][key]);
  });
  // Aria-labels traducibles (botones tuerca, otros controles solo-ícono)
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (I18N[LANG][key]) el.setAttribute('aria-label', I18N[LANG][key]);
  });
}

// Resolver idioma desde URL (?lang=en o ?lang=es)
(function initLang() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'es') LANG = urlLang;
  document.documentElement.lang = LANG;
})();

function setupLangToggle(onLangChange) {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      LANG = btn.dataset.lang;
      document.documentElement.lang = LANG;
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
      applyI18n();
      if (onLangChange) onLangChange();
    });
  });
  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === LANG);
  });
}
