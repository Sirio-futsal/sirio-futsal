import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { estadoInicial, categorias, fechaISO } from './datos/ejemplo.js'
import * as R from './datos/reglas.js'
import { NUBE_ACTIVA, ACCIONES_NUBE, cargarTodo, escribir, estadoVacio, cerrarSesion, idUnico, sb } from './datos/nube.js'

// Versión de prueba: los cambios se guardan solo en este navegador.
// En la versión real se guardan en la base de datos y los ve todo el mundo.
const CLAVE = 'sirio-futsal-prueba-v1'

function estadoGuardadoOInicial() {
  const g = leerGuardado()
  if (!g) return estadoInicial()
  const base = estadoInicial()
  return {
    ...g,
    boletin: g.boletin || base.boletin,
    tablas: g.tablas || base.tablas,
    club: g.club || base.club,
    galeria: g.galeria || [],
    equipos: g.equipos.map((e) => ({ entrenador: '', fotoUrl: null, ...e })),
  }
}

// Con la base real, en este navegador solo se guardan las preferencias de avisos.
function preferenciasGuardadas() {
  return leerGuardado()?.preferencias || estadoInicial().preferencias
}

function leerGuardado() {
  try {
    const t = window.localStorage.getItem(CLAVE)
    return t ? JSON.parse(t) : null
  } catch {
    return null
  }
}
function guardar(estado) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(NUBE_ACTIVA ? { preferencias: estado.preferencias } : estado))
  } catch {
    /* sin almacenamiento: la app sigue funcionando en memoria */
  }
}

let contadorId = 0
const nuevoId = (prefijo) => (NUBE_ACTIVA ? idUnico() : `${prefijo}-${Date.now().toString(36)}-${(contadorId++).toString(36)}`)

// Con la base real la foto del equipo se publica solo si todos sus jugadores autorizaron su imagen.
function conFotoRecalculada(s, equipoId) {
  const delEquipo = s.jugadores.filter((j) => j.equipoId === equipoId)
  const publicable = delEquipo.length > 0 && delEquipo.every(R.puedeAparecerEnFotos)
  return { ...s, equipos: s.equipos.map((e) => (e.id === equipoId && typeof e.fotoPublicable === 'boolean' ? { ...e, fotoPublicable: !!e.fotoCargada && publicable } : e)) }
}

