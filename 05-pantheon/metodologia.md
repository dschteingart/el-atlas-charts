# Nota metodológica — El panteón de El Atlas (N°5)

*Borrador para el link "explicación metodológica completa" del newsletter. Todos los
números salen del dataset final del número y son reproducibles con los scripts que se
publican junto con él (ver §10).*

---

## 1. La fuente: Pantheon

[Pantheon](https://pantheon.world) es un proyecto nacido en el MIT Media Lab (César
Hidalgo y equipo) y hoy desarrollado por Datawheel. Su criterio de entrada: una persona
integra la base si su biografía de Wikipedia existe en **al menos 15 ediciones
idiomáticas**. Para cada figura registra dónde y cuándo nació y a qué se dedicó
(ocupación), y calcula un índice de popularidad histórica, el **HPI** (*Historical
Popularity Index*). Ese índice combina, entre otras cosas: en cuántos idiomas existe
la biografía, cuántas visitas recibe fuera del inglés, qué tan *estables o parejas*
son esas visitas (medido con un coeficiente de variación) y la antigüedad de la
figura.

Partimos de la actualización 2025 del archivo de Pantheon: **126.582 figuras** (tras
deduplicar por id). Una precisión sobre el criterio de los 15 idiomas: es el umbral de
*diseño* de la base, pero el conteo de ediciones es una foto móvil —las biografías se
crean y también se borran—. En el archivo 2025, el 93,5% de las figuras cumple el
umbral según el conteo del propio archivo; cuando nosotros re-relevamos los idiomas en
2025, unas 5.200 figuras que lo cumplían al entrar ya no lo cumplen. Nada de esto es
un problema para nuestro uso (nuestro filtro de entrada es otro, ver §3), pero explica
por qué distintas fotos de la base dan conteos levemente distintos.

## 2. Tres problemas que encontramos al auditar el archivo

Antes de usar el HPI del archivo lo pusimos a prueba. Aparecieron tres problemas, y
los tres empujaron en la misma dirección: **contar ediciones de Wikipedia (o premiar
su "estabilidad") no es lo mismo que medir fama global.**

### 2.1. Las ediciones se inflan; los lectores, no

En la base cruda de Pantheon, **el país con más futbolistas célebres de la historia
no es Brasil ni Inglaterra: es Japón**, con 4.132 futbolistas — dos veces y media los
de Brasil (1.642). ¿Una potencia oculta del fútbol? No: son mayormente jugadores de la
liga japonesa con biografías creadas *en masa por bots* en decenas de ediciones de
Wikipedia, que casi nadie lee en ningún idioma. El caso extremo: **Takashi Kasahara**,
un jugador amateur de los años 30 con biografía en 49 ediciones —casi todas de un
párrafo—, queda según el HPI del archivo como el **futbolista n° 59 de toda la
historia**, por delante de Neymar, Mbappé, Modrić, Salah e Iniesta. Con lecturas
reales, no aparece ni entre los 30.000 primeros de la base.

El síntoma general: el número de ediciones —el insumo fuerte del criterio de
Pantheon— se volvió inflable (bots que traducen *stubs* en cadena), y una figura puede
ser enorme en una sola Wikipedia y prácticamente inexistente en el resto.

### 2.2. La "estabilidad" premia la irrelevancia pareja

Para medir qué tan repartida es la fama, el HPI usa un **coeficiente de variación**
(CV): cuanto más parejas las visitas, mejor. El problema es que el CV mide la
*dispersión relativa*, sin mirar el volumen. Una figura con 73 visitas anuales fuera
del inglés, repartidas parejito, obtiene un CV casi perfecto (0,007); Lionel Messi,
con 6,6 millones de visitas fuera del inglés —desiguales entre idiomas y con picos en
cada Mundial—, obtiene un CV de 5,5, y Taylor Swift, de 7,7. Es decir: **la métrica
de "diversidad" del archivo trata mejor a un atleta que nadie lee que a las personas
más leídas del planeta**, justamente porque la fama real es grande y despareja.

Nuestra solución es más simple y robusta: en lugar de premiar la uniformidad, contamos
**en cuántos idiomas la figura supera un umbral absoluto de lecturas** (1.000 y 10.000
visitas). Ser leído en serio en muchos idiomas es diversidad; ser ignorado parejo, no.

### 2.3. La antigüedad estaba sobrepremiada

El HPI del archivo castiga tan fuerte a las figuras recientes que produce rankings
difíciles de defender: **Messi queda en el puesto 3.638 del mundo y ni siquiera es el
deportista argentino mejor rankeado: es el cuarto**, detrás de Maradona, Di Stéfano y
Fangio. Una corrección por antigüedad es necesaria (sin ella, el ranking lo dominaría
la última figura viral); el punto es la dosis.

