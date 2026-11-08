// Strings del número de religión en América Latina + helpers i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
//
// Gráficos, en el orden de la nota (id del <svg> chart<ID> y de data-png):
//   siglo    · católicos en América Latina desde 1872 (chart-siglo.html)
//   rutas    · las dos rutas de salida y la composición por año (chart-rutas.html)
//   pibev    · PIB per cápita de 1996 y crecimiento evangélico (chart-pib-evangelicos.html)
//   prac     · practicantes por religión (chart-practicantes.html)
//   sinrel   · creencia en Dios entre los sin religión (chart-sin-religion-creyentes.html)
//   creencia · creencia en Dios, América Latina y Europa occidental (chart-creencia.html)
//   diospib  · importancia de Dios contra PIB per cápita (chart-dios-pib.html)
//   diosrel  · importancia de Dios contra importancia de la religión (chart-dios-religion.html)
// Las claves propias de cada gráfico viven en i18n-<slug>.js (salvo prac, acá);
// acá quedan las compartidas y las del índice (index.html / index-en.html, que
// solo cargan este archivo). El orden de la navegación vive en nav.js.
//
// Criterio de textos (CLAUDE.md del repo): título = hallazgo solo en la vista de
// fábrica; apenas el lector cambia algo pasa al neutral que nombra la medición.
// Subtítulo = qué se mide, unidad y período (calculado del dato real), sin
// aclaraciones de método: esas van a la nota de la página.

const ES_N7_RELIGION = true;  // sentinel para png-export (FILENAMES del número)

