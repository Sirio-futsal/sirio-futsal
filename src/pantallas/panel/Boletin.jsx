import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { parsearJugadoresBoletin } from '../../datos/reglas.js'
import { NUBE_ACTIVA, sb } from '../../datos/nube.js'

export function PanelBoletin() {
  const { estado, ejecutar, mostrarToast, hoyISO } = useApp()
  const b = estado.boletin || { numero: '', fecha: hoyISO, jugadores: [] }
  const [numero, setNumero] = useState(String(b.numero || ''))
  const [fecha, setFecha] = useState(b.fecha || hoyISO)
  const [texto, setTexto] = useState(b.jugadores.join('\n'))
  const [leyendo, setLeyendo] = useState(false)
  const [lectura, setLectura] = useState(null)

  // Sube el PDF completo del boletín y la app busca lo que corresponde a Argentino Sirio.
  const leerPdf = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (archivo.type !== 'application/pdf') { mostrarToast('Elegí el archivo PDF del boletín.', 'error'); return }
    setLeyendo(true)
    setLectura(null)
    try {
      const ruta = `boletin-${Date.now()}.pdf`
      const { error } = await sb().storage.from('boletines').upload(ruta, archivo, { contentType: 'application/pdf' })
      if (error) throw error
      const { data, error: e2 } = await sb().functions.invoke('leer-boletin', { body: { path: ruta } })
      if (e2) throw e2
      if (!data?.ok) throw new Error(data?.error || 'No pude leer el PDF')
      setLectura(data)
      if (data.numero) setNumero(String(data.numero))
      if (data.fecha) setFecha(data.fecha)
      setTexto((data.nombres || []).join('\n'))
    } catch (err) {
      mostrarToast(`No pude leer el boletín: ${err?.message || 'error'}`, 'error')
    } finally {
      setLeyendo(false)
    }
  }

  const guardar = () => {
    const n = parseInt(numero, 10)
    if (!n) {
      mostrarToast('Completá el número de boletín.', 'error')
      return
    }
    const jugadores = parsearJugadoresBoletin(texto)
    if (ejecutar('boletin/guardar', { boletin: { numero: n, fecha, jugadores } })) {
      mostrarToast(jugadores.length ? 'Boletín publicado en el Inicio.' : 'Boletín vacío: la sección se oculta.')
    }
  }

  return (
    <>
      <EncabezadoPanel titulo="Jugadores en boletín" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          {NUBE_ACTIVA ? (
            <section className="seccion">
              <span className="chico" style={{ fontWeight: 600 }}>Subir el boletín completo (PDF)</span>
              <span className="ayuda">Subí el PDF que mandan a los delegados. La app lee las hojas de futsal y busca a Argentino Sirio. Tarda un minuto.</span>
              <input type="file" accept="application/pdf" onChange={leerPdf} disabled={leyendo} />
              {leyendo ? <span className="chico">Leyendo el boletín…</span> : null}
              {lectura ? (
                <div className="g">
                  <span className="chico" style={{ fontWeight: 600 }}>
                    Boletín {lectura.numero || '?'}: leí {lectura.paginasLeidas} hojas y {lectura.expedientes} expedientes.{' '}
                    {lectura.sirio.length ? `${lectura.sirio.length} mencionan a Argentino Sirio.` : 'Ninguno menciona a Argentino Sirio.'}
                  </span>
                  {lectura.sirio.map((x, i) => (
                    <div key={i} className="tarjeta" style={{ padding: 10 }}>
                      <span className="chico" style={{ fontWeight: 600 }}>{x.titulo}</span>
                      <p className="chico suave" style={{ margin: '4px 0 0' }}>{x.texto}</p>
                    </div>
                  ))}
                  <span className="ayuda">Revisá los nombres de abajo (los armé desde el texto), corregí lo que haga falta y publicá.</span>
                </div>
              ) : null}
            </section>
          ) : null}
          <p className="chico suave" style={{ margin: 0 }}>
            Cada semana, buscá a los jugadores del Sirio en el boletín del Tribunal y pegá sus nombres acá, uno por línea. Reemplaza la lista anterior. No cargues DNI.
          </p>
          <div className="campo"><label htmlFor="bo-num">Número de boletín</label><input id="bo-num" className="control" inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value)} /></div>
          <div className="campo"><label htmlFor="bo-fecha">Fecha del boletín</label><input id="bo-fecha" type="date" className="control" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
          <div className="campo">
            <label htmlFor="bo-jug">Jugadores (Nombre Apellido, uno por línea)</label>
            <textarea id="bo-jug" className="control" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primario" onClick={guardar}>Publicar boletín</button>
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}
