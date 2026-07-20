// Strings específicos del N°3 + helpers de i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según los charts que tenga.

//==================================================================
//  I18N — específico del N°3 "El fútbol y el desarrollo"
//==================================================================
const ISSUE_I18N = {
  es: {
    'issue-num':  'N° 3',
    'page-title': 'La geografía del talento futbolístico',
    'page-lede':  'Dónde nacen los jugadores, dónde juegan y por qué algunos países rinden muy por encima del tamaño de su economía.',

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
    'c1-sources':            'Datos: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo de selecciones nacionales, valor al cierre de cada año; el de 2026 es a junio, antes del Mundial) y FMI — World Economic Outlook (PIB total PPA, USD internacionales constantes). Los datos muestran el promedio del período seleccionado para ambas variables.',
    // Plantilla PLANA (sin <a>) para la nota del PNG: el hook
    // onBeforePngExportGetSourceText reemplaza {period} por los años reales
    // del slider, para que la nota diga explícitamente a qué promedio refiere.
    'c1-sources-tpl':        'Datos: eloratings.net (Elo de selecciones nacionales, valor al cierre de cada año; el de 2026 es a junio, antes del Mundial) y FMI — World Economic Outlook (PIB total PPA, USD internacionales constantes). Los datos muestran el promedio {period} para ambas variables.',

    // Chart 2 — Talento futbolístico por millón de habitantes
    'c2-title':              'Uruguay produce más futbolistas célebres per cápita que cualquier país del mundo',
    // Neutral (cuando el usuario cambia período/topN/selección): solo el
    // título cambia; el subtítulo ya es descriptivo.
    'c2-title-neutral':      'Talento futbolístico ajustado por población',
    'c2-group-label':        'Ver por',
    'c2-group-pais':         'País',
    'c2-group-region':       'Región',
    'c2-subtitle':           'Futbolistas en el top mundial por HPI (Pantheon Datawheel, con visibilidad global mínima) dividido por la población promedio del país en el período de nacimiento seleccionado.',
    'c2-subtitle-tpl':       'Futbolistas célebres del top {N} mundial nacidos entre {Y0} y {Y1} por millón de habitantes.',
    'c2-axis-x':             'Futbolistas célebres por millón de habitantes',
    'c2-slider-label':       'Año de nacimiento',
    'c2-topn-label':         'Top mundial',
    'c2-search-placeholder': 'Buscar país…',
    'c2-tt-count':           'Cantidad de futbolistas célebres',
    'c2-tt-pop':             'Población promedio',
    'c2-tt-rate':            'Futbolistas célebres por millón',
    'c2-sources':            'Datos: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (Datawheel)</a> — figuras memorables de Wikipedia con HPI (Historical Popularity Index), edición 2025, filtrado a la ocupación SOCCER PLAYER y al género masculino. Restringido a jugadores con al menos 15 traducciones en Wikipedia y 5.000 vistas en Wikipedias no-inglesas, para evitar el sesgo de artículos auto-generados en Wikidata (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> para población anual histórica. País de nacimiento según Pantheon. En terracota, países de la CONMEBOL.',
    // Plantilla PLANA y CORTA para la nota del PNG (estilizada). El hook
    // onBeforePngExportGetSourceText reemplaza {N}/{Y0}/{Y1} por el top N y los
    // años del slider. Aclara el color terracota. La metodología detallada
    // (filtro SOCCER PLAYER, sesgo J-League) queda en el footer del HTML.
    'c2-sources-tpl':        'Datos: Pantheon (Datawheel) y Our World in Data — futbolistas del top {N} mundial por su Historical Popularity Index (HPI), nacidos entre {Y0} y {Y1}, por millón de habitantes. En terracota, países de la CONMEBOL. Restringido a jugadores con al menos 15 traducciones en Wikipedia y más de 5.000 vistas.',

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
    'c4-sources':            'Eje X: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (Datawheel)</a> edición 2025 — deportistas físicos notables por país de nacimiento. El toggle "+5.000 visitas en Wikipedia" filtra figuras con muy pocas lecturas reales (sobre todo, J-League menores que inflan el conteo japonés). Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',
    // Versión SIN la mención del toggle — usada en el PNG cuando el filtro
    // de visitas está desactivado (default).
    'c4-sources-no-filter':  'Eje X: Pantheon (Datawheel) edición 2025 — deportistas físicos notables por país de nacimiento. Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',
    // Versión CON el filtro aplicado — usada en el PNG cuando el toggle ON.
    'c4-sources-with-filter':'Eje X: Pantheon (Datawheel) edición 2025 — deportistas físicos notables por país de nacimiento, filtrados a perfiles con más de 5.000 visitas en Wikipedias no-inglesas. Eje Y: año mediano de fundación de los clubes según Wikidata, ponderado por la relevancia global del club (medida a partir de la cantidad de idiomas a los que está traducido el artículo en Wikipedia).',

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
    'c5-layout-label':       'Vista',
    'c5-layout-overlay':     'Todas juntas',
    'c5-layout-multiples':   'Una por panel',
    'c5-slider-period-label':'Período',
    'c5-search-placeholder': 'Buscar selección…',
    'c5-axis-y-rank':        'Posición en el ranking',
    'c5-axis-y-elo':         'Puntaje Elo',
    'c5-sources':            'Datos: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (rating Elo de selecciones nacionales, valor al cierre de cada año —al 31 de diciembre; 2026, al 20 de julio—; serie 1901-2026). La "posición en el ranking" es el ranking mundial de eloratings.net. Inglaterra, Escocia, Gales e Irlanda del Norte van por separado (son miembros FIFA). Confederaciones según afiliación FIFA actual.',
    'c5-sources-tpl':        'Datos: eloratings.net (rating Elo de selecciones nacionales, valor al cierre de cada año; 2026, al 20 de julio).',

    // Index del número (landing)
    'index-see':             'Ver gráfico →',
    'index-paper-kicker':    'Nota técnica',
    'index-paper-title':     'La excepcionalidad futbolística sudamericana: antigüedad, monopolio del talento y un residuo persistente',
    'index-paper-go':        'Leer la nota →',
    'index-mundiales-label': 'Mundial 2026 · anexo',
    'index-mundiales-sub':   'Gráficos exploratorios sobre cómo cambiaron los mundialistas entre 1930 y 2026.',
    'index-c6-kicker':       'Nacimiento',
    'index-c7-kicker':       'Clubes',
    'index-c8-kicker':       'Cunas',

    // Chart 6 — Natividad de los mundialistas (anexo: mundiales)
    'c6-title':              'Cada vez más mundialistas nacieron fuera del país que representan',
    'c6-subtitle':           'Porcentaje de jugadores de cada Mundial nacidos en el país que representan.',
    'c6-axis-y':             '% de jugadores nacidos en el país',
    'c6-label-in':           'Nacidos en el país',
    'c6-label-out':          'Nacidos en otro país',
    'c6-label-avg':          'Promedio mundial',
    'c6-slider-period-label':'Mundiales',
    'c6-search-placeholder': 'Agregar selección…',
    'c6-sources':            'Datos: base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022), Pantheon y Wikidata para el lugar de nacimiento, y FC Maps para 2026. Un jugador cuenta como "nacido en el país" si su lugar de nacimiento coincide con la selección que representa.',
    'c6-sources-tpl':        'Datos: base jfjelstul/worldcup + Pantheon/Wikidata (lugar de nacimiento) + FC Maps (2026).',

    // Chart 7 — Ligas de destino de los mundialistas (anexo: mundiales)
    'c7-title':              'Dónde juegan su fútbol de clubes los mundialistas',
    'c7-subtitle':           'Porcentaje de jugadores de cada Mundial según el país donde está radicado su club.',
    'c7-axis-y':             '% de mundialistas (según país del club)',
    'c7-label-europa':       'En Europa (total)',
    'c7-europa-toggle':      'En Europa (total)',
    'c7-mode-line':          'Líneas',
    'c7-mode-stack':         'Área apilada',
    'c7-label-otros':        'Otras ligas',
    'c7-slider-period-label':'Mundiales',
    'c7-search-placeholder': 'Agregar país de liga…',
    'c7-sources':            'Datos: base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022) + Wikidata/Transfermarkt para los clubes, y FC Maps para 2026. El club se asigna al país donde está radicado; el Reino Unido va separado por nación futbolística (la Premier League cuenta como Inglaterra, distinta de la liga escocesa). El salto 2022→2026 incluye la ampliación del Mundial a 48 selecciones.',
    'c7-sources-tpl':        'Datos: jfjelstul/worldcup + Wikidata/Transfermarkt (clubes) + FC Maps (2026). Reino Unido separado por nación (Inglaterra/Escocia).',

    'c9-title':              'La migración en el fútbol mundial',
    'c9-subtitle-all':       'Porcentaje de los jugadores de cada Mundial según su país de nacimiento.',
    'c9-subtitle-exp':       'Mundialistas nacidos en cada país pero que representan a otra selección, como % de los "exportados" de ese Mundial.',
    'c9-axis-y-all':         '% de mundialistas (según país de nacimiento)',
    'c9-axis-y-exp':         '% de los mundialistas "exportados"',
    'c9-axis-n-all':         'Mundialistas (cantidad)',
    'c9-axis-n-exp':         'Mundialistas "exportados" (cantidad)',
    'c9-metric-pct':         '%',
    'c9-metric-abs':         'Cantidad',
    'c9-univ-all':           'Todos',
    'c9-univ-exp':           'Exportados',
    'c9-unit-uniq':          'Jugadores únicos',
    'c9-unit-apps':          'Apariciones',
    'c9-group-pais':         'País',
    'c9-group-region':       'Región',
    'c9-mode-line':          'Líneas',
    'c9-mode-stack':         'Área apilada',
    'c9-mode-bar':           'Barras',
    'c9-mode-sankey':        'Flujos',
    'c9-bar-wc':             'Mundial',
    'c9-sankey-otros':       'Otros',
    'c9-sankey-empty':       'Sin "exportados" en este Mundial.',
    'c9-sankey-jug1':        'jugador',
    'c9-sankey-jugN':        'jugadores',
    'c9-sankey-more':        'más',
    'c9-slider-period-label':'Mundiales',
    'c9-search-placeholder': 'Agregar país de nacimiento…',
    'c9-label-otros':        'Otros',
    'c9-sources':            'Datos: base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022) + Pantheon/Wikidata para el lugar de nacimiento, y FC Maps para 2026. Un jugador cuenta como "exportado" si nació en un país distinto al que representa. El salto 2022→2026 incluye la ampliación del Mundial a 48 selecciones.',
    'c9-sources-tpl':        'Datos: jfjelstul/worldcup + Pantheon/Wikidata (nacimiento) + FC Maps (2026).\n"Exportado" = nació en otro país del que representa.',

    // Chart 10 — Evolución de la altura de los mundialistas
    'c10-title':              'Los mundialistas son cada vez más altos',
    'c10-title-neutral':      'La altura de los mundialistas',
    'c10-subtitle':           'Altura promedio de los mundialistas vs. el varón promedio de su país de nacimiento y generación, en cada Mundial.',
    'c10-axis-y':             'Altura (cm)',
    'c10-real':               'Mundialistas',
    'c10-exp':                'Varón promedio de los países mundialistas',
    'c10-exp-one':            'Varón promedio del país',
    'c10-exp-sfx':            ' · varón prom.',
    'c10-hint':               'El «Mundial» es el promedio de todos los mundialistas. Agregá una selección para compararla con él.',
    'c10-mode-line':          'Líneas',
    'c10-mode-box':           'Distribución',
    'c10-mode-bar':           'Barras',
    'c10-mode-scatter':       'Dispersión',
    'c10-sc-axis-x':          'Altura del país (varón promedio, cm)',
    'c10-sc-axis-y':          'Altura del plantel (cm)',
    'c10-sc-diag':            'plantel = país',
    'c10-sc-empty':           'Sin datos suficientes para este Mundial.',
    'c10-barpos-all':         'Todos',
    'c10-bar-empty':          'Sin datos para este Mundial.',
    'c10-group-total':        'Total',
    'c10-group-pos':          'Por puesto',
    'c10-group-team':         'Por selección',
    'c10-vscountry':          'vs. varón promedio',
    'c10-view-sel':           'Selecciones',
    'c10-view-pos':           'Por puesto',
    'c10-pos-GK':             'Arqueros',
    'c10-pos-DEF':            'Defensores',
    'c10-pos-MID':            'Medios',
    'c10-pos-FWD':            'Delanteros',
    'c10-box-median':         'mediana',
    'c10-box-range':          'mín–máx',
    'c10-slider-period-label':'Mundiales',
    'c10-search-placeholder': 'Agregar selección…',
    'c10-sources':            'Datos: altura y plantel de la base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022) + FC Maps (2026). Altura esperada = altura media de varones del país de nacimiento de cada jugador en su año de nacimiento (NCD-RisC vía Our World in Data, 1896-1996; los nacidos después se extrapolan). Curazao usa Países Bajos como proxy.',
    'c10-sources-tpl':        'Datos: jfjelstul/worldcup + FC Maps (2026). Altura esperada = altura media de varones del país y año de nacimiento (NCD-RisC vía OWID).\nCurazao usa Países Bajos como proxy.',
    // Chart 12 — Edad promedio de los mundialistas (clon reducido de altura, sin la capa esperada)
    'c12-title':              'Los mundialistas son cada vez más veteranos',
    'c12-title-neutral':      'La edad de los mundialistas',
    'c12-subtitle':           'Edad promedio de los mundialistas en cada Mundial.',
    'c12-axis-y':             'Edad (años)',
    'c12-real':               'Mundialistas',
    'c12-mode-line':          'Líneas',
    'c12-mode-box':           'Distribución',
    'c12-mode-bar':           'Barras',
    'c12-view-sel':           'Selecciones',
    'c12-view-pos':           'Por puesto',
    'c12-barpos-all':         'Todos',
    'c12-bar-empty':          'Sin datos para este Mundial.',
    'c12-pos-GK':             'Arqueros',
    'c12-pos-DEF':            'Defensores',
    'c12-pos-MID':            'Medios',
    'c12-pos-FWD':            'Delanteros',
    'c12-box-median':         'mediana',
    'c12-box-range':          'mín–máx',
    'c12-slider-period-label':'Mundiales',
    'c12-search-placeholder': 'Agregar selección…',
    'c12-hint':               'El «Mundial» es el promedio de todos los mundialistas. Agregá una selección para compararla con él.',
    'c12-sources':            'Datos: edad y plantel de la base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022) + FC Maps (2026). La edad es la de cada jugador al inicio de su Mundial.',
    'c12-sources-tpl':        'Datos: jfjelstul/worldcup + FC Maps (2026). La edad es la de cada jugador al inicio de su Mundial.',

    // Chart 11 — DTs (nacionalidad del entrenador + migración del banquillo)
    'c11-title':              'Cada vez más selecciones tienen un DT extranjero',
    'c11-title-neutral':      'La migración de los técnicos',
    'c11-title-arg':          'Argentina, la mayor exportadora de técnicos del mundo',
    'c11-title-arg-birth':    'Argentina y Francia, las mayores fábricas de técnicos del mundo',
    'c11-mode-trend':         'Local vs. extranjero',
    'c11-trend-local':        'DT local',
    'c11-trend-foreign':      'DT extranjero',
    'c11-trend-axis':         '% de las selecciones',
    'c11-subtitle-all':       'Porcentaje de selecciones de cada Mundial dirigidas por un DT de la misma nacionalidad vs. uno extranjero.',
    'c11-subtitle-exp':       'DTs que dirigen a una selección de un país distinto al que nacieron, como % de los "exportados" de ese Mundial.',
    'c11-axis-y-all':         '% de DTs (según país de nacimiento)',
    'c11-axis-y-exp':         '% de los DTs "exportados"',
    'c11-axis-n-all':         'DTs (cantidad)',
    'c11-axis-n-exp':         'DTs "exportados" (cantidad)',
    'c11-metric-pct':         '%',
    'c11-metric-abs':         'Cantidad',
    'c11-crit-birth':         'Por nacimiento',
    'c11-crit-nat':           'Por nacionalidad',
    'c11-univ-all':           'Todos',
    'c11-univ-exp':           'Exportados',
    'c11-group-pais':         'País',
    'c11-group-region':       'Región',
    'c11-mode-line':          'Líneas',
    'c11-mode-stack':         'Área apilada',
    'c11-mode-bar':           'Barras',
    'c11-mode-sankey':        'Flujos',
    'c11-bar-wc':             'Mundial',
    'c11-sankey-otros':       'Otros',
    'c11-sankey-empty':       'Sin DTs «exportados» en el período elegido.',
    'c11-sankey-dt1':         'DT',
    'c11-sankey-dtN':         'DTs',
    'c11-sankey-more':        'más',
    'c11-slider-period-label':'Mundiales',
    'c11-search-placeholder': 'Agregar país de nacimiento…',
    'c11-label-otros':        'Otros',
    'c11-sources':            'Datos: directores técnicos de cada Mundial masculino (1930-2022) de <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a>; con el toggle, cada DT se atribuye por nacionalidad (de jfjelstul) o por país de nacimiento (de Wikidata); los de 2026 son los actuales (Wikipedia), un Mundial aún no jugado. Un DT cuenta como "extranjero" si dirige a una selección de un país distinto al suyo. Si una selección cambió de DT durante el torneo, cuentan ambos.',
    'c11-sources-tpl':        'Datos: jfjelstul/worldcup (DTs por Mundial); atribución por nacionalidad (jfjelstul) o país de nacimiento (Wikidata); 2026 actuales (Wikipedia).\n"Exportado" = un DT que dirige a una selección de un país distinto al suyo.',
    'c11-sources-tpl-foreign':'Datos: jfjelstul/worldcup (DTs por Mundial); atribución por nacionalidad (jfjelstul) o país de nacimiento (Wikidata); 2026 actuales (Wikipedia).\n"Extranjero" = un DT que dirige a una selección de un país distinto al suyo.',

    // Chart 8 — Lugares de nacimiento de los mundialistas (anexo: mundiales)
    'c8-title':              'De dónde salen los mundialistas',
    'c8-subtitle':           'Ciudad de nacimiento de los jugadores de cada Mundial.',
    'c8-tab-map':            'Mapa',
    'c8-tab-bars':           'Ranking',
    'c8-slider-label':       'Mundiales',
    'c8-heat-toggle':        'Mapa de calor',
    'c8-style-hex':          'Hexágonos',
    'c8-style-fine':         'Finos',
    'c8-style-glow':         'Iluminación',
    'c8-reset-zoom':         'Restablecer zoom',
    'c8-scope-all':          'Todos los Mundiales (1930-2026)',
    'c8-scope-year':         'Mundial de',
    'c8-scope-range':        'Mundiales',
    'c8-legend-size':        'Jugadores nacidos ahí',
    'c8-legend-apps':        'Apariciones en Mundiales',
    'c8-unit-uniq':          'Jugadores únicos',
    'c8-unit-apps':          'Apariciones',
    'c8-noun-1':             'jugador',
    'c8-noun-n':             'jugadores',
    'c8-noun-apps-1':        'aparición',
    'c8-noun-apps-n':        'apariciones',
    'c8-tip-all':            '(todos los Mundiales)',
    'c8-tip-year':           'en el Mundial',
    'c8-tip-range':          'en los Mundiales',
    'c8-sources':            'Datos: base de mundialistas <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> (1930-2022) + FC Maps para 2026; lugar de nacimiento (ciudad y coordenadas) de Wikidata y Pantheon. "Todos los Mundiales" cuenta jugadores únicos; al elegir un Mundial se cuentan los jugadores de ese plantel.',
    'c8-sources-tpl':        'Datos: jfjelstul/worldcup + FC Maps (2026); lugar de nacimiento de Wikidata/Pantheon.',
  },
  en: {
    'issue-num':  'N° 3',
    'page-title': 'The geography of football talent',
    'page-lede':  'Where players are born, where they play, and why some countries punch far above the size of their economy.',

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
    'c1-sources':            'Data: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo of national teams, year-end value; the 2026 figure is as of June, before the World Cup) and IMF — World Economic Outlook (total GDP PPP, constant international USD). Values show the average over the selected period for both variables.',
    'c1-sources-tpl':        'Data: eloratings.net (Elo of national teams, year-end value; the 2026 figure is as of June, before the World Cup) and IMF — World Economic Outlook (total GDP PPP, constant international USD). Values show the {period} average for both variables.',

    // Chart 2 — Footballing talent per million inhabitants
    'c2-title':              'Uruguay produces more famous footballers per capita than any country in the world',
    'c2-title-neutral':      'Footballing talent adjusted for population',
    'c2-group-label':        'View by',
    'c2-group-pais':         'Country',
    'c2-group-region':       'Region',
    'c2-subtitle':           'Footballers in the global top by HPI (Pantheon Datawheel, minimum global visibility) divided by the country\'s average population over the selected birth-year period.',
    'c2-subtitle-tpl':       'Famous footballers in the global top {N} born between {Y0} and {Y1}, per million inhabitants.',
    'c2-axis-x':             'Famous footballers per million inhabitants',
    'c2-slider-label':       'Birth year',
    'c2-topn-label':         'Global top',
    'c2-search-placeholder': 'Search country…',
    'c2-tt-count':           'Famous footballers',
    'c2-tt-pop':             'Average population',
    'c2-tt-rate':            'Famous footballers per million',
    'c2-sources':            'Data: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (Datawheel)</a> — Wikipedia memorable figures with HPI (Historical Popularity Index), 2025 release, filtered to occupation SOCCER PLAYER and male gender. Restricted to players with at least 15 Wikipedia translations and 5,000 views on non-English Wikipedias, to avoid the bias from Wikidata-autogenerated articles (J-League). <a href="https://ourworldindata.org/grapher/population" target="_blank" rel="noopener">Our World in Data</a> for annual population. Country of birth per Pantheon. In terracotta, CONMEBOL (South American) countries.',
    'c2-sources-tpl':        'Data: Pantheon (Datawheel) and Our World in Data — footballers in the global top {N} by their Historical Popularity Index (HPI), born between {Y0} and {Y1}, per million inhabitants. In terracotta, CONMEBOL (South American) countries. Restricted to players with at least 15 Wikipedia translations and more than 5,000 views.',

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
    'c4-sources':            'X axis: <a href="https://pantheon.world" target="_blank" rel="noopener">Pantheon (Datawheel)</a> 2025 release — notable physical athletes by birth country. The "+5,000 Wikipedia views" toggle filters figures with very few actual reads (mainly lower-tier J-League players that inflate Japan\'s count). Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',
    'c4-sources-no-filter':  'X axis: Pantheon (Datawheel) 2025 release — notable physical athletes by birth country. Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',
    'c4-sources-with-filter':'X axis: Pantheon (Datawheel) 2025 release — notable physical athletes by birth country, filtered to profiles with more than 5,000 views on non-English Wikipedias. Y axis: median founding year of each country\'s clubs (Wikidata), weighted by each club\'s global relevance (measured as the number of languages with a Wikipedia article).',

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
    'c5-layout-label':       'View',
    'c5-layout-overlay':     'All together',
    'c5-layout-multiples':   'One per panel',
    'c5-slider-period-label':'Period',
    'c5-search-placeholder': 'Search team…',
    'c5-axis-y-rank':        'World ranking position',
    'c5-axis-y-elo':         'Elo rating',
    'c5-sources':            'Data: <a href="https://www.eloratings.net" target="_blank" rel="noopener">eloratings.net</a> (Elo ratings of national teams, year-end value —December 31; 2026 as of July 20—; 1901-2026). "Ranking position" is the eloratings.net world ranking. England, Scotland, Wales and Northern Ireland are shown separately (all FIFA members). Confederations per current FIFA affiliation.',
    'c5-sources-tpl':        'Data: eloratings.net (Elo ratings of national teams, year-end value; 2026 as of July 20).',

    // Issue index (landing)
    'index-see':             'View chart →',
    'index-paper-kicker':    'Technical note',
    'index-paper-title':     'South American footballing exceptionalism: club age, talent monopoly and a persistent residual',
    'index-paper-go':        'Read the note →',
    'index-mundiales-label': '2026 World Cup · annex',
    'index-mundiales-sub':   'Exploratory charts on how World Cup squads changed between 1930 and 2026.',
    'index-c6-kicker':       'Birthplace',
    'index-c7-kicker':       'Clubs',
    'index-c8-kicker':       'Birthplaces',

    // Chart 6 — World Cup players' nativity (annex: World Cups)
    'c6-title':              'More and more World Cup players were born outside the country they represent',
    'c6-subtitle':           'Share of each World Cup\'s players born in the country they represent.',
    'c6-axis-y':             '% of players born in their country',
    'c6-label-in':           'Born in the country',
    'c6-label-out':          'Born abroad',
    'c6-label-avg':          'World Cup average',
    'c6-slider-period-label':'World Cups',
    'c6-search-placeholder': 'Add a team…',
    'c6-sources':            'Data: <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> database (1930-2022), Pantheon and Wikidata for birthplaces, and FC Maps for 2026. A player counts as "born in the country" if their birthplace matches the team they represent.',
    'c6-sources-tpl':        'Data: jfjelstul/worldcup + Pantheon/Wikidata (birthplaces) + FC Maps (2026).',

    // Chart 7 — Where World Cup players play their club football (annex: World Cups)
    'c7-title':              'Where the World Cup players play their club football',
    'c7-subtitle':           'Share of each World Cup\'s players by the country where their club is based.',
    'c7-axis-y':             '% of World Cup players (by club country)',
    'c7-label-europa':       'In Europe (total)',
    'c7-europa-toggle':      'In Europe (total)',
    'c7-mode-line':          'Lines',
    'c7-mode-stack':         'Stacked area',
    'c7-label-otros':        'Other leagues',
    'c7-slider-period-label':'World Cups',
    'c7-search-placeholder': 'Add a league country…',
    'c7-sources':            'Data: <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> squads (1930-2022) + Wikidata/Transfermarkt for clubs, and FC Maps for 2026. A club is assigned to the country where it is based; the UK is split by football nation (the Premier League counts as England, separate from the Scottish league). The 2022→2026 jump also reflects the World Cup\'s expansion to 48 teams.',
    'c7-sources-tpl':        'Data: jfjelstul/worldcup + Wikidata/Transfermarkt (clubs) + FC Maps (2026). UK split by nation (England/Scotland).',

    'c9-title':              'Migration in world football',
    'c9-subtitle-all':       'Share of each World Cup\'s players by country of birth.',
    'c9-subtitle-exp':       'Players born in each country but representing a different national team, as a share of that World Cup\'s "exported" players.',
    'c9-axis-y-all':         '% of World Cup players (by country of birth)',
    'c9-axis-y-exp':         '% of "exported" World Cup players',
    'c9-axis-n-all':         'World Cup players (count)',
    'c9-axis-n-exp':         '"Exported" World Cup players (count)',
    'c9-metric-pct':         '%',
    'c9-metric-abs':         'Count',
    'c9-univ-all':           'All',
    'c9-univ-exp':           'Exported',
    'c9-unit-uniq':          'Unique players',
    'c9-unit-apps':          'Appearances',
    'c9-group-pais':         'Country',
    'c9-group-region':       'Region',
    'c9-mode-line':          'Lines',
    'c9-mode-stack':         'Stacked area',
    'c9-mode-bar':           'Bars',
    'c9-mode-sankey':        'Flows',
    'c9-bar-wc':             'World Cup',
    'c9-sankey-otros':       'Others',
    'c9-sankey-empty':       'No "exported" players in this World Cup.',
    'c9-sankey-jug1':        'player',
    'c9-sankey-jugN':        'players',
    'c9-sankey-more':        'more',
    'c9-slider-period-label':'World Cups',
    'c9-search-placeholder': 'Add a country of birth…',
    'c9-label-otros':        'Others',
    'c9-sources':            'Data: <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> squads (1930-2022) + Pantheon/Wikidata for birthplace, and FC Maps for 2026. A player counts as "exported" if born in a country other than the one they represent. The 2022→2026 jump also reflects the World Cup\'s expansion to 48 teams.',
    'c9-sources-tpl':        'Data: jfjelstul/worldcup + Pantheon/Wikidata (birthplace) + FC Maps (2026).\n"Exported" = born in a country other than the one represented.',

    // Chart 10 — Evolution of World Cup players' height
    'c10-title':              'World Cup players keep getting taller',
    'c10-title-neutral':      'The height of World Cup players',
    'c10-subtitle':           'Average height of World Cup players vs. the average man of their birth country and cohort, World Cup by World Cup.',
    'c10-axis-y':             'Height (cm)',
    'c10-real':               'World Cup players',
    'c10-exp':                'Average man of World Cup countries',
    'c10-exp-one':            'Average man of the country',
    'c10-exp-sfx':            ' · avg. man',
    'c10-hint':               '“World Cup players” is the average of all players. Add a team to compare it against.',
    'c10-mode-line':          'Lines',
    'c10-mode-box':           'Distribution',
    'c10-mode-bar':           'Bars',
    'c10-mode-scatter':       'Scatter',
    'c10-sc-axis-x':          'Country height (average man, cm)',
    'c10-sc-axis-y':          'Squad height (cm)',
    'c10-sc-diag':            'squad = country',
    'c10-sc-empty':           'Not enough data for this World Cup.',
    'c10-barpos-all':         'All',
    'c10-bar-empty':          'No data for this World Cup.',
    'c10-group-total':        'Total',
    'c10-group-pos':          'By position',
    'c10-group-team':         'By team',
    'c10-vscountry':          'vs. average man',
    'c10-view-sel':           'Teams',
    'c10-view-pos':           'By position',
    'c10-pos-GK':             'Goalkeepers',
    'c10-pos-DEF':            'Defenders',
    'c10-pos-MID':            'Midfielders',
    'c10-pos-FWD':            'Forwards',
    'c10-box-median':         'median',
    'c10-box-range':          'min–max',
    'c10-slider-period-label':'World Cups',
    'c10-search-placeholder': 'Add a team…',
    'c10-sources':            'Data: height and squads from the <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> database (1930-2022) + FC Maps (2026). Expected height = mean height of men from each player\'s birth country in their birth year (NCD-RisC via Our World in Data, 1896-1996; later cohorts extrapolated). Curaçao uses the Netherlands as a proxy.',
    'c10-sources-tpl':        'Data: jfjelstul/worldcup + FC Maps (2026). Expected height = mean height of men by birth country and year (NCD-RisC via OWID).\nCuraçao uses the Netherlands as a proxy.',
    // Chart 12 — Average age of World Cup players
    'c12-title':              'World Cup players keep getting older',
    'c12-title-neutral':      'The age of World Cup players',
    'c12-subtitle':           'Average age of World Cup players, World Cup by World Cup.',
    'c12-axis-y':             'Age (years)',
    'c12-real':               'World Cup players',
    'c12-mode-line':          'Lines',
    'c12-mode-box':           'Distribution',
    'c12-mode-bar':           'Bars',
    'c12-view-sel':           'Teams',
    'c12-view-pos':           'By position',
    'c12-barpos-all':         'All',
    'c12-bar-empty':          'No data for this World Cup.',
    'c12-pos-GK':             'Goalkeepers',
    'c12-pos-DEF':            'Defenders',
    'c12-pos-MID':            'Midfielders',
    'c12-pos-FWD':            'Forwards',
    'c12-box-median':         'median',
    'c12-box-range':          'min–max',
    'c12-slider-period-label':'World Cups',
    'c12-search-placeholder': 'Add a team…',
    'c12-hint':               '“World Cup players” is the average of all players. Add a team to compare it against.',
    'c12-sources':            'Data: age and squads from the <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> database (1930-2022) + FC Maps (2026). Age is each player’s age at the start of their World Cup.',
    'c12-sources-tpl':        'Data: jfjelstul/worldcup + FC Maps (2026). Age is each player’s age at the start of their World Cup.',

    // Chart 11 — Managers (nationality + migration of the bench)
    'c11-title':              'More and more teams have a foreign manager',
    'c11-title-neutral':      'The migration of managers',
    'c11-title-arg':          'Argentina exports more managers than any other country',
    'c11-title-arg-birth':    'Argentina and France, the world\'s biggest coach factories',
    'c11-mode-trend':         'Local vs. foreign',
    'c11-trend-local':        'Local coach',
    'c11-trend-foreign':      'Foreign coach',
    'c11-trend-axis':         '% of teams',
    'c11-subtitle-all':       'Share of each World Cup\'s teams led by a manager of their own nationality vs. a foreign one.',
    'c11-subtitle-exp':       'Managers coaching a team from a country other than the one they were born in, as a share of that World Cup\'s "exported" managers.',
    'c11-axis-y-all':         '% of managers (by country of birth)',
    'c11-axis-y-exp':         '% of "exported" managers',
    'c11-axis-n-all':         'Managers (count)',
    'c11-axis-n-exp':         '"Exported" managers (count)',
    'c11-metric-pct':         '%',
    'c11-metric-abs':         'Count',
    'c11-crit-birth':         'By birthplace',
    'c11-crit-nat':           'By nationality',
    'c11-univ-all':           'All',
    'c11-univ-exp':           'Exported',
    'c11-group-pais':         'Country',
    'c11-group-region':       'Region',
    'c11-mode-line':          'Lines',
    'c11-mode-stack':         'Stacked area',
    'c11-mode-bar':           'Bars',
    'c11-mode-sankey':        'Flows',
    'c11-bar-wc':             'World Cup',
    'c11-sankey-otros':       'Others',
    'c11-sankey-empty':       'No "exported" managers in the selected period.',
    'c11-sankey-dt1':         'manager',
    'c11-sankey-dtN':         'managers',
    'c11-sankey-more':        'more',
    'c11-slider-period-label':'World Cups',
    'c11-search-placeholder': 'Add a country of birth…',
    'c11-label-otros':        'Others',
    'c11-sources':            'Data: managers of each men\'s World Cup (1930-2022) from <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a>; with the toggle, each manager is attributed by nationality (from jfjelstul) or country of birth (from Wikidata); the 2026 ones are the current coaches (Wikipedia), a World Cup not yet played. A manager counts as "foreign" if they coach a team from a country other than their own. If a team changed managers mid-tournament, both are counted.',
    'c11-sources-tpl':        'Data: jfjelstul/worldcup (managers); attributed by nationality (jfjelstul) or country of birth (Wikidata); 2026 current coaches (Wikipedia).\n"Exported" = a manager coaching a team from a country other than their own.',
    'c11-sources-tpl-foreign':'Data: jfjelstul/worldcup (managers); attributed by nationality (jfjelstul) or country of birth (Wikidata); 2026 current coaches (Wikipedia).\n"Foreign" = a manager coaching a team from a country other than their own.',

    // Chart 8 — Where World Cup players are born (annex: World Cups)
    'c8-title':              'Where World Cup players come from',
    'c8-subtitle':           'Birth city of each World Cup\'s players.',
    'c8-tab-map':            'Map',
    'c8-tab-bars':           'Ranking',
    'c8-slider-label':       'World Cups',
    'c8-heat-toggle':        'Heatmap',
    'c8-style-hex':          'Hexagons',
    'c8-style-fine':         'Fine',
    'c8-style-glow':         'Glow',
    'c8-reset-zoom':         'Reset zoom',
    'c8-scope-all':          'All World Cups (1930-2026)',
    'c8-scope-year':         'World Cup',
    'c8-scope-range':        'World Cups',
    'c8-legend-size':        'Players born there',
    'c8-legend-apps':        'World Cup appearances',
    'c8-unit-uniq':          'Unique players',
    'c8-unit-apps':          'Appearances',
    'c8-noun-1':             'player',
    'c8-noun-n':             'players',
    'c8-noun-apps-1':        'appearance',
    'c8-noun-apps-n':        'appearances',
    'c8-tip-all':            '(all World Cups)',
    'c8-tip-year':           'at World Cup',
    'c8-tip-range':          'at World Cups',
    'c8-sources':            'Data: <a href="https://github.com/jfjelstul/worldcup" target="_blank" rel="noopener">jfjelstul/worldcup</a> squads (1930-2022) + FC Maps for 2026; birthplace (city and coordinates) from Wikidata and Pantheon. "All World Cups" counts unique players; picking a World Cup counts the players in that squad.',
    'c8-sources-tpl':        'Data: jfjelstul/worldcup + FC Maps (2026); birthplaces from Wikidata/Pantheon.',
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

// Resolver idioma: ?lang=en|es en la URL tiene prioridad; si no, lo último
// elegido (localStorage). Esto hace que el idioma sobreviva a la navegación
// entre gráficos — los links son ./chart-X.html pelados, sin ?lang, así que
// sin esto cada página nueva volvía a ES por default.
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