## 3. La depuración: re-medir las lecturas y filtrar la base

Como el archivo no trae las series con el detalle necesario, **reconstruimos la
medición desde la API de Pantheon** (`/pageviews`): visitas por idioma y por mes desde
julio de 2015, para las 126.582 figuras. Sobre esa medición aplicamos un filtro de
entrada:

> **Entra a la base la figura leída en al menos 2 idiomas con al menos 1.000 visitas
> acumuladas desde 2015.**

- Quedan afuera **9.313 figuras (7,4%)**; otras ~950 no tienen los datos mínimos para
  el índice (ocupación o año de nacimiento). La base depurada final: **116.319
  figuras**.
- El umbral se calibró revisando a mano los casos límite. La prueba de fuego eran las
  figuras de fama enorme pero concentrada en su región: el cantante vallenato
  **Diomedes Díaz** (un ídolo masivo en Colombia) o el epidemiólogo chino **Zhong
  Nanshan** (la cara de la respuesta a la pandemia en China) debían quedar *adentro* —
  y quedan, porque su fama, aunque concentrada, desborda su idioma—. Los perfiles con
  lectores reales en una sola Wikipedia, o sin lectores, quedan afuera.
- El efecto más visible es exactamente el buscado: **Japón pierde el 47,8% de sus
  figuras** (la liga japonesa y los stubs de bots). Ningún otro país pierde una
  proporción parecida.

## 4. El índice: un HPI reconstruido

Sobre la base depurada calculamos un índice de fama de 0 a 100 (el máximo es
Aristóteles = 100). La lógica, en palabras: **una figura es globalmente famosa si se
la lee mucho, en muchos idiomas, de manera sostenida en el tiempo — y esa fama vale
más cuanto más tiempo sobrevivió.** La fórmula:

```
Lenguas = promedio( idiomas totales , idiomas con ≥10.000 visitas en el año )
Vistas  = media geométrica( visitas últimos 12 meses , históricas , mediana mensual )
Base    = media geométrica( Lenguas , Vistas )
Edad×   = corrección por antigüedad (premio suave a lo viejo, castigo a lo muy reciente)
Score   = Base × Edad× , reescalado a 0–100
```

Todas las variables de visitas **excluyen el inglés**: la Wikipedia en inglés es tan
dominante que, adentro de la cuenta, ahogaría la señal de "fama en muchas lenguas"
(este criterio ya está en el HPI original y lo conservamos). Cada término se normaliza
con logaritmos, porque las visitas tienen colas larguísimas.

Por qué cada pieza:

- **Amplitud e intensidad a la vez.** `Lenguas` mide en cuántos idiomas existís y en
  cuántos te leen en serio (el reemplazo del CV, ver §2.2); `Vistas` mide cuánto te
  leen — hoy, históricamente y en el mes típico (la mediana evita que un pico de
  actualidad infle el promedio). Combinarlas con media geométrica exige las dos cosas:
  no alcanza con estar en 50 wikis que nadie lee, ni con ser enorme en una sola.
- **Un detalle técnico dentro de `Lenguas`.** El 58,9% de la base no tiene ningún
  idioma con más de 10.000 visitas anuales; si ese término entrara multiplicando (media
  geométrica), un cero apagaría el índice entero de media base. Por eso, dentro de
  `Lenguas`, los dos términos se promedian de forma simple.
- **La corrección por antigüedad, recalibrada.** Conservamos la idea del HPI original
  —la fama que sobrevive siglos vale más que la fama de esta década, y una figura muy
  reciente todavía no demostró permanencia—, pero con una dosis menor que la del
  archivo. En la nuestra, una figura recibe un premio suave y creciente con los años
  desde su nacimiento, y una penalización solo si tiene menos de 40 años (T = 40). El
  umbral T es la decisión que más mueve a las figuras vivas, así que la reportamos con
  transparencia: con T = 40, Messi queda 141° del mundo (y 1° entre los deportistas
  argentinos); con T = 50 caería a 384°; con T = 70, a 1.231°. Elegimos T = 40 porque
  es el punto en que los íconos vivos indiscutidos quedan bien rankeados sin que el
  índice se llene de celebridades de la última década. Importante: los resultados
  *agregados* del número casi no dependen de esta elección — América Latina explica el
  5,9% de la fama mundial con cualquiera de los tres valores de T.

Los parámetros publicados quedan escritos junto al dataset (`T=40`, piso de la
corrección 0,5, año de referencia 2025).

### Qué cambia en la práctica

La correlación de rankings entre nuestro índice y el HPI del archivo es 0,63
(Spearman): parecidos en el fondo, muy distintos en los bordes. Los movimientos
típicos:

