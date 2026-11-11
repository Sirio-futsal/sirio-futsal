import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// "npm run build:prueba" arma un único archivo HTML para publicarlo como página de prueba.
// "npm run build" arma la versión normal (la que irá a Cloudflare Pages).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'prueba' ? [viteSingleFile()] : [])],
  test: { environment: 'node' },
}))