function reductor(s, a) {
  switch (a.tipo) {
    case 'cargar':
      return { ...a.estado, preferencias: s.preferencias }
    case 'ingresar':
      return { ...s, sesion: a.usuarioId }
    case 'salir':
      return { ...s, sesion: null }
    case 'partido/guardar': {
      const existe = s.partidos.some((p) => p.id === a.partido.id)
      const partidos = existe
        ? s.partidos.map((p) => (p.id === a.partido.id ? a.partido : p))
        : [...s.partidos, { ...a.partido, id: a.partido.id && a.partido.id !== '__nuevo__' ? a.partido.id : nuevoId('p') }]
      return { ...s, partidos }
    }
    case 'noticia/crear':
      return { ...s, noticias: [{ ...a.noticia, id: a.noticia.id || nuevoId('n') }, ...s.noticias] }
    case 'jugador/agregar': {
      const nuevo = { ...s, jugadores: [...s.jugadores, { ...a.jugador, id: a.jugador.id || nuevoId('j') }] }
      return conFotoRecalculada(nuevo, a.jugador.equipoId)
    }
    case 'jugador/autorizacion': {
      const j = s.jugadores.find((x) => x.id === a.jugadorId)
      const nuevo = { ...s, jugadores: s.jugadores.map((x) => (x.id === a.jugadorId ? { ...x, autorizacion: a.autorizacion } : x)) }
      return j ? conFotoRecalculada(nuevo, j.equipoId) : nuevo
    }
    case 'equipo/entrenador':
      return { ...s, equipos: s.equipos.map((e) => (e.id === a.equipoId ? { ...e, entrenador: a.entrenador } : e)) }
    case 'equipo/foto': {
      const nuevo = { ...s, equipos: s.equipos.map((e) => (e.id === a.equipoId ? { ...e, fotoUrl: a.url || null, fotoCargada: !!a.url, ...(typeof e.fotoPublicable === 'boolean' ? { fotoPublicable: false } : {}) } : e)) }
      return conFotoRecalculada(nuevo, a.equipoId)
    }
    case 'equipo/fotos': {
      const fotos = a.fotos || []
      const nuevo = { ...s, equipos: s.equipos.map((e) => (e.id === a.equipoId ? { ...e, fotos, fotoUrl: fotos[0] || null, fotoCargada: fotos.length > 0, ...(typeof e.fotoPublicable === 'boolean' ? { fotoPublicable: false } : {}) } : e)) }
      return conFotoRecalculada(nuevo, a.equipoId)
    }
    case 'tabla/guardar': {
      const otras = (s.tablas || []).filter((t) => t.equipoId !== a.equipoId)
      return { ...s, tablas: [...otras, { equipoId: a.equipoId, filas: a.filas, actualizada: a.actualizada, fuente: 'manual' }] }
    }
    case 'club/guardar':
      return { ...s, club: a.club }
    case 'galeria/agregar':
      return { ...s, galeria: [{ ...a.foto, id: a.foto.id || nuevoId('g') }, ...(s.galeria || [])] }
    case 'galeria/quitar':
      return { ...s, galeria: (s.galeria || []).filter((f) => f.id !== a.fotoId) }
    case 'entrenador/invitar':
      return {
        ...s,
        usuarios: [...s.usuarios, { id: a.id || nuevoId('e'), rol: 'entrenador', nombre: a.nombre, email: a.email, equipos: a.equipos, pendiente: true }],
      }
    case 'entrenador/equipos':
      return { ...s, usuarios: s.usuarios.map((u) => (u.id === a.usuarioId ? { ...u, equipos: a.equipos } : u)) }
    case 'entrenador/quitar':
      return { ...s, usuarios: s.usuarios.filter((u) => u.id !== a.usuarioId) }
    case 'sugerencia/aprobar': {
      const sug = s.sugerencias.find((x) => x.id === a.sugerenciaId)
      if (!sug) return s
      const partidos = s.partidos.map((p) => {
        if (p.id !== sug.partidoId) return p
        if (sug.tipo === 'resultado') return { ...p, golesSirio: sug.golesSirio, golesRival: sug.golesRival, estado: 'jugado', origen: 'arf' }
        return { ...p, horaAnterior: p.hora, hora: sug.hora, origen: 'arf' }
      })
      return { ...s, partidos, sugerencias: s.sugerencias.filter((x) => x.id !== sug.id) }
    }
    case 'sugerencia/descartar':
      return { ...s, sugerencias: s.sugerencias.filter((x) => x.id !== a.sugerenciaId) }
    case 'aviso/enviar':
      return { ...s, avisosEnviados: [{ ...a.aviso, id: a.aviso.id || nuevoId('a') }, ...s.avisosEnviados] }
    case 'boletin/guardar':
      return { ...s, boletin: a.boletin }
    case 'inscripcion/crear':
      return { ...s, inscripciones: [{ ...a.inscripcion, id: a.inscripcion.id || nuevoId('i') }, ...s.inscripciones] }
    case 'preferencias':
      return { ...s, preferencias: { ...s.preferencias, ...a.cambios } }
    case 'restablecer':
      return estadoInicial()
    default:
      return s
  }
}

// Cada acción pasa por la misma regla que después aplicará la base de datos.
function permiso(tipo, datos, usuario, estado) {
  switch (tipo) {
    case 'partido/guardar': {
      const anterior = estado.partidos.find((p) => p.id === datos.partido.id)
      const ok = R.puedeEditarEquipo(usuario, datos.partido.equipoId) && (!anterior || R.puedeEditarEquipo(usuario, anterior.equipoId))
      return ok || 'Tu usuario no tiene permiso para cargar partidos de ese equipo.'
    }
    case 'noticia/crear':
      return R.puedePublicarEnCategoria(usuario, datos.noticia.categoriaId, estado.equipos) || 'Tu usuario no puede publicar en esa categoría.'
    case 'jugador/agregar':
      return R.puedeEditarEquipo(usuario, datos.jugador.equipoId) || 'Tu usuario no puede editar el plantel de ese equipo.'
    case 'jugador/autorizacion':
      return R.puedeGestionarAutorizaciones(usuario) || 'Solo la administradora puede cambiar autorizaciones.'
    case 'entrenador/invitar':
    case 'entrenador/equipos':
    case 'entrenador/quitar':
      return R.puedeGestionarEntrenadores(usuario) || 'Solo la administradora gestiona entrenadores.'
    case 'sugerencia/aprobar':
    case 'sugerencia/descartar':
      return R.puedeAprobarSugerencias(usuario) || 'Solo la administradora aprueba datos de la Rosarina.'
    case 'aviso/enviar':
      if (datos.aviso.equipoId) return R.puedeEnviarAvisoDeEquipo(usuario, datos.aviso.equipoId) || 'No podés enviar avisos de ese equipo.'
      return R.puedeEnviarAvisoGeneral(usuario) || 'Solo la administradora envía avisos generales.'
    case 'boletin/guardar':
      return R.puedeCargarBoletin(usuario) || 'Solo la administradora carga el boletín.'
    case 'equipo/entrenador':
    case 'equipo/foto':
    case 'equipo/fotos':
    case 'tabla/guardar':
    case 'club/guardar':
    case 'galeria/agregar':
    case 'galeria/quitar':
      return R.puedeEditarContenidoClub(usuario) || 'Solo la administradora edita este contenido.'
    case 'restablecer':
      if (NUBE_ACTIVA) return 'Con la base real no se restablecen los datos.'
      return R.esAdmin(usuario) || 'Solo la administradora puede restablecer los datos de prueba.'
    default:
      return true
  }
}

