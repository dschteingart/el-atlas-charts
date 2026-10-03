"""Lector del escrutinio del TSE (Brasil 2026, presidente).

    python vivo.py                 # 1a vuelta (4/10): lee al TSE cada 30 s
    python vivo.py --turno 2       # 2a vuelta (25/10)
    python vivo.py --simulacro     # ENSAYO con datos ficticios (escrutinio que avanza solo)
    python vivo.py --intervalo 20  # cada cuántos segundos consultar
    python vivo.py --servir        # además sirve la carpeta en http://localhost:8026 (opcional)

Mientras corre, abrí index.html con doble clic (directo del disco) e ir al mapa:
el mapa relee data/vivo/2026-<turno>.js cada 15 s. No hace falta servidor (algunos
antivirus cortan las descargas por localhost).

De dónde salen los datos: el TSE publica el escrutinio en archivos JSON en
https://resultados.tse.jus.br/oficial/ele2026/<eleccion>/dados/<uf>/...
(los mismos que consume su app "Resultados"). Elección 6257 = presidente 1a
vuelta, 6258 = 2a vuelta. Por cada nivel hay un archivo "-u.json":
  br/br-c0001-e006257-u.json            -> Brasil
  sp/sp-c0001-e006257-u.json            -> un estado (zz = exterior)
  sp/sp71072-c0001-e006257-u.json       -> un municipio (código TSE)
y un "-ab.json" por estado con el % de urnas escrutadas de cada municipio, que
usamos para pedir solo los municipios que cambiaron. El navegador no puede leer
esos archivos directo (el TSE no habilita CORS), por eso este script los baja y
deja un resumen en data/vivo/2026-<turno>.js (y .json), que la página lee cada 15 s.
"""
import argparse, json, os, random, ssl, sys, threading, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(RAIZ, 'data', 'vivo')
BASE = 'https://resultados.tse.jus.br/oficial/ele2026'
ELECCION = {1: '6257', 2: '6258'}
UFS = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe',
       'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to', 'zz']
UF_COD = {'11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA',
          '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
          '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS',
          '51': 'MT', '52': 'GO', '53': 'DF'}
NOMBRES = {  # nombre de pantalla por número de urna (si falta, se usa el del TSE)
    '13': 'Lula', '22': 'Flávio Bolsonaro', '55': 'Ronaldo Caiado', '30': 'Romeu Zema',
    '14': 'Renan Santos', '70': 'Augusto Cury', '27': 'Clariana Barão', '21': 'Edmilson Costa',
    '16': 'Hertz Dias', '80': 'Samara Martins', '35': 'Wilson Grassi', '28': 'Leonardo Avalanche',
    '29': 'Rui Costa Pimenta',
}

_ctx = ssl.create_default_context()  # usa el almacén de certificados de Windows


def log(*a):
    print(datetime.now().strftime('%H:%M:%S'), *a, flush=True)


def bajar(ruta, intentos=3):
    url = f'{BASE}/{ruta}'
    global _ctx
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (cobertura Cenital)'})
            with urllib.request.urlopen(req, context=_ctx, timeout=20) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1 + i)
        except ssl.SSLError:
            log('aviso: falló la verificación SSL (¿antivirus?), sigo sin verificar certificado')
            _ctx = ssl._create_unverified_context()
        except Exception as e:  # red caída, timeout
            if i == intentos - 1:
                log('error bajando', ruta, '-', e)
            time.sleep(1 + i)
    return None


def num(x):
    try:
        return int(str(x).replace('.', ''))
    except (TypeError, ValueError):
        return 0


def pct(x):
    try:
        return float(str(x).replace(',', '.'))
    except (TypeError, ValueError):
        return 0.0


def leer_u(d):
    """Del JSON '-u' del TSE devuelve {cand_n: votos}, totales y % escrutado."""
    votos, info = {}, {}
    for carg in d.get('carg', []):
        for agr in carg.get('agr', []):
            for par in agr.get('par', []):
                for c in par.get('cand', []):
                    votos[c['n']] = num(c.get('vap'))
                    info[c['n']] = (c.get('nmu', c['n']), par.get('sg', ''))
    v, s, e = d.get('v', {}), d.get('s', {}), d.get('e', {})
    tot = {
        # el TSE calcula el % de cada candidato sobre 'vvc' (válidos + votos de candidaturas anuladas)
        'val': num(v.get('vvc')) or num(v.get('vv')), 'bra': num(v.get('vb')), 'nul': num(v.get('tvn')),
        'apt': num(e.get('te')), 'com': num(e.get('c')), 'pct': pct(s.get('pst')),
        'hora': f"{d.get('dg', '')} {d.get('hg', '')}".strip(),
    }
    return votos, info, tot


