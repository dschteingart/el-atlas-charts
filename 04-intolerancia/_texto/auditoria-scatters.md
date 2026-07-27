# Auditoría de scatters del Atlas

## Matriz de features

## Matriz feature × scatter

Columnas: **N1** = N°1 charts 1 y 2 (`01-bienestar-violencia/scatter.js`, motor único para los dos) · **N2** = N°2 Gini vs PIB (`02-demasiado-desiguales/scatter.js`) · **N3elo** = N°3 Elo vs PIB (`03-futbol/scatter.js`) · **N3tal** = N°3 talento vs clubes (`03-futbol/talento-clubes.js`) · **N5decl** = declarado vs implícito (`05-intolerancia/declarado-implicito.js`) · **N5des** = desarrollo (`05-intolerancia/desarrollo.js`) · **N5corr** = correlaciones (`05-intolerancia/correlaciones.js`).

Leyenda: SÍ / NO / **PARC** (parcial) / — (no aplica) / n/d (no verificado).

### Bloque 1 — Etiquetas de país

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Usa el motor compartido `lib/scatter-render.js` | **PARC** (greedy propio, usa 2 de 8 fns) | SÍ | SÍ | **NO** (greedy inline propio) | SÍ | SÍ | SÍ |
| Anti-colisión greedy | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ |
| Relajación 2D `s_relaxLabels` **en desktop** | NO | NO | NO | NO | NO | **SÍ** | **SÍ** |
| Relajación 2D en PNG / mobile | SÍ (220) | SÍ (260) | SÍ (260) | SÍ (260+100) | SÍ (60) | SÍ (220) | SÍ (220) |
| Líneas guía (leader lines) | SÍ (solo big) | SÍ (solo big) | SÍ (solo big) | SÍ (solo big) | SÍ | SÍ | SÍ |
| La guía arranca en el **borde** del punto y termina en el borde de la caja | SÍ | SÍ | SÍ | SÍ | **NO** (centro → adentro del texto) | **NO** | **NO** |
| Repulsión etiqueta ↔ punto | SÍ | SÍ | SÍ | SÍ (+ pasada final solo-punto) | SÍ | SÍ | SÍ |
| Obstáculos = solo puntos etiquetados (criterio N°1) | SÍ | SÍ | SÍ | SÍ | **NO** (todos) | **NO** (todos) | **NO** (todos) |
| Si la etiqueta no entra | descarta (Tier 0 fuerza) | descarta | descarta | **fuerza y pisa** | descarta | descarta | descarta |
| Etiquetado automático de extremos (max/min) | NO | **SÍ** | NO (removido a pedido) | NO | NO | NO | NO |
| Cap de drift + pull-back estilo OWID | **SÍ (único)** | NO | NO | NO | NO | NO | NO |
| Snap direccional 8 dirs con línea de visión | **SÍ (único)** | NO | NO | NO | NO | NO | NO |
| Clamp que permite invadir el margen derecho | NO | NO | NO | **SÍ (único)** | NO | NO | NO |
| Mide el ancho del texto en canvas (vs estimar por nº de caracteres) | **NO** (estima) | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ |

### Bloque 2 — Leyenda de regiones / confederaciones

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Leyenda interactiva (algún listener) | SÍ | SÍ | SÍ | SÍ | **NO (cero `addEventListener`)** | SÍ | SÍ |
| **Hover sobre una región → etiqueta a los países de esa región** | **SÍ** `:745` | **SÍ** `:800` | **SÍ** `:730` | **SÍ** `:560` | **NO** | **NO** | **NO** |
| Hover atenúa el resto | SÍ | SÍ | SÍ | SÍ | NO | SÍ | SÍ |
| Hover gateado tras `HAS_HOVER` (muere en touch) | SÍ | SÍ | SÍ | NO | — | NO | NO |
| Click = apaga / prende la región | SÍ | SÍ | SÍ | SÍ | NO | SÍ | SÍ |
| **Apagar una región cambia el modelo** | NO | NO | NO | — | — | **SÍ** | **SÍ** |
| Sticky / pin de la región del banner | NO | NO | **SÍ** | SÍ | — | **NO** (campo `pinRegion` muerto) | NO |
| Botón "ver todas las regiones" | NO | NO | NO | NO | — | **SÍ** | **SÍ** |
| Residuo de la región dentro del chip de leyenda | NO | NO | **SÍ** | — | — | NO | NO |
| Dónde vive la leyenda | HTML | HTML | HTML | HTML | SVG | SVG | SVG |
| La leyenda del PNG respeta el filtro de regiones | **NO** | **NO** | **NO** | **NO** | — | SÍ | SÍ |

### Bloque 3 — Modelo y estadística

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Regresión lineal (OLS) | SÍ | SÍ | SÍ | **NO** | **NO** | SÍ | SÍ |
| Cuadrática con toggle | NO | **SÍ** | NO | — | — | **SÍ** | **NO** |
| R² calculado | **NO** | SÍ | SÍ | — | — | SÍ | SÍ |
| Residuos por región en **pp** | NO | SÍ | SÍ | — | — | SÍ | **NO** |
| Residuos por región en **%** | NO | **SÍ** | **SÍ** | — | — | **NO** | **NO** |
| Banner de estadísticos | NO | SÍ (HTML, abajo) | SÍ (HTML, arriba) | **NO** (CSS del banner sin banner) | NO | SÍ (HTML) | SÍ (HTML, arriba) |
| Estadísticos **dentro del SVG** (o sea: llegan al PNG) | NO | **NO** | **NO** | — | — | **SÍ** (stat strip) | **PARC** (van en la nota de fuentes) |
| Subtítulo dinámico con un valor del modelo | NO | **SÍ** (`{N}% más/menos desigual`) | NO | NO | NO | PARC (interpola variable y ola, no el modelo) | PARC (ídem) |

