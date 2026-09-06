# -*- coding: utf-8 -*-
import pandas as pd, numpy as np, json, warnings, sys, corregido
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
df = corregido.aplicar(pd.read_csv('person_2025_update.csv', low_memory=False), etiqueta='metros')   # gate + score nuevo
bf = pd.read_csv('geo_backfill.csv'); up = pd.read_csv('geo_upgrade.csv')
for t in (bf, up):
    t['lat'] = pd.to_numeric(t.lat, errors='coerce'); t['lon'] = pd.to_numeric(t.lon, errors='coerce')

def dedup(t):  # 1 fila por wd_id: con coords + ciudad real, preferidas
    t = t.copy()
    t['realcity'] = (t.city != t.country) & t.city.notna() & (t.city != '')
    t['hascoord'] = t.lat.notna() & t.lon.notna()
    return t.sort_values(['hascoord', 'realcity'], ascending=False).drop_duplicates('wd_id')
bf = dedup(bf); up = dedup(up)

df['u_city'] = df.bplace_name.astype(str); df['u_lat'] = df.bplace_lat; df['u_lon'] = df.bplace_lon
df['u_country'] = df.bplace_country; df['src'] = 'pantheon'

# upgrades (country-level con ciudad real de Wikidata) — vectorizado
upd = up[up.realcity & up.hascoord].drop_duplicates('wd_id').set_index('wd_id')
m = (df.bplace_name == df.bplace_country) & df.wd_id.isin(upd.index)
df.loc[m, 'u_city'] = df.loc[m, 'wd_id'].map(upd.city)
df.loc[m, 'u_lat'] = df.loc[m, 'wd_id'].map(upd.lat).astype(float)
df.loc[m, 'u_lon'] = df.loc[m, 'wd_id'].map(upd.lon).astype(float)
df.loc[m, 'u_country'] = df.loc[m, 'wd_id'].map(upd.country)
df.loc[m, 'src'] = 'wd_upgrade'

# backfill (faltantes totales) — vectorizado
bfd = bf[bf.hascoord].drop_duplicates('wd_id').set_index('wd_id')
mm = df.bplace_geonameid.isna() & df.wd_id.isin(bfd.index)
df.loc[mm, 'u_city'] = df.loc[mm, 'wd_id'].map(bfd.city)
df.loc[mm, 'u_lat'] = df.loc[mm, 'wd_id'].map(bfd.lat).astype(float)
df.loc[mm, 'u_lon'] = df.loc[mm, 'wd_id'].map(bfd.lon).astype(float)
df.loc[mm, 'u_country'] = df.loc[mm, 'wd_id'].map(bfd.country)
df.loc[mm, 'src'] = 'wd_backfill'

good = df[(df.u_lat.notna()) & (df.u_lon.notna()) & (df.u_city != df.u_country) & (df.u_city != 'nan')].copy()
print('figuras con ciudad+coords:', len(good), '(antes pantheon-solo:', df.bplace_geonameid.notna().sum(), ')')
print('  upgrades:', (df.src == 'wd_upgrade').sum(), '| backfill:', (df.src == 'wd_backfill').sum())

_DOM = {'Deportes': ['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'], 'Artes y espectáculo': ['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'], 'Ciencia y tecnología': ['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'], 'Humanidades': ['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'], 'Poder y figuras públicas': ['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'], 'Negocios y exploración': ['BUSINESSPERSON','EXPLORER']}
o2d = {o: k for k, l in _DOM.items() for o in l}; good['dom'] = good.occupation.map(o2d)

from scipy.spatial import cKDTree
loc = good.groupby([good.u_lat.round(4), good.u_lon.round(4)]).size().reset_index()
loc.columns = ['lat', 'lon', 'n']; loc = loc.sort_values('n', ascending=False).reset_index(drop=True)
xyz = np.column_stack([np.cos(np.radians(loc.lat))*np.cos(np.radians(loc.lon)),
                       np.cos(np.radians(loc.lat))*np.sin(np.radians(loc.lon)),
                       np.sin(np.radians(loc.lat))]) * 6371.0
tree = cKDTree(xyz); used = np.zeros(len(loc), bool); loc['mid'] = -1
for i in range(len(loc)):
    if used[i]: continue
    idx = [j for j in tree.query_ball_point(xyz[i], 35.0) if not used[j]]
    for j in idx: used[j] = True
    loc.loc[idx, 'mid'] = i
