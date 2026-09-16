# -*- coding: utf-8 -*-
"""Datos del MAPA (percap-map) desde el dataset CORREGIDO (pantheon_corregido.csv).
A diferencia de data-percap-figs.js (que alimenta el tablero de barras y NO se
toca), este archivo agrega por figura: multi_idioma (gate) y score (HPI
recalculado). Salidas:
  - data-percap-map.js  (window.PCMAP): isoMeta + domains + subMeta + F por-figura
    6 bytes = iso 1B, subId 1B, [year(13b)+multi(bit15)] 2B LE, score*100 2B LE.
  - data-percap-topfig.js (window.PCTOP): top figura por país×sub = [nombre,
    score, rank_score] (ranking global de la NUEVA metodología).
iso3 por figura: join por id con persons_enriched (96%) + fallback nombre→iso.
"""
import csv, json, base64, os
from collections import Counter

ROOT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts'
EXPLORA = ROOT + r'\05-pantheon\data-explora.js'
N1 = ROOT + r'\01-bienestar-violencia\data-scatter.js'
CNAMES = ROOT + r'\05-pantheon\country-names.js'
PERSONS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#5 - Talento\persons_enriched.csv'
RECUP = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#5 - Talento\lugares_recuperados.csv'   # iso3 recuperado; ver recuperar_lugar.py
CORR = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#5 - Talento\pantheon_corregido.csv'
POPCSV = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#5 - Talento\pop_owid\population.csv'
OUT_M = ROOT + r'\05-pantheon\data-percap-map.js'
OUT_T = ROOT + r'\05-pantheon\data-percap-topfig.js'
YMIN, YMAX, YOFF = -4000, 2021, 4000

def load_js_obj(path, opener):
    s = open(path, encoding='utf-8').read(); i = s.index(opener)
    if opener == '[':
        d = 0
        for j, c in enumerate(s[i:]):
            if c == '[': d += 1
            elif c == ']':
                d -= 1
                if d == 0: return json.loads(s[i:i + j + 1])
    return json.loads(s[i:s.rindex('}') + 1])

EXP = json.loads(open(EXPLORA, encoding='utf-8').read().split('window.EXPLORA=', 1)[1].rstrip().rstrip(';'))
isoMeta = [dict(m) for m in EXP['isoMeta']]
domNames = [d['es'] for d in EXP['domains']]
domains_out = [{'es': d['es'], 'en': d['en']} for d in EXP['domains']]

iso2region = {x['iso3']: x['region'] for x in load_js_obj(N1, '[') if x.get('iso3') and x.get('region')}
ROV = {'PRI': 'Latin America', 'CUB': 'Latin America', 'TWN': 'East Asia', 'HKG': 'East Asia', 'MAC': 'East Asia', 'PSE': 'Middle East & North Africa',
       'PRK': 'East Asia', 'VEN': 'Latin America', 'GUF': 'Latin America', 'MMR': 'Southeast Asia', 'YEM': 'Middle East & North Africa',
       'COD': 'Sub-Saharan Africa', 'ERI': 'Sub-Saharan Africa', 'REU': 'Sub-Saharan Africa', 'MCO': 'Western Europe', 'XKX': 'Eastern Europe & Central Asia',
       'GRL': 'Western Europe', 'IMN': 'Western Europe', 'FRO': 'Western Europe', 'AND': 'Western Europe', 'LIE': 'Western Europe', 'SMR': 'Western Europe',
       'BMU': 'Caribbean', 'GLP': 'Caribbean', 'MTQ': 'Caribbean',
       'FJI': 'North America, Australia & New Zealand', 'TON': 'North America, Australia & New Zealand', 'VUT': 'North America, Australia & New Zealand',
       'WSM': 'North America, Australia & New Zealand', 'PYF': 'North America, Australia & New Zealand', 'MHL': 'North America, Australia & New Zealand',
       'NCL': 'North America, Australia & New Zealand', 'PLW': 'North America, Australia & New Zealand', 'FSM': 'North America, Australia & New Zealand', 'KIR': 'North America, Australia & New Zealand',
       # quedaban sin region y por eso no entraban a la vista Region (2026-09-11)
       'SSD': 'Sub-Saharan Africa', 'PNG': 'North America, Australia & New Zealand',
       'NRU': 'North America, Australia & New Zealand', 'SLB': 'North America, Australia & New Zealand',
       'TUV': 'North America, Australia & New Zealand'}
