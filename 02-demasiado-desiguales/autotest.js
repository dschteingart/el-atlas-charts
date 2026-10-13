// =============================================================
//  El Atlas · Escuela UNSAM 2026 · Autotest (página del estudiante)
// =============================================================
//
// Parámetros de URL:
//   ?test=1    envía igual, marcado "test":1, y NO deja la marca local
//   ?nosend=1  nunca envía (para probar la página)

const AT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe3Z4X-qa66P5tanwvakJSpXYKrP124aYhMPzrdM91-bU4j_g/formResponse';
const AT_FIELDS = {
  iso: 'entry.964443106',
  income: 'entry.2122007057',
  persons: 'entry.1956420228',
  calc: 'entry.1127284732'
};
const AT_SENT_KEY = 'autotest-unsam-2026-sent';
const AT_COMPARE = ['USA', 'ESP', 'BRA', 'IND'];
// Orden del buscador vacío: América Latina, con los países grandes primero.
const AT_LATAM_TOP = ['ARG', 'BRA', 'CHL', 'COL', 'MEX', 'PER', 'URY', 'PRY', 'BOL', 'ECU', 'VEN'];

const atParams = new URLSearchParams(location.search);
const AT_TEST = atParams.get('test') === '1';
const AT_NOSEND = atParams.get('nosend') === '1';

const atState = { iso: null, last: null, sentThisLoad: false };

function atEsc(s) {
  return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// ---------------- Buscador de país (patrón .m-search de la casa) ----------------

function atSetupCountrySearch() {
  const input = document.getElementById('at-country');
  const results = document.getElementById('at-country-results');
  const universe = atUniverse();
  const byIso = {};
  universe.forEach(c => { byIso[c.iso] = c; });
  const latamList = AT_LATAM_TOP.filter(k => byIso[k]).map(k => byIso[k])
    .concat(universe.filter(c => c.latam && AT_LATAM_TOP.indexOf(c.iso) < 0));
  // Lista completa para la caja vacía: América Latina primero y después el resto del mundo, en orden alfabético.
  const restList = universe.filter(c => !c.latam).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const browseList = latamList.concat(restList);
  const nLatam = latamList.length;
  let matches = [];
  let activeIdx = -1;
  let browsing = false;

  function getMatches(q) {
    const qn = atNormalize(q);
    if (!qn) return browseList;
    const scored = [];
    universe.forEach(c => {
      let s = null;
      if (c.norm.startsWith(qn)) s = 0;
      else if (c.norm.includes(' ' + qn)) s = 1;
      else if (c.norm.includes(qn)) s = 2;
      else if (c.normEn.startsWith(qn) || c.iso.toLowerCase() === qn) s = 3;
      else if (c.normEn.includes(qn)) s = 4;
      if (s !== null) scored.push({ c, s: s * 2 + (c.latam ? 0 : 1) });
    });
    scored.sort((a, b) => a.s - b.s || a.c.name.localeCompare(b.c.name, 'es'));
    return scored.slice(0, 8).map(x => x.c);
  }

  function close() {
    results.classList.remove('open');
    results.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  }

  function render() {
    if (!matches.length) {
      results.innerHTML = '<div class="at-search-hint">Sin coincidencias</div>';
      results.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    const hint = browsing ? '<div class="at-search-hint">América Latina y el Caribe</div>' : '';
    results.innerHTML = hint + matches.map((c, i) => {
      const cls = 'm-search-result' + (i === activeIdx ? ' m-active' : '') + (c.iso === atState.iso ? ' m-already' : '');
      const sep = (browsing && i === nLatam) ? '<div class="at-search-hint">Resto del mundo</div>' : '';
      return sep + `<div class="${cls}" role="option" data-iso="${c.iso}">${atEsc(c.name)}${browsing ? '' : `<span class="m-search-region">${atEsc(atRegionShort(c.iso))}</span>`}</div>`;
    }).join('');
    results.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
    results.querySelectorAll('.m-search-result[data-iso]').forEach(el => {
      el.addEventListener('mousedown', ev => ev.preventDefault());
      el.addEventListener('click', () => choose(el.dataset.iso, true));
    });
    const act = results.querySelector('.m-active');
    if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    browsing = !atNormalize(input.value) || (atState.iso && byIso[atState.iso] && input.value === byIso[atState.iso].name);
    matches = browsing ? browseList : getMatches(input.value);
    activeIdx = -1;
    render();
  }

  function choose(iso, advance) {
    const c = byIso[iso];
    if (!c) return;
    atState.iso = iso;
    input.value = c.name;
    close();
    atHideError('at-country-err');
    if (advance) {
      const inc = document.getElementById('at-income');
      if (inc && !inc.value) inc.focus();
    }
  }

  input.addEventListener('focus', open);
  input.addEventListener('click', () => { if (!results.classList.contains('open')) open(); });
  input.addEventListener('input', () => {
    const qn = atNormalize(input.value);
    const exact = universe.find(c => c.norm === qn);
    atState.iso = exact ? exact.iso : null;
    browsing = !qn;
    matches = getMatches(input.value);
    activeIdx = (qn && matches.length) ? 0 : -1;
    render();
  });
  input.addEventListener('keydown', ev => {
    const isOpen = results.classList.contains('open');
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (!isOpen) { open(); }
      if (!matches.length) return;
      activeIdx = (activeIdx + 1) % matches.length;
      render();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!isOpen || !matches.length) return;
      activeIdx = (activeIdx - 1 + matches.length) % matches.length;
      render();
    } else if (ev.key === 'Enter') {
      if (isOpen && activeIdx >= 0 && matches[activeIdx]) {
        ev.preventDefault();
        choose(matches[activeIdx].iso, true);
      } else if (isOpen) {
        ev.preventDefault();
        close();
      }
    } else if (ev.key === 'Escape') {
      close();
    } else if (ev.key === 'Tab') {
      if (isOpen && activeIdx >= 0 && matches[activeIdx]) choose(matches[activeIdx].iso, false);
      else close();
    }
  });
  input.addEventListener('blur', () => {
    // Si escribió el nombre exacto sin elegirlo de la lista, lo damos por elegido.
    const qn = atNormalize(input.value);
    if (!atState.iso && qn) {
      const exact = universe.find(c => c.norm === qn || c.normEn === qn);
      if (exact) choose(exact.iso, false);
    }
    setTimeout(close, 120);
  });
  document.addEventListener('click', ev => {
    if (!input.contains(ev.target) && !results.contains(ev.target)) close();
  });
}

