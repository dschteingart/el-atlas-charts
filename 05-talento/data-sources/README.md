# N°5 — ¿En qué es talentosa América Latina? · pipeline de datos

Los scripts corren desde `C:\Users\FUNDAR\Downloads\_talento_work\`, que es donde
viven los insumos pesados (no están en el repo porque se redescargan). Esta carpeta
guarda la copia versionada; si editás uno, copialo de vuelta a `_talento_work`.

## Metodología: el HPI del archivo no se usa

Pantheon publica un HPI (*Historical Popularity Index*) por figura. No lo usamos:
mezcla las vistas de todos los idiomas y no distingue "famoso en muchas lenguas" de
"inflado en una sola Wikipedia" (el caso testigo son los futbolistas de la J-League
japonesa, con millones de vistas en `ja.wikipedia` y nada más).

En su lugar reconstruimos la fama desde la API de Pantheon (`/pageviews`, vistas por
idioma y por mes) y aplicamos un filtro de entrada:

- **Gate multi-idioma**: entra la figura con **≥2 idiomas con ≥1000 vistas acumuladas
  desde 2015**. Deja afuera 9.313 de 126.582 (7,4%). Validado a mano: entran íconos
  mono-idioma reales (Diomedes Díaz, Zhong Nanshan) y salen los perfiles marginales.
  Japón pierde el 49,7% de sus figuras; es el efecto buscado.

- **Score de fama** (0–100, Aristóteles = 100):

  ```
  Lenguas = media(idiomas, idiomas con ≥10k vistas)      [log1p, normalizados]
  Vistas  = geom(vistas 12m, vistas históricas, mediana mensual)   [no-inglés]
  Base    = geom(Lenguas, Vistas)
  Edad×   = piso + normalizar( wA·log₄(A) − wRec·max(0, (T−A)/7) )
  Score   = Base × Edad×,  reescalado a 100
  ```

  Publicado con `T=40, piso=0,5, wA=1, wRec=1`, media geométrica, año ref. 2025.
  Los knobs quedan escritos en `pantheon_corregido.params.json`, al lado del dataset.

  `T` es el umbral de edad: por debajo de T años desde el nacimiento la figura se
  penaliza por reciente. Mueve mucho a los vivos (Messi es #141 con T=40, #384 con
  T=50 y #1231 con T=70) y casi nada a los agregados por país o región (América
  Latina queda en 5,9% de la fama mundial con cualquiera de los tres).

  **Lenguas usa media aritmética, no geométrica.** El 58,9% de la base tiene 0 idiomas
  con ≥10k vistas; con media geométrica ese cero anulaba el score entero y dejaba a
  más de la mitad de las figuras pegada en ~0,3 con un acantilado a 42. La geométrica
  se conserva donde no hay ceros: dentro de Vistas y entre Lenguas y Vistas.

`fame-lab.html` deja mover todas las perillas en vivo; el preset **Publicado (T40)**
reproduce exactamente `pantheon_corregido.csv`.

`hpi-lab.html` es el laboratorio anterior — recalcula el HPI desde las columnas crudas
del archivo Pantheon. Quedó como registro del camino recorrido; **no alimenta ningún
gráfico publicado**.

## Orden de ejecución

| # | Script | Escribe | Qué hace |
|---|---|---|---|
| 1 | `fame_pantheon.py` | `fame_pantheon.csv` | Baja `/pageviews` de la API para las 126.582 figuras (1 query por persona, concurrente y resumible). Lento: horas. |
| 2 | `fame_border.py` | `fame_border.csv` | Re-baja sólo las figuras del borde (`langs1k<=1`) para contarlas con umbrales más blandos. |
| 3 | `merge_gate.py` | `gate_result.csv` | Define y valida el gate multi-idioma. Diagnóstico, no lo consume nadie. |
| 3b | `recuperar_lugar.py` | `lugares_recuperados.csv` | Completa el lugar de nacimiento de las figuras que Pantheon deja en blanco (David, Salomón, Pedro, faraones). Por coordenada contra la geometría del N°3, o por Wikidata (P19 → P625/P17 → P131, y P27 como último recurso). |
| 4 | `export_dataset.py` | **`pantheon_corregido.csv`** | Aplica el gate, calcula el score y completa los lugares recuperados. Es la fuente de verdad. |
| 5 | `corregido.py` | **`master_corregido.csv`** | Reemplazo drop-in de `persons_enriched.csv`: filtrado por el gate y con `hpi := score`. También se importa como módulo (`corregido.aplicar(df)`). |
| 6 | `build_subnac_corregido.py` | `talento_ALL_abs_adm1_corregido.csv` | Rehace el agregado subnacional del chart 8 con el gate, desde el assignment persona→unidad del N°3. |
| 7 | `export_data.py` | `data-abanico/huella/ciencia/genero.js` | Charts 1–4. |
| 8 | `export_scatter.py` | `data-explora.js` | Chart 5. |
| 9 | `export_more.py` | `data-fama-oficio/migracion/subnacional.js` | Charts 6–8. |
| 10 | `merge_metros.py` | `data-metros.js` | Chart 9. |
| 11 | `build_percap_data.py` | `data-percap-figs/pop/topfig.js` | Tablero `percap.html`. |
| 12 | `build_geo_mini.py` | `data-country-geo-mini.js` | Geometría liviana del mapa (no depende del talento). |
| 13 | `build_map_data.py` | `data-percap-map.js`, `data-percap-topfig.js` | Mapa `percap-map.html`. **Va último**: pisa el `topfig` del paso 11. |

Los labs (`fame_lab_data.py`, `hpi_lab_data.py`) son independientes; sólo hace falta
correrlos si cambian los insumos crudos, porque el score lo calcula el JS en vivo.

## Lugares de nacimiento recuperados

Pantheon deja sin país a 4.983 figuras de la base depurada: casi todas antiguas,
bíblicas o de polities que ya no existen. `recuperar_lugar.py` las resuelve y escribe
`lugares_recuperados.csv`, que consumen `export_dataset.py` (columnas `pais`/`region`)
y `corregido.py` (columna `iso3` del master, que es por donde los gráficos agrupan).
La columna `lugar_fuente` del dataset dice de dónde salió cada dato recuperado.

Hay una dependencia circular suave: `recuperar_lugar.py` lee `pantheon_corregido.csv`
para saber a quién le falta el dato, y `export_dataset.py` lee el resultado. En la
práctica se corre una vez y listo; si se vuelve a correr, encuentra menos faltantes
porque ya están completos, y eso no rompe nada.

**Levante.** Pantheon geocodifica toda la zona como Israel (así están Jesús, María e
Isaac, con coordenadas de Jerusalén). Nuestra geometría tiene polígono de Palestina y
partiría la zona en dos, dejando a David (Belén) en Palestina y a Jesús, a 8 km, en
Israel. Se alinea con la convención de la fuente para no partir el mismo pueblo en dos
países; la columna `iso3_geometria` del CSV guarda lo que decía el polígono. Si el
script se corre sobre figuras contemporáneas, revisar ese alineamiento (`ALINEAR`).

## Al tocar cualquier `data-*.js`

Subí el `?v=N` de ese archivo en los HTML que lo cargan, o el caché del navegador y
de GitHub Pages sigue sirviendo el viejo.

## Insumos pesados (en `_talento_work`, fuera del repo)

`person_2025_update.csv` (archivo Pantheon 2025, 39 MB) · `fame_pantheon.csv` (8,8 MB)
· `pantheon_corregido.csv` (23 MB) · `master_corregido.csv` (11 MB) ·
`gdp-per-capita-maddison-project-database.csv` · `pop3/population.csv` (OWID) ·
`geo_backfill.csv`, `geo_upgrade.csv`, `geonameid_to_metro.csv`.

El assignment subnacional sale de `insumos/#3 - Futbol/talento/out/` (`pantheon_admin1.csv`,
`admin1_meta.csv`), producto del pipeline GADM del N°3.
