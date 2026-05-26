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

  // Charts 1 (marimekko) y 2 (scatter) llevan leyenda regional de 7 regiones
  // Banco Mundial. El chart 3 (deciles) tiene labels in-line por país, no
  // necesita leyenda separada.
  const SHOWS_LEGEND = chartId => chartId === '1' || chartId === '2';

  // Props CSS que aplican a SVG y necesitamos preservar al rasterizar.
  const SVG_STYLE_PROPS = [
    'fill', 'fill-opacity',
    'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
    'stroke-linejoin', 'stroke-linecap',
    'opacity',
    'font-family', 'font-size', 'font-weight', 'font-style',
    'text-anchor', 'paint-order',
    'display', 'visibility'
  ];

  // Cache del CSS con webfonts embebidas como data URLs. Se construye una
  // vez por sesión (la primera descarga de PNG tarda más, las siguientes
  // son inmediatas).
  let cachedEmbeddedFontCss = null;

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

  async function downloadChartPNG(chartId) {
    const svg = document.getElementById('chart' + chartId);
    if (!svg) return;
    const block = svg.closest('.chart-block');

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
    const W = 1600;
    const padX = 42;
    const padTop = 36;
    const padBottom = 36;
    const titleSize = 36, titleLineH = 48;
    const subSize   = 20, subLineH   = 30;
    const sourceSize = 14, sourceLineH = 20;
    const attribSize = 14;
    const attribGap = 30;  // gap entre fuente y atribución en la última línea
    const gapTitleSub  = 6;
    const gapBeforeSvg = 28;
    const gapAfterSvg  = 4;   // ajustado: la leyenda casi pegada al chart
    const gapAfterLegend = 12;
    const innerW = W - 2 * padX;

    // SVG escalado al ancho disponible, considerando extensión de viewBox para chart 3
    const vb = svg.viewBox.baseVal;
    const extension = VIEWBOX_RIGHT_EXTENSION[chartId] || 0;
    const effectiveVbW = (vb && vb.width) ? vb.width + extension : 760 + extension;
    const effectiveVbH = (vb && vb.height) ? vb.height : 470;
    const svgW = innerW;
    const svgH = svgW * (effectiveVbH / effectiveVbW);

    // Pre-medir wraps en un canvas temporal con la fuente correcta
    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');

    mctx.font = `italic ${subSize}px "Source Serif 4", Georgia, serif`;
    const subLines = subtitleText ? countWrapLines(mctx, subtitleText, innerW) : 0;

    // Reservar espacio para la atribución en la última línea de la fuente.
    // Si la atribución no entra en la misma línea que la fuente, va sola en
    // una línea adicional debajo.
    mctx.font = `600 ${attribSize}px "Source Sans 3", -apple-system, sans-serif`;
    const attribW = attribText ? mctx.measureText(attribText).width : 0;
    const sourceMaxW = attribText ? Math.max(200, innerW - attribW - attribGap) : innerW;

    mctx.font = `400 ${sourceSize}px "Source Sans 3", -apple-system, sans-serif`;
    const sourceLines = sourceText ? countWrapLines(mctx, sourceText, sourceMaxW) : 0;

    const showLegend = SHOWS_LEGEND(chartId);
    const legendRows = showLegend ? layoutLegend(mctx, legendItems(), innerW).length : 0;
    const legendH = legendRows * LEGEND_LINE_H;

    const titleH = titleText ? titleLineH : 0;
    const subH = subLines * subLineH;
    const sourceH = sourceLines * sourceLineH;

    let H = padTop + titleH;
    if (subH) H += gapTitleSub + subH;
    H += gapBeforeSvg + svgH;
    if (legendH) H += gapAfterSvg + legendH;
    if (sourceH) H += (legendH ? gapAfterLegend : gapAfterSvg) + sourceH;
    H += padBottom;

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

    // Embeber las webfonts como data URLs DENTRO del SVG, en un <style>
    // dentro de <defs>. Sin esto, cuando el browser carga el SVG vía
    // <img src="blob:..."> lo hace en un contexto aislado que no tiene
    // acceso a las webfonts cargadas en el documento padre — los <text>
    // del SVG (labels regionales, ticks, etc.) caen al fallback del
    // sistema y se ven con tracking/tipografía equivocada.
    const embeddedCss = await buildEmbeddedFontCss();
    if (embeddedCss) {
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
      ctx.fillText(titleText, padX, y);
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
    ctx.drawImage(img, padX, svgTopY, svgW, svgH);
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
        const cx = padX + lbl.x * scaleX;
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

    if (sourceText) {
      y += (showLegend ? gapAfterLegend : gapAfterSvg);
      ctx.fillStyle = PALETTE.inkSoft;
      ctx.textBaseline = 'top';
      ctx.font = `400 ${sourceSize}px "Source Sans 3", -apple-system, sans-serif`;
      wrapText(ctx, sourceText, padX, y, sourceMaxW, sourceLineH);
    }

    // Atribución editorial alineada al borde derecho, en la línea más baja
    // (misma vertical que la última línea de la fuente).
    if (attribText) {
      const lastLineY = sourceText
        ? y + (sourceLines - 1) * sourceLineH
        : y + (showLegend ? gapAfterLegend : gapAfterSvg);
      ctx.fillStyle = PALETTE.attribution;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.font = `600 ${attribSize}px "Source Sans 3", -apple-system, sans-serif`;
      ctx.fillText(attribText, W - padX, lastLineY);
      ctx.textAlign = 'left';  // restaurar default
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
      downloadChartPNG(btn.dataset.png).catch(err => {
        console.error('PNG export failed:', err);
        alert('No se pudo generar el PNG. Mirá la consola para detalles.');
      });
    });
  });
})();
