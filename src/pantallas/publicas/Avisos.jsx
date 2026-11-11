import { useApp } from '../../estado.jsx'
import { EncabezadoVolver, Interruptor, Icono, nombreEquipo } from '../../componentes/comunes.jsx'

const TIPOS = [
  ['proximo', 'Partido próximo'],
  ['resultado', 'Resultados'],
  ['horario', 'Cambio de horario'],
  ['anuncio', 'Anuncios del club'],
]

function esIphone() {
  try {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
  } catch {
    return false
  }
}

export default function Avisos() {
  const { estado, ejecutar, mostrarToast, categorias, categoriaPorId } = useApp()
  const { seguidos, tipos } = estado.preferencias
  const iphone = esIphone()

  const alternarEquipo = (id, activo) =>
    ejecutar('preferencias', { cambios: { seguidos: activo ? [...seguidos, id] : seguidos.filter((x) => x !== id) } })
  const alternarTipo = (id, activo) =>
    ejecutar('preferencias', { cambios: { tipos: activo ? [...tipos, id] : tipos.filter((x) => x !== id) } })

  return (
    <>
      <EncabezadoVolver titulo="Avisos" volverA="mas" />
      <main className="contenido sin-nav g">
        <section className="hero">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="hero-rotulo" style={{ fontSize: 13 }}>{iphone ? 'ESTÁS EN IPHONE' : 'EN IPHONE'}</span>
            <h2 className="h2" style={{ fontSize: 22 }}>Primero instalá la app desde Safari</h2>
          </div>
          <ol className="pasos">
            <li><span className="paso-num">1</span><span>Tocá <strong>Compartir</strong> {Icono.compartir({ style: { verticalAlign: '-2px' } })} en la barra de Safari.</span></li>
            <li><span className="paso-num">2</span><span>Elegí <strong>Agregar a inicio</strong>.</span></li>
            <li><span className="paso-num">3</span><span>Abrí SIRIO FUTSAL desde el ícono y activá los avisos acá.</span></li>
          </ol>
          <span className="hero-suave">Requiere iOS 16.4 o posterior. En Android funciona directo desde el navegador.</span>
        </section>

        <section className="seccion">
          <h2 className="rotulo">Equipos que seguís</h2>
          {categorias.filter((c) => c.conFixture).map((c) => (
            <div key={c.id} className="seccion" style={{ gap: 6 }}>
              <span className="rotulo-verde">{c.nombre}</span>
              <div className="lista">
                {estado.equipos.filter((e) => e.categoriaId === c.id).map((e) => {
                  const activo = seguidos.includes(e.id)
                  const texto = nombreEquipo(e, categoriaPorId)
                  return (
                    <div key={e.id} className="fila" style={{ justifyContent: 'space-between', minHeight: 52, paddingBlock: 8 }}>
                      <span style={{ fontWeight: 600 }}>{e.categoriaId === 'veteranos' ? 'Veteranos' : e.nombre}</span>
                      <Interruptor activo={activo} etiqueta={texto} onCambio={(v) => alternarEquipo(e.id, v)} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="seccion">
          <h2 className="rotulo">Qué avisos recibir</h2>
          <div className="tarjeta" style={{ padding: '6px 14px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12 }}>
            {TIPOS.map(([id, txt]) => (
              <label key={id} className="check" htmlFor={`tipo-${id}`}>
                <input id={`tipo-${id}`} type="checkbox" checked={tipos.includes(id)} onChange={(ev) => alternarTipo(id, ev.target.checked)} />
                {txt}
              </label>
            ))}
          </div>
        </section>

        <button type="button" className="btn btn-primario btn-bloque"
          onClick={() => mostrarToast(`Preferencias guardadas: ${seguidos.length} equipos. En la versión de prueba no se envían notificaciones reales al celular.`)}>
          Activar avisos en este celular
        </button>
      </main>
    </>
  )
}
