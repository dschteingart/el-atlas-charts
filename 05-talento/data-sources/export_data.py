# -*- coding: utf-8 -*-
"""Genera los 4 data-*.js para 05-talento. Corre desde _talento_work."""
import pandas as pd, numpy as np, json, warnings
warnings.filterwarnings('ignore')
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-talento'

P = pd.read_csv('master_corregido.csv')   # metodologia corregida (gate multi-idioma + score reconstruido); ver corregido.py
M = pd.read_csv('gdp-per-capita-maddison-project-database.csv')
POP = pd.read_csv('talento_ALL_abs_adm1_all.csv')

DOM = {
 'Deportes':['SOCCER PLAYER','ATHLETE','BASKETBALL PLAYER','CYCLIST','TENNIS PLAYER','SWIMMER','WRESTLER','RACING DRIVER','SKIER','HOCKEY PLAYER','BOXER','GYMNAST','HANDBALL PLAYER','SKATER','COACH','CHESS PLAYER','FENCER','VOLLEYBALL PLAYER','BADMINTON PLAYER','MARTIAL ARTS','REFEREE','RUGBY PLAYER','CRICKETER','TABLE TENNIS PLAYER','BASEBALL PLAYER','GOLFER','SNOOKER','AMERICAN FOOTBALL PLAYER','MOUNTAINEER','POKER PLAYER','BULLFIGHTER','GO PLAYER'],
 'Artes y espectáculo':['ACTOR','SINGER','MUSICIAN','FILM DIRECTOR','PAINTER','COMPOSER','MODEL','COMIC ARTIST','PORNOGRAPHIC ACTOR','PRESENTER','PHOTOGRAPHER','PRODUCER','CONDUCTOR','ARTIST','DANCER','DESIGNER','COMEDIAN','FASHION DESIGNER','SCULPTOR','CHEF','MAGICIAN','CELEBRITY','YOUTUBER','GAME DESIGNER'],
 'Ciencia y tecnología':['BIOLOGIST','PHYSICIST','MATHEMATICIAN','ASTRONOMER','CHEMIST','ASTRONAUT','INVENTOR','ENGINEER','COMPUTER SCIENTIST','PHYSICIAN','GEOLOGIST','STATISTICIAN'],
 'Humanidades':['WRITER','PHILOSOPHER','HISTORIAN','ECONOMIST','PSYCHOLOGIST','LINGUIST','ARCHAEOLOGIST','ANTHROPOLOGIST','GEOGRAPHER','SOCIOLOGIST','POLITICAL SCIENTIST','CRITIC'],
 'Poder y figuras públicas':['POLITICIAN','RELIGIOUS FIGURE','MILITARY PERSONNEL','NOBLEMAN','SOCIAL ACTIVIST','COMPANION','EXTREMIST','JOURNALIST','DIPLOMAT','MAFIOSO','PILOT','JUDGE','PUBLIC WORKER','PIRATE','LAWYER','OCCULTIST','INSPIRATION'],
 'Negocios y exploración':['BUSINESSPERSON','EXPLORER'],
}
occ2dom={o:d for d,l in DOM.items() for o in l}
P['dominio']=P.occupation.map(occ2dom).fillna('Otros')

LATAM=['ARG','BOL','BRA','CHL','COL','CRI','CUB','DOM','ECU','SLV','GTM','HTI','HND','MEX','NIC','PAN','PRY','PER','URY','VEN','PRI']
NM={'ARG':('Argentina','Argentina'),'BOL':('Bolivia','Bolivia'),'BRA':('Brasil','Brazil'),'CHL':('Chile','Chile'),'COL':('Colombia','Colombia'),'CRI':('Costa Rica','Costa Rica'),'CUB':('Cuba','Cuba'),'DOM':('Rep. Dominicana','Dominican Rep.'),'ECU':('Ecuador','Ecuador'),'SLV':('El Salvador','El Salvador'),'GTM':('Guatemala','Guatemala'),'HTI':('Haití','Haiti'),'HND':('Honduras','Honduras'),'MEX':('México','Mexico'),'NIC':('Nicaragua','Nicaragua'),'PAN':('Panamá','Panama'),'PRY':('Paraguay','Paraguay'),'PER':('Perú','Peru'),'URY':('Uruguay','Uruguay'),'VEN':('Venezuela','Venezuela'),'PRI':('Puerto Rico','Puerto Rico')}
P['latam']=P.iso3.isin(LATAM)

