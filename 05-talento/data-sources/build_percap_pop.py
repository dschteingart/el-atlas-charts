# -*- coding: utf-8 -*-
"""Serie de población anual 1850-2010 por país (bordes actuales) desde el
CSV de OWID que subió Daniel, para el chart de figuras célebres per cápita
(promedio de tasas anuales). Anual sin huecos desde 1800 → interpola interior
si hubiera huecos y extrapola plano en los extremos (país que arranca tarde).
Incluye la serie mundial (OWID_WRL). Salida: 05-talento/data-percap-pop.js
(pob en MILES, redondeada, para achicar el archivo)."""
import csv, json, os

SRC = r'C:\Users\FUNDAR\Downloads\_pop_upload\population.csv'
OUT = r'C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\el-atlas-charts\05-talento\data-percap-pop.js'
Y0, Y1 = 1850, 2010

raw = {}  # code -> {year: pop}
with open(SRC, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        code = (row['Code'] or '').strip()
        if not code:
            continue
        try:
            y = int(row['Year']); p = float(row['Population'])
        except (ValueError, TypeError):
            continue
        raw.setdefault(code, {})[y] = p

def annual_series(byyear):
    """Devuelve lista [Y0..Y1] en MILES (int), interpolando huecos interiores
    y extrapolando plano en los extremos."""
    if not byyear:
        return None
    yrs = sorted(byyear)
    first, last = yrs[0], yrs[-1]
    out = []
    for y in range(Y0, Y1 + 1):
        if y in byyear:
            v = byyear[y]
        elif y < first:
            v = byyear[first]            # back-fill plano
        elif y > last:
            v = byyear[last]             # forward-fill plano
        else:
            # interior: interpolación lineal entre los dos años con dato
            lo = max(a for a in yrs if a <= y)
            hi = min(a for a in yrs if a >= y)
            if lo == hi:
                v = byyear[lo]
            else:
                t = (y - lo) / (hi - lo)
                v = byyear[lo] + t * (byyear[hi] - byyear[lo])
        out.append(int(round(v / 1000.0)))   # personas -> miles
    return out

def is_iso3(code):
    return len(code) == 3 and code.isalpha() and code.isupper() and not code.startswith('OWID')

pop = {}
extrapolated = []   # países que necesitaron back-fill (arrancan después de Y0)
for code, byyear in raw.items():
    if not is_iso3(code):
        continue
    ser = annual_series(byyear)
    if ser is None:
        continue
    pop[code] = ser
    first = min(byyear)
    if first > Y0:
        extrapolated.append((code, first))

world = annual_series(raw.get('OWID_WRL', {}))

data = {'y0': Y0, 'y1': Y1, 'pop': pop, 'world': world}
js = '// Serie de población anual 1850-2010 por país (OWID, bordes actuales), en MILES.\n'
js += '// Interior interpolado lineal; extremos extrapolados plano. world = OWID_WRL.\n'
js += '// Generado por _talento_work/build_percap_pop.py\n'
js += 'window.PERCAP_POP=' + json.dumps(data, separators=(',', ':')) + ';\n'
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(js)

print('paises:', len(pop), '| world years:', len(world) if world else 0)
print('archivo:', OUT, '|', round(os.path.getsize(OUT)/1024), 'KB')
print('back-fill (arrancan despues de 1850):', len(extrapolated))
print('  ej:', sorted(extrapolated, key=lambda x: -x[1])[:12])
# sanity checks
for c in ['ARG', 'USA', 'BRA', 'URY', 'CHN']:
    if c in pop:
        print(c, '1850=', pop[c][0], 'mil  2010=', pop[c][-1], 'mil')
print('WORLD 1850=', world[0], 'mil  2010=', world[-1], 'mil')
