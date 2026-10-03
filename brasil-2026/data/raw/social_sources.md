# Brazil social and labor-market series: sources and notes

Retrieved: 2026-10-02. All numbers come from the official APIs or files listed below. Nothing was typed in by hand.
Raw API responses are in `social_api_responses/`, each JSON with the exact request URL. The SIS Excel tables and the PNADC retrospective PDF are in `social_source_files/`.
Scratch scripts (fetch, parse, build) are in the session scratchpad `.../scratchpad/social/`.

APIs used:
- IBGE aggregates API v3: `https://servicodados.ibge.gov.br/api/v3/agregados/{table}/periodos/all/variaveis/{var}?localidades=N1[all]&classificacao={cls}[{cats}]`
- Table metadata: `https://servicodados.ibge.gov.br/api/v3/agregados/{table}/metadados`
- Table notes come from the SIDRA table page (`https://sidra.ibge.gov.br/tabela/{table}`, internal JSON `/Ajax/JSon/Tabela/1/{table}`), read through a browser because Cloudflare blocks scripted access.
- World Bank: `https://api.worldbank.org/v2/country/BRA/indicator/{code}?format=json&per_page=100` (WDI `lastupdated` 2026-07-13)

Python note: IBGE's TLS chain fails with certifi on this machine. The `truststore` package (Windows certificate store) fixes it. Do not use `verify=False`.

## Release dates (from SIDRA metadata)
| Series | Latest period | Released |
|---|---|---|
| PNADC monthly (moving quarter) tables 6381, 6320, 6323, 6389, 8513 | jun-jul-ago 2026 | 2026-09-29 |
| PNADC quarterly tables 4099, 4097, 5434, 6471, 8529 | 2nd quarter 2026 | 2026-08-14 |
| PNADC annual labor-market tables 4562, 4361, 4362, 4659, 4660, 4708 | 2025 | 2026-02-20 |
| PNADC annual Gini table 7435 | 2025 | 2026-05-08 |
| SDG poverty tables 5817, 5877 | 2024 | 2025-12-16/17 |
| SIS 2025 (Síntese de Indicadores Sociais) | data year 2024 | 2025-12-03 |

The next PNADC monthly release (jul-ago-set 2026) is scheduled for **2026-10-30**, after the election. jun-jul-ago 2026 is therefore the last labor-market reading published before the vote.

## IMPORTANT: two kinds of "annual" figure
In January 2025 IBGE changed how it publishes official annual labor-market indicators. They are now estimated from the **annual per-visit database**: accumulated 1st visits, except 2020-2022, which use accumulated 5th visits because of the pandemic. They are published in SIDRA as "PNAD Contínua anual – Mercado de trabalho" and in the "Retrospectiva 2012-2025" (`social_source_files/retro_2012_2025.pdf`, IBGE release of 30/01/2026).
These official values are **not** the simple average of the four quarterly rates. Examples for unemployment, official vs mean of quarters: 2019 11.8 vs 11.98, 2021 14.0 vs 13.22, 2024 6.6 vs 6.85, 2025 5.6 vs 5.88.
IBGE's headlines ("5.6% in 2025, lowest in the series"; "6.6% in 2024") use the official annual values.
**In the annual CSVs, the main column (`rate_pct`, `thousands`) holds the official IBGE annual estimate. The mean of the 4 quarters you asked for is kept next to it (`rate_qavg_pct`, `thousands_qavg`).** For real income, the main column is the quarterly average (see section 3) and the official annual value is in `income_brl_ibge_annual`.
2026 has no annual figure. 2026 rows are flagged `type=partial`. They hold the latest moving quarter and, where relevant, the mean of 2026 Q1-Q2. They also give the same period one year earlier for a like-for-like comparison.

## 1. Unemployment rate (taxa de desocupação, % of labor force aged 14+)
| File | Table | Variable | Notes |
|---|---|---|---|
| unemployment_quarterly.csv | **4099** (PNADC trimestral) | 4099 | 2012-T1 to 2026-T2 |
| unemployment_moving_quarter.csv | **6381** (PNADC mensal) | 4099 | 201203 (jan-fev-mar 2012) to 202608 (jun-jul-ago 2026). Calendar-quarter readings match table 4099 exactly (checked) |
| unemployment_annual.csv | **4562** (PNADC anual) | 4099 (rate), 4103 (CV) | official annual 2012-2025, plus `rate_qavg_pct` from 4099 |

