// SVG export para los charts del N°3.
//
// Botones con data-svg="<chartId>" disparan la descarga. El SVG
// resultante es autocontenido (xmlns + estilos inlineados desde
// getComputedStyle del original) y abre limpio en Figma / Illustrator.
//
// Diferencia con png-export.js: el SVG NO rasteriza ni alinea con un
// canvas; clonamos el <svg> de pantalla, EXTENDEMOS el viewBox para
// alojar título / subtítulo / sources / atribución como <text> editables
// (Daniel los ajusta en Figma), y serializamos.
//
// Filename: el-atlas-03-<chart-name>.svg (mismo prefijo que los PNG).

(function setupSVGExport() {
  const FILENAMES = {
    '1': 'el-atlas-03-elo-vs-pib.svg',
    '2': 'el-atlas-03-talento-per-capita.svg',
    '3': 'el-atlas-03-mapa-clubes.svg',
    '4': 'el-atlas-03-talento-vs-clubes.svg'
  };

  // Margen del viewBox extendido para los textos.
  const TOP_MARGIN = 140;     // título + subtítulo
  const BOTTOM_MARGIN = 140;  // sources + atribución (un poco más alto
                              //  por la atribución 28 px duplicada)
  const PAD_LEFT = 20;

  // Props CSS que copiamos como style inline al clone. Tiene que coincidir
  // con lo que el SVG en pantalla muestra — algunas (text-transform,
  // letter-spacing, font-variant-numeric) NO son atributos SVG estándar
  // y se preservan SOLO como style. Figma ignora algunas (text-transform
  // como CSS), así que para esa específicamente aplicamos al textContent.
  const STYLE_PROPS = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'font-variant', 'font-variant-numeric', 'font-feature-settings',
    'letter-spacing', 'word-spacing',
    'text-anchor', 'paint-order', 'dominant-baseline',
    'fill', 'fill-opacity',
    'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
    'stroke-linejoin', 'stroke-linecap',
    'opacity'
  ];

  const NS = 'http://www.w3.org/2000/svg';

  function inlineStyles(srcRoot, dstRoot) {
    const srcEls = srcRoot.querySelectorAll('*');
    const dstEls = dstRoot.querySelectorAll('*');
    for (let i = 0; i < srcEls.length; i++) {
      const src = srcEls[i];
      const dst = dstEls[i];
      if (!dst) continue;
      const cs = window.getComputedStyle(src);
      let inline = '';
      STYLE_PROPS.forEach(prop => {
        const v = cs.getPropertyValue(prop);
        if (v) inline += prop + ':' + v + ';';
      });
      const prev = dst.getAttribute('style') || '';
      dst.setAttribute('style', inline + prev);
      // text-transform: uppercase aplicado al textContent (Figma ignora
      // el CSS inline). Asegura que los uppercase del Atlas (axis-key,
      // banner-key, etc.) viajen correctamente.
      if (src.tagName === 'text' &&
          cs.getPropertyValue('text-transform') === 'uppercase') {
        dst.textContent = (src.textContent || '').toUpperCase();
      }
    }
  }

  function makeText(content, x, y, fontFamily, fontSize, fontWeight, fill, opts) {
    const tEl = document.createElementNS(NS, 'text');
    tEl.setAttribute('x', x);
    tEl.setAttribute('y', y);
    tEl.setAttribute('style',
      'font-family:' + fontFamily + ';' +
      'font-size:' + fontSize + 'px;' +
      'font-weight:' + fontWeight + ';' +
      (opts && opts.fontStyle ? 'font-style:' + opts.fontStyle + ';' : '') +
      'fill:' + fill + ';' +
      (opts && opts.textAnchor ? 'text-anchor:' + opts.textAnchor + ';' : '')
    );
    tEl.textContent = content;
    return tEl;
  }

  // Wrap manual: 110 chars por línea para caption (font 13px).
  function wrapWords(text, maxChars) {
    const words = (text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const test = cur ? cur + ' ' + w : w;
      if (test.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function downloadChartSVG(chartId) {
    // Selector: mismo flow que png-export.js — los HTMLs del N°3 usan
    // id="chart1" siempre. Fallback al id genérico chart{N} por si el
    // chartId matchea un id directo.
    let svg = document.getElementById('chart' + chartId);
    if (!svg) svg = document.getElementById('chart1');
    if (!svg) {
      console.error('[svg-export] no SVG found for chartId', chartId);
      return;
    }

    // 1. Clonar (no tocamos el original).
    const clone = svg.cloneNode(true);

    // 2. Inlinear estilos computed.
    inlineStyles(svg, clone);

    // 3. xmlns para que sea standalone.
    if (!clone.getAttribute('xmlns'))       clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // 4. Extender el viewBox para alojar título/subtítulo arriba y
    //    sources/atribución abajo. Wrappeo todo el contenido en un <g>
    //    con translate(0, TOP_MARGIN) — el chart no se mueve relativo a
    //    sus coords originales, solo se shift como bloque.
    const vb = clone.viewBox.baseVal;
    const vbX = vb.x, vbY = vb.y, vbW = vb.width, vbH = vb.height;
    const wrap = document.createElementNS(NS, 'g');
    wrap.setAttribute('transform', 'translate(0,' + TOP_MARGIN + ')');
    const movables = [];
    for (let i = 0; i < clone.childNodes.length; i++) {
      const ch = clone.childNodes[i];
      if (ch.nodeType !== 1) continue;
      if (ch.tagName === 'defs' || ch.tagName === 'style') continue;
      movables.push(ch);
    }
    movables.forEach(ch => wrap.appendChild(ch));
    clone.appendChild(wrap);
    const newH = vbH + TOP_MARGIN + BOTTOM_MARGIN;
    clone.setAttribute('viewBox', vbX + ' ' + vbY + ' ' + vbW + ' ' + newH);
    clone.removeAttribute('width');
    clone.removeAttribute('height');

    // 5. Leer textos del DOM.
    const block = svg.closest('.chart-block') || document;
    const titleEl    = block.querySelector('.chart-title');
    const subEl      = block.querySelector('.chart-subtitle');
    // Sources: el chart-block puede no tener el .footer adentro (el
    // footer es hermano). Buscamos en todo el documento.
    const capEl   = document.querySelector('.sources.m-desktop-only')
                 || document.querySelector('p.sources')
                 || document.querySelector('.footer p.sources');
    const attrEl  = document.querySelector('.attribution');

    // Si hay editor activo con overrides, prevalecen.
    const aeCfg = (window.AtlasEditor && window.AtlasEditor.getConfig)
      ? window.AtlasEditor.getConfig() : null;
    const lang = (aeCfg && aeCfg.lang)
      ? aeCfg.lang
      : ((typeof LANG !== 'undefined') ? LANG : 'es');
    const customTitle = (aeCfg && aeCfg.texts && aeCfg.texts[lang] && aeCfg.texts[lang].title)    || '';
    const customSub   = (aeCfg && aeCfg.texts && aeCfg.texts[lang] && aeCfg.texts[lang].subtitle) || '';
    const customCap   = (aeCfg && aeCfg.texts && aeCfg.texts[lang] && aeCfg.texts[lang].caption)  || '';

    const titleText = (customTitle.trim()) || (titleEl ? titleEl.textContent.trim() : '');
    const subText   = (customSub.trim())   || (subEl   ? subEl.textContent.trim()   : '');
    const capText   = (customCap.trim())   || (capEl   ? capEl.textContent.trim()   : '');
    const attrText  = attrEl ? attrEl.textContent.trim() : 'El Atlas · Daniel Schteingart';

    // 6. Insertar título y subtítulo arriba.
    if (titleText) {
      clone.appendChild(makeText(
        titleText, PAD_LEFT, 50,
        '"Source Serif 4", Georgia, serif', 36, 700, '#1A1A1A'
      ));
    }
    if (subText) {
      clone.appendChild(makeText(
        subText, PAD_LEFT, 90,
        '"Source Serif 4", Georgia, serif', 18, 400, '#4A4A4A',
        { fontStyle: 'italic' }
      ));
    }

    // 7. Insertar sources + atribución abajo.
    const capStartY = vbY + TOP_MARGIN + vbH + 40;
    if (capText) {
      wrapWords(capText, 110).forEach((line, idx) => {
        clone.appendChild(makeText(
          line, PAD_LEFT, capStartY + idx * 18,
          '"Source Sans 3", -apple-system, sans-serif', 13, 400, '#4A4A4A'
        ));
      });
    }
    if (attrText) {
      const attrY = vbY + TOP_MARGIN + vbH + BOTTOM_MARGIN - 30;
      clone.appendChild(makeText(
        attrText, vbX + vbW - PAD_LEFT, attrY,
        '"Source Sans 3", -apple-system, sans-serif', 14, 600, '#BE5D32',
        { textAnchor: 'end' }
      ));
    }

    // 8. Serializar y descargar.
    const svgString = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILENAMES[chartId] || ('el-atlas-03-chart-' + chartId + '.svg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Listener: cualquier botón con data-svg="N" dispara el download.
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button[data-svg]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const chartId = btn.getAttribute('data-svg');
        try {
          downloadChartSVG(chartId);
        } catch (err) {
          console.error('[svg-export] download failed:', err);
          alert('No se pudo generar el SVG. Revisá la consola.');
        }
      });
    });
  });

  // Exponer la función al window por si el editor sidebar la quiere usar.
  window.downloadChartSVG = downloadChartSVG;
})();
