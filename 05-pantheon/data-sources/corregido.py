# -*- coding: utf-8 -*-
"""Metodologia corregida del N°5 (talento) — punto unico de verdad.

Reemplaza el HPI del archivo Pantheon por el score reconstruido desde las vistas
por idioma/mes de la API (ver export_dataset.py -> pantheon_corregido.csv) y
aplica el gate multi-idioma (>=2 idiomas con >=1000 vistas acumuladas desde 2015).

Dos formas de usarlo:

  1. Como archivo. `python corregido.py` escribe master_corregido.csv, que es un
     reemplazo drop-in de persons_enriched.csv (mismas columnas y orden, filtrado
     por el gate, con hpi := score). Los scripts que leian persons_enriched
     solo cambian el nombre del archivo.

  2. Como modulo. `import corregido; df = corregido.aplicar(df)` hace lo mismo
     sobre cualquier DataFrame que tenga columna `id` (p.ej. person_2025_update).

En ambos casos queda `hpi_pantheon` con el valor viejo, por si hace falta comparar.
"""
import os, sys, warnings
import pandas as pd
warnings.filterwarnings('ignore')

DIR = os.path.dirname(os.path.abspath(__file__))
CORR = os.path.join(DIR, 'pantheon_corregido.csv')
PERSONS = os.path.join(DIR, 'persons_enriched.csv')
MASTER = os.path.join(DIR, 'master_corregido.csv')

_tabla = None


def tabla():
    """id -> multi_idioma, score, rank_score (una fila por id)."""
    global _tabla
    if _tabla is None:
        t = pd.read_csv(CORR, usecols=['id', 'multi_idioma', 'score', 'rank_score'], low_memory=False)
        assert t.id.is_unique, 'pantheon_corregido.csv tiene ids repetidos'
        _tabla = t
    return _tabla


def aplicar(df, gate=True, verbose=True, etiqueta=''):
    """Suma el score nuevo y aplica el gate. `hpi` pasa a ser score (0-100)."""
    if 'id' not in df.columns:
        raise KeyError('el DataFrame no tiene columna `id`; no se puede cruzar con el corregido')
    n0 = len(df)
    out = df.merge(tabla(), on='id', how='left')
    if 'hpi' in out.columns:
        out = out.rename(columns={'hpi': 'hpi_pantheon'})
    if gate:
        out = out[out.multi_idioma == 1]
    out = out[out.score.notna()]
    out['hpi'] = out.score
    out = out.reset_index(drop=True)
    if verbose:
        print('[corregido]%s %d -> %d figuras (gate multi-idioma + score reconstruido)'
              % ((' ' + etiqueta) if etiqueta else '', n0, len(out)))
    return out


def construir_master():
    """persons_enriched.csv -> master_corregido.csv (drop-in, mismas columnas)."""
    PE = pd.read_csv(PERSONS, low_memory=False)
    cols = list(PE.columns)
    # iso3 recuperado (ver recuperar_lugar.py). persons_enriched deja sin pais a las
    # figuras antiguas; sin esto la recuperacion no llega a ningun grafico, porque
    # todos agrupan por iso3 y no por la columna pais del dataset.
    rec = os.path.join(DIR, 'lugares_recuperados.csv')
    if os.path.exists(rec):
        r = pd.read_csv(rec)[['id', 'iso3']].dropna(subset=['iso3'])
        r = r.rename(columns={'iso3': '_iso'})
        PE = PE.merge(r, on='id', how='left')
        falta = PE.iso3.isna() & PE._iso.notna()
        PE.loc[falta, 'iso3'] = PE.loc[falta, '_iso']
        PE = PE.drop(columns=['_iso'])
        print('[corregido] iso3 recuperado en %d figuras' % int(falta.sum()))
    out = aplicar(PE, etiqueta='master')
    out = out[cols + ['hpi_pantheon', 'multi_idioma', 'rank_score']]
    out.to_csv(MASTER, index=False, encoding='utf-8', float_format='%.4f')
    print('=> master_corregido.csv | %d filas | %.1f MB' % (len(out), os.path.getsize(MASTER) / 1e6))
    print('   columnas:', ', '.join(out.columns))
    print('   hpi (nuevo)  p10/p50/p90: %.1f / %.1f / %.1f' % tuple(out.hpi.quantile([.1, .5, .9])))
    print('   hpi_pantheon p10/p50/p90: %.1f / %.1f / %.1f' % tuple(out.hpi_pantheon.quantile([.1, .5, .9])))
    top = out.nlargest(5, 'hpi')[['name', 'hpi']].values.tolist()
    print('   top 5:', ' | '.join('%s %.1f' % (n, h) for n, h in top))
    return out


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    construir_master()
