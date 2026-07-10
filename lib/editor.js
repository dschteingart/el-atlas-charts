// =============================================================
//  editor.js COMPARTIDO (lib/) — sidebar editorial de los 3 números (?nl=1)
// =============================================================
//
// Panel local (no se ve en la versión pública del chart) que permite a
// Daniel editar:
//   - Título / subtítulo / caption (textos).
//   - Lista de países etiquetados (override del priority default).
//   - Font-sizes de ticks, labels, "elemento especial" y axis-titles.
//   - Formato del PNG (público / newsletter / cuadrado / mobile).
// Persistencia en localStorage por chartId. Exportar/importar como JSON.
//
// Activación:
//   - ?nl=1 en la URL → arranca abierto.
//   - Ctrl+Shift+E (Cmd+Shift+E en Mac) → toggle del panel.
//   - Una vez activado: queda body.ae-ever-activated (con pestaña lateral
//     visible cuando el panel está cerrado). Si nunca se activó, NO se ve
//     nada — el chart se ve idéntico a la versión pública.
//
// API global:
//   window.AtlasEditor.getConfig()  → objeto config actual (o null si nunca
//     se activó / no hay HTML chart-block con data-editor-id).
//   window.AtlasEditor.emit()       → notifica a charts que algo cambió
//     (dispara CustomEvent 'atlas-editor-change' en window).
//   window.AtlasEditor.onChange(cb) → atajo: agrega listener al evento.
//   window.AtlasEditor.triggerRender() → alias de emit (compat con spec).
//
// Los charts se suscriben con:
//   window.addEventListener('atlas-editor-change', () => drawX());
// y aplican overrides leyendo window.AtlasEditor?.getConfig?.() en su
// función de render.

