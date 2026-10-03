# Homicides in Brazil, sources for `homicides.csv`

Retrieved 2026-10-02. All figures were fetched from the sources below; none were typed from memory.

## Columns

| column | content | source |
|---|---|---|
| `rate_sim_atlas` | Registered homicide rate per 100k (SIM/Ministry of Health), 2010–2024 | IPEA Atlas da Violência data API, series 20 "Taxa de homicídios registrados", Brazil |
| `homicides_sim_atlas` | Registered homicides (count), 2010–2024 | IPEA Atlas da Violência data API, series 328 "Homicídios registrados", Brazil |
| `rate_mvi_fbsp` | Mortes Violentas Intencionais (MVI) per 100k, 2012–2025 | FBSP, 20º Anuário Brasileiro de Segurança Pública 2026, Tabela 02 |
| `mvi_fbsp` | MVI victims (count), 2012–2025 | same as above |
| `note` | caveats per year | — |
| `rate_sim_atlas2026_pub` (extra) | Rate as **printed** in the Atlas da Violência 2026 report, 2014–2024 (1 decimal) | Atlas da Violência 2026 PDF, Tabela 2.1, p. 16 |

## Series 1: SIM homicides (Atlas da Violência, IPEA + FBSP)

- **Definition:** deaths registered in SIM (Ministry of Health), by place of residence. ICD-10 codes X85–Y09 (assault) plus Y35–Y36 (legal intervention / operations of war). This is health-system data.
- **API** (raw Brazil rows saved in `violence_trade_api_dumps/`). The old `https://www.ipea.gov.br/atlasviolencia/api/v1/...` endpoints no longer exist: the site was rebuilt in Next.js and those URLs now return 404. The new site reads from:
  - values: `GET https://www.ipea.gov.br/dados-api/series-values/{serie_id}/{abrangencia}` (abrangência 1 = country level). The response holds about 196 countries. **Brazil is `regiao_id` = 1076.**
  - series catalogue: `GET https://www.ipea.gov.br/cms/api/series?pagination[pageSize]=100&pagination[page]=N`. This gives id 20 = "Taxa de homicídios registrados" and id 328 = "Homicídios registrados". Other ids: 366/368 = estimated homicides (count/rate), available only to 2023 in the API.
- **Latest data point: 2024**, from the **Atlas da Violência 2026** (published May 2026; Cerqueira & Bueno, coords., Ipea/FBSP). PDF: https://repositorio.ipea.gov.br/bitstreams/6e855a6f-1a5d-494d-90aa-753862e10369/download (repository page: https://repositorio.ipea.gov.br/entities/publication/9ab87dfc-33eb-4ac2-8a54-f4f1543dabbc).
  - The API counts match the report's Tabela 2.2 (p. 17) exactly for 2014–2024, for example 2024 = 42,590 and 2023 = 45,747.
  - The API rates are about 0.1 below the report's Tabela 2.1 (p. 16). Example for 2024: API 20.03, report **20.1**. The cause is the population denominator. The report uses PNADc population (stated in the source note of Graph 1.1). The API uses IBGE population estimates: implied population for 2024 is 212.63 M, which is the same denominator the FBSP Anuário uses (implied 212.60 M). The API series therefore fits better next to the MVI series. The printed values are kept in `rate_sim_atlas2026_pub`.
  - The report's headline text (p. 8 and p. 14) reads: 2024 = 42,590 homicides, rate 20.1, −7.4% in the rate and −6.9% in the count vs 2023, the lowest level since the series began in 2014.
- **Caveat from the Atlas 2026 itself (p. 8):** part of the 2024 drop comes from worse data quality. Mortes Violentas por Causa Indeterminada (MVCI) rose by 3,311 (+23.8%), to 17,207. The "estimated" rate, which reclassifies part of the MVCI as homicides, is 23.4 in 2024 vs 23.5 in 2023, a change of −0.4% (Graph 1.1, p. 8). The estimated series for 2014–2024 is 32.0, 31.1, 32.7, 33.8, 30.7, 25.5, 26.6, 25.3, 24.9, 23.5, 23.4.
- **Revision note:** the current API (2026 vintage, IBGE-revised population) puts the peak at 31.97 in 2017. Older Atlas editions printed about 31.6 for 2017 with older population projections. Use only the current vintage. Do not mix editions.
- **2025:** SIM-based data for 2025 is not published yet. The next Atlas (2027) should cover it.

