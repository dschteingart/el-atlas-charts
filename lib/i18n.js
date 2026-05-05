// =============================================================
//  El Atlas — Shared bilingual strings (ES/EN)
// =============================================================
//
// Strings that appear in every issue: brand, chart controls, region
// names, search/download UI. Issue-specific text (titles, subtitles,
// data sources) lives in each issue's own HTML and overrides this base.

const BASE_I18N = {
  es: {
    'brand-name': 'El Atlas',
    'brand-tag':  'Cartografías del desarrollo',

    'ctrl-x': 'Eje X',
    'ctrl-y': 'Eje Y',
    'ctrl-linear': 'Lineal',
    'ctrl-log':    'Log',

    'footer-download': 'Descargar datos (CSV)',

    'log-suffix':   ' — escala log',
    'log-suffix-y': ' — log',

    'c3-search-placeholder': 'Buscar país…',
    'c3-no-results': 'Sin resultados',
    'c3-tt-year': 'Año',

    'attribution-text': 'El Atlas · Daniel Schteingart',
    'attribution-href': 'https://elatlas.substack.com',

    'reg.Latin America':                          'América Latina',
    'reg.Caribbean':                              'Caribe',
    'reg.North America, Australia & New Zealand': 'América del Norte, Australia y N.Z.',
    'reg.Western Europe':                         'Europa Occidental',
    'reg.Eastern Europe & Central Asia':          'Europa del Este y Asia Central',
    'reg.East Asia':                              'Asia Oriental',
    'reg.Southeast Asia':                         'Sudeste Asiático',
    'reg.South Asia':                             'Asia del Sur',
    'reg.Middle East & North Africa':             'Medio Oriente y Norte de África',
    'reg.Sub-Saharan Africa':                     'África Subsahariana'
  },
  en: {
    'brand-name': 'The Atlas',
    'brand-tag':  'Mapping development',

    'ctrl-x': 'X axis',
    'ctrl-y': 'Y axis',
    'ctrl-linear': 'Linear',
    'ctrl-log':    'Log',

    'footer-download': 'Download data (CSV)',

    'log-suffix':   ' — log scale',
    'log-suffix-y': ' — log',

    'c3-search-placeholder': 'Search country…',
    'c3-no-results': 'No results',
    'c3-tt-year': 'Year',

    'attribution-text': 'The Atlas · Daniel Schteingart',
    'attribution-href': 'https://theatlasdev.substack.com',

    'reg.Latin America':                          'Latin America',
    'reg.Caribbean':                              'Caribbean',
    'reg.North America, Australia & New Zealand': 'N. America, Australia & N.Z.',
    'reg.Western Europe':                         'Western Europe',
    'reg.Eastern Europe & Central Asia':          'Eastern Europe & Central Asia',
    'reg.East Asia':                              'East Asia',
    'reg.Southeast Asia':                         'Southeast Asia',
    'reg.South Asia':                             'South Asia',
    'reg.Middle East & North Africa':             'Middle East & North Africa',
    'reg.Sub-Saharan Africa':                     'Sub-Saharan Africa'
  }
};