// ---------------- Validación ----------------

function atShowError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
function atHideError(id) {
  const el = document.getElementById(id);
  if (el) { el.hidden = true; el.textContent = ''; }
}

function atReadForm() {
  let ok = true;
  const out = {};
  // País
  if (!atState.iso) {
    const txt = document.getElementById('at-country').value.trim();
    atShowError('at-country-err', txt ? 'No encontramos ese país. Elegilo de la lista.' : 'Elegí tu país de la lista.');
    ok = false;
  } else {
    atHideError('at-country-err');
    out.iso = atState.iso;
  }
  // Ingreso
  const incRaw = document.getElementById('at-income').value;
  const inc = atParseNumber(incRaw);
  if (!incRaw.trim()) {
    atShowError('at-income-err', 'Escribí el ingreso mensual de tu hogar, en dólares.');
    ok = false;
  } else if (!isFinite(inc)) {
    atShowError('at-income-err', 'Escribí solo el número, por ejemplo 2500.');
    ok = false;
  } else if (inc < 20) {
    atShowError('at-income-err', 'Parece muy poco para un mes. Escribí el número completo, por ejemplo 2500.');
    ok = false;
  } else if (inc > 100000) {
    atShowError('at-income-err', 'Parece demasiado alto. El máximo que acepta el ejercicio es US$ 100.000 por mes.');
    ok = false;
  } else {
    atHideError('at-income-err');
    out.income = Math.round(inc * 100) / 100;
  }
  // Personas
  const perRaw = document.getElementById('at-persons').value.trim();
  const per = /^\d{1,2}$/.test(perRaw) ? parseInt(perRaw, 10) : NaN;
  if (!perRaw) {
    atShowError('at-persons-err', 'Indicá cuántas personas viven en tu hogar (si vivís solo o sola, 1).');
    ok = false;
  } else if (!(per >= 1 && per <= 20)) {
    atShowError('at-persons-err', 'Tiene que ser un número entero entre 1 y 20.');
    ok = false;
  } else {
    atHideError('at-persons-err');
    out.persons = per;
  }
  return ok ? out : null;
}

// ---------------- Tira 0-100 (SVG) ----------------

