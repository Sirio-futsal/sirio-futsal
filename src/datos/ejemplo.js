// Datos de ejemplo para la versión de prueba.
// Rivales, fechas, resultados, nombres y noticias son ILUSTRATIVOS.
// En la versión real estos datos viven en la base de datos (Supabase).

export const DIVISIONES = ['4ta', '5ta', '6ta', '7ma', '8va', '9na']

export const categorias = [
  { id: 'masc-a', nombre: 'Masculino A', corto: 'Masc. A', conFixture: true },
  { id: 'masc-b', nombre: 'Masculino B', corto: 'Masc. B', conFixture: true },
  { id: 'fem-b', nombre: 'Femenino B', corto: 'Fem. B', conFixture: true },
  { id: 'veteranos', nombre: 'Veteranos', corto: 'Veteranos', conFixture: true },
  { id: 'escuelita', nombre: 'Escuelita', corto: 'Escuelita', conFixture: false },
]

function equiposMasculinos(cat) {
  return [
    { id: `${cat}-primera`, categoriaId: cat, nombre: 'Primera', grupo: 'primera' },
    { id: `${cat}-reserva`, categoriaId: cat, nombre: 'Reserva', grupo: 'reserva' },
    ...DIVISIONES.map((d) => ({
      id: `${cat}-inf-${d}`,
      categoriaId: cat,
      nombre: `Inferiores ${d}`,
      grupo: 'inferiores',
      division: d,
    })),
  ]
}

export const equiposBase = [
  ...equiposMasculinos('masc-a'),
  ...equiposMasculinos('masc-b'),
  { id: 'fem-b-primera', categoriaId: 'fem-b', nombre: 'Primera', grupo: 'primera' },
  { id: 'fem-b-sub14', categoriaId: 'fem-b', nombre: 'Inferiores Sub-14', grupo: 'inferiores', division: 'Sub-14' },
  { id: 'veteranos', categoriaId: 'veteranos', nombre: 'Veteranos', grupo: 'primera' },
  { id: 'escuelita', categoriaId: 'escuelita', nombre: 'Escuelita', grupo: 'escuelita' },
].map((e) => ({
  ...e,
  entrenador: ['masc-a-primera', 'fem-b-primera'].includes(e.id) ? 'Nombre del entrenador (ejemplo)' : '',
  fotoUrl: null,
  fotoCargada: ['masc-a-primera', 'fem-b-primera', 'fem-b-sub14'].includes(e.id),
}))

const LOCAL = 'Gimnasio de Sirio (ejemplo)'
const VISITA = 'Cancha del rival (ejemplo)'