// Cada cosa nueva nace con su identificador, así la app y la base usan el mismo.
function conIds(tipo, d) {
  switch (tipo) {
    case 'partido/guardar': return d.partido.id === '__nuevo__' ? { ...d, partido: { ...d.partido, id: nuevoId('p') } } : d
    case 'noticia/crear': return { ...d, noticia: { ...d.noticia, id: d.noticia.id || nuevoId('n') } }
    case 'jugador/agregar': return { ...d, jugador: { ...d.jugador, id: d.jugador.id || nuevoId('j') } }
    case 'aviso/enviar': return { ...d, aviso: { ...d.aviso, id: d.aviso.id || nuevoId('a') } }
    case 'galeria/agregar': return { ...d, foto: { ...d.foto, id: d.foto.id || nuevoId('g') } }
    case 'inscripcion/crear': return { ...d, inscripcion: { ...d.inscripcion, id: d.inscripcion.id || nuevoId('i') } }
    case 'entrenador/invitar': return { ...d, id: d.id || `inv-${idUnico()}` }
    default: return d
  }
}

const Ctx = createContext(null)

function vistaDesdeHash() {
  try {
    const h = window.location.hash.replace(/^#/, '')
    return /^[a-z0-9-]+$/.test(h) ? h : 'inicio'
  } catch {
    return 'inicio'
  }
}

export function ProveedorApp({ children }) {
  const [estado, despachar] = useReducer(reductor, null, () => (NUBE_ACTIVA ? estadoVacio(preferenciasGuardadas()) : estadoGuardadoOInicial()))
  const [vista, setVista] = useState(vistaDesdeHash)
  const [toast, setToast] = useState(null)
  const temporizador = useRef(null)

  useEffect(() => guardar(estado), [estado])

  useEffect(() => {
    const alCambiar = () => {
      setVista(vistaDesdeHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const ir = useCallback((v) => {
    try {
      if (window.location.hash === `#${v}`) return
      window.location.hash = v
    } catch {
      setVista(v)
    }
    setVista(v)
    window.scrollTo(0, 0)
  }, [])

  const mostrarToast = useCallback((texto, tipo = 'ok') => {
    setToast({ texto, tipo })
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setToast(null), tipo === 'error' ? 5000 : 3500)
  }, [])

  // Con la base real: carga todo al abrir y cada vez que alguien entra o sale.
  const estadoRef = useRef(estado)
  estadoRef.current = estado
  const recargar = useCallback(async () => {
    if (!NUBE_ACTIVA) return
    try {
      despachar({ tipo: 'cargar', estado: await cargarTodo(estadoRef.current.preferencias) })
    } catch (e) {
      mostrarToast('No se pudo conectar con el servidor. Probá de nuevo en un rato.', 'error')
    }
  }, [mostrarToast])

  useEffect(() => {
    if (!NUBE_ACTIVA) return undefined
    recargar()
    const { data } = sb().auth.onAuthStateChange(() => { setTimeout(recargar, 0) })
    return () => data.subscription.unsubscribe()
  }, [recargar])

  const usuario = estado.sesion ? estado.usuarios.find((u) => u.id === estado.sesion) || null : null

  const ejecutar = useCallback(
    (tipo, datosOriginales = {}) => {
      const datos = conIds(tipo, datosOriginales)
      const r = permiso(tipo, datos, usuario, estado)
      if (r !== true) {
        mostrarToast(r, 'error')
        return false
      }
      despachar({ tipo, ...datos })
      if (NUBE_ACTIVA) {
        if (tipo === 'salir') cerrarSesion()
        else if (ACCIONES_NUBE.has(tipo)) {
          escribir(tipo, datos, estado).catch((e) => {
            mostrarToast(`No se pudo guardar: ${e?.message || 'error de conexión'}`, 'error')
            recargar()
          })
        }
      }
      return true
    },
    [usuario, estado, mostrarToast, recargar],
  )

  const hoyISO = useMemo(() => fechaISO(new Date(), 0), [])

  const valor = useMemo(() => {
    const equipoPorId = Object.fromEntries(estado.equipos.map((e) => [e.id, e]))
    const categoriaPorId = Object.fromEntries(categorias.map((c) => [c.id, c]))
    return { estado, usuario, ejecutar, vista, ir, toast, mostrarToast, hoyISO, equipoPorId, categoriaPorId, categorias, recargar }
  }, [estado, usuario, ejecutar, vista, ir, toast, mostrarToast, hoyISO, recargar])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export const useApp = () => useContext(Ctx)
