const db = require('./db')
const { problem } = require('./http')

const ACTIVE_STATUSES = ['CONFIRMED', 'CHECKED_IN']
const HOLD_STATUS = 'PENDING'

function cents(value) {
  return Math.round(Number(value) * 100)
}

function major(centsValue) {
  return Math.round(Number(centsValue) || 0) / 100
}

function money(centsValue) {
  return major(centsValue)
}

function percentOf(amountCents, percent) {
  return Math.round((amountCents * Number(percent)) / 100)
}

function settings() {
  const row = db.get('SELECT * FROM hotel_settings WHERE id = 1')
  if (!row) throw problem(500, 'Hotel settings are missing', 'SETTINGS_MISSING')
  return row
}

function audit(actorUserId, action, entityType, entityId, beforeData, afterData) {
  db.insert(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId || null,
      action,
      entityType,
      entityId == null ? null : String(entityId),
      beforeData ? JSON.stringify(beforeData) : null,
      afterData ? JSON.stringify(afterData) : null,
    ],
  )
}

function notify({ userId, bookingId, type, subject, body }) {
  db.insert(
    `INSERT INTO notifications (user_id, booking_id, type, channel, status, subject, body, sent_at)
     VALUES (?, ?, ?, 'email', 'SENT', ?, ?, datetime('now'))`,
    [userId || null, bookingId || null, type, subject, body],
  )
}

function releaseExpiredHolds() {
  const expired = db.all(
    `SELECT id, booking_reference FROM bookings
     WHERE status = 'PENDING' AND hold_expires_at IS NOT NULL AND hold_expires_at <= datetime('now')`,
  )
  expired.forEach((row) => {
    db.run(`UPDATE bookings SET status = 'CANCELLED' WHERE id = ?`, [row.id])
    db.insert(
      `INSERT INTO booking_status_history (booking_id, old_status, new_status, reason)
       VALUES (?, 'PENDING', 'CANCELLED', 'Hold expired')`,
      [row.id],
    )
  })
  return expired.length
}

function sellableRooms(roomTypeId) {
  return db.get(
    `SELECT COUNT(*) AS count FROM rooms
     WHERE room_type_id = ? AND operational_status != 'OUT_OF_SERVICE'`,
    [roomTypeId],
  ).count
}

function takenOn(roomTypeId, stayDate) {
  const booked = db.get(
    `SELECT COALESCE(SUM(br.quantity), 0) AS count
     FROM booking_rooms br
     JOIN bookings b ON b.id = br.booking_id
     WHERE br.room_type_id = ?
       AND b.check_in <= ?
       AND b.check_out > ?
       AND (
         b.status IN ('CONFIRMED', 'CHECKED_IN')
         OR (b.status = 'PENDING' AND b.hold_expires_at > datetime('now'))
       )`,
    [roomTypeId, stayDate, stayDate],
  ).count
  const blocked = db.get(
    `SELECT COALESCE(SUM(
        CASE
          WHEN ib.room_id IS NOT NULL AND IFNULL(r.operational_status, '') != 'OUT_OF_SERVICE' THEN ib.quantity
          WHEN ib.room_id IS NULL THEN ib.quantity
          ELSE 0
        END
      ), 0) AS count
     FROM inventory_blocks ib
     LEFT JOIN rooms r ON r.id = ib.room_id
     WHERE ib.status = 'ACTIVE'
       AND ib.start_date <= ?
       AND ib.end_date > ?
       AND (ib.room_type_id = ? OR r.room_type_id = ?)`,
    [stayDate, stayDate, roomTypeId, roomTypeId],
  ).count
  return booked + blocked
}

function availableQuantity(roomTypeId, checkIn, checkOut) {
  const nights = db.eachNight(checkIn, checkOut)
  const sellable = sellableRooms(roomTypeId)
  let available = sellable
  nights.forEach((night) => {
    available = Math.min(available, sellable - takenOn(roomTypeId, night))
  })
  return Math.max(0, available)
}

function roomTypeRow(idOrSlug) {
  if (typeof idOrSlug === 'number' || /^\d+$/.test(String(idOrSlug))) {
    return db.get('SELECT * FROM room_types WHERE id = ?', [Number(idOrSlug)])
  }
  return db.get('SELECT * FROM room_types WHERE slug = ?', [idOrSlug])
}

