# Handoff — El Atlas N° 3 (Fútbol)

Bundle para integrar el gráfico **scatter ELO vs PIB** (excepcionalidad futbolística sudamericana) al repo modular `el-atlas-charts` en Claude Code.

## Por dónde empezar

1. **`PROMPT_INICIAL.md`** — copiá su contenido y pegalo como primer mensaje en la sesión de Claude Code.
2. **`HANDOFF.md`** — documento maestro (qué es, datos, metodología, decisiones, gotchas). Lectura obligatoria para Claude Code.

## Contenido

```
handoff-futbol/
├── README.md                     # este archivo
├── PROMPT_INICIAL.md             # mensaje para pegar en Claude Code
├── HANDOFF.md                    # documento maestro
├── current_state/
│   ├── scatter_elo_pib.html      # el gráfico funcionando (referencia visual y de comportamiento)
│   └── elo_gdp_data.js           # datos que usa ese HTML
└── data/
    ├── series_elo_pib.json       # series ELO + PIB por país, 1980–2026 (para el scatter)
    └── futbol_paises.csv         # resumen por país: clubes, año mediano de fundación, federación, FIFA, ELO, residuos
```

## El gráfico en una línea

Scatter de **ELO de la selección (Y)** vs **PIB total PPA en log (X)**, coloreado por **confederación FIFA**, con regresión global y residuos, y un **slider temporal** (1980–2026). Muestra que **CONMEBOL rinde muy por encima de lo que su economía predice** (+273 de residuo medio; Uruguay es el outlier máximo del mundo, +473).

## Cómo abrir el gráfico de referencia localmente

`current_state/scatter_elo_pib.html` necesita un servidor HTTP (carga `elo_gdp_data.js`) y conexión a internet (D3 + fuentes desde CDN). Rápido:

```
cd current_state
python -m http.server 8000
# abrir http://localhost:8000/scatter_elo_pib.html
```
