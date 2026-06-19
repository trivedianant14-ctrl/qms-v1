import { useState } from 'react'
import { useQueries } from '../context/QueryContext'

const P = '#534AB7', PL = '#EEEDFE', PB = '#AFA9EC', PD = '#3C3489'
const T1 = '#1a1a2e', T2 = '#5a5a78', T3 = '#9898b0', BD = '#e8e8f2', BG2 = '#f5f5fb'
const GREEN = '#22C55E', GREEN_BG = '#F0FDF4', GREEN_BORDER = '#86EFAC'
const ORANGE = '#E07B2A', ORANGE_BG = '#FFF3E8'

const CATEGORY_META = {
  'Problem with the Answer':   { color: '#DC2626', bg: '#FEF2F2', label: 'Answer',   abbr: '✗' },
  "Can't See Something":       { color: '#2563EB', bg: '#EFF6FF', label: 'Visibility', abbr: '👁' },
  'I Have a Doubt':            { color: '#16A34A', bg: '#F0FDF4', label: 'Doubt',    abbr: '?' },
  'Problem with this Question':{ color: '#EA580C', bg: '#FFF7ED', label: 'Question', abbr: '!' },
  Others:                      { color: '#7C3AED', bg: '#F5F3FF', label: 'Other',    abbr: '…' },
  // legacy
  'Wrong Answer':              { color: '#DC2626', bg: '#FEF2F2', label: 'Answer',   abbr: '✗' },
  'Explanation Gap':           { color: '#16A34A', bg: '#F0FDF4', label: 'Doubt',    abbr: '?' },
  'Not the Right Question':    { color: '#EA580C', bg: '#FFF7ED', label: 'Question', abbr: '!' },
}

const AGENTS = [
  { name: 'Priya S.',  team: 'Content QA',  avatar: 'P', color: '#7C3AED' },
  { name: 'Rahul M.',  team: 'Content QA',  avatar: 'R', color: '#0369A1' },
  { name: 'Sneha T.',  team: 'Engineering', avatar: 'S', color: '#059669' },
  { name: 'Amit K.',   team: 'Educator',    avatar: 'A', color: '#DC2626' },
]

const TIMELINE_STEPS = [
  {
    key: 'raised',
    title: 'Query raised',
    desc: 'Your report has been logged',
    detail: "We've received your query and it's in our review queue.",
  },
  {
    key: 'received',
    title: 'Received by team',
    desc: 'Content team has picked this up',
    detail: 'Our team has acknowledged your report and will begin review shortly.',
  },
  {
    key: 'assigned',
    title: 'Agent assigned',
    desc: null, // filled dynamically with agent name
    detail: 'Your query is being actively reviewed by an expert.',
  },
  {
    key: 'resolved',
    title: 'Query resolved',
    desc: 'Issue addressed',
    detail: "We've reviewed and updated the question. Thank you for helping us improve NPrep!",
  },
]

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
  const idx = (query.id || 0) % AGENTS.length
  return AGENTS[idx]
}

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(s => {
        const filled = s <= (hovered || value)
        return (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            style={{
              background: 'none', border: 'none', padding: 2,
              fontSize: 28, lineHeight: 1, cursor: 'pointer',
              color: filled ? '#FBBF24' : '#D1D5DB',
              transform: hovered === s ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.1s, color 0.1s',
            }}
          >★</button>
        )
      })}
    </div>
  )
}

// ── Timeline Step ────────────────────────────────────────────────────────────
function TimelineStep({ step, idx, activeIdx, agent, stepTimestamps, isLast }) {
  const status = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending'
  const isPending = status === 'pending'

  return (
    <div style={{ display: 'flex', gap: 14, opacity: isPending ? 0.4 : 1 }}>
      {/* dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: status === 'done' ? GREEN : status === 'active' ? P : 'white',
          border: `2px solid ${status === 'done' ? GREEN : status === 'active' ? P : BD}`,
          boxShadow: status === 'active' ? `0 0 0 4px ${PL}` : 'none',
          animation: status === 'active' ? 'tl-pulse 2s ease-in-out infinite' : 'none',
        }}>
          {status === 'done'
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : status === 'active'
              ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
              : <div style={{ width: 8, height: 8, borderRadius: '50%', background: BD }} />}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 28, background: idx < activeIdx ? GREEN : BD, marginTop: 2, borderRadius: 1 }} />
        )}
      </div>

      {/* content */}
      <div style={{ paddingBottom: isLast ? 0 : 22, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: status === 'pending' ? T3 : T1 }}>{step.title}</span>
          {stepTimestamps[idx] && (
            <span style={{ fontSize: 10, color: T3 }}>{stepTimestamps[idx]}</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: T2, lineHeight: 1.5, margin: 0 }}>
          {step.key === 'assigned' && status !== 'pending'
            ? <>{agent.name} from <strong>{agent.team}</strong> is reviewing this</>
            : step.desc}
        </p>
        {status === 'active' && step.key === 'assigned' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 10px', background: PL, borderRadius: 8, border: `1px solid ${PB}` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{agent.avatar}</span>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: PD }}>{agent.name}</div>
              <div style={{ fontSize: 10, color: P }}>{agent.team}</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: GREEN, animation: 'tl-pulse 1.5s ease-in-out infinite' }} />
          </div>
        )}
        {status === 'done' && (
          <p style={{ fontSize: 11, color: T3, marginTop: 4, lineHeight: 1.4 }}>{step.detail}</p>
        )}
      </div>
    </div>
  )
}

