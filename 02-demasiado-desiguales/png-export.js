// PNG export para los charts del N°1.
// Composición manual en canvas (sin dependencias externas):
//   1. Fondo crema.
//   2. Título del chart (Source Serif 4, bold).
//   3. Subtítulo (Source Serif 4, italic).
//   4. SVG rasterizado con estilos inlineados.
//   5. Leyenda de regiones (solo charts 1 y 2 — el chart 3 ya tiene end-labels in-line).
//   6. Caption de fuente (Source Sans 3).
//
// Triggered por botones con data-png="<chartId>" en cada chart-N.html.

(function setupPNGExport() {
  const PALETTE = {
    bg:         '#FAF8F3',
    ink:        '#1A1A1A',
    inkSoft:    '#4A4A4A',
    legendInk:  '#666666',
    attribution:'#BE5D32'  // terracota del Atlas (--accent en style.css)
  };

  // Filenames bilingües por chart.
  // El chart 1 (marimekko) cambia con el toggle: el filename refleja el modo
  // activo (raw|adj) además del idioma. Daniel exporta 2 PNGs distintos
  // moviendo el toggle: 1a (raw) y 1b (adj).
  const FILENAMES = {
    '1': {
      es_raw: 'el-atlas-02-gini-ranking-original.png',
      es_adj: 'el-atlas-02-gini-ranking-ajustado.png',
      en_raw: 'the-atlas-02-gini-ranking-original.png',
      en_adj: 'the-atlas-02-gini-ranking-adjusted.png'
    },
    '2': { es: 'el-atlas-02-gini-vs-pib.png',          en: 'the-atlas-02-gini-vs-gdp.png'           },
    '3': { es: 'el-atlas-02-deciles.png',              en: 'the-atlas-02-deciles.png'               }
  };

  const VIEWBOX_RIGHT_EXTENSION = {};

  // Solo el chart 2 (scatter) lleva leyenda canvas de 7 regiones.
  // El chart 1 (marimekko) tenía leyenda en versiones anteriores, pero la
  // correspondencia color→región vive ahora en la TABLA REGIONAL arriba-
  // derecha (`#m-avg-table` con swatches + nombres + Gini promedio) — la
  // leyenda de abajo era redundante. Solo se la quita del PNG; en pantalla
  // (`.m-legend` renderada por renderMarimekkoLegend) sigue como está.
  // El chart 3 (deciles) tiene labels in-line por país, sin leyenda.
  const SHOWS_LEGEND = chartId => chartId === '2';

  // Props CSS que aplican a SVG y necesitamos preservar al rasterizar.
  // Esta lista es el "cinturón" — además, embebemos el CSS del documento
  // dentro del SVG (buildEmbeddedDocCss) que es el "tirador". Mantener
  // ambos es defensivo: si embedDocCss falla por algún CORS o si una regla
  // tiene una selectora rara, el inline-style sigue capturando lo esencial.
  // Incluimos text-transform / letter-spacing / font-variant-numeric / etc.
  // porque eran las que se perdían (clases .m-axis-label .m-table-title con
  // text-transform: uppercase y letter-spacing).
  const SVG_STYLE_PROPS = [
    'fill', 'fill-opacity',
    'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
    'stroke-linejoin', 'stroke-linecap',
    'opacity',
    'font-family', 'font-size', 'font-weight', 'font-style',
    'font-variant', 'font-variant-numeric', 'font-feature-settings',
    'text-anchor', 'text-transform', 'letter-spacing', 'word-spacing',
    'paint-order', 'dominant-baseline', 'alignment-baseline',
    'display', 'visibility'
  ];

  // Cache del CSS con webfonts embebidas como data URLs. Se construye una
  // vez por sesión (la primera descarga de PNG tarda más, las siguientes
  // son inmediatas).
  let cachedEmbeddedFontCss = null;

  // Cache del CSS del documento (style tags + same-origin stylesheets).
  // Construido bajo demanda. Lo embebemos dentro del SVG clonado para que
  // las reglas que aplican a clases (.m-axis-label, .m-table-title,
  // .m-country-label, etc.) se resuelvan en el contexto aislado del
  // <img src="blob:..."> donde el browser rasteriza el SVG.
  // Sin esto: text-transform, letter-spacing, font-feature-settings y
  // cualquier otra prop que no está en SVG_STYLE_PROPS o en presentation
  // attributes se PIERDE — los textos salen en lowercase, sin tracking, etc.
  let cachedEmbeddedDocCss = null;

  // Construye un CSS con todas las @font-face de Google Fonts pero con las
  // URLs reemplazadas por data: base64. Necesario para que el SVG
  // rasterizado vía <img> tenga acceso a las webfonts — el contexto
  // aislado donde el browser carga el SVG no ve las fonts del documento
  // padre. Si embebemos las fonts directamente en el SVG, el SVG es
  // autosuficiente.
  async function buildEmbeddedFontCss() {
    if (cachedEmbeddedFontCss !== null) return cachedEmbeddedFontCss;
    const fontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter(l => l.href && l.href.includes('fonts.googleapis.com'));
    if (fontLinks.length === 0) { cachedEmbeddedFontCss = ''; return ''; }
    let allCss = '';
    for (const link of fontLinks) {
      try {
        const cssRes = await fetch(link.href, { credentials: 'omit' });
        let css = await cssRes.text();
        // Extraer todas las URLs de archivos de font (woff2 principalmente)
        // y convertirlas a data:font/woff2;base64,...
        const urlMatches = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m => m[1]))];
        const fontFetches = await Promise.all(urlMatches.map(async fontUrl => {
          try {
            const fontRes = await fetch(fontUrl, { credentials: 'omit' });
            const buf = await fontRes.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);
            const mime = fontUrl.endsWith('.woff2') ? 'font/woff2'
                       : fontUrl.endsWith('.woff')  ? 'font/woff'
                       : 'application/octet-stream';
            return { fontUrl, dataUrl: `data:${mime};base64,${b64}` };
          } catch (e) {
            return null;
          }
        }));
        fontFetches.forEach(f => {
          if (f) css = css.split(f.fontUrl).join(f.dataUrl);
        });
        allCss += css + '\n';
      } catch (e) {
        // Si el fetch falla (CORS, network), seguimos sin embedded fonts
        // — el PNG saldrá con el fallback del sistema, no es óptimo pero
        // no rompe el download.
      }
    }
    cachedEmbeddedFontCss = allCss;
    return allCss;
  }

  // Construye un CSS con TODAS las reglas del documento (los <style> inline
  // del <head> y las hojas same-origin tipo lib/style.css y editor.css).
  // Lo inyectamos como <style> dentro del SVG clonado, así el SVG cuando se
  // renderea como <img src="blob:..."> tiene acceso a las reglas por clase
  // (.m-axis-label, .m-country-label, .m-table-title…) que aplican
  // text-transform: uppercase, letter-spacing, font-feature-settings, etc.
  // Sin embebido, esas props se pierden y los textos salen en lowercase sin
  // tracking, como reportó Daniel ("COEFICIENTE DE GINI" → "coeficiente de gini").
  //
  // Filtramos las @media queries: el SVG rasterizado tiene tamaño fijo y
  // no responde al viewport del browser. Si dejamos las media queries del
  // padre, una @media (max-width: 600px) que setea .m-country-label
  // {font-size: 8px} podría aplicarse incorrectamente o no aplicarse según
  // el tamaño del <img>, generando inconsistencias.
  //
  // También skippeamos las hojas cross-origin (Google Fonts) — esas las
  // maneja buildEmbeddedFontCss() con data URLs.
  function buildEmbeddedDocCss() {
    if (cachedEmbeddedDocCss !== null) return cachedEmbeddedDocCss;
    let css = '';
    // 1. <style> inline del documento (incluye el bloque en chart-1.html).
    document.querySelectorAll('style').forEach(styleEl => {
      // Skippeamos el <style> que NOSOTROS mismos hayamos inyectado en SVGs
      // previos (defensivo — los <style> dentro de <svg> también matchean
      // el querySelectorAll). querySelectorAll('style') solo agarra style
      // tags del HTML, no de SVGs hijos, pero por las dudas.
      if (styleEl.closest('svg')) return;
      css += styleEl.textContent + '\n';
    });
    // 2. Hojas externas same-origin (lib/style.css, editor.css). Necesarias
    //    para que las CSS variables (--ink-soft, --rule, --sans) se
    //    resuelvan dentro del SVG: cuando el SVG está en un contexto
    //    aislado, no ve el :root del documento padre.
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.href) {
          // Skip cross-origin (Google Fonts → buildEmbeddedFontCss).
          const url = new URL(sheet.href, window.location.href);
          if (url.origin !== window.location.origin) return;
        }
        const rules = sheet.cssRules || [];
        for (const rule of rules) {
          // Skippeamos @media queries: el SVG rasterizado tiene tamaño
          // fijo y no responde a viewport queries. Las reglas no-media
          // (incluyendo :root con CSS variables) van todas.
          if (rule.type === CSSRule.MEDIA_RULE) continue;
          css += rule.cssText + '\n';
        }
      } catch (e) {
        // Hojas inaccesibles por CORS — las skippeamos en silencio.
      }
    });
    cachedEmbeddedDocCss = css;
    return css;
  }

  // Pre-carga de webfonts para canvas (legend + textos compuestos en canvas).
  // Renderiza en DOM oculto + fuerza layout + espera document.fonts.
  // El probeText incluye acentos y caracteres especiales para forzar carga
  // de todos los unicode-ranges relevantes.
  async function preloadCanvasFonts(fontShorthands) {
    const probeText = 'AÁÉÍÓÚÜÑabcáéíóúüñ — Medio Oriente y Norte de África';
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = 'position:absolute;left:-99999px;top:-99999px;visibility:hidden;pointer-events:none;';
    fontShorthands.forEach(font => {
      const probe = document.createElement('span');
      probe.style.cssText = `font:${font};white-space:nowrap;`;
      probe.textContent = probeText;
      container.appendChild(probe);
    });
    document.body.appendChild(container);
    // Forzar layout para que el browser renderice efectivamente.
    void container.offsetWidth;
    if (document.fonts) {
      try {
        await Promise.all(fontShorthands.map(f => document.fonts.load(f, probeText)));
        await document.fonts.ready;
      } catch(_) {}
    }
    // Pequeño delay para asegurar que el canvas font-cache se actualizó.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    document.body.removeChild(container);
  }

  function inlineStyles(sourceRoot, targetRoot) {
    const sourceNodes = sourceRoot.querySelectorAll('*');
    const targetNodes = targetRoot.querySelectorAll('*');
    for (let i = 0; i < sourceNodes.length; i++) {
      const computed = getComputedStyle(sourceNodes[i]);
      let inline = '';
      SVG_STYLE_PROPS.forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val) inline += `${prop}:${val};`;
      });
      const prevStyle = targetNodes[i].getAttribute('style') || '';
      targetNodes[i].setAttribute('style', inline + prevStyle);
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = '';
    let lines = 0;
    for (let i = 0; i < words.length; i++) {
      const testLine = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y + lines * lineHeight);
        line = words[i];
        lines++;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines++;
    }
    return lines;
  }

  function countWrapLines(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    let line = '';
    let lines = 0;
    for (let i = 0; i < words.length; i++) {
      const testLine = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        line = words[i];
        lines++;
      } else {
        line = testLine;
      }
    }
    if (line) lines++;
    return lines;
  }

  // === Leyenda de regiones (charts 1 y 2) ===
  // Configuración compartida entre count y draw.
  // Font 15 es el sweet spot: 14 quedaba chico contra el título 36px del PNG;
  // 17 daba "estirado" porque las palabras largas (ej. "Latinoamérica y el
  // Caribe") empujaban los gaps entre items y se veían diluidas.
  const LEGEND_FONT_SIZE = 15;
  const LEGEND_LINE_H = 24;
  const LEGEND_ITEM_GAP = 20;     // separación horizontal entre items
  const LEGEND_CIRCLE_R = 5;
  const LEGEND_CIRCLE_TEXT_GAP = 7;

  function legendItems() {
    // Para el N°2 usamos las 7 regiones del Banco Mundial (regions-wb.js).
    // Los nombres traducidos viven en ISSUE_I18N con las keys 'reg.<wb-name>'.
    return REGION_WB_ORDER.map(reg => ({
      color: REGION_WB_COLORS[reg],
      label: t('reg.' + reg)
    }));
  }

  // Distribuye items en filas según el ancho disponible. Devuelve filas con
  // sus widths para que tanto count como draw produzcan el mismo layout.
  function layoutLegend(ctx, items, maxWidth) {
    ctx.font = `400 ${LEGEND_FONT_SIZE}px "Source Sans 3", -apple-system, sans-serif`;
    const widths = items.map(it =>
      LEGEND_CIRCLE_R * 2 + LEGEND_CIRCLE_TEXT_GAP + ctx.measureText(it.label).width
    );
    const rows = [[]];
    let rowW = 0;
    items.forEach((item, i) => {
      const itemW = widths[i];
      const sep = rows[rows.length - 1].length > 0 ? LEGEND_ITEM_GAP : 0;
      if (rowW + sep + itemW > maxWidth && rows[rows.length - 1].length > 0) {
        rows.push([]);
        rowW = 0;
      }
      const isFirst = rows[rows.length - 1].length === 0;
      rows[rows.length - 1].push({ ...item, width: itemW });
      rowW += (isFirst ? 0 : LEGEND_ITEM_GAP) + itemW;
    });
    return rows;
  }

  function drawLegend(ctx, x, y, maxWidth) {
    const rows = layoutLegend(ctx, legendItems(), maxWidth);
    ctx.font = `400 ${LEGEND_FONT_SIZE}px "Source Sans 3", -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    rows.forEach((row, rowIdx) => {
      const totalW = row.reduce((sum, it, i) => sum + it.width + (i > 0 ? LEGEND_ITEM_GAP : 0), 0);
      let cx = x + (maxWidth - totalW) / 2;
      const cy = y + LEGEND_LINE_H / 2 + rowIdx * LEGEND_LINE_H;
      row.forEach(it => {
        ctx.beginPath();
        ctx.arc(cx + LEGEND_CIRCLE_R, cy, LEGEND_CIRCLE_R, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.fillStyle = PALETTE.legendInk;
        ctx.fillText(it.label, cx + LEGEND_CIRCLE_R * 2 + LEGEND_CIRCLE_TEXT_GAP, cy);
        cx += it.width + LEGEND_ITEM_GAP;
      });
    });
    return rows.length * LEGEND_LINE_H;
  }

  async function downloadChartPNG(chartId, options) {
    options = options || {};
    const svg = document.getElementById('chart' + chartId);
    if (!svg) return;
    const block = svg.closest('.chart-block');

    // Determinar el formato. WYSIWYG: el SVG en pantalla YA está renderado
    // con el viewBox/margins del formato que el editor eligió. Acá solo
    // leemos el formato para saber el tamaño del canvas final (nominalW ×
    // nominalH del PNG_FORMATS). NO re-renderizamos el chart.
    //
    // Prioridad:
    //   1. window.AtlasEditor.getConfig().format si el editor está activo
    //      (body.ae-ever-activated) → el SVG en pantalla ya está en ese
    //      formato. Leemos las dims nominales para el canvas.
    //   2. Sin editor activo → format=null. El canvas usa default W=1600
    //      y el SVG se rasteriza con el viewBox que tiene en pantalla (que
    //      es el desktop default). Esto es lo que el usuario ve.
    //
    // Históricamente había un atajo Shift+Click → newsletter. Lo quitamos:
    // el dropdown del editor es el único camino para elegir formato. Sin
    // editor activo, descarga el "público" = lo que ves en pantalla.
    let format = null;
    if (
      window.AtlasEditor &&
      typeof window.AtlasEditor.getConfig === 'function' &&
      document.body.classList.contains('ae-ever-activated')
    ) {
      const cfg = window.AtlasEditor.getConfig();
      if (cfg && cfg.format && PNG_FORMATS[cfg.format]) format = cfg.format;
    }

    // No hay re-render forzado: el SVG en pantalla es la única fuente de
    // verdad. WYSIWYG.
    const isNewsletter = format === 'newsletter';
    const isSquare     = format === 'square';
    const isMobilePng  = format === 'mobile';
    // El mapa del chart 4 es apaisado pero usa la composición "mobile-first" (firma
    // grande en 2 renglones centrada, nota más abajo), igual que el 'worldmap' del N°3.
    const isMapChart   = (chartId === '4' && typeof state !== 'undefined' && state[4] && state[4].view === 'map');
    const mobileFirst  = isNewsletter || isSquare || isMobilePng || isMapChart;

    // Forzar carga de webfonts ANTES de medir/dibujar en canvas. El canvas
    // tiene un font-cache aparte que no siempre se sincroniza con
    // document.fonts.load(); además, las webfonts de Google Fonts vienen
    // con unicode-ranges y canvas a veces cae al fallback para todo el texto
    // si pide un glifo fuera de rango. La técnica confiable:
    //   1. Crear elementos DOM ocultos con cada combinación de font usada,
    //      incluyendo glifos relevantes (acentos, em-dash, etc).
    //   2. Forzar layout (offsetWidth) para que el browser efectivamente
    //      renderice las fonts.
    //   3. Esperar document.fonts.load() + ready.
    //   4. Luego sí dibujar en canvas — el font-cache del canvas ya está
    //      poblado y usa la webfont, no el fallback.
    await preloadCanvasFonts([
      '700 36px "Source Serif 4"',
      'italic 20px "Source Serif 4"',
      '400 15px "Source Sans 3"',
      '400 14px "Source Sans 3"',
      '600 14px "Source Sans 3"'
    ]);

    const titleText    = block.querySelector('.chart-title')?.textContent.trim()    || '';
    const subtitleText = block.querySelector('.chart-subtitle')?.textContent.trim() || '';
    const sourceEl = document.querySelector('.footer p[data-i18n$="sources"]');
    let sourceText = sourceEl ? sourceEl.textContent.trim() : '';
    // Hook opcional: el chart puede devolver una variante del sourceText
    // específica del estado actual (ej. el marimekko cambia el texto según
    // el modo raw/adj activo).
    if (typeof window.onBeforePngExportGetSourceText === 'function') {
      try {
        const override = window.onBeforePngExportGetSourceText(chartId);
        if (override) sourceText = override;
      } catch(_) {}
    }
    const attribEl = document.querySelector('.footer .attribution');
    const attribText = attribEl ? attribEl.textContent.trim() : '';

    // === Dimensiones del canvas ===
    // El ancho W (nominalW) viene de PNG_FORMATS[format]:
    //   - public:     1600 (landscape para uso general).
    //   - newsletter: 1000 (cuadrado-ish para Substack).
    //   - square:     1200 (cuadrado puro, redes sociales).
    //   - mobile:     800  (vertical para Stories / WhatsApp).
    // Si no hay formato del editor (uso público sin sidebar), default 1600
    // y el canvas usa el viewBox del SVG visible (que es desktop landscape).
    let W = format && PNG_FORMATS[format] ? PNG_FORMATS[format].nominalW : 1600;
    // El PNG del MAPA toma su aspecto (canvas) del CONTINENTE, no del formato del editor:
    // Europa cuadrado, Asia/Oceanía/mundo apaisado, África/América vertical.
    let mapCanvasH = null;
    if (isMapChart && typeof RK_CONT_VIEW !== 'undefined') {
      const cv = RK_CONT_VIEW[state[4].continent] || RK_CONT_VIEW.all;
      W = cv.nW; mapCanvasH = cv.nH;
    }
    const padX = (isNewsletter || isMobilePng) ? 32 : 42;
    const padTop = 36;
    const padBottom = mobileFirst ? 24 : 36;
    const titleSize = 36, titleLineH = 48;
    const subSize   = 20, subLineH   = 30;
    const sourceSize = mobileFirst ? 18 : 14, sourceLineH = mobileFirst ? 24 : 20;
    // Firma editorial (convención compartida con el N°3): grande y en 2 renglones en los
    // formatos mobile-first / mapa ("El Atlas" arriba / "Daniel Schteingart" abajo, más chico).
    const attribSize = mobileFirst ? 34 : 28;
    const attribLineH = Math.round(attribSize * 1.15);
    const attribGap = 30;  // gap horizontal entre fuente y firma
    const SOURCE_MAX_RATIO = 0.70;   // caja de la nota más angosta (no compite con la firma)
    const gapTitleSub  = 6;
    // Mobile PNG (portrait alto 800×1200): gap reducido entre el subtítulo y
    // el SVG para que el plot suba en el canvas. En portrait el chrome
    // arriba (padTop + título + subt + gap) consume ~140-148 canvas-px;
    // reducir gapBeforeSvg de 28 a 12 sube el plot 16px (~1.3% del canvas)
    // y deja más espacio vertical para las barras. Otros formatos
    // (public/newsletter/square) mantienen 28 — el plot ahí no compite con
    // un viewport tan vertical.
    const gapBeforeSvg = isMobilePng ? 12 : 28;
    // gapAfterSvg subido a 32 en mobile-first/mapa: los ejes/leyenda necesitan respirar
    // antes del bloque de nota/firma (igual que el N°3). En desktop landscape clásico, 4.
    const gapAfterSvgBase  = mobileFirst ? 32 : 4;
    const gapAfterLegend = mobileFirst ? 38 : 12;   // leyenda equidistante entre chart y nota
    const innerW = W - 2 * padX;

    // Hook opcional para chart-specific extra gap entre SVG y leyenda. Usado
    // por el marimekko (chart 1) cuando hay editor format activo: las
    // etiquetas de país rotadas -45° viven dentro del bottom margin del
    // SVG; el gapAfterSvgBase=4 no era suficiente para evitar que la
    // leyenda canvas se "pegara" visualmente a la huella de los textos
    // colgantes. El chart calcula cuántos canvas-px de buffer necesita
    // según el formato (más en mobile/portrait donde scaleY<1) y los
    // devuelve. Se preserva la versión pública sin editor: si format=null,
    // el hook devuelve 0 y el gap original (4) se mantiene intacto.
    let extraGapBelowSvg = 0;
    if (typeof window.onBeforePngExportGetExtraGap === 'function') {
      try {
        const g = window.onBeforePngExportGetExtraGap(chartId, format);
        if (typeof g === 'number' && g > 0) extraGapBelowSvg = g;
      } catch (_) {}
    }
    const gapAfterSvg = gapAfterSvgBase + extraGapBelowSvg;

    // SVG: aspect ratio del viewBox (lo que se rasteriza). Cuando hay
    // extension (chart 3 con end-labels al margen derecho), el viewBox
    // efectivo es más ancho que el del SVG en pantalla.
    const vb = svg.viewBox.baseVal;
    const extension = VIEWBOX_RIGHT_EXTENSION[chartId] || 0;
    const effectiveVbW = (vb && vb.width) ? vb.width + extension : 760 + extension;
    const effectiveVbH = (vb && vb.height) ? vb.height : 470;
    const svgAspect = effectiveVbW / effectiveVbH;

    // Pre-medir wraps en un canvas temporal con la fuente correcta
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');

    mctx.font = `italic ${subSize}px "Source Serif 4", Georgia, serif`;
    const subLines = subtitleText ? countWrapLines(mctx, subtitleText, innerW) : 0;

    // Calcular si el título necesita wrap (más probable en newsletter por
    // el W reducido a 1000). En el PNG público (W=1600) el título cabe
    // normalmente en una línea, pero igual aplicamos wrap por consistencia.
    mctx.font = `700 ${titleSize}px "Source Serif 4", Georgia, serif`;
    const titleLines = titleText ? countWrapLines(mctx, titleText, innerW) : 0;

    // Reservar espacio para la firma. Caja de la nota más angosta (ratio + no solaparse
    // con la firma agrandada). Misma lógica que el N°3.
    mctx.font = `600 ${attribSize}px "Source Sans 3", -apple-system, sans-serif`;
    const attribW = attribText ? mctx.measureText(attribText).width : 0;
    const sourceMaxW = attribText
      ? Math.min(innerW * SOURCE_MAX_RATIO, innerW - attribW - attribGap)
      : innerW * SOURCE_MAX_RATIO;

    mctx.font = `400 ${sourceSize}px "Source Sans 3", -apple-system, sans-serif`;
    const sourceLines = sourceText ? countWrapLines(mctx, sourceText, sourceMaxW) : 0;

    const showLegend = SHOWS_LEGEND(chartId);
    const legendRows = showLegend ? layoutLegend(mctx, legendItems(), innerW).length : 0;
    const legendH = legendRows * LEGEND_LINE_H;

    const titleH = titleText ? titleLines * titleLineH : 0;
    const subH = subLines * subLineH;
    // La última línea de la nota comparte la vertical con la firma; si la firma es más
    // alta, esa línea necesita ese espacio para no comerse el padBottom.
    const lastLineH = Math.max(sourceLineH, attribSize * 1.15);
    const sourceH = sourceLines > 0 ? (sourceLines - 1) * sourceLineH + lastLineH : 0;
    const attribOnlyH = attribText ? attribSize * 1.15 : 0;   // firma sola si no hay nota

    // Espacio que ocupan los "non-svg" (chrome arriba y abajo del SVG):
    const chromeAbove = padTop + titleH + (subH ? gapTitleSub + subH : 0) + gapBeforeSvg;
    const chromeBelow = (legendH ? gapAfterSvg + legendH : 0)
                     + (sourceH
                          ? (legendH ? gapAfterLegend : gapAfterSvg) + sourceH
                          : (attribOnlyH ? gapAfterSvg + attribOnlyH : 0))
                     + padBottom;

    // === Altura del canvas ===
    // Dos modos:
    //   A. CON formato del editor → H = nominalH (FIJO). El SVG se
    //      redimensiona al espacio disponible (innerW × (nominalH - chrome)),
    //      manteniendo su aspect ratio (letterboxing horizontal si hace
    //      falta). El PNG sale exactamente al tamaño esperado (ej. mobile
    //      = 800×1200 estricto), sin huecos muertos arriba.
    //
    //   B. SIN formato (público desktop default) → H dinámico (calculado
    //      como suma — comportamiento histórico, sin cambios).
    let svgW, svgH, svgX, H;
    if ((format && PNG_FORMATS[format]) || mapCanvasH) {
      H = mapCanvasH || PNG_FORMATS[format].nominalH;
      const availH = Math.max(50, H - chromeAbove - chromeBelow);
      const availW = innerW;
      // Fit del aspect del viewBox al rectángulo disponible.
      // Si availW / availH > svgAspect, la altura manda; SVG menos ancho.
      if (availW / availH > svgAspect) {
        svgH = availH;
        svgW = availH * svgAspect;
      } else {
        svgW = availW;
        svgH = availW / svgAspect;
      }
      // Centrar horizontalmente cuando el SVG es más angosto que innerW.
      svgX = padX + (availW - svgW) / 2;
    } else {
      // Modo histórico: SVG full-width, H se suma.
      svgW = innerW;
      svgH = svgW / svgAspect;
      svgX = padX;
      H = padTop + titleH;
      if (subH) H += gapTitleSub + subH;
      H += gapBeforeSvg + svgH;
      if (legendH) H += gapAfterSvg + legendH;
      if (sourceH) H += (legendH ? gapAfterLegend : gapAfterSvg) + sourceH;
      H += padBottom;
    }

    // === Rasterizar el SVG (con viewBox extendido si corresponde) ===
    const svgClone = svg.cloneNode(true);
    inlineStyles(svg, svgClone);
    if (extension > 0 && vb) {
      svgClone.setAttribute('viewBox', `${vb.x} ${vb.y} ${effectiveVbW} ${effectiveVbH}`);
    }
    // Hook opcional: cada chart puede modificar el clone antes de rasterizarse.
    // Usado por el marimekko (chart 1) para mostrar las 7 líneas promedio
    // regionales en el PNG (en interactivo solo se muestra la hovereada).
    // El hook puede devolver { canvasLabels: [...] } con labels que prefiere
    // pintar directamente en canvas (en lugar de embeberlos en el SVG
    // rasterizado) — útil para textos donde la tipografía es crítica.
    let hookResult = null;
    if (typeof window.onBeforePngExport === 'function') {
      try { hookResult = window.onBeforePngExport(svgClone, chartId); } catch(_) {}
    }
    if (!svgClone.getAttribute('xmlns'))       svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!svgClone.getAttribute('xmlns:xlink')) svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Embeber CSS DENTRO del SVG, en un <style> dentro del clone. Dos
    // capas que se concatenan en orden:
    //
    //   1. Webfonts como data URLs (buildEmbeddedFontCss). Sin esto, las
    //      fonts Source Serif / Source Sans no están disponibles en el
    //      contexto aislado de <img src="blob:...">.
    //   2. CSS del documento (buildEmbeddedDocCss): :root con CSS variables
    //      + estilos por clase (.m-axis-label uppercase + letter-spacing,
    //      .m-table-title uppercase, .m-country-label font-family, etc.).
    //      Sin esto, las clases no aplican y los textos salen en lowercase,
    //      sin tracking, con fallback de sistema. Fix de raíz para que el
    //      PNG sea fiel a lo que se ve en pantalla — ninguna prop CSS se
    //      pierde por estar definida en una clase y no inline.
    const embeddedFontCss = await buildEmbeddedFontCss();
    const embeddedDocCss  = buildEmbeddedDocCss();
    const embeddedCss = embeddedFontCss + '\n' + embeddedDocCss;
    if (embeddedCss.trim()) {
      const SVG_NS = 'http://www.w3.org/2000/svg';
      const styleEl = document.createElementNS(SVG_NS, 'style');
      styleEl.setAttribute('type', 'text/css');
      // CDATA-wrap el CSS para evitar problemas con caracteres especiales
      // dentro del XML serializado.
      styleEl.appendChild(document.createTextNode(embeddedCss));
      svgClone.insertBefore(styleEl, svgClone.firstChild);
    }

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });

    // === Componer el canvas final ===
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = Math.ceil(H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    let y = padTop;

    if (titleText) {
      ctx.fillStyle = PALETTE.ink;
      ctx.font = `700 ${titleSize}px "Source Serif 4", Georgia, serif`;
      ctx.textBaseline = 'top';
      wrapText(ctx, titleText, padX, y, innerW, titleLineH);
      y += titleH;
    }

    if (subtitleText) {
      y += gapTitleSub;
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.font = `italic ${subSize}px "Source Serif 4", Georgia, serif`;
      wrapText(ctx, subtitleText, padX, y, innerW, subLineH);
      y += subH;
    }

    y += gapBeforeSvg;
    const svgTopY = y;
    // svgX (en lugar de padX) — cuando hay formato del editor el SVG puede
    // estar centrado horizontalmente si el aspect ratio no llena el ancho.
    ctx.drawImage(img, svgX, svgTopY, svgW, svgH);
    y += svgH;

    // Si el chart pidió pintar labels en canvas (en vez de dejarlos en el
    // SVG rasterizado), los pintamos acá con la tipografía correcta.
    // Mapeo coords SVG → coords canvas: la altura efectiva del viewBox es
    // la del clone (que puede haber sido recortada por onBeforePngExport).
    if (hookResult && Array.isArray(hookResult.canvasLabels) && hookResult.canvasLabels.length > 0) {
      const cloneVbW = svgClone.viewBox.baseVal.width || effectiveVbW;
      const cloneVbH = svgClone.viewBox.baseVal.height || effectiveVbH;
      const scaleX = svgW / cloneVbW;
      const scaleY = svgH / cloneVbH;
      hookResult.canvasLabels.forEach(lbl => {
        const cx = svgX + lbl.x * scaleX;
        const cy = svgTopY + lbl.y * scaleY;
        const size = (lbl.size || 11) * scaleX;
        const weight = lbl.weight || '400';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = lbl.textAnchor === 'middle' ? 'center'
                      : lbl.textAnchor === 'end'    ? 'right'
                      : 'left';
        ctx.font = `${weight} ${size}px "Source Sans 3", -apple-system, sans-serif`;
        if (lbl.halo) {
          ctx.strokeStyle = lbl.halo;
          ctx.lineWidth = 3 * scaleX;
          ctx.lineJoin = 'round';
          ctx.strokeText(lbl.text, cx, cy);
        }
        ctx.fillStyle = lbl.fill || '#444';
        ctx.fillText(lbl.text, cx, cy);
      });
      ctx.textAlign = 'left';  // restaurar default
    }

    if (showLegend) {
      y += gapAfterSvg;
      drawLegend(ctx, padX, y, innerW);
      y += legendH;
    }

    // En formato del editor, si el SVG no llenó todo el alto (típico en el mapa
    // apaisado), el bloque nota/firma queda equidistante entre el borde inferior del
    // gráfico y el del PNG (centrado en el espacio sobrante), no pegado al gráfico.
    if (format && PNG_FORMATS[format] && sourceText) {
      const gap = (showLegend ? gapAfterLegend : gapAfterSvg);
      const centeredTop = y + (H - y - sourceH) / 2;
      y = Math.max(y, centeredTop - gap);
    }

    if (sourceText) {
      y += (showLegend ? gapAfterLegend : gapAfterSvg);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.textBaseline = 'top';
      ctx.font = `400 ${sourceSize}px "Source Sans 3", -apple-system, sans-serif`;
      wrapText(ctx, sourceText, padX, y, sourceMaxW, sourceLineH);
    }

    // Firma editorial centrada verticalmente con el bloque de nota. En mobile-first/mapa,
    // en 2 renglones ("El Atlas" arriba grande / "Daniel Schteingart" abajo más chico),
    // bloque centrado y anclado al borde derecho. (Convención compartida con el N°3.)
    if (attribText) {
      const sourcesCenterY = sourceText
        ? y + sourceH / 2
        : y + (showLegend ? gapAfterLegend : gapAfterSvg) + attribSize / 2;
      ctx.fillStyle = PALETTE.attribution;
      const attribParts = mobileFirst ? attribText.split('·').map(s => s.trim()).filter(Boolean) : [attribText];
      if (attribParts.length >= 2) {
        const line1 = attribParts[0];
        const line2 = attribParts.slice(1).join(' · ');
        const size1 = attribSize;
        const size2 = Math.round(attribSize * 0.78);   // autor más chico que la marca
        ctx.font = `700 ${size1}px "Source Sans 3", -apple-system, sans-serif`;
        const w1 = ctx.measureText(line1).width;
        ctx.font = `600 ${size2}px "Source Sans 3", -apple-system, sans-serif`;
        const w2 = ctx.measureText(line2).width;
        const blockW = Math.max(w1, w2);
        const cx = W - padX - blockW / 2;   // centro del bloque, pegado a la derecha
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${size1}px "Source Sans 3", -apple-system, sans-serif`;
        ctx.fillText(line1, cx, sourcesCenterY - attribLineH * 0.42);
        ctx.font = `600 ${size2}px "Source Sans 3", -apple-system, sans-serif`;
        ctx.fillText(line2, cx, sourcesCenterY + attribLineH * 0.42);
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${attribSize}px "Source Sans 3", -apple-system, sans-serif`;
        ctx.fillText(attribParts[0], W - padX, sourcesCenterY);
      }
      ctx.textAlign = 'left';   // restaurar defaults
      ctx.textBaseline = 'top';
    }

    URL.revokeObjectURL(svgUrl);

    // === Trigger download ===
    const lang = (typeof LANG !== 'undefined' && LANG === 'en') ? 'en' : 'es';
    // Para el chart 1, el filename depende además del modo del toggle (raw/adj).
    // Leemos state[1].mode si existe; default a 'raw'.
    let filename;
    if (chartId === '1' && state && state[1]) {
      const mode = state[1].mode || 'raw';  // 'raw' | 'adj'
      filename = FILENAMES['1']?.[`${lang}_${mode}`] || `el-atlas-02-chart-1-${mode}.png`;
    } else {
      filename = FILENAMES[chartId]?.[lang] || `el-atlas-02-chart-${chartId}.png`;
    }
    // Sufijo según formato. "public" no agrega sufijo (es el default).
    const fmtSuffix =
      isNewsletter ? '-nl' :
      isSquare     ? '-sq' :
      isMobilePng  ? '-mb' : '';
    if (fmtSuffix) {
      filename = filename.replace(/\.png$/i, fmtSuffix + '.png');
    }
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  document.querySelectorAll('button[data-png]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Click: respeta el formato del dropdown del editor (o usa el SVG
      // visible si el editor no está activo). WYSIWYG — lo que ves se
      // rasteriza.
      downloadChartPNG(btn.dataset.png).catch(err => {
        console.error('PNG export failed:', err);
        alert('No se pudo generar el PNG. Mirá la consola para detalles.');
      });
    });
  });
})();
