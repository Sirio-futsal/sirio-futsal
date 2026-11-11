import { useEffect, useState } from 'react'
import { useApp } from '../../estado.jsx'
import { ESCUDO, fechaCorta, nombreEquipo, iniciales, ordenarPartidos, posicionSirioTexto } from '../../componentes/comunes.jsx'
import { resultadoSirio, filaDeSirio } from '../../datos/reglas.js'
import { ordenEquipo } from './SeccionesClub.jsx'

// Portada del inicio: va cambiando sola entre próximo partido, último resultado, posiciones y novedad.
export default function Carrusel() {
  const { estado, ir, hoyISO, equipoPorId, categoriaPorId } = useApp()
  const [i, setI] = useState(0)
  const [pausa, setPausa] = useState(false)

  const proximo = ordenarPartidos(estado.partidos.filter((p) => p.estado === 'programado' && p.fecha >= hoyISO))[0]
  const ultimo = ordenarPartidos(estado.partidos.filter((p) => resultadoSirio(p)), false)[0]
  const tablas = (estado.tablas || [])
    .map((t) => ({ t, equipo: equipoPorId[t.equipoId] }))
    .filter((x) => x.equipo && filaDeSirio(x.t.filas))
    .sort((a, b) => ordenEquipo(a.equipo.id) - ordenEquipo(b.equipo.id))
    .slice(0, 3)
  const noticia = estado.noticias[0]

  const slides = []
  if (proximo) slides.push(
    <>
      <div className="seccion-cabeza" style={{ alignItems: 'center' }}>
        <span className="hero-rotulo">PRÓXIMO PARTIDO</span>
        <span className="hero-chip">{nombreEquipo(equipoPorId[proximo.equipoId], categoriaPorId, true)}</span>
      </div>
      <div className="duelo">
        <div className="equipo-duelo">
          <img src={ESCUDO} alt="Escudo de Sirio" />
          <span className="nombre-duelo">{proximo.condicion === 'local' ? 'Sirio' : proximo.rival}</span>
        </div>
        <div className="equipo-duelo">
          <span className="marcador num" style={{ fontSize: 32 }}>{proximo.hora || 'A conf.'}</span>
          <span className="hero-suave">{fechaCorta(proximo.fecha)}</span>
        </div>
        <div className="equipo-duelo">
          {proximo.condicion === 'local' ? <span className="escudo-rival">{iniciales(proximo.rival)}</span> : <img src={ESCUDO} alt="Escudo de Sirio" />}
          <span className="nombre-duelo">{proximo.condicion === 'local' ? proximo.rival : 'Sirio'}</span>
        </div>
      </div>
      <div className="seccion-cabeza" style={{ alignItems: 'center' }}>
        <span className="hero-suave">{proximo.cancha || 'Cancha a confirmar'}</span>
        <button type="button" className="btn btn-hero" onClick={() => ir(`partido-${proximo.id}`)}>Ver detalle</button>
      </div>
    </>,
  )
  if (ultimo) {
    const local = ultimo.condicion === 'local'
    const r = resultadoSirio(ultimo)
    slides.push(
      <>
        <div className="seccion-cabeza" style={{ alignItems: 'center' }}>
          <span className="hero-rotulo">ÚLTIMO RESULTADO</span>
          <span className="hero-chip">{nombreEquipo(equipoPorId[ultimo.equipoId], categoriaPorId, true)}</span>
        </div>
        <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
          <span className="num" style={{ fontFamily: 'var(--display)', fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
            {local ? `${ultimo.golesSirio} – ${ultimo.golesRival}` : `${ultimo.golesRival} – ${ultimo.golesSirio}`}
          </span>
          <span style={{ fontWeight: 600 }}>{local ? `Sirio vs ${ultimo.rival}` : `${ultimo.rival} vs Sirio`}</span>
          <span className="hero-suave">{{ G: 'Ganamos', E: 'Empatamos', P: 'Perdimos' }[r]} · {fechaCorta(ultimo.fecha)}</span>
        </div>
        <div className="seccion-cabeza" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-hero" onClick={() => ir(`partido-${ultimo.id}`)}>Ver detalle</button>
        </div>
      </>,
    )
  }
  if (tablas.length) slides.push(
    <>
      <div className="seccion-cabeza" style={{ alignItems: 'center' }}>
        <span className="hero-rotulo">CÓMO VIENE SIRIO</span>
        <span className="hero-chip">Posiciones</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {tablas.map(({ t, equipo }) => (
          <div key={t.equipoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{nombreEquipo(equipo, categoriaPorId, true)}</span>
            <span className="num" style={{ fontWeight: 700 }}>{posicionSirioTexto(t.filas)}</span>
          </div>
        ))}
      </div>
      <div className="seccion-cabeza" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-hero" onClick={() => ir('tablas')}>Ver todas las tablas</button>
      </div>
    </>,
  )
  if (noticia) slides.push(
    <>
      <div className="seccion-cabeza" style={{ alignItems: 'center' }}>
        <span className="hero-rotulo">NOVEDADES</span>
        <span className="hero-chip">{noticia.categoriaId ? categoriaPorId[noticia.categoriaId]?.nombre : 'Todo el club'}</span>
      </div>
      <span style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, lineHeight: 1.15 }}>{noticia.titulo}</span>
      <div className="seccion-cabeza" style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-hero" onClick={() => ir(`noticia-${noticia.id}`)}>Leer</button>
      </div>
    </>,
  )

  const n = slides.length
  useEffect(() => {
    if (n < 2 || pausa) return undefined
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000)
    return () => clearInterval(t)
  }, [n, pausa])

  if (!n) return <section className="tarjeta vacio">No hay partidos programados.</section>
  const actual = i % n
  return (
    <section className="hero carrusel" aria-label="Destacados del club" aria-roledescription="carrusel"
      onPointerDown={() => setPausa(true)} onPointerUp={() => setPausa(false)} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <div key={actual} className="carrusel-slide">{slides[actual]}</div>
      {n > 1 ? (
        <div className="carrusel-puntos" role="tablist" aria-label="Elegir destacado">
          {slides.map((_, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === actual} aria-label={`Destacado ${k + 1}`} onClick={() => setI(k)} className={k === actual ? 'on' : ''} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