2026: latest moving quarter jun-jul-ago 2026 = **5.3%** (jun-jul-ago 2025 = 5.6%). Mean of 2026-T1 (6.1) and T2 (5.4) = 5.75; the same mean for 2025 was 6.4.

## 2. Employment composition (thousands of employed persons aged 14+)
Classification **11913** "Posição na ocupação e categoria do emprego no trabalho principal", variable **4090** (Mil pessoas).
| Use | Table |
|---|---|
| Official annual 2012-2025 (main column) | **4361** (PNADC anual), categories `11913[all]` |
| Quarterly averages (`thousands_qavg`) | **4097** (PNADC trimestral). Has no CNPJ split and no "Empregado" total |
| 2026 latest (jun-jul-ago 2026) and the same quarter in 2025 | **6320** (PNADC mensal) |

Category ids: 96165 Total; 96166 Empregado; 31721 private employees excl. domestic; **31722 private with carteira**; **31723 private without carteira**; 31724 domestic; **31725 domestic with carteira**; **31726 domestic without carteira**; **31727 public sector** (of which 31728 non-statutory with carteira, 31729 non-statutory without carteira, 31730 military and statutory); **96170 employer** (45934 with CNPJ / 45935 without); **96171 own-account** (45936 with CNPJ / 45937 without); **31731 family auxiliary**.
The `in_chart_set=True` rows are the 8 bold, mutually exclusive categories. They add up to the total (differences are at most 1 thousand, from rounding). `share_pct` = category / total.
The CNPJ split starts in 2016, because the question was added in 2015-Q4.

### Informality rate (taxa de informalidade, % of employed)
| File | Table | Variable |
|---|---|---|
| informality_annual.csv (official 2016-2025) | **4708** (PNADC anual) | 12466 |
| informality_quarterly.csv and `rate_qavg_pct` | **8529** (PNADC trimestral, starts 2015-T4) | 12466 |
| 2026 latest | **8513** (PNADC mensal, starts dez 2015) | 12466 |

IBGE's definition of informal: private employee without carteira, domestic worker without carteira, employer without CNPJ, own-account without CNPJ, and family auxiliary. The 2015 row only holds 2015-T4 (38.3) and should not be charted as an annual value. jun-jul-ago 2026 = **37.5%** (jun-jul-ago 2025 = 38.0%).

### Employment by sector (grupamentos de atividade)
Classification **888** "Grupamentos de atividades no trabalho principal - PNADC", variable 4090.
- Official annual: **4362**
- Quarterly averages: **5434** (also has 60031 Manufacturing and 60033 Ill-defined, which are not in the annual table)
- 2026 latest: **6323**

Category ids: 47946 Total; 47947 Agriculture; 47948 Industry (general); 47949 Construction; 47950 Commerce; 56622 Transport; 56623 Accommodation and food; 56624 Info, finance, real estate, professional and admin services; 60032 Public administration, education, health and social services (IBGE groups these together); 56627 Other services; 56628 Domestic services.
The Total includes ill-defined activities, so the sector shares add up to slightly less than 100%.

## 3. Real average income (rendimento médio mensal real habitual do trabalho principal, R$)
Variable **5932**, classification 11913 category 96165 (Total).
- `real_income_quarterly.csv` has two columns:
  - `income_brl_2t2026_prices`, from table **6471** (quarterly; table 5436 returns no data for 2020-T2 to 2022-T1 through the API, so it was not used).
  - `income_brl_jja2026_prices`, the same calendar quarter read from table **6389** (moving-quarter table).
  - The two columns differ only by price base: the ratio is a constant 1.0022-1.0026.
- `real_income_moving_quarter.csv`: all 174 moving quarters from table 6389.
- `real_income_annual.csv`:
  - `income_brl` = mean of the 4 calendar quarters, from table 6389, **in R$ at average prices of jun-jul-ago 2026**. It is on the same price base as the 2026 latest value (R$ 3,660 in jun-jul-ago 2026; R$ 3,535 in jun-jul-ago 2025).
  - `income_brl_ibge_annual` = official annual estimate, table **4659**. It uses a different method (annual visit database) and constant R$ of 2025. The table notes only say "deflated per PNADC Technical Notes" and do not state the reference month.
  - Cross-check of the all-jobs annual table 4660: 2025 real = 3,560 vs nominal = 3,555. Same base, all jobs: IBGE's press release headline R$ 3,560.

