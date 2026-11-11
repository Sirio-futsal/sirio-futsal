import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { nombreEquipo, fechaCorta, posicionSirioTexto, Icono } from '../../componentes/comunes.jsx'
import { filaDeSirio, parsearSponsors, parsearLineas, enlaceWhatsapp } from '../../datos/reglas.js'

const externo = { target: '_blank', rel: 'noopener noreferrer' }

export const urlInstagram = (v) => {
  const t = String(v || '').trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://instagram.com/${t.replace(/^@/, '')}`
}

// Secciones que tienen contenido: arman el menú de la parte de arriba del inicio.
export function seccionesDisponibles(estado) {
  const club = estado.club || {}
  const hay = (x) => !!String(x || '').trim()
  const conSirio = (estado.tablas || []).some((t) => filaDeSirio(t.filas))
  return [
    { id: 'novedades', texto: 'Novedades', ok: estado.noticias.length > 0 },
    { id: 'posiciones', texto: 'Posiciones', ok: conSirio },
    { id: 'boletin', texto: 'Boletín', ok: !!(estado.boletin && estado.boletin.jugadores.length) },
    { id: 'galeria', texto: 'Galería', ok: (estado.galeria || []).length > 0 },
    { id: 'archivo', texto: 'Archivo', ok: hay(club.archivo) },
    { id: 'historia', texto: 'Historia', ok: hay(club.historia) },
    { id: 'sponsors', texto: 'Sponsors', ok: hay(club.sponsors) },
    { id: 'sumate', texto: 'Sumate', ok: true },
    { id: 'contacto', texto: 'Contacto', ok: hay(club.direccion) || hay(club.telefono) || hay(club.whatsapp) || hay(club.instagram) },
  ].filter((s) => s.ok)
}

// Orden de las tablas: Masc. A (primera, reserva, inferiores), Masc. B (igual), Fem. B, Veteranos.
const ORDEN_EQUIPOS = [
  'masc-a-primera', 'masc-a-reserva', 'masc-a-inf-4ta', 'masc-a-inf-5ta', 'masc-a-inf-6ta', 'masc-a-inf-7ma', 'masc-a-inf-8va', 'masc-a-inf-9na',
  'masc-b-primera', 'masc-b-reserva', 'masc-b-inf-4ta', 'masc-b-inf-5ta', 'masc-b-inf-6ta', 'masc-b-inf-7ma', 'masc-b-inf-8va', 'masc-b-inf-9na',
  'fem-b-primera', 'fem-b-sub14', 'veteranos',
]
export const ordenEquipo = (id) => { const i = ORDEN_EQUIPOS.indexOf(id); return i < 0 ? 999 : i }

export function MenuSecciones({ secciones }) {
  const ir = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (!secciones.length) return null
  return (
    <nav className="menu-secciones chips" aria-label="Secciones de la página">
      {secciones.map((s) => (
        <button key={s.id} type="button" className="chip" onClick={() => ir(s.id)}>{s.texto}</button>
      ))}
    </nav>
  )
}

