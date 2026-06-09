# HANDOFF — El Atlas N° 3 (Fútbol): scatter ELO vs PIB

> Transferencia de un gráfico prototipado en Claude Chat hacia el repo modular `el-atlas-charts` (Claude Code).
> Proyecto: El Atlas — Cartografías del desarrollo. Autor: Daniel Schteingart.
> Este número: **N° 3 — Fútbol** (la excepcionalidad futbolística sudamericana).

---

## 1. Qué es este gráfico

Un **scatterplot** que cruza el **rendimiento futbolístico** de las selecciones nacionales (eje Y) contra el **tamaño de su economía** (eje X), para mostrar que **Sudamérica rinde muy por encima de lo que su PIB predice** — la misma lógica "excepcionalidad latinoamericana vs línea global" de los charts del N° 1, aplicada al fútbol.

- **Eje Y:** ELO promedio de la selección en el período elegido (medida absoluta de fuerza).
- **Eje X:** PIB **total** (no per cápita), PPA en US$ internacionales constantes, **escala logarítmica**.
- **Por qué PIB total y no per cápita:** el ELO es una medida **absoluta** (no normalizada por habitante). El "recurso" futbolístico de un país escala con su economía total, no con su ingreso per cápita. (Decisión editorial de Daniel, correcta.)
- **Color de los puntos:** confederación FIFA (CONMEBOL, UEFA, CONCACAF, CAF, AFC, OFC) — el equivalente a las "regiones" de los scatters del N° 1.
- **Recta:** regresión global OLS `ELO ~ log10(PIB)`. El **residuo** de cada país/confederación (distancia vertical a la recta) es la métrica narrativa central.

**La feature nueva respecto a los scatters del N° 1: un slider temporal** que permite elegir el período (1980–2026). Todo (promedios, regresión, R², residuos) se recalcula con el período.

---

## 2. Encaje con la arquitectura modular (`lib/`)

Este gráfico es un **scatter con regiones + regresión**, así que reutiliza casi toda la lógica de `lib/chart-scatter.js` y `lib/label-placement.js`. Diferencias a contemplar:

| Aspecto | Charts N° 1 | Este gráfico (N° 3) |
|---|---|---|
| "Regiones" | 10 regiones geográficas | 6 confederaciones FIFA |
| Eje X | PIB per cápita | PIB **total** |
| Eje Y | satisfacción / homicidios (snapshot) | ELO **promedio de un período** |
| Datos | un valor por país (snapshot) | **series por año** (ELO y PIB 1980–2026) |
| Control nuevo | toggle Lineal/Log | **slider temporal de rango** |
| Banner | — | n, R², **residuo** de confederación |

Lo único genuinamente nuevo para la `lib` es el **slider temporal** (un control de rango que dispara recálculo de promedios + regresión). El buscador con chips ya existe en `lib/chart-timeseries.js` (chart 3 del N°1) — se puede reusar tal cual.

**Sugerencia de carpeta:** `03-futbol/` con su `index.html` + `data/series_elo_pib.json` + `data/futbol_paises.csv`.

---

## 3. Los datos (en `data/`)

### 3.1. `series_elo_pib.json` — el dataset del scatter
Array de 184 países. Cada elemento:
```json
{ "iso3":"ARG", "name":"Argentina", "confed":"CONMEBOL",
  "elo": {"1980":1974, ..., "2026":2114},     // ELO de fin de año, 1980–2026
  "gdp": {"1980":617429502950, ..., "2026":1321479388744} }  // PIB total PPA const, 1980–2026
```
- Claves de año son strings. ELO: rating de fin de año. PIB: US$ internacionales constantes (PPA).
- El gráfico calcula, para el período `[y0,y1]`: ELO promedio = media de `elo[y]`; PIB = media de `gdp[y]`; x = log10(PIB).

### 3.2. `futbol_paises.csv` — resumen por país (para otros gráficos del número)
Una fila por país (184) con TODO lo del proyecto fútbol, por si querés armar más gráficos (ej. **año mediano de fundación de clubes**, federación, afiliación FIFA):

`iso3, pais, confederacion, clubes_total, clubes_con_fecha, mediana_fundacion, mediana_fundacion_pond, fed_fundacion, fifa_afiliacion, elo_actual, elo_pico, elo_anio_pico, elo_promedio, elo_prom_2000_2026, pib_ppa_2024, residuo_elo_pib_2000_2026, residuo_elo_pib_1980_2026`

