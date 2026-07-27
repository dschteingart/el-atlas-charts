# Fact-check de la nota italiana contra nuestros datos

FACT-CHECK de la nota de Daniel contra los datos del repo (universo canónico: VE_FOTO / ola 7 IVS, últimos datos >=2017, 92 países — es lo que muestran los interactivos; el "Mediana mundial" del chart-vecinos usa exactamente ese universo vía rk_median()).

| # | Afirmación de la nota | Nuestro dato (repo) | Veredicto | Número a usar en el Substack |
|---|---|---|---|---|
| 1 | "Solo el 3% de los argentinos no querría vivir junto a alguien de otra raza" | ARG 2,7% (WVS 2017, n=1.003) — data-vecinos.js / ivs_vecinos_ultimo.csv | OK por redondeo. La diferencia con "3%" es solo redondeo hacia arriba; misma ola, misma fuente | **2,7%** (o "menos del 3%"). El interactivo muestra 2,7 — usar el decimal para ser consistentes |
| 2 | "Una de las diez cifras más bajas relevadas" | Puesto 8 de 92 en ola 7 (empatado con NZL en 2,7; URY 0,6 es 1°). En el universo cualquier-año: 9 de 116 | CORRECTO | "8° más bajo de 92 países" o mantener "una de las diez más bajas" |
| 3 | "9% de América Latina" (otra raza) | LatAm ola 7 (13 países): **media 9,1** / mediana 7,0. Ojo: es el promedio simple, no la mediana | OK solo si se aclara que es promedio. Inconsistente con el resto de la nota, que usa medianas para "mundial" | Si se usan medianas en todo el texto (como los interactivos): **7%**. Si promedio: **9%** pero decir "promedio". No mezclar |
| 4 | "12% de Italia" | ITA 12,4% (EVS 2018) | CORRECTO | 12% (12,4) |
| 5 | "13% de España" | ESP 12,7% (EVS 2017) | CORRECTO | 13% (12,7) |
| 6 | "15% mundial" | Mediana ola 7: **14,4%** / media: 16,5%. El 15 no sale de ninguno de los dos (ni de WVS-solo: mediana 14,4, media 16,9; ni del universo 116 países: mediana 16,1, media 17,4) | IMPRECISO — no reproducible con nuestros datos | **14%** (la "Mediana mundial: 14,4%" es literalmente lo que dibuja chart-vecinos). Nunca "15%" |
| 7 | "Se mantiene por debajo del 5% desde comienzos de los años ochenta" | Serie ARG otra raza: 1984: 2,5 · 1991: 2,7 · 1995: 4,6 · 1999: 4,5 · 2006: 2,3 · 2013: 1,0 · 2017: 2,7 (data-pelicula.js coincide) | CORRECTO (máximo 4,6 en 1995). Precisión menor: el primer dato ARG es 1984 (ola 1 = 1981-84), así que "desde mediados de los ochenta" o "desde 1984" es más exacto | Mantener; idealmente "desde 1984" |
| 8 | "Solo al 4% le molestaría un vecino inmigrante" | ARG 4,1% (2017), 6° de 92 | CORRECTO | 4% (4,1) |
| 9 | "17 puntos menos que la mediana mundial" (inmigrantes) | Mediana mundial ola 7: 20,8 → brecha 16,7 pp | CORRECTO (redondeo fino) | "17 puntos" vale; exacto: 4,1 vs 20,8 |
| 10 | "Un 8% rechazaría a un vecino homosexual" | ARG 8,6% (2017), 15° de 90 | OJO: 8,6 redondea a **9**, no a 8. Redondeo a favor | **8,6%** (o "cerca del 9%"). No escribir "8%" |
| 11 | "30 puntos menos que la mediana global" (homosexuales) | Mediana ola 7: 38,3 → brecha 29,7 pp | CORRECTO | "30 puntos" vale; exacto: 8,6 vs 38,3 |
| 12 | "Algo menos que Europa occidental" (homosexuales) | Europa occ. ola 7 (18 países): media 10,2 / **mediana 6,7**. ARG 8,6 está DEBAJO del promedio pero ARRIBA de la mediana de Europa occ. (los nórdicos+GBR tiran la mediana a 6,7) | A MEDIAS — cierto solo contra el promedio. Con mediana, ARG está por encima | Reformular: "en niveles de Europa occidental: igual que Francia (8,0), por debajo de Italia (12,7) y España (12,9)" — es más preciso y más vistoso |
| 13 | "Apenas el 2% rechaza a alguien de otra religión" | ARG 2,2% (2017), 4° de 66 países con dato en ola 7 | CORRECTO | 2% (2,2). Nota: esta categoría tiene menos países (66), por si se citan rankings |
| 14 | "Argentina fue uno de los primeros diez países en legalizar el matrimonio igualitario, en 2010" | No está en el repo. Conocimiento externo: fue el 10° (tras NL, BE, ES, CA, ZA, NO, SE, PT, IS) | CORRECTO (fuente externa) | Mantener "décimo país del mundo" |
| 15 | "12% de los argentinos identifica a los grupos definidos por su raza como los más discriminados" (Latinobarómetro) | ARG raza_etnia 11,6% (lb_grupo_discriminado_macro_2020.csv — es LB **2020**, no 2024) | OK por redondeo | **11,6%** (el interactivo chart-quien muestra 11,6). Y citar "Latinobarómetro 2020" |
| 16 | "frente al 20% regional" | 18 países: mediana 20,0 / media 19,6 | CORRECTO (con cualquiera de las dos) | 20% |
| 17 | "y el 53% de Brasil" | BRA 53,0% | CORRECTO exacto | 53% |
| 18 | "En Argentina el grupo más mencionado son los pobres" | ARG: pobres 27,3% — máximo de las 12 macro-categorías (raza 11,6) | CORRECTO | 27,3% pobres vs 11,6% raza (el contraste es lindo para el Substack) |
| 19 | "las Integrated Values Surveys… en más de cien países y territorios" | 116 países/territorios con algún dato de la batería vecinos; 115 en prioridad laboral | CORRECTO | "más de 110" si se quiere afinar |
| 20 | Censo 2022: 46 M habitantes; 1,3 M descendientes de indígenas; ~300 mil afrodescendientes; 51% privación material indígena (+10 pp vs media); 38% afro (−3 pp) | **NO están en el repo** — fuente externa (INDEC, Censo 2022), no verificable acá | NO VERIFICABLE con nuestros datos | Si el Substack los repite, vale la pena traer el cuadro de INDEC (REDATAM/cuadros publicados) a tools/ como CSV: son el único dato de RESULTADOS materiales (no declarativos) de toda la nota y el contraste indígena +10 pp / afro −3 pp es fuerte; hoy no podemos respaldarlos ni graficarlos |

