import React, { useState, useRef } from 'react'
import { useQueries } from '../context/QueryContext'
import { useNotifications } from '../context/NotificationContext'

const P = '#534AB7', PL = '#EEEDFE', PB = '#AFA9EC', PD = '#3C3489'
const T1 = '#1a1a2e', T2 = '#5a5a78', T3 = '#9898b0', BD = '#e8e8f2', BG2 = '#f5f5fb'
const GREEN = '#22C55E', GREEN_BG = '#F0FDF4', GREEN_BORDER = '#86EFAC'
const ORANGE = '#E07B2A', ORANGE_BG = '#FFF3E8'
const RED = '#DC2626', RED_BG = '#FEF2F2', RED_BORDER = '#FECACA'

const CATEGORY_META = {
  'Problem with the Answer':    { color: '#DC2626', bg: '#FEF2F2', abbr: '❌' },
  "Can't See Something":        { color: '#2563EB', bg: '#EFF6FF', abbr: '🔍' },
  'I Have a Doubt':             { color: '#16A34A', bg: '#F0FDF4', abbr: '🤔' },
  'Problem with this Question': { color: '#EA580C', bg: '#FFF7ED', abbr: '⚠️' },
  Others:                       { color: '#7C3AED', bg: '#F5F3FF', abbr: '💬' },
  'Wrong Answer':               { color: '#DC2626', bg: '#FEF2F2', abbr: '❌' },
  'Explanation Gap':            { color: '#16A34A', bg: '#F0FDF4', abbr: '💡' },
  'Not the Right Question':     { color: '#EA580C', bg: '#FFF7ED', abbr: '⚠️' },
}

const STAGE_FROM_STATUS = { raised: 0, received: 1, assigned: 2, resolved: 3, escalated: 4, escalation_closed: 5 }
const STAGE_LABELS = ['Sent! 📨', 'Team on it 👀', 'Expert on it 🎯', 'Solved! 🎉', 'Extra mile 🔥', 'Called! ✨']
const STAGE_COLORS = [P, ORANGE, '#0369A1', GREEN, RED, '#7C3AED']

const AGENTS = [
  { name: 'Priya S.',  team: 'Content QA',  avatar: 'P', color: '#7C3AED' },
  { name: 'Rahul M.',  team: 'Content QA',  avatar: 'R', color: '#0369A1' },
  { name: 'Sneha T.',  team: 'Engineering', avatar: 'S', color: '#059669' },
  { name: 'Amit K.',   team: 'Educator',    avatar: 'A', color: '#DC2626' },
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
  return AGENTS[(query.id || 0) % AGENTS.length]
}

// ── Thumbs Feedback ──────────────────────────────────────────────────────────
const EMOJI_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Not really' },
  { value: 3, emoji: '😐', label: 'Somewhat' },
  { value: 5, emoji: '😊', label: 'Completely!' },
]
const EMOJI_LABELS = { 1: 'Not really', 3: 'Somewhat', 5: 'Completely!' }

