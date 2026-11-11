import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, EncabezadoVolver, NavPublica, Chips, TarjetaPartido, TablaPosiciones, ordenarPartidos, nombreEquipo, fechaCorta } from '../../componentes/comunes.jsx'
import { ordenEquipo } from './SeccionesClub.jsx'
import { fotoEquipoPublicable, fotoDelDia } from '../../datos/reglas.js'

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
  const equipos = estado.equipos.filter((e) => e.categoriaId === id).sort((x, y) => ordenEquipo(x.id) - ordenEquipo(y.id))
  const [equipoId, setEquipoId] = useState(equipos[0]?.id)
  const [pestana, setPestana] = useState('equipo')
  if (!cat) return null
  const equipo = equipos.find((e) => e.id === equipoId) || equipos[0]
  const delEquipo = estado.jugadores.filter((j) => j.equipoId === equipo.id)
  const foto = fotoEquipoPublicable(equipo, delEquipo)
  const tabla = (estado.tablas || []).find((t) => t.equipoId === equipo.id)
  const partidos = ordenarPartidos(estado.partidos.filter((p) => p.equipoId === equipo.id))
  const proximos = partidos.filter((p) => p.estado !== 'jugado' && (!p.fecha || p.fecha >= hoyISO))
  const jugados = partidos.filter((p) => p.estado === 'jugado').reverse()
  const pestanaActiva = !cat.conFixture ? 'equipo' : pestana

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
            <button type="button" role="tab" aria-selected={pestana === 'equipo'} onClick={() => setPestana('equipo')}>Equipo y posiciones</button>
            <button type="button" role="tab" aria-selected={pestana === 'partidos'} onClick={() => setPestana('partidos')}>Partidos</button>
          </div>
        ) : null}

        {pestanaActiva === 'equipo' ? (
          <>
            <figure className="tarjeta foto-equipo">
              {foto && equipo.fotoUrl ? (
                <img src={fotoDelDia(equipo, hoyISO)} alt={`Foto del equipo ${nombreEquipo(equipo, categoriaPorId)}`} />
              ) : (
                <div className="rayado">
                  {foto ? 'Foto del equipo (ejemplo)' : equipo.fotoCargada ? 'La foto del equipo se publica cuando todos tengan autorización de imagen.' : 'Foto del equipo pendiente de carga.'}
                </div>
              )}
              <figcaption>{cat.nombre}{equipos.length > 1 ? ` · ${equipo.nombre}` : ''} · Temporada {hoyISO.slice(0, 4)}</figcaption>
            </figure>
          {cat.conFixture ? (
          <section className="seccion">
            <div className="seccion-cabeza">
              <h2 className="h2">Posiciones</h2>
              {tabla ? <span className="mini suave">{tabla.fuente === 'arf' ? 'Actualizada automáticamente · ' : 'Actualizada el '}{tabla.fuente === 'arf' ? fechaCorta(tabla.actualizada) : fechaCorta(tabla.actualizada)}</span> : null}
            </div>
            {tabla && tabla.filas.length ? (
              <>
                <TablaPosiciones filas={tabla.filas} />
                <span className="mini suave">Fuente: Asociación Rosarina de Fútbol.</span>
              </>
            ) : <div className="tarjeta vacio">La tabla de posiciones de este equipo todavía no está cargada.</div>}
          </section>
          ) : null}
          </>
        ) : null}

        {pestanaActiva === 'partidos' ? (
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
        ) : null}
      </main>
      <NavPublica actual="categorias" />
    </>
  )
}
