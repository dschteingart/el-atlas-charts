// Diccionario bilingüe de nombres de países por iso3.
// Construido desde el dataset del N°1 (179 países) + 16 países que el N°2
// incluye y el N°1 no (Pacífico, Sudán del Sur, Kosovo, etc.).
// Cuando un N°3 lo necesite, conviene promover este archivo a lib/.
//
// Uso: COUNTRY_NAMES[iso3][LANG] devuelve el nombre. Fallback al name
// del dataset si el iso3 no está acá.
// Nota: corrige "Türkiye" (uso oficial post-2022) a "Turquía" en español.

const COUNTRY_NAMES = {
  "ABW": {
    "en": "Aruba",
    "es": "Aruba"
  },
  "AFG": {
    "en": "Afghanistan",
    "es": "Afganistán"
  },
  "AGO": {
    "en": "Angola",
    "es": "Angola"
  },
  "ALB": {
    "en": "Albania",
    "es": "Albania"
  },
  "AND": {
    "en": "Andorra",
    "es": "Andorra"
  },
  "ARE": {
    "en": "United Arab Emirates",
    "es": "Emiratos Árabes Unidos"
  },
  "ARG": {
    "en": "Argentina",
    "es": "Argentina"
  },
  "ARM": {
    "en": "Armenia",
    "es": "Armenia"
  },
  "ATG": {
    "en": "Antigua and Barbuda",
    "es": "Antigua y Barbuda"
  },
  "AUS": {
    "en": "Australia",
    "es": "Australia"
  },
  "AUT": {
    "en": "Austria",
    "es": "Austria"
  },
  "AZE": {
    "en": "Azerbaijan",
    "es": "Azerbaiyán"
  },
  "BDI": {
    "en": "Burundi",
    "es": "Burundi"
  },
  "BEL": {
    "en": "Belgium",
    "es": "Bélgica"
  },
  "BEN": {
    "en": "Benin",
    "es": "Benín"
  },
  "BFA": {
    "en": "Burkina Faso",
    "es": "Burkina Faso"
  },
  "BGD": {
    "en": "Bangladesh",
    "es": "Bangladés"
  },
  "BGR": {
    "en": "Bulgaria",
    "es": "Bulgaria"
  },
  "BHR": {
    "en": "Bahrain",
    "es": "Baréin"
  },
  "BHS": {
    "en": "Bahamas",
    "es": "Bahamas"
  },
  "BIH": {
    "en": "Bosnia and Herzegovina",
    "es": "Bosnia y Herzegovina"
  },
  "BLR": {
    "en": "Belarus",
    "es": "Bielorrusia"
  },
  "BLZ": {
    "en": "Belize",
    "es": "Belice"
  },
  "BOL": {
    "en": "Bolivia",
    "es": "Bolivia"
  },
  "BRA": {
    "en": "Brazil",
    "es": "Brasil"
  },
  "BRB": {
    "en": "Barbados",
    "es": "Barbados"
  },
  "BRN": {
    "en": "Brunei",
    "es": "Brunéi"
  },
  "BTN": {
    "en": "Bhutan",
    "es": "Bután"
  },
  "BWA": {
    "en": "Botswana",
    "es": "Botsuana"
  },
  "CAF": {
    "en": "Central African Republic",
    "es": "República Centroafricana"
  },
  "CAN": {
    "en": "Canada",
    "es": "Canadá"
  },
  "CHE": {
    "en": "Switzerland",
    "es": "Suiza"
  },
  "CHL": {
    "en": "Chile",
    "es": "Chile"
  },
  "CHN": {
    "en": "China",
    "es": "China"
  },
  "CIV": {
    "en": "Cote d'Ivoire",
    "es": "Costa de Marfil"
  },
  "CMR": {
    "en": "Cameroon",
    "es": "Camerún"
  },
  "COD": {
    "en": "Democratic Republic of Congo",
    "es": "R.D. del Congo"
  },
  "COG": {
    "en": "Congo",
    "es": "Congo"
  },
  "COL": {
    "en": "Colombia",
    "es": "Colombia"
  },
  "COM": {
    "en": "Comoros",
    "es": "Comoras"
  },
  "CPV": {
    "en": "Cape Verde",
    "es": "Cabo Verde"
  },
  "CRI": {
    "en": "Costa Rica",
    "es": "Costa Rica"
  },
  "CUW": {
    "en": "Curacao",
    "es": "Curazao"
  },
  "CYP": {
    "en": "Cyprus",
    "es": "Chipre"
  },
  "CZE": {
    "en": "Czechia",
    "es": "Chequia"
  },
  "DEU": {
    "en": "Germany",
    "es": "Alemania"
  },
  "DJI": {
    "en": "Djibouti",
    "es": "Yibuti"
  },
  "DMA": {
    "en": "Dominica",
    "es": "Dominica"
  },
  "DNK": {
    "en": "Denmark",
    "es": "Dinamarca"
  },
  "DOM": {
    "en": "Dominican Republic",
    "es": "Rep. Dominicana"
  },
  "DZA": {
    "en": "Algeria",
    "es": "Argelia"
  },
  "ECU": {
    "en": "Ecuador",
    "es": "Ecuador"
  },
  "EGY": {
    "en": "Egypt",
    "es": "Egipto"
  },
  "ESP": {
    "en": "Spain",
    "es": "España"
  },
  "EST": {
    "en": "Estonia",
    "es": "Estonia"
  },
  "ETH": {
    "en": "Ethiopia",
    "es": "Etiopía"
  },
  "FIN": {
    "en": "Finland",
    "es": "Finlandia"
  },
  "FJI": {
    "en": "Fiji",
    "es": "Fiyi"
  },
  "FRA": {
    "en": "France",
    "es": "Francia"
  },
  "FSM": {
    "en": "Micronesia",
    "es": "Micronesia"
  },
  "GAB": {
    "en": "Gabon",
    "es": "Gabón"
  },
  "GBR": {
    "en": "United Kingdom",
    "es": "Reino Unido"
  },
  "GEO": {
    "en": "Georgia",
    "es": "Georgia"
  },
  "GHA": {
    "en": "Ghana",
    "es": "Ghana"
  },
  "GIN": {
    "en": "Guinea",
    "es": "Guinea"
  },
  "GMB": {
    "en": "Gambia",
    "es": "Gambia"
  },
  "GNB": {
    "en": "Guinea-Bissau",
    "es": "Guinea-Bisáu"
  },
  "GNQ": {
    "en": "Equatorial Guinea",
    "es": "Guinea Ecuatorial"
  },
  "GRC": {
    "en": "Greece",
    "es": "Grecia"
  },
  "GRD": {
    "en": "Grenada",
    "es": "Granada"
  },
  "GTM": {
    "en": "Guatemala",
    "es": "Guatemala"
  },
  "GUY": {
    "en": "Guyana",
    "es": "Guyana"
  },
  "HKG": {
    "en": "Hong Kong",
    "es": "Hong Kong"
  },
  "HND": {
    "en": "Honduras",
    "es": "Honduras"
  },
  "HRV": {
    "en": "Croatia",
    "es": "Croacia"
  },
  "HTI": {
    "en": "Haiti",
    "es": "Haití"
  },
  "HUN": {
    "en": "Hungary",
    "es": "Hungría"
  },
  "IDN": {
    "en": "Indonesia",
    "es": "Indonesia"
  },
  "IND": {
    "en": "India",
    "es": "India"
  },
  "IRL": {
    "en": "Ireland",
    "es": "Irlanda"
  },
  "IRN": {
    "en": "Iran",
    "es": "Irán"
  },
  "IRQ": {
    "en": "Iraq",
    "es": "Irak"
  },
  "ISL": {
    "en": "Iceland",
    "es": "Islandia"
  },
  "ISR": {
    "en": "Israel",
    "es": "Israel"
  },
  "ITA": {
    "en": "Italy",
    "es": "Italia"
  },
  "JAM": {
    "en": "Jamaica",
    "es": "Jamaica"
  },
  "JOR": {
    "en": "Jordan",
    "es": "Jordania"
  },
  "JPN": {
    "en": "Japan",
    "es": "Japón"
  },
  "KAZ": {
    "en": "Kazakhstan",
    "es": "Kazajistán"
  },
  "KEN": {
    "en": "Kenya",
    "es": "Kenia"
  },
  "KGZ": {
    "en": "Kyrgyzstan",
    "es": "Kirguistán"
  },
  "KHM": {
    "en": "Cambodia",
    "es": "Camboya"
  },
  "KIR": {
    "en": "Kiribati",
    "es": "Kiribati"
  },
  "KNA": {
    "en": "Saint Kitts and Nevis",
    "es": "San Cristóbal y Nieves"
  },
  "KOR": {
    "en": "South Korea",
    "es": "Corea del Sur"
  },
  "KWT": {
    "en": "Kuwait",
    "es": "Kuwait"
  },
  "LAO": {
    "en": "Laos",
    "es": "Laos"
  },
  "LBN": {
    "en": "Lebanon",
    "es": "Líbano"
  },
  "LBR": {
    "en": "Liberia",
    "es": "Liberia"
  },
  "LBY": {
    "en": "Libya",
    "es": "Libia"
  },
  "LCA": {
    "en": "Saint Lucia",
    "es": "Santa Lucía"
  },
  "LKA": {
    "en": "Sri Lanka",
    "es": "Sri Lanka"
  },
  "LSO": {
    "en": "Lesotho",
    "es": "Lesoto"
  },
  "LTU": {
    "en": "Lithuania",
    "es": "Lituania"
  },
  "LUX": {
    "en": "Luxembourg",
    "es": "Luxemburgo"
  },
  "LVA": {
    "en": "Latvia",
    "es": "Letonia"
  },
  "MAC": {
    "en": "Macao",
    "es": "Macao"
  },
  "MAR": {
    "en": "Morocco",
    "es": "Marruecos"
  },
  "MDA": {
    "en": "Moldova",
    "es": "Moldavia"
  },
  "MDG": {
    "en": "Madagascar",
    "es": "Madagascar"
  },
  "MDV": {
    "en": "Maldives",
    "es": "Maldivas"
  },
  "MEX": {
    "en": "Mexico",
    "es": "México"
  },
  "MHL": {
    "en": "Marshall Islands",
    "es": "Islas Marshall"
  },
  "MKD": {
    "en": "North Macedonia",
    "es": "Macedonia del Norte"
  },
  "MLI": {
    "en": "Mali",
    "es": "Malí"
  },
  "MLT": {
    "en": "Malta",
    "es": "Malta"
  },
  "MMR": {
    "en": "Myanmar",
    "es": "Birmania"
  },
  "MNE": {
    "en": "Montenegro",
    "es": "Montenegro"
  },
  "MNG": {
    "en": "Mongolia",
    "es": "Mongolia"
  },
  "MOZ": {
    "en": "Mozambique",
    "es": "Mozambique"
  },
  "MRT": {
    "en": "Mauritania",
    "es": "Mauritania"
  },
  "MUS": {
    "en": "Mauritius",
    "es": "Mauricio"
  },
  "MWI": {
    "en": "Malawi",
    "es": "Malaui"
  },
  "MYS": {
    "en": "Malaysia",
    "es": "Malasia"
  },
  "NAM": {
    "en": "Namibia",
    "es": "Namibia"
  },
  "NER": {
    "en": "Niger",
    "es": "Níger"
  },
  "NGA": {
    "en": "Nigeria",
    "es": "Nigeria"
  },
  "NIC": {
    "en": "Nicaragua",
    "es": "Nicaragua"
  },
  "NLD": {
    "en": "Netherlands",
    "es": "Países Bajos"
  },
  "NOR": {
    "en": "Norway",
    "es": "Noruega"
  },
  "NPL": {
    "en": "Nepal",
    "es": "Nepal"
  },
  "NRU": {
    "en": "Nauru",
    "es": "Nauru"
  },
  "NZL": {
    "en": "New Zealand",
    "es": "Nueva Zelanda"
  },
  "OMN": {
    "en": "Oman",
    "es": "Omán"
  },
  "PAK": {
    "en": "Pakistan",
    "es": "Pakistán"
  },
  "PAN": {
    "en": "Panama",
    "es": "Panamá"
  },
  "PER": {
    "en": "Peru",
    "es": "Perú"
  },
  "PHL": {
    "en": "Philippines",
    "es": "Filipinas"
  },
  "PNG": {
    "en": "Papua New Guinea",
    "es": "Papúa Nueva Guinea"
  },
  "POL": {
    "en": "Poland",
    "es": "Polonia"
  },
  "PRI": {
    "en": "Puerto Rico",
    "es": "Puerto Rico"
  },
  "PRT": {
    "en": "Portugal",
    "es": "Portugal"
  },
  "PRY": {
    "en": "Paraguay",
    "es": "Paraguay"
  },
  "PSE": {
    "en": "Palestine",
    "es": "Palestina"
  },
  "QAT": {
    "en": "Qatar",
    "es": "Catar"
  },
  "ROU": {
    "en": "Romania",
    "es": "Rumanía"
  },
  "RUS": {
    "en": "Russia",
    "es": "Rusia"
  },
  "RWA": {
    "en": "Rwanda",
    "es": "Ruanda"
  },
  "SAU": {
    "en": "Saudi Arabia",
    "es": "Arabia Saudita"
  },
  "SDN": {
    "en": "Sudan",
    "es": "Sudán"
  },
  "SEN": {
    "en": "Senegal",
    "es": "Senegal"
  },
  "SGP": {
    "en": "Singapore",
    "es": "Singapur"
  },
  "SLB": {
    "en": "Solomon Islands",
    "es": "Islas Salomón"
  },
  "SLE": {
    "en": "Sierra Leone",
    "es": "Sierra Leona"
  },
  "SLV": {
    "en": "El Salvador",
    "es": "El Salvador"
  },
  "SMR": {
    "en": "San Marino",
    "es": "San Marino"
  },
  "SOM": {
    "en": "Somalia",
    "es": "Somalia"
  },
  "SRB": {
    "en": "Serbia",
    "es": "Serbia"
  },
  "SSD": {
    "en": "South Sudan",
    "es": "Sudán del Sur"
  },
  "STP": {
    "en": "Sao Tome and Principe",
    "es": "Santo Tomé y Príncipe"
  },
  "SUR": {
    "en": "Suriname",
    "es": "Surinam"
  },
  "SVK": {
    "en": "Slovakia",
    "es": "Eslovaquia"
  },
  "SVN": {
    "en": "Slovenia",
    "es": "Eslovenia"
  },
  "SWE": {
    "en": "Sweden",
    "es": "Suecia"
  },
  "SWZ": {
    "en": "Eswatini",
    "es": "Esuatini"
  },
  "SYC": {
    "en": "Seychelles",
    "es": "Seychelles"
  },
  "SYR": {
    "en": "Syria",
    "es": "Siria"
  },
  "TCD": {
    "en": "Chad",
    "es": "Chad"
  },
  "TGO": {
    "en": "Togo",
    "es": "Togo"
  },
  "THA": {
    "en": "Thailand",
    "es": "Tailandia"
  },
  "TJK": {
    "en": "Tajikistan",
    "es": "Tayikistán"
  },
  "TKM": {
    "en": "Turkmenistan",
    "es": "Turkmenistán"
  },
  "TLS": {
    "en": "East Timor",
    "es": "Timor Oriental"
  },
  "TON": {
    "en": "Tonga",
    "es": "Tonga"
  },
  "TTO": {
    "en": "Trinidad and Tobago",
    "es": "Trinidad y Tobago"
  },
  "TUN": {
    "en": "Tunisia",
    "es": "Túnez"
  },
  "TUR": {
    "en": "Turkey",
    "es": "Turquía"
  },
  "TUV": {
    "en": "Tuvalu",
    "es": "Tuvalu"
  },
  "TWN": {
    "en": "Taiwan",
    "es": "Taiwán"
  },
  "TZA": {
    "en": "Tanzania",
    "es": "Tanzania"
  },
  "UGA": {
    "en": "Uganda",
    "es": "Uganda"
  },
  "UKR": {
    "en": "Ukraine",
    "es": "Ucrania"
  },
  "URY": {
    "en": "Uruguay",
    "es": "Uruguay"
  },
  "USA": {
    "en": "United States",
    "es": "Estados Unidos"
  },
  "UZB": {
    "en": "Uzbekistan",
    "es": "Uzbekistán"
  },
  "VCT": {
    "en": "Saint Vincent and the Grenadines",
    "es": "San Vicente y las Granadinas"
  },
  "VEN": {
    "en": "Venezuela",
    "es": "Venezuela"
  },
  "VNM": {
    "en": "Vietnam",
    "es": "Vietnam"
  },
  "VUT": {
    "en": "Vanuatu",
    "es": "Vanuatu"
  },
  "WSM": {
    "en": "Samoa",
    "es": "Samoa"
  },
  "XKX": {
    "en": "Kosovo",
    "es": "Kosovo"
  },
  "YEM": {
    "en": "Yemen",
    "es": "Yemen"
  },
  "ZAF": {
    "en": "South Africa",
    "es": "Sudáfrica"
  },
  "ZMB": {
    "en": "Zambia",
    "es": "Zambia"
  },
  "ZWE": {
    "en": "Zimbabwe",
    "es": "Zimbabue"
  }
};
