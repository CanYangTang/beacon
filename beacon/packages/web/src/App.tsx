import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Events from './pages/Events'
import Trend from './pages/Trend'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/events" element={<Events />} />
          <Route path="/trend" element={<Trend />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
