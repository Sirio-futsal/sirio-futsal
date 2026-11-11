// Lee la planilla de programación que manda la Asociación (.xlsx) sin librerías externas.
// Un .xlsx es un zip con XML adentro: lo abrimos con las herramientas del propio navegador.

const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&')

async function inflar(bytes) {
  const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flujo).arrayBuffer())
}

async function leerZip(buffer) {
  const u8 = new Uint8Array(buffer)
  const v = new DataView(buffer)
  let fin = -1
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { fin = i; break }
  }
  if (fin < 0) throw new Error('El archivo no parece un Excel (.xlsx).')
  const n = v.getUint16(fin + 10, true)
  let p = v.getUint32(fin + 16, true)
  const archivos = {}
  const txt = new TextDecoder()
  for (let k = 0; k < n; k++) {
    const metodo = v.getUint16(p + 10, true)
    const tam = v.getUint32(p + 20, true)
    const lNombre = v.getUint16(p + 28, true)
    const lExtra = v.getUint16(p + 30, true)
    const lCom = v.getUint16(p + 32, true)
    const pos = v.getUint32(p + 42, true)
    const nombre = txt.decode(u8.subarray(p + 46, p + 46 + lNombre))
    const dataIni = pos + 30 + v.getUint16(pos + 26, true) + v.getUint16(pos + 28, true)
    archivos[nombre] = { metodo, datos: u8.subarray(dataIni, dataIni + tam) }
    p += 46 + lNombre + lExtra + lCom
  }
  const leer = async (nombre) => {
    const a = archivos[nombre]
    if (!a) return null
    const b = a.metodo === 0 ? a.datos : await inflar(a.datos)
    return txt.decode(b)
  }
  return { leer, nombres: Object.keys(archivos) }
}

const colNum = (ref) => ref.replace(/\d+/g, '').split('').reduce((t, c) => t * 26 + c.charCodeAt(0) - 64, 0) - 1

function celdasDeHoja(xml, compartidas) {
  const filas = []
  const reFila = /<row\b[^>]*>([\s\S]*?)<\/row>/g
  let m
  while ((m = reFila.exec(xml))) {
    const fila = []
    const reCel = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let c
    while ((c = reCel.exec(m[1]))) {
      const attrs = c[1]
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1]
      if (!ref || c[2] == null) continue
      const tipo = /\bt="(\w+)"/.exec(attrs)?.[1]
      let val = null
      if (tipo === 'inlineStr') val = [...c[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => dec(x[1])).join('')
      else {
        const vv = /<v>([\s\S]*?)<\/v>/.exec(c[2])?.[1]
        if (vv == null) continue
        if (tipo === 's') val = compartidas[+vv]
        else if (tipo === 'str' || tipo === 'e') val = dec(vv)
        else val = Number(vv)
      }
      if (val === '' || val == null) continue
      fila[colNum(ref)] = val
    }
    filas.push(fila)
  }
  return filas
}

export async function leerLibro(buffer) {
  const zip = await leerZip(buffer)
  const ss = (await zip.leer('xl/sharedStrings.xml')) || ''
  const compartidas = [...ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((s) => [...s[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => dec(x[1])).join(''))
  const wb = await zip.leer('xl/workbook.xml')
  const rels = await zip.leer('xl/_rels/workbook.xml.rels')
  if (!wb || !rels) throw new Error('No pude leer las hojas del Excel.')
  const destino = Object.fromEntries([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((r) => [/\bId="([^"]+)"/.exec(r[0])?.[1], /\bTarget="([^"]+)"/.exec(r[0])?.[1]]))
  const hojas = []
  for (const s of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const nombre = dec(/\bname="([^"]*)"/.exec(s[0])?.[1] || '')
    const rid = /\br:id="([^"]+)"/.exec(s[0])?.[1]
    let t = destino[rid] || ''
    t = t.startsWith('/') ? t.slice(1) : `xl/${t}`
    const xml = await zip.leer(t)
    if (xml) hojas.push({ nombre, filas: celdasDeHoja(xml, compartidas) })
  }
  return hojas
}

