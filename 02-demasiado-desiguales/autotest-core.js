// =============================================================
//  El Atlas · Escuela UNSAM 2026 · Autotest de ingresos (núcleo)
// =============================================================
//
// Funciones de cálculo compartidas por autotest.html (estudiantes) y
// autotest-sala.html (tablero docente). Requiere, cargados antes:
//   ./data-autotest.js        (AUTOTEST_META / _COUNTRIES / _WORLD / _PLR / _GDPPC)
//   ../lib/country-names.js   (COUNTRY_NAMES[iso3].es)
//
// Páginas ocultas de clase: solo castellano, sin CSV/PNG/editor.

const AT_LATAM = 'Latin America & Caribbean';

// Región Banco Mundial para las economías que están en AUTOTEST_PLR (FMI) pero
// no tienen encuesta en PIP (AUTOTEST_COUNTRIES). Solo sirve para la etiqueta
// gris del buscador y para pintar de terracota a América Latina.
const AT_REGION_EXTRA = {
  AND: 'Europe & Central Asia', ATG: AT_LATAM, ABW: AT_LATAM,
  AZE: 'Europe & Central Asia', BHR: 'Middle East, North Africa, Afghanistan & Pakistan',
  BRN: 'East Asia & Pacific', KHM: 'East Asia & Pacific', DMA: AT_LATAM, GUY: AT_LATAM,
  HKG: 'East Asia & Pacific', UVK: 'Europe & Central Asia',
  KWT: 'Middle East, North Africa, Afghanistan & Pakistan',
  LBY: 'Middle East, North Africa, Afghanistan & Pakistan', MAC: 'East Asia & Pacific',
  NZL: 'East Asia & Pacific', OMN: 'Middle East, North Africa, Afghanistan & Pakistan',
  PLW: 'East Asia & Pacific', PNG: 'East Asia & Pacific', PRI: AT_LATAM,
  SMR: 'Europe & Central Asia', SAU: 'Middle East, North Africa, Afghanistan & Pakistan',
  SGP: 'East Asia & Pacific', SOM: 'Sub-Saharan Africa', KNA: AT_LATAM, VCT: AT_LATAM,
  BHS: AT_LATAM, TTO: AT_LATAM, TKM: 'Europe & Central Asia', VEN: AT_LATAM,
  LIE: 'Europe & Central Asia'
};

// Nombres cortos en castellano (mismos que 'reg-short.*' de i18n-issue.js).
const AT_REGION_SHORT_ES = {
  'Latin America & Caribbean': 'Latam y Caribe',
  'Sub-Saharan Africa': 'África Subsahariana',
  'Europe & Central Asia': 'Europa y Asia Central',
  'East Asia & Pacific': 'Asia Oriental',
  'South Asia': 'Asia del Sur',
  'Middle East, North Africa, Afghanistan & Pakistan': 'Medio Oriente',
  'North America': 'América del Norte'
};

// El FMI usa UVK para Kosovo; la lib de nombres lo tiene como XKX.
const AT_NAME_ALIAS = { UVK: 'XKX' };

// Los deciles se ubican en el centro de su tramo de población.
const AT_DECILE_PCT = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];

// ---------- Conversión de moneda ----------

function atPlr(iso) {
  const c = AUTOTEST_COUNTRIES[iso];
  const p = (c && c.p != null) ? c.p : AUTOTEST_PLR[iso];
  return (typeof p === 'number' && p > 0) ? p : null;
}

// US$ de mercado de 2026 por mes y por hogar → US$ internacionales de 2021
// por persona y por día: nivel de precios del FMI (2026) e inflación de EE.UU.
function toDailyPPP(iso, usdMonth, persons) {
  const plr = atPlr(iso);
  if (plr == null) return null;
  const dailyUsd = usdMonth / persons / (365 / 12);
  return dailyUsd / plr / AUTOTEST_META.infl_us_2021_2026;
}

// ---------- Percentiles ----------

function atHasDist(iso) {
  const c = AUTOTEST_COUNTRIES[iso];
  return !!(c && Array.isArray(c.d) && c.d.length === 10 && c.d.every(v => v > 0));
}

