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
