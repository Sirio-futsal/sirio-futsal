import { describe, it, expect } from 'vitest'
import {
  puedeEditarEquipo, equiposEditables, puedePublicarEnCategoria, puedeGestionarAutorizaciones,
  jugadorVisible, nombrePublico, puedeAparecerEnFotos, fotoEquipoPublicable, resultadoSirio, partidoSinResultado,
  parsearTabla, filaDeSirio, parsearSponsors, enlaceWhatsapp,
} from './reglas.js'
import { equiposBase, jugadoresBase, usuariosBase, categorias, crearPartidos } from './ejemplo.js'

const admin = usuariosBase.find((u) => u.id === 'admin')
const entrenador = usuariosBase.find((u) => u.id === 'e1') // Masc. A Primera y Reserva
const pendiente = usuariosBase.find((u) => u.id === 'e2') // invitación sin aceptar

describe('estructura del club', () => {
  it('tiene 19 equipos con fixture y Escuelita sin fixture', () => {
    const conFixture = equiposBase.filter((e) => categorias.find((c) => c.id === e.categoriaId).conFixture)
    expect(conFixture).toHaveLength(19)
    expect(equiposBase.find((e) => e.id === 'escuelita')).toBeTruthy()
  })
  it('Masculino A y B tienen Primera, Reserva e Inferiores de 4ta a 9na', () => {
    for (const cat of ['masc-a', 'masc-b']) {
      const nombres = equiposBase.filter((e) => e.categoriaId === cat).map((e) => e.nombre)
      expect(nombres).toEqual(['Primera', 'Reserva', 'Inferiores 4ta', 'Inferiores 5ta', 'Inferiores 6ta', 'Inferiores 7ma', 'Inferiores 8va', 'Inferiores 9na'])
    }
  })
  it('no existe Femenino A', () => {
    expect(categorias.some((c) => c.nombre === 'Femenino A')).toBe(false)
  })
})

describe('permisos de edición', () => {
  it('la administradora edita cualquier equipo', () => {
    expect(equiposEditables(admin, equiposBase)).toHaveLength(equiposBase.length)
  })
  it('el entrenador edita solo sus equipos', () => {
    expect(puedeEditarEquipo(entrenador, 'masc-a-primera')).toBe(true)
    expect(puedeEditarEquipo(entrenador, 'masc-a-reserva')).toBe(true)
    expect(puedeEditarEquipo(entrenador, 'masc-b-primera')).toBe(false)
    expect(puedeEditarEquipo(entrenador, 'fem-b-sub14')).toBe(false)
  })
  it('un entrenador con invitación pendiente no edita nada', () => {
    expect(puedeEditarEquipo(pendiente, 'fem-b-sub14')).toBe(false)
  })
  it('un visitante sin sesión no edita nada', () => {
    expect(puedeEditarEquipo(null, 'masc-a-primera')).toBe(false)
  })
  it('el entrenador publica noticias solo en sus categorías y nunca como "todo el club"', () => {
    expect(puedePublicarEnCategoria(entrenador, 'masc-a', equiposBase)).toBe(true)
    expect(puedePublicarEnCategoria(entrenador, 'fem-b', equiposBase)).toBe(false)
    expect(puedePublicarEnCategoria(entrenador, null, equiposBase)).toBe(false)
    expect(puedePublicarEnCategoria(admin, null, equiposBase)).toBe(true)
  })
  it('solo la administradora gestiona autorizaciones', () => {
    expect(puedeGestionarAutorizaciones(admin)).toBe(true)
    expect(puedeGestionarAutorizaciones(entrenador)).toBe(false)
    expect(puedeGestionarAutorizaciones(null)).toBe(false)
  })
})

