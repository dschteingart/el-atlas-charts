// =============================================================
//  El Atlas N°5 — navegación entre gráficos (estilo OWID) + CTA Substack
// =============================================================
// Se autoinyecta en <div id="chart-nav"></div>: flechas ← →, contador
// "Gráfico N / M" (linkea al index) y una card de suscripción que cambia de
// publicación según el idioma activo (ES → El Atlas, EN → The Atlas).
// Además agrega un link sutil de suscripción en la .top-bar (arriba).
//
// Autocontenido: lee el idioma del global LANG (fallback a <html lang>), y se
// re-renderiza al togglear idioma. No depende de i18n-issue.js.
(function () {
  // Orden de los gráficos del N°5 (= orden del index). Se amplía a medida
  // que se agregan charts.
  const CHARTS = [
    'chart-ranking.html',
    'chart-pelicula.html',
    'chart-mapa.html',
    'chart-perfil.html',
    'chart-declarado-implicito.html',
    'chart-latinobarometro.html',
    'chart-prioridad.html',
    'chart-barrio.html',
    'chart-migrantes.html',
    'chart-confianza.html',
    'chart-discriminado.html',
    'chart-quien.html'
  ];
  const SUBS = { es: 'https://elatlas.substack.com', en: 'https://atlasdevelopment.substack.com' };
  const T = {
    es: { label: 'Gráfico', sub: 'Suscribite gratis', eyebrow: 'El Atlas · Newsletter', pitch: 'Cartografías del desarrollo de América Latina y el mundo, con datos y gráficos interactivos.', prev: 'Gráfico anterior', next: 'Gráfico siguiente', all: 'Ver todos los gráficos' },
    en: { label: 'Chart', sub: 'Subscribe for free', eyebrow: 'The Atlas · Newsletter', pitch: 'Mapping development in Latin America and the world, with data and interactive charts.', prev: 'Previous chart', next: 'Next chart', all: 'See all charts' }
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
    const idx = CHARTS.indexOf(file);
    if (idx < 0) { host.innerHTML = cta; return; }   // index / otra página → solo CTA
    const n = CHARTS.length, num = idx + 1;
    const prev = idx > 0 ? CHARTS[idx - 1] : null;
    const next = idx < n - 1 ? CHARTS[idx + 1] : null;
    const arrow = (file2, glyph, label) => file2
      ? `<a class="atlas-nav-arrow" href="./${file2}" aria-label="${label}">${glyph}</a>`
      : `<span class="atlas-nav-arrow is-off" aria-hidden="true">${glyph}</span>`;
    host.innerHTML =
      `<div class="atlas-nav">
         ${arrow(prev, '←', t.prev)}
         <a class="atlas-nav-count" href="./index.html" title="${t.all}">${t.label} ${num} / ${n}</a>
         ${arrow(next, '→', t.next)}
       </div>
       <a class="atlas-nav-all" href="./index.html">${t.all} →</a>` + cta;
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
      .brand a.atlas-home { color: inherit; text-decoration: none; }
      .brand a.atlas-home:hover { color: var(--accent); }
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
  function mountTopCta() {
    const bar = document.querySelector('.top-bar');
    if (!bar || bar.querySelector('.atlas-top-sub')) return;
    const a = document.createElement('a');
    a.className = 'atlas-top-sub';
    a.target = '_blank'; a.rel = 'noopener';
    const toggle = bar.querySelector('.lang-toggle');
    if (toggle) {
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
  function mountBrandLink() {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    if (CHARTS.indexOf(file) < 0) return;   // solo en páginas de gráfico
    const brand = document.querySelector('.top-bar .brand');
    if (!brand || brand.querySelector('a.atlas-home')) return;
    const a = document.createElement('a');
    a.className = 'atlas-home';
    a.href = './index.html';
    a.title = T[lang()].all;
    while (brand.firstChild) a.appendChild(brand.firstChild);
    brand.appendChild(a);
  }
  function init() {
    injectCss();
    render();
    mountBrandLink();
    mountTopCta();
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
