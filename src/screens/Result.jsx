import { useState, useEffect } from 'react'
import { QUESTIONS, TOPICS } from '../data'

const P='#534AB7',PL='#EEEDFE',PB='#AFA9EC',PD='#3C3489'
const T1='#1a1a2e',T2='#5a5a78',T3='#9898b0',BD='#e8e8f2',BG2='#f5f5fb'
const GREEN='#3B6D11',GREEN_BG='#EAF3DE',GREEN_BD='#97C459'
const RED='#A32D2D',RED_BG='#FCEBEB',RED_BD='#F09595'

const RATING_LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent']

function SemiGauge({ pct }) {
  const r = 108, cx = 150, cy = 130
  const len = Math.PI * r
  const color = pct >= 80 ? '#3B6D11' : pct >= 60 ? P : pct >= 40 ? '#E65100' : RED
  const trackColor = pct >= 80 ? '#C8E6A0' : pct >= 60 ? PL : pct >= 40 ? '#FFE0B2' : '#FCEBEB'
  const angle = Math.PI * (1 - pct / 100)
  const dotX = cx + r * Math.cos(Math.PI - angle)
  const dotY = cy - r * Math.sin(Math.PI - angle)
  return (
    <svg width="100%" viewBox="0 0 300 148" style={{ overflow: 'visible', display: 'block' }}>
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
        fill="none" stroke={trackColor} strokeWidth="18" strokeLinecap="round" />
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
        fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len * (1 - pct / 100)}
        style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {pct > 2 && <circle cx={dotX} cy={dotY} r="9" fill={color} />}
    </svg>
  )
}

