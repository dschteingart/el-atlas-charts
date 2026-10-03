# Brazil macro series: sources and caveats

Retrieved: 2026-10-02 (all API calls run that day). Snapshots of the raw API responses are in `macro_api_snapshots/`.
Build script (scratch): `scratchpad/macro/build.py`. Python used `truststore` because IBGE's TLS chain fails with certifi.

## 1. Real GDP growth (`gdp_growth.csv`)

**Primary source:** IBGE, Contas Nacionais Trimestrais, SIDRA table 5932 ("Taxa de variação do índice de volume trimestral").
- API: `https://apisidra.ibge.gov.br/values/t/5932/n1/all/v/6561,6562,6563,6564/p/all/c11255/90707,93404`
- Annual value = variable 6563 ("Taxa acumulada ao longo do ano, em relação ao mesmo período do ano anterior") in Q4, category 90707 (PIB a preços de mercado).
- SIDRA period metadata (`/api/v3/agregados/5932/periodos`): latest period 2026Q2, last modified 01/09/2026. The Q2-2026 release is "PIB cresce 0,5% no segundo trimestre de 2026", IBGE Agência de Notícias, 01/09/2026 09h00. Its numbers match the API.

**Cross-checks:**
- IMF DataMapper `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/BRA`. Metadata says "World Economic Outlook (April 2026)", last modified 2026-04-08. It matches IBGE 5932 for **every year 2010–2025**.
- IBGE annual SCN, SIDRA table 6784, v9810 ("PIB - variação em volume"), 1996–2023: `https://apisidra.ibge.gov.br/values/t/6784/n1/all/v/9810/p/all`. It matches 5932 except **2018 (SCN 1.7 vs CNT 1.8)** and **2019 (SCN 1.3 vs CNT 1.2)**. This is a rounding or vintage difference. We use the 5932 values, which are IBGE's headline numbers and the same ones the IMF uses.
- The BCB RPM (Sept 2026, Tabela 1) also gives 2024 = 3.4 and 2025 = 2.3.

**2026 rows:** There are two rows for 2026, so filter on `type`:
- `partial` = 1.9%, the H1-2026 change vs H1-2025. The same release gives:
  - Q2-2026 vs Q2-2025: 2.0%
  - Q1-2026 vs Q1-2025: 1.8%
  - 4-quarter accumulated to Q2-2026: 1.9%
  - Q2 vs Q1, seasonally adjusted: +0.5%
- `projection` = Focus median, 1.86%.

**Caveats:**
- National accounts are revised. 2023 is now 3.2 (it was first published lower), and 2024–2025 may still be revised when the next annual SCN comes out.
- The 2026 partial figure is not comparable to a full-year rate.

## 2. 2026 GDP projections (`gdp_2026_projections.csv`)

- **Focus (BCB market survey):**
  - API: Olinda `https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=500&$filter=Indicador%20eq%20'PIB%20Total'%20and%20DataReferencia%20eq%20'2026'%20and%20Data%20ge%20'2026-06-01'&$orderby=Data%20desc&$format=json`
  - We use `baseCalculo=0`, which is the 30-day respondent window used in the report headline.
  - Latest `Data` = 2026-09-25: median 1.8603, rounded to **1.86** (106 respondents). The 5-business-day median is 1.85 (39 respondents).
  - Earlier medians: 2026-09-18 = 1.88; 2026-08-28 = **1.92**.
  - Verified against the PDF `https://www.bcb.gov.br/content/focus/focus/R20260925.pdf` ("Expectativas de Mercado, 25 de setembro de 2026"). It shows PIB 2026: Há 4 semanas 1,92 / Há 1 semana 1,88 / Hoje 1,86.
  - On 2026-10-02 the report for 02/10 was not yet available (HTTP 401), so the next Focus comes out after the election.
  - The weekly report is usually released on the Monday after its data date. We did not fetch an official release timestamp.
- **BCB Relatório de Política Monetária, v.2 n.3, Sept 2026:**
  - PDF: `https://www.bcb.gov.br/content/ri/relatorioinflacao/202609/rpm202609p.pdf`
  - GDP 2026 revised from 2.0% to **1.8%**; 2027 = 1.4%. Tabela 1 projects household consumption for 2026 at 1.2% (previous RPM: 2.1%).
  - Information cutoff: the 281st Copom meeting (15–16/09/2026); Focus conditioning variables to 11/09/2026.
  - Release date 24/09/2026 (Thursday), from Agência Brasil coverage and the PDF creation date.
