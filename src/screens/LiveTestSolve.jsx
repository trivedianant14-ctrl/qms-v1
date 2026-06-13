import { useState, useEffect } from 'react'
import { QUESTIONS } from '../data'

const P='#534AB7', PL='#EEEDFE', PB='#AFA9EC', PD='#3C3489'
const G='#3B6D11', GL='#EAF3DE', GB='#97C459'
const R='#791F1F', RL='#FCEBEB', RB='#F09595'
const A='#633806', AL='#FAEEDA', AB='#FAC775'
const T1='#1a1a2e', T2='#5a5a78', T3='#9898b0', BD='#e8e8f2', BG2='#f5f5fb'

const REPORT_OPTIONS = {
  technical: ['App is crashing or freezing', 'Question not loading', 'Options not selectable', 'Timer not working', 'Other technical issue'],
  content: ['Wrong answer marked correct', 'Explanation is incorrect', 'Grammatical or spelling error', 'Question is out of syllabus', 'Other content issue'],
}

// not-visited | not-answered | answered | marked | answered-marked
const S = {
  'not-visited':     { bg: BG2, c: T3,  border: BD },
  'not-answered':    { bg: RL,  c: R,   border: RB },
  'answered':        { bg: GL,  c: G,   border: GB },
  'marked':          { bg: PL,  c: PD,  border: PB },
  'answered-marked': { bg: PL,  c: PD,  border: GB },
}

// Full-size timer used in grid overlay header
function Timer({ timeLeft }) {
  const h = Math.floor(timeLeft / 3600)
  const m = Math.floor((timeLeft % 3600) / 60)
  const s = timeLeft % 60
  const urgent = timeLeft <= 300
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:20, background: urgent ? RL : BG2, border:`1px solid ${urgent ? RB : BD}` }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={urgent ? R : T2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
      <span style={{ fontSize:12, fontWeight:700, color: urgent ? R : T2, fontVariantNumeric:'tabular-nums' }}>
        {h > 0 && `${String(h).padStart(2,'0')}:`}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
    </div>
  )
}

