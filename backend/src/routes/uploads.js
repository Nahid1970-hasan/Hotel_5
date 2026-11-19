const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Router } = require('express')
const multer = require('multer')
const { requireUser, requirePermission } = require('../auth')
const { problem, send } = require('../http')

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const types = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomBytes(16).toString('hex')}${types[file.mimetype]}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (types[file.mimetype]) callback(null, true)
    else callback(new Error('Upload a JPG, PNG, WEBP, or GIF image'))
  },
})

function receiveFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    const tooLarge = error.code === 'LIMIT_FILE_SIZE'
    return next(problem(422, tooLarge ? 'Image must be 5 MB or smaller' : error.message, 'INVALID'))
  })
}

const router = Router()
router.use(requireUser('staff'))
router.use(requirePermission('content.manage', 'room.manage'))
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

router.post('/', receiveFile, wrap((req, res) => {
  if (!req.file) throw problem(422, 'Choose an image to upload', 'INVALID')
  send(res, {
    url: `/api/v1/uploads/${req.file.filename}`,
    name: req.file.originalname,
  }, 'Image uploaded', 201)
}))

function sendUpload(req, res) {
  const name = path.basename(String(req.params.name || ''))
  if (!name || name !== req.params.name) {
    return res.status(404).json({ success: false, message: 'File was not found', error: { code: 'NOT_FOUND', details: [] } })
  }
  const file = path.join(uploadDir, name)
  if (!file.startsWith(uploadDir) || !fs.existsSync(file)) {
    return res.status(404).json({ success: false, message: 'File was not found', error: { code: 'NOT_FOUND', details: [] } })
  }
  return res.sendFile(file)
}

module.exports = { router, sendUpload }
