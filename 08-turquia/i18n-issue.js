// Strings del número sobre Turquía («Turquía nos pasó») + helpers i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
//
// Gráficos, en el orden de la nota (id del <svg> chart<ID> y de data-png):
//   pib          · PIB per cápita, PPA, 1990-2025 (chart-pib.html)
//   lall         · exportaciones de bienes por contenido tecnológico (Lall), paneles por país, 1962-2024 (chart-lall.html)
//   iyd          · gasto en investigación y desarrollo, % del PIB, 1996-2024 (chart-iyd.html)
//   agro         · empleo en la agricultura, % del empleo total, 1991-2025 (chart-agro.html)
//   canasta      · composición de las exportaciones de bienes por rubro, paneles por país, 1995-2024 (chart-canasta.html)
//   complejidad  · puesto en el ranking de complejidad económica, 1995-2024 (chart-complejidad.html)
//   inflacion    · inflación anual de precios al consumidor, 1990-2025 (chart-inflacion.html)
//   convergencia · PIB per cápita como porcentaje del de Estados Unidos, 1990-2025 (chart-convergencia.html)
// Cuatro son el mismo tipo de gráfico (turSeries, tur-motor.js) y la canasta usa relStack; todas las claves viven acá
// (como en 06-brasil). El orden de la navegación vive en nav.js.
//
// Criterio de textos (CLAUDE.md del repo): título = hallazgo solo en la vista de fábrica; apenas el lector
// cambia la selección o el período pasa al neutral que nombra la medición. Subtítulo = qué se mide, unidad
// y período (calculado del dato real), sin aclaraciones de método: esas van a la nota de la página.

const ES_N8_TURQUIA = true;  // sentinel para png-export (FILENAMES del número)

