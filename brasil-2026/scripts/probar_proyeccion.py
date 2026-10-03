"""Prueba de la proyección: simula el escrutinio de 2022 y lo proyecta con el modelo de swing usando
2018 como elección de referencia (lo mismo que mañana se hará con 2022 como referencia para 2026).

Datos (TSE, datos abiertos, cdn.tse.jus.br/estatistica/sead/odsele/):
  votacao_candidato_munzona_2018_BR.csv, votacao_candidato_munzona_2022_BR.csv
  detalhe_votacao_munzona_2022_BR.csv  (trae la hora en que terminó de contarse cada zona electoral)
  ele2026_6257_config_mun-e006257-cm.json (código TSE -> IBGE), mun_meta.json (jerarquía IBGE)

Simulación: los votos de cada zona electoral (~6.300 en 2022) se reparten entre sus secciones (urnas,
~470.000) con variación entre secciones, y las secciones se van "contando" según el escenario:
  real      orden parecido al de 2022: cada zona termina a la hora real en que terminó en 2022, y el
            Nordeste y el Norte llevan una demora calibrada para que Lula pase adelante en el conteo
            crudo cuando pasó de verdad (70% de las secciones en 1ª vuelta, 67,8% en el balotaje)
  azar      secciones en orden aleatorio
  sesgado   el orden real, más un sesgo dentro de cada estado: entran antes los municipios donde
            menos creció el PT (un sesgo que el modelo no puede ver)
  adverso   ese mismo sesgo, fuerte: el peor caso razonable

Uso: python scripts/probar_proyeccion.py <carpeta_con_los_csv> [--corridas 20]
Escribe data/proyeccion-calibracion.json (márgenes de error por % escrutado) y un resumen en pantalla.
"""
import argparse, json, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from proyeccion import Proyector  # noqa: E402

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
QS = [0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]


def cargar(raw):
    cm = json.load(open(os.path.join(raw, 'ele2026_6257_config_mun-e006257-cm.json'), encoding='utf-8'))
    tse2ibge = {mu['cd']: mu['cdi'] for a in cm['abr'] for mu in a['mu'] if mu['cdi']}
    jer = {}
    for m in json.load(open(os.path.join(raw, 'mun_meta.json'), encoding='utf-8')):
        ri = m['regiao-imediata']
        uf = ri['regiao-intermediaria']['UF']
        jer[str(m['id'])] = (uf['regiao']['sigla'], uf['sigla'], ri['regiao-intermediaria']['id'], ri['id'])
    jer['ZZ'] = ('EXT', 'ZZ', 'ZZ', 'ZZ')

    def votos(anio):
        v = pd.read_csv(os.path.join(raw, f'votacao_candidato_munzona_{anio}_BR.csv'), sep=';', encoding='latin1', dtype=str,
                        usecols=['NR_TURNO', 'SG_UF', 'CD_MUNICIPIO', 'NR_ZONA', 'CD_CARGO', 'NR_CANDIDATO', 'QT_VOTOS_NOMINAIS_VALIDOS'])
        v = v[v.CD_CARGO == '1'].copy()
        v['votos'] = v.QT_VOTOS_NOMINAIS_VALIDOS.astype(int)
        v['CD_MUNICIPIO'] = v.CD_MUNICIPIO.str.zfill(5)
        v['u'] = np.where(v.SG_UF == 'ZZ', 'ZZ', v.CD_MUNICIPIO.map(tse2ibge))
        return v[v.u.notna()]

    v18, v22 = votos(2018), votos(2022)
    d22 = pd.read_csv(os.path.join(raw, 'detalhe_votacao_munzona_2022_BR.csv'), sep=';', encoding='latin1', dtype=str)
    d22 = d22[d22.CD_CARGO == '1'].copy()
    d22['CD_MUNICIPIO'] = d22.CD_MUNICIPIO.str.zfill(5)
    d22['u'] = np.where(d22.SG_UF == 'ZZ', 'ZZ', d22.CD_MUNICIPIO.map(tse2ibge))
    d22['secc'] = d22.QT_TOTAL_SECOES.astype(int)
    d22['fin'] = pd.to_datetime(d22.DT_ULTIMA_TOTALIZACAO + ' ' + d22.HH_ULTIMA_TOTALIZACAO, format='%d/%m/%Y %H:%M:%S')
    return jer, v18, v22, d22[d22.u.notna()]