### Bloque 4 — Ejes y escalas

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Toggle log / lineal | PARC (X en ambos; Y solo ch2) | SÍ | NO (log fijo) | NO | NO | SÍ | — (ejes 0-100) |
| Al togglear, **se re-estima** el modelo | **SÍ (único)** | NO | — | — | — | NO | — |
| Diagonal 45° | NO | NO | NO | NO (tiene 2 líneas de referencia editoriales) | NO | NO | **SÍ** |
| Selector de variable de eje | NO | NO | NO | NO | NO | PARC (solo Y, 24 vars) | **SÍ** (X e Y + invertir) |

### Bloque 5 — Tiempo

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Slider temporal | NO | SÍ (año) | SÍ (rango 2 thumbs) | SÍ (rango 2 thumbs) | NO | SÍ (ola) | SÍ (ola) |
| Botón play | NO | **SÍ** | NO | NO | — | **SÍ** | **SÍ** |
| El chip marca "sin dato en esta ola" | — | NO | NO | NO | — | **NO** | **SÍ (único)** |

### Bloque 6 — Selección y chips

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Chips de países | SÍ | SÍ | SÍ | SÍ | **NO** | SÍ | SÍ |
| **Chips == etiquetas** (WYSIWYG, norma del repo) | PARC | PARC | PARC | PARC | NO | **SÍ** | **SÍ** |
| Default pre-tildado | NO | NO | NO | NO | — | **SÍ** | **SÍ** |
| Seleccionar NO atenúa | **NO** (atenúa) | SÍ | SÍ | SÍ | — | SÍ | SÍ |
| Buscador con navegación por teclado | SÍ | SÍ | SÍ | SÍ | **NO** | SÍ | SÍ |
| Botón "Limpiar" | SÍ (copia local) | **NO** | SÍ | SÍ | NO | SÍ | SÍ |
| País fijo resaltado (ARG) | NO | NO | NO | NO | **SÍ** | **SÍ** | **SÍ** |

### Bloque 7 — Tooltip

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Se reubica a la izquierda en el borde derecho | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ |
| Clamp izquierdo / al viewport | **NO** (no carga `lib/utils.js`) | PARC (clamp global de lib) | PARC | PARC | **NO** | SÍ | SÍ |
| Tap en móvil abre el tooltip | PARC (frágil, sin helpers) | SÍ (hit-area propia) | SÍ | SÍ | SÍ | **NO** (el tap togglea el chip) | SÍ |
| Muestra el valor **predicho** | NO | NO | NO | — | — | **SÍ (único)** | NO |
| Muestra el **residuo** del país | NO | SÍ | SÍ | — | — | SÍ | NO |

### Bloque 8 — PNG / export

| Feature | N1 | N2 | N3elo | N3tal | N5decl | N5des | N5corr |
|---|---|---|---|---|---|---|---|
| Formatos de export soportados | 1 (`square`) | 4 | 4 | 3 | 3 | 4 | 4 |
| Formato `public` sin romper | — | SÍ | SÍ | **NO (crash)** | **NO (crash)** | SÍ | SÍ |
| Leyenda en el PNG | SÍ (canvas aparte) | SÍ (canvas aparte) | SÍ (canvas aparte) | SÍ (canvas aparte) | SÍ (va en el SVG) | SÍ (SVG) | SÍ (SVG) |
| n / R² / residuo llegan al PNG | — | **NO** | **NO** | — | — | **SÍ** | PARC (en la nota al pie) |
| `onBeforePngExport` limpia hover/tooltip antes de rasterizar | NO | SÍ | n/d | n/d | NO | **NO** | **SÍ** |
| El editor (`?nl=1`) controla el formato de verdad | **NO** (inerte) | SÍ | SÍ | SÍ | SÍ | SÍ | SÍ |

### Addendum: dos scatters que no estaban en el pedido y sí existen

Los encontré grepeando `hoverConf|hoverRegion` en todo el repo. **Suben el total de scatters de 7 a 10 y de implementaciones de placement de 3 a 5.**

| | **N°3 chart 10 — altura** (`03-futbol/altura.js`, vista scatter) | **N°3b versus** (`03b-partidos/versus.js`) |
|---|---|---|
| Motor de labels | **propio** (`al_placeScatterLabels`:581, 4 candidatos) | **propio** (`vs_placeScatterLabels`:483) + usa `s_relaxLabels`/`s_labelBox` de lib |
| **Hover región → etiqueta esa región** | **SÍ** — `altura.js:564-566`, con comentario textual *"si hay confederación apuntada → TODOS sus países (como Elo-PIB)"*, wireado en `:636` | **NO** — el hover solo atenúa los labels ya dibujados (`:641`) |
| Leyenda | dentro del SVG **y con listeners** (`:636-638`) | dentro del SVG **y con listeners** (`:663-667`) |
| Diagonal 45° | **SÍ**, y mejor que la de correlaciones: etiqueta rotada sobre la línea, "plantel = país" (`:521-529`) | NO |
| Criterio de placement | cardinales primero | **cardinales primero + elegir por máxima holgura** — el criterio que pediste vos (`:478-482`), y que `lib/` **no** implementa |

