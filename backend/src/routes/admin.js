const { Router } = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const domain = require('../domain')
const { requireUser, requirePermission } = require('../auth')
const { problem, send } = require('../http')

const router = Router()
router.use(requireUser('staff'))
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function can(user, key) {
  return user.roles.includes('Super Admin') || user.permissions.includes(key)
}

router.get('/me', wrap((req, res) => send(res, req.user, 'Staff profile retrieved')))

router.get('/dashboard', wrap((req, res) => {
  const data = domain.dashboard()
  if (!can(req.user, 'report.finance')) data.monthRevenue = null
  send(res, data, 'Dashboard retrieved')
}))

router.get('/room-types', requirePermission('room.manage', 'booking.read'), wrap((req, res) => {
  const rows = db.all(`SELECT * FROM room_types ORDER BY sort_order, id`)
  send(res, rows.map(domain.presentRoomType), 'Room types retrieved')
}))

router.post('/room-types', requirePermission('room.manage'), wrap((req, res) => {
  const name = String(req.body.name || '').trim()
  const price = Number(req.body.basePrice)
  if (name.length < 2 || !(price > 0)) throw problem(422, 'Name and a nightly price are required', 'INVALID')
  const slug = slugify(req.body.slug || name)
  if (db.get(`SELECT id FROM room_types WHERE slug = ?`, [slug])) throw problem(409, 'That room slug already exists', 'DUPLICATE')
  const id = db.transaction(() => {
    const roomTypeId = db.insert(
      `INSERT INTO room_types (
        name, slug, summary, description, capacity_adults, capacity_children, bed_config, size_sqm,
        view_name, category, base_price_cents, currency, accessibility, active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?)`,
      [
        name,
        slug,
        req.body.summary || '',
        req.body.description || '',
        Number(req.body.capacityAdults || 2),
        Number(req.body.capacityChildren || 0),
        req.body.bedConfig || '',
        Number(req.body.sizeSqm || 0),
        req.body.view || '',
        req.body.category || 'Room',
        domain.cents(price),
        req.body.accessibility || '',
        req.body.active === false ? 0 : 1,
        Number(req.body.sortOrder || 0),
      ],
    )
    String(req.body.imageUrl || '').trim() &&
      db.insert(`INSERT INTO room_images (room_type_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, 0)`, [
        roomTypeId,
        req.body.imageUrl.trim(),
        req.body.imageAlt || name,
      ])
    domain.audit(req.user.id, 'room_type.create', 'room_type', roomTypeId, null, { name })
    return roomTypeId
  })
  send(res, domain.presentRoomType(db.get(`SELECT * FROM room_types WHERE id = ?`, [id])), 'Room type created', 201)
}))

router.patch('/room-types/:id', requirePermission('room.manage'), wrap((req, res) => {
  const current = db.get(`SELECT * FROM room_types WHERE id = ?`, [req.params.id])
  if (!current) throw problem(404, 'Room type was not found', 'NOT_FOUND')
  const name = req.body.name == null ? current.name : String(req.body.name).trim()
  db.transaction(() => {
    db.run(
      `UPDATE room_types SET name = ?, summary = ?, description = ?, capacity_adults = ?, capacity_children = ?,
        bed_config = ?, size_sqm = ?, view_name = ?, category = ?, base_price_cents = ?, accessibility = ?, active = ?
       WHERE id = ?`,
      [
        name,
        req.body.summary == null ? current.summary : req.body.summary,
        req.body.description == null ? current.description : req.body.description,
        req.body.capacityAdults == null ? current.capacity_adults : Number(req.body.capacityAdults),
        req.body.capacityChildren == null ? current.capacity_children : Number(req.body.capacityChildren),
        req.body.bedConfig == null ? current.bed_config : req.body.bedConfig,
        req.body.sizeSqm == null ? current.size_sqm : Number(req.body.sizeSqm),
        req.body.view == null ? current.view_name : req.body.view,
        req.body.category == null ? current.category : req.body.category,
        req.body.basePrice == null ? current.base_price_cents : domain.cents(req.body.basePrice),
        req.body.accessibility == null ? current.accessibility : req.body.accessibility,
        req.body.active == null ? current.active : req.body.active ? 1 : 0,
        current.id,
      ],
    )
    domain.audit(req.user.id, 'room_type.update', 'room_type', current.id, { name: current.name }, { name })
  })
  send(res, domain.presentRoomType(db.get(`SELECT * FROM room_types WHERE id = ?`, [current.id])), 'Room type updated')
}))