for k, v in ROV.items(): iso2region.setdefault(k, v)
FORCE = {'GUF': 'Caribbean', 'PRI': 'Latin America'}; iso2region.update(FORCE)

# Territorios y dependencias que el mapa DIBUJA pero que no tienen fila propia
# (sin figuras ni serie de poblacion). Se emiten aparte (terrMeta) para dos cosas:
# el tooltip muestra el nombre en vez del codigo ISO crudo ("ESH" -> Sahara
# Occidental, marcado por Daniel 2026-09-11) y la union por region los incluye,
# asi la vista Region no queda con agujeros grises adentro de un continente.
# Los poligonos polares/deshabitados (ATF, HMD, SGS) quedan a proposito sin
# region, como la Antartida.
TERRITORIOS = {
    'ESH': ('Sáhara Occidental', 'Western Sahara', 'Middle East & North Africa'),
    'CYN': ('Chipre del Norte', 'Northern Cyprus', 'Western Europe'),
    'KAS': ('Cachemira', 'Kashmir', 'South Asia'),
    'IOT': ('Territorio Británico del Océano Índico', 'British Indian Ocean Territory', 'South Asia'),
    'SHN': ('Santa Elena', 'Saint Helena', 'Sub-Saharan Africa'),
    'ALA': ('Islas Åland', 'Åland Islands', 'Western Europe'),
    'GGY': ('Guernsey', 'Guernsey', 'Western Europe'),
    'JEY': ('Jersey', 'Jersey', 'Western Europe'),
    'VAT': ('Ciudad del Vaticano', 'Vatican City', 'Western Europe'),
    'AIA': ('Anguila', 'Anguilla', 'Caribbean'),
    'BLM': ('San Bartolomé', 'Saint Barthélemy', 'Caribbean'),
    'CYM': ('Islas Caimán', 'Cayman Islands', 'Caribbean'),
    'MAF': ('San Martín', 'Saint Martin', 'Caribbean'),
    'MSR': ('Montserrat', 'Montserrat', 'Caribbean'),
    'SXM': ('Sint Maarten', 'Sint Maarten', 'Caribbean'),
    'TCA': ('Islas Turcas y Caicos', 'Turks and Caicos Islands', 'Caribbean'),
    'VGB': ('Islas Vírgenes Británicas', 'British Virgin Islands', 'Caribbean'),
    'VIR': ('Islas Vírgenes de EE.UU.', 'U.S. Virgin Islands', 'Caribbean'),
    'SPM': ('San Pedro y Miquelón', 'Saint Pierre and Miquelon', 'North America, Australia & New Zealand'),
    'ASM': ('Samoa Americana', 'American Samoa', 'North America, Australia & New Zealand'),
    'ATC': ('Islas Ashmore y Cartier', 'Ashmore and Cartier Islands', 'North America, Australia & New Zealand'),
    'COK': ('Islas Cook', 'Cook Islands', 'North America, Australia & New Zealand'),
    'GUM': ('Guam', 'Guam', 'North America, Australia & New Zealand'),
    'MNP': ('Islas Marianas del Norte', 'Northern Mariana Islands', 'North America, Australia & New Zealand'),
    'NFK': ('Isla Norfolk', 'Norfolk Island', 'North America, Australia & New Zealand'),
    'NIU': ('Niue', 'Niue', 'North America, Australia & New Zealand'),
    'PCN': ('Islas Pitcairn', 'Pitcairn Islands', 'North America, Australia & New Zealand'),
    'WLF': ('Wallis y Futuna', 'Wallis and Futuna', 'North America, Australia & New Zealand'),
    'ATF': ('Tierras Australes Francesas', 'French Southern Territories', None),
    'HMD': ('Islas Heard y McDonald', 'Heard and McDonald Islands', None),
    'SGS': ('Georgias del Sur', 'South Georgia', None),
}

