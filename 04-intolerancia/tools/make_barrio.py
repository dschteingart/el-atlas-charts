# -*- coding: utf-8 -*-
"""Genera data-barrio.js: perfil de la bateria H002 "frecuencia en tu barrio"
(chart 8 del N.5, clon de perfil.js).  Patron: make_waves.py / make_all_datajs.py.

Bateria H002 (WVS puro, olas 6 y 7):
  H002_01 robos            H002_02 alcohol en la via publica
  H002_03 la policia se mete en la vida privada   H002_04 conductas racistas
  H002_05 venta de droga
Escala 1..4 INVERTIDA (1 = Very frequently). Indicador = % que responde {1,2}
"muy/bastante seguido" sobre el total de respuestas validas {1,2,3,4}, ponderado
por S017. Ese indicador ya viene calculado (columna pct) en ivs_discrim_largo.csv;
aca se reagrupa por item x ola y se le agrega el PUESTO MUNDIAL de cada pais.

Un promedio de la escala 1-4 daria el ranking al reves (1 = mas frecuente): por eso
se usa el % {1,2}, no el promedio.

Salida  data-barrio.js:
  BA_ITEMS   : orden de los 5 items (slugs).
  BA_META    : {waves:[{w,label}], n_countries:{w:N}, items:{slug:{var,es,en}}}.
               n_countries[w] = universo = paises con los 5 items en esa ola
               (denominador del "X de N"); years salen del rango real por ola.
  BA_FOTO[slug][wave] = [[iso3, pct, year, rank, n], ...] asc por pct.
               rank = puesto mundial, 1 = el % mas alto (mas saliente). Se calcula
               con precision plena y sobre el universo de esa ola.
  BA_REGION[iso3] = region Atlas (para el color de la barra).

El universo de ranking se restringe a los paises con los 5 items en la ola, para
que el "X de N" sea coherente item por item (mismo N para las 5 barras).
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ivs_discrim_largo.csv")
OUT = os.path.join(HERE, "..", "data-barrio.js")

WAVES = [6, 7]
# slug -> (variable IVS, label ES, label EN)
ITEMS = {
    "robos":    ("H002_01", "Robos",                                "Robberies"),
    "alcohol":  ("H002_02", "Alcohol en la vía pública",            "Alcohol drunk in the street"),
    "policia":  ("H002_03", "La policía se mete en la vida privada","Police intrude on private life"),
    "racismo":  ("H002_04", "Conductas racistas",                   "Racist behaviour"),
    "droga":    ("H002_05", "Venta de droga en la calle",           "Drug dealing in the street"),
}
VAR2SLUG = {v[0]: k for k, v in ITEMS.items()}
ORDER = list(ITEMS.keys())

d = pd.read_csv(SRC)
h = d[d["var"].isin(VAR2SLUG)].copy()
h["slug"] = h["var"].map(VAR2SLUG)

region = dict(h.drop_duplicates("iso3")[["iso3", "region"]].values.tolist())

foto = {s: {} for s in ORDER}
meta_waves, n_countries = [], {}
for w in WAVES:
    hw = h[h.wave == w]
    # universo: paises con los 5 items en esa ola (denominador del "X de N")
    cnt = hw.groupby("iso3")["var"].nunique()
    universe = set(cnt[cnt == 5].index)
    hw = hw[hw.iso3.isin(universe)]
    n_countries[w] = len(universe)
    meta_waves.append({"w": w, "label": f"{int(hw.year.min())}-{int(hw.year.max())}"})
    for slug in ORDER:
        g = hw[hw.slug == slug].copy()
        # rank mundial: 1 = mayor pct (mas saliente); precision plena, empate = min rank
        g = g.sort_values("pct", ascending=False).reset_index(drop=True)
        vals = g.pct.values
        rank = {iso: int((vals > p).sum()) + 1 for iso, p in zip(g.iso3, g.pct)}
        g = g.sort_values("pct").reset_index(drop=True)   # guardar asc por pct
        # pct a 2 decimales: se muestra con fmt(pct,1) pero la mediana/gap que el
        # chart recalcula al vuelo reproducen exacto los numeros del brief (a 1 dec
        # se corrian 0,1 pp por redondeo intermedio).
        rows = [[r.iso3, round(float(r.pct), 2), int(r.year), rank[r.iso3], int(r.n)]
                for r in g.itertuples()]
        foto[slug][int(w)] = rows

meta = {
    "waves": meta_waves,
    "n_countries": {str(w): n_countries[w] for w in WAVES},
    "items": {s: {"var": ITEMS[s][0], "es": ITEMS[s][1], "en": ITEMS[s][2]} for s in ORDER},
}

out = [
    "// Datos del chart 8 del N.5 — bateria H002 'frecuencia en tu barrio' (IVS/WVS).",
    "// GENERADO por tools/make_barrio.py — no editar a mano.",
    "// Indicador = % que responde 'muy/bastante seguido' {1,2} sobre {1,2,3,4}, pond. S017.",
    "// BA_FOTO[item][ola] = [[iso3, pct, year, rank, n], ...] asc por pct; rank 1 = pct mas alto.",
    "const BA_ITEMS = " + json.dumps(ORDER) + ";",
    "const BA_META = " + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";",
    "const BA_FOTO = " + json.dumps(foto, ensure_ascii=False, separators=(",", ":")) + ";",
    "const BA_REGION = " + json.dumps(region, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";",
]
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"data-barrio.js -> {os.path.getsize(OUT)/1024:.0f}KB | olas {[m['w'] for m in meta_waves]} "
      f"| universo {n_countries} | labels {[m['label'] for m in meta_waves]}")
