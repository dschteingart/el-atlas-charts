# -*- coding: utf-8 -*-
"""Datos para percap.html, RANGO HISTÓRICO COMPLETO (~-3500 a 2021).
Salidas:
  - data-percap-figs.js (window.PCFIGS): isoMeta + domains + subMeta + F por-figura
    (iso 1B, subId 1B, year int16 LE offset +4000). subMeta[subId]={es,en,dom}.
  - data-percap-pop.js (window.PERCAP_POP): puntos de población (año,miles) por país
    + mundo; el JS interpola/extrapola. Fix Irlanda (IRL solo 1950+ en OWID).
isoMeta = los 162 de EXPLORA (con PIB Maddison) + países con figuras+pob+región
que EXPLORA dejó afuera por no tener PIB (VEN, PRK, etc.). Región: mapa del N°1
(data-scatter.js) + overrides ROV. Nombres: country-names.js + extra.
"""
import csv, json, base64, os
from collections import Counter

ROOT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts'
EXPLORA = ROOT + r'\05-talento\data-explora.js'
N1 = ROOT + r'\01-bienestar-violencia\data-scatter.js'
CNAMES = ROOT + r'\05-talento\country-names.js'
PERSONS = r'C:\Users\FUNDAR\Downloads\_talento_work\master_corregido.csv'   # metodologia corregida; ver corregido.py
POPCSV = r'C:\Users\FUNDAR\Downloads\_pop_upload\population.csv'
OUT_F = ROOT + r'\05-talento\data-percap-figs.js'
OUT_P = ROOT + r'\05-talento\data-percap-pop.js'
OUT_T = ROOT + r'\05-talento\data-percap-topfig.js'
YMIN, YMAX, YOFF = -4000, 2021, 4000

def load_js_obj(path, opener):
    s = open(path, encoding='utf-8').read()
    i = s.index(opener)
    if opener == '[':
        d = 0
        for j, c in enumerate(s[i:]):
            if c == '[': d += 1
            elif c == ']':
                d -= 1
                if d == 0: return json.loads(s[i:i + j + 1])
    else:
        return json.loads(s[i:s.rindex('}') + 1])

# --- isoMeta + domains de EXPLORA ---
EXP = json.loads(open(EXPLORA, encoding='utf-8').read().split('window.EXPLORA=', 1)[1].rstrip().rstrip(';'))
isoMeta = [dict(m) for m in EXP['isoMeta']]
domNames = [d['es'] for d in EXP['domains']]
domains_out = [{'es': d['es'], 'en': d['en']} for d in EXP['domains']]

# --- mapa de regiones (N°1 + ROV) ---
iso2region = {x['iso3']: x['region'] for x in load_js_obj(N1, '[') if x.get('iso3') and x.get('region')}
ROV = {'PRI': 'Latin America', 'CUB': 'Latin America', 'TWN': 'East Asia', 'HKG': 'East Asia', 'MAC': 'East Asia', 'PSE': 'Middle East & North Africa',
       'PRK': 'East Asia', 'VEN': 'Latin America', 'GUF': 'Latin America', 'MMR': 'Southeast Asia', 'YEM': 'Middle East & North Africa',
       'COD': 'Sub-Saharan Africa', 'ERI': 'Sub-Saharan Africa', 'REU': 'Sub-Saharan Africa', 'MCO': 'Western Europe', 'XKX': 'Eastern Europe & Central Asia',
       'GRL': 'Western Europe', 'IMN': 'Western Europe', 'FRO': 'Western Europe', 'AND': 'Western Europe', 'LIE': 'Western Europe', 'SMR': 'Western Europe',
       'BMU': 'Caribbean', 'GLP': 'Caribbean', 'MTQ': 'Caribbean',
       'FJI': 'North America, Australia & New Zealand', 'TON': 'North America, Australia & New Zealand', 'VUT': 'North America, Australia & New Zealand',
       'WSM': 'North America, Australia & New Zealand', 'PYF': 'North America, Australia & New Zealand', 'MHL': 'North America, Australia & New Zealand',
       'NCL': 'North America, Australia & New Zealand', 'PLW': 'North America, Australia & New Zealand', 'FSM': 'North America, Australia & New Zealand', 'KIR': 'North America, Australia & New Zealand'}
for k, v in ROV.items():
    iso2region.setdefault(k, v)
