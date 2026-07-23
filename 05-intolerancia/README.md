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

- Agregación por **país × estudio (EVS/WVS) × ola unificada**: % ponderado con `S017`
  sobre respuestas válidas (0/1; negativos = missing). Año = mediana de `S020`
  (las olas son ventanas; p.ej. Argentina ola 7 = 2017, Uruguay ola 7 = 2022).
- **Bug conocido del merge oficial (¡importante!):** en el .dta integrado, `S002VS`
  (ola unificada) queda **vacía para todos los casos EVS** (224.434 filas). Se
  reconstruye desde `S002EVS` con la cronología oficial: EVS1→1, EVS2→2, EVS3→4,
  EVS4→5, EVS5→7. Sin este fix, cualquier agregación por ola descarta en silencio
  a los países solo-EVS (Francia, Italia, los nórdicos, Europa del Este…).
- 10 países tienen EVS **y** WVS en la ola 7 (DEU, GBR, NLD, CZE, SVK, ROU, RUS,
  SRB, UKR, ARM): en el largo quedan ambos puntos; en la foto gana el año más
  reciente (a igual año, el n mayor).
- Filtro de robustez: se descartan celdas con **n < 200** respuestas válidas.
- País por ISO3 (con casos especiales: GBR unifica GB/GB-GBN; NIR = Irlanda del Norte;
  XKS = Kosovo; XNC = Chipre del Norte). Región = esquema Atlas de 10 regiones
  (mismas asignaciones que el dataset del N°1 + parches TWN/VEN/YEM/NIR/XKS/XNC/MAC).

## Archivos

| Archivo | Qué es |
|---|---|
| `data/ivs_vecinos_largo.csv` | **Película**: iso3, region, study, wave, year, cat, pct, n — 4.750 filas, 117 países, 38 categorías |
| `data/ivs_vecinos_ultimo.csv` | **Foto**: último dato por país × categoría (con año de medición) |
| `data/ivs_vecinos_cats.csv` | Metadata de categorías: slug, variable IVS, label ES/EN, flag `core` |
| `tools/` | Pipeline reproducible (extract → aggregate → build; requiere `pyreadstat`) |

## Cobertura (categorías core)

- **Serie larga (desde ~1990, ~100 países en olas recientes):** otra_raza,
  inmigrantes, homosexuales, drogadictos, bebedores (y sida hasta ola 7 = 66).
  **Foto ≥2017: 92 países** (WVS7 + EVS5).
- **Desde 2005:** otra_religion, otro_idioma, parejas_no_casadas (solo WVS, 65-66).
- **Judíos, musulmanes y gitanos:** el WVS los discontinuó (~2004), pero el **EVS
  los siguió preguntando**: hay foto 2017-2021 para ~36 países europeos. Argentina
  no tiene dato posterior a 1999-2004 en estas categorías.
- **Antecedentes, inestables:** discontinuadas (~2004) en ambos estudios.
- **LatAm (17 entidades):** con serie larga ARG (7 olas desde 1984), MEX (7), CHL (6),
  BRA (5), PER (5), URY (4), COL (4), PRI (3), VEN (3); foto única o corta:
  BOL, DOM, ECU, SLV, GTM, HTI, NIC, TTO.

## Hallazgos preliminares (para el ángulo editorial)

- **El Río de la Plata + Brasil está en el top mundial de tolerancia declarada**
  (último dato ≥2017, 92 países incl. toda Europa): Uruguay 1° en "otra raza" (0,6%),
  Brasil 3° (1,4%), Argentina 8° (2,7%) — entre los nórdicos (Suecia 1,0%, Islandia
  1,8%, Noruega 2,6%). En "inmigrantes": Brasil 1° (2,6%), Uruguay 4°, Argentina 6°.
  En "homosexuales": top nórdico; Uruguay 7° (4,7%), Brasil 11°, Argentina 15° (8,6%).
- **Referencias clave para el gancho:** Francia 3,7% en "otra raza" (2018), EE.UU.
  3,2%, España 12,7%, Italia 12,4%, Hungría 28,8%, Bulgaria 40%.
- **En Europa la categoría reveladora es "gitanos"**: Italia 64,8%, Bulgaria 67%,
  Rumania 47,5%, Hungría 45,3%, Francia 22,9% (2017-2021). Cada sociedad tiene su
  "otro": el ranking de "otra raza" no agota la intolerancia étnica.
- **LatAm es heterogénea:** Guatemala (30% rechazo racial), Nicaragua (20%), México
  (11%) están en la mitad alta del mundo; el Cono Sur en el piso mundial.
- **Película argentina:** homofobia declarada 38,9% (1991) → 8,6% (2017); sida
  31,5% → 4,0%. Pero drogadictos **subió** 39% → 72% (2013-2017): la intolerancia
  no desapareció, cambió de blanco.
- Correlaciones (foto ≥2017): raza vs inmigrantes r=0,84 (misma dimensión: xenofobia);
  raza vs homosexuales r=0,53 (dimensiones parcialmente distintas → scatter informativo).

## Fuentes complementarias (descargadas 2026-07-22)

### Latinobarómetro 2024 — `data/lb_vecinos_2024.csv`

