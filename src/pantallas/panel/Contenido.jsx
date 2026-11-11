import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel, SoloAdmin } from './Comun.jsx'
import { nombreEquipo, fechaCorta, TablaPosiciones } from '../../componentes/comunes.jsx'
import { parsearTabla, filaDeSirio } from '../../datos/reglas.js'
import { subirImagen, NUBE_ACTIVA } from '../../datos/nube.js'

// ---------- Tablas de posiciones ----------
export function PanelTablas() {
  const { estado, ejecutar, mostrarToast, hoyISO, categoriaPorId, recargar } = useApp()
  const equipos = estado.equipos.filter((e) => e.categoriaId !== 'escuelita')
  const [equipoId, setEquipoId] = useState(equipos[0]?.id)
  const [texto, setTexto] = useState('')
  const actual = (estado.tablas || []).find((t) => t.equipoId === equipoId)
  const filas = parsearTabla(texto)
  const hayAlguna = (estado.tablas || []).length

  const guardar = () => {
    if (filas.length < 2) {
      mostrarToast('No pude leer la tabla. Copiá las filas completas desde la web de la Rosarina.', 'error')
      return
    }
    if (ejecutar('tabla/guardar', { equipoId, filas, actualizada: hoyISO })) {
      mostrarToast('Tabla guardada.')
      setTexto('')
    }
  }

  return (
    <>
      <EncabezadoPanel titulo="Posiciones" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <p className="chico suave" style={{ margin: 0 }}>
            Entrá a <a className="link-btn" href="https://rosariofutbol.com/tablas.html?futsal" target="_blank" rel="noopener noreferrer">la tabla de futsal de la Rosarina</a>, elegí el campeonato y la división, copiá las filas de la tabla y pegalas acá.
            Se leen las columnas Equipo, PJ, PG, PE, PP, GF, GC, DG y Puntos.
          </p>
          <div className="campo">
            <label htmlFor="tb-equipo">Equipo</label>
            <select id="tb-equipo" className="control" value={equipoId} onChange={(e) => { setEquipoId(e.target.value); setTexto('') }}>
              {equipos.map((e) => {
                const t = (estado.tablas || []).find((x) => x.equipoId === e.id)
                return <option key={e.id} value={e.id}>{nombreEquipo(e, categoriaPorId)}{t ? ` · cargada ${fechaCorta(t.actualizada)}` : ''}</option>
              })}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="tb-texto">Filas de la tabla</label>
            <textarea id="tb-texto" className="control" style={{ minHeight: 160, fontFamily: 'monospace', fontSize: 13 }} value={texto} onChange={(e) => setTexto(e.target.value)}
              placeholder={'1  R. Central  14  10  2  2  27  11  16  32\n2  Argentino Sirio  14  8  1  5  27  14  13  25'} />
          </div>
          {texto.trim() ? (
            <section className="seccion">
              <span className="chico" style={{ fontWeight: 600 }}>{filas.length ? `Leí ${filas.length} equipos` : 'No pude leer ninguna fila'}</span>
              {filas.length && !filaDeSirio(filas) ? <span className="ayuda" style={{ color: 'var(--alerta)' }}>No encontré a "Sirio" en esta tabla. Revisá que sea la división correcta.</span> : null}
              {filas.length ? <TablaPosiciones filas={filas} /> : null}
            </section>
          ) : actual ? (
            <section className="seccion">
              <span className="chico" style={{ fontWeight: 600 }}>{actual.fuente === 'arf' ? 'Tabla automática de la Rosarina' : 'Tabla cargada a mano'} (actualizada el {fechaCorta(actual.actualizada)})</span>
              <TablaPosiciones filas={actual.filas} />
            </section>
          ) : <div className="tarjeta vacio">Este equipo todavía no tiene tabla cargada.</div>}
          <button type="button" className="btn btn-primario" onClick={guardar} disabled={!filas.length}>Guardar y publicar</button>
          {NUBE_ACTIVA ? (
            <section className="seccion">
              <span className="ayuda">Las tablas y los partidos se leen solos de la Rosarina cada 2 horas. Si corregís algo a mano, esa tabla o partido deja de actualizarse solo, hasta que vuelvas a automático.</span>
              <button type="button" className="btn" onClick={() => { ejecutar('equipo/automatico', { equipoId }); mostrarToast('Listo, este equipo vuelve a actualizarse solo.'); setTimeout(recargar, 1500) }}>
                Volver a automático (tabla y partidos de este equipo)
              </button>
            </section>
          ) : null}
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}

// ---------- Datos del club ----------
const CAMPOS_TEXTO = [
  ['direccion', 'Dirección del club', 'input'],
  ['telefono', 'Teléfono', 'input'],
  ['whatsapp', 'WhatsApp (con código de área, sin 0 ni 15)', 'input'],
  ['instagram', 'Instagram (usuario o link)', 'input'],
]

export function PanelClub() {
  const { estado, ejecutar, mostrarToast } = useApp()
  const [f, setF] = useState({ ...estado.club })
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const guardar = (e) => {
    e.preventDefault()
    if (f.indumentariaUrl.trim() && !/^https?:\/\//i.test(f.indumentariaUrl.trim())) {
      mostrarToast('El link de indumentaria tiene que empezar con https://', 'error')
      return
    }
    if (ejecutar('club/guardar', { club: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v ?? '').trim()])) })) mostrarToast('Datos del club guardados.')
  }
  return (
    <>
      <EncabezadoPanel titulo="Datos del club" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <form className="form" onSubmit={guardar}>
            <div className="campo">
              <label htmlFor="cl-historia">Nuestra historia</label>
              <textarea id="cl-historia" className="control" style={{ minHeight: 140 }} value={f.historia} onChange={cambiar('historia')} />
            </div>
            {CAMPOS_TEXTO.map(([k, etiqueta]) => (
              <div className="campo" key={k}>
                <label htmlFor={`cl-${k}`}>{etiqueta}</label>
                <input id={`cl-${k}`} className="control" value={f[k]} onChange={cambiar(k)} autoComplete="off" />
              </div>
            ))}
            <div className="campo">
              <label htmlFor="cl-indu">Indumentaria (texto)</label>
              <textarea id="cl-indu" className="control" value={f.indumentariaTexto} onChange={cambiar('indumentariaTexto')} placeholder="Ej.: Pedidos con seña del 50% hasta el 24/11." />
            </div>
            <div className="campo">
              <label htmlFor="cl-indu-url">Indumentaria (link al formulario de pedido)</label>
              <input id="cl-indu-url" className="control" value={f.indumentariaUrl} onChange={cambiar('indumentariaUrl')} placeholder="https://" autoComplete="off" />
            </div>
            <div className="campo">
              <label htmlFor="cl-sponsors">Sponsors (uno por línea; opcional: Nombre | https://link)</label>
              <textarea id="cl-sponsors" className="control" value={f.sponsors} onChange={cambiar('sponsors')} />
            </div>
            <div className="campo">
              <label htmlFor="cl-archivo">Archivo de temporadas (una línea por resultado)</label>
              <textarea id="cl-archivo" className="control" value={f.archivo} onChange={cambiar('archivo')} placeholder="2025: Masculino A Primera · 3º puesto" />
            </div>
            <span className="ayuda">Lo que dejes vacío no se muestra en la app.</span>
            <button type="submit" className="btn btn-primario">Guardar</button>
          </form>
        </main>
      </SoloAdmin>
      <NavPanel actual="panel-mas" />
    </>
  )
}

