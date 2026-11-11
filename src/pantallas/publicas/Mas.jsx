import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, NavPublica, Icono } from '../../componentes/comunes.jsx'

export default function Mas() {
  const { ir, ejecutar, mostrarToast, hoyISO } = useApp()
  const [form, setForm] = useState({ jugador: '', categoria: 'Inferiores', adulto: '', telefono: '', mensaje: '' })
  const cambiar = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const enviar = (e) => {
    e.preventDefault()
    if (!form.jugador.trim() || !form.adulto.trim() || !form.telefono.trim()) {
      mostrarToast('Completá el nombre del jugador, el adulto responsable y un teléfono.', 'error')
      return
    }
    ejecutar('inscripcion/crear', { inscripcion: { ...form, fecha: hoyISO } })
    setForm({ jugador: '', categoria: 'Inferiores', adulto: '', telefono: '', mensaje: '' })
    mostrarToast('Consulta enviada. En la versión de prueba queda guardada solo en este navegador.')
  }

  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <section className="hero" style={{ background: 'var(--accion)', color: 'var(--accion-texto)' }}>
          <h2 className="h2" style={{ fontSize: 26 }}>¿Querés jugar en Sirio?</h2>
          <p style={{ margin: 0, fontSize: 14 }}>Dejanos tus datos y te contactamos con la categoría que corresponda.</p>
        </section>

        <form className="tarjeta form" style={{ padding: 14 }} onSubmit={enviar} aria-labelledby="titulo-inscripcion">
          <h2 id="titulo-inscripcion" className="h2">Inscripción</h2>
          <div className="campo">
            <label htmlFor="ins-jugador">Nombre del jugador o jugadora</label>
            <input id="ins-jugador" className="control" value={form.jugador} onChange={cambiar('jugador')} autoComplete="off" />
          </div>
          <div className="campo">
            <label htmlFor="ins-categoria">Categoría de interés</label>
            <select id="ins-categoria" className="control" value={form.categoria} onChange={cambiar('categoria')}>
              <option>Escuelita</option><option>Inferiores</option><option>Masculino Primera o Reserva</option><option>Femenino</option><option>Veteranos</option><option>No sé</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="ins-adulto">Nombre del adulto responsable</label>
            <input id="ins-adulto" className="control" value={form.adulto} onChange={cambiar('adulto')} autoComplete="off" />
          </div>
          <div className="campo">
            <label htmlFor="ins-tel">Teléfono o WhatsApp</label>
            <input id="ins-tel" className="control" type="tel" value={form.telefono} onChange={cambiar('telefono')} autoComplete="off" />
          </div>
          <div className="campo">
            <label htmlFor="ins-msj">Mensaje (opcional)</label>
            <textarea id="ins-msj" className="control" value={form.mensaje} onChange={cambiar('mensaje')} />
          </div>
          <span className="ayuda">Estos datos los ve solo la administradora del club. No pedimos DNI ni fecha de nacimiento.</span>
          <button type="submit" className="btn btn-primario">Enviar consulta</button>
        </form>

        <div className="lista">
          <button type="button" className="fila fila-btn" onClick={() => ir('avisos')}>
            {Icono.campana({ width: 22, height: 22, style: { color: 'var(--verde-texto)' } })}
            <span className="crece" style={{ fontWeight: 600 }}>Avisos e instalar la app</span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        </div>

        <button type="button" className="link-btn" style={{ alignSelf: 'center', color: 'var(--texto-suave)' }} onClick={() => ir('panel')}>
          Ingresar al panel del club
        </button>
      </main>
      <NavPublica actual="mas" />
    </>
  )
}