- **Base:** `Bases\Latinobarometro\Latinobarometro_2024_Stata_esp_v20250817.dta`
  (descarga directa del sitio nuevo, sin registro; cuestionarios y fichas técnicas
  en la misma carpeta). 17 países, n≈19.200, campo 2024 (post-Qatar 2022).
- **Batería P3NOIJ** ("¿cuáles no querría tener como vecinos?"): réplica de la del
  WVS. % ponderado (`WT`) con base = quienes respondieron la batería (se excluye
  P3NOIJ.9 = NS/NR, que va del 7% PRY al 28% MEX — reportado por el script).
- **Suma 4 países que la IVS no tiene:** CRI, HND, PAN, PRY (y no tiene NIC/HTI/PRI/TTO).
- **Valida el podio rioplatense con dato fresco:** otra raza ARG 1,2% (mínimo
  regional), URY 2,1%, BRA 3,1%; homosexuales URY 6,9 / ARG 7,6 / BRA 7,8.
- **Historia nueva:** rechazo a inmigrantes en Chile 13,2% (IVS 2018) → 27,2%
  (LB 2024) y Perú 18,3→27,0 — el efecto del éxodo venezolano (consistente con
  la caída del Migrant Acceptance Index de Gallup 2016→2019).
- **Ojo:** la opción 5 fusiona "bebedores, drogadictos y alcohólicos" (en IVS son
  ítems separados) → slug propio `bebedores_drogadictos`, no comparable 1:1.
  Agrega categoría `jovenes` (LB-only). Guatemala da 11,9% vs 30,2% IVS 2020 —
  otra muestra de efectos-casa.
- También descargado: `latinobarometro-serie-de-tiempo-1995-2024.xlsx` (agregados
  longitudinales oficiales, en scratchpad/Bases) — por explorar.

### Project Implicit International — `data/pi_implicito_paises.csv`

- **Base:** resumen país×test del paper Charlesworth et al. (BRM 2023), OSF
  [26pkd](https://osf.io/26pkd/) (`Bases\Project Implicit\internationaldata_summary.csv`
  + `.Rmd`). Subset residentes/ciudadanos, 2009-2019, 34 países × 7 tests
  (Race, Skin-tone, Sexuality, Nationality, Age, Body weight, Gender-Science).
  ARG/BRA/COL/MEX incluidos (ARG n≈1.400-2.000 por test).
- `d_implicito` (MD2) >0 = sesgo implícito hacia el grupo dominante del test
  (blancos sobre negros, heterosexuales sobre gays, piel clara sobre oscura).
  CHE y CAN venían partidas por idioma → pooled con promedio ponderado por n.
- **El contrapunto del número:** Argentina, bajísima en intolerancia declarada,
  es **medio-alta en sesgo implícito racial (24/34)** y **la más alta de los 34
  en sesgo anti-gay implícito (34/34; D=0,45)**; Nationality 32/34. Asia del
  Este muestra el patrón inverso (alta homofobia declarada, bajo IAT). El
  contraste declarado-vs-implícito responde directamente a la crítica de
  deseabilidad social — candidato a scatter propio.
- **Caveats PI:** muestra autoseleccionada (visitantes del sitio, jóvenes y
  educados) — sirve para comparar niveles relativos entre países, no prevalencias;
  citar como triangulación, no como ranking definitivo.

## Caveats metodológicos (para el texto)

1. **Intolerancia declarada ≠ comportamiento**: mide lo que la gente admite ante un
   encuestador. La deseabilidad social varía entre países (donde el racismo es tabú,
   se declara menos). Es la crítica central al mapa viral del Washington Post (2013)
   sobre esta misma pregunta.
2. **Mención espontánea**: no es una escala de intensidad; capta rechazo fuerte.
3. **Efectos-casa EVS vs WVS**: en países medidos por ambos en la misma ventana las
   brechas llegan a 8-13 pp (Rumania 2018: EVS 22,1% vs WVS 14,4% en "otra raza";
   Serbia 2017-18: 29,6% vs 16,8%). Diferencias de pocos puntos entre países NO son
   informativas; el ítem sirve para órdenes de magnitud.
4. **El caso Francia 2006** — el artefacto que alimentó el mapa viral: WVS 2006 dio
   22,6% de rechazo racial; EVS 2008, dos años después, 3,4% (y EVS 2018, 3,7%).
   El 22,7% que el mapa de 2013 usó para pintar a Francia de "racista" era casi
   seguro un problema de instrumento, no un rasgo nacional.
5. Guatemala 2020 da alto en *todas* las categorías (posible efecto instrumento/muestra).
6. Categorías país-específicas (kurdos, kuwaitíes, etc.) no son comparables — quedan
   fuera de los charts comparados.

## Estado

- [x] CSVs foto + película generados y validados.
- [x] Latinobarómetro 2024 descargado y procesado (validación regional 2024).
- [x] Project Implicit descargado y procesado (sesgo implícito, 34 países).
- [ ] Definición del lineup de charts (propuesta en curso).
- [ ] Charts interactivos + PNG export.
- [ ] index.html del número + entrada en `charts.json` + galería.
- [ ] Versión EN + OG cards + thumbnails.
