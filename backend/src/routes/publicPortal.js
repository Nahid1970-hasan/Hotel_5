const { Router } = require('express')
const db = require('../db')
const domain = require('../domain')
const { requireUser, requirePermission } = require('../auth')
const { problem, send } = require('../http')

const SECTIONS = ['rooms-and-suites', 'dining', 'experiences', 'facilities', 'offers', 'gallery', 'destination', 'contact']

const router = Router()
router.use(requireUser('staff'))
router.use(requirePermission('content.manage'))
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function parseDetails(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    return {}
  }
}

function present(row) {
  return {
    id: row.id,
    section: row.section,
    title: row.title,
    summary: row.summary || '',
    imageUrl: row.image_url || '',
    details: parseDetails(row.details),
    status: row.status,
    rejectionNote: row.rejection_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
  }
}

function sectionOf(value) {
  const section = String(value || '')
  if (!SECTIONS.includes(section)) throw problem(404, 'That public section was not found', 'NOT_FOUND')
  return section
}

function itemOf(section, id) {
  const row = db.get(`SELECT * FROM public_portal_items WHERE id = ? AND section = ?`, [Number(id), section])
  if (!row) throw problem(404, 'That item was not found', 'NOT_FOUND')
  return row
}

function readBody(body) {
  const title = String(body.title || '').trim()
  const summary = String(body.summary || '').trim()
  const imageUrl = String(body.imageUrl || body.image_url || '').trim()
  const details = parseDetails(body.details)
  if (title.length < 2) throw problem(422, 'A title is required', 'INVALID')
  return { title, summary, imageUrl, details: JSON.stringify(details) }
}

function publicRows(section) {
  return db.all(
    `SELECT * FROM public_portal_items WHERE section = ? AND status = 'APPROVED' ORDER BY id`,
    [section],
  )
}

function asDining(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    name: row.title,
    cuisine: details.cuisine || '',
    description: row.summary || '',
    hours: details.hours || '',
    dress_code: details.dressCode || '',
    dietary_notes: details.dietaryNotes || '',
    image_url: row.image_url || '',
  }
}

function asFacility(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    name: row.title,
    description: row.summary || '',
    hours: details.hours || '',
    booking_note: details.bookingNote || '',
    image_url: row.image_url || '',
  }
}

function asExperience(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    name: row.title,
    description: row.summary || '',
    duration: details.duration || '',
    inclusions: details.inclusions || '',
    exclusions: details.exclusions || '',
    schedule: details.schedule || '',
    capacity: details.capacity || '',
    price: Number(details.price) || 0,
    currency: details.currency || 'USD',
    image_url: row.image_url || '',
  }
}

function asOffer(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    title: row.title,
    slug: details.slug || '',
    summary: row.summary || '',
    terms: details.terms || '',
    discount_label: details.discountLabel || '',
    valid_from: details.validFrom || '',
    valid_to: details.validTo || '',
    active: 1,
    image_url: row.image_url || '',
  }
}

function asGallery(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    category: details.category || 'Gallery',
    image_url: row.image_url || '',
    alt_text: details.altText || row.title,
  }
}

function asDestination(row) {
  const details = parseDetails(row.details)
  return {
    id: row.id,
    name: row.title,
    category: details.category || '',
    description: row.summary || '',
    travel_time: details.travelTime || '',
    image_url: row.image_url || '',
  }
}

function asCard(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary || '',
    imageUrl: row.image_url || '',
    ...parseDetails(row.details),
  }
}

router.get('/:section', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const rows = db.all(`SELECT * FROM public_portal_items WHERE section = ? ORDER BY id DESC`, [section])
  const counts = { DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REJECTED: 0 }
  rows.forEach((row) => {
    counts[row.status] = (counts[row.status] || 0) + 1
  })
  send(res, { section, counts, items: rows.map(present) }, 'Public portal items retrieved')
}))

router.post('/:section', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const input = readBody(req.body)
  const id = db.transaction(() => {
    const itemId = db.insert(
      `INSERT INTO public_portal_items (section, title, summary, image_url, details, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'DRAFT', ?)`,
      [section, input.title, input.summary, input.imageUrl, input.details, req.user.id],
    )
    domain.audit(req.user.id, 'portal.create', 'public_portal_item', itemId, null, { section, title: input.title })
    return itemId
  })
  send(res, present(db.get(`SELECT * FROM public_portal_items WHERE id = ?`, [id])), 'Draft saved', 201)
}))

router.patch('/:section/:id', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const row = itemOf(section, req.params.id)
  const input = readBody(req.body)
  db.transaction(() => {
    db.run(
      `UPDATE public_portal_items
       SET title = ?, summary = ?, image_url = ?, details = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [input.title, input.summary, input.imageUrl, input.details, row.id],
    )
    domain.audit(req.user.id, 'portal.update', 'public_portal_item', row.id, { title: row.title }, { title: input.title })
  })
  send(res, present(db.get(`SELECT * FROM public_portal_items WHERE id = ?`, [row.id])), 'Item updated')
}))

router.delete('/:section/:id', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const row = itemOf(section, req.params.id)
  db.transaction(() => {
    db.run(`DELETE FROM public_portal_items WHERE id = ?`, [row.id])
    domain.audit(req.user.id, 'portal.delete', 'public_portal_item', row.id, { title: row.title, status: row.status }, null)
  })
  send(res, { id: row.id }, 'Item deleted')
}))

router.post('/:section/:id/submit', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const row = itemOf(section, req.params.id)
  if (!['DRAFT', 'REJECTED'].includes(row.status)) throw problem(422, 'Only a draft or a rejected item can be submitted', 'INVALID')
  db.transaction(() => {
    db.run(
      `UPDATE public_portal_items
       SET status = 'SUBMITTED', submitted_at = datetime('now'), rejection_note = NULL, updated_at = datetime('now')
       WHERE id = ?`,
      [row.id],
    )
    domain.audit(req.user.id, 'portal.submit', 'public_portal_item', row.id, { status: row.status }, { status: 'SUBMITTED' })
  })
  send(res, present(db.get(`SELECT * FROM public_portal_items WHERE id = ?`, [row.id])), 'Submitted for approval')
}))

router.post('/:section/:id/approval', wrap((req, res) => {
  const section = sectionOf(req.params.section)
  const row = itemOf(section, req.params.id)
  const decision = String(req.body.status || req.body.decision || '').toUpperCase()
  if (row.status !== 'SUBMITTED') throw problem(422, 'Submit the item before approval', 'INVALID')
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw problem(422, 'Approval must be APPROVED or REJECTED', 'INVALID')
  const note = String(req.body.note || '').trim()
  db.transaction(() => {
    db.run(
      `UPDATE public_portal_items
       SET status = ?, rejection_note = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [decision, decision === 'REJECTED' ? note || null : null, req.user.id, row.id],
    )
    domain.audit(req.user.id, 'portal.approval', 'public_portal_item', row.id, { status: row.status }, { status: decision })
  })
  const message = decision === 'APPROVED' ? 'Item approved' : 'Item rejected'
  send(res, present(db.get(`SELECT * FROM public_portal_items WHERE id = ?`, [row.id])), message)
}))

module.exports = {
  router,
  SECTIONS,
  publicRows,
  asDining,
  asFacility,
  asExperience,
  asOffer,
  asGallery,
  asDestination,
  asCard,
}
