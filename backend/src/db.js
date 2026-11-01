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
  db.run('PRAGMA foreign_keys = ON')
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
