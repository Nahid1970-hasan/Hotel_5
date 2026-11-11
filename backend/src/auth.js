const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')
const { problem } = require('./http')

const secret = process.env.JWT_SECRET || 'grand-horizon-dev-secret'
const attempts = new Map()

function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const recent = (attempts.get(key) || []).filter((time) => now - time < windowMs)
  if (recent.length >= max) return false
  recent.push(now)
  attempts.set(key, recent)
  return true
}

function publicUser(user) {
  const roles = db.all(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [user.id],
  ).map((row) => row.name)
  const permissions = db.all(
    `SELECT DISTINCT p.permission_key FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [user.id],
  ).map((row) => row.permission_key)
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    kind: user.kind,
    status: user.status,
    roles,
    permissions,
  }
}

const STAFF_LOGIN_ROLES = ['Super Admin', 'Front Desk']

function sign(user) {
  return jwt.sign({ sub: user.id, kind: user.kind }, secret, { expiresIn: '12h' })
}

function canSignIn(user) {
  return publicUser(user).roles.some((role) => STAFF_LOGIN_ROLES.includes(role))
}

async function login(email, password, portal) {
  const key = `login:${String(email || '').toLowerCase()}`
  if (!rateLimit(key, 8, 15 * 60 * 1000)) throw problem(429, 'Too many sign-in attempts. Wait and try again.', 'RATE_LIMIT')
  const loginId = String(email || '').trim()
  const user = db.get(
    `SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE`,
    [loginId, loginId],
  )
  if (!user || user.status !== 'ACTIVE') throw problem(401, 'Username or password is incorrect', 'AUTH')
  const match = await bcrypt.compare(String(password || ''), user.password_hash)
  if (!match) throw problem(401, 'Username or password is incorrect', 'AUTH')
  if (portal === 'staff' && user.kind !== 'staff') throw problem(403, 'This sign-in is for hotel staff', 'PORTAL')
  if (portal === 'guest' && user.kind !== 'guest') throw problem(403, 'Use the staff sign-in for this account', 'PORTAL')
  if (portal === 'staff' && !canSignIn(user)) throw problem(403, 'Only Super Admin and Front Desk can sign in', 'PORTAL')
  const profile = publicUser(user)
  return { token: sign(user), user: profile }
}

function readUser(req) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  try {
    const payload = jwt.verify(token, secret)
    const user = db.get('SELECT * FROM users WHERE id = ? AND status = ?', [payload.sub, 'ACTIVE'])
    return user ? publicUser(user) : null
  } catch (error) {
    return null
  }
}

function requireUser(kind) {
  return (req, res, next) => {
    const user = readUser(req)
    if (!user) return next(problem(401, 'Sign in to continue', 'AUTH'))
    if (kind && user.kind !== kind) return next(problem(403, 'You cannot open this area', 'FORBIDDEN'))
    if (kind === 'staff' && !user.roles.some((role) => STAFF_LOGIN_ROLES.includes(role))) {
      return next(problem(403, 'Only Super Admin and Front Desk can sign in', 'FORBIDDEN'))
    }
    req.user = user
    return next()
  }
}

function requirePermission(...keys) {
  return (req, res, next) => {
    if (req.user.roles.includes('Super Admin')) return next()
    const allowed = keys.some((key) => req.user.permissions.includes(key))
    if (!allowed) return next(problem(403, 'Your role cannot perform this action', 'FORBIDDEN'))
    return next()
  }
}

module.exports = { login, publicUser, readUser, requireUser, requirePermission, rateLimit }