// d = días desde hoy (negativo: ya se jugó)
const partidosBase = [
  { id: 'p1', equipoId: 'masc-a-primera', d: -6, hora: '16:00', rival: 'Rival C', condicion: 'visitante', gs: 3, gr: 3 },
  { id: 'p2', equipoId: 'fem-b-primera', d: -6, hora: '18:00', rival: 'Rival B', condicion: 'local', gs: 4, gr: 2 },
  { id: 'p3', equipoId: 'masc-b-reserva', d: -7, hora: '19:00', rival: 'Rival D', condicion: 'local', gs: 1, gr: 2 },
  { id: 'p4', equipoId: 'masc-a-inf-5ta', d: -5, hora: '10:00', rival: 'Rival E', condicion: 'local', gs: 2, gr: 0 },
  { id: 'p5', equipoId: 'fem-b-sub14', d: -5, hora: '11:30', rival: 'Rival F', condicion: 'visitante', gs: 1, gr: 1 },
  { id: 'p18', equipoId: 'veteranos', d: -8, hora: '21:00', rival: 'Rival M', condicion: 'visitante', gs: 2, gr: 5 },
  { id: 'p19', equipoId: 'masc-a-reserva', d: -6, hora: '14:30', rival: 'Rival C', condicion: 'visitante', gs: 2, gr: 1 },
  { id: 'p20', equipoId: 'masc-a-reserva', d: -1, hora: '20:00', rival: 'Rival N', condicion: 'local' },
  { id: 'p21', equipoId: 'masc-a-inf-8va', d: -1, hora: '18:00', rival: 'Rival O', condicion: 'visitante' },
  { id: 'p6', equipoId: 'masc-a-reserva', d: 2, hora: '14:30', rival: 'Rival A', condicion: 'local' },
  { id: 'p7', equipoId: 'masc-a-primera', d: 2, hora: '16:00', rival: 'Rival A', condicion: 'local' },
  { id: 'p8', equipoId: 'fem-b-primera', d: 2, hora: '18:30', horaAnterior: '17:30', rival: 'Rival E', condicion: 'visitante' },
  { id: 'p11', equipoId: 'masc-b-primera', d: 2, hora: '20:00', rival: 'Rival H', condicion: 'visitante' },
  { id: 'p12', equipoId: 'masc-b-reserva', d: 2, hora: '18:00', rival: 'Rival H', condicion: 'visitante' },
  { id: 'p9', equipoId: 'masc-a-inf-5ta', d: 3, hora: '11:00', horaAnterior: '10:00', rival: 'Rival F', condicion: 'visitante' },
  { id: 'p10', equipoId: 'masc-a-inf-7ma', d: 3, hora: null, rival: 'Rival G', condicion: 'local', sinCancha: true },
  { id: 'p13', equipoId: 'masc-b-inf-6ta', d: 3, hora: '09:30', rival: 'Rival I', condicion: 'local' },
  { id: 'p14', equipoId: 'fem-b-sub14', d: 3, hora: '10:30', rival: 'Rival J', condicion: 'local' },
  { id: 'p15', equipoId: 'veteranos', d: 1, hora: '21:00', rival: 'Rival K', condicion: 'local' },
  { id: 'p16', equipoId: 'masc-a-primera', d: 9, hora: '16:00', rival: 'Rival L', condicion: 'visitante' },
  { id: 'p17', equipoId: 'masc-a-reserva', d: 9, hora: '14:30', rival: 'Rival L', condicion: 'visitante' },
]

export function fechaISO(base, dias) {
  const f = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias)
  const m = String(f.getMonth() + 1).padStart(2, '0')
  const d = String(f.getDate()).padStart(2, '0')
  return `${f.getFullYear()}-${m}-${d}`
}

export function crearPartidos(hoy = new Date()) {
  return partidosBase.map((p) => {
    const jugado = typeof p.gs === 'number'
    return {
      id: p.id,
      equipoId: p.equipoId,
      fecha: fechaISO(hoy, p.d),
      hora: p.hora,
      horaAnterior: p.horaAnterior || null,
      rival: p.rival,
      condicion: p.condicion,
      cancha: p.sinCancha ? null : p.condicion === 'local' ? LOCAL : VISITA,
      golesSirio: jugado ? p.gs : null,
      golesRival: jugado ? p.gr : null,
      estado: jugado ? 'jugado' : 'programado',
      origen: 'club',
    }
  })
}

export function crearNoticias(hoy = new Date()) {
  return [
    {
      id: 'n1', categoriaId: null, fecha: fechaISO(hoy, -2), destacada: true,
      titulo: 'Inscripciones abiertas para todas las categorías',
      bajada: 'Desde Escuelita hasta Primera, dejá tus datos en la sección Más y te contactamos.',
      texto: 'Texto completo de la nota de ejemplo. En la versión real, la administradora o los entrenadores escriben acá la novedad y eligen a qué categoría corresponde.',
    },
    {
      id: 'n2', categoriaId: 'fem-b', fecha: fechaISO(hoy, -4), destacada: false,
      titulo: 'La Sub-14 femenina sumó un empate como visitante',
      bajada: 'Crónica breve del partido de la fecha.',
      texto: 'Texto de ejemplo de una noticia de categoría.',
    },
    {
      id: 'n3', categoriaId: 'escuelita', fecha: fechaISO(hoy, -8), destacada: false,
      titulo: 'Horarios de entrenamiento de la Escuelita',
      bajada: 'Días y horarios para las familias.',
      texto: 'Texto de ejemplo con los horarios.',
    },
    {
      id: 'n4', categoriaId: 'masc-a', fecha: fechaISO(hoy, -10), destacada: false,
      titulo: 'Convocatoria para la Reserva de Masculino A',
      bajada: 'Lista de citados para el próximo partido.',
      texto: 'Texto de ejemplo de una convocatoria.',
    },
  ]
}

