# -*- coding: utf-8 -*-
# =============================================================
#  El Atlas N°3 — país de NACIMIENTO de los DTs (vía Wikidata)
# =============================================================
# El chart de DTs (chart 10) debe atribuir por país de nacimiento real, como el
# chart 9 (jugadores), no por la "nacionalidad/home country" de jfjelstul (que
# es inconsistente: a veces nacimiento, a veces nacionalidad adoptada).
#
# Para cada DT (jfjelstul tiene su link de Wikipedia) resolvemos el Q de Wikidata
# (la API de Wikipedia resuelve redirects) y de ahí P19 (lugar de nacimiento) →
# P17 (país) → P298 (ISO3). Igual que el chart 9: país MODERNO (Belgrado→Serbia).
#   - Reino Unido: P17 da "United Kingdom" (GBR); lo dividimos en sus naciones
#     futbolísticas (Inglaterra/Escocia/Gales/Irlanda del Norte) vía P131* (en qué
#     entidad administrativa está el lugar de nacimiento), como hace el chart 9.
#   - Algunos países dan label pero no P298 (quirk de "Reino de los Países Bajos",
#     etc.) → LABEL2ISO. Sin lugar de nacimiento en Wikidata → lo resuelve el build
#     con fallback a jfjelstul.
#
# Salidas:
#   - jfjelstul/managers_birthcountry.csv  (histórico: manager_id → birth_iso3)
#   - actualiza jfjelstul/managers_2026.csv (agrega/actualiza birth_iso3)
#
# SSL: la máquina tiene un CA corporativo mal configurado → contexto sin verificar
# (solo lectura de datos públicos de Wikidata/Wikipedia, sin credenciales).
import urllib.request, urllib.parse, json, ssl, csv, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "jfjelstul"
CTX = ssl._create_unverified_context()
UA = {"User-Agent": "ElAtlas-DTs/1.0 (dschteingart@gmail.com)"}
UK = {"Q21": "ENG", "Q22": "SCO", "Q25": "WAL", "Q26": "NIR"}   # naciones del RU
LABEL2ISO = {"Netherlands": "NLD", "Kingdom of the Netherlands": "NLD",
             "Kingdom of Denmark": "DNK", "Allied-occupied Germany": "DEU"}

def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90, context=CTX))

def wp_qids(titles):
    """Títulos de Wikipedia EN → Q de Wikidata (resuelve redirects)."""
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "pageprops",
        "ppprop": "wikibase_item", "redirects": "1", "titles": "|".join(titles)})
    d = get(url)["query"]
    norm = {x["from"]: x["to"] for x in d.get("normalized", [])}
    redir = {x["from"]: x["to"] for x in d.get("redirects", [])}
    bt = {p["title"]: p.get("pageprops", {}).get("wikibase_item") for p in d.get("pages", {}).values()}
    return {t: bt.get(redir.get(norm.get(t, t), norm.get(t, t))) for t in titles}

def birthplaces(qids):
    """Q de persona → (iso3, country_label). Divide UK por nación vía P131*."""
    iso, lbl, ukpart = {}, {}, {}
    qids = sorted(set(qids))
    for i in range(0, len(qids), 150):
        vals = " ".join("wd:" + q for q in qids[i:i+150])
        query = ("SELECT ?person ?iso3 ?countryLabel ?ukpart WHERE { VALUES ?person { " + vals + " } "
                 "?person wdt:P19 ?pob . ?pob wdt:P17 ?c . "
                 "OPTIONAL { ?c wdt:P298 ?iso3 . } "
                 "OPTIONAL { ?pob wdt:P131* ?ukpart . VALUES ?ukpart { wd:Q21 wd:Q22 wd:Q25 wd:Q26 } } "
                 'SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }')
        url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode({"query": query, "format": "json"})
        for b in get(url)["results"]["bindings"]:
            q = b["person"]["value"].rsplit("/", 1)[-1]
            if b.get("iso3"): iso[q] = b["iso3"]["value"]
            if b.get("countryLabel"): lbl[q] = b["countryLabel"]["value"]
            if b.get("ukpart"): ukpart[q] = b["ukpart"]["value"].rsplit("/", 1)[-1]
        time.sleep(0.3)
    out = {}
    for q in qids:
        if q in ukpart and ukpart[q] in UK: out[q] = (UK[ukpart[q]], lbl.get(q, ""))   # RU → nación
        elif q in iso: out[q] = (iso[q], lbl.get(q, ""))
        elif lbl.get(q) in LABEL2ISO: out[q] = (LABEL2ISO[lbl[q]], lbl[q])
        else: out[q] = ("", lbl.get(q, ""))   # sin iso3 → fallback en el build
    return out

def title_of(link):
    return urllib.parse.unquote(link.rsplit("/wiki/", 1)[-1]).replace("_", " ")

# --- 1) histórico: managers.csv -----------------------------------------------
mrows = list(csv.DictReader(open(SRC / "managers.csv", encoding="utf-8")))
m_titles = {r["manager_id"]: title_of(r["manager_wikipedia_link"]) for r in mrows}
t2q = {}
allt = list(set(m_titles.values()))
for i in range(0, len(allt), 50):
    t2q.update(wp_qids(allt[i:i+50])); time.sleep(0.2)
mid2q = {mid: t2q.get(t) for mid, t in m_titles.items()}
bp = birthplaces([q for q in mid2q.values() if q])
with open(SRC / "managers_birthcountry.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f); w.writerow(["manager_id", "qid", "birth_country", "birth_iso3"])
    for mid in (r["manager_id"] for r in mrows):
        q = mid2q.get(mid); i, l = bp.get(q, ("", "")) if q else ("", "")
        w.writerow([mid, q or "", l, i])
got = sum(1 for mid in mid2q if (lambda q: q and bp.get(q, ("",""))[0])(mid2q[mid]))
print(f"histórico: {len(mrows)} DTs | con país de nacimiento: {got} | fallback: {len(mrows)-got}")

# --- 2) 2026: managers_2026.csv (actualiza birth_iso3) ------------------------
rows26 = list(csv.DictReader(open(SRC / "managers_2026.csv", encoding="utf-8")))
t2q26 = {}
ct = list({r["coach"] for r in rows26})
for i in range(0, len(ct), 50):
    t2q26.update(wp_qids(ct[i:i+50])); time.sleep(0.2)
bp26 = birthplaces([q for q in t2q26.values() if q])
out26, changed = [], 0
for r in rows26:
    q = t2q26.get(r["coach"]); i, l = bp26.get(q, ("", "")) if q else ("", "")
    birth = i or r["nat_iso"]; src = "wikidata" if i else "fallback-jf"
    if birth != r["nat_iso"]: changed += 1
    out26.append({"team_iso": r["team_iso"], "nat_iso": r["nat_iso"], "birth_iso3": birth,
                  "coach": r["coach"], "birth_src": src})
with open(SRC / "managers_2026.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["team_iso", "nat_iso", "birth_iso3", "coach", "birth_src"])
    w.writeheader(); w.writerows(out26)
print(f"2026: 48 DTs | nacimiento != nacionalidad en {changed}")
