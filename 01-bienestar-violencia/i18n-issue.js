// Strings específicos del N°1 + helpers de i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
// state global declarado acá; cada HTML populates state[N] según los charts que tenga.

// Sentinel del número: lib/png-export.js detecta el N°1 por esta constante
// (mismo patrón que ES_ESPECIAL_PARTIDOS / ES_N5_INTOLERANCIA) y elige
// FILENAMES, leyenda de regiones propias y prefijo de fallback acordes.
const ES_N1_BIENESTAR = true;

//==================================================================
//  I18N
//==================================================================
// Issue-specific strings. Shared base lives in ../lib/i18n.js
// and is merged below.
const ISSUE_I18N = {
  es: {
    'issue-num':  'N° 1',
    'page-title': 'Más feliz de lo que debería, más violenta de lo tolerable',
    'page-lede':  'América Latina se desvía del mundo en dos direcciones a la vez.',
    'index-charts-label': 'Gráficos interactivos',
    'index-see': 'Ver gráfico →',
    'c1-title':    'Bienestar subjetivo vs. PIB per cápita',
    'c1-subtitle': 'Los países latinoamericanos están, en promedio, más satisfechos con su vida de lo que predeciría su nivel de desarrollo.',
    // Variantes NEUTRALES: el subtítulo editorial habla de Latam; si el lector
    // filtra regiones o selecciona países, el texto pasa a descriptivo (patrón
    // "insight por default, neutral al customizar", como el deciles del N°2).
    'c1-title-neutral':    'Bienestar subjetivo vs. PIB per cápita',
    'c1-subtitle-neutral': 'Satisfacción con la vida (0–10) frente al PIB per cápita PPA, país por país.',
    'c2-title':    'Tasa de homicidios vs. PIB per cápita',
    'c2-subtitle': 'Y al mismo tiempo, sufre tasas de violencia letal muy por encima de lo que su nivel de desarrollo predeciría.',
    'c2-title-neutral':    'Tasa de homicidios vs. PIB per cápita',
    'c2-subtitle-neutral': 'Homicidios cada 100.000 habitantes frente al PIB per cápita PPA, país por país.',
    'c3-title':    'La distancia que no se cierra',
    'c3-subtitle': 'Mientras el mundo redujo su tasa de homicidios un 25% en dos décadas, América Latina y el Caribe permanece estancada en niveles que casi cuadruplican el promedio global.',
    'c3-title-neutral':    'La tasa de homicidios por región',
    'c3-subtitle-neutral': 'Homicidios cada 100.000 habitantes, promedio regional y por país, 2000–2024.',
    'c3-legend-latam': 'América Latina y el Caribe',
    'c3-legend-latam-short': 'Latam y Caribe',
    'c3-legend-world': 'Mundo',
    'c3-legend-spaghetti': 'Países de Latam y el Caribe',
    'c3-hint': '— Pasá el cursor por una línea de fondo para ver cada país',
    'c3-hint-mobile': '— Buscá un país para destacarlo en el gráfico',
    'c3-axis-y': 'Homicidios cada 100.000 habitantes',
    'c3-axis-y-short': 'Homicidios c/100.000 hab.',
    'c3-tt-latam': 'Latam+Caribe',
    'c3-tt-world': 'Mundo',
    'footer-sources':  'Datos: Banco Mundial (PIB per cápita PPP, dólares internacionales constantes 2021), World Happiness Report (satisfacción con la vida, escala 0–10), UNODC (tasa de homicidios cada 100.000 habitantes; serie temporal 2000–2024 e instantánea más reciente disponible 2019–2025). Procesados por Our World in Data.',
    'c1-sources': 'Datos: Banco Mundial (PIB per cápita PPP, dólares internacionales constantes 2021) y World Happiness Report (satisfacción con la vida, escala 0–10). Año más reciente disponible por país (2019–2025). Procesados por Our World in Data.',
    'c2-sources': 'Datos: Banco Mundial (PIB per cápita PPP, dólares internacionales constantes 2021) y UNODC (tasa de homicidios cada 100.000 habitantes). Año más reciente disponible por país (2019–2025). Procesados por Our World in Data.',
    'c3-sources': 'Datos: UNODC (tasa de homicidios cada 100.000 habitantes), serie temporal 2000–2024. Procesados por Our World in Data.',
    'footer-download-snapshot': 'Descargar snapshot por país (CSV)',
    'footer-download-timeseries': 'Descargar serie temporal de homicidios (CSV)',
    'footer-download-png': 'Descargar PNG',
    'footer-signature': 'El Atlas · Daniel Schteingart · 2026',
    'axis-x': 'PIB per cápita PPP (USD constantes 2021)',
    'axis-y-1': 'Satisfacción con la vida (0–10)',
    'axis-y-2': 'Homicidios cada 100.000 habitantes',
    'tt-gdppc': 'PIBpc',
    'tt-life':  'Satisfacción',
    'tt-hom':   'Homicidios',
    'tt-year-life': 'Felicidad',
    'tt-year-hom':  'Homicidios',
  },
  en: {
    'issue-num':  'No. 1',
    'page-title': 'Happier than it should be, more violent than tolerable',
    'page-lede':  'Latin America deviates from the world in two directions at once.',
    'index-charts-label': 'Interactive charts',
    'index-see': 'See chart →',
    'c1-title':    'Subjective wellbeing vs. GDP per capita',
    'c1-subtitle': 'Latin American countries report, on average, more life satisfaction than their income level would predict.',
    'c1-title-neutral':    'Subjective wellbeing vs. GDP per capita',
    'c1-subtitle-neutral': 'Life satisfaction (0\u201310) against GDP per capita PPP, country by country.',
    'c2-title':    'Homicide rate vs. GDP per capita',
    'c2-subtitle': 'And at the same time, the region suffers homicide rates far above what its income level would predict.',
    'c2-title-neutral':    'Homicide rate vs. GDP per capita',
    'c2-subtitle-neutral': 'Homicides per 100,000 people against GDP per capita PPP, country by country.',
    'c3-title':    'A gap that won\u2019t close',
    'c3-subtitle': 'While the world cut its homicide rate by 25% over two decades, Latin America and the Caribbean remains stuck at levels nearly four times the global average.',
    'c3-title-neutral':    'Homicide rate by region',
    'c3-subtitle-neutral': 'Homicides per 100,000 people, regional average and by country, 2000\u20132024.',
    'c3-legend-latam': 'Latin America and the Caribbean',
    'c3-legend-latam-short': 'Latam & Caribbean',
    'c3-legend-world': 'World',
    'c3-legend-spaghetti': 'Latin American & Caribbean countries',
    'c3-hint': '— Hover over a background line to see each country',
    'c3-hint-mobile': '— Search for a country to highlight it in the chart',
    'c3-axis-y': 'Homicides per 100,000 people',
    'c3-axis-y-short': 'Homicides per 100k',
    'c3-tt-latam': 'Latam+Caribbean',
    'c3-tt-world': 'World',
    'footer-sources':  'Data: World Bank (GDP per capita PPP, constant 2021 international dollars), World Happiness Report (life satisfaction, 0–10 scale), UNODC (homicide rate per 100,000 population; time series 2000–2024 and most recent available snapshot 2019–2025). Processed by Our World in Data.',
    'c1-sources': 'Data: World Bank (GDP per capita PPP, constant 2021 international dollars) and World Happiness Report (life satisfaction, 0–10 scale). Most recent available year per country (2019–2025). Processed by Our World in Data.',
    'c2-sources': 'Data: World Bank (GDP per capita PPP, constant 2021 international dollars) and UNODC (homicide rate per 100,000 population). Most recent available year per country (2019–2025). Processed by Our World in Data.',
    'c3-sources': 'Data: UNODC (homicide rate per 100,000 population), time series 2000–2024. Processed by Our World in Data.',
    'footer-download-snapshot': 'Download cross-country snapshot (CSV)',
    'footer-download-timeseries': 'Download homicide time series (CSV)',
    'footer-download-png': 'Download PNG',
    'footer-signature': 'The Atlas · Daniel Schteingart · 2026',
    'axis-x': 'GDP per capita PPP (constant 2021 USD)',
    'axis-y-1': 'Life satisfaction (0–10)',
    'axis-y-2': 'Homicide rate per 100,000',
    'tt-gdppc': 'GDPpc',
    'tt-life':  'Life satisf.',
    'tt-hom':   'Homicides',
    'tt-year-life': 'Happiness',
    'tt-year-hom':  'Homicides',
  }
};

