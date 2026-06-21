import { useNavigate } from 'react-router-dom'
import { useAuth, USERS } from '../context/AuthContext'

const ROLE_SECTIONS = [
  { role: 'manager', label: 'Manager',       icon: '🛡️', desc: 'Full access — all tickets, team overview, override resolve' },
  { role: 'agent',   label: 'Content Agent', icon: '📋', desc: 'Claim & resolve tickets in your queue' },
  { role: 'faculty', label: 'Faculty',       icon: '🎓', desc: 'View and answer queries routed to you' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (userId) => {
    if (login(userId)) navigate('/tickets')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 14 }}>NP</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0D1E36' }}>QMS Portal</span>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
            Query Management System — Select your profile to continue
          </div>
        </div>

        {ROLE_SECTIONS.map(sec => {
          const users = Object.values(USERS).filter(u => u.role === sec.role)
          return (
            <div key={sec.role} className="login-role-section">
              <div className="login-role-header">
                <span style={{ fontSize: 20 }}>{sec.icon}</span>
                <div>
                  <div className="login-role-title">{sec.label}</div>
                  <div className="login-role-desc">{sec.desc}</div>
                </div>
              </div>
              <div className="login-users-row">
                {users.map(u => (
                  <button key={u.id} className="login-user-btn" onClick={() => handleLogin(u.id)}>
                    <div className="login-avatar" style={{ background: u.color }}>{u.initials}</div>
                    <span className="login-user-name">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        <div className="login-footer">Prototype — Engineering Reference Only</div>
      </div>
    </div>
  )
}
