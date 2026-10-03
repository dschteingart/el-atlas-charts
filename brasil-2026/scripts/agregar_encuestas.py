"""Agregador de encuestas presidenciales 2026 -> data/encuestas.js
Uso: python scripts/agregar_encuestas.py   (lee data/raw/polls_first_round.csv y polls_second_round.csv)

Promedio móvil ponderado, como los agregadores de prensa:
- cada encuesta se ubica en el punto medio de su trabajo de campo;
- pesa más cuanto más cerca está de la fecha (núcleo gaussiano centrado, desvío BW días) y cuanto
  más grande es la muestra (raíz de n, con tope);
- las encuestadoras que publican muy seguido pesan menos: cada encuesta se divide por la cantidad de
  encuestas de esa misma encuestadora en ±21 días (así ninguna tapa a las demás).
Para agregar una encuesta nueva: sumar la fila al CSV y volver a correr este script."""
import json, math, os
from datetime import date, timedelta
import pandas as pd

R = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'encuestas.js')
BW = 14          # desvío del núcleo, en días
TOPE_N = 5000    # tope de muestra para el peso
CANDS_1V = [('lula', 'Lula'), ('flavio', 'Flávio Bolsonaro'), ('caiado', 'Ronaldo Caiado'),
            ('zema', 'Romeu Zema'), ('renan_santos', 'Renan Santos'), ('augusto_cury', 'Augusto Cury')]
CANDS_2V = [('lula', 'Lula'), ('flavio', 'Flávio Bolsonaro')]


def anio_frac(d):
    d0 = date(d.year, 1, 1)
    return round(d.year + (d - d0).days / (date(d.year + 1, 1, 1) - d0).days, 5)


def preparar(df, cands):
    df = df.copy()
    for c in ['field_start', 'field_end']:
        df[c] = pd.to_datetime(df[c], errors='coerce')
    df['field_start'] = df['field_start'].fillna(df['field_end'])
    df = df.dropna(subset=['field_end'])
    df['medio'] = df['field_start'] + (df['field_end'] - df['field_start']) / 2
    df['n'] = pd.to_numeric(df.get('sample_size'), errors='coerce').fillna(1500).clip(upper=TOPE_N)
    for c, _ in cands:
        if c in df:
            df[c] = pd.to_numeric(df[c], errors='coerce')
    return df.sort_values('medio')


def frecuencia(df):
    """cantidad de encuestas de la misma encuestadora en ±21 días de cada una (incluida ella)"""
    f = []
    for _, r in df.iterrows():
        mismo = df[(df.pollster == r.pollster) & ((df.medio - r.medio).abs() <= pd.Timedelta(days=21))]
        f.append(len(mismo))
    return df.assign(frec=f)


def promedio(df, col, dia):
    d = df.dropna(subset=[col])
    if d.empty:
        return None
    dt = (d['medio'] - pd.Timestamp(dia)).dt.days.astype(float)
    k = [math.exp(-0.5 * (x / BW) ** 2) if abs(x) <= 3 * BW else 0.0 for x in dt]
    w = [ki * math.sqrt(n) / fr for ki, n, fr in zip(k, d.n, d.frec)]
    if sum(k) < 0.15:
        return None
    return round(sum(wi * v for wi, v in zip(w, d[col])) / sum(w), 2)


def serie(df, cands):
    ini, fin = df['medio'].min().date(), df['medio'].max().date()
    dias, d = [], ini + timedelta(days=4)
    while d < fin:
        dias.append(d)
        d += timedelta(days=2)
    dias.append(fin)
    out = {}
    for c, _ in cands:
        if c not in df or df[c].notna().sum() < 5:
            continue
        out[c] = [{'t': anio_frac(x), 'v': v, 'f': x.isoformat()} for x in dias if (v := promedio(df, c, x)) is not None]
    return out


def puntos(df, cands):
    filas = []
    for _, r in df.iterrows():
        filas.append({
            'enc': r['pollster'], 't': anio_frac(r['medio'].date()),
            'campo': f"{r['field_start'].strftime('%d/%m')}–{r['field_end'].strftime('%d/%m/%Y')}",
            'n': int(r['n']), **{c: (None if pd.isna(r.get(c)) else float(r[c])) for c, _ in cands if c in df},
        })
    return filas


S = {}
for clave, archivo, cands in [('1v', 'polls_first_round.csv', CANDS_1V), ('2v', 'polls_second_round.csv', CANDS_2V)]:
    df = frecuencia(preparar(pd.read_csv(os.path.join(R, archivo)), cands))
    S[clave] = {
        'cands': [{'c': c, 'nm': nm} for c, nm in cands if c in df and df[c].notna().sum() >= 5],
        'agregado': serie(df, cands),
        'encuestas': puntos(df, cands),
        'encuestadoras': sorted(df['pollster'].unique().tolist()),
        'n_encuestas': int(len(df)),
        'desde': df['field_start'].min().date().isoformat(), 'hasta': df['field_end'].max().date().isoformat(),
    }
    ult = {c: v[-1]['v'] for c, v in S[clave]['agregado'].items()}
    print(clave, len(df), 'encuestas; último promedio:', {k: float(v) for k, v in ult.items()})

S['metodo'] = f'Promedio ponderado por cercanía (núcleo gaussiano, desvío de {BW} días) y tamaño de muestra; las encuestadoras frecuentes pesan menos.'
open(OUT, 'w', encoding='utf-8').write('// Generado por scripts/agregar_encuestas.py — no editar a mano.\nwindow.ENCUESTAS = ' +
                                        json.dumps(S, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('ok')
