# Placas Brasil 2026 · cobertura en streaming

Versión web (placas, mapa 2022 y encuestas): https://dschteingart.github.io/el-atlas-charts/brasil-2026/ — el escrutinio en vivo solo anda en la copia local, con `EN_VIVO_1ra_vuelta.bat`.

Placas 16:9 (1920×1080) con la estética de El Atlas, más un mapa electoral que se actualiza solo con el escrutinio del TSE.

## Uso rápido

| Querés… | Hacé doble clic en |
|---|---|
| Mostrar las placas | `index.html` (o `PLACAS.bat`). Se abre directo del disco: no necesita internet ni servidor |
| Escrutinio en vivo, domingo 4/10 | `EN_VIVO_1ra_vuelta.bat` |
| Escrutinio en vivo, domingo 25/10 | `EN_VIVO_2da_vuelta.bat` |
| Ensayar el mapa y la proyección en vivo (datos ficticios) | `SIMULACRO_ensayo.bat` |

Los `.bat` de vivo abren el mapa en el navegador y dejan una ventana negra que consulta al TSE: **no la cierres** mientras estés al aire. El mapa relee los datos cada 15 segundos.

### Teclas
- `←` `→` (o PageUp/PageDown de un clicker): placa anterior / siguiente
- `G`: índice de placas · `F`: pantalla completa · `T`: cambia la vista (empleo, consumo)
- En el mapa: clic en un estado para acercarse; clic en un municipio para ver sus datos (resultado, cambio vs 2022 o comparación con Brasil). Buscador arriba a la derecha (estados y municipios, sin importar tildes). `Esc` o el botón de arriba a la izquierda vuelven un paso (municipio → estado → Brasil)
- La barra de navegación y el cursor se ocultan solos a los 2,5 s

### En OBS / vMix
Lo más simple es capturar la ventana del navegador en pantalla completa (`F`). Si usás fuente de navegador (1920×1080), la URL es la ruta del archivo más la placa:
`file:///C:/ruta/a/la/carpeta/index.html#pib`, y lo mismo con `#desempleo`, `#empleo`, `#pobreza`, `#ingreso`, `#gini`, `#homicidios`, `#consumo`, `#fiscal`, `#comercio`, `#encuestas` (`#encuestas?vista=2v` para el balotaje), `#mapa`, `#proyeccion` (`#proyeccion?vista=2` para el balotaje), `#sociedad` (`?vista=ingreso`, `raza`, `religion`, `vivo`).
El mapa acepta su estado en la URL, para tener escenas listas:
- `#mapa?e=2022-2&n=mun` → 2ª vuelta 2022 por municipio
- `#mapa?e=2026-1` → escrutinio en vivo 1ª vuelta (estados)
- `#mapa?e=2026-1&n=mun&m=cand&c=13` → % de Lula por municipio
- `#mapa?e=2026-1&m=delta&c=13` → cambio de Lula vs 2022 (puntos)
- `&uf=SP` → arranca acercado a un estado
- `&mun=3106200` → arranca con un municipio elegido (código IBGE; este es Belo Horizonte)

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

## La proyección en vivo (placa 13, `#proyeccion`)

Mientras corre `EN_VIVO_…bat`, `vivo.py` calcula además una **proyección del resultado final** (`proyeccion.py`) y la placa 13 la muestra al lado del conteo, con un gráfico de cómo se movieron las dos cosas a medida que avanzó el escrutinio. Solo existe en la copia local (en la web no aparece).

**Por qué hace falta.** El conteo parcial engaña porque las urnas no llegan en orden aleatorio: en 2022 el Nordeste entró más tarde y Lula recién pasó a Bolsonaro con 70% escrutado en la 1ª vuelta y con 67,8% en el balotaje.

**Cómo funciona.**
1. En cada municipio ya contado se mide cuánto cambió el voto respecto de 2022 (misma vuelta): Lula contra Lula, Flávio contra Jair, el resto contra el resto. Se mide en *log-odds* (no en puntos) para no proyectar más de 100% en los bastiones.
2. Para los municipios que faltan, ese cambio se estima con una regresión (según cuánto votó cada lugar en 2022 y su tamaño) más efectos de región, estado, región intermedia y región inmediata del IBGE, cada uno "encogido" hacia el nivel de arriba cuando hay pocos municipios contados.
3. Los votos esperados de cada municipio salen de los de 2022 ajustados por la participación que se va viendo.
4. Dentro del "resto", el reparto entre Caiado, Zema, etc. sale de lo que se ve en el mismo estado y región (Caiado pesa en Goiás, Zema en Minas).
5. Se muestra cuando hay al menos 2% de los votos contados y datos de 20 estados.

