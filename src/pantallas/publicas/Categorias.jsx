import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, EncabezadoVolver, NavPublica, Chips, TarjetaPartido, ordenarPartidos } from '../../componentes/comunes.jsx'
import { jugadorVisible, nombrePublico, fotoEquipoPublicable } from '../../datos/reglas.js'

export function ListaCategorias() {
  const { estado, ir, categorias } = useApp()
  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <h1 className="h1">Categorías</h1>
        <div className="lista">
          {categorias.map((c) => {
            const equipos = estado.equipos.filter((e) => e.categoriaId === c.id)
            const detalle = equipos.length > 1
              ? [...new Set(equipos.map((e) => (e.grupo === 'inferiores' ? (e.division === 'Sub-14' ? 'Inferiores Sub-14' : 'Inferiores 4ta a 9na') : e.nombre)))].join(' · ')
              : c.conFixture ? 'Un equipo' : 'Sin fixture'
            return (
              <button key={c.id} type="button" className="fila fila-btn" onClick={() => ir(`categoria-${c.id}`)}>
                <span className="crece">
                  <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}>{c.nombre}</span>
                  <span className="mini suave">{detalle}</span>
                </span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            )
          })}
        </div>
      </main>
      <NavPublica actual="categorias" />
    </>
  )
}

export function DetalleCategoria({ id }) {
  const { estado, hoyISO, categoriaPorId } = useApp()
  const cat = categoriaPorId[id]
  const equipos = estado.equipos.filter((e) => e.categoriaId === id)
  const [equipoId, setEquipoId] = useState(equipos[0]?.id)
  const [pestana, setPestana] = useState('plantel')
  if (!cat) return null
  const equipo = equipos.find((e) => e.id === equipoId) || equipos[0]
  const delEquipo = estado.jugadores.filter((j) => j.equipoId === equipo.id)
  const visibles = delEquipo.filter(jugadorVisible).sort((a, b) => a.dorsal - b.dorsal)
  const foto = fotoEquipoPublicable(equipo, delEquipo)
  const partidos = ordenarPartidos(estado.partidos.filter((p) => p.equipoId === equipo.id))
  const proximos = partidos.filter((p) => p.estado !== 'jugado' && p.fecha >= hoyISO)
  const jugados = partidos.filter((p) => p.estado === 'jugado').reverse()

  return (
    <>
      <EncabezadoVolver titulo={cat.nombre} volverA="categorias" />
      <main className="contenido g">
        {equipos.length > 1 ? (
          <Chips etiqueta="Equipo" valor={equipo.id} onCambio={setEquipoId}
            opciones={equipos.map((e) => ({ valor: e.id, texto: e.grupo === 'inferiores' ? e.division : e.nombre }))} />
        ) : null}
        {cat.conFixture ? (
          <div className="pestanas" role="tablist">
            <button type="button" role="tab" aria-selected={pestana === 'plantel'} onClick={() => setPestana('plantel')}>Plantel</button>
            <button type="button" role="tab" aria-selected={pestana === 'partidos'} onClick={() => setPestana('partidos')}>Partidos</button>
          </div>
        ) : null}

        {pestana === 'plantel' || !cat.conFixture ? (
          <>
            <figure className="tarjeta foto-equipo">
              <div className="rayado">
                {foto ? 'Foto del equipo (ejemplo)' : equipo.fotoCargada ? 'La foto del equipo se publica cuando todos tengan autorización de imagen.' : 'Foto del equipo pendiente de carga.'}
              </div>
              <figcaption>{cat.nombre}{equipos.length > 1 ? ` · ${equipo.nombre}` : ''} · Temporada {hoyISO.slice(0, 4)}</figcaption>
            </figure>
            <section className="seccion">
              <div className="seccion-cabeza">
                <h2 className="h2">Plantel</h2>
                <span className="mini suave">Solo con autorización</span>
              </div>
              {visibles.length === 0 ? (
                <div className="tarjeta vacio">El plantel de este equipo todavía no está cargado.</div>
              ) : (
                <ul className="lista">
                  {visibles.map((j) => (
                    <li key={j.id} className="fila">
                      <span className="dorsal num">{j.dorsal}</span>
                      <span className="crece" style={{ fontWeight: 600 }}>{nombrePublico(j)}</span>
                      <span className="chico suave">{j.posicion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="seccion">
              <h2 className="h2">Próximos</h2>
              {proximos.length ? proximos.map((p) => <TarjetaPartido key={p.id} partido={p} mostrarFecha />) : <div className="tarjeta vacio">Sin partidos programados.</div>}
            </section>
            <section className="seccion">
              <h2 className="h2">Resultados</h2>
              {jugados.length ? jugados.map((p) => <TarjetaPartido key={p.id} partido={p} mostrarFecha />) : <div className="tarjeta vacio">Sin resultados cargados.</div>}
            </section>
          </>
        )}
      </main>
      <NavPublica actual="categorias" />
    </>
  )
}
