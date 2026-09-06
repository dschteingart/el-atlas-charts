# N°5 — ¿En qué es talentosa América Latina? · pipeline de datos

Los scripts corren desde `el-atlas\insumos\#5 - Talento\` (fuera del repo de charts,
sincronizada por MEGAsync), que es donde viven los insumos pesados. Hasta el 30/8/2026
esa cocina estaba en `Downloads\_talento_work`, herencia de la sesión de junio; se mudó
entera y se reescribieron las rutas de los scripts. Esta carpeta guarda la copia
versionada; si editás un script, copialo de vuelta a `insumos\#5 - Talento`.

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

## Dominios: reagrupamiento propio, no el de Pantheon

Los 6 dominios de El Atlas no son los 8 oficiales de Pantheon. No quedaba otra: el
archivo 2025 no trae la columna `domain`, la taxonomía oficial (1.0, 2014) no cubre 20
ocupaciones nuevas (4.972 figuras), y los dominios oficiales dejan astillas ilegibles
(Exploration 0,9%, Business & Law 1,0%, Public Figure 2,5%). El mapeo completo —cada
ocupación, su dominio Atlas y su dominio Pantheon 1.0— está en
`taxonomia_dominios.csv` (lo genera `taxonomia_dominios.py`). Hay 17 ocupaciones que
cruzan de dominio (3.112 figuras, 2,7%): ciencias sociales a Humanidades, farándula a
Arte y espectáculo, astronautas a Ciencia, periodistas y abogados a Poder. Decisión
ratificada por Daniel el 6/9/2026.

Chequeo de robustez que blinda el chart 3: el share de América Latina en la ciencia
mundial da **1,0% con nuestro criterio y 1,0% con el de Pantheon** (sociales
incluidas). El hallazgo no depende de la taxonomía. Al citar: "reagrupamiento propio
sobre las ocupaciones de Pantheon", nunca "dominios de Pantheon".

## Orden de ejecución

| # | Script | Escribe | Qué hace |
|---|---|---|---|
| 1 | `fame_pantheon.py` | `fame_pantheon.csv` | Baja `/pageviews` de la API para las 126.582 figuras (1 query por persona, concurrente y resumible). Lento: horas. |
| 2 | `fame_border.py` | `fame_border.csv` | Re-baja sólo las figuras del borde (`langs1k<=1`) para contarlas con umbrales más blandos. |
| 3 | `merge_gate.py` | `gate_result.csv` | Define y valida el gate multi-idioma. Diagnóstico, no lo consume nadie. |
| 3b | `recuperar_lugar.py` | `lugares_recuperados.csv` | Completa el lugar de nacimiento de las figuras que Pantheon deja en blanco (David, Salomón, Pedro, faraones). Por coordenada contra la geometría del N°3, o por Wikidata (P19 → P625/P17 → P131, y P27 como último recurso). `python recuperar_lugar.py 0 8` corre toda la base con 8 hilos; el CSV se acumula, así que volver a correrlo sólo agrega lo que falte. |
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
bíblicas o de polities que ya no existen. Se recuperan 2.735 (55%). De las que quedan,
la mayoría no tiene el dato en Wikidata; unas 90 tienen coordenada que no cae en ningún
país porque son territorios disputados que la geometría no representa (Chipre del Norte,
Cachemira) o gente nacida en altamar —Itamar Franco nació en el Atlántico, en un barco—. `recuperar_lugar.py` las resuelve y escribe
`lugares_recuperados.csv`, que consumen `export_dataset.py` (columnas `pais`/`region`)
y `corregido.py` (columna `iso3` del master, que es por donde los gráficos agrupan).
La columna `lugar_fuente` del dataset dice de dónde salió cada dato recuperado.

Dos detalles que hacen que esto sea idempotente y conviene no romper:

- **Los faltantes se calculan contra la fuente** (`bplace_country` de
  `person_2025_update.csv`), no contra `pantheon_corregido.csv`. Mirar el dataset ya
  parcheado hacía que las figuras recuperadas dejaran de aparecer como faltantes, así
  que invalidar una fila para rehacerla la borraba en vez de reprocesarla.
- **El CSV se acumula.** Se dan por cerradas las filas que ya tienen región y las que
  Wikidata contestó que no sabe; las demás —wd_id que no resolvió, red caída— se
  reintentan en cada corrida. Eso importa: en la primera pasada 255 figuras quedaron
  como "wd_id inexistente" y al reintentar resultó que 237 eran caídas de red. Sólo 10
  son ids realmente rotos en el archivo de Pantheon. Conviene correrlo dos o tres veces
  hasta que el número se estabilice.

**Prioridad: `P17` antes que la coordenada.** Lo que Wikidata afirma sobre el país del
lugar le gana a nuestro point-in-polygon, que en la frontera se equivoca: El Carmelo,
cuna de Richard Carapaz, cae del lado colombiano por unos metros y lo volvía colombiano
en vez de ecuatoriano.

**Levante.** Pantheon geocodifica toda la zona como Israel (así están Jesús, María e
Isaac, con coordenadas de Jerusalén). Nuestra geometría tiene polígono de Palestina y
partiría la zona en dos, dejando a David (Belén) en Palestina y a Jesús, a 8 km, en
Israel. Se alinea con la convención de la fuente para no partir el mismo pueblo en dos
países; la columna `iso3_geometria` del CSV guarda lo que decía el polígono. Si el
script se corre sobre figuras contemporáneas, revisar ese alineamiento (`ALINEAR`).

## Al tocar cualquier `data-*.js`

Subí el `?v=N` de ese archivo en los HTML que lo cargan, o el caché del navegador y
de GitHub Pages sigue sirviendo el viejo.

## Insumos pesados (en `insumos\#5 - Talento`, fuera del repo de charts)

`person_2025_update.csv` (archivo Pantheon 2025, 39 MB) · `fame_pantheon.csv` (8,8 MB)
· `pantheon_corregido.csv` (23 MB) · `master_corregido.csv` (11 MB) ·
`base_depurada.csv` (22 MB) · `gdp-per-capita-maddison-project-database.csv` ·
`pop3/population.csv` y `pop_owid/population.csv` (OWID) · `talento_ALL_abs_adm1_all.csv`
· `geo_backfill.csv`, `geo_upgrade.csv`, `geonameid_to_metro.csv`.

El assignment subnacional sale de `insumos/#3 - Futbol/talento/out/` (`pantheon_admin1.csv`,
`admin1_meta.csv`), producto del pipeline GADM del N°3.
