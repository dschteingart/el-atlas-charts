// Strings de chart-sin-religion-creyentes.html (id sinrel). Se enchufan sobre I18N, que ya armó i18n-issue.js
// (BASE_I18N de lib/i18n.js + las claves del número), igual que 04-intolerancia/i18n-vecinos.js. Cargar después
// de i18n-issue.js. Los nombres de región salen de lib/i18n.js ('reg.<región>').
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'lbl-paises': 'Países',
    'sinrel-search-ph': 'Agregar país…',
    'csinrel-title': 'En América Latina, hasta los que no tienen religión creen en Dios',
    'csinrel-title-neutral': 'Creencia en Dios entre quienes no tienen religión',
    'csinrel-sub': 'Porcentaje que cree en Dios entre quienes no tienen religión, {P}',
    'csinrel-vacio': 'Elegí países con el buscador.',
    'csinrel-png-source': 'Datos: Integrated Values Surveys ({P}).',
    'csinrel-png-ast': '*Se preguntó por la pertenencia a una iglesia.',
    'csinrel-leg-hint': 'Pasá el mouse para resaltar la región; hacé clic para ocultarla o volver a mostrarla.',
    'csinrel-tt-cree': 'Cree en Dios',
    'csinrel-tt-enc': 'Encuesta',
    'csinrel-tt-n': 'Casos sin religión',
    'csinrel-tt-ast': '*Se preguntó por la pertenencia a una iglesia.',
    // el chip de un país cuya región está oculta (brSelector, opción dim) usa 'br-sin-dato' de i18n-issue.js
    'csinrel-sources': 'Datos: Integrated Values Surveys (World Values Survey y European Values Study), última encuesta de cada país entre 2016 y 2022 (Haití, 2016; el resto, 2017-2022). Cuando un país tiene las dos encuestas en la misma ola, se usa la World Values Survey. No tienen religión quienes responden que no pertenecen a ninguna religión o denominación, y el porcentaje es el de quienes dicen creer en Dios, con los ponderadores de cada encuesta. Solo se incluyen los países con al menos 150 personas sin religión en la muestra. *En Colombia, Ecuador y Uruguay la pregunta se aplicó como pertenencia a una iglesia, y por eso hay más personas sin religión que en otras encuestas (en Uruguay, el 78% dijo no pertenecer a ninguna).'
  });
  Object.assign(I18N.en, {
    'lbl-paises': 'Countries',
    'sinrel-search-ph': 'Add country…',
    'csinrel-title': 'In Latin America, even people with no religion believe in God',
    'csinrel-title-neutral': 'Belief in God among people with no religion',
    'csinrel-sub': 'Share who believe in God among people with no religion, {P}',
    'csinrel-vacio': 'Pick countries with the search box.',
    'csinrel-png-source': 'Data: Integrated Values Surveys ({P}).',
    'csinrel-png-ast': '*Asked as membership of a church.',
    'csinrel-leg-hint': 'Hover to highlight the region; click to hide it or show it again.',
    'csinrel-tt-cree': 'Believe in God',
    'csinrel-tt-enc': 'Survey',
    'csinrel-tt-n': 'Respondents with no religion',
    'csinrel-tt-ast': '*Asked as membership of a church.',
    'csinrel-sources': 'Data: Integrated Values Surveys (World Values Survey and European Values Study), latest survey in each country between 2016 and 2022 (Haiti, 2016; the rest, 2017-2022). When a country has both surveys in the same wave, the World Values Survey is used. People with no religion are those who say they do not belong to any religion or denomination, and the share is that of those who say they believe in God, using each survey\'s weights. Only countries with at least 150 respondents with no religion are included. *In Colombia, Ecuador and Uruguay the question was asked as membership of a church, which is why there are more people with no religion than in other surveys (in Uruguay, 78% said they belong to none).'
  });
})();