router.get('/rooms', requirePermission('room.manage', 'booking.read', 'ops.manage'), wrap((req, res) => {
  const rows = db.all(
    `SELECT r.*, t.name AS room_type_name, t.slug AS room_type_slug
     FROM rooms r JOIN room_types t ON t.id = r.room_type_id
     ORDER BY r.room_number`,
  )
  send(res, rows, 'Rooms retrieved')
}))

router.post('/rooms', requirePermission('room.manage'), wrap((req, res) => {
  const roomNumber = String(req.body.roomNumber || '').trim()
  const roomTypeId = Number(req.body.roomTypeId)
  if (!roomNumber || !roomTypeId) throw problem(422, 'Room number and room type are required', 'INVALID')
  if (db.get(`SELECT id FROM rooms WHERE room_number = ?`, [roomNumber])) throw problem(409, 'That room number already exists', 'DUPLICATE')
  const id = db.transaction(() => {
    const roomId = db.insert(
      `INSERT INTO rooms (room_number, room_type_id, floor, wing, operational_status, accessible, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [roomNumber, roomTypeId, req.body.floor || '', req.body.wing || 'Main', req.body.operationalStatus || 'READY', req.body.accessible ? 1 : 0, req.body.notes || null],
    )
    domain.audit(req.user.id, 'room.create', 'room', roomId, null, { roomNumber })
    return roomId
  })
  send(res, db.get(`SELECT * FROM rooms WHERE id = ?`, [id]), 'Room created', 201)
}))

router.patch('/rooms/:id', requirePermission('room.manage', 'ops.manage'), wrap((req, res) => {
  const room = db.get(`SELECT * FROM rooms WHERE id = ?`, [req.params.id])
  if (!room) throw problem(404, 'Room was not found', 'NOT_FOUND')
  const status = req.body.operationalStatus || room.operational_status
  const allowed = ['READY', 'DIRTY', 'CLEANING', 'INSPECTING', 'OUT_OF_SERVICE']
  if (!allowed.includes(status)) throw problem(422, 'Room status is not valid', 'INVALID')
  if (status !== room.operational_status && !can(req.user, 'room.manage') && !can(req.user, 'ops.manage')) {
    throw problem(403, 'Your role cannot change room status', 'FORBIDDEN')
  }
  db.transaction(() => {
    db.run(
      `UPDATE rooms SET operational_status = ?, floor = ?, wing = ?, notes = ?, accessible = ? WHERE id = ?`,
      [
        status,
        req.body.floor == null ? room.floor : req.body.floor,
        req.body.wing == null ? room.wing : req.body.wing,
        req.body.notes == null ? room.notes : req.body.notes,
        req.body.accessible == null ? room.accessible : req.body.accessible ? 1 : 0,
        room.id,
      ],
    )
    domain.audit(req.user.id, 'room.update', 'room', room.id, { status: room.operational_status }, { status })
  })
  send(res, db.get(`SELECT * FROM rooms WHERE id = ?`, [room.id]), 'Room updated')
}))

router.get('/inventory', requirePermission('room.manage', 'booking.read'), wrap((req, res) => {
  domain.releaseExpiredHolds()
  const start = db.parseDate(req.query.from) || db.hotelToday()
  const end = db.parseDate(req.query.to) || db.addDays(start, 13)
  const dates = db.eachNight(start, db.addDays(end, 1))
  const types = db.all(`SELECT * FROM room_types WHERE active = 1 ORDER BY sort_order`)
  send(res, {
    from: start,
    to: end,
    dates,
    roomTypes: types.map((type) => ({
      id: type.id,
      name: type.name,
      sellable: db.get(`SELECT COUNT(*) AS count FROM rooms WHERE room_type_id = ? AND operational_status != 'OUT_OF_SERVICE'`, [type.id]).count,
      nights: dates.map((date) => ({
        date,
        available: domain.availableQuantity(type.id, date, db.addDays(date, 1)),
      })),
    })),
  }, 'Inventory retrieved')
}))

router.post('/inventory/blocks', requirePermission('room.manage'), wrap((req, res) => {
  const start = db.parseDate(req.body.startDate)
  const end = db.parseDate(req.body.endDate)
  if (!start || !end || end <= start) throw problem(422, 'Block dates are not valid', 'INVALID_DATES')
  const id = db.transaction(() => {
    const blockId = db.insert(
      `INSERT INTO inventory_blocks (room_type_id, room_id, start_date, end_date, quantity, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [req.body.roomTypeId || null, req.body.roomId || null, start, end, Number(req.body.quantity || 1), req.body.reason || 'Inventory block'],
    )
    domain.audit(req.user.id, 'inventory.block', 'inventory_block', blockId, null, { start, end })
    return blockId
  })
  send(res, db.get(`SELECT * FROM inventory_blocks WHERE id = ?`, [id]), 'Inventory block created', 201)
}))

router.get('/bookings', requirePermission('booking.read'), wrap((req, res) => {
  domain.releaseExpiredHolds()
  const clauses = ['1 = 1']
  const params = []
  if (req.query.status) {
    clauses.push('b.status = ?')
    params.push(req.query.status)
  }
  if (req.query.from) {
    clauses.push('b.check_out > ?')
    params.push(req.query.from)
  }
  if (req.query.to) {
    clauses.push('b.check_in <= ?')
    params.push(req.query.to)
  }
  if (req.query.q) {
    clauses.push(`(b.booking_reference LIKE ? OR g.name LIKE ? OR g.email LIKE ?)`)
    const like = `%${req.query.q}%`
    params.push(like, like, like)
  }
  const rows = db.all(
    `SELECT b.id FROM bookings b JOIN guests g ON g.id = b.guest_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY b.check_in DESC, b.id DESC`,
    params,
  )
  send(res, rows.map((row) => domain.presentBooking(row.id)), 'Reservations retrieved')
}))

router.get('/bookings/:id', requirePermission('booking.read'), wrap((req, res) => {
  const booking = domain.presentBooking(Number(req.params.id))
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  send(res, booking, 'Reservation retrieved')
}))

router.post('/bookings', requirePermission('booking.create'), wrap((req, res) => {
  const result = db.transaction(() =>
    domain.createBooking(
      { ...req.body, method: req.body.method || 'pay_at_hotel' },
      { source: req.body.source || 'walk-in', actorUserId: req.user.id },
    ),
  )
  send(res, result.booking, 'Reservation created', 201)
}))

router.patch('/bookings/:id', requirePermission('booking.modify'), wrap((req, res) => {
  const booking = db.get(`SELECT * FROM bookings WHERE id = ?`, [req.params.id])
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE bookings SET special_requests = ? WHERE id = ?`, [
      req.body.specialRequests == null ? booking.special_requests : req.body.specialRequests,
      booking.id,
    ])
    domain.audit(req.user.id, 'booking.update', 'booking', booking.id, null, { specialRequests: req.body.specialRequests })
  })
  send(res, domain.presentBooking(booking.id), 'Reservation updated')
}))

router.post('/bookings/:id/check-in', requirePermission('booking.checkin'), wrap((req, res) => {
  const booking = db.transaction(() => domain.checkIn(Number(req.params.id), req.user.id, req.body.roomId ? Number(req.body.roomId) : null))
  send(res, booking, 'Guest checked in')
}))

router.post('/bookings/:id/check-out', requirePermission('booking.checkin'), wrap((req, res) => {
  const booking = db.transaction(() => domain.checkOut(Number(req.params.id), req.user.id))
  send(res, booking, 'Guest checked out')
}))

router.post('/bookings/:id/cancel', requirePermission('booking.cancel'), wrap((req, res) => {
  const booking = db.transaction(() =>
    domain.cancelBooking(Number(req.params.id), {
      actorUserId: req.user.id,
      reason: req.body.reason || 'Cancelled by staff',
      waiveFee: Boolean(req.body.waiveFee),
      staff: true,
    }),
  )
  send(res, booking, 'Reservation cancelled')
}))

router.post('/bookings/:id/assign', requirePermission('booking.checkin'), wrap((req, res) => {
  const booking = db.transaction(() => domain.assignRoom(Number(req.body.bookingRoomId), Number(req.body.roomId), req.user.id))
  send(res, booking, 'Room assigned')
}))

router.get('/guests', requirePermission('booking.read'), wrap((req, res) => {
  const like = `%${req.query.q || ''}%`
  const rows = db.all(
    `SELECT g.*, (SELECT COUNT(*) FROM bookings b WHERE b.guest_id = g.id) AS stays
     FROM guests g
     WHERE g.name LIKE ? OR g.email LIKE ?
     ORDER BY g.name`,
    [like, like],
  )
  send(res, rows, 'Guests retrieved')
}))

router.patch('/guests/:id', requirePermission('booking.modify'), wrap((req, res) => {
  const guest = db.get(`SELECT * FROM guests WHERE id = ?`, [req.params.id])
  if (!guest) throw problem(404, 'Guest was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE guests SET phone = ?, nationality = ?, preferences = ? WHERE id = ?`, [
      req.body.phone == null ? guest.phone : req.body.phone,
      req.body.nationality == null ? guest.nationality : req.body.nationality,
      req.body.preferences == null ? guest.preferences : req.body.preferences,
      guest.id,
    ])
    domain.audit(req.user.id, 'guest.update', 'guest', guest.id, null, { phone: req.body.phone })
  })
  send(res, db.get(`SELECT * FROM guests WHERE id = ?`, [guest.id]), 'Guest updated')
}))