const ISSUE_I18N = {
  es: {
    'brand-topic': 'Turquía',
    'page-title': 'Turquía nos pasó',
    'page-lede': 'En 1990 tenía el mismo PIB per cápita que América Latina. Hoy es 84% más alto. ¿Cómo hizo un país con una historia de crisis e inflación parecida a la nuestra?',
    'index-chart-word': 'Gráfico',
    'index-see': 'Ver gráfico →', 'index-charts-label': 'Gráficos interactivos',
    // Tarjetas del índice: la pregunta que responde cada gráfico (= <title> y og:title de su página)
    'cpib-card': '¿Cuánto creció el ingreso por habitante de cada país desde 1990?',
    'ccan-card': '¿Qué le vende cada país al mundo?',
    'ccom-card': '¿Qué países subieron y cuáles bajaron en complejidad económica?',
    'cinf-card': '¿Cuánta inflación tuvo cada país desde 1990?',
    'ccon-card': '¿Qué países se acercaron al ingreso de Estados Unidos?',

    // controles compartidos
    'lbl-periodo': 'Período', 'tur-desde': 'Desde', 'tur-hasta': 'Hasta',
    'lbl-sel': 'Países o regiones', 'lbl-paises': 'Países',
    'tur-search-ph': 'Agregar país o región…', 'tur-search-ph-pais': 'Agregar país…',
    'tur-tag-agg': 'Agregado',
    'tur-vacio': 'Elegí un país con el buscador.',
    'tur-sin-dato': 'La selección no tiene datos en este período.',
    // chip atenuado del buscador (brSelector, opción dim): el país está elegido pero no se ve
    'br-sin-dato': 'Sin dato en este período',
    // regiones del Banco Mundial (renglón gris del buscador), con los nombres del N°2
    'tur-reg-LCN': 'América Latina y el Caribe', 'tur-reg-ECS': 'Europa y Asia Central',
    'tur-reg-EAS': 'Asia Oriental y Pacífico', 'tur-reg-SAS': 'Asia del Sur',
    'tur-reg-MEA': 'Medio Oriente y Norte de África', 'tur-reg-NAC': 'América del Norte',
    'tur-reg-SSF': 'África Subsahariana',

    // pib
    'cpib-title': 'Turquía tenía el ingreso de América Latina en 1990 y hoy lo supera en 84%',
    'cpib-title-neutral': 'PIB per cápita',
    'cpib-sub': 'PIB per cápita, en dólares de 2021 ajustados por poder adquisitivo, {P}',
    'cpib-png-source': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial.',
    'cpib-sources': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial. PIB per cápita a paridad de poder adquisitivo, en dólares internacionales constantes de 2021. América Latina y el Caribe, la Unión Europea y el Mundo son los agregados que publica el Banco Mundial. Los valores de 2025 son primeras estimaciones y pueden revisarse.',

    // contenido tecnológico de las exportaciones (Lall): base, grupos y nombres del gráfico de exportaciones del N°6
    'clall-card': '¿Cuánta tecnología llevan las exportaciones de cada país?',
    'clall-title': 'Turquía y México se volvieron exportadores de manufacturas, Brasil y Argentina no',
    'clall-title-neutral': 'Exportaciones de bienes según contenido tecnológico',
    'clall-sub': 'Exportaciones de bienes según contenido tecnológico, en porcentaje del total, {P}',
    'clall-sub-lugar': 'Exportaciones de bienes de {L} según contenido tecnológico, en porcentaje del total, {P}',
    'lall-pp': 'Productos primarios', 'lall-rrnn': 'Manufacturas de recursos naturales', 'lall-baja': 'Manufacturas de baja tecnología',
    'lall-media': 'Manufacturas de media tecnología', 'lall-alta': 'Manufacturas de alta tecnología',
    'clall-png-source': 'Datos: Growth Lab (Harvard), Atlas of Economic Complexity, y CEPII, BACI; clasificación de contenido tecnológico de las exportaciones de Lall.',
    'clall-sources': 'Datos: Growth Lab (Universidad de Harvard), Atlas of Economic Complexity (comercio de bienes en SITC Rev. 2 a 4 dígitos) hasta 1994 y CEPII, BACI (HS 1992 a 6 dígitos, llevado a SITC Rev. 2) desde 2005; entre 1995 y 2004, un promedio de las dos fuentes en el que el peso de BACI sube año a año. BACI concilia lo que declaran exportadores e importadores, así que recupera lo que algunos países informan sin producto asignado (por secreto estadístico, entre otros motivos). Agrupado según la clasificación de Lall (2000) en la versión de Argendata (Fundar), que cuenta los minerales y el oro como productos primarios. La participación se calcula sobre los bienes con producto asignado y sin los que la clasificación de Lall deja fuera de sus cinco grupos (electricidad, materiales radiactivos, monedas y otros menores). En Turquía, México, Brasil y Argentina esos productos pesan como mucho 1,4% del total (Argentina en 2021) y en 2024, menos de 0,3%; en países que exportan electricidad o uranio, como Paraguay o Níger, pesan mucho más.',

    // investigación y desarrollo
    'ciyd-card': '¿Cuánto invierte cada país en investigación y desarrollo?',
    'ciyd-title': 'Turquía triplicó su inversión en I+D y hoy supera a todos los países latinoamericanos',
    'ciyd-title-neutral': 'Gasto en investigación y desarrollo',
    'ciyd-sub': 'Gasto en investigación y desarrollo como porcentaje del PIB, {P}',
    'ciyd-png-source': 'Datos: Banco Mundial, con datos de la UNESCO.',
    'ciyd-sources': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial, con datos del Instituto de Estadística de la UNESCO. Gasto en investigación y desarrollo de empresas, gobierno, universidades y organizaciones sin fines de lucro, como porcentaje del PIB. No todos los países informan todos los años: la línea se corta donde falta el dato (la serie de Brasil empieza en 2000 y la de Chile en 2007). América Latina y el Caribe, la Unión Europea y el Mundo son los agregados que publica el Banco Mundial.',

    // empleo agrícola
    'cagr-card': '¿Qué porcentaje de los trabajadores de cada país está en el campo?',
    'cagr-title': 'Turquía redujo el empleo agrícola de 46% a 14% y quedó cerca de México',
    'cagr-title-neutral': 'Empleo en la agricultura',
    'cagr-sub': 'Empleo en la agricultura como porcentaje del empleo total, {P}',
    'cagr-png-source': 'Datos: Banco Mundial, con estimaciones de la Organización Internacional del Trabajo.',
    'cagr-sources': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial, con la estimación modelada de la Organización Internacional del Trabajo (ILOSTAT). Personas ocupadas en agricultura, ganadería, silvicultura y pesca como porcentaje del total de ocupados. América Latina y el Caribe, la Unión Europea y el Mundo son los agregados que publica el Banco Mundial. Los valores de los últimos años son estimaciones y pueden revisarse.',

    // canasta exportadora
    'ccan-title': 'Turquía sumó autos y máquinas, Brasil y Argentina más productos primarios',
    'ccan-title-neutral': 'Composición de las exportaciones de bienes',
    'ccan-sub': 'Participación de cada rubro en las exportaciones de bienes, en porcentaje, {P}',
    'ccan-sub-lugar': 'Participación de cada rubro en las exportaciones de bienes de {L}, en porcentaje, {P}',
    'can-agro': 'Agro y alimentos', 'can-min': 'Combustibles y minerales', 'can-metal': 'Metales',
    'can-quim': 'Químicos y plásticos', 'can-text': 'Textiles e indumentaria', 'can-maq': 'Maquinaria y electrónica',
    'can-veh': 'Vehículos', 'can-resto': 'Resto',
    'ccan-png-source': 'Datos: Growth Lab de la Universidad de Harvard, Atlas de Complejidad Económica.',
    'ccan-sources': 'Datos: Growth Lab de la Universidad de Harvard, Atlas de Complejidad Económica, exportaciones de bienes por país y producto en la clasificación HS92, 1995-2024. Los rubros agrupan capítulos del Sistema Armonizado. Agro y alimentos reúne los capítulos 1 a 24 (animales, vegetales, aceites, alimentos, bebidas y tabaco); combustibles y minerales, 25 a 27; químicos y plásticos, 28 a 40; textiles e indumentaria, 50 a 63; metales, 72 a 83; maquinaria y electrónica, 84 y 85; vehículos, 86 a 89 (autos, camiones y autopartes, más aviones, barcos y material ferroviario). El resto incluye cueros, madera, papel, calzado, vidrio, oro y joyería, instrumentos y muebles. Los porcentajes se calculan sin el capítulo 99, que junta las mercancías que los países no detallan (en 2024, 25% de lo exportado por Argentina y 11% por México). El buscador ofrece los países con dato en todos los años.',

    // complejidad
    'ccom-title': 'Turquía subió en complejidad económica mientras Brasil y Argentina cayeron',
    'ccom-title-neutral': 'Ranking de complejidad económica',
    'ccom-sub': 'Puesto en el ranking de complejidad económica, {P}',
    'ccom-ytitle': 'Puesto en el ranking',
    'ccom-png-source': 'Datos: Growth Lab de la Universidad de Harvard, Atlas de Complejidad Económica.',
    'ccom-sources': 'Datos: Growth Lab de la Universidad de Harvard, Atlas de Complejidad Económica, con el ranking calculado sobre la clasificación de comercio HS92. El ranking ordena a los países según cuán diversificada y sofisticada es su canasta exportadora, y el puesto 1 corresponde a la economía más compleja. Cubre 140 países en 1995 y 145 desde 2006.',

    // inflación
    'cinf-title': 'En las últimas tres décadas, la inflación de Turquía fue mayor a la latinoamericana',
    'cinf-title-neutral': 'Inflación anual',
    'cinf-sub': 'Inflación anual de precios al consumidor, promedio del año, {P}',
    'cinf-png-source': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial.',
    'cinf-png-source-la6': 'Datos: Banco Mundial. América Latina es la mediana de Brasil, Chile, Colombia, México, Perú y Uruguay.',
    'cinf-tag-la6': 'Mediana de 6 países',
    'cinf-extra-label': 'Oct. {Y}: {V}%',
    'cinf-extra-tt': 'Octubre de {Y}, interanual',
    'cinf-extra-tt-note': 'Variación contra octubre del año anterior (TurkStat), no el promedio del año',
    'cinf-png-extra': 'El dato de 2026 es la variación interanual de octubre, según el instituto de estadística de cada país.',
    'cinf-sources': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial. Variación del índice de precios al consumidor entre el promedio de un año y el del año anterior. América Latina es un cálculo propio, la mediana de la inflación de Brasil, Chile, Colombia, México, Perú y Uruguay en cada año (Argentina queda afuera porque su serie en la fuente empieza en 2018). La línea se corta en los años en que la fuente no trae dato. Los valores de 2025 son primeras estimaciones y pueden revisarse. El dato de 2026 es la variación interanual de octubre, según el instituto de estadística de cada país (TurkStat en Turquía; para América Latina, la mediana de los seis).',

    // convergencia
    'ccon-title': 'Turquía y Europa oriental se acercaron a Estados Unidos; América Latina no',
    'ccon-title-neutral': 'PIB per cápita frente a Estados Unidos',
    'ccon-sub': 'PIB per cápita como porcentaje del de Estados Unidos, {P}',
    'ccon-png-source': 'Datos: Banco Mundial (PIB per cápita a paridad de poder adquisitivo).',
    'ccon-png-source-eue': 'Datos: Banco Mundial (PIB per cápita a paridad de poder adquisitivo). Europa oriental es el promedio de 11 países de la Unión Europea, ponderado por población. Los países son Bulgaria, Croacia, Eslovaquia, Eslovenia, Estonia, Hungría, Letonia, Lituania, Polonia, República Checa y Rumania.',
    'ccon-tag-eue': 'Promedio de 11 países',
    'ccon-sources': 'Datos: Banco Mundial, Indicadores del Desarrollo Mundial. PIB per cápita a paridad de poder adquisitivo, en dólares internacionales constantes de 2021, dividido por el de Estados Unidos en el mismo año. Europa oriental es un cálculo propio, el promedio de los 11 miembros de la Unión Europea de Europa central y oriental (Bulgaria, Croacia, Eslovaquia, Eslovenia, Estonia, Hungría, Letonia, Lituania, Polonia, República Checa y Rumania), ponderado por población. América Latina y el Caribe, la Unión Europea y el Mundo son los agregados que publica el Banco Mundial. Los valores de 2025 son primeras estimaciones y pueden revisarse.'
  },
  en: {
    'brand-topic': 'Turkey',
    'page-title': 'How Turkey overtook Latin America',
    'page-lede': 'In 1990 it had the same GDP per capita as Latin America. Today it is 84% higher. How did a country with a history of crises and inflation much like Latin America\'s pull it off?',
    'index-chart-word': 'Chart',
    'index-see': 'See chart →', 'index-charts-label': 'Interactive charts',
    'cpib-card': 'How much has each country\'s income per person grown since 1990?',
    'ccan-card': 'What does each country sell to the world?',
    'ccom-card': 'Which countries rose and which fell in economic complexity?',
    'cinf-card': 'How much inflation has each country had since 1990?',
    'ccon-card': 'Which countries closed the income gap with the United States?',

    'lbl-periodo': 'Period', 'tur-desde': 'From', 'tur-hasta': 'To',
    'lbl-sel': 'Countries or regions', 'lbl-paises': 'Countries',
    'tur-search-ph': 'Add country or region…', 'tur-search-ph-pais': 'Add country…',
    'tur-tag-agg': 'Aggregate',
    'tur-vacio': 'Pick a country with the search box.',
    'tur-sin-dato': 'The selection has no data for this period.',
    'br-sin-dato': 'No data for this period',
    'tur-reg-LCN': 'Latin America & Caribbean', 'tur-reg-ECS': 'Europe & Central Asia',
    'tur-reg-EAS': 'East Asia & Pacific', 'tur-reg-SAS': 'South Asia',
    'tur-reg-MEA': 'Middle East & North Africa', 'tur-reg-NAC': 'North America',
    'tur-reg-SSF': 'Sub-Saharan Africa',

    'cpib-title': 'Turkey had Latin America\'s income in 1990 and is now 84% ahead',
    'cpib-title-neutral': 'GDP per capita',
    'cpib-sub': 'GDP per capita, in 2021 dollars adjusted for purchasing power, {P}',
    'cpib-png-source': 'Data: World Bank, World Development Indicators.',
    'cpib-sources': 'Data: World Bank, World Development Indicators. GDP per capita at purchasing power parity, in constant 2021 international dollars. Latin America & Caribbean, the European Union and the World are the aggregates published by the World Bank. Figures for 2025 are first estimates and may be revised.',

    'clall-card': 'How much technology goes into each country\'s exports?',
    'clall-title': 'Turkey and Mexico became manufacturing exporters, Brazil and Argentina did not',
    'clall-title-neutral': 'Goods exports by technology content',
    'clall-sub': 'Goods exports by technology content, as a share of the total, {P}',
    'clall-sub-lugar': 'Goods exports of {L} by technology content, as a share of the total, {P}',
    'lall-pp': 'Primary products', 'lall-rrnn': 'Resource-based manufactures', 'lall-baja': 'Low-tech manufactures',
    'lall-media': 'Medium-tech manufactures', 'lall-alta': 'High-tech manufactures',
    'clall-png-source': 'Data: Growth Lab (Harvard), Atlas of Economic Complexity, and CEPII, BACI; Lall\'s classification of exports by technology content.',
    'clall-sources': 'Data: Growth Lab (Harvard University), Atlas of Economic Complexity (goods trade in SITC Rev. 2 at 4 digits) up to 1994, and CEPII, BACI (HS 1992 at 6 digits, converted to SITC Rev. 2) from 2005; between 1995 and 2004, an average of both sources in which the weight of BACI rises every year. BACI reconciles what exporters and importers report, so it recovers trade that some countries report with no product assigned (because of statistical confidentiality, among other reasons). Grouped by the Lall (2000) classification in the Argendata (Fundar) version, which counts ores and gold as primary products. Shares are computed over goods with an assigned product, excluding those the Lall classification leaves outside its five groups (electricity, radioactive materials, coins and a few minor items). In Turkey, Mexico, Brazil and Argentina these products are at most 1.4% of the total (Argentina in 2021) and less than 0.3% in 2024; in countries that export electricity or uranium, such as Paraguay or Niger, they weigh much more.',

    'ciyd-card': 'How much does each country invest in research and development?',
    'ciyd-title': 'Turkey tripled its investment in R&D and now surpasses every Latin American country',
    'ciyd-title-neutral': 'Research and development expenditure',
    'ciyd-sub': 'Research and development expenditure as a share of GDP, {P}',
    'ciyd-png-source': 'Data: World Bank, based on UNESCO data.',
    'ciyd-sources': 'Data: World Bank, World Development Indicators, based on data from the UNESCO Institute for Statistics. Research and development expenditure by business, government, universities and non-profit organisations, as a share of GDP. Not every country reports every year: the line breaks where data are missing (Brazil\'s series starts in 2000 and Chile\'s in 2007). Latin America & Caribbean, the European Union and the World are the aggregates published by the World Bank.',

    'cagr-card': 'What share of each country\'s workers is in farming?',
    'cagr-title': 'Turkey cut farm employment from 46% to 14% and moved close to Mexico',
    'cagr-title-neutral': 'Employment in agriculture',
    'cagr-sub': 'Employment in agriculture as a share of total employment, {P}',
    'cagr-png-source': 'Data: World Bank, based on International Labour Organization estimates.',
    'cagr-sources': 'Data: World Bank, World Development Indicators, with the International Labour Organization modelled estimate (ILOSTAT). People employed in agriculture, livestock, forestry and fishing as a share of total employment. Latin America & Caribbean, the European Union and the World are the aggregates published by the World Bank. Figures for recent years are estimates and may be revised.',

    'ccan-title': 'Turkey moved into cars and machinery, Brazil and Argentina into commodities',
    'ccan-title-neutral': 'Composition of goods exports',
    'ccan-sub': 'Share of each product group in goods exports, in percent, {P}',
    'ccan-sub-lugar': 'Share of each product group in the goods exports of {L}, in percent, {P}',
    'can-agro': 'Agriculture and food', 'can-min': 'Fuels and minerals', 'can-metal': 'Metals',
    'can-quim': 'Chemicals and plastics', 'can-text': 'Textiles and apparel', 'can-maq': 'Machinery and electronics',
    'can-veh': 'Vehicles', 'can-resto': 'Other',
    'ccan-png-source': 'Data: Harvard Growth Lab, Atlas of Economic Complexity.',
    'ccan-sources': 'Data: Harvard Growth Lab, Atlas of Economic Complexity, goods exports by country and product in the HS92 classification, 1995-2024. Product groups combine chapters of the Harmonized System. Agriculture and food covers chapters 1 to 24 (animals, vegetables, oils, food, beverages and tobacco); fuels and minerals, 25 to 27; chemicals and plastics, 28 to 40; textiles and apparel, 50 to 63; metals, 72 to 83; machinery and electronics, 84 and 85; vehicles, 86 to 89 (cars, trucks and parts, plus aircraft, ships and railway equipment). Other includes leather, wood, paper, footwear, glass, gold and jewellery, instruments and furniture. Shares are computed excluding chapter 99, which holds the goods that countries do not itemise (in 2024, 25% of Argentina\'s exports and 11% of Mexico\'s). The search box lists the countries with data for every year.',

    'ccom-title': 'Turkey climbed in economic complexity while Brazil and Argentina fell',
    'ccom-title-neutral': 'Economic complexity ranking',
    'ccom-sub': 'Position in the economic complexity ranking, {P}',
    'ccom-ytitle': 'Position in the ranking',
    'ccom-png-source': 'Data: Harvard Growth Lab, Atlas of Economic Complexity.',
    'ccom-sources': 'Data: Harvard Growth Lab, Atlas of Economic Complexity, with the ranking computed on the HS92 trade classification. The ranking orders countries by how diversified and sophisticated their export basket is, and position 1 is the most complex economy. It covers 140 countries in 1995 and 145 since 2006.',

    'cinf-title': 'Over the last three decades, Turkey\'s inflation has been higher than Latin America\'s',
    'cinf-title-neutral': 'Annual inflation',
    'cinf-sub': 'Annual consumer price inflation, year average, {P}',
    'cinf-png-source': 'Data: World Bank, World Development Indicators.',
    'cinf-png-source-la6': 'Data: World Bank. Latin America is the median of Brazil, Chile, Colombia, Mexico, Peru and Uruguay.',
    'cinf-tag-la6': 'Median of 6 countries',
    'cinf-extra-label': 'Oct. {Y}: {V}%',
    'cinf-extra-tt': 'October {Y}, year-on-year',
    'cinf-extra-tt-note': 'Change from October of the previous year (TurkStat), not the year average',
    'cinf-png-extra': 'The 2026 figure is the year-on-year change in October, from each country\'s statistics office.',
    'cinf-sources': 'Data: World Bank, World Development Indicators. Change in the consumer price index between one year\'s average and the previous year\'s. Latin America is our own calculation, the median of inflation in Brazil, Chile, Colombia, Mexico, Peru and Uruguay in each year (Argentina is left out because its series in the source starts in 2018). The line breaks in years for which the source has no data. Figures for 2025 are first estimates and may be revised. The 2026 figure is the year-on-year change in October, from each country\'s statistics office (TurkStat for Turkey; for Latin America, the median of the six).',

    'ccon-title': 'Turkey and Eastern Europe closed in on the United States; Latin America did not',
    'ccon-title-neutral': 'GDP per capita relative to the United States',
    'ccon-sub': 'GDP per capita as a share of that of the United States, {P}',
    'ccon-png-source': 'Data: World Bank (GDP per capita at purchasing power parity).',
    'ccon-png-source-eue': 'Data: World Bank (GDP per capita at purchasing power parity). Eastern Europe is the population-weighted average of 11 EU countries. The countries are Bulgaria, Croatia, Czechia, Estonia, Hungary, Latvia, Lithuania, Poland, Romania, Slovakia and Slovenia.',
    'ccon-tag-eue': 'Average of 11 countries',
    'ccon-sources': 'Data: World Bank, World Development Indicators. GDP per capita at purchasing power parity, in constant 2021 international dollars, divided by that of the United States in the same year. Eastern Europe is our own calculation, the population-weighted average of the 11 Central and Eastern European members of the European Union (Bulgaria, Croatia, Czechia, Estonia, Hungary, Latvia, Lithuania, Poland, Romania, Slovakia and Slovenia). Latin America & Caribbean, the European Union and the World are the aggregates published by the World Bank. Figures for 2025 are first estimates and may be revised.'
  }
};

// Merge shared base (lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.es : {}), ...ISSUE_I18N.es },
  en: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.en : {}), ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || key;

// state global, indexado por chart
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

// Resolver idioma (igual que los números anteriores): ?lang=en|es en la URL
// tiene prioridad; si no, lo último elegido (localStorage), pero solo al
// navegar dentro del sitio. Quien llega de afuera con la URL pelada abre en
// castellano. Por file:// no hay referrer, así que ahí se mantiene la preferencia.
(function initLang() {
  let stored = null;
  try { stored = localStorage.getItem('atlas-lang'); } catch (_) {}
  const urlLang = new URLSearchParams(location.search).get('lang');
  let internal = location.protocol === 'file:';
  try { internal = internal || new URL(document.referrer).origin === location.origin; } catch (_) {}
  if (urlLang === 'en' || urlLang === 'es') {
    LANG = urlLang;
    try { localStorage.setItem('atlas-lang', LANG); } catch (_) {}
  } else if (!internal) {
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
