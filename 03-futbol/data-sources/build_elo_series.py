# =============================================================
#  El Atlas N°3 — Build data-elo-series.js  (chart 5)
# =============================================================
# Input:  insumos/#3 - Futbol/elo_ratings_iso3_1901-2026.csv
#         (long: year, iso3, country_today, team, rating, rank)
# Output: 03-futbol/data-elo-series.js
#         const ELO_SERIES = [{iso3, name, en, confed, elo:{y:v}, rank:{y:v}}]
#
# El rating y el RANK oficial (mundial) vienen del CSV — no se recomputan.
# La confederación se toma de data-elo-pib.js (184) + un supplement para los
# 11 equipos que ese dataset no incluye.
import csv, re, json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]          # el-atlas-charts
EL_ATLAS = REPO.parent                               # el-atlas
CSV = EL_ATLAS / "insumos" / "#3 - Futbol" / "elo_ratings_iso3_1901-2026.csv"
PIB = REPO / "03-futbol" / "data-elo-pib.js"
OUT = REPO / "03-futbol" / "data-elo-series.js"

# confed desde data-elo-pib.js
pib_txt = PIB.read_text(encoding="utf-8")
pib = json.loads(re.search(r"DATA_ELO_PIB\s*=\s*(\[.*\]);", pib_txt, re.S).group(1))
confed = {d["iso3"]: d["confed"] for d in pib}
# supplement para los 11 que no estan en data-elo-pib. Mónaco y Vaticano NO son
# miembros FIFA -> sin confederación.
SUPP = {"COG":"CAF","CUB":"CONCACAF","ERI":"CAF","GRC":"UEFA","MCO":"",
        "PRK":"AFC","PSE":"AFC","SYR":"AFC","TUN":"CAF","VAT":"","XKS":"UEFA"}
confed.update({k:v for k,v in SUPP.items()})

teams = {}
for r in csv.DictReader(open(CSV, encoding="utf-8-sig")):
    iso = r["iso3"]; y = r["year"]
    t = teams.setdefault(iso, {"iso3": iso, "name": r["country_today"],
                               "en": r["team"], "confed": confed.get(iso, ""),
                               "elo": {}, "rank": {}})
    t["elo"][y] = int(round(float(r["rating"])))
    t["rank"][y] = int(r["rank"])

# orden alfabético por nombre es (estable para diffs)
out = sorted(teams.values(), key=lambda d: d["name"])
js = "// AUTO-GENERADO por 03-futbol/data-sources/build_elo_series.py — no editar a mano.\n"
js += "// Serie anual de rating Elo + ranking mundial oficial (eloratings.net), 1901-2026,\n"
js += "// por selección. Fuente del rank: columna 'rank' del CSV (mundial, no recomputado).\n"
js += "const ELO_SERIES = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
OUT.write_text(js, encoding="utf-8")
print("OK:", OUT.name, "-", len(out), "equipos,", OUT.stat().st_size//1024, "KB")
# sanity
arg = next(d for d in out if d["iso3"]=="ARG")
print("ARG 2022:", arg["elo"].get("2022"), "rank", arg["rank"].get("2022"), "| 1980:", arg["elo"].get("1980"), "| confed", arg["confed"])
print("años ARG:", min(arg["elo"]), "-", max(arg["elo"]))
