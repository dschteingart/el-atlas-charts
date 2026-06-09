// =============================================================
//  El Atlas N°3 — Mapa coroplético "año mediano de fundación"
// =============================================================
//
// Chart 2 del N°3 fútbol. Mapa mundial pintando el año mediano de
// fundación de los clubes de cada país (ponderado por relevancia
// según sitelinks de Wikipedia).
//
// Stack: D3 v7 + d3-geo-projection (Robinson). Mismo stack que el
// mapa de talento (handoff: _handoff-futbol/... ver mapa-talento-pantheon.md).
// No vanilla porque la matemática de Robinson + zoom + bounds-from-path
// vale la pena delegar.
//
// API pública (state[3] global):
//   - state[3].hoveredIso: iso3 con hover (null si nada)
//   - state[3].searchedIso: iso3 al que el user buscó (para zoom)
//
// DOM hooks que espera el HTML:
//   - #chart1 svg (viewBox 0 0 1100 580)
//   - #tooltip1 div
//   - #m-search-input, #m-search-results, #m-reset-zoom
//   - #m-legend-grad (svg para gradient bar de leyenda)

//==================================================================
//  Constantes
//==================================================================
const M_W = 1100, M_H = 580;
// Margen MUY chico — el mapa quiere todo el viewBox para respirar.
// Los 8px de cada lado son solo para que el stroke del path no quede
// pegado al borde y para dejar espacio mínimo al "Sin dato" del leyenda.
const M_MARGIN = { top: 8, right: 8, bottom: 8, left: 8 };
const M_PLOT_W = M_W - M_MARGIN.left - M_MARGIN.right;
const M_PLOT_H = M_H - M_MARGIN.top  - M_MARGIN.bottom;

// Dominio de color en AÑO mediano de fundación. Más oscuro = más antiguo.
// El rango real del dataset es 1895–2012; usamos [1880, 2020] para nombres
// de leyenda y bins de 20 años.
const M_YEAR_MIN = 1880;
const M_YEAR_MAX = 2020;

// Paleta DIVERGENTE tipo OWID — 6 bins por cuartos de siglo.
// Punto editorial de inflexión: 1950. Lo pre-1950 = terracotas (tradición
// futbolística profunda); lo post-1950 = azules (países que se subieron
// más tarde al fútbol institucionalizado). Sin neutro intermedio: la
// transición es directa en el 1950 para reforzar la lectura "viejo vs
// nuevo" sin zona gris.
//
// Breakpoints (en años): 1900, 1925, 1950, 1975, 2000.
// Bins:           [<1900, 1900-1924, 1925-1949, 1950-1974, 1975-1999, ≥2000]
const M_COLOR_BINS_BREAKS = [1900, 1925, 1950, 1975, 2000];
const M_COLOR_BINS_RANGE  = [
  '#5A2818',  // <1900   terracota muy oscuro — pioneros (Inglaterra, etc.)
  '#9B3D24',  // 1900-24 terracota oscuro
  '#D2855B',  // 1925-49 terracota claro
  '#A5BFD0',  // 1950-74 azul claro
  '#5E7E96',  // 1975-99 azul medio
  '#2D4256',  // ≥2000   azul oscuro — países emergentes
];
const M_COLOR_NO_DATA = '#D8D3C8'; // gris cálido neutral para "sin dato"

// Stroke base entre países. Una línea fina blanca semi-transparente
// para separar visualmente sin agregar peso visual. En hover pasa a
// negro sólido para destacar.
const M_STROKE_DEFAULT = 'rgba(255, 255, 255, 0.55)';
const M_STROKE_HOVER   = '#1A1A1A';
const M_STROKE_BASE_W  = 0.5;

// Globales del módulo (módulo singleton, igual patrón que scatter.js).
let m_geo = null;          // FeatureCollection cargado por fetch
let m_projection = null;   // d3.geoRobinson() fit al SVG
let m_path = null;         // d3.geoPath con la proyección
let m_zoom = null;         // d3.zoom() controller
let m_colorScale = null;   // d3.scaleSequential
let m_loaded = false;      // flag para sub-rendires (legend, search) que
                            // pueden disparar antes de que el fetch termine

//==================================================================
//  Helpers
//==================================================================