// ---------- Nombres lindos ----------
const quitarAcentos = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
const clave = (s) => quitarAcentos(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
const NOMBRES = {
  ARGSIRIO: 'Argentino Sirio', ARGSIRIOB: 'Argentino Sirio B', ARGENTINOSIRIO: 'Argentino Sirio',
  SCORAZON: 'Sagrado Corazón', NAURORA: 'Nueva Aurora', CCORDOBA: 'Central Córdoba', RCENTRAL: 'Rosario Central',
  UCENTRAL: 'Unión Central', UAMERICANA: 'Unión Americana', MMADRE: 'María Madre', NAUTICO: 'Náutico', NAUTICOB: 'Náutico B',
  PROVINCIALB: 'Provincial B', '1DEMAYO': '1° de Mayo', USAR: 'USAR', UNR: 'UNR', UNRGIM: 'UNR Gimnasio',
  BANCONACION: 'Banco Nación', NEWELLS: "Newell's", ELLUCHADOR: 'El Luchador', RIONEGRO: 'Río Negro', TELEFONOS: 'Teléfonos',
  OVALO: 'Óvalo', JOCKEYCLUB: 'Jockey Club', TIROSUIZO: 'Tiro Suizo', SOCIALLUX: 'Social Lux',
}
export function nombreLindo(raw) {
  const s = String(raw ?? '').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  const k = clave(s)
  if (NOMBRES[k]) return NOMBRES[k]
  return s.toLowerCase().replace(/(^|[\s.])([a-záéíóúñ])/g, (_, a, b) => a + b.toUpperCase())
}

// ---------- Interpretación de las hojas ----------
const ORDINAL = { 4: '4ta', 5: '5ta', 6: '6ta', 7: '7ma', 8: '8va', 9: '9na' }
const ordenCat = ['masc-a', 'masc-b', 'inf-a', 'inf-b', 'fem-a', 'fem-b', 'inf-fem']
export const NOMBRE_HOJA = {
  'masc-a': 'Primera Masculino A', 'masc-b': 'Primera Masculino B', 'inf-a': 'Inferiores A', 'inf-b': 'Inferiores B',
  'fem-a': 'Femenino A', 'fem-b': 'Femenino B', 'inf-fem': 'Inferiores Femenino',
}

function tipoDeHoja(titulo) {
  const t = quitarAcentos(titulo).toLowerCase()
  if (/inferiores\s+fem/.test(t)) return 'inf-fem'
  let m = /inferiores\s*["“”']?\s*([ab])\b/.exec(t)
  if (m) return `inf-${m[1]}`
  m = /masc\.?\s*["“”']?\s*([ab])\b/.exec(t)
  if (m) return `masc-${m[1]}`
  m = /fem\.?\s*["“”']?\s*([ab])\b/.exec(t)
  if (m) return `fem-${m[1]}`
  return null
}

function equipoDeSirio(tipo, div, nombre) {
  const d = String(div)
  if (tipo === 'masc-a' || tipo === 'masc-b') {
    const L = tipo.slice(-1)
    return d === '1' ? `masc-${L}-primera` : d === '3' ? `masc-${L}-reserva` : null
  }
  if (tipo === 'inf-a' || tipo === 'inf-b') {
    const L = /\bB$/i.test(String(nombre).trim()) ? 'b' : 'a'
    return ORDINAL[d] ? `masc-${L}-inf-${ORDINAL[d]}` : null
  }
  if (tipo === 'fem-b') return 'fem-b-primera'
  if (tipo === 'inf-fem') return /14/.test(d) ? 'fem-b-sub14' : null
  return null
}

const hora = (v) => {
  if (v == null || v === '') return null
  if (typeof v === 'number' && v > 0 && v < 1) { const mins = Math.round(v * 1440); return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}` }
  const m = /^(\d{1,2})\s*[.:hH]\s*(\d{2})/.exec(String(v).trim())
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null
}

const tx = (v) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim())

export function interpretarHojas(hojas) {
  const filas = []
  const avisos = []
  let orden = 0
  for (const h of hojas) {
    const lineas = h.filas.map((f) => (f || []).filter((c) => c != null))
    const textos = lineas.map((l) => (l.length === 1 && typeof l[0] === 'string' ? tx(l[0]) : ''))
    const iPrimeraFecha = textos.findIndex((t) => /^FECHA DE DISPUTA/i.test(t))
    const cab = textos.slice(0, iPrimeraFecha < 0 ? 4 : iPrimeraFecha).filter(Boolean)
    const tituloRaw = cab.find((t) => /PROGRAMACION/i.test(t)) || cab.find((t) => /inferiores/i.test(t)) || h.nombre
    const tipo = tipoDeHoja(`${tituloRaw} ${h.nombre}`)
    if (!tipo) { avisos.push(`No reconocí la hoja “${h.nombre}”.`); continue }
    const torneo = NOMBRE_HOJA[tipo]
    let instancia = ''
    const t2 = cab.find((t) => /^torneo a\.?r\.?f/i.test(t) && /futsal\s*-\s*\S/i.test(t))
    if (t2) instancia = tx(t2.replace(/^.*?futsal\s*-\s*/i, ''))
    const tf = cab.find((t) => /^FECHA\s+\d+/i.test(t))
    if (!instancia && tf) instancia = tx(tf).replace(/^FECHA/i, 'Fecha')
    let fecha = null
    for (let i = 0; i < h.filas.length; i++) {
      const f = h.filas[i] || []
      const t = textos[i]
      const mf = /FECHA DE DISPUTA:?\s*[^\d]*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/i.exec(t)
      if (mf) { fecha = `${mf[3]}-${mf[2].padStart(2, '0')}-${mf[1].padStart(2, '0')}`; continue }
      if (/^A CONFIRMAR/i.test(t) || (t && /confirmar/i.test(t) && lineas[i].length === 1 && !/FECHA/i.test(t))) {
        filas.push({ hoja: tipo, torneo, instancia, tipo: 'nota', orden: orden++, div: '', fecha: null, hora: null, local: '', visitante: '', cancha: null, nota: t, equipoId: null, condicion: null })
        continue
      }
      const div = f[0]
      const local = tx(f[1]); const visita = tx(f[2])
      if (div == null || !local || !visita || /^LOCAL$/i.test(local)) continue
      const divTxt = typeof div === 'number' ? String(div) : tx(div)
      const esSirioL = /sirio/i.test(local); const esSirioV = /sirio/i.test(visita)
      let equipoId = null; let condicion = null
      if (esSirioL || esSirioV) {
        equipoId = equipoDeSirio(tipo, divTxt, esSirioL ? local : visita)
        condicion = esSirioL ? 'local' : 'visitante'
      }
      const divisionEtiqueta = tipo === 'masc-a' || tipo === 'masc-b' ? ({ 1: 'Primera', 3: 'Reserva' }[divTxt] || divTxt) : ORDINAL[divTxt] || (/^f$/i.test(divTxt) ? '' : divTxt)
      filas.push({
        hoja: tipo, torneo, instancia, tipo: 'partido', orden: orden++, div: divisionEtiqueta, fecha,
        hora: hora(f[3]), local: nombreLindo(local), visitante: nombreLindo(visita), cancha: tx(f[4]) ? nombreLindo(f[4]) : null,
        nota: '', equipoId, condicion,
      })
    }
  }
  return { filas, avisos }
}

export async function leerPlanilla(buffer) {
  return interpretarHojas(await leerLibro(buffer))
}

export { ordenCat }
