# -*- coding: utf-8 -*-
"""Normaliza los retratos a JPEG 96px q80 (algunos formatos venian pesados)."""
import io, os, sys, warnings
import pandas as pd
from PIL import Image
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
Image.MAX_IMAGE_PIXELS = None
DIR = os.path.dirname(os.path.abspath(__file__))
DEST = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\fotos'
F = pd.read_csv(os.path.join(DIR, 'fotos_local.csv'), encoding='utf-8-sig')
ok, mal = [], 0
for _, r in F.iterrows():
    src = os.path.join(DEST, r.file)
    dst_name = '%d.jpg' % int(r.id)
    dst = os.path.join(DEST, dst_name)
    try:
        im = Image.open(src)
        im.thumbnail((96, 96))
        fondo = Image.new('RGB', im.size, (250, 248, 243))
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            fondo.paste(im, mask=im.split()[-1])
        else:
            fondo = im.convert('RGB')
        fondo.save(dst, 'JPEG', quality=80, optimize=True)
        if os.path.abspath(src) != os.path.abspath(dst) and os.path.exists(src):
            os.remove(src)
        ok.append((int(r.id), dst_name))
    except Exception:
        mal += 1
        try: os.remove(src)
        except OSError: pass
pd.DataFrame(ok, columns=['id', 'file']).to_csv(os.path.join(DIR, 'fotos_local.csv'), index=False, encoding='utf-8-sig')
tam = sum(os.path.getsize(os.path.join(DEST, f)) for f in os.listdir(DEST)) / 1e6
print('=> %d retratos jpg (%.1f MB) | ilegibles descartados: %d' % (len(ok), tam, mal))
