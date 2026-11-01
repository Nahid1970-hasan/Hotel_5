const { Router } = require('express')
const db = require('../db')
const domain = require('../domain')
const { requireUser } = require('../auth')
const { problem, send } = require('../http')

const router = Router()
router.use('/me', requireUser('guest'))
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function guestFor(user) {
  const guest = db.get(`SELECT * FROM guests WHERE user_id = ?`, [user.id])
  if (!guest) throw problem(404, 'Guest profile was not found', 'NOT_FOUND')
  return guest
}

function ownBooking(user, id) {
  const guest = guestFor(user)
  const booking = db.get(`SELECT * FROM bookings WHERE id = ? AND guest_id = ?`, [Number(id), guest.id])
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  return booking
}

router.get('/me', wrap((req, res) => {
  const guest = guestFor(req.user)
  send(res, { user: req.user, guest }, 'Profile retrieved')
}))

router.patch('/me', wrap((req, res) => {
  const guest = guestFor(req.user)
  const name = String(req.body.name || guest.name).trim()
  const phone = req.body.phone == null ? guest.phone : String(req.body.phone).trim()
  const nationality = req.body.nationality == null ? guest.nationality : String(req.body.nationality).trim()
  const preferences = req.body.preferences == null ? guest.preferences : String(req.body.preferences).trim()
  if (name.length < 2) throw problem(422, 'Enter your name', 'INVALID')
  db.transaction(() => {
    db.run(`UPDATE guests SET name = ?, phone = ?, nationality = ?, preferences = ? WHERE id = ?`, [name, phone || null, nationality || null, preferences || null, guest.id])
    db.run(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [name, phone || null, req.user.id])
  })
  send(res, db.get(`SELECT id, name, email, phone, nationality, preferences FROM guests WHERE id = ?`, [guest.id]), 'Profile updated')
}))

router.get('/me/bookings', wrap((req, res) => {
  const guest = guestFor(req.user)
  const rows = db.all(`SELECT id FROM bookings WHERE guest_id = ? ORDER BY check_in DESC`, [guest.id])
  send(res, rows.map((row) => domain.presentBooking(row.id)), 'Bookings retrieved')
}))

router.get('/me/bookings/:id', wrap((req, res) => {
  const booking = ownBooking(req.user, req.params.id)
  send(res, domain.presentBooking(booking.id), 'Booking retrieved')
}))

router.post('/me/bookings/:id/cancel', wrap((req, res) => {
  const booking = ownBooking(req.user, req.params.id)
  const updated = db.transaction(() => domain.cancelBooking(booking.id, { actorUserId: req.user.id, reason: req.body.reason || 'Guest cancellation' }))
  send(res, updated, 'Reservation cancelled')
}))

router.post('/me/bookings/:id/service-requests', wrap((req, res) => {
  const booking = ownBooking(req.user, req.params.id)
  const serviceType = String(req.body.serviceType || '').trim()
  const details = String(req.body.details || '').trim()
  if (!serviceType || details.length < 3) throw problem(422, 'Choose a request and add a short note', 'INVALID')
  const id = db.transaction(() =>
    db.insert(
      `INSERT INTO service_requests (booking_id, guest_id, service_type, details, scheduled_at) VALUES (?, ?, ?, ?, ?)`,
      [booking.id, booking.guest_id, serviceType, details, req.body.scheduledAt || null],
    ),
  )
  send(res, db.get(`SELECT * FROM service_requests WHERE id = ?`, [id]), 'Request sent', 201)
}))

router.post('/me/bookings/:id/reviews', wrap((req, res) => {
  const booking = ownBooking(req.user, req.params.id)
  if (booking.status !== 'CHECKED_OUT') throw problem(422, 'Reviews open after checkout', 'REVIEW_NOT_READY')
  const existing = db.get(`SELECT id FROM reviews WHERE booking_id = ?`, [booking.id])
  if (existing) throw problem(409, 'A review is already on file for this stay', 'DUPLICATE')
  const rating = Number(req.body.rating)
  const comment = String(req.body.comment || '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw problem(422, 'Choose a rating from 1 to 5', 'INVALID')
  if (comment.length < 8) throw problem(422, 'Write a short comment', 'INVALID')
  const guest = guestFor(req.user)
  const id = db.transaction(() =>
    db.insert(
      `INSERT INTO reviews (booking_id, guest_id, guest_name, rating, title, comment, moderation_status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [booking.id, guest.id, guest.name, rating, req.body.title || null, comment],
    ),
  )
  send(res, db.get(`SELECT * FROM reviews WHERE id = ?`, [id]), 'Review submitted for moderation', 201)
}))

module.exports = router
