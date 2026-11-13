import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { fechaCorta } from '../../componentes/comunes.jsx'
import { leerPlanilla } from '../../datos/planilla.js'
import { completarPartidos } from '../../datos/reglas.js'

function FilaFalta({ f }) {
  const { ejecutar, mostrarToast } = useApp()
  const [fecha, setFecha] = useState(f.fecha || '')
  const [hora, setHora] = useState(f.hora || '')
  const [cancha, setCancha] = useState(f.cancha || '')
  const guardar = () => {
    const h = hora.trim().replace('.', ':')
    if (h && !/^\d{1,2}:\d{2}$/.test(h)) { mostrarToast('La hora va así: 21:00', 'error'); return }
    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { mostrarToast('Elegí la fecha del calendario.', 'error'); return }
    const hh = h ? h.padStart(5, '0') : null
    if (ejecutar('programacion/editar', { fila: { ...f, fecha: fecha || null, hora: hh, cancha: cancha.trim() || null } })) mostrarToast('Guardado. Ya se ve en la app.')
  }
  return (
    <div className="tarjeta g" style={{ padding: 12 }}>
      <span className="chico" style={{ fontWeight: 600 }}>{f.torneo}{f.div ? ` · ${f.div}` : ''} · {f.fecha ? fechaCorta(f.fecha) : 'sin fecha'}{f.hora ? ` · ${f.hora}` : ''}</span>
      <span className="chico">{f.local} vs {f.visitante}</span>
      {f.nota === 'manual' ? <span className="chico suave">Corregido por el club: la planilla de la Asociación no lo pisa.</span> : null}
      <div className="campo"><label>Fecha</label><input className="control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
      <div className="grilla-2">
        <div className="campo"><label>Hora</label><input className="control" inputMode="numeric" placeholder="21:00" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
        <div className="campo"><label>Cancha</label><input className="control" value={cancha} onChange={(e) => setCancha(e.target.value)} /></div>
      </div>
      <button type="button" className="btn btn-secundario" onClick={guardar}>Guardar</button>
    </div>
  )
}