function EmojiRating({ rating, onRate }) {
  const [hovered, setHovered] = useState(null)
  const [lastSelected, setLastSelected] = useState(null)

  const handleRate = (value) => {
    setLastSelected(value)
    onRate(value)
    setTimeout(() => setLastSelected(null), 450)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
      {EMOJI_OPTIONS.map(({ value, emoji, label }) => {
        const isSelected = rating === value
        const isHov = hovered === value
        return (
          <button key={value}
            onClick={() => handleRate(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: isSelected ? PL : isHov ? `${PL}88` : 'transparent',
              border: `2px solid ${isSelected ? P : isHov ? PB : 'transparent'}`,
              borderRadius: 14, padding: '10px 14px', cursor: 'pointer',
              transform: isHov && !isSelected ? 'translateY(-3px) scale(1.06)' : 'translateY(0) scale(1)',
              boxShadow: isHov ? `0 6px 18px rgba(83,74,183,0.18)` : 'none',
              transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
            <span style={{
              fontSize: isHov ? 36 : 30,
              display: 'block',
              transition: 'font-size 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: lastSelected === value ? 'emojiPop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}>{emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: isSelected ? PD : isHov ? P : T3, transition: 'color 0.15s' }}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ThumbsFeedback({ resolvedAt, query }) {
  const { setResolutionRating, queries } = useQueries()
  const { queueNotification } = useNotifications()
  const queriesRef = useRef(queries)
  queriesRef.current = queries
  const existingStars = query?.resolution_star ?? null
  const isHighRated = existingStars != null && existingStars >= 4
  const isLowRated = existingStars != null && existingStars <= 3
  // steps: 'prompt' | 'rate' | 'up_done' | 'call_confirm' | 'call_enter' | 'call_otp' | 'call_done'
  //        'high_warn' | 'high_up' | 'low_confirm' | 're_rate'
  const [step, setStep] = useState('prompt')
  const [hoveredThumb, setHoveredThumb] = useState(null) // 'up' | 'down' | null
  const [rating, setRating] = useState(0)
  const [rateNote, setRateNote] = useState('')
  const [reRating, setReRating] = useState(0)
  const [reNote, setReNote] = useState('')
  const [highUpNote, setHighUpNote] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [usedOwnNumber, setUsedOwnNumber] = useState(true)
  const otpInputRefs = [
    React.useRef(), React.useRef(), React.useRef(), React.useRef()
  ]

  const submitRating = () => setStep('up_done')

  const DEMO_NUMBER = '+91 98765 43210'

  const resolvedTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now()
  const expiresAt = resolvedTime + 48 * 3600000
  const remainingMs = expiresAt - Date.now()
  const remainingH = Math.max(0, Math.ceil(remainingMs / 3600000))
  const isExpired = remainingMs <= 0

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next); setOtpError(false)
    if (val && idx < 3) otpInputRefs[idx + 1].current?.focus()
  }
  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpInputRefs[idx - 1].current?.focus()
  }
  const verifyOtp = () => {
    if (otp.join('') === '0000') { setStep('call_done') }
    else { setOtpError(true); setOtp(['', '', '', '']); otpInputRefs[0].current?.focus() }
  }

  if (isExpired) return (
    <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 6 }}>Ticket auto-closed</div>
      <div style={{ fontSize: 11, color: T2, lineHeight: 1.6 }}>The 48-hour response window has passed. This ticket has been automatically closed.</div>
      <div style={{ marginTop: 10, fontSize: 11, color: P }}>Still have a doubt? Raise a new query and our team will help.</div>
    </div>
  )

  if (step === 'up_done') return (
    <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#14532D', marginBottom: 4 }}>Great, glad it helped!</div>
      <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>Your ticket is now closed. Keep learning — NPrep's got your back.</div>
    </div>
  )

  if (step === 'rate') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setStep('prompt')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
      </div>
      <div style={{ fontSize: 12, color: T2, marginBottom: 16, textAlign: 'center' }}>Did {agentForQuery(query)?.name || 'our team'} clear your doubt?</div>
      <EmojiRating rating={rating} onRate={(n) => {
        setRating(n)
        // #11 — 😔 selected
        if (n === 1) queueNotification('Oops, sorry yaar 🙏', 'Team ko pata lag gaya. Jaldi better kaate hain.')
      }} />
      {rating > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: rating <= 3 ? ORANGE : GREEN, marginBottom: 10 }}>
          {EMOJI_LABELS[rating]}
        </div>
      )}
      {rating >= 4 && (
        <>
          <textarea
            value={rateNote}
            onChange={e => setRateNote(e.target.value)}
            placeholder="Anything you'd like to add? (optional)"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${P}`, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', background: BG2, boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={() => setStep('up_done')} disabled={!rateNote.trim()}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: rateNote.trim() ? P : BG2, color: rateNote.trim() ? 'white' : T3, border: 'none', fontSize: 12, fontWeight: 700, cursor: rateNote.trim() ? 'pointer' : 'default', marginBottom: 8 }}>
            Submit
          </button>
        </>
      )}
      {rating > 0 && rating <= 3 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 6 }}>
            Please tell us what was unclear — required for low ratings.
          </div>
          <textarea
            value={rateNote}
            onChange={e => setRateNote(e.target.value)}
            placeholder="What didn't you understand? (required)"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${rateNote.trim() ? P : ORANGE}`, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', background: BG2, boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={() => setStep('up_done')} disabled={!rateNote.trim()}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: rateNote.trim() ? P : BG2, color: rateNote.trim() ? 'white' : T3, border: 'none', fontSize: 12, fontWeight: 700, cursor: rateNote.trim() ? 'pointer' : 'default', marginBottom: 8 }}>
            Submit Feedback
          </button>
        </>
      )}
      <button onClick={() => setStep('up_done')}
        style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'white', color: T2, border: `1px solid ${BD}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        Skip
      </button>
    </div>
  )

  if (step === 'high_warn') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStep('prompt')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Still confused?</div>
      </div>
      <div style={{ background: ORANGE_BG, border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 18, marginBottom: 6 }}>⚠️</div>
        <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          You reacted with {existingStars >= 4 ? '😊' : existingStars === 3 ? '😐' : '😔'} to this resolution. Are you sure you didn't understand the topic?
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => setStep('high_up')}
          style={{ padding: '11px', borderRadius: 10, background: GREEN_BG, color: '#14532D', border: `1.5px solid ${GREEN_BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          I understood it
        </button>
        <button onClick={() => setStep('call_confirm')}
          style={{ padding: '11px', borderRadius: 10, background: RED_BG, color: RED, border: `1.5px solid ${RED_BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Still confused
        </button>
      </div>
    </div>
  )

  if (step === 'high_up') return (
    <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#14532D', marginBottom: 4 }}>Glad it helped!</div>
      <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
        {existingStars >= 4 ? '😊' : existingStars === 3 ? '😐' : '😔'}
      </div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 14 }}>Your feedback is saved.</div>
      <textarea
        value={highUpNote}
        onChange={e => setHighUpNote(e.target.value)}
        placeholder="Want to add a note? (optional)"
        rows={2}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${BD}`, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', background: BG2, boxSizing: 'border-box', marginBottom: 10, textAlign: 'left' }}
      />
      <button
        onClick={() => {
          if (highUpNote.trim()) setResolutionRating(query.ticket_id, existingStars, highUpNote.trim())
          setStep('up_done')
        }}
        style={{ width: '100%', padding: '11px', borderRadius: 10, background: P, color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        Done
      </button>
    </div>
  )

  if (step === 'low_confirm') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStep('prompt')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Did you understand the topic?</div>
      </div>
      <div style={{ background: ORANGE_BG, border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
          You previously reacted with {existingStars === 3 ? '😐' : '😔'} to this resolution. Did you fully understand after reviewing the explanation?
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => setStep('call_confirm')}
          style={{ padding: '11px', borderRadius: 10, background: RED_BG, color: RED, border: `1.5px solid ${RED_BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          No, still confused
        </button>
        <button onClick={() => setStep('re_rate')}
          style={{ padding: '11px', borderRadius: 10, background: GREEN_BG, color: '#14532D', border: `1.5px solid ${GREEN_BORDER}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Yes, I understood
        </button>
      </div>
    </div>
  )

  if (step === 're_rate') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setStep('low_confirm')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Update your rating</div>
      </div>
      <div style={{ fontSize: 12, color: T2, marginBottom: 16, textAlign: 'center' }}>How do you feel about the resolution now?</div>
      <EmojiRating rating={reRating} onRate={(n) => {
        setReRating(n)
        if (n >= 4) { setResolutionRating(query.ticket_id, n, ''); setStep('up_done') }
      }} />
      {reRating > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: reRating <= 3 ? ORANGE : GREEN, marginBottom: 10 }}>
          {EMOJI_LABELS[reRating]}
        </div>
      )}
      {reRating > 0 && reRating <= 3 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 6 }}>
            What did you really understand from this explanation?
          </div>
          <textarea
            value={reNote}
            onChange={e => setReNote(e.target.value)}
            placeholder="Tell us what was still unclear (required)"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${reNote.trim() ? P : ORANGE}`, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', background: BG2, boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={() => { setResolutionRating(query.ticket_id, reRating, reNote.trim()); setStep('up_done') }}
            disabled={!reNote.trim()}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: reNote.trim() ? P : BG2, color: reNote.trim() ? 'white' : T3, border: 'none', fontSize: 12, fontWeight: 700, cursor: reNote.trim() ? 'pointer' : 'default', marginBottom: 8 }}>
            Submit Feedback
          </button>
        </>
      )}
    </div>
  )

  // Call confirmed — no agent details shown
  if (step === 'call_done') return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📞</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 6 }}>
        {usedOwnNumber ? 'We\'ve got you.' : 'Got it!'}
      </div>
      <div style={{ fontSize: 12, color: T2, lineHeight: 1.7, marginBottom: 14 }}>
        {usedOwnNumber
          ? 'Someone from our team will go through your doubt and call you personally.'
          : 'Someone from our team will shortly be calling you on your updated number.'}
      </div>
      <div style={{ background: ORANGE_BG, border: `1px solid #FED7AA`, borderRadius: 10, padding: '12px 14px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, animation: 'tl-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Our team will call you within 24 hours</span>
        </div>
      </div>
    </div>
  )

  // "Is this the correct number?"
  if (step === 'call_confirm') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStep('prompt')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>We're here for you 💙</div>
      </div>
      <div style={{ background: PL, borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, lineHeight: 1.2 }}>📞</span>
        <div style={{ fontSize: 12, color: PD, lineHeight: 1.6 }}>
          Some things are better explained on a call. One of our team members will reach out to you personally and take you through this step by step.
          <span style={{ fontWeight: 700 }}> Is this the right number to reach you?</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: BG2, border: `1px solid ${BD}`, marginBottom: 16 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.64a19.79 19.79 0 01-2.93-8.63A2 2 0 012.11 0H5a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: T1, letterSpacing: '0.04em' }}>{DEMO_NUMBER}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => { setUsedOwnNumber(false); setStep('call_enter') }} style={{ padding: '11px', borderRadius: 10, background: 'white', color: T2, border: `1px solid ${BD}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          No, use different
        </button>
        <button onClick={() => { setUsedOwnNumber(true); setStep('call_done') }} style={{ padding: '11px', borderRadius: 10, background: P, color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Schedule a call
        </button>
      </div>
    </div>
  )

  // Enter new number
  if (step === 'call_enter') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setStep('call_confirm')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Enter your number</div>
          <div style={{ fontSize: 10, color: T2 }}>We'll send a one-time OTP to verify</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ padding: '10px 11px', borderRadius: 10, border: `1px solid ${BD}`, background: BG2, fontSize: 13, fontWeight: 600, color: T2, flexShrink: 0 }}>+91</div>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${phone.length === 10 ? P : BD}`, fontSize: 13, color: T1, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
      <button
        disabled={phone.length !== 10}
        onClick={() => setStep('call_otp')}
        style={{ width: '100%', padding: '12px', borderRadius: 10, background: phone.length === 10 ? P : BG2, color: phone.length === 10 ? 'white' : T3, border: 'none', fontSize: 13, fontWeight: 700, cursor: phone.length === 10 ? 'pointer' : 'default' }}
      >
        Send OTP
      </button>
    </div>
  )

  // OTP verification
  if (step === 'call_otp') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => { setOtp(['','','','']); setOtpError(false); setStep('call_enter') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Enter OTP</div>
      </div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 16 }}>Sent to +91 {phone}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
        {[0,1,2,3].map(idx => (
          <input key={idx} ref={otpInputRefs[idx]}
            value={otp[idx]} maxLength={1} inputMode="numeric"
            onChange={e => handleOtpChange(idx, e.target.value)}
            onKeyDown={e => handleOtpKey(idx, e)}
            style={{ width: 50, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 800, color: otpError ? RED : T1, borderRadius: 10, border: `2px solid ${otpError ? RED_BORDER : otp[idx] ? P : BD}`, outline: 'none', fontFamily: 'inherit', background: otpError ? RED_BG : 'white', transition: 'border-color 0.15s' }}
          />
        ))}
      </div>
      {otpError && <div style={{ textAlign: 'center', fontSize: 11, color: RED, marginBottom: 10 }}>Incorrect OTP. Please try again.</div>}
      <button
        disabled={otp.join('').length < 4}
        onClick={verifyOtp}
        style={{ width: '100%', padding: '12px', borderRadius: 10, background: otp.join('').length === 4 ? P : BG2, color: otp.join('').length === 4 ? 'white' : T3, border: 'none', fontSize: 13, fontWeight: 700, cursor: otp.join('').length === 4 ? 'pointer' : 'default' }}
      >
        Verify &amp; Confirm Call
      </button>
    </div>
  )

  // Step: Prompt — when user already gave a high card rating (≥4 stars)
  if (isHighRated) return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>Did the resolution help?</div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 10 }}>Your feedback helps us improve.</div>
      <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 4 }}>
        {existingStars >= 4 ? '😊' : existingStars === 3 ? '😐' : '😔'}
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: T3, marginBottom: 14 }}>You reacted to this from your queries list</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setStep('high_up')}
          onMouseEnter={() => setHoveredThumb('up')}
          onMouseLeave={() => setHoveredThumb(null)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px', borderRadius: 14, border: `2px solid ${hoveredThumb === 'up' ? GREEN : GREEN_BORDER}`, background: GREEN_BG, cursor: 'pointer', transform: hoveredThumb === 'up' ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)', boxShadow: hoveredThumb === 'up' ? '0 8px 20px rgba(34,197,94,0.3)' : '0 2px 0 #86EFAC', transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <span style={{ fontSize: 28, display: 'block', animation: hoveredThumb === 'up' ? 'thumbWiggle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none' }}>👍</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Yes, this helped!</span>
          <span style={{ fontSize: 10, color: '#166534', textAlign: 'center', lineHeight: 1.4 }}>Glad we could help</span>
        </button>
        <button onClick={() => setStep('high_warn')}
          onMouseEnter={() => setHoveredThumb('down')}
          onMouseLeave={() => setHoveredThumb(null)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px', borderRadius: 14, border: `2px solid ${hoveredThumb === 'down' ? RED : RED_BORDER}`, background: RED_BG, cursor: 'pointer', transform: hoveredThumb === 'down' ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)', boxShadow: hoveredThumb === 'down' ? '0 8px 20px rgba(220,38,38,0.25)' : '0 2px 0 #FECACA', transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <span style={{ fontSize: 28, display: 'block', animation: hoveredThumb === 'down' ? 'thumbWiggle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none' }}>👎</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>Want to talk it through</span>
          <span style={{ fontSize: 10, color: '#B91C1C', textAlign: 'center', lineHeight: 1.4 }}>We'll reach out personally</span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: remainingH <= 12 ? '#FFF7ED' : BG2, borderRadius: 8, border: `1px solid ${remainingH <= 12 ? '#FED7AA' : BD}` }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={remainingH <= 12 ? ORANGE : T3} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ fontSize: 10, color: remainingH <= 12 ? '#92400E' : T2, fontWeight: remainingH <= 12 ? 600 : 400 }}>
          No response in {remainingH}h · this will close automatically
        </span>
      </div>
    </div>
  )

  // Step: Prompt (thumbs up / down) — default or low card rating (≤3 stars)
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>Did we answer your question?</div>
      <div style={{ fontSize: 11, color: T2, marginBottom: isLowRated ? 8 : 12 }}>Tap to tell us more — we'll reach out personally</div>
      {isLowRated && (
        <>
          <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 3 }}>
            {existingStars === 3 ? '😐' : '😔'}
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: T3, marginBottom: 12 }}>You reacted to this from your queries list</div>
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => {
            setStep(isLowRated ? 'low_confirm' : 'rate')
            const qId = query.ticket_id
            setTimeout(() => {
              const latest = queriesRef.current.find(q => q.ticket_id === qId)
              if (latest && latest.resolution_star == null) {
                queueNotification('Ek kaam aur banta hai 😏', 'Rating mat bhoolna yaar — ek second ka kaam hai.')
              }
            }, 10000)
          }}
          onMouseEnter={() => setHoveredThumb('up')}
          onMouseLeave={() => setHoveredThumb(null)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '14px 10px', borderRadius: 14,
            border: `2px solid ${hoveredThumb === 'up' ? GREEN : GREEN_BORDER}`,
            background: GREEN_BG, cursor: 'pointer',
            transform: hoveredThumb === 'up' ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)',
            boxShadow: hoveredThumb === 'up' ? `0 8px 20px rgba(34,197,94,0.3)` : '0 2px 0 #86EFAC',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span style={{
            fontSize: 28, display: 'block',
            animation: hoveredThumb === 'up' ? 'thumbWiggle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}>👍</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Yes, this helped!</span>
          <span style={{ fontSize: 10, color: '#166534', textAlign: 'center', lineHeight: 1.4 }}>Glad we could help</span>
        </button>
        <button
          onClick={() => {
            setStep('call_confirm')
            queueNotification('Noted, bilkul noted 🤝', 'Call arrange ho rahi hai. Hum khud samjhaayenge.')
            const qId = query.ticket_id
            setTimeout(() => {
              const latest = queriesRef.current.find(q => q.ticket_id === qId)
              if (latest && !latest.escalation_resolved) {
                queueNotification('Call aane waali hai, ready raho 📞', 'Team ne slot book kar liya hai. Phone paas rakhna.')
              }
            }, 15000)
          }}
          onMouseEnter={() => setHoveredThumb('down')}
          onMouseLeave={() => setHoveredThumb(null)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '14px 10px', borderRadius: 14,
            border: `2px solid ${hoveredThumb === 'down' ? RED : RED_BORDER}`,
            background: RED_BG, cursor: 'pointer',
            transform: hoveredThumb === 'down' ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)',
            boxShadow: hoveredThumb === 'down' ? `0 8px 20px rgba(220,38,38,0.25)` : '0 2px 0 #FECACA',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span style={{
            fontSize: 28, display: 'block',
            animation: hoveredThumb === 'down' ? 'thumbWiggle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}>👎</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>Want to talk it through</span>
          <span style={{ fontSize: 10, color: '#B91C1C', textAlign: 'center', lineHeight: 1.4 }}>We'll reach out personally</span>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: remainingH <= 12 ? '#FFF7ED' : BG2, borderRadius: 8, border: `1px solid ${remainingH <= 12 ? '#FED7AA' : BD}` }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={remainingH <= 12 ? ORANGE : T3} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ fontSize: 10, color: remainingH <= 12 ? '#92400E' : T2, fontWeight: remainingH <= 12 ? 600 : 400 }}>
          No response in {remainingH}h · this will close automatically
        </span>
      </div>
    </div>
  )
}

// ── Escalation Rating ────────────────────────────────────────────────────────
function EscalationRating({ query }) {
  const { setEscalationRating } = useQueries()
  const alreadyRated = query.escalation_rating != null
  const [rating, setRating] = useState(alreadyRated ? query.escalation_rating : 0)
  const [note, setNote] = useState(query.escalation_review || '')
  const [submitted, setSubmitted] = useState(alreadyRated)
  const [dismissed, setDismissed] = useState(false)

  const isLow = rating > 0 && rating <= 3
  const canSubmit = rating > 0 && (!isLow || note.trim().length > 0)

  if (dismissed) return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 11, color: T3, lineHeight: 1.6 }}>
      You can still rate your call experience anytime from the queries list.
    </div>
  )

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
      <div style={{ fontSize: 34, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>
        {rating >= 4 ? '😊' : rating === 3 ? '😐' : '😔'}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D', marginBottom: 4 }}>Thanks for your feedback!</div>
      <div style={{ fontSize: 12, color: T2, lineHeight: 1.5 }}>Your rating helps us improve our support quality.</div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>Tell us how the call went</div>
      <div style={{ fontSize: 12, color: T2, marginBottom: 14, lineHeight: 1.5 }}>Your experience matters to us</div>
      <EmojiRating rating={rating} onRate={(n) => {
        setRating(n)
        if (n >= 4) { setEscalationRating(query.ticket_id, n, ''); setSubmitted(true) }
      }} />
      {rating > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: rating <= 3 ? ORANGE : GREEN, marginBottom: 10 }}>
          {EMOJI_LABELS[rating]}
        </div>
      )}
      {rating > 0 && rating <= 3 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 6 }}>
            Please tell us what we could have done better — required for low ratings.
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What could our team have done better? (required)"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${note.trim() ? P : ORANGE}`, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', background: BG2, boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={() => { setEscalationRating(query.ticket_id, rating, note.trim()); setSubmitted(true) }}
            disabled={!note.trim()}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: note.trim() ? P : BG2, color: note.trim() ? 'white' : T3, border: 'none', fontSize: 12, fontWeight: 700, cursor: note.trim() ? 'pointer' : 'default', marginBottom: 8 }}>
            Submit Feedback
          </button>
        </>
      )}
    </div>
  )
}