function presentRoomType(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    capacityAdults: row.capacity_adults,
    capacityChildren: row.capacity_children,
    bedConfig: row.bed_config,
    sizeSqm: row.size_sqm,
    view: row.view_name,
    category: row.category,
    basePrice: money(row.base_price_cents),
    currency: row.currency,
    accessibility: row.accessibility,
    active: Boolean(row.active),
    sortOrder: row.sort_order,
    amenities: db.all(
      `SELECT a.name FROM amenities a
       JOIN room_type_amenities m ON m.amenity_id = a.id
       WHERE m.room_type_id = ?
       ORDER BY a.name`,
      [row.id],
    ).map((item) => item.name),
    images: db.all(
      `SELECT image_url AS url, alt_text AS alt FROM room_images
       WHERE room_type_id = ? ORDER BY sort_order, id`,
      [row.id],
    ),
  }
}

function nightlyCents(roomType, ratePlan, stayDate) {
  const override = db.get(
    `SELECT nightly_price_cents FROM room_rates
     WHERE room_type_id = ? AND rate_plan_id = ? AND stay_date = ?`,
    [roomType.id, ratePlan.id, stayDate],
  )
  if (override) return override.nightly_price_cents
  return Math.round(roomType.base_price_cents * (1 + ratePlan.price_adjust_percent / 100))
}

function findPromo(code) {
  if (!code) return null
  const promo = db.get(
    `SELECT * FROM promotions WHERE code = ? COLLATE NOCASE AND active = 1`,
    [String(code).trim()],
  )
  if (!promo) throw problem(422, 'Promotion code is not active', 'PROMO_INVALID')
  return promo
}

function quote(roomType, ratePlan, nights, roomCount, promo, hotel) {
  const perRoom = nights.map((stayDate) => nightlyCents(roomType, ratePlan, stayDate))
  const subtotal = perRoom.reduce((sum, price) => sum + price, 0) * roomCount
  let discount = 0
  if (promo) {
    if (promo.discount_type === 'percent') discount = percentOf(subtotal, promo.discount_value)
    if (promo.discount_type === 'fixed') discount = Math.min(subtotal, cents(promo.discount_value))
    if (promo.discount_type === 'free_night' && nights.length >= Number(promo.discount_value)) {
      discount = Math.min(...perRoom) * roomCount
    }
  }
  const afterDiscount = subtotal - discount
  const service = percentOf(afterDiscount, hotel.service_fee_percent)
  const tax = percentOf(afterDiscount + service, hotel.tax_percent)
  return {
    perRoom,
    subtotal,
    discount,
    service,
    tax,
    total: afterDiscount + service + tax,
  }
}

function presentRate(ratePlan, priced, currency) {
  const policy = db.get('SELECT * FROM cancellation_policies WHERE id = ?', [ratePlan.cancellation_policy_id])
  return {
    id: ratePlan.id,
    name: ratePlan.name,
    mealPlan: ratePlan.meal_plan,
    description: ratePlan.description,
    nightlyPrices: priced.perRoom.map(money),
    subtotal: money(priced.subtotal),
    discount: money(priced.discount),
    serviceFee: money(priced.service),
    tax: money(priced.tax),
    taxesAndFees: money(priced.service + priced.tax),
    total: money(priced.total),
    currency,
    cancellationPolicy: policy.summary,
    cancellation: {
      name: policy.name,
      hoursBefore: policy.hours_before,
      feePercent: policy.fee_percent,
      summary: policy.summary,
    },
  }
}

function searchAvailability({ checkIn, checkOut, adults, children, rooms, promoCode, promo }) {
  const code = promoCode || promo
  releaseExpiredHolds()
  const hotel = settings()
  const today = db.hotelToday()
  const arrival = db.parseDate(checkIn)
  const departure = db.parseDate(checkOut)
  const adultCount = Number(adults)
  const childCount = Number(children || 0)
  const roomCount = Number(rooms)
  if (!arrival || !departure) throw problem(422, 'Use check-in and check-out dates as YYYY-MM-DD', 'INVALID_DATES')
  if (arrival < today) throw problem(422, 'Arrival date cannot be in the past', 'INVALID_DATES')
  if (departure <= arrival) throw problem(422, 'Departure must be after arrival', 'INVALID_DATES')
  const nights = db.eachNight(arrival, departure)
  if (nights.length > 30) throw problem(422, 'Stays longer than 30 nights must be arranged with the hotel', 'STAY_TOO_LONG')
  if (!Number.isInteger(adultCount) || adultCount < 1) throw problem(422, 'At least one adult is required', 'INVALID_GUESTS')
  if (!Number.isInteger(childCount) || childCount < 0) throw problem(422, 'Children cannot be negative', 'INVALID_GUESTS')
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 5) throw problem(422, 'Choose between 1 and 5 rooms', 'INVALID_ROOMS')
  const offer = findPromo(code)
  const types = db.all(`SELECT * FROM room_types WHERE active = 1 ORDER BY sort_order, id`)
  const roomTypes = types
    .map((roomType) => {
      const capacity = roomType.capacity_adults * roomCount
      const childCapacity = (roomType.capacity_adults + roomType.capacity_children) * roomCount
      if (adultCount > capacity || adultCount + childCount > childCapacity) return null
      const available = availableQuantity(roomType.id, arrival, departure)
      if (available < roomCount) return null
      const plans = db.all(`SELECT * FROM rate_plans WHERE active = 1 ORDER BY id`)
      return {
        ...presentRoomType(roomType),
        availableQuantity: available,
        ratePlans: plans.map((plan) => presentRate(plan, quote(roomType, plan, nights, roomCount, offer, hotel), hotel.currency)),
      }
    })
    .filter(Boolean)
  return {
    checkIn: arrival,
    checkOut: departure,
    nights: nights.length,
    adults: adultCount,
    children: childCount,
    rooms: roomCount,
    currency: hotel.currency,
    promo: offer ? { code: offer.code, name: offer.name, terms: offer.terms } : null,
    roomTypes,
  }
}