// autorizacion.nombre: null (no autorizado) | 'corto' (Nombre A.) | 'completo'
// autorizacion.imagen: puede aparecer en fotos del equipo y galería
function jugador(id, equipoId, nombre, apellido, dorsal, posicion, esMenor, nombreAut, imagen) {
  return {
    id, equipoId, nombre, apellido, dorsal, posicion, esMenor,
    autorizacion: { nombre: nombreAut, imagen, fecha: nombreAut ? '2026-03-01' : null },
  }
}

export const jugadoresBase = [
  jugador('j1', 'masc-a-primera', 'Tomás', 'Herrera', 1, 'Arquero', false, 'completo', true),
  jugador('j2', 'masc-a-primera', 'Facundo', 'Ríos', 2, 'Cierre', false, 'completo', true),
  jugador('j3', 'masc-a-primera', 'Matías', 'Acosta', 5, 'Ala', false, 'completo', true),
  jugador('j4', 'masc-a-primera', 'Lucas', 'Benítez', 7, 'Ala', false, 'completo', true),
  jugador('j5', 'masc-a-primera', 'Nicolás', 'Paz', 9, 'Pívot', false, 'completo', true),
  jugador('j6', 'masc-a-primera', 'Joaquín', 'Moreno', 10, 'Ala', false, 'completo', true),
  jugador('j7', 'masc-a-primera', 'Bruno', 'Sosa', 12, 'Arquero', false, 'corto', true),
  jugador('j8', 'fem-b-primera', 'Carla', 'Domínguez', 1, 'Arquera', false, 'completo', true),
  jugador('j9', 'fem-b-primera', 'Micaela', 'Torres', 4, 'Cierre', false, 'completo', true),
  jugador('j10', 'fem-b-primera', 'Rocío', 'Giménez', 8, 'Ala', false, 'completo', true),
  jugador('j11', 'fem-b-primera', 'Florencia', 'Ruiz', 9, 'Pívot', false, 'completo', true),
  jugador('j12', 'fem-b-sub14', 'Martina', 'González', 1, 'Arquera', true, 'completo', true),
  jugador('j13', 'fem-b-sub14', 'Juana', 'Pérez', 4, 'Ala', true, 'corto', true),
  jugador('j14', 'fem-b-sub14', 'Valentina', 'Sosa', 5, 'Cierre', true, 'corto', false),
  jugador('j15', 'fem-b-sub14', 'Sofía', 'Romero', 7, 'Pívot', true, 'corto', true),
  jugador('j16', 'fem-b-sub14', 'Camila', 'Fernández', 9, 'Pívot', true, 'corto', true),
  jugador('j17', 'fem-b-sub14', 'Lucía', 'Medina', 10, 'Ala', true, 'corto', true),
  jugador('j18', 'fem-b-sub14', 'Agustina', 'Ruiz', 11, 'Ala', true, null, false),
]

export const usuariosBase = [
  { id: 'admin', rol: 'admin', nombre: 'Administradora', email: 'siriofutsalrosario@gmail.com', equipos: [] },
  {
    id: 'e1', rol: 'entrenador', nombre: 'Entrenador de ejemplo 1', email: 'entrenador1@ejemplo.com',
    equipos: ['masc-a-primera', 'masc-a-reserva'], pendiente: false,
  },
  {
    id: 'e2', rol: 'entrenador', nombre: 'Entrenadora de ejemplo 2', email: 'entrenadora2@ejemplo.com',
    equipos: ['fem-b-sub14'], pendiente: true,
  },
]