// Merge shared base (loaded from ../lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...BASE_I18N.es, ...ISSUE_I18N.es },
  en: { ...BASE_I18N.en, ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => I18N[LANG][key] || key;

const state = {};

function applyI18n() {
  // En dispositivos sin hover (mobile/tablet) preferimos la versión "-mobile"
  // de la key si existe (ej. c3-hint-mobile en lugar de c3-hint).
  const useMobile = typeof HAS_HOVER !== 'undefined' && !HAS_HOVER;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const mobileKey = key + '-mobile';
    const chosen = (useMobile && I18N[LANG][mobileKey]) ? mobileKey : key;
    if (I18N[LANG][chosen]) el.innerHTML = I18N[LANG][chosen];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[LANG][key]) el.placeholder = I18N[LANG][key];
  });
  // data-i18n-href: cambia el href según idioma (atribución apunta a
  // distintos Substacks ES/EN).
  document.querySelectorAll('[data-i18n-href]').forEach(el => {
    const key = el.dataset.i18nHref;
    if (I18N[LANG][key]) el.setAttribute('href', I18N[LANG][key]);
  });
}

// Resolver idioma desde URL (?lang=en o ?lang=es)
(function initLang() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'es') LANG = urlLang;
  document.documentElement.lang = LANG;
})();

