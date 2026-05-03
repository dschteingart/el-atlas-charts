// Utils compartidos por scatter.js y timeseries.js (formato de números, ticks).
// Específicos del N°1; eventualmente migrarán a lib/utils.js.
// Depende de LANG (definido en i18n-issue.js, cargado antes).

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
  if (v >= 1000) return '$' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k';
  return '$' + v;
}
