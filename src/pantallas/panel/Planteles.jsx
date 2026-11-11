import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { Interruptor, nombreEquipo } from '../../componentes/comunes.jsx'
import { esAdmin, equiposEditables, puedeAparecerEnFotos, fotoEquipoPublicable } from '../../datos/reglas.js'
import { subirImagen, borrarImagen } from '../../datos/nube.js'

function estadoAut(j) {
  return puedeAparecerEnFotos(j)
    ? { texto: 'Autoriza aparecer en fotos', clase: 'insignia-ok' }
    : { texto: 'Sin autorización de fotos', clase: 'insignia-alerta' }
}

function EditorAutorizacion({ j, alCerrar }) {
  const { ejecutar, mostrarToast } = useApp()
  const [imagen, setImagen] = useState(puedeAparecerEnFotos(j))
  const [fecha, setFecha] = useState(j.autorizacion.fecha || '')
  const guardar = () => {
    if (imagen && !fecha) {
      mostrarToast('Indicá la fecha en que se firmó la autorización.', 'error')
      return
    }
    const autorizacion = imagen ? { nombre: 'corto', imagen: true, fecha } : { nombre: null, imagen: false, fecha: null }
    if (ejecutar('jugador/autorizacion', { jugadorId: j.id, autorizacion })) {
      mostrarToast('Autorización guardada.')
      alCerrar()
    }
  }
  return (
    <div className="form" style={{ paddingTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Autoriza aparecer en fotos y videos del club</span>
        <Interruptor activo={imagen} etiqueta="Autoriza aparecer en fotos" onCambio={setImagen} />
      </div>
      {imagen ? (
        <div className="campo">
          <label htmlFor={`aut-fecha-${j.id}`}>Autorización firmada el</label>
          <input id={`aut-fecha-${j.id}`} type="date" className="control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      ) : null}
      <span className="ayuda">
        {imagen ? 'Puede figurar en la foto del equipo y en la galería.' : 'Mientras falte esta autorización, la foto del equipo no se publica.'}
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
  const [entrenador, setEntrenador] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', apellido: '', dorsal: '', posicion: '', esMenor: true })

  const equipo = mios.find((e) => e.id === equipoId)
  if (!equipo) return null
  const jugadores = estado.jugadores.filter((j) => j.equipoId === equipo.id).sort((a, b) => a.dorsal - b.dorsal)
  const pendientes = jugadores.filter((j) => !puedeAparecerEnFotos(j))
  const lista = soloPend ? pendientes : jugadores
  const foto = fotoEquipoPublicable(equipo, jugadores)

  const guardarEntrenador = () => {
    if (ejecutar('equipo/entrenador', { equipoId: equipo.id, entrenador: (entrenador ?? equipo.entrenador ?? '').trim() })) {
      mostrarToast('Entrenador guardado.')
      setEntrenador(null)
    }
  }
  const pool = [...new Set([equipo.fotoUrl, ...(equipo.fotos || [])].filter(Boolean))]
  const agregarFotos = async (e) => {
    const archivos = [...(e.target.files || [])]
    e.target.value = ''
    if (!archivos.length) return
    setSubiendo(true)
    const urls = []
    try {
      for (const f of archivos) urls.push(await subirImagen(f, `equipos/${equipo.id}`))
    } catch (err) {
      mostrarToast(err.message || 'No se pudo subir alguna foto.', 'error')
    }
    if (urls.length && ejecutar('equipo/fotos', { equipoId: equipo.id, fotos: [...pool, ...urls] })) {
      mostrarToast(urls.length === 1 ? 'Foto agregada.' : `${urls.length} fotos agregadas.`)
    }
    setSubiendo(false)
  }
  const quitarFoto = (url) => {
    if (ejecutar('equipo/fotos', { equipoId: equipo.id, fotos: pool.filter((u) => u !== url) })) {
      borrarImagen(url)
      mostrarToast('Foto quitada.')
    }
  }

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
      mostrarToast(admin ? 'Jugador agregado. Falta cargar su autorización de fotos.' : 'Jugador agregado. La administradora tiene que cargar su autorización de fotos.')
      setNuevo({ nombre: '', apellido: '', dorsal: '', posicion: '', esMenor: nuevo.esMenor })
    }
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">Equipo</h1>
        <div className="campo">
          <label htmlFor="pl-equipo">Equipo</label>
          <select id="pl-equipo" className="control" value={equipo.id} onChange={(e) => { setEquipoId(e.target.value); setAbierto(null) }}>
            {mios.map((e) => <option key={e.id} value={e.id}>{nombreEquipo(e, categoriaPorId)}</option>)}
          </select>
        </div>

        <section className="tarjeta seccion" style={{ padding: 14 }}>
          <h2 className="h2" style={{ fontSize: 20 }}>Lo que se ve en la app</h2>
          {admin ? (
            <div className="campo">
              <label htmlFor="eq-entrenador">Entrenador (se publica su nombre)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="eq-entrenador" className="control" style={{ flex: 1 }} value={entrenador ?? equipo.entrenador ?? ''} onChange={(e) => setEntrenador(e.target.value)} autoComplete="off" />
                <button type="button" className="btn btn-primario" onClick={guardarEntrenador}>Guardar</button>
              </div>
            </div>
          ) : (
            <span className="chico">Entrenador: <b>{equipo.entrenador || 'sin cargar'}</b></span>
          )}
          {admin ? (
            <div className="seccion">
              {pool.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {pool.map((u) => (
                    <div key={u} style={{ position: 'relative' }}>
                      <img src={u} alt="Foto del equipo" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} />
                      <button type="button" aria-label="Quitar foto" onClick={() => quitarFoto(u)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: '50%', border: 0, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 16 }}>×</button>
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="btn btn-secundario" style={{ textAlign: 'center', cursor: subiendo ? 'wait' : 'pointer' }}>
                {subiendo ? 'Subiendo…' : pool.length ? 'Agregar más fotos' : 'Subir fotos del equipo'}
                <input type="file" accept="image/*" multiple onChange={agregarFotos} disabled={subiendo} style={{ display: 'none' }} />
              </label>
              <span className="ayuda">Podés subir varias: la app muestra una distinta cada 24 hs. Solo se publican cuando todos los jugadores del equipo tienen autorización para aparecer en fotos.</span>
            </div>
          ) : null}
        </section>

        <div className="tarjeta fila" style={{ alignItems: 'flex-start' }}>
          <span className="crece">
            <span style={{ fontWeight: 600 }}>Foto del equipo</span>
            <span className="mini suave">
              {!equipo.fotoCargada ? 'Todavía no se cargó.' : foto ? 'Cargada y publicada.' : `Cargada pero oculta: ${pendientes.length} sin autorización de imagen.`}
            </span>
          </span>
          <span className={`insignia ${foto ? 'insignia-ok' : 'insignia-alerta'}`}>{foto ? 'Publicada' : 'No publicada'}</span>
        </div>

        <div className="seccion-cabeza">
          <h2 className="h2" style={{ fontSize: 20 }}>Jugadores</h2>
          <span className="mini suave">Lista interna, no se publica</span>
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
          <span className="ayuda">No se cargan DNI, fecha de nacimiento ni domicilio. La lista es interna: sirve para saber quién autorizó aparecer en fotos.</span>
          <button type="submit" className="btn btn-primario">Agregar</button>
        </form>
      </main>
      <NavPanel actual="panel-planteles" />
    </>
  )
}
