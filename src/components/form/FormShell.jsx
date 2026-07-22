import { useState, useRef, useEffect } from 'react'
import { MAIN_OPTIONS, OTHERS_PLACEHOLDER, SUB_OPTIONS } from '../../data/formConfig'
import { useQueries } from '../../context/QueryContext'
import { useNotifications } from '../../context/NotificationContext'

const progressMap = { 1: 20, '2A': 42, '2B': 42, '2C': 42, '2D': 42, '2E': 42, 3: 35, 4: 62, 5: 80, 6: 100 }

const MAX_PHOTO_BYTES = 1 * 1024 * 1024  // 1 MB
const MAX_REC_SECS   = 30                 // 30 seconds

export default function FormShell({ embedded = false, onClose, onDone, questionContext = {} }) {
  const { addQuery, queries } = useQueries()
  const { queueNotification } = useNotifications()
  // One-open-query-per-question lock: a student can't raise a new query against a
  // question that already has a query in flight (raised/received/assigned) for it,
  // regardless of category. The lock releases once that query reaches 'resolved'.
  const openBlockingQuery = questionContext.questionId
    ? queries.find(q => q.question_ref === questionContext.questionId && q.timeline_status !== 'resolved')
    : null
  // The audio category only exists where an audio solution exists — a question
  // without one has nothing to report under it. All other categories always show.
  const availableMainOptions = MAIN_OPTIONS.filter(
    option => option.id !== 'audio-issue' || questionContext.hasAudio
  )
  const [screen, setScreen] = useState('1')
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedSubOption, setSelectedSubOption] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [voiceRecorded, setVoiceRecorded] = useState(false)
  const [othersText, setOthersText] = useState('')
  const [submittedId, setSubmittedId] = useState(null)

  const reset = () => {
    setScreen('1')
    setSelectedOption(null)
    setSelectedSubOption(null)
    setCommentText('')
    setReferenceText('')
    setAttachment(null)
    setOthersText('')
    setSubmittedId(null)
  }

  const finish = () => {
    reset()
    if (onDone) onDone()
  }

  const chooseMain = (option) => {
    setSelectedOption(option)
    setSelectedSubOption(null)
    window.setTimeout(() => setScreen(option.screenKey), 150)
  }

  const goBack = () => {
    if (screen === '4') setScreen('3')
    else if (screen === '5') setScreen(selectedOption?.screenKey || '1')
    else if (['2A', '2B', '2C', '2D', '2E'].includes(screen)) setScreen('1')
    else if (screen === '3') setScreen('1')
  }

  const submitStructured = ({ comment = commentText, reference = referenceText, media = attachment, voice = voiceRecorded } = {}) => {
    const config = SUB_OPTIONS[selectedOption.screenKey]
    const id = addQuery({
      category: config.category,
      subOption: selectedSubOption.label,
      commentText: [
        comment && `Reason: ${comment}`,
        reference && `Reference: ${reference}`,
        media && `Attachment: ${media.type} - ${media.name}`,
        voice && 'Attachment: Voice note'
      ].filter(Boolean).join('\n'),
      subjectName: questionContext.subjectName,
      testName: questionContext.testName,
      questionText: questionContext.questionText,
      questionNum: questionContext.questionNum,
      questionRef: questionContext.questionId,
    })
    setSubmittedId(id)
    setScreen('6')
    // #1 — immediate submit confirmation
    queueNotification('Aye aye captain! 📬', 'Tumhara doubt mil gaya. Abhi team ko bhej rahe hain.')
    // #2 — 10s later: query received by team
    setTimeout(() => {
      queueNotification('Arre, uthaa liya humne 👀', 'Team lag gayi hai tumhare sawal pe. Jaldi milega jawaab.')
    }, 10000)
  }

  const submitOthers = () => {
    const id = addQuery({
      category: 'Others', subOption: 'Others', commentText: othersText,
      subjectName: questionContext.subjectName,
      testName: questionContext.testName,
      questionText: questionContext.questionText,
      questionNum: questionContext.questionNum,
      questionRef: questionContext.questionId,
    })
    setSubmittedId(id)
    setScreen('6')
    // #1 — immediate submit confirmation
    queueNotification('Aye aye captain! 📬', 'Tumhara doubt mil gaya. Abhi team ko bhej rahe hain.')
    // #2 — 10s later: query received by team
    setTimeout(() => {
      queueNotification('Arre, uthaa liya humne 👀', 'Team lag gayi hai tumhare sawal pe. Jaldi milega jawaab.')
    }, 10000)
  }

  // One-open-query-per-question lock: skip the whole wizard and show the existing
  // ticket's status instead. Excludes screen '6' so a just-completed submission
  // (which itself now satisfies the "blocking query" condition) still shows the
  // success screen rather than immediately locking the student out.
  if (openBlockingQuery && screen !== '6') {
    return (
      <main className={embedded ? 'raq-form-page embedded' : 'raq-form-page'}>
        <section className={embedded ? 'form-shell embedded' : 'form-shell'}>
          <div className="form-head">
            <span className="form-head-spacer" />
            <div className="form-head-title">Raise a Query</div>
            {embedded ? (
              <button className="form-head-btn" type="button" onClick={onClose} aria-label="Close">×</button>
            ) : <span className="form-head-spacer" />}
          </div>
          <div className="form-body">
            <QuestionLockedScreen
              query={openBlockingQuery}
              onDone={() => { onClose?.(); onDone?.() }}
            />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={embedded ? 'raq-form-page embedded' : 'raq-form-page'}>
      <section className={embedded ? 'form-shell embedded' : 'form-shell'}>
        <div className="form-head">
          {!['1', '6'].includes(screen) ? (
            <button className="form-head-btn" type="button" onClick={goBack} aria-label="Back">‹</button>
          ) : <span className="form-head-spacer" />}
          <div className="form-head-title">Raise a Query</div>
          {embedded && screen !== '6' ? (
            <button className="form-head-btn" type="button" onClick={onClose} aria-label="Close">×</button>
          ) : <span className="form-head-spacer" />}
          <div className="form-progress" aria-hidden="true">
            <span style={{ width: `${progressMap[screen]}%` }} />
          </div>
        </div>
        <div className="form-body">

        {screen === '1' && <Screen1 mainOptions={availableMainOptions} selectedOption={selectedOption} onChoose={chooseMain} onOthers={() => setScreen('3')} />}
        {['2A', '2B', '2C', '2D', '2E'].includes(screen) && (
          <SubOptionScreen
            screenKey={screen}
            selectedSubOption={selectedSubOption}
            onSelect={setSelectedSubOption}
            onContinue={() => {
              setCommentText('')
              setReferenceText('')
              setAttachment(null)
              setVoiceRecorded(false)
              setScreen('5')
            }}
          />
        )}
        {screen === '3' && <OthersInterstitial mainOptions={availableMainOptions} onChoose={chooseMain} onNone={() => setScreen('4')} />}
        {screen === '4' && (
          <OthersText
            value={othersText}
            onChange={setOthersText}
            onSubmit={submitOthers}
          />
        )}
        {screen === '5' && (() => {
          // Sub-options that get full evidence panel (voice + reference + photo)
          const FULL_EVIDENCE = ['answer-wrong', 'book-different', 'multi-correct']
          const isWrongAnswer = selectedOption?.id === 'wrong-answer'
          const needsFullEvidence = isWrongAnswer && FULL_EVIDENCE.includes(selectedSubOption?.id)
          // No voice for: wrong-answer simple subs, cant-see, and two specific not-right-q subs
          const NO_VOICE_NOT_RIGHT = ['already-seen', 'wrong-language']
          const isTextOnly = (isWrongAnswer && !needsFullEvidence)
            || selectedOption?.id === 'cant-see'
            || (selectedOption?.id === 'not-right-q' && NO_VOICE_NOT_RIGHT.includes(selectedSubOption?.id))

          if (needsFullEvidence) return (
            <WrongAnswerEvidenceScreen
              value={commentText}
              referenceValue={referenceText}
              attachment={attachment}
              voiceRecorded={voiceRecorded}
              prompt={selectedSubOption?.prompt}
              onChange={setCommentText}
              onReferenceChange={setReferenceText}
              onAttachmentChange={setAttachment}
              onVoiceChange={setVoiceRecorded}
              onSubmit={() => submitStructured()}
              onSkip={() => submitStructured({ comment: '', reference: '', media: null, voice: false })}
            />
          )
          return (
            <CommentScreen
              value={commentText}
              prompt={selectedSubOption?.prompt}
              onChange={setCommentText}
              voiceRecorded={voiceRecorded}
              onVoiceChange={setVoiceRecorded}
              onSubmit={() => submitStructured({ comment: commentText, reference: '', media: null })}
              onSkip={() => submitStructured({ comment: '', reference: '', media: null, voice: false })}
              showVoice={!isTextOnly}
            />
          )
        })()}
        {screen === '6' && <SuccessScreen onDone={finish} queryId={submittedId} />}
        </div>
      </section>
    </main>
  )
}