// Configurar listener del toggle ES/EN. onLangChange (opcional) se llama
// después de cambiar idioma para que el HTML que invoca redibuje lo suyo.
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
  // Marcar botón inicial activo según LANG resuelto desde URL
  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === LANG);
  });
}

// =============================================================
//  Título/subtítulo: insight por default, NEUTRAL al customizar
// =============================================================
// El subtítulo editorial afirma algo sobre Latam con la vista de fábrica.
// Si el lector cambia la selección (países o filtro de regiones), el texto
// pasa a la variante neutral (c*-title-neutral / c*-subtitle-neutral) y
// vuelve al insight al restaurar el estado inicial. El custom del editor
// (?nl=1) siempre manda. Cada drawChart/drawChart3 llama n1ApplyHeadings.
// (Mismo patrón que el deciles del N°2.)
function n1Pristine(chartId) {
  const s = (typeof state !== 'undefined') ? state[chartId] : null;
  if (!s) return true;
  if (chartId === 3) return !(s.selectedCountries && s.selectedCountries.size > 0);
  // Scatters 1-2: fábrica = sin países seleccionados y TODAS las regiones activas.
  const total = (typeof REGION_ORDER !== 'undefined') ? REGION_ORDER.length : 0;
  const regionsOk = !s.activeRegions || !total || s.activeRegions.size === total;
  const noneSel = !s.selectedCountries || s.selectedCountries.length === 0;
  return regionsOk && noneSel;
}
function n1ApplyHeadings(chartId) {
  const block = document.querySelector('.chart-block[data-chart="' + chartId + '"]');
  if (!block) return;
  const dict = (typeof I18N !== 'undefined' && I18N[LANG]) || {};
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const tx = (ae && ae.texts && ae.texts[LANG]) || {};
  const suf = n1Pristine(chartId) ? '' : '-neutral';
  const tEl = block.querySelector('.chart-title');
  const sEl = block.querySelector('.chart-subtitle');
  const tVal = dict['c' + chartId + '-title' + suf];
  const sVal = dict['c' + chartId + '-subtitle' + suf];
  if (tEl && !(tx.title || '').trim() && tVal) tEl.textContent = tVal;
  if (sEl && !(tx.subtitle || '').trim() && sVal) sEl.textContent = sVal;
  (n1ApplyHeadings._charts = n1ApplyHeadings._charts || new Set()).add(chartId);
}
// Tras un cambio del editor, lib/utils re-aplica custom||default editorial a
// TODOS los headings; re-corremos nuestra pasada después para restaurar la
// variante neutral si la vista está customizada.
window.addEventListener('atlas-editor-change', () => setTimeout(() => {
  (n1ApplyHeadings._charts || []).forEach(id => n1ApplyHeadings(id));
}, 0));
