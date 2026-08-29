# -*- coding: utf-8 -*-
# Re-baja SOLO las figuras del borde (langs1k<=1) para contar idiomas a cortes mas blandos.
# Salida fame_border.csv: id,name,wp_id + counts de idiomas a 6 umbrales (12m y desde-2015).
import pandas as pd, urllib.request, ssl, sys, time, threading, os, csv, json
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8')
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
UA={'User-Agent':'ElAtlas-research/1.0 (dschteingart@gmail.com)'}
B='https://api.pantheon.world'
CUT12='2025-06-01'
OUTF='fame_border.csv'

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

src=pd.read_csv('fame_pantheon.csv',on_bad_lines='skip')
src=src[(src.n_langs>=0)&(src.langs1k<=1)][['id','name','wp_id']].dropna(subset=['wp_id'])
src['wp_id']=src['wp_id'].astype(int)
recs=list(src.itertuples(index=False))
done=set()
if os.path.exists(OUTF):
    try:
        for r in csv.DictReader(open(OUTF,encoding='utf-8')): done.add(int(r['wp_id']))
    except Exception: pass
todo=[r for r in recs if r.wp_id not in done]
print('borde total %d, hechos %d, faltan %d'%(len(recs),len(done),len(todo)),flush=True)
if os.path.exists('fame_border.done'): os.remove('fame_border.done')

lock=threading.Lock(); cnt=[0]
new=not os.path.exists(OUTF)
fout=open(OUTF,'a',newline='',encoding='utf-8'); w=csv.writer(fout)
if new: w.writerow(['id','name','wp_id','l100_yr','l500_yr','l1k_yr','l100_all','l1k_all','l10k_all'])

def work(r):
  try:
    rows=fetch_all(r.wp_id)
    yr={}; al={}
    for x in rows:
        lg=x.get('lang')
        if not lg or lg=='abstract' or lg=='en': continue
        v=x.get('views') or 0; dt=x.get('date') or ''
        al[lg]=al.get(lg,0)+v
        if dt>=CUT12: yr[lg]=yr.get(lg,0)+v
    row=[r.id,r.name,r.wp_id,
         sum(1 for v in yr.values() if v>=100), sum(1 for v in yr.values() if v>=500), sum(1 for v in yr.values() if v>=1000),
         sum(1 for v in al.values() if v>=100), sum(1 for v in al.values() if v>=1000), sum(1 for v in al.values() if v>=10000)]
    with lock:
        w.writerow(row); fout.flush(); cnt[0]+=1
        if cnt[0]%1000==0: print('  %d/%d'%(cnt[0],len(todo)),flush=True)
  except Exception as e:
    with lock:
        try: w.writerow([r.id,r.name,r.wp_id,-1,0,0,0,0,0]); fout.flush(); cnt[0]+=1
        except Exception: pass
        print('  ERR %s'%r.wp_id,flush=True)

with ThreadPoolExecutor(max_workers=8) as ex:
    for f in as_completed([ex.submit(work,r) for r in todo]):
        try: f.result()
        except Exception: pass
fout.close()
open('fame_border.done','w',encoding='utf-8').write('done %d at %s'%(cnt[0],time.strftime('%Y-%m-%d %H:%M:%S')))
print('LISTO. filas nuevas:',cnt[0],flush=True)
