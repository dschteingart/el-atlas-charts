# -*- coding: utf-8 -*-
# Genera data-fame-lab.js desde fame_pantheon.csv (métricas reconstruidas) + joins de occ/región/país.
import pandas as pd, numpy as np, json, warnings, sys
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
F=pd.read_csv('fame_pantheon.csv', on_bad_lines='skip'); F=F[F.n_langs>=0].copy()
PE=pd.read_csv('person_2025_update.csv',low_memory=False)[['id','occupation','birthyear','bplace_country']].drop_duplicates('id')
d=F.merge(PE,on='id',how='left').dropna(subset=['occupation','birthyear'])
# gate multi-idioma: >=2 idiomas con >=1000 vistas desde 2015 (borde de fame_border.csv; el resto pasa por monotonia)
try:
    _B=pd.read_csv('fame_border.csv',on_bad_lines='skip')[['id','l1k_all']]
    d=d.merge(_B,on='id',how='left')
    d['multi']=np.where(d.l1k_all.notna(), d.l1k_all>=2, d.langs1k>=2).astype(int)
except FileNotFoundError:
    d['multi']=(d.langs1k>=2).astype(int)
print('figuras:',len(d),'| multi-idioma:',int(d.multi.sum()))

_DOM={'Deporte':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],'Arte y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],'Negocios y exploración':['BUSINESSPERSON','EXPLORER']}
o2d={o:k for k,l in _DOM.items() for o in l}
OCC_ES={'SOCCER PLAYER':'Futbolista','ATHLETE':'Atleta','BASKETBALL PLAYER':'Basquetbolista','CYCLIST':'Ciclista','TENNIS PLAYER':'Tenista','SWIMMER':'Nadador/a','BOXER':'Boxeador','BASEBALL PLAYER':'Beisbolista','RACING DRIVER':'Piloto','COACH':'DT','CHESS PLAYER':'Ajedrecista','ACTOR':'Actor/Actriz','SINGER':'Cantante','MUSICIAN':'Músico','FILM DIRECTOR':'Director de cine','PAINTER':'Pintor/a','COMPOSER':'Compositor','MODEL':'Modelo','ARCHITECT':'Arquitecto','BIOLOGIST':'Biólogo','PHYSICIST':'Físico','MATHEMATICIAN':'Matemático','ASTRONOMER':'Astrónomo','CHEMIST':'Químico','INVENTOR':'Inventor','ENGINEER':'Ingeniero','PHYSICIAN':'Médico','WRITER':'Escritor/a','PHILOSOPHER':'Filósofo','HISTORIAN':'Historiador','ECONOMIST':'Economista','POLITICIAN':'Político','RELIGIOUS FIGURE':'Figura religiosa','MILITARY PERSONNEL':'Militar','NOBLEMAN':'Noble','SOCIAL ACTIVIST':'Activista','BUSINESSPERSON':'Empresario','EXPLORER':'Explorador','DANCER':'Bailarín/a','COMEDIAN':'Comediante'}
def occ_lbl(o): return OCC_ES.get(o,str(o).title())
d['dom']=d.occupation.map(o2d); d=d[d.dom.notna()].reset_index(drop=True)
occs=sorted(d.occupation.unique()); occ_idx={o:i for i,o in enumerate(occs)}
DOMS=['Deporte','Arte y espectáculo','Ciencia y tecnología','Humanidades','Poder y figuras públicas','Negocios y exploración']; dom_idx={x:i for i,x in enumerate(DOMS)}