NAMES = load_js_obj(CNAMES, '{')
NAMES_EXTRA = {'VEN': ('Venezuela', 'Venezuela'), 'PRK': ('Corea del Norte', 'North Korea'), 'SOM': ('Somalia', 'Somalia'), 'SDN': ('Sudán', 'Sudan'),
               'YEM': ('Yemen', 'Yemen'), 'SUR': ('Surinam', 'Suriname'), 'BHS': ('Bahamas', 'Bahamas'), 'FJI': ('Fiyi', 'Fiji'), 'MCO': ('Mónaco', 'Monaco'),
               'GUF': ('Guayana Francesa', 'French Guiana'), 'GLP': ('Guadalupe', 'Guadeloupe'), 'MTQ': ('Martinica', 'Martinique'), 'PYF': ('Polinesia Francesa', 'French Polynesia'),
               'FRO': ('Islas Feroe', 'Faroe Islands'), 'PRI': ('Puerto Rico', 'Puerto Rico'), 'REU': ('Reunión', 'Réunion'), 'NCL': ('Nueva Caledonia', 'New Caledonia'),
               'AND': ('Andorra', 'Andorra'), 'LIE': ('Liechtenstein', 'Liechtenstein'), 'SMR': ('San Marino', 'San Marino'), 'BMU': ('Bermudas', 'Bermuda'),
               'GRL': ('Groenlandia', 'Greenland'), 'IMN': ('Isla de Man', 'Isle of Man'),
               'ATA': ('Antártida', 'Antarctica')}
def name_of(iso):
    if iso in NAMES: return NAMES[iso].get('es', iso), NAMES[iso].get('en', iso)
    if iso in NAMES_EXTRA: return NAMES_EXTRA[iso]
    return iso, iso

# nombre país → iso (para el fallback cuando el id no está en persons_enriched)
OV = {'United States': 'USA', 'United Kingdom': 'GBR', 'Russia': 'RUS', 'South Korea': 'KOR', 'North Korea': 'PRK', 'Iran': 'IRN', 'Syria': 'SYR',
      'Vietnam': 'VNM', 'Czechia': 'CZE', 'Turkey': 'TUR', 'Türkiye': 'TUR', 'Bolivia': 'BOL', 'Venezuela': 'VEN', 'DR Congo': 'COD', 'Taiwan': 'TWN',
      'Hong Kong': 'HKG', 'Myanmar': 'MMR', 'Myanmar (Burma)': 'MMR', 'Democratic Republic of the Congo': 'COD', 'Yemen': 'YEM', 'Kosovo': 'XKX',
      'Palestine': 'PSE', 'Laos': 'LAO', 'Brunei': 'BRN', 'Cape Verde': 'CPV', 'Ivory Coast': 'CIV', "Cote d'Ivoire": 'CIV'}
name2iso = dict(OV)
for iso, nm in NAMES.items():
    name2iso.setdefault(nm.get('en', ''), iso); name2iso.setdefault(nm.get('es', ''), iso)
for m in EXP['isoMeta']:
    name2iso.setdefault(m['en'], m['iso']); name2iso.setdefault(m['es'], m['iso'])

