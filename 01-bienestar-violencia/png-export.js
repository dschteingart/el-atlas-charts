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
  const FILENAMES = {
    '1': { es: 'el-atlas-01-bienestar-vs-pib.png',     en: 'the-atlas-01-wellbeing-vs-gdp.png'      },
    '2': { es: 'el-atlas-01-homicidios-vs-pib.png',    en: 'the-atlas-01-homicide-vs-gdp.png'       },
    '3': { es: 'el-atlas-01-serie-homicidios.png',     en: 'the-atlas-01-homicide-time-series.png'  }
  };

  // El chart 3 tiene end-labels al final de las líneas que en EN
  // ("Latin America and the Caribbean") exceden el viewBox por la derecha.
  // En la página interactiva el SVG tiene overflow: visible y se ven; al
  // rasterizar a PNG el viewBox manda y el label se corta. Solución:
  // ampliar el viewBox solo del clone que va al PNG.
  const VIEWBOX_RIGHT_EXTENSION = { '3': 80 };

  // Solo los scatters llevan leyenda. El chart 3 ya tiene LATAM y Mundo
  // etiquetados al final de cada línea, no necesita leyenda separada.
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
  const LEGEND_FONT_SIZE = 14;
  const LEGEND_LINE_H = 24;
  const LEGEND_ITEM_GAP = 22;     // separación horizontal entre items
  const LEGEND_CIRCLE_R = 5;
  const LEGEND_CIRCLE_TEXT_GAP = 8;

  function legendItems() {
    return REGION_ORDER.map(reg => ({
      color: REGION_COLORS[reg],
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

    const titleText    = block.querySelector('.chart-title')?.textContent.trim()    || '';
    const subtitleText = block.querySelector('.chart-subtitle')?.textContent.trim() || '';
    const sourceEl = document.querySelector('.footer p[data-i18n$="sources"]');
    const sourceText = sourceEl ? sourceEl.textContent.trim() : '';
    const attribEl = document.querySelector('.footer .attribution');
    const attribText = attribEl ? attribEl.textContent.trim() : '';

    // === Dimensiones del canvas ===
    const W = 1600;
    const padX = 60;
    const padTop = 36;
    const padBottom = 36;
    const titleSize = 36, titleLineH = 48;
    const subSize   = 20, subLineH   = 30;
    const sourceSize = 14, sourceLineH = 20;
    const attribSize = 14;
    const attribGap = 30;  // gap entre fuente y atribución en la última línea
    const gapTitleSub  = 6;
    const gapBeforeSvg = 28;
    const gapAfterSvg  = 22;
    const gapAfterLegend = 18;
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
    if (!svgClone.getAttribute('xmlns'))       svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!svgClone.getAttribute('xmlns:xlink')) svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

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
    ctx.drawImage(img, padX, y, svgW, svgH);
    y += svgH;

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
    const filename = FILENAMES[chartId]?.[lang] || `el-atlas-chart-${chartId}.png`;
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
