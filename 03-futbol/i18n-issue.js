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
    'c1-subtitle':         'Las 10 selecciones de la CONMEBOL juegan mejor de lo que el tamaño de su economía predeciría.',
    // Versión NEUTRAL (cuando el usuario cambia la selección/período en el
    // interactivo): título/subtítulo descriptivos, sin el claim editorial.
    'c1-title-neutral':    'Fortaleza futbolística y tamaño de la economía',
    'c1-subtitle-neutral': 'Índice Elo promedio de cada selección contra el PIB total del país.',
    // Regla del N°3: títulos de eje SIMPLES; la aclaración metodológica
    // (qué es el Elo, qué PPA, etc.) va en la nota de Datos.
    'c1-axis-x':           'PIB',
    'c1-axis-y':           'Índice de fortaleza futbolística',
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
    'footer-download-svg':   'Descargar SVG',
    'c1-sources':            'Datos: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo de selecciones nacionales, valor al cierre de cada año) y FMI — World Economic Outlook (PIB total PPA, USD internacionales constantes). Los datos muestran el promedio del período seleccionado para ambas variables.',
    // Plantilla PLANA (sin <a>) para la nota del PNG: el hook
    // onBeforePngExportGetSourceText reemplaza {period} por los años reales
    // del slider, para que la nota diga explícitamente a qué promedio refiere.
    'c1-sources-tpl':        'Datos: eloratings.net (Elo de selecciones nacionales, valor al cierre de cada año) y FMI — World Economic Outlook (PIB total PPA, USD internacionales constantes). Los datos muestran el promedio {period} para ambas variables.',

    // Chart 2 — Talento futbolístico por millón de habitantes
    'c2-title':              'Uruguay produce más futbolistas célebres per cápita que cualquier país del mundo',
    // Neutral (cuando el usuario cambia período/topN/selección): solo el
    // título cambia; el subtítulo ya es descriptivo.
    'c2-title-neutral':      'Talento futbolístico ajustado por población',
    'c2-subtitle':           'Futbolistas en el top mundial por HPI (Pantheon MIT, con visibilidad global mínima) dividido por la población promedio del país en el período de nacimiento seleccionado.',
    'c2-subtitle-tpl':       'Futbolistas célebres del top {N} mundial nacidos entre {Y0} y {Y1} por millón de habitantes.',
    'c2-axis-x':             'Futbolistas célebres por millón de habitantes',
    'c2-slider-label':       'Año de nacimiento',
    'c2-topn-label':         'Top mundial',
    'c2-search-placeholder': 'Buscar país…',
    'c2-tt-count':           'Cantidad de futbolistas célebres',
    'c2-tt-pop':             'Población promedio',
    'c2-tt-rate':            'Futbolistas célebres por millón',
    'c2-sources':            'Datos: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> — figuras memorables de Wikipedia con HPI (Historical Popularity Index), edición 2025, filtrado a la ocupación SOCCER PLAYER y al género masculino. Restringido a jugadores con al menos 15 traducciones en Wikipedia y 5.000 vistas en Wikipedias no-inglesas, para evitar el sesgo de artículos auto-generados en Wikidata (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> para población anual histórica. País de nacimiento según Pantheon. En terracota, países de la CONMEBOL.',
    // Plantilla PLANA y CORTA para la nota del PNG (estilizada). El hook
    // onBeforePngExportGetSourceText reemplaza {N}/{Y0}/{Y1} por el top N y los
    // años del slider. Aclara el color terracota. La metodología detallada
    // (filtro SOCCER PLAYER, sesgo J-League) queda en el footer del HTML.
    'c2-sources-tpl':        'Datos: Pantheon (MIT Media Lab) y Our World in Data — futbolistas del top {N} mundial por su Historical Popularity Index (HPI), nacidos entre {Y0} y {Y1}, por millón de habitantes. En terracota, países de la CONMEBOL. Restringido a jugadores con al menos 15 traducciones en Wikipedia y más de 5.000 vistas.',

    // Chart 4 — Scatter: share fútbol vs antigüedad de clubes
    'c4-title':              'Sudamérica: clubes muy antiguos y talento monopolizado por el fútbol',
    'c4-subtitle':           'En la región se combina una tradición institucional larga con una concentración inusual del talento deportivo en una sola disciplina.',
    // Neutral (cuando el usuario cambia selección/período/filtros).
    'c4-title-neutral':      'Antigüedad de los clubes y especialización en el fútbol',
    'c4-subtitle-neutral':   'Año mediano de fundación de los clubes vs. % del talento deportivo dedicado al fútbol.',
    'c4-axis-x':             '% del talento que se dedicó al fútbol',
    'c4-axis-x-tpl':         '% del talento deportivo masculino nacido entre {Y0} y {Y1} que se dedicó al fútbol',
    'c4-search-placeholder': 'Buscar país…',
    'c4-axis-y':             'Año mediano de fundación de los clubes',
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
    'c4-sources':            'Eje X: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> edición 2025 — deportistas físicos notables por país de nacimiento. El toggle "+5.000 visitas en Wikipedia" filtra figuras con muy pocas lecturas reales (sobre todo, J-League menores que inflan el conteo japonés). Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',
    // Versión SIN la mención del toggle — usada en el PNG cuando el filtro
    // de visitas está desactivado (default).
    'c4-sources-no-filter':  'Eje X: Pantheon (MIT Media Lab) edición 2025 — deportistas físicos notables por país de nacimiento. Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',
    // Versión CON el filtro aplicado — usada en el PNG cuando el toggle ON.
    'c4-sources-with-filter':'Eje X: Pantheon (MIT Media Lab) edición 2025 — deportistas físicos notables por país de nacimiento, filtrados a perfiles con más de 5.000 visitas en Wikipedias no-inglesas. Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',

    // Chart 3 — Mapa coroplético "antigüedad de los clubes"
    'c3-title':              'Dónde nació el fútbol moderno',
    'c3-subtitle':           'Año mediano de fundación de los clubes de cada país. Tonos más oscuros = tradición futbolística más profunda.',
    // Subtítulo más corto para el PNG (la leyenda ya explica el color).
    'c3-subtitle-png':       'Año mediano de fundación de los clubes de cada país',
    'c3-search-placeholder': 'Buscar país…',
    'c3-legend-label':       'Año mediano',
    'c3-legend-nodata':      'Sin dato',
    'c3-reset-zoom':         'Restablecer zoom',
    'c3-tt-year':            'Año mediano (pond.)',
    'c3-tt-clubs':           'Clubes',
    'c3-tt-with-date':       'Con fecha de creación identificada',
    'c3-tt-nodata':          'Sin clubes en el universo Wikidata',
    'c3-sources':            'Año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',

    // Chart 5 — Line chart "trayectorias Elo"
    'c5-title':              'Trayectorias de las selecciones',
    'c5-subtitle-rank':      'Posición en el ranking mundial de selecciones según su rating Elo.',
    'c5-subtitle-elo':       'Rating Elo de las selecciones nacionales a lo largo del tiempo.',
    'c5-mode-label':         'Eje Y',
    'c5-mode-rank':          'Ranking',
    'c5-mode-elo':           'Elo',
    'c5-slider-period-label':'Período',
    'c5-search-placeholder': 'Buscar selección…',
    'c5-axis-y-rank':        'Posición en el ranking',
    'c5-axis-y-elo':         'Puntaje Elo',
    'c5-sources':            'Datos: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (rating Elo de selecciones nacionales, valor al cierre de cada año —al 31 de diciembre; 2026, al 6 de junio—; serie 1901-2026). La "posición en el ranking" es el ranking mundial de eloratings.net. Confederaciones según afiliación FIFA actual.',
    'c5-sources-tpl':        'Datos: eloratings.net (rating Elo de selecciones nacionales, valor al cierre de cada año).',

    // Index del número (landing)
    'index-see':             'Ver gráfico →',
    'index-paper-kicker':    'Nota técnica',
    'index-paper-title':     'La excepcionalidad futbolística sudamericana: antigüedad, monopolio del talento y un residuo persistente',
    'index-paper-go':        'Leer la nota →',
  },
  en: {
    'issue-num':  'N° 3',
    'page-title': 'Football doesn\'t bow to GDP',
    'page-lede':  'South America\'s footballing exceptionalism — strong national teams from relatively small economies — remains a statistical oddity.',

    // Chart 1 — Scatter ELO vs total GDP
    'c1-title':            'South America plays in a different league',
    'c1-subtitle':         'CONMEBOL\'s 10 national teams play better than what their economy\'s size would predict.',
    'c1-title-neutral':    'Footballing strength and economy size',
    'c1-subtitle-neutral': 'Each team\'s average Elo rating against the country\'s total GDP.',
    'c1-axis-x':           'GDP',
    'c1-axis-y':           'Footballing strength index',
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
    'footer-download-svg':   'Download SVG',
    'c1-sources':            'Data: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo of national teams, year-end value) and IMF — World Economic Outlook (total GDP PPP, constant international USD). Values show the average over the selected period for both variables.',
    'c1-sources-tpl':        'Data: eloratings.net (Elo of national teams, year-end value) and IMF — World Economic Outlook (total GDP PPP, constant international USD). Values show the {period} average for both variables.',

    // Chart 2 — Footballing talent per million inhabitants
    'c2-title':              'Uruguay produces more famous footballers per capita than any country in the world',
    'c2-title-neutral':      'Footballing talent adjusted for population',
    'c2-subtitle':           'Footballers in the global top by HPI (Pantheon MIT, minimum global visibility) divided by the country\'s average population over the selected birth-year period.',
    'c2-subtitle-tpl':       'Famous footballers in the global top {N} born between {Y0} and {Y1}, per million inhabitants.',
    'c2-axis-x':             'Famous footballers per million inhabitants',
    'c2-slider-label':       'Birth year',
    'c2-topn-label':         'Global top',
    'c2-search-placeholder': 'Search country…',
    'c2-tt-count':           'Famous footballers',
    'c2-tt-pop':             'Average population',
    'c2-tt-rate':            'Famous footballers per million',
    'c2-sources':            'Data: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> — Wikipedia memorable figures with HPI (Historical Popularity Index), 2025 release, filtered to occupation SOCCER PLAYER and male gender. Restricted to players with at least 15 Wikipedia translations and 5,000 views on non-English Wikipedias, to avoid the bias from Wikidata-autogenerated articles (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> for annual population. Country of birth per Pantheon. In terracotta, CONMEBOL (South American) countries.',
    'c2-sources-tpl':        'Data: Pantheon (MIT Media Lab) and Our World in Data — footballers in the global top {N} by their Historical Popularity Index (HPI), born between {Y0} and {Y1}, per million inhabitants. In terracotta, CONMEBOL (South American) countries. Restricted to players with at least 15 Wikipedia translations and more than 5,000 views.',

    // Chart 4 — Scatter: football share vs club age
    'c4-title':              'South America: very old clubs and talent monopolised by football',
    'c4-subtitle':           'The region combines a long institutional tradition with an unusual concentration of sporting talent in a single discipline.',
    'c4-title-neutral':      'Club age and specialization in football',
    'c4-subtitle-neutral':   'Median founding year of clubs vs. % of sports talent devoted to football.',
    'c4-axis-x':             '% of talent that chose football',
    'c4-axis-x-tpl':         '% of male sports talent born between {Y0} and {Y1} who became footballers',
    'c4-search-placeholder': 'Search country…',
    'c4-axis-y':             'Median founding year of clubs',
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
    'c4-sources':            'X axis: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (MIT Media Lab)</a> 2025 release — notable physical athletes by birth country. The "+5,000 Wikipedia views" toggle filters figures with very few actual reads (mainly lower-tier J-League players that inflate Japan\'s count). Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',
    'c4-sources-no-filter':  'X axis: Pantheon (MIT Media Lab) 2025 release — notable physical athletes by birth country. Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',
    'c4-sources-with-filter':'X axis: Pantheon (MIT Media Lab) 2025 release — notable physical athletes by birth country, filtered to profiles with more than 5,000 views on non-English Wikipedias. Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',

    // Chart 3 — Choropleth map "age of clubs"
    'c3-title':              'Where modern football was born',
    'c3-subtitle':           'Median founding year of each country\'s clubs. Darker tones = deeper footballing tradition.',
    'c3-subtitle-png':       'Median founding year of each country\'s clubs',
    'c3-search-placeholder': 'Search country…',
    'c3-legend-label':       'Median year',
    'c3-legend-nodata':      'No data',
    'c3-reset-zoom':         'Reset zoom',
    'c3-tt-year':            'Median year (weighted)',
    'c3-tt-clubs':           'Clubs',
    'c3-tt-with-date':       'With identified founding date',
    'c3-tt-nodata':          'No clubs in the Wikidata universe',
    'c3-sources':            'Median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',

    // Chart 5 — Line chart "Elo trajectories"
    'c5-title':              'National team trajectories',
    'c5-subtitle-rank':      'World ranking position of national teams by their Elo rating.',
    'c5-subtitle-elo':       'Elo rating of national teams over time.',
    'c5-mode-label':         'Y axis',
    'c5-mode-rank':          'Ranking',
    'c5-mode-elo':           'Elo',
    'c5-slider-period-label':'Period',
    'c5-search-placeholder': 'Search team…',
    'c5-axis-y-rank':        'World ranking position',
    'c5-axis-y-elo':         'Elo rating',
    'c5-sources':            'Data: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo ratings of national teams, year-end value —December 31; 2026 as of June 6—; 1901-2026). "Ranking position" is the eloratings.net world ranking. Confederations per current FIFA affiliation.',
    'c5-sources-tpl':        'Data: eloratings.net (Elo rating of national teams, year-end value).',

    // Issue index (landing)
    'index-see':             'View chart →',
    'index-paper-kicker':    'Technical note',
    'index-paper-title':     'South American footballing exceptionalism: club age, talent monopoly and a persistent residual',
    'index-paper-go':        'Read the note →',
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
