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

const publicas = ['inicio', 'fixture', 'categorias', 'categoria-masc-a', 'categoria-fem-b', 'categoria-escuelita', 'noticias', 'noticia-n1', 'mas', 'avisos', 'partido-p1', 'partido-p7']
const panel = ['panel', 'panel-partidos', 'panel-noticias', 'panel-planteles', 'panel-mas', 'panel-entrenadores', 'panel-rosarina', 'panel-inscriptos', 'panel-aviso', 'panel-boletin']

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
  it('el plantel público no muestra jugadoras sin autorización', () => {
    montar('categoria-fem-b')
    fireEvent.click(screen.getByRole('button', { name: 'Sub-14' }))
    expect(screen.queryByText(/Agustina/)).toBeNull()
    expect(screen.getByText('Juana P.')).toBeTruthy()
    expect(screen.getByText(/se publica cuando todos tengan autorización/)).toBeTruthy()
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
