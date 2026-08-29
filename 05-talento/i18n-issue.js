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
    'c4-title':    'Ellas rompen el techo en el arte y la ciencia',
    'c4-subtitle': 'Entre las figuras célebres latinoamericanas, las mujeres pesan más que en el mundo justo donde la región produce poco —arte, humanidades, ciencia— y menos donde más brilla: el deporte y el poder.',
    'c4-sources':  'Datos: Pantheon (Datawheel, base 2025). % de mujeres entre las figuras célebres de cada dominio, América Latina vs el total mundial. La identidad de género proviene de Wikidata. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 5 — Explorador
    'c5-title':    'El talento per cápita, disciplina por disciplina',
    'c5-subtitle': 'Elegí un rubro y un período de nacimiento: cada punto es un país. Eje vertical, figuras célebres por millón; eje horizontal, su PIB per cápita.',
    'c5-sources':  'Datos: Pantheon (Datawheel, base 2025), Maddison Project (PIB per cápita) y OWID (población). Figuras por millón = nacidas en el período ÷ población promedio del período. PIB pc = promedio ponderado por el año de nacimiento de las figuras. Escala log-log. Regiones: taxonomía de El Atlas. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia. La fama no es el HPI del archivo de Pantheon: es un índice reconstruido desde las vistas de Wikipedia por idioma y por mes.',
    'c5-lbl-rubro': 'Rubro', 'c5-lbl-from': 'Desde', 'c5-lbl-to': 'hasta',

    // Chart 6 — La fama cambió de oficio
    'c6-title':    'La fama cambió de oficio',
    'c6-subtitle': 'Composición de las figuras célebres por década de nacimiento: el poder, la ciencia y las letras ceden ante el deporte y el espectáculo.',
    'c6-sources':  'Datos: Pantheon (Datawheel, base 2025). Cada columna es una década de nacimiento; las bandas, el % de figuras célebres de cada dominio. El nivel del deporte está inflado por el sesgo de Wikipedia a la era de internet, pero la dirección del cambio es robusta. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',

    // Chart 7 — Migración de la fama
    'c7-title':    'La fama también emigra',
    'c7-subtitle': 'Saldo entre figuras célebres que un país pierde (nacieron ahí pero murieron afuera) y gana (nacieron afuera, murieron ahí). Positivo = imán; negativo = exporta su fama.',
    'c7-sources':  'Datos: Pantheon (Datawheel, base 2025), por lugar de nacimiento y de muerte. Solo personas con ambos datos y nacidas desde 1700; países con ≥25 figuras nacidas. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',
    'c7-lbl-metric': 'Medida',

    // Chart 8 — Concentración subnacional
    'c8-title':    'El talento se hace en la capital',
    'c8-subtitle': '% de las figuras célebres de cada país que nacieron en su región líder. Cuanto más alto, más concentrado el talento en un solo lugar.',
    'c8-sources':  'Datos: Pantheon (Datawheel) por lugar de nacimiento, agregado a regiones subnacionales (adm1). Solo países con ≥50 figuras y ≥10 regiones (comparación justa). Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia.',
    'c8-lbl-view': 'Mostrar',

    // Chart 9 — Ciudades / metros de la fama
    'c9-title':    'Las ciudades de la fama',
    'c9-subtitle': 'Figuras célebres nacidas en cada área metropolitana (no la ciudad administrativa: el Gran Buenos Aires incluye Lanús, Avellaneda, etc.). Nueva York, Londres y París lideran; Buenos Aires es la #17 del mundo.',
    'c9-sources':  'Datos: Pantheon (Datawheel, base 2025) por lugar de nacimiento. Áreas metropolitanas armadas agrupando ciudades a ≤35 km (más backfill de Wikidata para figuras sin ciudad en Pantheon). Solo metros con ≥30 figuras. Se cuentan sólo figuras multiidioma (biografía leída en al menos 2 idiomas desde 2015): quedan afuera los perfiles inflados por una sola Wikipedia. La fama no es el HPI del archivo de Pantheon: es un índice reconstruido desde las vistas de Wikipedia por idioma y por mes.',
    'c9-lbl-scope': 'Mostrar',
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
    'c4-title':    'Women break through in arts and science',
    'c4-subtitle': 'Among Latin America’s notable figures, women weigh more than in the world precisely where the region produces little — arts, humanities, science — and less where it shines brightest: sport and power.',
    'c4-sources':  'Data: Pantheon (Datawheel, 2025 release). Share of women among the notable figures in each domain, Latin America vs the world total. Gender identity from Wikidata. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 5 — Explorer
    'c5-title':    'Talent per capita, field by field',
    'c5-subtitle': 'Pick a field and a birth period: each dot is a country. Vertical axis, notable figures per million; horizontal axis, GDP per capita.',
    'c5-sources':  'Data: Pantheon (Datawheel, 2025), Maddison Project (GDP per capita) and OWID (population). Figures per million = born in the period ÷ average population over the period. GDP pc = weighted by the figures’ birth years. Log-log scale. Regions: The Atlas taxonomy. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia. Fame is not the HPI from the Pantheon file: it is an index rebuilt from Wikipedia pageviews by language and month.',
    'c5-lbl-rubro': 'Field', 'c5-lbl-from': 'From', 'c5-lbl-to': 'to',

    // Chart 6 — Fame changed jobs
    'c6-title':    'Fame changed jobs',
    'c6-subtitle': 'Composition of notable people by birth decade: power, science and letters give way to sport and entertainment.',
    'c6-sources':  'Data: Pantheon (Datawheel, 2025 release). Each column is a birth decade; bands are the % of notable people in each domain. Sport’s level is inflated by Wikipedia’s internet-era bias, but the direction of change is robust. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',

    // Chart 7 — Fame migrates
    'c7-title':    'Fame migrates too',
    'c7-subtitle': 'Balance between notable people a country loses (born there, died abroad) and gains (born abroad, died there). Positive = magnet; negative = exports its fame.',
    'c7-sources':  'Data: Pantheon (Datawheel, 2025 release), by birthplace and place of death. Only people with both and born since 1700; countries with ≥25 born figures. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',
    'c7-lbl-metric': 'Measure',

    // Chart 8 — Subnational concentration
    'c8-title':    'Talent is made in the capital',
    'c8-subtitle': '% of each country’s notable people born in its leading region. The higher, the more talent is concentrated in one place.',
    'c8-sources':  'Data: Pantheon (Datawheel) by birthplace, aggregated to subnational regions (adm1). Only countries with ≥50 figures and ≥10 regions (fair comparison). Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia.',
    'c8-lbl-view': 'Show',

    // Chart 9 — Cities / metros of fame
    'c9-title':    'The cities of fame',
    'c9-subtitle': 'Notable people born in each metropolitan area (not the administrative city: Greater Buenos Aires includes Lanús, Avellaneda, etc.). New York, London and Paris lead; Buenos Aires ranks #17 worldwide.',
    'c9-sources':  'Data: Pantheon (Datawheel, 2025 release) by birthplace. Metro areas built by clustering cities within 35 km (plus Wikidata backfill for figures missing a city in Pantheon). Only metros with ≥30 figures. Only multilingual figures are counted (biography read in at least 2 languages since 2015), which drops profiles inflated by a single Wikipedia. Fame is not the HPI from the Pantheon file: it is an index rebuilt from Wikipedia pageviews by language and month.',
    'c9-lbl-scope': 'Show',
  }
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