// ── Inline mini voice recorder (for escalation form) ──────────────────────────
function MiniVoiceRecorder({ onDurationChange }) {
  const [recState, setRecState] = useState('idle')
  const [audioURL, setAudioURL] = useState(null)
  const [duration, setDuration] = useState(0)
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const finalDurRef = useRef(0)

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        setAudioURL(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' })))
        stream.getTracks().forEach(t => t.stop())
        setRecState('done')
        onDurationChange?.(finalDurRef.current)
      }
      mr.start(); mrRef.current = mr; setRecState('rec'); setDuration(0); finalDurRef.current = 0
      timerRef.current = setInterval(() => setDuration(d => { finalDurRef.current = d + 1; return d + 1 }), 1000)
    } catch { /* mic denied */ }
  }
  const stop = () => { mrRef.current?.state === 'recording' && mrRef.current.stop(); clearInterval(timerRef.current) }
  const remove = () => { if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null); setDuration(0); finalDurRef.current = 0; setRecState('idle'); onDurationChange?.(0) }
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (recState === 'idle') return (
    <button type="button" onClick={start} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 20, background: 'white', border: `1px solid ${BD}`, color: T2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      Add voice note
    </button>
  )
  if (recState === 'rec') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 20, background: '#FEF2F2', border: `1px solid ${RED_BORDER}` }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED, animation: 'tl-pulse 1s ease-in-out infinite', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: RED, fontFamily: 'monospace' }}>{fmt(duration)}</span>
      <button onClick={stop} style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 12, background: RED, color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Stop</button>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 20, background: PL, border: `1px solid ${PB}` }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" strokeLinecap="round"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      <audio src={audioURL} controls style={{ height: 24, flex: 1 }} />
      <button onClick={remove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
    </div>
  )
}

