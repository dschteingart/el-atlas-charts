"""Arma data/elecciones-2022.js (presidente, 1a y 2a vuelta 2022) desde los
datos abiertos del TSE.

Fuentes (cdn.tse.jus.br/estatistica/sead/odsele/):
  votacao_candidato_munzona/votacao_candidato_munzona_2022.zip  -> miembro _BR.csv
  detalhe_votacao_munzona/detalhe_votacao_munzona_2022.zip      -> miembro _BR.csv
Mapeo TSE -> IBGE: config del TSE 2026 (mun-e006257-cm.json, campo cdi).
Nombres de municipios: API de localidades del IBGE.

Uso: python scripts/procesar_2022.py <carpeta_con_los_csv_y_json>
"""
import json, sys, os
from collections import defaultdict
import pandas as pd

RAW = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'elecciones-2022.js')

NOMBRES = {  # nombre de pantalla por número de urna
    '13': 'Lula', '22': 'Jair Bolsonaro', '15': 'Simone Tebet', '12': 'Ciro Gomes',
    '44': 'Soraya Thronicke', '30': "Felipe d'Avila", '14': 'Padre Kelmon',
    '80': 'Léo Péricles', '21': 'Sofia Manzano', '16': 'Vera Lúcia', '27': 'Constituinte Eymael',
}

v = pd.read_csv(os.path.join(RAW, 'votacao_candidato_munzona_2022_BR.csv'), sep=';', encoding='latin1', dtype=str)
v = v[v.CD_CARGO == '1'].copy()
v['votos'] = v.QT_VOTOS_NOMINAIS_VALIDOS.astype(int)
d = pd.read_csv(os.path.join(RAW, 'detalhe_votacao_munzona_2022_BR.csv'), sep=';', encoding='latin1', dtype=str)
d = d[d.CD_CARGO == '1'].copy()
for c in ['QT_APTOS', 'QT_COMPARECIMENTO', 'QT_ABSTENCOES', 'QT_VOTOS_BRANCOS', 'QT_TOTAL_VOTOS_NULOS']:
    d[c] = d[c].astype(int)
# los códigos de municipio vienen con ceros adelante en una tabla ("09717") y sin ellos en la otra ("9717")
v['CD_MUNICIPIO'] = v['CD_MUNICIPIO'].str.zfill(5)
d['CD_MUNICIPIO'] = d['CD_MUNICIPIO'].str.zfill(5)

cm = json.load(open(os.path.join(RAW, 'ele2026_6257_config_mun-e006257-cm.json'), encoding='utf-8'))
tse2ibge = {mu['cd']: mu['cdi'] for a in cm['abr'] for mu in a['mu'] if mu['cdi']}
meta = json.load(open(os.path.join(RAW, 'mun_meta.json'), encoding='utf-8'))


def uf_of(m):
    r = m.get('microrregiao') or {}
    try:
        return r['mesorregiao']['UF']['sigla']
    except (KeyError, TypeError):
        return m['regiao-imediata']['regiao-intermediaria']['UF']['sigla']


nomes = {str(m['id']): [m['nome'], uf_of(m)] for m in meta}

out = {}
for turno in ['1', '2']:
    vt = v[v.NR_TURNO == turno]
    dt = d[d.NR_TURNO == turno]
    tot = vt.groupby('NR_CANDIDATO').votos.sum().sort_values(ascending=False)
    cands = list(tot.index)
    idx = {c: i for i, c in enumerate(cands)}

    def bloque(vg, dg):
        votos = [0] * len(cands)
        for c, n in vg.groupby('NR_CANDIDATO').votos.sum().items():
            votos[idx[c]] = int(n)
        return {
            'v': votos, 'val': int(sum(votos)),
            'bra': int(dg.QT_VOTOS_BRANCOS.sum()), 'nul': int(dg.QT_TOTAL_VOTOS_NULOS.sum()),
            'apt': int(dg.QT_APTOS.sum()), 'com': int(dg.QT_COMPARECIMENTO.sum()),
            'pct': 100,
        }

    nac = bloque(vt, dt)
    uf = {}
    for sg, g in vt.groupby('SG_UF'):
        uf[sg] = bloque(g, dt[dt.SG_UF == sg])
    mun = {}
    sin_mapa = []
    det = {cod: g for cod, g in dt.groupby('CD_MUNICIPIO')}
    for cod, g in vt.groupby('CD_MUNICIPIO'):
        sg = g.SG_UF.iloc[0]
        if sg == 'ZZ':
            continue
        ib = tse2ibge.get(cod)
        if not ib:
            sin_mapa.append(cod)
            continue
        b = bloque(g, det[cod])
        mun[ib] = [b['v'], b['val'], b['bra'] + b['nul'], b['apt'], b['com']]
    out[f'2022-{turno}'] = {
        'id': f'2022-{turno}', 'anio': 2022, 'turno': int(turno),
        'fecha': '2022-10-02' if turno == '1' else '2022-10-30',
        'fuente': 'TSE, datos abiertos (votacao_candidato_munzona y detalhe_votacao_munzona 2022).',
        'cands': [{'n': c, 'nm': NOMBRES.get(c, c),
                   'p': vt[vt.NR_CANDIDATO == c].SG_PARTIDO.iloc[0]} for c in cands],
        'nac': nac, 'uf': uf, 'mun': mun, 'final': True,
    }
    print(turno, 'muns', len(mun), 'sin mapa', sin_mapa,
          {NOMBRES.get(c, c): round(100 * nac['v'][idx[c]] / nac['val'], 2) for c in cands[:4]})

js = ('// Generado por scripts/procesar_2022.py — no editar a mano.\n'
      '// mun[ibge] = [votos por candidato (orden de cands), válidos, blancos+nulos, aptos, comparecencia]\n'
      'window.ELEC = window.ELEC || {};\n'
      f"window.ELEC['2022-1'] = {json.dumps(out['2022-1'], ensure_ascii=False, separators=(',', ':'))};\n"
      f"window.ELEC['2022-2'] = {json.dumps(out['2022-2'], ensure_ascii=False, separators=(',', ':'))};\n"
      f"window.MUN_NOMES = {json.dumps(nomes, ensure_ascii=False, separators=(',', ':'))};\n")
open(OUT, 'w', encoding='utf-8').write(js)
print('ok', len(js))
