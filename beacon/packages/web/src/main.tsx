import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@beacon/sdk'
import App from './App'
import './styles/index.css'

init({
  serverUrl: '/api/collect',
  appId: 'default',
  autoPageview: true,
  autoPerformance: true,
  autoError: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