// Devuelve el ISO3 de un feature. country.geo.json usa `id` como
// ISO3 (verificado con script de inspección); por las dudas hacemos
// fallback a properties.iso.
function m_isoOf(feat) {
  return feat.id || (feat.properties && feat.properties.iso) || null;
}

// Nombre del país en el idioma activo. Prioridad:
//   1. COUNTRY_NAMES override (para correcciones tipo Türkiye→Turquía).
//   2. DATA_CLUBAGE[iso3].name (viene del CSV, está en español).
//   3. ISO3 raw.
function m_displayName(iso3) {
  const lang = (typeof LANG !== 'undefined') ? LANG : 'es';
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso3] && COUNTRY_NAMES[iso3][lang]) {
    return COUNTRY_NAMES[iso3][lang];
  }
  const v = (typeof DATA_CLUBAGE !== 'undefined') ? DATA_CLUBAGE[iso3] : null;
  return (v && v.name) || iso3;
}

// Color del fill según el año. null/undefined → color "sin dato".
// scaleThreshold devuelve range[i] cuando domain[i-1] ≤ x < domain[i].
//   year < 1900           → range[0]
//   1900 ≤ year < 1920    → range[1]
//   ...
//   year ≥ 2000           → range[6]
function m_color(year) {
  if (year == null) return M_COLOR_NO_DATA;
  if (!m_colorScale) {
    m_colorScale = d3.scaleThreshold()
      .domain(M_COLOR_BINS_BREAKS)
      .range(M_COLOR_BINS_RANGE);
  }
  return m_colorScale(year);
}

// Índice de bin (0..N-1) o null para "sin dato". Lo usamos para enganchar
// el hover de la leyenda al subset de países del bin (data-bin-idx en el
// atributo del path, para selección rápida sin re-render).
function m_binIdxForYear(year) {
  if (year == null) return null;
  let idx = 0;
  for (const brk of M_COLOR_BINS_BREAKS) {
    if (year < brk) return idx;
    idx++;
  }
  return idx;
}

//==================================================================
//  Carga del GeoJSON
//==================================================================
//
// El shape viene EMBEBIDO en data-country-geo.js como `const GEO_COUNTRIES`.
// Es 2 MB embebido directo en el HTML (igual patrón que data-elo-pib.js
// del chart 1, que tiene 256 KB). Razón: permite abrir el archivo con
// doble click sin tener que servirlo con http.server — los browsers
// bloquean fetch a file:// por CORS.

function m_loadGeo() {
  if (typeof GEO_COUNTRIES === 'undefined') {
    throw new Error('GEO_COUNTRIES no cargado. ¿Faltó <script src="./data-country-geo.js"></script>?');
  }
  m_geo = GEO_COUNTRIES;
  m_loaded = true;
}

//==================================================================
//  Renderer principal
//==================================================================

