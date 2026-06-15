import { createContext, useContext, useState } from 'react'
import { mockQueries } from '../data/mockQueries'

const QueryContext = createContext(null)

export function QueryProvider({ children }) {
  const [queries, setQueries] = useState(mockQueries)

  const addQuery = (newQuery) => {
    setQueries(prev => [{
      id: Date.now(),
      question_id: Math.floor(Math.random() * 90000) + 10000,
      category: newQuery.category,
      sub_option: newQuery.subOption,
      query_text: newQuery.commentText || '',
      status: 'active',
      resolver_team: getResolverTeam(newQuery.category),
      sla_hours: getSLA(newQuery.category),
      timestamp: new Date().toISOString()
    }, ...prev])
  }

  return (
    <QueryContext.Provider value={{ queries, addQuery }}>
      {children}
    </QueryContext.Provider>
  )
}

export function useQueries() {
  const value = useContext(QueryContext)
  if (!value) throw new Error('useQueries must be used inside QueryProvider')
  return value
}

function getResolverTeam(category) {
  const map = {
    'Wrong Answer': 'Content QA',
    "Can't See Something": 'Engineering',
    'Need Help': 'Educator',
    'Not the Right Question': 'Content QA',
    Others: 'Ops Triage'
  }
  return map[category] || 'Ops Triage'
}

function getSLA(category) {
  const map = {
    'Wrong Answer': 48,
    "Can't See Something": 24,
    'Need Help': 72,
    'Not the Right Question': 48,
    Others: 24
  }
  return map[category] || 48
}
