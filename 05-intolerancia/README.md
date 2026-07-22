# N°5 (tentativo) — ¿Qué tan intolerante es América Latina?

Datos de intolerancia declarada por país: la batería "no querría tener de vecinos a..."
de la **Integrated Values Survey** (IVS = EVS Trend 1981-2017 + WVS Trend 1981-2022).
Gancho editorial: el Mundial 2026 y las acusaciones de racismo sobre Argentina.

## Fuente

- **Base:** `Integrated_values_surveys_1981-2022.dta` (construida por Daniel con la
  sintaxis oficial GESIS/WVSA `EVS_WVS_Merge Syntax_stata.do`, sept. 2024, a partir de
  EVS Trend ZA7503 v3.0.0 y WVS Trend v4.0). Vive en
  `MEGAsync\FUNDAR\Argentina en datos\Bases\World Values Survey\IVS\`.
- **Pregunta** (textual ES del cuestionario WVS): *"En esta lista hay varios grupos de
  personas. ¿Podría usted señalar a alguno que no le gustaría tener de vecino?"* —
  respuesta espontánea de "mención": mencionar un grupo = no lo querría de vecino.
  El indicador es **% de la población que menciona cada grupo** (más alto = más rechazo).
- **Batería:** A124_01 a A124_52 — 38 categorías, de las cuales ~12 son "core"
  comparables entre países y olas (ver `data/ivs_vecinos_cats.csv`, columna `core`).

## Método

- Agregación por **país × estudio (EVS/WVS) × ola (S002VS)**: % ponderado con `S017`
  sobre respuestas válidas (0/1; negativos = missing). Año = mediana de `S020`
  (las olas son ventanas; p.ej. Argentina ola 7 = 2017, Uruguay ola 7 = 2022).
- Filtro de robustez: se descartan celdas con **n < 200** respuestas válidas.
- País por ISO3 (con casos especiales: GBR unifica GB/GB-GBN; NIR = Irlanda del Norte;
  XKS = Kosovo; XNC = Chipre del Norte). Región = esquema Atlas de 10 regiones
  (mismas asignaciones que el dataset del N°1 + parches TWN/VEN/YEM/NIR/XKS/XNC/MAC).

## Archivos

| Archivo | Qué es |
|---|---|
| `data/ivs_vecinos_largo.csv` | **Película**: iso3, region, study, wave, year, cat, pct, n — 2.772 filas, 107 países, 38 categorías |
| `data/ivs_vecinos_ultimo.csv` | **Foto**: último dato por país × categoría (con año de medición) |
| `data/ivs_vecinos_cats.csv` | Metadata de categorías: slug, variable IVS, label ES/EN, flag `core` |
| `tools/` | Pipeline reproducible (extract → aggregate → build; requiere `pyreadstat`) |

## Cobertura (categorías core)

- **Serie larga (desde ~1990, 54-66 países por ola):** otra_raza, inmigrantes,
  homosexuales, sida, drogadictos, bebedores.
- **Desde 2005:** otra_religion, otro_idioma, parejas_no_casadas.
- **Discontinuadas (hasta ~2004):** judíos, musulmanes, antecedentes, inestables —
  sirven para foto histórica, no para película al presente.
- **LatAm (17 entidades):** con serie larga ARG (7 olas desde 1984), MEX (7), CHL (6),
  BRA (5), PER (5), URY (4), COL (4), PRI (3), VEN (3); foto única o corta:
  BOL, DOM, ECU, SLV, GTM, HTI, NIC, TTO.

## Hallazgos preliminares (para el ángulo editorial)

- **El Río de la Plata + Brasil está en el top mundial de tolerancia declarada**
  (último dato ≥2017, 66 países): Uruguay 1° en "otra raza" (0,6%), Brasil 2° (1,4%),
  Argentina 5° (2,7%). En "inmigrantes": Brasil 1° (2,6%), Uruguay 3°, Argentina 5°.
  En "homosexuales": Uruguay 3°, Brasil 6°, Argentina 9°.
- **LatAm es heterogénea:** Guatemala (30% rechazo racial), Nicaragua (20%), México
  (11%) están en la mitad alta del mundo; el Cono Sur en el piso mundial.
- **Película argentina:** homofobia declarada 38,9% (1991) → 8,6% (2017); sida
  31,5% → 4,0%. Pero drogadictos **subió** 39% → 72% (2013-2017): la intolerancia
  no desapareció, cambió de blanco.
- Correlaciones (foto ≥2017): raza vs inmigrantes r=0,84 (misma dimensión: xenofobia);
  raza vs homosexuales r=0,53 (dimensiones parcialmente distintas → scatter informativo).

## Caveats metodológicos (para el texto)

1. **Intolerancia declarada ≠ comportamiento**: mide lo que la gente admite ante un
   encuestador. La deseabilidad social varía entre países (donde el racismo es tabú,
   se declara menos). Es la crítica central al mapa viral del Washington Post (2013)
   sobre esta misma pregunta.
2. **Mención espontánea**: no es una escala de intensidad; capta rechazo fuerte.
3. Comparabilidad EVS/WVS y cambios de modo (algunos países ola 7 con modo mixto).
4. Guatemala 2020 da alto en *todas* las categorías (posible efecto instrumento/muestra).
5. Categorías país-específicas (kurdos, kuwaitíes, etc.) no son comparables — quedan
   fuera de los charts comparados.

## Estado

- [x] CSVs foto + película generados y validados.
- [ ] Definición del lineup de charts (propuesta en curso).
- [ ] Charts interactivos + PNG export.
- [ ] index.html del número + entrada en `charts.json` + galería.
- [ ] Versión EN + OG cards + thumbnails.
