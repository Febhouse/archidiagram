import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Studio from './components/Studio'

function Dashboard() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Archi Diagram Hub (Dashboard)</h1>
      <p>Chào mừng bạn đến với trung tâm quản lý dự án.</p>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Bản thử nghiệm PoC (Proof of Concept)</h2>
        <p>Bấm vào nút bên dưới để mở không gian làm việc 3D (Studio).</p>
        <Link to="/studio" style={{ display: 'inline-block', marginTop: '1rem', padding: '10px 20px', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
          Mở 3D Studio
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/studio" element={<Studio />} />
      </Routes>
    </Router>
  )
}
