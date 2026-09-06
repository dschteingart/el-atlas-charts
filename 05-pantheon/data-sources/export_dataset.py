# -*- coding: utf-8 -*-
# Dataset Pantheon corregido (126.582, dedup por id) + marca del gate multi-idioma + score reconstruido con los knobs actuales.
import pandas as pd, numpy as np, json, os, sys, warnings
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

# === KNOBS PUBLICADOS ===
# T = umbral de edad: por debajo de T anios desde el nacimiento la figura se
# penaliza por reciente. Mueve mucho a los vivos (Messi #141 con T=40, #384 con
# T=50, #1231 con T=70) y casi nada a los agregados por pais/region.
T=40.0; PISO=0.5; wA=1.0; wRec=1.0; GEOM=True; REF=2025

F=pd.read_csv('fame_pantheon.csv',on_bad_lines='skip'); F=F[F.n_langs>=0].copy()
PE=pd.read_csv('person_2025_update.csv',low_memory=False)[['id','occupation','birthyear','bplace_country','l_','coefficient_of_variation','non_en_page_views','hpi']].drop_duplicates('id')
B=pd.read_csv('fame_border.csv',on_bad_lines='skip')[['id','l1k_yr','l100_yr','l1k_all','l10k_all']]
d=F.merge(PE,on='id',how='left').merge(B,on='id',how='left')
print('base corregida:',len(d),'| ids unicos:',d.id.nunique())

# === GATE multi-idioma: >=2 idiomas con >=1000 vistas desde 2015 ===
d['multi_idioma']=np.where(d.langs1k>=2, 1, np.where(d.l1k_all>=2, 1, 0))
falta=((d.langs1k<=1)&(d.l1k_all.isna())).sum()
print('multi=1:',int(d.multi_idioma.sum()),'| multi=0 (NO pasa):',int((d.multi_idioma==0).sum()),'| borde sin dato:',int(falta))

# === DOMINIO (taxonomia del N°4) ===
_DOM={'Deporte':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER','GAMER'],'Arte y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER','ARCHITECT'],'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],'Negocios y exploración':['BUSINESSPERSON','EXPLORER']}
o2d={o:k for k,l in _DOM.items() for o in l}
d['dominio']=d.occupation.map(o2d)

# === REGION (taxonomia N°1) ===
import pycountry as _pc
OV={'United States':'USA','United Kingdom':'GBR','Russia':'RUS','South Korea':'KOR','North Korea':'PRK','Iran':'IRN','Syria':'SYR','Vietnam':'VNM','Czechia':'CZE','Turkey':'TUR','Türkiye':'TUR','Bolivia':'BOL','Venezuela':'VEN','DR Congo':'COD','Taiwan':'TWN','Hong Kong':'HKG','Myanmar':'MMR','Myanmar (Burma)':'MMR','Democratic Republic of the Congo':'COD','Yemen':'YEM','Kosovo':'XKX','Palestine':'PSE','Laos':'LAO'}
_ci={}
def n2iso(n):
    if not isinstance(n,str): return None
    if n in OV: return OV[n]
    if n in _ci: return _ci[n]
    try: r=_pc.countries.lookup(n);_ci[n]=r.alpha_3;return r.alpha_3
    except:
        try: r=_pc.countries.search_fuzzy(n)[0];_ci[n]=r.alpha_3;return r.alpha_3
        except: _ci[n]=None;return None
