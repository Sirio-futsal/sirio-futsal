import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { nombreEquipo, fechaCorta, fechaLarga, ESCUDO } from '../../componentes/comunes.jsx'
import { esAdmin, equiposEditables } from '../../datos/reglas.js'
import { NUBE_ACTIVA } from '../../datos/nube.js'

export function PanelMas() {
  const { estado, usuario, ir, ejecutar, mostrarToast } = useApp()
  const admin = esAdmin(usuario)
  const [confirmarReset, setConfirmarReset] = useState(false)
  const Item = ({ vista, titulo, detalle, cifra }) => (
    <button type="button" className="fila fila-btn" onClick={() => ir(vista)}>
      <span className="crece"><span style={{ fontWeight: 600 }}>{titulo}</span>{detalle ? <span className="mini suave">{detalle}</span> : null}</span>
      {cifra != null ? <span className="cifra oscura num">{cifra}</span> : null}
      <span className="chev" aria-hidden="true">›</span>
    </button>
  )
  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">Más</h1>
        <div className="lista">
          <Item vista="panel-aviso" titulo="Enviar aviso" detalle={admin ? 'A todo el club, una categoría o un equipo' : 'A quienes siguen tus equipos'} />
          {admin ? (
            <>
              <Item vista="panel-entrenadores" titulo="Accesos de entrenadores" detalle="Invitar y asignar equipos" cifra={estado.usuarios.filter((u) => u.rol === 'entrenador').length} />
              <Item vista="panel-rosarina" titulo="Datos de la Rosarina" detalle="Revisar y aprobar antes de publicar" cifra={estado.sugerencias.length} />
              <Item vista="panel-playoffs" titulo="Playoffs" detalle="Subir la planilla de la Asociación" cifra={(estado.programacion || []).filter((f) => f.tipo === 'partido').length} />
              <Item vista="panel-tablas" titulo="Tablas de posiciones" detalle="Copiar de la web de la Rosarina" cifra={(estado.tablas || []).length} />
              <Item vista="panel-galeria" titulo="Galería de fotos" detalle="Subir y quitar fotos" cifra={(estado.galeria || []).length} />
              <Item vista="panel-club" titulo="Datos del club" detalle="Historia, contacto, sponsors y archivo" />
              <Item vista="panel-boletin" titulo="Jugadores en boletín" detalle="Cargar el boletín de la Rosarina" cifra={estado.boletin ? estado.boletin.jugadores.length : 0} />
              <Item vista="panel-sync" titulo="Lectura automática" detalle="Estado de la Rosarina y del boletín" />
              <Item vista="panel-inscriptos" titulo="Inscripciones" detalle="Datos privados de las familias" cifra={estado.inscripciones.length} />
            </>
          ) : null}
          <Item vista="inicio" titulo="Ver la app pública" />
        </div>

        {admin ? (
          <section className="tarjeta seccion" style={{ padding: 14 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>Copia de seguridad</h2>
            <p className="chico suave" style={{ margin: 0 }}>
              En la versión real, este botón descarga todos los datos del club en una planilla. Conviene hacerlo una vez por mes.
            </p>
            <p className="mini suave" style={{ margin: 0 }}>
              Hoy hay {estado.partidos.length} partidos, {estado.jugadores.length} jugadores, {estado.noticias.length} noticias y {estado.inscripciones.length} inscripciones cargadas.
            </p>
            <button type="button" className="btn btn-secundario" onClick={() => mostrarToast('En la versión de prueba no se descargan archivos.')}>Descargar copia</button>
          </section>
        ) : null}

        {admin && !NUBE_ACTIVA ? (
          <section className="tarjeta seccion" style={{ padding: 14 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>Datos de prueba</h2>
            <p className="chico suave" style={{ margin: 0 }}>Vuelve todo a los datos de ejemplo originales. Solo afecta a este navegador.</p>
            {confirmarReset ? (
              <div className="grilla-2">
                <button type="button" className="btn btn-secundario" onClick={() => setConfirmarReset(false)}>Cancelar</button>
                <button type="button" className="btn btn-peligro" onClick={() => { ejecutar('restablecer'); mostrarToast('Datos de ejemplo restablecidos.'); ir('inicio') }}>Sí, restablecer</button>
              </div>
            ) : (
              <button type="button" className="btn btn-peligro" onClick={() => setConfirmarReset(true)}>Restablecer datos de ejemplo</button>
            )}
          </section>
        ) : null}

        <button type="button" className="btn btn-secundario" onClick={() => { ejecutar('salir'); mostrarToast('Saliste del panel.'); ir('inicio') }}>Salir del panel</button>
      </main>
      <NavPanel actual="panel-mas" />
    </>
  )
}

function SelectorEquipos({ seleccion, onCambio, prefijo }) {
  const { estado, categorias, categoriaPorId } = useApp()
  const alternar = (id, on) => onCambio(on ? [...seleccion, id] : seleccion.filter((x) => x !== id))
  return (
    <div className="form" style={{ gap: 10 }}>
      {categorias.map((c) => (
        <fieldset key={c.id} style={{ border: 'none', margin: 0, padding: 0 }}>
          <legend className="rotulo-verde" style={{ padding: 0, marginBottom: 4 }}>{c.nombre}</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12 }}>
            {estado.equipos.filter((e) => e.categoriaId === c.id).map((e) => (
              <label key={e.id} className="check" htmlFor={`${prefijo}-${e.id}`} style={{ minHeight: 34, fontSize: 13 }}>
                <input id={`${prefijo}-${e.id}`} type="checkbox" checked={seleccion.includes(e.id)} onChange={(ev) => alternar(e.id, ev.target.checked)} />
                {categoriaPorId[e.categoriaId].conFixture && estado.equipos.filter((x) => x.categoriaId === c.id).length > 1 ? e.nombre : c.nombre}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

export function PanelEntrenadores() {
  const { estado, ejecutar, mostrarToast, equipoPorId, categoriaPorId } = useApp()
  const [f, setF] = useState({ nombre: '', email: '', equipos: [] })
  const [editando, setEditando] = useState(null)
  const [quitando, setQuitando] = useState(null)
  const entrenadores = estado.usuarios.filter((u) => u.rol === 'entrenador')

  const invitar = (e) => {
    e.preventDefault()
    if (!f.nombre.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      mostrarToast('Completá el nombre y un email válido.', 'error')
      return
    }
    if (!f.equipos.length) {
      mostrarToast('Elegí al menos un equipo.', 'error')
      return
    }
    if (ejecutar('entrenador/invitar', { nombre: f.nombre.trim(), email: f.email.trim(), equipos: f.equipos })) {
      mostrarToast(NUBE_ACTIVA ? 'Invitación registrada. Pedile que cree su cuenta en la app con ese email.' : 'Invitación registrada. En la versión real le llega un email para crear su contraseña.')
      setF({ nombre: '', email: '', equipos: [] })
    }
  }

  return (
    <>
      <EncabezadoPanel titulo="Entrenadores" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <form className="tarjeta form" style={{ padding: 14 }} onSubmit={invitar}>
            <h2 className="h2" style={{ fontSize: 20 }}>Invitar entrenador</h2>
            <div className="campo"><label htmlFor="ent-nombre">Nombre</label><input id="ent-nombre" className="control" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoComplete="off" /></div>
            <div className="campo"><label htmlFor="ent-email">Email</label><input id="ent-email" type="email" className="control" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="off" /></div>
            <span className="etq" style={{ fontSize: 13, fontWeight: 600 }}>Equipos que puede editar</span>
            <SelectorEquipos prefijo="inv" seleccion={f.equipos} onCambio={(eq) => setF({ ...f, equipos: eq })} />
            <span className="ayuda">El nombre del entrenador no se muestra en la app pública; solo se usa para darle acceso al panel.</span>
            {NUBE_ACTIVA ? <span className="ayuda">La persona abre la app, toca "Crear cuenta" con este mismo email y confirma el mail que le llega. Desde ahí accede a sus equipos.</span> : null}
            <button type="submit" className="btn btn-primario">Enviar invitación</button>
          </form>

          <section className="seccion">
            <h2 className="rotulo">Con acceso</h2>
            {entrenadores.length === 0 ? <div className="tarjeta vacio">Todavía no hay entrenadores.</div> : (
              <div className="lista">
                {entrenadores.map((u) => (
                  <div key={u.id} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
                        <span className="mini suave" style={{ overflowWrap: 'anywhere' }}>{u.email}{u.pendiente ? ' · Invitación pendiente' : ''}</span>
                      </span>
                      <button type="button" className="link-btn" onClick={() => setEditando(editando === u.id ? null : u.id)}>{editando === u.id ? 'Listo' : 'Editar'}</button>
                    </div>
                    {editando === u.id ? (
                      <>
                        <SelectorEquipos prefijo={`ed-${u.id}`} seleccion={u.equipos} onCambio={(eq) => ejecutar('entrenador/equipos', { usuarioId: u.id, equipos: eq })} />
                        {quitando === u.id ? (
                          <div className="grilla-2">
                            <button type="button" className="btn btn-secundario" onClick={() => setQuitando(null)}>Cancelar</button>
                            <button type="button" className="btn btn-peligro" onClick={() => { ejecutar('entrenador/quitar', { usuarioId: u.id }); mostrarToast('Acceso quitado.'); setEditando(null); setQuitando(null) }}>Sí, quitar</button>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-peligro" onClick={() => setQuitando(u.id)}>Quitar acceso</button>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {u.equipos.length ? u.equipos.map((id) => <span key={id} className="insignia insignia-ok">{nombreEquipo(equipoPorId[id], categoriaPorId, true)}</span>) : <span className="insignia insignia-neutra">Sin equipos asignados</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}

export function PanelRosarina() {
  const { estado, ejecutar, mostrarToast, equipoPorId, categoriaPorId } = useApp()
  return (
    <>
      <EncabezadoPanel titulo="Datos de la Rosarina" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <p className="chico suave" style={{ margin: 0 }}>
            En la versión real, un proceso lee la web de la Asociación Rosarina y deja acá lo que encuentra. Nada se publica hasta que lo aprobás.
          </p>
          {estado.sugerencias.length === 0 ? <div className="tarjeta vacio">No hay datos nuevos para revisar.</div> : estado.sugerencias.map((s) => {
            const p = estado.partidos.find((x) => x.id === s.partidoId)
            if (!p) return null
            const local = p.condicion === 'local'
            return (
              <section key={s.id} className="tarjeta seccion" style={{ padding: 14 }}>
                <span className="rotulo-verde">{nombreEquipo(equipoPorId[p.equipoId], categoriaPorId)} · {fechaCorta(p.fecha)}</span>
                <span style={{ fontWeight: 600 }}>{local ? `Sirio vs ${p.rival}` : `${p.rival} vs Sirio`}</span>
                {s.tipo === 'resultado' ? (
                  <span className="num">Resultado informado: <strong>{local ? `Sirio ${s.golesSirio} – ${s.golesRival} ${p.rival}` : `${p.rival} ${s.golesRival} – ${s.golesSirio} Sirio`}</strong></span>
                ) : (
                  <span className="num">Cambio de horario: <strong>{p.hora} → {s.hora}</strong></span>
                )}
                <span className="mini suave">Fuente: {s.fuente}</span>
                <div className="grilla-2">
                  <button type="button" className="btn btn-secundario" onClick={() => { ejecutar('sugerencia/descartar', { sugerenciaId: s.id }); mostrarToast('Descartado.') }}>Descartar</button>
                  <button type="button" className="btn btn-primario" onClick={() => { ejecutar('sugerencia/aprobar', { sugerenciaId: s.id }); mostrarToast('Aprobado y publicado en el fixture.') }}>Aprobar</button>
                </div>
              </section>
            )
          })}
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}

export function PanelInscriptos() {
  const { estado } = useApp()
  return (
    <>
      <EncabezadoPanel titulo="Inscripciones" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <p className="chico suave" style={{ margin: 0 }}>Solo la administradora ve esta lista. Nunca se publica en la app.</p>
          {estado.inscripciones.length === 0 ? <div className="tarjeta vacio">No hay inscripciones.</div> : (
            <div className="lista">
              {estado.inscripciones.map((i) => (
                <div key={i.id} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>{i.jugador}</span>
                  <span className="chico">{i.categoria} · {i.fecha ? fechaLarga(i.fecha) : ''}</span>
                  <span className="mini suave">{i.adulto} · {i.telefono}</span>
                  {i.mensaje ? <span className="mini">{i.mensaje}</span> : null}
                </div>
              ))}
            </div>
          )}
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}

export function PanelAviso() {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, categorias, equipoPorId, categoriaPorId } = useApp()
  const admin = esAdmin(usuario)
  const mios = equiposEditables(usuario, estado.equipos)
  const destinos = [
    ...(admin ? [{ valor: 'todos', texto: 'Todo el club' }, ...categorias.map((c) => ({ valor: `cat:${c.id}`, texto: `Categoría ${c.nombre}` }))] : []),
    ...mios.map((e) => ({ valor: `eq:${e.id}`, texto: nombreEquipo(e, categoriaPorId) })),
  ]
  const [f, setF] = useState({ tipo: 'anuncio', destino: destinos[0]?.valor || '', titulo: '', mensaje: '' })

  const enviar = () => {
    if (!f.titulo.trim() || !f.mensaje.trim()) {
      mostrarToast('Completá título y mensaje.', 'error')
      return
    }
    const equipoId = f.destino.startsWith('eq:') ? f.destino.slice(3) : null
    const categoriaId = f.destino.startsWith('cat:') ? f.destino.slice(4) : null
    const ok = ejecutar('aviso/enviar', { aviso: { tipo: f.tipo, equipoId, categoriaId, titulo: f.titulo.trim(), mensaje: f.mensaje.trim(), fecha: hoyISO } })
    if (ok) {
      mostrarToast('Aviso registrado. En la versión real llega a los celulares suscriptos.')
      setF({ ...f, titulo: '', mensaje: '' })
    }
  }

  const destinoTexto = (a) => (a.equipoId ? nombreEquipo(equipoPorId[a.equipoId], categoriaPorId) : a.categoriaId ? categoriaPorId[a.categoriaId].nombre : 'Todo el club')

  return (
    <>
      <EncabezadoPanel titulo="Enviar aviso" volverA="panel-mas" />
      <main className="contenido g">
        <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
          <legend style={{ fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 8 }}>Tipo de aviso</legend>
          <div className="radio-grupo">
            {[['anuncio', 'Anuncio'], ['horario', 'Cambio de horario'], ['proximo', 'Recordatorio']].map(([v, t]) => (
              <label key={v} className="radio-op"><input type="radio" name="tipo-aviso" checked={f.tipo === v} onChange={() => setF({ ...f, tipo: v })} />{t}</label>
            ))}
          </div>
        </fieldset>
        <div className="campo">
          <label htmlFor="av-destino">Para quiénes</label>
          <select id="av-destino" className="control" value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })}>
            {destinos.map((d) => <option key={d.valor} value={d.valor}>{d.texto}</option>)}
          </select>
        </div>
        <div className="campo"><label htmlFor="av-titulo">Título</label><input id="av-titulo" className="control" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></div>
        <div className="campo">
          <label htmlFor="av-msj">Mensaje</label>
          <textarea id="av-msj" className="control" value={f.mensaje} onChange={(e) => setF({ ...f, mensaje: e.target.value })} />
          <span className="ayuda num" style={{ alignSelf: 'flex-end' }}>{f.mensaje.length} caracteres · conviene menos de 120</span>
        </div>
        <section className="seccion">
          <h2 className="rotulo">Así se va a ver</h2>
          <div className="vista-notif">
            <div className="notif">
              <img src={ESCUDO} alt="" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>SIRIO FUTSAL</span>
                <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{f.titulo || 'Título del aviso'}</span>
                <span className="chico suave" style={{ overflowWrap: 'anywhere' }}>{f.mensaje || 'Texto breve del aviso.'}</span>
              </div>
            </div>
          </div>
        </section>
        <button type="button" className="btn btn-primario" onClick={enviar}>Enviar aviso</button>

        {estado.avisosEnviados.length ? (
          <section className="seccion">
            <h2 className="rotulo">Enviados</h2>
            <div className="lista">
              {estado.avisosEnviados.slice(0, 8).map((a) => (
                <div key={a.id} className="fila">
                  <span className="crece">
                    <span style={{ fontWeight: 600 }}>{a.titulo}</span>
                    <span className="mini suave">{a.mensaje}</span>
                    <span className="mini suave">{destinoTexto(a)} · {fechaCorta(a.fecha)}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <NavPanel actual="panel-mas" />
    </>
  )
}