pop=POP.groupby('iso3').poblacion.sum()
gdp_now=M.sort_values('Year').groupby('Code').apply(lambda g: g.dropna(subset=['GDP per capita']).tail(10)['GDP per capita'].mean())

# shares de referencia
latam_pop=pop.reindex(LATAM).sum(); world_pop=pop.sum()
gdp_tot=(gdp_now*pop).dropna()
latam_gdp=(gdp_now.reindex(LATAM)*pop.reindex(LATAM)).dropna().sum(); world_gdp=gdp_tot.sum()
POP_SHARE=round(latam_pop/world_pop*100,1); GDP_SHARE=round(latam_gdp/world_gdp*100,1)
print('pop_share',POP_SHARE,'gdp_share',GDP_SHARE)

def jsdump(varname, obj, header=''):
    s=f"// {header}\nwindow.{varname}=" + json.dumps(obj,ensure_ascii=False) + ";\n"
    return s

# ============ CHART 1: ABANICO (share LatAm por disciplina) ============
# disciplinas curadas: deportes individuales + dominios no-deportivos como bloques + algunas ocupaciones clave
DISC = [
 # (key, es, en, group, kind, occ_or_domain)
 ('volley','Vóley','Volleyball','Deportes','occ','VOLLEYBALL PLAYER'),
 ('soccer','Fútbol','Football','Deportes','occ','SOCCER PLAYER'),
 ('boxing','Boxeo','Boxing','Deportes','occ','BOXER'),
 ('baseball','Béisbol','Baseball','Deportes','occ','BASEBALL PLAYER'),
 ('wrestling','Lucha','Wrestling','Deportes','occ','WRESTLER'),
 ('racing','Automovilismo','Motor racing','Deportes','occ','RACING DRIVER'),
 ('tennis','Tenis','Tennis','Deportes','occ','TENNIS PLAYER'),
 ('athletics','Atletismo','Athletics','Deportes','occ','ATHLETE'),
 ('cycling','Ciclismo','Cycling','Deportes','occ','CYCLIST'),
 ('music','Música','Music','Artes y espectáculo','occ',['SINGER','MUSICIAN','COMPOSER','CONDUCTOR']),
 ('acting','Cine y actuación','Acting & film','Artes y espectáculo','occ',['ACTOR','FILM DIRECTOR']),
 ('visualart','Artes visuales','Visual arts','Artes y espectáculo','occ',['PAINTER','SCULPTOR','PHOTOGRAPHER']),
 ('literature','Literatura','Literature','Humanidades','occ','WRITER'),
 ('politics','Política','Politics','Poder y figuras públicas','occ','POLITICIAN'),
 ('socialsci','Ciencias sociales','Social sciences','Humanidades','occ',['ECONOMIST','HISTORIAN','PHILOSOPHER','PSYCHOLOGIST','SOCIOLOGIST','POLITICAL SCIENTIST','ANTHROPOLOGIST']),
 ('lifesci','Ciencias de la vida y salud','Life & health sci.','Ciencia y tecnología','occ',['BIOLOGIST','PHYSICIAN','CHEMIST']),
 ('exactsci','Ciencias exactas','Physics & math','Ciencia y tecnología','occ',['PHYSICIST','MATHEMATICIAN','ASTRONOMER']),
 ('engtech','Ingeniería y tecnología','Engineering & tech','Ciencia y tecnología','occ',['ENGINEER','INVENTOR','COMPUTER SCIENTIST']),
]
def share_for(spec):
    if isinstance(spec,list): m=P.occupation.isin(spec)
    else: m=P.occupation==spec
    sub=P[m]; nworld=len(sub); nlat=int(sub.latam.sum())
    sh=round(nlat/nworld*100,1) if nworld else 0
    # hpi share
    hw=sub.hpi.sum(); hl=sub[sub.latam].hpi.sum()
    shh=round(hl/hw*100,1) if hw else 0
    return nworld,nlat,sh,shh