RESUMEN EJECUTIVO
- Nada está "mal" de forma grosera: 15 de 19 afirmaciones verificables coinciden con el repo (la mayoría por redondeo limpio).
- Tres correcciones concretas para el Substack: (a) "15% mundial" → **14%** (mediana ola 7 = 14,4, que es la línea que dibuja el propio interactivo); (b) "8%" homosexuales → **8,6/9%** (8,6 no redondea a 8); (c) "algo menos que Europa occidental" en homosexuales → solo vale contra el promedio, no la mediana; mejor comparar con Francia/Italia/España país a país.
- Una decisión editorial: el "9% de América Latina" es el PROMEDIO simple de 13 países IVS; la mediana es 7%. Como la nota (y los charts) usan mediana para "mundial", conviene unificar criterio: medianas en todo (ARG 2,7 · LatAm 7 · mundo 14,4) o promedios en todo, pero explicitado. Ojo además que con Latinobarómetro 2024 (otra fuente, misma pregunta, 17 países) LatAm da distinto (mediana 5,1, media 6,4, ARG 1,2 y 1° de la región) — no mezclar fuentes sin decirlo.
- El dato de Latinobarómetro del "grupo más discriminado" es de la ronda **2020** (no 2024): citarlo así.
- Archivos fuente usados: 05-intolerancia/data-vecinos.js, data-pelicula.js, data/ivs_vecinos_ultimo.csv, data/ivs_vecinos_largo.csv, data/lb_vecinos_2024.csv, tools/lb_grupo_discriminado_macro_2020.csv (rutas absolutas bajo C:/Users/FUNDAR/Documents/MEGAsync/substack/el-atlas/el-atlas-charts/.claude/worktrees/vigilant-wing-c3e39e/05-intolerancia/).