function drawMap() {
  const svg = d3.select('#chart1');
  if (svg.empty() || !m_geo) return;

  svg.selectAll('*').remove();

  // Editor sidebar: leemos config si está activo (mismo patrón que scatter).
  const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
    ? window.AtlasEditor.getConfig() : null;
  const aeCountries = (aeCfg?.countries && aeCfg.countries.length > 0)
    ? new Set(aeCfg.countries) : null;

  // Proyección Robinson, fit al área del plot.
  // d3.geoRobinson viene de d3-geo-projection (CDN).
  m_projection = d3.geoRobinson()
    .fitSize([M_PLOT_W, M_PLOT_H], m_geo);
  m_path = d3.geoPath(m_projection);

  // Clip al área del viewBox. Sin esto, cuando el user hace zoom > 1,
  // los paths se agrandan más allá del SVG y se renderizan ENCIMA del
  // HTML circundante (leyenda, botones, header) — lo que Daniel reportó.
  // El clipPath limita el dibujo de los países al rect del viewBox.
  //
  // Como el clip-path se aplica al g.m-map-root que tiene translate
  // (M_MARGIN.left, M_MARGIN.top), el rect del clip se interpreta en
  // coords POST-translate. Por eso el origen es negativo (-M_MARGIN.left,
  // -M_MARGIN.top): así el clip cubre TODO el viewBox absoluto del SVG,
  // sin gaps en los márgenes laterales.
  svg.append('defs').append('clipPath').attr('id', 'm-viewport-clip')
    .append('rect')
    .attr('x', -M_MARGIN.left).attr('y', -M_MARGIN.top)
    .attr('width', M_W).attr('height', M_H);

  // Estructura de grupos:
  //   svg
  //   └── g.m-map-root       (translate fijo: margen del SVG, clip-path)
  //       └── g.m-zoom-group (transform variable: lo mueve el zoom)
  //           ├── g.m-landmask     (capa de "no data" debajo)
  //           ├── g.m-countries    (los paths interactivos)
  //           └── g.m-hover-overlay (stroke del hover, encima de todo)
  // Así zoom + pan mueven landmask, países y overlay JUNTOS, sin
  // desincronizar las capas, y el clip-path en m-map-root corta lo que
  // se sale del SVG.
  const g = svg.append('g')
    .attr('class', 'm-map-root')
    .attr('clip-path', 'url(#m-viewport-clip)')
    .attr('transform', `translate(${M_MARGIN.left}, ${M_MARGIN.top})`);
  const gZoom = g.append('g').attr('class', 'm-zoom-group');

  // === Land mask (capa debajo) ===
  // Donde dos países no se tocan perfectamente (slivers en Cachemira,
  // costa de Sahara Occidental, etc.), se ve el gris "sin dato" del
  // landmask en lugar del fondo crema del SVG. Más limpio editorialmente.
  if (m_geo.landmask) {
    gZoom.append('g').attr('class', 'm-landmask').append('path')
      .attr('d', m_path(m_geo.landmask))
      .attr('fill', M_COLOR_NO_DATA)
      .attr('stroke', 'none')
      .attr('pointer-events', 'none');
  }

  // Sub-grupo para los paths de países.
  const gCountries = gZoom.append('g').attr('class', 'm-countries');

  // Overlay path para el HOVER STROKE. Encima de los países, sin necesidad
  // de .raise() (que tapa el mapa con features que cruzan el antimeridiano
  // — Kiribati, Fiji, etc.). Solo stroke, sin fill: no tapa nada.
  gZoom.append('g').attr('class', 'm-hover-overlay')
    .attr('pointer-events', 'none')
    .append('path')
    .attr('class', 'm-hover-stroke')
    .attr('fill', 'none')
    .attr('stroke', M_STROKE_HOVER)
    .attr('stroke-width', 1.5)
    .attr('vector-effect', 'non-scaling-stroke');

  // Sort por área desc para que enclaves chicos queden ENCIMA de
  // los países grandes (San Marino sobre Italia, Vaticano, Lesoto).
  // d3.geoArea devuelve esterradianes — comparación por orden, sin
  // hace falta convertir.
  const features = m_geo.features.slice()
    .sort((a, b) => d3.geoArea(b) - d3.geoArea(a));

  gCountries.selectAll('path.m-country')
    .data(features, m_isoOf)
    .join('path')
    .attr('class', 'm-country')
    .attr('d', m_path)
    .attr('data-iso', m_isoOf)
    .attr('data-bin-idx', d => {
      const iso = m_isoOf(d);
      const v = (typeof DATA_CLUBAGE !== 'undefined') ? DATA_CLUBAGE[iso] : null;
      const idx = m_binIdxForYear(v?.year);
      return idx == null ? '' : idx;
    })
    .attr('fill', d => {
      const iso = m_isoOf(d);
      const v = (typeof DATA_CLUBAGE !== 'undefined') ? DATA_CLUBAGE[iso] : null;
      // Editor selecciona países: el resto queda gris claro (modo "focus
      // en selección"). Si no hay selección, todos los países pintan
      // según su año.
      if (aeCountries && !aeCountries.has(iso)) return M_COLOR_NO_DATA;
      return m_color(v?.year);
    })
    .attr('stroke', M_STROKE_DEFAULT)
    .attr('stroke-width', M_STROKE_BASE_W)
    .attr('vector-effect', 'non-scaling-stroke') // grosor estable bajo zoom
    .on('mouseenter', m_onMouseEnter)
    .on('mousemove',  m_onMouseMove)
    .on('mouseleave', m_onMouseLeave);

  // Re-aplicar el zoom transform actual (si el usuario zoomeó y
  // disparamos un re-draw por cambio de idioma o de editor, no
  // queremos perder el zoom).
  if (m_zoom) {
    const cur = d3.zoomTransform(svg.node());
    if (cur && (cur.k !== 1 || cur.x !== 0 || cur.y !== 0)) {
      gZoom.attr('transform', cur.toString());
    }
  }

  drawLegend();
}

