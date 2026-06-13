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

const S = {
  'not-visited':     { bg: BG2, c: T3,  border: BD },
  'not-answered':    { bg: RL,  c: R,   border: RB },
  'answered':        { bg: GL,  c: G,   border: GB },
  'marked':          { bg: PL,  c: PD,  border: PB },
  'answered-marked': { bg: PL,  c: PD,  border: GB },
}

// Compact timer pill — used in grid overlay
function TimerPill({ timeLeft }) {
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

// Shared status bar SVGs
const StatusBar = () => (
  <div style={{ padding:'12px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
    <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
    <div style={{ display:'flex', gap:6, alignItems:'center', color:T1 }}>
      <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
    </div>
  </div>
)

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
  const cm = test?.correctMarks || 1
  const wm = test?.wrongMarks || -0.25

  // ── Derived counts ──
  const answeredCount    = Object.keys(answers).length
  const markedCount      = markedIds.size
  const notAnsweredCount = QUESTIONS.filter(qi => !answers[qi.id] && !markedIds.has(qi.id) && visitedIds.has(qi.id)).length
  const markedOnlyCount  = [...markedIds].filter(id => !answers[id]).length
  const notVisitedCount  = QUESTIONS.filter(qi => !visitedIds.has(qi.id)).length

  // ── Timer display ──
  const th = Math.floor(timeLeft / 3600)
  const tm = Math.floor((timeLeft % 3600) / 60)
  const ts = timeLeft % 60
  const timerStr = `${String(th).padStart(2,'0')} : ${String(tm).padStart(2,'0')} : ${String(ts).padStart(2,'0')}`
  const timerUrgent = timeLeft <= 300

  const computeAndFinalize = () => {
    let correct = 0, wrong = 0, unattempted = 0
    const topicMap = {}
    QUESTIONS.forEach(qi => {
      if (!topicMap[qi.topicName]) topicMap[qi.topicName] = { correct:0, wrong:0, unattempted:0 }
      if (!answers[qi.id])                    { unattempted++; topicMap[qi.topicName].unattempted++ }
      else if (answers[qi.id] === qi.correct) { correct++;    topicMap[qi.topicName].correct++ }
      else                                    { wrong++;      topicMap[qi.topicName].wrong++ }
    })
    const score = parseFloat((correct * cm + wrong * wm).toFixed(2))
    setFinalResults({ correct, wrong, unattempted, score, timeTaken: totalSecs - timeLeft, topicMap })
    setPhase('loading')
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) computeAndFinalize()
  }, [timeLeft])

  useEffect(() => {
    if (phase !== 'loading') return
    const id = setTimeout(() => setPhase('analysis'), 2500)
    return () => clearTimeout(id)
  }, [phase])

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

  // ── Loading phase ──────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>
        <StatusBar />
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

  // ── Analysis phase ─────────────────────────────────────────────────────────
  if (phase === 'analysis' && finalResults) {
    const r = finalResults
    const total = QUESTIONS.length
    const accuracy = total > 0 ? Math.round((r.correct / total) * 100) : 0
    const fmtTime = (secs) => {
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
      if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`
    }
    const ac = accuracy >= 60 ? G  : accuracy >= 40 ? A  : R
    const ab2 = accuracy >= 60 ? GL : accuracy >= 40 ? AL : RL
    const ab3 = accuracy >= 60 ? GB : accuracy >= 40 ? AB : RB
    const topics = Object.entries(r.topicMap)
    const todayFmt = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:BG2 }}>
        <div style={{ background:'white', flexShrink:0 }}>
          <StatusBar />
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px 12px', borderBottom:`1px solid ${BD}` }}>
            <button onClick={() => navigate('livetest')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:T1 }}>Test Results</div>
              <div style={{ fontSize:11, color:T3, marginTop:1 }}>{test?.name || 'Live Test'}</div>
            </div>
          </div>
        </div>
        <div className="scroll" style={{ flex:1, padding:'16px 16px 100px' }}>
          <div style={{ background:'white', borderRadius:16, padding:'24px 20px 20px', marginBottom:10, textAlign:'center', border:`1px solid ${BD}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:T3, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>Your Score</div>
            <div style={{ lineHeight:1 }}>
              <span style={{ fontSize:56, fontWeight:900, color:P }}>{r.score}</span>
              <span style={{ fontSize:22, fontWeight:600, color:T3 }}> / {total}</span>
            </div>
            <div style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:5, background:ab2, border:`1px solid ${ab3}`, borderRadius:20, padding:'5px 16px' }}>
              <span style={{ fontSize:13, fontWeight:700, color:ac }}>{accuracy}% Accuracy</span>
            </div>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:16 }}>
              <span style={{ fontSize:11, color:T3 }}>Submitted {todayFmt}</span>
              <span style={{ width:3, height:3, borderRadius:'50%', background:T3, display:'inline-block' }} />
              <span style={{ fontSize:11, color:T3 }}>⏱ {fmtTime(r.timeTaken)} taken</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { label:'Correct',  value:r.correct,    fg:G,  bg:GL,  bd:GB },
              { label:'Wrong',    value:r.wrong,      fg:R,  bg:RL,  bd:RB },
              { label:'Skipped',  value:r.unattempted,fg:T3, bg:BG2, bd:BD },
            ].map(c => (
              <div key={c.label} style={{ background:'white', border:`1px solid ${c.bd}`, borderRadius:12, padding:'14px 8px', textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:800, color:c.fg }}>{c.value}</div>
                <div style={{ fontSize:10, color:c.fg, fontWeight:600, marginTop:3 }}>{c.label}</div>
              </div>
            ))}
          </div>
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
        <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:`1px solid ${BD}`, background:'white', display:'flex', gap:10 }}>
          <button onClick={() => navigate('livetest')} style={{ flex:1, padding:'12px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>← Back</button>
          <button onClick={() => navigate('livetest')} style={{ flex:2, padding:'12px', borderRadius:10, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Back to Live Tests</button>
        </div>
      </div>
    )
  }

  // ── Main test screen ───────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, borderBottom:`1px solid ${BD}`, background:'white' }}>

        <StatusBar />

        {/* Time Left row — Testbook-style centered timer */}
        <div style={{ padding:'4px 14px 8px', display:'flex', alignItems:'center' }}>
          <button onClick={() => setShowExitConfirm(true)} style={{ background:'none', border:'none', cursor:'pointer', color:T2, fontSize:18, fontWeight:600, lineHeight:1, padding:0, flexShrink:0, width:28 }}>✕</button>
          <div style={{ flex:1, textAlign:'center', lineHeight:1.15 }}>
            <div style={{ fontSize:9, fontWeight:600, color:T3, letterSpacing:'0.08em', textTransform:'uppercase' }}>Time Left</div>
            <div style={{ fontSize:20, fontWeight:900, color: timerUrgent ? R : T1, letterSpacing:'0.05em', fontVariantNumeric:'tabular-nums' }}>
              {timerStr}
            </div>
          </div>
          <button onClick={() => setShowGrid(true)} style={{ background:'none', border:'none', cursor:'pointer', color:T2, flexShrink:0, display:'flex', padding:0, width:28, justifyContent:'flex-end' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>

        {/* Section bar */}
        <div style={{ padding:'5px 14px 6px', borderTop:`1px solid ${BD}`, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:9, fontWeight:700, color:T3, textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>Section</span>
          <span style={{ fontSize:11, fontWeight:700, color:'white', background:P, padding:'2px 10px', borderRadius:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:230 }}>
            {test?.name || 'Live Test'}
          </span>
        </div>

        {/* Question strip */}
        <div style={{ padding:'7px 14px 8px', borderTop:`1px solid ${BD}` }}>
          <div style={{ display:'flex', gap:4, overflowX:'auto' }}>
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
        </div>
      </div>

      {/* ── Question body ── */}
      <div className="scroll" style={{ flex:1, paddingBottom:110 }}>

        {/* Question label row — CBT style */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px 8px', borderBottom:`1px solid ${BD}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:T1 }}>Question No. {currentQ + 1}</span>
            {isMarked && (
              <span style={{ fontSize:10, fontWeight:700, background:PL, color:PD, border:`1px solid ${PB}`, padding:'2px 7px', borderRadius:20 }}>★ Marked</span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ padding:'2px 8px', borderRadius:4, background:GL, border:`1px solid ${GB}`, fontSize:11, fontWeight:700, color:G }}>+{cm}</span>
            <span style={{ padding:'2px 8px', borderRadius:4, background:RL, border:`1px solid ${RB}`, fontSize:11, fontWeight:700, color:R }}>{wm}</span>
            <button onClick={() => setShowReport(true)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3, color:T3, fontSize:10, fontWeight:500, padding:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Report
            </button>
          </div>
        </div>

        {/* Question text — plain, no box */}
        <div style={{ padding:'16px 16px 14px', fontSize, color:T1, lineHeight:1.75, fontWeight:500 }}>
          {q?.text}
        </div>

        {/* Image with scroll-to-explore magnify */}
        {q?.visual && (
          <div style={{ position:'relative', borderTop:`1px solid ${BD}`, borderBottom:`1px solid ${BD}`, background:BG2, height:200, overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, overflow: imageZoom > 1 ? 'auto' : 'hidden' }}>
              <img src={q.visual} alt="Question diagram" style={{
                display:'block',
                width: imageZoom > 1 ? `${imageZoom * 100}%` : '100%',
                height: imageZoom > 1 ? 'auto' : '100%',
                objectFit: imageZoom > 1 ? undefined : 'contain',
                minHeight: imageZoom > 1 ? '100%' : undefined,
              }} />
            </div>
            {imageZoom > 1 && (
              <div style={{ position:'absolute', top:8, left:8, padding:'2px 7px', borderRadius:4, background:'rgba(255,255,255,0.92)', border:`1px solid ${BD}`, fontSize:10, fontWeight:700, color:T2, pointerEvents:'none', zIndex:1 }}>
                {imageZoom}×
              </div>
            )}
            <button onClick={() => setImageZoom(z => z >= 2 ? 1 : parseFloat((z + 0.5).toFixed(1)))} style={{
              position:'absolute', bottom:8, right:8, zIndex:1,
              width:32, height:32, borderRadius:6,
              background:'rgba(255,255,255,0.94)', border:`1px solid ${BD}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.1)',
            }}>
              {imageZoom < 2
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              }
            </button>
          </div>
        )}

        {/* Options — CBT radio-circle style */}
        <div style={{ borderTop:`1px solid ${BD}` }}>
          {q?.options.map((opt, oi) => {
            const isSel = selected === opt.id
            return (
              <div key={opt.id} onClick={() => handleAnswer(opt.id)} style={{
                display:'flex', alignItems:'flex-start', gap:12,
                padding:'13px 16px',
                borderBottom: oi < q.options.length - 1 ? `1px solid ${BD}` : 'none',
                cursor:'pointer',
                background: isSel ? PL : 'white',
                transition:'background 0.1s',
              }}>
                {/* Radio circle */}
                <div style={{
                  width:18, height:18, borderRadius:'50%',
                  border:`2px solid ${isSel ? P : T3}`,
                  background: isSel ? P : 'white',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, marginTop:2,
                }}>
                  {isSel && <div style={{ width:6, height:6, borderRadius:'50%', background:'white' }} />}
                </div>
                <div style={{ flex:1, fontSize, lineHeight:1.65, display:'flex', gap:6 }}>
                  <span style={{ fontWeight:700, color: isSel ? PD : T1, flexShrink:0 }}>{opt.id.toUpperCase()}.</span>
                  <span style={{ color: isSel ? PD : T1 }}>{opt.text}</span>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* ── Bottom controls — Testbook layout ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderTop:`1px solid ${BD}`, padding:'10px 14px 16px' }}>
        {/* Row 1: Mark for Review & Next | Clear Response */}
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <button onClick={handleMarkAndNext} style={{
            flex:1, padding:'9px 8px', borderRadius:7,
            border:`1.5px solid ${isMarked ? PB : BD}`,
            background: isMarked ? PL : 'white',
            fontSize:11, fontWeight:600, color: isMarked ? PD : T2, cursor:'pointer',
          }}>
            {isMarked ? '★ Marked for Review' : 'Mark for Review & Next'}
          </button>
          <button onClick={handleClear} style={{
            padding:'9px 14px', borderRadius:7,
            border:`1.5px solid ${BD}`, background:'white',
            fontSize:11, fontWeight:600, color:T2, cursor:'pointer',
          }}>
            Clear Response
          </button>
        </div>
        {/* Row 2: Previous | Save & Next */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => goTo(currentQ - 1)} disabled={currentQ === 0} style={{
            flex:1, padding:'12px', borderRadius:7,
            border:`1.5px solid ${BD}`, background:'white',
            fontSize:13, fontWeight:600, color: currentQ === 0 ? T3 : T1,
            cursor: currentQ === 0 ? 'default' : 'pointer',
            opacity: currentQ === 0 ? 0.5 : 1,
          }}>
            ← Previous
          </button>
          <button onClick={handleSaveNext} style={{
            flex:2, padding:'12px', borderRadius:7,
            background:P, color:'white', border:'none',
            fontSize:13, fontWeight:700, cursor:'pointer',
          }}>
            {isLastQ ? 'Submit Test' : 'Save & Next →'}
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
                <div style={{ fontSize:14, fontWeight:800, color:T1 }}>{test?.name || 'Live Test'}</div>
                <div style={{ fontSize:11, color:T3, marginTop:2 }}>
                  {answeredCount} answered · {markedCount} marked · {notVisitedCount} not visited
                </div>
              </div>
              <TimerPill timeLeft={timeLeft} />
            </div>
            <div style={{ padding:'10px 20px', display:'flex', gap:12, flexWrap:'wrap', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
              {[['answered','Answered'],['not-answered','Not Answered'],['marked','Marked'],['not-visited','Not Visited']].map(([status, label]) => (
                <div key={status} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:13, height:13, borderRadius:3, background:S[status].bg, border:`1.5px solid ${S[status].border}` }} />
                  <span style={{ fontSize:10, color:T2 }}>{label}</span>
                </div>
              ))}
            </div>
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
              <button onClick={() => setShowGrid(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>Resume</button>
              <button onClick={() => { setShowGrid(false); setShowSubmitConfirm(true) }} style={{ flex:2, padding:'11px', borderRadius:10, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Submit Test</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit confirm — Testbook-style summary table ── */}
      {showSubmitConfirm && (
        <div className="popup-overlay">
          <div className="popup" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${BD}` }}>
              <div style={{ fontSize:15, fontWeight:700, color:T1, textAlign:'center' }}>Submit your test</div>
              {timeLeft > 0 && (
                <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize:11, color:A, fontWeight:600 }}>
                    {`${String(Math.floor(timeLeft/3600)).padStart(2,'0')}:${String(Math.floor((timeLeft%3600)/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`} still remaining
                  </span>
                </div>
              )}
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:P }}>
                    {['Section','Qs','Answered','Not Ans.','Marked','Not Visited'].map(col => (
                      <th key={col} style={{ padding:'8px 5px', color:'white', fontWeight:700, textAlign:'center', fontSize:10, whiteSpace:'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding:'12px 8px 12px 12px', fontSize:11, color:T1, fontWeight:600 }}>Live Test</td>
                    <td style={{ padding:'12px 5px', textAlign:'center', fontWeight:700, color:T1, fontSize:13 }}>{QUESTIONS.length}</td>
                    <td style={{ padding:'12px 5px', textAlign:'center', fontWeight:700, color:G,  fontSize:13 }}>{answeredCount}</td>
                    <td style={{ padding:'12px 5px', textAlign:'center', fontWeight:700, color:R,  fontSize:13 }}>{notAnsweredCount}</td>
                    <td style={{ padding:'12px 5px', textAlign:'center', fontWeight:700, color:PD, fontSize:13 }}>{markedOnlyCount}</td>
                    <td style={{ padding:'12px 5px', textAlign:'center', fontWeight:700, color:T3, fontSize:13 }}>{notVisitedCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ padding:'14px 20px 20px', display:'flex', justifyContent:'flex-end', gap:10, borderTop:`1px solid ${BD}` }}>
              <button onClick={() => setShowSubmitConfirm(false)} style={{ padding:'10px 20px', borderRadius:8, border:`1px solid ${BD}`, background:'white', fontSize:13, fontWeight:600, color:T2, cursor:'pointer' }}>Close</button>
              <button onClick={handleSubmit} style={{ padding:'10px 20px', borderRadius:8, background:P, color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Report issue ── */}
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
                    {['technical','content'].map(type => (
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
