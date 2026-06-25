const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')

const { createSession, getNextQuestion, processAnswer,
        resolveContinueChoice, computeAnalytics, getAllResults } = require('./engine/adaptiveEngine')
const { CLASS_TOPICS, DIFFICULTY_LABELS } = require('./data/questions')
const { findByEmail, findById, createUser, verifyPassword, safeUser } = require('./auth/userStore')
const { getSeenIds, addSeenIds, getStudentStats } = require('./data/progressStore')

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET  = process.env.JWT_SECRET  || 'vrisetech_dev_secret_change_in_prod'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

const sessions = {}

// ─── helpers ──────────────────────────────────────────────
function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Login required' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired — please log in again' })
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────

// POST /auth/signup   { name, email, password }
app.post('/auth/signup', (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  try {
    const user  = createUser(name, email, password)
    const token = signToken(user)
    res.json({ token, user: safeUser(user) })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// POST /auth/signin   { email, password }
app.post('/auth/signin', (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' })
  const user = findByEmail(email)
  if (!user || !verifyPassword(user, password))
    return res.status(401).json({ error: 'Invalid email or password' })
  const token = signToken(user)
  res.json({ token, user: safeUser(user) })
})

// GET /auth/me   (validates token, returns user)
app.get('/auth/me', authMiddleware, (req, res) => {
  const user = findById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: safeUser(user), stats: getStudentStats(req.user.id) })
})

// ─── CONFIG ───────────────────────────────────────────────

app.get('/config', (req, res) => {
  res.json({ CLASS_TOPICS, DIFFICULTY_LABELS })
})

// ─── SESSION ROUTES (auth required) ───────────────────────

app.post('/session/start', authMiddleware, (req, res) => {
  const { tenantId='tenant_001', testId='test_1',
          cls, mode, subject, topics, levelsSelected, questionsPerTopic } = req.body

  if (!cls || !mode || !subject || !topics?.length || !levelsSelected?.length || !questionsPerTopic)
    return res.status(400).json({ error: 'cls, mode, subject, topics, levelsSelected, questionsPerTopic required' })

  const studentId = req.user.id

  // Fetch this student's seen question IDs — engine will serve unseen ones first
  const seenIds = getSeenIds(studentId, subject)

  const session = createSession(studentId, tenantId, testId, cls, mode, subject,
                                topics, levelsSelected, questionsPerTopic, seenIds)
  sessions[session.sessionId] = session

  const nextQ = getNextQuestion(session)
  if (!nextQ)
    return res.status(400).json({ error: 'No questions found for selected topics/levels. Try different selections.' })

  res.json({
    sessionId: session.sessionId,
    question: nextQ,
    analytics: computeAnalytics(session),
    freshCount: session.seenIds ? (/* total pool */ topics.length) : 0
  })
})

app.post('/session/:id/answer', authMiddleware, (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.status === 'completed') return res.status(400).json({ error: 'Session already completed' })

  const { questionId, selectedAnswer, timeMs } = req.body
  const result = processAnswer(session, questionId, selectedAnswer, timeMs)

  if (result.needsContinueChoice) {
    return res.json({ result, nextQuestion: null, sessionComplete: false, awaitingDecision: true })
  }

  const nextQ = getNextQuestion(session)
  if (!nextQ) {
    session.status = 'completed'
    // Save all answered question IDs to student's history so they get fresh ones next time
    const answeredIds = session.allAnswers.map(a => a.questionId).filter(Boolean)
    addSeenIds(session.studentId, session.subject, answeredIds)
  }

  res.json({
    result, nextQuestion: nextQ, sessionComplete: !nextQ,
    finalAnalytics: !nextQ ? getAllResults(session) : null
  })
})

app.post('/session/:id/decision', authMiddleware, (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error: 'Session not found' })

  resolveContinueChoice(session, req.body.choice)
  const nextQ = getNextQuestion(session)
  if (!nextQ) {
    session.status = 'completed'
    const answeredIds = session.allAnswers.map(a => a.questionId).filter(Boolean)
    addSeenIds(session.studentId, session.subject, answeredIds)
  }

  res.json({
    nextQuestion: nextQ, sessionComplete: !nextQ,
    finalAnalytics: !nextQ ? getAllResults(session) : null
  })
})

app.get('/session/:id/analytics', authMiddleware, (req, res) => {
  const s = sessions[req.params.id]
  if (!s) return res.status(404).json({ error: 'Session not found' })
  res.json(computeAnalytics(s))
})

app.post('/session/:id/stop', authMiddleware, (req, res) => {
  const s = sessions[req.params.id]
  if (!s) return res.status(404).json({ error: 'Session not found' })
  s.status = 'completed'
  const answeredIds = s.allAnswers.map(a => a.questionId).filter(Boolean)
  addSeenIds(s.studentId, s.subject, answeredIds)
  res.json({ message: 'Session stopped', finalAnalytics: getAllResults(s) })
})

// GET /student/progress  — how many questions seen per subject
app.get('/student/progress', authMiddleware, (req, res) => {
  res.json(getStudentStats(req.user.id))
})

app.listen(3001, () => console.log('\nVriseTech API → http://localhost:3001\n'))
