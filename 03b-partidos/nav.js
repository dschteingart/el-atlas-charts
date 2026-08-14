// =============================================================
//  El Atlas N°3 — "El Atlas del fútbol"
//  Navegación entre los 22 gráficos (estilo OWID) + CTA Substack
// =============================================================
// Se autoinyecta en <div id="chart-nav"></div>: flechas ← →, contador
// "Gráfico N / 22" (linkea al índice único) y una card de suscripción que
// cambia de publicación según el idioma activo (ES → El Atlas, EN → The Atlas).
// Además agrega un link sutil de suscripción en la .top-bar (arriba).
//
// FUSIÓN (2026-08-10): el ex "Especial de partidos" se integró al N°3. Los
// archivos NO se movieron —mover rompería los links que ya se compartieron y
// las configuraciones guardadas del editor, que se indexan por el número
// interno de cada gráfico—, así que la navegación cruza de carpeta: cada
// entrada dice en qué carpeta vive y el href se arma relativo a la carpeta
// desde donde se está mirando. Este archivo es IDÉNTICO en las dos carpetas.
//
// Autocontenido: lee el idioma del global LANG (fallback a <html lang>), y se
// re-renderiza al togglear idioma. No depende de i18n-issue.js.
(function () {
  // Orden temático de los 22 (= orden del índice único, en 03-futbol/index.html):
  // (1) cuánto y dónde se juega, (2) de dónde salen los jugadores, (3) quién gana.
  const F3 = '03-futbol', FP = '03b-partidos';
  const CHARTS = [
    [FP, 'chart-actividad.html'],
    [F3, 'chart-clubage-map.html'],
    [FP, 'chart-globalizacion.html'],
    [FP, 'chart-flujos.html'],
    [FP, 'chart-duelos.html'],
    [FP, 'chart-amistosos.html'],
    [FP, 'chart-neutral.html'],
    [FP, 'chart-ciudades.html'],
    [F3, 'chart-birthplace.html'],
    [F3, 'chart-origenes.html'],
    [F3, 'chart-natividad.html'],
    [F3, 'chart-talento.html'],
    [F3, 'chart-talento-clubes.html'],
    [F3, 'chart-ligas.html'],
    [F3, 'chart-altura.html'],
    [F3, 'chart-edad.html'],
    [F3, 'chart-dts.html'],
    [F3, 'chart-elo-pib.html'],
    [F3, 'chart-elo-trayectoria.html'],
    [FP, 'chart-versus.html'],
    [FP, 'chart-goles.html'],
    [FP, 'chart-instancias.html']
  ];
  // Carpeta desde la que se está mirando (penúltimo segmento de la ruta).
  const HERE = (function () {
    const segs = location.pathname.split('/').filter(Boolean);
    return segs.length > 1 ? segs[segs.length - 2] : F3;
  })();
  // href relativo a HERE: mismo directorio → ./x.html; el otro → ../carpeta/x.html
  function href(dir, file) { return (dir === HERE) ? ('./' + file) : ('../' + dir + '/' + file); }
  const INDEX = href(F3, 'index.html');   // el índice único vive en 03-futbol
  const SITE_HOME = '../index.html';   // inicio del sitio (las 4 entregas)
  const SUBS = { es: 'https://elatlas.substack.com', en: 'https://atlasdevelopment.substack.com' };
  const T = {
    es: { label: 'Gráfico', sub: 'Suscribite gratis', eyebrow: 'El Atlas · Newsletter', pitch: 'Cartografías del desarrollo de América Latina y el mundo, con datos y gráficos interactivos.', prev: 'Gráfico anterior', next: 'Gráfico siguiente', all: 'Ver todos los gráficos', home: 'Ir al inicio de El Atlas' },
    en: { label: 'Chart', sub: 'Subscribe for free', eyebrow: 'The Atlas · Newsletter', pitch: 'Mapping development in Latin America and the world, with data and interactive charts.', prev: 'Previous chart', next: 'Next chart', all: 'See all charts', home: 'Go to The Atlas home' }
  };
  function lang() {
    if (typeof LANG !== 'undefined' && LANG) return LANG;
    return (document.documentElement.getAttribute('lang') === 'en') ? 'en' : 'es';
  }
  function render(force) {
    const host = document.getElementById('chart-nav'); if (!host) return;
    const L = ((force || lang()) === 'en') ? 'en' : 'es', t = T[L];
    const cta = `<a class="atlas-cta" href="${SUBS[L]}" target="_blank" rel="noopener">`
      + `<span class="atlas-cta-eyebrow">${t.eyebrow}</span>`
      + `<span class="atlas-cta-pitch">${t.pitch}</span>`
      + `<span class="atlas-cta-go">${t.sub} →</span></a>`;
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const idx = CHARTS.findIndex(c => c[1] === file && c[0] === HERE);
    if (idx < 0) { host.innerHTML = cta; return; }   // index / otra página → solo CTA
    const n = CHARTS.length, num = idx + 1;
    const prev = idx > 0 ? CHARTS[idx - 1] : null;
    const next = idx < n - 1 ? CHARTS[idx + 1] : null;
    const arrow = (c, glyph, label) => c
      ? `<a class="atlas-nav-arrow" href="${href(c[0], c[1])}" aria-label="${label}">${glyph}</a>`
      : `<span class="atlas-nav-arrow is-off" aria-hidden="true">${glyph}</span>`;
    host.innerHTML =
      `<div class="atlas-nav">
         ${arrow(prev, '←', t.prev)}
         <a class="atlas-nav-count" href="${INDEX}" title="${t.all}">${t.label} ${num} / ${n}</a>
         ${arrow(next, '→', t.next)}
       </div>
       <a class="atlas-nav-all" href="${INDEX}">${t.all} →</a>` + cta;
  }
  function injectCss() {
    if (document.getElementById('atlas-nav-css')) return;
    const css = `
      #chart-nav { margin: 22px 0 4px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .atlas-nav { display: flex; align-items: center; gap: 18px; }
      .atlas-nav-arrow { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--rule); color: var(--ink); text-decoration: none; font-size: 18px; transition: border-color .15s ease, color .15s ease; }
      .atlas-nav-arrow:hover { border-color: var(--accent); color: var(--accent); }
      .atlas-nav-arrow.is-off { opacity: .28; pointer-events: none; }
      .atlas-nav-count { font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--ink-muted); text-decoration: none; letter-spacing: .07em; text-transform: uppercase; min-width: 92px; text-align: center; }
      .atlas-nav-count:hover { color: var(--accent); }
      .atlas-nav-all { font-family: var(--sans); font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
      .atlas-nav-all:hover { text-decoration: underline; text-underline-offset: 3px; }
      .brand a.atlas-home, .brand a.atlas-section { color: inherit; text-decoration: none; }
      .brand a.atlas-home:hover, .brand a.atlas-section:hover { color: var(--accent); }
      .atlas-cta { display: flex; flex-direction: column; align-items: center; gap: 9px; max-width: 460px; text-align: center; text-decoration: none; background: var(--bg); border: 1px solid var(--rule); border-radius: 14px; padding: 18px 24px 16px; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
      .atlas-cta:hover { border-color: var(--accent); box-shadow: 0 6px 20px rgba(190,93,50,.13); transform: translateY(-1px); }
      .atlas-cta-eyebrow { font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
      .atlas-cta-pitch { font-family: var(--serif); font-size: 15px; line-height: 1.4; color: var(--ink); max-width: 380px; }
      .atlas-cta-go { display: inline-flex; align-items: center; font-family: var(--sans); font-size: 14px; font-weight: 600; color: #fff; background: var(--accent); padding: 9px 20px; border-radius: 22px; margin-top: 2px; }
      .atlas-top-right { display: inline-flex; align-items: center; gap: 16px; }
      .atlas-top-sub { font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--accent); text-decoration: none; white-space: nowrap; opacity: .9; transition: opacity .15s ease; }
      .atlas-top-sub:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }`;
    const st = document.createElement('style'); st.id = 'atlas-nav-css'; st.textContent = css;
    document.head.appendChild(st);
  }
  // Link sutil de suscripción en la barra superior (presencia "al principio"
  // sin empujar el gráfico ni meter otra card). Agrupa el link con el
  // lang-toggle a la derecha de la top-bar. Idempotente.
  function mountTopCta() {
    const bar = document.querySelector('.top-bar');
    if (!bar || bar.querySelector('.atlas-top-sub')) return;
    const a = document.createElement('a');
    a.className = 'atlas-top-sub';
    a.target = '_blank'; a.rel = 'noopener';
    const toggle = bar.querySelector('.lang-toggle');
    if (toggle) {
      // Agrupar [link][ES/EN] a la derecha: el toggle queda en su esquina.
      const right = document.createElement('div');
      right.className = 'atlas-top-right';
      bar.insertBefore(right, toggle);
      right.appendChild(a);
      right.appendChild(toggle);
    } else {
      bar.appendChild(a);
    }
    updateTopCta();
  }
  function updateTopCta(force) {
    const a = document.querySelector('.atlas-top-sub'); if (!a) return;
    const L = ((force || lang()) === 'en') ? 'en' : 'es';
    a.textContent = T[L].sub + ' →';
    a.setAttribute('href', SUBS[L]);
  }
  // En páginas de gráfico, hacer del "El Atlas · N° 3" de la top-bar un link al
  // índice (patrón logo→home), para volver claro al listado general cuando se
  // entra directo a un gráfico desde un link compartido. Idempotente.
  // La barra de arriba tiene DOS destinos, cada uno donde dice (decisión con
  // Daniel, 2026-08-14): la marca lleva al inicio del sitio y el tópico al
  // índice de esta entrega. Antes todo el bloque era un solo link al índice:
  // decía "El Atlas" pero no llevaba a El Atlas, y al sacar el número de
  // entrega el desajuste quedó a la vista. Idempotente.
  function mountBrandLink() {
    const brand = document.querySelector('.top-bar .brand');
    if (!brand || brand.querySelector('a.atlas-home')) return;
    const marca = brand.querySelector('.brand-em');
    if (marca && !marca.closest('a')) {
      const a = document.createElement('a');
      a.className = 'atlas-home';
      a.href = SITE_HOME;
      a.title = T[lang()].home;
      marca.parentNode.insertBefore(a, marca);
      a.appendChild(marca);
    }
    const topico = brand.querySelector('.brand-topic');
    // En el propio índice el tópico no linkea (ya estás ahí).
    const enElIndice = INDEX.split('/').pop() === (location.pathname.split('/').pop() || 'index.html');
    if (topico && !topico.closest('a') && !enElIndice) {
      const a2 = document.createElement('a');
      a2.className = 'atlas-section';
      a2.href = INDEX;
      a2.title = T[lang()].all;
      topico.parentNode.insertBefore(a2, topico);
      a2.appendChild(topico);
    }
  }
  function init() {
    injectCss();
    render();
    mountBrandLink();
    mountTopCta();
    // Re-render sincrónico al cambiar idioma, usando el data-lang del botón
    // clickeado (sin depender de rAF ni del orden con setupLangToggle).
    document.querySelectorAll('.lang-toggle [data-lang]').forEach(b =>
      b.addEventListener('click', () => {
        const L = b.getAttribute('data-lang');
        render(L);
        updateTopCta(L);
      }));
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
