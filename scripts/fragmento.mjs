// Convierte dist/index.html (archivo único) en una página publicable como
// artifact de prueba: sin <html>/<head>/<body>, con título, fuentes, estilos y script.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/i)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/i)[1]

const conservar = head
  .split(/(?=<)/)
  .filter((t) => !/^<meta charset|^<meta name="viewport"/i.test(t.trim()))
  .join('')

mkdirSync('dist/prueba', { recursive: true })
writeFileSync('dist/prueba/sirio-futsal.html', `${conservar.trim()}\n${body.trim()}\n`)
copyFileSync('dist/escudo.png', 'dist/prueba/escudo.png')
console.log('Página de prueba: dist/prueba/sirio-futsal.html')
