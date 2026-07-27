import pyreadstat, pandas as pd, numpy as np, os, time

DTA = r"C:\Users\FUNDAR\Documents\MEGAsync\FUNDAR\Argentina en datos\Bases\World Values Survey\IVS\Integrated_values_surveys_1981-2022.dta"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ivs_subset.pkl")

NEIGH = ["A124_01","A124_02","A124_03","A124_04","A124_05","A124_06","A124_07","A124_08",
         "A124_09","A124_10","A124_11","A124_12","A124_14","A124_16","A124_17","A124_18",
         "A124_19","A124_24","A124_26","A124_27","A124_28","A124_29","A124_30","A124_34",
         "A124_35","A124_36","A124_37","A124_38","A124_42","A124_43","A124_45","A124_46",
         "A124_47","A124_48","A124_49","A124_50","A124_51","A124_52"]
ADMIN = ["S001","S002VS","S003","S009","S017","S020"]

t0 = time.time()
df, meta = pyreadstat.read_dta(DTA, usecols=ADMIN + NEIGH)
print(f"read in {time.time()-t0:.0f}s, shape={df.shape}")

df.to_pickle(OUT)
print("saved subset ->", OUT)

# quick diagnostics
print("\n== S001 x S002VS (n) ==")
print(pd.crosstab(df["S002VS"], df["S001"]))

pairs = df[["S003","S009"]].drop_duplicates().sort_values("S003")
print("\n== unique country codes ==", len(pairs))
print(pairs.to_string())

arg = df[df["S003"] == 32]
print("\n== ARGENTINA waves ==")
for (w, y), g in arg.groupby(["S002VS","S020"]):
    v = g["A124_02"]
    valid = v.isin([0,1])
    if valid.sum() > 0:
        w17 = g.loc[valid, "S017"]
        pct = np.average(v[valid], weights=w17) * 100
        print(f"wave {w} year {y}: n={len(g)}, valid_race={valid.sum()}, pct_race={pct:.1f}%")
    else:
        print(f"wave {w} year {y}: n={len(g)}, race not asked")
