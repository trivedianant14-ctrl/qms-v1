import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useQueries } from './QueryContext'
import { AGENTS } from '../data/mockAgents'

const NotificationContext = createContext(null)

function agentForQuery(query) {
  return AGENTS[(query.id || 0) % AGENTS.length]
}

export function NotificationProvider({ children }) {
  // ── Dashboard notification log (unchanged — used by resolver/manager dashboards) ──
  const [notifications, setNotifications] = useState([])

  const addNotification = (channel, text, ticketId) => {
    const n = { id: Date.now(), channel, text, ticketId, timestamp: new Date().toISOString(), read: false }
    setNotifications(prev => [n, ...prev].slice(0, 20))
  }

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // ── Toast queue ──────────────────────────────────────────────────────────────
  const [toastQueue, setToastQueue] = useState([])
  const [activeToast, setActiveToast] = useState(null)

  const queueNotification = useCallback((title, body) => {
    setToastQueue(prev => [...prev, { id: Date.now() + Math.random(), title, body }])
  }, [])

  // Dequeue: show next toast when nothing active; 2s gap between consecutive toasts
  useEffect(() => {
    if (toastQueue.length === 0 || activeToast) return
    const [next, ...rest] = toastQueue
    const delay = rest.length > 0 ? 2000 : 0 /* 2-second gap between stacked toasts */
    const t = setTimeout(() => {
      setToastQueue(rest)
      setActiveToast(next)
    }, delay)
    return () => clearTimeout(t)
  }, [toastQueue, activeToast])

  const dismissToast = useCallback(() => setActiveToast(null), [])

  // ── Query state-change watchers (fires for resolver/manager actions) ─────────
  const { queries } = useQueries()
  const queriesRef = useRef(queries)
  queriesRef.current = queries // always current inside setTimeout closures

  const prevStatesRef = useRef({})

  useEffect(() => {
    queries.forEach(q => {
      const prev = prevStatesRef.current[q.id]

      if (!prev) {
        // First load — initialize without firing
        prevStatesRef.current[q.id] = {
          timeline_status: q.timeline_status,
          status: q.status,
          escalation_resolved: q.escalation_resolved,
          escalation_rating: q.escalation_rating,
        }
        return
      }

      // ── #3 Agent assigned ───────────────────────────────────────────────────
      if (prev.timeline_status !== 'assigned' && q.timeline_status === 'assigned') {
        const name = agentForQuery(q)?.name
        queueNotification(
          name ? `${name} aa gaye rescue pe 🦸` : 'Expert aa gaya rescue pe 🦸',
          'Wo personally dekh rahe hain tumhara sawal. Jaldi sunoge.'
        )
      }

      // ── #4 Resolution provided → also schedule #5a, #5b ────────────────────
      if (prev.status !== 'resolved' && q.status === 'resolved') {
        const name = agentForQuery(q)?.name || 'Team'
        queueNotification(
          'Doubt? Kaunsa doubt? ✅',
          `${name} ne solve kar diya. Dekho abhi — samajh aa jaayega.`
        )

        const qId = q.id

        // #5a — 20s prototype (real = 48h reminder); skip if feedback already given
        setTimeout(() => {
          const latest = queriesRef.current.find(x => x.id === qId)
          if (latest && latest.feedback_type == null && latest.resolution_star == null) {
            queueNotification(
              'Arre, bhool gaye kya? 🤔',
              'Batao toh — doubt clear hua ya nahi? Team wait kar rahi hai.'
            )
          }
        }, 20000) /* ← 20s prototype; production = 48 hours */

        // #5b — 30s prototype (real = final 6h warning); skip if feedback already given
        setTimeout(() => {
          const latest = queriesRef.current.find(x => x.id === qId)
          if (latest && latest.feedback_type == null && latest.resolution_star == null) {
            queueNotification(
              'Bhai 6 ghante bacha hai ⏳',
              'Ticket band hone waali hai. Abhi bhi kuch atka hai toh bol do.'
            )
          }
        }, 30000) /* ← 30s prototype; production = 6h before auto-close */
      }

      // ── #9 Escalation closed (by manager/agent, not student rating) → schedule #10
      if (!prev.escalation_resolved && q.escalation_resolved && q.escalation_rating == null) {
        queueNotification(
          'Ab toh clear hua hoga 💙',
          'Tumse personally baat ki hamaari team ne. Kaisa laga — batao zara.'
        )

        const qId = q.id

        // #10 — 10s prototype; skip if student already gave escalation rating
        setTimeout(() => {
          const latest = queriesRef.current.find(x => x.id === qId)
          if (latest?.escalation_rating == null) {
            queueNotification(
              'Arre rating toh do yaar 😄',
              'Ek second ka kaam hai. Tumhara feedback humein aur sharpen karta hai.'
            )
          }
        }, 10000) /* ← 10s prototype; production = next-day reminder */
      }

      prevStatesRef.current[q.id] = {
        timeline_status: q.timeline_status,
        status: q.status,
        escalation_resolved: q.escalation_resolved,
        escalation_rating: q.escalation_rating,
      }
    })
  }, [queries, queueNotification])

  return (
    <NotificationContext.Provider value={{
      notifications, addNotification, markRead,
      queueNotification, activeToast, dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications must be inside NotificationProvider')
  return value
}