// Interpolación lineal en ln(ingreso) contra percentil entre los deciles
// (P5…P95). Por debajo de D1 y por encima de D10 se extrapola con la
// pendiente del tramo extremo, con piso 0,5 y techo 99,5.
function countryPercentile(iso, x) {
  if (!atHasDist(iso) || !(x > 0)) return null;
  const L = AUTOTEST_COUNTRIES[iso].d.map(Math.log);
  const P = AT_DECILE_PCT;
  const lx = Math.log(x);
  if (lx <= L[0]) {
    const den = L[1] - L[0];
    const slope = den > 0 ? (P[1] - P[0]) / den : 0;
    return Math.max(0.5, P[0] + (lx - L[0]) * slope);
  }
  if (lx >= L[9]) {
    const den = L[9] - L[8];
    const slope = den > 0 ? (P[9] - P[8]) / den : 0;
    return Math.min(99.5, P[9] + (lx - L[9]) * slope);
  }
  for (let i = 0; i < 9; i++) {
    if (lx <= L[i + 1]) {
      const den = L[i + 1] - L[i];
      if (den <= 0) return P[i + 1];
      return P[i] + (P[i + 1] - P[i]) * (lx - L[i]) / den;
    }
  }
  return 99.5;
}

// Curva acumulada mundial (AUTOTEST_WORLD, ordenada por ingreso) en ln(ingreso).
// Fuera del rango de la curva se prolonga el tramo extremo; resultado en [0,1; 99,9].
let _atWorldLog = null;
function worldPercentile(x) {
  if (!(x > 0)) return null;
  const W = AUTOTEST_WORLD;
  if (!_atWorldLog) _atWorldLog = W.map(pt => Math.log(pt[0]));
  const LW = _atWorldLog;
  const n = W.length;
  const lx = Math.log(x);
  const clamp = v => Math.min(99.9, Math.max(0.1, v));
  const seg = (i, j) => {
    const den = LW[j] - LW[i];
    if (den <= 0) return clamp(W[j][1]);
    return clamp(W[i][1] + (W[j][1] - W[i][1]) * (lx - LW[i]) / den);
  };
  if (lx <= LW[0]) return seg(0, 1);
  if (lx >= LW[n - 1]) return seg(n - 2, n - 1);
  // Búsqueda binaria del primer punto con ln(ingreso) >= lx
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (LW[mid] < lx) lo = mid; else hi = mid;
  }
  return seg(lo, hi);
}

// Ingreso en el P50 del país: interpolación logarítmica entre D5 (P45) y D6 (P55).
function medianIncome(iso) {
  if (!atHasDist(iso)) return null;
  const d = AUTOTEST_COUNTRIES[iso].d;
  return Math.exp((Math.log(d[4]) + Math.log(d[5])) / 2);
}

// ---------- La torta (distribución lognormal) ----------

// Inversa de la normal estándar (algoritmo de Acklam, error relativo < 1,2e-9).
function atNormInv(p) {
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// Sigma de la lognormal con Gini G (en puntos, 0-100).
function sigma(G) {
  return Math.SQRT2 * atNormInv((G / 100 + 1) / 2);
}

// Ingreso del cuantil q como múltiplo de la media.
function quantileFactor(G, q) {
  const s = sigma(G);
  return Math.exp(-s * s / 2 + s * atNormInv(q));
}

// PIB per cápita anual (PPA, US$ de 2021) para que el cuantil q gane targetDaily
// por día, si las encuestas captan survey_to_gdp del PIB.
function requiredGDPpc(targetDaily, G, q) {
  return targetDaily / quantileFactor(G, q) * 365 / AUTOTEST_META.survey_to_gdp;
}

// ---------- Países: nombres, regiones, universo ----------

function atName(iso) {
  const key = AT_NAME_ALIAS[iso] || iso;
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key] && COUNTRY_NAMES[key].es) {
    return COUNTRY_NAMES[key].es;
  }
  const c = AUTOTEST_COUNTRIES[iso];
  return (c && c.n) || iso;
}

function atNameEn(iso) {
  const key = AT_NAME_ALIAS[iso] || iso;
  if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key] && COUNTRY_NAMES[key].en) {
    return COUNTRY_NAMES[key].en;
  }
  const c = AUTOTEST_COUNTRIES[iso];
  return (c && c.n) || iso;
}

function atRegion(iso) {
  const c = AUTOTEST_COUNTRIES[iso];
  return (c && c.r) || AT_REGION_EXTRA[iso] || null;
}

