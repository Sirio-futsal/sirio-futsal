import { useApp } from '../../estado.jsx'
import { Icono, AvisoPrueba, ESCUDO } from '../../componentes/comunes.jsx'
import { esAdmin } from '../../datos/reglas.js'

export function EncabezadoPanel({ titulo, volverA }) {
  const { usuario, ir } = useApp()
  return (
    <header className="encabezado">
      <div className="encabezado-fila g">
        {volverA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <button type="button" className="btn-icono" style={{ marginLeft: -12 }} aria-label="Volver" onClick={() => ir(volverA)}>{Icono.atras()}</button>
            <h1 className="titulo-barra">{titulo}</h1>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img src={ESCUDO} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span className="marca-texto" style={{ fontSize: 22 }}>PANEL</span>
          </div>
        )}
        {usuario ? <span className="chip-rol">{esAdmin(usuario) ? 'Administradora' : 'Entrenador'}</span> : null}
      </div>
      <AvisoPrueba />
    </header>
  )
}

export function NavPanel({ actual }) {
  const { ir } = useApp()
  const items = [
    ['panel', 'Pendientes', Icono.check],
    ['panel-partidos', 'Partidos', Icono.calendario],
    ['panel-noticias', 'Publicar', Icono.mas2],
    ['panel-planteles', 'Planteles', Icono.personas],
    ['panel-mas', 'Más', Icono.mas],
  ]
  return (
    <nav className="nav" aria-label="Panel">
      <div className="nav-interior">
        {items.map(([v, txt, ic]) => (
          <button key={v} type="button" aria-current={actual === v ? 'page' : undefined} onClick={() => ir(v)}>
            {ic()}{txt}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function SoloAdmin({ children }) {
  const { usuario, ir } = useApp()
  if (esAdmin(usuario)) return children
  return (
    <main className="contenido g">
      <div className="tarjeta vacio">Esta sección es solo para la administradora.</div>
      <button type="button" className="btn btn-secundario" onClick={() => ir('panel')}>Volver al panel</button>
    </main>
  )
}