Estos dos prueban dos cosas: (1) que una leyenda **dentro del SVG** puede tener hover perfectamente — o sea que el N°5 no perdió la feature por haber movido la leyenda al SVG, la perdió por no cablearla; (2) que la diagonal 45° "nueva" de correlaciones ya existía en el N°3, con una versión más pulida.

## Lo que se perdió

## A. La feature que disparó todo: hover sobre región → revela las etiquetas de esa región

### Dónde existe (5 lugares, todos viejos)

| Archivo | Línea | Código |
|---|---|---|
| `01-bienestar-violencia/scatter.js` | 745-746 | `} else if (hoverReg) { labelTargets = orderedDrawables.filter(d => d.region === hoverReg); }` |
| `02-demasiado-desiguales/scatter.js` | 800-816 | `} else if (hoverReg) { … labelPool.filter(p => p.region === hoverReg).forEach(p => addLabelItem(p, false, sub)); }` |
| `03-futbol/scatter.js` | 730-744 | ídem con `confed` |
| `03-futbol/talento-clubes.js` | 560 | `else if (hoverConf && d.confed === hoverConf) labelTargets.push(d);` |
| `03-futbol/altura.js` | 564-566 | `if (hoverConf) { want = new Set(visible.filter(p => p.confed === hoverConf).map(p => p.code)); … }` |

### Cómo está implementada — no hay ningún truco

**No existe layout precalculado, ni caché, ni geometría especial.** El mecanismo completo es de tres pasos:

1. El chip de leyenda escribe una variable de estado y **redibuja el chart entero**:
   `01:86-89` → `state[chartId].hoverRegion = reg; drawChart(chartId);`
   `02:1013-1016` → `state[2].hoverRegion = region; drawScatter();`
   `03:1007-1013` → `state[1].hoverConf = conf; state[1].stickyConf = conf; drawScatter();`
2. En ese redibujo, el bloque que arma el conjunto de etiquetas es un `if/else if/else`: si hay hover, el conjunto pasa a ser *los países de esa región* en vez de *el default editorial*.
3. **El anti-colisión se re-corre desde cero sobre el conjunto nuevo** (`s_layoutLabels(labelItems, plotBox)` en `02:828` y `03:746`; `placeLabels(...)` en `01:780`). Los países que no encuentran hueco se descartan en silencio — ése *es* el mecanismo anti-colisión. Adentro de la región hay jerarquía: las anclas globales de esa región (USA, DEU, FRA, GBR, ESP, ITA, RUS, CHN, JPN, KOR, IND) entran con `subPriority 0` y el resto con 1, así que si hay que sacrificar a alguien se sacrifica al chico.

### Por qué se perdió en el N°5

No fue un olvido: quedó escrito como doctrina. `desarrollo.js:33-38`, textual:

> «Regla de interacción del Atlas respetada acá: el HOVER nunca redibuja el chart — el foco por región se aplica solo por opacidad sobre los círculos ya dibujados (`dv_applyRegionFocus`).»

Y `correlaciones.js:771-772`: «Énfasis al hover: atenúa el resto por OPACIDAD, sin redibujar (redibujar en el hover tilda el chart)».

Esa "regla del Atlas" **no existe en el README ni en la skill**: nació en la sesión de los charts de líneas (donde redibujar en hover efectivamente tildaba) y se generalizó a los scatters. Como en los scatters el redibujo *era* el mecanismo de la feature, aplicar la regla la mató por construcción. Los labels del N°5 se calculan una sola vez, a partir de los chips (`desarrollo.js:665`, `correlaciones.js:708-709`), y el hover solo puede tocar `style.opacity` de lo ya dibujado.

Hay además un conflicto real entre dos criterios tuyos que nadie reconcilió: **"los chips SON las etiquetas" (WYSIWYG)** contra **"el hover revela la región"**. En el N°5 ganó el primero por default. Son compatibles — el hover es un estado transitorio, no una selección — pero había que decirlo en algún lado.

Caso aparte: `declarado-implicito.js` ni siquiera tiene el problema, porque su leyenda (`sc_drawLegend:225-252`) **no registra un solo listener**. Es un dibujo.

## B. Todo lo demás que los viejos tenían y el N°5 perdió