function atStripSVG(container, p, label) {
  const W = Math.max(260, Math.round(container.clientWidth || 320));
  const H = 72;
  const padL = 2, padR = 2;
  const barY = 34, barH = 14;
  const x = v => padL + (W - padL - padR) * v / 100;
  const xp = x(Math.max(0, Math.min(100, p)));
  const sans = '"Source Sans 3", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${atEsc(label)}" xmlns="http://www.w3.org/2000/svg">`;
  // Fondo + parte de la población que gana menos
  s += `<rect x="${x(0)}" y="${barY}" width="${x(100) - x(0)}" height="${barH}" rx="2" fill="#ECE7D8"/>`;
  s += `<rect x="${x(0)}" y="${barY}" width="${Math.max(0, xp - x(0))}" height="${barH}" rx="2" fill="#E9CBB9"/>`;
  // Separadores de decil
  for (let k = 10; k < 100; k += 10) {
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${barY}" y2="${barY + barH}" stroke="#FAF8F3" stroke-width="1.5"/>`;
  }
  // Marcador
  s += `<line x1="${xp}" x2="${xp}" y1="${barY - 10}" y2="${barY + barH + 3}" stroke="#BE5D32" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="${xp}" cy="${barY - 12}" r="6" fill="#BE5D32" stroke="#FAF8F3" stroke-width="2"/>`;
  const anchor = xp < 34 ? 'start' : (xp > W - 34 ? 'end' : 'middle');
  const lx = anchor === 'start' ? Math.max(0, xp - 6) : anchor === 'end' ? Math.min(W, xp + 6) : xp;
  s += `<text x="${lx}" y="${barY - 22}" text-anchor="${anchor}" font-family='${sans}' font-size="13" font-weight="700" fill="#8B3F1E">Vos</text>`;
  // Escala
  const ty = barY + barH + 18;
  s += `<text x="${x(0)}" y="${ty}" text-anchor="start" font-family='${sans}' font-size="12.5" fill="#8A8579">0 · más pobre</text>`;
  s += `<text x="${x(50)}" y="${ty}" text-anchor="middle" font-family='${sans}' font-size="12.5" fill="#8A8579">50</text>`;
  s += `<text x="${x(100)}" y="${ty}" text-anchor="end" font-family='${sans}' font-size="12.5" fill="#8A8579">más rico · 100</text>`;
  s += '</svg>';
  container.innerHTML = s;
}

// ---------------- Resultado ----------------

function atRenderResult(r) {
  atState.last = r;
  const sec = document.getElementById('at-result');
  const c = AUTOTEST_COUNTRIES[r.iso];
  const name = atName(r.iso);
  sec.hidden = false;

  // País
  const cb = document.getElementById('at-country-block');
  if (r.pc != null) {
    const pcTxt = atFmtPct(r.pc);
    cb.innerHTML =
      `<div class="at-big">
        <p class="at-big-head">Percentil <span class="at-big-val">${pcTxt}</span> en ${atEsc(name)}</p>
        <div class="at-strip" id="at-strip-country"></div>
        <p class="at-big-text">Tu hogar tiene un ingreso por persona mayor que el del ${pcTxt}% de la población de ${atEsc(name)}.</p>
      </div>`;
  } else {
    cb.innerHTML = `<p class="at-nodist">${atEsc(name)} no tiene una encuesta de hogares reciente en la plataforma PIP del Banco Mundial, así que no podemos ubicarte dentro de tu país. Sí podemos ubicarte en el mundo.</p>`;
  }

  // Mundo
  const pwTxt = atFmtPct(r.pw);
  document.getElementById('at-world-block').innerHTML =
    `<div class="at-big">
      <p class="at-big-head">Percentil <span class="at-big-val">${pwTxt}</span> en el mundo</p>
      <div class="at-strip" id="at-strip-world"></div>
      <p class="at-big-text">Tu hogar tiene un ingreso por persona mayor que el de ${pwTxt} de cada 100 personas del mundo.</p>
    </div>`;

  atDrawStrips();

  document.getElementById('at-ppp').innerHTML =
    `Tu ingreso por persona equivale a <strong>US$ ${atFmtDaily(r.ppp)} por día</strong>, a paridad de poder adquisitivo (dólares de 2021).`;

  // Comparación con otros países
  const rows = AT_COMPARE.filter(k => k !== r.iso && atHasDist(k)).map(k => {
    const p = countryPercentile(k, r.ppp);
    const tag = AUTOTEST_COUNTRIES[k].w === 'c' ? '<span class="at-c-tag">(consumo)</span>' : '';
    return `<tr><td>${atEsc(atName(k))}${tag}</td><td class="at-c-val">${atFmtPct(p)}</td></tr>`;
  }).join('');
  document.getElementById('at-compare').innerHTML =
    `<h3>Con ese mismo ingreso por persona, estarías en el percentil…</h3><table><tbody>${rows}</tbody></table>`;

  // Notas
  const notes = [];
  if (c && r.pc != null) {
    notes.push(`La distribución de ${atEsc(name)} surge de su encuesta de hogares de ${c.y}, llevada a 2025.`);
    if (c.l === 'u') notes.push(`En ${atEsc(name)} la encuesta cubre solo a la población urbana.`);
    if (c.w === 'c') notes.push(`En ${atEsc(name)} la encuesta mide consumo, no ingreso.`);
  }
  notes.push('Comparación aproximada. Las encuestas de hogares subdeclaran los ingresos más altos y los niveles de precios son estimaciones del FMI para 2026. Datos: Banco Mundial (PIP) y FMI (WEO).');
  document.getElementById('at-notes').innerHTML = notes.map(t => `<p>${t}</p>`).join('');
}

