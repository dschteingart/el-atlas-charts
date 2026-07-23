// Strings del N°5 "¿Somos tan intolerantes?" + helpers i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según su chart.
//
// Numeración de charts del N°5:
//   1 ranking (barras por categoría) · 2 evolución (líneas) · 3 mapa
//   4 perfil país · 5 scatter declarado vs implícito · 6 latinobarómetro

const ES_N5_INTOLERANCIA = true;  // sentinel para png-export (FILENAMES del N°5)

const ISSUE_I18N = {
  es: {
    'issue-num':  'N°5',
    'page-title': '¿El país más racista del mundo?',
    'page-lede':  'Qué declaran las encuestas sobre la intolerancia en Argentina, América Latina y el mundo.',

    // ---- Chart 1: ranking por categoría (barras)
    'c1-title':          'El Río de la Plata, campeón mundial de la tolerancia (declarada)',
    'c1-title-neutral':  'Los vecinos que cada sociedad rechaza',
    'c1-subtitle-tpl':   'Porcentaje que no querría tener de vecinos a {CAT}. Último dato disponible por país, 2017-2022.',
    'c1-cat-label':      'No querría de vecinos a…',
    'c1-view-label':     'Mostrar',
    'c1-view-sel':       'Mi selección',
    'c1-view-all':       'Todos los países',
    'c1-search-ph':      'Agregar país…',
    'c1-pick-hint-sel':  'Los países elegidos se muestran como barras.',
    'c1-pick-hint-all':  'Los países elegidos se etiquetan en el gráfico.',
    'c1-median-lbl':     'Mediana mundial',
    'c1-median-on':      'Mostrar',
    'c1-median-off':     'Ocultar',
    'c1-avg-table-title': 'Promedio por región',
    'c1-tt-pct':         'Rechazo declarado',
    'c1-tt-survey':      'Encuesta',
    'c1-tt-n':           'Muestra',
    'c1-axis-x':         '% que menciona al grupo como vecino no deseado',
    'c1-axis-mk':        '% que no lo querría de vecino',
    'c1-sources':        'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), pregunta «¿A cuáles de estos grupos no le gustaría tener de vecinos?» (mención espontánea). Último dato disponible por país (2017-2022); % ponderado sobre respuestas válidas, muestras de 1.000-2.000 casos. Ojo: mide intolerancia <em>declarada</em> ante un encuestador — diferencias de pocos puntos entre países no son informativas (los países medidos por EVS y WVS a la vez difieren hasta 8-13 puntos).',
    'c1-sources-tpl':    'Datos: Integrated Values Survey (EVS/WVS). «¿A quién no querría de vecino?» — mención espontánea, % ponderado. Último dato por país, {Y}. Mide intolerancia declarada.',

    // Categorías: forma corta (selector) y forma "a ..." (subtítulo)
    'cat-otra_raza':          'Personas de otra raza',
    'cat-inmigrantes':        'Inmigrantes',
    'cat-homosexuales':       'Homosexuales',
    'cat-otra_religion':      'Personas de otra religión',
    'cat-otro_idioma':        'Personas de otro idioma',
    'cat-parejas_no_casadas': 'Parejas no casadas',
    'cat-sida':               'Personas con sida',
    'cat-bebedores':          'Bebedores empedernidos',
    'cat-drogadictos':        'Drogadictos',
    'cat-bebedores_drogadictos': 'Bebedores o drogadictos',
    'cat-jovenes':            'Jóvenes',
    'catA-bebedores_drogadictos': 'bebedores, drogadictos o alcohólicos',
    'catA-jovenes':           'jóvenes',

    // ---- Chart 2: la película (líneas temporales)
    'c2-title':          'El derrumbe de la homofobia latinoamericana',
    'c2-title-neutral':  'La evolución de la intolerancia declarada',
    'c2-subtitle-tpl':   'Porcentaje que no querría tener de vecinos a {CAT}, a lo largo del tiempo (Integrated Values Survey, 1981-2022).',
    'c2-sources':        'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), pregunta de vecinos, mención espontánea, % ponderado. Para cada país se muestra una serie coherente (el estudio con más olas) para evitar saltos por diferencias de instrumento entre EVS y WVS. Mide intolerancia declarada.',

    // ---- Chart 5: declarado vs implícito (scatter)
    'c5-title':          'Argentina declara poco racismo, pero lo asocia como cualquiera',
    'c5-title-neutral':  'Lo que se dice y lo que se asocia',
    'c5-subtitle':       'Prejuicio declarado en encuestas vs. sesgo implícito medido con un test de asociación.',
    'c5-subtitle-race':  'Rechazo racial declarado (encuesta) vs. sesgo racial implícito (test de asociación IAT). Cada punto, un país.',
    'c5-subtitle-gay':   'Rechazo a homosexuales declarado (encuesta) vs. sesgo anti-gay implícito (test de asociación IAT). Cada punto, un país.',
    'c5-dim-label':      'Dimensión',
    'c5-dim-race':       'Raza',
    'c5-dim-gay':        'Orientación sexual',
    'c5-axis-x':         'Rechazo declarado en la encuesta (%)',
    'c5-axis-y':         'Sesgo implícito (D-score del IAT)',
    'c5-tt-declared':    'Declarado (encuesta)',
    'c5-tt-implicit':    'Implícito (IAT)',
    'c5-sources':        'Datos: rechazo declarado, Integrated Values Survey (EVS/WVS, último dato). Sesgo implícito, Project Implicit International (Charlesworth et al. 2023): D-score del Test de Asociación Implícita (IAT), 2009-2019; &gt;0 = asociación más veloz del grupo dominante (blancos/heterosexuales) con lo positivo. La muestra del IAT es autoseleccionada (visitantes del sitio): sirve para comparar niveles relativos entre países, no prevalencias.',

    // ---- Chart 4: perfil de intolerancia de un país
    'c4-title':          'La Argentina le teme al vicio, no al distinto',
    'c4-title-neutral':  '¿A quién le teme cada sociedad?',
    'c4-subtitle-tpl':   'A qué tipo de vecino rechaza {PAIS}, categoría por categoría, contra la mediana mundial. Último dato 2017-2022.',
    'c4-country-label':  'País',
    'c4-median-legend':  'Mediana mundial',
    'c4-tt-above':       'Por encima de la mediana mundial.',
    'c4-tt-below':       'Por debajo de la mediana mundial.',
    'c4-sources':        'Datos: Integrated Values Survey (EVS/WVS), pregunta de vecinos, mención espontánea. Último dato disponible por país (2017-2022); % ponderado. La mediana mundial es la de todos los países con dato en cada categoría. Mide intolerancia declarada.',

    // ---- Chart 6: Latinobarómetro 2024 (barras LatAm)
    'c6-title':          'Chile y Perú, los más recelosos del inmigrante en la región',
    'c6-title-neutral':  'La intolerancia declarada en América Latina',
    'c6-subtitle-tpl':   'Porcentaje que no querría tener de vecinos a {CAT}, en 17 países de América Latina. Latinobarómetro 2024.',
    'c6-axis-x':         '% que no lo querría de vecino',
    'c6-tt-survey':      'Encuesta',
    'c6-sources':        'Datos: Latinobarómetro 2024 (batería P3NOIJ, la misma pregunta de vecinos del WVS), muestras nacionales de 1.000-1.200 casos por país. % ponderado sobre quienes respondieron la batería. Fuente independiente y más reciente que la IVS: valida el ranking regional con dato de 2024.',
    'catA-otra_raza':          'personas de otra raza',
    'catA-inmigrantes':        'inmigrantes o trabajadores extranjeros',
    'catA-homosexuales':       'homosexuales',
    'catA-otra_religion':      'personas de otra religión',
    'catA-otro_idioma':        'personas que hablan otro idioma',
    'catA-parejas_no_casadas': 'parejas que conviven sin casarse',
    'catA-sida':               'personas con sida',
    'catA-bebedores':          'bebedores empedernidos',
    'catA-drogadictos':        'drogadictos',

    'ctrl-options':     'Opciones',
    'ctrl-select':      'Seleccionar',
    'ctrl-show-method': 'Ver metodología y fuentes',
    'chip-remove':      'Quitar',
    'footer-download':     'Descargar datos (CSV)',
    'footer-download-png': 'Descargar PNG',
    'index-see':           'Ver gráfico →',
    'index-charts-label':  'Gráficos interactivos'
  },
  en: {
    'issue-num':  'No. 5',
    'page-title': 'The most racist country in the world?',
    'page-lede':  'What surveys say about intolerance in Argentina, Latin America and the world.',

    'c1-title':          'The River Plate, world champion of (declared) tolerance',
    'c1-title-neutral':  'The neighbours each society rejects',
    'c1-subtitle-tpl':   'Share who would not like to have {CAT} as neighbours. Latest available data per country, 2017-2022.',
    'c1-cat-label':      'Would not want as neighbours…',
    'c1-view-label':     'Show',
    'c1-view-sel':       'My selection',
    'c1-view-all':       'All countries',
    'c1-search-ph':      'Add country…',
    'c1-pick-hint-sel':  'The chosen countries show as bars.',
    'c1-pick-hint-all':  'The chosen countries are labelled on the chart.',
    'c1-median-lbl':     'World median',
    'c1-median-on':      'Show',
    'c1-median-off':     'Hide',
    'c1-avg-table-title': 'Regional average',
    'c1-tt-pct':         'Declared rejection',
    'c1-tt-survey':      'Survey',
    'c1-tt-n':           'Sample',
    'c1-axis-x':         '% mentioning the group as unwanted neighbours',
    'c1-axis-mk':        '% who would not want them as neighbours',
    'c1-sources':        'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), question "Which of these groups would you not like to have as neighbours?" (spontaneous mention). Latest available data per country (2017-2022); weighted % over valid responses, samples of 1,000-2,000 cases. Note: this measures intolerance as <em>declared</em> to an interviewer — small gaps between countries are not informative (countries surveyed by both EVS and WVS differ by up to 8-13 points).',
    'c1-sources-tpl':    'Data: Integrated Values Survey (EVS/WVS). "Who would you not want as a neighbour?" — spontaneous mention, weighted %. Latest data per country, {Y}. Measures declared intolerance.',

    'cat-otra_raza':          'People of a different race',
    'cat-inmigrantes':        'Immigrants',
    'cat-homosexuales':       'Homosexuals',
    'cat-otra_religion':      'People of a different religion',
    'cat-otro_idioma':        'People of another language',
    'cat-parejas_no_casadas': 'Unmarried couples',
    'cat-sida':               'People with AIDS',
    'cat-bebedores':          'Heavy drinkers',
    'cat-drogadictos':        'Drug addicts',
    'cat-bebedores_drogadictos': 'Drinkers or drug addicts',
    'cat-jovenes':            'Young people',
    'catA-bebedores_drogadictos': 'heavy drinkers, drug addicts or alcoholics',
    'catA-jovenes':           'young people',

    // ---- Chart 2: the trend (time series)
    'c2-title':          'The collapse of Latin American homophobia',
    'c2-title-neutral':  'The trend in declared intolerance',
    'c2-subtitle-tpl':   'Share who would not want {CAT} as neighbours, over time (Integrated Values Survey, 1981-2022).',
    'c2-sources':        'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), neighbours question, spontaneous mention, weighted %. For each country a single consistent series is shown (the study with more waves) to avoid jumps from EVS/WVS instrument differences. Measures declared intolerance.',

    // ---- Chart 5: declared vs implicit (scatter)
    'c5-title':          'Argentina declares little racism, but associates like everyone else',
    'c5-title-neutral':  'What people say vs. what they associate',
    'c5-subtitle':       'Prejudice declared in surveys vs. implicit bias measured with an association test.',
    'c5-subtitle-race':  'Declared racial rejection (survey) vs. implicit racial bias (IAT association test). Each dot is a country.',
    'c5-subtitle-gay':   'Declared rejection of homosexuals (survey) vs. implicit anti-gay bias (IAT association test). Each dot is a country.',
    'c5-dim-label':      'Dimension',
    'c5-dim-race':       'Race',
    'c5-dim-gay':        'Sexual orientation',
    'c5-axis-x':         'Declared rejection in survey (%)',
    'c5-axis-y':         'Implicit bias (IAT D-score)',
    'c5-tt-declared':    'Declared (survey)',
    'c5-tt-implicit':    'Implicit (IAT)',
    'c5-sources':        'Data: declared rejection, Integrated Values Survey (EVS/WVS, latest). Implicit bias, Project Implicit International (Charlesworth et al. 2023): Implicit Association Test (IAT) D-score, 2009-2019; &gt;0 = faster association of the dominant group (white/heterosexual) with positive. The IAT sample is self-selected (site visitors): it compares relative levels across countries, not prevalences.',

    // ---- Chart 4: country intolerance profile
    'c4-title':          'Argentina fears vice, not the different',
    'c4-title-neutral':  'Whom does each society fear?',
    'c4-subtitle-tpl':   'Which kind of neighbour {PAIS} rejects, category by category, against the world median. Latest data 2017-2022.',
    'c4-country-label':  'Country',
    'c4-median-legend':  'World median',
    'c4-tt-above':       'Above the world median.',
    'c4-tt-below':       'Below the world median.',
    'c4-sources':        'Data: Integrated Values Survey (EVS/WVS), neighbours question, spontaneous mention. Latest available data per country (2017-2022); weighted %. The world median covers all countries with data in each category. Measures declared intolerance.',

    // ---- Chart 6: Latinobarómetro 2024 (LatAm bars)
    'c6-title':          'Chile and Peru, the region’s wariest of immigrants',
    'c6-title-neutral':  'Declared intolerance in Latin America',
    'c6-subtitle-tpl':   'Share who would not want {CAT} as neighbours, across 17 Latin American countries. Latinobarómetro 2024.',
    'c6-axis-x':         '% who would not want them as neighbours',
    'c6-tt-survey':      'Survey',
    'c6-sources':        'Data: Latinobarómetro 2024 (P3NOIJ battery, the same neighbours question as the WVS), national samples of 1,000-1,200 per country. Weighted % over those who answered the battery. An independent, more recent source than the IVS: it validates the regional ranking with 2024 data.',
    'catA-otra_raza':          'people of a different race',
    'catA-inmigrantes':        'immigrants or foreign workers',
    'catA-homosexuales':       'homosexuals',
    'catA-otra_religion':      'people of a different religion',
    'catA-otro_idioma':        'people who speak a different language',
    'catA-parejas_no_casadas': 'unmarried couples living together',
    'catA-sida':               'people with AIDS',
    'catA-bebedores':          'heavy drinkers',
    'catA-drogadictos':        'drug addicts',

    'ctrl-options':     'Options',
    'ctrl-select':      'Select',
    'ctrl-show-method': 'See methodology and sources',
    'chip-remove':      'Remove',
    'footer-download':     'Download data (CSV)',
    'footer-download-png': 'Download PNG',
    'index-see':           'See chart →',
    'index-charts-label':  'Interactive charts'
  }
};

// Merge shared base (lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.es : {}), ...ISSUE_I18N.es },
  en: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.en : {}), ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || key;

// state global, indexado por chart (state[1] = ranking, ...)
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
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (I18N[LANG][key]) el.setAttribute('aria-label', I18N[LANG][key]);
  });
}

// Resolver idioma: ?lang=en|es en la URL tiene prioridad; si no, lo último
// elegido (localStorage), para que el idioma sobreviva a la navegación.
(function initLang() {
  let stored = null;
  try { stored = localStorage.getItem('atlas-lang'); } catch (_) {}
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'es') {
    LANG = urlLang;
    try { localStorage.setItem('atlas-lang', LANG); } catch (_) {}
  } else if (stored === 'en' || stored === 'es') {
    LANG = stored;
  }
  document.documentElement.lang = LANG;
})();

function setupLangToggle(onLangChange) {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      LANG = btn.dataset.lang;
      try { localStorage.setItem('atlas-lang', LANG); } catch (_) {}
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
