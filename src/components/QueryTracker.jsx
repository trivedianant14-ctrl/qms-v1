import { useState } from 'react'
import { useQueries } from '../context/QueryContext'

const P = '#534AB7', PL = '#EEEDFE', PB = '#AFA9EC', PD = '#3C3489'
const T1 = '#1a1a2e', T2 = '#5a5a78', T3 = '#9898b0', BD = '#e8e8f2', BG2 = '#f5f5fb'
const GREEN = '#22C55E', GREEN_BG = '#F0FDF4', GREEN_BORDER = '#86EFAC'
const ORANGE = '#E07B2A', ORANGE_BG = '#FFF3E8'

const CATEGORY_META = {
  'Problem with the Answer':    { color: '#DC2626', bg: '#FEF2F2', abbr: '✗' },
  "Can't See Something":        { color: '#2563EB', bg: '#EFF6FF', abbr: '👁' },
  'I Have a Doubt':             { color: '#16A34A', bg: '#F0FDF4', abbr: '?' },
  'Problem with this Question': { color: '#EA580C', bg: '#FFF7ED', abbr: '!' },
  Others:                       { color: '#7C3AED', bg: '#F5F3FF', abbr: '…' },
  'Wrong Answer':               { color: '#DC2626', bg: '#FEF2F2', abbr: '✗' },
  'Explanation Gap':            { color: '#16A34A', bg: '#F0FDF4', abbr: '?' },
  'Not the Right Question':     { color: '#EA580C', bg: '#FFF7ED', abbr: '!' },
}

const STAGE_FROM_STATUS = { raised: 0, received: 1, assigned: 2, resolved: 3 }

const AGENTS = [
  { name: 'Priya S.',  team: 'Content QA',  avatar: 'P', color: '#7C3AED' },
  { name: 'Rahul M.',  team: 'Content QA',  avatar: 'R', color: '#0369A1' },
  { name: 'Sneha T.',  team: 'Engineering', avatar: 'S', color: '#059669' },
  { name: 'Amit K.',   team: 'Educator',    avatar: 'A', color: '#DC2626' },
]

const STAGE_LABELS = ['Raised', 'In Review', 'Working', 'Resolved']
const STAGE_COLORS = [P, ORANGE, '#0369A1', GREEN]

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ticketId(id) {
  return '#NP-' + String(id).slice(-5).padStart(5, '0')
}

function agentForQuery(query) {
  return AGENTS[(query.id || 0) % AGENTS.length]
}

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          style={{ background: 'none', border: 'none', padding: 2, fontSize: 28, lineHeight: 1, cursor: 'pointer', color: s <= (hovered || value) ? '#FBBF24' : '#D1D5DB', transform: hovered === s ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.1s, color 0.1s' }}
        >★</button>
      ))}
    </div>
  )
}

// ── Feedback Section ─────────────────────────────────────────────────────────
function FeedbackSection() {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [shareTestimonial, setShareTestimonial] = useState(false)

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '14px 0' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{rating === 5 ? '🎉' : '🙏'}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>
        {rating === 5 ? 'Thanks for the love!' : 'Thanks for your feedback!'}
      </div>
      <div style={{ fontSize: 11, color: T2 }}>
        {rating === 5 ? 'Your kind words help us grow.' : "We'll use this to keep improving."}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 8 }}>Rate this resolution</div>
      <StarRating value={rating} onChange={setRating} />

      {/* Text box appears for any rating */}
      {rating > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T2, marginBottom: 6 }}>
            {rating === 5 ? 'Any additional thoughts?' : 'What could we have done better?'}
          </div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder={rating === 5 ? 'Share what we got right (optional)...' : 'Tell us more (optional)...'}
            style={{ width: '100%', minHeight: 72, padding: '9px 11px', border: `1px solid ${BD}`, borderRadius: 10, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
          />

          {/* Testimonial option — only for 5 stars */}
          {rating === 5 && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 10 }}>
              <input type="checkbox" checked={shareTestimonial} onChange={e => setShareTestimonial(e.target.checked)} style={{ marginTop: 2, accentColor: P }} />
              <span style={{ fontSize: 12, color: T2 }}>I'd like to share this as a testimonial</span>
            </label>
          )}

          <button
            onClick={() => setSubmitted(true)}
            style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: P, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  )
}

