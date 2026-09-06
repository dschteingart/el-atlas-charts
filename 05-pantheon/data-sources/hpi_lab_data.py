# -*- coding: utf-8 -*-
import pandas as pd, numpy as np, json, warnings, sys
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
df = pd.read_csv('person_2025_update.csv', low_memory=False)
d = df.dropna(subset=['name','occupation','non_en_page_views','l','l_','birthyear','coefficient_of_variation','hpi']).drop_duplicates('name').copy()
d = d[(d.non_en_page_views>0)&(d.l>0)&(d.l_>0)&(d.coefficient_of_variation>0)].nlargest(40000,'hpi').reset_index(drop=True)   # top 40k por hpi (cubre líderes de cualquier región/dominio/período)

_DOM = {'Deporte':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],'Arte y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],'Negocios y exploración':['BUSINESSPERSON','EXPLORER']}
o2d = {o:k for k,l in _DOM.items() for o in l}
OCC_ES = {'SOCCER PLAYER':'Futbolista','ATHLETE':'Atleta','BASKETBALL PLAYER':'Basquetbolista','CYCLIST':'Ciclista','TENNIS PLAYER':'Tenista','SWIMMER':'Nadador/a','WRESTLER':'Luchador','RACING DRIVER':'Piloto','SKIER':'Esquiador','HOCKEY PLAYER':'Hockista','BOXER':'Boxeador','GYMNAST':'Gimnasta','BASEBALL PLAYER':'Beisbolista','GOLFER':'Golfista','RUGBY PLAYER':'Rugbier','CRICKETER':'Cricketer','VOLLEYBALL PLAYER':'Voleibolista','CHESS PLAYER':'Ajedrecista','COACH':'DT','ACTOR':'Actor/Actriz','SINGER':'Cantante','MUSICIAN':'Músico','FILM DIRECTOR':'Director de cine','PAINTER':'Pintor/a','COMPOSER':'Compositor','MODEL':'Modelo','PHOTOGRAPHER':'Fotógrafo','SCULPTOR':'Escultor','DANCER':'Bailarín/a','COMEDIAN':'Comediante','ARCHITECT':'Arquitecto','CELEBRITY':'Celebridad','YOUTUBER':'Youtuber','BIOLOGIST':'Biólogo','PHYSICIST':'Físico','MATHEMATICIAN':'Matemático','ASTRONOMER':'Astrónomo','CHEMIST':'Químico','ASTRONAUT':'Astronauta','INVENTOR':'Inventor','ENGINEER':'Ingeniero','COMPUTER SCIENTIST':'Inf./CS','PHYSICIAN':'Médico','WRITER':'Escritor/a','PHILOSOPHER':'Filósofo','HISTORIAN':'Historiador','ECONOMIST':'Economista','PSYCHOLOGIST':'Psicólogo','LINGUIST':'Lingüista','POLITICAL SCIENTIST':'Politólogo','POLITICIAN':'Político','RELIGIOUS FIGURE':'Figura religiosa','MILITARY PERSONNEL':'Militar','NOBLEMAN':'Noble','SOCIAL ACTIVIST':'Activista','JOURNALIST':'Periodista','DIPLOMAT':'Diplomático','MAFIOSO':'Mafioso','LAWYER':'Abogado','JUDGE':'Juez','BUSINESSPERSON':'Empresario','EXPLORER':'Explorador'}
def occ_lbl(o): return OCC_ES.get(o, o.title())

d['dom'] = d.occupation.map(o2d); d = d[d.dom.notna()].reset_index(drop=True)
occs = sorted(d.occupation.unique())
occ_idx = {o:i for i,o in enumerate(occs)}