export function Posiciones() {
  const { estado, ir, equipoPorId, categoriaPorId } = useApp()
  const filas = (estado.tablas || [])
    .map((t) => ({ t, equipo: equipoPorId[t.equipoId] }))
    .filter((x) => x.equipo && filaDeSirio(x.t.filas))
    .sort((a, b) => ordenEquipo(a.equipo.id) - ordenEquipo(b.equipo.id))
  if (!filas.length) return null
  return (
    <section id="posiciones" className="seccion ancla" aria-labelledby="t-posiciones">
      <div className="seccion-cabeza">
        <h2 id="t-posiciones" className="h2">Cómo viene Sirio</h2>
        <span className="mini suave">Tabla de posiciones</span>
      </div>
      <div className="lista">
        {filas.map(({ t, equipo }) => (
          <button key={t.equipoId} type="button" className="fila fila-btn" onClick={() => ir(`categoria-${equipo.categoriaId}`)}>
            <span className="crece">
              <span style={{ fontWeight: 600 }}>{nombreEquipo(equipo, categoriaPorId)}</span>
              <span className="mini suave">{t.fuente === 'arf' ? 'Actualizada automáticamente · ' : 'Actualizada el '}{fechaCorta(t.actualizada)}</span>
            </span>
            <span className="num" style={{ fontWeight: 700 }}>{posicionSirioTexto(t.filas)}</span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function Galeria() {
  const { estado, ir } = useApp()
  const fotos = estado.galeria || []
  if (!fotos.length) return null
  return (
    <section id="galeria" className="seccion ancla" aria-labelledby="t-galeria">
      <div className="seccion-cabeza">
        <h2 id="t-galeria" className="h2">Galería</h2>
        <button type="button" className="link-btn" onClick={() => ir('galeria')}>Ver todas</button>
      </div>
      <div className="galeria-grilla">
        {fotos.slice(0, 6).map((f) => (
          <a key={f.id} href={f.url} {...externo} aria-label={f.titulo || 'Foto del club'}><img src={f.url} alt={f.titulo || 'Foto del club'} loading="lazy" /></a>
        ))}
      </div>
    </section>
  )
}

export function Archivo() {
  const { estado } = useApp()
  const lineas = parsearLineas(estado.club?.archivo)
  if (!lineas.length) return null
  return (
    <section id="archivo" className="seccion ancla" aria-labelledby="t-archivo">
      <h2 id="t-archivo" className="h2">Archivo</h2>
      <ul className="lista">{lineas.map((l) => <li key={l} className="fila"><span className="crece">{l}</span></li>)}</ul>
    </section>
  )
}

export function Historia() {
  const { estado } = useApp()
  const texto = String(estado.club?.historia || '').trim()
  if (!texto) return null
  return (
    <section id="historia" className="seccion ancla" aria-labelledby="t-historia">
      <h2 id="t-historia" className="h2">Nuestra historia</h2>
      <div className="tarjeta" style={{ padding: 14 }}><p className="texto-largo">{texto}</p></div>
    </section>
  )
}

export function Sponsors() {
  const { estado } = useApp()
  const lista = parsearSponsors(estado.club?.sponsors)
  if (!lista.length) return null
  return (
    <section id="sponsors" className="seccion ancla" aria-labelledby="t-sponsors">
      <h2 id="t-sponsors" className="h2">Sponsors</h2>
      <ul className="lista">
        {lista.map((s) => (
          <li key={s.nombre} className="fila">
            {s.url ? <a className="crece link-btn" href={s.url} {...externo}>{s.nombre}</a> : <span className="crece" style={{ fontWeight: 600 }}>{s.nombre}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Indumentaria() {
  const { estado } = useApp()
  const club = estado.club || {}
  if (!String(club.indumentariaTexto || '').trim() && !String(club.indumentariaUrl || '').trim()) return null
  return (
    <section className="tarjeta seccion" style={{ padding: 14 }} aria-labelledby="t-indu">
      <h2 id="t-indu" className="h2" style={{ fontSize: 22 }}>Indumentaria</h2>
      {club.indumentariaTexto ? <p className="texto-largo">{club.indumentariaTexto}</p> : null}
      {/^https?:\/\//i.test(club.indumentariaUrl || '') ? <a className="btn btn-primario" href={club.indumentariaUrl} {...externo}>Hacer el pedido</a> : null}
    </section>
  )
}

const WA_SECRETARIA = '5493412852207'

export function Sumate() {
  const { categorias } = useApp()
  const [f, setF] = useState({ nombre: '', nacimiento: '', categoria: '', telefono: '', mensaje: '' })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const listo = f.nombre.trim() && f.telefono.trim()
  const enviar = (e) => {
    e.preventDefault()
    if (!listo) return
    const txt = [
      'Hola! Quiero jugar en Sirio Futsal.',
      `Nombre: ${f.nombre.trim()}`,
      f.nacimiento ? `Fecha de nacimiento: ${f.nacimiento}` : '',
      f.categoria ? `Categoría de interés: ${f.categoria}` : '',
      `Teléfono de contacto: ${f.telefono.trim()}`,
      f.mensaje.trim() ? `Comentario: ${f.mensaje.trim()}` : '',
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/${WA_SECRETARIA}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer')
  }
  const campo = { display: 'block', width: '100%', minWidth: 0, maxWidth: '100%', height: 48, padding: '10px 12px', borderRadius: 10, border: 0, fontSize: 16, boxSizing: 'border-box', background: '#ffffff', color: '#0d0f0e', WebkitAppearance: 'none', appearance: 'none', textAlign: 'left', fontFamily: 'inherit' }
  return (
    <section id="sumate" className="hero ancla" style={{ background: 'var(--accion)', color: 'var(--accion-texto)' }} aria-labelledby="t-sumate">
      <h2 id="t-sumate" className="h2" style={{ fontSize: 26 }}>¿Querés jugar en Sirio?</h2>
      <p style={{ margin: 0, fontSize: 14 }}>Completá tus datos y le llegan directo a la secretaría por WhatsApp.</p>
      <form className="form-sumate" onSubmit={enviar} style={{ display: 'grid', gap: 8 }}>
        <input style={campo} placeholder="Nombre y apellido" value={f.nombre} onChange={set('nombre')} autoComplete="name" required />
        <input style={campo} inputMode="numeric" placeholder="Fecha de nacimiento (dd/mm/aaaa)" aria-label="Fecha de nacimiento" maxLength={10} value={f.nacimiento}
          onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 8); setF((x) => ({ ...x, nacimiento: [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/') })) }} />
        <select style={campo} aria-label="Categoría" value={f.categoria} onChange={set('categoria')}>
          <option value="">Categoría (si no sabés, dejalo así)</option>
          {(categorias || []).map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <input style={campo} type="tel" placeholder="Tu teléfono" value={f.telefono} onChange={set('telefono')} autoComplete="tel" required />
        <textarea style={{ ...campo, height: 'auto' }} rows={2} placeholder="Comentario (opcional)" value={f.mensaje} onChange={set('mensaje')} />
        <button type="submit" className="btn btn-hero" disabled={!listo}>Enviar por WhatsApp</button>
      </form>
    </section>
  )
}

export function Contacto() {
  const { estado } = useApp()
  const club = estado.club || {}
  const wa = enlaceWhatsapp(club.whatsapp)
  const ig = urlInstagram(club.instagram)
  const tel = String(club.telefono || '').replace(/[^\d+]/g, '')
  if (!String(club.direccion || '').trim() && !tel && !wa && !ig) return null
  return (
    <section id="contacto" className="seccion ancla" aria-labelledby="t-contacto">
      <h2 id="t-contacto" className="h2">Contacto</h2>
      <div className="lista">
        {club.direccion ? (
          <div className="fila">
            {Icono.ubicacion({ style: { color: 'var(--verde-texto)' } })}
            <span className="crece">{club.direccion}</span>
          </div>
        ) : null}
        {club.telefono ? <a className="fila" href={`tel:${tel}`}><span className="crece">Teléfono · <b>{club.telefono}</b></span></a> : null}
        {wa ? <a className="fila" href={wa} {...externo}><span className="crece">WhatsApp · <b>{club.whatsapp}</b></span></a> : null}
        {ig ? <a className="fila" href={ig} {...externo}><span className="crece">Instagram · <b>{String(club.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/\/$/, '')}</b></span></a> : null}
      </div>
    </section>
  )
}
