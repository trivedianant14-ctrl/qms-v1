import { useState } from 'react'

const P = '#534AB7', PL = '#EEEDFE', PB = '#AFA9EC', PD = '#3C3489'
const G = '#3B6D11', GL = '#EAF3DE', GB = '#97C459'
const A = '#633806', AL = '#FAEEDA', AB = '#FAC775'
const R = '#791F1F', RL = '#FCEBEB', RB = '#F09595'
const T1 = '#1a1a2e', T2 = '#5a5a78', T3 = '#9898b0'
const BD = '#e8e8f2', BG2 = '#f5f5fb'

const FALLBACK_TEST = {
  name: 'NORCET 8 Grand Test – Session 1',
  questions: 200,
  duration: 120,
  durationLabel: '120 min',
  totalMarks: 200,
  correctMarks: 1,
  wrongMarks: -0.25,
}

const QUESTION_STATUSES = [
  { bg: BG2, border: BD,  label: 'Not Visited',          desc: 'You have not opened this question yet.' },
  { bg: RL,  border: RB,  label: 'Not Answered',          desc: 'Opened but no option selected.' },
  { bg: GL,  border: GB,  label: 'Answered',              desc: 'An option has been selected and saved.' },
  { bg: PL,  border: PB,  label: 'Marked for Review',     desc: 'Flagged for later — no answer saved.' },
  { bg: PL,  border: GB,  label: 'Answered & Marked',     desc: 'Answer saved and also flagged to revisit.' },
]

// ── helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:13, fontWeight:700, color:T1, borderTop:`1.5px solid ${BD}`, marginTop:18, paddingTop:14, marginBottom:10 }}>
      {children}
    </div>
  )
}

function Item({ num, children }) {
  return (
    <div style={{ display:'flex', gap:9, marginBottom:10 }}>
      <span style={{ fontSize:13, color:P, fontWeight:700, flexShrink:0, minWidth:20, paddingTop:1 }}>{num}.</span>
      <div style={{ fontSize:13, color:T1, lineHeight:1.7, flex:1 }}>{children}</div>
    </div>
  )
}

