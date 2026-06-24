const { questions } = require('../data/questions')

const LEVEL_DOWN_STREAK = 2
const MASTERY_THRESHOLD = 0.70

function speedThreshold(level, maxLevel) {
  const pct = level / maxLevel
  if (pct <= 0.4) return 15000
  if (pct <= 0.7) return 25000
  return 40000
}

function createSession(studentId, tenantId, testId, cls, mode, subject, topics, levelsSelected, questionsPerTopic) {
  const minLevel = Math.min(...levelsSelected)
  const maxLevel = Math.max(...levelsSelected)

  const topicPools = {}
  topics.forEach(topic => {
    topicPools[topic] = {}
    levelsSelected.forEach(level => {
      topicPools[topic][level] = questions
        .filter(q => q.subject === subject && q.class === cls && q.topic === topic && q.difficulty === level)
        .sort(() => Math.random() - 0.5)
    })
  })

  const topicState = {}
  topics.forEach(t => {
    topicState[t] = {
      currentLevel: minLevel, minLevel, maxLevel,
      correctStreak: 0, wrongStreak: 0,
      totalAnswered: 0, totalCorrect: 0,
      questionBudget: questionsPerTopic,
      askedIds: new Set(),
      history: [], status: 'active', masteredEarly: false
    }
  })

  return {
    sessionId: `sess_${Date.now()}`,
    studentId, tenantId, testId, cls, mode, subject, topics, levelsSelected, questionsPerTopic,
    startedAt: Date.now(), totalAnswered: 0, totalCorrect: 0,
    topicPools, topicState, currentTopicIndex: 0,
    status: 'active', allAnswers: [], pendingDecision: null
  }
}

function _currentTopic(session) { return session.topics[session.currentTopicIndex] }

// ─────────────────────────────────────────────────────────────
//  ONLY recycle at the topic's MAX level, and ONLY once mastery
//  has actually been achieved there. Never recycle mid-range
//  levels — if a mid level runs dry, that is a content gap, and
//  the engine should fall back by searching adjacent levels
//  WITHOUT silently looping on one question forever.
// ─────────────────────────────────────────────────────────────
function getNextQuestion(session) {
  if (session.status === 'completed') return null
  if (session.pendingDecision) return null

  let topic = _currentTopic(session)
  if (!topic) { session.status = 'completed'; return null }
  let state = session.topicState[topic]

  while (state.status !== 'active') {
    session.currentTopicIndex++
    topic = _currentTopic(session)
    if (!topic) { session.status = 'completed'; return null }
    state = session.topicState[topic]
  }

  if (state.totalAnswered >= state.questionBudget) {
    state.status = 'budget_reached'
    return getNextQuestion(session)
  }

  const pool = session.topicPools[topic][state.currentLevel] || []
  let candidates = pool.filter(q => !state.askedIds.has(q.id))
  let recycled = false
  let servedLevel = state.currentLevel   // the level of THIS question only — may differ from state.currentLevel if borrowed

  if (candidates.length === 0) {
    if (state.masteredEarly && state.currentLevel === state.maxLevel) {
      // Legitimate recycle: only when mastery already confirmed at top level
      candidates = pool
      recycled = true
      servedLevel = state.currentLevel
    } else {
      // Borrow a question from the nearest level with fresh content.
      // IMPORTANT: this does NOT change state.currentLevel — that field
      // is owned exclusively by the streak logic in processAnswer.
      // Borrowing is a one-off substitution due to content scarcity.
      let found = false
      for (let offset = 1; offset <= (state.maxLevel - state.minLevel); offset++) {
        const lower = state.currentLevel - offset
        const upper = state.currentLevel + offset
        if (lower >= state.minLevel) {
          const alt = (session.topicPools[topic][lower] || []).filter(q => !state.askedIds.has(q.id))
          if (alt.length > 0) { candidates = alt; servedLevel = lower; found = true; break }
        }
        if (upper <= state.maxLevel) {
          const alt = (session.topicPools[topic][upper] || []).filter(q => !state.askedIds.has(q.id))
          if (alt.length > 0) { candidates = alt; servedLevel = upper; found = true; break }
        }
      }
      if (!found) candidates = []
    }
  }

  if (candidates.length === 0) {
    state.status = 'budget_reached'
    return getNextQuestion(session)
  }

  const q = candidates[Math.floor(Math.random() * candidates.length)]
  if (!recycled) state.askedIds.add(q.id)
  session.currentQuestion = { ...q, askedAt: Date.now() }

  return {
    id: q.id, subject: q.subject, topic: q.topic,
    difficulty: q.difficulty, question: q.question, options: q.options,
    questionNumber: state.totalAnswered + 1, topicBudget: state.questionBudget,
    minLevel: state.minLevel, maxLevel: state.maxLevel,
    recycled, borrowedFromLevel: servedLevel !== state.currentLevel ? servedLevel : null,
    topicIndex: session.currentTopicIndex + 1, totalTopics: session.topics.length
  }
}

