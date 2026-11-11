import { useEffect, useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { Segmento, nombreEquipo, fechaCorta, ordenarPartidos } from '../../componentes/comunes.jsx'
import { equiposEditables, partidoSinResultado } from '../../datos/reglas.js'

function CargarResultado() {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, equipoPorId, categoriaPorId } = useApp()
  const mios = equiposEditables(usuario, estado.equipos).map((e) => e.id)
  const candidatos = ordenarPartidos(estado.partidos.filter((p) => mios.includes(p.equipoId)))
  const pendientes = candidatos.filter((p) => partidoSinResultado(p, hoyISO))
  const resto = candidatos.filter((p) => !partidoSinResultado(p, hoyISO))
  const ordenados = [...pendientes, ...resto]

  const [id, setId] = useState(ordenados[0]?.id)
  const p = estado.partidos.find((x) => x.id === id)
  const [f, setF] = useState(null)
  useEffect(() => {
    if (p) setF({ gs: p.golesSirio ?? 0, gr: p.golesRival ?? 0, estado: p.estado === 'programado' ? 'jugado' : p.estado, hora: p.hora || '', cancha: p.cancha || '', avisar: true })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ordenados.length) return <div className="tarjeta vacio">No tenés partidos asignados.</div>
  if (!p || !f) return null
  const equipo = equipoPorId[p.equipoId]
  const nombre = nombreEquipo(equipo, categoriaPorId)

  const guardar = () => {
    const horaCambio = f.hora && p.hora && f.hora !== p.hora
    const actualizado = {
      ...p,
      estado: f.estado,
      golesSirio: f.estado === 'jugado' ? f.gs : null,
      golesRival: f.estado === 'jugado' ? f.gr : null,
      hora: f.hora || null,
      horaAnterior: horaCambio ? p.hora : p.horaAnterior,
      cancha: f.cancha || null,
      origen: 'club',
    }
    if (!ejecutar('partido/guardar', { partido: actualizado })) return
    if (f.avisar) {
      const local = p.condicion === 'local'
      const mensaje = f.estado === 'jugado'
        ? local ? `Sirio ${f.gs} – ${f.gr} ${p.rival}` : `${p.rival} ${f.gr} – ${f.gs} Sirio`
        : horaCambio ? `Nuevo horario: ${f.hora} (antes ${p.hora})` : `Partido ${f.estado}`
      ejecutar('aviso/enviar', { aviso: { tipo: f.estado === 'jugado' ? 'resultado' : 'horario', equipoId: p.equipoId, titulo: nombre, mensaje, fecha: hoyISO } })
      mostrarToast(`Guardado y publicado. Aviso preparado para quienes siguen ${nombre}.`)
    } else {
      mostrarToast('Guardado y publicado.')
    }
  }

  const Contador = ({ etiqueta, valor, onCambio }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span className="nombre-duelo" style={{ fontSize: 18 }}>{etiqueta}</span>
      <div className="contador">
        <button type="button" aria-label={`Restar un gol a ${etiqueta}`} onClick={() => onCambio(Math.max(0, valor - 1))}>−</button>
        <output className="num" aria-live="polite">{valor}</output>
        <button type="button" className="mas" aria-label={`Sumar un gol a ${etiqueta}`} onClick={() => onCambio(valor + 1)}>+</button>
      </div>
    </div>
  )

  return (
    <div className="form">
      <div className="campo">
        <label htmlFor="sel-partido">Partido</label>
        <select id="sel-partido" className="control" value={id} onChange={(e) => setId(e.target.value)}>
          {pendientes.length ? <optgroup label="Sin resultado">{pendientes.map((x) => <option key={x.id} value={x.id}>{nombreEquipo(equipoPorId[x.equipoId], categoriaPorId, true)} · vs {x.rival} · {fechaCorta(x.fecha)}</option>)}</optgroup> : null}
          <optgroup label="Todos mis partidos">{resto.map((x) => <option key={x.id} value={x.id}>{nombreEquipo(equipoPorId[x.equipoId], categoriaPorId, true)} · vs {x.rival} · {fechaCorta(x.fecha)}</option>)}</optgroup>
        </select>
        <span className="ayuda">Solo aparecen los equipos que tenés asignados.</span>
      </div>

      <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend className="etq" style={{ fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 8 }}>Estado</legend>
        <div className="radio-grupo">
          {[['jugado', 'Jugado'], ['suspendido', 'Suspendido'], ['postergado', 'Postergado']].map(([v, t]) => (
            <label key={v} className="radio-op">
              <input type="radio" name="estado" checked={f.estado === v} onChange={() => setF({ ...f, estado: v })} />{t}
            </label>
          ))}
        </div>
      </fieldset>

      {f.estado === 'jugado' ? (
        <section className="tarjeta" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <Contador etiqueta="Sirio" valor={f.gs} onCambio={(v) => setF({ ...f, gs: v })} />
          <Contador etiqueta={p.rival} valor={f.gr} onCambio={(v) => setF({ ...f, gr: v })} />
        </section>
      ) : null}

      <div className="grilla-2">
        <div className="campo">
          <label htmlFor="p-hora">Hora</label>
          <input id="p-hora" type="time" className="control" value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="p-cancha">Cancha</label>
          <input id="p-cancha" className="control" value={f.cancha} onChange={(e) => setF({ ...f, cancha: e.target.value })} />
        </div>
      </div>

      <label className="check tarjeta" style={{ padding: '10px 14px', alignItems: 'flex-start' }} htmlFor="p-avisar">
        <input id="p-avisar" type="checkbox" checked={f.avisar} onChange={(e) => setF({ ...f, avisar: e.target.checked })} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 600 }}>Avisar a quienes siguen {nombre}</span>
          <span className="mini suave">Les llega una notificación con el resultado o el cambio.</span>
        </span>
      </label>

      <button type="button" className="btn btn-primario" onClick={guardar}>Guardar y publicar</button>
    </div>
  )
}

