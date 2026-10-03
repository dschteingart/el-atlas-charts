# Brazil 2026 presidential polls: sources, method and checks

Compiled on 2026-10-03, early afternoon Brasília time, the day before the first round. Every value comes from a page that was fetched during this compilation. No figures were filled in from memory.

## Files

| File | Rows | Content |
|---|---|---|
| `polls_first_round.csv` | 112 polls | 1st round, stimulated (estimulada) vote, % of **total** respondents, one scenario per poll |
| `polls_second_round.csv` | 109 polls | Lula vs Flávio Bolsonaro head-to-head, % of total respondents |
| `polls_first_round_valid_votes.csv` | 4 polls | Final-week 1st-round valid votes (votos válidos), where a fetched source published them |

All three files cover field dates from 2025-12-02 through 2026-10-02.

Columns beyond the requested ones (appended at the end):

- `pollster_label`: the label as published, including the sponsor (Genial/Quaest, CNT/MDA, PoderData/Aya, Meio/Ideia, Apex/Futura, BTG/Nexus, Ipsos-Ipec). Use `pollster` to filter.
- `blank_null_undecided`: blank/null/none plus undecided combined. pt.wikipedia publishes this only as a single combined column, and some pollsters (AtlasIntel in its 2nd round, for example) report only the combined figure. It is filled for every poll. `blank_null` and `undecided` are filled only where a fetched source gave both figures separately: 1st round 75/112, 2nd round 57/109.
- `verification`: how each row was checked (see below).

Conventions:

- Percentages are numbers (`42.0` means 42%).
- Empty cells mean the figure was not reported or the candidate was not tested.
- Values the source gave as "<1%" or "<0.5%" are left blank. They are excluded from `others_total`, and the row's `scenario_note` says so.
- `others_total` is the sum of every other named candidate in the chosen scenario plus any "outros" bucket. This includes non-final names such as Ratinho Jr., Tarcísio, Marçal or Rebelo when the scenario contains them.
- `publication_date` is the release date registered at the TSE (DT_DIVULGACAO, from PesqEle). It matched the publication date of the cited articles in every case checked. For Dec-2025 polls, which had no registration, it is the date of the cited article.
- `method` is taken from the TSE registration text:
  - presencial: face-to-face, at home or at flow points.
  - telefone: CATI or automated calls.
  - online: AtlasIntel's web "RDR" collection.
  - telefone+online: Real Time Big Data from July 2026 ("abordagens telefônicas e digitais").
- Real Time Big Data registered its Feb–Jun 2026 polls as "entrevistas pessoais", so those rows read presencial, as registered.
- Dec-2025 polls have no TSE registration. Their method is the pollster's standard: Ipec (face to face) and AtlasIntel (internet) are confirmed in their sources, Datafolha, Quaest, Paraná Pesquisas and Futura are inferred, and Real Time Big Data's Dec-2025 method is left blank.
- `tse_registration` is filled for 105/112 1st-round and 103/109 2nd-round rows. Every 2026 poll has one. The 7 Dec-2025 rows (6 in the 2nd round) have none because registration was not required before 1 Jan 2026.

## Sources and pipeline

1. **pt.wikipedia, primary table.** The article is "Pesquisas de opinião para a eleição presidencial no Brasil em 2026". The title "Pesquisas eleitorais para…" returns 404. The revision used was last edited 2026-10-03 16:05 UTC. The HTML tables were parsed with rowspan/colspan expansion and headers were mapped per table, because candidate column order changes from month to month. The tables used:
   - 1st round: "Outubro" back to "Novembro–Dezembro (2025)".
   - 2nd round: "Lula e Flávio Bolsonaro", for 2026 and 2025.
   - Footnotes were also read. They identify the Marçal and Ciro Gomes "Outros" entries.
