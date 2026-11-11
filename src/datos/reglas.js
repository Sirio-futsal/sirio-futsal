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

// ---------- Contenido del club (solo la administradora) ----------

export const puedeEditarContenidoClub = esAdmin

// ---------- Tablas de posiciones ----------

// Convierte la tabla copiada de rosariofutbol.com en filas.
// Acepta: [pos] Equipo PJ PG PE PP GF GC DG Puntos  (DG puede faltar; se calcula).
// Las columnas pueden venir separadas por tabulaciones o espacios.
export function parsearTabla(texto) {
  const esNum = (t) => /^[+-]?\d+$/.test(t)
  const filas = []
  for (const linea of String(texto || '').split(/\r?\n/)) {
    const partes = linea.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    // Las últimas 8 columnas son PJ PG PE PP GF GC DG Puntos; si falta DG, las últimas 7.
    let n = 0
    if (partes.length >= 9 && partes.slice(-8).every(esNum)) n = 8
    else if (partes.length >= 8 && partes.slice(-7).every(esNum)) n = 7
    if (!n) continue
    const nums = partes.slice(-n).map(Number)
    let nombre = partes.slice(0, -n)
    let pos = null
    if (nombre.length > 1 && /^\d+$/.test(nombre[0])) {
      pos = Number(nombre[0])
      nombre = nombre.slice(1)
    }
    const equipo = nombre.join(' ').trim()
    if (!equipo) continue
    const [pj, pg, pe, pp, gf, gc] = nums
    const dg = n === 8 ? nums[6] : gf - gc
    filas.push({ pos, equipo, pj, pg, pe, pp, gf, gc, dg, pts: nums[n - 1] })
  }
  return filas.map((f, k) => ({ ...f, pos: f.pos ?? k + 1 }))
}

// Fila de Sirio dentro de una tabla (el nombre del equipo contiene "sirio").
export function filaDeSirio(filas) {
  return (filas || []).find((f) => /sirio/i.test(f.equipo)) || null
}

// "Nombre | https://link" por línea (el link es opcional).
export function parsearSponsors(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [nombre, url] = l.split('|').map((x) => x.trim())
      return { nombre, url: /^https?:\/\//i.test(url || '') ? url : '' }
    })
    .filter((s) => s.nombre)
}

// Una línea por renglón, sin vacías.
export function parsearLineas(texto) {
  return String(texto || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
}

// Enlace de WhatsApp: se escribe el número con código de área, sin 0 ni 15 (ej. 341 555 1234).
export function enlaceWhatsapp(numero) {
  let d = String(numero || '').replace(/\D/g, '').replace(/^0+/, '')
  if (d.length < 8) return ''
  if (!d.startsWith('54')) d = `549${d}`
  return `https://wa.me/${d}`
}

// Foto del día: con varias fotos cargadas, cada equipo muestra una distinta cada 24 hs (rota sola según la fecha).
export function fotoDelDia(equipo, hoyISO) {
  const pool = [...new Set([equipo.fotoUrl, ...(equipo.fotos || [])].filter(Boolean))]
  if (!pool.length) return null
  const dias = Math.floor(Date.parse(`${hoyISO}T00:00:00Z`) / 86400000)
  const desfase = [...String(equipo.id)].reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return pool[(dias + desfase) % pool.length]
}

// Encuadre de una foto de noticia: "x% y% zoom" (ej. "50% 30% 1.4"). Devuelve el estilo para <img> con object-fit: cover.
export function estiloFoto(pos) {
  const [x, y, z] = String(pos || '').split(' ').map((v) => parseFloat(v))
  const px = Number.isFinite(x) ? x : 50
  const py = Number.isFinite(y) ? y : 50
  const zoom = Number.isFinite(z) && z >= 1 ? z : 1
  return { objectFit: 'cover', objectPosition: `${px}% ${py}%`, transformOrigin: `${px}% ${py}%`, ...(zoom > 1 ? { transform: `scale(${zoom})` } : {}) }
}

// Categorías de Sirio a las que corresponde una nota de prensa, según lo que se detectó en el texto.
export function categoriasDeNota(nota) {
  const m = nota.menciones || []
  if (!nota.sirio) return []
  const out = new Set()
  const fem = m.includes('Femenino') || m.includes('Sub-14')
  if (fem) out.add('fem-b')
  if (m.includes('Veteranos')) out.add('veteranos')
  if (m.includes('Sirio B')) out.add('masc-b')
  if (m.includes('Primera A')) out.add('masc-a')
  if (m.includes('Primera B') && !fem) out.add('masc-b')
  const inferiores = m.some((x) => ['Reserva', '4ta', '5ta', '6ta', '7ma', '8va', '9na'].includes(x))
  if ((inferiores || m.includes('Primera')) && !fem && !m.includes('Sirio B') && !m.includes('Primera B')) out.add('masc-a')
  return [...out]
}

export const puedeCargarProgramacion = esAdmin

// Partidos de Sirio que salen de la planilla de playoffs. Se suman a los del fixture
// sin tocar los datos que baja la Asociación: si ya existe uno real para ese equipo y día, se usa el real.
export function partidosDePlayoff(filas, partidos) {
  return (filas || [])
    .filter((f) => f.tipo === 'partido' && f.equipoId && f.fecha)
    .filter((f) => !partidos.some((p) => p.id === `po-${f.id}` || (p.equipoId === f.equipoId && p.fecha === f.fecha && !p.derivado)))
    .map((f) => ({
      id: `po-${f.id}`, equipoId: f.equipoId, fecha: f.fecha, hora: f.hora || null, horaAnterior: null,
      rival: f.condicion === 'local' ? f.visitante : f.local, condicion: f.condicion, cancha: f.cancha || null,
      golesSirio: null, golesRival: null, estado: 'programado', origen: 'playoff', ronda: null, derivado: true, instancia: f.instancia,
    }))
}

// La web de la Asociación a veces trae los nombres con códigos (&ordm;, &Aacute;): se muestran como corresponde.
const ENTIDADES = { ordm: 'º', ordf: 'ª', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', amp: '&', quot: '"', apos: "'", nbsp: ' ' }
export function limpiarNombre(t) {
  if (typeof t !== 'string' || !t.includes('&')) return typeof t === 'string' ? t.replace(/\b1\s*[º°]\s*de mayo\b/i, '1ro de Mayo') : t
  const x = t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTIDADES[n] ?? m)
  return x.replace(/\b1\s*[º°]\s*de mayo\b/i, '1ro de Mayo')
}
