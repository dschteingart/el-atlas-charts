# Placas Brasil 2026 · cobertura en streaming

Versión web (placas, mapa 2022 y encuestas): https://dschteingart.github.io/el-atlas-charts/brasil-2026/ — el escrutinio en vivo solo anda en la copia local, con `EN_VIVO_1ra_vuelta.bat`.

Placas 16:9 (1920×1080) con la estética de El Atlas, más un mapa electoral que se actualiza solo con el escrutinio del TSE.

## Uso rápido

| Querés… | Hacé doble clic en |
|---|---|
| Mostrar las placas | `index.html` (o `PLACAS.bat`). Se abre directo del disco: no necesita internet ni servidor |
| Escrutinio en vivo, domingo 4/10 | `EN_VIVO_1ra_vuelta.bat` |
| Escrutinio en vivo, domingo 25/10 | `EN_VIVO_2da_vuelta.bat` |
| Ensayar el mapa en vivo (datos ficticios) | `SIMULACRO_ensayo.bat` |

Los `.bat` de vivo abren el mapa en el navegador y dejan una ventana negra que consulta al TSE: **no la cierres** mientras estés al aire. El mapa relee los datos cada 15 segundos.

### Teclas
- `←` `→` (o PageUp/PageDown de un clicker): placa anterior / siguiente
- `G`: índice de placas · `F`: pantalla completa · `T`: cambia la vista (empleo, consumo)
- En el mapa: clic en un estado para acercarse, `Esc` o "← Brasil" para volver
- La barra de navegación y el cursor se ocultan solos a los 2,5 s

### En OBS / vMix
Lo más simple es capturar la ventana del navegador en pantalla completa (`F`). Si usás fuente de navegador (1920×1080), la URL es la ruta del archivo más la placa:
`file:///C:/ruta/a/la/carpeta/index.html#pib`, y lo mismo con `#desempleo`, `#empleo`, `#pobreza`, `#ingreso`, `#gini`, `#homicidios`, `#consumo`, `#fiscal`, `#comercio`, `#encuestas` (`#encuestas?vista=2v` para el balotaje), `#mapa`.
El mapa acepta su estado en la URL, para tener escenas listas:
- `#mapa?e=2022-2&n=mun` → 2ª vuelta 2022 por municipio
- `#mapa?e=2026-1` → escrutinio en vivo 1ª vuelta (estados)
- `#mapa?e=2026-1&n=mun&m=cand&c=13` → % de Lula por municipio
- `#mapa?e=2026-1&m=delta&c=13` → cambio de Lula vs 2022 (puntos)
- `&uf=SP` → arranca acercado a un estado

Agregá `?png=1` antes del `#` para sacar animaciones y navegación. Las imágenes fijas están en `png/` (regenerarlas: `python scripts/exportar_png.py`).

## El escrutinio en vivo: de dónde sale

El TSE publica los resultados en archivos JSON en `https://resultados.tse.jus.br/oficial/ele2026/…`, los mismos que usa su app "Resultados". Presidente 1ª vuelta = elección **6257**; 2ª vuelta = **6258**. Hay un archivo por nivel:

- `6257/dados/br/br-c0001-e006257-u.json` → Brasil
- `6257/dados/sp/sp-c0001-e006257-u.json` → un estado (`zz` = exterior)
- `6257/dados/sp/sp71072-c0001-e006257-u.json` → un municipio (código TSE)
- `6257/dados/sp/sp-e006257-ab.json` → % de secciones escrutadas de cada municipio del estado

El navegador no puede leerlos directo (el TSE no habilita CORS), así que `vivo.py` los baja cada 30 s, pide solo los municipios que cambiaron y deja el resumen en `data/vivo/2026-1.js` (y `.json`), que el mapa relee del disco cada 15 s. No se usa servidor local: en esta máquina algo (probablemente el antivirus) corta las descargas por localhost. Los porcentajes se calculan igual que el TSE (sobre votos válidos). Ya lo probé contra el servidor real: hoy responde con los 13 candidatos y todo en cero.

- La divulgación arranca cuando cierran las urnas, **17 h de Brasilia = 17 h de Argentina**.
- Si el TSE se cae o tarda, el mapa sigue mostrando la última foto y la hora del dato.
- Opciones: `python vivo.py --intervalo 20` (consultar más seguido); `--servir` levanta además http://localhost:8026 si alguna vez hace falta.
- El simulacro escribe el mismo archivo pero marcado: el mapa muestra "SIMULACRO · DATOS FICTICIOS" en grande. Al arrancar el modo real, el archivo del simulacro se borra solo.
- Boa Esperança do Norte (MT) vota por primera vez en 2026 y no está en la malla del IBGE: sus votos cuentan en MT y en Brasil, pero no se dibuja.

## Datos y fuentes (bajados el 2/10/2026)

| Placa | Fuente | Último dato |
|---|---|---|
| PIB | IBGE, Cuentas Nacionales (SIDRA 5932) · 2026: mediana Focus del BCB | 2025 · proyección 2026 = 1,86% (Focus 25/9) |
| Desempleo | IBGE, PNAD Contínua, trimestres móviles (SIDRA 6381) | jun–ago 2026: 5,3% |
| Composición del empleo | IBGE, PNAD Contínua (SIDRA 4361/6320, 4362; informalidad 4708/8513) | jun–ago 2026 |
| Pobreza | IBGE, Síntesis de Indicadores Sociales 2025 (US$ 6,85 y 2,15 PPA 2017) | 2024 (2025 sale en diciembre) |
| Ingreso real | IBGE, PNAD Contínua (SIDRA 6389), en R$ de jun–ago 2026 | jun–ago 2026 |
| Gini | IBGE, PNAD Contínua anual (SIDRA 7435) | 2025 |
| Homicidios | Atlas da Violência 2026 (SIM) y Anuario FBSP 2026 (MVI) | 2024 (SIM) y 2025 (MVI) |
| Consumo de los hogares | IBGE, Cuentas Nacionales | 1er semestre 2026 |
| Resultado fiscal | BCB, SGS 5793 (primario) y 5727 (nominal) | 12 meses a ago-2026 |
| Comercio con Argentina | Secex/MDIC, Comex Stat | últimos 12 meses (sep-25 a ago-26) |
| Encuestas | Datafolha, Quaest, AtlasIntel, Ipec y otras (detalle en `data/raw/polls_sources.md`) | ver placa |
| Mapa 2022 | TSE, datos abiertos (votacao_candidato_munzona 2022), validado contra el oficial | final |

Detalle de cada serie (tablas, códigos, advertencias metodológicas): `data/raw/*_sources.md`. Los CSV originales están en `data/raw/`.

## Para actualizar algo
- Sumar una encuesta nueva: agregar la fila en `data/raw/polls_first_round.csv` (o `polls_second_round.csv`) y correr `python scripts/agregar_encuestas.py`. El título de la placa se recalcula solo con el último promedio.
- Cambiar un dato: editar el CSV en `data/raw/` y correr `python scripts/armar_series.py`.
- Títulos, bajadas y notas de cada placa: `js/placas.js` (arriba de todo está la firma, `MARCA`).
- Colores de candidatos del mapa: `js/mapa.js`, objeto `COLOR` (por número de urna).
- Después de editar un `.js`, subí el número `V` en `index.html` para que el navegador no use la versión vieja.
