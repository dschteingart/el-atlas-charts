"""Junta los CSV de data/raw/ en data/series.js (lo que leen las placas).
Uso: python scripts/armar_series.py"""
import json, os
import pandas as pd

R = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'series.js')
rd = lambda f: pd.read_csv(os.path.join(R, f))
S = {}

# 1) PIB
g = rd('gdp_growth.csv')
S['pib'] = {
    'obs': [{'a': int(r.year), 'v': float(r.value_pct)} for r in g[g.type == 'observed'].itertuples()],
    'parcial': {'v': float(g[(g.year == 2026) & (g.type == 'partial')].value_pct.iloc[0]), 'lbl': '1er semestre 2026 vs 1er sem. 2025'},
}
pj = rd('gdp_2026_projections.csv')
S['pib']['proy'] = [{'fuente': r.source, 'fecha': str(r.publication_date), 'v': float(r.value_pct)} for r in pj.itertuples()]
S['pib']['focus'] = float(g[(g.year == 2026) & (g.type == 'projection')].value_pct.iloc[0])

# 8) Consumo de los hogares
c = rd('consumption.csv')
S['consumo'] = {
    'obs': [{'a': int(r.year), 'v': float(r.growth_pct), 'idx': float(r.index_2010_100)} for r in c[c.type == 'observed'].itertuples()],
    'parcial': float(c[(c.year == 2026) & (c.type == 'partial')].growth_pct.iloc[0]),
    'proy': float(c[(c.year == 2026) & (c.type == 'projection')].growth_pct.iloc[0]),
}

# 9) Fiscal
f = rd('fiscal.csv')
S['fiscal'] = [{'a': int(r.year), 'prim': float(r.primary_pct_gdp), 'nom': float(r.nominal_pct_gdp),
                'int': float(r.interest_pct_gdp), 'p': r.type != 'observed', 'lbl': str(r.period_label)} for r in f.itertuples()]

# 2) Desempleo: trimestre móvel mensual + anual oficial
mq = rd('unemployment_moving_quarter.csv')
def t_mq(code):
    y, m = divmod(int(code), 100)
    return round(y + (m - 1.5) / 12, 4)
S['desempleo'] = {
    'mq': [{'t': t_mq(r.period_code), 'v': float(r.rate_pct), 'lbl': r.period_label} for r in mq.itertuples()],
    'anual': [{'a': int(r.year), 'v': float(r.rate_pct)} for r in rd('unemployment_annual.csv').query("type=='observed'").itertuples()],
}

# 3) Composición del empleo (posición en la ocupación) y por sector
comp = rd('employment_composition_annual.csv')
GRUPOS = [
    ('Asalariado privado formal', [31722]),
    ('Asalariado privado informal', [31723]),
    ('Sector público', [31727]),
    ('Trabajo doméstico', [31724]),
    ('Cuenta propia', [96171]),
    ('Empleadores y aux. familiares', [96170, 31731]),
]
def apilar(df, grupos, col_cod, total_cod):
    out = []
    for y, d in df.groupby('year'):
        tot = float(d[d[col_cod] == total_cod].thousands.iloc[0])
        vals = [round(100 * float(d[d[col_cod].isin(cods)].thousands.sum()) / tot, 2) for _, cods in grupos]
        lbl = d.period_label.iloc[0]
        t = y + 0.54 if 'jun-jul-ago' in lbl else y + 0.5
        out.append({'a': int(y), 't': t, 'vals': vals, 'tot': tot, 'lbl': lbl.replace(' (annual)', '')})
    return out
S['composicion'] = {'claves': [g[0] for g in GRUPOS], 'datos': apilar(comp, GRUPOS, 'category_code', 96165)}
sec = rd('employment_by_sector_annual.csv')
SECT = [
    ('Agropecuaria', [47947]),
    ('Industria', [47948]),
    ('Construcción', [47949]),
    ('Servicios (incluye comercio)', [47950, 56624, 60032, 56622, 56623, 56627, 56628]),
]
DETALLE_SERV = [
    ('Comercio', [47950]),
    ('Serv. empresariales y financieros', [56624]),
    ('Adm. pública, educación y salud', [60032]),
    ('Transporte', [56622]),
    ('Alojamiento y comida', [56623]),
    ('Servicio doméstico', [56628]),
    ('Otros servicios', [56627]),
]
S['sectores'] = {'claves': [g[0] for g in SECT], 'datos': apilar(sec, SECT, 'sector_code', 47946),
                 'detalle_claves': [g[0] for g in DETALLE_SERV],
                 'detalle': [o['vals'] for o in apilar(sec, DETALLE_SERV, 'sector_code', 47946)]}
