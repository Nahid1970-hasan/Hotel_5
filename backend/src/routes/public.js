const { Router } = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const db = require('../db')
const domain = require('../domain')
const { login, readUser } = require('../auth')
const { problem, send } = require('../http')

const router = Router()
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function hotelProfile() {
  const hotel = domain.settings()
  return {
    name: hotel.name,
    tagline: hotel.tagline,
    description: hotel.description,
    address: hotel.address,
    city: hotel.city,
    country: hotel.country,
    phone: hotel.phone,
    email: hotel.email,
    timezone: hotel.timezone,
    currency: hotel.currency,
    checkInTime: hotel.check_in_time,
    checkOutTime: hotel.check_out_time,
    taxPercent: hotel.tax_percent,
    serviceFeePercent: hotel.service_fee_percent,
    today: db.hotelToday(),
  }
}

router.get('/hotel', wrap((req, res) => {
  send(res, hotelProfile(), 'Hotel profile retrieved')
}))

router.get('/room-types', wrap((req, res) => {
  const rows = db.all(`SELECT * FROM room_types WHERE active = 1 ORDER BY sort_order, id`)
  send(res, rows.map(domain.presentRoomType), 'Room types retrieved')
}))

router.get('/room-types/:slug', wrap((req, res) => {
  const row = domain.roomTypeRow(req.params.slug)
  if (!row || !row.active) throw problem(404, 'Room type was not found', 'NOT_FOUND')
  send(res, domain.presentRoomType(row), 'Room type retrieved')
}))

router.get('/availability', wrap((req, res) => {
  const data = domain.searchAvailability(req.query)
  send(res, data, data.roomTypes.length ? 'Availability retrieved successfully' : 'No rooms are available for that stay')
}))

router.get('/offers', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM offers WHERE active = 1 ORDER BY id DESC`), 'Offers retrieved')
}))

router.get('/facilities', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM facilities ORDER BY sort_order, id`), 'Facilities retrieved')
}))

router.get('/dining', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM dining_venues ORDER BY id`), 'Dining retrieved')
}))

router.get('/experiences', wrap((req, res) => {
  const rows = db.all(`SELECT * FROM experiences WHERE active = 1 ORDER BY id`)
  send(res, rows.map((row) => ({ ...row, price: domain.money(row.price_cents) })), 'Experiences retrieved')
}))

router.get('/gallery', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM gallery_images ORDER BY sort_order, id`), 'Gallery retrieved')
}))

router.get('/destination', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM attractions ORDER BY id`), 'Destination retrieved')
}))

router.get('/reviews', wrap((req, res) => {
  const rows = db.all(
    `SELECT id, guest_name, rating, title, comment, response, created_at
     FROM reviews WHERE moderation_status = 'APPROVED' ORDER BY id DESC`,
  )
  const summary = db.get(
    `SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average
     FROM reviews WHERE moderation_status = 'APPROVED'`,
  )
  send(res, { summary, reviews: rows }, 'Reviews retrieved')
}))

router.get('/faqs', wrap((req, res) => {
  send(res, db.all(`SELECT * FROM faqs ORDER BY sort_order, id`), 'FAQs retrieved')
}))

router.get('/pages/:slug', wrap((req, res) => {
  const page = db.get(`SELECT slug, title, body FROM pages WHERE slug = ?`, [req.params.slug])
  if (!page) throw problem(404, 'Page was not found', 'NOT_FOUND')
  send(res, page, 'Page retrieved')
}))

router.get('/services', wrap((req, res) => {
  const rows = db.all(`SELECT * FROM service_catalog WHERE active = 1 ORDER BY category, name`)
  send(res, rows.map((row) => ({ ...row, price: domain.money(row.price_cents) })), 'Services retrieved')
}))

router.post('/auth/register', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const phone = String(req.body.phone || '').trim()
  if (name.length < 2) throw problem(422, 'Enter your name', 'INVALID')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw problem(422, 'Enter a valid email', 'INVALID')
  if (password.length < 8) throw problem(422, 'Use at least 8 characters for the password', 'INVALID')
  if (db.get(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`, [email])) {
    throw problem(409, 'An account with that email already exists', 'DUPLICATE')
  }
  const data = db.transaction(() => {
    const userId = db.insert(
      `INSERT INTO users (name, email, password_hash, phone, kind) VALUES (?, ?, ?, ?, 'guest')`,
      [name, email, bcrypt.hashSync(password, 10), phone || null],
    )
    const existingGuest = db.get(`SELECT * FROM guests WHERE email = ? COLLATE NOCASE AND user_id IS NULL`, [email])
    if (existingGuest) {
      db.run(`UPDATE guests SET user_id = ?, name = ?, phone = COALESCE(?, phone) WHERE id = ?`, [userId, name, phone || null, existingGuest.id])
    } else {
      db.insert(`INSERT INTO guests (user_id, name, email, phone) VALUES (?, ?, ?, ?)`, [userId, name, email, phone || null])
    }
    return login(email, password, 'guest')
  })
  const session = await data
  send(res, session, 'Account created', 201)
}))

router.post('/auth/login', wrap(async (req, res) => {
  const portal = req.body.portal === 'staff' ? 'staff' : 'guest'
  const session = await login(req.body.email, req.body.password, portal)
  send(res, session, 'Signed in')
}))

