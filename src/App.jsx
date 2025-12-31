import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Verify from './pages/Verify'
import BatchUpload from './pages/BatchUpload'
import Explorer from './pages/Explorer'
import Compare from './pages/Compare'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="verify" element={<Verify />} />
        <Route path="batch" element={<BatchUpload />} />
        <Route path="explorer" element={<Explorer />} />
        <Route path="compare" element={<Compare />} />
      </Route>
    </Routes>
  )
}

export default App
