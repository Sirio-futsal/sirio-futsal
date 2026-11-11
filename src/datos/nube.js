// Conexión con Supabase (la base de datos real del club).
// La clave "publishable" está pensada para ir en la app: lo que cada persona puede
// ver o cambiar lo decide la seguridad por fila de la base (supabase/esquema.sql).
import { createClient } from '@supabase/supabase-js'
import { equiposBase, boletinBase, clubBase } from './ejemplo.js'

export const SUPABASE_URL = 'https://vnsqmoyiepgycwgxvbqs.supabase.co'
export const SUPABASE_CLAVE = 'sb_publishable_ixs_1n9338IiEAGP8vXHUA_KWmhQcMU'

// Con "npm run dev" y "npm run build" la app usa la base real.
// En las pruebas automáticas y en la página de prueba (modo "prueba") usa datos de ejemplo.
export const NUBE_ACTIVA = ['development', 'production'].includes(import.meta.env?.MODE)

let cliente = null
export const sb = () => (cliente ||= createClient(SUPABASE_URL, SUPABASE_CLAVE))

export const idUnico = () => {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function revisar({ data, error }) {
  if (error) throw error
  return data
}

// ---------- Filas de la base <-> objetos de la app ----------
const aPartido = (r) => ({
  id: r.id, equipoId: r.equipo_id, fecha: r.fecha, hora: r.hora, horaAnterior: r.hora_anterior,
  rival: r.rival, condicion: r.condicion, cancha: r.cancha, golesSirio: r.goles_sirio, golesRival: r.goles_rival,
  estado: r.estado, origen: r.origen, ronda: r.ronda ?? null,
})
const dePartido = (p) => ({
  id: p.id, equipo_id: p.equipoId, fecha: p.fecha, hora: p.hora ?? null, hora_anterior: p.horaAnterior ?? null,
  rival: p.rival, condicion: p.condicion, cancha: p.cancha ?? null, goles_sirio: p.golesSirio ?? null,
  goles_rival: p.golesRival ?? null, estado: p.estado, origen: p.origen || 'club',
})
const aNoticia = (r) => ({ id: r.id, categoriaId: r.categoria_id, fecha: r.fecha, destacada: r.destacada, titulo: r.titulo, bajada: r.bajada, texto: r.texto, fotoUrl: r.foto_url || null })
const aJugador = (r) => ({
  id: r.id, equipoId: r.equipo_id, nombre: r.nombre, apellido: r.apellido, dorsal: r.dorsal ?? 0, posicion: r.posicion,
  esMenor: !!r.es_menor,
  autorizacion: { nombre: r.aut_nombre ?? null, imagen: !!r.aut_imagen, fecha: r.aut_fecha ?? null },
})
const aSugerencia = (r) => ({ id: r.id, tipo: r.tipo, partidoId: r.partido_id, golesSirio: r.goles_sirio, golesRival: r.goles_rival, hora: r.hora, fuente: r.fuente })
const aInscripcion = (r) => ({ id: r.id, fecha: r.fecha, jugador: r.jugador, categoria: r.categoria, adulto: r.adulto, telefono: r.telefono, mensaje: r.mensaje })
const aAviso = (r) => ({ id: r.id, tipo: r.tipo, equipoId: r.equipo_id, categoriaId: r.categoria_id, titulo: r.titulo, mensaje: r.mensaje, fecha: r.fecha })

const aEquipo = (r) => ({
  id: r.id, categoriaId: r.categoria_id, nombre: r.nombre, grupo: r.grupo, ...(r.division ? { division: r.division } : {}),
  entrenador: r.entrenador || '', fotoUrl: r.foto_url || null, fotos: r.fotos || [], fotoCargada: !!r.foto_cargada, fotoPublicable: !!r.foto_publicable, fotosAutorizadas: !!r.fotos_autorizadas,
})
const aClub = (r) => ({
  historia: r.historia || '', direccion: r.direccion || '', telefono: r.telefono || '', whatsapp: r.whatsapp || '',
  instagram: r.instagram || '', indumentariaTexto: r.indumentaria_texto || '', indumentariaUrl: r.indumentaria_url || '',
  sponsors: r.sponsors || '', archivo: r.archivo || '',
})
const deClub = (c) => ({
  id: 1, historia: c.historia, direccion: c.direccion, telefono: c.telefono, whatsapp: c.whatsapp, instagram: c.instagram,
  indumentaria_texto: c.indumentariaTexto, indumentaria_url: c.indumentariaUrl, sponsors: c.sponsors, archivo: c.archivo,
})
const aFoto = (r) => ({ id: r.id, titulo: r.titulo || '', categoriaId: r.categoria_id || null, temporada: r.temporada || '', url: r.url })

// Estado mientras todavía no llegó nada de la base (sin datos de ejemplo).
export function estadoVacio(preferencias) {
  return {
    equipos: equiposBase.map((e) => ({ ...e, entrenador: '', fotoUrl: null, fotoCargada: false })),
    partidos: [], noticias: [], jugadores: [], usuarios: [], sugerencias: [], inscripciones: [], avisosEnviados: [],
    boletin: { ...boletinBase, jugadores: [] },
    tablas: [], galeria: [],
    club: Object.fromEntries(Object.keys(clubBase).map((k) => [k, ''])),
    sesion: null,
    preferencias,
  }
}

// Lee todo lo que la persona actual puede ver (la base filtra el resto).
export async function cargarTodo(preferencias) {
  const c = sb()
  const [equiposPub, partidos, noticias, boletin, tablas, club, galeria, sesionRes] = await Promise.all([
    c.from('equipos_publicos').select('*').then(revisar),
    c.from('partidos').select('*').order('fecha').then(revisar),
    c.from('noticias').select('*').order('fecha', { ascending: false }).order('creada', { ascending: false }).then(revisar),
    c.from('boletin').select('*').eq('id', 1).maybeSingle().then(revisar),
    c.from('tablas').select('*').then(revisar),
    c.from('club').select('*').eq('id', 1).maybeSingle().then(revisar),
    c.from('galeria').select('*').order('creada', { ascending: false }).then(revisar),
    c.auth.getSession(),
  ])
  const sesion = sesionRes.data?.session?.user?.id || null

  let equipos = equiposPub.map(aEquipo)
  const jugadores = new Map()
  let usuarios = []
  let sugerencias = []
  let inscripciones = []
  let avisosEnviados = []

  if (sesion) {
    const perfiles = await c.from('profiles').select('*').then(revisar)
    usuarios = perfiles.map((p) => ({ id: p.id, rol: p.rol, nombre: p.nombre, email: p.email, equipos: p.equipos || [], pendiente: false }))
    const yo = usuarios.find((u) => u.id === sesion)
    if (yo) {
      const privados = await c.from('jugadores').select('*').then(revisar)
      privados.forEach((r) => jugadores.set(r.id, aJugador(r)))
      // El personal ve la foto de sus equipos aunque todavía no se pueda publicar.
      const propios = await c.from('equipos').select('id, foto_url, fotos').then(revisar)
      const urls = new Map(propios.map((r) => [r.id, r]))
      equipos = equipos.map((e) => (urls.has(e.id) ? { ...e, fotoUrl: urls.get(e.id).foto_url || null, fotos: urls.get(e.id).fotos || [], fotoCargada: !!urls.get(e.id).foto_url } : e))
      avisosEnviados = (await c.from('avisos_enviados').select('*').order('creado', { ascending: false }).limit(30).then(revisar)).map(aAviso)
      if (yo.rol === 'admin') {
        const [inv, sug, ins] = await Promise.all([
          c.from('invitaciones').select('*').order('creada').then(revisar),
          c.from('sugerencias').select('*').then(revisar),
          c.from('inscripciones').select('*').order('fecha', { ascending: false }).then(revisar),
        ])
        usuarios = [...usuarios, ...inv.map((i) => ({ id: `inv-${i.id}`, rol: 'entrenador', nombre: i.nombre, email: i.email, equipos: i.equipos || [], pendiente: true }))]
        sugerencias = sug.map(aSugerencia)
        inscripciones = ins.map(aInscripcion)
      }
    }
  }

  return {
    equipos,
    partidos: partidos.map(aPartido),
    noticias: noticias.map(aNoticia),
    jugadores: [...jugadores.values()],
    usuarios, sugerencias, inscripciones, avisosEnviados,
    tablas: tablas.map((t) => ({ equipoId: t.equipo_id, filas: t.filas || [], actualizada: t.actualizada, fuente: t.fuente || 'manual' })),
    club: club ? aClub(club) : Object.fromEntries(Object.keys(clubBase).map((k) => [k, ''])),
    galeria: galeria.map(aFoto),
    boletin: boletin ? { numero: boletin.numero, fecha: boletin.fecha, jugadores: boletin.jugadores || [] } : { ...boletinBase, jugadores: [] },
    sesion,
    preferencias,
  }
}

// Acciones que se guardan en la base. `previo` es el estado antes de aplicar la acción.
export const ACCIONES_NUBE = new Set([
  'partido/guardar', 'noticia/crear', 'noticia/editar', 'noticia/eliminar', 'jugador/agregar', 'jugador/autorizacion', 'entrenador/invitar', 'entrenador/equipos',
  'entrenador/quitar', 'sugerencia/aprobar', 'sugerencia/descartar', 'aviso/enviar', 'inscripcion/crear', 'boletin/guardar',
  'equipo/entrenador', 'equipo/foto', 'equipo/fotos', 'tabla/guardar', 'club/guardar', 'galeria/agregar', 'galeria/quitar',
])

const esInvitacion = (id) => String(id).startsWith('inv-')
const idInvitacion = (id) => String(id).slice(4)

export async function escribir(tipo, a, previo) {
  const c = sb()
  switch (tipo) {
    case 'partido/guardar':
      return revisar(await c.from('partidos').upsert(dePartido(a.partido)))
    case 'noticia/crear': {
      const n = a.noticia
      return revisar(await c.from('noticias').insert({ id: n.id, categoria_id: n.categoriaId ?? null, fecha: n.fecha, destacada: !!n.destacada, titulo: n.titulo, bajada: n.bajada || '', texto: n.texto || '', foto_url: n.fotoUrl || null }))
    }
    case 'noticia/editar': {
      const n = a.noticia
      return revisar(await c.from('noticias').update({ categoria_id: n.categoriaId ?? null, titulo: n.titulo, bajada: n.bajada || '', texto: n.texto || '', foto_url: n.fotoUrl || null }).eq('id', n.id))
    }
    case 'noticia/eliminar':
      return revisar(await c.from('noticias').delete().eq('id', a.id))
    case 'jugador/agregar': {
      const j = a.jugador
      return revisar(await c.from('jugadores').insert({
        id: j.id, equipo_id: j.equipoId, nombre: j.nombre, apellido: j.apellido, dorsal: j.dorsal || 0, posicion: j.posicion || '—',
        es_menor: !!j.esMenor, aut_nombre: j.autorizacion?.nombre ?? null, aut_imagen: !!j.autorizacion?.imagen, aut_fecha: j.autorizacion?.fecha ?? null,
      }))
    }
    case 'jugador/autorizacion': {
      const au = a.autorizacion || {}
      return revisar(await c.from('jugadores').update({ aut_nombre: au.nombre ?? null, aut_imagen: !!au.imagen, aut_fecha: au.fecha ?? null }).eq('id', a.jugadorId))
    }
    case 'entrenador/invitar':
      return revisar(await c.from('invitaciones').insert({ id: idInvitacion(a.id), email: a.email.trim().toLowerCase(), nombre: a.nombre, equipos: a.equipos }))
    case 'entrenador/equipos':
      return revisar(esInvitacion(a.usuarioId)
        ? await c.from('invitaciones').update({ equipos: a.equipos }).eq('id', idInvitacion(a.usuarioId))
        : await c.from('profiles').update({ equipos: a.equipos }).eq('id', a.usuarioId))
    case 'entrenador/quitar':
      return revisar(esInvitacion(a.usuarioId)
        ? await c.from('invitaciones').delete().eq('id', idInvitacion(a.usuarioId))
        : await c.from('profiles').delete().eq('id', a.usuarioId))
    case 'sugerencia/aprobar': {
      const sug = previo.sugerencias.find((x) => x.id === a.sugerenciaId)
      const p = sug && previo.partidos.find((x) => x.id === sug.partidoId)
      if (!sug || !p) return null
      const nuevo = sug.tipo === 'resultado'
        ? { ...p, golesSirio: sug.golesSirio, golesRival: sug.golesRival, estado: 'jugado', origen: 'arf' }
        : { ...p, horaAnterior: p.hora, hora: sug.hora, origen: 'arf' }
      revisar(await c.from('partidos').upsert(dePartido(nuevo)))
      return revisar(await c.from('sugerencias').delete().eq('id', sug.id))
    }
    case 'sugerencia/descartar':
      return revisar(await c.from('sugerencias').delete().eq('id', a.sugerenciaId))
    case 'aviso/enviar': {
      const v = a.aviso
      return revisar(await c.from('avisos_enviados').insert({ id: v.id, tipo: v.tipo, equipo_id: v.equipoId ?? null, categoria_id: v.categoriaId ?? null, titulo: v.titulo, mensaje: v.mensaje, fecha: v.fecha }))
    }
    case 'inscripcion/crear': {
      const i = a.inscripcion
      return revisar(await c.from('inscripciones').insert({ id: i.id, fecha: i.fecha, jugador: i.jugador, categoria: i.categoria, adulto: i.adulto, telefono: i.telefono, mensaje: i.mensaje || '' }))
    }
    case 'boletin/guardar': {
      const b = a.boletin
      return revisar(await c.from('boletin').upsert({ id: 1, numero: b.numero, fecha: b.fecha, jugadores: b.jugadores }))
    }
    case 'equipo/entrenador':
      return revisar(await c.from('equipos').update({ entrenador: a.entrenador.trim() || null }).eq('id', a.equipoId))
    case 'equipo/fotos':
      return revisar(await c.from('equipos').update({ fotos: a.fotos || [], foto_url: (a.fotos || [])[0] || null, foto_cargada: (a.fotos || []).length > 0, fotos_autorizadas: (a.fotos || []).length > 0 }).eq('id', a.equipoId))
    case 'equipo/foto':
      return revisar(await c.from('equipos').update({ foto_url: a.url || null, foto_cargada: !!a.url }).eq('id', a.equipoId))
    case 'tabla/guardar':
      return revisar(await c.from('tablas').upsert({ equipo_id: a.equipoId, filas: a.filas, actualizada: a.actualizada, fuente: 'manual' }))
    case 'club/guardar':
      return revisar(await c.from('club').upsert(deClub(a.club)))
    case 'galeria/agregar': {
      const f = a.foto
      return revisar(await c.from('galeria').insert({ id: f.id, titulo: f.titulo || '', categoria_id: f.categoriaId || null, temporada: f.temporada || '', url: f.url }))
    }
    case 'galeria/quitar': {
      const f = (previo.galeria || []).find((x) => x.id === a.fotoId)
      revisar(await c.from('galeria').delete().eq('id', a.fotoId))
      if (f) await borrarImagen(f.url)
      return null
    }
    default:
      return null
  }
}

// ---------- Imágenes (almacén "imagenes" de Supabase) ----------
async function reducirImagen(archivo, maximo = 1600) {
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, maximo / Math.max(bmp.width, bmp.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(bmp.width * escala)
  lienzo.height = Math.round(bmp.height * escala)
  lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height)
  const blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.82))
  if (!blob) throw new Error('No se pudo procesar la imagen.')
  return blob
}

