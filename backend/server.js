const db = require('./src/db')
const { seed } = require('./src/seed')
const { createApp } = require('./src/app')

const port = Number(process.env.PORT || 4000)

db.init(seed)
  .then(() => {
    const app = createApp()
    app.listen(port, () => {
      console.log(`Grand Horizon API listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
