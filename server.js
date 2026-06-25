const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')
const multer  = require('multer')
const fs      = require('fs')
const path    = require('path')

const { createSession, getNextQuestion, processAnswer,
        resolveContinueChoice, computeAnalytics, getAllResults } = require('./engine/adaptiveEngine')
const { CLASS_TOPICS, DIFFICULTY_LABELS } = require('./data/questions')
const { findByEmail, findById, getAll, createUser, verifyPassword,
        updateSubscription, incrementSessionCount, getPlanLimits,
        safeUser, PLANS } = require('./auth/userStore')
const { getSeenIds, addSeenIds, getStudentStats } = require('./data/progressStore')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('.'))   // serves index.html and admin.html

const JWT_SECRET  = process.env.JWT_SECRET  || 'vrisetech_dev_secret_change_in_prod'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

const sessions = {}

// ─── Multer (PDF uploads) ──────────────────────────────────
const upload = multer({
  dest: path.join(__dirname, 'data', 'uploads'),
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf'))
  },
  limits: { fileSize: 20 * 1024 * 1024 }  // 20 MB max
})

// ─── Helpers ──────────────────────────────────────────────
function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role },
                  JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Login required' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Session expired — please log in again' }) }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

// ─── PDF text extraction + MCQ parser ─────────────────────
async function parsePdfToQuestions(filePath) {
  const pdfParse = require('pdf-parse')
  const buf  = fs.readFileSync(filePath)
  const data = await pdfParse(buf)
  const text = data.text

  const questions = []
  // Split on question numbers (1. or 1) or Q1.)
  const blocks = text.split(/\n(?=\s*(?:Q\.?\s*)?\d{1,3}[.)]\s)/).filter(b => b.trim().length > 20)

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue

    // Extract question number + text
    const qMatch = lines[0].match(/^(?:Q\.?\s*)?(\d{1,3})[.)]\s+(.+)/)
    if (!qMatch) continue
    const qNum  = parseInt(qMatch[1])
    let   qText = qMatch[2]

    // Collect continuation lines before first option
    let i = 1
    while (i < lines.length && !lines[i].match(/^\(?[A-D1-4][.)]/i)) {
      qText += ' ' + lines[i]; i++
    }

    // Extract options
    const opts = []
    while (i < lines.length && opts.length < 4) {
      const oMatch = lines[i].match(/^\(?([A-D1-4])[.)]\s*(.+)/i)
      if (oMatch) {
        let optText = oMatch[2]
        i++
        // Continuation of option
        while (i < lines.length && !lines[i].match(/^\(?[A-D1-4][.)]/i)) {
          optText += ' ' + lines[i]; i++
        }
        opts.push(optText.trim())
      } else { i++ }
    }

    if (opts.length < 2) continue   // not enough options

    // Auto-detect difficulty by question length + keyword complexity
    const difficulty = autoDetectDifficulty(qText)

    questions.push({
      _parseId: `parse_${Date.now()}_${qNum}`,
      subject:    'maths',
      class:      '10',
      topic:      'general',
      difficulty,
      question:   qText.trim(),
      options:    opts.concat(['', '', '']).slice(0, 4),
      answer:     opts[0] || '',
      explanation: '',
      approved:   false
    })
  }
  return questions
}

function autoDetectDifficulty(text) {
  const t = text.toLowerCase()
  const hard  = ['prove','differentiat','integrat','determinant','matrix','vector','complex','limit','probabilit']
  const med   = ['find','calculate','solve','equation','factori','quadratic','triangle','circle']
  const easy  = ['what is','which of','simplify','value of','sum of']
  if (hard.some(k => t.includes(k))) return 4
  if (med.some(k  => t.includes(k))) return 3
  if (easy.some(k => t.includes(k))) return 1
  return 2
}

// ─── AUTH ROUTES ──────────────────────────────────────────
app.post('/auth/signup', (req, res) => {
  const { name, email, mobile, password, plan = 'free' } = req.body
  if (!name || !email || !mobile || !password)
    return res.status(400).json({ error: 'Name, email, mobile and password are required' })
  try {
    const user  = createUser(name, email, mobile, password, plan)
    const token = signToken(user)
    res.json({ token, user: safeUser(user) })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

app.post('/auth/signin', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const user = findByEmail(email)
  if (!user || !verifyPassword(user, password))
    return res.status(401).json({ error: 'Invalid email or password' })
  res.json({ token: signToken(user), user: safeUser(user) })
})

app.get('/auth/me', authMiddleware, (req, res) => {
  const user = findById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user: safeUser(user), stats: getStudentStats(req.user.id), plans: PLANS })
})

