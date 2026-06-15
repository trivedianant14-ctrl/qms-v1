import { useMemo, useState } from 'react'
import { useQueries } from '../../context/QueryContext'

const pageSize = 15

const badgeClass = {
  'Wrong Answer': 'badge-wrong',
  "Can't See Something": 'badge-cant',
  'Need Help': 'badge-help',
  'Not the Right Question': 'badge-not',
  Others: 'badge-others'
}

export default function ActiveBacklogTable() {
  const { queries } = useQueries()
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState('desc')

  const activeCount = queries.filter(query => query.status === 'active').length
  const activeQuestionCounts = useMemo(() => {
    return queries.filter(q => q.status === 'active').reduce((acc, query) => {
      acc[query.question_id] = (acc[query.question_id] || 0) + 1
      return acc
    }, {})
  }, [queries])

  const sorted = useMemo(() => {
    const sign = direction === 'desc' ? -1 : 1
    return [...queries].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1
      const countDiff = (activeQuestionCounts[a.question_id] || 0) - (activeQuestionCounts[b.question_id] || 0)
      if (countDiff) return countDiff * sign
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
  }, [activeQuestionCounts, direction, queries])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)

  return (
    <section className="dash-card full-section">
      <h2 className="section-title">Active Backlog - Open Tickets</h2>
      <p className="card-subtitle">{activeCount} queries need resolution</p>
      <div className="orange-note">New form submissions (from the prototype) appear below in real time.</div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Question ID</th>
              <th style={{ width: 160 }}>Category</th>
              <th>Sub-option</th>
              <th>Query Text</th>
              <th style={{ width: 140 }}>Resolver Team</th>
              <th style={{ width: 90 }} onClick={() => setDirection(direction === 'desc' ? 'asc' : 'desc')}>SLA</th>
              <th style={{ width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(query => (
              <tr key={query.id} className={(activeQuestionCounts[query.question_id] || 0) >= 3 ? 'hotspot-row' : ''}>
                <td className="qid">#{query.question_id}</td>
                <td><span className={`category-badge ${badgeClass[query.category]}`}>{query.category}</span></td>
                <td><div className="truncate">{query.sub_option}</div></td>
                <td><div className="truncate query-text">{query.query_text || '-'}</div></td>
                <td className="team">{query.resolver_team}</td>
                <td>{query.sla_hours}h</td>
                <td><span className={`status-badge status-${query.status}`}>{query.status === 'active' ? 'Active' : 'Resolved'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>Showing {start + 1}-{Math.min(start + pageSize, sorted.length)} of {sorted.length} queries.</span>
        <span>
          <button type="button" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ marginLeft: 8 }}>Next</button>
        </span>
      </div>
    </section>
  )
}
