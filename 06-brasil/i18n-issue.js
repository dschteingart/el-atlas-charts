// Strings del número "Brasil: las grandes transformaciones" + helpers i18n.
// BASE_I18N (compartido entre números) viene de lib/i18n.js, cargado antes.
//
// Numeración de charts (id del <svg> chartN y de data-png):
//   1 convergencia · 2 exportaciones · 3 china · 4 pobreza · 5 educación
//   6 demografía · 7 hogares · 8 religión · 9 valores · 10 homicidios · 11 deforestación
//
// Criterio de textos (CLAUDE.md del repo): título = hallazgo solo en la vista de
// fábrica; apenas el lector cambia algo pasa al neutral que nombra la medición.
// Subtítulo = qué se mide, unidad y período (calculado del dato real).

const ES_N6_BRASIL = true;  // sentinel para png-export (FILENAMES del número)

const ISSUE_I18N = {
  es: {
    'brand-topic': 'Brasil',
    'page-title': 'Brasil: las grandes transformaciones',
    'page-lede': 'Cómo se convirtió Brasil en el país que es hoy: una economía que dejó de converger y una sociedad que se transformó como nunca.',
    'index-chart-word': 'Gráfico',
    'index-see': 'Ver gráfico →', 'index-charts-label': 'Gráficos interactivos',
    'br-search-ph': 'Agregar país…', 'br-sin-dato': 'Sin dato para este indicador',
    'lbl-periodo': 'Período',
    'lbl-medida': 'Medida',
    'lbl-vista': 'Vista',
    'lbl-paises': 'Países',
    'lbl-indicador': 'Indicador',
    'lbl-anio': 'Año',
    'lbl-religion': 'Religión',
    'lbl-censos': 'Censos',
    'lbl-flujo': 'Flujo',
    'lbl-materia': 'Materia',
    'lbl-socios': 'Socios',
    'lbl-productos': 'Productos', 'lbl-categorias': 'Categorías', 'lbl-conductas': 'Conductas',
    'lbl-bioma': 'Bioma',
    'lbl-proy': 'Proyección',
    'proy-no': 'Sin proyección',
    'proy-si': 'Con proyección de la ONU',
    'proyeccion': 'Proyección',
    'tt-pct': '% del total',
    'reg-sep': ' · ',

    // ---- 1 convergencia
    'c1-title': 'Brasil se acercó a los países ricos hasta 1980 y después se estancó',
    'c1-title-neutral': 'PIB per cápita frente al de Estados Unidos',
    'c1-sub-pct': 'PIB per cápita como porcentaje del de Estados Unidos, en dólares ajustados por poder adquisitivo (PPA de 2011). {P}.',
    'c1-sub-nivel': 'PIB per cápita en dólares de 2011 ajustados por poder adquisitivo, escala logarítmica. {P}.',
    'c1-m-pct': '% de EE.UU.', 'c1-m-nivel': 'US$ (PPA)',
    'c1-ytitle-pct': '% del PIB per cápita de EE.UU.', 'c1-ytitle-nivel': 'US$ de 2011 (PPA), escala log',
    'c1-sources': 'Datos: Maddison Project Database 2023 (Bolt y van Zanden, 2024), en dólares de 2011 ajustados por poder adquisitivo, hasta 2022. De 2023 a 2025, cada serie se extiende con la variación anual del PIB per cápita a precios constantes del Banco Mundial (World Development Indicators, NY.GDP.PCAP.KD); Taiwán, Siria, Yemen, la URSS, Checoslovaquia y Yugoslavia terminan en 2022, y Afganistán, Cuba y el Líbano en 2024. Mundo: promedio ponderado por población de los 145 países con datos continuos entre 1950 y 2022 (antes de 1950 la cobertura cambia año a año), extendido con la variación del agregado mundial del Banco Mundial. Advertencia: entre 1991 y 2011 Maddison interpola los precios relativos entre dos comparaciones internacionales (1990 y 2011), lo que le suma a Brasil 1,3 puntos de crecimiento por año respecto de las cuentas nacionales del IBGE. Con una sola comparación de precios (Banco Mundial en PPA de 2021 o Penn World Table a precios constantes), los niveles de Brasil antes de 1990 son más altos: 37% del PIB per cápita de EE.UU. en 1980 en lugar de 28%.',
    'c1-png-source': 'Datos: Maddison Project Database 2023; 2023-2025, variación del Banco Mundial. El cálculo se hace a paridad de poder adquisitivo (USD de 2011).',
    'c1-title-neutral-nivel': 'PIB per cápita',
    'c1-png-sub-pct': 'PIB per cápita como porcentaje del de Estados Unidos, {P}.',
    'c1-png-sub-nivel': 'PIB per cápita, escala logarítmica, {P}.',
    'c5-tt': 'Con secundaria completa',
    'c7-tt-hog': 'Hogares',
    'c7-tt-mill': '{V} millones',
    'c11-tt': 'Área deforestada',
    'c5-tt-head': 'Censo {Y}',
    'c13-title': 'Desde 1980, Brasil dejó de acercarse a Estados Unidos y perdió peso en la economía mundial',
    'c13-sub': 'PIB per cápita de Brasil como porcentaje del de Estados Unidos y participación de Brasil en el PIB mundial, a paridad de poder adquisitivo. 1950-2025.',
    'c13-png-sub': 'PIB per cápita frente a EE.UU. y peso en el PIB mundial, 1950-2025',
    'c13-p1': 'PIB per cápita frente a Estados Unidos',
    'c13-p2': 'Peso en la economía mundial',
    'c13-y1': '% del PIB per cápita de EE.UU.',
    'c13-y2': '% del PIB mundial',
    'c13-tt1': 'PIB per cápita, % del de EE.UU.',
    'c13-tt2': '% del PIB mundial',
    'c13-tt-ext': 'Estimado con la variación del PIB de Brasil y del mundo (Banco Mundial)',
    'c13-csv-mpd': 'Maddison Project Database 2023',
    'c13-csv-ext': 'Maddison 2022 extendido con la variación del PIB a PPA constante (Banco Mundial)',
    'c13-sources': 'Datos: Maddison Project Database 2023 (Bolt y van Zanden), en dólares de 2011 a paridad de poder adquisitivo. El total mundial es la suma de los países de Maddison, sin contar dos veces a la URSS, Checoslovaquia y Yugoslavia y sus sucesores. 2023-2025: variación del PIB per cápita de Brasil y de Estados Unidos a precios constantes y del PIB a paridad de poder adquisitivo constante de Brasil y del mundo (Banco Mundial, WDI).',
    'c13-png-source': 'Datos: Maddison Project Database 2023; 2023-2025, variación del PIB del Banco Mundial. El cálculo se hace a paridad de poder adquisitivo (USD de 2011).',
    'c13-card': 'La convergencia inconclusa de Brasil',
    'c2-png-sub-pct': 'Exportaciones de bienes de {C} según contenido tecnológico, {P}',
    'c2-png-sub-musd': 'Exportaciones de bienes de {C} según contenido tecnológico, en millones de US$, {P}',
    'c4-title-neutral': 'Pobreza y desigualdad',
    'c4-sub': 'Pobreza y desigualdad del ingreso, {P}.',
    'c4-p-pov': 'Pobreza (US$ {L} por día)',
    'c4-p-gini': 'Desigualdad (coeficiente de Gini)',
    'c4-sin-dato': 'Sin datos para la selección',
    'lbl-linea': 'Línea de pobreza',
    'c4-lat-gini': 'América Latina',
    'c3-p-soc-EXP': 'Participación en las exportaciones de Brasil',
    'c3-p-soc-IMP': 'Participación en las importaciones de Brasil',
    'c3-p-soc-TOT': 'Participación en el intercambio total de Brasil',
    'c3-p-lall-EXP': 'Qué le vende Brasil a cada destino en {Y}, por contenido tecnológico',
    'c3-p-lall-IMP': 'Qué le compra Brasil a cada origen en {Y}, por contenido tecnológico',
    'c3-p-lall-TOT': 'Composición del intercambio con cada socio en {Y}, por contenido tecnológico',
    'c3-lall-prim': 'Productos primarios',
    'c3-lall-rrnn': 'Manufacturas de recursos naturales',
    'c3-lall-baja': 'Manufacturas de baja tecnología',
    'c3-lall-alta': 'Manufacturas de media y alta tecnología',
    'c3-lall-otras': 'Otros',
    'c1-card': '¿Brasil se está acercando a los países ricos?',

    // ---- 2 exportaciones
    'c2-title': 'En 2000, los productos primarios eran un cuarto de las exportaciones de Brasil; hoy son seis de cada diez',
    'c2-v-fator': 'Grado de elaboración', 'c2-v-lall': 'Contenido tecnológico', 'c2-v-productos': 'Productos',
    'c2-m-pct': '% del total', 'c2-m-musd': 'Millones de US$',
    'c2-ytitle-pct': '% de las exportaciones de bienes', 'c2-ytitle-musd': 'Millones de US$ corrientes',
    'cat-Básicos': 'Básicos', 'cat-Semimanufacturados': 'Semimanufacturados', 'cat-Manufacturados': 'Manufacturados',
    'cat-Productos primarios': 'Productos primarios', 'cat-Manuf. basadas en RRNN': 'Manufacturas de recursos naturales',
    'cat-Manuf. baja tecnología': 'Baja tecnología', 'cat-Manuf. media y alta tecnología': 'Media y alta tecnología',
    'cat-Otras / sin clasificar': 'Otras / sin clasificar',
    'cat-Soja (poroto, aceite, harina)': 'Soja y derivados', 'cat-Mineral de hierro': 'Mineral de hierro', 'cat-Petróleo crudo': 'Petróleo crudo',
    'cat-Carnes': 'Carnes', 'cat-Azúcar': 'Azúcar', 'cat-Café': 'Café', 'cat-Celulosa': 'Celulosa', 'cat-Automóviles': 'Automóviles',
    'cat-Aviones': 'Aviones', 'cat-Maquinaria y equipo eléctrico (SH 84-85)': 'Maquinaria y equipo eléctrico',
    'c2-sources': 'Datos: Growth Lab (Universidad de Harvard), Atlas of Economic Complexity: comercio de bienes en SITC Rev. 2 a 4 dígitos, 1962-2024, en dólares corrientes. Agrupado según la clasificación de Lall (2000) en la versión de Argendata (Fundar), que cuenta los minerales y el oro como productos primarios. «Sin clasificar» son operaciones especiales sin producto asignado (SITC 9310) y «Otros», rubros como electricidad, monedas o envíos postales. La participación se calcula sobre el total de bienes.',
    'c2-png-source': 'Datos: Growth Lab (Harvard), Atlas of Economic Complexity; clasificación de contenido tecnológico de las exportaciones de Lall.',
    'lall-ns': 'Sin clasificar',
    'c2-card': '¿Qué vende Brasil al mundo?',
    'lall-pp': 'Productos primarios', 'lall-rrnn': 'Manufacturas de recursos naturales', 'lall-baja': 'Manufacturas de baja tecnología',
    'lall-media': 'Manufacturas de media tecnología', 'lall-alta': 'Manufacturas de alta tecnología', 'lall-otros': 'Otros',
    'c2-title-neutral-lall': 'Exportaciones de {C} según contenido tecnológico',
    'c2-sub-lall-pct': 'Participación de cada grupo en el valor de las exportaciones de bienes de {C}, según la clasificación de Lall, en porcentaje. {P}.',
    'c2-sub-lall-musd': 'Exportaciones de bienes de {C} según contenido tecnológico (clasificación de Lall), en millones de dólares corrientes. {P}.',
    'lbl-pais': 'País',

    // ---- 3 china
    'c3-title': 'China se convirtió en el principal destino de exportación de Brasil, y le compra casi solo materias primas y derivados',
    'c3-title-neutral-EXP': 'Principales destinos de las exportaciones de Brasil',
    'c3-title-neutral-IMP': 'Principales orígenes de las importaciones de Brasil',
    'c3-title-comp': 'Brasil le vende a China materias primas y le compra tecnología',
    'c3-title-neutral-comp': 'Qué le vende Brasil a China y qué le compra',
    'c3-sub-EXP': 'Exportaciones de bienes por destino, {P}, y su composición en {Y}. En %.',
    'c3-sub-IMP': 'Importaciones de bienes por origen, {P}, y su composición en {Y}. En %.',
    'c3-sub-comp': 'Composición del comercio según contenido tecnológico (clasificación de Lall), en porcentaje del valor. {Y}.',
    'c3-v-socios': 'Socios', 'c3-v-comp': 'Qué se comercia con China',
    'c3-f-EXP': 'Exportaciones', 'c3-f-IMP': 'Importaciones',
    'c3-ytitle': '% del total',
    'soc-China': 'China', 'soc-Estados Unidos': 'Estados Unidos', 'soc-Unión Europea (27)': 'Unión Europea', 'soc-Argentina': 'Argentina',
    'soc-Resto Mercosur (PRY+URY)': 'Paraguay y Uruguay', 'soc-Resto del mundo': 'Resto del mundo',
    'soc-China + Hong Kong + Macao (sensibilidad)': 'China con Hong Kong y Macao',
    'c3-row-EXP|China': 'Brasil le vende a China', 'c3-row-IMP|China': 'Brasil le compra a China',
    'c3-row-EXP|Resto del mundo excl. China': 'Brasil le vende al resto del mundo',
    'c3-sources': 'Datos: MDIC/Secex, base de datos bruta de Comex Stat (NBM 1989-1996 y NCM 1997-2025), valores FOB en dólares corrientes. China es China continental (con Hong Kong y Macao, 2025 pasa de 28,7% a 29,1%). Unión Europea: los 27 miembros actuales en toda la serie. País de destino u origen declarado en aduana. Contenido tecnológico: Lall (2000), en la versión de la UNCTAD (CUCI Rev. 3), aplicado a la NCM con la correlación CUCI del MDIC y agrupado en cuatro grupos más otros; puede diferir levemente del gráfico de exportaciones, que usa el Atlas de Complejidad Económica (CUCI Rev. 2).',
    'c3-png-source': 'Datos: MDIC/Secex, base de comercio exterior (US$ FOB). Contenido tecnológico: clasificación de Lall (2000).',
    'c3-f-TOT': 'Intercambio total',
    'c3-title-neutral-TOT': 'Principales socios en el comercio total de Brasil',
    'c3-sub-TOT': 'Intercambio comercial (exportaciones más importaciones) por socio, {P}, y su composición en {Y}. En %.',
    'c3-card': '¿Cuánto depende Brasil de China?',
    'c3-add-ph': 'Agregar socio…',

    // ---- 4 pobreza
    'c4-title': 'Desde 1990, la pobreza y la desigualdad bajaron más en Brasil que en la región',
    'c4-title-neutral-pov': 'Pobreza con la línea de US$ {L} por día',
    'c4-title-neutral-gini': 'Desigualdad del ingreso (coeficiente de Gini)',
    'c4-sub-pov': 'Porcentaje de la población que vive con menos de US$ {L} por persona por día, en dólares ajustados por poder adquisitivo (PPA 2021). {P}.',
    'c4-sub-gini': 'Coeficiente de Gini del ingreso o el consumo per cápita (0 = igualdad total, 1 = desigualdad máxima). {P}.',
    'c4-i-8.3': 'Pobreza US$ 8,30', 'c4-i-4.2': 'Pobreza US$ 4,20', 'c4-i-3.0': 'Pobreza extrema US$ 3', 'c4-i-gini': 'Gini',
    'c4-ytitle-pov': '% de la población', 'c4-ytitle-gini': 'Coeficiente de Gini',
    'c4-arg': ' (urbana)',
    'c4-sources': 'Datos: Banco Mundial, Poverty and Inequality Platform (PIP), PPA 2021, sin rellenar años sin encuesta (los puntos son los años con encuesta). US$ 3 es la línea internacional de pobreza extrema; US$ 4,20 y US$ 8,30, las de los países de ingreso medio bajo y medio alto. Brasil: PNAD 1981-2011 y PNAD Contínua desde 2012; la línea une los tramos que el PIP marca como no comparables (cambio de encuesta). Argentina: solo áreas urbanas. Pobreza de América Latina y el Caribe y del Mundo: estimaciones regionales anuales del PIP. Gini de América Latina: el PIP no publica desigualdad regional; es el promedio simple de un panel fijo de 16 países con encuestas de ingresos entre 1997 y 2024 (Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Ecuador, El Salvador, Guatemala, Honduras, México, Panamá, Paraguay, Perú, República Dominicana y Uruguay), con interpolación lineal entre años con encuesta dentro de cada país. Argentina (solo áreas urbanas) y Uruguay hasta 2005 (también urbano) se toman como nacionales; Guatemala y El Salvador repiten en 2024 el dato de 2023. Antes de 1997, la serie se encadena hacia atrás con la variación del promedio de los países del panel que tienen dato (5 en 1981, 9 en 1987, 12 en 1990 y 14 en 1994). 2020 está afectado por la ayuda de emergencia de la pandemia. Las encuestas subcaptan los ingresos altos.',
    'c4-png-source': 'Datos: Banco Mundial, PIP (PPA 2021). Puntos: años con encuesta. Gini de América Latina: promedio de 16 países desde 1997, encadenado hacia atrás con los que tienen dato.',
    'c4-card': '¿Cuánto bajó la pobreza en Brasil?',

    // ---- 5 educación
    'c5-title': 'La proporción de jóvenes con la secundaria completa casi se triplicó desde 1991',
    'c5-title-neutral': 'Jóvenes con la secundaria completa',
    'c5-sub': 'Personas de 25 a 29 años con la secundaria completa en Brasil, en porcentaje de ese grupo de edad. Censos de 1991, 2000, 2010 y 2022.',
    'mat-matematica': 'matemática', 'mat-lectura': 'lectura', 'mat-ciencias': 'ciencias',
    'mat-btn-matematica': 'Matemática', 'mat-btn-lectura': 'Lectura', 'mat-btn-ciencias': 'Ciencias',
    'c5-aprox': 'aproximado con 11 años de estudio o más',
    'c5-sources': 'Datos: IBGE, censos demográficos (SIDRA, tablas 142, 2978, 3540 y 10061). * 1991 y 2000 se aproximan con 11 años de estudio o más, porque esos censos no publican el nivel completado con la misma clasificación.',
    'c5-png-source': 'Datos: IBGE, censos (SIDRA). * 1991 y 2000: 11 años de estudio o más.',
    'c5-ytitle': '% de las personas de 25 a 29 años',
    'c12-title': 'Los alumnos brasileños rinden en PISA casi lo mismo que en 2009',
    'c12-title-neutral': 'Puntajes PISA en matemática, lectura y ciencias',
    'c12-sub': 'Puntaje promedio en matemática, lectura y ciencias de las pruebas PISA (alumnos de 15 años). {P}.',
    'c12-ytitle': 'Puntaje promedio',
    'c12-sources': 'Datos: OCDE, PISA 2022 Database, vía Our World in Data; 2025: OCDE, PISA 2025 Results (Volume I). Promedio OCDE: promedio de los países de la OCDE en cada ronda. Las tendencias son comparables desde 2000 en lectura, 2003 en matemática y 2006 en ciencias; 2015 pasó a prueba en computadora y 2022 es posterior a la pandemia. PISA evalúa hoy a más chicos que antes no llegaban a la escuela a los 15 años.',
    'c12-png-source': 'Datos: OCDE, PISA (2000-2022 vía Our World in Data; 2025, PISA 2025 Results).',
    'c12-card': '¿Aprenden más los alumnos brasileños?',
    'c5-card': '¿Cuántos jóvenes terminan la secundaria en Brasil?',

    // ---- 6 demografía
    'c6-title': 'En sesenta años, las brasileñas pasaron de tener seis hijos a menos de dos',
    'c6-title-neutral-TFR': 'Tasa global de fecundidad',
    'c6-title-neutral-LEx': 'Esperanza de vida al nacer',
    'c6-title-neutral-MedianAgePop': 'Edad mediana de la población',
    'c6-sub-TFR': 'Cantidad de hijos que tendría una mujer a lo largo de su vida con las tasas de cada año. {P}.',
    'c6-sub-LEx': 'Años que viviría en promedio un recién nacido con la mortalidad de cada año. {P}.',
    'c6-sub-MedianAgePop': 'Edad que divide a la población en dos mitades, en años. {P}.',
    'c6-sub-proy': ' Desde 2024, proyección de la ONU (variante media).',
    'c6-i-TFR': 'Fecundidad', 'c6-i-LEx': 'Esperanza de vida', 'c6-i-MedianAgePop': 'Edad mediana',
    'c6-ytitle-TFR': 'Hijos por mujer', 'c6-ytitle-LEx': 'Años', 'c6-ytitle-MedianAgePop': 'Años',
    'c6-reemplazo': 'Nivel de reemplazo (2,1)',
    'c6-sources': 'Datos: Naciones Unidas, World Population Prospects 2024. Estimaciones 1950-2023 y, si se activa, proyección de la variante media (2025-2100, cada cinco años, en trazo punteado sobre franja gris). Las estimaciones de 1950-1970 son indirectas. El Censo 2022 de Brasil da una fecundidad de 1,55 para 2022; la ONU, 1,63 (diferencias de método).',
    'c6-png-source': 'Datos: Naciones Unidas, World Population Prospects 2024.',
    'c6-card': '¿Qué tan rápido cambió la demografía de Brasil?',

    // ---- 7 hogares
    'c7-title': 'Los hogares de seis personas o más pasaron del 27% al 4%; los de una sola, del 7% al 19%',
    'c7-title-neutral': 'Hogares según cantidad de integrantes',
    'c7-sub-pct': 'Distribución de los hogares según cantidad de integrantes, en porcentaje. Censos 1980-2022.',
    'c7-sub-abs': 'Hogares según cantidad de integrantes, en millones. Censos 1980-2022.',
    'c7-m-pct': '% de los hogares', 'c7-m-abs': 'Millones de hogares',
    'c7-n-1': '1 persona', 'c7-n-2': '2', 'c7-n-3': '3', 'c7-n-4': '4', 'c7-n-5': '5', 'c7-n-6+': '6 o más',
    'c7-tt-n-1': '1 persona', 'c7-tt-n': '{N} personas', 'c7-tt-n-6+': '6 personas o más',
    'c7-media': 'Promedio de personas por hogar: {V}',
    'c7-sources': 'Datos: IBGE. 1980: Censo 1980, tabulaciones avanzadas sobre muestra (Estatísticas do Século XX, Anuário Estatístico 1981); 1991-2010: SIDRA tabla 185 (domicilios particulares permanentes); 2022: SIDRA tabla 9880 (domicilios particulares). Promedio de personas por hogar: SIDRA tablas 156 y 4712.',
    'c7-png-source': 'Datos: IBGE, censos demográficos 1980-2022 (1980: tabulaciones sobre muestra).',
    'c7-card': '¿Cómo cambió el tamaño de los hogares brasileños?',

    // ---- 8 religión
    'c8-title-censos': 'Desde 1980, los católicos pasaron del 89% al 57% y los evangélicos se cuadruplicaron',
    'c8-title': 'Desde 1980, los católicos pasaron del 89% al 57% y los evangélicos se cuadruplicaron',
    'c8-title-edad': 'En 1991 la edad no importaba; en 2022 los jóvenes son mucho menos católicos',
    'c8-title-neutral-censos': 'La religión de los brasileños en los censos',
    'c8-title-neutral-edad': 'Religión según la edad',
    'c8-sub-censos': 'Población de Brasil según religión declarada en cada censo, en porcentaje. {P}.',
    'c8-sub-edad': 'Porcentaje de {R} según grupo de edad en Brasil, población de 10 años o más. Censos de {C}.',
    'c8-v-censos': 'Censos 1872-2022', 'c8-v-edad': 'Por edad',    'rel-cat': 'Católicos', 'rel-evg': 'Evangélicos', 'rel-sin': 'Sin religión', 'rel-otr': 'Otras',
    'rel-gen-cat': 'católicos', 'rel-gen-evg': 'evangélicos', 'rel-gen-sin': 'personas sin religión',
    'c8-sources': 'Datos: IBGE, censos demográficos. 1872-2010: Anuário Estatístico do Brasil 2024, tabla 2.1.1.1 (población presente hasta 1950, residente después). 1991-2022 por edad: SIDRA tablas 137, 139 y 9537. En 2022 la religión se preguntó a personas de 10 años o más (en esa base, 2010 daba 65,1% de católicos y 21,6% de evangélicos); para comparar por edad se usa siempre esa base. Hasta 1980 "sin religión" incluye a quienes no declararon. No hubo censos comparables entre 1890 y 1940: la línea une esos dos censos. Los evangélicos no son un bloque homogéneo.',
    'c8-png-source': 'Datos: IBGE, censos demográficos (Anuário Estatístico 2024 y SIDRA).',
    'c8-ytitle-censos': '% de la población',
    'c8-ytitle-edad': '% de cada grupo de edad',
    'c8-todas': 'Todas las edades',
    'c8-card': '¿Cómo cambió la religión en Brasil?',
    'c8-add-ph': 'Agregar censo…',

    // ---- 9 valores
    'c9-title': 'Los que creen que la homosexualidad nunca se justifica bajaron de 70% a 34%; con el aborto siguen siendo dos de cada tres',
    'c9-title-neutral': 'Cuántos brasileños creen que estas conductas nunca se justifican',
    'c9-ytitle-pct': '% de los adultos',    'val-homosexualidad': 'Homosexualidad', 'val-aborto': 'Aborto', 'val-divorcio': 'Divorcio', 'val-eutanasia': 'Eutanasia',
    'c9-sources': 'Datos: World Values Survey, serie 1981-2022 (versión 4.0), olas de Brasil de 1991, 1997, 2006, 2014 y 2018; variables F118 (homosexualidad), F120 (aborto), F121 (divorcio) y F122 (eutanasia). Se calcula como el porcentaje de adultos que elige 1 («nunca se justifica») en una escala que va hasta 10 («siempre se justifica»), con los ponderadores de la encuesta (la ola de 1997 no trae) y sin contar a quienes no saben o no responden.',
    'c9-png-source': 'Datos: World Values Survey; % que responde 1 («nunca se justifica») en una escala de 1 a 10.',
    'c9-sub': 'Porcentaje de adultos en Brasil que responde que cada conducta nunca se justifica. {P}.',
    'c7-ytitle-pct': '% de los hogares',
    'c7-ytitle-abs': 'Millones de hogares',
    'c9-card': '¿Los brasileños se volvieron más liberales?',
    'c9-add-ph': 'Agregar conducta…',

    // ---- 10 homicidios
    'c10-title': 'Los homicidios casi se triplicaron hasta 2017 y desde entonces bajaron más de un tercio',
    'c10-title-neutral': 'Tasa de homicidios',
    'c10-title-neutral-reg': 'Tasa de homicidios por región de Brasil',
    'c10-sub': 'Homicidios por cada 100.000 habitantes. {P}.',
    'c10-v-paises': 'Brasil y otros países', 'c10-v-regiones': 'Regiones de Brasil',
    'c10-ytitle': 'Por 100.000 habitantes',
    'reg-Norte': 'Norte', 'reg-Nordeste': 'Nordeste', 'reg-Sudeste': 'Sudeste', 'reg-Sul': 'Sur', 'reg-Centro-Oeste': 'Centro-Oeste',
    'c10-sources': 'Datos: Brasil y sus regiones: IPEA y FBSP, Atlas da Violência (IPEAData, series AVIOL12), sobre el Sistema de Informações sobre Mortalidade (agresiones CID-10 X85-Y09 e intervenciones legales Y35; CID-9 hasta 1995). Otros países: UNODC, homicidios intencionales. Mundo: Our World in Data sobre UNODC. Desde 2018 aumentaron en Brasil las muertes violentas de intención indeterminada: parte de la caída reciente podría ser subregistro. Las fuentes difieren levemente para un mismo año (Brasil 2023: 21,7 en IPEAData, 20,6 en UNODC).',
    'c10-png-source': 'Datos: IPEA, Atlas da Violência (SIM/DATASUS); UNODC; Our World in Data.',
    'c10-card': '¿Brasil es más o menos violento que antes?',

    // ---- 11 deforestación
    'c11-title': 'La deforestación amazónica cayó 84% entre 2004 y 2012, rebotó hasta 2021 y volvió a bajar',
    'c11-title-neutral-cerrado': 'Deforestación anual en el Cerrado',
    'c11-title-neutral-amazonia': 'Deforestación anual en la Amazonia Legal',
    'c11-sub-amazonia': 'Superficie de bosque talada por año en la Amazonia Legal, en kilómetros cuadrados. {P}.',
    'c11-sub-cerrado': 'Superficie de vegetación nativa talada por año en el Cerrado, en kilómetros cuadrados. {P}.',
    'c11-b-amazonia': 'Amazonia', 'c11-b-cerrado': 'Cerrado',
    'c11-ytitle': 'Kilómetros cuadrados',
    'c11-pre': 'estimación preliminar', 'c11-bienal': 'promedio anual del período {A}-{B}',
    'c11-sources': 'Datos: INPE, PRODES (TerraBrasilis). Año PRODES de agosto a julio. Amazonia Legal: 1988 es el promedio anual de 1977-1988 y 1993-1994 un promedio bienal; para 2025 el panel muestra 5.731 km² (la estimación anunciada en octubre de 2025 fue 5.796); 2026 es una estimación preliminar. Cerrado: entre 2000 y 2012 la medición fue bienal (se muestra el promedio anual de cada bienio). Solo mide tala rasa, no degradación ni incendios.',
    'c11-png-source': 'Datos: INPE, PRODES (TerraBrasilis). Barras rayadas: estimación preliminar.',
    'c11-card': '¿Brasil frenó la deforestación de la Amazonia?'
  },
  en: {
    'brand-topic': 'Brazil',
    'page-title': 'Brazil: the great transformations',
    'page-lede': 'How Brazil became the country it is today: an economy that stopped catching up and a society that changed faster than ever.',
    'index-chart-word': 'Chart',
    'index-see': 'See chart →', 'index-charts-label': 'Interactive charts',
    'br-search-ph': 'Add country…', 'br-sin-dato': 'No data for this indicator',
    'lbl-periodo': 'Period',
    'lbl-medida': 'Measure',
    'lbl-vista': 'View',
    'lbl-paises': 'Countries',
    'lbl-indicador': 'Indicator',
    'lbl-anio': 'Year',
    'lbl-religion': 'Religion',
    'lbl-censos': 'Censuses',
    'lbl-flujo': 'Flow',
    'lbl-materia': 'Subject',
    'lbl-socios': 'Partners',
    'lbl-productos': 'Products', 'lbl-categorias': 'Categories', 'lbl-conductas': 'Behaviours',
    'lbl-bioma': 'Biome',
    'lbl-proy': 'Projection',
    'proy-no': 'No projection',
    'proy-si': 'With UN projection',
    'proyeccion': 'Projection',
    'tt-pct': '% of total',
    'reg-sep': ' · ',

    'c1-title': 'Brazil caught up with rich countries until 1980, then stalled',
    'c1-title-neutral': 'GDP per capita relative to the United States',
    'c1-sub-pct': 'GDP per capita as a percentage of the United States, in dollars adjusted for purchasing power (2011 PPP). {P}.',
    'c1-sub-nivel': 'GDP per capita in 2011 dollars adjusted for purchasing power, log scale. {P}.',
    'c1-m-pct': '% of US', 'c1-m-nivel': 'US$ (PPP)',
    'c1-ytitle-pct': '% of US GDP per capita', 'c1-ytitle-nivel': '2011 US$ (PPP), log scale',
    'c1-sources': 'Data: Maddison Project Database 2023 (Bolt and van Zanden, 2024), in 2011 dollars adjusted for purchasing power, up to 2022. From 2023 to 2025, each series is extended with the annual growth of GDP per capita at constant prices from the World Bank (World Development Indicators, NY.GDP.PCAP.KD); Taiwan, Syria, Yemen, the USSR, Czechoslovakia and Yugoslavia end in 2022, and Afghanistan, Cuba and Lebanon in 2024. World: population-weighted average of the 145 countries with continuous data between 1950 and 2022 (before 1950 coverage changes every year), extended with the growth of the World Bank world aggregate. Caveat: between 1991 and 2011 Maddison interpolates relative prices between two international comparisons (1990 and 2011), which adds 1.3 points of growth per year to Brazil relative to IBGE national accounts. With a single price comparison (World Bank at 2021 PPP or Penn World Table at constant prices), Brazil levels before 1990 are higher: 37% of US GDP per capita in 1980 instead of 28%.',
    'c1-png-source': 'Data: Maddison Project Database 2023; 2023-2025, World Bank growth rates. Calculated at purchasing power parity (2011 USD).',
    'c1-title-neutral-nivel': 'GDP per capita',
    'c1-png-sub-pct': 'GDP per capita as a percentage of the United States, {P}.',
    'c1-png-sub-nivel': 'GDP per capita, log scale, {P}.',
    'c5-tt': 'Completed secondary school',
    'c7-tt-hog': 'Households',
    'c7-tt-mill': '{V} million',
    'c11-tt': 'Area cleared',
    'c5-tt-head': '{Y} census',
    'c13-title': 'Since 1980, Brazil has stopped catching up with the United States and lost weight in the world economy',
    'c13-sub': 'Brazil\'s GDP per capita as a percentage of the United States\' and Brazil\'s share of world GDP, at purchasing power parity. 1950-2025.',
    'c13-png-sub': 'GDP per capita relative to the US and share of world GDP, 1950-2025',
    'c13-p1': 'GDP per capita relative to the United States',
    'c13-p2': 'Weight in the world economy',
    'c13-y1': '% of US GDP per capita',
    'c13-y2': '% of world GDP',
    'c13-tt1': 'GDP per capita, % of the US',
    'c13-tt2': '% of world GDP',
    'c13-tt-ext': 'Estimated with Brazil\'s and the world\'s GDP growth (World Bank)',
    'c13-csv-mpd': 'Maddison Project Database 2023',
    'c13-csv-ext': 'Maddison 2022 extended with constant-PPP GDP growth (World Bank)',
    'c13-sources': 'Data: Maddison Project Database 2023 (Bolt and van Zanden), in 2011 dollars at purchasing power parity. World total is the sum of Maddison\'s countries, without double-counting the USSR, Czechoslovakia and Yugoslavia and their successors. 2023-2025: growth of GDP per capita of Brazil and the United States at constant prices and of GDP at constant purchasing power parity of Brazil and the world (World Bank, WDI).',
    'c13-png-source': 'Data: Maddison Project Database 2023; 2023-2025, World Bank GDP growth. Computed at purchasing power parity (2011 USD).',
    'c13-card': "Brazil's unfinished convergence",
    'c2-png-sub-pct': 'Goods exports of {C} by technology content, {P}',
    'c2-png-sub-musd': 'Goods exports of {C} by technology content, in US$ millions, {P}',
    'c4-title-neutral': 'Poverty and inequality',
    'c4-sub': 'Income poverty and inequality, {P}.',
    'c4-p-pov': 'Poverty (${L} a day)',
    'c4-p-gini': 'Inequality (Gini coefficient)',
    'c4-sin-dato': 'No data for the selection',
    'lbl-linea': 'Poverty line',
    'c4-lat-gini': 'Latin America',
    'c3-p-soc-EXP': 'Share of Brazil\'s exports',
    'c3-p-soc-IMP': 'Share of Brazil\'s imports',
    'c3-p-soc-TOT': 'Share of Brazil\'s total trade',
    'c3-p-lall-EXP': 'What Brazil sells to each destination in {Y}, by technology content',
    'c3-p-lall-IMP': 'What Brazil buys from each origin in {Y}, by technology content',
    'c3-p-lall-TOT': 'Composition of trade with each partner in {Y}, by technology content',
    'c3-lall-prim': 'Primary products',
    'c3-lall-rrnn': 'Resource-based manufactures',
    'c3-lall-baja': 'Low-tech manufactures',
    'c3-lall-alta': 'Medium- and high-tech manufactures',
    'c3-lall-otras': 'Other',
    'c1-card': 'Is Brazil catching up with rich countries?',

    'c2-v-fator': 'Degree of processing', 'c2-v-lall': 'Technology content', 'c2-v-productos': 'Products',
    'c2-m-pct': '% of total', 'c2-m-musd': 'US$ millions',
    'c2-ytitle-pct': '% of goods exports', 'c2-ytitle-musd': 'Current US$ millions',
    'cat-Básicos': 'Primary', 'cat-Semimanufacturados': 'Semi-manufactured', 'cat-Manufacturados': 'Manufactured',
    'cat-Productos primarios': 'Primary products', 'cat-Manuf. basadas en RRNN': 'Resource-based manufactures',
    'cat-Manuf. baja tecnología': 'Low tech', 'cat-Manuf. media y alta tecnología': 'Medium and high tech',
    'cat-Otras / sin clasificar': 'Other / unclassified',
    'cat-Soja (poroto, aceite, harina)': 'Soy and products', 'cat-Mineral de hierro': 'Iron ore', 'cat-Petróleo crudo': 'Crude oil',
    'cat-Carnes': 'Meat', 'cat-Azúcar': 'Sugar', 'cat-Café': 'Coffee', 'cat-Celulosa': 'Pulp', 'cat-Automóviles': 'Cars',
    'cat-Aviones': 'Aircraft', 'cat-Maquinaria y equipo eléctrico (SH 84-85)': 'Machinery and electrical equipment',
    'c2-sources': 'Data: Growth Lab (Harvard University), Atlas of Economic Complexity: goods trade in SITC Rev. 2 at 4 digits, 1962-2024, in current dollars. Grouped by the Lall (2000) classification in the Argendata (Fundar) version, which counts ores and gold as primary products. Unclassified are special transactions with no product assigned (SITC 9310) and Other covers items such as electricity, coins or postal packages. Shares are computed over total goods.',
    'c2-png-source': 'Data: Growth Lab (Harvard), Atlas of Economic Complexity; Lall\'s classification of exports by technology content.',
    'c2-title': 'In 2000, primary products were a quarter of Brazil\'s exports; today they are six in ten',
    'lall-ns': 'Unclassified',
    'c2-card': 'What does Brazil sell to the world?',
    'lall-pp': 'Primary products', 'lall-rrnn': 'Resource-based manufactures', 'lall-baja': 'Low-tech manufactures',
    'lall-media': 'Medium-tech manufactures', 'lall-alta': 'High-tech manufactures', 'lall-otros': 'Other',
    'c2-title-neutral-lall': 'Exports of {C} by technology content',
    'c2-sub-lall-pct': 'Share of each group in the value of goods exports of {C}, by the Lall classification, in percent. {P}.',
    'c2-sub-lall-musd': 'Goods exports of {C} by technology content (Lall classification), in millions of current dollars. {P}.',
    'lbl-pais': 'Country',

    'c3-title': 'China became Brazil\'s main export destination, and buys almost only raw materials and their derivatives',
    'c3-title-neutral-EXP': "Main destinations of Brazil's exports",
    'c3-title-neutral-IMP': "Main origins of Brazil's imports",
    'c3-title-comp': 'Brazil sells China raw materials and buys technology',
    'c3-title-neutral-comp': 'What Brazil sells to and buys from China',
    'c3-sub-EXP': 'Goods exports by destination, {P}, and their composition in {Y}. In %.',
    'c3-sub-IMP': 'Goods imports by origin, {P}, and their composition in {Y}. In %.',
    'c3-sub-comp': 'Composition of trade by technology content (Lall classification), as a percentage of value. {Y}.',
    'c3-v-socios': 'Partners', 'c3-v-comp': 'What is traded with China',
    'c3-f-EXP': 'Exports', 'c3-f-IMP': 'Imports',
    'c3-ytitle': '% of total',
    'soc-China': 'China', 'soc-Estados Unidos': 'United States', 'soc-Unión Europea (27)': 'European Union', 'soc-Argentina': 'Argentina',
    'soc-Resto Mercosur (PRY+URY)': 'Paraguay and Uruguay', 'soc-Resto del mundo': 'Rest of the world',
    'soc-China + Hong Kong + Macao (sensibilidad)': 'China incl. Hong Kong and Macao',
    'c3-row-EXP|China': 'Brazil sells to China', 'c3-row-IMP|China': 'Brazil buys from China',
    'c3-row-EXP|Resto del mundo excl. China': 'Brazil sells to the rest of the world',
    'c3-sources': 'Data: MDIC/Secex, Comex Stat raw database (NBM 1989-1996 and NCM 1997-2025), FOB values in current dollars. China is mainland China (with Hong Kong and Macao, 2025 goes from 28.7% to 29.1%). European Union: the current 27 members throughout. Destination or origin as declared in customs. Technology content: Lall (2000), UNCTAD version (SITC Rev. 3), applied to the NCM through the MDIC SITC correspondence and grouped into four groups plus other; it may differ slightly from the exports chart, which uses the Atlas of Economic Complexity (SITC Rev. 2).',
    'c3-png-source': 'Data: MDIC/Secex foreign trade database (US$ FOB). Technology content: Lall (2000) classification.',
    'c3-f-TOT': 'Total trade',
    'c3-title-neutral-TOT': 'Main partners in Brazil\'s total trade',
    'c3-sub-TOT': 'Total trade (exports plus imports) by partner, {P}, and its composition in {Y}. In %.',
    'c3-card': 'How much does Brazil depend on China?',
    'c3-add-ph': 'Add a partner…',

    'c4-title': 'Since 1990, poverty and inequality have fallen more in Brazil than in the region',
    'c4-title-neutral-pov': 'Poverty at the ${L} a day line',
    'c4-title-neutral-gini': 'Income inequality (Gini coefficient)',
    'c4-sub-pov': 'Share of the population living on less than ${L} per person per day, in dollars adjusted for purchasing power (2021 PPP). {P}.',
    'c4-sub-gini': 'Gini coefficient of per capita income or consumption (0 = total equality, 1 = maximum inequality). {P}.',
    'c4-i-8.3': 'Poverty $8.30', 'c4-i-4.2': 'Poverty $4.20', 'c4-i-3.0': 'Extreme poverty $3', 'c4-i-gini': 'Gini',
    'c4-ytitle-pov': '% of population', 'c4-ytitle-gini': 'Gini coefficient',
    'c4-arg': ' (urban)',
    'c4-sources': 'Data: World Bank, Poverty and Inequality Platform (PIP), 2021 PPP, without filling years with no survey (dots mark survey years). $3 is the international extreme poverty line; $4.20 and $8.30 are the lines for lower- and upper-middle-income countries. Brazil: PNAD 1981-2011 and PNAD Contínua from 2012; the line joins segments that PIP flags as non-comparable (survey change). Argentina: urban areas only. Poverty in Latin America and the Caribbean and the World: PIP annual regional estimates. Latin America Gini: PIP does not publish regional inequality; it is the simple average of a fixed panel of 16 countries with income surveys between 1997 and 2024 (Argentina, Bolivia, Brazil, Chile, Colombia, Costa Rica, Dominican Republic, Ecuador, El Salvador, Guatemala, Honduras, Mexico, Panama, Paraguay, Peru and Uruguay), with linear interpolation between survey years within each country. Argentina (urban areas only) and Uruguay up to 2005 (also urban) are treated as national; Guatemala and El Salvador carry their 2023 value into 2024. Before 1997, the series is chained backwards with the change in the average of the panel countries with data (5 in 1981, 9 in 1987, 12 in 1990 and 14 in 1994). 2020 is affected by pandemic emergency aid. Surveys under-capture top incomes.',
    'c4-png-source': 'Data: World Bank, PIP (2021 PPP). Dots: survey years. Latin America Gini: average of 16 countries from 1997, chained backwards with those with data.',
    'c4-card': 'How much has poverty fallen in Brazil?',

    'c5-title': 'The share of young people who finished secondary school almost tripled since 1991',
    'c5-title-neutral': 'Young people who completed secondary school',
    'c5-sub': 'People aged 25 to 29 in Brazil who completed secondary school, as a percentage of that age group. Censuses of 1991, 2000, 2010 and 2022.',
    'mat-matematica': 'mathematics', 'mat-lectura': 'reading', 'mat-ciencias': 'science',
    'mat-btn-matematica': 'Mathematics', 'mat-btn-lectura': 'Reading', 'mat-btn-ciencias': 'Science',
    'c5-aprox': 'approximated by 11 or more years of schooling',
    'c5-sources': 'Data: IBGE, population censuses (SIDRA tables 142, 2978, 3540 and 10061). * 1991 and 2000 are approximated by 11 or more years of schooling, because those censuses do not publish completed level with the same classification.',
    'c5-png-source': 'Data: IBGE, censuses (SIDRA). * 1991 and 2000: 11 or more years of schooling.',
    'c5-ytitle': '% of people aged 25 to 29',
    'c12-title': 'Brazilian students score about the same in PISA as in 2009',
    'c12-title-neutral': 'PISA scores in mathematics, reading and science',
    'c12-sub': 'Average PISA score in mathematics, reading and science (15-year-old students). {P}.',
    'c12-ytitle': 'Average score',
    'c12-sources': 'Data: OECD, PISA 2022 Database, via Our World in Data; 2025: OECD, PISA 2025 Results (Volume I). OECD average: average of OECD countries in each round. Trends are comparable from 2000 in reading, 2003 in mathematics and 2006 in science; 2015 moved to computer-based testing and 2022 is post-pandemic. PISA now tests more children who previously did not reach school at 15.',
    'c12-png-source': 'Data: OECD, PISA (2000-2022 via Our World in Data; 2025, PISA 2025 Results).',
    'c12-card': 'Are Brazilian students learning more?',
    'c5-card': 'How many young Brazilians finish secondary school?',

    'c6-title': 'In sixty years, Brazilian women went from having six children to fewer than two',
    'c6-title-neutral-TFR': 'Total fertility rate',
    'c6-title-neutral-LEx': 'Life expectancy at birth',
    'c6-title-neutral-MedianAgePop': 'Median age of the population',
    'c6-sub-TFR': "Number of children a woman would have over her lifetime at each year's rates. {P}.",
    'c6-sub-LEx': "Years a newborn would live on average at each year's mortality. {P}.",
    'c6-sub-MedianAgePop': 'Age that divides the population into two halves, in years. {P}.',
    'c6-sub-proy': ' From 2024, UN projection (medium variant).',
    'c6-i-TFR': 'Fertility', 'c6-i-LEx': 'Life expectancy', 'c6-i-MedianAgePop': 'Median age',
    'c6-ytitle-TFR': 'Births per woman', 'c6-ytitle-LEx': 'Years', 'c6-ytitle-MedianAgePop': 'Years',
    'c6-reemplazo': 'Replacement level (2.1)',
    'c6-sources': 'Data: United Nations, World Population Prospects 2024. Estimates 1950-2023 and, if switched on, the medium-variant projection (2025-2100, every five years, dotted over a grey band). Estimates for 1950-1970 are indirect. The 2022 Brazilian census gives a fertility rate of 1.55 for 2022; the UN, 1.63 (methodological differences).',
    'c6-png-source': 'Data: United Nations, World Population Prospects 2024.',
    'c6-card': "How fast did Brazil's demography change?",

    'c7-title': 'Households of six or more fell from 27% to 4%; one-person homes rose from 7% to 19%',
    'c7-title-neutral': 'Households by number of members',
    'c7-sub-pct': 'Households by number of members, as a percentage. Censuses 1980-2022.',
    'c7-sub-abs': 'Households by number of members, in millions. Censuses 1980-2022.',
    'c7-m-pct': '% of households', 'c7-m-abs': 'Millions of households',
    'c7-n-1': '1 person', 'c7-n-2': '2', 'c7-n-3': '3', 'c7-n-4': '4', 'c7-n-5': '5', 'c7-n-6+': '6 or more',
    'c7-tt-n-1': '1 person', 'c7-tt-n': '{N} people', 'c7-tt-n-6+': '6 or more people',
    'c7-media': 'Average household size: {V}',
    'c7-sources': 'Data: IBGE. 1980: 1980 census, advance tabulations from a sample (Estatísticas do Século XX, 1981 Statistical Yearbook); 1991-2010: SIDRA table 185 (permanent private dwellings); 2022: SIDRA table 9880 (private dwellings). Average household size: SIDRA tables 156 and 4712.',
    'c7-png-source': 'Data: IBGE, population censuses 1980-2022 (1980: sample tabulations).',
    'c7-card': 'How did the size of Brazilian households change?',

    'c8-title-censos': 'Since 1980, Catholics fell from 89% to 57% and evangelicals quadrupled',
    'c8-title': 'Since 1980, Catholics fell from 89% to 57% and evangelicals quadrupled',
    'c8-title-edad': 'In 1991 age made no difference; in 2022 the young are far less Catholic',
    'c8-title-neutral-censos': 'The religion of Brazilians in the censuses',
    'c8-title-neutral-edad': 'Religion by age',
    'c8-sub-censos': 'Population of Brazil by declared religion in each census, as a percentage. {P}.',
    'c8-sub-edad': 'Share of {R} by age group in Brazil, population aged 10 and over. Censuses of {C}.',
    'c8-v-censos': 'Censuses 1872-2022', 'c8-v-edad': 'By age',    'rel-cat': 'Catholic', 'rel-evg': 'Evangelical', 'rel-sin': 'No religion', 'rel-otr': 'Other',
    'rel-gen-cat': 'Catholics', 'rel-gen-evg': 'evangelicals', 'rel-gen-sin': 'people with no religion',
    'c8-sources': 'Data: IBGE, population censuses. 1872-2010: Anuário Estatístico do Brasil 2024, table 2.1.1.1 (present population until 1950, resident afterwards). 1991-2022 by age: SIDRA tables 137, 139 and 9537. In 2022 religion was asked of people aged 10 and over (on that basis, 2010 showed 65.1% Catholic and 21.6% evangelical); comparisons by age always use that basis. Until 1980 "no religion" includes those who did not answer. There were no comparable censuses between 1890 and 1940: the line joins those two censuses. Evangelicals are not a homogeneous bloc.',
    'c8-png-source': 'Data: IBGE, population censuses (Anuário Estatístico 2024 and SIDRA).',
    'c8-ytitle-censos': '% of the population',
    'c8-ytitle-edad': '% of each age group',
    'c8-todas': 'All ages',
    'c8-card': 'How did religion change in Brazil?',
    'c8-add-ph': 'Add a census…',

    'c9-title': 'Those who say homosexuality is never justifiable fell from 70% to 34%; for abortion it is still two in three',
    'c9-title-neutral': 'How many Brazilians say these behaviours are never justifiable',
    'c9-ytitle-pct': '% of adults',    'val-homosexualidad': 'Homosexuality', 'val-aborto': 'Abortion', 'val-divorcio': 'Divorce', 'val-eutanasia': 'Euthanasia',
    'c9-sources': 'Data: World Values Survey, 1981-2022 time series (version 4.0), Brazil waves of 1991, 1997, 2006, 2014 and 2018; variables F118 (homosexuality), F120 (abortion), F121 (divorce) and F122 (euthanasia). Computed as the share of adults who choose 1 ("never justifiable") on a scale that goes up to 10 ("always justifiable"), using the survey weights (the 1997 wave has none) and excluding those who do not know or do not answer.',
    'c9-png-source': 'Data: World Values Survey; % answering 1 ("never justifiable") on a 1-10 scale.',
    'c9-sub': 'Share of adults in Brazil who say each behaviour is never justifiable. {P}.',
    'c7-ytitle-pct': '% of households',
    'c7-ytitle-abs': 'Millions of households',
    'c9-card': 'Have Brazilians become more liberal?',
    'c9-add-ph': 'Add a behaviour…',

    'c10-title': 'Homicides nearly tripled until 2017 and have since fallen by more than a third',
    'c10-title-neutral': 'Homicide rate',
    'c10-title-neutral-reg': 'Homicide rate by region of Brazil',
    'c10-sub': 'Homicides per 100,000 people. {P}.',
    'c10-v-paises': 'Brazil and other countries', 'c10-v-regiones': "Brazil's regions",
    'c10-ytitle': 'Per 100,000 people',
    'reg-Norte': 'North', 'reg-Nordeste': 'Northeast', 'reg-Sudeste': 'Southeast', 'reg-Sul': 'South', 'reg-Centro-Oeste': 'Center-West',
    'c10-sources': "Data: Brazil and its regions: IPEA and FBSP, Atlas da Violência (IPEAData, AVIOL12 series), based on the Mortality Information System (assault ICD-10 X85-Y09 and legal interventions Y35; ICD-9 until 1995). Other countries: UNODC, intentional homicide. World: Our World in Data based on UNODC. Since 2018 violent deaths of undetermined intent have increased in Brazil: part of the recent fall may reflect under-recording. Sources differ slightly for the same year (Brazil 2023: 21.7 in IPEAData, 20.6 in UNODC).",
    'c10-png-source': 'Data: IPEA, Atlas da Violência (SIM/DATASUS); UNODC; Our World in Data.',
    'c10-card': 'Is Brazil more or less violent than before?',

    'c11-title': 'Amazon deforestation fell 84% by 2012, rebounded and is falling again',
    'c11-title-neutral-cerrado': 'Annual deforestation in the Cerrado',
    'c11-title-neutral-amazonia': 'Annual deforestation in the Legal Amazon',
    'c11-sub-amazonia': 'Forest area clear-cut each year in the Legal Amazon, in square kilometres. {P}.',
    'c11-sub-cerrado': 'Native vegetation area clear-cut each year in the Cerrado, in square kilometres. {P}.',
    'c11-b-amazonia': 'Amazon', 'c11-b-cerrado': 'Cerrado',
    'c11-ytitle': 'Square kilometres',
    'c11-pre': 'preliminary estimate', 'c11-bienal': 'annual average for {A}-{B}',
    'c11-sources': 'Data: INPE, PRODES (TerraBrasilis). PRODES year from August to July. Legal Amazon: 1988 is the 1977-1988 annual average and 1993-1994 a two-year average; for 2025 the dashboard shows 5,731 km² (the estimate announced in October 2025 was 5,796); 2026 is a preliminary estimate. Cerrado: between 2000 and 2012 measurement was biennial (the annual average of each two-year period is shown). Only clear-cutting is measured, not degradation or fires.',
    'c11-png-source': 'Data: INPE, PRODES (TerraBrasilis). Hatched bars: preliminary estimate.',
    'c11-card': 'Has Brazil curbed Amazon deforestation?'
  }
};

