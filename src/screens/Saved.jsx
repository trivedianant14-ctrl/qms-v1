import { useState } from 'react'
import { QUESTIONS, SAVE_TAGS } from '../data'

const P='#534AB7',PL='#EEEDFE',PB='#AFA9EC',PD='#3C3489'
const T1='#1a1a2e',T2='#5a5a78',T3='#9898b0',BD='#e8e8f2',BG2='#f5f5fb'

export default function Saved({ navigate, savedQs, unsaveQuestion }) {
  const [filter, setFilter] = useState('all')
  const [confirmRemove, setConfirmRemove] = useState(null)

  const displayed = (filter === 'all' ? [...savedQs] : savedQs.filter(s => s.tag === filter)).reverse()
  const getQ = (qId) => QUESTIONS.find(q => q.id === qId)

  const tagCount = (tagId) => savedQs.filter(s => s.tag === tagId).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>

      {/* Status bar */}
      <div style={{ padding: '12px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T1 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: T2 }}>
          <svg width="16" height="11" viewBox="0 0 30 20" fill="currentColor"><rect x="0" y="8" width="4" height="12" rx="1" opacity="0.4"/><rect x="7" y="5" width="4" height="15" rx="1" opacity="0.6"/><rect x="14" y="2" width="4" height="18" rx="1" opacity="0.8"/><rect x="21" y="0" width="4" height="20" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor"/><rect x="22" y="3.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.4"/><rect x="1.5" y="1.5" width="15" height="9" rx="1.5" fill="currentColor"/></svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '6px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T1, display: 'flex', padding: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T1 }}>Saved Questions</span>
        </div>
        {savedQs.length > 0 && (
          <span style={{ fontSize: 12, color: T3, background: BG2, padding: '3px 10px', borderRadius: 20 }}>{savedQs.length} saved</span>
        )}
      </div>

      {/* Filter pills */}
      {savedQs.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button onClick={() => setFilter('all')} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, border: `1px solid ${filter === 'all' ? PB : BD}`, background: filter === 'all' ? PL : 'transparent', color: filter === 'all' ? PD : T3, fontWeight: filter === 'all' ? 600 : 400, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
              All ({savedQs.length})
            </button>
            {SAVE_TAGS.map(tag => {
              const count = tagCount(tag.id)
              if (count === 0) return null
              const active = filter === tag.id
              return (
                <button key={tag.id} onClick={() => setFilter(tag.id)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, border: `1px solid ${active ? tag.border : BD}`, background: active ? tag.bg : 'transparent', color: active ? tag.color : T3, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
                  {tag.label} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* List */}
      <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {savedQs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: BG2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="1.8" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T2, marginBottom: 4 }}>No saved questions yet</div>
              <div style={{ fontSize: 12, color: T3, lineHeight: 1.5 }}>Tap the bookmark icon while solving a question to save it for later review.</div>
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: T3, fontSize: 13 }}>No questions with this tag</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(s => {
              const q = getQ(s.qId)
              const tag = SAVE_TAGS.find(t => t.id === s.tag)
              if (!q || !tag) return null
              return (
                <div key={s.qId} style={{ border: `1.5px solid ${tag.border}`, borderRadius: 12, padding: '13px 14px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T3 }}>Q{q.id}</span>
                      <span style={{ fontSize: 10, color: T3 }}>·</span>
                      <span style={{ fontSize: 11, color: T3 }}>{q.topicName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tag.bg, color: tag.color, border: `1px solid ${tag.border}`, whiteSpace: 'nowrap' }}>{tag.label}</span>
                      <button onClick={() => setConfirmRemove(s.qId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, padding: 2, display: 'flex', alignItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: T1, lineHeight: 1.5, marginBottom: q.isPYQ ? 8 : 0 }}>{q.text}</div>
                  {q.isPYQ && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80' }}>PYQ · {q.pyqExam} {q.pyqYear}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Remove confirmation popup */}
      {confirmRemove !== null && (
        <div className="popup-overlay">
          <div className="popup">
            <div style={{ fontSize: 16, fontWeight: 700, color: T1, marginBottom: 8 }}>Remove saved question?</div>
            <div style={{ fontSize: 13, color: T2, marginBottom: 20, lineHeight: 1.5 }}>This question will be removed from your saved list. You can save it again anytime while solving.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmRemove(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { unsaveQuestion(confirmRemove); setConfirmRemove(null) }} className="btn-primary" style={{ flex: 1 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
