"""Build data-country-geo.js from Natural Earth admin-0.

Decision: Natural Earth instead of GADM because GADM leaves Kashmir and
Tibet as unassigned gaps between India/Pakistan/China. NE has India up
to lat ~35.5 (covers Kashmir) and China up to ~53.5 (covers Tibet) with
no gaps. Bonus: NE is public domain (GADM is non-commercial).

Pipeline:
  1. Read ne_admin0.geojson from the talento_handoff bundle.
  2. Filter to countries we care about (use ADM0_A3, drop sub-units with
     ADM0_A3 == '-99' that aren't full polities — Antarctica claims, etc.).
  3. Merge Falkland Islands (FLK) into Argentina's MultiPolygon, per
     editorial decision (same convention as the talento pipeline).
  4. Simplify geometries with shapely (tolerance ~0.05 deg) — drops file
     size from ~80MB to ~2MB without visible quality loss at world scale.
  5. Emit as const GEO_COUNTRIES = {...} (minified, single line, ~2MB).

Run from repo root:
  python 03-futbol/data-sources/build_country_geo.py
"""
from pathlib import Path
import json
import sys

try:
    from shapely.geometry import shape, mapping
    from shapely.ops import unary_union
except ImportError:
    print("ERROR: este script requiere shapely (pip install shapely).", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
NE_IN = Path(r"C:\Users\FUNDAR\Documents\MEGAsync\substack\el-atlas\insumos\#3 - Futbol"
             r"\talento_handoff_extract\data\ne_admin0.geojson")
JS_OUT = REPO_ROOT / "03-futbol" / "data-country-geo.js"

# Tolerance de simplificación (grados decimales). 0.02° ~= 2.2 km en
# el ecuador. Bajamos de 0.05° (original) porque a 0.05° aparecían slivers
# entre India y Pakistán en Cachemira (zona de frontera muy delgada en NE):
# las geometrías originales casi se tocan, pero el Douglas-Peucker a 0.05°
# las separa visualmente. Con 0.02° los bordes quedan pegados.
SIMPLIFY_TOL = 0.02

# Mapeo de iso3 propietario → iso3 fusionado. Edit calls:
#   "FLK" → "ARG"  : Malvinas como parte de Argentina.
#   "SOL" → "SOM"  : Somalilandia como parte de Somalia (decisión política
#                    consistente con el FIFA/ISO oficial; SOL no es miembro
#                    independiente reconocido).
# El script absorbe la geometría del origen al destino y descarta el origen.
MERGE_INTO = {
    "FLK": "ARG",
    "SOL": "SOM",
}

# NE usa códigos no-estándar para algunos países. Mapeamos al ISO 3166-1
# oficial donde existe, para que country-names.js y data-clubage.js los
# matcheen. Para zonas disputadas SIN ISO oficial (KAS = Cachemira,
# CYN = Chipre del Norte, SOL = Somalilandia) inventamos un código y los
# manejamos como territorios separados visibles en el mapa.
ISO_RENAME = {
    "KOS": "XKX",   # Kosovo
    "SAH": "ESH",   # Sahara Occidental
    "PSX": "PSE",   # Palestina
    "IOA": "IOT",   # British Indian Ocean Territory
    "ALD": "ALA",   # Åland Islands
    "SDS": "SSD",   # Sudán del Sur (NE algunas veces emite SDS)
    # Zonas disputadas SIN ISO oficial — mantenemos el código NE (es
    # único y consistente). country-names.js debe tener entradas para
    # estos: KAS, CYN, SOL.
}


def get_iso3(props):
    """Devuelve el ISO3 más confiable de un feature NE."""
    for key in ("ADM0_A3", "ISO_A3_EH", "ISO_A3", "SOV_A3"):
        v = props.get(key)
        if v and v != "-99" and len(v) == 3:
            return v
    return None


def main():
    if not NE_IN.exists():
        print(f"ERROR: missing {NE_IN}", file=sys.stderr)
        return 1

    raw = json.loads(NE_IN.read_text(encoding="utf-8"))
    print(f"loaded NE: {len(raw['features'])} features")

    # Group features by ISO3 — un país puede tener múltiples features (sub-
    # unidades), pero queremos una entrada por ISO3.
    by_iso = {}
    skipped = 0
    for f in raw["features"]:
        iso = get_iso3(f.get("properties", {}))
        if not iso:
            skipped += 1
            continue
        # Rename NE-specific codes a ISO oficial.
        iso = ISO_RENAME.get(iso, iso)
        # Si el ISO está en MERGE_INTO, redirige al destino.
        iso = MERGE_INTO.get(iso, iso)
        by_iso.setdefault(iso, []).append(f["geometry"])
    print(f"unique ISO3s: {len(by_iso)} (skipped {skipped} without iso3)")
    print(f"merges applied: {MERGE_INTO}")

    # Build the output feature collection.
    out_features = []
    for iso in sorted(by_iso):
        geoms = [shape(g) for g in by_iso[iso] if g]
        if not geoms:
            continue
        merged = unary_union(geoms) if len(geoms) > 1 else geoms[0]
        # Simplify (preserves topology of MultiPolygon).
        merged = merged.simplify(SIMPLIFY_TOL, preserve_topology=True)
        if merged.is_empty:
            continue
        out_features.append({
            "type": "Feature",
            "id": iso,
            "properties": {"iso": iso},
            "geometry": mapping(merged),
        })

    # LANDMASK: unión de TODA la tierra del shape, como un único feature.
    # El renderer lo pinta DEBAJO de los países en color "sin dato" (gris).
    # Resuelve los slivers (Cachemira entre IND/PAK, costa de Sahara
    # Occidental, etc.) sin tener que perfeccionar las geometrías
    # individuales: donde dos países no se tocan exactamente, lo que se ve
    # es el land mask gris, no el fondo crema del SVG. Visualmente queda
    # como "esa zona no tiene datos" en lugar de "hueco extraño".
    print("computing landmask (unary union of all features)...")
    all_geoms = [shape(f["geometry"]) for f in out_features]
    landmask = unary_union(all_geoms)
    # Simplify una vez más (el union puede dejar polígonos densos).
    landmask = landmask.simplify(SIMPLIFY_TOL, preserve_topology=True)
    landmask_feature = {
        "type": "Feature",
        "id": "_LANDMASK",
        "properties": {"iso": "_LANDMASK"},
        "geometry": mapping(landmask),
    }

    out_geo = {
        "type": "FeatureCollection",
        "features": out_features,
        # Sacamos landmask del array principal y lo emitimos como propiedad
        # custom para que el renderer lo trate distinto (pintarlo SOLO,
        # no incluirlo en el loop de hover ni en el sort por área).
        "landmask": landmask_feature,
    }

    header = (
        "// =============================================================\n"
        "//  El Atlas N°3 — Geometría nacional para el mapa coroplético\n"
        "// =============================================================\n"
        "//\n"
        "// FeatureCollection con un feature por país. id = ISO3.\n"
        "//\n"
        "// Fuente: Natural Earth admin-0 (escala 1:10m, public domain).\n"
        "//   - Cubre Cachemira (lat hasta 35.5 en India) y Tíbet (China\n"
        "//     hasta 53.5), sin gaps territoriales como el shape GADM.\n"
        "//   - Malvinas (FLK) fusionadas dentro de Argentina (ARG) en\n"
        "//     este script (decisión editorial).\n"
        f"//   - Simplificado con shapely (tolerance {SIMPLIFY_TOL}°) para\n"
        f"//     bajar peso de ~80 MB a ~2 MB sin pérdida visible a escala\n"
        "//     mundial. Si se ve pixelado en zoom alto, bajar SIMPLIFY_TOL.\n"
        "//\n"
        f"// Features: {len(out_features)}.\n"
        "//\n"
        "// Auto-generado: no editar a mano. Regenerar con:\n"
        "//   python 03-futbol/data-sources/build_country_geo.py\n"
    )

    body = json.dumps(out_geo, ensure_ascii=False, separators=(',', ':'))
    js = header + "\nconst GEO_COUNTRIES = " + body + ";\n"
    JS_OUT.write_text(js, encoding="utf-8")
    size_kb = len(js) // 1024
    print(f"OK: {JS_OUT.relative_to(REPO_ROOT)} ({size_kb} KB, {len(out_features)} features)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
