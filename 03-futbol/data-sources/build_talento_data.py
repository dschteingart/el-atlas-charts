"""Build data-talento.js — futbolistas Pantheon por país + serie de población OWID.

Input:
  - Pantheon `person_2025_update.csv` (filtramos occupation == 'SOCCER PLAYER').
    Ubicación: _handoff-futbol/pantheon_compare/person_2025.csv (no en repo
    por peso; armado localmente).
  - OWID `population.csv` (serie histórica por país × año).
    Ubicación: _handoff-futbol/pantheon_compare/owid_pop_extracted/.

Output:
  - 03-futbol/data-talento.js con dos consts:
      PLAYERS_TALENTO: array de [iso3, birth_year, hpi] ordenado por hpi desc.
        Formato array-de-arrays para minimizar peso vs JSON objects.
      POP_TALENTO: {iso3: {year: population_thousands}} (population / 1000
        para reducir bytes y porque "por millón" no requiere precisión > 1k).

Decisiones editoriales:
  - bplace_country del Pantheon usa NOMBRES (no ISO). Mapeamos a ISO3 con
    el cruce OWID + overrides para los pocos casos que no matchean.
  - bplace_country == 'United Kingdom' → GBR (Pantheon no usa "England"
    para futbolistas modernos; los británicos van con UK).
  - Mantenemos solo jugadores con birthyear ∈ [1850, 2015] y hpi numérico.
    El slider del chart lo capa después al rango que el lector quiera.
  - Mantenemos TODOS los 21664 jugadores (no filtramos top N en data: el
    front recorta por top N elegido por el lector).

Caso Japón documentado: Pantheon HPI penaliza dominancia inglesa-Wikipedia.
J-League menores con artículo solo en ja.wp tienen HPI alto y aparecen
sobre-representados (Japón #1 mundial en top 1000 con 187 jugadores).
El top 1000 default mitiga el efecto; top 10000 lo amplifica.

Run from repo root:
  python 03-futbol/data-sources/build_talento_data.py
"""
from pathlib import Path
import csv
import json
import sys

csv.field_size_limit(2**31 - 1)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PANTHEON_CSV = REPO_ROOT / "_handoff-futbol" / "pantheon_compare" / "person_2025.csv"
OWID_POP_CSV = REPO_ROOT / "_handoff-futbol" / "pantheon_compare" / "owid_pop_extracted" / "population.csv"
JS_OUT = REPO_ROOT / "03-futbol" / "data-talento.js"

# Rango de años útil para el chart. Cortamos extremos donde la data se
# vuelve poco confiable o irrelevante.
YEAR_MIN, YEAR_MAX = 1850, 2015

# Filtro de relevancia mínima: solo jugadores con AL MENOS 5000 page views
# en Wikipedias no-inglesas. Cierra el sesgo "Japón": HPI Pantheon sube
# para perfiles con muchos artículos pero pocas vistas — los J-League
# menores tienen artículos auto-generados por bots en 20+ Wikipedias
# (median l=21), pero median 2000 views totales. Con cutoff 5000 views,
# Japón baja de 162 a 10 en el top 1000 mundial. Pool total 21.6k → 11.7k.
MIN_VIEWS = 5000

# Filtro de género: solo masculino. El dataset SOCCER PLAYER es ~98%
# hombres en práctica. El campo `gender` de Pantheon es POCO confiable
# (clasifica como F a muchos hombres con nombres no-anglosajones: László,
# Friedrich, Zdeněk, etc.), pero al filtrar M ganamos por dos lados:
#   1. Eliminamos esa cohorte de "F mal clasificada" — son ~5% del top 5k
#      que llevan HPI alto y sesgan el ranking.
#   2. Las mujeres reales (Marta HPI 56.5, Mia Hamm 56.3, Rapinoe 51.2)
#      no entraban al top 1000 igual: su HPI máximo está cerca del cutoff.
# Trade-off: si en futuras versiones Pantheon refina el clasificador,
# revisar este filtro porque puede empezar a perder mujeres reales.
ONLY_MALE = True
# Rango de años de población a embeber. El slider del chart se mueve dentro
# de [1900, 2010] por default, pero damos colchón a los extremos.
POP_YEAR_MIN, POP_YEAR_MAX = 1890, 2024

