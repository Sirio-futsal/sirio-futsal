// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'
import { ProveedorApp } from './estado.jsx'
import App from './App.jsx'
import { estadoInicial } from './datos/ejemplo.js'

const CLAVE = 'sirio-futsal-prueba-v1'

function montar(vista, sesion = null) {
  const estado = estadoInicial(new Date())
  estado.sesion = sesion
  window.localStorage.setItem(CLAVE, JSON.stringify(estado))
  window.location.hash = vista
  window.scrollTo = () => {}
  return render(<ProveedorApp><App /></ProveedorApp>)
}

beforeEach(() => window.localStorage.clear())
afterEach(() => cleanup())

const publicas = ['inicio', 'fixture', 'categorias', 'categoria-masc-a', 'categoria-fem-b', 'categoria-escuelita', 'noticias', 'noticia-n1', 'mas', 'avisos', 'galeria', 'partido-p1', 'partido-p7']
const panel = ['panel', 'panel-partidos', 'panel-noticias', 'panel-planteles', 'panel-mas', 'panel-entrenadores', 'panel-rosarina', 'panel-inscriptos', 'panel-aviso', 'panel-boletin', 'panel-tablas', 'panel-club', 'panel-galeria']

describe('todas las pantallas se abren sin errores', () => {
  for (const v of publicas) {
    it(`pública: ${v}`, () => {
      const { container } = montar(v)
      expect(container.querySelector('main')).toBeTruthy()
    })
  }
  for (const v of panel) {
    it(`panel como administradora: ${v}`, () => {
      const { container } = montar(v, 'admin')
      expect(container.querySelector('main')).toBeTruthy()
    })
    it(`panel como entrenador: ${v}`, () => {
      const { container } = montar(v, 'e1')
      expect(container.querySelector('main')).toBeTruthy()
    })
  }
})

describe('privacidad y permisos en pantalla', () => {
  it('la categoría no publica lista de jugadores y muestra el entrenador', () => {
    const { container } = montar('categoria-masc-a')
    expect(screen.getByText('Nombre del entrenador (ejemplo)')).toBeTruthy()
    expect(container.textContent).not.toMatch(/Herrera|Benítez|Plantel/)
  })
  it('la foto del equipo no se publica si falta alguna autorización de imagen', () => {
    montar('categoria-fem-b')
    fireEvent.click(screen.getByRole('button', { name: 'Sub-14' }))
    expect(screen.queryByText(/Agustina/)).toBeNull()
    expect(screen.getByText(/se publica cuando todos tengan autorización/)).toBeTruthy()
  })
  it('la pestaña Posiciones muestra la tabla con Sirio resaltado', () => {
    const { container } = montar('categoria-masc-a')
    fireEvent.click(screen.getByRole('tab', { name: 'Posiciones' }))
    expect(container.querySelector('tr.sirio')).toBeTruthy()
  })
  it('la administradora carga una tabla pegada de la Rosarina', () => {
    montar('panel-tablas', 'admin')
    fireEvent.change(screen.getByLabelText('Filas de la tabla'), { target: { value: '1 Rival X 5 4 1 0 12 3 9 13\n2 Argentino Sirio 5 3 1 1 9 5 4 10' } })
    expect(screen.getByText('Leí 2 equipos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y publicar' }))
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE))
    expect(guardado.tablas.find((t) => t.equipoId === 'masc-a-primera').filas).toHaveLength(2)
  })
  it('el entrenador no puede cargar tablas ni datos del club', () => {
    montar('panel-tablas', 'e1')
    expect(screen.getByText('Esta sección es solo para la administradora.')).toBeTruthy()
  })
  it('el Inicio muestra los jugadores del boletín solo con nombre y apellido', () => {
    const { container } = montar('inicio')
    expect(screen.getByText('Jugadores en boletín')).toBeTruthy()
    for (const n of ['Ramiro Andalaf', 'Pedro Di Prinzio', 'Sebastián Pinto', 'Pilar Cairo']) expect(screen.getByText(n)).toBeTruthy()
    expect(container.textContent).not.toMatch(/\d{2}\.?\d{3}\.?\d{3}/)
  })
  it('las secciones solo para la administradora quedan bloqueadas para el entrenador', () => {
    montar('panel-entrenadores', 'e1')
    expect(screen.getByText('Esta sección es solo para la administradora.')).toBeTruthy()
  })
  it('el entrenador no puede cargar resultados de otro equipo', () => {
    montar('panel', 'e1')
    fireEvent.click(screen.getByRole('button', { name: 'Intentar cargar en Masculino B' }))
    expect(screen.getByRole('status').textContent).toMatch(/no tiene permiso/)
  })
  it('sin sesión, el panel pide ingresar', () => {
    montar('panel-planteles')
    expect(screen.getByText('Ingresar al panel')).toBeTruthy()
  })
  it('la administradora aprueba un resultado de la Rosarina y queda publicado', () => {
    montar('panel-rosarina', 'admin')
    const antes = screen.getAllByRole('button', { name: 'Aprobar' }).length
    fireEvent.click(screen.getAllByRole('button', { name: 'Aprobar' })[0])
    expect(screen.queryAllByRole('button', { name: 'Aprobar' }).length).toBe(antes - 1)
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE))
    expect(guardado.partidos.find((p) => p.id === 'p20').estado).toBe('jugado')
  })
})