# Hooks cross-country verificados

MINERÍA DE HOOKS — N°5 intolerancia. Todos los números verificados contra los archivos de 05-intolerancia/ (data-vecinos.js, data-waves.js, data-pelicula.js, data-lb.js, data-lb-hist.js, data-implicito.js, data-prioridad.js, data-barrio.js, data-migrantes.js, data-quien.js, tools/ivs_racismo_declarado_vs_visto.csv). Convención: "foto" = último dato ≥2017 (ola 7, 92 países); rankings ascendentes (puesto 1 = menos rechazo) salvo indicación.

== EL PODIO DEL RACISMO DECLARADO ==

1) EL PAÍS MÁS RACISTA DECLARADO DEL MUNDO ES MYANMAR — Y NO ES SUTIL. 70,4% no quiere vecinos de otra raza (WVS 2020, n=1200), puesto 92/92. Y es último o anteúltimo en TODAS las categorías donde aparece: inmigrantes 72,8% (92/92), otra religión 71,2% (66/66), otro idioma 70,8% (66/66), parejas no casadas 90,5% (65/65), homosexuales 91,3% (89/90). Encuestado en plena limpieza étnica rohingya. Sorprende porque el imaginario del "país racista" apunta a Occidente y el récord está en el sudeste asiático. → chart-vecinos.html?vista=ranking&cat=otra_raza

2) EL TOP 3 MUNDIAL DEL RECHAZO RACIAL ES ASIÁTICO, NO OCCIDENTAL: Myanmar 70,4%, Vietnam 62,4%, Macao 44,9%. Después Turquía 41,9% y Bulgaria 40,0%. La mediana mundial es 14,4% — el país "típico" declara 5 veces más rechazo racial que Argentina (2,7%) y 24 veces más que Uruguay (0,6%). → chart-vecinos ranking/mapa.

3) URUGUAY ES HOY EL PAÍS MENOS RACISTA DECLARADO DEL MUNDO (0,6%, 2022) PERO NO NACIÓ ASÍ: en 1996 daba 6,8% (puesto 12 de 50 en su ola). Bajó 10 veces en 25 años: 6,8 (1996) → 3,9 (2006) → 1,6 (2011) → 0,6 (2022). La tolerancia se construye. Además es 1° del mundo en tolerancia a vecinos con VIH (3,9%, 1/66). → chart-vecinos evolución, paises=URY.

4) ARGENTINA FUE EL PAÍS MENOS RACISTA DEL RANKING MUNDIAL DOS VECES: ola 1 (1984: 2,5%, 1° de 23 — recién salida de la dictadura) y ola 6 (2013: 1,0%, 1° de 59). En la foto actual (2017) es 8/92. No es un buen resultado aislado: son 40 años clavada en el top-10. → chart-vecinos con slider de olas (data-waves).

== LOS ACUSADORES ==

5) ITALIA — EL PAÍS DEL DIARIO QUE PUBLICÓ A DANIEL — DECLARA 4,6 VECES MÁS RECHAZO RACIAL QUE ARGENTINA: 12,4% (EVS 2018, puesto 42/92). Y su película es la inversa de la argentina: 7,3% (1981) → 13,4% (1990) → 15,6% (1999) → 16,1% (2009) → 12,4% (2018). Mientras Argentina nunca superó el 5%, Italia se duplicó desde 1981. → chart-vecinos evolución, paises=ITA,ARG.

