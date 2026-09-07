# -*- coding: utf-8 -*-
"""Datasets de la tabla el-ranking-de-la-fama (top.html), en DOS archivos:

  data-top.js       meta (isoMeta/occs/doms) + top 5.000 filas  -> carga inicial
  data-top-full.js  el RESTO de la base depurada (window.TOPFIGS_REST) -> diferido

Los indices de isoMeta/occs se construyen sobre la base COMPLETA, asi que valen
para ambos archivos. Fotos: el top 5.000 usa los archivos locales de fotos/
(id.jpg); del 5.001 en adelante va el nombre de archivo de Commons (hotlink en
la tabla; el PNG las intenta con CORS y si no, circulo neutro).

rows = [rank, name_en, name_es(si difiere), isoIdx, occIdx, hpi, birthyear, img, genero]
Necesita: nombres_es.csv, fotos.csv (build_all_names_fotos.py), fotos_local.csv.
"""
import io, os, json, re, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
CHARTS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
CORTE = 5000

C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)
d = C[(C.multi_idioma == 1) & C.score.notna()].copy()
M = pd.read_csv(os.path.join(DIR, 'master_corregido.csv'), low_memory=False)[['id', 'iso3', 'gender']]
d = d.merge(M, on='id', how='left')
N = pd.read_csv(os.path.join(DIR, 'nombres_es.csv'), encoding='utf-8-sig')[['id', 'name_es']]
d = d.merge(N, on='id', how='left')
d['name_es'] = d.name_es.fillna('')
# labels de Wikidata traen desambiguadores "(1496-1533)" o basura "(bachi)":
# se quita el parentesis final (el nombre nunca vive ahi)
_sin = d.name_es.str.replace(r'\s*\([^)]*\)\s*$', '', regex=True).str.strip()
d['name_es'] = _sin.where(_sin != '', d.name_es)
F = pd.read_csv(os.path.join(DIR, 'fotos.csv'), encoding='utf-8-sig').rename(columns={'img': 'img_commons'})
d = d.merge(F, on='id', how='left')
d['img_commons'] = d.img_commons.fillna('')
FL = pd.read_csv(os.path.join(DIR, 'fotos_local.csv'), encoding='utf-8-sig').rename(columns={'file': 'img_local'})
d = d.merge(FL, on='id', how='left')
d['img_local'] = d.img_local.fillna('')
d = d.sort_values('rank_score').reset_index(drop=True)
print('base completa: %d | con nombre es: %d | con img commons: %d | con img local: %d'
      % (len(d), int((d.name_es != '').sum()), int((d.img_commons != '').sum()), int((d.img_local != '').sum())))

# --- isoMeta sobre la base completa ---
s = io.open(os.path.join(CHARTS, 'data-percap-map.js'), encoding='utf-8').read()
PC = json.loads(s.split('window.PCMAP=', 1)[1].rstrip().rstrip(';'))
meta_by_iso = {m['iso']: m for m in PC['isoMeta']}
isos = sorted({i for i in d.iso3.dropna()})
sin_meta = [i for i in isos if i not in meta_by_iso]
if sin_meta: print('iso sin meta (quedan con el codigo):', sin_meta)
iso_idx = {c: k for k, c in enumerate(isos)}
isoMeta = [{'iso': c,
            'es': meta_by_iso.get(c, {}).get('es', c),
            'en': meta_by_iso.get(c, {}).get('en', c),
            'reg': meta_by_iso.get(c, {}).get('reg')} for c in isos]

# --- ocupaciones (base completa) con formas por genero ---
OCC_ES = {'SOCCER PLAYER':'Futbolista','ATHLETE':'Atleta','BASKETBALL PLAYER':'Basquetbolista','CYCLIST':'Ciclista','TENNIS PLAYER':'Tenista','SWIMMER':'Nadador/a','WRESTLER':'Luchador/a','RACING DRIVER':'Piloto de carreras','SKIER':'Esquiador/a','HOCKEY PLAYER':'Jugador/a de hockey','BOXER':'Boxeador/a','GYMNAST':'Gimnasta','HANDBALL PLAYER':'Handbolista','SKATER':'Patinador/a','COACH':'DT','CHESS PLAYER':'Ajedrecista','FENCER':'Esgrimista','VOLLEYBALL PLAYER':'Voleibolista','BADMINTON PLAYER':'Jugador/a de bádminton','MARTIAL ARTS':'Artes marciales','REFEREE':'Árbitro/a','RUGBY PLAYER':'Rugbier','CRICKETER':'Jugador/a de críquet','TABLE TENNIS PLAYER':'Tenis de mesa','BASEBALL PLAYER':'Beisbolista','GOLFER':'Golfista','SNOOKER':'Jugador/a de snooker','AMERICAN FOOTBALL PLAYER':'Fútbol americano','MOUNTAINEER':'Montañista','POKER PLAYER':'Jugador/a de póker','BULLFIGHTER':'Torero/a','GO PLAYER':'Jugador/a de go','GAMER':'Gamer','ACTOR':'Actor/Actriz','SINGER':'Cantante','MUSICIAN':'Músico/a','FILM DIRECTOR':'Director/a de cine','PAINTER':'Pintor/a','COMPOSER':'Compositor/a','MODEL':'Modelo','COMIC ARTIST':'Historietista','PORNOGRAPHIC ACTOR':'Actor/actriz porno','PRESENTER':'Presentador/a','PHOTOGRAPHER':'Fotógrafo/a','PRODUCER':'Productor/a','CONDUCTOR':'Director/a de orquesta','ARTIST':'Artista','DANCER':'Bailarín/a','DESIGNER':'Diseñador/a','COMEDIAN':'Comediante','FASHION DESIGNER':'Diseñador/a de moda','SCULPTOR':'Escultor/a','CHEF':'Chef','MAGICIAN':'Mago/a','CELEBRITY':'Celebridad','YOUTUBER':'Youtuber','GAME DESIGNER':'Diseñador/a de juegos','ARCHITECT':'Arquitecto/a','BIOLOGIST':'Biólogo/a','PHYSICIST':'Físico/a','MATHEMATICIAN':'Matemático/a','ASTRONOMER':'Astrónomo/a','CHEMIST':'Químico/a','ASTRONAUT':'Astronauta','INVENTOR':'Inventor/a','ENGINEER':'Ingeniero/a','COMPUTER SCIENTIST':'Informático/a','PHYSICIAN':'Médico/a','GEOLOGIST':'Geólogo/a','STATISTICIAN':'Estadístico/a','WRITER':'Escritor/a','PHILOSOPHER':'Filósofo/a','HISTORIAN':'Historiador/a','ECONOMIST':'Economista','PSYCHOLOGIST':'Psicólogo/a','LINGUIST':'Lingüista','ARCHAEOLOGIST':'Arqueólogo/a','ANTHROPOLOGIST':'Antropólogo/a','GEOGRAPHER':'Geógrafo/a','SOCIOLOGIST':'Sociólogo/a','POLITICAL SCIENTIST':'Politólogo/a','CRITIC':'Crítico/a','POLITICIAN':'Político/a','RELIGIOUS FIGURE':'Figura religiosa','MILITARY PERSONNEL':'Militar','NOBLEMAN':'Noble','SOCIAL ACTIVIST':'Activista','COMPANION':'Consorte','EXTREMIST':'Extremista','JOURNALIST':'Periodista','DIPLOMAT':'Diplomático/a','MAFIOSO':'Mafioso','PILOT':'Aviador/a','JUDGE':'Juez/a','PUBLIC WORKER':'Funcionario/a','PIRATE':'Pirata','LAWYER':'Abogado/a','OCCULTIST':'Ocultista','INSPIRATION':'Inspiración','BUSINESSPERSON':'Empresario/a','EXPLORER':'Explorador/a'}

