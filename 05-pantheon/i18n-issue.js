// Strings específicos del N°5 "Talento" + helpers de i18n.
// BASE_I18N (compartido) viene de lib/i18n.js, cargado antes.

const ISSUE_I18N = {
  es: {
    'issue-num':  'N° 5',
    'page-title': '¿En qué es talentosa América Latina?',
    'page-lede':  'Para su tamaño y su nivel de desarrollo, la región produce muchísimas figuras célebres en unas pocas disciplinas y casi ninguna en otras. Cuatro cartografías del talento latinoamericano.',
    'index-charts-label': 'Gráficos interactivos',
    'index-see':  'Ver gráfico →',
    'footer-signature': 'El Atlas · Daniel Schteingart · 2026',

    // Chart 1 — Abanico de especialización
    'c1-title':    'Mucha cancha, poco laboratorio',
    'c1-subtitle': 'Para su peso en la población mundial (8%), América Latina produce el doble de figuras célebres del deporte —y apenas una fracción de las de la ciencia. Cada barra es una disciplina; el color, el área.',
    'c1-sources':  'Datos: Pantheon (Datawheel / pantheon.world, base 2025). "Talento" = personas con biografía notable en Wikipedia (notabilidad global, sesgada a la era de internet). Cada barra: latinoamericanos como % del total mundial de esa disciplina. Población: Banco Mundial / OWID. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 2 — La huella de cada país
    'c2-title':    'Cada país tiene su especialidad',
    'c2-subtitle': 'Béisbol en el Caribe, boxeo en Cuba, ciclismo en Colombia: cuántas veces más célebres produce cada país en cada disciplina respecto del promedio mundial. Color más oscuro = mayor especialización.',
    'c2-sources':  'Datos: Pantheon (Datawheel, base 2025). Sobre-representación (×) = participación de la disciplina entre las figuras del país ÷ participación mundial. Solo países con ≥90 figuras célebres. Los deportes de EE.UU. (béisbol) están sub-capturados en términos absolutos. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 3 — El talento que no tenemos: ciencia
    'c3-title':    'La ciencia, la gran ausente',
    'c3-subtitle': 'América Latina aporta apenas el 1% de los científicos célebres del mundo. Cada punto es un país; la línea marca lo esperado para cada nivel de PIB. La región (terracota) cae sistemáticamente por debajo.',
    'c3-sources':  'Datos: Pantheon (Datawheel, base 2025) y Maddison Project (PIB per cápita). Científicos célebres = biólogos, físicos, químicos, matemáticos, médicos, ingenieros e inventores con biografía notable en Wikipedia, por millón de habitantes. Escala log-log. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 4 — Género
    'c4-title':    'Las mujeres pesan donde la región pesa poco',
    'c4-subtitle': 'Entre las figuras célebres latinoamericanas, las mujeres pesan más que en el mundo justo donde la región produce poco —arte, humanidades, ciencia— y menos donde más brilla: el deporte y el poder.',
    'c4-sources':  'Datos: Pantheon (Datawheel, base 2025). % de mujeres entre las figuras célebres de cada dominio, América Latina vs el total mundial. La identidad de género proviene de Wikidata. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 5 — Explorador
    'c5-title':    'La cantidad de famosos per cápita aumenta con el desarrollo',
    'c5-subtitle': 'Figuras célebres por millón vs PIB per cápita, nacidas entre 1850 y 2010.',
    'c5-sources':  'Datos: Pantheon (Datawheel), base editada por El Atlas; PIB per cápita del Maddison Project y población de OWID. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas. Figuras por millón = nacidas en el período ÷ población promedio del período.',
    'c5-lbl-rubro': 'Rubro', 'c5-lbl-pop': 'Población', 'c5-scale-x': 'Escala PIB', 'c5-scale-y': 'Escala figuras',
    'c5-log': 'Logarítmica', 'c5-lineal': 'Lineal', 'c5-lbl-periodo': 'Nacidos entre',
    'c5-select': 'Seleccionar', 'c5-search-ph': 'Agregar país…',
    'c5-select-hint': 'Los países elegidos son los que quedan etiquetados en el gráfico.',
    'c5-banner-hint': 'Pasá el mouse por una región de la leyenda para ver los nombres de sus países; hacé clic (o tocá) para apagarla y sacarla del ajuste.',
    'c5-show-all': 'Ver todas las regiones',
    'ctrl-show-method': 'Ver metodología y fuentes',

    // Chart 6 — La fama cambió de oficio
    'c6-title':    'La fama cambió de oficio',
    'c6-subtitle': 'Composición de las figuras célebres por década de nacimiento: el poder, la ciencia y las letras ceden ante el deporte y el espectáculo.',
    'c6-sources':  'Datos: Pantheon (Datawheel, base 2025). Cada columna es una década de nacimiento; las bandas, el % de figuras célebres de cada dominio. El nivel del deporte está inflado por el sesgo de Wikipedia a la era de internet, pero la dirección del cambio es robusta. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 7 — Migración de la fama
    'c7-title':    'La fama emigra',
    'c7-subtitle': 'Saldo entre figuras célebres que un país pierde (nacieron ahí pero murieron afuera) y gana (nacieron afuera, murieron ahí). Positivo = imán; negativo = exporta su fama.',
    'c7-sources':  'Datos: Pantheon (Datawheel, base 2025), por lugar de nacimiento y de muerte. Solo personas con ambos datos y nacidas desde 1700; países con ≥25 figuras nacidas. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',
    'c7-lbl-metric': 'Medida',

    // Chart 8 — Concentración subnacional
    'c8-title':    'La fama se hace en la capital',
    'c8-subtitle': '% de las figuras célebres de cada país que nacieron en su región líder. Cuanto más alto, más concentrado el talento en un solo lugar.',
    'c8-sources':  'Datos: Pantheon (Datawheel) por lugar de nacimiento, agregado a regiones subnacionales (adm1). Solo países con ≥50 figuras y ≥10 regiones (comparación justa). Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',
    'c8-lbl-view': 'Mostrar',

    // Chart 9 — Ciudades / metros de la fama
    'c9-title':    'Las ciudades de la fama',
    'c9-subtitle': 'Figuras célebres nacidas en cada área metropolitana (no la ciudad administrativa: el Gran Buenos Aires incluye Lanús, Avellaneda, etc.). Nueva York, Londres y París lideran; Buenos Aires es la #17 del mundo.',
    'c9-sources':  'Datos: Pantheon (Datawheel, base 2025) por lugar de nacimiento. Áreas metropolitanas armadas agrupando ciudades a ≤35 km (más backfill de Wikidata para figuras sin ciudad en Pantheon). Solo metros con ≥30 figuras. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia. La fama no es el HPI del archivo de Pantheon: es un índice reconstruido desde las vistas de Wikipedia por idioma y por mes.',
    'c9-lbl-scope': 'Mostrar',


    // Captions cortos SOLO para el PNG (la nota completa queda en la página)
    'c1-png-note': 'Datos: Pantheon (Datawheel) y OWID (población).',
    'c2-png-note': 'Datos: Pantheon (Datawheel).',
    'c3-png-note': 'Datos: Pantheon (Datawheel) y Maddison Project.',
    'c4-png-note': 'Datos: Pantheon (Datawheel).',
    'c5-png-note': 'Datos: Pantheon (Datawheel), base editada por El Atlas; PIB per cápita del Maddison Project y población de OWID. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas. Figuras por millón = nacidas en el período ÷ población promedio del período.',
    'c6-png-note': 'Datos: Pantheon (Datawheel).',
    'c7-png-note': 'Datos: Pantheon (Datawheel).',
    'c8-png-note': 'Datos: Pantheon (Datawheel).',
    'c9-png-note': 'Datos: Pantheon (Datawheel).',
    // El mapa de la fama mundial (percap-map.html)
    'cmap-title': 'El mapa de la fama mundial',
    'cmap-lbl-vista': 'Vista',
    'cmap-pais': 'País',
    'cmap-region': 'Región',
    'cmap-lbl-medida': 'Medida',
    'cmap-abs': 'Absoluto',
    'cmap-percap': 'Per cápita',
    'cmap-lbl-mapa': 'Mapa',
    'cmap-coro': 'Coroplético',
    'cmap-carto': 'Cartograma ●',
    'cmap-lbl-filtro': 'Dominio / ocupación',
    'cmap-lbl-periodo': 'Nacidos entre',
    'cmap-zoom': '↺ Zoom',
    'cmap-note': 'Per cápita divide por la población promedio del período (por millón de habitantes). El tooltip muestra la figura de mayor HPI del país o región en el período elegido.',
    'cmap-sources': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    'cmap-png-note': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    // De que esta hecha la fama (evolucion.html)
    'cevo-title': 'Cómo cambió el perfil de la fama',
    'cevo-lbl-medida': 'Medida',
    'cevo-share': '% del período',
    'cevo-abs': 'Cantidades',
    'cevo-lbl-nivel': 'Apertura',
    'cevo-doms': 'Rubros',
    'cevo-occs': 'Ocupaciones',
    'cevo-lbl-periodo': 'Nacidos entre',
    'cevo-lbl-sel': 'Países o regiones',
    'cevo-buscar': 'Buscar país o región…',
    'cevo-limpiar': 'Limpiar',
    'cevo-vacio': 'Elegí un país o una región con el buscador.',
    'cevo-note': 'Figuras célebres agrupadas por período de nacimiento: un solo tramo pre-1500 y tramos de 50 años desde entonces (post-2000 agrupa el final). En la apertura por ocupación, cada franja es una ocupación y el tono indica su gran rubro.',
    'cevo-sources': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    'cevo-png-note': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    // genero + tooltips de figura (podios/top)
    'gen-lbl': 'Género',
    'gen-todos': 'Todos',
    'gen-f': 'Mujeres',
    'gen-m': 'Varones',
    'tt-occ': 'Ocupación',
    'tt-dom': 'Dominio',
    'tt-hpi': 'HPI',
    'tt-rank': 'puesto {n}',
    'tt-wiki': 'Wikipedias',
    'tt-wiki-v': '{n} ({k} con +10 mil lect./año)',
    'tt-lect': 'Lecturas/año',
    'tt-lect-v': '{v} fuera del inglés',
    'tt-nacido': 'n. {y}',
    // El podio de cada pais (podios.html)
    'pod-title': 'El podio de cada país',
    'pod-subtitle': 'Las tres figuras más célebres nacidas en cada país entre {y0} y {y1}, según el índice de popularidad histórica (HPI).',
    'pod-subtitle-dom': '{f}: las tres figuras más célebres de cada país entre {y0} y {y1}, según el HPI.',
    'pod-lbl-paises': 'Países',
    'pod-buscar': 'Buscar país…',
    'pod-limpiar': 'Limpiar',
    'pod-lbl-periodo': 'Nacidos entre',
    'pod-lbl-dom': 'Dominio',
    'pod-lbl-occ': 'Ocupación',
    'pod-todos': 'Todos',
    'pod-todas': 'Todas',
    'pod-col-pais': 'País',
    'pod-vacio': 'Elegí países con el buscador o sumá una región entera.',
    'pod-sin-figuras': 'sin figuras con estos filtros',
    'pod-cargando': 'Cargando la base completa…',
    'pod-note': 'Para cada país, las tres figuras con mayor HPI nacidas en el período elegido. El HPI (0–100) pondera idiomas y lecturas de Wikipedia fuera del inglés, con corrección por antigüedad; versión modificada del índice de Pantheon. Universo: toda la base depurada (116.319 figuras multiidioma).',
    'pod-sources': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    'pod-png-note': 'Datos: Pantheon (Datawheel). El HPI pondera idiomas y lecturas de Wikipedia fuera del inglés; versión modificada del índice original de Pantheon.',
    'pod-png-top': 'Top {n} países de la selección.',
    // Quien es quien (top.html)
    'top-title': 'El ranking de la fama mundial',
    'top-subtitle': 'Las figuras más célebres de la historia según el índice de popularidad histórica (HPI).',
    'top-sub-filtrado': '{f}: las figuras más célebres según el índice de popularidad histórica (HPI).',
    'top-lbl-n': 'Mostrar',
    'top-lbl-region': 'Región',
    'top-lbl-pais': 'País',
    'top-lbl-dom': 'Dominio',
    'top-lbl-occ': 'Ocupación',
    'top-todas': 'Todas',
    'top-todos': 'Todos',
    'top-col-nombre': 'Figura',
    'top-col-pais': 'País',
    'top-col-region': 'Región',
    'top-col-occ': 'Ocupación',
    'top-col-dom': 'Dominio',
    'top-col-score': 'HPI',
    'top-aviso-cargando': 'Cargando la base completa…',
    'top-aviso-fin': 'No hay más figuras con estos filtros: se muestran {n}.',
    'top-note': 'El Historical Popularity Index (HPI, 0–100) se calcula a partir de la cantidad de idiomas en los que cada figura es leída en Wikipedia, sus lecturas fuera del inglés (último año, acumuladas históricas y mediana mensual) y una corrección por antigüedad. Es una versión modificada del que calcula Pantheon; las diferencias entre ambos cálculos están en la nota metodológica del número. El puesto (#) es el ranking global entre las 116.319 figuras de la base.',
    'top-sources': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    'top-png-top': 'Top {n} de la selección.',
    'top-png-note': 'Datos: Pantheon (Datawheel). El HPI combina en cuántos idiomas está la entrada de Wikipedia de cada figura, cuántas lecturas tiene y cuán antigua es. #: puesto en el ranking mundial.',
    // Reparto de la fama (reparto.html)
    'rep-title-insight': 'La fama ya no es monopolio europeo',
    'rep-subtitle-insight': 'Europa Occidental concentraba el 57% de las figuras célebres del mundo nacidas antes de 1900; entre las nacidas después, un tercio. América Latina más que triplicó su parte.',
    'rep-title-neutral': 'El reparto de la fama',
    'rep-subtitle-neutral': 'Participación de cada región (o país) en las figuras célebres del mundo, separando a los nacidos antes y después del año de corte.',
    'rep-lbl-vista': 'Vista',
    'rep-vista-region': 'Región',
    'rep-vista-pais': 'País',
    'rep-lbl-dom': 'Dominio',
    'rep-dom-all': 'Todos',
    'rep-lbl-corte': 'Año de corte',
    'rep-lbl-min': 'Mín. figuras',
    'rep-col-hasta': 'Hasta',
    'rep-col-desde': 'Desde',
    'rep-col-total': 'Total',
    'rep-col-delta': 'Variación (pp)',
    'rep-col-n': 'n',
    'rep-resumen': 'Figuras en la selección: {pre} nacidas antes de {corte} · {post} desde {corte}.',
    'rep-note': '',
    'rep-sources': 'Datos: Pantheon (Datawheel), base editada por El Atlas. Se toman personas con entrada de Wikipedia en al menos dos idiomas con más de mil lecturas.',
    'rep-png-note-pais': 'Top {n} países por la columna ordenada.',
  },
  en: {
    'issue-num':  'No. 5',
    'page-title': 'What is Latin America talented at?',
    'page-lede':  'For its size and level of development, the region produces a great many notable people in a few fields — and almost none in others. Four maps of Latin American talent.',
    'index-charts-label': 'Interactive charts',
    'index-see':  'See chart →',
    'footer-signature': 'The Atlas · Daniel Schteingart · 2026',

    // Chart 1 — Specialization fan
    'c1-title':    'All pitch, no lab',
    'c1-subtitle': 'For its share of the world’s population (8%), Latin America produces twice its quota of famous athletes — and just a fraction of its scientists. Each bar is a field; the colour, its domain.',
    'c1-sources':  'Data: Pantheon (Datawheel / pantheon.world, 2025 release). "Talent" = people with a notable Wikipedia biography (global notability, skewed to the internet era). Each bar: Latin Americans as a % of the world total in that field. Population: World Bank / OWID. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 2 — The fingerprint of each country
    'c2-title':    'Every country has its specialty',
    'c2-subtitle': 'Baseball in the Caribbean, boxing in Cuba, cycling in Colombia: how many times more notable people each country produces in each field than the world average. Darker = more specialized.',
    'c2-sources':  'Data: Pantheon (Datawheel, 2025 release). Over-representation (×) = the field’s share among the country’s figures ÷ its world share. Only countries with ≥90 notable figures. U.S.-centric sports (baseball) are under-captured in absolute terms. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 3 — The talent we lack: science
    'c3-title':    'Science, the great absence',
    'c3-subtitle': 'Latin America accounts for just 1% of the world’s notable scientists. Each dot is a country; the line marks what’s expected at each income level. The region (terracotta) sits systematically below.',
    'c3-sources':  'Data: Pantheon (Datawheel, 2025 release) and the Maddison Project (GDP per capita). Notable scientists = biologists, physicists, chemists, mathematicians, physicians, engineers and inventors with a notable Wikipedia biography, per million inhabitants. Log-log scale. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 4 — Gender
    'c4-title':    'Women weigh most where the region weighs least',
    'c4-subtitle': 'Among Latin America’s notable figures, women weigh more than in the world precisely where the region produces little — arts, humanities, science — and less where it shines brightest: sport and power.',
    'c4-sources':  'Data: Pantheon (Datawheel, 2025 release). Share of women among the notable figures in each domain, Latin America vs the world total. Gender identity from Wikidata. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 5 — Explorer
    'c5-title':    'Fame per capita rises with development',
    'c5-subtitle': 'Notable figures per million vs GDP per capita, born 1850–2010.',
    'c5-sources':  'Data: Pantheon (Datawheel), dataset edited by The Atlas; GDP per capita from the Maddison Project and population from OWID. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads. Figures per million = born in the period ÷ average population over the period.',
    'c5-lbl-rubro': 'Field', 'c5-lbl-pop': 'Population', 'c5-scale-x': 'GDP scale', 'c5-scale-y': 'Figures scale',
    'c5-log': 'Logarithmic', 'c5-lineal': 'Linear', 'c5-lbl-periodo': 'Born between',
    'c5-select': 'Select', 'c5-search-ph': 'Add a country…',
    'c5-select-hint': 'The countries you pick are the ones labeled on the chart.',
    'c5-banner-hint': 'Hover over a region in the legend to reveal its country names; click (or tap) to turn it off and drop it from the fit.',
    'c5-show-all': 'Show all regions',
    'ctrl-show-method': 'Methodology & sources',

    // Chart 6 — Fame changed jobs
    'c6-title':    'Fame changed jobs',
    'c6-subtitle': 'Composition of notable people by birth decade: power, science and letters give way to sport and entertainment.',
    'c6-sources':  'Data: Pantheon (Datawheel, 2025 release). Each column is a birth decade; bands are the % of notable people in each domain. Sport’s level is inflated by Wikipedia’s internet-era bias, but the direction of change is robust. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 7 — Fame migrates
    'c7-title':    'Fame migrates',
    'c7-subtitle': 'Balance between notable people a country loses (born there, died abroad) and gains (born abroad, died there). Positive = magnet; negative = exports its fame.',
    'c7-sources':  'Data: Pantheon (Datawheel, 2025 release), by birthplace and place of death. Only people with both and born since 1700; countries with ≥25 born figures. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',
    'c7-lbl-metric': 'Measure',

    // Chart 8 — Subnational concentration
    'c8-title':    'Fame is made in the capital',
    'c8-subtitle': '% of each country’s notable people born in its leading region. The higher, the more talent is concentrated in one place.',
    'c8-sources':  'Data: Pantheon (Datawheel) by birthplace, aggregated to subnational regions (adm1). Only countries with ≥50 figures and ≥10 regions (fair comparison). Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',
    'c8-lbl-view': 'Show',

    // Chart 9 — Cities / metros of fame
    'c9-title':    'The cities of fame',
    'c9-subtitle': 'Notable people born in each metropolitan area (not the administrative city: Greater Buenos Aires includes Lanús, Avellaneda, etc.). New York, London and Paris lead; Buenos Aires ranks #17 worldwide.',
    'c9-sources':  'Data: Pantheon (Datawheel, 2025 release) by birthplace. Metro areas built by clustering cities within 35 km (plus Wikidata backfill for figures missing a city in Pantheon). Only metros with ≥30 figures. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia. Fame is not the HPI from the Pantheon file: it is an index rebuilt from Wikipedia pageviews by language and month.',
    'c9-lbl-scope': 'Show',


    // Short PNG-only captions
    'c1-png-note': 'Data: Pantheon (Datawheel) and OWID (population).',
    'c2-png-note': 'Data: Pantheon (Datawheel).',
    'c3-png-note': 'Data: Pantheon (Datawheel) and Maddison Project.',
    'c4-png-note': 'Data: Pantheon (Datawheel).',
    'c5-png-note': 'Data: Pantheon (Datawheel), dataset edited by The Atlas; GDP per capita from the Maddison Project and population from OWID. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads. Figures per million = born in the period ÷ average population over the period.',
    'c6-png-note': 'Data: Pantheon (Datawheel).',
    'c7-png-note': 'Data: Pantheon (Datawheel).',
    'c8-png-note': 'Data: Pantheon (Datawheel).',
    'c9-png-note': 'Data: Pantheon (Datawheel).',
    // The world fame map (percap-map.html)
    'cmap-title': 'The world fame map',
    'cmap-lbl-vista': 'View',
    'cmap-pais': 'Country',
    'cmap-region': 'Region',
    'cmap-lbl-medida': 'Measure',
    'cmap-abs': 'Absolute',
    'cmap-percap': 'Per capita',
    'cmap-lbl-mapa': 'Map',
    'cmap-coro': 'Choropleth',
    'cmap-carto': 'Cartogram ●',
    'cmap-lbl-filtro': 'Domain / occupation',
    'cmap-lbl-periodo': 'Born between',
    'cmap-zoom': '↺ Zoom',
    'cmap-note': 'Per capita divides by the average population of the period (per million people). The tooltip shows the top-HPI figure of the country or region in the chosen period.',
    'cmap-sources': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    'cmap-png-note': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    // What fame is made of (evolucion.html)
    'cevo-title': 'How the profile of fame changed',
    'cevo-lbl-medida': 'Measure',
    'cevo-share': '% of period',
    'cevo-abs': 'Counts',
    'cevo-lbl-nivel': 'Breakdown',
    'cevo-doms': 'Domains',
    'cevo-occs': 'Occupations',
    'cevo-lbl-periodo': 'Born between',
    'cevo-lbl-sel': 'Countries or regions',
    'cevo-buscar': 'Search country or region…',
    'cevo-limpiar': 'Clear',
    'cevo-vacio': 'Pick a country or region with the search box.',
    'cevo-note': 'Famous figures grouped by birth period: a single pre-1500 bucket and 50-year bins afterwards (post-2000 groups the tail). In the occupation breakdown each band is one occupation, shaded by its broader domain.',
    'cevo-sources': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    'cevo-png-note': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    // gender + person tooltips (podios/top)
    'gen-lbl': 'Gender',
    'gen-todos': 'All',
    'gen-f': 'Women',
    'gen-m': 'Men',
    'tt-occ': 'Occupation',
    'tt-dom': 'Domain',
    'tt-hpi': 'HPI',
    'tt-rank': 'rank {n}',
    'tt-wiki': 'Wikipedias',
    'tt-wiki-v': '{n} ({k} with 10k+ reads/yr)',
    'tt-lect': 'Reads/yr',
    'tt-lect-v': '{v} outside English',
    'tt-nacido': 'b. {y}',
    // Each country's podium (podios.html)
    'pod-title': "Each country's podium",
    'pod-subtitle': "The three most famous figures born in each country between {y0} and {y1}, by Historical Popularity Index (HPI).",
    'pod-subtitle-dom': '{f}: the three most famous figures of each country between {y0} and {y1}, by HPI.',
    'pod-lbl-paises': 'Countries',
    'pod-buscar': 'Search country…',
    'pod-limpiar': 'Clear',
    'pod-lbl-periodo': 'Born between',
    'pod-lbl-dom': 'Domain',
    'pod-lbl-occ': 'Occupation',
    'pod-todos': 'All',
    'pod-todas': 'All',
    'pod-col-pais': 'Country',
    'pod-vacio': 'Pick countries with the search box, or add a whole region.',
    'pod-sin-figuras': 'no figures under these filters',
    'pod-cargando': 'Loading the full dataset…',
    'pod-note': "For each country, the three highest-HPI figures born in the chosen period. The HPI (0–100) weighs languages and non-English Wikipedia readership, with an age correction; a modified version of Pantheon's index. Universe: the full cleaned dataset (116,319 multilingual figures).",
    'pod-sources': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    'pod-png-note': "Data: Pantheon (Datawheel). The HPI weighs languages and non-English Wikipedia readership; a modified version of Pantheon's original index.",
    'pod-png-top': 'Top {n} countries of the selection.',
    // Who's who (top.html)
    'top-title': 'The global fame ranking',
    'top-subtitle': "History's most famous figures according to the Historical Popularity Index (HPI).",
    'top-sub-filtrado': '{f}: the most famous figures by Historical Popularity Index (HPI).',
    'top-lbl-n': 'Show',
    'top-lbl-region': 'Region',
    'top-lbl-pais': 'Country',
    'top-lbl-dom': 'Domain',
    'top-lbl-occ': 'Occupation',
    'top-todas': 'All',
    'top-todos': 'All',
    'top-col-nombre': 'Figure',
    'top-col-pais': 'Country',
    'top-col-region': 'Region',
    'top-col-occ': 'Occupation',
    'top-col-dom': 'Domain',
    'top-col-score': 'HPI',
    'top-aviso-cargando': 'Loading the full dataset…',
    'top-aviso-fin': 'No more figures match these filters: showing {n}.',
    'top-note': "The Historical Popularity Index (HPI, 0–100) is computed from the number of languages in which each figure is read on Wikipedia, their non-English pageviews (last year, all-time and monthly median) and an age correction. It is a modified version of the index Pantheon computes; the differences are covered in the issue's methodological note. The rank (#) is global among the 116,319 figures in the dataset.",
    'top-sources': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    'top-png-top': 'Top {n} of the selection.',
    'top-png-note': 'Data: Pantheon (Datawheel). The HPI combines how many languages a figure\'s Wikipedia entry exists in, how much it is read and how old the figure is. #: world ranking position.',
    // Fame shares (reparto.html)
    'rep-title-insight': "Fame is no longer a European monopoly",
    "rep-subtitle-insight": "Western Europe accounted for 57% of the world’s famous figures born before 1900; among those born since, one third. Latin America more than tripled its share.",
    'rep-title-neutral': 'How fame is shared out',
    'rep-subtitle-neutral': "Each region's (or country's) share of the world's famous figures, splitting those born before and after a cutoff year.",
    'rep-lbl-vista': 'View',
    'rep-vista-region': 'Region',
    'rep-vista-pais': 'Country',
    'rep-lbl-dom': 'Domain',
    'rep-dom-all': 'All',
    'rep-lbl-corte': 'Cutoff year',
    'rep-lbl-min': 'Min. figures',
    'rep-col-hasta': 'Before',
    'rep-col-desde': 'Since',
    'rep-col-total': 'Total',
    'rep-col-delta': 'Change (pp)',
    'rep-col-n': 'n',
    'rep-resumen': 'Figures in this selection: {pre} born before {corte} · {post} since {corte}.',
    'rep-note': '',
    'rep-sources': 'Data: Pantheon (Datawheel), dataset edited by The Atlas. Includes people whose Wikipedia entry exists in at least two languages with over 1,000 reads.',
    'rep-png-note-pais': 'Top {n} countries by the sorted column.',
  },
};

// Merge shared base (../lib/i18n.js) with issue overrides.
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
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (I18N[LANG][key]) el.setAttribute('aria-label', I18N[LANG][key]);
  });
}

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
