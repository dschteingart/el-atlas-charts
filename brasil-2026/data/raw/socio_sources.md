# Indicadores sociales por municipio (placa "Quién votó a quién")

Bajados el 3/10/2026. Archivos en `data/raw/socio/`; `scripts/armar_socio.py` arma `data/socio.js` con los cuatro que usa la placa. Clave: código IBGE de 7 dígitos (5.570 municipios).

| Indicador | Fuente | Archivo |
|---|---|---|
| Familias con Auxílio Brasil (hoy Bolsa Família) cada 100 hogares, octubre de 2022 | Portal da Transparência (CGU), descarga masiva de Auxílio Brasil, competencia 202210 (`https://portaldatransparencia.gov.br/download-de-dados/auxilio-brasil/202210`), agregada por municipio (código SIAFI → IBGE con la tabla del Tesoro). Hogares: IBGE, Censo 2022, tabla 4712 | `bolsa_familia_portal_transparencia.csv` |
| Ingreso mensual por persona del hogar, mediana (R$) | IBGE, Censo 2022, SIDRA tabla 10295 | `censo2022_rendimento_domiciliar_pc.csv` |
| % de población blanca | IBGE, Censo 2022, SIDRA tabla 9605 | `censo2022_cor_raca.csv` |
| % de evangélicos (10 años y más) | IBGE, Censo 2022, SIDRA tabla 9537 | `censo2022_religiao.csv` |

Notas:
- El archivo del Portal da Transparência es de **saques** (familias que cobraron en el mes): suma 20,0 millones de familias en octubre de 2022, algo menos que el total de familias beneficiarias que informó el gobierno ese mes (alrededor de 21 millones). Sirve para comparar municipios entre sí.
- En unos pocos municipios chicos las familias superan los 100 cada 100 hogares: para el programa una "familia" no es lo mismo que un hogar del censo (en un mismo hogar puede haber más de una).
- También se bajaron (no se usan en la placa): alfabetización (tabla 9543), años de estudio (10062), nivel de instrucción (10061), urbanización (9923), edad (9756), población (4714), PIB municipal y composición del valor agregado (5938), CadÚnico (MDS, agosto de 2026, parcial).
- Correlaciones con el % de Lula en el balotaje 2022 (ponderadas por votos): Auxílio Brasil +0,74; ingreso (log) −0,73; analfabetismo +0,73; % blancos −0,61; PIB per cápita (log) −0,60; % urbano −0,50; % evangélicos −0,44 (−0,67 dentro del Nordeste); % universitarios −0,43.
