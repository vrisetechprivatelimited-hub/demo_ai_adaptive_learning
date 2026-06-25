const fs     = require('fs')
const path   = require('path')
const bcrypt = require('bcryptjs')

const USERS_FILE = path.join(__dirname, '../data/users.json')

const PLANS = {
  free:    { id:'free',    name:'Free',    price:0,   sessionsPerDay:2,  questionsPerSession:10, trialDays:0  },
  basic:   { id:'basic',   name:'Basic',   price:199, sessionsPerDay:5,  questionsPerSession:30, trialDays:0  },
  premium: { id:'premium', name:'Premium', price:499, sessionsPerDay:99, questionsPerSession:99, trialDays:0  },
}

function load() {
  if (!fs.existsSync(USERS_FILE)) return []
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) } catch { return [] }
}
function save(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)) }

function findByEmail(email) { return load().find(u => u.email === email.toLowerCase().trim()) }
function findById(id)       { return load().find(u => u.id === id) }
function getAll()           { return load() }

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function validateMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\s|-/g, ''))
}

function createUser(name, email, mobile, password, plan = 'free', role = 'student') {
  if (!validateEmail(email))  throw new Error('Invalid email address')
  if (!validateMobile(mobile)) throw new Error('Invalid mobile number (must be 10 digits, start with 6-9)')
  if (password.length < 6)    throw new Error('Password must be at least 6 characters')

  const users = load()
  const normalEmail = email.toLowerCase().trim()
  if (users.find(u => u.email === normalEmail)) throw new Error('Email already registered')

  const now = new Date().toISOString()
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name: name.trim(),
    email: normalEmail,
    mobile: mobile.replace(/\s|-/g, ''),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    subscription: {
      plan,
      startDate: now,
      expiryDate: plan === 'free' ? null : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
      status: 'active'
    },
    sessionCount: 0,
    createdAt: now
  }
  users.push(user)
  save(users)
  return user
}

function updateSubscription(userId, plan) {
  const users = load()
  const u = users.find(u => u.id === userId)
  if (!u) throw new Error('User not found')
  u.subscription = {
    plan,
    startDate: new Date().toISOString(),
    expiryDate: plan === 'free' ? null : new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    status: 'active'
  }
  save(users)
  return u
}

function incrementSessionCount(userId) {
  const users = load()
  const u = users.find(u => u.id === userId)
  if (u) { u.sessionCount = (u.sessionCount || 0) + 1; save(users) }
}

function verifyPassword(user, password) { return bcrypt.compareSync(password, user.passwordHash) }

function getPlanLimits(plan) { return PLANS[plan] || PLANS.free }

function safeUser(user) {
  const { passwordHash, ...safe } = user
  return safe
}

module.exports = { findByEmail, findById, getAll, createUser, verifyPassword,
                   updateSubscription, incrementSessionCount, getPlanLimits,
                   safeUser, PLANS, validateEmail, validateMobile }
