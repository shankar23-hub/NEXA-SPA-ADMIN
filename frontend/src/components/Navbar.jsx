import { useState } from 'react'

export default function Navbar({ title, user, onLogout }) {
  const [showNotif, setShowNotif] = useState(false)
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'NA'
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>NEXA Portal</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span>{title}</span>
        </div>
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input type="text" placeholder="Search anything..." />
        </div>
      </div>
      <div className="topbar-right">
      
        <div style={{ width: 1, height: 24, background: 'var(--panel-border)', margin: '0 4px' }}></div>
        <div className="topbar-user-info" style={{ textAlign: 'right', marginRight: 8 }}>
          <div className="topbar-user-name">{greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋</div>
          <div className="topbar-user-role">{user?.role || 'Administrator'}</div>
        </div>
        <div className="topbar-avatar">{initials}</div>
      </div>
    </header>
  )
}
