import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { fechaCorta } from '../../componentes/comunes.jsx'
import { subirImagen } from '../../datos/nube.js'
import { esAdmin, puedePublicarEnCategoria } from '../../datos/reglas.js'

export default function PanelNoticias() {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, categorias, categoriaPorId } = useApp()
  const opciones = [
    ...(esAdmin(usuario) ? [{ valor: 'club', texto: 'Todo el club' }] : []),
    ...categorias.filter((c) => puedePublicarEnCategoria(usuario, c.id, estado.equipos)).map((c) => ({ valor: c.id, texto: c.nombre })),
  ]
  const [f, setF] = useState({ categoria: opciones[0]?.valor || '', titulo: '', bajada: '', texto: '', fotoUrl: '' })
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
      setF((x) => ({ ...x, fotoUrl: url }))
    } catch (err) {
      mostrarToast(err.message || 'No se pudo subir la foto.', 'error')
    }
    setSubiendo(false)
  }

  const cancelar = () => { setEditando(null); setF({ categoria: opciones[0]?.valor || '', titulo: '', bajada: '', texto: '', fotoUrl: '' }) }
  const editar = (n) => {
    setEditando(n.id)
    setF({ categoria: n.categoriaId || 'club', titulo: n.titulo || '', bajada: n.bajada || '', texto: n.texto || '', fotoUrl: n.fotoUrl || '' })
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
      if (ejecutar('noticia/editar', { noticia: { id: editando, categoriaId: f.categoria === 'club' ? null : f.categoria, titulo: f.titulo.trim(), bajada: f.bajada.trim(), texto: f.texto.trim(), fotoUrl: f.fotoUrl || null } })) {
        mostrarToast('Noticia actualizada.')
        cancelar()
      }
      return
    }
    const ok = ejecutar('noticia/crear', {
      noticia: { categoriaId: f.categoria === 'club' ? null : f.categoria, fecha: hoyISO, destacada: false, titulo: f.titulo.trim(), bajada: f.bajada.trim(), texto: f.texto.trim(), fotoUrl: f.fotoUrl || null },
    })
    if (ok) {
      mostrarToast('Noticia publicada.')
      setF({ ...f, titulo: '', bajada: '', texto: '', fotoUrl: '' })
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
            {f.fotoUrl ? <img src={f.fotoUrl} alt="Foto de la noticia" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10 }} /> : null}
            <label className="btn btn-secundario" style={{ textAlign: 'center', cursor: subiendo ? 'wait' : 'pointer' }}>
              {subiendo ? 'Subiendo…' : f.fotoUrl ? 'Cambiar foto' : 'Elegir foto (opcional)'}
              <input type="file" accept="image/*" onChange={elegirFoto} disabled={subiendo} style={{ display: 'none' }} />
            </label>
            {f.fotoUrl ? <button type="button" className="btn btn-peligro" onClick={() => setF({ ...f, fotoUrl: '' })}>Quitar foto</button> : null}
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