router.get('/rates', requirePermission('rate.manage', 'booking.read'), wrap((req, res) => {
  const plans = db.all(
    `SELECT rp.*, cp.name AS policy_name, cp.summary, cp.hours_before, cp.fee_percent
     FROM rate_plans rp JOIN cancellation_policies cp ON cp.id = rp.cancellation_policy_id
     ORDER BY rp.id`,
  )
  const promotions = db.all(`SELECT * FROM promotions ORDER BY id`)
  send(res, { plans, promotions }, 'Rates retrieved')
}))

router.post('/promotions', requirePermission('rate.manage'), wrap((req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase()
  if (!code || !req.body.discountType) throw problem(422, 'Code and discount type are required', 'INVALID')
  const id = db.transaction(() =>
    db.insert(
      `INSERT INTO promotions (code, name, discount_type, discount_value, terms, active) VALUES (?, ?, ?, ?, ?, 1)`,
      [code, req.body.name || code, req.body.discountType, Number(req.body.discountValue || 0), req.body.terms || ''],
    ),
  )
  send(res, db.get(`SELECT * FROM promotions WHERE id = ?`, [id]), 'Promotion created', 201)
}))

router.patch('/promotions/:id', requirePermission('rate.manage'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM promotions WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'Promotion was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE promotions SET active = ?, terms = ? WHERE id = ?`, [
      req.body.active == null ? row.active : req.body.active ? 1 : 0,
      req.body.terms == null ? row.terms : req.body.terms,
      row.id,
    ])
  })
  send(res, db.get(`SELECT * FROM promotions WHERE id = ?`, [row.id]), 'Promotion updated')
}))

