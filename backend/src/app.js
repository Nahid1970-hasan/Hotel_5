const express = require('express')
const cors = require('cors')
const publicRoutes = require('./routes/public')
const guestRoutes = require('./routes/guest')
const adminRoutes = require('./routes/admin')
const { requestContext, errorHandler } = require('./http')

function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use(requestContext)
  app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, message: 'Grand Horizon API is running', data: { ok: true } })
  })
  app.use('/api/v1', publicRoutes)
  app.use('/api/v1', guestRoutes)
  app.use('/api/v1/admin', adminRoutes)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint was not found',
      error: { code: 'NOT_FOUND', details: [] },
      requestId: req.id,
    })
  })
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
