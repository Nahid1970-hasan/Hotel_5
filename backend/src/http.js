const { randomUUID } = require('crypto')

function problem(status, message, code, details) {
  const error = new Error(message)
  error.status = status
  error.code = code || 'REQUEST_ERROR'
  error.details = details || []
  return error
}

function send(res, data, message, status = 200) {
  res.status(status).json({ success: true, message, data })
}

function requestContext(req, res, next) {
  req.id = req.get('x-request-id') || randomUUID()
  res.setHeader('x-request-id', req.id)
  next()
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Unexpected server error' : err.message,
    error: {
      code: err.code || 'SERVER_ERROR',
      details: err.details || [],
    },
    requestId: req.id,
  })
}

module.exports = { problem, send, requestContext, errorHandler }
