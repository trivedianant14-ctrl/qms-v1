import { createContext, useContext, useState } from 'react'

export const USERS = {
  priya:   { id: 'priya',   name: 'Priya S.',          fullName: 'Priya S. — Content QA',   role: 'agent',   team: 'Content QA',  initials: 'PS', color: '#7C3AED' },
  rohan:   { id: 'rohan',   name: 'Rohan M.',          fullName: 'Rohan M. — Content QA',   role: 'agent',   team: 'Content QA',  initials: 'RM', color: '#059669' },
  anita:   { id: 'anita',   name: 'Anita R.',          fullName: 'Anita R. — Ops Triage',   role: 'agent',   team: 'Ops Triage',  initials: 'AR', color: '#D97706' },
  deepa:   { id: 'deepa',   name: 'Deepa K.',          fullName: 'Deepa K. — Engineering',  role: 'agent',   team: 'Engineering', initials: 'DK', color: '#DC2626' },
  manager: { id: 'manager', name: 'Manager',           fullName: 'Manager',                 role: 'manager', team: 'Management',  initials: 'MG', color: '#059669' },
  meera:   { id: 'meera',   name: 'Dr. Meera Joshi',   fullName: 'Dr. Meera Joshi',         role: 'faculty', team: 'Faculty',     initials: 'MJ', color: '#0891B2' },
  ramesh:  { id: 'ramesh',  name: 'Dr. Ramesh Gupta',  fullName: 'Dr. Ramesh Gupta',        role: 'faculty', team: 'Faculty',     initials: 'RG', color: '#7C3AED' },
  sunita:  { id: 'sunita',  name: 'Prof. Sunita Nair', fullName: 'Prof. Sunita Nair',       role: 'faculty', team: 'Faculty',     initials: 'SN', color: '#BE185D' },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const login = (userId) => {
    const u = USERS[userId.toLowerCase().trim()]
    if (u) { setUser(u); return true }
    return false
  }
  const logout = () => setUser(null)
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth must be inside AuthProvider')
  return v
}
