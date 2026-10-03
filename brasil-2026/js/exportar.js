/* Descargas: CSV (convención de El Atlas: primera fila = encabezados en el idioma de la
   página, BOM para Excel, campos citados, números con punto decimal) y PNG 1920×1080 de
   la placa tal como se ve (vista, zoom y modo del mapa incluidos).
   El PNG se arma clonando la placa dentro de un <foreignObject> con el MISMO CSS de la
   página (window.ESTILOS, tipografías embebidas) y rasterizándolo en un canvas. Si el
   navegador no lo permite (Safari puede bloquearlo), baja la imagen pre-exportada de png/. */
(function () {
  const EN = () => window.LANG === 'en';

  function bajar(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function csv({ archivo, cols, filas }) {
    const celda = v => {
      if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return '';
      if (typeof v === 'number') return String(Math.round(v * 1e4) / 1e4);
      const s = String(v);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const txt = [cols, ...filas].map(f => f.map(celda).join(',')).join('\n') + '\n';
    bajar(new Blob(['﻿' + txt], { type: 'text/csv;charset=utf-8' }), archivo + '.csv');
  }

  function cargarImg(src) {
    return new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  }

  async function png(archivo, respaldo) {
    const sec = document.querySelector('#escenario > section');
    try {
      const clon = sec.cloneNode(true);
      clon.querySelectorAll('.tip, .no-png, .volver, .toggle').forEach(n => n.remove());
      const html = new XMLSerializer().serializeToString(clon);
      const css = (window.ESTILOS.fuentes + window.ESTILOS.placas).replace(/]]>/g, ']] >');
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">' +
        '<foreignObject x="0" y="0" width="1920" height="1080">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" class="sin-anim" style="width:1920px;height:1080px;position:relative;overflow:hidden;background:#FAF8F3">' +
        '<style><![CDATA[' + css + ']]></style>' + html + '</div></foreignObject></svg>';
      const img = await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      await new Promise(r => setTimeout(r, 250));  // margen para que la imagen termine de pintar las tipografías
      const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#FAF8F3'; ctx.fillRect(0, 0, 1920, 1080);
      ctx.drawImage(img, 0, 0, 1920, 1080);
      const blob = await new Promise((ok, mal) => { try { cv.toBlob(b => (b ? ok(b) : mal(new Error('vacío'))), 'image/png'); } catch (e) { mal(e); } });
      bajar(blob, archivo + '.png');
    } catch (e) {
      console.warn('PNG en vivo no disponible, uso la imagen pre-exportada', e);
      if (respaldo) { const a = document.createElement('a'); a.href = respaldo; a.download = archivo + '.png'; document.body.appendChild(a); a.click(); a.remove(); }
      else alert(EN() ? 'This browser could not generate the PNG.' : 'Este navegador no pudo generar el PNG.');
    }
  }

  window.Exportar = { csv, png, bajar };
})();