// ─── CONFIG ───────────────────────────────────────────────
app.get('/config', (req, res) => res.json({ CLASS_TOPICS, DIFFICULTY_LABELS, PLANS }))

// ─── ADMIN ROUTES ─────────────────────────────────────────
// GET /admin/stats
app.get('/admin/stats', authMiddleware, adminOnly, (req, res) => {
  const { questions } = require('./data/questions')
  const users = getAll()
  const students = users.filter(u => u.role === 'student')
  const plans = { free: 0, basic: 0, premium: 0 }
  students.forEach(u => { plans[u.subscription?.plan || 'free']++ })

  // Count directly from question data so total always equals sum of per-class counts
  const qByClass = {}
  questions.forEach(q => {
    const cls  = q.class   || 'other'
    const subj = q.subject || 'other'
    const top  = q.topic   || 'other'
    if (!qByClass[cls])       qByClass[cls] = {}
    if (!qByClass[cls][subj]) qByClass[cls][subj] = {}
    qByClass[cls][subj][top] = (qByClass[cls][subj][top] || 0) + 1
  })

  res.json({
    totalStudents: students.length,
    planBreakdown: plans,
    estimatedRevenue: plans.basic * 199 + plans.premium * 499,
    totalQuestions: questions.length,
    questionsByClass: qByClass,
    activeSessions: Object.keys(sessions).filter(k => sessions[k].status === 'active').length
  })
})

// GET /admin/students
app.get('/admin/students', authMiddleware, adminOnly, (req, res) => {
  const users = getAll().filter(u => u.role === 'student')
  const progress = require('./data/progressStore')
  const result = users.map(u => {
    const stats = progress.getStudentStats(u.id)
    return { ...safeUser(u), progressStats: stats }
  })
  res.json(result)
})