function nextReference() {
  const year = db.hotelToday().slice(0, 4)
  const rows = db.all(`SELECT booking_reference FROM bookings WHERE booking_reference LIKE ?`, [`GH-${year}-%`])
  let max = 1000
  rows.forEach((row) => {
    const value = Number(String(row.booking_reference).split('-').pop())
    if (value > max) max = value
  })
  return `GH-${year}-${String(max + 1).padStart(4, '0')}`
}

function ensureGuest({ name, email, phone, nationality, userId }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const cleanName = String(name || '').trim()
  if (cleanName.length < 2) throw problem(422, 'Guest name is required', 'INVALID_GUEST')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw problem(422, 'A valid email is required', 'INVALID_GUEST')
  let guest = null
  if (userId) guest = db.get('SELECT * FROM guests WHERE user_id = ?', [userId])
  if (!guest) guest = db.get('SELECT * FROM guests WHERE email = ? COLLATE NOCASE', [cleanEmail])
  if (!guest) {
    const id = db.insert(
      `INSERT INTO guests (user_id, name, email, phone, nationality) VALUES (?, ?, ?, ?, ?)`,
      [userId || null, cleanName, cleanEmail, phone || null, nationality || null],
    )
    return db.get('SELECT * FROM guests WHERE id = ?', [id])
  }
  db.run(
    `UPDATE guests SET name = ?, phone = COALESCE(?, phone), nationality = COALESCE(?, nationality), user_id = COALESCE(user_id, ?) WHERE id = ?`,
    [cleanName, phone || null, nationality || null, userId || null, guest.id],
  )
  return db.get('SELECT * FROM guests WHERE id = ?', [guest.id])
}

function presentBooking(id) {
  const booking = db.get(
    `SELECT b.*, g.name AS guest_name, g.email AS guest_email, g.phone AS guest_phone, g.nationality
     FROM bookings b JOIN guests g ON g.id = b.guest_id WHERE b.id = ?`,
    [id],
  )
  if (!booking) return null
  const lines = db.all(
    `SELECT br.*, rt.name AS room_type_name, rt.slug AS room_type_slug, r.room_number, rp.name AS rate_plan_name, rp.meal_plan
     FROM booking_rooms br
     JOIN room_types rt ON rt.id = br.room_type_id
     JOIN rate_plans rp ON rp.id = br.rate_plan_id
     LEFT JOIN rooms r ON r.id = br.room_id
     WHERE br.booking_id = ?
     ORDER BY br.id`,
    [id],
  )
  const nights = db.all(
    `SELECT bn.*, br.id AS booking_room_id FROM booking_nights bn
     JOIN booking_rooms br ON br.id = bn.booking_room_id
     WHERE br.booking_id = ? ORDER BY bn.stay_date, bn.id`,
    [id],
  )
  const payments = db.all(
    `SELECT p.*, 
        (SELECT COALESCE(SUM(amount_cents), 0) FROM refunds rf WHERE rf.payment_id = p.id AND rf.status = 'REFUNDED') AS refunded_cents
     FROM payments p WHERE p.booking_id = ? ORDER BY p.id`,
    [id],
  )
  const history = db.all(
    `SELECT h.*, u.name AS actor_name FROM booking_status_history h
     LEFT JOIN users u ON u.id = h.actor_user_id
     WHERE h.booking_id = ? ORDER BY h.id`,
    [id],
  )
  return {
    id: booking.id,
    reference: booking.booking_reference,
    status: booking.status,
    source: booking.source,
    currency: booking.currency,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    adults: booking.adults,
    children: booking.children,
    rooms: booking.rooms_requested,
    subtotal: money(booking.subtotal_cents),
    discount: money(booking.discount_cents),
    serviceFee: money(booking.service_fee_cents),
    tax: money(booking.tax_cents),
    total: money(booking.total_cents),
    promoCode: booking.promo_code,
    specialRequests: booking.special_requests,
    holdExpiresAt: booking.hold_expires_at,
    createdAt: booking.created_at,
    guest: {
      id: booking.guest_id,
      name: booking.guest_name,
      email: booking.guest_email,
      phone: booking.guest_phone,
      nationality: booking.nationality,
    },
    lines: lines.map((line) => ({
      id: line.id,
      roomTypeId: line.room_type_id,
      roomType: line.room_type_name,
      slug: line.room_type_slug,
      roomId: line.room_id,
      roomNumber: line.room_number,
      ratePlanId: line.rate_plan_id,
      ratePlan: line.rate_plan_name,
      mealPlan: line.meal_plan,
      quantity: line.quantity,
      nights: nights
        .filter((night) => night.booking_room_id === line.id)
        .map((night) => ({
          date: night.stay_date,
          rate: money(night.nightly_rate_cents),
          total: money(night.line_total_cents),
        })),
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      providerReference: payment.provider_reference,
      amount: money(payment.amount_cents),
      refunded: money(payment.refunded_cents),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      createdAt: payment.created_at,
    })),
    history: history.map((item) => ({
      from: item.old_status,
      to: item.new_status,
      reason: item.reason,
      actor: item.actor_name,
      at: item.created_at,
    })),
  }
}