**Price base caveat:** SIDRA's note says "the deflator for the average of the latest quarter of collection published is used" (Nota Técnica May/2015, updated 16/10/2018). The IPCA-based deflator is applied to the whole series. **Every new release re-deflates the whole history**, so these R$ values move slightly each month. Always quote the price base.

## 4. Gini index (household per-capita income, all sources)
- `gini_ibge`: table **7435** (PNADC anual), variable 10681 (CV in 10682), 2012-2025. Excludes pensioners, domestic employees and their relatives. 2020-2022 use 5th visits. Weighting per Nota Técnica 03/2021.
- `gini_ibge_sis2025_check`: SIS 2025 Tabela 2.13. It matches 7435 to three decimals for 2012-2024.
- `gini_worldbank`: WDI **SI.POV.GINI**, divided by 100 to put it on a 0-1 scale.
  - There is no 2010 value: 2010 was a Census year with no PNAD.
  - The 2011 value comes from the old PNAD and is not strictly comparable with PNADC 2012+.
  - World Bank 2020 is 0.488 vs IBGE 0.523, because the welfare aggregate and treatment differ.
- IBGE 2025 = 0.511, up from 0.504 in 2024 (CV 0.6%).

## 5. Poverty (% of population, household per-capita income)
Rows are ordered by `source_rank`. **Do not mix sources in one line: levels differ even at the same nominal US$ line.**
1. **IBGE SIS 2025, Tabela 2.18 (preferred)**, 2012-2024.
   - Lines: poverty < **US$ 6.85/day PPP 2017**; extreme poverty < **US$ 2.15/day PPP 2017**; also < US$ 3.65 PPP 2017.
   - Conversion: PPP for private consumption, R$ 2.3273771 per US$, daily values turned into monthly and updated with IPCA.
   - **SIS 2025 still uses the 2017-PPP lines.** It did not adopt the new US$ 8.30 / US$ 3.00 lines at 2021 PPP.
   - Values for 2024: 23.11% and 3.47%. These match IBGE's press figures of 23.1% and 3.5%.
2. **IBGE SDG indicators in SIDRA**:
   - Table **5877** (indicator 1.2.1, variable 9948): < **US$ 8.30/day PPP 2021**.
   - Table **5817** (indicator 1.1.1, variable 9617): < **US$ 3.00/day PPP 2021**.
   - Conversion: PPP for final consumption, R$ 2.44983620 per US$, inflated with PNADC deflators.
   - Coverage 2012-2024; 2024 values are 26.5% and 4.7%.
3. **World Bank WDI/PIP**:
   - SI.POV.UMIC (US$ 8.30, PPP 2021), SI.POV.DDAY (US$ 3.00, PPP 2021), SI.POV.LMIC (US$ 4.20, PPP 2021).
   - Coverage 2011-2024; there is no 2010 value (Census year).
   - 2024 values are 20.6% and 3.0%. These are well below IBGE's SDG figures at the same nominal lines because the PPP factor, deflation and welfare aggregate differ.

**Poverty for 2025 has not been officially released.** It is expected in SIS 2026, around December 2026. No 2025 poverty value was estimated here.

## General caveats
- **Reweighting:** under Nota Técnica 02/2025, the PNADC series were re-weighted and the full history was revised. This applied to monthly tables from 31/07/2025, quarterly tables from 15/08/2025 and the annual labor tables from the 2025 release. Values published before those dates will not match.
- **Concept changes, 2015-Q4 and April 2016:**
  - From 2015-Q4, people on paid leave of any length count as employed.
  - From 2015-Q4, unpaid helpers in a relative's business count as employed.
  - From April 2016, job offers starting more than 3 months later count as out of the labor force.
- **Pandemic years:** the 2020-2022 annual figures use accumulated 5th visits.
- **2020 income spike:** real average income jumped in 2020-T2 and T3 (R$ 3,444 and R$ 3,484 at jun-jul-ago 2026 prices, against R$ 3,294 in 2020-T1). In the same year, employment collapsed:
  - Private employees with carteira fell 6.3%, from 34.1M in 2019 to 32.0M in 2020 (official annual table 4361).
  - Private employees without carteira fell 19%, from 12.1M to 9.8M.
  - The losses were concentrated in informal jobs, so the spike is most likely a change in who was still working, not a wage gain. Do not present it as rising wages.
- **Seasonality:** a single 2026 moving quarter is seasonal. Compare it with the same moving quarter a year earlier (provided in the files), not with an annual average.
