# -*- coding: utf-8 -*-
"""Agrega la bateria A124 (vecinos indeseados) de la IVS a nivel pais x estudio x ola.

Output:
  ivs_vecinos_largo.csv  : iso3,study,wave,year,cat,pct,n   (pelicula completa)
  ivs_vecinos_ultimo.csv : ultimo dato por pais x categoria (foto)
  ivs_vecinos_cats.csv   : metadata de categorias (labels ES/EN, core)
"""
import pandas as pd, numpy as np, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
df = pd.read_pickle(os.path.join(HERE, "ivs_subset.pkl"))

# ---- ISO3 desde S003 (ISO numeric); casos especiales: 826 GB(+GB-GBN)->GBR, 909 NIR, 915 XKS, 197 XNC
NUM2ISO3 = {8:"ALB",12:"DZA",20:"AND",31:"AZE",32:"ARG",36:"AUS",40:"AUT",50:"BGD",51:"ARM",56:"BEL",
68:"BOL",70:"BIH",76:"BRA",100:"BGR",104:"MMR",112:"BLR",124:"CAN",152:"CHL",156:"CHN",158:"TWN",
170:"COL",191:"HRV",196:"CYP",197:"XNC",203:"CZE",208:"DNK",214:"DOM",218:"ECU",222:"SLV",231:"ETH",
233:"EST",246:"FIN",250:"FRA",268:"GEO",275:"PSE",276:"DEU",288:"GHA",300:"GRC",320:"GTM",332:"HTI",
344:"HKG",348:"HUN",352:"ISL",356:"IND",360:"IDN",364:"IRN",368:"IRQ",372:"IRL",376:"ISR",380:"ITA",
392:"JPN",398:"KAZ",400:"JOR",404:"KEN",410:"KOR",414:"KWT",417:"KGZ",422:"LBN",428:"LVA",434:"LBY",
440:"LTU",442:"LUX",446:"MAC",458:"MYS",462:"MDV",466:"MLI",470:"MLT",484:"MEX",496:"MNG",498:"MDA",
499:"MNE",504:"MAR",528:"NLD",554:"NZL",558:"NIC",566:"NGA",578:"NOR",586:"PAK",604:"PER",608:"PHL",
616:"POL",620:"PRT",630:"PRI",634:"QAT",642:"ROU",643:"RUS",646:"RWA",682:"SAU",688:"SRB",702:"SGP",
703:"SVK",704:"VNM",705:"SVN",710:"ZAF",716:"ZWE",724:"ESP",752:"SWE",756:"CHE",762:"TJK",764:"THA",
780:"TTO",788:"TUN",792:"TUR",800:"UGA",804:"UKR",807:"MKD",818:"EGY",826:"GBR",834:"TZA",840:"USA",
854:"BFA",858:"URY",860:"UZB",862:"VEN",887:"YEM",894:"ZMB",909:"NIR",915:"XKS"}

CATS = {  # col -> (slug, label_es, label_en, core)
"A124_01":("antecedentes","Personas con antecedentes penales","People with a criminal record",1),
"A124_02":("otra_raza","Personas de otra raza","People of a different race",1),
"A124_03":("bebedores","Bebedores empedernidos","Heavy drinkers",1),
"A124_04":("inestables","Personas emocionalmente inestables","Emotionally unstable people",1),
"A124_05":("musulmanes","Musulmanes","Muslims",1),
"A124_06":("inmigrantes","Inmigrantes o trabajadores extranjeros","Immigrants / foreign workers",1),
"A124_07":("sida","Personas con sida","People who have AIDS",1),
"A124_08":("drogadictos","Drogadictos","Drug addicts",1),
"A124_09":("homosexuales","Homosexuales","Homosexuals",1),
"A124_10":("judios","Judíos","Jews",1),
"A124_11":("evangelistas","Evangelistas","Evangelists",0),
"A124_12":("otra_religion","Personas de otra religión","People of a different religion",1),
"A124_14":("minorias_militantes","Minorías militantes","Militant minority",0),
"A124_16":("otro_origen","Personas nacidas en otro país","People not from country of origin",0),
"A124_17":("gitanos","Gitanos","Gypsies",1),
"A124_18":("extremistas","Extremistas políticos","Political extremists",0),
"A124_19":("traficantes","Traficantes","Traffickers",0),
"A124_24":("cristianos","Cristianos","Christians",0),
"A124_26":("extrema_izquierda","Extremistas de izquierda","Left-wing extremists",0),
"A124_27":("extrema_derecha","Extremistas de derecha","Right-wing extremists",0),
"A124_28":("familias_numerosas","Familias numerosas","People with large families",0),
"A124_29":("hindues","Hindúes","Hindus",0),
"A124_30":("norteamericanos","Norteamericanos","North Americans",0),
"A124_34":("negros","Personas negras","Black people",0),
"A124_35":("blancos","Personas blancas","White people",0),
"A124_36":("personas_color","Personas de color","Coloured people",0),
"A124_37":("indios","Indios","Indians",0),
"A124_38":("kurdos","Kurdos y yazidíes","Kurds and Yazidis",0),
"A124_42":("parejas_no_casadas","Parejas que conviven sin casarse","Unmarried couples living together",1),
"A124_43":("otro_idioma","Personas que hablan otro idioma","People who speak a different language",1),
"A124_45":("sunies","Suníes","Sunnis",0),
"A124_46":("chiies","Chiíes","Shia",0),
"A124_47":("franceses","Franceses","French people",0),
"A124_48":("britanicos","Británicos","British people",0),
"A124_49":("iranies","Iraníes","Iranians",0),
"A124_50":("kuwaities","Kuwaitíes","Kuwaitis",0),
"A124_51":("turcos","Turcos","Turkish people",0),
"A124_52":("jordanos","Jordanos","Jordanians",0)}

