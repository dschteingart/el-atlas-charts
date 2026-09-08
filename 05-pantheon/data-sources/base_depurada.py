# -*- coding: utf-8 -*-
"""base_depurada.csv — la base del N°5 ya filtrada, con todas las variables que
forman el HPI reconstruido. Es el CSV para mirar/compartir; el pipeline usa
master_corregido.csv (mismas filas, menos columnas).

Corre despues de export_dataset.py.
"""
import os, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')
DIR = os.path.dirname(os.path.abspath(__file__))
C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)

d = C[(C.multi_idioma == 1) & C.score.notna()].copy()
# nombre en espanol (Wikidata), ya bajado para toda la base
try:
    N = pd.read_csv(os.path.join(DIR, 'nombres_es.csv'), encoding='utf-8-sig')[['id', 'name_es']]
    d = d.merge(N, on='id', how='left')
    d['name_es'] = d.name_es.fillna('')
    # labels de Wikidata traen desambiguadores "(1496-1533)", "(futbolista...)"
    # o basura "(bachi)": se quita el parentesis final (el nombre nunca vive ahi)
    _sin = d.name_es.str.replace(r'\s*\([^)]*\)\s*$', '', regex=True).str.strip()
    d['name_es'] = _sin.where(_sin != '', d.name_es)
    # overrides manuales (vandalismo): ganan siempre
    _ov = pd.read_csv(os.path.join(DIR, 'nombres_overrides.csv'), encoding='utf-8-sig').set_index('id').name_es
    d['name_es'] = d.id.map(_ov).fillna(d.name_es)
except FileNotFoundError:
    d['name_es'] = ''
d = d.sort_values('rank_score')
d['rank_depurado'] = range(1, len(d) + 1)

COLS = ['rank_depurado', 'rank_score', 'score', 'name', 'name_es', 'occupation', 'dominio', 'pais', 'region', 'birthyear',
        'Lenguas', 'Vistas', 'EdadMult',
        'n_langs', 'idiomas_10k_anio', 'idiomas_1k_anio', 'idiomas_1k_desde2015',
        'vistas_12m_noen', 'vistas_total_noen', 'mediana_mensual_noen', 'pct_meses_100k', 'pct_meses_300k',
        'hpi_archivo', 'id']
d = d[COLS].rename(columns={'rank_score': 'rank_global_con_excluidos'})
out = os.path.join(DIR, 'base_depurada.csv')
d.to_csv(out, index=False, encoding='utf-8-sig', float_format='%.4f')
print('=> base_depurada.csv | %d figuras | %.1f MB' % (len(d), os.path.getsize(out) / 1e6))

print("""
DICCIONARIO
  rank_depurado   puesto dentro de esta base (1 = Aristoteles)
  rank_global...  puesto contando tambien a los excluidos por el gate
  score           0-100. = geom(Lenguas, Vistas) x EdadMult, reescalado

  -- los tres factores del score --
  Lenguas         media de n_langs y idiomas_10k_anio, ambos log1p y normalizados 0-1
  Vistas          media geometrica de las tres columnas de vistas, log1p y normalizadas 0-1
  EdadMult        multiplicador de antiguedad 0,5-1: log4(edad) menos penalidad si es
                  mas joven que T=40 anios

  -- insumos crudos de Lenguas --
  n_langs                 en cuantas Wikipedias tiene articulo
  idiomas_10k_anio        idiomas con >=10.000 vistas en los ultimos 12 meses
  idiomas_1k_anio         idiomas con >=1.000 vistas en los ultimos 12 meses
  idiomas_1k_desde2015    idiomas con >=1.000 vistas acumuladas desde 2015. Solo
                          esta cargado en las figuras del borde (se rebajo solo a
                          esas); es la columna con la que se decide el gate

  -- insumos crudos de Vistas (todos EXCLUYEN la Wikipedia en ingles) --
  vistas_12m_noen         vistas en los ultimos 12 meses
  vistas_total_noen       vistas acumuladas de toda la serie
  mediana_mensual_noen    mediana mensual (castiga los picos de un solo mes)
  pct_meses_100k / 300k   % de meses que supero ese umbral. No entran al score;
                          quedan para diagnostico

  hpi_archivo     el HPI que publica Pantheon. NO se usa; esta para comparar
""")