| Lo perdido | Dónde estaba | Qué pasó en el N°5 |
|---|---|---|
| **Residuos por región en %** | `02:223-237` (`residuals_pct`), `03:236-255` | `desarrollo.js:313-327` calcula solo pp. Y era el % lo que alimentaba el subtítulo y el banner del N°2 |
| **Subtítulo que reporta el modelo** | `02:305-317` → *"América Latina es {N}% más desigual de lo esperado"* | Los subtítulos del N°5 interpolan variable y ola, nunca un número del ajuste |
| **Etiquetado automático de extremos** | `02:788-789` | No existe: si el país más extremo no está en los chips, no se ve quién es |
| **Residuo de cada región dentro de su chip de leyenda** | `03:1004`, `updateLegendResiduals:854-867` | No existe |
| **Sticky del banner** (queda en la última región visitada) | `03:1011` `stickyConf` | `state[18].pinRegion` se **lee** en `:777` y `:877` pero nunca se le asigna una región — solo `null` (`:129`, `:1257`). Cableado a medias |
| **Cuadrática con toggle** | `02:174-218` | `desarrollo.js` la conservó; `correlaciones.js` la perdió |
| **Override de países desde el editor** | `02:387-388`, `795-799` | `desarrollo.js` lee `AtlasEditor.getConfig()` una sola vez (`:905`) y solo para el subtítulo |
| **Guías que arrancan en el borde del punto** | `01:941-964`, `02:844-867`, `03:766-790` (usan `s_labelBox` para el punto más cercano de la caja) | Los tres del N°5 dibujan del **centro** del punto a un lugar **adentro** del texto |
| **Obstáculos = solo los puntos etiquetados** | `01:797-802`, con el porqué escrito: *"un label de 26px no puede esquivar los ~150 puntos en zona densa… así los labels se acomodan cerca de su punto en vez de huir al borde"* | Los tres del N°5 pasan **todos** los puntos: hacen exactamente lo que ese comentario desaconseja |
| **Cap de drift, pull-back y snap con línea de visión** | `01:807-939`, ~180 líneas | Nunca salieron del N°1. No están en `lib/`, así que nadie los heredó jamás |
| **Criterio "cardinales primero, elegir por máxima holgura"** | `03b/versus.js:478-530`, pedido tuyo | `lib/scatter-render.js` hace lo contrario (diagonal 1:30 primero, first-fit) y es lo que usan los tres del N°5 |

## C. Al revés: lo que los nuevos tienen y conviene propagar hacia atrás

| Mejora del N°5 | Dónde | Por qué vale |
|---|---|---|
| **Stat strip dentro del SVG** | `desarrollo.js:709-712`, con el diagnóstico escrito: *"El banner HTML no entra al PNG (png-export rasteriza el SVG), así que el R² y el residuo regional también van adentro del gráfico"* | Es **el** arreglo del agujero más grande del N°2 y del N°3: hoy sus PNG salen sin n, sin R² y sin residuo. Grep de `banner` en `lib/png-export.js`: cero coincidencias |
| **Leyenda dentro del SVG con auto-escalado** | `correlaciones.js:413-436, 518-528`; `desarrollo.js:804-867` | Resuelve de una el otro bug WYSIWYG: la leyenda canvas de `png-export.js:353-367` ignora `activeRegions`/`hiddenConfs`, así que el PNG del N°1/N°2/N°3 muestra regiones que el lector apagó |
| **Botón "ver todas las regiones"** | `desarrollo.js:133-136`, `correlaciones.js:148-152` | N°1, N°2 y N°3 no tienen forma de deshacer: hay que reclickear chip por chip |
| **Chip con marca "sin dato en esta ola"** | `correlaciones.js:874` + CSS | El N°2 tiene el mismo problema (chip prendido, país sin punto) y no avisa |
| **Chips == etiquetas de verdad + default pre-tildado** | `desarrollo.js:664-665`, `correlaciones.js:706` | Es tu norma y los cuatro viejos la cumplen a medias |
| **Relajación 2D también en desktop** | `desarrollo.js:678`, `correlaciones.js:722` (`bigFmt ? 220 : 80/120`) | Los cuatro viejos apagan el relax justo en desktop, que es donde ocurre el hover: la región densa se resuelve solo con greedy + descarte |
| **Tooltip con predicho + residuo** | `desarrollo.js:950-970` | El N°2 muestra el residuo sin decir contra qué; calcula `yPred` y no lo imprime (`02:949`) |
| **`onBeforePngExport` que limpia el estado** | `correlaciones.js:1151-1156` | Sin eso, exportar con el mouse sobre la leyenda rasteriza todo al 16% de opacidad (le pasa a `desarrollo.js`) |

## D. Bugs verificados de paso (no arreglé nada)

1. **`declarado-implicito.js:37-43`** — `sc_getMargins` no contempla `public` y devuelve `null`; `:87` y `:93` lo desreferencian → **TypeError, gráfico en blanco**. El editor ofrece ese formato (`lib/editor.js:360`). Mismo bug en `talento-clubes.js:39-46`.
2. **`01-bienestar-violencia/scatter.js:938` vs `:966`** — el snap direccional recalcula `anchor` pero el volcado final solo copia `x` e `y`; el texto se dibuja con el anchor viejo y se extiende justo encima del punto que quería esquivar. Se ve en móvil, no solo en el PNG.
3. **`png-export.js:353-367`** — la leyenda del PNG ignora los filtros de región en N°1, N°2, N°3.
4. **`state[18].pinRegion`** — código muerto (ver arriba).
5. **El tap sobre un punto hace tres cosas distintas en los tres charts del N°5**: `declarado-implicito.js:173` → tooltip; `desarrollo.js:660` → togglea el chip y **no** muestra tooltip; `correlaciones.js:702` → tooltip + énfasis.
6. **`declarado-implicito.js:238`** — la leyenda se dibuja dentro del área de plot (`yStart = MARGIN.top + 6`): puede pisar puntos altos.
7. **`s_ols` es dos funciones distintas con el mismo nombre global**: `02:147` lee `.y`, `03:205` lee `.elo`. Hoy no chocan solo porque no comparten página.