function atIsLatam(iso) { return atRegion(iso) === AT_LATAM; }

function atRegionShort(iso) {
  const r = atRegion(iso);
  return (r && AT_REGION_SHORT_ES[r]) || '';
}

function atNormalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Países que se pueden calcular: con nombre conocido (los agregados regionales
// del FMI quedan afuera) y con nivel de precios disponible.
let _atUniverse = null;
function atUniverse() {
  if (_atUniverse) return _atUniverse;
  const isos = new Set(Object.keys(AUTOTEST_COUNTRIES).concat(Object.keys(AUTOTEST_PLR)));
  const out = [];
  isos.forEach(iso => {
    const key = AT_NAME_ALIAS[iso] || iso;
    const named = (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[key]) || AUTOTEST_COUNTRIES[iso];
    if (!named || atPlr(iso) == null) return;
    const name = atName(iso);
    out.push({
      iso, name,
      nameEn: atNameEn(iso),
      norm: atNormalize(name),
      normEn: atNormalize(atNameEn(iso)),
      region: atRegion(iso),
      latam: atIsLatam(iso),
      hasDist: atHasDist(iso)
    });
  });
  out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  _atUniverse = out;
  return out;
}

function atInUniverse(iso) {
  return atUniverse().some(c => c.iso === iso);
}

// ---------- Cálculo completo de una respuesta ----------

function atCompute(iso, usdMonth, persons) {
  const ppp = toDailyPPP(iso, usdMonth, persons);
  if (ppp == null || !(ppp > 0)) return null;
  return { iso, usdMonth, persons, ppp, pc: countryPercentile(iso, ppp), pw: worldPercentile(ppp) };
}

// ---------- Números ----------

// Acepta "2500", "2.500", "2,500", "2.500,50", "2500.5", "US$ 2500".
function atParseNumber(str) {
  if (typeof str === 'number') return str;
  let s = String(str == null ? '' : str).trim().toLowerCase();
  s = s.replace(/us\$|usd|u\$s|\$|dolares|dólares/g, '').replace(/[\s ']/g, '');
  if (!s) return NaN;
  if (!/^[0-9.,]+$/.test(s)) return NaN;
  const hasDot = s.includes('.'), hasComma = s.includes(',');
  if (hasDot && hasComma) {
    const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    const thou = dec === '.' ? ',' : '.';
    s = s.split(thou).join('');
    if (dec === ',') s = s.replace(',', '.');
  } else if (hasDot) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.split('.').join('');
    else if ((s.match(/\./g) || []).length > 1) return NaN;
  } else if (hasComma) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.split(',').join('');
    else if ((s.match(/,/g) || []).length > 1) return NaN;
    else s = s.replace(',', '.');
  }
  const v = parseFloat(s);
  return isFinite(v) ? v : NaN;
}

function atFmt(x, dec) {
  if (x == null || !isFinite(x)) return '';
  const d = dec == null ? 0 : dec;
  return x.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// Percentil para mostrar: entero, salvo en los extremos (menos de 1 o 99 y más).
function atFmtPct(p) {
  if (p == null || !isFinite(p)) return '';
  if (p >= 99 || p < 1) return atFmt(Math.floor(p * 10) / 10, 1);
  return atFmt(Math.round(p), 0);
}

// Ingreso diario: un decimal por debajo de 100, entero arriba.
function atFmtDaily(x) {
  return x < 100 ? atFmt(x, 1) : atFmt(x, 0);
}

function atMedian(arr) {
  const v = arr.filter(x => x != null && isFinite(x)).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Chequeo de referencia (ver el pedido original). Se llama a mano desde la consola.
function atSanityCheck() {
  const r = atCompute('ARG', 2500, 2);
  const out = {
    arg_ppp: +r.ppp.toFixed(2),
    arg_world_pct: +r.pw.toFixed(2),
    arg_country_pct: +r.pc.toFixed(2),
    req_60_latam_q50: Math.round(requiredGDPpc(60, AUTOTEST_META.gini_latam, 0.5)),
    req_60_nordic_q50: Math.round(requiredGDPpc(60, AUTOTEST_META.gini_nordic, 0.5)),
    universe: atUniverse().length
  };
  console.log('[autotest] sanity', out);
  return out;
}
