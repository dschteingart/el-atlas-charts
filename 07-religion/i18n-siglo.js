// Strings de chart-siglo.html (porcentaje de católicos en América Latina, 1872-2024).
// Se enchufan sobre I18N, ya armado por i18n-issue.js (mismo patrón que 04-intolerancia/i18n-vecinos.js).
// Título = hallazgo solo en la vista de fábrica; apenas el lector apaga una serie o recorta el período, pasa al neutral.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'csig-title': 'El derrumbe de un monopolio religioso',
    'csig-title-neutral': 'Porcentaje de católicos en América Latina',
    'csig-sub': 'Porcentaje de la población que se identifica como católica en América Latina, {P}',
    'csig-lbl-periodo': 'Período',
    'csig-desde': 'Desde', 'csig-hasta': 'Hasta',
    'csig-hint': 'Tocá una serie en la leyenda para ocultarla o mostrarla',
    'csig-pew': 'América Latina (Pew)',
    'csig-lb': 'América Latina (Latinobarómetro)',
    'csig-bra': 'Brasil (censos)',
    'csig-mex': 'México (censos)',
    'csig-chl': 'Chile (censos)',
    'csig-src-pew': 'Pew Research Center',
    'csig-src-lb': 'Latinobarómetro',
    'csig-src-censos': 'censos de {C}',
    'csig-src-y': ' y ',
    'csig-cn-bra': 'Brasil', 'csig-cn-mex': 'México', 'csig-cn-chl': 'Chile',
    'csig-fuente-pew-est': 'World Religion Database, en Pew Research Center (2014)',
    'csig-fuente-pew-enc': 'Pew Research Center, encuesta 2013-14',
    'csig-fuente-lb': 'Latinobarómetro',
    'csig-fuente-bra': 'Censos nacionales de Brasil',
    'csig-fuente-mex': 'Censos nacionales de México',
    'csig-fuente-chl': 'Censos nacionales de Chile',
    'csig-png-source': 'Datos: {S}.',
    'csig-sources': 'Datos: Pew Research Center para la región (1910, 1950 y 1970, estimaciones con la World Religion Database; 2014, encuesta a adultos de 18 países y Puerto Rico), Latinobarómetro (16 países ponderados por su población adulta, 1996-2024) y censos nacionales de Brasil, México y Chile. Los censos cubren a toda la población, salvo México 1990-2010 (5 años y más), Brasil 2022 (10 años y más) y Chile desde 1992 (14 o 15 años y más); por ese cambio de universo, la línea de Chile se corta entre 1952 y 1992. Brasil no tuvo censos comparables entre 1890 y 1940, y la línea une esos dos. Las olas de Latinobarómetro no son anuales y el gráfico une las que hay.'
  });
  Object.assign(I18N.en, {
    'csig-title': 'The collapse of a religious monopoly',
    'csig-title-neutral': 'Share of Catholics in Latin America',
    'csig-sub': 'Share of the population that identifies as Catholic in Latin America, {P}',
    'csig-lbl-periodo': 'Period',
    'csig-desde': 'From', 'csig-hasta': 'To',
    'csig-hint': 'Click a series in the legend to hide or show it',
    'csig-pew': 'Latin America (Pew)',
    'csig-lb': 'Latin America (Latinobarómetro)',
    'csig-bra': 'Brazil (censuses)',
    'csig-mex': 'Mexico (censuses)',
    'csig-chl': 'Chile (censuses)',
    'csig-src-pew': 'Pew Research Center',
    'csig-src-lb': 'Latinobarómetro',
    'csig-src-censos': 'censuses of {C}',
    'csig-src-y': ' and ',
    'csig-cn-bra': 'Brazil', 'csig-cn-mex': 'Mexico', 'csig-cn-chl': 'Chile',
    'csig-fuente-pew-est': 'World Religion Database, in Pew Research Center (2014)',
    'csig-fuente-pew-enc': 'Pew Research Center, 2013-14 survey',
    'csig-fuente-lb': 'Latinobarómetro',
    'csig-fuente-bra': 'Brazil national censuses',
    'csig-fuente-mex': 'Mexico national censuses',
    'csig-fuente-chl': 'Chile national censuses',
    'csig-png-source': 'Data: {S}.',
    'csig-sources': 'Data: Pew Research Center for the region (1910, 1950 and 1970, estimates based on the World Religion Database; 2014, survey of adults in 18 countries and Puerto Rico), Latinobarómetro (16 countries weighted by adult population, 1996-2024) and national censuses of Brazil, Mexico and Chile. The censuses cover the whole population, except Mexico 1990-2010 (aged 5 and over), Brazil 2022 (aged 10 and over) and Chile since 1992 (aged 14 or 15 and over); because of that change, Chile\'s line breaks between 1952 and 1992. Brazil had no comparable censuses between 1890 and 1940, and the line joins those two. Latinobarómetro waves are not annual, so the chart connects the available ones.'
  });
})();
