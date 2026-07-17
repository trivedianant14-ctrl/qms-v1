import { useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

const P = '#131B63'
const SKY = '#15CAE8'

export default function NotificationToast() {
  const { activeToast, dismissToast } = useNotifications()
  if (!activeToast) return null
  return <Toast key={activeToast.id} toast={activeToast} onDismiss={dismissToast} />
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'absolute', top: 10, left: 10, right: 10, zIndex: 999,
      background: 'rgba(11, 16, 66, 0.94)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${SKY}33`,
      borderRadius: 18,
      padding: '11px 10px 11px 10px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: `0 8px 32px rgba(11,16,66,0.5), 0 0 0 1px rgba(21,202,232,0.08)`,
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      animation: 'toastSlideDown 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* App icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `linear-gradient(135deg, ${P}, ${SKY})`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>NPrep</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>now</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 3 }}>{toast.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>{toast.body}</div>
      </div>
      {/* Dismiss */}
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0 0 4px',
        color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1, flexShrink: 0,
      }}>✕</button>
    </div>
  )
}
