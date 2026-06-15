import ActiveBacklogTable from './ActiveBacklogTable'
import DistributionChart from './DistributionChart'
import KPICards from './KPICards'
import OthersBreakdownChart from './OthersBreakdownChart'
import RoutingMatrix from './RoutingMatrix'

export default function Dashboard() {
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Query Management - Ops Dashboard</h1>
          <p className="dashboard-sub">Based on 8,772 queries. Phase 1 target metrics shown in green.</p>
        </div>
        <span className="ref-badge">Engineering Reference</span>
      </header>
      <KPICards />
      <div className="chart-grid">
        <DistributionChart />
        <OthersBreakdownChart />
      </div>
      <ActiveBacklogTable />
      <RoutingMatrix />
    </main>
  )
}
