import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/navbar.css'

const ROLE_LABELS = { viewer: 'Visor', admin: 'Administrador', superadmin: 'Super Admin' }

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} title="Mostrar/ocultar capas">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1"/>
            <rect y="9" width="20" height="2" rx="1"/>
            <rect y="15" width="20" height="2" rx="1"/>
          </svg>
        </button>
        <div className="navbar-brand">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#4f8ef7" fillOpacity="0.2"/>
            <path d="M20 8C13.37 8 8 13.37 8 20C8 26.63 13.37 32 20 32C26.63 32 32 26.63 32 20C32 13.37 26.63 8 20 8Z" stroke="#4f8ef7" strokeWidth="1.5" fill="none"/>
            <path d="M8 20H32M20 8C20 8 14 14 14 20C14 26 20 32 20 32C20 32 26 26 26 20C26 14 20 8 20 8Z" stroke="#4f8ef7" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>Visor GIS</span>
        </div>
      </div>

      <div className="navbar-right">
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button className="btn-nav" onClick={() => navigate('/admin')}>
            Panel Admin
          </button>
        )}
        {user?.role === 'superadmin' && (
          <button className="btn-nav btn-nav-super" onClick={() => navigate('/superadmin')}>
            Super Admin
          </button>
        )}
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className={`role-badge role-${user?.role}`}>{ROLE_LABELS[user?.role]}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </nav>
  )
}