router.get('/payments', requirePermission('payment.read'), wrap((req, res) => {
  const rows = db.all(
    `SELECT p.*, b.booking_reference, g.name AS guest_name
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     JOIN guests g ON g.id = b.guest_id
     ORDER BY p.id DESC`,
  )
  send(res, rows.map((row) => ({ ...row, amount: domain.money(row.amount_cents) })), 'Payments retrieved')
}))

router.post('/payments/:id/mark-paid', requirePermission('payment.read'), wrap((req, res) => {
  const payment = db.get(`SELECT * FROM payments WHERE id = ?`, [req.params.id])
  if (!payment) throw problem(404, 'Payment was not found', 'NOT_FOUND')
  if (payment.method !== 'pay_at_hotel') throw problem(422, 'Only pay-at-hotel balances can be marked paid here', 'PAYMENT_STATE')
  if (payment.status === 'PAID') {
    send(res, domain.presentBooking(payment.booking_id), 'Payment already recorded')
    return
  }
  db.transaction(() => {
    db.run(`UPDATE payments SET status = 'PAID', provider = 'hotel', provider_reference = ? WHERE id = ?`, [`desk_${payment.id}`, payment.id])
    domain.audit(req.user.id, 'payment.mark_paid', 'payment', payment.id, { status: payment.status }, { status: 'PAID' })
  })
  send(res, domain.presentBooking(payment.booking_id), 'Payment recorded')
}))