// ── Timeline Step ────────────────────────────────────────────────────────────
function TimelineStep({ step, idx, activeIdx, agent, stepTimestamps, isLast, query }) {
  const [expanded, setExpanded] = useState(false)
  const status = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending'
  const meta = CATEGORY_META[query?.category] || CATEGORY_META['Others']
  const isExpandable = (step.key === 'raised' || step.key === 'resolved') && status !== 'pending'

  return (
    <div style={{ display: 'flex', gap: 12, opacity: status === 'pending' ? 0.35 : 1 }}>
      {/* Dot + connector line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'done' ? GREEN : status === 'active' ? P : 'white', border: `2px solid ${status === 'done' ? GREEN : status === 'active' ? P : BD}`, boxShadow: status === 'active' ? `0 0 0 4px ${PL}` : 'none', animation: status === 'active' ? 'tl-pulse 2s ease-in-out infinite' : 'none', flexShrink: 0 }}>
          {status === 'done'
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <div style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'active' ? 'white' : BD }} />}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: expanded ? 32 : 22, background: idx < activeIdx ? GREEN : BD, marginTop: 2, borderRadius: 1 }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, minWidth: 0 }}>
        {/* Step header — clickable if expandable */}
        <div
          onClick={isExpandable ? () => setExpanded(e => !e) : undefined}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, cursor: isExpandable ? 'pointer' : 'default', userSelect: 'none' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: status === 'pending' ? T3 : T1 }}>{step.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stepTimestamps[idx] && <span style={{ fontSize: 10, color: T3 }}>{stepTimestamps[idx]}</span>}
            {isExpandable && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2.5" strokeLinecap="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </div>
        </div>

        {/* Step subtitle */}
        <p style={{ fontSize: 11, color: T2, lineHeight: 1.5, margin: 0 }}>
          {step.key === 'assigned' && status !== 'pending'
            ? <>{agent.name} · <strong>{agent.team}</strong></>
            : step.desc}
        </p>

        {/* Agent card for assigned step */}
        {status === 'active' && step.key === 'assigned' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 10px', background: PL, borderRadius: 8, border: `1px solid ${PB}` }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{agent.avatar}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: PD }}>{agent.name}</div>
              <div style={{ fontSize: 10, color: P }}>{agent.team}</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: GREEN, animation: 'tl-pulse 1.5s ease-in-out infinite' }} />
          </div>
        )}

        {/* Expandable: Query Raised — shows original query details */}
        {expanded && step.key === 'raised' && query && (
          <div style={{ marginTop: 8, background: BG2, borderRadius: 9, border: `1px solid ${BD}`, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Your original report</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: meta.color, flexShrink: 0 }}>{meta.abbr}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{query.category}</span>
            </div>
            <div style={{ fontSize: 11, color: T1, fontWeight: 500, marginBottom: 4 }}>{query.sub_option}</div>
            {query.query_text && (
              <div style={{ fontSize: 11, color: T2, fontStyle: 'italic', lineHeight: 1.5, paddingTop: 6, borderTop: `1px solid ${BD}` }}>
                "{query.query_text}"
              </div>
            )}
          </div>
        )}

        {/* Expandable: Query Resolved — shows resolution text */}
        {expanded && step.key === 'resolved' && query?.resolution_text && (
          <div style={{ marginTop: 8, background: GREEN_BG, borderRadius: 9, border: `1px solid ${GREEN_BORDER}`, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Resolution</div>
            <p style={{ fontSize: 11, color: '#14532D', lineHeight: 1.6, margin: 0 }}>{query.resolution_text}</p>
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${GREEN_BORDER}`, fontSize: 10, color: '#166534' }}>
              Resolved by {agent.name} · {agent.team}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Query Detail View ─────────────────────────────────────────────────────────
function QueryDetailView({ query, onBack, onClose }) {
  const stage = STAGE_FROM_STATUS[query.timeline_status] ?? query.demo_stage ?? 0
  const agent = agentForQuery(query)
  const meta = CATEGORY_META[query.category] || CATEGORY_META['Others']

  const raised = new Date(query.timestamp).getTime()
  const stepTimestamps = [
    timeAgo(query.timestamp),
    stage >= 1 ? timeAgo(new Date(raised + 300000).toISOString()) : null,
    stage >= 2 ? timeAgo(new Date(raised + 900000).toISOString()) : null,
    stage >= 3 ? timeAgo(new Date(raised + 3600000 * 18).toISOString()) : null,
  ]

  const TIMELINE_STEPS = [
    { key: 'raised',   title: 'Query raised',     desc: 'Your report has been logged' },
    { key: 'received', title: 'Received by team',  desc: 'Content team has picked this up' },
    { key: 'assigned', title: 'Agent assigned',    desc: null },
    { key: 'resolved', title: 'Query resolved',    desc: 'Issue addressed' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T1, display: 'flex', padding: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T1 }}>{ticketId(query.id)}</div>
            <div style={{ fontSize: 10, color: T3 }}>Raised {timeAgo(query.timestamp)}</div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: stage === 3 ? GREEN_BG : PL, color: stage === 3 ? GREEN : P, border: `1px solid ${stage === 3 ? GREEN_BORDER : PB}` }}>
            {STAGE_LABELS[stage]}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T3, padding: 2, lineHeight: 1 }}>✕</button>
        </div>

        {/* Query summary chip */}
        <div style={{ background: BG2, borderRadius: 9, padding: '8px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: meta.color }}>{meta.abbr}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{query.category}</span>
          </div>
          <div style={{ fontSize: 11, color: T2 }}>{query.sub_option}</div>
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* Status banner */}
        {stage < 3 && (
          <div style={{ marginBottom: 16, padding: '10px 13px', borderRadius: 11, background: stage === 2 ? PL : stage === 1 ? ORANGE_BG : BG2, border: `1px solid ${stage === 2 ? PB : stage === 1 ? '#FED7AA' : BD}`, display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: STAGE_COLORS[stage], flexShrink: 0, animation: 'tl-pulse 1.5s ease-in-out infinite' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: stage === 2 ? PD : stage === 1 ? '#92400E' : T1 }}>
                {stage === 0 && 'Your query has been received'}
                {stage === 1 && 'Our team is reviewing this'}
                {stage === 2 && `${agent.name} is working on your query`}
              </div>
              <div style={{ fontSize: 10, color: T2, marginTop: 1 }}>
                {stage === 0 && 'Estimated response within 48 hours'}
                {stage === 1 && 'An agent will be assigned shortly'}
                {stage === 2 && "You'll be notified once resolved"}
              </div>
            </div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ marginBottom: 16, padding: '10px 13px', borderRadius: 11, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}`, display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Query resolved</div>
              <div style={{ fontSize: 10, color: '#166534' }}>The question has been reviewed and updated</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Timeline</div>
          {TIMELINE_STEPS.map((step, idx) => (
            <TimelineStep
              key={step.key}
              step={step}
              idx={idx}
              activeIdx={stage}
              agent={agent}
              stepTimestamps={stepTimestamps}
              isLast={idx === TIMELINE_STEPS.length - 1}
              query={query}
            />
          ))}
        </div>

        {/* Feedback — only when resolved */}
        {stage === 3 && (
          <div style={{ padding: '14px', borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
            <FeedbackSection />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Query Card ───────────────────────────────────────────────────────────────
function QueryCard({ query, onClick }) {
  const meta = CATEGORY_META[query.category] || CATEGORY_META['Others']
  const stage = STAGE_FROM_STATUS[query.timeline_status] ?? query.demo_stage ?? 0
  return (
    <button onClick={onClick}
      style={{ width: '100%', textAlign: 'left', background: 'white', border: `1px solid ${BD}`, borderRadius: 11, padding: '11px 13px', cursor: 'pointer', display: 'block', transition: 'box-shadow 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = PB; e.currentTarget.style.boxShadow = `0 2px 10px rgba(83,74,183,0.08)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: meta.color, flexShrink: 0 }}>{meta.abbr}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{query.category}</div>
          <div style={{ fontSize: 12, color: T1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.sub_option}</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T3, fontFamily: 'monospace' }}>{ticketId(query.id)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: T3 }}>{timeAgo(query.timestamp)}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: stage === 3 ? GREEN_BG : stage === 2 ? PL : stage === 1 ? ORANGE_BG : BG2,
            color: stage === 3 ? GREEN : stage === 2 ? P : stage === 1 ? ORANGE : T2,
            border: `1px solid ${stage === 3 ? GREEN_BORDER : stage === 2 ? PB : stage === 1 ? '#FED7AA' : BD}`,
          }}>
            {STAGE_LABELS[stage]}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Main Overlay ─────────────────────────────────────────────────────────────
export default function QueryTracker({ onClose }) {
  const { queries } = useQueries()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const activeCount = queries.filter(q => q.status !== 'resolved').length
  const resolvedCount = queries.filter(q => q.status === 'resolved').length

  const filtered = filter === 'all' ? queries
    : filter === 'active' ? queries.filter(q => q.status !== 'resolved')
    : queries.filter(q => q.status === 'resolved')

  if (selected) return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <QueryDetailView query={selected} onBack={() => setSelected(null)} onClose={onClose} />
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T1 }}>My Profile</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: T2, padding: 4, lineHeight: 1, display: 'flex', alignItems: 'center' }}>✕</button>
      </div>

      {/* Profile + stats */}
      <div style={{ background: P, padding: '16px 16px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: P }}>A</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Anant Trivedi</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>NORCET Gold 2024</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { label: 'Raised', value: queries.length, key: 'all' },
            { label: 'In review', value: activeCount, key: 'active' },
            { label: 'Resolved', value: resolvedCount, key: 'resolved' },
          ].map(stat => (
            <button key={stat.key} onClick={() => setFilter(stat.key)}
              style={{ background: filter === stat.key ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.11)', border: `1.5px solid ${filter === stat.key ? 'rgba(255,255,255,0.55)' : 'transparent'}`, borderRadius: 10, padding: '9px 6px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{stat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '11px 16px 7px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>My Queries</div>
          <div style={{ fontSize: 11, color: T3 }}>
            {filter === 'all' ? 'All' : filter === 'active' ? 'In review' : 'Resolved'} · {filtered.length}
          </div>
        </div>
        <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>Tap any query to see its full timeline</div>
      </div>

      {/* Query list */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T3, fontSize: 13 }}>No queries in this category</div>
        ) : (
          filtered.map(q => <QueryCard key={q.id} query={q} onClick={() => setSelected(q)} />)
        )}
      </div>
    </div>
  )
}