- `mediana_fundacion` / `_pond`: año mediano de fundación de los clubes del país (simple / ponderado por relevancia=sitelinks de Wikipedia). Calculado sobre un universo de **41.894 clubes** bajado de Wikidata.
- `fed_fundacion`: año de fundación de la federación nacional. `fifa_afiliacion`: año de ingreso a FIFA.
- `residuo_*`: residuo del scatter ELO~log(PIB) en cada período (ya calculado).

### 3.3. Paleta de confederaciones (a meter en `lib/regions.js` o equivalente)
```js
const CONF_COLORS = {
  CONMEBOL:'#BE5D32',  // terracota = acento Atlas (protagonista)
  UEFA:    '#3E5A6E',
  CAF:     '#6B8E5A',
  AFC:     '#C99A3B',
  CONCACAF:'#8B5A8C',
  OFC:     '#4A9BA8'
};
```
Orden de leyenda: CONMEBOL, UEFA, CONCACAF, CAF, AFC, OFC.

---

## 4. Comportamiento e interacciones (ver `current_state/scatter_elo_pib.html`)

- **CONMEBOL etiquetado por defecto:** al abrir, los 10 países sudamericanos aparecen con etiqueta (como los scatters del N°1 muestran LATAM). Sus chips aparecen en la barra de selección.
- **Chips de confederación (leyenda):** hover → resalta esa confederación (atenúa el resto al 10%) y muestra su residuo en el banner; clic → la oculta/muestra.
- **Buscador de países:** input con dropdown (búsqueda sin acentos, flechas + Enter + Escape) → etiqueta el país elegido. También clic en un punto lo etiqueta/desetiqueta. Chips removibles. (Réplica del buscador del chart 3 del N°1.)
- **Slider temporal:** rango 1980–2026, default 2000–2026. Recalcula promedios, regresión, R² y residuos.
- **Banner:** n (tamaño de muestra), R², residuo de la confederación (CONMEBOL por defecto, o la que esté en hover), período.

### 4.1. Decisiones / gotchas IMPORTANTES (respetar)
1. **La regresión, R² y residuos dependen SOLO del slider (período), NUNCA del clic en confederaciones.** El clic en un chip solo oculta puntos visualmente; la recta de referencia es siempre global (todos los países del período). Daniel fue explícito en esto.
2. **No usar transiciones D3 en el redibujo del slider.** Causaban lag intermitente (se encolaban transiciones de 400ms). El redibujo debe ser instantáneo (~6ms); la opacidad se anima por CSS. Esto vale para cualquier control que dispare recálculo frecuente.
3. **Formato de moneda en ESPAÑOL:** `mil M` = miles de millones (10⁹), `bill.` = billón (10¹²). **Nunca** la notación anglo B/T (que confunde billón≠billion).
4. **Eje X siempre log** (el PIB abarca de ~$10 mil M a ~$30 bill.).

---

## 5. Metodología — cómo se construyó cada variable

### 5.1. ELO (eje Y)
- **Fuente:** World Football Elo Ratings (eloratings.net), el sistema ELO adaptado al fútbol.
- **1901–2023:** del repo GitHub `JGravier/soccer-elo` (CSV consolidado, rating al 31-dic de cada año).
- **2024–2026:** scrapeado directo de `https://www.eloratings.net/{año}.tsv` (formato: col1=rank global, col2=código alpha-2/propio, col3=rating). Códigos traducidos a nombre con `https://www.eloratings.net/en.teams.tsv`.
- **Fronteras (clave):** una selección es **indivisible** → se hereda por el **Estado sucesor FIFA**: URSS→Rusia, Yugoslavia/Serbia y Montenegro→Serbia, Checoslovaquia→Chequia, Alemania Occidental+Oriental→Alemania, coloniales→Estado actual (Gold Coast→Ghana, etc.). Las **selecciones no-FIFA concurrentes** con su soberano (Tahití, Tíbet, Zanzíbar, Kurdistán, Chipre del Norte, Escocia/Gales/Irlanda del Norte) se **descartan** (no se suman). Reino Unido = Inglaterra (representativa).