def armar(turno, jer, v18, v22, d22):
    t = str(turno)
    a, b = v18[v18.NR_TURNO == t], v22[v22.NR_TURNO == t]
    unidades = sorted(set(a.u) & set(b.u))
    ui = {k: i for i, k in enumerate(unidades)}
    # referencia 2018 por bloque: 0 = PT (13), 1 = Bolsonaro (17), 2 = resto
    blo18 = a.NR_CANDIDATO.map({'13': 0, '17': 1}).fillna(2).astype(int)
    B = 2 if turno == 2 else 3
    base = np.zeros((len(unidades), B))
    np.add.at(base, (a.u.map(ui).values, blo18.values), a.votos.values)
    # 2022 por zona y candidato
    cands = list(b.groupby('NR_CANDIDATO').votos.sum().sort_values(ascending=False).index)
    ci = {c: i for i, c in enumerate(cands)}
    b = b[b.u.isin(ui)]
    # zona = (municipio TSE, número de zona): en el exterior hay zonas con el mismo número en distintas ciudades
    zonas = b[['u', 'CD_MUNICIPIO', 'NR_ZONA']].drop_duplicates(['CD_MUNICIPIO', 'NR_ZONA']).reset_index(drop=True)
    zi = {(r.CD_MUNICIPIO, r.NR_ZONA): i for i, r in enumerate(zonas.itertuples())}
    Z = np.zeros((len(zonas), len(cands)))
    np.add.at(Z, ([zi[(m, z)] for m, z in zip(b.CD_MUNICIPIO, b.NR_ZONA)], b.NR_CANDIDATO.map(ci).values), b.votos.values)
    dz = d22[d22.NR_TURNO == t].drop_duplicates(['CD_MUNICIPIO', 'NR_ZONA']).set_index(['CD_MUNICIPIO', 'NR_ZONA'])
    sd, fd = dz.secc.to_dict(), dz.fin.to_dict()
    secc = np.array([sd.get((m, z), 1) for m, z in zip(zonas.CD_MUNICIPIO, zonas.NR_ZONA)], float)
    fin = np.array([fd.get((m, z), pd.NaT) for m, z in zip(zonas.CD_MUNICIPIO, zonas.NR_ZONA)])
    dia = '2022-10-02' if turno == 1 else '2022-10-30'
    h = np.array([(x - pd.Timestamp(dia + ' 17:00:00')).total_seconds() / 3600 if not pd.isna(x) else 3.0 for x in fin])
    h = np.clip(h, 0.05, 8.0)
    bloque_de = np.array([0 if c == '13' else 1 if c == '22' else 2 for c in cands])
    if turno == 2:
        bloque_de = np.minimum(bloque_de, 1)
    TARDE = {'S': 0.0, 'CO': 0.1, 'SE': 0.3, 'N': 0.8, 'NE': 1.0, 'EXT': 1.0}
    tarde = np.array([TARDE[jer[k][0]] for k in unidades])
    return dict(unidades=unidades, base=base, cands=cands, Z=Z, zu=zonas.u.map(ui).values, secc=secc, h=h, tarde=tarde,
                bloque_de=bloque_de, jer={k: jer[k] for k in unidades})


