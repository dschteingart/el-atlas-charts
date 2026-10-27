"""Genera lib/articulos.js: qué nota de Substack cita cada gráfico, en ES y EN.

Lee la API pública de las dos publicaciones (archivo + cuerpo de cada post),
busca los links a dschteingart.github.io/el-atlas-charts y arma el mapa
gráfico -> nota que usan las páginas de gráficos para el renglón "De la nota"
y el link al otro idioma. Correrlo después de publicar cada número:

    python tools/sync_articulos.py

No necesita credenciales ni dependencias fuera de la biblioteca estándar.
"""
import html
import json
import re
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

PUBS = {'es': 'https://elatlas.substack.com', 'en': 'https://atlasdevelopment.substack.com'}
SITE = 'dschteingart.github.io/el-atlas-charts/'
REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'lib' / 'articulos.js'
ALIAS_CARPETAS = {'03b-partidos': '03-futbol'}  # carpetas que el lector ve como un mismo número


def get_json(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (el-atlas sync)'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:  # 429 de Substack: esperar y reintentar
            if i == tries - 1:
                raise
            time.sleep(8 * (i + 1))


def archive(base):
    posts, off = [], 0
    while True:
        page = get_json(f'{base}/api/v1/archive?sort=new&limit=50&offset={off}')
        posts += page
        if len(page) < 50:
            return posts
        off += 50


def chart_key(href):
    """URL de un gráfico -> clave 'carpeta/archivo.html' (None si no es del sitio)."""
    href = html.unescape(href)
    if SITE not in href:
        return None
    path = urlparse(href).path.split('/el-atlas-charts/', 1)[-1]
    if not path or path.endswith('/'):
        path += 'index.html'
    path = re.sub(r'-en\.html$', '.html', path)  # la landing EN es el mismo gráfico
    if not path.endswith('.html') or '/' not in path:
        return None
    return path


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # consola de Windows (cp1252)
    posts = {}                       # 'es:slug' -> datos
    links = defaultdict(Counter)     # chart -> Counter('es:slug')
    for lang, base in PUBS.items():
        for p in archive(base):
            if p.get('type') != 'newsletter' or p.get('audience') != 'everyone':
                continue
            full = get_json(f"{base}/api/v1/posts/{p['slug']}")
            time.sleep(0.6)
            key = f"{lang}:{p['slug']}"
            posts[key] = {
                'lang': lang,
                'title': p['title'].strip(),
                'url': f"{base}/p/{p['slug']}",
                'date': p['post_date'][:10],
            }
            for href in re.findall(r'href="([^"]+)"', full.get('body_html') or ''):
                k = chart_key(href)
                if k:
                    links[k][key] += 1

    # Nota principal de cada gráfico por idioma: la que más lo linkea; empate -> la más vieja.
    charts = {}
    for k, cnt in sorted(links.items()):
        entry = {}
        for lang in PUBS:
            cands = [(n, posts[s]['date'], s) for s, n in cnt.items() if posts[s]['lang'] == lang]
            if cands:
                cands.sort(key=lambda c: (-c[0], c[1]))
                entry[lang] = cands[0][2]
        charts[k] = entry

    # Respaldo por carpeta, para los gráficos que la nota no cita uno por uno: la nota
    # que más gráficos de la carpeta linkea. 03b-partidos es parte del N°3 (fútbol).
    por_carpeta = defaultdict(lambda: defaultdict(Counter))
    for k, cnt in links.items():
        for s in cnt:
            por_carpeta[k.split('/')[0]][posts[s]['lang']][s] += 1
    carpetas = {}
    for c, by_lang in sorted(por_carpeta.items()):
        carpetas[c] = {lang: min(cnt, key=lambda s: (-cnt[s], posts[s]['date'])) for lang, cnt in by_lang.items()}
    for alias, base in ALIAS_CARPETAS.items():
        if base in carpetas and alias not in carpetas:
            carpetas[alias] = carpetas[base]

    # Pares ES <-> EN: misma fecha de publicación y, si hay varias, más gráficos en común.
    pares = {}
    for s, d in posts.items():
        if d['lang'] != 'es':
            continue
        mine = {k for k, c in links.items() if s in c}
        best = None
        for t, e in posts.items():
            if e['lang'] != 'en' or e['date'] != d['date']:
                continue
            common = len(mine & {k for k, c in links.items() if t in c})
            if best is None or common > best[0]:
                best = (common, t)
        if best:
            pares[s] = best[1]
            pares[best[1]] = s

    data = {'actualizado': time.strftime('%Y-%m-%d'), 'notas': posts, 'graficos': charts,
            'carpetas': carpetas, 'pares': pares}
    body = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True)
    OUT.write_text(
        '// Generado por tools/sync_articulos.py: no editar a mano.\n'
        '// Qué nota de Substack cita cada gráfico (ES y EN) y los pares de notas ES <-> EN.\n'
        f'window.ATLAS_ARTICULOS = {body};\n', encoding='utf-8')
    sin_en = [k for k, v in charts.items() if 'en' not in v]
    print(f'{len(posts)} notas, {len(charts)} gráficos citados, {len(pares) // 2} pares ES/EN -> {OUT}')
    if sin_en:
        print('Sin nota EN:', ', '.join(sin_en))


if __name__ == '__main__':
    sys.exit(main())
