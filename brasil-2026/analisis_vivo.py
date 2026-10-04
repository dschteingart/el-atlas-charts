"""Análisis rápido del escrutinio en vivo: dónde se mueve el voto respecto de 2022 y qué lo acompaña.

    python analisis_vivo.py                 # 1a vuelta (lee data/vivo/2026-1.json, que escribe vivo.py)
    python analisis_vivo.py --turno 2       # balotaje
    python analisis_vivo.py --uf BA         # solo un estado
    python analisis_vivo.py --cand 55       # dónde le va mejor a un candidato (55 Caiado, 30 Zema, 14 Renan...)
    python analisis_vivo.py --min-pct 50    # solo municipios con al menos 50% de las urnas contadas

Compara cada municipio con lo que votó en la misma vuelta de 2022 (Lula con Lula, Flávio con Jair,
el resto con el resto). Las correlaciones y la regresión son entre municipios, ponderadas por votos
contados: describen dónde se mueve el voto, no por qué. Corre en un par de segundos; se puede repetir
cuantas veces haga falta mientras vivo.py sigue bajando datos.
"""
import argparse, json, os, sys
import numpy as np
import pandas as pd

RAIZ = os.path.dirname(os.path.abspath(__file__))
REG = {'1': 'Norte', '2': 'Nordeste', '3': 'Sudeste', '4': 'Sur', '5': 'Centro-Oeste'}
UF = {'11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
      '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'}


def leer_js(ruta, prefijo):
    out = {}
    for l in open(ruta, encoding='utf-8'):
        if l.startswith(prefijo) and ' = ' in l:
            try:
                out[l.split(' = ', 1)[0]] = json.loads(l.split(' = ', 1)[1].rstrip().rstrip(';'))
            except ValueError:   # líneas que no son datos (p. ej. window.ELEC = window.ELEC || {})
                pass
    return out


def wavg(x, w):
    m = np.isfinite(x)
    return np.average(x[m], weights=w[m]) if m.any() else np.nan


