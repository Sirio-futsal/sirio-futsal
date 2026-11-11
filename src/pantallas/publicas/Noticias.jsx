import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { estiloFoto } from '../../datos/reglas.js'
import { EncabezadoPublico, EncabezadoVolver, NavPublica, Chips, fechaCorta, fechaLarga } from '../../componentes/comunes.jsx'

export function ListaNoticias() {
  const { estado, ir, categorias, categoriaPorId } = useApp()
  const [filtro, setFiltro] = useState('todas')
  const lista = estado.noticias.filter((n) => (filtro === 'todas' ? true : filtro === 'club' ? n.categoriaId == null : n.categoriaId === filtro))
  const [destacada, ...resto] = lista
  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <h1 className="h1">Noticias</h1>
        <Chips etiqueta="Filtrar noticias" valor={filtro} onCambio={setFiltro}
          opciones={[{ valor: 'todas', texto: 'Todas' }, { valor: 'club', texto: 'Del club' }, ...categorias.map((c) => ({ valor: c.id, texto: c.nombre }))]} />
        {!destacada ? <div className="tarjeta vacio">No hay noticias en esta sección.</div> : (
          <button type="button" className="tarjeta fila-btn" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={() => ir(`noticia-${destacada.id}`)}>
            {destacada.fotoUrl ? <img src={destacada.fotoUrl} alt="" style={{ height: 160, width: '100%', ...estiloFoto(destacada.fotoPos) }} /> : <div className="rayado" style={{ height: 160, width: '100%' }}>Foto principal</div>}
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="rotulo-verde">{destacada.categoriaId ? categoriaPorId[destacada.categoriaId].nombre : 'Todo el club'} · {fechaCorta(destacada.fecha)}</span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, lineHeight: 1.1, textWrap: 'balance' }}>{destacada.titulo}</span>
              <span className="chico suave">{destacada.bajada}</span>
            </div>
          </button>
        )}
        {resto.map((n) => (
          <button key={n.id} type="button" className="tarjeta fila-btn" style={{ padding: 0, overflow: 'hidden', display: 'flex' }} onClick={() => ir(`noticia-${n.id}`)}>
            {n.fotoUrl ? <img src={n.fotoUrl} alt="" style={{ width: 92, flexShrink: 0, ...estiloFoto(n.fotoPos) }} /> : <div className="rayado" style={{ width: 92, flexShrink: 0 }} />}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span className="rotulo-verde" style={{ fontSize: 11 }}>{n.categoriaId ? categoriaPorId[n.categoriaId].nombre : 'Todo el club'} · {fechaCorta(n.fecha)}</span>
              <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{n.titulo}</span>
            </div>
          </button>
        ))}
      </main>
      <NavPublica actual="noticias" />
    </>
  )
}

export function DetalleNoticia({ id }) {
  const { estado, categoriaPorId } = useApp()
  const n = estado.noticias.find((x) => x.id === id)
  return (
    <>
      <EncabezadoVolver titulo="Noticias" volverA="noticias" />
      <main className="contenido g">
        {!n ? <div className="tarjeta vacio">No encontramos esa noticia.</div> : (
          <article className="seccion" style={{ gap: 14 }}>
            {n.fotoUrl ? <div className="tarjeta" style={{ overflow: 'hidden', width: '100%', aspectRatio: '16 / 9' }}><img src={n.fotoUrl} alt="" style={{ width: '100%', height: '100%', ...estiloFoto(n.fotoPos) }} /></div> : <div className="rayado tarjeta" style={{ height: 190 }}>Foto principal</div>}
            <span className="rotulo-verde">{n.categoriaId ? categoriaPorId[n.categoriaId].nombre : 'Todo el club'} · <span style={{ textTransform: 'none' }}>{fechaLarga(n.fecha)}</span></span>
            <h1 className="h1" style={{ fontSize: 30, textTransform: 'none' }}>{n.titulo}</h1>
            <p style={{ margin: 0, fontWeight: 600 }}>{n.bajada}</p>
            <p style={{ margin: 0, lineHeight: 1.6, maxWidth: '65ch' }}>{n.texto}</p>
          </article>
        )}
      </main>
      <NavPublica actual="noticias" />
    </>
  )
}