# overrides FORZADOS (editorial): GUF fuera de LatAm; Puerto Rico dentro.
FORCE = {'GUF': 'Caribbean', 'PRI': 'Latin America'}
iso2region.update(FORCE)

NAMES = load_js_obj(CNAMES, '{')
NAMES_EXTRA = {'VEN': ('Venezuela', 'Venezuela'), 'PRK': ('Corea del Norte', 'North Korea'), 'SOM': ('Somalia', 'Somalia'),
               'SDN': ('Sudán', 'Sudan'), 'YEM': ('Yemen', 'Yemen'), 'SUR': ('Surinam', 'Suriname'), 'BHS': ('Bahamas', 'Bahamas'),
               'FJI': ('Fiyi', 'Fiji'), 'MCO': ('Mónaco', 'Monaco'), 'GUF': ('Guayana Francesa', 'French Guiana'),
               'GLP': ('Guadalupe', 'Guadeloupe'), 'MTQ': ('Martinica', 'Martinique'), 'PYF': ('Polinesia Francesa', 'French Polynesia'),
               'FRO': ('Islas Feroe', 'Faroe Islands'), 'PRI': ('Puerto Rico', 'Puerto Rico'), 'REU': ('Reunión', 'Réunion'),
               'NCL': ('Nueva Caledonia', 'New Caledonia'), 'AND': ('Andorra', 'Andorra'), 'LIE': ('Liechtenstein', 'Liechtenstein'),
               'SMR': ('San Marino', 'San Marino'), 'BMU': ('Bermudas', 'Bermuda'), 'GRL': ('Groenlandia', 'Greenland'),
               'IMN': ('Isla de Man', 'Isle of Man')}
def name_of(iso):
    if iso in NAMES: return NAMES[iso].get('es', iso), NAMES[iso].get('en', iso)
    if iso in NAMES_EXTRA: return NAMES_EXTRA[iso]
    return iso, iso

