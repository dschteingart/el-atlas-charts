# PROMPT INICIAL — N° 3 de El Atlas (Fútbol) en Claude Code

> Pegá este mensaje como primer prompt en la sesión de Claude Code del repo `el-atlas-charts`.
> Antes, copiá la carpeta `handoff-futbol/` (este bundle) a algún lado donde Claude Code la pueda leer (ej. `_handoff-futbol/` en la raíz del repo).

---

## Mensaje a pegar:

Vamos a armar el **N° 3 de El Atlas: Fútbol**. Es un gráfico nuevo prototipado en Claude Chat que hay que integrar a la arquitectura modular de este repo (la misma `lib/` que usa el N° 1).

Antes de tocar código, **leé en orden**:

1. **`_handoff-futbol/HANDOFF.md`** — documento maestro de este gráfico: qué es, los datos, la metodología, las decisiones de diseño y los gotchas. Lectura completa y obligatoria.
2. **`_handoff-futbol/current_state/scatter_elo_pib.html`** — el gráfico funcionando. Es la **referencia visual y de comportamiento**. NO lo copies literal: refactorizalo a la arquitectura modular (reusá `lib/chart-scatter.js`, `lib/label-placement.js`, el buscador del chart 3, etc.).
3. **`_handoff-futbol/data/series_elo_pib.json`** — los datos del scatter (series ELO + PIB por país, 1980–2026).
4. **`_handoff-futbol/data/futbol_paises.csv`** — resumen por país con todo (clubes, año mediano de fundación, federación, FIFA, ELO, residuos), por si armamos gráficos secundarios.

### Qué es el gráfico (resumen)
Un scatter **ELO de la selección (Y) vs PIB total PPA en log (X)**, coloreado por **confederación FIFA** (las "regiones" de este número), con **regresión global** y **residuos** — la excepcionalidad sudamericana es que CONMEBOL queda muy por encima de la recta. La feature nueva respecto al N° 1 es un **slider temporal** (1980–2026) que recalcula todo.

### Lo que necesito de vos antes de codear
- **Resumime en ≤200 palabras** qué entendiste y cómo pensás encajarlo en `lib/` (qué reusás, qué hay que agregar — sobre todo el slider temporal).
- **Confirmame el plan** o proponé mejoras con rationale.
- **Decidamos el alcance de la primera sesión.** Mi sugerencia: integrar el scatter ELO–PIB con su slider, reusando la lib, hasta que se vea y se comporte igual que el `current_state`. Los gráficos secundarios (año mediano de clubes, etc.) los dejamos para después.

### Gotchas que NO hay que romper (están en el HANDOFF, los repito por importantes)
- La **regresión / R² / residuos dependen solo del slider, nunca del clic** en confederaciones (el clic solo oculta puntos).
- **Nada de transiciones D3 en el redibujo del slider** (dan lag); redibujo instantáneo, opacidad por CSS.
- Moneda en **español**: `mil M` y `bill.`, nunca B/T anglo.
- **CONMEBOL etiquetado por defecto** (como el N° 1 muestra LATAM).
- Verificá las **confederaciones** (hubo un bug feo con territorios de ultramar: FRA/GBR caían en CONCACAF).

### Cómo trabajar / Git
Soy lego programando: explicá qué hacés y por qué, sin sobre-explicar lo básico. Andá por bloques, cerrá uno antes del siguiente, preguntame en tradeoffs reales. Rama nueva (ej. `feat/03-futbol`), commits chicos, **no push directo a main** — quiero ver la rama y validar en preview antes de mergear. Mostrame screenshots cuando importa visualmente.

---

¿Listo? Empezá leyendo el HANDOFF y el current_state, después me contás qué entendiste y arrancamos.
