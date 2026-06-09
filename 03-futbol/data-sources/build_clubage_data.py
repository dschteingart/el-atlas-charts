# =============================================================
#  El Atlas N°3 — Build data-clubage.js
# =============================================================
#
# Genera el archivo JS embebido del mapa coroplético "año mediano de
# fundación de los clubes" (chart 2 del N°3 fútbol).
#
# Input:  _handoff-futbol/data/futbol_paises.csv  (184 países, ver §3.2 del
#         HANDOFF del bundle: una fila por país con métricas agregadas).
# Output: 03-futbol/data-clubage.js  (const DATA_CLUBAGE = {iso3: {...}}).
#
# Decisión editorial: usamos `mediana_fundacion_pond` — la mediana del año
# de fundación ponderada por relevancia del club, medida como número de
# sitelinks de Wikipedia. Clubes muy referenciados (Boca, Madrid, etc.)
# pesan más que clubes oscuros.
#
# Run from repo root:
#   python 03-futbol/data-sources/build_clubage_data.py
#
# No requiere instalar nada (csv + json puro).

from pathlib import Path
import csv
import json
import re
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CSV_IN = REPO_ROOT / "_handoff-futbol" / "data" / "futbol_paises.csv"
JS_OUT = REPO_ROOT / "03-futbol" / "data-clubage.js"
# Para enriquecer con `confederacion` (no viene en clubs_wikidata_por_pais_v2),
# leemos el data-sports.js que sí tiene {iso3, confed, ...} por país.
SPORTS_JS = REPO_ROOT / "03-futbol" / "data-sports.js"


def _safe_int(s: str):
    """Parse int o devuelve None si está vacío / 'NA'."""
    s = (s or "").strip()
    if not s or s.upper() in ("NA", "N/A", "NULL", "NONE", "-"):
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def _load_confed_map():
    """Lee data-sports.js (formato window.SPORTS=[{iso3,confed,...},...]) y
    devuelve {iso3: confed}. Si el archivo no existe o no parsea, devuelve
    diccionario vacío y los países quedan con confed=''."""
    if not SPORTS_JS.exists():
        return {}
    txt = SPORTS_JS.read_text(encoding="utf-8")
    # Extraer el array JSON entre 'window.SPORTS=' y ';' siguiente.
    m = re.search(r"window\.SPORTS\s*=\s*(\[.*?\]);", txt, flags=re.S)
    if not m:
        return {}
    try:
        arr = json.loads(m.group(1))
    except json.JSONDecodeError:
        return {}
    return {d.get("iso3"): (d.get("confed") or "") for d in arr if d.get("iso3")}


def main() -> int:
    if not CSV_IN.exists():
        print(f"ERROR: no encontre {CSV_IN}", file=sys.stderr)
        return 1

    confed_by_iso = _load_confed_map()

    rows = []
    with CSV_IN.open(encoding="utf-8-sig") as fh:
        rdr = csv.DictReader(fh)
        for r in rdr:
            iso3 = (r.get("iso3") or "").strip()
            if len(iso3) != 3:
                continue
            year = _safe_int(r.get("mediana_fundacion_pond"))
            # Nombres de columna: el CSV de Daniel cambió en la actualización
            # de junio (51.573 clubes vs 41.894). Aceptamos los dos schemas.
            n_clubs = _safe_int(r.get("clubes_total")) or _safe_int(r.get("clubes"))
            n_with_date = (_safe_int(r.get("clubes_con_fecha"))
                           or _safe_int(r.get("n_fecha_valida")))
            country_name = ((r.get("pais") or "").strip()
                            or (r.get("country") or "").strip())
            rows.append({
                "iso3": iso3,
                "name": country_name,
                # confederacion no viene en el CSV nuevo — la traemos del
                # data-sports.js (que sí la mantiene por país).
                "confed": (r.get("confederacion") or "").strip() or confed_by_iso.get(iso3, ""),
                "year_median_pond": year,
                "n_clubs":     n_clubs,
                "n_with_date": n_with_date,
            })

    rows.sort(key=lambda d: d["iso3"])

    # JSON con keys ordenadas para diffs estables.
    payload = {r["iso3"]: {
        "name":   r["name"],
        "confed": r["confed"],
        "year":   r["year_median_pond"],
        "n":      r["n_clubs"],
        "nf":     r["n_with_date"],
    } for r in rows}

    body = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False)

    header = (
        "// =============================================================\n"
        "//  El Atlas N°3 — Mapa coroplético \"año mediano de fundación\"\n"
        "// =============================================================\n"
        "//\n"
        "// AUTO-GENERADO. No editar a mano. Regenerar con:\n"
        "//   python 03-futbol/data-sources/build_clubage_data.py\n"
        "//\n"
        "// Input: _handoff-futbol/data/futbol_paises.csv (184 países).\n"
        "// Campos por país:\n"
        "//   year: año mediano de fundación ponderado por sitelinks de\n"
        "//         Wikipedia (proxy de relevancia del club). null si el\n"
        "//         país no tiene ningún club con fecha conocida.\n"
        "//   n:    cantidad total de clubes del país en el universo Wikidata.\n"
        "//   nf:   cantidad con fecha de fundación conocida (subset de n).\n"
        "//   name: nombre en español (override en country-names.js para EN).\n"
        "//   confed: CONMEBOL / UEFA / CONCACAF / CAF / AFC / OFC.\n"
    )

    out = header + "\nconst DATA_CLUBAGE = " + body + ";\n"
    JS_OUT.write_text(out, encoding="utf-8")

    n_total = len(rows)
    n_with_year = sum(1 for r in rows if r["year_median_pond"] is not None)
    years = [r["year_median_pond"] for r in rows if r["year_median_pond"] is not None]
    print(f"OK: {JS_OUT.relative_to(REPO_ROOT)}")
    print(f"    paises: {n_total} ({n_with_year} con year)")
    if years:
        print(f"    year range: {min(years)} - {max(years)} (median ~{sorted(years)[len(years)//2]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
