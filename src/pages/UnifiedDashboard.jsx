import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, USERS } from '../context/AuthContext'
import { useQueries } from '../context/QueryContext'
import { useNotifications } from '../context/NotificationContext'
import { AGENTS, FACULTY } from '../data/mockAgents'

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_DISPLAY = {
  raised:   { label: 'Open',        cls: 'open' },
  received: { label: 'In Progress', cls: 'inprogress' },
  assigned: { label: 'In Progress', cls: 'inprogress' },
  resolved: { label: 'Completed',   cls: 'completed' },
}

const ACTION_STATUS = [
  { value: 'raised',   label: 'OPEN' },
  { value: 'received', label: 'IN PROGRESS' },
  { value: 'resolved', label: 'COMPLETED' },
]

const ALL_COLS = [
  { key: 'ticket_id',    label: 'Ticket Id',       def: true,  pin: true  },
  { key: 'test_name',    label: 'Test Name',        def: true,  pin: false },
  { key: 'status',       label: 'Current Status',   def: true,  pin: false },
  { key: 'category',     label: 'Category',         def: true,  pin: false },
  { key: 'sub_option',   label: 'Sub Category 1',   def: true,  pin: false },
  { key: 'subject',      label: 'Subject',          def: false, pin: false },
  { key: 'description',  label: 'Description',      def: true,  pin: false },
  { key: 'claimed_by',   label: 'Claimed By',       def: true,  pin: false },
  { key: 'sla',          label: 'SLA',              def: true,  pin: false },
  { key: 'entity_id',    label: 'Entity Id',        def: false, pin: false },
  { key: 'faculty',      label: 'Faculty',          def: false, pin: false },
  { key: 'completed_at', label: 'Completed At',     def: false, pin: false },
  { key: 'escalated',    label: 'Escalated',        def: false, pin: false },
  { key: 'priority',     label: 'Priority',         def: true,  pin: true  },
]

const RESOLUTION_CODES = [
  { value: '',                 label: 'Select resolution code…' },
  { value: 'answered',         label: 'Answered — Doubt resolved' },
  { value: 'content_fixed',    label: 'Content Fixed — Question updated' },
  { value: 'duplicate',        label: 'Duplicate — Already reported' },
  { value: 'not_reproducible', label: 'Not Reproducible' },
  { value: 'workaround',       label: 'Workaround Provided' },
  { value: 'escalated_eng',    label: 'Escalated to Engineering' },
]

const SIDEBAR_ITEMS = [
  { icon: '⌂', label: 'Home' },
  { icon: '☑', label: 'Tasks' },
  { icon: '◎', label: 'Reports' },
  { icon: '◉', label: 'Monitor' },
  { icon: '◷', label: 'Schedule' },
  { icon: '⊙', label: 'People' },
  { icon: '🎟', label: 'Tickets', active: true },
]

const NAV_TABS = ['Process', 'Learning', 'Assessment', 'Action Point', 'Asset Ticket']

// ── Helpers ────────────────────────────────────────────────────────────────

function getSlaMs(q) { return new Date(q.timestamp).getTime() + q.sla_hours * 3600000 - Date.now() }

function getPriority(q) {
  if (q.timeline_status === 'resolved') return null
  const ms = getSlaMs(q)
  if (ms <= 0 || ms <= 2 * 3600000) return { label: 'Highest', cls: 'highest', icon: '↑' }
  if (ms <= 8 * 3600000)            return { label: 'High',    cls: 'high',    icon: '↑' }
  if (ms <= 24 * 3600000)           return { label: 'Medium',  cls: 'medium',  icon: '=' }
  return { label: 'Low', cls: 'low', icon: '↓' }
}

function getSlaText(q) {
  if (q.timeline_status === 'resolved') return '—'
  const ms = getSlaMs(q)
  if (ms <= 0) return 'Breached'
  const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return `${h}h ${m}m`
}

function isOverdue(q) { return q.timeline_status !== 'resolved' && getSlaMs(q) <= 0 }
function isDueToday(q) { const ms = getSlaMs(q); return q.timeline_status !== 'resolved' && ms > 0 && ms <= 24 * 3600000 }

function timeAgo(iso) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1)  return `${h}h ago`
  if (m < 1)   return 'just now'
  return `${m}m ago`
}