function SubList({ items }) {
  const alpha = ['a', 'b', 'c', 'd', 'e']
  return (
    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6, paddingLeft:4 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display:'flex', gap:8 }}>
          <span style={{ fontSize:12, color:T3, fontWeight:600, flexShrink:0, minWidth:14 }}>{alpha[i]}.</span>
          <span style={{ fontSize:12, color:T2, lineHeight:1.65 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function B({ children }) {
  return <span style={{ fontWeight:700, color:T1 }}>{children}</span>
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function LiveTestPreTest({ navigate, test }) {
  const [agreed, setAgreed] = useState(false)
  const t = test || FALLBACK_TEST
  const cm = t.correctMarks ?? 1
  const wm = t.wrongMarks ?? -0.25

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>

      {/* Status bar */}
      <div style={{ padding:'12px 20px 4px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:600, color:T1 }}>9:41</span>
        <div style={{ display:'flex', gap:6, alignItems:'center', color:T1 }}>
          <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
        </div>
      </div>

      {/* Nav header — no logo, just back + test name */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 16px 10px', borderBottom:`1px solid ${BD}`, flexShrink:0 }}>
        <button onClick={() => navigate('livetest')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', color:T1, padding:0, flexShrink:0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
          <div style={{ fontSize:10, color:T3, marginTop:1 }}>General Instructions</div>
        </div>
      </div>

      {/* Candidate profile + test stats strip */}
      <div style={{ flexShrink:0, padding:'12px 16px', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', gap:12, background:BG2 }}>
        {/* Avatar */}
        <div style={{ width:52, height:52, borderRadius:'50%', background:`linear-gradient(135deg, ${P}, #8B82E0)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:20, flexShrink:0 }}>
          A
        </div>
        {/* Name */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:T1 }}>Anant Trivedi</div>
          <div style={{ fontSize:10, color:T3, marginTop:1 }}>Candidate</div>
        </div>
        {/* Stats */}
        <div style={{ display:'flex', gap:1, background:BD, borderRadius:10, overflow:'hidden', flexShrink:0 }}>
          {[
            { value: t.questions,   label: 'Qs' },
            { value: t.durationLabel || `${t.duration} min`, label: 'Time' },
            { value: t.totalMarks,  label: 'Marks' },
          ].map((s, i) => (
            <div key={i} style={{ background:'white', padding:'7px 11px', textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:P }}>{s.value}</div>
              <div style={{ fontSize:9, color:T3, marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable instruction document ── */}
      <div className="scroll" style={{ flex:1, padding:'16px 16px 0' }}>

        {/* ── Section 1: General Instructions ── */}
        <div style={{ fontSize:14, fontWeight:700, color:T1, marginBottom:12 }}>General Instructions</div>

        <Item num={1}>
          The clock is set on the server. The countdown timer shown at the top of the test screen displays
          the remaining time to complete the examination. When it reaches zero, the test will
          auto-submit — you do not need to submit manually or take any action.
        </Item>

        <Item num={2}>
          <span>
            The <B>Question Strip</B> at the top of the test screen shows the current status of every
            question using the following colour indicators:
          </span>
          <div style={{ marginTop:10, background:BG2, border:`1px solid ${BD}`, borderRadius:10, padding:'8px 4px' }}>
            {QUESTION_STATUSES.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderBottom: i < QUESTION_STATUSES.length - 1 ? `1px solid ${BD}` : 'none' }}>
                <div style={{ width:26, height:26, borderRadius:5, background:s.bg, border:`2px solid ${s.border}`, flexShrink:0 }} />
                <div>
                  <span style={{ fontSize:12, fontWeight:600, color:T1 }}>{s.label}</span>
                  <span style={{ fontSize:11, color:T3 }}> — {s.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:12, color:T2, lineHeight:1.7, background:AL, border:`1px solid ${AB}`, borderRadius:8, padding:'9px 12px' }}>
            The <B>Mark for Review</B> status simply means you intend to revisit that question later.
            If a question is answered and then marked for review, the answer will still be evaluated
            unless you change it before final submission.
          </div>
        </Item>

        {/* ── Section 2: Navigation ── */}
        <SectionTitle>Navigating to a Question</SectionTitle>

        <Item num={3}>
          <span>To navigate between questions:</span>
          <SubList items={[
            <>Tap any question number in the <B>Question Strip</B> to jump to it directly.</>,
            <>Tap <B>Save &amp; Next</B> to save your current answer and proceed to the next question.</>,
            <>Tap <B>Mark &amp; Next</B> to save your answer, flag the question for review, and move forward.</>,
            <>Tap <B>Previous</B> to return to the preceding question without changing your answer.</>,
          ]} />
        </Item>

        <Item num={4}>
          You may navigate freely between <B>all questions at any time</B> — there is no restriction
          on movement. You may revisit, skip, or re-attempt any question before submitting.
        </Item>

        {/* ── Section 3: Answering ── */}
        <SectionTitle>Answering a Question</SectionTitle>

        <Item num={5}>
          <span>Procedure for a multiple-choice question (MCQ):</span>
          <SubList items={[
            <>Tap one option (A, B, C, or D) to select it.</>,
            <>To deselect, tap the selected option again or tap <B>Clear Response</B>.</>,
            <>To change your selection, simply tap a different option.</>,
            <>Tap <B>Save &amp; Next</B> to confirm your answer and move to the next question.</>,
          ]} />
        </Item>

        <Item num={6}>
          Only answers that are <B>saved</B>{' '}
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, verticalAlign:'middle' }}>
            <span style={{ display:'inline-block', width:14, height:14, borderRadius:3, background:GL, border:`1.5px solid ${GB}` }} />
          </span>
          {' '}or <B>saved and marked for review</B>{' '}
          <span style={{ display:'inline-flex', alignItems:'center', gap:3, verticalAlign:'middle' }}>
            <span style={{ display:'inline-block', width:14, height:14, borderRadius:3, background:PL, border:`1.5px solid ${GB}` }} />
          </span>
          {' '}will be evaluated. Unattempted questions carry zero marks and no negative marking.
        </Item>

        <Item num={7}>
          To modify an already-answered question, navigate back to it and tap a different option.
          Your previous answer is replaced immediately.
        </Item>

        {/* ── Section 4: Marking Scheme ── */}
        <SectionTitle>Marking Scheme</SectionTitle>

        <Item num={8}>
          <div style={{ display:'flex', gap:8, marginTop:2 }}>
            <div style={{ flex:1, background:GL, border:`1px solid ${GB}`, borderRadius:8, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:G }}>+{cm}</div>
              <div style={{ fontSize:10, color:G, fontWeight:600, marginTop:2 }}>Correct Answer</div>
            </div>
            <div style={{ flex:1, background:RL, border:`1px solid ${RB}`, borderRadius:8, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:R }}>{wm}</div>
              <div style={{ fontSize:10, color:R, fontWeight:600, marginTop:2 }}>Wrong Answer</div>
            </div>
            <div style={{ flex:1, background:BG2, border:`1px solid ${BD}`, borderRadius:8, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:T3 }}>0</div>
              <div style={{ fontSize:10, color:T3, fontWeight:600, marginTop:2 }}>Unattempted</div>
            </div>
          </div>
        </Item>

        {/* ── Section 5: Submitting ── */}
        <SectionTitle>Submitting the Test</SectionTitle>

        <Item num={9}>
          Tap the <B>Submit</B> button from any question to end the test. Your score and a
          detailed subject-wise analysis will be available immediately after submission.
          You cannot undo a submission.
        </Item>

        <Item num={10}>
          If you exit the test, your responses are <B>saved automatically</B>. You may return
          and continue anytime within the live test window. However, we strongly recommend
          completing the test in one uninterrupted sitting for the best experience.
        </Item>

        <Item num={11}>
          The test will <B>auto-submit</B> when the countdown timer reaches zero, with all
          saved answers counted. No manual action is required.
        </Item>

        <div style={{ height:24 }} />
      </div>

      {/* ── Footer: checkbox + button ── */}
      <div style={{ flexShrink:0, padding:'14px 16px', borderTop:`1px solid ${BD}`, background:'white' }}>
        <button
          onClick={() => setAgreed(a => !a)}
          style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12, background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%', padding:0 }}
        >
          <div style={{
            width:20, height:20, borderRadius:5, flexShrink:0, marginTop:1,
            background: agreed ? P : 'white',
            border: `2px solid ${agreed ? P : BD}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.15s, border-color 0.15s',
          }}>
            {agreed && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,6 5,9 10,3"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize:13, color: agreed ? T1 : T2, fontWeight: agreed ? 600 : 400, lineHeight:1.5 }}>
            I have read all the instructions carefully and agree to abide by them during the test.
          </span>
        </button>

        <button
          disabled={!agreed}
          onClick={() => agreed && navigate('livetestsolve')}
          style={{
            width:'100%', padding:'13px', borderRadius:12,
            background: agreed ? P : BG2,
            color: agreed ? 'white' : T3,
            fontSize:15, fontWeight:700, border:'none',
            cursor: agreed ? 'pointer' : 'default',
            transition:'background 0.15s, color 0.15s',
          }}
        >
          Start Test
        </button>
      </div>

    </div>
  )
}
