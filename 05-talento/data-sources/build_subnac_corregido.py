# -*- coding: utf-8 -*-
"""Agregado subnacional (chart 8) recalculado con la metodologia corregida.

El chart 8 se alimentaba de ../talento_ALL_abs_adm1_all.csv, un agregado ya
cocinado por el pipeline subnacional del N°3 (GADM nivel-1). Ese archivo no
tiene ids, asi que no se le podia aplicar el gate multi-idioma ni el score nuevo.
Este script lo reconstruye desde el assignment persona->unidad, que si los tiene.

  entrada: insumos/#3 - Futbol/talento/out/pantheon_admin1.csv  (id, adm1_uid, ...)
           insumos/#3 - Futbol/talento/out/admin1_meta.csv      (uid -> nombre, poblacion)
  salida : talento_ALL_abs_adm1_corregido.csv  (misma forma que el original)
"""
import os, sys, warnings
import pandas as pd
import corregido
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

TAL = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#3 - Futbol\talento\out'
ASSIGN = os.path.join(TAL, 'pantheon_admin1.csv')
META = os.path.join(TAL, 'admin1_meta.csv')
PAISES = os.path.join(TAL, 'talento_por_admin1.csv')
ORIG = r'C:\Users\FUNDAR\Downloads\talento_ALL_abs_adm1_all.csv'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'talento_ALL_abs_adm1_corregido.csv')

A = pd.read_csv(ASSIGN, low_memory=False, usecols=['id', 'adm1_uid', 'adm1_iso3'])
A = A[A.adm1_uid.notna()].copy()
print('assignment: %d figuras con unidad subnacional' % len(A))
A = corregido.aplicar(A, etiqueta='subnacional')
A['adm1_uid'] = A.adm1_uid.astype(int)

M = pd.read_csv(META).rename(columns={'uid': 'adm1_uid', 'name': 'territorio', 'pop_2025': 'poblacion'})
P = pd.read_csv(PAISES, usecols=['uid', 'pais_es']).rename(columns={'uid': 'adm1_uid'}).drop_duplicates('adm1_uid')

g = A.groupby('adm1_uid').size().rename('valor').reset_index()
out = (g.merge(M[['adm1_uid', 'territorio', 'iso3', 'poblacion']], on='adm1_uid', how='left')
        .merge(P, on='adm1_uid', how='left'))
faltan = out.territorio.isna().sum()
if faltan: print('  aviso: %d unidades sin nombre en el meta (se descartan)' % faltan)
out = out[out.territorio.notna() & out.iso3.notna()].copy()
out['pais'] = out.pais_es
out['categoria'] = 'Todo el talento'; out['metrica'] = 'abs'; out['hpi'] = 'all'
out = out[['territorio', 'pais', 'iso3', 'poblacion', 'categoria', 'metrica', 'hpi', 'valor']]
out = out.sort_values(['iso3', 'territorio'])
out.to_csv(OUT, index=False, encoding='utf-8-sig')
print('=> %s | %d unidades | %d paises | %d figuras' % (os.path.basename(OUT), len(out), out.iso3.nunique(), int(out.valor.sum())))

O = pd.read_csv(ORIG)
print('\ncomparacion con el agregado viejo:')
print('  unidades: %d -> %d | figuras: %d -> %d (%.1f%%)'
      % (len(O), len(out), int(O.valor.sum()), int(out.valor.sum()), out.valor.sum() / O.valor.sum() * 100))
cmp = (O.groupby('iso3').valor.sum().rename('viejo')
        .to_frame().join(out.groupby('iso3').valor.sum().rename('nuevo'), how='outer').fillna(0))
cmp['dif%'] = (cmp.nuevo / cmp.viejo.where(cmp.viejo > 0) - 1) * 100
print('\n  paises que mas pierden con el gate (n viejo >= 200):')
print(cmp[cmp.viejo >= 200].nsmallest(8, 'dif%').round(1).to_string())
