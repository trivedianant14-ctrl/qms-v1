const rows = [
  ['Wrong Answer', 'Content QA (SME for source conflicts)', '48h', 'High (40% volume)'],
  ["Can't See Something", 'Engineering (rendering) or Content', '24h', 'Critical (UX blocker)'],
  ['Need Help', 'Educator / Content', '72h', 'Medium (teaching queue)'],
  ['Not the Right Question', 'Content QA (stem) or Engineering', '48h', 'High (content integrity)'],
  ['Others', 'Ops Triage - route to team', '24h triage', 'Variable']
]

export default function RoutingMatrix() {
  return (
    <section className="dash-card full-section">
      <h2 className="section-title">Resolver Routing Reference</h2>
      <p className="card-subtitle">Engineering: build this routing logic into the backend query pipeline.</p>
      <div className="table-scroll matrix-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Primary Resolver</th>
              <th>SLA Target</th>
              <th>Priority Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row[0]}>
                {row.map(cell => <td key={cell}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="matrix-notes">
        <p>Phase 2: Add created_at, resolved_at, resolver_id, resolution_code fields to backend.</p>
        <p>Resolution codes to implement: answer_corrected | rationale_updated | image_restored | question_removed | no_issue_found | duplicate_closed</p>
      </div>
    </section>
  )
}