router.post('/payments/:id/refunds', requirePermission('payment.refund'), wrap((req, res) => {
  const payment = db.get(`SELECT * FROM payments WHERE id = ?`, [req.params.id])
  if (!payment || !['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
    throw problem(409, 'This payment cannot be refunded', 'PAYMENT_STATE')
  }
  const amount = domain.cents(req.body.amount)
  const already = db.get(`SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds WHERE payment_id = ? AND status = 'REFUNDED'`, [payment.id]).total
  if (!amount || amount > payment.amount_cents - already) throw problem(422, 'Refund amount is not valid', 'INVALID')
  db.transaction(() => {
    db.insert(
      `INSERT INTO refunds (payment_id, amount_cents, currency, status, reason) VALUES (?, ?, ?, 'REFUNDED', ?)`,
      [payment.id, amount, payment.currency, req.body.reason || 'Refund'],
    )
    const next = amount + already >= payment.amount_cents ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
    db.run(`UPDATE payments SET status = ? WHERE id = ?`, [next, payment.id])
    domain.audit(req.user.id, 'payment.refund', 'payment', payment.id, null, { amount: domain.money(amount) })
  })
  send(res, domain.presentBooking(payment.booking_id), 'Refund recorded', 201)
}))

router.get('/reports/occupancy', requirePermission('report.finance'), wrap((req, res) => {
  send(res, domain.report(req.query.from, req.query.to), 'Occupancy report retrieved')
}))

router.get('/reports/revenue', requirePermission('report.finance'), wrap((req, res) => {
  send(res, domain.report(req.query.from, req.query.to), 'Revenue report retrieved')
}))

router.get('/housekeeping', requirePermission('ops.manage', 'booking.read'), wrap((req, res) => {
  const rows = db.all(
    `SELECT h.*, r.room_number, u.name AS assignee
     FROM housekeeping_tasks h
     JOIN rooms r ON r.id = h.room_id
     LEFT JOIN users u ON u.id = h.assigned_user_id
     ORDER BY h.id DESC`,
  )
  send(res, rows, 'Housekeeping retrieved')
}))

router.post('/housekeeping/:id/advance', requirePermission('ops.manage'), wrap((req, res) => {
  const task = db.transaction(() => domain.advanceHousekeeping(Number(req.params.id), req.user.id))
  send(res, task, 'Room status advanced')
}))

router.get('/maintenance', requirePermission('ops.manage', 'room.manage'), wrap((req, res) => {
  const rows = db.all(
    `SELECT m.*, r.room_number FROM maintenance_tickets m
     LEFT JOIN rooms r ON r.id = m.room_id
     ORDER BY m.id DESC`,
  )
  send(res, rows, 'Maintenance retrieved')
}))

router.post('/maintenance', requirePermission('ops.manage'), wrap((req, res) => {
  const issue = String(req.body.issue || '').trim()
  if (issue.length < 3) throw problem(422, 'Describe the fault', 'INVALID')
  const id = db.transaction(() => {
    const ticketId = db.insert(
      `INSERT INTO maintenance_tickets (room_id, issue, severity, status, notes, blocks_inventory) VALUES (?, ?, ?, 'OPEN', ?, ?)`,
      [req.body.roomId || null, issue, req.body.severity || 'MEDIUM', req.body.notes || null, req.body.blockRoom ? 1 : 0],
    )
    if (req.body.blockRoom && req.body.roomId) {
      db.run(`UPDATE rooms SET operational_status = 'OUT_OF_SERVICE' WHERE id = ?`, [req.body.roomId])
    }
    domain.audit(req.user.id, 'maintenance.create', 'maintenance_ticket', ticketId, null, { issue })
    return ticketId
  })
  send(res, db.get(`SELECT * FROM maintenance_tickets WHERE id = ?`, [id]), 'Ticket opened', 201)
}))

router.post('/maintenance/:id/resolve', requirePermission('ops.manage'), wrap((req, res) => {
  const ticket = db.get(`SELECT * FROM maintenance_tickets WHERE id = ?`, [req.params.id])
  if (!ticket) throw problem(404, 'Ticket was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE maintenance_tickets SET status = 'RESOLVED', notes = ? WHERE id = ?`, [req.body.notes || ticket.notes, ticket.id])
    if (ticket.blocks_inventory && ticket.room_id) {
      db.run(`UPDATE rooms SET operational_status = 'DIRTY' WHERE id = ? AND operational_status = 'OUT_OF_SERVICE'`, [ticket.room_id])
    }
    domain.audit(req.user.id, 'maintenance.resolve', 'maintenance_ticket', ticket.id, { status: ticket.status }, { status: 'RESOLVED' })
  })
  send(res, db.get(`SELECT * FROM maintenance_tickets WHERE id = ?`, [ticket.id]), 'Ticket resolved')
}))

