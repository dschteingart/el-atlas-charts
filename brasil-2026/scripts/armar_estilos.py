"""Junta fonts/fonts.css (tipografías embebidas) y css/placas.css en js/estilos.js.
La página inyecta ese CSS al cargar y la exportación a PNG lo reusa (el PNG se arma
con el mismo CSS, así sale idéntico a la pantalla, también abriendo desde el disco).
Correr después de editar cualquiera de los dos .css:  python scripts/armar_estilos.py"""
import json, os

RAIZ = os.path.join(os.path.dirname(__file__), '..')
fuentes = open(os.path.join(RAIZ, 'fonts', 'fonts.css'), encoding='utf-8').read()
placas = open(os.path.join(RAIZ, 'css', 'placas.css'), encoding='utf-8').read()
js = ('// Generado por scripts/armar_estilos.py desde fonts/fonts.css y css/placas.css — no editar a mano.\n'
      f'window.ESTILOS = {{ fuentes: {json.dumps(fuentes)}, placas: {json.dumps(placas, ensure_ascii=False)} }};\n'
      '(function () { const s = document.createElement("style"); s.textContent = window.ESTILOS.fuentes + window.ESTILOS.placas; document.head.appendChild(s); })();\n')
open(os.path.join(RAIZ, 'js', 'estilos.js'), 'w', encoding='utf-8').write(js)
print('ok', len(js))