2. **en.wikipedia, automatic cross-check.** The article is "Opinion polling for the 2026 Brazilian presidential election". Every selected poll was matched on pollster and end date (±1 day) and the Lula/Flávio values were compared. In the 1st round, 104 polls matched exactly, 4 did not (Quaest Jan, Quaest Dec, AtlasIntel Apr, Ideia Mar; all resolved below) and 4 were not on en.wikipedia. In the 2nd round, 103 matched, 2 did not (PoderData 30 Aug–2 Sep, Ideia Mar; resolved below) and 4 were not on en.wikipedia. Its citation URLs were also added as extra sources to fetch.
3. **TSE PesqEle open data.** `pesquisa_eleitoral_2026.zip` came from dadosabertos.tse.jus.br and was generated 2026-10-03 05:46. Of 1,290 presidential registrations, the national ones were kept, meaning those whose methodology names Brazil and no single state. Each poll was matched on company, start and end dates (±3 days) and sample size. This gives `tse_registration`, `publication_date` and `method`.
   - Where an article quotes a protocol number, it agrees with the match in every case except one CNN error (Futura, Jan, below).
   - Matches flagged "approx" in `verification` differ from the registration only by a few interviews or by one day of field. AtlasIntel and Nexus, for example, register 5,000 and 2,000 and report 5,005 and 2,003.
4. **Source articles.** The cited pages were fetched with urllib, which uses the Windows certificate store. 114 of 122 URLs were retrieved. The 8 failures were noticias.uol.com.br pages returning HTTP 403, and WebFetch is blocked there too; en.wikipedia's alternative URLs covered most of those polls. A script then:
   - found the Lula and Flávio numbers next to each other in the article text, which worked for 100/112 1st-round and 97/109 2nd-round polls;
   - read blank/null and undecided from the same block, accepting them only if their sum matched the combined value within 1 point;
   - read any "BR-xxxxx/2026" protocol cited.

   Discrepancies and unmatched rows were then checked by hand against the article text (list below).

## Pollsters included and excluded

The pollsters below are included. Each is matched to its TSE company name.

| Pollster | TSE company |
|---|---|
| Datafolha | Datafolha Instituto de Pesquisas |
| Quaest | Quaest Pesquisas |
| AtlasIntel | AtlasIntel Tecnologia de Dados |
| Ipec | Inteligência em Pesquisa e Consultoria |
| MDA | MDA Pesquisa |
| PoderData | PoderData |
| Paraná Pesquisas | Instituto Paraná de Pesquisas |
| Ideia | Boas Ideias |
| Real Time Big Data | Real Time Mídia |
| Futura | 100% Cidades Participações; brand Futura/Apex |
| Nexus | Nexus Pesquisa e Inteligência de Dados; BTG Pactual; added as an established fortnightly national pollster |

- **Ipec:** the only national presidential poll in the period is Ipsos-Ipec, 4–8 Dec 2025. The 2026 TSE registry lists only four 800-interview local polls for Ipec and no national one.
- **Ipespe:** no national presidential poll in the period. Its 2026 registrations cover only São Paulo and Pernambuco, so it has no rows.
- **Paraná Pesquisas:** the last national poll is 25–28 Mar 2026. Its later registrations are state polls.

Excluded as smaller, newer or one-off institutes, though all appear on Wikipedia: Gerp, Veritá, Palver, Vox / Vox Brasil, Indexa (Indexa/Broadcast), Alfa Inteligência (Alfa/TMC), DataTrends, American Analytics, Vetor/Arrow, IFP and Data Povo. Adding any of them back only needs a change to the pollster map in the build script.

## Scenario rule for the 1st round

For each poll, the scenario closest to the real ballot was picked. Lula and Flávio had to be present. The scoring was:

- +10 for each of Caiado, Zema, Renan Santos and Cury present.
- −10 for each major non-candidate: Tarcísio, Ratinho Jr., Eduardo Leite, Michelle, Eduardo or Jair Bolsonaro, Haddad, Ciro Gomes.
- −1 for each minor non-candidate: Rebelo, Aécio, Daciolo, Joaquim Barbosa, Marçal, Tereza Cristina.
- Ties went first to the scenario with Ratinho Jr., who was PSD's front-runner before Caiado was chosen on 30 Mar 2026, and then to the scenario with more names.

`scenario_note` records which scenario was used (n of N), its candidate list, any non-final names and the candidates not tested.

