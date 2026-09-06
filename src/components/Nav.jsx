import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="nav-brand-mark">RS</span>
        <span>Logbook Apoteker</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/assessments">Asesmen Pasien</NavLink>
        <NavLink to="/antibiotics">Monitoring Antibiotik</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </div>
      <div className="nav-user">
        <span className="nav-user-name">{profile?.full_name ?? '…'}</span>
        <button className="btn-ghost" onClick={signOut}>
          Keluar
        </button>
      </div>
    </nav>
  )
}
