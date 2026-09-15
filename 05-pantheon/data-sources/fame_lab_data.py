# -*- coding: utf-8 -*-
# Genera data-fame-lab.js desde fame_pantheon.csv (métricas reconstruidas) + joins de occ/región/país.
import pandas as pd, numpy as np, json, warnings, sys, io, os
OUTDIR=r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
F=pd.read_csv('fame_pantheon.csv', on_bad_lines='skip'); F=F[F.n_langs>=0].copy()
PE=pd.read_csv('person_2025_update.csv',low_memory=False)[['id','occupation','birthyear','bplace_country']].drop_duplicates('id')
d=F.merge(PE,on='id',how='left').dropna(subset=['occupation','birthyear'])
# lugares de nacimiento recuperados (recuperar_lugar.py): Pantheon deja sin pais a
# figuras antiguas y biblicas. El dataset publicado los completa; el lab tambien,
# asi el filtro de pais/region del lab y el del numero muestran lo mismo.
import os as _os
_REC={}
if _os.path.exists('lugares_recuperados.csv'):
    _r=pd.read_csv('lugares_recuperados.csv')[['id','pais','region']]
    _r=_r[_r.region.notna()&_r.pais.notna()].drop_duplicates('id')
    _REC=dict(zip(_r.pais,_r.region))
    d=d.merge(_r.rename(columns={'pais':'_p','region':'_r'}),on='id',how='left')
    _f=d.bplace_country.isna()&d._p.notna()
    d.loc[_f,'bplace_country']=d.loc[_f,'_p']
    print('lugares recuperados en el lab:',int(_f.sum()))
    d=d.drop(columns=['_p','_r'])
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
# Ocupaciones en castellano: el mismo diccionario canonico que build_top_data.py
# (101 ocupaciones). Antes el lab tenia una version corta de 40 y el resto salia en
# ingles, con el rotulo igual en las dos vistas.
OCC_ES={'SOCCER PLAYER':'Futbolista','ATHLETE':'Atleta','BASKETBALL PLAYER':'Basquetbolista','CYCLIST':'Ciclista','TENNIS PLAYER':'Tenista','SWIMMER':'Nadador/a','WRESTLER':'Luchador/a','RACING DRIVER':'Piloto de carreras','SKIER':'Esquiador/a','HOCKEY PLAYER':'Jugador/a de hockey','BOXER':'Boxeador/a','GYMNAST':'Gimnasta','HANDBALL PLAYER':'Handbolista','SKATER':'Patinador/a','COACH':'DT','CHESS PLAYER':'Ajedrecista','FENCER':'Esgrimista','VOLLEYBALL PLAYER':'Voleibolista','BADMINTON PLAYER':'Jugador/a de bádminton','MARTIAL ARTS':'Artes marciales','REFEREE':'Árbitro/a','RUGBY PLAYER':'Rugbier','CRICKETER':'Jugador/a de críquet','TABLE TENNIS PLAYER':'Tenis de mesa','BASEBALL PLAYER':'Beisbolista','GOLFER':'Golfista','SNOOKER':'Jugador/a de snooker','AMERICAN FOOTBALL PLAYER':'Fútbol americano','MOUNTAINEER':'Montañista','POKER PLAYER':'Jugador/a de póker','BULLFIGHTER':'Torero/a','GO PLAYER':'Jugador/a de go','GAMER':'Gamer','ACTOR':'Actor/Actriz','SINGER':'Cantante','MUSICIAN':'Músico/a','FILM DIRECTOR':'Director/a de cine','PAINTER':'Pintor/a','COMPOSER':'Compositor/a','MODEL':'Modelo','COMIC ARTIST':'Historietista','PORNOGRAPHIC ACTOR':'Actor/actriz porno','PRESENTER':'Presentador/a','PHOTOGRAPHER':'Fotógrafo/a','PRODUCER':'Productor/a','CONDUCTOR':'Director/a de orquesta','ARTIST':'Artista','DANCER':'Bailarín/a','DESIGNER':'Diseñador/a','COMEDIAN':'Comediante','FASHION DESIGNER':'Diseñador/a de moda','SCULPTOR':'Escultor/a','CHEF':'Chef','MAGICIAN':'Mago/a','CELEBRITY':'Celebridad','YOUTUBER':'Youtuber','GAME DESIGNER':'Diseñador/a de juegos','ARCHITECT':'Arquitecto/a','BIOLOGIST':'Biólogo/a','PHYSICIST':'Físico/a','MATHEMATICIAN':'Matemático/a','ASTRONOMER':'Astrónomo/a','CHEMIST':'Químico/a','ASTRONAUT':'Astronauta','INVENTOR':'Inventor/a','ENGINEER':'Ingeniero/a','COMPUTER SCIENTIST':'Informático/a','PHYSICIAN':'Médico/a','GEOLOGIST':'Geólogo/a','STATISTICIAN':'Estadístico/a','WRITER':'Escritor/a','PHILOSOPHER':'Filósofo/a','HISTORIAN':'Historiador/a','ECONOMIST':'Economista','PSYCHOLOGIST':'Psicólogo/a','LINGUIST':'Lingüista','ARCHAEOLOGIST':'Arqueólogo/a','ANTHROPOLOGIST':'Antropólogo/a','GEOGRAPHER':'Geógrafo/a','SOCIOLOGIST':'Sociólogo/a','POLITICAL SCIENTIST':'Politólogo/a','CRITIC':'Crítico/a','POLITICIAN':'Político/a','RELIGIOUS FIGURE':'Figura religiosa','MILITARY PERSONNEL':'Militar','NOBLEMAN':'Noble','SOCIAL ACTIVIST':'Activista','COMPANION':'Consorte','EXTREMIST':'Extremista','JOURNALIST':'Periodista','DIPLOMAT':'Diplomático/a','MAFIOSO':'Mafioso','PILOT':'Aviador/a','JUDGE':'Juez/a','PUBLIC WORKER':'Funcionario/a','PIRATE':'Pirata','LAWYER':'Abogado/a','OCCULTIST':'Ocultista','INSPIRATION':'Inspiración','BUSINESSPERSON':'Empresario/a','EXPLORER':'Explorador/a'}
def occ_es(o): return OCC_ES.get(o,str(o).title())
def occ_en(o): return str(o).title()
d['dom']=d.occupation.map(o2d); d=d[d.dom.notna()].reset_index(drop=True)
occs=sorted(d.occupation.unique()); occ_idx={o:i for i,o in enumerate(occs)}
DOMS=['Deporte','Arte y espectáculo','Ciencia y tecnología','Humanidades','Poder y figuras públicas','Negocios y exploración']; dom_idx={x:i for i,x in enumerate(DOMS)}

