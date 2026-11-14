import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

// GitHub Pages 把站点挂在 /<repo>/ 下，Vite 的 base 会成为路由前缀。
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