export function PanelPlayoffs() {
  const { estado, ejecutar, mostrarToast } = useApp()
  const [leyendo, setLeyendo] = useState(false)
  const [lectura, setLectura] = useState(null)
  const actuales = (estado.programacion || []).filter((f) => f.tipo === 'partido')
  const deSirio = actuales.filter((f) => f.equipoId)
  const otros = actuales.filter((f) => !f.equipoId)
  const faltan = otros.filter((f) => !f.hora || !f.cancha || !f.fecha)

  const leer = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!/\.xlsx$/i.test(archivo.name)) { mostrarToast('Elegí el archivo Excel (.xlsx) que mandó la Asociación.', 'error'); return }
    setLeyendo(true)
    setLectura(null)
    try {
      const r = await leerPlanilla(await archivo.arrayBuffer())
      if (!r.filas.length) throw new Error('No encontré partidos en el archivo.')
      setLectura(r)
    } catch (err) {
      mostrarToast(`No pude leer el archivo: ${err?.message || 'error'}`, 'error')
    } finally {
      setLeyendo(false)
    }
  }

  const publicar = () => {
    if (!lectura) return
    if (ejecutar('programacion/reemplazar', { filas: lectura.filas })) {
      mostrarToast('Playoffs publicados.')
      setLectura(null)
    }
  }

  const partidos = lectura ? lectura.filas.filter((f) => f.tipo === 'partido') : []
  const sirio = partidos.filter((f) => f.equipoId)
  const sinDatos = partidos.filter((f) => !f.hora || !f.cancha || !f.fecha)
  const fechasNuevas = partidos.map((f) => f.fecha).filter(Boolean).sort()
  const reales = estado.partidos.filter((p) => !p.derivado)
  const completados = lectura
    ? completarPartidos(reales, lectura.filas).filter((p, i) => p !== reales[i] && (p.hora !== reales[i].hora || p.cancha !== reales[i].cancha)).length
    : 0

  return (
    <>
      <EncabezadoPanel titulo="Playoffs" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <section className="seccion">
            <span className="chico" style={{ fontWeight: 600 }}>Subir la planilla de la Asociación (Excel)</span>
            <span className="ayuda">Subí cada semana (los domingos) el .xlsx tal como lo manda la Asociación. La app lee todas las hojas y lo combina con lo que ya baja solo de la Rosarina: completa el horario y la cancha que falten, sin pisar lo que ya está. Reemplaza las fechas que cubre el archivo y conserva las semanas anteriores.</span>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={leer} disabled={leyendo} />
            {leyendo ? <span className="chico">Leyendo el archivo…</span> : null}
          </section>

          {lectura ? (
            <section className="seccion g">
              <span className="chico" style={{ fontWeight: 600 }}>
                Leí {partidos.length} partidos. {sirio.length} son de Argentino Sirio. {sinDatos.length ? `${sinDatos.length} no tienen hora o cancha todavía.` : 'Todos tienen hora y cancha.'}
              </span>
              {fechasNuevas.length ? <span className="chico suave">Fechas del archivo: del {fechaCorta(fechasNuevas[0])} al {fechaCorta(fechasNuevas[fechasNuevas.length - 1])}.</span> : null}
              <span className="chico suave">{completados ? `Completa horario o cancha de ${completados} partidos que ya trae la Rosarina.` : 'No hay partidos de la Rosarina para completar con este archivo.'}</span>
              {lectura.avisos.map((a, i) => <span key={i} className="chico suave">{a}</span>)}
              {sirio.map((f) => (
                <div key={f.orden} className="tarjeta" style={{ padding: 10 }}>
                  <span className="chico" style={{ fontWeight: 600 }}>{f.torneo}{f.div ? ` · ${f.div}` : ''} · {f.fecha ? fechaCorta(f.fecha) : 'sin fecha'} · {f.hora || 'hora a confirmar'}</span>
                  <p className="chico suave" style={{ margin: '4px 0 0' }}>{f.local} vs {f.visitante} · {f.cancha || 'cancha a confirmar'}</p>
                </div>
              ))}
              <span className="ayuda">Revisá los partidos de Sirio. Si está bien, publicá.</span>
              <button type="button" className="btn btn-primario" onClick={publicar}>Publicar playoffs</button>
            </section>
          ) : null}

          <section className="seccion g">
            <h2 className="h2" style={{ fontSize: 20 }}>Partidos de Argentino Sirio</h2>
            {deSirio.length === 0 ? (
              <p className="chico suave" style={{ margin: 0 }}>Todavía no hay partidos de Sirio en la planilla.</p>
            ) : (
              <>
                <p className="chico suave" style={{ margin: 0 }}>Si hay un error o un cambio de fecha, hora o cancha, corregilo acá y tocá Guardar. Se publica en el momento y la próxima planilla de la Asociación no lo pisa.</p>
                {deSirio.map((f) => <FilaFalta key={`${f.id}-${f.fecha}-${f.hora}-${f.cancha}`} f={f} />)}
              </>
            )}
          </section>

          <section className="seccion g">
            <h2 className="h2" style={{ fontSize: 20 }}>Otros partidos: datos que faltan</h2>
            {faltan.length === 0 ? (
              <p className="chico suave" style={{ margin: 0 }}>{actuales.length ? 'Todos los partidos tienen fecha, hora y cancha.' : 'Todavía no hay playoffs cargados.'}</p>
            ) : (
              <>
                <p className="chico suave" style={{ margin: 0 }}>Completá la hora y la cancha cuando la Asociación las confirme. Se publica en el momento.</p>
                {faltan.map((f) => <FilaFalta key={`${f.id}-${f.hora}-${f.cancha}`} f={f} />)}
              </>
            )}
          </section>

          {otros.length ? (
            <details className="seccion g">
              <summary className="chico" style={{ fontWeight: 600 }}>Corregir cualquier otro partido ({otros.length})</summary>
              {otros.map((f) => <FilaFalta key={`${f.id}-${f.fecha}-${f.hora}-${f.cancha}-t`} f={f} />)}
            </details>
          ) : null}
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}
