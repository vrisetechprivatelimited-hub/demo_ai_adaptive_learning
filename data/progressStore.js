// Tracks student progress: seen questions + session history
// student_progress.json  — seen question IDs per subject
// session_history.json   — completed session summaries

const fs   = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'student_progress.json')

function load() {
  if (!fs.existsSync(FILE)) return {}
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

// Returns a Set of question IDs this student has already seen for a subject
function getSeenIds(studentId, subject) {
  const data = load()
  const ids = data[studentId]?.[subject]?.seenIds || []
  return new Set(ids)
}

// Adds new question IDs to the student's seen list for a subject
function addSeenIds(studentId, subject, questionIds) {
  if (!questionIds || questionIds.length === 0) return
  const data = load()
  if (!data[studentId]) data[studentId] = {}
  if (!data[studentId][subject]) data[studentId][subject] = { seenIds: [], lastReset: null }

  const existing = new Set(data[studentId][subject].seenIds)
  questionIds.forEach(id => existing.add(id))
  data[studentId][subject].seenIds = [...existing]
  save(data)
}

// How many unique questions has the student seen for this subject
function seenCount(studentId, subject) {
  return getSeenIds(studentId, subject).size
}

// Reset (wipe) seen history — e.g. when student has seen everything
function resetProgress(studentId, subject) {
  const data = load()
  if (data[studentId]?.[subject]) {
    data[studentId][subject] = { seenIds: [], lastReset: new Date().toISOString() }
    save(data)
  }
}

// Get full stats for a student
function getStudentStats(studentId) {
  const data = load()
  const entry = data[studentId] || {}
  const stats = {}
  for (const [subject, val] of Object.entries(entry)) {
    stats[subject] = { seenCount: (val.seenIds || []).length, lastReset: val.lastReset }
  }
  return stats
}

// ─── Session History ──────────────────────────────────────
const HIST_FILE = path.join(__dirname, 'session_history.json')

function loadHistory() {
  if (!fs.existsSync(HIST_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(HIST_FILE, 'utf8')) } catch { return {} }
}

function saveHistory(data) {
  fs.writeFileSync(HIST_FILE, JSON.stringify(data, null, 2))
}

// Save a completed session summary for a student
function addSessionResult(studentId, summary) {
  const hist = loadHistory()
  if (!hist[studentId]) hist[studentId] = []
  hist[studentId].unshift(summary)       // newest first
  if (hist[studentId].length > 200) hist[studentId] = hist[studentId].slice(0, 200)
  saveHistory(hist)
}

// Get all session summaries for a student
function getSessionHistory(studentId) {
  return (loadHistory()[studentId] || [])
}

module.exports = { getSeenIds, addSeenIds, seenCount, resetProgress, getStudentStats,
                   addSessionResult, getSessionHistory }