6) FRANCIA (la del caso Enzo Fernández) HOY DA 3,7% — PERO EN LOS 90 LLEGÓ A 9,4%: 4,9 (1981) → 9,4 (1990) → 8,9 (1999) → 3,4 (2008) → 3,7 (2018). En pleno auge del Frente Nacional de Le Pen padre triplicaba a la Argentina de entonces. EE.UU. (Samuel L. Jackson): 3,2%, puesto 12/92 — bajo en declarado, pero ver hook 14. → chart-vecinos evolución.

7) LA VUELTA EN U DE EUROPA DEL ESTE, LOS ÚNICOS QUE EMPEORAN EN SERIO DENTRO DE LA UE: Hungría 9,2% (2008) → 28,8% (2018), se triplicó; Bulgaria 20,5% (2008) → 40,0% (2017), se duplicó y es el peor de la UE (40 veces Suecia, 1,0%); Chequia 9,8% (1999) → 31,7% (2017, EVS); Eslovaquia 14,5% (2008) → 27,9% (2017). Coincide con la ola migratoria 2015 y el giro iliberal. → chart-vecinos evolución.

== LOS QUE EMPEORARON ==

8) GUATEMALA, EL DERRUMBE LATINOAMERICANO: rechazo a otra raza 4,6% (2004) → 30,2% (2020),×6,5 en 16 años; inmigrantes 4,0 → 29,5 (×7); homosexuales 15,5 → 40,6. Es hoy el país más intolerante de América Latina en 5 de las 8 categorías del Latinobarómetro 2024 (otra raza 11,9 la supera DOM 15,6; pero lidera religión 14,1, idioma 13,0, parejas 9,1, jóvenes 12,5, homosexuales 37,7). El único caso regional que se parece a Europa del Este. → chart-vecinos evolución + chart-latinobarometro.

9) VIETNAM: EL PAÍS QUE MÁS EMPEORÓ EN CASI TODO. Otra raza 32,2% (2001) → 62,4% (2020), +30pp; homosexuales 38,6 → 76,1 (+37,5pp, la mayor suba mundial); y es último de 92 en bebedores (95,2%) y último de 66 en VIH (94,7%). → chart-vecinos evolución.

== EL DERRUMBE DEL RECHAZO A HOMOSEXUALES (la gran historia positiva) ==

10) LA MAYOR REVOLUCIÓN DE TOLERANCIA DEL MEDIO SIGLO ES LA GAY, Y FUE GLOBAL: Japón 68,5% (1990) → 27,1% (2019); Polonia 70,5 → 30,2; México 60,2 → 22,8; Portugal 49,6 → 12,4; Argentina 38,9 (1991) → 8,6 (2017); Uruguay 31,9 → 4,7. En América Latina (LB): en 1998 NUEVE de 17 países superaban el 55% de rechazo (El Salvador 79%, Paraguay 74%, Venezuela 70,5%, Ecuador 69%); en 2024 el máximo regional es Guatemala con 37,7%. Pero el mundo sigue partido: 35 de 90 países todavía superan el 50%, con Jordania en 93,8%. → chart-vecinos evolución cat=homosexuales + data-lb-hist.

11) DONDE LA HOMOFOBIA DECLARADA SUBIÓ: Vietnam +37,5pp, Zimbabwe 66,5 → 90,1 (2001→2020), Indonesia 54,8 → 74,3, Guatemala +25pp, Nigeria 76,4 → 89,0. Corea del Sur, potencia cultural global, sigue en 79,6% (puesto 80/90, peor que Turquía). China 71,9% e India 72,7%: la mitad de la humanidad vive en países donde 7 de cada 10 rechazan un vecino gay. → chart-vecinos.

== DECLARADO VS VISTO (H002, "qué pasa en tu barrio") ==

