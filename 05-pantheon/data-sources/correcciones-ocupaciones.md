# Correcciones de ocupación — N°5 «Fuera de serie»

**20 de septiembre de 2026.** Pedido de Daniel: Steve Jobs figuraba como diseñador, Santiago Peña como economista y François Duvalier como médico. Los tres son errores de la ocupación que trae Pantheon, no del mapeo de rubros de la casa. Se revisó la base buscando casos del mismo tipo y se regeneró todo.

## El problema

Pantheon asigna **una sola ocupación por persona** y a veces no es la que la hizo memorable. El rubro de El Atlas se deriva de esa ocupación, así que el error se propaga a los seis gráficos, al mapa de nombres y al carrusel.

El criterio de corrección es: **anotar la actividad que explica la fama, no el título que la persona tuvo**. Duvalier ejerció de médico, pero el mundo lo recuerda por la dictadura. Steve Jobs no fue diseñador de oficio y, aunque lo hubiera sido, se lo recuerda por Apple.

Casos que se dejaron como están, a propósito: Josef Mengele y Shirō Ishii siguen como médicos, porque ahí la profesión es justamente el motivo por el que se los recuerda. Giorgio Armani y Jonathan Ive siguen en Arte, porque son diseñadores de verdad.

## Qué se corrigió

28 figuras. La tabla completa, con el motivo y una marca de confianza por fila, está en [`ocupaciones_overrides.csv`](ocupaciones_overrides.csv), publicada también en `el-atlas-charts/05-pantheon/data-sources/`.

| Hacia | Cuántas | Ejemplos |
|---|---|---|
| Negocios y exploración | 9 | Steve Jobs, Elon Musk, Henry Ford, Larry Page, Sergey Brin, Jack Dorsey |
| Poder (político) | 8 | Santiago Peña, François Duvalier, Alexander Hamilton, Mario Draghi, Alekséi Kosygin |
| Poder (militar) | 3 | Herbert Kitchener, Leslie Groves, Abram Gannibal |
| Poder (religioso) | 3 | Basilio el Grande, Policarpo de Esmirna, Nestorio |
| Poder (nobleza) | 2 | Qa'a, Tutmosis IV (dos faraones que figuraban como médicos) |
| Deporte | 1 | Aron Ralston, montañista, figuraba como ingeniero |
| Poder (extremista) | 1 | Georg Elser, el carpintero del atentado contra Hitler |
| Humanidades | 1 | L. L. Zamenhof, el creador del esperanto, figuraba como médico |

Nueve filas están marcadas `confianza = media` y son las discutibles: Page, Brin y Wales (formación en computación, fama empresarial), Fritz Todt, Gannibal y Zamenhof. Se pueden sacar editando el CSV y volviendo a correr el pipeline.

**El top 120 de América Latina se revisó entero y está limpio**, así que la especialización deportiva de la región no depende de ninguna de estas correcciones.

## Qué NO se movió

Ninguna cifra agregada del número. Antes y después del cambio:

| | antes | después |
|---|---|---|
| Mundo, deportistas (desde 1900) | 47,00% | 47,01% |
| Mundo, científicos | 3,52% | 3,51% |
| América Latina, deportistas | 73,68% | 73,68% |
| América Latina, científicos | 0,75% | 0,74% |
| Norteamérica y Oceanía, arte y espectáculo | 52,87% | 52,86% |
| Share latinoamericano de la ciencia mundial | 1,67% | 1,65% |

Todas siguen redondeando igual, así que el texto del newsletter publicado el 15/9 sigue siendo correcto y no hay que corregir nada ahí.

## Cómo se aplica

1. Editar [`ocupaciones_overrides.csv`](ocupaciones_overrides.csv). Una fila por persona: `id`, `name`, `occupation_pantheon`, `occupation_atlas`, `confianza`, `motivo`. La ocupación nueva tiene que existir en la taxonomía de la casa o el script corta.
2. `python aplicar_overrides_ocupacion.py` — parchea los cuatro CSV maestros (`pantheon_corregido`, `master_corregido`, `base_depurada`, `base_depurada_geo`) y recalcula `dominio`. Es idempotente.
3. Regenerar los `data-*.js` **en este orden** (importa, porque varios scripts escriben el mismo archivo):

   ```
   python export_scatter.py        # data-explora.js
   python build_percap_data.py     # data-percap-figs.js
   python build_map_data.py        # data-percap-map.js, data-percap-topfig.js  (después de percap_data)
   python build_evolucion.py       # data-evolucion.js
   python build_top_data.py        # data-top.js, data-top-full.js
   python export_more.py           # data-fama-oficio.js
   python taxonomia_dominios.py    # taxonomia_dominios.csv
   python build_mapa_nombres.py    # el planisferio de nombres, ES y EN (tarda unos minutos)
   ```

4. Copiar a `el-atlas-charts/05-pantheon/data-sources/`: `pantheon_corregido.csv`, `ocupaciones_overrides.csv`, `aplicar_overrides_ocupacion.py`, `export_dataset.py`.
5. Bumpear el `?v=` de los HTML del número (regla de la casa: una versión global por carpeta).
6. Carrusel: `carruseles/build_n5_datos.py`, después `build_mapa_america.py` y `carrusel_n5.py`.

`export_dataset.py` quedó parcheado para aplicar los overrides también en una corrida completa del pipeline desde los archivos crudos, así que la corrección no se pierde si alguna vez se rehace la base de cero.

## Copias de seguridad

- `_backup-pre-overrides/` — los cuatro CSV maestros como estaban antes.
- `imagenes no graficos/#5 - La geografia de la fama/_backup-pre-overrides/` — los cuatro PNG del mapa de nombres.
- El repo de charts es git: `git diff` muestra los 8 `data-*.js` tocados y nada más.

## Lo que quedó afuera

- `data-genero.js`, `data-abanico.js`, `data-ciencia.js`, `data-huella.js` y `data-metros.js` dependen del rubro pero alimentan prototipos que no se publicaron (`_no-publicados/`). No se regeneraron.
- `data-fame-lab.js` y `data-hpi-lab.js` muestran las columnas crudas del archivo de Pantheon, que por definición van sin nuestras correcciones.
- Los thumbs de los charts no se rehicieron: ninguna de las 28 figuras entra en el top 15 que muestra la miniatura del ranking, y los cambios de porcentaje no llegan al primer decimal.
