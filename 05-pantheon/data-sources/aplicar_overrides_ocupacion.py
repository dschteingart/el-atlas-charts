# -*- coding: utf-8 -*-
"""aplicar_overrides_ocupacion.py — corrige ocupaciones mal clasificadas en Pantheon.

Pantheon asigna UNA ocupacion por persona y a veces se equivoca en cual es la
que la hizo memorable: Steve Jobs figura como DESIGNER, Santiago Pena como
ECONOMIST y Francois Duvalier como PHYSICIAN. La tabla editorial vive en
`ocupaciones_overrides.csv` (una fila por persona, con motivo y confianza).

Este script la aplica a los CSV maestros del pipeline y recalcula `dominio`
con la MISMA taxonomia de export_dataset.py. Es idempotente: se puede correr
las veces que haga falta, y si se edita el CSV de overrides se vuelve a correr
y listo.

Archivos que toca (hay copia en _backup-pre-overrides/):
    pantheon_corregido.csv, master_corregido.csv,
    base_depurada.csv, base_depurada_geo.csv

Despues hay que regenerar los data-*.js. La lista y el orden estan en
`REGENERAR.md`.

Correr:  python aplicar_overrides_ocupacion.py
"""
import os
import sys
import warnings

import pandas as pd

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')
DIR = os.path.dirname(os.path.abspath(__file__))

# la taxonomia de rubros de la casa, identica a la de export_dataset.py
_DOM = {
    'Deporte': ['SOCCER PLAYER', 'ATHLETE', 'BASKETBALL PLAYER', 'CYCLIST', 'TENNIS PLAYER', 'SWIMMER', 'WRESTLER', 'RACING DRIVER', 'SKIER', 'HOCKEY PLAYER', 'BOXER', 'GYMNAST', 'HANDBALL PLAYER', 'SKATER', 'COACH', 'CHESS PLAYER', 'FENCER', 'VOLLEYBALL PLAYER', 'BADMINTON PLAYER', 'MARTIAL ARTS', 'REFEREE', 'RUGBY PLAYER', 'CRICKETER', 'TABLE TENNIS PLAYER', 'BASEBALL PLAYER', 'GOLFER', 'SNOOKER', 'AMERICAN FOOTBALL PLAYER', 'MOUNTAINEER', 'POKER PLAYER', 'BULLFIGHTER', 'GO PLAYER', 'GAMER'],
    'Arte y espectáculo': ['ACTOR', 'SINGER', 'MUSICIAN', 'FILM DIRECTOR', 'PAINTER', 'COMPOSER', 'MODEL', 'COMIC ARTIST', 'PORNOGRAPHIC ACTOR', 'PRESENTER', 'PHOTOGRAPHER', 'PRODUCER', 'CONDUCTOR', 'ARTIST', 'DANCER', 'DESIGNER', 'COMEDIAN', 'FASHION DESIGNER', 'SCULPTOR', 'CHEF', 'MAGICIAN', 'CELEBRITY', 'YOUTUBER', 'GAME DESIGNER', 'ARCHITECT'],
    'Ciencia y tecnología': ['BIOLOGIST', 'PHYSICIST', 'MATHEMATICIAN', 'ASTRONOMER', 'CHEMIST', 'ASTRONAUT', 'INVENTOR', 'ENGINEER', 'COMPUTER SCIENTIST', 'PHYSICIAN', 'GEOLOGIST', 'STATISTICIAN'],
    'Humanidades': ['WRITER', 'PHILOSOPHER', 'HISTORIAN', 'ECONOMIST', 'PSYCHOLOGIST', 'LINGUIST', 'ARCHAEOLOGIST', 'ANTHROPOLOGIST', 'GEOGRAPHER', 'SOCIOLOGIST', 'POLITICAL SCIENTIST', 'CRITIC'],
    'Poder y figuras públicas': ['POLITICIAN', 'RELIGIOUS FIGURE', 'MILITARY PERSONNEL', 'NOBLEMAN', 'SOCIAL ACTIVIST', 'COMPANION', 'EXTREMIST', 'JOURNALIST', 'DIPLOMAT', 'MAFIOSO', 'PILOT', 'JUDGE', 'PUBLIC WORKER', 'PIRATE', 'LAWYER', 'OCCULTIST', 'INSPIRATION'],
    'Negocios y exploración': ['BUSINESSPERSON', 'EXPLORER'],
}
OCC2DOM = {o: d for d, l in _DOM.items() for o in l}

ARCHIVOS = ['pantheon_corregido.csv', 'master_corregido.csv',
            'base_depurada.csv', 'base_depurada_geo.csv']


def cargar_overrides(dir_=DIR):
    """Devuelve {id: occupation_atlas}. Lo usa tambien export_dataset.py."""
    p = os.path.join(dir_, 'ocupaciones_overrides.csv')
    if not os.path.exists(p):
        return {}
    t = pd.read_csv(p, encoding='utf-8-sig')
    for c in ('id', 'occupation_atlas'):
        if c not in t.columns:
            raise SystemExit('ocupaciones_overrides.csv sin columna %s' % c)
    malas = sorted(set(t.occupation_atlas) - set(OCC2DOM))
    if malas:
        raise SystemExit('ocupaciones que no existen en la taxonomia: %s' % malas)
    return dict(zip(t.id.astype('int64'), t.occupation_atlas))


def main():
    ov = cargar_overrides()
    print('overrides cargados: %d' % len(ov))
    if not ov:
        return 0

    for fn in ARCHIVOS:
        p = os.path.join(DIR, fn)
        if not os.path.exists(p):
            print('  (falta %s, salteado)' % fn)
            continue
        enc = 'utf-8-sig'
        d = pd.read_csv(p, encoding=enc, low_memory=False)
        if 'id' not in d.columns or 'occupation' not in d.columns:
            print('  (%s sin id/occupation, salteado)' % fn)
            continue
        nuevo = d.id.map(ov)
        tocadas = nuevo.notna() & (nuevo != d.occupation)
        ya = nuevo.notna() & (nuevo == d.occupation)
        if tocadas.any():
            d.loc[tocadas, 'occupation'] = nuevo[tocadas]
        if 'dominio' in d.columns:
            d['dominio'] = d.occupation.map(OCC2DOM)
        d.to_csv(p, index=False, encoding=enc, float_format='%.4f')
        print('  %-26s %d filas | corregidas ahora: %d | ya estaban: %d'
              % (fn, len(d), int(tocadas.sum()), int(ya.sum())))

    # control: que el resultado sea el esperado
    b = pd.read_csv(os.path.join(DIR, 'base_depurada.csv'), encoding='utf-8-sig', low_memory=False)
    t = pd.read_csv(os.path.join(DIR, 'ocupaciones_overrides.csv'), encoding='utf-8-sig')
    chk = b[b.id.isin(t.id)][['id', 'name', 'occupation', 'dominio']].merge(
        t[['id', 'occupation_atlas']], on='id')
    mal = chk[chk.occupation != chk.occupation_atlas]
    print('\ncontrol: %d de %d aplicadas%s'
          % (len(chk) - len(mal), len(t), '' if mal.empty else ' | SIN APLICAR: %s' % list(mal.name)))
    print(chk[['name', 'occupation', 'dominio']].to_string(index=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
