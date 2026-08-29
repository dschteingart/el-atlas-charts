# -*- coding: utf-8 -*-
# Reconstruye métricas de fama desde la API PostgREST de Pantheon (/pageviews por idioma y mes).
# 1 query por persona (paginada). Top 5000 por vistas. Concurrente + incremental/resumible.
import pandas as pd, urllib.request, ssl, sys, time, threading, os, csv, json
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8')
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
UA={'User-Agent':'ElAtlas-research/1.0 (dschteingart@gmail.com)'}
B='https://api.pantheon.world'
CUT12='2025-06-01'   # últimos 12 meses para el conteo de idiomas
OUTF='fame_pantheon.csv'

def get(u,tries=4):
    for a in range(tries):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),context=ctx,timeout=60))
        except Exception: time.sleep(1.5+a*2)
    return None

def fetch_all(wp):
    rows=[]; off=0
    while True:
        d=get(B+'/pageviews?wp_id=eq.%d&select=lang,date,views&limit=25000&offset=%d'%(wp,off))
        if not d: break
        rows+=d
        if len(d)<25000: break
        off+=25000
        if off>200000: break
    return rows

df=pd.read_csv('person_2025_update.csv',low_memory=False).drop_duplicates('id')  # dedup por ID, no nombre (los homónimos como los 3 "Luis Suárez" son personas distintas)
top=df.sort_values('non_en_page_views',ascending=False)[['id','name','wp_id']].dropna(subset=['wp_id'])  # TODA la base, por vistas desc
top['wp_id']=top['wp_id'].astype(int)
recs=list(top.itertuples(index=False))
done=set()
if os.path.exists(OUTF):
    try:
        for r in csv.DictReader(open(OUTF,encoding='utf-8')): done.add(int(r['wp_id']))
    except Exception: pass
todo=[r for r in recs if r.wp_id not in done]
print('total %d, hechos %d, faltan %d'%(len(recs),len(done),len(todo)),flush=True)
if os.path.exists('fame_pull.done'): os.remove('fame_pull.done')   # no estamos terminados si arrancamos

lock=threading.Lock(); cnt=[0]
new=not os.path.exists(OUTF)
fout=open(OUTF,'a',newline='',encoding='utf-8'); w=csv.writer(fout)
if new: w.writerow(['id','name','wp_id','n_langs','langs1k','langs10k','total12_noen','total_all_noen','medianMonthly_noen','pctMonths_o100k','pctMonths_o300k','nMonths'])

def work(r):
  try:
    rows=fetch_all(r.wp_id)
    lt12={}; mon={}; tall=0; langs=set()
    for x in rows:
        lg=x.get('lang');
        if not lg or lg=='abstract' or lg=='en': continue
        v=x.get('views') or 0; dt=x.get('date') or ''
        langs.add(lg); tall+=v; mon[dt]=mon.get(dt,0)+v
        if dt>=CUT12: lt12[lg]=lt12.get(lg,0)+v
    ms=sorted(mon.values()); nM=len(ms)
    med=ms[nM//2] if nM else 0
    p100=round(sum(1 for v in ms if v>100000)/nM*100,1) if nM else 0
    p300=round(sum(1 for v in ms if v>300000)/nM*100,1) if nM else 0
    row=[r.id,r.name,r.wp_id,len(langs),
         sum(1 for v in lt12.values() if v>=1000), sum(1 for v in lt12.values() if v>=10000),
         sum(lt12.values()), tall, med, p100, p300, nM]
    with lock:
        w.writerow(row); fout.flush(); cnt[0]+=1
        if cnt[0]%1000==0: print('  %d/%d'%(cnt[0],len(todo)),flush=True)
  except Exception as e:
    with lock:
        try: w.writerow([r.id,r.name,r.wp_id,-1,0,0,0,0,0,0,0,0]); fout.flush(); cnt[0]+=1
        except Exception: pass
        print('  ERR %s: %r'%(r.wp_id,repr(e)[:70]),flush=True)

with ThreadPoolExecutor(max_workers=8) as ex:
    for f in as_completed([ex.submit(work,r) for r in todo]):
        try: f.result()
        except Exception: pass
fout.close()
open('fame_pull.done','w',encoding='utf-8').write('done %d at %s'%(cnt[0],time.strftime('%Y-%m-%d %H:%M:%S')))
print('LISTO. filas nuevas:',cnt[0],flush=True)