class Escrutinio:
    def __init__(self, turno):
        self.turno = turno
        self.ele = ELECCION[turno]
        self.cfg = None          # municipios: tse -> (uf, ibge)
        self.st_mun = {}         # tse -> secciones escrutadas la última vez
        self.mun = {}            # ibge -> fila
        self.uf = {}
        self.nac = None
        self.cands = []          # orden fijo [(n, nombre, partido)]

    def config(self):
        d = bajar(f'{self.ele}/config/mun-e00{self.ele}-cm.json')
        if not d:
            raise SystemExit('No pude bajar la configuración de municipios del TSE.')
        self.cfg = {}
        for a in d['abr']:
            for m in a['mu']:
                self.cfg[m['cd']] = (a['cd'], m.get('cdi') or '')
        log(f'config: {len(self.cfg)} municipios (incluye exterior)')

    def fila(self, votos, tot):
        return {'v': [votos.get(n, 0) for n, _, _ in self.cands], **tot}

    def ciclo(self):
        if self.cfg is None:
            self.config()
        e = self.ele
        d = bajar(f'{e}/dados/br/br-c0001-e00{e}-u.json')
        if not d:
            log('todavía no hay archivo nacional (¿no empezó la divulgación?)')
            return False
        votos, info, tot = leer_u(d)
        if not self.cands:
            orden = sorted(info, key=lambda n: -votos.get(n, 0))
            self.cands = [(n, NOMBRES.get(n, info[n][0].title()), info[n][1]) for n in orden]
        self.nac = self.fila(votos, tot)

        def uf_u(uf):
            return uf, bajar(f'{e}/dados/{uf}/{uf}-c0001-e00{e}-u.json')

        def uf_ab(uf):
            return uf, bajar(f'{e}/dados/{uf}/{uf}-e00{e}-ab.json')

        with ThreadPoolExecutor(12) as ex:
            for uf, du in ex.map(uf_u, UFS):
                if du:
                    v, _, t = leer_u(du)
                    self.uf[uf.upper()] = self.fila(v, t)
            cambiaron = []
            for uf, ab in ex.map(uf_ab, UFS):
                if not ab or uf == 'zz':
                    continue
                for m in ab.get('abr', []):
                    if m.get('tpabr') != 'mun':
                        continue
                    st = num(m.get('s', {}).get('st'))
                    if st > 0 and st != self.st_mun.get(m['cdabr']):
                        cambiaron.append((uf, m['cdabr'], st))

        def mun_u(t):
            uf, cd, st = t
            return t, bajar(f'{e}/dados/{uf}/{uf}{cd}-c0001-e00{e}-u.json')

        if cambiaron:
            with ThreadPoolExecutor(16) as ex:
                for (uf, cd, st), dm in ex.map(mun_u, cambiaron):
                    if not dm:
                        continue
                    ib = self.cfg.get(cd, ('', ''))[1]
                    if not ib:
                        continue
                    v, _, t = leer_u(dm)
                    f = self.fila(v, t)
                    self.mun[ib] = [f['v'], f['val'], f['bra'] + f['nul'], f['apt'], f['com'], f['pct']]
                    self.st_mun[cd] = st
        log(f"{tot['hora']} TSE · {tot['pct']:.2f}% escrutado · {len(cambiaron)} municipios actualizados")
        return True

    def guardar(self, simulacro=False):
        if not self.nac:
            return
        out = {
            'id': f'2026-{self.turno}', 'anio': 2026, 'turno': self.turno,
            'fecha': '2026-10-04' if self.turno == 1 else '2026-10-25',
            'fuente': ('SIMULACRO: datos FICTICIOS de ensayo, armados con los resultados municipales de 2022.' if simulacro
                       else 'TSE, divulgación oficial de resultados (resultados.tse.jus.br).'),
            'cands': [{'n': n, 'nm': nm, 'p': p} for n, nm, p in self.cands],
            'nac': self.nac, 'uf': self.uf, 'mun': self.mun,
            'final': self.nac.get('pct', 0) >= 100, 'actualizado': self.nac.get('hora', ''),
            'consultado': datetime.now().strftime('%d/%m/%Y %H:%M:%S'), 'simulacro': simulacro,
        }
        os.makedirs(SALIDA, exist_ok=True)
        txt = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
        js = f"window.VIVO = window.VIVO || {{}};\nwindow.VIVO['2026-{self.turno}'] = {txt};\n"
        for ext, cuerpo in [('json', txt), ('js', js)]:
            tmp = os.path.join(SALIDA, f'2026-{self.turno}.{ext}.tmp')
            with open(tmp, 'w', encoding='utf-8') as fh:
                fh.write(cuerpo)
            for intento in range(5):  # en Windows el reemplazo puede chocar con una lectura en curso
                try:
                    os.replace(tmp, os.path.join(SALIDA, f'2026-{self.turno}.{ext}'))
                    break
                except PermissionError:
                    time.sleep(0.2)