// ── Call Request Flow (number verification) ──────────────────────────────────
function CallRequestFlow({ agent, onClose }) {
  const DEMO_NUMBER = '+91 98765 43210'
  const [step, setStep] = useState('confirm') // confirm | enter | otp | done
  const [phone, setPhone] = useState('')
  const [finalPhone, setFinalPhone] = useState(DEMO_NUMBER)
  const [otp, setOtp] = useState(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const ref0 = useRef(), ref1 = useRef(), ref2 = useRef(), ref3 = useRef()
  const otpRefs = [ref0, ref1, ref2, ref3]

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next); setOtpError(false)
    if (val && idx < 3) otpRefs[idx + 1].current?.focus()
  }
  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus()
  }
  const verifyOtp = () => {
    if (otp.join('') === '0000') { setFinalPhone('+91 ' + phone); setStep('done') }
    else { setOtpError(true); setOtp(['', '', '', '']); ref0.current?.focus() }
  }

  if (step === 'done') return (
    <div style={{ padding: '14px 14px 10px', borderRadius: 12, background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>📞</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D', marginBottom: 3 }}>Call Requested!</div>
        <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.6 }}>
          {agent.name} from <strong>{agent.team}</strong> will call you on <strong>{finalPhone}</strong> within 24 hours.
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 9, border: '1px solid #86EFAC', padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{agent.avatar}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#14532D' }}>{agent.name} · {agent.team}</div>
          <div style={{ fontSize: 10, color: '#166534' }}>Will call you within 24 hours</div>
        </div>
      </div>
    </div>
  )

  if (step === 'confirm') return (
    <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 3 }}>Is this your number?</div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 12 }}>We'll reach out on this number to help resolve your doubt.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, background: BG2, border: `1px solid ${BD}`, marginBottom: 14 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.2" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.64a19.79 19.79 0 01-2.93-8.63A2 2 0 012.11 0H5a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: T1, letterSpacing: '0.04em' }}>{DEMO_NUMBER}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => setStep('enter')} style={{ padding: '11px', borderRadius: 10, background: 'white', color: T2, border: `1px solid ${BD}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>No, use different</button>
        <button onClick={() => setStep('done')} style={{ padding: '11px', borderRadius: 10, background: P, color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Schedule a call</button>
      </div>
    </div>
  )

  if (step === 'enter') return (
    <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setStep('confirm')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Enter your number</div>
          <div style={{ fontSize: 10, color: T2 }}>We'll send a one-time OTP to verify</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ padding: '10px 11px', borderRadius: 10, border: `1px solid ${BD}`, background: BG2, fontSize: 13, fontWeight: 600, color: T2, flexShrink: 0 }}>+91</div>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${phone.length === 10 ? P : BD}`, fontSize: 13, color: T1, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
      <button
        disabled={phone.length !== 10}
        onClick={() => setStep('otp')}
        style={{ width: '100%', padding: '12px', borderRadius: 10, background: phone.length === 10 ? P : BG2, color: phone.length === 10 ? 'white' : T3, border: 'none', fontSize: 13, fontWeight: 700, cursor: phone.length === 10 ? 'pointer' : 'default' }}
      >
        Send OTP
      </button>
    </div>
  )

  // step === 'otp'
  return (
    <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button onClick={() => { setOtp(['','','','']); setOtpError(false); setStep('enter') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Enter OTP</div>
      </div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 16 }}>Sent to +91 {phone}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
        {[0,1,2,3].map(idx => (
          <input key={idx} ref={otpRefs[idx]}
            value={otp[idx]} maxLength={1} inputMode="numeric"
            onChange={e => handleOtpChange(idx, e.target.value)}
            onKeyDown={e => handleOtpKey(idx, e)}
            style={{ width: 50, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 800, color: otpError ? RED : T1, borderRadius: 10, border: `2px solid ${otpError ? RED_BORDER : otp[idx] ? P : BD}`, outline: 'none', fontFamily: 'inherit', background: otpError ? RED_BG : 'white', transition: 'border-color 0.15s' }}
          />
        ))}
      </div>
      {otpError && (
        <div style={{ textAlign: 'center', fontSize: 11, color: RED, marginBottom: 10 }}>Incorrect OTP. Please try again.</div>
      )}
      <button
        disabled={otp.join('').length < 4}
        onClick={verifyOtp}
        style={{ width: '100%', padding: '12px', borderRadius: 10, background: otp.join('').length === 4 ? P : BG2, color: otp.join('').length === 4 ? 'white' : T3, border: 'none', fontSize: 13, fontWeight: 700, cursor: otp.join('').length === 4 ? 'pointer' : 'default' }}
      >
        Verify &amp; Request Call
      </button>
    </div>
  )
}

