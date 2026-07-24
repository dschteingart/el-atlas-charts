// El Atlas N°5 — Chart 7: "Primero los de acá" (prioridad en el empleo, 1990-2023).
// Strings propias de este chart. Se cargan DESPUÉS de i18n-issue.js (que declara
// I18N) y ANTES de prioridad.js. No tocar i18n-issue.js (lo editan otros agentes).
// Las claves compartidas (issue-num, ctrl-select, c1-search-ph, c2-period-label,
// footer-download*, ctrl-show-method, chip-remove, brand/attribution) ya existen
// en i18n-issue.js o en lib/i18n.js.

Object.assign(I18N.es, {
  // Títulos: neutral por default (decisión editorial del N°5), editorial disponible.
  'c7-title':          'Primero los de acá: 33 años de prioridad a los nativos',
  'c7-title-neutral':  'Quién tiene prioridad cuando escasea el trabajo',

  // Subtítulo (uno por indicador; el toggle lo cambia).
  'c7-subtitle-origen': 'Porcentaje de acuerdo con que, cuando escasea el trabajo, los nativos deberían tener prioridad sobre los inmigrantes, a lo largo del tiempo (Integrated Values Survey, 1990-2023).',
  'c7-subtitle-genero': 'Porcentaje de acuerdo con que, cuando escasea el trabajo, los varones deberían tener más derecho a un empleo que las mujeres, a lo largo del tiempo (Integrated Values Survey, 1990-2023).',

  // Toggle de indicador.
  'c7-ind-label':   'Prioridad para…',
  'c7-ind-origen':  'Los nativos',
  'c7-ind-genero':  'Los varones',

  'c7-axis-y':      '% de acuerdo',

  'c7-sources':     'Datos: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), olas 2 a 7. Dos afirmaciones de la misma batería: «cuando escasea el trabajo, los nativos deberían tener prioridad sobre los inmigrantes» y «…los varones deberían tener más derecho a un empleo que las mujeres». Se grafica el % que responde «de acuerdo» sobre el total de respuestas válidas (de acuerdo / ni de acuerdo ni en desacuerdo / en desacuerdo): el «ni una ni otra» queda en el denominador. % ponderado (S017); solo celdas con al menos 200 casos. El eje horizontal va en el <em>año real</em> de la encuesta, no en el número de ola (las olas no coinciden entre países). Prioridad a los nativos: 115 países, 390 mediciones; prioridad a los varones: 117 países. Con unos 1.000 casos por punto el error estándar ronda los 1,6 puntos: movimientos de pocos puntos no son informativos. Cualquier promedio regional exige un panel balanceado de países, porque la muestra pasa de unos 42 países en la ola 2 a unos 92 en la ola 7. Mide actitudes <em>declaradas</em> ante un encuestador.'
});

Object.assign(I18N.en, {
  'c7-title':          'Locals first: 33 years of priority for the native-born',
  'c7-title-neutral':  'Who gets priority when jobs are scarce',

  'c7-subtitle-origen': 'Share who agree that, when jobs are scarce, employers should give priority to the native-born over immigrants, over time (Integrated Values Survey, 1990-2023).',
  'c7-subtitle-genero': 'Share who agree that, when jobs are scarce, men should have more right to a job than women, over time (Integrated Values Survey, 1990-2023).',

  'c7-ind-label':   'Priority for…',
  'c7-ind-origen':  'Native-born',
  'c7-ind-genero':  'Men',

  'c7-axis-y':      '% who agree',

  'c7-sources':     'Data: Integrated Values Survey (EVS 1981-2021 + WVS 1981-2022), waves 2 to 7. Two statements from the same battery: "when jobs are scarce, employers should give priority to [nation] people over immigrants" and "…men should have more right to a job than women." The chart shows the % answering "agree" out of all valid responses (agree / neither / disagree): the "neither" stays in the denominator. Weighted % (S017); only cells with at least 200 cases. The horizontal axis is the <em>real survey year</em>, not the wave number (waves do not line up across countries). Priority for the native-born: 115 countries, 390 measurements; priority for men: 117 countries. With about 1,000 cases per point the standard error is around 1.6 points: shifts of a few points are not informative. Any regional average requires a balanced panel of countries, since the sample grows from about 42 countries in wave 2 to about 92 in wave 7. Measures attitudes <em>declared</em> to an interviewer.'
});