- **IMF WEO Update, July 2026:**
  - PDF: `https://www.imf.org/-/media/files/publications/weo/2026/update/july/english/text.pdf`
  - Table 1 gives Brazil 2026 = **2.4%** (+0.5 pp vs April) and 2027 = 2.2%.
  - The PDF metadata is dated 2026-07-06. The 08/07/2026 date comes from the title of the IMF press-briefing transcript; that page returned 403 and could not be fetched.
- **IMF WEO, April 2026:** 2026 = 1.9% (DataMapper). This has been superseded by the July update.
- **IMF WEO, October 2026:** not yet published; it is expected 13/10/2026.
- **IMF Article IV (PR 26/257, 23/07/2026):** not fetched (403), so it is not included.

## 3. Household consumption (`consumption.csv`)

- **Growth:** SIDRA 5932, v6563 in Q4, category 93404 ("Despesa de consumo das famílias"), same API call as GDP.
- **index_2010_100:** SIDRA table 1620 ("Série encadeada do índice de volume trimestral, base média 1995=100"), category 93404. We take the annual average of the 4 quarters and rebase to 2010 = 100.
  - API: `https://apisidra.ibge.gov.br/values/t/1620/n1/all/v/583/p/all/c11255/90707,93404`
  - Growth implied by the index (shown in `note`) matches v6563 to rounding.
- **2026 rows:**
  - `partial` = H1-2026 change: **1.1%**. Other 2026 figures from IBGE: Q2 y/y 0.5%; Q1 y/y 1.7%; 4-quarter accumulated 0.9%; Q2 vs Q1 seasonally adjusted −0.4%.
  - `projection` = BCB RPM Sept 2026, 1.2%. Its index value is illustrative only (2025 × 1.012). Focus does not survey consumption.
- **Cross-check:** RPM Tabela 1 gives 2024 = 5.1 and 2025 = 1.3.

## 4. Fiscal results, consolidated public sector (`fiscal.csv`, `fiscal_long.csv`)

**Source:** BCB SGS, "NFSP sem desvalorização cambial (% PIB) – Fluxo acumulado em 12 meses – Total – Setor público consolidado".
- Codes were verified by title in the BCB open-data catalogue (`https://dadosabertos.bcb.gov.br/api/3/action/package_search`):
  - **5793** = Resultado primário
  - **5727** = Resultado nominal
  - **5760** = Juros nominais
- API: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{5793|5727|5760}/dados?formato=json&dataInicial=01/01/2009`
- Annual value = December value of the 12-month flow, which equals the calendar year.
- Latest point: **Aug-2026** (12 months Sep-2025 to Aug-2026). It was published in the BCB Estatísticas Fiscais note of 30/09/2026; the 0.62% primary deficit matches press coverage.

**Signs:**
- In the raw NFSP data (columns `*_nfsp_raw`, `nfsp_raw_pct_gdp`), positive = deficit (borrowing requirement).
- `primary_pct_gdp`, `nominal_pct_gdp`, `interest_pct_gdp` and `result_pct_gdp` = −NFSP, so **surplus is positive and deficit is negative**. On this convention interest is negative (a cost), and nominal = primary + interest. This identity is checked for every row (tolerance 0.015 pp).

**Sanity checks:**
- 2014 primary −0.56 ✔
- 2022 +1.25 ✔
- 2023 −2.28 ✔
- 2020 primary −9.24 and nominal −13.34 vs the originally published ≈ −9.4 / −13.6: the difference is the denominator. BCB recomputes % of GDP with revised IBGE nominal GDP. We confirmed it: SGS 4649 (monthly primary, R$) summed over 2020 = R$ 702.95 bn, and IBGE 2020 nominal GDP (SIDRA 1846, sum of quarters) = R$ 7.61 tn, which gives 9.24%. 2014, 2022, 2023 and 2025 reproduce the same way.

**Caveats:**
- The "sem desvalorização cambial" concept excludes exchange-rate effects on FX-indexed debt.
- The perimeter excludes Petrobras, Eletrobras and the financial institutions.
- Ratios use BCB's 12-month nominal GDP estimate and are revised when GDP is revised.
- Monthly 12-month figures are volatile. For example, the primary deficit jumped from 0.41% (Feb-26) to 1.06% (Mar-26).
- For context only (not in the CSV): the Focus of 25/09/2026 expects 2026 primary −0.41% and nominal −8.90% of GDP.
