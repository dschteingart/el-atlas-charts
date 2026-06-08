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
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CSV_IN = REPO_ROOT / "_handoff-futbol" / "data" / "futbol_paises.csv"
JS_OUT = REPO_ROOT / "03-futbol" / "data-clubage.js"


def _safe_int(s: str):
    """Parse int o devuelve None si está vacío / 'NA'."""
    s = (s or "").strip()
    if not s or s.upper() in ("NA", "N/A", "NULL", "NONE", "-"):
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def main() -> int:
    if not CSV_IN.exists():
        print(f"ERROR: no encontre {CSV_IN}", file=sys.stderr)
        return 1

    rows = []
    with CSV_IN.open(encoding="utf-8") as fh:
        rdr = csv.DictReader(fh)
        for r in rdr:
            iso3 = (r.get("iso3") or "").strip()
            if len(iso3) != 3:
                continue
            year = _safe_int(r.get("mediana_fundacion_pond"))
            rows.append({
                "iso3": iso3,
                "name": (r.get("pais") or "").strip(),
                "confed": (r.get("confederacion") or "").strip(),
                # year_median_pond: AÑO mediano (no antigüedad). Es el campo
                # que pinta el color del mapa. Puede ser None si el país no
                # tiene ningun club con fecha conocida.
                "year_median_pond": year,
                "n_clubs":     _safe_int(r.get("clubes_total")),
                "n_with_date": _safe_int(r.get("clubes_con_fecha")),
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