function createBooking(input, options = {}) {
  releaseExpiredHolds()
  const hotel = settings()
  const today = db.hotelToday()
  const arrival = db.parseDate(input.checkIn)
  const departure = db.parseDate(input.checkOut)
  const roomCount = Number(input.rooms || 1)
  const adultCount = Number(input.adults)
  const childCount = Number(input.children || 0)
  if (!arrival || !departure) throw problem(422, 'Use check-in and check-out dates as YYYY-MM-DD', 'INVALID_DATES')
  if (!options.allowPast && arrival < today) throw problem(422, 'Arrival date cannot be in the past', 'INVALID_DATES')
  if (departure <= arrival) throw problem(422, 'Departure must be after arrival', 'INVALID_DATES')
  const nights = db.eachNight(arrival, departure)
  if (!nights.length || nights.length > 30) throw problem(422, 'Stay length is not valid', 'INVALID_DATES')
  if (!Number.isInteger(roomCount) || roomCount < 1 || roomCount > 5) throw problem(422, 'Choose between 1 and 5 rooms', 'INVALID_ROOMS')
  const roomType = roomTypeRow(input.roomTypeId || input.roomTypeSlug)
  if (!roomType || !roomType.active) throw problem(404, 'Room type was not found', 'ROOM_NOT_FOUND')
  const ratePlan = db.get(`SELECT * FROM rate_plans WHERE id = ? AND active = 1`, [Number(input.ratePlanId)])
  if (!ratePlan) throw problem(404, 'Rate plan was not found', 'RATE_NOT_FOUND')
  if (adultCount > roomType.capacity_adults * roomCount || adultCount + childCount > (roomType.capacity_adults + roomType.capacity_children) * roomCount) {
    throw problem(422, 'Guest count exceeds the room capacity', 'CAPACITY')
  }
  const available = availableQuantity(roomType.id, arrival, departure)
  if (available < roomCount) throw problem(409, 'Selected room inventory is no longer available', 'INVENTORY_CONFLICT')
  const promo = findPromo(input.promoCode)
  const priced = quote(roomType, ratePlan, nights, roomCount, promo, hotel)
  const guest = ensureGuest({ ...input.guest, userId: options.userId })
  const method = input.method === 'card' ? 'card' : 'pay_at_hotel'
  const status = method === 'card' ? HOLD_STATUS : 'CONFIRMED'
  const holdExpires =
    status === HOLD_STATUS
      ? new Date(Date.now() + hotel.hold_minutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null
  const reference = nextReference()
  const bookingId = db.insert(
    `INSERT INTO bookings (
      booking_reference, guest_id, status, currency, check_in, check_out, adults, children, rooms_requested,
      subtotal_cents, discount_cents, service_fee_cents, tax_cents, total_cents, source, special_requests,
      promo_code, hold_expires_at, idempotency_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reference,
      guest.id,
      status,
      hotel.currency,
      arrival,
      departure,
      adultCount,
      childCount,
      roomCount,
      priced.subtotal,
      priced.discount,
      priced.service,
      priced.tax,
      priced.total,
      options.source || 'website',
      input.specialRequests || null,
      promo ? promo.code : null,
      holdExpires,
      options.idempotencyKey || null,
    ],
  )
  for (let copy = 0; copy < roomCount; copy += 1) {
    const lineId = db.insert(
      `INSERT INTO booking_rooms (booking_id, room_type_id, quantity, rate_plan_id) VALUES (?, ?, 1, ?)`,
      [bookingId, roomType.id, ratePlan.id],
    )
    priced.perRoom.forEach((rate, index) => {
      db.insert(
        `INSERT INTO booking_nights (booking_room_id, stay_date, nightly_rate_cents, line_total_cents)
         VALUES (?, ?, ?, ?)`,
        [lineId, nights[index], rate, rate],
      )
    })
  }
  const paymentStatus = method === 'card' ? 'PENDING' : 'UNPAID'
  const paymentId = db.insert(
    `INSERT INTO payments (booking_id, provider, provider_reference, amount_cents, currency, status, method)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingId,
      method === 'card' ? 'sandbox' : 'hotel',
      method === 'card' ? `sbx_${reference}` : null,
      priced.total,
      hotel.currency,
      paymentStatus,
      method,
    ],
  )
  db.insert(
    `INSERT INTO booking_status_history (booking_id, old_status, new_status, actor_user_id, reason)
     VALUES (?, NULL, ?, ?, ?)`,
    [bookingId, status, options.actorUserId || null, status === 'CONFIRMED' ? 'Reservation confirmed' : 'Inventory held for payment'],
  )
  if (status === 'CONFIRMED') {
    notify({
      userId: options.userId,
      bookingId,
      type: 'booking.confirmed',
      subject: `Reservation ${reference} confirmed`,
      body: `${guest.name}, your stay from ${arrival} to ${departure} is confirmed. Reference ${reference}.`,
    })
  }
  audit(options.actorUserId, 'booking.create', 'booking', bookingId, null, { reference, status, total: money(priced.total) })
  return { booking: presentBooking(bookingId), paymentId }
}

