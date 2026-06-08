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
    "year": 1976,
    "n": 80,
    "nf": 40
  },
  "ALB": {
    "name": "Albania",
    "confed": "UEFA",
    "year": 1930,
    "n": 126,
    "nf": 77
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
    "year": 1912,
    "n": 355,
    "nf": 258
  },
  "ARM": {
    "name": "Armenia",
    "confed": "UEFA",
    "year": 1989,
    "n": 92,
    "nf": 62
  },
  "ATG": {
    "name": "Antigua y Barbuda",
    "confed": "CONCACAF",
    "year": 1973,
    "n": 15,
    "nf": 10
  },
  "AUS": {
    "name": "Australia",
    "confed": "AFC",
    "year": 1977,
    "n": 588,
    "nf": 509
  },
  "AUT": {
    "name": "Austria",
    "confed": "UEFA",
    "year": 1921,
    "n": 260,
    "nf": 162
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
    "n": 40,
    "nf": 11
  },
  "BEL": {
    "name": "Bélgica",
    "confed": "UEFA",
    "year": 1921,
    "n": 1047,
    "nf": 354
  },
  "BEN": {
    "name": "Benín",
    "confed": "CAF",
    "year": 1975,
    "n": 51,
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
    "n": 84,
    "nf": 34
  },
  "BGR": {
    "name": "Bulgaria",
    "confed": "UEFA",
    "year": 1928,
    "n": 306,
    "nf": 147
  },
  "BHR": {
    "name": "Baréin",
    "confed": "AFC",
    "year": 1945,
    "n": 18,
    "nf": 14
  },
  "BHS": {
    "name": "Bahamas",
    "confed": "CONCACAF",
    "year": 1988,
    "n": 13,
    "nf": 5
  },
  "BIH": {
    "name": "Bosnia y Herzegovina",
    "confed": "UEFA",
    "year": 1945,
    "n": 132,
    "nf": 107
  },
  "BLR": {
    "name": "Bielorrusia",
    "confed": "UEFA",
    "year": 1986,
    "n": 220,
    "nf": 120
  },
  "BLZ": {
    "name": "Belice",
    "confed": "CONCACAF",
    "year": 2004,
    "n": 38,
    "nf": 27
  },
  "BOL": {
    "name": "Bolivia",
    "confed": "CONMEBOL",
    "year": 1948,
    "n": 88,
    "nf": 59
  },
  "BRA": {
    "name": "Brasil",
    "confed": "CONMEBOL",
    "year": 1939,
    "n": 1738,
    "nf": 1173
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
    "confed": "AFC",
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
    "n": 38,
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
    "n": 249,
    "nf": 142
  },
  "CHE": {
    "name": "Suiza",
    "confed": "UEFA",
    "year": 1903,
    "n": 245,
    "nf": 218
  },
  "CHL": {
    "name": "Chile",
    "confed": "CONMEBOL",
    "year": 1946,
    "n": 169,
    "nf": 135
  },
  "CHN": {
    "name": "China",
    "confed": "AFC",
    "year": 1997,
    "n": 279,
    "nf": 199
  },
  "CIV": {
    "name": "Costa de Marfil",
    "confed": "CAF",
    "year": 1952,
    "n": 64,
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
    "n": 67,
    "nf": 20
  },
  "COL": {
    "name": "Colombia",
    "confed": "CONMEBOL",
    "year": 1953,
    "n": 96,
    "nf": 83
  },
  "COM": {
    "name": "Comoras",
    "confed": "CAF",
    "year": 1966,
    "n": 23,
    "nf": 13
  },
  "CPV": {
    "name": "Cabo Verde",
    "confed": "CAF",
    "year": 1975,
    "n": 101,
    "nf": 76
  },
  "CRI": {
    "name": "Costa Rica",
    "confed": "CONCACAF",
    "year": 1947,
    "n": 91,
    "nf": 66
  },
  "CYP": {
    "name": "Chipre",
    "confed": "UEFA",
    "year": 1953,
    "n": 334,
    "nf": 290
  },
  "CZE": {
    "name": "República Checa",
    "confed": "UEFA",
    "year": 1923,
    "n": 676,
    "nf": 596
  },
  "DEU": {
    "name": "Alemania",
    "confed": "UEFA",
    "year": 1908,
    "n": 2217,
    "nf": 1764
  },
  "DJI": {
    "name": "Yibuti",
    "confed": "CAF",
    "year": 1981,
    "n": 20,
    "nf": 7
  },
  "DMA": {
    "name": "Dominica",
    "confed": "CONCACAF",
    "year": 1981,
    "n": 15,
    "nf": 4
  },
  "DNK": {
    "name": "Dinamarca",
    "confed": "UEFA",
    "year": 1938,
    "n": 399,
    "nf": 221
  },
  "DOM": {
    "name": "República Dominicana",
    "confed": "CONCACAF",
    "year": 1999,
    "n": 16,
    "nf": 11
  },
  "DZA": {
    "name": "Argelia",
    "confed": "CAF",
    "year": 1942,
    "n": 217,
    "nf": 149
  },
  "ECU": {
    "name": "Ecuador",
    "confed": "CONMEBOL",
    "year": 1962,
    "n": 163,
    "nf": 107
  },
  "EGY": {
    "name": "Egipto",
    "confed": "CAF",
    "year": 1948,
    "n": 131,
    "nf": 57
  },
  "ESP": {
    "name": "España",
    "confed": "UEFA",
    "year": 1934,
    "n": 1768,
    "nf": 1326
  },
  "EST": {
    "name": "Estonia",
    "confed": "UEFA",
    "year": 1990,
    "n": 209,
    "nf": 114
  },
  "ETH": {
    "name": "Etiopía",
    "confed": "CAF",
    "year": 1975,
    "n": 52,
    "nf": 19
  },
  "FIN": {
    "name": "Finlandia",
    "confed": "UEFA",
    "year": 1947,
    "n": 247,
    "nf": 186
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
    "n": 1863,
    "nf": 1605
  },
  "FSM": {
    "name": "Estados Federados de Micronesia",
    "confed": "OFC",
    "year": 1982,
    "n": 2,
    "nf": 1
  },
  "GAB": {
    "name": "Gabón",
    "confed": "CAF",
    "year": 1974,
    "n": 42,
    "nf": 23
  },
  "GBR": {
    "name": "Reino Unido",
    "confed": "UEFA",
    "year": 1895,
    "n": 3662,
    "nf": 2550
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
    "n": 130,
    "nf": 59
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
    "n": 41,
    "nf": 12
  },
  "GNQ": {
    "name": "Guinea Ecuatorial",
    "confed": "CAF",
    "year": 1978,
    "n": 22,
    "nf": 8
  },
  "GRD": {
    "name": "Granada",
    "confed": "CONCACAF",
    "year": 1986,
    "n": 12,
    "nf": 5
  },
  "GTM": {
    "name": "Guatemala",
    "confed": "CONCACAF",
    "year": 1950,
    "n": 50,
    "nf": 36
  },
  "GUY": {
    "name": "Guyana",
    "confed": "CONCACAF",
    "year": 1971,
    "n": 17,
    "nf": 9
  },
  "HND": {
    "name": "Honduras",
    "confed": "CONCACAF",
    "year": 1954,
    "n": 101,
    "nf": 45
  },
  "HRV": {
    "name": "Croacia",
    "confed": "UEFA",
    "year": 1928,
    "n": 200,
    "nf": 157
  },
  "HTI": {
    "name": "Haití",
    "confed": "CONCACAF",
    "year": 1969,
    "n": 40,
    "nf": 27
  },
  "HUN": {
    "name": "Hungría",
    "confed": "UEFA",
    "year": 1911,
    "n": 276,
    "nf": 189
  },
  "IDN": {
    "name": "Indonesia",
    "confed": "AFC",
    "year": 1975,
    "n": 922,
    "nf": 200
  },
  "IND": {
    "name": "India",
    "confed": "AFC",
    "year": 2010,
    "n": 141,
    "nf": 94
  },
  "IRL": {
    "name": "Irlanda",
    "confed": "UEFA",
    "year": 1927,
    "n": 190,
    "nf": 132
  },
  "IRN": {
    "name": "Irán",
    "confed": "AFC",
    "year": 1979,
    "n": 277,
    "nf": 215
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
    "year": 1928,
    "n": 66,
    "nf": 41
  },
  "ISR": {
    "name": "Israel",
    "confed": "UEFA",
    "year": 1948,
    "n": 276,
    "nf": 264
  },
  "ITA": {
    "name": "Italia",
    "confed": "UEFA",
    "year": 1918,
    "n": 1264,
    "nf": 1107
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
    "n": 43,
    "nf": 28
  },
  "JPN": {
    "name": "Japón",
    "confed": "AFC",
    "year": 1981,
    "n": 454,
    "nf": 275
  },
  "KAZ": {
    "name": "Kazajistán",
    "confed": "UEFA",
    "year": 1967,
    "n": 88,
    "nf": 65
  },
  "KEN": {
    "name": "Kenia",
    "confed": "CAF",
    "year": 1984,
    "n": 78,
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
    "n": 39,
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
    "n": 164,
    "nf": 153
  },
  "KWT": {
    "name": "Kuwait",
    "confed": "AFC",
    "year": 1963,
    "n": 16,
    "nf": 15
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
    "n": 42,
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
    "n": 16,
    "nf": 8
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
    "confed": "CAF",
    "year": 1933,
    "n": 29,
    "nf": 11
  },
  "LTU": {
    "name": "Lituania",
    "confed": "UEFA",
    "year": 2000,
    "n": 500,
    "nf": 85
  },
  "LUX": {
    "name": "Luxemburgo",
    "confed": "UEFA",
    "year": 1926,
    "n": 86,
    "nf": 72
  },
  "LVA": {
    "name": "Letonia",
    "confed": "UEFA",
    "year": 1998,
    "n": 141,
    "nf": 88
  },
  "MAR": {
    "name": "Marruecos",
    "confed": "CAF",
    "year": 1947,
    "n": 206,
    "nf": 102
  },
  "MDA": {
    "name": "Moldavia",
    "confed": "UEFA",
    "year": 1994,
    "n": 88,
    "nf": 78
  },
  "MDG": {
    "name": "Madagascar",
    "confed": "CAF",
    "year": 1997,
    "n": 51,
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
    "year": 1969,
    "n": 441,
    "nf": 318
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
    "n": 36,
    "nf": 21
  },
  "MLT": {
    "name": "Malta",
    "confed": "UEFA",
    "year": 1942,
    "n": 78,
    "nf": 69
  },
  "MMR": {
    "name": "Birmania",
    "confed": "AFC",
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
    "n": 34,
    "nf": 15
  },
  "MOZ": {
    "name": "Mozambique",
    "confed": "CAF",
    "year": 1942,
    "n": 58,
    "nf": 31
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
    "n": 166,
    "nf": 73
  },
  "NAM": {
    "name": "Namibia",
    "confed": "CAF",
    "year": 1962,
    "n": 43,
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
    "n": 36,
    "nf": 24
  },
  "NLD": {
    "name": "Países Bajos",
    "confed": "UEFA",
    "year": 1923,
    "n": 2893,
    "nf": 434
  },
  "NOR": {
    "name": "Noruega",
    "confed": "UEFA",
    "year": 1917,
    "n": 539,
    "nf": 446
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
    "n": 178,
    "nf": 144
  },
  "OMN": {
    "name": "Omán",
    "confed": "AFC",
    "year": 1971,
    "n": 34,
    "nf": 23
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
    "n": 47,
    "nf": 40
  },
  "PER": {
    "name": "Perú",
    "confed": "CONMEBOL",
    "year": 1949,
    "n": 327,
    "nf": 190
  },
  "PHL": {
    "name": "Filipinas",
    "confed": "AFC",
    "year": 2000,
    "n": 62,
    "nf": 37
  },
  "PLW": {
    "name": "Palaos",
    "confed": "OFC",
    "year": 2007,
    "n": 15,
    "nf": 7
  },
  "PNG": {
    "name": "Papúa Nueva Guinea",
    "confed": "OFC",
    "year": 2002,
    "n": 54,
    "nf": 9
  },
  "POL": {
    "name": "Polonia",
    "confed": "UEFA",
    "year": 1932,
    "n": 523,
    "nf": 422
  },
  "PRT": {
    "name": "Portugal",
    "confed": "UEFA",
    "year": 1927,
    "n": 617,
    "nf": 344
  },
  "PRY": {
    "name": "Paraguay",
    "confed": "CONMEBOL",
    "year": 1916,
    "n": 93,
    "nf": 50
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
    "n": 416,
    "nf": 285
  },
  "RUS": {
    "name": "Rusia",
    "confed": "UEFA",
    "year": 1960,
    "n": 806,
    "nf": 569
  },
  "RWA": {
    "name": "Ruanda",
    "confed": "CAF",
    "year": 1992,
    "n": 37,
    "nf": 15
  },
  "SAU": {
    "name": "Arabia Saudí",
    "confed": "AFC",
    "year": 1957,
    "n": 199,
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
    "n": 70,
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
    "n": 133,
    "nf": 71
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
    "n": 279,
    "nf": 197
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
    "n": 37,
    "nf": 8
  },
  "SUR": {
    "name": "Surinam",
    "confed": "CONCACAF",
    "year": 1945,
    "n": 59,
    "nf": 16
  },
  "SVK": {
    "name": "Eslovaquia",
    "confed": "UEFA",
    "year": 1920,
    "n": 235,
    "nf": 184
  },
  "SVN": {
    "name": "Eslovenia",
    "confed": "UEFA",
    "year": 1947,
    "n": 160,
    "nf": 145
  },
  "SWE": {
    "name": "Suecia",
    "confed": "UEFA",
    "year": 1924,
    "n": 1026,
    "nf": 853
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
  "TCD": {
    "name": "Chad",
    "confed": "CAF",
    "year": 1971,
    "n": 15,
    "nf": 7
  },
  "TGO": {
    "name": "Togo",
    "confed": "CAF",
    "year": 1973,
    "n": 32,
    "nf": 17
  },
  "THA": {
    "name": "Tailandia",
    "confed": "AFC",
    "year": 2005,
    "n": 264,
    "nf": 221
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
    "confed": "AFC",
    "year": 2005,
    "n": 52,
    "nf": 31
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
  "TUR": {
    "name": "Turquía",
    "confed": "UEFA",
    "year": 1964,
    "n": 507,
    "nf": 279
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
    "n": 202,
    "nf": 39
  },
  "UKR": {
    "name": "Ucrania",
    "confed": "UEFA",
    "year": 1962,
    "n": 732,
    "nf": 377
  },
  "URY": {
    "name": "Uruguay",
    "confed": "CONMEBOL",
    "year": 1920,
    "n": 123,
    "nf": 98
  },
  "USA": {
    "name": "Estados Unidos",
    "confed": "CONCACAF",
    "year": 2003,
    "n": 1455,
    "nf": 1090
  },
  "UZB": {
    "name": "Uzbekistán",
    "confed": "AFC",
    "year": 1977,
    "n": 105,
    "nf": 61
  },
  "VCT": {
    "name": "San Vicente y las Granadinas",
    "confed": "CONCACAF",
    "year": 1994,
    "n": 14,
    "nf": 12
  },
  "VEN": {
    "name": "Venezuela",
    "confed": "CONMEBOL",
    "year": 1984,
    "n": 166,
    "nf": 99
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
    "n": 45,
    "nf": 18
  },
  "ZWE": {
    "name": "Zimbabue",
    "confed": "CAF",
    "year": 1983,
    "n": 50,
    "nf": 22
  }
};