# --- país (lugar de nacimiento), display ES con fallback inglés ---
CES={'United States':'EE.UU.','United Kingdom':'Reino Unido','Germany':'Alemania','France':'Francia','Italy':'Italia','Spain':'España','Japan':'Japón','China':'China','Russia':'Rusia','Brazil':'Brasil','Mexico':'México','Argentina':'Argentina','Canada':'Canadá','Australia':'Australia','India':'India','Netherlands':'Países Bajos','Sweden':'Suecia','Poland':'Polonia','Austria':'Austria','Belgium':'Bélgica','Switzerland':'Suiza','Greece':'Grecia','Turkey':'Turquía','Egypt':'Egipto','Iran':'Irán','South Korea':'Corea del Sur','North Korea':'Corea del Norte','Portugal':'Portugal','Norway':'Noruega','Denmark':'Dinamarca','Finland':'Finlandia','Ireland':'Irlanda','Hungary':'Hungría','Czechia':'Chequia','Romania':'Rumania','Ukraine':'Ucrania','Chile':'Chile','Colombia':'Colombia','Peru':'Perú','Uruguay':'Uruguay','Cuba':'Cuba','Venezuela':'Venezuela','Paraguay':'Paraguay','Bolivia':'Bolivia','Ecuador':'Ecuador','South Africa':'Sudáfrica','Israel':'Israel','Croatia':'Croacia','Serbia':'Serbia'}
def cty_lbl(c): return CES.get(c, str(c))
d['ctyN'] = d.bplace_country.where(d.bplace_country.notna(), None)
ctys = sorted([c for c in d.ctyN.dropna().unique()], key=lambda c: cty_lbl(c))
cty_idx = {c:i for i,c in enumerate(ctys)}

