import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { Interruptor, nombreEquipo } from '../../componentes/comunes.jsx'
import { esAdmin, equiposEditables, jugadorVisible, nombrePublico, puedeAparecerEnFotos, fotoEquipoPublicable } from '../../datos/reglas.js'

function estadoAut(j) {
  if (!jugadorVisible(j)) return { texto: 'Sin autorización', clase: 'insignia-alerta' }
  const nombre = j.autorizacion.nombre === 'completo' ? 'completo' : 'corto'
  return { texto: `Fotos: ${j.autorizacion.imagen ? 'sí' : 'no'} · Nombre: ${nombre}`, clase: j.autorizacion.imagen ? 'insignia-ok' : 'insignia-alerta' }
}

function EditorAutorizacion({ j, alCerrar }) {
  const { ejecutar, mostrarToast } = useApp()
  const [nombre, setNombre] = useState(j.autorizacion.nombre || 'ninguno')
  const [imagen, setImagen] = useState(!!j.autorizacion.imagen)
  const [fecha, setFecha] = useState(j.autorizacion.fecha || '')
  const previa = { ...j, autorizacion: { nombre: nombre === 'ninguno' ? null : nombre, imagen: nombre === 'ninguno' ? false : imagen, fecha } }
  const guardar = () => {
    if (nombre !== 'ninguno' && !fecha) {
      mostrarToast('Indicá la fecha en que se firmó la autorización.', 'error')
      return
    }
    if (ejecutar('jugador/autorizacion', { jugadorId: j.id, autorizacion: previa.autorizacion })) {
      mostrarToast('Autorización guardada.')
      alCerrar()
    }
  }
  return (
    <div className="form" style={{ paddingTop: 4 }}>
      <div className="campo">
        <label htmlFor={`aut-nom-${j.id}`}>Nombre que se publica</label>
        <select id={`aut-nom-${j.id}`} className="control" value={nombre} onChange={(e) => setNombre(e.target.value)}>
          <option value="ninguno">No aparece en el plantel</option>
          <option value="corto">{j.nombre} {j.apellido.charAt(0)}.</option>
          <option value="completo">{j.nombre} {j.apellido}</option>
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Autoriza aparecer en fotos</span>
        <Interruptor activo={nombre !== 'ninguno' && imagen} etiqueta="Autoriza aparecer en fotos" onCambio={(v) => setImagen(v)} />
      </div>
      <div className="campo">
        <label htmlFor={`aut-fecha-${j.id}`}>Autorización firmada el</label>
        <input id={`aut-fecha-${j.id}`} type="date" className="control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <span className="ayuda">
        Así se va a ver: {nombrePublico(previa) ? `"${nombrePublico(previa)}" en el plantel` : 'no aparece en el plantel'}
        {puedeAparecerEnFotos(previa) ? ' y puede figurar en fotos.' : ' y no puede figurar en fotos publicadas.'}
      </span>
      <div className="grilla-2">
        <button type="button" className="btn btn-secundario" onClick={alCerrar}>Cancelar</button>
        <button type="button" className="btn btn-primario" onClick={guardar}>Guardar</button>
      </div>
    </div>
  )
}

