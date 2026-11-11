import { useApp } from '../../estado.jsx'
import { EncabezadoPanel, NavPanel } from './Comun.jsx'
import { Icono, nombreEquipo, fechaCorta } from '../../componentes/comunes.jsx'
import { esAdmin, equiposEditables, jugadorVisible, puedeAparecerEnFotos, partidoSinResultado } from '../../datos/reglas.js'

export default function PanelInicio() {
  const { estado, usuario, ir, ejecutar, hoyISO, equipoPorId, categoriaPorId } = useApp()
  const admin = esAdmin(usuario)
  const misEquipos = equiposEditables(usuario, estado.equipos).map((e) => e.id)
  const sinResultado = estado.partidos.filter((p) => misEquipos.includes(p.equipoId) && partidoSinResultado(p, hoyISO))
  const sinAutorizacion = estado.jugadores.filter((j) => !jugadorVisible(j) || !puedeAparecerEnFotos(j))

  const probarPermiso = () => {
    const ajeno = estado.partidos.find((p) => p.equipoId === 'masc-b-primera')
    ejecutar('partido/guardar', { partido: { ...ajeno, golesSirio: 1, golesRival: 0, estado: 'jugado' } })
  }

  return (
    <>
      <EncabezadoPanel />
      <main className="contenido g">
        <section className="seccion">
          <h1 className="h1">Pendientes</h1>
          <div className="lista">
            <button type="button" className="fila fila-btn" onClick={() => ir('panel-partidos')}>
              <span className="cifra num">{sinResultado.length}</span>
              <span className="crece"><span style={{ fontWeight: 600 }}>Partidos sin resultado</span>
                <span className="mini suave">{sinResultado.length ? sinResultado.map((p) => `${nombreEquipo(equipoPorId[p.equipoId], categoriaPorId, true)} (${fechaCorta(p.fecha)})`).join(' · ') : 'Todo al día'}</span></span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
            {admin ? (
              <>
                <button type="button" className="fila fila-btn" onClick={() => ir('panel-rosarina')}>
                  <span className="cifra num">{estado.sugerencias.length}</span>
                  <span className="crece"><span style={{ fontWeight: 600 }}>Datos de la Rosarina</span><span className="mini suave">Leídos de su web; revisar y aprobar</span></span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
                <button type="button" className="fila fila-btn" onClick={() => ir('panel-planteles')}>
                  <span className="cifra alerta num">{sinAutorizacion.length}</span>
                  <span className="crece"><span style={{ fontWeight: 600 }}>Jugadores con autorización incompleta</span><span className="mini suave">Sin nombre o sin imagen autorizada</span></span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
                <button type="button" className="fila fila-btn" onClick={() => ir('panel-inscriptos')}>
                  <span className="cifra oscura num">{estado.inscripciones.length}</span>
                  <span className="crece"><span style={{ fontWeight: 600 }}>Inscripciones</span><span className="mini suave">Datos privados, solo vos los ves</span></span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              </>
            ) : null}
          </div>
        </section>

        <section className="seccion">
          <h2 className="rotulo">Acciones rápidas</h2>
          <div className="acciones">
            <button type="button" className="accion destacada" onClick={() => ir('panel-partidos')}>{Icono.calendario()}Cargar resultado</button>
            <button type="button" className="accion" onClick={() => ir('panel-noticias')}>{Icono.noticias({ style: { color: 'var(--verde-texto)' } })}Nueva noticia</button>
            <button type="button" className="accion" onClick={() => ir('panel-planteles')}>{Icono.personas({ style: { color: 'var(--verde-texto)' } })}Plantel</button>
            <button type="button" className="accion" onClick={() => ir('panel-aviso')}>{Icono.campana({ width: 22, height: 22, style: { color: 'var(--verde-texto)' } })}Enviar aviso</button>
          </div>
        </section>

        {!admin ? (
          <section className="tarjeta seccion" style={{ padding: 14 }}>
            <h2 className="h2" style={{ fontSize: 20 }}>Prueba de permisos</h2>
            <p className="chico suave" style={{ margin: 0 }}>Tu usuario solo edita {misEquipos.map((id) => nombreEquipo(equipoPorId[id], categoriaPorId, true)).join(' y ')}. Probá cargar un resultado de Masculino B Primera: tiene que rechazarse.</p>
            <button type="button" className="btn btn-secundario" onClick={probarPermiso}>Intentar cargar en Masculino B</button>
          </section>
        ) : (
          <section className="tarjeta" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderStyle: 'dashed' }}>
            <span className="crece" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <span style={{ fontWeight: 700 }}>Copia de seguridad mensual</span>
              <span className="mini suave">En la versión real descarga todos los datos en una planilla.</span>
            </span>
            <button type="button" className="btn btn-secundario" onClick={() => ir('panel-mas')}>Ver</button>
          </section>
        )}
      </main>
      <NavPanel actual="panel" />
    </>
  )
}
