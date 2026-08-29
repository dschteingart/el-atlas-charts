# -*- coding: utf-8 -*-
"""data-explora.js v3 — PER-FIGURA (habilita conteo, HPI, top-X% y figura
destacada) + series PIB/población por país (universo completo de ~162)."""
import pandas as pd, numpy as np, json, os
import warnings; warnings.filterwarnings('ignore')
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-talento\data-explora.js'
N1  = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js'

P   = pd.read_csv('master_corregido.csv')   # metodologia corregida; ver corregido.py
M   = pd.read_csv('gdp-per-capita-maddison-project-database.csv')
POP = pd.read_csv('pop3/population.csv')
Y0, Y1 = 1850, 2010

# ---- iso -> region / nombres (N°1) ----
txt = open(N1, encoding='utf-8').read(); s = txt[txt.index('['):]
depth = 0
for i, ch in enumerate(s):
    if ch == '[': depth += 1
    elif ch == ']':
        depth -= 1
        if depth == 0: end = i + 1; break
arr = json.loads(s[:end])
iso2region = {d['iso3']: d['region'] for d in arr}
iso2es = {d['iso3']: d.get('country_es') or d.get('country') for d in arr}
iso2en = {d['iso3']: d.get('country') for d in arr}
REG_OV = {'PRI':'Latin America','CUB':'Latin America','HKG':'East Asia','TWN':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa'}
NM_OV  = {'PRI':('Puerto Rico','Puerto Rico'),'TWN':('Taiwán','Taiwan'),'HKG':('Hong Kong','Hong Kong'),'CUB':('Cuba','Cuba'),'MAC':('Macao','Macao'),'PSE':('Palestina','Palestine')}
def region_of(iso): return iso2region.get(iso) or REG_OV.get(iso)
def names_of(iso):
    if iso in NM_OV: return NM_OV[iso]
    return (iso2es.get(iso) or iso, iso2en.get(iso) or iso)

# ---- series COMPLETAS año a año 1850-2010 ----
NYEARS = Y1 - Y0 + 1
def _annual(s):
    s = s.sort_index(); s = s[~s.index.duplicated()]
    if s.empty: return None
    return s.reindex(range(int(s.index.min()), int(s.index.max()) + 1)).interpolate()

# Agregados regionales de Maddison (capturados ANTES de filtrar países, porque
# tienen Code nulo). Se usan para EXTRAPOLAR el PIB de un país a años sin dato:
# se asume que el país creció a la tasa de su región (Guatemala pre-1950 crece
# como "Latin America"). Mapeo región del N°1 → región Maddison.
N1_TO_MAD = {
 'Latin America': 'Latin America (Maddison)', 'Caribbean': 'Latin America (Maddison)',
 'North America, Australia & New Zealand': 'Western offshoots (Maddison)',
 'Western Europe': 'Western Europe (Maddison)', 'Eastern Europe & Central Asia': 'Eastern Europe (Maddison)',
 'East Asia': 'East Asia (Maddison)', 'Southeast Asia': 'South and South East Asia (Maddison)',
 'South Asia': 'South and South East Asia (Maddison)', 'Middle East & North Africa': 'Middle East and North Africa (Maddison)',
 'Sub-Saharan Africa': 'Sub Saharan Africa (Maddison)',
}
REGSER = {}
for rname in set(N1_TO_MAD.values()):
    g = M[M.Entity == rname].dropna(subset=['GDP per capita']).set_index('Year')['GDP per capita']
    a = _annual(g)
    if a is not None: REGSER[rname] = a
WORLD = _annual(M[M.Entity == 'World'].dropna(subset=['GDP per capita']).set_index('Year')['GDP per capita'])

M = M.dropna(subset=['Code'])
def full_array(g, col, scale=1.0):   # interp interno + extrapolación plana (para población)
    s = g.sort_values('Year').set_index('Year')[col]; s = s[~s.index.duplicated()]
    full = s.reindex(range(Y0, Y1 + 1)).interpolate(method='linear', limit_direction='both').ffill().bfill()
    if full.isna().all(): return None
    return [int(round(v / scale)) for v in full.values]

def gdp_full(code):
    g = M[M.Code == code].dropna(subset=['GDP per capita']).set_index('Year')['GDP per capita']
    ca = _annual(g)
    if ca is None: return None
    cmin, cmax = int(ca.index.min()), int(ca.index.max())
    reg = REGSER.get(N1_TO_MAD.get(region_of(code)))
    out = []
    for y in range(Y0, Y1 + 1):
        if y in ca.index:
            v = ca.loc[y]
        else:
            anc = cmin if y < cmin else cmax
            r = reg if (reg is not None and y in reg.index and anc in reg.index) else \
                (WORLD if (WORLD is not None and y in WORLD.index and anc in WORLD.index) else None)
            v = ca.loc[anc] * r.loc[y] / r.loc[anc] if (r is not None and r.loc[anc] > 0) else ca.loc[anc]
        out.append(int(round(v)))
    return out

gdp_series = {}
for code in M.Code.dropna().unique():
    a = gdp_full(code)
    if a: gdp_series[code] = a
POP = POP.dropna(subset=['Code'])
pop_series = {}
for code, g in POP.groupby('Code'):
    if g['Population'].notna().sum() == 0: continue
    a = full_array(g, 'Population', scale=1000.0)   # miles
    if a: pop_series[code] = a

isos = sorted([c for c in gdp_series if c in pop_series and region_of(c)])
iso_idx = {iso: k for k, iso in enumerate(isos)}

# ---- dominios (ARREGLADO: arquitecto→Artes, gamer→Deportes) ----
DOM = {
 'Deportes':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],
 'Artes y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],
 'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],
 'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],
 'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],
 'Negocios y exploración':['BUSINESSPERSON','EXPLORER'],
}
occ2dom = {o: d for d, l in DOM.items() for o in l}
DOM_EN = {'Deportes':'Sports','Artes y espectáculo':'Arts & entertainment','Ciencia y tecnología':'Science & tech','Humanidades':'Humanities','Poder y figuras públicas':'Power & public life','Negocios y exploración':'Business & exploration'}
# Etiquetas ES para TODAS las ocupaciones (las 101). EN = .title() por defecto.
OCC_ES = {
 'SOCCER PLAYER':'Futbolistas','POLITICIAN':'Política','ACTOR':'Actuación','ATHLETE':'Atletismo','WRITER':'Literatura',
 'SINGER':'Canto','MUSICIAN':'Música','RELIGIOUS FIGURE':'Religión','MILITARY PERSONNEL':'Militares','FILM DIRECTOR':'Cine (dirección)',
 'PAINTER':'Pintura','BASKETBALL PLAYER':'Básquet','CYCLIST':'Ciclismo','TENNIS PLAYER':'Tenis','COMPOSER':'Composición',
 'NOBLEMAN':'Nobleza','SWIMMER':'Natación','PHILOSOPHER':'Filosofía','WRESTLER':'Lucha','BIOLOGIST':'Biología',
 'RACING DRIVER':'Automovilismo','MATHEMATICIAN':'Matemática','SOCIAL ACTIVIST':'Activismo social','BUSINESSPERSON':'Negocios','PHYSICIST':'Física',
 'SKIER':'Esquí','COMPANION':'Consortes','PHYSICIAN':'Medicina','HOCKEY PLAYER':'Hockey','ASTRONOMER':'Astronomía',
 'CHEMIST':'Química','BOXER':'Boxeo','HISTORIAN':'Historia','ASTRONAUT':'Astronáutica','GYMNAST':'Gimnasia',
 'ARCHITECT':'Arquitectura','HANDBALL PLAYER':'Handball','EXPLORER':'Exploración','SKATER':'Patinaje','COACH':'Entrenadores',
 'CHESS PLAYER':'Ajedrez','INVENTOR':'Invención','FENCER':'Esgrima','ECONOMIST':'Economía','ENGINEER':'Ingeniería',
 'MODEL':'Modelaje','EXTREMIST':'Extremismo','CELEBRITY':'Celebridades','VOLLEYBALL PLAYER':'Vóley','SCULPTOR':'Escultura',
 'COMPUTER SCIENTIST':'Computación','BADMINTON PLAYER':'Bádminton','PSYCHOLOGIST':'Psicología','COMIC ARTIST':'Historieta','PORNOGRAPHIC ACTOR':'Cine adulto',
 'LINGUIST':'Lingüística','MARTIAL ARTS':'Artes marciales','JOURNALIST':'Periodismo','ARCHAEOLOGIST':'Arqueología','PRESENTER':'Conducción TV',
 'PHOTOGRAPHER':'Fotografía','REFEREE':'Arbitraje','RUGBY PLAYER':'Rugby','PRODUCER':'Producción','CRICKETER':'Críquet',
 'LAWYER':'Abogacía','CONDUCTOR':'Dirección orquestal','TABLE TENNIS PLAYER':'Tenis de mesa','ARTIST':'Arte','DANCER':'Danza',
 'BASEBALL PLAYER':'Béisbol','DESIGNER':'Diseño','COMEDIAN':'Comedia','ANTHROPOLOGIST':'Antropología','DIPLOMAT':'Diplomacia',
 'GEOLOGIST':'Geología','GEOGRAPHER':'Geografía','GOLFER':'Golf','SOCIOLOGIST':'Sociología','GAME DESIGNER':'Diseño de juegos',
 'PILOT':'Aviación','MAFIOSO':'Mafia','SNOOKER':'Snooker','AMERICAN FOOTBALL PLAYER':'Fútbol americano','YOUTUBER':'Youtubers',
 'JUDGE':'Justicia','MOUNTAINEER':'Montañismo','FASHION DESIGNER':'Moda','POLITICAL SCIENTIST':'Ciencia política','OCCULTIST':'Ocultismo',
 'PIRATE':'Piratería','PUBLIC WORKER':'Función pública','CHEF':'Cocina','POKER PLAYER':'Póker','MAGICIAN':'Magia',
 'INSPIRATION':'Inspiración','CRITIC':'Crítica','STATISTICIAN':'Estadística','GAMER':'Gamers','BULLFIGHTER':'Toreo','GO PLAYER':'Go',
}
OCC_EN = {'SOCCER PLAYER':'Footballers','BASKETBALL PLAYER':'Basketball','TENNIS PLAYER':'Tennis','BASEBALL PLAYER':'Baseball','RACING DRIVER':'Motor racing','ATHLETE':'Athletics','SWIMMER':'Swimming','WRESTLER':'Wrestling','CHESS PLAYER':'Chess','WRITER':'Literature','PHILOSOPHER':'Philosophy','ECONOMIST':'Economics','PHYSICIST':'Physics','MATHEMATICIAN':'Mathematics','BIOLOGIST':'Biology','PHYSICIAN':'Medicine','PAINTER':'Painting','MUSICIAN':'Music','SINGER':'Singing','ACTOR':'Acting','FILM DIRECTOR':'Film','POLITICIAN':'Politics','RELIGIOUS FIGURE':'Religion','MILITARY PERSONNEL':'Military','VOLLEYBALL PLAYER':'Volleyball','CYCLIST':'Cycling','BOXER':'Boxing','COMPOSER':'Composing','ARCHITECT':'Architecture','SCULPTOR':'Sculpture'}