//==================================================================
//  Tooltip
//==================================================================
function m_onMouseEnter(event, d) {
  // Pintamos el outline del país hovereado en el overlay path. NO usamos
  // .raise() porque mueve el path al top con fill incluido, y los paths
  // que cruzan el antimeridiano tapan toda la pantalla al subir.
  if (m_path) {
    d3.select('.m-hover-stroke').attr('d', m_path(d));
  }
  m_showTooltip(event, d);
}

function m_onMouseMove(event) {
  m_positionTooltip(event);
}

function m_onMouseLeave(event) {
  // Limpia el overlay (sin path = invisible).
  d3.select('.m-hover-stroke').attr('d', null);
  m_hideTooltip();
}

function m_showTooltip(event, d) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  const iso = m_isoOf(d);
  const v = (typeof DATA_CLUBAGE !== 'undefined') ? DATA_CLUBAGE[iso] : null;
  const name = m_displayName(iso);
  const tt = (k, fb) => (typeof t === 'function' ? t(k) : fb);

  if (!v || v.year == null) {
    tooltip.innerHTML = `
      <strong>${name}</strong>
      <div class="tt-row tt-muted">${tt('c3-tt-nodata', 'Sin clubes en el universo Wikidata')}</div>
    `;
  } else {
    const yearLbl = tt('c3-tt-year', 'Año mediano (pond.)');
    const nLbl    = tt('c3-tt-clubs', 'Clubes');
    const nfLbl   = tt('c3-tt-with-date', 'Con fecha de creación identificada');
    // La fila "Con fecha de creación identificada" es metodológica
    // (cuántos clubes tienen P571 conocida) — se diferencia visualmente
    // con tt-row-sub: italic + tipografía más chica.
    tooltip.innerHTML = `
      <strong>${name}</strong>
      <div class="tt-row"><span>${yearLbl}</span><span>${v.year}</span></div>
      <div class="tt-row"><span>${nLbl}</span><span>${v.n != null ? v.n.toLocaleString('es') : '—'}</span></div>
      <div class="tt-row tt-row-sub"><span>${nfLbl}</span><span>${v.nf != null ? v.nf.toLocaleString('es') : '—'}</span></div>
    `;
  }
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
  m_positionTooltip(event);
}

function m_positionTooltip(event) {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  const wrap = tooltip.parentElement.getBoundingClientRect();
  const x = event.clientX - wrap.left;
  const y = event.clientY - wrap.top;
  // Anclar arriba-derecha del cursor. Si se sale a la derecha del
  // wrap, lo volcamos a la izquierda.
  const ttW = tooltip.offsetWidth;
  const ttH = tooltip.offsetHeight;
  let px = x + 14;
  let py = y - ttH - 8;
  if (px + ttW > wrap.width)  px = x - ttW - 14;
  if (py < 0)                 py = y + 18;
  tooltip.style.left = px + 'px';
  tooltip.style.top  = py + 'px';
}

function m_hideTooltip() {
  const tooltip = document.getElementById('tooltip1');
  if (!tooltip) return;
  tooltip.style.opacity = '0';
}

