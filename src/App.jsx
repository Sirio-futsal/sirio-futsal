import { useApp } from './estado.jsx'
import { Toast } from './componentes/comunes.jsx'
import Inicio from './pantallas/publicas/Inicio.jsx'
import Fixture from './pantallas/publicas/Fixture.jsx'
import Partido from './pantallas/publicas/Partido.jsx'
import { ListaCategorias, DetalleCategoria } from './pantallas/publicas/Categorias.jsx'
import { ListaNoticias, DetalleNoticia } from './pantallas/publicas/Noticias.jsx'
import Tablas from './pantallas/publicas/Tablas.jsx'
import Mas from './pantallas/publicas/Mas.jsx'
import Avisos from './pantallas/publicas/Avisos.jsx'
import GaleriaCompleta from './pantallas/publicas/Galeria.jsx'
import Ingreso from './pantallas/panel/Ingreso.jsx'
import PanelInicio from './pantallas/panel/Inicio.jsx'
import PanelPartidos from './pantallas/panel/Partidos.jsx'
import PanelNoticias from './pantallas/panel/Noticias.jsx'
import PanelPlanteles from './pantallas/panel/Planteles.jsx'
import { PanelBoletin } from './pantallas/panel/Boletin.jsx'
import { PanelSincronizacion } from './pantallas/panel/Sincronizacion.jsx'
import { PanelTablas, PanelClub, PanelGaleria } from './pantallas/panel/Contenido.jsx'
import { PanelMas, PanelEntrenadores, PanelRosarina, PanelInscriptos, PanelAviso } from './pantallas/panel/Mas.jsx'

const PANEL = {
  panel: PanelInicio,
  'panel-partidos': PanelPartidos,
  'panel-noticias': PanelNoticias,
  'panel-planteles': PanelPlanteles,
  'panel-mas': PanelMas,
  'panel-entrenadores': PanelEntrenadores,
  'panel-rosarina': PanelRosarina,
  'panel-inscriptos': PanelInscriptos,
  'panel-aviso': PanelAviso,
  'panel-boletin': PanelBoletin,
  'panel-sync': PanelSincronizacion,
  'panel-tablas': PanelTablas,
  'panel-club': PanelClub,
  'panel-galeria': PanelGaleria,
}

function Pantalla() {
  const { vista, usuario } = useApp()
  if (vista === 'panel' || vista.startsWith('panel-')) {
    if (!usuario) return <Ingreso />
    const P = PANEL[vista] || PanelInicio
    return <P />
  }
  if (vista.startsWith('partido-')) return <Partido id={vista.slice('partido-'.length)} />
  if (vista.startsWith('categoria-')) {
    const id = vista.slice('categoria-'.length)
    return <DetalleCategoria key={id} id={id} />
  }
  if (vista.startsWith('noticia-')) return <DetalleNoticia id={vista.slice('noticia-'.length)} />
  switch (vista) {
    case 'tablas': return <Tablas />
    case 'fixture': return <Fixture />
    case 'categorias': return <ListaCategorias />
    case 'noticias': return <ListaNoticias />
    case 'mas': return <Mas />
    case 'avisos': return <Avisos />
    case 'galeria': return <GaleriaCompleta />
    default: return <Inicio />
  }
}

export default function App() {
  return (
    <div className="app">
      <Pantalla />
      <Toast />
    </div>
  )
}
