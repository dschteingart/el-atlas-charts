/* Placas de la cobertura: definición de cada una (bilingüe ES/EN) + navegación + descargas.
   Teclas: ← → (o PageUp/PageDown del clicker) cambian de placa · G índice ·
   F pantalla completa · T cambia la vista de la placa (si tiene) · Esc sale del zoom del mapa.
   Cada placa tiene su URL: index.html#pib, #desempleo, ..., #mapa (para escenas de OBS).
   En la web, index.html sin #placa abre la portada (índice de gráficos con miniaturas de thumbs/,
   que arma scripts/armar_thumbs.py); en la copia local abre directo la primera placa.
   ?lang=en pasa todo a inglés. ?png=1 saca animaciones y navegación (para exportar imágenes). */
(function () {
  const { dibujarTiempo, fmt, fmtSigno, C, LOC } = window.Charts;
  const S = window.SERIES;
  const EN = window.LANG === 'en';
  const T = (es, en) => (EN ? en : es);

  // Firma (abajo a la derecha). Cambiar acá si va con otra marca.
  const MARCA = { f1: T('El Atlas', 'The Atlas'), f2: 'Daniel Schteingart' };
  const PREFIJO = T('el-atlas-brasil-', 'the-atlas-brazil-');

  const anios = (a, b) => { const r = []; for (let y = a; y <= b; y++) r.push(y); return r; };
  const xfmtCorto = y => (y % 2 === 0 || y === 2026 ? String(y) : '’' + String(y).slice(2));
  const num = v => v.toLocaleString(LOC());
  function tipHTML(tit, filas, pie) {
    return `<div class="t-h">${tit}</div>` + filas.map(f =>
      `<div class="t-r"><span>${f.color ? `<i class="sw" style="background:${f.color}"></i>` : ''}${f.nm}</span><b>${f.val}</b></div>`).join('') +
      (pie ? `<div class="t-m">${pie}</div>` : '');
  }
  const AZUL = '#234B85', TERRA = '#BE5D32';
  const MES_PT = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
  const MESES = T(['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  const JUN_AGO = T('jun–ago 2026', 'Jun–Aug 2026');
  // "jun-jul-ago 2026" (IBGE) -> "jun–ago 2026" / "Jun–Aug 2026"
  const trimMovil = s => { const [m, y] = s.split(' '), ms = m.split('-'); return `${MESES[MES_PT[ms[0]]]}–${MESES[MES_PT[ms[2]]]} ${y}`; };
  const etiquetaPeriodo = lbl => (lbl.includes('jun-jul-ago') ? JUN_AGO : lbl.replace(' (annual)', ''));

  // nombres de categorías (vienen en castellano en series.js)
  const CAT_EN = {
    'Asalariado privado formal': 'Formal private employees', 'Asalariado privado informal': 'Informal private employees',
    'Sector público': 'Public sector', 'Trabajo doméstico': 'Domestic work', 'Cuenta propia': 'Own-account workers',
    'Empleadores y aux. familiares': 'Employers and family workers', 'Agropecuaria': 'Agriculture', 'Industria': 'Industry',
    'Construcción': 'Construction', 'Servicios (incluye comercio)': 'Services (incl. retail)', 'Comercio': 'Retail and wholesale',
    'Serv. empresariales y financieros': 'Business and financial services', 'Adm. pública, educación y salud': 'Public admin., education and health',
    'Transporte': 'Transport', 'Alojamiento y comida': 'Accommodation and food', 'Servicio doméstico': 'Domestic work', 'Otros servicios': 'Other services',
  };
  const cat = nm => (EN ? CAT_EN[nm] || nm : nm);

  /* títulos de la placa de encuestas: salen del último promedio (ciertos en cualquier momento) */
  function ultimoProm(v, c) { const a = window.ENCUESTAS[v].agregado[c]; return a ? a[a.length - 1].v : null; }
  function tituloEncuestas(v) {
    if (!window.ENCUESTAS) return T('Encuestas', 'Polls');
    const L = ultimoProm(v, 'lula'), F = ultimoProm(v, 'flavio'), d = L - F;
    const pts = fmt(Math.abs(d), 1).replace(/[.,]0$/, '');
    if (Math.abs(d) < 1.5) return v === '1v'
      ? T('Lula y Flávio Bolsonaro llegan parejos a la primera vuelta', 'Lula and Flávio Bolsonaro are neck and neck heading into the first round')
      : T('En un balotaje, Lula y Flávio Bolsonaro están empatados en el promedio', 'In a runoff, Lula and Flávio Bolsonaro are tied in the polling average');
    const [a, b] = d > 0 ? ['Lula', 'Flávio Bolsonaro'] : ['Flávio Bolsonaro', 'Lula'];
    return v === '1v'
      ? T(`${a} llega a la primera vuelta ${pts} puntos arriba de ${b}`, `${a} heads into the first round ${pts} points ahead of ${b}`)
      : T(`En un balotaje, ${a} le gana a ${b} por ${pts} puntos en el promedio`, `In a runoff, ${a} beats ${b} by ${pts} points in the polling average`);
  }
  const fechaLarga = s => { const [y, m, d] = s.split('-'); return T(`${+d}/${+m}/${y}`, `${MESES[+m - 1]} ${+d}, ${y}`); };
  function bajadaEncuestas(v) {
    if (!window.ENCUESTAS) return '';
    const E = window.ENCUESTAS[v];
    return (v === '1v'
      ? T('Intención de voto para presidente en primera vuelta (estimulada), en % del total de entrevistados', 'First-round voting intention for president (prompted), % of all respondents')
      : T('Intención de voto en un balotaje entre Lula y Flávio Bolsonaro, en % del total de entrevistados', 'Voting intention in a Lula vs. Flávio Bolsonaro runoff, % of all respondents')) +
      T(`. Encuestas del ${fechaLarga(E.desde)} al ${fechaLarga(E.hasta)}.`, `. Polls from ${fechaLarga(E.desde)} to ${fechaLarga(E.hasta)}.`);
  }

  function graficoEncuesta(box, vista, compacto, yComun) {
    const E = window.ENCUESTAS[vista];
    const cands = E.cands.filter(c => E.agregado[c.c]);
    const COLS = { lula: '#C8372D', flavio: AZUL, caiado: '#2C8484', zema: '#E07A23', renan_santos: '#6B3D8B', augusto_cury: '#C9A227' };
    const vals = E.encuestas.flatMap(p => cands.map(c => p[c.c])).filter(v => v != null);
    // en el panel, las dos mitades comparten escala (si no, el balotaje exagera sus vaivenes)
    const ymin = yComun ? 0 : vista === '2v' ? Math.max(0, Math.floor((Math.min(...vals) - 1) / 5) * 5) : 0;
    const ymax = yComun || Math.ceil((Math.max(...vals) + 2) / 5) * 5;
    const ticks = []; for (let v = ymin; v <= ymax; v += (ymax - ymin > 30 ? 10 : 5)) ticks.push(v);
    const t0 = Math.min(...E.encuestas.map(p => p.t)), t1 = Math.max(...E.encuestas.map(p => p.t));
    const meses = [];
    for (let y = 2025; y <= 2026; y++) for (let m = 0; m < 12; m++) {
      const ini = y + (new Date(y, m, 1) - new Date(y, 0, 1)) / ((new Date(y + 1, 0, 1) - new Date(y, 0, 1)));
      if (ini > t0 - 0.012 && ini < t1 + 0.012) {
        // en el panel (la mitad de ancho) se rotula un mes sí y otro no
        if (compacto && (m % 2 === 0)) { meses.push({ t: ini }); continue; }
        meses.push({ t: ini, lbl: MESES[m] + (m === 0 && !compacto ? ` ${y}` : '') });
      }
    }
    const capas = [];
    // puntos solo para los dos protagonistas (los chicos quedan como línea, para no ensuciar)
    cands.filter(c => c.c === 'lula' || c.c === 'flavio').forEach(c => capas.push({ tipo: 'puntos', datos: E.encuestas.filter(p => p[c.c] != null).map(p => ({ t: p.t, v: p[c.c] })), color: COLS[c.c], r: compacto ? 5.5 : 6.5 }));
    cands.forEach((c, k) => {
      const ag = E.agregado[c.c], ult = ag[ag.length - 1];
      const prota = c.c === 'lula' || c.c === 'flavio';
      capas.push({ tipo: 'linea', datos: ag.map(p => ({ t: p.t, v: p.v })), color: COLS[c.c], grosor: prota ? 6 : 3.5, delay: k * 120,
        etiquetaFinal: [fmt(ult.v, 1) + '%', c.nm.replace('Flávio Bolsonaro', 'Flávio').replace('Ronaldo ', '').replace('Romeu ', '').replace('Augusto ', '')], tamFinal: prota ? 30 : 22 });
    });
    const fechaTxt = f => { const [, m, d] = f.split('-'); return T(`${+d} de ${MESES[+m - 1]}`, `${MESES[+m - 1]} ${+d}`); };
    const serieT = E.agregado[cands[0].c];
    dibujarTiempo(box, {
      x: [t0 - 0.01, t1 + 0.012], y: { min: ymin, max: ymax, ticks, fmt: v => v + '%' }, gob: false,
      xticksPos: meses, m: { r: compacto ? 205 : 250, t: 24, l: compacto ? 80 : 96 }, capas, gapFinal: vista === '1v' ? 32 : 40,
      tips: serieT.map(p => p.t),
      tip: t => {
        const i = serieT.findIndex(p => p.t === t), f = serieT[i].f;
        const filas = cands.map(c => { const p = E.agregado[c.c].find(z => z.t === t); return p ? { nm: c.nm, val: fmt(p.v, 1) + '%', color: COLS[c.c] } : null; }).filter(Boolean);
        const cerca = E.encuestas.filter(p => Math.abs(p.t - t) <= 3.5 / 365).slice(-4)
          .map(p => `${p.enc} (${p.campo}): Lula ${fmt(p.lula, 0)} · Flávio ${fmt(p.flavio, 0)}`);
        return { html: tipHTML(T(`Promedio al ${fechaTxt(f)}`, `Average as of ${fechaTxt(f)}`), filas, cerca.length ? cerca.join('<br>') : null), puntos: filas.map((r, k) => ({ v: E.agregado[cands[k].c].find(z => z.t === t).v, color: r.color })) };
      },
    });
  }
  // título del panel: sale de los dos promedios (cierto en cualquier momento)
  function tituloPanel() {
    if (!window.ENCUESTAS) return T('Encuestas', 'Polls');
    const d1 = ultimoProm('1v', 'lula') - ultimoProm('1v', 'flavio'), d2 = ultimoProm('2v', 'lula') - ultimoProm('2v', 'flavio');
    if (Math.abs(d1) < 1.5 && Math.abs(d2) < 1.5) return T('Lula y Flávio Bolsonaro llegan a la elección empatados según las encuestas', 'Lula and Flávio Bolsonaro head into the election tied in the polls');
    if (Math.abs(d2) < 1.5) {
      const pts = fmt(Math.abs(d1), 1).replace(/[.,]0$/, ''), a = d1 > 0 ? 'Lula' : 'Flávio Bolsonaro';
      return T(`${a} llega ${pts} puntos arriba en primera vuelta, pero en un balotaje están empatados`, `${a} leads the first round by ${pts} points, but a runoff is tied`);
    }
    return T('Lula y Flávio Bolsonaro llegan parejos a la elección según las encuestas', 'Lula and Flávio Bolsonaro head into the election neck and neck in the polls');
  }
  function bajadaPanel() {
    if (!window.ENCUESTAS) return '';
    const E = window.ENCUESTAS['1v'];
    return T(`Intención de voto para presidente, en % del total de entrevistados: primera vuelta (izquierda) y balotaje entre Lula y Flávio Bolsonaro (derecha). Encuestas del ${fechaLarga(E.desde)} al ${fechaLarga(E.hasta)}.`,
      `Voting intention for president, % of all respondents: first round (left) and a Lula vs. Flávio Bolsonaro runoff (right). Polls from ${fechaLarga(E.desde)} to ${fechaLarga(E.hasta)}.`);
  }

  /* ================= proyección en vivo ================= */
  // vivo.py escribe data/vivo/2026-<turno>.js con el escrutinio y la proyección (proyeccion.py)
  const vivoDe = v => (window.VIVO && window.VIVO['2026-' + v]) || null;
  const colorCand = n => ((window.Mapa && window.Mapa.COLOR[n]) || '#8A8579');
  const nomCorto = nm => nm.replace('Flávio Bolsonaro', 'Flávio').replace('Ronaldo ', '').replace('Romeu ', '').replace('Augusto ', '');
  function ordenProy(D) {
    const P = D.proy, base = P && P.ok ? P.proy : (P && P.conteo) || D.nac.v;
    return D.cands.map((c, i) => i).sort((a, b) => base[b] - base[a]);
  }
  function conteoPct(D) {
    const P = D.proy;
    if (P && P.conteo) return P.conteo;
    const t = D.nac.v.reduce((a, b) => a + b, 0);
    return D.nac.v.map(x => (t ? 100 * x / t : 0));
  }
  function tituloProy(v) {
    const D = vivoDe(v), P = D && D.proy;
    if (!D) return T('Proyección en vivo del resultado', 'Live projection of the result');
    const o = ordenProy(D), a = D.cands[o[0]], b = D.cands[o[1]];
    if (D.final) {
      const c = conteoPct(D);
      return T(`Escrutinio terminado: ${a.nm} ${fmt(c[o[0]], 1)}%, ${b.nm} ${fmt(c[o[1]], 1)}%`, `Count finished: ${a.nm} ${fmt(c[o[0]], 1)}%, ${b.nm} ${fmt(c[o[1]], 1)}%`);
    }
    if (!P || !P.ok) return T('Proyección en vivo: todavía hay pocos votos contados', 'Live projection: too few votes counted yet');
    const r1 = x => Math.round(x * 10) / 10, d = r1(P.proy[o[0]]) - r1(P.proy[o[1]]);
    if (v === '1' && P.proy[o[0]] - P.banda[o[0]] > 50)
      return T(`La proyección da ganador a ${a.nm} en primera vuelta`, `The projection has ${a.nm} winning outright in the first round`);
    if (d <= P.banda_margen)
      return T(`La proyección da un empate técnico entre ${a.nm} y ${b.nm}`, `The projection shows a statistical tie between ${a.nm} and ${b.nm}`);
    return T(`La proyección da a ${a.nm} ${fmt(d, 1)} puntos arriba de ${b.nm}`, `The projection puts ${a.nm} ${fmt(d, 1)} points ahead of ${b.nm}`);
  }
  function bajadaProy(v) {
    const D = vivoDe(v);
    const vuelta = v === '1' ? T('la primera vuelta', 'the first round') : T('el balotaje', 'the runoff');
    const pct = D ? T(` con ${fmt(D.nac.pct || 0, 1)}% de las secciones escrutadas`, ` with ${fmt(D.nac.pct || 0, 1)}% of polling stations counted`) : '';
    return T(`Proyección del resultado final de ${vuelta}${pct}, a partir de cuánto cambió el voto respecto de 2022 en los municipios ya contados. No es un resultado oficial.`,
      `Projection of the final result of ${vuelta}${pct}, based on how much the vote changed from 2022 in the municipalities already counted. Not an official result.`);
  }
  function placaProyeccion(box, v) {
    const D = vivoDe(v);
    if (!D) {
      const bat = `EN_VIVO_${v === '1' ? '1ra' : '2da'}_vuelta.bat`;
      box.innerHTML = `<div class="aviso" style="max-width:1100px">${T(`Esperando datos del TSE. Tiene que estar abierta la ventana de <code>${bat}</code> (o <code>python vivo.py${v === '2' ? ' --turno 2' : ''}</code>); esta placa se actualiza sola cada 15 segundos.`,
        `Waiting for TSE data. The <code>${bat}</code> window must be running; this chart refreshes every 15 seconds.`)}</div>`;
      return;
    }
    const P = D.proy || {}, ok = !!P.ok, c = conteoPct(D), o = ordenProy(D);
    const nMos = D.cands.length <= 2 ? 2 : 4;
    const badge = D.simulacro ? `<span class="badge simu">${T('Simulacro · datos ficticios', 'Drill · fictitious data')}</span>`
      : D.final ? '' : `<span class="badge vivo">${T('En vivo', 'Live')}</span>`;
    let izq = `<div class="py-cab">${ok ? T('Proyección al final del conteo', 'Projected final result') : T('Conteo hasta el momento', 'Count so far')} ${badge}</div>`;
    o.slice(0, nMos).forEach(i => {
      const k = D.cands[i], col = colorCand(k.n), p = ok ? P.proy[i] : c[i], bd = ok ? P.banda[i] : 0;
      izq += `<div class="py-fila">
        <div class="py-nom">${k.nm}<small>${k.p || ''}</small></div>
        <div class="py-pct" style="color:${col}">${fmt(p, 1)}%${ok ? `<span class="py-pm">± ${fmt(bd, 1)}</span>` : ''}</div>
        <div class="py-bar">${ok ? `<b style="left:${Math.max(0, p - bd)}%;width:${2 * bd}%;background:${col}"></b>` : ''}<i style="width:${p}%;background:${col}"></i>${v === '1' ? '<s class="m50"></s>' : ''}${ok ? `<em style="left:${c[i]}%"></em>` : ''}</div>
        ${ok ? `<div class="py-sub">${T('Conteo hasta ahora', 'Count so far')}: ${fmt(c[i], 1)}% <span class="py-ref">${T('(la marca negra)', '(black mark)')}</span></div>` : ''}
      </div>`;
    });
    if (ok) {
      const a = D.cands[o[0]], b = D.cands[o[1]], d = Math.round(P.proy[o[0]] * 10) / 10 - Math.round(P.proy[o[1]] * 10) / 10;
      izq += `<div class="py-dif">${T(`Diferencia proyectada: <b>${nomCorto(a.nm)} +${fmt(d, 1)} pts</b> sobre ${nomCorto(b.nm)} (± ${fmt(P.banda_margen, 1)})`, `Projected gap: <b>${nomCorto(a.nm)} +${fmt(d, 1)} pts</b> over ${nomCorto(b.nm)} (± ${fmt(P.banda_margen, 1)})`)}</div>`;
    } else {
      izq += `<div class="aviso" style="font-size:19px">${T('La proyección aparece cuando hay al menos 2% de los votos contados y datos de 20 estados.', 'The projection appears once at least 2% of votes are counted, with data from 20 states.')}</div>`;
    }
    const pct = D.nac.pct || 0;
    izq += `<div class="progreso" style="margin-top:auto"><b>${fmt(pct, 2)}%</b> ${T('de las secciones escrutadas', 'of polling stations counted')}${ok ? T(` · proyección con ${num(P.n_mun)} municipios de ${P.n_uf} estados`, ` · projection uses ${num(P.n_mun)} municipalities in ${P.n_uf} states`) : ''}${D.actualizado ? ` · ${D.simulacro ? T('simulacro', 'drill') : 'TSE'} ${D.actualizado.slice(-8)}` : ''}<div class="pb"><i style="width:${pct}%"></i></div></div>`;
    box.innerHTML = `<div class="py-wrap"><div class="py-izq">${izq}</div><div class="py-der">
      <div class="py-ley"><span><i style="border-top:6px solid #1A1A1A"></i>${T('Proyección (y su margen)', 'Projection (and its margin)')}</span><span><i style="border-top:4px dashed #1A1A1A"></i>${T('Conteo hasta ese momento', 'Count at that moment')}</span></div>
      <div class="py-graf"></div><div class="py-eje">${T('% de las secciones escrutadas', '% of polling stations counted')}</div></div></div>`;
    const H = (P.hist || []).filter(h => h.p && h.c);
    const g = box.querySelector('.py-graf');
    if (H.length < 2) {
      g.innerHTML = `<div class="aviso" style="position:absolute;left:86px;top:40px;right:40px">${T('El gráfico se arma a medida que avanza el escrutinio: muestra cómo se mueve la proyección y cuánto engaña el conteo parcial.', 'The chart builds up as the count advances: it shows how the projection moves and how much the partial count misleads.')}</div>`;
      return;
    }
    const top = o.slice(0, 2);
    const vals = H.flatMap(h => top.flatMap(i => [h.p[i] - h.b[i], h.p[i] + h.b[i], h.c[i]]));
    const y0 = Math.floor((Math.min(...vals) - 1) / 5) * 5;
    let y1 = Math.ceil((Math.max(...vals) + 1) / 5) * 5;
    if (y1 - y0 < 10) y1 = y0 + 10;
    const paso = y1 - y0 > 20 ? 5 : 2;
    const ticks = []; for (let t = y0; t <= y1 + 1e-9; t += paso) ticks.push(t);
    const capas = [];
    top.forEach(i => {
      const col = colorCand(D.cands[i].n), nm = nomCorto(D.cands[i].nm);
      capas.push({ tipo: 'banda', datos: H.map(h => ({ t: h.pct, lo: h.p[i] - h.b[i], hi: h.p[i] + h.b[i] })), color: col, opacidad: 0.18 });
      capas.push({ tipo: 'linea', datos: H.map(h => ({ t: h.pct, v: h.c[i] })), color: col, grosor: 3.5, punteada: true,
        etiquetaFinal: [fmt(H[H.length - 1].c[i], 1) + '%', T('conteo', 'count')], tamFinal: 21 });
      capas.push({ tipo: 'linea', datos: H.map(h => ({ t: h.pct, v: h.p[i] })), color: col, grosor: 6,
        etiquetaFinal: [fmt(H[H.length - 1].p[i], 1) + '%', nm], tamFinal: 28 });
    });
    dibujarTiempo(g, {
      x: [0, 100], y: { min: y0, max: y1, ticks, fmt: t => t + '%' }, gob: false,
      xticksPos: [0, 25, 50, 75, 100].map(t => ({ t, lbl: t + '%' })), m: { l: 86, r: 210, t: 20, b: 52 }, capas, gapFinal: 30,
      tips: H.map(h => h.pct),
      tip: t => {
        const h = H.find(z => z.pct === t);
        const filas = top.flatMap(i => [
          { nm: nomCorto(D.cands[i].nm) + T(' · proyección', ' · projection'), val: `${fmt(h.p[i], 1)}% ± ${fmt(h.b[i], 1)}`, color: colorCand(D.cands[i].n) },
          { nm: nomCorto(D.cands[i].nm) + T(' · conteo', ' · count'), val: fmt(h.c[i], 1) + '%', color: colorCand(D.cands[i].n) }]);
        return { html: tipHTML(T(`Con ${fmt(t, 1)}% escrutado`, `With ${fmt(t, 1)}% counted`), filas), puntos: top.map(i => ({ v: h.p[i], color: colorCand(D.cands[i].n) })) };
      },
    });
  }
  // relectura periódica del archivo que escribe vivo.py (sin servidor: se inyecta un <script>)
  function recargarVivo(v, alTerminar) {
    const s = document.createElement('script');
    s.src = `data/vivo/2026-${v}.js?_=${Date.now()}`;
    s.onload = s.onerror = () => { s.remove(); alTerminar(); };
    document.head.appendChild(s);
  }

  /* ================= quién votó a quién: indicadores sociales y voto por municipio ================= */
  const ROJO = '#C8372D';
  const REG_COL = { 1: '#2C8484', 2: '#E07A23', 3: '#6B3D8B', 4: '#2D6A3D', 5: '#C9A227' };   // 1er dígito del código IBGE
  const REG_NM = { 1: T('Norte', 'North'), 2: T('Nordeste', 'Northeast'), 3: T('Sudeste', 'Southeast'), 4: T('Sur', 'South'), 5: T('Centro-Oeste', 'Center-West') };
  const IND_SOCIO = {
    bf: { i: 0, nm: T('Bolsa Família', 'Bolsa Família'), eje: T('Familias con Auxílio Brasil (hoy Bolsa Família) cada 100 hogares, octubre de 2022', 'Families on Auxílio Brasil (now Bolsa Família) per 100 households, October 2022'),
      orden: T('de menos a más Bolsa Família', 'from least to most Bolsa Família'), corto: v => fmt(v, 0), largo: v => fmt(v, 0) + T(' cada 100 hogares', ' per 100 households'), ticks: [0, 25, 50, 75, 100, 125, 150] },
    ingreso: { i: 1, nm: T('Ingreso', 'Income'), log: true, eje: T('Ingreso mensual por persona del hogar (mediana, en reales), Censo 2022', 'Monthly household income per person (median, reais), 2022 Census'),
      orden: T('de menor a mayor ingreso', 'from lowest to highest income'), corto: v => num(Math.round(v)), largo: v => 'R$ ' + num(Math.round(v)), ticks: [250, 500, 1000, 2000] },
    raza: { i: 2, nm: T('Raza', 'Race'), eje: T('% de población blanca, Censo 2022', '% white population, 2022 Census'),
      orden: T('de menos a más población blanca', 'from least to most white population'), corto: v => fmt(v, 0) + '%', largo: v => fmt(v, 1) + T('% de población blanca', '% white population'), ticks: [0, 25, 50, 75, 100] },
    religion: { i: 3, nm: T('Religión', 'Religion'), eje: T('% de evangélicos (10 años y más), Censo 2022', '% evangelicals (aged 10+), 2022 Census'),
      orden: T('de menos a más evangélicos', 'from fewest to most evangelicals'), corto: v => fmt(v, 0) + '%', largo: v => fmt(v, 1) + T('% evangélicos', '% evangelicals'), ticks: [0, 25, 50, 75, 100] },
  };
  let baseSocio = null;
  function filasSocio() {
    if (baseSocio) return baseSocio;
    const E = window.ELEC['2022-2'], E1 = window.ELEC['2022-1'];
    const iL = E.cands.findIndex(c => c.n === '13'), iB = E.cands.findIndex(c => c.n === '22'), iL1 = E1.cands.findIndex(c => c.n === '13');
    baseSocio = Object.entries((window.SOCIO || { mun: {} }).mun).filter(([ib]) => E.mun[ib]).map(([ib, x]) => {
      const r = E.mun[ib], r1 = E1.mun[ib];
      return { ib, x, val: r[1], lula: r[0][iL], bolso: r[0][iB], val1: r1 ? r1[1] : 0, lula1: r1 ? r1[0][iL1] : 0 };
    });
    return baseSocio;
  }
  // 10 grupos de municipios con la misma cantidad de votos (balotaje 2022), ordenados por el indicador
  const gruposCache = {};
  function gruposSocio(k) {
    if (gruposCache[k]) return gruposCache[k];
    const j = IND_SOCIO[k].i;
    const F = filasSocio().filter(f => f.x[j] != null).sort((a, b) => a.x[j] - b.x[j]);
    const tot = F.reduce((a, f) => a + f.val, 0);
    const G = Array.from({ length: 10 }, () => ({ mun: [], val: 0, lula: 0, bolso: 0 }));
    let acc = 0;
    F.forEach(f => {
      const g = G[Math.min(9, Math.floor((acc + f.val / 2) / tot * 10))];
      acc += f.val; f.grupo = f.grupo || {}; g.mun.push(f); g.val += f.val; g.lula += f.lula; g.bolso += f.bolso;
    });
    G.forEach((g, n) => {
      g.mun.forEach(f => { f.grupo[k] = n + 1; });
      const xs = g.mun.map(f => f.x[j]);
      g.med = xs[Math.floor(xs.length / 2)]; g.min = xs[0]; g.max = xs[xs.length - 1];
      g.pl = 100 * g.lula / g.val; g.pb = 100 * g.bolso / g.val;
    });
    return (gruposCache[k] = G);
  }
  function tituloSocio(k) {
    if (!window.SOCIO) return T('Quién votó a quién', 'Who voted for whom');
    const G = gruposSocio(k);
    if (k === 'bf') return T('Cuanto más Bolsa Família, más votos para Lula', 'The more Bolsa Família, the more votes for Lula');
    if (k === 'ingreso') return T(`En los municipios más pobres, Lula sacó ${fmt(G[0].pl, 0)}% de los votos`, `In the poorest municipalities, Lula won ${fmt(G[0].pl, 0)}% of the vote`);
    if (k === 'raza') return T('Donde hay más población blanca, a Bolsonaro le fue mejor', 'Where more of the population is white, Bolsonaro did better');
    return T('Donde hay más evangélicos, a Lula le fue peor', 'Where there are more evangelicals, Lula did worse');
  }
  function bajadaSocio(k) {
    const I = IND_SOCIO[k];
    let b = T(`Balotaje 2022, % de votos válidos. A la izquierda, los municipios agrupados en diez grupos con la misma cantidad de votos, ordenados ${I.orden}; a la derecha, cada municipio es un punto.`,
      `2022 runoff, % of valid votes. Left: municipalities in ten groups with the same number of votes, ordered ${I.orden}; right: each municipality is a dot.`);
    if (k === 'religion') b += T(' La relación es más fuerte dentro del Nordeste.', ' The relationship is stronger within the Northeast.');
    return b;
  }
  function barrasSocio(box, k) {
    const G = gruposSocio(k), I = IND_SOCIO[k];
    const notas = G.flatMap((g, n) => [
      { t: n + 1.5, v: g.pl, dy: 34, anchor: 'middle', texto: fmt(g.pl, 0), color: '#FFFFFF', size: 24, peso: 700, halo: false },
      { t: n + 1.5, v: 100, dy: 34, anchor: 'middle', texto: fmt(g.pb, 0), color: '#FFFFFF', size: 24, peso: 700, halo: false },
    ]);
    dibujarTiempo(box, {
      x: [1, 11], y: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], fmt: v => v + '%' }, gob: false, m: { l: 74, r: 8, t: 14, b: 50 },
      xticksPos: G.map((g, n) => ({ t: n + 1.5, lbl: I.corto(g.med) })),
      capas: [
        { tipo: 'barras', datos: G.map((g, n) => ({ t: n + 1, v: 100, color: AZUL })), valores: false, ancho: 0.8 },
        { tipo: 'barras', datos: G.map((g, n) => ({ t: n + 1, v: g.pl, color: ROJO })), valores: false, ancho: 0.8 },
        { tipo: 'linea', datos: [{ t: 1, v: 50 }, { t: 11, v: 50 }], color: '#1A1A1A', grosor: 2.5, punteada: true },
      ],
      notas,
      tips: G.map((g, n) => n + 1.5),
      tip: t => {
        const g = G[Math.round(t - 1.5)];
        return {
          html: tipHTML(T(`Grupo ${Math.round(t - 0.5)}: ${num(g.mun.length)} municipios`, `Group ${Math.round(t - 0.5)}: ${num(g.mun.length)} municipalities`),
            [{ nm: 'Lula', val: fmt(g.pl, 1) + '%', color: ROJO }, { nm: 'Jair Bolsonaro', val: fmt(g.pb, 1) + '%', color: AZUL }],
            T(`Entre ${I.largo(g.min)} y ${I.largo(g.max)} (típico: ${I.largo(g.med)})<br>${num(g.val)} votos válidos`, `From ${I.largo(g.min)} to ${I.largo(g.max)} (typical: ${I.largo(g.med)})<br>${num(g.val)} valid votes`)),
          puntos: [{ v: g.pl, color: ROJO }],
        };
      },
    });
  }
  function dispersionSocio(box, k, marcado) {
    const { el } = window.Charts;
    const I = IND_SOCIO[k], j = I.i;
    box.querySelectorAll(':scope > svg').forEach(x => x.remove());
    const F = filasSocio().filter(f => f.x[j] != null);
    const W = box.offsetWidth, H = box.offsetHeight, m = { l: 74, r: 14, t: 14, b: 50 };
    const sx = I.log ? v => Math.log(v) : v => v;
    const xs = F.map(f => f.x[j]);
    let a = I.log ? Math.log(Math.min(...xs) * 0.92) : 0, b = I.log ? Math.log(Math.max(...xs) * 1.05) : Math.max(...xs) * 1.02;
    if (!I.log && k !== 'bf') b = 100;
    const X = v => m.l + (sx(v) - a) / (b - a) * (W - m.l - m.r), Y = p => m.t + (100 - p) / 100 * (H - m.t - m.b);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }); box.appendChild(svg);
    [0, 25, 50, 75, 100].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: v === 50 ? '#1A1A1A' : C.grid, 'stroke-width': v === 50 ? 2 : 1.5, 'stroke-dasharray': v === 50 ? '8 7' : null, opacity: v === 50 ? 0.7 : 1 }, svg);
      el('text', { x: m.l - 16, y: Y(v) + 8, class: 'tick tick-y' }, svg, v + '%');
    });
    I.ticks.filter(t => sx(t) >= a && sx(t) <= b).forEach(t => {
      el('line', { x1: X(t), x2: X(t), y1: H - m.b, y2: H - m.b + 8, stroke: C.ruleStrong, 'stroke-width': 1.5 }, svg);
      el('text', { x: X(t), y: H - m.b + 38, class: 'tick', 'text-anchor': 'middle' }, svg, I.corto(t));
    });
    const maxV = Math.max(...F.map(f => f.val));
    const R = f => 1.4 + 15 * Math.sqrt(f.val / maxV);
    const g = el('g', null, svg);
    F.slice().sort((p, q) => q.val - p.val).forEach(f => {
      el('circle', { cx: X(f.x[j]).toFixed(1), cy: Y(100 * f.lula / f.val).toFixed(1), r: R(f).toFixed(1), fill: REG_COL[f.ib[0]], 'fill-opacity': 0.5, stroke: REG_COL[f.ib[0]], 'stroke-opacity': 0.7, 'stroke-width': 0.6 }, g);
    });
    // las ciudades más grandes, con nombre
    const nom = ib => ((window.MUN_NOMES || {})[ib] || [ib])[0];
    const grandes = F.slice().sort((p, q) => q.val - p.val).slice(0, 5);
    if (marcado && !grandes.some(f => f.ib === marcado)) { const f = F.find(z => z.ib === marcado); if (f) grandes.push(f); }
    // contorno de las grandes (si no, quedan tapadas por los puntos chicos) y nombres sin pisarse
    const labs = grandes.map(f => {
      const cx = X(f.x[j]), cy = Y(100 * f.lula / f.val), r = R(f), es = f.ib === marcado;
      el('circle', { cx, cy, r, fill: 'none', stroke: '#1A1A1A', 'stroke-width': es ? 3 : 1.6, 'stroke-opacity': es ? 1 : 0.75 }, svg);
      if (es) el('circle', { cx, cy, r: r + 7, fill: 'none', stroke: '#1A1A1A', 'stroke-width': 3 }, svg);
      return { f, cx, cy, r, es, y: cy, izq: cx > W - 210 };
    });
    for (let it = 0; it < 60; it++) {
      labs.sort((p, q) => p.y - q.y);
      for (let i = 1; i < labs.length; i++) { const d = labs[i].y - labs[i - 1].y; if (d < 24) { labs[i].y += (24 - d) / 2; labs[i - 1].y -= (24 - d) / 2; } }
    }
    labs.forEach(l => {
      const x = l.cx + (l.izq ? -(l.r + 10) : l.r + 10);
      if (Math.abs(l.y - l.cy) > 6) el('path', { d: `M${l.cx + (l.izq ? -l.r : l.r)} ${l.cy}L${x + (l.izq ? 4 : -4)} ${l.y}`, stroke: '#4A4A4A', 'stroke-width': 1.2, fill: 'none' }, svg);
      el('text', { x, y: l.y + 6, 'text-anchor': l.izq ? 'end' : 'start', class: 'lbl', 'font-size': l.es ? 21 : 18, 'font-weight': l.es ? 700 : 600, fill: '#1A1A1A' }, svg, nom(l.f.ib));
    });
    // tooltip: el municipio más cercano al cursor
    const tip = window.Charts.tooltip(box);
    svg.addEventListener('mousemove', ev => {
      const pt = window.Charts.svgPoint(svg, ev);
      let best = null, bd = 18 * 18;
      F.forEach(f => { const dx = X(f.x[j]) - pt.x, dy = Y(100 * f.lula / f.val) - pt.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = f; } });
      if (!best) { tip.hide(); return; }
      const nm = (window.MUN_NOMES || {})[best.ib] || [best.ib, ''];
      tip.show(tipHTML(`${nm[0]} <span style="color:#C9C2B2;font-weight:400">(${nm[1]})</span>`,
        [{ nm: 'Lula', val: fmt(100 * best.lula / best.val, 1) + '%', color: ROJO }, { nm: 'Jair Bolsonaro', val: fmt(100 * best.bolso / best.val, 1) + '%', color: AZUL }],
        `${I.largo(best.x[j])}<br>${num(best.val)} ${T('votos válidos', 'valid votes')} · ${REG_NM[best.ib[0]]}`), X(best.x[j]), Y(100 * best.lula / best.val), W);
    });
    svg.addEventListener('mouseleave', () => tip.hide());
  }
  // buscador de municipio para la dispersión (lo marca en el gráfico)
  const sinTildes = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function buscadorSocio(alElegir) {
    const w = document.createElement('div'); w.className = 'so-buscar no-png';
    w.innerHTML = `<input type="search" autocomplete="off" spellcheck="false" placeholder="${T('Buscar municipio…', 'Find a municipality…')}"><div class="mb-lista"></div>`;
    const inp = w.querySelector('input'), lista = w.querySelector('.mb-lista');
    const idx = filasSocio().map(f => { const nm = (window.MUN_NOMES || {})[f.ib] || [f.ib, '']; return { ib: f.ib, nm: nm[0], uf: nm[1], k: sinTildes(nm[0]), val: f.val }; });
    let res = [], k = 0;
    const dibujar = () => { lista.innerHTML = res.map((e, i) => `<div class="mb-it${i === k ? ' on' : ''}" data-i="${i}"><span>${e.nm}</span><small>${e.uf}</small></div>`).join(''); };
    const elegir = e => { inp.value = ''; res = []; dibujar(); inp.blur(); alElegir(e.ib); };
    inp.addEventListener('input', () => {
      const q = sinTildes(inp.value.trim()); k = 0;
      const nota = e => (e.k === q ? 0 : e.k.startsWith(q) ? 1 : e.k.includes(q) ? 2 : 9);
      res = q ? idx.map(e => [nota(e), e]).filter(x => x[0] < 9).sort((p, r) => p[0] - r[0] || r[1].val - p[1].val).slice(0, 6).map(x => x[1]) : [];
      dibujar();
    });
    inp.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'ArrowDown') { ev.preventDefault(); k = Math.min(k + 1, res.length - 1); dibujar(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); k = Math.max(k - 1, 0); dibujar(); }
      else if (ev.key === 'Enter' && res[k]) elegir(res[k]);
      else if (ev.key === 'Escape') { inp.value = ''; res = []; dibujar(); inp.blur(); }
    });
    lista.addEventListener('mousedown', ev => { const it = ev.target.closest('.mb-it'); if (it) { ev.preventDefault(); elegir(res[+it.dataset.i]); } });
    inp.addEventListener('blur', () => setTimeout(() => { res = []; dibujar(); }, 150));
    return w;
  }
  let marcadoSocio = null;
  function placaSocio(box, k) {
    if (!window.SOCIO) { box.innerHTML = `<div class="aviso">${T('Faltan los datos (data/socio.js).', 'Data missing (data/socio.js).')}</div>`; return; }
    const I = IND_SOCIO[k];
    box.innerHTML = `<div class="so-wrap">
      <div class="so-col"><div class="so-ley"><span><i style="background:${ROJO}"></i>Lula</span><span><i style="background:${AZUL}"></i>Jair Bolsonaro</span><span><i class="ln"></i>50%</span></div>
        <div class="so-graf so-barras"></div><div class="so-eje">${T('Valor típico de cada grupo', 'Typical value in each group')}: ${I.eje.charAt(0).toLowerCase() + I.eje.slice(1)}</div></div>
      <div class="so-col"><div class="so-ley">${Object.keys(REG_COL).map(r => `<span><i style="background:${REG_COL[r]};border-radius:50%"></i>${REG_NM[r]}</span>`).join('')}</div>
        <div class="so-graf so-puntos"></div><div class="so-eje">${I.eje}${I.log ? T(' · escala logarítmica', ' · log scale') : ''} · ${T('% de Lula (eje vertical)', 'Lula % (vertical axis)')}</div></div></div>`;
    barrasSocio(box.querySelector('.so-barras'), k);
    const pts = box.querySelector('.so-puntos');
    dispersionSocio(pts, k, marcadoSocio);
    if (!modoPNG) pts.appendChild(buscadorSocio(ib => { marcadoSocio = ib; dispersionSocio(pts, k, ib); }));
  }
  // en vivo (solo en la copia local): cambio del % de Lula respecto de 2022 en los mismos grupos
  const turnoHoy = () => (new Date() >= new Date(2026, 9, 20) ? '2' : '1');
  function placaSocioVivo(box) {
    const v = turnoHoy(), D = vivoDe(v);
    if (!D) {
      box.innerHTML = `<div class="aviso" style="max-width:1100px">${T('Esperando datos del TSE (tiene que estar abierta la ventana de EN_VIVO). Esta vista se actualiza sola cada 15 segundos.', 'Waiting for TSE data (the EN_VIVO window must be running). This view refreshes every 15 seconds.')}</div>`;
      return;
    }
    const iL = D.cands.findIndex(c => c.n === '13');
    box.innerHTML = '<div class="so-vivo">' + Object.keys(IND_SOCIO).map(k => `<div class="so-col"><div class="sub-panel" style="padding-left:74px">${IND_SOCIO[k].nm} · <span style="text-transform:none;letter-spacing:0;font-weight:500">${IND_SOCIO[k].orden}</span></div><div class="so-graf" data-k="${k}"></div></div>`).join('') + '</div>';
    Object.keys(IND_SOCIO).forEach(k => {
      const G = gruposSocio(k);
      const datos = G.map((g, n) => {
        let v26 = 0, l26 = 0, v22 = 0, l22 = 0, nmun = 0;
        g.mun.forEach(f => {
          const r = D.mun[f.ib]; if (!r || !r[1]) return;
          nmun++; v26 += r[1]; l26 += r[0][iL];
          if (v === '1') { v22 += f.val1; l22 += f.lula1; } else { v22 += f.val; l22 += f.lula; }
        });
        return { t: n + 1, v: v26 && v22 ? 100 * l26 / v26 - 100 * l22 / v22 : null, nmun, cob: g.val ? v26 / (v === '1' ? g.mun.reduce((a, f) => a + f.val1, 0) : g.val) : 0 };
      });
      const vals = datos.filter(d => d.v != null).map(d => Math.abs(d.v));
      const lim = Math.max(5, Math.ceil((Math.max(0, ...vals) + 1) / 5) * 5);
      dibujarTiempo(box.querySelector(`[data-k="${k}"]`), {
        x: [1, 11], y: { min: -lim, max: lim, ticks: [-lim, 0, lim], fmt: t => fmtSigno(t, 0) }, gob: false, m: { l: 74, r: 8, t: 36, b: 44 },
        xticksPos: G.map((g, n) => ({ t: n + 1.5, lbl: IND_SOCIO[k].corto(g.med) })),
        capas: [{ tipo: 'barras', datos, color: ROJO, colorNeg: AZUL, ancho: 0.8, fmtValor: x => fmtSigno(x, 1), tamValor: 19 }],
        tips: datos.map(d => d.t + 0.5),
        tip: t => {
          const d = datos[Math.round(t - 1.5)];
          return { html: tipHTML(T(`Grupo ${d.t}`, `Group ${d.t}`), [{ nm: T('Lula, cambio vs 2022', 'Lula, change vs 2022'), val: d.v == null ? '–' : fmtSigno(d.v, 1) + ' pts', color: ROJO }],
            T(`${num(d.nmun)} municipios con datos · ~${fmt(100 * d.cob, 0)}% de los votos del grupo contados`, `${num(d.nmun)} municipalities reporting · ~${fmt(100 * d.cob, 0)}% of the group's votes counted`)) };
        },
      });
    });
  }

  /* ================= dónde se mueve el voto (en vivo, solo en la copia local) ================= */
  const MIN_PCT = 20;          // % de urnas contadas para usar un municipio
  const UF_SG = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };
  const FACTORES = [
    { nm: T('Bolsa Família', 'Bolsa Família'), alto: T('hay más Bolsa Família', 'there is more Bolsa Família'), x: f => (f.s ? f.s[0] : null) },
    { nm: T('Ingreso', 'Income'), alto: T('el ingreso es más alto', 'income is higher'), x: f => (f.s && f.s[1] ? Math.log(f.s[1]) : null) },
    { nm: T('% población blanca', '% white population'), alto: T('hay más población blanca', 'more of the population is white'), x: f => (f.s ? f.s[2] : null) },
    { nm: T('% evangélicos', '% evangelicals'), alto: T('hay más evangélicos', 'there are more evangelicals'), x: f => (f.s ? f.s[3] : null) },
    { nm: T('Voto a Lula en 2022', 'Lula vote in 2022'), alto: T('Lula había sacado más en 2022', 'Lula did better in 2022'), x: f => f.l22 },
    { nm: T('Tamaño del municipio', 'Municipality size'), alto: T('el municipio es más grande', 'the municipality is bigger'), x: f => Math.log(Math.max(f.apt, 1)) },
  ];
  function datosSwing(v) {
    const D = vivoDe(v);
    if (!D || !window.ELEC) return null;
    const B = window.ELEC['2022-' + v], SO = (window.SOCIO || {}).mun || {};
    const i26 = n => D.cands.findIndex(c => c.n === n), i22 = n => B.cands.findIndex(c => c.n === n);
    const L = i26('13'), F = i26('22'), L0 = i22('13'), J0 = i22('22');
    const filas = [];
    for (const ib in D.mun) {
      const r = D.mun[ib], b = B.mun[ib];
      if (!r || !b || !r[1] || !b[1] || (r[5] || 0) < MIN_PCT) continue;
      const l26 = 100 * r[0][L] / r[1], l22 = 100 * b[0][L0] / b[1];
      const f26 = F >= 0 ? 100 * r[0][F] / r[1] : null, j22 = 100 * b[0][J0] / b[1];
      filas.push({ ib, val: r[1], pct: r[5], apt: b[3], l22, l26, dl: l26 - l22, df: f26 == null ? null : f26 - j22, s: SO[ib], r, b });
    }
    return { D, B, filas, L, F, L0, J0 };
  }
  function wcorr(xs, ys, ws) {
    let sw = 0, mx = 0, my = 0;
    xs.forEach((x, i) => { sw += ws[i]; mx += ws[i] * x; my += ws[i] * ys[i]; });
    mx /= sw; my /= sw;
    let cxy = 0, cxx = 0, cyy = 0;
    xs.forEach((x, i) => { const a = x - mx, b = ys[i] - my; cxy += ws[i] * a * b; cxx += ws[i] * a * a; cyy += ws[i] * b * b; });
    return cxx && cyy ? cxy / Math.sqrt(cxx * cyy) : 0;
  }
  function correlacionesSwing(S) {
    return FACTORES.map(f => {
      const ok = S.filas.filter(z => f.x(z) != null && isFinite(f.x(z)));
      return { ...f, n: ok.length, r: ok.length > 20 ? wcorr(ok.map(f.x), ok.map(z => z.dl), ok.map(z => z.val)) : null };
    });
  }
  const promSwing = (F, k) => { let a = 0, w = 0; F.forEach(z => { if (z[k] != null) { a += z.val * z[k]; w += z.val; } }); return w ? a / w : null; };
  function tituloSwing(v) {
    const S = datosSwing(v);
    if (!S || S.filas.length < 30) return T('Dónde se mueve el voto respecto de 2022', 'Where the vote is moving compared with 2022');
    const C = correlacionesSwing(S).filter(c => c.r != null).sort((a, b) => Math.abs(b.r) - Math.abs(a.r))[0];
    if (C && Math.abs(C.r) >= 0.3 && C.n >= 100)
      return T(`A Lula le va ${C.r > 0 ? 'mejor' : 'peor'} que en 2022 donde ${C.alto}`, `Lula is doing ${C.r > 0 ? 'better' : 'worse'} than in 2022 where ${C.alto}`);
    const d = promSwing(S.filas, 'dl');
    return T(`Lula ${d >= 0 ? 'sube' : 'baja'} ${fmt(Math.abs(d), 1)} puntos respecto de 2022 en los municipios ya contados`, `Lula is ${d >= 0 ? 'up' : 'down'} ${fmt(Math.abs(d), 1)} points from 2022 in the municipalities counted so far`);
  }
  function bajadaSwing(v) {
    const S = datosSwing(v), vuelta = v === '1' ? T('Primera vuelta', 'First round') : T('Balotaje', 'Runoff');
    const n = S ? S.filas.length : 0, pct = S ? S.D.nac.pct || 0 : 0;
    return T(`${vuelta} 2026 contra la misma vuelta de 2022, comparando los mismos municipios (${num(n)} con al menos ${MIN_PCT}% de las urnas contadas; ${fmt(pct, 1)}% de las secciones escrutadas en el país). Rojo: a Lula le va mejor; azul: peor.`,
      `${vuelta} 2026 vs. the same round in 2022, comparing the same municipalities (${num(n)} with at least ${MIN_PCT}% of ballot boxes counted; ${fmt(pct, 1)}% of polling stations counted nationwide). Red: Lula doing better; blue: worse.`);
  }
  function barrasH(box, filas, lim, opts) {
    // barras horizontales divergentes desde 0: filas [{nm, v, sub, tip}]
    const { el } = window.Charts;
    const W = box.offsetWidth, H = box.offsetHeight, m = { l: opts.l || 70, r: 70, t: 6, b: 34 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }); box.appendChild(svg);
    const X = x => m.l + (x + lim) / (2 * lim) * (W - m.l - m.r), alto = (H - m.t - m.b) / Math.max(filas.length, 1);
    [-lim, 0, lim].forEach(t => {
      el('line', { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, stroke: t === 0 ? '#B3AC9C' : C.grid, 'stroke-width': t === 0 ? 2 : 1.5 }, svg);
      el('text', { x: X(t), y: H - m.b + 26, class: 'tick', 'text-anchor': 'middle', 'font-size': 18 }, svg, opts.fmtEje(t));
    });
    filas.forEach((f, i) => {
      const y = m.t + i * alto, h = Math.min(alto * 0.72, 30), yc = y + alto / 2;
      if (f.v == null) return;
      const x0 = X(0), x1 = X(Math.max(-lim, Math.min(lim, f.v)));
      el('rect', { x: Math.min(x0, x1), y: yc - h / 2, width: Math.max(1.5, Math.abs(x1 - x0)), height: h, fill: f.v >= 0 ? ROJO : AZUL, rx: 2 }, svg);
      el('text', { x: m.l - 12, y: yc + 6, 'text-anchor': 'end', class: 'tick', 'font-size': opts.tamNom || 18, 'font-weight': 600, fill: '#1A1A1A' }, svg, f.nm);
      el('text', { x: x1 + (f.v >= 0 ? 8 : -8), y: yc + 6, 'text-anchor': f.v >= 0 ? 'start' : 'end', class: 'lbl', 'font-size': 17, 'font-weight': 700, fill: f.v >= 0 ? ROJO : AZUL }, svg, opts.fmtVal(f.v));
    });
  }
  function placaSwing(box, v) {
    const S = datosSwing(v);
    const bat = `EN_VIVO_${v === '1' ? '1ra' : '2da'}_vuelta.bat`;
    if (!S) { box.innerHTML = `<div class="aviso" style="max-width:1100px">${T(`Esperando datos del TSE. Tiene que estar abierta la ventana de <code>${bat}</code>; esta placa se actualiza sola cada 15 segundos.`, `Waiting for TSE data. The <code>${bat}</code> window must be running; this chart refreshes every 15 seconds.`)}</div>`; return; }
    if (S.filas.length < 30) { box.innerHTML = `<div class="aviso" style="max-width:1100px">${T(`Todavía hay pocos municipios con al menos ${MIN_PCT}% de las urnas contadas (${S.filas.length}). La placa se arma sola apenas haya 30.`, `Too few municipalities with at least ${MIN_PCT}% of ballot boxes counted (${S.filas.length}). The chart builds itself once there are 30.`)}</div>`; return; }
    const F = S.filas;
    // 1) estados
    const porUF = {};
    F.forEach(z => { const u = z.ib.slice(0, 2); (porUF[u] = porUF[u] || []).push(z); });
    const ufs = Object.entries(porUF).filter(([, zs]) => zs.length >= 3).map(([u, zs]) => ({ u, nm: UF_SG[u], v: promSwing(zs, 'dl'), vf: promSwing(zs, 'df'), n: zs.length })).sort((a, b) => b.v - a.v);
    // 2) ciudades grandes
    const nomM = ib => { const n = (window.MUN_NOMES || {})[ib]; return n ? `${n[0]} <span>${n[1]}</span>` : ib; };
    const grandes = F.filter(z => z.apt >= 100000 && z.pct >= 30).sort((a, b) => b.dl - a.dl);
    const fila = z => `<div class="sw-c"><span class="n">${nomM(z.ib)}</span><b style="color:${z.dl >= 0 ? ROJO : AZUL}">${fmtSigno(z.dl, 1)}</b><small>${fmt(z.pct, 0)}%</small></div>`;
    const sube = grandes.slice(0, 4), baja = grandes.slice(-4).reverse();
    // 3) a dónde va el voto (mismos municipios)
    const sum = (f) => F.reduce((a, z) => a + f(z), 0);
    const v26 = sum(z => z.r[1]), v22 = sum(z => z.b[1]);
    const pc26 = i => 100 * sum(z => (i >= 0 ? z.r[0][i] : 0)) / v26, pc22 = i => 100 * sum(z => (i >= 0 ? z.b[0][i] : 0)) / v22;
    const dL = pc26(S.L) - pc22(S.L0), dF = pc26(S.F) - pc22(S.J0);
    const bn26 = 100 * sum(z => z.r[2]) / (v26 + sum(z => z.r[2])), bn22 = 100 * sum(z => z.b[2]) / (v22 + sum(z => z.b[2]));
    const part26 = 100 * sum(z => z.r[4]) / sum(z => z.r[3] * (z.pct / 100)), part22 = 100 * sum(z => z.b[4]) / sum(z => z.b[3]);
    const filasDesc = [[T('Lula', 'Lula'), dL], [T('Flávio (vs Jair)', 'Flávio (vs Jair)'), dF]];
    if (v === '1') filasDesc.push([T('Resto de los candidatos', 'Other candidates'), -(dL + dF)]);
    filasDesc.push([T('Blancos y nulos*', 'Blank and null*'), bn26 - bn22], [T('Participación*', 'Turnout*'), part26 - part22]);
    box.innerHTML = `<div class="sw-wrap">
      <div class="sw-col"><div class="sub-panel sw-h">${T('Lula, por estado', 'Lula, by state')}</div><div class="sw-graf sw-uf"></div></div>
      <div class="sw-col"><div class="sub-panel sw-h">${T('Ciudades grandes: dónde más sube…', 'Big cities: where Lula gains most…')}</div>${sube.map(fila).join('')}
        <div class="sub-panel sw-h" style="margin-top:12px">${T('…y dónde más baja Lula', '…and where he loses most')}</div>${baja.map(fila).join('')}
        <div class="sw-nota">${T('Más de 100 mil electores y al menos 30% contado (a la derecha, % contado).', 'Over 100,000 voters and at least 30% counted (right: % counted).')}</div>
        <div class="sub-panel sw-h" style="margin-top:14px">${T('¿A dónde va el voto?', 'Where is the vote going?')}</div>
        <div class="sw-desc">${filasDesc.map(([n, x]) => `<div><span>${n}</span><b style="color:${x >= 0 ? '#1A1A1A' : '#6E6A60'}">${fmtSigno(x, 1)} pts</b></div>`).join('')}</div>
        <div class="sw-nota">${T('Mismos municipios que en 2022, en puntos. *Sobre votos emitidos y sobre electores.', 'Same municipalities as in 2022, in points. *Of votes cast and of registered voters.')}</div></div>
      <div class="sw-col"><div class="sub-panel sw-h">${T('Qué acompaña al cambio de Lula', 'What goes with Lula\'s change')}</div><div class="sw-graf sw-fac"></div>
        <div class="sw-nota">${T('Correlación entre municipios (ponderada por votos): a la derecha, a Lula le va mejor donde el factor es alto; a la izquierda, peor. Describe dónde se mueve el voto, no por qué.', 'Correlation across municipalities (vote-weighted): right, Lula does better where the factor is high; left, worse. Describes where the vote moves, not why.')}</div></div></div>`;
    const lim = Math.max(4, Math.ceil(Math.max(...ufs.map(u => Math.abs(u.v))) + 0.5));
    barrasH(box.querySelector('.sw-uf'), ufs, lim, { l: 52, fmtEje: t => fmtSigno(t, 0), fmtVal: x => fmtSigno(x, 1) });
    barrasH(box.querySelector('.sw-fac'), correlacionesSwing(S).map(c => ({ nm: c.nm, v: c.r })), 1, { l: 220, tamNom: 19, fmtEje: t => fmtSigno(t, 0), fmtVal: x => fmtSigno(x, 2) });
  }

  /* ================= placas ================= */
  const PLACAS = [
    {
      id: 'pib', kicker: T('Economía', 'Economy'), corto: T('Crecimiento del PIB', 'GDP growth'),
      titulo: T('La economía de Brasil lleva seis años creciendo, aunque se viene desacelerando', 'Brazil’s economy has grown for six straight years, but it is slowing down'),
      bajada: T('Variación anual del PIB real, en %. 2010–2025 y proyección para 2026.', 'Annual change in real GDP, %. 2010–2025 and 2026 forecast.'),
      fuente: () => T(`<b>Fuente:</b> IBGE, Cuentas Nacionales Trimestrales. 2026: mediana de las expectativas del mercado relevadas por el Banco Central (Focus, 25/9/2026); en el primer semestre de 2026 el PIB creció ${fmt(S.pib.parcial.v, 1)}% interanual.`,
        `<b>Source:</b> IBGE, Quarterly National Accounts. 2026: median market forecast compiled by the Central Bank (Focus survey, Sep 25, 2026); GDP grew ${fmt(S.pib.parcial.v, 1)}% year on year in the first half of 2026.`),
      datos: () => ({
        archivo: T('pib', 'gdp'), cols: T(['anio', 'variacion_pib_real_pct', 'tipo'], ['year', 'real_gdp_growth_pct', 'type']),
        filas: S.pib.obs.map(o => [o.a, o.v, T('observado', 'observed')]).concat([[2026, S.pib.focus, T('proyección Focus (BCB) 25/9/2026', 'Focus (BCB) forecast, Sep 25 2026')], [2026, S.pib.parcial.v, T('1er semestre interanual', 'first half, year on year')]]),
      }),
      render(box) {
        const d = S.pib.obs.map(o => ({ t: o.a, v: o.v }));
        d.push({ t: 2026, v: S.pib.focus, tipo: 'proy', etiqueta: T('proyección', 'forecast') });
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -5, max: 9, ticks: [-4, -2, 0, 2, 4, 6, 8], fmt: v => fmt(v, 0) + '%' },
          xfmt: String,
          capas: [{ tipo: 'barras', datos: d, color: AZUL, colorNeg: TERRA }],
          tips: anios(2010, 2026).map(y => y + 0.5),
          tip: t => {
            const y = Math.floor(t), o = d.find(z => z.t === y);
            if (!o) return null;
            const pie = y === 2026 ? T(`Proyección Focus (BCB), 25/9/2026<br>1er semestre: +${fmt(S.pib.parcial.v, 1)}% interanual`, `Focus (BCB) forecast, Sep 25, 2026<br>First half: +${fmt(S.pib.parcial.v, 1)}% year on year`) : null;
            return { html: tipHTML(String(y), [{ nm: T('PIB', 'GDP'), val: fmtSigno(o.v, y === 2026 ? 2 : 1) + '%', color: o.v < 0 ? TERRA : AZUL }], pie) };
          },
        });
      },
    },
    {
      id: 'desempleo', kicker: T('Trabajo', 'Labor'), corto: T('Desempleo', 'Unemployment'),
      titulo: T('El desempleo está en los niveles más bajos desde que hay registros', 'Unemployment is at its lowest levels on record'),
      bajada: T('Tasa de desocupación, en % de la población económicamente activa. Trimestres móviles, de ene–mar 2012 a jun–ago 2026.', 'Unemployment rate, % of the labor force. Rolling quarters, Jan–Mar 2012 to Jun–Aug 2026.'),
      fuente: () => T('<b>Fuente:</b> IBGE, PNAD Contínua (trimestres móviles). La serie empieza en 2012.', '<b>Source:</b> IBGE, PNAD Contínua (rolling quarters). The series starts in 2012.'),
      datos: () => ({
        archivo: T('desempleo', 'unemployment'), cols: T(['trimestre_movil', 'tasa_desocupacion_pct'], ['rolling_quarter', 'unemployment_rate_pct']),
        filas: S.desempleo.mq.map(o => [trimMovil(o.lbl), o.v]),
      }),
      render(box) {
        const mq = S.desempleo.mq;
        const max = mq.reduce((a, b) => (b.v > a.v ? b : a)), min = mq.reduce((a, b) => (b.v <= a.v ? b : a));
        const last = mq[mq.length - 1], first = mq[0];
        dibujarTiempo(box, {
          x: [2012, 2027], y: { min: 0, max: 18, ticks: [0, 4, 8, 12, 16], fmt: v => v + '%' },
          xfmt: String, m: { r: 175 },
          capas: [{
            tipo: 'linea', datos: mq.map(o => ({ t: o.t, v: o.v })), color: TERRA, grosor: 5.5,
            destacar: [
              { t: first.t, texto: `${fmt(first.v, 1)}%\n${trimMovil(first.lbl)}`, dy: -48, anchor: 'start', dx: -6 },
              { t: max.t, texto: `${fmt(max.v, 1)}%\n${trimMovil(max.lbl)}`, dy: -48 },
              { t: min.t, texto: `${fmt(min.v, 1)}%\n${trimMovil(min.lbl)}`, dy: 52, dx: -10, anchor: 'middle' },
              { t: last.t, texto: `${fmt(last.v, 1)}%\n${trimMovil(last.lbl)}`, dy: 4, anchor: 'start', dx: 20 },
            ],
          }],
          tips: mq.map(o => o.t),
          tip: t => { const o = mq.find(z => z.t === t); return { html: tipHTML(trimMovil(o.lbl), [{ nm: T('Desocupación', 'Unemployment'), val: fmt(o.v, 1) + '%', color: TERRA }]), puntos: [{ v: o.v, color: TERRA }] }; },
        });
      },
    },
    {
      id: 'empleo', kicker: T('Trabajo', 'Labor'), corto: T('Composición del empleo', 'Employment composition'),
      vistas: [
        { id: 'tipo', nm: T('Tipo de empleo', 'Type of job'), titulo: T('Tras caer entre 2014 y 2021, el empleo formal privado vuelve a ganar peso', 'After falling between 2014 and 2021, formal private employment is gaining ground again'),
          bajada: T('Composición de la población ocupada según posición en la ocupación, en %. Promedios anuales 2012–2025 y jun–ago 2026.', 'Employed population by status in employment, %. Annual averages 2012–2025 and Jun–Aug 2026.') },
        { id: 'sector', nm: T('Sector', 'Sector'), titulo: T('Los servicios vienen ganando peso en el empleo, a expensas del agro y la industria', 'Services keep gaining ground in employment, at the expense of agriculture and industry'),
          bajada: T('Población ocupada según sector de actividad, en %. Promedios anuales 2012–2025 y jun–ago 2026.', 'Employed population by sector, %. Annual averages 2012–2025 and Jun–Aug 2026.') },
        { id: 'informalidad', nm: T('Informalidad', 'Informality'), titulo: T('La informalidad viene bajando, pero lentamente', 'Informality is falling, but slowly'),
          bajada: T('Tasa de informalidad, en % de los ocupados. Promedios anuales 2016–2025 y jun–ago 2026.', 'Informality rate, % of the employed. Annual averages 2016–2025 and Jun–Aug 2026.') },
      ],
      fuente: v => v === 'informalidad'
        ? T('<b>Fuente:</b> IBGE, PNAD Contínua. Informales: asalariados y domésticos sin libreta, cuentapropistas y empleadores sin CNPJ y auxiliares familiares. La serie empieza en 2016.',
          '<b>Source:</b> IBGE, PNAD Contínua. Informal workers: employees and domestic workers without a signed work card, own-account workers and employers without a business registration (CNPJ), and contributing family workers. The series starts in 2016.')
        : v === 'sector'
          ? T('<b>Fuente:</b> IBGE, PNAD Contínua. Servicios incluye comercio, transporte, alojamiento y comida, servicios empresariales y financieros, administración pública, educación, salud y servicio doméstico.',
            '<b>Source:</b> IBGE, PNAD Contínua. Services include retail and wholesale, transport, accommodation and food, business and financial services, public administration, education, health and domestic work.')
          : T('<b>Fuente:</b> IBGE, PNAD Contínua. Formal = con libreta de trabajo firmada (carteira assinada). Sector público incluye militares y estatutarios.',
            '<b>Source:</b> IBGE, PNAD Contínua. Formal = with a signed work card (carteira assinada). Public sector includes military and statutory civil servants.'),
      datos: v => {
        if (v === 'informalidad') return {
          archivo: T('informalidad', 'informality'), cols: T(['periodo', 'tasa_informalidad_pct'], ['period', 'informality_rate_pct']),
          filas: S.informalidad.map(o => [etiquetaPeriodo(o.lbl), o.v]),
        };
        const src = v === 'sector' ? S.sectores : S.composicion;
        const cols = [T('periodo', 'period'), ...src.claves.map(c => cat(c) + ' (%)'), T('ocupados_miles', 'employed_thousands')];
        if (v === 'sector') cols.splice(cols.length - 1, 0, ...S.sectores.detalle_claves.map(c => T('servicios: ', 'services: ') + cat(c) + ' (%)'));
        return {
          archivo: v === 'sector' ? T('empleo-por-sector', 'employment-by-sector') : T('empleo-por-tipo', 'employment-by-type'), cols,
          filas: src.datos.map((o, i) => [etiquetaPeriodo(o.lbl), ...o.vals, ...(v === 'sector' ? S.sectores.detalle[i] : []), o.tot]),
        };
      },
      render(box, vista) {
        if (vista === 'informalidad') {
          const inf = S.informalidad;
          const d = inf.map(o => ({ t: o.lbl.includes('jun') ? 2026.54 : o.a + 0.5, v: o.v, p: o.lbl.includes('jun') }));
          const max = d.filter(z => !z.p).reduce((a, b) => (b.v > a.v ? b : a));
          dibujarTiempo(box, {
            x: [2016, 2027], y: { min: 30, max: 45, ticks: [30, 35, 40, 45], fmt: v => v + '%' }, xfmt: String,
            capas: [{
              tipo: 'linea', datos: d, color: '#6B3D8B', grosor: 5.5, marcadores: 7,
              destacar: [{ t: d[0].t, dy: -26 }, { t: max.t, dy: -26 }, { t: d[d.length - 1].t, texto: `${fmt(d[d.length - 1].v, 1)}%\n${JUN_AGO}`, dy: 50 }],
              fmtValor: v => fmt(v, 1) + '%',
            }],
            tips: d.map(z => z.t),
            tip: t => { const o = d.find(z => z.t === t), lb = etiquetaPeriodo(inf[d.indexOf(o)].lbl); return { html: tipHTML(lb, [{ nm: T('Informalidad', 'Informality'), val: fmt(o.v, 1) + '%', color: '#6B3D8B' }]), puntos: [{ v: o.v, color: '#6B3D8B' }] }; },
          });
          return;
        }
        const src = vista === 'sector' ? S.sectores : S.composicion;
        const sect = vista === 'sector';
        const cols = sect ? ['#2D6A3D', AZUL, '#8A5A35', '#2C8484'] : [AZUL, '#1F8AC0', '#2C8484', '#B5639E', '#E07A23', '#C9A227'];
        // en "tipo de empleo" las bandas que no son el asalariado formal van atenuadas (el texto conserva el color pleno)
        const suave = ['#234B85', '#A9CBE3', '#A8CCCC', '#DDBCD4', '#F2C9A4', '#E8D9A6'];
        const claves = src.claves.map((nm, k) => ({ nm: cat(nm), color: sect ? cols[k] : suave[k], colorTxt: cols[k] }));
        const mill = (pct, tot) => (pct * tot / 100000).toLocaleString(LOC(), { maximumFractionDigits: 1 });
        // en "tipo de empleo" el protagonista es el asalariado formal privado: valores clave adentro de su banda
        const D = src.datos, fx = t => D.find(z => z.t === t);
        const notas = sect ? [] : [2014.5, 2021.5, D[D.length - 1].t].map(t => fx(t)).filter(Boolean).map((o, i) => ({
          t: o.t, v: o.vals[0] / 2, texto: fmt(o.vals[0], 1) + '%', color: '#FFFFFF', halo: false, size: 24, peso: 700,
          anchor: i === 2 ? 'end' : 'middle', dx: i === 2 ? -8 : 0,
        }));
        dibujarTiempo(box, {
          x: [2012, 2027], y: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], fmt: v => v + '%' }, xfmt: String,
          m: { r: 470 },
          capas: [{ tipo: 'area100', datos: D.map(o => ({ t: o.t, vals: o.vals })), claves, izq: sect }],
          notas,
          tips: D.map(o => o.t),
          tip: t => {
            const i = D.findIndex(z => z.t === t), o = D[i];
            let filas = claves.map((c, k) => ({ nm: c.nm, val: `${fmt(o.vals[k], 1)}% · ${mill(o.vals[k], o.tot)} M`, color: c.color })).reverse();
            if (sect) filas = filas.concat(S.sectores.detalle_claves.map((nm, k) => ({ nm: '&nbsp;&nbsp;&nbsp;' + cat(nm), val: fmt(S.sectores.detalle[i][k], 1) + '%' })));
            return { html: tipHTML(etiquetaPeriodo(o.lbl), filas, T(`${(o.tot / 1000).toLocaleString(LOC(), { maximumFractionDigits: 1 })} millones de ocupados`, `${(o.tot / 1000).toLocaleString(LOC(), { maximumFractionDigits: 1 })} million employed`)), y: 20 };
          },
        });
      },
    },
    {
      id: 'pobreza', kicker: T('Sociedad', 'Society'), corto: T('Pobreza', 'Poverty'),
      titulo: T('La pobreza bajó a mínimos históricos', 'Poverty has fallen to record lows'),
      bajada: T('Población por debajo de las líneas de pobreza (US$ 6,85 por día) y de pobreza extrema (US$ 2,15 por día), a paridad de poder adquisitivo de 2017, en %. 2012–2024.',
        'Population below the poverty line (US$6.85 a day) and the extreme poverty line (US$2.15 a day), 2017 purchasing power parity, %. 2012–2024.'),
      fuente: () => T('<b>Fuente:</b> IBGE, Síntesis de Indicadores Sociales 2025 (PNAD Contínua, líneas del Banco Mundial). El dato de 2025 se publica en diciembre de 2026.',
        '<b>Source:</b> IBGE, Synthesis of Social Indicators 2025 (PNAD Contínua, World Bank lines). The 2025 figure will be published in December 2026.'),
      datos: () => ({
        archivo: T('pobreza', 'poverty'), cols: T(['anio', 'pobreza_pct', 'pobreza_extrema_pct'], ['year', 'poverty_pct', 'extreme_poverty_pct']),
        filas: S.pobreza.map(o => [o.a, o.pob, o.ext]),
      }),
      render(box) {
        const P = S.pobreza, POB = '#7A2A3F', EXT = '#E07A23';
        const pk = P.reduce((a, b) => (b.pob > a.pob ? b : a));
        dibujarTiempo(box, {
          x: [2012, 2025], y: { min: 0, max: 40, ticks: [0, 10, 20, 30, 40], fmt: v => v + '%' }, xfmt: String, m: { r: 250 },
          capas: [
            { tipo: 'linea', datos: P.map(o => ({ t: o.a + .5, v: o.pob })), color: POB, grosor: 5.5, marcadores: 7, nombre: T('Pobreza', 'Poverty'),
              destacar: [{ t: 2012.5, dy: -26 }, { t: pk.a + .5, dy: -26 }, { t: P[P.length - 1].a + .5, dy: -26 }], fmtValor: v => fmt(v, 1) + '%' },
            { tipo: 'linea', datos: P.map(o => ({ t: o.a + .5, v: o.ext })), color: EXT, grosor: 5.5, marcadores: 7, nombre: T('Pobreza\nextrema', 'Extreme\npoverty'), delay: 200,
              destacar: [{ t: 2012.5, dy: -26 }, { t: 2021.5, dy: -26 }, { t: P[P.length - 1].a + .5, dy: -26 }], fmtValor: v => fmt(v, 1) + '%' },
          ],
          tips: P.map(o => o.a + .5),
          tip: t => { const o = P.find(z => z.a + .5 === t); return { html: tipHTML(String(o.a), [{ nm: T('Pobreza', 'Poverty'), val: fmt(o.pob, 1) + '%', color: POB }, { nm: T('Pobreza extrema', 'Extreme poverty'), val: fmt(o.ext, 1) + '%', color: EXT }]), puntos: [{ v: o.pob, color: POB }, { v: o.ext, color: EXT }] }; },
        });
      },
    },
    {
      id: 'ingreso', kicker: T('Trabajo', 'Labor'), corto: T('Salario real', 'Real wages'),
      titulo: T('El ingreso real del trabajo está en máximos históricos', 'Real labor income is at record highs'),
      bajada: T('Ingreso medio real habitual del trabajo principal, en reales de jun–ago 2026. Promedios anuales 2012–2025 y último trimestre móvil (jun–ago 2026).',
        'Average real usual income from the main job, in Jun–Aug 2026 reais. Annual averages 2012–2025 and latest rolling quarter (Jun–Aug 2026).'),
      fuente: () => T('<b>Fuente:</b> IBGE, PNAD Contínua (deflactado por el IBGE). El salto de 2020 es un efecto composición: la pandemia dejó sin trabajo primero a los de menores ingresos.',
        '<b>Source:</b> IBGE, PNAD Contínua (deflated by IBGE). The 2020 jump is a composition effect: the pandemic pushed lower-income workers out of work first.'),
      datos: () => ({
        archivo: T('ingreso-real', 'real-income'), cols: T(['periodo', 'ingreso_real_reales_jun_ago_2026'], ['period', 'real_income_reais_jun_aug_2026']),
        filas: S.ingreso.anual.map(o => [o.a, o.v]).concat([[JUN_AGO, S.ingreso.ult.v]]),
      }),
      render(box) {
        const A = S.ingreso.anual, u = S.ingreso.ult, COL = '#2D6A3D';
        const d = A.map(o => ({ t: o.a + .5, v: o.v })).concat([{ t: 2026.54, v: u.v, p: true }]);
        const R = v => 'R$ ' + num(v);
        dibujarTiempo(box, {
          x: [2012, 2027], y: { min: 2800, max: 3800, ticks: [2800, 3000, 3200, 3400, 3600, 3800], fmt: R }, xfmt: String, m: { l: 150 },
          capas: [{
            tipo: 'linea', datos: d, color: COL, grosor: 5.5, marcadores: 7, fmtValor: R,
            destacar: [{ t: 2012.5, dy: -26 }, { t: 2020.5, dy: -26 }, { t: 2022.5, dy: 48 }, { t: 2025.5, dy: 44, dx: 12, anchor: 'start' }, { t: 2026.54, texto: `${R(u.v)}\n${JUN_AGO}`, dy: -58 }],
          }],
          tips: d.map(z => z.t),
          tip: t => { const o = d.find(z => z.t === t); return { html: tipHTML(o.p ? JUN_AGO : String(Math.floor(t)), [{ nm: T('Ingreso real', 'Real income'), val: R(o.v), color: COL }], o.p ? T(`Un año antes: ${R(u.prev)}`, `A year earlier: ${R(u.prev)}`) : null), puntos: [{ v: o.v, color: COL }] }; },
        });
      },
    },
    {
      id: 'gini', kicker: T('Sociedad', 'Society'), corto: T('Desigualdad (Gini)', 'Inequality (Gini)'),
      titulo: T('La desigualdad tocó su mínimo en 2024 y repuntó en 2025', 'Inequality hit a low in 2024 and ticked up in 2025'),
      bajada: T('Coeficiente de Gini del ingreso domiciliario per cápita (0 = igualdad total; 1 = desigualdad máxima). 2012–2025.', 'Gini coefficient of household per capita income (0 = full equality; 1 = maximum inequality). 2012–2025.'),
      fuente: () => T('<b>Fuente:</b> IBGE, PNAD Contínua anual (ingresos de todas las fuentes). La serie empieza en 2012.', '<b>Source:</b> IBGE, annual PNAD Contínua (income from all sources). The series starts in 2012.'),
      datos: () => ({ archivo: 'gini', cols: T(['anio', 'gini'], ['year', 'gini']), filas: S.gini.map(o => [o.a, o.v]) }),
      render(box) {
        const G = S.gini, COL = '#6B3D8B';
        const g3 = v => fmt(v, 3);
        const mx = G.reduce((a, b) => (b.v > a.v ? b : a)), mn = G.reduce((a, b) => (b.v < a.v ? b : a));
        dibujarTiempo(box, {
          x: [2012, 2026], y: { min: 0.48, max: 0.56, ticks: [0.48, 0.50, 0.52, 0.54, 0.56], fmt: v => fmt(v, 2) }, xfmt: String,
          capas: [{
            tipo: 'linea', datos: G.map(o => ({ t: o.a + .5, v: o.v })), color: COL, grosor: 5.5, marcadores: 7, fmtValor: g3,
            destacar: [{ t: 2012.5, dy: -26 }, { t: mx.a + .5, dy: -26 }, { t: mn.a + .5, dy: 48 }, { t: G[G.length - 1].a + .5, dy: -26 }],
          }],
          tips: G.map(o => o.a + .5),
          tip: t => { const o = G.find(z => z.a + .5 === t); return { html: tipHTML(String(o.a), [{ nm: 'Gini', val: g3(o.v), color: COL }]), puntos: [{ v: o.v, color: COL }] }; },
        });
      },
    },
    {
      id: 'homicidios', kicker: T('Sociedad', 'Society'), corto: T('Homicidios', 'Homicides'),
      titulo: T('Los homicidios cayeron más de un tercio desde el pico de 2017', 'Homicides have fallen by more than a third since their 2017 peak'),
      bajada: T('Víctimas de homicidio cada 100.000 habitantes, según dos fuentes. 2010–2024 (Ministerio de Salud) y 2012–2025 (registros policiales).',
        'Homicide victims per 100,000 people, from two sources. 2010–2024 (Ministry of Health) and 2012–2025 (police records).'),
      fuente: () => T('<b>Fuente:</b> Atlas da Violência 2026 (IPEA y FBSP), con el Sistema de Información sobre Mortalidad del Ministerio de Salud. Muertes violentas intencionales: Anuario Brasileño de Seguridad Pública 2026 (FBSP).',
        '<b>Source:</b> Atlas da Violência 2026 (IPEA and FBSP), based on the Ministry of Health’s Mortality Information System. Intentional violent deaths: Brazilian Public Security Yearbook 2026 (FBSP).'),
      datos: () => ({
        archivo: T('homicidios', 'homicides'), cols: T(['anio', 'tasa_homicidios_sim', 'tasa_mvi_fbsp'], ['year', 'homicide_rate_sim', 'intentional_violent_deaths_rate_fbsp']),
        filas: S.homicidios.map(o => [o.a, o.sim, o.mvi]),
      }),
      render(box) {
        const H = S.homicidios;
        const SIMc = '#7A2A3F', MVIc = '#8A8579';
        const sim = H.filter(o => o.sim != null).map(o => ({ t: o.a + .5, v: o.sim }));
        const mvi = H.filter(o => o.mvi != null).map(o => ({ t: o.a + .5, v: o.mvi }));
        const pk = sim.reduce((a, b) => (b.v > a.v ? b : a));
        const capas = [{ tipo: 'linea', datos: sim, color: SIMc, grosor: 5.5, marcadores: 7, nombre: T('Homicidios\nMinisterio de Salud (SIM)', 'Homicides\nMinistry of Health (SIM)'), nombreT: 2019.2, nombreV: 14,
          destacar: [{ t: sim[0].t, dy: -26 }, { t: pk.t, dy: -26 }, { t: sim[sim.length - 1].t, dy: 46 }] }];
        if (mvi.length) capas.push({ tipo: 'linea', datos: mvi, color: MVIc, grosor: 4, marcadores: 6, punteada: true, nombre: T('Muertes violentas intencionales\nregistros policiales (FBSP)', 'Intentional violent deaths\npolice records (FBSP)'), nombreT: 2019.2, nombreV: 31, delay: 200,
          destacar: [{ t: mvi[mvi.length - 1].t, dy: -26 }] });
        dibujarTiempo(box, {
          x: [2010, 2026], y: { min: 0, max: 35, ticks: [0, 10, 20, 30], fmt: v => fmt(v, 0) }, xfmt: String, m: { r: 90 },
          capas,
          tips: anios(2010, 2025).map(y => y + .5),
          tip: t => {
            const y = Math.floor(t), o = H.find(z => z.a === y); if (!o) return null;
            const f = []; if (o.sim != null) f.push({ nm: T('Homicidios (SIM)', 'Homicides (SIM)'), val: fmt(o.sim, 1), color: SIMc }); if (o.mvi != null) f.push({ nm: T('MVI (FBSP)', 'Violent deaths (FBSP)'), val: fmt(o.mvi, 1), color: MVIc });
            return { html: tipHTML(String(y), f, T('cada 100.000 habitantes', 'per 100,000 people')), puntos: f.map((r, k) => ({ v: k === 0 && o.sim != null ? o.sim : o.mvi, color: r.color })) };
          },
        });
      },
    },
    {
      id: 'consumo', kicker: T('Economía', 'Economy'), corto: T('Consumo de los hogares', 'Household consumption'),
      vistas: [
        { id: 'var', nm: T('Variación anual', 'Annual change'), titulo: T('El consumo de los hogares se frenó en 2025 y 2026', 'Household consumption slowed in 2025 and 2026'),
          bajada: T('Variación anual del consumo real de los hogares, en %. 2010–2025 y primer semestre de 2026 (interanual).', 'Annual change in real household consumption, %. 2010–2025 and first half of 2026 (year on year).') },
        { id: 'nivel', nm: T('Nivel', 'Level'), titulo: T('El consumo de los hogares es casi 30% más alto que en 2010', 'Household consumption is almost 30% higher than in 2010'),
          bajada: T('Índice del consumo real de los hogares, 2010 = 100. 2010–2025.', 'Real household consumption index, 2010 = 100. 2010–2025.') },
      ],
      fuente: () => T(`<b>Fuente:</b> IBGE, Cuentas Nacionales Trimestrales. El Banco Central proyecta ${fmt(S.consumo.proy, 1)}% para todo 2026 (Informe de Política Monetaria, septiembre de 2026).`,
        `<b>Source:</b> IBGE, Quarterly National Accounts. The Central Bank forecasts ${fmt(S.consumo.proy, 1)}% for 2026 as a whole (Monetary Policy Report, September 2026).`),
      datos: () => ({
        archivo: T('consumo-hogares', 'household-consumption'), cols: T(['anio', 'variacion_real_pct', 'indice_2010_100'], ['year', 'real_change_pct', 'index_2010_100']),
        filas: S.consumo.obs.map(o => [o.a, o.v, o.idx]).concat([[T('1er semestre 2026', 'H1 2026'), S.consumo.parcial, null]]),
      }),
      render(box, vista) {
        const O = S.consumo.obs, COL = '#2C8484';
        if (vista === 'nivel') {
          const d = O.map(o => ({ t: o.a + .5, v: o.idx }));
          dibujarTiempo(box, {
            x: [2010, 2026], y: { min: 90, max: 135, ticks: [90, 100, 110, 120, 130], fmt: v => fmt(v, 0) }, xfmt: String,
            capas: [{ tipo: 'linea', datos: d, color: COL, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1),
              destacar: [{ t: 2010.5, dy: -26 }, { t: 2014.5, dy: -26 }, { t: 2016.5, dy: 48 }, { t: 2020.5, dy: 48 }, { t: 2025.5, dy: -26 }] }],
            tips: d.map(z => z.t),
            tip: t => { const o = d.find(z => z.t === t); return { html: tipHTML(String(Math.floor(t)), [{ nm: T('Índice (2010 = 100)', 'Index (2010 = 100)'), val: fmt(o.v, 1), color: COL }]), puntos: [{ v: o.v, color: COL }] }; },
          });
          return;
        }
        const d = O.map(o => ({ t: o.a, v: o.v }));
        d.push({ t: 2026, v: S.consumo.parcial, tipo: 'parcial', etiqueta: T('1er sem.', 'H1') });
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -6, max: 8, ticks: [-6, -4, -2, 0, 2, 4, 6, 8], fmt: v => fmt(v, 0) + '%' }, xfmt: String,
          capas: [{ tipo: 'barras', datos: d, color: COL, colorNeg: TERRA }],
          tips: anios(2010, 2026).map(y => y + .5),
          tip: t => { const y = Math.floor(t), o = d.find(z => z.t === y); return o ? { html: tipHTML(y === 2026 ? T('1er semestre 2026', 'First half of 2026') : String(y), [{ nm: T('Consumo de los hogares', 'Household consumption'), val: fmtSigno(o.v, 1) + '%', color: o.v < 0 ? TERRA : COL }], y === 2026 ? T('vs 1er semestre de 2025', 'vs first half of 2025') : null) } : null; },
        });
      },
    },
    {
      id: 'fiscal', kicker: T('Economía', 'Economy'), corto: T('Resultado fiscal', 'Fiscal balance'),
      titulo: T('Con los intereses de la deuda, el déficit fiscal llega al 9,5% del PIB', 'Including interest on the debt, the fiscal deficit reaches 9.5% of GDP'),
      bajada: T('Resultado del sector público consolidado, en % del PIB (negativo = déficit). 2010–2025 y 12 meses a agosto de 2026.', 'Consolidated public sector balance, % of GDP (negative = deficit). 2010–2025 and 12 months to August 2026.'),
      fuente: () => T('<b>Fuente:</b> Banco Central do Brasil (necesidades de financiamiento del sector público consolidado). El resultado financiero (nominal) incluye los intereses de la deuda.',
        '<b>Source:</b> Banco Central do Brasil (consolidated public sector borrowing requirements). The overall (nominal) balance includes interest on the debt.'),
      datos: () => ({
        archivo: T('resultado-fiscal', 'fiscal-balance'), cols: T(['periodo', 'primario_pct_pib', 'intereses_pct_pib', 'financiero_pct_pib'], ['period', 'primary_pct_gdp', 'interest_pct_gdp', 'overall_pct_gdp']),
        filas: S.fiscal.map(o => [o.p ? T('12 meses a ago-2026', '12 months to Aug 2026') : o.a, o.prim, o.int, o.nom]),
      }),
      render(box) {
        const F = S.fiscal, PR = AZUL, NO = TERRA;
        const tt = o => (o.p ? 2026.55 : o.a + .5);
        const prim = F.map(o => ({ t: tt(o), v: o.prim, p: o.p })), nom = F.map(o => ({ t: tt(o), v: o.nom, p: o.p }));
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -15, max: 5, ticks: [-15, -10, -5, 0, 5], fmt: v => fmt(v, 0) + '%' }, xfmt: String, m: { r: 230 },
          capas: [
            { tipo: 'linea', datos: prim, color: PR, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1), nombre: T('Primario', 'Primary'), nombreDy: -6,
              destacar: [{ t: 2010.5, dy: -26 }, { t: 2020.5, dy: 46, dx: -6 }, { t: 2022.5, dy: -26 }, { t: 2026.55, dy: -26 }] },
            { tipo: 'linea', datos: nom, color: NO, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1), nombre: T('Financiero\n(con intereses)', 'Overall\n(incl. interest)'), delay: 200,
              destacar: [{ t: 2010.5, dy: 46 }, { t: 2015.5, dy: 46 }, { t: 2020.5, dy: 46 }, { t: 2026.55, dy: 50, anchor: 'end', dx: 12 }] },
          ],
          notas: [
            { t: 2010, v: 0, dx: 8, dy: -14, texto: T('Superávit ↑', 'Surplus ↑'), color: C.muted, size: 19 },
            { t: 2010, v: 0, dx: 8, dy: 30, texto: T('Déficit ↓', 'Deficit ↓'), color: C.muted, size: 19 },
          ],
          tips: F.map(tt),
          tip: t => { const o = F.find(z => tt(z) === t); return { html: tipHTML(o.p ? T('12 meses a agosto 2026', '12 months to August 2026') : String(o.a), [{ nm: T('Primario', 'Primary'), val: fmtSigno(o.prim, 1) + '%', color: PR }, { nm: T('Intereses', 'Interest'), val: fmt(o.int, 1) + '%' }, { nm: T('Financiero', 'Overall'), val: fmtSigno(o.nom, 1) + '%', color: NO }], T('en % del PIB', '% of GDP')), puntos: [{ v: o.prim, color: PR }, { v: o.nom, color: NO }] }; },
        });
      },
    },
    {
      id: 'comercio', kicker: T('Brasil y Argentina', 'Brazil and Argentina'), corto: T('Comercio con Argentina', 'Trade with Argentina'),
      titulo: T('Argentina, tercer socio comercial de Brasil, pesa la mitad que en 2010', 'Argentina, Brazil’s third-largest trading partner, weighs half as much as in 2010'),
      bajada: T('Comercio de bienes de Brasil con Argentina, en miles de millones de US$ (izquierda), y peso de Argentina en el comercio total de Brasil, en % (derecha). 2010–2025 y últimos 12 meses.',
        'Brazil’s goods trade with Argentina, US$ billions (left), and Argentina’s share of Brazil’s total trade, % (right). 2010–2025 and last 12 months.'),
      fuente: () => T('<b>Fuente:</b> Secex/MDIC, Comex Stat (valores FOB). *Últimos 12 meses con dato: septiembre de 2025 a agosto de 2026. China y Estados Unidos son el 1° y el 2° socio comercial de Brasil.',
        '<b>Source:</b> Secex/MDIC, Comex Stat (FOB values). *Last 12 months with data: September 2025 to August 2026. China and the United States are Brazil’s first and second trading partners.'),
      datos: () => ({
        archivo: T('comercio-argentina', 'trade-argentina'),
        cols: T(['periodo', 'exportaciones_a_argentina_musd', 'importaciones_desde_argentina_musd', 'participacion_argentina_comercio_total_pct', 'participacion_exportaciones_pct', 'participacion_importaciones_pct'],
          ['period', 'exports_to_argentina_usd_m', 'imports_from_argentina_usd_m', 'argentina_share_total_trade_pct', 'share_of_exports_pct', 'share_of_imports_pct']),
        filas: S.comercio.map(o => [o.p ? T('12 meses a ago-2026', '12 months to Aug 2026') : o.a, Math.round(o.exp * 1000), Math.round(o.imp * 1000), o.sh_tot, o.sh_exp, o.sh_imp]),
      }),
      render(box) {
        const TT = S.comercio;
        box.innerHTML = '<div style="position:absolute;inset:0;display:grid;grid-template-columns:1.45fr 1fr;gap:56px"><div class="c-izq" style="position:relative"></div><div class="c-der" style="position:relative"></div></div>';
        const izq = box.querySelector('.c-izq'), der = box.querySelector('.c-der');
        const EXP = AZUL, IMP = '#6CB04D';
        const full = TT.filter(o => !o.p), ytd = TT.find(o => o.p);
        const mx = Math.max(...TT.map(o => o.exp + o.imp));
        const ymax = Math.ceil(mx / 10) * 10;
        const barrasE = full.map(o => ({ t: o.a, v: o.exp + o.imp, color: IMP })), barrasX = full.map(o => ({ t: o.a, v: o.exp, color: EXP }));
        if (ytd) { barrasE.push({ t: ytd.a, v: ytd.exp + ytd.imp, tipo: 'parcial', color: IMP }); barrasX.push({ t: ytd.a, v: ytd.exp, tipo: 'parcial', color: EXP }); }
        const lbl = o => (o.p ? T('12 meses a agosto de 2026', '12 months to August 2026') : String(o.a));
        const usd = v => T('US$ ' + fmt(v, 1) + ' mil M', 'US$' + fmt(v, 1) + ' bn');
        dibujarTiempo(izq, {
          x: [2010, 2027], y: { min: 0, max: ymax, ticks: anios(0, ymax / 10).map(k => k * 10), fmt: v => fmt(v, 0) }, xfmt: y => (y === 2026 ? '12 m*' : xfmtCorto(y)),
          m: { l: 70, r: 20 },
          capas: [
            { tipo: 'barras', datos: barrasE, color: IMP, valores: false, ancho: .74 },
            { tipo: 'barras', datos: barrasX, color: EXP, valores: false, ancho: .74 },
            { tipo: 'barras', datos: barrasE.map(b => ({ ...b, color: null, tipo: null })), color: 'rgba(0,0,0,0)', ancho: .74, tamValor: 19, colorValor: C.soft, fmtValor: v => fmt(v, 0) },
          ],
          notas: [
            { t: 2021.2, v: ymax * 0.93, texto: T('■ Exportaciones de Brasil', '■ Brazilian exports'), color: EXP, size: 22, peso: 700 },
            { t: 2021.2, v: ymax * 0.84, texto: T('■ Importaciones desde Argentina', '■ Imports from Argentina'), color: '#4E8A34', size: 22, peso: 700 },
          ],
          tips: TT.map(o => o.a + .5),
          tip: t => { const o = TT.find(z => z.a + .5 === t); return { html: tipHTML(lbl(o), [{ nm: T('Exportaciones', 'Exports'), val: usd(o.exp), color: EXP }, { nm: T('Importaciones', 'Imports'), val: usd(o.imp), color: IMP }, { nm: 'Total', val: usd(o.exp + o.imp) }], T(`Saldo para Brasil: US$ ${fmtSigno(o.exp - o.imp, 1)} mil M`, `Brazil’s balance: US$${fmtSigno(o.exp - o.imp, 1)} bn`)) }; },
        });
        const SH = TERRA;
        const sh = TT.map(o => ({ t: o.p ? 2026.5 : o.a + .5, v: o.sh_tot, p: o.p }));
        const smax = Math.ceil(Math.max(...sh.map(z => z.v)) / 2) * 2 + 1;
        const pk = sh.filter(z => !z.p).reduce((a, b) => (b.v > a.v ? b : a));
        dibujarTiempo(der, {
          x: [2010, 2027], y: { min: 0, max: smax, ticks: anios(0, Math.floor(smax / 2)).map(k => k * 2), fmt: v => v + '%' }, xfmt: y => (y % 4 === 2 ? String(y) : y === 2026 ? '12 m*' : null),
          m: { l: 70, r: 150 }, gob: true,
          capas: [{ tipo: 'linea', datos: sh, color: SH, grosor: 5.5, marcadores: 6, fmtValor: v => fmt(v, 1) + '%',
            destacar: [{ t: sh[0].t, dy: -26, anchor: 'start', dx: -8 }, ...(pk.t !== sh[0].t ? [{ t: pk.t, dy: -26 }] : []), { t: sh[sh.length - 1].t, texto: `${fmt(sh[sh.length - 1].v, 1)}%\n${T('últimos 12 m', 'last 12 m')}`, dy: 6, anchor: 'start', dx: 18 }] }],
          tips: sh.map(z => z.t),
          tip: t => { const i = sh.findIndex(z => z.t === t), o = TT[i]; return { html: tipHTML(lbl(o), [{ nm: T('Del comercio total', 'Of total trade'), val: fmt(o.sh_tot, 1) + '%', color: SH }, { nm: T('De las exportaciones', 'Of exports'), val: fmt(o.sh_exp, 1) + '%' }, { nm: T('De las importaciones', 'Of imports'), val: fmt(o.sh_imp, 1) + '%' }], o.rank ? T(`Argentina: ${o.rank}° socio comercial de Brasil`, `Argentina: Brazil’s No. ${o.rank} trading partner`) : null), puntos: [{ v: o.sh_tot, color: SH }] }; },
        });
      },
    },
    {
      id: 'encuestas', kicker: T('Elecciones', 'Elections'), corto: T('Encuestas', 'Polls'),
      vistas: [
        { id: 'ambas', nm: T('Ambas vueltas', 'Both rounds'), titulo: () => tituloPanel(), bajada: () => bajadaPanel() },
        { id: '1v', nm: T('1ª vuelta', '1st round'), titulo: () => tituloEncuestas('1v'), bajada: () => bajadaEncuestas('1v') },
        { id: '2v', nm: T('2ª vuelta', '2nd round'), titulo: () => tituloEncuestas('2v'), bajada: () => bajadaEncuestas('2v') },
      ],
      fuente: v => {
        const E = window.ENCUESTAS; if (!E) return '';
        const vs = v === 'ambas' ? ['1v', '2v'] : [v];
        const encs = [...new Set(vs.flatMap(k => E[k].encuestadoras))].sort();
        const n = vs.map(k => E[k].n_encuestas);
        const cuantas = v === 'ambas' ? T(`${n[0]} y ${n[1]} encuestas`, `${n[0]} and ${n[1]} polls`) : T(`${n[0]} encuestas`, `${n[0]} polls`);
        return T(`<b>Fuente:</b> ${encs.join(', ')} (${cuantas}). Cada punto es una encuesta; la línea es el promedio ponderado por cercanía en el tiempo y tamaño de muestra, donde las encuestadoras que publican más seguido pesan menos.`,
          `<b>Source:</b> ${encs.join(', ')} (${cuantas}). Each dot is a poll; the line is an average weighted by recency and sample size, in which pollsters that publish more often weigh less.`) +
          (v !== '2v' ? T(' Hasta marzo, algunos escenarios de primera vuelta incluían candidatos que finalmente no se presentaron.', ' Until March, some first-round scenarios included candidates who ultimately did not run.') : '');
      },
      datos: v => {
        const vs = v === 'ambas' ? ['1v', '2v'] : [v];
        const todos = [...new Set(vs.flatMap(k => window.ENCUESTAS[k].cands.map(c => c.c)))];
        const cols = [...(v === 'ambas' ? [T('vuelta', 'round')] : []), T('tipo', 'type'), T('encuestadora', 'pollster'), T('trabajo_de_campo', 'fieldwork'), T('fecha_media_del_campo', 'fieldwork_midpoint'), T('muestra', 'sample_size'), ...todos.map(c => c + '_pct')];
        const dia = t => { const y = Math.floor(t), d = new Date(Date.UTC(y, 0, 1) + Math.round((t - y) * 365.25) * 864e5); return d.toISOString().slice(0, 10); };
        const filas = [];
        vs.forEach(k => {
          const E = window.ENCUESTAS[k], pre = v === 'ambas' ? [k === '1v' ? T('primera', 'first') : T('balotaje', 'runoff')] : [];
          E.encuestas.forEach(p => filas.push([...pre, T('encuesta', 'poll'), p.enc, p.campo, dia(p.t), p.n, ...todos.map(c => (p[c] != null ? p[c] : null))]));
          const base = E.agregado[E.cands[0].c];
          base.forEach((pt, i) => filas.push([...pre, T('promedio', 'average'), '', '', pt.f, '', ...todos.map(c => (E.agregado[c] && E.agregado[c][i] ? E.agregado[c][i].v : null))]));
        });
        const arch = { ambas: T('encuestas-ambas-vueltas', 'polls-both-rounds'), '1v': T('encuestas-primera-vuelta', 'polls-first-round'), '2v': T('encuestas-balotaje', 'polls-runoff') };
        return { archivo: arch[v], cols, filas };
      },
      render(box, vista) {
        if (!window.ENCUESTAS) { box.innerHTML = `<div class="aviso">${T('Datos de encuestas pendientes.', 'Poll data pending.')}</div>`; return; }
        if (vista !== 'ambas') { graficoEncuesta(box, vista, false); return; }
        // panel: primera vuelta a la izquierda, balotaje a la derecha, con un solo título
        box.innerHTML = '<div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:64px">' +
          `<div style="position:relative;display:flex;flex-direction:column"><div class="sub-panel">${T('Primera vuelta', 'First round')}</div><div class="c-1v" style="position:relative;flex:1"></div></div>` +
          `<div style="position:relative;display:flex;flex-direction:column"><div class="sub-panel">${T('Balotaje entre los dos', 'Runoff between the two')}</div><div class="c-2v" style="position:relative;flex:1"></div></div></div>`;
        const maxTodo = Math.max(...['1v', '2v'].flatMap(k => window.ENCUESTAS[k].encuestas.flatMap(p => [p.lula, p.flavio])).filter(v => v != null));
        const yComun = Math.ceil((maxTodo + 2) / 5) * 5;
        graficoEncuesta(box.querySelector('.c-1v'), '1v', true, yComun);
        graficoEncuesta(box.querySelector('.c-2v'), '2v', true, yComun);
      },
    },
    { id: 'mapa', kicker: T('Elecciones', 'Elections'), corto: T('Mapa de resultados', 'Results map'), mapa: true },
    {
      // solo en la copia local (streaming): en la web no hay escrutinio en vivo
      id: 'proyeccion', kicker: T('Elecciones · proyección en vivo', 'Elections · live projection'), corto: T('Proyección en vivo', 'Live projection'), vivo: true,
      vistas: [
        { id: '1', nm: T('1ª vuelta', '1st round'), titulo: () => tituloProy('1'), bajada: () => bajadaProy('1') },
        { id: '2', nm: T('2ª vuelta', '2nd round'), titulo: () => tituloProy('2'), bajada: () => bajadaProy('2') },
      ],
      fuente: () => T('<b>Fuente:</b> TSE (escrutinio en vivo) y resultados por municipio de 2022. Proyección propia: el cambio de voto respecto de 2022 en los municipios que faltan se estima con el de municipios parecidos y cercanos ya contados. El margen (±) es el error que tuvo el método en 9 de cada 10 simulaciones del escrutinio de 2022 proyectado desde 2018.',
        '<b>Source:</b> TSE (live count) and 2022 results by municipality. Own projection: the change in the vote since 2022 in the municipalities still missing is estimated from similar, nearby municipalities already counted. The margin (±) is the error this method had in 9 out of 10 simulations of the 2022 count projected from 2018.'),
      datos: v => {
        const D = vivoDe(v), H = (D && D.proy && D.proy.hist) || [];
        const cs = D ? D.cands : [];
        const cols = [T('secciones_escrutadas_pct', 'polling_stations_counted_pct'), ...cs.flatMap(c => [`${c.nm}_${T('proyeccion', 'projection')}`, `${c.nm}_${T('margen', 'margin')}`, `${c.nm}_${T('conteo', 'count')}`])];
        return { archivo: T(`proyeccion-2026-${v}v`, `projection-2026-${v}`), cols, filas: H.map(h => [h.pct, ...cs.flatMap((c, i) => [h.p[i], h.b[i], h.c[i]])]) };
      },
      render(box, vista) { placaProyeccion(box, vista); },
    },
    {
      id: 'sociedad', kicker: T('Elecciones', 'Elections'), corto: T('Quién votó a quién', 'Who voted for whom'),
      vistas: [
        { id: 'ingreso', nm: T('Ingreso', 'Income'), titulo: () => tituloSocio('ingreso'), bajada: () => bajadaSocio('ingreso') },
        { id: 'bf', nm: T('Bolsa Família', 'Bolsa Família'), titulo: () => tituloSocio('bf'), bajada: () => bajadaSocio('bf') },
        { id: 'raza', nm: T('Raza', 'Race'), titulo: () => tituloSocio('raza'), bajada: () => bajadaSocio('raza') },
        { id: 'religion', nm: T('Religión', 'Religion'), titulo: () => tituloSocio('religion'), bajada: () => bajadaSocio('religion') },
        { id: 'vivo', nm: T('En vivo 2026', 'Live 2026'), vivo: true, turno: turnoHoy,
          titulo: () => T('En vivo: dónde gana y dónde pierde votos Lula respecto de 2022', 'Live: where Lula is gaining and losing votes compared with 2022'),
          bajada: () => { const D = vivoDe(turnoHoy()); return T(`Cambio en el % de Lula respecto de la misma vuelta de 2022, en los mismos diez grupos de municipios de cada indicador (solo los municipios que ya informaron)${D ? `. Con ${fmt(D.nac.pct || 0, 1)}% de las secciones escrutadas` : ''}.`, `Change in Lula's % from the same round in 2022, in the same ten groups of municipalities for each indicator (only municipalities already reporting)${D ? `. With ${fmt(D.nac.pct || 0, 1)}% of polling stations counted` : ''}.`); } },
      ],
      fuente: v => (v === 'vivo'
        ? T('<b>Fuente:</b> TSE (escrutinio en vivo y resultados 2022 por municipio); IBGE, Censo 2022; Portal da Transparência. Grupos de municipios con la misma cantidad de votos en 2022. Rojo: Lula sube; azul: baja.', '<b>Source:</b> TSE (live count and 2022 results by municipality); IBGE, 2022 Census; Portal da Transparência. Groups of municipalities with the same number of votes in 2022. Red: Lula up; blue: down.')
        : T(`<b>Fuente:</b> TSE (balotaje 2022 por municipio); IBGE, Censo 2022 (ingreso, raza, religión, hogares); Portal da Transparência (familias con Auxílio Brasil, octubre de 2022${v === 'bf' ? '; en unos pocos municipios superan los 100 cada 100 hogares, porque para el programa una familia no es lo mismo que un hogar del censo' : ''}). Son municipios, no personas: muestra dónde se votó qué, no quién votó qué.`,
          `<b>Source:</b> TSE (2022 runoff by municipality); IBGE, 2022 Census (income, race, religion, households); Portal da Transparência (families on Auxílio Brasil, October 2022${v === 'bf' ? '; in a few municipalities they exceed 100 per 100 households, since a program family is not the same as a census household' : ''}). These are municipalities, not people: it shows where people voted what, not who voted what.`)),
      datos: v => {
        if (v === 'vivo') return { archivo: T('quien-voto-a-quien-en-vivo', 'who-voted-for-whom-live'), cols: [T('indicador', 'indicator'), T('grupo', 'group'), T('cambio_lula_pts', 'lula_change_pts')], filas: [] };
        const I = IND_SOCIO[v], j = I.i; gruposSocio(v);
        const nm = ib => (window.MUN_NOMES || {})[ib] || [ib, ''];
        return {
          archivo: T(`quien-voto-a-quien-${v}`, `who-voted-for-whom-${v}`),
          cols: [T('codigo_ibge', 'ibge_code'), T('municipio', 'municipality'), 'uf', I.eje, T('grupo_1_a_10', 'group_1_to_10'), T('votos_validos_balotaje_2022', 'valid_votes_2022_runoff'), 'lula_pct', 'bolsonaro_pct'],
          filas: filasSocio().filter(f => f.x[j] != null).map(f => [f.ib, nm(f.ib)[0], nm(f.ib)[1], f.x[j], f.grupo[v], f.val, Math.round(10000 * f.lula / f.val) / 100, Math.round(10000 * f.bolso / f.val) / 100]),
        };
      },
      render(box, vista) { if (vista === 'vivo') placaSocioVivo(box); else placaSocio(box, vista); },
    },
    {
      // solo en la copia local (streaming): análisis en vivo del cambio respecto de 2022
      id: 'swing', kicker: T('Elecciones · en vivo', 'Elections · live'), corto: T('Dónde se mueve el voto', 'Where the vote is moving'), vivo: true,
      vistas: [
        { id: '1', nm: T('1ª vuelta', '1st round'), titulo: () => tituloSwing('1'), bajada: () => bajadaSwing('1') },
        { id: '2', nm: T('2ª vuelta', '2nd round'), titulo: () => tituloSwing('2'), bajada: () => bajadaSwing('2') },
      ],
      fuente: () => T('<b>Fuente:</b> TSE (escrutinio en vivo y resultados 2022 por municipio); IBGE, Censo 2022; Portal da Transparência. Solo municipios con al menos 20% de las urnas contadas; los resultados parciales de un municipio pueden no ser representativos de todo el municipio.',
        '<b>Source:</b> TSE (live count and 2022 results by municipality); IBGE, 2022 Census; Portal da Transparência. Only municipalities with at least 20% of ballot boxes counted; partial results may not represent the whole municipality.'),
      datos: v => {
        const S = datosSwing(v), nm = ib => (window.MUN_NOMES || {})[ib] || [ib, ''];
        return {
          archivo: T(`donde-se-mueve-el-voto-${v}v`, `where-the-vote-moves-${v}`),
          cols: [T('codigo_ibge', 'ibge_code'), T('municipio', 'municipality'), 'uf', T('pct_contado', 'pct_counted'), 'lula_2022', 'lula_2026', T('cambio_lula', 'lula_change'), T('cambio_flavio_vs_jair', 'flavio_vs_jair_change')],
          filas: S ? S.filas.map(z => [z.ib, nm(z.ib)[0], nm(z.ib)[1], z.pct, Math.round(z.l22 * 100) / 100, Math.round(z.l26 * 100) / 100, Math.round(z.dl * 100) / 100, z.df == null ? null : Math.round(z.df * 100) / 100]) : [],
        };
      },
      render(box, vista) { placaSwing(box, vista); },
    },
  ];

  /* ================= montaje ================= */
  const esc = document.getElementById('escenario');
  const params = new URLSearchParams(location.search);
  const modoPNG = params.has('png');
  if (modoPNG) document.body.classList.add('sin-anim');
  // en la web la barra queda siempre visible (para encontrar las descargas); en la copia local
  // (streaming) se esconde sola para no ensuciar la pantalla
  const EN_LA_WEB = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  // ?modo=web | ?modo=stream fuerzan uno u otro (p. ej. para ensayar la versión web en local)
  const MODO_WEB = !modoPNG && (params.get('modo') ? params.get('modo') === 'web' : EN_LA_WEB);
  let actual = -1, vistaDe = {};
  if (MODO_WEB || modoPNG) {
    for (let i = PLACAS.length - 1; i >= 0; i--) if (PLACAS[i].vivo) PLACAS.splice(i, 1);
    PLACAS.forEach(p => { if (p.vistas) p.vistas = p.vistas.filter(v => !v.vivo); });
  }
  let timerVivo = null, firmaVivo = '';

  function escalar() {
    const arriba = MODO_WEB ? (document.getElementById('atlas-top') || { offsetHeight: 0 }).offsetHeight : 0;
    const abajo = MODO_WEB ? (document.getElementById('atlas-pie') || { offsetHeight: 0 }).offsetHeight : 0;
    const h = innerHeight - arriba - abajo;
    const s = Math.min(innerWidth / 1920, h / 1080);
    esc.style.transform = `scale(${s})`;
    esc.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    esc.style.top = arriba + Math.max(0, (h - 1080 * s) / 2) + 'px';
    const g = document.getElementById('girar'); if (g) g.style.top = (arriba + 10) + 'px';
  }

  function vistaActual(P) { return P.vistas ? (vistaDe[P.id] || P.vistas[0].id) : null; }

  function render(i) {
    const P = PLACAS[i];
    if (window.Mapa) window.Mapa.desmontar();
    clearInterval(timerVivo); timerVivo = null;
    const vistaV = P.vistas ? P.vistas.find(x => x.id === vistaActual(P)) : null;
    const enVivo = P.vivo || (vistaV && vistaV.vivo);
    if (enVivo) {
      // datos que escribe vivo.py: se releen cada 15 s y la placa se redibuja si cambiaron
      const v = P.vivo ? vistaActual(P) : vistaV.turno(), firma = () => { const D = vivoDe(v); return (D ? D.consultado : 'nada') + '|' + v; };
      const tick = () => recargarVivo(v, () => { if (actual === i && firma() !== firmaVivo) { firmaVivo = firma(); render(i); } });
      timerVivo = setInterval(tick, 15000);
      if (!vivoDe(v)) setTimeout(tick, 50);
      firmaVivo = firma();
    }
    esc.innerHTML = '';
    const sec = document.createElement('section');
    if (P.mapa) {
      sec.className = 'placa placa-mapa';
      esc.appendChild(sec);
      window.Mapa.montar(sec);
      return;
    }
    const vista = vistaActual(P);
    const V = P.vistas ? P.vistas.find(v => v.id === vista) : P;
    sec.className = 'placa' + (P.vivo || (P.vistas && (P.vistas.find(x => x.id === vistaActual(P)) || {}).vivo) ? ' sin-anim' : '');
    sec.innerHTML = `
      <div class="kicker">${T('Brasil 2026', 'Brazil 2026')} <span class="sep">·</span> ${P.kicker}</div>
      <h1 class="titulo">${modoPNG && params.get('titulo') ? params.get('titulo') : (typeof V.titulo === 'function' ? V.titulo() : V.titulo)}</h1>
      <p class="bajada">${typeof V.bajada === 'function' ? V.bajada() : V.bajada}</p>
      <div class="cuerpo"></div>
      <div class="pie"><div class="fuente">${P.fuente(vista)}</div>
        <div class="firma"><div class="f1">${MARCA.f1}</div><div class="f2">${MARCA.f2}</div></div></div>`;
    if (P.vistas && !modoPNG) {
      const t = document.createElement('div'); t.className = 'toggle'; t.style.cssText = 'position:absolute;right:84px;top:50px';
      P.vistas.forEach(v => {
        const b = document.createElement('button'); b.textContent = v.nm; if (v.id === vista) b.className = 'on';
        b.addEventListener('click', () => { vistaDe[P.id] = v.id; render(i); syncHash(); });
        t.appendChild(b);
      });
      sec.appendChild(t);
    }
    esc.appendChild(sec);
    ajustarTitulo(sec.querySelector('.titulo'));
    P.render(sec.querySelector('.cuerpo'), vista);
  }

  // el título editorial va en un renglón: se achica de a 2px hasta que entra (piso 44px)
  function ajustarTitulo(h1) {
    let fs = 58;
    h1.style.fontSize = fs + 'px';
    while (h1.scrollHeight > fs * 1.35 && fs > 44) { fs -= 2; h1.style.fontSize = fs + 'px'; }
  }

  function syncHash() {
    const P = PLACAS[actual];
    if (P.mapa) return;
    const v = vistaDe[P.id];
    history.replaceState(null, '', location.pathname + location.search + '#' + P.id + (v && P.vistas && v !== P.vistas[0].id ? '?vista=' + v : ''));
  }
  function ir(i) {
    salirPortada();
    i = (i + PLACAS.length) % PLACAS.length;
    actual = i;
    const P = PLACAS[i];
    if (!location.hash.startsWith('#' + P.id)) history.replaceState(null, '', location.pathname + location.search + '#' + P.id);
    render(i);
    syncHash();
    document.querySelectorAll('#nav .np').forEach((b, k) => b.classList.toggle('on', k === i));
    actualizarNavAtlas();
  }
  function desdeHash() {
    const h = location.hash.slice(1).split('?')[0];
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const i = PLACAS.findIndex(p => p.id === h);
    if (i >= 0 && q.get('vista')) vistaDe[PLACAS[i].id] = q.get('vista');
    // sin placa en el link: en la web va la portada; en la copia local (streaming), la primera placa
    return i >= 0 ? i : MODO_WEB ? -1 : 0;
  }

  /* ---------- portada (versión web): el índice de gráficos, como el de cada entrega de El Atlas ---------- */
  const THUMB_V = 1;
  let enPortada = false, scrollPortada = 0;
  function tituloTarjeta(P) {
    if (P.mapa) return T('El mapa electoral, municipio por municipio', 'The election map, municipality by municipality');
    const V = P.vistas ? P.vistas[0] : P;
    return typeof V.titulo === 'function' ? V.titulo() : V.titulo;
  }
  const cuantos = n => (EN ? ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'] : ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince'])[n - 10] || String(n);
  function armarPortada() {
    const p = document.createElement('div'); p.id = 'portada';
    p.innerHTML = `<div class="wrap-idx">
      <header>
        <div class="top-bar">
          <div class="brand"><a class="atlas-home brand-em" href="../" title="${T('Inicio de El Atlas', 'The Atlas home')}">${MARCA.f1}</a> · <span class="brand-topic">${T('Elecciones Brasil', 'Brazil Elections')}</span></div>
          <div class="atlas-top-right">
            <a class="atlas-top-sub" href="${SUBS[EN ? 'en' : 'es']}" target="_blank" rel="noopener">${T('Suscribite gratis', 'Subscribe for free')} →</a>
            <div class="lang-toggle"><button data-lang="es"${EN ? '' : ' class="active"'}>ES</button><button data-lang="en"${EN ? ' class="active"' : ''}>EN</button></div>
          </div>
        </div>
        <h1>${T('Elecciones en Brasil', 'Elections in Brazil')}</h1>
        <p class="lede">${T(`Cómo llega Brasil a las urnas. ${cuantos(PLACAS.length)} gráficos sobre la economía, la composición del empleo por categoría ocupacional y por sector, la pobreza, la desigualdad, la violencia, las encuestas, el mapa de 2022 municipio por municipio y quién votó a quién.`,
          `How Brazil heads into the vote. ${cuantos(PLACAS.length)} charts on the economy, the makeup of employment by occupational category and by sector, poverty, inequality, violence, the polls, the 2022 map municipality by municipality and who voted for whom.`)}</p>
        <div class="accent-rule"></div>
      </header>
      <div class="idx-section-label">${T('Gráficos interactivos', 'Interactive charts')}</div>
      <div class="idx-grid">${PLACAS.map((P, k) => `
        <a class="idx-card" href="#${P.id}">
          <img class="idx-thumb" src="thumbs/${P.id}${EN ? '.en' : ''}.png?v=${THUMB_V}" alt="" loading="lazy">
          <span class="idx-card-num">${T('Gráfico', 'Chart')} ${k + 1}</span>
          <h2>${tituloTarjeta(P)}</h2>
          <span class="idx-card-go">${T('Ver gráfico', 'See chart')} →</span>
        </a>`).join('')}
      </div>
      <div class="idx-footer">${MARCA.f1} · ${MARCA.f2} · 2026</div>
      <div class="idx-cta"><a class="atlas-cta" href="${SUBS[EN ? 'en' : 'es']}" target="_blank" rel="noopener">
        <span class="atlas-cta-eyebrow">${T('El Atlas · Newsletter', 'The Atlas · Newsletter')}</span>
        <span class="atlas-cta-pitch">${T('Cartografías del desarrollo de América Latina y el mundo, con datos y gráficos interactivos.', 'Mapping development in Latin America and the world, with data and interactive charts.')}</span>
        <span class="atlas-cta-go">${T('Suscribite gratis', 'Subscribe for free')} →</span></a></div>
    </div>`;
    p.querySelectorAll('.lang-toggle [data-lang]').forEach(b => b.addEventListener('click', () => {
      const l = b.getAttribute('data-lang'); if ((l === 'en') !== EN) cambiarIdioma(l);
    }));
    // miniatura que no llega: un reintento (algunos antivirus cortan descargas locales) y si no, el recuadro vacío
    p.querySelectorAll('.idx-thumb').forEach(img => img.addEventListener('error', () => {
      if (!img.dataset.r) { img.dataset.r = 1; setTimeout(() => { img.src += '&r=1'; }, 400); }
      else { const d = document.createElement('div'); d.className = 'idx-thumb'; img.replaceWith(d); }
    }));
    document.body.appendChild(p);
  }
  function mostrarPortada() {
    if (window.Mapa) window.Mapa.desmontar();
    clearInterval(timerVivo); timerVivo = null;
    esc.innerHTML = ''; actual = -1;
    enPortada = true;
    document.documentElement.classList.add('en-portada');
    document.getElementById('indice')?.classList.remove('on');
    scrollTo(0, scrollPortada);
  }
  function salirPortada() {
    if (!enPortada) return;
    scrollPortada = scrollY;
    enPortada = false;
    document.documentElement.classList.remove('en-portada');
    scrollTo(0, 0);
    escalar();
  }
  // "Ver todos los gráficos" es una navegación más, como el link al índice en las otras entregas:
  // el botón Atrás del navegador vuelve al gráfico donde se estaba
  function irPortada() {
    if (enPortada) return;
    history.pushState(null, '', location.pathname + location.search);
    mostrarPortada();
  }
  function rutear() {
    const i = desdeHash();
    if (i < 0) { if (!enPortada) mostrarPortada(); return; }
    if (i !== actual) ir(i);
  }

  /* ---------- descargas ---------- */
  function nombreArchivo(P) {
    if (P.mapa) return PREFIJO + window.Mapa.nombreArchivo();
    const v = vistaActual(P);
    return PREFIJO + (P.datos ? P.datos(v).archivo : P.id) + (EN ? '' : '');
  }
  function descargarCSV() {
    const P = PLACAS[actual];
    const d = P.mapa ? window.Mapa.datos() : P.datos(vistaActual(P));
    window.Exportar.csv({ ...d, archivo: PREFIJO + d.archivo });
  }
  // imagen pre-exportada de respaldo (si el navegador no deja generar el PNG en vivo)
  const RESPALDO = {
    pib: '01-pib', desempleo: '02-desempleo', 'empleo:tipo': '03a-empleo-tipo', 'empleo:sector': '03b-empleo-sector', 'empleo:informalidad': '03c-informalidad',
    pobreza: '04-pobreza', ingreso: '05-ingreso-real', gini: '06-gini', homicidios: '07-homicidios', 'consumo:var': '08a-consumo-variacion', 'consumo:nivel': '08b-consumo-nivel',
    fiscal: '09-fiscal', comercio: '10-comercio-argentina', 'encuestas:ambas': '11-encuestas-ambas-vueltas', 'encuestas:1v': '11a-encuestas-1ra-vuelta', 'encuestas:2v': '11b-encuestas-2da-vuelta', mapa: '12d-mapa-2022-2v-municipios',
    'sociedad:ingreso': '13a-quien-voto-ingreso', 'sociedad:bf': '13b-quien-voto-bolsa-familia', 'sociedad:raza': '13c-quien-voto-raza', 'sociedad:religion': '13d-quien-voto-religion',
  };
  async function descargarPNG(btn) {
    const P = PLACAS[actual], v = vistaActual(P);
    const r = RESPALDO[P.id + (v ? ':' + v : '')] || RESPALDO[P.id];
    btn.disabled = true;
    try { await window.Exportar.png(nombreArchivo(P), r ? `png/${EN ? 'en/' : ''}${r}.png` : null); } finally { btn.disabled = false; }
  }

  /* ---------- chrome de El Atlas (versión web) ---------- */
  const SUBS = { es: 'https://elatlas.substack.com', en: 'https://atlasdevelopment.substack.com' };
  function armarChromeAtlas() {
    const top = document.createElement('header'); top.id = 'atlas-top';
    top.innerHTML = `<div class="top-bar">
        <div class="brand"><a class="atlas-home brand-em" href="../" title="${T('Inicio de El Atlas', 'The Atlas home')}">${MARCA.f1}</a> · <a class="atlas-home brand-topic" href="#" data-indice>${T('Elecciones Brasil', 'Brazil Elections')}</a></div>
        <div class="atlas-top-right">
          <a class="atlas-top-sub" href="${SUBS[EN ? 'en' : 'es']}" target="_blank" rel="noopener">${T('Suscribite gratis', 'Subscribe for free')} →</a>
          <div class="lang-toggle"><button data-lang="es"${EN ? '' : ' class="active"'}>ES</button><button data-lang="en"${EN ? ' class="active"' : ''}>EN</button></div>
        </div></div>`;
    document.body.appendChild(top);
    top.querySelectorAll('.lang-toggle [data-lang]').forEach(b => b.addEventListener('click', () => {
      const l = b.getAttribute('data-lang'); if ((l === 'en') !== EN) cambiarIdioma(l);
    }));
    const pie = document.createElement('footer'); pie.id = 'atlas-pie';
    pie.innerHTML = `<div class="pie-dl"><button class="download" data-dl="csv">${T('Descargar datos (CSV)', 'Download data (CSV)')}</button><button class="download" data-dl="png">${T('Descargar PNG', 'Download PNG')}</button></div>
      <div class="atlas-nav"><a class="atlas-nav-arrow" href="#" data-dir="-1" aria-label="${T('Gráfico anterior', 'Previous chart')}">←</a><a class="atlas-nav-count" href="#" data-indice title="${T('Ver todos los gráficos', 'See all charts')}"></a><a class="atlas-nav-arrow" href="#" data-dir="1" aria-label="${T('Gráfico siguiente', 'Next chart')}">→</a></div>
      <div class="pie-todos"><a class="atlas-nav-all" href="#" data-indice>${T('Ver todos los gráficos', 'See all charts')} →</a></div>`;
    document.body.appendChild(pie);
    pie.querySelector('[data-dl="csv"]').addEventListener('click', descargarCSV);
    const bp = pie.querySelector('[data-dl="png"]'); bp.addEventListener('click', () => descargarPNG(bp));
    pie.querySelectorAll('[data-dir]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (!a.classList.contains('is-off')) ir(actual + +a.dataset.dir); }));
    document.querySelectorAll('[data-indice]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); irPortada(); }));
  }
  function actualizarNavAtlas() {
    const pie = document.getElementById('atlas-pie'); if (!pie) return;
    pie.querySelector('.atlas-nav-count').textContent = `${T('Gráfico', 'Chart')} ${actual + 1} / ${PLACAS.length}`;
    pie.querySelector('[data-dir="-1"]').classList.toggle('is-off', actual === 0);
    pie.querySelector('[data-dir="1"]').classList.toggle('is-off', actual === PLACAS.length - 1);
  }

  /* ---------- navegación (barra inferior + índice) ---------- */
  function cambiarIdioma(lang) {
    const q = new URLSearchParams(location.search);
    if (lang === 'en') q.set('lang', 'en'); else q.delete('lang');
    location.href = location.pathname + (q.toString() ? '?' + q : '') + location.hash;
  }
  function armarNav() {
    if (modoPNG) return;
    if (MODO_WEB) { armarChromeAtlas(); armarPortada(); }
    const nav = document.createElement('div'); nav.id = 'nav';
    if (MODO_WEB) nav.style.display = 'none';
    const casa = document.createElement('a'); casa.className = 'casa'; casa.href = '../'; casa.textContent = MARCA.f1; casa.title = T('Volver a El Atlas', 'Back to The Atlas');
    nav.appendChild(casa);
    const sep = () => { const s = document.createElement('span'); s.className = 'sep-nav'; nav.appendChild(s); };
    sep();
    const prev = document.createElement('button'); prev.textContent = '←'; prev.title = T('Anterior', 'Previous'); prev.onclick = () => ir(actual - 1); nav.appendChild(prev);
    PLACAS.forEach((p, k) => { const b = document.createElement('button'); b.className = 'np'; b.textContent = k + 1; b.title = p.corto; b.onclick = () => ir(k); nav.appendChild(b); });
    const next = document.createElement('button'); next.textContent = '→'; next.title = T('Siguiente', 'Next'); next.onclick = () => ir(actual + 1); nav.appendChild(next);
    sep();
    ['es', 'en'].forEach(l => { const b = document.createElement('button'); b.className = 'idioma' + ((l === 'en') === EN ? ' on' : ''); b.textContent = l.toUpperCase(); b.onclick = () => { if ((l === 'en') !== EN) cambiarIdioma(l); }; nav.appendChild(b); });
    sep();
    const bc = document.createElement('button'); bc.className = 'dl'; bc.textContent = T('Descargar datos (CSV)', 'Download data (CSV)'); bc.onclick = descargarCSV; nav.appendChild(bc);
    const bp = document.createElement('button'); bp.className = 'dl'; bp.textContent = T('Descargar PNG', 'Download PNG'); bp.onclick = () => descargarPNG(bp); nav.appendChild(bp);
    if (!MODO_WEB) { const ay = document.createElement('span'); ay.className = 'ayuda'; ay.textContent = T('G índice · F pantalla completa · T vista', 'G index · F full screen · T view'); nav.appendChild(ay); }
    document.body.appendChild(nav);
    const ind = document.createElement('div'); ind.id = 'indice';
    ind.innerHTML = `<button class="cerrar" aria-label="${T('Cerrar', 'Close')}">×</button><h2>${T('Elecciones Brasil · todos los gráficos', 'Brazil Elections · all charts')}</h2><div class="g">` + PLACAS.map((p, k) =>
      `<a href="#${p.id}" data-k="${k}"><small>${k + 1} · ${p.kicker}</small>${p.corto}</a>`).join('') + '</div>';
    ind.addEventListener('click', e => {
      if (e.target.closest('.cerrar') || e.target === ind) { ind.classList.remove('on'); return; }
      const a = e.target.closest('a'); if (a) { e.preventDefault(); ind.classList.remove('on'); ir(+a.dataset.k); }
    });
    document.body.appendChild(ind);
    if (!MODO_WEB) {
      let tm = null;
      const mostrar = () => {
        nav.classList.remove('oculto'); document.body.classList.remove('cursor-oculto');
        clearTimeout(tm); tm = setTimeout(() => { nav.classList.add('oculto'); document.body.classList.add('cursor-oculto'); }, 2500);
      };
      addEventListener('mousemove', mostrar); addEventListener('touchstart', mostrar, { passive: true }); mostrar();
    }
    const g = document.createElement('div'); g.id = 'girar';
    g.textContent = T('Girá el teléfono para ver la placa más grande. Deslizá a los costados para cambiar de placa.', 'Turn your phone sideways to see the chart larger. Swipe left or right to change charts.');
    document.body.appendChild(g);
  }

  // teléfono: deslizar a los costados cambia de placa (un toque sigue funcionando como siempre)
  // (no cuenta si hay dos dedos, que es zoom; ni con la página ampliada, que es mover la vista; ni sobre el
  // mapa o la dispersión, donde arrastrar es explorar; y tiene que ser un gesto rápido)
  let toque = null;
  addEventListener('touchstart', e => {
    const sobreGrafico = e.target.closest && e.target.closest('.mapa-svg-box, .so-puntos, input');
    toque = e.touches.length === 1 && !sobreGrafico ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
  }, { passive: true });
  addEventListener('touchmove', e => { if (e.touches.length > 1) toque = null; }, { passive: true });
  addEventListener('touchend', e => {
    if (!toque || modoPNG || enPortada) return;
    const t = e.changedTouches[0], dx = t.clientX - toque.x, dy = t.clientY - toque.y, rapido = Date.now() - toque.t < 700;
    toque = null;
    if (e.touches.length > 0 || (window.visualViewport && visualViewport.scale > 1.05) || !rapido) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) ir(actual + (dx < 0 ? 1 : -1));
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || enPortada) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); ir(actual + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); ir(actual - 1); }
    else if (k === 'Home') ir(0);
    else if (k === 'End') ir(PLACAS.length - 1);
    else if (k === 'g' || k === 'G') document.getElementById('indice')?.classList.toggle('on');
    else if (k === 'Escape') document.getElementById('indice')?.classList.remove('on');
    else if (k === 'f' || k === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
    else if ((k === 't' || k === 'T') && PLACAS[actual].vistas) {
      const P = PLACAS[actual], vs = P.vistas.map(v => v.id), cur = vistaDe[P.id] || vs[0];
      vistaDe[P.id] = vs[(vs.indexOf(cur) + 1) % vs.length]; render(actual); syncHash();
    }
  });
  addEventListener('resize', escalar);
  addEventListener('hashchange', rutear);
  addEventListener('popstate', rutear);

  document.documentElement.lang = EN ? 'en' : 'es';
  if (EN) document.title = 'Brazil elections — The Atlas';
  armarNav();
  escalar();
  // cargar las fuentes ANTES de medir (si no, el gráfico se mide con la tipografía de reemplazo)
  const fuentes = document.fonts ? Promise.all([
    '700 62px "Source Serif 4"', 'italic 400 31px "Source Serif 4"', '400 24px "Source Sans 3"',
    '600 20px "Source Sans 3"', '700 24px "Source Sans 3"', 'italic 400 20px "Source Sans 3"',
  ].map(f => document.fonts.load(f))).catch(() => null) : Promise.resolve();
  Promise.race([fuentes, new Promise(r => setTimeout(r, 2500))]).then(() => {
    rutear();
    // red de seguridad: si la tipografía llegó tarde (conexión lenta), se re-acomoda la placa una vez
    if (document.fonts && !document.fonts.check('700 58px "Source Serif 4"')) {
      document.fonts.addEventListener('loadingdone', () => { if (actual >= 0) render(actual); }, { once: true });
    }
  });
  window.PLACAS = PLACAS;
})();