//==================================================================
//  Leyenda — DISCRETA, estilo OWID: banda contigua de chips de color
//  con labels de breakpoint debajo + un chip aparte para "Sin dato".
//  Todo dentro de un solo SVG para que esté visualmente alineado y
//  ambos (bins de color y "sin dato") sean hovereables igual.
//==================================================================
function drawLegend() {
  const legSvg = d3.select('#m-legend-grad');
  if (legSvg.empty()) return;
  legSvg.selectAll('*').remove();

  // Layout: 7 bins contiguos + gap + 1 chip "Sin dato" + label debajo
  // de los breakpoints + label "Sin dato".
  //
  // Anchos:
  //   - Banda principal:   W_MAIN px
  //   - Gap:               GAP px
  //   - Chip "Sin dato":   NODATA_W px
  // Total viewBox: W_MAIN + GAP + NODATA_W
  const W_MAIN = 360;
  const GAP    = 12;
  const NODATA_W = 14;
  const BIN_H = 12;
  const TICK_GAP = 4;
  const TEXT_Y = BIN_H + TICK_GAP + 8;
  const VBOX_W = W_MAIN + GAP + NODATA_W;
  legSvg.attr('viewBox', `0 0 ${VBOX_W} ${TEXT_Y + 4}`);

  const nBins = M_COLOR_BINS_RANGE.length;       // 7
  const binW = W_MAIN / nBins;

  // Chips de color (rect por bin, sin gap entre ellos → "banda OWID").
  // Hover sobre el rect destaca los países de ese bin en el mapa.
  for (let i = 0; i < nBins; i++) {
    legSvg.append('rect')
      .attr('x', i * binW)
      .attr('y', 0)
      .attr('width', binW)
      .attr('height', BIN_H)
      .attr('fill', M_COLOR_BINS_RANGE[i])
      .attr('stroke', 'rgba(0,0,0,0.08)')
      .attr('stroke-width', 0.5)
      .attr('data-bin-idx', i)
      .style('cursor', 'pointer')
      .on('mouseenter', () => m_highlightBin(i))
      .on('mouseleave', () => m_clearHighlight());
  }

  // Breakpoints alineados a las JUNTAS entre bins (no al centro).
  // Eso da labels como  1900 | 1920 | 1940 | ... | 2000
  M_COLOR_BINS_BREAKS.forEach((year, idx) => {
    const x = (idx + 1) * binW;  // juntura derecha del bin idx
    legSvg.append('text')
      .attr('x', x)
      .attr('y', TEXT_Y)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--sans)')
      .attr('font-size', 10)
      .attr('fill', 'var(--ink-soft)')
      .attr('font-variant-numeric', 'tabular-nums')
      .text(year);
  });

  // Chip "Sin dato" — separado por gap, mismo height que la banda.
  // Hovereable: destaca los países sin year en el mapa.
  const nodataX = W_MAIN + GAP;
  const nodataLabel = (typeof t === 'function' ? t('c3-legend-nodata') : 'Sin dato');
  legSvg.append('rect')
    .attr('x', nodataX)
    .attr('y', 0)
    .attr('width', NODATA_W)
    .attr('height', BIN_H)
    .attr('fill', M_COLOR_NO_DATA)
    .attr('stroke', 'rgba(0,0,0,0.15)')
    .attr('stroke-width', 0.5)
    .attr('data-bin-idx', 'nodata')
    .style('cursor', 'pointer')
    .on('mouseenter', () => m_highlightBin('nodata'))
    .on('mouseleave', () => m_clearHighlight());

  legSvg.append('text')
    .attr('x', nodataX + NODATA_W / 2)
    .attr('y', TEXT_Y)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'var(--sans)')
    .attr('font-size', 10)
    .attr('fill', 'var(--ink-soft)')
    .text(nodataLabel);
}

//==================================================================
//  Highlight por bin (hover sobre la leyenda)
//==================================================================
// Mismo patrón que OWID: hover sobre un bin de la leyenda destaca con
// stroke negro los países que caen en ese rango, y atenúa el resto
// (fill-opacity 0.35). El bin hovereado en la leyenda también se
// rodea con stroke negro para feedback bilateral.