def wcorr(x, y, w):
    m = np.isfinite(x) & np.isfinite(y)
    x, y, w = x[m], y[m], w[m]
    if len(x) < 20:
        return np.nan, len(x)
    mx, my = np.average(x, weights=w), np.average(y, weights=w)
    c = np.average((x - mx) * (y - my), weights=w) / np.sqrt(np.average((x - mx) ** 2, weights=w) * np.average((y - my) ** 2, weights=w))
    return c, len(x)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--turno', default='1', choices=['1', '2'])
    ap.add_argument('--min-pct', type=float, default=20)
    ap.add_argument('--uf', default=None)
    ap.add_argument('--cand', default=None, help='número de urna de un candidato para ver dónde le va mejor')
    ap.add_argument('--top', type=int, default=8)
    a = ap.parse_args()

    f = os.path.join(RAIZ, 'data', 'vivo', f'2026-{a.turno}.json')
    if not os.path.exists(f):
        sys.exit(f'No está {f}: ¿está corriendo vivo.py (EN_VIVO_…bat)?')
    D = json.load(open(f, encoding='utf-8'))
    E = leer_js(os.path.join(RAIZ, 'data', 'elecciones-2022.js'), "window.")
    B = E[f"window.ELEC['2022-{a.turno}']"]
    nombres = E['window.MUN_NOMES']
    SO = leer_js(os.path.join(RAIZ, 'data', 'socio.js'), 'window.SOCIO')['window.SOCIO']['mun']

    c26 = [c['n'] for c in D['cands']]
    c22 = [c['n'] for c in B['cands']]
    nm26 = {c['n']: c['nm'] for c in D['cands']}
    L, F = c26.index('13'), c26.index('22')
    L0, J0 = c22.index('13'), c22.index('22')
    filas = []
    for ib, r in D['mun'].items():
        b = B['mun'].get(ib)
        if not b or not r[1] or not b[1] or (r[5] or 0) < a.min_pct:
            continue
        if a.uf and UF.get(ib[:2]) != a.uf.upper():
            continue
        v26, v22 = np.array(r[0], float), np.array(b[0], float)
        s = SO.get(ib, [None] * 4)
        filas.append(dict(
            ib=ib, nombre=nombres.get(ib, [ib, ''])[0], uf=UF.get(ib[:2], '?'), region=REG.get(ib[0], '?'),
            pct=r[5], val=r[1], apt=b[3],
            lula22=100 * v22[L0] / b[1], lula26=100 * v26[L] / r[1],
            jair22=100 * v22[J0] / b[1], flavio26=100 * v26[F] / r[1],
            resto22=100 * (b[1] - v22[L0] - v22[J0]) / b[1], resto26=100 * (r[1] - v26[L] - v26[F]) / r[1],
            cand=(100 * v26[c26.index(a.cand)] / r[1]) if a.cand and a.cand in c26 else np.nan,
            bf=s[0], ingreso=np.log(s[1]) if s[1] else np.nan, blancos=s[2], evang=s[3]))
    T = pd.DataFrame(filas)
    print(f"\n=== {D.get('fuente', '')[:60]} · {D['nac'].get('pct', 0):.2f}% de las secciones escrutadas · dato {D.get('actualizado', '')}")
    if D.get('simulacro'):
        print('*** SIMULACRO: DATOS FICTICIOS ***')
    if len(T) < 10:
        sys.exit(f'Todavía hay pocos municipios con al menos {a.min_pct:.0f}% contado ({len(T)}).')
    T['dl'] = T.lula26 - T.lula22
    T['df'] = T.flavio26 - T.jair22
    T['dr'] = T.resto26 - T.resto22
    w = T.val.values.astype(float)
    print(f'Municipios usados: {len(T)} (con al menos {a.min_pct:.0f}% contado){" en " + a.uf.upper() if a.uf else ""}')
    P = D.get('proy') or {}
    if P.get('ok'):
        o = np.argsort(P['proy'])[::-1][:4]
        print('Proyección: ' + ' · '.join(f"{D['cands'][i]['nm']} {P['proy'][i]:.1f}% (±{P['banda'][i]:.1f})" for i in o))

    print(f"\nCambio respecto de 2022 en esos municipios (puntos): Lula {wavg(T.dl.values, w):+.1f} · Flávio vs Jair {wavg(T.df.values, w):+.1f}"
          + (f" · resto {wavg(T.dr.values, w):+.1f}" if a.turno == '1' else ''))

    def tabla(col):
        g = T.groupby(col).apply(lambda d: pd.Series({'n': len(d), 'Lula': wavg(d.dl.values, d.val.values.astype(float)),
                                                      'Flávio': wavg(d.df.values, d.val.values.astype(float)),
                                                      'resto': wavg(d.dr.values, d.val.values.astype(float))}), include_groups=False)
        return g.sort_values('Lula')
    if not a.uf:
        print('\nPor región (cambio en puntos):')
        print(tabla('region').round(1).to_string())
    print('\nPor estado (de más pérdida a más ganancia de Lula):' if not a.uf else '')
    if not a.uf:
        print(tabla('uf').round(1).to_string())

    G = T[(T.apt >= 100000) & (T.pct >= 30)].sort_values('dl')
    if len(G):
        print(f'\nCiudades de más de 100 mil electores (al menos 30% contado) donde más BAJA Lula:')
        print(G.head(a.top)[['nombre', 'uf', 'pct', 'lula22', 'lula26', 'dl', 'df']].round(1).to_string(index=False))
        print(f'\n… y donde más SUBE:')
        print(G.tail(a.top).iloc[::-1][['nombre', 'uf', 'pct', 'lula22', 'lula26', 'dl', 'df']].round(1).to_string(index=False))

    print('\nQué acompaña al cambio de Lula (correlación entre municipios, ponderada por votos):')
    T['logapt'] = np.log(T.apt.clip(lower=1))
    facs = [('bf', 'Bolsa Família (familias c/100 hogares)'), ('ingreso', 'Ingreso por persona (log)'), ('blancos', '% blancos'),
            ('evang', '% evangélicos'), ('lula22', 'Voto a Lula en 2022'), ('logapt', 'Tamaño (log electores)')]
    for k, nmf in facs:
        r, n = wcorr(T[k].values.astype(float), T.dl.values, w)
        print(f'  {nmf:42s} r = {r:+.2f}   (n={n})')

    # regresión múltiple: separa factores que van juntos (ej. pobreza y religión en el Nordeste)
    X = T[[k for k, _ in facs]].astype(float)
    ok = X.notna().all(axis=1).values & np.isfinite(T.dl.values)
    if ok.sum() > 50:
        Xs = X[ok].values
        ww = w[ok]
        mu = np.average(Xs, axis=0, weights=ww)
        sd = np.sqrt(np.average((Xs - mu) ** 2, axis=0, weights=ww))
        Z = (Xs - mu) / np.where(sd > 0, sd, 1)
        y = T.dl.values[ok]
        for con_reg in [False, True]:
            M = [np.ones(len(Z)), *Z.T]
            if con_reg:
                regs = T.region.values[ok]
                for rg in sorted(set(regs))[1:]:
                    M.append((regs == rg).astype(float))
            M = np.column_stack(M)
            Wm = M * ww[:, None]
            beta = np.linalg.lstsq(M.T @ Wm, Wm.T @ y, rcond=None)[0]
            res = y - M @ beta
            r2 = 1 - np.average(res ** 2, weights=ww) / np.average((y - np.average(y, weights=ww)) ** 2, weights=ww)
            print(f"\nRegresión múltiple{' con efectos de región' if con_reg else ''} (puntos de cambio de Lula por cada desvío estándar del factor; R² = {r2:.2f}, n = {ok.sum()}):")
            for (k, nmf), b in zip(facs, beta[1:1 + len(facs)]):
                print(f'  {nmf:42s} {b:+.2f}')

    if a.cand:
        if a.cand not in c26:
            print(f'\nNo encontré el candidato {a.cand}. Números: ' + ', '.join(f"{c['n']} {c['nm']}" for c in D['cands']))
        else:
            print(f"\nDónde le va mejor a {nm26[a.cand]} (% de votos válidos):")
            g = T.groupby('uf').apply(lambda d: wavg(d.cand.values, d.val.values.astype(float)), include_groups=False).sort_values(ascending=False)
            print('  por estado: ' + ' · '.join(f'{u} {v:.1f}' for u, v in g.head(10).items()))
            print(T[T.apt >= 50000].sort_values('cand', ascending=False).head(a.top)[['nombre', 'uf', 'pct', 'cand']].round(1).to_string(index=False))
            r, n = wcorr(T.cand.values, T.resto22.values, w)
            print(f'  correlación con el voto al resto de los candidatos en 2022: r = {r:+.2f}')
            for k, nmf in facs[:4]:
                r, n = wcorr(T[k].values.astype(float), T.cand.values, w)
                print(f'  correlación con {nmf}: r = {r:+.2f}')


if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except AttributeError:
        pass
    main()
