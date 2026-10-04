/* Motor de gráficos temporales para las placas (SVG vanilla, sin dependencias).
   Eje X continuo en años fraccionarios: el año Y ocupa [Y, Y+1); los datos
   anuales se dibujan en Y+0,5 y los trimestrales a mitad de trimestre. Así las
   franjas de gobierno caen donde corresponde (Temer asume el 12/5/2016).
   En el SVG todo va con colores y fuentes LITERALES (nada de var()). */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    bg: '#FAF8F3', bgSoft: '#F4F1E8', ink: '#1A1A1A', soft: '#4A4A4A', muted: '#8A8579',
    rule: '#E0DCC8', ruleStrong: '#C9C2B2', grid: '#ECE7D8', accent: '#BE5D32',
    // paleta estándar Atlas de 12
    pal: ['#234B85', '#2D6A3D', '#C9A227', '#6B3D8B', '#2C8484', '#7A2A3F', '#1F8AC0', '#6CB04D', '#E07A23', '#B5639E', '#8A5A35', '#5A7A4F'],
  };
  const SANS = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const SERIF = '"Source Serif 4", Georgia, serif';
  const GOBIERNOS = [
    { nm: 'Lula II', a: 2007, b: 2011 },
    { nm: 'Dilma', a: 2011, b: 2016.36 },
    { nm: 'Temer', a: 2016.36, b: 2019 },
    { nm: 'Bolsonaro', a: 2019, b: 2023 },
    { nm: 'Lula III', a: 2023, b: 2027 },
  ];

  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  // formato de números según el idioma de la página (window.LANG lo fija index.html)
  const LOC = () => (window.LANG === 'en' ? 'en-US' : 'es-AR');
  const fmt = (v, d = 1) => (v == null || isNaN(v)) ? '–' :
    v.toLocaleString(LOC(), { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, '−');
  const fmtSigno = (v, d = 1) => (v > 0 ? '+' : '') + fmt(v, d);

  function lineLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return Math.ceil(L) + 2;
  }

  /* Tooltip compartido: un <div class="tip"> dentro del contenedor del svg */
  function tooltip(box) {
    let t = box.querySelector(':scope > .tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; box.appendChild(t); }
    return {
      show(html, x, y, W) {
        t.innerHTML = html; t.classList.add('on');
        const w = t.offsetWidth, h = t.offsetHeight;
        // límites: el lienzo entero (no solo el recuadro del gráfico), para que el tooltip nunca quede afuera
        let minL = -Infinity, maxR = W - 4, minT = 0, maxB = Infinity;
        const esc = document.getElementById('escenario');
        if (esc && esc.contains(box)) {
          const rb = box.getBoundingClientRect(), re = esc.getBoundingClientRect(), k = rb.width / (box.offsetWidth || 1) || 1;
          minL = (re.left - rb.left) / k + 6; maxR = (re.right - rb.left) / k - 6;
          minT = (re.top - rb.top) / k + 6; maxB = (re.bottom - rb.top) / k - 6;
        }
        let left = x + 26 + w <= maxR ? x + 26 : x - w - 26;   // a la derecha del cursor si entra; si no, a la izquierda
        left = Math.max(minL, Math.min(maxR - w, left));
        const top = Math.max(minT, Math.min(maxB - h, y - h / 2));
        t.style.left = left + 'px'; t.style.top = top + 'px';
      },
      hide() { t.classList.remove('on'); },
    };
  }

  function svgPoint(svg, evt) {
    const p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* -------- gráfico temporal genérico --------
     spec = {
       x: [desde, hasta],             años fraccionarios
       y: {min, max, ticks:[], fmt},
       m: {l,r,t,b},                  márgenes
       gob: true|false,               franjas de gobierno
       xticks: [años] (opcional), xfmt
       capas: [ {tipo:'barras'|'linea'|'area100', ...} ],
       notas: [ {t, v, texto, dx, dy, anchor, color} ],
       tip: (t) => html | null,       contenido del tooltip para el instante t
       tips: [t...]                   instantes donde "engancha" el crosshair
     } */
  function dibujarTiempo(box, spec) {
    box.querySelectorAll(':scope > svg').forEach(s => s.remove());
    const W = box.offsetWidth, H = box.offsetHeight;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    box.appendChild(svg);
    const m = Object.assign({ l: 96, r: 70, t: 54, b: 52 }, spec.m || {});
    const [x0, x1] = spec.x;
    const X = t => m.l + (t - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = v => m.t + (spec.y.max - v) / (spec.y.max - spec.y.min) * (H - m.t - m.b);
    const yf = spec.y.fmt || (v => fmt(v, 0));
    const defs = el('defs', null, svg);

    // franjas de gobierno
    if (spec.gob !== false) {
      const g = el('g', null, svg);
      GOBIERNOS.forEach((gb, i) => {
        const a = Math.max(gb.a, x0), b = Math.min(gb.b, x1);
        if (b <= a) return;
        if (i % 2 === 1) el('rect', { x: X(a), y: m.t - 44, width: X(b) - X(a), height: H - m.b - m.t + 44, fill: C.bgSoft }, g);
        if (gb.a > x0) el('line', { x1: X(gb.a), x2: X(gb.a), y1: m.t - 44, y2: H - m.b, stroke: C.ruleStrong, 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }, g);
        // la etiqueta va solo si entra en la franja (ancho estimado de mayúsculas espaciadas)
        const w = X(b) - X(a), largo = tam => gb.nm.length * tam * 0.72 + 12;
        const tam = w >= largo(19) ? 19 : w >= largo(15) ? 15 : 0;
        if (tam) el('text', { x: (X(a) + X(b)) / 2, y: m.t - 16, 'text-anchor': 'middle', class: 'gob', 'font-size': tam, style: `font-size:${tam}px` }, g, gb.nm);
      });
    }
    // grilla + eje Y
    const gy = el('g', null, svg);
    spec.y.ticks.forEach(v => {
      const z = Math.abs(v) < 1e-9 && spec.y.min < 0;
      el('line', { x1: m.l, x2: W - m.r + 10, y1: Y(v), y2: Y(v), stroke: z ? '#B3AC9C' : C.grid, 'stroke-width': z ? 2.2 : 1.5 }, gy);
      el('text', { x: m.l - 16, y: Y(v) + 8, class: 'tick tick-y' }, gy, yf(v));
    });
    if (spec.y.titulo) el('text', { x: m.l - 16, y: m.t - 16 - (spec.gob === false ? 0 : 0), class: 'tick', 'text-anchor': 'end', 'font-weight': 600, 'font-size': 20 }, gy, spec.y.titulo);
    // eje X
    const gx = el('g', null, svg);
    if (spec.xticksPos) spec.xticksPos.forEach(k => {
      el('line', { x1: X(k.t), x2: X(k.t), y1: H - m.b, y2: H - m.b + 8, stroke: C.ruleStrong, 'stroke-width': 1.5 }, gx);
      if (k.lbl) el('text', { x: X(k.t) + (k.dx || 0), y: H - m.b + 38, class: 'tick', 'text-anchor': k.anchor || 'middle', 'font-weight': k.peso || null }, gx, k.lbl);
    });
    const xt = spec.xticksPos ? [] : spec.xticks || (() => { const a = []; for (let y = Math.ceil(x0); y < x1; y++) a.push(y); return a; })();
    xt.forEach(y => {
      const lab = spec.xfmt ? spec.xfmt(y) : String(y);
      if (lab == null) return;
      el('text', { x: X(y + 0.5), y: H - m.b + 38, class: 'tick', 'text-anchor': 'middle' }, gx, lab);
    });

    const capasG = el('g', null, svg);
    const ctx = { svg, defs, X, Y, W, H, m, spec };
    (spec.capas || []).forEach(c => CAPAS[c.tipo](capasG, c, ctx));

    // etiquetas al final de las líneas, con anti-colisión vertical
    const fin = (spec.capas || []).filter(c => c.tipo === 'linea' && c.etiquetaFinal);
    if (fin.length) {
      const labs = fin.map(c => { const d = c.datos.filter(z => z.v != null).slice(-1)[0]; return { c, y0: Y(d.v), y: Y(d.v), x: X(d.t) + 18 }; });
      const gap = spec.gapFinal || 36;
      for (let it = 0; it < 80; it++) {
        labs.sort((p, q) => p.y - q.y);
        for (let i = 1; i < labs.length; i++) { const dd = labs[i].y - labs[i - 1].y; if (dd < gap) { const sh = (gap - dd) / 2; labs[i].y += sh; labs[i - 1].y -= sh; } }
      }
      labs.forEach(l => {
        if (Math.abs(l.y - l.y0) > 8) el('path', { d: `M${l.x - 14} ${l.y0}L${l.x - 4} ${l.y - 2}`, stroke: '#B3AC9C', 'stroke-width': 1.5, fill: 'none', class: 'anim-fade', style: 'animation-delay:1.2s' }, svg);
        const t = el('text', { x: l.x, y: l.y + 8, class: 'lbl anim-fade', fill: l.c.color, 'font-size': l.c.tamFinal || 26, style: 'animation-delay:1.2s' }, svg);
        el('tspan', null, t, l.c.etiquetaFinal[0]);
        el('tspan', { 'font-weight': 600, fill: C.soft, 'font-size': (l.c.tamFinal || 26) - 3 }, t, '  ' + l.c.etiquetaFinal[1]);
      });
    }

    // notas
    (spec.notas || []).forEach(n => {
      const t = el('text', {
        x: X(n.t) + (n.dx || 0), y: Y(n.v) + (n.dy || 0), 'text-anchor': n.anchor || 'start',
        class: 'lbl anim-fade', fill: n.color || C.soft, 'font-size': n.size || 21, 'font-weight': n.peso || 600,
        style: 'animation-delay:1.1s' + (n.halo === false ? ';stroke:none' : ''),
      }, svg);
      String(n.texto).split('\n').forEach((ln, i) => el('tspan', { x: X(n.t) + (n.dx || 0), dy: i ? '1.15em' : 0 }, t, ln));
    });

    // crosshair + tooltip
    if (spec.tip && spec.tips && spec.tips.length) {
      const tip = tooltip(box);
      const cross = el('line', { y1: m.t - 6, y2: H - m.b, stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: 0, 'pointer-events': 'none' }, svg);
      const dots = el('g', { 'pointer-events': 'none' }, svg);
      svg.addEventListener('mousemove', ev => {
        const p = svgPoint(svg, ev);
        if (p.x < m.l - 20 || p.x > W - m.r + 40) { cross.setAttribute('opacity', 0); tip.hide(); dots.innerHTML = ''; return; }
        let best = spec.tips[0];
        spec.tips.forEach(t => { if (Math.abs(X(t) - p.x) < Math.abs(X(best) - p.x)) best = t; });
        const r = spec.tip(best);
        if (!r) { tip.hide(); return; }
        cross.setAttribute('x1', X(best)); cross.setAttribute('x2', X(best)); cross.setAttribute('opacity', .55);
        dots.innerHTML = '';
        (r.puntos || []).forEach(pt => el('circle', { cx: X(best), cy: Y(pt.v), r: 8, fill: pt.color, stroke: C.bg, 'stroke-width': 3 }, dots));
        tip.show(r.html, X(best), r.y != null ? r.y : p.y, W);
      });
      svg.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); tip.hide(); dots.innerHTML = ''; });
    }
    return ctx;
  }

  function patron(defs, color, id) {
    if (defs.querySelector('#' + id)) return `url(#${id})`;
    const p = el('pattern', { id, width: 12, height: 12, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 12, height: 12, fill: color, 'fill-opacity': 0.18 }, p);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 12, stroke: color, 'stroke-width': 5 }, p);
    return `url(#${id})`;
  }

  const CAPAS = {
    /* barras anuales: datos [{t:año, v, tipo:'obs'|'proy'|'parcial', etiqueta}] */
    barras(g, c, { X, Y, defs }) {
      const ancho = c.ancho || 0.7;
      c.datos.forEach((d, i) => {
        if (d.v == null) return;
        const col = d.color || (d.v < 0 && c.colorNeg ? c.colorNeg : c.color);
        const xa = X(d.t + (1 - ancho) / 2), xb = X(d.t + 1 - (1 - ancho) / 2);
        const y0 = Y(0), y1 = Y(d.v);
        const especial = d.tipo === 'proy' || d.tipo === 'parcial';
        const r = el('rect', {
          x: xa, width: xb - xa, y: Math.min(y0, y1), height: Math.max(1, Math.abs(y1 - y0)),
          fill: especial ? patron(defs, col, 'rayas' + col.slice(1)) : col,
          stroke: especial ? col : null, 'stroke-width': especial ? 2.5 : null,
          class: 'anim-barra', style: `--orig:${d.v < 0 ? 'top' : 'bottom'};animation-delay:${i * 45}ms`,
        }, g);
        if (c.valores !== false) {
          const yy = d.v >= 0 ? y1 - 12 : y1 + 30;
          el('text', {
            x: (xa + xb) / 2, y: yy, 'text-anchor': 'middle', class: 'lbl anim-fade',
            'font-size': c.tamValor || 23, fill: d.v < 0 && c.colorNeg ? c.colorNeg : (c.colorValor || C.soft),
            style: `animation-delay:${300 + i * 45}ms`,
          }, g, (c.fmtValor || (v => fmt(v, 1)))(d.v) + (d.marca || ''));
        }
        if (d.etiqueta) {
          const ls = d.etiqueta.split('\n');
          const base = d.v >= 0 ? y1 - 46 : y1 + 62;
          ls.forEach((ln, k) => el('text', {
            x: (xa + xb) / 2, y: d.v >= 0 ? base - (ls.length - 1 - k) * 21 : base + k * 21,
            'text-anchor': 'middle', class: 'lbl anim-fade', 'font-size': 18, 'font-weight': 600, fill: col,
            style: 'animation-delay:900ms',
          }, g, ln));
        }
      });
    },

    /* franja entre dos valores (margen de error): datos [{t, lo, hi}] */
    banda(g, c, { X, Y }) {
      const d = c.datos.filter(z => z.lo != null && z.hi != null);
      if (d.length < 2) return;
      const p = d.map(z => `${X(z.t).toFixed(1)} ${Y(z.hi).toFixed(1)}`)
        .concat(d.slice().reverse().map(z => `${X(z.t).toFixed(1)} ${Y(z.lo).toFixed(1)}`));
      el('path', { d: 'M' + p.join('L') + 'Z', fill: c.color, 'fill-opacity': c.opacidad || 0.16, stroke: 'none', class: 'anim-fade' }, g);
    },

    /* puntos sueltos (una encuesta = un punto): datos [{t, v, color}] */
    puntos(g, c, { X, Y }) {
      c.datos.forEach((d, i) => el('circle', {
        cx: X(d.t), cy: Y(d.v), r: c.r || 6, fill: d.color || c.color, 'fill-opacity': c.opacidad || 0.28,
        stroke: d.color || c.color, 'stroke-opacity': (c.opacidad || 0.28) + 0.2, 'stroke-width': 1.2,
        class: 'anim-fade', style: `animation-delay:${Math.min(600, i * 4)}ms`,
      }, g));
    },

    /* línea: datos [{t, v, p:true si es dato parcial/proyección}] */
    linea(g, c, { X, Y, W, m }) {
      const col = c.color, sw = c.grosor || 5;
      const obs = c.datos.filter(d => d.v != null && !d.p);
      const pts = obs.map(d => [X(d.t), Y(d.v)]);
      if (pts.length > 1) {
        const path = el('path', {
          d: 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'),
          fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
          class: 'anim-linea', style: `--len:${lineLen(pts)};animation-delay:${c.delay || 0}ms`,
          'stroke-dasharray': c.punteada ? '10 9' : null,
        }, g);
        if (c.punteada) path.setAttribute('class', 'anim-fade');
      }
      // tramo parcial (proyección / último dato del año en curso)
      const par = c.datos.filter(d => d.v != null && d.p);
      if (par.length && obs.length) {
        const last = obs[obs.length - 1];
        const pp = [[X(last.t), Y(last.v)], ...par.map(d => [X(d.t), Y(d.v)])];
        el('path', { d: 'M' + pp.map(p => p.join(' ')).join('L'), fill: 'none', stroke: col, 'stroke-width': sw - 1, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round', class: 'anim-fade', style: 'animation-delay:1.2s' }, g);
        par.forEach(d => el('circle', { cx: X(d.t), cy: Y(d.v), r: 9, fill: C.bg, stroke: col, 'stroke-width': 4, class: 'anim-fade', style: 'animation-delay:1.25s' }, g));
      }
      if (c.marcadores) obs.forEach((d, i) => el('circle', { cx: X(d.t), cy: Y(d.v), r: c.marcadores, fill: col, stroke: C.bg, 'stroke-width': 2.5, class: 'anim-fade', style: `animation-delay:${(c.delay || 0) + 150 + i * 60}ms` }, g));
      // valores destacados (primer / último / extremos)
      (c.destacar || []).forEach(h => {
        const d = c.datos.find(z => Math.abs(z.t - h.t) < 1e-6);
        if (!d) return;
        el('circle', { cx: X(d.t), cy: Y(d.v), r: 8, fill: d.p ? C.bg : col, stroke: d.p ? col : C.bg, 'stroke-width': d.p ? 4 : 3, class: 'anim-fade', style: 'animation-delay:1.1s' }, g);
        const tx = el('text', {
          x: X(d.t) + (h.dx || 0), y: Y(d.v) + (h.dy != null ? h.dy : -22), 'text-anchor': h.anchor || 'middle',
          class: 'lbl anim-fade', fill: col, 'font-size': h.size || 27, style: 'animation-delay:1.15s',
        }, g);
        String(h.texto != null ? h.texto : (c.fmtValor || (v => fmt(v, 1)))(d.v)).split('\n').forEach((ln, k) =>
          el('tspan', { x: X(d.t) + (h.dx || 0), dy: k ? '1.1em' : 0, 'font-size': k ? (h.size2 || 20) : null, 'font-weight': k ? 600 : null }, tx, ln));
      });
      // etiqueta de serie al final
      if (c.nombre) {
        const d = c.datos.filter(z => z.v != null).slice(-1)[0];
        const ex = c.nombreT != null ? X(c.nombreT) : X(d.t) + 22;
        const ey = c.nombreV != null ? Y(c.nombreV) : Y(d.v) + 8 + (c.nombreDy || 0);
        const tx = el('text', { x: ex, y: ey, class: 'lbl anim-fade', fill: col, 'font-size': c.tamNombre || 25, style: 'animation-delay:1.2s', 'text-anchor': c.nombreAnchor || 'start' }, g);
        String(c.nombre).split('\n').forEach((ln, k) => el('tspan', { x: ex, dy: k ? '1.1em' : 0, 'font-weight': k ? 600 : null, 'font-size': k ? 20 : null }, tx, ln));
      }
    },

    /* áreas apiladas al 100%: datos [{t, vals:[...]}], claves [{nm, color}] */
    area100(g, c, { X, Y, W, m }) {
      const n = c.claves.length;
      const acc = c.datos.map(d => { let s = 0; return d.vals.map(v => (s += v)); });
      for (let k = n - 1; k >= 0; k--) {
        const top = c.datos.map((d, i) => [X(d.t), Y(acc[i][k])]);
        const bot = c.datos.map((d, i) => [X(d.t), Y(k ? acc[i][k - 1] : 0)]).reverse();
        el('path', {
          d: 'M' + top.concat(bot).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z',
          fill: c.claves[k].color, stroke: C.bg, 'stroke-width': 1.5, class: 'anim-fade', style: `animation-delay:${k * 90}ms`,
        }, g);
      }
      if (c.izq) c.claves.forEach((cl, k) => {
        const a0 = k ? acc[0][k - 1] : 0, b0 = acc[0][k];
        if (Y(a0) - Y(b0) < 30) return;
        el('text', { x: X(c.datos[0].t) + 14, y: (Y(a0) + Y(b0)) / 2 + 8, class: 'lbl anim-fade', fill: '#FFFFFF', 'font-size': 22,
          style: 'animation-delay:1s;stroke:none' }, g, (c.fmtValor || (v => fmt(v, 1) + '%'))(c.datos[0].vals[k]));
      });
      // etiquetas a la derecha, centradas en la banda del último dato (con anti-colisión)
      const last = c.datos.length - 1, xl = X(c.datos[last].t) + 18;
      const labs = c.claves.map((cl, k) => {
        const a = k ? acc[last][k - 1] : 0, b = acc[last][k];
        return { k, y: (Y(a) + Y(b)) / 2, val: c.datos[last].vals[k], cl };
      });
      const gap = 52;
      for (let it = 0; it < 60; it++) {
        labs.sort((p, q) => p.y - q.y);
        for (let i = 1; i < labs.length; i++) {
          const d = labs[i].y - labs[i - 1].y;
          if (d < gap) { const s = (gap - d) / 2; labs[i].y += s; labs[i - 1].y -= s; }
        }
      }
      labs.forEach(l => {
        const a = l.k ? acc[last][l.k - 1] : 0, b = acc[last][l.k];
        const yc = (Y(a) + Y(b)) / 2;
        if (Math.abs(yc - l.y) > 6) el('path', { d: `M${X(c.datos[last].t) + 2} ${yc}L${xl - 6} ${l.y - 8}`, stroke: '#B3AC9C', 'stroke-width': 1.5, fill: 'none', class: 'anim-fade', style: 'animation-delay:1s' }, g);
        const t = el('text', { x: xl, y: l.y - 4, class: 'lbl anim-fade', fill: l.cl.colorTxt || l.cl.color, 'font-size': 22, style: 'animation-delay:1s' }, g);
        el('tspan', { x: xl, dy: 0 }, t, (c.fmtValor || (v => fmt(v, 1) + '%'))(l.val) + '  ');
        el('tspan', { 'font-weight': 600, fill: C.soft }, t, l.cl.nm);
      });
    },
  };

  window.Charts = { dibujarTiempo, el, fmt, fmtSigno, C, SANS, SERIF, GOBIERNOS, tooltip, svgPoint, patron, LOC };
})();
