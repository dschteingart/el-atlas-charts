"""
Genera los datos del Grafico 3 (deciles + percentiles mundiales, El Atlas N2).

Para cada ano del slider Y in [1990..2025]:
  - Por cada pais: ultima observacion de shares de decil dentro de la ventana
    [Y-15, Y]. Preferir reporting_level=national; priority {national:3,
    urban:2, rural:1}.
  - Usar mean interpolado del ano Y (pip_medias_interpoladas.csv). Preferir
    mismo welfare_type que la encuesta de shares y mismo reporting_level.
  - Ingreso decil_i = shares[decile_i] * mean_Y * 10
  - Bins globales del ano: cada (pais, decil) aporta pop_pais_Y / 10 al bin
    con ingreso = income_decil. Sort por ingreso, acumular pop, calcular
    percentil mundial para cada decil-pais.

Salida: data-deciles.json con data_by_year (1990-2025).

NOTA Windows: este script evita unicode raro en prints (cp1252) y abre todos
los archivos con encoding='utf-8'.
"""

import csv
import json
import zipfile
import io
import bisect
from collections import defaultdict

PIP_FILE = "pip_gini_deciles_observados.csv"
MEDIAS_FILE = "pip_medias_interpoladas.csv"
POP_ZIP = "population_un.zip"
OUTPUT = "data-deciles.json"
YEARS = list(range(1990, 2026))     # 1990..2025
WINDOW = 15

PRIORITY = {"national": 3, "urban": 2, "rural": 1}


