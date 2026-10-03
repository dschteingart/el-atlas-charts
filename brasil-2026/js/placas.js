/* Placas de la cobertura: definición de cada una (bilingüe ES/EN) + navegación + descargas.
   Teclas: ← → (o PageUp/PageDown del clicker) cambian de placa · G índice ·
   F pantalla completa · T cambia la vista de la placa (si tiene) · Esc sale del zoom del mapa.
   Cada placa tiene su URL: index.html#pib, #desempleo, ..., #mapa (para escenas de OBS).
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
        { id: '1v', nm: T('1ª vuelta', '1st round'), titulo: () => tituloEncuestas('1v'), bajada: () => bajadaEncuestas('1v') },
        { id: '2v', nm: T('2ª vuelta', '2nd round'), titulo: () => tituloEncuestas('2v'), bajada: () => bajadaEncuestas('2v') },
      ],
      fuente: v => {
        const E = window.ENCUESTAS; if (!E) return '';
        return T(`<b>Fuente:</b> ${E[v].encuestadoras.join(', ')} (${E[v].n_encuestas} encuestas). Cada punto es una encuesta; la línea es el promedio ponderado por cercanía en el tiempo y tamaño de muestra, donde las encuestadoras que publican más seguido pesan menos.`,
          `<b>Source:</b> ${E[v].encuestadoras.join(', ')} (${E[v].n_encuestas} polls). Each dot is a poll; the line is an average weighted by recency and sample size, in which pollsters that publish more often weigh less.`) +
          (v === '1v' ? T(' Hasta marzo, algunos escenarios incluían candidatos que finalmente no se presentaron.', ' Until March, some scenarios included candidates who ultimately did not run.') : '');
      },
      datos: v => {
        const E = window.ENCUESTAS[v];
        const cands = E.cands.map(c => c.c);
        const cols = [T('tipo', 'type'), T('encuestadora', 'pollster'), T('trabajo_de_campo', 'fieldwork'), T('fecha_media_del_campo', 'fieldwork_midpoint'), T('muestra', 'sample_size'), ...cands.map(c => c + '_pct')];
        const dia = t => { const y = Math.floor(t), d = new Date(Date.UTC(y, 0, 1) + Math.round((t - y) * 365.25) * 864e5); return d.toISOString().slice(0, 10); };
        const filas = E.encuestas.map(p => [T('encuesta', 'poll'), p.enc, p.campo, dia(p.t), p.n, ...cands.map(c => p[c])]);
        const fechas = E.agregado[cands[0]].map(p => p.f);
        fechas.forEach((f, i) => filas.push([T('promedio', 'average'), '', '', f, '', ...cands.map(c => (E.agregado[c] && E.agregado[c][i] ? E.agregado[c][i].v : null))]));
        return { archivo: v === '1v' ? T('encuestas-primera-vuelta', 'polls-first-round') : T('encuestas-balotaje', 'polls-runoff'), cols, filas };
      },
      render(box, vista) {
        const E = window.ENCUESTAS && window.ENCUESTAS[vista];
        if (!E) { box.innerHTML = `<div class="aviso">${T('Datos de encuestas pendientes.', 'Poll data pending.')}</div>`; return; }
        const cands = E.cands.filter(c => E.agregado[c.c]);
        const COLS = { lula: '#C8372D', flavio: AZUL, caiado: '#2C8484', zema: '#E07A23', renan_santos: '#6B3D8B', augusto_cury: '#C9A227' };
        const vals = E.encuestas.flatMap(p => cands.map(c => p[c.c])).filter(v => v != null);
        const ymin = vista === '2v' ? Math.max(0, Math.floor((Math.min(...vals) - 1) / 5) * 5) : 0;
        const ymax = Math.ceil((Math.max(...vals) + 2) / 5) * 5;
        const ticks = []; for (let v = ymin; v <= ymax; v += (ymax - ymin > 30 ? 10 : 5)) ticks.push(v);
        const t0 = Math.min(...E.encuestas.map(p => p.t)), t1 = Math.max(...E.encuestas.map(p => p.t));
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
        const fechaTxt = f => { const [, m, d] = f.split('-'); return T(`${+d} de ${MESES[+m - 1]}`, `${MESES[+m - 1]} ${+d}`); };
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
            return { html: tipHTML(T(`Promedio al ${fechaTxt(f)}`, `Average as of ${fechaTxt(f)}`), filas, cerca.length ? cerca.join('<br>') : null), puntos: filas.map((r, k) => ({ v: E.agregado[cands[k].c].find(z => z.t === t).v, color: r.color })) };
          },
        });
      },
    },
    { id: 'mapa', kicker: T('Elecciones', 'Elections'), corto: T('Mapa de resultados', 'Results map'), mapa: true },
  ];

  /* ================= montaje ================= */
  const esc = document.getElementById('escenario');
  const params = new URLSearchParams(location.search);
  const modoPNG = params.has('png');
  if (modoPNG) document.body.classList.add('sin-anim');
  // en la web la barra queda siempre visible (para encontrar las descargas); en la copia local
  // (streaming) se esconde sola para no ensuciar la pantalla
  const EN_LA_WEB = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const BARRA_FIJA = EN_LA_WEB && !modoPNG;
  let actual = -1, vistaDe = {};

  function escalar() {
    const reserva = BARRA_FIJA ? 62 : 0;
    const h = innerHeight - reserva;
    const s = Math.min(innerWidth / 1920, h / 1080);
    esc.style.transform = `scale(${s})`;
    esc.style.left = (innerWidth - 1920 * s) / 2 + 'px';
    esc.style.top = Math.max(0, (h - 1080 * s) / 2) + 'px';
  }

  function vistaActual(P) { return P.vistas ? (vistaDe[P.id] || P.vistas[0].id) : null; }

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
    const vista = vistaActual(P);
    const V = P.vistas ? P.vistas.find(v => v.id === vista) : P;
    sec.className = 'placa';
    sec.innerHTML = `
      <div class="kicker">${T('Brasil 2026', 'Brazil 2026')} <span class="sep">·</span> ${P.kicker}</div>
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
    history.replaceState(null, '', location.pathname + location.search + '#' + P.id + (v && P.vistas && v !== P.vistas[0].id ? '?vista=' + v : ''));
  }
  function ir(i) {
    i = (i + PLACAS.length) % PLACAS.length;
    actual = i;
    const P = PLACAS[i];
    if (!location.hash.startsWith('#' + P.id)) history.replaceState(null, '', location.pathname + location.search + '#' + P.id);
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
    fiscal: '09-fiscal', comercio: '10-comercio-argentina', 'encuestas:1v': '11a-encuestas-1ra-vuelta', 'encuestas:2v': '11b-encuestas-2da-vuelta', mapa: '12d-mapa-2022-2v-municipios',
  };
  async function descargarPNG(btn) {
    const P = PLACAS[actual], v = vistaActual(P);
    const r = RESPALDO[P.id + (v ? ':' + v : '')] || RESPALDO[P.id];
    btn.disabled = true;
    try { await window.Exportar.png(nombreArchivo(P), r ? `png/${EN ? 'en/' : ''}${r}.png` : null); } finally { btn.disabled = false; }
  }

  /* ---------- navegación (barra inferior + índice) ---------- */
  function cambiarIdioma(lang) {
    const q = new URLSearchParams(location.search);
    if (lang === 'en') q.set('lang', 'en'); else q.delete('lang');
    location.href = location.pathname + (q.toString() ? '?' + q : '') + location.hash;
  }
  function armarNav() {
    if (modoPNG) return;
    const nav = document.createElement('div'); nav.id = 'nav';
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
    if (!EN_LA_WEB) { const ay = document.createElement('span'); ay.className = 'ayuda'; ay.textContent = T('G índice · F pantalla completa · T vista', 'G index · F full screen · T view'); nav.appendChild(ay); }
    document.body.appendChild(nav);
    const ind = document.createElement('div'); ind.id = 'indice';
    ind.innerHTML = `<h2>${T('Placas · Brasil 2026', 'Charts · Brazil 2026')}</h2><div class="g">` + PLACAS.map((p, k) =>
      `<a href="#${p.id}" data-k="${k}"><small>${k + 1} · ${p.kicker}</small>${p.corto}</a>`).join('') + '</div>';
    ind.addEventListener('click', e => { const a = e.target.closest('a'); if (a) { e.preventDefault(); ind.classList.remove('on'); ir(+a.dataset.k); } });
    document.body.appendChild(ind);
    if (!BARRA_FIJA) {
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

  document.documentElement.lang = EN ? 'en' : 'es';
  if (EN) document.title = 'Brazil elections — The Atlas';
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