# país + región (taxonomía N°1, igual que hpi_lab_data)
import pycountry as _pc
CES={'United States':'EE.UU.','United Kingdom':'Reino Unido','Germany':'Alemania','France':'Francia','Italy':'Italia','Spain':'España','Japan':'Japón','China':'China','Russia':'Rusia','Brazil':'Brasil','Mexico':'México','Argentina':'Argentina','Canada':'Canadá','Australia':'Australia','India':'India','Netherlands':'Países Bajos','Sweden':'Suecia','Poland':'Polonia','Austria':'Austria','Belgium':'Bélgica','Switzerland':'Suiza','Greece':'Grecia','Turkey':'Turquía','Egypt':'Egipto','Iran':'Irán','South Korea':'Corea del Sur','North Korea':'Corea del Norte','Portugal':'Portugal','Norway':'Noruega','Denmark':'Dinamarca','Ireland':'Irlanda','Hungary':'Hungría','Czechia':'Chequia','Ukraine':'Ucrania','Chile':'Chile','Colombia':'Colombia','Peru':'Perú','Uruguay':'Uruguay','Cuba':'Cuba','Venezuela':'Venezuela','South Africa':'Sudáfrica','Israel':'Israel'}
CES.update({'Türkiye':'Turquía','Romania':'Rumania','Finland':'Finlandia','Croatia':'Croacia','Serbia':'Serbia','New Zealand':'Nueva Zelanda','Belarus':'Bielorrusia','Bulgaria':'Bulgaria','Slovakia':'Eslovaquia','Georgia':'Georgia','Bosnia and Herzegovina':'Bosnia y Herzegovina','Iraq':'Irak','Estonia':'Estonia','Slovenia':'Eslovenia','Saudi Arabia':'Arabia Saudita','Lithuania':'Lituania','Latvia':'Letonia','Nigeria':'Nigeria','Morocco':'Marruecos','Kazakhstan':'Kazajistán','Azerbaijan':'Azerbaiyán','Uzbekistan':'Uzbekistán','Tunisia':'Túnez','Algeria':'Argelia','Thailand':'Tailandia','Jamaica':'Jamaica','Syria':'Siria','Pakistan':'Pakistán','Kenya':'Kenia','Paraguay':'Paraguay','Iceland':'Islandia','Indonesia':'Indonesia','Armenia':'Armenia','Afghanistan':'Afganistán','Ecuador':'Ecuador','Ghana':'Ghana','Philippines':'Filipinas','Cameroon':'Camerún','Montenegro':'Montenegro','North Macedonia':'Macedonia del Norte',"Côte d'Ivoire":'Costa de Marfil','Albania':'Albania','Lebanon':'Líbano','Taiwan':'Taiwán','Senegal':'Senegal','Hong Kong':'Hong Kong','Ethiopia':'Etiopía','Vietnam':'Vietnam','Costa Rica':'Costa Rica','Moldova':'Moldavia','Malaysia':'Malasia','Democratic Republic of the Congo':'Rep. Dem. del Congo','Bolivia':'Bolivia','Luxembourg':'Luxemburgo','Dominican Republic':'Rep. Dominicana','Mongolia':'Mongolia','Haiti':'Haití','Puerto Rico':'Puerto Rico','Honduras':'Honduras','Cyprus':'Chipre','Czech Republic':'Chequia','Myanmar (Burma)':'Myanmar','Palestine':'Palestina','Kosovo':'Kosovo','Macao':'Macao','Singapore':'Singapur','Qatar':'Catar','Kuwait':'Kuwait','Oman':'Omán','Jordan':'Jordania','United Arab Emirates':'Emiratos Árabes Unidos','Bahrain':'Baréin','Yemen':'Yemen','Libya':'Libia','Sudan':'Sudán','South Sudan':'Sudán del Sur','Tanzania':'Tanzania','Uganda':'Uganda','Zimbabwe':'Zimbabue','Zambia':'Zambia','Angola':'Angola','Mozambique':'Mozambique','Madagascar':'Madagascar','Mali':'Malí','Guinea':'Guinea','Rwanda':'Ruanda','Somalia':'Somalia','Benin':'Benín','Burkina Faso':'Burkina Faso','Niger':'Níger','Chad':'Chad','Mauritania':'Mauritania','Namibia':'Namibia','Botswana':'Botsuana','Gabon':'Gabón','Liberia':'Liberia','Sierra Leone':'Sierra Leona','Togo':'Togo','Malawi':'Malaui','Burundi':'Burundi','Eritrea':'Eritrea','Djibouti':'Yibuti','Lesotho':'Lesoto','Eswatini':'Esuatini','Swaziland':'Esuatini','Mauritius':'Mauricio','Comoros':'Comoras','Cabo Verde':'Cabo Verde','Seychelles':'Seychelles','Equatorial Guinea':'Guinea Ecuatorial','Guinea-Bissau':'Guinea-Bisáu','Central African Republic':'Rep. Centroafricana','Republic of the Congo':'Rep. del Congo','São Tomé and Príncipe':'Santo Tomé y Príncipe','Gambia, The':'Gambia','The Gambia':'Gambia','Bahamas, The':'Bahamas','The Bahamas':'Bahamas','Nepal':'Nepal','Bangladesh':'Bangladés','Sri Lanka':'Sri Lanka','Bhutan':'Bután','Maldives':'Maldivas','Cambodia':'Camboya','Laos':'Laos','Myanmar':'Myanmar','Brunei':'Brunéi','Timor-Leste':'Timor Oriental','Mongolia ':'Mongolia','Tajikistan':'Tayikistán','Turkmenistan':'Turkmenistán','Kyrgyzstan':'Kirguistán','El Salvador':'El Salvador','Guatemala':'Guatemala','Nicaragua':'Nicaragua','Panama':'Panamá','Belize':'Belice','Guyana':'Guyana','Suriname':'Surinam','Trinidad and Tobago':'Trinidad y Tobago','Barbados':'Barbados','Grenada':'Granada','Dominica':'Dominica','Saint Lucia':'Santa Lucía','Saint Kitts and Nevis':'San Cristóbal y Nieves','Saint Vincent and the Grenadines':'San Vicente y las Granadinas','Antigua and Barbuda':'Antigua y Barbuda','Andorra':'Andorra','Monaco':'Mónaco','San Marino':'San Marino','Liechtenstein':'Liechtenstein','Malta':'Malta','Vatican City':'Ciudad del Vaticano','Greenland':'Groenlandia','Faroe Islands':'Islas Feroe','Gibraltar':'Gibraltar','Isle of Man':'Isla de Man','Jersey':'Jersey','Guernsey':'Guernsey','Åland Islands':'Islas Åland','Fiji':'Fiyi','Papua New Guinea':'Papúa Nueva Guinea','Samoa':'Samoa','Tonga':'Tonga','Vanuatu':'Vanuatu','Solomon Islands':'Islas Salomón','Kiribati':'Kiribati','Nauru':'Nauru','Tuvalu':'Tuvalu','Palau':'Palaos','Marshall Islands':'Islas Marshall','Micronesia':'Micronesia','Federated States of Micronesia':'Micronesia','New Caledonia':'Nueva Caledonia','French Polynesia':'Polinesia Francesa','French Guiana':'Guayana Francesa','Guadeloupe':'Guadalupe','Martinique':'Martinica','Réunion':'Reunión','Mayotte':'Mayotte','Curaçao':'Curazao','Aruba':'Aruba','Bermuda':'Bermudas','Cayman Islands':'Islas Caimán','British Virgin Islands':'Islas Vírgenes Británicas','U.S. Virgin Islands':'Islas Vírgenes de EE.UU.','Puerto Rico ':'Puerto Rico','American Samoa':'Samoa Americana','Guam':'Guam','Northern Mariana Islands':'Islas Marianas del Norte','Cook Islands':'Islas Cook','Niue':'Niue','Norfolk Island':'Isla Norfolk','Falkland Islands (Islas Malvinas)':'Islas Malvinas','Anguilla':'Anguila','Antarctica':'Antártida'})
def cty_lbl(c): return CES.get(c,str(c))
d['ctyN']=d.bplace_country.where(d.bplace_country.notna(),None)
ctys=sorted([c for c in d.ctyN.dropna().unique()],key=lambda c:cty_lbl(c)); cty_idx={c:i for i,c in enumerate(ctys)}
_N1=open(r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js',encoding='utf-8').read()
_s=_N1[_N1.index('['):]; _dd=0
for _i,_ch in enumerate(_s):
    if _ch=='[':_dd+=1
    elif _ch==']':
        _dd-=1
        if _dd==0: _end=_i+1; break
iso2region={x['iso3']:x['region'] for x in json.loads(_s[:_end])}
ROV={'PRI':'Latin America','CUB':'Latin America','TWN':'East Asia','HKG':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa','PRK':'East Asia','VEN':'Latin America','GUF':'Latin America','MMR':'Southeast Asia','YEM':'Middle East & North Africa','COD':'Sub-Saharan Africa','ERI':'Sub-Saharan Africa','MCO':'Western Europe','XKX':'Eastern Europe & Central Asia','GRL':'Western Europe','BMU':'Caribbean','GLP':'Caribbean','MTQ':'Caribbean'}
OV={'United States':'USA','United Kingdom':'GBR','Russia':'RUS','South Korea':'KOR','North Korea':'PRK','Iran':'IRN','Syria':'SYR','Vietnam':'VNM','Czechia':'CZE','Turkey':'TUR','Bolivia':'BOL','Venezuela':'VEN','DR Congo':'COD','Taiwan':'TWN','Hong Kong':'HKG','Myanmar':'MMR','Myanmar (Burma)':'MMR','Democratic Republic of the Congo':'COD','Yemen':'YEM','Kosovo':'XKX','Palestine':'PSE','Laos':'LAO'}
_ci={}
def n2iso(n):
    if not isinstance(n,str): return None
    if n in OV: return OV[n]
    if n in _ci: return _ci[n]
    try: r=_pc.countries.lookup(n);_ci[n]=r.alpha_3;return r.alpha_3
    except:
        try: r=_pc.countries.search_fuzzy(n)[0];_ci[n]=r.alpha_3;return r.alpha_3
        except: _ci[n]=None;return None
REG=['Latin America','Caribbean','North America, Australia & New Zealand','Western Europe','Eastern Europe & Central Asia','East Asia','Southeast Asia','South Asia','Middle East & North Africa','Sub-Saharan Africa']
REG_ES={'Latin America':'América Latina','Caribbean':'Caribe','North America, Australia & New Zealand':'Norteamérica/Aus/NZ','Western Europe':'Europa Occidental','Eastern Europe & Central Asia':'Europa del Este/Asia Central','East Asia':'Asia Oriental','Southeast Asia':'Sudeste Asiático','South Asia':'Asia del Sur','Middle East & North Africa':'Medio Oriente/N. África','Sub-Saharan Africa':'África Subsahariana'}
reg_i={r:i for i,r in enumerate(REG)}
def reg_of(c):
    i=n2iso(c); return (reg_i.get(iso2region.get(i) or ROV.get(i),-1)) if i else -1
ctyReg=[reg_of(c) for c in ctys]

figs=[]
for _,x in d.iterrows():
    figs.append([str(x['name']), occ_idx[x.occupation], int(x.birthyear), (cty_idx[x.ctyN] if x.ctyN in cty_idx else -1),
                 int(x.n_langs), int(x.langs1k), int(x.langs10k), int(x.total12_noen), int(x.total_all_noen),
                 int(x.medianMonthly_noen), float(x.pctMonths_o100k), float(x.pctMonths_o300k), int(x.multi)])
out={'occs':[occ_lbl(o) for o in occs],'occDom':[dom_idx[o2d[o]] for o in occs],'doms':DOMS,
     'ctys':[cty_lbl(c) for c in ctys],'ctyReg':ctyReg,'regs':[REG_ES[r] for r in REG],'refYear':2025,
     'cols':['name','occIdx','birthyear','ctyIdx','n_langs','langs1k','langs10k','total12','total_all','median','pctM100','pctM300','multi'],'figs':figs}
OUT=r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-talento'
open(OUT+r'\data-fame-lab.js','w',encoding='utf-8').write('// Lab de fama reconstruida (Pantheon API /pageviews). figs cols: name,occ,by,cty,n_langs,langs1k,langs10k,total12,total_all,median,pctM100,pctM300\nwindow.FAMELAB='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
import os
print('data-fame-lab.js:',len(figs),'figuras |',round(os.path.getsize(OUT+r'\data-fame-lab.js')/1e6,2),'MB | occs',len(occs),'| paises',len(ctys))
