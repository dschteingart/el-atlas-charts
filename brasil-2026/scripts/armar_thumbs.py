"""Miniaturas de la portada (una por gráfico, en castellano e inglés) recortadas de los PNG de png/.
Correr después de scripts/exportar_png.py:  python scripts/armar_thumbs.py
Cada miniatura es el cuerpo del gráfico (sin título ni fuente) sobre un lienzo 760×400; la
tarjeta la muestra con object-fit: cover, así que el gráfico va centrado con aire arriba y abajo."""
import os
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FONDO = (250, 248, 243)  # --bg de las placas
W, H = 760, 400
W_LIENZO = 1920
# id de la placa -> PNG de su vista por defecto
FUENTES = {
    'pib': '01-pib', 'desempleo': '02-desempleo', 'empleo': '03a-empleo-tipo', 'pobreza': '04-pobreza',
    'ingreso': '05-ingreso-real', 'gini': '06-gini', 'homicidios': '07-homicidios', 'consumo': '08a-consumo-variacion',
    'fiscal': '09-fiscal', 'comercio': '10-comercio-argentina', 'encuestas': '11-encuestas-ambas-vueltas',
    'mapa': '12d-mapa-2022-2v-municipios',
}
CUERPO = (60, 960)                             # márgenes laterales y fin del cuerpo (arriba de la fuente) en el lienzo 1920×1080
MAPA, PANEL = (50, 45, 1035, 1040), (1120, 140, 1880, 300)  # el mapa entero y las barras de los dos candidatos


def encajar(im, ancho=None, alto=None):
    k = ancho / im.width if ancho else alto / im.height
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def fin_bajada(im):
    """Primer renglón libre debajo de la bajada (tiene uno o dos renglones según la placa)."""
    g = im.convert('L').crop((84, 0, 1836, 400))
    oscuro = [g.crop((0, y, g.width, y + 1)).getextrema()[0] < 120 for y in range(g.height)]
    y = 175                                     # debajo del título
    while y < 400 and not any(oscuro[y:y + 24]):  # salta hasta el texto de la bajada
        y += 1
    while y < 400 and any(oscuro[y:y + 24]):      # y la recorre hasta el primer hueco de 24 px
        y += 1
    return y + 8


def miniatura(origen):
    im = Image.open(origen).convert('RGB')
    lienzo = Image.new('RGB', (W, H), FONDO)
    if 'mapa' in origen:
        m = encajar(im.crop(MAPA), alto=H - 24)
        lienzo.paste(m, (40, 12))
        p = encajar(im.crop(PANEL), ancho=W - m.width - 80)
        lienzo.paste(p, (m.width + 60, (H - p.height) // 2))
    else:
        c = encajar(im.crop((CUERPO[0], fin_bajada(im), W_LIENZO - CUERPO[0], CUERPO[1])), ancho=W)
        lienzo.paste(c, (0, (H - c.height) // 2))
    return lienzo


def main():
    os.makedirs(os.path.join(RAIZ, 'thumbs'), exist_ok=True)
    for pid, png in FUENTES.items():
        for sub, suf in (('', ''), ('en', '.en')):
            origen = os.path.join(RAIZ, 'png', sub, png + '.png')
            destino = os.path.join(RAIZ, 'thumbs', f'{pid}{suf}.png')
            miniatura(origen).save(destino, optimize=True)
            print(destino, os.path.getsize(destino) // 1024, 'KB')


if __name__ == '__main__':
    main()