## Plan del motor universal

## Plan: el motor universal de scatter

### 0. Diagnóstico en una línea

`lib/scatter-render.js` son 177 líneas y resuelve **solo la geometría de las etiquetas** (~3% del código de scatter del repo: 7,7 kB compartidos contra ~277 kB duplicados). Todo lo demás — modelo, leyenda, hover, banner, chips, buscador, slider, tooltip, layout por formato, CSV — está reescrito entre 4 y 7 veces. El propio archivo lo dice en su línea 16: *"La Etapa 2 moverá el cuerpo del render (drawScatterCore) acá también"*. La Etapa 2 nunca se hizo. **Esto no se arregla con disciplina ni con una skill: se arregla escribiendo la Etapa 2.**

---

### 1. Qué va en `lib/` — dos archivos

#### 1.1 `lib/scatter-render.js` (existe, se le suman las mejoras huérfanas) — **geometría pura**

Sigue siendo funciones puras sin estado. Se le agrega lo que hoy está enterrado en un solo chart:

| Función nueva | De dónde se rescata |
|---|---|
| `s_layoutLabels(items, plotBox, opts)` con `opts.order = 'diagonal-first' \| 'cardinal-first'` y `opts.pick = 'first-fit' \| 'max-clearance'` | el criterio "cardinales primero + máxima holgura" de `03b/versus.js:478-530`, que pediste vos y hoy nadie más usa |
| `opts.onOverflow = 'drop' \| 'force'` | hoy es una decisión hardcodeada y opuesta entre `scatter-render.js:90-93` (descarta) y `talento-clubes.js:628` (fuerza) |
| `s_relaxLabels(..., opts)` con `opts.driftCap`, `opts.pullBack`, `opts.lineOfSight` | las ~180 líneas del N°1 (`01/scatter.js:807-939`) |
| `opts.finalPointPass` | la pasada "los puntos tienen que verse enteros" de `talento-clubes.js:274-301` |
| `opts.allowMargin = {right: N}` | el clamp de `talento-clubes.js:613-616` ("clave para Bolivia/Uruguay") |
| `s_leaderLines(svg, placed, labelH, opts)` | **la función que no existe y se reescribió 7 veces**. Con la geometría correcta: borde del punto → punto más cercano de la caja (`s_labelBox`), no centro → adentro del texto |
| Fix: `s_buildLabelRect` usa alto fijo 14px (`:44`) mientras `s_labelBox` usa alto proporcional (`:106`) | por eso todos pasan 220-260 pasadas de relax: el greedy cree que los labels miden 14px en un PNG donde miden 26 |

**Tamaño: chico-mediano.** Es agregar opciones con default = comportamiento actual, más una función nueva. No rompe a nadie si los defaults se mantienen (excepto el fix del alto, ver §3).

#### 1.2 `lib/scatter.js` (nuevo) — **el motor, con ficha declarativa**

Mismo espíritu que `lib/grapher.js` (que recibe `{defaultView, views:[{id, panelId, chartN, catSel, selKind, init, redrawFull}]}` y no reimplementa ningún renderer). Acá la ficha describe *qué es este scatter*, no *cómo se dibuja*.

```js
const sc = createScatter({
  chartN: 18, svgId: 'chart18', tooltipId: 'tooltip18',

  // ---- DATOS: el motor no sabe de PIB ni de Gini ----
  points: () => [{ id:'ARG', name:'Argentina', group:'Latin America',
                   x: 12345, y: 41.2, meta:{ yearSurvey:2017 } }],
  groups: { order: REGION_ORDER, colors: REGION_COLORS,
            labelColors: REGION_LABEL_COLORS, name: (g, lang) => ... },

  // ---- EJES ----
  x: { scale:'log', toggle:true, title:()=>t('c18-axis-x'), fmt: fmtTickGDP },
  y: { scale:'linear', toggle:false, title:()=>t('c18-axis-y'), select: CR_VARS },
  refLines: [{ kind:'diagonal', label:()=>t('c19-leg-diag') }],   // 45° opcional

  // ---- MODELO ----
  model: { kind:'linear', quadToggle:true, fitOn:'log10x', minN:5,
           residuals:['pp','pct'],
           scope:'visible' },          // ← LA DECISIÓN QUE DIVERGIÓ, AHORA EXPLÍCITA
                                       //   'all' = N°2/N°3 · 'visible' = N°5

  // ---- ETIQUETAS ----
  labels: { base:'selection',          // 'selection' | 'group' | 'list'
            baseList: DV_DEFAULT_SEL,
            extremes: true,            // etiquetar max/min (N°2 sí, N°5 no)
            priority: S_PRIORITY_NONLATAM,
            hoverRevealsGroup: true,   // ← LA FEATURE PERDIDA, UNA LÍNEA DE FICHA
            onOverflow:'drop', relaxOnDesktop:true },

  // ---- LEYENDA ----
  legend: { placement:'svg',           // 'svg' | 'html'  (las dos con hover; ver altura.js)
            hover:'reveal+dim', click:'toggle',
            showAll:true, sticky:true, residualInChip:true },

  // ---- SELECCIÓN ----
  selection: { default:['ARG','BRA',...], search:true, clear:true,
               highlight:'ARG', dimOnSelect:false },

  // ---- TIEMPO ----
  time: { values: ()=>dv_wavesFor(), play:true, playMs:1100,
          markMissingInChip:true },

  // ---- TEXTO Y PNG ----
  banner: { where:'both', items:['n','r2','resid'] },   // 'svg' entra al PNG
  png: { formats:['public','newsletter','square','mobile'], default:'square',
         margins: { square:{top:44,...}, /* … */ } },

  // ---- HOOKS: lo genuinamente específico ----
  hooks: {
    tooltipRows: (p, model, lang) => [ ['Gini', fmt(p.y)], ['Residuo', ...] ],
    subtitle:    (st, model) => t('c2-subtitle-tpl-more').replace('{N}', ...),
    sourceText:  (st, model) => ...,
    csvRow:      (p, st) => ({...}),
    onDraw:      (svg, ctx) => { /* dibujos editoriales propios */ }
  }
});
```

