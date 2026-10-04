"""Arma (o actualiza) el sitio público del escrutinio en vivo: https://dschteingart.github.io/brasil-2026-vivo/

Es la misma página de las placas, en modo "en vivo público" (window.VIVO_PUBLICO): solo el mapa, la
proyección, cómo viene el escrutinio, dónde se mueve el voto y quién votó a quién (vista en vivo). Los datos
los sube `vivo.py --publicar` a data/vivo/ de ese repo cada ~75 s, y una GitHub Action republica el sitio.

    python scripts/armar_sitio_vivo.py            # copia los archivos al repo local del sitio
    python scripts/armar_sitio_vivo.py --push     # y además lo sube
"""
import argparse, os, re, shutil, subprocess

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEST = os.path.join(os.path.expanduser('~'), 'Documents', 'el-atlas-worktrees', 'brasil-2026-vivo')
REMOTO = 'https://github.com/dschteingart/brasil-2026-vivo.git'
URL = 'https://dschteingart.github.io/brasil-2026-vivo/'
ARCHIVOS = ['js/estilos.js', 'js/charts.js', 'js/exportar.js', 'js/mapa.js', 'js/placas.js', 'js/geo-br.js',
            'data/series.js', 'data/encuestas.js', 'data/elecciones-2022.js', 'data/socio.js', 'thumbs/og-balotaje-2022.png']

FLUJO = """name: Publicar sitio
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
# un despliegue a la vez; si llegan datos nuevos mientras se publica, queda el último en espera
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  publicar:
    environment:
      name: github-pages
      url: ${{ steps.despliegue.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: despliegue
        uses: actions/deploy-pages@v4
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--push', action='store_true')
    a = ap.parse_args()
    os.makedirs(DEST, exist_ok=True)
    for f in ARCHIVOS:
        os.makedirs(os.path.dirname(os.path.join(DEST, f)), exist_ok=True)
        shutil.copyfile(os.path.join(RAIZ, f), os.path.join(DEST, f))
    os.makedirs(os.path.join(DEST, 'data', 'vivo'), exist_ok=True)
    open(os.path.join(DEST, 'data', 'vivo', '.gitkeep'), 'w').close()
    open(os.path.join(DEST, '.nojekyll'), 'w').close()
    os.makedirs(os.path.join(DEST, '.github', 'workflows'), exist_ok=True)
    open(os.path.join(DEST, '.github', 'workflows', 'publicar.yml'), 'w', encoding='utf-8').write(FLUJO)

    # index.html: el cargador de la página original, con la marca de sitio público en vivo y su propia tarjeta para redes
    orig = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    cuerpo = re.search(r'<body>.*</body>', orig, flags=re.S).group(0)
    titulo = 'Brasil 2026: escrutinio en vivo — El Atlas'
    desc = ('Escrutinio de la elección presidencial de Brasil 2026 en vivo: resultados por estado y municipio, una proyección '
            'del resultado final y dónde se mueve el voto respecto de 2022. Se actualiza solo.')
    html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="El Atlas · Cartografías del desarrollo">
<meta property="og:url" content="{URL}">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{URL}thumbs/og-balotaje-2022.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{titulo}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{URL}thumbs/og-balotaje-2022.png">
<script>window.LANG = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es'; window.VIVO_PUBLICO = true;</script>
</head>
{cuerpo}
</html>
"""
    open(os.path.join(DEST, 'index.html'), 'w', encoding='utf-8').write(html)
    open(os.path.join(DEST, 'README.md'), 'w', encoding='utf-8').write(
        f'# Brasil 2026 · escrutinio en vivo\n\n{URL}\n\nGenerado desde el especial de El Atlas (`scripts/armar_sitio_vivo.py`); '
        'los datos de `data/vivo/` los sube `vivo.py --publicar` durante el escrutinio.\n')

    git = lambda *x: subprocess.run(['git', *x], cwd=DEST, capture_output=True, text=True)
    if not os.path.isdir(os.path.join(DEST, '.git')):
        git('init', '-q', '-b', 'main')
        git('remote', 'add', 'origin', REMOTO)
    git('add', '-A')
    hay = git('rev-parse', '--verify', 'HEAD').returncode == 0
    r = git('commit', '-q', *(['--amend'] if hay else []), '-m', 'sitio del escrutinio en vivo')
    print('commit:', (r.stdout + r.stderr).strip() or 'ok')
    if a.push:
        r = git('push', '-q', '-f', 'origin', 'HEAD:main')
        print('push:', (r.stdout + r.stderr).strip() or 'ok')
    print('listo:', DEST, '->', URL)


if __name__ == '__main__':
    main()