function m_highlightBin(binIdx) {
  // binIdx puede ser un número (0..6) o el string 'nodata'.
  const target = String(binIdx);
  const isNoData = target === 'nodata';
  d3.selectAll('.m-country').each(function () {
    const el = d3.select(this);
    const own = el.attr('data-bin-idx');
    // Match: bin numérico exacto, o "sin atributo" cuando target='nodata'.
    const ownIsNoData = (own === '' || own === null);
    const match = isNoData ? ownIsNoData : (own === target);
    if (match) {
      // Stroke negro grueso + full opacity. NO usamos .raise() porque
      // si algún path cruza el antimeridiano (Kiribati en bin 6, etc.),
      // subirlo al top hace que su fill tape todo el mapa.
      el.attr('stroke', '#1A1A1A')
        .attr('stroke-width', 1.4)
        .attr('fill-opacity', 1);
    } else {
      el.attr('stroke', M_STROKE_DEFAULT)
        .attr('stroke-width', M_STROKE_BASE_W)
        .attr('fill-opacity', 0.35);
    }
  });
  // Marca el chip de la leyenda con stroke negro para feedback.
  d3.select('#m-legend-grad').selectAll('rect')
    .each(function () {
      const el = d3.select(this);
      if (el.attr('data-bin-idx') === target) {
        el.attr('stroke', '#1A1A1A').attr('stroke-width', 1.5);
      } else {
        el.attr('stroke', 'rgba(0,0,0,0.08)').attr('stroke-width', 0.5);
      }
    });
}

function m_clearHighlight() {
  d3.selectAll('.m-country')
    .attr('stroke', M_STROKE_DEFAULT)
    .attr('stroke-width', M_STROKE_BASE_W)
    .attr('fill-opacity', 1);
  d3.select('#m-legend-grad').selectAll('rect')
    .attr('stroke', 'rgba(0,0,0,0.08)')
    .attr('stroke-width', 0.5);
}

//==================================================================
//  Zoom + pan
//==================================================================

function setupMapZoom() {
  const svg = d3.select('#chart1');
  if (svg.empty()) return;

  m_zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[-M_W * 0.2, -M_H * 0.2], [M_W * 1.2, M_H * 1.2]])
    .on('zoom', (ev) => {
      // Mueve landmask + países + hover overlay juntos.
      svg.select('.m-zoom-group').attr('transform', ev.transform.toString());
    });

  svg.call(m_zoom)
     .on('dblclick.zoom', null); // sacamos doble-click zoom (rompe UX en mapa estrecho)
}

// Pan-zoom al bbox del país. Llamado desde el buscador.
function zoomToCountry(iso3) {
  if (!m_geo || !m_path || !m_zoom) return;
  const feat = m_geo.features.find(f => m_isoOf(f) === iso3);
  if (!feat) return;

  const bounds = m_path.bounds(feat);
  const [[x0, y0], [x1, y1]] = bounds;
  const w = x1 - x0, h = y1 - y0;
  if (w <= 0 || h <= 0) return;

  // Margen 30% para que el país no quede pegado al borde.
  const scale = Math.min(M_PLOT_W / w, M_PLOT_H / h) * 0.7;
  const clampedScale = Math.max(1, Math.min(8, scale));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const tx = M_PLOT_W / 2 - clampedScale * cx;
  const ty = M_PLOT_H / 2 - clampedScale * cy;

  d3.select('#chart1').transition().duration(600)
    .call(m_zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(clampedScale));
}

function resetZoom() {
  d3.select('#chart1').transition().duration(450)
    .call(m_zoom.transform, d3.zoomIdentity);
}

//==================================================================
//  Buscador
//==================================================================

function m_normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function m_searchableCountries() {
  if (typeof DATA_CLUBAGE === 'undefined') return [];
  return Object.keys(DATA_CLUBAGE)
    .map(iso3 => ({
      iso3,
      name: m_displayName(iso3),
      confed: DATA_CLUBAGE[iso3].confed || ''
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function setupMapSearch() {
  const input = document.getElementById('m-search-input');
  const results = document.getElementById('m-search-results');
  const resetBtn = document.getElementById('m-reset-zoom');
  if (!input || !results) return;

  let currentMatches = [];
  let activeIdx = -1;

  function getMatches(q) {
    if (!q || q.length < 1) return [];
    const qn = m_normalize(q);
    return m_searchableCountries()
      .filter(c => m_normalize(c.name).includes(qn))
      .slice(0, 8);
  }

  function renderResults(matches, active) {
    if (matches.length === 0) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    results.innerHTML = matches.map((c, i) => {
      const cls = 'm-search-result' + (i === active ? ' m-active' : '');
      return `<div class="${cls}" data-iso="${c.iso3}">${c.name}<span class="m-search-region">${c.confed}</span></div>`;
    }).join('');
    results.classList.add('open');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        zoomToCountry(el.dataset.iso);
        input.value = '';
        results.classList.remove('open');
      });
    });
  }

  input.addEventListener('input', (e) => {
    currentMatches = getMatches(e.target.value);
    activeIdx = -1;
    renderResults(currentMatches, activeIdx);
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      activeIdx = (activeIdx + 1) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
      renderResults(currentMatches, activeIdx);
    } else if (ev.key === 'Enter' && activeIdx >= 0) {
      ev.preventDefault();
      zoomToCountry(currentMatches[activeIdx].iso3);
      input.value = '';
      results.classList.remove('open');
    } else if (ev.key === 'Escape') {
      results.classList.remove('open');
      input.blur();
    }
  });

  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) {
      results.classList.remove('open');
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => resetZoom());
  }
}

