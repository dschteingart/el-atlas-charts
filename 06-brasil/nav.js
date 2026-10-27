// =============================================================
//  El Atlas · Brasil — qué gráficos recorre la navegación de este número
// =============================================================
// La navegación (flechas, contador, CTA de suscripción y el renglón "De la
// nota") la dibuja lib/atlas-nav.js; acá solo va el orden del índice.
window.ATLAS_NAV = {
  charts: [
    'chart-mundo.html',
    'chart-exportaciones.html',
    'chart-china.html',
    'chart-demografia.html',
    'chart-hogares.html',
    'chart-religion.html',
    'chart-valores.html',
    'chart-educacion.html',
    'chart-pisa.html',
    'chart-pobreza.html'
  ]
};
(function () {
  // El motor vive en lib/atlas-nav.js: al editarlo, subir su ?v= acá (y el ?v=
  // de este nav.js en los HTML de la carpeta). El mapa de notas (lib/articulos.js)
  // lo pide el motor con un parámetro diario, así que actualizarlo no toca nada.
  var s = document.createElement('script');
  s.src = '../lib/atlas-nav.js?v=1';
  document.body.appendChild(s);
})();
