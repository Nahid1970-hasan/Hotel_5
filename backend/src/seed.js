const bcrypt = require('bcryptjs')
const domain = require('./domain')

const IMG = {
  exterior: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80',
  lobby: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80',
  pool: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
  suite: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80',
  room: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
  twin: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1600&q=80',
  villa: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80',
  dining: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
  spa: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  tea: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
}

function weekday(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

async function seed(helpers) {
  const { get, insert, addDays, hotelToday } = helpers
  const permissions = [
    ['booking.read', 'View reservations'],
    ['booking.create', 'Create a reservation'],
    ['booking.modify', 'Change a reservation'],
    ['booking.cancel', 'Cancel a reservation'],
    ['booking.checkin', 'Check guests in and out'],
    ['room.manage', 'Manage rooms and inventory'],
    ['rate.manage', 'Manage rates and promotions'],
    ['payment.read', 'View payments'],
    ['payment.refund', 'Record a refund'],
    ['report.finance', 'View revenue reports'],
    ['user.manage', 'Manage staff accounts'],
    ['audit.read', 'Read the audit log'],
    ['content.manage', 'Edit the public website'],
    ['ops.manage', 'Housekeeping, maintenance and guest services'],
  ]
  const permissionIds = {}
  permissions.forEach(([key, description]) => {
    permissionIds[key] = insert('INSERT INTO permissions (permission_key, description) VALUES (?, ?)', [key, description])
  })

  const roleMap = {
    'Super Admin': permissions.map(([key]) => key),
    'Hotel Manager': ['booking.read', 'booking.create', 'booking.modify', 'booking.cancel', 'booking.checkin', 'room.manage', 'rate.manage', 'payment.read', 'report.finance', 'content.manage', 'ops.manage', 'audit.read'],
    'Front Desk': ['booking.read', 'booking.create', 'booking.modify', 'booking.cancel', 'booking.checkin', 'payment.read'],
    Housekeeping: ['ops.manage', 'booking.read'],
    Finance: ['payment.read', 'payment.refund', 'report.finance', 'booking.read'],
    'Content Manager': ['content.manage'],
  }
  const roleIds = {}
  Object.entries(roleMap).forEach(([name, keys]) => {
    const roleId = insert('INSERT INTO roles (name, description) VALUES (?, ?)', [name, `${name} access`])
    roleIds[name] = roleId
    keys.forEach((key) => insert('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permissionIds[key]]))
  })

  async function staff(name, email, password, role) {
    const id = insert(
      `INSERT INTO users (name, email, password_hash, kind, status) VALUES (?, ?, ?, 'staff', 'ACTIVE')`,
      [name, email, await bcrypt.hash(password, 10)],
    )
    insert('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleIds[role]])
    return id
  }

  await staff('Amira Rahman', 'amira.rahman@grandhorizon.hotel', 'Horizon#2026', 'Super Admin')
  const deskId = await staff('Karim Hossain', 'karim.hossain@grandhorizon.hotel', 'Desk#2026', 'Front Desk')
  await staff('Nusrat Ahmed', 'nusrat.ahmed@grandhorizon.hotel', 'House#2026', 'Housekeeping')
  const guestUserId = insert(
    `INSERT INTO users (name, email, password_hash, phone, kind, status) VALUES (?, ?, ?, ?, 'guest', 'ACTIVE')`,
    ['Lina Moreau', 'lina.moreau@example.com', await bcrypt.hash('Guest#2026', 10), '+33 6 12 44 90 18'],
  )

  insert(
    `INSERT INTO hotel_settings (
      id, name, tagline, description, address, city, country, phone, email, timezone, currency,
      check_in_time, check_out_time, tax_percent, service_fee_percent, hold_minutes
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Dhaka', 'USD', '15:00', '12:00', 15, 10, 15)`,
    [
      'Grand Horizon Luxury Hotel',
      'A quiet five-star shore on the Bay of Bengal.',
      'Grand Horizon sits on Marine Drive in Cox\'s Bazar, with long views of the bay, a still pool court, and rooms arranged for unhurried stays.',
      'Marine Drive, Kolatoli, Cox\'s Bazar 4700',
      'Cox\'s Bazar',
      'Bangladesh',
      '+880 1841 000 221',
      'stay@grandhorizon.hotel',
    ],
  )

  const amenityNames = ['Ocean view', 'King bed', 'Twin beds', 'Private balcony', 'Rain shower', 'Soaking tub', 'Lounge access', 'Work desk', 'Child rollaway', 'Garden terrace', 'Butler on request']
  const amenityIds = {}
  amenityNames.forEach((name) => {
    amenityIds[name] = insert('INSERT INTO amenities (name) VALUES (?)', [name])
  })

  const types = [
    {
      name: 'Deluxe King Ocean',
      slug: 'deluxe-king-ocean',
      summary: 'A calm king room with a balcony toward the bay.',
      description: 'Woven textures, a king bed, and a balcony deep enough for morning tea. The bathroom has a rain shower and a dressing niche.',
      adults: 2,
      children: 1,
      bed: '1 king',
      size: 42,
      view: 'Ocean',
      category: 'Room',
      price: 22000,
      access: 'Step-free on request for selected ground-adjacent rooms.',
      amenities: ['Ocean view', 'King bed', 'Private balcony', 'Rain shower', 'Work desk'],
      images: [
        [IMG.room, 'Deluxe king room with white linen and warm wood'],
        [IMG.beach, 'Balcony view toward the shoreline'],
      ],
      rooms: ['305', '306', '405', '406'],
    },
    {
      name: 'Premier Twin Garden',
      slug: 'premier-twin-garden',
      summary: 'Two twin beds opening onto the inner garden.',
      description: 'A quieter room for friends or colleagues, with twin beds, a shared writing desk, and shutters toward the garden court.',
      adults: 2,
      children: 1,
      bed: '2 twin',
      size: 38,
      view: 'Garden',
      category: 'Room',
      price: 18000,
      access: 'Wider door on room 214.',
      amenities: ['Twin beds', 'Work desk', 'Rain shower'],
      images: [
        [IMG.twin, 'Twin bedroom with garden light'],
        [IMG.lobby, 'Hotel courtyard beyond the room'],
      ],
      rooms: ['210', '212', '214', '216'],
    },
    {
      name: 'Horizon Suite',
      slug: 'horizon-suite',
      summary: 'A separate sitting room and a deep ocean balcony.',
      description: 'The suite keeps sleeping and sitting apart. A soaking tub faces the horizon, and lounge access is included each afternoon.',
      adults: 3,
      children: 1,
      bed: '1 king',
      size: 68,
      view: 'Ocean panorama',
      category: 'Suite',
      price: 42000,
      access: 'Roll-in shower available in suite 501.',
      amenities: ['Ocean view', 'King bed', 'Private balcony', 'Soaking tub', 'Lounge access'],
      images: [
        [IMG.suite, 'Suite sitting room with ocean light'],
        [IMG.exterior, 'Hotel frontage above the beach'],
      ],
      rooms: ['501', '502', '601'],
    },
    {
      name: 'Family Residence',
      slug: 'family-residence',
      summary: 'Two sleeping rooms and space for a longer family stay.',
      description: 'A king room and a twin room share a small hall. A rollaway can be added, and the balcony holds a low table for evening fruit.',
      adults: 4,
      children: 2,
      bed: '1 king and 2 twin',
      size: 75,
      view: 'Ocean',
      category: 'Residence',
      price: 36000,
      access: 'Connecting layout with a step at the balcony.',
      amenities: ['Ocean view', 'King bed', 'Twin beds', 'Child rollaway', 'Private balcony'],
      images: [
        [IMG.suite, 'Family residence living area'],
        [IMG.room, 'Second sleeping room with twin beds'],
      ],
      rooms: ['410', '412'],
    },
    {
      name: 'Garden Villa',
      slug: 'garden-villa',
      summary: 'A detached villa with a private terrace.',
      description: 'Set back from the main house, the villa has its own terrace, an outdoor rinse, and a king room that can be closed off from the sitting room.',
      adults: 2,
      children: 1,
      bed: '1 king',
      size: 90,
      view: 'Garden',
      category: 'Villa',
      price: 51000,
      access: 'Single step at the terrace. Staff can arrange a portable ramp.',
      amenities: ['Garden terrace', 'King bed', 'Soaking tub', 'Butler on request'],
      images: [
        [IMG.villa, 'Garden villa terrace in late light'],
        [IMG.pool, 'Pool court shared with villa guests'],
      ],
      rooms: ['V1', 'V2'],
    },
  ]

  types.forEach((type, index) => {
    const id = insert(
      `INSERT INTO room_types (
        name, slug, summary, description, capacity_adults, capacity_children, bed_config, size_sqm,
        view_name, category, base_price_cents, currency, accessibility, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?, ?)`,
      [type.name, type.slug, type.summary, type.description, type.adults, type.children, type.bed, type.size, type.view, type.category, type.price, type.access, index + 1],
    )
    type.amenities.forEach((name) => insert('INSERT INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)', [id, amenityIds[name]]))
    type.images.forEach(([url, alt], imageIndex) => insert('INSERT INTO room_images (room_type_id, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)', [id, url, alt, imageIndex]))
    type.rooms.forEach((number, roomIndex) => {
      const floor = number.startsWith('V') ? 'Garden' : number[0]
      insert(
        `INSERT INTO rooms (room_number, room_type_id, floor, wing, operational_status, accessible) VALUES (?, ?, ?, ?, 'READY', ?)`,
        [number, id, floor, number.startsWith('V') ? 'Villas' : 'Main', roomIndex === 0 ? 1 : 0],
      )
    })
    type.id = id
  })

  insert(`UPDATE rooms SET operational_status = 'OUT_OF_SERVICE', notes = 'Balcony latch repair' WHERE room_number = '406'`)
  const blockedRoom = get(`SELECT id FROM rooms WHERE room_number = '406'`)
  insert(
    `INSERT INTO maintenance_tickets (room_id, issue, severity, status, blocks_inventory, notes) VALUES (?, ?, 'MEDIUM', 'OPEN', 1, ?)`,
    [blockedRoom.id, 'Balcony door latch does not catch', 'Room blocked until the latch is replaced'],
  )

  const flexible = insert(
    `INSERT INTO cancellation_policies (name, summary, hours_before, fee_percent) VALUES (?, ?, 48, 100)`,
    ['Flexible', 'Free cancellation until 48 hours before 15:00 check-in. After that the stay is charged.'],
  )
  const breakfast = insert(
    `INSERT INTO cancellation_policies (name, summary, hours_before, fee_percent) VALUES (?, ?, 72, 50)`,
    ['Bed and breakfast', 'Free cancellation until 72 hours before check-in. Later cancellations keep a 50% fee.'],
  )
  const locked = insert(
    `INSERT INTO cancellation_policies (name, summary, hours_before, fee_percent) VALUES (?, ?, 0, 100)`,
    ['Non-refundable', 'This rate is non-refundable once the reservation is confirmed.'],
  )
  const plans = [
    [insert(`INSERT INTO rate_plans (name, meal_plan, cancellation_policy_id, price_adjust_percent, description) VALUES ('Flexible Rate', 'Room only', ?, 0, 'Changeable room-only rate.')`, [flexible]), 0],
    [insert(`INSERT INTO rate_plans (name, meal_plan, cancellation_policy_id, price_adjust_percent, description) VALUES ('Bed & Breakfast', 'Breakfast for two', ?, 18, 'Breakfast at Horizon Grill is included each morning.')`, [breakfast]), 18],
    [insert(`INSERT INTO rate_plans (name, meal_plan, cancellation_policy_id, price_adjust_percent, description) VALUES ('Advance Saver', 'Room only', ?, -12, 'Lower rate kept only if the stay is not cancelled.')`, [locked]), -12],
  ]

  const today = hotelToday()
  types.forEach((type) => {
    for (let offset = -5; offset <= 50; offset += 1) {
      const stayDate = addDays(today, offset)
      const weekend = weekday(stayDate) === 5 || weekday(stayDate) === 6
      plans.forEach(([planId, adjust]) => {
        const price = Math.round(type.price * (1 + adjust / 100) * (weekend ? 1.12 : 1))
        insert(
          `INSERT INTO room_rates (room_type_id, rate_plan_id, stay_date, currency, nightly_price_cents) VALUES (?, ?, ?, 'USD', ?)`,
          [type.id, planId, stayDate, price],
        )
      })
    }
  })

  insert(
    `INSERT INTO promotions (code, name, discount_type, discount_value, terms) VALUES ('CORAL10', 'Coral return', 'percent', 10, '10% off the room subtotal. One code per stay.')`,
  )
  insert(
    `INSERT INTO promotions (code, name, discount_type, discount_value, terms) VALUES ('STAY4', 'Fourth night', 'free_night', 4, 'Stay four nights or more and the lowest night is removed from the room subtotal.')`,
  )

  const facilities = [
    ['Infinity pool', 'A long pool on the bay side, with shaded daybeds and a rinse beside the stair.', '07:00–19:00', 'Children under 12 swim with an adult.', IMG.pool],
    ['Shore spa', 'Treatment rooms for oil massage, a quiet steam room, and a tea corner after.', '10:00–20:00', 'Book at least a day ahead in season.', IMG.spa],
    ['Gym', 'Cardio, free weights, and a stretch bay. Towels are at the door.', '06:00–21:00', 'Guests only. Trainers by request.', IMG.gym],
    ['Meeting room', 'A 24-seat room with a long table, blackout shades, and a sideboard for coffee.', '08:00–18:00', 'Ask reservations to hold the room.', IMG.lobby],
  ]
  facilities.forEach((item, index) => {
    insert(
      `INSERT INTO facilities (name, description, hours, booking_note, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [...item, index + 1],
    )
  })

  ;[
    ['Horizon Grill', 'Bay seafood and grill', 'The house restaurant. Catch of the day, grilled vegetables, and a short local rice list.', '07:00–10:30, 12:30–15:00, 18:30–22:30', 'Smart casual after 18:30', 'Kitchen can prepare nut-free and vegetarian plates when told in advance.', IMG.dining],
    ['The Tea Room', 'Tea and pastry', 'A small room off the lobby for afternoon tea, fresh juice, and quiet work.', '11:00–18:00', 'No dress code', 'Dairy-free cakes are marked on the daily card.', IMG.tea],
    ['Coral Bar', 'Sundowner', 'Low tables facing the pool. Juices, tea, and a short list of drinks.', '16:00–23:00', 'Resort wear', 'Ask for the zero-proof list.', IMG.pool],
  ].forEach((item) => {
    insert(
      `INSERT INTO dining_venues (name, cuisine, description, hours, dress_code, dietary_notes, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      item,
    )
  })

  ;[
    ['Himchari sunset', 'A slow drive to the Himchari viewpoint and time to watch the bay change colour.', '4 hours', 'Car, guide, bottled water', 'Meals and park fees if introduced later', 'Departs 15:00', 6, 8500, IMG.beach],
    ['Inani morning walk', 'A guided walk on Inani Beach while the sand is still cool.', '3 hours', 'Guide, water, hotel transfer', 'Meals', 'Departs 07:30', 8, 4500, IMG.beach],
    ['Market and cook', 'A morning in the fish market with the grill chef, then a tasting back at the hotel.', '5 hours', 'Market visit, tasting, transfer', 'Purchases you choose to keep', 'Tuesday and Friday, 08:00', 4, 12000, IMG.dining],
  ].forEach((item) => {
    insert(
      `INSERT INTO experiences (name, description, duration, inclusions, exclusions, schedule, capacity, price_cents, currency, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USD', ?)`,
      item,
    )
  })

  insert(
    `INSERT INTO offers (title, slug, summary, terms, discount_label, valid_from, valid_to, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Fourth night on the house', 'fourth-night', 'Stay four nights and the lowest room night comes off the subtotal.', 'Use code STAY4. Not combined with other codes. Blackout dates can be added by the hotel.', 'Code STAY4', today, addDays(today, 120), IMG.suite],
  )
  insert(
    `INSERT INTO offers (title, slug, summary, terms, discount_label, valid_from, valid_to, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Return to the bay', 'coral-return', 'Ten percent off a new stay for guests who have stayed with us before.', 'Use code CORAL10 at checkout. The hotel may ask for the earlier booking reference.', 'Code CORAL10', today, addDays(today, 90), IMG.exterior],
  )

  ;[
    ['Hotel', IMG.exterior, 'Grand Horizon from the beach side'],
    ['Hotel', IMG.lobby, 'Lobby with day light and stone floor'],
    ['Rooms', IMG.suite, 'Horizon suite sitting room'],
    ['Rooms', IMG.room, 'King bedroom dressed in ivory linen'],
    ['Dining', IMG.dining, 'Horizon Grill table setting'],
    ['Pool', IMG.pool, 'Pool court facing the bay'],
    ['Spa', IMG.spa, 'Spa treatment room'],
    ['Destination', IMG.beach, 'Shoreline south of the hotel'],
  ].forEach((item, index) => {
    insert('INSERT INTO gallery_images (category, image_url, alt_text, sort_order) VALUES (?, ?, ?, ?)', [...item, index])
  })

  ;[
    ['Beach', 'Laboni and Kolatoli Beach', 'The main town beach is a short walk north. Mornings are the easiest time to walk.', '10 minutes on foot', IMG.beach],
    ['Viewpoint', 'Himchari', 'A green headland and waterfall lookout south of the hotel.', 'About 35 minutes by car', IMG.exterior],
    ['Island', 'Maheshkhali', 'A day on the island is possible with a hotel car to the jetty and a local boat.', 'About 1 hour to the jetty', IMG.beach],
    ['Airport', 'Cox\'s Bazar Airport', 'The hotel car meets domestic flights. Share the flight number on the booking.', 'About 25 minutes by car', IMG.lobby],
  ].forEach((item) => insert('INSERT INTO attractions (name, category, description, travel_time, image_url) VALUES (?, ?, ?, ?, ?)', [item[1], item[0], item[2], item[3], item[4]]))

  ;[
    ['Booking', 'Do I need an account to book?', 'No. You can reserve as a guest. An account lets you see upcoming stays and send requests.'],
    ['Booking', 'When is check-in and check-out?', 'Check-in is from 15:00 and check-out is by 12:00, hotel time (Asia/Dhaka).'],
    ['Payment', 'Do you store my card number?', 'No. Pay-at-hotel keeps the reservation without a card. The sample card flow confirms payment on the server and never asks for a card number or CVV.'],
    ['Cancellation', 'Can I cancel?', 'It depends on the rate you chose. Flexible and breakfast rates have a free window. Advance Saver is non-refundable after confirmation.'],
    ['Children', 'Can children stay?', 'Yes, within the occupancy shown on the room. Extra cots can be requested and are subject to the room.'],
    ['Arrival', 'How do I reach the hotel from the airport?', 'Ask for a car in special requests and include the flight number. The drive is about 25 minutes.'],
  ].forEach((item, index) => insert('INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)', [...item, index]))

  insert('INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)', [
    'about',
    'The house by the bay',
    'Grand Horizon was planned as a low building behind a line of trees, close enough to hear the water and far enough from the busiest part of the beach.\n\nThe rooms face either the bay or the inner garden. We keep the public rooms quiet after dinner, and the pool closes before the evening seating at the grill.\n\nWe buy fish from the morning market, change linen on departure, and limit single-use plastic in the rooms. Certifications are published here only after the hotel has the document in hand.',
  ])
  insert('INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)', [
    'booking-policy',
    'Booking and cancellation',
    'A reservation is confirmed when you choose pay-at-hotel, or when a card payment is verified by the server. Choosing a rate does not confirm the stay by itself.\n\nPrices shown before payment are calculated by the hotel system from the dates, rate plan, taxes, and service charge stored for the property. A later price change does not rewrite a confirmed stay.\n\nCancellation follows the rate plan you selected. Refunds, when due, are recorded against the original payment. Pay-at-hotel stays that are cancelled inside the free window are released without a charge.',
  ])
  insert('INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)', [
    'privacy-policy',
    'Privacy',
    'We collect the name, email, phone, and stay details needed to hold a room and to reach you about that stay.\n\nStaff see guest records only inside their role. Payment screens do not ask for a full card number or CVV.\n\nThis text is a working policy for the project and should be reviewed by the hotel before a public launch.',
  ])
  insert('INSERT INTO pages (slug, title, body) VALUES (?, ?, ?)', [
    'terms',
    'Website terms',
    'The website is the direct booking channel for one hotel, Grand Horizon Luxury Hotel, Cox\'s Bazar.\n\nAvailability can change until the reservation is confirmed. If two guests reach the last room together, the server keeps only the reservation that is stored first.\n\nHouse rules, local taxes, and these terms can be updated by the hotel. The copy on this page is the copy that was published in the system.',
  ])

  ;[
    ['Airport car', 'Transport', 'Private car to or from Cox\'s Bazar Airport.', 3500],
    ['Baby cot', 'Room', 'A cot for a child, when the room can take it.', 0],
    ['Celebration table', 'Occasion', 'A small cake and a set table in the room.', 4500],
    ['Spa hour', 'Spa', 'A sixty-minute treatment. Time confirmed by the spa.', 9000],
  ].forEach((item) => {
    insert(
      `INSERT INTO service_catalog (name, category, description, price_cents, currency) VALUES (?, ?, ?, ?, 'USD')`,
      item,
    )
  })

  const flexiblePlan = get(`SELECT id FROM rate_plans WHERE name = 'Flexible Rate'`)
  const deluxe = get(`SELECT id FROM room_types WHERE slug = 'deluxe-king-ocean'`)
  const suite = get(`SELECT id FROM room_types WHERE slug = 'horizon-suite'`)

  const past = domain.createBooking(
    {
      roomTypeId: deluxe.id,
      ratePlanId: flexiblePlan.id,
      checkIn: addDays(today, -4),
      checkOut: addDays(today, -1),
      adults: 2,
      children: 0,
      rooms: 1,
      method: 'pay_at_hotel',
      guest: { name: 'Lina Moreau', email: 'lina.moreau@example.com', phone: '+33 6 12 44 90 18', nationality: 'France' },
    },
    { allowPast: true, userId: guestUserId, source: 'website', actorUserId: deskId },
  )
  helpers.run(`UPDATE payments SET status = 'PAID' WHERE id = ?`, [past.paymentId])
  domain.checkIn(past.booking.id, deskId)
  domain.checkOut(past.booking.id, deskId)
  insert(
    `INSERT INTO reviews (booking_id, guest_id, guest_name, rating, title, comment, moderation_status, response) VALUES (?, ?, ?, 5, ?, ?, 'APPROVED', ?)`,
    [
      past.booking.id,
      past.booking.guest.id,
      'Lina Moreau',
      'Quiet, even in the evening',
      'The room faced the water and the grill kept a table for us without a fuss. We walked to the beach before breakfast.',
      'Thank you, Lina. We kept your balcony preference on file.',
    ],
  )

  const staying = domain.createBooking(
    {
      roomTypeId: suite.id,
      ratePlanId: flexiblePlan.id,
      checkIn: addDays(today, -1),
      checkOut: addDays(today, 2),
      adults: 2,
      children: 0,
      rooms: 1,
      method: 'pay_at_hotel',
      specialRequests: 'High floor if possible.',
      guest: { name: 'Owen Clarke', email: 'owen.clarke@example.com', phone: '+44 7700 900182', nationality: 'United Kingdom' },
    },
    { allowPast: true, source: 'phone', actorUserId: deskId },
  )
  helpers.run(`UPDATE payments SET status = 'PAID', provider = 'sandbox', provider_reference = ? WHERE id = ?`, [`sbx_${staying.booking.reference}`, staying.paymentId])
  domain.checkIn(staying.booking.id, deskId)

  domain.createBooking(
    {
      roomTypeId: deluxe.id,
      ratePlanId: flexiblePlan.id,
      checkIn: today,
      checkOut: addDays(today, 3),
      adults: 2,
      children: 1,
      rooms: 1,
      method: 'pay_at_hotel',
      specialRequests: 'Airport pickup, flight BS 123, arriving 13:10.',
      guest: { name: 'Sofia Rahman', email: 'sofia.rahman@example.com', phone: '+880 1711 220 018' },
    },
    { source: 'website', actorUserId: deskId },
  )

  domain.createBooking(
    {
      roomTypeId: suite.id,
      ratePlanId: flexiblePlan.id,
      checkIn: addDays(today, 12),
      checkOut: addDays(today, 16),
      adults: 2,
      children: 0,
      rooms: 1,
      method: 'pay_at_hotel',
      promoCode: 'STAY4',
      guest: { name: 'Lina Moreau', email: 'lina.moreau@example.com', phone: '+33 6 12 44 90 18', nationality: 'France' },
    },
    { userId: guestUserId, source: 'website' },
  )

  insert(
    `INSERT INTO contact_messages (name, email, phone, topic, message) VALUES (?, ?, ?, ?, ?)`,
    ['Noah Bennett', 'noah.bennett@example.com', '+1 415 555 0148', 'Wedding lunch', 'We are twelve people looking at a lunch in the grill on a Friday in December. Please tell us if the room can close for two hours.'],
  )

  insert(
    `INSERT INTO reviews (guest_name, rating, title, comment, moderation_status) VALUES ('Pending guest', 4, 'Waiting for a look', 'The pool was calm and the room was ready early. Posting this as a sample for moderation.', 'PENDING')`,
  )
}

module.exports = { seed }