12) LOS PAÍSES QUE MÁS RACISMO DECLARAN SON LOS QUE MENOS RACISMO VEN: Vietnam declara 62,4% y solo 4,7% ve conductas racistas en su barrio (56/64); Myanmar declara 70,4 y ve 11,9; Bangladesh declara 32,3 y ve 3,7; Macao declara 44,9 y ve 4,5. Al revés: Brasil declara 1,4% (3° mejor del mundo) y es 8° en racismo visto (27,1%); Chile declara 6,9 y ve 29,8 (4° mundial). r = -0,14: la correlación entre declarar racismo y verlo es NULA. La mejor vacuna contra leer el ranking declarado de manera literal. → chart-barrio + tools/ivs_racismo_declarado_vs_visto.csv.

13) EL PAÍS DONDE MÁS GENTE VE RACISMO EN SU BARRIO ES ETIOPÍA: 36,5% (2020, en plena guerra de Tigray), seguida de India 32,8% (2023) y Mongolia 30,7%. India es de los pocos países coherentes: alta en declarado (26,1%, puesto 76/92) Y en visto (2° de 64). → chart-barrio.

14) EN EE.UU., ALEMANIA Y HOLANDA SE VE MÁS RACISMO QUE ROBOS EN EL BARRIO: USA racismo 23,6% vs robos 21,2%; Países Bajos 13,3 vs 8,0; Alemania 9,8 vs 6,3; Hong Kong 18,9 vs 12,8; Singapur 5,7 vs 2,3 (pasa en 10 de 64 países). En América Latina es al revés y por paliza: México robos 63,2 / racismo 22,6; Argentina 48,3 / 10,8; Brasil 51,6 / 27,1. En el Norte el racismo es EL problema saliente del barrio; acá lo tapa el delito. → chart-barrio.

15) JAPÓN, EL ESPEJO RARO: 99,4% rechaza vecinos drogadictos (récord absoluto de toda la batería, 92/92) pero solo 3,2% ve racismo en su barrio (62/64) y declara 14,7% de rechazo racial (por encima de la mediana mundial). Bonus metodológico potente: la gente NO tiene problema en declarar intolerancias (mediana mundial de rechazo a drogadictos: 85,1%) — lo que hace más creíble que el 3% racial argentino no sea pura deseabilidad social. → chart-vecinos cat=drogadictos.

== "PRIMERO LOS DE ACÁ" (C002/C001) ==

16) LA DISCRIMINACIÓN MÁS ACEPTADA DEL MUNDO ES POR PASAPORTE, NO POR RAZA NI GÉNERO: la mediana mundial de "cuando escasea el trabajo, prioridad a los nativos sobre los inmigrantes" es 73,4% (115 países). Extremos: Egipto 97,5%, Jordania y Myanmar 93,3% vs Suecia 11,5% (único país debajo de 28%). El espejo de género ("prioridad a los varones") tiene mediana 31,2%: Islandia 1,4% vs Egipto 89,6%. → chart-prioridad.

17) PAÍSES DONDE LA PRIORIDAD AL VARÓN *SUBIÓ*: Etiopía 6,0% (2007) → 48,4% (2020), +42pp; Indonesia 52,1 → 75,8; Bangladesh 56,5 → 77,1; Corea del Sur 42,2 (1990) → 52,9 (2018); India 49,0 (1990) → 57,8 (2023). El backlash de género no es un invento occidental: donde más avanzó es en Asia y África. Curiosidad regional: Chile 17,9 (2012) → 34,6 (2018), casi se duplicó. → chart-prioridad ind=genero.

18) ISLANDIA, EL CAMPEÓN DEL DESARME CHAUVINISTA: "primero los nativos" 86,8% (1990) → 29,0% (2017), -58pp, la mayor caída mundial. Y Bosnia la mayor suba: 34,1% (1998) → 87,2% (2019), +53pp — la posguerra étnica hecha dato. → chart-prioridad.

== LATINOBARÓMETRO: PERLAS REGIONALES ==

19) CHILE ES EL LÍDER ANTIINMIGRANTE DE AMÉRICA LATINA 2024: 27,2% no quiere vecinos inmigrantes (vs Argentina 4,4%, mediana regional 15,8) — y 4° del mundo en racismo visto en el barrio (29,8%) declarando apenas 6,9%. Perú 27,0 casi empatado. → chart-latinobarometro + chart-barrio.

