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
    'c1-subtitle-raw':     'Coeficiente de Gini por país, tal como aparece en las fuentes originales: América Latina por encima de África Subsahariana.',
    'c1-subtitle-adj':     'Gini comparable por método de medición: los Ginis de consumo se multiplican por 1,13 para aproximarlos a Ginis de ingreso. Con este ajuste, África Subsahariana queda por encima de América Latina.',
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
    'c2-title':            'América Latina es demasiado desigual para su nivel de desarrollo',
    'c2-subtitle':         'Todos los países latinoamericanos están por encima de la línea que predice su nivel de ingreso. La región es 17% más desigual de lo esperado.',
    'c2-toggle-label':     'Modelo',
    'c2-toggle-linear':    'Lineal',
    'c2-toggle-quadratic': 'Cuadrática',
    'c2-axis-x':           'PIB per cápita PPP (USD constantes 2021) — escala log',
    'c2-axis-y':           'Gini ajustado',
    'c2-banner-n':         'N',
    'c2-banner-r2':        'R²',
    'c2-banner-residual':  'Residuo',
    'c2-tt-gdp':           'PIB pc PPP',
    'c2-tt-gini-adj':      'Gini ajustado',
    'c2-tt-residual-pp':   'Residuo (pp)',
    'c2-tt-residual-pct':  'Residuo (%)',

    // Chart 3 — Deciles
    'c3-title':                  'Las élites cerca, los pobres lejos',
    'c3-subtitle-income':        'Ingreso medio por decil. La distancia entre América Latina y Europa se concentra abajo, no arriba.',
    'c3-subtitle-percentile':    'Posición de cada decil nacional en la distribución mundial. Permite ubicar a los hogares de cada país dentro del ranking global.',
    'c3-toggle-label':           'Eje Y',
    'c3-toggle-income':          'Ingreso PPP/día',
    'c3-toggle-percentile':      'Percentil mundial',
    'c3-axis-x':                 'Decil',
    'c3-axis-y-income':          'Ingreso medio por hogar (USD PPP/día)',
    'c3-axis-y-percentile':      'Percentil de la distribución mundial',
    'c3-search-placeholder':     'Buscar país…',
    'c3-tt-decile':              'Decil',
    'c3-tt-income':              'Ingreso PPP/día',
    'c3-tt-percentile':          'Percentil mundial',

    // Slider temporal (compartido charts 1 y 2)
    'slider-year-label':         'Año',
    'slider-play':               'Reproducir',
    'slider-pause':              'Pausar',

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
    'c2-sources': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP) y World Development Indicators (PIB per cápita PPP, USD constantes 2021). Gini ajustado: el de consumo se multiplica por 1,13. Año del Gini: último observado entre 2010 y 2025 dentro de los 15 años previos al seleccionado.',
    'c3-sources': 'Datos: Banco Mundial — Poverty and Inequality Platform (PIP), año más reciente disponible por país. Ingresos expresados en dólares PPP de 2021 por hogar/día. El percentil mundial se calcula ordenando todos los decil-país-año del mundo por ingreso y acumulando población.',
    'footer-sources':  'Datos: Banco Mundial — Poverty and Inequality Platform (PIP) y World Development Indicators. Ginis ajustados: el de consumo se multiplica por 1,13 (convención del Banco Mundial). Ventana de 15 años hacia atrás desde el año del slider.',
    'footer-signature': 'El Atlas · Daniel Schteingart · 2026',
  },
  en: {
    'issue-num':  'No. 2',
    'page-title': "Is Latin America really the world's most unequal region?",
    'page-lede':  "Latin America's inequality exception is real — but not in the way we usually think.",

    // Chart 1
    'c1-title':            'The world ranking of inequality',
    'c1-subtitle-raw':     'Gini coefficient by country, as reported in original sources: Latin America above Sub-Saharan Africa.',
    'c1-subtitle-adj':     'Gini made comparable by measurement method: consumption Ginis are multiplied by 1.13 to approximate income Ginis. With this adjustment, Sub-Saharan Africa moves above Latin America.',
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
    'c2-title':            'Latin America is too unequal for its level of development',
    'c2-subtitle':         'All Latin American countries lie above the line their income level would predict. The region is 17% more unequal than expected.',
    'c2-toggle-label':     'Model',
    'c2-toggle-linear':    'Linear',
    'c2-toggle-quadratic': 'Quadratic',
    'c2-axis-x':           'GDP per capita PPP (constant 2021 USD) — log scale',
    'c2-axis-y':           'Adjusted Gini',
    'c2-banner-n':         'N',
    'c2-banner-r2':        'R²',
    'c2-banner-residual':  'Residual',
    'c2-tt-gdp':           'GDP pc PPP',
    'c2-tt-gini-adj':      'Adjusted Gini',
    'c2-tt-residual-pp':   'Residual (pp)',
    'c2-tt-residual-pct':  'Residual (%)',

    // Chart 3
    'c3-title':                  'Elites close, the poor far apart',
    'c3-subtitle-income':        'Average income by decile. The gap between Latin America and Europe is concentrated at the bottom, not at the top.',
    'c3-subtitle-percentile':    "Each national decile's position in the world distribution. Helps locate each country's households within the global ranking.",
    'c3-toggle-label':           'Y axis',
    'c3-toggle-income':          'PPP income/day',
    'c3-toggle-percentile':      'World percentile',
    'c3-axis-x':                 'Decile',
    'c3-axis-y-income':          'Average household income (PPP USD/day)',
    'c3-axis-y-percentile':      'Percentile of world distribution',
    'c3-search-placeholder':     'Search country…',
    'c3-tt-decile':              'Decile',
    'c3-tt-income':              'PPP income/day',
    'c3-tt-percentile':          'World percentile',

    // Slider
    'slider-year-label':         'Year',
    'slider-play':               'Play',
    'slider-pause':              'Pause',

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
    'c2-sources': 'Data: World Bank — Poverty and Inequality Platform (PIP) and World Development Indicators (GDP per capita PPP, constant 2021 USD). Adjusted Gini: consumption Gini multiplied by 1.13. Gini year: most recent observation between 2010 and 2025 within 15 years of the selected year.',
    'c3-sources': "Data: World Bank — Poverty and Inequality Platform (PIP), most recent year available per country. Incomes in 2021 PPP USD per household/day. World percentile calculated by sorting all decile-country-year combinations by income and accumulating population.",
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
