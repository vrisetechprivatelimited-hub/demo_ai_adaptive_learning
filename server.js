const express = require('express')
const cors = require('cors')
const { createSession, getNextQuestion, processAnswer, resolveContinueChoice, computeAnalytics, getAllResults } = require('./engine/adaptiveEngine')
const { CLASS_TOPICS, DIFFICULTY_LABELS } = require('./data/questions')

const app = express()
app.use(cors())
app.use(express.json())

const sessions = {}

app.get('/config', (req, res) => {
  res.json({ CLASS_TOPICS, DIFFICULTY_LABELS })
})

app.post('/session/start', (req, res) => {
  const { studentId='student_1', tenantId='tenant_001', testId='test_1',
          cls, mode, subject, topics, levelsSelected, questionsPerTopic } = req.body
  if (!cls||!mode||!subject||!topics?.length||!levelsSelected?.length||!questionsPerTopic)
    return res.status(400).json({ error:'cls, mode, subject, topics, levelsSelected, questionsPerTopic required' })

  const session = createSession(studentId, tenantId, testId, cls, mode, subject, topics, levelsSelected, questionsPerTopic)
  sessions[session.sessionId] = session

  const nextQ = getNextQuestion(session)
  if (!nextQ)
    return res.status(400).json({ error:'No questions found for selected topics/levels. Try different selections.' })

  res.json({ sessionId: session.sessionId, question: nextQ, analytics: computeAnalytics(session) })
})

app.post('/session/:id/answer', (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error:'Session not found' })
  if (session.status === 'completed') return res.status(400).json({ error:'Session already completed' })

  const { questionId, selectedAnswer, timeMs } = req.body
  const result = processAnswer(session, questionId, selectedAnswer, timeMs)

  // If a continue/end decision is now pending, don't fetch next question yet
  if (result.needsContinueChoice) {
    return res.json({ result, nextQuestion: null, sessionComplete: false, awaitingDecision: true })
  }

  const nextQ = getNextQuestion(session)
  if (!nextQ) session.status = 'completed'

  res.json({ result, nextQuestion: nextQ, sessionComplete: !nextQ, finalAnalytics: !nextQ ? getAllResults(session) : null })
})

// POST /session/:id/decision  { choice: 'continue' | 'end' }
app.post('/session/:id/decision', (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error:'Session not found' })
  const { choice } = req.body
  resolveContinueChoice(session, choice)

  const nextQ = getNextQuestion(session)
  if (!nextQ) session.status = 'completed'

  res.json({ nextQuestion: nextQ, sessionComplete: !nextQ, finalAnalytics: !nextQ ? getAllResults(session) : null })
})

app.get('/session/:id/analytics', (req, res) => {
  const s = sessions[req.params.id]
  if (!s) return res.status(404).json({ error:'Session not found' })
  res.json(computeAnalytics(s))
})

app.post('/session/:id/stop', (req, res) => {
  const s = sessions[req.params.id]
  if (!s) return res.status(404).json({ error:'Session not found' })
  s.status = 'completed'
  res.json({ message:'Session stopped', finalAnalytics: getAllResults(s) })
})

app.listen(3001, () => console.log('\nVriseTech API → http://localhost:3001\n'))