20) REPÚBLICA DOMINICANA: el mayor rechazo racial declarado de la región (15,6%, LB 2024) y el único país junto a Costa Rica donde "los migrantes" encabezan el podio de grupo más discriminado (24,2% y 22,3%) — la frontera con Haití hecha encuesta. → chart-quien + chart-latinobarometro.

21) VENEZUELA, LA PARADOJA MIGRATORIA: el país del que salieron millones es el que MENOS rechaza vecinos inmigrantes en la región (4,1%, mínimo LB 2024) y donde menos se rechaza a los jóvenes (1,2%). → chart-latinobarometro.

22) ARGENTINA EN LB 2024 ES MÍNIMO REGIONAL EN 4 DE 8 CATEGORÍAS: otra raza 1,2%, otra religión 1,7%, otro idioma 3,2%, parejas no casadas 1,1%. Pero en la batería migratoria 2020 es MÁXIMO de 18 países en "los inmigrantes no deben tener igual acceso a salud y educación" (53,6%) — mientras es 17/18 en "causan crimen" (37,4% vs mediana 58,8). Hostilidad de billetera, no de estigma. Contracara: Brasil es el país menos hostil al inmigrante de la región en 4 de los 14 ítems (acceso a salud/educación: 10,8%). → chart-migrantes.

== IMPLÍCITO VS DECLARADO (Project Implicit) ==

23) EL DATO MÁS INCÓMODO PARA ARGENTINA ESTÁ EN EL SESGO IMPLÍCITO GAY: iGay 0,451, el MÁS ALTO de los 33 países con IAT — declarando solo 8,6%. Y en raza: Argentina declara 2,7% pero su IAT racial (0,411) es igual al de España (que declara 12,7%). → chart-declarado-implicito.

24) EL IAT DESTRUYE EL RANKING DECLARADO: r(declarado, implícito) = 0,19 en raza y 0,07 en gay — nada. Turquía declara 41,9% de rechazo racial pero su sesgo implícito (0,373) es idéntico al de Francia (que declara 3,7%). India: el declarado más alto de los 33 (26,1%) y el implícito más BAJO (0,262). Japón: implícito racial récord (0,489). China declara 71,9% de rechazo a gays con un implícito de 0,088; Taiwán es el único país del mundo con sesgo implícito PRO-gay (-0,147) declarando 41,6%. Moraleja para el cierre: ningún instrumento por sí solo te dice "quién es el más racista" — por eso el número usa varios. → chart-declarado-implicito.

== BONUS ==

25) EL ESTIGMA DEL VIH SE DERRITIÓ DONDE MENOS SE ESPERABA: Libia 69,9% (2014) → 26,8% (2022); Egipto 98,3% (2001) → 56,8% (2018); Marruecos 81,0 → 42,6. Argentina: 31,5% (1991) → 4,0% (2017), 2° del mundo detrás de Uruguay (3,9%). → chart-vecinos cat=sida.

26) COLOMBIA ERA EL PAÍS MENOS RACISTA DEL MUNDO EN 1997 (2,0%, 1° de 50) y hoy quintuplicó a 10,2% (2018) — mientras "raza/etnia" es el 2°-3° grupo percibido como más discriminado (32,7%, LB 2020). → chart-vecinos evolución.

NOTAS DE USO (caveats que ya conocés pero apliqué): todos los IVS son % ponderado S017; "foto" mezcla años 2017-2023 (citar año); PELI usa un solo estudio por país — para CZE la foto 2022 (WVS) da 20,7 y la serie EVS termina en 31,7 (2017): si se usa Chequia, citar la serie EVS con año; comparaciones entre olas sueltas (medianas de ola) NO son panel balanceado — usé solo series país por país, que sí son limpias; H002 = saliencia percibida, no prevalencia. Los hooks 12, 14 y 24 son también el armazón metodológico del número: declarar, ver y asociar son tres cosas distintas y tenemos las tres.