# Overrides para nombres de Pantheon que no matchean OWID directo.
# Filosofía: mapeamos a ISO oficial del estado-sucesor moderno. Misma
# lógica que el handoff del N°3 chart 1 (Elo/PIB).
PANTHEON_TO_ISO = {
    'United States':     'USA',
    'United Kingdom':    'GBR',
    'England':           'GBR',  # raro en Pantheon, lo dejamos por las dudas
    'Scotland':          'GBR',
    'Wales':             'GBR',
    'Northern Ireland':  'GBR',
    'South Korea':       'KOR',
    'North Korea':       'PRK',
    'Czech Republic':    'CZE',
    'Czechia':           'CZE',
    'Russia':            'RUS',
    'Ivory Coast':       'CIV',
    'East Timor':        'TLS',
    'Cape Verde':        'CPV',
    'Burma':             'MMR',
    'Myanmar':           'MMR',
    'Macedonia':         'MKD',
    'North Macedonia':   'MKD',
    'Yugoslavia':        'SRB',  # estado sucesor según FIFA y UN
    'Soviet Union':      'RUS',
    'USSR':              'RUS',
    'East Germany':      'DEU',
    'West Germany':      'DEU',
    'Czechoslovakia':    'CZE',
    'Serbia and Montenegro': 'SRB',
    'Bosnia and Herzegovina': 'BIH',
    'Bosnia-Herzegovina':'BIH',
    'Brunei':            'BRN',
    'Brunei Darussalam': 'BRN',
    'Republic of the Congo': 'COG',
    'Democratic Republic of the Congo': 'COD',
    'DR Congo':          'COD',
    'Congo':             'COG',
    'Vatican City':      'VAT',
    'Palestine':         'PSE',
    'Vietnam':           'VNM',
    'Iran':              'IRN',
    'Syria':             'SYR',
    'Laos':              'LAO',
    'Tanzania':          'TZA',
    'Taiwan':            'TWN',
    'Hong Kong':         'HKG',
    'Macau':             'MAC',
    # Nombres con acentos / diacríticos que el OWID name→iso no captura
    # cuando Pantheon usa una variante distinta:
    'Türkiye':           'TUR',
    'Turkey':            'TUR',
    "Côte d'Ivoire":     'CIV',
    "Cote d'Ivoire":     'CIV',
    'The Gambia':        'GMB',
    'Gambia':            'GMB',
    'Kosovo':            'XKX',
    'Cabo Verde':        'CPV',
    'Curaçao':           'CUW',
    'Curacao':           'CUW',
    'Réunion':           'REU',
    'Reunion':           'REU',
    'São Tomé and Príncipe': 'STP',
    'Sao Tome and Principe': 'STP',
    'Åland Islands':     'ALA',
    'Aland Islands':     'ALA',
}

def load_name_to_iso():
    """Construye name→ISO3 desde la columna Entity/Code de OWID population.csv."""
    name_to_iso = {}
    pop = {}
    with OWID_POP_CSV.open(encoding='utf-8') as fh:
        for r in csv.DictReader(fh):
            ent = (r.get('Entity') or '').strip()
            code = (r.get('Code') or '').strip()
            if ent and code and len(code) == 3:
                name_to_iso[ent] = code
            try:
                year = int(r['Year']); val = float(r['Population'])
            except (ValueError, TypeError):
                continue
            if code and len(code) == 3 and POP_YEAR_MIN <= year <= POP_YEAR_MAX:
                pop.setdefault(code, {})[year] = val
    return name_to_iso, pop


def resolve_iso(name, name_to_iso):
    name = (name or '').strip()
    if not name:
        return None
    if name in PANTHEON_TO_ISO:
        return PANTHEON_TO_ISO[name]
    return name_to_iso.get(name)