# id → iso3 desde persons_enriched (cobertura completa, sin filtrar por el gate)
# + los lugares recuperados, que persons_enriched deja en blanco
id2iso = {}
with open(PERSONS, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        iso = (r.get('iso3') or '').strip()
        if iso: id2iso[r['id']] = iso
_rec = 0
if os.path.exists(RECUP):
    with open(RECUP, encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            iso = (r.get('iso3') or '').strip()
            if iso and r['id'] not in id2iso: id2iso[r['id']] = iso; _rec += 1
print('id->iso3: %d figuras (+%d recuperadas)' % (len(id2iso), _rec))
def iso_of(idv, pais):
    return id2iso.get(idv) or name2iso.get(pais)

# población (para extender isoMeta con países que faltan)
popcodes = set()
with open(POPCSV, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['Code']: popcodes.add(r['Code'].strip())

# sub-rubros (breakout) — igual que build_percap_data.py
DOM = {
 'Deportes': ['SOCCER PLAYER', 'ATHLETE', 'BASKETBALL PLAYER', 'CYCLIST', 'TENNIS PLAYER', 'SWIMMER', 'WRESTLER', 'RACING DRIVER', 'SKIER', 'HOCKEY PLAYER', 'BOXER', 'GYMNAST', 'HANDBALL PLAYER', 'SKATER', 'COACH', 'CHESS PLAYER', 'FENCER', 'VOLLEYBALL PLAYER', 'BADMINTON PLAYER', 'MARTIAL ARTS', 'REFEREE', 'RUGBY PLAYER', 'CRICKETER', 'TABLE TENNIS PLAYER', 'BASEBALL PLAYER', 'GOLFER', 'SNOOKER', 'AMERICAN FOOTBALL PLAYER', 'MOUNTAINEER', 'POKER PLAYER', 'BULLFIGHTER', 'GO PLAYER', 'GAMER'],
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
def sub_of(occ):
    di = occ2dom.get(occ)
    return OTROS if di is None else (occ2sub[occ] if occ in occ2sub else rest_sub[di])

# pass 1: figcount por iso (corregido) para extender isoMeta
figcount = Counter()
with open(CORR, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        iso = iso_of(r['id'], r.get('pais'))
        if iso: figcount[iso] += 1
have = set(m['iso'] for m in isoMeta); added = []
for iso in sorted(popcodes | set(figcount)):
    if iso in have: continue
    reg = iso2region.get(iso)
    # con figuras entra si tiene region O nombre resoluble (ATA='Antartida');
    # asi no se cuelan los codigos historicos sin nombre (SUN, YUG...)
    con_nombre = name_of(iso)[0] != iso
    if (figcount.get(iso, 0) >= 1 and (reg or con_nombre)) or reg == 'Latin America':
        es, en = name_of(iso); isoMeta.append({'iso': iso, 'es': es, 'en': en, 'reg': reg}); added.append(iso)
for m in isoMeta:
    if m['iso'] in FORCE: m['reg'] = FORCE[m['iso']]
iso2idx = {m['iso']: k for k, m in enumerate(isoMeta)}

# pass 2: encode F (6 bytes) — desde el corregido
buf = bytearray(); n = 0; minY, maxY = 10**9, -10**9; dropped = 0; multi1 = 0
with open(CORR, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        k = iso2idx.get(iso_of(r['id'], r.get('pais')))
        if k is None: dropped += 1; continue
        try: y = int(round(float(r['birthyear'])))
        except (ValueError, TypeError): continue
        y = max(YMIN, min(YMAX, y))
        sub = sub_of((r.get('occupation') or '').strip().upper())
        multi = 1 if r.get('multi_idioma') == '1' else 0
        try: sc = float(r.get('score') or 0)
        except ValueError: sc = 0.0
        s16 = max(0, min(65535, int(round(sc * 100))))
        yw = (y + YOFF) | (multi << 15)
        buf += bytes((k & 0xFF, sub & 0xFF, yw & 0xFF, (yw >> 8) & 0xFF, s16 & 0xFF, (s16 >> 8) & 0xFF))
        n += 1; multi1 += multi; minY = min(minY, y); maxY = max(maxY, y)

mp = {'isoMeta': isoMeta,
      'terrMeta': [{'iso': k, 'es': v[0], 'en': v[1], 'reg': v[2]} for k, v in sorted(TERRITORIOS.items())],
      'domains': domains_out, 'subMeta': subMeta, 'yearMin': minY, 'yearMax': maxY, 'F': {'b64': base64.b64encode(bytes(buf)).decode(), 'n': n}}
open(OUT_M, 'w', encoding='utf-8').write('// Mapa (dataset corregido). F=6 bytes (iso, subId, year13b+multi-bit15, score*100 uint16).\nwindow.PCMAP=' + json.dumps(mp, separators=(',', ':'), ensure_ascii=False) + ';\n')

# TOP figuras por país×sub = [nombre, año, score, rank_score] — SOLO multiidioma.
# Para que el tooltip muestre la mejor figura DEL PERÍODO elegido (no solo de hoy),
# guardo por (país,sub): top-4 por score UNIÓN el campeón (máx score) de cada
# bucket temporal → así cualquier período (incluso antiguo y angosto) tiene candidato.
BUCKETS = [-4000, -500, 1, 500, 1000, 1300, 1500, 1650, 1800, 1880, 1920, 1950, 1980, 2026]
def bidx(y):
    for i in range(len(BUCKETS) - 1):
        if BUCKETS[i] <= y < BUCKETS[i + 1]: return i
    return len(BUCKETS) - 2
# Nombre en castellano, de las mismas dos capas que el ranking y el laboratorio:
# el label de Wikidata y los overrides que corrigen los vandalizados. Sin esto el
# tooltip del mapa decia "Jesus" y "Alexander the Great" tambien en la vista ES.
NOM_ES = {}
try:
    import pandas as _pd
    _N = _pd.read_csv(os.path.join(os.path.dirname(CORR), 'nombres_es.csv'), encoding='utf-8-sig')[['id', 'name_es']]
    _N['name_es'] = _N.name_es.fillna('').str.replace(r'\s*\([^)]*\)\s*$', '', regex=True).str.strip()
    NOM_ES = dict(zip(_N.id.astype(str), _N.name_es))
    _ov = _pd.read_csv(os.path.join(os.path.dirname(CORR), 'nombres_overrides.csv'), encoding='utf-8-sig')
    NOM_ES.update(dict(zip(_ov.id.astype(str), _ov.name_es)))
    print('nombres ES para el tooltip del mapa:', sum(1 for v in NOM_ES.values() if v))
except Exception as _e:
    print('(sin nombres en castellano para el mapa: %s)' % _e)

allf = {}
with open(CORR, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        if r.get('multi_idioma') != '1': continue
        iso = iso_of(r['id'], r.get('pais'))
        if not iso: continue
        name = (r.get('name') or '').strip()
        try: sc = float(r.get('score') or 0); rk = int(float(r.get('rank_score') or 0)); yr = int(round(float(r['birthyear'])))
        except (ValueError, TypeError): continue
        if not name or rk <= 0: continue
        sub = str(sub_of((r.get('occupation') or '').strip().upper()))
        nes = (NOM_ES.get(str(r['id'])) or '').strip()
        allf.setdefault(iso, {}).setdefault(sub, []).append([name, yr, sc, rk, '' if nes == name else nes])
topfig = {}
for iso, subs in allf.items():
    d = {}
    for sub, lst in subs.items():
        lst.sort(key=lambda e: -e[2])
        keep = lst[:4]; seen = set(id(x) for x in keep)
        perb = {}
        for e in lst:
            b = bidx(e[1])
            if b not in perb or e[2] > perb[b][2]: perb[b] = e
        for e in perb.values():
            if id(e) not in seen: keep.append(e); seen.add(id(e))
        d[sub] = [[e[0], e[1], round(e[2], 1), e[3]] + ([e[4]] if e[4] else []) for e in keep]
    topfig[iso] = d
open(OUT_T, 'w', encoding='utf-8').write('// Top figuras por país×sub (corregido, multiidioma): [nombre_en, año, score, rank_score, nombre_es si difiere]. top-4 por score + campeón por era.\nwindow.PCTOP=' + json.dumps(topfig, separators=(',', ':'), ensure_ascii=False) + ';\n')

print('isoMeta:', len(isoMeta), '(+%d)' % len(added), '| figuras F:', n, '| multi=1:', multi1, '| dropped(sin iso):', dropped)
print('rango años:', minY, '->', maxY)
print('PCMAP:', round(os.path.getsize(OUT_M) / 1024), 'KB | PCTOP:', round(os.path.getsize(OUT_T) / 1024), 'KB')
