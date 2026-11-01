const { spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')

function launch(args, cwd) {
  return spawn('npm', args, { cwd, stdio: 'inherit', shell: true })
}

const server = launch(['start'], path.join(root, 'backend'))
const web = launch(['start'], root)

function stop() {
  server.kill()
  web.kill()
}

process.on('SIGINT', () => {
  stop()
  process.exit(0)
})
process.on('SIGTERM', () => {
  stop()
  process.exit(0)
})
