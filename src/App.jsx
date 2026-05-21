import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import Attention from './pages/Attention'
import Sleep from './pages/Sleep'
import Focus from './pages/Focus'
import Movement from './pages/Movement'
import Stress from './pages/Stress'
import Tips from './pages/Tips'

const pageMeta = {
  '/':          { title: 'Übersicht',         subtitle: 'Dein täglicher Gehirnstatus' },
  '/learn':     { title: 'Lernen',             subtitle: 'Wissen aufbauen & festigen' },
  '/attention': { title: 'Aufmerksamkeit',     subtitle: 'Reaktion & Konzentration trainieren' },
  '/sleep':     { title: 'Schlaf-Tracking',    subtitle: 'Erholung aufzeichnen & analysieren' },
  '/focus':     { title: 'Fokus-Sessions',     subtitle: 'Tiefe Arbeit dokumentieren' },
  '/movement':  { title: 'Bewegung',           subtitle: 'Aktivität & Entspannung tracken' },
  '/stress':    { title: 'Stressreduzierung',  subtitle: 'Atemübungen, Meditation & Journaling' },
  '/tips':      { title: 'Tipps & Wissen',     subtitle: 'Evidenzbasierte Empfehlungen' },
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = pageMeta[location.pathname] || pageMeta['/']

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f1a' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/learn"     element={<Learn />} />
            <Route path="/attention" element={<Attention />} />
            <Route path="/sleep"     element={<Sleep />} />
            <Route path="/focus"     element={<Focus />} />
            <Route path="/movement"  element={<Movement />} />
            <Route path="/stress"    element={<Stress />} />
            <Route path="/tips"      element={<Tips />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  )
}