Devuelve: `{ draw(), redrawFull(), getState(), setState(patch), exportCSV() }`, y registra por su cuenta `window.__atlasRedraw`, `__atlasSupportsFormats`, `__atlasDefaultPngFormat` y los `onBeforePngExport*` — o sea, el "Contrato de un chart nuevo" del README lo cumple el motor, no el chart.

**Qué es genuinamente universal (va en el motor, sin opción):**
- placement + relax + guías + halo
- greedy que se re-corre en cada redraw (base de la feature del hover)
- posicionamiento del tooltip (flip derecha/izquierda, clamp izquierdo, tap móvil con `evClientX`/`evClientY`)
- buscador con normalización sin acentos, chips, botón Limpiar
- escalas, ticks, viewBox y márgenes por formato PNG
- OLS + cuadrática + R² + residuos (una sola implementación, sobre `{x,y}` normalizado)
- CSV
- que la leyenda del PNG **refleje el estado** (hoy no lo hace en 4 charts)

**Qué es config por chart (ficha):**
- taxonomía de grupos (regiones OMS / regiones BM / confederaciones — hoy hay 3 taxonomías y `regions-fifa.js` está duplicado en dos carpetas)
- qué se etiqueta por default y qué prioridad tiene cada país
- `model.scope` (apagar una región, ¿cambia o no el modelo?)
- si hay diagonal, si hay play, si hay país destacado
- textos, subtítulo, tooltip, nota de fuentes

---

### 2. Orden de migración

**Paso A — YA, sin motor nuevo: los tres charts del N°5** (no está publicado) — **CHICO**

Agregarles la feature perdida sin refactor. Son 5-10 líneas por chart, calcadas del N°2:

1. `desarrollo.js` y `correlaciones.js`: en el bloque de labels, un `else if (hoverRegion)` antes del filtro por chips. El hover **sí puede redibujar**: son ~160 puntos, es exactamente lo que hacen el N°1, N°2, N°3 y `altura.js` sin tildarse. Si preocupa el costo, la variante barata es redibujar **solo el grupo de labels y guías** (borrar ese `<g>` y re-correr `s_layoutLabels` con el set ampliado) dejando los círculos intactos — así se respeta también la regla "el hover no redibuja el chart".
2. `declarado-implicito.js`: cablear listeners en `sc_drawLegend` (que hoy no tiene ninguno). Precedente exacto de leyenda-en-SVG-con-hover: `altura.js:636-638` y `versus.js:663-667`.
3. Regla WYSIWYG conciliada: **el chip es la selección (persistente), el hover es un estado transitorio**. Las etiquetas reveladas por hover van en un peso/color distinto y desaparecen al salir. No rompe "los chips son las etiquetas".

**Paso B — YA, bugs del N°5** — **CHICO**
- `sc_getMargins` sin `public` → crash (`declarado-implicito.js:37-43`).
- `pinRegion` muerto → o se setea como `stickyConf` del N°3 o se borra.
- Unificar la semántica del tap (hoy son tres distintas en el mismo número). Propuesta: tap = tooltip; el chip se togglea desde el buscador y desde el chip.
- Clamp izquierdo del tooltip en el chart 5.
- Leyenda del chart 5 fuera del área de plot.
- `onBeforePngExport` que limpia hover en `desarrollo.js` (copiar de `correlaciones.js:1151-1156`).

**Paso C — `lib/scatter-render.js` v2** — **CHICO-MEDIANO**
Subir las mejoras huérfanas como opciones con default = comportamiento actual. Publicados no cambian salvo que se les pase la opción. Excepción: el fix del alto de caja en `s_buildLabelRect` **sí** cambia el layout de los publicados → meterlo detrás de `opts.trueHeight = true` y activarlo chart por chart.

**Paso D — escribir `lib/scatter.js` y estrenarlo en el chart de menor riesgo** — **MEDIANO-GRANDE**
El candidato es **`declarado-implicito.js`**: no está publicado, es el más pobre (no tiene modelo, ni chips, ni buscador, ni slider) y por lo tanto es el que menos puede perder y el que más gana. Si el motor lo levanta y le aparecen chips, buscador, leyenda viva y hover-revela, la ficha está bien.

