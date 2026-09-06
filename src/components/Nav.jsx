import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Nav() {
  const { profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && <div className="nav-overlay" onClick={closeMenu} />}

      <nav className={`app-sidebar ${open ? 'app-sidebar--open' : ''}`}>
        <div className="nav-brand">
          <span className="nav-brand-mark">RS</span>
          <span>Logbook Apoteker</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end onClick={closeMenu}>
            Dashboard
          </NavLink>
          <NavLink to="/assessments" onClick={closeMenu}>
            Asesmen Pasien
          </NavLink>
          <NavLink to="/antibiotics" onClick={closeMenu}>
            Monitoring Antibiotik
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={closeMenu}>
              Admin
            </NavLink>
          )}
        </div>
        <div className="nav-user">
          <span className="nav-user-name">{profile?.full_name ?? '…'}</span>
          <button className="btn-ghost" onClick={signOut}>
            Keluar
          </button>
        </div>
      </nav>
    </>
  )
}
