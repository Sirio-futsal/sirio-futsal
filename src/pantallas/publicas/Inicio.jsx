import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, NavPublica, ESCUDO, TarjetaPartido, fechaCorta, nombreEquipo, iniciales, ordenarPartidos } from '../../componentes/comunes.jsx'
import { resultadoSirio } from '../../datos/reglas.js'
import { MenuSecciones, seccionesDisponibles, Posiciones, Galeria, Archivo, Historia, Sponsors, Indumentaria, Sumate, Contacto } from './SeccionesClub.jsx'

export default function Inicio() {
  const { estado, ir, hoyISO, equipoPorId, categoriaPorId } = useApp()
  const proximos = ordenarPartidos(estado.partidos.filter((p) => p.estado === 'programado' && p.fecha >= hoyISO))
  const proximo = proximos[0]
  const resultados = ordenarPartidos(estado.partidos.filter((p) => resultadoSirio(p)), false).slice(0, 3)
  const noticia = estado.noticias[0]
  // Foto de Novedades: sale de la Galería del club. Con una sola foto queda fija; con varias rota cada 24 hs.
  const fotosGaleria = (estado.galeria || []).map((f) => f.url).filter(Boolean).slice().reverse()
  const diaNum = Math.floor(Date.parse(`${hoyISO}T00:00:00Z`) / 86400000)
  const fotoNovedad = fotosGaleria.length ? fotosGaleria[diaNum % fotosGaleria.length] : null
  const secciones = seccionesDisponibles(estado)

  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <button type="button" className="fila fila-btn" onClick={() => ir('tablas')}
          style={{ background: 'var(--dorado)', color: '#0d0f0e', borderRadius: 14, padding: '14px 16px' }}>
          <span className="crece">
            <span style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}>Tabla de posiciones</span>
            <span className="mini" style={{ color: '#0d0f0e', opacity: .8 }}>Todas las categorías, siempre actualizada</span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </button>
        <MenuSecciones secciones={secciones} />
        {proximo ? (
          <section className="hero" aria-label="Próximo partido">
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
          </section>
        ) : (
          <section className="tarjeta vacio">No hay partidos programados.</section>
        )}

        <section className="seccion">
          <div className="seccion-cabeza">
            <h2 className="h2">Últimos resultados</h2>
            <button type="button" className="link-btn" onClick={() => ir('fixture')}>Ver fixture</button>
          </div>
          <div className="lista">
            {resultados.map((p) => {
              const r = resultadoSirio(p)
              const local = p.condicion === 'local'
              return (
                <button key={p.id} type="button" className="fila fila-btn" onClick={() => ir(`partido-${p.id}`)}>
                  <span className={`resultado-letra res-${r}`} aria-label={{ G: 'Ganó', E: 'Empató', P: 'Perdió' }[r]}>{r}</span>
                  <span className="crece">
                    <span className="mini suave">{nombreEquipo(equipoPorId[p.equipoId], categoriaPorId)} · {fechaCorta(p.fecha)}</span>
                    <span className="num" style={{ fontWeight: 600 }}>
                      {local ? `Sirio ${p.golesSirio} – ${p.golesRival} ${p.rival}` : `${p.rival} ${p.golesRival} – ${p.golesSirio} Sirio`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {proximos.length > 1 ? (
          <section className="seccion">
            <h2 className="h2">También se juega</h2>
            {proximos.slice(1, 3).map((p) => <TarjetaPartido key={p.id} partido={p} mostrarFecha />)}
          </section>
        ) : null}

        {noticia ? (
          <section id="novedades" className="seccion ancla">
            <div className="seccion-cabeza">
              <h2 className="h2">Novedades</h2>
              <button type="button" className="link-btn" onClick={() => ir('noticias')}>Ver todas</button>
            </div>
            <button type="button" className="tarjeta fila-btn" style={{ display: 'flex', overflow: 'hidden', padding: 0 }} onClick={() => ir(`noticia-${noticia.id}`)}>
              {fotoNovedad ? (
                <img src={fotoNovedad} alt="" loading="lazy" style={{ width: 104, flexShrink: 0, objectFit: 'cover' }} />
              ) : <div className="rayado" style={{ width: 104, flexShrink: 0, fontSize: 11 }}>Foto</div>}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span className="rotulo-verde">{noticia.categoriaId ? categoriaPorId[noticia.categoriaId].nombre : 'Todo el club'}</span>
                <span style={{ fontWeight: 600, lineHeight: 1.3 }}>{noticia.titulo}</span>
              </div>
            </button>
          </section>
        ) : null}
        <Posiciones />
        {estado.boletin && estado.boletin.jugadores.length ? (
          <section id="boletin" className="seccion ancla" aria-labelledby="titulo-boletin">
            <div className="seccion-cabeza">
              <h2 id="titulo-boletin" className="h2">Jugadores en boletín</h2>
              <span className="mini suave">Boletín {estado.boletin.numero} · {fechaCorta(estado.boletin.fecha)}</span>
            </div>
            <ul className="lista">
              {estado.boletin.jugadores.map((nombre) => (
                <li key={nombre} className="fila"><span className="crece" style={{ fontWeight: 600 }}>{nombre}</span></li>
              ))}
            </ul>
            <span className="mini suave">Según el boletín del Tribunal Disciplinario de la Asociación Rosarina de Fútbol.</span>
          </section>
        ) : null}
        <Galeria />
        <Archivo />
        <Historia />
        <Sponsors />
        <Indumentaria />
        <Sumate />
        <Contacto />
      </main>
      <NavPublica actual="inicio" />
    </>
  )
}