function Screen1({ mainOptions, selectedOption, onChoose, onOthers }) {
  return (
    <>
      <h1 className="form-title">What's the issue?</h1>
      <p className="form-subtitle">Select the option that best describes your problem</p>
      <div className="main-options">
        {mainOptions.map(option => (
          <button
            key={option.id}
            type="button"
            className={`main-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
            onClick={() => onChoose(option)}
          >
            <span className="main-copy">
              <span className="main-title">{option.title}</span>
              <span className="main-subtitle">{option.subtitle}</span>
            </span>
            <span className="chevron">&gt;</span>
          </button>
        ))}
      </div>
      <p className="others-link">
        Still can't find it? <button className="link-btn" type="button" onClick={onOthers}>Tell us in your own words</button>
      </p>
    </>
  )
}

function SubOptionScreen({ screenKey, selectedSubOption, onSelect, onContinue }) {
  const config = SUB_OPTIONS[screenKey]
  return (
    <>
      <h1 className="form-title small">{config.header}</h1>
      <p className="form-subtitle">Select the closest match</p>
      <div className="sub-options">
        {config.options.map(option => (
          <button
            key={option.id}
            type="button"
            className={`sub-option-row ${selectedSubOption?.id === option.id ? 'selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            <span className="radio-dot" />
            <span className="sub-label">{option.label}</span>
          </button>
        ))}
      </div>
      <button className="primary-btn" type="button" disabled={!selectedSubOption} onClick={onContinue}>Continue</button>
    </>
  )
}

function OthersInterstitial({ mainOptions, onChoose, onNone }) {
  return (
    <div className="others-gate">
      <div className="warning-icon">!</div>
      <h1 className="form-title small">Before you continue -</h1>
      <p className="form-subtitle">Does your issue fit any of these?</p>
      <div className="chip-grid">
        {mainOptions.map(option => (
          <button className="chip" key={option.id} type="button" onClick={() => onChoose(option)}>
            {option.title}
          </button>
        ))}
      </div>
      <button className="link-btn" type="button" onClick={onNone}>No, none of these</button>
    </div>
  )
}

function OthersText({ value, onChange, onSubmit }) {
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [showGateError, setShowGateError] = useState(false)
  const hasText = value.trim().length >= 20
  const hasVoice = voiceDuration >= 10
  const canSubmit = hasText || hasVoice

  return (
    <>
      <h1 className="form-title small">Tell us in your own words</h1>
      <p className="form-subtitle">Describe what's wrong so we can fix it.</p>
      <textarea
        required
        value={value}
        placeholder={OTHERS_PLACEHOLDER}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={`char-counter ${hasText ? 'complete' : ''}`}>
        {hasText
          ? `${value.trim().length} chars ✓`
          : `${value.trim().length} / 20 · or record 10s voice`}
      </div>
      <VoiceRecorder onDurationChange={setVoiceDuration} />
      {hasVoice && !hasText && (
        <div className="char-counter complete" style={{ marginTop: -6 }}>Voice note ready ✓</div>
      )}
      {showGateError && !canSubmit && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 13px', fontSize: 12.5, color: '#B91C1C', lineHeight: 1.55, marginTop: 2 }}>
          To submit, please add at least <strong>20 characters of text</strong> or a <strong>voice note of 10+ seconds</strong>.
        </div>
      )}
      <button
        className="primary-btn"
        type="button"
        style={!canSubmit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        onClick={() => { if (!canSubmit) { setShowGateError(true); return } onSubmit() }}
      >
        Submit query
      </button>
    </>
  )
}

function WrongAnswerEvidenceScreen({
  value,
  referenceValue,
  attachment,
  voiceRecorded,
  prompt,
  onChange,
  onReferenceChange,
  onAttachmentChange,
  onVoiceChange,
  onSubmit,
  onSkip
}) {
  const [showPhotoWarn, setShowPhotoWarn] = useState(false)
  const [photoError, setPhotoError]       = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (fileList) => {
    const file = fileList?.[0]
    if (!file) return
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max allowed is 1 MB — please compress and retry.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setPhotoError(null)
    onAttachmentChange({ type: 'Photo', name: file.name })
  }

  return (
    <>
      {showPhotoWarn && (
        <AbusePolicyModal
          onConfirm={() => { setShowPhotoWarn(false); fileInputRef.current?.click() }}
          onCancel={() => setShowPhotoWarn(false)}
        />
      )}
      <div className="comment-title">
        <h1 className="form-title small">Why do you feel this is wrong?</h1>
        <span className="optional">(optional)</span>
      </div>
      <p className="form-subtitle">Tell us why the shown option or marked answer seems incorrect.</p>
      <textarea
        value={value}
        placeholder={prompt || 'For example: Google says ___, but this answer says ___...'}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: 82 }}
      />
      <label className="reference-field">
        <span>Reference or source <em>(optional)</em></span>
        <input
          value={referenceValue}
          placeholder="Book, class note, Google result, website, or teacher reference"
          onChange={(event) => onReferenceChange(event.target.value)}
        />
      </label>
      <div className="evidence-block">
        <div className="evidence-label">Add evidence <span>(optional)</span></div>
        <div className="evidence-actions">
          <button type="button" className="evidence-btn" onClick={() => setShowPhotoWarn(true)}>Photo</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(event) => handleFile(event.target.files)}
          />
        </div>
        {photoError && (
          <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 5, lineHeight: 1.4 }}>{photoError}</div>
        )}
        {attachment && !photoError && (
          <div className="attachment-pill">
            {attachment.type}: {attachment.name}
            <button type="button" onClick={() => { onAttachmentChange(null); setPhotoError(null) }}>Remove</button>
          </div>
        )}
      </div>
      <VoiceRecorder onDurationChange={(seconds) => onVoiceChange(seconds > 0)} />
      <button className="primary-btn" type="button" disabled={!value.trim() && !referenceValue.trim() && !attachment && !voiceRecorded} onClick={onSubmit}>Submit query</button>
      <button className="secondary-btn" type="button" onClick={onSkip}>Skip and submit</button>
    </>
  )
}