router.post('/auth/forgot-password', wrap((req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = db.get(`SELECT * FROM users WHERE email = ? COLLATE NOCASE AND status = 'ACTIVE'`, [email])
  let resetToken = null
  if (user) {
    resetToken = crypto.randomBytes(4).toString('hex')
    db.transaction(() => {
      db.run(`UPDATE users SET reset_token = ?, reset_expires = datetime('now', '+1 hour') WHERE id = ?`, [resetToken, user.id])
      domain.notify({
        userId: user.id,
        type: 'password.reset',
        subject: 'Password reset requested',
        body: `A password reset was requested for ${email}.`,
      })
    })
  }
  const payload = { sent: true }
  if (process.env.NODE_ENV !== 'production' && resetToken) payload.resetToken = resetToken
  send(res, payload, 'If an account exists, a reset code has been prepared')
}))

router.post('/auth/reset-password', wrap((req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const token = String(req.body.token || '').trim()
  const password = String(req.body.password || '')
  if (password.length < 8) throw problem(422, 'Use at least 8 characters for the password', 'INVALID')
  const user = db.get(
    `SELECT * FROM users WHERE email = ? COLLATE NOCASE AND reset_token = ? AND reset_expires > datetime('now')`,
    [email, token],
  )
  if (!user) throw problem(422, 'The reset code is invalid or expired', 'RESET_INVALID')
  db.transaction(() => {
    db.run(`UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?`, [bcrypt.hashSync(password, 10), user.id])
  })
  send(res, { reset: true }, 'Password updated')
}))

router.post('/bookings', wrap((req, res) => {
  const key = req.get('Idempotency-Key')
  if (key) {
    const existing = db.get(`SELECT id FROM bookings WHERE idempotency_key = ?`, [key])
    if (existing) {
      send(res, domain.presentBooking(existing.id), 'Existing booking returned')
      return
    }
  }
  const actor = readUser(req)
  const result = db.transaction(() =>
    domain.createBooking(req.body, {
      source: 'website',
      idempotencyKey: key || null,
      userId: actor?.kind === 'guest' ? actor.id : null,
      actorUserId: actor?.id || null,
    }),
  )
  send(res, result.booking, result.booking.status === 'CONFIRMED' ? 'Reservation confirmed' : 'Room held while payment is completed', 201)
}))

router.get('/bookings/:reference', wrap((req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase()
  if (!email) throw problem(422, 'Enter the email used on the reservation', 'EMAIL_REQUIRED')
  const row = db.get(
    `SELECT b.id FROM bookings b JOIN guests g ON g.id = b.guest_id
     WHERE b.booking_reference = ? AND g.email = ? COLLATE NOCASE`,
    [req.params.reference, email],
  )
  if (!row) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  send(res, domain.presentBooking(row.id), 'Reservation retrieved')
}))

router.post('/payments/confirm', wrap((req, res) => {
  const booking = db.transaction(() => domain.confirmPayment(req.body.paymentId))
  send(res, booking, 'Payment verified and reservation confirmed')
}))

router.post('/payments/webhook', wrap((req, res) => {
  const expected = process.env.WEBHOOK_SECRET || 'horizon-sandbox-webhook'
  if (req.get('x-webhook-secret') !== expected) throw problem(401, 'Webhook signature was rejected', 'WEBHOOK')
  const eventId = String(req.body.providerEventId || '')
  const paymentId = Number(req.body.paymentId)
  const eventType = String(req.body.eventType || '')
  if (!eventId || !paymentId || !eventType) throw problem(422, 'Webhook payload is incomplete', 'INVALID')
  const booking = db.transaction(() => {
    const seen = db.get(`SELECT id FROM payment_events WHERE provider_event_id = ?`, [eventId])
    if (seen) {
      const payment = db.get(`SELECT booking_id FROM payments WHERE id = ?`, [paymentId])
      return domain.presentBooking(payment.booking_id)
    }
    const payment = db.get(`SELECT * FROM payments WHERE id = ?`, [paymentId])
    if (!payment) throw problem(404, 'Payment was not found', 'NOT_FOUND')
    db.insert(
      `INSERT INTO payment_events (payment_id, provider_event_id, event_type) VALUES (?, ?, ?)`,
      [payment.id, eventId, eventType],
    )
    if (eventType === 'payment.succeeded') return domain.confirmPayment(payment.id)
    if (eventType === 'payment.failed') {
      db.run(`UPDATE payments SET status = 'FAILED' WHERE id = ? AND status = 'PENDING'`, [payment.id])
      const current = db.get(`SELECT * FROM bookings WHERE id = ?`, [payment.booking_id])
      if (current.status === 'PENDING') return domain.cancelBooking(current.id, { reason: 'Payment failed', staff: true })
    }
    return domain.presentBooking(payment.booking_id)
  })
  send(res, booking, 'Webhook processed')
}))

router.post('/contact', wrap((req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim()
  const message = String(req.body.message || '').trim()
  if (name.length < 2 || !email.includes('@') || message.length < 8) {
    throw problem(422, 'Name, email, and a short message are required', 'INVALID')
  }
  const id = db.transaction(() =>
    db.insert(
      `INSERT INTO contact_messages (name, email, phone, topic, message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, req.body.phone || null, req.body.topic || 'General', message],
    ),
  )
  send(res, { id }, 'Message received', 201)
}))

module.exports = router