function confirmPayment(paymentId, actorUserId) {
  const payment = db.get('SELECT * FROM payments WHERE id = ?', [Number(paymentId)])
  if (!payment) throw problem(404, 'Payment was not found', 'PAYMENT_NOT_FOUND')
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [payment.booking_id])
  if (payment.status === 'PAID' && booking.status === 'CONFIRMED') return presentBooking(booking.id)
  if (payment.status !== 'PENDING') throw problem(409, 'Payment cannot be confirmed from its current status', 'PAYMENT_STATE')
  if (booking.status !== 'PENDING') throw problem(409, 'This reservation is no longer awaiting payment', 'BOOKING_STATE')
  if (booking.hold_expires_at && booking.hold_expires_at <= new Date().toISOString().slice(0, 19).replace('T', ' ')) {
    throw problem(409, 'The room hold has expired', 'HOLD_EXPIRED')
  }
  db.run(`UPDATE payments SET status = 'PAID' WHERE id = ?`, [payment.id])
  db.run(`UPDATE bookings SET status = 'CONFIRMED', hold_expires_at = NULL WHERE id = ?`, [booking.id])
  db.insert(
    `INSERT INTO booking_status_history (booking_id, old_status, new_status, actor_user_id, reason)
     VALUES (?, 'PENDING', 'CONFIRMED', ?, 'Payment verified')`,
    [booking.id, actorUserId || null],
  )
  const guest = db.get('SELECT * FROM guests WHERE id = ?', [booking.guest_id])
  notify({
    userId: guest.user_id,
    bookingId: booking.id,
    type: 'booking.confirmed',
    subject: `Reservation ${booking.booking_reference} confirmed`,
    body: `Payment received. Reference ${booking.booking_reference}.`,
  })
  audit(actorUserId, 'payment.confirm', 'payment', payment.id, { status: 'PENDING' }, { status: 'PAID' })
  return presentBooking(booking.id)
}

function feePercent(policy, checkIn) {
  const hotel = settings()
  if (policy.hours_before <= 0) return policy.fee_percent
  const deadline = new Date(`${checkIn}T${hotel.check_in_time}:00+06:00`).getTime() - policy.hours_before * 3600000
  return Date.now() < deadline ? 0 : policy.fee_percent
}