_N1=open(r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\01-bienestar-violencia\data-scatter.js',encoding='utf-8').read()
_s=_N1[_N1.index('['):]; _dd=0
for _i,_ch in enumerate(_s):
    if _ch=='[':_dd+=1
    elif _ch==']':
        _dd-=1
        if _dd==0: _end=_i+1; break
iso2region={x['iso3']:x['region'] for x in json.loads(_s[:_end])}
ROV={'PRI':'Latin America','CUB':'Latin America','TWN':'East Asia','HKG':'East Asia','MAC':'East Asia','PSE':'Middle East & North Africa','PRK':'East Asia','VEN':'Latin America','GUF':'Latin America','MMR':'Southeast Asia','YEM':'Middle East & North Africa','COD':'Sub-Saharan Africa','ERI':'Sub-Saharan Africa','MCO':'Western Europe','XKX':'Eastern Europe & Central Asia','GRL':'Western Europe','BMU':'Caribbean','GLP':'Caribbean','MTQ':'Caribbean'}
REG_ES={'Latin America':'América Latina','Caribbean':'Caribe','North America, Australia & New Zealand':'Norteamérica/Aus/NZ','Western Europe':'Europa Occidental','Eastern Europe & Central Asia':'Europa del Este/Asia Central','East Asia':'Asia Oriental','Southeast Asia':'Sudeste Asiático','South Asia':'Asia del Sur','Middle East & North Africa':'Medio Oriente/N. África','Sub-Saharan Africa':'África Subsahariana'}
def reg_of(c):
    i=n2iso(c)
    if not i: return None
    r=iso2region.get(i) or ROV.get(i)
    return REG_ES.get(r) if r else None
d['region']=d.bplace_country.map(reg_of)

# === lugares de nacimiento recuperados (ver recuperar_lugar.py) ===
# Pantheon deja sin pais a figuras antiguas y biblicas (David, Salomon, Pedro...).
# recuperar_lugar.py los resuelve por coordenada o por Wikidata; aca se completan.
d['lugar_fuente']=None
if os.path.exists('lugares_recuperados.csv'):
    _rec=pd.read_csv('lugares_recuperados.csv')[['id','pais','region','fuente']]
    _rec=_rec[_rec.region.notna()].rename(columns={'pais':'_p','region':'_r','fuente':'_f'})
    d=d.merge(_rec,on='id',how='left')
    _fp=d.bplace_country.isna()&d._p.notna(); _fr=d.region.isna()&d._r.notna()
    d.loc[_fp,'bplace_country']=d.loc[_fp,'_p']; d.loc[_fr,'region']=d.loc[_fr,'_r']
    d.loc[_fp|_fr,'lugar_fuente']=d.loc[_fp|_fr,'_f']
    print('lugares recuperados: %d con pais, %d con region'%(int(_fp.sum()),int(_fr.sum())))
    d=d.drop(columns=['_p','_r','_f'])
    # guardia anti-duplicados: toda region debe estar en el canon de REG_ES.
    # (la primera version de recuperar_lugar.py escribia 'America Latina' sin tilde
    # y la base quedo con regiones duplicadas)
    _canon=set(REG_ES.values()); _mal=set(d.region.dropna().unique())-_canon
    assert not _mal, 'regiones fuera del canon: %r' % _mal
else:
    print('(sin lugares_recuperados.csv: no se completa nada)')

# === SCORE reconstruido con los knobs (replica exacta del compute() del lab) ===
# universo del score = igual que el lab: con ocupacion+birthyear+dominio mapeado
m=d.occupation.notna()&d.birthyear.notna()&d.dominio.notna()
sc=d[m].copy()
def norm(s): x=np.log1p(s.clip(lower=0)); return x/x.max()
nNL=norm(sc.n_langs); nL10=norm(sc.langs10k); nV12=norm(sc.total12_noen); nVA=norm(sc.total_all_noen); nMed=norm(sc.medianMonthly_noen)
# Lenguas: media ARITMETICA de sus dos terminos, siempre.
# El 58,9% de la base tiene 0 idiomas con >=10k vistas en el anio. Con media
# geometrica ese cero anulaba el score entero: mas de la mitad de las figuras
# quedaba pegada en ~0,3 y despues habia un acantilado a 42 (dos figuras casi
# identicas, una con 0 y otra con 1 idioma >=10k, diferian 100x). La aritmetica
# conserva el termino como senial de amplitud sin que funcione como interruptor.
# La media geometrica se mantiene donde no hay ceros: dentro de Vistas y entre
# Lenguas y Vistas.
sc['Lenguas']=(nNL+nL10)/2
if GEOM:
    sc['Vistas']=np.cbrt(np.maximum(nV12,1e-9)*np.maximum(nVA,1e-9)*np.maximum(nMed,1e-9))
    base=np.sqrt(np.maximum(sc.Lenguas,1e-9)*np.maximum(sc.Vistas,1e-9))
else:
    sc['Vistas']=(nV12+nVA+nMed)/3; base=(sc.Lenguas+sc.Vistas)/2
A=(REF-sc.birthyear).clip(lower=1)
ageRaw=wA*np.log(A)/np.log(4) - wRec*np.maximum(0,(T-A)/7)
amin,amax=ageRaw.min(),ageRaw.max()
sc['EdadMult']=PISO+(1-PISO)*(ageRaw-amin)/(amax-amin)
s=base*sc.EdadMult; sc['score']=s/s.max()*100
sc['rank_score']=sc.score.rank(ascending=False,method='min').astype(int)
d=d.merge(sc[['id','Lenguas','Vistas','EdadMult','score','rank_score']],on='id',how='left')

# === sanity check vs el lab (preset Publicado) ===
print('\nTOP 15 (debe coincidir con la pantalla):')
for _,x in d.sort_values('score',ascending=False).head(15).iterrows():
    print('  %2d. %-22s %-18s score=%.1f'%(x.rank_score,str(x['name'])[:22],str(x.dominio)[:18],x.score))
print('\ncentinelas:')
for n in ['Lionel Messi','Cristiano Ronaldo','Lamine Yamal','Albert Einstein','Aristotle','Frida Kahlo','Pelé','Donald Trump']:
    r=d[d.name==n].sort_values('score',ascending=False)
    if len(r): x=r.iloc[0]; print('  %-20s #%-6d score=%.1f  multi=%d'%(n,int(x.rank_score) if pd.notna(x.rank_score) else -1,x.score if pd.notna(x.score) else 0,x.multi_idioma))

# === exportar ===
def occ_es(o): return str(o)
out=d[['id','name','occupation','dominio','region','bplace_country','birthyear',
       'n_langs','langs1k','langs10k','l1k_all','total12_noen','total_all_noen','medianMonthly_noen','pctMonths_o100k','pctMonths_o300k',
       'multi_idioma','Lenguas','Vistas','EdadMult','score','rank_score','hpi','lugar_fuente']].copy()
out=out.rename(columns={'langs1k':'idiomas_1k_anio','langs10k':'idiomas_10k_anio','l1k_all':'idiomas_1k_desde2015',
    'total12_noen':'vistas_12m_noen','total_all_noen':'vistas_total_noen','medianMonthly_noen':'mediana_mensual_noen',
    'pctMonths_o100k':'pct_meses_100k','pctMonths_o300k':'pct_meses_300k','hpi':'hpi_archivo','bplace_country':'pais'})
out=out.sort_values('rank_score',na_position='last')
out.to_csv('pantheon_corregido.csv',index=False,encoding='utf-8-sig',float_format='%.4f')
# los knobs al lado del dataset, para no tener que adivinar despues con cuales se genero
json.dump({'T':T,'piso':PISO,'wA':wA,'wRec':wRec,'geometrica':GEOM,'anio_ref':REF,
           'gate':'>=2 idiomas con >=1000 vistas acumuladas desde 2015',
           'lenguas':'media aritmetica de n_langs e idiomas_10k_anio (log1p, normalizados)',
           'vistas':'media geometrica de vistas 12m, total y mediana mensual, todas sin ingles',
           'filas':len(out),'pasan_gate':int((out.multi_idioma==1).sum()),
           'con_score':int(out.score.notna().sum())},
          open('pantheon_corregido.params.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
import os
print('\n=> pantheon_corregido.csv | %d filas | %.1f MB'%(len(out),os.path.getsize('pantheon_corregido.csv')/1e6))
print('   no pasan el filtro (multi_idioma=0):',int((out.multi_idioma==0).sum()))