## Series 2: Mortes Violentas Intencionais (FBSP Anuário)

- **Definition:** police-record data from the state security secretariats. MVI = victims of homicídio doloso (including feminicídio) + latrocínio + lesão corporal seguida de morte + mortes decorrentes de intervenção policial (on and off duty). Population = IBGE estimates as of 1 July. The MVI series starts in **2012**: FBSP computed 2012 retroactively and first published MVI for 2013.
- **Document:** *20º Anuário Brasileiro de Segurança Pública 2026* (FBSP, July 2026).
  - Spreadsheet: https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.xlsx, sheet **T02** ("Série histórica das Mortes Violentas Intencionais, Brasil, Regiões e UFs, 2012-2025"), row "Brasil". Counts and rates were read from here at full precision.
  - PDF: https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026.pdf. **Tabela 02 is on PDF p. 29.** The text on p. 32 reads: "40.775 casos de MVI em 2025 … taxa de 19,1 mortes por 100 mil habitantes, queda de 8,2% em relação ao ano de 2024 e de 31,0% em relação a 2012". Tabela 01 (2024–2025 detail) is in the same workbook, sheet T01.
  - Infographic: https://forumseguranca.org.br/wp-content/uploads/2026/07/anuario-2026-infografico.pdf (40,775 victims; −8.2%; lowest rate since 2012).
- **Latest data point: 2025** = 40,775 victims, 19.11 per 100k.
- The 2024 figure was revised in the 2026 edition to **44,220** (20.80). Press coverage at the time quoted 44,127. Use the 2026-edition value.

**Do not plot the two series as one line.** SIM homicides (health records, by residence, includes undetermined-intent reclassification issues) and MVI (police records, by place of occurrence, includes police killings) differ in definition and in source. Since 2019, MVI has been above SIM.

## Optional 2026 partial indicator: SINESP VDE (Ministério da Justiça)

- **File:** `BancoVDE 2026.xlsx` from https://www.gov.br/mj/pt-br/assuntos/sua-seguranca/seguranca-publica/estatistica/download/dnsp-base-de-dados/bancovde-2026.xlsx/@@download/file (data through **Aug 2026**). Comparison file: `BancoVDE 2025.xlsx`, same path with `-2025`. Both were downloaded 2026-10-02.
- **Method:** filter `abrangencia == "Estadual"`, months Jan–Aug, and sum `total_vitima`. All 27 UFs report in every month of both years.

| Jan–Aug victims | 2025 | 2026 | change |
|---|---|---|---|
| Homicídio doloso | 21,246 | 18,449 | −13.2% |
| Feminicídio | 1,009 | 983 | −2.6% |
| Latrocínio | 540 | 393 | −27.2% |
| Lesão corporal seguida de morte | 462 | 368 | −20.3% |
| **CVLI (sum of the 4 above)** | **23,257** | **20,193** | **−13.2%** |
| Morte por intervenção de agente do Estado | 4,266 | 4,331 | +1.5% |
| **MVI-like (CVLI + police interventions)** | **27,523** | **24,524** | **−10.9%** |

- **Caveats:**
  - The 2026 numbers are preliminary and states revise them.
  - Mato Grosso do Sul shows unusually low values for Jan–Feb 2026 (16 and 12 victims, vs about 40–60 in later months), which suggests incomplete records.
  - Ceará shows −45%. Check these before quoting at state level.
  - The SINESP totals are not identical to the FBSP MVI. For 2025 full year, SINESP homicídio doloso + feminicídio = 33,096 vs FBSP homicídios dolosos = 32,914.
  - Use it only as "trend in 2026 so far".
