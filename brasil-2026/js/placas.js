/* Placas de la cobertura: definición de cada una + navegación.
   Teclas: ← → (o PageUp/PageDown del clicker) cambian de placa · G índice ·
   F pantalla completa · T cambia la vista de la placa (si tiene) · Esc sale del zoom del mapa.
   Cada placa tiene su URL: index.html#pib, #desempleo, ..., #mapa (para escenas de OBS).
   ?png=1 en la URL saca animaciones y navegación (para exportar imágenes). */
(function () {
  const { dibujarTiempo, fmt, fmtSigno, C } = window.Charts;
  const S = window.SERIES;

  // Firma (abajo a la derecha). Cambiar acá si va con otra marca.
  const MARCA = { f1: 'El Atlas', f2: 'Daniel Schteingart' };

  const pct = d => v => fmt(v, d) + '%';
  const anios = (a, b) => { const r = []; for (let y = a; y <= b; y++) r.push(y); return r; };
  const xfmtCorto = y => (y % 2 === 0 || y === 2026 ? String(y) : '’' + String(y).slice(2));
  function tipHTML(tit, filas, pie) {
    return `<div class="t-h">${tit}</div>` + filas.map(f =>
      `<div class="t-r"><span>${f.color ? `<i class="sw" style="background:${f.color}"></i>` : ''}${f.nm}</span><b>${f.val}</b></div>`).join('') +
      (pie ? `<div class="t-m">${pie}</div>` : '');
  }
  const AZUL = '#234B85', TERRA = '#BE5D32';

  /* títulos de la placa de encuestas: salen del último promedio (ciertos en cualquier momento) */
  function ultimoProm(v, c) { const a = window.ENCUESTAS[v].agregado[c]; return a ? a[a.length - 1].v : null; }
  function tituloEncuestas(v) {
    if (!window.ENCUESTAS) return 'Encuestas';
    const L = ultimoProm(v, 'lula'), F = ultimoProm(v, 'flavio'), d = L - F;
    const pts = fmt(Math.abs(d), 1).replace(',0', '');
    if (Math.abs(d) < 1.5) return v === '1v' ? 'Lula y Flávio Bolsonaro llegan parejos a la primera vuelta' : 'En un balotaje, Lula y Flávio Bolsonaro están empatados en el promedio';
    const [a, b] = d > 0 ? ['Lula', 'Flávio Bolsonaro'] : ['Flávio Bolsonaro', 'Lula'];
    return v === '1v' ? `${a} llega a la primera vuelta ${pts} puntos arriba de ${b}` : `En un balotaje, ${a} le gana a ${b} por ${pts} puntos en el promedio`;
  }
  function bajadaEncuestas(v) {
    if (!window.ENCUESTAS) return '';
    const E = window.ENCUESTAS[v], f = s => { const [y, m, d] = s.split('-'); return `${+d}/${+m}/${y}`; };
    return (v === '1v' ? 'Intención de voto para presidente en primera vuelta (estimulada)' : 'Intención de voto en un balotaje entre Lula y Flávio Bolsonaro') +
      `, en % del total de entrevistados. Encuestas del ${f(E.desde)} al ${f(E.hasta)}.`;
  }

  /* ================= placas ================= */
  const PLACAS = [
    {
      id: 'pib', kicker: 'Economía', corto: 'Crecimiento del PIB',
      titulo: 'La economía de Brasil lleva seis años creciendo, aunque se viene desacelerando',
      bajada: 'Variación anual del PIB real, en %. 2010–2025 y proyección para 2026.',
      fuente: () => `<b>Fuente:</b> IBGE, Cuentas Nacionales Trimestrales. 2026: mediana de las expectativas del mercado relevadas por el Banco Central (Focus, 25/9/2026); en el primer semestre de 2026 el PIB creció ${fmt(S.pib.parcial.v, 1)}% interanual.`,
      render(box) {
        const d = S.pib.obs.map(o => ({ t: o.a, v: o.v }));
        d.push({ t: 2026, v: S.pib.focus, tipo: 'proy', etiqueta: 'proyección' });
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -5, max: 9, ticks: [-4, -2, 0, 2, 4, 6, 8], fmt: v => fmt(v, 0) + '%' },
          xfmt: String,
          capas: [{ tipo: 'barras', datos: d, color: AZUL, colorNeg: TERRA }],
          tips: anios(2010, 2026).map(y => y + 0.5),
          tip: t => {
            const y = Math.floor(t), o = d.find(z => z.t === y);
            if (!o) return null;
            const pie = y === 2026 ? `Proyección Focus (BCB), 25/9/2026<br>1er semestre: +${fmt(S.pib.parcial.v, 1)}% interanual` : null;
            return { html: tipHTML(String(y), [{ nm: 'PIB', val: fmtSigno(o.v, y === 2026 ? 2 : 1) + '%', color: o.v < 0 ? TERRA : AZUL }], pie) };
          },
        });
      },
    },
    {
      id: 'desempleo', kicker: 'Trabajo', corto: 'Desempleo',
      titulo: 'El desempleo está en los niveles más bajos desde que hay registros',
      bajada: 'Tasa de desocupación, en % de la población económicamente activa. Trimestres móviles, de ene–mar 2012 a jun–ago 2026.',
      fuente: () => '<b>Fuente:</b> IBGE, PNAD Contínua (trimestres móviles). La serie empieza en 2012.',
      render(box) {
        const mq = S.desempleo.mq;
        const max = mq.reduce((a, b) => (b.v > a.v ? b : a)), min = mq.reduce((a, b) => (b.v <= a.v ? b : a));
        const last = mq[mq.length - 1], first = mq[0];
        const MES = { jan: 'ene', fev: 'feb', mar: 'mar', abr: 'abr', mai: 'may', jun: 'jun', jul: 'jul', ago: 'ago', set: 'sep', out: 'oct', nov: 'nov', dez: 'dic' };
        const L = s => { const [m, y] = s.split(' '), ms = m.split('-'); return `${MES[ms[0]]}–${MES[ms[2]]} ${y}`; };
        dibujarTiempo(box, {
          x: [2012, 2027], y: { min: 0, max: 18, ticks: [0, 4, 8, 12, 16], fmt: v => v + '%' },
          xfmt: String, m: { r: 175 },
          capas: [{
            tipo: 'linea', datos: mq.map(o => ({ t: o.t, v: o.v })), color: TERRA, grosor: 5.5,
            destacar: [
              { t: first.t, texto: `${fmt(first.v, 1)}%\n${L(first.lbl)}`, dy: -48, anchor: 'start', dx: -6 },
              { t: max.t, texto: `${fmt(max.v, 1)}%\n${L(max.lbl)}`, dy: -48 },
              { t: min.t, texto: `${fmt(min.v, 1)}%\n${L(min.lbl)}`, dy: 52, dx: -10, anchor: 'middle' },
              { t: last.t, texto: `${fmt(last.v, 1)}%\n${L(last.lbl)}`, dy: 4, anchor: 'start', dx: 20 },
            ],
          }],
          tips: mq.map(o => o.t),
          tip: t => { const o = mq.find(z => z.t === t); return { html: tipHTML(L(o.lbl), [{ nm: 'Desocupación', val: fmt(o.v, 1) + '%', color: TERRA }]), puntos: [{ v: o.v, color: TERRA }] }; },
        });
      },
    },
    {
      id: 'empleo', kicker: 'Trabajo', corto: 'Composición del empleo',
      vistas: [
        { id: 'tipo', nm: 'Tipo de empleo', titulo: 'Tras caer entre 2014 y 2021, el empleo formal privado vuelve a ganar peso', bajada: 'Composición de la población ocupada según posición en la ocupación, en %. Promedios anuales 2012–2025 y jun–ago 2026.' },
        { id: 'sector', nm: 'Sector', titulo: 'Los servicios vienen ganando peso en el empleo, a expensas del agro y la industria', bajada: 'Población ocupada según sector de actividad, en %. Promedios anuales 2012–2025 y jun–ago 2026.' },
        { id: 'informalidad', nm: 'Informalidad', titulo: 'La informalidad viene bajando, pero lentamente', bajada: 'Tasa de informalidad, en % de los ocupados. Promedios anuales 2016–2025 y jun–ago 2026.' },
      ],
      fuente: v => v === 'informalidad'
        ? '<b>Fuente:</b> IBGE, PNAD Contínua. Informales: asalariados y domésticos sin libreta, cuentapropistas y empleadores sin CNPJ y auxiliares familiares. La serie empieza en 2016.'
        : v === 'sector'
          ? '<b>Fuente:</b> IBGE, PNAD Contínua. Servicios incluye comercio, transporte, alojamiento y comida, servicios empresariales y financieros, administración pública, educación, salud y servicio doméstico.'
          : '<b>Fuente:</b> IBGE, PNAD Contínua. Formal = con libreta de trabajo firmada (carteira assinada). Sector público incluye militares y estatutarios.',
      render(box, vista) {
        if (vista === 'informalidad') {
          const inf = S.informalidad;
          const d = inf.map(o => ({ t: o.lbl.includes('jun') ? 2026.54 : o.a + 0.5, v: o.v, p: o.lbl.includes('jun') }));
          const max = d.filter(z => !z.p).reduce((a, b) => (b.v > a.v ? b : a));
          dibujarTiempo(box, {
            x: [2016, 2027], y: { min: 30, max: 45, ticks: [30, 35, 40, 45], fmt: v => v + '%' }, xfmt: String,
            capas: [{
              tipo: 'linea', datos: d, color: '#6B3D8B', grosor: 5.5, marcadores: 7,
              destacar: [{ t: d[0].t, dy: -26 }, { t: max.t, dy: -26 }, { t: d[d.length - 1].t, texto: `${fmt(d[d.length - 1].v, 1)}%\njun–ago 2026`, dy: 50 }],
              fmtValor: v => fmt(v, 1) + '%',
            }],
            tips: d.map(z => z.t),
            tip: t => { const o = d.find(z => z.t === t), lb = inf[d.indexOf(o)].lbl.replace(' (annual)', '').replace('jun-jul-ago', 'jun–ago'); return { html: tipHTML(lb, [{ nm: 'Informalidad', val: fmt(o.v, 1) + '%', color: '#6B3D8B' }]), puntos: [{ v: o.v, color: '#6B3D8B' }] }; },
          });
          return;
        }
        const src = vista === 'sector' ? S.sectores : S.composicion;
        const sect = vista === 'sector';
        const cols = sect ? ['#2D6A3D', AZUL, '#8A5A35', '#2C8484'] : [AZUL, '#1F8AC0', '#2C8484', '#B5639E', '#E07A23', '#C9A227'];
        // en "tipo de empleo" las bandas que no son el asalariado formal van atenuadas (el texto conserva el color pleno)
        const suave = ['#234B85', '#A9CBE3', '#A8CCCC', '#DDBCD4', '#F2C9A4', '#E8D9A6'];
        const claves = src.claves.map((nm, k) => ({ nm, color: sect ? cols[k] : suave[k], colorTxt: cols[k] }));
        const mill = (pct, tot) => (pct * tot / 100000).toLocaleString('es-AR', { maximumFractionDigits: 1 });
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
            if (sect) filas = filas.concat(S.sectores.detalle_claves.map((nm, k) => ({ nm: '&nbsp;&nbsp;&nbsp;' + nm, val: fmt(S.sectores.detalle[i][k], 1) + '%' })));
            return { html: tipHTML(o.lbl.replace('jun-jul-ago', 'jun–ago'), filas, `${(o.tot / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} millones de ocupados`), y: 20 };
          },
        });
      },
    },
    {
      id: 'pobreza', kicker: 'Sociedad', corto: 'Pobreza',
      titulo: 'La pobreza bajó a mínimos históricos',
      bajada: 'Población por debajo de las líneas de pobreza (US$ 6,85 por día) y de pobreza extrema (US$ 2,15 por día), a paridad de poder adquisitivo de 2017, en %. 2012–2024.',
      fuente: () => '<b>Fuente:</b> IBGE, Síntesis de Indicadores Sociales 2025 (PNAD Contínua, líneas del Banco Mundial). El dato de 2025 se publica en diciembre de 2026.',
      render(box) {
        const P = S.pobreza, POB = '#7A2A3F', EXT = '#E07A23';
        const pk = P.reduce((a, b) => (b.pob > a.pob ? b : a));
        dibujarTiempo(box, {
          x: [2012, 2025], y: { min: 0, max: 40, ticks: [0, 10, 20, 30, 40], fmt: v => v + '%' }, xfmt: String, m: { r: 250 },
          capas: [
            { tipo: 'linea', datos: P.map(o => ({ t: o.a + .5, v: o.pob })), color: POB, grosor: 5.5, marcadores: 7, nombre: 'Pobreza',
              destacar: [{ t: 2012.5, dy: -26 }, { t: pk.a + .5, dy: -26 }, { t: P[P.length - 1].a + .5, dy: -26 }], fmtValor: v => fmt(v, 1) + '%' },
            { tipo: 'linea', datos: P.map(o => ({ t: o.a + .5, v: o.ext })), color: EXT, grosor: 5.5, marcadores: 7, nombre: 'Pobreza\nextrema', delay: 200,
              destacar: [{ t: 2012.5, dy: -26 }, { t: 2021.5, dy: -26 }, { t: P[P.length - 1].a + .5, dy: -26 }], fmtValor: v => fmt(v, 1) + '%' },
          ],
          tips: P.map(o => o.a + .5),
          tip: t => { const o = P.find(z => z.a + .5 === t); return { html: tipHTML(String(o.a), [{ nm: 'Pobreza', val: fmt(o.pob, 1) + '%', color: POB }, { nm: 'Pobreza extrema', val: fmt(o.ext, 1) + '%', color: EXT }]), puntos: [{ v: o.pob, color: POB }, { v: o.ext, color: EXT }] }; },
        });
      },
    },
    {
      id: 'ingreso', kicker: 'Trabajo', corto: 'Salario real',
      titulo: 'El ingreso real del trabajo está en máximos históricos',
      bajada: 'Ingreso medio real habitual del trabajo principal, en reales de jun–ago 2026. Promedios anuales 2012–2025 y último trimestre móvil (jun–ago 2026).',
      fuente: () => '<b>Fuente:</b> IBGE, PNAD Contínua (deflactado por el IBGE). El salto de 2020 es un efecto composición: la pandemia dejó sin trabajo primero a los de menores ingresos.',
      render(box) {
        const A = S.ingreso.anual, u = S.ingreso.ult, COL = '#2D6A3D';
        const d = A.map(o => ({ t: o.a + .5, v: o.v })).concat([{ t: 2026.54, v: u.v, p: true }]);
        const R = v => 'R$ ' + v.toLocaleString('es-AR');
        dibujarTiempo(box, {
          x: [2012, 2027], y: { min: 2800, max: 3800, ticks: [2800, 3000, 3200, 3400, 3600, 3800], fmt: R }, xfmt: String, m: { l: 150 },
          capas: [{
            tipo: 'linea', datos: d, color: COL, grosor: 5.5, marcadores: 7, fmtValor: R,
            destacar: [{ t: 2012.5, dy: -26 }, { t: 2020.5, dy: -26 }, { t: 2022.5, dy: 48 }, { t: 2025.5, dy: 44, dx: 12, anchor: 'start' }, { t: 2026.54, texto: `${R(u.v)}\njun–ago 2026`, dy: -58 }],
          }],
          tips: d.map(z => z.t),
          tip: t => { const o = d.find(z => z.t === t); return { html: tipHTML(o.p ? 'jun–ago 2026' : String(Math.floor(t)), [{ nm: 'Ingreso real', val: R(o.v), color: COL }], o.p ? `Un año antes: ${R(u.prev)}` : null), puntos: [{ v: o.v, color: COL }] }; },
        });
      },
    },
    {
      id: 'gini', kicker: 'Sociedad', corto: 'Desigualdad (Gini)',
      titulo: 'La desigualdad tocó su mínimo en 2024 y repuntó en 2025',
      bajada: 'Coeficiente de Gini del ingreso domiciliario per cápita (0 = igualdad total; 1 = desigualdad máxima). 2012–2025.',
      fuente: () => '<b>Fuente:</b> IBGE, PNAD Contínua anual (ingresos de todas las fuentes). La serie empieza en 2012.',
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
      id: 'homicidios', kicker: 'Sociedad', corto: 'Homicidios',
      titulo: 'Los homicidios cayeron más de un tercio desde el pico de 2017',
      bajada: 'Víctimas de homicidio cada 100.000 habitantes, según dos fuentes. 2010–2024 (Ministerio de Salud) y 2012–2025 (registros policiales).',
      fuente: () => '<b>Fuente:</b> Atlas da Violência 2026 (IPEA y FBSP), con el Sistema de Información sobre Mortalidad del Ministerio de Salud. Muertes violentas intencionales: Anuario Brasileño de Seguridad Pública 2026 (FBSP).',
      render(box) {
        const H = S.homicidios;
        if (!H) { box.innerHTML = '<div class="aviso">Datos pendientes.</div>'; return; }
        const SIMc = '#7A2A3F', MVIc = '#8A8579';
        const sim = H.filter(o => o.sim != null).map(o => ({ t: o.a + .5, v: o.sim }));
        const mvi = H.filter(o => o.mvi != null).map(o => ({ t: o.a + .5, v: o.mvi }));
        const pk = sim.reduce((a, b) => (b.v > a.v ? b : a));
        const capas = [{ tipo: 'linea', datos: sim, color: SIMc, grosor: 5.5, marcadores: 7, nombre: 'Homicidios\nMinisterio de Salud (SIM)', nombreT: 2019.2, nombreV: 14,
          destacar: [{ t: sim[0].t, dy: -26 }, { t: pk.t, dy: -26 }, { t: sim[sim.length - 1].t, dy: 46 }] }];
        if (mvi.length) capas.push({ tipo: 'linea', datos: mvi, color: MVIc, grosor: 4, marcadores: 6, punteada: true, nombre: 'Muertes violentas intencionales\nregistros policiales (FBSP)', nombreT: 2019.2, nombreV: 31, delay: 200,
          destacar: [{ t: mvi[mvi.length - 1].t, dy: -26 }] });
        dibujarTiempo(box, {
          x: [2010, 2026], y: { min: 0, max: 35, ticks: [0, 10, 20, 30], fmt: v => fmt(v, 0) }, xfmt: String, m: { r: 90 },
          capas,
          tips: anios(2010, 2025).map(y => y + .5),
          tip: t => {
            const y = Math.floor(t), o = H.find(z => z.a === y); if (!o) return null;
            const f = []; if (o.sim != null) f.push({ nm: 'Homicidios (SIM)', val: fmt(o.sim, 1), color: SIMc }); if (o.mvi != null) f.push({ nm: 'MVI (FBSP)', val: fmt(o.mvi, 1), color: MVIc });
            return { html: tipHTML(String(y), f, 'cada 100.000 habitantes'), puntos: f.map((r, k) => ({ v: k === 0 && o.sim != null ? o.sim : o.mvi, color: r.color })) };
          },
        });
      },
    },
    {
      id: 'consumo', kicker: 'Economía', corto: 'Consumo de los hogares',
      vistas: [
        { id: 'var', nm: 'Variación anual', titulo: 'El consumo de los hogares se frenó en 2025 y 2026', bajada: 'Variación anual del consumo real de los hogares, en %. 2010–2025 y primer semestre de 2026 (interanual).' },
        { id: 'nivel', nm: 'Nivel', titulo: 'El consumo de los hogares es casi 30% más alto que en 2010', bajada: 'Índice del consumo real de los hogares, 2010 = 100. 2010–2025.' },
      ],
      fuente: () => `<b>Fuente:</b> IBGE, Cuentas Nacionales Trimestrales. El Banco Central proyecta ${fmt(S.consumo.proy, 1)}% para todo 2026 (Informe de Política Monetaria, septiembre de 2026).`,
      render(box, vista) {
        const O = S.consumo.obs, COL = '#2C8484';
        if (vista === 'nivel') {
          const d = O.map(o => ({ t: o.a + .5, v: o.idx }));
          dibujarTiempo(box, {
            x: [2010, 2026], y: { min: 90, max: 135, ticks: [90, 100, 110, 120, 130], fmt: v => fmt(v, 0) }, xfmt: String,
            capas: [{ tipo: 'linea', datos: d, color: COL, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1),
              destacar: [{ t: 2010.5, dy: -26 }, { t: 2014.5, dy: -26 }, { t: 2016.5, dy: 48 }, { t: 2020.5, dy: 48 }, { t: 2025.5, dy: -26 }] }],
            tips: d.map(z => z.t),
            tip: t => { const o = d.find(z => z.t === t); return { html: tipHTML(String(Math.floor(t)), [{ nm: 'Índice (2010 = 100)', val: fmt(o.v, 1), color: COL }]), puntos: [{ v: o.v, color: COL }] }; },
          });
          return;
        }
        const d = O.map(o => ({ t: o.a, v: o.v }));
        d.push({ t: 2026, v: S.consumo.parcial, tipo: 'parcial', etiqueta: '1er sem.' });
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -6, max: 8, ticks: [-6, -4, -2, 0, 2, 4, 6, 8], fmt: v => fmt(v, 0) + '%' }, xfmt: String,
          capas: [{ tipo: 'barras', datos: d, color: COL, colorNeg: TERRA }],
          tips: anios(2010, 2026).map(y => y + .5),
          tip: t => { const y = Math.floor(t), o = d.find(z => z.t === y); return o ? { html: tipHTML(y === 2026 ? '1er semestre 2026' : String(y), [{ nm: 'Consumo de los hogares', val: fmtSigno(o.v, 1) + '%', color: o.v < 0 ? TERRA : COL }], y === 2026 ? 'vs 1er semestre de 2025' : null) } : null; },
        });
      },
    },
    {
      id: 'fiscal', kicker: 'Economía', corto: 'Resultado fiscal',
      titulo: 'Con los intereses de la deuda, el déficit fiscal llega al 9,5% del PIB',
      bajada: 'Resultado del sector público consolidado, en % del PIB (negativo = déficit). 2010–2025 y 12 meses a agosto de 2026.',
      fuente: () => '<b>Fuente:</b> Banco Central do Brasil (necesidades de financiamiento del sector público consolidado). El resultado financiero (nominal) incluye los intereses de la deuda.',
      render(box) {
        const F = S.fiscal, PR = AZUL, NO = TERRA;
        const tt = o => (o.p ? 2026.55 : o.a + .5);
        const prim = F.map(o => ({ t: tt(o), v: o.prim, p: o.p })), nom = F.map(o => ({ t: tt(o), v: o.nom, p: o.p }));
        const ult = F[F.length - 1];
        dibujarTiempo(box, {
          x: [2010, 2027], y: { min: -15, max: 5, ticks: [-15, -10, -5, 0, 5], fmt: v => fmt(v, 0) + '%' }, xfmt: String, m: { r: 230 },
          capas: [
            { tipo: 'linea', datos: prim, color: PR, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1), nombre: 'Primario', nombreDy: -6,
              destacar: [{ t: 2010.5, dy: -26 }, { t: 2020.5, dy: 46, dx: -6 }, { t: 2022.5, dy: -26 }, { t: 2026.55, dy: -26 }] },
            { tipo: 'linea', datos: nom, color: NO, grosor: 5.5, marcadores: 7, fmtValor: v => fmt(v, 1), nombre: 'Financiero\n(con intereses)', delay: 200,
              destacar: [{ t: 2010.5, dy: 46 }, { t: 2015.5, dy: 46 }, { t: 2020.5, dy: 46 }, { t: 2026.55, dy: 50, anchor: 'end', dx: 12 }] },
          ],
          notas: [
            { t: 2010, v: 0, dx: 8, dy: -14, texto: 'Superávit ↑', color: C.muted, size: 19 },
            { t: 2010, v: 0, dx: 8, dy: 30, texto: 'Déficit ↓', color: C.muted, size: 19 },
          ],
          tips: F.map(tt),
          tip: t => { const o = F.find(z => tt(z) === t); return { html: tipHTML(o.p ? '12 meses a agosto 2026' : String(o.a), [{ nm: 'Primario', val: fmtSigno(o.prim, 1) + '%', color: PR }, { nm: 'Intereses', val: fmt(o.int, 1) + '%' }, { nm: 'Financiero', val: fmtSigno(o.nom, 1) + '%', color: NO }], 'en % del PIB'), puntos: [{ v: o.prim, color: PR }, { v: o.nom, color: NO }] }; },
        });
      },
    },
    {
      id: 'comercio', kicker: 'Brasil y Argentina', corto: 'Comercio con Argentina',
      titulo: 'Argentina, tercer socio comercial de Brasil, pesa la mitad que en 2010',
      bajada: 'Comercio de bienes de Brasil con Argentina, en miles de millones de US$ (izquierda), y peso de Argentina en el comercio total de Brasil, en % (derecha). 2010–2025 y últimos 12 meses.',
      fuente: () => '<b>Fuente:</b> Secex/MDIC, Comex Stat (valores FOB). *Últimos 12 meses con dato: septiembre de 2025 a agosto de 2026. China y Estados Unidos son el 1° y el 2° socio comercial de Brasil.',
      render(box) {
        const T = S.comercio;
        if (!T) { box.innerHTML = '<div class="aviso">Datos pendientes.</div>'; return; }
        box.innerHTML = '<div style="position:absolute;inset:0;display:grid;grid-template-columns:1.45fr 1fr;gap:56px"><div class="c-izq" style="position:relative"></div><div class="c-der" style="position:relative"></div></div>';
        const izq = box.querySelector('.c-izq'), der = box.querySelector('.c-der');
        const EXP = AZUL, IMP = '#6CB04D';
        const full = T.filter(o => !o.p), ytd = T.find(o => o.p);
        const mx = Math.max(...T.map(o => o.exp + o.imp));
        const ymax = Math.ceil(mx / 10) * 10;
        const barrasE = full.map(o => ({ t: o.a, v: o.exp + o.imp, color: IMP })), barrasX = full.map(o => ({ t: o.a, v: o.exp, color: EXP }));
        if (ytd) { barrasE.push({ t: ytd.a, v: ytd.exp + ytd.imp, tipo: 'parcial', color: IMP }); barrasX.push({ t: ytd.a, v: ytd.exp, tipo: 'parcial', color: EXP }); }
        const lbl = o => (o.p ? '12 meses a agosto de 2026' : String(o.a));
        dibujarTiempo(izq, {
          x: [2010, 2027], y: { min: 0, max: ymax, ticks: anios(0, ymax / 10).map(k => k * 10), fmt: v => fmt(v, 0) }, xfmt: y => (y === 2026 ? '12 m*' : xfmtCorto(y)),
          m: { l: 70, r: 20 }, y2: null,
          capas: [
            { tipo: 'barras', datos: barrasE, color: IMP, valores: false, ancho: .74 },
            { tipo: 'barras', datos: barrasX, color: EXP, valores: false, ancho: .74 },
            { tipo: 'barras', datos: barrasE.map(b => ({ ...b, color: null, tipo: null })), color: 'rgba(0,0,0,0)', ancho: .74, tamValor: 19, colorValor: C.soft, fmtValor: v => fmt(v, 0) },
          ],
          notas: [
            { t: 2021.2, v: ymax * 0.93, texto: '■ Exportaciones de Brasil', color: EXP, size: 22, peso: 700 },
            { t: 2021.2, v: ymax * 0.84, texto: '■ Importaciones desde Argentina', color: '#4E8A34', size: 22, peso: 700 },
          ],
          tips: T.map(o => o.a + .5),
          tip: t => { const o = T.find(z => z.a + .5 === t); return { html: tipHTML(lbl(o), [{ nm: 'Exportaciones', val: 'US$ ' + fmt(o.exp, 1) + ' mil M', color: EXP }, { nm: 'Importaciones', val: 'US$ ' + fmt(o.imp, 1) + ' mil M', color: IMP }, { nm: 'Total', val: 'US$ ' + fmt(o.exp + o.imp, 1) + ' mil M' }], `Saldo para Brasil: US$ ${fmtSigno(o.exp - o.imp, 1)} mil M`) }; },
        });
        const SH = TERRA;
        const sh = T.map(o => ({ t: o.p ? 2026.5 : o.a + .5, v: o.sh_tot, p: o.p }));
        const smax = Math.ceil(Math.max(...sh.map(z => z.v)) / 2) * 2 + 1;
        const pk = sh.filter(z => !z.p).reduce((a, b) => (b.v > a.v ? b : a));
        dibujarTiempo(der, {
          x: [2010, 2027], y: { min: 0, max: smax, ticks: anios(0, Math.floor(smax / 2)).map(k => k * 2), fmt: v => v + '%' }, xfmt: y => (y % 4 === 2 ? String(y) : y === 2026 ? '12 m*' : null),
          m: { l: 70, r: 150 }, gob: true,
          capas: [{ tipo: 'linea', datos: sh, color: SH, grosor: 5.5, marcadores: 6, fmtValor: v => fmt(v, 1) + '%',
            destacar: [{ t: sh[0].t, dy: -26, anchor: 'start', dx: -8 }, ...(pk.t !== sh[0].t ? [{ t: pk.t, dy: -26 }] : []), { t: sh[sh.length - 1].t, texto: `${fmt(sh[sh.length - 1].v, 1)}%\núltimos 12 m`, dy: 6, anchor: 'start', dx: 18 }] }],
          tips: sh.map(z => z.t),
          tip: t => { const i = sh.findIndex(z => z.t === t), o = T[i]; return { html: tipHTML(lbl(o), [{ nm: 'Del comercio total', val: fmt(o.sh_tot, 1) + '%', color: SH }, { nm: 'De las exportaciones', val: fmt(o.sh_exp, 1) + '%' }, { nm: 'De las importaciones', val: fmt(o.sh_imp, 1) + '%' }], o.rank ? `Argentina: ${o.rank}° socio comercial de Brasil` : null), puntos: [{ v: o.sh_tot, color: SH }] }; },
        });
      },
    },
    {
      id: 'encuestas', kicker: 'Elecciones', corto: 'Encuestas',
      vistas: [
        { id: '1v', nm: '1ª vuelta', titulo: () => tituloEncuestas('1v'), bajada: () => bajadaEncuestas('1v') },
        { id: '2v', nm: '2ª vuelta', titulo: () => tituloEncuestas('2v'), bajada: () => bajadaEncuestas('2v') },
      ],
      fuente: v => {
        const E = window.ENCUESTAS; if (!E) return '';
        return `<b>Fuente:</b> ${E[v].encuestadoras.join(', ')} (${E[v].n_encuestas} encuestas). Cada punto es una encuesta; la línea es el promedio ponderado por cercanía en el tiempo y tamaño de muestra, donde las encuestadoras que publican más seguido pesan menos.` + (v === '1v' ? ' Hasta marzo, algunos escenarios incluían candidatos que finalmente no se presentaron.' : '');
      },
      render(box, vista) {
        const E = window.ENCUESTAS && window.ENCUESTAS[vista];
        if (!E) { box.innerHTML = '<div class="aviso">Datos de encuestas pendientes.</div>'; return; }
        const cands = E.cands.filter(c => E.agregado[c.c]);
        const COLS = { lula: '#C8372D', flavio: AZUL, caiado: '#2C8484', zema: '#E07A23', renan_santos: '#6B3D8B', augusto_cury: '#C9A227' };
        const vals = E.encuestas.flatMap(p => cands.map(c => p[c.c])).filter(v => v != null);
        const ymin = vista === '2v' ? Math.max(0, Math.floor((Math.min(...vals) - 1) / 5) * 5) : 0;
        const ymax = Math.ceil((Math.max(...vals) + 2) / 5) * 5;
        const ticks = []; for (let v = ymin; v <= ymax; v += (ymax - ymin > 30 ? 10 : 5)) ticks.push(v);
        const t0 = Math.min(...E.encuestas.map(p => p.t)), t1 = Math.max(...E.encuestas.map(p => p.t));
        const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const meses = [];
        for (let y = 2025; y <= 2026; y++) for (let m = 0; m < 12; m++) {
          const ini = y + (new Date(y, m, 1) - new Date(y, 0, 1)) / ((new Date(y + 1, 0, 1) - new Date(y, 0, 1)));
          if (ini > t0 - 0.012 && ini < t1 + 0.012) meses.push({ t: ini, lbl: MESES[m] + (m === 0 ? ` ${y}` : '') });
        }
        const capas = [];
        // puntos solo para los dos protagonistas (los chicos quedan como línea, para no ensuciar)
        cands.filter(c => c.c === 'lula' || c.c === 'flavio').forEach(c => capas.push({ tipo: 'puntos', datos: E.encuestas.filter(p => p[c.c] != null).map(p => ({ t: p.t, v: p[c.c] })), color: COLS[c.c], r: 6.5 }));
        cands.forEach((c, k) => {
          const ag = E.agregado[c.c], ult = ag[ag.length - 1];
          const prota = c.c === 'lula' || c.c === 'flavio';
          capas.push({ tipo: 'linea', datos: ag.map(p => ({ t: p.t, v: p.v })), color: COLS[c.c], grosor: prota ? 6 : 3.5, delay: k * 120,
            etiquetaFinal: [fmt(ult.v, 1) + '%', c.nm.replace('Flávio Bolsonaro', 'Flávio').replace('Ronaldo ', '').replace('Romeu ', '').replace('Augusto ', '')], tamFinal: prota ? 30 : 22 });
        });
        const fechaTxt = f => { const [y, m, d] = f.split('-'); return `${+d} de ${MESES[+m - 1]}`; };
        const serieT = E.agregado[cands[0].c];
        dibujarTiempo(box, {
          x: [t0 - 0.01, t1 + 0.012], y: { min: ymin, max: ymax, ticks, fmt: v => v + '%' }, gob: false,
          xticksPos: meses, m: { r: 250, t: 24 }, capas, gapFinal: vista === '1v' ? 32 : 40,
          tips: serieT.map(p => p.t),
          tip: t => {
            const i = serieT.findIndex(p => p.t === t), f = serieT[i].f;
            const filas = cands.map(c => { const p = E.agregado[c.c].find(z => z.t === t); return p ? { nm: c.nm, val: fmt(p.v, 1) + '%', color: COLS[c.c] } : null; }).filter(Boolean);
            const cerca = E.encuestas.filter(p => Math.abs(p.t - t) <= 3.5 / 365).slice(-4)
              .map(p => `${p.enc} (${p.campo}): Lula ${fmt(p.lula, 0)} · Flávio ${fmt(p.flavio, 0)}`);
            return { html: tipHTML(`Promedio al ${fechaTxt(f)}`, filas, cerca.length ? cerca.join('<br>') : null), puntos: filas.map((r, k) => ({ v: E.agregado[cands[k].c].find(z => z.t === t).v, color: r.color })) };
          },
        });
      },
    },
    { id: 'mapa', kicker: 'Elecciones', corto: 'Mapa de resultados', mapa: true },
  ];

  /* ================= montaje ================= */
  const esc = document.getElementById('escenario');
  const params = new URLSearchParams(location.search);
  const modoPNG = params.has('png');
  if (modoPNG) document.body.classList.add('sin-anim');
  let actual = -1, vistaDe = {};

  function escalar() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    esc.style.transform = `scale(${s})`;
    esc.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    esc.style.top = (innerHeight - 1080 * s) / 2 + 'px';
  }

  function render(i) {
    const P = PLACAS[i];
    if (window.Mapa) window.Mapa.desmontar();
    esc.innerHTML = '';
    const sec = document.createElement('section');
    if (P.mapa) {
      sec.className = 'placa placa-mapa';
      esc.appendChild(sec);
      window.Mapa.montar(sec);
      return;
    }
    const vista = P.vistas ? (vistaDe[P.id] || P.vistas[0].id) : null;
    const V = P.vistas ? P.vistas.find(v => v.id === vista) : P;
    sec.className = 'placa';
    sec.innerHTML = `
      <div class="kicker">Brasil 2026 <span class="sep">·</span> ${P.kicker}</div>
      <h1 class="titulo">${typeof V.titulo === 'function' ? V.titulo() : V.titulo}</h1>
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
    history.replaceState(null, '', '#' + P.id + (v && P.vistas && v !== P.vistas[0].id ? '?vista=' + v : ''));
  }
  function ir(i) {
    i = (i + PLACAS.length) % PLACAS.length;
    actual = i;
    const P = PLACAS[i];
    if (!location.hash.startsWith('#' + P.id)) history.replaceState(null, '', '#' + P.id);
    render(i);
    syncHash();
    document.querySelectorAll('#nav .np').forEach((b, k) => b.classList.toggle('on', k === i));
  }
  function desdeHash() {
    const h = location.hash.slice(1).split('?')[0];
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const i = PLACAS.findIndex(p => p.id === h);
    if (i >= 0 && q.get('vista')) vistaDe[PLACAS[i].id] = q.get('vista');
    return i >= 0 ? i : 0;
  }

  // navegación (barra inferior que se oculta sola + índice)
  function armarNav() {
    if (modoPNG) return;
    const nav = document.createElement('div'); nav.id = 'nav';
    const prev = document.createElement('button'); prev.textContent = '←'; prev.onclick = () => ir(actual - 1); nav.appendChild(prev);
    PLACAS.forEach((p, k) => { const b = document.createElement('button'); b.className = 'np'; b.textContent = k + 1; b.title = p.corto; b.onclick = () => ir(k); nav.appendChild(b); });
    const next = document.createElement('button'); next.textContent = '→'; next.onclick = () => ir(actual + 1); nav.appendChild(next);
    const ay = document.createElement('span'); ay.className = 'ayuda'; ay.textContent = 'G índice · F pantalla completa · T vista'; nav.appendChild(ay);
    document.body.appendChild(nav);
    const ind = document.createElement('div'); ind.id = 'indice';
    ind.innerHTML = '<h2>Placas · Brasil 2026</h2><div class="g">' + PLACAS.map((p, k) =>
      `<a href="#${p.id}" data-k="${k}"><small>${k + 1} · ${p.kicker}</small>${p.corto}</a>`).join('') + '</div>';
    ind.addEventListener('click', e => { const a = e.target.closest('a'); if (a) { e.preventDefault(); ind.classList.remove('on'); ir(+a.dataset.k); } });
    document.body.appendChild(ind);
    let tm = null;
    const mostrar = () => {
      nav.classList.remove('oculto'); document.body.classList.remove('cursor-oculto');
      clearTimeout(tm); tm = setTimeout(() => { nav.classList.add('oculto'); document.body.classList.add('cursor-oculto'); }, 2500);
    };
    addEventListener('mousemove', mostrar); addEventListener('touchstart', mostrar, { passive: true }); mostrar();
    const g = document.createElement('div'); g.id = 'girar';
    g.textContent = 'Girá el teléfono para ver la placa más grande. Deslizá a los costados para cambiar de placa.';
    document.body.appendChild(g);
  }

  // teléfono: deslizar a los costados cambia de placa (un toque sigue funcionando como siempre)
  let toque = null;
  addEventListener('touchstart', e => { if (e.touches.length === 1) toque = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  addEventListener('touchend', e => {
    if (!toque || modoPNG) return;
    const t = e.changedTouches[0], dx = t.clientX - toque.x, dy = t.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.5 * Math.abs(dy)) ir(actual + (dx < 0 ? 1 : -1));
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' '].includes(k)) { e.preventDefault(); ir(actual + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); ir(actual - 1); }
    else if (k === 'Home') ir(0);
    else if (k === 'End') ir(PLACAS.length - 1);
    else if (k === 'g' || k === 'G') document.getElementById('indice')?.classList.toggle('on');
    else if (k === 'f' || k === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
    else if ((k === 't' || k === 'T') && PLACAS[actual].vistas) {
      const P = PLACAS[actual], vs = P.vistas.map(v => v.id), cur = vistaDe[P.id] || vs[0];
      vistaDe[P.id] = vs[(vs.indexOf(cur) + 1) % vs.length]; render(actual); syncHash();
    }
  });
  addEventListener('resize', escalar);
  addEventListener('hashchange', () => { const i = desdeHash(); if (i !== actual) ir(i); });

  escalar();
  armarNav();
  // cargar las fuentes ANTES de medir (si no, el gráfico se mide con la tipografía de reemplazo)
  const fuentes = document.fonts ? Promise.all([
    '700 62px "Source Serif 4"', 'italic 400 31px "Source Serif 4"', '400 24px "Source Sans 3"',
    '600 20px "Source Sans 3"', '700 24px "Source Sans 3"', 'italic 400 20px "Source Sans 3"',
  ].map(f => document.fonts.load(f))).catch(() => null) : Promise.resolve();
  Promise.race([fuentes, new Promise(r => setTimeout(r, 2500))]).then(() => {
    ir(desdeHash());
    // red de seguridad: si la tipografía llegó tarde (conexión lenta), se re-acomoda la placa una vez
    if (document.fonts && !document.fonts.check('700 58px "Source Serif 4"')) {
      document.fonts.addEventListener('loadingdone', () => render(actual), { once: true });
    }
  });
  window.PLACAS = PLACAS;
})();
