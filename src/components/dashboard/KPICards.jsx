const cards = [
  { label: 'TOTAL QUERIES ANALYSED', value: '8,772', sub: 'Unique students: 2,552' },
  { label: 'OTHERS SHARE', value: '43.5%', target: '<5%', sub: 'Target after redesign' },
  { label: 'BLANK TEXT RATE', value: '30.4%', target: '<3%', sub: 'Target after smart prompts' },
  { label: 'ROUTING ACCURACY', value: '~56%', target: '>90%', sub: 'Target after new taxonomy' }
]

export default function KPICards() {
  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div className="dash-card" key={card.label}>
          <div className="kpi-label">{card.label}</div>
          {card.target ? (
            <div>
              <span className="kpi-value danger">{card.value}</span>
              <span className="kpi-arrow">-&gt;</span>
              <span className="kpi-target">{card.target}</span>
            </div>
          ) : (
            <div className="kpi-value">{card.value}</div>
          )}
          <div className="kpi-sub">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
