# Gráficos que NO se publicaron en el N°5

El número salió con **siete** gráficos, que viven en `05-pantheon/` y están listados
en su índice y en `nav.js`:

1. `top.html` — El ranking de la fama mundial
2. `reparto.html` — La fama ya no es monopolio europeo
3. `evolucion.html` — Cómo cambió el perfil de la fama
4. `percap-map.html` — El mapa de la fama mundial
5. `fama-desarrollo.html` — La cantidad de famosos per cápita aumenta con el desarrollo
6. `composicion.html` — Los famosos latinoamericanos son mayormente deportistas
7. `podios.html` — El podio de cada país

Esta carpeta guarda los que quedaron afuera (Daniel, 2026-09-14). No se borran
porque el trabajo sirve como base para números futuros, pero **no** están
enlazados desde el índice ni desde la navegación, y no se mantienen.

| Archivo | Qué era |
|---|---|
| `chart-1.html` | Abanico de especialización por rubro (`abanico.js`) |
| `chart-2.html` | Huella de cada país por rubro (`huella.js`) |
| `chart-3.html` | Ciencia vs PIB (`ciencia.js`) |
| `chart-4.html` | Género de las figuras célebres (`genero.js`) |
| `chart-6.html` | La fama cambió de oficio (`faraoficio.js`) — lo reemplazó `evolucion.html` |
| `chart-7.html` | Migración de la fama, nacidos vs fallecidos (`migracion.js`) |
| `chart-8.html` | Concentración subnacional (`subnac.js`) |
| `chart-9.html` | Ciudades de la fama (`metros.js`) |
| `panorama.html` | Prototipo de tablero; dependía de `explora.js`, que se eliminó al reescribir el chart 5 como `fama-desarrollo.html`. **Roto.** |
| `hpi-lab.html` | Laboratorio anterior: recalculaba el HPI de Pantheon desde las columnas crudas del archivo (`data-hpi-lab.js`). Lo reemplazó `fame-lab.html`, que trabaja sobre el índice propio y sí está publicado. |

Notas de mantenimiento:

- Al moverlos acá se reescribieron sus rutas relativas (`./x` → `../x`,
  `../lib/` → `../../lib/`), así que los que no dependen de archivos borrados
  siguen abriendo desde esta subcarpeta.
- Sus `data-*.js` y sus renderers siguen en `05-pantheon/`, junto con el resto.
- El único lab que sí se publica es `fame-lab.html`, enlazado desde el índice y
  desde la §9 de la nota metodológica.
- No tienen la vista compartible en la URL ni el resto de los criterios que se
  fijaron para los siete publicados.
