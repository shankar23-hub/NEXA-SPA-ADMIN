import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login               from './pages/Login.jsx'
import CreateAccount       from './pages/CreateAccount.jsx'
import Dashboard           from './pages/Dashboard.jsx'
import StaffProfiles       from './pages/StaffProfiles.jsx'
import Certifications      from './pages/Certifications.jsx'
import ProjectStatus       from './pages/ProjectStatus.jsx'
import ProjectAIAllocation from './pages/ProjectAIAllocation.jsx'
import StaffID             from './pages/StaffID.jsx'
import MyProfile           from './pages/MyProfile.jsx'
import Settings            from './pages/Settings.jsx'
import Sidebar             from './components/Sidebar.jsx'
import Navbar              from './components/Navbar.jsx'
import { authAPI }         from './utils/api'

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/staff':         'Staff Profiles',
  '/certifications':'Certifications',
  '/projects':      'Project Status',
  '/allocation':    'Project AI Allocation',
  '/staff-id':      'Staff ID',
  '/my-profile':    'My Profile',
  '/settings':      'Settings',
}

function ProtectedLayout({ children, user, onLogout }) {
  const location = useLocation()
  const title    = PAGE_TITLES[location.pathname] || 'Dashboard'
  return (
    <div className="app-shell">
      <Sidebar activePath={location.pathname} onLogout={onLogout} user={user} />
      <div className="app-body">
        <Navbar title={title} user={user} onLogout={onLogout} />
        <main className="app-main">
          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const navigate  = useNavigate()
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexa_user') || 'null') } catch { return null }
  })
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    authAPI.getSessionUser()
      .then(sessionUser => {
        if (sessionUser) {
          setUser(sessionUser)
          localStorage.setItem('nexa_user', JSON.stringify(sessionUser))
        } else {
          localStorage.removeItem('nexa_user')
          localStorage.removeItem('nexa_token')
          setUser(null)
        }
      })
      .catch(() => {})
      .finally(() => setBooting(false))
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('nexa_user', JSON.stringify(userData))
    navigate('/')
  }

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    setUser(null)
    localStorage.removeItem('nexa_user')
    localStorage.removeItem('nexa_token')
    navigate('/login')
  }

  if (booting) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff', background: '#0f0f1a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(139,92,246,0.3)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Loading NEXA Portal…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isLoggedIn = Boolean(user)

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login"          element={<Login onLogin={handleLogin} />} />
        <Route path="/create-account" element={<CreateAccount onLogin={handleLogin} />} />
        <Route path="*"               element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login"          element={<Navigate to="/" replace />} />
      <Route path="/create-account" element={<Navigate to="/" replace />} />
      <Route path="/" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Dashboard /></ProtectedLayout>
      } />
      <Route path="/staff" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><StaffProfiles /></ProtectedLayout>
      } />
      <Route path="/certifications" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Certifications /></ProtectedLayout>
      } />
      <Route path="/projects" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><ProjectStatus /></ProtectedLayout>
      } />
      <Route path="/allocation" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><ProjectAIAllocation /></ProtectedLayout>
      } />
      <Route path="/staff-id" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><StaffID /></ProtectedLayout>
      } />
      <Route path="/my-profile" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><MyProfile user={user} /></ProtectedLayout>
      } />
      <Route path="/settings" element={
        <ProtectedLayout user={user} onLogout={handleLogout}><Settings /></ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
