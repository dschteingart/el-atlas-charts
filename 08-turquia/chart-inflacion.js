// Inflación anual de precios al consumidor, promedio del año (Banco Mundial), 1990-2025.
// Vista de fábrica: Turquía y América Latina (LA6, agregado PROPIO: la mediana de Brasil, Chile, Colombia, México,
// Perú y Uruguay, calculada en build_datos.py; sin Argentina, que en la fuente solo tiene dato en 2018-2024). Escala lineal desde 0: los picos de 105% (1994) y 72% (2022) aplastan los
// años de un dígito, así que cuando Turquía está sola o con la mediana regional se rotulan sobre la línea los tres valores del título
// (105%, 8,6% y 72%) y el PNG suma el de 2025 a la etiqueta final. Para ver de cerca un tramo está el slider de
// período, que reescala el eje. Sin los agregados regionales de la fuente (son medianas de todos los países de cada región).
// Adapter de turSeries (tur-motor.js). Datos: TUR_INF (data-inflacion.js).
// Último dato: TUR_INF.extra, la inflación interanual de octubre de 2026 de Turquía (TurkStat) y de la mediana LA6
// (institutos de estadística de cada país). Pedido de Daniel (23/11/2026): línea entera hasta ese punto y su valor
// como etiqueta final (cfg.extra.joined); la nota del PNG y el crosshair aclaran que es octubre interanual.
// Vista compartible: ?paises=TUR~BRA&periodo=2003~2021 (- = selección vacía).
const cinf_pct = (v) => br_fmt(v, Math.abs(v) < 10 ? 1 : 0) + '%';
const CINF = turSeries({
  id: 'inflacion', pre: 'cinf', data: () => TUR_INF, def: ['TUR', 'LA6'], main: 'TUR', aggTag: 'cinf-tag-la6',
  yFmt: (v) => br_fmt(v, 0) + '%',
  endFmt: cinf_pct,
  ttFmt: (v) => br_fmt(v, 1) + '%',
  marks: { TUR: [[1994, 'top'], [2004, 'right'], [2022, 'top']] }, marksWith: ['LA6'],
  // la nota del PNG define la mediana solo si está a la vista, y aclara el dato de 2026 si se ve
  pngSource: (sel, extra) => br_t(sel.indexOf('LA6') >= 0 ? 'cinf-png-source-la6' : 'cinf-png-source') + (extra ? ' ' + br_t('cinf-png-extra') : ''),
  // último dato (TUR_INF.extra): inflación INTERANUAL de octubre de 2026, no el promedio anual de la serie. Se une a la
  // línea (joined) y su valor es la etiqueta final; el crosshair lo encabeza con ttHead. label y tt quedan para joined: false.
  extra: {
    data: () => TUR_INF.extra || [],
    joined: true,
    ttHead: (y) => br_t('cinf-extra-tt').replace('{Y}', y),
    label: (e) => br_t('cinf-extra-label').replace('{Y}', e.y).replace('{V}', br_fmt(e.v, 0)),
    tt: (e) => br_ttHTML(br_name(e.k), [[br_t('cinf-extra-tt').replace('{Y}', e.y), br_fmt(e.v, 2) + '%']], [br_t('cinf-extra-tt-note')]),
    csvMeasure: { col: { es: 'medida', en: 'measure' },
                  serie: { es: 'promedio anual (Banco Mundial)', en: 'annual average (World Bank)' },
                  extra: (e) => e.k === 'LA6'
                    ? { es: 'variación interanual de octubre (mediana de los institutos de estadística de cada país)', en: 'October year-on-year change (median of each country\'s statistics office)' }
                    : { es: 'variación interanual de octubre (TurkStat)', en: 'October year-on-year change (TurkStat)' } }
  },
  csvName: { LA6: { es: 'América Latina (mediana de Brasil, Chile, Colombia, México, Perú y Uruguay)',
                    en: 'Latin America (median of Brazil, Chile, Colombia, Mexico, Peru and Uruguay)' } },
  csv: { col: { es: 'inflacion_anual_pct', en: 'annual_inflation_pct' }, dec: 2,
         file: { es: 'el-atlas-turquia-inflacion.csv', en: 'the-atlas-turkey-inflation.csv' } }
});
function initCinf() { CINF.init(); }
function cinf_onLang() { CINF.onLang(); }
