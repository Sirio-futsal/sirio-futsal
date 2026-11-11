import { useApp } from '../../estado.jsx'
import { EncabezadoVolver, NavPublica } from '../../componentes/comunes.jsx'

// Galería completa, agrupada por temporada.
export default function GaleriaCompleta() {
  const { estado, categoriaPorId } = useApp()
  const fotos = estado.galeria || []
  const grupos = []
  for (const f of fotos) {
    const clave = f.temporada || 'Sin temporada'
    const g = grupos.find((x) => x.clave === clave)
    if (g) g.fotos.push(f)
    else grupos.push({ clave, fotos: [f] })
  }
  return (
    <>
      <EncabezadoVolver titulo="Galería" volverA="inicio" />
      <main className="contenido g">
        {grupos.length === 0 ? <div className="tarjeta vacio">Todavía no hay fotos cargadas.</div> : null}
        {grupos.map((g) => (
          <section key={g.clave} className="seccion">
            <h2 className="h2">{g.clave}</h2>
            <div className="galeria-grilla">
              {g.fotos.map((f) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" aria-label={f.titulo || 'Foto del club'}>
                  <img src={f.url} alt={f.titulo || (f.categoriaId && categoriaPorId[f.categoriaId]?.nombre) || 'Foto del club'} loading="lazy" />
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
      <NavPublica actual="inicio" />
    </>
  )
}