abanico=[]
for key,es,en,grp,kind,spec in DISC:
    nworld,nlat,sh,shh=share_for(spec)
    abanico.append({'key':key,'es':es,'en':en,'group':grp,'share':sh,'share_hpi':shh,'n_world':nworld,'n_latam':nlat})
abanico.sort(key=lambda d:-d['share'])
chart1={'pop_share':POP_SHARE,'gdp_share':GDP_SHARE,'disciplines':abanico}
open(OUT+r'\data-abanico.js','w',encoding='utf-8').write(jsdump('ABANICO',chart1,'Chart 1 — Abanico de especialización. share = % del talento mundial de la disciplina que es latinoamericano. Ref: pop_share / gdp_share de LatAm.'))
print('\\n== ABANICO ==')
for d in abanico: print(f"  {d['share']:5.1f}%  {d['es']:26s} ({d['group'][:8]}) n={d['n_world']}")

# ============ CHART 2: HUELLA (country x discipline lift) ============
world_occ=P.occupation.value_counts(normalize=True)
# columnas: disciplinas occ-level con señal
COLS=[('soccer','Fútbol','Football','SOCCER PLAYER'),('baseball','Béisbol','Baseball','BASEBALL PLAYER'),
 ('boxing','Boxeo','Boxing','BOXER'),('volley','Vóley','Volleyball','VOLLEYBALL PLAYER'),
 ('wrestling','Lucha','Wrestling','WRESTLER'),('cycling','Ciclismo','Cycling','CYCLIST'),
 ('tennis','Tenis','Tennis','TENNIS PLAYER'),('racing','Automovilismo','Racing','RACING DRIVER'),
 ('athletics','Atletismo','Athletics','ATHLETE'),
 ('acting','Actuación','Acting','ACTOR'),('music','Música','Music','SINGER'),
 ('celebrity','Celebrities','Celebrities','CELEBRITY'),
 ('literature','Literatura','Literature','WRITER'),('politics','Política','Politics','POLITICIAN'),
 ('religion','Religión','Religion','RELIGIOUS FIGURE')]
rows=[]
for iso in LATAM:
    sub=P[P.iso3==iso]
    if len(sub)<30: continue
    s=sub.occupation.value_counts(normalize=True)
    cells={}
    for ck,es,en,occ in COLS:
        cs=s.get(occ,0); lift=round(cs/world_occ[occ],1) if world_occ.get(occ,0)>0 else 0
        ncell=int((sub.occupation==occ).sum())
        cells[ck]={'lift':lift,'n':ncell,'pct':round(cs*100,1)}
    # top specialty (lift, con n>=3)
    liftall=(s/world_occ).dropna()
    liftall=liftall[[ (sub.occupation==o).sum()>=3 for o in liftall.index]]
    top=liftall.sort_values(ascending=False).head(3)
    topspec=[{'occ':o,'lift':round(v,1),'n':int((sub.occupation==o).sum())} for o,v in top.items()]
    rows.append({'iso':iso,'es':NM[iso][0],'en':NM[iso][1],'n':len(sub),'cells':cells,'top':topspec})
rows.sort(key=lambda r:-r['n'])
chart2={'cols':[{'key':c[0],'es':c[1],'en':c[2]} for c in COLS],'rows':rows}
open(OUT+r'\data-huella.js','w',encoding='utf-8').write(jsdump('HUELLA',chart2,'Chart 2 — Huella: lift (share país / share mundo) por país x disciplina. n = figuras del país en esa disciplina.'))
print('\\n== HUELLA (top specialty por país) ==')
for r in rows: print(f"  {r['es']:16s} n={r['n']:4d}  top: "+', '.join(f"{t['occ'].title()} x{t['lift']}" for t in r['top']))