function NuevoPartido({ alTerminar }) {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, categoriaPorId } = useApp()
  const mios = equiposEditables(usuario, estado.equipos).filter((e) => categoriaPorId[e.categoriaId].conFixture)
  const [f, setF] = useState({ equipoId: mios[0]?.id || '', fecha: hoyISO, hora: '', rival: '', condicion: 'local', cancha: '' })
  const c = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const guardar = (e) => {
    e.preventDefault()
    if (!f.rival.trim() || !f.fecha) {
      mostrarToast('Completá al menos la fecha y el rival.', 'error')
      return
    }
    const ok = ejecutar('partido/guardar', {
      partido: { id: '__nuevo__', equipoId: f.equipoId, fecha: f.fecha, hora: f.hora || null, horaAnterior: null, rival: f.rival.trim(), condicion: f.condicion, cancha: f.cancha.trim() || null, golesSirio: null, golesRival: null, estado: 'programado', origen: 'club' },
    })
    if (ok) {
      mostrarToast('Partido agregado al fixture.')
      alTerminar()
    }
  }
  return (
    <form className="form" onSubmit={guardar}>
      <div className="campo">
        <label htmlFor="n-equipo">Equipo</label>
        <select id="n-equipo" className="control" value={f.equipoId} onChange={c('equipoId')}>
          {mios.map((e) => <option key={e.id} value={e.id}>{nombreEquipo(e, categoriaPorId)}</option>)}
        </select>
      </div>
      <div className="grilla-2">
        <div className="campo"><label htmlFor="n-fecha">Fecha</label><input id="n-fecha" type="date" className="control" value={f.fecha} onChange={c('fecha')} /></div>
        <div className="campo"><label htmlFor="n-hora">Hora</label><input id="n-hora" type="time" className="control" value={f.hora} onChange={c('hora')} /></div>
      </div>
      <div className="campo"><label htmlFor="n-rival">Rival</label><input id="n-rival" className="control" value={f.rival} onChange={c('rival')} autoComplete="off" /></div>
      <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend style={{ fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 8 }}>Condición</legend>
        <div className="radio-grupo" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {[['local', 'Local'], ['visitante', 'Visitante']].map(([v, t]) => (
            <label key={v} className="radio-op"><input type="radio" name="condicion" checked={f.condicion === v} onChange={() => setF({ ...f, condicion: v })} />{t}</label>
          ))}
        </div>
      </fieldset>
      <div className="campo"><label htmlFor="n-cancha">Cancha</label><input id="n-cancha" className="control" value={f.cancha} onChange={c('cancha')} placeholder="Si no se sabe, dejalo vacío" /></div>
      <button type="submit" className="btn btn-primario">Agregar partido</button>
    </form>
  )
}

export default function PanelPartidos() {
  const [modo, setModo] = useState('resultado')
  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">Partidos</h1>
        <Segmento etiqueta="Acción" valor={modo} onCambio={setModo}
          opciones={[{ valor: 'resultado', texto: 'Resultado u horario' }, { valor: 'nuevo', texto: 'Nuevo partido' }]} />
        {modo === 'resultado' ? <CargarResultado /> : <NuevoPartido alTerminar={() => setModo('resultado')} />}
      </main>
      <NavPanel actual="panel-partidos" />
    </>
  )
}