def secciones(D, rng, kappa=12.0):
    """reparte los votos de cada zona entre sus secciones (urnas), con variación entre secciones:
    así el conteo parcial de un municipio no es una copia a escala de su resultado final"""
    n = np.maximum(D['secc'].astype(int), 1)
    zs = np.repeat(np.arange(len(n)), n)
    K = D['Z'].shape[1]
    g = rng.gamma(kappa, 1.0, size=(len(zs), K))
    tot = np.zeros((len(n), K))
    for k in range(K):
        tot[:, k] = np.bincount(zs, weights=g[:, k], minlength=len(n))
    return zs, D['Z'][zs] * g / tot[zs]


def tiempos(esc, D, zs, rng, a):
    """hora (en horas desde el cierre) en que se cuenta cada sección"""
    S = len(zs)
    if esc == 'real':
        # cada zona termina a la hora real de 2022; sus secciones se cuentan antes, concentradas
        # cerca del final según 'a' (calibrado para que Lula pase adelante cuando pasó en 2022)
        # más una demora por región (Nordeste y Norte entran más tarde), calibrada con el dato real
        return D['h'][zs] * rng.beta(5.0, 1.0, S) + a * D['tarde'][D['zu'][zs]]
    if esc == 'azar':
        return rng.uniform(0, 1, S)
    if esc in ('adverso', 'sesgado'):
        # dentro de cada estado entran primero los municipios donde menos creció el PT (2018 -> 2022)
        Zu = np.zeros((len(D['unidades']), D['Z'].shape[1]))
        np.add.at(Zu, D['zu'], D['Z'])
        lula = Zu[:, D['bloque_de'] == 0].sum(1) / np.maximum(Zu.sum(1), 1)
        pt18 = D['base'][:, 0] / np.maximum(D['base'].sum(1), 1)
        lg = lambda x: np.log(np.clip(x, 1e-3, 1 - 1e-3) / (1 - np.clip(x, 1e-3, 1 - 1e-3)))
        sw = lg(lula) - lg(pt18)
        uf = np.array([D['jer'][k][1] for k in D['unidades']])
        rk = np.zeros(len(sw))
        for s in set(uf):
            m = uf == s
            rk[m] = sw[m].argsort().argsort() / max(m.sum() - 1, 1)
        peso = 0.7 if esc == 'adverso' else 0.3   # 'sesgado': el mismo sesgo, más suave, sobre el orden real
        base_t = rng.uniform(0, 1, S) if esc == 'adverso' else tiempos('real', D, zs, rng, a) / 4
        return peso * rk[D['zu'][zs]] + (1 - peso) * base_t
    raise ValueError(esc)


def fotos(D, zs, V, t, qs):
    """estado del escrutinio cuando se contó la fracción q de las secciones del país"""
    orden = np.argsort(t, kind='stable')
    U, K = len(D['unidades']), V.shape[1]
    zu = D['zu'][zs]
    st = np.bincount(zu, minlength=U)
    for q in qs:
        m = orden[:int(round(q * len(t)))]
        O = np.column_stack([np.bincount(zu[m], weights=V[m, k], minlength=U) for k in range(K)])
        yield q, np.round(O), np.bincount(zu[m], minlength=U) / np.maximum(st, 1)


A_REAL = {1: 0.5, 2: 0.12}  # demora del Nordeste/Norte que reproduce cuándo pasó Lula adelante en 2022 (70% y 67,8%)


def cruce(D, a, semilla=7):
    """% de secciones contadas en el que Lula pasa adelante en el conteo crudo (escenario real)"""
    rng = np.random.default_rng(semilla)
    zs, V = secciones(D, rng)
    t = tiempos('real', D, zs, rng, a)
    lu, bo = np.where(D['bloque_de'] == 0)[0][0], np.where(D['bloque_de'] == 1)[0][0]
    ult = None
    for q, O, f in fotos(D, zs, V, t, np.arange(0.02, 1.0, 0.01)):
        tot = O.sum(0)
        if tot[lu] < tot[bo]:
            ult = q
    return None if ult is None else ult + 0.01