(function () {
  'use strict';

  // =========================================================
  //  Detección de plataforma + activación
  // =========================================================
  const IS_MAC =
    /Mac/i.test(navigator.platform || '') ||
    /Mac/i.test(navigator.userAgent || '');

  // El panel solo existe si encontramos un .chart-block con data-editor-id
  // en la página. En index.html no hay (no se agrega el atributo) → el
  // módulo se inicializa pero detecta que no hay chart y se desactiva.
  function findChartBlock() {
    return document.querySelector('.chart-block[data-editor-id]');
  }

  // LANG está declarado con `let` en i18n-issue.js, así que vive como
  // binding global pero NO como propiedad de `window`. Para leerlo desde
  // dentro de este IIFE, accedemos via lookup léxico (variable libre).
  // try/catch defensivo por si el script de i18n no cargó (ej. tests).
  function getLang() {
    try {
      // eslint-disable-next-line no-undef
      if (typeof LANG !== 'undefined') return LANG;
    } catch (_) {}
    return 'es';
  }

  // `state` (chart) también está declarado con const en i18n-issue.js: es
  // global pero no property de window. Lo accedemos por lookup léxico
  // donde lo necesitamos (`typeof state !== 'undefined' && state[3]`).

  // =========================================================
  //  Schema + defaults
  // =========================================================
  // Tamaños de fuente default desktop. Coinciden con los SIZES desktop de
  // los 3 charts (marimekko: tick 11, axisLabel 10.5, label 10, table 11;
  // scatter: tick 11, axisTitle 11.5, label 10.5; deciles: tick 11,
  // axisTitle 11.5, endLabel 11.5). Centralizamos en 11/10/10/11 con
  // step 0.5 para que el slider sea predecible y consistente entre charts.
  // El usuario puede afinar pero el default es "razonable".
  const DEFAULT_SIZES = {
    ticks: 11,
    labels: 10,
    special: 10,
    axisTitle: 11
  };

  const DEFAULT_FORMAT = 'newsletter';

  // Lista de iso3 default por chart. Se usa SOLO si el localStorage del
  // chart está vacío (primera visita). Si el usuario alguna vez tildó o
  // destildó algo, su lista persiste en localStorage como `config.countries`.
  const DEFAULT_COUNTRIES = {
    'marimekko-gini': [
      'NAM','COL','BRA','CHL','ARG','MEX','CHN','NER',
      'ESP','JPN','USA','CAN','DEU','NOR','SVK'
    ],
    'scatter-gini-pib': [
      'ARG','BRA','MEX','COL','CHL',
      'USA','DEU','FRA','GBR','ESP','ITA',
      'RUS','CHN','JPN','KOR','IND'
    ],
    'deciles': ['NOR','PRT','CHL','ARG','BRA','NER']
  };

  // Label del slider "special" según chart (el spec lo pide explícito).
  const SPECIAL_LABEL = {
    'marimekko-gini': { es: 'Tabla regional', en: 'Regional table' },
    'scatter-gini-pib': { es: 'Banner', en: 'Banner' },
    'deciles': { es: 'End-labels', en: 'End-labels' }
  };

  function defaultConfig(chartId, lang) {
    return {
      chartId,
      texts: {
        es: { title: '', subtitle: '', caption: '', axisX: '', axisY: '' },
        en: { title: '', subtitle: '', caption: '', axisX: '', axisY: '' }
      },
      sizes: { ...DEFAULT_SIZES },
      countries: [...(DEFAULT_COUNTRIES[chartId] || [])],
      format: DEFAULT_FORMAT,
      lang: lang || 'es'
    };
  }

  // =========================================================
  //  Storage
  // =========================================================
  function storageKey(chartId) {
    return `atlas-editor-${chartId}`;
  }

  function loadConfig(chartId) {
    try {
      const raw = localStorage.getItem(storageKey(chartId));
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || obj.chartId !== chartId) return null;
      // Merge defensivo contra schemas viejos.
      return {
        chartId,
        texts: {
          es: { title: '', subtitle: '', caption: '', axisX: '', axisY: '', ...(obj.texts?.es || {}) },
          en: { title: '', subtitle: '', caption: '', axisX: '', axisY: '', ...(obj.texts?.en || {}) }
        },
        sizes: { ...DEFAULT_SIZES, ...(obj.sizes || {}) },
        countries: Array.isArray(obj.countries)
          ? obj.countries.slice()
          : [...(DEFAULT_COUNTRIES[chartId] || [])],
        format: obj.format || DEFAULT_FORMAT,
        lang: obj.lang || 'es'
      };
    } catch (_) {
      return null;
    }
  }

  function saveConfig(config) {
    try {
      localStorage.setItem(storageKey(config.chartId), JSON.stringify(config));
    } catch (_) { /* quota o private mode: silencioso */ }
  }

  function clearConfig(chartId) {
    try { localStorage.removeItem(storageKey(chartId)); } catch (_) {}
  }

  // =========================================================
  //  Estado del módulo
  // =========================================================
  // Nombre `ae` (atlas editor) para NO shadowear el global `state` de
  // i18n-issue.js — esto nos deja acceder al state del chart vía lookup
  // léxico cuando lo necesitamos (ej. para sincronizar state[3] del
  // chart deciles con la lista del panel).
  const ae = {
    chartId: null,
    config: null,
    panelEl: null,
    tabEl: null,
    everActivated: false,
    listeners: [],
    countryUniverse: null   // cache: array de {code, regionTag} construido lazy
  };

  // =========================================================
  //  Universo de países (por chart)
  // =========================================================
  // Devuelve un array ordenado alfabéticamente de {code} para el chart
  // activo. La fuente cambia según el dataset:
  //   - marimekko-gini → DATA_MARIMEKKO.data_by_year (todos los años)
  //   - scatter-gini-pib → DATA_SCATTER.data_by_year (todos los años)
  //   - deciles → DATA_DECILES.data_by_year (todos los años)
  // El nombre mostrado se resuelve en runtime con COUNTRY_NAMES[code][LANG]
  // para que cambiar el idioma del panel re-traduzca al instante.
  function buildCountryUniverse() {
    const seen = new Set();
    const out = [];
    const push = (code) => {
      if (!code || seen.has(code)) return;
      seen.add(code);
      out.push({ code });
    };
    try {
      if (ae.chartId === 'marimekko-gini' && typeof DATA_MARIMEKKO !== 'undefined') {
        Object.values(DATA_MARIMEKKO.data_by_year).forEach(arr => {
          arr.forEach(d => push(d.code));
        });
      } else if (ae.chartId === 'scatter-gini-pib' && typeof DATA_SCATTER !== 'undefined') {
        Object.values(DATA_SCATTER.data_by_year).forEach(snap => {
          snap.points.forEach(p => push(p.code));
        });
      } else if (ae.chartId === 'deciles' && typeof DATA_DECILES !== 'undefined') {
        Object.values(DATA_DECILES.data_by_year).forEach(yo => {
          Object.keys(yo.countries).forEach(push);
        });
      }
    } catch (_) {}
    return out;
  }

  function getCountryUniverse() {
    if (!ae.countryUniverse || !ae.countryUniverse.length) {
      ae.countryUniverse = buildCountryUniverse();
    }
    return ae.countryUniverse;
  }

  function displayCountryName(code) {
    try {
      if (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[code]) {
        return COUNTRY_NAMES[code][getLang()] || code;
      }
    } catch (_) {}
    return code;
  }

  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // =========================================================
  //  Public API + event bus
  // =========================================================
  function emit() {
    // Charts se suscriben con window.addEventListener('atlas-editor-change', ...).
    window.dispatchEvent(new CustomEvent('atlas-editor-change'));
  }

  function onChange(cb) {
    if (typeof cb !== 'function') return;
    window.addEventListener('atlas-editor-change', cb);
  }

  function getConfig() {
    return ae.config;
  }

  // Re-lee desde localStorage y re-sincroniza la UI del panel. Usado por
  // los charts cuando modifican config.countries externamente (ej. el chip
  // de búsqueda de deciles que toggle un país directamente). El panel
  // tiene que reflejar el nuevo estado en sus checkboxes.
  function reloadFromStorage() {
    if (!ae.chartId) return;
    const next = loadConfig(ae.chartId);
    if (next) {
      ae.config = next;
      syncUI();
    }
  }

  // Expuesto antes de DOMContentLoaded para que los charts puedan llamarlo
  // en su primer render (los script tags están en orden:
  // editor.js → marimekko.js → init inline).
  window.AtlasEditor = {
    getConfig,
    emit,
    onChange,
    triggerRender: emit,
    reloadFromStorage
  };

  // =========================================================
  //  Construcción del DOM del panel
  // =========================================================
  function buildPanelDom() {
    const panel = document.createElement('aside');
    panel.className = 'ae-panel';
    panel.setAttribute('aria-label', 'Atlas editor');
    panel.innerHTML = `
      <div class="ae-header">
        <span class="ae-header-title">Editor</span>
        <div class="ae-lang-toggle" role="group" aria-label="Idioma">
          <button type="button" data-ae-lang="es">ES</button>
          <button type="button" data-ae-lang="en">EN</button>
        </div>
      </div>
      <div class="ae-body">

        <div class="ae-section" data-ae-section="texts">
          <h3 class="ae-section-title" data-ae-l="texts">Textos</h3>
          <div class="ae-field">
            <label data-ae-l="title">Título</label>
            <input type="text" data-ae-text="title" placeholder="(usa el default)">
          </div>
          <div class="ae-field">
            <label data-ae-l="subtitle">Subtítulo</label>
            <textarea data-ae-text="subtitle" placeholder="(usa el default)" rows="2"></textarea>
          </div>
          <div class="ae-field">
            <label data-ae-l="caption">Caption</label>
            <textarea data-ae-text="caption" placeholder="(usa el default)" rows="3"></textarea>
          </div>
        </div>

        <div class="ae-section" data-ae-section="countries">
          <h3 class="ae-section-title" data-ae-l="countries">Países etiquetados</h3>
          <input type="text" class="ae-country-search" placeholder="Buscar…" data-ae-country-search>
          <div class="ae-country-actions">
            <button type="button" data-ae-country-clear data-ae-l="clear-all">Limpiar todo</button>
            <span class="ae-sep">·</span>
            <button type="button" data-ae-country-selectall data-ae-l="select-all">Seleccionar todo</button>
          </div>
          <div class="ae-country-list" data-ae-country-list></div>
        </div>

        <div class="ae-section" data-ae-section="axisTitles">
          <h3 class="ae-section-title" data-ae-l="axisTitles">Títulos de eje</h3>
          <div class="ae-field" data-ae-axis-x-field>
            <label data-ae-l="axisX">Eje X</label>
            <input type="text" data-ae-text="axisX" placeholder="(usa el default)">
          </div>
          <div class="ae-field" data-ae-axis-y-field>
            <label data-ae-l="axisY">Eje Y</label>
            <input type="text" data-ae-text="axisY" placeholder="(usa el default)">
          </div>
        </div>

        <div class="ae-section" data-ae-section="sizes">
          <h3 class="ae-section-title" data-ae-l="sizes">Tamaños de fuente</h3>
          <div class="ae-slider-row">
            <label data-ae-l="size-ticks">Ticks ejes</label>
            <input type="range" min="8" max="28" step="0.5" data-ae-size="ticks">
            <span class="ae-slider-val" data-ae-size-val="ticks"></span>
          </div>
          <div class="ae-slider-row">
            <label data-ae-l="size-labels">Etiquetas país</label>
            <input type="range" min="8" max="28" step="0.5" data-ae-size="labels">
            <span class="ae-slider-val" data-ae-size-val="labels"></span>
          </div>
          <div class="ae-slider-row">
            <label data-ae-size-label="special">Tabla regional</label>
            <input type="range" min="8" max="28" step="0.5" data-ae-size="special">
            <span class="ae-slider-val" data-ae-size-val="special"></span>
          </div>
          <div class="ae-slider-row">
            <label data-ae-l="size-axisTitle">Títulos de eje</label>
            <input type="range" min="8" max="28" step="0.5" data-ae-size="axisTitle">
            <span class="ae-slider-val" data-ae-size-val="axisTitle"></span>
          </div>
        </div>

        <div class="ae-section" data-ae-section="format">
          <h3 class="ae-section-title" data-ae-l="format">Formato PNG</h3>
          <select class="ae-select" data-ae-format>
            <option value="public">Público — 1600×900</option>
            <option value="newsletter">Newsletter — 1080×1080</option>
            <option value="square">Cuadrado — 1200×1200</option>
            <option value="mobile">Mobile — 1000×1500</option>
            <option value="worldmap">Mapa apaisado — 1200×920</option>
          </select>
        </div>

        <details class="ae-advanced">
          <summary data-ae-l="advanced">Avanzado</summary>
          <div class="ae-advanced-body">
            <button type="button" class="ae-btn" data-ae-export>Exportar config</button>
            <button type="button" class="ae-btn" data-ae-import>Importar config</button>
            <input type="file" accept=".json,application/json" style="display:none" data-ae-import-input>
            <button type="button" class="ae-btn" data-ae-svg-export style="display:none">Descargar SVG</button>
          </div>
        </details>

      </div>
      <div class="ae-footer">
        <button type="button" class="ae-btn" data-ae-reset data-ae-l="reset">Reset</button>
        <button type="button" class="ae-btn" data-ae-hide data-ae-l="hide">Ocultar editor</button>
      </div>
    `;
    document.body.appendChild(panel);

    const tab = document.createElement('div');
    tab.className = 'ae-tab';
    tab.textContent = 'EDITOR';
    tab.setAttribute('role', 'button');
    tab.setAttribute('aria-label', 'Abrir editor');
    document.body.appendChild(tab);

    return { panel, tab };
  }

  // =========================================================
  //  i18n del propio panel (mínimo — el resto está en el HTML)
  // =========================================================
  const PANEL_I18N = {
    es: {
      texts: 'Textos', title: 'Título', subtitle: 'Subtítulo', caption: 'Caption',
      countries: 'Países etiquetados', sizes: 'Tamaños de fuente',
      'size-ticks': 'Ticks ejes', 'size-labels': 'Etiquetas país',
      'size-axisTitle': 'Títulos de eje',
      axisTitles: 'Títulos de eje', axisX: 'Eje X', axisY: 'Eje Y',
      'clear-all': 'Limpiar todo', 'select-all': 'Seleccionar todo',
      format: 'Formato PNG', advanced: 'Avanzado',
      reset: 'Reset', hide: 'Ocultar editor',
      search: 'Buscar…', placeholder: '(usa el default)'
    },
    en: {
      texts: 'Texts', title: 'Title', subtitle: 'Subtitle', caption: 'Caption',
      countries: 'Labeled countries', sizes: 'Font sizes',
      'size-ticks': 'Axis ticks', 'size-labels': 'Country labels',
      'size-axisTitle': 'Axis titles',
      axisTitles: 'Axis titles', axisX: 'X axis', axisY: 'Y axis',
      'clear-all': 'Clear all', 'select-all': 'Select all',
      format: 'PNG format', advanced: 'Advanced',
      reset: 'Reset', hide: 'Hide editor',
      search: 'Search…', placeholder: '(uses default)'
    }
  };

  function applyPanelI18n() {
    if (!ae.panelEl) return;
    const lang = ae.config?.lang || 'es';
    const dict = PANEL_I18N[lang] || PANEL_I18N.es;
    ae.panelEl.querySelectorAll('[data-ae-l]').forEach(el => {
      const key = el.getAttribute('data-ae-l');
      if (dict[key]) el.textContent = dict[key];
    });
    // El label del slider "special" depende del chart, no del dict global.
    ae.panelEl.querySelectorAll('[data-ae-size-label="special"]').forEach(el => {
      const specLabel = SPECIAL_LABEL[ae.chartId];
      el.textContent = (specLabel && specLabel[lang]) || 'Especial';
    });
    // Placeholders de inputs de texto.
    ae.panelEl.querySelectorAll('input[data-ae-text], textarea[data-ae-text]')
      .forEach(el => { el.placeholder = dict.placeholder; });
    ae.panelEl.querySelectorAll('input[data-ae-country-search]')
      .forEach(el => { el.placeholder = dict.search; });
  }

  // =========================================================
  //  Sincronizar UI ← ae.config
  // =========================================================
  function syncUI() {
    if (!ae.panelEl || !ae.config) return;
    const cfg = ae.config;
    const lang = cfg.lang || 'es';

    // Idioma toggle: activo el de cfg.lang.
    ae.panelEl.querySelectorAll('[data-ae-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-ae-lang') === lang);
    });

    // Textos del idioma activo. Los del otro idioma quedan en cfg.texts pero
    // no se ven hasta que el usuario toggle el lang.
    const tCfg = cfg.texts[lang] || { title: '', subtitle: '', caption: '', axisX: '', axisY: '' };
    const tInput = ae.panelEl.querySelector('input[data-ae-text="title"]');
    const sInput = ae.panelEl.querySelector('textarea[data-ae-text="subtitle"]');
    const cInput = ae.panelEl.querySelector('textarea[data-ae-text="caption"]');
    const xInput = ae.panelEl.querySelector('input[data-ae-text="axisX"]');
    const yInput = ae.panelEl.querySelector('input[data-ae-text="axisY"]');
    if (tInput) tInput.value = tCfg.title || '';
    if (sInput) sInput.value = tCfg.subtitle || '';
    if (cInput) cInput.value = tCfg.caption || '';
    if (xInput) xInput.value = tCfg.axisX || '';
    if (yInput) yInput.value = tCfg.axisY || '';

    // Visibilidad de los campos de eje según el chart:
    //   - marimekko-gini: solo Eje Y (el eje X son los países).
    //   - scatter-gini-pib: ambos.
    //   - deciles: ambos.
    const axisXField = ae.panelEl.querySelector('[data-ae-axis-x-field]');
    if (axisXField) {
      axisXField.style.display = (ae.chartId === 'marimekko-gini') ? 'none' : '';
    }

    // Secciones según lo que el chart realmente escucha (filosofía OWID: el
    // panel no promete lo que el chart no consume). Textos y Formato aplican
    // a todos (atlasApplyEditorTexts + png-export). Ejes y Tamaños solo si la
    // página lo declara: <div class="chart-block" data-editor-caps="axis,sizes">.
    // Países se oculta cuando el universo del chart está vacío (ej. los charts
    // del especial, que no tienen labels de país editables).
    const capsBlock = document.querySelector('.chart-block[data-editor-caps]');
    const caps = ((capsBlock && capsBlock.dataset.editorCaps) || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const showSection = (name, on) => {
      const el = ae.panelEl.querySelector(`[data-ae-section="${name}"]`);
      if (el) el.style.display = on ? '' : 'none';
    };
    showSection('axisTitles', caps.includes('axis'));
    showSection('sizes', caps.includes('sizes'));
    showSection('countries', getCountryUniverse().length > 0);
    // Solo ofrecer los formatos que el número soporta (PNG_FORMATS del
    // utils cargado en la página — el N°1, p.ej., solo tiene 'square').
    const fmtOptSel = ae.panelEl.querySelector('select[data-ae-format]');
    if (fmtOptSel && typeof PNG_FORMATS !== 'undefined') {
      Array.from(fmtOptSel.options).forEach(o => { if (!PNG_FORMATS[o.value]) o.remove(); });
    }

    // Sliders de tamaño.
    ['ticks', 'labels', 'special', 'axisTitle'].forEach(k => {
      const slider = ae.panelEl.querySelector(`input[data-ae-size="${k}"]`);
      const valEl = ae.panelEl.querySelector(`[data-ae-size-val="${k}"]`);
      const v = cfg.sizes[k] ?? DEFAULT_SIZES[k];
      if (slider) slider.value = v;
      if (valEl) valEl.textContent = v;
    });

    // Formato PNG.
    const fmtSel = ae.panelEl.querySelector('select[data-ae-format]');
    if (fmtSel) fmtSel.value = cfg.format || DEFAULT_FORMAT;

    // Lista de países.
    const searchInput = ae.panelEl.querySelector('input[data-ae-country-search]');
    renderCountryList(searchInput ? searchInput.value : '');

    applyPanelI18n();

    // Hint al lado del botón PNG (creado fuera del panel).
    updatePngHint();
  }

  function renderCountryList(filterText) {
    if (!ae.panelEl) return;
    const listEl = ae.panelEl.querySelector('[data-ae-country-list]');
    if (!listEl) return;

    const universe = getCountryUniverse();
    const tildados = new Set(ae.config.countries || []);
    const qn = normalize(filterText);

    // Construimos items con nombre traducido al lang ACTIVO del documento
    // (window.LANG) para que coincida con lo que ve el lector. El config.lang
    // del editor solo afecta los textos editoriales (título/sub/caption).
    const lang = getLang();
    const items = universe.map(({ code }) => ({
      code,
      name: (typeof COUNTRY_NAMES !== 'undefined' && COUNTRY_NAMES[code]?.[lang]) || code,
      checked: tildados.has(code)
    }));

    // Filtro case- y acento-insensitive sobre el nombre traducido.
    const filtered = qn
      ? items.filter(it => normalize(it.name).includes(qn))
      : items;

    // Orden: tildados primero (en orden de tildado, manteniendo el config),
    // luego no-tildados alfabético. Hace que el usuario vea rápido qué eligió.
    const tildadosOrdered = (ae.config.countries || [])
      .map(code => filtered.find(it => it.code === code))
      .filter(Boolean);
    const noTildados = filtered
      .filter(it => !tildados.has(it.code))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
    const final = [...tildadosOrdered, ...noTildados];

    if (final.length === 0) {
      listEl.innerHTML = `<div class="ae-country-empty">— sin resultados —</div>`;
      return;
    }

    listEl.innerHTML = final.map(it =>
      `<label class="ae-country-item">
         <input type="checkbox" data-ae-country="${it.code}"${it.checked ? ' checked' : ''}>
         <span>${escapeHtml(it.name)}</span>
       </label>`
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // =========================================================
  //  Hint al lado del botón "Descargar PNG"
  // =========================================================
  // Insertamos un <span> después del botón con formato actual: "1000 × 1100
  // · Newsletter". Si el span no existe, lo creamos; si existe, actualizamos.
  // El span se inserta solo si el editor está activo (everActivated).
  const FORMAT_HINT = {
    es: {
      public:     '1600 × 900 · Público',
      newsletter: '1080 × 1080 · Newsletter',
      square:     '1200 × 1200 · Cuadrado',
      mobile:     '1000 × 1500 · Mobile',
      worldmap:   '1200 × 920 · Mapa apaisado'
    },
    en: {
      public:     '1600 × 900 · Public',
      newsletter: '1080 × 1080 · Newsletter',
      square:     '1200 × 1200 · Square',
      mobile:     '1000 × 1500 · Mobile',
      worldmap:   '1200 × 920 · Landscape map'
    }
  };

  function updatePngHint() {
    if (!ae.everActivated) return;
    const pngBtn = document.querySelector('button[data-png]');
    if (!pngBtn) return;
    let hint = document.querySelector('.ae-png-hint');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'ae-png-hint';
      pngBtn.insertAdjacentElement('afterend', hint);
    }
    const lang = getLang();
    const fmt = ae.config?.format || DEFAULT_FORMAT;
    hint.textContent = (FORMAT_HINT[lang] || FORMAT_HINT.es)[fmt] || '';
  }

  // =========================================================
  //  Wire UI → ae.config (handlers)
  // =========================================================
  function wirePanelHandlers() {
    const panel = ae.panelEl;
    if (!panel) return;

    // ----- Idioma del panel (sincronizado con el chart) -----
    // El toggle ES/EN del panel comparte estado con el del chart (top-bar
    // .lang-toggle). Cambiar uno cambia el otro. Hacemos delegate: cuando el
    // usuario click un botón del panel, simulamos un click en el botón del
    // chart correspondiente (que ya tiene su handler bien atado por
    // setupLangToggle).
    panel.querySelectorAll('[data-ae-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-ae-lang');
        // Dispara el handler del chart (que llama applyI18n + onLangChange).
        const chartBtn = document.querySelector(
          `.lang-toggle button[data-lang="${lang}"]`
        );
        if (chartBtn) chartBtn.click();
        // Actualiza el config del panel y re-renderiza la UI propia.
        ae.config.lang = lang;
        saveConfig(ae.config);
        syncUI();
        emit();
      });
    });

    // ----- Textos (título / subtítulo / caption / axisX / axisY) -----
    // input event = se aplica al instante (sin botón "aplicar"). Los 5
    // campos comparten el mismo handler — solo cambia la clave de
    // ae.config.texts[lang][field].
    ['title', 'subtitle', 'caption', 'axisX', 'axisY'].forEach(field => {
      const el = panel.querySelector(`[data-ae-text="${field}"]`);
      if (!el) return;
      el.addEventListener('input', () => {
        const lang = ae.config.lang || 'es';
        if (!ae.config.texts[lang]) {
          ae.config.texts[lang] = { title: '', subtitle: '', caption: '', axisX: '', axisY: '' };
        }
        ae.config.texts[lang][field] = el.value;
        saveConfig(ae.config);
        emit();
      });
    });

    // ----- Sliders de tamaño -----
    ['ticks', 'labels', 'special', 'axisTitle'].forEach(k => {
      const slider = panel.querySelector(`input[data-ae-size="${k}"]`);
      const valEl = panel.querySelector(`[data-ae-size-val="${k}"]`);
      if (!slider) return;
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        ae.config.sizes[k] = v;
        if (valEl) valEl.textContent = v;
        saveConfig(ae.config);
        emit();
      });
    });

    // ----- Buscador de países -----
    const search = panel.querySelector('input[data-ae-country-search]');
    if (search) {
      search.addEventListener('input', () => {
        renderCountryList(search.value);
      });
    }

    // ----- Limpiar todo / Seleccionar todo -----
    // Aplican sobre TODOS los países del dataset, ignorando el filtro de
    // búsqueda. Esto es lo intuitivo: "Limpiar todo" significa LIMPIAR
    // TODO, no solo lo que está filtrado. La sincronización con
    // state[3].selectedCountries (caso deciles) se hace acá también para
    // que los chips se actualicen al instante.
    function applyCountryBulk(action) {
      const universe = getCountryUniverse().map(it => it.code);
      const arr = ae.config.countries;
      if (action === 'clear') {
        // Vaciar la lista entera (no solo lo visible). Mantenemos la
        // referencia del array — los handlers locales (renderCountryList
        // etc.) leen ae.config.countries por nombre, así que reemplazar el
        // array con [] es seguro.
        arr.length = 0;
      } else if (action === 'selectall') {
        // Reemplazar con TODOS los países del universo, en orden alfabético
        // por iso3 para que sea estable. Quien quiera reordenar lo hace
        // tildeando uno por uno (orden de tildado se preserva).
        arr.length = 0;
        universe.forEach(code => arr.push(code));
      }
      // Sincronización con state[3].selectedCountries (caso deciles).
      if (ae.chartId === 'deciles' && typeof state === 'object' && state[3]) {
        state[3].selectedCountries = arr.slice();
        if (typeof renderDecilesSelectedChips === 'function') {
          renderDecilesSelectedChips();
        }
      }
      saveConfig(ae.config);
      renderCountryList(search ? search.value : '');
      emit();
    }
    const btnClear = panel.querySelector('[data-ae-country-clear]');
    const btnSelAll = panel.querySelector('[data-ae-country-selectall]');
    if (btnClear)  btnClear.addEventListener('click', () => applyCountryBulk('clear'));
    if (btnSelAll) btnSelAll.addEventListener('click', () => applyCountryBulk('selectall'));

    // ----- Toggle de país (checkbox) -----
    // Delegación porque la lista se re-renderea con cada filter.
    panel.querySelector('[data-ae-country-list]').addEventListener('change', (ev) => {
      const cb = ev.target.closest('input[type="checkbox"][data-ae-country]');
      if (!cb) return;
      const code = cb.getAttribute('data-ae-country');
      const arr = ae.config.countries;
      const idx = arr.indexOf(code);
      if (cb.checked && idx === -1) arr.push(code);
      else if (!cb.checked && idx >= 0) arr.splice(idx, 1);
      // Sincronizar con state[3].selectedCountries si es deciles.
      // `state` es global de i18n-issue.js (no en window por ser const).
      if (ae.chartId === 'deciles' && typeof state === 'object' && state[3]) {
        state[3].selectedCountries = arr.slice();
        // El render de deciles dibuja líneas según state[3].selectedCountries.
        if (typeof renderDecilesSelectedChips === 'function') {
          renderDecilesSelectedChips();
        }
      }
      saveConfig(ae.config);
      emit();
    });

    // ----- Formato PNG -----
    const fmtSel = panel.querySelector('select[data-ae-format]');
    if (fmtSel) {
      fmtSel.addEventListener('change', () => {
        ae.config.format = fmtSel.value;
        saveConfig(ae.config);
        updatePngHint();
        // Re-renderizamos el chart: aplicar/quitar .ae-format-wrapper y
        // que el SVG adopte el viewBox + aspect ratio del formato elegido
        // (WYSIWYG). El render lee getActivePngFormat() y llama
        // applyFormatWrapper(svg, format).
        emit();
      });
    }

    // ----- Exportar -----
    panel.querySelector('[data-ae-export]').addEventListener('click', () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const ts =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const filename = `atlas-config-${ae.chartId}-${ts}.json`;
      const blob = new Blob([JSON.stringify(ae.config, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // ----- Descargar SVG -----
    // El botón en el panel del editor (sección Avanzado) delega a
    // window.downloadChartSVG(chartId) — la implementación vive en
    // svg-export.js. Mapeamos el chartId editorial ('scatter-elo-pib',
    // etc.) al chartId numérico ('1', '2', '3', '4') que usa el módulo.
    //
    // El SVG sale con título / subtítulo / sources / atribución como
    // <text> editables al fin del viewBox extendido — lo que Daniel
    // necesita para refinar en Figma (alineaciones, exportar PNG final
    // con su estética para redes).
    const SVG_CHART_NUMERIC = {
      // N°3
      'scatter-elo-pib':      '1',
      'talento-futbolistico': '2',
      'mapa-clubage':         '3',
      'talento-clubes':       '4',
      // N°2 (svg-export.js resuelve el filename según el número detectado)
      'marimekko-gini':       '1',
      'scatter-gini-pib':     '2',
      'deciles':              '3',
    };
    const svgExportBtn = panel.querySelector('[data-ae-svg-export]');
    if (svgExportBtn) {
      if (SVG_CHART_NUMERIC[ae.chartId]) {
        svgExportBtn.style.display = '';
      }
      svgExportBtn.addEventListener('click', () => {
        // Delegar al módulo svg-export.js, que ya hace clone, inline
        // styles, viewBox extendido, título/subtítulo/sources/atribución
        // como <text>, xmlns y descarga. NO duplicamos esa lógica acá.
        const num = SVG_CHART_NUMERIC[ae.chartId];
        if (!num) {
          alert('Chart no habilitado para export SVG: ' + ae.chartId);
          return;
        }
        if (typeof window.downloadChartSVG !== 'function') {
          alert('svg-export.js no está cargado.');
          return;
        }
        try {
          window.downloadChartSVG(num);
        } catch (err) {
          console.error('[editor] SVG export falló:', err);
          alert('No se pudo generar el SVG. Mirá la consola.');
        }
      });
    }

    // ----- Importar -----
    const importBtn = panel.querySelector('[data-ae-import]');
    const importInput = panel.querySelector('[data-ae-import-input]');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const obj = JSON.parse(e.target.result);
            if (!obj || obj.chartId !== ae.chartId) {
              alert(
                `Esta config es de '${obj?.chartId || '(desconocido)'}', ` +
                `no de '${ae.chartId}'. No se puede importar.`
              );
              importInput.value = '';
              return;
            }
            // Merge defensivo con defaults (en caso de claves nuevas).
            ae.config = {
              chartId: ae.chartId,
              texts: {
                es: { title: '', subtitle: '', caption: '', axisX: '', axisY: '', ...(obj.texts?.es || {}) },
                en: { title: '', subtitle: '', caption: '', axisX: '', axisY: '', ...(obj.texts?.en || {}) }
              },
              sizes: { ...DEFAULT_SIZES, ...(obj.sizes || {}) },
              countries: Array.isArray(obj.countries) ? obj.countries.slice() : [],
              format: obj.format || DEFAULT_FORMAT,
              lang: obj.lang || (getLang())
            };
            saveConfig(ae.config);
            // Sincronizar idioma del documento si difiere.
            if (ae.config.lang && ae.config.lang !== getLang()) {
              const chartBtn = document.querySelector(
                `.lang-toggle button[data-lang="${ae.config.lang}"]`
              );
              if (chartBtn) chartBtn.click();
            }
            // Sincronizar deciles selectedCountries.
            if (ae.chartId === 'deciles' && (typeof state !== 'undefined' && state[3])) {
              state[3].selectedCountries = ae.config.countries.slice();
              if (typeof renderDecilesSelectedChips === 'function') {
                renderDecilesSelectedChips();
              }
            }
            syncUI();
            emit();
          } catch (err) {
            alert('No se pudo leer el archivo JSON: ' + err.message);
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // ----- Reset -----
    panel.querySelector('[data-ae-reset]').addEventListener('click', () => {
      if (!confirm('¿Resetear toda la configuración del editor?')) return;
      clearConfig(ae.chartId);
      ae.config = defaultConfig(ae.chartId, getLang());
      // Reset también para deciles: volver a la default selectedCountries.
      if (ae.chartId === 'deciles' && (typeof state !== 'undefined' && state[3])) {
        state[3].selectedCountries = ae.config.countries.slice();
        if (typeof renderDecilesSelectedChips === 'function') {
          renderDecilesSelectedChips();
        }
      }
      syncUI();
      emit();
    });

    // ----- Ocultar editor -----
    panel.querySelector('[data-ae-hide]').addEventListener('click', () => {
      closePanel();
    });
  }

  // =========================================================
  //  Apertura/cierre + atajos
  // =========================================================
  function openPanel() {
    if (!ae.panelEl) return;
    ae.everActivated = true;
    document.body.classList.add('ae-open', 'ae-ever-activated');
    ae.panelEl.classList.add('ae-open');
    syncUI();
    emit();
  }

  function closePanel() {
    if (!ae.panelEl) return;
    document.body.classList.remove('ae-open');
    ae.panelEl.classList.remove('ae-open');
    emit();
  }

  function togglePanel() {
    if (ae.panelEl.classList.contains('ae-open')) closePanel();
    else openPanel();
  }

  function wireGlobalShortcuts() {
    document.addEventListener('keydown', (ev) => {
      // Ctrl+Shift+E (Cmd+Shift+E en Mac): activa + toggle. Esto es lo que
      // "enciende" el editor por sesión: si el panel todavía no está montado,
      // lo montamos ahora. La activación es POR SESIÓN — la presencia de
      // localStorage NO activa el editor por sí sola.
      const wantModifier = IS_MAC ? ev.metaKey : ev.ctrlKey;
      if (wantModifier && ev.shiftKey && (ev.key === 'E' || ev.key === 'e')) {
        ev.preventDefault();
        if (!ae.panelEl) {
          mountEditor();
          openPanel();
        } else {
          togglePanel();
        }
        return;
      }
      // H: solo después de la primera activación EN ESTA SESIÓN, toggle
      // cuando NO estás tipeando en un input. Si el editor nunca se activó
      // en la sesión (panel no montado), "H" no hace nada y el chart se ve
      // idéntico a la versión pública.
      if ((ev.key === 'h' || ev.key === 'H') &&
          !ev.ctrlKey && !ev.metaKey && !ev.altKey &&
          ae.everActivated && ae.panelEl) {
        const tag = (ev.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (ev.target.isContentEditable) return;
        ev.preventDefault();
        togglePanel();
      }
    });
  }

  // =========================================================
  //  Sincronización con el toggle de idioma del chart
  // =========================================================
  // Cuando el usuario cambia el idioma DESDE el chart (no desde el panel),
  // el config.lang del editor debe seguirlo y los inputs de texto del panel
  // se reagarran a los textos guardados del nuevo idioma.
  function watchChartLangToggle() {
    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (!ae.config || lang === ae.config.lang) return;
        ae.config.lang = lang;
        saveConfig(ae.config);
        // Universe no cambia, pero los nombres mostrados sí → re-renderizar
        // la lista de países con la traducción del nuevo idioma.
        if (ae.panelEl) {
          const search = ae.panelEl.querySelector('input[data-ae-country-search]');
          renderCountryList(search ? search.value : '');
        }
        syncUI();
        // El chart ya re-renderizó como parte de su lang handler (que se
        // disparó antes que este listener), pero entonces ae.config.lang
        // todavía era el viejo. Disparamos otro re-render para que los
        // textos editoriales custom se apliquen contra el lang CORRECTO.
        emit();
      });
    });
  }

  // =========================================================
  //  Init
  // =========================================================
  // Monta el DOM del editor (panel + tab) y carga la config desde
  // localStorage. SOLO se llama cuando la activación es por SESIÓN:
  //   - URL con ?nl=1, o
  //   - Ctrl/Cmd+Shift+E.
  // La mera presencia de localStorage NO monta el DOM — la versión pública
  // del chart no debe tener rastro del editor en el DOM.
  function mountEditor() {
    if (ae.panelEl) return; // ya montado
    const block = findChartBlock();
    if (!block) return;
    const chartId = block.getAttribute('data-editor-id');
    ae.chartId = chartId;

    // Cargamos la config ahora (no antes): la lectura de localStorage ocurre
    // SOLO cuando el editor SE ACTIVA, para popular valores. Si no hay
    // saved, arrancamos con defaultConfig.
    ae.config = loadConfig(chartId) || defaultConfig(chartId, getLang());

    // Retoques por LINK (estilo OWID): ?nl=1&titulo=…&subtitulo=…&nota=…
    // (&formato=square|worldmap|…) pisan la config EN MEMORIA, sin
    // persistirla: el link reproduce la vista exacta sin ensuciar lo
    // guardado. Aplican al idioma activo (componer con ?lang=en para la
    // versión inglesa). Si después editás algo en el panel, ahí sí se
    // guarda todo junto (comportamiento normal del editor).
    try {
      const qp = new URLSearchParams(location.search);
      const urlTexts = {
        title:    qp.get('titulo'),
        subtitle: qp.get('subtitulo'),
        caption:  qp.get('nota')
      };
      const urlFormat = qp.get('formato');
      if (urlTexts.title || urlTexts.subtitle || urlTexts.caption || urlFormat) {
        const L = getLang();
        ae.config.lang = L;
        Object.entries(urlTexts).forEach(([k, v]) => {
          if (v != null && v.trim() !== '') ae.config.texts[L][k] = v;
        });
        if (urlFormat && typeof PNG_FORMATS !== 'undefined' && PNG_FORMATS[urlFormat]) {
          ae.config.format = urlFormat;
        }
      }
    } catch (_) {}

    // Normalizar el formato a los que el número soporta (el default
    // 'newsletter' no existe en el N°1, que solo define 'square').
    if (typeof PNG_FORMATS !== 'undefined' && ae.config.format && !PNG_FORMATS[ae.config.format]) {
      ae.config.format = Object.keys(PNG_FORMATS)[0] || ae.config.format;
    }

    // Sincronizar lang del documento con la persistida del editor SOLO si
    // el usuario eligió una distinta en una visita previa.
    if (ae.config.lang && ae.config.lang !== (getLang())) {
      requestAnimationFrame(() => {
        const chartBtn = document.querySelector(
          `.lang-toggle button[data-lang="${ae.config.lang}"]`
        );
        if (chartBtn) chartBtn.click();
      });
    }

    // Sincronizar deciles selectedCountries con la lista del editor.
    if (chartId === 'deciles' && (typeof state !== 'undefined' && state[3])) {
      state[3].selectedCountries = ae.config.countries.slice();
      if (typeof renderDecilesSelectedChips === 'function') {
        renderDecilesSelectedChips();
      }
    }

    const { panel, tab } = buildPanelDom();
    ae.panelEl = panel;
    ae.tabEl = tab;

    wirePanelHandlers();
    watchChartLangToggle();

    tab.addEventListener('click', () => openPanel());

    // Marcar el body para que .ae-tab aparezca cuando el panel esté cerrado.
    document.body.classList.add('ae-ever-activated');
    ae.everActivated = true;

    // Notificar a los charts para que apliquen los overrides guardados.
    emit();
    updatePngHint();
    syncUI();
  }

  function init() {
    const block = findChartBlock();
    if (!block) {
      // index.html u otro contexto: el editor no se monta. API global
      // queda igual pero getConfig→null.
      return;
    }

    // Atajos globales: viven SIEMPRE (incluso si el panel no está montado),
    // así Ctrl+Shift+E puede encender el editor desde cero. La función
    // monta el DOM lazy la primera vez que se pide abrir.
    wireGlobalShortcuts();

    // ?nl=1 → activar y abrir. Si la query no está, NO se monta nada
    // (ni panel ni tab) — el chart se ve idéntico a la versión pública.
    const params = new URLSearchParams(location.search);
    if (params.get('nl') === '1') {
      mountEditor();
      openPanel();
    }
  }

  // Espera DOMContentLoaded para que los <button data-png>, .lang-toggle,
  // .chart-block ya existan en el DOM. Los chart-N.html cargan editor.js
  // antes del init inline, así que window.AtlasEditor ya está expuesto
  // cuando el chart hace su primer draw.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
