/* Mapa electoral de Brasil (presidente): 2022 histórico + 2026 en vivo.
   Datos: window.ELEC['2022-1'|'2022-2'] (data/elecciones-2022.js) y, para 2026,
   data/vivo/2026-<turno>.json que escribe vivo.py leyendo al TSE.
   Geometría: window.GEO_BR (js/geo-br.js), proyección Albers, viewBox 1000×910.
   Estado compartible en el hash: #mapa?e=2022-2&n=mun&m=cand&c=13 */
(function () {
  const { el, fmt, LOC } = window.Charts;
  const BG = '#FAF8F3', SIN = '#E3DED0';
  const EN = window.LANG === 'en';
  const T = (es, en) => (EN ? en : es);
  const num = v => v.toLocaleString(LOC());
  // En la web (GitHub Pages) el escrutinio 2026 no se puede leer (lo hace vivo.py en la copia local):
  // ahí los botones 2026 quedan deshabilitados "a la espera de resultados".
  const EN_LA_WEB = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const VIVO_OK = !EN_LA_WEB || !!window.VIVO_PUBLICO;   // en el sitio público en vivo, el escrutinio sí se lee
  // pantallas táctiles (celular, tablet): zoom sin animación, que con miles de polígonos se traba
  const LIGERO = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  // Colores por número de urna (mismo número = mismo color en 2022 y 2026)
  const COLOR = {
    '13': '#C8372D', // Lula (PT)
    '22': '#234B85', // Jair Bolsonaro 2022 / Flávio Bolsonaro 2026 (PL)
    '15': '#C9A227', // Simone Tebet 2022 (MDB)
    '12': '#2D6A3D', // Ciro Gomes 2022 (PDT)
    '44': '#6B3D8B', // Soraya Thronicke 2022
    '30': '#E07A23', // Novo: Felipe d'Avila 2022 / Romeu Zema 2026
    '55': '#2C8484', // Ronaldo Caiado 2026 (PSD)
    '14': '#6B3D8B', // Renan Santos 2026 (Missão)
    '70': '#C9A227', // Augusto Cury 2026 (Avante)
  };
  const OTROS = '#8A8579';
  const colorDe = n => COLOR[n] || OTROS;

  const ELECCIONES = [
    { id: '2022-1', nm: T('2022 · 1ª vuelta', '2022 · 1st round'), corto: T('2022 1ª', '2022 1st') },
    { id: '2022-2', nm: T('2022 · 2ª vuelta', '2022 · runoff'), corto: T('2022 2ª', '2022 2nd') },
    { id: '2026-1', nm: T('2026 · 1ª vuelta', '2026 · 1st round'), corto: T('2026 1ª', '2026 1st'), vivo: true },
    { id: '2026-2', nm: T('2026 · 2ª vuelta', '2026 · runoff'), corto: T('2026 2ª', '2026 2nd'), vivo: true },
  ];
  const UF = {
    '11': ['RO', 'Rondônia'], '12': ['AC', 'Acre'], '13': ['AM', 'Amazonas'], '14': ['RR', 'Roraima'],
    '15': ['PA', 'Pará'], '16': ['AP', 'Amapá'], '17': ['TO', 'Tocantins'], '21': ['MA', 'Maranhão'],
    '22': ['PI', 'Piauí'], '23': ['CE', 'Ceará'], '24': ['RN', 'Rio Grande do Norte'], '25': ['PB', 'Paraíba'],
    '26': ['PE', 'Pernambuco'], '27': ['AL', 'Alagoas'], '28': ['SE', 'Sergipe'], '29': ['BA', 'Bahia'],
    '31': ['MG', 'Minas Gerais'], '32': ['ES', 'Espírito Santo'], '33': ['RJ', T('Río de Janeiro', 'Rio de Janeiro')], '35': ['SP', 'São Paulo'],
    '41': ['PR', 'Paraná'], '42': ['SC', 'Santa Catarina'], '43': ['RS', 'Rio Grande do Sul'], '50': ['MS', 'Mato Grosso do Sul'],
    '51': ['MT', 'Mato Grosso'], '52': ['GO', 'Goiás'], '53': ['DF', 'Distrito Federal'],
  };
  const SG2COD = Object.fromEntries(Object.entries(UF).map(([c, v]) => [v[0], c]));
  const ORDEN_2026 = ['13', '22', '55', '30', '14', '70', '27', '21', '16', '80', '35', '28', '29'];

  const st = { elec: window.VIVO_PUBLICO ? '2026-1' : '2022-1', nivel: 'uf', modo: 'ganador', cand: '13', foco: null, mun: null };
  const nomMun = ib => (window.MUN_NOMES || {})[ib] || null;   // [nombre, sigla del estado]
  const vivo = {};          // id -> datos 2026 cargados
  let estadoVivo = {};      // id -> 'ok' | 'sin-servidor' | 'esperando'
  let timer = null, raiz = null, cache = null;

  /* ---------- color ---------- */
  function hex2rgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return '#' + A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, '0')).join('');
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rampGanador = (col, share) => mix(BG, col, 0.24 + 0.76 * clamp((share - 0.38) / 0.42, 0, 1));
  // % de un candidato: la escala va de 0 al máximo de ese candidato (si no, los chicos quedan del color del fondo)
  let escCand = 0.85;
  const rampCand = (col, share, max = escCand) => mix('#F1EDE2', col, clamp(share / max, 0, 1) ** 0.9);
  function rampDelta(n, d) { // d en puntos porcentuales
    const pos = colorDe(n), neg = n === '13' ? COLOR['22'] : n === '22' ? COLOR['13'] : '#6E6A60';
    const t = clamp(Math.abs(d) / 15, 0, 1) ** 0.85;
    return d >= 0 ? mix('#F1EDE2', pos, t) : mix('#F1EDE2', neg, t);
  }

  /* ---------- datos ---------- */
  const datos = id => (id.startsWith('2022') ? window.ELEC[id] : vivo[id]);
  function filaUF(D, sg) { return D && D.uf[sg] ? D.uf[sg] : null; }
  function filaMun(D, ib) {
    const r = D && D.mun[ib];
    return r ? { v: r[0], val: r[1], bn: r[2], apt: r[3], com: r[4], pct: r[5] != null ? r[5] : (D.final ? 100 : null) } : null;
  }
  function ordenCands(D, fila) {
    const f = fila || D.nac;
    const idx = D.cands.map((c, i) => i);
    idx.sort((a, b) => (f.v[b] || 0) - (f.v[a] || 0) || ORDEN_2026.indexOf(D.cands[a].n) - ORDEN_2026.indexOf(D.cands[b].n));
    return idx;
  }
  function share(D, fila, n) {
    const i = D.cands.findIndex(c => c.n === n);
    return i < 0 || !fila || !fila.val ? null : fila.v[i] / fila.val;
  }
  function baseDelta() { return window.ELEC[st.elec === '2026-2' ? '2022-2' : '2022-1']; }

  function fillDe(D, fila, filaPrev) {
    if (!fila || !fila.val) return SIN;
    if (st.modo === 'ganador') {
      let bi = 0; fila.v.forEach((x, i) => { if (x > fila.v[bi]) bi = i; });
      return rampGanador(colorDe(D.cands[bi].n), fila.v[bi] / fila.val);
    }
    if (st.modo === 'cand') {
      const s = share(D, fila, st.cand);
      return s == null ? SIN : rampCand(colorDe(st.cand), s, escCand);
    }
    if (st.modo === 'delta') {
      const s = share(D, fila, st.cand), B = baseDelta(), s0 = filaPrev ? share(B, filaPrev, st.cand) : null;
      return s == null || s0 == null ? SIN : rampDelta(st.cand, 100 * (s - s0));
    }
  }

  /* ---------- carga en vivo ---------- */
  // vivo.py escribe data/vivo/<id>.js (window.VIVO[id] = {...}); se relee inyectando un <script>,
  // que funciona abriendo index.html directo del disco (sin servidor) y también por http.
  function cargarVivo(id) {
    const s = document.createElement('script');
    s.src = `data/vivo/${id}.js?_=${Date.now()}`;
    s.onload = () => {
      s.remove();
      const D = window.VIVO && window.VIVO[id];
      if (D) { vivo[id] = D; estadoVivo[id] = 'ok'; } else estadoVivo[id] = 'esperando';
      if (st.elec === id && raiz) pintar();
    };
    s.onerror = () => {
      s.remove();
      if (!vivo[id]) estadoVivo[id] = 'esperando';  // si ya había datos, se mantiene la última foto
      if (st.elec === id && raiz) pintar();
    };
    document.head.appendChild(s);
  }
  function programarVivo() {
    clearInterval(timer);
    const e = ELECCIONES.find(x => x.id === st.elec);
    if (e && e.vivo && VIVO_OK) { cargarVivo(st.elec); timer = setInterval(() => cargarVivo(st.elec), 15000); }
  }

  /* ---------- construcción del SVG (una sola vez) ---------- */
  function construirSVG() {
    const G = window.GEO_BR;
    const svg = el('svg', { viewBox: `0 0 ${G.w} ${G.h}`, preserveAspectRatio: 'xMidYMid meet' });
    const gMun = el('g', { class: 'g-mun' }, svg);
    const gUF = el('g', { class: 'g-uf' }, svg);
    const gBord = el('g', { class: 'g-bord' }, svg);
    const gSig = el('g', { class: 'g-sig' }, svg);
    const mun = {}, uf = {}, bord = {};
    G.mun.forEach(m => { mun[m.c] = el('path', { d: m.d, class: 'mun', 'data-c': m.c }, gMun); });
    G.uf.forEach(u => {
      uf[u.c] = el('path', { d: u.d, class: 'uf', 'data-u': u.c }, gUF);
      bord[u.c] = el('path', { d: u.d, class: 'ufb' }, gBord);
    });
    const sig = {};
    Object.entries(G.ufc).forEach(([c, p]) => {
      const off = { '53': [0, 0], '28': [8, 4], '27': [16, 2], '25': [26, 0], '24': [18, -4], '26': [36, 2], '32': [10, 6], '33': [8, 8] }[c] || [0, 0];
      sig[c] = el('text', { x: p[0] + off[0], y: p[1] + off[1], class: 'sig' }, gSig, UF[c][0]);
    });
    const gSel = el('g', { 'pointer-events': 'none' }, svg);
    const selHalo = el('path', { class: 'mun-sel-halo', display: 'none' }, gSel);
    const sel = el('path', { class: 'mun-sel', display: 'none' }, gSel);
    const anillo = el('circle', { class: 'mun-anillo', display: 'none' }, gSel);
    const marca = el('text', { x: G.w / 2, y: G.h / 2, 'text-anchor': 'middle', 'font-family': '"Source Sans 3", sans-serif', 'font-weight': 800, 'font-size': 64, fill: '#C9A227', 'fill-opacity': .35, transform: `rotate(-24 ${G.w / 2} ${G.h / 2})`, 'pointer-events': 'none', display: 'none' }, svg, 'SIMULACRO · DATOS FICTICIOS');
    return { svg, gMun, gUF, gBord, gSig, mun, uf, bord, sig, marca, selHalo, sel, anillo };
  }

  /* ---------- zoom ---------- */
  let vbActual = null;
  function animarViewBox(svg, dest) {
    const G = window.GEO_BR, ini = vbActual || [0, 0, G.w, G.h], t0 = performance.now(), dur = 650;
    function paso(now) {
      const k = clamp((now - t0) / dur, 0, 1), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const v = ini.map((x, i) => x + (dest[i] - x) * e);
      svg.setAttribute('viewBox', v.join(' ')); vbActual = v;
      if (k < 1) requestAnimationFrame(paso);
    }
    if (LIGERO || document.body.classList.contains('sin-anim')) { svg.setAttribute('viewBox', dest.join(' ')); vbActual = dest; return; }
    requestAnimationFrame(paso);
  }
  function enfocar(cod) {
    if (!cod || (st.mun && st.mun.slice(0, 2) !== cod)) st.mun = null;
    st.foco = cod;
    const G = window.GEO_BR;
    if (!cod) { animarViewBox(cache.svg, [0, 0, G.w, G.h]); }
    else {
      const b = cache.uf[cod].getBBox(), pad = Math.max(b.width, b.height) * 0.08;
      let w = b.width + 2 * pad, h = b.height + 2 * pad;
      const asp = G.w / G.h; if (w / h > asp) h = w / asp; else w = h * asp;
      animarViewBox(cache.svg, [b.x + b.width / 2 - w / 2, b.y + b.height / 2 - h / 2, w, h]);
    }
    pintar(); syncHash();
  }

  // elegir un municipio: zoom a su estado, se marca en el mapa y el panel muestra sus datos
  function elegirMun(ib) {
    st.mun = ib;
    const c = ib.slice(0, 2);
    if (st.foco !== c && cache.uf[c]) enfocar(c); else { pintar(); syncHash(); }
  }
  function soltarMun() { st.mun = null; pintar(); syncHash(); }

  /* ---------- pintado ---------- */
  function pintar() {
    if (!raiz) return;
    const D = datos(st.elec), B = baseDelta();
    const verMun = st.nivel === 'mun' || st.foco;
    escCand = 0.85;
    if (st.modo === 'cand' && D) {
      // tope de la escala: el percentil 98 del candidato en lo que se ve (redondeado a 5 puntos)
      const xs = [];
      if (verMun) { for (const ib in D.mun) { if (st.foco && ib.slice(0, 2) !== st.foco) continue; const x = share(D, filaMun(D, ib), st.cand); if (x != null) xs.push(x); } }
      else { for (const c in UF) { const x = share(D, filaUF(D, UF[c][0]), st.cand); if (x != null) xs.push(x); } }
      if (xs.length) { xs.sort((a, b) => a - b); escCand = Math.min(0.9, Math.max(0.05, Math.ceil(xs[Math.floor(0.98 * (xs.length - 1))] / 0.05) * 0.05)); }
    }
    cache.gMun.style.display = verMun ? '' : 'none';
    // con zoom a un estado se dibujan solo sus municipios; el resto del país va con los polígonos
    // de estado atenuados (27 en vez de 5.570: mucho más liviano, sobre todo en el celular)
    cache.gUF.style.display = !verMun || st.foco ? '' : 'none';
    Object.entries(cache.bord).forEach(([c, p]) => {
      p.classList.toggle('fuerte', !!verMun);
      p.style.display = verMun ? '' : 'none';
    });
    cache.gSig.style.display = st.foco ? 'none' : '';
    cache.marca.setAttribute('display', D && D.simulacro ? 'inline' : 'none');
    if (st.modo === 'delta' && !st.elec.startsWith('2026')) st.modo = 'ganador';
    if (D && !D.cands.some(c => c.n === st.cand)) st.cand = D.cands[ordenCands(D)[0]].n;

    if (verMun) {
      for (const ib in cache.mun) {
        const p = cache.mun[ib];
        if (st.foco && ib.slice(0, 2) !== st.foco) { if (p.style.display !== 'none') p.style.display = 'none'; continue; }
        if (p.style.display) p.style.display = '';
        p.setAttribute('fill', fillDe(D, filaMun(D, ib), filaMun(B, ib)));
      }
    }
    if (!verMun || st.foco) {
      for (const c in cache.uf) {
        const sg = UF[c][0], u = cache.uf[c];
        if (st.foco === c) { u.style.display = 'none'; continue; }
        u.style.display = '';
        u.setAttribute('fill', fillDe(D, filaUF(D, sg), filaUF(B, sg)));
        u.style.opacity = st.foco ? 0.25 : 1;
      }
    }
    // municipio elegido: contorno + un anillo (para encontrarlo aunque sea chiquito)
    const pm = st.mun && cache.mun[st.mun];
    [cache.selHalo, cache.sel, cache.anillo].forEach(e => e.setAttribute('display', pm ? 'inline' : 'none'));
    if (pm) {
      const d = pm.getAttribute('d');
      cache.selHalo.setAttribute('d', d); cache.sel.setAttribute('d', d);
      const b = pm.getBBox(), u = cache.uf[st.mun.slice(0, 2)].getBBox();
      cache.anillo.setAttribute('cx', b.x + b.width / 2); cache.anillo.setAttribute('cy', b.y + b.height / 2);
      cache.anillo.setAttribute('r', Math.max(b.width, b.height) / 2 + Math.max(u.width, u.height) * 0.035);
    }
    // siglas: blancas sobre colores oscuros
    for (const c in cache.sig) {
      const f = verMun ? null : cache.uf[c].getAttribute('fill');
      const dark = f && f !== SIN && hex2rgb(f).reduce((a, x) => a + x, 0) < 330;
      cache.sig[c].setAttribute('fill', dark ? '#FFFFFF' : '#1A1A1A');
      cache.sig[c].style.stroke = dark ? 'rgba(26,26,26,.35)' : 'rgba(250,248,243,.85)';
    }
    panel();
  }

  /* ---------- panel derecho ---------- */
  function boton(txt, on, fn, dis, hint) {
    const b = document.createElement('button'); b.textContent = txt;
    if (on) b.classList.add('on'); if (dis) b.disabled = true; if (hint) b.title = hint;
    b.addEventListener('click', fn); return b;
  }
  function grupo(lbl, botones) {
    const d = document.createElement('div');
    d.innerHTML = `<div class="ctrl-lbl">${lbl}</div>`;
    const t = document.createElement('div'); t.className = 'toggle'; botones.forEach(b => t.appendChild(b)); d.appendChild(t);
    return d;
  }
  function panel() {
    const P = raiz.querySelector('.mapa-panel'); P.innerHTML = '';
    const E = ELECCIONES.find(x => x.id === st.elec), D = datos(st.elec);
    const sg = st.foco ? UF[st.foco][0] : null;
    const nm = st.mun ? nomMun(st.mun) : null;
    const fila = D ? (st.mun ? filaMun(D, st.mun) : sg ? filaUF(D, sg) : D.nac) : null;

    // encabezado
    const h = document.createElement('div');
    let badge = '';
    if (E.vivo && D && D.simulacro) badge = `<span class="badge simu">${T('Simulacro · datos ficticios', 'Drill · fictitious data')}</span>`;
    else if (E.vivo && D && !D.final) badge = `<span class="badge vivo">${T('En vivo', 'Live')}</span>`;
    const titulo = st.mun ? (nm ? nm[0] : st.mun) : sg ? UF[st.foco][1] : T('Brasil', 'Brazil');
    const filaRef = st.mun ? (fila || filaMun(window.ELEC[st.elec.endsWith('2') ? '2022-2' : '2022-1'], st.mun)) : null;
    h.innerHTML = `<div class="kicker">${T('Presidente', 'President')} <span class="sep">·</span> ${E.nm} ${badge}</div>
      <div class="titulo" style="font-size:${titulo.length > 22 ? 44 : 56}px;margin-top:6px">${titulo}</div>` +
      (st.mun ? `<div class="mun-sub">${T('Municipio de', 'Municipality in')} ${UF[st.mun.slice(0, 2)][1]}${filaRef && filaRef.apt ? ` · ${num(filaRef.apt)} ${T('electores', 'registered voters')}` : ''}</div>` : '');
    P.appendChild(h);

    // controles
    // controles (clase no-png: no salen en la imagen descargada)
    const ctr = document.createElement('div'); ctr.className = 'no-png'; ctr.style.cssText = 'display:flex;flex-wrap:wrap;gap:14px 22px';
    const espera = T('A la espera de resultados', 'Awaiting results');
    ctr.appendChild(grupo(T('Elección', 'Election') + (VIVO_OK ? '' : ` <span style="text-transform:none;letter-spacing:0;font-weight:500">· 2026: ${espera.toLowerCase()}</span>`),
      ELECCIONES.map(e => boton(e.corto, e.id === st.elec, () => { st.elec = e.id; programarVivo(); pintar(); syncHash(); }, e.vivo && !VIVO_OK, e.vivo && !VIVO_OK ? espera : null))));
    ctr.appendChild(grupo(T('Nivel', 'Level'), [
      boton(T('Estados', 'States'), st.nivel === 'uf', () => { st.nivel = 'uf'; pintar(); syncHash(); }),
      boton(T('Municipios', 'Municipalities'), st.nivel === 'mun', () => { st.nivel = 'mun'; pintar(); syncHash(); }),
    ]));
    const modos = [
      boton(T('Ganador', 'Winner'), st.modo === 'ganador', () => { st.modo = 'ganador'; pintar(); syncHash(); }),
      boton(T('% candidato', '% candidate'), st.modo === 'cand', () => { st.modo = 'cand'; pintar(); syncHash(); }),
    ];
    if (E.vivo) modos.push(boton(T('Cambio vs 2022', 'Change vs 2022'), st.modo === 'delta', () => { st.modo = 'delta'; if (!['13', '22'].includes(st.cand)) st.cand = '13'; pintar(); syncHash(); }));
    ctr.appendChild(grupo('Color', modos));
    if (D && st.modo !== 'ganador') {
      const s = document.createElement('select'); s.className = 'sel';
      const lista = st.modo === 'delta' ? D.cands.filter(c => window.ELEC[st.elec === '2026-2' ? '2022-2' : '2022-1'].cands.some(k => k.n === c.n)) : D.cands;
      ordenCands(D).map(i => D.cands[i]).filter(c => lista.includes(c)).forEach(c => {
        const o = document.createElement('option'); o.value = c.n; o.textContent = c.nm + (st.modo === 'delta' && c.n === '22' && st.elec.startsWith('2026') ? ' (vs Jair 2022)' : '');
        if (c.n === st.cand) o.selected = true; s.appendChild(o);
      });
      s.addEventListener('change', () => { st.cand = s.value; pintar(); syncHash(); });
      const d = document.createElement('div'); d.innerHTML = `<div class="ctrl-lbl">${T('Candidato', 'Candidate')}</div>`; d.appendChild(s); ctr.appendChild(d);
    }
    P.appendChild(ctr);

    // estado de datos en vivo
    if (E.vivo && !D) {
      const a = document.createElement('div'); a.className = 'aviso';
      const enLaWeb = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
      a.innerHTML = enLaWeb
        ? T('A la espera de resultados.', 'Awaiting results.')
        : T('Esperando datos del TSE. Tiene que estar abierta la ventana de <code>EN_VIVO_1ra_vuelta.bat</code> (o <code>python vivo.py</code>); el mapa se actualiza solo cada 15 segundos.',
          'Waiting for TSE data. The <code>EN_VIVO_1ra_vuelta.bat</code> window (or <code>python vivo.py</code>) must be running; the map refreshes every 15 seconds.');
      P.appendChild(a); leyenda(P, D); return;
    }
    if (!D) return;

    if (st.mun && (!fila || !fila.val)) {
      const a = document.createElement('div'); a.className = 'aviso';
      a.textContent = st.elec.startsWith('2026') ? T('Todavía no hay urnas escrutadas en este municipio.', 'No ballot boxes counted in this municipality yet.')
        : T('Sin datos de este municipio para esta elección (puede ser un municipio creado después).', 'No data for this municipality in this election (it may have been created later).');
      P.appendChild(a); bloqueMun(P, D, null); fuente(P, D); return;
    }
    // resultados
    const res = document.createElement('div');
    const orden = ordenCands(D, fila);
    const nMostrar = D.cands.length <= 2 ? 2 : st.mun ? 3 : (st.modo === 'ganador' ? 5 : 4);
    const val = fila ? fila.val : 0;
    orden.slice(0, nMostrar).forEach(i => {
      const c = D.cands[i], v = fila ? fila.v[i] : 0, p = val ? 100 * v / val : 0;
      const r = document.createElement('div'); r.className = 'res-fila';
      r.innerHTML = `<div class="res-nom">${c.nm}<small>${c.p || ''}</small></div><div class="res-pct" style="color:${colorDe(c.n)}">${val ? fmt(p, 1) + '%' : '–'}</div>
        <div class="res-bar"><i style="width:${p}%;background:${colorDe(c.n)}"></i>${D.turno === 1 ? '<b class="m50"></b>' : ''}</div>
        <div class="res-vot">${num(v)} ${T('votos', 'votes')}</div>`;
      res.appendChild(r);
    });
    if (val && orden.length > 1) {
      const a = fila.v[orden[0]], b2 = fila.v[orden[1]];
      const r = document.createElement('div'); r.className = 'res-vot'; r.style.cssText = 'font-size:19px;margin:-2px 0 4px;color:#4A4A4A';
      r.innerHTML = T(`Diferencia entre los dos primeros: <b>${fmt(100 * (a - b2) / val, 1)} pts</b> (${num(a - b2)} votos)`, `Gap between the top two: <b>${fmt(100 * (a - b2) / val, 1)} pts</b> (${num(a - b2)} votes)`);
      res.appendChild(r);
    }
    if (orden.length > nMostrar && val) {
      const resto = orden.slice(nMostrar).reduce((a, i) => a + fila.v[i], 0);
      const r = document.createElement('div'); r.className = 'res-vot'; r.style.cssText = 'font-size:19px;margin:-4px 0 4px';
      r.textContent = T(`Otros ${orden.length - nMostrar} candidatos: ${fmt(100 * resto / val, 1)}%`, `${orden.length - nMostrar} other candidates: ${fmt(100 * resto / val, 1)}%`) +
        (D.turno === 1 ? T(' · la marca vertical indica el 50% para ganar en 1ª vuelta', ' · the vertical mark is the 50% needed to win outright') : '');
      res.appendChild(r);
    }
    P.appendChild(res);
    if (st.mun) bloqueMun(P, D, fila);

    // progreso / participación
    const pr = document.createElement('div'); pr.className = 'progreso';
    const pct = fila && fila.pct != null ? fila.pct : 0;
    const part = fila && fila.apt ? 100 * fila.com / fila.apt : null;
    if (E.vivo) {
      pr.innerHTML = `<b>${fmt(pct, 2)}%</b> ${T('de las secciones escrutadas', 'of polling stations counted')}${D.actualizado ? ` · ${D.simulacro ? T('simulacro', 'drill') : 'TSE'} ${D.actualizado.slice(-8)}` : ''}<div class="pb"><i style="width:${pct}%"></i></div>`;
    } else {
      pr.innerHTML = T(`Resultado oficial final · votos válidos ${num(val)}${part ? ` · participación ${fmt(part, 1)}%` : ''}`, `Final official result · ${num(val)} valid votes${part ? ` · turnout ${fmt(part, 1)}%` : ''}`);
    }
    P.appendChild(pr);
    if (!st.mun) leyenda(P, D);
    fuente(P, D);
  }
  function fuente(P, D) {
    const f = document.createElement('div'); f.className = 'fuente'; f.style.marginTop = 'auto';
    f.innerHTML = T(`<b>Fuente:</b> ${D.anio === 2022 ? 'TSE, resultados oficiales (datos abiertos).' : D.fuente} Porcentajes sobre votos válidos.`,
      `<b>Source:</b> ${D.anio === 2022 ? 'TSE (Superior Electoral Court), official results (open data).' : 'TSE (Superior Electoral Court), official results feed.'} Percentages of valid votes.`);
    P.appendChild(f);
  }

  // datos extra del municipio elegido: en 2026, cuánto cambió respecto de 2022; en 2022, cómo se compara
  // con el total de Brasil y cómo votó en la otra vuelta
  function bloqueMun(P, D, fila) {
    const pc = (Dx, f, n) => { const v = share(Dx, f, n); return v == null ? null : 100 * v; };
    const dif = x => (x >= 0 ? '+' : '−') + fmt(Math.abs(x), 1);
    const b = document.createElement('div'); b.className = 'cmp';
    if (st.elec.startsWith('2026')) {
      const B = baseDelta(), prev = filaMun(B, st.mun);
      const vuelta = st.elec === '2026-1' ? T('1ª vuelta', '1st round') : T('balotaje', 'runoff');
      if (!fila) {
        if (prev) b.innerHTML = `<div class="ctrl-lbl">${T(`En 2022 (${vuelta})`, `In 2022 (${vuelta})`)}</div>` + ['13', '22'].map(n =>
          `<div class="cmp-f"><span><i style="background:${colorDe(n)}"></i>${B.cands.find(c => c.n === n).nm}</span><b>${fmt(pc(B, prev, n), 1)}%</b></div>`).join('');
      } else {
        let h = `<div class="ctrl-lbl">${T(`Cambio respecto de 2022 (${vuelta})`, `Change since 2022 (${vuelta})`)}</div>
          <div class="cmp-g"><span></span><small>${T('Hoy', 'Now')}</small><small>2022</small><small>${T('Cambio', 'Change')}</small>`;
        ['13', '22'].forEach(n => {
          const c = D.cands.find(k => k.n === n); if (!c) return;
          const a = pc(D, fila, n), z = pc(B, prev, n);
          h += `<span><i style="background:${colorDe(n)}"></i>${c.nm}${n === '22' ? ` <em>${T('vs Jair', 'vs Jair')}</em>` : ''}</span><b>${a == null ? '–' : fmt(a, 1) + '%'}</b><b class="g">${z == null ? '–' : fmt(z, 1) + '%'}</b>` +
            `<b style="color:${a != null && z != null ? (a - z >= 0 ? colorDe(n) : '#6E6A60') : ''}">${a != null && z != null ? dif(a - z) + ' pts' : '–'}</b>`;
        });
        b.innerHTML = h + '</div>';
      }
    } else {
      const otra = window.ELEC[st.elec === '2022-1' ? '2022-2' : '2022-1'], fo = filaMun(otra, st.mun);
      let h = `<div class="ctrl-lbl">${T('Comparado con el total de Brasil', 'Compared with Brazil as a whole')}</div>
        <div class="cmp-g"><span></span><small>${T('Acá', 'Here')}</small><small>Brasil</small><small>${T('Diferencia', 'Difference')}</small>`;
      ['13', '22'].forEach(n => {
        const c = D.cands.find(k => k.n === n), a = pc(D, fila, n), z = pc(D, D.nac, n);
        h += `<span><i style="background:${colorDe(n)}"></i>${c.nm}</span><b>${fmt(a, 1)}%</b><b class="g">${fmt(z, 1)}%</b><b style="color:${a - z >= 0 ? colorDe(n) : '#6E6A60'}">${dif(a - z)} pts</b>`;
      });
      h += '</div>';
      if (fo && fo.val) {
        const ord = ordenCands(otra, fo).slice(0, 2);
        h += `<div class="cmp-otra">${st.elec === '2022-1' ? T('En el balotaje', 'In the runoff') : T('En la 1ª vuelta', 'In the 1st round')}: ` +
          ord.map(i => `${otra.cands[i].nm} <b>${fmt(100 * fo.v[i] / fo.val, 1)}%</b>`).join(' · ') + '</div>';
      }
      b.innerHTML = h;
    }
    if (b.innerHTML) P.appendChild(b);
  }

  function leyenda(P, D) {
    const L = document.createElement('div'); L.className = 'leyenda' + (st.modo === 'ganador' ? ' grid' : '');
    if (!D) { P.appendChild(L); return; }
    if (st.modo === 'ganador') {
      const dos = D.cands.length <= 2;
      const top = ordenCands(D).slice(0, dos ? 2 : 4).map(i => D.cands[i]);
      // en un mano a mano el ganador siempre tiene más de 50%: la escala arranca ahí
      const pasos = dos ? [0.5, 0.575, 0.65, 0.725, 0.8] : [0.38, 0.5, 0.62, 0.74, 0.86];
      const ejes = dos ? ['50%', '65%', '80%+'] : ['40%', '60%', '80%+'];
      L.innerHTML = `<div class="ctrl-lbl">${T('Ganador · más oscuro = ganó con más %', 'Winner · darker = larger vote share')}</div>` + top.map(c =>
        `<div class="fila"><div class="rampa">${pasos.map(s => `<i style="background:${rampGanador(colorDe(c.n), s)}"></i>`).join('')}</div> ${c.nm}</div>`).join('') +
        `<div class="ejes"><span>${ejes[0]}</span><span>${ejes[1]}</span><span>${ejes[2]}</span></div>`;
    } else if (st.modo === 'cand') {
      const c = D.cands.find(k => k.n === st.cand);
      L.innerHTML = `<div class="ctrl-lbl">${T('% de votos válidos', '% of valid votes')} · ${c ? c.nm : ''}</div><div class="rampa">${[0, 1, 2, 3, 4, 5, 6].map(k => `<i style="background:${rampCand(colorDe(st.cand), k / 6 * escCand, escCand)}"></i>`).join('')}</div><div class="ejes"><span>0%</span><span>${fmt(50 * escCand, 0)}%</span><span>${fmt(100 * escCand, 0)}%+</span></div>`;
    } else {
      const c = D.cands.find(k => k.n === st.cand);
      L.innerHTML = `<div class="ctrl-lbl">${c ? c.nm : ''}: ${T('cambio vs 2022 (puntos)', 'change vs 2022 (points)')}</div><div class="rampa">${[-15, -10, -5, 0, 5, 10, 15].map(d => `<i style="background:${rampDelta(st.cand, d)}"></i>`).join('')}</div><div class="ejes"><span>−15</span><span>0</span><span>+15</span></div>`;
    }
    P.appendChild(L);
  }

  /* ---------- tooltip ---------- */
  function wireTooltip(box) {
    const tip = window.Charts.tooltip(box);
    const svg = cache.svg;
    svg.addEventListener('mousemove', ev => {
      const t = ev.target, D = datos(st.elec);
      let nombre, fila, extra = '';
      if (t.classList.contains('mun')) {
        const ib = t.getAttribute('data-c'), nm = (window.MUN_NOMES || {})[ib];
        nombre = nm ? `${nm[0]} <span style="color:#C9C2B2;font-weight:400">(${nm[1]})</span>` : ib;
        fila = filaMun(D, ib);
      } else if (t.classList.contains('uf')) {
        const c = t.getAttribute('data-u'); nombre = UF[c][1]; fila = filaUF(D, UF[c][0]);
      } else { tip.hide(); return; }
      let html = `<div class="t-h">${nombre}</div>`;
      if (!D || !fila || !fila.val) html += `<div class="t-m">${T('Sin votos escrutados todavía', 'No votes counted yet')}</div>`;
      else {
        ordenCands(D, fila).slice(0, 3).forEach(i => {
          html += `<div class="t-r"><span><i class="sw" style="background:${colorDe(D.cands[i].n)}"></i>${D.cands[i].nm}</span><b>${fmt(100 * fila.v[i] / fila.val, 1)}%</b></div>`;
        });
        if (st.modo === 'delta') {
          const B = baseDelta(), prev = t.classList.contains('mun') ? filaMun(B, t.getAttribute('data-c')) : filaUF(B, UF[t.getAttribute('data-u')][0]);
          const s = share(D, fila, st.cand), s0 = share(B, prev, st.cand);
          if (s != null && s0 != null) extra += `<div class="t-m">${D.cands.find(c => c.n === st.cand).nm}: ${fmt(100 * s0, 1)}% ${T('en', 'in')} 2022 → ${(100 * (s - s0) >= 0 ? '+' : '') + fmt(100 * (s - s0), 1)} pts</div>`;
        }
        if (D.final === false && fila.pct != null) extra += `<div class="t-m">${T('Escrutado', 'Counted')}: ${fmt(fila.pct, 1)}%</div>`;
        extra += `<div class="t-m">${num(fila.val)} ${T('votos válidos', 'valid votes')}</div>`;
      }
      const r = box.getBoundingClientRect(), k = r.width / box.offsetWidth;
      tip.show(html + extra, (ev.clientX - r.left) / k, (ev.clientY - r.top) / k, box.offsetWidth);
    });
    svg.addEventListener('mouseleave', () => tip.hide());
    svg.addEventListener('click', ev => {
      const t = ev.target;
      if (t.classList.contains('uf')) { tip.hide(); const c = t.getAttribute('data-u'); enfocar(st.foco === c ? null : c); return; }
      if (t.classList.contains('mun')) {
        tip.hide();
        const ib = t.getAttribute('data-c');
        if (st.mun === ib) soltarMun(); else elegirMun(ib);
      }
    });
  }

  /* ---------- hash ---------- */
  function leerHash() {
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    if (q.get('e') && ELECCIONES.some(e => e.id === q.get('e'))) st.elec = q.get('e');
    if (!VIVO_OK && st.elec.startsWith('2026')) st.elec = '2022-1';
    if (['uf', 'mun'].includes(q.get('n'))) st.nivel = q.get('n');
    if (['ganador', 'cand', 'delta'].includes(q.get('m'))) st.modo = q.get('m');
    if (q.get('c')) st.cand = q.get('c');
    st.foco = q.get('uf') && SG2COD[q.get('uf').toUpperCase()] || null;
    st.mun = /^\d{7}$/.test(q.get('mun') || '') ? q.get('mun') : null;
    if (st.mun) st.foco = st.mun.slice(0, 2);
  }
  function syncHash() {
    const q = new URLSearchParams();
    if (st.elec !== '2022-1') q.set('e', st.elec);
    if (st.nivel !== 'uf') q.set('n', st.nivel);
    if (st.modo !== 'ganador') { q.set('m', st.modo); q.set('c', st.cand); }
    if (st.foco) q.set('uf', UF[st.foco][0]);
    if (st.mun) q.set('mun', st.mun);
    const base = location.hash.split('?')[0] || '#mapa';
    history.replaceState(null, '', base + (q.toString() ? '?' + q : ''));
  }

  /* ---------- buscador de estados y municipios ---------- */
  const sinTildes = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let indice = null;
  function armarIndice() {
    const aptos = (window.ELEC['2022-1'] || {}).mun || {};
    const ufs = Object.entries(UF).map(([c, v]) => ({ tipo: 'uf', c, nm: v[1], sub: T('Estado', 'State'), k: sinTildes(v[1]), sg: v[0].toLowerCase(), peso: 1e12 }));
    const muns = Object.entries(window.MUN_NOMES || {}).map(([ib, v]) => ({ tipo: 'mun', ib, nm: v[0], sub: v[1], k: sinTildes(v[0]), peso: (aptos[ib] || [0, 0, 0, 0])[3] }));
    indice = ufs.concat(muns);
  }
  function buscar(q) {
    if (!indice) armarIndice();
    q = sinTildes(q.trim());
    if (!q) return [];
    const nota = e => (e.k === q || e.sg === q ? 0 : e.k.startsWith(q) ? 1 : e.k.split(/[\s'-]+/).some(w => w.startsWith(q)) ? 2 : e.k.includes(q) ? 3 : 9);
    return indice.map(e => [nota(e), e]).filter(x => x[0] < 9)
      .sort((a, b) => a[0] - b[0] || b[1].peso - a[1].peso).slice(0, 8).map(x => x[1]);
  }
  function buscador() {
    const w = document.createElement('div'); w.className = 'mapa-buscar no-png';
    w.innerHTML = `<input type="search" autocomplete="off" spellcheck="false" placeholder="${T('Buscar estado o municipio…', 'Search state or municipality…')}"><div class="mb-lista"></div>`;
    const inp = w.querySelector('input'), lista = w.querySelector('.mb-lista');
    let res = [], k = 0;
    const dibujar = () => {
      lista.innerHTML = res.map((e, i) => `<div class="mb-it${i === k ? ' on' : ''}" data-i="${i}"><span>${e.nm}</span><small>${e.sub}</small></div>`).join('') +
        (inp.value.trim() && !res.length ? `<div class="mb-nada">${T('Sin resultados', 'No results')}</div>` : '');
    };
    const elegir = e => {
      inp.value = ''; res = []; dibujar(); inp.blur();
      if (e.tipo === 'uf') { st.mun = null; enfocar(e.c); } else elegirMun(e.ib);
    };
    inp.addEventListener('input', () => { res = buscar(inp.value); k = 0; dibujar(); });
    inp.addEventListener('keydown', ev => {
      ev.stopPropagation();   // que las teclas no cambien de placa ni cierren el zoom
      if (ev.key === 'ArrowDown') { ev.preventDefault(); k = Math.min(k + 1, res.length - 1); dibujar(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); k = Math.max(k - 1, 0); dibujar(); }
      else if (ev.key === 'Enter' && res[k]) elegir(res[k]);
      else if (ev.key === 'Escape') { inp.value = ''; res = []; dibujar(); inp.blur(); }
    });
    lista.addEventListener('mousedown', ev => { const it = ev.target.closest('.mb-it'); if (it) { ev.preventDefault(); elegir(res[+it.dataset.i]); } });
    inp.addEventListener('blur', () => setTimeout(() => { res = []; dibujar(); }, 150));
    return w;
  }

  /* ---------- entrada desde las placas ---------- */
  function montar(cont, opciones) {
    if (!cache) cache = construirSVG();
    leerHash();
    if (opciones && !location.hash.includes('?')) Object.assign(st, opciones);
    raiz = cont;
    cont.innerHTML = '<div class="mapa-wrap"><div class="mapa-svg-box"></div><div class="mapa-panel"></div></div>';
    const box = cont.querySelector('.mapa-svg-box');
    box.appendChild(cache.svg);
    if (!cache.wired) { wireTooltip(box); cache.wired = true; cache.box = box; }
    else { box.appendChild(cache.box.querySelector('.tip') || document.createElement('div')); }
    const vuelta = document.createElement('button'); vuelta.className = 'volver no-png'; vuelta.textContent = T('← Brasil', '← Brazil');
    vuelta.addEventListener('click', () => { if (st.mun) soltarMun(); else enfocar(null); }); box.appendChild(vuelta);
    box.appendChild(buscador());
    const G = window.GEO_BR;
    vbActual = null; cache.svg.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`);
    const obs = new MutationObserver(() => {
      vuelta.style.display = st.foco ? '' : 'none';
      vuelta.textContent = st.mun ? '← ' + UF[st.mun.slice(0, 2)][1] : T('← Brasil', '← Brazil');
    });
    obs.observe(cont.querySelector('.mapa-panel'), { childList: true });
    programarVivo();
    if (st.foco) { const f = st.foco, m = st.mun; st.foco = null; enfocar(f); if (m) { st.mun = m; pintar(); syncHash(); } } else pintar();
    vuelta.style.display = st.foco ? '' : 'none';
  }
  function desmontar() { clearInterval(timer); raiz = null; }

  /* ---------- descargas: CSV de lo que se ve (estados, o municipios si el nivel es municipal o hay zoom) ---------- */
  function nombreArchivo() {
    const e = st.elec.replace('-1', T('-1ra-vuelta', '-1st-round')).replace('-2', T('-balotaje', '-runoff'));
    const verMun = st.nivel === 'mun' || st.foco;
    return T('mapa-', 'map-') + e + (verMun ? T('-municipios', '-municipalities') : T('-estados', '-states')) + (st.foco ? '-' + UF[st.foco][0].toLowerCase() : '');
  }
  function datosCSV() {
    const D = datos(st.elec);
    if (!D) return { archivo: nombreArchivo(), cols: [T('sin_datos', 'no_data')], filas: [] };
    const orden = ordenCands(D);
    const cands = orden.map(i => D.cands[i]);
    const colsCand = cands.flatMap(c => [`${c.nm} (${T('votos', 'votes')})`, `${c.nm} (%)`]);
    const verMun = st.nivel === 'mun' || st.foco;
    const extra = [T('votos_validos', 'valid_votes'), T('blancos_y_nulos', 'blank_and_null'), T('electores', 'registered_voters'), T('comparecencia', 'turnout_votes')];
    const fila = (f, id) => {
      if (!f || !f.val) return [...id, ...cands.flatMap(() => [null, null]), null, null, null, null];
      const vs = orden.flatMap(i => [f.v[i], Math.round(10000 * f.v[i] / f.val) / 100]);
      return [...id, ...vs, f.val, f.bn != null ? f.bn : (f.bra || 0) + (f.nul || 0), f.apt, f.com];
    };
    if (!verMun) {
      const filas = Object.keys(UF).sort((a, b) => UF[a][1].localeCompare(UF[b][1])).map(c => fila(filaUF(D, UF[c][0]), [UF[c][0], UF[c][1]]));
      if (D.uf.ZZ) filas.push(fila(D.uf.ZZ, ['ZZ', T('Exterior', 'Abroad')]));
      filas.push(fila(D.nac, ['BR', T('Brasil', 'Brazil')]));
      return { archivo: nombreArchivo(), cols: [T('uf', 'state_code'), T('estado', 'state'), ...colsCand, ...extra], filas };
    }
    const nombres = window.MUN_NOMES || {};
    const filas = Object.keys(D.mun).filter(ib => !st.foco || ib.slice(0, 2) === st.foco)
      .sort((a, b) => ((nombres[a] || [''])[0]).localeCompare((nombres[b] || [''])[0]))
      .map(ib => fila(filaMun(D, ib), [ib, (nombres[ib] || [ib])[0], (nombres[ib] || ['', ''])[1]]));
    return { archivo: nombreArchivo(), cols: [T('codigo_ibge', 'ibge_code'), T('municipio', 'municipality'), 'uf', ...colsCand, ...extra], filas };
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !raiz) return;
    if (st.mun) soltarMun(); else if (st.foco) enfocar(null);
  });

  window.Mapa = { montar, desmontar, st, COLOR, datos: datosCSV, nombreArchivo };
})();
