import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel } from './Comun.jsx'
import { NUBE_ACTIVA, iniciarSesion, crearCuenta } from '../../datos/nube.js'

function IngresoReal() {
  const { estado, usuario, ejecutar, ir, mostrarToast } = useApp()
  const [f, setF] = useState({ email: '', clave: '' })
  const [ocupado, setOcupado] = useState(false)
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const entrar = async (e) => {
    e.preventDefault()
    if (!f.email.trim() || !f.clave) {
      mostrarToast('Completá el email y la contraseña.', 'error')
      return
    }
    setOcupado(true)
    try {
      await iniciarSesion(f.email, f.clave)
      mostrarToast('Entraste al panel.')
      ir('panel')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
    setOcupado(false)
  }

  const crear = async () => {
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim()) || f.clave.length < 8) {
      mostrarToast('Escribí un email válido y una contraseña de al menos 8 caracteres.', 'error')
      return
    }
    setOcupado(true)
    try {
      const { requiereConfirmar } = await crearCuenta(f.email, f.clave)
      mostrarToast(requiereConfirmar ? 'Cuenta creada. Confirmá el mail que te llegó y después ingresá.' : 'Cuenta creada.')
    } catch (err) {
      mostrarToast(err.message, 'error')
    }
    setOcupado(false)
  }

  // Entró con una cuenta que la administradora todavía no invitó.
  if (estado.sesion && !usuario) {
    return (
      <>
        <EncabezadoPanel />
        <main className="contenido sin-nav g">
          <h1 className="h1">Todavía sin permisos</h1>
          <p className="suave" style={{ margin: 0 }}>
            Esta cuenta existe, pero la administradora todavía no te dio acceso. Pedile que te invite con este mismo email.
          </p>
          <button type="button" className="btn btn-secundario btn-bloque" onClick={() => ejecutar('salir')}>Salir</button>
          <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => ir('inicio')}>Volver a la app</button>
        </main>
      </>
    )
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido sin-nav g">
        <h1 className="h1">Ingresar al panel</h1>
        <form className="form" onSubmit={entrar}>
          <div className="campo"><label htmlFor="ing-email">Email</label><input id="ing-email" type="email" className="control" autoComplete="username" value={f.email} onChange={cambiar('email')} /></div>
          <div className="campo"><label htmlFor="ing-clave">Contraseña</label><input id="ing-clave" type="password" className="control" autoComplete="current-password" value={f.clave} onChange={cambiar('clave')} /></div>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={ocupado}>Ingresar</button>
        </form>
        <div className="seccion">
          <button type="button" className="btn btn-secundario btn-bloque" disabled={ocupado} onClick={crear}>Crear cuenta</button>
          <span className="ayuda">Para entrenadores a quienes la administradora ya invitó: creá tu cuenta con el mismo email de la invitación.</span>
        </div>
        <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => ir('inicio')}>Volver a la app</button>
      </main>
    </>
  )
}

function IngresoPrueba() {
  const { ejecutar, ir, estado, mostrarToast } = useApp()
  const entrar = (id, texto) => {
    ejecutar('ingresar', { usuarioId: id })
    mostrarToast(`Entraste como ${texto}.`)
    ir('panel')
  }
  const e1 = estado.usuarios.find((u) => u.id === 'e1')
  return (
    <>
      <EncabezadoPanel />
      <main className="contenido sin-nav g">
        <h1 className="h1">Ingresar al panel</h1>
        <p className="suave" style={{ margin: 0 }}>
          En la versión real se entra con email y contraseña. En esta prueba elegí con qué usuario querés ver el panel.
        </p>
        <div className="seccion">
          <button type="button" className="btn btn-primario btn-bloque" onClick={() => entrar('admin', 'administradora')}>
            Entrar como administradora
          </button>
          <span className="ayuda">Ve y gestiona todo: autorizaciones, entrenadores, inscripciones y datos de la Rosarina.</span>
        </div>
        {e1 ? (
          <div className="seccion">
            <button type="button" className="btn btn-secundario btn-bloque" onClick={() => entrar('e1', 'entrenador de ejemplo')}>
              Entrar como entrenador de ejemplo
            </button>
            <span className="ayuda">Solo puede cargar datos de Masculino A Primera y Reserva. Sirve para probar que los permisos funcionan.</span>
          </div>
        ) : null}
        <button type="button" className="link-btn" style={{ alignSelf: 'center' }} onClick={() => ir('inicio')}>Volver a la app</button>
      </main>
    </>
  )
}

export default function Ingreso() {
  return NUBE_ACTIVA ? <IngresoReal /> : <IngresoPrueba />
}
