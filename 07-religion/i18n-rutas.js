// Strings de chart-rutas.html (las dos rutas de salida del catolicismo + composición año por año). Se enchufan sobre
// I18N (i18n-issue.js). Las categorías de la composición reusan rel-cat, rel-evg y rel-otr del número.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'cru-title': 'Del catolicismo se sale por dos rutas',
    'cru-title-neutral': 'Cambio en evangélicos y en personas sin religión',
    'cru-title-comp': 'Composición religiosa por país',
    'cru-sub': 'Cambio en evangélicos y en personas sin religión entre 1996 y 2024, en puntos porcentuales',
    'cru-sub-comp': 'Porcentaje de adultos según religión, {P}',
    'cru-sub-comp-lugar': 'Porcentaje de adultos según religión, en {L}, {P}',
    'cru-axis-x': 'Cambio en evangélicos',
    'cru-axis-y': 'Cambio en sin religión',
    'cru-ruta-secular': 'Ruta secular',
    'cru-ruta-evangelica': 'Ruta evangélica',
    'cru-lbl-vista': 'Vista',
    'cru-vista-rutas': 'Dos rutas',
    'cru-vista-comp': 'Composición por año',
    'cru-hint': 'Elegí un país, o hacé clic en su punto, para ver su composición año por año.',
    'cru-hint-touch': 'Elegí un país con el buscador para ver su composición año por año.',
    'cru-vacio': 'Elegí un país con el buscador.',
    'cru-tt-olas': 'Olas',
    'cru-tt-click': 'Clic para ver su composición año por año',
    'rel-sin': 'Sin religión',
    'cru-png-source': 'Datos: Latinobarómetro.',
    'cru-png-source-comp': 'Datos: Latinobarómetro ({P}).',
    'cru-sources': 'Datos: Latinobarómetro, población adulta. En las dos rutas cada punto es un país y cada punta promedia varias olas (1996-1998 y 2023-2024; República Dominicana desde 2004-2006; Nicaragua y Venezuela hasta 2017-2020; Costa Rica y Panamá, solo 2024). Sin religión incluye a ateos, agnósticos y creyentes sin iglesia. La línea punteada marca el mismo cambio en los dos ejes. En la composición año por año las cuatro categorías suman el 100% de los adultos; la serie de Venezuela llega hasta 2020, porque sus olas 2023 y 2024 son inestables. Las olas no son anuales y el gráfico une las que hay.'
  });
  Object.assign(I18N.en, {
    'cru-title': 'There are two routes out of Catholicism',
    'cru-title-neutral': 'Change in evangelicals and in people with no religion',
    'cru-title-comp': 'Religious makeup by country',
    'cru-sub': 'Change in evangelicals and in people with no religion between 1996 and 2024, in percentage points',
    'cru-sub-comp': 'Share of adults by religion, {P}',
    'cru-sub-comp-lugar': 'Share of adults by religion in {L}, {P}',
    'cru-axis-x': 'Change in evangelicals',
    'cru-axis-y': 'Change in no religion',
    'cru-ruta-secular': 'Secular route',
    'cru-ruta-evangelica': 'Evangelical route',
    'cru-lbl-vista': 'View',
    'cru-vista-rutas': 'Two routes',
    'cru-vista-comp': 'Makeup by year',
    'cru-hint': 'Pick a country, or click its dot, to see its makeup year by year.',
    'cru-hint-touch': 'Pick a country with the search box to see its makeup year by year.',
    'cru-vacio': 'Pick a country with the search box.',
    'cru-tt-olas': 'Waves',
    'cru-tt-click': 'Click to see its makeup year by year',
    'rel-sin': 'No religion',
    'cru-png-source': 'Data: Latinobarómetro.',
    'cru-png-source-comp': 'Data: Latinobarómetro ({P}).',
    'cru-sources': 'Data: Latinobarómetro, adult population. In the two routes each dot is a country and each end averages several waves (1996-1998 and 2023-2024; Dominican Republic from 2004-2006; Nicaragua and Venezuela up to 2017-2020; Costa Rica and Panama, 2024 only). No religion includes atheists, agnostics and believers with no church. The dashed line marks the same change on both axes. In the year-by-year makeup the four categories add up to 100% of adults; Venezuela\'s series ends in 2020, because its 2023 and 2024 waves are unstable. Waves are not annual, so the chart connects the available ones.'
  });
})();