// Compact inline timer — sits in the question strip row, same height as squares
function TimerInline({ timeLeft }) {
  const h = Math.floor(timeLeft / 3600)
  const m = Math.floor((timeLeft % 3600) / 60)
  const s = timeLeft % 60
  const urgent = timeLeft <= 300
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:3, flexShrink:0,
      height:22, padding:'0 7px', borderRadius:6,
      background: urgent ? RL : BG2,
      border:`1.5px solid ${urgent ? RB : BD}`,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={urgent ? R : T2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
      <span style={{ fontSize:10, fontWeight:700, color: urgent ? R : T2, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
        {h > 0 && `${String(h).padStart(2,'0')}:`}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
    </div>
  )
}

export default function LiveTestSolve({ navigate, test }) {
  const totalSecs = (test?.duration || 120) * 60
  const [currentQ, setCurrentQ]         = useState(0)
  const [answers, setAnswers]           = useState({})
  const [markedIds, setMarkedIds]       = useState(new Set())
  const [visitedIds, setVisitedIds]     = useState(() => new Set([QUESTIONS[0]?.id]))
  const [timeLeft, setTimeLeft]         = useState(totalSecs)
  const [showGrid, setShowGrid]         = useState(false)
  const [showExitConfirm, setShowExitConfirm]     = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showReport, setShowReport]     = useState(false)
  const [reportType, setReportType]     = useState('technical')
  const [reportSubs, setReportSubs]     = useState(new Set())
  const [reportNote, setReportNote]     = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [fontSize, setFontSize]         = useState(14)
  const [imageZoom, setImageZoom]       = useState(1)
  const [phase, setPhase]               = useState('test')
  const [finalResults, setFinalResults] = useState(null)

  const q        = QUESTIONS[currentQ]
  const selected = answers[q?.id]
  const isMarked = markedIds.has(q?.id)
  const isLastQ  = currentQ === QUESTIONS.length - 1

  const computeAndFinalize = () => {
    let correct = 0, wrong = 0, unattempted = 0
    const topicMap = {}
    QUESTIONS.forEach(q => {
      if (!topicMap[q.topicName]) topicMap[q.topicName] = { correct:0, wrong:0, unattempted:0 }
      if (!answers[q.id])                   { unattempted++; topicMap[q.topicName].unattempted++ }
      else if (answers[q.id] === q.correct) { correct++;    topicMap[q.topicName].correct++ }
      else                                  { wrong++;      topicMap[q.topicName].wrong++ }
    })
    const cm = test?.correctMarks || 1
    const wm = test?.wrongMarks || -0.25
    const score = parseFloat((correct * cm + wrong * wm).toFixed(2))
    setFinalResults({ correct, wrong, unattempted, score, timeTaken: totalSecs - timeLeft, topicMap })
    setPhase('loading')
  }

  // Global countdown — runs once, auto-submits when done
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) computeAndFinalize()
  }, [timeLeft])

  // Loading → analysis after 2.5 s
  useEffect(() => {
    if (phase !== 'loading') return
    const id = setTimeout(() => setPhase('analysis'), 2500)
    return () => clearTimeout(id)
  }, [phase])

  // Mark question visited on navigate; reset image zoom
  useEffect(() => {
    if (q) setVisitedIds(prev => new Set([...prev, q.id]))
    setImageZoom(1)
  }, [currentQ])

  const getStatus = (i) => {
    const qi = QUESTIONS[i]
    const ans = !!answers[qi.id]
    const mrk = markedIds.has(qi.id)
    if (ans && mrk) return 'answered-marked'
    if (ans) return 'answered'
    if (mrk) return 'marked'
    if (visitedIds.has(qi.id)) return 'not-answered'
    return 'not-visited'
  }

  const answeredCount   = Object.keys(answers).length
  const markedCount     = markedIds.size
  const unansweredCount = QUESTIONS.length - answeredCount

  const goTo = (i) => setCurrentQ(Math.max(0, Math.min(QUESTIONS.length - 1, i)))

  const handleAnswer = (optId) => setAnswers(a => ({ ...a, [q.id]: optId }))

  const handleClear = () => setAnswers(a => { const n = { ...a }; delete n[q.id]; return n })

  const handleMarkAndNext = () => {
    setMarkedIds(prev => { const n = new Set(prev); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n })
    if (!isLastQ) goTo(currentQ + 1)
  }

  const handleSaveNext = () => {
    if (!isLastQ) goTo(currentQ + 1)
    else setShowSubmitConfirm(true)
  }

  const handleSubmit = () => { setShowSubmitConfirm(false); computeAndFinalize() }

  // ── Loading phase ──
  if (phase === 'loading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white', position:'relative' }}>
        <div style={{ padding:'12px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center', color:T1 }}>
            <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
          </div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 32px' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', border:`5px solid ${PL}`, borderTop:`5px solid ${P}`, animation:'spin 0.85s linear infinite', marginBottom:32 }} />
          <div style={{ fontSize:20, fontWeight:800, color:T1, marginBottom:8, textAlign:'center' }}>Preparing your analysis</div>
          <div style={{ fontSize:13, color:T3, textAlign:'center', lineHeight:1.6 }}>Calculating score and subject performance…</div>
        </div>
        <div style={{ height:5, background:BG2, flexShrink:0, position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', background:P, borderRadius:3, animation:'progressFill 2.4s ease forwards' }} />
        </div>
      </div>
    )
  }

  // ── Analysis phase ──
  if (phase === 'analysis' && finalResults) {
    const r = finalResults
    const total = QUESTIONS.length
    const accuracy = total > 0 ? Math.round((r.correct / total) * 100) : 0
    const fmtTime = (secs) => {
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
      if (h > 0) return `${h}h ${m}m`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    }
    const accuracyColor  = accuracy >= 60 ? G  : accuracy >= 40 ? A  : R
    const accuracyBg     = accuracy >= 60 ? GL : accuracy >= 40 ? AL : RL
    const accuracyBorder = accuracy >= 60 ? GB : accuracy >= 40 ? AB : RB
    const topics = Object.entries(r.topicMap)
    const todayFmt = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG2 }}>
        {/* Status bar */}
        <div style={{ padding:'12px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'white' }}>
          <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center', color:T1 }}>
            <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
          </div>
        </div>
        {/* Nav */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px 12px', borderBottom:`1px solid ${BD}`, flexShrink:0, background:'white' }}>
          <button onClick={() => navigate('livetest')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T1 }}>Test Results</div>
            <div style={{ fontSize:11, color:T3, marginTop:1 }}>{test?.name || 'Live Test'}</div>
          </div>
        </div>
        {/* Scrollable body */}
        <div className="scroll" style={{ flex:1, padding:'16px 16px 100px' }}>
          {/* Score hero */}
          <div style={{ background:'white', borderRadius:16, padding:'24px 20px 20px', marginBottom:10, textAlign:'center', border:`1px solid ${BD}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:T3, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>Your Score</div>
            <div style={{ lineHeight:1 }}>
              <span style={{ fontSize:56, fontWeight:900, color:P }}>{r.score}</span>
              <span style={{ fontSize:22, fontWeight:600, color:T3 }}> / {total}</span>
            </div>
            <div style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:5, background:accuracyBg, border:`1px solid ${accuracyBorder}`, borderRadius:20, padding:'5px 16px' }}>
              <span style={{ fontSize:13, fontWeight:700, color:accuracyColor }}>{accuracy}% Accuracy</span>
            </div>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:16 }}>
              <span style={{ fontSize:11, color:T3 }}>Submitted {todayFmt}</span>
              <span style={{ width:3, height:3, borderRadius:'50%', background:T3, display:'inline-block' }} />
              <span style={{ fontSize:11, color:T3 }}>⏱ {fmtTime(r.timeTaken)} taken</span>
            </div>
          </div>
          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { label:'Correct',    value:r.correct,    fg:G,  bg:GL,  bd:GB  },
              { label:'Wrong',      value:r.wrong,      fg:R,  bg:RL,  bd:RB  },
              { label:'Skipped',    value:r.unattempted,fg:T3, bg:BG2, bd:BD  },
            ].map(c => (
              <div key={c.label} style={{ background:'white', border:`1px solid ${c.bd}`, borderRadius:12, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:800, color:c.fg }}>{c.value}</div>
                <div style={{ fontSize:10, color:c.fg, fontWeight:600, marginTop:3 }}>{c.label}</div>
              </div>
            ))}
          </div>
          {/* Topic breakdown */}
          <div style={{ fontSize:12, fontWeight:700, color:T2, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Subject Performance</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {topics.map(([name, t]) => {
              const tt = t.correct + t.wrong + t.unattempted
              const pct = tt > 0 ? Math.round((t.correct / tt) * 100) : 0
              const fg = pct >= 60 ? G : pct >= 40 ? A : R
              const bar = pct >= 60 ? GB : pct >= 40 ? AB : RB
              return (
                <div key={name} style={{ background:'white', borderRadius:12, padding:'14px 16px', border:`1px solid ${BD}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:T1 }}>{name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:fg }}>{pct}%</span>
                  </div>
                  <div style={{ display:'flex', gap:5, marginBottom:10 }}>
                    <span style={{ fontSize:10, color:G,  background:GL,  padding:'2px 8px', borderRadius:20, border:`1px solid ${GB}` }}>✓ {t.correct}</span>
                    <span style={{ fontSize:10, color:R,  background:RL,  padding:'2px 8px', borderRadius:20, border:`1px solid ${RB}` }}>✗ {t.wrong}</span>
                    <span style={{ fontSize:10, color:T3, background:BG2, padding:'2px 8px', borderRadius:20, border:`1px solid ${BD}` }}>— {t.unattempted}</span>
                  </div>
                  <div style={{ height:4, background:BG2, borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:bar, borderRadius:2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Bottom buttons */}
        <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:`1px solid ${BD}`, background:'white', display:'flex', gap:10 }}>
          <button onClick={() => navigate('livetest')} style={{ flex:1, padding:'12px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>
            ← Back
          </button>
          <button onClick={() => navigate('livetest')} style={{ flex:2, padding:'12px', borderRadius:10, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Back to Live Tests
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, borderBottom:`1px solid ${BD}` }}>

        {/* Status bar */}
        <div style={{ padding:'12px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
          <div style={{ display:'flex', gap:6, alignItems:'center', color:T1 }}>
            <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
          </div>
        </div>

        {/* Nav row: exit | Q counter (timer + grid both moved out) */}
        <div style={{ padding:'4px 16px 10px', display:'flex', alignItems:'center' }}>
          <button onClick={() => setShowExitConfirm(true)} style={{ background:'none', border:'none', cursor:'pointer', color:T1, fontSize:20, fontWeight:700, lineHeight:1, width:28 }}>✕</button>
          <div style={{ flex:1, textAlign:'center' }}>
            <span style={{ fontSize:13, fontWeight:700, color:T1 }}>Q {currentQ + 1}</span>
            <span style={{ fontSize:13, fontWeight:400, color:T3 }}> / {QUESTIONS.length}</span>
          </div>
          <div style={{ width:28 }} />
        </div>

        {/* Question strip — squares scroll left, grid icon pinned right */}
        <div style={{ padding:'0 16px 10px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, display:'flex', gap:4, overflowX:'auto' }}>
            {QUESTIONS.map((_, i) => {
              const st = S[getStatus(i)]
              const isCur = i === currentQ
              return (
                <div key={i} onClick={() => goTo(i)} style={{
                  width:30, height:30, borderRadius:5, flexShrink:0,
                  background: isCur ? P : st.bg,
                  color: isCur ? 'white' : st.c,
                  border:`1.5px solid ${isCur ? P : st.border}`,
                  fontSize:11, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                }}>
                  {i + 1}
                </div>
              )
            })}
          </div>
          <button onClick={() => setShowGrid(true)} style={{ background:'none', border:'none', cursor:'pointer', color:T2, flexShrink:0, display:'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </div>

      {/* ── Question body ── */}
      <div className="scroll" style={{ flex:1, padding:'16px 16px 100px' }}>

        {/* Question label row — "Question N" [marked badge] on left, timer on right */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T2 }}>Question {currentQ + 1}</span>
            {isMarked && (
              <span style={{ fontSize:10, fontWeight:700, background:PL, color:PD, border:`1px solid ${PB}`, padding:'2px 7px', borderRadius:20 }}>
                ★ Marked
              </span>
            )}
          </div>
          <TimerInline timeLeft={timeLeft} />
        </div>

        <div style={{ background:'white', border:`1px solid ${BD}`, borderRadius:6, padding:'14px', marginBottom:14, fontSize, color:T1, lineHeight:1.6, fontWeight:500 }}>
          {q?.text}
        </div>

        {/* Image with scroll-to-explore magnify */}
        {q?.visual && (
          <div style={{ position:'relative', borderRadius:6, border:`1px solid ${BD}`, marginBottom:14, background:BG2, height:200, overflow:'hidden' }}>
            {/* Scrollable inner pane — overflow:auto when zoomed */}
            <div style={{
              position:'absolute', inset:0,
              overflow: imageZoom > 1 ? 'auto' : 'hidden',
            }}>
              <img
                src={q.visual}
                alt="Question diagram"
                style={{
                  display:'block',
                  width: imageZoom > 1 ? `${imageZoom * 100}%` : '100%',
                  height: imageZoom > 1 ? 'auto' : '100%',
                  objectFit: imageZoom > 1 ? undefined : 'contain',
                  minHeight: imageZoom > 1 ? '100%' : undefined,
                }}
              />
            </div>
            {/* Zoom level badge */}
            {imageZoom > 1 && (
              <div style={{ position:'absolute', top:8, left:8, padding:'2px 7px', borderRadius:4, background:'rgba(255,255,255,0.92)', border:`1px solid ${BD}`, fontSize:10, fontWeight:700, color:T2, pointerEvents:'none', zIndex:1 }}>
                {imageZoom}×
              </div>
            )}
            {/* Magnify button — cycles 1× → 1.5× → 2× → 1× */}
            <button
              onClick={() => setImageZoom(z => z >= 2 ? 1 : parseFloat((z + 0.5).toFixed(1)))}
              style={{
                position:'absolute', bottom:8, right:8, zIndex:1,
                width:32, height:32, borderRadius:6,
                background:'rgba(255,255,255,0.94)',
                border:`1px solid ${BD}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer',
                boxShadow:'0 1px 4px rgba(0,0,0,0.1)',
              }}
              title={imageZoom >= 2 ? 'Reset zoom' : 'Zoom in'}
            >
              {imageZoom < 2
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              }
            </button>
          </div>
        )}

        {q?.options.map(opt => (
          <button key={opt.id} onClick={() => handleAnswer(opt.id)} style={{
            width:'100%', padding:'13px 16px', borderRadius:6, marginBottom:8,
            border:`1.5px solid ${selected === opt.id ? PB : BD}`,
            background: selected === opt.id ? PL : 'white',
            color: selected === opt.id ? PD : T1,
            textAlign:'left', cursor:'pointer', fontSize, fontWeight:500,
            display:'flex', alignItems:'center',
            transition:'all 0.12s',
          }}>
            <span style={{ fontWeight:700, marginRight:8, flexShrink:0 }}>{opt.id.toUpperCase()}.</span>
            {opt.text}
          </button>
        ))}

        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={() => setShowReport(true)} style={{ background:'none', border:'none', color:T3, fontSize:12, cursor:'pointer' }}>
            Report an issue →
          </button>
        </div>
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderTop:`1px solid ${BD}`, padding:'10px 16px 14px' }}>
        {/* Row 1: Clear + Mark */}
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <button onClick={handleClear} style={{
            flex:1, padding:'9px', borderRadius:10,
            border:`1px solid ${BD}`, background:'white',
            fontSize:12, fontWeight:600, color:T2, cursor:'pointer',
          }}>
            Clear Response
          </button>
          <button onClick={handleMarkAndNext} style={{
            flex:1, padding:'9px', borderRadius:10,
            border:`1px solid ${isMarked ? PB : BD}`,
            background: isMarked ? PL : 'white',
            fontSize:12, fontWeight:600, color: isMarked ? PD : T2, cursor:'pointer',
          }}>
            {isMarked ? '★ Marked' : '☆ Mark & Next'}
          </button>
        </div>
        {/* Row 2: Previous + Save & Next */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => goTo(currentQ - 1)} disabled={currentQ === 0} style={{
            flex:1, padding:'12px', borderRadius:10,
            border:`1px solid ${BD}`, background:'white',
            fontSize:13, fontWeight:600, color: currentQ === 0 ? T3 : T1,
            cursor: currentQ === 0 ? 'default' : 'pointer',
            opacity: currentQ === 0 ? 0.5 : 1,
          }}>
            ← Previous
          </button>
          <button onClick={handleSaveNext} style={{
            flex:2, padding:'12px', borderRadius:10,
            background:P, color:'white', border:'none',
            fontSize:13, fontWeight:700, cursor:'pointer',
          }}>
            {isLastQ ? 'Submit' : 'Save & Next →'}
          </button>
        </div>
      </div>

      {/* ── Question Grid overlay ── */}
      {showGrid && (
        <div className="overlay" onClick={() => setShowGrid(false)}>
          <div className="sheet" style={{ maxHeight:'78%' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />

            <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:T1, lineHeight:1.3 }}>{test?.name || 'Live Test'}</div>
                <div style={{ fontSize:11, color:T3, marginTop:2 }}>
                  {answeredCount} answered · {markedCount} marked · {unansweredCount} remaining
                </div>
              </div>
              <Timer timeLeft={timeLeft} />
            </div>

            {/* Legend */}
            <div style={{ padding:'10px 20px', display:'flex', gap:12, flexWrap:'wrap', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
              {[['answered','Answered'],['not-answered','Not Answered'],['marked','Marked'],['not-visited','Not Visited']].map(([status, label]) => (
                <div key={status} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:13, height:13, borderRadius:3, background:S[status].bg, border:`1.5px solid ${S[status].border}` }} />
                  <span style={{ fontSize:10, color:T2 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Number grid */}
            <div className="scroll" style={{ flex:1, padding:'14px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
                {QUESTIONS.map((_, i) => {
                  const st = S[getStatus(i)]
                  const isCur = i === currentQ
                  return (
                    <button key={i} onClick={() => { goTo(i); setShowGrid(false) }} style={{
                      padding:'11px 0', borderRadius:4,
                      border:`2px solid ${isCur ? P : st.border}`,
                      background: isCur ? P : st.bg,
                      color: isCur ? 'white' : st.c,
                      fontSize:13, fontWeight:700, cursor:'pointer',
                      boxShadow: isCur ? `0 0 0 3px ${PL}` : 'none',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ padding:'12px 20px 20px', borderTop:`1px solid ${BD}`, flexShrink:0, display:'flex', gap:10 }}>
              <button onClick={() => setShowGrid(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>
                Resume
              </button>
              <button onClick={() => { setShowGrid(false); setShowSubmitConfirm(true) }} style={{ flex:2, padding:'11px', borderRadius:10, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit confirm ── */}
      {showSubmitConfirm && (() => {
        const h = Math.floor(timeLeft / 3600)
        const m = Math.floor((timeLeft % 3600) / 60)
        const s = timeLeft % 60
        const timeStr = h > 0
          ? `${h}h ${String(m).padStart(2,'0')}m remaining`
          : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s remaining`
        return (
          <div className="popup-overlay">
            <div className="popup">
              <div style={{ fontSize:17, fontWeight:700, color:T1, marginBottom:12 }}>Submit Test?</div>
              {timeLeft > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:7, background:AL, border:`1px solid ${AB}`, borderRadius:8, padding:'9px 12px', marginBottom:12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize:12, fontWeight:600, color:A }}>You still have {timeStr}. Are you sure?</span>
                </div>
              )}
              <div style={{ fontSize:13, color:T2, lineHeight:1.6, marginBottom: markedCount > 0 ? 10 : 20 }}>
                {unansweredCount > 0
                  ? `${unansweredCount} question${unansweredCount > 1 ? 's are' : ' is'} unanswered — no marks will be awarded for those.`
                  : 'You have answered all questions. Ready to submit?'}
              </div>
              {markedCount > 0 && (
                <div style={{ fontSize:12, color:PD, background:PL, border:`1px solid ${PB}`, borderRadius:8, padding:'8px 12px', marginBottom:20 }}>
                  {markedCount} question{markedCount > 1 ? 's are' : ' is'} still marked for review.
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowSubmitConfirm(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>Review</button>
                <button onClick={handleSubmit} style={{ flex:1, padding:'11px', borderRadius:10, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Submit</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Exit confirm ── */}
      {showExitConfirm && (
        <div className="popup-overlay">
          <div className="popup">
            <div style={{ fontSize:17, fontWeight:700, color:T1, marginBottom:8 }}>Exit Test?</div>
            <div style={{ fontSize:13, color:P, lineHeight:1.7, marginBottom:20 }}>
              Your responses will be saved. You can return and continue anytime within the live test window.
              <br /><br />
              <span style={{ color:T2, fontWeight:600 }}>We recommend completing the test in one single sitting for the best experience.</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>Continue Test</button>
              <button onClick={() => { setShowExitConfirm(false); navigate('livetest') }} style={{ flex:1, padding:'11px', borderRadius:10, background:'#791F1F', color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report ── */}
      {showReport && (
        <div className="overlay" onClick={() => { setShowReport(false); setReportSubmitted(false); setReportSubs(new Set()); setReportNote('') }}>
          <div className="sheet" style={{ maxHeight:'88%' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            {reportSubmitted ? (
              <div style={{ padding:'30px 20px 40px', textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:GL, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:24 }}>✓</div>
                <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:6 }}>Report submitted</div>
                <div style={{ fontSize:13, color:T2 }}>Our team will review this question.</div>
                <button onClick={() => { setShowReport(false); setReportSubmitted(false); setReportSubs(new Set()); setReportNote('') }} style={{ marginTop:20, width:'100%', padding:'12px', borderRadius:10, background:P, color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' }}>Done</button>
              </div>
            ) : (
              <div style={{ overflowY:'auto', flex:1 }}>
                <div style={{ padding:'14px 20px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${BD}` }}>
                  <span style={{ fontSize:16, fontWeight:700, color:T1 }}>Report an Issue</span>
                  <button onClick={() => setShowReport(false)} style={{ background:'none', border:'none', fontSize:22, color:T3, cursor:'pointer' }}>×</button>
                </div>
                <div style={{ padding:'16px 20px 30px' }}>
                  <div style={{ display:'flex', gap:16, marginBottom:18 }}>
                    {['technical', 'content'].map(type => (
                      <label key={type} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                        <input type="radio" name="rtype" value={type} checked={reportType === type} onChange={() => { setReportType(type); setReportSubs(new Set()) }} style={{ width:18, height:18, accentColor:P }} />
                        <span style={{ fontSize:13, fontWeight:600, color:T1 }}>{type === 'technical' ? 'Technical' : 'Content'}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', marginBottom:16 }}>
                    {REPORT_OPTIONS[reportType].map(opt => (
                      <label key={opt} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:`1px solid ${BD}`, cursor:'pointer' }}>
                        <input type="checkbox" checked={reportSubs.has(opt)} onChange={() => setReportSubs(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n })} style={{ width:18, height:18, accentColor:P, flexShrink:0 }} />
                        <span style={{ fontSize:13, color:T1 }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <textarea value={reportNote} onChange={e => setReportNote(e.target.value)} placeholder="Describe the issue... (optional)" style={{ width:'100%', minHeight:72, padding:'10px 12px', border:`1px solid ${BD}`, borderRadius:10, fontSize:13, color:T1, resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:16 }} />
                  <button onClick={() => setReportSubmitted(true)} disabled={reportSubs.size === 0} style={{ width:'100%', padding:'12px', borderRadius:10, background: reportSubs.size === 0 ? BG2 : P, color: reportSubs.size === 0 ? T3 : 'white', border:'none', fontSize:14, fontWeight:700, cursor: reportSubs.size === 0 ? 'not-allowed' : 'pointer' }}>Submit Report</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
