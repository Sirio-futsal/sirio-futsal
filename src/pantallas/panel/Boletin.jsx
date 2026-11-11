import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { parsearJugadoresBoletin } from '../../datos/reglas.js'

export function PanelBoletin() {
  const { estado, ejecutar, mostrarToast, hoyISO } = useApp()
  const b = estado.boletin || { numero: '', fecha: hoyISO, jugadores: [] }
  const [numero, setNumero] = useState(String(b.numero || ''))
  const [fecha, setFecha] = useState(b.fecha || hoyISO)
  const [texto, setTexto] = useState(b.jugadores.join('\n'))

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