export default function Result({ navigate, answers, mode, viewSolution, setShowReattemptConfirm, showReattemptConfirm, handleReattempt, isReattempt }) {
  const [showAllWrong, setShowAllWrong] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [animPct, setAnimPct] = useState(0)

  const correct   = QUESTIONS.filter(q => answers[q.id] === q.correct).length
  const incorrect = QUESTIONS.filter(q => answers[q.id] && answers[q.id] !== q.correct && answers[q.id] !== 'timeout').length
  const skipped   = QUESTIONS.filter(q => answers[q.id] === 'timeout').length
  const total     = QUESTIONS.length
  const accuracy  = total > 0 ? Math.round((correct / total) * 100) : 0

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 60)
    const t2 = setTimeout(() => setAnimPct(accuracy), 180)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [accuracy])

  const gaugeColor = accuracy >= 80 ? '#3B6D11' : accuracy >= 60 ? P : accuracy >= 40 ? '#E65100' : RED

  const getMsg = () => {
    if (accuracy >= 80) return { headline: 'Outstanding!', sub: 'You really know your stuff.' }
    if (accuracy >= 60) return { headline: 'Good effort!', sub: "You're making great progress." }
    if (accuracy >= 40) return { headline: 'Keep going!', sub: 'Practice a bit more and you\'ll nail it.' }
    return { headline: "Don't give up!", sub: 'Every attempt makes you stronger.' }
  }
  const msg = getMsg()

  const wrongQs = QUESTIONS.filter(q => {
    const a = answers[q.id]
    return !a || a === 'timeout' || (a && a !== q.correct)
  })
  const missedPYQs = wrongQs.filter(q => q.isPYQ)
  const visibleWrongQs = showAllWrong ? wrongQs : wrongQs.slice(0, 3)

  const topicData = TOPICS.map(t => {
    const topicQs = QUESTIONS.filter(q => q.topicId === t.id)
    if (topicQs.length === 0) return null
    const topicCorrect  = topicQs.filter(q => answers[q.id] === q.correct).length
    const topicWrong    = topicQs.filter(q => answers[q.id] && answers[q.id] !== q.correct && answers[q.id] !== 'timeout').length
    const topicSkipped  = topicQs.filter(q => !answers[q.id] || answers[q.id] === 'timeout').length
    const topicAttempted = topicQs.filter(q => answers[q.id] && answers[q.id] !== 'timeout').length
    const topicAcc = topicAttempted > 0 ? Math.round((topicCorrect / topicAttempted) * 100) : 0
    const pyqCount = topicQs.filter(q => q.isPYQ).length
    return { ...t, correct: topicCorrect, wrong: topicWrong, skipped: topicSkipped, attempted: topicAttempted, total: topicQs.length, acc: topicAcc, pyqCount }
  }).filter(Boolean)

  const weakTopics = topicData.filter(t => t.wrong > 0 || t.skipped > 0).sort((a, b) => (b.wrong - a.wrong) || (b.skipped - a.skipped))
  const avgTime = 48
  const totalTime = `${Math.floor((avgTime * total) / 60)}m ${(avgTime * total) % 60}s`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ padding: '12px 20px 4px', display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: T1 }}>9:41</span>
        </div>
        <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${BD}` }}>
          <button onClick={() => navigate('subject')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T1, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: T1 }}>Performance</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>

        {/* ── HERO SECTION (animated) ── */}
        <div style={{
          padding: '22px 20px 28px',
          transform: mounted ? 'translateY(0)' : 'translateY(32px)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34,1.2,0.64,1), opacity 0.45s ease-out',
        }}>

          {/* Chapter context */}
          <div style={{ fontSize: 11, fontWeight: 600, color: T3, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 14 }}>
            Anatomical Terms · Applied Anatomy
          </div>

          {/* Reattempt notice */}
          {isReattempt && (
            <div style={{ background: '#FFF8E7', border: '1px solid #FFE082', borderRadius: 10, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#5D4037', textAlign: 'center' }}>
              <span style={{ fontWeight: 700 }}>Reattempt</span> · Only your first attempt score is saved for analysis.
            </div>
          )}

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T1, marginBottom: 4 }}>{msg.headline}</div>
            <div style={{ fontSize: 14, color: T2 }}>{msg.sub}</div>
          </div>

          {/* Semi-circle gauge */}
          <div style={{ width: '100%', maxWidth: 300, margin: '0 auto 6px', position: 'relative' }}>
            <SemiGauge pct={animPct} />
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 50, fontWeight: 900, color: gaugeColor, lineHeight: 1, letterSpacing: '-0.02em' }}>{accuracy}%</div>
              <div style={{ fontSize: 12, color: T3, marginTop: 2, fontWeight: 500 }}>accuracy</div>
            </div>
          </div>

          {/* Fan stat cards */}
          <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'flex-end', marginTop: 18 }}>
            <div style={{ flex: 1, background: GREEN_BG, border: `1.5px solid ${GREEN_BD}`, borderRadius: 18, padding: '16px 10px 14px', textAlign: 'center', transform: 'rotate(-3deg) translateY(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: `2px solid ${GREEN_BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, lineHeight: 1 }}>{correct}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, opacity: 0.75, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Correct</div>
            </div>
            <div style={{ flex: 1.15, background: PL, border: `1.5px solid ${P}`, borderRadius: 18, padding: '18px 10px 16px', textAlign: 'center', transform: 'translateY(-10px)', boxShadow: `0 6px 20px rgba(83,74,183,0.16)` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: `2px solid ${P}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: PD, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: P, opacity: 0.8, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Questions</div>
            </div>
            <div style={{ flex: 1, background: RED_BG, border: `1.5px solid ${RED_BD}`, borderRadius: 18, padding: '16px 10px 14px', textAlign: 'center', transform: 'rotate(3deg) translateY(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: `2px solid ${RED_BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: RED, lineHeight: 1 }}>{incorrect}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: RED, opacity: 0.75, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Incorrect</div>
            </div>
          </div>

          {/* Skipped row */}
          {skipped > 0 && (
            <div style={{ marginTop: 14, background: '#FFF8E7', border: '1px solid #FFD54F', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#B45309' }}>{skipped} question{skipped > 1 ? 's' : ''} skipped (ran out of time)</span>
            </div>
          )}

          {/* Scroll hint */}
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
            <div style={{ fontSize: 11, color: T3, marginTop: 3 }}>Scroll for full analysis</div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ background: BG2, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: '10px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Analysis</div>
        </div>

        {/* ── PERFORMANCE CONTENT ── */}
        <div style={{ padding: '0 16px' }}>

          {/* Score summary card */}
          <div style={{ background: 'white', border: `1px solid ${BD}`, borderLeft: `4px solid ${accuracy >= 70 ? GREEN : accuracy >= 50 ? P : RED}`, borderRadius: 14, padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T1, lineHeight: 1.5, marginBottom: 8 }}>
              {accuracy >= 80 ? "Excellent work — you're well-prepared on this chapter!"
                : accuracy >= 60 ? "Good effort! A few more practice sessions and you'll nail it."
                : accuracy >= 40 ? "You're building up. Focus on the weak topics below and retry."
                : "Don't worry — use the explanations to build your foundation step by step."}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: T2 }}>
              <span><span style={{ fontWeight: 700, color: GREEN }}>{correct}</span> correct</span>
              <span><span style={{ fontWeight: 700, color: RED }}>{incorrect}</span> wrong</span>
              <span><span style={{ fontWeight: 700, color: '#B45309' }}>{skipped}</span> skipped</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BD}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                <span style={{ fontSize: 11, color: T3 }}>{avgTime}s avg / question</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ fontSize: 11, color: T3 }}>Total: {totalTime}</span>
              </div>
            </div>
          </div>

          {/* PYQ missed */}
          {missedPYQs.length > 0 && (
            <div style={{ background: 'white', border: `1px solid ${BD}`, borderLeft: '3px solid #E6A817', borderRadius: 14, padding: '13px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>
                {missedPYQs.length} Previous Year Question{missedPYQs.length > 1 ? 's' : ''} Missed
              </div>
              <div style={{ fontSize: 12, color: T3, lineHeight: 1.5, marginBottom: 10 }}>These appeared in real exams — prioritise reviewing them.</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {missedPYQs.map(q => (
                  <button key={q.id} onClick={viewSolution} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: T2, cursor: 'pointer' }}>
                    Q{QUESTIONS.indexOf(q) + 1} · {q.pyqExam} {q.pyqYear}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Study focus */}
          {weakTopics.length > 0 && (
            <div style={{ border: `1px solid ${BD}`, borderRadius: 14, padding: '13px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 3 }}>Study Focus</div>
              <div style={{ fontSize: 12, color: T3, marginBottom: 10 }}>Topics where you need more practice</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weakTopics.map(t => (
                  <div key={t.id} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: T3, marginTop: 2 }}>
                          {t.wrong > 0 && `${t.wrong} wrong`}{t.wrong > 0 && t.skipped > 0 && ' · '}{t.skipped > 0 && `${t.skipped} skipped`}{t.pyqCount > 0 && ` · ${t.pyqCount} PYQ`}
                        </div>
                      </div>
                      <button onClick={viewSolution} style={{ background: 'white', border: `1.5px solid ${P}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: P, cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}>Review</button>
                    </div>
                    <div style={{ height: 3, background: BD, borderRadius: 2 }}>
                      <div style={{ height: 3, width: `${t.attempted > 0 ? t.acc : 0}%`, background: P, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: T3, marginTop: 4 }}>{t.attempted > 0 ? `${t.acc}% accuracy · ${t.correct}/${t.total} correct` : 'Not attempted'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review questions */}
          {wrongQs.length > 0 && (
            <div style={{ border: `1px solid ${BD}`, borderRadius: 14, padding: '13px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Review These Questions</div>
                <div style={{ fontSize: 11, color: T3 }}>{wrongQs.length} to review</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleWrongQs.map(q => {
                  const a = answers[q.id]
                  const isSkip = !a || a === 'timeout'
                  const qIdx = QUESTIONS.indexOf(q)
                  return (
                    <div key={q.id} style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
                      <button onClick={viewSolution} style={{ padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'block', width: '100%', background: 'transparent', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', border: `1.5px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: T2 }}>{qIdx + 1}</span>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: T2 }}>{isSkip ? 'Skipped' : 'Wrong answer'}</span>
                            {q.isPYQ && <span style={{ fontSize: 9, background: 'white', border: `1px solid ${BD}`, color: T3, borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>PYQ</span>}
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                        <div style={{ fontSize: 12, color: T1, lineHeight: 1.45, marginBottom: isSkip ? 0 : 6 }}>
                          {q.text.slice(0, 85)}{q.text.length > 85 ? '…' : ''}
                        </div>
                        {!isSkip && (
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 11, color: RED, fontWeight: 500 }}>✗ You: {a?.toUpperCase()}</span>
                            <span style={{ fontSize: 11, color: GREEN, fontWeight: 500 }}>✓ Correct: {q.correct?.toUpperCase()}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
              {wrongQs.length > 3 && (
                <button onClick={() => setShowAllWrong(v => !v)} style={{ width: '100%', background: 'none', border: 'none', color: P, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8, padding: '6px 0' }}>
                  {showAllWrong ? 'Show less ↑' : `Show ${wrongQs.length - 3} more ↓`}
                </button>
              )}
            </div>
          )}

          {/* Feedback */}
          <div style={{ border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            {feedbackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 3 }}>Thanks for your feedback!</div>
                <div style={{ fontSize: 12, color: T3 }}>It helps us improve the question set.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 3 }}>How was your experience?</div>
                <div style={{ fontSize: 12, color: T3, marginBottom: 14 }}>How did this question set feel overall — quality, clarity, usefulness?</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${rating >= n ? P : BD}`, background: rating >= n ? PL : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={rating >= n ? P : 'none'} stroke={rating >= n ? P : BD} strokeWidth="1.8"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && <div style={{ fontSize: 12, color: P, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{RATING_LABELS[rating]}</div>}
                <textarea value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} placeholder="Anything to add? (optional)" style={{ width: '100%', minHeight: 60, padding: '9px 12px', border: `1px solid ${BD}`, borderRadius: 10, fontSize: 12, color: T1, resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <button onClick={() => { if (rating > 0) setFeedbackSubmitted(true) }} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1.5px solid ${rating > 0 ? P : BD}`, background: rating > 0 ? PL : 'white', cursor: rating > 0 ? 'pointer' : 'default', fontSize: 13, fontWeight: 700, color: rating > 0 ? PD : T3, transition: 'all 0.15s' }}>
                  Submit Feedback
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Fixed CTAs */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderTop: `1px solid ${BD}`, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => setShowReattemptConfirm(true)} className="btn-outline" style={{ flex: 1 }}>Re-Attempt</button>
        <button onClick={viewSolution} className="btn-primary" style={{ flex: 2 }}>View Solutions →</button>
      </div>

      {/* Re-attempt confirm */}
      {showReattemptConfirm && (
        <div className="popup-overlay">
          <div className="popup">
            <div style={{ fontSize: 17, fontWeight: 700, color: T1, marginBottom: 8 }}>Re-attempt this test?</div>
            <div style={{ fontSize: 13, color: T2, marginBottom: 20, lineHeight: 1.5, background: '#FFF3E0', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 12px' }}>
              ⚠️ Only your <strong>first attempt</strong> scores are marked for review and analysis.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReattemptConfirm(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleReattempt} className="btn-primary" style={{ flex: 1 }}>Re-Attempt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
