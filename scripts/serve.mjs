import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, normalize } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PORT = Number(process.env.PORT) || 4321
const TYPES = { '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.js':'text/javascript', '.json':'application/json' }

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  // 주소만 열면(`/`) 폴더라 읽을 파일이 없습니다. 배포된 사이트처럼 index.html 을 보여줍니다.
  if (path.endsWith('/')) path += 'index.html'
  const file = resolve(ROOT, '.' + normalize(path))
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => console.log('serving', ROOT, `on http://localhost:${PORT}`))
