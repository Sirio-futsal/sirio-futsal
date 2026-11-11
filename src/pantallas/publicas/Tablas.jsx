import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoVolver, NavPublica, TablaPosiciones, nombreEquipo, fechaCorta } from '../../componentes/comunes.jsx'
import { filaDeSirio } from '../../datos/reglas.js'

// Todas las tablas de posiciones en un solo lugar, con acceso rápido por equipo.
export default function Tablas() {
  const { estado, equipoPorId, categoriaPorId } = useApp()
  const items = (estado.tablas || [])
    .map((t) => ({ t, equipo: equipoPorId[t.equipoId] }))
    .filter((x) => x.equipo && x.t.filas && x.t.filas.length)
    .sort((a, b) => (categoriaPorId[a.equipo.categoriaId]?.orden ?? 0) - (categoriaPorId[b.equipo.categoriaId]?.orden ?? 0))
  const [sel, setSel] = useState(items[0]?.t.equipoId)
  const actual = items.find((x) => x.t.equipoId === sel) || items[0]
  return (
    <>
      <EncabezadoVolver titulo="Tabla de posiciones" volverA="inicio" />
      <main className="contenido g">
        {!items.length ? <div className="tarjeta vacio">Todavía no hay tablas cargadas.</div> : (
          <>
            <nav className="chips" aria-label="Elegí el equipo">
              {items.map(({ t, equipo }) => (
                <button key={t.equipoId} type="button" className="chip" aria-pressed={actual.t.equipoId === t.equipoId}
                  style={actual.t.equipoId === t.equipoId ? { background: 'var(--rojo, #c8102e)', color: '#fff' } : undefined}
                  onClick={() => setSel(t.equipoId)}>
                  {nombreEquipo(equipo, categoriaPorId)}
                </button>
              ))}
            </nav>
            <section className="seccion">
              <div className="seccion-cabeza">
                <h2 className="h2">{nombreEquipo(actual.equipo, categoriaPorId)}</h2>
                <span className="mini suave">{actual.t.fuente === 'arf' ? 'Actualizada automáticamente · ' : 'Actualizada el '}{fechaCorta(actual.t.actualizada)}</span>
              </div>
              <TablaPosiciones filas={actual.t.filas} />
              <span className="mini suave">Fuente: Asociación Rosarina de Fútbol.</span>
            </section>
          </>
        )}
      </main>
      <NavPublica actual="inicio" />
    </>
  )
}