**Paso E — migrar `desarrollo.js` y `correlaciones.js` al motor** — **MEDIANO**
Siguen sin estar publicados. Acá se valida que la ficha aguanta las dos configuraciones opuestas (`model.scope:'visible'`, selector de ejes, diagonal, play).

**Paso F — los publicados: qué tocar y qué no** — decisión explícita

| Chart | Recomendación |
|---|---|
| **N°1 ch1 y ch2** | **NO migrar.** Es el que tiene el mejor algoritmo de labels (drift cap, pull-back, línea de visión) y el peor stack (copias locales de `utils.js` y `png-export.js`, editor inerte). Migrarlo es reescribir el número entero. **Único arreglo que vale**: el bug del `anchor` que no se vuelca (`:938` vs `:966`) — se ve en móvil y en el PNG. **CHICO.** Rescatar sus 180 líneas buenas es el Paso C, no una migración |
| **N°2 chart 2** | **NO migrar.** Backport quirúrgico en su lugar: (a) stat strip en SVG para que n/R²/residuo entren al PNG — hoy no entran, copiar `desarrollo.js:709-767`; (b) que la leyenda del PNG respete `activeRegions`. Dos parches aislados. **CHICO cada uno** |
| **N°3 elo-pib** | **NO migrar.** Mismos dos backports que el N°2. **CHICO** |
| **N°3 talento-clubes** | **NO migrar** (es el único con greedy propio y con la pasada "puntos enteros" que hay que rescatar antes). Solo el crash de `public` en `sc_getMargins:39-46`. **CHICO** |
| **N°3 altura (ch 10)** y **N°3b versus** | **NO tocar.** Se documentan en la skill como precedentes (leyenda SVG con hover; criterio de máxima holgura) |

Regla general: **de acá en adelante, todo scatter nuevo nace con ficha. Ninguno publicado se migra "porque sí".** Los publicados solo reciben parches puntuales y aislados.

---

### 3. La skill: sí, pero sabiendo qué no puede resolver

**Ya existe**: `C:\Users\FUNDAR\.claude\skills\graficos-atlas\SKILL.md` (25.710 bytes, un archivo). Tiene una sección "Labels de país (scatters)" con los 5 pasos correctos del placement. **El lugar correcto es extenderla, no crear una nueva.** Hoy su alcance declarado es el PNG (línea 180: *"reusá PNG_FORMATS y las funciones de placement"*) y **no menciona en ningún lado**: hover de leyenda, regresión/R²/residuos, banner, chips WYSIWYG, buscador, slider, click en leyenda, tooltip. Además fue destilada del N°3 (junio 2026) y no se actualizó con nada del N°5.

**Sección nueva a agregar: "Scatter del Atlas — contrato de interacción".** Lo que tiene que decir, en forma de decisiones cerradas (no de principios):

1. **Hover sobre un grupo de la leyenda = revelar los nombres de ese grupo** + atenuar el resto. Es la feature firma del scatter del Atlas. Se implementa re-corriendo el layout de labels con el set ampliado. Está en N°1, N°2, N°3 elo, N°3 talento y N°3 altura.
2. **Click en la leyenda = apagar/prender.** Y hay que declarar en la ficha si eso cambia el modelo o no (hoy significa cosas opuestas según el número, sin que nadie lo haya decidido).
3. **Chip vs hover**: el chip es selección persistente y es la etiqueta; el hover es transitorio y suma etiquetas. No se contradicen.
4. **Todo estadístico que el lector va a querer compartir tiene que estar dentro del SVG**, porque `png-export.js` solo rasteriza el SVG. Un banner HTML no existe fuera de la pantalla.
5. **La leyenda del PNG tiene que reflejar el estado** (regiones apagadas incluidas).
6. **Nada de interacción detrás de `HAS_HOVER`** sin un equivalente táctil (contradice el README línea 35 y hoy lo violan N°1, N°2 y N°3).
7. **Regla operativa dura**: chart de scatter nuevo = **ficha declarativa**, no archivo nuevo. Si la ficha no tiene la opción que necesitás, se agrega a `lib/scatter.js` — nunca al chart. Y si copiás un archivo, copiás también lo que no mirás.

**Lo que una skill NO puede resolver (y por eso el código compartido es obligatorio):**
- Que las mejoras se propaguen. El pull-back del N°1 y la pasada solo-punto del N°3 son correctas y llevan un año enterradas: ninguna prosa las mueve.
- Que las firmas no diverjan (`s_ols` es dos funciones distintas con el mismo nombre global; `s_getMargins` tiene tres versiones incompatibles; `PNG_FORMATS` del N°1 tiene 1 formato y la de lib 5).
- Que un formato nuevo del editor no rompa charts viejos (los dos crashes de `public` son exactamente eso).
- Que renombrar el namespace (`s_` → `dv_`/`co_`/`sc_`) deje de garantizar que la próxima clonación arranque de cero.

**Tamaño de la extensión de la skill: chico** (una sección de ~2 páginas). Y una línea en el README apuntando a la ficha.

---

### 4. Resumen de tamaños para priorizar

