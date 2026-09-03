/**
 * HTML 이 참조하는 로컬 CSS·JS 링크에 내용 해시를 붙인다.
 *
 * GitHub Pages 는 정적 파일에 캐시 헤더를 붙여 내보내서, 파일을 고쳐 배포해도
 * 브라우저가 한동안 옛 파일을 계속 씁니다. 이름이 그대로라 새 파일인 줄 모르기 때문입니다.
 * 그래서 내용이 바뀌면 URL 도 바뀌도록 ?v=<해시> 를 붙입니다.
 *
 * 타임스탬프가 아니라 내용 해시인 이유는, 바뀐 게 없으면 URL 도 그대로여야
 * 매 빌드마다 git diff 가 생기지 않기 때문입니다.
 *
 * 실행: node scripts/stamp-assets.mjs   (npm run build 에 포함)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINK = /(href|src)="\.\/((?:build|components|fonts)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g
/** 동적 import 는 속성이 아니라 코드 안에 있어 따로 잡아야 합니다. 놓치면 JS 만 옛 버전이 남습니다. */
const DYNAMIC_IMPORT = /import\('\.\/((?:build|components)\/[^'?]+\.js)(?:\?v=[^']*)?'\)/g

/**
 * 모듈이 모듈을 부르는 자리 — `import { … } from './products.js'`.
 *
 * 여기를 빼먹으면 배포 직후 화면이 빈 채로 뜹니다. HTML 이 부르는 find.js 는
 * 이름이 바뀌어 새로 받아오는데, 그 안에서 부르는 products.js 는 이름이 그대로라
 * 브라우저·CDN 이 10분 동안 옛 파일을 그대로 씁니다. 새 find.js 가 옛
 * products.js 에 없는 것을 꺼내려다 모듈이 통째로 멈추고, 목록도 조건 바도
 * 그려지지 않습니다.
 */
const STATIC_IMPORT = /(from\s+')(\.\/[^'?]+\.js)(?:\?v=[^']*)?(')/g

const hashes = new Map()
const hashOf = (abs) => {
  if (!hashes.has(abs)) {
    hashes.set(abs, createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 8))
  }
  return hashes.get(abs)
}

let stamped = 0

/* JS 는 부르는 쪽보다 불리는 쪽을 먼저 손봅니다. 안쪽 파일에 해시를 붙이면 그
   파일의 내용이 바뀌고, 따라서 해시도 바뀌기 때문입니다 — 깊은 곳부터 확정한
   뒤에야 그것을 부르는 파일의 해시가 의미를 갖습니다. */
const done = new Set()
const seen = new Set()

function stampModule(abs) {
  if (done.has(abs)) return
  if (seen.has(abs)) return // 순환 import — 한 번만 지나갑니다.
  seen.add(abs)

  const before = readFileSync(abs, 'utf8')
  const dir = dirname(abs)
  const after = before.replace(STATIC_IMPORT, (whole, head, path, tail) => {
    const target = resolve(dir, path)
    /* 없는 파일이면 그대로 둡니다 — 파일 맨 위 설명에 적어둔 사용법
       (`import { initFind } from './components/find.js'`)이 여기에 걸립니다. */
    if (!existsSync(target)) return whole
    stampModule(target)
    stamped++
    return `${head}${path}?v=${hashOf(target)}${tail}`
  })
  if (after !== before) {
    writeFileSync(abs, after)
    hashes.delete(abs)
  }
  done.add(abs)
}

const COMPONENTS = resolve(ROOT, 'components')
if (existsSync(COMPONENTS)) {
  for (const file of readdirSync(COMPONENTS).filter((f) => f.endsWith('.js'))) {
    stampModule(resolve(COMPONENTS, file))
  }
}
for (const file of readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  const abs = resolve(ROOT, file)
  const before = readFileSync(abs, 'utf8')
  const stamp = (path) => {
    const target = resolve(ROOT, path)
    if (!existsSync(target)) throw new Error(`${file} 가 없는 파일을 참조합니다: ${path}`)
    stamped++
    return hashOf(target)
  }
  const after = before
    .replace(LINK, (_, attr, path) => `${attr}="./${path}?v=${stamp(path)}"`)
    .replace(DYNAMIC_IMPORT, (_, path) => `import('./${path}?v=${stamp(path)}')`)
  if (after !== before) writeFileSync(abs, after)
}
console.log(`에셋 링크 ${stamped}개에 내용 해시를 붙였습니다`)