// ---------- Galería ----------
export function PanelGaleria() {
  const { estado, ejecutar, mostrarToast, hoyISO, categorias } = useApp()
  const [titulo, setTitulo] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [temporada, setTemporada] = useState(hoyISO.slice(0, 4))
  const [subiendo, setSubiendo] = useState(false)

  const subir = async (e) => {
    const archivos = [...(e.target.files || [])]
    e.target.value = ''
    if (!archivos.length) return
    setSubiendo(true)
    let ok = 0
    try {
      for (const a of archivos) {
        const url = await subirImagen(a, 'galeria')
        if (ejecutar('galeria/agregar', { foto: { titulo: titulo.trim(), categoriaId: categoriaId || null, temporada: temporada.trim(), url } })) ok += 1
      }
      mostrarToast(ok === 1 ? 'Foto agregada a la galería.' : `${ok} fotos agregadas a la galería.`)
      setTitulo('')
    } catch (err) {
      mostrarToast(ok ? `Se subieron ${ok}, pero falló una: ${err.message}` : err.message || 'No se pudo subir la foto.', 'error')
    }
    setSubiendo(false)
  }

  return (
    <>
      <EncabezadoPanel titulo="Galería" volverA="panel-mas" />
      <SoloAdmin>
        <main className="contenido g">
          <section className="tarjeta form" style={{ padding: 14 }}>
            <div className="campo"><label htmlFor="ga-titulo">Descripción (opcional)</label><input id="ga-titulo" className="control" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoComplete="off" /></div>
            <div className="grilla-2">
              <div className="campo">
                <label htmlFor="ga-cat">Categoría</label>
                <select id="ga-cat" className="control" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                  <option value="">Todo el club</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="campo"><label htmlFor="ga-temp">Temporada</label><input id="ga-temp" className="control num" value={temporada} onChange={(e) => setTemporada(e.target.value)} /></div>
            </div>
            <label className="btn btn-primario" style={{ textAlign: 'center', cursor: subiendo ? 'wait' : 'pointer' }}>
              {subiendo ? 'Subiendo…' : 'Elegir fotos y subir'}
              <input type="file" accept="image/*" multiple onChange={subir} disabled={subiendo} style={{ display: 'none' }} />
            </label>
            <span className="ayuda">Subí solo fotos de personas que tengan autorización de imagen. Las fotos se achican solas antes de subirse.</span>
          </section>

          {(estado.galeria || []).length === 0 ? <div className="tarjeta vacio">Todavía no hay fotos en la galería.</div> : (
            <div className="lista">
              {estado.galeria.map((f) => (
                <div key={f.id} className="fila">
                  <img src={f.url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  <span className="crece">
                    <span style={{ fontWeight: 600 }}>{f.titulo || 'Sin descripción'}</span>
                    <span className="mini suave">{f.temporada || 'Sin temporada'}{f.categoriaId ? ` · ${categorias.find((c) => c.id === f.categoriaId)?.nombre || ''}` : ''}</span>
                  </span>
                  <button type="button" className="link-btn" style={{ color: 'var(--peligro)' }} onClick={() => { if (ejecutar('galeria/quitar', { fotoId: f.id })) mostrarToast('Foto quitada.') }}>Quitar</button>
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