df["iso3"] = df["S003"].map(NUM2ISO3)
assert df["iso3"].notna().all(), df.loc[df["iso3"].isna(),"S003"].unique()
df["study"] = df["S001"].map({1:"EVS",2:"WVS"})
df["w"] = pd.to_numeric(df["S017"], errors="coerce")
df.loc[~(df["w"] > 0), "w"] = np.nan

MIN_N = 200
rows = []
for (iso3, study, wave), g in df.groupby(["iso3","study","S002VS"]):
    year = int(g["S020"].median())
    for col, (slug, les, len_, core) in CATS.items():
        v = g[col]
        m = v.isin([0,1]) & g["w"].notna()
        n = int(m.sum())
        if n < MIN_N: continue
        pct = float(np.average(v[m], weights=g.loc[m,"w"]) * 100)
        rows.append((iso3, study, int(wave), year, slug, round(pct,1), n))

long = pd.DataFrame(rows, columns=["iso3","study","wave","year","cat","pct","n"])
long = long.sort_values(["iso3","cat","year","study"]).reset_index(drop=True)
long.to_csv(os.path.join(HERE,"ivs_vecinos_largo.csv"), index=False)

# foto: ultimo dato por pais x cat (si empatan year, preferir WVS por n? -> tomar mayor n)
last = (long.sort_values(["year","n"]).groupby(["iso3","cat"], as_index=False).tail(1)
        .sort_values(["cat","pct"]).reset_index(drop=True))
last.to_csv(os.path.join(HERE,"ivs_vecinos_ultimo.csv"), index=False)

cats_meta = pd.DataFrame([(s,c,les,len_,core) for c,(s,les,len_,core) in CATS.items()],
                         columns=["cat","ivs_var","label_es","label_en","core"])
cats_meta.to_csv(os.path.join(HERE,"ivs_vecinos_cats.csv"), index=False)

print(f"largo: {len(long)} filas | paises: {long.iso3.nunique()} | ultimo: {len(last)} filas")

# ================= DIAGNOSTICOS =================
LATAM = ["ARG","BOL","BRA","CHL","COL","DOM","ECU","SLV","GTM","HTI","MEX","NIC","PER","PRI","TTO","URY","VEN"]
CORE = [s for c,(s,_,_,k) in CATS.items() if k]

print("\n== puntos pais x ola por categoria core ==")
cov = long[long.cat.isin(CORE)].groupby(["cat","wave"]).size().unstack(fill_value=0)
print(cov.to_string())

print("\n== FOTO (ultimo dato, solo year>=2017) LatAm x categorias core ==")
foto = last[(last.year>=2017)]
lt = foto[foto.iso3.isin(LATAM) & foto.cat.isin(CORE)].pivot(index="iso3",columns="cat",values="pct")
print(lt.to_string())

for c in ["otra_raza","homosexuales","inmigrantes"]:
    sub = foto[foto.cat==c].sort_values("pct")
    print(f"\n== RANKING {c} (ultimo dato >=2017, {len(sub)} paises) ==")
    print("mas tolerantes:"); print(sub.head(12)[["iso3","year","pct"]].to_string(index=False))
    print("mas intolerantes:"); print(sub.tail(12)[["iso3","year","pct"]].to_string(index=False))
    if "ARG" in sub.iso3.values:
        r = sub.reset_index(drop=True); pos = r.index[r.iso3=="ARG"][0]+1
        print(f"ARG: puesto {pos}/{len(sub)} (de menor a mayor rechazo)")

print("\n== PELICULA Argentina (todas las categorias con serie) ==")
a = long[long.iso3=="ARG"].pivot_table(index="year",columns="cat",values="pct")
print(a.to_string())

print("\n== n de olas con dato de otra_raza por pais LatAm ==")
print(long[(long.cat=="otra_raza")&long.iso3.isin(LATAM)].groupby("iso3").size().to_string())
