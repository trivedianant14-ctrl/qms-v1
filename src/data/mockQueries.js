const categoryMeta = {
  'Wrong Answer': { team: 'Content QA', sla: 48 },
  "Can't See Something": { team: 'Engineering', sla: 24 },
  'Need Help': { team: 'Educator', sla: 72 },
  'Not the Right Question': { team: 'Content QA', sla: 48 },
  Others: { team: 'Ops Triage', sla: 24 }
}

const subOptions = {
  'Wrong Answer': [
    'The marked answer is wrong',
    "The explanation doesn't match the answer",
    'More than one option seems correct',
    'The question is incomplete or unclear',
    'My book or class says something different'
  ],
  "Can't See Something": [
    'Question image is not showing',
    'Option text is missing or garbled',
    'Explanation, table, or formula is broken',
    "Image is showing but it's wrong or unclear"
  ],
  'Need Help': [
    'Explain why this answer is correct',
    'Explain in simpler language',
    'Why is an option wrong?',
    'My teacher or book explains this differently'
  ],
  'Not the Right Question': [
    'The question itself has wrong or incorrect content',
    "I've already seen this question before",
    'This is under the wrong subject or chapter',
    'This is in the wrong language or out of syllabus'
  ],
  Others: ['Others']
}

const queryTexts = [
  'The answer should be 42% not 40%',
  'Image is not loading on the question',
  'Can you explain why option B is wrong?',
  'This question appeared in the previous test too',
  'Formula is not rendering properly',
  'The rationale supports option C but answer is marked as B',
  'Table values are cut off on mobile',
  'My textbook says the opposite answer',
  'The Hindi text is garbled',
  'Please explain the shortcut method',
  ''
]

const hotspots = [
  { id: 1, question_id: 92306, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: 'Rationale says C is correct but answer is marked as B', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 2, question_id: 92306, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Answer should be option A', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 3, question_id: 92306, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: '', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 4, question_id: 92306, category: 'Wrong Answer', sub_option: 'More than one option seems correct', query_text: 'Both A and C look correct', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 5, question_id: 92306, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: 'Explanation contradicts the marked option', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 6, question_id: 92306, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Marked answer should be reviewed', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 7, question_id: 92306, category: 'Wrong Answer', sub_option: 'The question is incomplete or unclear', query_text: 'Stem misses a key value', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 8, question_id: 92306, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Correct answer should be D', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 9, question_id: 92306, category: 'Wrong Answer', sub_option: 'My book or class says something different', query_text: 'Class notes say option B', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 10, question_id: 92306, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: 'Rationale needs correction', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 11, question_id: 88764, category: 'Wrong Answer', sub_option: 'More than one option seems correct', query_text: 'Both B and C seem correct based on the rationale given', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 12, question_id: 88764, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Option C should be correct', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 13, question_id: 88764, category: 'Wrong Answer', sub_option: 'More than one option seems correct', query_text: '', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 14, question_id: 88764, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: 'The explanation points to B', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 15, question_id: 68611, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: 'The rationale clearly supports option B but marked answer is D', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 16, question_id: 68611, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Answer key mismatch', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 17, question_id: 68611, category: 'Wrong Answer', sub_option: 'The question is incomplete or unclear', query_text: 'Question statement is incomplete', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 18, question_id: 68611, category: 'Wrong Answer', sub_option: "The explanation doesn't match the answer", query_text: '', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 19, question_id: 2538, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: '', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 20, question_id: 2538, category: 'Wrong Answer', sub_option: 'The marked answer is wrong', query_text: 'Correct option should be A', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 21, question_id: 2538, category: 'Wrong Answer', sub_option: 'More than one option seems correct', query_text: 'A and D are both possible', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 22, question_id: 69212, category: 'Not the Right Question', sub_option: 'This is in the wrong language or out of syllabus', query_text: 'Question is in Hindi but I selected English medium', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 23, question_id: 69212, category: 'Not the Right Question', sub_option: "I've already seen this question before", query_text: 'This appeared in the same test', status: 'active', resolver_team: 'Content QA', sla_hours: 48 },
  { id: 24, question_id: 69212, category: 'Not the Right Question', sub_option: 'This is under the wrong subject or chapter', query_text: 'Should be in pharmacology', status: 'active', resolver_team: 'Content QA', sla_hours: 48 }
]

const targetCounts = {
  'Wrong Answer': 46,
  'Not the Right Question': 21,
  "Can't See Something": 18,
  'Need Help': 10,
  Others: 5
}

const activeTargets = {
  'Wrong Answer': 23,
  'Not the Right Question': 8,
  "Can't See Something": 7,
  'Need Help': 2,
  Others: 0
}

function buildRows() {
  const rows = [...hotspots]
  const categoryCounts = rows.reduce((acc, row) => ({ ...acc, [row.category]: (acc[row.category] || 0) + 1 }), {})
  const activeCounts = rows.reduce((acc, row) => row.status === 'active' ? { ...acc, [row.category]: (acc[row.category] || 0) + 1 } : acc, {})
  let id = rows.length + 1

  Object.entries(targetCounts).forEach(([category, target]) => {
    const meta = categoryMeta[category]
    while ((categoryCounts[category] || 0) < target) {
      const index = categoryCounts[category] || 0
      const shouldBeActive = (activeCounts[category] || 0) < activeTargets[category]
      rows.push({
        id,
        question_id: 10000 + ((id * 7919) % 89000),
        category,
        sub_option: subOptions[category][index % subOptions[category].length],
        query_text: queryTexts[(id + index) % queryTexts.length],
        status: shouldBeActive ? 'active' : 'resolved',
        resolver_team: meta.team,
        sla_hours: meta.sla,
        timestamp: new Date(Date.now() - id * 3600000).toISOString()
      })
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
      if (shouldBeActive) activeCounts[category] = (activeCounts[category] || 0) + 1
      id += 1
    }
  })

  return rows.map((row, index) => ({
    timestamp: new Date(Date.now() - index * 3600000).toISOString(),
    ...row
  }))
}

export const mockQueries = buildRows()
