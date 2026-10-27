// =============================================================
//  El Atlas — navegación entre gráficos (estilo OWID) + CTA Substack
//  + renglón "De la nota" que vuelve al artículo que cita el gráfico
// =============================================================
// Motor único: antes vivía copiado en el nav.js de cada número (siete copias
// iguales salvo la lista de gráficos). Ahora cada nav.js solo declara
//   window.ATLAS_NAV = { charts: [...] }
// y carga este archivo junto con lib/articulos.js (generado por
// tools/sync_articulos.py desde la API pública de Substack).
//
// Se autoinyecta en <div id="chart-nav"></div>: flechas ← →, contador
// "Gráfico N / M" (linkea al index) y una card de suscripción que cambia de
// publicación según el idioma activo (ES → El Atlas, EN → The Atlas).
// Además agrega un link sutil de suscripción en la .top-bar y, si la nota que
// cita el gráfico está en lib/articulos.js, el renglón "De la nota «…» →"
// ("Nota relacionada" si el gráfico no aparece en la nota)
// debajo de la barra (en los índices, un botón "Leé la nota").
// Nada de esto toca .chart-block: el PNG exportado no cambia.
//
// Cada entrada de charts es 'archivo.html' (misma carpeta) o
// ['carpeta', 'archivo.html'] cuando el número cruza de carpeta (el N°3: los
// href se arman relativos a la carpeta desde donde se está mirando).
(function () {
  const CFG = window.ATLAS_NAV || {};
  const SUBS = { es: 'https://elatlas.substack.com', en: 'https://atlasdevelopment.substack.com' };
  const T = {
    es: { label: 'Gráfico', sub: 'Suscribite gratis', eyebrow: 'El Atlas · Newsletter', pitch: 'Cartografías del desarrollo de América Latina y el mundo, con datos y gráficos interactivos.', prev: 'Gráfico anterior', next: 'Gráfico siguiente', all: 'Ver todos los gráficos', home: 'Ir al inicio de El Atlas', from: 'De la nota', related: 'Nota relacionada', read: 'Leé la nota' },
    en: { label: 'Chart', sub: 'Subscribe for free', eyebrow: 'The Atlas · Newsletter', pitch: 'Mapping development in Latin America and the world, with data and interactive charts.', prev: 'Previous chart', next: 'Next chart', all: 'See all charts', home: 'Go to The Atlas home', from: 'From the article', related: 'Related article', read: 'Read the article' }
  };

  // En inglés, atlasSyncSharePath() (lib/utils.js) reescribe la barra a la
  // landing …-en.html antes de que este motor corra. El archivo se normaliza a
  // su nombre real: si no, en inglés la página no se encontraba en la lista y
  // perdía flechas y contador (pasaba en producción, no por file://, donde el
  // navegador bloquea la reescritura).
  const parts = location.pathname.split('/').filter(Boolean);
  const endsWithSlash = location.pathname.endsWith('/');
  const file = (endsWithSlash ? 'index.html' : (parts[parts.length - 1] || 'index.html'))
    .toLowerCase().replace(/-en\.html$/, '.html');
  const folder = endsWithSlash ? (parts[parts.length - 1] || '') : (parts[parts.length - 2] || '');
  const chartKey = folder + '/' + file;

  // href relativo a la carpeta actual: misma carpeta → ./x.html; otra → ../carpeta/x.html
  const entry = c => Array.isArray(c) ? c : [folder, c];
  const href = c => (c[0] === folder) ? ('./' + c[1]) : ('../' + c[0] + '/' + c[1]);
  const CHARTS = (CFG.charts || []).map(entry);
  const INDEX = CFG.index ? href(entry(CFG.index)) : './index.html'; // índice de esta entrega
  const SITE_HOME = CFG.siteHome || '../index.html';                 // inicio del sitio

  // Parámetros de campaña: Substack los muestra como fuente del tráfico, así se
  // sabe cuánto vuelve desde los gráficos (hoy aparece como un referrer más).
  function track(url) {
    const sep = url.indexOf('?') < 0 ? '?' : '&';
    return url + sep + 'utm_source=el-atlas-charts&utm_medium=grafico&utm_campaign=' + encodeURIComponent(folder || 'sitio');
  }
  function lang() {
    if (typeof LANG !== 'undefined' && LANG) return LANG;
    return (document.documentElement.getAttribute('lang') === 'en') ? 'en' : 'es';
  }
  // La nota que cita este gráfico. Muchos gráficos de un número no aparecen en
  // la nota (en el del fútbol, la mayoría): a esos les toca la nota del número
  // como "relacionada", nunca como "De la nota", que diría algo falso.
  function article(L) {
    const A = window.ATLAS_ARTICULOS; if (!A) return null;
    const byChart = (A.graficos || {})[chartKey];
    const direct = !!(byChart && byChart[L]);
    const slug = direct ? byChart[L] : ((A.carpetas || {})[folder] || {})[L];
    const note = slug ? (A.notas || {})[slug] : null;
    return note ? { note: note, direct: direct } : null;
  }

  function render(force) {
    const host = document.getElementById('chart-nav'); if (!host) return;
    const L = ((force || lang()) === 'en') ? 'en' : 'es', t = T[L];
    const cta = `<a class="atlas-cta" href="${track(SUBS[L] + '/subscribe')}" target="_blank" rel="noopener">`
      + `<span class="atlas-cta-eyebrow">${t.eyebrow}</span>`
      + `<span class="atlas-cta-pitch">${t.pitch}</span>`
      + `<span class="atlas-cta-go">${t.sub} →</span></a>`;
    const idx = CHARTS.findIndex(c => c[1] === file && c[0] === folder);
    if (idx < 0) { host.innerHTML = cta; return; }   // index / otra página → solo CTA
    const n = CHARTS.length, num = idx + 1;
    const prev = idx > 0 ? CHARTS[idx - 1] : null;
    const next = idx < n - 1 ? CHARTS[idx + 1] : null;
    const arrow = (c, glyph, label) => c
      ? `<a class="atlas-nav-arrow" href="${href(c)}" aria-label="${label}">${glyph}</a>`
      : `<span class="atlas-nav-arrow is-off" aria-hidden="true">${glyph}</span>`;
    host.innerHTML =
      `<div class="atlas-nav">
         ${arrow(prev, '←', t.prev)}
         <a class="atlas-nav-count" href="${INDEX}" title="${t.all}">${t.label} ${num} / ${n}</a>
         ${arrow(next, '→', t.next)}
       </div>
       <a class="atlas-nav-all" href="${INDEX}">${t.all} →</a>` + cta;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // Renglón "De la nota" (gráficos) o botón "Leé la nota" (índices).
  function renderFrom(force) {
    const L = ((force || lang()) === 'en') ? 'en' : 'es', t = T[L];
    const art = article(L);
    let el = document.querySelector('.atlas-from');
    if (!art) { if (el) el.remove(); return; }
    const header = document.querySelector('header');
    if (!header) return;
    const lede = header.querySelector('.lede');
    if (!el) {
      el = document.createElement('a');
      el.className = 'atlas-from' + (lede ? ' is-index' : '');
      el.target = '_blank'; el.rel = 'noopener';
      if (lede) lede.insertAdjacentElement('afterend', el);
      else {
        const bar = header.querySelector('.top-bar');
        if (bar) bar.insertAdjacentElement('afterend', el); else header.appendChild(el);
      }
    }
    el.href = track(art.note.url);
    // En un índice cuya nota se llama igual que la página, el título repetido sobra.
    const norm = x => String(x || '').toLowerCase().replace(/[^a-záéíóúñü0-9]+/g, '');
    const h1 = header.querySelector('h1');
    const repeated = !!(lede && h1 && norm(h1.textContent) === norm(art.note.title));
    el.innerHTML = lede
      ? `<span class="atlas-from-go">${t.read} →</span>` + (repeated ? '' : `<span class="atlas-from-t">${esc(art.note.title)}</span>`)
      : `<span class="atlas-from-k">${art.direct ? t.from : t.related}</span> <span class="atlas-from-t">${esc(art.note.title)}</span> <span class="atlas-from-arrow">→</span>`;
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
      .atlas-top-sub:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }
      .atlas-from { display: block; margin: 10px 0 2px; font-family: var(--sans); font-size: 13px; line-height: 1.4; color: var(--ink-muted); text-decoration: none; }
      .atlas-from-k { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); margin-right: 4px; }
      .atlas-from-t { font-family: var(--serif); font-style: italic; color: var(--ink-soft); }
      .atlas-from-arrow { color: var(--accent); font-weight: 600; }
      .atlas-from:hover .atlas-from-t { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
      .atlas-from.is-index { display: inline-flex; flex-direction: column; gap: 3px; margin: 2px 0 16px; padding: 10px 16px; border: 1px solid var(--accent); border-radius: 12px; }
      .atlas-from.is-index .atlas-from-go { font-weight: 700; font-size: 14px; color: var(--accent); }
      .atlas-from.is-index .atlas-from-t { font-size: 14px; }
      .atlas-from.is-index:hover { background: rgba(190,93,50,.06); }`;
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
    a.setAttribute('href', track(SUBS[L] + '/subscribe'));
  }
  // La barra de arriba tiene DOS destinos, cada uno donde dice (decisión con
  // Daniel, 2026-08-14): la marca lleva al inicio del sitio y el tópico al
  // índice de esta entrega. Idempotente.
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
    const enElIndice = INDEX.split('/').pop() === file;
    if (topico && !topico.closest('a') && !enElIndice) {
      const a2 = document.createElement('a');
      a2.className = 'atlas-section';
      a2.href = INDEX;
      a2.title = T[lang()].all;
      topico.parentNode.insertBefore(a2, topico);
      a2.appendChild(topico);
    }
  }
  // lib/articulos.js cambia con cada número (lo regenera tools/sync_articulos.py).
  // Se pide con un parámetro diario en vez de un ?v= fijo: así el mapa nuevo les
  // llega a todos en el día sin tocar los nav.js ni los HTML de cada carpeta.
  function loadArticles(cb) {
    if (window.ATLAS_ARTICULOS) { cb(); return; }
    const s = document.createElement('script');
    s.src = '../lib/articulos.js?d=' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
    s.onload = cb;
    s.onerror = function () {};   // sin mapa, la página sigue igual que antes
    document.body.appendChild(s);
  }
  function init() {
    injectCss();
    render();
    loadArticles(function () { renderFrom(); });
    mountBrandLink();
    mountTopCta();
    document.querySelectorAll('.lang-toggle [data-lang]').forEach(b =>
      b.addEventListener('click', () => {
        const L = b.getAttribute('data-lang');
        render(L);
        renderFrom(L);
        updateTopCta(L);
      }));
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
