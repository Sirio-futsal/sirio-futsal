import { useApp } from '../estado.jsx'
import { resultadoSirio, filaDeSirio } from '../datos/reglas.js'
import { NUBE_ACTIVA } from '../datos/nube.js'

export const ESCUDO = 'escudo.png'

// ---------- Íconos (trazo, heredan el color del texto) ----------
const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
export const Icono = {
  inicio: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></svg>),
  calendario: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>),
  personas: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.6c2.6.2 4.6 1.9 5.3 5.4" /></svg>),
  noticias: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></svg>),
  mas: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>),
  campana: (p) => (<svg width="24" height="24" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>),
  atras: (p) => (<svg width="24" height="24" viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}><path d="M15 5l-7 7 7 7" /></svg>),
  check: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></svg>),
  mas2: (p) => (<svg width="22" height="22" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>),
  ubicacion: (p) => (<svg width="20" height="20" viewBox="0 0 24 24" {...trazo} aria-hidden="true" {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>),
  compartir: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" {...trazo} strokeWidth={2} aria-hidden="true" {...p}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 12v8h14v-8" /></svg>),
}

// ---------- Formatos ----------
const fLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const fCorta = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
const aFecha = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}
export const fechaLarga = (iso) => (iso ? fLarga.format(aFecha(iso)) : 'Fecha a confirmar')
export const fechaCorta = (iso) => (iso ? fCorta.format(aFecha(iso)).replace(/\./g, '') : 'A confirmar')

export function nombreEquipo(equipo, categoriaPorId, corto = false) {
  if (!equipo) return ''
  const cat = categoriaPorId[equipo.categoriaId]
  if (equipo.categoriaId === 'veteranos' || equipo.categoriaId === 'escuelita') return cat.nombre
  return `${corto ? cat.corto : cat.nombre} · ${equipo.nombre}`
}