class Simulacro(Escrutinio):
    """Escrutinio FICTICIO para ensayar: parte de los resultados 2022 por
    municipio, les cambia los nombres y les mete ruido, y va 'abriendo urnas'."""

    def __init__(self, turno):
        super().__init__(turno)
        txt = open(os.path.join(RAIZ, 'data', 'elecciones-2022.js'), encoding='utf-8').read()
        base = {}
        for linea in txt.splitlines():
            if linea.startswith("window.ELEC['2022-"):
                k = linea.split("'")[1]
                base[k] = json.loads(linea.split(' = ', 1)[1].rstrip(';'))
        self.b = base[f'2022-{turno}']
        mapa = {'13': '13', '22': '22', '15': '55', '12': '30', '44': '14', '30': '70'}
        self.cands = [(mapa.get(c['n'], c['n']), NOMBRES.get(mapa.get(c['n'], c['n']), c['nm']), '')
                      for c in self.b['cands']]
        self.prog = {ib: 0.0 for ib in self.b['mun']}
        self.ruido = {ib: random.uniform(-0.06, 0.06) for ib in self.b['mun']}
        self.t0 = time.time()

    def ciclo(self):
        # avanza: capitales y ciudades grandes primero, el resto después
        for ib, row in self.b['mun'].items():
            if self.prog[ib] >= 1:
                continue
            peso = 0.06 + 0.25 * min(1, row[3] / 400000)
            if random.random() < 0.5:
                self.prog[ib] = min(1.0, self.prog[ib] + random.uniform(0.1, 0.6) * peso * 4)
        nac = [0] * len(self.cands)
        ufs = {}
        nombres = json.loads(open(os.path.join(RAIZ, 'data', 'mun-uf.json'), encoding='utf-8').read()) \
            if os.path.exists(os.path.join(RAIZ, 'data', 'mun-uf.json')) else {}
        self.mun = {}
        for ib, row in self.b['mun'].items():
            p = self.prog[ib]
            if p <= 0:
                continue
            v = list(row[0])
            if len(v) >= 2:  # corre votos entre los dos primeros
                mov = int(v[0] * self.ruido[ib])
                v[0] -= mov
                v[1] += mov
            vv = [int(x * p) for x in v]
            val = sum(vv)
            self.mun[ib] = [vv, val, int(row[2] * p), row[3], int(row[4] * p), round(100 * p, 2)]
            uf = UF_COD.get(ib[:2], ib[:2])
            u = ufs.setdefault(uf, [[0] * len(v), 0, 0, 0, 0])
            for i, x in enumerate(vv):
                u[0][i] += x
                nac[i] += x
            u[1] += val; u[2] += int(row[2] * p); u[3] += row[3]; u[4] += int(row[4] * p)
        apt_tot = sum(r[3] for r in self.b['mun'].values())
        com_tot = sum(r[4] for r in self.mun.values())
        done = sum(r[4] for r in self.b['mun'].values())
        p_nac = round(100 * com_tot / done, 2) if done else 0
        hora = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        self.nac = {'v': nac, 'val': sum(nac), 'bra': 0, 'nul': sum(r[2] for r in self.mun.values()),
                    'apt': apt_tot, 'com': com_tot, 'pct': p_nac, 'hora': hora}
        self.uf = {uf: {'v': u[0], 'val': u[1], 'bra': 0, 'nul': u[2], 'apt': u[3], 'com': u[4],
                        'pct': round(100 * u[4] / max(1, u[3] * 0.8), 2)} for uf, u in ufs.items()}
        log(f'SIMULACRO · {p_nac:.1f}% escrutado')
        return True


