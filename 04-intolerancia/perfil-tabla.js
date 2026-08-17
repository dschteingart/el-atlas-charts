// =============================================================
//  El Atlas N°4 — CHART 26 «El perfil de cada región»
// =============================================================
//
// Tabla resumen: cinco indicadores del número, uno por columna, y una fila por
// región (o por país). Cada celda trae el VALOR y un nivel cualitativo, que es
// lo que permite leer una fila entera como un perfil.
//
// POR QUÉ EL NIVEL Y NO EL VALOR PINTAN LA CELDA
// ----------------------------------------------
// Las cinco columnas están en escalas incomparables: un índice de 0 a 1, tres
// porcentajes con rangos muy distintos y un Gini que se mueve entre 30 y 46.
// Pintar por valor haría que la columna del Gini se viera "toda alta" y la del
// índice "toda baja", que es un artefacto de las unidades. Así que el color
// codifica la POSICIÓN de la fila dentro de su columna —el percentil— y el
// número, que está impreso, dice el valor real.
//
// El percentil se calcula entre las filas QUE SE ESTÁN MOSTRANDO: entre las
// nueve regiones en una vista y entre los países elegidos en la otra. Por eso
// no viene precalculado en data-perfil.js.
//
// Inputs (data-perfil.js): PF_META, PF_REG, PF_PAIS, PF_NOMBRE, PF_REGION_DE.
// State (state[26]): vista ('regiones'|'paises'), selected[], orden, ordenAsc.

//==================================================================
//  Constantes
//==================================================================
const PF_NS = 'http://www.w3.org/2000/svg';
const pf_ns = (t) => document.createElementNS(PF_NS, t);

// Cinco niveles, cinco tonos de la rampa del número: oscuro = alto.
const PF_NIVELES = ['bajo', 'medio-bajo', 'medio', 'medio-alto', 'alto'];
const PF_COLORES = ['#F4E4CE', '#E8B98C', '#D98E5B', '#B85A2C', '#7A3418'];
// Tinta del texto por nivel, elegida por contraste medido contra cada tono
// (misma disciplina que la matriz del chart 12: el gris apagado sobre el
// naranja oscuro daba 1,4 de contraste y era ilegible).
const PF_TINTA  = ['#2E2A25', '#2E2A25', '#2E2A25', '#FBF8F1', '#FBF8F1'];
const PF_BG = '#FBF8F1';
const PF_INK = '#3A3530', PF_SOFT = '#7A6E62', PF_RULE = '#E5DDD0';

// Países por default en la vista de países: los once latinoamericanos que
// tienen las cinco columnas, más cinco referencias del resto del mundo.
const PF_DEFAULT_PAISES = ['ARG', 'BRA', 'CHL', 'URY', 'COL', 'MEX',
                           'USA', 'ESP', 'IND', 'ZAF'];

//==================================================================
//  Helpers
//==================================================================
function pf_lang() { return (typeof LANG !== 'undefined') ? LANG : 'es'; }
function pf_t(k) { return (typeof t === 'function') ? t(k) : k; }
function pf_fmt(v, d) { return (typeof fmt === 'function') ? fmt(v, d) : String(v); }
function pf_isMobile() {
  return (typeof isMobileViewport === 'function') ? isMobileViewport()
    : (window.innerWidth || document.documentElement.clientWidth) < 768;
}
function pf_measure(txt, fs, w) {
  if (!pf_measure._c) pf_measure._c = document.createElement('canvas').getContext('2d');
  pf_measure._c.font = (w || 400) + ' ' + fs + 'px "Source Sans 3", system-ui, sans-serif';
  return pf_measure._c.measureText(txt).width;
}
function pf_colLabel(c) { return pf_lang() === 'en' ? c.en : c.es; }
function pf_regLabel(r) { return pf_t('reg.' + r); }
function pf_paisLabel(iso) {
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso]) {
    return COUNTRY_NAMES[iso][pf_lang()] || COUNTRY_NAMES[iso].en || iso;
  }
  return (typeof PF_NOMBRE !== 'undefined' && PF_NOMBRE[iso]) || iso;
}

