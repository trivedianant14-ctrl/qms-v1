import { useState } from 'react'

const P='#534AB7', PL='#EEEDFE', PD='#3C3489'
const T1='#1a1a2e', T2='#5a5a78', T3='#9898b0', BD='#e8e8f2', BG2='#f5f5fb'
const GREEN='#3B6D11', GREENBG='#EAF3DE'

const ACTIONS = [
  { id: 'topic', label: 'Topic\nName', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h7"/></svg> },
  { id: 'save', label: 'Save', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
  { id: 'complete', label: 'Mark as\nComplete', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
  { id: 'notes', label: 'Notes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'share', label: 'Share', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
  { id: 'practice', label: 'Practice', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
]

export default function VideoPlayer({ navigate, currentVideo }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoNext, setAutoNext] = useState(true)
  const [markedComplete, setMarkedComplete] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [speed, setSpeed] = useState('1x')
  const [subtitles, setSubtitles] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [inQueue, setInQueue] = useState(true)

  const title = currentVideo?.title || 'Body Planes & Directional Terms'
  const duration = currentVideo?.duration || '14:30'

  const handleAction = (id) => {
    if (id === 'complete') setMarkedComplete(c => !c)
    if (id === 'save') setSaved(s => !s)
    if (id === 'practice') navigate('home')
  }

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, borderRadius: 11, background: value ? P : BD, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>

      {/* Video player */}
      <div style={{ background: '#0d0d1a', paddingTop: 28, flexShrink: 0 }}>
        {/* Player top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 10px' }}>
          <button onClick={() => navigate('videosubject')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, padding: '2px 6px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 4 }}>CC</button>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '8px 0 14px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>10</span>
          </button>
          <button onClick={() => setIsPlaying(p => !p)} style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {isPlaying
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}><polygon points="5,3 19,12 5,21"/></svg>
            }
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>10</span>
          </button>
        </div>

        {/* Pip button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 14px 8px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="10" width="9" height="6" rx="1" fill="rgba(255,255,255,0.3)" stroke="currentColor"/></svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: 3, width: '0%', background: P }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto' }}>

        {/* Title row */}
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1, lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 11, color: T3 }}>Applied Anatomy · Ch 1 · {duration}</div>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', marginTop: 2 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          {/* Auto-Next toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: T2, fontWeight: 500 }}>Auto-Next</span>
            <Toggle value={autoNext} onChange={setAutoNext} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '12px 0', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {ACTIONS.map(a => {
              const active = (a.id === 'complete' && markedComplete) || (a.id === 'save' && saved)
              return (
                <button key={a.id} onClick={() => handleAction(a.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: active ? P : T2, minWidth: 44 }}>
                  <div style={{ color: active ? P : T2 }}>{a.icon}</div>
                  <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, color: active ? P : T3, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{a.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* In Queue */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T1 }}>In Queue</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {inQueue ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: BG2, borderRadius: 10, border: `1px solid ${BD}` }}>
              <div style={{ width: 36, height: 28, background: '#1a1a2e', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Directional Terminology</div>
                <div style={{ fontSize: 11, color: T3 }}>10:45 · Up next</div>
              </div>
              <button onClick={() => setInQueue(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, fontSize: 16, display: 'flex', alignItems: 'center' }}>×</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T3, textAlign: 'center', padding: '8px 0' }}>Queue is empty</div>
          )}
        </div>

        {/* Continue watching */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: PL, border: `1px solid ${PD}20`, borderRadius: 10 }}>
            <div style={{ width: 36, height: 28, background: PD, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: P, fontWeight: 600 }}>Continue where you left off</div>
              <div style={{ height: 3, background: 'white', borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: 3, width: '0%', background: P, borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 11, color: P, fontWeight: 600 }}>0%</span>
          </div>
        </div>

        {/* Report issue */}
        <div style={{ padding: '16px' }}>
          <button style={{ width: '100%', padding: '12px', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: GREEN, textAlign: 'center' }}>
            Having an issue? Click here to report it
          </button>
        </div>

      </div>

      {/* Settings sheet */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '14px 20px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T1 }}>Settings</span>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: T3, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              {/* Video Speed */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T1, marginBottom: 10 }}>Video Speed</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['0.5x', '1x', '1.25x', '1.5x', '2x'].map(s => (
                    <button key={s} onClick={() => setSpeed(s)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${speed === s ? P : BD}`, background: speed === s ? PL : 'white', color: speed === s ? PD : T2, fontSize: 12, fontWeight: speed === s ? 700 : 400, cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid ${BD}`, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Quality</span>
                <span style={{ fontSize: 13, color: T2 }}>Auto ↓</span>
              </div>

              {/* Subtitles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid ${BD}`, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Subtitles</span>
                <Toggle value={subtitles} onChange={setSubtitles} />
              </div>

              {/* Dark Mode */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Dark Mode</span>
                <Toggle value={darkMode} onChange={setDarkMode} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
