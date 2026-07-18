import React from 'react'

// Shares the NPrep brand system used by QueryTracker.jsx (Midnight Blue / Sky Blue / Ice Blue).
const P = '#131B63', PL = '#E5F0F8', PB = '#15CAE8', PD = '#0B1042'
const T1 = '#131B63', T2 = '#5B6088', T3 = '#8790B8', BD = '#E1E6F2', BG2 = '#EDF5FA'
const ORANGE = '#8A5A0F', ORANGE_BG = '#FCEFD7'

const MENU_ITEMS = [
  {
    key: 'doubts',
    label: 'My Doubts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7" />
        <circle cx="12" cy="17" r="0.6" fill={T1} stroke="none" />
        <circle cx="12" cy="12" r="9.5" />
      </svg>
    ),
  },
  {
    key: 'subscription',
    label: 'Subscription',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    key: 'share',
    label: 'Share App',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      </svg>
    ),
  },
  {
    key: 'support',
    label: 'Support',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12a8 8 0 0 1 16 0" /><path d="M4 12v5a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1z" />
        <path d="M20 12v5a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar({ onClose, onOpenDoubts }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Panel */}
      <div style={{ width: '78%', maxWidth: 300, height: '100%', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '2px 0 24px rgba(11,16,66,0.18)' }}>
        {/* Profile card */}
        <div style={{ background: `linear-gradient(140deg, ${P} 0%, ${PD} 100%)`, padding: '22px 18px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>A</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>Anant Trivedi</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>B. Sc. Nursing 1st Year</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>ID 9890123123</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '3px 10px', background: PB, borderRadius: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: PD, letterSpacing: '0.04em' }}>PRO</span>
          </div>
        </div>

        {/* Menu list */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 0', background: 'white' }}>
          {MENU_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => { if (item.key === 'doubts') onOpenDoubts(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: 'none', border: 'none', borderBottom: `1px solid ${BD}`, cursor: 'pointer', textAlign: 'left' }}
            >
              {item.icon}
              <span style={{ fontSize: 14, fontWeight: 600, color: T1 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrim */}
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(11,16,66,0.35)' }} />
    </div>
  )
}