function cancelBooking(bookingId, { actorUserId, reason, waiveFee, staff }) {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [bookingId])
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw problem(409, 'This reservation cannot be cancelled', 'BOOKING_STATE')
  }
  const line = db.get('SELECT rate_plan_id FROM booking_rooms WHERE booking_id = ? LIMIT 1', [booking.id])
  const plan = db.get('SELECT * FROM rate_plans WHERE id = ?', [line.rate_plan_id])
  const policy = db.get('SELECT * FROM cancellation_policies WHERE id = ?', [plan.cancellation_policy_id])
  const appliedFee = waiveFee ? 0 : feePercent(policy, booking.check_in)
  if (!staff && appliedFee >= 100 && booking.status === 'CONFIRMED') {
    throw problem(422, policy.summary, 'NOT_REFUNDABLE')
  }
  const feeCents = percentOf(booking.total_cents, appliedFee)
  db.run(`UPDATE bookings SET status = 'CANCELLED', hold_expires_at = NULL WHERE id = ?`, [booking.id])
  db.insert(
    `INSERT INTO booking_status_history (booking_id, old_status, new_status, actor_user_id, reason)
     VALUES (?, ?, 'CANCELLED', ?, ?)`,
    [booking.id, booking.status, actorUserId || null, reason || 'Cancelled'],
  )
  const payments = db.all(`SELECT * FROM payments WHERE booking_id = ? AND status = 'PAID'`, [booking.id])
  payments.forEach((payment) => {
    const refunded = db.get(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds WHERE payment_id = ? AND status = 'REFUNDED'`,
      [payment.id],
    ).total
    const remaining = payment.amount_cents - refunded
    const refund = Math.max(0, Math.min(remaining, payment.amount_cents - feeCents))
    if (refund > 0) {
      db.insert(
        `INSERT INTO refunds (payment_id, amount_cents, currency, status, reason) VALUES (?, ?, ?, 'REFUNDED', ?)`,
        [payment.id, refund, payment.currency, reason || 'Cancellation refund'],
      )
      const next = refund >= remaining ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
      db.run(`UPDATE payments SET status = ? WHERE id = ?`, [next, payment.id])
    }
  })
  if (booking.status === 'PENDING') {
    db.run(`UPDATE payments SET status = 'FAILED' WHERE booking_id = ? AND status = 'PENDING'`, [booking.id])
  }
  notify({
    bookingId: booking.id,
    type: 'booking.cancelled',
    subject: `Reservation ${booking.booking_reference} cancelled`,
    body: reason || 'The reservation was cancelled and inventory was released.',
  })
  audit(actorUserId, 'booking.cancel', 'booking', booking.id, { status: booking.status }, { status: 'CANCELLED', feePercent: appliedFee })
  return presentBooking(booking.id)
}

function freeRoom(roomTypeId, checkIn, checkOut, bookingId) {
  const rooms = db.all(
    `SELECT * FROM rooms WHERE room_type_id = ? AND operational_status = 'READY' ORDER BY room_number`,
    [roomTypeId],
  )
  return (
    rooms.find((room) => {
      const clash = db.get(
        `SELECT br.id FROM booking_rooms br
         JOIN bookings b ON b.id = br.booking_id
         WHERE br.room_id = ?
           AND b.id != ?
           AND b.status IN ('CONFIRMED', 'CHECKED_IN')
           AND b.check_in < ?
           AND b.check_out > ?`,
        [room.id, bookingId, checkOut, checkIn],
      )
      return !clash
    }) || null
  )
}

function assignRoom(bookingRoomId, roomId, actorUserId) {
  const line = db.get('SELECT * FROM booking_rooms WHERE id = ?', [bookingRoomId])
  if (!line) throw problem(404, 'Booking room was not found', 'NOT_FOUND')
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [line.booking_id])
  const room = db.get('SELECT * FROM rooms WHERE id = ?', [roomId])
  if (!room || room.room_type_id !== line.room_type_id) throw problem(422, 'Choose a room of the reserved type', 'ROOM_MISMATCH')
  if (room.operational_status === 'OUT_OF_SERVICE') throw problem(409, 'That room is out of service', 'ROOM_BLOCKED')
  const clash = db.get(
    `SELECT br.id FROM booking_rooms br
     JOIN bookings b ON b.id = br.booking_id
     WHERE br.room_id = ? AND b.id != ? AND b.status IN ('CONFIRMED', 'CHECKED_IN')
       AND b.check_in < ? AND b.check_out > ?`,
    [room.id, booking.id, booking.check_out, booking.check_in],
  )
  if (clash) throw problem(409, 'That room is already assigned for these dates', 'ROOM_CONFLICT')
  db.run(`UPDATE booking_rooms SET room_id = ? WHERE id = ?`, [room.id, line.id])
  audit(actorUserId, 'booking.assign_room', 'booking', booking.id, { roomId: line.room_id }, { roomId: room.id })
  return presentBooking(booking.id)
}

function checkIn(bookingId, actorUserId, requestedRoomId) {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [bookingId])
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  if (booking.status !== 'CONFIRMED') throw problem(409, 'Only a confirmed reservation can be checked in', 'BOOKING_STATE')
  if (booking.check_in > db.hotelToday()) throw problem(422, 'Check-in opens on the arrival date', 'TOO_EARLY')
  const lines = db.all('SELECT * FROM booking_rooms WHERE booking_id = ?', [booking.id])
  lines.forEach((line, index) => {
    let room = line.room_id ? db.get('SELECT * FROM rooms WHERE id = ?', [line.room_id]) : null
    if (!room && requestedRoomId && index === 0) room = db.get('SELECT * FROM rooms WHERE id = ?', [requestedRoomId])
    if (!room) room = freeRoom(line.room_type_id, booking.check_in, booking.check_out, booking.id)
    if (!room || room.operational_status !== 'READY') throw problem(409, 'No ready room is available to assign', 'NO_READY_ROOM')
    assignRoom(line.id, room.id, actorUserId)
  })
  db.run(`UPDATE bookings SET status = 'CHECKED_IN' WHERE id = ?`, [booking.id])
  db.insert(
    `INSERT INTO booking_status_history (booking_id, old_status, new_status, actor_user_id, reason)
     VALUES (?, 'CONFIRMED', 'CHECKED_IN', ?, 'Guest checked in')`,
    [booking.id, actorUserId || null],
  )
  audit(actorUserId, 'booking.checkin', 'booking', booking.id, { status: 'CONFIRMED' }, { status: 'CHECKED_IN' })
  return presentBooking(booking.id)
}

function checkOut(bookingId, actorUserId) {
  const booking = db.get('SELECT * FROM bookings WHERE id = ?', [bookingId])
  if (!booking) throw problem(404, 'Reservation was not found', 'NOT_FOUND')
  if (booking.status !== 'CHECKED_IN') throw problem(409, 'Guest is not checked in', 'BOOKING_STATE')
  const lines = db.all('SELECT room_id FROM booking_rooms WHERE booking_id = ? AND room_id IS NOT NULL', [booking.id])
  db.run(`UPDATE bookings SET status = 'CHECKED_OUT' WHERE id = ?`, [booking.id])
  db.insert(
    `INSERT INTO booking_status_history (booking_id, old_status, new_status, actor_user_id, reason)
     VALUES (?, 'CHECKED_IN', 'CHECKED_OUT', ?, 'Guest checked out')`,
    [booking.id, actorUserId || null],
  )
  lines.forEach((line) => {
    db.run(`UPDATE rooms SET operational_status = 'DIRTY' WHERE id = ?`, [line.room_id])
    db.insert(
      `INSERT INTO housekeeping_tasks (room_id, status, priority, notes) VALUES (?, 'DIRTY', 'HIGH', 'Departure clean')`,
      [line.room_id],
    )
  })
  audit(actorUserId, 'booking.checkout', 'booking', booking.id, { status: 'CHECKED_IN' }, { status: 'CHECKED_OUT' })
  return presentBooking(booking.id)
}

function advanceHousekeeping(taskId, actorUserId) {
  const task = db.get('SELECT * FROM housekeeping_tasks WHERE id = ?', [taskId])
  if (!task) throw problem(404, 'Task was not found', 'NOT_FOUND')
  const order = ['DIRTY', 'CLEANING', 'INSPECTING', 'READY']
  const index = order.indexOf(task.status)
  if (index === -1 || index === order.length - 1) throw problem(409, 'Task is already complete', 'TASK_STATE')
  const next = order[index + 1]
  db.run(
    `UPDATE housekeeping_tasks SET status = ?, completed_at = CASE WHEN ? = 'READY' THEN datetime('now') ELSE completed_at END WHERE id = ?`,
    [next, next, task.id],
  )
  db.run(`UPDATE rooms SET operational_status = ? WHERE id = ?`, [next, task.room_id])
  audit(actorUserId, 'housekeeping.advance', 'housekeeping_task', task.id, { status: task.status }, { status: next })
  return db.get('SELECT * FROM housekeeping_tasks WHERE id = ?', [task.id])
}

function dashboard() {
  releaseExpiredHolds()
  const today = db.hotelToday()
  const month = today.slice(0, 7)
  const arrivals = db.all(
    `SELECT b.id FROM bookings b WHERE b.check_in = ? AND b.status IN ('CONFIRMED', 'CHECKED_IN')`,
    [today],
  )
  const departures = db.all(
    `SELECT b.id FROM bookings b WHERE b.check_out = ? AND b.status = 'CHECKED_IN'`,
    [today],
  )
  const inHouse = db.get(`SELECT COUNT(*) AS count FROM bookings WHERE status = 'CHECKED_IN'`).count
  const pending = db.get(`SELECT COUNT(*) AS count FROM bookings WHERE status = 'PENDING'`).count
  const rooms = db.all(`SELECT operational_status, COUNT(*) AS count FROM rooms GROUP BY operational_status`)
  const byStatus = Object.fromEntries(rooms.map((row) => [row.operational_status, row.count]))
  const sellable = db.get(`SELECT COUNT(*) AS count FROM rooms WHERE operational_status != 'OUT_OF_SERVICE'`).count
  const occupiedTonight = db.get(
    `SELECT COUNT(*) AS count FROM bookings WHERE status = 'CHECKED_IN'`,
  ).count
  const monthRevenue = db.get(
    `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM payments
     WHERE status IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED') AND substr(created_at, 1, 7) = ?`,
    [month],
  ).total
  const monthRefunds = db.get(
    `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds
     WHERE status = 'REFUNDED' AND substr(created_at, 1, 7) = ?`,
    [month],
  ).total
  return {
    today,
    arrivals: arrivals.length,
    departures: departures.length,
    inHouse,
    pending,
    rooms: {
      total: db.get('SELECT COUNT(*) AS count FROM rooms').count,
      ready: byStatus.READY || 0,
      dirty: byStatus.DIRTY || 0,
      cleaning: byStatus.CLEANING || 0,
      inspecting: byStatus.INSPECTING || 0,
      outOfService: byStatus.OUT_OF_SERVICE || 0,
    },
    occupancy: sellable ? Math.round((occupiedTonight / sellable) * 1000) / 10 : 0,
    monthRevenue: money(monthRevenue - monthRefunds),
    currency: settings().currency,
    alerts: {
      unpaidInHouse: db.get(
        `SELECT COUNT(*) AS count FROM bookings b
         WHERE b.status = 'CHECKED_IN'
           AND EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'UNPAID')`,
      ).count,
      pendingReviews: db.get(`SELECT COUNT(*) AS count FROM reviews WHERE moderation_status = 'PENDING'`).count,
      openMaintenance: db.get(`SELECT COUNT(*) AS count FROM maintenance_tickets WHERE status != 'RESOLVED'`).count,
      newMessages: db.get(`SELECT COUNT(*) AS count FROM contact_messages WHERE status = 'NEW'`).count,
    },
  }
}

function report(from, to) {
  const start = db.parseDate(from) || db.addDays(db.hotelToday(), -6)
  const end = db.parseDate(to) || db.hotelToday()
  if (end < start) throw problem(422, 'Report end date must be on or after the start date', 'INVALID_DATES')
  const nights = db.eachNight(start, db.addDays(end, 1))
  const sellable = db.get(`SELECT COUNT(*) AS count FROM rooms WHERE operational_status != 'OUT_OF_SERVICE'`).count
  const available = sellable * nights.length
  const soldRow = db.get(
    `SELECT COUNT(*) AS rooms_sold, COALESCE(SUM(bn.line_total_cents), 0) AS revenue
     FROM booking_nights bn
     JOIN booking_rooms br ON br.id = bn.booking_room_id
     JOIN bookings b ON b.id = br.booking_id
     WHERE bn.stay_date >= ? AND bn.stay_date <= ?
       AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')`,
    [start, end],
  )
  const discount = db.get(
    `SELECT COALESCE(SUM(discount_cents), 0) AS total FROM bookings
     WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
       AND check_in <= ? AND check_out > ?`,
    [end, start],
  ).total
  const roomRevenue = Math.max(0, soldRow.revenue - discount)
  const cancelled = db.get(
    `SELECT COUNT(*) AS count FROM bookings WHERE status = 'CANCELLED' AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?`,
    [start, end],
  ).count
  const sources = db.all(
    `SELECT source, COUNT(*) AS count FROM bookings
     WHERE status != 'CANCELLED' AND check_in <= ? AND check_out > ?
     GROUP BY source`,
    [end, start],
  )
  const collected = db.get(
    `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM payments
     WHERE status IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED')
       AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?`,
    [start, end],
  ).total
  const refunded = db.get(
    `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds
     WHERE status = 'REFUNDED' AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?`,
    [start, end],
  ).total
  return {
    from: start,
    to: end,
    currency: settings().currency,
    availableRoomNights: available,
    roomsSold: soldRow.rooms_sold,
    occupancy: available ? Math.round((soldRow.rooms_sold / available) * 1000) / 10 : 0,
    roomRevenue: money(roomRevenue),
    adr: soldRow.rooms_sold ? money(Math.round(roomRevenue / soldRow.rooms_sold)) : 0,
    revpar: available ? money(Math.round(roomRevenue / available)) : 0,
    cancellations: cancelled,
    sources,
    collected: money(collected),
    refunded: money(refunded),
    netCollected: money(collected - refunded),
  }
}

module.exports = {
  money,
  cents,
  settings,
  audit,
  notify,
  releaseExpiredHolds,
  availableQuantity,
  presentRoomType,
  roomTypeRow,
  searchAvailability,
  presentBooking,
  createBooking,
  confirmPayment,
  cancelBooking,
  assignRoom,
  checkIn,
  checkOut,
  advanceHousekeeping,
  dashboard,
  report,
  ACTIVE_STATUSES,
}
