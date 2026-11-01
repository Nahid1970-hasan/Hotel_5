import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import 'material-icons/iconfont/material-icons.css'
import App from './App'
import { theme } from './components/Navbar&Footer/theme'
import './index.css'
import './style/utilities.css'

const root = document.getElementById('root')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
