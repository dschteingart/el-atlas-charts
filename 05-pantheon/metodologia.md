# Nota metodológica — El panteón de El Atlas (N°5)

*Borrador para el link "explicación metodológica completa" del newsletter. Todos los
números salen de `pantheon_corregido.csv` (la fuente de verdad del número) y son
reproducibles con los scripts de `05-pantheon/data-sources/`.*

---

## 1. La fuente: Pantheon

[Pantheon](https://pantheon.world) es un proyecto nacido en el MIT Media Lab (César
Hidalgo y equipo) y hoy desarrollado por Datawheel. Su criterio de entrada: una persona
integra la base si su biografía de Wikipedia existe en **al menos 15 ediciones
idiomáticas**. Para cada figura registra dónde y cuándo nació, a qué se dedicó
(ocupación) y calcula un índice de popularidad histórica, el **HPI** (*Historical
Popularity Index*), que combina —entre otras cosas— la cantidad de idiomas de la
biografía, las visitas que recibe fuera del inglés, la estabilidad de esas visitas en
el tiempo y la antigüedad de la figura.

Nosotros partimos de la actualización 2025 del archivo de Pantheon: **126.582 figuras**
(tras deduplicar por id). Dos aclaraciones sobre ese archivo:

- El criterio de los 15 idiomas es de *diseño*: por las actualizaciones sucesivas, hoy
  el archivo trae una cola de figuras por debajo de ese umbral (el 89,4% cumple ≥15
  ediciones).
- El archivo trae el HPI ya calculado, pero no las series que lo alimentan con el
  detalle que necesitábamos (vistas por idioma y por mes).

## 2. Por qué no usamos el HPI del archivo

Al auditar el ranking del archivo apareció un problema sistemático: **contar ediciones
de Wikipedia no es lo mismo que medir fama global**. Dos casos concretos:

- **Fama de una sola Wikipedia.** Futbolistas de la J-League japonesa con millones de
  vistas en `ja.wikipedia` y prácticamente nada en cualquier otro idioma quedaban
  rankeados como figuras "globales".
- **Ediciones infladas por bots.** El caso más extremo: jugadores japoneses de
  entreguerras con biografías en 48–50 ediciones idiomáticas —casi todas *stubs*
  creados en masa por bots— y sin lectores reales en ninguna. Con el HPI del archivo,
  varios quedaban entre los 1.000 más famosos de la historia; con lecturas reales, no
  aparecen ni entre los 30.000.

La conclusión: el número de ediciones (el insumo fuerte del criterio de Pantheon) se
volvió manipulable/inflable, y lo que de verdad separa la fama global de la local son
las **lecturas reales, en varios idiomas, sostenidas en el tiempo**. Por eso
reconstruimos la medición desde la API de Pantheon (`/pageviews`: vistas por idioma y
por mes desde julio de 2015) para las 126.582 figuras, y sobre eso armamos un filtro de
entrada y un índice propio.

## 3. La depuración: el gate multi-idioma

**Entra a la base la figura leída en al menos 2 idiomas con al menos 1.000 vistas
acumuladas desde 2015.**

- Deja afuera **9.313 figuras (7,4%)** del archivo; otras ~950 no tienen los datos
  mínimos para el índice (ocupación o año de nacimiento). La base depurada final:
  **116.319 figuras**.
- El umbral está validado a mano en los bordes: quedan adentro íconos de fama
  concentrada pero real (Diomedes Díaz, Zhong Nanshan) y quedan afuera los perfiles
  inflados.
- El efecto más visible es el buscado: **Japón pierde el 47,8% de sus figuras** (la
  J-League y los stubs de bots). Ningún otro país pierde una proporción parecida.

## 4. El índice: un HPI reconstruido

Sobre la base depurada calculamos un score 0–100 (el máximo es Aristóteles = 100):

```
Lenguas = media aritmética( idiomas totales , idiomas con ≥10.000 vistas en el año )
Vistas  = media geométrica( vistas últimos 12 meses , vistas históricas , mediana mensual )
Base    = media geométrica( Lenguas , Vistas )
Edad×   = piso + normalización( log₄(edad) − max(0, (T − edad) / 7) )
Score   = Base × Edad× , reescalado a 0–100
```

con todas las variables de vistas **excluyendo el inglés** (la wiki en inglés es tan
dominante que, adentro, ahoga la señal de "fama en muchas lenguas") y cada término
normalizado con `log1p` a [0,1]. Parámetros publicados: **T = 40 años, piso = 0,5,
año de referencia 2025** (quedan escritos en `pantheon_corregido.params.json`).

Tres decisiones que conviene explicitar:

- **Idiomas y lecturas a la vez.** `Lenguas` mide la *amplitud* (en cuántas lenguas
  existís y en cuántas te leen en serio); `Vistas` mide la *intensidad* (cuánto te
  leen, hoy, históricamente y en el mes típico). La media geométrica entre ambas exige
  las dos cosas: no alcanza con estar en 50 wikis que nadie lee, ni con ser enorme en
  una sola.