# ---- figuras del universo → arrays paralelos ----
P = P[P.iso3.notna() & P.birthyear.notna() & P.occupation.notna() & P.hpi.notna()].copy()
P['birthyear'] = P.birthyear.astype(int)
P = P[(P.birthyear >= Y0) & (P.birthyear <= Y1) & P.iso3.isin(isos)]
occs = sorted(P.occupation.unique())
occ_idx = {o: k for k, o in enumerate(occs)}
P = P.sort_values('hpi', ascending=False)   # ordenado por HPI desc (ayuda top-X% y destacada)
F_iso = [iso_idx[i] for i in P.iso3]
F_occ = [occ_idx[o] for o in P.occupation]
F_yr  = [int(y) - Y0 for y in P.birthyear]
F_hpi = [int(round(h)) for h in P.hpi]          # 0-100
# nombres DISPERSOS: solo el top-3 por HPI de cada (país, ocupación) — alcanza
# para la "figura destacada" del tooltip (el máximo del país siempre está) y
# evita embarcar 100k nombres. P ya viene ordenado por HPI desc.
# nombres DISPERSOS: top-2 por (país, ocupación, DÉCADA). Garantiza que la
# "figura destacada" (el máximo del país en cualquier período) tenga nombre:
# el máximo de un período es el tope de su década, que siempre va nombrado.
# (Antes era top-3 por país-ocupación de TODAS las épocas → un escritor de
# 1917 quedaba sin nombre tapado por los del 1800.)
names_list = [str(n) for n in P.name]
F_name = {}
_seen = {}
for gi in range(len(F_iso)):
    dec = ((F_yr[gi] + Y0) // 10) * 10
    k = (F_iso[gi], F_occ[gi], dec); c = _seen.get(k, 0)
    if c < 2: F_name[gi] = names_list[gi]; _seen[k] = c + 1
# empaquetado binario: 4 bytes por figura (iso, occ, yr, hpi) → base64. Reduce
# el archivo a la mitad (vs arrays JSON) y el front lo decodifica una vez.
import base64
_buf = bytearray()
for i in range(len(F_iso)):
    _buf.append(F_iso[i] & 255); _buf.append(F_occ[i] & 255); _buf.append(F_yr[i] & 255); _buf.append(min(255, F_hpi[i]))
F_b64 = base64.b64encode(bytes(_buf)).decode('ascii')

occMeta = [{'es': OCC_ES.get(o, o.title()), 'en': OCC_EN.get(o, o.title()), 'dom': occ2dom.get(o, 'Otros')} for o in occs]
domains = [{'es': d, 'en': DOM_EN[d], 'occ': [occ_idx[o] for o in l if o in occ_idx]} for d, l in DOM.items()]
# subrubros = TODAS las ocupaciones, ordenadas por cantidad de figuras desc
# (las más comunes arriba en el desplegable).
_occ_counts = P.occupation.value_counts()
subrubros = [{'idx': occ_idx[o], 'es': OCC_ES.get(o, o.title()), 'en': OCC_EN.get(o, o.title())}
             for o in _occ_counts.index if o in occ_idx]
isoMeta = []
for iso in isos:
    es, en = names_of(iso); isoMeta.append({'iso': iso, 'es': es, 'en': en, 'reg': region_of(iso)})
gdpByIdx = {iso_idx[iso]: gdp_series[iso] for iso in isos}
popByIdx = {iso_idx[iso]: pop_series[iso] for iso in isos}

# chequeo cobertura dominios
allocc = set(occs); covered = set(o for l in DOM.values() for o in l)
print('ocupaciones fuera de dominio (debería ser vacío):', allocc - covered)

data = {'y0': Y0, 'y1': Y1, 'isoMeta': isoMeta, 'occMeta': occMeta, 'domains': domains, 'subrubros': subrubros,
        'F': {'b64': F_b64, 'n': len(F_iso), 'name': F_name},
        'gdp': gdpByIdx, 'pop': popByIdx}
js = "// Chart 5 (explorador) v3 — datos POR FIGURA (habilita conteo, suma HPI,\n"
js += "// top-X%% por HPI y figura destacada). F: arrays paralelos {iso,occ,yr=year-%d,hpi=0-100,name}\n" % Y0
js += "// ordenados por HPI desc. gdp/pop: {isoIdx:{year:val}} (gdp US$ const; pop miles).\n"
js += "window.EXPLORA=" + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n"
open(OUT, 'w', encoding='utf-8').write(js)
print('isos', len(isos), 'occs', len(occs), 'figuras', len(P), 'file KB', round(os.path.getsize(OUT)/1024))
