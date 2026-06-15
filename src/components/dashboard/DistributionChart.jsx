import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'

const distributionData = [
  { category: 'Others', count: 3819, pct: '43.5%' },
  { category: 'Wrong Answer', count: 2932, pct: '33.4%' },
  { category: "Can't See Something", count: 694, pct: '7.9%' },
  { category: 'Not the Right Question', count: 664, pct: '7.6%' },
  { category: 'Subject/Chapter Mapping', count: 349, pct: '4.0%' },
  { category: 'Options Not Visible', count: 228, pct: '2.6%' },
  { category: 'Out of Syllabus', count: 86, pct: '1.0%' }
]

export default function DistributionChart() {
  return (
    <section className="dash-card">
      <h2 className="section-title">Where Students Are Going Today</h2>
      <div className="chart-wrap" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributionData} layout="vertical" margin={{ top: 8, right: 24, left: 18, bottom: 8 }}>
            <CartesianGrid stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" domain={[0, 4000]} />
            <YAxis dataKey="category" type="category" width={180} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value, name, item) => [`${value} (${item.payload.pct})`, 'Queries']} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {distributionData.map(row => <Cell key={row.category} fill={row.category === 'Others' ? '#0D1E36' : '#5A6A7E'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">Note: 'Wrong Answer' is undercounted. True volume including Others sub-intents is about 40% (3,506 rows).</p>
    </section>
  )
}