// ── Call Request Section (write / voice / call) ───────────────────────────────
function CallRequestSection({ agent }) {
  const [additionalText, setAdditionalText] = useState('')
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [showCallFlow, setShowCallFlow] = useState(false)

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: PL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Still have a doubt?</div>
      </div>
      <div style={{ fontSize: 11, color: T2, marginBottom: 12, lineHeight: 1.5 }}>
        Write or record what's still unclear — our team will get back to you, or you can request a call.
      </div>

      <textarea
        value={additionalText}
        onChange={e => setAdditionalText(e.target.value)}
        placeholder="Describe what's still unclear... (optional)"
        style={{ width: '100%', minHeight: 76, borderRadius: 10, border: `1.5px solid ${additionalText.trim() ? P : BD}`, padding: '9px 11px', fontSize: 12, color: T1, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6, background: BG2, transition: 'border-color 0.15s', marginBottom: 10 }}
      />

      <div style={{ marginBottom: 12 }}>
        <MiniVoiceRecorder onDurationChange={setVoiceDuration} />
      </div>

      {showCallFlow
        ? <CallRequestFlow agent={agent} onClose={() => setShowCallFlow(false)} />
        : (
          <button
            onClick={() => setShowCallFlow(true)}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: P, color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.64a19.79 19.79 0 01-2.93-8.63A2 2 0 012.11 0H5a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Request a Call
          </button>
        )
      }
    </div>
  )
}

// ── Resolution Attachments ────────────────────────────────────────────────────
const WAVE = [5,12,8,18,10,16,6,20,9,15,11,19,7,17,13,14,8,16,10,12]

