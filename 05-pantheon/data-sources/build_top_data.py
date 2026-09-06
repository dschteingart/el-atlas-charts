# -*- coding: utf-8 -*-
"""data-top.js para la tabla quien-es-quien del N°5.

Top 5.000 figuras por score (multiidioma), con nombre en es y en, pais, region,
ocupacion y dominio en ambos idiomas. Necesita nombres_es.csv (build_top_names.py).
"""
import io, os, json, re, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
CHARTS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
TOP = 5000

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()].nsmallest(TOP, 'rank_score').copy()
M = pd.read_csv(os.path.join(DIR, 'master_corregido.csv'), low_memory=False)[['id', 'iso3']]
d = d.merge(M, on='id', how='left')
N = pd.read_csv(os.path.join(DIR, 'nombres_es.csv'), encoding='utf-8-sig')[['id', 'name_es']]
d = d.merge(N, on='id', how='left')
d['name_es'] = d.name_es.fillna('')
F = pd.read_csv(os.path.join(DIR, 'fotos.csv'), encoding='utf-8-sig')
d = d.merge(F, on='id', how='left')
d['img'] = d.img.fillna('')
print('top: %d | con iso3: %d | con nombre es: %d'
      % (len(d), int(d.iso3.notna().sum()), int((d.name_es != '').sum())))

# --- isoMeta: nombres es/en + region, desde el isoMeta del mapa (fuente unica) ---
s = io.open(os.path.join(CHARTS, 'data-percap-map.js'), encoding='utf-8').read()
PC = json.loads(s.split('window.PCMAP=', 1)[1].rstrip().rstrip(';'))
meta_by_iso = {m['iso']: m for m in PC['isoMeta']}
isos = sorted({i for i in d.iso3.dropna() if i in meta_by_iso})
sin_meta = sorted({i for i in d.iso3.dropna() if i not in meta_by_iso})
if sin_meta: print('iso sin meta (se muestran con el codigo):', sin_meta)
for i in sin_meta: isos.append(i)
iso_idx = {c: k for k, c in enumerate(isos)}
isoMeta = [{'iso': c,
            'es': meta_by_iso.get(c, {}).get('es', c),
            'en': meta_by_iso.get(c, {}).get('en', c),
            'reg': meta_by_iso.get(c, {}).get('reg')} for c in isos]

