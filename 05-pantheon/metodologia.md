# Nota metodológica — El panteón de El Atlas (N°5)

*Esta nota explica de dónde salen los datos del número, qué problemas encontramos en
el índice original de Pantheon y cómo construimos el nuestro. Está escrita para
cualquier lector; los detalles formales (fórmula exacta y parámetros) están en el
apéndice técnico del final.*

---

## 1. De dónde salen los datos

La fuente es [Pantheon](https://pantheon.world), un proyecto nacido en el MIT Media
Lab (liderado por el físico chileno César Hidalgo) y hoy desarrollado por la empresa
Datawheel. La idea de Pantheon es simple: usar Wikipedia como termómetro de la memoria
colectiva. Wikipedia existe en cientos de idiomas —la Wikipedia en español, en
francés, en japonés: cada una es una "edición"— y Pantheon considera que una persona
es globalmente memorable si su biografía existe en **al menos 15 ediciones
idiomáticas**.

Para cada una de esas personas, Pantheon registra dónde y cuándo nació y a qué se
dedicó, y calcula un índice de popularidad histórica, el **HPI** (*Historical
Popularity Index*): un puntaje que resume, en un solo número, cuán presente está esa
figura en la memoria del mundo. Para armarlo combina, entre otras cosas, en cuántos
idiomas existe la biografía, cuántas visitas recibe (excluyendo el inglés), qué tan
parejas son esas visitas y cuán antigua es la figura.

Nosotros partimos de la actualización 2025 del archivo de Pantheon: **126.582
figuras**, después de eliminar fichas repetidas. Usamos su universo de personas, sus
ocupaciones y sus lugares de nacimiento. Lo que **no** usamos es su puntaje de fama.
Esta nota explica por qué.

## 2. Qué encontramos al revisar el índice original

Antes de usar el HPI del archivo lo pusimos a prueba, y aparecieron tres problemas.
Los tres tienen la misma raíz: **contar en cuántas Wikipedias figura alguien no es lo
mismo que medir cuánta gente lo recuerda.**

### 2.1. Las ediciones se pueden inflar; los lectores, no

Un dato para arrancar: en la base cruda de Pantheon, **el país con más futbolistas
célebres de la historia no es Brasil ni Inglaterra: es Japón**, con 4.132 futbolistas
— dos veces y media los de Brasil (1.642). ¿Una potencia oculta del fútbol? No. En
Wikipedia hay programas automáticos ("bots") que crean artículos en cadena: toman una
lista —por ejemplo, todos los jugadores que pasaron por la liga japonesa— y generan
para cada uno un artículo-cáscara de una o dos líneas en decenas de idiomas. Cada uno
de esos artículos cuenta como una "edición" más, aunque no lo lea nadie.

El caso extremo es **Takashi Kasahara**, un jugador japonés amateur de los años 30 con
biografía en 49 idiomas, casi todas de un párrafo. Para el HPI del archivo, Kasahara
es el **futbolista número 59 de toda la historia**, por delante de Neymar, Mbappé,
Modrić, Salah e Iniesta. Si en lugar de contar ediciones se cuentan lecturas reales,
Kasahara no aparece ni entre las 30.000 figuras más leídas de la base.

### 2.2. La medida de "fama pareja" premia la irrelevancia

El HPI intenta distinguir la fama repartida entre idiomas de la fama concentrada en
uno solo. Para eso usa una medida estadística llamada *coeficiente de variación*: las
visitas de la figura, medidas por su desparejo relativo (cuanto más parejas entre
idiomas y momentos, mejor puntúa). El problema: esa medida mira si las visitas son
*parejas*, no si son *muchas*.

El resultado es absurdo en los extremos. Un atleta italiano con **73 visitas anuales**
fuera del inglés, repartidas parejito, obtiene un coeficiente casi perfecto (0,007).
**Lionel Messi**, con 6,6 millones de visitas fuera del inglés —desiguales entre
idiomas, con picos en cada Mundial—, obtiene 5,5. Y Taylor Swift, 7,7. Es decir: la
métrica de "diversidad" del índice original trata mejor a un deportista que no lee
nadie que a las personas más leídas del planeta, precisamente porque la fama real es
enorme y despareja.

Nuestra solución es más directa: en lugar de premiar la uniformidad, contamos **en
cuántos idiomas la figura supera un piso absoluto de lecturas** (1.000 y 10.000
visitas). Ser leído en serio en muchos idiomas es diversidad; ser ignorado parejo, no.

### 2.3. La antigüedad estaba premiada de más

Tiene sentido que un índice de memoria histórica premie a las figuras que siguen
siendo leídas siglos después de su muerte, y que mire con sospecha la fama de la
última década (todavía no demostró que vaya a durar). El índice original hace eso,
pero con una dosis tan fuerte que produce rankings difíciles de defender: **Messi
queda en el puesto 3.638 del mundo, y ni siquiera es el deportista argentino mejor
rankeado: es el cuarto**, detrás de Maradona, Di Stéfano y Fangio. El problema no es
corregir por antigüedad —hay que hacerlo— sino la dosis.

## 3. Nuestra base depurada

Lo primero fue cambiar la materia prima: en lugar de confiar en el conteo de
ediciones, descargamos de la propia plataforma de Pantheon, figura por figura, **sus
visitas en cada idioma y en cada mes desde julio de 2015**. Sobre esa medición
aplicamos un filtro de entrada:

> **Entra a la base la figura leída en al menos 2 idiomas con al menos 1.000 visitas
> acumuladas desde 2015.**

- El filtro deja afuera **9.313 figuras (7,4% del archivo)**; otras ~950 no tienen los
  datos mínimos para calcular el índice (ocupación o año de nacimiento). La base
  final del número: **116.319 figuras**.
- El umbral se calibró revisando a mano los casos límite. La prueba de fuego eran las
  figuras de fama enorme pero concentrada en su región: el cantante vallenato
  **Diomedes Díaz** (ídolo masivo en Colombia) o el epidemiólogo **Zhong Nanshan** (la
  cara de la respuesta china a la pandemia) debían quedar adentro — y quedan, porque
  su fama, aunque concentrada, desborda su idioma. Los perfiles que solo se leen en
  una Wikipedia, o que no se leen, quedan afuera.
- El efecto más visible es exactamente el buscado: **Japón pierde el 47,8% de sus
  figuras** (la liga japonesa y los artículos creados por bots). Ningún otro país
  pierde una proporción parecida.

## 4. Nuestro índice de fama

Sobre la base depurada calculamos un puntaje de 0 a 100 (el máximo es Aristóteles =
100). La lógica, en una frase: **una figura es globalmente famosa si se la lee mucho,
en muchos idiomas, de manera sostenida — y esa fama vale más cuanto más tiempo
sobrevivió.** El índice multiplica tres piezas:

1. **Amplitud (idiomas).** En cuántos idiomas existe la biografía y, sobre todo, en
   cuántos se la lee en serio (más de 10.000 visitas al año). Es el reemplazo del
   coeficiente de variación (§2.2).
2. **Intensidad (lecturas).** Cuánto se la lee fuera del inglés: en el último año, en
   la década completa y en el mes "típico" (la mediana mensual: el valor del mes del
   medio, que no se deja arrastrar por un pico puntual de actualidad — una muerte, un
   escándalo, un Mundial).
3. **Permanencia (antigüedad).** Un premio suave y creciente con los años desde el
   nacimiento, y una penalización solo para figuras de menos de 40 años, que todavía
   no demostraron permanencia.

Tres decisiones de diseño que conviene explicitar:

- **Se excluye el inglés de las lecturas.** La Wikipedia en inglés es tan dominante
  (la lee todo el mundo, sobre cualquier tema) que, adentro de la cuenta, taparía la
  señal de "fama en muchas lenguas". Este criterio ya estaba en el índice original de
  Pantheon y lo conservamos.
- **Amplitud e intensidad se combinan con un promedio exigente.** Usamos la *media
  geométrica*, un promedio que solo es alto si **todos** sus términos son altos: si
  uno es casi cero, el resultado se hunde (a diferencia del promedio común, donde un
  término grande compensa a uno chico). Así, no alcanza con estar en 50 Wikipedias que
  nadie lee, ni con ser enorme en una sola. Además, todas las variables entran en
  escala logarítmica: una escala que comprime las diferencias gigantes (pasar de 1.000
  a 10.000 visitas "vale" lo mismo que pasar de 100.000 a 1.000.000), para que el
  índice no quede dominado por un puñado de megaestrellas.
- **La corrección por antigüedad, recalibrada y reportada.** El punto de corte de los
  40 años es la decisión que más mueve a las figuras vivas, así que la reportamos con
  transparencia: con el corte en 40, Messi queda 141° del mundo (y primero entre los
  deportistas argentinos); si el corte fuera 50, caería a 384°; con 70, a 1.231°.
  Elegimos 40 porque es el punto en que los íconos vivos indiscutidos quedan bien
  rankeados sin que el índice se llene de celebridades de la última década. Un dato
  importante: los resultados *agregados* del número casi no dependen de esta elección
  — América Latina explica el 5,9% de la fama mundial con cualquiera de los tres
  cortes.

### Qué cambia en la práctica

Comparamos los dos rankings —el del archivo y el nuestro— sobre las mismas 116.319
figuras. La correlación entre ambos es 0,63 (en una escala donde 1 significa rankings
idénticos y 0, ninguna relación): parecidos en el fondo, muy distintos en los bordes.
Los movimientos típicos:

| Con el HPI del archivo | Con lecturas reales |
|---|---|
| Físicos ganadores del Nobel de hace un siglo, con decenas de ediciones-cáscara y sin lectores (E. V. Appleton #586, C. T. R. Wilson #766) | caen a #20.000–35.000 |
| Estrellas actuales leídas masivamente en decenas de idiomas (Katy Perry, LeBron James: #20.000–26.000 en el archivo) | suben al top 1.000 |
| Messi #3.638, cuarto deportista argentino | #141, primer deportista argentino |

## 5. Rubros y ocupaciones

Las **ocupaciones** de cada figura (futbolista, física, poeta…) son las de Pantheon:
no las tocamos. Los **6 rubros** en los que las agrupamos (Deporte; Arte y
espectáculo; Ciencia y tecnología; Humanidades; Poder y figuras públicas; Negocios y
exploración) son un reagrupamiento propio. No quedaba alternativa: la actualización
2025 del archivo no trae la columna de dominio (la base original sí la tenía), la
taxonomía oficial de Pantheon (de 2014) no cubre 20 ocupaciones nuevas (4.972
figuras), y sus categorías chicas quedaban ilegibles en los gráficos (Exploración,
0,9% de la base; Negocios y derecho, 1,0%).

Respecto del agrupamiento original, 17 ocupaciones cambian de rubro (3.112 figuras,
el 2,7% de la base): las ciencias sociales pasan a Humanidades, la farándula a Arte y
espectáculo, los astronautas a Ciencia, periodistas y abogados a Poder y figuras
públicas. Un chequeo de robustez: el share de América Latina en la ciencia mundial da
**1,0% con nuestro reagrupamiento y 1,0% con el de Pantheon** — los hallazgos del
número no dependen de la taxonomía elegida.

## 6. País, región y lugar de nacimiento

- Cada figura se asigna al **lugar donde nació, traducido a las fronteras de hoy**
  (criterio de Pantheon): Julio César suma para Italia, Freud para Chequia — y los
  reyes de las antiguas dinastías coreanas nacidos al norte del paralelo 38 suman
  para Corea del Norte. No arbitramos nacimientos disputados caso por caso: se
  respeta la asignación de la fuente (Carlomagno queda en Alemania, por Aquisgrán).
  Ojo: "nació ahí" no significa "hizo su carrera ahí".
- Pantheon deja **sin país a 4.983 figuras** de la base (antiguas, bíblicas, de
  reinos que ya no existen). Recuperamos 2.735 (el 55%) usando Wikidata —la base de
  datos estructurada, hermana de Wikipedia, de donde salen los datos "de ficha" de
  cada persona— y las coordenadas del lugar de nacimiento cruzadas con mapas
  actuales. Cuando Wikidata dice explícitamente en qué país está el lugar, eso manda
  sobre nuestro cruce de mapas (que en las fronteras puede errar por metros).
- Las **10 regiones** del número son la taxonomía de El Atlas (la misma del N°1), con
  un ajuste editorial: Puerto Rico cuenta en América Latina.

## 7. Otras correcciones de la base

- **Nombres en español.** Los rótulos vienen de Wikidata, que es editable por
  cualquiera y trae vandalismo ocasional: encontramos figuras con insultos
  intercalados en el nombre (el físico y político español Pablo Echenique), con
  apodos ajenos ("Daniel Ortega (bachi)") o directamente con el nombre de un
  personaje de ficción (el actor Norman Reedus figuraba como "DARYL DIXON").
  Aplicamos una limpieza automática de patrones típicos de vandalismo, más una tabla
  de correcciones revisada a mano que tiene precedencia en los casos auditados.
- **Género.** El campo del archivo de Pantheon trae errores (René Favaloro figuraba
  como mujer). Lo re-relevamos completo desde Wikidata: 2.712 correcciones.
- **Ciudad de nacimiento.** También re-relevada desde Wikidata, con rótulos en
  español e inglés.

## 8. Limitaciones

Wikipedia no es un registro neutral de la historia: refleja qué personas fueron más
documentadas, digitalizadas y traducidas por comunidades de editores muy desiguales
entre países e idiomas. Nuestro índice mide **memoria global hoy** —lecturas
2015–2025—, no talento ni mérito: genocidas y narcotraficantes puntúan alto. Dos
límites que agregan nuestras propias decisiones: al excluir el inglés, una figura
cuya fama es casi exclusivamente angloparlante queda subrepresentada; y al asignar
por lugar de nacimiento, un país "produce" figuras cuya carrera pudo desarrollarse
enteramente en otro.

## 9. Transparencia y reproducibilidad

El pipeline completo —descarga de visitas por idioma y mes, filtro de entrada,
cálculo del índice y exportación de cada gráfico— está en scripts que se publican en
el repositorio del proyecto en GitHub, junto con el dataset final y el archivo de
parámetros. Además, el número incluye un laboratorio interactivo (*fame lab*) que
permite mover todos los parámetros del índice y ver cómo cambia el ranking; su preset
"Publicado" reproduce exactamente el dataset del número. *(Los links concretos a
repositorio, dataset y laboratorio se fijan al publicar.)*

---

## Apéndice técnico

**Fórmula exacta del índice.** Para cada figura de la base depurada, con visitas
medidas fuera del inglés entre julio de 2015 y 2025:

```
norm(x)  = log(1+x) / máx[ log(1+x) ]          (cada variable, normalizada a [0,1])

Lenguas  = ( norm(idiomas totales) + norm(idiomas con ≥10.000 visitas/año) ) / 2
Vistas   = ( norm(visitas 12 meses) · norm(visitas históricas) · norm(mediana mensual) )^(1/3)
Base     = ( Lenguas · Vistas )^(1/2)

A        = 2025 − año de nacimiento   (mínimo 1)
crudo    = log₄(A) − máx( 0 , (T − A) / 7 )    con T = 40
Edad×    = 0,5 + 0,5 · (crudo − mín) / (máx − mín)

Score    = Base · Edad× , reescalado para que el máximo de la base sea 100
```

Dentro de `Lenguas` los dos términos se promedian de forma aritmética (no
geométrica): el 58,9% de la base tiene 0 idiomas con ≥10.000 visitas anuales, y en
una media geométrica ese cero anularía el índice entero de media base. La media
geométrica se usa donde no hay ceros estructurales: dentro de `Vistas` y entre
`Lenguas` y `Vistas`.

**Parámetros publicados:** T = 40 años; piso de la corrección por edad 0,5; pesos del
premio y la penalización de edad iguales a 1; año de referencia 2025. Quedan escritos
en un archivo de parámetros junto al dataset.

**Gate de entrada:** ≥2 idiomas con ≥1.000 visitas acumuladas desde julio de 2015.
Del archivo 2025 (126.582 figuras deduplicadas), 9.313 no pasan el gate y ~950 no
tienen ocupación o año de nacimiento; la base final es de 116.319.

**Sobre el criterio de los 15 idiomas del archivo:** es el umbral de diseño de
Pantheon, pero el conteo de ediciones es una foto móvil (las biografías se crean y
también se borran). En el archivo 2025, el 93,5% de las figuras cumple ≥15 según el
conteo del propio archivo; re-relevado por nosotros en 2025, el 89,4% — unas 5.200
figuras que cumplían al entrar hoy no llegan, típicamente porque las ediciones-
cáscara fueron borradas.

**Referencias.** Yu, A. Z., Ronen, S., Hu, K., Lu, T. y Hidalgo, C. A. (2016),
"Pantheon 1.0, a manually verified dataset of globally famous biographies",
*Scientific Data* 3, 150075. La versión actual del proyecto (Pantheon 2.0, base
2025) y la descripción de su HPI están en [pantheon.world](https://pantheon.world).
