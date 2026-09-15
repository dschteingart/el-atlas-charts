# Methodological note — The Atlas pantheon

*This note documents where the issue's data comes from, what adjustments we made to
Pantheon's fame index and why. It is written for any reader. The formal details
(formulas and parameters) are in the technical appendix at the end.*

---

## 1. The source data

The source is [Pantheon](https://pantheon.world), a project born at the MIT Media Lab
under the direction of Chilean physicist César Hidalgo and developed today by the
company Datawheel. Its idea is to use Wikipedia as a thermometer of collective memory.
Wikipedia exists in hundreds of languages and each language version is called an
"edition". Pantheon considers a person globally memorable when their biography exists in
at least 15 editions.

For each of those people, Pantheon records where and when they were born and what they
did, and computes a historical popularity index, the **HPI**, which sums up in a single
number how present that figure is in the world's memory. The index combines four
ingredients.

| Ingredient | What it measures |
|---|---|
| Editions (L) | In how many languages the biography exists |
| Effective editions (L\*) | How many languages really count, discounting those that contribute a marginal share of the reading |
| Non-English pageviews (v) | How many people read the biography, excluding the English Wikipedia |
| Coefficient of variation (CV) | How even that readership is across languages. The more even, the higher the score |

An age correction is then applied, rewarding figures whose fame survived centuries and
penalising recent ones, which have yet to prove they will last. The result is rescaled
from 0 to 100.

We start from the 2025 update of Pantheon's public file, with **126,582 figures** and no
duplicates. From it we take the universe of people, their occupations and their places
of birth. What we do not take is the fame score, and the rest of this note explains why
and what we replaced it with.

## 2. Three adjustments to the original index

The HPI was designed in 2014 to rank historical figures, and for that it works
reasonably well. Reviewing the index, however, we found three points worth adjusting.
The common thread is that counting how many Wikipedias someone appears in is not the
same as measuring how many people remember them. Each section first states what we
observed and then the decision we took.

### 2.1. Edition counts can be inflated; readership cannot

**What we observed.** In Pantheon's raw file, the country with the most famous
footballers in history is neither Brazil nor England but **Japan**, with 4,132
footballers, two and a half times Brazil's 1,642. The explanation is not footballing. On
Wikipedia there are automated programs, "bots", that generate articles in bulk from
lists. Taking the roster of players who went through the Japanese league, a bot can
create for each of them a one or two line article in dozens of languages. Each of those
articles adds one more edition, even if nobody reads it.

The clearest case is **Takashi Kasahara**, an amateur Japanese footballer from the 1930s
with a biography in 49 languages, almost all of them a single paragraph long. Under the
published HPI, Kasahara comes out as the 59th footballer of all time, ahead of Neymar,
Mbappé, Modrić, Salah and Iniesta. Counting actual readership, he does not appear among
the 30,000 most-read figures in the base.

**Our decision.** We do not use the edition count as the main input. We downloaded from
Pantheon's platform, figure by figure, the pageviews each one receives in every language
and every month since July 2015, and built the index on that readership.

### 2.2. The evenness measure can reward barely-read figures

**What we observed.** To tell fame spread across languages from fame concentrated in a
single one, the HPI uses the coefficient of variation, a statistical measure of how
uneven the pageviews are. The more even, the higher the score. The measure captures
relative dispersion without looking at volume, and at the extremes that produces
counterintuitive results. Italian athlete **Luca Beccaro**, with 73 non-English
pageviews a year spread evenly, gets an almost perfect coefficient of 0.007. **Lionel
Messi**, with 6.6 million non-English pageviews, very uneven across languages and
spiking at every World Cup, gets 5.5. Taylor Swift gets 7.7. The diversity metric sometimes
ends up favouring someone almost nobody reads over the most-read people on the planet,
precisely because mass fame is often uneven.

**Our decision.** We replaced evenness with an absolute threshold. We count in how many
languages the figure clears a readership floor (1,000 and 10,000 pageviews). Being
genuinely read in many languages counts as diversity; being barely read evenly does not.

### 2.3. The age correction is very strong for the twentieth century

**What we observed.** Correcting for age is necessary. Without that correction, any
index of historical memory would be dominated by the latest viral figure, and a recent
career has not yet proved it will be remembered. The strength of the correction,
however, heavily conditions the result once you reach the twentieth century. Under the
published HPI, Messi ranks 3,638th in the world and is only the fourth Argentine
athlete, behind Maradona, Di Stéfano and Fangio. In Argentina and around the world
people have long argued whether the best footballer in history was Maradona or Messi,
but nobody would claim that Di Stéfano or Fangio are more remembered athletes than they
are.

**Our decision.** We kept the age correction with a lower strength and we make the
parameter that governs it explicit, so that anyone can assess its effect (§4).

## 3. The cleaned base

With the pageviews by language and month already downloaded, the first step was to
define which figures get in. The criterion is the following.

> **A figure enters the base if it is read in at least 2 languages with at least 1,000
> pageviews accumulated since 2015.**

The filter leaves out 9,313 figures, 7.4% of the file. Another 950 or so lack the
minimum data to compute the index, missing either occupation or year of birth. The final
base we use in the issue contains **116,319 figures**.

The threshold was calibrated by manually reviewing the borderline cases, and the test
were figures with enormous but regionally concentrated fame. Vallenato singer **Diomedes
Díaz**, a massive idol in Colombia, and epidemiologist **Zhong Nanshan**, the public face
of China's pandemic response, had to stay in, and they do, because their fame spills
beyond their own language even though it is concentrated. What stays out are profiles
read in a single Wikipedia and those read in none.

The most visible aggregate effect is the expected one. **Japan loses 47.8% of its
figures**, which are those of the Japanese league and the bot-created articles. No other
country loses a comparable share.

## 4. The fame index

On the cleaned base we compute a score that ranks figures by their presence in global
memory. The logic is that a figure is globally famous if it is read a lot, in many
languages and in a sustained way over time, and that such fame is worth more the longer
it has survived. The score multiplies three pieces.

1. **Breadth (languages).** Two things that weigh the same: in how many languages the
   biography exists and in how many it is genuinely read, with more than 10,000
   pageviews a year. It replaces the coefficient of variation (§2.2).
2. **Intensity (readership).** How much it is read outside English, measured over the
   last year, the full decade and the typical month. That last term is the monthly
   median, the value of the middle month, which is not dragged by a one-off news spike
   such as a death, a scandal or a World Cup.
3. **Permanence (age).** A gentle reward growing with the years since birth, plus a
   penalty that only reaches figures under 40 years old.

The resulting score is rescaled from 0 to 100, assigning 100 to the highest figure in
the base. Under our criteria that figure is Aristotle, and under Pantheon's it is
Muhammad. The value at the top carries no substantive reading, since it is merely the
unit of the scale.

Five design decisions are worth making explicit.

**English is excluded from the readership.** The English Wikipedia is so dominant, and is
consulted by people all over the world on any subject, that inside the count it would
mask the signal of fame in many languages. The criterion was already in Pantheon's
original index and we kept it.

**Breadth and intensity are combined with a demanding average.** Between the two we use
the geometric mean, an average that is high only if both its terms are high. If one is
near zero the result collapses, unlike the ordinary average, where a large term
compensates for a small one. That way it is not enough to be in 50 Wikipedias nobody
reads, nor to be huge in a single one. The same rule applies inside intensity, among the
three readership measures.

**Inside breadth, by contrast, the average is the ordinary one.** There the two terms are
added and divided by two. The reason is that the second term (languages with more than
10,000 pageviews a year) is zero for 58.9% of the base, and with a demanding average that
zero would sink the index for half the base until it became indistinguishable. With the
ordinary average, that term still adds when it exists without acting as a switch when it
does not.

**The variables enter on a logarithmic scale.** It is a scale that compresses very large
differences, so that going from 1,000 to 10,000 pageviews weighs the same as going from
100,000 to 1,000,000. Without that compression, a handful of megastars would dominate
the whole index.

**The age correction is recalibrated and reported here.** The parameter governing it is
the cut-off below which a figure is considered too recent, and it is the decision that
moves living figures the most. With the cut-off at 40 years, Messi ranks 141st in the
world and first among Argentine athletes. With the cut-off at 50 he would fall to 384th,
and at 70, to 1,231st. We chose 40 because it is the point where undisputed living icons
rank reasonably without the index filling up with celebrities of the last decade. It is
worth clarifying that the parameter excludes nobody, it only alters the order, and that
the issue's aggregate results barely depend on that choice. Measuring each region's fame
as the sum of its figures' scores, Latin America accounts for 6.1% of world fame with
the cut-off at 40 years, 6.0% at 50 and 5.9% at 70.

### What changes in practice

We compared the two rankings over the same 116,319 figures. The correlation between them
is 0.63, on a scale where 1 means identical rankings and 0 no relationship at all. That
is, the two broadly agree and part ways at the edges, which is where the cases in the
previous sections live. The typical movements are these.

| Under the published HPI | With actual readership |
|---|---|
| Nobel-winning physicists from a century ago, with dozens of very short editions and no readers (E. V. Appleton, rank 586; C. T. R. Wilson, 766) | fall to ranks between 20,000 and 35,000 |
| Present-day stars read massively in dozens of languages (Katy Perry and LeBron James, between ranks 20,000 and 26,000) | rise into the top 1,000 |
| Messi, rank 3,638, fourth Argentine athlete | rank 141, first Argentine athlete |

## 5. Fields and occupations

Each figure's **occupations** (footballer, physicist, poet) are Pantheon's and we do not
modify them. The **6 fields** we group them into (Sport; Arts and entertainment; Science
and technology; Humanities; Power and public figures; Business and exploration) are a
grouping of our own, equivalent to what Pantheon calls domains.

The decision has one practical reason and one editorial one. The practical one is that
the 2025 public file we downloaded does not include the domain column, unlike the
original version of the dataset. The current version's domains can be reconstructed from
Pantheon's site, so adopting them was possible. The editorial one is that they were not
the most useful for this issue. The official taxonomy was designed in 2014 and does not
cover 20 occupations added later, which hold 4,972 figures, and some of its categories
end up too small to read in a chart, such as Exploration, with 0.9% of the base, or
Business and Law, with 1.0%.

Relative to the original grouping, 17 occupations change field, affecting 3,112 figures,
2.7% of the base. The social sciences move to Humanities, show business to Arts and
entertainment, astronauts to Science and technology, and journalists and lawyers to
Power and public figures. As a robustness check we computed Latin America's share of
world science under both groupings, and it comes out at 1.0% in both cases, so the
issue's findings do not depend on the chosen taxonomy.

## 6. Country, region and place of birth

Each figure is assigned to the **place where they were born, translated into today's
borders**, which is Pantheon's criterion. Julius Caesar counts for Italy and Freud for
Czechia, and the kings of the old Korean dynasties born north of the 38th parallel count
for North Korea. We do not arbitrate disputed births case by case; we respect the
source's assignment, which is why Charlemagne stays in Germany via Aachen. It is worth
clarifying that having been born in a country does not imply having built a career
there.

Pantheon leaves **4,983 figures without a country** in the base, mostly ancient, biblical
or born in kingdoms that no longer exist. We recovered 2,735 of them, 55%, with two
sources. Wikidata, the structured database that is Wikipedia's sibling and the source of
each person's factbox data, and the coordinates of the birthplace crossed with current
maps. When Wikidata explicitly states which country the place is in, that statement takes
priority over our map crossing, which at borders can be off by metres.

The issue's **10 regions** are The Atlas taxonomy we used in issue No. 1, with one
editorial adjustment, which is counting Puerto Rico within Latin America.

## 7. Other corrections to the base

**Spanish names.** The labels come from Wikidata, which any user can edit and which
shows occasional vandalism. We found figures with insults inserted into their names, such
as Spanish physicist and politician Pablo Echenique, with other people's nicknames, such
as "Daniel Ortega (bachi)", or outright with the name of a fictional character, since
actor Norman Reedus appeared as "DARYL DIXON". We applied an automatic clean-up of the
typical vandalism patterns plus a manually reviewed correction table, which takes
priority over the automatic sources in audited cases.

**Gender.** The field in Pantheon's file contains errors, among them René Favaloro,
recorded as a woman. We re-collected it for the whole base from Wikidata, with 2,712
corrections.

**City of birth.** Also re-collected from Wikidata, with labels in Spanish and English.

## 8. Limitations

Wikipedia is not a neutral record of history. It reflects which people were most
documented, digitised and translated by communities of editors that are very unequal
across countries and languages. The index measures contemporary global memory, with
readership from 2015 to 2025, not talent or merit, which is why genocidaires and drug
lords score high.

Our own decisions add two limits. By excluding English from the readership, a figure
whose fame is almost exclusively English-speaking is under-represented. By assigning
figures to their birthplace, a country appears as the origin of people whose careers may
have unfolded entirely elsewhere.

## 9. Transparency and reproducibility

Everything needed to rebuild the issue is published.

- **The pipeline**, which includes downloading pageviews by language and month, the entry
  filter, the computation of the index and the export of each chart, lives in
  [`data-sources/`](https://github.com/dschteingart/el-atlas-charts/tree/main/05-pantheon/data-sources).
- **The final dataset**, [`pantheon_corregido.csv`](https://raw.githubusercontent.com/dschteingart/el-atlas-charts/main/05-pantheon/data-sources/pantheon_corregido.csv) (23 MB), carries one row per figure with
  its inputs, the three components of the index and the score. The
  [data dictionary](https://github.com/dschteingart/el-atlas-charts/blob/main/05-pantheon/data-sources/DATOS.md) describes every column, and the parameter file next to it records
  the values the index was computed with.
- **The [index lab](fame-lab.html?lang=en)** lets anyone move every parameter and watch
  the ranking change. Its "Published" preset reproduces the issue's dataset exactly, so
  it can be used to measure how much of each result depends on the decisions described
  here.

Anyone who prefers a different criterion can change the parameter, rebuild the index and
compare.

---

## Technical appendix

**Index formula.** For each figure in the cleaned base, with pageviews measured outside
English between July 2015 and 2025:

```
norm(x)     = log(1+x) / max[ log(1+x) ]        (each variable, normalised to [0,1])

Languages   = ( norm(total languages) + norm(languages with ≥10,000 views/year) ) / 2
Views       = ( norm(views 12 months) · norm(all-time views) · norm(monthly median) )^(1/3)
Base        = ( Languages · Views )^(1/2)

A           = 2025 − year of birth   (minimum 1)
raw         = log₄(A) − max( 0 , (T − A) / 7 )   with T = 40
Age×        = 0.5 + 0.5 · (raw − min) / (max − min)

Score       = Base · Age× , rescaled so that the maximum of the base is 100
```

The geometric mean is used where there are no structural zeros, that is inside `Views`
and between `Languages` and `Views`. Inside `Languages` the average is arithmetic, with
equal weights, for the reason explained in §4: 58.9% of the base has 0 languages with
10,000 or more yearly views, and in a geometric mean that zero would wipe out the index
for half the base.

**Published parameters.** Age cut-off T of 40 years; floor of the age correction 0.5;
weights of the age reward and penalty both equal to 1; reference year 2025. They are
written in a parameter file alongside the dataset.

**Entry filter.** At least 2 languages with at least 1,000 pageviews accumulated since
July 2015. Of the 2025 file, which holds 126,582 figures with no duplicates, 9,313 fail
the filter and some 950 have no occupation or year of birth on record, leaving the final
base at 116,319.

**On the 15-edition criterion.** It is Pantheon's design threshold, and in the 2025 file
93.5% of figures meet it according to the file's own count. We do not use it as a filter,
since ours is based on readership rather than editions.

**On Pantheon's HPI.** The public file exposes the index's four inputs (L, L\*, v and
CV), each figure's age and the resulting index, both on its original scale and rescaled
from 0 to 100, but not the exact implementation that combines them in the 2025 version.
The combinations documented for version 1.0 reproduce the order of the published index
with a correlation of 0.77, not enough to present a closed formula here. That is why §1
describes the ingredients and refers to the original documentation.

**References.** Yu, A. Z., Ronen, S., Hu, K., Lu, T. and Hidalgo, C. A. (2016), "Pantheon
1.0, a manually verified dataset of globally famous biographies", *Scientific Data* 3,
150075. The current version of the project and the description of its HPI are at
[pantheon.world](https://pantheon.world).