export function iniciales(texto) {
  return texto.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

// ---------- Estructura ----------
export function AvisoPrueba() {
  if (NUBE_ACTIVA) return null
  return <div className="aviso-prueba g">Versión de prueba · datos de ejemplo</div>
}

export function EncabezadoPublico() {
  const { ir } = useApp()
  return (
    <header className="encabezado">
      <div className="encabezado-fila g">
        <a className="marca" href="#inicio" onClick={(e) => { e.preventDefault(); ir('inicio') }}>
          <img src={ESCUDO} alt="" />
          <span className="marca-texto">SIRIO <span>FUTSAL</span></span>
        </a>
        <button type="button" className="btn-icono" aria-label="Avisos" onClick={() => ir('avisos')}>{Icono.campana()}</button>
      </div>
      <AvisoPrueba />
    </header>
  )
}

export function EncabezadoVolver({ titulo, volverA }) {
  const { ir } = useApp()
  return (
    <header className="encabezado">
      <div className="encabezado-fila g" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="btn-icono" style={{ marginLeft: -12 }} aria-label="Volver" onClick={() => ir(volverA)}>{Icono.atras()}</button>
        <h1 className="titulo-barra">{titulo}</h1>
      </div>
      <AvisoPrueba />
    </header>
  )
}

export function NavPublica({ actual }) {
  const { ir } = useApp()
  const items = [
    ['inicio', 'Inicio', Icono.inicio],
    ['fixture', 'Fixture', Icono.calendario],
    ['categorias', 'Categorías', Icono.personas],
    ['noticias', 'Noticias', Icono.noticias],
    ['mas', 'Más', Icono.mas],
  ]
  return (
    <nav className="nav" aria-label="Secciones">
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

export function Chips({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div className="chips" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={String(o.valor)} type="button" className="chip" aria-pressed={valor === o.valor} onClick={() => onCambio(o.valor)}>
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Segmento({ opciones, valor, onCambio, etiqueta }) {
  return (
    <div className="segmento" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={String(o.valor)} type="button" aria-pressed={valor === o.valor} onClick={() => onCambio(o.valor)}>
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Interruptor({ activo, onCambio, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} className="interruptor" onClick={() => onCambio(!activo)}>
      <span />
    </button>
  )
}

export function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div className={`toast ${toast.tipo === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
      {toast.texto}
    </div>
  )
}

export function TarjetaPartido({ partido, mostrarFecha = false }) {
  const { ir, equipoPorId, categoriaPorId } = useApp()
  const equipo = equipoPorId[partido.equipoId]
  const local = partido.condicion === 'local'
  const res = resultadoSirio(partido)
  return (
    <button type="button" className="partido" onClick={() => ir(`partido-${partido.id}`)}>
      <div className="partido-cabeza">
        <span className="rotulo-verde">{nombreEquipo(equipo, categoriaPorId)}</span>
        {partido.estado === 'jugado' && res ? (
          <span className={`resultado-letra res-${res}`} aria-label={{ G: 'Ganó', E: 'Empató', P: 'Perdió' }[res]}>{res}</span>
        ) : partido.hora ? (
          <span><span className="hora-tachada num">{partido.horaAnterior}</span><span className="hora num">{partido.hora}</span></span>
        ) : (
          <span className="chico suave" style={{ fontWeight: 600 }}>Hora a confirmar</span>
        )}
      </div>
      <span className="rivales num">
        {partido.estado === 'jugado'
          ? local ? `Sirio ${partido.golesSirio} – ${partido.golesRival} ${partido.rival}` : `${partido.rival} ${partido.golesRival} – ${partido.golesSirio} Sirio`
          : local ? `Sirio vs ${partido.rival}` : `${partido.rival} vs Sirio`}
      </span>
      <span className="chico suave">
        {mostrarFecha ? `${partido.fecha ? fechaCorta(partido.fecha) : `Fecha ${partido.ronda || ''} · a confirmar`.replace('  ', ' ')} · ` : ''}{local ? 'Local' : 'Visitante'} · {partido.cancha || 'Cancha a confirmar'}
      </span>
      {partido.horaAnterior && partido.estado === 'programado' ? <span className="insignia insignia-alerta">Cambio de horario</span> : null}
      {partido.estado === 'suspendido' ? <span className="insignia insignia-alerta">Suspendido</span> : null}
      {partido.estado === 'postergado' ? <span className="insignia insignia-alerta">Postergado</span> : null}
    </button>
  )
}

export function agruparPorFecha(partidos) {
  const grupos = []
  for (const p of partidos) {
    const g = grupos.find((x) => x.fecha === p.fecha)
    if (g) g.partidos.push(p)
    else grupos.push({ fecha: p.fecha, partidos: [p] })
  }
  return grupos
}

export function ordenarPartidos(lista, asc = true) {
  return [...lista].sort((a, b) => {
    const k1 = `${a.fecha || '9999-99-99'} ${a.hora || '99:99'} ${String(a.ronda || 0).padStart(3, '0')}`
    const k2 = `${b.fecha || '9999-99-99'} ${b.hora || '99:99'} ${String(b.ronda || 0).padStart(3, '0')}`
    return asc ? k1.localeCompare(k2) : k2.localeCompare(k1)
  })
}

export function TablaPosiciones({ filas }) {
  return (
    <div className="tabla-scroll">
      <table className="tabla-pos">
        <thead>
          <tr>
            <th scope="col">#</th><th scope="col" className="eq">Equipo</th><th scope="col">Pts</th>
            {['PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG'].map((c) => <th key={c} scope="col">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={`${f.pos}-${f.equipo}`} className={/sirio/i.test(f.equipo) ? 'sirio' : undefined}>
              <td className="num">{f.pos}</td>
              <td className="eq">{f.equipo}</td>
              <td className="num pts">{f.pts}</td>
              <td className="num">{f.pj}</td><td className="num">{f.pg}</td><td className="num">{f.pe}</td><td className="num">{f.pp}</td>
              <td className="num">{f.gf}</td><td className="num">{f.gc}</td><td className="num">{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Texto de la posición de Sirio en una tabla, p. ej. "3º · 23 pts".
export function posicionSirioTexto(filas) {
  const f = filaDeSirio(filas)
  return f ? `${f.pos}º · ${f.pts} pts` : null
}