**Prueba (`scripts/probar_proyeccion.py`).** Simulé el escrutinio de 2022 sección por sección (unas 470.000 urnas, con el orden calibrado para que Lula pase adelante cuando pasó de verdad) y lo proyecté usando 2018 como referencia, un salto mucho más grande que el de 2022 a 2026 (Haddad 29% → Lula 48%). Error en la diferencia Lula−Bolsonaro, en 9 de cada 10 simulaciones:

| Escrutado | Conteo crudo (1ª vuelta) | Proyección, orden como 2022 (1ª vuelta) | Proyección con un sesgo que el modelo no ve (1ª / balotaje) |
|---|---|---|---|
| 5% | 16 pts | 1,5 pts | 1,0 pts (1ª) / 3,4 pts (balotaje) |
| 10% | 16 pts | 1,2 pts | 0,8 / 1,9 pts |
| 20% | 15 pts | 0,7 pts | 0,4 / 0,6 pts |
| 50% | 10 pts | 0,3 pts | 0,2 / 0,1 pts |

En el peor caso que probé (dentro de cada estado entran primero los municipios donde menos cambió el voto, con un sesgo fuerte), la proyección del margen erró 4,9 pts con 10% escrutado y 1 pt con 50%: **en los primeros minutos hay que leerla con cuidado**. El "±" de la placa sale de esta prueba (percentil 90), con un piso prudente.

**Ensayo.** `SIMULACRO_ensayo.bat` también genera la proyección. El simulacro ahora mueve votos de Lula a Flávio (más en el Nordeste) y hace que el Nordeste y el Norte se cuenten más tarde, así el conteo parcial engaña como en 2022: con 25% escrutado el conteo daba Flávio +9 y la proyección Lula +1,0 (resultado final del simulacro: Lula +1,0 a +1,3).

## Quién votó a quién (placa 14 en la copia local, 13 en la web, `#sociedad`)

Cruza el balotaje 2022 municipio por municipio con cuatro indicadores: familias con Auxílio Brasil (hoy Bolsa Família) cada 100 hogares, ingreso por persona del hogar (Censo 2022), % de blancos y % de evangélicos. A la izquierda, barras de Lula y Bolsonaro en diez grupos de municipios con la misma cantidad de votos; a la derecha, cada municipio es un punto (con buscador). La vista **"En vivo 2026"** (solo en la copia local) muestra, mientras corre `EN_VIVO_…bat`, cuánto sube o baja Lula respecto de 2022 en esos mismos grupos. Fuentes y correlaciones: `data/raw/socio_sources.md`; datos: `python scripts/armar_socio.py`.

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

## Versión web (El Atlas)
- Está en el índice de El Atlas como "Especial · Elecciones Brasil": https://dschteingart.github.io/el-atlas-charts/brasil-2026/ (en inglés: `index-en.html`, que es la que conviene compartir porque trae la tarjeta en inglés).
- En la web, `index.html` sin `#placa` abre primero una **portada** como la de las otras entregas (título, bajada y una tarjeta por gráfico con miniatura, número y título); cada tarjeta lleva a su placa y "Ver todos los gráficos" vuelve a la portada. Los links a una placa (`index.html#mapa`, etc.) siguen entrando directo. En la copia local (streaming) no hay portada: abre la placa 1.
- En la web lleva el chrome de El Atlas: barra superior (EL ATLAS · ELECCIONES BRASIL, suscripción, ES/EN) y abajo los botones **Descargar datos (CSV)** / **Descargar PNG** (de la vista que se está mirando) y la navegación ← GRÁFICO N / 12 →. En la copia local (streaming) no hay barras. `?modo=web` o `?modo=stream` fuerzan una u otra.
- En la web los botones 2026 del mapa están deshabilitados ("A la espera de resultados"); en la copia local siguen andando para el streaming.

## Para actualizar algo
- Después de tocar `css/placas.css` o `fonts/fonts.css`: `python scripts/armar_estilos.py` (arma `js/estilos.js`, que usa la página y la descarga en PNG).
- Miniaturas de la portada (`thumbs/<placa>.png` y `.en.png`): salen de `png/`, así que después de `python scripts/exportar_png.py` correr `python scripts/armar_thumbs.py` (y subir `THUMB_V` en `js/placas.js`).
- Sumar una encuesta nueva: agregar la fila en `data/raw/polls_first_round.csv` (o `polls_second_round.csv`) y correr `python scripts/agregar_encuestas.py`. El título de la placa se recalcula solo con el último promedio.
- Cambiar un dato: editar el CSV en `data/raw/` y correr `python scripts/armar_series.py`.
- Títulos, bajadas y notas de cada placa: `js/placas.js` (arriba de todo está la firma, `MARCA`).
- Colores de candidatos del mapa: `js/mapa.js`, objeto `COLOR` (por número de urna).
- Después de editar un `.js`, subí el número `V` en `index.html` para que el navegador no use la versión vieja.