router.get('/services', requirePermission('ops.manage', 'booking.read'), wrap((req, res) => {
  const catalog = db.all(`SELECT * FROM service_catalog ORDER BY category, name`).map((row) => ({ ...row, price: domain.money(row.price_cents) }))
  const requests = db.all(
    `SELECT s.*, b.booking_reference, g.name AS guest_name
     FROM service_requests s
     LEFT JOIN bookings b ON b.id = s.booking_id
     LEFT JOIN guests g ON g.id = s.guest_id
     ORDER BY s.id DESC`,
  )
  send(res, { catalog, requests }, 'Services retrieved')
}))

router.patch('/service-requests/:id', requirePermission('ops.manage'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM service_requests WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'Request was not found', 'NOT_FOUND')
  const status = req.body.status || row.status
  db.transaction(() => db.run(`UPDATE service_requests SET status = ? WHERE id = ?`, [status, row.id]))
  send(res, db.get(`SELECT * FROM service_requests WHERE id = ?`, [row.id]), 'Request updated')
}))

router.get('/reviews', requirePermission('content.manage'), wrap((req, res) => {
  send(res, db.all(`SELECT * FROM reviews ORDER BY id DESC`), 'Reviews retrieved')
}))

router.patch('/reviews/:id', requirePermission('content.manage'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM reviews WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'Review was not found', 'NOT_FOUND')
  const status = req.body.moderationStatus || row.moderation_status
  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) throw problem(422, 'Moderation status is not valid', 'INVALID')
  db.transaction(() => {
    db.run(`UPDATE reviews SET moderation_status = ?, response = ? WHERE id = ?`, [
      status,
      req.body.response == null ? row.response : req.body.response,
      row.id,
    ])
    domain.audit(req.user.id, 'review.moderate', 'review', row.id, { status: row.moderation_status }, { status })
  })
  send(res, db.get(`SELECT * FROM reviews WHERE id = ?`, [row.id]), 'Review updated')
}))

