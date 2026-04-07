import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/staff', label: 'Staff Profiles', icon: '👥' },
  { to: '/certifications', label: 'Certifications', icon: '🎓' },
  { to: '/projects', label: 'Project Status', icon: '📊' },
  { to: '/allocation', label: 'AI Allocation', icon: '🤖' },
  { to: '/staff-id', label: 'Staff ID', icon: '🪪' },
  { to: '/my-profile', label: 'My Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ activePath, onLogout, user }) {
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'NA'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/nexa-logo.png" alt="NEXA" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} onError={e => { e.target.style.display = 'none' }} />
          <div>
            <div className="brand-logo-text">NEXA<span> ADMIN</span></div>
          </div>
        </div>
        <div className="brand-sub">Portal v2.1</div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Main Menu</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="sidebar-link-arrow">›</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar" style={{ background: '#e63946' }}>
            {initials}
          </div>
          <div>
            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
            <div className="sidebar-user-role">{user?.role || 'Administrator'}</div>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <span></span> Logout
        </button>
      </div>
    </aside>
  )
}