# 1) Cargar todas las observaciones de shares de decil.
#    Estructura: shares_obs[code] = list of dicts (year, reporting_level,
#    welfare_type, shares, mean_obs, region, country_name, gini)
def load_shares():
    shares_obs = defaultdict(list)
    with open(PIP_FILE, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                year = int(row["year"])
            except (ValueError, KeyError):
                continue
            code = row["country_code"]
            shares = [float(row[f"decile{i}"]) for i in range(1, 11)]
            shares_obs[code].append({
                "year": year,
                "reporting_level": row["reporting_level"],
                "welfare_type": row["welfare_type"],
                "shares": shares,
                "mean_obs": float(row["mean"]),
                "region": row["region_name"],
                "country_name": row["country_name"],
                "gini": float(row["gini"]) if row["gini"] else None,
            })
    return shares_obs


# 2) Cargar todos los means interpolados por (code, year, welfare, level).
#    means[code][year] = list of dicts (welfare_type, reporting_level, mean)
def load_means():
    means = defaultdict(lambda: defaultdict(list))
    with open(MEDIAS_FILE, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                year = int(row["year"])
            except (ValueError, KeyError):
                continue
            code = row["country_code"]
            means[code][year].append({
                "welfare_type": row["welfare_type"],
                "reporting_level": row["reporting_level"],
                "mean": float(row["mean"]),
            })
    return means


# 3) Cargar poblacion por (code, year).
def load_pop():
    pop = defaultdict(dict)  # pop[code][year] = int
    with zipfile.ZipFile(POP_ZIP) as zf:
        with zf.open("population.csv") as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"))
            for row in reader:
                try:
                    year = int(row["Year"])
                except (ValueError, KeyError):
                    continue
                if year < 1990 or year > 2030:
                    continue
                code = row.get("Code", "")
                if not code:
                    continue
                try:
                    pop[code][year] = int(row["Population"])
                except (ValueError, KeyError):
                    continue
    return pop


# 4) Para un pais y ano Y, seleccionar la mejor observacion de shares dentro
#    de la ventana [Y-15, Y]. Estrategia: encontrar el ano observado mas
#    reciente <= Y dentro de la ventana; si ese ano tiene multiples niveles,
#    elegir por priority {national, urban, rural}.
def select_shares_obs(obs_list, Y):
    candidates = [o for o in obs_list if Y - WINDOW <= o["year"] <= Y]
    if not candidates:
        return None
    # Ordenar por (year desc, priority desc).
    candidates.sort(
        key=lambda o: (o["year"], PRIORITY.get(o["reporting_level"], 0)),
        reverse=True,
    )
    return candidates[0]


# 5) Para un pais y ano Y, encontrar el mean interpolado de Y. Preferir
#    mismo welfare_type que el de la observacion de shares; preferir mismo
#    reporting_level. Si no hay mean para el ano Y exacto, devolver None.
def select_mean(means_for_code, Y, prefer_welfare, prefer_level):
    candidates = means_for_code.get(Y, [])
    if not candidates:
        return None

    def score(m):
        s = 0
        if m["welfare_type"] == prefer_welfare:
            s += 10
        if m["reporting_level"] == prefer_level:
            s += 5
        # Como tiebreak final, priority del level (mas peso a national).
        s += PRIORITY.get(m["reporting_level"], 0) * 0.1
        return s

    candidates_sorted = sorted(candidates, key=score, reverse=True)
    return candidates_sorted[0]


def percentile_at(income, sorted_incomes, cumpops, sorted_pops, total_pop):
    """Percentil mundial al que corresponde un ingreso dado."""
    i = bisect.bisect_left(sorted_incomes, income)
    if i >= len(sorted_incomes):
        return 99.99
    if i == 0:
        return cumpops[1] / 2 / total_pop * 100
    if abs(sorted_incomes[i] - income) < 1e-9:
        return (cumpops[i] + sorted_pops[i] / 2) / total_pop * 100
    return cumpops[i] / total_pop * 100


def get_pop(pop, code, Y):
    """Devuelve poblacion para (code, Y), con fallback al ano mas reciente
    disponible si Y no esta cubierto (el dataset UN llega hasta ~2023)."""
    p = pop.get(code, {})
    if not p:
        return None
    if Y in p:
        return p[Y]
    # Fallback: ano mas reciente <= Y disponible
    candidates = [y for y in p if y <= Y]
    if not candidates:
        # Si no hay nada <= Y (raro), tomamos el mas viejo disponible
        return None
    return p[max(candidates)]


def build_year(Y, shares_obs, means, pop):
    """Construye el dataset del ano Y."""
    selected = {}  # code -> (obs, mean_record)
    for code, obs_list in shares_obs.items():
        obs = select_shares_obs(obs_list, Y)
        if obs is None:
            continue
        mean_rec = select_mean(
            means[code], Y, obs["welfare_type"], obs["reporting_level"]
        )
        if mean_rec is None:
            continue
        selected[code] = (obs, mean_rec)

    # Construir bins globales: cada decil-pais aporta pop/10 al bin
    bins = []
    for code, (obs, mean_rec) in selected.items():
        P = get_pop(pop, code, Y)
        if not P or P == 0:
            continue
        mean_d = mean_rec["mean"]
        pop_decil = P / 10
        for i in range(10):
            income_decil = obs["shares"][i] * mean_d * 10
            bins.append((income_decil, pop_decil, code, i + 1))

    if not bins:
        return None

    total_pop = sum(b[1] for b in bins)
    bins.sort(key=lambda x: x[0])
    sorted_incomes = [b[0] for b in bins]
    sorted_pops = [b[1] for b in bins]
    cumpops = [0]
    acc = 0
    for p in sorted_pops:
        acc += p
        cumpops.append(acc)

    countries = {}
    for code, (obs, mean_rec) in selected.items():
        P = get_pop(pop, code, Y)
        if not P or P == 0:
            continue
        mean_d = mean_rec["mean"]
        deciles = []
        for i in range(10):
            income = obs["shares"][i] * mean_d * 10
            pct = percentile_at(
                income, sorted_incomes, cumpops, sorted_pops, total_pop
            )
            deciles.append({
                "decile": i + 1,
                "income_daily_ppp": round(income, 2),
                "world_percentile": round(pct, 2),
            })
        countries[code] = {
            "name": obs["country_name"],
            "region": obs["region"],
            "welfare_type": obs["welfare_type"],
            "reporting_level": mean_rec["reporting_level"],
            "year_obs": obs["year"],
            "mean_daily_ppp": round(mean_d, 2),
            "deciles": deciles,
        }

    return {
        "countries": countries,
        "total_world_pop_billions": round(total_pop / 1e9, 3),
        "n_countries": len(countries),
    }


def main():
    print("Cargando shares...")
    shares_obs = load_shares()
    print(f"  paises con shares: {len(shares_obs)}")
    print("Cargando means interpolados...")
    means = load_means()
    print(f"  paises con means: {len(means)}")
    print("Cargando poblacion...")
    pop = load_pop()
    print(f"  paises con poblacion: {len(pop)}")

    data_by_year = {}
    for Y in YEARS:
        result = build_year(Y, shares_obs, means, pop)
        if result is None:
            print(f"  {Y}: sin datos")
            continue
        data_by_year[str(Y)] = result
        print(
            f"  {Y}: {result['n_countries']} paises, "
            f"{result['total_world_pop_billions']:.2f}B pop"
        )

    out = {
        "data_by_year": data_by_year,
        "years": YEARS,
        "latest_year": YEARS[-1],
    }

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n-> {OUTPUT}")

    # Verificacion: 5 paises clave del N2 en el ano final
    if str(YEARS[-1]) in data_by_year:
        countries = data_by_year[str(YEARS[-1])]["countries"]
        for code in ["NOR", "PRT", "CHL", "ARG", "BRA", "NER"]:
            if code in countries:
                c = countries[code]
                d1 = c["deciles"][0]
                d10 = c["deciles"][9]
                print(
                    f"  {code} ({c['name']}, year_obs={c['year_obs']}): "
                    f"D1=${d1['income_daily_ppp']:.2f} (p{d1['world_percentile']:.0f}), "
                    f"D10=${d10['income_daily_ppp']:.2f} (p{d10['world_percentile']:.0f})"
                )


if __name__ == "__main__":
    main()