//==================================================================
//  Datos: filas de la vista activa
//==================================================================
// Cada fila: { id, label, celdas: {col: {v, n, y0, y1}} }. La vista de regiones
// trae n y rango de años; la de países, un año por celda y n implícito = 1.
function pf_filas() {
  const s = state[26];
  if (s.vista === 'paises') {
    return (s.selected || []).filter(i => PF_PAIS[i]).map(iso => {
      const celdas = {};
      PF_META.cols.forEach(c => {
        const d = PF_PAIS[iso][c.k];
        if (d) celdas[c.k] = { v: d[0], n: 1, y0: d[1], y1: d[1] };
      });
      return { id: iso, label: pf_paisLabel(iso), celdas: celdas };
    });
  }
  return PF_META.regiones.filter(r => PF_REG[r]).map(r => {
    const celdas = {};
    PF_META.cols.forEach(c => {
      const d = PF_REG[r][c.k];
      if (d) celdas[c.k] = { v: d[0], n: d[1], y0: d[2], y1: d[3] };
    });
    return { id: r, label: pf_regLabel(r), celdas: celdas };
  });
}

// ---------------------------------------------------------------------------
//  Niveles: una escala por vista, y ninguna depende de lo que se muestre
// ---------------------------------------------------------------------------
// PAÍSES → cortes FIJOS: los quintiles de la distribución de todos los países
// con dato en esa columna. Antes el percentil se calculaba entre las filas
// mostradas y eso tenía dos problemas (reporte de Daniel 2026-08-01): con 10
// países elegidos el reparto salía siempre 2 de cada nivel por columna, sin
// importar los valores —el color era un ranking interno de la selección
// disfrazado de nivel—, y el nivel de un país cambiaba al agregar o sacar
// otros (34 de 50 celdas de la selección por default).
//
// REGIONES → percentil entre las NUEVE regiones, que es lo que había. Se probó
// medirlas con la vara de países y no sirve: son promedios, así que se juntan
// cerca de la mediana mundial y la tabla queda casi toda en "medio" (en Gini,
// cinco de nueve). Acá el universo son las nueve y siempre se muestran las
// nueve, así que el percentil ya es estable: no depende de la selección porque
// no hay selección. La contrapartida —que el nivel es ranking entre regiones y
// no posición mundial— la dicen la leyenda y la nota de esta vista.
let PF_CORTES = null;
function pf_cuantil(ordenados, p) {
  if (!ordenados.length) return null;
  const i = (ordenados.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? ordenados[lo] : ordenados[lo] + (ordenados[hi] - ordenados[lo]) * (i - lo);
}
function pf_cortes() {
  if (PF_CORTES) return PF_CORTES;
  PF_CORTES = {};
  const isos = Object.keys(PF_PAIS);
  PF_META.cols.forEach(c => {
    const vs = isos.filter(i => PF_PAIS[i][c.k]).map(i => PF_PAIS[i][c.k][0]).sort((a, b) => a - b);
    PF_CORTES[c.k] = { n: vs.length, q: [0.2, 0.4, 0.6, 0.8].map(p => pf_cuantil(vs, p)) };
  });
  return PF_CORTES;
}
function pf_niveles(filas) {
  // El nivel se invierte cuando el indicador apunta al revés (más = mejor),
  // para que "alto" signifique siempre lo mismo en la lectura del perfil.
  const out = {};
  if (state[26].vista === 'paises') {
    const cortes = pf_cortes();
    PF_META.cols.forEach(c => {
      const q = cortes[c.k].q;
      if (!q.length || q[0] === null) return;
      filas.forEach(f => {
        const celda = f.celdas[c.k];
        if (!celda) return;
        let k = 0;
        while (k < q.length && celda.v >= q[k]) k++;   // 0 = bajo … 4 = alto
        out[pf_key(f.id, c.k)] = c.peorEsMas ? k : 4 - k;
      });
    });
    return out;
  }
  PF_META.cols.forEach(c => {
    const vs = filas.filter(f => f.celdas[c.k]).map(f => ({ id: f.id, v: f.celdas[c.k].v }));
    vs.sort((a, b) => a.v - b.v);
    const n = vs.length;
    vs.forEach((x, i) => {
      const p = n > 1 ? (i + 0.5) / n : 0.5;
      const q = c.peorEsMas ? p : (1 - p);
      out[pf_key(x.id, c.k)] = Math.min(4, Math.floor(q * 5));
    });
  });
  return out;
}
// Clave de una celda en el mapa de niveles: fila + columna.
function pf_key(id, col) { return id + " " + col; }

function pf_ordenar(filas) {
  const s = state[26];
  const c = s.orden;
  if (!c) return filas;
  const dir = s.ordenAsc ? 1 : -1;
  return filas.slice().sort((a, b) => {
    const va = a.celdas[c] ? a.celdas[c].v : -Infinity;
    const vb = b.celdas[c] ? b.celdas[c].v : -Infinity;
    return dir * (va - vb);
  });
}

//==================================================================
//  Render
//==================================================================
function drawPerfilTabla() {
  const svg = document.getElementById('chart26');
  if (!svg || typeof PF_META === 'undefined') return;
  svg.innerHTML = '';
  pf_updateTextos();

  const editorFormat = (typeof getActivePngFormat === 'function') ? getActivePngFormat() : null;
  const bigPng = editorFormat === 'square' || editorFormat === 'newsletter' || editorFormat === 'mobile';
  const mobile = !editorFormat && pf_isMobile();
  const big = bigPng || mobile;
  if (typeof applyFormatWrapper === 'function') applyFormatWrapper(svg, editorFormat);

  const S = bigPng ? { fila: 26, valor: 25, nivel: 19, head: 21, n: 16 }
          : mobile ? { fila: 21, valor: 21, nivel: 16, head: 17, n: 14 }
                   : { fila: 13, valor: 15, nivel: 11.5, head: 12, n: 10 };

  const filas = pf_ordenar(pf_filas());
  const niveles = pf_niveles(filas);
  const cols = PF_META.cols;
  if (!filas.length) return;

  const W = editorFormat ? PNG_FORMATS[editorFormat].vbW : 1100;

  // Ancho de la columna de nombres: el más largo, medido.
  // Ancho de la columna de nombres, con tope: un nombre larguísimo no puede
  // comerse la tabla. Si no entra en el tope, la tipografía de los nombres se
  // achica hasta que entre — recortar el margen sin achicar la letra hacía que
  // "América del Norte, Australia y N.Z." se dibujara en x negativo y quedara
  // cortado contra el borde del lienzo en los formatos de exportación.
  const topeLbl = W * 0.32;
  let maxLbl = 0;
  filas.forEach(f => { const w = pf_measure(f.label, S.fila, 600); if (w > maxLbl) maxLbl = w; });
  if (maxLbl > topeLbl) {
    S.fila = Math.max(8, S.fila * (topeLbl / maxLbl));
    maxLbl = 0;
    filas.forEach(f => { const w = pf_measure(f.label, S.fila, 600); if (w > maxLbl) maxLbl = w; });
  }
  const M = { top: 0, right: big ? 16 : 12, left: Math.ceil(maxLbl) + (big ? 22 : 14), bottom: big ? 74 : 52 };
  const nC = cols.length;
  const cellW = (W - M.left - M.right) / nC;

  // El margen superior sale de CUÁNTOS RENGLONES ocupa el encabezado más largo,
  // no de una constante: en los formatos de exportación la tipografía se duplica
  // y "Sufrió discriminación por su color de piel" pasa de dos renglones a
  // cuatro, que con un tope fijo se salían por arriba del lienzo.
  const lineasHead = cols.map(c => pf_wrap(pf_colLabel(c), cellW - 14, S.head));
  const maxLineas = Math.max.apply(null, lineasHead.map(l => l.length));
  M.top = Math.ceil(maxLineas * S.head * 1.22) + (big ? 26 : 18);

  // Alto de fila: en pantalla el gráfico crece hacia abajo; en los formatos de
  // PNG el alto es parte de la definición del formato, así que las filas se
  // reparten lo que queda.
  let cellH, H;
  if (editorFormat) {
    H = PNG_FORMATS[editorFormat].vbH;
    cellH = (H - M.top - M.bottom) / filas.length;
    // Y si la fila queda corta, la tipografía de la celda se achica con ella.
    const k = Math.min(1, cellH / (S.valor * 2.5));
    if (k < 1) { S.valor = Math.max(9, S.valor * k); S.nivel = Math.max(7, S.nivel * k); S.fila = Math.max(9, S.fila * k); }
  } else {
    cellH = Math.max(big ? 54 : 40, S.valor * 2.5);
    H = M.top + filas.length * cellH + M.bottom;
  }
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  // ---- Encabezados: horizontales y envueltos en dos renglones. Con cinco
  // columnas hay lugar de sobra, así que no hace falta rotarlos (a diferencia
  // de la matriz del chart 12, que tiene ocho).
  cols.forEach((c, j) => {
    const x = M.left + j * cellW + cellW / 2;
    const lineas = lineasHead[j];
    const esOrden = (state[26].orden === c.k);
    lineas.forEach((ln, i) => {
      const tx = pf_ns('text');
      tx.setAttribute('x', x);
      tx.setAttribute('y', M.top - 14 - (lineas.length - 1 - i) * S.head * 1.22);
      tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      tx.style.fontSize = S.head + 'px';
      tx.setAttribute('font-weight', esOrden ? 600 : 500);
      tx.setAttribute('fill', esOrden ? '#8B3F1E' : PF_SOFT);
      tx.textContent = ln + (esOrden && i === lineas.length - 1 && !editorFormat
        ? (state[26].ordenAsc ? ' ▲' : ' ▼') : '');
      tx.style.cursor = 'pointer';
      tx.addEventListener('click', () => pf_ordenarPor(c.k));
      svg.appendChild(tx);
    });
  });

  // ---- Filas
  filas.forEach((f, i) => {
    const y = M.top + i * cellH;

    const lbl = pf_ns('text');
    lbl.setAttribute('x', M.left - (big ? 12 : 8));
    lbl.setAttribute('y', y + cellH / 2);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('dominant-baseline', 'central');
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.style.fontSize = S.fila + 'px';
    lbl.setAttribute('font-weight', 600);
    lbl.setAttribute('fill', PF_INK);
    lbl.textContent = f.label;
    svg.appendChild(lbl);

    cols.forEach((c, j) => {
      const x = M.left + j * cellW;
      const celda = f.celdas[c.k];
      const rect = pf_ns('rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', cellW); rect.setAttribute('height', cellH);
      rect.setAttribute('stroke', PF_BG); rect.setAttribute('stroke-width', 1.5);
      if (!celda) {
        rect.setAttribute('fill', '#F0EBDF');
        svg.appendChild(rect);
        const sd = pf_ns('text');
        sd.setAttribute('x', x + cellW / 2); sd.setAttribute('y', y + cellH / 2);
        sd.setAttribute('text-anchor', 'middle'); sd.setAttribute('dominant-baseline', 'central');
        sd.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
        sd.style.fontSize = S.nivel + 'px'; sd.setAttribute('fill', '#B5AB9B');
        sd.textContent = pf_t('c26-nodata');
        svg.appendChild(sd);
        return;
      }
      const niv = niveles[pf_key(f.id, c.k)];
      rect.setAttribute('fill', PF_COLORES[niv]);
      rect.style.cursor = 'pointer';
      const mostrar = (ev) => pf_tooltip(ev, f, c, celda, niv);
      rect.addEventListener('mouseenter', mostrar);
      rect.addEventListener('click', mostrar);
      rect.addEventListener('mousemove', pf_posTooltip);
      rect.addEventListener('mouseleave', pf_hideTooltip);
      svg.appendChild(rect);

      // Jerarquía de la celda: primero el NIVEL, que es lo que se lee de un
      // vistazo para armar el perfil de la fila, y debajo el valor en chico,
      // que es el respaldo (pedido de Daniel 2026-07-31).
      const val = pf_ns('text');
      val.setAttribute('x', x + cellW / 2); val.setAttribute('y', y + cellH * 0.71);
      val.setAttribute('text-anchor', 'middle'); val.setAttribute('dominant-baseline', 'central');
      val.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      val.style.fontSize = S.nivel + 'px';
      val.setAttribute('font-weight', 500);
      val.setAttribute('font-variant-numeric', 'tabular-nums');
      val.setAttribute('fill', PF_TINTA[niv]);
      val.style.pointerEvents = 'none';
      // Sin marca de "pocos países" en la celda: la advertencia vive en el
      // tooltip, que dice sobre cuántos se calcula ("14 de 19"). Un asterisco
      // suelto obliga a buscar qué significa (reporte de Daniel 2026-08-01).
      val.textContent = pf_fmt(celda.v, c.dec) + c.uni;
      svg.appendChild(val);

      const niveltx = pf_ns('text');
      niveltx.setAttribute('x', x + cellW / 2); niveltx.setAttribute('y', y + cellH * 0.37);
      niveltx.setAttribute('text-anchor', 'middle'); niveltx.setAttribute('dominant-baseline', 'central');
      niveltx.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
      niveltx.style.fontSize = S.valor + 'px';
      niveltx.setAttribute('font-weight', 600);
      niveltx.setAttribute('fill', PF_TINTA[niv]);
      val.setAttribute('fill-opacity', 0.88);
      niveltx.style.pointerEvents = 'none';
      niveltx.textContent = pf_t('c26-niv-' + PF_NIVELES[niv].replace('-', ''));
      svg.appendChild(niveltx);
    });
  });

  pf_leyenda(svg, M, W, M.top + filas.length * cellH + (big ? 34 : 24), S, big);
}

// Corta un texto en renglones que entren en `ancho`.
function pf_wrap(txt, ancho, fs) {
  const palabras = txt.split(' ');
  const out = []; let cur = '';
  palabras.forEach(p => {
    const t2 = cur ? cur + ' ' + p : p;
    if (pf_measure(t2, fs, 500) > ancho && cur) { out.push(cur); cur = p; } else cur = t2;
  });
  if (cur) out.push(cur);
  return out;
}

function pf_leyenda(svg, M, W, y, S, big) {
  const swW = big ? 92 : 66, swH = big ? 13 : 10;
  const x0 = M.left;
  const tit = pf_ns('text');
  tit.setAttribute('x', x0); tit.setAttribute('y', y - (big ? 9 : 7));
  tit.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  tit.style.fontSize = S.n + 'px'; tit.setAttribute('fill', PF_SOFT); tit.setAttribute('font-weight', 600);
  // La escala no es la misma en las dos vistas (ver pf_niveles), así que la
  // leyenda tiene que decir contra qué se compara en cada una.
  tit.textContent = pf_t(state[26].vista === 'paises' ? 'c26-legend-paises' : 'c26-legend-reg');
  svg.appendChild(tit);
  PF_NIVELES.forEach((nv, i) => {
    const sw = pf_ns('rect');
    sw.setAttribute('x', x0 + i * swW); sw.setAttribute('y', y);
    sw.setAttribute('width', swW); sw.setAttribute('height', swH);
    sw.setAttribute('fill', PF_COLORES[i]);
    svg.appendChild(sw);
    const lb = pf_ns('text');
    lb.setAttribute('x', x0 + i * swW + swW / 2); lb.setAttribute('y', y + swH + (big ? 18 : 13));
    lb.setAttribute('text-anchor', 'middle');
    lb.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lb.style.fontSize = S.n + 'px'; lb.setAttribute('fill', PF_SOFT);
    lb.textContent = pf_t('c26-niv-' + nv.replace('-', ''));
    svg.appendChild(lb);
  });
}

//==================================================================
//  Tooltip
//==================================================================
function pf_tooltip(ev, fila, col, celda, niv) {
  const tt = document.getElementById('tooltip26');
  if (!tt) return;
  const anios = (celda.y0 === celda.y1) ? String(celda.y0) : (celda.y0 + '-' + celda.y1);
  const nLinea = (celda.n > 1)
    ? '<div class="tt-row"><span>' + pf_t('c26-tt-n') + '</span><span>' + celda.n +
      (PF_META.totalReg[fila.id] ? (' ' + pf_t('c26-tt-de') + ' ' + PF_META.totalReg[fila.id]) : '') + '</span></div>'
    : '';
  tt.innerHTML =
    '<strong>' + fila.label + '</strong>' +
    '<div class="tt-sub">' + pf_colLabel(col) + '</div>' +
    '<div class="tt-row tt-row-strong"><span>' + pf_t('c26-tt-valor') + '</span><span>' +
      pf_fmt(celda.v, col.dec) + col.uni + '</span></div>' +
    '<div class="tt-row"><span>' + pf_t('c26-tt-nivel') + '</span><span>' +
      pf_t('c26-niv-' + PF_NIVELES[niv].replace('-', '')) + '</span></div>' +
    nLinea +
    '<div class="tt-row"><span>' + pf_t('c26-tt-anio') + '</span><span>' + anios + '</span></div>';
  tt.style.display = 'block'; tt.style.opacity = '1';
  pf_posTooltip(ev);
}
function pf_posTooltip(ev) {
  const tt = document.getElementById('tooltip26');
  if (!tt || !tt.parentElement) return;
  const wrap = tt.parentElement.getBoundingClientRect();
  const cx = (typeof evClientX === 'function') ? evClientX(ev) : ev.clientX;
  const cy = (typeof evClientY === 'function') ? evClientY(ev) : ev.clientY;
  const x = cx - wrap.left, y = cy - wrap.top;
  let px = x + 14, py = y - tt.offsetHeight - 8;
  if (px + tt.offsetWidth > wrap.width) px = x - tt.offsetWidth - 14;
  if (py < 0) py = y + 18;
  tt.style.left = px + 'px'; tt.style.top = py + 'px';
}
function pf_hideTooltip() { const tt = document.getElementById('tooltip26'); if (tt) tt.style.opacity = '0'; }

//==================================================================
//  Textos
//==================================================================
function pf_updateTextos() {
  const bloque = document.querySelector('.chart-block[data-chart="26"]');
  if (!bloque) return;
  // El texto custom del editor manda (criterio 5 de la auditoria): el subtitulo
  // y la nota dinamicos solo se aplican si Daniel NO los customizo en ?nl=1.
  const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
  const aeLang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
  const tx = (ae && ae.texts && ae.texts[aeLang]) || {};
  const sub = bloque.querySelector('.chart-subtitle');
  if (sub && !(tx.subtitle || '').trim()) sub.textContent = pf_t(state[26].vista === 'paises' ? 'c26-subtitle-paises' : 'c26-subtitle-reg');
  const nota = pf_t(state[26].vista === 'paises' ? 'c26-sources-paises' : 'c26-sources-reg');
  if (nota && nota.indexOf('c26-') !== 0 && !(tx.caption || '').trim()) {
    document.querySelectorAll('[data-i18n="c26-sources"]').forEach(el => { el.innerHTML = nota; });
  }
}

//==================================================================
//  Controles
//==================================================================
function pf_ordenarPor(col) {
  const s = state[26];
  if (s.orden === col) s.ordenAsc = !s.ordenAsc;
  else { s.orden = col; s.ordenAsc = false; }
  pf_hideTooltip();
  drawPerfilTabla();
}

function setupPerfilVista() {
  const box = document.getElementById('pf-vista');
  if (!box) return;
  const sync = () => box.querySelectorAll('button[data-vista]').forEach(b =>
    b.classList.toggle('active', b.getAttribute('data-vista') === state[26].vista));
  box.querySelectorAll('button[data-vista]').forEach(b => {
    b.addEventListener('click', () => {
      state[26].vista = b.getAttribute('data-vista');
      // El orden vuelve al default: ordenar por una columna en regiones no
      // significa lo mismo que en países, y arrastrarlo confunde más que ayuda.
      state[26].orden = PF_META.cols[0].k;
      state[26].ordenAsc = false;
      sync();
      pf_syncPicker();
      pf_renderChips();
      drawPerfilTabla();
    });
  });
  sync();
}

// El buscador y los chips son de la vista de países: en regiones las filas son
// las nueve regiones y unos chips de países ahí no gobiernan nada.
function pf_syncPicker() {
  const esPaises = state[26].vista === 'paises';
  const wrap = document.getElementById('pf-picker');
  if (wrap) wrap.style.display = esPaises ? '' : 'none';
  const chips = document.getElementById('pf-selected-chips');
  if (chips) chips.style.display = esPaises ? '' : 'none';
}

function pf_renderChips() {
  const cont = document.getElementById('pf-selected-chips');
  if (!cont) return;
  cont.innerHTML = '';
  (state[26].selected || []).forEach(iso => {
    const chip = document.createElement('span');
    chip.className = 'm-selected-chip';
    const dot = document.createElement('span');
    dot.className = 'm-chip-dot';
    const reg = PF_REGION_DE[iso];
    dot.style.background = (typeof REGION_COLORS !== 'undefined' && REGION_COLORS[reg]) || '#888';
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(pf_paisLabel(iso)));
    const x = document.createElement('button');
    x.className = 'm-chip-x'; x.type = 'button'; x.textContent = '×';
    x.addEventListener('click', () => {
      state[26].selected = state[26].selected.filter(c => c !== iso);
      pf_renderChips(); drawPerfilTabla();
    });
    chip.appendChild(x);
    cont.appendChild(chip);
  });
}