def servir(puerto):
    import gzip
    comprimidos = {}  # ruta -> (mtime, bytes gzip)
    TIPOS = {'.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
             '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8'}

    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **k):
            super().__init__(*a, directory=RAIZ, **k)

        def do_GET(self):
            # texto comprimido con gzip: transferencias chicas (algunos antivirus cortan las grandes)
            ruta = self.translate_path(self.path)
            ext = os.path.splitext(ruta)[1].lower()
            if ext in TIPOS and os.path.isfile(ruta) and 'gzip' in self.headers.get('Accept-Encoding', ''):
                try:
                    mt = os.path.getmtime(ruta)
                    if ruta not in comprimidos or comprimidos[ruta][0] != mt:
                        with open(ruta, 'rb') as fh:
                            comprimidos[ruta] = (mt, gzip.compress(fh.read(), 6))
                    cuerpo = comprimidos[ruta][1]
                    self.send_response(200)
                    self.send_header('Content-Type', TIPOS[ext])
                    self.send_header('Content-Encoding', 'gzip')
                    self.send_header('Content-Length', str(len(cuerpo)))
                    self.send_header('Cache-Control', 'no-store' if '/data/vivo/' in self.path else 'no-cache')
                    super().end_headers()
                    self.wfile.write(cuerpo)
                    return
                except (ConnectionError, OSError):
                    return
            super().do_GET()

        def end_headers(self):
            if '/data/vivo/' in self.path:
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Access-Control-Allow-Origin', '*')
            super().end_headers()

        def handle(self):
            try:
                super().handle()
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                pass

        def log_message(self, *a):
            pass

    srv = ThreadingHTTPServer(('127.0.0.1', puerto), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    log(f'Placas en http://localhost:{puerto}/   ·   mapa: http://localhost:{puerto}/#mapa')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--turno', type=int, default=1, choices=[1, 2])
    ap.add_argument('--intervalo', type=int, default=30, help='segundos entre consultas (default 30)')
    ap.add_argument('--puerto', type=int, default=8026)
    ap.add_argument('--simulacro', action='store_true', help='escrutinio ficticio para ensayar')
    ap.add_argument('--servir', action='store_true', help='además servir la carpeta en http://localhost:PUERTO')
    ap.add_argument('--solo-servir', action='store_true', help='no consultar al TSE, solo servir la carpeta')
    a = ap.parse_args()
    if not a.simulacro and not a.solo_servir:
        # que un archivo de ensayo viejo no quede a la vista cuando arranca el modo real
        f = os.path.join(SALIDA, f'2026-{a.turno}.json')
        try:
            if json.load(open(f, encoding='utf-8')).get('simulacro'):
                for ext in ('json', 'js'):
                    os.remove(os.path.join(SALIDA, f'2026-{a.turno}.{ext}'))
                log('borré el archivo del simulacro anterior')
        except (OSError, ValueError):
            pass
    if a.servir or a.solo_servir:
        servir(a.puerto)
    else:
        log('Abrí index.html (doble clic) y andá al mapa. Esta ventana tiene que quedar abierta.')
    if a.solo_servir:
        while True:
            time.sleep(3600)
    esc = Simulacro(a.turno) if a.simulacro else Escrutinio(a.turno)
    if a.simulacro:
        log('MODO SIMULACRO: los números son FICTICIOS. No usar al aire como resultados.')
    while True:
        try:
            if esc.ciclo():
                esc.guardar(simulacro=a.simulacro)
        except KeyboardInterrupt:
            raise
        except Exception as ex:
            log('error en el ciclo:', repr(ex))
        time.sleep(a.intervalo if not a.simulacro else min(a.intervalo, 8))


if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(errors='replace')
    except AttributeError:
        pass
    try:
        main()
    except KeyboardInterrupt:
        print('\nchau')
