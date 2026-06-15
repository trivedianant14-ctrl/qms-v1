import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <div className="raq-nav">
      <div className="raq-nav-main">
        <div className="raq-brand">Raise a Query</div>
        <div className="raq-tabs">
          <NavLink className={({ isActive }) => `raq-tab ${isActive ? 'active' : ''}`} to="/form">
            Student Form
          </NavLink>
          <NavLink className={({ isActive }) => `raq-tab ${isActive ? 'active' : ''}`} to="/dashboard">
            Ops Dashboard
          </NavLink>
        </div>
      </div>
      <div className="raq-banner">Prototype - Engineering Reference Only</div>
    </div>
  )
}
