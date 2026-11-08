// Strings de chart-pib-evangelicos.html (PIB per cápita de 1996 contra cambio en evangélicos). Se enchufan sobre I18N
// (i18n-issue.js).
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'cpe-title': 'Los evangélicos crecieron más en los países que eran más pobres',
    'cpe-title-neutral': 'PIB per cápita de 1996 y cambio en evangélicos',
    'cpe-sub': 'PIB per cápita de 1996 y cambio en evangélicos entre 1996 y 2024',
    'cpe-axis-x': 'PIB per cápita en 1996 (escala logarítmica)',
    'cpe-axis-y': 'Cambio en evangélicos (puntos)',
    'cpe-tt-x': 'PIB per cápita en 1996',
    'cpe-tt-ev': 'Evangélicos',
    'cpe-tt-y': 'Cambio en evangélicos',
    'cpe-png-source': 'Datos: Latinobarómetro y Banco Mundial.',
    'cpe-sources': 'Datos: Latinobarómetro y Banco Mundial. Cada punto es un país. El cambio en evangélicos es la diferencia en el porcentaje de adultos evangélicos entre el promedio de las olas 1996-1998 y el de 2023-2024 (República Dominicana desde 2004-2006; Nicaragua hasta 2017-2020; Costa Rica y Panamá, solo 2024). El PIB per cápita es el promedio de 1995-1997, en dólares de 2021 ajustados por poder adquisitivo. Venezuela queda afuera porque no tiene dato de PIB para esos años. La línea punteada es la relación estimada entre los 17 países (recta sobre el logaritmo del PIB).'
  });
  Object.assign(I18N.en, {
    'cpe-title': 'Evangelicals grew more in the countries that were poorer',
    'cpe-title-neutral': 'GDP per capita in 1996 and change in evangelicals',
    'cpe-sub': 'GDP per capita in 1996 and change in evangelicals between 1996 and 2024',
    'cpe-axis-x': 'GDP per capita in 1996 (log scale)',
    'cpe-axis-y': 'Change in evangelicals (points)',
    'cpe-tt-x': 'GDP per capita in 1996',
    'cpe-tt-ev': 'Evangelicals',
    'cpe-tt-y': 'Change in evangelicals',
    'cpe-png-source': 'Data: Latinobarómetro and World Bank.',
    'cpe-sources': 'Data: Latinobarómetro and World Bank. Each dot is a country. The change in evangelicals is the difference in the share of adults who are evangelical between the average of the 1996-1998 waves and that of 2023-2024 (Dominican Republic from 2004-2006; Nicaragua up to 2017-2020; Costa Rica and Panama, 2024 only). GDP per capita is the 1995-1997 average, in 2021 dollars adjusted for purchasing power. Venezuela is left out because it has no GDP data for those years. The dashed line is the relationship estimated across the 17 countries (a straight line on log GDP).'
  });
})();
