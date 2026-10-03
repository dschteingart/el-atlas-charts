"""Arma data/mun-jerarquia.json (código IBGE -> región, estado, región intermedia, región inmediata)
desde la API de localidades del IBGE (servicodados.ibge.gov.br/api/v1/localidades/municipios),
guardada como mun_meta.json. La usa la proyección (proyeccion.py) para "encoger" el cambio de voto
de los municipios que faltan hacia el de sus vecinos.

Uso: python scripts/armar_jerarquia.py <mun_meta.json>
"""
import json, os, sys

meta = json.load(open(sys.argv[1], encoding='utf-8'))
out = {}
for m in meta:
    ri = m['regiao-imediata']
    uf = ri['regiao-intermediaria']['UF']
    out[str(m['id'])] = [uf['regiao']['sigla'], uf['sigla'], ri['regiao-intermediaria']['id'], ri['id']]
dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'mun-jerarquia.json')
json.dump(out, open(dest, 'w', encoding='utf-8'), separators=(',', ':'))
print(len(out), 'municipios ->', dest)
