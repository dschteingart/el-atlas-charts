// =============================================================
//  El Atlas N°3 — Mapa coroplético "año mediano de fundación"
// =============================================================
//
// AUTO-GENERADO. No editar a mano. Regenerar con:
//   python 03-futbol/data-sources/build_clubage_data.py
//
// Input: _handoff-futbol/data/futbol_paises.csv (184 países).
// Campos por país:
//   year: año mediano de fundación ponderado por sitelinks de
//         Wikipedia (proxy de relevancia del club). null si el
//         país no tiene ningún club con fecha conocida.
//   n:    cantidad total de clubes del país en el universo Wikidata.
//   nf:   cantidad con fecha de fundación conocida (subset de n).
//   name: nombre en español (override en country-names.js para EN).
//   confed: CONMEBOL / UEFA / CONCACAF / CAF / AFC / OFC.

const DATA_CLUBAGE = {
  "AFG": {
    "name": "Afganistán",
    "confed": "AFC",
    "year": 2012,
    "n": 38,
    "nf": 17
  },
  "AGO": {
    "name": "Angola",
    "confed": "CAF",
    "year": 1975,
    "n": 89,
    "nf": 43
  },
  "ALB": {
    "name": "Albania",
    "confed": "UEFA",
    "year": 1930,
    "n": 127,
    "nf": 78
  },
  "AND": {
    "name": "Andorra",
    "confed": "UEFA",
    "year": 1988,
    "n": 32,
    "nf": 23
  },
  "ARE": {
    "name": "Emiratos Árabes Unidos",
    "confed": "AFC",
    "year": 1973,
    "n": 59,
    "nf": 28
  },
  "ARG": {
    "name": "Argentina",
    "confed": "CONMEBOL",
    "year": 1911,
    "n": 587,
    "nf": 451
  },
  "ARM": {
    "name": "Armenia",
    "confed": "UEFA",
    "year": 1989,
    "n": 93,
    "nf": 63
  },
  "ATG": {
    "name": "Antigua y Barbuda",
    "confed": "CONCACAF",
    "year": 1973,
    "n": 18,
    "nf": 11
  },
  "AUS": {
    "name": "Australia",
    "confed": "AFC",
    "year": 1977,
    "n": 595,
    "nf": 513
  },
  "AUT": {
    "name": "Austria",
    "confed": "UEFA",
    "year": 1921,
    "n": 407,
    "nf": 199
  },
  "AZE": {
    "name": "Azerbaiyán",
    "confed": "UEFA",
    "year": 1996,
    "n": 113,
    "nf": 91
  },
  "BDI": {
    "name": "Burundi",
    "confed": "CAF",
    "year": 1986,
    "n": 42,
    "nf": 11
  },
  "BEL": {
    "name": "Bélgica",
    "confed": "UEFA",
    "year": 1921,
    "n": 1257,
    "nf": 386
  },
  "BEN": {
    "name": "Benín",
    "confed": "CAF",
    "year": 1975,
    "n": 53,
    "nf": 8
  },
  "BFA": {
    "name": "Burkina Faso",
    "confed": "CAF",
    "year": 1961,
    "n": 41,
    "nf": 18
  },
  "BGD": {
    "name": "Bangladés",
    "confed": "AFC",
    "year": 1994,
    "n": 85,
    "nf": 35
  },
  "BGR": {
    "name": "Bulgaria",
    "confed": "UEFA",
    "year": 1928,
    "n": 314,
    "nf": 151
  },
  "BHR": {
    "name": "Baréin",
    "confed": "AFC",
    "year": 1945,
    "n": 19,
    "nf": 15
  },
  "BHS": {
    "name": "Bahamas",
    "confed": "CONCACAF",
    "year": 1988,
    "n": 14,
    "nf": 6
  },
  "BIH": {
    "name": "Bosnia y Herzegovina",
    "confed": "UEFA",
    "year": 1945,
    "n": 143,
    "nf": 108
  },
  "BLR": {
    "name": "Bielorrusia",
    "confed": "UEFA",
    "year": 1986,
    "n": 221,
    "nf": 121
  },
  "BLZ": {
    "name": "Belice",
    "confed": "CONCACAF",
    "year": 2004,
    "n": 40,
    "nf": 28
  },
  "BOL": {
    "name": "Bolivia",
    "confed": "CONMEBOL",
    "year": 1949,
    "n": 98,
    "nf": 64
  },
  "BRA": {
    "name": "Brasil",
    "confed": "CONMEBOL",
    "year": 1940,
    "n": 2353,
    "nf": 1301
  },
  "BRB": {
    "name": "Barbados",
    "confed": "CONCACAF",
    "year": 1977,
    "n": 18,
    "nf": 6
  },
  "BRN": {
    "name": "Brunéi",
    "confed": "",
    "year": 1988,
    "n": 22,
    "nf": 11
  },
  "BTN": {
    "name": "Bután",
    "confed": "AFC",
    "year": 2001,
    "n": 38,
    "nf": 17
  },
  "BWA": {
    "name": "Botsuana",
    "confed": "CAF",
    "year": 1968,
    "n": 40,
    "nf": 20
  },
  "CAF": {
    "name": "República Centroafricana",
    "confed": "CAF",
    "year": 1959,
    "n": 20,
    "nf": 11
  },
  "CAN": {
    "name": "Canadá",
    "confed": "CONCACAF",
    "year": 2005,
    "n": 251,
    "nf": 142
  },
  "CHE": {
    "name": "Suiza",
    "confed": "UEFA",
    "year": 1903,
    "n": 425,
    "nf": 397
  },
  "CHL": {
    "name": "Chile",
    "confed": "CONMEBOL",
    "year": 1947,
    "n": 194,
    "nf": 156
  },
  "CHN": {
    "name": "China",
    "confed": "AFC",
    "year": 1997,
    "n": 280,
    "nf": 200
  },
  "CIV": {
    "name": "Costa de Marfil",
    "confed": "CAF",
    "year": 1952,
    "n": 66,
    "nf": 36
  },
  "CMR": {
    "name": "Camerún",
    "confed": "CAF",
    "year": 1973,
    "n": 80,
    "nf": 35
  },
  "COD": {
    "name": "República Democrática del Congo",
    "confed": "CAF",
    "year": 1937,
    "n": 72,
    "nf": 21
  },
  "COG": {
    "name": "Congo",
    "confed": "CAF",
    "year": 1951,
    "n": 38,
    "nf": 14
  },
  "COL": {
    "name": "Colombia",
    "confed": "CONMEBOL",
    "year": 1953,
    "n": 134,
    "nf": 103
  },
  "COM": {
    "name": "Comoras",
    "confed": "",
    "year": 1966,
    "n": 23,
    "nf": 13
  },
  "CPV": {
    "name": "Cabo Verde",
    "confed": "CAF",
    "year": 1975,
    "n": 103,
    "nf": 78
  },
  "CRI": {
    "name": "Costa Rica",
    "confed": "CONCACAF",
    "year": 1947,
    "n": 107,
    "nf": 81
  },
  "CUB": {
    "name": "Cuba",
    "confed": "CONCACAF",
    "year": 1977,
    "n": 23,
    "nf": 10
  },
  "CYP": {
    "name": "Chipre",
    "confed": "UEFA",
    "year": 1951,
    "n": 345,
    "nf": 299
  },
  "CZE": {
    "name": "República Checa",
    "confed": "UEFA",
    "year": 1923,
    "n": 689,
    "nf": 605
  },
  "DEU": {
    "name": "Alemania",
    "confed": "UEFA",
    "year": 1909,
    "n": 6532,
    "nf": 5903
  },
  "DJI": {
    "name": "Yibuti",
    "confed": "CAF",
    "year": 1981,
    "n": 22,
    "nf": 8
  },
  "DMA": {
    "name": "Dominica",
    "confed": "CONCACAF",
    "year": 1981,
    "n": 17,
    "nf": 5
  },
  "DNK": {
    "name": "Dinamarca",
    "confed": "UEFA",
    "year": 1936,
    "n": 498,
    "nf": 249
  },
  "DOM": {
    "name": "República Dominicana",
    "confed": "CONCACAF",
    "year": 1999,
    "n": 18,
    "nf": 12
  },
  "DZA": {
    "name": "Argelia",
    "confed": "CAF",
    "year": 1942,
    "n": 218,
    "nf": 150
  },
  "ECU": {
    "name": "Ecuador",
    "confed": "CONMEBOL",
    "year": 1962,
    "n": 201,
    "nf": 137
  },
  "EGY": {
    "name": "Egipto",
    "confed": "CAF",
    "year": 1948,
    "n": 135,
    "nf": 60
  },
  "ERI": {
    "name": "Eritrea",
    "confed": "CAF",
    "year": 1944,
    "n": 17,
    "nf": 4
  },
  "ESP": {
    "name": "España",
    "confed": "UEFA",
    "year": 1934,
    "n": 1934,
    "nf": 1460
  },
  "EST": {
    "name": "Estonia",
    "confed": "UEFA",
    "year": 1990,
    "n": 215,
    "nf": 116
  },
  "ETH": {
    "name": "Etiopía",
    "confed": "CAF",
    "year": 1975,
    "n": 53,
    "nf": 19
  },
  "FIN": {
    "name": "Finlandia",
    "confed": "UEFA",
    "year": 1946,
    "n": 393,
    "nf": 242
  },
  "FJI": {
    "name": "Fiyi",
    "confed": "OFC",
    "year": 1937,
    "n": 24,
    "nf": 24
  },
  "FRA": {
    "name": "Francia",
    "confed": "UEFA",
    "year": 1927,
    "n": 1887,
    "nf": 1624
  },
  "FSM": {
    "name": "Estados Federados de Micronesia",
    "confed": "",
    "year": 1982,
    "n": 2,
    "nf": 1
  },
  "GAB": {
    "name": "Gabón",
    "confed": "CAF",
    "year": 1974,
    "n": 45,
    "nf": 25
  },
  "GBR": {
    "name": "Reino Unido",
    "confed": "UEFA",
    "year": 1895,
    "n": 3677,
    "nf": 2554
  },
  "GEO": {
    "name": "Georgia",
    "confed": "UEFA",
    "year": 1945,
    "n": 105,
    "nf": 63
  },
  "GHA": {
    "name": "Ghana",
    "confed": "CAF",
    "year": 1994,
    "n": 131,
    "nf": 60
  },
  "GIN": {
    "name": "Guinea",
    "confed": "CAF",
    "year": 1974,
    "n": 28,
    "nf": 15
  },
  "GMB": {
    "name": "Gambia",
    "confed": "CAF",
    "year": 1973,
    "n": 31,
    "nf": 16
  },
  "GNB": {
    "name": "Guinea-Bisáu",
    "confed": "CAF",
    "year": 1946,
    "n": 42,
    "nf": 12
  },
  "GNQ": {
    "name": "Guinea Ecuatorial",
    "confed": "CAF",
    "year": 1978,
    "n": 22,
    "nf": 8
  },
  "GRC": {
    "name": "Grecia",
    "confed": "UEFA",
    "year": 1951,
    "n": 680,
    "nf": 604
  },
  "GRD": {
    "name": "Granada",
    "confed": "CONCACAF",
    "year": 1986,
    "n": 13,
    "nf": 5
  },
  "GTM": {
    "name": "Guatemala",
    "confed": "CONCACAF",
    "year": 1950,
    "n": 61,
    "nf": 38
  },
  "GUY": {
    "name": "Guyana",
    "confed": "CONCACAF",
    "year": 1971,
    "n": 20,
    "nf": 10
  },
  "HND": {
    "name": "Honduras",
    "confed": "CONCACAF",
    "year": 1954,
    "n": 106,
    "nf": 47
  },
  "HRV": {
    "name": "Croacia",
    "confed": "UEFA",
    "year": 1928,
    "n": 1098,
    "nf": 188
  },
  "HTI": {
    "name": "Haití",
    "confed": "CONCACAF",
    "year": 1969,
    "n": 44,
    "nf": 28
  },
  "HUN": {
    "name": "Hungría",
    "confed": "UEFA",
    "year": 1911,
    "n": 303,
    "nf": 211
  },
  "IDN": {
    "name": "Indonesia",
    "confed": "AFC",
    "year": 1975,
    "n": 925,
    "nf": 200
  },
  "IND": {
    "name": "India",
    "confed": "AFC",
    "year": 2010,
    "n": 141,
    "nf": 95
  },
  "IRL": {
    "name": "Irlanda",
    "confed": "UEFA",
    "year": 1927,
    "n": 191,
    "nf": 132
  },
  "IRN": {
    "name": "Irán",
    "confed": "AFC",
    "year": 1979,
    "n": 282,
    "nf": 216
  },
  "IRQ": {
    "name": "Irak",
    "confed": "AFC",
    "year": 1976,
    "n": 293,
    "nf": 175
  },
  "ISL": {
    "name": "Islandia",
    "confed": "UEFA",
    "year": 1933,
    "n": 122,
    "nf": 66
  },
  "ISR": {
    "name": "Israel",
    "confed": "UEFA",
    "year": 1948,
    "n": 279,
    "nf": 266
  },
  "ITA": {
    "name": "Italia",
    "confed": "UEFA",
    "year": 1918,
    "n": 1293,
    "nf": 1121
  },
  "JAM": {
    "name": "Jamaica",
    "confed": "CONCACAF",
    "year": 1973,
    "n": 38,
    "nf": 20
  },
  "JOR": {
    "name": "Jordania",
    "confed": "AFC",
    "year": 1964,
    "n": 44,
    "nf": 29
  },
  "JPN": {
    "name": "Japón",
    "confed": "AFC",
    "year": 1981,
    "n": 456,
    "nf": 276
  },
  "KAZ": {
    "name": "Kazajistán",
    "confed": "UEFA",
    "year": 1967,
    "n": 92,
    "nf": 68
  },
  "KEN": {
    "name": "Kenia",
    "confed": "CAF",
    "year": 1984,
    "n": 80,
    "nf": 43
  },
  "KGZ": {
    "name": "Kirguistán",
    "confed": "AFC",
    "year": 1995,
    "n": 71,
    "nf": 51
  },
  "KHM": {
    "name": "Camboya",
    "confed": "AFC",
    "year": 2000,
    "n": 41,
    "nf": 11
  },
  "KIR": {
    "name": "Kiribati",
    "confed": "OFC",
    "year": 2001,
    "n": 2,
    "nf": 1
  },
  "KNA": {
    "name": "San Cristóbal y Nieves",
    "confed": "CONCACAF",
    "year": 1961,
    "n": 14,
    "nf": 4
  },
  "KOR": {
    "name": "Corea del Sur",
    "confed": "AFC",
    "year": 2003,
    "n": 166,
    "nf": 154
  },
  "KWT": {
    "name": "Kuwait",
    "confed": "AFC",
    "year": 1963,
    "n": 17,
    "nf": 16
  },
  "LAO": {
    "name": "Laos",
    "confed": "AFC",
    "year": 2004,
    "n": 26,
    "nf": 15
  },
  "LBN": {
    "name": "Líbano",
    "confed": "AFC",
    "year": 1950,
    "n": 55,
    "nf": 33
  },
  "LBR": {
    "name": "Liberia",
    "confed": "CAF",
    "year": 1990,
    "n": 44,
    "nf": 25
  },
  "LBY": {
    "name": "Libia",
    "confed": "CAF",
    "year": 1953,
    "n": 57,
    "nf": 37
  },
  "LCA": {
    "name": "Santa Lucía",
    "confed": "CONCACAF",
    "year": 1995,
    "n": 17,
    "nf": 9
  },
  "LIE": {
    "name": "Liechtenstein",
    "confed": "UEFA",
    "year": 1931,
    "n": 7,
    "nf": 7
  },
  "LKA": {
    "name": "Sri Lanka",
    "confed": "AFC",
    "year": 1962,
    "n": 22,
    "nf": 10
  },
  "LSO": {
    "name": "Lesoto",
    "confed": "",
    "year": 1933,
    "n": 29,
    "nf": 11
  },
  "LTU": {
    "name": "Lituania",
    "confed": "UEFA",
    "year": 2000,
    "n": 514,
    "nf": 92
  },
  "LUX": {
    "name": "Luxemburgo",
    "confed": "UEFA",
    "year": 1924,
    "n": 92,
    "nf": 74
  },
  "LVA": {
    "name": "Letonia",
    "confed": "UEFA",
    "year": 1998,
    "n": 143,
    "nf": 89
  },
  "MAR": {
    "name": "Marruecos",
    "confed": "CAF",
    "year": 1947,
    "n": 208,
    "nf": 103
  },
  "MCO": {
    "name": "Mónaco",
    "confed": "",
    "year": 1924,
    "n": 1,
    "nf": 1
  },
  "MDA": {
    "name": "Moldavia",
    "confed": "UEFA",
    "year": 1994,
    "n": 90,
    "nf": 79
  },
  "MDG": {
    "name": "Madagascar",
    "confed": "CAF",
    "year": 1997,
    "n": 52,
    "nf": 16
  },
  "MDV": {
    "name": "Maldivas",
    "confed": "AFC",
    "year": 1982,
    "n": 22,
    "nf": 11
  },
  "MEX": {
    "name": "México",
    "confed": "CONCACAF",
    "year": 1970,
    "n": 500,
    "nf": 355
  },
  "MKD": {
    "name": "Macedonia del Norte",
    "confed": "UEFA",
    "year": 1953,
    "n": 164,
    "nf": 126
  },
  "MLI": {
    "name": "Mali",
    "confed": "CAF",
    "year": 1962,
    "n": 38,
    "nf": 22
  },
  "MLT": {
    "name": "Malta",
    "confed": "UEFA",
    "year": 1942,
    "n": 80,
    "nf": 69
  },
  "MMR": {
    "name": "Birmania",
    "confed": "",
    "year": 2008,
    "n": 31,
    "nf": 24
  },
  "MNE": {
    "name": "Montenegro",
    "confed": "UEFA",
    "year": 1926,
    "n": 55,
    "nf": 48
  },
  "MNG": {
    "name": "Mongolia",
    "confed": "AFC",
    "year": 2000,
    "n": 35,
    "nf": 15
  },
  "MOZ": {
    "name": "Mozambique",
    "confed": "CAF",
    "year": 1947,
    "n": 60,
    "nf": 33
  },
  "MRT": {
    "name": "Mauritania",
    "confed": "CAF",
    "year": 1979,
    "n": 30,
    "nf": 18
  },
  "MUS": {
    "name": "Mauricio",
    "confed": "CAF",
    "year": 1999,
    "n": 23,
    "nf": 16
  },
  "MWI": {
    "name": "Malaui",
    "confed": "CAF",
    "year": 1966,
    "n": 30,
    "nf": 10
  },
  "MYS": {
    "name": "Malasia",
    "confed": "AFC",
    "year": 1971,
    "n": 169,
    "nf": 73
  },
  "NAM": {
    "name": "Namibia",
    "confed": "CAF",
    "year": 1962,
    "n": 48,
    "nf": 22
  },
  "NER": {
    "name": "Níger",
    "confed": "CAF",
    "year": 1973,
    "n": 28,
    "nf": 12
  },
  "NGA": {
    "name": "Nigeria",
    "confed": "CAF",
    "year": 1989,
    "n": 122,
    "nf": 79
  },
  "NIC": {
    "name": "Nicaragua",
    "confed": "CONCACAF",
    "year": 1983,
    "n": 42,
    "nf": 28
  },
  "NLD": {
    "name": "Países Bajos",
    "confed": "UEFA",
    "year": 1923,
    "n": 3030,
    "nf": 464
  },
  "NOR": {
    "name": "Noruega",
    "confed": "UEFA",
    "year": 1918,
    "n": 1170,
    "nf": 906
  },
  "NPL": {
    "name": "Nepal",
    "confed": "AFC",
    "year": 1953,
    "n": 38,
    "nf": 17
  },
  "NZL": {
    "name": "Nueva Zelanda",
    "confed": "OFC",
    "year": 1995,
    "n": 181,
    "nf": 144
  },
  "OMN": {
    "name": "Omán",
    "confed": "AFC",
    "year": 1971,
    "n": 36,
    "nf": 24
  },
  "PAK": {
    "name": "Pakistán",
    "confed": "AFC",
    "year": 1959,
    "n": 43,
    "nf": 15
  },
  "PAN": {
    "name": "Panamá",
    "confed": "CONCACAF",
    "year": 1985,
    "n": 52,
    "nf": 42
  },
  "PER": {
    "name": "Perú",
    "confed": "CONMEBOL",
    "year": 1949,
    "n": 435,
    "nf": 220
  },
  "PHL": {
    "name": "Filipinas",
    "confed": "AFC",
    "year": 2000,
    "n": 64,
    "nf": 38
  },
  "PLW": {
    "name": "Palaos",
    "confed": "",
    "year": 2007,
    "n": 15,
    "nf": 7
  },
  "PNG": {
    "name": "Papúa Nueva Guinea",
    "confed": "OFC",
    "year": 2002,
    "n": 55,
    "nf": 10
  },
  "POL": {
    "name": "Polonia",
    "confed": "UEFA",
    "year": 1934,
    "n": 796,
    "nf": 689
  },
  "PRK": {
    "name": "Corea del Norte",
    "confed": "AFC",
    "year": 1955,
    "n": 27,
    "nf": 10
  },
  "PRT": {
    "name": "Portugal",
    "confed": "UEFA",
    "year": 1927,
    "n": 646,
    "nf": 357
  },
  "PRY": {
    "name": "Paraguay",
    "confed": "CONMEBOL",
    "year": 1916,
    "n": 106,
    "nf": 51
  },
  "PSE": {
    "name": "Palestina",
    "confed": "",
    "year": 1971,
    "n": 60,
    "nf": 15
  },
  "QAT": {
    "name": "Catar",
    "confed": "AFC",
    "year": 1978,
    "n": 23,
    "nf": 18
  },
  "ROU": {
    "name": "Rumania",
    "confed": "UEFA",
    "year": 1947,
    "n": 422,
    "nf": 288
  },
  "RUS": {
    "name": "Rusia",
    "confed": "UEFA",
    "year": 1959,
    "n": 833,
    "nf": 580
  },
  "RWA": {
    "name": "Ruanda",
    "confed": "CAF",
    "year": 1992,
    "n": 38,
    "nf": 16
  },
  "SAU": {
    "name": "Arabia Saudí",
    "confed": "AFC",
    "year": 1957,
    "n": 202,
    "nf": 83
  },
  "SDN": {
    "name": "Sudán",
    "confed": "CAF",
    "year": 1930,
    "n": 39,
    "nf": 22
  },
  "SEN": {
    "name": "Senegal",
    "confed": "CAF",
    "year": 1979,
    "n": 71,
    "nf": 50
  },
  "SGP": {
    "name": "Singapur",
    "confed": "AFC",
    "year": 1980,
    "n": 37,
    "nf": 23
  },
  "SLB": {
    "name": "Islas Salomón",
    "confed": "OFC",
    "year": 1997,
    "n": 19,
    "nf": 8
  },
  "SLE": {
    "name": "Sierra Leona",
    "confed": "CAF",
    "year": 1965,
    "n": 34,
    "nf": 15
  },
  "SLV": {
    "name": "El Salvador",
    "confed": "CONCACAF",
    "year": 1950,
    "n": 134,
    "nf": 72
  },
  "SMR": {
    "name": "San Marino",
    "confed": "UEFA",
    "year": 1965,
    "n": 21,
    "nf": 21
  },
  "SOM": {
    "name": "Somalia",
    "confed": "CAF",
    "year": 1972,
    "n": 29,
    "nf": 8
  },
  "SRB": {
    "name": "Serbia",
    "confed": "UEFA",
    "year": 1926,
    "n": 286,
    "nf": 202
  },
  "SSD": {
    "name": "Sudán del Sur",
    "confed": "CAF",
    "year": 2001,
    "n": 31,
    "nf": 12
  },
  "STP": {
    "name": "Santo Tomé y Príncipe",
    "confed": "CAF",
    "year": 1975,
    "n": 38,
    "nf": 8
  },
  "SUR": {
    "name": "Surinam",
    "confed": "CONCACAF",
    "year": 1945,
    "n": 60,
    "nf": 16
  },
  "SVK": {
    "name": "Eslovaquia",
    "confed": "UEFA",
    "year": 1920,
    "n": 241,
    "nf": 188
  },
  "SVN": {
    "name": "Eslovenia",
    "confed": "UEFA",
    "year": 1947,
    "n": 166,
    "nf": 149
  },
  "SWE": {
    "name": "Suecia",
    "confed": "UEFA",
    "year": 1923,
    "n": 1548,
    "nf": 1287
  },
  "SWZ": {
    "name": "Suazilandia",
    "confed": "CAF",
    "year": 1967,
    "n": 26,
    "nf": 14
  },
  "SYC": {
    "name": "Seychelles",
    "confed": "CAF",
    "year": 1992,
    "n": 20,
    "nf": 8
  },
  "SYR": {
    "name": "Siria",
    "confed": "AFC",
    "year": 1948,
    "n": 41,
    "nf": 38
  },
  "TCD": {
    "name": "Chad",
    "confed": "CAF",
    "year": 1971,
    "n": 16,
    "nf": 7
  },
  "TGO": {
    "name": "Togo",
    "confed": "CAF",
    "year": 1973,
    "n": 34,
    "nf": 18
  },
  "THA": {
    "name": "Tailandia",
    "confed": "AFC",
    "year": 2005,
    "n": 266,
    "nf": 223
  },
  "TJK": {
    "name": "Tayikistán",
    "confed": "AFC",
    "year": 1975,
    "n": 35,
    "nf": 29
  },
  "TKM": {
    "name": "Turkmenistán",
    "confed": "AFC",
    "year": 1993,
    "n": 20,
    "nf": 20
  },
  "TLS": {
    "name": "Timor Oriental",
    "confed": "",
    "year": 2005,
    "n": 60,
    "nf": 33
  },
  "TON": {
    "name": "Tonga",
    "confed": "OFC",
    "year": 1974,
    "n": 12,
    "nf": 5
  },
  "TTO": {
    "name": "Trinidad y Tobago",
    "confed": "CONCACAF",
    "year": 1991,
    "n": 26,
    "nf": 17
  },
  "TUN": {
    "name": "Túnez",
    "confed": "CAF",
    "year": 1938,
    "n": 162,
    "nf": 118
  },
  "TUR": {
    "name": "Turquía",
    "confed": "UEFA",
    "year": 1964,
    "n": 552,
    "nf": 303
  },
  "TUV": {
    "name": "Tuvalu",
    "confed": "OFC",
    "year": 1979,
    "n": 8,
    "nf": 8
  },
  "TWN": {
    "name": "Taiwán",
    "confed": "AFC",
    "year": 1978,
    "n": 32,
    "nf": 16
  },
  "TZA": {
    "name": "Tanzania",
    "confed": "CAF",
    "year": 1964,
    "n": 67,
    "nf": 25
  },
  "UGA": {
    "name": "Uganda",
    "confed": "CAF",
    "year": 1974,
    "n": 207,
    "nf": 39
  },
  "UKR": {
    "name": "Ucrania",
    "confed": "UEFA",
    "year": 1960,
    "n": 833,
    "nf": 410
  },
  "URY": {
    "name": "Uruguay",
    "confed": "CONMEBOL",
    "year": 1920,
    "n": 134,
    "nf": 108
  },
  "USA": {
    "name": "Estados Unidos",
    "confed": "CONCACAF",
    "year": 2003,
    "n": 1484,
    "nf": 1105
  },
  "UZB": {
    "name": "Uzbekistán",
    "confed": "AFC",
    "year": 1977,
    "n": 109,
    "nf": 61
  },
  "VAT": {
    "name": "Ciudad del Vaticano",
    "confed": "",
    "year": null,
    "n": 1,
    "nf": 0
  },
  "VCT": {
    "name": "San Vicente y las Granadinas",
    "confed": "CONCACAF",
    "year": 1994,
    "n": 15,
    "nf": 12
  },
  "VEN": {
    "name": "Venezuela",
    "confed": "CONMEBOL",
    "year": 1986,
    "n": 200,
    "nf": 114
  },
  "VNM": {
    "name": "Vietnam",
    "confed": "AFC",
    "year": 1996,
    "n": 61,
    "nf": 43
  },
  "VUT": {
    "name": "Vanuatu",
    "confed": "OFC",
    "year": 1977,
    "n": 24,
    "nf": 11
  },
  "WSM": {
    "name": "Samoa",
    "confed": "OFC",
    "year": 1976,
    "n": 16,
    "nf": 6
  },
  "XKS": {
    "name": "Kosovo",
    "confed": "UEFA",
    "year": 1946,
    "n": 41,
    "nf": 32
  },
  "YEM": {
    "name": "Yemen",
    "confed": "AFC",
    "year": 1963,
    "n": 21,
    "nf": 14
  },
  "ZAF": {
    "name": "Sudáfrica",
    "confed": "CAF",
    "year": 1976,
    "n": 156,
    "nf": 99
  },
  "ZMB": {
    "name": "Zambia",
    "confed": "CAF",
    "year": 1964,
    "n": 46,
    "nf": 18
  },
  "ZWE": {
    "name": "Zimbabue",
    "confed": "CAF",
    "year": 1983,
    "n": 51,
    "nf": 23
  }
};