describe('privacidad de jugadores', () => {
  const porId = (id) => jugadoresBase.find((j) => j.id === id)
  it('sin autorización no aparece', () => {
    expect(jugadorVisible(porId('j18'))).toBe(false)
    expect(nombrePublico(porId('j18'))).toBeNull()
  })
  it('nombre corto muestra nombre e inicial', () => {
    expect(nombrePublico(porId('j13'))).toBe('Juana P.')
  })
  it('nombre completo muestra nombre y apellido', () => {
    expect(nombrePublico(porId('j12'))).toBe('Martina González')
  })
  it('sin autorización de imagen no puede aparecer en fotos', () => {
    expect(puedeAparecerEnFotos(porId('j14'))).toBe(false)
  })
  it('la foto del equipo se publica solo si todos tienen autorización de imagen', () => {
    const equipo = (id) => equiposBase.find((e) => e.id === id)
    const del = (id) => jugadoresBase.filter((j) => j.equipoId === id)
    expect(fotoEquipoPublicable(equipo('masc-a-primera'), del('masc-a-primera'))).toBe(true)
    expect(fotoEquipoPublicable(equipo('fem-b-sub14'), del('fem-b-sub14'))).toBe(false)
    expect(fotoEquipoPublicable(equipo('masc-b-primera'), del('masc-b-primera'))).toBe(false)
  })
})

describe('partidos', () => {
  const hoy = new Date(2026, 10, 5)
  const partidos = crearPartidos(hoy)
  it('calcula ganado, empatado y perdido', () => {
    expect(resultadoSirio(partidos.find((p) => p.id === 'p2'))).toBe('G')
    expect(resultadoSirio(partidos.find((p) => p.id === 'p1'))).toBe('E')
    expect(resultadoSirio(partidos.find((p) => p.id === 'p3'))).toBe('P')
    expect(resultadoSirio(partidos.find((p) => p.id === 'p7'))).toBeNull()
  })
  it('detecta partidos ya jugados sin resultado cargado', () => {
    const pendientes = partidos.filter((p) => partidoSinResultado(p, '2026-11-05')).map((p) => p.id)
    expect(pendientes.sort()).toEqual(['p20', 'p21'])
  })
})

import { parsearJugadoresBoletin } from './reglas.js'
describe('jugadores en boletín', () => {
  it('limpia espacios, líneas vacías y repetidos', () => {
    expect(parsearJugadoresBoletin('  Pilar   Cairo \n\nPedro Di Prinzio\npilar cairo\n')).toEqual(['Pilar Cairo', 'Pedro Di Prinzio'])
  })
})

describe('fotoEquipoPublicable con la base real', () => {
  it('respeta la marca que calcula la base', () => {
    expect(fotoEquipoPublicable({ fotoCargada: true, fotoPublicable: true }, [])).toBe(true)
    expect(fotoEquipoPublicable({ fotoCargada: true, fotoPublicable: false }, [])).toBe(false)
    expect(fotoEquipoPublicable({ fotoCargada: false, fotoPublicable: true }, [])).toBe(false)
  })
})

describe('tabla de posiciones pegada desde la Rosarina', () => {
  it('lee filas con posición, con tabuladores o espacios, y calcula DG si falta', () => {
    const f = parsearTabla("1\tR. Central\t14\t10\t2\t2\t27\t11\t16\t32\n2 Newell's 14 8 1 5 27 14 25\nPos Equipo PJ PG PE PP GF GC DG Puntos")
    expect(f).toHaveLength(2)
    expect(f[0]).toMatchObject({ pos: 1, equipo: 'R. Central', pj: 14, dg: 16, pts: 32 })
    expect(f[1]).toMatchObject({ pos: 2, equipo: "Newell's", gf: 27, gc: 14, dg: 13, pts: 25 })
  })
  it('acepta nombres con números y diferencias negativas', () => {
    expect(parsearTabla('Rival 2 14 1 1 12 5 30 -25 4')[0]).toMatchObject({ equipo: 'Rival 2', dg: -25, pts: 4 })
  })
  it('encuentra la fila de Sirio', () => {
    expect(filaDeSirio(parsearTabla('1 Argentino Sirio 5 3 1 1 9 5 4 10'))?.pts).toBe(10)
    expect(filaDeSirio(parsearTabla('1 Otro 5 3 1 1 9 5 4 10'))).toBeNull()
  })
})

describe('contenido del club', () => {
  it('sponsors con link opcional', () => {
    expect(parsearSponsors('Kiosco | https://x.com\nOtro\n\n')).toEqual([{ nombre: 'Kiosco', url: 'https://x.com' }, { nombre: 'Otro', url: '' }])
  })
  it('arma el link de WhatsApp con código de país', () => {
    expect(enlaceWhatsapp('341 555 1234')).toBe('https://wa.me/5493415551234')
    expect(enlaceWhatsapp('')).toBe('')
  })
})