function CommentScreen({ value, prompt, onChange, onSubmit, onSkip, showVoice = true, voiceRecorded, onVoiceChange }) {
  return (
    <>
      <div className="comment-title">
        <h1 className="form-title small">Want to add more detail?</h1>
        <span className="optional">(optional)</span>
      </div>
      <textarea
        value={value}
        placeholder={prompt}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: 100 }}
      />
      {showVoice && <VoiceRecorder onDurationChange={(seconds) => onVoiceChange(seconds > 0)} />}
      <button className="primary-btn" type="button" disabled={!value.trim() && !(showVoice && voiceRecorded)} onClick={onSubmit}>Submit query</button>
      <button className="secondary-btn" type="button" onClick={onSkip}>Skip and submit</button>
    </>
  )
}

function AbusePolicyModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 22px 20px', maxWidth: 310, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.22)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 14px' }}>⚠️</div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', textAlign: 'center', margin: '0 0 10px' }}>Content Policy</h2>
        <p style={{ fontSize: 12.5, color: '#5a5a78', lineHeight: 1.65, margin: '0 0 6px', textAlign: 'center' }}>
          This attachment is <strong>only for reporting your doubt</strong>. Any irrelevant, offensive, or abusive content will result in your account being <strong style={{ color: '#DC2626' }}>permanently blocked</strong>.
        </p>
        <p style={{ fontSize: 11.5, color: '#9898b0', textAlign: 'center', margin: '0 0 20px' }}>
          By continuing you agree to our fair-use policy.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          style={{ width: '100%', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
        >
          I understand, continue
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ width: '100%', background: 'none', border: 'none', color: '#9898b0', fontSize: 13, cursor: 'pointer', padding: '6px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function VoiceRecorder({ onDurationChange }) {
  const [showVoiceWarn, setShowVoiceWarn] = useState(false)
  const [recState, setRecState] = useState('idle')
  const [audioURL, setAudioURL] = useState(null)
  const [duration, setDuration] = useState(0)
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const finalDurationRef = useRef(0)

  useEffect(() => () => {
    clearInterval(timerRef.current)
    if (audioURL) URL.revokeObjectURL(audioURL)
  }, [audioURL])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        setRecState('recorded')
        onDurationChange?.(finalDurationRef.current)
      }
      mr.start()
      mrRef.current = mr
      setRecState('recording')
      setDuration(0)
      finalDurationRef.current = 0
      timerRef.current = setInterval(() => {
        setDuration(d => {
          const next = d + 1
          finalDurationRef.current = next
          if (next >= MAX_REC_SECS) {
            if (mrRef.current?.state === 'recording') mrRef.current.stop()
            clearInterval(timerRef.current)
          }
          return next
        })
      }, 1000)
    } catch {
      // mic access denied — silently ignore
    }
  }

  const stop = () => {
    if (mrRef.current?.state === 'recording') mrRef.current.stop()
    clearInterval(timerRef.current)
  }

  const remove = () => {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioURL(null)
    setDuration(0)
    finalDurationRef.current = 0
    setRecState('idle')
    onDurationChange?.(0)
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const remaining = MAX_REC_SECS - duration
  const isUrgent  = duration >= MAX_REC_SECS - 10

  if (recState === 'idle') return (
    <>
      {showVoiceWarn && (
        <AbusePolicyModal
          onConfirm={() => { setShowVoiceWarn(false); start() }}
          onCancel={() => setShowVoiceWarn(false)}
        />
      )}
      <button type="button" className="voice-idle-btn" onClick={() => setShowVoiceWarn(true)}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        Add voice note
      </button>
    </>
  )

  if (recState === 'recording') return (
    <div className="voice-recording-bar">
      <span className="voice-dot" style={isUrgent ? { background: '#DC2626' } : {}} />
      <span className="voice-timer" style={isUrgent ? { color: '#DC2626' } : {}}>{fmt(duration)}</span>
      <span style={{ fontSize: 10, color: isUrgent ? '#DC2626' : '#9898b0', marginRight: 'auto' }}>
        {isUrgent ? `${remaining}s left` : `/ ${fmt(MAX_REC_SECS)} max`}
      </span>
      <button type="button" className="voice-stop-btn" onClick={stop}>Stop</button>
    </div>
  )

  return (
    <div className="voice-recorded-bar">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
        <path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <audio src={audioURL} controls className="voice-audio" />
      <button type="button" className="voice-delete-btn" onClick={remove} aria-label="Remove voice note">✕</button>
    </div>
  )
}

