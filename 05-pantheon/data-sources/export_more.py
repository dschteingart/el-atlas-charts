# -*- coding: utf-8 -*-
"""Genera data para 3 charts nuevos del N°4: fama-oficio, migración, subnacional."""
import pandas as pd, numpy as np, json, pycountry, warnings, corregido
warnings.filterwarnings('ignore')
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
RAW = corregido.aplicar(pd.read_csv('person_2025_update.csv', low_memory=False), etiqueta='RAW')
PE  = pd.read_csv('master_corregido.csv')   # metodologia corregida; ver corregido.py
ADM1= pd.read_csv('talento_ALL_abs_adm1_corregido.csv')   # agregado subnacional con el gate aplicado; ver build_subnac_corregido.py
N1  = open(r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js',encoding='utf-8').read()
s=N1[N1.index('['):]; d=0
for i,ch in enumerate(s):
    if ch=='[':d+=1
    elif ch==']':
        d-=1
        if d==0: end=i+1;break
ARR=json.loads(s[:end])
iso2region={x['iso3']:x['region'] for x in ARR}
iso2es={x['iso3']:(x.get('country_es') or x.get('country')) for x in ARR}
iso2en={x['iso3']:x.get('country') for x in ARR}
ROV={'PRI':'Latin America','CUB':'Latin America','TWN':'East Asia','HKG':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa'}
NMOV={'PRI':('Puerto Rico','Puerto Rico'),'CUB':('Cuba','Cuba'),'TWN':('Taiwán','Taiwan'),'HKG':('Hong Kong','Hong Kong'),'MMR':('Birmania','Myanmar'),'COD':('R.D. del Congo','DR Congo'),'KOR':('Corea del Sur','South Korea'),'GBR':('Reino Unido','UK'),'USA':('EE.UU.','USA'),'CZE':('Chequia','Czechia'),'BIH':('Bosnia','Bosnia'),'ARE':('Emiratos','UAE')}
def region_of(i): return iso2region.get(i) or ROV.get(i)
def names(i):
    if i in NMOV: return NMOV[i]
    return (iso2es.get(i) or i, iso2en.get(i) or i)
LAT=set('ARG BOL BRA CHL COL CRI CUB DOM ECU SLV GTM HTI HND MEX NIC PAN PRY PER URY VEN PRI'.split())

OV={'United States':'USA','United Kingdom':'GBR','Russia':'RUS','South Korea':'KOR','North Korea':'PRK','Iran':'IRN','Syria':'SYR','Vietnam':'VNM','Czechia':'CZE','Türkiye':'TUR','Turkiye':'TUR','Bolivia':'BOL','Venezuela':'VEN','Tanzania':'TZA','Moldova':'MDA','North Macedonia':'MKD','DR Congo':'COD','Congo':'COG','Ivory Coast':'CIV',"Cote d'Ivoire":'CIV','Eswatini':'SWZ','Cape Verde':'CPV','Brunei':'BRN','Palestine':'PSE','Kosovo':'XKX','Taiwan':'TWN','Hong Kong':'HKG','Macao':'MAC','Myanmar':'MMR','Burma':'MMR','Myanmar (Burma)':'MMR','Micronesia':'FSM','Saint Lucia':'LCA','Trinidad and Tobago':'TTO','East Timor':'TLS','Gambia':'GMB','The Gambia':'GMB','Bahamas':'BHS','The Bahamas':'BHS','Bahamas, The':'BHS','U.S. Virgin Islands':'VIR','Laos':'LAO'}
_c={}
def iso3(n):
    if not isinstance(n,str) or not n.strip(): return None
    if n in _c: return _c[n]
    if n in OV: _c[n]=OV[n]; return OV[n]
    try: r=pycountry.countries.lookup(n);_c[n]=r.alpha_3;return r.alpha_3
    except:
        try: r=pycountry.countries.search_fuzzy(n)[0];_c[n]=r.alpha_3;return r.alpha_3
        except: _c[n]=None;return None

# ===== CHART 6: FAMA CAMBIÓ DE OFICIO (composición por década) =====
DOMORD=['Poder y figuras públicas','Ciencia y tecnología','Humanidades','Artes y espectáculo','Deportes']
DOM_LBL={'Poder y figuras públicas':('Poder','Power'),'Ciencia y tecnología':('Ciencia y tecnología','Science & tech'),'Humanidades':('Humanidades','Humanities'),'Artes y espectáculo':('Arte y espectáculo','Arts & media'),'Deportes':('Deporte','Sport'),'Negocios y exploración':('Negocios','Business')}
_DOM={'Deportes':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],'Artes y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],'Negocios y exploración':['BUSINESSPERSON','EXPLORER']}
_o2d={o:k for k,l in _DOM.items() for o in l}
PE['dominio']=PE.occupation.map(_o2d)
P6=PE[PE.birthyear.notna()&PE.dominio.notna()].copy(); P6['dec']=(P6.birthyear//10*10).astype(int)
P6=P6[(P6.dec>=1800)&(P6.dec<=2000)]
def series(df):
    t=df.groupby(['dec','dominio']).size().unstack().fillna(0)
    out={}
    for dec in t.index:
        out[int(dec)]=[int(t.loc[dec].get(dm,0)) for dm in DOMORD]
    return out
chart6={'decades':list(range(1800,2010,10)),
        'domains':[{'key':k,'es':DOM_LBL[k][0],'en':DOM_LBL[k][1]} for k in DOMORD],
        'world':series(P6),'latam':series(P6[P6.iso3.isin(LAT)])}
open(OUT+r'\data-fama-oficio.js','w',encoding='utf-8').write('// Chart 6 — composición del talento por década de nacimiento (conteo por dominio).\nwindow.FAMAOFICIO='+json.dumps(chart6,ensure_ascii=False,separators=(',',':'))+';\n')
print('chart6 ok — world 2000:',chart6['world'].get(2000))

# ===== CHART 7: MIGRACIÓN DE LA FAMA =====
RAW['ib']=RAW.bplace_country.map(iso3); RAW['idd']=RAW.dplace_country.map(iso3)
M=RAW[RAW.ib.notna()&RAW.idd.notna()&(RAW.birthyear>=1700)].copy(); M['emig']=M.ib!=M.idd
born=M.groupby('ib').size(); emig=M[M.emig].groupby('ib').size(); died=M.groupby('idd').size()
mig=pd.DataFrame({'born':born,'emig':emig,'died':died}).fillna(0)
mig=mig[mig.born>=25]
rows7=[]
for iso,r in mig.iterrows():
    if not region_of(iso): continue
    es,en=names(iso)
    rows7.append({'iso':iso,'es':es,'en':en,'region':region_of(iso),'born':int(r.born),'died':int(r.died),
                  'emig':int(r.emig),'emig_rate':round(r.emig/r.born*100,1),'net':int(r.died-r.born)})
# destino top de cada país emigrado (para tooltip)
dest={}
for iso in mig.index:
    sub=M[(M.ib==iso)&M.emig]
    if len(sub): dest[iso]=sub.idd.value_counts().index[0]
for r in rows7: r['topDest']=names(dest[r['iso']])[0] if r['iso'] in dest else None
chart7={'rows':rows7}
open(OUT+r'\data-migracion.js','w',encoding='utf-8').write('// Chart 7 — migración de la fama: nacidos vs fallecidos por país. net=died-born (+imán/-desagüe).\nwindow.MIGRACION='+json.dumps(chart7,ensure_ascii=False,separators=(',',':'))+';\n')
print('chart7 ok —',len(rows7),'países')

# ===== CHART 8: SUBNACIONAL (capital del talento) =====
A=ADM1.copy()
rows8=[]
for iso,g in A.groupby('iso3'):
    if not region_of(iso): continue
    tot=g.valor.sum();
    if tot<50: continue
    top=g.loc[g.valor.idxmax()]
    es,en=names(iso)
    rows8.append({'iso':iso,'es':es,'en':en,'region':region_of(iso),'total':int(tot),'nreg':int(len(g)),
                  'topShare':round(top.valor/tot*100,1),'topName':str(top.territorio),'topPop':int(top.poblacion) if pd.notna(top.poblacion) else None})
chart8={'rows':rows8}
open(OUT+r'\data-subnacional.js','w',encoding='utf-8').write('// Chart 8 — concentración subnacional del talento. topShare=% en la región líder; nreg=cant. de regiones.\nwindow.SUBNAC='+json.dumps(chart8,ensure_ascii=False,separators=(',',':'))+';\n')
print('chart8 ok —',len(rows8),'países')