- **`Lenguas` usa media aritmética, no geométrica.** El 58,9% de la base tiene 0
  idiomas con ≥10.000 vistas en el año; con media geométrica ese cero funcionaba como
  interruptor y aplastaba a media base. La aritmética conserva el término como señal
  sin que apague el score.
- **Corrección por antigüedad.** Igual que el HPI original, premia la fama que
  sobrevive al tiempo y castiga la fama reciente "de moda": por debajo de T = 40 años
  desde el nacimiento hay una penalización creciente. Es la perilla más sensible del
  índice para las figuras vivas (Messi es #141 con T=40, #384 con T=50 y #1231 con
  T=70) y casi irrelevante para los agregados por país o región (América Latina explica
  el 5,9% de la fama mundial con cualquiera de los tres valores). Publicamos T=40.

### Qué cambia en la práctica

La correlación de rankings entre nuestro score y el HPI del archivo es 0,63 (Spearman):
parecidos en el fondo, muy distintos en los bordes. Los dos movimientos típicos:

| Caían mal parados con el HPI del archivo | ...y con lecturas reales |
|---|---|
| Físicos Nobel de inicios del s. XX con decenas de ediciones-stub y sin lectores (E. V. Appleton #586, C. T. R. Wilson #766, O. W. Richardson #780) | caen a #20.000–35.000 |
| Estrellas actuales masivamente leídas en decenas de idiomas (Katy Perry, LeBron James, Ryan Gosling: #20.000–26.000 en el archivo) | suben al top 1.000 |

## 5. Dominios y ocupaciones: reagrupamiento propio

Las **ocupaciones** son las de Pantheon (no las tocamos). Los **6 rubros** de El Atlas
(Deporte; Arte y espectáculo; Ciencia y tecnología; Humanidades; Poder y figuras
públicas; Negocios y exploración) son un reagrupamiento propio: el archivo 2025 no trae
la columna de dominio, la taxonomía oficial (2014) no cubre 20 ocupaciones nuevas
(4.972 figuras) y sus categorías chicas quedaban ilegibles en los gráficos. Hay 17
ocupaciones que cruzan de dominio respecto de Pantheon 1.0 (3.112 figuras, 2,7%):
ciencias sociales a Humanidades, farándula a Arte y espectáculo, astronautas a Ciencia,
periodistas y abogados a Poder. El mapeo completo está en `taxonomia_dominios.csv`.

Chequeo de robustez: el share de América Latina en la ciencia mundial da **1,0% con
nuestro reagrupamiento y 1,0% con el de Pantheon**. Los hallazgos del número no
dependen de la taxonomía.

## 6. País, región y lugar de nacimiento

- Cada figura se asigna al **lugar donde nació, traducido a fronteras actuales**
  (criterio de Pantheon): Julio César suma para Italia, Freud para Chequia. No
  arbitramos nacimientos disputados caso por caso: se respeta la asignación de la
  fuente (Carlomagno queda en Alemania vía Aquisgrán).
- Pantheon deja **sin país a 4.983 figuras** de la base depurada (antiguas, bíblicas,
  polities desaparecidas). Recuperamos 2.735 (55%) vía Wikidata y georreferenciación,
  con dos reglas: lo que Wikidata afirma del país (`P17`) le gana a nuestro
  point-in-polygon (que en fronteras se equivoca), y el Levante se alinea con la
  convención de la fuente para no partir el mismo pueblo en dos países.
- Las **10 regiones** son la taxonomía de El Atlas (la del N°1), con un ajuste
  editorial: Puerto Rico cuenta en América Latina.

## 7. Otras ediciones de la base

- **Nombres:** los rótulos en español vienen de Wikidata, que trae vandalismo
  ocasional; hay una capa de limpieza automática más una tabla de overrides revisada a
  mano que siempre gana.
- **Género:** el del archivo de Pantheon tiene errores; se re-relevó `P21` de Wikidata
  para toda la base.
- **Ciudad de nacimiento:** `P19` de Wikidata, con rótulos en español e inglés.

## 8. Limitaciones

Wikipedia no es un registro neutral de la historia: refleja qué personas fueron más
documentadas, digitalizadas y traducidas por comunidades de editores muy desiguales
entre idiomas. El índice mide **memoria global hoy** (lecturas 2015–2025), no talento
ni mérito. Y las vistas de la wiki en inglés quedan afuera del índice a propósito, lo
que puede subrepresentar figuras cuya fama es casi exclusivamente angloparlante.

## 9. Reproducibilidad

Todo el pipeline está versionado en `el-atlas-charts/05-pantheon/data-sources/`
(README con el orden de ejecución). La fuente de verdad es `pantheon_corregido.csv` +
`pantheon_corregido.params.json`. El laboratorio `fame-lab.html` permite mover todas
las perillas del índice en vivo; su preset **"Publicado (T40)"** reproduce exactamente
el dataset del número.