# --- ocupaciones: es desde el OCC_ES del pipeline, en = title case del codigo ---
OCC_ES = {'SOCCER PLAYER':'Futbolista','ATHLETE':'Atleta','BASKETBALL PLAYER':'Basquetbolista','CYCLIST':'Ciclista','TENNIS PLAYER':'Tenista','SWIMMER':'Nadador/a','WRESTLER':'Luchador/a','RACING DRIVER':'Piloto de carreras','SKIER':'Esquiador/a','HOCKEY PLAYER':'Jugador/a de hockey','BOXER':'Boxeador/a','GYMNAST':'Gimnasta','HANDBALL PLAYER':'Handbolista','SKATER':'Patinador/a','COACH':'DT','CHESS PLAYER':'Ajedrecista','FENCER':'Esgrimista','VOLLEYBALL PLAYER':'Voleibolista','BADMINTON PLAYER':'Jugador/a de bádminton','MARTIAL ARTS':'Artes marciales','REFEREE':'Árbitro/a','RUGBY PLAYER':'Rugbier','CRICKETER':'Jugador/a de críquet','TABLE TENNIS PLAYER':'Tenis de mesa','BASEBALL PLAYER':'Beisbolista','GOLFER':'Golfista','SNOOKER':'Jugador/a de snooker','AMERICAN FOOTBALL PLAYER':'Fútbol americano','MOUNTAINEER':'Montañista','POKER PLAYER':'Jugador/a de póker','BULLFIGHTER':'Torero/a','GO PLAYER':'Jugador/a de go','GAMER':'Gamer','ACTOR':'Actor/Actriz','SINGER':'Cantante','MUSICIAN':'Músico/a','FILM DIRECTOR':'Director/a de cine','PAINTER':'Pintor/a','COMPOSER':'Compositor/a','MODEL':'Modelo','COMIC ARTIST':'Historietista','PORNOGRAPHIC ACTOR':'Actor/actriz porno','PRESENTER':'Presentador/a','PHOTOGRAPHER':'Fotógrafo/a','PRODUCER':'Productor/a','CONDUCTOR':'Director/a de orquesta','ARTIST':'Artista','DANCER':'Bailarín/a','DESIGNER':'Diseñador/a','COMEDIAN':'Comediante','FASHION DESIGNER':'Diseñador/a de moda','SCULPTOR':'Escultor/a','CHEF':'Chef','MAGICIAN':'Mago/a','CELEBRITY':'Celebridad','YOUTUBER':'Youtuber','GAME DESIGNER':'Diseñador/a de juegos','ARCHITECT':'Arquitecto/a','BIOLOGIST':'Biólogo/a','PHYSICIST':'Físico/a','MATHEMATICIAN':'Matemático/a','ASTRONOMER':'Astrónomo/a','CHEMIST':'Químico/a','ASTRONAUT':'Astronauta','INVENTOR':'Inventor/a','ENGINEER':'Ingeniero/a','COMPUTER SCIENTIST':'Informático/a','PHYSICIAN':'Médico/a','GEOLOGIST':'Geólogo/a','STATISTICIAN':'Estadístico/a','WRITER':'Escritor/a','PHILOSOPHER':'Filósofo/a','HISTORIAN':'Historiador/a','ECONOMIST':'Economista','PSYCHOLOGIST':'Psicólogo/a','LINGUIST':'Lingüista','ARCHAEOLOGIST':'Arqueólogo/a','ANTHROPOLOGIST':'Antropólogo/a','GEOGRAPHER':'Geógrafo/a','SOCIOLOGIST':'Sociólogo/a','POLITICAL SCIENTIST':'Politólogo/a','CRITIC':'Crítico/a','POLITICIAN':'Político/a','RELIGIOUS FIGURE':'Figura religiosa','MILITARY PERSONNEL':'Militar','NOBLEMAN':'Noble','SOCIAL ACTIVIST':'Activista','COMPANION':'Consorte','EXTREMIST':'Extremista','JOURNALIST':'Periodista','DIPLOMAT':'Diplomático/a','MAFIOSO':'Mafioso','PILOT':'Aviador/a','JUDGE':'Juez/a','PUBLIC WORKER':'Funcionario/a','PIRATE':'Pirata','LAWYER':'Abogado/a','OCCULTIST':'Ocultista','INSPIRATION':'Inspiración','BUSINESSPERSON':'Empresario/a','EXPLORER':'Explorador/a'}
occs_raw = sorted(d.occupation.unique())
occ_idx = {o: k for k, o in enumerate(occs_raw)}
DOMS = [('Deporte', 'Sport'), ('Arte y espectáculo', 'Arts & entertainment'),
        ('Ciencia y tecnología', 'Science & tech'), ('Humanidades', 'Humanities'),
        ('Poder y figuras públicas', 'Power & public life'), ('Negocios y exploración', 'Business & exploration')]
dom_idx = {es: k for k, (es, en) in enumerate(DOMS)}
occMeta = []
occ2dom = d.groupby('occupation').dominio.agg(lambda s2: s2.mode()[0]).to_dict()
for o in occs_raw:
    occMeta.append({'es': OCC_ES.get(o, o.title()), 'en': o.title(), 'dom': dom_idx[occ2dom[o]]})

rows = []
for _, x in d.sort_values('rank_score').iterrows():
    rows.append([int(x.rank_score),
                 x['name'],
                 x.name_es if x.name_es and x.name_es != x['name'] else '',
                 iso_idx.get(x.iso3, -1),
                 occ_idx[x.occupation],
                 round(float(x.score), 1),
                 int(x.birthyear) if pd.notna(x.birthyear) else None,
                 x.img])

out = {'isoMeta': isoMeta, 'occs': occMeta,
       'doms': [{'es': a, 'en': b} for a, b in DOMS],
       'rows': rows}
dest = os.path.join(CHARTS, 'data-top.js')
io.open(dest, 'w', encoding='utf-8', newline='').write(
    '// Tabla quien-es-quien: top %d figuras por score (multiidioma). rows=[rank,name_en,name_es(si difiere),isoIdx,occIdx,hpi,birthyear,img(P18 Commons)]\n' % TOP
    + 'window.TOPFIGS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('=> data-top.js | %d filas | %.0f KB' % (len(rows), os.path.getsize(dest) / 1024))
print('   top 3:', [r[1] for r in rows[:3]])