const ISSUE_I18N = {
  es: {
    'brand-topic': 'Religión',
    'page-title': '¿Qué queda de la América Latina católica?',
    'page-lede': 'En una generación, la región dejó de ser abrumadoramente católica. Adónde fueron los que se fueron, y qué se llevaron con ellos.',
    'index-chart-word': 'Gráfico',
    'index-see': 'Ver gráfico →', 'index-charts-label': 'Gráficos interactivos',
    // Tarjetas del índice: la pregunta que responde cada gráfico (= <title> y og:title de su página)
    'csig-card': '¿Cuánto cayó el catolicismo en América Latina?',
    'cru-card': '¿Adónde fueron los que dejaron de ser católicos en América Latina?',
    'cpe-card': '¿Dónde crecieron más los evangélicos en América Latina?',
    'cprac-card': '¿Se practica menos la religión en América Latina?',
    'csinrel-card': '¿Creen en Dios los que no tienen religión?',
    'ccre-card': '¿Cayó la creencia en Dios en América Latina como en Europa?',
    'cdp-card': '¿América Latina le da a Dios más importancia de la que predice su ingreso?',
    'cdr-card': '¿Dónde se separan más Dios y la religión?',
    // chip atenuado del buscador (brSelector, opción dim): el país está elegido pero no se ve
    'br-sin-dato': 'Su región está oculta',
    'lbl-sel': 'Países o regiones',
    'rel-search-ph': 'Agregar país o región…',
    'rel-cat': 'Católicos', 'rel-evg': 'Evangélicos', 'rel-otr': 'Otras religiones', 'rel-total': 'Total',
    'geo-LATAM': 'América Latina', 'geo-LATAM_SIN_BRA': 'América Latina sin Brasil',
    'geo-tag-LATAM': '16 países', 'geo-tag-LATAM_SIN_BRA': '15 países',

    'cprac-title': 'Los evangélicos compensaron la pérdida de practicantes católicos',
    'cprac-title-neutral': 'Practicantes por religión',
    'cprac-sub': 'Porcentaje de adultos que se declaran practicantes o muy practicantes, según religión, {P}',
    'cprac-sub-lugar': 'Porcentaje de adultos que se declaran practicantes o muy practicantes, según religión, en {L}, {P}',
    'cprac-vacio': 'Elegí un país o una región con el buscador.',
    'cprac-lbl-media': 'Suavizado', 'cprac-media-ola': 'Cada ola', 'cprac-media-movil': 'Promedio móvil de 3 olas',
    'cprac-sub-movil': '(promedio móvil de 3 olas)',
    'cprac-tt-movil': 'Promedio móvil de 3 olas centrado en esta ola',
    'cprac-png-source': 'Datos: Latinobarómetro ({P}).',
    'cprac-sources': 'Datos: Latinobarómetro, olas 1996-2024. En cada ola la encuesta pregunta si la persona se considera muy practicante, practicante, no muy practicante o no practicante; el gráfico suma las dos primeras respuestas. Quienes no tienen religión cuentan como no practicantes. América Latina reúne 16 países ponderados por su población adulta y solo incluye las olas que relevaron los 16 (queda afuera la de 2023); América Latina sin Brasil hace la misma cuenta con los otros 15. La serie propia de Venezuela llega hasta 2020, porque sus olas 2023 y 2024 son inestables. Las olas no son anuales y el gráfico une las que hay. Con el promedio móvil, cada ola se promedia con la anterior y la siguiente, y la primera y la última, con su única vecina.'
  },
  en: {
    'brand-topic': 'Religion',
    'page-title': 'What is left of Catholic Latin America?',
    'page-lede': 'In a single generation, the region stopped being overwhelmingly Catholic. Where those who left went, and what they took with them.',
    'index-chart-word': 'Chart',
    'index-see': 'See chart →', 'index-charts-label': 'Interactive charts',
    'csig-card': 'How far has Catholicism fallen in Latin America?',
    'cru-card': 'Where did Latin America\'s former Catholics go?',
    'cpe-card': 'Where did evangelicals grow the most in Latin America?',
    'cprac-card': 'Is religion practiced less in Latin America?',
    'csinrel-card': 'Do people with no religion believe in God?',
    'ccre-card': 'Has belief in God fallen in Latin America as it has in Europe?',
    'cdp-card': 'Does Latin America value God more than its income would predict?',
    'cdr-card': 'Where do God and religion drift furthest apart?',
    'br-sin-dato': 'Its region is hidden',
    'lbl-sel': 'Countries or regions',
    'rel-search-ph': 'Add country or region…',
    'rel-cat': 'Catholics', 'rel-evg': 'Evangelicals', 'rel-otr': 'Other religions', 'rel-total': 'Total',
    'geo-LATAM': 'Latin America', 'geo-LATAM_SIN_BRA': 'Latin America excluding Brazil',
    'geo-tag-LATAM': '16 countries', 'geo-tag-LATAM_SIN_BRA': '15 countries',

    'cprac-title': 'Evangelicals offset the loss of practicing Catholics',
    'cprac-title-neutral': 'Practicing adults by religion',
    'cprac-sub': 'Share of adults who describe themselves as practicing or very practicing, by religion, {P}',
    'cprac-sub-lugar': 'Share of adults who describe themselves as practicing or very practicing, by religion, in {L}, {P}',
    'cprac-vacio': 'Pick a country or a region with the search box.',
    'cprac-lbl-media': 'Smoothing', 'cprac-media-ola': 'Each wave', 'cprac-media-movil': '3-wave moving average',
    'cprac-sub-movil': '(3-wave moving average)',
    'cprac-tt-movil': '3-wave moving average centered on this wave',
    'cprac-png-source': 'Data: Latinobarómetro ({P}).',
    'cprac-sources': 'Data: Latinobarómetro, 1996-2024 waves. Each wave asks respondents whether they consider themselves very practicing, practicing, not very practicing or not practicing; the chart adds up the first two answers. People with no religion count as non-practicing. Latin America covers 16 countries weighted by adult population and only includes the waves that surveyed all 16 (the 2023 wave is left out); Latin America excluding Brazil does the same with the other 15. Venezuela\'s own series ends in 2020, because its 2023 and 2024 waves are unstable. Waves are not annual, so the chart connects the available ones. With the moving average, each wave is averaged with the previous and the next one, and the first and the last with their only neighbour.'
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
