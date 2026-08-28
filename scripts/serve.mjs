import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, normalize } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PORT = Number(process.env.PORT) || 4321
const TYPES = { '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.js':'text/javascript', '.json':'application/json' }

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = resolve(ROOT, '.' + normalize(path))
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => console.log('serving', ROOT, `on http://localhost:${PORT}`))
