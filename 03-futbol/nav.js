// =============================================================
//  El Atlas N°3 — navegación entre gráficos (estilo OWID) + CTA Substack
// =============================================================
// Se autoinyecta en <div id="chart-nav"></div>: flechas ← →, contador
// "Gráfico N / 8" (linkea al index) y un botón de suscripción que cambia de
// publicación según el idioma activo (ES → El Atlas, EN → The Atlas).
//
// Autocontenido: lee el idioma del global LANG (fallback a <html lang>), y se
// re-renderiza al togglear idioma. No depende de i18n-issue.js.
(function () {
  // Orden de los 8 gráficos del número (= orden del index).
  const CHARTS = [
    'chart-elo-pib.html',
    'chart-talento.html',
    'chart-clubage-map.html',
    'chart-talento-clubes.html',
    'chart-elo-trayectoria.html',
    'chart-natividad.html',
    'chart-ligas.html',
    'chart-birthplace.html'
  ];
  const SUBS = { es: 'https://elatlas.substack.com', en: 'https://atlasdevelopment.substack.com' };
  const T = {
    es: { label: 'Gráfico', sub: 'Suscribite a El Atlas', prev: 'Gráfico anterior', next: 'Gráfico siguiente', all: 'Ver todos los gráficos' },
    en: { label: 'Chart', sub: 'Subscribe to The Atlas', prev: 'Previous chart', next: 'Next chart', all: 'See all charts' }
  };
  function lang() {
    if (typeof LANG !== 'undefined' && LANG) return LANG;
    return (document.documentElement.getAttribute('lang') === 'en') ? 'en' : 'es';
  }
  function render(force) {
    const host = document.getElementById('chart-nav'); if (!host) return;
    const L = ((force || lang()) === 'en') ? 'en' : 'es', t = T[L];
    const cta = `<a class="atlas-cta" href="${SUBS[L]}" target="_blank" rel="noopener">${t.sub} →</a>`;
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
       </div>` + cta;
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
      .atlas-cta { display: inline-flex; align-items: center; gap: 6px; font-family: var(--sans); font-size: 14px; font-weight: 600; color: #fff; background: var(--accent); padding: 10px 22px; border-radius: 24px; text-decoration: none; box-shadow: 0 2px 8px rgba(190,93,50,.25); transition: transform .12s ease, box-shadow .12s ease; }
      .atlas-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(190,93,50,.35); }`;
    const st = document.createElement('style'); st.id = 'atlas-nav-css'; st.textContent = css;
    document.head.appendChild(st);
  }
  function init() {
    injectCss();
    render();
    // Re-render sincrónico al cambiar idioma, usando el data-lang del botón
    // clickeado (sin depender de rAF ni del orden con setupLangToggle).
    document.querySelectorAll('.lang-toggle [data-lang]').forEach(b =>
      b.addEventListener('click', () => render(b.getAttribute('data-lang'))));
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