# país + región (taxonomía N°1, igual que hpi_lab_data)
import pycountry as _pc
CES={'United States':'EE.UU.','United Kingdom':'Reino Unido','Germany':'Alemania','France':'Francia','Italy':'Italia','Spain':'España','Japan':'Japón','China':'China','Russia':'Rusia','Brazil':'Brasil','Mexico':'México','Argentina':'Argentina','Canada':'Canadá','Australia':'Australia','India':'India','Netherlands':'Países Bajos','Sweden':'Suecia','Poland':'Polonia','Austria':'Austria','Belgium':'Bélgica','Switzerland':'Suiza','Greece':'Grecia','Turkey':'Turquía','Egypt':'Egipto','Iran':'Irán','South Korea':'Corea del Sur','North Korea':'Corea del Norte','Portugal':'Portugal','Norway':'Noruega','Denmark':'Dinamarca','Ireland':'Irlanda','Hungary':'Hungría','Czechia':'Chequia','Ukraine':'Ucrania','Chile':'Chile','Colombia':'Colombia','Peru':'Perú','Uruguay':'Uruguay','Cuba':'Cuba','Venezuela':'Venezuela','South Africa':'Sudáfrica','Israel':'Israel'}
CES.update({'Türkiye':'Turquía','Romania':'Rumania','Finland':'Finlandia','Croatia':'Croacia','Serbia':'Serbia','New Zealand':'Nueva Zelanda','Belarus':'Bielorrusia','Bulgaria':'Bulgaria','Slovakia':'Eslovaquia','Georgia':'Georgia','Bosnia and Herzegovina':'Bosnia y Herzegovina','Iraq':'Irak','Estonia':'Estonia','Slovenia':'Eslovenia','Saudi Arabia':'Arabia Saudita','Lithuania':'Lituania','Latvia':'Letonia','Nigeria':'Nigeria','Morocco':'Marruecos','Kazakhstan':'Kazajistán','Azerbaijan':'Azerbaiyán','Uzbekistan':'Uzbekistán','Tunisia':'Túnez','Algeria':'Argelia','Thailand':'Tailandia','Jamaica':'Jamaica','Syria':'Siria','Pakistan':'Pakistán','Kenya':'Kenia','Paraguay':'Paraguay','Iceland':'Islandia','Indonesia':'Indonesia','Armenia':'Armenia','Afghanistan':'Afganistán','Ecuador':'Ecuador','Ghana':'Ghana','Philippines':'Filipinas','Cameroon':'Camerún','Montenegro':'Montenegro','North Macedonia':'Macedonia del Norte',"Côte d'Ivoire":'Costa de Marfil','Albania':'Albania','Lebanon':'Líbano','Taiwan':'Taiwán','Senegal':'Senegal','Hong Kong':'Hong Kong','Ethiopia':'Etiopía','Vietnam':'Vietnam','Costa Rica':'Costa Rica','Moldova':'Moldavia','Malaysia':'Malasia','Democratic Republic of the Congo':'Rep. Dem. del Congo','Bolivia':'Bolivia','Luxembourg':'Luxemburgo','Dominican Republic':'Rep. Dominicana','Mongolia':'Mongolia','Haiti':'Haití','Puerto Rico':'Puerto Rico','Honduras':'Honduras','Cyprus':'Chipre','Czech Republic':'Chequia','Myanmar (Burma)':'Myanmar','Palestine':'Palestina','Kosovo':'Kosovo','Macao':'Macao','Singapore':'Singapur','Qatar':'Catar','Kuwait':'Kuwait','Oman':'Omán','Jordan':'Jordania','United Arab Emirates':'Emiratos Árabes Unidos','Bahrain':'Baréin','Yemen':'Yemen','Libya':'Libia','Sudan':'Sudán','South Sudan':'Sudán del Sur','Tanzania':'Tanzania','Uganda':'Uganda','Zimbabwe':'Zimbabue','Zambia':'Zambia','Angola':'Angola','Mozambique':'Mozambique','Madagascar':'Madagascar','Mali':'Malí','Guinea':'Guinea','Rwanda':'Ruanda','Somalia':'Somalia','Benin':'Benín','Burkina Faso':'Burkina Faso','Niger':'Níger','Chad':'Chad','Mauritania':'Mauritania','Namibia':'Namibia','Botswana':'Botsuana','Gabon':'Gabón','Liberia':'Liberia','Sierra Leone':'Sierra Leona','Togo':'Togo','Malawi':'Malaui','Burundi':'Burundi','Eritrea':'Eritrea','Djibouti':'Yibuti','Lesotho':'Lesoto','Eswatini':'Esuatini','Swaziland':'Esuatini','Mauritius':'Mauricio','Comoros':'Comoras','Cabo Verde':'Cabo Verde','Seychelles':'Seychelles','Equatorial Guinea':'Guinea Ecuatorial','Guinea-Bissau':'Guinea-Bisáu','Central African Republic':'Rep. Centroafricana','Republic of the Congo':'Rep. del Congo','São Tomé and Príncipe':'Santo Tomé y Príncipe','Gambia, The':'Gambia','The Gambia':'Gambia','Bahamas, The':'Bahamas','The Bahamas':'Bahamas','Nepal':'Nepal','Bangladesh':'Bangladés','Sri Lanka':'Sri Lanka','Bhutan':'Bután','Maldives':'Maldivas','Cambodia':'Camboya','Laos':'Laos','Myanmar':'Myanmar','Brunei':'Brunéi','Timor-Leste':'Timor Oriental','Mongolia ':'Mongolia','Tajikistan':'Tayikistán','Turkmenistan':'Turkmenistán','Kyrgyzstan':'Kirguistán','El Salvador':'El Salvador','Guatemala':'Guatemala','Nicaragua':'Nicaragua','Panama':'Panamá','Belize':'Belice','Guyana':'Guyana','Suriname':'Surinam','Trinidad and Tobago':'Trinidad y Tobago','Barbados':'Barbados','Grenada':'Granada','Dominica':'Dominica','Saint Lucia':'Santa Lucía','Saint Kitts and Nevis':'San Cristóbal y Nieves','Saint Vincent and the Grenadines':'San Vicente y las Granadinas','Antigua and Barbuda':'Antigua y Barbuda','Andorra':'Andorra','Monaco':'Mónaco','San Marino':'San Marino','Liechtenstein':'Liechtenstein','Malta':'Malta','Vatican City':'Ciudad del Vaticano','Greenland':'Groenlandia','Faroe Islands':'Islas Feroe','Gibraltar':'Gibraltar','Isle of Man':'Isla de Man','Jersey':'Jersey','Guernsey':'Guernsey','Åland Islands':'Islas Åland','Fiji':'Fiyi','Papua New Guinea':'Papúa Nueva Guinea','Samoa':'Samoa','Tonga':'Tonga','Vanuatu':'Vanuatu','Solomon Islands':'Islas Salomón','Kiribati':'Kiribati','Nauru':'Nauru','Tuvalu':'Tuvalu','Palau':'Palaos','Marshall Islands':'Islas Marshall','Micronesia':'Micronesia','Federated States of Micronesia':'Micronesia','New Caledonia':'Nueva Caledonia','French Polynesia':'Polinesia Francesa','French Guiana':'Guayana Francesa','Guadeloupe':'Guadalupe','Martinique':'Martinica','Réunion':'Reunión','Mayotte':'Mayotte','Curaçao':'Curazao','Aruba':'Aruba','Bermuda':'Bermudas','Cayman Islands':'Islas Caimán','British Virgin Islands':'Islas Vírgenes Británicas','U.S. Virgin Islands':'Islas Vírgenes de EE.UU.','Puerto Rico ':'Puerto Rico','American Samoa':'Samoa Americana','Guam':'Guam','Northern Mariana Islands':'Islas Marianas del Norte','Cook Islands':'Islas Cook','Niue':'Niue','Norfolk Island':'Isla Norfolk','Falkland Islands (Islas Malvinas)':'Islas Malvinas','Anguilla':'Anguila','Antarctica':'Antártida'})
def cty_lbl(c): return CES.get(c,str(c))
d['ctyN']=d.bplace_country.where(d.bplace_country.notna(),None)
_N1=open(r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js',encoding='utf-8').read()
_s=_N1[_N1.index('['):]; _dd=0
for _i,_ch in enumerate(_s):
    if _ch=='[':_dd+=1
    elif _ch==']':
        _dd-=1
        if _dd==0: _end=_i+1; break
iso2region={x['iso3']:x['region'] for x in json.loads(_s[:_end])}
ROV={'PRI':'Latin America','CUB':'Latin America','TWN':'East Asia','HKG':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa','PRK':'East Asia','VEN':'Latin America','GUF':'Latin America','MMR':'Southeast Asia','YEM':'Middle East & North Africa','COD':'Sub-Saharan Africa','ERI':'Sub-Saharan Africa','MCO':'Western Europe','XKX':'Eastern Europe & Central Asia','GRL':'Western Europe','BMU':'Caribbean','GLP':'Caribbean','MTQ':'Caribbean'}
OV={'United States':'USA','United Kingdom':'GBR','Russia':'RUS','South Korea':'KOR','North Korea':'PRK','Iran':'IRN','Syria':'SYR','Vietnam':'VNM','Czechia':'CZE','Turkey':'TUR','Bolivia':'BOL','Venezuela':'VEN','DR Congo':'COD','Taiwan':'TWN','Hong Kong':'HKG','Myanmar':'MMR','Myanmar (Burma)':'MMR','Democratic Republic of the Congo':'COD','Yemen':'YEM','Kosovo':'XKX','Palestine':'PSE','Laos':'LAO','Bahamas, The':'BHS','The Bahamas':'BHS','Swaziland':'SWZ','Eswatini':'SWZ','Falkland Islands (Islas Malvinas)':'FLK','U.S. Virgin Islands':'VIR'}
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
# La decision editorial (junio 2026) le gana a la taxonomia del N°1: Puerto Rico
# cuenta como America Latina y Guayana Francesa como Caribe, igual que en
# export_dataset.py y en el mapa. Sin esto el lab contradice al resto del numero.
FORCE_REG={'PRI':'Latin America','GUF':'Caribbean'}
_ES2REG={v:k for k,v in REG_ES.items()}
def reg_of(c):
    if c in _REC:                      # pais recuperado: la region ya viene resuelta
        return reg_i.get(_ES2REG.get(_REC[c],''),-1)
    i=n2iso(c)
    if not i: return -1
    return reg_i.get(FORCE_REG.get(i) or iso2region.get(i) or ROV.get(i),-1)
# Un pais, un codigo. Pantheon nombra al mismo pais de dos formas ('Czechia' y
# 'Czech Republic', 'Eswatini' y 'Swaziland', 'Bahamas, The' y 'The Bahamas') y el
# desplegable los mostraba repetidos. Se agrupa por ISO3 y los rotulos salen del
# isoMeta de data-percap-map.js, el mismo que usan el mapa y el ranking.
_IM={}
try:
    _pm=io.open(os.path.join(OUTDIR,'data-percap-map.js'),encoding='utf-8').read()
    _pm=_pm[_pm.index('{'):].rstrip().rstrip(';').rstrip()
    _IM={r['iso']:(r['es'],r['en']) for r in json.loads(_pm)['isoMeta']}
except Exception as _e:
    print('sin isoMeta de percap-map (%s): rotulos locales'%_e)

_grupo={}
for _c in sorted([x for x in d.ctyN.dropna().unique()]):
    _iso=n2iso(_c); _k=_iso or ('~'+_c)
    if _k not in _grupo:
        _es,_en=_IM.get(_iso,(cty_lbl(_c),_c))
        _grupo[_k]={'iso':_iso,'es':_es,'en':_en,'src':[_c]}
    else:
        _grupo[_k]['src'].append(_c)
_dup=[(g['es'],g['src']) for g in _grupo.values() if len(g['src'])>1]
if _dup: print('paises unificados:',_dup)
_kk=sorted(_grupo,key=lambda k:_grupo[k]['es'])
ctys=[{'iso':_grupo[k]['iso'],'es':_grupo[k]['es'],'en':_grupo[k]['en']} for k in _kk]
cty_idx={}
for _i,_k in enumerate(_kk):
    for _src in _grupo[_k]['src']: cty_idx[_src]=_i
ctyReg=[reg_of(_grupo[k]['src'][0]) for k in _kk]

figs=[]
for _,x in d.iterrows():
    figs.append([str(x['name']), occ_idx[x.occupation], int(x.birthyear), (cty_idx[x.ctyN] if x.ctyN in cty_idx else -1),
                 int(x.n_langs), int(x.langs1k), int(x.langs10k), int(x.total12_noen), int(x.total_all_noen),
                 int(x.medianMonthly_noen), float(x.pctMonths_o100k), float(x.pctMonths_o300k), int(x.multi)])
DOMS_EN=['Sports','Arts & entertainment','Science & tech','Humanities','Power & public life','Business & exploration']
out={'occs':[{'es':occ_es(o),'en':occ_en(o)} for o in occs],'occDom':[dom_idx[o2d[o]] for o in occs],
     'doms':[{'es':_a,'en':_b} for _a,_b in zip(DOMS,DOMS_EN)],
     'ctys':ctys,'ctyReg':ctyReg,'regs':REG,'refYear':2025,
     'cols':['name','occIdx','birthyear','ctyIdx','n_langs','langs1k','langs10k','total12','total_all','median','pctM100','pctM300','multi'],'figs':figs}
OUT=OUTDIR
open(os.path.join(OUT,'data-fame-lab.js'),'w',encoding='utf-8').write('// Lab de fama reconstruida (Pantheon API /pageviews). figs cols: name,occ,by,cty,n_langs,langs1k,langs10k,total12,total_all,median,pctM100,pctM300\nwindow.FAMELAB='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
import os
print('data-fame-lab.js:',len(figs),'figuras |',round(os.path.getsize(os.path.join(OUT,'data-fame-lab.js'))/1e6,2),'MB | occs',len(occs),'| paises',len(ctys))
