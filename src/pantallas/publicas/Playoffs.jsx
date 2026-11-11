import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, NavPublica, Chips, Segmento, Chapa, fechaLarga } from '../../componentes/comunes.jsx'
import { NOMBRE_HOJA, ordenCat } from '../../datos/planilla.js'

const porHora = (a, b) => (a.hora || '99:99').localeCompare(b.hora || '99:99') || a.orden - b.orden

function Fila({ f }) {
  const { ir } = useApp()
  const sirio = !!f.equipoId
  const contenido = (
    <>
      <div className="partido-cabeza">
        <span className="rotulo-verde">{f.torneo}{f.div ? ` · ${f.div}` : ''}</span>
        {f.hora ? <span className="hora num">{f.hora}</span> : <span className="chico suave" style={{ fontWeight: 600 }}>Hora a confirmar</span>}
      </div>
      <span className="rivales num rivales-chapas"><Chapa nombre={f.local} />{f.local} vs {f.visitante}<Chapa nombre={f.visitante} /></span>
      <span className="chico suave">{f.cancha ? `Cancha: ${f.cancha}` : 'Cancha a confirmar'}{f.instancia ? ` · ${f.instancia}` : ''}</span>
      {sirio ? <span className="insignia">Argentino Sirio</span> : null}
    </>
  )
  return sirio ? (
    <button type="button" className="partido" style={{ borderLeft: '6px solid var(--dorado)' }} onClick={() => ir(`partido-po-${f.id}`)}>{contenido}</button>
  ) : (
    <div className="partido" style={{ cursor: 'default' }}>{contenido}</div>
  )
}

export default function Playoffs() {
  const { estado, hoyISO } = useApp()
  const todas = estado.programacion || []
  const hojas = ordenCat.filter((h) => todas.some((f) => f.hoja === h))
  const [hoja, setHoja] = useState('todas')
  const [soloSirio, setSoloSirio] = useState('todos')
  const [anteriores, setAnteriores] = useState(false)

  const filtradas = todas.filter((f) => (hoja === 'todas' || f.hoja === hoja) && (soloSirio === 'todos' || f.equipoId || f.tipo === 'nota'))
  const partidos = filtradas.filter((f) => f.tipo === 'partido')
  const notas = filtradas.filter((f) => f.tipo === 'nota')
  const fechas = [...new Set(partidos.map((f) => f.fecha || ''))].sort()
  const hayAnteriores = fechas.some((d) => d && d < hoyISO)
  const visibles = fechas.filter((d) => anteriores || !d || d >= hoyISO)

  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <div className="seccion">
          <h1 className="h1">Playoffs</h1>
          <p className="chico suave" style={{ margin: 0 }}>Programación de la Asociación Rosarina de Fútbol de Salón. Los partidos de Argentino Sirio están marcados en dorado.</p>
          <Chips etiqueta="Categoría" valor={hoja} onCambio={setHoja}
            opciones={[{ valor: 'todas', texto: 'Todas' }, ...hojas.map((h) => ({ valor: h, texto: NOMBRE_HOJA[h] }))]} />
          <Segmento etiqueta="Mostrar" valor={soloSirio} onCambio={setSoloSirio}
            opciones={[{ valor: 'todos', texto: 'Todos los partidos' }, { valor: 'sirio', texto: 'Solo Sirio' }]} />
        </div>

        {todas.length === 0 ? <div className="tarjeta vacio">Todavía no se cargó la programación de playoffs.</div> : null}
        {todas.length > 0 && visibles.length === 0 && !hayAnteriores ? <div className="tarjeta vacio">No hay partidos para este filtro.</div> : null}

        {hayAnteriores ? (
          <button type="button" className="btn btn-secundario" onClick={() => setAnteriores(!anteriores)}>
            {anteriores ? 'Ocultar fechas anteriores' : 'Ver fechas anteriores'}
          </button>
        ) : null}

        {visibles.map((d) => (
          <section key={d || 'sin'} className="seccion" style={d && d < hoyISO ? { opacity: 0.7 } : undefined}>
            <h2 className="rotulo">{d ? fechaLarga(d) : 'Fecha a confirmar'}</h2>
            {partidos.filter((f) => (f.fecha || '') === d).sort(porHora).map((f) => <Fila key={f.id} f={f} />)}
          </section>
        ))}

        {notas.map((n) => (
          <div key={n.id} className="tarjeta" style={{ padding: 14 }}>
            <span className="rotulo-verde">{n.torneo}{n.instancia ? ` · ${n.instancia}` : ''}</span>
            <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{n.nota}</p>
          </div>
        ))}
      </main>
      <NavPublica actual="fixture" />
    </>
  )
}