function atDrawStrips() {
  const r = atState.last;
  if (!r) return;
  const sc = document.getElementById('at-strip-country');
  if (sc && r.pc != null) atStripSVG(sc, r.pc, `Percentil ${atFmtPct(r.pc)} en ${atName(r.iso)}`);
  const sw = document.getElementById('at-strip-world');
  if (sw) atStripSVG(sw, r.pw, `Percentil ${atFmtPct(r.pw)} en el mundo`);
}

// ---------------- Envío anónimo (Google Forms) ----------------

function atAlreadySent() {
  try { return localStorage.getItem(AT_SENT_KEY) === '1'; } catch (e) { return false; }
}
function atMarkSent() {
  try { localStorage.setItem(AT_SENT_KEY, '1'); } catch (e) { /* sin almacenamiento: se acepta */ }
}
function atShowSent() {
  const el = document.getElementById('at-sent');
  if (el) el.hidden = false;
}

function atMaybeSubmit(r) {
  if (AT_NOSEND) return;
  if (atState.sentThisLoad) { atShowSent(); return; }
  if (!AT_TEST && atAlreadySent()) { atShowSent(); return; }
  atState.sentThisLoad = true;
  const calc = JSON.stringify({
    v: 1,
    ppp: Math.round(r.ppp * 100) / 100,
    pc: r.pc == null ? null : Math.round(r.pc * 10) / 10,
    pw: Math.round(r.pw * 10) / 10,
    test: AT_TEST ? 1 : 0
  });
  const body = new URLSearchParams();
  body.append(AT_FIELDS.iso, r.iso);
  body.append(AT_FIELDS.income, String(r.usdMonth));
  body.append(AT_FIELDS.persons, String(r.persons));
  body.append(AT_FIELDS.calc, calc);
  try {
    fetch(AT_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    }).then(() => {
      if (!AT_TEST) atMarkSent();
      atShowSent();
    }).catch(() => {
      // Sin conexión: se reintenta en el próximo cálculo.
      atState.sentThisLoad = false;
    });
  } catch (e) {
    atState.sentThisLoad = false;
  }
}

// ---------------- Init ----------------

function atInit() {
  atSetupCountrySearch();

  const per = document.getElementById('at-persons');
  const step = d => {
    const v = parseInt(per.value, 10);
    const base = isFinite(v) ? v : (d > 0 ? 0 : 2);
    per.value = String(Math.min(20, Math.max(1, base + d)));
    atHideError('at-persons-err');
  };
  document.getElementById('at-persons-minus').addEventListener('click', () => step(-1));
  document.getElementById('at-persons-plus').addEventListener('click', () => step(1));
  per.addEventListener('input', () => { per.value = per.value.replace(/\D/g, '').slice(0, 2); });

  const inc = document.getElementById('at-income');
  inc.addEventListener('blur', () => {
    const v = atParseNumber(inc.value);
    if (isFinite(v) && v > 0) inc.value = atFmt(v, v % 1 ? 2 : 0);
  });

  document.getElementById('at-form').addEventListener('submit', ev => {
    ev.preventDefault();
    const f = atReadForm();
    if (!f) {
      const firstErr = document.querySelector('.at-error:not([hidden])');
      if (firstErr && firstErr.scrollIntoView) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const r = atCompute(f.iso, f.income, f.persons);
    if (!r) {
      atShowError('at-country-err', 'No tenemos el nivel de precios de ese país. Probá con otro.');
      return;
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    atRenderResult(r);
    const sec = document.getElementById('at-result');
    requestAnimationFrame(() => sec.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    atMaybeSubmit(r);
  });

  if (AT_TEST || AT_NOSEND) {
    document.getElementById('at-testflag').innerHTML =
      `<span class="at-testflag">${AT_NOSEND ? 'MODO PRUEBA · NO SE ENVÍA' : 'MODO PRUEBA · ENVÍO MARCADO COMO TEST'}</span>`;
  }

  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    atDrawStrips();
  });
}

atInit();
