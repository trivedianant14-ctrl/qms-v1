import { useState } from 'react'
import { MAIN_OPTIONS, OTHERS_PLACEHOLDER, SUB_OPTIONS } from '../../data/formConfig'
import { useQueries } from '../../context/QueryContext'

const progressMap = { 1: 20, '2A': 40, '2B': 40, '2C': 40, '2D': 40, 5: 80, 6: 100 }

export default function FormShell() {
  const { addQuery } = useQueries()
  const [screen, setScreen] = useState('1')
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedSubOption, setSelectedSubOption] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [othersText, setOthersText] = useState('')

  const reset = () => {
    setScreen('1')
    setSelectedOption(null)
    setSelectedSubOption(null)
    setCommentText('')
    setOthersText('')
  }

  const chooseMain = (option) => {
    setSelectedOption(option)
    setSelectedSubOption(null)
    window.setTimeout(() => setScreen(option.screenKey), 150)
  }

  const goBack = () => {
    if (screen === '4') setScreen('3')
    else if (screen === '5') setScreen(selectedOption?.screenKey || '1')
    else if (['2A', '2B', '2C', '2D'].includes(screen)) setScreen('1')
  }

  const submitStructured = (text = commentText) => {
    const config = SUB_OPTIONS[selectedOption.screenKey]
    addQuery({
      category: config.category,
      subOption: selectedSubOption.label,
      commentText: text
    })
    setScreen('6')
  }

  const submitOthers = () => {
    addQuery({ category: 'Others', subOption: 'Others', commentText: othersText })
    setScreen('6')
  }

  return (
    <main className="raq-form-page">
      <section className="form-shell">
        {progressMap[screen] && (
          <div className="form-progress" aria-hidden="true">
            <span style={{ width: `${progressMap[screen]}%` }} />
          </div>
        )}
        {!['1', '3', '6'].includes(screen) && (
          <button className="back-btn" type="button" onClick={goBack}>Back</button>
        )}

        {screen === '1' && <Screen1 selectedOption={selectedOption} onChoose={chooseMain} onOthers={() => setScreen('3')} />}
        {['2A', '2B', '2C', '2D'].includes(screen) && (
          <SubOptionScreen
            screenKey={screen}
            selectedSubOption={selectedSubOption}
            onSelect={setSelectedSubOption}
            onContinue={() => {
              setCommentText('')
              setScreen('5')
            }}
          />
        )}
        {screen === '3' && <OthersInterstitial onChoose={chooseMain} onNone={() => setScreen('4')} />}
        {screen === '4' && (
          <OthersText
            value={othersText}
            onChange={setOthersText}
            onSubmit={submitOthers}
          />
        )}
        {screen === '5' && (
          <CommentScreen
            value={commentText}
            prompt={selectedSubOption?.prompt}
            onChange={setCommentText}
            onSubmit={() => submitStructured(commentText)}
            onSkip={() => submitStructured('')}
          />
        )}
        {screen === '6' && <SuccessScreen onReset={reset} />}
      </section>
    </main>
  )
}

function Screen1({ selectedOption, onChoose, onOthers }) {
  return (
    <>
      <h1 className="form-title">What's the issue?</h1>
      <p className="form-subtitle">Select the option that best describes your problem</p>
      <div className="main-options">
        {MAIN_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`main-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
            onClick={() => onChoose(option)}
          >
            <span className="main-icon">{option.icon}</span>
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
      {selectedSubOption && <button className="primary-btn" type="button" onClick={onContinue}>Continue</button>}
    </>
  )
}

function OthersInterstitial({ onChoose, onNone }) {
  return (
    <div className="others-gate">
      <div className="warning-icon">!</div>
      <h1 className="form-title small">Before you continue -</h1>
      <p className="form-subtitle">Does your issue fit any of these?</p>
      <div className="chip-grid">
        {MAIN_OPTIONS.map(option => (
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
      <button className="primary-btn" type="button" disabled={!value.trim()} onClick={onSubmit}>Submit Query</button>
    </>
  )
}

function CommentScreen({ value, prompt, onChange, onSubmit, onSkip }) {
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
      <button className="primary-btn" type="button" onClick={onSubmit}>Submit Query</button>
      <button className="secondary-btn" type="button" onClick={onSkip}>Skip and submit</button>
    </>
  )
}

function SuccessScreen({ onReset }) {
  return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <h1 className="form-title" style={{ marginTop: 20 }}>Query submitted</h1>
      <p className="success-body">We'll look into this and update the question if needed.</p>
      <div className="notify-banner">You'll be notified on the app when this is resolved.</div>
      <button className="primary-btn" type="button" style={{ background: 'var(--navy)', marginTop: 24 }} onClick={() => {}}>
        Continue Practice
      </button>
      <button className="link-btn" type="button" style={{ marginTop: 12, fontSize: 13 }} onClick={onReset}>
        Raise another query
      </button>
    </div>
  )
}
