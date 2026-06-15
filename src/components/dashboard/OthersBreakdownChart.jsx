import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const othersData = [
  { intent: 'Not classified', rows: 1459, pct: '38.2%' },
  { intent: 'Answer key / rationale mismatch', rows: 574, pct: '15.0%' },
  { intent: 'Image / table / formula issue', rows: 343, pct: '9.0%' },
  { intent: 'Blank / no text', rows: 304, pct: '8.0%' },
  { intent: 'Conceptual doubt / alt logic', rows: 297, pct: '7.8%' },
  { intent: 'Need better explanation', rows: 250, pct: '6.5%' },
  { intent: 'Duplicate / repeated content', rows: 247, pct: '6.5%' },
  { intent: 'Language / encoding issue', rows: 169, pct: '4.4%' },
  { intent: 'Technical / platform issue', rows: 145, pct: '3.8%' },
  { intent: 'Content change request', rows: 31, pct: '0.8%' }
]

export default function OthersBreakdownChart() {
  return (
    <section className="dash-card">
      <h2 className="section-title">What's Hiding Inside 'Others'</h2>
      <p className="card-subtitle">3,819 rows decoded into distinct intent categories</p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={othersData} layout="vertical" margin={{ top: 8, right: 24, left: 18, bottom: 8 }}>
            <CartesianGrid stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="intent" type="category" width={220} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value, name, item) => [`${value} (${item.payload.pct})`, 'Rows']} />
            <Bar dataKey="rows" fill="#E07B2A" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="callout">After redesign, these will route to structured categories. 'Others' will capture only true edge cases (&lt;5%).</div>
    </section>
  )
}
