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
  "AIA": {
    "en": "Anguilla",
    "es": "Anguila"
  },
  "ALA": {
    "en": "Åland Islands",
    "es": "Islas Åland"
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
  "ASM": {
    "en": "American Samoa",
    "es": "Samoa Americana"
  },
  "ATA": {
    "en": "Antarctica",
    "es": "Antártida"
  },
  "ATC": {
    "en": "Ashmore and Cartier Islands",
    "es": "Islas Ashmore y Cartier"
  },
  "ATF": {
    "en": "French Southern Territories",
    "es": "Tierras Australes Francesas"
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
  "BLM": {
    "en": "Saint Barthélemy",
    "es": "San Bartolomé"
  },
  "BLR": {
    "en": "Belarus",
    "es": "Bielorrusia"
  },
  "BLZ": {
    "en": "Belize",
    "es": "Belice"
  },
  "BMU": {
    "en": "Bermuda",
    "es": "Bermudas"
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
  "COK": {
    "en": "Cook Islands",
    "es": "Islas Cook"
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
  "CUB": {
    "en": "Cuba",
    "es": "Cuba"
  },
  "CUW": {
    "en": "Curacao",
    "es": "Curazao"
  },
  "CYM": {
    "en": "Cayman Islands",
    "es": "Islas Caimán"
  },
  "CYN": {
    "en": "Northern Cyprus",
    "es": "Chipre del Norte"
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
  "ERI": {
    "en": "Eritrea",
    "es": "Eritrea"
  },
  "ESH": {
    "en": "Western Sahara",
    "es": "Sahara Occidental"
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
  "FRO": {
    "en": "Faroe Islands",
    "es": "Islas Feroe"
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
  "GGY": {
    "en": "Guernsey",
    "es": "Guernsey"
  },
  "GHA": {
    "en": "Ghana",
    "es": "Ghana"
  },
  "GIN": {
    "en": "Guinea",
    "es": "Guinea"
  },
  "GLP": {
    "en": "Guadeloupe",
    "es": "Guadalupe"
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
  "GRL": {
    "en": "Greenland",
    "es": "Groenlandia"
  },
  "GTM": {
    "en": "Guatemala",
    "es": "Guatemala"
  },
  "GUF": {
    "en": "French Guiana",
    "es": "Guayana Francesa"
  },
  "GUM": {
    "en": "Guam",
    "es": "Guam"
  },
  "GUY": {
    "en": "Guyana",
    "es": "Guyana"
  },
  "HKG": {
    "en": "Hong Kong",
    "es": "Hong Kong"
  },
  "HMD": {
    "en": "Heard and McDonald Islands",
    "es": "Islas Heard y McDonald"
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
  "IMN": {
    "en": "Isle of Man",
    "es": "Isla de Man"
  },
  "IND": {
    "en": "India",
    "es": "India"
  },
  "IOT": {
    "en": "British Indian Ocean Territory",
    "es": "Territorio Británico del Océano Índico"
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
  "JEY": {
    "en": "Jersey",
    "es": "Jersey"
  },
  "JOR": {
    "en": "Jordan",
    "es": "Jordania"
  },
  "JPN": {
    "en": "Japan",
    "es": "Japón"
  },
  "KAS": {
    "en": "Kashmir (disputed)",
    "es": "Cachemira (disputado)"
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
  "LIE": {
    "en": "Liechtenstein",
    "es": "Liechtenstein"
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
  "MAF": {
    "en": "Saint Martin",
    "es": "San Martín"
  },
  "MAR": {
    "en": "Morocco",
    "es": "Marruecos"
  },
  "MCO": {
    "en": "Monaco",
    "es": "Mónaco"
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
  "MNP": {
    "en": "Northern Mariana Islands",
    "es": "Islas Marianas del Norte"
  },
  "MOZ": {
    "en": "Mozambique",
    "es": "Mozambique"
  },
  "MRT": {
    "en": "Mauritania",
    "es": "Mauritania"
  },
  "MSR": {
    "en": "Montserrat",
    "es": "Montserrat"
  },
  "MTQ": {
    "en": "Martinique",
    "es": "Martinica"
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
  "MYT": {
    "en": "Mayotte",
    "es": "Mayotte"
  },
  "NAM": {
    "en": "Namibia",
    "es": "Namibia"
  },
  "NCL": {
    "en": "New Caledonia",
    "es": "Nueva Caledonia"
  },
  "NER": {
    "en": "Niger",
    "es": "Níger"
  },
  "NFK": {
    "en": "Norfolk Island",
    "es": "Isla Norfolk"
  },
  "NGA": {
    "en": "Nigeria",
    "es": "Nigeria"
  },
  "NIC": {
    "en": "Nicaragua",
    "es": "Nicaragua"
  },
  "NIU": {
    "en": "Niue",
    "es": "Niue"
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
  "PCN": {
    "en": "Pitcairn Islands",
    "es": "Islas Pitcairn"
  },
  "PER": {
    "en": "Peru",
    "es": "Perú"
  },
  "PHL": {
    "en": "Philippines",
    "es": "Filipinas"
  },
  "PLW": {
    "en": "Palau",
    "es": "Palaos"
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
  "PRK": {
    "en": "North Korea",
    "es": "Corea del Norte"
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
  "PYF": {
    "en": "French Polynesia",
    "es": "Polinesia Francesa"
  },
  "QAT": {
    "en": "Qatar",
    "es": "Catar"
  },
  "REU": {
    "en": "Réunion",
    "es": "Reunión"
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
  "SGS": {
    "en": "South Georgia and South Sandwich Islands",
    "es": "Georgia del Sur"
  },
  "SHN": {
    "en": "Saint Helena",
    "es": "Santa Helena"
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
  "SOL": {
    "en": "Somaliland",
    "es": "Somalilandia"
  },
  "SOM": {
    "en": "Somalia",
    "es": "Somalia"
  },
  "SPM": {
    "en": "Saint Pierre and Miquelon",
    "es": "San Pedro y Miquelón"
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
  "SXM": {
    "en": "Sint Maarten",
    "es": "Sint Maarten"
  },
  "SYC": {
    "en": "Seychelles",
    "es": "Seychelles"
  },
  "SYR": {
    "en": "Syria",
    "es": "Siria"
  },
  "TCA": {
    "en": "Turks and Caicos",
    "es": "Turcas y Caicos"
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
  "TKL": {
    "en": "Tokelau",
    "es": "Tokelau"
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
  "VAT": {
    "en": "Vatican City",
    "es": "Ciudad del Vaticano"
  },
  "VCT": {
    "en": "Saint Vincent and the Grenadines",
    "es": "San Vicente y las Granadinas"
  },
  "VEN": {
    "en": "Venezuela",
    "es": "Venezuela"
  },
  "VGB": {
    "en": "British Virgin Islands",
    "es": "Islas Vírgenes Británicas"
  },
  "VIR": {
    "en": "US Virgin Islands",
    "es": "Islas Vírgenes (EEUU)"
  },
  "VNM": {
    "en": "Vietnam",
    "es": "Vietnam"
  },
  "VUT": {
    "en": "Vanuatu",
    "es": "Vanuatu"
  },
  "WLF": {
    "en": "Wallis and Futuna",
    "es": "Wallis y Futuna"
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