router.get('/messages', requirePermission('content.manage', 'booking.read'), wrap((req, res) => {
  send(res, db.all(`SELECT * FROM contact_messages ORDER BY id DESC`), 'Messages retrieved')
}))

router.patch('/messages/:id', requirePermission('content.manage', 'booking.read'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM contact_messages WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'Message was not found', 'NOT_FOUND')
  db.run(`UPDATE contact_messages SET status = ? WHERE id = ?`, [req.body.status || 'READ', row.id])
  db.persist()
  send(res, db.get(`SELECT * FROM contact_messages WHERE id = ?`, [row.id]), 'Message updated')
}))

router.get('/notifications', requirePermission('booking.read', 'content.manage', 'ops.manage'), wrap((req, res) => {
  send(res, db.all(`SELECT * FROM notifications ORDER BY id DESC LIMIT 40`), 'Notifications retrieved')
}))

router.get('/pages', requirePermission('content.manage'), wrap((req, res) => {
  send(res, {
    pages: db.all(`SELECT * FROM pages ORDER BY slug`),
    faqs: db.all(`SELECT * FROM faqs ORDER BY sort_order, id`),
    offers: db.all(`SELECT * FROM offers ORDER BY id DESC`),
  }, 'Content retrieved')
}))

router.patch('/pages/:slug', requirePermission('content.manage'), wrap((req, res) => {
  const page = db.get(`SELECT * FROM pages WHERE slug = ?`, [req.params.slug])
  if (!page) throw problem(404, 'Page was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE pages SET title = ?, body = ? WHERE id = ?`, [req.body.title || page.title, req.body.body == null ? page.body : req.body.body, page.id])
    domain.audit(req.user.id, 'content.publish', 'page', page.id, null, { slug: page.slug })
  })
  send(res, db.get(`SELECT * FROM pages WHERE id = ?`, [page.id]), 'Page published')
}))

router.post('/faqs', requirePermission('content.manage'), wrap((req, res) => {
  if (!req.body.question || !req.body.answer) throw problem(422, 'Question and answer are required', 'INVALID')
  const id = db.transaction(() =>
    db.insert(`INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)`, [
      req.body.category || 'General',
      req.body.question,
      req.body.answer,
      Number(req.body.sortOrder || 0),
    ]),
  )
  send(res, db.get(`SELECT * FROM faqs WHERE id = ?`, [id]), 'FAQ created', 201)
}))

router.patch('/faqs/:id', requirePermission('content.manage'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM faqs WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'FAQ was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE faqs SET question = ?, answer = ?, category = ? WHERE id = ?`, [
      req.body.question || row.question,
      req.body.answer || row.answer,
      req.body.category || row.category,
      row.id,
    ])
  })
  send(res, db.get(`SELECT * FROM faqs WHERE id = ?`, [row.id]), 'FAQ updated')
}))

router.patch('/offers/:id', requirePermission('content.manage'), wrap((req, res) => {
  const row = db.get(`SELECT * FROM offers WHERE id = ?`, [req.params.id])
  if (!row) throw problem(404, 'Offer was not found', 'NOT_FOUND')
  db.transaction(() => {
    db.run(`UPDATE offers SET title = ?, summary = ?, terms = ?, active = ? WHERE id = ?`, [
      req.body.title || row.title,
      req.body.summary == null ? row.summary : req.body.summary,
      req.body.terms == null ? row.terms : req.body.terms,
      req.body.active == null ? row.active : req.body.active ? 1 : 0,
      row.id,
    ])
  })
  send(res, db.get(`SELECT * FROM offers WHERE id = ?`, [row.id]), 'Offer updated')
}))

router.get('/users', requirePermission('user.manage'), wrap((req, res) => {
  const users = db.all(`SELECT id, name, email, phone, status, kind, created_at FROM users WHERE kind = 'staff' ORDER BY name`)
  const withRoles = users.map((user) => ({
    ...user,
    roles: db.all(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [user.id],
    ).map((role) => role.name),
  }))
  send(res, withRoles, 'Users retrieved')
}))

