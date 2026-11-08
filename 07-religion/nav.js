// =============================================================
//  El Atlas · Religión — qué gráficos recorre la navegación de este número
// =============================================================
// La navegación (flechas, contador, CTA de suscripción y el renglón "De la
// nota") la dibuja lib/atlas-nav.js; acá solo va el orden del índice, que es
// el de la nota.
window.ATLAS_NAV = {
  charts: [
    'chart-siglo.html',
    'chart-rutas.html',
    'chart-pib-evangelicos.html',
    'chart-practicantes.html',
    'chart-sin-religion-creyentes.html',
    'chart-creencia.html',
    'chart-dios-pib.html',
    'chart-dios-religion.html'
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
