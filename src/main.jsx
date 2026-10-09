import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@knadh/oat/oat.min.css'
import '@knadh/oat/oat.min.js'
import App from './App.jsx'
import './App.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