def correr(D, escenarios, corridas, turno, params=None):
    P = Proyector(D['unidades'], D['jer'], D['base'], D['base'].sum(1), params)
    verdad = 100 * D['Z'].sum(0) / D['Z'].sum()
    filas = []
    for esc in escenarios:
        for k in range(corridas):
            rng = np.random.default_rng(1000 + k)
            zs, V = secciones(D, rng)
            t = tiempos(esc, D, zs, rng, A_REAL[turno])
            for q, O, f in fotos(D, zs, V, t, QS):
                r = P.proyectar(O, f, D['bloque_de'])
                if r is None:
                    continue
                e = r['proy'] - verdad
                c = r['conteo'] - verdad
                filas.append(dict(esc=esc, corrida=k, q=q, contado=r['contado'], n_uf=r['n_uf'],
                                  e_lula=e[0], e_bolso=e[1], e_margen=e[0] - e[1], e_3=e[2] if len(e) > 2 else 0,
                                  c_lula=c[0], c_bolso=c[1], c_margen=c[0] - c[1],
                                  tercero_ok=(len(e) < 3) or (int(np.argmax(r['proy'][2:])) == 0)))
    return pd.DataFrame(filas), verdad


def resumen(df, titulo):
    print(f'\n=== {titulo} ===')
    print('error absoluto en puntos: mediana / percentil 90  (margen = Lula - Bolsonaro)')
    for esc, g in df.groupby('esc', sort=False):
        print(f'-- escenario {esc}' + (f'  (tercero bien proyectado: {100 * g.tercero_ok.mean():.0f}% de las veces; error mediano del 3º: {np.median(np.abs(g.e_3)):.2f} pts)' if g.e_3.abs().sum() else ''))
        print('  % secc   conteo crudo (margen)   proyección Lula   proyección Bolsonaro   proyección margen')
        for q, h in g.groupby('q'):
            a = lambda s: f'{np.median(np.abs(h[s])):4.1f} / {np.quantile(np.abs(h[s]), .9):4.1f}'
            print(f'  {100 * q:4.0f}%     {a("c_margen")}            {a("e_lula")}        {a("e_bolso")}          {a("e_margen")}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('raw')
    ap.add_argument('--corridas', type=int, default=12)
    ap.add_argument('--turnos', default='1,2')
    ap.add_argument('--calibrar', action='store_true')
    a = ap.parse_args()
    jer, v18, v22, d22 = cargar(a.raw)
    calib = {}
    for turno in [int(x) for x in a.turnos.split(',')]:
        D = armar(turno, jer, v18, v22, d22)
        if a.calibrar:
            for aa in ([0.05, 0.1, 0.15, 0.2] if turno == 2 else [0.5]):
                print(f'vuelta {turno}: a={aa}: Lula pasa adelante con {cruce(D, aa)} de las secciones (real 2022: {0.70 if turno == 1 else 0.6776})')
            continue
        df, verdad = correr(D, ['real', 'azar', 'sesgado', 'adverso'], a.corridas, turno)
        print(f'\nResultado real 2022, vuelta {turno}:', ', '.join(f'{c} {v:.2f}%' for c, v in zip(D['cands'][:4], verdad[:4])))
        resumen(df, f'Vuelta {turno}: proyectar 2022 desde 2018')
        # margen de error para mostrar en vivo: percentil 90 del error en los escenarios real y azar,
        # por tramo de votos ya contados
        g = df[df.esc.isin(['real', 'azar', 'sesgado'])]
        tramos = []
        for q in QS:
            h = g[g.q == q]
            tramos.append({'contado': round(float(h.contado.median()), 3),
                           'cand': round(float(np.quantile(np.abs(np.r_[h.e_lula, h.e_bolso]), .9)), 2),
                           'margen': round(float(np.quantile(np.abs(h.e_margen), .9)), 2)})
        calib[str(turno)] = tramos
    out = os.path.join(RAIZ, 'data', 'proyeccion-calibracion.json')
    json.dump(calib, open(out, 'w', encoding='utf-8'), indent=1)
    print('\nescribí', out)


if __name__ == '__main__':
    main()