function ImageAttachment({ att }) {
  const [big, setBig] = useState(false)
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${GREEN_BORDER}` }}>
      <img
        src={att.url} alt={att.caption || 'Attachment'}
        onClick={() => setBig(b => !b)}
        style={{ width: '100%', display: 'block', maxHeight: big ? 'none' : 130, objectFit: 'cover', cursor: 'pointer', transition: 'max-height 0.2s' }}
      />
      {att.caption && (
        <div style={{ padding: '5px 9px', fontSize: 10, color: '#166534', background: GREEN_BG }}>{att.caption}</div>
      )}
    </div>
  )
}

function LinkAttachment({ att }) {
  return (
    <a href={att.url} target="_blank" rel="noreferrer"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 10px', borderRadius: 8, background: 'white', border: `1px solid ${GREEN_BORDER}`, textDecoration: 'none' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14532D', marginBottom: 2 }}>{att.title}</div>
        {att.description && <div style={{ fontSize: 10, color: '#166534', marginBottom: 2, lineHeight: 1.4 }}>{att.description}</div>}
        <div style={{ fontSize: 9, color: T3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.url}</div>
      </div>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    </a>
  )
}

function VoiceAttachment({ att }) {
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: 'white', border: `1px solid ${GREEN_BORDER}` }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: GREEN_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 1.5, alignItems: 'center', height: 22, marginBottom: 3 }}>
          {WAVE.map((h, i) => (
            <div key={i} style={{ width: 2, borderRadius: 1, background: '#16A34A', opacity: 0.7, height: h }} />
          ))}
        </div>
        {att.caption && <div style={{ fontSize: 10, color: '#166534', lineHeight: 1.3 }}>{att.caption}</div>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#14532D', fontFamily: 'monospace', flexShrink: 0 }}>{fmt(att.duration || 0)}</div>
    </div>
  )
}

function ResolutionAttachments({ attachments }) {
  const [open, setOpen] = useState(false)
  if (!attachments || attachments.length === 0) return null
  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${GREEN_BORDER}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#14532D', flex: 1, textAlign: 'left' }}>
          {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {attachments.map((att, i) => {
            if (att.type === 'image') return <ImageAttachment key={i} att={att} />
            if (att.type === 'link')  return <LinkAttachment  key={i} att={att} />
            if (att.type === 'voice') return <VoiceAttachment key={i} att={att} />
            return null
          })}
        </div>
      )}
    </div>
  )
}

// ── Resolution Rating Popup ───────────────────────────────────────────────────
const POPUP_MESSAGES = {
  1: "That's really disappointing — we'd like to understand what went wrong.",
  3: "Seems like the explanation didn't fully help you.",
}

function ResolutionRatingPopup({ popup, onSubmit, onClose }) {
  const [note, setNote] = useState('')
  const canSubmit = note.trim().length > 0
  const msg = POPUP_MESSAGES[popup.stars] || "We'd like to know what went wrong."

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: '22px 18px', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 14 }}>
          {popup.stars >= 4 ? '😊' : popup.stars === 3 ? '😐' : '😔'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: T1, textAlign: 'center', marginBottom: 6 }}>Help us improve</div>
        <div style={{ fontSize: 12, color: T2, textAlign: 'center', lineHeight: 1.65, marginBottom: 16 }}>
          {msg}<br/>
          <span style={{ color: T3 }}>Was the explanation unclear? Did you disagree with the answer? Let us know — we'll try to reach out.</span>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What didn't you understand or agree with? (required)"
          rows={3}
          autoFocus
          style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: `1.5px solid ${note.trim() ? P : ORANGE}`, fontSize: 12, color: T1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, background: BG2, boxSizing: 'border-box', marginBottom: 10 }}
        />
        <button
          onClick={() => canSubmit && onSubmit(note)}
          disabled={!canSubmit}
          style={{ width: '100%', padding: '11px', borderRadius: 10, background: canSubmit ? P : BG2, color: canSubmit ? 'white' : T3, border: 'none', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', marginBottom: 8, transition: 'background 0.15s' }}
        >
          Submit Feedback
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '9px', borderRadius: 10, background: 'none', border: `1px solid ${BD}`, fontSize: 12, color: T2, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Timeline Step ────────────────────────────────────────────────────────────
function TimelineStep({ step, idx, activeIdx, agent, stepTimestamps, isLast, query }) {
  const status = idx < activeIdx ? 'done' : idx === activeIdx ? 'active' : 'pending'
  const meta = CATEGORY_META[query?.category] || CATEGORY_META['Others']
  const isExpandable = (step.key === 'raised' || step.key === 'resolved') && status !== 'pending'

  // Default open: 'raised' until an agent is assigned (stage < 2);
  // 'resolved' while within the 48h feedback window
  const defaultExpanded = (() => {
    if (step.key === 'raised') return activeIdx < 2
    if (step.key === 'resolved' && query?.resolved_at) {
      return Date.now() < new Date(query.resolved_at).getTime() + 48 * 3600000
    }
    return false
  })()
  const [expanded, setExpanded] = useState(defaultExpanded)

  // ── Blurred teaser for assigned step not yet reached ──────────────────────
  if (step.key === 'assigned' && status === 'pending') return (
    <div style={{ display: 'flex', gap: 12, opacity: 0.35 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', border: `2px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: BD }} />
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 40, background: BD, marginTop: 2, borderRadius: 1 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T1 }}>Our team will take it personally 🎯</span>
        <p style={{ fontSize: 11, color: T2, lineHeight: 1.5, margin: '2px 0 0' }}>We'll find the right person just for this</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12, opacity: status === 'pending' ? 0.35 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'done' ? GREEN : status === 'active' ? P : 'white', border: `2px solid ${status === 'done' ? GREEN : status === 'active' ? P : BD}`, boxShadow: status === 'active' ? `0 0 0 4px ${PL}` : 'none', animation: status === 'active' ? 'tl-pulse 2s ease-in-out infinite' : 'none', flexShrink: 0 }}>
          {status === 'done'
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <div style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'active' ? 'white' : BD }} />}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, minHeight: expanded ? 32 : 22, background: idx < activeIdx ? GREEN : BD, marginTop: 2, borderRadius: 1 }} />}
      </div>

      <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, minWidth: 0 }}>
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

        <p style={{ fontSize: 11, color: T2, lineHeight: 1.5, margin: 0 }}>
          {step.key === 'assigned' && status !== 'pending'
            ? (step.title.includes('🔧')
                ? 'They\'ll get back to you as soon as it\'s ready'
                : 'Carefully reviewed and responded just for you')
            : step.desc}
        </p>

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

        {expanded && step.key === 'resolved' && query?.resolution_text && (
          <div style={{ marginTop: 8, background: GREEN_BG, borderRadius: 9, border: `1px solid ${GREEN_BORDER}`, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Resolution</div>
            <p style={{ fontSize: 11, color: '#14532D', lineHeight: 1.6, margin: 0 }}>{query.resolution_text}</p>
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${GREEN_BORDER}`, fontSize: 10, color: '#166534' }}>
              Resolved by {agent.name} · {agent.team}
            </div>
            <ResolutionAttachments
              attachments={Array.isArray(query.resolution_attachment) ? query.resolution_attachment : (query.resolution_attachment ? [query.resolution_attachment] : [])}
            />
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
    stage >= 4 ? timeAgo(new Date(raised + 3600000 * 20).toISOString()) : null,
    stage >= 5 ? timeAgo(new Date(raised + 3600000 * 22).toISOString()) : null,
  ]

  const TIMELINE_STEPS = [
    { key: 'raised',      title: 'We heard you',                           desc: 'Your question is now with our team' },
    { key: 'received',    title: 'Our team is working on it',              desc: 'A team member has started working on this' },
    { key: 'assigned',    title: stage >= 4 ? (agent.name ? `${agent.name} is working on this 🔧` : 'Our team is working on this 🔧') : (agent.name ? `${agent.name} took it personally 🎯` : 'Our expert took it personally 🎯'), desc: null },
    { key: 'resolved',    title: 'Your question deserved a proper answer', desc: "We've gone through this carefully for you" },
    ...(stage >= 4 ? [{ key: 'escalated',    title: 'Going the extra mile for you', desc: 'We want to make sure this is fully clear for you' }] : []),
    ...(stage >= 4 ? [{ key: 'call_closed',  title: 'Your experience matters to us', desc: null }] : []),
  ]

  const badgeMeta = stage >= 5 ? { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' }
    : stage === 4 ? { bg: RED_BG, color: RED, border: RED_BORDER }
    : stage === 3 ? { bg: GREEN_BG, color: GREEN, border: GREEN_BORDER }
    : { bg: PL, color: P, border: PB }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(140deg, ${badgeMeta.color}ee 0%, ${badgeMeta.color} 100%)`, padding: '12px 16px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{ticketId(query.id)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>Raised {timeAgo(query.timestamp)}</div>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.22)', color: 'white', border: '1.5px solid rgba(255,255,255,0.45)' }}>
            {STAGE_LABELS[stage] || 'Unknown'}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 18 }}>{meta.abbr}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{query.category}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{query.sub_option}</div>
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {/* Status banner */}
        {stage < 3 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 14, background: stage === 2 ? PL : stage === 1 ? ORANGE_BG : BG2, border: `2px solid ${stage === 2 ? PB : stage === 1 ? '#FED7AA' : BD}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{stage === 2 ? '🎯' : stage === 1 ? '👀' : '📨'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: stage === 2 ? PD : stage === 1 ? '#92400E' : T1 }}>
                {stage === 0 && 'Doubt bheja! Ab wait karo 📬'}
                {stage === 1 && 'Team dekh rahi hai isko 👀'}
                {stage === 2 && `${agent.name} personally le raha hai 🎯`}
              </div>
              <div style={{ fontSize: 11, color: T2, marginTop: 2 }}>
                {stage === 0 && '48 ghante ke andar jawab milega'}
                {stage === 1 && 'Thodi der mein expert assign hoga'}
                {stage === 2 && 'Hote hi tumhe notify kar denge!'}
              </div>
            </div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 14, background: GREEN_BG, border: `2px solid ${GREEN_BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D' }}>Cleared! ✅</div>
              <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>Your doubt has been resolved</div>
            </div>
          </div>
        )}
        {stage === 4 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 14, background: RED_BG, border: `2px solid ${RED_BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, animation: 'tl-pulse 1.5s ease-in-out infinite', flexShrink: 0 }}>🔥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: RED }}>Extra mile pe chal rahe hain!</div>
              <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>Call schedule ho rahi hai — phone paas rakhna</div>
            </div>
          </div>
        )}
        {stage === 5 && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 14, background: '#F5F3FF', border: `2px solid #DDD6FE`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6' }}>Ek extra call bhi ho gaya!</div>
              <div style={{ fontSize: 11, color: '#7C3AED', marginTop: 2 }}>Humein umeed hai ab sab clear ho gaya hoga</div>
            </div>
          </div>
        )}

        {/* Question context */}
        {(query.subject_name || query.test_name || query.question_text) && (
          <div style={{ marginBottom: 16, borderRadius: 11, border: `1px solid ${BD}`, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: BG2, borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question Context</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'white' }}>
              {(query.subject_name || query.test_name) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: query.question_text ? 9 : 0 }}>
                  {query.subject_name && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: PL, color: P, border: `1px solid ${PB}` }}>
                      {query.subject_name}
                    </span>
                  )}
                  {query.test_name && (
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: BG2, color: T2, border: `1px solid ${BD}` }}>
                      {query.test_name}
                    </span>
                  )}
                  {query.question_num && (
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: BG2, color: T3, border: `1px solid ${BD}` }}>
                      Q{query.question_num}
                    </span>
                  )}
                </div>
              )}
              {query.question_text && (
                <div style={{ fontSize: 11, color: T1, lineHeight: 1.6, fontStyle: 'italic', borderLeft: `3px solid ${PB}`, paddingLeft: 10 }}>
                  "{query.question_text.length > 140 ? query.question_text.slice(0, 137) + '…' : query.question_text}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Timeline</div>
          {TIMELINE_STEPS.map((step, idx) => (
            <TimelineStep key={step.key} step={step} idx={idx} activeIdx={stage} agent={agent} stepTimestamps={stepTimestamps} isLast={idx === TIMELINE_STEPS.length - 1} query={query} />
          ))}
        </div>

        {/* Thumbs feedback — only when resolved (not escalated) */}
        {stage === 3 && (
          <div style={{ padding: '14px', borderRadius: 12, border: `1px solid ${BD}`, background: 'white' }}>
            <ThumbsFeedback resolvedAt={query.resolved_at} query={query} />
          </div>
        )}
        {/* Escalation rating — when call is closed */}
        {stage === 5 && (
          <div style={{ padding: '14px', borderRadius: 12, border: `1px solid #DDD6FE`, background: '#FDFCFF' }}>
            <EscalationRating query={query} />
          </div>
        )}

      </div>
    </div>
  )
}