// PUT /admin/students/:id/subscription
app.put('/admin/students/:id/subscription', authMiddleware, adminOnly, (req, res) => {
  const { plan } = req.body
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' })
  try { res.json({ user: safeUser(updateSubscription(req.params.id, plan)) })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// POST /admin/questions/upload  — upload PDF, returns parsed draft
app.post('/admin/questions/upload', authMiddleware, adminOnly, upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' })
  try {
    const parsed = await parsePdfToQuestions(req.file.path)
    // Save to pending
    const pending = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pending_questions.json'), 'utf8'))
    const withIds = parsed.map((q, i) => ({ ...q, _pendingId: `pend_${Date.now()}_${i}` }))
    pending.push(...withIds)
    fs.writeFileSync(path.join(__dirname, 'data/pending_questions.json'), JSON.stringify(pending, null, 2))
    // Cleanup temp file
    fs.unlinkSync(req.file.path)
    res.json({ count: parsed.length, questions: withIds })
  } catch (e) {
    res.status(500).json({ error: 'PDF parsing failed: ' + e.message })
  }
})

// GET /admin/questions/pending
app.get('/admin/questions/pending', authMiddleware, adminOnly, (req, res) => {
  const pending = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pending_questions.json'), 'utf8'))
  res.json(pending)
})

// POST /admin/questions/save  — save reviewed+approved questions to custom bank
app.post('/admin/questions/save', authMiddleware, adminOnly, (req, res) => {
  const { questions: toSave, removePendingIds = [] } = req.body
  if (!Array.isArray(toSave) || toSave.length === 0)
    return res.status(400).json({ error: 'No questions to save' })

  // Validate each question has required fields
  for (const q of toSave) {
    if (!q.subject || !q.class || !q.topic || !q.difficulty || !q.question || !q.answer)
      return res.status(400).json({ error: `Question missing required fields: ${JSON.stringify(q).slice(0, 80)}` })
  }

  // Generate clean IDs for saved questions
  const customPath = path.join(__dirname, 'data/custom_questions.json')
  const existing   = JSON.parse(fs.readFileSync(customPath, 'utf8'))
  const cleaned = toSave.map((q, i) => ({
    id:          q.id || `cq_${Date.now()}_${i}`,
    subject:     q.subject,
    class:       String(q.class),
    topic:       q.topic,
    difficulty:  Number(q.difficulty),
    question:    q.question.trim(),
    options:     q.options.map(o => (o || '').trim()),
    answer:      q.answer.trim(),
    explanation: (q.explanation || '').trim()
  }))
  existing.push(...cleaned)
  fs.writeFileSync(customPath, JSON.stringify(existing, null, 2))

  // Remove approved ones from pending
  if (removePendingIds.length > 0) {
    const pendPath = path.join(__dirname, 'data/pending_questions.json')
    const pending  = JSON.parse(fs.readFileSync(pendPath, 'utf8'))
    const updated  = pending.filter(q => !removePendingIds.includes(q._pendingId))
    fs.writeFileSync(pendPath, JSON.stringify(updated, null, 2))
  }

  res.json({ saved: cleaned.length, message: `${cleaned.length} questions added to question bank` })
})

// DELETE /admin/questions/pending/:id — reject a pending question
app.delete('/admin/questions/pending/:id', authMiddleware, adminOnly, (req, res) => {
  const pendPath = path.join(__dirname, 'data/pending_questions.json')
  const pending  = JSON.parse(fs.readFileSync(pendPath, 'utf8'))
  const updated  = pending.filter(q => q._pendingId !== req.params.id)
  fs.writeFileSync(pendPath, JSON.stringify(updated, null, 2))
  res.json({ ok: true })
})

// ─── SESSION ROUTES ───────────────────────────────────────
app.post('/session/start', authMiddleware, (req, res) => {
  const { tenantId='tenant_001', testId='test_1',
          cls, mode, subject, topics, levelsSelected, questionsPerTopic } = req.body
  if (!cls || !mode || !subject || !topics?.length || !levelsSelected?.length || !questionsPerTopic)
    return res.status(400).json({ error: 'cls, mode, subject, topics, levelsSelected, questionsPerTopic required' })

  const user = findById(req.user.id)
  if (!user) return res.status(401).json({ error: 'User not found' })

  // Subscription check
  const limits = getPlanLimits(user.subscription?.plan || 'free')
  if ((user.sessionCount || 0) > 0) {
    const today = new Date().toDateString()
    // Simple daily reset check would need a timestamp per day — skip for POC
  }

  const studentId = req.user.id
  const seenIds   = getSeenIds(studentId, subject)
  const session   = createSession(studentId, tenantId, testId, cls, mode, subject,
                                  topics, levelsSelected, questionsPerTopic, seenIds)
  sessions[session.sessionId] = session
  incrementSessionCount(studentId)

  const nextQ = getNextQuestion(session)
  if (!nextQ) return res.status(400).json({ error: 'No questions found for selected topics/levels.' })

  res.json({ sessionId: session.sessionId, question: nextQ, analytics: computeAnalytics(session) })
})

app.post('/session/:id/answer', authMiddleware, (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.status === 'completed') return res.status(400).json({ error: 'Session already completed' })

  const { questionId, selectedAnswer, timeMs } = req.body
  const result = processAnswer(session, questionId, selectedAnswer, timeMs)

  if (result.needsContinueChoice)
    return res.json({ result, nextQuestion: null, sessionComplete: false, awaitingDecision: true })

  const nextQ = getNextQuestion(session)
  if (!nextQ) {
    session.status = 'completed'
    addSeenIds(session.studentId, session.subject, session.allAnswers.map(a => a.questionId).filter(Boolean))
  }
  res.json({ result, nextQuestion: nextQ, sessionComplete: !nextQ,
             finalAnalytics: !nextQ ? getAllResults(session) : null })
})

app.post('/session/:id/decision', authMiddleware, (req, res) => {
  const session = sessions[req.params.id]
  if (!session) return res.status(404).json({ error: 'Session not found' })
  resolveContinueChoice(session, req.body.choice)
  const nextQ = getNextQuestion(session)
  if (!nextQ) {
    session.status = 'completed'
    addSeenIds(session.studentId, session.subject, session.allAnswers.map(a => a.questionId).filter(Boolean))
  }
  res.json({ nextQuestion: nextQ, sessionComplete: !nextQ,
             finalAnalytics: !nextQ ? getAllResults(session) : null })
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
  addSeenIds(s.studentId, s.subject, s.allAnswers.map(a => a.questionId).filter(Boolean))
  res.json({ message: 'Session stopped', finalAnalytics: getAllResults(s) })
})

app.get('/student/progress', authMiddleware, (req, res) => {
  res.json(getStudentStats(req.user.id))
})

// Ensure upload dir exists
fs.mkdirSync(path.join(__dirname, 'data', 'uploads'), { recursive: true })

app.listen(3001, () => console.log('\nVriseTech API → http://localhost:3001\n'))
