// Strings de chart-dios-pib.html (importancia de Dios contra PIB per cápita). Se enchufan sobre I18N (i18n-issue.js).
// Título = hallazgo solo en la vista de fábrica; el subtítulo dice qué se mide (eje x primero) y el período, que se
// calcula de los años de encuesta de los puntos visibles ({P}).
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'cdp-title': 'Los latinoamericanos le dan a Dios más importancia de la esperable para su ingreso',
    'cdp-title-neutral': 'PIB per cápita e importancia de Dios',
    'cdp-sub': 'PIB per cápita e importancia de Dios en la propia vida (1 a 10), {P}',
    'cdp-axis-x': 'PIB per cápita (US$ PPA de 2021, escala logarítmica)',
    'cdp-axis-y': 'Importancia de Dios (1 a 10)',
    'cdp-tt-x': 'PIB per cápita',
    'cdp-tt-y': 'Importancia de Dios (1 a 10)',
    'cdp-png-source': 'Datos: Integrated Values Surveys (EVS/WVS) y Banco Mundial.',
    'cdp-sources': 'Datos: Integrated Values Surveys (EVS/WVS), última encuesta de cada país, hecha entre 2017 y 2023, y Banco Mundial. Cada punto es un país. La importancia de Dios es el promedio de las respuestas a cuán importante es Dios en la propia vida, en una escala de 1 (nada importante) a 10 (muy importante). El PIB per cápita es el del año de la encuesta, en dólares de 2021 ajustados por poder adquisitivo; Taiwán y Venezuela lo toman del FMI y, para Irlanda del Norte, se usa el del Reino Unido. La línea punteada es la relación estimada entre los países que no son de América Latina (recta sobre el logaritmo del PIB); si se apagan regiones en la leyenda, se recalcula sin ellas.'
  });
  Object.assign(I18N.en, {
    'cdp-title': 'Latin Americans give God more importance than their income would predict',
    'cdp-title-neutral': 'GDP per capita and the importance of God',
    'cdp-sub': 'GDP per capita and importance of God in one\'s life (1 to 10), {P}',
    'cdp-axis-x': 'GDP per capita (2021 PPP US$, log scale)',
    'cdp-axis-y': 'Importance of God (1 to 10)',
    'cdp-tt-x': 'GDP per capita',
    'cdp-tt-y': 'Importance of God (1 to 10)',
    'cdp-png-source': 'Data: Integrated Values Surveys (EVS/WVS) and World Bank.',
    'cdp-sources': 'Data: Integrated Values Surveys (EVS/WVS), latest survey in each country, fielded between 2017 and 2023, and World Bank. Each dot is a country. Importance of God is the average answer to how important God is in one\'s life, on a scale from 1 (not at all important) to 10 (very important). GDP per capita is for the survey year, in 2021 dollars adjusted for purchasing power; Taiwan and Venezuela take it from the IMF, and Northern Ireland uses the United Kingdom\'s. The dashed line is the relationship estimated among countries outside Latin America (a straight line on log GDP); switching regions off in the legend recalculates it without them.'
  });
})();