// ── Query Card ───────────────────────────────────────────────────────────────
function QueryCard({ query, onClick, onLowRating }) {
  const meta = CATEGORY_META[query.category] || CATEGORY_META['Others']
  const stage = STAGE_FROM_STATUS[query.timeline_status] ?? query.demo_stage ?? 0
  const { setEscalationRating } = useQueries()

  const handleCardStar = (n) => {
    if (query.escalation_rating != null) return
    if (n >= 4) {
      setEscalationRating(query.ticket_id, n, '')
    } else {
      onLowRating?.(query, n, (note) => setEscalationRating(query.ticket_id, n, note))
    }
  }

  const accentColor = stage >= 5 ? '#7C3AED' : stage === 4 ? RED : stage === 3 ? GREEN : stage === 2 ? P : stage === 1 ? ORANGE : T3
  const badgeBg     = stage >= 5 ? '#F5F3FF' : stage === 4 ? RED_BG : stage === 3 ? GREEN_BG : stage === 2 ? PL : stage === 1 ? ORANGE_BG : BG2

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 16,
        border: `2px solid ${accentColor}22`,
        borderLeftColor: accentColor, borderLeftWidth: 5,
        boxShadow: `0 4px 0 ${accentColor}22, 0 1px 8px rgba(0,0,0,0.05)`,
        cursor: 'pointer',
        padding: '14px 14px 14px 12px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 0 ${accentColor}22, 0 4px 16px rgba(0,0,0,0.08)` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${accentColor}22, 0 1px 8px rgba(0,0,0,0.05)` }}
    >
      {/* Big emoji icon */}
      <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.bg, border: `2px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {meta.abbr}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Status badge top-right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T1, lineHeight: 1.3, flex: 1 }}>
            {query.sub_option}
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: badgeBg, color: accentColor, border: `1.5px solid ${accentColor}55`, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {STAGE_LABELS[stage] || '?'}
          </span>
        </div>

        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, padding: '2px 7px', borderRadius: 6, marginBottom: 8 }}>
          {query.category}
        </span>

        {/* Subject chip */}
        {query.subject_name && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: PL, color: P, border: `1px solid ${PB}` }}>{query.subject_name}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T3, fontFamily: 'monospace' }}>{ticketId(query.id)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 10, color: T3 }}>{timeAgo(query.timestamp)}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile Home (landing page) ──────────────────────────────────────────────
function ProfileHome({ queries, onOpenQueries, onClose }) {
  const activeCount = queries.filter(q => q.status !== 'resolved').length
  const resolvedCount = queries.filter(q => q.status === 'resolved').length
  const total = queries.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Hero header — gradient */}
      <div style={{ background: `linear-gradient(140deg, ${P} 0%, ${PD} 100%)`, padding: '18px 16px 22px', flexShrink: 0, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
        </div>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>A</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: GREEN, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>Anant Trivedi</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>NORCET Gold 2024 · STU-2024-1429</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.35)' }}>
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Active learner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu cards */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, background: BG2 }}>
        {/* Your Queries card */}
        <button
          onClick={onOpenQueries}
          style={{ width: '100%', textAlign: 'left', background: 'white', border: `2px solid ${PB}`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: `0 4px 0 ${PB}`, transition: 'transform 0.1s, box-shadow 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 0 ${PB}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 ${PB}` }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 14, background: PL, border: `2px solid ${PB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>My Doubts</div>
            <div style={{ fontSize: 11, color: T2, marginTop: 2 }}>{total} total · {activeCount} in review · {resolvedCount} solved</div>
          </div>
          {activeCount > 0 && (
            <div style={{ padding: '4px 10px', borderRadius: 20, background: ORANGE_BG, border: `1.5px solid ${ORANGE}`, fontSize: 11, fontWeight: 800, color: ORANGE, flexShrink: 0 }}>{activeCount} active</div>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9,18 15,12 9,6"/></svg>
        </button>

        {/* Collection card (disabled) */}
        <div style={{ background: 'white', border: `2px solid ${BD}`, borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.55 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: BG2, border: `2px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🔖</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>My Collection</div>
            <div style={{ fontSize: 11, color: T2, marginTop: 2 }}>Bookmarks, notes & saved Qs</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: BG2, color: T3, border: `1px solid ${BD}` }}>Soon</span>
        </div>
      </div>
    </div>
  )
}