| Con el HPI del archivo | Con lecturas reales |
|---|---|
| Físicos Nobel de inicios del s. XX con decenas de ediciones-stub y sin lectores (E. V. Appleton #586, C. T. R. Wilson #766) | caen a #20.000–35.000 |
| Estrellas actuales masivamente leídas en decenas de idiomas (Katy Perry, LeBron James: #20.000–26.000 en el archivo) | suben al top 1.000 |
| Messi #3.638, cuarto deportista argentino | #141, primer deportista argentino |

## 5. Rubros y ocupaciones: reagrupamiento propio

Las **ocupaciones** son las de Pantheon (no las tocamos). Los **6 rubros** de El Atlas
(Deporte; Arte y espectáculo; Ciencia y tecnología; Humanidades; Poder y figuras
públicas; Negocios y exploración) son un reagrupamiento propio. No quedaba otra: la
actualización 2025 del archivo no trae columna de dominio (sí la traía la base
original), la taxonomía oficial de Pantheon (2014) no cubre 20 ocupaciones nuevas
(4.972 figuras) y sus categorías chicas quedaban ilegibles en los gráficos
(Exploration 0,9%, Business & Law 1,0%). Hay 17 ocupaciones que cruzan de dominio
respecto de la taxonomía original (3.112 figuras, 2,7% de la base): las ciencias
sociales pasan a Humanidades, la farándula a Arte y espectáculo, los astronautas a
Ciencia, periodistas y abogados a Poder y figuras públicas.

Chequeo de robustez: el share de América Latina en la ciencia mundial da **1,0% con
nuestro reagrupamiento y 1,0% con el de Pantheon**. Los hallazgos del número no
dependen de la taxonomía.

## 6. País, región y lugar de nacimiento

- Cada figura se asigna al **lugar donde nació, traducido a fronteras actuales**
  (criterio de Pantheon): Julio César suma para Italia, Freud para Chequia — y los
  reyes de las dinastías coreanas nacidos al norte del paralelo 38 suman para Corea
  del Norte. No arbitramos nacimientos disputados caso por caso: se respeta la
  asignación de la fuente (Carlomagno queda en Alemania vía Aquisgrán).
- Pantheon deja **sin país a 4.983 figuras** de la base depurada (antiguas, bíblicas,
  de reinos que ya no existen). Recuperamos 2.735 (55%) vía Wikidata y
  georreferenciación, con dos reglas: lo que Wikidata afirma sobre el país del lugar
  tiene prioridad sobre nuestro cruce geométrico (que en las fronteras puede
  equivocarse por metros), y en el Levante seguimos la convención de la fuente para no
  partir la misma zona en dos países.
- Las **10 regiones** del número son la taxonomía de El Atlas (la del N°1), con un
  ajuste editorial: Puerto Rico cuenta en América Latina.

## 7. Otras correcciones de la base

- **Nombres en español.** Los rótulos vienen de Wikidata, que es editable y trae
  vandalismo ocasional: encontramos figuras con insultos intercalados en el nombre
  (el físico y político español Pablo Echenique), apodos ajenos ("Daniel Ortega
  (bachi)") o directamente el nombre de un personaje de ficción (el actor Norman
  Reedus figuraba como "DARYL DIXON"). Aplicamos una limpieza automática (patrones de
  vandalismo típicos) más una tabla de correcciones revisada a mano, que tiene
  precedencia sobre las fuentes automáticas en los casos ya auditados.
- **Género.** El campo del archivo de Pantheon trae errores (René Favaloro figuraba
  como mujer). Se re-relevó el género desde Wikidata (propiedad P21) para toda la
  base: 2.712 correcciones.
- **Ciudad de nacimiento.** Se re-relevó desde Wikidata (P19), con rótulos en español
  e inglés.

## 8. Limitaciones

Wikipedia no es un registro neutral de la historia: refleja qué personas fueron más
documentadas, digitalizadas y traducidas por comunidades de editores muy desiguales
entre idiomas. El índice mide **memoria global hoy** (lecturas 2015–2025), no talento
ni mérito. Dos límites propios de nuestras decisiones: al excluir el inglés del
índice, una figura cuya fama es casi exclusivamente angloparlante queda
subrepresentada; y al asignar por lugar de nacimiento, un país "produce" figuras cuya
carrera pudo desarrollarse enteramente en otro.

## 9. Reproducibilidad

El pipeline completo (descarga de visitas por idioma y mes, filtro de entrada, cálculo
del índice y exportación de cada gráfico) está en scripts que se publican en el
repositorio del proyecto en GitHub, junto con el dataset final y el archivo de
parámetros. Además, el número incluye un laboratorio interactivo (*fame lab*) que
permite mover todos los parámetros del índice en vivo y ver cómo cambia el ranking; su
preset "Publicado" reproduce exactamente el dataset del número.

*(Los links concretos a repositorio, dataset y laboratorio se fijan cuando se publique
el número.)*
