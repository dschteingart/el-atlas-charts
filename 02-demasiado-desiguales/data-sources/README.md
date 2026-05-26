# N°2 — data-sources

Inputs crudos y scripts Python que generan los datasets de los 3 charts del
N°2 "Demasiado desiguales". Cada script lee CSVs/ZIPs de esta carpeta y
produce un JSON que vive acá; ese JSON se embebe después en
`../data-<chart>.js` con un wrapper `const DATA_<CHART> = {...}` para uso
inline en el browser.

## Scripts

### `01_generar_datos_marimekko.py`
Genera datos del chart 1 (ranking Gini por país × año, con ventana de 15
años para asignar la última observación). Output: `data-marimekko.json`.

Inputs:
- `pip_gini_deciles_observados.csv` — observaciones PIP del Banco Mundial
  con shares por decil y Gini, por país × año × reporting_level
  (national/urban/rural) × welfare_type (income/consumption).

### `02_generar_datos_scatter.py`
Genera datos del chart 2 (scatter Gini vs PIB pc PPP). Para cada año Y
entre 2010 y 2025, toma la última observación de Gini de cada país dentro
de [Y-15, Y] y busca el PIB pc del mismo año (con match nearest ±3 años
para gaps). Calcula sobre el dataset del año Y:
- regresión lineal: `Gini_adj = a + b·ln(PIB pc)`
- regresión cuadrática: `Gini_adj = a + b·ln(PIB pc) + c·ln(PIB pc)²`
- residuos absolutos (pp) y porcentuales por país y por región.

Output: `data-scatter.json`.

Inputs:
- `pip_gini_deciles_observados.csv` (idem chart 1)
- `gdp_per_capita_worldbank.zip` → `gdp-per-capita-worldbank.csv` con PIB
  pc PPP USD constantes 2021 (fuente: World Development Indicators del BM).

### `03_generar_datos_deciles.py`
Genera datos del chart 3 (distribución de ingreso por decil de cada país,
en USD PPP/día + percentil mundial). Para cada año Y entre 1990 y 2025:
- toma las shares de decil de la última encuesta dentro de [Y-15, Y];
- usa la media nacional **interpolada** del año Y de
  `pip_medias_interpoladas.csv` (no la observada de la encuesta vieja);
- calcula `income_decil = share × mean_Y × 10`;
- calcula el percentil mundial ordenando todos los decil-país × población
  del año Y por ingreso y acumulando población.

Output: `data-deciles.json`.

Inputs:
- `pip_gini_deciles_observados.csv` (shares por decil, observado)
- `pip_medias_interpoladas.csv` — media nacional PIP interpolada linealmente
  por país × año × welfare_type, 1981-2026.
- `population_un.zip` → `population.csv` — población por país × año (UN
  World Population Prospects). Para años > 2023 usa el último disponible
  como fallback.

## Inputs crudos compartidos

Todos los CSVs/ZIPs vienen del bundle original entregado por el editor del
N°2 y NO se modifican — los scripts los consumen tal cual:

- `pip_gini_deciles_observados.csv` — 2585 filas. PIP Banco Mundial.
- `pip_medias_interpoladas.csv` — 10120 filas. PIP interpoladas.
- `gdp_per_capita_worldbank.zip` — WDI PIB pc PPP USD const. 2021.
- `population_un.zip` — UN World Population Prospects.
- `gini_172_paises_ultimo_anio.csv` — versión anterior del dataset Gini
  (último año por país). Ya no se usa; conservado por referencia.
- `tabla_percentiles_mundiales_2022.csv` — tabla auxiliar para verificación
  cruzada del cálculo de percentiles. No la consume ningún script.

## Cómo regenerar

Requiere Python 3.10+ y `numpy`. Desde esta carpeta:

```bash
python 01_generar_datos_marimekko.py
python 02_generar_datos_scatter.py
python 03_generar_datos_deciles.py
```

Cada script imprime un resumen (N por año, R² para el scatter, etc.) y
guarda el JSON. Para embeberlo en el .js del chart:

```bash
python -c "
import json
data = open('data-<chart>.json', encoding='utf-8').read()
js = '// Embebido para uso inline. JSON crudo original: data-<chart>.json (regenerable con scripts/).\nconst DATA_<CHART> = ' + data + ';\n'
open('../data-<chart>.js', 'w', encoding='utf-8').write(js)
"
```

(reemplazando `<chart>` y `<CHART>` por marimekko, scatter, deciles).

## Notas

- Los scripts evitan caracteres Unicode raros en los `print()` (Windows
  cp1252 default crashea con flechas y supraíndices). Para escritura de
  archivos siempre `encoding='utf-8'` explícito.
- El JSON se serializa con `ensure_ascii=False, separators=(",", ":")`
  para que pese menos al embeberse.
- El ajuste 1,13 aplicado al Gini de consumo es convención del Banco
  Mundial para hacerlo comparable al Gini de ingreso. Los scripts
  preservan ambos: `gini_raw` (sin ajuste) y `gini_adj` (con ajuste).
