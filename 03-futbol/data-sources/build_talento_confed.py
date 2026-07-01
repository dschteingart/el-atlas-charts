# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — Chart 2 (talento per cápita): capa REGIÓN
# =============================================================
# Genera 03-futbol/data-talento-confed.js con dos structs para el toggle
# País ↔ Región (confederación FIFA) del chart 2:
#   CONFED_TALENTO      = {iso3: confed}            (numerador: a qué confed va cada país)
#   POP_CONFED_TALENTO  = {confed: {year: pop_thousands}}
#                         población TOTAL de la confederación = suma de la
#                         población OWID de TODOS sus países miembro (no solo
#                         los que tienen futbolistas). Así la tasa per cápita
#                         por región es la correcta (numerador y denominador
#                         agregados, recién ahí se divide).
#
# El mapeo iso→confed sale del ELO_DATA de la nota técnica (184 países, incluye
# los populosos como PAK/BGD/ETH) + un supplement para los que faltan (Grecia,
# Túnez, Cuba, Corea del Norte, Siria, Congo y territorios).
import csv, json, re, sys
from pathlib import Path
from collections import defaultdict

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                       # 03-futbol/
REPO_ROOT = ROOT.parent
OWID_POP_CSV = REPO_ROOT / "_handoff-futbol" / "pantheon_compare" / "owid_pop_extracted" / "population.csv"
PAPER = ROOT / "paper-excepcionalidad.html"
DATA_TALENTO = ROOT / "data-talento.js"
OUT = ROOT / "data-talento-confed.js"

CONF_ORDER = ['CONMEBOL', 'UEFA', 'CONCACAF', 'CAF', 'AFC', 'OFC']

# iso→confed base: del ELO_DATA de la nota técnica (184 países).
def load_elo_confed():
    txt = PAPER.read_text(encoding="utf-8")
    m = re.search(r"window\.ELO_DATA\s*=\s*(\[.*?\]);", txt, re.S)
    elo = json.loads(m.group(1))
    return {d["iso"]: d["confed"] for d in elo}

# Supplement: países/territorios que el ELO_DATA no trae. Territorios → confed
# geográfica / de afiliación (consistente con el criterio por lugar de nacimiento).
SUPPLEMENT = {
    'GRC': 'UEFA', 'TUN': 'CAF', 'CUB': 'CONCACAF', 'PRK': 'AFC', 'SYR': 'AFC',
    'COG': 'CAF', 'HKG': 'AFC', 'GUM': 'AFC',
    'CUW': 'CONCACAF', 'BMU': 'CONCACAF', 'GLP': 'CONCACAF', 'GUF': 'CONCACAF',
    'MTQ': 'CONCACAF', 'GRL': 'CONCACAF', 'AIA': 'CONCACAF', 'VGB': 'CONCACAF',
    'TCA': 'CONCACAF', 'MSR': 'CONCACAF', 'SXM': 'CONCACAF', 'ABW': 'CONCACAF',
    'FRO': 'UEFA', 'GGY': 'UEFA', 'JEY': 'UEFA', 'IMN': 'UEFA', 'MCO': 'UEFA',
    'XKX': 'UEFA', 'GIB': 'UEFA',
    'NCL': 'OFC', 'PYF': 'OFC', 'COK': 'OFC', 'WSM': 'OFC', 'ASM': 'OFC',
    'REU': 'CAF', 'MYT': 'CAF', 'SHN': 'CAF', 'ESH': 'CAF', 'ERI': 'CAF',
    'PSE': 'AFC', 'PRI': 'CONCACAF',
}

def load_owid_pop():
    """iso3 -> {year:int -> population:float}. Todas las entidades con Code ISO3."""
    pop = defaultdict(dict)
    with OWID_POP_CSV.open(encoding="utf-8") as fh:
        r = csv.DictReader(fh)
        # columnas: Entity, Code, Year, Population (nombres pueden variar)
        cols = {c.lower(): c for c in r.fieldnames}
        code_c = cols.get('code'); year_c = cols.get('year')
        pop_c = next((cols[c] for c in cols if 'pop' in c), None)
        for row in r:
            code = (row.get(code_c) or "").strip()
            if not code or len(code) != 3:   # sólo ISO3 reales (excluye OWID_WRL, continentes)
                continue
            try:
                pop[code][int(row[year_c])] = float(row[pop_c])
            except (ValueError, TypeError):
                pass
    return pop

def main():
    if not OWID_POP_CSV.exists():
        sys.exit(f"ERROR: falta {OWID_POP_CSV}")
    confed = load_elo_confed()
    confed.update(SUPPLEMENT)   # el supplement pisa/agrega
    pop = load_owid_pop()

    # isos con futbolistas (para verificar cobertura del numerador)
    dt = DATA_TALENTO.read_text(encoding="utf-8")
    players = json.loads(re.search(r"PLAYERS_TALENTO\s*=\s*(\[.*?\]);", dt, re.S).group(1))
    pl_iso = set(p[0] for p in players)

    # 1) numerador: confed de cada país con futbolistas
    missing_num = sorted(i for i in pl_iso if i not in confed)
    if missing_num:
        print("OJO — países con futbolistas SIN confed (se pierden del numerador):", missing_num)
    confed_talento = {i: confed[i] for i in confed}   # todo el mapa (numerador usa los que tenga)

    # 2) denominador: población total por confed = suma sobre TODOS los OWID isos con ese confed
    pop_confed = defaultdict(lambda: defaultdict(float))
    years = set()
    for iso, series in pop.items():
        c = confed.get(iso)
        if not c:
            continue
        for y, v in series.items():
            pop_confed[c][y] += v
            years.add(y)
    # a miles y redondeado (como POP_TALENTO)
    pop_confed_out = {c: {str(y): round(pop_confed[c][y] / 1000) for y in sorted(pop_confed[c])}
                      for c in CONF_ORDER if c in pop_confed}

    # OWID isos con población NO mapeados a confed (para chequear que no falte nada grande)
    unmapped = [(iso, max(series.values())) for iso, series in pop.items() if iso not in confed]
    unmapped.sort(key=lambda t: -t[1])
    big_unmapped = [(i, int(p)) for i, p in unmapped if p > 3_000_000]  # > 3M hab
    if big_unmapped:
        print("Países OWID SIN confed con población > 3M (revisar supplement):")
        for i, p in big_unmapped[:40]:
            print(f"   {i}: {p/1e6:.1f}M")

    js = "// Generado por data-sources/build_talento_confed.py — NO editar a mano.\n"
    js += "// Capa REGIÓN del chart 2: iso→confed (numerador) + población total por\n"
    js += "// confederación (denominador, suma de TODOS los países miembro, OWID).\n"
    js += "const CONFED_TALENTO = " + json.dumps(confed_talento, ensure_ascii=False, separators=(",", ":")) + ";\n"
    js += "const POP_CONFED_TALENTO = " + json.dumps(pop_confed_out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    OUT.write_text(js, encoding="utf-8")
    print(f"OK: {OUT.name} ({OUT.stat().st_size//1024} KB) | confed map: {len(confed_talento)} | pop por confed: {list(pop_confed_out)}")
    # sanity: población 2020 por confed
    for c in CONF_ORDER:
        if c in pop_confed_out:
            print(f"   {c}: pob 2020 ~ {pop_confed_out[c].get('2020','?')} mil")

if __name__ == "__main__":
    main()