function setupPerfilBuscador() {
  const input = document.getElementById('pf-search');
  const res = document.getElementById('pf-search-results');
  if (!input || !res) return;
  const cerrar = () => { res.classList.remove('open'); res.innerHTML = ''; };
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return cerrar();
    const hits = Object.keys(PF_PAIS)
      .filter(i => pf_paisLabel(i).toLowerCase().indexOf(q) >= 0)
      .sort((a, b) => pf_paisLabel(a).localeCompare(pf_paisLabel(b), 'es'))
      .slice(0, 8);
    res.innerHTML = '';
    hits.forEach(iso => {
      const d = document.createElement('div');
      d.className = 'm-search-result' + (state[26].selected.indexOf(iso) >= 0 ? ' m-already' : '');
      d.textContent = pf_paisLabel(iso);
      d.addEventListener('click', () => {
        if (state[26].selected.indexOf(iso) < 0) state[26].selected.push(iso);
        input.value = ''; cerrar(); pf_renderChips(); drawPerfilTabla();
      });
      res.appendChild(d);
    });
    res.classList.toggle('open', hits.length > 0);
  });
  document.addEventListener('click', (e) => { if (!res.contains(e.target) && e.target !== input) cerrar(); });
}

function setupPerfilCSV() {
  document.querySelectorAll('button.download[data-chart="26-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filas = pf_ordenar(pf_filas());
      const niveles = pf_niveles(filas);
      let csv = 'fila,indicador,valor,nivel,n,anio_min,anio_max\n';
      filas.forEach(f => PF_META.cols.forEach(c => {
        const d = f.celdas[c.k];
        if (!d) return;
        csv += [JSON.stringify(f.label), c.k, d.v, PF_NIVELES[niveles[pf_key(f.id, c.k)]],
                d.n, d.y0, d.y1].join(',') + '\n';
      }));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = pf_lang() === 'en' ? 'the-atlas-04-profile-table.csv' : 'el-atlas-04-tabla-perfil.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initPerfilTabla() {
  if (!state[26]) {
    // Ordenadas por la PRIMERA columna, de mayor a menor: el orden de la
    // taxonomía del Atlas no le dice nada al lector, y así la tabla se lee como
    // un ranking de la primera lente contra el que se comparan las otras
    // cuatro. Cualquier encabezado la reordena.
    state[26] = { vista: 'regiones', selected: PF_DEFAULT_PAISES.slice(),
                  orden: PF_META.cols[0].k, ordenAsc: false };
  }
  setupPerfilVista();
  setupPerfilBuscador();
  setupPerfilCSV();
  pf_renderChips();
  pf_syncPicker();
  drawPerfilTabla();

  window.__atlasSupportsFormats = true;
  window.__atlasRedraw = drawPerfilTabla;
  window.onBeforePngExportGetSourceText = function (chartId) {
    if (String(chartId) !== '26') return null;
    return pf_t(state[26].vista === 'paises' ? 'c26-sources-png-paises' : 'c26-sources-png-reg');
  };
  // La nota de este PNG define las cinco columnas, así que es larga por
  // necesidad. Con la caja default (70% del ancho) salían ocho renglones que
  // le comían el alto a la tabla; ensanchada hasta donde arranca la firma y un
  // punto más chica, son seis. Medido en el cuadrado: la tabla pasa de
  // 1041×719 a 1116×771 canvas-px.
  window.onBeforePngExportGetSourceLayout = function (chartId) {
    if (String(chartId) !== '26') return null;
    return { ratio: 0.82, escala: 0.89 };
  };
  // Subtítulo más corto para el PNG: "distintas formas de medir" es justo lo
  // que los cinco encabezados de columna ya dicen, y ahí cuesta dos renglones
  // de 42 px. Lo que no puede decir la tabla —cuándo— se queda.
  window.onBeforePngExportGetSubtitle = function (chartId) {
    if (String(chartId) !== '26') return null;
    // Si Daniel customizo el subtitulo en ?nl=1, ese manda tambien en el PNG
    // (devolver null hace que png-export lea el DOM, donde ya esta el custom).
    const ae = (window.AtlasEditor && window.AtlasEditor.getConfig) ? window.AtlasEditor.getConfig() : null;
    const aeLang = (ae && ae.lang) || (typeof LANG !== 'undefined' ? LANG : 'es');
    if (ae && ae.texts && ae.texts[aeLang] && (ae.texts[aeLang].subtitle || '').trim()) return null;
    return pf_t('c26-subtitle-png');
  };
  if (typeof setupMobileControlToggles === 'function') setupMobileControlToggles();
  if (!initPerfilTabla._wired) {
    initPerfilTabla._wired = true;
    window.addEventListener('atlas-editor-change', () => drawPerfilTabla());
    document.addEventListener('click', (ev) => {
      const svg = document.getElementById('chart26');
      if (svg && !svg.contains(ev.target)) pf_hideTooltip();
    });
  }
}

function pf_onLangChange() { pf_renderChips(); drawPerfilTabla(); }