In late Aug and Sep, Datafolha, Quaest and Nexus published two scenarios, with and without Pablo Marçal. The **without-Marçal** scenario was used, since Marçal was ineligible. AtlasIntel (25–30 Aug) and PoderData (23–26 Aug, 30 Aug–2 Sep) published only scenarios with Marçal; his share is in `others_total`.

## Spot-checks of the latest polls (pollster release or major outlet)

| Poll | Checked against | Result |
|---|---|---|
| Datafolha 28 Sep–1 Oct (BR-08039/2026) | Gazeta do Povo full tables; Folha headline | Matches: 42/38, Cury 4, Caiado 3, Renan 3, Zema 1, Samara 1, Grassi 1; blank 5, undecided 2; 2nd round 48/45 (6/1); valid votes 45/40. **pt.wikipedia's 2nd-round table had n=2,002; the correct n is 2,506** (fixed). |
| Datafolha 22–24 Sep (BR-00304/2026) | g1 | Matches: 40/36/Cury 5/Caiado 4/Renan 3/Zema 1, blank 5, undecided 2; 2nd round 47/45. Published figures sum to 97. g1 gives field dates 22–23 Sep, the TSE registration 22–24. |
| Quaest 24–27 Sep (BR-06520/2026) | g1 | Matches: 39/34, Caiado 4, Cury 4, Renan 3, Zema 1, blank 10, undecided 5; 2nd round 42/42 (13/3). |
| Quaest 17–20 Sep (BR-06004/2026) | g1 | Matches (37/33; blank 7, undecided 8; 2nd round 41/42). |
| AtlasIntel 23–28 Sep (BR-04391/2026) | Poder360 | Matches: 45.3/42.2, Renan 5.2, Cury 2.0, Caiado 1.8, Zema 0.9, others 0.5, blank 0.9, undecided 1.2; 2nd round 47.6/47.7. CartaCapital (30 Sep) prints Lula **45.9** for this round; UOL, Poder360 and both Wikipedias give 45.3, so it is treated as a CartaCapital typo. |
| AtlasIntel 17–22 Sep (BR-04739/2026) | Gazeta do Povo; Brasil 247 | Matches (45.8/43.4, blank 0.7, undecided 0.5; 2nd round 47.7/47.4). |
| Ipec 4–8 Dec 2025 (the only one in the period) | ipsos.com release, 10 Dec 2025 | Matches: Lula 38 / Flávio 19, 2,000 face-to-face interviews; blank 17, undecided 6 from news source. |
| MDA 30 Sep–2 Oct (BR-04756/2026) | Exame | 43.1/38.0, Caiado 3.0, Renan 1.5, Zema 0.8; **Cury 3.2, pt.wikipedia had 3.1** (fixed); blank 5.0, undecided 4.7; 2nd round 47.3/43.1. |
| PoderData 30 Sep–2 Oct (BR-03519/2026) | Poder360 | Matches: 42/41, Cury 3, Renan 3, Caiado 2, Zema 1, Pimenta 1, blank 4, undecided 2; 2nd round 46/46 (7/1). |

## Discrepancies found and corrections applied (source text wins)

