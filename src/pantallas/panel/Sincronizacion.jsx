import { useEffect, useState } from 'react'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { NUBE_ACTIVA, sb } from '../../datos/nube.js'

const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca')

export function PanelSincronizacion() {
  const [est, setEst] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!NUBE_ACTIVA) return
    sb().from('arf_estado').select('*').eq('id', 1).single().then(({ data, error: e }) => (e ? setError(e.message) : setEst(data)))
  }, [])
  const fallo = (t) => /^Error/i.test(t || '')
  return (
    <>
      <EncabezadoPanel titulo="Lectura automática" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <p className="chico suave" style={{ margin: 0 }}>
            Cada 2 horas la app lee la web de la Rosarina y actualiza posiciones, partidos y resultados. Cada 6 horas revisa si hay un boletín nuevo.
          </p>
          {!NUBE_ACTIVA ? <div className="tarjeta vacio">Solo disponible con la base real.</div> : null}
          {error ? <div className="tarjeta vacio">No pude leer el estado: {error}</div> : null}
          {est ? (
            <div className="lista">
              <div className="fila"><span className="crece"><span style={{ fontWeight: 600 }}>Posiciones y partidos</span>
                <span className="mini suave">Última lectura: {cuando(est.ultima_sync)}</span>
                <span className="mini" style={{ color: fallo(est.resumen) ? 'var(--alerta)' : undefined }}>{est.resumen || 'Sin datos todavía'}</span></span></div>
              <div className="fila"><span className="crece"><span style={{ fontWeight: 600 }}>Boletín del Tribunal</span>
                <span className="mini" style={{ color: fallo(est.boletin_resumen) ? 'var(--alerta)' : undefined }}>{est.boletin_resumen || 'Sin datos todavía'}</span></span></div>
            </div>
          ) : null}
          {est && (fallo(est.resumen) || (est.ultima_sync && Date.now() - new Date(est.ultima_sync).getTime() > 6 * 3600 * 1000)) ? (
            <div className="tarjeta" style={{ padding: 12 }}>
              <span className="chico" style={{ fontWeight: 600, color: 'var(--alerta)' }}>Atención: la lectura automática no está funcionando bien.</span>
              <span className="ayuda">Avisale a quien administra la app para que lo revise.</span>
            </div>
          ) : null}
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}