// ── Feedback Section ─────────────────────────────────────────────────────────
function FeedbackSection() {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [expertOpt, setExpertOpt] = useState(false)

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{rating >= 4 ? '🎉' : '🙏'}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>
        {rating >= 4 ? 'Thanks for the love!' : 'Thanks for your feedback!'}
      </div>
      <div style={{ fontSize: 11, color: T2 }}>
        {rating >= 4 ? 'Your experience helps us improve NPrep for everyone.' : "We'll use this to do better."}
      </div>
    </div>
  )

  const isLow = rating > 0 && rating <= 3
  const isHigh = rating >= 4

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 6 }}>Rate this resolution</div>
      <StarRating value={rating} onChange={setRating} />

      {isLow && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: T2, marginBottom: 6 }}>
            We're sorry to hear that. What could we have done better? <span style={{ color: '#DC2626' }}>*</span>
          </div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Tell us what went wrong — we read every response..."
            style={{ width: '100%', minHeight: 80, padding: '10px 12px', border: `1px solid ${BD}`, borderRadius: 10, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      )}

      {isHigh && (
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={expertOpt} onChange={e => setExpertOpt(e.target.checked)} style={{ marginTop: 2, accentColor: P }} />
            <span style={{ fontSize: 12, color: T2 }}>I'd love to share my experience as a testimonial</span>
          </label>
          {expertOpt && (
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="What did we do right? (optional)"
              style={{ marginTop: 8, width: '100%', minHeight: 70, padding: '10px 12px', border: `1px solid ${PB}`, borderRadius: 10, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            />
          )}
        </div>
      )}

      {rating > 0 && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={isLow && !feedback.trim()}
          style={{
            marginTop: 12, width: '100%', padding: '10px', borderRadius: 10,
            border: 'none', background: isLow && !feedback.trim() ? '#e2e2ec' : P,
            color: isLow && !feedback.trim() ? T3 : 'white',
            fontSize: 13, fontWeight: 600, cursor: isLow && !feedback.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Submit feedback
        </button>
      )}
    </div>
  )
}

// ── Query Detail View ─────────────────────────────────────────────────────────
function QueryDetailView({ query, onBack }) {
  const [stage, setStage] = useState(2) // 0=raised 1=received 2=assigned 3=resolved
  const agent = agentForQuery(query)
  const meta = CATEGORY_META[query.category] || CATEGORY_META['Others']

  const now = Date.now()
  const raised = new Date(query.timestamp).getTime()
  const stepTimestamps = [
    timeAgo(query.timestamp),
    stage >= 1 ? timeAgo(new Date(raised + 300000).toISOString()) : null,
    stage >= 2 ? timeAgo(new Date(raised + 900000).toISOString()) : null,
    stage >= 3 ? 'Just now' : null,
  ]

  const STAGE_LABELS = ['Raised', 'In Review', 'Working on it', 'Resolved']
  const STAGE_COLORS = [P, ORANGE, '#0369A1', GREEN]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T1, display: 'flex', padding: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T1 }}>{ticketId(query.id)}</div>
            <div style={{ fontSize: 11, color: T3 }}>Raised {timeAgo(query.timestamp)}</div>
          </div>
          <div style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: stage === 3 ? GREEN_BG : PL,
            color: stage === 3 ? GREEN : P,
            border: `1px solid ${stage === 3 ? GREEN_BORDER : PB}`,
          }}>
            {STAGE_LABELS[stage]}
          </div>
        </div>

        {/* Query summary */}
        <div style={{ background: BG2, borderRadius: 10, padding: '9px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.abbr}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{query.category}</span>
          </div>
          <div style={{ fontSize: 12, color: T2 }}>{query.sub_option}</div>
          {query.query_text && <div style={{ fontSize: 11, color: T3, marginTop: 3, fontStyle: 'italic' }}>"{query.query_text}"</div>}
        </div>
      </div>

      {/* Stage toggle (demo) */}
      <div style={{ padding: '10px 16px', background: '#FAFAFD', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: T3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Simulate stage</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STAGE_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => setStage(i)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8,
                border: `1.5px solid ${stage === i ? STAGE_COLORS[i] : BD}`,
                background: stage === i ? (i === 3 ? GREEN_BG : i === 0 ? PL : i === 1 ? ORANGE_BG : '#EFF6FF') : 'white',
                color: stage === i ? STAGE_COLORS[i] : T3,
                fontSize: 10, fontWeight: stage === i ? 700 : 400, cursor: 'pointer',
                lineHeight: 1.3, textAlign: 'center',
              }}
            >
              {i + 1}<br />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Status banner (Zomato-style) */}
        {stage < 3 && (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: stage === 2 ? PL : stage === 1 ? ORANGE_BG : BG2, border: `1px solid ${stage === 2 ? PB : stage === 1 ? '#FED7AA' : BD}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage], flexShrink: 0, animation: 'tl-pulse 1.5s ease-in-out infinite' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: stage === 2 ? PD : stage === 1 ? '#92400E' : T1 }}>
                {stage === 0 && 'Your query has been received'}
                {stage === 1 && 'Our team is reviewing this'}
                {stage === 2 && `${agent.name} is working on your query`}
              </div>
              <div style={{ fontSize: 11, color: T2, marginTop: 1 }}>
                {stage === 0 && 'Estimated response within 48 hours'}
                {stage === 1 && 'An agent will be assigned shortly'}
                {stage === 2 && "You'll be notified once resolved"}
              </div>
            </div>
          </div>
        )}

        {stage === 3 && (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>Query resolved</div>
              <div style={{ fontSize: 11, color: '#166534' }}>The question has been reviewed and updated</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Timeline</div>
          {TIMELINE_STEPS.map((step, idx) => (
            <TimelineStep
              key={step.key}
              step={step}
              idx={idx}
              activeIdx={stage}
              agent={agent}
              stepTimestamps={stepTimestamps}
              isLast={idx === TIMELINE_STEPS.length - 1}
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
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', background: 'white', border: `1px solid ${BD}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        display: 'block',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = PB; e.currentTarget.style.boxShadow = `0 2px 12px rgba(83,74,183,0.08)` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BD; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: meta.color, flexShrink: 0 }}>
          {meta.abbr}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, marginBottom: 1 }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: T1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.sub_option}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T3, fontFamily: 'monospace' }}>{ticketId(query.id)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: T3 }}>{timeAgo(query.timestamp)}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: query.status === 'resolved' ? GREEN_BG : PL, color: query.status === 'resolved' ? GREEN : P, border: `1px solid ${query.status === 'resolved' ? GREEN_BORDER : PB}` }}>
            {query.status === 'resolved' ? 'Resolved' : 'In review'}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function QueryTracker() {
  const { queries } = useQueries()
  const [selected, setSelected] = useState(null)

  const displayed = queries.slice(0, 8)

  return (
    <div style={{
      width: 320, flexShrink: 0, height: 844, borderRadius: 24,
      background: 'white', boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {selected ? (
        <QueryDetailView query={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          {/* Profile header */}
          <div style={{ background: P, padding: '20px 16px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: P }}>A</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Anant Trivedi</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>NORCET Gold 2024</div>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: 'Raised', value: queries.length },
                { label: 'In review', value: queries.filter(q => q.status !== 'resolved').length },
                { label: 'Resolved', value: queries.filter(q => q.status === 'resolved').length },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section label */}
          <div style={{ padding: '14px 16px 8px', flexShrink: 0, borderBottom: `1px solid ${BD}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T1 }}>My Queries</div>
            <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>Tap any query to see its full timeline</div>
          </div>

          {/* Query list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T3, fontSize: 13 }}>
                No queries yet — submit your first one from the QBank
              </div>
            ) : (
              displayed.map(q => (
                <QueryCard key={q.id} query={q} onClick={() => setSelected(q)} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
