export const MAIN_OPTIONS = [
  {
    id: 'wrong-answer',
    icon: 'x',
    iconBg: 'rgba(220,38,38,0.1)',
    iconColor: '#DC2626',
    title: 'Problem with the answer',
    subtitle: 'The answer key looks wrong to me',
    screenKey: '2A'
  },
  {
    id: 'cant-see',
    icon: 'eye',
    iconBg: 'rgba(37,99,235,0.1)',
    iconColor: '#2563EB',
    title: "Can't See Something",
    subtitle: "I can't see the image, options, or explanation",
    screenKey: '2B'
  },
  {
    id: 'need-help',
    icon: '!',
    iconBg: 'rgba(22,163,74,0.1)',
    iconColor: '#16A34A',
    title: 'I have a doubt',
    subtitle: 'I want this question or answer explained',
    screenKey: '2C'
  },
  {
    id: 'not-right-q',
    icon: '!',
    iconBg: 'rgba(234,88,12,0.1)',
    iconColor: '#EA580C',
    title: 'Problem with this question',
    subtitle: "This question doesn't match my syllabus or exam",
    screenKey: '2D'
  },
  {
    id: 'audio-issue',
    icon: '!',
    iconBg: 'rgba(147,51,234,0.1)',
    iconColor: '#9333EA',
    title: 'Problem with the audio solution',
    subtitle: "The audio explanation isn't working or doesn't sound right",
    screenKey: '2E'
  }
]

export const SUB_OPTIONS = {
  '2A': {
    header: 'What exactly feels wrong?',
    category: 'Problem with the Answer',
    options: [
      { id: 'answer-wrong',    label: 'The answer shown is wrong',                         prompt: 'What do you think the correct answer is, and why?' },
      { id: 'exp-mismatch',    label: "Explanation / rationale doesn't match the answer",   prompt: 'How does the explanation contradict the answer?' },
      { id: 'book-different',  label: 'My book / teacher says something different',         prompt: 'Which book or source are you referring to?' },
      { id: 'shows-unattempt', label: 'I answered this but it shows unattempted',           prompt: 'Can you describe what happened when you selected your answer?' },
      { id: 'multi-correct',   label: 'More than 1 option looks correct',                   prompt: 'Which options seem correct to you, and why?' },
      { id: 'marked-wrong',    label: "I selected the right answer but it's marked wrong",  prompt: 'Which option did you select?' }
    ]
  },
  '2B': {
    header: "What can't you see?",
    category: "Can't See Something",
    options: [
      { id: 'image-loading',   label: 'Image in the question is not loading',               prompt: 'Which image — question, options, or explanation?' },
      { id: 'text-garbled',    label: 'Option text is missing or has symbols',              prompt: 'Which option number is affected?' },
      { id: 'formula-missing', label: 'Explanation / table / formula is not showing',       prompt: "What's missing — table, formula, or diagram?" },
      { id: 'cut-off',         label: 'Question is cut off or incomplete',                  prompt: 'What part of the question seems cut off?' }
    ]
  },
  '2C': {
    header: 'What are you unsure about?',
    category: 'I Have a Doubt',
    options: [
      { id: 'why-correct',   label: 'Why is this the correct answer?',     prompt: 'What part of the explanation is confusing?' },
      { id: 'didnt-get-exp', label: "I didn't understand the explanation", prompt: 'Which part do you want explained more simply?' },
      { id: 'why-wrong',     label: 'Why is this option wrong?',           prompt: 'Which option are you wondering about?' }
    ]
  },
  '2D': {
    header: "What's the problem with this question?",
    category: 'Problem with this Question',
    options: [
      { id: 'q-wrong',        label: 'The question itself is wrong',                    prompt: "What's wrong with the question?" },
      { id: 'already-seen',   label: "I've already seen this question",                 prompt: 'Same test or a different one?' },
      { id: 'wrong-language', label: 'Question is in the wrong language',               prompt: 'What language were you expecting?' },
      { id: 'not-syllabus',   label: 'This is not in my syllabus',                     prompt: 'What exam or syllabus are you preparing for?' },
      { id: 'wrong-topic',    label: 'This belongs to a different topic or chapter',   prompt: 'What topic or chapter should this be under?' }
    ]
  },
  '2E': {
    header: "What's wrong with the audio?",
    category: 'Problem with the Audio Solution',
    options: [
      { id: 'audio-not-playing', label: "Audio doesn't play at all",                    prompt: 'What happens when you try to play it — nothing, a spinner, or an error?' },
      { id: 'audio-unclear',     label: 'Audio is unclear or hard to understand',        prompt: 'What part was hard to understand?' },
      { id: 'audio-mismatch',    label: "Audio doesn't match the explanation shown",     prompt: 'What does the audio say instead?' },
      { id: 'audio-cutoff',      label: 'Audio stops or cuts off before finishing',      prompt: 'At what point does it stop?' },
      { id: 'audio-wrong-lang',  label: 'Audio is in the wrong language',                prompt: 'What language were you expecting?' }
    ]
  }
}

export const OTHERS_PLACEHOLDER = 'For example: the question is in the wrong language, or a formula is missing, or an option is cut off...'
