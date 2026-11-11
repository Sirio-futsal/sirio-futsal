import { useApp } from '../../estado.jsx'
import { NavPublica, Icono, ESCUDO, AvisoPrueba, fechaLarga, nombreEquipo, iniciales } from '../../componentes/comunes.jsx'

export default function Partido({ id }) {
  const { estado, ir, ejecutar, mostrarToast, equipoPorId, categoriaPorId } = useApp()
  const p = estado.partidos.find((x) => x.id === id)
  if (!p) {
    return (
      <main className="contenido g">
        <div className="tarjeta vacio">No encontramos ese partido.</div>
        <button type="button" className="btn btn-secundario" onClick={() => ir('fixture')}>Ir al fixture</button>
      </main>
    )
  }
  const equipo = equipoPorId[p.equipoId]
  const local = p.condicion === 'local'
  const jugado = p.estado === 'jugado'
  const izq = local ? { nombre: 'Sirio', sirio: true, goles: p.golesSirio } : { nombre: p.rival, sirio: false, goles: p.golesRival }
  const der = local ? { nombre: p.rival, sirio: false, goles: p.golesRival } : { nombre: 'Sirio', sirio: true, goles: p.golesSirio }
  const escudo = (lado) => (lado.sirio ? <img src={ESCUDO} alt="Escudo de Sirio" style={{ width: 68, height: 68 }} /> : <span className="escudo-rival" style={{ width: 64, height: 64 }}>{iniciales(lado.nombre)}</span>)

  return (
    <>
      <header className="encabezado">
        <div className="g" style={{ paddingBottom: 22 }}>
          <div className="encabezado-fila" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="btn-icono" style={{ marginLeft: -12 }} aria-label="Volver al fixture" onClick={() => ir('fixture')}>{Icono.atras()}</button>
            <span className="hero-rotulo" style={{ fontSize: 14 }}>{nombreEquipo(equipo, categoriaPorId).toUpperCase()}</span>
          </div>
          <div className="duelo">
            <div className="equipo-duelo">{escudo(izq)}<span className="nombre-duelo">{izq.nombre}</span></div>
            <div className="equipo-duelo">
              {jugado ? <span className="marcador num">{izq.goles} – {der.goles}</span> : <span className="marcador num" style={{ fontSize: 38 }}>{p.hora || 'A conf.'}</span>}
              <span className="hero-chip" style={{ background: jugado ? 'var(--verde-claro)' : 'var(--barra-chip)', color: jugado ? '#0d0f0e' : 'inherit', fontWeight: 700 }}>
                {jugado ? 'FINALIZADO' : p.estado === 'programado' ? 'PROGRAMADO' : p.estado.toUpperCase()}
              </span>
            </div>
            <div className="equipo-duelo">{escudo(der)}<span className="nombre-duelo">{der.nombre}</span></div>
          </div>
        </div>
        <AvisoPrueba />
      </header>
      <main className="contenido g">
        <div className="lista">
          <div className="nota-dato"><span className="suave">Fecha</span><span style={{ textTransform: 'capitalize' }}>{fechaLarga(p.fecha)}</span></div>
          <div className="nota-dato"><span className="suave">Hora</span><span className="num">{p.hora || 'A confirmar'}{p.horaAnterior ? ` (antes ${p.horaAnterior})` : ''}</span></div>
          <div className="nota-dato"><span className="suave">Condición</span><span>{local ? 'Local' : 'Visitante'}</span></div>
          <div className="nota-dato"><span className="suave">Cancha</span><span>{p.cancha || 'A confirmar'}</span></div>
          <div className="nota-dato"><span className="suave">Fuente</span><span>{p.origen === 'arf' ? 'Asociación Rosarina, aprobado por el club' : 'Club Argentino Sirio'}</span></div>
        </div>
        {p.horaAnterior && !jugado ? <span className="insignia insignia-alerta">Cambio de horario: antes {p.horaAnterior}, ahora {p.hora}</span> : null}
        {estado.preferencias.seguidos.includes(equipo.id) ? (
          <button type="button" className="btn btn-secundario btn-bloque" onClick={() => ir('avisos')}>
            Ya seguís a este equipo · ver avisos
          </button>
        ) : (
          <button type="button" className="btn btn-primario btn-bloque"
            onClick={() => { ejecutar('preferencias', { cambios: { seguidos: [...estado.preferencias.seguidos, equipo.id] } }); mostrarToast(`Ahora seguís a ${nombreEquipo(equipo, categoriaPorId)}.`) }}>
            {Icono.campana({ width: 20, height: 20 })}Seguir a este equipo
          </button>
        )}
      </main>
      <NavPublica actual="fixture" />
    </>
  )
}
