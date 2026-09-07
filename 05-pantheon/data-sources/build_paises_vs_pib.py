# -*- coding: utf-8 -*-
"""paises_vs_pib.csv — el cruce del explorador (chart 5) materializado para Excel.

Por pais x dominio (mas la fila 'Todos'), nacidos 1850-2010, misma logica que el
chart: poblacion = promedio del periodo (OWID, interpolado); PIB pc = promedio de
Maddison en el anio de nacimiento de cada figura del pais (ponderado por figuras,
con el anio disponible mas cercano si falta el exacto).
"""
import io, os, json, sys, warnings
import numpy as np
import pandas as pd
warnings.filterwarnings('ignore'); sys.stdout.reconfigure(encoding='utf-8')

DIR = os.path.dirname(os.path.abspath(__file__))
CHARTS = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-pantheon'
Y0, Y1 = 1850, 2010

M = pd.read_csv(os.path.join(DIR, 'master_corregido.csv'), low_memory=False)[['id', 'iso3', 'birthyear']]
C = pd.read_csv(os.path.join(DIR, 'pantheon_corregido.csv'), low_memory=False)[['id', 'dominio']]
d = M.merge(C, on='id', how='left')
d = d[d.iso3.notna() & d.birthyear.notna() & d.dominio.notna()]
d = d[(d.birthyear >= Y0) & (d.birthyear <= Y1)].copy()
d['birthyear'] = d.birthyear.astype(int)
print('figuras en el periodo %d-%d: %d' % (Y0, Y1, len(d)))

# --- poblacion promedio del periodo (OWID, interpolacion lineal por anio) ---
POP = pd.read_csv(os.path.join(DIR, 'pop3', 'population.csv'))
def pop_promedio(code):
    g = POP[(POP.Code == code) & (POP.Year >= Y0 - 10) & (POP.Year <= Y1 + 10)].sort_values('Year')
    if len(g) < 2: return None
    anios = np.arange(Y0, Y1 + 1)
    vals = np.interp(anios, g.Year.values, g.Population.values)
    return float(vals.mean())

# --- Maddison: pib pc por (pais, anio), con el anio mas cercano si falta ---
G = pd.read_csv(os.path.join(DIR, 'gdp-per-capita-maddison-project-database.csv'))
G = G[G.Code.notna()][['Code', 'Year', 'GDP per capita']].dropna()
gdp_by = {c: g.set_index('Year')['GDP per capita'].sort_index() for c, g in G.groupby('Code')}
def gdp_en(code, anio):
    s = gdp_by.get(code)
    if s is None or not len(s): return None
    idx = s.index.values
    return float(s.iloc[int(np.argmin(np.abs(idx - anio)))])

# --- nombres y region desde el isoMeta del mapa (fuente unica) ---
s = io.open(os.path.join(CHARTS, 'data-percap-map.js'), encoding='utf-8').read()
PC = json.loads(s.split('window.PCMAP=', 1)[1].rstrip().rstrip(';'))
meta = {m['iso']: m for m in PC['isoMeta']}
REG_ES = {'Latin America': 'América Latina', 'Caribbean': 'Caribe',
          'North America, Australia & New Zealand': 'Norteamérica/Aus/NZ',
          'Western Europe': 'Europa Occidental', 'Eastern Europe & Central Asia': 'Europa del Este/Asia Central',
          'East Asia': 'Asia Oriental', 'Southeast Asia': 'Sudeste Asiático', 'South Asia': 'Asia del Sur',
          'Middle East & North Africa': 'Medio Oriente/N. África', 'Sub-Saharan Africa': 'África Subsahariana'}

filas = []
for iso, g in d.groupby('iso3'):
    popm = pop_promedio(iso)
    if popm is None or popm <= 0: continue
    m = meta.get(iso, {})
    reg = REG_ES.get(m.get('reg'), m.get('reg') or '')
    grupos = [('Todos', g)] + [(dom, gd) for dom, gd in g.groupby('dominio')]
    for dom, gd in grupos:
        gdps = [gdp_en(iso, a) for a in gd.birthyear]
        gdps = [x for x in gdps if x is not None]
        filas.append({'iso3': iso, 'pais_es': m.get('es', iso), 'pais_en': m.get('en', iso),
                      'region': reg, 'dominio': dom, 'periodo': '%d-%d' % (Y0, Y1),
                      'n_figuras': len(gd),
                      'poblacion_promedio': round(popm),
                      'figuras_por_millon': round(len(gd) / (popm / 1e6), 3),
                      'pib_pc_ponderado': round(float(np.mean(gdps))) if gdps else ''})

out = pd.DataFrame(filas).sort_values(['dominio', 'figuras_por_millon'], ascending=[True, False])
p = os.path.join(DIR, 'paises_vs_pib.csv')
out.to_csv(p, index=False, encoding='utf-8-sig')
print('=> paises_vs_pib.csv | %d filas (%d paises x dominios) | %.0f KB'
      % (len(out), out.iso3.nunique(), os.path.getsize(p) / 1024))
chk = out[(out.dominio == 'Ciencia y tecnología') & (out.iso3.isin(['ARG', 'USA', 'CHE']))]
print(chk[['iso3', 'n_figuras', 'figuras_por_millon', 'pib_pc_ponderado']].to_string(index=False))