def main():
    if not PANTHEON_CSV.exists():
        print(f"ERROR: missing {PANTHEON_CSV}", file=sys.stderr)
        return 1
    if not OWID_POP_CSV.exists():
        print(f"ERROR: missing {OWID_POP_CSV}", file=sys.stderr)
        return 1

    print("loading OWID population...")
    name_to_iso, pop_raw = load_name_to_iso()
    print(f"  unique ISO3s with pop data: {len(pop_raw)}")

    print("loading Pantheon (filter SOCCER PLAYER)...")
    players = []
    unresolved = {}
    skipped_year = 0
    skipped_hpi = 0
    skipped_views = 0
    skipped_gender = 0
    with PANTHEON_CSV.open(encoding='utf-8') as fh:
        for r in csv.DictReader(fh):
            if (r.get('occupation') or '').strip().upper() != 'SOCCER PLAYER':
                continue
            if ONLY_MALE and (r.get('gender') or '').strip() != 'M':
                skipped_gender += 1
                continue
            iso = resolve_iso(r.get('bplace_country'), name_to_iso)
            if not iso:
                unresolved[r.get('bplace_country', '')] = unresolved.get(r.get('bplace_country', ''), 0) + 1
                continue
            try:
                year = int(r['birthyear'])
            except (ValueError, TypeError, KeyError):
                skipped_year += 1
                continue
            if not (YEAR_MIN <= year <= YEAR_MAX):
                skipped_year += 1
                continue
            try:
                hpi = float(r['hpi'])
            except (ValueError, TypeError, KeyError):
                skipped_hpi += 1
                continue
            # Filtro de relevancia mínima — ver constante MIN_VIEWS.
            try:
                views = int(r.get('non_en_page_views') or 0)
            except (ValueError, TypeError):
                views = 0
            if views < MIN_VIEWS:
                skipped_views += 1
                continue
            players.append((iso, year, round(hpi, 2)))

    # Ordenamos por HPI desc para que el front recorte "top N" con un slice
    # (sin tener que ordenar 21k al cargar).
    players.sort(key=lambda x: -x[2])
    print(f"  players kept: {len(players)}")
    print(f"  skipped (year fuera de rango / null): {skipped_year}")
    print(f"  skipped (hpi null): {skipped_hpi}")
    print(f"  skipped (views < {MIN_VIEWS}): {skipped_views}")
    print(f"  skipped (gender != M): {skipped_gender}")
    if unresolved:
        top_unres = sorted(unresolved.items(), key=lambda x: -x[1])[:10]
        print(f"  WARN unresolved bplace_country names (top 10):")
        for name, n in top_unres:
            print(f"    {name!r}: {n}")
        unresolved_total = sum(unresolved.values())
        print(f"  total unresolved players: {unresolved_total}")

    # Filtramos POP a países que tienen players. Reduce peso del JS.
    isos_with_players = {p[0] for p in players}
    pop_filtered = {iso: pop_raw[iso] for iso in isos_with_players if iso in pop_raw}
    print(f"  pop kept for {len(pop_filtered)} countries with players")

    # Reducimos pop a miles para bajar bytes del JS embebido.
    # 50k habitantes → 50 (entero). El chart vuelve a millones al dividir
    # players por (pop_thousands / 1000) = players / pop_millions.
    pop_thousands = {}
    for iso, by_year in pop_filtered.items():
        pop_thousands[iso] = {str(y): round(v / 1000) for y, v in by_year.items()}

    header = (
        "// =============================================================\n"
        "//  El Atlas N°3 — Talento futbolístico per cápita (chart 2)\n"
        "// =============================================================\n"
        "//\n"
        "// PLAYERS_TALENTO: array de [iso3, birth_year, hpi], ordenado por\n"
        "//   hpi descendente. El front toma top N con un .slice(0, N).\n"
        "//   N players totales (~21k filtrados con birthyear+hpi).\n"
        "//\n"
        "// POP_TALENTO: {iso3: {year_str: pop_thousands}} con la serie\n"
        "//   anual OWID de población. Reportada en miles de habitantes\n"
        "//   para reducir bytes (chart divide por miles → per_million =\n"
        "//   N_players / (pop_thousands / 1000) = 1000 * N / pop_thousands).\n"
        "//\n"
        "// Fuente Pantheon: pantheon.world person_2025_update.csv,\n"
        "//   filtrado a occupation == 'SOCCER PLAYER' (~21664 → ~%d kept).\n"
        "// Fuente OWID: ourworldindata.org/grapher/population.csv.\n"
        "// Mapeo bplace_country → ISO3: cruce con OWID + overrides para\n"
        "//   nombres de estados sucesores / UK / etc. Ver build_talento_data.py.\n"
        "//\n"
        "// Auto-generado: no editar a mano. Regenerar con:\n"
        "//   python 03-futbol/data-sources/build_talento_data.py\n"
    ) % len(players)

    # Format compacto: una línea por jugador es overkill, los pasamos como
    # JSON minificado. Lo mismo POP.
    players_json = json.dumps(players, separators=(',', ':'))
    pop_json = json.dumps(pop_thousands, separators=(',', ':'))

    js = (
        header
        + "\nconst PLAYERS_TALENTO = " + players_json + ";\n"
        + "\nconst POP_TALENTO = " + pop_json + ";\n"
    )
    JS_OUT.write_text(js, encoding='utf-8')
    print(f"OK: {JS_OUT.relative_to(REPO_ROOT)} ({len(js)//1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
