"""Miniaturas livianas para las tarjetas de los índices.

Las tarjetas mostraban el PNG de la tarjeta social (1200x1200, 200-480 KB cada
uno) achicado a ~300 px: el índice del N°3 bajaba más de 9 MB en el celular.
Este script genera thumbs/card/<nombre>.webp (640 px de ancho, nítido en
pantallas 2x) y apunta las <img class="idx-thumb"> de los index*.html a esas
versiones. Los og:image siguen usando los PNG grandes (las redes los piden así).

    python tools/make_cards.py            # genera lo que falte y reescribe los índices
    python tools/make_cards.py --force    # regenera todas las miniaturas
"""
import re
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
WIDTH, QUALITY = 640, 80
IMG_TAG = re.compile(r'<img class="idx-thumb"[^>]*>')
# Toma tanto el PNG original como la tarjeta ya convertida (thumbs/card/x.webp),
# así una segunda corrida regenera la tarjeta si el PNG de origen cambió.
THUMB = re.compile(r'((?:\.\./[\w-]+/|\./)thumbs/)(?:card/)?([\w.-]+?)\.(?:png|webp)')


def card_for(folder: Path, rel: str, force: bool) -> bool:
    """rel = './thumbs/x.png' o '../otra/thumbs/x.png' relativo a folder."""
    src = (folder / rel).resolve()
    if not src.exists():
        return False
    dst = src.parent / 'card' / (src.stem + '.webp')
    if force or not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        dst.parent.mkdir(exist_ok=True)
        im = Image.open(src).convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=QUALITY, method=6)
    return True


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # consola de Windows (cp1252)
    force = '--force' in sys.argv
    for page in sorted(REPO.glob('*/index*.html')):
        html = page.read_text(encoding='utf-8')

        def fix_tag(m):
            def fix_url(u):
                png = u.group(1) + u.group(2) + '.png'
                if card_for(page.parent, png, force):
                    return u.group(1) + 'card/' + u.group(2) + '.webp'
                return u.group(0)  # sin PNG de origen: se deja como estaba
            return THUMB.sub(fix_url, m.group(0))

        new = IMG_TAG.sub(fix_tag, html)
        if new != html:
            page.write_text(new, encoding='utf-8', newline='')
            print('índice actualizado:', page.relative_to(REPO))


if __name__ == '__main__':
    main()