- **Quaest 8–11 Jan 2026:** the pt.wikipedia row was garbled (it summed to 112). The data now use scenario 2 ("sem Tarcísio") from CNN Brasil and g1: 35/26, Ratinho 9, Caiado 4, Zema 3, Rebelo 2, Renan 1, blank 12, undecided 8.
- **AtlasIntel 22–27 Apr:** pt had Lula 46.7 and Cury 1.0. CNN Brasil gives 46.6 and 1.1, plus blank 0.5 and undecided 0.1.
- **AtlasIntel 10–15 Dec 2025:** pt had sample 8,154. CartaCapital and en.wikipedia give **18,154**.
- **Futura 25–29 Sep:** pt had Renan 3.4. CNN Brasil gives 3.2, and en.wikipedia agrees.
- **Ideia 1–5 May:** pt omitted Ciro Gomes, 2.3% per CNN Brasil (the row summed to 97.7). He was added to `others_total`.
- **Ideia 3–6 Jul:** pt had sample 2,000. Poder360 and TSE (BR-05628/2026) give **1,500**.
- **Ideia, April 2nd round:** pt dated it "3 Mar–7 Abr". The correct dates are 3–7 Apr.
- **Real Time Big Data 2–4 May:** pt's combined blank+undecided was 9. The source gives blank/null 6 and NS/NR 5, so 11.
- **Futura 19–23 Sep, 2nd round:** pt's combined figure was 11.2. CNN Brasil gives blank/null/none 5.6 and undecided 1.3, so 6.9.
- **PoderData 30 Aug–2 Sep, 2nd round:** pt had Lula 45 / Flávio 46. Poder360 gives **Flávio 45, Lula 44**, and en.wikipedia agrees.
- **Futura 15–19 Jan:** CNN quotes protocol BR-03024/2026, which is a Futura São Paulo state poll. Poder360 and the registry give **BR-08233/2026**.
- **Ideia 6–10 Mar:** Poder360 reports rounded figures, 40/35 in the 1st round and 47/45 in the 2nd. en.wikipedia lists 40.3/35.0 and 47.4/45.3 from the pollster PDF. The PDF is image-only, so that could not be verified and the rounded values were kept.
- **Nexus 18–20 Sep:** sample is 2,000 on pt.wikipedia and in the TSE registration, 2,006 on en.wikipedia. The UOL source was blocked, so 2,000 was kept.
- **Rows whose published figures do not sum to 100:** these are reproduced as published. Datafolha 8–11 Sep (103), 22–24 Sep (97) and 12–14 May (105) all match the source articles.

Rows whose figures could not be found in fetched article text are marked "figures not found…" in `verification`. They rely on pt.wikipedia, and pt and en.wikipedia agree on every one of them (the AtlasIntel December sample size was corrected separately, above).

- 1st round (7): Ideia 25–28 Sep (UOL source blocked), Futura 7–11 Jul, Futura 4–8 May, Nexus 27–29 Mar, Datafolha 3–5 Mar, Paraná Pesquisas 22–25 Feb, Ideia 30 Jan–2 Feb.
- 2nd round (8): Ideia 25–28 Sep, Nexus 18–20 Sep, Futura 15–20 May, Nexus 27–29 Mar, Real Time Big Data 28 Feb–2 Mar, Ideia 30 Jan–2 Feb, Futura 15–19 Jan, AtlasIntel 10–15 Dec 2025.

## Caveats for the chart

- **Final Oct 3 polls not yet released at compile time.** They are registered but not included:
  - Datafolha BR-01708/2026: fieldwork 3 Oct, n=4,006, release about 18:45.
  - Quaest BR-02197/2026: 2–3 Oct, n=3,702, evening release.
  - AtlasIntel BR-00999/2026: 27 Sep–2 Oct, n=5,000.
  - Futura BR-02431/2026: 29 Sep–3 Oct, n=2,000.

  Datafolha and Quaest usually publish votos válidos too; add them to the valid-votes file when they are out.
- **Early scenarios are not like-for-like.**
  - Dec 2025–Mar 2026 (26 polls): 11 of the chosen scenarios include a non-candidate (Ratinho Jr., Tarcísio, Leite, Ciro Gomes or Tereza Cristina). Augusto Cury was not tested until April and is blank in 30 rows, the last on 27 May.
  - Paraná Pesquisas, Dec 2025: its only Flávio scenario omits Caiado and includes Ratinho, Ciro Gomes and Tereza Cristina.
  - Datafolha 2–4 Dec 2025 was in the field before Flávio's launch on 5 Dec.
  - Flávio is in every row; no included poll lacks a Flávio scenario.
- **Mode effects.** AtlasIntel (online) reports almost no undecided (blank+undecided 0.3–4%), while Quaest (face to face) reports 15–22%. Lula and Flávio levels are therefore not directly comparable across pollsters on a %-of-total basis.
- **Withdrawn and ineligible names.** Leonardo Avalanche (PRTB) withdrew on 30 Sep and appears with about 0% in late-September polls. Pablo Marçal's scenarios were avoided where possible.
- **AtlasIntel second-round blanks.** AtlasIntel reports blank/null/"don't know" only combined in the 2nd round, so `blank_null` and `undecided` are empty for those rows.
