import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProveedorApp } from './estado.jsx'
import App from './App.jsx'
import './estilos.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorApp>
      <App />
    </ProveedorApp>
  </StrictMode>,
)