export default function PanelPlanteles() {
  const { estado, usuario, ejecutar, mostrarToast, categoriaPorId } = useApp()
  const admin = esAdmin(usuario)
  const mios = equiposEditables(usuario, estado.equipos)
  const [equipoId, setEquipoId] = useState(mios.find((e) => estado.jugadores.some((j) => j.equipoId === e.id))?.id || mios[0]?.id)
  const [abierto, setAbierto] = useState(null)
  const [soloPend, setSoloPend] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', apellido: '', dorsal: '', posicion: '', esMenor: true })

  const equipo = mios.find((e) => e.id === equipoId)
  if (!equipo) return null
  const jugadores = estado.jugadores.filter((j) => j.equipoId === equipo.id).sort((a, b) => a.dorsal - b.dorsal)
  const pendientes = jugadores.filter((j) => !jugadorVisible(j) || !puedeAparecerEnFotos(j))
  const lista = soloPend ? pendientes : jugadores
  const foto = fotoEquipoPublicable(equipo, jugadores)

  const agregar = (e) => {
    e.preventDefault()
    if (!nuevo.nombre.trim() || !nuevo.apellido.trim()) {
      mostrarToast('Completá nombre y apellido.', 'error')
      return
    }
    const ok = ejecutar('jugador/agregar', {
      jugador: { equipoId: equipo.id, nombre: nuevo.nombre.trim(), apellido: nuevo.apellido.trim(), dorsal: Number(nuevo.dorsal) || 0, posicion: nuevo.posicion.trim() || '—', esMenor: nuevo.esMenor, autorizacion: { nombre: null, imagen: false, fecha: null } },
    })
    if (ok) {
      mostrarToast(admin ? 'Jugador agregado. Falta cargar su autorización.' : 'Jugador agregado. La administradora tiene que cargar su autorización para que aparezca.')
      setNuevo({ nombre: '', apellido: '', dorsal: '', posicion: '', esMenor: nuevo.esMenor })
    }
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">Plantel</h1>
        <div className="campo">
          <label htmlFor="pl-equipo">Equipo</label>
          <select id="pl-equipo" className="control" value={equipo.id} onChange={(e) => { setEquipoId(e.target.value); setAbierto(null) }}>
            {mios.map((e) => <option key={e.id} value={e.id}>{nombreEquipo(e, categoriaPorId)}</option>)}
          </select>
        </div>

        <div className="tarjeta fila" style={{ alignItems: 'flex-start' }}>
          <span className="crece">
            <span style={{ fontWeight: 600 }}>Foto del equipo</span>
            <span className="mini suave">
              {!equipo.fotoCargada ? 'Todavía no se cargó.' : foto ? 'Cargada y publicada.' : `Cargada pero oculta: ${pendientes.length} sin autorización de imagen.`}
            </span>
          </span>
          <span className={`insignia ${foto ? 'insignia-ok' : 'insignia-alerta'}`}>{foto ? 'Publicada' : 'No publicada'}</span>
        </div>

        <div className="chips">
          <button type="button" className="chip" aria-pressed={!soloPend} onClick={() => setSoloPend(false)}>Todos ({jugadores.length})</button>
          <button type="button" className="chip" aria-pressed={soloPend} onClick={() => setSoloPend(true)}>Autorización incompleta ({pendientes.length})</button>
        </div>

        {lista.length === 0 ? <div className="tarjeta vacio">{jugadores.length ? 'Todos tienen la autorización completa.' : 'Este equipo todavía no tiene jugadores cargados.'}</div> : (
          <div className="lista">
            {lista.map((j) => {
              const est = estadoAut(j)
              const abiertoAca = abierto === j.id
              return (
                <div key={j.id} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="dorsal num" style={{ fontSize: 20 }}>{j.dorsal}</span>
                    <span className="crece" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>{j.nombre} {j.apellido}</span>
                      <span className="mini suave">{j.posicion}{j.esMenor ? ' · Menor de edad' : ''}</span>
                    </span>
                    {admin ? (
                      <button type="button" className="link-btn" aria-expanded={abiertoAca} onClick={() => setAbierto(abiertoAca ? null : j.id)}>{abiertoAca ? 'Cerrar' : 'Autorización'}</button>
                    ) : null}
                  </div>
                  <span className={`insignia ${est.clase}`}>{est.texto}</span>
                  {admin && abiertoAca ? <EditorAutorizacion j={j} alCerrar={() => setAbierto(null)} /> : null}
                </div>
              )
            })}
          </div>
        )}
        {!admin ? <p className="ayuda" style={{ margin: 0 }}>Las autorizaciones las carga solo la administradora.</p> : null}

        <form className="tarjeta form" style={{ padding: 14 }} onSubmit={agregar}>
          <h2 className="h2" style={{ fontSize: 20 }}>Agregar jugador</h2>
          <div className="grilla-2">
            <div className="campo"><label htmlFor="nj-nombre">Nombre</label><input id="nj-nombre" className="control" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} autoComplete="off" /></div>
            <div className="campo"><label htmlFor="nj-apellido">Apellido</label><input id="nj-apellido" className="control" value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} autoComplete="off" /></div>
            <div className="campo"><label htmlFor="nj-dorsal">Dorsal</label><input id="nj-dorsal" className="control num" inputMode="numeric" value={nuevo.dorsal} onChange={(e) => setNuevo({ ...nuevo, dorsal: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
            <div className="campo"><label htmlFor="nj-pos">Posición</label><input id="nj-pos" className="control" value={nuevo.posicion} onChange={(e) => setNuevo({ ...nuevo, posicion: e.target.value })} /></div>
          </div>
          <label className="check" htmlFor="nj-menor"><input id="nj-menor" type="checkbox" checked={nuevo.esMenor} onChange={(e) => setNuevo({ ...nuevo, esMenor: e.target.checked })} />Es menor de edad</label>
          <span className="ayuda">No se cargan DNI, fecha de nacimiento ni domicilio. El jugador no aparece en la app hasta tener autorización.</span>
          <button type="submit" className="btn btn-primario">Agregar</button>
        </form>
      </main>
      <NavPanel actual="panel-planteles" />
    </>
  )
}