export function crearSugerencias() {
  return [
    { id: 's1', tipo: 'resultado', partidoId: 'p20', golesSirio: 2, golesRival: 2, fuente: 'rosariofutbol.com' },
    { id: 's2', tipo: 'resultado', partidoId: 'p21', golesSirio: 0, golesRival: 3, fuente: 'rosariofutbol.com' },
    { id: 's3', tipo: 'horario', partidoId: 'p13', hora: '10:00', fuente: 'rosariofutbol.com' },
  ]
}

export const inscripcionesBase = [
  {
    id: 'i1', fecha: null, jugador: 'Nombre de ejemplo', categoria: 'Inferiores',
    adulto: 'Adulto responsable de ejemplo', telefono: '[teléfono de ejemplo]', mensaje: 'Quiere probar en Inferiores.',
  },
]

// Jugadores del Sirio que figuran en el boletín del Tribunal Disciplinario de la Rosarina.
// Datos REALES del boletín 3318 (28/10/2026). Solo nombre y apellido, sin DNI ni categoría.
export const boletinBase = {
  numero: 3318,
  fecha: '2026-10-28',
  jugadores: ['Ramiro Andalaf', 'Pedro Di Prinzio', 'Sebastián Pinto', 'Pilar Cairo'],
}

// Tablas de posiciones de ejemplo (nombres ilustrativos). En la versión real se cargan desde el panel.
function filaTabla(pos, equipo, pj, pg, pe, pp, gf, gc) {
  return { pos, equipo, pj, pg, pe, pp, gf, gc, dg: gf - gc, pts: pg * 3 + pe }
}
export function crearTablas(hoy = new Date()) {
  const fecha = fechaISO(hoy, -2)
  const base = (sirioPos) => {
    const rivales = ['Rival A', 'Rival B', 'Rival C', 'Rival D', 'Rival E', 'Rival F']
    const filas = []
    let r = 0
    for (let pos = 1; pos <= 7; pos += 1) {
      if (pos === sirioPos) filas.push(filaTabla(pos, 'Argentino Sirio', 10, 8 - pos, 2, pos - 1 > 2 ? 3 : 1, 30 - pos * 2, 14 + pos))
      else { filas.push(filaTabla(pos, rivales[r], 10, 8 - pos, 1, pos, 28 - pos * 2, 13 + pos)); r += 1 }
    }
    return filas
  }
  return [
    { equipoId: 'masc-a-primera', filas: base(3), actualizada: fecha },
    { equipoId: 'masc-a-reserva', filas: base(2), actualizada: fecha },
    { equipoId: 'fem-b-primera', filas: base(4), actualizada: fecha },
    { equipoId: 'masc-b-reserva', filas: base(5), actualizada: fecha },
  ]
}

export const clubBase = {
  historia: 'Texto de ejemplo con la historia del club. La administradora lo escribe desde el panel (Más → Datos del club).',
  direccion: '[Dirección del club]',
  telefono: '[Teléfono de ejemplo]',
  whatsapp: '',
  instagram: '',
  indumentariaTexto: '',
  indumentariaUrl: '',
  sponsors: 'Sponsor de ejemplo 1\nSponsor de ejemplo 2',
  archivo: '2025: Masculino A Primera · 3º puesto (ejemplo)\n2024: Femenino B · 2º puesto (ejemplo)',
}

export function estadoInicial(hoy = new Date()) {
  return {
    equipos: equiposBase,
    partidos: crearPartidos(hoy),
    noticias: crearNoticias(hoy),
    jugadores: jugadoresBase,
    usuarios: usuariosBase,
    sugerencias: crearSugerencias(),
    inscripciones: inscripcionesBase.map((i) => ({ ...i, fecha: fechaISO(hoy, -1) })),
    avisosEnviados: [],
    boletin: boletinBase,
    tablas: crearTablas(hoy),
    club: { ...clubBase },
    galeria: [],
    sesion: null,
    preferencias: { seguidos: ['masc-a-primera', 'masc-a-reserva'], tipos: ['proximo', 'resultado', 'horario', 'anuncio'] },
  }
}