const LOCKED_STATUS_LABELS = {
  raised: 'Sent to our team',
  received: 'Team is on it',
  assigned: 'An expert is on it',
}

function QuestionLockedScreen({ query, onDone }) {
  const { addNote } = useQueries()
  const [note, setNote] = useState('')
  const ticketDisplay = query.ticket_id ? `#${query.ticket_id}` : null
  const statusLabel = LOCKED_STATUS_LABELS[query.timeline_status] || 'In progress'
  // Capped to one add-on note per open query — read from the query itself (not
  // local state) so the limit holds even if the student closes and reopens
  // this screen.
  const studentNote = (query.notes || []).find(n => n.author === 'student')

  const handleSend = () => {
    if (!note.trim()) return
    addNote(query.ticket_id, note.trim(), 'student')
  }

  return (
    <div className="success-screen">
      <div className="success-icon" style={{ background: '#E5F0F8', borderColor: '#15CAE8', color: '#131B63' }}>🔒</div>
      <h1 className="form-title" style={{ marginTop: 16, color: '#131B63' }}>You already have an open query here</h1>
      <p className="success-body">
        We're still working on your last question about this — raising a new one for it will have to wait until that's resolved.
      </p>

      <div style={{ width: '100%', margin: '16px 0 0', background: '#E5F0F8', border: '1.5px dashed #15CAE8', borderRadius: 12, padding: '13px 16px', textAlign: 'left' }}>
        {ticketDisplay && (
          <div style={{ fontSize: 18, fontWeight: 900, color: '#131B63', letterSpacing: '1px', fontFamily: 'monospace', marginBottom: 4 }}>{ticketDisplay}</div>
        )}
        <div style={{ fontSize: 12, color: '#131B63', fontWeight: 700 }}>{statusLabel}</div>
        {query.category && (
          <div style={{ fontSize: 11, color: '#5B6088', marginTop: 2 }}>{query.category}{query.sub_option ? ` — ${query.sub_option}` : ''}</div>
        )}
      </div>

      {!studentNote ? (
        <div style={{ width: '100%', marginTop: 12 }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Anything changed, or want to add more context? (optional)"
            rows={2}
            style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: '1.5px solid #E1E6F2', fontSize: 12, color: '#131B63', resize: 'none', fontFamily: 'inherit', outline: 'none', background: '#EDF5FA', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: 4, fontSize: 10.5, color: '#8790B8' }}>You can add this once — make it count.</div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!note.trim()}
            style={{ marginTop: 6, background: 'none', border: 'none', color: note.trim() ? '#131B63' : '#8790B8', fontWeight: 700, fontSize: 12, cursor: note.trim() ? 'pointer' : 'default', padding: 0 }}
          >
            Send →
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: 12, textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: '#16794C', fontWeight: 600 }}>✓ Added — the team will see this too.</div>
          <div style={{ marginTop: 8, background: '#EDF5FA', border: '1px solid #E1E6F2', borderRadius: 10, padding: '9px 11px', fontSize: 12, color: '#131B63', fontStyle: 'italic' }}>
            "{studentNote.text}"
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: '#8790B8' }}>You've already added extra context here — that's the one add-on this query gets.</div>
        </div>
      )}

      <button className="primary-btn" type="button" style={{ background: '#131B63', marginTop: 20 }} onClick={onDone}>
        Got it
      </button>
    </div>
  )
}