# ============ CHART 3: CIENCIA (scatter GDP vs ciencia per millón + dumbbell deporte/ciencia) ============
def per_million_resid(dom):
    sub=P[P.dominio==dom]; c=sub.groupby('iso3').size()
    df=pd.DataFrame({'n':c}).join(pop.rename('pop')).join(gdp_now.rename('gdp')).dropna()
    df=df[df['pop']>3e5]; df['pm']=df.n/df['pop']*1e6
    d=df[(df.pm>0)&(df.gdp>0)].copy()
    x=np.log(d.gdp); y=np.log(d.pm); w=np.log(d['pop']); b1,b0=np.polyfit(x,y,1,w=w)
    d['resid']=y-(b0+b1*x); return d,(b0,b1)
sci,coef_sci=per_million_resid('Ciencia y tecnología')
points=[]
for iso,r in sci.iterrows():
    nm=NM.get(iso,(iso,iso))
    points.append({'iso':iso,'es':nm[0] if iso in NM else iso,'gdp':round(r.gdp),'pm':round(r.pm,2),'n':int(r.n),'latam':iso in LATAM})
# dumbbell: residuo deportes vs ciencia por país LatAm
dep,_=per_million_resid('Deportes')
dumb=[]
for iso in LATAM:
    if iso in dep.index and iso in sci.index:
        dumb.append({'iso':iso,'es':NM[iso][0],'en':NM[iso][1],'sport':round(dep.loc[iso,'resid'],2),'sci':round(sci.loc[iso,'resid'],2)})
dumb.sort(key=lambda d:-(d['sport']-d['sci']))
chart3={'fit':{'b0':round(coef_sci[0],4),'b1':round(coef_sci[1],4)},'points':points,'dumbbell':dumb,
        'latam_sci_share':round(P[P.dominio=='Ciencia y tecnología'].latam.mean()*100,1)}
open(OUT+r'\data-ciencia.js','w',encoding='utf-8').write(jsdump('CIENCIA',chart3,'Chart 3 — Ciencia: scatter PIBpc vs figuras científicas por millón (fit log-log ponderado por log-pop); dumbbell residuo Deportes vs Ciencia por país.'))
print('\\n== CIENCIA dumbbell (sport resid vs sci resid) ==')
for d in dumb: print(f"  {d['es']:16s} deporte {d['sport']:+.2f}  ciencia {d['sci']:+.2f}  gap {d['sport']-d['sci']:+.2f}")

# ============ CHART 4: GÉNERO ============
P['fem']=(P.gender=='F')
gen=[]
GORD=[('Artes y espectáculo','Artes y espectáculo','Arts & entertainment'),('Humanidades','Humanidades','Humanities'),
 ('Ciencia y tecnología','Ciencia y tecnología','Science & tech'),('Deportes','Deportes','Sports'),
 ('Poder y figuras públicas','Poder y figuras públicas','Power & public life')]
for dk,es,en in GORD:
    s=P[P.dominio==dk]; sl=s[s.latam]
    gen.append({'key':dk,'es':es,'en':en,'latam_fem':round(sl.fem.mean()*100,1),'world_fem':round(s.fem.mean()*100,1),
                'n_latam':int(len(sl)),'n_world':int(len(s))})
chart4={'domains':gen,'latam_fem_all':round(P[P.latam].fem.mean()*100,1),'world_fem_all':round(P.fem.mean()*100,1)}
open(OUT+r'\data-genero.js','w',encoding='utf-8').write(jsdump('GENERO',chart4,'Chart 4 — Género: % mujeres por dominio, LatAm vs mundo.'))
print('\\n== GENERO ==')
for g in gen: print(f"  {g['es']:26s} LatAm {g['latam_fem']:4.1f}%  mundo {g['world_fem']:4.1f}%")
print('\\nDONE — 4 data files escritos en', OUT)
