# Nota metodológica — El panteón de El Atlas

*Esta nota documenta de dónde salen los datos del número, qué adaptaciones hicimos
sobre el índice de fama de Pantheon y por qué. Está escrita para cualquier lector. Los
detalles formales (fórmulas y parámetros) están en el apéndice técnico del final.*

---

## 1. Los datos de origen

La fuente es [Pantheon](https://pantheon.world), un proyecto nacido en el MIT Media Lab
bajo la dirección del físico chileno César Hidalgo y desarrollado hoy por la empresa
Datawheel. Su idea es usar Wikipedia como termómetro de la memoria colectiva. Wikipedia
existe en cientos de idiomas y cada versión idiomática se llama "edición". Pantheon
considera globalmente memorable a una persona cuya biografía existe en al menos 15
ediciones.

Para cada una de esas personas, Pantheon registra dónde y cuándo nació y a qué se
dedicó, y calcula un índice de popularidad histórica, el **HPI** (*Historical Popularity
Index*), que resume en un solo número cuán presente está esa figura en la memoria del
mundo. El índice combina cuatro ingredientes.

| Ingrediente | Qué mide |
|---|---|
| Ediciones (L) | En cuántos idiomas existe la biografía |
| Ediciones efectivas (L\*) | Cuántos idiomas pesan de verdad, descontando los que aportan una porción marginal de las lecturas |
| Visitas fuera del inglés (v) | Cuánta gente lee la biografía, excluyendo la Wikipedia en inglés |
| Coeficiente de variación (CV) | Qué tan parejas son esas lecturas entre idiomas. Cuanto más parejas, mejor puntúa |

A eso se le aplica una corrección por antigüedad, que premia a las figuras cuya fama
sobrevivió siglos y castiga a las recientes, que todavía no demostraron permanencia. El
resultado se reescala de 0 a 100.

Partimos de la actualización 2025 del archivo público de Pantheon, con **126.582
figuras** sin repeticiones. De ahí tomamos el universo de personas, sus ocupaciones y
sus lugares de nacimiento. Lo que no tomamos es el puntaje de fama, y el resto de esta
nota explica por qué y con qué lo reemplazamos.

## 2. Tres adaptaciones sobre el índice original

El HPI fue diseñado en 2014 para ordenar figuras históricas, y para eso funciona
razonablemente bien. Sin embargo, al revisar el índice encontramos tres puntos donde
convenía ajustarlo. El denominador común es que contar en cuántas Wikipedias figura
alguien no equivale a medir cuánta gente lo recuerda. Cada apartado plantea primero lo
observado y después la decisión que tomamos.

### 2.1. El conteo de ediciones se puede inflar; las lecturas, no

**Lo observado.** En la base cruda de Pantheon, el país con más futbolistas célebres de
la historia no es Brasil ni Inglaterra sino **Japón**, con 4.132 futbolistas, dos veces
y media los de Brasil (1.642). La explicación no es futbolística. En Wikipedia hay
programas automáticos, los "bots", que generan artículos en cadena a partir de listas.
Tomando la nómina de jugadores que pasaron por la liga japonesa, un bot puede crear para
cada uno un artículo de una o dos líneas en decenas de idiomas. Cada uno de esos
artículos suma una edición más, aunque no lo lea nadie.

El caso más marcado es el de **Takashi Kasahara**, un futbolista japonés amateur de los
años treinta con biografía en 49 idiomas, casi todas de un párrafo. Con el HPI publicado,
Kasahara resulta el futbolista número 59 de toda la historia, por delante de Neymar,
Mbappé, Modrić, Salah e Iniesta. Contando lecturas reales no aparece entre las 30.000
figuras más leídas de la base.

**Nuestra decisión.** No usamos el conteo de ediciones como insumo principal. Bajamos de
la plataforma de Pantheon, figura por figura, las visitas que recibe en cada idioma y en
cada mes desde julio de 2015, y construimos el índice sobre esas lecturas.

### 2.2. La medida de fama pareja puede premiar a figuras poco leídas

**Lo observado.** Para distinguir la fama repartida entre idiomas de la concentrada en
uno solo, el HPI usa el coeficiente de variación, una medida estadística de cuán
disparejas son las visitas. Cuanto más parejas, mejor puntúa. La medida captura la
dispersión relativa, sin mirar el volumen, y en los extremos eso produce resultados
contraintuitivos. El atleta italiano **Luca Beccaro**, con 73 visitas anuales fuera del
inglés repartidas de manera uniforme, obtiene un coeficiente casi perfecto de 0,007.
**Lionel Messi**, con 6,6 millones de visitas fuera del inglés, muy desiguales entre
idiomas y con picos en cada Mundial, obtiene 5,5. Taylor Swift obtiene 7,7. La métrica de
diversidad a veces termina favoreciendo a quien casi nadie lee frente a las personas más
leídas del planeta, justamente porque la fama masiva a menudo es despareja.

**Nuestra decisión.** Reemplazamos la uniformidad por un umbral absoluto. Contamos en
cuántos idiomas la figura supera un piso de lecturas (1.000 y 10.000 visitas). Ser leído
de verdad en muchos idiomas cuenta como diversidad; ser poco leído de manera uniforme,
no.

### 2.3. La corrección por antigüedad resulta muy fuerte para el siglo XX

**Lo observado.** Corregir por antigüedad es necesario. Sin esa corrección, cualquier
índice de memoria histórica quedaría dominado por la última figura viral, y una carrera
reciente todavía no probó que vaya a recordarse. La intensidad de la corrección, sin
embargo, condiciona mucho el resultado cuando se llega hasta el siglo XX. Con el HPI
publicado, Messi queda en el puesto 3.638 del mundo y es apenas el cuarto deportista
argentino, detrás de Maradona, Di Stéfano y Fangio. En Argentina y en el mundo se
discute hace años si el mejor futbolista de la historia fue Maradona o Messi, pero nadie
sostendría que Di Stéfano o Fangio son deportistas más recordados que ellos.

**Nuestra decisión.** Conservamos la corrección por antigüedad con una intensidad menor
y explicitamos el parámetro que la gobierna, para que cualquiera pueda evaluar su
efecto (§4).

## 3. La base depurada

Con las visitas por idioma y por mes ya descargadas, el primer paso fue definir qué
figuras entran. El criterio es el siguiente.

> **Entra a la base la figura leída en al menos 2 idiomas con al menos 1.000 visitas
> acumuladas desde 2015.**

El filtro deja afuera 9.313 figuras, el 7,4% del archivo. Otras 950 aproximadamente no
tienen los datos mínimos para calcular el índice, por falta de ocupación o de año de
nacimiento. La base final que usamos en el número contiene **116.319 figuras**.

El umbral se calibró revisando manualmente los casos límite, y el criterio de
aceptación fueron las figuras de fama enorme pero concentrada en su región. El cantante
vallenato **Diomedes Díaz**, ídolo masivo en Colombia, y el epidemiólogo **Zhong
Nanshan**, cara visible de la respuesta china a la pandemia, debían quedar adentro, y
quedan, porque su fama desborda su propio idioma aunque esté concentrada. Quedan afuera
los perfiles que solo se leen en una Wikipedia y los que no se leen en ninguna.

El efecto agregado más visible es el esperado. **Japón pierde el 47,8% de sus figuras**,
que son las de la liga japonesa y los artículos creados por bots. Ningún otro país
pierde una proporción comparable.

## 4. El índice de fama

Sobre la base depurada calculamos un puntaje que ordena a las figuras según su presencia
en la memoria global. La lógica es que una figura es globalmente famosa si se la lee
mucho, en muchos idiomas y de manera sostenida en el tiempo, y que esa fama vale más
cuanto más tiempo sobrevivió. El puntaje multiplica tres piezas.

1. **Amplitud (idiomas).** Dos cosas que pesan lo mismo: en cuántos idiomas existe la
   biografía y en cuántos se la lee en serio, con más de 10.000 visitas al año.
   Reemplaza al coeficiente de variación (§2.2).
2. **Intensidad (lecturas).** Cuánto se la lee fuera del inglés, medido en el último
   año, en la década completa y en el mes típico. Ese último término es la mediana
   mensual, el valor del mes del medio, que no se deja arrastrar por un pico puntual de
   actualidad como una muerte, un escándalo o un Mundial.
3. **Permanencia (antigüedad).** Un premio suave y creciente con los años transcurridos
   desde el nacimiento, más una penalización que solo alcanza a las figuras de menos de
   40 años.

El puntaje resultante se reescala de 0 a 100, asignando 100 a la figura más alta de la
base. Con nuestros criterios esa figura es Aristóteles, y con los de Pantheon es Mahoma.
El valor del extremo no tiene lectura sustantiva, ya que es solo la unidad de medida de
la escala.

Cinco decisiones de diseño merecen explicitarse.

**Se excluye el inglés de las lecturas.** La Wikipedia en inglés es tan dominante, y la
consulta gente de todo el mundo sobre cualquier tema, que dentro de la cuenta taparía la
señal de fama en muchas lenguas. El criterio ya estaba en el índice original de Pantheon
y lo conservamos.

**Amplitud e intensidad se combinan con un promedio exigente.** Entre las dos usamos la
media geométrica, un promedio que solo da alto si sus dos términos son altos. Si uno es
casi cero, el resultado se hunde, a diferencia del promedio común, donde un término
grande compensa a uno chico. De ese modo no alcanza con estar en 50 Wikipedias que nadie
lee ni con ser enorme en una sola. La misma regla vale dentro de la intensidad, entre
las tres medidas de lecturas.

**Dentro de la amplitud, en cambio, el promedio es el común.** Ahí los dos términos se
suman y se dividen por dos. La razón es que el segundo término (idiomas con más de
10.000 visitas al año) vale cero para el 58,9% de la base, y con un promedio exigente ese
cero hundiría el índice de media base hasta volverla indistinguible. Con el promedio
común, ese término sigue sumando cuando existe sin funcionar como interruptor cuando no
existe.

**Las variables entran en escala logarítmica.** Es una escala que comprime las
diferencias muy grandes, de manera que pasar de 1.000 a 10.000 visitas pesa lo mismo que
pasar de 100.000 a 1.000.000. Sin esa compresión, un puñado de megaestrellas dominaría
el índice entero.

**La corrección por antigüedad se recalibra y se reporta acá.** El parámetro que la
gobierna es el punto de corte por debajo del cual una figura se considera demasiado
reciente, y es la decisión que más mueve a las figuras vivas. Con el corte en 40 años,
Messi queda 141° del mundo y primero entre los deportistas argentinos. Con el corte en
50 caería a 384°, y con 70, a 1.231°. Elegimos 40 porque es el punto donde los íconos
vivos indiscutidos quedan razonablemente rankeados sin que el índice se llene de
celebridades de la última década. Conviene aclarar que el parámetro no excluye a nadie,
solo altera el orden, y que los resultados agregados del número casi no dependen de esa
elección. Midiendo la fama de cada región como la suma de los puntajes de sus figuras,
América Latina explica el 6,1% de la fama mundial con el corte en 40 años, el 6,0% con
50 y el 5,9% con 70.

### Qué cambia en la práctica

Comparamos los dos rankings sobre las mismas 116.319 figuras. La correlación entre ambos
es de 0,63, en una escala donde 1 significa rankings idénticos y 0, ninguna relación. Es
decir que los dos coinciden a grandes rasgos y se separan en los bordes, que es donde
están los casos de las secciones anteriores. Los movimientos típicos son estos.

| Con el HPI publicado | Con lecturas reales |
|---|---|
| Físicos ganadores del Nobel de hace un siglo, con decenas de ediciones muy breves y sin lectores (E. V. Appleton, puesto 586; C. T. R. Wilson, 766) | caen entre los puestos 20.000 y 35.000 |
| Estrellas actuales leídas masivamente en decenas de idiomas (Katy Perry y LeBron James, entre los puestos 20.000 y 26.000) | suben al top 1.000 |
| Messi, puesto 3.638, cuarto deportista argentino | puesto 141, primer deportista argentino |

## 5. Rubros y ocupaciones

Las **ocupaciones** de cada figura (futbolista, física, poeta) son las de Pantheon, con
28 correcciones manuales que detallamos en la sección 7. Los **6 rubros** en los que las agrupamos (Deporte; Arte y espectáculo;
Ciencia y tecnología; Humanidades; Poder y figuras públicas; Negocios y exploración) son
un reagrupamiento propio, equivalente a lo que Pantheon llama dominios.

La decisión tiene una razón práctica y otra editorial. La práctica es que el archivo
público 2025 que descargamos no incluye la columna de dominio, a diferencia de la
versión original del dataset. Los dominios de la versión actual pueden reconstruirse
desde el sitio de Pantheon, así que era posible adoptarlos. La editorial es que no nos
resultaban los más útiles para este número. La taxonomía oficial fue diseñada en 2014 y
no cubre 20 ocupaciones incorporadas después, que reúnen 4.972 figuras, y algunas de sus
categorías quedan demasiado chicas para leerse en un gráfico, como Exploración, con el
0,9% de la base, o Negocios y derecho, con el 1,0%.

Respecto del agrupamiento original, 17 ocupaciones cambian de rubro, lo que afecta a
3.112 figuras, el 2,7% de la base. Las ciencias sociales pasan a Humanidades, la
farándula a Arte y espectáculo, los astronautas a Ciencia y tecnología, y periodistas y
abogados a Poder y figuras públicas. Como chequeo de robustez calculamos el share de
América Latina en la ciencia mundial con ambos agrupamientos, y da 1,0% en los dos
casos, de modo que los hallazgos del número no dependen de la taxonomía elegida.

## 6. País, región y lugar de nacimiento

Cada figura se asigna al **lugar donde nació, traducido a las fronteras actuales**, que
es el criterio de Pantheon. Julio César suma para Italia y Freud para Chequia, y los
reyes de las antiguas dinastías coreanas nacidos al norte del paralelo 38 suman para
Corea del Norte. No arbitramos nacimientos disputados caso por caso, sino que respetamos
la asignación de la fuente, con lo cual Carlomagno queda en Alemania por Aquisgrán.
Cabe aclarar que haber nacido en un país no implica haber desarrollado ahí la carrera.

Pantheon deja **sin país a 4.983 figuras** de la base, en su mayoría antiguas, bíblicas o
nacidas en reinos que ya no existen. Recuperamos 2.735, el 55%, con dos fuentes.
Wikidata, que es la base de datos estructurada hermana de Wikipedia de donde salen los
datos de ficha de cada persona, y las coordenadas del lugar de nacimiento cruzadas con
mapas actuales. Cuando Wikidata afirma explícitamente en qué país está el lugar, esa
afirmación tiene prioridad sobre nuestro cruce de mapas, que en las fronteras puede
errar por metros.

Las **10 regiones** del número son la taxonomía de El Atlas que usamos en el N°1, con un
ajuste editorial, que es contar a Puerto Rico dentro de América Latina.

## 7. Otras correcciones sobre la base

**Nombres en español.** Los rótulos provienen de Wikidata, que es editable por cualquier
usuario y presenta vandalismo ocasional. Encontramos figuras con insultos intercalados
en el nombre, como el físico y político español Pablo Echenique, con apodos ajenos, como
"Daniel Ortega (bachi)", o directamente con el nombre de un personaje de ficción, ya que
el actor Norman Reedus figuraba como "DARYL DIXON". Aplicamos una limpieza automática de
los patrones típicos de vandalismo y una tabla de correcciones revisada manualmente, que
tiene prioridad sobre las fuentes automáticas en los casos auditados.

**Ocupaciones.** Pantheon asigna una sola ocupación por persona y a veces no es aquella
por la que el mundo la recuerda. Steve Jobs figura como diseñador, Santiago Peña como
economista y François Duvalier como médico. Corregimos 28 casos de ese tipo, con el
criterio de anotar la actividad que explica la fama y no el título que la persona tuvo.
Los dos grupos más numerosos son fundadores de empresas que pasan a Negocios (Steve
Jobs, Elon Musk, Henry Ford) y figuras políticas o religiosas clasificadas por su
profesión previa (Alexander Hamilton, Mario Draghi, Basilio el Grande). La tabla
completa, con el motivo de cada cambio, está publicada en el repositorio. Ninguna cifra
agregada del número se mueve: los deportistas siguen siendo el 47% del panteón mundial y
los científicos el 3,5%; en América Latina, el 74% y el 0,7%.

**Género.** El campo del archivo de Pantheon presenta errores, entre ellos el de René
Favaloro, registrado como mujer. Lo relevamos de nuevo para toda la base desde Wikidata,
con 2.712 correcciones.

**Ciudad de nacimiento.** También relevada de nuevo desde Wikidata, con rótulos en
español y en inglés.

## 8. Limitaciones

Wikipedia no es un registro neutral de la historia. Refleja qué personas fueron más
documentadas, digitalizadas y traducidas por comunidades de editores muy desiguales
entre países e idiomas. El índice mide memoria global contemporánea, con lecturas de
2015 a 2025, y no talento ni mérito, motivo por el cual genocidas y narcotraficantes
obtienen puntajes altos.

Nuestras propias decisiones agregan dos límites. Al excluir el inglés de las lecturas,
una figura cuya fama es casi exclusivamente angloparlante queda subrepresentada. Al
asignar por lugar de nacimiento, un país figura como origen de personas cuya carrera
pudo desarrollarse enteramente en otro.

## 9. Transparencia y reproducibilidad

Todo lo necesario para rehacer el número está publicado.

- **El pipeline**, que incluye la descarga de visitas por idioma y mes, el filtro de
  entrada, el cálculo del índice y la exportación de cada gráfico, está en
  [`data-sources/`](https://github.com/dschteingart/el-atlas-charts/tree/main/05-pantheon/data-sources).
- **El dataset final**, [`pantheon_corregido.csv`](https://raw.githubusercontent.com/dschteingart/el-atlas-charts/main/05-pantheon/data-sources/pantheon_corregido.csv) (23 MB), trae una fila por figura con sus
  insumos, los tres componentes del índice y el puntaje. El
  [diccionario de datos](https://github.com/dschteingart/el-atlas-charts/blob/main/05-pantheon/data-sources/DATOS.md) describe cada columna, y el archivo de parámetros que lo
  acompaña deja escritos los valores con los que se calculó.
- **El [laboratorio del índice](fame-lab.html)** permite mover todos los parámetros y
  observar cómo cambia el ranking. Su preset "Publicado" reproduce exactamente el
  dataset del número, así que sirve para medir cuánto de cada resultado depende de las
  decisiones descritas acá.

Quien prefiera otro criterio puede cambiar el parámetro, rehacer el índice y comparar.

---

## Apéndice técnico

**Fórmula del índice.** Para cada figura de la base depurada, con visitas medidas fuera
del inglés entre julio de 2015 y 2025:

```
norm(x)  = log(1+x) / máx[ log(1+x) ]          (cada variable, normalizada a [0,1])

Lenguas  = ( norm(idiomas totales) + norm(idiomas con ≥10.000 visitas/año) ) / 2
Vistas   = ( norm(visitas 12 meses) · norm(visitas históricas) · norm(mediana mensual) )^(1/3)
Base     = ( Lenguas · Vistas )^(1/2)

A        = 2025 − año de nacimiento   (mínimo 1)
crudo    = log₄(A) − máx( 0 , (T − A) / 7 )    con T = 40
Edad×    = 0,5 + 0,5 · (crudo − mín) / (máx − mín)

Puntaje  = Base · Edad× , reescalado para que el máximo de la base sea 100
```

La media geométrica se usa donde no hay ceros estructurales, es decir dentro de `Vistas`
y entre `Lenguas` y `Vistas`. Dentro de `Lenguas` el promedio es aritmético, con pesos
iguales, por lo explicado en la §4: el 58,9% de la base tiene 0 idiomas con 10.000
visitas anuales o más, y en una media geométrica ese cero anularía el índice de media
base.

**Parámetros publicados.** Corte de antigüedad T de 40 años; piso de la corrección por
edad de 0,5; pesos del premio y de la penalización por edad iguales a 1; año de
referencia 2025. Quedan escritos en un archivo de parámetros junto al dataset.

**Filtro de entrada.** Al menos 2 idiomas con al menos 1.000 visitas acumuladas desde
julio de 2015. Del archivo 2025, que trae 126.582 figuras sin repeticiones, 9.313 no
pasan el filtro y unas 950 no tienen ocupación o año de nacimiento registrados, con lo
que la base final queda en 116.319.

**Sobre el criterio de las 15 ediciones.** Es el umbral de diseño de Pantheon, y en el
archivo 2025 lo cumple el 93,5% de las figuras según el conteo del propio archivo. No lo
usamos como filtro, dado que el nuestro se basa en lecturas y no en ediciones.

**Sobre el HPI de Pantheon.** El archivo público expone los cuatro insumos del índice (L,
L\*, v y CV), la edad de cada figura y el índice resultante, tanto en su escala original
como reescalado de 0 a 100, pero no la implementación exacta que los combina en la
versión 2025. Las combinaciones documentadas para la versión 1.0 reproducen el orden del
índice publicado con una correlación de 0,77, insuficiente para presentar acá una
fórmula cerrada. Por eso la §1 describe los ingredientes y remite a la documentación
original.

**Referencias.** Yu, A. Z., Ronen, S., Hu, K., Lu, T. y Hidalgo, C. A. (2016), "Pantheon
1.0, a manually verified dataset of globally famous biographies", *Scientific Data* 3,
150075. La versión actual del proyecto y la descripción de su HPI están en
[pantheon.world](https://pantheon.world).
