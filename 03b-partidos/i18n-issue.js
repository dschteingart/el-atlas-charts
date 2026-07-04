// Strings del Especial "La geografía de los partidos de fútbol" + helpers i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según su chart.
//
// Numeración de charts del especial:
//   1 actividad · 2 amistosos · 3 globalización · 4 duelos (red)
//   5 flujos (chord) · 6 ciudades (mapa) · 7 neutral

const ES_ESPECIAL_PARTIDOS = true;  // sentinel para png-export
const ISSUE_I18N = {
  es: {
    'issue-num':  'Especial',
    'page-title': 'La geografía de los partidos de fútbol',
    'page-lede':  'Quién juega contra quién, dónde y cuánto: 49.000 partidos de selecciones desde 1872. Compañero del N° 3, la geografía del talento.',

    // ---- Chart 1: actividad (partidos, selecciones activas, debutantes)
    'c1-title':            'El planeta se llenó de fútbol',
    'c1-title-neutral':    'La actividad del fútbol de selecciones',
    'c1-sub-partidos':     'Cantidad de partidos entre selecciones nacionales jugados por año.',
    'c1-sub-partidos-eq':  'Partidos jugados por cada selección por año.',
    'c1-sub-activas':      'Selecciones que jugaron al menos un partido en el año.',
    'c1-sub-debut':        'Selecciones que jugaron su primer partido internacional en cada año.',
    'c1-metric-label':     'Métrica',
    'c1-metric-partidos':  'Partidos por año',
    'c1-metric-activas':   'Selecciones activas',
    'c1-metric-debut':     'Debutantes',
    'c1-slider-period-label': 'Período',
    'c1-search-placeholder':      'Agregar selección…',
    'c1-search-placeholder-conf': 'Agregar confederación…',
    'c1-debut-filter-label': 'Confederación',
    'c1-axis-partidos':    'Partidos por año',
    'c1-axis-activas':     'Selecciones con actividad',
    'c1-axis-debut':       'Selecciones que debutan',
    'c1-serie-total':      'Mundo',
    'c1-tt-debut-mas':     'más',
    'c1-tt-debut-none':    'Sin debuts',
    'c1-sources':          'Datos: repo martj42/international_results (partidos internacionales 1872–junio 2026) y elaboración propia. Solo partidos entre miembros de la FIFA (219 selecciones históricas). Serie hasta 2025, último año completo.',
    'c1-sources-tpl':      'Datos: martj42/international_results y elaboración propia. Solo partidos entre miembros de la FIFA. Serie 1872–2025.',

    // ---- Chart 2: la muerte del amistoso
    'c2-title':            'La muerte del amistoso',
    'c2-subtitle':         'Los amistosos eran 4 de cada 10 partidos en los 80; hoy son menos de 3 de cada 10.',
    'c2-title-neutral':    'De qué se juega cuando se juega',
    'c2-subtitle-neutral': 'Composición del calendario internacional por tipo de partido.',
    'c2-mode-share':       'Porcentaje',
    'c2-mode-count':       'Cantidad',
    'c2-axis-share':       '% de los partidos del año',
    'c2-axis-count':       'Partidos por año',
    'c2-cat-Amistoso':     'Amistosos',
    'c2-cat-EliminatoriaMundial': 'Eliminatorias del Mundial',
    'c2-cat-Mundial':      'Mundial',
    'c2-cat-EliminatoriaContinental': 'Eliminatorias continentales',
    'c2-cat-CopaContinental': 'Copas continentales',
    'c2-cat-LigaNaciones': 'Ligas de Naciones',
    'c2-cat-Otros':        'Otros torneos',
    'c2-sources':          'Datos: martj42/international_results y elaboración propia. Copas continentales: Eurocopa, Copa América, Copa Africana, Copa Asiática, Copa de Oro y Copa de Oceanía (y sus eliminatorias). "Otros torneos": copas subregionales, juegos e invitacionales. Serie desde 1946, hasta 2025.',
    'c2-sources-tpl':      'Datos: martj42/international_results y elaboración propia. Serie 1946–2025.',

    // ---- Chart 3: el fútbol que no se globalizó
    'c3-title':            'El fútbol que no se globalizó',
    'c3-subtitle':         'Solo 15 de cada 100 partidos cruzan confederaciones. Igual que hace 60 años.',
    'c3-title-neutral':    'Partidos entre confederaciones',
    'c3-subtitle-neutral': 'Porcentaje de partidos jugados entre selecciones de confederaciones distintas.',
    'c3-legend-hint':      'Clic en una confederación para ver qué parte de su calendario es contra otras',
    'c3-axis-y':           '% de partidos entre confederaciones',
    'c3-serie-global':     'Mundo',
    'c3-sources':          'Datos: martj42/international_results y elaboración propia. Promedio móvil de 4 años (una ventana cubre un ciclo mundialista completo). La confederación de cada selección es la vigente en la fecha del partido (Australia pasó a la AFC en 2006, Israel a la UEFA en 1994, Kazajistán en 2002). Serie hasta 2025.',
    'c3-sources-tpl':      'Datos: martj42/international_results y elaboración propia. Promedio móvil de 4 años, serie hasta 2025.',

    // ---- Chart 4: la red de duelos
    'c4-title':            'Seis islas que casi no se tocan',
    'c4-subtitle':         'Cada línea une a dos selecciones que se enfrentaron muchas veces. Los continentes se ordenan solos.',
    'c4-title-neutral':    'La red de rivalidades del fútbol',
    'c4-subtitle-neutral': 'Selecciones unidas por la cantidad de partidos jugados entre sí.',
    'c4-period-all':       'Toda la historia',
    'c4-period-90':        'Desde 1990',
    'c4-slider-label':     'Duelos con al menos',
    'c4-slider-suffix':    'partidos',
    'c4-tt-partidos':      'partidos entre sí',
    'c4-hint':             'Pasá el cursor por una selección para ver sus rivales más frecuentes · Arrastrá para reacomodar',
    'c4-sources':          'Datos: martj42/international_results y elaboración propia. Cada línea une a dos selecciones con al menos el umbral elegido de partidos oficiales y amistosos entre sí (1872–junio 2026). El tamaño del nodo es su total de partidos; el color, su confederación actual.',
    'c4-sources-tpl':      'Datos: martj42/international_results y elaboración propia, 1872–jun 2026.',

    // ---- Chart 5: flujos entre confederaciones (chord)
    'c5-title':            'El 85% del fútbol se juega puertas adentro',
    'c5-subtitle':         'Partidos dentro de cada confederación y entre confederaciones.',
    'c5-title-neutral':    'Flujos de partidos entre confederaciones',
    'c5-subtitle-neutral': 'Partidos dentro de cada confederación y entre confederaciones.',
    'c5-period-all':       'Toda la historia',
    'c5-period-90':        'Desde 1990',
    'c5-tt-intra':         'partidos puertas adentro',
    'c5-tt-inter':         'partidos entre sí',
    'c5-hint':             'Pasá el cursor por un arco o una cinta para aislarlo',
    'c5-sources':          'Datos: martj42/international_results y elaboración propia. Los arcos son los partidos de cada confederación; las cintas, los partidos entre dos confederaciones. La confederación es la vigente en la fecha del partido.',
    'c5-sources-tpl':      'Datos: martj42/international_results y elaboración propia.',

    // ---- Chart 6: mapa de sedes
    'c6-title':            'Las capitales inesperadas del fútbol',
    'c6-subtitle':         'Kuala Lumpur, Bangkok y Doha organizaron más partidos internacionales que Londres.',
    'c6-title-neutral':    'Las sedes del fútbol internacional',
    'c6-subtitle-neutral': 'Ciudades según la cantidad de partidos internacionales que organizaron.',
    'c6-mode-all':         'Todos los partidos',
    'c6-mode-neutral':     'Solo cancha neutral',
    'c6-search-placeholder': 'Buscar ciudad…',
    'c6-tt-partidos':      'partidos',
    'c6-tt-neutrales':     'en cancha neutral',
    'c6-tt-periodo':       'Actividad',
    'c6-sources':          'Datos: martj42/international_results y elaboración propia, 1872–junio 2026. Ciudad administrativa tal como la registra la fuente (los conurbanos no se fusionan: Al Rayyan cuenta aparte de Doha). "Cancha neutral" = ninguno de los dos equipos jugaba de local. Cubre el 99% de los partidos; ~200 localidades chicas quedaron sin geocodificar.',
    'c6-sources-tpl':      'Datos: martj42/international_results y elaboración propia, 1872–jun 2026.',

    // ---- Chart 7: la era neutral
    'c7-title':            'El fútbol se muda a canchas ajenas',
    'c7-subtitle':         'Uno de cada tres partidos de los 2020s se juega en cancha neutral: el nivel más alto de la historia.',
    'c7-title-neutral':    'Partidos en cancha neutral',
    'c7-subtitle-neutral': 'Porcentaje de partidos internacionales jugados en cancha neutral.',
    'c7-axis-y':           '% de partidos en cancha neutral',
    'c7-serie-mm4':        'Promedio móvil 4 años',
    'c7-serie-anual':      'Dato anual',
    'c7-sources':          'Datos: martj42/international_results y elaboración propia. "Cancha neutral" = ninguno de los dos equipos jugaba de local (torneos en sede fija, amistosos en países terceros). Promedio móvil de 4 años; serie desde 1946, hasta 2025.',
    'c7-sources-tpl':      'Datos: martj42/international_results y elaboración propia. Serie 1946–2025.',

    // Confederaciones (chips, leyendas, tooltips)
    'conf.CONMEBOL': 'CONMEBOL', 'conf.UEFA': 'UEFA', 'conf.CONCACAF': 'CONCACAF',
    'conf.CAF': 'CAF', 'conf.AFC': 'AFC', 'conf.OFC': 'OFC',
    'conf-long.CONMEBOL': 'Sudamérica', 'conf-long.UEFA': 'Europa',
    'conf-long.CONCACAF': 'Norte y Centroamérica + Caribe', 'conf-long.CAF': 'África',
    'conf-long.AFC': 'Asia', 'conf-long.OFC': 'Oceanía',

    // Controles compartidos
    'ctrl-options':     'Opciones',
    'ctrl-select':      'Seleccionar',
    'ctrl-show-method': 'Ver metodología y fuentes',
    'chip-remove':      'Quitar',

    // Footer / index
    'footer-download':     'Descargar datos (CSV)',
    'footer-download-png': 'Descargar PNG',
    'attribution-text':    'El Atlas · Daniel Schteingart',
    'attribution-href':    'https://elatlas.substack.com',
    'index-see':           'Ver gráfico →',
    'index-charts-label':  'Gráficos interactivos',
    'index-companion':     'Este especial es el compañero de <a href="../03-futbol/index.html">El Atlas N° 3: la geografía del talento futbolístico</a>.',
  },

  en: {
    'issue-num':  'Special',
    'page-title': 'The geography of football matches',
    'page-lede':  'Who plays whom, where and how often: 49,000 international matches since 1872. Companion to No. 3, the geography of talent.',

    'c1-title':            'The planet filled up with football',
    'c1-title-neutral':    'International football activity',
    'c1-sub-partidos':     'Number of matches between national teams played each year.',
    'c1-sub-partidos-eq':  'Matches played by each team per year.',
    'c1-sub-activas':      'Teams that played at least one match that year.',
    'c1-sub-debut':        'Teams that played their first international match each year.',
    'c1-metric-label':     'Metric',
    'c1-metric-partidos':  'Matches per year',
    'c1-metric-activas':   'Active teams',
    'c1-metric-debut':     'Debuts',
    'c1-slider-period-label': 'Period',
    'c1-search-placeholder':      'Add team…',
    'c1-search-placeholder-conf': 'Add confederation…',
    'c1-debut-filter-label': 'Confederation',
    'c1-axis-partidos':    'Matches per year',
    'c1-axis-activas':     'Teams with activity',
    'c1-axis-debut':       'Debuting teams',
    'c1-serie-total':      'World',
    'c1-tt-debut-mas':     'more',
    'c1-tt-debut-none':    'No debuts',
    'c1-sources':          'Data: martj42/international_results repo (international matches 1872–June 2026), own elaboration. Only matches between FIFA members (219 historical teams). Series through 2025, the last complete year.',
    'c1-sources-tpl':      'Data: martj42/international_results, own elaboration. FIFA members only. Series 1872–2025.',

    'c2-title':            'The death of the friendly',
    'c2-subtitle':         'Friendlies were 4 in 10 matches in the 80s; today they are fewer than 3 in 10.',
    'c2-title-neutral':    'What gets played when teams play',
    'c2-subtitle-neutral': 'Composition of the international calendar by match type.',
    'c2-mode-share':       'Share',
    'c2-mode-count':       'Count',
    'c2-axis-share':       '% of matches that year',
    'c2-axis-count':       'Matches per year',
    'c2-cat-Amistoso':     'Friendlies',
    'c2-cat-EliminatoriaMundial': 'World Cup qualifiers',
    'c2-cat-Mundial':      'World Cup',
    'c2-cat-EliminatoriaContinental': 'Continental qualifiers',
    'c2-cat-CopaContinental': 'Continental cups',
    'c2-cat-LigaNaciones': 'Nations Leagues',
    'c2-cat-Otros':        'Other tournaments',
    'c2-sources':          'Data: martj42/international_results, own elaboration. Continental cups: Euro, Copa América, AFCON, Asian Cup, Gold Cup and OFC Nations Cup (and their qualifiers). "Other tournaments": sub-regional cups, games and invitationals. Series from 1946 through 2025.',
    'c2-sources-tpl':      'Data: martj42/international_results, own elaboration. Series 1946–2025.',

    'c3-title':            'The football that never globalized',
    'c3-subtitle':         'Only 15 in 100 matches cross confederations. Same as 60 years ago.',
    'c3-title-neutral':    'Matches between confederations',
    'c3-subtitle-neutral': 'Share of matches played between teams from different confederations.',
    'c3-legend-hint':      'Click a confederation to see how much of its calendar is played against the others',
    'c3-axis-y':           '% of matches between confederations',
    'c3-serie-global':     'World',
    'c3-sources':          'Data: martj42/international_results, own elaboration. 4-year moving average (one window covers a full World Cup cycle). Each team\'s confederation is the one in force on the match date (Australia joined the AFC in 2006, Israel joined UEFA in 1994, Kazakhstan in 2002). Series through 2025.',
    'c3-sources-tpl':      'Data: martj42/international_results, own elaboration. 4-year moving average, series through 2025.',

    'c4-title':            'Six islands that barely touch',
    'c4-subtitle':         'Each line links two teams that met many times. The continents sort themselves out.',
    'c4-title-neutral':    'The network of football rivalries',
    'c4-subtitle-neutral': 'Teams linked by the number of matches played against each other.',
    'c4-period-all':       'All time',
    'c4-period-90':        'Since 1990',
    'c4-slider-label':     'Fixtures with at least',
    'c4-slider-suffix':    'matches',
    'c4-tt-partidos':      'matches against each other',
    'c4-hint':             'Hover a team to see its most frequent rivals · Drag to rearrange',
    'c4-sources':          'Data: martj42/international_results, own elaboration. Each line links two teams with at least the chosen number of matches between them (1872–June 2026). Node size is total matches; color is current confederation.',
    'c4-sources-tpl':      'Data: martj42/international_results, own elaboration, 1872–Jun 2026.',

    'c5-title':            '85% of football is played indoors',
    'c5-subtitle':         'Matches within each confederation and between confederations.',
    'c5-title-neutral':    'Match flows between confederations',
    'c5-subtitle-neutral': 'Matches within each confederation and between confederations.',
    'c5-period-all':       'All time',
    'c5-period-90':        'Since 1990',
    'c5-tt-intra':         'matches within',
    'c5-tt-inter':         'matches between them',
    'c5-hint':             'Hover an arc or ribbon to isolate it',
    'c5-sources':          'Data: martj42/international_results, own elaboration. Arcs are each confederation\'s matches; ribbons, matches between two confederations. Confederation as of the match date.',
    'c5-sources-tpl':      'Data: martj42/international_results, own elaboration.',

    'c6-title':            'Football\'s unexpected capitals',
    'c6-subtitle':         'Kuala Lumpur, Bangkok and Doha have hosted more internationals than London.',
    'c6-title-neutral':    'The venues of international football',
    'c6-subtitle-neutral': 'Cities by number of international matches hosted.',
    'c6-mode-all':         'All matches',
    'c6-mode-neutral':     'Neutral venue only',
    'c6-search-placeholder': 'Search city…',
    'c6-tt-partidos':      'matches',
    'c6-tt-neutrales':     'at neutral venue',
    'c6-tt-periodo':       'Active',
    'c6-sources':          'Data: martj42/international_results, own elaboration, 1872–June 2026. Administrative city as recorded by the source (suburbs are not merged: Al Rayyan counts separately from Doha). "Neutral venue" = neither team played at home. Covers 99% of matches; ~200 small towns remain ungeocoded.',
    'c6-sources-tpl':      'Data: martj42/international_results, own elaboration, 1872–Jun 2026.',

    'c7-title':            'Football is moving to borrowed grounds',
    'c7-subtitle':         'One in three matches of the 2020s is played at a neutral venue: the highest level in history.',
    'c7-title-neutral':    'Matches at neutral venues',
    'c7-subtitle-neutral': 'Share of international matches played at neutral venues.',
    'c7-axis-y':           '% of matches at neutral venues',
    'c7-serie-mm4':        '4-year moving average',
    'c7-serie-anual':      'Annual figure',
    'c7-sources':          'Data: martj42/international_results, own elaboration. "Neutral venue" = neither team played at home (fixed-venue tournaments, friendlies in third countries). 4-year moving average; series from 1946 through 2025.',
    'c7-sources-tpl':      'Data: martj42/international_results, own elaboration. Series 1946–2025.',

    'conf.CONMEBOL': 'CONMEBOL', 'conf.UEFA': 'UEFA', 'conf.CONCACAF': 'CONCACAF',
    'conf.CAF': 'CAF', 'conf.AFC': 'AFC', 'conf.OFC': 'OFC',
    'conf-long.CONMEBOL': 'South America', 'conf-long.UEFA': 'Europe',
    'conf-long.CONCACAF': 'North & Central America + Caribbean', 'conf-long.CAF': 'Africa',
    'conf-long.AFC': 'Asia', 'conf-long.OFC': 'Oceania',

    'ctrl-options':     'Options',
    'ctrl-select':      'Select',
    'ctrl-show-method': 'See methodology and sources',
    'chip-remove':      'Remove',

    'footer-download':     'Download data (CSV)',
    'footer-download-png': 'Download PNG',
    'attribution-text':    'The Atlas · Daniel Schteingart',
    'attribution-href':    'https://atlasdevelopment.substack.com',
    'index-see':           'See chart →',
    'index-charts-label':  'Interactive charts',
    'index-companion':     'This special is the companion to <a href="../03-futbol/index.html">The Atlas No. 3: the geography of football talent</a>.',
  }
};

// Merge shared base (lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.es : {}), ...ISSUE_I18N.es },
  en: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.en : {}), ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || key;

// REGLA DE LA CASA: los nombres de paises/selecciones SIEMPRE en el idioma de
// la pagina. El dato viene en ingles; NOMBRES_ES (data-nombres.js) trae las
// traducciones que difieren. Fallback: el nombre tal cual viene.
function atlasCountryName(n) {
  if (LANG === 'es' && typeof NOMBRES_ES !== 'undefined' && NOMBRES_ES[n]) return NOMBRES_ES[n];
  return n;
}

// state global, indexado por chart (state[1] = actividad, ... state[7] = neutral)
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
