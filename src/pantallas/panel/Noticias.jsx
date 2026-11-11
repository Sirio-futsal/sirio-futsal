import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { fechaCorta } from '../../componentes/comunes.jsx'
import { esAdmin, puedePublicarEnCategoria } from '../../datos/reglas.js'

export default function PanelNoticias() {
  const { estado, usuario, ejecutar, mostrarToast, hoyISO, categorias, categoriaPorId } = useApp()
  const opciones = [
    ...(esAdmin(usuario) ? [{ valor: 'club', texto: 'Todo el club' }] : []),
    ...categorias.filter((c) => puedePublicarEnCategoria(usuario, c.id, estado.equipos)).map((c) => ({ valor: c.id, texto: c.nombre })),
  ]
  const [f, setF] = useState({ categoria: opciones[0]?.valor || '', titulo: '', bajada: '', texto: '' })
  const c = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const publicar = (e) => {
    e.preventDefault()
    if (!f.titulo.trim()) {
      mostrarToast('Escribí un título.', 'error')
      return
    }
    const ok = ejecutar('noticia/crear', {
      noticia: { categoriaId: f.categoria === 'club' ? null : f.categoria, fecha: hoyISO, destacada: false, titulo: f.titulo.trim(), bajada: f.bajada.trim(), texto: f.texto.trim() },
    })
    if (ok) {
      mostrarToast('Noticia publicada.')
      setF({ ...f, titulo: '', bajada: '', texto: '' })
    }
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <h1 className="h1">Nueva noticia</h1>
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
            <div className="rayado" style={{ height: 90, borderRadius: 10 }}>La carga de fotos se habilita en la versión real</div>
          </div>
          <button type="submit" className="btn btn-primario">Publicar</button>
        </form>

        <section className="seccion">
          <h2 className="rotulo">Publicadas</h2>
          <div className="lista">
            {estado.noticias.slice(0, 6).map((n) => (
              <div key={n.id} className="fila">
                <span className="crece">
                  <span style={{ fontWeight: 600 }}>{n.titulo}</span>
                  <span className="mini suave">{n.categoriaId ? categoriaPorId[n.categoriaId].nombre : 'Todo el club'} · {fechaCorta(n.fecha)}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <NavPanel actual="panel-noticias" />
    </>
  )
}