def formas(es):
    if es == 'Actor/Actriz': return 'Actor', 'Actriz'
    if es == 'Actor/actriz porno': return 'Actor porno', 'Actriz porno'
    if '/a' not in es: return es, es
    masc = es.replace('/a', '', 1)
    tok = [pz for pz in es.split(' ') if '/a' in pz][0].replace('/a', '')
    if tok.endswith('or'): fem_tok = tok + 'a'
    elif tok.endswith('ín'): fem_tok = tok[:-2] + 'ina'
    elif tok.endswith('o'): fem_tok = tok[:-1] + 'a'
    else: fem_tok = tok + 'a'
    return masc, es.replace(tok + '/a', fem_tok)

occs_raw = sorted(d.occupation.unique())
occ_idx = {o: k for k, o in enumerate(occs_raw)}
DOMS = [('Deporte', 'Sport'), ('Arte y espectáculo', 'Arts & entertainment'),
        ('Ciencia y tecnología', 'Science & tech'), ('Humanidades', 'Humanities'),
        ('Poder y figuras públicas', 'Power & public life'), ('Negocios y exploración', 'Business & exploration')]
dom_idx = {es: k for k, (es, en) in enumerate(DOMS)}
occ2dom = d.groupby('occupation').dominio.agg(lambda s2: s2.mode()[0]).to_dict()
occMeta = []
for o in occs_raw:
    es = OCC_ES.get(o, o.title())
    m_, f_ = formas(es)
    occMeta.append({'es': es, 'es_m': m_, 'es_f': f_, 'en': o.title(), 'dom': dom_idx[occ2dom[o]]})

def fila(x):
    img = x.img_local if x.img_local else x.img_commons
    return [int(x.rank_score),
            x['name'],
            x.name_es if x.name_es and x.name_es != x['name'] else '',
            iso_idx.get(x.iso3, -1),
            occ_idx[x.occupation],
            round(float(x.score), 1),
            int(x.birthyear) if pd.notna(x.birthyear) else None,
            img,
            x.gender if x.gender in ('M', 'F') else '']

rows = [fila(x) for _, x in d.iterrows()]
head = {'isoMeta': isoMeta, 'occs': occMeta,
        'doms': [{'es': a, 'en': b} for a, b in DOMS],
        'total': len(rows), 'rows': rows[:CORTE]}

p1 = os.path.join(CHARTS, 'data-top.js')
io.open(p1, 'w', encoding='utf-8', newline='').write(
    '// Ranking de la fama: meta (base completa) + top %d. rows=[rank,name_en,name_es(si difiere),isoIdx,occIdx,hpi,birthyear,img,genero]\n' % CORTE
    + '// img: "id.jpg" = local en fotos/; otro texto = archivo de Commons (hotlink).\n'
    + 'window.TOPFIGS=' + json.dumps(head, ensure_ascii=False, separators=(',', ':')) + ';\n')
p2 = os.path.join(CHARTS, 'data-top-full.js')
io.open(p2, 'w', encoding='utf-8', newline='').write(
    '// Resto de la base depurada (filas %d+), carga diferida desde top.html.\n' % (CORTE + 1)
    + 'window.TOPFIGS_REST=' + json.dumps(rows[CORTE:], ensure_ascii=False, separators=(',', ':')) + ';\n')
print('=> data-top.js %.0f KB (top %d) | data-top-full.js %.1f MB (%d filas)'
      % (os.path.getsize(p1) / 1024, CORTE, os.path.getsize(p2) / 1e6, len(rows) - CORTE))
