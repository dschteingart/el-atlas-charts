#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recupera la CIUDAD de nacimiento de los mundialistas que en el master quedaron sin
ciudad geolocalizada, usando Wikipedia MULTI-IDIOMA (no solo Wikidata, que para
migrantes/nacionalizados a menudo devuelve el país de la SELECCIÓN — ej. Madibo→Catar).

Cadena por jugador (dedup por wd_id):
  1) sitelinks de Wikidata -> en qué wikis tiene artículo.
  2) por idioma (prioridad es,pt,en,it,fr,...): leer el infobox, sacar 'lugar de
     nacimiento' / 'birth_place', tomar el primer [[wikilink]] = la ciudad.
  3) resolver ese título -> Q-id de la ciudad (pageprops) -> Wikidata P625 (coords),
     P31 (tipo), P17 (país). Aceptar solo si es un asentamiento con coords (no país).
Salida: birthplace_recovered.csv (para revisar a ojo ANTES de tocar los charts).

Uso: python recover_birthplaces.py [LIMIT]
"""
import csv, re, json, ssl, sys, time, urllib.request, urllib.parse
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
MASTER = HERE / "mundiales" / "master_consolidado.csv"
OUT = HERE / "birthplace_recovered.csv"
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 0

CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE
UA = {"User-Agent": "ElAtlas-birthplace/0.2 (dschteingart@gmail.com)"}

def api(url):
    for attempt in range(3):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=CTX, timeout=60))
        except Exception as e:
            if attempt == 2: raise
            time.sleep(2)

def chunks(seq, n):
    for i in range(0, len(seq), n): yield seq[i:i+n]

# ---------- 1) jugadores sin ciudad, con wd_id ----------
def pid_of(r): return (r.get("wd_id") or "").strip() or (r.get("player_id") or "").strip() or (r.get("nombre","")+"|"+r.get("ciudad_nac",""))
def geo(r): return bool((r.get("ciudad_nac") or "").strip()) and (r.get("lat_nac") or "").strip()!="" and (r.get("lon_nac") or "").strip()!=""

rows = [r for r in csv.DictReader(open(MASTER, encoding="utf-8")) if 1930 <= int(r["year"]) <= 2026]
P = defaultdict(list)
for r in rows: P[pid_of(r)].append(r)
missing = []
for pid, rs in P.items():
    if any(geo(r) for r in rs): continue
    qid = next((( r.get("wd_id") or "").strip() for r in rs if re.match(r"^Q[0-9]+$", (r.get("wd_id") or "").strip())), None)
    if not qid: continue
    nm = rs[0].get("nombre",""); iso = next((r.get("iso_nacimiento") for r in rs if (r.get("iso_nacimiento") or "").strip()), "")
    missing.append({"qid": qid, "name": nm, "iso": iso})
if LIMIT: missing = missing[:LIMIT]
print(f"Jugadores sin ciudad (con wd_id) a recuperar: {len(missing)}", flush=True)

# ---------- 2) sitelinks ----------
sitelinks = {}
qids = [m["qid"] for m in missing]
for ch in chunks(qids, 50):
    d = api("https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&format=json&ids=" + "|".join(ch))
    for q, ent in d.get("entities", {}).items():
        sitelinks[q] = {k[:-4]: v["title"] for k, v in ent.get("sitelinks", {}).items() if k.endswith("wiki")}
    time.sleep(0.3)

LANG_PRIORITY = ["es","pt","en","it","fr","de","nl","ar","ru","uk","tr","pl","sv","no","da","fi","cs","sk","hu","ro","hr","sr","el","ja","ko","zh","fa","th","id"]

# campos de infobox que suelen tener el lugar de nacimiento, por idioma
BIRTH_FIELDS = [
    r"birth_place", r"place of birth", r"cityofbirth", r"birthplace",
    r"lugar de nacimiento", r"lugar_de_nacimiento", r"lugar_nacimiento", r"lugar nacimiento", r"lugar_nac",
    r"local_nascimento", r"localnascimento", r"naturalidade", r"cidadenatal",
    r"luogonascita", r"luogo di nascita",
    r"lieu de naissance", r"naissance",
    r"geburtsort",
    r"geboorteplaats",
    r"место рождения", r"місце народження",
    r"مكان الميلاد", r"محل تولد",
]

def field_value(wt, field):
    # busca '| field = VALOR' hasta el siguiente '|' a nivel 0 o salto de línea
    m = re.search(r"\|\s*" + re.escape(field) + r"\s*=\s*", wt, re.I)
    if not m: return None
    i = m.end(); depth = 0; out = []
    while i < len(wt):
        c = wt[i]
        if wt[i:i+2] == "{{" or wt[i:i+2] == "[[": depth += 1; out.append(wt[i:i+2]); i += 2; continue
        if wt[i:i+2] == "}}" or wt[i:i+2] == "]]": depth = max(0, depth-1); out.append(wt[i:i+2]); i += 2; continue
        if c == "\n" and depth == 0: break
        if c == "|" and depth == 0: break
        out.append(c); i += 1
    return "".join(out).strip()

def first_link(val):
    # primer [[Destino|...]] que no sea una bandera/archivo
    for m in re.finditer(r"\[\[([^\]\|]+)(?:\|[^\]]*)?\]\]", val):
        tgt = m.group(1).strip()
        if re.match(r"(?i)(file|image|archivo|imagen|categor)", tgt): continue
        return tgt
    return None

def plain_text(val):
    v = re.sub(r"\{\{[^{}]*\}\}", "", val)          # quitar plantillas (banderas)
    v = re.sub(r"\[\[(?:[^\]\|]*\|)?([^\]]+)\]\]", r"\1", v)  # wikilinks -> texto
    v = re.sub(r"<[^>]+>", "", v)                    # tags
    v = re.sub(r"&[a-z]+;", " ", v)
    v = v.split(",")[0]                              # primera parte (ciudad, no país)
    return re.sub(r"\s+", " ", v).strip(" .|-")

# ---------- 3) recorrer idiomas, batch de wikitext ----------
found = {}   # qid -> {lang, via, link/text}
pending = {m["qid"]: m for m in missing}
for lang in LANG_PRIORITY:
    cand = [q for q in list(pending) if lang in sitelinks.get(q, {})]
    if not cand: continue
    title2qid = {}
    for q in cand: title2qid.setdefault(sitelinks[q][lang], q)
    for ch in chunks(list(title2qid), 50):
        d = api(f"https://{lang}.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=" + "|".join(urllib.parse.quote(t) for t in ch))
        norm = {n["to"]: n["from"] for n in d.get("query", {}).get("normalized", [])}
        for pg in d.get("query", {}).get("pages", {}).values():
            t = pg.get("title"); req_t = norm.get(t, t)
            q = title2qid.get(req_t) or title2qid.get(t)
            if not q or "revisions" not in pg: continue
            wt = pg["revisions"][0]["slots"]["main"]["*"]
            val = None
            for f in BIRTH_FIELDS:
                val = field_value(wt, f)
                if val: break
            if not val: continue
            lk = first_link(val)
            if lk:
                found[q] = {"lang": lang, "via": "link", "key": lk}; pending.pop(q, None)
            else:
                txt = plain_text(val)
                if txt and len(txt) > 2:
                    found[q] = {"lang": lang, "via": "text", "key": txt}; pending.pop(q, None)
        time.sleep(0.3)
    print(f"  [{lang}] resueltos acumulado: {len(found)} / pendientes: {len(pending)}", flush=True)

# ---------- 4) resolver título/ texto -> Q-id de ciudad ----------
# 4a) por wikilink: título(lang) -> wikibase_item
city_qid = {}   # qid jugador -> qid ciudad
by_lang = defaultdict(list)
for q, f in found.items():
    if f["via"] == "link": by_lang[f["lang"]].append(q)
for lang, qs in by_lang.items():
    t2players = defaultdict(list)
    for q in qs: t2players[found[q]["key"]].append(q)
    for ch in chunks(list(t2players), 50):
        d = api(f"https://{lang}.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&format=json&redirects=1&titles=" + "|".join(urllib.parse.quote(t) for t in ch))
        norm = {n["to"]: n["from"] for n in d.get("query", {}).get("normalized", [])}
        redir = {n["to"]: n["from"] for n in d.get("query", {}).get("redirects", [])}
        for pg in d.get("query", {}).get("pages", {}).values():
            t = pg.get("title"); req = redir.get(t, t); req = norm.get(req, req)
            cq = pg.get("pageprops", {}).get("wikibase_item")
            if not cq: continue
            for q in t2players.get(req, []) + t2players.get(t, []):
                city_qid[q] = cq
        time.sleep(0.3)
# 4b) por texto: wbsearchentities (baja confianza)
for q, f in found.items():
    if f["via"] != "text" or q in city_qid: continue
    try:
        d = api("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=es&type=item&limit=1&search=" + urllib.parse.quote(f["key"]))
        hit = d.get("search", [])
        if hit: city_qid[q] = hit[0]["id"]
        time.sleep(0.2)
    except Exception: pass

# ---------- 5) ciudad Q-id -> P625 / P31 / P17 / label ----------
COUNTRY_TYPES = {"Q6256","Q3624078","Q3024240","Q1520223","Q7275","Q107390","Q10864048","Q15916867"}
cinfo = {}
ucq = sorted(set(city_qid.values()))
for ch in chunks(ucq, 45):
    d = api("https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims|labels&languages=es|en&format=json&ids=" + "|".join(ch))
    for cq, ent in d.get("entities", {}).items():
        cl = ent.get("claims", {})
        def vals(p): return cl.get(p, [])
        coord = None
        for s in vals("P625"):
            try:
                v = s["mainsnak"]["datavalue"]["value"]; coord = (round(v["latitude"],4), round(v["longitude"],4)); break
            except Exception: pass
        types = set()
        for s in vals("P31"):
            try: types.add(s["mainsnak"]["datavalue"]["value"]["id"])
            except Exception: pass
        ciso = None
        for s in vals("P17"):
            try: ciso = s["mainsnak"]["datavalue"]["value"]["id"]; break
            except Exception: pass
        lab = ent.get("labels", {})
        name = (lab.get("es") or lab.get("en") or {}).get("value", cq)
        cinfo[cq] = {"coord": coord, "types": types, "country_qid": ciso, "label": name}
    time.sleep(0.3)

# país Q-id -> ISO3 (P298) para los que aparezcan
country_iso = {}
ctry_qs = sorted({cinfo[c]["country_qid"] for c in cinfo if cinfo[c]["country_qid"]})
for ch in chunks(ctry_qs, 45):
    d = api("https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids=" + "|".join(ch))
    for cq, ent in d.get("entities", {}).items():
        for s in ent.get("claims", {}).get("P298", []):
            try: country_iso[cq] = s["mainsnak"]["datavalue"]["value"]; break
            except Exception: pass
    time.sleep(0.3)

# ---------- 6) escribir CSV de revisión ----------
n_city = n_country = n_nocoord = n_none = 0
recs = []
for m in missing:
    q = m["qid"]; f = found.get(q); cq = city_qid.get(q); ci = cinfo.get(cq) if cq else None
    if not f: n_none += 1; status = "sin_birthplace_en_wiki"; ci = None
    elif not ci or not ci["coord"]: n_nocoord += 1; status = "ciudad_sin_resolver"
    elif ci["types"] & COUNTRY_TYPES: n_country += 1; status = "solo_pais"
    else: n_city += 1; status = "OK_ciudad"
    recs.append({
        "wd_id": q, "nombre": m["name"], "iso_master": m["iso"], "status": status,
        "lang": f["lang"] if f else "", "via": f["via"] if f else "",
        "ciudad": (ci["label"] if ci else "") if status=="OK_ciudad" else (f["key"] if f else ""),
        "city_qid": cq or "", "pais_ciudad": country_iso.get(ci["country_qid"]) if ci and ci.get("country_qid") else "",
        "lat": ci["coord"][0] if (ci and ci["coord"]) else "", "lon": ci["coord"][1] if (ci and ci["coord"]) else "",
    })
with open(OUT, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=list(recs[0].keys())); w.writeheader(); w.writerows(recs)

print("\n===== RESUMEN =====", flush=True)
print(f"Total a recuperar: {len(missing)}")
print(f"  OK ciudad real con coords : {n_city}")
print(f"  solo país (descartar)     : {n_country}")
print(f"  ciudad sin resolver/coords: {n_nocoord}")
print(f"  sin birthplace en wiki    : {n_none}")
print(f"CSV de revisión: {OUT}")
# muestra de migrantes detectados (ciudad país != iso_master)
print("\nMuestra OK (revisar a ojo):")
shown = 0
for r in recs:
    if r["status"] == "OK_ciudad":
        flag = " <-- MIGRANTE? (nac!=master)" if r["pais_ciudad"] and r["iso_master"] and r["pais_ciudad"]!=r["iso_master"] else ""
        print(f"   {r['nombre']:28s} -> {r['ciudad']}, {r['pais_ciudad']}  ({r['lat']},{r['lon']}) [{r['lang']}/{r['via']}]{flag}")
        shown += 1
        if shown >= 20: break