// Merge shared base (lib/i18n.js) with issue overrides.
const I18N = {
  es: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.es : {}), ...ISSUE_I18N.es },
  en: { ...(typeof BASE_I18N !== 'undefined' ? BASE_I18N.en : {}), ...ISSUE_I18N.en }
};

let LANG = 'es';
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || key;

// state global, indexado por chart
const state = {};

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (I18N[LANG][key]) el.innerHTML = I18N[LANG][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (I18N[LANG][key]) el.placeholder = I18N[LANG][key];
  });
  document.querySelectorAll('[data-i18n-href]').forEach(el => {
    const key = el.dataset.i18nHref;
    if (I18N[LANG][key]) el.setAttribute('href', I18N[LANG][key]);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (I18N[LANG][key]) el.setAttribute('aria-label', I18N[LANG][key]);
  });
}

// Resolver idioma: ?lang=en|es en la URL tiene prioridad; si no, lo último
// elegido (localStorage), para que el idioma sobreviva a la navegación.
(function initLang() {
  let stored = null;
  try { stored = localStorage.getItem('atlas-lang'); } catch (_) {}
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'es') {
    LANG = urlLang;
    try { localStorage.setItem('atlas-lang', LANG); } catch (_) {}
  } else if (stored === 'en' || stored === 'es') {
    LANG = stored;
  }
  document.documentElement.lang = LANG;
})();

function setupLangToggle(onLangChange) {
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      LANG = btn.dataset.lang;
      try { localStorage.setItem('atlas-lang', LANG); } catch (_) {}
      document.documentElement.lang = LANG;
      document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
      applyI18n();
      if (onLangChange) onLangChange();
    });
  });
  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === LANG);
  });
}