# --- población cruda (todos los códigos) + fix Irlanda ---
raw, whole_island = {}, {}
with open(POPCSV, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        code, ent = (r['Code'] or '').strip(), (r['Entity'] or '').strip()
        try: y, p = int(r['Year']), float(r['Population'])
        except (ValueError, TypeError): continue
        if ent == 'Ireland (whole island)': whole_island[y] = p
        if code: raw.setdefault(code, {})[y] = p
if 'IRL' in raw:
    for y, p in whole_island.items(): raw['IRL'].setdefault(y, p)
popcodes = set(raw)

# --- pass 1: contar figuras por iso3 ---
figcount = Counter()
with open(PERSONS, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        iso = (r.get('iso3') or '').strip()
        if iso: figcount[iso] += 1

# --- extender isoMeta: agregar países con pob+región que EXPLORA no tiene ---
have = set(m['iso'] for m in isoMeta)
added = []
for iso in sorted(popcodes):
    if iso in have: continue
    reg = iso2region.get(iso)
    if not reg: continue
    if figcount.get(iso, 0) >= 1 or reg == 'Latin America':   # con figuras, o LatAm (para completar el botón)
        es, en = name_of(iso)
        isoMeta.append({'iso': iso, 'es': es, 'en': en, 'reg': reg})
        added.append((iso, figcount.get(iso, 0)))
# patch región de entradas ya existentes (los 162 de EXPLORA) para los FORCE
for m in isoMeta:
    if m['iso'] in FORCE: m['reg'] = FORCE[m['iso']]
iso2idx = {m['iso']: k for k, m in enumerate(isoMeta)}

# --- sub-rubros (breakout) ---
DOM = {
 'Deportes': ['SOCCER PLAYER', 'ATHLETE', 'BASKETBALL PLAYER', 'CYCLIST', 'TENNIS PLAYER', 'SWIMMER', 'WRESTLER', 'RACING DRIVER', 'SKIER', 'HOCKEY PLAYER', 'BOXER', 'GYMNAST', 'HANDBALL PLAYER', 'SKATER', 'COACH', 'CHESS PLAYER', 'FENCER', 'VOLLEYBALL PLAYER', 'BADMINTON PLAYER', 'MARTIAL ARTS', 'REFEREE', 'RUGBY PLAYER', 'CRICKETER', 'TABLE TENNIS PLAYER', 'BASEBALL PLAYER', 'GOLFER', 'SNOOKER', 'AMERICAN FOOTBALL PLAYER', 'MOUNTAINEER', 'POKER PLAYER', 'BULLFIGHTER', 'GO PLAYER'],
 'Artes y espectáculo': ['ACTOR', 'SINGER', 'MUSICIAN', 'FILM DIRECTOR', 'PAINTER', 'COMPOSER', 'MODEL', 'COMIC ARTIST', 'PORNOGRAPHIC ACTOR', 'PRESENTER', 'PHOTOGRAPHER', 'PRODUCER', 'CONDUCTOR', 'ARTIST', 'DANCER', 'DESIGNER', 'COMEDIAN', 'FASHION DESIGNER', 'SCULPTOR', 'CHEF', 'MAGICIAN', 'CELEBRITY', 'YOUTUBER', 'GAME DESIGNER', 'ARCHITECT'],
 'Ciencia y tecnología': ['BIOLOGIST', 'PHYSICIST', 'MATHEMATICIAN', 'ASTRONOMER', 'CHEMIST', 'ASTRONAUT', 'INVENTOR', 'ENGINEER', 'COMPUTER SCIENTIST', 'PHYSICIAN', 'GEOLOGIST', 'STATISTICIAN'],
 'Humanidades': ['WRITER', 'PHILOSOPHER', 'HISTORIAN', 'ECONOMIST', 'PSYCHOLOGIST', 'LINGUIST', 'ARCHAEOLOGIST', 'ANTHROPOLOGIST', 'GEOGRAPHER', 'SOCIOLOGIST', 'POLITICAL SCIENTIST', 'CRITIC'],
 'Poder y figuras públicas': ['POLITICIAN', 'RELIGIOUS FIGURE', 'MILITARY PERSONNEL', 'NOBLEMAN', 'SOCIAL ACTIVIST', 'COMPANION', 'EXTREMIST', 'JOURNALIST', 'DIPLOMAT', 'MAFIOSO', 'PILOT', 'JUDGE', 'PUBLIC WORKER', 'PIRATE', 'LAWYER', 'OCCULTIST', 'INSPIRATION'],
 'Negocios y exploración': ['BUSINESSPERSON', 'EXPLORER'],
}
occ2dom = {o.strip(): domNames.index(d) for d, l in DOM.items() for o in l}
BREAKOUT = {
 'Deportes': [('SOCCER PLAYER', 'Fútbol', 'Football'), ('ATHLETE', 'Atletismo', 'Athletics'), ('BASKETBALL PLAYER', 'Básquet', 'Basketball'), ('CYCLIST', 'Ciclismo', 'Cycling'), ('TENNIS PLAYER', 'Tenis', 'Tennis')],
 'Artes y espectáculo': [('ACTOR', 'Actuación', 'Acting'), ('SINGER', 'Canto', 'Singing'), ('MUSICIAN', 'Música', 'Music'), ('FILM DIRECTOR', 'Cine', 'Film'), ('PAINTER', 'Pintura', 'Painting')],
 'Ciencia y tecnología': [('BIOLOGIST', 'Biología', 'Biology'), ('MATHEMATICIAN', 'Matemática', 'Mathematics'), ('PHYSICIST', 'Física', 'Physics')],
 'Humanidades': [('WRITER', 'Escritura', 'Writing'), ('PHILOSOPHER', 'Filosofía', 'Philosophy')],
 'Poder y figuras públicas': [('POLITICIAN', 'Política', 'Politics'), ('RELIGIOUS FIGURE', 'Religión', 'Religion'), ('MILITARY PERSONNEL', 'Militares', 'Military'), ('NOBLEMAN', 'Nobleza', 'Nobility')],
 'Negocios y exploración': [('BUSINESSPERSON', 'Empresarios', 'Business')],
}
DOM_SHORT = {'Deportes': ('deporte', 'sports'), 'Artes y espectáculo': ('arte', 'arts'), 'Ciencia y tecnología': ('ciencia', 'science'),
             'Humanidades': ('letras', 'humanities'), 'Poder y figuras públicas': ('poder', 'power'), 'Negocios y exploración': ('negocios', 'business')}
subMeta, occ2sub, rest_sub = [], {}, {}
for di, dname in enumerate(domNames):
    for raw_o, es, eng in BREAKOUT.get(dname, []):
        occ2sub[raw_o] = len(subMeta); subMeta.append({'es': es, 'en': eng, 'dom': di})
    sh = DOM_SHORT[dname]; rest_sub[di] = len(subMeta); subMeta.append({'es': 'Resto ' + sh[0], 'en': 'Other ' + sh[1], 'dom': di})
OTROS = len(subMeta); subMeta.append({'es': 'Otros', 'en': 'Other', 'dom': -1})

# --- pass 2: encode F ---
buf = bytearray(); n = 0; minY, maxY = 10**9, -10**9
with open(PERSONS, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        k = iso2idx.get((r.get('iso3') or '').strip())
        if k is None: continue
        try: y = int(round(float(r['birthyear'])))
        except (ValueError, TypeError, KeyError): continue
        y = max(YMIN, min(YMAX, y))
        occ = (r.get('occupation') or '').strip().upper()
        di = occ2dom.get(occ)
        sub = OTROS if di is None else (occ2sub[occ] if occ in occ2sub else rest_sub[di])
        yo = y + YOFF
        buf += bytes((k & 0xFF, sub & 0xFF, yo & 0xFF, (yo >> 8) & 0xFF))
        n += 1; minY = min(minY, y); maxY = max(maxY, y)

figs = {'isoMeta': isoMeta, 'domains': domains_out, 'subMeta': subMeta, 'yearMin': minY, 'yearMax': maxY, 'F': {'b64': base64.b64encode(bytes(buf)).decode(), 'n': n}}
open(OUT_F, 'w', encoding='utf-8').write('// Figuras per cápita rango completo. F=4 bytes (iso,subId,year int16 +%d). subMeta[subId]={es,en,dom}.\nwindow.PCFIGS=' % YOFF + json.dumps(figs, separators=(',', ':'), ensure_ascii=False) + ';\n')

# --- población por país (puntos crudos) + mundo ---
def points(by):
    if not by: return None
    ys = sorted(by); return {'y': ys, 'p': [int(round(by[y] / 1000.0)) for y in ys]}
pop_out = {m['iso']: points(raw.get(m['iso'])) for m in isoMeta if raw.get(m['iso'])}
world = points(raw.get('OWID_WRL'))
open(OUT_P, 'w', encoding='utf-8').write('// Población (miles) por país + mundo (OWID), puntos crudos; JS interpola. IRL+whole-island.\nwindow.PERCAP_POP=' + json.dumps({'pop': pop_out, 'world': world}, separators=(',', ':')) + ';\n')

# --- TOP figura por (país × sub-rubro): [nombre, hpi, ranking global HPI] ---
# El ranking global es el puesto del archivo (todas las figuras de isoMeta,
# por hpi desc). Para un filtro = unión de sub-rubros, el JS toma el de mayor hpi.
recs = []
with open(PERSONS, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        iso = (r.get('iso3') or '').strip()
        if iso not in iso2idx: continue
        try: hpi = float(r['hpi'])
        except (ValueError, TypeError, KeyError): continue
        name = (r.get('name') or '').strip()
        if not name: continue
        occ = (r.get('occupation') or '').strip().upper()
        di = occ2dom.get(occ)
        sub = OTROS if di is None else (occ2sub[occ] if occ in occ2sub else rest_sub[di])
        recs.append((hpi, iso, sub, name))
recs.sort(key=lambda x: -x[0])
topfig = {}
for rank, (hpi, iso, sub, name) in enumerate(recs, start=1):
    d = topfig.setdefault(iso, {})
    if str(sub) not in d: d[str(sub)] = [name, round(hpi, 1), rank]
open(OUT_T, 'w', encoding='utf-8').write('// Top figura por país×sub-rubro: [nombre, hpi, ranking global HPI].\nwindow.PCTOP=' + json.dumps(topfig, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('PCTOP países:', len(topfig), '| topfig file:', round(os.path.getsize(OUT_T) / 1024), 'KB')

latam = [m['iso'] for m in isoMeta if m['reg'] == 'Latin America']
print('isoMeta:', len(isoMeta), '(+%d agregados)' % len(added), '| figuras:', n, '| sub:', len(subMeta))
print('agregados (top por figs):', sorted(added, key=lambda x: -x[1])[:12])
print('VEN en isoMeta?', 'VEN' in iso2idx, '| LatAm countries:', len(latam), sorted(latam))
print('figs file:', round(os.path.getsize(OUT_F) / 1024), 'KB | pop file:', round(os.path.getsize(OUT_P) / 1024), 'KB')
