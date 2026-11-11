const fs = require('fs')
const path = require('path')
const initSqlJs = require('sql.js')

const root = path.join(__dirname, '..', '..')
const dbFile = path.join(root, 'database', 'grand-horizon.sqlite')
const schemaFile = path.join(root, 'database', 'schema.sql')
const wasmFile = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

let db

function persist() {
  const data = db.export()
  fs.mkdirSync(path.dirname(dbFile), { recursive: true })
  fs.writeFileSync(dbFile, Buffer.from(data))
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function get(sql, params = []) {
  return all(sql, params)[0] || null
}

function run(sql, params = []) {
  db.run(sql, params)
}

function insert(sql, params = []) {
  db.run(sql, params)
  return get('SELECT last_insert_rowid() AS id').id
}

function transaction(fn) {
  db.run('BEGIN')
  try {
    const result = fn()
    db.run('COMMIT')
    persist()
    return result
  } catch (error) {
    try {
      db.run('ROLLBACK')
    } catch (rollbackError) {
      /* the transaction may already be closed */
    }
    throw error
  }
}

function hotelToday() {
  const settings = get('SELECT timezone FROM hotel_settings WHERE id = 1')
  const zone = settings?.timezone || 'Asia/Dhaka'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const pick = (type) => parts.find((part) => part.type === type).value
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function eachNight(checkIn, checkOut) {
  const nights = []
  let cursor = checkIn
  while (cursor < checkOut) {
    nights.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return nights
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return value
}

async function init(seed) {
  const SQL = await initSqlJs({ locateFile: () => wasmFile })
  if (fs.existsSync(dbFile)) {
    db = new SQL.Database(fs.readFileSync(dbFile))
  } else {
    db = new SQL.Database()
    db.exec(fs.readFileSync(schemaFile, 'utf8'))
    await seed({ all, get, run, insert, hotelToday, addDays, eachNight, parseDate })
    persist()
  }
  ensureUsernames()
  db.run('PRAGMA foreign_keys = ON')
}

function ensureUsernames() {
  const columns = all('PRAGMA table_info(users)').map((column) => column.name)
  let changed = false
  if (!columns.includes('username')) {
    run('ALTER TABLE users ADD COLUMN username TEXT')
    changed = true
  }
  const users = all('SELECT id, email, username FROM users')
  for (const user of users) {
    if (user.username) continue
    const raw = String(user.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '')
    const base = raw || `user${user.id}`
    let candidate = base
    let suffix = 1
    while (get('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?', [candidate, user.id])) {
      candidate = `${base}${suffix++}`
    }
    run('UPDATE users SET username = ? WHERE id = ?', [candidate, user.id])
    changed = true
  }
  run('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)')
  const hasan = get(`SELECT id, email FROM users WHERE username = 'hasan' COLLATE NOCASE`)
  if (hasan && String(hasan.email).toLowerCase() !== 'hasan@gmail.com') {
    const taken = get(`SELECT id FROM users WHERE email = 'hasan@gmail.com' COLLATE NOCASE AND id != ?`, [hasan.id])
    if (!taken) {
      run(`UPDATE users SET email = ? WHERE id = ?`, ['hasan@gmail.com', hasan.id])
      changed = true
    }
  }
  const amira = get(`SELECT id, email FROM users WHERE username = 'amira.rahman' COLLATE NOCASE`)
  if (amira && String(amira.email).toLowerCase() !== 'amira@gmail.com') {
    const taken = get(`SELECT id FROM users WHERE email = 'amira@gmail.com' COLLATE NOCASE AND id != ?`, [amira.id])
    if (!taken) {
      run(`UPDATE users SET email = ? WHERE id = ?`, ['amira@gmail.com', amira.id])
      changed = true
    }
  }
  if (amira) {
    const frontDesk = get(`SELECT id FROM roles WHERE name = ?`, ['Front Desk'])
    const currentRole = get(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [amira.id],
    )
    if (frontDesk && (!currentRole || currentRole.name !== 'Front Desk')) {
      run(`DELETE FROM user_roles WHERE user_id = ?`, [amira.id])
      run(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [amira.id, frontDesk.id])
      changed = true
    }
  }
  if (changed) persist()
}

module.exports = {
  init,
  all,
  get,
  run,
  insert,
  transaction,
  persist,
  hotelToday,
  addDays,
  eachNight,
  parseDate,
}
