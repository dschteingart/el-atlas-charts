# -*- coding: utf-8 -*-
# Merge del borde + veredicto del gate "≥2 idiomas con ≥1000 vistas desde 2015".
import pandas as pd, numpy as np, sys, warnings
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
F=pd.read_csv('fame_pantheon.csv',on_bad_lines='skip'); F=F[F.n_langs>=0].copy()
B=pd.read_csv('fame_border.csv',on_bad_lines='skip')
PE=pd.read_csv('person_2025_update.csv',low_memory=False)[['id','occupation','birthyear','bplace_country','hpi']].drop_duplicates('id')
d=F.merge(PE,on='id',how='left').merge(B[['id','l100_yr','l500_yr','l1k_yr','l100_all','l1k_all','l10k_all']],on='id',how='left')
N=len(d)
LATAM={'Argentina','Brazil','Mexico','Chile','Colombia','Peru','Uruguay','Cuba','Venezuela','Bolivia','Ecuador','Paraguay','Guatemala','Honduras','El Salvador','Nicaragua','Costa Rica','Panama','Dominican Republic','Puerto Rico','Haiti'}
d['latam']=d.bplace_country.isin(LATAM)
d['border']=d.l1k_all.notna()
# GATE: >=2 idiomas con >=1000 vistas acumuladas desde 2015. No-borde (langs1k>=2) pasan por monotonia.
d['gate']=np.where(d.border, d.l1k_all>=2, d.langs1k>=2)
excl=~d.gate

print('====== VEREDICTO: gate "≥2 idiomas con ≥1000 vistas desde 2015" ======')
print('Base: %d figuras'%N)
print('ENTRAN: %d (%.1f%%) | AFUERA: %d (%.1f%%) | LatAm afuera: %d de %d'%(
    d.gate.sum(),d.gate.sum()/N*100,excl.sum(),excl.sum()/N*100,(excl&d.latam).sum(),d.latam.sum()))
print('vs gate crudo (≥2 idiomas ≥1000/AÑO): habria sacado %d -> el nuevo RESCATA %d que el crudo tiraba'%(
    (d.langs1k<=1).sum(),((d.langs1k<=1)&d.gate).sum()))
bd=d[d.border]
print('Del borde (%d): RESCATADAS %d | quedan AFUERA %d'%(len(bd),(bd.l1k_all>=2).sum(),(bd.l1k_all<=1).sum()))

print('\n--- VALIDACION: ¿entran los iconos mono-idioma? ¿salen los scrubs? ---')
chk=['Diomedes Díaz','Zhong Nanshan','Jerry Fodor','Parvin E\'tesami','Savva Mamontov','Edward Victor Appleton','Edwin McMillan','Edgar Adrian','Kenji Honnami','Koichi Nakazato','Takashi Maeda','Hiroki Okui','Lionel Messi','Luis Suárez']
for n in chk:
    x=d[d.name==n]
    if len(x):
        x=x.sort_values('total_all_noen',ascending=False).iloc[0]
        la=x.l1k_all if pd.notna(x.l1k_all) else '(no-borde, pasa)'
        print('  %-26s l1k_desde2015=%-16s -> %s'%(n[:26],str(int(x.l1k_all)) if pd.notna(x.l1k_all) else 'paso directo',('ENTRA' if x.gate else 'AFUERA')))

print('\n--- AFUERA: los 15 mas vistos (deberian ser todos marginales) ---')
for _,x in d[excl].sort_values('total_all_noen',ascending=False).head(15).iterrows():
    print('  %-28s %-7s %-12s total=%-9s l1k_15=%s hpi=%s'%(str(x['name'])[:28],str(x.occupation)[:7],str(x.bplace_country)[:12],format(int(x.total_all_noen),','),int(x.l1k_all) if pd.notna(x.l1k_all) else '?',('%.0f'%x.hpi) if pd.notna(x.hpi) else 'NA'))

print('\n--- AFUERA por DOMINIO (ocupacion top) ---')
print(d[excl].occupation.value_counts().head(12).to_string())
print('\n--- AFUERA por PAIS (top) ---')
print(d[excl].bplace_country.value_counts().head(12).to_string())

print('\n--- FUTBOLISTAS por pais: cuantos quedan tras el gate ---')
for c in ['Japan','Brazil','Argentina','Uruguay']:
    sub=d[(d.occupation=='SOCCER PLAYER')&(d.bplace_country==c)]
    print('  %-10s %5d -> %5d entran (%.0f%% afuera)'%(c,len(sub),sub.gate.sum(),(~sub.gate).sum()/len(sub)*100 if len(sub) else 0))

# exportar la columna gate para el lab
d['multi_lang']=d.gate.astype(int)
d[['id','name','l1k_all','l100_yr','multi_lang']].to_csv('gate_result.csv',index=False,encoding='utf-8-sig')
print('\n=> gate_result.csv exportado')