function tieredExplanation(q) {
  const base = q.explanation || ''
  const maxLvl = 5
  const lvl = q.difficulty
  if (lvl <= Math.ceil(maxLvl * 0.4)) return `Step-by-step: ${base}`
  return base
}

function processAnswer(session, questionId, selectedAnswer, timeMs) {
  const q = questions.find(x => x.id === questionId)
  if (!q) throw new Error(`Question ${questionId} not found`)

  const correct = q.answer === selectedAnswer
  const state = session.topicState[q.topic]
  const levelBefore = state.currentLevel

  state.totalAnswered++
  session.totalAnswered++
  if (correct) session.totalCorrect++

  let levelChange = 0
  let speedHint = null
  let masteryEvent = null
  const threshold = speedThreshold(q.difficulty, state.maxLevel)

  if (correct) {
    state.totalCorrect++
    state.wrongStreak = 0

    if (timeMs <= threshold) {
      speedHint = 'fast'
      if (state.currentLevel < state.maxLevel) {
        state.currentLevel++
        levelChange = +1
      } else if (!state.masteredEarly) {
        masteryEvent = 'top_level_mastered'
      }
    } else {
      speedHint = 'slow'
      // correct but slow -> NO level change, repeat at same level
    }
  } else {
    state.wrongStreak++
    if (state.wrongStreak >= LEVEL_DOWN_STREAK) {
      if (state.currentLevel > state.minLevel && !state.masteredEarly) {
        state.currentLevel--
        levelChange = -1
      }
      state.wrongStreak = 0
    }
  }

  // Sanity guard: level must never move by more than 1 step from before this answer
  if (Math.abs(state.currentLevel - levelBefore) > 1) {
    throw new Error(`INTEGRITY BUG: level jumped from ${levelBefore} to ${state.currentLevel} in one answer`)
  }

  state.history.push({ questionId, correct, timeMs, difficulty: q.difficulty, levelAfter: state.currentLevel })

  session.allAnswers.push({
    questionNumber: session.totalAnswered, topic: q.topic, difficulty: q.difficulty,
    question: q.question, options: q.options, correctAnswer: q.answer,
    selectedAnswer, correct, timeMs, explanation: tieredExplanation(q)
  })

  const topicAccuracy = state.totalAnswered > 0 ? state.totalCorrect / state.totalAnswered : 0
  let needsContinueChoice = false

  if (masteryEvent === 'top_level_mastered') {
    state.masteredEarly = true
    if (session.mode === 'dpp') {
      needsContinueChoice = true
      session.pendingDecision = { topic: q.topic, reason: 'mastery',
        message: `You answered the hardest level correctly and quickly on "${q.topic}" — strong mastery. Continue with more questions on this topic, or move to the next one?` }
    }
  }

  if (state.totalAnswered >= state.questionBudget && !needsContinueChoice) {
    state.status = 'budget_reached'
  }

  return {
    correct, correctAnswer: q.answer, explanation: tieredExplanation(q),
    levelChange, newLevel: state.currentLevel, maxLevel: state.maxLevel,
    speedHint, fastThresholdSec: Math.round(threshold/1000),
    masteryEvent, needsContinueChoice,
    topicAccuracy: Math.round(topicAccuracy * 100),
    topicComplete: state.status !== 'active',
    analytics: computeAnalytics(session)
  }
}

function resolveContinueChoice(session, choice) {
  if (!session.pendingDecision) return { error: 'No pending decision' }
  const topic = session.pendingDecision.topic
  const state = session.topicState[topic]
  session.pendingDecision = null
  if (choice === 'end') state.status = 'mastered_early'
  return { topicEnded: choice === 'end' }
}

function computeAnalytics(session) {
  const overall = session.totalAnswered === 0 ? 0 : Math.round((session.totalCorrect / session.totalAnswered) * 100)
  const topicBreakdown = {}
  for (const [topic, s] of Object.entries(session.topicState)) {
    if (!s.totalAnswered) continue
    const acc = s.totalCorrect / s.totalAnswered
    topicBreakdown[topic] = {
      totalAnswered: s.totalAnswered, totalCorrect: s.totalCorrect,
      accuracy: Math.round(acc * 100), currentLevel: s.currentLevel,
      minLevel: s.minLevel, maxLevel: s.maxLevel, masteredEarly: s.masteredEarly,
      status: acc >= 0.75 ? 'strong' : acc < 0.4 ? 'weak' : 'average'
    }
  }
  return {
    overallAccuracy: overall, totalAnswered: session.totalAnswered, totalCorrect: session.totalCorrect,
    topicBreakdown,
    weakTopics: Object.entries(topicBreakdown).filter(([,v])=>v.status==='weak').map(([k])=>k),
    strongTopics: Object.entries(topicBreakdown).filter(([,v])=>v.status==='strong').map(([k])=>k),
    sessionDurationSec: Math.round((Date.now()-session.startedAt)/1000)
  }
}

function getAllResults(session) {
  return { ...computeAnalytics(session), allAnswers: session.allAnswers, mode: session.mode, subject: session.subject }
}

module.exports = { createSession, getNextQuestion, processAnswer, resolveContinueChoice, computeAnalytics, getAllResults }