function fmtDt(iso) {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function buildTimeline(q) {
  const events = []
  events.push({ actor: 'SYSTEM', isSystem: true, time: q.timestamp, text: 'created this ticket' })
  if (q.faculty_assigned_at) {
    events.push({ actor: 'SYSTEM', isSystem: true, time: q.faculty_assigned_at, text: `routed to faculty: ${q.faculty_assigned}` })
  }
  if (q.escalated_engineering) {
    events.push({ actor: q.claimed_by?.split(' — ')[0] || 'Agent', isSystem: false, time: q.timestamp, text: 'escalated ticket to Engineering' })
  }
  ;(q.notes || []).forEach(n => events.push({
    actor: n.author.split(' — ')[0],
    isSystem: false,
    time: n.timestamp,
    text: n.type === 'revision_request' ? `requested revision: "${n.text}"` : n.text,
    isComment: n.type !== 'revision_request',
  }))
  if (q.resolved_at) {
    events.push({ actor: q.claimed_by?.split(' — ')[0] || q.faculty_assigned || 'SYSTEM', isSystem: !q.claimed_by, time: q.resolved_at, text: 'changed ticket status to COMPLETED' })
  }
  if (q.escalation_resolved) {
    events.push({ actor: 'Manager', isSystem: false, time: q.resolved_at, text: 'closed escalation — ticket resolved' })
  }
  return events.filter(e => e.time).sort((a, b) => new Date(b.time) - new Date(a.time))
}

function getColValue(q, colKey) {
  switch (colKey) {
    case 'ticket_id':    return q.ticket_id
    case 'test_name':    return q.test_name || q.subject_name || '—'
    case 'status':       return STATUS_DISPLAY[q.timeline_status]?.label || q.timeline_status
    case 'category':     return q.category
    case 'sub_option':   return q.sub_option
    case 'subject':      return q.subject || q.subject_name || '—'
    case 'description':  return q.query_text ? q.query_text.slice(0, 50) + (q.query_text.length > 50 ? '…' : '') : '—'
    case 'claimed_by':   return q.claimed_by ? q.claimed_by.split(' — ')[0] : '—'
    case 'sla':          return getSlaText(q)
    case 'entity_id':    return `eid_${q.question_id || '—'}`
    case 'faculty':      return q.faculty_assigned || '—'
    case 'completed_at': return q.resolved_at ? fmtDt(q.resolved_at) : 'N/A'
    case 'escalated':    return q.escalated_engineering ? 'Yes' : 'No'
    default:             return '—'
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PriorityBadge({ q }) {
  const p = getPriority(q)
  if (!p) return <span style={{ color: '#9CA3AF', fontSize: 11 }}>—</span>
  return <span className={`tq-priority tq-priority-${p.cls}`}>{p.icon} {p.label}</span>
}

function SlaCell({ q }) {
  const ms = getSlaMs(q)
  if (q.timeline_status === 'resolved') return <span style={{ color: '#9CA3AF', fontSize: 11 }}>Closed</span>
  const txt = getSlaText(q)
  const color = ms <= 0 ? '#EF4444' : ms <= 8 * 3600000 ? '#F59E0B' : '#374151'
  return <span style={{ fontSize: 12, fontWeight: ms <= 0 ? 700 : 500, color }}>{txt}</span>
}

function StatusText({ status }) {
  const s = STATUS_DISPLAY[status] || { label: status, cls: 'open' }
  return <span className={`tq-status-txt tq-status-${s.cls}`}>{s.label}</span>
}

// ── Column Config Modal (Image 3) ──────────────────────────────────────────

function ColumnConfigModal({ visibleCols, pinnedCols, setVisibleCols, setPinnedCols, onClose }) {
  const [draftVis,  setDraftVis]  = useState({ ...visibleCols })
  const [draftPins, setDraftPins] = useState({ ...pinnedCols })
  const [tab, setTab] = useState('columns')

  const toggleVis  = (key) => setDraftVis(d  => ({ ...d,  [key]: !d[key] }))
  const togglePin  = (key) => setDraftPins(d => ({ ...d,  [key]: !d[key] }))

  const visibleList = ALL_COLS.filter(c => draftVis[c.key])

  const save = () => { setVisibleCols(draftVis); setPinnedCols(draftPins); onClose() }

  return (
    <div className="tq-modal-overlay" onClick={onClose}>
      <div className="tq-modal" onClick={e => e.stopPropagation()} style={{ width: 680 }}>
        <div className="tq-modal-hdr">
          <span className="tq-modal-title">
            {tab === 'columns' ? 'Column Display and Order Configuration' : 'Miscellaneous Configurations'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', borderRadius: 6, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <button onClick={() => setTab('columns')} className={`tq-modal-tab${tab === 'columns' ? ' active' : ''}`}>Columns</button>
              <button onClick={() => setTab('misc')}    className={`tq-modal-tab${tab === 'misc' ? ' active' : ''}`}>Pin / Misc</button>
            </div>
            <button className="tq-modal-x" onClick={onClose}>×</button>
          </div>
        </div>

        {tab === 'columns' ? (
          <div className="tq-modal-body">
            <div className="tq-col-grid">
              <div className="tq-col-left">
                {ALL_COLS.map(c => (
                  <label key={c.key} className="tq-col-row">
                    <input type="checkbox" checked={!!draftVis[c.key]} onChange={() => toggleVis(c.key)} />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
              <div className="tq-col-right">
                {visibleList.map((c, i) => (
                  <div key={c.key} className="tq-col-order-item">
                    <span className="tq-col-drag">≡</span>
                    <span>{i + 1} — {c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="tq-modal-body">
            <div className="tq-misc-section">
              <div className="tq-misc-section-hdr">
                <span>▼</span> <span>Pin Column(s)</span>
              </div>
              <div className="tq-pin-pills">
                {ALL_COLS.filter(c => draftVis[c.key]).map(c => (
                  <button key={c.key} className={`tq-pin-pill${draftPins[c.key] ? ' pinned' : ''}`} onClick={() => togglePin(c.key)}>
                    {c.label} <span className="tq-pin-icon">{draftPins[c.key] ? '📌' : '📍'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="tq-modal-footer">
          <button className="tq-save-btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Ticket Detail Panel (Image 1) ──────────────────────────────────────────

function TicketPanel({ ticket, allTickets, user, onClose, onPrev, onNext, hasPrev, hasNext, mutations, addNotification }) {
  const { claimTicket, advanceStatus, resolveWithCode, addNote, escalateToEngineering, closeEscalation, assignToFaculty } = mutations
  const [detailsOpen,    setDetailsOpen]    = useState(true)
  const [resolveOpen,    setResolveOpen]    = useState(false)
  const [resolveCode,    setResolveCode]    = useState('')
  const [resolveText,    setResolveText]    = useState('')
  const [commentText,    setCommentText]    = useState('')
  const [showReassign,   setShowReassign]   = useState(false)
  const [actionOpen,     setActionOpen]     = useState(false)
  const commentRef = useRef(null)

  const q = ticket
  if (!q) return null

  const status    = STATUS_DISPLAY[q.timeline_status] || { label: q.timeline_status, cls: 'open' }
  const priority  = getPriority(q)
  const timeline  = buildTimeline(q)
  const assignee  = q.claimed_by || q.faculty_assigned || null
  const isResolved = q.timeline_status === 'resolved'
  const isEscalated = q.feedback_type === 'thumbs_down' && !q.escalation_resolved

  const canClaim = user.role !== 'faculty' && !q.claimed_by && !q.faculty_assigned && q.timeline_status === 'raised'
  const canResolve = (
    (user.role === 'agent'   && (q.claimed_by === user.fullName) && !isResolved) ||
    (user.role === 'manager' && !isResolved) ||
    (user.role === 'faculty' && q.faculty_assigned === user.fullName && !isResolved)
  )
  const canEscalate = !q.escalated_engineering && !isResolved && (user.role === 'manager' || (user.role === 'agent' && q.claimed_by === user.fullName))
  const canReassign = user.role === 'manager'
  const canAdvance  = !isResolved && (
    (user.role === 'agent' && q.claimed_by === user.fullName) ||
    user.role === 'manager'
  )

  const allAgents   = AGENTS.map(a => `${a.name} — ${a.team}`)
  const allFaculty  = FACULTY.map(f => f.name)

  const handleClaim = () => {
    claimTicket(q.ticket_id, user.fullName)
    addNotification('Content Queries', `${user.name} claimed #${q.ticket_id}`, q.ticket_id)
  }

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'resolved') { setResolveOpen(true); setActionOpen(false); return }
    if (newStatus === 'received' && !q.claimed_by) {
      claimTicket(q.ticket_id, user.fullName)
    } else {
      advanceStatus(q.ticket_id, newStatus)
    }
    setActionOpen(false)
    addNotification('Content Queries', `#${q.ticket_id} → ${STATUS_DISPLAY[newStatus]?.label}`, q.ticket_id)
  }

  const handleResolve = () => {
    if (!resolveCode) return
    resolveWithCode(q.ticket_id, resolveCode, resolveText)
    addNotification('Content Queries', `#${q.ticket_id} resolved · ${resolveCode}`, q.ticket_id)
    setResolveOpen(false); setResolveCode(''); setResolveText('')
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addNote(q.ticket_id, commentText.trim(), user.fullName)
    setCommentText('')
  }

  const handleEscalate = () => {
    escalateToEngineering(q.ticket_id)
    addNotification('General', `Manager escalated #${q.ticket_id} to Engineering`, q.ticket_id)
  }

  const handleReassign = (target) => {
    if (allFaculty.includes(target)) assignToFaculty(q.ticket_id, target)
    else claimTicket(q.ticket_id, target)
    setShowReassign(false)
    addNotification('Content Queries', `Manager reassigned #${q.ticket_id} → ${target}`, q.ticket_id)
  }

  const availableStatuses = ACTION_STATUS.filter(s => {
    if (s.value === q.timeline_status) return false
    if (user.role === 'faculty') return s.value === 'resolved'
    if (user.role === 'agent') {
      if (q.claimed_by && q.claimed_by !== user.fullName) return false
      if (!q.claimed_by && s.value !== 'received') return false
      return true
    }
    return true // manager sees all
  })

  const initials = (name) => name ? name.split(' ').filter(Boolean).map(w => w[0]).join('').replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase() : '?'

  return (
    <>
      <div className="tq-panel-overlay" onClick={onClose} />
      <div className="tq-panel">
        {/* Panel header */}
        <div className="tq-panel-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="tq-panel-x" onClick={onClose}>×</button>
            <span className="tq-panel-title-txt">Ticket Details</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="tq-panel-icon-btn" title="Info">ℹ</button>
            <button className="tq-panel-icon-btn" title="Edit">✎</button>
            <button className="tq-panel-icon-btn" onClick={onPrev} disabled={!hasPrev} title="Previous">‹</button>
            <button className="tq-panel-icon-btn" onClick={onNext} disabled={!hasNext} title="Next">›</button>
          </div>
        </div>

        <div className="tq-panel-body">
          {/* Ticket meta */}
          <div className="tq-panel-meta">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="tq-panel-ticket-title">{q.sub_option}</span>
              <span className={`tq-panel-status-badge tq-status-pill-${status.cls}`}>{status.label.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>📚</span>
              <span className="tq-panel-sub-link">{q.test_name || q.subject_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
              <span>Ticket Id: <strong style={{ color: '#111827' }}>{q.ticket_id}</strong></span>
            </div>

            {/* Action row */}
            <div className="tq-panel-action-row">
              <div style={{ position: 'relative' }}>
                <button className="tq-action-dropdown" onClick={() => setActionOpen(o => !o)}>
                  <span className={`tq-adrop-status tq-status-${status.cls}`}>{status.label.toUpperCase()}</span>
                  <span className="tq-adrop-arrow">▾</span>
                </button>
                {actionOpen && availableStatuses.length > 0 && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setActionOpen(false)} />
                    <div className="tq-action-menu">
                      {availableStatuses.map(s => (
                        <button key={s.value} className="tq-action-menu-item" onClick={() => handleStatusChange(s.value)}>{s.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {assignee && (
                <div className="tq-panel-claimed">
                  <div className="tq-claimant-dot" style={{ background: user.color || '#6B7280' }}>
                    {initials(assignee.split(' — ')[0])}
                  </div>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    Claimed by <strong>{assignee.split(' — ')[0]}</strong>
                  </span>
                </div>
              )}
              {!assignee && !isResolved && (
                <button className="tq-claim-btn" onClick={handleClaim} disabled={!canClaim && user.role !== 'manager'}>
                  {canClaim ? '✋ Claim Ticket' : user.role === 'manager' ? '✋ Claim & Handle' : 'Unclaimed'}
                </button>
              )}
              <button className="tq-pdf-btn">↓ Download PDF</button>
            </div>
          </div>

          {/* Info fields */}
          <div className="tq-panel-fields">
            <div className="tq-panel-field-row">
              <span className="tq-field-label">Description:</span>
              <span className="tq-field-val">{q.query_text || '—'}</span>
            </div>
            <div className="tq-panel-field-row">
              <span className="tq-field-label">Escalated:</span>
              <span className="tq-field-val">{q.escalated_engineering ? 'Yes — Engineering' : q.feedback_type === 'thumbs_down' ? 'Yes — Student' : 'No'}</span>
            </div>
            <div className="tq-panel-field-row">
              <span className="tq-field-label">Question:</span>
              <span className="tq-field-val">{q.question_text ? `Q${q.question_num || ''}: ${q.question_text.slice(0, 80)}…` : `Q#${q.question_id}`}</span>
            </div>
            {q.escalated_engineering && (
              <div className="tq-eng-banner-sm">⚙ Escalated to Engineering</div>
            )}
          </div>

          {/* Details accordion */}
          <div className="tq-panel-section">
            <button className="tq-accordion-hdr" onClick={() => setDetailsOpen(o => !o)}>
              <span>Details</span>
              <span>{detailsOpen ? '▲' : '▼'}</span>
            </button>
            {detailsOpen && (
              <div className="tq-accordion-body">
                <div className="tq-detail-row">
                  <span className="tq-detail-label">Created by:</span>
                  <span className="tq-detail-val">Student</span>
                </div>
                <div className="tq-detail-row">
                  <span className="tq-detail-label">Created at:</span>
                  <span className="tq-detail-val">{fmtDt(q.timestamp)}</span>
                </div>
                {q.faculty_assigned_at && (
                  <div className="tq-detail-row">
                    <span className="tq-detail-label">Assigned at:</span>
                    <span className="tq-detail-val">{fmtDt(q.faculty_assigned_at)}</span>
                  </div>
                )}
                <div className="tq-detail-row">
                  <span className="tq-detail-label">SLA Deadline:</span>
                  <span className="tq-detail-val" style={{ color: getSlaMs(q) <= 0 && !isResolved ? '#EF4444' : '#111827' }}>
                    {fmtDt(new Date(new Date(q.timestamp).getTime() + q.sla_hours * 3600000).toISOString())}
                  </span>
                </div>
                <div className="tq-detail-row">
                  <span className="tq-detail-label">Priority:</span>
                  <span className="tq-detail-val">
                    {priority ? <span className={`tq-priority tq-priority-${priority.cls}`}>{priority.icon} {priority.label}</span> : <span style={{ color: '#9CA3AF' }}>Closed</span>}
                  </span>
                </div>
                <div className="tq-detail-row" style={{ alignItems: 'flex-start' }}>
                  <span className="tq-detail-label">Assigned to:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {assignee ? (
                      <span className="tq-assignee-chip">
                        {assignee.split(' — ')[0]}
                        {canReassign && <button onClick={() => { /* just show reassign */ setShowReassign(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6B7280', padding: '0 2px', marginLeft: 2 }}>×</button>}
                      </span>
                    ) : <span style={{ color: '#9CA3AF', fontSize: 12 }}>Unassigned</span>}
                    {canReassign && (
                      <div style={{ position: 'relative' }}>
                        <button className="tq-reassign-btn" onClick={() => setShowReassign(o => !o)}>🔄 Reassign</button>
                        {showReassign && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowReassign(false)} />
                            <div className="tq-reassign-menu">
                              <div className="tq-reassign-group-hdr">Content Agents</div>
                              {allAgents.map(a => <button key={a} className="tq-reassign-item" onClick={() => handleReassign(a)}>{a.split(' — ')[0]}</button>)}
                              <div className="tq-reassign-group-hdr">Faculty</div>
                              {allFaculty.map(f => <button key={f} className="tq-reassign-item" onClick={() => handleReassign(f)}>{f}</button>)}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isResolved && (
                  <>
                    <div className="tq-detail-row">
                      <span className="tq-detail-label">Completed at:</span>
                      <span className="tq-detail-val">{fmtDt(q.resolved_at)}</span>
                    </div>
                    {q.resolution_code && (
                      <div className="tq-detail-row">
                        <span className="tq-detail-label">Resolution:</span>
                        <span className="tq-detail-val">{q.resolution_code.replace(/_/g,' ')}</span>
                      </div>
                    )}
                    {q.satisfaction_score != null && (
                      <div className="tq-detail-row">
                        <span className="tq-detail-label">CSAT:</span>
                        <span className="tq-detail-val" style={{ color: q.satisfaction_score >= 4 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{'★'.repeat(Math.round(q.satisfaction_score))} {q.satisfaction_score}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="tq-detail-row">
                  <span className="tq-detail-label">Route:</span>
                  <span className="tq-detail-val" style={{ color: '#534AB7', fontWeight: 600 }}>{q.routed_to}</span>
                </div>
                <div className="tq-detail-row">
                  <span className="tq-detail-label">Cost:</span>
                  <span className="tq-detail-val" style={{ color: '#9CA3AF' }}>—</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isResolved && (
            <div className="tq-panel-actions">
              {canClaim && (
                <button className="tq-panel-action-btn tq-btn-claim" onClick={handleClaim}>✋ Claim Ticket</button>
              )}
              {canEscalate && !q.escalated_engineering && (
                <button className="tq-panel-action-btn tq-btn-escalate" onClick={handleEscalate}>⚙ Escalate to Engineering</button>
              )}
              {canResolve && !resolveOpen && (
                <button className="tq-panel-action-btn tq-btn-resolve" onClick={() => setResolveOpen(true)}>✓ Mark Resolved</button>
              )}
            </div>
          )}

          {/* Resolve form */}
          {resolveOpen && (
            <div className="tq-resolve-form">
              <div className="tq-resolve-title">Close Ticket</div>
              <select className="tq-resolve-select" value={resolveCode} onChange={e => setResolveCode(e.target.value)}>
                {RESOLUTION_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <textarea className="tq-resolve-ta" placeholder="Resolution summary (optional)…" value={resolveText} onChange={e => setResolveText(e.target.value)} rows={3} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="tq-resolve-confirm" disabled={!resolveCode} onClick={handleResolve}>Confirm & Close</button>
                <button className="tq-resolve-cancel" onClick={() => setResolveOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Escalation action for manager (thumbs down) */}
          {isEscalated && user.role === 'manager' && (
            <div className="tq-esc-alert">
              <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>⚠ Student Escalated — Action Required</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 12 }}>Student was not satisfied with the resolution. Please review and close the escalation.</div>
              {q.resolution_text && (
                <div style={{ fontSize: 12, color: '#4C1D95', background: '#F5F3FF', padding: '8px 10px', borderRadius: 6, marginBottom: 10 }}>Previous answer: "{q.resolution_text}"</div>
              )}
              <textarea className="tq-resolve-ta" placeholder="Write updated resolution…" value={resolveText} onChange={e => setResolveText(e.target.value)} rows={3} />
              <button className="tq-resolve-confirm" disabled={!resolveText.trim()} onClick={() => { closeEscalation(q.ticket_id, resolveText); setResolveText('') }}>Close Escalation</button>
            </div>
          )}

          {/* Comment / Timeline section */}
          <div className="tq-panel-section">
            <div className="tq-comment-section-hdr">
              <span>💬</span>
              <span>Comment:</span>
            </div>
            <div className="tq-timeline">
              {timeline.map((ev, i) => (
                <div key={i} className="tq-timeline-item">
                  <div className={`tq-tl-avatar${ev.isSystem ? ' system' : ''}`}>{ev.isSystem ? '' : ev.actor.slice(0, 2).toUpperCase()}</div>
                  <div className="tq-tl-body">
                    <div className="tq-tl-meta">
                      <span className="tq-tl-actor">{ev.actor}</span>
                      <span className="tq-tl-time">{fmtDt(ev.time)}</span>
                    </div>
                    <div className={`tq-tl-text${ev.isComment ? ' comment' : ''}`}>{ev.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tq-comment-input-row">
              <input
                ref={commentRef}
                className="tq-comment-input"
                placeholder="Write a Comment"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              />
              <button className="tq-comment-attach" title="Attach">📎</button>
              <button className="tq-comment-send" onClick={handleAddComment} disabled={!commentText.trim()}>▶</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main Dashboard Component ───────────────────────────────────────────────

export default function UnifiedDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { queries, claimTicket, assignToFaculty, advanceStatus, resolveWithCode, addNote, escalateToEngineering, closeEscalation } = useQueries()
  const { addNotification } = useNotifications()

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])

  const [statusTab, setStatusTab] = useState('total')
  const [search,    setSearch]    = useState('')
  const [dateFrom,  setDateFrom]  = useState(() => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().split('T')[0] })
  const [dateTo,    setDateTo]    = useState(() => new Date().toISOString().split('T')[0])
  const [selectedId, setSelectedId] = useState(null)
  const [showColCfg, setShowColCfg] = useState(false)
  const [sortCol,  setSortCol]  = useState('ticket_id')
  const [sortDir,  setSortDir]  = useState('desc')
  const [visibleCols, setVisibleCols] = useState(() => {
    const v = {}; ALL_COLS.forEach(c => { v[c.key] = c.def }); return v
  })
  const [pinnedCols, setPinnedCols] = useState(() => {
    const v = {}; ALL_COLS.forEach(c => { v[c.key] = c.pin }); return v
  })

  const visibleTickets = useMemo(() => {
    if (!user) return []
    if (user.role === 'faculty') return queries.filter(q => q.faculty_assigned === user.fullName || q.routed_to === 'faculty')
    if (user.role === 'agent')   return queries.filter(q => q.routed_to === 'content' || q.claimed_by === user.fullName)
    return queries
  }, [queries, user])

  const counts = useMemo(() => ({
    total:     visibleTickets.length,
    open:      visibleTickets.filter(q => q.timeline_status === 'raised').length,
    inprogress:visibleTickets.filter(q => ['received','assigned'].includes(q.timeline_status)).length,
    completed: visibleTickets.filter(q => q.timeline_status === 'resolved').length,
    overdue:   visibleTickets.filter(isOverdue).length,
    today:     visibleTickets.filter(isDueToday).length,
    escalated: visibleTickets.filter(q => q.feedback_type === 'thumbs_down' && !q.escalation_resolved).length,
  }), [visibleTickets])

  const filteredTickets = useMemo(() => {
    let rows = visibleTickets
    if (statusTab === 'open')       rows = rows.filter(q => q.timeline_status === 'raised')
    if (statusTab === 'inprogress') rows = rows.filter(q => ['received','assigned'].includes(q.timeline_status))
    if (statusTab === 'completed')  rows = rows.filter(q => q.timeline_status === 'resolved')
    if (statusTab === 'overdue')    rows = rows.filter(isOverdue)
    if (statusTab === 'today')      rows = rows.filter(isDueToday)
    if (statusTab === 'escalated')  rows = rows.filter(q => q.feedback_type === 'thumbs_down' && !q.escalation_resolved)
    if (search.trim()) {
      const s = search.toLowerCase()
      rows = rows.filter(q => q.ticket_id.toLowerCase().includes(s) || q.sub_option.toLowerCase().includes(s) || q.category.toLowerCase().includes(s) || (q.query_text||'').toLowerCase().includes(s))
    }
    const ms = (q) => new Date(q.timestamp).getTime()
    const comp = sortCol === 'sla'
      ? (a, b) => sortDir === 'asc' ? getSlaMs(a) - getSlaMs(b) : getSlaMs(b) - getSlaMs(a)
      : (a, b) => sortDir === 'asc' ? ms(a) - ms(b) : ms(b) - ms(a)
    return [...rows].sort(comp)
  }, [visibleTickets, statusTab, search, sortCol, sortDir])

  const selectedIdx   = filteredTickets.findIndex(q => q.ticket_id === selectedId)
  const selectedTicket = selectedIdx >= 0 ? filteredTickets[selectedIdx] : null

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const SH = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const activeCols = ALL_COLS.filter(c => c.key !== 'priority' && visibleCols[c.key])

  const PILLS = [
    { key: 'total',      label: 'Total',       cnt: counts.total,      badge: 'blue'   },
    { key: 'open',       label: 'Open',        cnt: counts.open,       badge: 'blue'   },
    { key: 'inprogress', label: 'In Progress', cnt: counts.inprogress, badge: 'orange' },
    { key: 'completed',  label: 'Completed',   cnt: counts.completed,  badge: null     },
    { key: '|' },
    { key: 'overdue',    label: 'Overdue',     cnt: counts.overdue,    badge: 'red'    },
    { key: 'today',      label: 'Due Today',   cnt: counts.today,      badge: null     },
    ...(user?.role === 'manager' ? [{ key: 'escalated', label: 'Escalated', cnt: counts.escalated, badge: 'red' }] : []),
  ]

  if (!user) return null

  const mutations = { claimTicket, assignToFaculty, advanceStatus, resolveWithCode, addNote, escalateToEngineering, closeEscalation }

  return (
    <div className="tq-shell">
      {/* ── Left icon sidebar ── */}
      <aside className="tq-sidebar">
        <button className="tq-sidebar-expand">»</button>
        {SIDEBAR_ITEMS.map(item => (
          <button key={item.label} className={`tq-sidebar-icon${item.active ? ' active' : ''}`} title={item.label}>
            {item.icon}
          </button>
        ))}
        <div className="tq-sidebar-spacer" />
        <button className="tq-sidebar-icon" title="Add">＋</button>
        <button className="tq-sidebar-icon" title="Settings">⚙</button>
        <button className="tq-sidebar-icon tq-sidebar-logout" title="Logout" onClick={() => { logout(); navigate('/login') }}>⏻</button>
        <div className="tq-sidebar-label">tactics</div>
      </aside>

      {/* ── Main area ── */}
      <div className="tq-main">
        {/* Top bar */}
        <header className="tq-topbar">
          <div className="tq-topbar-left">
            <div className="tq-topbar-logo">
              <div className="tq-logo-mark">NP</div>
            </div>
            <nav className="tq-nav-tabs">
              {NAV_TABS.map(t => (
                <button key={t} className="tq-nav-tab">{t} ▾</button>
              ))}
              <button className="tq-nav-tab tq-nav-tab--active">Ticket</button>
            </nav>
          </div>
          <div className="tq-topbar-right">
            <button className="tq-back-btn" onClick={() => navigate('/nprep')}>‹ Back</button>
            <button className="tq-bell-btn" title="Notifications">
              🔔
              <span className="tq-bell-badge">{counts.open + counts.overdue}</span>
            </button>
            <div className="tq-user-area">
              <div className="tq-user-avatar" style={{ background: user.color }}>{user.initials}</div>
              <span className="tq-user-name">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="tq-content">
          {/* Title + status pills */}
          <div className="tq-page-header">
            <h1 className="tq-page-title">Tickets Overview</h1>
            <div className="tq-status-pills">
              {PILLS.map((pill, i) => {
                if (pill.key === '|') return <div key={i} className="tq-pill-divider" />
                return (
                  <button
                    key={pill.key}
                    className={`tq-status-pill${statusTab === pill.key ? ' tq-pill--active' : ''}`}
                    onClick={() => setStatusTab(pill.key)}
                  >
                    {pill.label}
                    {pill.cnt > 0 && <span className={`tq-pill-badge${pill.badge ? ` tq-badge-${pill.badge}` : ''}`}>{pill.cnt}</span>}
                  </button>
                )
              })}
              <button className="tq-status-pill tq-pill-dropdown">Active ▾</button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="tq-toolbar">
            <div className="tq-toolbar-left">
              <div className="tq-search-wrap">
                <span className="tq-search-icon">🔍</span>
                <input className="tq-search-inp" placeholder="Search Tickets…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="tq-toolbar-icon">📅</span>
                <input type="date" className="tq-date-inp" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="tq-toolbar-icon">📅</span>
                <input type="date" className="tq-date-inp" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <button className="tq-apply-btn">Apply</button>
              <button className="tq-more-btn">•••</button>
            </div>
            <div className="tq-toolbar-right">
              <button className="tq-export-btn">↓ Export CSV ▾</button>
              <button className="tq-load-btn">🔄 Load More</button>
              <span className="tq-count-txt">{filteredTickets.length} / {visibleTickets.length}</span>
              <button className="tq-col-cfg-btn" onClick={() => setShowColCfg(true)} title="Configure Columns">⊞</button>
            </div>
          </div>

          {/* Table */}
          <div className="tq-table-wrap">
            <table className="tq-table">
              <thead>
                <tr>
                  <th className="tq-th-check"><input type="checkbox" /></th>
                  {activeCols.map(c => (
                    <th key={c.key} className="tq-th" onClick={() => ['ticket_id','sla'].includes(c.key) && handleSort(c.key)} style={{ cursor: ['ticket_id','sla'].includes(c.key) ? 'pointer' : 'default' }}>
                      {c.label}{['ticket_id','sla'].includes(c.key) ? SH(c.key) : ''} {c.key !== 'ticket_id' && <span className="tq-th-sort">↑↓</span>}
                    </th>
                  ))}
                  {visibleCols.priority && <th className="tq-th tq-th-priority">Priority</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr><td colSpan={activeCols.length + 2} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 13 }}>No tickets match this filter</td></tr>
                ) : filteredTickets.map(q => (
                  <tr
                    key={q.ticket_id}
                    className={`tq-tr${selectedId === q.ticket_id ? ' tq-tr--selected' : ''}${isOverdue(q) ? ' tq-tr--overdue' : ''}`}
                    onClick={() => setSelectedId(q.ticket_id)}
                  >
                    <td className="tq-td-check" onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                    {activeCols.map(c => (
                      <td key={c.key} className={`tq-td${c.key === 'description' ? ' tq-td--desc' : ''}`}>
                        {c.key === 'ticket_id'
                          ? <span className="tq-ticket-link">{q.ticket_id}</span>
                          : c.key === 'status'
                          ? <StatusText status={q.timeline_status} />
                          : c.key === 'sla'
                          ? <SlaCell q={q} />
                          : <span className="tq-td-txt">{getColValue(q, c.key)}</span>
                        }
                      </td>
                    ))}
                    {visibleCols.priority && (
                      <td className="tq-td tq-td-priority"><PriorityBadge q={q} /></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket detail slide panel */}
      {selectedTicket && (
        <TicketPanel
          ticket={selectedTicket}
          allTickets={filteredTickets}
          user={user}
          onClose={() => setSelectedId(null)}
          onPrev={() => selectedIdx > 0 && setSelectedId(filteredTickets[selectedIdx - 1].ticket_id)}
          onNext={() => selectedIdx < filteredTickets.length - 1 && setSelectedId(filteredTickets[selectedIdx + 1].ticket_id)}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < filteredTickets.length - 1}
          mutations={mutations}
          addNotification={addNotification}
        />
      )}

      {/* Column config modal */}
      {showColCfg && (
        <ColumnConfigModal
          visibleCols={visibleCols}
          pinnedCols={pinnedCols}
          setVisibleCols={setVisibleCols}
          setPinnedCols={setPinnedCols}
          onClose={() => setShowColCfg(false)}
        />
      )}
    </div>
  )
}
