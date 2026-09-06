# -*- coding: utf-8 -*-
"""Documenta el mapeo ocupacion -> dominio propio vs dominio oficial Pantheon 1.0.

Los dominios de El Atlas N°5 NO son los de Pantheon: son un reagrupamiento propio
(6 en vez de 8) sobre las ocupaciones de Pantheon. Motivos: el archivo 2025 no trae
la columna domain, la taxonomia oficial 1.0 no cubre 20 ocupaciones nuevas, y los
dominios oficiales dejan astillas ilegibles (Exploration 0,9%, Business & Law 1,0%).
Decision ratificada por Daniel el 6/9/2026 (periodistas y abogados quedan en Poder).

Chequeo de robustez que blinda el chart 3: el share de America Latina en la ciencia
mundial da 1,0% con nuestro criterio (duras+astronautas) y 1,0% con el de Pantheon
(duras+sociales). El hallazgo no depende de la taxonomia.

Salida: taxonomia_dominios.csv en data-sources del repo.
"""
import os, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
DIR = os.path.dirname(os.path.abspath(__file__))
TAX1 = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#3 - Futbol\talento\data\pantheon1_taxonomy.csv'
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon\data-sources\taxonomia_dominios.csv'

_DOM={'Deporte':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],'Arte y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],'Negocios y exploración':['BUSINESSPERSON','EXPLORER']}
nuestro = {o: d for d, l in _DOM.items() for o in l}

t = pd.read_csv(TAX1)
ofi = t.groupby('occupation').agg(dominio_pantheon1=('domain', lambda s: s.mode()[0]),
                                  industria_pantheon1=('industry', lambda s: s.mode()[0]))
b = pd.read_csv(os.path.join(DIR, 'base_depurada.csv'), encoding='utf-8-sig', low_memory=False)
n = b.occupation.value_counts()

filas = []
for o in sorted(nuestro):
    filas.append({'ocupacion': o, 'dominio_atlas': nuestro[o],
                  'dominio_pantheon1': ofi.dominio_pantheon1.get(o, '(no existe en 1.0)'),
                  'industria_pantheon1': ofi.industria_pantheon1.get(o, ''),
                  'n_base_depurada': int(n.get(o, 0))})
d = pd.DataFrame(filas).sort_values(['dominio_atlas', 'n_base_depurada'], ascending=[True, False])
d.to_csv(OUT, index=False, encoding='utf-8-sig')
cruces = d[(~d.dominio_pantheon1.str.startswith('(')) &
           (d.dominio_atlas.map({'Deporte':'SPORTS','Arte y espectáculo':'ARTS','Ciencia y tecnología':'SCIENCE & TECHNOLOGY','Humanidades':'HUMANITIES'}) != d.dominio_pantheon1) &
           (~((d.dominio_atlas=='Poder y figuras públicas') & d.dominio_pantheon1.isin(['INSTITUTIONS','PUBLIC FIGURE']))) &
           (~((d.dominio_atlas=='Negocios y exploración') & d.dominio_pantheon1.isin(['BUSINESS & LAW','EXPLORATION'])))]
print('=> taxonomia_dominios.csv | %d ocupaciones | %d cruces vs Pantheon 1.0 | %d sin dominio oficial'
      % (len(d), len(cruces), int(d.dominio_pantheon1.str.startswith('(').sum())))