### 5.2. PIB total PPA constante (eje X)
- **Fuente:** FMI, *World Economic Outlook* (abril 2026).
- El WEO **no** publica PIB total en PPA constante directamente. Se calcula: **`PIB total = PIB per cápita const. PPA (NGDPRPPPPC) × población (LP)`**.
- Cobertura **1980–2026** (2025–26 son estimaciones del FMI; no se repite 2024). Validado: USA 2021 ≈ $23,7 bill.

### 5.3. Confederaciones (color)
- De Wikidata, por QID de cada confederación (UEFA Q35572, AFC Q83276, CAF Q168360, CONCACAF Q160549, CONMEBOL Q58733; OFC asignado manual).
- **GOTCHA grave:** las federaciones de territorios de ultramar (Bermudas, Caimán, Anguila, Guadalupe, Martinica…) tienen en Wikidata `P17` = Estado soberano (Reino Unido/Francia/EEUU) y varias **son** miembros FIFA → su ISO3 resuelve al del soberano y contaminan su confederación (metían FRA/GBR en CONCACAF, USA en AFC). Fix: filtrar member-of-FIFA + override del soberano (FRA→UEFA, GBR→UEFA, USA→CONCACAF). **Verificar siempre: ningún país en >1 confederación, y CONCACAF debe ser solo países americanos.**

### 5.4. Año mediano de clubes, federación, FIFA (para otros gráficos)
- **Clubes:** universo de **41.894 clubes** de Wikidata (`instance of` association football club, vía SPARQL). Año mediano de fundación simple y ponderado por relevancia (nº de Wikipedias = sitelinks). País asignado a la ubicación **actual** (clubes de la URSS/Yugoslavia repartidos por ciudad).
- **Federación:** año de fundación (P571) y afiliación a FIFA (calificador P580 del vínculo member-of-FIFA), de Wikidata.

---

## 6. Hallazgos principales (para la prosa del número)

**Residuos por confederación** (cuánto rinde cada una sobre/bajo lo predicho por su PIB, período 2000–2026):

| Confederación | Residuo ELO |
|---|---|
| CONMEBOL | **+273** |
| UEFA | +145 |
| CONCACAF | +50 |
| CAF | +33 |
| OFC | −107 |
| AFC | **−285** |

- **CONMEBOL sobre-rinde como ninguna** (el doble que UEFA); **AFC (Asia) sub-rinde fuerte** (economías gigantes, fútbol modesto — el fútbol pierde contra cricket/otros).
- **Top países que sobre-rinden** (2000–2026): Uruguay +473, Croacia +434, Portugal +391, Argentina +365, Paraguay +362, Montenegro +362, Serbia +328, España +326, Senegal +319, Cabo Verde +315.
- **Top que sub-rinden:** Pakistán −764, Taiwán −731, Bangladés −702, India −691, Sri Lanka −679 (los 10 peores son **todos** de AFC).
- R² ≈ 0,44 (el PIB explica ~44% del ELO; el resto es la "excepcionalidad").

---

## 7. Cómo regenerar los datos (scripts en la carpeta del proyecto fútbol)

Si hay que actualizar (no necesario para integrar, pero por trazabilidad). Los scripts están en `insumos/#3 - Futbol/`:
- `build_gdp_fmi.py` — PIB del FMI (lee `WEOApr2026all.xlsx`, hoja "Countries") → `gdp_fmi.csv`.
- `fix_confed.ps1` — confederaciones por QID con fix de territorios → `confed.csv`.
- `build_elo_combined.ps1` — combina ELO 1901–2023 + 2024–26 de eloratings → serie.
- `build_viz_data.ps1` — arma `elo_gdp_data.js` (series por país).
- `build_handoff_data.py` — genera este bundle (`series_elo_pib.json`, `futbol_paises.csv`).

---

## 8. Archivos de este bundle

```
handoff-futbol/
├── HANDOFF.md                       # este documento
├── PROMPT_INICIAL.md                # prompt para pegar en la sesión de Claude Code
├── current_state/
│   ├── scatter_elo_pib.html         # gráfico funcionando — REFERENCIA visual y de comportamiento
│   └── elo_gdp_data.js              # datos embebidos que usa ese HTML
└── data/
    ├── series_elo_pib.json          # series ELO+PIB por país (para integrar)
    └── futbol_paises.csv            # resumen por país con todo (clubes, año mediano, fed, FIFA, ELO, residuos)
```
