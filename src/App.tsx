import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import { defaultDoc } from './data/docs'

const Docs = lazy(() => import('./pages/Docs'))

function DocsFallback() {
  return <div className="route-loading">正在加载文档…</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/docs" element={<Navigate to={`/docs/${defaultDoc}`} replace />} />
      <Route
        path="/docs/:slug"
        element={
          <Suspense fallback={<DocsFallback />}>
            <Docs />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
