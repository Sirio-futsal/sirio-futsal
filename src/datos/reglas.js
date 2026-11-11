// Reglas de permisos y privacidad.
// En la versión de prueba se aplican en el navegador; en la versión real
// las mismas reglas se escriben en la base de datos (seguridad por fila de
// Supabase), así nadie puede saltearlas desde afuera de la app.

export const esAdmin = (u) => !!u && u.rol === 'admin'

export function puedeEditarEquipo(usuario, equipoId) {
  if (!usuario) return false
  if (esAdmin(usuario)) return true
  return usuario.rol === 'entrenador' && !usuario.pendiente && usuario.equipos.includes(equipoId)
}

export function equiposEditables(usuario, equipos) {
  return equipos.filter((e) => puedeEditarEquipo(usuario, e.id))
}

// Noticias: la administradora publica en cualquier categoría o "todo el club";
// un entrenador solo en las categorías donde tiene algún equipo.
export function puedePublicarEnCategoria(usuario, categoriaId, equipos) {
  if (esAdmin(usuario)) return true
  if (!usuario || usuario.rol !== 'entrenador' || usuario.pendiente || categoriaId == null) return false
  return equipos.some((e) => e.categoriaId === categoriaId && usuario.equipos.includes(e.id))
}

// Solo la administradora: autorizaciones, entrenadores, inscripciones,
// sugerencias de la Rosarina, avisos generales y copia de seguridad.
export const puedeGestionarAutorizaciones = esAdmin
export const puedeGestionarEntrenadores = esAdmin
export const puedeVerInscripciones = esAdmin
export const puedeAprobarSugerencias = esAdmin
export const puedeEnviarAvisoGeneral = esAdmin

export function puedeEnviarAvisoDeEquipo(usuario, equipoId) {
  return puedeEditarEquipo(usuario, equipoId)
}

// ---------- Privacidad ----------

export function jugadorVisible(j) {
  return !!j.autorizacion && (j.autorizacion.nombre === 'corto' || j.autorizacion.nombre === 'completo')
}

export function nombrePublico(j) {
  if (!jugadorVisible(j)) return null
  if (j.autorizacion.nombre === 'completo') return `${j.nombre} ${j.apellido}`
  return `${j.nombre} ${j.apellido.charAt(0)}.`
}

export function puedeAparecerEnFotos(j) {
  return jugadorVisible(j) && j.autorizacion.imagen === true
}

// La foto grupal se publica solo si está cargada y TODOS los jugadores
// del equipo tienen autorización de imagen.
export function fotoEquipoPublicable(equipo, jugadoresDelEquipo) {
  // Con la base real, la base ya calculó si todos autorizaron la imagen.
  if (typeof equipo.fotoPublicable === 'boolean') return !!equipo.fotoCargada && equipo.fotoPublicable
  return !!equipo.fotoCargada && jugadoresDelEquipo.length > 0 && jugadoresDelEquipo.every(puedeAparecerEnFotos)
}

// ---------- Utilidades de partidos ----------

export function resultadoSirio(p) {
  if (p.estado !== 'jugado' || p.golesSirio == null || p.golesRival == null) return null
  if (p.golesSirio > p.golesRival) return 'G'
  if (p.golesSirio < p.golesRival) return 'P'
  return 'E'
}

export function partidoSinResultado(p, hoyISO) {
  return p.estado === 'programado' && p.fecha < hoyISO
}

// ---------- Jugadores en boletín (Tribunal Disciplinario de la Rosarina) ----------

// Solo la administradora carga el boletín de la semana.
export const puedeCargarBoletin = esAdmin

// Convierte el texto pegado (uno por línea) en una lista limpia, sin repetidos.
export function parsearJugadoresBoletin(texto) {
  const vistos = new Set()
  return String(texto || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => {
      const k = l.toLowerCase()
      if (!l || vistos.has(k)) return false
      vistos.add(k)
      return true
    })
}