inf = rd('informality_annual.csv')
S['informalidad'] = [{'a': int(r.year), 'v': float(r.rate_pct), 'lbl': r.period_label} for r in inf.dropna(subset=['rate_pct']).itertuples()
                     if r.variant in ('ibge_annual_estimate', 'latest_moving_quarter')]

# 4) Pobreza (SIS 2025, líneas US$6,85 y US$2,15 PPA 2017)
p = rd('poverty.csv')
p = p[p.source_rank == 1]
S['pobreza'] = [{'a': int(r.year), 'pob': float(r.poverty_pct), 'ext': float(r.extreme_poverty_pct)} for r in p.itertuples()]

# 5) Ingreso real del trabajo
ri = rd('real_income_annual.csv')
S['ingreso'] = {
    'anual': [{'a': int(r.year), 'v': float(r.income_brl)} for r in ri[ri.type == 'observed'].itertuples()],
    'ult': {'v': float(ri[ri.variant == 'latest_moving_quarter'].income_brl.iloc[0]), 'lbl': 'jun–ago 2026', 'prev': 3535},
}

# 6) Gini
gi = rd('gini.csv')
S['gini'] = [{'a': int(r.year), 'v': float(r.gini_ibge)} for r in gi.dropna(subset=['gini_ibge']).itertuples()]

# 7) Homicidios y 10) comercio con Argentina (si ya están)
if os.path.exists(os.path.join(R, 'homicides.csv')):
    h = rd('homicides.csv')
    S['homicidios'] = [{'a': int(r.year),
                        'sim': None if pd.isna(r.rate_sim_atlas) else float(r.rate_sim_atlas),
                        'mvi': None if pd.isna(r.rate_mvi_fbsp) else float(r.rate_mvi_fbsp)} for r in h.itertuples()]
if os.path.exists(os.path.join(R, 'trade_argentina.csv')):
    t = rd('trade_argentina.csv')
    fila = lambda r: {'a': int(r.year), 'lbl': str(r.period_label), 'p': r.type != 'full',
                      'exp': float(r.exp_to_arg_usd) / 1e9, 'imp': float(r.imp_from_arg_usd) / 1e9,
                      'sh_tot': float(r.share_total_pct), 'sh_exp': float(r.share_exp_pct), 'sh_imp': float(r.share_imp_pct),
                      'rank': None if pd.isna(r.arg_rank_total) else int(r.arg_rank_total)}
    S['comercio'] = [fila(r) for r in t.itertuples() if r.type == 'full']
    # 2026 = últimos 12 meses con dato: año 2025 − ene–ago 2025 + ene–ago 2026
    a25 = t[(t.year == 2025) & (t.type == 'full')].iloc[0]
    p25 = t[(t.year == 2025) & (t.type != 'full')].iloc[0]
    p26 = t[(t.year == 2026) & (t.type != 'full')].iloc[0]
    doce = {c: float(a25[c]) - float(p25[c]) + float(p26[c]) for c in
            ['exp_to_arg_usd', 'imp_from_arg_usd', 'br_total_exp_usd', 'br_total_imp_usd']}
    S['comercio'].append({
        'a': 2026, 'lbl': '12 meses a agosto de 2026', 'p': True,
        'exp': doce['exp_to_arg_usd'] / 1e9, 'imp': doce['imp_from_arg_usd'] / 1e9,
        'sh_tot': round(100 * (doce['exp_to_arg_usd'] + doce['imp_from_arg_usd']) / (doce['br_total_exp_usd'] + doce['br_total_imp_usd']), 2),
        'sh_exp': round(100 * doce['exp_to_arg_usd'] / doce['br_total_exp_usd'], 2),
        'sh_imp': round(100 * doce['imp_from_arg_usd'] / doce['br_total_imp_usd'], 2), 'rank': None,
    })

open(OUT, 'w', encoding='utf-8').write(
    '// Generado por scripts/armar_series.py desde data/raw/*.csv — no editar a mano.\n'
    'window.SERIES = ' + json.dumps(S, ensure_ascii=False, indent=1) + ';\n')
print('ok', list(S))