function SuccessScreen({ onDone, queryId }) {
  const ticketDisplay = queryId
    ? '#NP-' + String(queryId).slice(-5).padStart(5, '0')
    : null

  return (
    <div className="success-screen">
      <div className="success-icon" style={{ background: '#E5F0F8', borderColor: '#15CAE8', color: '#131B63' }}>✓</div>
      <h1 className="form-title" style={{ marginTop: 16, color: '#131B63' }}>We've got this</h1>
      <p className="success-body">Our team will take a proper look and respond</p>

      {ticketDisplay && (
        <div style={{ width: '100%', margin: '18px 0 0', background: '#E5F0F8', border: '1.5px dashed #15CAE8', borderRadius: 12, padding: '14px 16px', textAlign: 'left' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#131B63', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>YOUR QUERY ID</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#131B63', letterSpacing: '1px', fontFamily: 'monospace' }}>{ticketDisplay}</div>
          <div style={{ fontSize: 11, color: '#5B6088', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(19,27,99,0.12)' }}>
            Track it anytime from the menu (☰) under My Doubts — we'll notify you the moment it's ready.
          </div>
        </div>
      )}

      <button className="primary-btn" type="button" style={{ background: '#131B63', marginTop: 22 }} onClick={onDone}>
        Continue practice
      </button>
    </div>
  )
}
