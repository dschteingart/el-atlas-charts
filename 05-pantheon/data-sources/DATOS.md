# El dataset del N°5 — `pantheon_corregido.csv`

Fuente de verdad del número. Sale de `export_dataset.py` (paso 4 del pipeline, ver
`README.md`) y todos los gráficos derivan de él.

- **126.582 filas**, una por figura, sin ids repetidos.
- Universo de partida: la actualización 2025 del archivo público de
  [Pantheon](https://pantheon.world).
- Los parámetros con los que se calculó el índice quedan al lado, en
  `pantheon_corregido.params.json`.

## Cómo reproducir la base publicada

El número usa **116.319 figuras**, que son las que pasan el filtro de entrada y tienen
los datos mínimos para el índice:

```python
import pandas as pd
d = pd.read_csv('pantheon_corregido.csv', low_memory=False)
base = d[(d.multi_idioma == 1) & d.score.notna()]      # 116.319 filas
```

El ranking del número es `score` ordenado de mayor a menor (la columna `rank_score` trae
ese orden ya calculado, con el método `min` para los empates).

## Columnas

| Columna | Qué es |
|---|---|
| `id` | Identificador de Pantheon. Clave para cruzar con sus archivos |
| `name` | Nombre en inglés, tal como viene de Pantheon |
| `occupation` | Ocupación de Pantheon, sin modificar |
| `dominio` | Rubro de El Atlas (reagrupamiento propio de las ocupaciones; ver `taxonomia_dominios.csv`) |
| `region` | Región de El Atlas, la taxonomía del N°1 |
| `pais` | País de nacimiento en fronteras actuales (criterio de Pantheon) |
| `birthyear` | Año de nacimiento; negativo = a.C. |
| `n_langs` | Ediciones de Wikipedia en las que existe la biografía, según nuestro barrido de la API |
| `idiomas_1k_anio` | Idiomas con 1.000 visitas o más en el último año |
| `idiomas_10k_anio` | Idiomas con 10.000 visitas o más en el último año. Segundo término de `Lenguas` |
| `idiomas_1k_desde2015` | Idiomas con 1.000 visitas acumuladas o más desde 2015. Define el filtro de entrada |
| `vistas_12m_noen` | Visitas de los últimos 12 meses, excluyendo la Wikipedia en inglés |
| `vistas_total_noen` | Visitas acumuladas desde julio de 2015, sin inglés |
| `mediana_mensual_noen` | Mediana mensual de visitas sin inglés. Resiste los picos de actualidad |
| `pct_meses_100k` | Porcentaje de meses con 100.000 visitas o más |
| `pct_meses_300k` | Porcentaje de meses con 300.000 visitas o más |
| `multi_idioma` | 1 si pasa el filtro de entrada (2 idiomas o más con 1.000 visitas o más desde 2015) |
| `Lenguas` | Componente de amplitud del índice, 0 a 1 |
| `Vistas` | Componente de intensidad del índice, 0 a 1 |
| `EdadMult` | Multiplicador de antigüedad, entre el piso (0,5) y 1 |
| `score` | **El índice de fama del número**, 0 a 100 |
| `rank_score` | Puesto según `score` sobre las figuras con índice calculado |
| `hpi_archivo` | El HPI publicado por Pantheon, para comparar. **No se usa en el número** |
| `lugar_fuente` | De dónde salió el lugar de nacimiento cuando Pantheon lo dejaba vacío (2.735 casos) |

## Advertencias de uso

- `score` y `rank_score` están vacíos para las figuras sin ocupación o sin año de
  nacimiento, que son las que no entran al índice.
- `multi_idioma = 0` marca a las 9.313 figuras que no pasan el filtro de entrada. Siguen
  en el archivo a propósito, para que se pueda auditar qué queda afuera.
- Las visitas siempre excluyen la Wikipedia en inglés. El motivo está en la
  [nota metodológica](../metodologia.html).
- El índice mide memoria global contemporánea, no talento ni mérito.

## Licencia y atribución

Los datos originales son de [Pantheon](https://pantheon.world) (Datawheel), bajo su
propia licencia. Esta versión editada por El Atlas se comparte para que cualquiera pueda
auditar o rehacer los gráficos del número. Al citarla, corresponde acreditar a Pantheon
como fuente primaria y a El Atlas por la edición del dataset y el índice propio.