// Sube una foto (la achica antes) y devuelve su dirección pública.
export async function subirImagen(archivo, carpeta) {
  if (!NUBE_ACTIVA) throw new Error('Subir fotos funciona con la base real, no en la versión de prueba.')
  if (!archivo || !/^image\//.test(archivo.type)) throw new Error('Elegí un archivo de imagen (JPG o PNG).')
  const blob = await reducirImagen(archivo)
  const ruta = `${carpeta}/${idUnico()}.jpg`
  const { error } = await sb().storage.from('imagenes').upload(ruta, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  return sb().storage.from('imagenes').getPublicUrl(ruta).data.publicUrl
}

export async function borrarImagen(url) {
  const ruta = String(url || '').split('/imagenes/')[1]
  if (!ruta) return
  try { await sb().storage.from('imagenes').remove([decodeURIComponent(ruta)]) } catch { /* si no se pudo borrar el archivo, no pasa nada grave */ }
}

// ---------- Ingreso ----------
const traducir = (e) => {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Falta confirmar el email. Revisá tu casilla.'
  if (m.includes('already registered')) return 'Ese email ya tiene cuenta. Probá ingresar.'
  if (m.includes('password')) return 'La contraseña tiene que tener al menos 8 caracteres.'
  return e?.message || 'No se pudo completar la operación.'
}

export async function iniciarSesion(email, clave) {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: clave })
  if (error) throw new Error(traducir(error))
}

export async function crearCuenta(email, clave) {
  const { data, error } = await sb().auth.signUp({ email: email.trim(), password: clave })
  if (error) throw new Error(traducir(error))
  return { requiereConfirmar: !data.session }
}

export const cerrarSesion = () => sb().auth.signOut()
