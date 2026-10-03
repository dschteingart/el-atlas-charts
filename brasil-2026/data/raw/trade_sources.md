# Brazil–Argentina trade, sources for `trade_argentina.csv`

Retrieved 2026-10-02.

## Source

Comex Stat, MDIC/SECEX (Brazil). Official API: `POST https://api-comexstat.mdic.gov.br/general?language=pt`.

- **Last update:** `GET https://api-comexstat.mdic.gov.br/general/dates/updated` returned `{"updated":"2026-09-04","year":"2026","monthNumber":"08"}`. Data therefore runs **through August 2026**.
- **Argentina's country code:** `063`, from the country table `GET https://api-comexstat.mdic.gov.br/tables/countries`. It must be passed as the string `"063"`. The integer `63` returns an empty list.
- **Queries used** (metric `metricFOB`, US$ FOB, current dollars, `monthDetail:false`):
  1. export and import, `details:["country"]`, no filter, period 2010-01 → 2026-12. This returns 2010–2025 full years plus 2026 = Jan–Aug, the latest month available.
  2. export and import, `details:["country"]`, period 2025-01 → 2025-08. Used for the same-months comparison.
  3. export and import with no `details`, 2010–2026. Used as a cross-check: the sum over countries equals the national total exactly, with difference 0, for every year.
  4. Argentina monthly, 2025-01 → 2026-08. Used to confirm the months present: 2026 has months 01–08.
- Raw JSON responses and scripts are in `violence_trade_api_dumps/`.

## Definitions

- **Exports:** Brazil's exports by country of destination. **Imports:** by country of origin. Both in US$ FOB.
- `total_bilateral_usd` = exports + imports. `balance_usd` = exports − imports, from Brazil's point of view. A positive value is a Brazilian surplus.
- `br_total_exp_usd` / `br_total_imp_usd` = Brazil's totals with the world, including the non-country lines "A Designar", "Bancos Centrais" and "Provisão de Navios e Aeronaves".
- `share_*_pct` = Argentina ÷ Brazil total × 100. `share_total_pct` uses (exp + imp) ÷ (total exp + total imp).
- `arg_rank_total` = Argentina's rank among partners by exp + imp, after excluding the three non-country lines above. Each partner is counted individually: the EU is not a bloc, and China excludes Hong Kong, Macau and Taiwan. The extra columns `arg_rank_exp` and `arg_rank_imp` give the rank by flow.
- `type`: `full` = calendar year; `partial` = Jan–Aug. There are two partial rows: "ene–ago 2025" and "ene–ago 2026".

## Context file

`trade_partners_context.csv` holds China, the United States and Argentina per year: exports, imports, total, share of Brazil's total trade and rank. It also has one row per year listing the top 5 partners. **Argentina ranks 3rd by total trade in every year from 2010 to 2025 and in Jan–Aug 2026**, behind China (1st) and the US (2nd).

## Key checks

- Bilateral trade peaked at **US$ 39.61 bn in 2011**. Argentina's share of Brazil's total trade fell from 8.58% (2010) and 8.22% (2011) to 4.94% (2025) and 4.23% (Jan–Aug 2026).
- Jan–Aug 2026 vs Jan–Aug 2025:
  - exports to Argentina −17.5% (10.23 vs 12.40 bn)
  - imports from Argentina +4.2% (8.65 vs 8.29 bn)
  - bilateral total −8.8% (18.87 vs 20.69 bn)
  - Brazil's total exports +10.3% and total imports +6.1% over the same period.

## Caveats

- Comex Stat figures are revised. 2026 months, and to a lesser extent 2025, may change slightly in later releases.
- Values are nominal US$ and are not adjusted for inflation.
- Argentina's own figures (INDEC) will differ because of FOB/CIF valuation, timing and partner attribution. Do not mix the two sources.
