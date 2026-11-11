import { useState } from 'react'
import { useApp } from '../../estado.jsx'
import { EncabezadoPublico, NavPublica, Chips, Segmento, TarjetaPartido, agruparPorFecha, ordenarPartidos, fechaLarga } from '../../componentes/comunes.jsx'
import { DIVISIONES } from '../../datos/ejemplo.js'

const GRUPOS = { primera: 'Primera', reserva: 'Reserva', inferiores: 'Inferiores' }

export default function Fixture() {
  const { estado, hoyISO, equipoPorId, categorias } = useApp()
  const [cat, setCat] = useState('todas')
  const [grupo, setGrupo] = useState('todos')
  const [division, setDivision] = useState('todas')
  const [modo, setModo] = useState('proximos')

  const catsFixture = categorias.filter((c) => c.conFixture)
  const equiposCat = cat === 'todas' ? [] : estado.equipos.filter((e) => e.categoriaId === cat)
  const gruposCat = [...new Set(equiposCat.map((e) => e.grupo))]
  const esMasc = cat === 'masc-a' || cat === 'masc-b'

  const cambiarCat = (c) => { setCat(c); setGrupo('todos'); setDivision('todas') }

  const lista = estado.partidos.filter((p) => {
    const e = equipoPorId[p.equipoId]
    if (!e || !catsFixture.some((c) => c.id === e.categoriaId)) return false
    if (cat !== 'todas' && e.categoriaId !== cat) return false
    if (grupo !== 'todos' && e.grupo !== grupo) return false
    if (grupo === 'inferiores' && division !== 'todas' && e.division !== division) return false
    return modo === 'proximos' ? p.estado !== 'jugado' && p.fecha >= hoyISO : p.estado === 'jugado'
  })
  const grupos = agruparPorFecha(ordenarPartidos(lista, modo === 'proximos'))

  return (
    <>
      <EncabezadoPublico />
      <main className="contenido g">
        <div className="seccion">
          <h1 className="h1">Fixture</h1>
          <Chips etiqueta="Categoría" valor={cat} onCambio={cambiarCat}
            opciones={[{ valor: 'todas', texto: 'Todas' }, ...catsFixture.map((c) => ({ valor: c.id, texto: c.nombre }))]} />
          {gruposCat.length > 1 ? (
            <Segmento etiqueta="Equipo" valor={grupo} onCambio={(g) => { setGrupo(g); setDivision('todas') }}
              opciones={[{ valor: 'todos', texto: 'Todos' }, ...gruposCat.map((g) => ({ valor: g, texto: cat === 'fem-b' && g === 'inferiores' ? 'Sub-14' : GRUPOS[g] }))]} />
          ) : null}
          {esMasc && grupo === 'inferiores' ? (
            <Chips etiqueta="División" valor={division} onCambio={setDivision}
              opciones={[{ valor: 'todas', texto: 'Todas' }, ...DIVISIONES.map((d) => ({ valor: d, texto: d }))]} />
          ) : null}
          <div className="pestanas" role="tablist">
            <button type="button" role="tab" aria-selected={modo === 'proximos'} onClick={() => setModo('proximos')}>Próximos</button>
            <button type="button" role="tab" aria-selected={modo === 'resultados'} onClick={() => setModo('resultados')}>Resultados</button>
          </div>
        </div>

        {grupos.length === 0 ? (
          <div className="tarjeta vacio">
            {modo === 'proximos' ? 'No hay partidos programados para este filtro.' : 'Todavía no hay resultados para este filtro.'}
          </div>
        ) : (
          grupos.map((g) => (
            <section key={g.fecha} className="seccion">
              <h2 className="rotulo">{fechaLarga(g.fecha)}</h2>
              {g.partidos.map((p) => <TarjetaPartido key={p.id} partido={p} />)}
            </section>
          ))
        )}
      </main>
      <NavPublica actual="fixture" />
    </>
  )
}
