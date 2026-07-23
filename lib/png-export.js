// PNG export COMPARTIDO de El Atlas (lib/) — lo usan N°2, N°3 y el especial.
// Detecta el número por globals (ES_ESPECIAL_PARTIDOS / CONF_FIFA_*) y elige
// FILENAMES, leyendas y formatos acordes. Unificado en la Fase 2 de la
// auditoría (2026-07); la copia canónica previa era 03b-partidos/png-export.js.
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

  // Detectamos si estamos en N°3 (fútbol) por presencia de las constantes
  // de regions-fifa.js. Si están: usamos los filenames + legend del N°3.
  // Si no: caemos al N°2 (regiones WB + filenames de gini/deciles).
  // El ESPECIAL "geografía de los partidos" se detecta por su dataset propio
  // (sentinel en i18n-issue.js). Tiene prioridad sobre el N°3 porque también carga
  // regions-fifa.js (comparte la paleta de confederaciones).
  const IS_ESPECIAL = typeof ES_ESPECIAL_PARTIDOS !== 'undefined';
  const IS_N5 = typeof ES_N5_INTOLERANCIA !== 'undefined';
  const IS_N3 = !IS_ESPECIAL && !IS_N5
             && typeof CONF_FIFA_ORDER !== 'undefined'
             && typeof CONF_FIFA_COLORS !== 'undefined';

  // Filenames bilingües por chart.
  // El chart 1 del N°2 (marimekko) cambia con el toggle: el filename refleja
  // el modo activo (raw|adj) además del idioma. Daniel exporta 2 PNGs
  // distintos moviendo el toggle: 1a (raw) y 1b (adj).
  const FILENAMES = IS_N5 ? {
    '1': { es: 'el-atlas-05-ranking-vecinos.png',   en: 'the-atlas-05-neighbours-ranking.png' },
    '2': { es: 'el-atlas-05-evolucion-vecinos.png', en: 'the-atlas-05-neighbours-trend.png'   },
    '3': { es: 'el-atlas-05-mapa-vecinos.png',      en: 'the-atlas-05-neighbours-map.png'     },
    '4': { es: 'el-atlas-05-perfil-pais.png',       en: 'the-atlas-05-country-profile.png'    },
    '5': { es: 'el-atlas-05-declarado-implicito.png', en: 'the-atlas-05-declared-implicit.png' },
    '6': { es: 'el-atlas-05-latinobarometro.png',   en: 'the-atlas-05-latinobarometro.png'    }
  } : IS_ESPECIAL ? {
    '1': { es: 'el-atlas-especial-actividad.png',     en: 'the-atlas-special-activity.png'      },
    '2': { es: 'el-atlas-especial-amistosos.png',     en: 'the-atlas-special-friendlies.png'    },
    '3': { es: 'el-atlas-especial-globalizacion.png', en: 'the-atlas-special-globalization.png' },
    '4': { es: 'el-atlas-especial-duelos.png',        en: 'the-atlas-special-rivalries.png'     },
    '5': { es: 'el-atlas-especial-flujos.png',        en: 'the-atlas-special-flows.png'         },
    '6': { es: 'el-atlas-especial-ciudades.png',      en: 'the-atlas-special-cities.png'        },
    '7': { es: 'el-atlas-especial-neutral.png',       en: 'the-atlas-special-neutral.png'       },
    '8': { es: 'el-atlas-especial-versus.png',        en: 'the-atlas-special-head-to-head.png'  },
    '9': { es: 'el-atlas-especial-goles.png',         en: 'the-atlas-special-goals.png'         },
    '10': { es: 'el-atlas-especial-instancias.png',   en: 'the-atlas-special-stages.png'        }
  } : IS_N3 ? {
    '1': { es: 'el-atlas-03-elo-vs-pib.png',         en: 'the-atlas-03-elo-vs-gdp.png'         },
    '2': { es: 'el-atlas-03-talento-per-capita.png', en: 'the-atlas-03-talent-per-million.png' },
    '3': { es: 'el-atlas-03-mapa-clubes.png',        en: 'the-atlas-03-map-clubs.png'          },
    '4': { es: 'el-atlas-03-talento-vs-clubes.png',  en: 'the-atlas-03-talent-vs-clubs.png'    }
  } : {
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

  // Charts que llevan leyenda en el PNG:
  //   - N°2 chart 2 (scatter Gini): 7 regiones WB.
  //   - N°3 chart 1 (scatter Elo/PIB): 6 confederaciones FIFA.
  //   - N°3 chart 4 (talento-clubes): 6 confederaciones FIFA.
  // Los charts con leyenda inline en el SVG (mapa con gradient bar,
  // talento per cápita con etiquetas en barras) NO necesitan leyenda
  // extra del PNG.
  const SHOWS_LEGEND = chartId => IS_N5
    ? false   // N°5: la leyenda de regiones va dentro del SVG (rk_drawSvgLegend)
    : IS_ESPECIAL
    ? (chartId === '4')
    : IS_N3
      ? (chartId === '1' || chartId === '4')
      : (chartId === '2');

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
      // ORDEN CRÍTICO: el estilo COMPUTED (resuelto) va ÚLTIMO para que GANE
      // al inline original. El inline original puede tener var(--bg) (ej. el
      // stroke/halo de las etiquetas de país); var() NO resuelve dentro del
      // SVG rasterizado como <img> → stroke caía a 'none' y el halo
      // desaparecía (el texto se fundía con los puntos del mismo color y los
      // puntos parecían quedar arriba). Con computed último, el stroke queda
      // como rgb() resuelto y el halo se rasteriza igual que en pantalla.
      targetNodes[i].setAttribute('style', prevStyle + ';' + inline);
    }
  }

  // wrapText / countWrapLines respetan saltos de línea explícitos (\n) como
  // cortes DUROS y, dentro de cada segmento, hacen wrap greedy por ancho. Sirve
  // para forzar dónde corta un texto sin depender del ancho — ej. el caption de
  // fuentes pone la definición de "Exportado"/"Exported" en su propio renglón.
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let lines = 0;
    String(text).split('\n').forEach(para => {
      const words = para.split(/\s+/).filter(Boolean);
      let line = '';
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
    });
    return lines;
  }

  function countWrapLines(ctx, text, maxWidth) {
    let lines = 0;
    String(text).split('\n').forEach(para => {
      const words = para.split(/\s+/).filter(Boolean);
      let line = '';
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
    });
    return lines;
  }

  // === Leyenda de regiones (charts 1 y 2) ===
  // Configuración de la leyenda canvas. Son LET (no const) porque en
  // formatos mobile-first las escalamos ~1.9x: el PNG se reduce a un tercio
  // en el celu, y a 15px la leyenda quedaba en ~5px (ilegible).
  // downloadChartPNG las ajusta según el formato antes de medir/dibujar.
  let LEGEND_FONT_SIZE = 15;
  let LEGEND_LINE_H = 24;
  let LEGEND_ITEM_GAP = 20;     // separación horizontal entre items
  let LEGEND_CIRCLE_R = 5;
  let LEGEND_CIRCLE_TEXT_GAP = 7;
  // Valores base para poder resetear (cada export recalcula desde la base).
  const LEGEND_BASE = { font: 15, lineH: 24, gap: 20, r: 5, textGap: 7 };

  function legendItems() {
    // N°3 y ESPECIAL: confederaciones FIFA (paleta de regions-fifa.js).
    if (IS_N3 || IS_ESPECIAL) {
      return CONF_FIFA_ORDER.map(conf => ({
        color: CONF_FIFA_COLORS[conf],
        label: conf
      }));
    }
    // N°2: 7 regiones del Banco Mundial (regions-wb.js).
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
    // Selector flexible: en el N°2 los SVGs tenían id "chart1", "chart2",
    // "chart3" coincidiendo con el chartId. En el N°3, cada HTML es
    // standalone y el SVG principal SIEMPRE usa id="chart1" (no hay
    // conflicto porque solo uno está en el DOM a la vez).
    // CRÍTICO: el block.querySelector('svg') NO sirve como fallback
    // porque el .chart-block puede contener SVGs auxiliares (leyenda
    // gradient en el mapa, etc.) y agarraría el primero que aparece.
    // El bug del chart 3 PNG era exactamente ese: tomaba #m-legend-grad
    // en vez de #chart1 (el mapa).
    let svg = document.getElementById('chart' + chartId);
    if (!svg) svg = document.getElementById('chart1');  // standalone N°3
    if (!svg) {
      console.error('[png-export] no SVG found for chartId', chartId);
      return;
    }
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
    // ── Determinar el formato target ──────────────────────────────────
    // 1. Editor activo (ae-ever-activated, o sea ?nl=1 alguna vez) →
    //    respeta el formato del dropdown del editor.
    // 2. Sin editor → default mobile-first CUADRADO.
    let format = null;
    // El editor manda SOLO si abriste con ?nl en la URL. Antes alcanzaba
    // con ae-ever-activated (que persiste en localStorage de sesiones
    // viejas con ?nl=1) — eso hacía que un PNG "normal" tomara el formato
    // guardado en vez del default cuadrado. Daniel: "default cuadrado al
    // clic, con ?nl=1 poder elegir". El gate correcto es la URL.
    const urlHasEditor = new URLSearchParams(location.search).has('nl');
    const editorActive =
      urlHasEditor &&
      window.AtlasEditor &&
      typeof window.AtlasEditor.getConfig === 'function';
    if (editorActive) {
      const cfg = window.AtlasEditor.getConfig();
      if (cfg && cfg.format && PNG_FORMATS[cfg.format]) format = cfg.format;
      else format = 'square';  // editor activo sin formato elegido → square
    } else if (window.__atlasSupportsFormats) {
      // Default mobile-first. Cada chart puede pedir un formato propio vía
      // __atlasDefaultPngFormat (ej. el mapa usa 'worldmap', apaisado, porque
      // un cuadrado le deja medio canvas vacío). El resto usa 'square'.
      const def = window.__atlasDefaultPngFormat;
      format = (def && PNG_FORMATS[def]) ? def : 'square';
    }

    // ── Forzar el re-render del gráfico en el formato target ───────────
    // CRÍTICO (bug encontrado con Daniel): antes, en el camino "editor
    // activo" NO se re-renderizaba — se asumía WYSIWYG (que el SVG en
    // pantalla ya estaba en ese formato). Pero si el editor quedó marcado
    // como activo por localStorage de una sesión previa (?nl=1 antes), el
    // gráfico en pantalla podía estar en DESKTOP mientras el PNG usaba
    // formato cuadrado → chrome grande pero gráfico chico. Ahora SIEMPRE
    // re-renderizamos en el formato target antes de rasterizar (vía el
    // override que lee getActivePngFormat), y restauramos al terminar.
    // Hook de PREPARACIÓN (lo usa el mapa del N°2, chart 4): re-render
    // reencuadrado al continente antes de rasterizar. Si el hook prepara
    // (devuelve true), NO aplicamos el override de formato estándar — el
    // chart tiene su propio reencuadre — y al final se llama
    // onAfterPngExportRestore para volver al interactivo.
    let didPrepare = false;
    if (typeof window.onBeforePngExportPrepare === 'function') {
      try { didPrepare = !!window.onBeforePngExportPrepare(chartId, format); } catch (_) {}
    }
    let pngOverrideApplied = false;
    if (!didPrepare && format && window.__atlasSupportsFormats && typeof window.__atlasRedraw === 'function') {
      window.__atlasPngFormatOverride = format;
      pngOverrideApplied = true;
      window.__atlasRedraw();  // re-render síncrono del #chart1 en `format`
    }

    // Helper para restaurar el render de pantalla al terminar (o si algo
    // falla). Idempotente.
    function restorePngFormat() {
      if (!pngOverrideApplied) return;
      pngOverrideApplied = false;
      window.__atlasPngFormatOverride = null;
      if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
    }

    const isNewsletter = format === 'newsletter';
    const isSquare     = format === 'square';
    const isMobilePng  = format === 'mobile';
    const isWorldmap   = format === 'worldmap';

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
      '500 14px "Source Sans 3"',
      '600 14px "Source Sans 3"',
      '700 14px "Source Sans 3"'
    ]);

    // RE-RENDER en formato DESPUÉS de cargar las webfonts. Los charts que miden
    // el ancho del texto para adaptar sus márgenes (regla: nunca texto fuera del
    // marco) tienen que medir con la webfont YA cargada; el primer redraw (arriba)
    // pudo medir con la fuente fallback (más angosta) y dejar márgenes cortos.
    if (pngOverrideApplied && typeof window.__atlasRedraw === 'function') window.__atlasRedraw();

    const titleText    = block.querySelector('.chart-title')?.textContent.trim()    || '';
    let   subtitleText = block.querySelector('.chart-subtitle')?.textContent.trim() || '';
    // Hook opcional: el chart puede dar un subtítulo distinto para el PNG (más
    // corto que el del HTML — ej. el mapa, donde la leyenda ya explica el color).
    if (typeof window.onBeforePngExportGetSubtitle === 'function') {
      try {
        const ov = window.onBeforePngExportGetSubtitle(chartId);
        if (ov) subtitleText = ov;
      } catch (_) {}
    }
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
    const W = format && PNG_FORMATS[format] ? PNG_FORMATS[format].nominalW : 1600;
    const padX = (isNewsletter || isMobilePng) ? 32 : 42;
    const padTop = 36;
    // Mobile-first: nota + atribución MÁS cerca del borde inferior (Daniel).
    // El espacio que se libera abajo se lo damos al gráfico (vbH más alto)
    // y a equidistribuir los gaps leyenda/nota/eje-x.
    const padBottom = (isSquare || isNewsletter || isMobilePng || isWorldmap) ? 24 : 36;

    // ¿Es un formato mobile-first? (cuadrado/newsletter/portrait). En esos
    // el PNG se ve a un tercio en el celu, así que TODO el chrome (título,
    // subtítulo, nota, leyenda, atribución) va sobredimensionado. En el
    // monitor parece grande; en el celu se lee. El formato "public"
    // (apaisado, para desktop) y el N°2 mantienen los tamaños históricos.
    const mobileFirst = isNewsletter || isSquare || isMobilePng || isWorldmap;

    const titleSize  = mobileFirst ? 52 : 36, titleLineH  = mobileFirst ? 64 : 48;
    const subSize    = mobileFirst ? 32 : 20, subLineH    = mobileFirst ? 42 : 30;
    // Datos: más chico que antes (Daniel) — la nota es info de soporte, no
    // debe competir con el gráfico. 18 mobile-first (~6px en celu, leíble
    // como pie de página), 14 desktop.
    const sourceSize = mobileFirst ? 18 : 14, sourceLineH = mobileFirst ? 24 : 20;
    // Atribución: firma del Atlas. Se dibuja en DOS renglones en
    // mobile-first ("El Atlas" / "Daniel Schteingart") — ver más abajo.
    const attribSize = mobileFirst ? 34 : 28;
    const attribLineH = Math.round(attribSize * 1.15);

    // Escalar la leyenda canvas para mobile-first (~1.9x sobre la base).
    if (mobileFirst) {
      LEGEND_FONT_SIZE      = Math.round(LEGEND_BASE.font    * 1.9);  // ~29
      LEGEND_LINE_H         = Math.round(LEGEND_BASE.lineH   * 1.9);  // ~46
      LEGEND_ITEM_GAP       = Math.round(LEGEND_BASE.gap     * 1.6);  // ~32
      LEGEND_CIRCLE_R       = Math.round(LEGEND_BASE.r       * 1.8);  // ~9
      LEGEND_CIRCLE_TEXT_GAP= Math.round(LEGEND_BASE.textGap * 1.6);  // ~11
    } else {
      LEGEND_FONT_SIZE = LEGEND_BASE.font; LEGEND_LINE_H = LEGEND_BASE.lineH;
      LEGEND_ITEM_GAP = LEGEND_BASE.gap;   LEGEND_CIRCLE_R = LEGEND_BASE.r;
      LEGEND_CIRCLE_TEXT_GAP = LEGEND_BASE.textGap;
    }
    const attribGap = 30;  // gap entre fuente y atribución en la última línea
    // Sources con caja más angosta: límite duro al 70% del ancho útil.
    // Sin esto, el bloque de fuente queda como una sola línea muy larga
    // que se lee mal y compite visualmente con la atribución agrandada.
    const SOURCE_MAX_RATIO = 0.70;
    const gapTitleSub  = 6;
    // Mobile PNG (portrait alto 800×1200): gap reducido entre el subtítulo y
    // el SVG para que el plot suba en el canvas. En portrait el chrome
    // arriba (padTop + título + subt + gap) consume ~140-148 canvas-px;
    // reducir gapBeforeSvg de 28 a 12 sube el plot 16px (~1.3% del canvas)
    // y deja más espacio vertical para las barras. Otros formatos
    // (public/newsletter/square) mantienen 28 — el plot ahí no compite con
    // un viewport tan vertical.
    const gapBeforeSvg = isMobilePng ? 12 : 28;
    // gapAfterSvg subido de 4 → 32: los ejes del gráfico necesitan
    // respirar antes del bloque de sources / atribución. Empuja la nota
    // y el "El Atlas · Daniel Schteingart" más abajo, dejando aire entre
    // el último tick del eje X y la fuente.
    const gapAfterSvgBase  = 32;
    // Mobile-first: gap leyenda→nota agrandado para EQUIDISTAR con el gap
    // eje-x→leyenda (Daniel). Antes 12 (la nota quedaba pegada a la leyenda);
    // ahora ~38 para que la leyenda quede centrada entre el título del eje X
    // y la nota de abajo.
    const gapAfterLegend = (isSquare || isNewsletter || isMobilePng) ? 38 : 12;
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

    // Reservar espacio para la atribución en la última línea de la fuente.
    // Si la atribución no entra en la misma línea que la fuente, va sola en
    // una línea adicional debajo.
    mctx.font = `600 ${attribSize}px "Source Sans 3", -apple-system, sans-serif`;
    const attribW = attribText ? mctx.measureText(attribText).width : 0;
    // Caja angosta: respetar el ratio + asegurar que NO se solape con la
    // atribución (más grande ahora). El min() agarra el más restrictivo.
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
    // sourceH: la última línea del sources comparte la vertical con la
    // atribución (alineadas por baseline). Si la atribución es más alta
    // (28 px vs 20 del sourceLineH), la última línea necesita ese espacio
    // para no comerse el padBottom.
    const lastLineH = Math.max(sourceLineH, attribSize * 1.15);
    const sourceH = sourceLines > 0
      ? (sourceLines - 1) * sourceLineH + lastLineH
      : 0;
    // Si no hay sources, la atribución igual ocupa su propio bloque.
    const attribOnlyH = attribText ? attribSize * 1.15 : 0;

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
    if (format && PNG_FORMATS[format]) {
      H = PNG_FORMATS[format].nominalH;
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
    // Setear width/height explícitos en el clone. Sin esto, algunos
    // browsers cargan el <img> con dimensiones intrínsecas de 0×0 cuando
    // el SVG original solo declara viewBox (sin width/height inline).
    // Resultado: drawImage rasteriza sobre un canvas vacío.
    svgClone.setAttribute('width',  effectiveVbW);
    svgClone.setAttribute('height', effectiveVbH);
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

    // En formato del editor, si el SVG no llenó todo el alto disponible (típico
    // en mapas apaisados), el bloque fuente/firma queda equidistante entre el
    // borde inferior del gráfico y el del PNG (centrado en el espacio sobrante),
    // en vez de pegado al gráfico con un hueco muerto abajo.
    if (format && PNG_FORMATS[format] && sourceText) {
      const gap = (showLegend ? gapAfterLegend : gapAfterSvg);
      // El bloque se dibuja centrado en sourcesCenterY = footerTop + sourceH/2.
      // Para que quede equidistante, ese centro debe caer en el punto medio real
      // entre el borde inferior del gráfico (y) y el del PNG (H) → footerTop =
      // (y + H)/2 - sourceH/2. (Sin restar padBottom: eso lo sesgaba hacia arriba.)
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

    // Atribución alineada al borde derecho y CENTRADA VERTICALMENTE con
    // respecto al bloque de fuente.
    //   - Si el sources tiene 3 renglones, la atribución queda alineada
    //     con la mitad del segundo (el centro del bloque).
    //   - Si tiene 1 renglón, queda alineada con el centro de esa línea.
    //   - Si no hay sources, reserva su propio espacio centrado.
    // Truco: textBaseline='middle' posiciona el texto centrado vertical
    // alrededor del y dado.
    if (attribText) {
      const sourcesCenterY = sourceText
        ? y + sourceH / 2
        : y + (showLegend ? gapAfterLegend : gapAfterSvg) + attribSize / 2;
      ctx.fillStyle = PALETTE.attribution;
      const attribParts = mobileFirst ? attribText.split('·').map(s => s.trim()).filter(Boolean) : [attribText];
      if (attribParts.length >= 2) {
        // Mobile-first: bloque de dos renglones CENTRADOS entre sí
        // ("El Atlas" arriba, "Daniel Schteingart" abajo, más chico).
        // El bloque se ancla por su borde derecho en W - padX; las dos
        // líneas se centran respecto del ancho del bloque (la más ancha).
        const line1 = attribParts[0];
        const line2 = attribParts.slice(1).join(' · ');
        const size1 = attribSize;
        const size2 = Math.round(attribSize * 0.78);  // Daniel Schteingart más chico
        ctx.font = `700 ${size1}px "Source Sans 3", -apple-system, sans-serif`;
        const w1 = ctx.measureText(line1).width;
        ctx.font = `600 ${size2}px "Source Sans 3", -apple-system, sans-serif`;
        const w2 = ctx.measureText(line2).width;
        const blockW = Math.max(w1, w2);
        const cx = W - padX - blockW / 2;  // centro del bloque, pegado a la derecha
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
    // En el N°2 el chart 1 (marimekko) varía con el toggle raw/adj y el
    // filename refleja el modo. En el N°3 no hay toggle similar — se usa
    // FILENAMES[chartId][lang] directo.
    let filename;
    // La rama raw/adj es SOLO del N°2 (marimekko del chart 1 con toggle). El
    // especial y el N°3 usan FILENAMES[chartId][lang] directo (sin ella, el
    // chart 1 del especial caía a "el-atlas-02-chart-1-raw.png").
    if (!IS_N3 && !IS_ESPECIAL && !IS_N5 && chartId === '1' && state && state[1]) {
      const mode = state[1].mode || 'raw';  // 'raw' | 'adj'
      filename = FILENAMES['1']?.[`${lang}_${mode}`] || `el-atlas-02-chart-1-${mode}.png`;
    } else {
      const prefix = IS_N5 ? 'el-atlas-05' : IS_ESPECIAL ? 'el-atlas-especial' : IS_N3 ? 'el-atlas-03' : 'el-atlas-02';
      filename = FILENAMES[chartId]?.[lang] || `${prefix}-chart-${chartId}.png`;
    }
    // Sufijo según formato. El default mobile-first (square por override,
    // sin editor) NO lleva sufijo — es la imagen principal. Los formatos
    // elegidos a mano en el editor sí llevan sufijo para distinguirlos.
    const fmtSuffix = pngOverrideApplied ? '' : (
      isNewsletter ? '-nl' :
      isSquare     ? '-sq' :
      isMobilePng  ? '-mb' : '');
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
      // Restaurar el mapa reencuadrado al interactivo (N°2 chart 4). El
      // canvas ya quedó dibujado, así que esto no lo afecta.
      if (didPrepare && typeof window.onAfterPngExportRestore === 'function') {
        try { window.onAfterPngExportRestore(chartId); } catch (_) {}
      }
      // Restaurar el render de pantalla (deshace el override de square).
      restorePngFormat();
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
        // Fallback: si el export se cortó antes de restaurar, limpiamos el
        // override de formato y re-renderizamos a pantalla para no dejar el
        // chart trabado en cuadrado.
        if (window.__atlasPngFormatOverride) {
          window.__atlasPngFormatOverride = null;
          if (typeof window.__atlasRedraw === 'function') window.__atlasRedraw();
        }
      });
    });
  });
})();