//==================================================================
//  Download CSV
//==================================================================
// Dataset agregado por país: una fila por iso3 con year_median_pond,
// n_clubs, n_with_date, confed. Mismo patrón de localización que scatter:
// nombre en EN/ES y filename localizado.
function setupMapDownloadCSV() {
  document.querySelectorAll('button.download[data-chart="2-csv"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof DATA_CLUBAGE === 'undefined') return;
      const rows = Object.keys(DATA_CLUBAGE)
        .sort()
        .map(iso3 => ({
          iso3,
          name: (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[iso3]?.en) || DATA_CLUBAGE[iso3].name || iso3,
          confed: DATA_CLUBAGE[iso3].confed || '',
          year_median_weighted: DATA_CLUBAGE[iso3].year ?? '',
          n_clubs: DATA_CLUBAGE[iso3].n ?? '',
          n_with_founding_date: DATA_CLUBAGE[iso3].nf ?? '',
        }));

      const cols = ['iso3', 'name', 'confed', 'year_median_weighted', 'n_clubs', 'n_with_founding_date'];
      let csv = cols.join(',') + '\n';
      rows.forEach(r => {
        const row = cols.map(k => {
          const v = r[k];
          if (v === null || v === undefined || v === '') return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          return v;
        });
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (typeof LANG !== 'undefined' && LANG === 'en')
        ? 'the-atlas-03-club-founding-year.csv'
        : 'el-atlas-03-fundacion-clubes.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

//==================================================================
//  Init
//==================================================================
function initMap() {
  try {
    m_loadGeo();
  } catch (err) {
    console.error('[clubage-map] Falló la carga del GeoJSON', err);
    return;
  }
  drawMap();
  setupMapZoom();
  setupMapSearch();
  setupMapDownloadCSV();

  // Editor sidebar: re-render cuando el usuario edita.
  if (!initMap._editorWired) {
    initMap._editorWired = true;
    window.addEventListener('atlas-editor-change', () => drawMap());
  }
}

// Engancha el draw al lang-toggle (lo llama setupLangToggle desde el HTML).
function redrawMapOnLangChange() {
  if (m_loaded) drawMap();
}

// Hook que png-export.js invoca antes de rasterizar el SVG clonado.
// Sanitización + inyección de leyenda vertical en el océano Pacífico.
window.onBeforePngExport = function(svgClone, chartId) {
  if (chartId !== '3') return;

  // === Sanitización ===
  // 1. Quitar clip-path del .m-map-root. url(#m-viewport-clip) a veces
  //    no resuelve fuera del documento padre → todo el mapa queda
  //    recortado a cero.
  const root = svgClone.querySelector('.m-map-root');
  if (root) root.removeAttribute('clip-path');
  // 2. Aplanar el zoom transform.
  const zoomGroup = svgClone.querySelector('.m-zoom-group');
  if (zoomGroup) zoomGroup.removeAttribute('transform');
  // 3. Eliminar defs entero (ya no necesitamos el clipPath).
  const defs = svgClone.querySelector('defs');
  if (defs) defs.remove();
  // 4. Forzar overflow visible.
  svgClone.setAttribute('overflow', 'visible');

  // === Leyenda vertical embebida (en el océano Pacífico, izquierda) ===
  // Panel posicionado en el Pacífico Norte+Sur, más arriba y más angosto
  // que la primera iteración para evitar overlap con Sudamérica.
  const NS = 'http://www.w3.org/2000/svg';
  const lg = document.createElementNS(NS, 'g');
  lg.setAttribute('class', 'm-png-legend');

  // Sin fondo. La leyenda va directo sobre el mar (color crema #FBF8F2
  // del SVG) — más limpio y permite acercarla más al borde sin caja
  // visual obstructiva. Las labels SVG usan paint-order: stroke con
  // stroke crema para legibilidad si en algún momento el panel se
  // superpone con tierra (no debería con PANEL_X = 18).
  // PANEL_Y bajado de 70 → 160 para asegurar que esté en mar puro: a 70
  // empezaba sobre Groenlandia/Canadá. A 160 arranca cerca del trópico
  // norte, debajo del Caribe — pleno océano Pacífico Norte/Central.
  const PANEL_X = 18, PANEL_Y = 160;
  const SWATCH_W = 20, SWATCH_H = 20;
  const ROW_H = 30;

  // Título del panel.
  const title = document.createElementNS(NS, 'text');
  title.setAttribute('x', PANEL_X + 14);
  title.setAttribute('y', PANEL_Y + 22);
  title.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  title.setAttribute('font-size', 13);
  title.setAttribute('font-weight', '600');
  title.setAttribute('fill', '#1A1A1A');
  title.setAttribute('letter-spacing', '0.04em');
  title.textContent = (typeof t === 'function')
    ? t('c3-legend-label')
    : 'Año mediano';
  lg.appendChild(title);

  // Items en orden DE MENOR A MAYOR año. Sin símbolos < / ≥ — texto
  // explícito ("Antes de", "Desde") para que sea evidente en el PNG.
  const items = [
    { color: '#5A2818', label: 'Antes de 1900' },
    { color: '#9B3D24', label: '1900–1924' },
    { color: '#D2855B', label: '1925–1949' },
    { color: '#A5BFD0', label: '1950–1974' },
    { color: '#5E7E96', label: '1975–1999' },
    { color: '#2D4256', label: 'Desde 2000' },
  ];
  const FIRST_ROW_Y = PANEL_Y + 38;
  items.forEach((it, i) => {
    const yi = FIRST_ROW_Y + i * ROW_H;
    const sw = document.createElementNS(NS, 'rect');
    sw.setAttribute('x', PANEL_X + 14);
    sw.setAttribute('y', yi);
    sw.setAttribute('width', SWATCH_W);
    sw.setAttribute('height', SWATCH_H);
    sw.setAttribute('fill', it.color);
    sw.setAttribute('stroke', 'rgba(0,0,0,0.12)');
    sw.setAttribute('stroke-width', 0.5);
    lg.appendChild(sw);
    const lbl = document.createElementNS(NS, 'text');
    lbl.setAttribute('x', PANEL_X + 14 + SWATCH_W + 10);
    lbl.setAttribute('y', yi + 16);
    lbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
    lbl.setAttribute('font-size', 12.5);
    lbl.setAttribute('fill', '#3A3530');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = it.label;
    lg.appendChild(lbl);
  });

  // "Sin dato" debajo, separado por un gap pequeño.
  const nodataY = FIRST_ROW_Y + items.length * ROW_H + 8;
  const nsw = document.createElementNS(NS, 'rect');
  nsw.setAttribute('x', PANEL_X + 14);
  nsw.setAttribute('y', nodataY);
  nsw.setAttribute('width', SWATCH_W);
  nsw.setAttribute('height', SWATCH_H);
  nsw.setAttribute('fill', '#D8D3C8');
  nsw.setAttribute('stroke', 'rgba(0,0,0,0.12)');
  nsw.setAttribute('stroke-width', 0.5);
  lg.appendChild(nsw);
  const nlbl = document.createElementNS(NS, 'text');
  nlbl.setAttribute('x', PANEL_X + 14 + SWATCH_W + 10);
  nlbl.setAttribute('y', nodataY + 16);
  nlbl.setAttribute('font-family', '"Source Sans 3", system-ui, sans-serif');
  nlbl.setAttribute('font-size', 12.5);
  nlbl.setAttribute('fill', '#3A3530');
  nlbl.textContent = (typeof t === 'function')
    ? t('c3-legend-nodata')
    : 'Sin dato';
  lg.appendChild(nlbl);

  // Lo agregamos al final → queda encima del mapa.
  svgClone.appendChild(lg);
};
