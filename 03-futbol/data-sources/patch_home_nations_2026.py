"""Post-proceso de data-elo-series.js (chart 5, trayectorias) — 2026-07-17.

Dos correcciones sobre la salida de build_elo_series.py:

1) HOME NATIONS: el pipeline original (merge_elo.ps1 + elo_config.json) descartaba
   Escocia/Gales/Irlanda del Norte tratandolas como "no-FIFA concurrentes con su
   soberano" y dejaba "Reino Unido = Inglaterra". Pero las cuatro son miembros FIFA
   de pleno derecho. Acá se separan en ENG/SCO/WAL/NIR (todas UEFA) con su serie Elo
   completa de eloratings. (El chart Elo-PIB NO se toca: ahi el PIB viene agregado
   por pais, asi que Reino Unido queda unificado a proposito.)

2) 2026: se refresca el rating/rank de 2026 de TODAS las selecciones con el ultimo
   dato de eloratings.net (la nota del grafico aclara la fecha).

Fuente: eloratings.net/{anio}.tsv (col1=rank, col2=code, col3=rating) + en.teams.tsv
(code->name). Requiere acceso a eloratings.net. Idempotente: se puede volver a correr.

Ojo: el CSV/elo_config.json upstream (en insumos, fuera de git) todavia tienen la
logica vieja; una corrida limpia de build_elo_series.py revierte esto hasta que se
actualice el upstream. Por eso este patch corre DESPUES.
"""
import json, re, ssl, time, urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data-elo-series.js"
ASOF = "2026-07-20"
HN_CODE = {"EN": ("ENG", "Inglaterra", "England"),
           "SQ": ("SCO", "Escocia", "Scotland"),
           "WA": ("WAL", "Gales", "Wales"),
           "EI": ("NIR", "Irlanda del Norte", "Northern Ireland")}
# estados sucesores: iso3 del dataset -> nombre moderno en eloratings (su 'en' es historico)
SUCC = {"BLZ": "Belize", "BEN": "Benin", "MMR": "Myanmar", "KOR": "South Korea",
        "GHA": "Ghana", "GNB": "Guinea-Bissau", "GUY": "Guyana", "IND": "India",
        "IDN": "Indonesia", "MKD": "North Macedonia", "MYS": "Malaysia", "MWI": "Malawi",
        "MLI": "Mali", "CAF": "Central African Republic", "CZE": "Czechia", "COD": "DR Congo",
        "RWA": "Rwanda", "WSM": "Samoa", "VCT": "Saint Vincent and the Grenadines",
        "STP": "Sao Tome and Principe", "SRB": "Serbia", "LKA": "Sri Lanka", "SWZ": "Eswatini",
        "TZA": "Tanzania", "TGO": "Togo", "VNM": "Vietnam", "YEM": "Yemen", "DJI": "Djibouti",
        "ZMB": "Zambia", "ZWE": "Zimbabwe"}

_ctx = ssl.create_default_context(); _ctx.check_hostname = False; _ctx.verify_mode = ssl.CERT_NONE
def _get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (research)"})
            return urllib.request.urlopen(req, context=_ctx, timeout=40).read().decode("utf-8", "replace")
        except Exception:
            if i == tries - 1: raise
            time.sleep(0.8)

def _parse_year(txt):
    out = {}
    for l in txt.split("\n"):
        p = l.split("\t")
        if len(p) >= 4 and p[2].strip() and p[3].strip().lstrip("-").isdigit():
            out[p[2].strip()] = (p[1].strip(), int(p[3].strip()))   # code -> (rank, rating)
    return out

# code -> name
c2n = {}
for l in _get("https://www.eloratings.net/en.teams.tsv").split("\n"):
    p = l.split("\t")
    if len(p) >= 2 and p[0].strip(): c2n[p[0].strip()] = p[1].strip()

# 2026 por nombre
y2026 = _parse_year(_get("https://www.eloratings.net/2026.tsv"))
elo2026 = {c2n.get(code, code): v for code, v in y2026.items()}

# serie completa 1901-2026 de las home nations
hn = {iso: {"elo": {}, "rank": {}} for (_c, (iso, _es, _en)) in [(c, HN_CODE[c]) for c in HN_CODE]}
for yr in range(1901, int(ASOF[:4]) + 1):
    try:
        d = _parse_year(_get(f"https://www.eloratings.net/{yr}.tsv"))
    except Exception:
        continue
    for code, (iso, es, en) in HN_CODE.items():
        if code in d:
            rk, rt = d[code]; hn[iso]["elo"][str(yr)] = rt; hn[iso]["rank"][str(yr)] = int(rk)

# --- aplicar sobre data-elo-series.js ---
series = json.loads(re.search(r"const ELO_SERIES\s*=\s*(\[.*\]);", OUT.read_text(encoding="utf-8"), re.S).group(1))
by_en = {d["en"]: d for d in series}
for name, (rk, rt) in elo2026.items():
    d = by_en.get(name)
    if d: d["elo"]["2026"] = rt; d["rank"]["2026"] = int(rk)
for iso, mod in SUCC.items():
    d = next((x for x in series if x["iso3"] == iso), None)
    if d and mod in elo2026:
        rk, rt = elo2026[mod]; d["elo"]["2026"] = rt; d["rank"]["2026"] = int(rk)

# Sacar el "Reino Unido" (= Inglaterra) Y cualquier home nation ya presente, para que
# el patch sea idempotente al re-correrse sobre su propio output (si no, las duplica).
_hn_iso = {iso for _c, (iso, _es, _en) in HN_CODE.items()}
series = [x for x in series if x["iso3"] != "GBR" and x["iso3"] not in _hn_iso]
for code, (iso, es, en) in HN_CODE.items():
    series.append({"iso3": iso, "name": es, "en": en, "confed": "UEFA",
                   "elo": {y: int(v) for y, v in hn[iso]["elo"].items()},
                   "rank": {y: int(v) for y, v in hn[iso]["rank"].items()}})
series.sort(key=lambda d: d["name"])

js = ("// AUTO-GENERADO (build_elo_series.py + patch_home_nations_2026.py) — no editar a mano.\n"
      "// Serie anual de rating Elo + ranking mundial oficial (eloratings.net), 1901-2026, por seleccion.\n"
      f"// 2026 actualizado desde eloratings.net al {ASOF}. Reino Unido separado en las 4 home nations\n"
      "// FIFA (Inglaterra/Escocia/Gales/Irlanda del Norte).\n"
      "const ELO_SERIES = " + json.dumps(series, ensure_ascii=False, separators=(",", ":")) + ";\n")
OUT.write_text(js, encoding="utf-8")
print(f"OK: {OUT.name} - {len(series)} equipos, {OUT.stat().st_size // 1024} KB")
