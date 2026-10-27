// =============================================================
//  El Atlas · Fútbol — qué gráficos recorre la navegación de este número
// =============================================================
// La navegación (flechas, contador, CTA de suscripción y el renglón "De la
// nota") la dibuja lib/atlas-nav.js; acá solo va el orden del índice.
// El N°3 cruza de carpeta (fusión del 2026-08-10): cada entrada dice dónde vive
// y el motor arma el href relativo a la carpeta actual. Este archivo es
// IDÉNTICO en 03-futbol y 03b-partidos.
window.ATLAS_NAV = {
  index: ['03-futbol', 'index.html'],   // el índice único del N°3 vive en 03-futbol
  charts: [
    ['03b-partidos', 'chart-actividad.html'],
    ['03-futbol', 'chart-clubage-map.html'],
    ['03b-partidos', 'chart-globalizacion.html'],
    ['03b-partidos', 'chart-flujos.html'],
    ['03b-partidos', 'chart-duelos.html'],
    ['03b-partidos', 'chart-amistosos.html'],
    ['03b-partidos', 'chart-neutral.html'],
    ['03b-partidos', 'chart-ciudades.html'],
    ['03-futbol', 'chart-birthplace.html'],
    ['03-futbol', 'chart-origenes.html'],
    ['03-futbol', 'chart-natividad.html'],
    ['03-futbol', 'chart-talento.html'],
    ['03-futbol', 'chart-talento-clubes.html'],
    ['03-futbol', 'chart-ligas.html'],
    ['03-futbol', 'chart-altura.html'],
    ['03-futbol', 'chart-edad.html'],
    ['03-futbol', 'chart-dts.html'],
    ['03-futbol', 'chart-elo-pib.html'],
    ['03-futbol', 'chart-elo-trayectoria.html'],
    ['03b-partidos', 'chart-versus.html'],
    ['03b-partidos', 'chart-goles.html'],
    ['03b-partidos', 'chart-instancias.html']
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