// ── Queries Sub-view ──────────────────────────────────────────────────────────
function QueriesView({ queries, onBack, onClose, onSelect }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [ratingPopup, setRatingPopup] = useState(null)

  const activeCount = queries.filter(q => q.status !== 'resolved').length
  const resolvedCount = queries.filter(q => q.status === 'resolved').length

  const byFilter = filter === 'all' ? queries
    : filter === 'active' ? queries.filter(q => q.status !== 'resolved')
    : queries.filter(q => q.status === 'resolved')

  const sq = search.trim().toLowerCase()
  const filtered = sq
    ? byFilter.filter(x =>
        x.category?.toLowerCase().includes(sq) ||
        x.sub_option?.toLowerCase().includes(sq) ||
        x.query_text?.toLowerCase().includes(sq) ||
        ticketId(x.id).toLowerCase().includes(sq)
      )
    : byFilter

  const STAT_ITEMS = [
    { label: 'Raised',    emoji: '📤', value: queries.length, key: 'all',      color: P,      bg: PL,        border: PB },
    { label: 'In review', emoji: '⏳', value: activeCount,    key: 'active',   color: ORANGE, bg: ORANGE_BG, border: '#FED7AA' },
    { label: 'Solved',    emoji: '✅', value: resolvedCount,  key: 'resolved', color: GREEN,  bg: GREEN_BG,  border: GREEN_BORDER },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(140deg, ${P} 0%, ${PD} 100%)`, padding: '12px 16px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>My Doubts</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{queries.length} total · {resolvedCount} cleared 🎯</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>

      {/* Stats strip — each card is the filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'white', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        {STAT_ITEMS.map((s, i) => {
          const active = filter === s.key
          return (
            <button key={s.key} onClick={() => setFilter(s.key)}
              style={{ padding: '12px 6px', textAlign: 'center', cursor: 'pointer', border: 'none', borderRight: i < 2 ? `1px solid ${BD}` : 'none', borderBottom: `3px solid ${active ? s.color : 'transparent'}`, background: active ? s.bg : 'white', transition: 'all 0.18s' }}>
              <div style={{ fontSize: 20 }}>{s.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: active ? s.color : T1, lineHeight: 1.1, transition: 'color 0.18s' }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: active ? s.color : T3, marginTop: 2, transition: 'color 0.18s' }}>{s.label}</div>
            </button>
          )
        })}
      </div>

      {/* Search bar — always visible */}
      <div style={{ padding: '8px 14px', background: 'white', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: BG2, border: `2px solid ${search ? P : BD}`, borderRadius: 12, padding: '8px 11px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={search ? P : T3} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doubts..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: T1, fontFamily: 'inherit', fontWeight: 500 }} />
          {search
            ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: 14, padding: 0, lineHeight: 1, display: 'flex' }}>✕</button>
            : <span style={{ fontSize: 11, color: T3, flexShrink: 0, fontWeight: 600 }}>{filtered.length}</span>
          }
        </div>
      </div>

      {/* Query list */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px', display: 'flex', flexDirection: 'column', gap: 10, background: BG2 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T2 }}>Kuch nahi mila</div>
            <div style={{ fontSize: 12, color: T3, marginTop: 4 }}>Try a different search or filter</div>
          </div>
        ) : (
          filtered.map(q => (
            <QueryCard
              key={q.id} query={q} onClick={() => onSelect(q)}
              onLowRating={(qry, stars, saveFn) => setRatingPopup({ query: qry, stars, onSave: saveFn })}
            />
          ))
        )}
      </div>

      {/* Low-rating popup */}
      {ratingPopup && (
        <ResolutionRatingPopup
          popup={ratingPopup}
          onSubmit={(note) => {
            ratingPopup.onSave?.(note)
            setRatingPopup(null)
          }}
          onClose={() => setRatingPopup(null)}
        />
      )}
    </div>
  )
}

// ── Main Overlay ─────────────────────────────────────────────────────────────
export default function QueryTracker({ onClose }) {
  const { queries } = useQueries()
  const [view, setView] = useState('profile') // 'profile' | 'queries' | 'detail'
  const [selected, setSelected] = useState(null)

  const openQuery = (q) => { setSelected(q); setView('detail') }

  if (view === 'detail' && selected) return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <QueryDetailView query={selected} onBack={() => setView('queries')} onClose={onClose} />
    </div>
  )

  if (view === 'queries') return (
    <div style={{ position: 'absolute', inset: 0, background: BG2, zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <QueriesView queries={queries} onBack={() => setView('profile')} onClose={onClose} onSelect={openQuery} />
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG2, zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ProfileHome queries={queries} onOpenQueries={() => setView('queries')} onClose={onClose} />
    </div>
  )
}
