"""Arma data/socio.js: indicadores sociales por municipio para la placa "Quién votó a quién".

Fuentes (bajadas a data/raw/socio/, ver data/raw/socio_sources.md):
  - Familias con Auxílio Brasil (hoy Bolsa Família) en octubre de 2022, cada 100 hogares del Censo 2022
    (Portal da Transparência; hogares: IBGE, Censo 2022, tabla 4712)
  - Ingreso mensual por persona del hogar, mediana (IBGE, Censo 2022, tabla 10295)
  - % de población blanca (IBGE, Censo 2022, tabla 9605)
  - % de evangélicos, población de 10 años y más (IBGE, Censo 2022, tabla 9537)
  - % con universitario completo, población de 25 años y más (IBGE, Censo 2022, tabla 10061); no va en la
    placa "Quién votó a quién", solo como factor en "Dónde se mueve el voto" y en analisis_vivo.py

Uso: python scripts/armar_socio.py
"""
import json, os
import pandas as pd

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = os.path.join(RAIZ, 'data', 'raw', 'socio')


def lee(f, col):
    d = pd.read_csv(os.path.join(S, f), dtype={'ibge': str})
    return d.set_index('ibge')[col]


cols = [
    lee('bolsa_familia_portal_transparencia.csv', 'familias_por_100domic_out2022').round(1),
    lee('censo2022_rendimento_domiciliar_pc.csv', 'rdpc_mediano_reais').round(0),
    lee('censo2022_cor_raca.csv', 'pct_branca').round(1),
    lee('censo2022_religiao.csv', 'pct_evangelica').round(1),
    lee('censo2022_nivel_instrucao_25mais.csv', 'pct_superior_completo_25mais').round(1),
]
D = pd.concat(cols, axis=1)
mun = {}
for ib, r in D.iterrows():
    v = [None if pd.isna(x) else (int(x) if i == 1 else float(x)) for i, x in enumerate(r.values)]
    if any(x is not None for x in v):
        mun[ib] = v
out = {
    'orden': ['bf', 'ingreso', 'raza', 'religion', 'univ'],
    'mun': mun,
}
js = ('// Generado por scripts/armar_socio.py — no editar a mano.\n'
      '// mun[ibge] = [familias con Auxílio Brasil cada 100 hogares (oct-2022), ingreso mensual por persona del hogar '
      '(mediana, R$, Censo 2022), % blancos (Censo 2022), % evangélicos (Censo 2022), % universitarios 25+ (Censo 2022)]\n'
      f"window.SOCIO = {json.dumps(out, ensure_ascii=False, separators=(',', ':'))};\n")
open(os.path.join(RAIZ, 'data', 'socio.js'), 'w', encoding='utf-8').write(js)
print(len(mun), 'municipios ·', len(js) // 1024, 'KB')