key2mid = {(r.lat, r.lon): r.mid for r in loc.itertuples()}
core = {int(r.mid): (r.lat, r.lon) for r in loc.itertuples()}
good['mid'] = [key2mid.get((round(la, 4), round(lo, 4)), -1) for la, lo in zip(good.u_lat, good.u_lon)]
def smode(s):
    m = s.dropna().mode()
    return m.iat[0] if len(m) else ''
mname = good.groupby('mid').u_city.agg(smode)
mcountry = good.groupby('mid').u_country.agg(smode)

LAT = set('Argentina,Brazil,Mexico,Chile,Colombia,Peru,Uruguay,Cuba,Venezuela,Ecuador,Paraguay,Bolivia,Guatemala,Panama,Dominican Republic,Costa Rica,Honduras,Nicaragua,El Salvador,Haiti,Puerto Rico'.split(','))
ESC = {'United States':'EE.UU.','United Kingdom':'Reino Unido','Brazil':'Brasil','Mexico':'México','Japan':'Japón','France':'Francia','Germany':'Alemania','Italy':'Italia','Spain':'España','Russia':'Rusia','Netherlands':'P. Bajos','Denmark':'Dinamarca','Sweden':'Suecia','Hungary':'Hungría','South Korea':'Corea del Sur','Greece':'Grecia','Belgium':'Bélgica','Peru':'Perú','Canada':'Canadá','Poland':'Polonia','Turkey':'Turquía','Egypt':'Egipto'}
CITYES = {'New York City':'Nueva York','London':'Londres','Moscow':'Moscú','Rome':'Roma','Vienna':'Viena','Munich':'Múnich','Prague':'Praga','Athens':'Atenas','Florence':'Florencia','Mexico City':'Ciudad de México','Saint Petersburg':'San Petersburgo','Seoul':'Seúl','Warsaw':'Varsovia','Milan':'Milán','Copenhagen':'Copenhague','Stockholm':'Estocolmo','Tokyo':'Tokio','Rio de Janeiro':'Río de Janeiro','Lisbon':'Lisboa','Cairo':'El Cairo'}

DOMS = ['Deportes','Artes y espectáculo','Ciencia y tecnología','Humanidades','Poder y figuras públicas','Negocios y exploración']
CSTRIP = {str(c).strip().lower() for c in df.bplace_country.dropna().unique()}
rows = []
for mid, g in good.groupby('mid'):
    if mid < 0 or len(g) < 30: continue
    co = mcountry.get(mid, ''); cy = mname.get(mid, '')
    top = g.loc[g.hpi.idxmax()]
    parts = [p for p in g[g.u_city != cy].u_city.value_counts().index if str(p).strip().lower() not in CSTRIP][:4]
    rows.append({'city': CITYES.get(cy, cy), 'country': ESC.get(co, co), 'lat': round(float(core[mid][0]), 3),
                 'n': len(g), 'lat_am': co in LAT, 'top': str(top['name']),
                 'parts': [CITYES.get(p, p) for p in parts], 'dom': [int((g.dom == d).sum()) for d in DOMS]})
rows.sort(key=lambda r: -r['n'])
# incluir top 50 global UNION top 22 LatAm (para que la vista LatAm tenga suficientes)
glob = rows[:50]; latam = [m for m in rows if m['lat_am']][:22]
seen = set(); merged = []
for m in sorted(glob + latam, key=lambda r: -r['n']):
    k = (m['city'], m['country'])
    if k in seen: continue
    seen.add(k); merged.append(m)
out = {'doms': DOMS, 'metros': merged}
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
open(OUT + r'\data-metros.js', 'w', encoding='utf-8').write('// Chart 9 — metros de la fama (clustering 35km + backfill Wikidata).\nwindow.METROS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('data-metros.js:', len(rows[:60]), 'metros')
print('\nTOP 20 mundial:')
for r, m in enumerate(rows[:20], 1): print('  %2d. %-17s %-12s %5d  (%s)' % (r, m['city'][:16], m['country'][:11], m['n'], m['top'][:18]))
print('\nLatAm top 8:')
for r, m in enumerate([m for m in rows if m['lat_am']][:8], 1): print('  %2d. %-16s %-10s %5d  [%s]' % (r, m['city'][:15], m['country'][:9], m['n'], ', '.join(m['parts'][:3])))
