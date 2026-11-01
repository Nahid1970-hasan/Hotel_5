export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const keys = { guest: 'gh_guest_token', staff: 'gh_staff_token' }

export function token(kind) {
  return localStorage.getItem(keys[kind] || keys.guest)
}

export function setToken(kind, value) {
  const key = keys[kind] || keys.guest
  if (value) localStorage.setItem(key, value)
  else localStorage.removeItem(key)
}

export async function api(path, { method = 'GET', body, auth, headers } = {}) {
  const requestHeaders = { ...(headers || {}) }
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'
  if (auth && token(auth)) requestHeaders.Authorization = `Bearer ${token(auth)}`
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({ success: false, message: 'The server returned an unreadable response' }))
  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || 'Request failed', response.status, payload)
  }
  return payload
}

export function money(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount || 0))
}

export function prettyDate(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

export function nightCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const [ay, am, ad] = checkIn.split('-').map(Number)
  const [by, bm, bd] = checkOut.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}
