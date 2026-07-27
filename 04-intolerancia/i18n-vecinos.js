// Strings del graficador de la batería de vecinos (chart-vecinos.html).
// Se enchufan sobre I18N (ya construido en i18n-issue.js). Sólo las etiquetas
// de las pestañas y el encabezado del graficador; el resto de las claves (títulos,
// subtítulos, fuentes de cada vista) ya viven en i18n-issue.js.
(function () {
  if (typeof I18N === 'undefined') return;
  Object.assign(I18N.es, {
    'g-eyebrow':        'La batería de vecinos',
    'g-lead':           'A quién no querría de vecino cada sociedad. Elegí una categoría, países y mirá el mismo dato de cuatro maneras.',
    'g-view-ranking':   'Ranking',
    'g-view-mapa':      'Mapa',
    'g-view-pelicula':  'Evolución',
    'g-view-perfil':    'Perfil',
    'g-tabs-label':     'Ver como',
  });
  Object.assign(I18N.en, {
    'g-eyebrow':        'The neighbours battery',
    'g-lead':           'Who each society would not want as a neighbour. Pick a category and countries, and see the same data four ways.',
    'g-view-ranking':   'Ranking',
    'g-view-mapa':      'Map',
    'g-view-pelicula':  'Trend',
    'g-view-perfil':    'Profile',
    'g-tabs-label':     'View as',
  });
})();