# --- región (taxonomía El Atlas, igual que los scatters) ---
import pycountry as _pc, json as _json
_N1=open(r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js',encoding='utf-8').read()
_s=_N1[_N1.index('['):]; _dd=0
for _i,_ch in enumerate(_s):
    if _ch=='[':_dd+=1
    elif _ch==']':
        _dd-=1
        if _dd==0: _end=_i+1; break
_ARR=_json.loads(_s[:_end]); iso2region={x['iso3']:x['region'] for x in _ARR}
ROV={'PRI':'Latin America','CUB':'Latin America','TWN':'East Asia','HKG':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa',
 'PRK':'East Asia','VEN':'Latin America','GUF':'Latin America','MMR':'Southeast Asia','YEM':'Middle East & North Africa',
 'COD':'Sub-Saharan Africa','ERI':'Sub-Saharan Africa','REU':'Sub-Saharan Africa','MCO':'Western Europe','XKX':'Eastern Europe & Central Asia',
 'GRL':'Western Europe','IMN':'Western Europe','FRO':'Western Europe','AND':'Western Europe','LIE':'Western Europe','SMR':'Western Europe',
 'BMU':'Caribbean','GLP':'Caribbean','MTQ':'Caribbean',
 'FJI':'North America, Australia & New Zealand','TON':'North America, Australia & New Zealand','VUT':'North America, Australia & New Zealand','WSM':'North America, Australia & New Zealand','PYF':'North America, Australia & New Zealand','MHL':'North America, Australia & New Zealand','NCL':'North America, Australia & New Zealand','PLW':'North America, Australia & New Zealand','FSM':'North America, Australia & New Zealand','KIR':'North America, Australia & New Zealand'}
OV={'United States':'USA','United Kingdom':'GBR','Russia':'RUS','South Korea':'KOR','North Korea':'PRK','Iran':'IRN','Syria':'SYR','Vietnam':'VNM','Czechia':'CZE','Türkiye':'TUR','Turkiye':'TUR','Turkey':'TUR','Bolivia':'BOL','Venezuela':'VEN','Tanzania':'TZA','Moldova':'MDA','North Macedonia':'MKD','DR Congo':'COD','Congo':'COG','Ivory Coast':'CIV',"Cote d'Ivoire":'CIV','Eswatini':'SWZ','Cape Verde':'CPV','Brunei':'BRN','Palestine':'PSE','Kosovo':'XKX','Taiwan':'TWN','Hong Kong':'HKG','Macao':'MAC','Myanmar':'MMR','Burma':'MMR','Myanmar (Burma)':'MMR','Micronesia':'FSM','Saint Lucia':'LCA','Trinidad and Tobago':'TTO','East Timor':'TLS','Gambia':'GMB','Bahamas':'BHS','Bahamas, The':'BHS','U.S. Virgin Islands':'VIR','Laos':'LAO','Democratic Republic of the Congo':'COD','Yemen':'YEM','Kosovo':'XKX','French Guiana':'GUF'}
_ci={}
def name2iso(n):
    if not isinstance(n,str): return None
    if n in OV: return OV[n]
    if n in _ci: return _ci[n]
    try: r=_pc.countries.lookup(n);_ci[n]=r.alpha_3;return r.alpha_3
    except:
        try: r=_pc.countries.search_fuzzy(n)[0];_ci[n]=r.alpha_3;return r.alpha_3
        except: _ci[n]=None;return None
def region_of_name(n):
    i=name2iso(n)
    return (iso2region.get(i) or ROV.get(i)) if i else None
REGION_ORDER=['Latin America','Caribbean','North America, Australia & New Zealand','Western Europe','Eastern Europe & Central Asia','East Asia','Southeast Asia','South Asia','Middle East & North Africa','Sub-Saharan Africa']
REG_ES={'Latin America':'América Latina','Caribbean':'Caribe','North America, Australia & New Zealand':'Norteamérica/Aus/NZ','Western Europe':'Europa Occidental','Eastern Europe & Central Asia':'Europa del Este/Asia Central','East Asia':'Asia Oriental','Southeast Asia':'Sudeste Asiático','South Asia':'Asia del Sur','Middle East & North Africa':'Medio Oriente/N. África','Sub-Saharan Africa':'África Subsahariana'}
reg_i={r:i for i,r in enumerate(REGION_ORDER)}
ctyReg=[ (reg_i.get(region_of_name(c), -1)) for c in ctys ]
_nomap=[c for c,ri in zip(ctys,ctyReg) if ri<0]
print('paises sin region:', len(_nomap), _nomap[:8])
DOMS = ['Deporte','Arte y espectáculo','Ciencia y tecnología','Humanidades','Poder y figuras públicas','Negocios y exploración']
dom_idx = {dm:i for i,dm in enumerate(DOMS)}

# media de ln(V) por dominio (para el shrinkage theta) — sobre estos 40k
d['lnV'] = np.log(d.non_en_page_views)
dom_mean = {dm: float(d[d.dom==dm].lnV.mean()) for dm in DOMS}
glob_mean = float(d.lnV.mean())

figs = []
for _,x in d.iterrows():
    figs.append([str(x['name']), occ_idx[x.occupation], int(x.birthyear), int(x.l),
                 round(float(x.l_),2), int(x.non_en_page_views), round(float(x.coefficient_of_variation),2),
                 round(float(x.hpi),1), (cty_idx[x.ctyN] if x.ctyN in cty_idx else -1)])
out = {'occs':[occ_lbl(o) for o in occs], 'occDom':[dom_idx[o2d[o]] for o in occs], 'doms':DOMS,
       'ctys':[cty_lbl(c) for c in ctys], 'ctyReg':ctyReg, 'regs':[REG_ES[r] for r in REGION_ORDER],
       'domMeanLnV':[dom_mean[dm] for dm in DOMS], 'globMeanLnV':glob_mean, 'refYear':2025, 'figs':figs}
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
open(OUT+r'\data-hpi-lab.js','w',encoding='utf-8').write('// Laboratorio HPI — columnas crudas del archivo Pantheon 2025 (top 40k por hpi).\n// figs: [name, occIdx, birthyear, L, Lstar, V_noEN, CV, hpi_archivo, ctyIdx]\nwindow.HPILAB='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
import os
print('data-hpi-lab.js:', len(figs),'figuras |', round(os.path.getsize(OUT+r'\data-hpi-lab.js')/1e6,2),'MB')
print('occupaciones:', len(occs), '| dominios:', len(DOMS), '| paises:', len(ctys))
print('domMeanLnV:', {dm:round(dom_mean[dm],2) for dm in DOMS}, '| global', round(glob_mean,2))