| Paso | Qué | Tamaño | Riesgo |
|---|---|---|---|
| **A** | Hover→revela en los 3 charts del N°5 | chico | nulo (no publicado) |
| **B** | 6 bugs del N°5 (crash `public`, `pinRegion`, tap, clamp, leyenda, hover en export) | chico | nulo |
| **F1** | Bug del `anchor` del N°1 (`:938`/`:966`) | chico | bajo |
| **F2** | Backport de stat strip en SVG a N°2 y N°3 (R² en el PNG) | chico ×2 | bajo |
| **F3** | Leyenda del PNG que respete los filtros (N°1/N°2/N°3) | chico | bajo |
| **C** | `lib/scatter-render.js` v2 con las mejoras huérfanas + `s_leaderLines` | chico-mediano | bajo (defaults iguales) |
| **skill** | Sección "contrato de interacción del scatter" en `graficos-atlas` | chico | nulo |
| **D** | `lib/scatter.js` + estreno en declarado-implícito | mediano-grande | medio |
| **E** | Migrar desarrollo + correlaciones | mediano | bajo (no publicado) |
| — | Migrar N°1, N°2, N°3 | grande | **alto — no hacerlo** |

Orden sugerido: **A → B → skill → C → F1/F2/F3 → D → E.**

## Resumen

**Tu pregunta primero: ¿qué estás haciendo diferente?**

Los scatters viejos, cuando pasás el mouse por una región de la leyenda, **redibujan el gráfico entero**. Y en ese redibujo el conjunto de etiquetas cambia: pasa de "los de siempre" a "los países de esta región", y el anti-colisión se vuelve a correr desde cero sobre el set nuevo. No hay ningún truco: la anti-colisión es el mismo greedy de siempre, corriendo otra vez. Los que no entran, se descartan callados.

En el N°5 se estableció exactamente la regla contraria, y quedó escrita en el código como si fuera doctrina del proyecto. En `desarrollo.js`, línea 33: *"el HOVER nunca redibuja el chart — el foco por región se aplica solo por opacidad"*. Esa regla vino de los gráficos de líneas (donde redibujar en hover sí tildaba) y se generalizó a los scatters, donde el redibujo **era** el mecanismo de la feature. O sea: no se olvidaron de la feature, la mataron por construcción sin darse cuenta. En el chart 5 (declarado vs implícito) es peor todavía: la leyenda no tiene **un solo** listener, es un dibujo.

**Y tenés razón con lo de la skill.** No hay ninguna. Lo que hay es `lib/scatter-render.js`, 177 líneas que resuelven **solo dónde va cada etiqueta** — el 3% del código. Todo lo demás (regresión, R², residuos, banner, leyenda, hover, chips, buscador, slider, tooltip, márgenes por formato, CSV) está escrito de nuevo entre 4 y 7 veces, una por scatter. Y son 10 scatters, no 7: aparecieron dos que nadie tenía en la lista, el de altura del N°3 (que **sí** tiene el hover, con un comentario que dice "como Elo-PIB") y el versus del N°3b. El propio `scatter-render.js` avisa en su línea 16 que la Etapa 2 iba a mover el resto del render ahí. Nunca se hizo.

**El patrón que hace que se pierdan cosas:** cada clon conserva lo que el que lo hizo miró, pierde lo que no miró, e inventa una mejora que muere ahí. El N°1 tiene el mejor algoritmo de etiquetas del repo (180 líneas de pull-back y línea de visión) y no lo tiene nadie más. El N°3-talento tiene la pasada "los puntos tienen que verse enteros" y no la tiene nadie más. El N°5 fue el primero en meter el R² adentro del SVG — y por eso es **el único cuyo PNG lleva el R²**: los del N°2 y el N°3 lo tienen en un div HTML que el exportador ni mira. Ninguna de esas mejoras volvió nunca a `lib/`.

**Lo que propongo, en orden:**

1. **Ya, esta semana**: devolverle el hover-revela a los tres charts del N°5. Son 5-10 líneas por chart, calcadas del N°2. Y de paso arreglar seis bugs chicos, incluido uno que deja el chart 5 **en blanco** si elegís formato "Público" en el editor.
2. **Después**: escribir `lib/scatter.js`, el motor con ficha declarativa (mismo estilo que el graficador de vecinos: la página declara qué es su scatter, no cómo se dibuja). Ahí la feature que perdimos es una línea de config: `hoverRevealsGroup: true`. Y estrenarlo en el chart más pobre del N°5, que es el que menos tiene para perder.
3. **Los números 1, 2 y 3 NO se migran.** Están publicados y migrarlos es rehacerlos. Se les hacen parches puntuales: el R² adentro del SVG para que entre al PNG, la leyenda del PNG que hoy muestra regiones que vos apagaste, y un bug de anchor del N°1 que en el celular pone la etiqueta encima de su propio punto.
4. **La skill sí conviene, y ya existe**: `graficos-atlas`. Le falta todo lo que no es PNG. Hay que agregarle una sección corta de "contrato de interacción del scatter" que cierre las decisiones que hoy significan cosas distintas según el número (¿apagar una región cambia la regresión? en el N°2 no, en el N°5 sí; ¿el tap muestra el tooltip o selecciona? en el N°5 hay tres respuestas distintas en tres charts del mismo número). Pero que quede claro: **una skill no propaga mejoras ni evita que las firmas diverjan. Eso solo lo hace el código compartido.**

El detalle verificado, con líneas y citas, está en la matriz y en la sección de "perdido". No toqué ningún archivo.
