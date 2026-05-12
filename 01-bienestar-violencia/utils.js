// Utils compartidos por scatter.js y timeseries.js (formato de números, ticks).
// Específicos del N°1; eventualmente migrarán a lib/utils.js.
// Depende de LANG (definido en i18n-issue.js, cargado antes).

// Detección de dispositivo con hover (desktop con mouse) vs solo touch (mobile).
// En mobile el hover no funciona bien — los handlers mouseenter/mouseleave
// quedan pegados después del tap. Cuando HAS_HOVER es false, los charts
// adaptan la interacción a tap-toggle en lugar de hover persistente.
const HAS_HOVER = window.matchMedia('(hover: hover)').matches;

const fmt = (n, dec=0) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const locale = LANG === 'es' ? 'es-AR' : 'en-US';
  return n.toLocaleString(locale, {minimumFractionDigits: dec, maximumFractionDigits: dec});
};

const fmtSmart = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const locale = LANG === 'es' ? 'es-AR' : 'en-US';
  if (Math.abs(n) >= 100) return n.toLocaleString(locale, {maximumFractionDigits: 0});
  return n.toLocaleString(locale, {maximumFractionDigits: 1});
};

function niceLog10Ticks(min, max) {
  const ticks = [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  for (let p = lo; p <= hi; p++) {
    const base = Math.pow(10, p);
    [1, 2, 5].forEach(m => {
      const v = m * base;
      if (v >= min * 0.95 && v <= max * 1.05) ticks.push(v);
    });
  }
  return ticks;
}

function niceLinearTicks(min, max, target=6) {
  const range = max - min;
  if (range <= 0) return [];
  const rough = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  let step;
  if (norm < 1.5) step = pow;
  else if (norm < 3) step = 2 * pow;
  else if (norm < 7) step = 5 * pow;
  else step = 10 * pow;
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

function fmtTickGDP(v) {
  if (v >= 1000) {
    const n = v / 1000;
    // Sin decimal cuando es entero ($1k, $10k, $100k); decimal solo si lo
    // necesita ($1.5k para ticks intermedios poco habituales).
    return '$' + (Number.isInteger(n) ? n : n.toFixed(1)) + 'k';
  }
  return '$' + v;
}
