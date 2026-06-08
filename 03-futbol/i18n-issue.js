// Strings específicos del N°3 + helpers de i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según los charts que tenga.

//==================================================================
//  I18N — específico del N°3 "El fútbol y el desarrollo"
//==================================================================
const ISSUE_I18N = {
  es: {
    'issue-num':  'N° 3',
    'page-title': 'El fútbol no respeta al PIB',
    'page-lede':  'La excepcionalidad sudamericana en el fútbol — selecciones competitivas con economías relativamente chicas — sigue siendo una rareza estadística.',

    // Chart 1 — Scatter ELO vs PIB total
    'c1-title':            'Sudamérica juega en otra liga',
    'c1-subtitle':         'Las 10 selecciones de la CONMEBOL aparecen sistemáticamente por encima de la regresión: rinden más de lo que el tamaño de su economía predeciría.',
    'c1-axis-x':           'PIB total promedio del período (PPA, US$ int. constantes) — escala log',
    'c1-axis-y':           'Índice de fortaleza futbolística (rating Elo, promedio del período)',
    'c1-search-placeholder': 'Buscar selección…',
    'c1-no-results':       'Sin resultados',
    'c1-legend-hint':      'Pasá el cursor por una confederación para resaltarla · Clic para mostrarla/ocultarla',

    // Slider rango
    'c1-slider-period-label':  'Período',
    'c1-slider-from-label':    'Desde',
    'c1-slider-to-label':      'Hasta',

    // Banner (etiquetas + plantillas)
    'c1-banner-n':              'Países (n)',
    'c1-banner-r2':             'R²',
    'c1-banner-residual':       'Residuo medio',
    'c1-banner-period':         'Período',

    // Tooltip
    'c1-tt-elo':             'ELO prom',
    'c1-tt-gdp':              'PIB',
    'c1-tt-confed':          'Confederación',
    'c1-tt-period':          'Período',
    'c1-tt-residual':        'Residuo',

    // Aria / accesibilidad
    'chip-remove':           'Quitar',

    // Confederaciones FIFA — nombres mostrados en chips y banner
    'conf.CONMEBOL':         'CONMEBOL',
    'conf.UEFA':             'UEFA',
    'conf.CONCACAF':         'CONCACAF',
    'conf.CAF':              'CAF',
    'conf.AFC':              'AFC',
    'conf.OFC':              'OFC',
    // Nombres largos (descripción regional)
    'conf-long.CONMEBOL':    'Sudamérica',
    'conf-long.UEFA':        'Europa',
    'conf-long.CONCACAF':    'Norte y Centroamérica + Caribe',
    'conf-long.CAF':         'África',
    'conf-long.AFC':         'Asia',
    'conf-long.OFC':         'Oceanía',

    // Controles compartidos (override de los de BASE_I18N para terminología propia)
    'ctrl-options':          'Opciones',
    'ctrl-select':           'Seleccionar',
    'ctrl-show-method':      'Ver metodología y fuentes',

    // Footer
    'footer-download':       'Descargar datos (CSV)',
    'footer-download-png':   'Descargar PNG',
    'c1-sources':            'Datos: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (ratings Elo de selecciones nacionales, promedio anual ponderado por días); FMI — World Economic Outlook (PIB total PPA, USD internacionales constantes). Confederaciones según afiliación FIFA actual. Los puntos del gráfico representan el promedio de cada variable sobre el rango de años seleccionado, considerando solo países con datos en ambas variables.',

    // Chart 2 — Talento futbolístico por millón de habitantes
    'c2-title':              'Uruguay produce más futbolistas célebres por millón que cualquier país del mundo',
    'c2-subtitle':           'Futbolistas en el top mundial por HPI (Pantheon MIT, con visibilidad global mínima) dividido por la población promedio del país en el período de nacimiento seleccionado.',
    'c2-axis-x':             'Futbolistas célebres por millón de habitantes',
    'c2-slider-label':       'Año de nacimiento',
    'c2-topn-label':         'Top mundial',
    'c2-search-placeholder': 'Buscar país…',
    'c2-tt-count':           'Cantidad de futbolistas célebres',
    'c2-tt-pop':             'Población promedio',
    'c2-tt-rate':            'Futbolistas célebres por millón',
    'c2-sources':            'Datos: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> — figuras memorables de Wikipedia con HPI (Historical Popularity Index), edición 2025, filtrado a la ocupación SOCCER PLAYER y al género masculino. Restringido a jugadores con al menos 5.000 vistas en Wikipedias no-inglesas, para evitar el sesgo de artículos auto-generados en Wikidata (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> para población anual histórica. País de nacimiento según Pantheon.',

    // Chart 4 — Scatter: share fútbol vs antigüedad de clubes
    'c4-title':              'Sudamérica: alto share de fútbol y clubes muy antiguos',
    'c4-subtitle':           'Cada punto es un país. En el eje horizontal, qué porcentaje de los deportistas físicos notables se dedicó al fútbol. En el vertical, qué tan antiguos son sus clubes. El cluster sudamericano (terracota) ocupa la esquina superior-derecha: alta concentración futbolística e historia institucional larga.',
    'c4-axis-x':             '% del talento deportivo masculino que es fútbol',
    'c4-search-placeholder': 'Buscar país…',
    'c4-axis-y':             'Año mediano de fundación de los clubes (ponderado por relevancia)',
    'c4-slider-label':       'Año de nacimiento',
    'c4-hi-views':           'Solo figuras con +5.000 visitas en Wikipedia',
    'c4-min-n':              'Mín. deportistas',
    'c4-banner-period':      'Período',
    'c4-banner-n':           'Países',
    'c4-banner-conmebol':    'Share fútbol · CONMEBOL',
    'c4-banner-uefa':        'Share fútbol · UEFA',
    'c4-tt-share':           'Fútbol / deportes físicos',
    'c4-tt-clubage':         'Año mediano clubes',
    'c4-tt-cohort':          'Cohorte (fútbol / total)',
    'c4-empty':              'Sin datos en el rango seleccionado',
    'c4-sources':            'Eje X: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> edición 2025 — deportistas físicos notables por país de nacimiento (occupation = SOCCER PLAYER y otras disciplinas atléticas). El toggle "+5.000 visitas en Wikipedia" filtra figuras cuyo total de visitas en Wikipedias no-inglesas sea inferior a 5.000: descarta perfiles que tienen artículo en muchas Wikipedias pero muy pocas lecturas reales (sobre todo, J-League menores que inflan el conteo japonés). Eje Y: Wikidata (clubes de fútbol como instancias de <em>association football club</em> y <em>sports club</em> con deporte=fútbol; ~51.573 clubes); año de fundación (P571) y número de Wikipedias con artículo (sitelinks) para ponderar la relevancia de cada club al calcular la mediana.',

    // Chart 3 — Mapa coroplético "antigüedad de los clubes"
    'c3-title':              'Dónde nació el fútbol moderno',
    'c3-subtitle':           'Año mediano de fundación de los clubes de cada país, ponderado por su relevancia en Wikipedia. Tonos más oscuros = tradición futbolística más profunda.',
    'c3-search-placeholder': 'Buscar país…',
    'c3-legend-label':       'Año mediano',
    'c3-legend-nodata':      'Sin dato',
    'c3-reset-zoom':         'Restablecer zoom',
    'c3-tt-year':            'Año mediano (pond.)',
    'c3-tt-clubs':           'Clubes',
    'c3-tt-with-date':       'Con fecha de creación identificada',
    'c3-tt-nodata':          'Sin clubes en el universo Wikidata',
    'c3-sources':            'Datos: Wikidata (clubes de fútbol como instancias de <em>association football club</em>, ~41.894 clubes); año de fundación (P571) y número de Wikipedias con artículo (sitelinks) para ponderar relevancia.',
  },
  en: {
    'issue-num':  'N° 3',
    'page-title': 'Football doesn\'t bow to GDP',
    'page-lede':  'South America\'s footballing exceptionalism — strong national teams from relatively small economies — remains a statistical oddity.',

    // Chart 1 — Scatter ELO vs total GDP
    'c1-title':            'South America plays in a different league',
    'c1-subtitle':         'CONMEBOL\'s 10 national teams systematically sit above the regression line: they outperform what their economy\'s size would predict.',
    'c1-axis-x':           'Average total GDP over the period (PPP, constant int\'l USD) — log scale',
    'c1-axis-y':           'Footballing strength index (Elo rating, period average)',
    'c1-search-placeholder': 'Search team…',
    'c1-no-results':       'No results',
    'c1-legend-hint':      'Hover a confederation to highlight it · Click to show/hide',

    'c1-slider-period-label':  'Period',
    'c1-slider-from-label':    'From',
    'c1-slider-to-label':      'To',

    'c1-banner-n':              'Countries (n)',
    'c1-banner-r2':             'R²',
    'c1-banner-residual':       'Mean residual',
    'c1-banner-period':         'Period',

    'c1-tt-elo':             'Avg Elo',
    'c1-tt-gdp':             'GDP',
    'c1-tt-confed':          'Confederation',
    'c1-tt-period':          'Period',
    'c1-tt-residual':        'Residual',

    'chip-remove':           'Remove',

    'conf.CONMEBOL':         'CONMEBOL',
    'conf.UEFA':             'UEFA',
    'conf.CONCACAF':         'CONCACAF',
    'conf.CAF':              'CAF',
    'conf.AFC':              'AFC',
    'conf.OFC':              'OFC',
    'conf-long.CONMEBOL':    'South America',
    'conf-long.UEFA':        'Europe',
    'conf-long.CONCACAF':    'North & Central America + Caribbean',
    'conf-long.CAF':         'Africa',
    'conf-long.AFC':         'Asia',
    'conf-long.OFC':         'Oceania',

    'ctrl-options':          'Options',
    'ctrl-select':           'Select',
    'ctrl-show-method':      'View methodology and sources',

    'footer-download':       'Download data (CSV)',
    'footer-download-png':   'Download PNG',
    'c1-sources':            'Data: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo ratings of national teams, annual averages weighted by days at each rating); IMF — World Economic Outlook (total GDP PPP, constant international USD). Confederations follow current FIFA affiliation. Each point represents the average of both variables over the selected year range, restricted to countries with data for both.',

    // Chart 2 — Footballing talent per million inhabitants
    'c2-title':              'Uruguay produces more famous footballers per million than any country in the world',
    'c2-subtitle':           'Footballers in the global top by HPI (Pantheon MIT, minimum global visibility) divided by the country\'s average population over the selected birth-year period.',
    'c2-axis-x':             'Famous footballers per million inhabitants',
    'c2-slider-label':       'Birth year',
    'c2-topn-label':         'Global top',
    'c2-search-placeholder': 'Search country…',
    'c2-tt-count':           'Famous footballers',
    'c2-tt-pop':             'Average population',
    'c2-tt-rate':            'Famous footballers per million',
    'c2-sources':            'Data: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> — Wikipedia memorable figures with HPI (Historical Popularity Index), 2025 release, filtered to occupation SOCCER PLAYER and male gender. Restricted to players with at least 5,000 views on non-English Wikipedias, to avoid the bias from Wikidata-autogenerated articles (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> for annual population. Country of birth per Pantheon.',

    // Chart 4 — Scatter: football share vs club age
    'c4-title':              'South America: high football share and very old clubs',
    'c4-subtitle':           'Each point is a country. The horizontal axis shows the share of notable physical athletes who became footballers; the vertical, how old the country\'s clubs are. The South American cluster (terracotta) sits in the upper-right: highest football concentration AND deepest institutional history.',
    'c4-axis-x':             '% of male sports talent that is football',
    'c4-search-placeholder': 'Search country…',
    'c4-axis-y':             'Median founding year of clubs (weighted by relevance)',
    'c4-slider-label':       'Birth year',
    'c4-hi-views':           'Only figures with +5,000 Wikipedia views',
    'c4-min-n':              'Min. athletes',
    'c4-banner-period':      'Period',
    'c4-banner-n':           'Countries',
    'c4-banner-conmebol':    'Football share · CONMEBOL',
    'c4-banner-uefa':        'Football share · UEFA',
    'c4-tt-share':           'Football / physical sports',
    'c4-tt-clubage':         'Median club year',
    'c4-tt-cohort':          'Cohort (football / total)',
    'c4-empty':              'No data in the selected range',
    'c4-sources':            'X axis: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> 2025 release — notable physical athletes by birth country (occupation = SOCCER PLAYER and other athletic disciplines). The "+5,000 Wikipedia views" toggle filters figures whose total views on non-English Wikipedias is below 5,000: drops profiles with articles in many Wikipedias but very few actual reads (especially lower-tier J-League players that inflate Japan\'s count). Y axis: Wikidata (football clubs as instances of <em>association football club</em> and <em>sports club</em> with sport=football; ~51,573 clubs); founding year (P571) and number of Wikipedias with an article (sitelinks) used to weight each club\'s relevance when computing the median.',

    // Chart 3 — Choropleth map "age of clubs"
    'c3-title':              'Where modern football was born',
    'c3-subtitle':           'Median founding year of each country\'s clubs, weighted by their relevance on Wikipedia. Darker tones = deeper footballing tradition.',
    'c3-search-placeholder': 'Search country…',
    'c3-legend-label':       'Median year',
    'c3-legend-nodata':      'No data',
    'c3-reset-zoom':         'Reset zoom',
    'c3-tt-year':            'Median year (weighted)',
    'c3-tt-clubs':           'Clubs',
    'c3-tt-with-date':       'With identified founding date',
    'c3-tt-nodata':          'No clubs in the Wikidata universe',
    'c3-sources':            'Data: Wikidata (football clubs as instances of <em>association football club</em>, ~41,894 clubs); founding year (P571) and number of Wikipedias with an article (sitelinks) for relevance weighting.',
  }
};

// Merge shared base (loaded from ../lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.es : {}), ...ISSUE_I18N.es },
  en: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.en : {}), ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || key;

// state global, indexado por chart (state[1] = scatter elo/pib)
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