router.get('/roles', requirePermission('user.manage'), wrap((req, res) => {
  send(res, db.all(`SELECT id, name, description FROM roles ORDER BY id`), 'Roles retrieved')
}))

router.post('/users', requirePermission('user.manage'), wrap((req, res) => {
  const name = String(req.body.name || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const role = db.get(`SELECT * FROM roles WHERE name = ?`, [req.body.role])
  if (name.length < 2 || !email.includes('@') || password.length < 8 || !role) {
    throw problem(422, 'Name, email, an 8-character password, and a role are required', 'INVALID')
  }
  if (db.get(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`, [email])) throw problem(409, 'That email is already in use', 'DUPLICATE')
  const id = db.transaction(() => {
    const userId = db.insert(
      `INSERT INTO users (name, email, password_hash, phone, kind, status) VALUES (?, ?, ?, ?, 'staff', 'ACTIVE')`,
      [name, email, bcrypt.hashSync(password, 10), req.body.phone || null],
    )
    db.insert(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, role.id])
    domain.audit(req.user.id, 'user.create', 'user', userId, null, { email, role: role.name })
    return userId
  })
  send(res, { id }, 'Staff account created', 201)
}))

router.patch('/users/:id', requirePermission('user.manage'), wrap((req, res) => {
  const user = db.get(`SELECT * FROM users WHERE id = ? AND kind = 'staff'`, [req.params.id])
  if (!user) throw problem(404, 'Staff account was not found', 'NOT_FOUND')
  if (req.body.status && !['ACTIVE', 'DISABLED'].includes(req.body.status)) throw problem(422, 'Status is not valid', 'INVALID')
  db.transaction(() => {
    db.run(`UPDATE users SET status = ?, name = ? WHERE id = ?`, [req.body.status || user.status, req.body.name || user.name, user.id])
    if (req.body.role) {
      const role = db.get(`SELECT * FROM roles WHERE name = ?`, [req.body.role])
      if (!role) throw problem(422, 'Role was not found', 'INVALID')
      db.run(`DELETE FROM user_roles WHERE user_id = ?`, [user.id])
      db.insert(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [user.id, role.id])
    }
    domain.audit(req.user.id, 'user.update', 'user', user.id, { status: user.status }, { status: req.body.status || user.status })
  })
  send(res, { id: user.id, status: req.body.status || user.status }, 'Staff account updated')
}))

router.get('/settings', requirePermission('user.manage', 'rate.manage', 'content.manage'), wrap((req, res) => {
  send(res, hotelSettings(), 'Settings retrieved')
}))

router.patch('/settings', requirePermission('user.manage'), wrap((req, res) => {
  const current = db.get(`SELECT * FROM hotel_settings WHERE id = 1`)
  db.transaction(() => {
    db.run(
      `UPDATE hotel_settings SET phone = ?, email = ?, check_in_time = ?, check_out_time = ?, tax_percent = ?, service_fee_percent = ?, tagline = ?, description = ? WHERE id = 1`,
      [
        req.body.phone || current.phone,
        req.body.email || current.email,
        req.body.checkInTime || current.check_in_time,
        req.body.checkOutTime || current.check_out_time,
        req.body.taxPercent == null ? current.tax_percent : Number(req.body.taxPercent),
        req.body.serviceFeePercent == null ? current.service_fee_percent : Number(req.body.serviceFeePercent),
        req.body.tagline == null ? current.tagline : req.body.tagline,
        req.body.description == null ? current.description : req.body.description,
      ],
    )
    domain.audit(req.user.id, 'settings.update', 'settings', 1, { tax: current.tax_percent }, { tax: req.body.taxPercent })
  })
  send(res, hotelSettings(), 'Settings updated')
}))

router.get('/audit-logs', requirePermission('audit.read'), wrap((req, res) => {
  const rows = db.all(
    `SELECT a.*, u.name AS actor_name
     FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.id DESC LIMIT 200`,
  )
  send(res, rows, 'Audit log retrieved')
}))

function hotelSettings() {
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
  }
}

module.exports = router
