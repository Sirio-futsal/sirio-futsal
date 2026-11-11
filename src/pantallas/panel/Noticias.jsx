import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { fechaCorta } from '../../componentes/comunes.jsx'
import { subirImagen } from '../../datos/nube.js'
import { esAdmin, puedePublicarEnCategoria } from '../../datos/reglas.js'

// Recuadro para acomodar la foto: se arrastra con el dedo o el mouse para elegir qué parte se ve.
function Encuadre({ url, pos, onCambio }) {
  const [ini, setIni] = useState(null)
  const [x, y] = (pos || '50% 50%').split(' ').map((v) => parseFloat(v) || 50)
  const bajar = (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setIni({ cx: e.clientX, cy: e.clientY, x, y }) }
  const mover = (e) => {
    if (!ini) return
    const r = e.currentTarget.getBoundingClientRect()
    const nx = Math.min(100, Math.max(0, ini.x - ((e.clientX - ini.cx) / r.width) * 160))
    const ny = Math.min(100, Math.max(0, ini.y - ((e.clientY - ini.cy) / r.height) * 160))
    onCambio(`${Math.round(nx)}% ${Math.round(ny)}%`)
  }
  return (
    <div>
      <div onPointerDown={bajar} onPointerMove={mover} onPointerUp={() => setIni(null)} onPointerCancel={() => setIni(null)}
        style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 10, touchAction: 'none', cursor: ini ? 'grabbing' : 'grab', position: 'relative', background: '#0d0f0e' }}>
        <img src={url} alt="Foto de la noticia" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${x}% ${y}%`, pointerEvents: 'none', userSelect: 'none' }} />
        <span style={{ position: 'absolute', left: 8, bottom: 8, background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: 12, padding: '3px 8px', borderRadius: 999 }}>Arrastrá para acomodar</span>
      </div>
    </div>
  )
}

export default function PanelNoticias() {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, categorias, categoriaPorId } = useApp()
  const opciones = [
    ...(esAdmin(usuario) ? [{ valor: 'club', texto: 'Todo el club' }] : []),
    ...categorias.filter((c) => puedePublicarEnCategoria(usuario, c.id, estado.equipos)).map((c) => ({ valor: c.id, texto: c.nombre })),
  ]
  const [f, setF] = useState({ categoria: opciones[0]?.valor || '', titulo: '', bajada: '', texto: '', fotoUrl: '', fotoPos: '' })
  const [subiendo, setSubiendo] = useState(false)
  const [editando, setEditando] = useState(null)
  const [borrar, setBorrar] = useState(null)
  const c = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setSubiendo(true)
    try {
      const url = await subirImagen(archivo, 'noticias')
      setF((x) => ({ ...x, fotoUrl: url, fotoPos: '' }))
    } catch (err) {
      mostrarToast(err.message || 'No se pudo subir la foto.', 'error')
    }
    setSubiendo(false)
  }

  const cancelar = () => { setEditando(null); setF({ categoria: opciones[0]?.valor || '', titulo: '', bajada: '', texto: '', fotoUrl: '', fotoPos: '' }) }
  const editar = (n) => {
    setEditando(n.id)
    setF({ categoria: n.categoriaId || 'club', titulo: n.titulo || '', bajada: n.bajada || '', texto: n.texto || '', fotoUrl: n.fotoUrl || '', fotoPos: n.fotoPos || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const eliminar = (n) => {
    if (ejecutar('noticia/eliminar', { id: n.id })) {
      mostrarToast('Noticia eliminada.')
      setBorrar(null)
      if (editando === n.id) cancelar()
    }
  }

  const publicar = (e) => {
    e.preventDefault()
    if (!f.titulo.trim()) {
      mostrarToast('Escribí un título.', 'error')
      return
    }
    if (editando) {
      if (ejecutar('noticia/editar', { noticia: { id: editando, categoriaId: f.categoria === 'club' ? null : f.categoria, titulo: f.titulo.trim(), bajada: f.bajada.trim(), texto: f.texto.trim(), fotoUrl: f.fotoUrl || null, fotoPos: f.fotoPos || null } })) {
        mostrarToast('Noticia actualizada.')
        cancelar()
      }
      return
    }
    const ok = ejecutar('noticia/crear', {
      noticia: { categoriaId: f.categoria === 'club' ? null : f.categoria, fecha: hoyISO, destacada: false, titulo: f.titulo.trim(), bajada: f.bajada.trim(), texto: f.texto.trim(), fotoUrl: f.fotoUrl || null, fotoPos: f.fotoPos || null },
    })
    if (ok) {
      mostrarToast('Noticia publicada.')
      setF({ ...f, titulo: '', bajada: '', texto: '', fotoUrl: '', fotoPos: '' })
    }
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">{editando ? 'Editar noticia' : 'Nueva noticia'}</h1>
        <form className="tarjeta form" style={{ padding: 14 }} onSubmit={publicar}>
          <div className="campo">
            <label htmlFor="not-cat">Categoría</label>
            <select id="not-cat" className="control" value={f.categoria} onChange={c('categoria')}>
              {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
            {!esAdmin(usuario) ? <span className="ayuda">Solo podés publicar en las categorías de tus equipos.</span> : null}
          </div>
          <div className="campo"><label htmlFor="not-tit">Título</label><input id="not-tit" className="control" value={f.titulo} onChange={c('titulo')} /></div>
          <div className="campo"><label htmlFor="not-baj">Bajada (una línea)</label><input id="not-baj" className="control" value={f.bajada} onChange={c('bajada')} /></div>
          <div className="campo"><label htmlFor="not-txt">Texto</label><textarea id="not-txt" className="control" value={f.texto} onChange={c('texto')} /></div>
          <div className="campo">
            <span className="etq">Foto</span>
            {f.fotoUrl ? <Encuadre url={f.fotoUrl} pos={f.fotoPos} onCambio={(p) => setF((x) => ({ ...x, fotoPos: p }))} /> : null}
            <label className="btn btn-secundario" style={{ textAlign: 'center', cursor: subiendo ? 'wait' : 'pointer' }}>
              {subiendo ? 'Subiendo…' : f.fotoUrl ? 'Cambiar foto' : 'Elegir foto (opcional)'}
              <input type="file" accept="image/*" onChange={elegirFoto} disabled={subiendo} style={{ display: 'none' }} />
            </label>
            {f.fotoUrl ? <button type="button" className="btn btn-peligro" onClick={() => setF({ ...f, fotoUrl: '', fotoPos: '' })}>Quitar foto</button> : null}
          </div>
          <button type="submit" className="btn btn-primario" disabled={subiendo}>{editando ? 'Guardar cambios' : 'Publicar'}</button>
          {editando ? <button type="button" className="btn btn-secundario" onClick={cancelar}>Cancelar</button> : null}
        </form>

        <section className="seccion">
          <h2 className="rotulo">Publicadas</h2>
          <div className="lista">
            {estado.noticias.filter((n) => puedePublicarEnCategoria(usuario, n.categoriaId, estado.equipos)).map((n) => (
              <div key={n.id} className="fila" style={{ flexWrap: 'wrap' }}>
                <span className="crece">
                  <span style={{ fontWeight: 600 }}>{n.titulo}</span>
                  <span className="mini suave">{n.categoriaId ? categoriaPorId[n.categoriaId].nombre : 'Todo el club'} · {fechaCorta(n.fecha)}</span>
                </span>
                {borrar === n.id ? (
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-peligro" onClick={() => eliminar(n)}>Sí, eliminar</button>
                    <button type="button" className="btn btn-secundario" onClick={() => setBorrar(null)}>No</button>
                  </span>
                ) : (
                  <span style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secundario" onClick={() => editar(n)}>Editar</button>
                    <button type="button" className="btn btn-peligro" onClick={() => setBorrar(n.id)}>Eliminar</button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <NavPanel actual="panel-noticias" />
    </>
  )
}
